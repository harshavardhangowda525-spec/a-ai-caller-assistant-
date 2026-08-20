import { describe, expect, it } from 'vitest';
import {
  IneligibilityReason,
  evaluateEligibility,
} from '@/domain/eligibility';
import { ConsentStatus, Lead, LeadStatus } from '@/domain/types';

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l1',
    business_name: 'ABC',
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
    ...overrides,
  };
}

const emptyCtx = { suppressedNumbers: new Set<string>() };

describe('lead eligibility (compliance gate)', () => {
  it('allows a fresh consented lead with a valid number', () => {
    expect(evaluateEligibility(makeLead(), emptyCtx).eligible).toBe(true);
  });

  it('blocks do-not-call status', () => {
    const r = evaluateEligibility(makeLead({ status: LeadStatus.DoNotCall }), emptyCtx);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe(IneligibilityReason.DoNotCall);
  });

  it('blocks suppressed numbers', () => {
    const r = evaluateEligibility(makeLead(), {
      suppressedNumbers: new Set(['+919876543210']),
    });
    expect(r.reason).toBe(IneligibilityReason.Suppressed);
  });

  it('blocks no-consent leads', () => {
    const r = evaluateEligibility(
      makeLead({ consent_status: ConsentStatus.NoConsent }),
      emptyCtx,
    );
    expect(r.reason).toBe(IneligibilityReason.NoConsent);
  });

  it('blocks invalid numbers', () => {
    const r = evaluateEligibility(makeLead({ phone_number: '+9112345' }), emptyCtx);
    expect(r.reason).toBe(IneligibilityReason.InvalidNumber);
  });

  it('blocks already-contacted leads unless recontact allowed', () => {
    const lead = makeLead({ status: LeadStatus.NotInterested });
    expect(evaluateEligibility(lead, emptyCtx).reason).toBe(
      IneligibilityReason.AlreadyContacted,
    );
    expect(
      evaluateEligibility(lead, { ...emptyCtx, allowRecontact: true }).eligible,
    ).toBe(true);
  });

  it('blocks leads over the attempt limit', () => {
    const r = evaluateEligibility(makeLead({ call_attempts: 3 }), {
      ...emptyCtx,
      maxAttempts: 3,
    });
    expect(r.reason).toBe(IneligibilityReason.MaxAttemptsReached);
  });

  it('blocks a callback that is not yet due, allows when due', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(
      evaluateEligibility(
        makeLead({ status: LeadStatus.Callback, next_callback_at: future }),
        emptyCtx,
      ).reason,
    ).toBe(IneligibilityReason.CallbackNotDue);
    expect(
      evaluateEligibility(
        makeLead({ status: LeadStatus.Callback, next_callback_at: past }),
        emptyCtx,
      ).eligible,
    ).toBe(true);
  });

  it('never calls a lead currently being called', () => {
    const r = evaluateEligibility(makeLead({ status: LeadStatus.Calling }), emptyCtx);
    expect(r.eligible).toBe(false);
  });
});
