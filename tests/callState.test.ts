import { describe, expect, it } from 'vitest';
import {
  assertTransition,
  canTransition,
  leadStatusForOutcome,
  transferStatusForCall,
} from '@/domain/callState';
import { CallStatus, LeadStatus, TransferStatus } from '@/domain/types';

describe('call state machine', () => {
  it('allows valid forward transitions', () => {
    expect(canTransition(CallStatus.Queued, CallStatus.Initiated)).toBe(true);
    expect(canTransition(CallStatus.Initiated, CallStatus.Ringing)).toBe(true);
    expect(canTransition(CallStatus.Ringing, CallStatus.Answered)).toBe(true);
    expect(canTransition(CallStatus.Answered, CallStatus.InProgress)).toBe(true);
    expect(canTransition(CallStatus.InProgress, CallStatus.TransferRequested)).toBe(true);
    expect(canTransition(CallStatus.Transferring, CallStatus.TransferSuccessful)).toBe(true);
  });

  it('rejects illegal transitions', () => {
    expect(canTransition(CallStatus.Completed, CallStatus.Ringing)).toBe(false);
    expect(canTransition(CallStatus.Queued, CallStatus.TransferSuccessful)).toBe(false);
    expect(() =>
      assertTransition(CallStatus.Completed, CallStatus.Answered),
    ).toThrow();
  });

  it('treats a self-transition as an idempotent no-op (safe for duplicate webhooks)', () => {
    expect(canTransition(CallStatus.Ringing, CallStatus.Ringing)).toBe(true);
    expect(canTransition(CallStatus.Completed, CallStatus.Completed)).toBe(true);
  });

  it('maps call status to transfer status', () => {
    expect(transferStatusForCall(CallStatus.TransferRequested)).toBe(TransferStatus.Requested);
    expect(transferStatusForCall(CallStatus.Transferring)).toBe(TransferStatus.InProgress);
    expect(transferStatusForCall(CallStatus.TransferSuccessful)).toBe(TransferStatus.Successful);
    expect(transferStatusForCall(CallStatus.TransferFailed)).toBe(TransferStatus.Failed);
    expect(transferStatusForCall(CallStatus.Completed)).toBe(TransferStatus.None);
  });

  it('maps terminal outcomes to lead statuses', () => {
    expect(leadStatusForOutcome(CallStatus.TransferSuccessful)).toBe(LeadStatus.Transferred);
    expect(leadStatusForOutcome(CallStatus.Completed, 'interested')).toBe(LeadStatus.Interested);
    expect(leadStatusForOutcome(CallStatus.Completed, 'not_interested')).toBe(
      LeadStatus.NotInterested,
    );
    expect(leadStatusForOutcome(CallStatus.Completed, 'callback')).toBe(LeadStatus.Callback);
    expect(leadStatusForOutcome(CallStatus.Completed, 'do_not_call')).toBe(LeadStatus.DoNotCall);
    expect(leadStatusForOutcome(CallStatus.NoAnswer)).toBe(LeadStatus.Failed);
    expect(leadStatusForOutcome(CallStatus.Completed)).toBe(LeadStatus.Completed);
  });
});
