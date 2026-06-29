from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Trip(Base):
    __tablename__ = "trips"

    trip_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    source_text = Column(String(255), nullable=False)
    destination_text = Column(String(255), nullable=False)
    source_lat = Column(Float, nullable=False)
    source_lng = Column(Float, nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lng = Column(Float, nullable=False)
    selected_route_id = Column(Integer, nullable=True)
    trip_status = Column(String(20), default="planned")  # planned, active, completed, alerted
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="trips")
    routes = relationship("TripRoute", back_populates="trip", cascade="all, delete-orphan")
    tracking_points = relationship("TripTrackingPoint", back_populates="trip", cascade="all, delete-orphan")
    events = relationship("TripEvent", back_populates="trip", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="trip", cascade="all, delete-orphan")


class TripRoute(Base):
    __tablename__ = "trip_routes"

    route_id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.trip_id"), nullable=False)
    route_name = Column(String(50), nullable=False)
    distance_km = Column(Float, nullable=False)
    eta_minutes = Column(Float, nullable=False)
    route_geometry = Column(Text, nullable=False)  # JSON-encoded list of [lat,lng]
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    is_selected = Column(Boolean, default=False)
    risk_breakdown = Column(Text, nullable=True)  # JSON

    trip = relationship("Trip", back_populates="routes")


class TripTrackingPoint(Base):
    __tablename__ = "trip_tracking_points"

    tracking_id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.trip_id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="tracking_points")


class TripEvent(Base):
    __tablename__ = "trip_events"

    event_id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.trip_id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # deviation, prolonged_stop, risk_zone_entry, safe_confirmed
    event_description = Column(Text, nullable=True)
    event_time = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="events")
