'use client';

import { useState } from 'react';
import { PageTitle, Panel, inputClass, labelClass } from './ui';
import type { SiteContent } from '@/lib/types';

const FIELDS: { key: keyof SiteContent; label: string; area?: boolean; group: string }[] = [
  { key: 'heroHeadline', label: 'Hero headline', group: 'Hero' },
  { key: 'heroSub', label: 'Hero supporting text', area: true, group: 'Hero' },
  { key: 'heroBadge', label: 'Location badge', group: 'Hero' },
  { key: 'aboutTitle', label: 'About title', group: 'About & Story' },
  { key: 'aboutBody', label: 'About body', area: true, group: 'About & Story' },
  { key: 'coffeeStory', label: 'Coffee story', area: true, group: 'About & Story' },
  { key: 'openingHours', label: 'Opening hours', group: 'Contact' },
  { key: 'phone', label: 'Phone', group: 'Contact' },
  { key: 'email', label: 'Email', group: 'Contact' },
  { key: 'address', label: 'Address', area: true, group: 'Contact' },
  { key: 'instagram', label: 'Instagram URL', group: 'Social' },
  { key: 'facebook', label: 'Facebook URL', group: 'Social' },
  { key: 'orderingUrl', label: 'Ordering URL', group: 'Ordering & Maps' },
  { key: 'mapsUrl', label: 'Google Maps URL', group: 'Ordering & Maps' },
  { key: 'directionsUrl', label: 'Directions URL', group: 'Ordering & Maps' },
];

const GROUPS = ['Hero', 'About & Story', 'Contact', 'Social', 'Ordering & Maps'];

export default function ContentEditor({ initial }: { initial: SiteContent }) {
  const [form, setForm] = useState<SiteContent>(initial);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? 'Saved. Live site updates within a few minutes.' : j.error || 'Could not save.');
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageTitle title="Website Content" sub="Edit the words and links across the public site." />
        <button disabled={busy} onClick={save} className="glass-btn glass-btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-60">
          {busy ? 'Saving…' : 'Save all'}
        </button>
      </div>

      {msg && <div className="mb-4 rounded-lg border border-copper-400/30 bg-copper-500/10 px-3 py-2 text-xs text-copper-200">{msg}</div>}

      <div className="grid gap-4">
        {GROUPS.map((g) => (
          <Panel key={g}>
            <h3 className="mb-4 font-display text-lg font-semibold text-cream-100">{g}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.filter((f) => f.group === g).map((f) => (
                <div key={f.key} className={f.area ? 'sm:col-span-2' : ''}>
                  <label className={labelClass}>{f.label}</label>
                  {f.area ? (
                    <textarea
                      rows={3}
                      className={inputClass}
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    />
                  ) : (
                    <input
                      className={inputClass}
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
