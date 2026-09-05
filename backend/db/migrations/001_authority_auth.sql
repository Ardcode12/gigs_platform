-- =====================================================================
-- 001_authority_auth.sql
-- AI-Enabled Cooperative Digital Service Marketplace
-- Governing Authority Dashboard -- Authentication schema
--
-- Scope: login setup only. A single application role exists: 'authority'.
-- Supabase Auth (auth.users) owns credentials; this schema owns the
-- authority officer profile, session/login history and auth audit trail.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- authority_users -- profile row for every authority officer.
-- 1:1 with auth.users; deleting the auth user removes the profile.
-- ---------------------------------------------------------------------
create table if not exists public.authority_users (
  id                   uuid primary key references auth.users (id) on delete cascade,
  employee_id          text        not null unique,
  full_name            text        not null,
  email                text        not null unique,
  phone                text,
  designation          text,
  department           text,
  -- Only one role for now. Kept as a column (not hardcoded) so additional
  -- authority roles from the spec can be added later without a migration
  -- to restructure -- only the check constraint widens.
  role                 text        not null default 'authority'
                                   check (role in ('authority')),
  status               text        not null default 'active'
                                   check (status in ('active', 'inactive', 'suspended')),
  must_change_password boolean     not null default false,
  failed_login_count   integer     not null default 0,
  locked_until         timestamptz,
  last_login_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table  public.authority_users is 'Governing authority officers. Credentials live in auth.users.';
comment on column public.authority_users.locked_until is 'Set when failed_login_count exceeds the lockout threshold.';

create index if not exists authority_users_email_idx  on public.authority_users (lower(email));
create index if not exists authority_users_status_idx on public.authority_users (status);

-- ---------------------------------------------------------------------
-- login_history -- every authentication event, success or failure.
-- Required by the spec: "login history and audit logging".
-- user_id is nullable because failed logins may reference an email that
-- has no matching profile.
-- ---------------------------------------------------------------------
create table if not exists public.login_history (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.authority_users (id) on delete set null,
  email          text        not null,
  event          text        not null
                             check (event in (
                               'login_success',
                               'login_failed',
                               'logout',
                               'token_refreshed',
                               'password_reset_requested',
                               'password_reset_completed'
                             )),
  ip_address     text,
  user_agent     text,
  failure_reason text,
  created_at     timestamptz not null default now()
);

create index if not exists login_history_user_idx    on public.login_history (user_id, created_at desc);
create index if not exists login_history_email_idx   on public.login_history (lower(email), created_at desc);
create index if not exists login_history_created_idx on public.login_history (created_at desc);

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists authority_users_set_updated_at on public.authority_users;
create trigger authority_users_set_updated_at
  before update on public.authority_users
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
--
-- The API server uses the secret key, which bypasses RLS. These policies
-- exist so that a leaked publishable key cannot read the officer
-- directory or anyone else's login history.
-- ---------------------------------------------------------------------
alter table public.authority_users enable row level security;
alter table public.login_history   enable row level security;

drop policy if exists authority_users_select_self on public.authority_users;
create policy authority_users_select_self
  on public.authority_users
  for select
  using (auth.uid() = id);

drop policy if exists authority_users_update_self on public.authority_users;
create policy authority_users_update_self
  on public.authority_users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists login_history_select_self on public.login_history;
create policy login_history_select_self
  on public.login_history
  for select
  using (auth.uid() = user_id);
