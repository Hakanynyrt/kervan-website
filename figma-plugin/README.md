# Kervan Heat — Figma Design Generator

A Figma plugin that generates the complete Kervan Heat website design in Figma — desktop (1440px) + mobile (375px) frames, with variables, components, auto-layout, and the full `industrial-heavy` design system.

## What it creates

- **Variable collection**: `Kervan Brand` with 12 color variables (bg/0…3, text/1…3, brand/base/hi/lo, steel/base/hi)
- **Desktop page** (💻 Desktop · 1440): one 1440-wide frame with navbar, hero (split layout + engineering drawing), parts grid (chisel hero + 6 satellite cards), services section (facility card + 6 numbered processes), WhatsApp + Instagram buttons, 3-column footer, tagline strip, copyright
- **Mobile page** (📱 Mobile · 375): one 375-wide frame with stacked layout of all sections

All frames use auto-layout, matched CSS tokens, Space Grotesk / Inter / JetBrains Mono typography, and the dark industrial palette from `ui-ux-pro-max` skill.

## How to run

1. Download this folder (`figma-plugin/`) to your local machine
2. Open Figma desktop app (not web — plugins in development only work in the desktop app)
3. Create a new blank Figma file (or open an existing one)
4. Menu → **Plugins → Development → Import plugin from manifest…**
5. Select `manifest.json` from this folder
6. Menu → **Plugins → Development → Kervan Heat Design Generator**
7. Wait ~10–20 seconds — the plugin will create both pages with full designs
8. Check the two new pages in the sidebar

## What you'll see

- Real auto-layout frames (not just flat rectangles)
- Editable text styles
- Color variables attached to the Brand collection
- Components you can detach, modify, or reuse
- Pixel-accurate layouts matching the live site at kervanheat.com

## Structure

```
figma-plugin/
├── manifest.json   # Figma plugin manifest
├── code.js         # Main plugin (~800 lines)
└── README.md       # This file
```

## Notes

- The chisel drawings in the hero are simplified (polygons for the tip, rectangles for the body) — for a pixel-perfect engineering drawing with ruler marks, export the SVG from the live site and import it manually
- Fonts must be installed locally (Space Grotesk, Inter, JetBrains Mono) — Figma will substitute them if not available, but the design will look different
- Re-running the plugin creates new pages each time; delete old ones first if you want to regenerate
