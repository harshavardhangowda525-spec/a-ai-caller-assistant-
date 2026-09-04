import type { LineItem } from './types';

// ---------------------------------------------------------------------------
// Money + configurable GST/tax engine. Tax rates are never hardcoded — the
// caller passes the rate (from Settings). Supports inclusive/exclusive pricing
// and CGST/SGST/IGST breakdown.
// ---------------------------------------------------------------------------

export function inr(n: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact && Math.abs(n) >= 100000) {
    // Indian style: lakhs / crores
    if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    return `₹${(n / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function num(n: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(n));
}

export interface Totals {
  gross: number; // sum of line items (qty * price)
  discount: number;
  taxable: number;
  tax: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export function lineTotal(item: LineItem): number {
  return item.qty * item.price;
}

/**
 * Compute a document's totals.
 * @param items line items
 * @param discountPct percentage discount on gross
 * @param taxRate GST rate as a percentage (e.g. 18)
 * @param opts.inclusive whether item prices already include tax
 * @param opts.interState if true use IGST, otherwise split CGST+SGST
 */
export function computeTotals(
  items: LineItem[],
  discountPct: number,
  taxRate: number,
  opts: { inclusive?: boolean; interState?: boolean } = {},
): Totals {
  const gross = items.reduce((s, i) => s + lineTotal(i), 0);
  const discount = (gross * (discountPct || 0)) / 100;
  const net = gross - discount;

  let taxable: number;
  let tax: number;
  let total: number;

  if (opts.inclusive) {
    // prices already include tax -> back it out
    taxable = net / (1 + (taxRate || 0) / 100);
    tax = net - taxable;
    total = net;
  } else {
    taxable = net;
    tax = (net * (taxRate || 0)) / 100;
    total = net + tax;
  }

  const igst = opts.interState ? tax : 0;
  const cgst = opts.interState ? 0 : tax / 2;
  const sgst = opts.interState ? 0 : tax / 2;

  return {
    gross: round(gross),
    discount: round(discount),
    taxable: round(taxable),
    tax: round(tax),
    cgst: round(cgst),
    sgst: round(sgst),
    igst: round(igst),
    total: round(total),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
