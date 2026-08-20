-- ============================================================================
-- Demo / seed data. Safe to run on a fresh database.
-- Numbers are fictional but valid Indian mobile formats.
-- ============================================================================

-- A demo campaign.
insert into public.campaigns (id, name, status, delay_between_calls_seconds, max_retries)
values ('11111111-1111-1111-1111-111111111111', 'Local Business Outreach — Demo', 'draft', 30, 3)
on conflict (id) do nothing;

-- Suppression list (permanent do-not-call).
insert into public.suppression_list (phone_number, reason, source) values
  ('+919000000001', 'do_not_call', 'seed')
on conflict (phone_number) do nothing;

-- Leads across the full range of eligibility states.
insert into public.leads (business_name, phone_number, business_type, lead_source, consent_status, status) values
  ('ABC Coaching Centre',   '+919876543210', 'Education',  'Website',  'consented', 'pending'),
  ('Sunrise Bakery',        '+919876543211', 'Food',       'Referral', 'consented', 'pending'),
  ('GreenLeaf Grocers',     '+919876543212', 'Retail',     'Ads',      'consented', 'pending'),
  ('Metro Dental Clinic',   '+919876543213', 'Healthcare', 'Website',  'consented', 'pending'),
  ('Rapid Auto Garage',     '+919876543214', 'Automotive', 'Walk-in',  'unknown',   'pending'),
  ('No-Consent Traders',    '+919876543215', 'Retail',     'List',     'no_consent','pending'),
  ('Do-Not-Call Fitness',   '+919000000001', 'Fitness',    'List',     'consented', 'do_not_call')
on conflict (phone_number) do nothing;

-- Attach every lead to the demo campaign in insertion order.
insert into public.campaign_leads (campaign_id, lead_id)
select '11111111-1111-1111-1111-111111111111', l.id
from public.leads l
on conflict (campaign_id, lead_id) do nothing;
