/**
 * QueueRepository — the data-access contract the sequential calling engine
 * depends on. Both the Supabase-backed repository (production) and the in-memory
 * repository (tests) implement it.
 *
 * The critical method is `claimNextEligibleLead`, which MUST be atomic: it
 * selects one eligible, unlocked lead and flips it to `calling` while creating
 * the call row, in a single transaction. In Postgres this is implemented with
 * `SELECT ... FOR UPDATE SKIP LOCKED`, guaranteeing no two workers (or a worker
 * racing with itself after a restart) ever claim the same lead twice.
 */

import { CallRecord, Campaign, Lead, LeadStatus } from '@/domain/types';
import { EligibilityContext } from '@/domain/eligibility';

export interface ClaimResult {
  lead: Lead;
  call: CallRecord;
}

export interface ActiveCallInfo {
  call: CallRecord;
  lead: Lead;
}

export interface QueueRepository {
  getCampaign(campaignId: string): Promise<Campaign | null>;

  /**
   * The single non-terminal call for a campaign, if one is in flight. The
   * engine uses this to enforce "only one outbound call at a time".
   */
  getActiveCall(campaignId: string): Promise<ActiveCallInfo | null>;

  /** Suppressed numbers (E.164) for eligibility checks. */
  getSuppressedNumbers(): Promise<Set<string>>;

  /**
   * Atomically claim the next eligible lead for a campaign and create its call
   * row (status queued, lead status calling). Returns null if none eligible.
   *
   * Implementations MUST perform this under a row lock / transaction so a lead
   * can never be claimed by two concurrent ticks.
   */
  claimNextEligibleLead(
    campaignId: string,
    ctx: EligibilityContext,
  ): Promise<ClaimResult | null>;

  /** Persist the provider call id + status after the call is placed. */
  markCallPlaced(
    callId: string,
    providerCallId: string,
    status: CallRecord['status'],
  ): Promise<void>;

  /** Persist a failure to even place the call (provider threw). */
  markCallFailedToPlace(callId: string, leadId: string, reason: string): Promise<void>;

  /** Timestamp (ms) the campaign's most recent call reached a terminal state. */
  getLastTerminalAt(campaignId: string): Promise<number | null>;

  /** Mark a campaign as completed (no eligible leads remain). */
  setCampaignStatus(campaignId: string, status: Campaign['status']): Promise<void>;

  /**
   * Restart recovery: find leads stuck in `calling` whose call row is orphaned
   * (no live provider call) and reset them to their prior status so they are
   * neither lost nor double-dialled. Returns the number reset.
   */
  recoverStuckCalls(maxCallAgeSeconds: number): Promise<number>;
}

export interface EngineDeps {
  repo: QueueRepository;
  /** Places the actual call; returns provider call id. */
  placeCall: (claim: ClaimResult, campaign: Campaign) => Promise<{
    providerCallId: string;
    status: CallRecord['status'];
  }>;
  now?: () => number;
}
