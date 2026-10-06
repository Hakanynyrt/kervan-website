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
