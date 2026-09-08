'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import SmartImage from '@/components/glass/SmartImage';
import type { SiteContent } from '@/lib/types';

export default function About({ content }: { content: SiteContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <section id="about" ref={ref} className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
        <div className="relative order-2 lg:order-1">
          <motion.div style={{ y: imgY }} className="relative h-[26rem] overflow-hidden rounded-[2rem] sm:h-[32rem]">
            <SmartImage
              src="/images/about-origin.jpg"
              alt="Tribal farm coffee origins — hands sorting freshly picked coffee cherries"
              className="h-[120%] w-full"
            />
          </motion.div>
          {/* Overlapping glass panel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass grain glass-refract absolute -right-2 bottom-6 max-w-[70%] rounded-2xl p-5 sm:-right-8"
          >
            <p className="text-sm leading-relaxed text-cream-100/90">{content.coffeeStory}</p>
          </motion.div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="section-eyebrow mb-3">Our Story</p>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Rooted in origin.
            <br />
            <span className="text-gradient">Brewed for today.</span>
          </h2>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-cream-200/80 sm:text-base">
            {content.aboutBody}
          </p>
        </div>
      </div>
    </section>
  );
}
