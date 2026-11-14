import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addToCart,
  readCart,
  readRefreshStamp,
  REFRESH_EVERY_MS,
  refreshIsFresh,
  refreshStamp,
  writeRefreshStamp,
} from './cart.ts';
import { paletSum } from './palet-quote.ts';

// Invented values only: never a catalogue price.

/** A storage that holds what the test puts in it; `broken` makes every access throw. */
const storage = (broken = false) => {
  const data = new Map<string, string>();
  const guard = () => {
    if (broken) throw new Error('blocked');
  };
  return {
    getItem: (k: string) => (guard(), data.get(k) ?? null),
    setItem: (k: string, v: string) => (guard(), void data.set(k, v)),
    removeItem: (k: string) => (guard(), void data.delete(k)),
  };
};
const setGlobal = (name: 'localStorage' | 'sessionStorage' | 'window', value: unknown) =>
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
/** readCart over a hand-written `kv_cart_v1`. */
const stored = (json: string) => {
  const s = storage();
  s.setItem('kv_cart_v1', json);
  setGlobal('localStorage', s);
  return readCart();
};

const PATH = '/kirici/ornek/m-1';

test('readCart: a price that is not a finite number reads as "fiyat sorulacak"', () => {
  const list = stored(
    // 1e999 is how JSON spells Infinity.
    `[
      {"id":"a","name":"A","code":null,"path":"${PATH}","cents":1234,"qty":2},
      {"id":"b","name":"B","code":null,"path":"${PATH}","cents":null,"qty":1},
      {"id":"c","name":"C","code":null,"path":"${PATH}","qty":3},
      {"id":"d","name":"D","code":null,"path":"${PATH}","cents":"1234","qty":1},
      {"id":"e","name":"E","code":null,"path":"${PATH}","cents":1e999,"qty":1},
      {"id":"f","name":"F","code":null,"path":"${PATH}","cents":{},"qty":1},
      {"id":"g","name":"G","code":null,"path":"${PATH}","cents":0,"qty":1}
    ]`,
  );
  assert.deepEqual(
    list.map((x) => [x.id, x.cents]),
    [
      ['a', 1234],
      ['b', null],
      ['c', null],
      ['d', null],
      ['e', null],
      ['f', null],
      ['g', 0],
    ],
  );
  // Nothing else of a line changes.
  assert.deepEqual(list[0], { id: 'a', name: 'A', code: null, path: PATH, cents: 1234, qty: 2 });
  // So the sum is a number: the one priced line, the rest "fiyat sorulacak".
  const sum = paletSum(list, 'en', null);
  assert.equal(sum.totalCents, 2468);
  assert.equal(sum.grossCents, 2468);
  assert.equal(sum.anyAsk, true);
});

test('readCart: a line without a path is kept, with no path', () => {
  const list = stored(
    `[{"id":"${PATH}|moil","name":"A","qty":1},
      {"id":"x","name":"B","path":7,"cents":500,"qty":2}]`,
  );
  assert.deepEqual(list, [
    { id: `${PATH}|moil`, name: 'A', path: '', cents: null, qty: 1 },
    { id: 'x', name: 'B', path: '', cents: 500, qty: 2 },
  ]);
});

test('readCart: what is not a line is dropped; damaged or blocked storage is an empty palet', () => {
  assert.deepEqual(
    stored(
      `[null, 5, "x", {"id":"a"}, {"id":"a","name":"A","qty":1.5}, {"name":"A","qty":1},
        {"id":"ok","name":"A","code":null,"path":"${PATH}","cents":10,"qty":1}]`,
    ).map((x) => x.id),
    ['ok'],
  );
  assert.deepEqual(stored('{"id":"a"}'), []);
  assert.deepEqual(stored('[{"id":'), []);
  setGlobal('localStorage', storage(true));
  assert.deepEqual(readCart(), []);
});

const T0 = 1_800_000_000_000;
const IDS = [`${PATH}|chisel`, '/yedek-parca/piston/ornek-m-1-piston', 'listed:burc/ornek-m-3/X'];
const STAMP = refreshStamp(T0, 'tr', IDS);

test('refreshIsFresh: the same language and lines, for ten minutes', () => {
  assert.equal(REFRESH_EVERY_MS, 600_000);
  assert.equal(refreshIsFresh(STAMP, T0, 'tr', IDS), true);
  assert.equal(refreshIsFresh(STAMP, T0 + 1, 'tr', [...IDS]), true);
  assert.equal(refreshIsFresh(STAMP, T0 + REFRESH_EVERY_MS - 1, 'tr', IDS), true);
  assert.equal(refreshIsFresh(STAMP, T0 + REFRESH_EVERY_MS, 'tr', IDS), false);
  assert.equal(refreshIsFresh(STAMP, T0 + 24 * 3_600_000, 'tr', IDS), false);
  // A clock set back does not make an old read current.
  assert.equal(refreshIsFresh(STAMP, T0 - 1, 'tr', IDS), false);
});

test('refreshIsFresh: another language or any other list of lines reads again', () => {
  assert.equal(refreshIsFresh(STAMP, T0, 'en', IDS), false);
  assert.equal(refreshIsFresh(STAMP, T0, 'tr', IDS.slice(0, 2)), false);
  assert.equal(refreshIsFresh(STAMP, T0, 'tr', [...IDS, '/kirici/ornek/m-2|moil']), false);
  assert.equal(refreshIsFresh(STAMP, T0, 'tr', [IDS[1], IDS[0], IDS[2]]), false);
  assert.equal(refreshIsFresh(STAMP, T0, 'tr', [IDS[0], IDS[1], `${IDS[2]}x`]), false);
  assert.equal(refreshIsFresh(STAMP, T0, 'tr', []), false);
});

test('refreshIsFresh: no stamp or a damaged one reads again', () => {
  for (const bad of [
    null,
    '',
    'x',
    'null',
    '7',
    '[]',
    '{}',
    `{"at":"${T0}","lang":"tr","ids":${JSON.stringify(IDS)}}`,
    `{"at":${T0},"lang":"tr"}`,
    `{"at":${T0},"lang":"tr","ids":"${IDS.join()}"}`,
    `{"lang":"tr","ids":${JSON.stringify(IDS)}}`,
  ])
    assert.equal(refreshIsFresh(bad, T0, 'tr', IDS), false, String(bad));
});

test('the stamp is kept for the tab; blocked storage reads again and does not throw', () => {
  setGlobal('sessionStorage', storage());
  assert.equal(readRefreshStamp(), null);
  writeRefreshStamp(STAMP);
  assert.equal(refreshIsFresh(readRefreshStamp(), T0 + 5, 'tr', IDS), true);
  // It holds the time, the language and the ids: no name, no price.
  assert.deepEqual(JSON.parse(readRefreshStamp()!), { at: T0, lang: 'tr', ids: IDS });
  setGlobal('sessionStorage', storage(true));
  writeRefreshStamp(STAMP);
  assert.equal(readRefreshStamp(), null);
  setGlobal('sessionStorage', undefined);
  writeRefreshStamp(STAMP);
  assert.equal(readRefreshStamp(), null);
});

const LINE = { id: IDS[1], name: 'Ornek M 1', label: 'piston', code: null, path: IDS[1] };

test('addToCart: a line written over from its product page has /palet read again', () => {
  // `writeCart` tells the page (CartLink, /palet) through a window event.
  setGlobal('window', { dispatchEvent: () => true });
  setGlobal('localStorage', storage());
  setGlobal('sessionStorage', storage());
  addToCart({ ...LINE, cents: 1000 }, 2);
  const ids = readCart().map((x) => x.id);
  writeRefreshStamp(refreshStamp(T0, 'tr', ids));
  // Another line: the stamp stays, it names the lines it covered.
  addToCart({ ...LINE, id: IDS[0], path: PATH, cents: 700 }, 1);
  assert.equal(refreshIsFresh(readRefreshStamp(), T0 + 1000, 'tr', ids), true);
  // The first line again, from its English page: the same id, another label and price.
  addToCart({ ...LINE, label: 'Piston (EN)', cents: 900 }, 1);
  assert.deepEqual(
    readCart().map((x) => [x.id, x.label, x.cents, x.qty]),
    [
      [IDS[1], 'Piston (EN)', 900, 3],
      [IDS[0], 'piston', 700, 1],
    ],
  );
  assert.equal(readRefreshStamp(), null);
  assert.equal(refreshIsFresh(readRefreshStamp(), T0 + 1000, 'tr', ids), false);
});

test('addToCart: blocked session storage does not throw and the line is stored', () => {
  setGlobal('window', { dispatchEvent: () => true });
  setGlobal('localStorage', storage());
  setGlobal('sessionStorage', storage(true));
  addToCart({ ...LINE, cents: 1000 }, 1);
  addToCart({ ...LINE, cents: 1000 }, 1);
  assert.equal(readCart()[0].qty, 2);
});
