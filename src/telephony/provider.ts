/**
 * TelephonyProvider — vendor-agnostic interface for placing, controlling, and
 * transferring outbound calls. The rest of the application depends only on this
 * interface; concrete vendors (mock, Twilio, Exotel) implement it.
 *
 * All provider credentials stay server-side. No method here ever returns a raw
 * secret to a caller.
 */

import { CallStatus } from '@/domain/types';

export interface CreateCallParams {
  /** Internal call record id — round-tripped so webhooks are idempotent. */
  callId: string;
  /** Destination number in E.164 (e.g. +919876543210). */
  to: string;
  /** Verified caller ID in E.164. Must pass validateCallerId first. */
  callerId: string;
  /** Absolute URL the provider should call for status webhooks. */
  webhookUrl: string;
  /** Absolute URL that returns the AI voice-app instructions / media stream. */
  voiceAppUrl: string;
  /** Optional free-form metadata echoed back on webhooks. */
  metadata?: Record<string, string>;
}

export interface CreateCallResult {
  providerCallId: string;
  status: CallStatus;
}

export interface TransferCallParams {
  providerCallId: string;
  /** Owner/sales destination in E.164. Read server-side from config. */
  transferTo: string;
  /** Verified caller ID to present on the transfer leg. */
  callerId: string;
}

export interface TransferCallResult {
  ok: boolean;
  status: CallStatus;
  reason?: string;
}

export interface CallStatusResult {
  providerCallId: string;
  status: CallStatus;
  durationSeconds?: number;
}

export interface CallerIdValidation {
  ok: boolean;
  /** True only if the provider confirms the number is registered/verified. */
  verified: boolean;
  reason?: string;
}

/** Normalized webhook event after signature verification & parsing. */
export interface NormalizedWebhookEvent {
  /** Our internal call id (from metadata) when resolvable. */
  callId?: string;
  providerCallId?: string;
  status: CallStatus;
  durationSeconds?: number;
  /** Provider's own event id — used for idempotency dedupe. */
  eventId?: string;
  raw: Record<string, unknown>;
}

export interface WebhookVerifyResult {
  valid: boolean;
  event?: NormalizedWebhookEvent;
  reason?: string;
}

export interface TelephonyProvider {
  readonly name: string;

  /** Place an outbound call. */
  createCall(params: CreateCallParams): Promise<CreateCallResult>;

  /** Poll a call's current status (fallback when webhooks are delayed). */
  getCallStatus(providerCallId: string): Promise<CallStatusResult>;

  /** End a call. */
  hangupCall(providerCallId: string): Promise<void>;

  /** Transfer/bridge the connected call to the owner number. */
  transferCall(params: TransferCallParams): Promise<TransferCallResult>;

  /**
   * Verify the caller ID is legally registered/verified with the provider for
   * the Indian outbound use case. The app never spoofs — if this returns
   * verified=false, dialling is blocked and a configuration error is shown.
   */
  validateCallerId(callerId: string): Promise<CallerIdValidation>;

  /**
   * Verify a webhook signature and normalize the payload. Providers that do not
   * sign natively fall back to a shared-secret HMAC check.
   */
  handleWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookVerifyResult>;
}
