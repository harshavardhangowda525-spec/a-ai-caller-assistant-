-- ============================================================================
-- Infinity AI Caller — initial schema
-- PostgreSQL / Supabase
-- ============================================================================

create extension if not exists "pgcrypto";

-- --- Enums -------------------------------------------------------------------

do $$ begin
  create type lead_status as enum (
    'pending','calling','completed','interested','not_interested',
    'callback','do_not_call','failed','transferred'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type consent_status as enum ('consented','no_consent','unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type campaign_status as enum ('draft','running','paused','stopped','completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type call_status as enum (
    'queued','initiated','ringing','answered','in_progress',
    'transfer_requested','transferring','transfer_successful','transfer_failed',
    'completed','busy','no_answer','failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type transfer_status as enum ('none','requested','in_progress','successful','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ai_state as enum (
    'idle','greeting','pitching','awaiting_response','handling_interest',
    'requesting_transfer','scheduling_callback','closing','ended'
  );
exception when duplicate_object then null; end $$;

-- --- users (app profile, linked to Supabase auth.users) ----------------------

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'admin' check (role in ('admin','viewer')),
  created_at timestamptz not null default now()
);

-- --- campaigns ---------------------------------------------------------------

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status campaign_status not null default 'draft',
  delay_between_calls_seconds int not null default 30 check (delay_between_calls_seconds >= 0),
  max_retries int not null default 3 check (max_retries >= 0),
  allow_recontact boolean not null default false,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --- leads -------------------------------------------------------------------

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  phone_number text not null unique,          -- E.164, enforces global de-dupe
  business_type text,
  lead_source text,
  consent_status consent_status not null default 'unknown',
  status lead_status not null default 'pending',
  call_attempts int not null default 0,
  last_called_at timestamptz,
  next_callback_at timestamptz,
  call_result text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_phone on public.leads(phone_number);

-- --- campaign_leads (membership + dial order) --------------------------------

create table if not exists public.campaign_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  dial_order bigserial,
  created_at timestamptz not null default now(),
  unique (campaign_id, lead_id)
);
create index if not exists idx_campaign_leads_campaign on public.campaign_leads(campaign_id, dial_order);

-- --- calls -------------------------------------------------------------------

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  provider_call_id text unique,
  status call_status not null default 'queued',
  ai_state ai_state not null default 'idle',
  transfer_status transfer_status not null default 'none',
  current_stage text,
  started_at timestamptz,
  answered_at timestamptz,
  ended_at timestamptz,
  duration_seconds int,
  ai_summary text,
  recording_status text default 'disabled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_calls_campaign_status on public.calls(campaign_id, status);
create index if not exists idx_calls_lead on public.calls(lead_id);

-- --- call_events (append-only audit of every webhook/state change) -----------

create table if not exists public.call_events (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  event_type text not null,
  provider_event_id text,                       -- for idempotent dedupe
  from_status call_status,
  to_status call_status,
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (call_id, provider_event_id)           -- dedupe duplicate webhooks
);
create index if not exists idx_call_events_call on public.call_events(call_id);

-- --- callbacks ---------------------------------------------------------------

create table if not exists public.callbacks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  call_id uuid references public.calls(id) on delete set null,
  requested_time_text text,
  scheduled_at timestamptz,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_callbacks_scheduled on public.callbacks(scheduled_at) where handled = false;

-- --- suppression_list (permanent do-not-call) --------------------------------

create table if not exists public.suppression_list (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null unique,            -- E.164
  reason text not null default 'do_not_call',
  source text default 'manual',
  created_at timestamptz not null default now()
);

-- --- settings (single-row key/value app config) ------------------------------

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- --- audit_logs --------------------------------------------------------------

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references public.users(id),
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

-- --- updated_at trigger ------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_leads_touch on public.leads;
create trigger trg_leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_calls_touch on public.calls;
create trigger trg_calls_touch before update on public.calls
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_campaigns_touch on public.campaigns;
create trigger trg_campaigns_touch before update on public.campaigns
  for each row execute function public.touch_updated_at();

-- --- Keep leads and the suppression list consistent --------------------------
-- Adding a number to the suppression list forces the matching lead to
-- do_not_call so it can never be dialled again.

create or replace function public.apply_suppression()
returns trigger language plpgsql as $$
begin
  update public.leads
     set status = 'do_not_call'
   where phone_number = new.phone_number
     and status <> 'do_not_call';
  return new;
end $$;

drop trigger if exists trg_suppression_apply on public.suppression_list;
create trigger trg_suppression_apply after insert on public.suppression_list
  for each row execute function public.apply_suppression();

-- --- Default settings --------------------------------------------------------

insert into public.settings (key, value) values
  ('delay_between_calls_seconds', '30'::jsonb),
  ('max_retries', '3'::jsonb),
  ('recording_enabled', 'false'::jsonb),
  ('production_calling_enabled', 'false'::jsonb),
  ('ai_script', jsonb_build_object(
      'companyName','Infinity Web and Apps',
      'websitePriceFrom','₹4,999',
      'appPriceFrom','₹55,000',
      'approvedInformation','Infinity Web and Apps builds websites and mobile apps for local businesses at affordable prices. Websites start at ₹4,999. Mobile apps start at ₹55,000.'
   ))
on conflict (key) do nothing;
