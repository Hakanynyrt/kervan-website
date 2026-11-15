import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ASSET_BASE, assetUrl } from './asset-base.ts';

test('the site build keeps every media URL a plain path', () => {
  assert.equal(ASSET_BASE, '');
  assert.equal(assetUrl('/videos/rehber/a-01.mp4'), '/videos/rehber/a-01.mp4');
  assert.equal(assetUrl('/models/x-01.glb'), '/models/x-01.glb');
});

test('with a base, site paths get it and other URLs stay as they are', () => {
  const b = 'https://kiriciparca.com';
  assert.equal(assetUrl('/photos/stok/uc-01-sm.webp', b), `${b}/photos/stok/uc-01-sm.webp`);
  assert.equal(
    assetUrl('https://img.kiriciparca.com/tips/a.webp', b),
    'https://img.kiriciparca.com/tips/a.webp',
  );
  assert.equal(assetUrl('//cdn.example/a.webp', b), '//cdn.example/a.webp');
  assert.equal(assetUrl('data:image/png;base64,AA', b), 'data:image/png;base64,AA');
});
