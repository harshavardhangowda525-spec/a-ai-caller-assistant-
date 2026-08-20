/**
 * Lead eligibility rules — the compliance-critical gate that decides whether a
 * lead may be called. Kept pure and framework-free so it is exhaustively
 * testable and impossible to bypass accidentally elsewhere in the app.
 */

import { ConsentStatus, Lead, LeadStatus } from './types';
import { isValidIndianPhone } from '@/lib/phone';

export const IneligibilityReason = {
  DoNotCall: 'do_not_call',
  Suppressed: 'suppressed',
  NoConsent: 'no_consent',
  InvalidNumber: 'invalid_number',
  AlreadyContacted: 'already_contacted',
  MaxAttemptsReached: 'max_attempts_reached',
  CallbackNotDue: 'callback_not_due',
} as const;
export type IneligibilityReason =
  (typeof IneligibilityReason)[keyof typeof IneligibilityReason];

export interface EligibilityContext {
  /** Phone numbers on the permanent suppression / do-not-call list (E.164). */
  suppressedNumbers: Set<string>;
  /**
   * Campaign rule: may a lead already marked "completed"/"not_interested" be
   * dialled again? Default false — respect prior contact outcome.
   */
  allowRecontact?: boolean;
  /** Maximum call attempts permitted per lead. */
  maxAttempts?: number;
  /** Current time, injectable for deterministic tests. */
  now?: Date;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: IneligibilityReason;
}

/**
 * Determine whether a lead is eligible to be called right now.
 *
 * The order of checks is significant: hard compliance blocks (DNC, suppression,
 * consent, invalid number) are evaluated before soft/state-based blocks.
 */
export function evaluateEligibility(
  lead: Lead,
  ctx: EligibilityContext,
): EligibilityResult {
  const now = ctx.now ?? new Date();
  const maxAttempts = ctx.maxAttempts ?? 3;
  const allowRecontact = ctx.allowRecontact ?? false;

  // 1. Hard compliance blocks — never call under any circumstances.
  if (lead.status === LeadStatus.DoNotCall) {
    return { eligible: false, reason: IneligibilityReason.DoNotCall };
  }
  if (ctx.suppressedNumbers.has(lead.phone_number)) {
    return { eligible: false, reason: IneligibilityReason.Suppressed };
  }
  if (lead.consent_status === ConsentStatus.NoConsent) {
    return { eligible: false, reason: IneligibilityReason.NoConsent };
  }
  if (!isValidIndianPhone(lead.phone_number)) {
    return { eligible: false, reason: IneligibilityReason.InvalidNumber };
  }

  // 2. Attempt limits.
  if (lead.call_attempts >= maxAttempts) {
    return { eligible: false, reason: IneligibilityReason.MaxAttemptsReached };
  }

  // 3. Callback scheduling — a scheduled callback in the future is not yet due.
  if (lead.status === LeadStatus.Callback && lead.next_callback_at) {
    const due = new Date(lead.next_callback_at);
    if (due.getTime() > now.getTime()) {
      return { eligible: false, reason: IneligibilityReason.CallbackNotDue };
    }
  }

  // 4. Already-contacted terminal outcomes, unless the campaign allows recontact.
  const contactedStatuses: LeadStatus[] = [
    LeadStatus.Completed,
    LeadStatus.Interested,
    LeadStatus.NotInterested,
    LeadStatus.Transferred,
  ];
  if (!allowRecontact && contactedStatuses.includes(lead.status)) {
    return { eligible: false, reason: IneligibilityReason.AlreadyContacted };
  }

  // A lead currently being called must not be picked up again.
  if (lead.status === LeadStatus.Calling) {
    return { eligible: false, reason: IneligibilityReason.AlreadyContacted };
  }

  return { eligible: true };
}

export function isEligible(lead: Lead, ctx: EligibilityContext): boolean {
  return evaluateEligibility(lead, ctx).eligible;
}
