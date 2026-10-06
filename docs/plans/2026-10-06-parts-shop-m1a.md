# Parts Shop M1a — Foundation and Data Pipeline Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Put a working, `noindex` catalog of every Kervan breaker tip on `magaza.kervanbreaker.com`: a home page with best-sellers first, a full tip list and one page per tip family, built from the owner's measurement data held in Cloudflare D1. There is no checkout and no server code.

**Architecture:**

- A new pnpm workspace package `@kervan/tips` holds pure, unit-tested logic:
  - tip types and Kervan codes;
  - the mapping from the owner's catalog JSON to shop rows;
  - the SQL generator for the D1 import;
  - the public projection (a whitelist of published, public fields);
  - the carrier-tonnage table, moved out of breaker-parts.
- A manual GitHub workflow imports the owner's catalog from KV into D1 `kervan-shop`. The data never touches the repository.
- At deploy time CI queries D1 and writes `.catalog/catalog.json` (gitignored) through the projection. A new static app `apps/parts-shop` prerenders one HTML file per page and language with its page props embedded, and the client hydrates them.
- Navigation is plain links, so there is no client router. Without credentials (local work, fork PRs) the build uses an obviously fake DEMO catalog.

**Tech Stack:**

- pnpm 10 + Turborepo 2.
- Vite 5, React 18, TypeScript 5, Tailwind v4 with `@kervan/ui` tokens, `@kervan/seo` head helpers.
- Node 22 built-in test runner (`node --experimental-strip-types --test`).
- Cloudflare D1 + KV via `wrangler` ^4.83, Cloudflare Pages Direct Upload, GitHub Actions.

**Decisions this plan implements:** K1–K7 in the private design doc "Kervan Mağaza Tasarımı" (https://claude.ai/artifact/Mq6Z6Q8svGovDzmqoZfS3q).

- Address `magaza.kervanbreaker.com` (`shop.` redirects to it).
- Bank transfer only (M2).
- USD price list (M1d/M2).
- All tips, best-sellers first.
- Kervan codes only: no third-party catalogue names or part numbers anywhere public, **including this repository's code identifiers**.

**Out of scope (later plans):**

- **M1b:** tip finder (3 ways), type listings, breaker brand/model pages, RFQ quote form, draft legal pages.
- **M1c:** 3D posters from `@kervan/tips/geometry`.
- **M1d:** Access-protected admin for price, lead time and publish, plus "Yayınla".
- **M2:** cart, bank-transfer checkout, orders.

---

## File map

| Path                                                    | Responsibility                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `packages/tips/package.json`, `tsconfig.json`           | New workspace package `@kervan/tips` (source-only, like `@kervan/seo`)             |
| `packages/tips/src/types.ts`                            | `TipType`, labels, letters, slugs, `Range`, `FamilyAttrs`, public catalog types    |
| `packages/tips/src/codes.ts`                            | `familyCode`, `skuCode`, `assignFamilyCodes` (stable codes)                        |
| `packages/tips/src/slug.ts`                             | `slugify` (Turkish-safe)                                                           |
| `packages/tips/src/breakers.ts`                         | `splitBreakerName`, `breaker` (brand/model/slug)                                   |
| `packages/tips/src/usage.ts`                            | `carrierTons` (moved from breaker-parts)                                           |
| `packages/tips/src/from-catalog.ts`                     | Owner catalog rows → `ImportFamily[]`                                              |
| `packages/tips/src/sql.ts`                              | `toImportSql` (idempotent upserts; keeps codes and owner flags)                    |
| `packages/tips/src/public.ts`                           | `toPublicCatalog` (D1 rows → `PublicCatalog`, whitelist only)                      |
| `packages/tips/src/demo.ts`                             | `demoCatalog()` (invented rows, `demo: true`)                                      |
| `packages/tips/src/index.ts`                            | Barrel                                                                             |
| `packages/tips/src/*.test.ts`                           | Unit tests                                                                         |
| `apps/parts-shop/migrations/0001_init.sql`              | D1 schema (schema only, never data)                                                |
| `apps/parts-shop/scripts/shop-import.ts`                | CLI: catalog JSON (+ best-seller list, existing codes) → SQL file outside the repo |
| `apps/parts-shop/scripts/build-catalog.ts`              | CI: D1 → `.catalog/catalog.json`; locally: DEMO                                    |
| `apps/parts-shop/scripts/prerender.mjs`                 | Writes `dist/**.html` with embedded page props                                     |
| `apps/parts-shop/scripts/check-dist.mjs`                | Fails the build if a page lacks `noindex`/props, or if forbidden strings appear    |
| `apps/parts-shop/src/**`                                | App (`App`, `Layout`, pages, dict, routes, head, format)                           |
| `apps/parts-shop/public/*`                              | `_headers`, `_redirects`, `robots.txt`, favicons                                   |
| `.github/workflows/shop-import.yml`                     | Manual KV → D1 import                                                              |
| `.github/workflows/deploy.yml`                          | `parts-shop` filter, job, dispatch option, `pnpm test` in verify                   |
| `.github/scripts/smoke.sh`                              | Shop up and still `noindex`                                                        |
| `apps/breaker-parts/src/lib/vega-usage.ts`              | Re-exports `carrierTons` from `@kervan/tips`                                       |
| `CLAUDE.md`, `.gitignore`, `package.json`, `turbo.json` | Docs, ignore `.catalog/`, `test` task                                              |

---

### Task 0: Owner setup in Cloudflare and GitHub (blocking before merge; give the owner a Cowork prompt)

**Files:** none (dashboard work). The executing agent writes the Cowork prompt; Cowork never enters passwords or 2FA.

- [ ] **Step 1: Cloudflare (dashboard).**
  1. Workers & Pages → D1 → Create database `kervan-shop` (location: Eastern Europe if offered). Note its ID.
  2. Workers & Pages → KV → open the namespace bound to `kervan-breaker-parts` as `VEGA_CATALOG`. Note its namespace ID.
  3. My Profile → API Tokens → Create Custom Token `kervan-shop-data` with two permissions, both on Account → Kervan's account: **D1 Edit** and **Workers KV Storage Read**. No zone permissions; TTL none. Copy the token once.
- [ ] **Step 2: GitHub (repo Settings → Secrets and variables → Actions).**
  - Secret `CLOUDFLARE_SHOP_DATA_TOKEN` = the token from step 1.3.
  - Variable `SHOP_SOURCE_KV_ID` = the namespace ID from step 1.2.
  - Do **not** set `SHOP_REQUIRE_CATALOG` yet; Task 12 sets it.
- [ ] **Step 3: Custom domains.** Do this after the first deploy creates the Pages project (Task 10).
  - Pages → `kervan-parts-shop` → Custom domains → add `magaza.kervanbreaker.com`, then `shop.kervanbreaker.com`.
  - Zone `kervanbreaker.com` → Rules → Redirect Rules → new rule:
    - Hostname equals `shop.kervanbreaker.com`.
    - Dynamic redirect to `concat("https://magaza.kervanbreaker.com", http.request.uri.path)`, 301, preserve query string.

---

### Task 1: `@kervan/tips` package skeleton and test runner

**Files:**

- Create: `packages/tips/package.json`, `packages/tips/tsconfig.json`, `packages/tips/src/index.ts`, `packages/tips/src/smoke.test.ts`
- Modify: `turbo.json`, `package.json` (root)

- [ ] **Step 1: Create the package files**

`packages/tips/package.json`:

```json
{
  "name": "@kervan/tips",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "node --experimental-strip-types --no-warnings --test \"src/**/*.test.ts\""
  }
}
```

`packages/tips/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

`packages/tips/src/index.ts`:

```ts
export {};
```

`packages/tips/src/smoke.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('runner works', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 2: Add the `test` task**

`turbo.json`: add a `test` task inside `"tasks"`:

```json
    "test": {}
```

Root `package.json` `"scripts"`: add `"test": "turbo run test",` after `"lint"`.

- [ ] **Step 3: Install and run**

Run: `pnpm install && pnpm --filter @kervan/tips test`
Expected: `# pass 1`, exit 0. If Node rejects the quoted glob, use `node --experimental-strip-types --no-warnings --test src/` and check that it picks up `.ts` files. Otherwise list the files explicitly with `src/*.test.ts`, unquoted, run from the package directory.

- [ ] **Step 4: Commit**

```bash
git add packages/tips turbo.json package.json pnpm-lock.yaml
git commit -m "chore(tips): add @kervan/tips package with node test runner"
```

---

### Task 2: Types, codes and slugs

**Files:**

- Create: `packages/tips/src/types.ts`, `packages/tips/src/codes.ts`, `packages/tips/src/slug.ts`, `packages/tips/src/codes.test.ts`, `packages/tips/src/slug.test.ts`
- Modify: `packages/tips/src/index.ts`; delete `packages/tips/src/smoke.test.ts`

- [ ] **Step 1: Write the failing tests**

`packages/tips/src/codes.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignFamilyCodes, familyCode, skuCode } from './codes.ts';

test('familyCode pads the sequence and rounds the diameter', () => {
  assert.equal(familyCode(135, 7), 'KU135-07');
  assert.equal(familyCode(99.6, 12), 'KU100-12');
});

test('skuCode appends the tip letter', () => {
  assert.equal(skuCode('KU135-07', 'chisel'), 'KU135-07-C');
  assert.equal(skuCode('KU135-07', 'conical'), 'KU135-07-K');
});

test('assignFamilyCodes numbers new rows per diameter in sort order', () => {
  const codes = assignFamilyCodes(
    [
      { ref: 'b', diameterMm: 135, sortKey: 'Zeta 1' },
      { ref: 'a', diameterMm: 135, sortKey: 'Alpha 2' },
      { ref: 'c', diameterMm: 100, sortKey: 'Beta' },
    ],
    new Map(),
  );
  assert.equal(codes.get('a'), 'KU135-01');
  assert.equal(codes.get('b'), 'KU135-02');
  assert.equal(codes.get('c'), 'KU100-01');
});

test('assignFamilyCodes keeps existing codes and continues after the highest sequence', () => {
  const codes = assignFamilyCodes(
    [
      { ref: 'old', diameterMm: 135, sortKey: 'Zeta' },
      { ref: 'new', diameterMm: 135, sortKey: 'Alpha' },
    ],
    new Map([
      ['old', 'KU135-04'],
      ['gone', 'KU135-09'],
    ]),
  );
  assert.equal(codes.get('old'), 'KU135-04');
  assert.equal(codes.get('new'), 'KU135-10');
  assert.equal(codes.has('gone'), false);
});
```

`packages/tips/src/slug.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from './slug.ts';

test('slugify transliterates Turkish letters', () => {
  assert.equal(slugify('Çağlar Şık Ölçü İĞNE ıüğ'), 'caglar-sik-olcu-igne-iug');
});

test('slugify collapses punctuation and trims dashes', () => {
  assert.equal(slugify('  Atlas Copco / MB-1700 (S) '), 'atlas-copco-mb-1700-s');
  assert.equal(slugify('---'), '');
});
```

- [ ] **Step 2: Run them and check they fail**

Run: `pnpm --filter @kervan/tips test`
Expected: FAIL with `Cannot find module` for `./codes.ts` and `./slug.ts`.

- [ ] **Step 3: Implement**

`packages/tips/src/types.ts`:

```ts
/** Working-end types the shop sells. */
export type TipType = 'chisel' | 'moil' | 'blunt' | 'pyramid' | 'conical' | 'asphalt';

/** Display order. */
export const TIP_TYPES: readonly TipType[] = [
  'chisel',
  'moil',
  'blunt',
  'pyramid',
  'conical',
  'asphalt',
];

export const isTipType = (v: unknown): v is TipType =>
  typeof v === 'string' && (TIP_TYPES as readonly string[]).includes(v);

/** Letter in the SKU code (KU135-07-C). */
export const TIP_LETTER: Record<TipType, string> = {
  chisel: 'C',
  moil: 'M',
  blunt: 'B',
  pyramid: 'P',
  conical: 'K',
  asphalt: 'A',
};

/** Turkish URL slug, kept in both languages. */
export const TIP_SLUG: Record<TipType, string> = {
  chisel: 'keski',
  moil: 'sivri',
  blunt: 'kut',
  pyramid: 'piramit',
  conical: 'konik',
  asphalt: 'asfalt',
};

export interface Range {
  min: number;
  max: number;
}

/** Shank geometry of a tip family (decides fitment). All lengths in mm. */
export interface FamilyAttrs {
  diameterMm: number;
  collarDiameterMm: number | null;
  key: {
    count: 1 | 2 | null;
    thicknessMm: number | null;
    slotLengthMm: number | null;
    backEndToSlotMm: number | null;
    slotEnd: 'rounded' | 'tapered' | null;
  };
  rear: {
    step: boolean | null;
    diameterMm: number | null;
  };
}

export interface Breaker {
  brand: string;
  model: string;
  /** "atlas-copco/mb-1700" (brandless: "diger/<model>"). */
  slug: string;
}

export type Availability =
  | { kind: 'stock'; qty: number }
  | { kind: 'lead'; days: number }
  | { kind: 'ask' };

export interface PublicSku {
  code: string;
  tipType: TipType;
  lengthMm: Range | null;
  weightKg: Range | null;
  tipAngleDeg: number | null;
  /** Net USD list price in cents; null = "ask for a quote". */
  priceUsdNetCents: number | null;
  availability: Availability;
}

export interface PublicFamily {
  code: string;
  attrs: FamilyAttrs;
  /** 1 = sells most in Turkey, 2 = sells well, null = not listed. */
  popularTier: 1 | 2 | null;
  fits: Breaker[];
  skus: PublicSku[];
}

export interface PublicCatalog {
  schema: 1;
  /** True for the invented DEMO catalog (local builds, forks). */
  demo?: boolean;
  families: PublicFamily[];
}
```

`packages/tips/src/codes.ts`:

```ts
import { TIP_LETTER, type TipType } from './types.ts';

const FAMILY_RE = /^KU(\d{2,3})-(\d{2,})$/;

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** KU + rounded working diameter + two-digit sequence: KU135-07. */
export const familyCode = (diameterMm: number, seq: number): string =>
  `KU${Math.round(diameterMm)}-${String(seq).padStart(2, '0')}`;

/** Family code + tip letter: KU135-07-C. */
export const skuCode = (family: string, type: TipType): string => `${family}-${TIP_LETTER[type]}`;

export interface CodeRequest {
  /** Owner's private row reference (never public). */
  ref: string;
  diameterMm: number;
  /** Deterministic order for new rows, e.g. "Brand Model". */
  sortKey: string;
}

/**
 * Codes are permanent once issued. Rows already in `existing` (ref → code) keep their
 * code. New rows are numbered per rounded diameter after the highest sequence ever
 * issued for it, so a deleted row's code is never reused.
 */
export function assignFamilyCodes(
  rows: readonly CodeRequest[],
  existing: ReadonlyMap<string, string>,
): Map<string, string> {
  const out = new Map<string, string>();
  const maxSeq = new Map<number, number>();
  for (const code of existing.values()) {
    const m = FAMILY_RE.exec(code);
    if (!m) continue;
    const d = Number(m[1]);
    maxSeq.set(d, Math.max(maxSeq.get(d) ?? 0, Number(m[2])));
  }
  for (const r of rows) {
    const c = existing.get(r.ref);
    if (c) out.set(r.ref, c);
  }
  const fresh = rows
    .filter((r) => !existing.has(r.ref))
    .sort(
      (a, b) =>
        Math.round(a.diameterMm) - Math.round(b.diameterMm) ||
        cmp(a.sortKey, b.sortKey) ||
        cmp(a.ref, b.ref),
    );
  for (const r of fresh) {
    const d = Math.round(r.diameterMm);
    const next = (maxSeq.get(d) ?? 0) + 1;
    maxSeq.set(d, next);
    out.set(r.ref, familyCode(d, next));
  }
  return out;
}
```

`packages/tips/src/slug.ts`:

```ts
const TR: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };

/** URL slug: Turkish letters transliterated, everything else ASCII a-z0-9 and dashes. */
export function slugify(s: string): string {
  return s
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .replace(/[çğıöşü]/g, (c) => TR[c] ?? c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

`packages/tips/src/index.ts` (replace):

```ts
export * from './types.ts';
export * from './codes.ts';
export * from './slug.ts';
```

Delete `packages/tips/src/smoke.test.ts`.

- [ ] **Step 4: Run tests, typecheck, lint**

Run: `pnpm --filter @kervan/tips test && pnpm --filter @kervan/tips typecheck && pnpm --filter @kervan/tips lint`
Expected: all tests pass, with no type or lint errors.

- [ ] **Step 5: Commit**

```bash
git add packages/tips
git commit -m "feat(tips): tip types, Kervan family/SKU codes and slugify"
```

---

### Task 3: Breaker names and carrier tonnage (moved from breaker-parts)

**Files:**

- Create: `packages/tips/src/breakers.ts`, `packages/tips/src/usage.ts`, `packages/tips/src/breakers.test.ts`, `packages/tips/src/usage.test.ts`
- Modify: `packages/tips/src/index.ts`, `apps/breaker-parts/src/lib/vega-usage.ts`, `apps/breaker-parts/package.json`

- [ ] **Step 1: Write the failing tests**

`packages/tips/src/breakers.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breaker, splitBreakerName } from './breakers.ts';

const BRANDS = ['Atlas Copco', 'Atlas', 'Krupp', 'NPK'];

test('splitBreakerName takes the longest known brand prefix', () => {
  assert.deepEqual(splitBreakerName('Atlas  Copco MB 1700', BRANDS), {
    brand: 'Atlas Copco',
    model: 'MB 1700',
  });
  assert.deepEqual(splitBreakerName('npk gh-9', BRANDS), { brand: 'NPK', model: 'gh-9' });
});

test('splitBreakerName falls back to the given brand and keeps the name as the model', () => {
  assert.deepEqual(splitBreakerName('HB 20G', BRANDS, 'Furukawa'), {
    brand: 'Furukawa',
    model: 'HB 20G',
  });
  assert.deepEqual(splitBreakerName('Krupp', BRANDS), { brand: 'Krupp', model: '' });
});

test('breaker builds a brand/model slug, "diger" without a brand', () => {
  assert.equal(breaker('Atlas Copco', 'MB 1700').slug, 'atlas-copco/mb-1700');
  assert.equal(breaker('', 'X 12').slug, 'diger/x-12');
});
```

`packages/tips/src/usage.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { carrierTons } from './usage.ts';

test('carrierTons returns the band for a diameter', () => {
  assert.deepEqual(carrierTons(135), { min: 16, max: 26 });
  assert.deepEqual(carrierTons(75), { min: 4, max: 10 });
});

test('carrierTons has no estimate outside the data', () => {
  assert.equal(carrierTons(60), null);
  assert.equal(carrierTons(215), null);
  assert.equal(carrierTons(null), null);
});
```

- [ ] **Step 2: Run them and check they fail**

Run: `pnpm --filter @kervan/tips test`
Expected: FAIL, `Cannot find module './breakers.ts'` / `'./usage.ts'`.

- [ ] **Step 3: Implement**

`packages/tips/src/breakers.ts`:

```ts
import { slugify } from './slug.ts';
import type { Breaker } from './types.ts';

const norm = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** "Atlas Copco MB 1700" → { brand: "Atlas Copco", model: "MB 1700" } using the known
 *  brand names (longest match first, case-insensitive). Unknown brand → `fallbackBrand`. */
export function splitBreakerName(
  name: string,
  brands: readonly string[],
  fallbackBrand = '',
): { brand: string; model: string } {
  const n = norm(name);
  const up = n.toUpperCase();
  const sorted = brands
    .map(norm)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  for (const b of sorted) {
    const bu = b.toUpperCase();
    if (up === bu) return { brand: b, model: '' };
    if (up.startsWith(`${bu} `)) return { brand: b, model: n.slice(b.length + 1).trim() };
  }
  return { brand: norm(fallbackBrand), model: n };
}

export function breaker(brand: string, model: string): Breaker {
  return { brand, model, slug: `${slugify(brand) || 'diger'}/${slugify(model)}` };
}
```

`packages/tips/src/usage.ts` (copy the bands verbatim from `apps/breaker-parts/src/lib/vega-usage.ts`; source comment shortened):

```ts
import type { Range } from './types.ts';

/** Rough carrier (excavator) weight class from the tip diameter. Bands are the union of
 *  manufacturer/dealer data points (tool Ø → breaker → carrier t; the full list is in git
 *  history of apps/breaker-parts/src/lib/vega-usage.ts). No data below Ø75 or above Ø209. */
const BANDS: { from: number; to: number; min: number; max: number }[] = [
  { from: 75, to: 99.99, min: 4, max: 10 },
  { from: 100, to: 114.99, min: 10, max: 14 },
  { from: 115, to: 129.99, min: 15, max: 25 },
  { from: 130, to: 144.99, min: 16, max: 26 },
  { from: 145, to: 154.99, min: 20, max: 40 },
  { from: 155, to: 164.99, min: 30, max: 45 },
  { from: 165, to: 179.99, min: 35, max: 63 },
  { from: 180, to: 209.99, min: 50, max: 88 },
];

export function carrierTons(diameterMm: number | null): Range | null {
  if (diameterMm == null) return null;
  const b = BANDS.find((x) => diameterMm >= x.from && diameterMm <= x.to);
  return b ? { min: b.min, max: b.max } : null;
}
```

Keep the full data-point comment: move it from `vega-usage.ts` into `usage.ts` unchanged, above `BANDS`, replacing the shortened comment above.

`packages/tips/src/index.ts`: add

```ts
export * from './breakers.ts';
export * from './usage.ts';
```

`apps/breaker-parts/package.json` dependencies: add `"@kervan/tips": "workspace:*",`.

`apps/breaker-parts/src/lib/vega-usage.ts`: replace the `BANDS` constant and the `carrierTons` body with a delegation. Keep `CarrierRange` and `suitsCarrier` as they are:

```ts
import { carrierTons as tonsFor } from '@kervan/tips';
import type { VegaItem } from '../types';

export interface CarrierRange {
  min: number;
  max: number;
}

/** Rough carrier weight class for a tip (bands live in @kervan/tips, shared with the shop). */
export function carrierTons(it: Pick<VegaItem, 'diameterMm'>): CarrierRange | null {
  return tonsFor(it.diameterMm);
}
```

`suitsCarrier` stays unchanged below it. Delete the moved comment block from this file.

- [ ] **Step 4: Run tests and check breaker-parts still builds**

Run:

```bash
pnpm install
pnpm --filter @kervan/tips test
pnpm typecheck && pnpm lint
pnpm turbo build --filter=@kervan/breaker-parts
```

Expected: tests pass, typecheck/lint clean, and the breaker-parts build succeeds (prerender log line `prerender: N pages written`).

- [ ] **Step 5: Commit**

```bash
git add packages/tips apps/breaker-parts pnpm-lock.yaml
git commit -m "feat(tips): breaker name parsing; move carrier tonnage bands into @kervan/tips"
```

---

### Task 4: Catalog → import rows

**Files:**

- Create: `packages/tips/src/from-catalog.ts`, `packages/tips/src/from-catalog.test.ts`
- Modify: `packages/tips/src/index.ts`

- [ ] **Step 1: Write the failing test**

`packages/tips/src/from-catalog.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromCatalog, type SourceRow } from './from-catalog.ts';

const row = (over: Partial<SourceRow>): SourceRow => ({
  id: 'r1',
  model: 'Acme AB 100',
  brand: 'Acme',
  fitsBreakers: [],
  tipTypes: ['chisel', 'moil'],
  diameterMm: 135,
  collarDiameterMm: 150,
  key: { count: 2, thicknessMm: 30, slotLengthMm: 120, backEndToSlotMm: 80 },
  rearShoulderDiameterMm: null,
  lengthMm: { min: 1200, max: 1300 },
  lengthByType: { moil: { min: 1250, max: 1250 } },
  weightKg: { min: 140, max: 150 },
  weightByType: null,
  rearStep: false,
  slotEnd: 'rounded',
  tipAngleDeg: 45,
  ...over,
});

test('maps a row to a family with codes, attrs, fits and one SKU per type', () => {
  const { families, skipped } = fromCatalog(
    [row({ fitsBreakers: ['Acme AB 100', 'Other X 5', 'Acme AB 110'] })],
    { models: { 'Acme AB 100': 1 } },
    new Map(),
  );
  assert.equal(skipped.length, 0);
  const f = families[0];
  assert.equal(f.ref, 'r1');
  assert.equal(f.code, 'KU135-01');
  assert.equal(f.popularTier, 1);
  assert.deepEqual(f.attrs, {
    diameterMm: 135,
    collarDiameterMm: 150,
    key: { count: 2, thicknessMm: 30, slotLengthMm: 120, backEndToSlotMm: 80, slotEnd: 'rounded' },
    rear: { step: false, diameterMm: null },
  });
  assert.deepEqual(
    f.fits.map((b) => b.slug),
    ['acme/ab-100', 'diger/other-x-5', 'acme/ab-110'],
  );
  assert.deepEqual(
    f.skus.map((s) => [s.code, s.tipType, s.lengthMm, s.weightKg, s.tipAngleDeg]),
    [
      ['KU135-01-C', 'chisel', { min: 1200, max: 1300 }, { min: 140, max: 150 }, null],
      ['KU135-01-M', 'moil', { min: 1250, max: 1250 }, { min: 140, max: 150 }, null],
    ],
  );
});

test('the drawn tip angle is kept only when the row has a single tip type', () => {
  const { families } = fromCatalog([row({ tipTypes: ['moil'] })], null, new Map());
  assert.equal(families[0].skus[0].tipAngleDeg, 45);
});

test('rows without a diameter or a known tip type are skipped with a reason', () => {
  const { families, skipped } = fromCatalog(
    [row({ id: 'a', diameterMm: null }), row({ id: 'b', tipTypes: ['unknown'] })],
    null,
    new Map(),
  );
  assert.equal(families.length, 0);
  assert.deepEqual(skipped, [
    { ref: 'a', reason: 'no-diameter' },
    { ref: 'b', reason: 'no-tip-type' },
  ]);
});

test('popular tiers outside 1|2 are ignored and existing codes are kept', () => {
  const { families } = fromCatalog(
    [row({})],
    { models: { 'Acme AB 100': 7 } },
    new Map([['r1', 'KU135-04']]),
  );
  assert.equal(families[0].popularTier, null);
  assert.equal(families[0].code, 'KU135-04');
});
```

- [ ] **Step 2: Run it and check it fails**

Run: `pnpm --filter @kervan/tips test`
Expected: FAIL, `Cannot find module './from-catalog.ts'`.

- [ ] **Step 3: Implement**

`packages/tips/src/from-catalog.ts`:

```ts
import { breaker, splitBreakerName } from './breakers.ts';
import { assignFamilyCodes, skuCode } from './codes.ts';
import {
  isTipType,
  TIP_TYPES,
  type Breaker,
  type FamilyAttrs,
  type Range,
  type TipType,
} from './types.ts';

/** One row of the owner's private catalog JSON (`items[]`); only the fields the shop uses. */
export interface SourceRow {
  id: string;
  model: string;
  brand: string;
  fitsBreakers: string[];
  tipTypes: string[];
  diameterMm: number | null;
  collarDiameterMm: number | null;
  key: {
    count: 1 | 2 | null;
    thicknessMm: number | null;
    slotLengthMm: number | null;
    backEndToSlotMm: number | null;
  };
  rearShoulderDiameterMm: number | null;
  lengthMm: Range | null;
  lengthByType: Partial<Record<string, Range>> | null;
  weightKg: Range | null;
  weightByType: Partial<Record<string, Range>> | null;
  rearStep?: boolean | null;
  slotEnd?: 'rounded' | 'tapered' | null;
  tipAngleDeg?: number | null;
}

/** Owner's best-seller list: catalog model name → tier. */
export interface SourcePopular {
  models?: Record<string, number>;
}

export interface ImportSku {
  code: string;
  tipType: TipType;
  lengthMm: Range | null;
  weightKg: Range | null;
  tipAngleDeg: number | null;
}

export interface ImportFamily {
  /** Private row reference (stored in D1 only, never public). */
  ref: string;
  code: string;
  attrs: FamilyAttrs;
  popularTier: 1 | 2 | null;
  fits: Breaker[];
  skus: ImportSku[];
}

export interface ImportResult {
  families: ImportFamily[];
  skipped: { ref: string; reason: 'no-diameter' | 'no-tip-type' }[];
}

const tier = (v: unknown): 1 | 2 | null => (v === 1 || v === 2 ? v : null);

export function fromCatalog(
  rows: readonly SourceRow[],
  popular: SourcePopular | null,
  existing: ReadonlyMap<string, string>,
): ImportResult {
  const skipped: ImportResult['skipped'] = [];
  const valid: { row: SourceRow; d: number; types: TipType[] }[] = [];
  for (const row of rows) {
    if (row.diameterMm == null) {
      skipped.push({ ref: row.id, reason: 'no-diameter' });
      continue;
    }
    const types = TIP_TYPES.filter((t) => row.tipTypes.some((x) => x === t && isTipType(x)));
    if (types.length === 0) {
      skipped.push({ ref: row.id, reason: 'no-tip-type' });
      continue;
    }
    valid.push({ row, d: row.diameterMm, types });
  }

  const brands = [...new Set(rows.map((r) => r.brand).filter(Boolean))];
  const codes = assignFamilyCodes(
    valid.map(({ row, d }) => ({
      ref: row.id,
      diameterMm: d,
      sortKey: `${row.brand} ${row.model}`,
    })),
    existing,
  );

  const families = valid.map(({ row, d, types }): ImportFamily => {
    const code = codes.get(row.id)!;
    const seen = new Set<string>();
    const fits: Breaker[] = [];
    const names = [
      splitBreakerName(row.model, brands, row.brand),
      ...row.fitsBreakers.map((n) => splitBreakerName(n, brands)),
    ];
    for (const n of names) {
      if (!n.model) continue;
      const b = breaker(n.brand, n.model);
      if (seen.has(b.slug)) continue;
      seen.add(b.slug);
      fits.push(b);
    }
    return {
      ref: row.id,
      code,
      attrs: {
        diameterMm: d,
        collarDiameterMm: row.collarDiameterMm,
        key: {
          count: row.key.count,
          thicknessMm: row.key.thicknessMm,
          slotLengthMm: row.key.slotLengthMm,
          backEndToSlotMm: row.key.backEndToSlotMm,
          slotEnd: row.slotEnd ?? null,
        },
        rear: { step: row.rearStep ?? null, diameterMm: row.rearShoulderDiameterMm },
      },
      popularTier: tier(popular?.models?.[row.model]),
      fits,
      skus: types.map((t) => ({
        code: skuCode(code, t),
        tipType: t,
        lengthMm: row.lengthByType?.[t] ?? row.lengthMm,
        weightKg: row.weightByType?.[t] ?? row.weightKg,
        // The catalogue prints one angle per drawing; it is only unambiguous for a single type.
        tipAngleDeg: types.length === 1 ? (row.tipAngleDeg ?? null) : null,
      })),
    };
  });

  return { families, skipped };
}
```

`packages/tips/src/index.ts`: add `export * from './from-catalog.ts';`

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @kervan/tips test && pnpm --filter @kervan/tips typecheck && pnpm --filter @kervan/tips lint`
Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add packages/tips
git commit -m "feat(tips): map the owner's catalog rows to shop families and SKUs"
```

---

### Task 5: D1 schema and SQL generator

**Files:**

- Create: `apps/parts-shop/migrations/0001_init.sql`, `packages/tips/src/sql.ts`, `packages/tips/src/sql.test.ts`
- Modify: `packages/tips/src/index.ts`

- [ ] **Step 1: Write the schema**

`apps/parts-shop/migrations/0001_init.sql`:

```sql
-- Kervan parts shop, D1 schema. Schema only: the data lives in D1, never in git.
-- Idempotent (IF NOT EXISTS) so the import workflow can apply it on every run.
CREATE TABLE IF NOT EXISTS families (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  private_ref TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'tip',
  attrs TEXT NOT NULL,
  popular_tier INTEGER,
  published INTEGER NOT NULL DEFAULT 1,
  private_notes TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS skus (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  family_id INTEGER NOT NULL REFERENCES families(id),
  tip_type TEXT NOT NULL,
  length_min_mm REAL,
  length_max_mm REAL,
  weight_min_kg REAL,
  weight_max_kg REAL,
  tip_angle_deg REAL,
  price_usd_net_cents INTEGER,
  price_try_gross_override_kurus INTEGER,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  lead_time_days INTEGER,
  published INTEGER NOT NULL DEFAULT 1,
  cost_try_kurus INTEGER,
  updated_at TEXT NOT NULL,
  UNIQUE (family_id, tip_type)
);
CREATE TABLE IF NOT EXISTS breakers (
  id INTEGER PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  UNIQUE (brand, model)
);
CREATE TABLE IF NOT EXISTS fitments (
  family_id INTEGER NOT NULL REFERENCES families(id),
  breaker_id INTEGER NOT NULL REFERENCES breakers(id),
  PRIMARY KEY (family_id, breaker_id)
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS skus_family ON skus(family_id);
```

- [ ] **Step 2: Write the failing test**

`packages/tips/src/sql.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sqlValue, toImportSql } from './sql.ts';
import type { ImportFamily } from './from-catalog.ts';

const fam: ImportFamily = {
  ref: "r'1",
  code: 'KU135-01',
  attrs: {
    diameterMm: 135,
    collarDiameterMm: null,
    key: { count: 1, thicknessMm: null, slotLengthMm: null, backEndToSlotMm: null, slotEnd: null },
    rear: { step: null, diameterMm: null },
  },
  popularTier: 2,
  fits: [{ brand: "O'Brien", model: 'X 1', slug: 'o-brien/x-1' }],
  skus: [
    {
      code: 'KU135-01-C',
      tipType: 'chisel',
      lengthMm: { min: 1200, max: 1300 },
      weightKg: null,
      tipAngleDeg: null,
    },
  ],
};

test('sqlValue quotes strings, prints finite numbers and NULLs the rest', () => {
  assert.equal(sqlValue("it's"), "'it''s'");
  assert.equal(sqlValue(12.5), '12.5');
  assert.equal(sqlValue(Number.NaN), 'NULL');
  assert.equal(sqlValue(null), 'NULL');
});

test('toImportSql upserts without touching codes or owner flags', () => {
  const sql = toImportSql([fam], '2026-10-06T00:00:00.000Z');
  assert.match(
    sql,
    /INSERT INTO families \(code, private_ref, attrs, popular_tier, updated_at\) VALUES \('KU135-01', 'r''1', '\{.*\}', 2, '2026-10-06T00:00:00.000Z'\) ON CONFLICT\(private_ref\) DO UPDATE SET attrs = excluded\.attrs, popular_tier = excluded\.popular_tier, updated_at = excluded\.updated_at;/,
  );
  assert.match(
    sql,
    /ON CONFLICT\(family_id, tip_type\) DO UPDATE SET length_min_mm = excluded\.length_min_mm/,
  );
  assert.doesNotMatch(sql, /SET[^;]*\bcode =/);
  assert.doesNotMatch(sql, /SET[^;]*\bpublished =/);
  assert.match(
    sql,
    /INSERT OR IGNORE INTO breakers \(brand, model, slug\) VALUES \('O''Brien', 'X 1', 'o-brien\/x-1'\);/,
  );
  assert.match(
    sql,
    /INSERT OR IGNORE INTO fitments \(family_id, breaker_id\) VALUES \(\(SELECT id FROM families WHERE private_ref = 'r''1'\), \(SELECT id FROM breakers WHERE slug = 'o-brien\/x-1'\)\);/,
  );
  assert.doesNotMatch(sql, /BEGIN|COMMIT/);
});
```

- [ ] **Step 3: Run it and check it fails**

Run: `pnpm --filter @kervan/tips test`
Expected: FAIL, `Cannot find module './sql.ts'`.

- [ ] **Step 4: Implement**

`packages/tips/src/sql.ts`:

```ts
import type { ImportFamily } from './from-catalog.ts';

/** SQLite literal. Strings are single-quoted with '' escaping; non-finite numbers become NULL. */
export function sqlValue(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  return `'${v.replace(/'/g, "''")}'`;
}

/**
 * Idempotent import for `wrangler d1 execute --file` (no BEGIN/COMMIT: D1 rejects them).
 * Re-running updates geometry, ranges and best-seller tiers. It never changes a code,
 * a `published` flag or anything the owner edits (prices, stock, notes).
 * Fitments are only added; removing one is an admin task.
 */
export function toImportSql(families: readonly ImportFamily[], now: string): string {
  const q = sqlValue;
  const out: string[] = [];
  for (const f of families) {
    out.push(
      `INSERT INTO families (code, private_ref, attrs, popular_tier, updated_at) VALUES (${q(f.code)}, ${q(f.ref)}, ${q(JSON.stringify(f.attrs))}, ${q(f.popularTier)}, ${q(now)}) ON CONFLICT(private_ref) DO UPDATE SET attrs = excluded.attrs, popular_tier = excluded.popular_tier, updated_at = excluded.updated_at;`,
    );
    const fam = `(SELECT id FROM families WHERE private_ref = ${q(f.ref)})`;
    for (const s of f.skus) {
      out.push(
        `INSERT INTO skus (code, family_id, tip_type, length_min_mm, length_max_mm, weight_min_kg, weight_max_kg, tip_angle_deg, updated_at) VALUES (${q(s.code)}, ${fam}, ${q(s.tipType)}, ${q(s.lengthMm?.min)}, ${q(s.lengthMm?.max)}, ${q(s.weightKg?.min)}, ${q(s.weightKg?.max)}, ${q(s.tipAngleDeg)}, ${q(now)}) ON CONFLICT(family_id, tip_type) DO UPDATE SET length_min_mm = excluded.length_min_mm, length_max_mm = excluded.length_max_mm, weight_min_kg = excluded.weight_min_kg, weight_max_kg = excluded.weight_max_kg, tip_angle_deg = excluded.tip_angle_deg, updated_at = excluded.updated_at;`,
      );
    }
    for (const b of f.fits) {
      out.push(
        `INSERT OR IGNORE INTO breakers (brand, model, slug) VALUES (${q(b.brand)}, ${q(b.model)}, ${q(b.slug)});`,
      );
      out.push(
        `INSERT OR IGNORE INTO fitments (family_id, breaker_id) VALUES (${fam}, (SELECT id FROM breakers WHERE slug = ${q(b.slug)}));`,
      );
    }
  }
  return `${out.join('\n')}\n`;
}
```

`packages/tips/src/index.ts`: add `export * from './sql.ts';`

- [ ] **Step 5: Run the tests and check the schema against local SQLite**

Run:

```bash
pnpm --filter @kervan/tips test
python3 -c "import sqlite3;c=sqlite3.connect(':memory:');c.executescript(open('apps/parts-shop/migrations/0001_init.sql').read());c.executescript(open('apps/parts-shop/migrations/0001_init.sql').read());print('schema ok')"
```

Expected: tests PASS; `schema ok`, which shows the schema applies twice cleanly.

- [ ] **Step 6: Commit**

```bash
git add packages/tips apps/parts-shop/migrations
git commit -m "feat(shop): D1 schema and idempotent import SQL generator"
```

---

### Task 6: Public projection and DEMO catalog

**Files:**

- Create: `packages/tips/src/public.ts`, `packages/tips/src/public.test.ts`, `packages/tips/src/demo.ts`, `packages/tips/src/demo.test.ts`
- Modify: `packages/tips/src/index.ts`

- [ ] **Step 1: Write the failing tests**

`packages/tips/src/public.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPublicCatalog, type FamilyRow, type FitRow, type SkuRow } from './public.ts';

const attrs = (d: number, extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    diameterMm: d,
    collarDiameterMm: null,
    key: { count: 1, thicknessMm: null, slotLengthMm: null, backEndToSlotMm: null, slotEnd: null },
    rear: { step: null, diameterMm: null },
    ...extra,
  });

const families: FamilyRow[] = [
  { id: 1, code: 'KU150-01', attrs: attrs(150), popular_tier: null },
  { id: 2, code: 'KU135-01', attrs: attrs(135, { secretNote: 'x' }), popular_tier: 2 },
  { id: 3, code: 'KU100-01', attrs: attrs(100), popular_tier: 1 },
  { id: 4, code: 'KU120-01', attrs: attrs(120), popular_tier: null },
];
const sku = (family_id: number, code: string, over: Partial<SkuRow> = {}): SkuRow => ({
  family_id,
  code,
  tip_type: 'chisel',
  length_min_mm: 1000,
  length_max_mm: null,
  weight_min_kg: null,
  weight_max_kg: null,
  tip_angle_deg: null,
  price_usd_net_cents: null,
  stock_qty: 0,
  lead_time_days: null,
  ...over,
});
const skus: SkuRow[] = [
  sku(1, 'KU150-01-C'),
  sku(2, 'KU135-01-C', { stock_qty: 3 }),
  sku(2, 'KU135-01-X', { tip_type: 'laser' }),
  sku(3, 'KU100-01-M', { tip_type: 'moil', lead_time_days: 10 }),
];
const fits: FitRow[] = [{ family_id: 2, brand: 'Acme', model: 'AB 1', slug: 'acme/ab-1' }];

test('orders by best-seller tier, then diameter; drops families without SKUs', () => {
  const c = toPublicCatalog(families, skus, fits);
  assert.equal(c.schema, 1);
  assert.deepEqual(
    c.families.map((f) => f.code),
    ['KU100-01', 'KU135-01', 'KU150-01'],
  );
});

test('rebuilds attrs from a whitelist and drops unknown tip types', () => {
  const f = toPublicCatalog(families, skus, fits).families[1];
  assert.equal('secretNote' in f.attrs, false);
  assert.deepEqual(
    f.skus.map((s) => s.code),
    ['KU135-01-C'],
  );
  assert.deepEqual(f.fits, [{ brand: 'Acme', model: 'AB 1', slug: 'acme/ab-1' }]);
});

test('ranges fill a missing bound and availability follows stock, then lead time', () => {
  const c = toPublicCatalog(families, skus, fits);
  const byCode = new Map(c.families.flatMap((f) => f.skus).map((s) => [s.code, s]));
  assert.deepEqual(byCode.get('KU150-01-C')!.lengthMm, { min: 1000, max: 1000 });
  assert.equal(byCode.get('KU150-01-C')!.weightKg, null);
  assert.deepEqual(byCode.get('KU135-01-C')!.availability, { kind: 'stock', qty: 3 });
  assert.deepEqual(byCode.get('KU100-01-M')!.availability, { kind: 'lead', days: 10 });
  assert.deepEqual(byCode.get('KU150-01-C')!.availability, { kind: 'ask' });
});

test('the projection has no private keys anywhere', () => {
  const json = JSON.stringify(toPublicCatalog(families, skus, fits));
  for (const k of ['private_ref', 'private_notes', 'cost_try', 'secretNote', 'family_id']) {
    assert.equal(json.includes(k), false, k);
  }
});
```

`packages/tips/src/demo.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoCatalog } from './demo.ts';

test('the DEMO catalog is flagged and uses XX codes only', () => {
  const c = demoCatalog();
  assert.equal(c.demo, true);
  assert.ok(c.families.length >= 6);
  for (const f of c.families) assert.match(f.code, /^XX\d{3}-\d{2}$/);
  for (const f of c.families) for (const b of f.fits) assert.equal(b.brand, 'DEMO');
});
```

- [ ] **Step 2: Run them and check they fail**

Run: `pnpm --filter @kervan/tips test`
Expected: FAIL, `Cannot find module './public.ts'` / `'./demo.ts'`.

- [ ] **Step 3: Implement**

`packages/tips/src/public.ts`:

```ts
import {
  isTipType,
  TIP_TYPES,
  type Availability,
  type FamilyAttrs,
  type PublicCatalog,
  type PublicFamily,
  type PublicSku,
  type Range,
} from './types.ts';

/** `SELECT id, code, attrs, popular_tier FROM families WHERE published = 1` */
export interface FamilyRow {
  id: number;
  code: string;
  attrs: string;
  popular_tier: number | null;
}
/** Published SKUs of published families (see FAMILY/SKU/FIT queries in build-catalog). */
export interface SkuRow {
  family_id: number;
  code: string;
  tip_type: string;
  length_min_mm: number | null;
  length_max_mm: number | null;
  weight_min_kg: number | null;
  weight_max_kg: number | null;
  tip_angle_deg: number | null;
  price_usd_net_cents: number | null;
  stock_qty: number;
  lead_time_days: number | null;
}
export interface FitRow {
  family_id: number;
  brand: string;
  model: string;
  slug: string;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const range = (a: number | null, b: number | null): Range | null => {
  const min = num(a) ?? num(b);
  const max = num(b) ?? num(a);
  return min === null || max === null ? null : { min, max };
};

/** Rebuilds attrs field by field, so nothing else stored in the JSON can leak. */
function publicAttrs(raw: string): FamilyAttrs | null {
  let a: Record<string, unknown>;
  try {
    a = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  const d = num(a.diameterMm);
  if (d === null) return null;
  const key = (a.key ?? {}) as Record<string, unknown>;
  const rear = (a.rear ?? {}) as Record<string, unknown>;
  const count = key.count === 1 || key.count === 2 ? key.count : null;
  const slotEnd = key.slotEnd === 'rounded' || key.slotEnd === 'tapered' ? key.slotEnd : null;
  return {
    diameterMm: d,
    collarDiameterMm: num(a.collarDiameterMm),
    key: {
      count,
      thicknessMm: num(key.thicknessMm),
      slotLengthMm: num(key.slotLengthMm),
      backEndToSlotMm: num(key.backEndToSlotMm),
      slotEnd,
    },
    rear: {
      step: typeof rear.step === 'boolean' ? rear.step : null,
      diameterMm: num(rear.diameterMm),
    },
  };
}

const availability = (s: SkuRow): Availability =>
  s.stock_qty > 0
    ? { kind: 'stock', qty: s.stock_qty }
    : s.lead_time_days !== null && s.lead_time_days > 0
      ? { kind: 'lead', days: s.lead_time_days }
      : { kind: 'ask' };

const tierRank = (t: 1 | 2 | null): number => t ?? 3;

export function toPublicCatalog(
  families: readonly FamilyRow[],
  skus: readonly SkuRow[],
  fits: readonly FitRow[],
): PublicCatalog {
  const skusBy = new Map<number, PublicSku[]>();
  for (const s of skus) {
    if (!isTipType(s.tip_type)) continue;
    const list = skusBy.get(s.family_id) ?? [];
    list.push({
      code: s.code,
      tipType: s.tip_type,
      lengthMm: range(s.length_min_mm, s.length_max_mm),
      weightKg: range(s.weight_min_kg, s.weight_max_kg),
      tipAngleDeg: num(s.tip_angle_deg),
      priceUsdNetCents: num(s.price_usd_net_cents),
      availability: availability(s),
    });
    skusBy.set(s.family_id, list);
  }
  const fitsBy = new Map<number, PublicFamily['fits']>();
  for (const f of fits) {
    const list = fitsBy.get(f.family_id) ?? [];
    list.push({ brand: f.brand, model: f.model, slug: f.slug });
    fitsBy.set(f.family_id, list);
  }
  const out: PublicFamily[] = [];
  for (const f of families) {
    const attrs = publicAttrs(f.attrs);
    const list = skusBy.get(f.id);
    if (!attrs || !list?.length) continue;
    list.sort((a, b) => TIP_TYPES.indexOf(a.tipType) - TIP_TYPES.indexOf(b.tipType));
    out.push({
      code: f.code,
      attrs,
      popularTier: f.popular_tier === 1 || f.popular_tier === 2 ? f.popular_tier : null,
      fits: fitsBy.get(f.id) ?? [],
      skus: list,
    });
  }
  out.sort(
    (a, b) =>
      tierRank(a.popularTier) - tierRank(b.popularTier) ||
      a.attrs.diameterMm - b.attrs.diameterMm ||
      (a.code < b.code ? -1 : a.code > b.code ? 1 : 0),
  );
  return { schema: 1, families: out };
}
```

`packages/tips/src/demo.ts`:

```ts
import { breaker } from './breakers.ts';
import { skuCode } from './codes.ts';
import type { PublicCatalog, PublicFamily, TipType } from './types.ts';

/** Invented rows for local builds and forks. XX codes and the DEMO brand make them unmistakable. */
export function demoCatalog(): PublicCatalog {
  const spec: [number, 1 | 2 | null, TipType[]][] = [
    [100, 1, ['chisel', 'moil']],
    [135, 1, ['chisel', 'moil', 'blunt']],
    [150, 2, ['chisel', 'pyramid']],
    [75, null, ['moil']],
    [165, null, ['chisel', 'moil']],
    [190, null, ['blunt']],
  ];
  const families: PublicFamily[] = spec.map(([d, tier, types], i) => {
    const code = `XX${d}-${String(i + 1).padStart(2, '0')}`;
    return {
      code,
      attrs: {
        diameterMm: d,
        collarDiameterMm: d + 15,
        key: {
          count: 2,
          thicknessMm: Math.round(d / 4),
          slotLengthMm: d,
          backEndToSlotMm: 80,
          slotEnd: 'rounded',
        },
        rear: { step: false, diameterMm: null },
      },
      popularTier: tier,
      fits: [breaker('DEMO', `D-${d}`), breaker('DEMO', `D-${d}S`)],
      skus: types.map((t) => ({
        code: skuCode(code, t),
        tipType: t,
        lengthMm: { min: d * 8, max: d * 9 },
        weightKg: { min: Math.round(d * 0.7), max: Math.round(d * 0.8) },
        tipAngleDeg: null,
        priceUsdNetCents: null,
        availability: { kind: 'ask' },
      })),
    };
  });
  return { schema: 1, demo: true, families };
}
```

`packages/tips/src/index.ts`: add

```ts
export * from './public.ts';
export * from './demo.ts';
```

- [ ] **Step 4: Run tests, typecheck, lint**

Run: `pnpm --filter @kervan/tips test && pnpm --filter @kervan/tips typecheck && pnpm --filter @kervan/tips lint`
Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add packages/tips
git commit -m "feat(tips): public catalog projection (whitelist) and DEMO catalog"
```

---

### Task 7: Import CLI and the manual import workflow

**Files:**

- Create: `apps/parts-shop/scripts/shop-import.ts`, `.github/workflows/shop-import.yml`

- [ ] **Step 1: Write the CLI**

`apps/parts-shop/scripts/shop-import.ts`:

```ts
// Owner catalog JSON → idempotent D1 import SQL. Data stays OUTSIDE the repository.
//   node --experimental-strip-types apps/parts-shop/scripts/shop-import.ts \
//     <catalog.json> <popular.json|-> <existing.json|-> <out.sql>
// existing.json = `wrangler d1 execute <db> --remote --json --command "SELECT private_ref, code FROM families"`.
// Prints counts only (CI logs of this public repo must never show catalog data).
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  fromCatalog,
  toImportSql,
  type SourcePopular,
  type SourceRow,
} from '../../../packages/tips/src/index.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const [catalogPath, popularPath, existingPath, outPath] = process.argv.slice(2);

function die(msg: string): never {
  process.stderr.write(`shop-import: ${msg}\n`);
  process.exit(2);
}

if (!catalogPath || !popularPath || !existingPath || !outPath) {
  die('usage: shop-import.ts <catalog.json> <popular.json|-> <existing.json|-> <out.sql>');
}
const insideRepo = (p: string): boolean => {
  const rel = path.relative(REPO, path.resolve(p));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};
for (const p of [catalogPath, popularPath, existingPath, outPath]) {
  if (p !== '-' && insideRepo(p))
    die(`refusing ${p}: catalog data must stay outside the repository`);
}

/** Missing or non-JSON optional inputs (e.g. wrangler printed "Value not found") → null. */
function readOptional(p: string): unknown {
  if (p === '-') return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

let catalog: unknown;
try {
  catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch {
  die('catalog is missing or not JSON');
}
const items = (catalog as { items?: unknown }).items;
if (!Array.isArray(items) || items.length === 0) die('catalog has no items');

const existing = new Map<string, string>();
const existingRaw = readOptional(existingPath);
for (const block of Array.isArray(existingRaw) ? existingRaw : []) {
  const results = (block as { results?: unknown }).results;
  for (const r of Array.isArray(results) ? results : []) {
    const { private_ref, code } = r as { private_ref?: unknown; code?: unknown };
    if (typeof private_ref === 'string' && typeof code === 'string')
      existing.set(private_ref, code);
  }
}

const res = fromCatalog(
  items as SourceRow[],
  readOptional(popularPath) as SourcePopular | null,
  existing,
);
fs.writeFileSync(outPath, toImportSql(res.families, new Date().toISOString()));
const skus = res.families.reduce((n, f) => n + f.skus.length, 0);
const reasons = [...new Set(res.skipped.map((s) => s.reason))].join(', ') || 'none';
process.stdout.write(
  `shop-import: ${res.families.length} families (${res.families.length - existing.size} new), ${skus} SKUs, ${res.skipped.length} skipped (${reasons})\n`,
);
```

Also modify `apps/parts-shop/tsconfig.json` (created in Task 8): its `include` must contain `"scripts/**/*.ts"`. If Task 8 has not run yet, create the file now with the Task 8 content.

- [ ] **Step 2: Try the CLI on invented data outside the repo**

Run:

```bash
T=$(mktemp -d)
cat > "$T/catalog.json" <<'EOF'
{"items":[{"id":"t1","model":"Acme AB 100","brand":"Acme","fitsBreakers":["Acme AB 110"],"tipTypes":["chisel","moil"],"diameterMm":135,"collarDiameterMm":150,"key":{"count":2,"thicknessMm":30,"slotLengthMm":120,"backEndToSlotMm":80},"rearShoulderDiameterMm":null,"lengthMm":{"min":1200,"max":1300},"lengthByType":null,"weightKg":{"min":140,"max":150},"weightByType":null},{"id":"t2","model":"Acme Z","brand":"Acme","fitsBreakers":[],"tipTypes":["chisel"],"diameterMm":null,"collarDiameterMm":null,"key":{"count":null,"thicknessMm":null,"slotLengthMm":null,"backEndToSlotMm":null},"rearShoulderDiameterMm":null,"lengthMm":null,"lengthByType":null,"weightKg":null,"weightByType":null}]}
EOF
node --experimental-strip-types --no-warnings apps/parts-shop/scripts/shop-import.ts "$T/catalog.json" - - "$T/out.sql"
python3 -c "import sqlite3,sys;c=sqlite3.connect(':memory:');c.executescript(open('apps/parts-shop/migrations/0001_init.sql').read());s=open(sys.argv[1]).read();c.executescript(s);c.executescript(s);print(c.execute('select count(*) from families').fetchone(), c.execute('select code from skus order by code').fetchall(), c.execute('select slug from breakers order by slug').fetchall())" "$T/out.sql"
node --experimental-strip-types --no-warnings apps/parts-shop/scripts/shop-import.ts "$T/catalog.json" - - apps/parts-shop/x.sql; echo "exit $?"
rm -rf "$T"
```

Expected:

- `shop-import: 1 families (1 new), 2 SKUs, 1 skipped (no-diameter)`.
- `(1,) [('KU135-01-C',), ('KU135-01-M',)] [('acme/ab-100',), ('acme/ab-110',)]`: the second run inserted nothing new.
- The last command prints `refusing apps/parts-shop/x.sql …` then `exit 2`.

If Node refuses the relative `.ts` import, check `node --version` (it must be ≥ 22.6). The CI uses Node 22.

- [ ] **Step 3: Write the workflow**

`.github/workflows/shop-import.yml`:

```yaml
name: Shop data import

# Manual: owner catalog (KV catalog:v1 + popular:v1) → D1 kervan-shop, then a shop
# redeploy. The data never enters the repository. This repo is public, so its Actions
# logs are public: every command that outputs data goes to $RUNNER_TEMP, never to the log.
on:
  workflow_dispatch:

concurrency:
  group: shop-import
  cancel-in-progress: false

jobs:
  import:
    name: KV → D1
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    permissions:
      contents: read
      actions: write
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_SHOP_DATA_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      KV_ID: ${{ vars.SHOP_SOURCE_KV_ID }}
      DB: kervan-shop
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

      - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0

      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Check configuration
        run: |
          test -n "$CLOUDFLARE_API_TOKEN" || { echo "::error::secret CLOUDFLARE_SHOP_DATA_TOKEN is not set"; exit 1; }
          test -n "$KV_ID" || { echo "::error::variable SHOP_SOURCE_KV_ID is not set"; exit 1; }

      - name: Apply schema
        run: pnpm exec wrangler d1 execute "$DB" --remote --yes --file apps/parts-shop/migrations/0001_init.sql > /dev/null

      - name: Import (output kept out of the log)
        run: |
          set -euo pipefail
          D="$RUNNER_TEMP/shop"
          mkdir -p "$D"
          pnpm exec wrangler kv key get "catalog:v1" --namespace-id "$KV_ID" --remote > "$D/catalog.json"
          pnpm exec wrangler kv key get "popular:v1" --namespace-id "$KV_ID" --remote > "$D/popular.json" 2>/dev/null || echo 'null' > "$D/popular.json"
          pnpm exec wrangler d1 execute "$DB" --remote --json --command "SELECT private_ref, code FROM families" > "$D/existing.json"
          node --experimental-strip-types --no-warnings apps/parts-shop/scripts/shop-import.ts \
            "$D/catalog.json" "$D/popular.json" "$D/existing.json" "$D/import.sql"
          pnpm exec wrangler d1 execute "$DB" --remote --yes --file "$D/import.sql" > /dev/null
          rm -rf "$D"

      - name: Redeploy the shop with the new data
        env:
          GH_TOKEN: ${{ github.token }}
        run: gh workflow run deploy.yml --ref main -f app=parts-shop
```

The `--yes`, `--remote` and `--namespace-id` flags must exist in wrangler ^4.83. Confirm with `pnpm exec wrangler d1 execute --help` and `pnpm exec wrangler kv key get --help`, and drop any flag the help does not list. `wrangler d1 execute <name>` resolves a remote database by name through the API without a `wrangler.toml`. If it does not, add `apps/parts-shop/d1.wrangler.toml` with one `[[d1_databases]]` entry (`binding = "SHOP_DB"`, `database_name = "kervan-shop"`, `database_id = <id from Task 0>`) and pass `--config apps/parts-shop/d1.wrangler.toml`. The ID is not a secret.

- [ ] **Step 4: Lint and format**

Run: `pnpm lint && pnpm format:check`
Expected: clean. If Prettier changes the files, run `pnpm format` first.

- [ ] **Step 5: Commit**

```bash
git add apps/parts-shop/scripts/shop-import.ts .github/workflows/shop-import.yml
git commit -m "feat(shop): catalog import CLI and manual KV → D1 workflow"
```

---

### Task 8: App skeleton (static, no router)

**Files:**

- Create:
  - `apps/parts-shop/package.json`, `turbo.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
  - `public/_headers`, `public/_redirects`, `public/robots.txt`
  - `src/styles/globals.css`, `src/types.ts`
  - `src/lib/locale-path.ts`, `src/lib/page-props.ts`, `src/lib/routes.ts`, `src/lib/format.ts`
  - `src/main.tsx`, `src/dev-props.ts`
- Copy: `apps/breaker-parts/public/{favicon-32.png,apple-touch-icon.png,logo-krv-128.webp}` → `apps/parts-shop/public/`
- Modify: `.gitignore`

- [ ] **Step 1: Package and tooling files**

`apps/parts-shop/package.json`:

```json
{
  "name": "@kervan/parts-shop",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "node --experimental-strip-types --no-warnings scripts/build-catalog.ts && vite",
    "build": "node --experimental-strip-types --no-warnings scripts/build-catalog.ts && tsc -b && vite build && vite build --ssr src/entry-server.tsx --outDir dist-ssr && node scripts/prerender.mjs && node scripts/check-dist.mjs",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "dependencies": {
    "@kervan/seo": "workspace:*",
    "@kervan/tips": "workspace:*",
    "@kervan/ui": "workspace:*",
    "framer-motion": "^11.11.17",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.3",
    "vite": "^5.4.11"
  }
}
```

`framer-motion` is a peer of `@kervan/ui`. The shop uses no motion in M1a.

`apps/parts-shop/turbo.json` (D1 data is not a tracked input, so never replay a cached build):

```json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "cache": false,
      "outputs": ["dist/**"]
    }
  }
}
```

`apps/parts-shop/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "moduleDetection": "force",
    "noUncheckedSideEffectImports": true
  },
  "include": ["src", "scripts/**/*.ts", "vite.config.ts"]
}
```

`apps/parts-shop/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
  },
  server: {
    port: 5175,
    host: true,
  },
});
```

`apps/parts-shop/index.html`:

```html
<!doctype html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0A0A0B" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <!-- Title, meta and the page props script are written per page by scripts/prerender.mjs. -->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`apps/parts-shop/public/_headers`:

```
# M1 preview: every response is noindex (also robots.txt Disallow and meta robots).
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/favicon-32.png
  Cache-Control: public, max-age=86400
/apple-touch-icon.png
  Cache-Control: public, max-age=86400
/logo-krv-128.webp
  Cache-Control: public, max-age=86400

/*
  X-Robots-Tag: noindex, nofollow
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

`apps/parts-shop/public/_redirects`:

```
# magaza.kervanbreaker.com — no SPA fallback: every page is a prerendered file and
# unknown paths get the nearest 404.html with HTTP 404. (shop.kervanbreaker.com → magaza
# is a Cloudflare Redirect Rule on the zone; Pages cannot match the host here.)
```

`apps/parts-shop/public/robots.txt`:

```
# M1 preview: not for search engines yet (M4 opens it).
User-agent: *
Disallow: /
```

Copy the icons:

```bash
cp apps/breaker-parts/public/favicon-32.png apps/breaker-parts/public/apple-touch-icon.png apps/breaker-parts/public/logo-krv-128.webp apps/parts-shop/public/
```

`.gitignore`: append

```
# Shop catalog snapshot written at build time from D1 (public fields only, still not for git)
apps/parts-shop/.catalog/
```

- [ ] **Step 2: Shared lib files**

`apps/parts-shop/src/types.ts`:

```ts
export type Lang = 'tr' | 'en';
```

`apps/parts-shop/src/lib/locale-path.ts`:

```ts
import type { Lang } from '../types';

/** The URL is the only source of language: "/…" Turkish, "/en/…" English (Turkish slugs kept). */
export const LANGS: readonly Lang[] = ['tr', 'en'];

/** Language-aware link for a neutral (Turkish) path: ('/kirici-ucu', 'en') → '/en/kirici-ucu'. */
export function localePath(path: string, lang: Lang): string {
  if (lang === 'tr') return path;
  return path === '/' ? '/en/' : `/en${path}`;
}
```

`apps/parts-shop/src/lib/routes.ts`:

```ts
import type { PublicCatalog, PublicFamily, TipType } from '@kervan/tips';

export interface FamilyCard {
  code: string;
  /** Neutral path of the family page. */
  path: string;
  diameterMm: number;
  types: TipType[];
  popularTier: 1 | 2 | null;
  /** First breakers it fits ("Brand Model"). */
  fits: string[];
  fitsMore: number;
}

export type PageModel =
  | {
      kind: 'home';
      featured: FamilyCard[];
      featuredArePopular: boolean;
      total: number;
      demo: boolean;
    }
  | { kind: 'list'; rows: FamilyCard[]; demo: boolean }
  | { kind: 'family'; family: PublicFamily; demo: boolean }
  | { kind: 'notFound' };

export interface BuiltPage {
  /** Neutral (Turkish) path. */
  path: string;
  model: PageModel;
}

const FITS_SHOWN = 3;
const FEATURED = 24;

export const familyPath = (code: string): string => `/urun/${code.toLowerCase()}`;
export const LIST_PATH = '/kirici-ucu';

export const breakerName = (b: { brand: string; model: string }): string =>
  `${b.brand} ${b.model}`.trim();

export function familyCard(f: PublicFamily): FamilyCard {
  return {
    code: f.code,
    path: familyPath(f.code),
    diameterMm: f.attrs.diameterMm,
    types: f.skus.map((s) => s.tipType),
    popularTier: f.popularTier,
    fits: f.fits.slice(0, FITS_SHOWN).map(breakerName),
    fitsMore: Math.max(0, f.fits.length - FITS_SHOWN),
  };
}

/** Every page of the site for one catalog (families arrive best-sellers first). */
export function buildPages(c: PublicCatalog): BuiltPage[] {
  const demo = c.demo === true;
  const cards = c.families.map(familyCard);
  const popular = cards.filter((x) => x.popularTier !== null);
  return [
    {
      path: '/',
      model: {
        kind: 'home',
        featured: (popular.length > 0 ? popular : cards).slice(0, FEATURED),
        featuredArePopular: popular.length > 0,
        total: cards.length,
        demo,
      },
    },
    { path: LIST_PATH, model: { kind: 'list', rows: cards, demo } },
    ...c.families.map((family) => ({
      path: familyPath(family.code),
      model: { kind: 'family' as const, family, demo },
    })),
  ];
}
```

`apps/parts-shop/src/lib/page-props.ts`:

```ts
import type { Lang } from '../types';
import type { PageModel } from './routes';

/** Everything a page needs, embedded in its HTML as JSON so the client hydrates the same tree. */
export interface PageProps {
  lang: Lang;
  /** Neutral (Turkish) path, used by the language toggle. */
  path: string;
  model: PageModel;
}

export const PROPS_ID = 'kv-page';

export function readPageProps(doc: Document): PageProps | null {
  const text = doc.getElementById(PROPS_ID)?.textContent;
  if (!text) return null;
  try {
    return JSON.parse(text) as PageProps;
  } catch {
    return null;
  }
}
```

`apps/parts-shop/src/lib/format.ts`:

```ts
import type { Range } from '@kervan/tips';
import type { Lang } from '../types';

const nf = (lang: Lang) =>
  new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 1 });

export const fmtNum = (n: number, lang: Lang): string => nf(lang).format(n);

/** "1.200–1.300 mm", "1.250 mm" or "—". */
export function fmtRange(r: Range | null, unit: string, lang: Lang): string {
  if (!r) return '—';
  const a = fmtNum(r.min, lang);
  const b = fmtNum(r.max, lang);
  return `${a === b ? a : `${a}–${b}`} ${unit}`;
}

export const fmtMm = (n: number | null, lang: Lang): string =>
  n === null ? '—' : `${fmtNum(n, lang)} mm`;
```

`apps/parts-shop/src/styles/globals.css`:

```css
@import 'tailwindcss';
@import '@kervan/ui/tokens.css';

/* Scan @kervan/ui sources so utilities used inside the package are emitted. */
@source "../../../../packages/ui/src/**/*.{ts,tsx}";

@layer base {
  :focus-visible {
    outline: 2px solid var(--color-brand);
    outline-offset: 2px;
  }
  html {
    background: var(--color-bg);
    color: var(--color-ink);
  }
  body {
    margin: 0;
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

Do **not** add an unlayered `a { color: inherit }` rule. Tailwind's preflight already resets links inside `@layer base`, so colour utilities on `<a>` keep working. The other two apps work around their unlayered rule.

`apps/parts-shop/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App';
import { readPageProps } from './lib/page-props';

const rootEl = document.getElementById('root')!;
const props = readPageProps(document);

if (props) {
  // Prerendered page: hydrate exactly what the build rendered (no motion in M1a).
  hydrateRoot(
    rootEl,
    <StrictMode>
      <App {...props} />
    </StrictMode>,
  );
} else if (import.meta.env.DEV) {
  // `vite` dev server: no prerendered HTML, render the DEMO catalog for this URL.
  void import('./dev-props').then(({ devProps }) => {
    createRoot(rootEl).render(
      <StrictMode>
        <App {...devProps(window.location.pathname)} />
      </StrictMode>,
    );
  });
}
```

`apps/parts-shop/src/dev-props.ts`:

```ts
import { demoCatalog } from '@kervan/tips';
import { buildPages } from './lib/routes';
import type { PageProps } from './lib/page-props';

/** Dev server only: page props for a URL from the DEMO catalog. */
export function devProps(pathname: string): PageProps {
  const lang = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'tr';
  const neutral = lang === 'en' ? pathname.slice(3) || '/' : pathname;
  const page = buildPages(demoCatalog()).find((p) => p.path === neutral);
  return { lang, path: page?.path ?? neutral, model: page?.model ?? { kind: 'notFound' } };
}
```

- [ ] **Step 3: Install**

Run: `pnpm install`
Expected: the lockfile gains `@kervan/parts-shop`, with no errors. Do not build yet: `App` and the scripts come in Tasks 9–10.

- [ ] **Step 4: Commit**

```bash
git add apps/parts-shop .gitignore pnpm-lock.yaml
git commit -m "feat(shop): parts-shop app skeleton (static pages, noindex, no router)"
```

---

### Task 9: Pages, layout and dictionary

**Files:**

- Create:
  - `apps/parts-shop/src/lib/dict.ts`, `src/lib/page-head.ts`
  - `src/App.tsx`, `src/components/Layout.tsx`, `src/components/FamilyCardView.tsx`
  - `src/pages/Home.tsx`, `src/pages/TipList.tsx`, `src/pages/Family.tsx`, `src/pages/NotFound.tsx`

- [ ] **Step 1: Dictionary**

`apps/parts-shop/src/lib/dict.ts`:

```ts
import type { TipType } from '@kervan/tips';
import type { Lang } from '../types';

export interface Dict {
  meta: {
    siteName: string;
    homeTitle: string;
    homeDesc: string;
    listTitle: string;
    listDesc: string;
    familyTitle: (code: string, d: string, fits: string) => string;
    familyDesc: (code: string, d: string, types: string) => string;
    notFoundTitle: string;
  };
  nav: { label: string; tips: string; catalogSite: string; langLabel: string; langOther: string };
  banner: { preview: string; demo: string };
  tip: Record<TipType, string>;
  home: {
    eyebrow: string;
    title: string;
    lead: string;
    cta: string;
    popular: string;
    featured: string;
    count: (n: number) => string;
  };
  card: { popular: string; fits: string; more: (n: number) => string; view: string };
  list: {
    title: string;
    lead: string;
    code: string;
    diameter: string;
    types: string;
    fits: string;
  };
  family: {
    kicker: (d: string) => string;
    dims: string;
    diameter: string;
    collar: string;
    keyCount: string;
    keyThickness: string;
    slotLength: string;
    backEndToSlot: string;
    slotEnd: string;
    slotRounded: string;
    slotTapered: string;
    rearStep: string;
    yes: string;
    no: string;
    rearDiameter: string;
    variants: string;
    type: string;
    length: string;
    weight: string;
    angle: string;
    availability: string;
    inStock: (n: number) => string;
    lead: (days: number) => string;
    ask: string;
    fits: string;
    carrier: string;
    carrierValue: (min: number, max: number) => string;
    carrierNote: string;
    quoteTitle: string;
    quoteBody: string;
    whatsapp: string;
    email: string;
    whatsappText: (code: string) => string;
    measureNote: string;
    marks: string;
  };
  footer: { legal: string; kvkk: string; marks: string };
  notFound: { title: string; body: string; home: string };
}

export const DICT: Record<Lang, Dict> = {
  tr: {
    meta: {
      siteName: 'Kervan Mağaza',
      homeTitle: 'Hidrolik kırıcı uçları | Kervan Mağaza',
      homeDesc:
        'Kervan üretimi hidrolik kırıcı uçları: ölçüler, uyumlu kırıcılar ve fiyat teklifi.',
      listTitle: 'Tüm kırıcı uçları | Kervan Mağaza',
      listDesc: 'Kervan kırıcı uçlarının tam listesi: çap, uç tipleri ve uyumlu kırıcılar.',
      familyTitle: (code, d, fits) =>
        `${code} kırıcı ucu Ø${d}${fits ? ` – ${fits}` : ''} | Kervan Mağaza`,
      familyDesc: (code, d, types) =>
        `${code}: Ø${d} mm kırıcı ucu (${types}). Ölçü tablosu ve uyumlu kırıcılar.`,
      notFoundTitle: 'Sayfa bulunamadı | Kervan Mağaza',
    },
    nav: {
      label: 'Ana menü',
      tips: 'Kırıcı uçları',
      catalogSite: 'kervanbreaker.com',
      langLabel: 'English',
      langOther: 'EN',
    },
    banner: {
      preview: 'Önizleme: mağaza hazırlanıyor, henüz sipariş alınmıyor. Fiyat için bize yazın.',
      demo: 'DEMO verisi: bu ürünler gerçek değildir.',
    },
    tip: {
      chisel: 'Keski',
      moil: 'Sivri',
      blunt: 'Küt',
      pyramid: 'Piramit',
      conical: 'Konik',
      asphalt: 'Asfalt',
    },
    home: {
      eyebrow: 'Kervan üretimi · Kartepe',
      title: 'Hidrolik kırıcı uçları',
      lead: 'Kendi tezgâhımızda işlenen, kendi fırınlarımızda ısıl işlem gören uçlar. Ölçüleri karşılaştırın, kırıcınıza uyanı bulun.',
      cta: 'Tüm uçları gör',
      popular: 'Çok satanlar',
      featured: 'Uçlar',
      count: (n) => `${n} uç ailesi`,
    },
    card: {
      popular: 'Çok satan',
      fits: 'Uyumlu',
      more: (n) => `+${n} kırıcı`,
      view: 'Ölçüleri gör',
    },
    list: {
      title: 'Tüm kırıcı uçları',
      lead: 'Çok satanlar önce, sonra çapa göre.',
      code: 'Kod',
      diameter: 'Çap',
      types: 'Tipler',
      fits: 'Uyumlu kırıcılar',
    },
    family: {
      kicker: (d) => `Ø${d} mm hidrolik kırıcı ucu`,
      dims: 'Gövde ölçüleri',
      diameter: 'Çalışma çapı (D)',
      collar: 'Yaka çapı',
      keyCount: 'Kama yuvası sayısı',
      keyThickness: 'Kama kalınlığı',
      slotLength: 'Kama yuvası boyu',
      backEndToSlot: 'Arka uç – kama yuvası',
      slotEnd: 'Kama yuvası ucu',
      slotRounded: 'Yuvarlak',
      slotTapered: 'Konik rampa',
      rearStep: 'Arka kademe',
      yes: 'Var',
      no: 'Yok',
      rearDiameter: 'Arka çap',
      variants: 'Uç tipleri',
      type: 'Tip',
      length: 'Boy',
      weight: 'Ağırlık',
      angle: 'Uç açısı',
      availability: 'Durum',
      inStock: (n) => (n >= 10 ? 'Stokta (10+)' : `Stokta (${n})`),
      lead: (days) => `Üretim ~${days} iş günü`,
      ask: 'Fiyat ve süre için sorun',
      fits: 'Uyumlu kırıcılar',
      carrier: 'Taşıyıcı (yaklaşık)',
      carrierValue: (min, max) => `${min}–${max} t ekskavatör`,
      carrierNote: 'Yaklaşık değerdir; kırıcı üreticisinin önerisi geçerlidir.',
      quoteTitle: 'Fiyat teklifi isteyin',
      quoteBody: 'Kodu ve kırıcınızın modelini yazın; fiyat ve teslim süresini iletelim.',
      whatsapp: 'WhatsApp ile sor',
      email: 'E-posta gönder',
      whatsappText: (code) =>
        `Merhaba, ${code} kırıcı ucu için fiyat ve teslim süresi öğrenmek istiyorum.`,
      measureNote:
        'Ölçüler tablodaki gibidir. Sipariş vermeden önce eski ucunuzla ve kırıcınızın modeliyle karşılaştırın.',
      marks:
        'Kırıcı marka ve model adları yalnız uyumu belirtmek içindir; markalar sahiplerine aittir.',
    },
    footer: {
      legal: 'Üretici ve satıcı',
      kvkk: 'KVKK aydınlatma metni',
      marks: 'Markalar sahiplerine aittir.',
    },
    notFound: {
      title: 'Sayfa bulunamadı',
      body: 'Aradığınız sayfa yok ya da taşındı.',
      home: 'Ana sayfaya dön',
    },
  },
  en: {
    meta: {
      siteName: 'Kervan Shop',
      homeTitle: 'Hydraulic breaker tips | Kervan Shop',
      homeDesc: 'Hydraulic breaker tips made by Kervan: dimensions, fitting breakers and quotes.',
      listTitle: 'All breaker tips | Kervan Shop',
      listDesc: 'The full list of Kervan breaker tips: diameter, tip types and fitting breakers.',
      familyTitle: (code, d, fits) =>
        `${code} breaker tip Ø${d}${fits ? ` – ${fits}` : ''} | Kervan Shop`,
      familyDesc: (code, d, types) =>
        `${code}: Ø${d} mm breaker tip (${types}). Dimension table and fitting breakers.`,
      notFoundTitle: 'Page not found | Kervan Shop',
    },
    nav: {
      label: 'Main menu',
      tips: 'Breaker tips',
      catalogSite: 'kervanbreaker.com',
      langLabel: 'Türkçe',
      langOther: 'TR',
    },
    banner: {
      preview:
        'Preview: the shop is being prepared and does not take orders yet. Write to us for prices.',
      demo: 'DEMO data: these products are not real.',
    },
    tip: {
      chisel: 'Chisel',
      moil: 'Moil',
      blunt: 'Blunt',
      pyramid: 'Pyramid',
      conical: 'Conical',
      asphalt: 'Asphalt',
    },
    home: {
      eyebrow: 'Made by Kervan · Kartepe, Türkiye',
      title: 'Hydraulic breaker tips',
      lead: 'Machined on our own lathes and heat-treated in our own furnaces. Compare the dimensions and find the tip for your breaker.',
      cta: 'See all tips',
      popular: 'Best sellers',
      featured: 'Tips',
      count: (n) => `${n} tip families`,
    },
    card: {
      popular: 'Best seller',
      fits: 'Fits',
      more: (n) => `+${n} breakers`,
      view: 'See dimensions',
    },
    list: {
      title: 'All breaker tips',
      lead: 'Best sellers first, then by diameter.',
      code: 'Code',
      diameter: 'Diameter',
      types: 'Types',
      fits: 'Fitting breakers',
    },
    family: {
      kicker: (d) => `Ø${d} mm hydraulic breaker tip`,
      dims: 'Shank dimensions',
      diameter: 'Working diameter (D)',
      collar: 'Collar diameter',
      keyCount: 'Key slots',
      keyThickness: 'Key thickness',
      slotLength: 'Key slot length',
      backEndToSlot: 'Back end to slot',
      slotEnd: 'Slot end',
      slotRounded: 'Rounded',
      slotTapered: 'Tapered ramp',
      rearStep: 'Rear step',
      yes: 'Yes',
      no: 'No',
      rearDiameter: 'Rear diameter',
      variants: 'Tip types',
      type: 'Type',
      length: 'Length',
      weight: 'Weight',
      angle: 'Tip angle',
      availability: 'Availability',
      inStock: (n) => (n >= 10 ? 'In stock (10+)' : `In stock (${n})`),
      lead: (days) => `Made to order, ~${days} working days`,
      ask: 'Ask for price and lead time',
      fits: 'Fitting breakers',
      carrier: 'Carrier (approx.)',
      carrierValue: (min, max) => `${min}–${max} t excavator`,
      carrierNote: 'Approximate; the breaker maker’s recommendation wins.',
      quoteTitle: 'Ask for a quote',
      quoteBody: 'Send the code and your breaker model; we will reply with price and lead time.',
      whatsapp: 'Ask on WhatsApp',
      email: 'Send an email',
      whatsappText: (code) =>
        `Hello, I would like the price and lead time for breaker tip ${code}.`,
      measureNote:
        'Dimensions are as in the table. Compare them with your old tip and your breaker model before ordering.',
      marks: 'Breaker brand and model names only indicate fit; the marks belong to their owners.',
    },
    footer: {
      legal: 'Manufacturer and seller',
      kvkk: 'Privacy notice (KVKK)',
      marks: 'Marks belong to their owners.',
    },
    notFound: {
      title: 'Page not found',
      body: 'The page does not exist or has moved.',
      home: 'Back to the home page',
    },
  },
};
```

- [ ] **Step 2: Head data**

`apps/parts-shop/src/lib/page-head.ts`:

```ts
import type { HeadInput } from '@kervan/seo';
import { DICT } from './dict';
import { localePath } from './locale-path';
import { breakerName } from './routes';
import { fmtNum } from './format';
import type { PageProps } from './page-props';

export const SITE = 'https://magaza.kervanbreaker.com';

/** Head for one page. M1: every page is noindex (M4 removes `robots` for indexable pages). */
export function pageHead({ lang, path, model }: PageProps): HeadInput {
  const t = DICT[lang];
  const m = t.meta;
  const base = { lang, robots: 'noindex, nofollow', siteName: m.siteName } as const;
  if (model.kind === 'notFound') return { ...base, title: m.notFoundTitle };
  const alternates = { tr: SITE + localePath(path, 'tr'), en: SITE + localePath(path, 'en') };
  const page = { ...base, canonical: alternates[lang], alternates };
  switch (model.kind) {
    case 'home':
      return { ...page, title: m.homeTitle, description: m.homeDesc };
    case 'list':
      return { ...page, title: m.listTitle, description: m.listDesc };
    case 'family': {
      const f = model.family;
      const d = fmtNum(f.attrs.diameterMm, lang);
      const first = f.fits[0] ? breakerName(f.fits[0]) : '';
      const types = f.skus.map((s) => t.tip[s.tipType]).join(', ');
      return {
        ...page,
        title: m.familyTitle(f.code, d, first),
        description: m.familyDesc(f.code, d, types),
      };
    }
  }
}
```

- [ ] **Step 3: Components and pages**

`apps/parts-shop/src/components/Layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Container } from '@kervan/ui';
import {
  ORG_EMAIL,
  ORG_LEGAL_NAME,
  ORG_LOCALITY,
  ORG_PHONE,
  ORG_PHONE_E164,
  ORG_REGION,
  ORG_STREET,
} from '@kervan/seo';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { LIST_PATH } from '../lib/routes';
import type { Lang } from '../types';

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';

interface Props {
  lang: Lang;
  path: string;
  t: Dict;
  demo: boolean;
  children: ReactNode;
}

export default function Layout({ lang, path, t, demo, children }: Props) {
  const other: Lang = lang === 'tr' ? 'en' : 'tr';
  return (
    <>
      <div className="bg-bg-warm text-ink-mid text-sm">
        <Container className="py-2">{t.banner.preview}</Container>
      </div>
      {demo && (
        <div className="bg-brand text-bg text-sm font-medium">
          <Container className="py-2">{t.banner.demo}</Container>
        </div>
      )}
      <header className="border-b border-hair">
        <Container className="flex items-center justify-between gap-6 py-4">
          <a href={localePath('/', lang)} className={`flex items-center gap-3 ${FOCUS}`}>
            <img
              src="/logo-krv-128.webp"
              alt=""
              width={36}
              height={36}
              className="size-9 rounded-sm"
            />
            <span className="font-serif text-xl text-ink">{t.meta.siteName}</span>
          </a>
          <nav aria-label={t.nav.label} className="flex items-center gap-5 font-sans text-sm">
            <a
              href={localePath(LIST_PATH, lang)}
              className={`text-ink hover:text-brand-hi ${FOCUS}`}
            >
              {t.nav.tips}
            </a>
            <a
              href={lang === 'tr' ? 'https://kervanbreaker.com/' : 'https://kervanbreaker.com/en/'}
              className={`hidden sm:inline text-ink-mid hover:text-ink ${FOCUS}`}
            >
              {t.nav.catalogSite}
            </a>
            <a
              href={localePath(path, other)}
              hrefLang={other}
              aria-label={t.nav.langLabel}
              className={`text-ink-mid hover:text-ink ${FOCUS}`}
            >
              {t.nav.langOther}
            </a>
          </nav>
        </Container>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-hair">
        <Container className="grid gap-6 py-10 font-sans text-sm text-ink-mid md:grid-cols-2">
          <div>
            <p className="m-0 text-xs uppercase tracking-widest text-ink-soft">{t.footer.legal}</p>
            <p className="m-0 mt-2 text-ink">{ORG_LEGAL_NAME}</p>
            <p className="m-0">
              {ORG_STREET}, {ORG_LOCALITY}/{ORG_REGION}
            </p>
            <p className="m-0">
              <a href={`tel:${ORG_PHONE_E164}`} className={`hover:text-ink ${FOCUS}`}>
                {ORG_PHONE}
              </a>
              {' · '}
              <a href={`mailto:${ORG_EMAIL}`} className={`hover:text-ink ${FOCUS}`}>
                {ORG_EMAIL}
              </a>
            </p>
          </div>
          <div className="md:text-right">
            <a
              href="https://kervanbreaker.com/kvkk"
              className={`underline hover:text-ink ${FOCUS}`}
            >
              {t.footer.kvkk}
            </a>
            <p className="m-0 mt-2 text-ink-soft">{t.footer.marks}</p>
          </div>
        </Container>
      </footer>
    </>
  );
}
```

`apps/parts-shop/src/components/FamilyCardView.tsx`:

```tsx
import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import type { FamilyCard } from '../lib/routes';
import type { Lang } from '../types';

export default function FamilyCardView({ c, lang, t }: { c: FamilyCard; lang: Lang; t: Dict }) {
  return (
    <a
      href={localePath(c.path, lang)}
      className="group flex h-full flex-col gap-3 rounded-md border border-hair bg-bg-soft p-5 transition-colors hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-serif text-2xl text-ink">Ø{fmtNum(c.diameterMm, lang)}</span>
        {c.popularTier !== null && (
          <span className="rounded-pill border border-brand px-2.5 py-0.5 text-xs font-medium text-brand-hi">
            {t.card.popular}
          </span>
        )}
      </div>
      <span className="font-sans text-sm tracking-wide text-ink-mid">{c.code}</span>
      <span className="font-sans text-sm text-ink">{c.types.map((x) => t.tip[x]).join(' · ')}</span>
      {c.fits.length > 0 && (
        <span className="font-sans text-xs text-ink-mid">
          {t.card.fits}: {c.fits.join(', ')}
          {c.fitsMore > 0 && ` ${t.card.more(c.fitsMore)}`}
        </span>
      )}
      <span className="mt-auto font-sans text-sm text-brand-hi group-hover:underline">
        {t.card.view} →
      </span>
    </a>
  );
}
```

`apps/parts-shop/src/pages/Home.tsx`:

```tsx
import { Container } from '@kervan/ui';
import FamilyCardView from '../components/FamilyCardView';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import { LIST_PATH, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'home' }>;

export default function Home({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  return (
    <>
      <Container className="py-16 md:py-24">
        <p className="m-0 font-sans text-xs uppercase tracking-[0.2em] text-brand-hi">
          {t.home.eyebrow}
        </p>
        <h1 className="m-0 mt-4 font-serif text-5xl italic leading-tight text-ink md:text-6xl">
          {t.home.title}
        </h1>
        <p className="m-0 mt-6 max-w-2xl font-sans text-lg text-ink-mid">{t.home.lead}</p>
        <a
          href={localePath(LIST_PATH, lang)}
          className="mt-8 inline-block rounded-pill bg-brand px-6 py-3 font-sans text-sm font-medium text-bg hover:bg-brand-hi focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
        >
          {t.home.cta} · {t.home.count(model.total)}
        </a>
      </Container>
      <section aria-labelledby="featured">
        <Container className="pb-8">
          <h2 id="featured" className="m-0 mb-6 font-serif text-3xl text-ink">
            {model.featuredArePopular ? t.home.popular : t.home.featured}
          </h2>
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {model.featured.map((c) => (
              <li key={c.code}>
                <FamilyCardView c={c} lang={lang} t={t} />
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
```

`Container` only takes `children`, `as`, `wide` and `className`. Put ARIA attributes on a wrapping element, as with the `<section>` above.

`apps/parts-shop/src/pages/TipList.tsx`:

```tsx
import { Container } from '@kervan/ui';
import type { Dict } from '../lib/dict';
import { fmtNum } from '../lib/format';
import { localePath } from '../lib/locale-path';
import type { PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'list' }>;

export default function TipList({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  return (
    <Container className="py-12">
      <h1 className="m-0 font-serif text-4xl text-ink">{t.list.title}</h1>
      <p className="m-0 mt-3 font-sans text-ink-mid">{t.list.lead}</p>
      <div className="mt-8 overflow-x-auto rounded-md border border-hair">
        <table className="w-full border-collapse font-sans text-sm tabular-nums">
          <thead className="bg-bg-soft text-left text-ink-mid">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                {t.list.code}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t.list.diameter}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t.list.types}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t.list.fits}
              </th>
            </tr>
          </thead>
          <tbody>
            {model.rows.map((r) => (
              <tr key={r.code} className="border-t border-hair">
                <th scope="row" className="px-4 py-3 text-left font-medium">
                  <a
                    href={localePath(r.path, lang)}
                    className="text-ink underline decoration-hair underline-offset-4 hover:decoration-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                  >
                    {r.code}
                  </a>
                  {r.popularTier !== null && (
                    <span className="ml-2 text-xs text-brand-hi">{t.card.popular}</span>
                  )}
                </th>
                <td className="px-4 py-3 text-ink">Ø{fmtNum(r.diameterMm, lang)}</td>
                <td className="px-4 py-3 text-ink">{r.types.map((x) => t.tip[x]).join(', ')}</td>
                <td className="px-4 py-3 text-ink-mid">
                  {r.fits.join(', ')}
                  {r.fitsMore > 0 && ` ${t.card.more(r.fitsMore)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
```

`apps/parts-shop/src/pages/Family.tsx`:

```tsx
import { carrierTons, type PublicSku } from '@kervan/tips';
import { Container } from '@kervan/ui';
import { ORG_EMAIL, ORG_PHONE_E164 } from '@kervan/seo';
import type { Dict } from '../lib/dict';
import { fmtMm, fmtNum, fmtRange } from '../lib/format';
import { breakerName, type PageModel } from '../lib/routes';
import type { Lang } from '../types';

type Model = Extract<PageModel, { kind: 'family' }>;

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';

function availabilityText(s: PublicSku, t: Dict): string {
  const a = s.availability;
  return a.kind === 'stock'
    ? t.family.inStock(a.qty)
    : a.kind === 'lead'
      ? t.family.lead(a.days)
      : t.family.ask;
}

export default function Family({ model, lang, t }: { model: Model; lang: Lang; t: Dict }) {
  const f = model.family;
  const a = f.attrs;
  const tf = t.family;
  const tons = carrierTons(a.diameterMm);
  const dims: [string, string][] = [
    [tf.diameter, fmtMm(a.diameterMm, lang)],
    [tf.collar, fmtMm(a.collarDiameterMm, lang)],
    [tf.keyCount, a.key.count === null ? '—' : String(a.key.count)],
    [tf.keyThickness, fmtMm(a.key.thicknessMm, lang)],
    [tf.slotLength, fmtMm(a.key.slotLengthMm, lang)],
    [tf.backEndToSlot, fmtMm(a.key.backEndToSlotMm, lang)],
    [
      tf.slotEnd,
      a.key.slotEnd === 'rounded'
        ? tf.slotRounded
        : a.key.slotEnd === 'tapered'
          ? tf.slotTapered
          : '—',
    ],
    [tf.rearStep, a.rear.step === null ? '—' : a.rear.step ? tf.yes : tf.no],
    [tf.rearDiameter, fmtMm(a.rear.diameterMm, lang)],
  ];
  const wa = `https://wa.me/${ORG_PHONE_E164.replace('+', '')}?text=${encodeURIComponent(tf.whatsappText(f.code))}`;
  const mail = `mailto:${ORG_EMAIL}?subject=${encodeURIComponent(f.code)}&body=${encodeURIComponent(tf.whatsappText(f.code))}`;

  return (
    <Container className="py-12">
      <p className="m-0 font-sans text-xs uppercase tracking-[0.2em] text-brand-hi">
        {tf.kicker(fmtNum(a.diameterMm, lang))}
      </p>
      <h1 className="m-0 mt-3 font-serif text-5xl text-ink">{f.code}</h1>
      {f.popularTier !== null && (
        <p className="m-0 mt-3 inline-block rounded-pill border border-brand px-3 py-1 font-sans text-xs font-medium text-brand-hi">
          {t.card.popular}
        </p>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-10">
          <section aria-labelledby="variants">
            <h2 id="variants" className="m-0 mb-4 font-serif text-2xl text-ink">
              {tf.variants}
            </h2>
            <div className="overflow-x-auto rounded-md border border-hair">
              <table className="w-full border-collapse font-sans text-sm tabular-nums">
                <thead className="bg-bg-soft text-left text-ink-mid">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {tf.type}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {tf.length}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {tf.weight}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {tf.angle}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {tf.availability}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {f.skus.map((s) => (
                    <tr key={s.code} id={s.tipType} className="border-t border-hair">
                      <th scope="row" className="px-4 py-3 text-left font-medium text-ink">
                        {t.tip[s.tipType]}
                        <span className="block text-xs font-normal text-ink-soft">{s.code}</span>
                      </th>
                      <td className="px-4 py-3 text-ink">{fmtRange(s.lengthMm, 'mm', lang)}</td>
                      <td className="px-4 py-3 text-ink">{fmtRange(s.weightKg, 'kg', lang)}</td>
                      <td className="px-4 py-3 text-ink">
                        {s.tipAngleDeg === null ? '—' : `${fmtNum(s.tipAngleDeg, lang)}°`}
                      </td>
                      <td className="px-4 py-3 text-ink-mid">{availabilityText(s, t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="dims">
            <h2 id="dims" className="m-0 mb-4 font-serif text-2xl text-ink">
              {tf.dims}
            </h2>
            <dl className="m-0 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {dims.map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 border-t border-hair py-3 font-sans text-sm"
                >
                  <dt className="text-ink-mid">{k}</dt>
                  <dd className="m-0 text-ink tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="m-0 mt-4 font-sans text-sm text-ink-mid">{tf.measureNote}</p>
          </section>

          {f.fits.length > 0 && (
            <section aria-labelledby="fits">
              <h2 id="fits" className="m-0 mb-4 font-serif text-2xl text-ink">
                {tf.fits}
              </h2>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0 font-sans text-sm">
                {f.fits.map((b) => (
                  <li key={b.slug} className="rounded-pill border border-hair px-3 py-1 text-ink">
                    {breakerName(b)}
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-4 font-sans text-xs text-ink-soft">{tf.marks}</p>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          {tons && (
            <div className="rounded-md border border-hair bg-bg-soft p-5 font-sans text-sm">
              <p className="m-0 text-xs uppercase tracking-widest text-ink-soft">{tf.carrier}</p>
              <p className="m-0 mt-2 text-lg text-ink">{tf.carrierValue(tons.min, tons.max)}</p>
              <p className="m-0 mt-2 text-ink-mid">{tf.carrierNote}</p>
            </div>
          )}
          <div className="rounded-md border border-brand bg-bg-soft p-5 font-sans text-sm">
            <p className="m-0 font-serif text-xl text-ink">{tf.quoteTitle}</p>
            <p className="m-0 mt-2 text-ink-mid">{tf.quoteBody}</p>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={wa}
                className={`rounded-pill bg-whatsapp px-5 py-3 text-center font-medium text-white ${FOCUS}`}
              >
                {tf.whatsapp}
              </a>
              <a
                href={mail}
                className={`rounded-pill border border-ink-soft px-5 py-3 text-center text-ink hover:bg-bg-warm ${FOCUS}`}
              >
                {tf.email}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
```

`apps/parts-shop/src/pages/NotFound.tsx`:

```tsx
import { Container } from '@kervan/ui';
import type { Dict } from '../lib/dict';
import { localePath } from '../lib/locale-path';
import type { Lang } from '../types';

export default function NotFound({ lang, t }: { lang: Lang; t: Dict }) {
  return (
    <Container className="py-24">
      <h1 className="m-0 font-serif text-4xl text-ink">{t.notFound.title}</h1>
      <p className="m-0 mt-4 font-sans text-ink-mid">{t.notFound.body}</p>
      <a
        href={localePath('/', lang)}
        className="mt-6 inline-block font-sans text-brand-hi underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
      >
        {t.notFound.home}
      </a>
    </Container>
  );
}
```

`apps/parts-shop/src/App.tsx`:

```tsx
import Layout from './components/Layout';
import { DICT } from './lib/dict';
import type { PageProps } from './lib/page-props';
import Family from './pages/Family';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import TipList from './pages/TipList';

export default function App({ lang, path, model }: PageProps) {
  const t = DICT[lang];
  const demo = model.kind !== 'notFound' && model.demo;
  return (
    <Layout lang={lang} path={path} t={t} demo={demo}>
      {model.kind === 'home' && <Home model={model} lang={lang} t={t} />}
      {model.kind === 'list' && <TipList model={model} lang={lang} t={t} />}
      {model.kind === 'family' && <Family model={model} lang={lang} t={t} />}
      {model.kind === 'notFound' && <NotFound lang={lang} t={t} />}
    </Layout>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @kervan/parts-shop typecheck`
Expected: no errors. The scripts from Task 7 and Task 10 are included. If `build-catalog.ts` does not exist yet, typecheck still passes, because `include` uses globs.

Check that the token utilities exist before relying on them. `grep -n "color-whatsapp\|radius-pill\|color-brand-hi\|color-hair\b" packages/ui/src/tokens.css` must show each one. The class names follow the other apps (`rounded-pill`, `bg-whatsapp`, `border-hair`, `text-ink-soft`).

- [ ] **Step 5: Commit**

```bash
git add apps/parts-shop/src
git commit -m "feat(shop): home, tip list and family pages with TR/EN dictionary"
```

---

### Task 10: Build pipeline (catalog snapshot, prerender, dist guard)

**Files:**

- Create: `apps/parts-shop/scripts/build-catalog.ts`, `apps/parts-shop/src/entry-server.tsx`, `apps/parts-shop/scripts/prerender.mjs`, `apps/parts-shop/scripts/check-dist.mjs`

- [ ] **Step 1: Catalog snapshot**

`apps/parts-shop/scripts/build-catalog.ts`:

```ts
// Writes apps/parts-shop/.catalog/catalog.json (gitignored) for the prerender.
// - With SHOP_D1=<database name> + CLOUDFLARE_API_TOKEN (+ CLOUDFLARE_ACCOUNT_ID): reads the
//   published rows from D1 and keeps only public fields (toPublicCatalog).
// - Otherwise keeps an existing snapshot, or writes the DEMO catalog.
// - SHOP_REQUIRE_CATALOG=1 turns any D1 failure into a build failure (production).
// Prints counts only: this public repo's CI logs must never show catalog data.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  demoCatalog,
  toPublicCatalog,
  type FamilyRow,
  type FitRow,
  type PublicCatalog,
  type SkuRow,
} from '../../../packages/tips/src/index.ts';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, '.catalog', 'catalog.json');
const log = (s: string) => process.stdout.write(`build-catalog: ${s}\n`);

const FAMILIES_SQL = 'SELECT id, code, attrs, popular_tier FROM families WHERE published = 1';
const SKUS_SQL =
  'SELECT s.family_id, s.code, s.tip_type, s.length_min_mm, s.length_max_mm, s.weight_min_kg, s.weight_max_kg, s.tip_angle_deg, s.price_usd_net_cents, s.stock_qty, s.lead_time_days FROM skus s JOIN families f ON f.id = s.family_id WHERE s.published = 1 AND f.published = 1';
const FITS_SQL =
  'SELECT ft.family_id, b.brand, b.model, b.slug FROM fitments ft JOIN breakers b ON b.id = ft.breaker_id JOIN families f ON f.id = ft.family_id WHERE f.published = 1 ORDER BY b.brand, b.model';

function query<T>(db: string, sql: string): T[] {
  const out = execFileSync(
    'pnpm',
    ['exec', 'wrangler', 'd1', 'execute', db, '--remote', '--json', '--command', sql],
    {
      cwd: APP,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const parsed = JSON.parse(out) as { results?: T[] }[];
  return parsed.flatMap((b) => b.results ?? []);
}

function write(c: PublicCatalog, what: string) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(c));
  log(
    `${what}: ${c.families.length} families, ${c.families.reduce((n, f) => n + f.skus.length, 0)} SKUs`,
  );
}

const db = process.env.SHOP_D1;
const required = process.env.SHOP_REQUIRE_CATALOG === '1';

if (db && process.env.CLOUDFLARE_API_TOKEN) {
  try {
    const c = toPublicCatalog(
      query<FamilyRow>(db, FAMILIES_SQL),
      query<SkuRow>(db, SKUS_SQL),
      query<FitRow>(db, FITS_SQL),
    );
    if (required && c.families.length === 0) throw new Error('empty catalog');
    write(c, 'D1');
  } catch (e) {
    if (required) {
      log(`FAILED (${e instanceof Error ? e.message.split('\n')[0] : 'error'})`);
      process.exit(1);
    }
    write(demoCatalog(), 'D1 unavailable, DEMO');
  }
} else if (required) {
  log('FAILED (SHOP_D1 / CLOUDFLARE_API_TOKEN not set)');
  process.exit(1);
} else if (fs.existsSync(OUT)) {
  log('keeping the existing snapshot');
} else {
  write(demoCatalog(), 'DEMO');
}
```

Error output: `e.message` from `execFileSync` holds only the command line, because stdout and stderr are captured or ignored. The command line has no data and no token: the token is in the environment. `--remote`/`--json` must be listed by `pnpm exec wrangler d1 execute --help`.

- [ ] **Step 2: Server entry**

`apps/parts-shop/src/entry-server.tsx`:

```tsx
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { buildHeadTags } from '@kervan/seo';
import type { PublicCatalog } from '@kervan/tips';
import App from './App';
import { pageHead } from './lib/page-head';
import { LANGS, localePath } from './lib/locale-path';
import type { PageProps } from './lib/page-props';
import { buildPages } from './lib/routes';
import type { Lang } from './types';

/* Build-time only (scripts/prerender.mjs bundles this to dist-ssr/ and deletes it). */

export { injectHead, jsonForScript } from '@kervan/seo';
export { PROPS_ID } from './lib/page-props';

export interface PrerenderPage {
  file: string;
  lang: Lang;
  headTags: string;
  appHtml: string;
  props: PageProps;
}

/** "/" → index.html, "/en/" → en/index.html, "/urun/ku135-07" → urun/ku135-07.html. */
const fileFor = (url: string): string =>
  url === '/' ? 'index.html' : url === '/en/' ? 'en/index.html' : `${url.slice(1)}.html`;

export function render(props: PageProps): string {
  return renderToString(
    <StrictMode>
      <App {...props} />
    </StrictMode>,
  );
}

export function prerender(catalog: PublicCatalog): PrerenderPage[] {
  const out: PrerenderPage[] = [];
  for (const lang of LANGS) {
    for (const p of buildPages(catalog)) {
      const props: PageProps = { lang, path: p.path, model: p.model };
      out.push({
        file: fileFor(localePath(p.path, lang)),
        lang,
        headTags: buildHeadTags(pageHead(props)),
        appHtml: render(props),
        props,
      });
    }
    const nf: PageProps = { lang, path: '/', model: { kind: 'notFound' } };
    out.push({
      file: lang === 'tr' ? '404.html' : 'en/404.html',
      lang,
      headTags: buildHeadTags(pageHead(nf)),
      appHtml: render(nf),
      props: nf,
    });
  }
  return out;
}
```

- [ ] **Step 3: Prerender and dist guard**

`apps/parts-shop/scripts/prerender.mjs`:

```js
// Build step after `vite build` and `vite build --ssr src/entry-server.tsx`: one HTML file per
// page and language with its page props embedded (the client hydrates them), then deletes dist-ssr/.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(APP, 'dist');
const SSR = path.join(APP, 'dist-ssr');
const CATALOG = path.join(APP, '.catalog', 'catalog.json');

process.env.NODE_ENV ??= 'production';

try {
  const ssr = await import(pathToFileURL(path.join(SSR, 'entry-server.js')).href);
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  let count = 0;
  for (const p of ssr.prerender(catalog)) {
    const props = `<script type="application/json" id="${ssr.PROPS_ID}">${ssr.jsonForScript(p.props)}</script>`;
    const html = ssr.injectHead(template, {
      lang: p.lang,
      headTags: `${p.headTags}\n    ${props}`,
      appHtml: p.appHtml,
    });
    const out = path.join(DIST, p.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
    count++;
  }
  process.stdout.write(
    `prerender: ${count} pages (${catalog.families.length} families${catalog.demo ? ', DEMO data' : ''})\n`,
  );
} finally {
  fs.rmSync(SSR, { recursive: true, force: true });
}
```

`apps/parts-shop/scripts/check-dist.mjs`:

```js
// Last build step: fails the build if a page could leak or be indexed.
// - every HTML page has meta robots noindex and the embedded page props;
// - no file in dist/ contains a forbidden string (third-party catalogue names or part
//   numbers, private D1 columns). M4 changes the noindex rule, never the forbidden list.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'dist');
const FORBIDDEN = [/\bvega\b/i, /\bVT\d{7}\b/, /private_ref/, /private_notes/, /cost_try/];

const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(html|js|css|json|txt|xml)$/.test(e.name)) files.push(p);
  }
};
walk(DIST);

const problems = [];
let pages = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const rel = path.relative(DIST, f);
  for (const re of FORBIDDEN) if (re.test(s)) problems.push(`${rel}: forbidden ${re}`);
  if (f.endsWith('.html')) {
    pages++;
    if (!s.includes('<meta name="robots" content="noindex, nofollow"'))
      problems.push(`${rel}: no noindex`);
    if (!s.includes('id="kv-page"')) problems.push(`${rel}: no page props`);
  }
}
if (problems.length) {
  process.stderr.write(
    `check-dist: ${problems.length} problem(s)\n${problems.slice(0, 20).join('\n')}\n`,
  );
  process.exit(1);
}
process.stdout.write(`check-dist: ${pages} pages ok\n`);
```

- [ ] **Step 4: Build with the DEMO catalog and test the guard**

Run:

```bash
rm -rf apps/parts-shop/.catalog
pnpm turbo build --filter=@kervan/parts-shop
ls apps/parts-shop/dist apps/parts-shop/dist/urun apps/parts-shop/dist/en/urun | head -30
echo 'VT1234567' > apps/parts-shop/dist/leak.txt && node apps/parts-shop/scripts/check-dist.mjs; echo "exit $?"; rm apps/parts-shop/dist/leak.txt
```

Expected:

- `build-catalog: DEMO: 6 families, 11 SKUs`.
- `prerender: 18 pages (6 families, DEMO data)`, i.e. (2 + 6) × 2 + 2 × 404.
- `check-dist: 18 pages ok`.
- The listing shows `index.html`, `kirici-ucu.html`, `404.html`, `urun/xx100-01.html` …, `en/urun/xx100-01.html`.
- The guard test prints `forbidden /\bVT\d{7}\b/` and `exit 1`.

- [ ] **Step 5: Hydration and visual check in a browser**

Serve `dist` and open it with Playwright at `executablePath: '/opt/pw-browsers/chromium'`, at 1440×900 and 390×844, for `/`, `/kirici-ucu`, `/urun/xx135-02` and `/en/urun/xx135-02`. Use `python3 -m http.server` on the `.html` paths, because python does not map extensionless URLs. Check for each page:

- no console errors and no React hydration warnings (`pageerror`/`console.error` empty);
- no horizontal overflow (`document.documentElement.scrollWidth <= innerWidth`);
- the DEMO and preview banners are visible;
- the language toggle points to the other language;
- the WhatsApp link holds the URL-encoded text with the code.

Take one screenshot of each page and look at it.

- [ ] **Step 6: Workspace checks**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`
Expected: all clean. Run `pnpm format` first if needed.

- [ ] **Step 7: Commit**

```bash
git add apps/parts-shop
git commit -m "feat(shop): D1 catalog snapshot, prerender with embedded props, dist leak guard"
```

---

### Task 11: CI deploy, smoke and docs

**Files:**

- Modify: `.github/workflows/deploy.yml`, `.github/scripts/smoke.sh`, `CLAUDE.md`

- [ ] **Step 1: `deploy.yml`**

1. `workflow_dispatch.inputs.app`: change to `options: [both, heat-treatment, breaker-parts, parts-shop, all]` (default `both`), and update the header comment. `both` keeps today's meaning (heat + breaker); `all` adds the shop.
2. `changes` job: add `parts-shop: ${{ steps.filter.outputs.parts-shop }}` to `outputs` and this filter:
   ```yaml
            parts-shop:
              - *shared
              - 'apps/parts-shop/**'
   ```
3. `verify` job: after `Format`, add:
   ```yaml
   - name: Unit tests
     run: pnpm test
   ```
4. Replace the `workflow_dispatch` clauses in the two existing deploy jobs:
   - heat: `(github.event_name == 'workflow_dispatch' && contains(fromJSON('["both","all","heat-treatment"]'), inputs.app))`
   - breaker: `(github.event_name == 'workflow_dispatch' && contains(fromJSON('["both","all","breaker-parts"]'), inputs.app))`
5. Add the job after `deploy-breaker-parts`:

   ```yaml
   deploy-parts-shop:
     name: magaza.kervanbreaker.com
     needs: [changes, verify]
     if: >-
       !cancelled() && needs.verify.result == 'success' && (
         github.event_name == 'push' ||
         (github.event_name == 'workflow_dispatch' && contains(fromJSON('["all","parts-shop"]'), inputs.app)) ||
         (github.event_name == 'pull_request' &&
           needs.changes.outputs.parts-shop == 'true' &&
           github.event.pull_request.head.repo.full_name == github.repository &&
           github.actor != 'dependabot[bot]')
       )
     runs-on: ubuntu-24.04
     timeout-minutes: 15
     permissions:
       contents: read
       deployments: write
     steps:
       - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

       - uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0

       - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
         with:
           node-version: '22'
           cache: 'pnpm'

       - name: Install dependencies
         run: pnpm install --frozen-lockfile

       # Public fields of published rows only (toPublicCatalog); prints counts only.
       # No data token yet (before Task 0) → DEMO catalog, unless SHOP_REQUIRE_CATALOG=1.
       - name: Catalog snapshot from D1
         env:
           SHOP_D1: ${{ secrets.CLOUDFLARE_SHOP_DATA_TOKEN != '' && 'kervan-shop' || '' }}
           CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_SHOP_DATA_TOKEN }}
           CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
           SHOP_REQUIRE_CATALOG: ${{ github.ref == 'refs/heads/main' && vars.SHOP_REQUIRE_CATALOG || '0' }}
         run: node --experimental-strip-types --no-warnings apps/parts-shop/scripts/build-catalog.ts

       - name: Build parts-shop
         run: pnpm turbo build --filter=@kervan/parts-shop

       - name: Ensure the Pages project exists
         uses: cloudflare/wrangler-action@953926a2e2182532811c01a25e53647d93bf07c0 # v4.1.3
         with:
           apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
           accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
           command: pages project create kervan-parts-shop --production-branch=main
         continue-on-error: true

       - name: Deploy to Cloudflare Pages
         uses: cloudflare/wrangler-action@953926a2e2182532811c01a25e53647d93bf07c0 # v4.1.3
         with:
           apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
           accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
           workingDirectory: apps/parts-shop
           command: >-
             pages deploy dist
             --project-name=kervan-parts-shop
             --branch=${{ github.head_ref || github.ref_name }}
             --commit-hash=${{ github.sha }}
   ```

   GitHub forbids `secrets.*` in `if:` but allows it in `env:` expressions. If the `!= ''` expression in `SHOP_D1` is rejected, set `SHOP_D1: kervan-shop` unconditionally: `build-catalog.ts` already falls back to DEMO when `CLOUDFLARE_API_TOKEN` is empty. "Ensure the Pages project exists" fails harmlessly on every run after the first (`continue-on-error`). Remove it once the project exists, if the noise bothers the owner.

6. `smoke` job: `needs: [deploy-heat-treatment, deploy-breaker-parts, deploy-parts-shop]`.

- [ ] **Step 2: `smoke.sh`**: append before `exit $fail`:

```bash
# Parts shop (M1 preview): up, and still closed to search engines.
check https://magaza.kervanbreaker.com/ 200 text/html
robots=$("${CURL[@]}" -o /dev/null -D - https://magaza.kervanbreaker.com/ | tr -d '\r' |
  awk -F': ' 'tolower($1) == "x-robots-tag" { print $2 }')
if [[ $robots == *noindex* ]]; then
  echo "ok    X-Robots-Tag '$robots'  https://magaza.kervanbreaker.com/"
else
  echo "FAIL  X-Robots-Tag '$robots'  https://magaza.kervanbreaker.com/  (want noindex)"
  fail=1
fi
```

`uptime.yml` runs the same script, so **merge only after Task 0 step 3**: the custom domain must answer before this check goes live.

- [ ] **Step 3: `CLAUDE.md`**
- Overview table: add the row `apps/parts-shop/` | magaza.kervanbreaker.com (+ shop. → 301) | `kervan-parts-shop`.
- Commands: add `pnpm test` and `pnpm --filter @kervan/parts-shop dev` (http://localhost:5175, DEMO data).
- Architecture: add `### parts-shop (magaza.kervanbreaker.com)` with these bullets:
  - **Static.** No router and no server code in M1. Every page is prerendered with its props embedded (`#kv-page`) and hydrated; links are plain `<a>`.
  - **Data.** It lives in D1 `kervan-shop`, never in git.
    - The manual workflow "Shop data import" fills it from KV `catalog:v1` and `popular:v1`.
    - At deploy, `scripts/build-catalog.ts` writes `.catalog/catalog.json` (gitignored) through `toPublicCatalog`, a whitelist.
    - Without the data token, the build uses the DEMO catalog (`XX` codes).
  - **Codes.** `KU{Ø}-{NN}` for families and `…-{C|M|B|P|K|A}` for SKUs. They are permanent: never renumber or reuse a code.
  - **No third-party catalogue names or part numbers.** Not on the site and not in shop code identifiers. `check-dist.mjs` fails the build on them.
  - **Search engines.** M1 is `noindex` on three layers: meta, `X-Robots-Tag` and `robots.txt` `Disallow: /`.
  - **CI.** Secret `CLOUDFLARE_SHOP_DATA_TOKEN` (D1 Edit + KV Read), variable `SHOP_SOURCE_KV_ID`. `SHOP_REQUIRE_CATALOG=1` makes main deploys fail instead of shipping DEMO data.
- `### Packages`: add `@kervan/tips` (pure, unit-tested: types, codes, catalog mapping, import SQL, public projection, carrier tonnage; `pnpm test` runs it in `verify`).
- Deploying: dispatch options are now `both` / `all` / per app.

- [ ] **Step 4: Full verification**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm turbo build`
Expected: everything green, and all three apps build.

- [ ] **Step 5: Commit, push, PR**

```bash
git add .github CLAUDE.md
git commit -m "ci(shop): deploy parts-shop, unit tests in verify, smoke check; docs"
git push -u origin <designated branch>
```

Open a **draft** PR. The body:

- lists Task 0 as a merge blocker;
- notes that previews show DEMO data until the data token exists.

---

### Task 12: First real data (after merge and Task 0)

- [ ] **Step 1:** Actions → "Shop data import" → Run workflow (main).
  - Expected log: `shop-import: N families (N new), M SKUs, K skipped (…)` with counts only.
  - It is followed by an automatic `Deploy` run for `parts-shop`.
- [ ] **Step 2:** Open `https://magaza.kervanbreaker.com/`.
  - Best-sellers come first and there is no DEMO banner.
  - `/kirici-ucu` lists all families.
  - Spot-check three family pages against the owner's catalog tab on kervanbreaker.com/teknik-bilgiler (same Ø, slot and lengths).
- [ ] **Step 3:** Set the repo variable `SHOP_REQUIRE_CATALOG=1`. From now on a main deploy that cannot read D1 fails instead of shipping DEMO data.
- [ ] **Step 4:** Check `https://shop.kervanbreaker.com/kirici-ucu` returns 301 to `https://magaza.kervanbreaker.com/kirici-ucu`.

---

## Self-review notes

- **Spec coverage (M1 rows of §13).**
  - Covered: app skeleton, `@kervan/tips`, D1 schema, catalog build fetch, prerender, home, list and product pages, noindex.
  - Moved to M1b: finder, breaker pages and legal drafts.
  - Moved to M1c: posters.
  - Moved to M1d: admin and live preview.
  - All are listed under "Out of scope".
- **Changes from the spec.**
  - No public `/api/shop/catalog`: CI reads D1 directly, so there is less attack surface and no build token.
  - One product page per family (anchors per type) instead of per family × type. This matches K6's page count.
  - SKUs carry length and weight ranges. The source data has ranges per type, not one length per SKU.
- **Risks to watch while executing.**
  - Exact wrangler flag names (`--remote`, `--yes`, `--namespace-id`) and d1-by-name resolution: check `--help`.
  - Node's strip-types glob for tests.
  - `secrets.*` inside the `env` expression.
  - Token utility names in `tokens.css`.
