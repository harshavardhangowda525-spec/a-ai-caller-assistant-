import 'server-only';

/**
 * Read-side query helpers for server components. These use the request-scoped
 * server client (RLS enforced by the signed-in user's session).
 */

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { CallRecord, Campaign, Lead, LeadStatus } from '@/domain/types';

export { isSupabaseConfigured };

export interface DashboardStats {
  totalLeads: number;
  eligibleLeads: number;
  callsCompleted: number;
  currentlyCalling: number;
  interested: number;
  notInterested: number;
  callbacks: number;
  transferred: number;
  failed: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = createClient();
  const { data } = await db.from('leads').select('status');
  const leads = (data ?? []) as Array<{ status: LeadStatus }>;
  const count = (s: LeadStatus) => leads.filter((l) => l.status === s).length;

  const nonEligibleStatuses: LeadStatus[] = [
    'do_not_call',
    'not_interested',
    'completed',
    'interested',
    'transferred',
    'calling',
  ];

  return {
    totalLeads: leads.length,
    eligibleLeads: leads.filter((l) => !nonEligibleStatuses.includes(l.status)).length,
    callsCompleted: count('completed') + count('interested') + count('not_interested') + count('transferred'),
    currentlyCalling: count('calling'),
    interested: count('interested'),
    notInterested: count('not_interested'),
    callbacks: count('callback'),
    transferred: count('transferred'),
    failed: count('failed'),
  };
}

export async function listLeads(limit = 200): Promise<Lead[]> {
  const db = createClient();
  const { data } = await db
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as Lead[];
}

export async function listCampaigns(): Promise<Campaign[]> {
  const db = createClient();
  const { data } = await db
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as Campaign[];
}

export interface CallWithLead extends CallRecord {
  lead: Lead | null;
}

export async function listCalls(limit = 200): Promise<CallWithLead[]> {
  const db = createClient();
  const { data } = await db
    .from('calls')
    .select('*, lead:leads(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as CallWithLead[];
}

export async function listLiveCalls(): Promise<CallWithLead[]> {
  const db = createClient();
  const { data } = await db
    .from('calls')
    .select('*, lead:leads(*)')
    .in('status', [
      'queued',
      'initiated',
      'ringing',
      'answered',
      'in_progress',
      'transfer_requested',
      'transferring',
    ])
    .order('started_at', { ascending: false });
  return (data ?? []) as CallWithLead[];
}

export async function listCallbacks() {
  const db = createClient();
  const { data } = await db
    .from('callbacks')
    .select('*, lead:leads(*)')
    .order('scheduled_at', { ascending: true });
  return data ?? [];
}

export async function listSuppression() {
  const db = createClient();
  const { data } = await db
    .from('suppression_list')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getSettings(): Promise<Record<string, unknown>> {
  const db = createClient();
  const { data } = await db.from('settings').select('key, value');
  const out: Record<string, unknown> = {};
  for (const row of (data ?? []) as Array<{ key: string; value: unknown }>) {
    out[row.key] = row.value;
  }
  return out;
}

export async function getCurrentUserEmail(): Promise<string | undefined> {
  const db = createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  return user?.email;
}

export interface CampaignPreflight {
  campaignId: string;
  total: number;
  eligible: number;
  suppressed: number;
  invalid: number;
  noConsent: number;
  doNotCall: number;
}

/**
 * Pre-flight summary shown on the Start confirmation screen: how many attached
 * leads are eligible, suppressed, invalid, etc. Uses the same eligibility rules
 * as the engine.
 */
export async function getCampaignPreflight(
  campaignId: string,
): Promise<CampaignPreflight> {
  const db = createClient();
  const [{ data: rows }, { data: supp }] = await Promise.all([
    db
      .from('campaign_leads')
      .select('lead:leads(*)')
      .eq('campaign_id', campaignId),
    db.from('suppression_list').select('phone_number'),
  ]);
  const suppressed = new Set(
    (supp ?? []).map((s: { phone_number: string }) => s.phone_number),
  );
  const leads = ((rows ?? []) as Array<{ lead: Lead | Lead[] | null }>)
    .map((r) => (Array.isArray(r.lead) ? r.lead[0] ?? null : r.lead))
    .filter((l): l is Lead => Boolean(l));

  const { evaluateEligibility } = await import('@/domain/eligibility');
  let eligible = 0;
  let suppCount = 0;
  let invalid = 0;
  let noConsent = 0;
  let dnc = 0;
  for (const lead of leads) {
    const res = evaluateEligibility(lead, { suppressedNumbers: suppressed });
    if (res.eligible) eligible++;
    else if (res.reason === 'suppressed') suppCount++;
    else if (res.reason === 'invalid_number') invalid++;
    else if (res.reason === 'no_consent') noConsent++;
    else if (res.reason === 'do_not_call') dnc++;
  }
  return {
    campaignId,
    total: leads.length,
    eligible,
    suppressed: suppCount,
    invalid,
    noConsent,
    doNotCall: dnc,
  };
}

/** Calls grouped by day for the last N days (for the "calls per day" chart). */
export async function callsPerDay(days = 7): Promise<Array<{ day: string; count: number }>> {
  const db = createClient();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await db
    .from('calls')
    .select('created_at')
    .gte('created_at', since);
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    buckets.set(d, 0);
  }
  for (const row of (data ?? []) as Array<{ created_at: string }>) {
    const d = row.created_at.slice(0, 10);
    if (buckets.has(d)) buckets.set(d, (buckets.get(d) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([day, count]) => ({ day: day.slice(5), count }));
}
