# CLAUDE.md

Guidance for Claude Code in this repository. This file holds the rules that always apply and a map;
the details of each area live in `docs/agent/` and must be read before working on that area.

## Overview

pnpm + Turborepo monorepo for Kervan Makina's websites:

| App                    | Domain                                       | Cloudflare Pages project |
| ---------------------- | -------------------------------------------- | ------------------------ |
| `apps/heat-treatment/` | kervanheat.com + www (fason ısıl işlem)      | `kervan-heat-treatment`  |
| `apps/breaker-parts/`  | kervanbreaker.com + www (kırıcı parçaları)   | `kervan-breaker-parts`   |
| `apps/parts-shop/`     | kiriciparca.com (www., magaza., shop. → 301) | `kervan-parts-shop`      |

All apps are Vite 5 + React 18 + TypeScript + Tailwind v4 + Framer Motion, sharing code through
`packages/*` (`@kervan/ui`, `@kervan/motion`, `@kervan/seo`, `@kervan/tips`).

## Read before you work on an area

| Area                                                                                        | Read                           |
| ------------------------------------------------------------------------------------------- | ------------------------------ |
| kiriciparca.com shop: pages, parts and renders, prices, cart, search, SEO, D1 data, opening | `docs/agent/parts-shop.md`     |
| kervanbreaker.com: pages, 3D scene, shop links, private VEGA catalog                        | `docs/agent/breaker-parts.md`  |
| kervanheat.com: sections, hero film, service links                                          | `docs/agent/heat-treatment.md` |
| Packages, deploying, RFQ form, Google Ads, owner login, i18n, prerender/sitemap, media      | `docs/agent/platform.md`       |
| Tokens, palette, type, motion, accessibility                                                | `docs/agent/design.md`         |
| Owner's ready-made prompts (Turkish)                                                        | `docs/komut-kaliplari.md`      |

When a change alters what one of these files says, update that file in the same PR.

## Commands

```bash
pnpm install                                   # whole workspace
pnpm --filter @kervan/heat-treatment dev       # http://localhost:5173
pnpm --filter @kervan/breaker-parts dev        # http://localhost:5174
pnpm --filter @kervan/parts-shop dev           # http://localhost:5175 (DEMO catalog)
pnpm turbo build --filter=@kervan/<app>
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
pnpm format                                    # Prettier (.prettierrc.json)
```

Before pushing, run typecheck, lint, format:check, test and a build of the affected app: the
deploy's `verify` job runs the same four and blocks every deploy.

## Deploying (summary; details in `docs/agent/platform.md`)

- GitHub Actions (`.github/workflows/deploy.yml`, `wrangler pages deploy`) is the only deployer.
- Push to `main` → production deploy of all apps, then `.github/scripts/smoke.sh`.
- A PR gets Pages previews (`https://<branch>.<project>.pages.dev`) of the changed apps;
  `packages/**`, the lockfile or root configs rebuild every app.
- `.github/workflows/uptime.yml` runs the smoke probe every 15 minutes; `shop-daily.yml` rebuilds
  the shop each morning.

## Rules that always apply

- **No direct commits to `main`**: it deploys to production. Conventional commits with an
  app/area scope (`feat(shop): …`, `fix(rfq): …`, `docs: …`).
- **The repo and CI logs are public.** Never commit or print: prices, the price sheet or pricing
  policy, `SHOP_SHEET_KEY`, repair-kit sizes, the `TECH_CONTENT` text, the VEGA catalog / drawings
  / `popular:v1` data, source drawings, tokens or passwords. Data scripts print counts only and
  write outside the repo. `scripts/secret-guard.mjs` enforces this: a Claude Code hook
  (`.claude/settings.json`) runs it before every `git commit` / `git push`, and `verify` runs it on
  every PR and push. Never bypass it; if it blocks a false positive, narrow its rule in a PR.
- Tip codes (`KU{Ø}-{NN}`, SKU suffixes) are permanent: never renumber or reuse. No third-party
  catalogue names on the sites or in shop identifiers, and no third-party part numbers, except
  genuine OEM numbers in the shop's "Muadil OEM no." field (owner's decision; confirmed numbers
  only, `apps/parts-shop/src/lib/oem-numbers.ts`, never in JSON-LD `mpn`/`sku`). Never VEGA
  (`VT…`) numbers, Kervan drawing numbers or repair-kit codes.
- Never invent references, customer names or numbers on the sites.
- Never POST to `/api/tech/login` from CI or probes.
- Images are cached immutable: a changed picture gets a **new file name** (`-02`, `-v2`).
- All user-facing text goes through each app's `src/lib/dict.ts` (TR primary, EN secondary),
  including `aria-label`s.
- The shop's look: light, formal, corporate; never the "AI look" (no eyebrow kickers, glows,
  gradients, serif italics, pill buttons). Renders keep their ember rim light.

## Working with the owner

- Reply in Turkish, plainly; the owner is not a developer.
- Open PRs as drafts. Merge only when the owner says "merge et" (after CI is green), then check
  the live site.
- Wait for explicit approval before each major step; show screenshots or diffs first.
- Browser and dashboard work (Search Console, Google Ads / Tag Assistant, Cloudflare, Pages
  settings, live-site clicking) is always handed to the owner as a ready-to-paste **Cowork prompt**
  in a code block (owner rule), never done by asking the owner to click through steps.
- Never ask the owner to paste a token, password or the price sheet into the chat.
- When a request matches a template in `docs/komut-kaliplari.md`, end the reply with one line
  naming it (e.g. "İpucu: bir dahaki sefere B2 kalıbını kullanabilirsiniz"); the owner asked to be
  reminded of the templates when they apply.
