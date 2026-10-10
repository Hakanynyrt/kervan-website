import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalisePartRows, partTypeOf } from './part-prices.ts';
import { toPricesSql } from './sql.ts';
import { publicPartPrices } from './public.ts';

test('part types fold the owner names', () => {
  assert.equal(partTypeOf('ÖN BURÇ'), 'KAFA_BURCU');
  assert.equal(partTypeOf('kafa burcu'), 'KAFA_BURCU');
  assert.equal(partTypeOf('MERKEZLEME DAYAMA'), 'MERKEZLEME_DAYAMA');
  assert.equal(partTypeOf('DAYAMA MERKEZLEME'), 'MERKEZLEME_DAYAMA');
  assert.equal(partTypeOf('DAYAMA'), 'DAYAMA');
  assert.equal(partTypeOf('BOYSAPLAMASI'), 'BOY_SAPLAMA');
  assert.equal(partTypeOf('KAFA_BURCU'), 'KAFA_BURCU');
  assert.equal(partTypeOf('işçilik'), null);
});

test('rows are validated; errors name the row, never its content', () => {
  const ok = normalisePartRows([
    { brand: 'MTB', model: '215', type: 'ön burç', cents: 16000 },
    { brand: 'Krupp', model: 'HM 900', type: 'DAYAMA', variant: 'oldType', cents: null },
    { item: 'burc/rammer-e68-dayama', cents: 12000 },
  ]);
  assert.deepEqual(ok[0], {
    brand: 'MTB',
    model: '215',
    type: 'KAFA_BURCU',
    variant: null,
    item: null,
    cents: 16000,
  });
  assert.equal(ok[1].variant, 'oldType');
  assert.equal(ok[2].item, 'burc/rammer-e68-dayama');
  for (const [rows, re] of [
    [[{ brand: 'MTB', model: '215', type: 'kafa burcu', cents: 1.5 }], /row 1: price/],
    [[{ brand: 'MTB', model: '215', type: 'çay', cents: 100 }], /row 1: part type/],
    [[{ brand: '', model: '215', type: 'kama', cents: 100 }], /row 1: breaker/],
    [[{ item: '../x', cents: 100 }], /row 1: item/],
    [[{ brand: 'MTB', model: '215', type: 'kama', variant: 'a b', cents: 100 }], /row 1: variant/],
    [
      [
        { brand: 'MTB', model: '215', type: 'ön burç', cents: 100 },
        { brand: 'mtb', model: '215', type: 'KAFA BURCU', cents: 200 },
      ],
      /row 2: duplicate/,
    ],
  ] as const) {
    assert.throws(
      () => normalisePartRows(rows),
      (e: Error) => re.test(e.message) && !e.message.includes('215'),
    );
  }
});

test('a parts sheet writes a new batch and switches the pointer last', () => {
  const sql = toPricesSql(
    { schema: 1, prices: {}, parts: [{ brand: "O'Brien", model: '1', type: 'kama', cents: 500 }] },
    '2026-10-10T00:00:00Z',
    (b, m) => `${b}/${m}`,
  );
  const lines = sql.trim().split('\n');
  assert.equal(lines.filter((l) => l.startsWith('UPDATE skus')).length, 0);
  assert.match(lines[0], /^INSERT INTO part_prices .*'O''Brien'.*'KAMA'.*500/);
  assert.match(lines.at(-2)!, /VALUES \('part_prices_batch', '2026-10-10T00:00:00Z'\)/);
  assert.match(lines.at(-1)!, /^DELETE FROM part_prices WHERE batch NOT IN/);
  // No parts key: part prices untouched; a bad row throws before any SQL.
  assert.doesNotMatch(
    toPricesSql({ schema: 1, prices: {} }, 'n', (b) => b),
    /part_prices/,
  );
  assert.throws(() =>
    toPricesSql({ schema: 1, prices: {}, parts: [{ item: 'x', cents: 1 }] }, 'n', (b) => b),
  );
  assert.match(
    toPricesSql({ schema: 1, prices: {}, rollbackParts: true }, 'n', (b) => b),
    /'part_prices_batch', value FROM settings WHERE key = 'part_prices_batch_prev'/,
  );
});

test('the public projection keeps valid rows only', () => {
  const out = publicPartPrices([
    {
      brand: 'MTB',
      model: '215',
      part_type: 'KAFA_BURCU',
      variant: null,
      item: null,
      price_usd_net_cents: 16000,
    },
    {
      brand: 'Vega',
      model: 'VB 35',
      part_type: 'KAMA',
      variant: null,
      item: null,
      price_usd_net_cents: 100,
    },
    {
      brand: 'MTB',
      model: '215',
      part_type: 'NOPE',
      variant: null,
      item: null,
      price_usd_net_cents: 100,
    },
    {
      brand: 'MTB',
      model: '215',
      part_type: 'KAMA',
      variant: 'a b',
      item: null,
      price_usd_net_cents: 100,
    },
    {
      brand: null,
      model: null,
      part_type: null,
      variant: null,
      item: 'burc/x-y',
      price_usd_net_cents: null,
    },
    {
      brand: null,
      model: null,
      part_type: null,
      variant: null,
      item: '/etc',
      price_usd_net_cents: 5,
    },
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].type, 'KAFA_BURCU');
  assert.equal(out[1].item, 'burc/x-y');
  assert.equal(out[1].cents, null);
});
