'use client';

import { useState } from 'react';
import { PageTitle, Panel, inputClass, labelClass } from './ui';
import type { CafeEvent } from '@/lib/types';

const empty: CafeEvent = {
  id: '',
  title: '',
  date: new Date().toISOString().slice(0, 10),
  time: '8:00 PM',
  description: '',
  image: '',
  bookingUrl: null,
  published: true,
};

export default function EventsManager({ initial }: { initial: CafeEvent[] }) {
  const [items, setItems] = useState<CafeEvent[]>(initial);
  const [editing, setEditing] = useState<CafeEvent | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(ev: CafeEvent) {
    setBusy(true);
    setMsg('');
    const isNew = !ev.id;
    const res = await fetch(isNew ? '/api/admin/events' : `/api/admin/events/${ev.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(ev),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      const saved: CafeEvent = j.data
        ? { ...ev, ...j.data, bookingUrl: j.data.booking_url ?? ev.bookingUrl }
        : ev;
      setItems((prev) =>
        prev.find((p) => p.id === saved.id)
          ? prev.map((p) => (p.id === saved.id ? saved : p))
          : [...prev, saved],
      );
      setEditing(null);
      setMsg('Saved.');
    } else setMsg(j.error || 'Could not save.');
  }

  async function remove(id: string) {
    if (!confirm('Delete this event?')) return;
    const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    const j = await res.json().catch(() => ({}));
    if (res.ok) setItems((prev) => prev.filter((p) => p.id !== id));
    else setMsg(j.error || 'Could not delete.');
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageTitle title="Events" sub="Program the café after dark." />
        <button onClick={() => setEditing({ ...empty })} className="glass-btn glass-btn-primary px-4 py-2 text-xs font-semibold">
          + Create event
        </button>
      </div>

      {msg && <div className="mb-4 rounded-lg border border-copper-400/30 bg-copper-500/10 px-3 py-2 text-xs text-copper-200">{msg}</div>}

      <div className="grid gap-3">
        {items.map((ev) => (
          <Panel key={ev.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-cream-100">{ev.title}</span>
                {!ev.published && <span className="rounded-full bg-cream-100/8 px-2 py-0.5 text-[10px] text-cream-200/60">draft</span>}
              </div>
              <p className="mt-1 text-xs text-cream-200/60">
                {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {ev.time}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(ev)} className="glass-btn px-3 py-1.5 text-xs text-cream-100">Edit</button>
              <button onClick={() => remove(ev.id)} className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10">Delete</button>
            </div>
          </Panel>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="glass-dark grain absolute inset-0" />
          <div onClick={(e) => e.stopPropagation()} className="glass grain glass-refract relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold text-cream-100">{editing.id ? 'Edit event' : 'New event'}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Title</label>
                <input className={inputClass} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" className={inputClass} value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Time</label>
                <input className={inputClass} value={editing.time} onChange={(e) => setEditing({ ...editing, time: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea rows={3} className={inputClass} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Image URL</label>
                <input className={inputClass} value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Booking link (optional)</label>
                <input className={inputClass} placeholder="https://…" value={editing.bookingUrl ?? ''} onChange={(e) => setEditing({ ...editing, bookingUrl: e.target.value || null })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-cream-200/80">
                <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
                Published
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="glass-btn px-4 py-2 text-xs text-cream-100">Cancel</button>
              <button disabled={busy} onClick={() => save(editing)} className="glass-btn glass-btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-60">
                {busy ? 'Saving…' : 'Save event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
