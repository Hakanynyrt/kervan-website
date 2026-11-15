// Builds the iPhone app's web bundle (docs/agent/app.md): a second Vite build of this shop
// (vite.app.config.ts, entry app.html → src/app/main.tsx) into dist-app/ (gitignored; M2 copies
// it into the native project). The site build (`build`, dist/) is not touched.
//
//   node scripts/build-app.mjs              → pages are fetched from https://kiriciparca.com
//   VITE_SITE_ORIGIN=http://127.0.0.1:4173 node scripts/build-app.mjs   (local stand-in site, e2e)
//
// - VITE_APP=1 switches the shop's seams (src/lib/page-source.ts, asset-base.ts, nav.ts) to the
//   app values; VITE_TIP_IMG_BASE passes through unchanged.
// - The app carries no catalogue: it reads every page from the site at run time. Nothing from
//   .catalog/, public/ (except the two Inter font files) or the environment is copied in.
// - Prints counts only (the CI log is public). scripts/check-app-dist.mjs checks the result.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { URL, fileURLToPath, pathToFileURL } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, 'dist-app');
const CONFIG = 'vite.app.config.ts';
const DEFAULT_ORIGIN = 'https://kiriciparca.com';
/** The only files of public/ the app bundles: the fonts globals.css names as url('/fonts/…'). */
const FONTS = ['inter-latin-v20.woff2', 'inter-latin-ext-a-v20.woff2'];
const log = (s) => process.stdout.write(`build-app: ${s}\n`);
const fail = (s) => {
  process.stderr.write(`build-app: FAILED (${s})\n`);
  process.exit(1);
};

/** An http(s) origin without path, query or trailing slash; plain http only for this machine. */
export function siteOrigin(v) {
  if (!v) return DEFAULT_ORIGIN;
  let u;
  try {
    u = new URL(v);
  } catch {
    return null;
  }
  const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && local)) return null;
  if ((u.pathname !== '/' && u.pathname !== '') || u.search || u.hash || u.username) return null;
  return u.origin;
}

function main() {
  const origin = siteOrigin(process.env.VITE_SITE_ORIGIN);
  if (!origin) fail('VITE_SITE_ORIGIN must be an https origin, or http on localhost');
  if (!fs.existsSync(path.join(APP, CONFIG))) fail(`${CONFIG} not found`);

  fs.rmSync(OUT, { recursive: true, force: true });
  const vite = path.join(
    path.dirname(createRequire(import.meta.url).resolve('vite/package.json')),
    'bin',
    'vite.js',
  );
  // Only the app flags are set here; VITE_TIP_IMG_BASE and the rest of the environment pass
  // through. logLevel warn: Vite's file table is not needed in the (public) log.
  execFileSync(
    process.execPath,
    [vite, 'build', '--config', CONFIG, '--outDir', 'dist-app', '--logLevel', 'warn'],
    {
      cwd: APP,
      stdio: 'inherit',
      env: { ...process.env, VITE_APP: '1', VITE_SITE_ORIGIN: origin },
    },
  );

  // Capacitor (M2) opens index.html of its web dir; the Vite entry is app.html.
  const entry = path.join(OUT, 'app.html');
  const index = path.join(OUT, 'index.html');
  if (fs.existsSync(entry) && !fs.existsSync(index)) fs.renameSync(entry, index);
  if (!fs.existsSync(index)) fail('no index.html in dist-app');

  // The fonts are served by the app itself (globals.css asks for /fonts/…, same origin).
  fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });
  for (const f of FONTS) {
    const to = path.join(OUT, 'fonts', f);
    if (!fs.existsSync(to)) fs.copyFileSync(path.join(APP, 'public', 'fonts', f), to);
  }

  let files = 0;
  let bytes = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else {
        files++;
        bytes += fs.statSync(p).size;
      }
    }
  };
  walk(OUT);
  log(`${files} files, ${Math.round(bytes / 1024)} KB in dist-app, pages from ${origin}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
