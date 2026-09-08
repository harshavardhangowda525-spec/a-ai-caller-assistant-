import { redirect } from 'next/navigation';
import { getSiteContent } from '@/lib/data';

export const metadata = { title: 'Order Online' };
export const revalidate = 300;

/** Sends visitors to the café's configurable ordering provider.
 *  The URL is admin-editable — never hard-coded here. */
export default async function OrderPage() {
  const content = await getSiteContent();
  redirect(content.orderingUrl || '/');
}
