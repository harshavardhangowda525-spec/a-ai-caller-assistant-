import { StatCard } from '@/components/ui';
import { CallsPerDayChart, DonutChart, ChartLegend, CHART_COLORS } from '@/components/Charts';
import { ComplianceBanner } from '@/components/ComplianceBanner';
import { callsPerDay, getDashboardStats } from '@/server/queries';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [stats, perDay] = await Promise.all([getDashboardStats(), callsPerDay(7)]);

  const completed = stats.callsCompleted || 0;
  const completionRate =
    stats.totalLeads > 0 ? Math.round((completed / stats.totalLeads) * 100) : 0;
  const transferRate =
    completed > 0 ? Math.round((stats.transferred / completed) * 100) : 0;

  const interestSplit = [
    { name: 'Interested', value: stats.interested },
    { name: 'Not Interested', value: stats.notInterested },
  ];
  const completionSplit = [
    { name: 'Completed', value: completed },
    { name: 'Remaining', value: Math.max(0, stats.totalLeads - completed) },
  ];

  return (
    <div className="space-y-6">
      <ComplianceBanner />

      <div>
        <h2 className="text-xl font-extrabold text-brand-navy">Dashboard</h2>
        <p className="text-sm text-brand-grayText">Campaign performance at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
        <StatCard label="Total Leads" value={stats.totalLeads} />
        <StatCard label="Eligible Leads" value={stats.eligibleLeads} accent="text-brand-royal" />
        <StatCard label="Calls Completed" value={stats.callsCompleted} />
        <StatCard
          label="Currently Calling"
          value={stats.currentlyCalling}
          accent="text-status-info"
        />
        <StatCard label="Interested" value={stats.interested} accent="text-status-success" />
        <StatCard
          label="Not Interested"
          value={stats.notInterested}
          accent="text-status-danger"
        />
        <StatCard label="Callbacks" value={stats.callbacks} accent="text-status-warn" />
        <StatCard label="Transferred" value={stats.transferred} accent="text-brand-royal" />
        <StatCard label="Failed Calls" value={stats.failed} accent="text-status-danger" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-brand-navy">Calls per day (last 7 days)</h3>
          <div className="mt-3">
            <CallsPerDayChart data={perDay} />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-brand-navy">Interested vs Not Interested</h3>
          <DonutChart data={interestSplit} />
          <ChartLegend
            items={interestSplit.map((d, i) => ({ ...d, color: CHART_COLORS[i]! }))}
          />
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-brand-navy">Call completion rate</h3>
          <div className="mt-6 flex items-end gap-4">
            <div className="text-5xl font-extrabold text-brand-royal">{completionRate}%</div>
            <div className="pb-2 text-sm text-brand-grayText">
              {completed} of {stats.totalLeads} leads processed
            </div>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-brand-grayMid">
            <div
              className="h-full rounded-full bg-brand-royal transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-brand-navy">Transfer rate</h3>
          <div className="mt-6 flex items-end gap-4">
            <div className="text-5xl font-extrabold text-status-success">{transferRate}%</div>
            <div className="pb-2 text-sm text-brand-grayText">
              {stats.transferred} transfers of {completed} completed calls
            </div>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-brand-grayMid">
            <div
              className="h-full rounded-full bg-status-success transition-all"
              style={{ width: `${transferRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
