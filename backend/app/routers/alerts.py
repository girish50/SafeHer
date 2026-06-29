from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.trip import Trip
from app.models.trusted_contact import TrustedContact
from app.models.alert import Alert, AlertRecipient
from app.schemas.alert import SOSRequest, AlertOut
from app.core.security import get_current_user
from app.services.alert_service import build_emergency_message, deliver_to_contact

router = APIRouter(prefix="/api/alerts", tags=["SOS & Alerts"])


@router.post("/sos", response_model=AlertOut, status_code=201)
def trigger_sos(payload: SOSRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = None
    if payload.trip_id:
        trip = db.query(Trip).filter(Trip.trip_id == payload.trip_id, Trip.user_id == current_user.user_id).first()

    message = build_emergency_message(
        current_user.full_name,
        payload.message or current_user.emergency_message_template,
        payload.latitude,
        payload.longitude,
        trip,
    )
    alert = Alert(
        trip_id=trip.trip_id if trip else None,
        user_id=current_user.user_id,
        alert_type="manual_sos",
        alert_status="active",
        alert_message=message,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    contacts = db.query(TrustedContact).filter(TrustedContact.user_id == current_user.user_id).all()
    if not contacts:
        raise HTTPException(status_code=400, detail="No trusted contacts configured. Add at least one trusted contact before using SOS.")

    for c in contacts:
        status = deliver_to_contact(c, message, current_user.full_name)
        db.add(AlertRecipient(alert_id=alert.alert_id, contact_id=c.contact_id, delivery_status=status))

    if trip:
        trip.trip_status = "alerted"
    db.commit()
    db.refresh(alert)
    return alert


@router.get("", response_model=List[AlertOut])
def list_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Alert)
        .filter(Alert.user_id == current_user.user_id)
        .order_by(Alert.triggered_at.desc())
        .all()
    )


@router.get("/{alert_id}", response_model=AlertOut)
def get_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id, Alert.user_id == current_user.user_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id, Alert.user_id == current_user.user_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.alert_status = "resolved"
    alert.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert
