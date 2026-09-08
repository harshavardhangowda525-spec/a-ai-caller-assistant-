'use client';

import { useMemo, useState } from 'react';
import { PageTitle, Panel, StatTile } from './ui';
import { config } from '@/lib/config';
import { DEFAULT_CONTENT } from '@/lib/seed-data';
import type { MenuItem, Order, OrderLine, PaymentMethod } from '@/lib/types';

const PAYMENTS: PaymentMethod[] = ['cash', 'card', 'upi', 'other'];

function isSameMonth(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}
function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}

export default function POS({ menu, recent }: { menu: MenuItem[]; recent: Order[] }) {
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [invoice, setInvoice] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [cat, setCat] = useState<string>('all');

  const available = menu.filter((m) => m.available);
  const cats = ['all', ...Array.from(new Set(available.map((m) => m.category)))];
  const shown = cat === 'all' ? available : available.filter((m) => m.category === cat);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines]);
  const discount = Math.round((subtotal * discountPct) / 100);
  const taxable = subtotal - discount;
  const tax = Math.round((taxable * config.taxRatePct) / 100);
  const total = taxable + tax;

  const todayTotal = recent.filter((o) => isToday(o.createdAt)).reduce((s, o) => s + o.total, 0);
  const monthTotal = recent.filter((o) => isSameMonth(o.createdAt)).reduce((s, o) => s + o.total, 0);

  function add(item: MenuItem) {
    setLines((prev) => {
      const found = prev.find((l) => l.itemId === item.id);
      if (found) return prev.map((l) => (l.itemId === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { itemId: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  }
  function setQty(id: string, qty: number) {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.itemId !== id) : prev.map((l) => (l.itemId === id ? { ...l, qty } : l))));
  }
  function clear() {
    setLines([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountPct(0);
    setPayment('cash');
  }

  async function checkout() {
    if (lines.length === 0) return;
    setBusy(true);
    setMsg('');
    const payload = {
      customerName,
      customerPhone,
      lines,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: payment,
      status: 'completed',
      channel: 'pos',
    };
    const res = await fetch('/api/admin/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);

    const order: Order = {
      id: j.data?.id ?? 'local',
      reference: j.data?.reference ?? 'TB-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
      createdAt: j.data?.created_at ?? new Date().toISOString(),
      ...payload,
    } as Order;

    if (!res.ok && !j.demo) {
      setMsg(j.error || 'Could not save order.');
      return;
    }
    if (j.demo) setMsg('Demo mode: invoice generated but not saved (configure Supabase to persist).');
    setInvoice(order);
    clear();
  }

  return (
    <div>
      <PageTitle title="Billing / POS" sub="Ring up walk-in orders, apply tax and discounts, print invoices." />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatTile label="Today's Sales" value={`₹${todayTotal.toLocaleString('en-IN')}`} />
        <StatTile label="This Month" value={`₹${monthTotal.toLocaleString('en-IN')}`} />
        <StatTile label="Orders on record" value={String(recent.length)} />
      </div>

      {msg && <div className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">{msg}</div>}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Product grid */}
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-3 py-1.5 text-xs capitalize ${
                  cat === c ? 'border-copper-400/50 bg-copper-500/20 text-copper-200' : 'border-cream-100/15 text-cream-200/70'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {shown.map((item) => (
              <button
                key={item.id}
                onClick={() => add(item)}
                className="glass grain glass-sheen rounded-xl p-3 text-left transition-transform hover:-translate-y-1"
              >
                <div className="text-sm font-medium text-cream-100">{item.name}</div>
                <div className="mt-1 text-copper-300">₹{item.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <Panel className="flex flex-col">
          <h3 className="font-display text-lg font-semibold text-cream-100">Current order</h3>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="rounded-lg border border-cream-100/15 bg-espresso-950/40 px-3 py-2 text-sm text-cream-100 outline-none focus:border-copper-400/60" />
            <input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="rounded-lg border border-cream-100/15 bg-espresso-950/40 px-3 py-2 text-sm text-cream-100 outline-none focus:border-copper-400/60" />
          </div>

          <div className="mt-3 min-h-[120px] space-y-2">
            {lines.length === 0 && <p className="py-6 text-center text-sm text-cream-200/40">Tap products to add them.</p>}
            {lines.map((l) => (
              <div key={l.itemId} className="flex items-center justify-between gap-2 border-b border-cream-100/10 pb-2">
                <div className="min-w-0">
                  <div className="truncate text-sm text-cream-100">{l.name}</div>
                  <div className="text-xs text-cream-200/50">₹{l.price}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(l.itemId, l.qty - 1)} className="h-7 w-7 rounded-full border border-cream-100/15 text-cream-100">−</button>
                  <span className="w-5 text-center text-sm text-cream-100">{l.qty}</span>
                  <button onClick={() => setQty(l.itemId, l.qty + 1)} className="h-7 w-7 rounded-full border border-cream-100/15 text-cream-100">+</button>
                  <span className="w-14 text-right text-sm text-copper-300">₹{l.price * l.qty}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-cream-200/70"><span>Subtotal</span><span>₹{subtotal}</span></div>
            <div className="flex items-center justify-between text-cream-200/70">
              <span>Discount</span>
              <span className="flex items-center gap-1">
                <input type="number" min={0} max={100} value={discountPct} onChange={(e) => setDiscountPct(Math.min(100, Math.max(0, Number(e.target.value))))} className="w-14 rounded border border-cream-100/15 bg-espresso-950/40 px-2 py-0.5 text-right text-xs text-cream-100" />
                % · −₹{discount}
              </span>
            </div>
            <div className="flex justify-between text-cream-200/70"><span>Tax ({config.taxRatePct}%)</span><span>₹{tax}</span></div>
            <div className="flex justify-between border-t border-cream-100/10 pt-2 font-display text-lg text-cream-100"><span>Total</span><span>₹{total}</span></div>
          </div>

          <div className="mt-3">
            <div className="mb-2 text-xs text-cream-200/60">Payment method</div>
            <div className="flex gap-2">
              {PAYMENTS.map((p) => (
                <button key={p} onClick={() => setPayment(p)} className={`flex-1 rounded-lg border py-2 text-xs capitalize ${payment === p ? 'border-copper-400/50 bg-copper-500/20 text-copper-200' : 'border-cream-100/15 text-cream-200/70'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={clear} className="glass-btn px-4 py-2.5 text-xs text-cream-100">Clear</button>
            <button disabled={busy || lines.length === 0} onClick={checkout} className="glass-btn glass-btn-primary flex-1 justify-center py-2.5 text-sm font-semibold disabled:opacity-50">
              {busy ? 'Processing…' : `Charge ₹${total}`}
            </button>
          </div>
        </Panel>
      </div>

      {invoice && <Invoice order={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}

function Invoice({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`@media print {
        body * { visibility: hidden; }
        #invoice-print, #invoice-print * { visibility: visible; }
        #invoice-print { position: fixed; inset: 0; margin: 0; padding: 24px; background: #fff; color: #1a0f09; width: 100%; }
        .no-print { display: none !important; }
      }`}</style>
      <div className="glass-dark grain absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm">
        <div id="invoice-print" className="rounded-2xl bg-cream-100 p-6 text-espresso-900 shadow-glass-lg">
          <div className="text-center">
            <div className="font-display text-xl font-semibold">TRIBAL BREW DAILY</div>
            <div className="text-xs text-espresso-700">Church Street, Bengaluru · {DEFAULT_CONTENT.phone}</div>
          </div>
          <div className="my-3 border-t border-dashed border-espresso-500/40" />
          <div className="flex justify-between text-xs">
            <span>Invoice: {order.reference}</span>
            <span>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
          </div>
          {order.customerName && <div className="mt-1 text-xs">Customer: {order.customerName}</div>}
          <div className="my-3 border-t border-dashed border-espresso-500/40" />
          <table className="w-full text-xs">
            <tbody>
              {order.lines.map((l, i) => (
                <tr key={i}>
                  <td className="py-0.5">{l.qty}× {l.name}</td>
                  <td className="py-0.5 text-right">₹{l.price * l.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="my-3 border-t border-dashed border-espresso-500/40" />
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>−₹{order.discount}</span></div>}
            <div className="flex justify-between"><span>Tax</span><span>₹{order.tax}</span></div>
            <div className="flex justify-between text-sm font-semibold"><span>Total</span><span>₹{order.total}</span></div>
            <div className="flex justify-between"><span>Paid via</span><span className="capitalize">{order.paymentMethod}</span></div>
          </div>
          <div className="my-3 border-t border-dashed border-espresso-500/40" />
          <p className="text-center text-[11px] text-espresso-700">Thank you — coffee with a story. See you again.</p>
        </div>

        <div className="no-print mt-3 flex gap-2">
          <button onClick={onClose} className="glass-btn flex-1 justify-center py-2.5 text-xs text-cream-100">Close</button>
          <button onClick={() => window.print()} className="glass-btn glass-btn-primary flex-1 justify-center py-2.5 text-xs font-semibold">Print invoice</button>
        </div>
      </div>
    </div>
  );
}
