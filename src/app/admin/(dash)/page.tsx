import { getEvents, getMenu, getOrders } from '@/lib/data';
import { PageTitle, Panel, StatTile } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

export default async function Dashboard() {
  const [orders, menu, events] = await Promise.all([getOrders(), getMenu(), getEvents(true)]);

  const todays = orders.filter((o) => isToday(o.createdAt));
  const revenue = todays.reduce((s, o) => s + o.total, 0);

  // Popular items across all orders
  const counts = new Map<string, number>();
  orders.forEach((o) =>
    o.lines.forEach((l) => counts.set(l.name, (counts.get(l.name) ?? 0) + l.qty)),
  );
  const popular = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const upcoming = events
    .filter((e) => new Date(e.date) >= new Date(new Date().toDateString()))
    .slice(0, 4);

  return (
    <div>
      <PageTitle title="Dashboard" sub="Today at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Today's Orders" value={String(todays.length)} hint="Since midnight" />
        <StatTile label="Today's Revenue" value={`₹${revenue.toLocaleString('en-IN')}`} />
        <StatTile label="Menu Items" value={String(menu.length)} hint={`${menu.filter((m) => m.available).length} available`} />
        <StatTile label="Upcoming Events" value={String(upcoming.length)} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h3 className="font-display text-lg font-semibold text-cream-100">Popular items</h3>
          {popular.length === 0 ? (
            <p className="mt-3 text-sm text-cream-200/50">
              No orders yet. Ring up a sale in Billing / POS to see this populate.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {popular.map(([name, qty]) => (
                <li key={name} className="flex items-center justify-between text-sm">
                  <span className="text-cream-200/80">{name}</span>
                  <span className="rounded-full bg-copper-500/15 px-2.5 py-0.5 text-xs text-copper-300">
                    ×{qty}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <h3 className="font-display text-lg font-semibold text-cream-100">Upcoming events</h3>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-cream-200/50">Nothing scheduled.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span className="text-cream-200/80">{e.title}</span>
                  <span className="text-xs text-cream-200/50">
                    {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {e.time}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-5">
        <Panel>
          <h3 className="font-display text-lg font-semibold text-cream-100">Recent activity</h3>
          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-cream-200/50">Recent orders will appear here.</p>
          ) : (
            <ul className="mt-3 divide-y divide-cream-100/10">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-cream-200/80">
                    {o.reference} · {o.customerName || 'Walk-in'}
                  </span>
                  <span className="text-cream-200/60">₹{o.total}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
