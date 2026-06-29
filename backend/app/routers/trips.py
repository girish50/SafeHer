import json
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.trip import Trip, TripRoute, TripTrackingPoint, TripEvent
from app.models.trusted_contact import TrustedContact
from app.models.alert import Alert, AlertRecipient
from app.schemas.trip import (
    RoutePlanRequest, TripOut, StartTripRequest, TrackingPointIn, TripEventOut, SafetyCheckResponse
)
from app.core.security import get_current_user
from app.services.risk_engine import generate_candidate_routes, score_all_routes, min_distance_to_route_m, haversine_m
from app.services.alert_service import build_emergency_message, deliver_to_contact

router = APIRouter(prefix="/api/trips", tags=["Trip Planning & Monitoring"])

DEVIATION_THRESHOLD_M = 250          # beyond this distance from route path => deviation
PROLONGED_STOP_MINUTES = 8           # stationary longer than this => prolonged stop
PROLONGED_STOP_RADIUS_M = 60         # movement within this radius counts as "stopped"


@router.post("/plan", response_model=TripOut, status_code=201)
def plan_trip(payload: RoutePlanRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = Trip(
        user_id=current_user.user_id,
        source_text=payload.source_text,
        destination_text=payload.destination_text,
        source_lat=payload.source_lat,
        source_lng=payload.source_lng,
        dest_lat=payload.dest_lat,
        dest_lng=payload.dest_lng,
        trip_status="planned",
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)

    candidates = generate_candidate_routes(payload.source_lat, payload.source_lng, payload.dest_lat, payload.dest_lng)
    scored = score_all_routes(db, candidates, payload.travel_hour)

    for s in scored:
        route = TripRoute(
            trip_id=trip.trip_id,
            route_name=s["route_name"],
            distance_km=s["distance_km"],
            eta_minutes=s["eta_minutes"],
            route_geometry=json.dumps(s["geometry"]),
            risk_score=s["risk_score"],
            risk_level=s["risk_level"],
            is_selected=s["is_selected"],
            risk_breakdown=json.dumps(s["risk_breakdown"]),
        )
        db.add(route)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("", response_model=List[TripOut])
def list_trips(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Trip)
        .filter(Trip.user_id == current_user.user_id)
        .order_by(Trip.created_at.desc())
        .all()
    )


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id, Trip.user_id == current_user.user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("/{trip_id}/start", response_model=TripOut)
def start_trip(trip_id: int, payload: StartTripRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id, Trip.user_id == current_user.user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    route = db.query(TripRoute).filter(TripRoute.route_id == payload.route_id, TripRoute.trip_id == trip_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    for r in trip.routes:
        r.is_selected = (r.route_id == route.route_id)
    trip.selected_route_id = route.route_id
    trip.trip_status = "active"
    trip.started_at = datetime.utcnow()
    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/end", response_model=TripOut)
def end_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id, Trip.user_id == current_user.user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip.trip_status = "completed"
    trip.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(trip)
    return trip


def _trigger_auto_alert(db: Session, trip: Trip, user: User, alert_type: str, lat: float, lng: float, description: str):
    message = build_emergency_message(user.full_name, user.emergency_message_template, lat, lng, trip)
    alert = Alert(
        trip_id=trip.trip_id,
        user_id=user.user_id,
        alert_type=alert_type,
        alert_status="active",
        alert_message=message,
        latitude=lat,
        longitude=lng,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    contacts = db.query(TrustedContact).filter(TrustedContact.user_id == user.user_id).all()
    for c in contacts:
        status = deliver_to_contact(c, message, user.full_name)
        db.add(AlertRecipient(alert_id=alert.alert_id, contact_id=c.contact_id, delivery_status=status))

    trip.trip_status = "alerted"
    db.add(TripEvent(trip_id=trip.trip_id, event_type=alert_type, event_description=description))
    db.commit()
    return alert


@router.post("/{trip_id}/track")
def add_tracking_point(trip_id: int, payload: TrackingPointIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id, Trip.user_id == current_user.user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.trip_status != "active":
        raise HTTPException(status_code=400, detail="Trip is not active")

    point = TripTrackingPoint(trip_id=trip_id, latitude=payload.latitude, longitude=payload.longitude)
    db.add(point)
    db.commit()
    db.refresh(point)

    response = {"tracking_id": point.tracking_id, "deviation_detected": False, "prolonged_stop_detected": False, "events": []}

    selected_route = next((r for r in trip.routes if r.route_id == trip.selected_route_id), None)
    if selected_route:
        geometry = json.loads(selected_route.route_geometry)
        dist_m = min_distance_to_route_m(payload.latitude, payload.longitude, geometry)
        if dist_m > DEVIATION_THRESHOLD_M:
            recent_deviation_event = (
                db.query(TripEvent)
                .filter(TripEvent.trip_id == trip_id, TripEvent.event_type == "deviation")
                .order_by(TripEvent.event_time.desc())
                .first()
            )
            already_flagged_recently = (
                recent_deviation_event
                and (datetime.utcnow() - recent_deviation_event.event_time.replace(tzinfo=None)) < timedelta(minutes=5)
            )
            if not already_flagged_recently:
                event = TripEvent(
                    trip_id=trip_id,
                    event_type="deviation",
                    event_description=f"User is {int(dist_m)}m away from the planned route.",
                )
                db.add(event)
                db.commit()
                response["deviation_detected"] = True
                response["events"].append("deviation")

    # Prolonged stop detection: look at points in the last PROLONGED_STOP_MINUTES
    recent_points = (
        db.query(TripTrackingPoint)
        .filter(TripTrackingPoint.trip_id == trip_id)
        .order_by(TripTrackingPoint.timestamp.desc())
        .limit(20)
        .all()
    )
    if len(recent_points) >= 2:
        newest = recent_points[0]
        oldest_within_window = None
        for p in recent_points:
            if (newest.timestamp.replace(tzinfo=None) - p.timestamp.replace(tzinfo=None)) <= timedelta(minutes=PROLONGED_STOP_MINUTES):
                oldest_within_window = p
        if oldest_within_window and oldest_within_window.tracking_id != newest.tracking_id:
            span_minutes = (newest.timestamp.replace(tzinfo=None) - oldest_within_window.timestamp.replace(tzinfo=None)).total_seconds() / 60
            moved_m = haversine_m(newest.latitude, newest.longitude, oldest_within_window.latitude, oldest_within_window.longitude)
            if span_minutes >= PROLONGED_STOP_MINUTES and moved_m <= PROLONGED_STOP_RADIUS_M:
                recent_stop_event = (
                    db.query(TripEvent)
                    .filter(TripEvent.trip_id == trip_id, TripEvent.event_type == "prolonged_stop")
                    .order_by(TripEvent.event_time.desc())
                    .first()
                )
                already_flagged = (
                    recent_stop_event
                    and (datetime.utcnow() - recent_stop_event.event_time.replace(tzinfo=None)) < timedelta(minutes=PROLONGED_STOP_MINUTES)
                )
                if not already_flagged:
                    event = TripEvent(
                        trip_id=trip_id,
                        event_type="prolonged_stop",
                        event_description=f"User has been stationary for over {PROLONGED_STOP_MINUTES} minutes.",
                    )
                    db.add(event)
                    db.commit()
                    response["prolonged_stop_detected"] = True
                    response["events"].append("prolonged_stop")

    return response


@router.post("/{trip_id}/safety-check", response_model=dict)
def safety_check_response(trip_id: int, payload: SafetyCheckResponse, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id, Trip.user_id == current_user.user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if payload.is_safe:
        db.add(TripEvent(trip_id=trip_id, event_type="safe_confirmed", event_description="User confirmed they are safe."))
        db.commit()
        return {"status": "acknowledged_safe"}
    else:
        last_point = (
            db.query(TripTrackingPoint)
            .filter(TripTrackingPoint.trip_id == trip_id)
            .order_by(TripTrackingPoint.timestamp.desc())
            .first()
        )
        lat = last_point.latitude if last_point else trip.source_lat
        lng = last_point.longitude if last_point else trip.source_lng
        alert = _trigger_auto_alert(db, trip, current_user, "auto_no_response", lat, lng, "User indicated they are not safe / did not respond in time.")
        return {"status": "alert_triggered", "alert_id": alert.alert_id}


@router.get("/{trip_id}/events", response_model=List[TripEventOut])
def get_trip_events(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.trip_id == trip_id, Trip.user_id == current_user.user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return db.query(TripEvent).filter(TripEvent.trip_id == trip_id).order_by(TripEvent.event_time.desc()).all()
