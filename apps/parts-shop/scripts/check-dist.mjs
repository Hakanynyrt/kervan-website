// Last build step: fails the build if a page could leak, or is indexed (or hidden) by mistake.
// - every HTML page has the embedded page props;
// - only the cart (/palet) and 404 pages carry meta robots noindex, and they must; every other
//   page is indexable, has a self canonical on SITE and is listed in the sitemap, and its
//   JSON-LD parses;
// - no file in dist/ contains a forbidden string (third-party catalogue names, VEGA part
//   numbers, private D1 columns); genuine OEM numbers are allowed, only through the
//   "Muadil OEM no." field (src/lib/oem-numbers.ts, owner's decision);
// - at most MAX_FILES files (Pages limit).
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'dist');
const FORBIDDEN = [
  /\bvega\b/i,
  /\bVT\d{7}\b/,
  /private_ref/,
  /private_notes/,
  /cost_try/,
  // D1 column / table names of the part prices: only resolved per-page prices may ship.
  /price_usd_net_cents/,
  /part_prices/,
  /part_type/,
];

const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(html|js|css|json|txt|xml)$/.test(e.name)) files.push(p);
  }
};
walk(DIST);

// Cloudflare Pages takes at most 20,000 files per deployment; fail here, with the count, rather
// than at the deploy step. The margin leaves room for the tip renders still to come.
const MAX_FILES = 19000;
let total = 0;
const count = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true }))
    if (e.isDirectory()) count(path.join(d, e.name));
    else total++;
};
count(DIST);

const SITE = 'https://kiriciparca.com';
// Pages kept out of search results (src/lib/page-head.ts NOINDEX_KINDS): cart and 404.
const NOINDEX_PAGES = /^(en\/)?(404|palet)\.html$/;
// Every <loc> of the sitemap (sitemap.xml, or its children when it is an index).
const sitemapLocs = new Set();
for (const f of files)
  if (/^sitemap(-\d+)?\.xml$/.test(path.basename(f)) && path.dirname(f) === DIST)
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g))
      sitemapLocs.add(m[1]);
const urlOf = (rel) => {
  const p = rel.replace(/\\/g, '/').replace(/\.html$/, '');
  return p === 'index' ? `${SITE}/` : p === 'en/index' ? `${SITE}/en/` : `${SITE}/${p}`;
};

const problems = [];
let pages = 0;
let indexable = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const rel = path.relative(DIST, f);
  for (const re of FORBIDDEN) if (re.test(s)) problems.push(`${rel}: forbidden ${re}`);
  if (f.endsWith('.html')) {
    pages++;
    if (!s.includes('id="kv-page"')) problems.push(`${rel}: no page props`);
    for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        JSON.parse(m[1]);
      } catch {
        problems.push(`${rel}: JSON-LD does not parse`);
      }
    }
    const noindex = /<meta name="robots" content="[^"]*noindex/.test(s);
    if (NOINDEX_PAGES.test(rel.replace(/\\/g, '/'))) {
      if (!noindex) problems.push(`${rel}: should be noindex`);
      continue;
    }
    indexable++;
    if (noindex) problems.push(`${rel}: indexable page has noindex`);
    const url = urlOf(rel);
    if (!s.includes(`<link rel="canonical" href="${url}" />`))
      problems.push(`${rel}: no self canonical ${url}`);
    if (!sitemapLocs.has(url)) problems.push(`${rel}: not in the sitemap`);
  }
}
if (sitemapLocs.size !== indexable)
  problems.push(`sitemap: ${sitemapLocs.size} URLs for ${indexable} indexable pages`);
// With the R2 base set (CI on main) the part photos must be out of dist except the opening
// frames, and no page may still point at one of them on this host.
if (process.env.VITE_TIP_IMG_BASE) {
  const pdir = path.join(DIST, 'photos', 'parca');
  const left = fs.existsSync(pdir) ? fs.readdirSync(pdir) : [];
  const stray = left.filter((f) => !f.startsWith('acilis-'));
  if (stray.length) problems.push(`dist: ${stray.length} part photos still in dist/photos/parca (R2 build)`);
  if (left.length - stray.length < 86) problems.push('dist: opening frames (acilis-*) missing');
  const local = /(?:src|srcset|content)="(?:[^"]*[\s,])?\/photos\/parca\/(?!acilis-)/i;
  const bad = files.filter((f) => f.endsWith('.html') && local.test(fs.readFileSync(f, 'utf8')));
  if (bad.length) problems.push(`${bad.length} pages still reference /photos/parca on this host (R2 build)`);
}
if (total > MAX_FILES) problems.push(`dist: ${total} files, more than ${MAX_FILES} (Pages limit 20,000)`);
if (problems.length) {
  process.stderr.write(`check-dist: ${problems.length} problem(s)\n${problems.slice(0, 20).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(
  `check-dist: ${pages} pages ok (${indexable} indexable, all in the sitemap), ${total} files\n`,
);
