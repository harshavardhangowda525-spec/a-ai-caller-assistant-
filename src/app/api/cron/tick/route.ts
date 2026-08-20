import { NextRequest, NextResponse } from 'next/server';
import { tickAllCampaigns } from '@/queue/worker';
import { getConfig } from '@/lib/config';
import { safeEqual } from '@/telephony/signature';

/**
 * Serverless-friendly tick endpoint. Protect with a bearer token equal to
 * INTERNAL_WORKER_SECRET and drive it from a scheduler (e.g. Vercel Cron,
 * GitHub Actions, or Supabase pg_cron calling this URL) when you cannot run the
 * long-lived `npm run worker` process.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const secret = getConfig().internalWorkerSecret;
  if (!token || !safeEqual(token, secret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  await tickAllCampaigns();
  return NextResponse.json({ ok: true });
}
