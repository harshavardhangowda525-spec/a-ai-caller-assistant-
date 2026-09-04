'use client';

import type { Customer, LineItem, Settings } from '@/lib/types';
import { computeTotals, inr } from '@/lib/money';
import { fmtDate } from '@/lib/format';

export interface DocProps {
  settings: Settings;
  kind: 'invoice' | 'quotation' | 'receipt';
  number: string;
  date: string;
  dueDate?: string;
  validUntil?: string;
  title?: string;
  customer?: Customer | null;
  eventInfo?: { name: string; date: string; venue: string; guests?: number } | null;
  items: LineItem[];
  discountPct: number;
  taxRate: number;
  advancePaid?: number;
  terms?: string;
}

// A clean, print-ready document — deliberately NOT glassy so it prints and
// exports to PDF cleanly and stays highly readable.
export function InvoiceDoc(props: DocProps) {
  const { settings, kind, items, discountPct, taxRate } = props;
  const totals = computeTotals(items, discountPct, taxRate, { inclusive: settings.taxInclusive });
  const advance = props.advancePaid ?? 0;
  const balance = totals.total - advance;
  const heading = kind === 'quotation' ? 'QUOTATION' : kind === 'receipt' ? 'RECEIPT' : 'TAX INVOICE';

  return (
    <div className="print-sheet mx-auto max-w-[800px] rounded-xl bg-white p-8 text-[13px] text-slate-800 shadow-glass sm:p-10">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-2xl text-white">
            {settings.logo}
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{settings.businessName}</div>
            <div className="max-w-[260px] text-xs text-slate-500">{settings.address}</div>
            <div className="text-xs text-slate-500">{settings.phone} · {settings.email}</div>
            {settings.gstin && <div className="text-xs text-slate-500">GSTIN: {settings.gstin}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black tracking-tight text-slate-900">{heading}</div>
          <div className="mt-1 text-xs text-slate-500">No: <span className="font-semibold text-slate-700">{props.number}</span></div>
          <div className="text-xs text-slate-500">Date: <span className="font-semibold text-slate-700">{fmtDate(props.date)}</span></div>
          {props.dueDate && <div className="text-xs text-slate-500">Due: <span className="font-semibold text-slate-700">{fmtDate(props.dueDate)}</span></div>}
          {props.validUntil && <div className="text-xs text-slate-500">Valid till: <span className="font-semibold text-slate-700">{fmtDate(props.validUntil)}</span></div>}
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-6 py-5">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Bill To</div>
          <div className="font-semibold text-slate-900">{props.customer?.name ?? 'Walk-in Customer'}</div>
          {props.customer?.phone && <div className="text-xs text-slate-500">{props.customer.phone}</div>}
          {props.customer?.email && <div className="text-xs text-slate-500">{props.customer.email}</div>}
          {props.customer?.address && <div className="max-w-[240px] text-xs text-slate-500">{props.customer.address}</div>}
        </div>
        {props.eventInfo && (
          <div className="text-right">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Event</div>
            <div className="font-semibold text-slate-900">{props.eventInfo.name}</div>
            <div className="text-xs text-slate-500">{fmtDate(props.eventInfo.date)}</div>
            <div className="text-xs text-slate-500">{props.eventInfo.venue}</div>
            {props.eventInfo.guests ? <div className="text-xs text-slate-500">{props.eventInfo.guests} guests</div> : null}
          </div>
        )}
      </div>

      {/* Items */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <th className="rounded-l-lg p-2.5">#</th>
            <th className="p-2.5">Description</th>
            <th className="p-2.5 text-center">Qty</th>
            <th className="p-2.5 text-right">Rate</th>
            <th className="rounded-r-lg p-2.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id} className="border-b border-slate-100">
              <td className="p-2.5 text-slate-400">{i + 1}</td>
              <td className="p-2.5 font-medium text-slate-800">{it.name}</td>
              <td className="p-2.5 text-center">{it.qty}</td>
              <td className="p-2.5 text-right">{inr(it.price)}</td>
              <td className="p-2.5 text-right font-medium">{inr(it.qty * it.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-[300px] space-y-1.5 text-sm">
          <Row label="Subtotal" value={inr(totals.gross)} />
          {totals.discount > 0 && <Row label={`Discount (${discountPct}%)`} value={`- ${inr(totals.discount)}`} />}
          <Row label="Taxable value" value={inr(totals.taxable)} />
          <Row label={`CGST (${taxRate / 2}%)`} value={inr(totals.cgst)} />
          <Row label={`SGST (${taxRate / 2}%)`} value={inr(totals.sgst)} />
          <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-base font-bold text-slate-900">
            <span>Total</span><span>{inr(totals.total)}</span>
          </div>
          {advance > 0 && (
            <>
              <Row label="Advance Paid" value={`- ${inr(advance)}`} />
              <div className="flex justify-between rounded-lg bg-blue-50 px-2 py-1.5 text-base font-bold text-blue-700">
                <span>Balance Due</span><span>{inr(balance)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Terms + footer */}
      {props.terms && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Terms &amp; Conditions</div>
          <p className="whitespace-pre-line text-xs text-slate-500">{props.terms}</p>
        </div>
      )}
      <div className="mt-6 flex items-end justify-between">
        <p className="text-xs text-slate-400">{settings.invoiceFooter}</p>
        <div className="text-center">
          <div className="mb-1 h-10 w-32 border-b border-slate-300" />
          <div className="text-[10px] text-slate-400">Authorised Signature</div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
