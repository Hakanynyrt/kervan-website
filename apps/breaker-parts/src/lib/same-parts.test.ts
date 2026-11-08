import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nameKeys, parseSameParts, samePartsFor, searchParts } from './same-parts.ts';

// Invented rows only: the real list lives in the private KV key, never in the repo.
const RAW = {
  schema: 1,
  groups: [
    {
      models: ['Rammer E 68', 'Krupp HM 960'],
      same: {
        tr: [{ name: 'Piston', size: 'boy 500' }, 'Silindir', { size: 'x' }],
        en: ['Piston'],
      },
      different: { tr: ['Yan saplama'] },
      note: { tr: 'Not' },
    },
    { models: ['Only One'], same: { tr: ['Piston'] } },
    { models: ['A 1', 'B 2'], same: { tr: [] } },
    'junk',
  ],
};

test('parseSameParts keeps valid groups and fills English from Turkish', () => {
  const g = parseSameParts(RAW);
  assert.equal(g.length, 1);
  assert.deepEqual(g[0].same, {
    tr: [
      { name: 'Piston', size: 'boy 500' },
      { name: 'Silindir', size: null },
    ],
    en: [{ name: 'Piston', size: null }],
  });
  const y = { name: 'Yan saplama', size: null };
  assert.deepEqual(g[0].different, { tr: [y], en: [y] });
  assert.deepEqual(g[0].note, { tr: 'Not', en: 'Not' });
});

test('parseSameParts never throws on bad input', () => {
  for (const x of [null, undefined, 1, 'x', [], {}, { groups: 'x' }])
    assert.deepEqual(parseSameParts(x), []);
});

test('samePartsFor matches spacing and case, and lists the other breakers', () => {
  const g = parseSameParts(RAW);
  const m = samePartsFor('Rammer E68', g, 'tr');
  assert.equal(m.length, 1);
  assert.deepEqual(m[0].others, ['Krupp HM 960']);
  assert.deepEqual(
    m[0].same.map((x) => x.name),
    ['Piston', 'Silindir'],
  );
  assert.deepEqual(m[0].different, [{ name: 'Yan saplama', size: null }]);
  assert.equal(m[0].note, 'Not');
  assert.deepEqual(samePartsFor('krupp hm 960', g, 'en')[0].others, ['Rammer E 68']);
  assert.deepEqual(samePartsFor('Rammer E 64', g, 'tr'), []);
});

test('nameKeys falls back to the folded name for unknown makes', () => {
  assert.deepEqual(nameKeys('Zzz Q-1'), ['zzzq1']);
});

test('searchParts finds parts by name, size and breaker, same before different', () => {
  const g = parseSameParts({
    groups: [
      {
        models: ['Zzz A 1', 'Qqq B 2'],
        same: {
          tr: [
            { name: 'Piston', size: 'boy 500' },
            { name: 'Kafa burcu', size: 'iç Ø70' },
          ],
        },
        different: { tr: [{ name: 'Yan saplama', size: 'Ø32' }] },
      },
    ],
  });
  assert.deepEqual(
    searchParts('piston', g, 'tr').map((h) => h.name),
    ['Piston'],
  );
  assert.deepEqual(
    searchParts('burç 70', g, 'tr').map((h) => h.name),
    ['Kafa burcu'],
  );
  assert.equal(searchParts('qqq b2 saplama', g, 'tr')[0].differs, true);
  assert.deepEqual(searchParts('', g, 'tr'), []);
  assert.deepEqual(searchParts('valf', g, 'tr'), []);
});
