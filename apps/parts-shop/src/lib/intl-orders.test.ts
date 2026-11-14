import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTL } from './intl-orders.ts';

const text = (lang: 'tr' | 'en'): string => {
  const d = INTL[lang];
  return [d.title, d.desc, d.lead, d.ask, d.subject, ...d.rows.flatMap(([k, v]) => [k, ...v])].join(
    '\n',
  );
};

test('both languages carry the same rows', () => {
  assert.equal(INTL.tr.rows.length, INTL.en.rows.length);
  for (const lang of ['tr', 'en'] as const) {
    for (const [label, lines] of INTL[lang].rows) {
      assert.ok(label && lines.length > 0 && lines.every(Boolean));
    }
  }
});

test('the descriptions fit a search result', () => {
  for (const lang of ['tr', 'en'] as const) assert.ok(INTL[lang].desc.length <= 155, lang);
});

test('no price, no card and no unconfirmed promise on the page', () => {
  for (const lang of ['tr', 'en'] as const) {
    const s = text(lang);
    // An amount of money (the warranty and lead-time day counts are fine).
    assert.doesNotMatch(s, /\d[\d.,]*\s?(USD|EUR|TL|\$|€|₺)|(USD|EUR|TL|\$|€|₺)\s?\d/);
    assert.doesNotMatch(s, /mail order|kredi kart|credit card|IBAN/i);
    assert.doesNotMatch(s, /A\.TR|EUR\.1|EXW/);
  }
  assert.doesNotMatch(text('tr'), /KDV/);
});
