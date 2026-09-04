'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, Star, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { EventPackage } from '@/lib/types';
import { inr } from '@/lib/money';
import { uid } from '@/lib/format';
import { Glass, Btn, Chip, Field, Modal, PageTitle, FieldRow, ConfirmDialog } from '@/components/ui';

function blank(): EventPackage {
  return { id: '', name: '', price: 0, includes: [], featured: false };
}

export default function PackagesPage() {
  const { data, mutate, toast } = useStore();
  const [edit, setEdit] = useState<EventPackage | null>(null);
  const [del, setDel] = useState<EventPackage | null>(null);
  const [incl, setIncl] = useState('');

  function save() {
    if (!edit || !edit.name.trim()) { toast('Name required', 'error'); return; }
    mutate((d) => {
      if (edit.id) {
        const i = d.packages.findIndex((p) => p.id === edit.id);
        if (i >= 0) d.packages[i] = edit;
      } else {
        d.packages.push({ ...edit, id: uid('pk') });
      }
    });
    toast(edit.id ? 'Package updated' : 'Package added', 'success');
    setEdit(null);
  }

  return (
    <div>
      <PageTitle title="Event Packages" subtitle="Pre-built offerings" icon="🎁" actions={<Btn variant="primary" onClick={() => setEdit(blank())}><Plus size={15} /> New package</Btn>} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.packages.map((pk) => (
          <Glass key={pk.id} hover className={`relative flex flex-col p-5 ${pk.featured ? 'ring-2 ring-brand/40' : ''}`}>
            {pk.featured && <span className="absolute right-4 top-4"><Chip tone="brand"><Star size={11} /> Popular</Chip></span>}
            <div className="text-lg font-bold">{pk.name}</div>
            <div className="mt-1 text-3xl font-black text-gradient">{inr(pk.price)}</div>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm">
              {pk.includes.map((inc, i) => (
                <li key={i} className="flex items-start gap-2 text-ink-soft"><Check size={15} className="mt-0.5 shrink-0 text-good" /> {inc}</li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2 border-t border-glass-border/40 pt-3">
              <Btn variant="glass" className="flex-1 !py-1.5 text-xs" onClick={() => setEdit({ ...pk, includes: [...pk.includes] })}><Pencil size={13} /> Edit</Btn>
              <Btn variant="ghost" className="!py-1.5 text-xs text-bad" onClick={() => setDel(pk)}><Trash2 size={13} /></Btn>
            </div>
          </Glass>
        ))}
        <button onClick={() => setEdit(blank())} className="glass glass-hover grid min-h-[220px] place-items-center rounded-glass text-ink-faint">
          <span className="flex flex-col items-center gap-2"><Plus size={28} /> Add custom package</span>
        </button>
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit package' : 'New package'}
        footer={<><Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn><Btn variant="primary" onClick={save}>Save</Btn></>}
      >
        {edit && (
          <div className="space-y-4">
            <FieldRow label="Package name"><Field value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Premium" /></FieldRow>
            <FieldRow label="Price (₹)"><Field type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: +e.target.value || 0 })} /></FieldRow>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!edit.featured} onChange={(e) => setEdit({ ...edit, featured: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--brand))]" />
              Mark as popular
            </label>
            <div>
              <span className="lbl">Inclusions</span>
              <div className="mb-2 space-y-1.5">
                {edit.includes.map((inc, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg glass-2 px-2.5 py-1.5 text-sm">
                    <Check size={14} className="text-good" />
                    <span className="flex-1">{inc}</span>
                    <button onClick={() => setEdit({ ...edit, includes: edit.includes.filter((_, x) => x !== i) })} className="text-ink-faint hover:text-bad"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Field value={incl} onChange={(e) => setIncl(e.target.value)} placeholder="Add an inclusion…" onKeyDown={(e) => { if (e.key === 'Enter' && incl.trim()) { setEdit({ ...edit, includes: [...edit.includes, incl.trim()] }); setIncl(''); } }} />
                <Btn variant="glass" onClick={() => { if (incl.trim()) { setEdit({ ...edit, includes: [...edit.includes, incl.trim()] }); setIncl(''); } }}><Plus size={15} /></Btn>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!del} title="Delete package?" message={`"${del?.name}" will be removed.`} confirmLabel="Delete" danger onConfirm={() => { if (del) { mutate((d) => { d.packages = d.packages.filter((p) => p.id !== del.id); }); toast('Package deleted', 'info'); } }} onClose={() => setDel(null)} />
    </div>
  );
}
