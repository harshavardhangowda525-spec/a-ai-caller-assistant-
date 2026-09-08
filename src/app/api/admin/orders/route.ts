import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, unauthorized, notConfigured } from '@/server/adminGuard';
import { createOrder } from '@/server/repo';

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  if (!body.reference) {
    body.reference = 'TB-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  }
  const r = await createOrder(body);
  if (r.demo) return notConfigured();
  return r.ok ? NextResponse.json({ ok: true, data: r.data }) : NextResponse.json({ error: r.error }, { status: 400 });
}
