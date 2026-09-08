'use client';

import { useState } from 'react';
import { PageTitle, Panel, inputClass, labelClass } from './ui';
import SmartImage from '@/components/glass/SmartImage';
import type { GalleryCategory, GalleryImage } from '@/lib/types';

const CATS: GalleryCategory[] = ['coffee', 'food', 'vibe', 'events', 'interior'];
const SPANS = ['normal', 'wide', 'tall'] as const;

const empty: GalleryImage = {
  id: '',
  src: '',
  caption: '',
  category: 'coffee',
  span: 'normal',
  sort: 0,
};

export default function GalleryManager({ initial }: { initial: GalleryImage[] }) {
  const [items, setItems] = useState<GalleryImage[]>(initial);
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(img: GalleryImage) {
    setBusy(true);
    setMsg('');
    const isNew = !img.id;
    const res = await fetch(isNew ? '/api/admin/gallery' : `/api/admin/gallery/${img.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(img),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      const saved = j.data ?? img;
      setItems((prev) =>
        prev.find((p) => p.id === saved.id) ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved],
      );
      setEditing(null);
      setMsg('Saved.');
    } else setMsg(j.error || 'Could not save.');
  }

  async function remove(id: string) {
    if (!confirm('Delete this photo?')) return;
    const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
    const j = await res.json().catch(() => ({}));
    if (res.ok) setItems((prev) => prev.filter((p) => p.id !== id));
    else setMsg(j.error || 'Could not delete.');
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageTitle title="Gallery" sub="Upload and organise photos by category." />
        <button onClick={() => setEditing({ ...empty })} className="glass-btn glass-btn-primary px-4 py-2 text-xs font-semibold">
          + Add photo
        </button>
      </div>

      {msg && <div className="mb-4 rounded-lg border border-copper-400/30 bg-copper-500/10 px-3 py-2 text-xs text-copper-200">{msg}</div>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((img) => (
          <Panel key={img.id} className="!p-2">
            <div className="relative h-32 overflow-hidden rounded-xl">
              <SmartImage src={img.src} alt={img.caption} className="h-full w-full" />
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="truncate text-xs text-cream-200/70">{img.caption || img.category}</span>
              <div className="flex gap-1">
                <button onClick={() => setEditing(img)} className="rounded px-2 py-0.5 text-[11px] text-copper-300 hover:bg-cream-100/10">Edit</button>
                <button onClick={() => remove(img.id)} className="rounded px-2 py-0.5 text-[11px] text-red-300 hover:bg-red-400/10">Del</button>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="glass-dark grain absolute inset-0" />
          <div onClick={(e) => e.stopPropagation()} className="glass grain glass-refract relative z-10 w-full max-w-md rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold text-cream-100">{editing.id ? 'Edit photo' : 'New photo'}</h3>
            <div className="mt-4 grid gap-3">
              <div>
                <label className={labelClass}>Image URL</label>
                <input className={inputClass} placeholder="/images/gallery-x.jpg or https://…" value={editing.src} onChange={(e) => setEditing({ ...editing, src: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Caption</label>
                <input className={inputClass} value={editing.caption} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Category</label>
                  <select className={inputClass} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as GalleryCategory })}>
                    {CATS.map((c) => <option key={c} value={c} className="bg-espresso-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Span</label>
                  <select className={inputClass} value={editing.span} onChange={(e) => setEditing({ ...editing, span: e.target.value as GalleryImage['span'] })}>
                    {SPANS.map((s) => <option key={s} value={s} className="bg-espresso-900">{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="glass-btn px-4 py-2 text-xs text-cream-100">Cancel</button>
              <button disabled={busy} onClick={() => save(editing)} className="glass-btn glass-btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-60">
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
