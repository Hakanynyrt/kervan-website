// "Shop prices" workflow: owner's price sheet (JSON, see PriceSheet) → SQL for D1.
// Usage: node --experimental-strip-types scripts/shop-prices.ts <sheet.json> <out.sql>
// Both paths must be outside the repository (prices never enter git). Prints counts only.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { slugify, toPricesSql, type PriceSheet } from '../../../packages/tips/src/index.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const [inFile, outFile] = process.argv.slice(2);
if (!inFile || !outFile) {
  process.stderr.write('usage: shop-prices.ts <sheet.json> <out.sql>\n');
  process.exit(2);
}
for (const f of [inFile, outFile]) {
  const abs = path.resolve(f);
  if (abs === REPO || abs.startsWith(REPO + path.sep)) {
    process.stderr.write('shop-prices: refusing a path inside the repository\n');
    process.exit(2);
  }
}
const sheet = JSON.parse(fs.readFileSync(inFile, 'utf8')) as PriceSheet;
const sql = toPricesSql(sheet, new Date().toISOString(), (b, m) => `${slugify(b)}/${slugify(m)}`);
fs.writeFileSync(outFile, sql);
process.stdout.write(
  `shop-prices: ${Object.keys(sheet.prices).length} prices, ${sheet.extras?.length ?? 0} extras, ${sheet.aliases?.length ?? 0} aliases\n`,
);
