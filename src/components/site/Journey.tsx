'use client';

import { motion } from 'framer-motion';
import SectionHeading from './SectionHeading';

const stages = [
  { no: '01', title: 'Source', body: 'Specialty beans grown on tribal farms across the Western Ghats.' },
  { no: '02', title: 'Roast', body: 'Carefully developed flavours, roasted in small honest batches.' },
  { no: '03', title: 'Brew', body: 'Crafted by skilled baristas the moment you order.' },
  { no: '04', title: 'Experience', body: 'Enjoyed slowly, at Tribal Brew Daily on Church Street.' },
];

export default function Journey() {
  return (
    <section id="journey" className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
      {/* Coffee-bean texture behind glass */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 8px 12px at 20% 30%, #6f4e37 0 60%, transparent 61%), radial-gradient(ellipse 8px 12px at 70% 65%, #6f4e37 0 60%, transparent 61%), radial-gradient(ellipse 8px 12px at 45% 80%, #6f4e37 0 60%, transparent 61%)",
          backgroundSize: '160px 160px',
        }}
      />
      <div className="relative">
        <SectionHeading
          eyebrow="Our Coffee"
          title="From tribal farms to your cup."
          sub="Four honest steps. No shortcuts, no anonymity — just coffee you can trace back to the people and place it came from."
          center
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((s, i) => (
            <motion.div
              key={s.no}
              initial={{ opacity: 0, y: 40, rotateX: 12 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
              className="glass grain glass-refract glass-sheen perspective group relative overflow-hidden rounded-2xl p-6"
            >
              <div className="font-display text-5xl font-semibold text-copper-500/40 transition-colors group-hover:text-copper-400/70">
                {s.no}
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold text-cream-100">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-cream-200/70">
                {s.body}
              </p>
              {i < stages.length - 1 && (
                <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-copper-400/50 lg:block">
                  →
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
