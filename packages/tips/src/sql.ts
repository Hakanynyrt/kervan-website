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

/** Owner's price sheet for the "Shop prices" workflow (never in the repo). */
export interface PriceSheet {
  schema: 1;
  /** SKU code → net USD cents. */
  prices: Record<string, number>;
  /** Products sold by breaker model without catalogue geometry. */
  extras?: { brand: string; model: string; types: string[]; cents: number | null }[];
  /** Extra breaker names for existing tip families (e.g. a newer model name). */
  aliases?: { brand: string; model: string; families: string[] }[];
}

const CODE = /^KU\d+(?:\.\d+)?-\d{2}-[CMBPKA]$/;
const FAMILY = /^KU\d+(?:\.\d+)?-\d{2}$/;
const cents = (v: unknown): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v > 0 && v < 100_000_000 ? v : null;

/**
 * SQL for a price sheet: sets SKU prices (by code; unknown codes match no row), upserts the
 * extra products and adds alias breakers to existing families. Throws on a malformed sheet so
 * a bad paste never half-applies.
 */
export function toPricesSql(
  sheet: PriceSheet,
  now: string,
  slugOf: (b: string, m: string) => string,
): string {
  const q = sqlValue;
  if (!sheet || sheet.schema !== 1 || typeof sheet.prices !== 'object')
    throw new Error('bad sheet');
  const out: string[] = [];
  for (const [code, v] of Object.entries(sheet.prices)) {
    const c = cents(v);
    if (!CODE.test(code) || c === null) throw new Error(`bad price row ${code}`);
    out.push(
      `UPDATE skus SET price_usd_net_cents = ${c}, updated_at = ${q(now)} WHERE code = ${q(code)};`,
    );
  }
  for (const e of sheet.extras ?? []) {
    const c = e.cents === null ? null : cents(e.cents);
    if (!e.brand || !e.model || !Array.isArray(e.types) || (e.cents !== null && c === null))
      throw new Error('bad extra row');
    out.push(
      `INSERT INTO extra_products (brand, model, slug, tip_types, price_usd_net_cents, updated_at) VALUES (${q(e.brand)}, ${q(e.model)}, ${q(slugOf(e.brand, e.model))}, ${q(JSON.stringify(e.types))}, ${q(c)}, ${q(now)}) ON CONFLICT(slug) DO UPDATE SET brand = excluded.brand, model = excluded.model, tip_types = excluded.tip_types, price_usd_net_cents = excluded.price_usd_net_cents, updated_at = excluded.updated_at;`,
    );
  }
  for (const a of sheet.aliases ?? []) {
    if (!a.brand || !a.model || !a.families?.every((f) => FAMILY.test(f)))
      throw new Error('bad alias row');
    const slug = slugOf(a.brand, a.model);
    out.push(
      `INSERT OR IGNORE INTO breakers (brand, model, slug) VALUES (${q(a.brand)}, ${q(a.model)}, ${q(slug)});`,
    );
    for (const f of a.families)
      out.push(
        `INSERT OR IGNORE INTO fitments (family_id, breaker_id) SELECT f.id, b.id FROM families f, breakers b WHERE f.code = ${q(f)} AND b.slug = ${q(slug)};`,
      );
  }
  return `${out.join('\n')}\n`;
}
