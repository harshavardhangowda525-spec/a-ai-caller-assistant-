import { listLiveCalls } from '@/server/queries';
import { maskPhone } from '@/lib/phone';
import { LiveCallsView } from './LiveCallsView';

export const dynamic = 'force-dynamic';

export default async function LivePage() {
  const calls = await listLiveCalls();
  const initial = calls.map((c) => ({
    id: c.id,
    businessName: c.lead?.business_name ?? 'Unknown business',
    maskedPhone: c.lead ? maskPhone(c.lead.phone_number) : '+91 ******',
    status: c.status,
    aiState: c.ai_state,
    stage: c.current_stage ?? '—',
    transferStatus: c.transfer_status,
    startedAt: c.started_at,
    durationSeconds: c.duration_seconds ?? null,
  }));
  return <LiveCallsView initial={initial} />;
}
