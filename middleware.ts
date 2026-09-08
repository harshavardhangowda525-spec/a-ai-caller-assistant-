import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

/** Guards the admin dashboard. Unauthenticated requests to /admin/* are
 *  redirected to the admin login (the login page itself is exempt). */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();

    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
