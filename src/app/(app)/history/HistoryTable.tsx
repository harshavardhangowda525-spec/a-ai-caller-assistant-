'use client';

import { useMemo, useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui';

interface Row {
  id: string;
  date: string;
  business: string;
  businessType: string;
  phone: string;
  durationSeconds: number;
  result: string;
  transferStatus: string;
  aiSummary: string;
  recordingStatus: string;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function HistoryTable({ rows }: { rows: Row[] }) {
  const [result, setResult] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState('');

  const businessTypes = useMemo(
    () => [...new Set(rows.map((r) => r.businessType).filter((t) => t && t !== '—'))],
    [rows],
  );

  const filtered = rows.filter((r) => {
    if (result && r.result !== result) return false;
    if (type && r.businessType !== type) return false;
    if (date && !r.date.startsWith(date)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Result</label>
          <select className="input" value={result} onChange={(e) => setResult(e.target.value)}>
            <option value="">All</option>
            {['completed', 'transfer_successful', 'transfer_failed', 'busy', 'no_answer', 'failed'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
        </div>
        <div>
          <label className="label">Business type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option>
            {businessTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {(result || type || date) && (
          <button
            className="btn-ghost"
            onClick={() => {
              setResult('');
              setType('');
              setDate('');
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🗂️" title="No calls match" description="Adjust the filters or run a campaign to generate call history." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-grayMid bg-brand-gray/50 text-left text-xs uppercase text-brand-grayText">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Transfer</th>
                  <th className="px-4 py-3">AI Summary</th>
                  <th className="px-4 py-3">Recording</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-brand-grayMid/60 hover:bg-brand-gray/40">
                    <td className="whitespace-nowrap px-4 py-3 text-brand-grayText">
                      {new Date(r.date).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-navy">{r.business}</td>
                    <td className="px-4 py-3 font-mono text-brand-grayText">{r.phone}</td>
                    <td className="px-4 py-3 font-mono text-brand-grayText">{fmt(r.durationSeconds)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.result} /></td>
                    <td className="px-4 py-3"><StatusBadge status={r.transferStatus} /></td>
                    <td className="max-w-xs px-4 py-3 text-xs text-brand-grayText">{r.aiSummary || '—'}</td>
                    <td className="px-4 py-3 text-xs text-brand-grayText">{r.recordingStatus}</td>
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
