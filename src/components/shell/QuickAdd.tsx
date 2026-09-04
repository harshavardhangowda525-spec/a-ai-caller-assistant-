'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Coffee, UserPlus, PartyPopper, FileText, FileCheck2, Wallet, Banknote, Package } from 'lucide-react';
import clsx from 'clsx';

const ACTIONS = [
  { label: 'New Café Order', icon: Coffee, href: '/pos' },
  { label: 'New Customer', icon: UserPlus, href: '/customers?new=1' },
  { label: 'New Event', icon: PartyPopper, href: '/events?new=1' },
  { label: 'New Quotation', icon: FileText, href: '/quotations?new=1' },
  { label: 'New Invoice', icon: FileCheck2, href: '/invoices?new=1' },
  { label: 'Record Payment', icon: Wallet, href: '/payments?new=1' },
  { label: 'Add Expense', icon: Banknote, href: '/expenses?new=1' },
  { label: 'Add Product', icon: Package, href: '/products?new=1' },
];

export function QuickAdd({ variant = 'fab' }: { variant?: 'fab' | 'inline' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div ref={ref} className={clsx('relative', variant === 'fab' && 'fixed bottom-6 right-6 z-40 no-print md:bottom-8 md:right-8')}>
      {open && (
        <div
          className={clsx(
            'glass absolute w-56 rounded-glass p-2 animate-scale-in',
            variant === 'fab' ? 'bottom-16 right-0' : 'right-0 top-12',
          )}
        >
          <div className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            Quick Add
          </div>
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => go(a.href)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-brand/12 hover:text-brand"
              >
                <Icon size={16} />
                {a.label}
              </button>
            );
          })}
        </div>
      )}
      {variant === 'fab' ? (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Quick add"
          className={clsx(
            'grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-accent text-white shadow-glow transition hover:brightness-110 active:scale-95',
            open && 'rotate-45',
          )}
        >
          <Plus size={24} />
        </button>
      ) : (
        <button onClick={() => setOpen((o) => !o)} className="btn btn-primary" aria-label="Quick add">
          <Plus size={16} /> Quick Add
        </button>
      )}
    </div>
  );
}
