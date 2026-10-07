import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayBreakers } from './breaker-display.ts';

const names = (b: string, m: string) => displayBreakers(b, m).map((x) => `${x.brand} | ${x.model}`);

test('canonical maker spelling from the brand column', () => {
  assert.deepEqual(names('SANDVIK', 'BR 321'), ['Sandvik | BR 321']);
  assert.deepEqual(names('ATLAS COPCO', 'MB 700'), ['Atlas Copco | MB 700']);
  assert.equal(displayBreakers('JCB', 'HM 860 Q')[0].slug, 'jcb/hm-860-q');
});

test('maker split across the brand column and the model text', () => {
  assert.deepEqual(names('DEMO', '/ Daemo DMB 50 V'), ['Daemo | DMB 50 V']);
  assert.deepEqual(names('MAGNUM', '/ Hanwoo RHB 301 V'), ['Hanwoo | RHB 301 V']);
  assert.deepEqual(names('IR MONTABERT', 'Montabert SC 12'), ['Montabert | SC 12']);
});

test('maker taken from the model text when the column has none', () => {
  assert.deepEqual(names('', 'Caterpiller H 120'), ['Caterpillar | H 120']);
  assert.deepEqual(names('OTHER BREAKER MODELS', 'Komatsu M 30'), ['Komatsu | M 30']);
  assert.deepEqual(names('', 'II Demo / Daemo DMB S 2300'), ['Daemo | DMB S 2300']);
});

test('lists become separate models; brackets and short tails stay together', () => {
  assert.deepEqual(names('D&A', '15V, D&A 150'), ['D&A | 15V', 'D&A | 150']);
  assert.deepEqual(names('', 'Arden AB 280 / Arden AB 350'), ['Arden | AB 280', 'Arden | AB 350']);
  assert.deepEqual(names('KRUPP', 'HM 60 (61 , 62)'), ['Krupp | HM 60 (61 , 62)']);
  assert.deepEqual(names('SOCOMEC', 'DMS 95 / 2'), ['Socomec | DMS 95 / 2']);
});

test('line-break fragments without a maker give nothing', () => {
  assert.deepEqual(names('', '952)'), []);
  assert.deepEqual(names('', '(Produced from 1997 on)'), []);
  assert.deepEqual(names('KRUPP', 'HM 950 (951'), []);
});

test('MTB models drop the "MT" series prefix (owner)', () => {
  assert.deepEqual(names('MTB', 'MT 170'), ['MTB | 170']);
  assert.deepEqual(names('MTB', 'MT36'), ['MTB | 36']);
  assert.deepEqual(names('MTB', 'GA 150'), ['MTB | GA 150']);
  assert.equal(displayBreakers('MTB', 'MT 170')[0].slug, 'mtb/170');
});
