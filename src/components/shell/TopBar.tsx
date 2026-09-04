'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Bell, Sun, Moon, Menu, Check, ChevronDown, Coffee, PartyPopper,
} from 'lucide-react';
import clsx from 'clsx';
import { NAV } from '@/lib/nav';
import { ROLE_LABELS, useStore } from '@/lib/store';
import { relTime } from '@/lib/format';
import { QuickAdd } from './QuickAdd';

const NOTIF_ICON: Record<string, string> = {
  low_stock: '📦', event_upcoming: '🎉', payment_pending: '⏳',
  invoice_overdue: '⚠️', new_order: '☕', quote_accepted: '✅', payment_received: '💰',
};

export function TopBar({ onOpenSearch, onOpenMenu }: { onOpenSearch: () => void; onOpenMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, theme, toggleTheme, mode, setMode, currentUserId, setCurrentUserId } = useStore();
  const current = NAV.find((n) => pathname.startsWith(n.href))?.label ?? 'Dashboard';
  const user = data.users.find((u) => u.id === currentUserId) ?? data.users[0]!;
  const unread = data.notifications.filter((n) => !n.read).length;

  return (
    <header className="glass sticky top-0 z-30 flex items-center gap-2 rounded-glass px-3 py-2.5 sm:px-4">
      <button onClick={onOpenMenu} className="btn btn-ghost !p-2 rounded-xl lg:hidden" aria-label="Menu">
        <Menu size={20} />
      </button>

      <div className="hidden min-w-0 sm:block">
        <div className="truncate text-sm font-bold leading-tight">{data.settings.businessName}</div>
        <div className="text-[11px] text-ink-faint">{current}</div>
      </div>

      {/* Mode switch */}
      <div className="ml-1 inline-flex glass-2 rounded-xl p-1">
        <button
          onClick={() => setMode('cafe')}
          className={clsx('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition', mode === 'cafe' ? 'bg-brand text-white' : 'text-ink-soft')}
        >
          <Coffee size={14} /> <span className="hidden sm:inline">Café</span>
        </button>
        <button
          onClick={() => setMode('event')}
          className={clsx('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition', mode === 'event' ? 'bg-brand-accent text-white' : 'text-ink-soft')}
        >
          <PartyPopper size={14} /> <span className="hidden sm:inline">Events</span>
        </button>
      </div>

      {/* Search */}
      <button
        onClick={onOpenSearch}
        className="ml-auto flex items-center gap-2 rounded-xl glass-2 px-3 py-2 text-sm text-ink-faint transition hover:text-ink md:min-w-[240px]"
      >
        <Search size={16} />
        <span className="hidden md:inline">Search…</span>
        <kbd className="ml-auto hidden rounded-md border border-glass-border/50 px-1.5 py-0.5 text-[10px] md:block">⌘K</kbd>
      </button>

      <div className="hidden sm:block">
        <QuickAdd variant="inline" />
      </div>

      <NotifBell count={unread} />

      <button onClick={toggleTheme} className="btn btn-ghost !p-2 rounded-xl" aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <ProfileMenu
        users={data.users}
        user={user}
        onSelect={(id) => setCurrentUserId(id)}
        goSettings={() => router.push('/settings')}
      />
    </header>
  );
}

function NotifBell({ count }: { count: number }) {
  const { data, mutate } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn btn-ghost relative !p-2 rounded-xl" aria-label="Notifications">
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-bad px-1 text-[9px] font-bold text-white">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="glass absolute right-0 top-12 z-40 w-80 rounded-glass p-2 animate-scale-in">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-semibold">Notifications</span>
            <button
              onClick={() => mutate((d) => d.notifications.forEach((n) => (n.read = true)))}
              className="text-xs text-brand hover:underline"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto scroll-thin">
            {data.notifications.slice(0, 8).map((n) => (
              <div
                key={n.id}
                onClick={() => mutate((d) => { const x = d.notifications.find((z) => z.id === n.id); if (x) x.read = true; })}
                className={clsx('flex cursor-pointer gap-2.5 rounded-xl px-2.5 py-2 transition hover:bg-ink/5', !n.read && 'bg-brand/8')}
              >
                <span className="text-lg">{NOTIF_ICON[n.type] ?? '🔔'}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-ink-faint">{n.message}</div>
                  <div className="mt-0.5 text-[10px] text-ink-faint">{relTime(n.time)}</div>
                </div>
                {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />}
              </div>
            ))}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="mt-1 block rounded-xl px-2.5 py-2 text-center text-sm font-medium text-brand hover:bg-brand/10">
            View all
          </Link>
        </div>
      )}
    </div>
  );
}

function ProfileMenu({
  users, user, onSelect, goSettings,
}: {
  users: ReturnType<typeof useStore>['data']['users'];
  user: ReturnType<typeof useStore>['data']['users'][number];
  onSelect: (id: string) => void;
  goSettings: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl glass-2 px-2 py-1.5 transition hover:brightness-105">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-accent text-sm">{user.avatar}</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-xs font-semibold">{user.name.split(' ')[0]}</span>
          <span className="block text-[10px] text-ink-faint">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown size={14} className="text-ink-faint" />
      </button>
      {open && (
        <div className="glass absolute right-0 top-12 z-40 w-64 rounded-glass p-2 animate-scale-in">
          <div className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            Switch role (demo)
          </div>
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => { onSelect(u.id); setOpen(false); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition hover:bg-ink/5"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg glass-2">{u.avatar}</span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate font-medium">{u.name}</span>
                <span className="block text-xs text-ink-faint">{ROLE_LABELS[u.role]}</span>
              </span>
              {u.id === user.id && <Check size={16} className="text-brand" />}
            </button>
          ))}
          <div className="my-1 h-px bg-glass-border/40" />
          <button onClick={() => { goSettings(); setOpen(false); }} className="w-full rounded-xl px-2.5 py-2 text-left text-sm text-ink-soft hover:bg-ink/5">
            Settings
          </button>
        </div>
      )}
    </div>
  );
}

function useOutside(ref: React.RefObject<HTMLElement>, cb: () => void) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  });
}
