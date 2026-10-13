import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesOem } from './oem.ts';

const NUMS = ['0993177', 'HB20G-20402', '3363 0310 54'];

test('matchesOem: the whole number, with or without spaces, dashes, dots or case', () => {
  assert.ok(matchesOem('0993177', NUMS));
  assert.ok(matchesOem('099 3177', NUMS));
  assert.ok(matchesOem('099-31-77', NUMS));
  assert.ok(matchesOem('hb20g20402', NUMS));
  assert.ok(matchesOem('HB20G 20402', NUMS));
  assert.ok(matchesOem('3363031054', NUMS));
  assert.ok(matchesOem('3363.0310.54', NUMS));
  assert.ok(matchesOem(' 3363 0310 54 ', NUMS));
});

test('matchesOem: the number among other words', () => {
  assert.ok(matchesOem('Krupp 0993177', NUMS));
  assert.ok(matchesOem('alt gövde 099 3177 lazım', NUMS));
});

test('matchesOem: part of a number, a model name or nothing never matches', () => {
  assert.equal(matchesOem('099317', NUMS), false);
  assert.equal(matchesOem('09931778', NUMS), false);
  assert.equal(matchesOem('HB20G', NUMS), false);
  assert.equal(matchesOem('Furukawa HB 20G', NUMS), false);
  assert.equal(matchesOem('', NUMS), false);
  assert.equal(matchesOem('0993177', []), false);
  // Numbers shorter than five characters are never looked for.
  assert.equal(matchesOem('1234', ['1234']), false);
});
