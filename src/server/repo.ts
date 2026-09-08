import 'server-only';
import { getAdminSupabase } from '@/lib/supabase/admin';
import type { CafeEvent, GalleryImage, MenuItem, Order } from '@/lib/types';

/** Privileged write repository. Each fn returns { ok, data?, error? }.
 *  When Supabase isn't configured, ok:false with demo:true is returned. */

type Result<T = unknown> = { ok: boolean; data?: T; error?: string; demo?: boolean };

function demo(): Result {
  return { ok: false, demo: true, error: 'Supabase not configured' };
}

// ---- MENU ----
export async function upsertMenuItem(item: Partial<MenuItem>): Promise<Result> {
  const sb = getAdminSupabase();
  if (!sb) return demo();
  const row = {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    image: item.image,
    available: item.available,
    featured: item.featured,
    sort: item.sort ?? 0,
  };
  const { data, error } = await sb.from('menu_items').upsert(row).select().single();
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

export async function deleteMenuItem(id: string): Promise<Result> {
  const sb = getAdminSupabase();
  if (!sb) return demo();
  const { error } = await sb.from('menu_items').delete().eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ---- EVENTS ----
export async function upsertEvent(ev: Partial<CafeEvent>): Promise<Result> {
  const sb = getAdminSupabase();
  if (!sb) return demo();
  const row = {
    id: ev.id,
    title: ev.title,
    date: ev.date,
    time: ev.time,
    description: ev.description,
    image: ev.image,
    booking_url: ev.bookingUrl,
    published: ev.published ?? true,
  };
  const { data, error } = await sb.from('events').upsert(row).select().single();
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

export async function deleteEvent(id: string): Promise<Result> {
  const sb = getAdminSupabase();
  if (!sb) return demo();
  const { error } = await sb.from('events').delete().eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ---- GALLERY ----
export async function upsertGallery(img: Partial<GalleryImage>): Promise<Result> {
  const sb = getAdminSupabase();
  if (!sb) return demo();
  const { data, error } = await sb
    .from('gallery')
    .upsert({
      id: img.id,
      src: img.src,
      caption: img.caption,
      category: img.category,
      span: img.span ?? 'normal',
      sort: img.sort ?? 0,
    })
    .select()
    .single();
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

export async function deleteGallery(id: string): Promise<Result> {
  const sb = getAdminSupabase();
  if (!sb) return demo();
  const { error } = await sb.from('gallery').delete().eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ---- SITE CONTENT ----
export async function saveContent(entries: Record<string, string>): Promise<Result> {
  const sb = getAdminSupabase();
  if (!sb) return demo();
  const rows = Object.entries(entries).map(([key, value]) => ({ key, value }));
  const { error } = await sb.from('site_content').upsert(rows);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ---- ORDERS ----
export async function createOrder(order: Partial<Order>): Promise<Result> {
  const sb = getAdminSupabase();
  if (!sb) return demo();
  const row = {
    reference: order.reference,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    lines: order.lines,
    subtotal: order.subtotal,
    discount: order.discount,
    tax: order.tax,
    total: order.total,
    payment_method: order.paymentMethod,
    status: order.status ?? 'new',
    channel: order.channel ?? 'pos',
  };
  const { data, error } = await sb.from('orders').insert(row).select().single();
  return error ? { ok: false, error: error.message } : { ok: true, data };
}

export async function updateOrderStatus(id: string, status: string): Promise<Result> {
  const sb = getAdminSupabase();
  if (!sb) return demo();
  const { error } = await sb.from('orders').update({ status }).eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}
