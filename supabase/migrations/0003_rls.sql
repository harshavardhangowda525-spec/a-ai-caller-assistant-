-- ============================================================================
-- Row Level Security
--
-- All business tables are locked down. Only authenticated app users (rows in
-- public.users) may read/write via the browser. Privileged server operations
-- (the queue worker, webhook ingestion, CSV import) use the service-role key,
-- which bypasses RLS by design and runs only on the server.
-- ============================================================================

alter table public.users            enable row level security;
alter table public.campaigns        enable row level security;
alter table public.leads            enable row level security;
alter table public.campaign_leads   enable row level security;
alter table public.calls            enable row level security;
alter table public.call_events      enable row level security;
alter table public.callbacks        enable row level security;
alter table public.suppression_list enable row level security;
alter table public.settings         enable row level security;
alter table public.audit_logs       enable row level security;

-- Helper: is the current auth user a registered app user?
create or replace function public.is_app_user()
returns boolean language sql stable as $$
  select exists (select 1 from public.users u where u.id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin');
$$;

-- users: a user can read their own row; admins can read all.
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select using (id = auth.uid() or public.is_admin());

-- Generic read for any app user on operational tables.
do $$
declare t text;
begin
  foreach t in array array[
    'campaigns','leads','campaign_leads','calls','call_events','callbacks',
    'suppression_list','settings','audit_logs'
  ] loop
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format(
      'create policy %I_read on public.%I for select using (public.is_app_user());', t, t);
  end loop;
end $$;

-- Writes (insert/update/delete) restricted to admins for the tables the UI edits.
do $$
declare t text;
begin
  foreach t in array array[
    'campaigns','leads','campaign_leads','callbacks','suppression_list','settings'
  ] loop
    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format(
      'create policy %I_write on public.%I for all using (public.is_admin()) with check (public.is_admin());',
      t, t);
  end loop;
end $$;

-- calls / call_events / audit_logs are written only by the server (service role,
-- which bypasses RLS). No client write policy is created for them on purpose.
