-- Products sold by breaker model whose tip geometry is not in the catalogue yet
-- (written by the "Shop prices" workflow). Idempotent.
CREATE TABLE IF NOT EXISTS extra_products (
  id INTEGER PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tip_types TEXT NOT NULL,
  price_usd_net_cents INTEGER,
  published INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
