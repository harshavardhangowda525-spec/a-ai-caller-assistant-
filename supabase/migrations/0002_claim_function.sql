-- ============================================================================
-- Atomic lead-claim function.
--
-- This is the concurrency-safety core of the sequential calling engine. It
-- selects one eligible lead for a campaign, locks it with FOR UPDATE SKIP
-- LOCKED (so a concurrent worker / a worker racing itself after a restart can
-- never grab the same row), flips it to `calling`, and inserts the call row —
-- all in one transaction. Returns the created call id + lead id, or nothing.
-- ============================================================================

create or replace function public.claim_next_lead(
  p_campaign_id uuid,
  p_max_attempts int,
  p_allow_recontact boolean,
  p_now timestamptz default now()
)
returns table (call_id uuid, lead_id uuid)
language plpgsql
as $$
declare
  v_lead public.leads%rowtype;
  v_call_id uuid;
begin
  -- Guard: never start a second call while one is already active for this campaign.
  if exists (
    select 1 from public.calls c
     where c.campaign_id = p_campaign_id
       and c.status not in ('transfer_successful','transfer_failed','completed','busy','no_answer','failed')
  ) then
    return;
  end if;

  select l.* into v_lead
    from public.leads l
    join public.campaign_leads cl on cl.lead_id = l.id
   where cl.campaign_id = p_campaign_id
     -- Hard compliance blocks
     and l.status <> 'do_not_call'
     and l.consent_status <> 'no_consent'
     and not exists (select 1 from public.suppression_list s where s.phone_number = l.phone_number)
     -- Mobile number shape (Indian E.164) — a coarse guard; app validates fully
     and l.phone_number ~ '^\+91[6-9][0-9]{9}$'
     -- Attempt limit
     and l.call_attempts < p_max_attempts
     -- Not currently being called
     and l.status <> 'calling'
     -- Callback not yet due
     and (l.status <> 'callback' or l.next_callback_at is null or l.next_callback_at <= p_now)
     -- Already-contacted terminal outcomes are skipped unless recontact allowed
     and (
       p_allow_recontact
       or l.status not in ('completed','interested','not_interested','transferred')
     )
   order by cl.dial_order asc
   for update of l skip locked
   limit 1;

  if not found then
    return;
  end if;

  update public.leads
     set status = 'calling',
         call_attempts = call_attempts + 1,
         last_called_at = p_now
   where id = v_lead.id;

  insert into public.calls (lead_id, campaign_id, status, ai_state, transfer_status, started_at, recording_status)
  values (v_lead.id, p_campaign_id, 'queued', 'idle', 'none', p_now, 'disabled')
  returning id into v_call_id;

  call_id := v_call_id;
  lead_id := v_lead.id;
  return next;
end $$;
