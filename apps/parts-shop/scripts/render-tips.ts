// Renders one image per SKU from .catalog/catalog.json into .renders/ (gitignored, cached in CI):
//   .renders/<key>-1200.webp, .renders/<key>-480.webp   key = specKey(renderSpec(...))
//   .renders/manifest.json                              { "<sku code>": "<key>" }
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
  renderSpec,
  specKey,
  type PublicCatalog,
  type TipSpec,
} from '../../../packages/tips/src/index.ts';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(APP, '.catalog', 'catalog.json');
const OUT = path.join(APP, '.renders');
const RENDER_APP = path.join(APP, '.render-app');
const WORKERS = Number(process.env.SHOP_RENDER_WORKERS || 3);
const log = (s: string) => process.stdout.write(`render-tips: ${s}\n`);

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8')) as PublicCatalog;
fs.mkdirSync(OUT, { recursive: true });

const manifest: Record<string, string> = {};
const jobs = new Map<string, TipSpec>();
let unsupported = 0;
for (const f of catalog.families) {
  for (const s of f.skus) {
    const r = renderSpec(f.attrs, s);
    if (!r) {
      unsupported++;
      continue;
    }
    const key = specKey(r.spec);
    manifest[s.code] = key;
    if (!fs.existsSync(path.join(OUT, `${key}-1200.webp`))) jobs.set(key, r.spec);
  }
}
log(
  `${Object.keys(manifest).length} SKUs, ${jobs.size} to render, ${unsupported} unsupported type`,
);

const failed = new Set<string>();
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
  const queue = [...jobs.entries()];
  const t0 = Date.now();
  let done = 0;
  const worker = async () => {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/index.html`);
    await page.waitForFunction(() => window.renderReady === true, null, { timeout: 60_000 });
    for (;;) {
      const job = queue.shift();
      if (!job) break;
      const [key, spec] = job;
      try {
        const img = await page.evaluate((s) => window.renderTip(s), spec);
        for (const [size, url] of [
          ['1200', img.large],
          ['480', img.small],
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
    `rendered ${jobs.size - failed.size} in ${Math.round((Date.now() - t0) / 1000)} s, ${failed.size} failed`,
  );
}

for (const [code, key] of Object.entries(manifest)) if (failed.has(key)) delete manifest[code];
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
log(`manifest: ${Object.keys(manifest).length} images`);
