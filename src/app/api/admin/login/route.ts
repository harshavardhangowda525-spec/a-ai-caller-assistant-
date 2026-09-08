import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkCredentials, createSession, SESSION_COOKIE } from '@/lib/auth';

const schema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const { username, password } = parsed.data;
  if (!checkCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const token = await createSession(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return res;
}
