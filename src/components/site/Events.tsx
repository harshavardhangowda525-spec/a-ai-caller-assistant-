'use client';

import { motion } from 'framer-motion';
import SmartImage from '@/components/glass/SmartImage';
import SectionHeading from './SectionHeading';
import type { CafeEvent } from '@/lib/types';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

export default function Events({
  events,
  orderingUrl,
}: {
  events: CafeEvent[];
  orderingUrl: string;
}) {
  return (
    <section id="events" className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
      <SectionHeading
        eyebrow="After Dark"
        title="The café after dark."
        sub="Church Street evenings, soundtracked. Reserve a spot or just walk in."
      />

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((ev, i) => (
          <motion.article
            key={ev.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}
            whileHover={{ y: -8 }}
            className="glass grain glass-refract glass-sheen group overflow-hidden rounded-3xl"
          >
            <div className="relative h-44 overflow-hidden">
              <SmartImage src={ev.image} alt={ev.title} className="h-full w-full" imgClassName="transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso-950/85 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="rounded-full border border-cream-100/20 bg-espresso-950/60 px-3 py-1 text-xs font-medium text-cream-100 backdrop-blur">
                  {formatDate(ev.date)}
                </span>
                <span className="rounded-full border border-cream-100/20 bg-espresso-950/60 px-3 py-1 text-xs font-medium text-copper-300 backdrop-blur">
                  {ev.time}
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-cream-100">{ev.title}</h3>
              <p className="mt-1.5 min-h-[60px] text-sm leading-relaxed text-cream-200/70">
                {ev.description}
              </p>
              <a
                href={ev.bookingUrl || orderingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-btn glass-sheen mt-3 w-full justify-center py-2.5 text-xs font-semibold text-cream-100"
              >
                {ev.bookingUrl ? 'RESERVE' : 'KNOW MORE'}
              </a>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
