'use client';

import { motion } from 'framer-motion';
import SmartImage from '@/components/glass/SmartImage';
import MagneticButton from '@/components/glass/MagneticButton';
import SectionHeading from './SectionHeading';
import type { MenuItem } from '@/lib/types';

export default function Food({
  items,
  orderingUrl,
}: {
  items: MenuItem[];
  orderingUrl: string;
}) {
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Kitchen"
        title="Pair it with something special."
        sub="Fresh bakes and desserts, made to sit beside your brew."
        center
      />

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {items.slice(0, 2).map((item, i) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: i * 0.12 }}
            className="group relative h-[24rem] overflow-hidden rounded-[2rem]"
          >
            <SmartImage src={item.image} alt={item.name} className="absolute inset-0 h-full w-full" imgClassName="transition-transform duration-[1200ms] group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso-950 via-espresso-950/30 to-transparent" />
            <div className="glass grain glass-refract absolute inset-x-4 bottom-4 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-semibold text-cream-100">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-sm text-cream-200/75">{item.description}</p>
                </div>
                <span className="whitespace-nowrap rounded-full bg-copper-500/20 px-3 py-1 text-sm font-semibold text-copper-300">
                  ₹{item.price}
                </span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <MagneticButton href={orderingUrl} target="_blank" primary>
          VIEW FULL MENU
        </MagneticButton>
      </div>
    </section>
  );
}
