-- Row Level Security. Public (anon) may READ published catalog content only.
-- Orders are never exposed to anon. All writes use the service role key,
-- which bypasses RLS entirely — so no write policies are needed here.

alter table public.menu_items enable row level security;
alter table public.events enable row level security;
alter table public.gallery enable row level security;
alter table public.site_content enable row level security;
alter table public.orders enable row level security;

-- MENU: anyone can read available items
drop policy if exists "menu public read" on public.menu_items;
create policy "menu public read" on public.menu_items
  for select using (available = true);

-- EVENTS: anyone can read published events
drop policy if exists "events public read" on public.events;
create policy "events public read" on public.events
  for select using (published = true);

-- GALLERY: fully public read
drop policy if exists "gallery public read" on public.gallery;
create policy "gallery public read" on public.gallery
  for select using (true);

-- SITE CONTENT: fully public read
drop policy if exists "content public read" on public.site_content;
create policy "content public read" on public.site_content
  for select using (true);

-- ORDERS: no anon policy => no anon access. Only the service role can touch it.
