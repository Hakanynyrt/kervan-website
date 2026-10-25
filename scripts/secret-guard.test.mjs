// node --test scripts/: the secret guard catches each kind of private data and lets ordinary code through.
// Fake secrets are assembled at run time so this file itself passes the guard.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scan, parseDiff, envSecrets } from './secret-guard.mjs';

const line = (path, text) => [{ path, added: [{ line: 7, text }] }];
const rules = (files, secrets) => scan(files, secrets).map((p) => p.rule);

test('blocks private files by name', () => {
  for (const [path, rule] of [
    ['data/parca-fiyat-listesi-10.xlsx', 'spreadsheet'],
    ['sales.csv', 'spreadsheet'],
    ['drawings/mtb-170.dwg', 'source drawing'],
    ['parca-fiyat-listesi-9.enc.txt', 'price sheet'],
    ['keys/SHOP_SHEET_KEY.txt', 'price sheet key'],
    ['vega-catalog-2026.json', 'VEGA'],
    ['apps/parts-shop/.dev.vars', 'secrets file'],
    ['.env.production', 'secrets file'],
    ['id_rsa.pem', 'private key'],
  ])
    assert.ok(rules([{ path, added: [] }]).some((r) => r.includes(rule)), path);
});

test('blocks secrets and private data in added lines', () => {
  const fakes = [
    ['-----BEGIN RSA ' + 'PRIVATE KEY-----', 'private key'],
    ['token = "gh' + 'p_' + 'a1'.repeat(18) + '"', 'GitHub token'],
    ['OPENAI = "s' + 'k-proj-' + 'x'.repeat(30) + '"', 'API key'],
    ['BREVO=xkey' + 'sib-' + 'ab12'.repeat(16), 'Brevo key'],
    ['META_CAPI = "EA' + 'A' + 'Zx9'.repeat(30) + '"', 'Meta access token'],
    ['SHOP_SHEET_KEY' + '=' + 'Q'.repeat(32), 'price sheet key value'],
    ['const s = "enc:' + 'v1:' + 'A'.repeat(60) + '"', 'encrypted price sheet'],
    ['part: "V' + 'T0' + '103041"', 'VEGA part number'],
    ['parola: "gizli' + 'sifre9"', 'password'],
    ["{ brand: 'MTB', model: '150', type: 'kama', cen" + 'ts: 41000 }', 'price row'],
  ];
  for (const [text, rule] of fakes)
    assert.ok(
      rules(line('apps/parts-shop/src/x.ts', text)).some((r) => r.includes(rule)),
      rule,
    );
});

test('lets ordinary code, docs and test price rows through', () => {
  for (const [path, text] of [
    ['apps/parts-shop/src/lib/price.ts', 'export const VAT_PERCENT = 20;'],
    ['apps/parts-shop/scripts/sheet-crypt.ts', "export const PREFIX = 'enc:v1:';"],
    ['docs/agent/parts-shop.md', 'the key in the secret `SHOP_SHEET_KEY`, which the owner keeps'],
    ['packages/tips/src/part-prices.test.ts', "{ brand: 'MTB', model: '215', type: 'kama', cen" + 'ts: 100 }'],
    ['apps/parts-shop/src/lib/part-prices.ts', 'const cents = row.cents ?? null;'],
    ['apps/parts-shop/public/photos/parca/x-vitrin-04-lg.webp', ''],
  ])
    assert.deepEqual(scan(line(path, text)), [], `${path}: ${text}`);
});

test('blocks a value of a secret environment variable and never reports the value', () => {
  const value = 'cf-' + 'Zq81'.repeat(8);
  const secrets = envSecrets({ CLOUDFLARE_API_TOKEN: value, PWD: '/home/user/repo-path', GIT_CONFIG_KEY_0: 'http.proxy.xxxxxx' });
  assert.deepEqual(
    secrets.map((s) => s.name),
    ['CLOUDFLARE_API_TOKEN'],
  );
  const problems = scan(line('README.md', `curl -H "Authorization: Bearer ${value}"`), secrets);
  assert.equal(problems.length, 1);
  assert.ok(!JSON.stringify(problems).includes(value));
});

test('refuses very large files', () => {
  assert.ok(rules([{ path: 'dump.bin', added: [], bytes: 9 * 1024 * 1024 }])[0].includes('larger'));
});

test('parseDiff keeps new line numbers', () => {
  const files = parseDiff(
    [
      'diff --git a/a.ts b/a.ts',
      '--- a/a.ts',
      '+++ b/a.ts',
      '@@ -3,0 +4,2 @@',
      '+one',
      '+two',
      'diff --git a/gone.ts b/gone.ts',
      '--- a/gone.ts',
      '+++ /dev/null',
    ].join('\n'),
  );
  assert.deepEqual(files, [
    {
      path: 'a.ts',
      added: [
        { line: 4, text: 'one' },
        { line: 5, text: 'two' },
      ],
    },
  ]);
});
