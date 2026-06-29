from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class SOSRequest(BaseModel):
    latitude: float
    longitude: float
    trip_id: Optional[int] = None
    message: Optional[str] = None


class AlertRecipientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    recipient_id: int
    contact_id: int
    delivery_status: str
    delivered_at: datetime


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    alert_id: int
    trip_id: Optional[int] = None
    alert_type: str
    alert_status: str
    alert_message: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    triggered_at: datetime
    resolved_at: Optional[datetime] = None
    recipients: List[AlertRecipientOut] = []
