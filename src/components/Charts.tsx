'use client';

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { inr } from '@/lib/money';

export const CHART_COLORS = ['#4f7cff', '#8b6cff', '#22c3a6', '#f6b73c', '#ff6b8b', '#38bdf8', '#c084fc'];

const axisStyle = { fontSize: 11, fill: 'currentColor', opacity: 0.6 };

function GlassTooltip({ active, payload, label, money }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs shadow-glass">
      {label && <div className="mb-1 font-semibold">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="capitalize text-ink-soft">{p.name}:</span>
          <span className="font-semibold">{money ? inr(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueArea({ data }: { data: { day: string; cafe: number; events: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gCafe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.5} />
            <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gEvent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS[1]} stopOpacity={0.5} />
            <stop offset="100%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
        <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => inr(v, { compact: true })} width={60} />
        <Tooltip content={<GlassTooltip money />} />
        <Area type="monotone" dataKey="cafe" name="Café" stroke={CHART_COLORS[0]} strokeWidth={2.5} fill="url(#gCafe)" animationDuration={800} />
        <Area type="monotone" dataKey="events" name="Events" stroke={CHART_COLORS[1]} strokeWidth={2.5} fill="url(#gEvent)" animationDuration={800} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarSeries({ data, dataKey = 'value', money = true, color = CHART_COLORS[0], height = 260 }: { data: any[]; dataKey?: string; money?: boolean; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
        <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => (money ? inr(v, { compact: true }) : v)} width={money ? 60 : 32} />
        <Tooltip content={<GlassTooltip money={money} />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
        <Bar dataKey={dataKey} radius={[8, 8, 0, 0]} animationDuration={800}>
          {data.map((_, i) => (
            <Cell key={i} fill={color === 'multi' ? CHART_COLORS[i % CHART_COLORS.length] : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 260 }: { data: { name: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3} animationDuration={800}>
          {data.map((_, i) => (
            <Cell key={i} stroke="none" fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<GlassTooltip money />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(v) => <span className="text-xs text-ink-soft">{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function LineSeries({ data }: { data: { month: string; revenue: number; profit: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
        <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => inr(v, { compact: true })} width={60} />
        <Tooltip content={<GlassTooltip money />} />
        <Legend iconType="circle" formatter={(v) => <span className="text-xs capitalize text-ink-soft">{v}</span>} />
        <Line type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={false} animationDuration={800} />
        <Line type="monotone" dataKey="profit" stroke={CHART_COLORS[2]} strokeWidth={2.5} dot={false} animationDuration={800} />
      </LineChart>
    </ResponsiveContainer>
  );
}
