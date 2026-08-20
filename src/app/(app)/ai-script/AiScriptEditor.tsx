'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface ScriptConfig {
  companyName: string;
  websitePriceFrom: string;
  appPriceFrom: string;
  approvedInformation: string;
}

const SAFETY_RULES = [
  'Always identifies itself as an automated AI assistant when asked — never claims to be human.',
  'Only states approved information. Never invents prices, services, guarantees, or discounts.',
  'Never pressures anyone; stops the pitch the moment they refuse.',
  'Honours do-not-call requests and adds the number to the suppression list.',
  'Only transfers to the owner after the caller explicitly agrees.',
];

export function AiScriptEditor({ initial }: { initial: ScriptConfig }) {
  const router = useRouter();
  const toast = useToast();
  const [cfg, setCfg] = useState<ScriptConfig>(initial);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_script: cfg }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      toast.push('AI script saved.', 'success');
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  const greeting = `Hi, I'm calling from ${cfg.companyName}. We provide websites and mobile apps for local businesses at affordable prices. Our websites start at ${cfg.websitePriceFrom} and our mobile apps start at ${cfg.appPriceFrom}. Would you be interested in hearing a little more?`;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="card space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="label">Company name</label>
            <input
              className="input"
              value={cfg.companyName}
              onChange={(e) => setCfg({ ...cfg, companyName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Website price from</label>
            <input
              className="input"
              value={cfg.websitePriceFrom}
              onChange={(e) => setCfg({ ...cfg, websitePriceFrom: e.target.value })}
            />
          </div>
          <div>
            <label className="label">App price from</label>
            <input
              className="input"
              value={cfg.appPriceFrom}
              onChange={(e) => setCfg({ ...cfg, appPriceFrom: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Approved information (the only facts the AI may state)</label>
          <textarea
            className="input min-h-[160px]"
            value={cfg.approvedInformation}
            onChange={(e) => setCfg({ ...cfg, approvedInformation: e.target.value })}
          />
        </div>
        <button className="btn-primary" onClick={save} disabled={busy}>
          Save script
        </button>
      </div>

      <div className="space-y-4">
        <div className="card p-6">
          <h3 className="text-sm font-bold text-brand-navy">Opening line (preview)</h3>
          <p className="mt-2 rounded-lg bg-brand-gray/60 p-3 text-sm italic text-brand-navy">
            “{greeting}”
          </p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-bold text-brand-navy">Enforced safety rules</h3>
          <ul className="mt-2 space-y-2 text-sm text-brand-grayText">
            {SAFETY_RULES.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-status-success">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
