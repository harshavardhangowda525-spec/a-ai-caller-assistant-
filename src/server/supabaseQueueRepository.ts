import 'server-only';

/**
 * Supabase-backed QueueRepository. Wraps the admin client and the atomic
 * claim_next_lead() RPC so the engine's concurrency guarantees hold against a
 * real Postgres database.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CallRecord,
  CallStatus,
  Campaign,
  Lead,
  LeadStatus,
} from '@/domain/types';
import { EligibilityContext } from '@/domain/eligibility';
import type {
  ActiveCallInfo,
  ClaimResult,
  QueueRepository,
} from '@/queue/repository';
import { getAdminClient } from '@/lib/supabase/admin';

const NON_TERMINAL_CALL_STATUSES = [
  'queued',
  'initiated',
  'ringing',
  'answered',
  'in_progress',
  'transfer_requested',
  'transferring',
];

export class SupabaseQueueRepository implements QueueRepository {
  constructor(private readonly db: SupabaseClient = getAdminClient()) {}

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    const { data } = await this.db
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();
    return (data as Campaign) ?? null;
  }

  async getActiveCall(campaignId: string): Promise<ActiveCallInfo | null> {
    const { data } = await this.db
      .from('calls')
      .select('*, lead:leads(*)')
      .eq('campaign_id', campaignId)
      .in('status', NON_TERMINAL_CALL_STATUSES)
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    const { lead, ...call } = data as CallRecord & { lead: Lead };
    return { call: call as CallRecord, lead };
  }

  async getSuppressedNumbers(): Promise<Set<string>> {
    const { data } = await this.db.from('suppression_list').select('phone_number');
    return new Set((data ?? []).map((r: { phone_number: string }) => r.phone_number));
  }

  async claimNextEligibleLead(
    campaignId: string,
    ctx: EligibilityContext,
  ): Promise<ClaimResult | null> {
    const { data, error } = await this.db.rpc('claim_next_lead', {
      p_campaign_id: campaignId,
      p_max_attempts: ctx.maxAttempts ?? 3,
      p_allow_recontact: ctx.allowRecontact ?? false,
      p_now: (ctx.now ?? new Date()).toISOString(),
    });
    if (error) throw new Error(`claim_next_lead failed: ${error.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.call_id) return null;

    const [{ data: lead }, { data: call }] = await Promise.all([
      this.db.from('leads').select('*').eq('id', row.lead_id).single(),
      this.db.from('calls').select('*').eq('id', row.call_id).single(),
    ]);
    return { lead: lead as Lead, call: call as CallRecord };
  }

  async markCallPlaced(
    callId: string,
    providerCallId: string,
    status: CallStatus,
  ): Promise<void> {
    await this.db
      .from('calls')
      .update({ provider_call_id: providerCallId, status })
      .eq('id', callId);
  }

  async markCallFailedToPlace(
    callId: string,
    leadId: string,
    reason: string,
  ): Promise<void> {
    await this.db
      .from('calls')
      .update({
        status: 'failed',
        ended_at: new Date().toISOString(),
        ai_summary: `Failed to place call: ${reason}`,
      })
      .eq('id', callId);
    await this.db
      .from('leads')
      .update({ status: 'failed', call_result: reason })
      .eq('id', leadId);
  }

  async getLastTerminalAt(campaignId: string): Promise<number | null> {
    const { data } = await this.db
      .from('calls')
      .select('ended_at')
      .eq('campaign_id', campaignId)
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.ended_at ? new Date(data.ended_at).getTime() : null;
  }

  async setCampaignStatus(
    campaignId: string,
    status: Campaign['status'],
  ): Promise<void> {
    await this.db.from('campaigns').update({ status }).eq('id', campaignId);
  }

  async recoverStuckCalls(maxCallAgeSeconds: number): Promise<number> {
    const cutoff = new Date(Date.now() - maxCallAgeSeconds * 1000).toISOString();
    // Orphaned calls: non-terminal, no provider id, older than the window.
    const { data: stuck } = await this.db
      .from('calls')
      .select('id, lead_id')
      .is('provider_call_id', null)
      .in('status', NON_TERMINAL_CALL_STATUSES)
      .lt('started_at', cutoff);

    const rows = (stuck ?? []) as Array<{ id: string; lead_id: string }>;
    for (const r of rows) {
      await this.db
        .from('calls')
        .update({
          status: 'failed',
          ended_at: new Date().toISOString(),
          ai_summary: 'Recovered after unclean shutdown.',
        })
        .eq('id', r.id);
      await this.db
        .from('leads')
        .update({ status: 'pending' })
        .eq('id', r.lead_id)
        .eq('status', 'calling');
    }
    return rows.length;
  }
}
