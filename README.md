# GigMat Society Platform — Setup Guide

## Tech Stack
- **Frontend**: React 18 + Vite + Recharts + Lucide
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL

---

## Prerequisites
- Node.js v18+
- PostgreSQL 14+ installed and running

---

## 1. Database Setup

### Create the database
```bash
psql -U postgres
CREATE DATABASE gigmat_society;
\q
```

### Run schema + seed
```bash
cd backend
# Update .env with your DB password first!
npm run db:migrate
npm run db:seed
```

---

## 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set DB_PASSWORD to your PostgreSQL password
npm install
npm run dev      # Starts on http://localhost:5000
```

Test it: http://localhost:5000/health

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
| Society ID | SOC-TN-CHE-01   |
| Password   | society123      |

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
└── backend/            # Express.js API
    ├── controllers/    # Business logic
    ├── routes/         # Express routers
    ├── middleware/     # auth.js, errorHandler.js
    ├── config/         # db.js (pg pool)
    ├── db/             # schema.sql, seed.sql
    └── server.js       # Entry point (port 5000)
```

---

## API Base URL
`http://localhost:5000/api/society/`

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
