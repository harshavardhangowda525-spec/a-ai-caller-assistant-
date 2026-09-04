'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Glass, Trend } from './ui';

// Animated number that counts up when mounted.
export function AnimatedNumber({
  value,
  format,
  duration = 900,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>();
  const start = useRef<number>();

  useEffect(() => {
    cancelAnimationFrame(raf.current!);
    start.current = undefined;
    const from = 0;
    const step = (ts: number) => {
      if (start.current === undefined) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current!);
  }, [value, duration]);

  return <>{format(display)}</>;
}

export function KpiCard({
  label,
  value,
  format,
  trend,
  icon,
  accent = 'brand',
  hint,
  delay = 0,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  trend?: number;
  icon: React.ReactNode;
  accent?: 'brand' | 'good' | 'warn' | 'bad' | 'info' | 'accent';
  hint?: string;
  delay?: number;
}) {
  const accents: Record<string, string> = {
    brand: 'from-brand/25 to-brand/5 text-brand',
    accent: 'from-brand-accent/25 to-brand-accent/5 text-brand-accent',
    good: 'from-good/25 to-good/5 text-good',
    warn: 'from-warn/25 to-warn/5 text-warn',
    bad: 'from-bad/25 to-bad/5 text-bad',
    info: 'from-info/25 to-info/5 text-info',
  };
  return (
    <Glass hover className="p-4 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className={clsx('grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br', accents[accent])}>
          {icon}
        </div>
        {trend !== undefined && <Trend value={trend} />}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">
        <AnimatedNumber value={value} format={format} />
      </div>
      <div className="mt-0.5 text-xs font-medium text-ink-faint">{label}</div>
      {hint && <div className="mt-1 text-[11px] text-ink-faint">{hint}</div>}
    </Glass>
  );
}
