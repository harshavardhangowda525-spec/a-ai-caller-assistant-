/**
 * Telephony provider factory. Selects the concrete provider from config.
 * Server-only.
 */

import { getConfig } from '@/lib/config';
import type { TelephonyProvider } from './provider';
import { MockTelephonyProvider } from './mock';
import { TwilioTelephonyProvider } from './twilio';
import { ExotelTelephonyProvider } from './exotel';

let instance: TelephonyProvider | null = null;

export function getTelephonyProvider(): TelephonyProvider {
  if (instance) return instance;
  const cfg = getConfig();
  const t = cfg.telephony;

  switch (t.provider) {
    case 'twilio':
      instance = new TwilioTelephonyProvider({
        accountSid: t.apiKey ?? '',
        authToken: t.apiSecret ?? '',
        webhookSecret: t.webhookSecret ?? cfg.internalWorkerSecret,
      });
      break;
    case 'exotel':
      instance = new ExotelTelephonyProvider({
        accountSid: t.accountSid ?? '',
        subdomain: t.subdomain ?? 'api.exotel.com',
        apiKey: t.apiKey ?? '',
        apiSecret: t.apiSecret ?? '',
        webhookSecret: t.webhookSecret ?? cfg.internalWorkerSecret,
      });
      break;
    case 'mock':
    default:
      instance = new MockTelephonyProvider(
        t.webhookSecret ?? cfg.internalWorkerSecret,
      );
      break;
  }
  return instance;
}

/** For tests: inject a provider or clear the cache. */
export function __setTelephonyProvider(p: TelephonyProvider | null) {
  instance = p;
}

export type { TelephonyProvider } from './provider';
