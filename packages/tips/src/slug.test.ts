import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from './slug.ts';

test('slugify transliterates Turkish letters', () => {
  assert.equal(slugify('Çağlar Şık Ölçü İĞNE ıüğ'), 'caglar-sik-olcu-igne-iug');
});

test('slugify collapses punctuation and trims dashes', () => {
  assert.equal(slugify('  Atlas Copco / MB-1700 (S) '), 'atlas-copco-mb-1700-s');
  assert.equal(slugify('---'), '');
});
