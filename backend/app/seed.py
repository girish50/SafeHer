"""
Seed script: creates a demo admin account and a small set of demo risk zones /
emergency support points so the route risk engine has data to score against.

Run with: python -m app.seed
"""
from app.database import SessionLocal, Base, engine
from app.models.admin import Admin
from app.models.risk_zone import RiskZone, EmergencySupportPoint
from app.core.security import hash_password
from app.models import user, trusted_contact, trip, alert  # noqa - register tables

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        if not db.query(Admin).filter(Admin.email == "admin@safeher.demo").first():
            db.add(Admin(
                name="Platform Admin",
                email="admin@safeher.demo",
                password_hash=hash_password("Admin@12345"),
            ))
            print("Created demo admin: admin@safeher.demo / Admin@12345")

        if db.query(RiskZone).count() == 0:
            # Demo zones around a generic city center (Hyderabad-ish coords) - adjust as needed
            demo_zones = [
                RiskZone(zone_name="Isolated Industrial Stretch", latitude=17.4100, longitude=78.4500,
                         radius=400, risk_level="high", crime_score=75, night_risk_score=85, isolation_score=80),
                RiskZone(zone_name="Poorly Lit Underpass", latitude=17.4250, longitude=78.4600,
                         radius=250, risk_level="high", crime_score=68, night_risk_score=90, isolation_score=70),
                RiskZone(zone_name="Quiet Residential Backstreet", latitude=17.4400, longitude=78.4750,
                         radius=300, risk_level="moderate", crime_score=45, night_risk_score=55, isolation_score=60),
                RiskZone(zone_name="Construction Zone - Low Footfall", latitude=17.4050, longitude=78.4850,
                         radius=350, risk_level="moderate", crime_score=40, night_risk_score=50, isolation_score=65),
            ]
            db.add_all(demo_zones)
            print("Seeded demo risk zones")

        if db.query(EmergencySupportPoint).count() == 0:
            demo_support = [
                EmergencySupportPoint(support_type="police", support_name="Central Police Station",
                                       latitude=17.4150, longitude=78.4480, address="Main Road, City Center"),
                EmergencySupportPoint(support_type="hospital", support_name="City General Hospital",
                                       latitude=17.4300, longitude=78.4650, address="Hospital Road"),
                EmergencySupportPoint(support_type="pharmacy", support_name="24x7 MedPlus Pharmacy",
                                       latitude=17.4220, longitude=78.4550, address="Market Street"),
                EmergencySupportPoint(support_type="police", support_name="North Zone Police Outpost",
                                       latitude=17.4420, longitude=78.4700, address="North Avenue"),
                EmergencySupportPoint(support_type="public", support_name="Metro Station - 24hr Security",
                                       latitude=17.4180, longitude=78.4620, address="Metro Complex"),
            ]
            db.add_all(demo_support)
            print("Seeded demo emergency support points")

        db.commit()
        print("Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
