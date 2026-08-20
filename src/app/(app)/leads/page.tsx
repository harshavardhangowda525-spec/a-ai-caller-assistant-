import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui';
import { maskPhone } from '@/lib/phone';
import { listLeads } from '@/server/queries';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const leads = await listLeads();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-brand-navy">Leads</h2>
          <p className="text-sm text-brand-grayText">{leads.length} total leads</p>
        </div>
        <Link href="/upload" className="btn-primary">
          ⬆️ Upload Leads
        </Link>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No leads yet"
          description="Upload a CSV of business leads to get started. Numbers are validated and de-duplicated automatically."
          action={
            <Link href="/upload" className="btn-primary mt-2">
              Upload your first CSV
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-grayMid bg-brand-gray/50 text-left text-xs uppercase tracking-wide text-brand-grayText">
                  <th className="px-4 py-3 font-semibold">Business</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Consent</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-brand-grayMid/60 hover:bg-brand-gray/40">
                    <td className="px-4 py-3 font-semibold text-brand-navy">{l.business_name}</td>
                    <td className="px-4 py-3 font-mono text-brand-grayText">
                      {maskPhone(l.phone_number)}
                    </td>
                    <td className="px-4 py-3 text-brand-grayText">{l.business_type ?? '—'}</td>
                    <td className="px-4 py-3 text-brand-grayText">{l.lead_source ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          l.consent_status === 'consented'
                            ? 'bg-status-success/15 text-status-success'
                            : l.consent_status === 'no_consent'
                              ? 'bg-status-danger/15 text-status-danger'
                              : 'bg-brand-grayMid text-brand-navy'
                        }`}
                      >
                        {l.consent_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-3 text-brand-grayText">{l.call_attempts}</td>
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
