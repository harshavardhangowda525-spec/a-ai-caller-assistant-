import { describe, expect, it } from 'vitest';
import { performTransfer } from '@/telephony/transfer';
import { MockTelephonyProvider } from '@/telephony/mock';
import { CallStatus, TransferStatus } from '@/domain/types';
import type { TelephonyProvider } from '@/telephony/provider';

const OWNER = '+916360471652';
const VERIFIED_CALLER = '+916360471652';

describe('transfer coordinator', () => {
  it('refuses to transfer without explicit caller agreement', async () => {
    const provider = new MockTelephonyProvider();
    const created = await provider.createCall({
      callId: 'c1',
      to: '+919876543210',
      callerId: VERIFIED_CALLER,
      webhookUrl: 'x',
      voiceAppUrl: 'y',
    });
    const out = await performTransfer(provider, {
      providerCallId: created.providerCallId,
      callerAgreed: false,
      ownerTransferNumber: OWNER,
      callerId: VERIFIED_CALLER,
    });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe('caller_did_not_agree');
    expect(out.transferStatus).toBe(TransferStatus.None);
  });

  it('transfers to the owner when the caller agreed and caller ID is verified', async () => {
    const provider = new MockTelephonyProvider();
    const created = await provider.createCall({
      callId: 'c1',
      to: '+919876543210',
      callerId: VERIFIED_CALLER,
      webhookUrl: 'x',
      voiceAppUrl: 'y',
    });
    const out = await performTransfer(provider, {
      providerCallId: created.providerCallId,
      callerAgreed: true,
      ownerTransferNumber: OWNER,
      callerId: VERIFIED_CALLER,
    });
    expect(out.ok).toBe(true);
    expect(out.transferStatus).toBe(TransferStatus.InProgress);
  });

  it('never spoofs — blocks transfer when caller ID is not verified', async () => {
    // A provider stub that reports the caller ID is NOT verified.
    const unverifiedProvider: TelephonyProvider = {
      ...new MockTelephonyProvider(),
      name: 'stub',
      validateCallerId: async () => ({ ok: true, verified: false, reason: 'not_registered' }),
    } as TelephonyProvider;

    const out = await performTransfer(unverifiedProvider, {
      providerCallId: 'p1',
      callerAgreed: true,
      ownerTransferNumber: OWNER,
      callerId: '+919999999999',
    });
    expect(out.ok).toBe(false);
    expect(out.callStatus).toBe(CallStatus.TransferFailed);
    expect(out.reason).toBe('not_registered');
  });

  it('fails cleanly when the owner transfer number is not configured', async () => {
    const provider = new MockTelephonyProvider();
    const out = await performTransfer(provider, {
      providerCallId: 'p1',
      callerAgreed: true,
      ownerTransferNumber: '',
      callerId: VERIFIED_CALLER,
    });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe('owner_transfer_number_not_configured');
  });
});
