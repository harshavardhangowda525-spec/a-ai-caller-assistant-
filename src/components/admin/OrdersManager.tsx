'use client';

import { useMemo, useState } from 'react';
import { PageTitle, Panel } from './ui';
import type { Order, OrderStatus } from '@/lib/types';

const STATUSES: OrderStatus[] = ['new', 'preparing', 'ready', 'completed', 'cancelled'];

const statusColor: Record<OrderStatus, string> = {
  new: 'bg-blue-400/15 text-blue-200',
  preparing: 'bg-amber-400/15 text-amber-200',
  ready: 'bg-copper-500/15 text-copper-300',
  completed: 'bg-green-400/15 text-green-200',
  cancelled: 'bg-red-400/15 text-red-300',
};

export default function OrdersManager({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initial);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [msg, setMsg] = useState('');

  const shown = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  async function setStatus(id: string, status: OrderStatus) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error || 'Could not update status.');
    }
  }

  return (
    <div>
      <PageTitle title="Orders" sub="Track and update every order across POS and online." />

      {msg && <div className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">{msg}</div>}

      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
              filter === s ? 'border-copper-400/50 bg-copper-500/20 text-copper-200' : 'border-cream-100/15 text-cream-200/70'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Panel>
          <p className="text-sm text-cream-200/50">
            No orders {filter !== 'all' ? `with status “${filter}”` : 'yet'}. Create one in Billing / POS.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-3">
          {shown.map((o) => (
            <Panel key={o.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-copper-300">{o.reference}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${statusColor[o.status]}`}>{o.status}</span>
                    <span className="rounded-full bg-cream-100/8 px-2 py-0.5 text-[10px] text-cream-200/60">{o.channel}</span>
                  </div>
                  <p className="mt-1 text-xs text-cream-200/60">
                    {o.customerName || 'Walk-in'}
                    {o.customerPhone ? ` · ${o.customerPhone}` : ''} ·{' '}
                    {new Date(o.createdAt).toLocaleString('en-IN')}
                  </p>
                  <ul className="mt-2 text-xs text-cream-200/70">
                    {o.lines.map((l, i) => (
                      <li key={i}>
                        {l.qty}× {l.name} — ₹{l.price * l.qty}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl text-cream-100">₹{o.total}</div>
                  <div className="text-[11px] uppercase text-cream-200/50">{o.paymentMethod}</div>
                  <select
                    value={o.status}
                    onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
                    className="mt-2 rounded-lg border border-cream-100/15 bg-espresso-950/40 px-2 py-1 text-xs text-cream-100"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-espresso-900 capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
