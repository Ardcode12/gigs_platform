# Governing Authority Dashboard

Authority-side portal for the **AI-Enabled Cooperative Digital Service Marketplace**.

The authority is the governance layer: it approves cooperative societies, verifies the
workers and certifications those societies submit, and monitors compliance, quality,
welfare and complaints. Societies onboard and manage their own workforce — the authority
does not create worker records.

**Current scope: authentication.** The governance modules follow in later phases.

---

## Stack

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Frontend | React 18, Vite, React Router, Axios           |
| Backend  | Node.js, Express                              |
| Database | PostgreSQL via Supabase                       |
| Auth     | Supabase Auth (`@supabase/supabase-js`)       |

---

## Layout

```
backend/
  db/
    migrations/001_authority_auth.sql   schema: authority_users, login_history
    seed/seedAuthorityUser.js           provisions an officer account
    migrate.js                          applies migrations (needs DATABASE_URL)
  src/
    config/      env validation, Supabase clients
    middleware/  auth guard, validation, rate limits, error handler
    services/    login/lockout logic, login history
    controllers/ request handling
    routes/      route wiring
    validators/  Zod schemas
frontend/
  src/
    api/         axios client with token refresh, auth endpoints
    components/  Field, Button, Alert, AuthLayout, route guards, icons
    context/     AuthContext -- session state and idle timeout
    pages/       Login, ForgotPassword, ResetPassword, Dashboard
    styles/      design tokens and module styles
```

The `mobilefrontend/` and `mobilebackend/` folders belong to the customer/worker app and
are not touched by this work.

---

## Setup

### 1. Database

Apply `backend/db/migrations/001_authority_auth.sql` to your Supabase project — either
through the dashboard SQL editor, or:

```bash
cd backend
node db/migrate.js        # requires DATABASE_URL in .env
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # fill in your Supabase URL and keys
npm install
npm run seed              # creates the first authority account
npm run dev               # http://localhost:5000
```

`npm run seed` accepts overrides:

```bash
npm run seed -- --email officer@dept.gov.in --password 'Str0ngPass!' \
                --name "R. Menon" --employee-id AUTH-002
```

Re-running it for an existing email resets that account's password, so it doubles as a
recovery hatch.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Vite proxies `/api` to the backend, so both run on one origin in development.

---

## API

| Method | Endpoint                    | Auth | Purpose                              |
| ------ | --------------------------- | ---- | ------------------------------------ |
| GET    | `/api/health`               | –    | Service check                        |
| POST   | `/api/auth/login`           | –    | Sign in; returns access + refresh     |
| POST   | `/api/auth/refresh`         | –    | Exchange a refresh token             |
| POST   | `/api/auth/forgot-password` | –    | Send a reset link                    |
| POST   | `/api/auth/reset-password`  | –    | Complete a reset                     |
| GET    | `/api/auth/me`              | ✓    | Current officer profile              |
| GET    | `/api/auth/login-history`   | ✓    | Recent authentication events         |
| POST   | `/api/auth/logout`          | ✓    | Revoke the session                   |
| POST   | `/api/auth/change-password` | ✓    | Change password (needs the current)  |

---

## Security

Implements the login requirements from the specification (§2):

- **Account lockout** — 5 failed attempts locks the account for 15 minutes. Checked
  *before* the password, so a locked account cannot be probed.
- **Per-IP rate limiting** — 10 sign-in attempts per 15 minutes, independent of the
  per-account lock. Together they cover both one account under attack and one IP
  spraying many accounts.
- **No account enumeration** — unknown emails and wrong passwords return the same
  message; `forgot-password` responds identically either way.
- **Login history** — every sign-in, failure, sign-out and password action is recorded
  with IP and user agent.
- **Session timeout** — 30 minutes idle signs the officer out (configurable).
- **Status enforced per request** — suspending an officer takes effect on their next
  request, not when their token happens to expire.
- **Row Level Security** — enabled on both tables so a leaked publishable key cannot
  read the officer directory or anyone else's history.
- **Secrets in `.env` only** — gitignored, never in source.

### Roles

One application role exists today: `authority`. It is a column with a check constraint
rather than a hardcoded assumption, and `requireRole()` is already wired into the
middleware — so the District Officer / Verification Officer / Inspection Officer roles
from the specification can be added by widening the constraint, without restructuring.

---

## Verified

The auth flow was exercised end to end against the live Supabase project:

- 26 API checks covering login, token refresh, `/me` with valid/missing/invalid tokens,
  validation errors, enumeration resistance, login history and logout.
- Account lockout confirmed: 5 failures returns 429, the correct password is refused
  while locked, and the lock is persisted to the database.
- Browser run through the real UI: failed sign-in shows the inline error, successful
  sign-in reaches the dashboard, history renders, sign-out returns to login.

---

## Next phases

Per the specification's recommended priority:

1. ~~Login + RBAC~~ — done
2. Dashboard KPIs, society registration queue, approval/rejection, document verification
3. Worker monitoring, certification verification, compliance
4. Services, bookings, ratings, complaints, welfare
5. Geo analytics, AI demand forecasting, skill gap, workforce utilization
6. Reports, notifications, inspections, audit logs
