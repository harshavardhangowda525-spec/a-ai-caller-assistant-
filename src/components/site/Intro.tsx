'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Reveal from '@/components/glass/Reveal';
import { STATS } from '@/lib/seed-data';

const stats = [
  { big: STATS.rating + '★', label: 'Google Rating' },
  { big: STATS.reviews, label: 'Reviews' },
  { big: STATS.spend, label: 'Average Spend' },
  { big: STATS.closing, label: 'Open Until' },
];

export default function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y1 = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const y2 = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Reveal>
            <p className="section-eyebrow mb-3">More than just coffee</p>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              A cup worth <span className="text-gradient">slowing down</span> for.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-cream-200/80 sm:text-base">
              We are a specialty coffee house on Church Street, obsessed with
              origin, roast and craft. Every drink is built on single-origin
              beans from tribal farms — and every corner of the room is made for
              lingering. Come for the coffee, stay for the warmth.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              style={{ y: i % 2 === 0 ? y1 : y2 }}
              className="glass grain glass-refract glass-sheen rounded-2xl p-5 sm:p-6"
            >
              <Reveal delay={i * 0.08}>
                <div className="font-display text-3xl font-semibold text-copper-300 sm:text-4xl">
                  {s.big}
                </div>
                <div className="mt-1 text-xs tracking-wide text-cream-200/70">
                  {s.label}
                </div>
              </Reveal>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
