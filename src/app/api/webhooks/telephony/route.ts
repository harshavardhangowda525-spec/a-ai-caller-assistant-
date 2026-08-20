import { NextRequest, NextResponse } from 'next/server';
import { getTelephonyProvider } from '@/telephony';
import { CallService } from '@/server/callService';
import { logger } from '@/lib/logger';

/**
 * Telephony webhook ingress. Verifies the provider signature, normalizes the
 * event, and applies it idempotently. Always returns 200 on a
 * signature-verified event (even duplicates) so the provider stops retrying.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

  const provider = getTelephonyProvider();
  const verified = await provider.handleWebhook(headers, rawBody);

  if (!verified.valid || !verified.event) {
    logger.warn('webhook.rejected', { reason: verified.reason });
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  try {
    const applied = await new CallService().ingestWebhookEvent(verified.event);
    return NextResponse.json({ ok: true, applied });
  } catch (err) {
    logger.error('webhook.processing_error', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    // 200 avoids infinite provider retries; the event is logged for reprocessing.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
