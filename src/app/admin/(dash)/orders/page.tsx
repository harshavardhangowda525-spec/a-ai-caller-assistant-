import { getOrders } from '@/lib/data';
import OrdersManager from '@/components/admin/OrdersManager';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const orders = await getOrders();
  return <OrdersManager initial={orders} />;
}
