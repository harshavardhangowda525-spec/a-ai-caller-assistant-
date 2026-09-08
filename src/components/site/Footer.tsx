import { NAV_LINKS } from '@/lib/seed-data';
import type { SiteContent } from '@/lib/types';

export default function Footer({ content }: { content: SiteContent }) {
  return (
    <footer className="relative mt-10 px-3 pb-6">
      <div className="glass-dark grain glass-refract mx-auto max-w-6xl overflow-hidden rounded-[2rem] p-8 sm:p-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-copper-400 to-copper-600 text-base">
                ☕
              </span>
              <span className="font-display text-lg font-semibold text-cream-100">
                TRIBAL BREW <span className="text-copper-400">DAILY</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-200/70">
              Coffee with a story. Church Street, Bengaluru.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href={content.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-btn h-10 w-10 text-sm text-cream-100"
                aria-label="Instagram"
              >
                IG
              </a>
              <a
                href={content.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-btn h-10 w-10 text-sm text-cream-100"
                aria-label="Facebook"
              >
                FB
              </a>
            </div>
          </div>

          <div>
            <h4 className="section-eyebrow mb-4">Explore</h4>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-cream-200/70 transition-colors hover:text-cream-100">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="section-eyebrow mb-4">Actions</h4>
            <ul className="space-y-2.5">
              <li>
                <a href={content.orderingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-cream-200/70 hover:text-cream-100">
                  Order Online
                </a>
              </li>
              <li>
                <a href={content.directionsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-cream-200/70 hover:text-cream-100">
                  Get Directions
                </a>
              </li>
              <li>
                <a href={`tel:${content.phone}`} className="text-sm text-cream-200/70 hover:text-cream-100">
                  Call the Café
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-cream-100/10 pt-6 text-xs text-cream-200/50 sm:flex-row">
          <p>© 2026 Tribal Brew Daily. All rights reserved.</p>
          <a href="/admin" className="transition-colors hover:text-cream-200/80">
            Staff Login
          </a>
        </div>
      </div>
    </footer>
  );
}
