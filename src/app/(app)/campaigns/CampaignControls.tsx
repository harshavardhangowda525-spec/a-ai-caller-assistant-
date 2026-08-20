'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui';
import { useToast } from '@/components/Toast';

interface Preflight {
  total: number;
  eligible: number;
  suppressed: number;
  invalid: number;
  noConsent: number;
}

export function CampaignControls({
  campaignId,
  status,
  preflight,
  campaignName,
}: {
  campaignId: string;
  status: string;
  preflight: Preflight;
  campaignName: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function act(action: string, body?: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Action failed');
      toast.push(`Campaign ${action}`, 'success');
      setConfirmOpen(false);
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(status === 'draft' || status === 'stopped' || status === 'completed') && (
        <button className="btn-primary" onClick={() => setConfirmOpen(true)}>
          ▶ Start Campaign
        </button>
      )}
      {status === 'running' && (
        <button className="btn-ghost" onClick={() => act('pause')} disabled={busy}>
          ⏸ Pause
        </button>
      )}
      {status === 'paused' && (
        <button className="btn-primary" onClick={() => act('resume')} disabled={busy}>
          ▶ Resume
        </button>
      )}
      {(status === 'running' || status === 'paused') && (
        <button className="btn-danger" onClick={() => act('stop')} disabled={busy}>
          ⏹ Stop
        </button>
      )}
      <button className="btn-ghost" onClick={() => act('clear-completed')} disabled={busy}>
        🧹 Clear Completed
      </button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm campaign start"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={!confirmed || busy || preflight.eligible === 0}
              onClick={() => act('start', { confirmed: true })}
            >
              Start calling {preflight.eligible} lead(s)
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-brand-grayText">
            You are about to start <b className="text-brand-navy">{campaignName}</b>. Calls
            are placed sequentially, one at a time.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Row label="Total leads" value={preflight.total} />
            <Row label="Eligible leads" value={preflight.eligible} tone="text-brand-royal" />
            <Row label="Suppressed leads" value={preflight.suppressed} />
            <Row label="Invalid leads" value={preflight.invalid} tone="text-status-danger" />
            <Row label="No-consent leads" value={preflight.noConsent} tone="text-status-danger" />
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-status-warn/40 bg-status-warn/5 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span className="text-brand-navy">
              I confirm the uploaded contacts are permitted to receive these commercial
              calls and that my telephony configuration complies with applicable Indian
              telecom requirements.
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, tone = 'text-brand-navy' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-brand-gray/50 px-3 py-2">
      <span className="text-brand-grayText">{label}</span>
      <span className={`font-extrabold ${tone}`}>{value}</span>
    </div>
  );
}
