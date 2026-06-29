from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class RoutePlanRequest(BaseModel):
    source_text: str
    destination_text: str
    source_lat: float
    source_lng: float
    dest_lat: float
    dest_lng: float
    travel_hour: Optional[int] = None  # 0-23, defaults to current server hour


class RouteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    route_id: int
    route_name: str
    distance_km: float
    eta_minutes: float
    route_geometry: str
    risk_score: float
    risk_level: str
    is_selected: bool
    risk_breakdown: Optional[str] = None


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    trip_id: int
    source_text: str
    destination_text: str
    source_lat: float
    source_lng: float
    dest_lat: float
    dest_lng: float
    selected_route_id: Optional[int] = None
    trip_status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    routes: List[RouteOut] = []


class StartTripRequest(BaseModel):
    route_id: int


class TrackingPointIn(BaseModel):
    latitude: float
    longitude: float


class TripEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    event_id: int
    event_type: str
    event_description: Optional[str] = None
    event_time: datetime


class SafetyCheckResponse(BaseModel):
    is_safe: bool
