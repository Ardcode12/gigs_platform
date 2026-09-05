-- =====================================================
-- GigMat Society Platform — Seed Data
-- Run AFTER schema.sql
-- =====================================================

-- Seed Society
INSERT INTO societies (id, federation_id, name, district, state, operator_name, operator_phone, password_hash)
VALUES (
  'SOC-TN-CHE-01',
  'FED-TN-001',
  'Chennai Central Gig Society',
  'Chennai',
  'Tamil Nadu',
  'Murugan Selvam',
  '+91 98401 22345',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi'  -- password: society123
) ON CONFLICT (id) DO NOTHING;

-- Seed Rate Cards for all 10 categories
INSERT INTO rate_cards (society_id, category, base_rate, hourly_rate, daily_rate, emergency_surcharge, night_surcharge, emergency_enabled, night_enabled)
VALUES
  ('SOC-TN-CHE-01', 'electrician',     400, 150, 650,  25, 30, TRUE, TRUE),
  ('SOC-TN-CHE-01', 'plumber',         350, 140, 600,  25, 30, TRUE, TRUE),
  ('SOC-TN-CHE-01', 'carpenter',       450, 175, 750,  20, 25, TRUE, TRUE),
  ('SOC-TN-CHE-01', 'painter',         400, 160, 700,  15, 20, TRUE, TRUE),
  ('SOC-TN-CHE-01', 'domestic_helper', 300, 120, 500,  10, 15, TRUE, TRUE),
  ('SOC-TN-CHE-01', 'caregiver',       500, 200, 800,  20, 25, TRUE, TRUE),
  ('SOC-TN-CHE-01', 'driver',          400, 180, 900,  20, 30, TRUE, TRUE),
  ('SOC-TN-CHE-01', 'gardener',        250, 110, 480,  10, 15, TRUE, TRUE),
  ('SOC-TN-CHE-01', 'cleaner',         300, 120, 520,  15, 20, TRUE, TRUE),
  ('SOC-TN-CHE-01', 'technician',      450, 200, 850,  30, 35, TRUE, TRUE)
ON CONFLICT (society_id, category) DO NOTHING;

-- Seed Workers (all 10 categories)
INSERT INTO workers (society_id, name, phone, aadhaar, category, skills, city, kyc_status, availability, cert_id, cert_verified, daily_rate, hourly_rate, rating, total_ratings, completed_jobs, lat, lng)
VALUES
  ('SOC-TN-CHE-01', 'Rajesh Kumar',   '+91 98401 11111', 'XXXX-XXXX-4521', 'electrician',     ARRAY['Fan Repair','Wiring','Switchboard'],        'Adyar, Chennai',       'active',              'available', 'ITI-TN-2021-0045',    TRUE,  650, 150, 4.8, 342, 342, 12.9986, 80.2564),
  ('SOC-TN-CHE-01', 'Suresh Babu',    '+91 98401 22222', 'XXXX-XXXX-5632', 'plumber',         ARRAY['Pipe Fitting','Leak Repair','Tap Replacement'], 'Anna Nagar, Chennai', 'active',              'on_job',   'NSDC-2022-PLB-0123', TRUE,  600, 140, 4.6, 218, 218, 13.0835, 80.2098),
  ('SOC-TN-CHE-01', 'Pradeep Nadar',  '+91 98401 33333', 'XXXX-XXXX-1298', 'carpenter',       ARRAY['Furniture Repair','Door Fitting','Wood Polish'], 'Velachery, Chennai', 'inspection_required', 'offline',  NULL,                  FALSE, 750, 175, 0,   0,   0,   12.9754, 80.2179),
  ('SOC-TN-CHE-01', 'Kavitha Devi',   '+91 98401 44444', 'XXXX-XXXX-9087', 'domestic_helper', ARRAY['Cooking','Housekeeping','Baby Care'],          'T. Nagar, Chennai',   'active',              'available', 'PMKVY-2023-DH-0567', TRUE,  500, 120, 4.9, 156, 156, 13.0418, 80.2336),
  ('SOC-TN-CHE-01', 'Anand Selvam',   '+91 98401 55555', 'XXXX-XXXX-3367', 'painter',         ARRAY['Interior Painting','Exterior','Waterproofing'], 'Tambaram, Chennai',  'active',              'dispatched','ITI-TN-2020-0289',   TRUE,  700, 160, 4.7, 198, 198, 12.9252, 80.1000),
  ('SOC-TN-CHE-01', 'Mary Alphonso',  '+91 98401 66666', 'XXXX-XXXX-7823', 'caregiver',       ARRAY['Elder Care','Patient Care','Physio Assist'],   'Nungambakkam, Chennai','active',             'available', 'NSDC-2022-CG-0456',  TRUE,  800, 200, 4.9, 87,  87,  13.0569, 80.2458),
  ('SOC-TN-CHE-01', 'Vijay Kumar',    '+91 98401 77777', 'XXXX-XXXX-2234', 'driver',          ARRAY['Car Driving','Outstation','Heavy Vehicle'],    'Perambur, Chennai',   'active',              'available', 'DL-TN-2019-00123456',TRUE,  900, 180, 4.5, 412, 412, 13.1143, 80.2329),
  ('SOC-TN-CHE-01', 'Rajan Mani',     '+91 98401 88888', 'XXXX-XXXX-6654', 'gardener',        ARRAY['Lawn Mowing','Plant Care','Landscape'],        'Besant Nagar, Chennai','inspection_passed',  'available', NULL,                  FALSE, 480, 110, 4.3, 64,  64,  13.0007, 80.2699),
  ('SOC-TN-CHE-01', 'Selvi Krishnan', '+91 98401 99999', 'XXXX-XXXX-8891', 'cleaner',         ARRAY['Deep Cleaning','Sofa Cleaning','Post-Construction'], 'Kodambakkam',     'active',              'available', 'PMKVY-2022-CL-0891', TRUE,  520, 120, 4.8, 231, 231, 13.0501, 80.2210),
  ('SOC-TN-CHE-01', 'Karthik Rajan',  '+91 98401 10101', 'XXXX-XXXX-3345', 'technician',      ARRAY['AC Repair','Refrigerator Repair','TV/Electronics'], 'Guindy, Chennai',  'pending',             'offline',   NULL,                  FALSE, 850, 175, 0,   0,   0,   13.0067, 80.2206),
  ('SOC-TN-CHE-01', 'Murugan Das',    '+91 98401 11122', 'XXXX-XXXX-4411', 'electrician',     ARRAY['Solar Panel','Industrial Wiring','Motor Repair'], 'Porur, Chennai',    'active',              'available', 'ITI-TN-2019-0567',   TRUE,  700, 175, 4.6, 189, 189, 13.0358, 80.1573),
  ('SOC-TN-CHE-01', 'Priya Lakshmi',  '+91 98401 12312', 'XXXX-XXXX-7712', 'cleaner',         ARRAY['Office Cleaning','Kitchen Cleaning','Window Cleaning'], 'Mylapore',      'active',              'on_job',    'PMKVY-2023-CL-0234', TRUE,  500, 120, 4.7, 167, 167, 13.0340, 80.2699)
ON CONFLICT DO NOTHING;

-- Seed Bookings
WITH w1 AS (SELECT id FROM workers WHERE name='Anand Selvam' LIMIT 1),
     s AS (SELECT 'SOC-TN-CHE-01' as sid)
INSERT INTO bookings (society_id, booking_ref, type, service_category, customer_name, customer_phone, customer_address, customer_lat, customer_lng, description, status, assigned_worker, estimated_amount, payment_mode, payment_status)
SELECT
  'SOC-TN-CHE-01', 'BK001', 'single', 'plumber',
  'Arjun Mehta', '+91 99001 11111',
  '12, Gandhi St, Adyar, Chennai - 600020', 12.9986, 80.2564,
  'Kitchen pipe leaking badly, urgent fix needed',
  'pending', NULL, 500, NULL, 'pending'
ON CONFLICT (booking_ref) DO NOTHING;

INSERT INTO bookings (society_id, booking_ref, type, service_category, customer_name, customer_phone, customer_address, customer_lat, customer_lng, description, status, estimated_amount, payment_mode, payment_status)
VALUES
  ('SOC-TN-CHE-01', 'BK002', 'single', 'electrician', 'Divya Rani', '+91 99001 22222', '45, 2nd Main Rd, Anna Nagar, Chennai - 600040', 13.0835, 80.2098, 'Switchboard sparking, need immediate repair', 'pending', 450, NULL, 'pending'),
  ('SOC-TN-CHE-01', 'BK003', 'bulk',   'cleaner',     'Greenfield School', '+91 44 2234 5678', '78, School Rd, Velachery, Chennai - 600042',  12.9754, 80.2179, 'Annual deep cleaning of 3-floor school, need 6 cleaners for 2 days', 'pending', 12000, NULL, 'pending'),
  ('SOC-TN-CHE-01', 'BK004', 'single', 'caregiver',   'Ramesh Iyer',  '+91 99001 44444', '22, Lake View Rd, T Nagar, Chennai - 600017',   13.0418, 80.2336, 'Elder care for 80-year-old father, 8 hours per day', 'in_progress', 750, 'cash', 'pending'),
  ('SOC-TN-CHE-01', 'BK005', 'single', 'carpenter',   'Sneha Krishnan','+91 99001 55555','5, Rose Ave, Nungambakkam, Chennai - 600034',   13.0569, 80.2458, 'Main door hinge broken, wardrobe repair needed', 'completed', 800, 'online', 'online_paid')
ON CONFLICT (booking_ref) DO NOTHING;

-- BK003 team size update
UPDATE bookings SET team_size = 6 WHERE booking_ref = 'BK003';

-- Seed Complaints
INSERT INTO complaints (society_id, complaint_ref, customer_name, worker_name, category, type, title, description, severity, status)
VALUES
  ('SOC-TN-CHE-01', 'CMP001', 'Divya Rani',   'Rajesh Kumar',  'electrician', 'quality',   'Work not done properly',          'Worker fixed the switchboard but it started sparking again after 2 hours. Poor quality of work.', 'high',     'open'),
  ('SOC-TN-CHE-01', 'CMP002', 'Ramesh Iyer',  'Mary Alphonso', 'caregiver',   'behaviour', 'Worker arrived 2 hours late',     'Caregiver was supposed to arrive at 8 AM but came at 10 AM without prior notice.',                 'medium',   'under_review'),
  ('SOC-TN-CHE-01', 'CMP003', 'Suresh Patel', 'Vijay Kumar',   'driver',      'fraud',     'Overcharged customer without auth', 'Driver demanded extra ₹500 cash from customer without authorization. Possible fraud.',             'critical', 'escalated')
ON CONFLICT (complaint_ref) DO NOTHING;

-- Seed Welfare Enrollments
WITH workers_ref AS (
  SELECT id, name FROM workers WHERE society_id = 'SOC-TN-CHE-01'
)
INSERT INTO welfare_enrollments (society_id, worker_id, scheme_id)
SELECT 'SOC-TN-CHE-01', w.id, s.scheme_id
FROM workers_ref w
CROSS JOIN (VALUES ('pm_sym'),('accident_ins')) AS s(scheme_id)
WHERE w.name = 'Rajesh Kumar'
ON CONFLICT (worker_id, scheme_id) DO NOTHING;

-- Seed Advances
INSERT INTO welfare_advances (society_id, worker_id, amount, reason, status)
SELECT 'SOC-TN-CHE-01', w.id, 5000, 'Medical emergency — wife admitted to hospital', 'pending'
FROM workers WHERE name = 'Suresh Babu' AND society_id = 'SOC-TN-CHE-01'
ON CONFLICT DO NOTHING;

SELECT 'Seed data loaded successfully!' AS result;
