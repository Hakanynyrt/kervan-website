import assert from 'node:assert/strict';
import test from 'node:test';
import { isNativeApp, isSiteUrl } from './native.ts';

test('isNativeApp: only when Capacitor says it is the native platform', () => {
  assert.equal(isNativeApp({}), false);
  assert.equal(isNativeApp({ Capacitor: {} }), false);
  assert.equal(isNativeApp({ Capacitor: { isNativePlatform: () => false } }), false);
  assert.equal(isNativeApp({ Capacitor: { isNativePlatform: () => true } }), true);
  const throws = {
    isNativePlatform: () => {
      throw new Error('x');
    },
  };
  assert.equal(isNativeApp({ Capacitor: throws }), false);
  // node tests (and the web build) have no Capacitor global.
  assert.equal(isNativeApp(), false);
});

test("isSiteUrl: https pages and files of the site's own origin only", () => {
  const o = 'https://kiriciparca.com';
  for (const u of ['https://kiriciparca.com/', 'https://kiriciparca.com/kirici/a/b?p=1#x'])
    assert.equal(isSiteUrl(u, o), true, u);
  for (const u of [
    'http://kiriciparca.com/',
    'https://www.kiriciparca.com/',
    'https://img.kiriciparca.com/a.webp',
    'https://kiriciparca.com.evil.example/',
    'https://wa.me/',
    'mailto:x@example.com',
    'tel:+1',
    'not a url',
  ])
    assert.equal(isSiteUrl(u, o), false, u);
});
