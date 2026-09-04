'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { EventService } from '@/lib/types';
import { inr } from '@/lib/money';
import { uid } from '@/lib/format';
import { Glass, Btn, Chip, Field, Select, Modal, PageTitle, FieldRow, ConfirmDialog } from '@/components/ui';

function blank(cat: string): EventService {
  return { id: '', name: '', category: cat, unitPrice: 0 };
}

export default function ServicesPage() {
  const { data, mutate, toast } = useStore();
  const [edit, setEdit] = useState<EventService | null>(null);
  const [del, setDel] = useState<EventService | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const rows = useMemo(
    () =>
      data.services
        .filter((s) => (cat === 'all' ? true : s.category === cat))
        .filter((s) => (q ? s.name.toLowerCase().includes(q.toLowerCase()) : true)),
    [data.services, cat, q],
  );

  function save() {
    if (!edit || !edit.name.trim()) { toast('Name required', 'error'); return; }
    mutate((d) => {
      if (edit.id) { const i = d.services.findIndex((s) => s.id === edit.id); if (i >= 0) d.services[i] = edit; }
      else d.services.push({ ...edit, id: uid('sv') });
    });
    toast(edit.id ? 'Service updated' : 'Service added', 'success');
    setEdit(null);
  }

  return (
    <div>
      <PageTitle title="Event Services" subtitle="À la carte offerings" icon="✨" actions={<Btn variant="primary" onClick={() => setEdit(blank(data.settings.serviceCategories[0] ?? 'Venue'))}><Plus size={15} /> New service</Btn>} />

      <Glass className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services…" className="pl-9" />
          </div>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-44">
            <option value="all">All categories</option>
            {data.settings.serviceCategories.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="p-2.5">Service</th><th className="p-2.5">Category</th><th className="p-2.5 text-right">Unit price</th><th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-glass-border/30 transition hover:bg-ink/4">
                  <td className="p-2.5 font-medium">{s.name}</td>
                  <td className="p-2.5"><Chip tone="info">{s.category}</Chip></td>
                  <td className="p-2.5 text-right font-semibold">{inr(s.unitPrice)}</td>
                  <td className="p-2.5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEdit({ ...s })} className="btn btn-ghost !p-1.5 rounded-lg"><Pencil size={15} /></button>
                      <button onClick={() => setDel(s)} className="btn btn-ghost !p-1.5 rounded-lg text-bad"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Glass>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit service' : 'New service'}
        footer={<><Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn><Btn variant="primary" onClick={save}>Save</Btn></>}>
        {edit && (
          <div className="space-y-4">
            <FieldRow label="Service name"><Field value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Photography" /></FieldRow>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Category">
                <Select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>
                  {data.settings.serviceCategories.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </FieldRow>
              <FieldRow label="Unit price (₹)"><Field type="number" value={edit.unitPrice} onChange={(e) => setEdit({ ...edit, unitPrice: +e.target.value || 0 })} /></FieldRow>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!del} title="Delete service?" message={`"${del?.name}" will be removed.`} confirmLabel="Delete" danger onConfirm={() => { if (del) { mutate((d) => { d.services = d.services.filter((s) => s.id !== del.id); }); toast('Service deleted', 'info'); } }} onClose={() => setDel(null)} />
    </div>
  );
}
