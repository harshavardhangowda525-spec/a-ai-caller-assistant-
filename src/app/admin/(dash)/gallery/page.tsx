import { getGallery } from '@/lib/data';
import GalleryManager from '@/components/admin/GalleryManager';

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const gallery = await getGallery();
  return <GalleryManager initial={gallery} />;
}
