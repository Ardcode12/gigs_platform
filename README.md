# GigMat Society Platform — Setup Guide

## Tech Stack
- **Frontend**: React 18 + Vite + Recharts + Lucide
- **Backend**: FastAPI + Uvicorn
- **Database**: PostgreSQL / Supabase

---

## Prerequisites
- Python 3.12+
- PostgreSQL 14+ installed and running

---

## 1. Database Setup

### Create the database
```bash
psql -U postgres
CREATE DATABASE gigmat_society;
\q
```

### Run migrations + seed
```bash
cd backend
./venv/bin/alembic upgrade head
./venv/bin/python seed.py
```

---

## 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with the Supabase DATABASE_URL
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Test it: http://localhost:8001/health

---

## 3. Frontend Setup

```bash
cd frontend
# .env is already configured for backend
npm install
npm run dev      # Starts on http://localhost:5173
```

---

## 4. Login Credentials

| Field      | Value           |
|------------|-----------------|
| Society code | SOC-TEST-1   |
| Password     | pass         |

---

## Project Structure

```
gigs_platform/
├── frontend/           # React + Vite app
│   ├── src/
│   │   ├── pages/      # 7 dashboard pages
│   │   ├── context/    # SocietyContext (state)
│   │   ├── services/   # API calls (axios)
│   │   └── data/       # Mock data (fallback)
│   └── .env            # VITE_USE_BACKEND=true
│
└── backend/            # FastAPI API
    ├── app/             # Routers, models, schemas and services
    ├── alembic/         # Database migrations
    ├── seed.py          # Development data
    └── app/main.py      # Entry point (port 8001)
```

---

## API Base URL
`http://localhost:8001/api/society/`

## Society Dashboard Modules
1. **Workers & KYC** — 2-tier verification (Gov cert → Physical inspection)
2. **Bookings & Dispatch** — Single + Bulk team assignment by GPS proximity
3. **Payments** — Cash reconciliation + Bulk split payout
4. **Rate Cards** — All 10 skill category rates + surcharges
5. **Worker Welfare** — PM-SYM, insurance enrollment + micro-advances
6. **Complaints** — Local resolve + Federation escalation

## Worker Categories (All 10)
⚡ Electrician | 🔧 Plumber | 🪚 Carpenter | 🎨 Painter | 🏠 Domestic Helper
❤️ Caregiver | 🚗 Driver | 🌿 Gardener | 🧹 Cleaner | 🔬 Technician
