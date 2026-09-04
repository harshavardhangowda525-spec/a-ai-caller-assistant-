// ---------------------------------------------------------------------------
// Domain types for the Liquid Glass Café + Event platform.
// A single business (multi-tenant on the DB side via RLS; a single seeded
// business in the demo). All money is stored in whole rupees (INR).
// ---------------------------------------------------------------------------

export type Role = 'owner' | 'manager' | 'cashier' | 'event_staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string; // emoji
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // emoji
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  sku: string;
  price: number; // selling price
  cost: number; // purchase price
  image: string; // emoji
  available: boolean;
  stock: number;
  minStock: number;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface CafeTable {
  id: string;
  name: string;
  seats: number;
  status: TableStatus;
  orderId?: string | null;
}

export interface LineItem {
  id: string;
  refId?: string; // product / service id
  name: string;
  qty: number;
  price: number;
}

export type OrderStatus = 'open' | 'held' | 'paid' | 'void';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export interface CafeOrder {
  id: string;
  number: string;
  type: OrderType;
  tableId?: string | null;
  customerId?: string | null;
  items: LineItem[];
  discountPct: number;
  taxRate: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod | null;
  createdAt: string;
  invoiceId?: string | null;
}

export interface EventPackage {
  id: string;
  name: string;
  price: number;
  includes: string[];
  featured?: boolean;
}

export interface EventService {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
}

export type EventStatus = 'enquiry' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';

export interface EventBooking {
  id: string;
  name: string;
  type: string;
  customerId: string;
  date: string; // ISO date
  time: string;
  venue: string;
  guests: number;
  packageId?: string | null;
  items: LineItem[]; // services / package lines
  discountPct: number;
  taxRate: number;
  status: EventStatus;
  notes: string;
  createdAt: string;
}

export type DocStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';

export interface Quotation {
  id: string;
  number: string;
  customerId: string;
  eventId?: string | null;
  title: string;
  items: LineItem[];
  discountPct: number;
  taxRate: number;
  status: DocStatus;
  date: string;
  validUntil: string;
  terms: string;
  invoiceId?: string | null;
}

export type InvoiceKind = 'cafe' | 'event';
export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'draft';

export interface Invoice {
  id: string;
  number: string;
  kind: InvoiceKind;
  customerId?: string | null;
  eventId?: string | null;
  orderId?: string | null;
  title: string;
  items: LineItem[];
  discountPct: number;
  taxRate: number;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank' | 'other';
export type PaymentKind = 'in' | 'refund';

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  kind: PaymentKind;
  invoiceId?: string | null;
  eventId?: string | null;
  customerId?: string | null;
  reference: string;
  notes: string;
}

export interface Expense {
  id: string;
  eventId?: string | null;
  category: string;
  description: string;
  amount: number;
  date: string;
  payee: string;
  method: PaymentMethod;
}

export type NotifType =
  | 'low_stock'
  | 'event_upcoming'
  | 'payment_pending'
  | 'invoice_overdue'
  | 'new_order'
  | 'quote_accepted'
  | 'payment_received';

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
}

export interface Settings {
  businessName: string;
  logo: string; // emoji
  address: string;
  phone: string;
  email: string;
  gstin: string;
  currency: string;
  invoicePrefix: string;
  quotePrefix: string;
  invoiceTerms: string;
  invoiceFooter: string;
  taxInclusive: boolean;
  defaultTaxRate: number;
  taxRates: TaxRate[];
  eventTypes: string[];
  serviceCategories: string[];
}

export interface AppData {
  users: User[];
  customers: Customer[];
  categories: Category[];
  products: Product[];
  tables: CafeTable[];
  orders: CafeOrder[];
  packages: EventPackage[];
  services: EventService[];
  events: EventBooking[];
  quotations: Quotation[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  notifications: Notification[];
  settings: Settings;
}

export type Mode = 'cafe' | 'event';
export type Theme = 'light' | 'dark';
