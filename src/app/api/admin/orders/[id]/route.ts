import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, unauthorized, notConfigured } from '@/server/adminGuard';
import { updateOrderStatus } from '@/server/repo';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const r = await updateOrderStatus(params.id, body.status);
  if (r.demo) return notConfigured();
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
}
