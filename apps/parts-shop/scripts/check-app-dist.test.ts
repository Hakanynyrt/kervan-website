import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adIds, allowedHosts, catalogValues, hostsIn, scanFile } from './check-app-dist.mjs';
import { siteOrigin } from './build-app.mjs';

// Invented values only (never a catalogue price or code).
const ADS = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'ads.ts'),
  'utf8',
);
const ctx = {
  ads: adIds(ADS),
  catalog: ['ZZ999-77', 'ZZ999-77-C'],
  allowed: allowedHosts('https://kiriciparca.com'),
};
const rules = (rel: string, text: string) => scanFile(rel, text, ctx).map((p) => p.rule);

test('adIds: finds the Google Ads id, the pixel id and the tag hosts in ads.ts', () => {
  const ids = adIds(ADS);
  assert.ok(ids.some((id) => /^AW-\d+$/.test(id)));
  assert.ok(ids.includes('www.googletagmanager.com'));
  assert.ok(ids.includes('bzrcdn.openai.com'));
  assert.ok(ids.length >= 4);
});

test('scanFile: ordinary app code passes', () => {
  const code =
    'const u=`${o}/kirici/${m}`;fetch("https://kiriciparca.com/kirici-modelleri.json");' +
    'a.href="https://wa.me/905555555555";e.price?.label;({cents:r.priceUsdNetCents});' +
    'createElementNS("http://www.w3.org/2000/svg","svg");x.demo&&y;t.banner.demo';
  assert.deepEqual(scanFile('assets/index-abc.js', code, ctx), []);
  assert.deepEqual(rules('assets/index.css', '/*! tailwindcss | https://tailwindcss.com */'), []);
});

test('scanFile: a price-looking field with a value fails, in JSON and JS', () => {
  assert.ok(
    rules('data.json', '{"code":"A","cents":12345}').includes('price-looking field with a value'),
  );
  assert.ok(rules('data.json', '{"price":[100,200]}').includes('price-looking field with a value'));
  assert.ok(
    rules('assets/a.js', 'x={priceUsdNetCents:4100}').includes('price-looking field with a value'),
  );
  assert.ok(
    rules('assets/a.js', 'x={"priceFitted":[12,13]}').includes('price-looking field with a value'),
  );
});

test('scanFile: catalogue codes and DEMO markers fail', () => {
  assert.ok(rules('assets/a.js', 'k="ZZ999-77-C"').includes('value from the catalogue snapshot'));
  assert.ok(rules('assets/a.js', 'k="XX100-01"').includes('DEMO catalogue marker'));
  assert.ok(rules('c.json', '{"schema":1,"demo":true}').includes('DEMO catalogue marker'));
  assert.ok(
    rules('assets/a.js', '{schema:1,demo:!0,families:[]}').includes('DEMO catalogue marker'),
  );
  assert.ok(rules('assets/a.js', 'b("DEMO","D-100")').includes('DEMO catalogue marker'));
});

test('scanFile: ads ids, the Cloudflare beacon and trackers fail', () => {
  const aw = adIds(ADS).find((id) => /^AW-\d+$/.test(id)) ?? '';
  assert.ok(rules('assets/a.js', `send_to:"${aw}"`).includes('ads id from ads.ts'));
  assert.ok(
    rules(
      'index.html',
      '<script src="https://static.cloudflareinsights.com/beacon.min.js">',
    ).includes('analytics / ads host'),
  );
  assert.ok(
    rules('assets/a.js', 's.src="https://www.googletagmanager.com/gtag/js"').includes(
      'analytics / ads host',
    ),
  );
});

test('scanFile: private strings fail', () => {
  assert.ok(rules('assets/a.js', 'x="V' + 'T' + '0103041"').includes('private string'));
  assert.ok(rules('assets/a.js', 'q="price_usd_net' + '_cents"').includes('private string'));
});

test('scanFile: an absolute URL to another host fails and names the host', () => {
  const p = scanFile('assets/a.js', 'fetch("https://cdn.example.net/x.js")', ctx);
  assert.deepEqual(p, [{ rule: 'absolute URL to another host', host: 'cdn.example.net' }]);
  assert.deepEqual(
    scanFile('assets/a.js', 'i.src="https://img.kiriciparca.com/tips/a.webp"', ctx),
    [],
  );
});

test('scanFile: a reserved .invalid parsing base is not a host', () => {
  assert.deepEqual(scanFile('assets/a.js', 'new URL(u,"http://app.invalid")', ctx), []);
});

test('allowedHosts: a local stand-in origin is allowed next to the production hosts', () => {
  const a = allowedHosts('http://127.0.0.1:4173');
  assert.ok(a.has('127.0.0.1') && a.has('kiriciparca.com') && a.has('img.kiriciparca.com'));
  assert.ok(!a.has('example.com'));
});

test('hostsIn: lower-cases and ignores relative paths', () => {
  assert.deepEqual([...hostsIn('a="/kirici/x" b="HTTPS://Wa.Me/9" c="//cdn.x"')], ['wa.me']);
});

test('catalogValues: tip and SKU codes, minus the ones written in the source', () => {
  const cat = {
    families: [
      { code: 'ZZ999-77', skus: [{ code: 'ZZ999-77-C' }, { code: 'ZZ999-77-M' }] },
      { code: 'ZZ888-01', skus: [] },
    ],
  };
  assert.deepEqual(catalogValues(cat, "const EXAMPLE = 'ZZ888-01';"), [
    'ZZ999-77',
    'ZZ999-77-C',
    'ZZ999-77-M',
  ]);
  assert.deepEqual(catalogValues(null, ''), []);
});

test('siteOrigin: https origins, http only on this machine, default the shop', () => {
  assert.equal(siteOrigin(undefined), 'https://kiriciparca.com');
  assert.equal(
    siteOrigin('https://feat-x.kervan-parts-shop.pages.dev/'),
    'https://feat-x.kervan-parts-shop.pages.dev',
  );
  assert.equal(siteOrigin('http://127.0.0.1:4173'), 'http://127.0.0.1:4173');
  assert.equal(siteOrigin('http://kiriciparca.com'), null);
  assert.equal(siteOrigin('https://kiriciparca.com/en'), null);
  assert.equal(siteOrigin('kiriciparca.com'), null);
});
