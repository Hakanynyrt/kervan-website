import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { astryxPrune } from '../../packages/ui/vite-astryx-prune.mjs';
import { APP_DICT } from './src/app/dict';

/**
 * The iPhone app's web build (M1): the shop's own React pages in the app's shell (src/app),
 * reading page data and media from the live site. A second build of this package, next to the
 * site's (vite.config.ts), which it does not change:
 *
 *   VITE_SITE_ORIGIN=<origin> npx vite build --config vite.app.config.ts  → dist-app/
 *
 * dist-app/ holds index.html (from app.html), the bundle and the Inter fonts only: no prerender,
 * no catalogue file, no price file, no public/ copy. `VITE_APP=1` switches the shop's seams
 * (lib/page-source.ts, asset-base.ts, nav.ts) to the app's values.
 */

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUT = 'dist-app';
const CANONICAL = 'https://kiriciparca.com';
/** The R2 host of the tip and part pictures on the live site (main builds' VITE_TIP_IMG_BASE). */
const IMG_HOST = 'https://img.kiriciparca.com';

/** An http(s) origin without a trailing slash, else null. */
const originOf = (v: string | undefined): string | null => {
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.origin : null;
  } catch {
    return null;
  }
};

const SITE = originOf(process.env.VITE_SITE_ORIGIN) ?? CANONICAL;
// Read by Vite's env (import.meta.env) for the seams; process.env wins over .env files.
process.env.VITE_APP = '1';
process.env.VITE_SITE_ORIGIN = SITE;
// The live site keeps its tip and part pictures on R2: the app reads them there too. A local
// stand-in site (another origin) serves its own /tips and /photos, unless a base is given.
if (process.env.VITE_TIP_IMG_BASE === undefined && SITE === CANONICAL)
  process.env.VITE_TIP_IMG_BASE = IMG_HOST;
const TIP_BASE = originOf(process.env.VITE_TIP_IMG_BASE);
/** The other origins the app may read from (CSP img, media, connect). */
const CSP_HOSTS = [...new Set([SITE, IMG_HOST, ...(TIP_BASE ? [TIP_BASE] : [])])].join(' ');

/** Where this build writes (`--outDir` may move it from dist-app). */
let outDir = join(ROOT, OUT);

/** app.html as the app's index: placeholders filled, written as index.html; served at every
 *  path by the dev server (the app routes on real paths). */
function appHtml(): Plugin {
  return {
    name: 'kv-app-html',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const out = html
          .replaceAll('%KV_CSP_HOSTS%', CSP_HOSTS)
          .replaceAll('%KV_APP_NAME%', APP_DICT.tr.appName);
        // Dev only: Vite's client and React refresh run inline scripts the policy forbids.
        return ctx.server
          ? out.replace(/<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>\s*/, '')
          : out;
      },
    },
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? '/';
        const path = url.split('?')[0];
        const isPage =
          req.method === 'GET' &&
          (req.headers.accept ?? '').includes('text/html') &&
          !/^\/(@|src\/|node_modules\/)/.test(path) &&
          !/\.[a-z0-9]+$/i.test(path);
        if (isPage) req.url = '/app.html';
        next();
      });
    },
    closeBundle() {
      const from = join(outDir, 'app.html');
      if (existsSync(from)) renameSync(from, join(outDir, 'index.html'));
    },
  };
}

/**
 * boot-guard.js: a plain script that runs before the bundle. If the app has drawn nothing after
 * BOOT_WAIT_MS (the bundle failed to load, threw, or waited on the phone), it writes the error it
 * saw on the screen, so a blank start can be read from a screenshot on the phone (2026-11-15: the
 * first iPhone build opened white). Texts from the app dict.
 */
function bootGuard(): Plugin {
  return {
    name: 'kv-app-boot-guard',
    apply: 'build',
    generateBundle() {
      const src = readFileSync(join(ROOT, 'src', 'app', 'boot-guard.js'), 'utf8')
        .replace("'__KV_BOOT_FAIL_TR__'", JSON.stringify(APP_DICT.tr.bootFail))
        .replace("'__KV_BOOT_FAIL_EN__'", JSON.stringify(APP_DICT.en.bootFail));
      this.emitFile({ type: 'asset', fileName: 'boot-guard.js', source: src });
    },
  };
}

/** The fonts globals.css loads from `/fonts` (the only public files the app ships). */
function appFonts(): Plugin {
  return {
    name: 'kv-app-fonts',
    apply: 'build',
    closeBundle() {
      const src = join(ROOT, 'public', 'fonts');
      const dst = join(outDir, 'fonts');
      mkdirSync(dst, { recursive: true });
      for (const f of readdirSync(src))
        if (f.endsWith('.woff2')) copyFileSync(join(src, f), join(dst, f));
    },
  };
}

export default defineConfig({
  root: ROOT,
  plugins: [react(), tailwindcss(), astryxPrune(), appHtml(), appFonts(), bootGuard()],
  build: {
    outDir: OUT,
    emptyOutDir: true,
    target: 'es2020',
    // public/ is the site's (pictures, _headers, the model index): the app reads those live.
    copyPublicDir: false,
    rollupOptions: { input: join(ROOT, 'app.html') },
  },
  server: { port: 5176, host: true },
  preview: { port: 4176, host: true },
});
