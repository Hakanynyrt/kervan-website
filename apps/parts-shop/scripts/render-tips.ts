// Renders three views per model from .catalog/catalog.json into .renders/ (gitignored, cached
// in CI): per SKU a hero and a side view, per family one rear close-up (identical for every
// tip type, so rendered once).
//   .renders/<key>-lg.webp, .renders/<key>-sm.webp   key = specKey(spec or rearSpec, view)
//   .renders/manifest.json   { skus: { "<sku>": { hero, side } }, families: { "<family>": rear } }
// Unchanged geometry → same key → no re-render. Prints counts only (public CI logs).
//   node --experimental-strip-types apps/parts-shop/scripts/render-tips.ts
// Needs Chromium: Playwright's own (CI: `playwright install chromium`) or SHOP_CHROMIUM=<path>.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
  rearSpec,
  renderSpec,
  specKey,
  type PublicCatalog,
  type TipSpec,
} from '../../../packages/tips/src/index.ts';

type View = 'hero' | 'side' | 'rear';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(APP, '.catalog', 'catalog.json');
const OUT = path.join(APP, '.renders');
const RENDER_APP = path.join(APP, '.render-app');
const WORKERS = Number(process.env.SHOP_RENDER_WORKERS || 3);
/** Stop starting new renders after this many minutes (0 = no limit); the rest wait for the next run. */
const BUDGET_MS = Number(process.env.SHOP_RENDER_BUDGET_MIN || 0) * 60_000;
const log = (s: string) => process.stdout.write(`render-tips: ${s}\n`);

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8')) as PublicCatalog;
fs.mkdirSync(OUT, { recursive: true });

const manifest: {
  skus: Record<string, { hero: string; side: string }>;
  families: Record<string, string>;
} = { skus: {}, families: {} };
const jobs = new Map<string, { spec: TipSpec; view: View }>();
const want = (key: string, spec: TipSpec, view: View) => {
  if (!fs.existsSync(path.join(OUT, `${key}-lg.webp`))) jobs.set(key, { spec, view });
};
let unsupported = 0;
for (const f of catalog.families) {
  for (const s of f.skus) {
    const r = renderSpec(f.attrs, s);
    if (!r) {
      unsupported++;
      continue;
    }
    const hero = specKey(r.spec, 'hero');
    const side = specKey(r.spec, 'side');
    manifest.skus[s.code] = { hero, side };
    want(hero, r.spec, 'hero');
    want(side, r.spec, 'side');
    if (!manifest.families[f.code]) {
      const rear = specKey(rearSpec(r.spec), 'rear');
      manifest.families[f.code] = rear;
      want(rear, r.spec, 'rear');
    }
  }
}
log(
  `${Object.keys(manifest.skus).length} SKUs, ${Object.keys(manifest.families).length} families, ${jobs.size} images to render, ${unsupported} not drawable`,
);

const failed = new Set<string>();
let done = 0;
const queue = [...jobs.entries()];
if (jobs.size > 0) {
  execFileSync('pnpm', ['exec', 'vite', 'build', '--config', 'vite.render.config.ts'], {
    cwd: APP,
    stdio: ['ignore', 'ignore', 'inherit'],
  });

  const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript' };
  const server = http.createServer((req, res) => {
    const rel =
      decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const file = path.join(RENDER_APP, rel);
    if (!file.startsWith(RENDER_APP) || !fs.existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  const port = (server.address() as { port: number }).port;

  const browser = await chromium.launch({
    executablePath: process.env.SHOP_CHROMIUM || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const t0 = Date.now();
  const worker = async () => {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/index.html`);
    await page.waitForFunction(() => window.renderReady === true, null, { timeout: 60_000 });
    for (;;) {
      if (BUDGET_MS && Date.now() - t0 > BUDGET_MS) break;
      const job = queue.shift();
      if (!job) break;
      const [key, { spec, view }] = job;
      try {
        const img = await page.evaluate(([s, v]) => window.renderTip(s, v), [spec, view] as const);
        for (const [size, url] of [
          ['lg', img.large],
          ['sm', img.small],
        ] as const) {
          const b64 = url.slice(url.indexOf(',') + 1);
          fs.writeFileSync(path.join(OUT, `${key}-${size}.webp`), Buffer.from(b64, 'base64'));
        }
      } catch {
        failed.add(key);
      }
      done++;
      if (done % 100 === 0) log(`${done}/${jobs.size} (${Math.round((Date.now() - t0) / 1000)} s)`);
    }
    await page.close();
  };
  await Promise.all(Array.from({ length: Math.max(1, WORKERS) }, worker));
  await browser.close();
  server.close();
  log(
    `rendered ${done - failed.size} in ${Math.round((Date.now() - t0) / 1000)} s, ${failed.size} failed, ${queue.length} left for the next run`,
  );
}

// Only images that exist (failed or left over by the time budget → no image yet).
const have = (k: string) => fs.existsSync(path.join(OUT, `${k}-lg.webp`));
for (const [code, v] of Object.entries(manifest.skus))
  if (!have(v.hero) || !have(v.side)) delete manifest.skus[code];
for (const [code, k] of Object.entries(manifest.families))
  if (!have(k)) delete manifest.families[code];
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
log(
  `manifest: ${Object.keys(manifest.skus).length} SKUs, ${Object.keys(manifest.families).length} families`,
);
