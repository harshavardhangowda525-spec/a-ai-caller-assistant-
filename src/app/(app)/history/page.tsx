import { listCalls } from '@/server/queries';
import { maskPhone } from '@/lib/phone';
import { HistoryTable } from './HistoryTable';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const calls = await listCalls();
  const rows = calls.map((c) => ({
    id: c.id,
    date: c.started_at ?? c.created_at,
    business: c.lead?.business_name ?? '—',
    businessType: c.lead?.business_type ?? '—',
    phone: c.lead ? maskPhone(c.lead.phone_number) : '—',
    durationSeconds: c.duration_seconds ?? 0,
    result: c.status,
    transferStatus: c.transfer_status,
    aiSummary: c.ai_summary ?? '',
    recordingStatus: c.recording_status ?? 'disabled',
  }));
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-brand-navy">Call History</h2>
        <p className="text-sm text-brand-grayText">{rows.length} calls recorded</p>
      </div>
      <HistoryTable rows={rows} />
    </div>
  );
}
