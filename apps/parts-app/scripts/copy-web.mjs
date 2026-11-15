// Copies the shop's app build (apps/parts-shop/dist-app, `pnpm --filter @kervan/parts-shop
// build:app`) into www/, Capacitor's webDir, before `cap sync ios` (docs/agent/app.md).
// www/ is gitignored and rebuilt every time.
//
// It refuses a build made for another site origin than the one expected (default
// https://kiriciparca.com; VITE_SITE_ORIGIN as for build:app): an app pointed at the e2e's
// local stand-in must never reach the phone. Prints counts only (the CI log is public).
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FROM = path.resolve(APP, '..', 'parts-shop', 'dist-app');
const TO = path.join(APP, 'www');
const DEFAULT_ORIGIN = 'https://kiriciparca.com';

const fail = (s) => {
  process.stderr.write(`copy-web: FAILED (${s})\n`);
  process.exit(1);
};

/** The origins the page's CSP lets it read from (connect-src), as written by build-app.mjs. */
export function connectOrigins(html) {
  const csp = /http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i.exec(html)?.[1];
  const src = csp && /(?:^|;)\s*connect-src([^;]*)/.exec(csp)?.[1];
  if (!src) return null;
  return src
    .trim()
    .split(/\s+/)
    .filter((s) => /^https?:\/\//.test(s));
}

/** Files and bytes under a folder. */
function count(dir) {
  let files = 0;
  let bytes = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!e.isFile()) continue;
    files++;
    bytes += fs.statSync(path.join(e.parentPath, e.name)).size;
  }
  return { files, bytes };
}

function main() {
  const origin = process.env.VITE_SITE_ORIGIN || DEFAULT_ORIGIN;
  const index = path.join(FROM, 'index.html');
  if (!fs.existsSync(index)) fail('no apps/parts-shop/dist-app/index.html: run build:app first');
  const origins = connectOrigins(fs.readFileSync(index, 'utf8'));
  if (!origins) fail('no connect-src in dist-app/index.html');
  if (!origins.includes(origin)) fail(`dist-app was not built for ${origin}`);

  fs.rmSync(TO, { recursive: true, force: true });
  fs.cpSync(FROM, TO, { recursive: true });
  const { files, bytes } = count(TO);
  process.stdout.write(`copy-web: ${files} files, ${Math.round(bytes / 1024)} KB into www/\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
