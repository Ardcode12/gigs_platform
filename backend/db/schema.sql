-- =====================================================
-- GigMat Society Platform — PostgreSQL Schema
-- Run: psql -U postgres -d gigmat_society -f schema.sql
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SOCIETIES (Federation-issued credentials)
-- =====================================================
CREATE TABLE IF NOT EXISTS societies (
  id            VARCHAR(30) PRIMARY KEY,         -- e.g. SOC-TN-CHE-01
  federation_id VARCHAR(20) NOT NULL,             -- e.g. FED-TN-001
  name          VARCHAR(200) NOT NULL,
  district      VARCHAR(100) NOT NULL,
  state         VARCHAR(100) NOT NULL,
  operator_name VARCHAR(150) NOT NULL,
  operator_phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- WORKERS (All 10 categories)
-- =====================================================
CREATE TABLE IF NOT EXISTS workers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id    VARCHAR(30) REFERENCES societies(id) ON DELETE CASCADE,
  name          VARCHAR(150) NOT NULL,
  phone         VARCHAR(20) NOT NULL,
  aadhaar       VARCHAR(20),                      -- masked after verification
  category      VARCHAR(30) NOT NULL CHECK (category IN (
                  'electrician','plumber','carpenter','painter',
                  'domestic_helper','caregiver','driver','gardener',
                  'cleaner','technician'
                )),
  skills        TEXT[] DEFAULT '{}',
  city          VARCHAR(100),
  kyc_status    VARCHAR(30) DEFAULT 'pending' CHECK (kyc_status IN (
                  'pending','verifying','gov_certified',
                  'inspection_required','inspection_passed','rejected','active'
                )),
  availability  VARCHAR(20) DEFAULT 'offline' CHECK (availability IN (
                  'available','dispatched','on_job','offline'
                )),
  cert_id       VARCHAR(100),
  cert_verified BOOLEAN DEFAULT FALSE,
  inspection_passed  BOOLEAN DEFAULT FALSE,
  inspection_score   INTEGER,
  inspection_remarks TEXT,
  daily_rate    NUMERIC(10,2) DEFAULT 0,
  hourly_rate   NUMERIC(10,2) DEFAULT 0,
  rating        NUMERIC(3,2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  lat           NUMERIC(10,8),
  lng           NUMERIC(11,8),
  is_active     BOOLEAN DEFAULT TRUE,
  joined_at     TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- BOOKINGS (Single & Bulk)
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id      VARCHAR(30) REFERENCES societies(id) ON DELETE CASCADE,
  booking_ref     VARCHAR(20) UNIQUE NOT NULL,    -- e.g. BK001
  type            VARCHAR(10) NOT NULL CHECK (type IN ('single','bulk')),
  service_category VARCHAR(30) NOT NULL,
  customer_name   VARCHAR(150) NOT NULL,
  customer_phone  VARCHAR(20) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_lat    NUMERIC(10,8),
  customer_lng    NUMERIC(11,8),
  description     TEXT,
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                    'pending','dispatched','on_the_way',
                    'arrived','in_progress','completed','cancelled'
                  )),
  assigned_worker UUID REFERENCES workers(id),
  team_lead       UUID REFERENCES workers(id),
  team_size       INTEGER DEFAULT 1,
  estimated_amount NUMERIC(10,2) DEFAULT 0,
  final_amount    NUMERIC(10,2),
  payment_mode    VARCHAR(20) CHECK (payment_mode IN ('online','cash',NULL)),
  payment_status  VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
                    'pending','online_paid','cash_paid',
                    'reconciled','split_pending','split_done'
                  )),
  notes           TEXT,
  requested_at    TIMESTAMP DEFAULT NOW(),
  dispatched_at   TIMESTAMP,
  completed_at    TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- BOOKING_WORKERS (Many-to-Many for bulk bookings)
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_workers (
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  worker_id  UUID REFERENCES workers(id) ON DELETE CASCADE,
  is_lead    BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (booking_id, worker_id)
);

-- =====================================================
-- PAYMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_ref   VARCHAR(20) UNIQUE NOT NULL,
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  society_id    VARCHAR(30) REFERENCES societies(id),
  type          VARCHAR(10) CHECK (type IN ('single','bulk')),
  amount        NUMERIC(10,2) NOT NULL,
  platform_fee  NUMERIC(10,2) DEFAULT 0,
  net_amount    NUMERIC(10,2),
  mode          VARCHAR(20) CHECK (mode IN ('online','cash')),
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                  'pending','online_paid','cash_paid',
                  'reconciled','split_pending','split_done'
                )),
  transaction_ref VARCHAR(100),
  paid_at       TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- PAYMENT_SPLITS (Per-worker payout for bulk jobs)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_splits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id  UUID REFERENCES payments(id) ON DELETE CASCADE,
  worker_id   UUID REFERENCES workers(id),
  worker_name VARCHAR(150),
  amount      NUMERIC(10,2) NOT NULL,
  status      VARCHAR(20) DEFAULT 'pending',
  paid_at     TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- RATE_CARDS (Per society, per category)
-- =====================================================
CREATE TABLE IF NOT EXISTS rate_cards (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id          VARCHAR(30) REFERENCES societies(id) ON DELETE CASCADE,
  category            VARCHAR(30) NOT NULL,
  base_rate           NUMERIC(10,2) DEFAULT 0,
  hourly_rate         NUMERIC(10,2) DEFAULT 0,
  daily_rate          NUMERIC(10,2) DEFAULT 0,
  emergency_surcharge NUMERIC(5,2) DEFAULT 25.00,   -- percentage
  night_surcharge     NUMERIC(5,2) DEFAULT 35.00,    -- percentage
  emergency_enabled   BOOLEAN DEFAULT TRUE,
  night_enabled       BOOLEAN DEFAULT TRUE,
  updated_at          TIMESTAMP DEFAULT NOW(),
  UNIQUE (society_id, category)
);

-- =====================================================
-- WELFARE_ENROLLMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS welfare_enrollments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id  VARCHAR(30) REFERENCES societies(id),
  worker_id   UUID REFERENCES workers(id) ON DELETE CASCADE,
  scheme_id   VARCHAR(30) NOT NULL,               -- pm_sym, accident_ins, health_card, tool_loan
  status      VARCHAR(20) DEFAULT 'active',
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (worker_id, scheme_id)
);

-- =====================================================
-- WELFARE_ADVANCES (Emergency micro-loans)
-- =====================================================
CREATE TABLE IF NOT EXISTS welfare_advances (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id    VARCHAR(30) REFERENCES societies(id),
  worker_id     UUID REFERENCES workers(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL,
  reason        TEXT NOT NULL,
  status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                  'pending','approved','rejected','repaid'
                )),
  approved_at   TIMESTAMP,
  repaid_amount NUMERIC(10,2) DEFAULT 0,
  requested_at  TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- COMPLAINTS
-- =====================================================
CREATE TABLE IF NOT EXISTS complaints (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  society_id    VARCHAR(30) REFERENCES societies(id),
  complaint_ref VARCHAR(20) UNIQUE NOT NULL,
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  worker_id     UUID REFERENCES workers(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  worker_name   VARCHAR(150),
  category      VARCHAR(30),
  type          VARCHAR(30) CHECK (type IN ('quality','behaviour','delay','fraud','payment','other')),
  title         VARCHAR(250) NOT NULL,
  description   TEXT NOT NULL,
  severity      VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status        VARCHAR(20) DEFAULT 'open' CHECK (status IN (
                  'open','under_review','resolved','escalated'
                )),
  resolution    TEXT,
  escalation_reason TEXT,
  escalated_at  TIMESTAMP,
  resolved_at   TIMESTAMP,
  raised_at     TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- COMPLAINT_RESPONSES
-- =====================================================
CREATE TABLE IF NOT EXISTS complaint_responses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id  UUID REFERENCES complaints(id) ON DELETE CASCADE,
  responder     VARCHAR(100) DEFAULT 'Society Admin',
  response      TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_workers_society ON workers(society_id);
CREATE INDEX IF NOT EXISTS idx_workers_category ON workers(category);
CREATE INDEX IF NOT EXISTS idx_workers_kyc_status ON workers(kyc_status);
CREATE INDEX IF NOT EXISTS idx_workers_availability ON workers(availability);
CREATE INDEX IF NOT EXISTS idx_bookings_society ON bookings(society_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_category ON bookings(service_category);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_complaints_society ON complaints(society_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_welfare_worker ON welfare_enrollments(worker_id);
