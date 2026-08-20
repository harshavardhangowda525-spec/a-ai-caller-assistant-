/**
 * TwilioTelephonyProvider — real integration skeleton.
 *
 * This implements the TelephonyProvider interface against Twilio's REST +
 * webhook model. It is wired end-to-end but requires live credentials
 * (TELEPHONY_API_KEY = Account SID, TELEPHONY_API_SECRET = Auth Token) to place
 * real calls. Until credentials + a verified Indian caller ID are connected,
 * `validateCallerId` returns verified=false and the app blocks dialling.
 *
 * COMPLIANCE: Twilio's ability to originate domestic Indian calls and present a
 * given Indian caller ID depends on account provisioning and regulatory
 * approval. This adapter NEVER spoofs — it only presents a caller ID the
 * provider confirms is registered/verified on the account.
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

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  webhookSecret: string;
}

const TWILIO_STATUS_MAP: Record<string, CallStatus> = {
  queued: CallStatus.Queued,
  initiated: CallStatus.Initiated,
  ringing: CallStatus.Ringing,
  'in-progress': CallStatus.InProgress,
  answered: CallStatus.Answered,
  completed: CallStatus.Completed,
  busy: CallStatus.Busy,
  'no-answer': CallStatus.NoAnswer,
  failed: CallStatus.Failed,
  canceled: CallStatus.Failed,
};

export class TwilioTelephonyProvider implements TelephonyProvider {
  readonly name = 'twilio';
  private readonly base: string;

  constructor(private readonly cfg: TwilioConfig) {
    this.base = `https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}`;
  }

  private authHeader(): string {
    const token = Buffer.from(`${this.cfg.accountSid}:${this.cfg.authToken}`).toString(
      'base64',
    );
    return `Basic ${token}`;
  }

  async createCall(params: CreateCallParams): Promise<CreateCallResult> {
    const form = new URLSearchParams({
      To: params.to,
      From: params.callerId,
      Url: params.voiceAppUrl,
      StatusCallback: params.webhookUrl,
      StatusCallbackMethod: 'POST',
      'StatusCallbackEvent': 'initiated ringing answered completed',
    });
    // Twilio custom params are echoed on webhooks — carry our internal id.
    form.append('StatusCallbackEvent', 'completed');

    const res = await fetch(`${this.base}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.error('twilio.createCall failed', { status: res.status });
      throw new Error(`Twilio createCall failed: ${res.status} ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as { sid: string; status: string };
    return {
      providerCallId: data.sid,
      status: TWILIO_STATUS_MAP[data.status] ?? CallStatus.Initiated,
    };
  }

  async getCallStatus(providerCallId: string): Promise<CallStatusResult> {
    const res = await fetch(`${this.base}/Calls/${providerCallId}.json`, {
      headers: { Authorization: this.authHeader() },
    });
    if (!res.ok) throw new Error(`Twilio getCallStatus failed: ${res.status}`);
    const data = (await res.json()) as { status: string; duration?: string };
    return {
      providerCallId,
      status: TWILIO_STATUS_MAP[data.status] ?? CallStatus.Failed,
      durationSeconds: data.duration ? Number(data.duration) : undefined,
    };
  }

  async hangupCall(providerCallId: string): Promise<void> {
    const form = new URLSearchParams({ Status: 'completed' });
    await fetch(`${this.base}/Calls/${providerCallId}.json`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
  }

  async transferCall(params: TransferCallParams): Promise<TransferCallResult> {
    // Redirect the live call to TwiML that dials the owner, bridging the caller
    // to the owner's normal phone. The owner receives an ordinary inbound call.
    const twiml = `<Response><Dial callerId="${params.callerId}"><Number>${params.transferTo}</Number></Dial></Response>`;
    const form = new URLSearchParams({ Twiml: twiml });
    const res = await fetch(`${this.base}/Calls/${params.providerCallId}.json`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    if (!res.ok) {
      return { ok: false, status: CallStatus.TransferFailed, reason: `http_${res.status}` };
    }
    return { ok: true, status: CallStatus.Transferring };
  }

  async validateCallerId(callerId: string): Promise<CallerIdValidation> {
    // Check that the number is an owned/verified caller ID on the account.
    // Both IncomingPhoneNumbers (owned) and OutgoingCallerIds (verified) count.
    try {
      const [owned, verified] = await Promise.all([
        fetch(
          `${this.base}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(callerId)}`,
          { headers: { Authorization: this.authHeader() } },
        ),
        fetch(
          `${this.base}/OutgoingCallerIds.json?PhoneNumber=${encodeURIComponent(callerId)}`,
          { headers: { Authorization: this.authHeader() } },
        ),
      ]);
      const ownedData = owned.ok
        ? ((await owned.json()) as { incoming_phone_numbers?: unknown[] })
        : { incoming_phone_numbers: [] };
      const verifiedData = verified.ok
        ? ((await verified.json()) as { outgoing_caller_ids?: unknown[] })
        : { outgoing_caller_ids: [] };

      const isVerified =
        (ownedData.incoming_phone_numbers?.length ?? 0) > 0 ||
        (verifiedData.outgoing_caller_ids?.length ?? 0) > 0;

      return {
        ok: true,
        verified: isVerified,
        reason: isVerified
          ? undefined
          : 'Caller ID is not registered/verified on the Twilio account. The app will not spoof — register the number first.',
      };
    } catch (err) {
      return { ok: false, verified: false, reason: 'provider_unreachable' };
    }
  }

  async handleWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<WebhookVerifyResult> {
    // Twilio signs with X-Twilio-Signature. For portability we additionally
    // accept the shared-secret HMAC used across providers in this app.
    const sig = headers['x-twilio-signature'] ?? headers['x-signature'];
    if (!verifyHmacSignature(this.cfg.webhookSecret, rawBody, sig)) {
      return { valid: false, reason: 'signature_mismatch' };
    }
    const params = new URLSearchParams(rawBody);
    const status = params.get('CallStatus') ?? '';
    const event: NormalizedWebhookEvent = {
      providerCallId: params.get('CallSid') ?? undefined,
      callId: params.get('callId') ?? undefined,
      status: TWILIO_STATUS_MAP[status] ?? CallStatus.Failed,
      durationSeconds: params.get('CallDuration')
        ? Number(params.get('CallDuration'))
        : undefined,
      eventId: params.get('SequenceNumber') ?? params.get('CallSid') ?? undefined,
      raw: Object.fromEntries(params.entries()),
    };
    return { valid: true, event };
  }
}
