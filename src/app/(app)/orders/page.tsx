'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Eye, Pencil, Coffee } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { CafeOrder } from '@/lib/types';
import { orderTotal, customerName } from '@/lib/selectors';
import { inr } from '@/lib/money';
import { fmtDateTime } from '@/lib/format';
import { Glass, Btn, Chip, Field, Select, PageTitle, EmptyState } from '@/components/ui';
import { ORDER_STATUS, PAYMENT_LABEL } from '@/lib/status';
import { DocViewer } from '@/components/DocViewer';
import type { DocProps } from '@/components/InvoiceDoc';

function OrdersInner() {
  const { data } = useStore();
  const router = useRouter();
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [view, setView] = useState<CafeOrder | null>(null);

  const orders = useMemo(() => {
    return [...data.orders]
      .filter((o) => o.status !== 'void')
      .filter((o) => (status === 'all' ? true : o.status === status))
      .filter((o) => (q ? o.number.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data.orders, status, q]);

  const receipt: DocProps | null = view
    ? {
        settings: data.settings,
        kind: 'receipt',
        number: view.invoiceId ? data.invoices.find((i) => i.id === view.invoiceId)?.number ?? view.number : view.number,
        date: view.createdAt,
        title: `Café order ${view.number}`,
        customer: data.customers.find((c) => c.id === view.customerId) ?? null,
        items: view.items,
        discountPct: view.discountPct,
        taxRate: view.taxRate,
        terms: undefined,
      }
    : null;

  return (
    <div>
      <PageTitle
        title="Orders"
        subtitle="All café orders"
        icon="🧾"
        actions={<Btn variant="primary" onClick={() => router.push('/pos')}><Coffee size={15} /> New order</Btn>}
      />

      <Glass className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order #…" className="pl-9" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="all">All status</option>
            <option value="open">Open</option>
            <option value="held">Held</option>
            <option value="paid">Paid</option>
          </Select>
        </div>

        {orders.length ? (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="p-2.5">Order</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Items</th>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5 text-right">Total</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-glass-border/30 transition hover:bg-ink/4">
                    <td className="p-2.5 font-semibold">{o.number}</td>
                    <td className="p-2.5">{customerName(data, o.customerId)}</td>
                    <td className="p-2.5 capitalize text-ink-soft">{o.type}</td>
                    <td className="p-2.5 text-ink-soft">{o.items.length}</td>
                    <td className="p-2.5 text-ink-faint">{fmtDateTime(o.createdAt)}</td>
                    <td className="p-2.5 text-right font-semibold">{inr(orderTotal(o, data.settings))}</td>
                    <td className="p-2.5">
                      <Chip tone={ORDER_STATUS[o.status].tone}>
                        {o.status === 'paid' && o.paymentMethod ? PAYMENT_LABEL[o.paymentMethod] : ORDER_STATUS[o.status].label}
                      </Chip>
                    </td>
                    <td className="p-2.5">
                      <div className="flex justify-end gap-1">
                        {o.status === 'paid' ? (
                          <button onClick={() => setView(o)} className="btn btn-ghost !p-1.5 rounded-lg" title="View receipt"><Eye size={16} /></button>
                        ) : (
                          <button onClick={() => router.push(`/pos?order=${o.id}`)} className="btn btn-ghost !p-1.5 rounded-lg" title="Resume"><Pencil size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="☕" title="No orders found" hint="Create an order from the Café POS." action={<Btn variant="primary" onClick={() => router.push('/pos')}>Open POS</Btn>} />
        )}
      </Glass>

      <DocViewer open={!!view} onClose={() => setView(null)} doc={receipt} />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersInner />
    </Suspense>
  );
}
