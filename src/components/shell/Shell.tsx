'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { QuickAdd } from './QuickAdd';
import { Toaster } from '@/components/ui';
import { useStore } from '@/lib/store';

export function Shell({ children }: { children: React.ReactNode }) {
  const { ready } = useStore();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 animate-scale-in">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-3 z-10 btn btn-ghost !p-2 rounded-xl" aria-label="Close">
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-[248px]">
        <div className="mx-auto max-w-[1500px] px-3 pb-24 pt-3 sm:px-5 lg:pb-8">
          <TopBar onOpenSearch={() => setPalette(true)} onOpenMenu={() => setDrawer(true)} />
          <main className={clsx('mt-4', !ready && 'opacity-60')}>{children}</main>
        </div>
      </div>

      <div className="sm:hidden">
        <QuickAdd variant="fab" />
      </div>
      <MobileNav onMore={() => setDrawer(true)} />
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <Toaster />
    </div>
  );
}
