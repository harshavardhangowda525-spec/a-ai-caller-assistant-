import { NextRequest, NextResponse } from 'next/server';
import { requireUser, audit } from '@/server/apiAuth';
import { getAdminClient } from '@/lib/supabase/admin';
import { normalizeIndianPhone } from '@/lib/phone';

/**
 * Add a number to the permanent suppression / do-not-call list. A DB trigger
 * simultaneously flips any matching lead to do_not_call, so it can never be
 * dialled again.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const { phone, reason } = (await req.json()) as { phone?: string; reason?: string };
  const e164 = phone ? normalizeIndianPhone(phone) : null;
  if (!e164) {
    return NextResponse.json({ error: 'A valid Indian number is required.' }, { status: 400 });
  }

  const db = getAdminClient();
  const { error } = await db.from('suppression_list').upsert(
    { phone_number: e164, reason: reason ?? 'do_not_call', source: 'manual' },
    { onConflict: 'phone_number', ignoreDuplicates: true },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(user.id, 'suppression.add', 'suppression', e164);
  return NextResponse.json({ ok: true, phone: e164 });
}
