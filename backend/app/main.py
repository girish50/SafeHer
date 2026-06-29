from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, contacts, trips, alerts, admin, support_points

# Import all models so they're registered with Base before create_all
from app.models import user, admin as admin_model, trusted_contact, trip, alert, risk_zone  # noqa

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Women Safety Route and Emergency Alert Platform API",
    description="Safety-assist platform: safer route recommendation, live trip monitoring, and emergency alerts.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(contacts.router)
app.include_router(trips.router)
app.include_router(alerts.router)
app.include_router(support_points.router)
app.include_router(admin.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "safeher-api"}


@app.get("/")
def root():
    return {"message": "Women Safety Route and Emergency Alert Platform API. See /docs for API documentation."}
