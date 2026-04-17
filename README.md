# Kervan Isıl İşlem — kervanheat.com

Astro 5 + TypeScript + Tailwind v4 + React + Three.js (R3F) + Cloudflare Pages.

**Domain:** kervanheat.com · **Hosting:** Cloudflare Pages (GitHub integration)

## Development

```bash
npm install          # first time
npm run dev          # localhost:4321
npm run check        # astro check (TS + content schema)
npm run build        # dist/
npm run preview:pages # wrangler pages dev — full Pages Functions locally
```

## Project structure

See `CLAUDE.md` for canonical project rules and file tree.

## Deploy

`main` → Cloudflare Pages production (`kervanheat.com`).
`develop` / `feature/*` → preview deployments.

Legacy vanilla HTML/JS site archived in `legacy-backup/` — kept in git history for reference and 301 redirect mapping.
