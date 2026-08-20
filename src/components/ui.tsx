'use client';

import { ReactNode, useEffect } from 'react';

/** A pulsing live indicator dot. */
export function LiveDot({ color = 'bg-status-success' }: { color?: string }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span
        className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60 animate-pulseDot`}
      />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

export function StatCard({
  label,
  value,
  accent = 'text-brand-navy',
  hint,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="card p-5 transition-shadow hover:shadow-cardHover">
      <div className="text-xs font-semibold uppercase tracking-wide text-brand-grayText">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-extrabold ${accent}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-brand-grayText">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon = '📭',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="text-4xl">{icon}</div>
      <div className="text-lg font-bold text-brand-navy">{title}</div>
      {description && (
        <div className="max-w-md text-sm text-brand-grayText">{description}</div>
      )}
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-brand-ink/40 p-4">
      <div className="card w-full max-w-lg animate-fadeIn p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-navy">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-brand-grayText hover:bg-brand-gray"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-brand-grayText">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-royal border-t-transparent" />
      {label}
    </div>
  );
}
