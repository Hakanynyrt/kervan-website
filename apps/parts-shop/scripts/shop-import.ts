// Owner catalog JSON → idempotent D1 import SQL. Data stays OUTSIDE the repository.
//   node --experimental-strip-types apps/parts-shop/scripts/shop-import.ts \
//     <catalog.json> <popular.json|-> <existing.json|-> <out.sql>
// existing.json = `wrangler d1 execute <db> --remote --json --command "SELECT private_ref, code FROM families"`.
// Prints counts only (CI logs of this public repo must never show catalog data).
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  fromCatalog,
  toImportSql,
  type SourcePopular,
  type SourceRow,
} from '../../../packages/tips/src/index.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const [catalogPath, popularPath, existingPath, outPath] = process.argv.slice(2);

function die(msg: string): never {
  process.stderr.write(`shop-import: ${msg}\n`);
  process.exit(2);
}

if (!catalogPath || !popularPath || !existingPath || !outPath) {
  die('usage: shop-import.ts <catalog.json> <popular.json|-> <existing.json|-> <out.sql>');
}
const insideRepo = (p: string): boolean => {
  const rel = path.relative(REPO, path.resolve(p));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};
for (const p of [catalogPath, popularPath, existingPath, outPath]) {
  if (p !== '-' && insideRepo(p))
    die(`refusing ${p}: catalog data must stay outside the repository`);
}

/** Missing or non-JSON optional inputs (e.g. wrangler printed "Value not found") → null. */
function readOptional(p: string): unknown {
  if (p === '-') return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

let catalog: unknown;
try {
  catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch {
  die('catalog is missing or not JSON');
}
const items = (catalog as { items?: unknown }).items;
if (!Array.isArray(items) || items.length === 0) die('catalog has no items');

const existing = new Map<string, string>();
const existingRaw = readOptional(existingPath);
for (const block of Array.isArray(existingRaw) ? existingRaw : []) {
  const results = (block as { results?: unknown }).results;
  for (const r of Array.isArray(results) ? results : []) {
    const { private_ref, code } = r as { private_ref?: unknown; code?: unknown };
    if (typeof private_ref === 'string' && typeof code === 'string')
      existing.set(private_ref, code);
  }
}

const res = fromCatalog(
  items as SourceRow[],
  readOptional(popularPath) as SourcePopular | null,
  existing,
);
fs.writeFileSync(outPath, toImportSql(res.families, new Date().toISOString()));
const skus = res.families.reduce((n, f) => n + f.skus.length, 0);
const reasons = [...new Set(res.skipped.map((s) => s.reason))].join(', ') || 'none';
process.stdout.write(
  `shop-import: ${res.families.length} families (${res.families.length - existing.size} new), ${skus} SKUs, ${res.skipped.length} skipped (${reasons})\n`,
);
