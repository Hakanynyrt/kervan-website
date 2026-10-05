// Extracts the per-model technical drawings from the VEGA product-catalogue PDF and
// pairs each one with its row in catalog.json (the output of vega-import.mjs).
//
//   node scripts/vega-drawings.mjs <catalogue.pdf> <catalog.json> <out.json>
//
// Needs poppler's `pdftohtml` and ImageMagick's `convert` on PATH.
//
// The drawings are private (the repo is public): the output must be written OUTSIDE the
// repo and uploaded to the KV key `drawings:v1` (binding VEGA_CATALOG). This script
// refuses to write inside the repo and prints only counts and page numbers.
//
// Output: { schema: 1, count, images: { "<catalog item id>": "<base64 PNG>" } }
//
// The PDF stores the images in no particular order, so each drawing is paired with its
// row by position: a drawing sits directly below the part numbers of its entry. The
// pairing is checked against the catalog's part numbers and the script exits non-zero
// when any row cannot be matched.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [PDF, CATALOG, OUT] = process.argv.slice(2);
if (!PDF || !CATALOG || !OUT) {
  console.error('usage: node scripts/vega-drawings.mjs <catalogue.pdf> <catalog.json> <out.json>');
  process.exit(2);
}
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outAbs = path.resolve(OUT);
if (outAbs === repoRoot || outAbs.startsWith(repoRoot + path.sep)) {
  console.error('Refusing to write inside the repo (it is public). Choose a path outside it.');
  process.exit(2);
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const items = catalog.items;
const byPage = new Map();
for (const it of items) {
  const p = it.source?.pdfPage;
  if (!p) continue;
  if (!byPage.has(p)) byPage.set(p, []);
  byPage.get(p).push(it);
}
const pages = [...byPage.keys()].sort((a, b) => a - b);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vega-drawings-'));
try {
  execFileSync(
    'pdftohtml',
    [
      '-xml',
      '-f',
      String(pages[0]),
      '-l',
      String(pages[pages.length - 1]),
      PDF,
      path.join(tmp, 'v'),
    ],
    { stdio: 'ignore', maxBuffer: 1 << 28 },
  );
  const xml = fs.readFileSync(path.join(tmp, 'v.xml'), 'utf8');

  // page number -> { images: [{top, src}], parts: [{top, pn}] }
  const doc = new Map();
  for (const m of xml.matchAll(/<page number="(\d+)"[^>]*>([\s\S]*?)<\/page>/g)) {
    const body = m[2];
    const images = [...body.matchAll(/<image top="(\d+)"[^>]*? src="([^"]+)"/g)].map((x) => ({
      top: +x[1],
      src: path.basename(x[2]),
    }));
    const parts = [...body.matchAll(/<text top="(\d+)"[^>]*>([^<]*)<\/text>/g)]
      .map((x) => ({ top: +x[1], text: x[2].trim() }))
      .filter((x) => /^[A-Z]{2}\d{6,9}$/.test(x.text))
      .map((x) => ({ top: x.top, pn: x.text }));
    doc.set(+m[1], { images, parts });
  }

  const images = {};
  const problems = [];
  let bytes = 0;
  for (const page of pages) {
    const rows = byPage.get(page);
    const d = doc.get(page);
    if (!d || d.images.length !== rows.length) {
      problems.push(`${page}: ${rows.length} rows / ${d ? d.images.length : 0} drawings`);
      continue;
    }
    // Each drawing owns the part numbers printed between the previous drawing and itself.
    const imgs = [...d.images].sort((a, b) => a.top - b.top);
    const clusters = imgs.map((img, i) => {
      const lo = i ? imgs[i - 1].top : -Infinity;
      return new Set(d.parts.filter((p) => p.top > lo && p.top < img.top).map((p) => p.pn));
    });
    // Pair by part-number overlap; ties and rows without part numbers fall back to the
    // catalog's own order (source.line is top-to-bottom within a page).
    const used = new Set();
    const pick = new Map();
    const ordered = [...rows].sort((a, b) => a.source.line - b.source.line);
    for (const row of ordered) {
      let best = -1;
      let bestScore = 0;
      clusters.forEach((c, i) => {
        if (used.has(i)) return;
        const s = row.partNos.filter((p) => c.has(p)).length;
        if (s > bestScore) {
          bestScore = s;
          best = i;
        }
      });
      if (best >= 0) {
        used.add(best);
        pick.set(row, best);
      }
    }
    const free = clusters.map((_, i) => i).filter((i) => !used.has(i));
    for (const row of ordered) {
      if (pick.has(row)) continue;
      const i = free.shift();
      if (i === undefined) {
        problems.push(`${page}: no drawing left for a row`);
        continue;
      }
      pick.set(row, i);
      problems.push(`${page}: row paired by order only`);
    }
    for (const [row, i] of pick) {
      const src = path.join(tmp, imgs[i].src);
      const out = path.join(tmp, `o-${imgs[i].src}`);
      try {
        execFileSync(
          'convert',
          [
            src,
            '-strip',
            '-colorspace',
            'Gray',
            '-colors',
            '16',
            '-define',
            'png:compression-level=9',
            `PNG8:${out}`,
          ],
          { stdio: ['ignore', 'ignore', 'pipe'] },
        );
      } catch (e) {
        throw new Error(
          `convert failed on page ${page}: ${String(e.stderr || e.message).slice(0, 200)}`,
        );
      }
      const buf = fs.readFileSync(out);
      bytes += buf.length;
      images[row.id] = buf.toString('base64');
    }
  }

  const count = Object.keys(images).length;
  console.log(`rows ${items.length}, drawings paired ${count}, raw ${(bytes / 1e6).toFixed(2)} MB`);
  if (problems.length) {
    console.error('Problems:\n  ' + problems.join('\n  '));
  }
  if (count !== items.length || problems.length) process.exitCode = 1;
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, JSON.stringify({ schema: 1, count, images }));
  console.log(`wrote ${outAbs} (${(fs.statSync(outAbs).size / 1e6).toFixed(2)} MB)`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
