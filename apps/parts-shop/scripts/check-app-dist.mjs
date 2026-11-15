// Checks the iPhone app's web bundle (dist-app/, scripts/build-app.mjs; docs/agent/app.md) before
// it can go anywhere. Fails when a file in it
// - carries a price-looking field with a value (JSON or JS): prices reach the app one page at a
//   time from the site, never in the bundle;
// - carries a value read from the catalogue snapshot (.catalog/catalog.json: tip and SKU codes
//   that are not written in the source code itself), or a DEMO catalogue marker;
// - carries the Google Ads / OpenAI ids or hosts of src/lib/ads.ts, or the Cloudflare beacon
//   (the app has no ads and no analytics);
// - carries private strings (the same list as check-dist.mjs);
// - names an absolute URL whose host is not the site origin or img.kiriciparca.com, apart from
//   the short lists below (links handed to iOS, and names in library code that are never
//   requested); a new host must be added here on purpose, with its reason;
// - is a site file (prerendered pages, _headers, tips/, photos/ …), or the bundle passes its size
//   or file budget.
// Prints counts only (the CI log is public); a problem names the file and the rule, never the
// matched text, except an unknown host's name.
//
//   node scripts/check-app-dist.mjs        (VITE_SITE_ORIGIN as given to build-app.mjs)
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { URL, fileURLToPath, pathToFileURL } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(APP, '..', '..');
const OUT = path.join(APP, 'dist-app');

/**
 * Budget: the M1 bundle measured 2026-11-15 at about 2.3 MB in 10 files (the shop's pages, the
 * 3D viewer chunk, CSS, the two Inter fonts) plus headroom for the app shell. A real increase
 * (the bundled guide videos of M4) raises it here, in the same PR; photos or a catalogue never.
 */
export const MAX_BYTES = 3.5 * 1024 * 1024;
export const MAX_FILES = 25;

/** Hosts the app may load from or link to besides the site origin. */
export const OWN_HOSTS = ['kiriciparca.com', 'img.kiriciparca.com'];
/** Links the shop's pages carry and the app hands to iOS (never loaded inside the app). */
export const LINK_HOSTS = [
  'wa.me', // order and question links (WhatsApp)
  'www.youtube.com', // "Watch on YouTube" under a guide video
];
/**
 * Names in library code that are never requested (XML namespace, licence and error links;
 * capacitorjs.com: the licence banner of @capacitor/core, in the iPhone build's plugin chunks).
 */
export const NAME_HOSTS = [
  'www.w3.org',
  'react.dev',
  'jcgt.org',
  'tailwindcss.com',
  'capacitorjs.com',
];

/** Reserved names that never resolve (RFC 6761), e.g. the router's URL-parsing base. */
const RESERVED = /\.invalid$/;

/** Analytics and ad hosts that must never be in the app, whatever ads.ts says today. */
export const TRACKER = [
  /cloudflareinsights/i,
  /\bcf-beacon\b/i,
  /beacon\.min\.js/i,
  /googletagmanager\.com/i,
  /google-analytics\.com/i,
  /doubleclick\.net/i,
  /connect\.facebook\.net/i,
  /bzrcdn\.openai\.com/i,
  /\bgtag\s*\(\s*["']config/,
];

/** Same private strings as check-dist.mjs FORBIDDEN. */
export const PRIVATE = [
  /\bvega\b/i,
  /\bVT\d{7}\b/,
  /private_ref/,
  /private_notes/,
  /cost_try/,
  /price_usd_net_cents/,
  /part_prices/,
  /part_type/,
  /drawing_overrides/,
  /"fits":\[\{/,
];

const PRICE_JSON = /"(?:cents|price|priceFitted|prices|priceUsdNetCents)":\s*[[{\d]/;
const PRICE_JS = /\b(?:cents|price|priceFitted|prices|priceUsdNetCents)["']?\s*:\s*\[?\s*\d/;
const DEMO = [/\bXX\d{2,3}-\d{2}\b/, /\bdemo["']?\s*:\s*(?:true|!0)(?![\w.])/, /(["'`])DEMO\1/];
/** Files of the site that must not be in the app (the app reads pages from the site). */
const SITE_FILE =
  /^(?:tips|photos|videos|models|og)\/|^_headers$|^_redirects$|^_routes\.json$|^robots\.txt$|^llms\.txt$|^sitemap|^(?!index\.html$).*\.html$/;
const TEXT = /\.(?:js|mjs|css|html|json|webmanifest|txt|svg|xml)$/;

/** The ad ids of src/lib/ads.ts (public on the site, never in the app); [] when not found. */
export function adIds(adsSource) {
  const ids = new Set(adsSource.match(/\bAW-\d{6,}(?:\/[A-Za-z0-9_-]+)?/g) ?? []);
  for (const m of adsSource.matchAll(/PIXEL_ID\s*=\s*['"]([^'"]{8,})['"]/g)) ids.add(m[1]);
  for (const m of adsSource.matchAll(/https:\/\/([a-z0-9.-]+)/gi)) ids.add(m[1]);
  return [...ids];
}

/**
 * Tip and SKU codes of the catalogue snapshot that the source code does not spell out itself
 * (a code written in guides.ts is public code, not catalogue data).
 */
export function catalogValues(catalog, sourceText) {
  const out = new Set();
  for (const f of catalog?.families ?? []) {
    if (typeof f.code === 'string') out.add(f.code);
    for (const s of f.skus ?? []) if (typeof s.code === 'string') out.add(s.code);
  }
  return [...out].filter((c) => c.length >= 5 && !sourceText.includes(c));
}

/** Hosts of the absolute http(s)/ws(s) URLs in a text. */
export function hostsIn(text) {
  const hosts = new Set();
  for (const m of text.matchAll(/\b(?:https?|wss?):\/\/([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi))
    hosts.add(m[1].toLowerCase());
  return hosts;
}

/** Problems of one file: [{ rule, host? }]. ctx: { ads, catalog, allowed: Set<string> }. */
export function scanFile(rel, text, ctx) {
  const problems = [];
  const json = rel.endsWith('.json') || rel.endsWith('.webmanifest');
  if (json ? PRICE_JSON.test(text) : PRICE_JS.test(text))
    problems.push({ rule: 'price-looking field with a value' });
  if (ctx.catalog.some((c) => text.includes(c)))
    problems.push({ rule: 'value from the catalogue snapshot' });
  if (DEMO.some((re) => re.test(text))) problems.push({ rule: 'DEMO catalogue marker' });
  if (ctx.ads.some((id) => text.includes(id))) problems.push({ rule: 'ads id from ads.ts' });
  if (TRACKER.some((re) => re.test(text))) problems.push({ rule: 'analytics / ads host' });
  if (PRIVATE.some((re) => re.test(text))) problems.push({ rule: 'private string' });
  for (const h of hostsIn(text))
    if (!ctx.allowed.has(h) && !RESERVED.test(h))
      problems.push({ rule: 'absolute URL to another host', host: h });
  return problems;
}

/** The hosts a bundle built for this origin may name. */
export function allowedHosts(origin) {
  const own = new URL(origin).hostname;
  return new Set([own, ...OWN_HOSTS, ...LINK_HOSTS, ...NAME_HOSTS]);
}

function sourceText() {
  const parts = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'node_modules') walk(p);
      } else if (/\.(?:ts|tsx)$/.test(e.name)) parts.push(fs.readFileSync(p, 'utf8'));
    }
  };
  walk(path.join(APP, 'src'));
  for (const pkg of fs.readdirSync(path.join(REPO, 'packages'))) {
    const src = path.join(REPO, 'packages', pkg, 'src');
    if (fs.existsSync(src)) walk(src);
  }
  return parts.join('\n');
}

function main() {
  const origin = process.env.VITE_SITE_ORIGIN || 'https://kiriciparca.com';
  const problems = [];
  if (!fs.existsSync(path.join(OUT, 'index.html'))) {
    process.stderr.write('check-app-dist: no dist-app/index.html (run build:app first)\n');
    process.exit(1);
  }
  const ads = adIds(fs.readFileSync(path.join(APP, 'src', 'lib', 'ads.ts'), 'utf8'));
  if (!ads.some((id) => id.startsWith('AW-')))
    problems.push('src/lib/ads.ts: no Google Ads id found');
  const snapshot = path.join(APP, '.catalog', 'catalog.json');
  const catalog = fs.existsSync(snapshot)
    ? catalogValues(JSON.parse(fs.readFileSync(snapshot, 'utf8')), sourceText())
    : [];
  const ctx = { ads, catalog, allowed: allowedHosts(origin) };

  let files = 0;
  let bytes = 0;
  let scanned = 0;
  const hosts = new Set();
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        walk(p);
        continue;
      }
      const rel = path.relative(OUT, p).replace(/\\/g, '/');
      files++;
      bytes += fs.statSync(p).size;
      if (SITE_FILE.test(rel)) problems.push(`${rel}: site file in the app`);
      if (!TEXT.test(rel)) continue;
      scanned++;
      const text = fs.readFileSync(p, 'utf8');
      for (const h of hostsIn(text)) hosts.add(h);
      for (const pr of scanFile(rel, text, ctx))
        problems.push(`${rel}: ${pr.rule}${pr.host ? ` (${pr.host})` : ''}`);
    }
  };
  walk(OUT);
  if (bytes > MAX_BYTES)
    problems.push(`dist-app: ${Math.round(bytes / 1024)} KB, budget ${MAX_BYTES / 1024} KB`);
  if (files > MAX_FILES) problems.push(`dist-app: ${files} files, budget ${MAX_FILES}`);

  if (problems.length) {
    process.stderr.write(
      `check-app-dist: ${problems.length} problem(s)\n${problems.slice(0, 30).join('\n')}\n`,
    );
    process.exit(1);
  }
  process.stdout.write(
    `check-app-dist: ok: ${files} files, ${Math.round(bytes / 1024)} KB of ${MAX_BYTES / 1024} KB, ` +
      `${scanned} text files scanned, ${hosts.size} hosts named (all allowed), ` +
      `${catalog.length} catalogue codes ${fs.existsSync(snapshot) ? 'checked' : 'skipped (no snapshot)'}\n`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
