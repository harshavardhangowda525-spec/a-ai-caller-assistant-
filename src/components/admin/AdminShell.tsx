'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '▚' },
  { href: '/admin/pos', label: 'Billing / POS', icon: '⌗' },
  { href: '/admin/orders', label: 'Orders', icon: '☰' },
  { href: '/admin/menu', label: 'Menu', icon: '☕' },
  { href: '/admin/events', label: 'Events', icon: '★' },
  { href: '/admin/gallery', label: 'Gallery', icon: '▦' },
  { href: '/admin/content', label: 'Website Content', icon: '✎' },
];

export default function AdminShell({
  children,
  demo,
}: {
  children: ReactNode;
  demo: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="relative min-h-[100svh]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-24 top-10 h-72 w-72 bg-copper-500/8 blur-3xl" />
        <div className="animate-blob absolute right-0 top-1/2 h-72 w-72 bg-coffee-500/8 blur-3xl" style={{ animationDelay: '-6s' }} />
      </div>

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <aside
          className={`glass-dark grain fixed inset-y-0 left-0 z-40 w-64 transform p-4 transition-transform lg:static lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-8 flex items-center gap-2 px-2 pt-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-copper-400 to-copper-600 text-base">
              ☕
            </span>
            <div>
              <div className="font-display text-sm font-semibold text-cream-100">TRIBAL BREW</div>
              <div className="text-[10px] tracking-widest text-copper-300">ADMIN CONSOLE</div>
            </div>
          </div>

          <nav className="space-y-1">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? 'border border-copper-400/40 bg-copper-500/15 text-copper-200'
                      : 'text-cream-200/70 hover:bg-cream-100/5 hover:text-cream-100'
                  }`}
                >
                  <span className="w-4 text-center opacity-70">{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="absolute inset-x-4 bottom-4 space-y-2">
            <Link
              href="/"
              className="block rounded-xl border border-cream-100/10 px-3 py-2 text-center text-xs text-cream-200/70 hover:text-cream-100"
            >
              View site ↗
            </Link>
            <button
              onClick={logout}
              className="w-full rounded-xl border border-cream-100/10 px-3 py-2 text-xs text-cream-200/70 hover:text-cream-100"
            >
              Sign out
            </button>
          </div>
        </aside>

        {open && (
          <div className="fixed inset-0 z-30 bg-espresso-950/60 lg:hidden" onClick={() => setOpen(false)} />
        )}

        {/* Main */}
        <div className="min-h-[100svh] flex-1">
          <header className="glass sticky top-0 z-20 flex items-center justify-between px-4 py-3 lg:px-8">
            <button
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-cream-100/15 lg:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="text-xs text-cream-200/60">Tribal Brew Daily · Church Street</div>
            <div className="text-xs text-copper-300">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
          </header>

          {demo && (
            <div className="mx-4 mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200 lg:mx-8">
              <strong>Demo mode.</strong> Supabase isn’t configured — you can explore the console,
              but changes won’t persist. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code>SUPABASE_SERVICE_ROLE_KEY</code> to enable saving.
            </div>
          )}

          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
