'use client';

import { motion } from 'framer-motion';
import SmartImage from '@/components/glass/SmartImage';
import MagneticButton from '@/components/glass/MagneticButton';
import { Steam } from '@/components/glass/Atmosphere';
import type { SiteContent } from '@/lib/types';

export default function Hero({ content }: { content: SiteContent }) {
  return (
    <section id="home" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0">
        <SmartImage
          src="/images/hero-brew.jpg"
          alt="Barista brewing specialty coffee inside the warm Tribal Brew Daily café on Church Street"
          className="h-full w-full"
          eager
        />
        <div className="absolute inset-0 bg-gradient-to-b from-espresso-950/70 via-espresso-900/55 to-espresso-950/92" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent,rgba(11,7,5,0.6))]" />
      </div>

      <Steam className="bottom-[38%] left-[20%] hidden md:block" />
      <Steam className="bottom-[42%] right-[24%] hidden lg:block" />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-5 pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="glass grain glass-refract mx-auto rounded-[2rem] px-6 py-12 sm:px-12 sm:py-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-cream-100/20 bg-cream-100/5 px-4 py-1.5 text-[11px] font-medium tracking-[0.2em] text-cream-100/90 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-copper-400 shadow-glow" />
            {content.heroBadge.toUpperCase()}
          </motion.span>

          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            <span className="text-gradient">{content.heroHeadline}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-sm leading-relaxed text-cream-200/85 sm:text-base">
            {content.heroSub}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MagneticButton href="#menu" primary className="w-full sm:w-auto">
              EXPLORE MENU
            </MagneticButton>
            <MagneticButton href="#location" className="w-full sm:w-auto">
              VISIT US
            </MagneticButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-10 flex justify-center"
        >
          <div className="flex flex-col items-center gap-2 text-cream-200/50">
            <span className="text-[10px] tracking-[0.3em]">SCROLL</span>
            <motion.span
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="block h-8 w-px bg-gradient-to-b from-copper-400 to-transparent"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
