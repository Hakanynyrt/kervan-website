// "Shop prices" workflow: owner's price sheet (JSON, see PriceSheet, encrypted with
// scripts/sheet-crypt.ts) → SQL for D1.
// Usage: SHOP_SHEET_KEY=… node --experimental-strip-types scripts/shop-prices.ts <sheet.txt> <out.sql>
// Both paths must be outside the repository (prices never enter git). Prints counts only.
import fs from 'node:fs';
import process from 'node:process';
import { slugify, toPricesSql, type PriceSheet } from '../../../packages/tips/src/index.ts';
import { decryptSheet, insideRepo } from './sheet-crypt.ts';

const [inFile, outFile] = process.argv.slice(2);
if (!inFile || !outFile) {
  process.stderr.write('usage: shop-prices.ts <sheet.txt> <out.sql>\n');
  process.exit(2);
}
if ([inFile, outFile].some(insideRepo)) {
  process.stderr.write('shop-prices: refusing a path inside the repository\n');
  process.exit(2);
}
let json: string;
try {
  json = decryptSheet(fs.readFileSync(inFile, 'utf8'), process.env.SHOP_SHEET_KEY);
} catch (e) {
  // Our own messages (not encrypted, bad key) or OpenSSL's; neither carries the content.
  process.stderr.write(`shop-prices: ${(e as Error).message.split('\n')[0]}\n`);
  process.exit(1);
}
let sheet: PriceSheet;
try {
  sheet = JSON.parse(json) as PriceSheet;
} catch {
  // JSON.parse's own message quotes the text: never print it.
  process.stderr.write('shop-prices: the decrypted sheet is not valid JSON\n');
  process.exit(1);
}
const sql = toPricesSql(sheet, new Date().toISOString(), (b, m) => `${slugify(b)}/${slugify(m)}`);
fs.writeFileSync(outFile, sql);
process.stdout.write(
  `shop-prices: ${Object.keys(sheet.prices).length} prices, ${sheet.extras?.length ?? 0} extras, ${sheet.aliases?.length ?? 0} aliases\n`,
);
