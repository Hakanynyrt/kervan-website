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
