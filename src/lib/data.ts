import 'server-only';
import { getAdminSupabase } from './supabase/admin';
import {
  DEFAULT_CONTENT,
  EVENTS,
  GALLERY,
  MENU,
  REVIEW_THEMES,
} from './seed-data';
import type {
  CafeEvent,
  GalleryImage,
  MenuItem,
  Order,
  ReviewTheme,
  SiteContent,
} from './types';

/**
 * Data access with graceful fallback. When Supabase is configured the live
 * rows are returned; otherwise the static seed content is served so the
 * public site and admin previews always render.
 */

function mapMenu(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price),
    category: row.category,
    image: row.image ?? '',
    available: row.available ?? true,
    featured: row.featured ?? false,
    sort: row.sort ?? 0,
  };
}

function mapEvent(row: any): CafeEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time ?? '',
    description: row.description ?? '',
    image: row.image ?? '',
    bookingUrl: row.booking_url ?? null,
    published: row.published ?? true,
  };
}

function mapGallery(row: any): GalleryImage {
  return {
    id: row.id,
    src: row.src,
    caption: row.caption ?? '',
    category: row.category,
    span: row.span ?? 'normal',
    sort: row.sort ?? 0,
  };
}

function mapOrder(row: any): Order {
  return {
    id: row.id,
    reference: row.reference,
    customerName: row.customer_name ?? '',
    customerPhone: row.customer_phone ?? '',
    lines: row.lines ?? [],
    subtotal: Number(row.subtotal ?? 0),
    discount: Number(row.discount ?? 0),
    tax: Number(row.tax ?? 0),
    total: Number(row.total ?? 0),
    paymentMethod: row.payment_method ?? 'cash',
    status: row.status ?? 'new',
    channel: row.channel ?? 'pos',
    createdAt: row.created_at,
  };
}

// ---------- MENU ----------
export async function getMenu(): Promise<MenuItem[]> {
  const sb = getAdminSupabase();
  if (!sb) return MENU;
  const { data, error } = await sb.from('menu_items').select('*').order('sort');
  if (error || !data?.length) return MENU;
  return data.map(mapMenu);
}

export async function getFeaturedCoffee(): Promise<MenuItem[]> {
  const menu = await getMenu();
  return menu.filter((m) => m.featured && m.category !== 'food' && m.category !== 'dessert');
}

export async function getFood(): Promise<MenuItem[]> {
  const menu = await getMenu();
  return menu.filter((m) => m.category === 'food' || m.category === 'dessert');
}

// ---------- EVENTS ----------
export async function getEvents(includeUnpublished = false): Promise<CafeEvent[]> {
  const sb = getAdminSupabase();
  if (!sb) return EVENTS;
  const { data, error } = await sb.from('events').select('*').order('date');
  if (error || !data?.length) return EVENTS;
  const mapped = data.map(mapEvent);
  return includeUnpublished ? mapped : mapped.filter((e) => e.published);
}

// ---------- GALLERY ----------
export async function getGallery(): Promise<GalleryImage[]> {
  const sb = getAdminSupabase();
  if (!sb) return GALLERY;
  const { data, error } = await sb.from('gallery').select('*').order('sort');
  if (error || !data?.length) return GALLERY;
  return data.map(mapGallery);
}

// ---------- REVIEWS ----------
export async function getReviewThemes(): Promise<ReviewTheme[]> {
  return REVIEW_THEMES;
}

// ---------- SITE CONTENT ----------
export async function getSiteContent(): Promise<SiteContent> {
  const sb = getAdminSupabase();
  if (!sb) return DEFAULT_CONTENT;
  const { data, error } = await sb
    .from('site_content')
    .select('key, value');
  if (error || !data?.length) return DEFAULT_CONTENT;
  const merged: Record<string, string> = {};
  data.forEach((r: any) => (merged[r.key] = r.value));
  return { ...DEFAULT_CONTENT, ...(merged as unknown as Partial<SiteContent>) };
}

// ---------- ORDERS ----------
export async function getOrders(): Promise<Order[]> {
  const sb = getAdminSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data.map(mapOrder);
}
