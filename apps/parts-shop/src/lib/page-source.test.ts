import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanOrigin,
  IS_APP,
  PAGE_SOURCE,
  readAppEnv,
  SITE_ORIGIN,
  sourceUrl,
} from './page-source.ts';

test('the site build (no flags) reads its own origin: relative URLs', () => {
  assert.equal(IS_APP, false);
  assert.equal(PAGE_SOURCE, '');
  assert.equal(SITE_ORIGIN, 'https://kiriciparca.com');
  assert.equal(sourceUrl('/kirici/furukawa/hb-20g'), '/kirici/furukawa/hb-20g');
  assert.equal(sourceUrl('/kirici-modelleri.json'), '/kirici-modelleri.json');
});

test('the app build reads the site origin, the default or VITE_SITE_ORIGIN', () => {
  assert.deepEqual(readAppEnv({ VITE_APP: '1' }), {
    app: true,
    origin: 'https://kiriciparca.com',
  });
  assert.deepEqual(readAppEnv({ VITE_APP: '1', VITE_SITE_ORIGIN: 'http://127.0.0.1:4173/' }), {
    app: true,
    origin: 'http://127.0.0.1:4173',
  });
  assert.equal(readAppEnv(undefined).app, false);
  assert.equal(readAppEnv({ VITE_APP: '' }).app, false);
  assert.equal(readAppEnv({ VITE_APP: '0' }).app, false);
});

test('only an http(s) origin is taken; a path or other scheme falls back', () => {
  assert.equal(cleanOrigin('https://kiriciparca.com/rehber'), 'https://kiriciparca.com');
  assert.equal(cleanOrigin('javascript:alert(1)'), null);
  assert.equal(cleanOrigin('file:///etc'), null);
  assert.equal(cleanOrigin('kiriciparca.com'), null);
  assert.equal(cleanOrigin(''), null);
  assert.equal(readAppEnv({ VITE_APP: '1', VITE_SITE_ORIGIN: 'ftp://x' }).origin, SITE_ORIGIN);
});

test('sourceUrl prefixes site paths only', () => {
  const o = 'https://kiriciparca.com';
  assert.equal(sourceUrl('/en/kirici-ucu?q=hb', o), 'https://kiriciparca.com/en/kirici-ucu?q=hb');
  assert.equal(sourceUrl('//evil.example/x', o), '//evil.example/x');
  assert.equal(
    sourceUrl('https://img.kiriciparca.com/a.webp', o),
    'https://img.kiriciparca.com/a.webp',
  );
  assert.equal(sourceUrl('relative', o), 'relative');
});
