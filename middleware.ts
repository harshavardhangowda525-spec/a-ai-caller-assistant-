import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Auth middleware. Protects all dashboard routes: an unauthenticated visitor is
 * redirected to /login. If Supabase env is not configured, the app is allowed
 * through so the in-app setup screen can render (rather than a redirect loop).
 */

const PUBLIC_PATHS = ['/login', '/auth', '/setup', '/diagnostics'];

export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  // Not configured yet — let requests through to the setup screen.
  if (!url || !anonKey) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options as never),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirect = req.nextUrl.clone();
    redirect.pathname = '/login';
    redirect.searchParams.set('next', pathname);
    return NextResponse.redirect(redirect);
  }

  return res;
}

export const config = {
  // Protect everything except static assets and the webhook/api ingress.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/voice|api/cron).*)'],
};
