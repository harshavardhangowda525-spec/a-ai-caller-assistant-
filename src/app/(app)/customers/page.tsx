'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Pencil, Phone, Mail, MapPin, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '@/lib/store';
import type { Customer } from '@/lib/types';
import { inr } from '@/lib/money';
import { fmtDate, uid, initials } from '@/lib/format';
import { orderTotal, eventTotal, invoiceTotal, invoicePaid } from '@/lib/selectors';
import { Glass, Btn, Chip, Field, Modal, PageTitle, EmptyState, FieldRow, ConfirmDialog } from '@/components/ui';
import { EVENT_STATUS, INVOICE_STATUS } from '@/lib/status';

function blank(): Customer {
  return { id: '', name: '', phone: '', email: '', address: '', createdAt: '' };
}

function CustomersInner() {
  const { data, mutate, toast } = useStore();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Customer | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [tab, setTab] = useState('overview');
  const [del, setDel] = useState<Customer | null>(null);

  useEffect(() => {
    if (params.get('new') === '1') setEdit(blank());
    const id = params.get('id');
    if (id) setSelId(id);
  }, [params]);

  const stats = useMemo(() => {
    const m = new Map<string, { spend: number; pending: number; orders: number; events: number }>();
    data.customers.forEach((c) => m.set(c.id, { spend: 0, pending: 0, orders: 0, events: 0 }));
    data.orders.filter((o) => o.status === 'paid' && o.customerId).forEach((o) => {
      const s = m.get(o.customerId!); if (s) { s.spend += orderTotal(o, data.settings); s.orders += 1; }
    });
    data.events.forEach((e) => { const s = m.get(e.customerId); if (s) s.events += 1; });
    data.invoices.forEach((i) => {
      if (!i.customerId) return;
      const s = m.get(i.customerId);
      if (s) { const paid = invoicePaid(data, i.id); s.spend += paid; s.pending += Math.max(0, invoiceTotal(i, data.settings) - paid); }
    });
    return m;
  }, [data]);

  const rows = useMemo(
    () => data.customers.filter((c) => (q ? (c.name + c.phone + c.email).toLowerCase().includes(q.toLowerCase()) : true)),
    [data.customers, q],
  );

  function save() {
    if (!edit || !edit.name.trim()) { toast('Name required', 'error'); return; }
    mutate((d) => {
      if (edit.id) { const i = d.customers.findIndex((c) => c.id === edit.id); if (i >= 0) d.customers[i] = edit; }
      else d.customers.push({ ...edit, id: uid('cu'), createdAt: new Date().toISOString() });
    });
    toast(edit.id ? 'Customer updated' : 'Customer added', 'success');
    setEdit(null);
  }

  const sel = selId ? data.customers.find((c) => c.id === selId) : null;
  const selStats = sel ? stats.get(sel.id) : null;
  const custOrders = sel ? data.orders.filter((o) => o.customerId === sel.id) : [];
  const custEvents = sel ? data.events.filter((e) => e.customerId === sel.id) : [];
  const custInvoices = sel ? data.invoices.filter((i) => i.customerId === sel.id) : [];
  const custPayments = sel ? data.payments.filter((p) => p.customerId === sel.id) : [];

  const TABS = ['overview', 'orders', 'events', 'invoices', 'payments'];

  return (
    <div>
      <PageTitle title="Customers" subtitle="Shared café &amp; event database" icon="👥" actions={<Btn variant="primary" onClick={() => setEdit(blank())}><Plus size={15} /> Add customer</Btn>} />

      <Glass className="p-4">
        <div className="mb-3 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers…" className="pl-9" />
        </div>

        {rows.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((c) => {
              const s = stats.get(c.id);
              return (
                <div key={c.id} className="glass glass-hover rounded-glass p-4">
                  <button onClick={() => { setSelId(c.id); setTab('overview'); }} className="flex w-full items-center gap-3 text-left">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-accent text-sm font-bold text-white">{initials(c.name)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{c.name}</div>
                      <div className="truncate text-xs text-ink-faint">{c.phone}</div>
                    </div>
                  </button>
                  <div className="mt-3 flex items-center justify-between border-t border-glass-border/40 pt-2 text-xs">
                    <span className="text-ink-faint">Spent <b className="text-ink">{inr(s?.spend ?? 0)}</b></span>
                    {s && s.pending > 0 ? <Chip tone="warn">Due {inr(s.pending)}</Chip> : <Chip tone="good">Clear</Chip>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="👥" title="No customers" hint="Add a customer to get started." />
        )}
      </Glass>

      {/* Detail */}
      <Modal open={!!sel} onClose={() => setSelId(null)} wide title={sel?.name}>
        {sel && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-accent text-lg font-bold text-white">{initials(sel.name)}</span>
              <div className="space-y-0.5 text-sm">
                <div className="flex items-center gap-1.5 text-ink-soft"><Phone size={13} /> {sel.phone}</div>
                <div className="flex items-center gap-1.5 text-ink-soft"><Mail size={13} /> {sel.email || '—'}</div>
                <div className="flex items-center gap-1.5 text-ink-soft"><MapPin size={13} /> {sel.address || '—'}</div>
              </div>
              <div className="ml-auto flex gap-1.5">
                <Btn variant="glass" className="!py-1.5 text-xs" onClick={() => setEdit({ ...sel })}><Pencil size={13} /> Edit</Btn>
                <Btn variant="ghost" className="!py-1.5 text-xs text-bad" onClick={() => { setDel(sel); }}><Trash2 size={13} /></Btn>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Total spent" value={inr(selStats?.spend ?? 0)} />
              <MiniStat label="Pending" value={inr(selStats?.pending ?? 0)} tone="warn" />
              <MiniStat label="Café orders" value={String(selStats?.orders ?? 0)} />
              <MiniStat label="Events" value={String(selStats?.events ?? 0)} />
            </div>

            <div className="mb-3 inline-flex flex-wrap gap-1 glass-2 rounded-xl p-1">
              {TABS.map((t) => (
                <button key={t} onClick={() => setTab(t)} className={clsx('rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition', tab === t ? 'bg-brand text-white' : 'text-ink-soft')}>{t}</button>
              ))}
            </div>

            <div className="min-h-[140px]">
              {tab === 'overview' && (
                <div className="rounded-glass glass-2 p-4 text-sm text-ink-soft">
                  <p>Customer since {fmtDate(sel.createdAt)}.</p>
                  <p className="mt-1">{selStats?.orders ?? 0} café orders · {selStats?.events ?? 0} events · {custInvoices.length} invoices.</p>
                </div>
              )}
              {tab === 'orders' && <ListTable rows={custOrders.map((o) => [o.number, o.type, fmtDate(o.createdAt), inr(orderTotal(o, data.settings))])} head={['Order', 'Type', 'Date', 'Total']} empty="No café orders" />}
              {tab === 'events' && (
                <div className="space-y-2">
                  {custEvents.length ? custEvents.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-xl glass-2 p-2.5 text-sm">
                      <span>{e.name} · <span className="text-ink-faint">{fmtDate(e.date)}</span></span>
                      <span className="flex items-center gap-2"><Chip tone={EVENT_STATUS[e.status].tone}>{EVENT_STATUS[e.status].label}</Chip><b>{inr(eventTotal(e, data.settings))}</b></span>
                    </div>
                  )) : <Empty label="No events" />}
                </div>
              )}
              {tab === 'invoices' && (
                <div className="space-y-2">
                  {custInvoices.length ? custInvoices.map((i) => (
                    <div key={i.id} className="flex items-center justify-between rounded-xl glass-2 p-2.5 text-sm">
                      <span>{i.number} · <span className="text-ink-faint">{i.title}</span></span>
                      <span className="flex items-center gap-2"><Chip tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Chip><b>{inr(invoiceTotal(i, data.settings))}</b></span>
                    </div>
                  )) : <Empty label="No invoices" />}
                </div>
              )}
              {tab === 'payments' && <ListTable rows={custPayments.map((p) => [fmtDate(p.date), p.method.toUpperCase(), p.reference, inr(p.amount)])} head={['Date', 'Method', 'Ref', 'Amount']} empty="No payments" />}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit */}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit customer' : 'New customer'}
        footer={<><Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn><Btn variant="primary" onClick={save}>Save</Btn></>}>
        {edit && (
          <div className="space-y-3">
            <FieldRow label="Name"><Field value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></FieldRow>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Phone"><Field value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></FieldRow>
              <FieldRow label="Email"><Field value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></FieldRow>
            </div>
            <FieldRow label="Address"><Field value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} /></FieldRow>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!del} title="Delete customer?" message={`"${del?.name}" will be removed.`} confirmLabel="Delete" danger onConfirm={() => { if (del) { mutate((d) => { d.customers = d.customers.filter((c) => c.id !== del.id); }); setSelId(null); toast('Customer deleted', 'info'); } }} onClose={() => setDel(null)} />
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-glass glass-2 p-3">
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={clsx('text-base font-bold', tone === 'warn' && 'text-warn')}>{value}</div>
    </div>
  );
}
function ListTable({ rows, head, empty }: { rows: string[][]; head: string[]; empty: string }) {
  if (!rows.length) return <Empty label={empty} />;
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs uppercase tracking-wide text-ink-faint">{head.map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i} className="border-t border-glass-border/30"><td className="p-2 font-medium">{r[0]}</td>{r.slice(1).map((c, j) => <td key={j} className="p-2 text-ink-soft">{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
function Empty({ label }: { label: string }) {
  return <p className="py-6 text-center text-sm text-ink-faint">{label}</p>;
}

export default function CustomersPage() {
  return (
    <Suspense fallback={null}>
      <CustomersInner />
    </Suspense>
  );
}
