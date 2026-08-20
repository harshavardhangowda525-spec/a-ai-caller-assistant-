import { describe, expect, it } from 'vitest';
import { MemoryQueueRepository } from '@/queue/memoryRepository';
import { CampaignEngine } from '@/queue/engine';
import { evaluateEligibility, IneligibilityReason } from '@/domain/eligibility';
import { ConsentStatus, LeadStatus } from '@/domain/types';

describe('permanent suppression / do-not-call list', () => {
  it('a suppressed number is never claimed by the engine', async () => {
    const repo = new MemoryQueueRepository();
    const campaign = repo.addCampaign({ delay_between_calls_seconds: 0 });
    repo.addLead(campaign.id, { phone_number: '+919876543210' });
    repo.suppressed.add('+919876543210');

    const engine = new CampaignEngine({
      repo,
      placeCall: async (c) => ({ providerCallId: c.call.id, status: 'ringing' as never }),
    });

    const t = await engine.processCampaignTick(campaign.id);
    // Only lead is suppressed -> nothing eligible -> campaign completes.
    expect(t.action).toBe('campaign_completed');
    expect(repo.calls.size).toBe(0);
  });

  it('do-not-call request adds the number and blocks future calls', () => {
    const suppressed = new Set<string>();
    const lead = {
      id: 'l1',
      business_name: 'A',
      phone_number: '+919876543210',
      business_type: null,
      lead_source: null,
      consent_status: ConsentStatus.Consented,
      status: LeadStatus.Pending,
      call_attempts: 0,
      last_called_at: null,
      next_callback_at: null,
      call_result: null,
      notes: null,
      created_at: '',
      updated_at: '',
    };
    // Before suppression: eligible.
    expect(evaluateEligibility(lead, { suppressedNumbers: suppressed }).eligible).toBe(true);

    // Caller asks for no further calls -> add to suppression list.
    suppressed.add(lead.phone_number);

    const after = evaluateEligibility(lead, { suppressedNumbers: suppressed });
    expect(after.eligible).toBe(false);
    expect(after.reason).toBe(IneligibilityReason.Suppressed);
  });
});
