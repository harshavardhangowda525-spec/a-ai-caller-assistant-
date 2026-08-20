'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui';
import { useToast } from '@/components/Toast';

interface Row {
  id: string;
  masked: string;
  reason: string;
  source: string;
  createdAt: string;
}

export function SuppressionManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    try {
      const res = await fetch('/api/suppression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.push('Number added to suppression list.', 'success');
      setPhone('');
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1 min-w-[220px]">
          <label className="label">Add a number to permanently suppress</label>
          <input
            className="input"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <button className="btn-danger" disabled={busy || !phone} onClick={add}>
          🚫 Suppress number
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="🚫" title="Suppression list is empty" description="Numbers added here or captured from do-not-call requests will appear in this list." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-grayMid bg-brand-gray/50 text-left text-xs uppercase text-brand-grayText">
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-brand-grayMid/60">
                  <td className="px-4 py-3 font-mono text-brand-navy">{r.masked}</td>
                  <td className="px-4 py-3 text-brand-grayText">{r.reason}</td>
                  <td className="px-4 py-3 text-brand-grayText">{r.source}</td>
                  <td className="px-4 py-3 text-brand-grayText">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
