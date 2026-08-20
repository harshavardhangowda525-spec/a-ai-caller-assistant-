import { NextRequest, NextResponse } from 'next/server';
import { parseLeadsCsv } from '@/lib/csv';
import { requireUser } from '@/server/apiAuth';
import { getAdminClient } from '@/lib/supabase/admin';

/** Parse CSV text and return a categorized preview (no writes). */
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const { csv } = (await req.json()) as { csv?: string };
  if (!csv) return NextResponse.json({ error: 'csv required' }, { status: 400 });

  const db = getAdminClient();
  const [{ data: leads }, { data: supp }] = await Promise.all([
    db.from('leads').select('phone_number'),
    db.from('suppression_list').select('phone_number'),
  ]);

  const summary = parseLeadsCsv(csv, {
    existingNumbers: new Set((leads ?? []).map((l: { phone_number: string }) => l.phone_number)),
    suppressedNumbers: new Set((supp ?? []).map((s: { phone_number: string }) => s.phone_number)),
  });

  return NextResponse.json(summary);
}
