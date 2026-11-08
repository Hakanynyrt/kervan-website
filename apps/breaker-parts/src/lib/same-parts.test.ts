import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nameKeys, parseSameParts, samePartsFor } from './same-parts.ts';

// Invented rows only: the real list lives in the private KV key, never in the repo.
const RAW = {
  schema: 1,
  groups: [
    {
      models: ['Rammer E 68', 'Krupp HM 960'],
      same: { tr: ['Piston', 'Silindir'], en: ['Piston'] },
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
  assert.deepEqual(g[0].same, { tr: ['Piston', 'Silindir'], en: ['Piston'] });
  assert.deepEqual(g[0].different, { tr: ['Yan saplama'], en: ['Yan saplama'] });
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
  assert.deepEqual(m[0].same, ['Piston', 'Silindir']);
  assert.deepEqual(m[0].different, ['Yan saplama']);
  assert.equal(m[0].note, 'Not');
  assert.deepEqual(samePartsFor('krupp hm 960', g, 'en')[0].others, ['Rammer E 68']);
  assert.deepEqual(samePartsFor('Rammer E 64', g, 'tr'), []);
});

test('nameKeys falls back to the folded name for unknown makes', () => {
  assert.deepEqual(nameKeys('Zzz Q-1'), ['zzzq1']);
});
