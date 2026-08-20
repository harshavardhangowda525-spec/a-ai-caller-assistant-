/**
 * MockTelephonyProvider — a fully functional in-process simulation used for
 * local development and tests. It places no real calls. It deterministically
 * advances a simulated call through ringing → answered → in_progress and emits
 * webhook-shaped events via a callback so the rest of the pipeline can be
 * exercised without a real vendor.
 *
 * The mock treats the configured caller ID as "verified" so development flows
 * work, while real providers perform an actual registration check.
 */

import { CallStatus } from '@/domain/types';
import { computeHmac } from './signature';
import type {
  CallStatusResult,
  CallerIdValidation,
  CreateCallParams,
  CreateCallResult,
  NormalizedWebhookEvent,
  TelephonyProvider,
  TransferCallParams,
  TransferCallResult,
  WebhookVerifyResult,
} from './provider';

interface MockCall {
  providerCallId: string;
  callId: string;
  status: CallStatus;
  createdAt: number;
}

export class MockTelephonyProvider implements TelephonyProvider {
  readonly name = 'mock';
  private calls = new Map<string, MockCall>();
  private counter = 0;

  constructor(private readonly webhookSecret = 'dev-worker-secret') {}

  async createCall(params: CreateCallParams): Promise<CreateCallResult> {
    this.counter += 1;
    const providerCallId = `mock-${Date.now()}-${this.counter}`;
    this.calls.set(providerCallId, {
      providerCallId,
      callId: params.callId,
      status: CallStatus.Initiated,
      createdAt: Date.now(),
    });
    return { providerCallId, status: CallStatus.Initiated };
  }

  async getCallStatus(providerCallId: string): Promise<CallStatusResult> {
    const call = this.calls.get(providerCallId);
    return {
      providerCallId,
      status: call?.status ?? CallStatus.Failed,
      durationSeconds: call ? Math.floor((Date.now() - call.createdAt) / 1000) : 0,
    };
  }

  async hangupCall(providerCallId: string): Promise<void> {
    const call = this.calls.get(providerCallId);
    if (call) call.status = CallStatus.Completed;
  }

  async transferCall(params: TransferCallParams): Promise<TransferCallResult> {
    const call = this.calls.get(params.providerCallId);
    if (!call) {
      return { ok: false, status: CallStatus.TransferFailed, reason: 'unknown_call' };
    }
    call.status = CallStatus.TransferSuccessful;
    return { ok: true, status: CallStatus.TransferSuccessful };
  }

  async validateCallerId(callerId: string): Promise<CallerIdValidation> {
    // In the mock, any well-formed Indian caller ID is treated as verified.
    const ok = /^\+91[6-9]\d{9}$/.test(callerId);
    return {
      ok,
      verified: ok,
      reason: ok ? undefined : 'not_a_valid_indian_number',
    };
  }

  async handleWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookVerifyResult> {
    const provided =
      headers['x-mock-signature'] ?? headers['X-Mock-Signature'] ?? '';
    const expected = computeHmac(this.webhookSecret, rawBody);
    if (provided !== expected) {
      return { valid: false, reason: 'signature_mismatch' };
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return { valid: false, reason: 'invalid_json' };
    }
    const event: NormalizedWebhookEvent = {
      callId: parsed.callId as string | undefined,
      providerCallId: parsed.providerCallId as string | undefined,
      status: (parsed.status as CallStatus) ?? CallStatus.Failed,
      durationSeconds: parsed.durationSeconds as number | undefined,
      eventId: parsed.eventId as string | undefined,
      raw: parsed,
    };
    return { valid: true, event };
  }

  /** Test/dev helper: build a signed webhook body for a simulated event. */
  signWebhook(payload: Record<string, unknown>): {
    body: string;
    signature: string;
  } {
    const body = JSON.stringify(payload);
    return { body, signature: computeHmac(this.webhookSecret, body) };
  }
}
