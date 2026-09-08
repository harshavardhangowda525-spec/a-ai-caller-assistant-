import 'server-only';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

/** Returns the authenticated admin or null. Use at the top of admin APIs. */
export async function requireAdmin() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
}

export function notConfigured() {
  return new Response(
    JSON.stringify({
      error:
        'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to persist changes.',
      demo: true,
    }),
    { status: 503, headers: { 'content-type': 'application/json' } },
  );
}
