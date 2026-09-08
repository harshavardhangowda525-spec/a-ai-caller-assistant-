'use client';

import { motion } from 'framer-motion';
import MagneticButton from '@/components/glass/MagneticButton';
import { STATS } from '@/lib/seed-data';
import type { ReviewTheme } from '@/lib/types';

export default function Reviews({
  themes,
  reviewsUrl,
}: {
  themes: ReviewTheme[];
  reviewsUrl: string;
}) {
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Central rating */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="glass grain glass-refract relative mx-auto flex aspect-square w-full max-w-sm flex-col items-center justify-center rounded-[2.5rem] p-8 text-center"
        >
          <div className="animate-float-slow">
            <div className="font-display text-7xl font-semibold text-gradient sm:text-8xl">
              {STATS.rating}
            </div>
            <div className="mt-1 text-2xl text-copper-400">★★★★★</div>
            <div className="mt-3 text-sm tracking-[0.2em] text-cream-200/70">
              {STATS.reviews} REVIEWS
            </div>
          </div>
          <span className="absolute -right-3 -top-3 h-24 w-24 rounded-full bg-copper-500/20 blur-2xl" />
        </motion.div>

        {/* Theme cards */}
        <div>
          <p className="section-eyebrow mb-4">What regulars say</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {themes.map((t, i) => (
              <motion.blockquote
                key={t.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.07 }}
                whileHover={{ y: -4 }}
                className="glass grain glass-sheen rounded-2xl p-4"
              >
                <span className="inline-block rounded-full bg-copper-500/15 px-2.5 py-0.5 text-[11px] font-medium text-copper-300">
                  {t.theme}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-cream-100/90">{t.quote}</p>
                <cite className="mt-2 block text-[11px] not-italic text-cream-200/50">
                  {t.author}
                </cite>
              </motion.blockquote>
            ))}
          </div>
          <div className="mt-6">
            <MagneticButton href={reviewsUrl} target="_blank">
              READ MORE REVIEWS
            </MagneticButton>
          </div>
        </div>
      </div>
    </section>
  );
}
