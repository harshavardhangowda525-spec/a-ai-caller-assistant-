import type { ReactNode } from 'react';

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-semibold text-cream-100 sm:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-cream-200/60">{sub}</p>}
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass grain glass-refract rounded-2xl p-5 ${className}`}>{children}</div>;
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Panel>
      <div className="text-xs tracking-wide text-cream-200/60">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold text-copper-300">{value}</div>
      {hint && <div className="mt-1 text-xs text-cream-200/50">{hint}</div>}
    </Panel>
  );
}

export const inputClass =
  'w-full rounded-lg border border-cream-100/15 bg-espresso-950/40 px-3 py-2 text-sm text-cream-100 outline-none focus:border-copper-400/60';

export const labelClass = 'block text-xs text-cream-200/70 mb-1';
