'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import SmartImage from '@/components/glass/SmartImage';
import SectionHeading from './SectionHeading';
import type { GalleryCategory, GalleryImage } from '@/lib/types';

const FILTERS: { label: string; value: GalleryCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Coffee', value: 'coffee' },
  { label: 'Food', value: 'food' },
  { label: 'Vibe', value: 'vibe' },
  { label: 'Events', value: 'events' },
  { label: 'Interior', value: 'interior' },
];

export default function Gallery({ images }: { images: GalleryImage[] }) {
  const [filter, setFilter] = useState<GalleryCategory | 'all'>('all');
  const [active, setActive] = useState<GalleryImage | null>(null);

  const shown = useMemo(
    () => (filter === 'all' ? images : images.filter((i) => i.category === filter)),
    [filter, images],
  );

  return (
    <section id="gallery" className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
      <SectionHeading eyebrow="Gallery" title="Moments in glass." center />

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-4 py-1.5 text-xs tracking-wide transition-all ${
              filter === f.value
                ? 'border-copper-400/50 bg-copper-500/20 text-copper-200'
                : 'border-cream-100/15 bg-cream-100/5 text-cream-200/70 hover:text-cream-100'
            }`}
          >
            {f.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mt-10 grid auto-rows-[190px] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {shown.map((img) => (
            <motion.button
              key={img.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              onClick={() => setActive(img)}
              className={`glass-refract group relative overflow-hidden rounded-2xl border border-cream-100/10 ${
                img.span === 'tall'
                  ? 'row-span-2'
                  : img.span === 'wide'
                  ? 'col-span-2'
                  : ''
              }`}
            >
              <SmartImage src={img.src} alt={img.caption} className="h-full w-full" imgClassName="transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-espresso-950/20 opacity-0 backdrop-blur-sm transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-3 p-3 text-left opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="glass rounded-lg px-2.5 py-1 text-xs text-cream-100">
                  {img.caption}
                </span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          >
            <div className="glass-dark grain absolute inset-0" style={{ backdropFilter: 'blur(30px)' }} />
            <motion.figure
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="glass grain glass-refract relative z-10 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl"
            >
              <SmartImage src={active.src} alt={active.caption} className="max-h-[70vh] w-full" eager />
              <figcaption className="flex items-center justify-between p-4">
                <span className="text-sm text-cream-100">{active.caption}</span>
                <button
                  onClick={() => setActive(null)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-cream-100/15 text-cream-100"
                  aria-label="Close"
                >
                  ✕
                </button>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
