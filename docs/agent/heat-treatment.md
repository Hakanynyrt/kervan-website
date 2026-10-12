# heat-treatment (kervanheat.com)

<!-- Moved verbatim from CLAUDE.md (which points here). Keep it current: read it before working on this area and update it with the change. -->

## heat-treatment (kervanheat.com)

- Single-page site (served at `/` and `/en/`): `src/App.tsx` composes the sections in `src/components/` (Hero, Services, TechnicalCapacity, Craft, About, Contact, Footer, …). No router, no 3D.
- `src/components/HeroFilm.tsx` — the hero's framed furnace loop (`/videos/isil-islem/firin-hatti-loop-01*`). Static mode renders only the poster `<picture>`; the `<video>` mounts client-side after the hero sequence (`startAt = t0 + 2`, keep in sync with the stats stagger), on 4g without Save-Data, when the card is on screen, and starts at `START_AT` = the poster frame (re-extract both posters if that changes). Below `lg` it sits before the stats so phones see it on the first screen; a load/decode error (404, no H.264) falls back to the plain poster without the button. The pause button is required (WCAG 2.2.2). Any re-encode gets a new filename.
- "Tesisimiz" (`Craft.tsx`) shows the dict's `craft.photos` (`/photos/isil-islem/<base>-640/-1080.webp`, 4:5, four distinct shots). All hero/plant media is cut from our own `public/videos/atolye/furnace-01.mp4` (the other clips are breaker parts); a changed image gets a new filename (`-02`).
- **`functions/api/rfq.ts`** — the only server-side code in the repo, a Cloudflare Pages Function. It is the RFQ endpoint for **both** sites (see below).
- The "Üretim & Entegrasyon" service card's last bullets link kervanbreaker.com ("Katalog") and kiriciparca.com ("Online mağaza") (`ServiceLink` bullets in the dict); the footer links both sister sites (same tab, no `rel`).
- `public/_redirects` 301s legacy breaker URLs (`/keski`, `/catalog.html`, `/products/*`, …) to kervanbreaker.com.
