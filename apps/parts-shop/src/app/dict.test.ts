import assert from 'node:assert/strict';
import test from 'node:test';
import { APP_DICT, fmtDate } from './dict.ts';

/** Every leaf of a dict: its dotted key and its value. */
function leaves(v: unknown, key = ''): [string, unknown][] {
  if (v && typeof v === 'object')
    return Object.entries(v).flatMap(([k, x]) => leaves(x, key ? `${key}.${k}` : k));
  return [[key, v]];
}

/** A function text with a sample argument (every one takes a number or a text). */
const sample = (f: unknown): unknown => (f as (a: unknown) => unknown)(3);

test('TR and EN have the same keys', () => {
  const tr = leaves(APP_DICT.tr).map(([k]) => k);
  const en = leaves(APP_DICT.en).map(([k]) => k);
  assert.deepEqual(en, tr);
});

test('every text is filled in both languages', () => {
  for (const lang of ['tr', 'en'] as const)
    for (const [k, v] of leaves(APP_DICT[lang])) {
      const text = typeof v === 'function' ? sample(v) : v;
      assert.equal(typeof text, 'string', `${lang}.${k}`);
      assert.ok((text as string).trim().length > 0, `${lang}.${k}`);
      assert.ok(!/undefined|NaN|\{|\}/.test(text as string), `${lang}.${k}: ${text as string}`);
    }
});

test('the functions take their numbers', () => {
  for (const lang of ['tr', 'en'] as const) {
    const d = APP_DICT[lang];
    assert.match(d.tabs.paletCount(4), /4/);
    assert.match(d.finder.more(12), /12/);
    assert.match(d.priceDate('14 Kasım 2026'), /14 Kasım 2026/);
  }
  assert.equal(APP_DICT.en.tabs.paletCount(1), 'Palet, 1 item');
});

test('the app name and the tabs as agreed', () => {
  assert.equal(APP_DICT.tr.appName, 'Kervan Kırıcı Parça');
  assert.equal(APP_DICT.en.appName, 'Kervan Breaker Parts');
  const tabs = (l: 'tr' | 'en') => {
    const t = APP_DICT[l].tabs;
    return [t.home, t.guides, t.scan, t.machines, t.palet];
  };
  assert.deepEqual(tabs('tr'), ['Ana ekran', 'Rehber', 'Tara', 'Makinelerim', 'Palet']);
  assert.deepEqual(tabs('en'), ['Home', 'Guides', 'Scan', 'My machines', 'Palet']);
  assert.equal(APP_DICT.tr.scan.notKervan, 'Bu bir Kervan bağlantısı değil');
  assert.match(
    APP_DICT.tr.priceDate('x'),
    /^Fiyatlar x tarihlidir; bağlantı olunca güncellenir\.$/,
  );
});

test('fmtDate: the date in the app language', () => {
  const at = Date.UTC(2026, 10, 14, 12);
  assert.match(fmtDate(at, 'tr'), /14 Kasım 2026/);
  assert.match(fmtDate(at, 'en'), /14 November 2026/);
});
