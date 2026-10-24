// D1 queries of the shop catalogue (database `kervan-shop`), shared by the shop's build
// (apps/parts-shop/scripts/build-catalog.ts) and kervanbreaker.com's owner-only
// /api/tech/fits, so both read the same published rows. Not re-exported from index.ts:
// only these two server-side callers import it, never a browser bundle.

export const FAMILIES_SQL =
  'SELECT id, code, attrs, popular_tier FROM families WHERE published = 1';

const SKU_COLUMNS =
  's.family_id, s.code, s.tip_type, s.length_min_mm, s.length_max_mm, s.weight_min_kg, s.weight_max_kg, s.tip_angle_deg';
const SKU_FROM =
  'FROM skus s JOIN families f ON f.id = s.family_id WHERE s.published = 1 AND f.published = 1';

export const SKUS_SQL = `SELECT ${SKU_COLUMNS}, s.price_usd_net_cents, s.stock_qty, s.lead_time_days ${SKU_FROM}`;

/** The same rows without prices or stock, for a caller that must never read them. */
export const SKUS_NO_PRICES_SQL = `SELECT ${SKU_COLUMNS}, NULL AS price_usd_net_cents, 0 AS stock_qty, NULL AS lead_time_days ${SKU_FROM}`;

/** Kervan's own drawings over the catalogue data (migration 0004; see drawings.ts). */
export const DRAWINGS_SQL = 'SELECT family_code, data FROM drawing_overrides';

export const FITS_SQL =
  'SELECT ft.family_id, b.brand, b.model, b.slug FROM fitments ft JOIN breakers b ON b.id = ft.breaker_id JOIN families f ON f.id = ft.family_id WHERE f.published = 1 ORDER BY b.brand, b.model';
