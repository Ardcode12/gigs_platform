-- =====================================================================
-- 002_ecosystem_core.sql
-- AI-Enabled Cooperative Digital Service Marketplace
-- Governing Authority Dashboard -- ecosystem schema
--
-- Backs specification section 3 (Main Authority Dashboard): the twelve KPI
-- cards, the eight visualizations and the six global filters.
--
-- Scope note (specification section 1): societies own worker onboarding, so
-- workers here are records *submitted by* a society. The authority column is
-- the verification decision, not the record's creation.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Geography -- State / District / Taluk, the first three global filters.
-- Modelled as a hierarchy so a district filter implies its taluks.
-- ---------------------------------------------------------------------
create table if not exists public.states (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  code       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.districts (
  id         uuid primary key default gen_random_uuid(),
  state_id   uuid not null references public.states (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (state_id, name)
);

create table if not exists public.taluks (
  id          uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts (id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (district_id, name)
);

-- ---------------------------------------------------------------------
-- Service taxonomy -- the "Service Category" global filter, and the
-- skill dimension behind "Worker distribution by skill".
-- ---------------------------------------------------------------------
create table if not exists public.service_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references public.service_categories (id) on delete set null,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- societies -- the entity the authority actually governs.
-- Status values are the specification's set (section 4).
-- ---------------------------------------------------------------------
create table if not exists public.societies (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  registration_no   text not null unique,
  district_id       uuid not null references public.districts (id) on delete restrict,
  taluk_id          uuid references public.taluks (id) on delete set null,
  registration_date date not null,
  expiry_date       date,
  status            text not null default 'pending_approval'
                    check (status in ('pending_approval', 'active', 'under_review',
                                     'compliance_required', 'suspended', 'rejected',
                                     'expired')),
  contact_person    text,
  contact_email     text,
  contact_phone     text,
  address           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists societies_district_idx on public.societies (district_id);
create index if not exists societies_taluk_idx    on public.societies (taluk_id);
create index if not exists societies_status_idx   on public.societies (status);
create index if not exists societies_expiry_idx   on public.societies (expiry_date);

comment on column public.societies.status is
  'pending_approval | active | under_review | compliance_required | suspended | rejected | expired';

-- ---------------------------------------------------------------------
-- workers -- submitted by societies, verified by the authority.
-- verification_status is the authority's decision; status is the
-- society's own employment state.
-- ---------------------------------------------------------------------
create table if not exists public.workers (
  id                  uuid primary key default gen_random_uuid(),
  society_id          uuid not null references public.societies (id) on delete cascade,
  full_name           text not null,
  gender              text check (gender in ('male', 'female', 'other')),
  primary_skill_id    uuid references public.skills (id) on delete set null,
  verification_status text not null default 'pending'
                      check (verification_status in ('pending', 'verified', 'rejected')),
  status              text not null default 'active'
                      check (status in ('active', 'inactive')),
  insurance_enrolled  boolean not null default false,
  welfare_scheme      text,
  submitted_at        timestamptz not null default now(),
  verified_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists workers_society_idx      on public.workers (society_id);
create index if not exists workers_verification_idx on public.workers (verification_status);
create index if not exists workers_skill_idx        on public.workers (primary_skill_id);
create index if not exists workers_submitted_idx    on public.workers (submitted_at);

-- ---------------------------------------------------------------------
-- services -- what a society offers in the marketplace.
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid not null references public.societies (id) on delete cascade,
  category_id uuid not null references public.service_categories (id) on delete restrict,
  name        text not null,
  base_price  numeric(12, 2) not null default 0,
  status      text not null default 'active'
              check (status in ('active', 'inactive')),
  created_at  timestamptz not null default now()
);

create index if not exists services_society_idx  on public.services (society_id);
create index if not exists services_category_idx on public.services (category_id);

-- ---------------------------------------------------------------------
-- bookings -- marketplace activity. The authority only *monitors* these
-- (section 1: operational allocation belongs to societies/platform).
-- ---------------------------------------------------------------------
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid not null references public.services (id) on delete cascade,
  society_id   uuid not null references public.societies (id) on delete cascade,
  category_id  uuid not null references public.service_categories (id) on delete restrict,
  worker_id    uuid references public.workers (id) on delete set null,
  status       text not null default 'pending'
               check (status in ('pending', 'confirmed', 'in_progress',
                                 'completed', 'cancelled')),
  amount       numeric(12, 2) not null default 0,
  rating       numeric(2, 1) check (rating >= 1 and rating <= 5),
  booked_at    timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists bookings_society_idx  on public.bookings (society_id);
create index if not exists bookings_category_idx on public.bookings (category_id);
create index if not exists bookings_booked_idx   on public.bookings (booked_at);
create index if not exists bookings_status_idx   on public.bookings (status);

-- ---------------------------------------------------------------------
-- complaints -- the quality/grievance signal behind "Open Complaints"
-- and the complaint-trend chart.
-- ---------------------------------------------------------------------
create table if not exists public.complaints (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references public.bookings (id) on delete set null,
  society_id  uuid not null references public.societies (id) on delete cascade,
  category_id uuid references public.service_categories (id) on delete set null,
  subject     text not null,
  severity    text not null default 'medium'
              check (severity in ('low', 'medium', 'high', 'critical')),
  status      text not null default 'open'
              check (status in ('open', 'under_review', 'resolved', 'rejected')),
  raised_at   timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists complaints_society_idx on public.complaints (society_id);
create index if not exists complaints_status_idx  on public.complaints (status);
create index if not exists complaints_raised_idx  on public.complaints (raised_at);

-- ---------------------------------------------------------------------
-- compliance_documents -- required documents, deadlines and
-- non-compliance (section 1, Compliance).
-- ---------------------------------------------------------------------
create table if not exists public.compliance_documents (
  id           uuid primary key default gen_random_uuid(),
  society_id   uuid not null references public.societies (id) on delete cascade,
  doc_type     text not null,
  status       text not null default 'pending'
               check (status in ('pending', 'submitted', 'verified', 'rejected', 'expired')),
  due_date     date,
  submitted_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists compliance_society_idx on public.compliance_documents (society_id);
create index if not exists compliance_status_idx  on public.compliance_documents (status);

-- ---------------------------------------------------------------------
-- updated_at triggers (set_updated_at() comes from migration 001)
-- ---------------------------------------------------------------------
drop trigger if exists societies_set_updated_at on public.societies;
create trigger societies_set_updated_at
  before update on public.societies
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
--
-- The API reads these through the secret key, which bypasses RLS. These
-- policies exist so a leaked publishable key cannot read the ecosystem:
-- only an *active* authority officer may select.
-- ---------------------------------------------------------------------
create or replace function public.is_active_authority()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.authority_users au
    where au.id = auth.uid()
      and au.status = 'active'
  );
$$;

comment on function public.is_active_authority is
  'True when the caller is an active authority officer. Used by ecosystem read policies.';

do $$
declare
  t text;
begin
  foreach t in array array[
    'states', 'districts', 'taluks', 'service_categories', 'skills',
    'societies', 'workers', 'services', 'bookings', 'complaints',
    'compliance_documents'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_authority', t);
    execute format(
      'create policy %I on public.%I for select using (public.is_active_authority())',
      t || '_select_authority', t
    );
  end loop;
end
$$;
