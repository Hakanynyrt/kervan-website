import { test } from 'node:test';
import assert from 'node:assert/strict';
import { otherSpelling } from './part-caption.ts';

test('otherSpelling: joins a spaced model, spaces a joined one', () => {
  assert.equal(otherSpelling('MTB 210'), 'MTB210');
  assert.equal(otherSpelling('Soosan SB 50'), 'Soosan SB50');
  assert.equal(otherSpelling('Soosan SB50'), 'Soosan SB 50');
  assert.equal(otherSpelling('Krupp HM 560 / 580'), 'Krupp HM560 / 580');
  assert.equal(otherSpelling('Rammer'), null);
});
