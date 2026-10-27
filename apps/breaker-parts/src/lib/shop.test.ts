import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../../../../packages/tips/src/slug.ts';
import { BRANDS } from '../data/brands.ts';
import { SHOP_MAKE_PATH, SHOP_PATH } from './shop-paths.ts';

test('make links follow the shop URL rule (/marka/<slugify(make)>) and name real makes', () => {
  for (const [slug, path] of Object.entries(SHOP_MAKE_PATH)) {
    const b = BRANDS.find((x) => x.slug === slug);
    assert.ok(b, `unknown make ${slug}`);
    assert.equal(path, `/marka/${slugify(b.name)}`);
  }
});

test('product links point at the shop pages that exist', () => {
  const ok =
    /^\/(kirici-ucu|yedek-parca\/(piston|burc|saplama|tamir-takimi|kama|alt-govde))(\?tur=\w+)?$/;
  for (const p of Object.values(SHOP_PATH)) assert.match(p, ok);
});
