-- ============================================================================
-- Demo seed for the database path (optional — the web app ships its own
-- in-browser demo data). Run after 0001_schema.sql and 0002_rls.sql.
-- Creates one business "Aurora Café & Events" with catalog + sample data.
--
-- NOTE: the `users` table links to auth.users. After creating a Supabase auth
-- user, insert a matching row:
--   insert into users (id, business_id, name, email, role)
--   values ('<auth-user-uuid>', '11111111-1111-1111-1111-111111111111',
--           'Ananya Rao', 'ananya@auroracafe.in', 'owner');
-- ============================================================================

insert into businesses (id, name, logo, address, phone, email, gstin)
values ('11111111-1111-1111-1111-111111111111', 'Aurora Café & Events', '🌌',
        '2nd Floor, Lakeview Arcade, MG Road, Bengaluru 560001',
        '+91 98450 11223', 'hello@auroracafe.in', '29ABCDE1234F1Z5')
on conflict (id) do nothing;

insert into settings (business_id, invoice_prefix, quote_prefix, invoice_terms, invoice_footer,
                      tax_inclusive, default_tax_rate, tax_rates, event_types, service_categories)
values ('11111111-1111-1111-1111-111111111111', 'INV-2026-', 'QT-2026-',
        E'1. 50% advance required to confirm the booking.\n2. Balance due before the event date.',
        'Thank you for choosing Aurora.', false, 18,
        '[{"id":"tx0","name":"GST 0%","rate":0},{"id":"tx5","name":"GST 5%","rate":5},{"id":"tx12","name":"GST 12%","rate":12},{"id":"tx18","name":"GST 18%","rate":18}]',
        '["Wedding","Reception","Birthday","Corporate","Anniversary","Engagement","Conference","Private Party"]',
        '["Venue","Food","Decor","Media","Entertainment","Logistics","Staff"]')
on conflict (business_id) do nothing;

-- Categories -----------------------------------------------------------------
insert into categories (business_id, name, icon, sort) values
  ('11111111-1111-1111-1111-111111111111','Coffee','☕',1),
  ('11111111-1111-1111-1111-111111111111','Tea','🍵',2),
  ('11111111-1111-1111-1111-111111111111','Snacks','🥪',3),
  ('11111111-1111-1111-1111-111111111111','Food','🍽️',4),
  ('11111111-1111-1111-1111-111111111111','Desserts','🍰',5),
  ('11111111-1111-1111-1111-111111111111','Beverages','🥤',6),
  ('11111111-1111-1111-1111-111111111111','Other','🧺',7);

-- Products (attach to categories by name) ------------------------------------
insert into products (business_id, category_id, name, sku, image, price, cost, stock, min_stock)
select '11111111-1111-1111-1111-111111111111', c.id, v.name, v.sku, v.image, v.price, v.cost, v.stock, v.min_stock
from (values
  ('Cappuccino','CFE-001','☕',180,55,60,15,'Coffee'),
  ('Cafe Latte','CFE-002','☕',200,62,48,15,'Coffee'),
  ('Espresso','CFE-003','☕',140,40,80,20,'Coffee'),
  ('Cold Brew','CFE-004','🧊',240,70,12,15,'Coffee'),
  ('Masala Chai','TEA-001','🍵',90,22,120,25,'Tea'),
  ('Green Tea','TEA-002','🍵',110,28,40,15,'Tea'),
  ('Veg Sandwich','SNK-001','🥪',160,60,30,10,'Snacks'),
  ('French Fries','SNK-002','🍟',150,45,25,10,'Snacks'),
  ('Margherita Pizza','FOD-001','🍕',320,120,18,8,'Food'),
  ('Pasta Alfredo','FOD-002','🍝',340,130,14,8,'Food'),
  ('Chocolate Brownie','DST-001','🍫',160,55,20,10,'Desserts'),
  ('Cheesecake Slice','DST-002','🍰',220,90,6,8,'Desserts'),
  ('Fresh Lime Soda','BEV-001','🥤',110,25,50,20,'Beverages'),
  ('Mango Smoothie','BEV-002','🥭',190,65,16,10,'Beverages')
) as v(name,sku,image,price,cost,stock,min_stock,cat)
join categories c on c.name = v.cat and c.business_id = '11111111-1111-1111-1111-111111111111';

-- Tables ---------------------------------------------------------------------
insert into cafe_tables (business_id, name, seats, status) values
  ('11111111-1111-1111-1111-111111111111','T1',2,'available'),
  ('11111111-1111-1111-1111-111111111111','T2',2,'available'),
  ('11111111-1111-1111-1111-111111111111','T3',4,'reserved'),
  ('11111111-1111-1111-1111-111111111111','T4',4,'available'),
  ('11111111-1111-1111-1111-111111111111','T5',6,'available'),
  ('11111111-1111-1111-1111-111111111111','Patio 1',4,'available'),
  ('11111111-1111-1111-1111-111111111111','Lounge',8,'available');

-- Packages -------------------------------------------------------------------
insert into event_packages (business_id, name, price, includes, featured) values
  ('11111111-1111-1111-1111-111111111111','Essential',50000,'["Venue (up to 100 guests)","Catering — 3 course","Basic stage decoration"]',false),
  ('11111111-1111-1111-1111-111111111111','Premium',100000,'["Venue (up to 250 guests)","Catering — 5 course","Themed decoration","Photography","Sound system"]',true),
  ('11111111-1111-1111-1111-111111111111','Signature',200000,'["Premium venue","Multi-cuisine catering","Designer decor","Photography + video","DJ + lighting","Coordinator"]',false);

-- Services -------------------------------------------------------------------
insert into event_services (business_id, name, category, unit_price) values
  ('11111111-1111-1111-1111-111111111111','Banquet Venue','Venue',40000),
  ('11111111-1111-1111-1111-111111111111','Lawn Venue','Venue',60000),
  ('11111111-1111-1111-1111-111111111111','Catering (per plate)','Food',650),
  ('11111111-1111-1111-1111-111111111111','Stage Decoration','Decor',25000),
  ('11111111-1111-1111-1111-111111111111','Photography','Media',20000),
  ('11111111-1111-1111-1111-111111111111','Videography','Media',25000),
  ('11111111-1111-1111-1111-111111111111','Sound System','Entertainment',12000),
  ('11111111-1111-1111-1111-111111111111','DJ','Entertainment',22000);

-- Customers ------------------------------------------------------------------
insert into customers (business_id, name, phone, email, address) values
  ('11111111-1111-1111-1111-111111111111','Rahul Sharma','+91 98110 22334','rahul.sharma@gmail.com','Indiranagar, Bengaluru'),
  ('11111111-1111-1111-1111-111111111111','Meera Iyer','+91 99001 55667','meera.iyer@gmail.com','Koramangala, Bengaluru'),
  ('11111111-1111-1111-1111-111111111111','TechNova Pvt Ltd','+91 80410 00011','events@technova.io','Electronic City, Bengaluru');
