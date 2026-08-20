'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui';
import { useToast } from '@/components/Toast';

export function CreateCampaign() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [delaySeconds, setDelay] = useState(30);
  const [maxRetries, setMax] = useState(3);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, delaySeconds, maxRetries }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.push('Campaign created', 'success');
      setOpen(false);
      setName('');
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        ➕ New Campaign
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create campaign"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={!name || busy} onClick={create}>
              Create
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Campaign name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Local Business Outreach" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Delay between calls (s)</label>
              <input
                type="number"
                min={0}
                className="input"
                value={delaySeconds}
                onChange={(e) => setDelay(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Max attempts / lead</label>
              <input
                type="number"
                min={0}
                className="input"
                value={maxRetries}
                onChange={(e) => setMax(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
