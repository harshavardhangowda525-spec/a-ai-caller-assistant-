import 'server-only';

/**
 * Service-role Supabase client. SERVER-ONLY. Bypasses RLS — used by the queue
 * worker, webhook ingestion, and CSV import. The `server-only` import guard
 * makes the build fail if this is ever pulled into a client bundle.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from '@/lib/config';

let cached: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (cached) return cached;
  const cfg = getConfig();
  if (!cfg.supabase.url || !cfg.supabase.serviceRoleKey) {
    throw new Error(
      'Supabase admin client is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).',
    );
  }
  cached = createClient(cfg.supabase.url, cfg.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
