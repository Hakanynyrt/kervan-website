import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  byNameFit,
  exactHit,
  findModels,
  makesByModels,
  modelIndex,
  type FinderMake,
} from './finder.ts';

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

// Made-up rows again: the order of a list of hits (review, 2026-11-13: "HB 20" listed HB 20G 8th).
const RANKED: FinderMake[] = [
  {
    brand: 'Atlas Copco',
    models: [
      { model: 'HB 2200', slug: 'atlas-copco-hb-2200', tips: [] },
      { model: 'HB 4200', slug: 'atlas-copco-hb-4200', tips: [] },
    ],
  },
  { brand: 'Dehaco', models: [{ model: 'DHB 200 S', slug: 'dehaco-dhb-200-s', tips: [] }] },
  {
    brand: 'Furukawa',
    models: [
      { model: 'HB 20G', slug: 'furukawa-hb-20g', tips: [] },
      { model: 'HB 200', slug: 'furukawa-hb-200', tips: [] },
    ],
  },
  {
    brand: 'Kent',
    models: [
      { model: 'KHB 20', slug: 'kent-khb-20', tips: [] },
      { model: 'KHB 20G II', slug: 'kent-khb-20g-ii', tips: [] },
    ],
  },
  {
    brand: 'MTB',
    models: [
      { model: '2150', slug: 'mtb-2150', tips: [] },
      { model: '215', slug: 'mtb-215', tips: [] },
    ],
  },
];
const slugs = (q: string) => findModels(RANKED, q).hits.map((h) => h.model.slug);

test('a model whose name starts with the typed text comes before those that only hold it', () => {
  assert.deepEqual(slugs('HB 20'), [
    // "HB 20…": the model starts with the text (in the list's order).
    'furukawa-hb-20g',
    'furukawa-hb-200',
    // "…HB 20…": the text is inside the name, in one piece.
    'dehaco-dhb-200-s',
    'kent-khb-20',
    'kent-khb-20g-ii',
    // Only the words "hb" and "20" are found.
    'atlas-copco-hb-2200',
    'atlas-copco-hb-4200',
  ]);
  // Case, spaces and dashes do not matter (one word finds only the names that hold it whole),
  // and the make may lead.
  assert.deepEqual(slugs('hb-20'), slugs('HB 20').slice(0, 5));
  assert.deepEqual(slugs('hb20'), slugs('HB 20').slice(0, 5));
  assert.deepEqual(slugs('furukawa hb 20'), ['furukawa-hb-20g', 'furukawa-hb-200']);
});

test('the model the text names exactly comes first', () => {
  assert.deepEqual(slugs('KHB 20'), ['kent-khb-20', 'kent-khb-20g-ii']);
  assert.deepEqual(slugs('hb 200'), [
    'furukawa-hb-200',
    'dehaco-dhb-200-s',
    'atlas-copco-hb-2200',
    'atlas-copco-hb-4200',
  ]);
  assert.deepEqual(slugs('Kent KHB 20G II'), ['kent-khb-20g-ii']);
  // MTB 2150 is listed first, but "MTB 215" names the other model.
  assert.deepEqual(slugs('mtb 215'), ['mtb-215', 'mtb-2150']);
  // The other name of the same model (MTB 210 II = MTB 215) names it too.
  assert.equal(slugs('MTB 210 II')[0], 'mtb-215');
});

test('hits that fit alike keep the list order', () => {
  assert.deepEqual(slugs('atlas'), ['atlas-copco-hb-2200', 'atlas-copco-hb-4200']);
  assert.deepEqual(slugs('20'), [
    'atlas-copco-hb-2200',
    'atlas-copco-hb-4200',
    'dehaco-dhb-200-s',
    'furukawa-hb-20g',
    'furukawa-hb-200',
    'kent-khb-20',
    'kent-khb-20g-ii',
  ]);
});

// A catalogue name that is a list, or carries a second name in brackets, names each of its models.
const LISTS: FinderMake[] = [
  {
    brand: 'Indeco',
    models: [
      { model: 'MES 121/150', slug: 'indeco-mes-121-150', tips: [] },
      { model: 'MES 1500', slug: 'indeco-mes-1500', tips: [] },
      { model: 'MES 181/200', slug: 'indeco-mes-181-200', tips: [] },
      { model: 'MES 1050/ 1200', slug: 'indeco-mes-1050-1200', tips: [] },
    ],
  },
  {
    brand: 'Krupp',
    models: [
      { model: 'HM 3000', slug: 'krupp-hm-3000', tips: [] },
      { model: 'HM 301 (300)', slug: 'krupp-hm-301-300', tips: [] },
      { model: 'HM 60 (61 , 62)', slug: 'krupp-hm-60-61-62', tips: [] },
      { model: 'HM 600', slug: 'krupp-hm-600', tips: [] },
    ],
  },
  {
    brand: 'Socomec',
    models: [
      { model: 'DMS 210', slug: 'socomec-dms-210', tips: [] },
      { model: 'DMS 95 / 2', slug: 'socomec-dms-95-2', tips: [] },
    ],
  },
];
const listSlugs = (q: string) => findModels(LISTS, q).hits.map((h) => h.model.slug);

test('each model of a list or bracket name counts as the model the text names', () => {
  // Review, 2026-11-13: MES 1500 came before MES 121/150 for "mes 150".
  assert.deepEqual(listSlugs('mes 150'), ['indeco-mes-121-150', 'indeco-mes-1500']);
  assert.deepEqual(listSlugs('Indeco MES 121'), ['indeco-mes-121-150']);
  // "MES 181/200" only holds the digits of "1200" across its slash: no name of it.
  assert.deepEqual(listSlugs('mes 1200'), ['indeco-mes-1050-1200', 'indeco-mes-181-200']);
  assert.deepEqual(listSlugs('hm 300'), ['krupp-hm-301-300', 'krupp-hm-3000']);
  assert.deepEqual(listSlugs('krupp hm 61'), ['krupp-hm-60-61-62']);
  assert.deepEqual(listSlugs('hm 60'), ['krupp-hm-60-61-62', 'krupp-hm-600']);
  assert.deepEqual(listSlugs('dms 2'), ['socomec-dms-95-2', 'socomec-dms-210']);
  // The name as written still names it, and a list is still no exact hit to open by itself.
  assert.deepEqual(listSlugs('MES 121/150'), ['indeco-mes-121-150']);
  assert.equal(exactHit(findModels(LISTS, 'mes 150').hits, 'mes 150'), null);
});

test('rows are put in the order the search lists its hits, alike rows as they came', () => {
  // The tip list's rows: best-sellers first, then by diameter; a breaker with two sizes twice.
  const rows = [
    { brand: 'MSB', name: 'MSB Saga 1500', d: 135 },
    { brand: 'Atlas Copco', name: 'Atlas Copco SB 502', d: 60 },
    { brand: 'Soosan', name: 'Soosan SB 50', d: 100, n: 1 },
    { brand: 'Atlas Copco', name: 'Atlas Copco SB 50', d: 40 },
    { brand: 'Soosan', name: 'Soosan SB 50', d: 120, n: 2 },
    { brand: 'Indeco', name: 'Indeco MES 121/150', d: 45 },
  ];
  const order = (q: string) => byNameFit(rows, q).map((r) => `${r.name} ${r.d}`);
  assert.deepEqual(order('sb 50'), [
    // Named exactly, in the rows' order.
    'Soosan SB 50 100',
    'Atlas Copco SB 50 40',
    'Soosan SB 50 120',
    // Starts with it.
    'Atlas Copco SB 502 60',
    // The rest, as they came.
    'MSB Saga 1500 135',
    'Indeco MES 121/150 45',
  ]);
  assert.equal(order('mes 150')[0], 'Indeco MES 121/150 45');
  // Nothing typed: the rows as they are, in a new list.
  assert.deepEqual(byNameFit(rows, ' '), rows);
  assert.notEqual(byNameFit(rows, ''), rows);
});
