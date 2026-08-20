import { NextRequest, NextResponse } from 'next/server';
import { requireUser, audit } from '@/server/apiAuth';
import { getAdminClient } from '@/lib/supabase/admin';
import { CampaignStatus } from '@/domain/types';
import { validateConfiguredCallerId, getConfig } from '@/lib/config';
import { getTelephonyProvider } from '@/telephony';

const ACTION_TO_STATUS: Record<string, CampaignStatus> = {
  start: CampaignStatus.Running,
  pause: CampaignStatus.Paused,
  resume: CampaignStatus.Running,
  stop: CampaignStatus.Stopped,
};

/**
 * Campaign lifecycle control. `start` performs the pre-flight compliance
 * checks: it requires explicit confirmation and a verified caller ID (no
 * spoofing) before a live provider will place calls.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; action: string } },
) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const { id, action } = params;

  if (action === 'clear-completed') {
    const db = getAdminClient();
    await db
      .from('campaign_leads')
      .delete()
      .eq('campaign_id', id)
      .in(
        'lead_id',
        (
          (
            await db
              .from('leads')
              .select('id')
              .in('status', ['completed', 'not_interested', 'do_not_call', 'transferred'])
          ).data ?? []
        ).map((l: { id: string }) => l.id),
      );
    await audit(user.id, 'campaign.clear_completed', 'campaign', id);
    return NextResponse.json({ ok: true });
  }

  const status = ACTION_TO_STATUS[action];
  if (!status) return NextResponse.json({ error: 'unknown action' }, { status: 400 });

  // Pre-flight for going live.
  if (action === 'start') {
    const body = (await req.json().catch(() => ({}))) as { confirmed?: boolean };
    if (!body.confirmed) {
      return NextResponse.json(
        { error: 'You must confirm the contacts are permitted to receive these calls.' },
        { status: 400 },
      );
    }

    const cfg = getConfig();
    // For a live (non-mock) provider, refuse to start unless the caller ID is
    // present and provider-verified — never spoof.
    if (cfg.telephony.provider !== 'mock') {
      const callerId = validateConfiguredCallerId();
      if (!callerId.ok || !callerId.normalized) {
        return NextResponse.json(
          { error: callerId.error ?? 'OUTBOUND_CALLER_ID not configured' },
          { status: 422 },
        );
      }
      const check = await getTelephonyProvider().validateCallerId(callerId.normalized);
      if (!check.verified) {
        return NextResponse.json(
          {
            error:
              check.reason ??
              'Caller ID is not verified with the telephony provider. Register the number before calling — the app will not spoof.',
          },
          { status: 422 },
        );
      }
    }
  }

  const db = getAdminClient();
  const { error } = await db.from('campaigns').update({ status }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(user.id, `campaign.${action}`, 'campaign', id);
  return NextResponse.json({ ok: true, status });
}
