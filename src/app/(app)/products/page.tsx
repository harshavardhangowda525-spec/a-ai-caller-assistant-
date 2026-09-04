'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Product } from '@/lib/types';
import { inr } from '@/lib/money';
import { uid } from '@/lib/format';
import { Glass, Btn, Chip, Field, Select, Modal, PageTitle, EmptyState, FieldRow, ConfirmDialog } from '@/components/ui';

const EMOJIS = ['☕', '🍵', '🧊', '🥪', '🍟', '🥟', '🍕', '🍝', '🌯', '🍫', '🍰', '🍮', '🥤', '🥭', '💧', '🎁', '🧋', '🍪', '🥗', '🍔'];

function blank(categoryId: string): Product {
  return { id: '', name: '', categoryId, sku: '', price: 0, cost: 0, image: '☕', available: true, stock: 0, minStock: 5 };
}

function ProductsInner() {
  const { data, mutate, toast } = useStore();
  const params = useSearchParams();
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Product | null>(null);
  const [del, setDel] = useState<Product | null>(null);

  useEffect(() => {
    if (params.get('new') === '1') setEdit(blank(data.categories[0]!.id));
    const id = params.get('id');
    if (id) { const p = data.products.find((x) => x.id === id); if (p) setEdit({ ...p }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const products = useMemo(
    () =>
      data.products
        .filter((p) => (cat === 'all' ? true : p.categoryId === cat))
        .filter((p) => (q ? (p.name + p.sku).toLowerCase().includes(q.toLowerCase()) : true)),
    [data.products, cat, q],
  );

  function save() {
    if (!edit || !edit.name.trim()) { toast('Name is required', 'error'); return; }
    mutate((d) => {
      if (edit.id) {
        const i = d.products.findIndex((p) => p.id === edit.id);
        if (i >= 0) d.products[i] = { ...edit, available: edit.stock > 0 ? edit.available : false };
      } else {
        d.products.push({ ...edit, id: uid('p'), available: edit.stock > 0 });
      }
    });
    toast(edit.id ? 'Product updated' : 'Product added', 'success');
    setEdit(null);
  }

  function remove(p: Product) {
    mutate((d) => { d.products = d.products.filter((x) => x.id !== p.id); });
    toast('Product deleted', 'info');
  }

  const catName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? '—';

  return (
    <div>
      <PageTitle
        title="Products"
        subtitle="Menu &amp; catalog"
        icon="📦"
        actions={<Btn variant="primary" onClick={() => setEdit(blank(data.categories[0]!.id))}><Plus size={15} /> Add product</Btn>}
      />

      <Glass className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Field value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="pl-9" />
          </div>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-44">
            <option value="all">All categories</option>
            {data.categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </Select>
        </div>

        {products.length ? (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5">SKU</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5 text-right">Cost</th>
                  <th className="p-2.5 text-right">Price</th>
                  <th className="p-2.5 text-right">Stock</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-glass-border/30 transition hover:bg-ink/4">
                    <td className="p-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-xl glass-2 text-lg">{p.image}</span>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-ink-faint">{p.sku}</td>
                    <td className="p-2.5 text-ink-soft">{catName(p.categoryId)}</td>
                    <td className="p-2.5 text-right text-ink-soft">{inr(p.cost)}</td>
                    <td className="p-2.5 text-right font-semibold">{inr(p.price)}</td>
                    <td className="p-2.5 text-right">{p.stock}</td>
                    <td className="p-2.5">
                      {p.stock <= 0 ? <Chip tone="bad">Out</Chip> : p.stock <= p.minStock ? <Chip tone="warn">Low</Chip> : <Chip tone="good">In stock</Chip>}
                    </td>
                    <td className="p-2.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEdit({ ...p })} className="btn btn-ghost !p-1.5 rounded-lg" title="Edit"><Pencil size={15} /></button>
                        <button onClick={() => setDel(p)} className="btn btn-ghost !p-1.5 rounded-lg text-bad" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="📦" title="No products" hint="Add your first product to build the menu." />
        )}
      </Glass>

      {/* Edit / create modal */}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit product' : 'New product'}
        footer={<><Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn><Btn variant="primary" onClick={save}>Save product</Btn></>}
      >
        {edit && (
          <div className="space-y-4">
            <div>
              <span className="lbl">Icon</span>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setEdit({ ...edit, image: e })} className={`grid h-9 w-9 place-items-center rounded-xl text-lg transition ${edit.image === e ? 'bg-brand/20 ring-2 ring-brand' : 'glass-2'}`}>{e}</button>
                ))}
              </div>
            </div>
            <FieldRow label="Name"><Field value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Cappuccino" /></FieldRow>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="SKU"><Field value={edit.sku} onChange={(e) => setEdit({ ...edit, sku: e.target.value })} placeholder="CFE-001" /></FieldRow>
              <FieldRow label="Category">
                <Select value={edit.categoryId} onChange={(e) => setEdit({ ...edit, categoryId: e.target.value })}>
                  {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Purchase price (₹)"><Field type="number" value={edit.cost} onChange={(e) => setEdit({ ...edit, cost: +e.target.value || 0 })} /></FieldRow>
              <FieldRow label="Selling price (₹)"><Field type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: +e.target.value || 0 })} /></FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Stock"><Field type="number" value={edit.stock} onChange={(e) => setEdit({ ...edit, stock: +e.target.value || 0 })} /></FieldRow>
              <FieldRow label="Minimum stock"><Field type="number" value={edit.minStock} onChange={(e) => setEdit({ ...edit, minStock: +e.target.value || 0 })} /></FieldRow>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={edit.available} onChange={(e) => setEdit({ ...edit, available: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--brand))]" />
              Available for sale
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!del}
        title="Delete product?"
        message={`"${del?.name}" will be permanently removed from the catalog.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => del && remove(del)}
        onClose={() => setDel(null)}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsInner />
    </Suspense>
  );
}
