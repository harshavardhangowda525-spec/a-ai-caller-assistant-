import { NextRequest, NextResponse } from 'next/server';
import { requireUser, audit } from '@/server/apiAuth';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * Update app settings (delay between calls, retries, recording toggle,
 * production-calling toggle, AI script). Secrets like OWNER_TRANSFER_NUMBER and
 * OUTBOUND_CALLER_ID are NEVER settable here — they live only in server env.
 */

const ALLOWED_KEYS = new Set([
  'delay_between_calls_seconds',
  'max_retries',
  'recording_enabled',
  'production_calling_enabled',
  'ai_script',
]);

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = (await req.json()) as Record<string, unknown>;
  const db = getAdminClient();

  const updates = Object.entries(body).filter(([k]) => ALLOWED_KEYS.has(k));
  for (const [key, value] of updates) {
    await db.from('settings').upsert(
      { key, value: value as never, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    );
  }

  await audit(user.id, 'settings.update', 'settings', undefined, {
    keys: updates.map(([k]) => k),
  });
  return NextResponse.json({ ok: true, updated: updates.map(([k]) => k) });
}
