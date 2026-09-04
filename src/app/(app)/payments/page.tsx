'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Wallet, Clock3, Banknote, RotateCcw, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Payment, PaymentMethod, PaymentKind } from '@/lib/types';
import { inr } from '@/lib/money';
import { fmtDate, today, uid } from '@/lib/format';
import { invoiceTotal, invoicePaid, customerName } from '@/lib/selectors';
import { Glass, Btn, Chip, Field, Select, Modal, PageTitle, EmptyState, FieldRow, TextArea } from '@/components/ui';
import { KpiCard } from '@/components/Metrics';
import { PAYMENT_LABEL } from '@/lib/status';

function blank(): Omit<Payment, 'id'> {
  return { date: today(), amount: 0, method: 'upi', kind: 'in', invoiceId: null, eventId: null, customerId: null, reference: '', notes: '' };
}

function PaymentsInner() {
  const { data, mutate, toast, notify } = useStore();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [method, setMethod] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank());

  useEffect(() => { if (params.get('new') === '1') { setForm(blank()); setOpen(true); } }, [params]);

  const kpis = useMemo(() => {
    const received = data.payments.filter((p) => p.kind === 'in').reduce((s, p) => s + p.amount, 0);
    const refunds = data.payments.filter((p) => p.kind === 'refund').reduce((s, p) => s + p.amount, 0);
    const pending = data.invoices.filter((i) => i.status !== 'paid' && i.status !== 'draft').reduce((s, i) => s + Math.max(0, invoiceTotal(i, data.settings) - invoicePaid(data, i.id)), 0);
    const advance = data.payments.filter((p) => p.notes.toLowerCase().includes('advance')).reduce((s, p) => s + p.amount, 0);
    return { received, refunds, pending, advance };
  }, [data]);

  const rows = useMemo(
    () =>
      [...data.payments]
        .filter((p) => (method === 'all' ? true : p.method === method))
        .filter((p) => (q ? (p.reference + p.notes + customerName(data, p.customerId)).toLowerCase().includes(q.toLowerCase()) : true))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.payments, method, q, data],
  );

  function save() {
    if (form.amount <= 0) { toast('Enter an amount', 'error'); return; }
    mutate((d) => {
      const inv = form.invoiceId ? d.invoices.find((i) => i.id === form.invoiceId) : null;
      d.payments.unshift({ id: uid('py'), ...form, eventId: inv?.eventId ?? form.eventId, customerId: inv?.customerId ?? form.customerId });
      if (inv) {
        const paid = d.payments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + (p.kind === 'refund' ? -p.amount : p.amount), 0);
        const total = invoiceTotal(inv, d.settings);
        inv.status = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
      }
    });
    if (form.kind === 'in') notify({ type: 'payment_received', title: 'Payment received', message: `${inr(form.amount)} via ${PAYMENT_LABEL[form.method]}` });
    toast(form.kind === 'refund' ? 'Refund recorded' : 'Payment recorded', 'success');
    setOpen(false);
  }

  const openInvoices = data.invoices.filter((i) => i.status !== 'paid');

  return (
    <div>
      <PageTitle title="Payments" subtitle="All money in &amp; out" icon="💰" actions={<Btn variant="primary" onClick={() => { setForm(blank()); setOpen(true); }}><Plus size={15} /> Record payment</Btn>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total received" value={kpis.received} format={(n) => inr(n)} icon={<Wallet size={18} />} accent="good" />
        <KpiCard label="Pending" value={kpis.pending} format={(n) => inr(n)} icon={<Clock3 size={18} />} accent="warn" />
        <KpiCard label="Advance payments" value={kpis.advance} format={(n) => inr(n)} icon={<Banknote size={18} />} accent="brand" />
        <KpiCard label="Refunds" value={kpis.refunds} format={(n) => inr(n)} icon={<RotateCcw size={18} />} accent="bad" />
      </div>

      <Glass className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search payments…" className="pl-9" />
          </div>
          <Select value={method} onChange={(e) => setMethod(e.target.value)} className="w-40">
            <option value="all">All methods</option>
            {(['cash', 'upi', 'card', 'bank', 'other'] as PaymentMethod[]).map((m) => <option key={m} value={m}>{PAYMENT_LABEL[m]}</option>)}
          </Select>
        </div>

        {rows.length ? (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="p-2.5">Date</th><th className="p-2.5">Customer</th><th className="p-2.5">Invoice</th>
                  <th className="p-2.5">Method</th><th className="p-2.5">Reference</th><th className="p-2.5">Notes</th>
                  <th className="p-2.5 text-right">Amount</th><th className="p-2.5 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const inv = data.invoices.find((i) => i.id === p.invoiceId);
                  return (
                    <tr key={p.id} className="border-t border-glass-border/30 transition hover:bg-ink/4">
                      <td className="p-2.5 text-ink-faint">{fmtDate(p.date)}</td>
                      <td className="p-2.5">{customerName(data, p.customerId)}</td>
                      <td className="p-2.5 text-ink-soft">{inv?.number ?? '—'}</td>
                      <td className="p-2.5"><Chip tone="info">{PAYMENT_LABEL[p.method]}</Chip></td>
                      <td className="p-2.5 text-ink-soft">{p.reference || '—'}</td>
                      <td className="p-2.5 text-ink-faint">{p.notes || '—'}</td>
                      <td className={`p-2.5 text-right font-semibold ${p.kind === 'refund' ? 'text-bad' : 'text-good'}`}>{p.kind === 'refund' ? '- ' : ''}{inr(p.amount)}</td>
                      <td className="p-2.5 text-right">
                        <button onClick={() => { mutate((d) => { d.payments = d.payments.filter((x) => x.id !== p.id); }); toast('Deleted', 'info'); }} className="btn btn-ghost !p-1.5 rounded-lg text-bad"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="💰" title="No payments" hint="Record a payment to see it here." />
        )}
      </Glass>

      <Modal open={open} onClose={() => setOpen(false)} title="Record payment"
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={save}>Save</Btn></>}>
        <div className="space-y-4">
          <div className="inline-flex w-full glass-2 rounded-xl p-1">
            {(['in', 'refund'] as PaymentKind[]).map((k) => (
              <button key={k} onClick={() => setForm({ ...form, kind: k })} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition ${form.kind === k ? (k === 'refund' ? 'bg-bad text-white' : 'bg-good text-white') : 'text-ink-soft'}`}>
                {k === 'in' ? 'Payment in' : 'Refund'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Amount (₹)"><Field type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value || 0 })} autoFocus /></FieldRow>
            <FieldRow label="Method">
              <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}>
                {(['cash', 'upi', 'card', 'bank', 'other'] as PaymentMethod[]).map((m) => <option key={m} value={m}>{PAYMENT_LABEL[m]}</option>)}
              </Select>
            </FieldRow>
          </div>
          <FieldRow label="Against invoice">
            <Select value={form.invoiceId ?? ''} onChange={(e) => setForm({ ...form, invoiceId: e.target.value || null })}>
              <option value="">None</option>
              {openInvoices.map((i) => <option key={i.id} value={i.id}>{i.number} · {i.title} · due {inr(Math.max(0, invoiceTotal(i, data.settings) - invoicePaid(data, i.id)))}</option>)}
            </Select>
          </FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Customer">
              <Select value={form.customerId ?? ''} onChange={(e) => setForm({ ...form, customerId: e.target.value || null })}>
                <option value="">—</option>
                {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FieldRow>
            <FieldRow label="Date"><Field type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></FieldRow>
          </div>
          <FieldRow label="Reference"><Field value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Txn ID / cheque no." /></FieldRow>
          <FieldRow label="Notes"><TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></FieldRow>
        </div>
      </Modal>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={null}>
      <PaymentsInner />
    </Suspense>
  );
}
