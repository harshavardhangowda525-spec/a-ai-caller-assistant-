'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface Settings {
  delay: number;
  maxRetries: number;
  recordingEnabled: boolean;
  productionCallingEnabled: boolean;
}

interface ConfigStatus {
  provider: string;
  aiProvider: string;
  callerIdConfigured: boolean;
  callerIdVerified: boolean;
  callerIdReason?: string;
  ownerTransferConfigured: boolean;
  isMock: boolean;
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`badge ${ok ? 'bg-status-success/15 text-status-success' : 'bg-status-danger/15 text-status-danger'}`}
    >
      {ok ? '✓' : '✕'} {label}
    </span>
  );
}

export function SettingsForm({
  initial,
  configStatus,
}: {
  initial: Settings;
  configStatus: ConfigStatus;
}) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delay_between_calls_seconds: s.delay,
          max_retries: s.maxRetries,
          recording_enabled: s.recordingEnabled,
          production_calling_enabled: s.productionCallingEnabled,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      toast.push('Settings saved.', 'success');
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="card space-y-4 p-6">
        <h3 className="text-sm font-bold text-brand-navy">Calling behaviour</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Delay between calls (s)</label>
            <input
              type="number"
              min={0}
              className="input"
              value={s.delay}
              onChange={(e) => setS({ ...s, delay: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Max attempts / lead</label>
            <input
              type="number"
              min={0}
              className="input"
              value={s.maxRetries}
              onChange={(e) => setS({ ...s, maxRetries: Number(e.target.value) })}
            />
          </div>
        </div>

        <label className="flex items-center justify-between rounded-lg bg-brand-gray/50 px-3 py-2.5 text-sm">
          <span className="text-brand-navy">
            Recording enabled
            <span className="block text-xs text-brand-grayText">
              Only enable where legally permitted, with disclosure.
            </span>
          </span>
          <input
            type="checkbox"
            checked={s.recordingEnabled}
            onChange={(e) => setS({ ...s, recordingEnabled: e.target.checked })}
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-status-warn/40 bg-status-warn/5 px-3 py-2.5 text-sm">
          <span className="text-brand-navy">
            Production calling enabled
            <span className="block text-xs text-brand-grayText">
              Master switch acknowledging you accept compliance responsibility.
            </span>
          </span>
          <input
            type="checkbox"
            checked={s.productionCallingEnabled}
            onChange={(e) => setS({ ...s, productionCallingEnabled: e.target.checked })}
          />
        </label>

        <button className="btn-primary" onClick={save} disabled={busy}>
          Save settings
        </button>
      </div>

      <div className="space-y-4">
        <div className="card p-6">
          <h3 className="text-sm font-bold text-brand-navy">Provider configuration</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge bg-brand-royal/15 text-brand-royal">
              Telephony: {configStatus.provider.toUpperCase()}
            </span>
            <span className="badge bg-brand-royal/15 text-brand-royal">
              AI: {configStatus.aiProvider.toUpperCase()}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-grayText">Outbound caller ID</span>
              <StatusPill ok={configStatus.callerIdConfigured} label={configStatus.callerIdConfigured ? 'Configured' : 'Missing'} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-grayText">Caller ID provider-verified (no spoof)</span>
              <StatusPill ok={configStatus.callerIdVerified} label={configStatus.callerIdVerified ? 'Verified' : 'Not verified'} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-grayText">Owner transfer number</span>
              <StatusPill ok={configStatus.ownerTransferConfigured} label={configStatus.ownerTransferConfigured ? 'Configured' : 'Missing'} />
            </div>
          </div>
          {!configStatus.callerIdVerified && configStatus.callerIdReason && (
            <p className="mt-3 rounded-lg bg-status-danger/5 p-3 text-xs text-status-danger">
              {configStatus.callerIdReason}
            </p>
          )}
          <p className="mt-3 text-xs text-brand-grayText">
            The caller ID and owner transfer number are configured only via secure
            server environment variables (<code>OUTBOUND_CALLER_ID</code>,{' '}
            <code>OWNER_TRANSFER_NUMBER</code>). They are never sent to the browser.
          </p>
        </div>

        {configStatus.isMock && (
          <div className="card border-status-warn/40 bg-status-warn/5 p-5 text-sm text-brand-navy">
            <b>Mock mode.</b> No real calls are placed. Connect a telephony provider and a
            verified caller ID to enable live calling. See the README.
          </div>
        )}
      </div>
    </div>
  );
}
