/**
 * Structured logger that redacts sensitive values.
 *
 * Never log API keys, secrets, full phone numbers, or transfer/caller-ID
 * numbers in the clear. Keys matching the redaction list are masked; phone
 * numbers are masked to their last 4 digits.
 */

import { maskPhone } from './phone';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEY_RE =
  /(secret|token|api_?key|password|service_?role|authorization|signature|owner_transfer_number|caller_id)/i;

const PHONE_KEY_RE = /(phone|number|caller|msisdn|to|from)/i;

function redactValue(key: string, value: unknown): unknown {
  if (value == null) return value;
  if (SENSITIVE_KEY_RE.test(key)) return '***redacted***';
  if (typeof value === 'string' && PHONE_KEY_RE.test(key) && /\d{6,}/.test(value)) {
    return maskPhone(value);
  }
  if (typeof value === 'object') return redact(value as Record<string, unknown>);
  return value;
}

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = redactValue(k, v);
  }
  return out;
}

function emit(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? redact(meta) : {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') emit('debug', m, meta);
  },
  info: (m: string, meta?: Record<string, unknown>) => emit('info', m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => emit('warn', m, meta),
  error: (m: string, meta?: Record<string, unknown>) => emit('error', m, meta),
};

export { redact as redactForLog };
