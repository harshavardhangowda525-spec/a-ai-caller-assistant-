/**
 * Shared HMAC signature helpers for webhook verification, used by providers
 * that do not sign natively (and by the mock provider in development).
 */

import crypto from 'node:crypto';

export function computeHmac(secret: string, body: string): string {
  return crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

/** Constant-time comparison to avoid timing attacks. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function verifyHmacSignature(
  secret: string,
  body: string,
  provided: string | undefined,
): boolean {
  if (!provided) return false;
  const expected = computeHmac(secret, body);
  const normalized = provided.replace(/^sha256=/, '');
  return safeEqual(expected, normalized);
}
