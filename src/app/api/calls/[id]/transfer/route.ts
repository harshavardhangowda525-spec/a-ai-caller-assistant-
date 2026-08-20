import { NextRequest, NextResponse } from 'next/server';
import { requireUser, audit } from '@/server/apiAuth';
import { CallService } from '@/server/callService';

/**
 * Initiate a transfer to the owner for a live call. `callerAgreed` MUST be true
 * — the transfer coordinator refuses without explicit caller agreement. In
 * production this is invoked by the AI flow when the caller says yes; it is also
 * exposed here for supervised/manual transfer from the Live Calls page.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = (await req.json().catch(() => ({}))) as { callerAgreed?: boolean };
  const result = await new CallService().requestTransfer(
    params.id,
    Boolean(body.callerAgreed),
  );

  await audit(user.id, 'call.transfer_request', 'call', params.id, {
    ok: result.ok,
    reason: result.reason,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
