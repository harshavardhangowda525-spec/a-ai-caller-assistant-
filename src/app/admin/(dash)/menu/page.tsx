import { getMenu } from '@/lib/data';
import MenuManager from '@/components/admin/MenuManager';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const menu = await getMenu();
  return <MenuManager initial={menu} />;
}
