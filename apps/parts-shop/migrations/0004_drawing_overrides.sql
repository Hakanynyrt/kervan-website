-- Kervan's own approved drawings override the catalogue-derived tip data (family attrs, SKU
-- length / weight / tip angle). Written only by the "Shop prices" workflow (`drawings` in the
-- sheet), applied by build-catalog; the catalogue import never touches this table, so a
-- re-import cannot undo a drawing. Schema only: the values live in D1, never in git. Idempotent.
CREATE TABLE IF NOT EXISTS drawing_overrides (
  family_code TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  source TEXT,
  updated_at TEXT NOT NULL
);
