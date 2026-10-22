import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exactHit, findModels, makesByModels, type FinderMake } from './finder.ts';

// Made-up rows for the search logic only (not catalogue data).
const MAKES: FinderMake[] = [
  {
    brand: 'Furukawa',
    models: [
      { model: 'HB 20G', slug: 'furukawa-hb-20g', tips: [{ d: 135 }] },
      { model: 'HB 2G', slug: 'furukawa-hb-2g', tips: [{ d: 70 }] },
      { model: 'F22', slug: 'furukawa-f22', tips: [{ d: 135 }] },
    ],
  },
  { brand: 'Rammer', models: [{ model: 'E68', slug: 'rammer-e68', tips: [{ d: 68 }] }] },
];

test('findModels matches make and model like the tip search', () => {
  const { hits, guess } = findModels(MAKES, 'hb 20g');
  assert.equal(guess, null);
  assert.deepEqual(
    hits.map((h) => h.name),
    ['Furukawa HB 20G'],
  );
  assert.deepEqual(
    findModels(MAKES, 'Rammer E 68').hits.map((h) => h.model.slug),
    ['rammer-e68'],
  );
});

test('findModels finds nothing for an empty query', () => {
  assert.deepEqual(findModels(MAKES, '  '), { hits: [], guess: null });
});

test('findModels falls back to a corrected query', () => {
  const { hits, guess } = findModels(MAKES, 'Ramer E68');
  assert.ok(guess);
  assert.deepEqual(
    hits.map((h) => h.name),
    ['Rammer E68'],
  );
});

test('exactHit picks the only hit or the one the query names', () => {
  const all = findModels(MAKES, 'furukawa').hits;
  assert.equal(all.length, 3);
  assert.equal(exactHit(all, 'furukawa'), null);
  assert.equal(exactHit(all, 'Furukawa F 22')?.model.slug, 'furukawa-f22');
  assert.equal(exactHit(findModels(MAKES, 'HB 2G').hits, 'HB 2G')?.model.slug, 'furukawa-hb-2g');
});

test('makesByModels puts makes with more models first', () => {
  assert.deepEqual(
    makesByModels(MAKES).map((m) => m.brand),
    ['Furukawa', 'Rammer'],
  );
});
