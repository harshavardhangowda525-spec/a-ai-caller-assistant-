'use client';

import { motion } from 'framer-motion';
import SectionHeading from './SectionHeading';
import type { SiteContent } from '@/lib/types';

export default function Location({ content }: { content: SiteContent }) {
  const mapEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(
    'Tribal Brew Daily Church Street Bengaluru',
  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  const actions = [
    { label: 'GET DIRECTIONS', href: content.directionsUrl, primary: true },
    { label: 'CALL', href: `tel:${content.phone}`, primary: false },
    { label: 'ORDER ONLINE', href: content.orderingUrl, primary: false, external: true },
  ];

  return (
    <section id="location" className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
      <SectionHeading eyebrow="Visit" title="Find your way to the brew." center />

      <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="glass grain glass-refract flex flex-col justify-between rounded-3xl p-7"
        >
          <div>
            <h3 className="font-display text-xl font-semibold text-cream-100">
              Tribal Brew Daily — Church Street
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-cream-200/80">{content.address}</p>
            <p className="mt-4 text-sm text-copper-300">{content.openingHours}</p>
          </div>
          <div className="mt-7 flex flex-col gap-3">
            {actions.map((a) => (
              <a
                key={a.label}
                href={a.href}
                target={a.external ? '_blank' : undefined}
                rel={a.external ? 'noopener noreferrer' : undefined}
                className={`glass-btn glass-sheen w-full justify-center py-3 text-sm font-semibold ${
                  a.primary ? 'glass-btn-primary' : 'text-cream-100'
                }`}
              >
                {a.label}
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="glass grain glass-refract overflow-hidden rounded-3xl p-1.5"
        >
          <iframe
            title="Map to Tribal Brew Daily, Church Street, Bengaluru"
            src={mapEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full min-h-[20rem] w-full rounded-[1.4rem] grayscale-[0.2]"
            style={{ border: 0, filter: 'invert(0.06) hue-rotate(5deg)' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
