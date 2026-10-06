import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sqlValue, toImportSql } from './sql.ts';
import type { ImportFamily } from './from-catalog.ts';

const fam: ImportFamily = {
  ref: "r'1",
  code: 'KU135-01',
  attrs: {
    diameterMm: 135,
    collarDiameterMm: null,
    key: { count: 1, thicknessMm: null, slotLengthMm: null, backEndToSlotMm: null, slotEnd: null },
    rear: { step: null, diameterMm: null },
  },
  popularTier: 2,
  fits: [{ brand: "O'Brien", model: 'X 1', slug: 'o-brien/x-1' }],
  skus: [
    {
      code: 'KU135-01-C',
      tipType: 'chisel',
      lengthMm: { min: 1200, max: 1300 },
      weightKg: null,
      tipAngleDeg: null,
    },
  ],
};

test('sqlValue quotes strings, prints finite numbers and NULLs the rest', () => {
  assert.equal(sqlValue("it's"), "'it''s'");
  assert.equal(sqlValue(12.5), '12.5');
  assert.equal(sqlValue(Number.NaN), 'NULL');
  assert.equal(sqlValue(null), 'NULL');
});

test('toImportSql upserts without touching codes or owner flags', () => {
  const sql = toImportSql([fam], '2026-10-06T00:00:00.000Z');
  assert.match(
    sql,
    /INSERT INTO families \(code, private_ref, attrs, popular_tier, updated_at\) VALUES \('KU135-01', 'r''1', '\{.*\}', 2, '2026-10-06T00:00:00.000Z'\) ON CONFLICT\(private_ref\) DO UPDATE SET attrs = excluded\.attrs, popular_tier = excluded\.popular_tier, updated_at = excluded\.updated_at;/,
  );
  assert.match(
    sql,
    /ON CONFLICT\(family_id, tip_type\) DO UPDATE SET length_min_mm = excluded\.length_min_mm/,
  );
  assert.doesNotMatch(sql, /SET[^;]*\bcode =/);
  assert.doesNotMatch(sql, /SET[^;]*\bpublished =/);
  assert.match(
    sql,
    /INSERT OR IGNORE INTO breakers \(brand, model, slug\) VALUES \('O''Brien', 'X 1', 'o-brien\/x-1'\);/,
  );
  assert.match(
    sql,
    /INSERT OR IGNORE INTO fitments \(family_id, breaker_id\) VALUES \(\(SELECT id FROM families WHERE private_ref = 'r''1'\), \(SELECT id FROM breakers WHERE slug = 'o-brien\/x-1'\)\);/,
  );
  assert.doesNotMatch(sql, /BEGIN|COMMIT/);
});
