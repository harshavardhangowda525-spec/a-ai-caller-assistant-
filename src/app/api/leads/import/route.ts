import { NextRequest, NextResponse } from 'next/server';
import { parseLeadsCsv } from '@/lib/csv';
import { requireUser, audit } from '@/server/apiAuth';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * Import the valid rows from a CSV. Re-validates server-side (never trusts the
 * client preview), re-checks duplicates/suppression at write time, and attaches
 * the imported leads to the target campaign.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const { csv, campaignId, confirmed } = (await req.json()) as {
    csv?: string;
    campaignId?: string;
    confirmed?: boolean;
  };
  if (!csv) return NextResponse.json({ error: 'csv required' }, { status: 400 });
  if (!confirmed) {
    return NextResponse.json(
      { error: 'You must confirm the contacts are permitted to be called.' },
      { status: 400 },
    );
  }

  const db = getAdminClient();
  const [{ data: leads }, { data: supp }] = await Promise.all([
    db.from('leads').select('phone_number'),
    db.from('suppression_list').select('phone_number'),
  ]);

  const summary = parseLeadsCsv(csv, {
    existingNumbers: new Set((leads ?? []).map((l: { phone_number: string }) => l.phone_number)),
    suppressedNumbers: new Set((supp ?? []).map((s: { phone_number: string }) => s.phone_number)),
  });

  const validRows = summary.rows.filter((r) => r.category === 'valid' && r.normalized);
  if (validRows.length === 0) {
    return NextResponse.json({ imported: 0, ...summary.counts });
  }

  const rows = validRows.map((r) => r.normalized!);
  // Insert leads; unique(phone_number) is the final duplicate guard.
  const { data: inserted, error } = await db
    .from('leads')
    .upsert(rows, { onConflict: 'phone_number', ignoreDuplicates: true })
    .select('id');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Attach to campaign if provided.
  if (campaignId && inserted && inserted.length > 0) {
    await db.from('campaign_leads').upsert(
      inserted.map((l: { id: string }) => ({ campaign_id: campaignId, lead_id: l.id })),
      { onConflict: 'campaign_id,lead_id', ignoreDuplicates: true },
    );
  }

  await audit(user.id, 'leads.import', 'campaign', campaignId, {
    imported: inserted?.length ?? 0,
    ...summary.counts,
  });

  return NextResponse.json({
    imported: inserted?.length ?? 0,
    ...summary.counts,
  });
}
