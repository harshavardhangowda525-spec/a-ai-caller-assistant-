'use client';

import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import type { ReactNode, MouseEvent } from 'react';

/** Magnetic, glass-styled link/button that eases toward the cursor. */
export default function MagneticButton({
  children,
  href,
  onClick,
  primary = false,
  className = '',
  target,
  type = 'button',
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
  className?: string;
  target?: string;
  type?: 'button' | 'submit';
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18 });
  const sy = useSpring(y, { stiffness: 250, damping: 18 });

  function handleMove(e: MouseEvent<HTMLElement>) {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }

  const cls = `glass-btn glass-sheen ${
    primary ? 'glass-btn-primary' : 'text-cream-100'
  } px-6 py-3 text-sm font-medium tracking-wide ${className}`;

  const inner = <span className="relative z-10">{children}</span>;

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        style={{ x: sx, y: sy }}
        className={cls}
      >
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.button
      type={type}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={cls}
    >
      {inner}
    </motion.button>
  );
}
