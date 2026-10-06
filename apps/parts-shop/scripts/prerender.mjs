// Build step after `vite build` and `vite build --ssr src/entry-server.tsx`: one HTML file per
// page and language with its page props embedded (the client hydrates them), then deletes dist-ssr/.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(APP, 'dist');
const SSR = path.join(APP, 'dist-ssr');
const CATALOG = path.join(APP, '.catalog', 'catalog.json');

process.env.NODE_ENV ??= 'production';

try {
  const ssr = await import(pathToFileURL(path.join(SSR, 'entry-server.js')).href);
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  let count = 0;
  for (const p of ssr.prerender(catalog)) {
    const props = `<script type="application/json" id="${ssr.PROPS_ID}">${ssr.jsonForScript(p.props)}</script>`;
    const html = ssr.injectHead(template, {
      lang: p.lang,
      headTags: `${p.headTags}\n    ${props}`,
      appHtml: p.appHtml,
    });
    const out = path.join(DIST, p.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
    count++;
  }
  process.stdout.write(
    `prerender: ${count} pages (${catalog.families.length} families${catalog.demo ? ', DEMO data' : ''})\n`,
  );
} finally {
  fs.rmSync(SSR, { recursive: true, force: true });
}
