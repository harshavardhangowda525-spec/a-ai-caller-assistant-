/**
 * Transfer coordinator.
 *
 * Encapsulates the "transfer to owner" workflow so it is testable in isolation
 * and enforces the two hard rules:
 *   1. Never transfer without an explicit caller agreement.
 *   2. Never present a caller ID the provider has not verified (no spoofing).
 *
 * The owner number is read server-side only; it is passed in here rather than
 * imported so this module stays pure and the secret never leaks into a bundle.
 */

import { CallStatus, TransferStatus } from '@/domain/types';
import type { TelephonyProvider } from './provider';

export interface TransferRequest {
  providerCallId: string;
  callerAgreed: boolean;
  ownerTransferNumber: string; // E.164, server-side config
  callerId: string; // E.164, must be verified
}

export interface TransferOutcome {
  transferStatus: TransferStatus;
  callStatus: CallStatus;
  ok: boolean;
  reason?: string;
}

export async function performTransfer(
  provider: TelephonyProvider,
  req: TransferRequest,
): Promise<TransferOutcome> {
  // Rule 1: consent gate.
  if (!req.callerAgreed) {
    return {
      ok: false,
      transferStatus: TransferStatus.None,
      callStatus: CallStatus.InProgress,
      reason: 'caller_did_not_agree',
    };
  }

  if (!req.ownerTransferNumber) {
    return {
      ok: false,
      transferStatus: TransferStatus.Failed,
      callStatus: CallStatus.TransferFailed,
      reason: 'owner_transfer_number_not_configured',
    };
  }

  // Rule 2: no spoofing — caller ID must be provider-verified.
  const callerIdCheck = await provider.validateCallerId(req.callerId);
  if (!callerIdCheck.verified) {
    return {
      ok: false,
      transferStatus: TransferStatus.Failed,
      callStatus: CallStatus.TransferFailed,
      reason: callerIdCheck.reason ?? 'caller_id_not_verified',
    };
  }

  const result = await provider.transferCall({
    providerCallId: req.providerCallId,
    transferTo: req.ownerTransferNumber,
    callerId: req.callerId,
  });

  if (!result.ok) {
    return {
      ok: false,
      transferStatus: TransferStatus.Failed,
      callStatus: CallStatus.TransferFailed,
      reason: result.reason ?? 'provider_transfer_failed',
    };
  }

  // Provider accepted the bridge request; final success is confirmed by webhook.
  return {
    ok: true,
    transferStatus: TransferStatus.InProgress,
    callStatus: result.status,
  };
}
