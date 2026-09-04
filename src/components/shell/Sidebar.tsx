'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { NAV, NAV_GROUPS } from '@/lib/nav';
import { canAccess, useStore } from '@/lib/store';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data, role } = useStore();
  const unread = data.notifications.filter((n) => !n.read).length;

  return (
    <aside className="flex h-full w-[248px] flex-col gap-3 p-3">
      <Glass className="flex items-center gap-2.5 rounded-glass px-4 py-3.5">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-accent text-lg shadow-glow">
          {data.settings.logo}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold leading-tight">{data.settings.businessName}</div>
          <div className="text-[11px] text-ink-faint">Café &amp; Event OS</div>
        </div>
      </Glass>

      <nav className="glass flex-1 overflow-y-auto scroll-thin rounded-glass p-2.5">
        {NAV_GROUPS.map((group) => {
          const items = NAV.filter((n) => n.group === group && canAccess(role, n.key));
          if (!items.length) return null;
          return (
            <div key={group} className="mb-3">
              <div className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                {group}
              </div>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={onNavigate}
                      title={item.label}
                      className={clsx(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                        active
                          ? 'bg-gradient-to-r from-brand/20 to-brand-accent/10 text-brand shadow-glass-sm'
                          : 'text-ink-soft hover:bg-ink/6 hover:text-ink',
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand" />
                      )}
                      <Icon size={18} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {item.key === 'notifications' && unread > 0 && (
                        <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// Local glass helper to avoid a circular import with ui.tsx.
function Glass({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('glass', className)}>{children}</div>;
}
