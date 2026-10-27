// Last build step: fails the build if a page could leak, or is indexed (or hidden) by mistake.
// - every HTML page has the embedded page props;
// - only the cart (/palet), the /urun/<code> tip pages and 404 pages carry meta robots noindex,
//   and they must; every other page is indexable, has a self canonical on SITE, is listed in the
//   sitemap, is reachable from the home page through plain <a href> links to its clean URL (no
//   query) on indexable prerendered pages (so crawlers find it without the sitemap; part item
//   pages only warn, see PART_ITEM), and its JSON-LD parses;
// - no file in dist/ contains a forbidden string (third-party catalogue names, VEGA part
//   numbers, private D1 columns); genuine OEM numbers are allowed, only through the
//   "Muadil OEM no." field (src/lib/oem-numbers.ts, owner's decision);
// - robots.txt names the sitemap index, which lists only shipped children; <lastmod> dates are
//   valid, not in the future and not one date for every URL;
// - every og:image in /og/ on this host is in dist;
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
  /drawing_overrides/,
  // Which breakers share a tip is ours alone: page data carries families with `fits: []`.
  /"fits":\[\{/,
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
// than at the deploy step. The margin leaves room for the tip renders still to come. PR previews
// (no R2 base) keep every part photo in dist, about 7,300 files more than main, so they may come
// closer to the hard limit; main must keep the wide margin.
const MAX_FILES = process.env.VITE_TIP_IMG_BASE ? 19000 : 19900;
let total = 0;
const count = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true }))
    if (e.isDirectory()) count(path.join(d, e.name));
    else total++;
};
count(DIST);

const SITE = 'https://kiriciparca.com';
// Pages kept out of search results (src/lib/page-head.ts NOINDEX_KINDS): cart, /urun/ and 404.
const NOINDEX_PAGES = /^(en\/)?(404|palet|urun\/[^/]+)\.html$/;
// The sitemaps (src/entry-server.tsx sitemapFiles): robots.txt names the index, sitemap.xml is
// the same index, every child it lists ships, and every <url> of the children is collected. A
// <lastmod> must be a YYYY-MM-DD date no later than today, and not one shared by every dated URL
// (that is a build time, not a page date).
const problems = [];
const SITEMAP_INDEX = 'sitemap-index.xml';
const sitemapLocs = new Set();
const lastmods = [];
{
  const read = (f) =>
    fs.existsSync(path.join(DIST, f)) ? fs.readFileSync(path.join(DIST, f), 'utf8') : null;
  const robots = read('robots.txt') ?? '';
  if (!robots.includes(`Sitemap: ${SITE}/${SITEMAP_INDEX}`))
    problems.push(`robots.txt: no Sitemap line for ${SITEMAP_INDEX}`);
  const index = read(SITEMAP_INDEX);
  if (!index || !index.includes('<sitemapindex')) problems.push(`${SITEMAP_INDEX}: missing`);
  else if (read('sitemap.xml') !== index) problems.push('sitemap.xml: not the same index');
  const today = new Date().toISOString().slice(0, 10);
  const checkDate = (where, d) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > today) problems.push(`${where}: bad lastmod ${d}`);
  };
  for (const m of (index ?? '').matchAll(
    /<sitemap>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g,
  )) {
    const child = m[1].startsWith(`${SITE}/`) ? m[1].slice(SITE.length + 1) : null;
    if (m[2]) checkDate(m[1], m[2]);
    const xml = child && !child.includes('/') ? read(child) : null;
    if (!xml) {
      problems.push(`${SITEMAP_INDEX}: child ${m[1]} not in dist`);
      continue;
    }
    for (const u of xml.matchAll(
      /<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g,
    )) {
      if (sitemapLocs.has(u[1])) problems.push(`sitemap: ${u[1]} listed twice`);
      sitemapLocs.add(u[1]);
      if (u[2]) {
        checkDate(u[1], u[2]);
        lastmods.push(u[2]);
      }
    }
  }
  if (lastmods.length > 50 && new Set(lastmods).size === 1)
    problems.push(`sitemap: all ${lastmods.length} lastmod dates are the same (a build date?)`);
}
const urlOf = (rel) => {
  const p = rel.replace(/\\/g, '/').replace(/\.html$/, '');
  return p === 'index' ? `${SITE}/` : p === 'en/index' ? `${SITE}/en/` : `${SITE}/${p}`;
};

// Internal links of the indexable pages: every href to this site as the page URL it names. Only
// clean URLs count (fragment dropped): a `?uc=` / `?tip=` link reaches a parameter URL, not the
// canonical page, and Google treats long-term noindex pages (cart, /urun/, 404) as nofollow, so
// their links are left out of the graph.
const linksOf = new Map();
const pageUrlOfHref = (href) => {
  let h = href.replace(/&amp;/g, '&');
  if (h.startsWith(SITE)) h = h.slice(SITE.length) || '/';
  if (!h.startsWith('/') || h.startsWith('//')) return null;
  h = h.replace(/#.*$/, '');
  if (h.includes('?')) return null;
  if (h === '' || h === '/') return `${SITE}/`;
  if (h === '/en' || h === '/en/') return `${SITE}/en/`;
  return `${SITE}${h.replace(/\/$/, '')}`;
};

let pages = 0;
let indexable = 0;
const indexableUrls = [];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const rel = path.relative(DIST, f);
  for (const re of FORBIDDEN) if (re.test(s)) problems.push(`${rel}: forbidden ${re}`);
  if (f.endsWith('.html')) {
    pages++;
    const out = new Set();
    for (const m of s.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) {
      const u = pageUrlOfHref(m[1]);
      if (u) out.add(u);
    }
    if (!s.includes('id="kv-page"')) problems.push(`${rel}: no page props`);
    for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        JSON.parse(m[1]);
      } catch {
        problems.push(`${rel}: JSON-LD does not parse`);
      }
    }
    // A link-preview picture of our own /og/ folder must ship (public/og/, named in page-head.ts).
    for (const m of s.matchAll(/<meta property="og:image" content="([^"]+)"/g))
      if (
        m[1].startsWith(`${SITE}/og/`) &&
        !fs.existsSync(path.join(DIST, m[1].slice(SITE.length)))
      )
        problems.push(`${rel}: og:image ${m[1]} not in dist`);
    const noindex = /<meta name="robots" content="[^"]*noindex/.test(s);
    if (NOINDEX_PAGES.test(rel.replace(/\\/g, '/'))) {
      if (!noindex) problems.push(`${rel}: should be noindex`);
      continue;
    }
    indexable++;
    if (noindex) problems.push(`${rel}: indexable page has noindex`);
    const url = urlOf(rel);
    indexableUrls.push(url);
    linksOf.set(url, out);
    if (!s.includes(`<link rel="canonical" href="${url}" />`))
      problems.push(`${rel}: no self canonical ${url}`);
    if (!sitemapLocs.has(url)) problems.push(`${rel}: not in the sitemap`);
  }
}
// An indexable page only the sitemap knows ranks poorly: each must be reachable from the home
// page (either language) by following plain links of indexable pages to its exact clean URL.
const reached = new Set([`${SITE}/`, `${SITE}/en/`]);
const queue = [...reached];
while (queue.length)
  for (const u of linksOf.get(queue.pop()) ?? [])
    if (!reached.has(u)) {
      reached.add(u);
      queue.push(u);
    }
// Part item pages (/yedek-parca/<group>/<item>) are linked from their breaker's page where we
// have one; the rest are reached only through the group page's search and the sitemap, since the
// owner decided against make/model lists on the site. They are counted as a warning until the
// owner decides otherwise; any other unreachable page fails the build.
const PART_ITEM = new RegExp(`^${SITE}/(en/)?yedek-parca/[^/]+/[^/]+$`);
const orphans = indexableUrls.filter((u) => !reached.has(u));
const itemOrphans = orphans.filter((u) => PART_ITEM.test(u));
const otherOrphans = orphans.filter((u) => !PART_ITEM.test(u));
if (otherOrphans.length)
  problems.push(
    `links: ${otherOrphans.length} indexable pages not reachable by links from home, e.g. ${otherOrphans.slice(0, 5).join(' ')}`,
  );
if (itemOrphans.length)
  process.stdout.write(
    `check-dist: warning: ${itemOrphans.length} part item pages are reached only through search and the sitemap\n`,
  );
if (sitemapLocs.size !== indexable)
  problems.push(`sitemap: ${sitemapLocs.size} URLs for ${indexable} indexable pages`);
// With the R2 base set (CI on main) the part photos must be out of dist except the opening
// frames, and no page may still point at one of them on this host.
if (process.env.VITE_TIP_IMG_BASE) {
  const pdir = path.join(DIST, 'photos', 'parca');
  const left = fs.existsSync(pdir) ? fs.readdirSync(pdir) : [];
  const stray = left.filter((f) => !f.startsWith('acilis-'));
  if (stray.length)
    problems.push(`dist: ${stray.length} part photos still in dist/photos/parca (R2 build)`);
  // 84 frames in two sizes (-lg 2864 px, -md 1280 px for small screens) + the final picture (-sm, -lg).
  if (left.length - stray.length < 170) problems.push('dist: opening frames (acilis-*) missing');
  const local = /(?:src|srcset|content)="(?:[^"]*[\s,])?\/photos\/parca\/(?!acilis-)/i;
  const bad = files.filter((f) => f.endsWith('.html') && local.test(fs.readFileSync(f, 'utf8')));
  if (bad.length)
    problems.push(`${bad.length} pages still reference /photos/parca on this host (R2 build)`);
}
if (total > MAX_FILES)
  problems.push(`dist: ${total} files, more than ${MAX_FILES} (Pages limit 20,000)`);
if (problems.length) {
  process.stderr.write(
    `check-dist: ${problems.length} problem(s)\n${problems.slice(0, 20).join('\n')}\n`,
  );
  process.exit(1);
}
process.stdout.write(
  `check-dist: ${pages} pages ok (${indexable} indexable, all in the sitemaps, ${lastmods.length} with lastmod; reachable by links except the part items warned about), ${total} files\n`,
);
