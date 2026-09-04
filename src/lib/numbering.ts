import type { AppData } from './types';

function maxNum(list: { number: string }[], floor: number): number {
  return list.reduce((m, x) => {
    const n = parseInt(x.number.replace(/\D/g, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, floor);
}

export function nextOrderNumber(orders: { number: string }[]): string {
  return `ORD-${maxNum(orders, 2040) + 1}`;
}

export function nextInvoiceNumber(data: AppData): string {
  const n = maxNum(data.invoices, 126) + 1;
  return `${data.settings.invoicePrefix}${String(n).padStart(5, '0')}`;
}

export function nextQuoteNumber(data: AppData): string {
  const n = maxNum(data.quotations, 9) + 1;
  return `${data.settings.quotePrefix}${String(n).padStart(4, '0')}`;
}
