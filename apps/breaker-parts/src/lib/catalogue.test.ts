import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CATALOGUE_PDF } from './catalogue.ts';

const read = (rel: string) => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
const dict = read('./dict.ts');

/** "2,8" / "2.8" from the link text of one language. */
function labelSize(lang: 'tr' | 'en'): string {
  const re =
    lang === 'tr'
      ? /catalogue: 'Kataloğu indir \(PDF, (\d+,\d) MB\)'/
      : /catalogue: 'Download catalogue \(PDF, (\d+\.\d) MB\)'/;
  const m = re.exec(dict);
  assert.ok(m, `dict.ts: no catalogue link text for ${lang}`);
  return m[1].replace(',', '.');
}

for (const lang of ['tr', 'en'] as const) {
  test(`catalogue PDF (${lang}): shipped, a PDF, and the size the link says`, () => {
    const file = new URL(`../../public${CATALOGUE_PDF[lang]}`, import.meta.url);
    assert.ok(fs.existsSync(file), `missing public${CATALOGUE_PDF[lang]}`);
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.subarray(0, 5).toString('latin1'), '%PDF-');
    // "MB" as the visitor's file manager shows it: decimal (macOS, phones) or binary (Windows).
    const sizes = [bytes.length / 1e6, bytes.length / 1048576].map((n) => n.toFixed(1));
    assert.ok(
      sizes.includes(labelSize(lang)),
      `link says ${labelSize(lang)} MB, the file is ${sizes.join(' / ')} MB`,
    );
  });
}

test('catalogue PDFs: versioned names, cached immutable, kept off the Functions', () => {
  for (const p of Object.values(CATALOGUE_PDF))
    assert.match(p, /^\/katalog\/krv-[a-z]+-\d{4}-\d{2}-(tr|en)\.pdf$/);
  assert.match(
    read('../../public/_headers'),
    /^\/katalog\/\*\n {2}Cache-Control: public, max-age=31536000, immutable/m,
  );
  const routes = JSON.parse(read('../../public/_routes.json')) as { exclude: string[] };
  assert.ok(routes.exclude.includes('/katalog/*'));
});
