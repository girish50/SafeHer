from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.trip_id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    alert_type = Column(String(30), nullable=False)  # manual_sos, auto_deviation, auto_prolonged_stop, auto_no_response
    alert_status = Column(String(20), default="active")  # active, resolved, cancelled
    alert_message = Column(Text, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="alerts")
    trip = relationship("Trip", back_populates="alerts")
    recipients = relationship("AlertRecipient", back_populates="alert", cascade="all, delete-orphan")


class AlertRecipient(Base):
    __tablename__ = "alert_recipients"

    recipient_id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.alert_id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("trusted_contacts.contact_id"), nullable=False)
    delivery_status = Column(String(20), default="sent")  # sent, failed, pending
    delivered_at = Column(DateTime(timezone=True), server_default=func.now())

    alert = relationship("Alert", back_populates="recipients")
