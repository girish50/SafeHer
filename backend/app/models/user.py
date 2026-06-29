from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=False)
    password_hash = Column(String(255), nullable=False)
    home_location = Column(String(255), nullable=True)
    emergency_message_template = Column(
        Text, default="I may be in danger. Please check on me immediately. My live location is attached."
    )
    preferred_alert_mode = Column(String(20), default="sms_email")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trusted_contacts = relationship("TrustedContact", back_populates="user", cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
