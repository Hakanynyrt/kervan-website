import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breakerKeys, editDistance, fold, guessMake, matches, rewriteQuery } from './search.ts';

test('fold: Turkish-safe lower case, letters and digits only', () => {
  assert.equal(fold('Indeco HP 500'), 'indecohp500');
  assert.equal(fold('INDECO'), 'indeco');
  assert.equal(fold('İnan'), 'inan');
  assert.equal(fold('INAN'), 'inan');
  assert.equal(fold('ınan'), 'inan');
  assert.equal(fold('Çukurova'), 'cukurova');
  assert.equal(fold('ŞĞÖÜ çşğöü'), 'sgoucsgou');
  assert.equal(fold('HB-20 G'), 'hb20g');
});

test('matches: every query word, case, Turkish letters, spaces and dashes ignored', () => {
  assert.ok(matches('indeco hp 500', 'Indeco HP 500'));
  assert.ok(matches('INDECO HP 500', 'Indeco HP 500'));
  assert.ok(matches('italdem', 'Italdem K 80'));
  assert.ok(matches('cukurova', 'Çukurova ÇK 300'));
  assert.ok(matches('çukurova', 'Cukurova CK 300'));
  assert.ok(matches('INAN 300', 'İnan 300'));
  assert.ok(matches('inan 300', 'İnan 300'));
  assert.ok(matches('sb 40 ii', 'Soosan SB 40 II'));
  assert.ok(matches('hb20g', 'Furukawa HB 20 G'));
  assert.ok(matches('hb-20g', 'Furukawa HB 20G'));
  assert.ok(matches('e68', 'Rammer E 68'));
  assert.ok(!matches('rammer 960', 'Krupp HM 960'));
  assert.ok(!matches('', 'Krupp HM 960'));
});

test('editDistance counts one typo, a swap and stops above the limit', () => {
  assert.equal(editDistance('ramer', 'rammer'), 1);
  assert.equal(editDistance('furukwaa', 'furukawa'), 1);
  assert.equal(editDistance('soosan', 'soosan'), 0);
  assert.equal(editDistance('abc', 'xyzxyz', 2), 3);
});

const MAKES = ['Rammer', 'Soosan', 'Krupp', 'Atlas Copco', 'Furukawa', 'Indeco', 'Kwanglim'];

test('guessMake: typos, other names, only makes we list', () => {
  assert.equal(guessMake('ramer', MAKES), 'Rammer');
  assert.equal(guessMake('sosan', MAKES), 'Soosan');
  assert.equal(guessMake('krup', MAKES), 'Krupp');
  assert.equal(guessMake('epiroc', MAKES), 'Atlas Copco');
  assert.equal(guessMake('furukava', MAKES), 'Furukawa');
  assert.equal(guessMake('kanglim', MAKES), 'Kwanglim');
  assert.equal(guessMake('ındeko', MAKES), 'Indeco');
  assert.equal(guessMake('hm', MAKES), null);
  assert.equal(guessMake('960', MAKES), null);
  assert.equal(guessMake('montabert', MAKES), null);
});

const NAMES = [
  'Rammer E 68',
  'Rammer S 25',
  'Krupp HM 960',
  'Atlas Copco HB 2200',
  'Soosan SB 40 II',
];

test('rewriteQuery: fixes the make, drops unknown words, keeps the model number', () => {
  assert.equal(rewriteQuery('ramer e68', NAMES, MAKES), 'Rammer e68');
  assert.equal(rewriteQuery('krupp hm 960 cs', NAMES, MAKES), 'Krupp hm 960');
  assert.equal(rewriteQuery('epiroc hb 2200', NAMES, MAKES), 'Atlas Copco hb 2200');
  assert.equal(rewriteQuery('epiroc', NAMES, MAKES), 'Atlas Copco');
  // A word that exists elsewhere ("CS") but not with this model is dropped too.
  assert.equal(
    rewriteQuery('krupp hm 960 cs', [...NAMES, 'Montabert BRV 32 CS'], MAKES),
    'Krupp hm 960',
  );
  // The model number is never dropped.
  assert.equal(rewriteQuery('rammer 960', NAMES, MAKES), null);
  // Nothing sensible left: no rewrite.
  assert.equal(rewriteQuery('xyz 12345', NAMES, MAKES), null);
  assert.equal(rewriteQuery('qwerty', NAMES, MAKES), null);
  assert.equal(rewriteQuery('', NAMES, MAKES), null);
  // Already fine as typed.
  assert.equal(rewriteQuery('rammer e68', NAMES, MAKES), null);
});

test('breakerKeys: spacing does not matter, lists and brackets', () => {
  assert.deepEqual(breakerKeys('Rammer E68'), ['rammere68']);
  assert.deepEqual(breakerKeys('Rammer E 68'), ['rammere68']);
  assert.deepEqual(breakerKeys('Krupp HM 560 / 580'), ['krupphm560', 'krupphm580']);
  assert.deepEqual(breakerKeys('MTB 250/255'), ['mtb250', 'mtb255']);
  assert.deepEqual(breakerKeys('Atlas Copco MB 1000 (Krupp HM 680)'), ['atlascopcomb1000']);
  assert.deepEqual(breakerKeys('Soosan SB50 TS-P'), ['soosansb50tsp']);
  assert.deepEqual(breakerKeys('Unknown X 1'), []);
});
