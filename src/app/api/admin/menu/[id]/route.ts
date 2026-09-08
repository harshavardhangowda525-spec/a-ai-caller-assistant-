import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, unauthorized, notConfigured } from '@/server/adminGuard';
import { upsertMenuItem, deleteMenuItem } from '@/server/repo';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const r = await upsertMenuItem({ ...body, id: params.id });
  if (r.demo) return notConfigured();
  return r.ok ? NextResponse.json({ ok: true, data: r.data }) : NextResponse.json({ error: r.error }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return unauthorized();
  const r = await deleteMenuItem(params.id);
  if (r.demo) return notConfigured();
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
}
