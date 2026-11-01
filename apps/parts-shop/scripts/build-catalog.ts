// Writes apps/parts-shop/.catalog/catalog.json (gitignored) for the prerender.
// - With SHOP_D1=<database name> + CLOUDFLARE_API_TOKEN (+ CLOUDFLARE_ACCOUNT_ID): reads the
//   published rows from D1 and keeps only public fields (toPublicCatalog).
// - Otherwise keeps an existing snapshot, or writes the DEMO catalog.
// - SHOP_REQUIRE_CATALOG=1 turns any D1 failure into a build failure (production).
// - SHOP_REQUIRE_FX=1 (main) fails the build when no CBRT rate can be read, so production keeps
//   the previous deploy; elsewhere the pages fall back to USD only (never an invented rate).
// Prints counts only: this public repo's CI logs must never show catalog data.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  applyDrawings,
  demoCatalog,
  publicExtras,
  publicPartPrices,
  toPublicCatalog,
  type DrawingRow,
  type ExtraRow,
  type PartPrice,
  type PartPriceRow,
  type FamilyRow,
  type FxRate,
  type FitRow,
  type PublicCatalog,
  type SkuRow,
} from '../../../packages/tips/src/index.ts';
import {
  DRAWINGS_SQL,
  FAMILIES_SQL,
  FITS_SQL,
  SKUS_SQL,
} from '../../../packages/tips/src/catalog-sql.ts';
import { fxCandidateDates, parseTcmbUsd, tcmbArchiveUrl } from './fx.ts';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, '.catalog', 'catalog.json');
const log = (s: string) => process.stdout.write(`build-catalog: ${s}\n`);

/** Invented part prices for SHOP_DEMO_PART_PRICES=1 (local look at the UI; not real prices). */
const DEMO_PART_PRICES: PartPrice[] = [
  ['Rammer', 'E68', 'KAFA_BURCU', 9900],
  ['Rammer', 'E68', 'MERKEZLEME', 4500],
  ['Rammer', 'E68', 'DAYAMA', 11100],
  ['Rammer', 'E68', 'BURC_TAKIMI', 24000],
  ['Rammer', 'E68', 'ALT_GOVDE', 199900],
  ['MTB', '65', 'KAFA_BURCU', 6100],
].map(([brand, model, type, cents]) => ({
  brand: brand as string,
  model: model as string,
  type: type as PartPrice['type'],
  variant: null,
  item: null,
  cents: cents as number,
}));

const PART_PRICES_SQL =
  "SELECT brand, model, part_type, variant, item, price_usd_net_cents FROM part_prices WHERE batch = (SELECT value FROM settings WHERE key = 'part_prices_batch')";
const EXTRAS_SQL =
  'SELECT brand, model, slug, tip_types, diameter_mm, price_usd_net_cents FROM extra_products WHERE published = 1 ORDER BY brand, model';

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

/** One archive file: the rate, 'missing' (404: no bulletin that day) or null (could not read). */
async function fetchBulletin(date: string): Promise<FxRate | 'missing' | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(tcmbArchiveUrl(date), { signal: AbortSignal.timeout(10_000) });
      if (res.status === 404) return 'missing';
      if (res.ok) return parseTcmbUsd(await res.text(), date);
    } catch {
      // network error or timeout: try again
    }
  }
  return null;
}

/**
 * The week's CBRT USD selling rate (owner, G2): the bulletin of the ISO week's Monday, stepping
 * back a day while a file is missing; null when none can be read (a read error never steps back
 * to another week's rate).
 */
async function fetchFx(): Promise<FxRate | null> {
  for (const date of fxCandidateDates(new Date())) {
    const r = await fetchBulletin(date);
    if (r === 'missing') continue;
    return r;
  }
  return null;
}

function write(c: PublicCatalog, what: string) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(c));
  log(
    `${what}: ${c.families.length} families, ${c.families.reduce((n, f) => n + f.skus.length, 0)} SKUs, ${c.partPrices?.length ?? 0} part price rows`,
  );
}

const db = process.env.SHOP_D1;
const required = process.env.SHOP_REQUIRE_CATALOG === '1';

if (db && process.env.CLOUDFLARE_API_TOKEN) {
  try {
    // The drawings table comes with migration 0004; before it exists there are none.
    let drawings: DrawingRow[] = [];
    try {
      drawings = query<DrawingRow>(db, DRAWINGS_SQL);
    } catch {
      drawings = [];
    }
    const own = applyDrawings(
      query<FamilyRow>(db, FAMILIES_SQL),
      query<SkuRow>(db, SKUS_SQL),
      drawings,
    );
    log(`${own.applied} families from Kervan's own drawings`);
    const c = toPublicCatalog(own.families, own.skus, query<FitRow>(db, FITS_SQL));
    // The extras table comes with migration 0002; before it exists there are none.
    try {
      c.extras = publicExtras(query<ExtraRow>(db, EXTRAS_SQL));
    } catch {
      c.extras = [];
    }
    // Part prices come with migration 0003 and the first parts sheet; until then none.
    try {
      c.partPrices = publicPartPrices(query<PartPriceRow>(db, PART_PRICES_SQL));
    } catch {
      c.partPrices = [];
    }
    // An empty D1 (before the first import) must not ship an empty shop: DEMO, or fail on main.
    if (c.families.length === 0) throw new Error('empty catalog');
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

// Local look at the price UI: a few invented part prices. Never in CI (GitHub sets CI).
if (
  process.env.SHOP_DEMO_PART_PRICES === '1' &&
  !required &&
  !process.env.CI &&
  fs.existsSync(OUT)
) {
  const c = JSON.parse(fs.readFileSync(OUT, 'utf8')) as PublicCatalog;
  c.partPrices = DEMO_PART_PRICES;
  fs.writeFileSync(OUT, JSON.stringify(c));
  log(`DEMO part prices: ${DEMO_PART_PRICES.length} rows (local only)`);
}

// The TRY prices follow the week's CBRT rate (scripts/fx.ts). Turkish pages lead with the
// tax-inclusive TL price, so production never ships without a rate.
if (fs.existsSync(OUT)) {
  const c = JSON.parse(fs.readFileSync(OUT, 'utf8')) as PublicCatalog;
  // The deploy runs this twice (snapshot step, then the app build): a snapshot that already
  // holds this week's Monday rate keeps it, so both runs agree.
  if (c.fx?.date !== fxCandidateDates(new Date())[0]) c.fx = await fetchFx();
  if (!c.fx && process.env.SHOP_REQUIRE_FX === '1') {
    log('FAILED (no CBRT USD/TRY rate could be read)');
    process.exit(1);
  }
  fs.writeFileSync(OUT, JSON.stringify(c));
  log(c.fx ? `USD/TRY rate of ${c.fx.date}` : 'USD/TRY rate unavailable (USD prices only)');
}
