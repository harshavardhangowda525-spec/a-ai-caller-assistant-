'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft } from 'lucide-react';
import { NAV } from '@/lib/nav';
import { canAccess, useStore } from '@/lib/store';
import { inr } from '@/lib/money';

interface Result {
  id: string;
  label: string;
  sub: string;
  icon: string;
  href: string;
  group: string;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { data, role } = useStore();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    const out: Result[] = [];
    const push = (r: Result) => out.push(r);

    NAV.filter((n) => canAccess(role, n.key)).forEach((n) => {
      if (!term || n.label.toLowerCase().includes(term))
        push({ id: 'nav_' + n.key, label: n.label, sub: 'Page', icon: '↗', href: n.href, group: 'Navigate' });
    });
    if (term) {
      data.customers.forEach((c) => {
        if (c.name.toLowerCase().includes(term) || c.phone.includes(term))
          push({ id: c.id, label: c.name, sub: c.phone, icon: '👤', href: `/customers?id=${c.id}`, group: 'Customers' });
      });
      data.products.forEach((p) => {
        if (p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
          push({ id: p.id, label: p.name, sub: `${p.sku} · ${inr(p.price)}`, icon: p.image, href: `/products?id=${p.id}`, group: 'Products' });
      });
      data.events.forEach((e) => {
        if (e.name.toLowerCase().includes(term))
          push({ id: e.id, label: e.name, sub: `${e.type} · ${e.date}`, icon: '🎉', href: `/events?id=${e.id}`, group: 'Events' });
      });
      data.invoices.forEach((i) => {
        if (i.number.toLowerCase().includes(term) || i.title.toLowerCase().includes(term))
          push({ id: i.id, label: i.number, sub: i.title, icon: '🧾', href: `/invoices?id=${i.id}`, group: 'Invoices' });
      });
      data.quotations.forEach((qq) => {
        if (qq.number.toLowerCase().includes(term) || qq.title.toLowerCase().includes(term))
          push({ id: qq.id, label: qq.number, sub: qq.title, icon: '📄', href: `/quotations?id=${qq.id}`, group: 'Quotations' });
      });
      data.orders.forEach((o) => {
        if (o.number.toLowerCase().includes(term))
          push({ id: o.id, label: o.number, sub: 'Café order', icon: '☕', href: `/orders?id=${o.id}`, group: 'Orders' });
      });
    }
    return out.slice(0, 24);
  }, [q, data, role]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  if (!open) return null;

  const go = (r?: Result) => {
    const target = r ?? results[active];
    if (!target) return;
    router.push(target.href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh] no-print">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="glass relative z-10 w-full max-w-xl overflow-hidden rounded-glass-lg animate-scale-in">
        <div className="flex items-center gap-3 border-b border-glass-border/40 px-5 py-4">
          <Search size={18} className="text-ink-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === 'Enter') { e.preventDefault(); go(); }
            }}
            placeholder="Search customers, products, events, invoices…"
            className="w-full bg-transparent text-base outline-none placeholder:text-ink-faint"
          />
          <kbd className="hidden rounded-md border border-glass-border/50 px-1.5 py-0.5 text-[10px] text-ink-faint sm:block">ESC</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto scroll-thin p-2">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-ink-faint">No matches found</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id + i}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={clsxRow(i === active)}
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg glass-2 text-base">{r.icon}</span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium">{r.label}</span>
                  <span className="block truncate text-xs text-ink-faint">{r.sub}</span>
                </span>
                <span className="text-[10px] uppercase tracking-wide text-ink-faint">{r.group}</span>
                {i === active && <CornerDownLeft size={14} className="text-brand" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function clsxRow(active: boolean) {
  return [
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition',
    active ? 'bg-brand/12' : 'hover:bg-ink/5',
  ].join(' ');
}
