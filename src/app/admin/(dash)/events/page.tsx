import { getEvents } from '@/lib/data';
import EventsManager from '@/components/admin/EventsManager';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await getEvents(true);
  return <EventsManager initial={events} />;
}
