'use client';

/**
 * Animated feature showcase for the login page side panel. Uses the CardSwap
 * deck to cycle through Infinity AI Caller's key value propositions. Purely
 * decorative — no effect on authentication.
 */
import { CardSwap, Card } from './CardSwap';

const FEATURES = [
  {
    icon: '📞',
    title: 'Sequential AI Calling',
    description: 'One eligible lead at a time — a reliable, restart-safe queue that never double-dials.',
    accent: '#1e50e5',
  },
  {
    icon: '🛡️',
    title: 'Compliant by Design',
    description: 'Do-not-call, consent, and suppression are enforced in the core — never spoofed, never bypassed.',
    accent: '#1aa66b',
  },
  {
    icon: '🔴',
    title: 'Live Call Monitoring',
    description: 'Watch every call in real time — AI state, duration, and transfer status as it happens.',
    accent: '#e04848',
  },
  {
    icon: '🤝',
    title: 'Instant Human Transfer',
    description: 'When a lead is interested, connect them straight to the owner — with their consent.',
    accent: '#e0a300',
  },
];

export function LoginShowcase() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <CardSwap
        width={320}
        height={200}
        cardDistance={44}
        verticalDistance={46}
        delay={3800}
        pauseOnHover
        skewAmount={5}
        easing="elastic"
      >
        {FEATURES.map((f) => (
          <Card key={f.title} customClass="p-6">
            <div className="flex h-full flex-col">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{ background: `${f.accent}1a` }}
              >
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-brand-navy">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-brand-grayText">{f.description}</p>
              <div className="mt-auto h-1 w-10 rounded-full" style={{ background: f.accent }} />
            </div>
          </Card>
        ))}
      </CardSwap>
    </div>
  );
}
