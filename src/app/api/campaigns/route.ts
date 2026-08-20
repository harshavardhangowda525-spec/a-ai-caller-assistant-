import { NextRequest, NextResponse } from 'next/server';
import { requireUser, audit } from '@/server/apiAuth';
import { getAdminClient } from '@/lib/supabase/admin';

/** Create a campaign. */
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = (await req.json()) as {
    name?: string;
    delaySeconds?: number;
    maxRetries?: number;
  };
  if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const db = getAdminClient();
  const { data, error } = await db
    .from('campaigns')
    .insert({
      name: body.name,
      status: 'draft',
      delay_between_calls_seconds: body.delaySeconds ?? 30,
      max_retries: body.maxRetries ?? 3,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(user.id, 'campaign.create', 'campaign', data.id);
  return NextResponse.json({ id: data.id });
}
