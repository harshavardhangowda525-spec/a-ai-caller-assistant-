import { getConfig, configIssues } from '@/lib/config';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import {
  callsPerDay,
  getDashboardStats,
  listCalls,
  listCampaigns,
  listLeads,
  getSettings,
} from '@/server/queries';

/**
 * Setup diagnostics. Lives OUTSIDE the (app) layout so it renders even if the
 * dashboard is failing. Shows only booleans + error messages — never secret
 * values — so it is safe to view. Visit /diagnostics to see what's wrong.
 */
export const dynamic = 'force-dynamic';

async function check(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
    return 'ok';
  } catch (err) {
    return err instanceof Error ? err.message : 'error';
  }
}

export default async function DiagnosticsPage() {
  const envPresent = {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    APP_BASE_URL: process.env.APP_BASE_URL ?? '(unset)',
    TELEPHONY_PROVIDER: process.env.TELEPHONY_PROVIDER ?? '(unset)',
    AI_PROVIDER: process.env.AI_PROVIDER ?? '(unset)',
  };

  let providerName = '(config failed)';
  try {
    providerName = getConfig().telephony.provider;
  } catch {
    /* handled below via configIssues */
  }

  // DB checks via the admin client (bypasses RLS, so it truly tests existence).
  const tableChecks: Record<string, string> = {};
  let userRowInfo = 'not checked';
  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    for (const table of ['users', 'leads', 'campaigns', 'calls', 'settings', 'suppression_list']) {
      tableChecks[table] = await check(async () => {
        const { error } = await getAdminClient().from(table).select('*', { count: 'exact', head: true });
        if (error) throw new Error(error.message);
      });
    }

    // Is the currently signed-in user registered in public.users?
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        userRowInfo = 'no signed-in session (open this page while logged in)';
      } else {
        const { data, error } = await getAdminClient()
          .from('users')
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle();
        if (error) userRowInfo = `error: ${error.message}`;
        else if (!data) userRowInfo = `MISSING — run the insert into public.users for auth id ${user.id}`;
        else userRowInfo = `ok (role: ${(data as { role: string }).role})`;
      }
    } catch (err) {
      userRowInfo = err instanceof Error ? err.message : 'error';
    }
  }

  // Run the ACTUAL dashboard queries (request client + RLS) to reproduce the
  // real crash and show its message.
  const queryChecks: Record<string, string> = {
    getDashboardStats: await check(() => getDashboardStats()),
    callsPerDay: await check(() => callsPerDay(7)),
    listLeads: await check(() => listLeads(5)),
    listCampaigns: await check(() => listCampaigns()),
    listCalls: await check(() => listCalls(5)),
    getSettings: await check(() => getSettings()),
  };

  const Row = ({ k, v }: { k: string; v: string | boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '6px 0', borderBottom: '1px solid #e4e9f2' }}>
      <code style={{ color: '#0b1e3f' }}>{k}</code>
      <code style={{ color: v === true || v === 'ok' ? '#1aa66b' : v === false ? '#e04848' : '#5b6b86' }}>
        {String(v)}
      </code>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ color: '#0b1e3f' }}>Infinity AI Caller — Diagnostics</h1>
      <p style={{ color: '#5b6b86' }}>Safe to view: shows only status, never secret values.</p>

      <h2 style={{ color: '#0b1e3f', marginTop: 24 }}>Environment variables</h2>
      {Object.entries(envPresent).map(([k, v]) => <Row key={k} k={k} v={v} />)}

      <h2 style={{ color: '#0b1e3f', marginTop: 24 }}>Config</h2>
      <Row k="telephony provider parsed as" v={providerName} />
      {configIssues.length > 0 ? (
        <div style={{ background: '#fdecec', color: '#e04848', padding: 12, borderRadius: 8, marginTop: 8 }}>
          <b>Config issues (using fallbacks):</b>
          <ul>{configIssues.map((i) => <li key={i}>{i}</li>)}</ul>
        </div>
      ) : (
        <p style={{ color: '#1aa66b' }}>No config issues.</p>
      )}

      <h2 style={{ color: '#0b1e3f', marginTop: 24 }}>Database tables (must all be “ok”)</h2>
      {Object.keys(tableChecks).length === 0
        ? <p style={{ color: '#e04848' }}>Supabase service role not configured — cannot check tables.</p>
        : Object.entries(tableChecks).map(([k, v]) => <Row key={k} k={k} v={v} />)}

      <h2 style={{ color: '#0b1e3f', marginTop: 24 }}>Admin user row</h2>
      <Row k="public.users has your account" v={userRowInfo} />

      <h2 style={{ color: '#0b1e3f', marginTop: 24 }}>Dashboard queries (must all be “ok”)</h2>
      {Object.entries(queryChecks).map(([k, v]) => <Row key={k} k={k} v={v} />)}

      <p style={{ color: '#5b6b86', marginTop: 24, fontSize: 13 }}>
        If tables show errors like “relation does not exist”, run the 3 SQL files in
        supabase/migrations. If the admin user row is MISSING, run the insert shown above.
      </p>
    </div>
  );
}
