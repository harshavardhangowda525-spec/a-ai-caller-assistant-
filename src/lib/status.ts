// Maps domain statuses to display labels + Chip tones.
import type {
  InvoiceStatus, DocStatus, EventStatus, OrderStatus, TableStatus, PaymentMethod,
} from './types';

type Tone = 'good' | 'warn' | 'bad' | 'info' | 'brand' | 'neutral';
interface Badge { label: string; tone: Tone }

export const INVOICE_STATUS: Record<InvoiceStatus, Badge> = {
  paid: { label: 'Paid', tone: 'good' },
  partial: { label: 'Partial', tone: 'warn' },
  unpaid: { label: 'Unpaid', tone: 'bad' },
  overdue: { label: 'Overdue', tone: 'bad' },
  draft: { label: 'Draft', tone: 'neutral' },
};

export const DOC_STATUS: Record<DocStatus, Badge> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'info' },
  accepted: { label: 'Accepted', tone: 'good' },
  rejected: { label: 'Rejected', tone: 'bad' },
  converted: { label: 'Converted', tone: 'brand' },
};

export const EVENT_STATUS: Record<EventStatus, Badge> = {
  enquiry: { label: 'Enquiry', tone: 'neutral' },
  quoted: { label: 'Quoted', tone: 'info' },
  confirmed: { label: 'Confirmed', tone: 'good' },
  completed: { label: 'Completed', tone: 'brand' },
  cancelled: { label: 'Cancelled', tone: 'bad' },
};

export const ORDER_STATUS: Record<OrderStatus, Badge> = {
  open: { label: 'Open', tone: 'info' },
  held: { label: 'Held', tone: 'warn' },
  paid: { label: 'Paid', tone: 'good' },
  void: { label: 'Void', tone: 'bad' },
};

export const TABLE_STATUS: Record<TableStatus, Badge & { dot: string }> = {
  available: { label: 'Available', tone: 'good', dot: '#22c3a6' },
  occupied: { label: 'Occupied', tone: 'bad', dot: '#ff6b8b' },
  reserved: { label: 'Reserved', tone: 'warn', dot: '#f6b73c' },
  cleaning: { label: 'Cleaning', tone: 'neutral', dot: '#94a3b8' },
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash', upi: 'UPI', card: 'Card', bank: 'Bank Transfer', other: 'Other',
};
