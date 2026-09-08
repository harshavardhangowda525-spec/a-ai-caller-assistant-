import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, unauthorized, notConfigured } from '@/server/adminGuard';
import { saveContent } from '@/server/repo';

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const entries: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (typeof v === 'string') entries[k] = v;
  }
  const r = await saveContent(entries);
  if (r.demo) return notConfigured();
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
}
