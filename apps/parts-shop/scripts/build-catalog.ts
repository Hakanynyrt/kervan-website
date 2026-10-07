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
  publicExtras,
  toPublicCatalog,
  type ExtraRow,
  type FamilyRow,
  type FxRate,
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
const EXTRAS_SQL =
  'SELECT brand, model, slug, tip_types, diameter_mm, price_usd_net_cents FROM extra_products WHERE published = 1 ORDER BY brand, model';
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

/** CBRT (TCMB) USD selling rate of the last business day; null when it cannot be read. */
async function fetchFx(): Promise<FxRate | null> {
  try {
    const res = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const usd = /<Currency[^>]*CurrencyCode="USD"[^>]*>([\s\S]*?)<\/Currency>/.exec(xml)?.[1] ?? '';
    const rate = Number(/<ForexSelling>([\d.]+)<\/ForexSelling>/.exec(usd)?.[1]);
    const d = /Date="(\d{2})\/(\d{2})\/(\d{4})"/.exec(xml);
    if (!(rate > 1 && rate < 1000) || !d) return null;
    return { usdTry: rate, date: `${d[3]}-${d[1]}-${d[2]}` };
  } catch {
    return null;
  }
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
    // The extras table comes with migration 0002; before it exists there are none.
    try {
      c.extras = publicExtras(query<ExtraRow>(db, EXTRAS_SQL));
    } catch {
      c.extras = [];
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

// The TRY prices follow the rate of the build day (the shop rebuilds every morning).
if (fs.existsSync(OUT)) {
  const c = JSON.parse(fs.readFileSync(OUT, 'utf8')) as PublicCatalog;
  c.fx = await fetchFx();
  fs.writeFileSync(OUT, JSON.stringify(c));
  log(c.fx ? `USD/TRY rate of ${c.fx.date}` : 'USD/TRY rate unavailable (USD prices only)');
}
