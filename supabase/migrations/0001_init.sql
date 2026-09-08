-- Tribal Brew Daily — schema
-- Run in Supabase SQL editor or via the CLI. Public reads are open (RLS
-- policies below); all writes go through the service role, which bypasses RLS.

create extension if not exists "pgcrypto";

-- ---------- MENU ----------
create table if not exists public.menu_items (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  description text default '',
  price       numeric not null default 0,
  category    text not null default 'coffee',
  image       text default '',
  available   boolean not null default true,
  featured    boolean not null default false,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- EVENTS ----------
create table if not exists public.events (
  id          text primary key default gen_random_uuid()::text,
  title       text not null,
  date        date not null,
  time        text default '',
  description text default '',
  image       text default '',
  booking_url text,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- GALLERY ----------
create table if not exists public.gallery (
  id        text primary key default gen_random_uuid()::text,
  src       text not null,
  caption   text default '',
  category  text not null default 'coffee',
  span      text not null default 'normal',
  sort      int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- SITE CONTENT (key/value) ----------
create table if not exists public.site_content (
  key   text primary key,
  value text not null default ''
);

-- ---------- ORDERS ----------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null,
  customer_name  text default '',
  customer_phone text default '',
  lines          jsonb not null default '[]'::jsonb,
  subtotal       numeric not null default 0,
  discount       numeric not null default 0,
  tax            numeric not null default 0,
  total          numeric not null default 0,
  payment_method text not null default 'cash',
  status         text not null default 'new',
  channel        text not null default 'pos',
  created_at     timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists menu_sort_idx on public.menu_items (sort);
create index if not exists events_date_idx on public.events (date);
