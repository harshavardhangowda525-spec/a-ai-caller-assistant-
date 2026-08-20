/**
 * Setup screen shown when Supabase / provider credentials are not yet
 * connected. Explains exactly which env vars are missing — no mockups, an
 * honest "connect these to go live" gate.
 */

export function SetupScreen() {
  const vars = [
    ['SUPABASE_URL', 'Your Supabase project URL'],
    ['SUPABASE_ANON_KEY', 'Anon (public) key for browser auth'],
    ['SUPABASE_SERVICE_ROLE_KEY', 'Service-role key (server-only)'],
    ['NEXT_PUBLIC_SUPABASE_URL', 'Same project URL, exposed to the browser'],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Same anon key, exposed to the browser'],
  ];
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-royal text-xl font-black text-white">
          ∞
        </div>
        <div>
          <div className="text-xl font-extrabold text-brand-navy">Infinity AI Caller</div>
          <div className="text-sm text-brand-grayText">Finish connecting your backend</div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-bold text-brand-navy">Database not connected</h2>
        <p className="mt-1 text-sm text-brand-grayText">
          The application is installed but Supabase is not configured. Add these
          environment variables to <code className="rounded bg-brand-gray px-1">.env.local</code>{' '}
          (see <code className="rounded bg-brand-gray px-1">.env.example</code>), run the
          migrations in <code className="rounded bg-brand-gray px-1">supabase/migrations</code>,
          then restart.
        </p>
        <div className="mt-4 space-y-2">
          {vars.map(([k, d]) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-lg border border-brand-grayMid bg-brand-gray/40 px-3 py-2"
            >
              <code className="text-sm font-semibold text-brand-navy">{k}</code>
              <span className="text-xs text-brand-grayText">{d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card border-status-warn/40 bg-status-warn/5 p-5 text-sm text-brand-navy">
        <b>Compliance:</b> phone calling is disabled until a telephony provider,
        a legally verified caller ID, and a compliant Indian telephony
        configuration are connected. See the README for full setup steps.
      </div>
    </div>
  );
}
