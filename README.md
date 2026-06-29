# SafeHer — Women Safety Route & Emergency Alert Platform

A full-stack + AI/logic major project combining **safer route recommendation**, **live trip monitoring**, and **emergency alert workflows** into a single safety-assist platform.

---

## Quick Start (Docker — recommended)

### Prerequisites

- Docker ≥ 24 and Docker Compose ≥ 2

```bash
git clone <this-repo>
cd safeher
docker compose up --build
```

| Service  | URL                        |
| -------- | -------------------------- |
| Web app  | http://localhost           |
| API docs | http://localhost:8000/docs |
| API      | http://localhost:8000/api/ |

### Demo credentials

| Role  | Email                 | Password    |
| ----- | --------------------- | ----------- |
| Admin | admin@safeher.demo    | Admin@12345 |
| User  | register at /register | your choice |

---

## Manual / Local Development

### Backend (FastAPI + PostgreSQL)

```bash
cd backend

# 1. Create a virtual environment
python -m venv venv && venv\Scripts\activate
pip install --upgrade psycopg2-binary
# 2. Install dependencies
pip install -r requirements.txt

# 3. Set environment variables
export DATABASE_URL="postgresql://safeher:safeher_pass@localhost:5432/safeher_db"
export SECRET_KEY="your-secret-key"

# 4. Run PostgreSQL (or use Docker just for the DB)
docker run -d --name safeher-db \
  -e POSTGRES_USER=safeher \
  -e POSTGRES_PASSWORD=safeher_pass \
  -e POSTGRES_DB=safeher_db \
  -p 5432:5432 postgres:16-alpine

# 5. Seed the database (demo admin + risk zones + support points)
python -m app.seed

# 6. Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
# For local dev (backend on port 8000):
VITE_API_URL=http://localhost:8000 
npm run dev
# Open http://localhost:5173
```

---

## Project Architecture

```
safeher/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── database.py          # SQLAlchemy engine / session
│   │   ├── seed.py              # Demo data seeder
│   │   ├── core/
│   │   │   └── security.py      # JWT auth, password hashing
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── admin.py
│   │   │   ├── trusted_contact.py
│   │   │   ├── trip.py          # Trip, TripRoute, TrackingPoints, Events
│   │   │   ├── alert.py         # Alert, AlertRecipient
│   │   │   └── risk_zone.py     # RiskZone, EmergencySupportPoint
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # FastAPI route handlers
│   │   │   ├── auth.py
│   │   │   ├── contacts.py
│   │   │   ├── trips.py         # Route planning + trip monitoring
│   │   │   ├── alerts.py        # SOS + alert history
│   │   │   ├── support_points.py
│   │   │   └── admin.py         # Admin CRUD + analytics
│   │   └── services/
│   │       ├── risk_engine.py   # ★ Route risk scoring engine (AI/logic core)
│   │       └── alert_service.py # Emergency alert delivery
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/               # All user + admin pages
│   │   ├── components/          # Layout, RiskBadge, RiskDial
│   │   ├── context/             # Auth + Toast context providers
│   │   └── api/client.js        # Axios instances
│   ├── nginx.conf               # SPA + API proxy config
│   └── Dockerfile
└── docker-compose.yml
```

---

## Key Features

### User-facing

| Feature                    | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| Route planning             | Enter source + destination via map click               |
| Risk scoring               | Each route scored 0–100 using weighted safety factors |
| Safer route recommendation | Lowest-risk route highlighted automatically            |
| Live trip monitoring       | Simulated GPS movement along selected route            |
| Route deviation detection  | Alert triggered if user moves >250m off route          |
| Prolonged stop detection   | Alert if stationary >8 min during active trip          |
| Safety check prompt        | 15-second countdown → auto-alert if no response       |
| SOS button                 | Floating pulsing button sends alert instantly          |
| Trusted contacts           | Add/edit/delete emergency contacts                     |
| Alert history              | Full log of all SOS + auto alerts                      |
| Trip history               | Past trips with route risk scores                      |
| Nearby support             | Police, hospitals, pharmacies on map                   |

### Admin-facing

| Feature            | Description                                        |
| ------------------ | -------------------------------------------------- |
| Dashboard          | Users, trips, alerts, risk distribution KPIs       |
| Risk zone CRUD     | Add/edit/delete geographic risk zones with scoring |
| Support point CRUD | Manage emergency help locations                    |
| Alert log          | All system alerts with status and location         |

---

## Route Risk Scoring Engine

Location: `backend/app/services/risk_engine.py`

```
Route Risk Score = (Risk Zone Score   × 0.35)
                 + (Night Travel Score × 0.20)
                 + (Isolation Score    × 0.20)
                 + (Support Penalty    × 0.15)
                 + (Exposure Duration  × 0.10)
```

| Score range | Label     |
| ----------- | --------- |
| 0–30       | Low risk  |
| 31–60      | Moderate  |
| 61–100     | High risk |

---

## Technology Stack

| Layer     | Technology                           |
| --------- | ------------------------------------ |
| Frontend  | React 18, React Router, Leaflet maps |
| Styling   | Custom CSS (design tokens)           |
| Backend   | FastAPI (Python 3.11)                |
| Database  | PostgreSQL 16                        |
| ORM       | SQLAlchemy 2                         |
| Auth      | JWT (python-jose) + bcrypt           |
| Maps      | OpenStreetMap + Leaflet              |
| Container | Docker + Nginx                       |

---

## Limitations (by design)

- Does not detect crime directly or guarantee safety
- Alert delivery (SMS/email) is simulated — plug in Twilio/SendGrid in `alert_service.py`
- GPS tracking uses a simulated path in the demo; on a real mobile device, use the Geolocation API
- Route geometry is synthesised (3 candidate paths); in production, call OSRM / OpenRouteService / Google Directions

---

## Future Enhancements

1. Voice-activated SOS
2. Shake-phone trigger
3. Community unsafe-location reporting
4. Real SMS/email delivery (Twilio/SendGrid)
5. Background mobile GPS tracking (React Native / Flutter)
6. OSRM/Google Directions API for real road-following polylines
7. ML-based route risk model trained on historical incident data

