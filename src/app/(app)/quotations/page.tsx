'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Eye, FileCheck2, Trash2, Send } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { LineItem, Quotation } from '@/lib/types';
import { computeTotals, inr } from '@/lib/money';
import { fmtDate, today, addDays, uid } from '@/lib/format';
import { nextInvoiceNumber, nextQuoteNumber } from '@/lib/numbering';
import { Glass, Btn, Chip, Field, Select, Modal, PageTitle, EmptyState, FieldRow, TextArea } from '@/components/ui';
import { DOC_STATUS } from '@/lib/status';
import { DocViewer } from '@/components/DocViewer';
import type { DocProps } from '@/components/InvoiceDoc';
import { quoteTotal, customerName } from '@/lib/selectors';

function QuotationsInner() {
  const { data, mutate, toast } = useStore();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [build, setBuild] = useState(false);
  const [doc, setDoc] = useState<DocProps | null>(null);

  // builder state
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [taxRate, setTaxRate] = useState(data.settings.defaultTaxRate);
  const [validDays, setValidDays] = useState(15);
  const [terms, setTerms] = useState(data.settings.invoiceTerms);

  useEffect(() => {
    if (params.get('new') === '1') openBuilder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function openBuilder() {
    setCustomerId(data.customers[0]?.id ?? '');
    setTitle(''); setItems([]); setDiscountPct(0); setTaxRate(data.settings.defaultTaxRate);
    setValidDays(15); setTerms(data.settings.invoiceTerms); setBuild(true);
  }

  const rows = useMemo(
    () =>
      [...data.quotations]
        .filter((qq) => (status === 'all' ? true : qq.status === status))
        .filter((qq) => (q ? (qq.number + qq.title).toLowerCase().includes(q.toLowerCase()) : true))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.quotations, status, q],
  );

  const totals = computeTotals(items, discountPct, taxRate, { inclusive: data.settings.taxInclusive });

  function addService(sid: string) {
    const s = data.services.find((x) => x.id === sid);
    if (!s) return;
    setItems((prev) => [...prev, { id: uid('li'), refId: s.id, name: s.name, qty: 1, price: s.unitPrice }]);
  }

  function saveQuote() {
    if (!customerId || !items.length) { toast('Add a customer and items', 'error'); return; }
    const number = nextQuoteNumber(data);
    mutate((d) => {
      d.quotations.unshift({
        id: uid('q'), number, customerId, eventId: null, title: title || 'Quotation',
        items, discountPct, taxRate, status: 'draft', date: today(),
        validUntil: addDays(today(), validDays), terms, invoiceId: null,
      });
    });
    toast(`Quotation ${number} created`, 'success');
    setBuild(false);
  }

  function view(qq: Quotation) {
    setDoc({
      settings: data.settings, kind: 'quotation', number: qq.number, date: qq.date, validUntil: qq.validUntil,
      title: qq.title, customer: data.customers.find((c) => c.id === qq.customerId) ?? null,
      eventInfo: qq.eventId ? (() => { const e = data.events.find((x) => x.id === qq.eventId); return e ? { name: e.name, date: e.date, venue: e.venue, guests: e.guests } : null; })() : null,
      items: qq.items, discountPct: qq.discountPct, taxRate: qq.taxRate, terms: qq.terms,
    });
  }

  function convert(qq: Quotation) {
    if (qq.invoiceId) { toast('Already converted', 'info'); return; }
    const invNo = nextInvoiceNumber(data);
    mutate((d) => {
      const invId = uid('in');
      d.invoices.unshift({
        id: invId, number: invNo, kind: 'event', customerId: qq.customerId, eventId: qq.eventId, orderId: null,
        title: qq.title, items: qq.items, discountPct: qq.discountPct, taxRate: qq.taxRate,
        status: 'unpaid', date: today(), dueDate: addDays(today(), 15),
      });
      const target = d.quotations.find((x) => x.id === qq.id);
      if (target) { target.status = 'converted'; target.invoiceId = invId; }
    });
    toast(`Converted to invoice ${invNo}`, 'success');
  }

  function setStatusOf(id: string, s: Quotation['status']) {
    mutate((d) => { const x = d.quotations.find((z) => z.id === id); if (x) x.status = s; });
    toast('Status updated', 'success');
  }

  return (
    <div>
      <PageTitle title="Quotations" subtitle="Professional event quotes" icon="📄" actions={<Btn variant="primary" onClick={openBuilder}><Plus size={15} /> New quotation</Btn>} />

      <Glass className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search quotations…" className="pl-9" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="all">All status</option>
            {Object.entries(DOC_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </div>

        {rows.length ? (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="p-2.5">Quote #</th><th className="p-2.5">Title</th><th className="p-2.5">Customer</th>
                  <th className="p-2.5">Valid till</th><th className="p-2.5 text-right">Amount</th><th className="p-2.5">Status</th><th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((qq) => (
                  <tr key={qq.id} className="border-t border-glass-border/30 transition hover:bg-ink/4">
                    <td className="p-2.5 font-semibold">{qq.number}</td>
                    <td className="p-2.5">{qq.title}</td>
                    <td className="p-2.5 text-ink-soft">{customerName(data, qq.customerId)}</td>
                    <td className="p-2.5 text-ink-faint">{fmtDate(qq.validUntil)}</td>
                    <td className="p-2.5 text-right font-semibold">{inr(quoteTotal(qq, data.settings))}</td>
                    <td className="p-2.5"><Chip tone={DOC_STATUS[qq.status].tone}>{DOC_STATUS[qq.status].label}</Chip></td>
                    <td className="p-2.5">
                      <div className="flex justify-end gap-1">
                        {qq.status === 'draft' && <button onClick={() => setStatusOf(qq.id, 'sent')} className="btn btn-ghost !p-1.5 rounded-lg" title="Mark sent"><Send size={15} /></button>}
                        <button onClick={() => view(qq)} className="btn btn-ghost !p-1.5 rounded-lg" title="View"><Eye size={15} /></button>
                        <button onClick={() => convert(qq)} disabled={!!qq.invoiceId} className="btn btn-ghost !p-1.5 rounded-lg text-brand disabled:opacity-30" title="Convert to invoice"><FileCheck2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="📄" title="No quotations" hint="Create a quotation to send to a customer." action={<Btn variant="primary" onClick={openBuilder}>New quotation</Btn>} />
        )}
      </Glass>

      {/* Builder */}
      <Modal open={build} onClose={() => setBuild(false)} wide title="New quotation"
        footer={<><Btn variant="ghost" onClick={() => setBuild(false)}>Cancel</Btn><Btn variant="primary" onClick={saveQuote}>Save quotation</Btn></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Customer">
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Select…</option>
                {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FieldRow>
            <FieldRow label="Title"><Field value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Wedding — Quotation" /></FieldRow>
          </div>

          <div>
            <span className="lbl">Add services</span>
            <Select onChange={(e) => { addService(e.target.value); e.target.value = ''; }} defaultValue="">
              <option value="" disabled>➕ Select a service…</option>
              {data.services.map((s) => <option key={s.id} value={s.id}>{s.name} · {inr(s.unitPrice)}</option>)}
            </Select>
          </div>

          <div className="space-y-2">
            {items.map((i) => (
              <div key={i.id} className="flex items-center gap-2 rounded-xl glass-2 p-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.name}</span>
                <Field type="number" value={i.qty} onChange={(e) => setItems((p) => p.map((x) => x.id === i.id ? { ...x, qty: Math.max(1, +e.target.value || 1) } : x))} className="w-16 !py-1 text-center" />
                <Field type="number" value={i.price} onChange={(e) => setItems((p) => p.map((x) => x.id === i.id ? { ...x, price: +e.target.value || 0 } : x))} className="w-24 !py-1 text-right" />
                <span className="w-24 text-right text-sm font-semibold">{inr(i.qty * i.price)}</span>
                <button onClick={() => setItems((p) => p.filter((x) => x.id !== i.id))} className="text-ink-faint hover:text-bad"><Trash2 size={14} /></button>
              </div>
            ))}
            {!items.length && <p className="py-4 text-center text-sm text-ink-faint">Add services to build the quote.</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FieldRow label="Discount %"><Field type="number" value={discountPct} onChange={(e) => setDiscountPct(Math.max(0, Math.min(100, +e.target.value || 0)))} /></FieldRow>
            <FieldRow label="GST">
              <Select value={taxRate} onChange={(e) => setTaxRate(+e.target.value)}>
                {data.settings.taxRates.map((r) => <option key={r.id} value={r.rate}>{r.name}</option>)}
              </Select>
            </FieldRow>
            <FieldRow label="Valid (days)"><Field type="number" value={validDays} onChange={(e) => setValidDays(+e.target.value || 15)} /></FieldRow>
          </div>

          <FieldRow label="Terms"><TextArea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} /></FieldRow>

          <Glass className="p-3">
            <div className="flex justify-between text-sm"><span className="text-ink-faint">Total</span><span className="text-lg font-bold text-gradient">{inr(totals.total)}</span></div>
          </Glass>
        </div>
      </Modal>

      <DocViewer open={!!doc} onClose={() => setDoc(null)} doc={doc}
        extraActions={doc ? <Btn variant="glass" onClick={() => { const qq = data.quotations.find((x) => x.number === doc.number); if (qq) { convert(qq); setDoc(null); } }}><FileCheck2 size={15} /> To invoice</Btn> : null} />
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense fallback={null}>
      <QuotationsInner />
    </Suspense>
  );
}
