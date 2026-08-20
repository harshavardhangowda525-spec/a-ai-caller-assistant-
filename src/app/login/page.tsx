'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        if (error) throw error;
        toast.push('Password reset email sent.', 'success');
        setMode('login');
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.push('Signed in.', 'success');
      router.push(params.get('next') ?? '/dashboard');
      router.refresh();
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-navy to-brand-navy2 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-royal text-xl font-black text-white">
            ∞
          </div>
          <div className="text-white">
            <div className="text-xl font-extrabold leading-tight">Infinity AI Caller</div>
            <div className="text-xs text-white/60">Infinity Web &amp; Apps</div>
          </div>
        </div>

        <div className="card p-7">
          <h1 className="text-lg font-bold text-brand-navy">
            {mode === 'login' ? 'Admin sign in' : 'Reset password'}
          </h1>
          <p className="mt-1 text-sm text-brand-grayText">
            {mode === 'login'
              ? 'Sign in to manage campaigns and calls.'
              : 'We will email you a reset link.'}
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@infinitywebapps.com"
              />
            </div>
            {mode === 'login' && (
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  required
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Send reset link'}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === 'login' ? 'reset' : 'login')}
            className="mt-4 text-sm font-semibold text-brand-royal hover:underline"
          >
            {mode === 'login' ? 'Forgot password?' : 'Back to sign in'}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-white/50">
          Passwords are hashed by Supabase Auth. Never stored in plaintext.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
