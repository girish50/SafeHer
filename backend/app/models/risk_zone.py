from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class RiskZone(Base):
    __tablename__ = "risk_zones"

    zone_id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius = Column(Float, default=300)  # meters
    risk_level = Column(String(20), default="moderate")  # low, moderate, high
    crime_score = Column(Float, default=50)  # 0-100
    night_risk_score = Column(Float, default=50)  # 0-100
    isolation_score = Column(Float, default=50)  # 0-100


class EmergencySupportPoint(Base):
    __tablename__ = "emergency_support_points"

    support_id = Column(Integer, primary_key=True, index=True)
    support_type = Column(String(30), nullable=False)  # police, hospital, pharmacy, public
    support_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(255), nullable=True)
