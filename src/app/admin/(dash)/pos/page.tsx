import { getMenu, getOrders } from '@/lib/data';
import POS from '@/components/admin/POS';

export const dynamic = 'force-dynamic';

export default async function POSPage() {
  const [menu, orders] = await Promise.all([getMenu(), getOrders()]);
  return <POS menu={menu} recent={orders} />;
}
