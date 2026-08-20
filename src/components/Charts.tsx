'use client';

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const BRAND = ['#1e50e5', '#1aa66b', '#e04848', '#e0a300', '#2b8de0', '#0b1e3f'];

export function CallsPerDayChart({ data }: { data: Array<{ day: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5b6b86' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#5b6b86' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(30,80,229,0.06)' }}
          contentStyle={{ borderRadius: 12, border: '1px solid #e4e9f2', fontSize: 12 }}
        />
        <Bar dataKey="count" fill="#1e50e5" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-brand-grayText">
        No data yet
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={BRAND[i % BRAND.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e9f2', fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ChartLegend({
  items,
}: {
  items: Array<{ name: string; value: number; color: string }>;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {items.map((it) => (
        <div key={it.name} className="flex items-center gap-2 text-xs text-brand-grayText">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />
          {it.name} <b className="text-brand-navy">{it.value}</b>
        </div>
      ))}
    </div>
  );
}

export const CHART_COLORS = BRAND;
