import { getConfig, validateConfiguredCallerId } from '@/lib/config';
import { callsPerDay, getDashboardStats } from '@/server/queries';

/**
 * Dashboard — intentionally 100% server-rendered with no client-component or
 * charting-library dependencies. Charts are drawn with plain CSS (flas bars +
 * a conic-gradient donut) so the page can never fail during SSR.
 */
export const dynamic = 'force-dynamic';

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-brand-grayText">{label}</div>
      <div className="mt-2 text-3xl font-extrabold" style={{ color: accent ?? '#0b1e3f' }}>
        {value}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const [stats, perDay] = await Promise.all([getDashboardStats(), callsPerDay(7)]);

  const completed = stats.callsCompleted || 0;
  const completionRate = stats.totalLeads > 0 ? Math.round((completed / stats.totalLeads) * 100) : 0;
  const transferRate = completed > 0 ? Math.round((stats.transferred / completed) * 100) : 0;

  const maxDay = Math.max(1, ...perDay.map((d) => d.count));
  const interestTotal = stats.interested + stats.notInterested;
  const interestedPct = interestTotal > 0 ? Math.round((stats.interested / interestTotal) * 100) : 0;

  const cfg = getConfig();
  const callerId = validateConfiguredCallerId();

  return (
    <div className="space-y-6">
      {/* Compliance banner (inline, server-rendered) */}
      <div className="card border-status-warn/40 bg-status-warn/5 p-4">
        <div className="flex items-start gap-3 text-sm text-brand-navy">
          <span className="text-lg">⚠️</span>
          <div>
            <b>Compliance responsibility.</b> You are responsible for ensuring every uploaded
            contact is legally eligible for commercial calling and that your telephony
            configuration complies with applicable Indian telecom requirements. This system does
            not spoof caller ID or bypass spam controls.
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="badge bg-brand-grayMid text-brand-navy">
                Provider: {cfg.telephony.provider.toUpperCase()}
              </span>
              <span
                className={`badge ${callerId.ok ? 'bg-status-success/15 text-status-success' : 'bg-status-danger/15 text-status-danger'}`}
              >
                Caller ID: {callerId.ok ? 'configured' : 'not configured'}
              </span>
              {cfg.telephony.provider === 'mock' && (
                <span className="badge bg-status-warn/15 text-status-warn">
                  Live calling disabled (mock mode)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-extrabold text-brand-navy">Dashboard</h2>
        <p className="text-sm text-brand-grayText">Campaign performance at a glance.</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat label="Total Leads" value={stats.totalLeads} />
        <Stat label="Eligible Leads" value={stats.eligibleLeads} accent="#1e50e5" />
        <Stat label="Calls Completed" value={stats.callsCompleted} />
        <Stat label="Currently Calling" value={stats.currentlyCalling} accent="#2b8de0" />
        <Stat label="Interested" value={stats.interested} accent="#1aa66b" />
        <Stat label="Not Interested" value={stats.notInterested} accent="#e04848" />
        <Stat label="Callbacks" value={stats.callbacks} accent="#e0a300" />
        <Stat label="Transferred" value={stats.transferred} accent="#1e50e5" />
        <Stat label="Failed Calls" value={stats.failed} accent="#e04848" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Calls per day — CSS bars */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-brand-navy">Calls per day (last 7 days)</h3>
          <div className="mt-5 flex h-[180px] items-end justify-between gap-2">
            {perDay.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-[11px] font-semibold text-brand-navy">{d.count}</div>
                <div
                  className="w-full rounded-t-md bg-brand-royal"
                  style={{ height: `${Math.max(4, (d.count / maxDay) * 140)}px` }}
                />
                <div className="text-[10px] text-brand-grayText">{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Interested vs Not — conic-gradient donut */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-brand-navy">Interested vs Not Interested</h3>
          <div className="mt-4 flex items-center gap-6">
            <div
              className="relative h-32 w-32 rounded-full"
              style={{
                background:
                  interestTotal > 0
                    ? `conic-gradient(#1aa66b 0% ${interestedPct}%, #e04848 ${interestedPct}% 100%)`
                    : '#e4e9f2',
              }}
            >
              <div className="absolute inset-4 flex items-center justify-center rounded-full bg-white text-sm font-bold text-brand-navy">
                {interestTotal > 0 ? `${interestedPct}%` : '—'}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-status-success" /> Interested
                <b className="text-brand-navy">{stats.interested}</b>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-status-danger" /> Not Interested
                <b className="text-brand-navy">{stats.notInterested}</b>
              </div>
            </div>
          </div>
        </div>

        {/* Completion rate */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-brand-navy">Call completion rate</h3>
          <div className="mt-6 flex items-end gap-4">
            <div className="text-5xl font-extrabold text-brand-royal">{completionRate}%</div>
            <div className="pb-2 text-sm text-brand-grayText">
              {completed} of {stats.totalLeads} leads processed
            </div>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-brand-grayMid">
            <div className="h-full rounded-full bg-brand-royal" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        {/* Transfer rate */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-brand-navy">Transfer rate</h3>
          <div className="mt-6 flex items-end gap-4">
            <div className="text-5xl font-extrabold text-status-success">{transferRate}%</div>
            <div className="pb-2 text-sm text-brand-grayText">
              {stats.transferred} transfers of {completed} completed calls
            </div>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-brand-grayMid">
            <div className="h-full rounded-full bg-status-success" style={{ width: `${transferRate}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
