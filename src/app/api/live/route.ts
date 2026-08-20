import { NextResponse } from 'next/server';
import { requireUser } from '@/server/apiAuth';
import { listLiveCalls } from '@/server/queries';
import { maskPhone } from '@/lib/phone';

/** Masked live-call feed for the auto-refreshing Live Calls page. */
export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const calls = await listLiveCalls();
  return NextResponse.json({
    calls: calls.map((c) => ({
      id: c.id,
      businessName: c.lead?.business_name ?? 'Unknown business',
      maskedPhone: c.lead ? maskPhone(c.lead.phone_number) : '+91 ******',
      status: c.status,
      aiState: c.ai_state,
      stage: c.current_stage ?? '—',
      transferStatus: c.transfer_status,
      startedAt: c.started_at,
      durationSeconds: c.duration_seconds ?? null,
    })),
  });
}
