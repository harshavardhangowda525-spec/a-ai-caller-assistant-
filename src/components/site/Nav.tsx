'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NAV_LINKS } from '@/lib/seed-data';

export default function Nav({ orderingUrl }: { orderingUrl: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-5"
      >
        <nav
          className={`glass grain glass-refract flex w-full max-w-6xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 sm:px-6 ${
            scrolled ? 'bg-espresso-900/70 shadow-glass-lg' : ''
          }`}
          style={
            scrolled
              ? { backdropFilter: 'blur(30px) saturate(150%)' }
              : undefined
          }
        >
          <a href="#home" className="flex items-center gap-2 whitespace-nowrap">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-copper-400 to-copper-600 text-sm shadow-glow">
              ☕
            </span>
            <span className="font-display text-sm font-semibold tracking-wide text-cream-100 sm:text-base">
              TRIBAL BREW <span className="text-copper-400">DAILY</span>
            </span>
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-full px-3 py-1.5 text-[13px] text-cream-200/80 transition-colors hover:bg-cream-100/10 hover:text-cream-100"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href={orderingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-btn glass-btn-primary glass-sheen hidden px-4 py-2 text-xs font-semibold sm:inline-flex"
            >
              ORDER ONLINE
            </a>
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full border border-cream-100/15 bg-cream-100/5 lg:hidden"
            >
              <span className="flex flex-col gap-1">
                <span className="block h-0.5 w-4 bg-cream-100" />
                <span className="block h-0.5 w-4 bg-cream-100" />
                <span className="block h-0.5 w-4 bg-cream-100" />
              </span>
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <div
              className="glass-dark grain absolute inset-0"
              style={{ backdropFilter: 'blur(34px) saturate(140%)' }}
            />
            <div className="relative flex h-full flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-semibold text-cream-100">
                  TRIBAL BREW <span className="text-copper-400">DAILY</span>
                </span>
                <button
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/15 text-xl text-cream-100"
                >
                  ✕
                </button>
              </div>
              <ul className="mt-10 flex flex-col gap-1">
                {NAV_LINKS.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i + 0.1 }}
                  >
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block border-b border-cream-100/10 py-4 font-display text-2xl text-cream-100"
                    >
                      {l.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
              <a
                href={orderingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-btn glass-btn-primary mt-auto w-full justify-center py-4 text-base font-semibold"
              >
                ORDER ONLINE
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
