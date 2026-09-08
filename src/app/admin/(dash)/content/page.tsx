import { getSiteContent } from '@/lib/data';
import ContentEditor from '@/components/admin/ContentEditor';

export const dynamic = 'force-dynamic';

export default async function ContentPage() {
  const content = await getSiteContent();
  return <ContentEditor initial={content} />;
}
