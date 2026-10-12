# Design system, motion, accessibility

<!-- Moved verbatim from CLAUDE.md (which points here). Keep it current: read it before working on this area and update it with the change. -->

## Design system

`packages/ui/src/tokens.css` is the single source of truth. Use Tailwind token utilities / CSS variables; never hardcode hex values in components.

- **Contrast:** every text token must stay >= 4.5:1 on `bg`, `bg-soft` and `bg-warm` (`ink-soft` is `#918879` for that reason; check with the WCAG formula before changing it). Form fields use `border-ink-soft` (UI boundaries need 3:1). The WhatsApp button uses `bg-whatsapp` (`#128c7e`, white glyph 4.1:1), not the bright brand green; the shop, whose WhatsApp buttons carry 14 px text, overrides it to `#0f7a6e` (white 5.21:1) in its `globals.css`.
- **Palette ("Mood C", dark):** `bg #0A0A0B`, `bg-soft #141416`, `bg-warm #1C1C20`; `ink #E8E2D6`, `ink-mid #B8AFA0`, `ink-soft #7A7066`; brand "Forge Ember" `#E8431B` (`brand-hi #FF5C32`, `brand-lo #C53614`).
- **Type:** display Fraunces (`--font-serif`), body/UI Inter (`--font-sans`), loaded from Google Fonts in each app's `index.html`. The Fraunces request must include the italic axis (`ital,opsz,wght@0,…;1,…`), otherwise the browser fakes the italics the headings rely on; the unused `SOFT` axis is not requested.
- **Radius:** 6 / 14 (cards) / 20 (large surfaces) / 999px (pills, buttons).

## Motion

- One ease: `--ease-editorial` = `cubic-bezier(0.22, 1, 0.36, 1)` (`editorialEase` in `@kervan/motion`). Prefer the shared variants over ad-hoc ones.
- Durations: micro 150ms, small 250ms, medium 400ms, large 600ms. Nothing longer than 600ms unless it is a deliberate hero moment. Stagger children 60–80ms.
- In-view reveals animate once (`{ once: true, amount: 0.3 }`); no more than 3 simultaneous animations on screen.
- **`useReducedMotion` is mandatory** in every animated component — short-circuit to the static state. Import it only from `@kervan/motion`, never from `framer-motion`. `globals.css` also has a `prefers-reduced-motion` floor.
- Static vs animated mode: the prerendered HTML is the final static state (no intro, OpeningHold or 3D canvas, no inline hiding). An inline `<head>` script adds `js-anim` to `<html>` only for JS-running humans without reduced motion (bots/headless/webdriver excluded). With `js-anim`, `main.tsx` does `createRoot` (today's animated site; `#root[data-prerendered]` is hidden until the first render); otherwise it `hydrateRoot`s in static mode (`StaticMotionProvider`, where `useReducedMotion()` is true) and must match the server markup exactly. Heavy effects (the 3D scene) mount client-side only.
- Intro: each app's `IntroOverlay` shows once per session (`sessionStorage`). Hero sequences must account for it (delay until it finishes, or skip the delay when the session flag is set).

## Accessibility

- WCAG AA contrast: 4.5:1 body text, 3:1 large text and non-text UI.
- Focus ring: `2px solid` brand with `outline-offset: 2px` (`focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2`). Restyle focus rings, never remove them.
- Every interactive element (buttons, links, form fields, carousel/gallery controls, language toggle, menu) must be keyboard-reachable and Enter/Space-activatable.

## 21st.dev Magic usage

- Start with `21st_magic_component_inspiration`; never generate cold.
- Never accept output verbatim: convert to this repo's conventions — map colors/spacing to `@kervan/ui` tokens, use `@kervan/ui` components where they exist, replace `lucide-react` with inline SVG or the `Icon` component, and apply the motion contract above.
- Brand logo bars: `logo_search` against Atlas Copco, Furukawa, Soosan, Montabert, Indeco, Rammer, Epiroc, Sandvik, NPK, Toku, Kobelco, Hanwoo (existing logos: `apps/breaker-parts/public/brand-logos/`).
