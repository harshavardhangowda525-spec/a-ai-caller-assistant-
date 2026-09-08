'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/** Mouse-following light + organic floating glass blobs behind content.
 *  Desktop only for the pointer light; blobs animate everywhere via CSS. */
export function MouseLight() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(216,138,79,0.10), transparent 60%)`;
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] hidden md:block"
    />
  );
}

export function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="animate-blob animate-float-slow absolute -left-32 top-24 h-96 w-96 bg-copper-500/10 blur-3xl" />
      <div
        className="animate-blob absolute right-[-8rem] top-1/3 h-[28rem] w-[28rem] bg-coffee-500/10 blur-3xl"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="animate-blob animate-float-slow absolute bottom-24 left-1/3 h-80 w-80 bg-caramel/10 blur-3xl"
        style={{ animationDelay: '-3s' }}
      />
    </div>
  );
}

/** Rising coffee steam wisps for the hero. */
export function Steam({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="animate-steam-rise absolute bottom-0 block w-8 rounded-full bg-cream-100/20 blur-md"
          style={{
            left: `${i * 22}px`,
            height: '120px',
            animationDelay: `${i * 1.3}s`,
            animationDuration: `${6 + i}s`,
          }}
        />
      ))}
    </div>
  );
}
