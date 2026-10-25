import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exactHit, findModels, makesByModels, modelIndex, type FinderMake } from './finder.ts';

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
  { brand: 'Mega', models: [{ model: '20', slug: 'mega-20', tips: [{ d: 45 }] }] },
  {
    brand: 'MTB',
    models: [
      { model: '215', slug: 'mtb-215', tips: [{ d: 120 }] },
      { model: '20', slug: 'mtb-20', tips: [{ d: 45 }] },
    ],
  },
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

test('exactHit picks only the one model the query names exactly', () => {
  const all = findModels(MAKES, 'furukawa').hits;
  assert.equal(all.length, 3);
  assert.equal(exactHit(all, 'furukawa'), null);
  assert.equal(exactHit(all, 'Furukawa F 22')?.model.slug, 'furukawa-f22');
  assert.equal(exactHit(findModels(MAKES, 'HB 2G').hits, 'HB 2G')?.model.slug, 'furukawa-hb-2g');
});

test('exactHit never opens a partial or ambiguous match', () => {
  // One hit, but the query does not name it: no auto-open.
  const partial = findModels(MAKES, 'hb 20');
  assert.deepEqual(
    partial.hits.map((h) => h.model.slug),
    ['furukawa-hb-20g'],
  );
  assert.equal(exactHit(partial.hits, 'hb 20'), null);
  // Two makes have a model "20": the bare model number names neither.
  assert.equal(exactHit(findModels(MAKES, '20').hits, '20'), null);
  assert.equal(exactHit(findModels(MAKES, 'Mega 20').hits, 'Mega 20')?.model.slug, 'mega-20');
  // The other name of the same model (MTB 210 II = MTB 215) counts as naming it.
  assert.equal(exactHit(findModels(MAKES, 'MTB 210 II').hits, 'MTB 210 II')?.model.slug, 'mtb-215');
});

test('a make we do not list is not dropped to leave a bare number', () => {
  // Owner, 2026-10-22: "Hyundai HDB 20" suggested "20", listed unrelated models, opened Mega 20.
  assert.deepEqual(findModels(MAKES, 'Hyundai HDB 20'), { hits: [], guess: null });
  assert.deepEqual(findModels(MAKES, 'Volvo 20'), { hits: [], guess: null });
});

test('a misspelt make still finds the model, as a suggestion only', () => {
  const { hits, guess } = findModels(MAKES, 'furukava hb20');
  assert.ok(guess);
  assert.ok(hits.some((h) => h.model.slug === 'furukawa-hb-20g'));
});

test('makesByModels puts makes with more models first', () => {
  assert.deepEqual(
    makesByModels(MAKES).map((m) => m.brand),
    ['Furukawa', 'MTB', 'Mega', 'Rammer'],
  );
});

test('the header index keeps names and pages only, and finds the same models', () => {
  const index = modelIndex(MAKES);
  assert.deepEqual(index[0].models[0], { model: 'HB 20G', slug: 'furukawa-hb-20g' });
  assert.ok(!JSON.stringify(index).includes('tips'));
  for (const q of ['hb 20g', 'Ramer E68', 'F 22', 'mtb'])
    assert.deepEqual(
      findModels(index, q).hits.map((h) => h.model.slug),
      findModels(MAKES, q).hits.map((h) => h.model.slug),
    );
  assert.equal(exactHit(findModels(index, 'F22').hits, 'F22')?.name, 'Furukawa F22');
});
