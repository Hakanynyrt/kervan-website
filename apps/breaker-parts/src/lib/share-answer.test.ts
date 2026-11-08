import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAnswer, whatsappLink } from './share-answer.ts';

const TX = {
  line: '{name} için uç: {code} · Ø{d} mm{keys}',
  keys: ' · {n} kama',
  types: 'Tipler: {types}',
  order: 'Sipariş: {url}',
};
const label = (t: string) => ({ chisel: 'Keski', moil: 'Sivri' })[t] ?? t;

test('buildAnswer writes the public fields only', () => {
  // Invented breaker and code. Extra fields on the input (as the real family carries) are ignored.
  const fam = {
    code: 'KU99-01',
    d: 99,
    keyCount: 2 as const,
    types: ['chisel', 'moil'] as ('chisel' | 'moil')[],
    vega: 'VT-SECRET',
    drawing: 'DRW-1',
  };
  const s = buildAnswer(
    { name: 'Test X 1' },
    fam,
    label,
    'https://example.com/kirici/test/x-1',
    TX,
  );
  assert.equal(
    s,
    'Test X 1 için uç: KU99-01 · Ø99 mm · 2 kama\nTipler: Keski, Sivri\nSipariş: https://example.com/kirici/test/x-1',
  );
  assert.ok(!s.includes('VT') && !s.includes('DRW'));
});

test('buildAnswer leaves out unknown key count and empty types', () => {
  const s = buildAnswer(
    { name: 'A 1' },
    { code: 'KU50-02', d: 50.25, keyCount: null, types: [] },
    label,
    'u',
    TX,
  );
  assert.equal(s, 'A 1 için uç: KU50-02 · Ø50.3 mm\nSipariş: u');
});

test('whatsappLink encodes the text', () => {
  assert.equal(whatsappLink('a b\nc'), 'https://wa.me/?text=a%20b%0Ac');
});
