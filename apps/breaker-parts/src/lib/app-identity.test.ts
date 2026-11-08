import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { appIdentity, isTechPath, withAppIdentity } from './app-identity.ts';

test('only the owner page installs as Kervan Teknik', () => {
  assert.ok(isTechPath('/teknik-bilgiler'));
  assert.ok(isTechPath('/en/teknik-bilgiler/'));
  assert.ok(!isTechPath('/'));
  assert.ok(!isTechPath('/teknik-bilgiler-x'));
  assert.equal(appIdentity('/urunler').title, 'Kervan Breaker');
});

test('the page template carries the exact tags withAppIdentity swaps', () => {
  const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const out = withAppIdentity(html, '/teknik-bilgiler');
  assert.ok(out.includes('<link rel="manifest" href="/teknik.webmanifest"'));
  assert.ok(out.includes('<meta name="apple-mobile-web-app-title" content="Kervan Teknik"'));
  assert.equal(withAppIdentity(html, '/'), html);
});

test('the owner app manifest opens on Hızlı Cevap', () => {
  const m = JSON.parse(
    fs.readFileSync(new URL('../../public/teknik.webmanifest', import.meta.url), 'utf8'),
  );
  assert.equal(m.name, 'Kervan Teknik');
  assert.equal(m.start_url, '/teknik-bilgiler#ara');
  assert.notEqual(m.id, '/');
});
