import { test } from 'node:test';
import assert from 'node:assert/strict';
import { brandNumberSpelling, joinedSpelling, modelAliases } from './model-aliases.ts';

test('joinedSpelling joins the letters to the first number only', () => {
  assert.equal(joinedSpelling('HB 20G'), 'HB20G');
  assert.equal(joinedSpelling('KHB 20G II'), 'KHB20G II');
  assert.equal(joinedSpelling('F-22'), 'F22');
  assert.equal(joinedSpelling('HB20G'), null);
  assert.equal(joinedSpelling('20G'), null);
});

test('modelAliases: the joined form, then merged spellings that differ by more than spacing', () => {
  assert.deepEqual(modelAliases('HB 20G', ['HB 20G', 'HB20G', 'hb20g']), ['HB20G']);
  assert.deepEqual(modelAliases('F 22', ['F 22', 'F-22']), ['F22']);
  assert.deepEqual(modelAliases('MTB 215', ['MTB 215']), ['MTB215']);
  assert.deepEqual(modelAliases('BRV32', ['BRV32']), []);
  assert.deepEqual(modelAliases('HB 20G', ['HB 20G', 'HB 20 G']), ['HB20G']);
  assert.deepEqual(modelAliases('HM 60', ['HM 60', 'HM 61']), ['HM60', 'HM 61']);
});

test('modelAliases: near-duplicate spacing variants collapse to the joined form', () => {
  assert.deepEqual(modelAliases('S 26N', ['S 26N', 'S26 N']), ['S26N']);
  assert.deepEqual(modelAliases('PMV 90/P 3SH', ['PMV 90/P 3 SH', 'PMV-90/P3SH']), ['PMV90/P 3SH']);
});

test('modelAliases: spellings with stray punctuation are left out', () => {
  assert.deepEqual(modelAliases('HM 60', ['HM60 (61 , 62)']), ['HM60']);
  assert.deepEqual(modelAliases('PMV 90/ P 3SH', ['PMV90/ P 3 SH']), []);
  assert.deepEqual(modelAliases('PMV 1000', ['PMV 1000/ P 23SH']), ['PMV1000']);
});

test('modelAliases: series letters that repeat the make add the make-plus-number form', () => {
  assert.equal(brandNumberSpelling('MSB', 'MS 200'), '200');
  assert.equal(brandNumberSpelling('MTB', 'MTB 215'), null);
  assert.equal(brandNumberSpelling('Furukawa', 'HB 20G'), null);
  assert.equal(brandNumberSpelling('Furukawa', 'F 22'), null);
  assert.deepEqual(modelAliases('MS 200', ['MS 200'], 'MSB'), ['MS200', '200']);
  assert.deepEqual(modelAliases('HB 20G', ['HB 20G'], 'Furukawa'), ['HB20G']);
});
