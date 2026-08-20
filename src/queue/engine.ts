/**
 * Sequential calling engine.
 *
 * Design: tick-based, not blocking. Each `processCampaignTick` call moves the
 * campaign forward by at most one action. In production a lightweight worker
 * loop calls this on an interval, and webhooks drive calls to terminal states
 * between ticks. This keeps the engine restart-safe (state lives in the DB) and
 * easy to reason about.
 *
 * Guarantees:
 *  - At most ONE outbound call per campaign at a time (enforced by getActiveCall).
 *  - The next call never starts until the previous call is terminal.
 *  - A configurable delay between calls is honoured.
 *  - Lead claiming is atomic (repository responsibility), so a server restart
 *    can never cause the same lead to be dialled twice.
 */

import { Campaign, CampaignStatus } from '@/domain/types';
import { EligibilityContext } from '@/domain/eligibility';
import { logger } from '@/lib/logger';
import type { EngineDeps } from './repository';

export type TickOutcome =
  | { action: 'not_running'; campaignStatus: CampaignStatus }
  | { action: 'call_in_progress'; callId: string }
  | { action: 'waiting_delay'; remainingSeconds: number }
  | { action: 'call_started'; leadId: string; callId: string; providerCallId: string }
  | { action: 'call_place_failed'; leadId: string; reason: string }
  | { action: 'campaign_completed' };

export interface TickOptions {
  /** Override eligibility settings (recontact policy, max attempts). */
  eligibility?: Partial<EligibilityContext>;
}

export class CampaignEngine {
  constructor(private readonly deps: EngineDeps) {}

  private now(): number {
    return this.deps.now ? this.deps.now() : Date.now();
  }

  /**
   * Advance a campaign by one step. Safe to call concurrently — the repository's
   * atomic claim + single-active-call check prevent double dialling.
   */
  async processCampaignTick(
    campaignId: string,
    options: TickOptions = {},
  ): Promise<TickOutcome> {
    const { repo } = this.deps;
    const campaign = await repo.getCampaign(campaignId);
    if (!campaign) {
      return { action: 'not_running', campaignStatus: CampaignStatus.Stopped };
    }
    if (campaign.status !== CampaignStatus.Running) {
      return { action: 'not_running', campaignStatus: campaign.status };
    }

    // 1. Enforce single active call — do not start another until this is terminal.
    const active = await repo.getActiveCall(campaignId);
    if (active) {
      return { action: 'call_in_progress', callId: active.call.id };
    }

    // 2. Honour the inter-call delay.
    const lastTerminalAt = await repo.getLastTerminalAt(campaignId);
    if (lastTerminalAt != null) {
      const elapsed = (this.now() - lastTerminalAt) / 1000;
      const delay = campaign.delay_between_calls_seconds;
      if (elapsed < delay) {
        return {
          action: 'waiting_delay',
          remainingSeconds: Math.ceil(delay - elapsed),
        };
      }
    }

    // 3. Build the eligibility context.
    const suppressed = await repo.getSuppressedNumbers();
    const ctx: EligibilityContext = {
      suppressedNumbers: suppressed,
      maxAttempts: campaign.max_retries,
      allowRecontact: false,
      now: new Date(this.now()),
      ...options.eligibility,
    };

    // 4. Atomically claim the next eligible lead.
    const claim = await repo.claimNextEligibleLead(campaignId, ctx);
    if (!claim) {
      // A concurrent tick may have just claimed the last eligible lead. Re-check
      // for an active call before declaring the campaign complete, so we never
      // mark a still-dialling campaign as finished.
      const raced = await repo.getActiveCall(campaignId);
      if (raced) {
        return { action: 'call_in_progress', callId: raced.call.id };
      }
      await repo.setCampaignStatus(campaignId, CampaignStatus.Completed);
      logger.info('campaign.completed', { campaignId });
      return { action: 'campaign_completed' };
    }

    // 5. Place the call. On failure, mark the call failed but do NOT throw —
    //    the next tick will advance to the next lead.
    try {
      const placed = await this.deps.placeCall(claim, campaign);
      await repo.markCallPlaced(claim.call.id, placed.providerCallId, placed.status);
      logger.info('call.placed', {
        campaignId,
        leadId: claim.lead.id,
        callId: claim.call.id,
      });
      return {
        action: 'call_started',
        leadId: claim.lead.id,
        callId: claim.call.id,
        providerCallId: placed.providerCallId,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown_error';
      await repo.markCallFailedToPlace(claim.call.id, claim.lead.id, reason);
      logger.error('call.place_failed', { campaignId, leadId: claim.lead.id, reason });
      return { action: 'call_place_failed', leadId: claim.lead.id, reason };
    }
  }

  /** Run once on worker startup to recover from an unclean shutdown. */
  async recover(maxCallAgeSeconds = 300): Promise<number> {
    const n = await this.deps.repo.recoverStuckCalls(maxCallAgeSeconds);
    if (n > 0) logger.warn('queue.recovered_stuck_calls', { count: n });
    return n;
  }
}
