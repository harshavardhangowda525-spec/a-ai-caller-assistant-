# Tribal Brew Daily

A premium, immersive **Liquid Glass** website for **Tribal Brew Daily**, a
specialty coffee café on Church Street, Bengaluru — with a secure admin
dashboard and an in-house billing / POS system.

> Coffee with a story. Specialty coffee sourced from tribal farms, crafted with
> passion in the heart of Church Street.

## Stack

- **Next.js 14** (App Router) · **React 18** · **TypeScript**
- **Tailwind CSS** — custom espresso/copper/cream Liquid Glass design system
- **Framer Motion** — scroll reveals, parallax, magnetic buttons, spring motion
- **Supabase / PostgreSQL** — live content + orders (optional; graceful fallback)
- **jose** — signed admin session cookies
- Production-ready for **Vercel**

## Highlights

**Public site** (`/`) — cinematic hero with animated steam, floating glass
navigation, coffee journey, horizontal signature-coffee carousel, food pairing,
parallax café experience, events, a review wall (genuine themes only — no
invented reviews), filterable masonry gallery with a glass lightbox, editorial
about, interactive map/location, and a large glass footer. Fully responsive with
a full-screen mobile menu, SEO metadata, Open Graph, `CafeOrCoffeeShop`
schema.org JSON-LD, sitemap and robots.

**Admin dashboard** (`/admin`) — secure, separate console:

- **Dashboard** — today's orders, revenue, popular items, upcoming events, recent activity
- **Billing / POS** — product grid, cart, quantity, discounts, tax, payment method, printable invoice, daily & monthly sales
- **Orders** — status workflow, history, customer info
- **Menu / Events / Gallery** — full create · edit · delete
- **Website Content** — edit hero, about, coffee story, hours, contact, socials, and the ordering URL

Billing exists **only** inside the admin — never exposed to public visitors.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — the app runs without it
npm run dev
```

Open http://localhost:3000 (site) and http://localhost:3000/admin (console).

**Demo login:** `admin` / `tribalbrew` (override with `ADMIN_USERNAME` /
`ADMIN_PASSWORD`). Set a strong `AUTH_SECRET` in production.

Without Supabase, the site renders from `src/lib/seed-data.ts` and the admin runs
in read-only **demo mode**. To enable live content and persistence:

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql`, then `0002_rls.sql`, then `supabase/seed.sql`.
3. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

## Imagery

Photography lives in `/public/images` and is referenced by path, so every image
is swappable from the admin **Gallery** and **Menu** editors. The `SmartImage`
component keeps a warm coffee gradient behind every slot, so missing images
never break the layout.

## The ordering URL is configurable

`ORDER ONLINE` never hard-codes a provider — it reads the admin-editable
`orderingUrl`. Change it any time under **Website Content**.
