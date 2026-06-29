"""
Route Risk Scoring Engine
--------------------------
Implements a weighted, rule-based risk scoring approach per the PRD section 11/12:

Route Risk Score = (RiskZoneScore * 0.35) + (NightTravelScore * 0.20)
                  + (IsolationScore * 0.20) + (SupportAvailabilityPenalty * 0.15)
                  + (ExposureDurationScore * 0.10)

This is a comparative, not absolute, safety estimate.
"""
import json
import math
from datetime import datetime
from typing import List, Tuple
from sqlalchemy.orm import Session

from app.models.risk_zone import RiskZone, EmergencySupportPoint

EARTH_RADIUS_M = 6371000


def haversine_m(lat1, lng1, lat2, lng2) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def haversine_km(lat1, lng1, lat2, lng2) -> float:
    return haversine_m(lat1, lng1, lat2, lng2) / 1000.0


def generate_candidate_routes(src_lat, src_lng, dst_lat, dst_lng) -> List[dict]:
    """
    Generates up to 3 candidate route geometries between source and destination.
    In a production system this would call Google Directions / OSRM / OpenRouteService.
    Here we synthesize 3 plausible polylines (direct, north-bias, south-bias) so the
    risk engine and UI have multiple real route options to compare, scoped for a
    self-contained demo/major-project environment without external routing API keys.
    """
    base_dist = haversine_km(src_lat, src_lng, dst_lat, dst_lng)
    routes = []

    def make_route(name, lateral_offset_ratio, extra_length_ratio):
        mid_lat = (src_lat + dst_lat) / 2
        mid_lng = (src_lng + dst_lng) / 2
        # perpendicular offset direction
        dlat = dst_lat - src_lat
        dlng = dst_lng - src_lng
        norm = math.sqrt(dlat ** 2 + dlng ** 2) or 0.0001
        perp_lat = -dlng / norm
        perp_lng = dlat / norm
        offset = norm * lateral_offset_ratio
        waypoint_lat = mid_lat + perp_lat * offset
        waypoint_lng = mid_lng + perp_lng * offset
        geometry = [
            [src_lat, src_lng],
            [waypoint_lat, waypoint_lng],
            [dst_lat, dst_lng],
        ]
        dist = base_dist * (1 + extra_length_ratio)
        eta = dist / 30.0 * 60  # assume 30km/h avg city speed -> minutes
        return {"route_name": name, "geometry": geometry, "distance_km": round(dist, 2), "eta_minutes": round(eta, 1)}

    routes.append(make_route("Route A - Direct", 0.0, 0.0))
    routes.append(make_route("Route B - Alternate North", 0.12, 0.18))
    routes.append(make_route("Route C - Alternate South", -0.12, 0.12))
    return routes


def score_route(
    db: Session,
    geometry: List[List[float]],
    distance_km: float,
    travel_hour: int,
) -> Tuple[float, str, dict]:
    risk_zones = db.query(RiskZone).all()
    support_points = db.query(EmergencySupportPoint).all()

    # sample points along route polyline (interpolate between waypoints)
    sample_points = []
    for i in range(len(geometry) - 1):
        lat1, lng1 = geometry[i]
        lat2, lng2 = geometry[i + 1]
        for t in [0, 0.25, 0.5, 0.75, 1.0]:
            sample_points.append((lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t))

    # 1. Risk zone overlap score (0-100)
    zone_hits = []
    for (plat, plng) in sample_points:
        for z in risk_zones:
            d = haversine_m(plat, plng, z.latitude, z.longitude)
            if d <= z.radius:
                zone_hits.append(z)
    if zone_hits:
        risk_zone_score = min(100, sum(z.crime_score for z in zone_hits) / len(zone_hits) + len(zone_hits) * 5)
    else:
        risk_zone_score = 5.0

    # 2. Night travel score (0-100)
    if travel_hour is None:
        travel_hour = datetime.now().hour
    if 22 <= travel_hour or travel_hour < 5:
        night_travel_score = 90
    elif 19 <= travel_hour < 22 or 5 <= travel_hour < 7:
        night_travel_score = 55
    else:
        night_travel_score = 15

    # 3. Isolation score (0-100) - based on isolation_score of nearby zones, else moderate default
    if zone_hits:
        isolation_score = sum(z.isolation_score for z in zone_hits) / len(zone_hits)
    else:
        # fewer support points nearby implies higher baseline isolation
        nearby_support = 0
        for (plat, plng) in sample_points:
            for s in support_points:
                if haversine_m(plat, plng, s.latitude, s.longitude) <= 800:
                    nearby_support += 1
        isolation_score = max(10, 60 - nearby_support * 5)

    # 4. Support availability penalty (0-100) - inverse of nearby support point density
    support_count = 0
    for (plat, plng) in sample_points:
        for s in support_points:
            if haversine_m(plat, plng, s.latitude, s.longitude) <= 1000:
                support_count += 1
    support_density = support_count / max(1, len(sample_points))
    support_availability_penalty = max(0, 100 - min(100, support_density * 40))

    # 5. Exposure duration score (0-100) - longer route => higher exposure
    exposure_duration_score = min(100, distance_km * 8)

    final_score = (
        risk_zone_score * 0.35
        + night_travel_score * 0.20
        + isolation_score * 0.20
        + support_availability_penalty * 0.15
        + exposure_duration_score * 0.10
    )
    final_score = round(min(100, max(0, final_score)), 1)

    if final_score <= 30:
        risk_level = "low"
    elif final_score <= 60:
        risk_level = "moderate"
    else:
        risk_level = "high"

    breakdown = {
        "risk_zone_score": round(risk_zone_score, 1),
        "night_travel_score": round(night_travel_score, 1),
        "isolation_score": round(isolation_score, 1),
        "support_availability_penalty": round(support_availability_penalty, 1),
        "exposure_duration_score": round(exposure_duration_score, 1),
        "zones_crossed": len(zone_hits),
        "support_points_nearby": support_count,
        "travel_hour_used": travel_hour,
    }
    return final_score, risk_level, breakdown


def score_all_routes(db: Session, candidate_routes: List[dict], travel_hour: int) -> List[dict]:
    scored = []
    for r in candidate_routes:
        score, level, breakdown = score_route(db, r["geometry"], r["distance_km"], travel_hour)
        scored.append({**r, "risk_score": score, "risk_level": level, "risk_breakdown": breakdown})
    # mark the lowest score as recommended/selected by default
    if scored:
        min_idx = min(range(len(scored)), key=lambda i: scored[i]["risk_score"])
        for i, s in enumerate(scored):
            s["is_selected"] = i == min_idx
    return scored


def distance_point_to_segment_m(plat, plng, lat1, lng1, lat2, lng2) -> float:
    """Approximate min distance (meters) from a point to a line segment using equirectangular projection."""
    def to_xy(lat, lng, ref_lat):
        x = math.radians(lng) * math.cos(math.radians(ref_lat)) * EARTH_RADIUS_M
        y = math.radians(lat) * EARTH_RADIUS_M
        return x, y

    ref_lat = lat1
    px, py = to_xy(plat, plng, ref_lat)
    x1, y1 = to_xy(lat1, lng1, ref_lat)
    x2, y2 = to_xy(lat2, lng2, ref_lat)

    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(px - x1, py - y1)
    t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
    t = max(0, min(1, t))
    closest_x, closest_y = x1 + t * dx, y1 + t * dy
    return math.hypot(px - closest_x, py - closest_y)


def min_distance_to_route_m(plat, plng, geometry: List[List[float]]) -> float:
    best = float("inf")
    for i in range(len(geometry) - 1):
        lat1, lng1 = geometry[i]
        lat2, lng2 = geometry[i + 1]
        d = distance_point_to_segment_m(plat, plng, lat1, lng1, lat2, lng2)
        best = min(best, d)
    return best
