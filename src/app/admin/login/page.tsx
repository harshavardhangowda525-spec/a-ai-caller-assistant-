'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLogin />
    </Suspense>
  );
}

function AdminLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(params.get('next') || '/admin');
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || 'Login failed');
    }
  }

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center px-5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob animate-float-slow absolute -left-24 top-20 h-80 w-80 bg-copper-500/15 blur-3xl" />
        <div className="animate-blob absolute -right-20 bottom-16 h-80 w-80 bg-coffee-500/15 blur-3xl" style={{ animationDelay: '-5s' }} />
      </div>

      <form
        onSubmit={submit}
        className="glass grain glass-refract relative z-10 w-full max-w-sm rounded-3xl p-8"
      >
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-copper-400 to-copper-600 text-base">
            ☕
          </span>
          <div>
            <div className="font-display text-sm font-semibold text-cream-100">
              TRIBAL BREW DAILY
            </div>
            <div className="text-[11px] tracking-widest text-copper-300">ADMIN</div>
          </div>
        </div>

        <h1 className="font-display text-2xl font-semibold text-cream-100">Welcome back</h1>
        <p className="mt-1 text-sm text-cream-200/60">Sign in to manage the café.</p>

        <label className="mt-6 block text-xs text-cream-200/70">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="mt-1.5 w-full rounded-xl border border-cream-100/15 bg-espresso-950/40 px-4 py-2.5 text-sm text-cream-100 outline-none focus:border-copper-400/60"
          required
        />

        <label className="mt-4 block text-xs text-cream-200/70">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-xl border border-cream-100/15 bg-espresso-950/40 px-4 py-2.5 text-sm text-cream-100 outline-none focus:border-copper-400/60"
          required
        />

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="glass-btn glass-btn-primary glass-sheen mt-6 w-full justify-center py-3 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'SIGN IN'}
        </button>

        <p className="mt-4 text-center text-[11px] text-cream-200/40">
          Default demo login: admin / tribalbrew
        </p>
      </form>
    </main>
  );
}
