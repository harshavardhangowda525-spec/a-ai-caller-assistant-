import { describe, expect, it, beforeEach } from 'vitest';
import { CampaignEngine } from '@/queue/engine';
import { MemoryQueueRepository } from '@/queue/memoryRepository';
import { CallStatus, CampaignStatus, LeadStatus } from '@/domain/types';
import type { ClaimResult } from '@/queue/repository';

let clock = 0;
const now = () => clock;

function buildEngine(repo: MemoryQueueRepository, placeCallImpl?: (c: ClaimResult) => Promise<{ providerCallId: string; status: CallStatus }>) {
  return new CampaignEngine({
    repo,
    now,
    placeCall: placeCallImpl
      ? (claim) => placeCallImpl(claim)
      : async (claim) => ({ providerCallId: `prov-${claim.call.id}`, status: CallStatus.Ringing }),
  });
}

describe('sequential calling engine', () => {
  beforeEach(() => {
    clock = 1_000_000;
  });

  it('starts exactly one call per tick and not the next until terminal', async () => {
    const repo = new MemoryQueueRepository(now);
    const campaign = repo.addCampaign({ delay_between_calls_seconds: 0 });
    repo.addLead(campaign.id, { phone_number: '+919876543210', business_name: 'A' });
    repo.addLead(campaign.id, { phone_number: '+919876543211', business_name: 'B' });
    const engine = buildEngine(repo);

    const t1 = await engine.processCampaignTick(campaign.id);
    expect(t1.action).toBe('call_started');

    // Second tick while first call is still active -> must NOT start a new call.
    const t2 = await engine.processCampaignTick(campaign.id);
    expect(t2.action).toBe('call_in_progress');

    // Complete the first call, then the next tick starts the second lead.
    const activeCallId = (t1 as { callId: string }).callId;
    repo.completeCall(activeCallId, CallStatus.Completed, LeadStatus.Completed);
    const t3 = await engine.processCampaignTick(campaign.id);
    expect(t3.action).toBe('call_started');
    expect((t3 as { leadId: string }).leadId).not.toBe((t1 as { leadId: string }).leadId);
  });

  it('never dials the same lead twice even across interleaved ticks (duplicate prevention)', async () => {
    const repo = new MemoryQueueRepository(now);
    const campaign = repo.addCampaign({ delay_between_calls_seconds: 0 });
    repo.addLead(campaign.id, { phone_number: '+919876543210' });
    const engine = buildEngine(repo);

    // Fire two ticks "concurrently"; only one should claim the single lead.
    const [a, b] = await Promise.all([
      engine.processCampaignTick(campaign.id),
      engine.processCampaignTick(campaign.id),
    ]);
    const actions = [a.action, b.action].sort();
    expect(actions).toEqual(['call_in_progress', 'call_started']);
    // Only one call row created.
    expect(repo.calls.size).toBe(1);
  });

  it('honours the configurable inter-call delay', async () => {
    const repo = new MemoryQueueRepository(now);
    const campaign = repo.addCampaign({ delay_between_calls_seconds: 30 });
    repo.addLead(campaign.id, { phone_number: '+919876543210' });
    repo.addLead(campaign.id, { phone_number: '+919876543211' });
    const engine = buildEngine(repo);

    const t1 = await engine.processCampaignTick(campaign.id);
    repo.completeCall((t1 as { callId: string }).callId, CallStatus.Completed, LeadStatus.Completed);

    // Immediately after completion -> waiting for delay.
    const t2 = await engine.processCampaignTick(campaign.id);
    expect(t2.action).toBe('waiting_delay');

    // Advance clock past the delay.
    clock += 30_000;
    const t3 = await engine.processCampaignTick(campaign.id);
    expect(t3.action).toBe('call_started');
  });

  it('completes the campaign when no eligible leads remain', async () => {
    const repo = new MemoryQueueRepository(now);
    const campaign = repo.addCampaign({ delay_between_calls_seconds: 0 });
    repo.addLead(campaign.id, { phone_number: '+919876543210', status: LeadStatus.DoNotCall });
    const engine = buildEngine(repo);

    const t = await engine.processCampaignTick(campaign.id);
    expect(t.action).toBe('campaign_completed');
    expect((await repo.getCampaign(campaign.id))?.status).toBe(CampaignStatus.Completed);
  });

  it('does not run a paused campaign', async () => {
    const repo = new MemoryQueueRepository(now);
    const campaign = repo.addCampaign({ status: CampaignStatus.Paused });
    repo.addLead(campaign.id, { phone_number: '+919876543210' });
    const engine = buildEngine(repo);
    const t = await engine.processCampaignTick(campaign.id);
    expect(t.action).toBe('not_running');
  });

  it('marks the call failed (not thrown) when the provider fails to place it', async () => {
    const repo = new MemoryQueueRepository(now);
    const campaign = repo.addCampaign({ delay_between_calls_seconds: 0 });
    repo.addLead(campaign.id, { phone_number: '+919876543210' });
    const engine = buildEngine(repo, async () => {
      throw new Error('provider_outage');
    });
    const t = await engine.processCampaignTick(campaign.id);
    expect(t.action).toBe('call_place_failed');
    expect((t as { reason: string }).reason).toBe('provider_outage');
  });

  it('recovers orphaned calls after a simulated restart without double-dialling', async () => {
    const repo = new MemoryQueueRepository(now);
    const campaign = repo.addCampaign({ delay_between_calls_seconds: 0 });
    const lead = repo.addLead(campaign.id, { phone_number: '+919876543210' });

    // Simulate a claim that never got a provider id (crash mid-place).
    await repo.claimNextEligibleLead(campaign.id, { suppressedNumbers: new Set() });
    expect(repo.leads.get(lead.id)?.status).toBe(LeadStatus.Calling);

    // Advance beyond the recovery window and recover.
    clock += 600_000;
    const engine = buildEngine(repo);
    const recovered = await engine.recover(300);
    expect(recovered).toBe(1);
    // Lead reset to pending, attempts already incremented once (not re-dialled yet).
    expect(repo.leads.get(lead.id)?.status).toBe(LeadStatus.Pending);
  });
});
