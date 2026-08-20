'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { Spinner } from '@/components/ui';

interface PreviewCounts {
  total: number;
  valid: number;
  invalid: number;
  duplicate: number;
  suppressed: number;
}
interface PreviewRow {
  rowNumber: number;
  category: 'valid' | 'invalid' | 'duplicate' | 'suppressed';
  errors: string[];
  raw: Record<string, string>;
}
interface Preview {
  counts: PreviewCounts;
  rows: PreviewRow[];
}

const CATEGORY_STYLE: Record<string, string> = {
  valid: 'bg-status-success/15 text-status-success',
  invalid: 'bg-status-danger/15 text-status-danger',
  duplicate: 'bg-status-warn/15 text-status-warn',
  suppressed: 'bg-brand-grayMid text-brand-navy',
};

const SAMPLE =
  'Business Name,Phone Number,Business Type,Lead Source,Consent Status\n' +
  'ABC Coaching Centre,9876543210,Education,Website,Yes\n' +
  'Sunrise Bakery,+91 98765 43211,Food,Referral,Yes';

export function UploadForm({ campaigns }: { campaigns: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const toast = useToast();
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? '');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    await runPreview(text);
  }

  async function runPreview(text: string) {
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch('/api/leads/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Preview failed');
      setPreview(data);
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Preview failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function doImport() {
    if (!confirmed) {
      toast.push('Please confirm the contacts are permitted to be called.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv, campaignId: campaignId || undefined, confirmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Import failed');
      toast.push(`Imported ${data.imported} lead(s).`, 'success');
      router.push('/leads');
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Import failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <label className="label">CSV file</label>
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="input" />
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-brand-grayText">or</span>
          <button
            className="text-xs font-semibold text-brand-royal hover:underline"
            onClick={() => {
              setCsv(SAMPLE);
              runPreview(SAMPLE);
            }}
          >
            Load sample data
          </button>
        </div>
        <p className="mt-3 text-xs text-brand-grayText">
          Expected columns: <b>Business Name, Phone Number, Business Type, Lead Source,
          Consent Status</b>. Indian mobile numbers are normalized to +91 E.164.
        </p>
      </div>

      {loading && (
        <div className="card p-6">
          <Spinner label="Validating rows…" />
        </div>
      )}

      {preview && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat label="Total" value={preview.counts.total} />
            <Stat label="Valid" value={preview.counts.valid} tone="text-status-success" />
            <Stat label="Invalid" value={preview.counts.invalid} tone="text-status-danger" />
            <Stat label="Duplicate" value={preview.counts.duplicate} tone="text-status-warn" />
            <Stat label="Suppressed" value={preview.counts.suppressed} />
          </div>

          <div className="card overflow-hidden">
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-brand-gray/80 text-left text-xs uppercase text-brand-grayText backdrop-blur">
                  <tr>
                    <th className="px-4 py-2">Row</th>
                    <th className="px-4 py-2">Business</th>
                    <th className="px-4 py-2">Phone</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.rowNumber} className="border-b border-brand-grayMid/60">
                      <td className="px-4 py-2 text-brand-grayText">{r.rowNumber}</td>
                      <td className="px-4 py-2 font-medium text-brand-navy">
                        {r.raw['Business Name'] ?? Object.values(r.raw)[0] ?? '—'}
                      </td>
                      <td className="px-4 py-2 font-mono text-brand-grayText">
                        {r.raw['Phone Number'] ?? '—'}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`badge ${CATEGORY_STYLE[r.category]}`}>{r.category}</span>
                      </td>
                      <td className="px-4 py-2 text-xs text-brand-grayText">
                        {r.errors.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card space-y-4 p-6">
            {campaigns.length > 0 && (
              <div>
                <label className="label">Attach imported leads to campaign</label>
                <select
                  className="input"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                >
                  <option value="">Do not attach</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <label className="flex items-start gap-3 rounded-lg border border-status-warn/40 bg-status-warn/5 p-3 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span className="text-brand-navy">
                I confirm these contacts have a lawful basis to receive commercial
                calls from Infinity Web &amp; Apps and comply with applicable Indian
                telecom rules. I am responsible for this eligibility.
              </span>
            </label>

            <button
              onClick={doImport}
              disabled={loading || preview.counts.valid === 0 || !confirmed}
              className="btn-primary"
            >
              Import {preview.counts.valid} valid lead(s)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone = 'text-brand-navy' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-brand-grayText">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</div>
    </div>
  );
}
