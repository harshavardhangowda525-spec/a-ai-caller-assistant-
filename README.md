# 🌌 Liquid Glass — Café & Event OS

A premium, futuristic **Café + Event Management billing & business platform** with a
sophisticated **Liquid Glass / glassmorphism** interface. One unified operating
system for cafés *and* event companies — POS, billing, inventory, events,
quotations, invoices, payments, expenses, profit and reporting.

> **Runs instantly, no setup.** The app ships with a fully interactive in-browser
> demo store (seeded with a realistic café + event business), so every workflow —
> POS billing, GST calculation, quotation → invoice conversion, advance/balance
> payments, event profit — actually works the moment you run it. A complete
> PostgreSQL / Supabase schema (with Row Level Security) is included for the
> production, multi-tenant path.

---

## ✨ Features

### ☕ Café Management
- **POS billing** — touch-friendly, category navigation, live order panel, discount,
  configurable GST, hold / save / pay, receipt generation, automatic stock decrement.
- **Tables** — visual floor plan with Available / Occupied / Reserved / Cleaning
  status; add order, transfer, merge, close, generate bill.
- **Products** — full CRUD catalog with categories, SKU, cost/price, stock.
- **Inventory** — stock valuation, low-stock & out-of-stock tracking, restocking.
- **Orders** — searchable order history with receipts.

### 🎉 Event Management
- **Multi-step event creation** — customer → details → package/services → pricing →
  advance → confirmation, generating an invoice automatically.
- **Packages & Services** — unlimited configurable offerings.
- **Quotations** — professional documents, print / PDF / share, **convert to invoice**.
- **Event billing** — clean printable invoices with advance & balance.
- **Payments** — record advance & balance payments per event.
- **Expenses** — per-event & operating expenses, with **automatic profit** calculation
  (revenue − expenses).
- **Calendar** — month view + upcoming timeline.

### 🧩 Platform
- **Dashboard** — 6 animated KPI cards + revenue, category, payment & performance charts.
- **Unified customers** — shared café + event database with per-customer profile tabs.
- **Invoice & receipt center** — Café Receipts / Café Invoices / Event Quotations /
  Event Invoices, with search, status & date filters, duplicate, print, PDF.
- **Centralized payments** — received / pending / advance / refunds, all methods.
- **Reports** — café & event dashboards with date ranges, charts, CSV & PDF export.
- **Configurable GST/Tax** — CGST/SGST/IGST, inclusive/exclusive, never hardcoded.
- **Global command palette** — `⌘K` / `Ctrl+K` fuzzy search across everything.
- **Quick Add** — floating action menu for every create flow.
- **Notifications** — low stock, upcoming events, pending payments, and more.
- **Role-based access** — Owner / Manager / Cashier / Event Staff, previewable via the
  in-app role switcher.
- **Light & Dark** Liquid Glass themes, remembered per browser.
- Fully **responsive** — desktop, tablet & mobile (sidebar collapses to a bottom nav).

---

## 🎨 Liquid Glass Design System

- Translucent frosted-glass panels with strong backdrop blur, soft borders, inner
  highlights, large rounded corners and layered transparency.
- A slow-moving ambient gradient-blob background that looks like light through liquid glass.
- Subtle micro-interactions: cards lift on hover, modals fade & scale, KPI numbers count
  up, charts animate in — never at the expense of readability or billing speed.
- Documents (receipts, invoices, quotations) deliberately switch to a clean,
  high-contrast, print-ready layout.

All theming is driven by CSS variables in `src/app/globals.css`, so both themes stay
consistent and readable.

---

## 🚀 Getting started

```bash
npm install
npm run dev
# open http://localhost:3000  →  redirects to /dashboard
```

That's it — the app is fully functional on demo data. Try:

1. **Café POS** → add products, apply a discount, pick GST, **Pay Now** → stock drops,
   a receipt & payment are created.
2. **Events → New event** → walk the 6-step wizard → an invoice is generated.
3. **Quotations → New quotation** → **Convert to invoice**.
4. **Reports** → switch Café/Events, change the range, **export CSV**.
5. Top-right **profile menu** → switch role to see access change.
6. **Settings → Data** → reset or clear the demo data.

### Scripts
| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | TypeScript check |

---

## 🗄️ Database (production path)

The web app uses an in-browser store by default. To run it multi-tenant on a real
database, a complete PostgreSQL / Supabase schema is provided:

- `supabase/migrations/0001_schema.sql` — all tables (businesses, users, customers,
  products, categories, inventory_transactions, cafe_tables, cafe_orders,
  cafe_order_items, event_packages, event_services, events, event_quotations,
  event_quotation_items, invoices, invoice_items, payments, expenses, notifications,
  settings) with foreign keys, indexes, enums, checks and timestamps.
- `supabase/migrations/0002_rls.sql` — **Row Level Security** so a business can *never*
  access another business's data, plus owner/manager write gating on sensitive tables.
- `supabase/seed.sql` — a demo business + catalog to bootstrap the DB path.

Apply them via the Supabase SQL editor or CLI, set the variables in `.env.example`,
then swap the store's read/write layer for Supabase queries.

---

## 🧱 Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript** (strict)
- **Tailwind CSS** with a custom Liquid Glass token system
- **Recharts** for glass-styled analytics
- **lucide-react** icons
- **PostgreSQL / Supabase** schema + RLS for the production path

---

## 📁 Project structure

```
src/
  app/(app)/            All feature pages (dashboard, pos, tables, orders,
                        products, inventory, events, quotations, packages,
                        services, calendar, expenses, customers, invoices,
                        payments, reports, notifications, settings)
  components/           Glass UI kit, charts, KPI cards, shell (sidebar, top bar,
                        command palette, quick add), printable documents
  lib/                  types, store (context + localStorage), demo data,
                        money/GST engine, selectors, status maps, numbering, export
supabase/               SQL schema, RLS policies and seed
```
