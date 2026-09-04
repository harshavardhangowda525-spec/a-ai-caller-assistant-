'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Trash2, Banknote, TrendingDown } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Expense, PaymentMethod } from '@/lib/types';
import { inr } from '@/lib/money';
import { fmtDate, today, uid } from '@/lib/format';
import { Glass, Btn, Chip, Field, Select, Modal, PageTitle, EmptyState, FieldRow } from '@/components/ui';
import { KpiCard } from '@/components/Metrics';
import { PAYMENT_LABEL } from '@/lib/status';

function blank(): Omit<Expense, 'id'> {
  return { eventId: null, category: 'Catering', description: '', amount: 0, date: today(), payee: '', method: 'cash' };
}

function ExpensesInner() {
  const { data, mutate, toast } = useStore();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank());

  useEffect(() => { if (params.get('new') === '1') { setForm(blank()); setOpen(true); } }, [params]);

  const cats = useMemo(() => Array.from(new Set(data.expenses.map((e) => e.category))), [data.expenses]);
  const rows = useMemo(
    () =>
      [...data.expenses]
        .filter((e) => (cat === 'all' ? true : e.category === cat))
        .filter((e) => (q ? (e.description + e.payee).toLowerCase().includes(q.toLowerCase()) : true))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.expenses, cat, q],
  );

  const total = rows.reduce((s, e) => s + e.amount, 0);
  const eventTotal = data.expenses.filter((e) => e.eventId).reduce((s, e) => s + e.amount, 0);
  const opTotal = data.expenses.filter((e) => !e.eventId).reduce((s, e) => s + e.amount, 0);

  function save() {
    if (form.amount <= 0 || !form.description.trim()) { toast('Enter description & amount', 'error'); return; }
    mutate((d) => { d.expenses.unshift({ id: uid('ex'), ...form }); });
    toast('Expense added', 'success');
    setOpen(false);
  }

  const eventName = (id?: string | null) => data.events.find((e) => e.id === id)?.name ?? '—';

  return (
    <div>
      <PageTitle title="Expenses" subtitle="Track spending &amp; costs" icon="💸" actions={<Btn variant="primary" onClick={() => { setForm(blank()); setOpen(true); }}><Plus size={15} /> Add expense</Btn>} />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Total expenses" value={total} format={(n) => inr(n)} icon={<Banknote size={18} />} accent="bad" />
        <KpiCard label="Event expenses" value={eventTotal} format={(n) => inr(n)} icon={<TrendingDown size={18} />} accent="warn" />
        <KpiCard label="Operating expenses" value={opTotal} format={(n) => inr(n)} icon={<TrendingDown size={18} />} accent="info" />
      </div>

      <Glass className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search expenses…" className="pl-9" />
          </div>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-44">
            <option value="all">All categories</option>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </div>

        {rows.length ? (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="p-2.5">Date</th><th className="p-2.5">Category</th><th className="p-2.5">Description</th>
                  <th className="p-2.5">Event</th><th className="p-2.5">Payee</th><th className="p-2.5">Method</th>
                  <th className="p-2.5 text-right">Amount</th><th className="p-2.5 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-t border-glass-border/30 transition hover:bg-ink/4">
                    <td className="p-2.5 text-ink-faint">{fmtDate(e.date)}</td>
                    <td className="p-2.5"><Chip tone="info">{e.category}</Chip></td>
                    <td className="p-2.5">{e.description}</td>
                    <td className="p-2.5 text-ink-soft">{e.eventId ? eventName(e.eventId) : <span className="text-ink-faint">Operating</span>}</td>
                    <td className="p-2.5 text-ink-soft">{e.payee || '—'}</td>
                    <td className="p-2.5 text-ink-soft">{PAYMENT_LABEL[e.method]}</td>
                    <td className="p-2.5 text-right font-semibold text-bad">{inr(e.amount)}</td>
                    <td className="p-2.5 text-right">
                      <button onClick={() => { mutate((d) => { d.expenses = d.expenses.filter((x) => x.id !== e.id); }); toast('Deleted', 'info'); }} className="btn btn-ghost !p-1.5 rounded-lg text-bad"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="💸" title="No expenses" hint="Record your first expense." />
        )}
      </Glass>

      <Modal open={open} onClose={() => setOpen(false)} title="Add expense"
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={save}>Save</Btn></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {data.settings.serviceCategories.concat(['Inventory', 'Utilities', 'Salary', 'Rent', 'Misc']).map((c) => <option key={c}>{c}</option>)}
              </Select>
            </FieldRow>
            <FieldRow label="Amount (₹)"><Field type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value || 0 })} /></FieldRow>
          </div>
          <FieldRow label="Description"><Field value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was this for?" /></FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Link to event">
              <Select value={form.eventId ?? ''} onChange={(e) => setForm({ ...form, eventId: e.target.value || null })}>
                <option value="">Operating (no event)</option>
                {data.events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </Select>
            </FieldRow>
            <FieldRow label="Payee / vendor"><Field value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} /></FieldRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Date"><Field type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></FieldRow>
            <FieldRow label="Method">
              <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}>
                {(['cash', 'upi', 'card', 'bank', 'other'] as PaymentMethod[]).map((m) => <option key={m} value={m}>{PAYMENT_LABEL[m]}</option>)}
              </Select>
            </FieldRow>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={null}>
      <ExpensesInner />
    </Suspense>
  );
}
