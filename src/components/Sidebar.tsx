'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/leads', label: 'Leads', icon: '👥' },
  { href: '/upload', label: 'Upload Leads', icon: '⬆️' },
  { href: '/campaigns', label: 'Campaigns', icon: '📣' },
  { href: '/live', label: 'Live Calls', icon: '📞' },
  { href: '/history', label: 'Call History', icon: '🗂️' },
  { href: '/callbacks', label: 'Callbacks', icon: '⏰' },
  { href: '/suppression', label: 'Suppression List', icon: '🚫' },
  { href: '/ai-script', label: 'AI Script', icon: '🤖' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed left-4 top-4 z-30 rounded-lg bg-brand-navy p-2 text-white lg:hidden"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-brand-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed z-40 flex h-full w-64 flex-col bg-brand-navy text-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-royal text-lg font-black">
            ∞
          </div>
          <div>
            <div className="text-sm font-extrabold leading-tight">Infinity</div>
            <div className="text-xs text-white/60">AI Caller</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-royal text-white shadow-sm'
                    : 'text-white/70 hover:bg-brand-navy2 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 text-[11px] leading-relaxed text-white/40">
          Compliant outbound calling.
          <br />
          You are responsible for lawful contact eligibility.
        </div>
      </aside>
    </>
  );
}
