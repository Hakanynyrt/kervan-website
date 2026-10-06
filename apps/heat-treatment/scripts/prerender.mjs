/* global console */
// Prerenders kervanheat.com after `vite build` + `vite build --ssr`:
//   dist/index.html (tr), dist/en/index.html (en), dist/404.html, dist/sitemap.xml
// Each page is full text in STATIC motion mode; the inline js-anim script
// lets animated visitors re-render it client-side (see src/main.tsx).
// Never calls /api/* and never reads secrets. Deletes dist-ssr/ when done.
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(appDir, 'dist');
const ssrDir = path.join(appDir, 'dist-ssr');
process.on('exit', () => fs.rmSync(ssrDir, { recursive: true, force: true }));

const ssr = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);
const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

const headPrepend = `<script>${ssr.JS_ANIM_INLINE_SCRIPT}</script><style>${ssr.JS_ANIM_ROOT_CSS}</style>`;

function write(rel, html) {
  const file = path.join(distDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log(`prerender: ${rel} (${Math.round(html.length / 1024)} KB)`);
}

/** Last commit date (YYYY-MM-DD) of the files that make up the page. */
function lastmod(paths) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...paths], {
      cwd: appDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
  } catch {
    /* git unavailable — fall back to the build date */
  }
  return new Date().toISOString().slice(0, 10);
}

// 1. Home page in both languages.
for (const lang of ['tr', 'en']) {
  const html = ssr.injectHead(template, {
    lang,
    headTags: ssr.buildHeadTags(ssr.homeHead(lang)),
    appHtml: ssr.renderPage(lang),
    headPrepend,
    rootAttrs: `${ssr.PRERENDERED_ATTR}=""`,
  });
  write(lang === 'en' ? 'en/index.html' : 'index.html', html);
}

// 2. 404 page: static, noindex, no client script (nothing to hydrate).
const notFoundTemplate = template
  .replace(/\s*<script type="module"[^>]*><\/script>/gi, '')
  .replace(/\s*<link rel="modulepreload"[^>]*>/gi, '');
write(
  '404.html',
  ssr.injectHead(notFoundTemplate, {
    lang: 'tr',
    headTags: ssr.buildHeadTags(ssr.notFoundHead()),
    appHtml: ssr.renderNotFound(),
  }),
);

// 3. sitemap.xml: canonical, indexable pages only, with hreflang alternates.
const mod = lastmod(['src', 'index.html']);
write(
  'sitemap.xml',
  ssr.buildSitemapXml([
    ...['tr', 'en'].map((lang) => ({
      loc: ssr.pageUrl(lang),
      lastmod: mod,
      alternates: ssr.ALTERNATES,
    })),
    // KVKK notice: Turkish only (no alternates); Pages serves it at /kvkk.
    { loc: `${ssr.pageUrl('tr')}kvkk`, lastmod: lastmod(['public/kvkk.html']) },
  ]),
);

// 4. The SSR bundle is a build intermediate only.
fs.rmSync(ssrDir, { recursive: true, force: true });
