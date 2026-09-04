-- ============================================================================
-- Liquid Glass — Café + Event Management platform
-- Schema: multi-tenant (one row set per business), PostgreSQL / Supabase.
-- Every business-owned table carries business_id; RLS (0002_rls.sql) enforces
-- that a business can only ever see its own rows.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Reusable enums --------------------------------------------------------------
do $$ begin
  create type user_role       as enum ('owner','manager','cashier','event_staff');
  create type table_status     as enum ('available','occupied','reserved','cleaning');
  create type order_status     as enum ('open','held','paid','void');
  create type order_type       as enum ('dine-in','takeaway','delivery');
  create type event_status     as enum ('enquiry','quoted','confirmed','completed','cancelled');
  create type doc_status       as enum ('draft','sent','accepted','rejected','converted');
  create type invoice_kind     as enum ('cafe','event');
  create type invoice_status   as enum ('draft','unpaid','partial','paid','overdue');
  create type payment_method   as enum ('cash','upi','card','bank','other');
  create type payment_kind     as enum ('in','refund');
  create type inv_txn_type     as enum ('purchase','sale','adjustment');
exception when duplicate_object then null; end $$;

-- Businesses (tenants) --------------------------------------------------------
create table if not exists businesses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  logo          text default '🌌',
  address       text,
  phone         text,
  email         text,
  gstin         text,
  currency      text not null default 'INR',
  created_at    timestamptz not null default now()
);

-- Users (profile row, 1:1 with auth.users) -----------------------------------
create table if not exists users (
  id            uuid primary key references auth.users(id) on delete cascade,
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  email         text not null,
  role          user_role not null default 'cashier',
  avatar        text default '🙂',
  created_at    timestamptz not null default now()
);
create index if not exists idx_users_business on users(business_id);

-- Per-business settings (1:1) -------------------------------------------------
create table if not exists settings (
  business_id       uuid primary key references businesses(id) on delete cascade,
  invoice_prefix    text not null default 'INV-2026-',
  quote_prefix      text not null default 'QT-2026-',
  invoice_terms     text,
  invoice_footer    text,
  tax_inclusive     boolean not null default false,
  default_tax_rate  numeric(5,2) not null default 18,
  tax_rates         jsonb not null default '[]',
  event_types       jsonb not null default '[]',
  service_categories jsonb not null default '[]',
  updated_at        timestamptz not null default now()
);

-- Customers (shared café + events) -------------------------------------------
create table if not exists customers (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  phone         text,
  email         text,
  address       text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_customers_business on customers(business_id);

-- Menu categories -------------------------------------------------------------
create table if not exists categories (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  icon          text default '🍽️',
  sort          int default 0
);
create index if not exists idx_categories_business on categories(business_id);

-- Products --------------------------------------------------------------------
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  category_id   uuid references categories(id) on delete set null,
  name          text not null,
  sku           text,
  image         text default '☕',
  price         numeric(12,2) not null default 0 check (price >= 0),
  cost          numeric(12,2) not null default 0 check (cost >= 0),
  stock         numeric(12,2) not null default 0,
  min_stock     numeric(12,2) not null default 0,
  available     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists idx_products_business on products(business_id);
create index if not exists idx_products_category on products(category_id);

-- Inventory transactions ------------------------------------------------------
create table if not exists inventory_transactions (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  product_id    uuid not null references products(id) on delete cascade,
  type          inv_txn_type not null,
  quantity      numeric(12,2) not null,
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_invtxn_product on inventory_transactions(product_id);

-- Café tables -----------------------------------------------------------------
create table if not exists cafe_tables (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  seats         int not null default 2,
  status        table_status not null default 'available',
  order_id      uuid
);
create index if not exists idx_tables_business on cafe_tables(business_id);

-- Café orders -----------------------------------------------------------------
create table if not exists cafe_orders (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  number        text not null,
  type          order_type not null default 'dine-in',
  table_id      uuid references cafe_tables(id) on delete set null,
  customer_id   uuid references customers(id) on delete set null,
  discount_pct  numeric(5,2) not null default 0,
  tax_rate      numeric(5,2) not null default 5,
  status        order_status not null default 'open',
  payment_method payment_method,
  invoice_id    uuid,
  created_at    timestamptz not null default now()
);
create index if not exists idx_orders_business on cafe_orders(business_id);
create index if not exists idx_orders_status on cafe_orders(status);

create table if not exists cafe_order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references cafe_orders(id) on delete cascade,
  product_id    uuid references products(id) on delete set null,
  name          text not null,
  qty           numeric(12,2) not null default 1,
  price         numeric(12,2) not null default 0
);
create index if not exists idx_orderitems_order on cafe_order_items(order_id);

-- Event packages & services ---------------------------------------------------
create table if not exists event_packages (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  price         numeric(12,2) not null default 0,
  includes      jsonb not null default '[]',
  featured      boolean not null default false
);
create index if not exists idx_packages_business on event_packages(business_id);

create table if not exists event_services (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  category      text,
  unit_price    numeric(12,2) not null default 0
);
create index if not exists idx_services_business on event_services(business_id);

-- Events ----------------------------------------------------------------------
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  customer_id   uuid references customers(id) on delete set null,
  package_id    uuid references event_packages(id) on delete set null,
  name          text not null,
  type          text,
  event_date    date not null,
  event_time    text,
  venue         text,
  guests        int default 0,
  items         jsonb not null default '[]',
  discount_pct  numeric(5,2) not null default 0,
  tax_rate      numeric(5,2) not null default 18,
  status        event_status not null default 'enquiry',
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_events_business on events(business_id);
create index if not exists idx_events_date on events(event_date);

-- Quotations ------------------------------------------------------------------
create table if not exists event_quotations (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  customer_id   uuid references customers(id) on delete set null,
  event_id      uuid references events(id) on delete set null,
  number        text not null,
  title         text,
  discount_pct  numeric(5,2) not null default 0,
  tax_rate      numeric(5,2) not null default 18,
  status        doc_status not null default 'draft',
  quote_date    date not null default current_date,
  valid_until   date,
  terms         text,
  invoice_id    uuid,
  created_at    timestamptz not null default now()
);
create index if not exists idx_quotations_business on event_quotations(business_id);

create table if not exists event_quotation_items (
  id            uuid primary key default gen_random_uuid(),
  quotation_id  uuid not null references event_quotations(id) on delete cascade,
  ref_id        uuid,
  name          text not null,
  qty           numeric(12,2) not null default 1,
  price         numeric(12,2) not null default 0
);
create index if not exists idx_quoteitems_quote on event_quotation_items(quotation_id);

-- Invoices --------------------------------------------------------------------
create table if not exists invoices (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  customer_id   uuid references customers(id) on delete set null,
  event_id      uuid references events(id) on delete set null,
  order_id      uuid references cafe_orders(id) on delete set null,
  number        text not null,
  kind          invoice_kind not null,
  title         text,
  discount_pct  numeric(5,2) not null default 0,
  tax_rate      numeric(5,2) not null default 18,
  status        invoice_status not null default 'unpaid',
  invoice_date  date not null default current_date,
  due_date      date,
  created_at    timestamptz not null default now()
);
create index if not exists idx_invoices_business on invoices(business_id);
create index if not exists idx_invoices_status on invoices(status);

create table if not exists invoice_items (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references invoices(id) on delete cascade,
  ref_id        uuid,
  name          text not null,
  qty           numeric(12,2) not null default 1,
  price         numeric(12,2) not null default 0
);
create index if not exists idx_invoiceitems_invoice on invoice_items(invoice_id);

-- Payments --------------------------------------------------------------------
create table if not exists payments (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  invoice_id    uuid references invoices(id) on delete set null,
  event_id      uuid references events(id) on delete set null,
  customer_id   uuid references customers(id) on delete set null,
  amount        numeric(12,2) not null check (amount >= 0),
  method        payment_method not null default 'cash',
  kind          payment_kind not null default 'in',
  reference     text,
  notes         text,
  paid_at       timestamptz not null default now()
);
create index if not exists idx_payments_business on payments(business_id);
create index if not exists idx_payments_invoice on payments(invoice_id);

-- Expenses --------------------------------------------------------------------
create table if not exists expenses (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  event_id      uuid references events(id) on delete set null,
  category      text,
  description   text,
  amount        numeric(12,2) not null check (amount >= 0),
  payee         text,
  method        payment_method not null default 'cash',
  spent_on      date not null default current_date,
  created_at    timestamptz not null default now()
);
create index if not exists idx_expenses_business on expenses(business_id);
create index if not exists idx_expenses_event on expenses(event_id);

-- Notifications ---------------------------------------------------------------
create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  type          text not null,
  title         text not null,
  message       text,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists idx_notifications_business on notifications(business_id);

-- FK for the table<->order cycle (added late to avoid ordering issues) --------
do $$ begin
  alter table cafe_tables
    add constraint fk_tables_order foreign key (order_id)
    references cafe_orders(id) on delete set null;
exception when duplicate_object then null; end $$;
