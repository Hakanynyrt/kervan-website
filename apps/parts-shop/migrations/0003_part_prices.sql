-- Spare-part prices: the owner's rows (breaker × part type, or one exact item page), written
-- only by the "Shop prices" workflow. Each run writes a complete batch and switches
-- settings('part_prices_batch') last, so a half-written run is never read; the previous batch
-- stays for a rollback. Idempotent.
CREATE TABLE IF NOT EXISTS part_prices (
  id INTEGER PRIMARY KEY,
  batch TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  part_type TEXT,
  variant TEXT,
  item TEXT,
  price_usd_net_cents INTEGER,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS part_prices_batch ON part_prices(batch);
