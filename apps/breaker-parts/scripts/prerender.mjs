// Build step 3/3 (after `vite build` and `vite build --ssr src/entry-server.tsx`):
// writes one full-text HTML file per route and language into dist/, the 404 pages
// and sitemap.xml, then deletes dist-ssr/.
//
// Static mode only: no browser, no network. Never calls /api/tech/* and never
// reads TECH_CONTENT (the tech page is prerendered as its signed-out shell).
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(APP, 'dist');
const SSR = path.join(APP, 'dist-ssr');

const log = (s) => process.stdout.write(`${s}\n`);

// React's production build: same markup, no dev-only warnings.
process.env.NODE_ENV ??= 'production';

try {
  const ssr = await import(pathToFileURL(path.join(SSR, 'entry-server.js')).href);
  const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const headPrepend = `<script>${ssr.JS_ANIM_INLINE_SCRIPT}</script>\n    <style>${ssr.JS_ANIM_ROOT_CSS}</style>`;

  let count = 0;
  for (const page of ssr.pages()) {
    const html = ssr.injectHead(template, {
      lang: page.lang,
      headTags: ssr.headTags(page.url),
      appHtml: ssr.render(page.url),
      headPrepend,
      rootAttrs: `${ssr.PRERENDERED_ATTR}=""`,
    });
    const out = path.join(DIST, page.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
    count++;
  }
  log(`prerender: ${count} pages written`);

  // <lastmod> = date of the last commit touching the files that make up the page.
  const buildDate = new Date().toISOString().slice(0, 10);
  const lastmod = (sources) => {
    try {
      const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...sources], {
        cwd: APP,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : buildDate;
    } catch {
      return buildDate;
    }
  };

  const entries = [];
  for (const p of ssr.sitemapPages()) {
    const mod = lastmod(p.sources);
    for (const loc of [p.urls.tr, p.urls.en]) {
      entries.push({ loc, lastmod: mod, alternates: p.alternates });
    }
  }
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), ssr.buildSitemapXml(entries));
  log(`prerender: sitemap.xml with ${entries.length} URLs`);
} finally {
  // Never leave the server bundle behind (ESLint would pick it up).
  fs.rmSync(SSR, { recursive: true, force: true });
}
