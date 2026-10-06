import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignFamilyCodes, familyCode, skuCode } from './codes.ts';

test('familyCode pads the sequence and rounds the diameter', () => {
  assert.equal(familyCode(135, 7), 'KU135-07');
  assert.equal(familyCode(99.6, 12), 'KU100-12');
});

test('skuCode appends the tip letter', () => {
  assert.equal(skuCode('KU135-07', 'chisel'), 'KU135-07-C');
  assert.equal(skuCode('KU135-07', 'conical'), 'KU135-07-K');
});

test('assignFamilyCodes numbers new rows per diameter in sort order', () => {
  const codes = assignFamilyCodes(
    [
      { ref: 'b', diameterMm: 135, sortKey: 'Zeta 1' },
      { ref: 'a', diameterMm: 135, sortKey: 'Alpha 2' },
      { ref: 'c', diameterMm: 100, sortKey: 'Beta' },
    ],
    new Map(),
  );
  assert.equal(codes.get('a'), 'KU135-01');
  assert.equal(codes.get('b'), 'KU135-02');
  assert.equal(codes.get('c'), 'KU100-01');
});

test('assignFamilyCodes keeps existing codes and continues after the highest sequence', () => {
  const codes = assignFamilyCodes(
    [
      { ref: 'old', diameterMm: 135, sortKey: 'Zeta' },
      { ref: 'new', diameterMm: 135, sortKey: 'Alpha' },
    ],
    new Map([
      ['old', 'KU135-04'],
      ['gone', 'KU135-09'],
    ]),
  );
  assert.equal(codes.get('old'), 'KU135-04');
  assert.equal(codes.get('new'), 'KU135-10');
  assert.equal(codes.has('gone'), false);
});
