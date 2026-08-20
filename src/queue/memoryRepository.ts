/**
 * In-memory QueueRepository.
 *
 * Used by the unit-test suite to exercise the engine's sequencing, duplicate
 * prevention, and recovery logic without a database. The atomic-claim contract
 * is honoured here because JavaScript is single-threaded and the claim body is
 * synchronous within the async function — no `await` splits the critical
 * section, so two interleaved ticks cannot claim the same lead.
 */

import { randomUUID } from 'node:crypto';
import {
  CallRecord,
  CallStatus,
  Campaign,
  Lead,
  LeadStatus,
  isTerminalCallStatus,
} from '@/domain/types';
import { EligibilityContext, evaluateEligibility } from '@/domain/eligibility';
import type {
  ActiveCallInfo,
  ClaimResult,
  QueueRepository,
} from './repository';

export class MemoryQueueRepository implements QueueRepository {
  campaigns = new Map<string, Campaign>();
  leads = new Map<string, Lead>();
  calls = new Map<string, CallRecord>();
  suppressed = new Set<string>();
  /** Ordered lead ids per campaign, defining dial order. */
  campaignLeadOrder = new Map<string, string[]>();
  private clock: () => number;

  constructor(now: () => number = () => Date.now()) {
    this.clock = now;
  }

  private ts(): string {
    return new Date(this.clock()).toISOString();
  }

  addCampaign(c: Partial<Campaign> & { id?: string }): Campaign {
    const campaign: Campaign = {
      id: c.id ?? randomUUID(),
      name: c.name ?? 'Campaign',
      status: c.status ?? 'running',
      delay_between_calls_seconds: c.delay_between_calls_seconds ?? 0,
      max_retries: c.max_retries ?? 3,
      created_at: this.ts(),
      updated_at: this.ts(),
    };
    this.campaigns.set(campaign.id, campaign);
    if (!this.campaignLeadOrder.has(campaign.id)) {
      this.campaignLeadOrder.set(campaign.id, []);
    }
    return campaign;
  }

  addLead(campaignId: string, l: Partial<Lead> & { phone_number: string }): Lead {
    const lead: Lead = {
      id: l.id ?? randomUUID(),
      business_name: l.business_name ?? 'Business',
      phone_number: l.phone_number,
      business_type: l.business_type ?? null,
      lead_source: l.lead_source ?? null,
      consent_status: l.consent_status ?? 'consented',
      status: l.status ?? LeadStatus.Pending,
      call_attempts: l.call_attempts ?? 0,
      last_called_at: l.last_called_at ?? null,
      next_callback_at: l.next_callback_at ?? null,
      call_result: l.call_result ?? null,
      notes: l.notes ?? null,
      created_at: this.ts(),
      updated_at: this.ts(),
    };
    this.leads.set(lead.id, lead);
    const order = this.campaignLeadOrder.get(campaignId) ?? [];
    order.push(lead.id);
    this.campaignLeadOrder.set(campaignId, order);
    return lead;
  }

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    return this.campaigns.get(campaignId) ?? null;
  }

  async getActiveCall(campaignId: string): Promise<ActiveCallInfo | null> {
    for (const call of this.calls.values()) {
      if (call.campaign_id === campaignId && !isTerminalCallStatus(call.status)) {
        const lead = this.leads.get(call.lead_id);
        if (lead) return { call, lead };
      }
    }
    return null;
  }

  async getSuppressedNumbers(): Promise<Set<string>> {
    return new Set(this.suppressed);
  }

  async claimNextEligibleLead(
    campaignId: string,
    ctx: EligibilityContext,
  ): Promise<ClaimResult | null> {
    const order = this.campaignLeadOrder.get(campaignId) ?? [];
    // Critical section: no awaits between find and mutate.
    for (const leadId of order) {
      const lead = this.leads.get(leadId);
      if (!lead) continue;
      const result = evaluateEligibility(lead, ctx);
      if (!result.eligible) continue;

      // Claim: flip lead to calling + create call row.
      lead.status = LeadStatus.Calling;
      lead.call_attempts += 1;
      lead.last_called_at = this.ts();
      lead.updated_at = this.ts();

      const call: CallRecord = {
        id: randomUUID(),
        lead_id: lead.id,
        campaign_id: campaignId,
        provider_call_id: null,
        status: CallStatus.Queued,
        ai_state: 'idle',
        transfer_status: 'none',
        started_at: this.ts(),
        answered_at: null,
        ended_at: null,
        duration_seconds: null,
        ai_summary: null,
        recording_status: 'disabled',
        created_at: this.ts(),
        updated_at: this.ts(),
      };
      this.calls.set(call.id, call);
      return { lead, call };
    }
    return null;
  }

  async markCallPlaced(
    callId: string,
    providerCallId: string,
    status: CallStatus,
  ): Promise<void> {
    const call = this.calls.get(callId);
    if (call) {
      call.provider_call_id = providerCallId;
      call.status = status;
      call.updated_at = this.ts();
    }
  }

  async markCallFailedToPlace(
    callId: string,
    leadId: string,
    reason: string,
  ): Promise<void> {
    const call = this.calls.get(callId);
    if (call) {
      call.status = CallStatus.Failed;
      call.ended_at = this.ts();
      call.ai_summary = `Failed to place call: ${reason}`;
      call.updated_at = this.ts();
    }
    const lead = this.leads.get(leadId);
    if (lead) {
      lead.status = LeadStatus.Failed;
      lead.call_result = reason;
      lead.updated_at = this.ts();
    }
  }

  async getLastTerminalAt(campaignId: string): Promise<number | null> {
    let latest: number | null = null;
    for (const call of this.calls.values()) {
      if (call.campaign_id === campaignId && isTerminalCallStatus(call.status) && call.ended_at) {
        const t = new Date(call.ended_at).getTime();
        if (latest == null || t > latest) latest = t;
      }
    }
    return latest;
  }

  async setCampaignStatus(campaignId: string, status: Campaign['status']): Promise<void> {
    const c = this.campaigns.get(campaignId);
    if (c) {
      c.status = status;
      c.updated_at = this.ts();
    }
  }

  async recoverStuckCalls(maxCallAgeSeconds: number): Promise<number> {
    let count = 0;
    const cutoff = this.clock() - maxCallAgeSeconds * 1000;
    for (const call of this.calls.values()) {
      const isOrphan =
        !isTerminalCallStatus(call.status) &&
        call.provider_call_id == null &&
        call.started_at != null &&
        new Date(call.started_at).getTime() < cutoff;
      if (isOrphan) {
        call.status = CallStatus.Failed;
        call.ended_at = this.ts();
        call.ai_summary = 'Recovered after unclean shutdown.';
        const lead = this.leads.get(call.lead_id);
        if (lead && lead.status === LeadStatus.Calling) {
          // Reset to pending so it can be retried within attempt limits.
          lead.status = LeadStatus.Pending;
          lead.updated_at = this.ts();
        }
        count += 1;
      }
    }
    return count;
  }

  // --- Test helpers -------------------------------------------------------

  /** Simulate a call reaching a terminal state (as a webhook would). */
  completeCall(callId: string, status: CallStatus, leadStatus: LeadStatus) {
    const call = this.calls.get(callId);
    if (!call) return;
    call.status = status;
    call.ended_at = this.ts();
    call.updated_at = this.ts();
    const lead = this.leads.get(call.lead_id);
    if (lead) {
      lead.status = leadStatus;
      lead.updated_at = this.ts();
    }
  }
}
