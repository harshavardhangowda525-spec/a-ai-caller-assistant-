'use client';

import { useState } from 'react';
import { PageTitle, Panel, inputClass, labelClass } from './ui';
import type { MenuCategory, MenuItem } from '@/lib/types';

const CATS: MenuCategory[] = ['coffee', 'signature', 'cold', 'food', 'dessert'];

const empty: MenuItem = {
  id: '',
  name: '',
  description: '',
  price: 0,
  category: 'coffee',
  image: '',
  available: true,
  featured: false,
  sort: 0,
};

export default function MenuManager({ initial }: { initial: MenuItem[] }) {
  const [items, setItems] = useState<MenuItem[]>(initial);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(item: MenuItem) {
    setBusy(true);
    setMsg('');
    const isNew = !item.id;
    const url = isNew ? '/api/admin/menu' : `/api/admin/menu/${item.id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(item),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      const saved = j.data ?? item;
      setItems((prev) => {
        const exists = prev.find((p) => p.id === saved.id);
        return exists
          ? prev.map((p) => (p.id === saved.id ? saved : p))
          : [...prev, saved];
      });
      setEditing(null);
      setMsg('Saved.');
    } else {
      setMsg(j.error || 'Could not save.');
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this item?')) return;
    const res = await fetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
    const j = await res.json().catch(() => ({}));
    if (res.ok) setItems((prev) => prev.filter((p) => p.id !== id));
    else setMsg(j.error || 'Could not delete.');
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageTitle title="Menu" sub="Add, edit and manage coffee and food." />
        <button
          onClick={() => setEditing({ ...empty })}
          className="glass-btn glass-btn-primary px-4 py-2 text-xs font-semibold"
        >
          + Add item
        </button>
      </div>

      {msg && <div className="mb-4 rounded-lg border border-copper-400/30 bg-copper-500/10 px-3 py-2 text-xs text-copper-200">{msg}</div>}

      <div className="grid gap-3">
        {items.map((it) => (
          <Panel key={it.id} className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-cream-100">{it.name}</span>
                <span className="rounded-full bg-cream-100/8 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cream-200/60">
                  {it.category}
                </span>
                {!it.available && (
                  <span className="rounded-full bg-red-400/15 px-2 py-0.5 text-[10px] text-red-300">
                    unavailable
                  </span>
                )}
                {it.featured && (
                  <span className="rounded-full bg-copper-500/15 px-2 py-0.5 text-[10px] text-copper-300">
                    featured
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-cream-200/60">{it.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-lg text-copper-300">₹{it.price}</span>
              <button onClick={() => setEditing(it)} className="glass-btn px-3 py-1.5 text-xs text-cream-100">
                Edit
              </button>
              <button onClick={() => remove(it.id)} className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10">
                Delete
              </button>
            </div>
          </Panel>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="glass-dark grain absolute inset-0" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass grain glass-refract relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6"
          >
            <h3 className="font-display text-lg font-semibold text-cream-100">
              {editing.id ? 'Edit item' : 'New item'}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Name</label>
                <input className={inputClass} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea className={inputClass} rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Price (₹)</label>
                <input type="number" className={inputClass} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select className={inputClass} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as MenuCategory })}>
                  {CATS.map((c) => (
                    <option key={c} value={c} className="bg-espresso-900">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Image URL</label>
                <input className={inputClass} placeholder="/images/coffee-x.jpg or https://…" value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Sort order</label>
                <input type="number" className={inputClass} value={editing.sort} onChange={(e) => setEditing({ ...editing, sort: Number(e.target.value) })} />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm text-cream-200/80">
                  <input type="checkbox" checked={editing.available} onChange={(e) => setEditing({ ...editing, available: e.target.checked })} />
                  Available
                </label>
                <label className="flex items-center gap-2 text-sm text-cream-200/80">
                  <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                  Featured
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="glass-btn px-4 py-2 text-xs text-cream-100">
                Cancel
              </button>
              <button disabled={busy} onClick={() => save(editing)} className="glass-btn glass-btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-60">
                {busy ? 'Saving…' : 'Save item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
