'use client';

import React, { useEffect } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useStore } from '@/lib/store';

// --- Glass card -------------------------------------------------------------
export function Glass({
  className,
  children,
  hover,
  as: Tag = 'div',
  ...rest
}: React.HTMLAttributes<HTMLElement> & { hover?: boolean; as?: React.ElementType }) {
  return (
    <Tag
      className={clsx('glass rounded-glass', hover && 'glass-hover', className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// --- Buttons ----------------------------------------------------------------
type BtnVariant = 'primary' | 'glass' | 'ghost' | 'danger';
export function Btn({
  variant = 'glass',
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button className={clsx('btn', `btn-${variant}`, className)} {...rest}>
      {children}
    </button>
  );
}

// --- Section heading --------------------------------------------------------
export function PageTitle({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6 animate-fade-up">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="grid h-11 w-11 place-items-center rounded-2xl glass-2 text-brand">{icon}</div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-ink-faint mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// --- Chip / badge -----------------------------------------------------------
const TONES: Record<string, string> = {
  good: 'text-good bg-good/12 border-good/25',
  warn: 'text-warn bg-warn/12 border-warn/25',
  bad: 'text-bad bg-bad/12 border-bad/25',
  info: 'text-info bg-info/12 border-info/25',
  brand: 'text-brand bg-brand/12 border-brand/25',
  neutral: 'text-ink-soft bg-ink/8 border-ink/12',
};
export function Chip({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return <span className={clsx('chip', TONES[tone], className)}>{children}</span>;
}

// --- Inputs -----------------------------------------------------------------
export function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx('field', props.className)} {...props} />;
}
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx('field', props.className)} {...props} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx('field', props.className)} {...props} />;
}
export function Label({ children }: { children: React.ReactNode }) {
  return <label className="lbl">{children}</label>;
}
export function FieldRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// --- Modal ------------------------------------------------------------------
export function Modal({
  open,
  onClose,
  children,
  title,
  wide,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  wide?: boolean;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-up"
        style={{ animationDuration: '.2s' }}
        onClick={onClose}
      />
      <Glass
        className={clsx(
          'relative z-10 w-full rounded-glass-lg animate-scale-in max-h-[92vh] flex flex-col',
          wide ? 'max-w-4xl' : 'max-w-lg',
        )}
      >
        {(
          <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-glass-border/40">
            <div className="text-lg font-semibold">{title}</div>
            <button onClick={onClose} className="btn btn-ghost !p-2 rounded-xl" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto scroll-thin px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-glass-border/40">
            {footer}
          </div>
        )}
      </Glass>
    </div>
  );
}

// --- Confirm dialog hook ----------------------------------------------------
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Btn>
        </>
      }
    >
      <p className="text-sm text-ink-soft">{message}</p>
    </Modal>
  );
}

// --- Empty state ------------------------------------------------------------
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-up">
      <div className="grid h-16 w-16 place-items-center rounded-3xl glass-2 text-brand mb-4 text-2xl">
        {icon ?? '✨'}
      </div>
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-sm text-ink-faint mt-1 max-w-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// --- Toaster ----------------------------------------------------------------
export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 no-print">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={clsx(
            'glass rounded-2xl px-4 py-3 text-sm font-medium shadow-glass cursor-pointer animate-scale-in flex items-center gap-2 min-w-[220px]',
            t.type === 'success' && 'text-good',
            t.type === 'error' && 'text-bad',
            t.type === 'info' && 'text-info',
          )}
        >
          <span className="text-base">
            {t.type === 'success' ? '✓' : t.type === 'error' ? '⚠' : 'ℹ'}
          </span>
          <span className="text-ink">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// --- Trend indicator --------------------------------------------------------
export function Trend({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5 text-xs font-semibold',
        up ? 'text-good' : 'text-bad',
      )}
    >
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// --- Segmented control ------------------------------------------------------
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex glass-2 rounded-xl p-1 gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition',
            value === o.value ? 'bg-brand text-white shadow-glass-sm' : 'text-ink-soft hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
