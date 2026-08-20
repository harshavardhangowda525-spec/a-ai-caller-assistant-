import 'server-only';

/**
 * Call service — the server-side orchestration that binds the telephony
 * provider, AI provider, and database together.
 *
 * Responsibilities:
 *  - placeCall(): the engine's hook to actually dial a claimed lead.
 *  - ingestWebhookEvent(): idempotent webhook processing that advances call +
 *    lead state through the validated state machine.
 *  - requestTransfer(): consent-gated, no-spoof transfer to the owner.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CallRecord,
  CallStatus,
  Campaign,
  Lead,
  TransferStatus,
  isTerminalCallStatus,
} from '@/domain/types';
import {
  canTransition,
  leadStatusForOutcome,
  transferStatusForCall,
} from '@/domain/callState';
import { getAdminClient } from '@/lib/supabase/admin';
import { getConfig, getOwnerTransferNumberNormalized, validateConfiguredCallerId } from '@/lib/config';
import { getTelephonyProvider } from '@/telephony';
import { performTransfer } from '@/telephony/transfer';
import type { NormalizedWebhookEvent } from '@/telephony/provider';
import type { ClaimResult } from '@/queue/repository';
import { logger } from '@/lib/logger';

export class CallService {
  constructor(private readonly db: SupabaseClient = getAdminClient()) {}

  /** The engine's placeCall hook. */
  async placeCall(
    claim: ClaimResult,
    _campaign: Campaign,
  ): Promise<{ providerCallId: string; status: CallStatus }> {
    const callerId = validateConfiguredCallerId();
    if (!callerId.ok || !callerId.normalized) {
      throw new Error(callerId.error ?? 'caller_id_not_configured');
    }

    // No-spoof gate: confirm the provider has verified this caller ID before
    // dialling. This blocks calls when the number is not legally registered.
    const provider = getTelephonyProvider();
    const idCheck = await provider.validateCallerId(callerId.normalized);
    if (!idCheck.verified) {
      throw new Error(
        `Caller ID ${callerId.normalized} is not verified with the provider — refusing to dial (no spoofing). ${idCheck.reason ?? ''}`,
      );
    }

    const cfg = getConfig();
    const base = cfg.appBaseUrl;
    const result = await provider.createCall({
      callId: claim.call.id,
      to: claim.lead.phone_number,
      callerId: callerId.normalized,
      webhookUrl: `${base}/api/webhooks/telephony`,
      voiceAppUrl: `${base}/api/voice/${claim.call.id}`,
      metadata: { callId: claim.call.id },
    });

    await this.recordEvent(claim.call.id, 'call_initiated', undefined, {
      from: CallStatus.Queued,
      to: result.status,
    });
    return result;
  }

  /**
   * Process a normalized webhook event idempotently. Returns true if applied,
   * false if it was a duplicate or an illegal transition (safely ignored).
   */
  async ingestWebhookEvent(event: NormalizedWebhookEvent): Promise<boolean> {
    // Resolve the call by our internal id or the provider id.
    const call = await this.resolveCall(event);
    if (!call) {
      logger.warn('webhook.call_not_found', { providerCallId: event.providerCallId });
      return false;
    }

    // Idempotency: a unique (call_id, provider_event_id) index rejects dupes.
    if (event.eventId) {
      const { data: existing } = await this.db
        .from('call_events')
        .select('id')
        .eq('call_id', call.id)
        .eq('provider_event_id', event.eventId)
        .maybeSingle();
      if (existing) {
        logger.debug('webhook.duplicate_ignored', { eventId: event.eventId });
        return false;
      }
    }

    // Validate the transition. Illegal/out-of-order transitions are recorded
    // but do not corrupt state.
    if (!canTransition(call.status, event.status)) {
      await this.recordEvent(call.id, 'illegal_transition', event.eventId, {
        from: call.status,
        to: event.status,
      });
      logger.warn('webhook.illegal_transition', {
        from: call.status,
        to: event.status,
      });
      return false;
    }

    await this.applyStatus(call, event);
    await this.recordEvent(call.id, `status_${event.status}`, event.eventId, {
      from: call.status,
      to: event.status,
      payload: event.raw,
    });
    return true;
  }

  /**
   * Request a transfer to the owner. Enforces explicit consent and the no-spoof
   * caller-ID rule via the transfer coordinator.
   */
  async requestTransfer(
    callId: string,
    callerAgreed: boolean,
  ): Promise<{ ok: boolean; reason?: string }> {
    const { data: call } = await this.db
      .from('calls')
      .select('*')
      .eq('id', callId)
      .maybeSingle();
    if (!call) return { ok: false, reason: 'call_not_found' };

    const owner = getOwnerTransferNumberNormalized();
    if (!owner) return { ok: false, reason: 'owner_transfer_number_not_configured' };
    const callerId = validateConfiguredCallerId();
    if (!callerId.ok || !callerId.normalized) {
      return { ok: false, reason: callerId.error };
    }

    // Mark "transfer requested" before attempting so the dashboard reflects it.
    await this.db
      .from('calls')
      .update({ status: 'transfer_requested', transfer_status: 'requested' })
      .eq('id', callId);
    await this.recordEvent(callId, 'transfer_started');

    const outcome = await performTransfer(getTelephonyProvider(), {
      providerCallId: (call as CallRecord).provider_call_id ?? '',
      callerAgreed,
      ownerTransferNumber: owner,
      callerId: callerId.normalized,
    });

    await this.db
      .from('calls')
      .update({
        status: outcome.callStatus,
        transfer_status: outcome.transferStatus,
      })
      .eq('id', callId);
    await this.recordEvent(
      callId,
      outcome.ok ? 'transfer_in_progress' : 'transfer_failed',
      undefined,
      { reason: outcome.reason },
    );

    return { ok: outcome.ok, reason: outcome.reason };
  }

  // --- internals ----------------------------------------------------------

  private async resolveCall(
    event: NormalizedWebhookEvent,
  ): Promise<CallRecord | null> {
    if (event.callId) {
      const { data } = await this.db
        .from('calls')
        .select('*')
        .eq('id', event.callId)
        .maybeSingle();
      if (data) return data as CallRecord;
    }
    if (event.providerCallId) {
      const { data } = await this.db
        .from('calls')
        .select('*')
        .eq('provider_call_id', event.providerCallId)
        .maybeSingle();
      if (data) return data as CallRecord;
    }
    return null;
  }

  private async applyStatus(
    call: CallRecord,
    event: NormalizedWebhookEvent,
  ): Promise<void> {
    const patch: Record<string, unknown> = { status: event.status };
    const transfer = transferStatusForCall(event.status);
    if (transfer !== TransferStatus.None) patch.transfer_status = transfer;

    if (event.status === CallStatus.Answered && !call.answered_at) {
      patch.answered_at = new Date().toISOString();
    }
    if (typeof event.durationSeconds === 'number') {
      patch.duration_seconds = event.durationSeconds;
    }

    if (isTerminalCallStatus(event.status)) {
      patch.ended_at = new Date().toISOString();
      // Derive the lead outcome. AI outcome (if any) is carried on raw payload.
      const aiOutcome = (event.raw.aiOutcome as
        | 'interested'
        | 'not_interested'
        | 'callback'
        | 'do_not_call'
        | undefined) ?? undefined;
      const leadStatus = leadStatusForOutcome(event.status, aiOutcome);
      await this.db
        .from('leads')
        .update({ status: leadStatus, call_result: event.status })
        .eq('id', call.lead_id);

      // A do-not-call outcome permanently suppresses the number.
      if (leadStatus === 'do_not_call') {
        const { data: lead } = await this.db
          .from('leads')
          .select('phone_number')
          .eq('id', call.lead_id)
          .single();
        if (lead) {
          await this.db
            .from('suppression_list')
            .upsert(
              { phone_number: (lead as Lead).phone_number, reason: 'do_not_call', source: 'call_outcome' },
              { onConflict: 'phone_number' },
            );
        }
      }
    }

    await this.db.from('calls').update(patch).eq('id', call.id);
  }

  private async recordEvent(
    callId: string,
    eventType: string,
    providerEventId?: string,
    extra?: Record<string, unknown>,
  ): Promise<void> {
    await this.db.from('call_events').insert({
      call_id: callId,
      event_type: eventType,
      provider_event_id: providerEventId ?? null,
      from_status: (extra?.from as string) ?? null,
      to_status: (extra?.to as string) ?? null,
      payload: extra?.payload ?? extra ?? null,
    });
  }
}
