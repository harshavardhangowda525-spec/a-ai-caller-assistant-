'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Eye, Copy, Trash2, FileCheck2 } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '@/lib/store';
import type { Invoice, LineItem } from '@/lib/types';
import { computeTotals, inr } from '@/lib/money';
import { fmtDate, today, addDays, uid } from '@/lib/format';
import { nextInvoiceNumber } from '@/lib/numbering';
import { invoiceTotal, invoicePaid, quoteTotal, customerName } from '@/lib/selectors';
import { Glass, Btn, Chip, Field, Select, Modal, PageTitle, EmptyState, FieldRow } from '@/components/ui';
import { INVOICE_STATUS, DOC_STATUS } from '@/lib/status';
import { DocViewer } from '@/components/DocViewer';
import type { DocProps } from '@/components/InvoiceDoc';

type Tab = 'cafe_receipts' | 'cafe_invoices' | 'quotations' | 'event_invoices';
const TABS: { key: Tab; label: string }[] = [
  { key: 'cafe_receipts', label: 'Café Receipts' },
  { key: 'cafe_invoices', label: 'Café Invoices' },
  { key: 'quotations', label: 'Event Quotations' },
  { key: 'event_invoices', label: 'Event Invoices' },
];

function InvoicesInner() {
  const { data, mutate, toast } = useStore();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>('event_invoices');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [doc, setDoc] = useState<DocProps | null>(null);
  const [build, setBuild] = useState(false);

  // builder
  const [bCustomer, setBCustomer] = useState('');
  const [bTitle, setBTitle] = useState('');
  const [bItems, setBItems] = useState<LineItem[]>([]);
  const [bDiscount, setBDiscount] = useState(0);
  const [bTax, setBTax] = useState(data.settings.defaultTaxRate);

  useEffect(() => {
    if (params.get('new') === '1') openBuilder();
    const id = params.get('id');
    if (id) { const inv = data.invoices.find((i) => i.id === id); if (inv) setTab(inv.kind === 'cafe' ? 'cafe_invoices' : 'event_invoices'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function openBuilder() {
    setBCustomer(data.customers[0]?.id ?? ''); setBTitle(''); setBItems([]); setBDiscount(0); setBTax(data.settings.defaultTaxRate); setBuild(true);
  }

  const inRange = (d: string) => (!from || d >= from) && (!to || d <= to);

  const cafeInvoices = data.invoices.filter((i) => i.kind === 'cafe');
  const eventInvoices = data.invoices.filter((i) => i.kind === 'event');

  const filteredInvoices = (list: Invoice[]) =>
    list
      .filter((i) => (status === 'all' ? true : i.status === status))
      .filter((i) => (q ? (i.number + i.title).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((i) => inRange(i.date))
      .sort((a, b) => b.date.localeCompare(a.date));

  const quotes = data.quotations
    .filter((qq) => (status === 'all' ? true : qq.status === status))
    .filter((qq) => (q ? (qq.number + qq.title).toLowerCase().includes(q.toLowerCase()) : true))
    .filter((qq) => inRange(qq.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  function viewInvoice(i: Invoice, kind: 'invoice' | 'receipt') {
    const ev = i.eventId ? data.events.find((e) => e.id === i.eventId) : null;
    setDoc({
      settings: data.settings, kind, number: i.number, date: i.date, dueDate: kind === 'invoice' ? i.dueDate : undefined,
      title: i.title, customer: data.customers.find((c) => c.id === i.customerId) ?? null,
      eventInfo: ev ? { name: ev.name, date: ev.date, venue: ev.venue, guests: ev.guests } : null,
      items: i.items, discountPct: i.discountPct, taxRate: i.taxRate,
      advancePaid: kind === 'invoice' ? invoicePaid(data, i.id) : 0,
      terms: kind === 'invoice' ? data.settings.invoiceTerms : undefined,
    });
  }

  function duplicate(i: Invoice) {
    const invNo = nextInvoiceNumber(data);
    mutate((d) => {
      d.invoices.unshift({ ...i, id: uid('in'), number: invNo, status: 'draft', date: today() });
    });
    toast(`Duplicated as ${invNo}`, 'success');
  }

  function saveInvoice() {
    if (!bItems.length) { toast('Add items', 'error'); return; }
    const invNo = nextInvoiceNumber(data);
    mutate((d) => {
      d.invoices.unshift({
        id: uid('in'), number: invNo, kind: 'event', customerId: bCustomer || null, eventId: null, orderId: null,
        title: bTitle || 'Invoice', items: bItems, discountPct: bDiscount, taxRate: bTax,
        status: 'unpaid', date: today(), dueDate: addDays(today(), 15),
      });
    });
    toast(`Invoice ${invNo} created`, 'success');
    setBuild(false);
  }

  const bTotals = computeTotals(bItems, bDiscount, bTax, { inclusive: data.settings.taxInclusive });

  return (
    <div>
      <PageTitle title="Invoices &amp; Receipts" subtitle="Document center" icon="🧾" actions={<Btn variant="primary" onClick={openBuilder}><Plus size={15} /> New invoice</Btn>} />

      <div className="mb-3 flex flex-wrap gap-1 glass rounded-glass p-1.5">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={clsx('flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition', tab === t.key ? 'bg-brand text-white shadow-glass-sm' : 'text-ink-soft hover:text-ink')}>
            {t.label}
          </button>
        ))}
      </div>

      <Glass className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36">
            <option value="all">All status</option>
            {tab === 'quotations'
              ? Object.entries(DOC_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)
              : Object.entries(INVOICE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
          <Field type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" title="From" />
          <Field type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" title="To" />
        </div>

        {tab === 'quotations' ? (
          quotes.length ? <DocTable
            rows={quotes.map((qq) => ({
              id: qq.id, number: qq.number, title: qq.title, who: customerName(data, qq.customerId), date: qq.date,
              amount: quoteTotal(qq, data.settings), status: <Chip tone={DOC_STATUS[qq.status].tone}>{DOC_STATUS[qq.status].label}</Chip>,
              actions: <button onClick={() => setDoc({ settings: data.settings, kind: 'quotation', number: qq.number, date: qq.date, validUntil: qq.validUntil, title: qq.title, customer: data.customers.find((c) => c.id === qq.customerId) ?? null, items: qq.items, discountPct: qq.discountPct, taxRate: qq.taxRate, terms: qq.terms })} className="btn btn-ghost !p-1.5 rounded-lg"><Eye size={15} /></button>,
            }))}
          /> : <EmptyState icon="📄" title="No quotations" />
        ) : (
          (() => {
            const list = filteredInvoices(tab === 'cafe_receipts' || tab === 'cafe_invoices' ? cafeInvoices : eventInvoices);
            const viewKind = tab === 'cafe_receipts' ? 'receipt' : 'invoice';
            return list.length ? <DocTable
              rows={list.map((i) => ({
                id: i.id, number: i.number, title: i.title, who: customerName(data, i.customerId), date: i.date,
                amount: invoiceTotal(i, data.settings), status: <Chip tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Chip>,
                actions: (
                  <div className="flex justify-end gap-1">
                    <button onClick={() => viewInvoice(i, viewKind)} className="btn btn-ghost !p-1.5 rounded-lg" title="View"><Eye size={15} /></button>
                    <button onClick={() => duplicate(i)} className="btn btn-ghost !p-1.5 rounded-lg" title="Duplicate"><Copy size={15} /></button>
                    <button onClick={() => { mutate((d) => { d.invoices = d.invoices.filter((x) => x.id !== i.id); }); toast('Deleted', 'info'); }} className="btn btn-ghost !p-1.5 rounded-lg text-bad" title="Delete"><Trash2 size={15} /></button>
                  </div>
                ),
              }))}
            /> : <EmptyState icon="🧾" title="No documents here" hint="Documents you generate will appear in this tab." />;
          })()
        )}
      </Glass>

      {/* Builder */}
      <Modal open={build} onClose={() => setBuild(false)} wide title="New invoice"
        footer={<><Btn variant="ghost" onClick={() => setBuild(false)}>Cancel</Btn><Btn variant="primary" onClick={saveInvoice}>Create invoice</Btn></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Customer">
              <Select value={bCustomer} onChange={(e) => setBCustomer(e.target.value)}>
                <option value="">Walk-in</option>
                {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FieldRow>
            <FieldRow label="Title"><Field value={bTitle} onChange={(e) => setBTitle(e.target.value)} placeholder="Invoice title" /></FieldRow>
          </div>
          <div>
            <span className="lbl">Add line — service or product</span>
            <Select onChange={(e) => {
              const [kind, id] = e.target.value.split(':');
              if (kind === 's') { const s = data.services.find((x) => x.id === id); if (s) setBItems((p) => [...p, { id: uid('li'), refId: s.id, name: s.name, qty: 1, price: s.unitPrice }]); }
              if (kind === 'p') { const pr = data.products.find((x) => x.id === id); if (pr) setBItems((p) => [...p, { id: uid('li'), refId: pr.id, name: pr.name, qty: 1, price: pr.price }]); }
              e.target.value = '';
            }} defaultValue="">
              <option value="" disabled>➕ Add an item…</option>
              <optgroup label="Services">{data.services.map((s) => <option key={s.id} value={`s:${s.id}`}>{s.name} · {inr(s.unitPrice)}</option>)}</optgroup>
              <optgroup label="Products">{data.products.map((p) => <option key={p.id} value={`p:${p.id}`}>{p.name} · {inr(p.price)}</option>)}</optgroup>
            </Select>
          </div>
          <div className="space-y-2">
            {bItems.map((i) => (
              <div key={i.id} className="flex items-center gap-2 rounded-xl glass-2 p-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.name}</span>
                <Field type="number" value={i.qty} onChange={(e) => setBItems((p) => p.map((x) => x.id === i.id ? { ...x, qty: Math.max(1, +e.target.value || 1) } : x))} className="w-16 !py-1 text-center" />
                <Field type="number" value={i.price} onChange={(e) => setBItems((p) => p.map((x) => x.id === i.id ? { ...x, price: +e.target.value || 0 } : x))} className="w-24 !py-1 text-right" />
                <span className="w-24 text-right text-sm font-semibold">{inr(i.qty * i.price)}</span>
                <button onClick={() => setBItems((p) => p.filter((x) => x.id !== i.id))} className="text-ink-faint hover:text-bad"><Trash2 size={14} /></button>
              </div>
            ))}
            {!bItems.length && <p className="py-4 text-center text-sm text-ink-faint">Add items to the invoice.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Discount %"><Field type="number" value={bDiscount} onChange={(e) => setBDiscount(Math.max(0, Math.min(100, +e.target.value || 0)))} /></FieldRow>
            <FieldRow label="GST"><Select value={bTax} onChange={(e) => setBTax(+e.target.value)}>{data.settings.taxRates.map((r) => <option key={r.id} value={r.rate}>{r.name}</option>)}</Select></FieldRow>
          </div>
          <Glass className="p-3"><div className="flex justify-between text-sm"><span className="text-ink-faint">Total</span><span className="text-lg font-bold text-gradient">{inr(bTotals.total)}</span></div></Glass>
        </div>
      </Modal>

      <DocViewer open={!!doc} onClose={() => setDoc(null)} doc={doc} />
    </div>
  );
}

interface DocRow { id: string; number: string; title: string; who: string; date: string; amount: number; status: React.ReactNode; actions: React.ReactNode }
function DocTable({ rows }: { rows: DocRow[] }) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="p-2.5">Number</th><th className="p-2.5">Title</th><th className="p-2.5">Customer</th>
            <th className="p-2.5">Date</th><th className="p-2.5 text-right">Amount</th><th className="p-2.5">Status</th><th className="p-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-glass-border/30 transition hover:bg-ink/4">
              <td className="p-2.5 font-semibold">{r.number}</td>
              <td className="p-2.5">{r.title}</td>
              <td className="p-2.5 text-ink-soft">{r.who}</td>
              <td className="p-2.5 text-ink-faint">{fmtDate(r.date)}</td>
              <td className="p-2.5 text-right font-semibold">{inr(r.amount)}</td>
              <td className="p-2.5">{r.status}</td>
              <td className="p-2.5 text-right">{r.actions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={null}>
      <InvoicesInner />
    </Suspense>
  );
}
