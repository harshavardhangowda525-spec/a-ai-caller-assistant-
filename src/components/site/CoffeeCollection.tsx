'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import SmartImage from '@/components/glass/SmartImage';
import SectionHeading from './SectionHeading';
import type { MenuItem } from '@/lib/types';

export default function CoffeeCollection({
  items,
  orderingUrl,
}: {
  items: MenuItem[];
  orderingUrl: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  const nudge = (dir: number) => {
    scroller.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <section id="menu" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Signature" title="The coffee collection." />
          <div className="hidden gap-2 sm:flex">
            <button
              aria-label="Scroll left"
              onClick={() => nudge(-1)}
              className="glass-btn h-11 w-11 text-cream-100"
            >
              ←
            </button>
            <button
              aria-label="Scroll right"
              onClick={() => nudge(1)}
              className="glass-btn h-11 w-11 text-cream-100"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 sm:px-[max(1.25rem,calc((100vw-72rem)/2))]"
      >
        {items.map((item, i) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: (i % 4) * 0.08 }}
            whileHover={{ y: -10 }}
            className="glass grain glass-refract glass-sheen group relative w-[270px] flex-none snap-start overflow-hidden rounded-3xl sm:w-[300px]"
          >
            <div className="relative h-52 overflow-hidden">
              <SmartImage
                src={item.image}
                alt={item.name}
                className="h-full w-full"
                imgClassName="transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso-950/80 to-transparent" />
              <span className="absolute right-3 top-3 rounded-full border border-cream-100/20 bg-espresso-950/50 px-3 py-1 text-xs font-semibold text-copper-300 backdrop-blur">
                ₹{item.price}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-cream-100">
                {item.name}
              </h3>
              <p className="mt-1.5 min-h-[40px] text-sm leading-relaxed text-cream-200/70">
                {item.description}
              </p>
              <a
                href={orderingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-btn glass-btn-primary glass-sheen mt-4 w-full justify-center py-2.5 text-xs font-semibold"
              >
                ADD TO ORDER
              </a>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
