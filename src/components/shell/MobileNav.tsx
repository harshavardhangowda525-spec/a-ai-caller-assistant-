'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LayoutDashboard, Coffee, PartyPopper, FileCheck2, Menu } from 'lucide-react';

const ITEMS = [
  { key: 'dashboard', label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { key: 'pos', label: 'POS', href: '/pos', icon: Coffee },
  { key: 'events', label: 'Events', href: '/events', icon: PartyPopper },
  { key: 'invoices', label: 'Invoices', href: '/invoices', icon: FileCheck2 },
];

export function MobileNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="glass fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-glass px-2 py-1.5 lg:hidden no-print">
      {ITEMS.map((it) => {
        const active = pathname.startsWith(it.href);
        const Icon = it.icon;
        return (
          <Link
            key={it.key}
            href={it.href}
            className={clsx('flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition', active ? 'text-brand' : 'text-ink-faint')}
          >
            <Icon size={20} />
            {it.label}
          </Link>
        );
      })}
      <button onClick={onMore} className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium text-ink-faint">
        <Menu size={20} />
        More
      </button>
    </nav>
  );
}
