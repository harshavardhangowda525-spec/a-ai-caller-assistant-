import { createClient } from '@supabase/supabase-js';
import { config, supabaseAdminConfigured } from '../config';

/** Service-role Supabase client for privileged admin/POS writes.
 *  Never import this into client components. */
export function getAdminSupabase() {
  if (!supabaseAdminConfigured) return null;
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
