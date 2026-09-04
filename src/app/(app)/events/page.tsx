'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PartyPopper, CalendarClock, CalendarCheck, FileText, Clock3, TrendingUp,
  PiggyBank, Plus, Search, Wallet, Banknote, Trash2, FileCheck2,
} from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '@/lib/store';
import type { EventBooking, PaymentMethod } from '@/lib/types';
import {
  eventTotal, eventPaid, eventExpenses, eventProfit, customerName,
} from '@/lib/selectors';
import { inr } from '@/lib/money';
import { fmtDate, today, uid, isSameDay } from '@/lib/format';
import { nextInvoiceNumber, nextQuoteNumber } from '@/lib/numbering';
import { Glass, Btn, Chip, Field, Select, Modal, PageTitle, EmptyState, FieldRow } from '@/components/ui';
import { KpiCard } from '@/components/Metrics';
import { EventWizard } from '@/components/EventWizard';
import { DocViewer } from '@/components/DocViewer';
import type { DocProps } from '@/components/InvoiceDoc';
import { EVENT_STATUS, PAYMENT_LABEL } from '@/lib/status';

function EventsInner() {
  const { data, mutate, toast, notify } = useStore();
  const params = useSearchParams();
  const [wizard, setWizard] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [doc, setDoc] = useState<DocProps | null>(null);
  const [payAmt, setPayAmt] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [exp, setExp] = useState({ category: 'Catering', description: '', amount: 0, payee: '', method: 'cash' as PaymentMethod });

  useEffect(() => {
    if (params.get('new') === '1') setWizard(true);
    const id = params.get('id');
    if (id) setSelId(id);
  }, [params]);

  const t = today();
  const kpis = useMemo(() => {
    const upcoming = data.events.filter((e) => e.date >= t && e.status !== 'cancelled').length;
    const todays = data.events.filter((e) => isSameDay(e.date, t)).length;
    const pendingQuotes = data.quotations.filter((qq) => qq.status === 'sent' || qq.status === 'draft').length;
    const pendingPay = data.events.reduce((s, e) => s + Math.max(0, eventTotal(e, data.settings) - eventPaid(data, e.id)), 0);
    const revenue = data.events.filter((e) => e.status !== 'cancelled').reduce((s, e) => s + eventTotal(e, data.settings), 0);
    const profit = data.events.filter((e) => e.status === 'confirmed' || e.status === 'completed').reduce((s, e) => s + eventProfit(data, e), 0);
    return { upcoming, todays, pendingQuotes, pendingPay, revenue, profit };
  }, [data, t]);

  const events = useMemo(
    () =>
      [...data.events]
        .filter((e) => (status === 'all' ? true : e.status === status))
        .filter((e) => (q ? e.name.toLowerCase().includes(q.toLowerCase()) : true))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.events, status, q],
  );

  const sel = selId ? data.events.find((e) => e.id === selId) : null;
  const selInvoice = sel ? data.invoices.find((i) => i.eventId === sel.id) : null;
  const selCustomer = sel ? data.customers.find((c) => c.id === sel.customerId) : null;

  function recordPayment() {
    if (!sel || payAmt <= 0) return;
    mutate((d) => {
      const inv = d.invoices.find((i) => i.eventId === sel.id);
      d.payments.unshift({
        id: uid('py'), date: new Date().toISOString(), amount: payAmt, method: payMethod, kind: 'in',
        invoiceId: inv?.id ?? null, eventId: sel.id, customerId: sel.customerId, reference: payMethod.toUpperCase(), notes: 'Payment',
      });
      if (inv) {
        const paid = d.payments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0);
        const total = eventTotal(sel, d.settings);
        inv.status = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
      }
    });
    notify({ type: 'payment_received', title: 'Payment received', message: `${inr(payAmt)} for ${sel.name}` });
    toast(`Recorded ${inr(payAmt)}`, 'success');
    setPayAmt(0);
  }

  function addExpense() {
    if (!sel || exp.amount <= 0 || !exp.description.trim()) { toast('Enter description & amount', 'error'); return; }
    mutate((d) => {
      d.expenses.unshift({ id: uid('ex'), eventId: sel.id, ...exp, date: today() });
    });
    toast('Expense added', 'success');
    setExp({ category: 'Catering', description: '', amount: 0, payee: '', method: 'cash' });
  }

  function removeExpense(id: string) {
    mutate((d) => { d.expenses = d.expenses.filter((e) => e.id !== id); });
  }

  function setEventStatus(id: string, s: EventBooking['status']) {
    mutate((d) => { const e = d.events.find((x) => x.id === id); if (e) e.status = s; });
    toast('Status updated', 'success');
  }

  function generateDoc(kind: 'invoice' | 'quotation') {
    if (!sel) return;
    let number = selInvoice?.number ?? '';
    if (kind === 'quotation') {
      const existing = data.quotations.find((qq) => qq.eventId === sel.id);
      number = existing?.number ?? nextQuoteNumber(data);
    } else if (!selInvoice) {
      // create an invoice if none
      const invNo = nextInvoiceNumber(data);
      mutate((d) => {
        d.invoices.unshift({
          id: uid('in'), number: invNo, kind: 'event', customerId: sel.customerId, eventId: sel.id, orderId: null,
          title: sel.name, items: sel.items, discountPct: sel.discountPct, taxRate: sel.taxRate,
          status: 'unpaid', date: today(), dueDate: sel.date,
        });
      });
      number = invNo;
    }
    setDoc({
      settings: data.settings,
      kind,
      number,
      date: today(),
      dueDate: kind === 'invoice' ? sel.date : undefined,
      validUntil: kind === 'quotation' ? sel.date : undefined,
      title: sel.name,
      customer: selCustomer ?? null,
      eventInfo: { name: sel.name, date: sel.date, venue: sel.venue, guests: sel.guests },
      items: sel.items,
      discountPct: sel.discountPct,
      taxRate: sel.taxRate,
      advancePaid: kind === 'invoice' ? eventPaid(data, sel.id) : 0,
      terms: data.settings.invoiceTerms,
    });
  }

  const total = sel ? eventTotal(sel, data.settings) : 0;
  const paid = sel ? eventPaid(data, sel.id) : 0;
  const expenses = sel ? data.expenses.filter((e) => e.eventId === sel.id) : [];
  const expenseTotal = sel ? eventExpenses(data, sel.id) : 0;
  const profit = sel ? eventProfit(data, sel) : 0;

  return (
    <div>
      <PageTitle
        title="Events"
        subtitle="Bookings, billing &amp; profit"
        icon="🎉"
        actions={<Btn variant="primary" onClick={() => setWizard(true)}><Plus size={15} /> New event</Btn>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Upcoming" value={kpis.upcoming} format={(n) => String(Math.round(n))} icon={<CalendarClock size={18} />} accent="brand" />
        <KpiCard label="Today" value={kpis.todays} format={(n) => String(Math.round(n))} icon={<CalendarCheck size={18} />} accent="info" />
        <KpiCard label="Pending quotes" value={kpis.pendingQuotes} format={(n) => String(Math.round(n))} icon={<FileText size={18} />} accent="warn" />
        <KpiCard label="Pending payments" value={kpis.pendingPay} format={(n) => inr(n)} icon={<Clock3 size={18} />} accent="bad" />
        <KpiCard label="Event revenue" value={kpis.revenue} format={(n) => inr(n)} icon={<TrendingUp size={18} />} accent="good" />
        <KpiCard label="Event profit" value={kpis.profit} format={(n) => inr(n)} icon={<PiggyBank size={18} />} accent="accent" />
      </div>

      <Glass className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events…" className="pl-9" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="all">All status</option>
            {Object.entries(EVENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </div>

        {events.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {events.map((e) => {
              const tot = eventTotal(e, data.settings);
              const pd = eventPaid(data, e.id);
              return (
                <button key={e.id} onClick={() => setSelId(e.id)} className="glass glass-hover rounded-glass p-4 text-left">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-11 w-11 shrink-0 flex-col place-items-center rounded-xl bg-brand/12 text-brand">
                        <span className="text-[9px] font-bold uppercase leading-none">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                        <span className="text-base font-bold leading-none">{new Date(e.date).getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{e.name}</div>
                        <div className="text-xs text-ink-faint">{e.type} · {e.guests} guests</div>
                      </div>
                    </div>
                    <Chip tone={EVENT_STATUS[e.status].tone}>{EVENT_STATUS[e.status].label}</Chip>
                  </div>
                  <div className="text-xs text-ink-faint">{customerName(data, e.customerId)} · {e.venue}</div>
                  <div className="mt-2 flex items-center justify-between border-t border-glass-border/40 pt-2">
                    <span className="text-sm font-bold text-brand">{inr(tot)}</span>
                    <span className="text-xs text-ink-faint">Paid {inr(pd)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="🎉" title="No events yet" hint="Create your first event booking." action={<Btn variant="primary" onClick={() => setWizard(true)}>New event</Btn>} />
        )}
      </Glass>

      <EventWizard open={wizard} onClose={() => setWizard(false)} onCreated={(id) => setSelId(id)} />

      {/* Event detail */}
      <Modal open={!!sel} onClose={() => setSelId(null)} wide title={sel?.name}>
        {sel && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={EVENT_STATUS[sel.status].tone}>{EVENT_STATUS[sel.status].label}</Chip>
              <span className="text-sm text-ink-faint">{fmtDate(sel.date)} · {sel.time} · {sel.venue}</span>
              <div className="ml-auto flex gap-1.5">
                <Btn variant="glass" className="!py-1.5 text-xs" onClick={() => generateDoc('quotation')}><FileText size={14} /> Quotation</Btn>
                <Btn variant="primary" className="!py-1.5 text-xs" onClick={() => generateDoc('invoice')}><FileCheck2 size={14} /> Invoice</Btn>
              </div>
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Total" value={inr(total)} tone="brand" />
              <Stat label="Paid" value={inr(paid)} tone="good" />
              <Stat label="Balance" value={inr(total - paid)} tone="warn" />
              <Stat label="Profit" value={inr(profit)} tone="accent" sub={`Exp ${inr(expenseTotal)}`} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Payments */}
              <Glass className="p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold"><Wallet size={16} /> Payments</div>
                <div className="mb-3 max-h-32 space-y-1.5 overflow-y-auto scroll-thin">
                  {data.payments.filter((p) => p.eventId === sel.id).map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg glass-2 px-2.5 py-1.5 text-sm">
                      <span className="text-ink-soft">{fmtDate(p.date)} · {PAYMENT_LABEL[p.method]}</span>
                      <span className="font-semibold text-good">{inr(p.amount)}</span>
                    </div>
                  ))}
                  {!data.payments.some((p) => p.eventId === sel.id) && <p className="py-2 text-center text-xs text-ink-faint">No payments recorded</p>}
                </div>
                <div className="flex items-end gap-2">
                  <FieldRow label="Amount" className="flex-1"><Field type="number" value={payAmt} onChange={(e) => setPayAmt(Math.max(0, +e.target.value || 0))} placeholder="0" /></FieldRow>
                  <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)} className="w-28">
                    {(['cash', 'upi', 'card', 'bank'] as PaymentMethod[]).map((m) => <option key={m} value={m}>{PAYMENT_LABEL[m]}</option>)}
                  </Select>
                  <Btn variant="primary" onClick={recordPayment} disabled={payAmt <= 0}>Add</Btn>
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  <button onClick={() => setPayAmt(Math.max(0, total - paid))} className="text-xs text-brand hover:underline">Balance {inr(total - paid)}</button>
                </div>
              </Glass>

              {/* Expenses */}
              <Glass className="p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold"><Banknote size={16} /> Expenses</div>
                <div className="mb-3 max-h-32 space-y-1.5 overflow-y-auto scroll-thin">
                  {expenses.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg glass-2 px-2.5 py-1.5 text-sm">
                      <span className="min-w-0 truncate text-ink-soft">{e.category} · {e.description}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="font-semibold text-bad">{inr(e.amount)}</span>
                        <button onClick={() => removeExpense(e.id)} className="text-ink-faint hover:text-bad"><Trash2 size={13} /></button>
                      </span>
                    </div>
                  ))}
                  {!expenses.length && <p className="py-2 text-center text-xs text-ink-faint">No expenses recorded</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={exp.category} onChange={(e) => setExp({ ...exp, category: e.target.value })}>
                    {data.settings.serviceCategories.concat(['Inventory', 'Utilities', 'Misc']).map((c) => <option key={c}>{c}</option>)}
                  </Select>
                  <Field type="number" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: +e.target.value || 0 })} placeholder="Amount" />
                  <Field value={exp.description} onChange={(e) => setExp({ ...exp, description: e.target.value })} placeholder="Description" className="col-span-2" />
                  <Btn variant="glass" className="col-span-2" onClick={addExpense}><Plus size={14} /> Add expense</Btn>
                </div>
              </Glass>
            </div>

            {/* Line items */}
            <Glass className="p-4">
              <div className="mb-2 font-semibold">Services &amp; packages</div>
              <div className="space-y-1 text-sm">
                {sel.items.map((i) => (
                  <div key={i.id} className="flex justify-between">
                    <span className="text-ink-soft">{i.qty}× {i.name}</span>
                    <span>{inr(i.qty * i.price)}</span>
                  </div>
                ))}
              </div>
            </Glass>

            {/* Status actions */}
            <div className="flex flex-wrap gap-2">
              {sel.status !== 'confirmed' && <Btn variant="glass" className="!py-1.5 text-xs" onClick={() => setEventStatus(sel.id, 'confirmed')}>Mark confirmed</Btn>}
              {sel.status !== 'completed' && <Btn variant="glass" className="!py-1.5 text-xs" onClick={() => setEventStatus(sel.id, 'completed')}>Mark completed</Btn>}
              {sel.status !== 'cancelled' && <Btn variant="ghost" className="!py-1.5 text-xs text-bad" onClick={() => setEventStatus(sel.id, 'cancelled')}>Cancel event</Btn>}
            </div>
          </div>
        )}
      </Modal>

      <DocViewer open={!!doc} onClose={() => setDoc(null)} doc={doc} />
    </div>
  );
}

function Stat({ label, value, tone, sub }: { label: string; value: string; tone: string; sub?: string }) {
  const tones: Record<string, string> = { brand: 'text-brand', good: 'text-good', warn: 'text-warn', accent: 'text-brand-accent' };
  return (
    <div className="rounded-glass glass-2 p-3">
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={clsx('text-lg font-bold', tones[tone])}>{value}</div>
      {sub && <div className="text-[10px] text-ink-faint">{sub}</div>}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={null}>
      <EventsInner />
    </Suspense>
  );
}
