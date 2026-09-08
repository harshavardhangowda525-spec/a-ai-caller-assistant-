import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { config, supabaseConfigured } from '../config';

/** Server-side Supabase client bound to the request cookies.
 *  Returns null when Supabase isn't configured so callers fall back to seed. */
export function getServerSupabase() {
  if (!supabaseConfigured) return null;
  const cookieStore = cookies();
  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(all: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          all.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore.
        }
      },
    },
  });
}
