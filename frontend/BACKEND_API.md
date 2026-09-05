# GigMat Society Dashboard — Backend API Contract
# All endpoints your friend needs to implement for full integration

Base URL: /api

## Authentication
POST   /society/auth/login         → { societyId, password }   → { token, society }
POST   /society/auth/logout
GET    /society/auth/me            → Society info

## Workers & KYC
GET    /society/workers            → List (query: status, category, search)
GET    /society/workers/:id
POST   /society/workers/register   → { name, phone, aadhaar, category, skills, certId, city }
POST   /society/workers/verify-aadhaar → { aadhaar } → { verified: bool }
POST   /society/workers/verify-certificate → { certId, category } → { status: 'gov_certified'|'inspection_required' }
POST   /society/workers/:id/inspection → { score, remarks }
PATCH  /society/workers/:id/activate
PATCH  /society/workers/:id/deactivate
PATCH  /society/workers/:id/availability → { availability }
GET    /society/workers/nearby     → query: lat, lng, category

## Bookings & Dispatch
GET    /society/bookings           → List (query: status, type, category)
GET    /society/bookings/:id
GET    /society/bookings/incoming
POST   /society/bookings/:id/assign → { workerId }
POST   /society/bookings/:id/assign-bulk → { workerIds[], leadId }
PATCH  /society/bookings/:id/status → { status }

## Payments
GET    /society/payments           → List
GET    /society/payments/:id
POST   /society/payments/cash      → { bookingId, amount, workerId }
POST   /society/payments/:id/split
PATCH  /society/payments/:id/confirm-split
GET    /society/payments/reconciliation → query: period (day|week|month)
GET    /society/payments/summary

## Rate Cards
GET    /society/rates
PUT    /society/rates/:category    → { baseRate, hourlyRate, dailyRate }
PATCH  /society/rates/emergency    → { enabled: bool }
PATCH  /society/rates/night-surcharge → { enabled: bool }

## Welfare
GET    /society/welfare/enrollments
POST   /society/welfare/enroll     → { workerId, schemeId }
GET    /society/welfare/advances
POST   /society/welfare/advance    → { workerId, amount, reason }
PATCH  /society/welfare/advance/:id/approve
PATCH  /society/welfare/advance/:id/reject

## Complaints
GET    /society/complaints
GET    /society/complaints/:id
POST   /society/complaints/:id/respond → { response }
PATCH  /society/complaints/:id/resolve → { resolution }
POST   /society/complaints/:id/escalate → { reason }

## Dashboard
GET    /society/dashboard/summary
GET    /society/dashboard/earnings-chart → query: period

## Worker Categories (all 10)
electrician | plumber | carpenter | painter | domestic_helper
caregiver   | driver  | gardener  | cleaner | technician

## Auth Header
All authenticated routes require:
Authorization: Bearer <token>
