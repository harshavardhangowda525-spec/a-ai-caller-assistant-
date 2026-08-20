'use client';

/**
 * Client-only wrappers for the Recharts charts. Recharts measures the DOM and
 * does not server-render reliably in the Next.js App Router, so we load the
 * actual chart components with `ssr: false`. This keeps Recharts entirely out
 * of the server render and prevents the dashboard from throwing during SSR.
 */

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

export const CHART_COLORS = ['#1e50e5', '#1aa66b', '#e04848', '#e0a300', '#2b8de0', '#0b1e3f'];

function ChartSkeleton() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-brand-grayText">
      Loading chart…
    </div>
  );
}

export const CallsPerDayChart = dynamic(
  () => import('./Charts').then((m) => m.CallsPerDayChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export const DonutChart = dynamic(
  () => import('./Charts').then((m) => m.DonutChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export function ChartLegend({
  items,
}: {
  items: Array<{ name: string; value: number; color: string }>;
}): ReactNode {
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
