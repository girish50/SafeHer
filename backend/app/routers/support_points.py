from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.risk_zone import EmergencySupportPoint
from app.schemas.admin import SupportPointOut
from app.services.risk_engine import haversine_km

router = APIRouter(prefix="/api/support-points", tags=["Emergency Support Points"])


@router.get("", response_model=List[SupportPointOut])
def list_support_points(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius_km: float = Query(5.0),
    support_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(EmergencySupportPoint)
    if support_type:
        query = query.filter(EmergencySupportPoint.support_type == support_type)
    points = query.all()

    if lat is not None and lng is not None:
        points = [p for p in points if haversine_km(lat, lng, p.latitude, p.longitude) <= radius_km]

    return points
