'use client';

import { useMemo, useState } from 'react';
import { Search, Boxes, Wallet, AlertTriangle, PackageX, PackagePlus } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Product } from '@/lib/types';
import { inr } from '@/lib/money';
import { Glass, Btn, Chip, Field, Select, Modal, PageTitle, FieldRow } from '@/components/ui';
import { KpiCard } from '@/components/Metrics';

export default function InventoryPage() {
  const { data, mutate, toast } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [restock, setRestock] = useState<Product | null>(null);
  const [qty, setQty] = useState(0);

  const stats = useMemo(() => {
    const total = data.products.length;
    const value = data.products.reduce((s, p) => s + p.cost * p.stock, 0);
    const low = data.products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
    const out = data.products.filter((p) => p.stock <= 0).length;
    return { total, value, low, out };
  }, [data.products]);

  const rows = useMemo(
    () =>
      data.products
        .filter((p) => (q ? (p.name + p.sku).toLowerCase().includes(q.toLowerCase()) : true))
        .filter((p) =>
          filter === 'low' ? p.stock > 0 && p.stock <= p.minStock : filter === 'out' ? p.stock <= 0 : true,
        ),
    [data.products, q, filter],
  );

  function doRestock() {
    if (!restock || qty <= 0) return;
    mutate((d) => {
      const p = d.products.find((x) => x.id === restock.id);
      if (p) { p.stock += qty; p.available = true; }
    });
    toast(`Added ${qty} to ${restock.name}`, 'success');
    setRestock(null);
    setQty(0);
  }

  const catName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? '—';

  return (
    <div>
      <PageTitle title="Inventory" subtitle="Stock levels &amp; valuation" icon="📊" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total products" value={stats.total} format={(n) => String(Math.round(n))} icon={<Boxes size={18} />} accent="brand" />
        <KpiCard label="Stock value" value={stats.value} format={(n) => inr(n)} icon={<Wallet size={18} />} accent="good" />
        <KpiCard label="Low stock" value={stats.low} format={(n) => String(Math.round(n))} icon={<AlertTriangle size={18} />} accent="warn" />
        <KpiCard label="Out of stock" value={stats.out} format={(n) => String(Math.round(n))} icon={<PackageX size={18} />} accent="bad" />
      </div>

      <Glass className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search inventory…" className="pl-9" />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40">
            <option value="all">All items</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </Select>
        </div>

        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="p-2.5">Product</th>
                <th className="p-2.5">SKU</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5 text-right">Stock</th>
                <th className="p-2.5 text-right">Min</th>
                <th className="p-2.5 text-right">Purchase</th>
                <th className="p-2.5 text-right">Selling</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-glass-border/30 transition hover:bg-ink/4">
                  <td className="p-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl glass-2 text-lg">{p.image}</span>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-2.5 text-ink-faint">{p.sku}</td>
                  <td className="p-2.5 text-ink-soft">{catName(p.categoryId)}</td>
                  <td className="p-2.5 text-right font-semibold">{p.stock}</td>
                  <td className="p-2.5 text-right text-ink-faint">{p.minStock}</td>
                  <td className="p-2.5 text-right text-ink-soft">{inr(p.cost)}</td>
                  <td className="p-2.5 text-right">{inr(p.price)}</td>
                  <td className="p-2.5">
                    {p.stock <= 0 ? <Chip tone="bad">Out</Chip> : p.stock <= p.minStock ? <Chip tone="warn">Low</Chip> : <Chip tone="good">OK</Chip>}
                  </td>
                  <td className="p-2.5 text-right">
                    <button onClick={() => { setRestock(p); setQty(0); }} className="btn btn-ghost !p-1.5 rounded-lg text-brand" title="Restock"><PackagePlus size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Glass>

      <Modal
        open={!!restock}
        onClose={() => setRestock(null)}
        title={`Restock ${restock?.name ?? ''}`}
        footer={<><Btn variant="ghost" onClick={() => setRestock(null)}>Cancel</Btn><Btn variant="primary" onClick={doRestock} disabled={qty <= 0}>Add stock</Btn></>}
      >
        {restock && (
          <div className="space-y-4">
            <div className="rounded-glass glass-2 p-3 text-sm">
              <div className="flex justify-between"><span className="text-ink-faint">Current stock</span><span className="font-semibold">{restock.stock}</span></div>
              <div className="flex justify-between"><span className="text-ink-faint">Minimum</span><span>{restock.minStock}</span></div>
            </div>
            <FieldRow label="Quantity to add">
              <Field type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(0, +e.target.value || 0))} autoFocus />
            </FieldRow>
            {qty > 0 && (
              <p className="text-sm text-good">New stock will be <b>{restock.stock + qty}</b> · added value {inr(qty * restock.cost)}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
