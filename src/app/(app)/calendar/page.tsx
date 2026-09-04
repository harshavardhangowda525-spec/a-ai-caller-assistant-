'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '@/lib/store';
import { inr } from '@/lib/money';
import { eventTotal } from '@/lib/selectors';
import { fmtDate } from '@/lib/format';
import { Glass, Chip, PageTitle, Btn } from '@/components/ui';
import { EVENT_STATUS } from '@/lib/status';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const { data } = useStore();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  const { cells, monthLabel } = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: ({ date: string; day: number } | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date, day: d });
    }
    return { cells, monthLabel: first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) };
  }, [cursor]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof data.events>();
    data.events.forEach((e) => {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    });
    return map;
  }, [data.events]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = [...data.events].filter((e) => e.date >= todayStr && e.status !== 'cancelled').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  const move = (delta: number) => setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  return (
    <div>
      <PageTitle title="Event Calendar" subtitle="Plan &amp; track your bookings" icon="📅" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr,320px]">
        <Glass className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold"><CalendarDays size={18} className="text-brand" /> {monthLabel}</div>
            <div className="flex gap-1">
              <button onClick={() => move(-1)} className="btn btn-glass !p-2 rounded-xl"><ChevronLeft size={16} /></button>
              <button onClick={() => setCursor(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; })} className="btn btn-glass !py-2 text-xs">Today</button>
              <button onClick={() => move(1)} className="btn btn-glass !p-2 rounded-xl"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {WD.map((d) => <div key={d} className="pb-1 text-center text-[11px] font-bold uppercase text-ink-faint">{d}</div>)}
            {cells.map((cell, i) => {
              if (!cell) return <div key={i} />;
              const evs = eventsByDate.get(cell.date) ?? [];
              const isToday = cell.date === todayStr;
              return (
                <div key={i} className={clsx('min-h-[76px] rounded-xl p-1.5 transition', isToday ? 'bg-brand/12 ring-1 ring-brand/40' : 'glass-2')}>
                  <div className={clsx('mb-1 text-xs font-semibold', isToday && 'text-brand')}>{cell.day}</div>
                  <div className="space-y-0.5">
                    {evs.slice(0, 2).map((e) => (
                      <Link key={e.id} href={`/events?id=${e.id}`} className="block truncate rounded-md px-1 py-0.5 text-[10px] font-medium text-white" style={{ background: EVENT_STATUS[e.status].tone === 'good' ? '#22c3a6' : EVENT_STATUS[e.status].tone === 'info' ? '#4f7cff' : EVENT_STATUS[e.status].tone === 'brand' ? '#8b6cff' : '#94a3b8' }}>
                        {e.name}
                      </Link>
                    ))}
                    {evs.length > 2 && <div className="px-1 text-[10px] text-ink-faint">+{evs.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Glass>

        <Glass className="h-fit p-4">
          <div className="mb-3 font-semibold">Upcoming timeline</div>
          <div className="relative space-y-3 pl-4">
            <div className="absolute bottom-2 left-[5px] top-2 w-px bg-glass-border/60" />
            {upcoming.map((e) => (
              <Link key={e.id} href={`/events?id=${e.id}`} className="relative block">
                <span className="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-brand/15" />
                <div className="rounded-xl glass-2 p-2.5 transition hover:brightness-105">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{e.name}</span>
                    <Chip tone={EVENT_STATUS[e.status].tone}>{EVENT_STATUS[e.status].label}</Chip>
                  </div>
                  <div className="mt-0.5 text-xs text-ink-faint">{fmtDate(e.date)} · {e.time} · {inr(eventTotal(e, data.settings))}</div>
                </div>
              </Link>
            ))}
            {!upcoming.length && <p className="py-4 text-center text-sm text-ink-faint">No upcoming events</p>}
          </div>
        </Glass>
      </div>
    </div>
  );
}
