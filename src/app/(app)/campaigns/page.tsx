import { EmptyState } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { getCampaignPreflight, listCampaigns } from '@/server/queries';
import { CampaignControls } from './CampaignControls';
import { CreateCampaign } from './CreateCampaign';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();
  const preflights = await Promise.all(
    campaigns.map((c) => getCampaignPreflight(c.id)),
  );
  const byId = new Map(preflights.map((p) => [p.campaignId, p]));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-brand-navy">Campaigns</h2>
          <p className="text-sm text-brand-grayText">
            Sequential calling — one call at a time, with a configurable delay.
          </p>
        </div>
        <CreateCampaign />
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon="📣"
          title="No campaigns yet"
          description="Create a campaign, attach leads on the Upload page, then start calling."
        />
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const pf = byId.get(c.id)!;
            return (
              <div key={c.id} className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-brand-navy">{c.name}</h3>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="mt-1 text-xs text-brand-grayText">
                      Delay {c.delay_between_calls_seconds}s · Max {c.max_retries} attempts
                    </p>
                  </div>
                  <CampaignControls
                    campaignId={c.id}
                    status={c.status}
                    preflight={pf}
                    campaignName={c.name}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Mini label="Total" value={pf.total} />
                  <Mini label="Eligible" value={pf.eligible} tone="text-brand-royal" />
                  <Mini label="Suppressed" value={pf.suppressed} />
                  <Mini label="Invalid" value={pf.invalid} tone="text-status-danger" />
                  <Mini label="No consent" value={pf.noConsent} tone="text-status-danger" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, tone = 'text-brand-navy' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border border-brand-grayMid bg-brand-gray/40 p-3">
      <div className="text-[11px] font-semibold uppercase text-brand-grayText">{label}</div>
      <div className={`text-xl font-extrabold ${tone}`}>{value}</div>
    </div>
  );
}
