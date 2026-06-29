from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    admin_id: int
    name: str
    email: EmailStr


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminOut


class RiskZoneCreate(BaseModel):
    zone_name: str
    latitude: float
    longitude: float
    radius: float = 300
    risk_level: str = "moderate"
    crime_score: float = 50
    night_risk_score: float = 50
    isolation_score: float = 50


class RiskZoneUpdate(BaseModel):
    zone_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius: Optional[float] = None
    risk_level: Optional[str] = None
    crime_score: Optional[float] = None
    night_risk_score: Optional[float] = None
    isolation_score: Optional[float] = None


class RiskZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    zone_id: int
    zone_name: str
    latitude: float
    longitude: float
    radius: float
    risk_level: str
    crime_score: float
    night_risk_score: float
    isolation_score: float


class SupportPointCreate(BaseModel):
    support_type: str
    support_name: str
    latitude: float
    longitude: float
    address: Optional[str] = None


class SupportPointOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    support_id: int
    support_type: str
    support_name: str
    latitude: float
    longitude: float
    address: Optional[str] = None
