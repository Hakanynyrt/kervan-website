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
  // Renders (scripts/render-tips.ts) are optional: without them pages simply have no images.
  const renders = path.join(APP, '.renders');
  let images = 0;
  if (fs.existsSync(path.join(renders, 'manifest.json'))) {
    const manifest = JSON.parse(fs.readFileSync(path.join(renders, 'manifest.json'), 'utf8'));
    fs.mkdirSync(path.join(DIST, 'tips'), { recursive: true });
    const copy = (key) => {
      const files = ['sm', 'lg'].map((v) => `${key}-${v}.webp`);
      if (!files.every((n) => fs.existsSync(path.join(renders, n)))) return false;
      for (const n of files) fs.copyFileSync(path.join(renders, n), path.join(DIST, 'tips', n));
      images += 2;
      return true;
    };
    for (const f of catalog.families) {
      const rear = manifest.families?.[f.code];
      if (rear && copy(rear)) f.imageRear = rear;
      for (const s of f.skus) {
        const v = manifest.skus?.[s.code];
        if (!v || !copy(v.hero) || !copy(v.side)) continue;
        s.image = v.hero;
        s.imageSide = v.side;
      }
    }
  }
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
    `prerender: ${count} pages (${catalog.families.length} families, ${images} images${catalog.demo ? ', DEMO data' : ''})\n`,
  );
} finally {
  fs.rmSync(SSR, { recursive: true, force: true });
}
