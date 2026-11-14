import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_QTY, type CartItem } from './cart.ts';
import {
  decodePalet,
  encodePalet,
  lineHref,
  linePagePath,
  listedLineId,
  MAX_SHARED_LINES,
  mergeShared,
  opensUnfitted,
  paletLink,
  paletParam,
  partLineId,
  refreshLines,
  tipLineId,
  UNFITTED_PARAM,
  withoutPalet,
  type PaletLines,
} from './palet-share.ts';

const TIP = tipLineId('/kirici/ornek/m-1', null, 'chisel');
const TIP2 = tipLineId('/kirici/ornek/m-2', 2, 'moil');
/** A front head's item page: the one group with the Burçsuz / Burçlu choice. */
const HEAD = '/yedek-parca/alt-govde/ornek-m-1';
const ITEM = partLineId(HEAD, true);
const LISTED = listedLineId('burc', 'ornek-m-3', 'KAFA_BURCU');

test('line ids keep the shapes the pages have always stored', () => {
  assert.equal(TIP, '/kirici/ornek/m-1|chisel');
  assert.equal(TIP2, '/kirici/ornek/m-2|2|moil');
  assert.equal(ITEM, '/yedek-parca/alt-govde/ornek-m-1#b');
  assert.equal(partLineId(HEAD, false), HEAD);
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

test('refresh: stored lines take the name and price of their page, quantities and order stay', () => {
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
    // Not in the catalogue (its page was not read): as stored.
    {
      id: ITEM,
      name: 'Ornek M-1',
      label: 'ön kafa',
      code: null,
      path: HEAD,
      cents: 300,
      qty: 2,
    },
    // Added at another price.
    {
      id: TIP,
      name: 'Ornek M-1',
      tipType: 'chisel',
      code: 'K1',
      path: '/kirici/ornek/m-1',
      cents: 100,
      qty: 5,
    },
    // Priced when it was added, "fiyat sorulacak" on its page now.
    {
      id: LISTED,
      name: 'Ornek M-3',
      label: 'kafa burcu',
      code: null,
      path: '/yedek-parca/burc',
      cents: 100,
      qty: 1,
    },
  ];
  const { items, changed } = refreshLines(stored, catalogue);
  assert.equal(changed, true);
  assert.deepEqual(
    items.map((x) => [x.id, x.qty, x.cents]),
    [
      [ITEM, 2, 300],
      [TIP, 5, 200],
      [LISTED, 1, null],
    ],
  );
  assert.equal(stored[1].cents, 100, 'the stored palet is not changed in place');
  // Nothing differs: no write is needed.
  const again = refreshLines(items, catalogue);
  assert.equal(again.changed, false);
  assert.deepEqual(again.items, items);
  assert.equal(refreshLines(stored, {}).changed, false);
  // An id that is an Object.prototype key is no catalogue line.
  assert.equal(refreshLines([{ ...stored[0], id: '__proto__' }], catalogue).changed, false);
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
  assert.equal(linePagePath(ITEM, '/yedek-parca'), HEAD);
  assert.equal(linePagePath(partLineId(HEAD, false), '/yedek-parca'), HEAD);
  assert.equal(linePagePath(LISTED, '/yedek-parca'), '/yedek-parca/burc');
  assert.equal(linePagePath('//evil.example/x|chisel', '/yedek-parca'), null);
  assert.equal(linePagePath('/kirici/../palet|chisel', '/yedek-parca'), null);
  assert.equal(linePagePath('/|chisel', '/yedek-parca'), null);
  assert.equal(linePagePath('listed:../x/y', '/yedek-parca'), null);
});

test('a line links its page opened on the size and type it was added with', () => {
  // A tip: the type always, the size from the second one on (the first is the page's default).
  assert.equal(
    lineHref({ id: TIP, name: 'Ornek M-1', path: '/kirici/ornek/m-1' }),
    '/kirici/ornek/m-1?tip=chisel',
  );
  assert.equal(
    lineHref({ id: TIP2, name: 'Ornek M-2 (Ø120 mm)', path: '/kirici/ornek/m-2' }),
    '/kirici/ornek/m-2?uc=2&tip=moil',
  );
  assert.equal(
    lineHref({
      id: tipLineId('/kirici/ornek/m-2', 1, 'blunt'),
      name: 'Ornek M-2 (Ø100 mm)',
      path: '/kirici/ornek/m-2',
    }),
    '/kirici/ornek/m-2?tip=blunt',
  );
  // A modelled part: its own page.
  const PISTON = '/yedek-parca/piston/ornek-m-1-piston';
  assert.equal(
    lineHref({ id: partLineId(PISTON, false), name: 'Ornek M-1', path: PISTON }),
    PISTON,
  );
  // A front head: Burçlu is what its page opens on, so only the burçsuz line names its choice.
  assert.equal(lineHref({ id: ITEM, name: 'Ornek M-1', path: HEAD }), HEAD);
  assert.equal(
    lineHref({ id: partLineId(HEAD, false), name: 'Ornek M-1', path: HEAD }),
    `${HEAD}?burc=0`,
  );
  // A listed part: its group page, searched for its breaker.
  assert.equal(
    lineHref({ id: LISTED, name: 'Örnek M-3', path: '/yedek-parca/burc' }),
    '/yedek-parca/burc?q=%C3%96rnek+M-3',
  );
});

test('only a front head stored without its bushings links with burc=0', () => {
  const href = (id: string, path: string) => lineHref({ id, name: 'Ornek M-1', path });
  // Every other group's item, whatever its anchor is called, keeps its plain page link.
  for (const part of ['burc', 'kama', 'saplama', 'piston', 'akumulator', 'tamir-takimi'])
    for (const anchor of ['ornek-m-1', 'alt-govde', 'ornek-alt-govde-burc']) {
      const page = `/yedek-parca/${part}/${anchor}`;
      assert.equal(href(partLineId(page, false), page), page, page);
    }
  // A tip and a listed part of a breaker or group named like the head group do not take it.
  const tip = href(tipLineId('/kirici/alt-govde/m-1', null, 'chisel'), '/kirici/alt-govde/m-1');
  assert.equal(tip, '/kirici/alt-govde/m-1?tip=chisel');
  const listed = href(
    listedLineId('alt-govde', 'ornek-m-3', 'ALT_GOVDE'),
    '/yedek-parca/alt-govde',
  );
  assert.ok(!listed.includes('burc='), listed);
  // The link's query is the one the item page reads, and its path is still the page's own.
  const url = new URL(href(partLineId(HEAD, false), HEAD), 'https://example.test');
  assert.equal(url.pathname, HEAD);
  assert.equal(url.searchParams.get(UNFITTED_PARAM), '0');
  assert.equal(opensUnfitted(url.search), true);
});

test('the item page opens Burçsuz only for burc=0', () => {
  assert.equal(opensUnfitted('?burc=0'), true);
  assert.equal(opensUnfitted('?gclid=1&burc=0'), true);
  for (const search of ['', '?', '?burc', '?burc=', '?burc=1', '?burc=00', '?q=burc', '?tip=0'])
    assert.equal(opensUnfitted(search), false, search);
});
