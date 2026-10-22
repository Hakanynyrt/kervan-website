import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { PublicFamily, PublicSku } from '@kervan/tips';
import { shownTip } from './tip-options.ts';

// Made-up rows for the selection logic only (not catalogue data).
const sku = (tipType: PublicSku['tipType'], len: number, image?: string): PublicSku => ({
  code: `X-${tipType}-${len}`,
  tipType,
  lengthMm: { min: len, max: len },
  weightKg: null,
  tipAngleDeg: null,
  priceUsdNetCents: len * 10,
  availability: { kind: 'ask' },
  ...(image ? { image } : {}),
});
const fam = (code: string, d: number, skus: PublicSku[]): PublicFamily =>
  ({
    code,
    attrs: { diameterMm: d },
    popularTier: null,
    fits: [],
    skus,
  }) as unknown as PublicFamily;

test('shownTip takes the first size like the page, not the first family with the type', () => {
  // Two sizes: the page opens the first one, whose chisel has a render.
  const small = fam('A', 100, [sku('chisel', 900, 'small-chisel')]);
  const big = fam('B', 120, [sku('moil', 1100, 'big-moil')]);
  const r = shownTip([small, big]);
  assert.equal(r.opt?.family?.code, 'A');
  assert.equal(r.image, 'small-chisel');
  assert.equal(r.sampleImage, null);
});

test('shownTip falls back to the sample picture when the breaker has none of its own', () => {
  const sample = fam('S', 145, [
    sku('moil', 1000, 'other-moil'),
    sku('chisel', 1000, 'other-chisel'),
  ]);
  const extra = {
    brand: 'Make',
    model: 'M1',
    slug: 'make/m1',
    tipTypes: ['chisel' as const],
    diameterMm: 145,
    priceUsdNetCents: 1000,
  };
  const r = shownTip([], extra, { family: sample });
  assert.equal(r.image, null);
  assert.equal(r.sampleImage, 'other-chisel');
  assert.equal(r.opt?.cents, 1000);
});

test('shownTip has no picture for a breaker without its own or a sample', () => {
  const extra = {
    brand: 'Make',
    model: 'M2',
    slug: 'make/m2',
    tipTypes: ['chisel' as const],
    diameterMm: null,
    priceUsdNetCents: null,
  };
  const r = shownTip([], extra);
  assert.equal(r.image, null);
  assert.equal(r.sampleImage, null);
});
