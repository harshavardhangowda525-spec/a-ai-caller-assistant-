# Secrete Celebration Cafe — Website

A 5-page responsive website for a modern specialty coffee cafe, built with a
**liquid glass / glassmorphism** design language: frosted translucent panels
(`backdrop-blur`), warm ambient gradients (cream → amber → deep brown → soft
pastel light), rounded corners, inner-glow highlight edges, and soft drop
shadows.

Pure **static HTML, CSS and vanilla JS** — no build step, no dependencies.
Just open the files in a browser.

## Pages

| File | Page | Highlights |
|------|------|-----------|
| `index.html` | **Home** | Hero with floating glass badge cards, featured menu (6 glass cards), About teaser, testimonials carousel, Instagram grid, newsletter band |
| `menu.html` | **Menu** | Coffee / Tea / Pastries / Seasonal categories in glass panels, prices, dietary tags (vegan / gluten-free), hot / cold / food filter tabs |
| `about.html` | **About** | Story split layout, founder & team cards, ethical-sourcing glass callout, vertical milestone timeline |
| `gallery.html` | **Gallery** | Masonry photo grid, glass-framed thumbnails, click-to-open lightbox (keyboard + arrow nav), embedded Instagram section |
| `contact.html` | **Contact** | Glass contact / booking form, map placeholder, address / hours / phone / email info cards, social links, order-online CTA |

## Structure

```
cafe-site/
├── index.html      menu.html      about.html
├── gallery.html    contact.html
├── css/styles.css  ← design tokens + all glass components
├── js/main.js      ← nav, scroll-reveal, carousel, lightbox, tabs, forms
└── assets/         (reserved — imagery is CSS-generated, self-contained)
```

## Design system (in `css/styles.css`)

All values live as CSS custom properties on `:root` and are reused site-wide:

- **Colors** — warm palette (`--cream`, `--amber`, `--caramel`, `--espresso`) + soft pastels
- **Glass** — `--glass-bg`, `--glass-border`, `--glass-highlight`, reusable `.glass` surface with inner-glow highlight edge
- **Blur** — `--blur-sm/md/lg` (8 / 16 / 28px)
- **Radii** — `--r-sm … --r-xl`, `--r-pill`
- **Spacing** — `--s-1 … --s-8` scale
- **Shadows / glow** — `--shadow-sm/md/lg`, `--glow-inner`

## Notable details

- **Shared sticky glass navbar & footer** on every page, with a mobile hamburger menu
- **Typography** — Inter (body) + Fraunces (display accents), loaded from Google Fonts
- **Scroll animations** — `IntersectionObserver` fade/slide-in (`.reveal`)
- **Accessibility** — semantic HTML, ARIA labels, keyboard-navigable lightbox & carousel, visible focus, `prefers-reduced-motion` support, contrast kept readable over the glass
- **Mobile-first responsive** — grids collapse cleanly down to a single column
- **Self-contained imagery** — all photos are CSS gradient "photography" presets (`.ph-latte`, `.ph-espresso`, …), so the site works fully offline. Swap any `.photo` element's background for a real image when you have final photography.

## Run it

No server needed — open `cafe-site/index.html` in any modern browser. To serve
locally instead:

```bash
cd cafe-site
python3 -m http.server 8080
# then visit http://localhost:8080
```
