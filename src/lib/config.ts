/**
 * Server-side configuration.
 *
 * IMPORTANT: This module must only ever be imported from server code
 * (route handlers, the queue worker, server components). It reads secrets like
 * OWNER_TRANSFER_NUMBER, OUTBOUND_CALLER_ID and provider credentials that must
 * never reach the browser bundle. The values are read from environment
 * variables; runtime overrides for a subset live in the `settings` DB table.
 */

import { z } from 'zod';
import { normalizeIndianPhone } from './phone';

const TelephonyProviderEnum = z.enum(['mock', 'twilio', 'exotel']);
const AiProviderEnum = z.enum(['mock', 'anthropic']);

const envSchema = z.object({
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.string().default('development'),

  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  TELEPHONY_PROVIDER: TelephonyProviderEnum.default('mock'),
  TELEPHONY_API_KEY: z.string().optional(),
  TELEPHONY_API_SECRET: z.string().optional(),
  TELEPHONY_ACCOUNT_SID: z.string().optional(),
  TELEPHONY_SUBDOMAIN: z.string().optional(),
  TELEPHONY_WEBHOOK_SECRET: z.string().optional(),

  OUTBOUND_CALLER_ID: z.string().optional(),
  OWNER_TRANSFER_NUMBER: z.string().optional(),

  AI_PROVIDER: AiProviderEnum.default('mock'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('claude-sonnet-5'),

  INTERNAL_WORKER_SECRET: z.string().default('dev-worker-secret'),
});

export type TelephonyProviderName = z.infer<typeof TelephonyProviderEnum>;
export type AiProviderName = z.infer<typeof AiProviderEnum>;

let cached: ReturnType<typeof buildConfig> | null = null;

/** Config issues collected without throwing, surfaced on the diagnostics page. */
export let configIssues: string[] = [];

function buildConfig() {
  // Treat empty / whitespace-only env values as "unset" so schema defaults
  // apply. On hosts like Vercel it is easy to create a variable with a blank
  // value; without this an empty TELEPHONY_PROVIDER would fail enum validation
  // and crash every page.
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string' && v.trim() !== '') cleaned[k] = v.trim();
  }

  let parsed = envSchema.safeParse(cleaned);
  configIssues = [];
  if (!parsed.success) {
    // Never crash the app on a misconfigured optional value. Record the issue,
    // drop the offending keys, and re-parse so valid values still apply.
    configIssues = parsed.error.issues.map(
      (i) => `${i.path.join('.') || '(root)'}: ${i.message}`,
    );
    const badKeys = new Set(parsed.error.issues.map((i) => String(i.path[0])));
    for (const key of badKeys) delete cleaned[key];
    parsed = envSchema.safeParse(cleaned);
  }
  const env = parsed.success ? parsed.data : envSchema.parse({});

  return {
    appBaseUrl: env.APP_BASE_URL,
    isProduction: env.NODE_ENV === 'production',

    supabase: {
      url: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      configured: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
    },

    telephony: {
      provider: env.TELEPHONY_PROVIDER,
      apiKey: env.TELEPHONY_API_KEY,
      apiSecret: env.TELEPHONY_API_SECRET,
      accountSid: env.TELEPHONY_ACCOUNT_SID,
      subdomain: env.TELEPHONY_SUBDOMAIN,
      webhookSecret: env.TELEPHONY_WEBHOOK_SECRET,
      outboundCallerId: env.OUTBOUND_CALLER_ID,
      ownerTransferNumber: env.OWNER_TRANSFER_NUMBER,
    },

    ai: {
      provider: env.AI_PROVIDER,
      apiKey: env.AI_API_KEY,
      model: env.AI_MODEL,
    },

    internalWorkerSecret: env.INTERNAL_WORKER_SECRET,
  };
}

export function getConfig() {
  if (!cached) cached = buildConfig();
  return cached;
}

/** For tests: clear the memoized config. */
export function resetConfigCache() {
  cached = null;
}

// --- Caller ID compliance --------------------------------------------------

export interface CallerIdCheck {
  ok: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Validate the configured OUTBOUND_CALLER_ID at the config layer.
 *
 * This does NOT prove provider registration — that requires a live provider
 * check (see TelephonyProvider.validateCallerId). It only enforces that a
 * caller ID is present and is a well-formed Indian number. The application
 * NEVER spoofs: if a provider later reports the number is not registered, the
 * UI surfaces a configuration error instead of dialling.
 */
export function validateConfiguredCallerId(): CallerIdCheck {
  const raw = getConfig().telephony.outboundCallerId;
  if (!raw) {
    return { ok: false, error: 'OUTBOUND_CALLER_ID is not configured.' };
  }
  const normalized = normalizeIndianPhone(raw);
  if (!normalized) {
    return {
      ok: false,
      error: `OUTBOUND_CALLER_ID "${raw}" is not a valid Indian number.`,
    };
  }
  return { ok: true, normalized };
}

export function getOwnerTransferNumberNormalized(): string | null {
  const raw = getConfig().telephony.ownerTransferNumber;
  return raw ? normalizeIndianPhone(raw) : null;
}
