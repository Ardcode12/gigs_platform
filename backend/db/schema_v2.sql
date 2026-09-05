-- =====================================================
-- GigMat Platform — Schema V2 (adapts to existing DB)
-- Safe to run: uses IF NOT EXISTS throughout
-- =====================================================

-- =====================================================
-- EXTEND societies table
-- =====================================================
ALTER TABLE societies
  ADD COLUMN IF NOT EXISTS federation_id    VARCHAR(20),
  ADD COLUMN IF NOT EXISTS society_code     VARCHAR(30) UNIQUE,
  ADD COLUMN IF NOT EXISTS district         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state            VARCHAR(100),
  ADD COLUMN IF NOT EXISTS operator_name    VARCHAR(150),
  ADD COLUMN IF NOT EXISTS operator_phone   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS password_hash    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS lat              NUMERIC(10,8),
  ADD COLUMN IF NOT EXISTS lng              NUMERIC(11,8),
  ADD COLUMN IF NOT EXISTS service_radius_km NUMERIC(5,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS is_active        BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMP DEFAULT NOW();

-- =====================================================
-- EXTEND workers table
-- =====================================================
ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS category         VARCHAR(30),
  ADD COLUMN IF NOT EXISTS worker_unique_id VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS kyc_status       VARCHAR(30) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS kyc_method       VARCHAR(30) DEFAULT 'certificate',
  ADD COLUMN IF NOT EXISTS cert_id          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS cert_verified    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS voucher_member_name  VARCHAR(150),
  ADD COLUMN IF NOT EXISTS voucher_member_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS voucher_approved  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email            VARCHAR(200),
  ADD COLUMN IF NOT EXISTS daily_rate       NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hourly_rate      NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability     VARCHAR(20) DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS is_active        BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMP DEFAULT NOW();

-- =====================================================
-- EXTEND customers table
-- =====================================================
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS customer_unique_id VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS email              VARCHAR(200),
  ADD COLUMN IF NOT EXISTS password_hash      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address            TEXT,
  ADD COLUMN IF NOT EXISTS lat                NUMERIC(10,8),
  ADD COLUMN IF NOT EXISTS lng                NUMERIC(11,8),
  ADD COLUMN IF NOT EXISTS is_active          BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMP DEFAULT NOW();

-- =====================================================
-- WORKER KYC REFERENCES (past client phone numbers)
-- =====================================================
CREATE TABLE IF NOT EXISTS worker_kyc_refs (
  id         SERIAL PRIMARY KEY,
  worker_id  INTEGER REFERENCES workers(id) ON DELETE CASCADE,
  ref_name   VARCHAR(150),
  ref_phone  VARCHAR(20) NOT NULL,
  verified   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SERVICE SUBCATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS service_subcategories (
  id           SERIAL PRIMARY KEY,
  category     VARCHAR(30) NOT NULL,
  subcategory  VARCHAR(100) NOT NULL,
  description  TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  UNIQUE (category, subcategory)
);

INSERT INTO service_subcategories (category, subcategory) VALUES
  ('electrician',    'Wiring & Rewiring'),
  ('electrician',    'Motor Repair'),
  ('electrician',    'Fan / AC Installation'),
  ('electrician',    'Panel / Fuse Box'),
  ('electrician',    'CCTV & Security'),
  ('plumber',        'Pipe Repair / Replacement'),
  ('plumber',        'Tap & Valve'),
  ('plumber',        'Drainage & Blockage'),
  ('plumber',        'Water Tank Cleaning'),
  ('carpenter',      'Furniture Repair'),
  ('carpenter',      'Door & Window'),
  ('carpenter',      'Wood Polishing'),
  ('painter',        'Interior Painting'),
  ('painter',        'Exterior Painting'),
  ('painter',        'Waterproofing'),
  ('technician',     'AC Service / Repair'),
  ('technician',     'Refrigerator Repair'),
  ('technician',     'Washing Machine Repair'),
  ('technician',     'TV / Electronics'),
  ('driver',         'Local Trip'),
  ('driver',         'Outstation Trip'),
  ('driver',         'School Van'),
  ('cleaner',        'House Cleaning'),
  ('cleaner',        'Office Cleaning'),
  ('cleaner',        'Deep Cleaning'),
  ('domestic_helper','Cooking'),
  ('domestic_helper','Cleaning & Housekeeping'),
  ('domestic_helper','Babysitting / Childcare'),
  ('caregiver',      'Elderly Care'),
  ('caregiver',      'Patient Care'),
  ('caregiver',      'Post-Surgery Care'),
  ('gardener',       'Pruning & Trimming'),
  ('gardener',       'Landscaping'),
  ('gardener',       'Pest Control')
ON CONFLICT (category, subcategory) DO NOTHING;

-- =====================================================
-- EXTEND jobs table (bookings)
-- =====================================================
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS society_id         INTEGER REFERENCES societies(id),
  ADD COLUMN IF NOT EXISTS booking_type       VARCHAR(10) DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS service_subcategory VARCHAR(100),
  ADD COLUMN IF NOT EXISTS team_size          INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_mode       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS payment_status     VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS final_amount       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_confirmed_by VARCHAR(20),
  ADD COLUMN IF NOT EXISTS customer_name      VARCHAR(150),
  ADD COLUMN IF NOT EXISTS customer_phone     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS worker_accepted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS notes              TEXT,
  ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMP DEFAULT NOW();

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_workers_unique_id    ON workers(worker_unique_id);
CREATE INDEX IF NOT EXISTS idx_workers_kyc_status   ON workers(kyc_status);
CREATE INDEX IF NOT EXISTS idx_workers_category     ON workers(category);
CREATE INDEX IF NOT EXISTS idx_customers_unique_id  ON customers(customer_unique_id);
CREATE INDEX IF NOT EXISTS idx_jobs_society         ON jobs(society_id);
CREATE INDEX IF NOT EXISTS idx_kyc_refs_worker      ON worker_kyc_refs(worker_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_cat    ON service_subcategories(category);
