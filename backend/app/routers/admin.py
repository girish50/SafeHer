from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.admin import Admin
from app.models.risk_zone import RiskZone, EmergencySupportPoint
from app.models.alert import Alert
from app.schemas.admin import (
    AdminLogin, AdminToken, AdminOut,
    RiskZoneCreate, RiskZoneUpdate, RiskZoneOut,
    SupportPointCreate, SupportPointOut,
)
from app.schemas.alert import AlertOut
from app.core.security import hash_password, verify_password, create_access_token, get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.post("/login", response_model=AdminToken)
def admin_login(payload: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == payload.email).first()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    token = create_access_token({"sub": str(admin.admin_id), "type": "admin"})
    return AdminToken(access_token=token, admin=AdminOut.model_validate(admin))


@router.get("/me", response_model=AdminOut)
def admin_me(current_admin: Admin = Depends(get_current_admin)):
    return current_admin


# ---- Risk Zones ----

@router.get("/risk-zones", response_model=List[RiskZoneOut])
def list_risk_zones(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    return db.query(RiskZone).all()


@router.post("/risk-zones", response_model=RiskZoneOut, status_code=201)
def create_risk_zone(payload: RiskZoneCreate, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    zone = RiskZone(**payload.model_dump())
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.put("/risk-zones/{zone_id}", response_model=RiskZoneOut)
def update_risk_zone(zone_id: int, payload: RiskZoneUpdate, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    zone = db.query(RiskZone).filter(RiskZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Risk zone not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(zone, field, value)
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/risk-zones/{zone_id}", status_code=204)
def delete_risk_zone(zone_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    zone = db.query(RiskZone).filter(RiskZone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Risk zone not found")
    db.delete(zone)
    db.commit()
    return None


# ---- Support Points ----

@router.get("/support-points", response_model=List[SupportPointOut])
def admin_list_support_points(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    return db.query(EmergencySupportPoint).all()


@router.post("/support-points", response_model=SupportPointOut, status_code=201)
def create_support_point(payload: SupportPointCreate, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    point = EmergencySupportPoint(**payload.model_dump())
    db.add(point)
    db.commit()
    db.refresh(point)
    return point


@router.delete("/support-points/{support_id}", status_code=204)
def delete_support_point(support_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    point = db.query(EmergencySupportPoint).filter(EmergencySupportPoint.support_id == support_id).first()
    if not point:
        raise HTTPException(status_code=404, detail="Support point not found")
    db.delete(point)
    db.commit()
    return None


# ---- Alerts / Analytics ----

@router.get("/alerts", response_model=List[AlertOut])
def admin_list_alerts(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    return db.query(Alert).order_by(Alert.triggered_at.desc()).all()


@router.get("/analytics/summary")
def analytics_summary(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    from app.models.trip import Trip, TripRoute
    from app.models.user import User

    total_users = db.query(User).count()
    total_trips = db.query(Trip).count()
    total_alerts = db.query(Alert).count()
    active_alerts = db.query(Alert).filter(Alert.alert_status == "active").count()
    high_risk_routes = db.query(TripRoute).filter(TripRoute.risk_level == "high").count()
    moderate_risk_routes = db.query(TripRoute).filter(TripRoute.risk_level == "moderate").count()
    low_risk_routes = db.query(TripRoute).filter(TripRoute.risk_level == "low").count()
    return {
        "total_users": total_users,
        "total_trips": total_trips,
        "total_alerts": total_alerts,
        "active_alerts": active_alerts,
        "route_risk_distribution": {
            "high": high_risk_routes,
            "moderate": moderate_risk_routes,
            "low": low_risk_routes,
        },
    }
