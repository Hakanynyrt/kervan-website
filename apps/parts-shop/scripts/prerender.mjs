// Build step after `vite build` and `vite build --ssr src/entry-server.tsx`: one HTML file per
// page and language with its page props embedded (the client hydrates them), then deletes dist-ssr/.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(APP, 'dist');
const SSR = path.join(APP, 'dist-ssr');
const CATALOG = path.join(APP, '.catalog', 'catalog.json');

// Published tip images: the small render as is and a medium one (800 px wide) instead of the
// 1200 px original, both re-encoded with copyright metadata (EXIF + IPTC/XMP). Cached next to
// the renders (.renders/pub, kept by CI's .renders cache). Change PUB when the published files
// change: names are cached immutable. Keep in sync with src/lib/tip-img.ts.
const PUB = 'p1';
const MD_WIDTH = 800;
const OWNER = 'Kervan Makina';
const RIGHTS = `© ${OWNER}. Tüm hakları saklıdır / All rights reserved.`;
const WEB = 'https://magaza.kervanbreaker.com/';
const XMP = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/" xmlns:plus="http://ns.useplus.org/ldf/xmp/1.0/">
<dc:creator><rdf:Seq><rdf:li>${OWNER}</rdf:li></rdf:Seq></dc:creator>
<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${RIGHTS}</rdf:li></rdf:Alt></dc:rights>
<photoshop:Credit>${OWNER}</photoshop:Credit>
<xmpRights:Marked>True</xmpRights:Marked>
<xmpRights:WebStatement>${WEB}</xmpRights:WebStatement>
<plus:Licensor><rdf:Seq><rdf:li rdf:parseType="Resource"><plus:LicensorURL>${WEB}</plus:LicensorURL></rdf:li></rdf:Seq></plus:Licensor>
</rdf:Description></rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>`;

async function publishImage(src, out, width) {
  let img = sharp(src);
  if (width) img = img.resize({ width, kernel: 'lanczos3' });
  await img
    .withExif({ IFD0: { Artist: OWNER, Copyright: RIGHTS } })
    .withXmp(XMP)
    .webp({ quality: 82, effort: 5 })
    .toFile(out);
}

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
    const pub = path.join(renders, 'pub');
    fs.mkdirSync(pub, { recursive: true });
    const copy = async (key) => {
      // One published size (md, 800 px): Pages allows at most 20,000 files per deployment, and the
      // small size saved only ~3 KB an image.
      const src = { md: `${key}-lg.webp` };
      if (!Object.values(src).every((n) => fs.existsSync(path.join(renders, n)))) return false;
      for (const [size, n] of Object.entries(src)) {
        const name = `${key}-${size}-${PUB}.webp`;
        const cached = path.join(pub, name);
        if (!fs.existsSync(cached))
          await publishImage(path.join(renders, n), cached, MD_WIDTH);
        fs.copyFileSync(cached, path.join(DIST, 'tips', name));
        images++;
      }
      return true;
    };
    for (const f of catalog.families) {
      const rear = manifest.families?.[f.code];
      if (rear && (await copy(rear))) f.imageRear = rear;
      for (const s of f.skus) {
        const v = manifest.skus?.[s.code];
        if (!v || !(await copy(v.hero)) || !(await copy(v.side))) continue;
        s.image = v.hero;
        s.imageSide = v.side;
      }
    }
  }
  const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  let count = 0;
  for (const p of ssr.prerender(catalog)) {
    const props = `<script type="application/json" id="${ssr.PROPS_ID}">${ssr.jsonForScript(p.props)}</script>`;
    // email_off: Cloudflare's Email Address Obfuscation (zone setting) would rewrite the
    // mailto links (and their prefilled subject/body) into its own script; skip it here.
    const html = ssr
      .injectHead(template, {
        lang: p.lang,
        headTags: `${p.headTags}\n    ${props}`,
        appHtml: p.appHtml,
      })
      .replace('<body>', '<body>\n    <!--email_off-->')
      .replace('</body>', '<!--/email_off-->\n  </body>');
    const out = path.join(DIST, p.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
    count++;
  }
  // Breaker pages merged into another spelling of the same model keep their old URL working.
  const moved = ssr.redirectLines(catalog);
  if (moved.length)
    fs.appendFileSync(
      path.join(DIST, '_redirects'),
      `\n# Generated by prerender.mjs: other spellings of the same breaker model.\n${moved.join('\n')}\n`,
    );
  process.stdout.write(
    `prerender: ${count} pages (${catalog.families.length} families, ${images} images, ${moved.length} redirects${catalog.demo ? ', DEMO data' : ''})\n`,
  );
} finally {
  fs.rmSync(SSR, { recursive: true, force: true });
}
