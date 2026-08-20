import { EmptyState } from '@/components/ui';
import { maskPhone } from '@/lib/phone';
import { listCallbacks } from '@/server/queries';

export const dynamic = 'force-dynamic';

interface CallbackRow {
  id: string;
  requested_time_text: string | null;
  scheduled_at: string | null;
  handled: boolean;
  lead: { business_name: string; phone_number: string } | null;
}

export default async function CallbacksPage() {
  const callbacks = (await listCallbacks()) as unknown as CallbackRow[];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-brand-navy">Callbacks</h2>
        <p className="text-sm text-brand-grayText">
          Leads that asked to be called back. They are not dialled again until the scheduled time.
        </p>
      </div>

      {callbacks.length === 0 ? (
        <EmptyState icon="⏰" title="No callbacks scheduled" description="When a caller asks to be reached later, the requested time is saved here." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-grayMid bg-brand-gray/50 text-left text-xs uppercase text-brand-grayText">
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Requested time</th>
                  <th className="px-4 py-3">Scheduled</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {callbacks.map((c) => (
                  <tr key={c.id} className="border-b border-brand-grayMid/60">
                    <td className="px-4 py-3 font-semibold text-brand-navy">
                      {c.lead?.business_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-brand-grayText">
                      {c.lead ? maskPhone(c.lead.phone_number) : '—'}
                    </td>
                    <td className="px-4 py-3 text-brand-grayText">{c.requested_time_text ?? '—'}</td>
                    <td className="px-4 py-3 text-brand-grayText">
                      {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : 'Not set'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          c.handled
                            ? 'bg-status-success/15 text-status-success'
                            : 'bg-status-warn/15 text-status-warn'
                        }`}
                      >
                        {c.handled ? 'Handled' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
