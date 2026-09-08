export type MenuCategory =
  | 'coffee'
  | 'signature'
  | 'food'
  | 'dessert'
  | 'cold';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  available: boolean;
  featured: boolean;
  sort: number;
}

export interface CafeEvent {
  id: string;
  title: string;
  date: string; // ISO date
  time: string; // e.g. "8:00 PM"
  description: string;
  image: string;
  bookingUrl: string | null;
  published: boolean;
}

export type GalleryCategory =
  | 'coffee'
  | 'food'
  | 'vibe'
  | 'events'
  | 'interior';

export interface GalleryImage {
  id: string;
  src: string;
  caption: string;
  category: GalleryCategory;
  span: 'tall' | 'wide' | 'normal';
  sort: number;
}

export interface ReviewTheme {
  id: string;
  quote: string;
  theme: string;
  author: string; // attributed generically, never invented specifics
}

export interface SiteContent {
  heroHeadline: string;
  heroSub: string;
  heroBadge: string;
  aboutTitle: string;
  aboutBody: string;
  coffeeStory: string;
  openingHours: string;
  phone: string;
  address: string;
  email: string;
  instagram: string;
  facebook: string;
  orderingUrl: string;
  mapsUrl: string;
  directionsUrl: string;
}

export type OrderStatus =
  | 'new'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'other';

export interface OrderLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  channel: 'pos' | 'online';
  createdAt: string;
}
