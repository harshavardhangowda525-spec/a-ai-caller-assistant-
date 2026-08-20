/**
 * Call state machine.
 *
 * Guards telephony/AI state transitions so an out-of-order or duplicated
 * webhook cannot drive a call into an impossible state. This is what makes
 * webhook processing safe and idempotent at the domain level.
 */

import { CallStatus, LeadStatus, TransferStatus } from './types';

/** Allowed forward transitions for a call's telephony status. */
const CALL_TRANSITIONS: Record<CallStatus, CallStatus[]> = {
  [CallStatus.Queued]: [CallStatus.Initiated, CallStatus.Failed],
  [CallStatus.Initiated]: [
    CallStatus.Ringing,
    CallStatus.Answered,
    CallStatus.Busy,
    CallStatus.NoAnswer,
    CallStatus.Failed,
  ],
  [CallStatus.Ringing]: [
    CallStatus.Answered,
    CallStatus.Busy,
    CallStatus.NoAnswer,
    CallStatus.Failed,
  ],
  [CallStatus.Answered]: [
    CallStatus.InProgress,
    CallStatus.Completed,
    CallStatus.Failed,
  ],
  [CallStatus.InProgress]: [
    CallStatus.TransferRequested,
    CallStatus.Completed,
    CallStatus.Failed,
  ],
  [CallStatus.TransferRequested]: [
    CallStatus.Transferring,
    CallStatus.TransferFailed,
    CallStatus.Completed,
  ],
  [CallStatus.Transferring]: [
    CallStatus.TransferSuccessful,
    CallStatus.TransferFailed,
  ],
  // Terminal states — no further transitions.
  [CallStatus.TransferSuccessful]: [],
  [CallStatus.TransferFailed]: [CallStatus.Completed],
  [CallStatus.Completed]: [],
  [CallStatus.Busy]: [],
  [CallStatus.NoAnswer]: [],
  [CallStatus.Failed]: [],
};

/**
 * Returns true if `to` is a legal next status from `from`.
 * A self-transition (same status) is treated as an idempotent no-op and allowed.
 */
export function canTransition(from: CallStatus, to: CallStatus): boolean {
  if (from === to) return true;
  return (CALL_TRANSITIONS[from] ?? []).includes(to);
}

export class InvalidCallTransitionError extends Error {
  constructor(
    public readonly from: CallStatus,
    public readonly to: CallStatus,
  ) {
    super(`Invalid call transition: ${from} -> ${to}`);
    this.name = 'InvalidCallTransitionError';
  }
}

export function assertTransition(from: CallStatus, to: CallStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidCallTransitionError(from, to);
  }
}

/** Map a terminal call status to the transfer status it implies (if any). */
export function transferStatusForCall(status: CallStatus): TransferStatus {
  switch (status) {
    case CallStatus.TransferRequested:
      return TransferStatus.Requested;
    case CallStatus.Transferring:
      return TransferStatus.InProgress;
    case CallStatus.TransferSuccessful:
      return TransferStatus.Successful;
    case CallStatus.TransferFailed:
      return TransferStatus.Failed;
    default:
      return TransferStatus.None;
  }
}

/**
 * Map a terminal call status + optional AI-derived outcome to the lead status
 * that should be persisted once the call reaches a terminal state.
 */
export function leadStatusForOutcome(
  callStatus: CallStatus,
  aiOutcome?: 'interested' | 'not_interested' | 'callback' | 'do_not_call',
): LeadStatus {
  // Transfer outcomes take precedence.
  if (callStatus === CallStatus.TransferSuccessful) return LeadStatus.Transferred;

  // AI-derived outcome, when the call actually connected.
  if (aiOutcome === 'interested') return LeadStatus.Interested;
  if (aiOutcome === 'not_interested') return LeadStatus.NotInterested;
  if (aiOutcome === 'callback') return LeadStatus.Callback;
  if (aiOutcome === 'do_not_call') return LeadStatus.DoNotCall;

  switch (callStatus) {
    case CallStatus.Completed:
      return LeadStatus.Completed;
    case CallStatus.TransferFailed:
      // Transfer failed but conversation happened — treat as interested lead
      // that still needs the owner; surfaces on the dashboard as "Failed".
      return LeadStatus.Failed;
    case CallStatus.Busy:
    case CallStatus.NoAnswer:
    case CallStatus.Failed:
      return LeadStatus.Failed;
    default:
      return LeadStatus.Completed;
  }
}
