/** Central runtime config. Everything is optional so the app builds and
 *  renders (from seed data) even with no environment configured. */

export const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
  // bcrypt/plain fallback for demo; production should set ADMIN_PASSWORD.
  adminPassword: process.env.ADMIN_PASSWORD ?? 'tribalbrew',
  authSecret: process.env.AUTH_SECRET ?? 'dev-only-insecure-secret-change-me',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tribalbrew.coffee',
  taxRatePct: Number(process.env.NEXT_PUBLIC_TAX_RATE ?? '5'),
};

export const supabaseConfigured = Boolean(
  config.supabaseUrl && config.supabaseAnonKey,
);

export const supabaseAdminConfigured = Boolean(
  config.supabaseUrl && config.supabaseServiceKey,
);
