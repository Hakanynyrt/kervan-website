// The app icon (docs/agent/app.md): the shop's KRV mark (apps/parts-shop/public/logo-krv-v2.svg,
// its own grey and ember) centred on the shop's light background, as the one 1024 x 1024 PNG
// that iOS asks for (square, opaque, no alpha: iOS rounds the corners itself). Run it again only
// when the mark changes: `pnpm --filter @kervan/parts-app icon`. A changed icon gets a new file
// name (images are immutable here too), so Contents.json is written with it.
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOGO = path.resolve(APP, '..', 'parts-shop', 'public', 'logo-krv-v2.svg');
const SET = path.join(APP, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
const NAME = 'AppIcon-krv-1024.png';
const SIZE = 1024;
/** The shop's page background (--color-bg, styles/globals.css). */
const BG = '#ffffff';
/** The mark's width on the icon (the maskable web icon uses about 0.6). */
const MARK_WIDTH = 0.62;

const svg = fs.readFileSync(LOGO, 'utf8');
const markWidth = Math.round(SIZE * MARK_WIDTH);
// The SVG has a viewBox only: rasterise it at twice the needed width, then scale down.
const viewWidth = Number(/viewBox="[\d.]+ [\d.]+ ([\d.]+)/.exec(svg)?.[1]);
if (!viewWidth) throw new Error('make-icon: no viewBox in the logo');
const mark = await sharp(Buffer.from(svg), { density: (72 * 2 * markWidth) / viewWidth })
  .resize({ width: markWidth })
  .png()
  .toBuffer();
const { width = 0, height = 0 } = await sharp(mark).metadata();

await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: BG } })
  .composite([
    { input: mark, left: Math.round((SIZE - width) / 2), top: Math.round((SIZE - height) / 2) },
  ])
  .flatten({ background: BG })
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(path.join(SET, NAME));

for (const f of fs.readdirSync(SET))
  if (f.endsWith('.png') && f !== NAME) fs.rmSync(path.join(SET, f));
const contents = {
  images: [{ filename: NAME, idiom: 'universal', platform: 'ios', size: `${SIZE}x${SIZE}` }],
  info: { author: 'xcode', version: 1 },
};
fs.writeFileSync(path.join(SET, 'Contents.json'), `${JSON.stringify(contents, null, 2)}\n`);
process.stdout.write(`make-icon: ${NAME} ${SIZE}x${SIZE}, mark ${width}x${height}\n`);
