/**
 * ExotelTelephonyProvider — real integration skeleton for Exotel, an Indian
 * cloud telephony provider well-suited to compliant domestic outbound calling.
 *
 * Requires: TELEPHONY_ACCOUNT_SID (Exotel SID), TELEPHONY_SUBDOMAIN (e.g.
 * api.exotel.com), TELEPHONY_API_KEY, TELEPHONY_API_SECRET.
 *
 * COMPLIANCE: Exotel provisions ExoPhone numbers registered to the account and
 * approved for the calling use case. The caller ID presented must be one of
 * these registered ExoPhones — this adapter never spoofs an arbitrary number.
 * Exotel's Connect API bridges two legs, which is exactly the "transfer to the
 * owner's normal phone" behaviour required here.
 */

import { CallStatus } from '@/domain/types';
import { logger } from '@/lib/logger';
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
import { verifyHmacSignature } from './signature';

interface ExotelConfig {
  accountSid: string;
  subdomain: string; // e.g. api.exotel.com
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
}

const EXOTEL_STATUS_MAP: Record<string, CallStatus> = {
  queued: CallStatus.Queued,
  'in-progress': CallStatus.InProgress,
  ringing: CallStatus.Ringing,
  completed: CallStatus.Completed,
  answered: CallStatus.Answered,
  busy: CallStatus.Busy,
  'no-answer': CallStatus.NoAnswer,
  failed: CallStatus.Failed,
};

export class ExotelTelephonyProvider implements TelephonyProvider {
  readonly name = 'exotel';
  private readonly base: string;

  constructor(private readonly cfg: ExotelConfig) {
    this.base = `https://${cfg.apiKey}:${cfg.apiSecret}@${cfg.subdomain}/v1/Accounts/${cfg.accountSid}`;
  }

  async createCall(params: CreateCallParams): Promise<CreateCallResult> {
    // Exotel "Connect" flow: connect the ExoPhone (From/CallerId) to the lead.
    const form = new URLSearchParams({
      From: params.callerId,
      To: params.to,
      CallerId: params.callerId,
      Url: params.voiceAppUrl,
      StatusCallback: params.webhookUrl,
      CustomField: params.callId,
    });
    const res = await fetch(`${this.base}/Calls/connect.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.error('exotel.createCall failed', { status: res.status });
      throw new Error(`Exotel createCall failed: ${res.status} ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as { Call?: { Sid: string; Status: string } };
    const sid = data.Call?.Sid ?? '';
    return {
      providerCallId: sid,
      status: EXOTEL_STATUS_MAP[data.Call?.Status ?? ''] ?? CallStatus.Initiated,
    };
  }

  async getCallStatus(providerCallId: string): Promise<CallStatusResult> {
    const res = await fetch(`${this.base}/Calls/${providerCallId}.json`);
    if (!res.ok) throw new Error(`Exotel getCallStatus failed: ${res.status}`);
    const data = (await res.json()) as {
      Call?: { Status: string; Duration?: string };
    };
    return {
      providerCallId,
      status: EXOTEL_STATUS_MAP[data.Call?.Status ?? ''] ?? CallStatus.Failed,
      durationSeconds: data.Call?.Duration ? Number(data.Call.Duration) : undefined,
    };
  }

  async hangupCall(providerCallId: string): Promise<void> {
    await fetch(`${this.base}/Calls/${providerCallId}.json`, { method: 'DELETE' });
  }

  async transferCall(params: TransferCallParams): Promise<TransferCallResult> {
    // Bridge the live call to the owner's number via Connect. The owner
    // receives a normal inbound call on their registered phone.
    const form = new URLSearchParams({
      From: params.callerId,
      To: params.transferTo,
      CallerId: params.callerId,
    });
    const res = await fetch(
      `${this.base}/Calls/${params.providerCallId}/transfer.json`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      },
    );
    if (!res.ok) {
      return { ok: false, status: CallStatus.TransferFailed, reason: `http_${res.status}` };
    }
    return { ok: true, status: CallStatus.Transferring };
  }

  async validateCallerId(callerId: string): Promise<CallerIdValidation> {
    // Verify the caller ID is a registered ExoPhone on the account.
    try {
      const res = await fetch(`${this.base}/IncomingPhoneNumbers.json`);
      if (!res.ok) return { ok: false, verified: false, reason: 'provider_unreachable' };
      const data = (await res.json()) as {
        IncomingPhoneNumbers?: Array<{ PhoneNumber?: string }>;
      };
      const digits = callerId.replace(/[^\d]/g, '').slice(-10);
      const verified = (data.IncomingPhoneNumbers ?? []).some((n) =>
        (n.PhoneNumber ?? '').replace(/[^\d]/g, '').endsWith(digits),
      );
      return {
        ok: true,
        verified,
        reason: verified
          ? undefined
          : 'Caller ID is not a registered ExoPhone. The app will not spoof — provision/verify the number with Exotel first.',
      };
    } catch {
      return { ok: false, verified: false, reason: 'provider_unreachable' };
    }
  }

  async handleWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookVerifyResult> {
    const sig = headers['x-exotel-signature'] ?? headers['x-signature'];
    if (!verifyHmacSignature(this.cfg.webhookSecret, rawBody, sig)) {
      return { valid: false, reason: 'signature_mismatch' };
    }
    // Exotel posts application/x-www-form-urlencoded.
    const params = new URLSearchParams(rawBody);
    const status = params.get('Status') ?? params.get('CallStatus') ?? '';
    const event: NormalizedWebhookEvent = {
      providerCallId: params.get('CallSid') ?? undefined,
      callId: params.get('CustomField') ?? undefined,
      status: EXOTEL_STATUS_MAP[status] ?? CallStatus.Failed,
      durationSeconds: params.get('Duration') ? Number(params.get('Duration')) : undefined,
      eventId: params.get('CallSid') ?? undefined,
      raw: Object.fromEntries(params.entries()),
    };
    return { valid: true, event };
  }
}
