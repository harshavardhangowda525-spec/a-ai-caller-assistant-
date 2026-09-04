'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus, Minus, Trash2, Pause, Save, CreditCard, Search, X, Receipt,
} from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '@/lib/store';
import type { LineItem, OrderType, PaymentMethod, Product } from '@/lib/types';
import { computeTotals, inr } from '@/lib/money';
import { uid } from '@/lib/format';
import { nextOrderNumber, nextInvoiceNumber } from '@/lib/numbering';
import { Glass, Btn, Field, Select, Chip, Modal, EmptyState, PageTitle } from '@/components/ui';
import { PAYMENT_LABEL } from '@/lib/status';

const METHODS: PaymentMethod[] = ['cash', 'upi', 'card', 'bank', 'other'];

function POSInner() {
  const { data, mutate, toast, notify } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const editOrderId = params.get('order');

  const existing = data.orders.find((o) => o.id === editOrderId);

  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');
  const [cart, setCart] = useState<LineItem[]>(() => (existing ? existing.items.map((i) => ({ ...i })) : []));
  const [type, setType] = useState<OrderType>(existing?.type ?? 'dine-in');
  const [tableId, setTableId] = useState<string | null>(existing?.tableId ?? null);
  const [customerId, setCustomerId] = useState<string | null>(existing?.customerId ?? null);
  const [discountPct, setDiscountPct] = useState(existing?.discountPct ?? 0);
  const [taxRate, setTaxRate] = useState(existing?.taxRate ?? data.settings.taxRates.find((r) => r.rate === 5)?.rate ?? 5);
  const [payOpen, setPayOpen] = useState(false);

  const products = useMemo(() => {
    return data.products.filter((p) => {
      if (cat !== 'all' && p.categoryId !== cat) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data.products, cat, q]);

  const totals = computeTotals(cart, discountPct, taxRate, { inclusive: data.settings.taxInclusive });

  function addProduct(p: Product) {
    if (!p.available || p.stock <= 0) {
      toast(`${p.name} is out of stock`, 'error');
      return;
    }
    setCart((prev) => {
      const found = prev.find((i) => i.refId === p.id);
      if (found) return prev.map((i) => (i.refId === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { id: uid('li'), refId: p.id, name: p.name, qty: 1, price: p.price }];
    });
  }
  function setQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  }
  function removeItem(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }
  function clearCart() {
    setCart([]);
    setDiscountPct(0);
    setCustomerId(null);
  }

  function persistOrder(status: 'open' | 'held') {
    if (!cart.length) return toast('Add items first', 'error');
    const number = existing?.number ?? nextOrderNumber(data.orders);
    mutate((d) => {
      const payload = {
        number, type, tableId, customerId, items: cart, discountPct, taxRate, status,
      };
      const idx = d.orders.findIndex((o) => o.id === editOrderId);
      if (idx >= 0) {
        Object.assign(d.orders[idx]!, payload);
      } else {
        const id = uid('o');
        d.orders.unshift({ id, createdAt: new Date().toISOString(), paymentMethod: null, invoiceId: null, ...payload });
        if (tableId) {
          const tbl = d.tables.find((t) => t.id === tableId);
          if (tbl) { tbl.status = 'occupied'; tbl.orderId = id; }
        }
      }
    });
    toast(status === 'held' ? 'Order held' : 'Order saved', 'success');
    clearCart();
    if (editOrderId) router.push('/orders');
  }

  function pay(method: PaymentMethod) {
    if (!cart.length) return;
    const number = existing?.number ?? nextOrderNumber(data.orders);
    const invNo = nextInvoiceNumber(data);
    mutate((d) => {
      const orderId = editOrderId ?? uid('o');
      const invoiceId = uid('in');
      // create/replace order as paid
      const orderPayload = {
        id: orderId, number, type, tableId, customerId,
        items: cart, discountPct, taxRate, status: 'paid' as const,
        paymentMethod: method, createdAt: new Date().toISOString(), invoiceId,
      };
      const idx = d.orders.findIndex((o) => o.id === editOrderId);
      if (idx >= 0) d.orders[idx] = orderPayload;
      else d.orders.unshift(orderPayload);

      // café invoice / receipt
      d.invoices.unshift({
        id: invoiceId, number: invNo, kind: 'cafe', customerId, eventId: null, orderId,
        title: `Café order ${number}`, items: cart, discountPct, taxRate,
        status: 'paid', date: new Date().toISOString().slice(0, 10),
        dueDate: new Date().toISOString().slice(0, 10),
      });

      // payment
      d.payments.unshift({
        id: uid('py'), date: new Date().toISOString(), amount: totals.total, method, kind: 'in',
        invoiceId, eventId: null, customerId, reference: method.toUpperCase(), notes: `Café order ${number}`,
      });

      // decrement stock
      cart.forEach((it) => {
        const prod = d.products.find((p) => p.id === it.refId);
        if (prod) { prod.stock = Math.max(0, prod.stock - it.qty); prod.available = prod.stock > 0; }
      });

      // free the table
      if (tableId) {
        const tbl = d.tables.find((t) => t.id === tableId);
        if (tbl) { tbl.status = 'cleaning'; tbl.orderId = null; }
      }
    });
    notify({ type: 'new_order', title: 'Payment received', message: `${number} paid — ${inr(totals.total)} via ${PAYMENT_LABEL[method]}` });
    toast(`Paid ${inr(totals.total)} · receipt ${invNo}`, 'success');
    setPayOpen(false);
    clearCart();
    router.push('/orders');
  }

  const availableTables = data.tables.filter((t) => t.status === 'available' || t.id === tableId);

  return (
    <div>
      <PageTitle title="Café POS" subtitle={existing ? `Editing ${existing.number}` : 'Build an order and take payment'} icon="☕" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr,400px]">
        {/* LEFT: menu */}
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search menu…" className="pl-9" />
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <CatBtn active={cat === 'all'} onClick={() => setCat('all')} icon="🍽️" label="All" />
            {data.categories.map((c) => (
              <CatBtn key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} icon={c.icon} label={c.name} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const out = !p.available || p.stock <= 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  disabled={out}
                  className={clsx(
                    'glass glass-hover rounded-glass p-3 text-left transition',
                    out && 'opacity-50 grayscale',
                  )}
                >
                  <div className="mb-2 grid h-16 place-items-center rounded-xl bg-gradient-to-br from-brand/10 to-brand-accent/10 text-3xl">
                    {p.image}
                  </div>
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-brand">{inr(p.price)}</span>
                    {out ? <Chip tone="bad">Out</Chip> : <Chip tone="good">{p.stock}</Chip>}
                  </div>
                </button>
              );
            })}
            {!products.length && (
              <div className="col-span-full">
                <EmptyState icon="🔍" title="No products found" hint="Try another category or search term." />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: order panel */}
        <Glass className="flex h-fit flex-col rounded-glass-lg p-4 xl:sticky xl:top-20">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold"><Receipt size={18} /> Current Order</div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-bad hover:underline">Clear</button>
            )}
          </div>

          <div className="mb-3 inline-flex w-full glass-2 rounded-xl p-1">
            {(['dine-in', 'takeaway', 'delivery'] as OrderType[]).map((tp) => (
              <button
                key={tp}
                onClick={() => setType(tp)}
                className={clsx('flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition', type === tp ? 'bg-brand text-white' : 'text-ink-soft')}
              >
                {tp}
              </button>
            ))}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <Select value={tableId ?? ''} onChange={(e) => setTableId(e.target.value || null)} disabled={type !== 'dine-in'}>
              <option value="">No table</option>
              {availableTables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <Select value={customerId ?? ''} onChange={(e) => setCustomerId(e.target.value || null)}>
              <option value="">Walk-in</option>
              {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>

          <div className="mb-3 max-h-[36vh] space-y-2 overflow-y-auto scroll-thin">
            {cart.length ? cart.map((i) => (
              <div key={i.id} className="flex items-center gap-2 rounded-xl glass-2 p-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{i.name}</div>
                  <div className="text-xs text-ink-faint">{inr(i.price)} each</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQty(i.id, -1)} className="grid h-6 w-6 place-items-center rounded-lg glass-2 hover:text-brand"><Minus size={13} /></button>
                  <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                  <button onClick={() => setQty(i.id, 1)} className="grid h-6 w-6 place-items-center rounded-lg glass-2 hover:text-brand"><Plus size={13} /></button>
                </div>
                <div className="w-16 text-right text-sm font-semibold">{inr(i.qty * i.price)}</div>
                <button onClick={() => removeItem(i.id)} className="text-ink-faint hover:text-bad"><Trash2 size={14} /></button>
              </div>
            )) : (
              <div className="py-8 text-center text-sm text-ink-faint">Tap products to add them</div>
            )}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <label className="text-xs">
              <span className="lbl">Discount %</span>
              <Field type="number" min={0} max={100} value={discountPct} onChange={(e) => setDiscountPct(Math.max(0, Math.min(100, +e.target.value || 0)))} />
            </label>
            <label className="text-xs">
              <span className="lbl">GST</span>
              <Select value={taxRate} onChange={(e) => setTaxRate(+e.target.value)}>
                {data.settings.taxRates.map((r) => <option key={r.id} value={r.rate}>{r.name}</option>)}
              </Select>
            </label>
          </div>

          <div className="space-y-1 border-t border-glass-border/40 pt-3 text-sm">
            <Row label="Subtotal" value={inr(totals.gross)} />
            {totals.discount > 0 && <Row label={`Discount (${discountPct}%)`} value={`- ${inr(totals.discount)}`} tone="good" />}
            <Row label={`GST (${taxRate}%)`} value={inr(totals.tax)} sub={`CGST ${inr(totals.cgst)} · SGST ${inr(totals.sgst)}`} />
            <div className="flex items-center justify-between border-t border-glass-border/40 pt-2 text-base font-bold">
              <span>Grand Total</span>
              <span className="text-gradient">{inr(totals.total)}</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Btn variant="glass" onClick={() => persistOrder('held')} disabled={!cart.length}><Pause size={15} /> Hold</Btn>
            <Btn variant="glass" onClick={() => persistOrder('open')} disabled={!cart.length}><Save size={15} /> Save</Btn>
          </div>
          <Btn variant="primary" className="mt-2 w-full !py-3 text-base" onClick={() => setPayOpen(true)} disabled={!cart.length}>
            <CreditCard size={18} /> Pay {inr(totals.total)}
          </Btn>
        </Glass>
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Take payment">
        <div className="mb-4 rounded-glass glass-2 p-4 text-center">
          <div className="text-xs text-ink-faint">Amount due</div>
          <div className="text-3xl font-bold text-gradient">{inr(totals.total)}</div>
        </div>
        <p className="mb-2 text-sm font-medium">Select payment method</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {METHODS.map((m) => (
            <button key={m} onClick={() => pay(m)} className="glass glass-hover rounded-xl p-3 text-center text-sm font-semibold capitalize">
              <div className="mb-1 text-2xl">{m === 'cash' ? '💵' : m === 'upi' ? '📲' : m === 'card' ? '💳' : m === 'bank' ? '🏦' : '🔗'}</div>
              {PAYMENT_LABEL[m]}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'good' }) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-ink-faint">{label}{sub && <span className="block text-[10px]">{sub}</span>}</span>
      <span className={clsx('font-medium', tone === 'good' && 'text-good')}>{value}</span>
    </div>
  );
}

function CatBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx('flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition', active ? 'bg-brand text-white shadow-glass-sm' : 'glass-2 text-ink-soft hover:text-ink')}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

export default function POSPage() {
  return (
    <Suspense fallback={null}>
      <POSInner />
    </Suspense>
  );
}
