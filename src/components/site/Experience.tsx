'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import SmartImage from '@/components/glass/SmartImage';

const features = [
  { icon: '☕', title: 'Specialty Coffee', body: 'Single-origin, small-batch, endlessly considered.' },
  { icon: '🎵', title: 'Live Music', body: 'Acoustic evenings that turn coffee into a night out.' },
  { icon: '🎤', title: 'Karaoke', body: 'Grab the mic — the friendliest stage on Church Street.' },
  { icon: '🐈', title: 'Cozy Atmosphere', body: 'Warm light, soft corners, made for lingering.' },
  { icon: '🤝', title: 'Community', body: 'A gathering place for Bengaluru’s coffee people.' },
  { icon: '🍰', title: 'Fresh Food', body: 'Bakes and desserts made to pair with your cup.' },
];

export default function Experience() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const yA = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const yB = useTransform(scrollYProgress, [0, 1], [90, -90]);
  const yC = useTransform(scrollYProgress, [0, 1], [10, -10]);
  const ys = [yA, yB, yC];

  return (
    <section id="experience" ref={ref} className="relative overflow-hidden py-28 sm:py-36">
      <div className="absolute inset-0">
        <SmartImage
          src="/images/experience-vibe.jpg"
          alt="The warm, cozy evening atmosphere inside Tribal Brew Daily"
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-espresso-950/80" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl"
        >
          Come for the coffee.
          <br />
          <span className="text-gradient">Stay for the vibe.</span>
        </motion.h2>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              style={{ y: ys[i % 3] }}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}
              whileHover={{ y: -6 }}
              className="glass grain glass-refract glass-sheen rounded-2xl p-6"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-copper-500/15 text-2xl">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-cream-100">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-cream-200/70">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
