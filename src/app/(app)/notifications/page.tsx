'use client';

import { useState } from 'react';
import { Check, Trash2, BellOff } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '@/lib/store';
import { relTime } from '@/lib/format';
import { Glass, Btn, PageTitle, EmptyState, Segmented } from '@/components/ui';

const ICON: Record<string, string> = {
  low_stock: '📦', event_upcoming: '🎉', payment_pending: '⏳',
  invoice_overdue: '⚠️', new_order: '☕', quote_accepted: '✅', payment_received: '💰',
};

export default function NotificationsPage() {
  const { data, mutate, toast } = useStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const rows = data.notifications.filter((n) => (filter === 'unread' ? !n.read : true));
  const unread = data.notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageTitle
        title="Notifications"
        subtitle={`${unread} unread`}
        icon="🔔"
        actions={
          <div className="flex items-center gap-2">
            <Segmented value={filter} onChange={(v) => setFilter(v)} options={[{ value: 'all', label: 'All' }, { value: 'unread', label: `Unread` }]} />
            <Btn variant="glass" onClick={() => { mutate((d) => d.notifications.forEach((n) => (n.read = true))); toast('All marked read', 'success'); }}><Check size={15} /> Mark all</Btn>
          </div>
        }
      />

      <Glass className="p-3">
        {rows.length ? (
          <div className="space-y-1.5">
            {rows.map((n) => (
              <div key={n.id} className={clsx('flex items-start gap-3 rounded-glass p-3 transition', !n.read ? 'bg-brand/8' : 'glass-2')}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl glass-2 text-lg">{ICON[n.type] ?? '🔔'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brand" />}
                  </div>
                  <div className="text-sm text-ink-soft">{n.message}</div>
                  <div className="mt-0.5 text-xs text-ink-faint">{relTime(n.time)}</div>
                </div>
                <div className="flex gap-1">
                  {!n.read && (
                    <button onClick={() => mutate((d) => { const x = d.notifications.find((z) => z.id === n.id); if (x) x.read = true; })} className="btn btn-ghost !p-1.5 rounded-lg" title="Mark read"><Check size={15} /></button>
                  )}
                  <button onClick={() => mutate((d) => { d.notifications = d.notifications.filter((z) => z.id !== n.id); })} className="btn btn-ghost !p-1.5 rounded-lg text-bad" title="Delete"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<BellOff size={22} />} title="You're all caught up" hint="No notifications to show." />
        )}
      </Glass>
    </div>
  );
}
