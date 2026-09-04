'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Users, ArrowRightLeft, Merge, Receipt, Sparkles, Plus } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { CafeTable, TableStatus } from '@/lib/types';
import { orderTotal, customerName } from '@/lib/selectors';
import { inr } from '@/lib/money';
import { Glass, Btn, Chip, Modal, Select, PageTitle } from '@/components/ui';
import { TABLE_STATUS } from '@/lib/status';

const CYCLE: Record<TableStatus, TableStatus> = {
  available: 'reserved', reserved: 'cleaning', cleaning: 'available', occupied: 'occupied',
};

export default function TablesPage() {
  const { data, mutate, toast } = useStore();
  const router = useRouter();
  const [sel, setSel] = useState<CafeTable | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [target, setTarget] = useState('');

  const counts = data.tables.reduce(
    (a, t) => ((a[t.status] = (a[t.status] || 0) + 1), a),
    {} as Record<string, number>,
  );

  const selected = sel ? data.tables.find((t) => t.id === sel.id) ?? null : null;
  const order = selected?.orderId ? data.orders.find((o) => o.id === selected.orderId) : null;

  function setStatus(id: string, status: TableStatus) {
    mutate((d) => {
      const t = d.tables.find((x) => x.id === id);
      if (t) { t.status = status; if (status === 'available') t.orderId = null; }
    });
  }

  function closeTable(id: string) {
    mutate((d) => {
      const t = d.tables.find((x) => x.id === id);
      if (t) { t.status = 'cleaning'; t.orderId = null; }
    });
    toast('Table closed', 'info');
    setSel(null);
  }

  function transfer() {
    if (!selected || !target) return;
    mutate((d) => {
      const from = d.tables.find((t) => t.id === selected.id);
      const to = d.tables.find((t) => t.id === target);
      if (from && to) {
        to.status = 'occupied';
        to.orderId = from.orderId;
        const ord = d.orders.find((o) => o.id === from.orderId);
        if (ord) ord.tableId = to.id;
        from.status = 'available';
        from.orderId = null;
      }
    });
    toast(`Transferred to ${data.tables.find((t) => t.id === target)?.name}`, 'success');
    setTransferOpen(false);
    setSel(null);
    setTarget('');
  }

  function merge() {
    if (!selected || !target) return;
    const other = data.tables.find((t) => t.id === target);
    const otherOrder = other?.orderId ? data.orders.find((o) => o.id === other.orderId) : null;
    if (!order || !otherOrder) { toast('Both tables need an open order', 'error'); return; }
    mutate((d) => {
      const keep = d.orders.find((o) => o.id === order.id);
      const drop = d.orders.find((o) => o.id === otherOrder.id);
      const dropTable = d.tables.find((t) => t.id === target);
      if (keep && drop) {
        keep.items = [...keep.items, ...drop.items];
        drop.status = 'void';
      }
      if (dropTable) { dropTable.status = 'cleaning'; dropTable.orderId = null; }
    });
    toast('Tables merged', 'success');
    setMergeOpen(false);
    setSel(null);
    setTarget('');
  }

  function addTable() {
    mutate((d) => {
      const n = d.tables.length + 1;
      d.tables.push({ id: `t_${Date.now()}`, name: `T${n}`, seats: 4, status: 'available', orderId: null });
    });
    toast('Table added', 'success');
  }

  return (
    <div>
      <PageTitle
        title="Tables"
        subtitle="Floor overview — tap a table to manage its order"
        icon="🪑"
        actions={<Btn variant="glass" onClick={addTable}><Plus size={15} /> Add table</Btn>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['available', 'occupied', 'reserved', 'cleaning'] as TableStatus[]).map((s) => (
          <Glass key={s} className="flex items-center gap-3 p-3.5">
            <span className="h-3 w-3 rounded-full" style={{ background: TABLE_STATUS[s].dot }} />
            <div>
              <div className="text-xl font-bold">{counts[s] ?? 0}</div>
              <div className="text-xs text-ink-faint">{TABLE_STATUS[s].label}</div>
            </div>
          </Glass>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {data.tables.map((t) => {
          const ord = t.orderId ? data.orders.find((o) => o.id === t.orderId) : null;
          const total = ord ? orderTotal(ord, data.settings) : 0;
          return (
            <button
              key={t.id}
              onClick={() => setSel(t)}
              className="glass glass-hover rounded-glass p-4 text-left"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-lg font-bold">{t.name}</span>
                <span className="h-3 w-3 rounded-full ring-4 ring-white/10" style={{ background: TABLE_STATUS[t.status].dot }} />
              </div>
              <div className="flex items-center gap-1 text-xs text-ink-faint"><Users size={13} /> {t.seats} seats</div>
              <div className="mt-2">
                <Chip tone={TABLE_STATUS[t.status].tone}>{TABLE_STATUS[t.status].label}</Chip>
              </div>
              {ord && (
                <div className="mt-2 border-t border-glass-border/40 pt-2 text-xs">
                  <div className="font-medium">{ord.number}</div>
                  <div className="text-brand font-bold">{inr(total)}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Table detail */}
      <Modal open={!!selected} onClose={() => setSel(null)} title={selected ? `Table ${selected.name}` : ''}>
        {selected && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <Chip tone={TABLE_STATUS[selected.status].tone}>{TABLE_STATUS[selected.status].label}</Chip>
              <span className="text-sm text-ink-faint"><Users size={14} className="inline" /> {selected.seats} seats</span>
            </div>

            {order ? (
              <div className="mb-4 rounded-glass glass-2 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">{order.number}</span>
                  <span className="text-xs text-ink-faint">{customerName(data, order.customerId)}</span>
                </div>
                <div className="space-y-1 text-sm">
                  {order.items.map((i) => (
                    <div key={i.id} className="flex justify-between">
                      <span className="text-ink-soft">{i.qty}× {i.name}</span>
                      <span>{inr(i.qty * i.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between border-t border-glass-border/40 pt-2 font-bold">
                  <span>Total</span><span className="text-brand">{inr(orderTotal(order, data.settings))}</span>
                </div>
              </div>
            ) : (
              <p className="mb-4 rounded-glass glass-2 p-4 text-center text-sm text-ink-faint">No active order on this table.</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Btn variant="primary" onClick={() => router.push(order ? `/pos?order=${order.id}` : `/pos`)}>
                <Plus size={15} /> {order ? 'Edit order' : 'Add order'}
              </Btn>
              <Btn variant="glass" disabled={!order} onClick={() => setTransferOpen(true)}><ArrowRightLeft size={15} /> Transfer</Btn>
              <Btn variant="glass" disabled={!order} onClick={() => setMergeOpen(true)}><Merge size={15} /> Merge</Btn>
              <Btn variant="glass" disabled={!order} onClick={() => router.push(order ? `/pos?order=${order.id}` : '/pos')}><Receipt size={15} /> Bill</Btn>
              {selected.status === 'cleaning' && (
                <Btn variant="glass" className="col-span-2" onClick={() => { setStatus(selected.id, 'available'); setSel(null); toast('Table ready', 'success'); }}>
                  <Sparkles size={15} /> Mark ready
                </Btn>
              )}
              <Btn variant="danger" className="col-span-2" onClick={() => closeTable(selected.id)}>Close table</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Transfer */}
      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer order"
        footer={<><Btn variant="ghost" onClick={() => setTransferOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={transfer} disabled={!target}>Transfer</Btn></>}>
        <p className="mb-2 text-sm text-ink-soft">Move this order to another table.</p>
        <Select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">Select table…</option>
          {data.tables.filter((t) => t.status === 'available').map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Modal>

      {/* Merge */}
      <Modal open={mergeOpen} onClose={() => setMergeOpen(false)} title="Merge tables"
        footer={<><Btn variant="ghost" onClick={() => setMergeOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={merge} disabled={!target}>Merge</Btn></>}>
        <p className="mb-2 text-sm text-ink-soft">Combine another occupied table's order into this one.</p>
        <Select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">Select table…</option>
          {data.tables.filter((t) => t.status === 'occupied' && t.id !== selected?.id).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Modal>
    </div>
  );
}
