'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './Toast';

export function TopNav({
  title,
  email,
  providerLabel,
}: {
  title: string;
  email?: string;
  providerLabel?: string;
}) {
  const router = useRouter();
  const toast = useToast();

  async function signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      toast.push('Sign out failed', 'error');
    }
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-brand-grayMid bg-white/80 px-6 py-3.5 backdrop-blur">
      <h1 className="pl-10 text-lg font-extrabold text-brand-navy lg:pl-0">{title}</h1>
      <div className="flex items-center gap-4">
        {providerLabel && (
          <span className="hidden rounded-full bg-brand-gray px-3 py-1 text-xs font-semibold text-brand-grayText sm:inline">
            {providerLabel}
          </span>
        )}
        <div className="hidden text-right sm:block">
          <div className="text-xs font-semibold text-brand-navy">{email ?? 'Admin'}</div>
          <div className="text-[11px] text-brand-grayText">Administrator</div>
        </div>
        <button onClick={signOut} className="btn-ghost text-xs">
          Sign out
        </button>
      </div>
    </header>
  );
}
