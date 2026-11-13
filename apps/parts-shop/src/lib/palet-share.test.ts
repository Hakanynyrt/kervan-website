import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_QTY, type CartItem } from './cart.ts';
import {
  decodePalet,
  encodePalet,
  linePagePath,
  listedLineId,
  MAX_SHARED_LINES,
  mergeShared,
  paletLink,
  paletParam,
  partLineId,
  tipLineId,
  withoutPalet,
  type PaletLines,
} from './palet-share.ts';

const TIP = tipLineId('/kirici/ornek/m-1', null, 'chisel');
const TIP2 = tipLineId('/kirici/ornek/m-2', 2, 'moil');
const ITEM = partLineId('/yedek-parca/on-kafa/ornek-m-1-on-kafa', true);
const LISTED = listedLineId('burc', 'ornek-m-3', 'KAFA_BURCU');

test('line ids keep the shapes the pages have always stored', () => {
  assert.equal(TIP, '/kirici/ornek/m-1|chisel');
  assert.equal(TIP2, '/kirici/ornek/m-2|2|moil');
  assert.equal(ITEM, '/yedek-parca/on-kafa/ornek-m-1-on-kafa#b');
  assert.equal(partLineId('/yedek-parca/piston/x', false), '/yedek-parca/piston/x');
  assert.equal(LISTED, 'listed:burc/ornek-m-3/KAFA_BURCU');
});

test('encode → decode round-trips ids and quantities, in order', () => {
  const lines = [
    { id: TIP, qty: 3 },
    { id: TIP2, qty: 1 },
    { id: ITEM, qty: 12 },
    { id: LISTED, qty: MAX_QTY },
  ];
  const raw = encodePalet(lines);
  assert.ok(!raw.includes('|') && !raw.includes('#'), 'separators and # are encoded');
  assert.deepEqual(decodePalet(raw), { lines, bad: 0 });
  // Through a real query string, read raw (no URLSearchParams decoding).
  const url = new URL(paletLink('https://example.test', '/palet', lines));
  assert.equal(url.pathname, '/palet');
  assert.deepEqual(decodePalet(paletParam(url.search)).lines, lines);
});

test('an id holding the separators survives the round trip', () => {
  const odd = [{ id: '/x/a*b,c', qty: 2 }];
  assert.deepEqual(decodePalet(encodePalet(odd)).lines, odd);
});

test('only ids and quantities: never a name or a price', () => {
  const item: CartItem = {
    id: TIP,
    name: 'Ornek M-1',
    tipType: 'chisel',
    code: 'KU100-01',
    path: '/kirici/ornek/m-1',
    cents: 12345,
    qty: 2,
  };
  const raw = encodePalet([item]);
  assert.ok(!raw.includes('Ornek') && !raw.includes('12345') && !raw.includes('KU100'));
});

test('malformed entries are skipped and counted', () => {
  const ok = encodePalet([{ id: TIP, qty: 2 }]);
  for (const bad of [
    'nonsense',
    '*3',
    `${encodeURIComponent(TIP)}*`,
    `${encodeURIComponent(TIP)}*x`,
    `${encodeURIComponent(TIP)}*1.5`,
    `${encodeURIComponent(TIP)}*-2`,
    '%E0%A4%A*2',
    'https:%2F%2Fevil.test*1',
    `javascript:alert(1)*1`,
    `${'/a'.repeat(150)}*1`,
  ]) {
    const r = decodePalet(`${bad},${ok}`);
    assert.deepEqual(r.lines, [{ id: TIP, qty: 2 }], bad);
    assert.equal(r.bad, 1, bad);
  }
  assert.deepEqual(decodePalet(null), { lines: [], bad: 0 });
  assert.deepEqual(decodePalet(''), { lines: [], bad: 0 });
  assert.deepEqual(decodePalet(',,'), { lines: [], bad: 0 });
});

test('quantity bounds: 0 is dropped, above MAX_QTY is cut, repeats add up to MAX_QTY', () => {
  const id = encodeURIComponent(TIP);
  assert.deepEqual(decodePalet(`${id}*0`), { lines: [], bad: 1 });
  assert.deepEqual(decodePalet(`${id}*5000`).lines, [{ id: TIP, qty: MAX_QTY }]);
  assert.deepEqual(decodePalet(`${id}*9999999`).bad, 1);
  assert.deepEqual(decodePalet(`${id}*2,${id}*3`).lines, [{ id: TIP, qty: 5 }]);
  assert.deepEqual(decodePalet(`${id}*${MAX_QTY},${id}*3`).lines, [{ id: TIP, qty: MAX_QTY }]);
  assert.equal(encodePalet([{ id: TIP, qty: 0 }]), '');
  assert.equal(encodePalet([{ id: TIP, qty: 5000 }]), `/kirici/ornek/m-1%7Cchisel*${MAX_QTY}`);
});

test('at most MAX_SHARED_LINES lines are read', () => {
  const many = Array.from({ length: MAX_SHARED_LINES + 5 }, (_, i) => ({
    id: `/kirici/x/m-${i}|chisel`,
    qty: 1,
  }));
  const r = decodePalet(encodePalet(many));
  assert.equal(r.lines.length, MAX_SHARED_LINES);
  assert.equal(r.bad, 5);
});

test('merge: names and prices from the catalogue, unknown ids dropped, quantities added', () => {
  const catalogue: PaletLines = {
    [TIP]: {
      name: 'Ornek M-1',
      tipType: 'chisel',
      code: 'K1',
      path: '/kirici/ornek/m-1',
      cents: 200,
    },
    [LISTED]: {
      name: 'Ornek M-3',
      label: 'kafa burcu',
      code: null,
      path: '/yedek-parca/burc',
      cents: null,
    },
  };
  const stored: CartItem[] = [
    {
      id: TIP,
      name: 'eski ad',
      tipType: 'chisel',
      code: 'K1',
      path: '/kirici/ornek/m-1',
      cents: 100,
      qty: MAX_QTY - 1,
    },
  ];
  const { items, added, dropped } = mergeShared(
    stored,
    [
      { id: TIP, qty: 4 },
      { id: '/kirici/yok|chisel', qty: 1 },
      { id: LISTED, qty: 2 },
      { id: '__proto__', qty: 1 },
    ],
    catalogue,
  );
  assert.equal(dropped, 2);
  assert.deepEqual(
    added.map((x) => [x.id, x.qty]),
    [
      [TIP, 4],
      [LISTED, 2],
    ],
  );
  assert.equal(items.length, 2);
  assert.equal(items[0].name, 'Ornek M-1');
  assert.equal(items[0].cents, 200);
  assert.equal(items[0].qty, MAX_QTY);
  assert.equal(items[1].cents, null);
  assert.equal(stored[0].qty, MAX_QTY - 1, 'the stored palet is not changed in place');
});

test('withoutPalet drops only the palet parameter', () => {
  assert.equal(withoutPalet('?p=a*1'), '');
  assert.equal(withoutPalet('?p=a*1&utm_source=x'), '?utm_source=x');
  assert.equal(withoutPalet('?gclid=1&p=a*1'), '?gclid=1');
  assert.equal(withoutPalet(''), '');
  assert.equal(paletParam('?gclid=1&p=a%2A*1'), 'a%2A*1');
  assert.equal(paletParam('?q=1'), null);
});

test('each line id names the same-site page that sells it, nothing else', () => {
  assert.equal(linePagePath(TIP, '/yedek-parca'), '/kirici/ornek/m-1');
  assert.equal(linePagePath(TIP2, '/yedek-parca'), '/kirici/ornek/m-2');
  assert.equal(linePagePath(ITEM, '/yedek-parca'), '/yedek-parca/on-kafa/ornek-m-1-on-kafa');
  assert.equal(linePagePath(LISTED, '/yedek-parca'), '/yedek-parca/burc');
  assert.equal(linePagePath('//evil.example/x|chisel', '/yedek-parca'), null);
  assert.equal(linePagePath('/kirici/../palet|chisel', '/yedek-parca'), null);
  assert.equal(linePagePath('/|chisel', '/yedek-parca'), null);
  assert.equal(linePagePath('listed:../x/y', '/yedek-parca'), null);
});
