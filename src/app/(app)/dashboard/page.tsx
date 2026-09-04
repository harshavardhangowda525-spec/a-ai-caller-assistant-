'use client';

import Link from 'next/link';
import {
  IndianRupee, Coffee, CalendarClock, Clock3, TrendingUp, PiggyBank, ArrowUpRight,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  dashboardKpis, revenueSeries, categorySales, paymentBreakdown, monthlyPerformance,
  orderTotal, customerName, eventProfit,
} from '@/lib/selectors';
import { inr } from '@/lib/money';
import { fmtDate, today } from '@/lib/format';
import { Glass, PageTitle, Chip } from '@/components/ui';
import { KpiCard } from '@/components/Metrics';
import { RevenueArea, BarSeries, Donut, LineSeries } from '@/components/Charts';
import { EVENT_STATUS } from '@/lib/status';

export default function DashboardPage() {
  const { data, ready } = useStore();
  const k = dashboardKpis(data);
  const rev = revenueSeries(data);
  const cats = categorySales(data);
  const pays = paymentBreakdown(data);
  const monthly = monthlyPerformance(data);
  const t = today();

  const recentOrders = [...data.orders]
    .filter((o) => o.status === 'paid')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const upcoming = [...data.events]
    .filter((e) => e.date >= t && e.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const lowStock = data.products.filter((p) => p.stock <= p.minStock).slice(0, 5);

  return (
    <div>
      <PageTitle
        title={`Welcome back 👋`}
        subtitle={ready ? `Here's how ${data.settings.businessName} is doing today` : 'Loading your workspace…'}
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Today's Sales" value={k.todaySales} format={(n) => inr(n)} trend={12.5} icon={<IndianRupee size={18} />} accent="brand" delay={0} />
        <KpiCard label="Café Orders" value={k.cafeOrdersToday} format={(n) => String(Math.round(n))} trend={8.2} icon={<Coffee size={18} />} accent="info" delay={60} />
        <KpiCard label="Upcoming Events" value={k.upcomingEvents} format={(n) => String(Math.round(n))} trend={5} icon={<CalendarClock size={18} />} accent="accent" delay={120} />
        <KpiCard label="Pending Payments" value={k.pendingPayments} format={(n) => inr(n)} trend={-3.4} icon={<Clock3 size={18} />} accent="warn" delay={180} />
        <KpiCard label="Total Revenue" value={k.totalRevenue} format={(n) => inr(n)} trend={18.9} icon={<TrendingUp size={18} />} accent="good" delay={240} />
        <KpiCard label="Event Profit" value={k.eventProfit} format={(n) => inr(n)} trend={14.1} icon={<PiggyBank size={18} />} accent="accent" delay={300} />
      </div>

      {/* Charts */}
      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Glass className="p-5 xl:col-span-2 animate-fade-up">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Revenue overview</h3>
              <p className="text-xs text-ink-faint">Café vs Events · last 7 days</p>
            </div>
            <Chip tone="good">This week</Chip>
          </div>
          <RevenueArea data={rev} />
        </Glass>

        <Glass className="p-5 animate-fade-up">
          <h3 className="mb-1 font-semibold">Payment breakdown</h3>
          <p className="mb-2 text-xs text-ink-faint">By method</p>
          {pays.length ? <Donut data={pays} /> : <Empty />}
        </Glass>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Glass className="p-5 animate-fade-up">
          <h3 className="mb-1 font-semibold">Category sales</h3>
          <p className="mb-2 text-xs text-ink-faint">Café revenue by category</p>
          {cats.length ? <BarSeries data={cats} color="multi" /> : <Empty />}
        </Glass>

        <Glass className="p-5 xl:col-span-2 animate-fade-up">
          <h3 className="mb-1 font-semibold">Monthly performance</h3>
          <p className="mb-2 text-xs text-ink-faint">Revenue &amp; profit trend</p>
          <LineSeries data={monthly} />
        </Glass>
      </div>

      {/* Lists */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Glass className="p-5 animate-fade-up">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Upcoming events</h3>
            <Link href="/events" className="text-xs text-brand hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {upcoming.length ? upcoming.map((e) => (
              <Link key={e.id} href={`/events?id=${e.id}`} className="flex items-center gap-3 rounded-xl glass-2 p-2.5 transition hover:brightness-105">
                <div className="grid h-10 w-10 shrink-0 flex-col place-items-center rounded-xl bg-brand/12 text-brand">
                  <span className="text-[10px] font-bold uppercase leading-none">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                  <span className="text-sm font-bold leading-none">{new Date(e.date).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{e.name}</div>
                  <div className="text-xs text-ink-faint">{e.type} · {e.guests} guests</div>
                </div>
                <Chip tone={EVENT_STATUS[e.status].tone}>{EVENT_STATUS[e.status].label}</Chip>
              </Link>
            )) : <Empty label="No upcoming events" />}
          </div>
        </Glass>

        <Glass className="p-5 animate-fade-up">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Recent café orders</h3>
            <Link href="/orders" className="text-xs text-brand hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentOrders.length ? recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 rounded-xl glass-2 p-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-info/12 text-base">☕</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{o.number}</div>
                  <div className="text-xs text-ink-faint">{customerName(data, o.customerId)} · {o.items.length} items</div>
                </div>
                <div className="text-sm font-semibold">{inr(orderTotal(o, data.settings))}</div>
              </div>
            )) : <Empty label="No orders yet" />}
          </div>
        </Glass>

        <Glass className="p-5 animate-fade-up">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Low stock</h3>
            <Link href="/inventory" className="text-xs text-brand hover:underline">Inventory</Link>
          </div>
          <div className="space-y-2">
            {lowStock.length ? lowStock.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl glass-2 p-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-warn/12 text-base">{p.image}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-ink-faint">Min {p.minStock} · SKU {p.sku}</div>
                </div>
                <Chip tone={p.stock === 0 ? 'bad' : 'warn'}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</Chip>
              </div>
            )) : <Empty label="Stock levels healthy" />}
          </div>
        </Glass>
      </div>
    </div>
  );
}

function Empty({ label = 'No data' }: { label?: string }) {
  return <div className="py-10 text-center text-sm text-ink-faint">{label}</div>;
}
