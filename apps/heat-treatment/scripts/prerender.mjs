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

// Intro curtain (first page of a visit, animated visitors only): pure CSS in the static HTML, so it
// starts with the first paint instead of waiting for the script, and the page under it is already
// painted (2026-10-28, Lighthouse: the page used to stay hidden until the script had loaded and
// rendered, up to 3 s on phones). The head script adds `kv-intro` and marks the visit, so later
// pages show at once. The look and timing are the former IntroOverlay's: two halves part after
// 0.4 s, a brand hairline in the middle, the name fades in and out, gone after 2.8 s.
const INTRO_SCRIPT = `(function(){try{var h=document.documentElement;if(h.classList.contains('${ssr.JS_ANIM_CLASS}')&&sessionStorage.getItem('${ssr.INTRO_SESSION_KEY}')!=='1'){h.classList.add('kv-intro');sessionStorage.setItem('${ssr.INTRO_SESSION_KEY}','1')}}catch(e){}})();`;
const EASE = 'cubic-bezier(.7,0,.3,1)';
const CURTAIN_CSS = [
  '.kv-curtain{display:none}',
  'html.kv-intro{overflow:hidden;animation:kv-unlock 0s 2.4s forwards}',
  '@keyframes kv-unlock{to{overflow:visible}}',
  'html.kv-intro .kv-curtain{display:block;position:fixed;inset:0;z-index:100;pointer-events:none;animation:kv-cur-out .4s linear 2.4s forwards}',
  '@keyframes kv-cur-out{to{opacity:0;visibility:hidden}}',
  `.kv-curtain-l,.kv-curtain-r{position:absolute;top:0;height:100%;width:50%;background:var(--color-bg);animation:kv-cur-l 1.2s ${EASE} .4s forwards}`,
  '.kv-curtain-l{left:0}.kv-curtain-r{right:0;animation-name:kv-cur-r}',
  '@keyframes kv-cur-l{to{transform:translateX(-100%)}}@keyframes kv-cur-r{to{transform:translateX(100%)}}',
  `.kv-curtain-slit{position:absolute;top:0;bottom:0;left:50%;width:1px;background:var(--color-brand);opacity:0;transform:translateX(-50%) scaleY(0);animation:kv-cur-slit 1.6s ${EASE} forwards}`,
  '@keyframes kv-cur-slit{18%{transform:translateX(-50%) scaleY(1);opacity:1}50%{transform:translateX(-50%) scaleY(1);opacity:.8}to{transform:translateX(-50%) scaleY(.4);opacity:0}}',
  '.kv-curtain-name{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;margin:0;font-family:var(--font-serif);font-style:italic;font-size:clamp(40px,8vw,96px);line-height:1;letter-spacing:-.025em;color:var(--color-ink);opacity:0;animation:kv-cur-name 2.4s linear forwards}',
  '@keyframes kv-cur-name{45%{opacity:0}60%{opacity:1}85%{opacity:1}to{opacity:0}}',
].join('');
const CURTAIN_HTML =
  '<div class="kv-curtain" aria-hidden="true"><div class="kv-curtain-l"></div><div class="kv-curtain-r"></div><div class="kv-curtain-slit"></div><div class="kv-curtain-name">Kervan Heat</div></div>';
const headPrepend = `<script>${ssr.JS_ANIM_INLINE_SCRIPT}${INTRO_SCRIPT}</script><style>${CURTAIN_CSS}</style>`;

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
  if (!html.includes('<div id="root"'))
    throw new Error('prerender: no root to put the curtain before');
  write(
    lang === 'en' ? 'en/index.html' : 'index.html',
    html.replace('<div id="root"', `${CURTAIN_HTML}<div id="root"`),
  );
}

// 2. 404 pages: static, noindex, no client script (nothing to hydrate). Pages serves the
//    nearest 404.html, so unknown /en/… paths get the English-first one (lang="en").
const notFoundTemplate = template
  .replace(/\s*<script type="module"[^>]*><\/script>/gi, '')
  .replace(/\s*<link rel="modulepreload"[^>]*>/gi, '');
for (const lang of ['tr', 'en']) {
  write(
    lang === 'en' ? 'en/404.html' : '404.html',
    ssr.injectHead(notFoundTemplate, {
      lang,
      headTags: ssr.buildHeadTags(ssr.notFoundHead(lang)),
      appHtml: ssr.renderNotFound(lang),
    }),
  );
}

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
