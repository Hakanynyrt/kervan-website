# CLAUDE.md — Kervan Isıl İşlem Website

This file documents the codebase structure, conventions, and workflows for AI assistants working on this repository.

## Project Overview

Corporate website for **Kervan Isıl İşlem** (Kervan Heat Treatment), a Turkish industrial heat treatment company. The site is a **single-file static website** with no build step or dependencies.

- **Domain**: kervanmakina.com.tr
- **Hosting**: Cloudflare Pages (auto-deploys on push to `main`)
- **Language**: Turkish throughout (UI content, comments, commit messages)

## Repository Structure

```
kervan-website/
├── index.html      # Entire application: HTML + CSS + JS (≈1030 lines)
├── favicon.svg     # Brand icon (orange flame)
└── README.md       # Brief Turkish project description
```

There are no subdirectories, package managers, build tools, or dependency files.

## Architecture

Everything lives in `index.html`:

| Lines | Content |
|-------|---------|
| 1–27 | `<head>`: meta tags, SEO, Open Graph, Google Fonts |
| 28–586 | `<style>`: all CSS (variables, components, responsive) |
| 587–839 | `<body>`: all HTML sections |
| 840–1029 | `<script>`: all JavaScript (vanilla, no imports) |

### Page Sections (anchor-based routing)

| Anchor | Turkish Name | Description |
|--------|-------------|-------------|
| `#hizmetler` | Hizmetler | 6 service cards with modals |
| `#surec` | Süreç | 6-step process workflow |
| `#kapasite` | Kapasite | 4 animated stat counters |
| `#sektorler` | Sektörler | 9 industry sector tags |
| `#iletisim` | İletişim | Contact info + Google Maps embed |

## CSS Conventions

### Custom Properties (Design Tokens)

```css
--brand: #E8781A          /* Primary orange */
--bg-0: #0C0C0E           /* Deepest background */
--bg-1/2/3                /* Surface hierarchy */
--text-1/2/3              /* Text hierarchy */
--radius-sm/md/lg/xl      /* Border radius scale */
```

### Naming Conventions

- BEM-like hyphenated class names: `.svc-card`, `.svc-card--interactive`
- State modifiers use `--` separator: `.svc-modal--open`, `.nav--scrolled`
- Turkish abbreviations used: `svc` = service/hizmet, `nav` = navigation

### Responsive Breakpoints

- Mobile-first design
- `768px`: tablet layout
- `1024px`: desktop layout
- `480px`: small mobile adjustments

### Section Comments

CSS sections are delimited with visual separators:
```css
/* ═══ SECTION NAME ═══ */
```

## JavaScript Conventions

- **Vanilla JS only** — no frameworks, no imports
- **`var` declarations** — not `const`/`let` (existing style, preserve it)
- DOM selection via `document.querySelectorAll()` and `getElementById()`
- `IntersectionObserver` used for scroll-triggered fade-in animations
- `requestAnimationFrame` used for counter animations
- Service modals controlled via `data-svc` attributes on cards

Key functions in the script block:
- Navigation scroll behavior (`nav--scrolled` class toggle)
- Hamburger menu open/close
- Service modal open/close (reads `data-svc` to populate content)
- Scroll-triggered animations (`fade-up` class)
- Animated stat counters (`animateCounter`)
- Trust bar infinite scroll marquee cloning

## HTML Conventions

- Semantic HTML5 elements (`<section>`, `<nav>`, `<footer>`, `<dialog>`-style modal)
- ARIA attributes for accessibility: `aria-hidden`, `aria-label`, `role="dialog"`, `tabindex`
- `data-*` attributes drive JS behavior (e.g., `data-svc="karbonlama"`)
- Google Maps embedded via `<iframe>`

## Deployment

Push to `main` → Cloudflare Pages auto-deploys to kervanmakina.com.tr.

**No build step required.** Changes to `index.html` are live after deploy.

## Development Workflow

Since there is no build system:

1. Edit `index.html` directly
2. Open in browser to verify (or use a local HTTP server: `python3 -m http.server`)
3. Commit and push to `main` to deploy

There are no tests, linters, or pre-commit hooks.

## Key External Resources (Hardcoded)

| Resource | Value |
|----------|-------|
| WhatsApp | +90 531 669 37 34 / `wa.me/905316693734` |
| Address | Sadun Atığ Cad. No: 112/A, Kartepe / Kocaeli |
| Instagram | @kervanmakina |
| Hours | Monday–Saturday, 08:00–18:00 |
| Google Fonts | Plus Jakarta Sans, Space Grotesk, IBM Plex Mono |

## Guidelines for AI Assistants

- **Do not introduce build tools or dependencies** unless explicitly requested — the zero-dependency nature is intentional.
- **Preserve `var` declarations** in the JS block to keep style consistent.
- **Keep all content in Turkish** — this is a Turkish-language site.
- **Do not split into multiple files** without explicit instruction — the single-file approach is a deliberate design choice for simplicity and performance.
- **Maintain CSS variable usage** — do not hardcode colors or spacing values that are already defined as tokens.
- **Test visually in a browser** — there is no automated testing.
- **Push to `main` to deploy** — no staging environment exists.
- **Respect accessibility attributes** — keep ARIA roles and labels when editing HTML structure.
- **Section comments** — maintain the `/* ═══ NAME ═══ */` comment style for new CSS sections.
