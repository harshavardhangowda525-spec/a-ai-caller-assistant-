# ☕ Æther Roasters — 3D Animated Cafe Website

An immersive, single-page cafe website with a real-time 3D scene: a procedurally
built coffee cup with rising steam, orbiting coffee beans, warm cinematic
lighting, and scroll-driven camera choreography.

## ✨ Features

- **Live 3D scene** (Three.js) — a ceramic coffee cup with saucer + handle,
  animated steam particles, and 14 floating coffee beans orbiting the cup.
- **Scroll choreography** (GSAP + ScrollTrigger) — the camera flies through the
  page and the cup scales/drifts as you scroll between sections.
- **Cinematic lighting & fog** — warm key light, orange rim light, cool fill.
- **Mouse parallax** — the cup and camera react subtly to the pointer.
- **Polished UI** — sticky glass nav, animated stat counters, hover-glow menu
  cards, gallery, and a working reservation form.
- **Responsive** and **accessible** — respects `prefers-reduced-motion` and
  degrades gracefully if WebGL is unavailable.

## 🗂 Files

| File         | Purpose                                             |
|--------------|-----------------------------------------------------|
| `index.html` | Page structure & content                            |
| `styles.css` | All styling, layout, and 2D animations              |
| `main.js`    | Three.js 3D scene + GSAP scroll & UI logic          |

Libraries (Three.js r128, GSAP 3.12, ScrollTrigger) load from CDN — no build
step or install required.

## ▶️ Run it

It's a static site. Open `index.html` directly, or serve the folder:

```bash
cd cafe-website
python3 -m http.server 8000
# then visit http://localhost:8000
```

A local server is recommended so the CDN scripts and fonts load cleanly.

## 🎨 Customizing

- **Colors** — edit the CSS variables at the top of `styles.css` (`:root`).
- **Cup / beans / steam** — tweak geometry, counts, and speeds in the
  `buildCup`, `buildBeans`, and `buildSteam` functions in `main.js`.
- **Menu / content** — edit the markup in `index.html`.
