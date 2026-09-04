import type {
  AppData, CafeOrder, EventBooking, Invoice, Quotation, Settings,
} from './types';
import { computeTotals } from './money';
import { addDays, isSameDay, today } from './format';

// Total for a café order (café uses its own tax rate; typically 5%).
export function orderTotal(o: CafeOrder, s: Settings): number {
  return computeTotals(o.items, o.discountPct, o.taxRate, { inclusive: s.taxInclusive }).total;
}

export function docTotal(
  doc: { items: Invoice['items']; discountPct: number; taxRate: number },
  s: Settings,
): number {
  return computeTotals(doc.items, doc.discountPct, doc.taxRate, { inclusive: s.taxInclusive }).total;
}

export function invoiceTotal(i: Invoice, s: Settings): number {
  return docTotal(i, s);
}
export function quoteTotal(q: Quotation, s: Settings): number {
  return docTotal(q, s);
}
export function eventTotal(e: EventBooking, s: Settings): number {
  return docTotal(e, s);
}

export function eventPaid(d: AppData, eventId: string): number {
  return d.payments
    .filter((p) => p.eventId === eventId)
    .reduce((s, p) => s + (p.kind === 'refund' ? -p.amount : p.amount), 0);
}

export function invoicePaid(d: AppData, invoiceId: string): number {
  return d.payments
    .filter((p) => p.invoiceId === invoiceId)
    .reduce((s, p) => s + (p.kind === 'refund' ? -p.amount : p.amount), 0);
}

export function eventExpenses(d: AppData, eventId: string): number {
  return d.expenses.filter((e) => e.eventId === eventId).reduce((s, e) => s + e.amount, 0);
}

export function eventProfit(d: AppData, e: EventBooking): number {
  return eventTotal(e, d.settings) - eventExpenses(d, e.id);
}

export function customerName(d: AppData, id?: string | null): string {
  return d.customers.find((c) => c.id === id)?.name ?? '—';
}

// --- Dashboard KPIs --------------------------------------------------------
export interface Kpis {
  todaySales: number;
  cafeOrdersToday: number;
  upcomingEvents: number;
  pendingPayments: number;
  totalRevenue: number;
  eventProfit: number;
}

export function dashboardKpis(d: AppData): Kpis {
  const t = today();
  const s = d.settings;

  const paidToday = d.orders.filter((o) => o.status === 'paid' && isSameDay(o.createdAt, t));
  const todaySales = paidToday.reduce((sum, o) => sum + orderTotal(o, s), 0);

  const upcoming = d.events.filter(
    (e) => e.date >= t && (e.status === 'confirmed' || e.status === 'quoted'),
  ).length;

  // pending = outstanding balances on event invoices
  const pendingPayments = d.invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'draft')
    .reduce((sum, i) => Math.max(0, sum + (invoiceTotal(i, s) - invoicePaid(d, i.id))), 0);

  const cafeRevenue = d.orders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + orderTotal(o, s), 0);
  const eventRevenue = d.payments.filter((p) => p.eventId).reduce((sum, p) => sum + (p.kind === 'refund' ? -p.amount : p.amount), 0);
  const totalRevenue = cafeRevenue + eventRevenue;

  const profit = d.events
    .filter((e) => e.status === 'confirmed' || e.status === 'completed')
    .reduce((sum, e) => sum + eventProfit(d, e), 0);

  return {
    todaySales,
    cafeOrdersToday: paidToday.length,
    upcomingEvents: upcoming,
    pendingPayments,
    totalRevenue,
    eventProfit: profit,
  };
}

// --- Time series -----------------------------------------------------------
export function revenueSeries(d: AppData, days = 7) {
  const s = d.settings;
  const t = today();
  const out: { day: string; cafe: number; events: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(t, -i);
    const label = new Date(date).toLocaleDateString('en-IN', { weekday: 'short' });
    const cafe = d.orders
      .filter((o) => o.status === 'paid' && isSameDay(o.createdAt, date))
      .reduce((sum, o) => sum + orderTotal(o, s), 0);
    const events = d.payments
      .filter((p) => p.eventId && isSameDay(p.date, date))
      .reduce((sum, p) => sum + p.amount, 0);
    out.push({ day: label, cafe: Math.round(cafe), events: Math.round(events) });
  }
  return out;
}

export function categorySales(d: AppData) {
  const s = d.settings;
  const totals = new Map<string, number>();
  d.orders
    .filter((o) => o.status === 'paid')
    .forEach((o) =>
      o.items.forEach((it) => {
        const prod = d.products.find((p) => p.id === it.refId);
        const cat = d.categories.find((c) => c.id === prod?.categoryId);
        const name = cat?.name ?? 'Other';
        totals.set(name, (totals.get(name) ?? 0) + it.qty * it.price);
      }),
    );
  void s;
  return Array.from(totals, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function paymentBreakdown(d: AppData) {
  const totals = new Map<string, number>();
  d.payments.forEach((p) => {
    if (p.kind === 'refund') return;
    totals.set(p.method, (totals.get(p.method) ?? 0) + p.amount);
  });
  const labels: Record<string, string> = { cash: 'Cash', upi: 'UPI', card: 'Card', bank: 'Bank', other: 'Other' };
  return Array.from(totals, ([name, value]) => ({ name: labels[name] ?? name, value }));
}

export function monthlyPerformance(d: AppData) {
  // synthetic 6-month view for the demo, anchored on current totals
  const kpis = dashboardKpis(d);
  const base = Math.max(kpis.totalRevenue, 50000);
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  return months.map((m, i) => ({
    month: m,
    revenue: Math.round(base * (0.55 + i * 0.09 + (i % 2 ? 0.05 : 0))),
    profit: Math.round(base * (0.2 + i * 0.04)),
  }));
}
