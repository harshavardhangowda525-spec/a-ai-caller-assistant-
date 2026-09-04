-- ============================================================================
-- Row Level Security — a business can NEVER read or write another business's
-- data. All access is scoped to the caller's business_id, derived from their
-- users row. Role-based write limits are layered on top for sensitive tables.
-- ============================================================================

-- Helper: the business_id of the currently authenticated user.
create or replace function auth_business_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select business_id from public.users where id = auth.uid();
$$;

-- Helper: the role of the currently authenticated user.
create or replace function auth_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- Enable RLS on every table --------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'businesses','users','settings','customers','categories','products',
    'inventory_transactions','cafe_tables','cafe_orders','cafe_order_items',
    'event_packages','event_services','events','event_quotations',
    'event_quotation_items','invoices','invoice_items','payments','expenses',
    'notifications'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- Businesses: a user sees only their own business ----------------------------
create policy business_self on businesses
  for select using (id = auth_business_id());
create policy business_update on businesses
  for update using (id = auth_business_id() and auth_role() = 'owner');

-- Users: visible within the business; only owner/manager may write -----------
create policy users_select on users
  for select using (business_id = auth_business_id());
create policy users_write on users
  for all using (business_id = auth_business_id() and auth_role() in ('owner','manager'))
  with check (business_id = auth_business_id());

-- Settings: read all, write owner/manager ------------------------------------
create policy settings_select on settings
  for select using (business_id = auth_business_id());
create policy settings_write on settings
  for all using (business_id = auth_business_id() and auth_role() in ('owner','manager'))
  with check (business_id = auth_business_id());

-- Generic business-scoped tables: full CRUD within the business --------------
-- (Application-level role gating is enforced in the UI via canAccess();
--  here we guarantee tenant isolation, the security-critical invariant.)
do $$
declare t text;
begin
  foreach t in array array[
    'customers','categories','products','inventory_transactions',
    'cafe_tables','cafe_orders','event_packages','event_services','events',
    'event_quotations','invoices','payments','expenses','notifications'
  ] loop
    execute format($f$
      create policy %1$s_tenant on %1$I
        for all
        using (business_id = auth_business_id())
        with check (business_id = auth_business_id());
    $f$, t);
  end loop;
end $$;

-- Child/line-item tables: isolated via their parent's business_id ------------
create policy order_items_tenant on cafe_order_items
  for all
  using (exists (select 1 from cafe_orders o where o.id = order_id and o.business_id = auth_business_id()))
  with check (exists (select 1 from cafe_orders o where o.id = order_id and o.business_id = auth_business_id()));

create policy quote_items_tenant on event_quotation_items
  for all
  using (exists (select 1 from event_quotations q where q.id = quotation_id and q.business_id = auth_business_id()))
  with check (exists (select 1 from event_quotations q where q.id = quotation_id and q.business_id = auth_business_id()));

create policy invoice_items_tenant on invoice_items
  for all
  using (exists (select 1 from invoices i where i.id = invoice_id and i.business_id = auth_business_id()))
  with check (exists (select 1 from invoices i where i.id = invoice_id and i.business_id = auth_business_id()));
