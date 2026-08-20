/**
 * MockAIProvider — deterministic, keyword-driven conversation engine for
 * development and tests. It respects the same safety rules as a real model:
 * it never continues past a refusal, honours do-not-call requests, and only
 * flags a transfer on explicit agreement.
 */

import {
  CALLBACK_LINE,
  DECLINE_LINE,
  DO_NOT_CALL_LINE,
  TRANSFER_OFFER_LINE,
} from './script';
import type { AiProvider, AiTurnInput, AiTurnResult } from './provider';

const YES = /\b(yes|yeah|yep|sure|ok(ay)?|interested|go ahead|please do|transfer me|sounds good)\b/i;
const NO = /\b(no|not interested|nope|don'?t|do not|leave me)\b/i;
const DNC = /\b(stop calling|do not call|remove me|never call|unsubscribe|no more calls)\b/i;
const CALLBACK = /\b(call( me)? (back|later)|another time|busy right now|call tomorrow)\b/i;
const HUMAN = /\b(are you (a )?(real|human)|is this a (bot|robot|recording)|am i talking to a machine)\b/i;

export class MockAIProvider implements AiProvider {
  readonly name = 'mock';

  async nextTurn(input: AiTurnInput): Promise<AiTurnResult> {
    const u = input.callerUtterance.trim();

    // Honesty rail: always disclose automated nature when asked.
    if (HUMAN.test(u)) {
      return {
        say: "I'm an automated AI assistant calling on behalf of Infinity Web and Apps. Would you be interested in hearing a little more?",
        outcome: 'continue',
        requestTransfer: false,
      };
    }

    // Do-not-call takes highest priority.
    if (DNC.test(u)) {
      return {
        say: DO_NOT_CALL_LINE,
        outcome: 'do_not_call',
        requestTransfer: false,
        summary: 'Caller requested no further contact. Added to do-not-call list.',
      };
    }

    if (CALLBACK.test(u)) {
      return {
        say: CALLBACK_LINE,
        outcome: 'callback',
        requestTransfer: false,
        callbackTimeText: u,
        summary: 'Caller asked to be called back later.',
      };
    }

    // Refusal — stop immediately, never push.
    if (NO.test(u) && !YES.test(u)) {
      return {
        say: DECLINE_LINE,
        outcome: 'not_interested',
        requestTransfer: false,
        summary: 'Caller not interested. Ended politely.',
      };
    }

    // If we've already offered the transfer and they agreed, transfer.
    const alreadyOfferedTransfer = input.history.some((h) =>
      h.text.includes('connect you with the owner'),
    );
    if (alreadyOfferedTransfer && YES.test(u)) {
      return {
        say: 'Wonderful. Please hold while I connect you to the owner now.',
        outcome: 'interested',
        requestTransfer: true,
        summary: 'Caller interested and agreed to transfer to owner.',
      };
    }

    // Interested in hearing more -> offer the transfer.
    if (YES.test(u)) {
      return {
        say: TRANSFER_OFFER_LINE,
        outcome: 'interested',
        requestTransfer: false,
        summary: 'Caller expressed interest; offered transfer to owner.',
      };
    }

    // Opening turn or unclear response — keep it to the approved pitch once.
    return {
      say: input.history.length === 0
        ? '' // opening line is spoken from the script, handled by the caller
        : 'No problem. Would you like me to connect you with the owner who can share more details?',
      outcome: 'continue',
      requestTransfer: false,
    };
  }
}
