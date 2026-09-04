'use client';

import { useMemo, useState } from 'react';
import { Download, Printer, BarChart3, PartyPopper } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '@/lib/store';
import { inr } from '@/lib/money';
import {
  orderTotal, eventTotal, eventExpenses, eventProfit, eventPaid,
  revenueSeries, categorySales, paymentBreakdown,
} from '@/lib/selectors';
import { fmtDate, isSameDay, today, addDays } from '@/lib/format';
import { downloadCSV } from '@/lib/export';
import { Glass, Btn, PageTitle, Segmented, Chip } from '@/components/ui';
import { RevenueArea, BarSeries, Donut, LineSeries } from '@/components/Charts';
import { KpiCard } from '@/components/Metrics';

export default function ReportsPage() {
  const { data, toast } = useStore();
  const [scope, setScope] = useState<'cafe' | 'events'>('cafe');
  const [range, setRange] = useState<'7' | '30' | '90'>('30');

  const from = addDays(today(), -parseInt(range));

  // Café metrics
  const cafe = useMemo(() => {
    const paid = data.orders.filter((o) => o.status === 'paid' && o.createdAt.slice(0, 10) >= from);
    const revenue = paid.reduce((s, o) => s + orderTotal(o, data.settings), 0);
    const todays = data.orders.filter((o) => o.status === 'paid' && isSameDay(o.createdAt, today())).reduce((s, o) => s + orderTotal(o, data.settings), 0);
    const avg = paid.length ? revenue / paid.length : 0;
    // product sales
    const prodMap = new Map<string, { name: string; qty: number; revenue: number }>();
    paid.forEach((o) => o.items.forEach((it) => {
      const e = prodMap.get(it.refId ?? it.name) ?? { name: it.name, qty: 0, revenue: 0 };
      e.qty += it.qty; e.revenue += it.qty * it.price;
      prodMap.set(it.refId ?? it.name, e);
    }));
    const products = Array.from(prodMap.values()).sort((a, b) => b.revenue - a.revenue);
    return { paid, revenue, todays, avg, products };
  }, [data, from]);

  // Event metrics
  const events = useMemo(() => {
    const list = data.events.filter((e) => e.status !== 'cancelled');
    const revenue = list.reduce((s, e) => s + eventTotal(e, data.settings), 0);
    const expenses = list.reduce((s, e) => s + eventExpenses(data, e.id), 0);
    const profit = list.reduce((s, e) => s + eventProfit(data, e), 0);
    const pending = list.reduce((s, e) => s + Math.max(0, eventTotal(e, data.settings) - eventPaid(data, e.id)), 0);
    const advance = data.payments.filter((p) => p.eventId && p.notes.toLowerCase().includes('advance')).reduce((s, p) => s + p.amount, 0);
    // service revenue
    const svcMap = new Map<string, number>();
    list.forEach((e) => e.items.forEach((it) => svcMap.set(it.name, (svcMap.get(it.name) ?? 0) + it.qty * it.price)));
    const services = Array.from(svcMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    return { list, revenue, expenses, profit, pending, advance, services };
  }, [data]);

  const rev = revenueSeries(data, parseInt(range) > 30 ? 30 : parseInt(range));
  const cats = categorySales(data);
  const pays = paymentBreakdown(data);

  function exportCafe() {
    downloadCSV('cafe-sales-report', ['Order', 'Date', 'Type', 'Items', 'Total'],
      cafe.paid.map((o) => [o.number, fmtDate(o.createdAt), o.type, o.items.length, orderTotal(o, data.settings)]));
    toast('CSV exported', 'success');
  }
  function exportEvents() {
    downloadCSV('event-report', ['Event', 'Date', 'Status', 'Revenue', 'Expenses', 'Profit', 'Paid', 'Balance'],
      events.list.map((e) => [e.name, e.date, e.status, eventTotal(e, data.settings), eventExpenses(data, e.id), eventProfit(data, e), eventPaid(data, e.id), Math.max(0, eventTotal(e, data.settings) - eventPaid(data, e.id))]));
    toast('CSV exported', 'success');
  }

  return (
    <div>
      <PageTitle
        title="Reports"
        subtitle="Business analytics"
        icon="📈"
        actions={
          <div className="flex items-center gap-2">
            <Segmented value={range} onChange={(v) => setRange(v)} options={[{ value: '7', label: '7d' }, { value: '30', label: '30d' }, { value: '90', label: '90d' }]} />
            <Btn variant="glass" onClick={scope === 'cafe' ? exportCafe : exportEvents}><Download size={15} /> CSV</Btn>
            <Btn variant="glass" onClick={() => { toast('Use "Save as PDF" in print', 'info'); setTimeout(() => window.print(), 300); }}><Printer size={15} /> Print</Btn>
          </div>
        }
      />

      <div className="mb-4">
        <Segmented value={scope} onChange={(v) => setScope(v)} options={[{ value: 'cafe', label: '☕ Café' }, { value: 'events', label: '🎉 Events' }]} />
      </div>

      {scope === 'cafe' ? (
        <div className="print-portal space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Today's sales" value={cafe.todays} format={(n) => inr(n)} icon={<BarChart3 size={18} />} accent="brand" />
            <KpiCard label={`Revenue (${range}d)`} value={cafe.revenue} format={(n) => inr(n)} icon={<BarChart3 size={18} />} accent="good" />
            <KpiCard label="Orders" value={cafe.paid.length} format={(n) => String(Math.round(n))} icon={<BarChart3 size={18} />} accent="info" />
            <KpiCard label="Avg order value" value={cafe.avg} format={(n) => inr(n)} icon={<BarChart3 size={18} />} accent="accent" />
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <Glass className="p-5 xl:col-span-2"><h3 className="mb-2 font-semibold">Daily sales trend</h3><RevenueArea data={rev} /></Glass>
            <Glass className="p-5"><h3 className="mb-2 font-semibold">Payment methods</h3><Donut data={pays} /></Glass>
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <Glass className="p-5"><h3 className="mb-2 font-semibold">Category sales</h3><BarSeries data={cats} color="multi" /></Glass>
            <Glass className="p-5">
              <h3 className="mb-2 font-semibold">Top products</h3>
              <div className="space-y-1.5">
                {cafe.products.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg glass-2 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2"><span className="text-xs text-ink-faint">#{i + 1}</span> {p.name}</span>
                    <span className="flex items-center gap-2"><Chip tone="neutral">{p.qty} sold</Chip><b>{inr(p.revenue)}</b></span>
                  </div>
                ))}
                {!cafe.products.length && <p className="py-6 text-center text-sm text-ink-faint">No sales in range</p>}
              </div>
            </Glass>
          </div>
        </div>
      ) : (
        <div className="print-portal space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Revenue" value={events.revenue} format={(n) => inr(n)} icon={<PartyPopper size={18} />} accent="brand" />
            <KpiCard label="Expenses" value={events.expenses} format={(n) => inr(n)} icon={<PartyPopper size={18} />} accent="bad" />
            <KpiCard label="Profit" value={events.profit} format={(n) => inr(n)} icon={<PartyPopper size={18} />} accent="good" />
            <KpiCard label="Pending" value={events.pending} format={(n) => inr(n)} icon={<PartyPopper size={18} />} accent="warn" />
            <KpiCard label="Advances" value={events.advance} format={(n) => inr(n)} icon={<PartyPopper size={18} />} accent="info" />
            <KpiCard label="Events" value={events.list.length} format={(n) => String(Math.round(n))} icon={<PartyPopper size={18} />} accent="accent" />
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <Glass className="p-5 xl:col-span-2">
              <h3 className="mb-2 font-semibold">Revenue vs expenses vs profit</h3>
              <BarSeries height={280} color="multi" data={events.list.slice(0, 8).map((e) => ({ name: e.name.split(' ').slice(0, 2).join(' '), value: eventTotal(e, data.settings) }))} />
            </Glass>
            <Glass className="p-5"><h3 className="mb-2 font-semibold">Service revenue</h3>{events.services.length ? <Donut data={events.services} /> : <p className="py-10 text-center text-sm text-ink-faint">No data</p>}</Glass>
          </div>
          <Glass className="p-5">
            <h3 className="mb-3 font-semibold">Event profit &amp; loss</h3>
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="p-2">Event</th><th className="p-2">Date</th><th className="p-2 text-right">Revenue</th><th className="p-2 text-right">Expenses</th><th className="p-2 text-right">Profit</th><th className="p-2 text-right">Balance</th>
                </tr></thead>
                <tbody>
                  {events.list.map((e) => {
                    const r = eventTotal(e, data.settings), ex = eventExpenses(data, e.id), pf = r - ex, bal = Math.max(0, r - eventPaid(data, e.id));
                    return (
                      <tr key={e.id} className="border-t border-glass-border/30">
                        <td className="p-2 font-medium">{e.name}</td>
                        <td className="p-2 text-ink-faint">{fmtDate(e.date)}</td>
                        <td className="p-2 text-right">{inr(r)}</td>
                        <td className="p-2 text-right text-bad">{inr(ex)}</td>
                        <td className={clsx('p-2 text-right font-semibold', pf >= 0 ? 'text-good' : 'text-bad')}>{inr(pf)}</td>
                        <td className="p-2 text-right text-warn">{inr(bal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Glass>
        </div>
      )}
    </div>
  );
}
