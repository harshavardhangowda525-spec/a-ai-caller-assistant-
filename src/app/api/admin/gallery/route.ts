import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, unauthorized, notConfigured } from '@/server/adminGuard';
import { upsertGallery } from '@/server/repo';

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  if (!body.id) body.id = crypto.randomUUID();
  const r = await upsertGallery(body);
  if (r.demo) return notConfigured();
  return r.ok ? NextResponse.json({ ok: true, data: r.data }) : NextResponse.json({ error: r.error }, { status: 400 });
}
