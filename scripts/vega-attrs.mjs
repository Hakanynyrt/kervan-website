// Adds the drawing-derived attributes (rear step, slot-end shape, tip angle) to the private
// tip catalog, so the catalog tab can filter on them.
//
//   node scripts/vega-attrs.mjs <catalog.json> <attrs.json> <out.json>
//
// attrs.json: { schema: 1, items: { "<item id>": { rearStep: boolean|null,
//   slotEnd: "rounded"|"tapered"|null, tipAngleDeg: number|null } } }
// It is derived from the private VEGA drawings, so (like the catalog itself) it must live
// OUTSIDE the repo. The output replaces the KV value `catalog:v1`; this script refuses to
// write inside the repo and prints only counts. The catalog tab treats a missing field as
// "unknown", so an older catalog keeps working.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [CATALOG, ATTRS, OUT] = process.argv.slice(2);
if (!CATALOG || !ATTRS || !OUT) {
  console.error('usage: node scripts/vega-attrs.mjs <catalog.json> <attrs.json> <out.json>');
  process.exit(2);
}
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outAbs = path.resolve(OUT);
if (outAbs === repoRoot || outAbs.startsWith(repoRoot + path.sep)) {
  console.error('Refusing to write inside the repo (it is public). Choose a path outside it.');
  process.exit(2);
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const attrs = JSON.parse(fs.readFileSync(ATTRS, 'utf8'));
const SLOT = new Set(['rounded', 'tapered']);
const problems = [];
let merged = 0;
const stat = { rear: 0, noRear: 0, tapered: 0, rounded: 0, angled: 0 };

for (const it of catalog.items) {
  const a = attrs.items?.[it.id];
  if (!a) {
    problems.push(`no attributes for ${it.id}`);
    continue;
  }
  if (a.rearStep !== null && typeof a.rearStep !== 'boolean') problems.push(`${it.id}: rearStep`);
  if (a.slotEnd !== null && !SLOT.has(a.slotEnd)) problems.push(`${it.id}: slotEnd`);
  if (a.tipAngleDeg !== null && !(a.tipAngleDeg > 0 && a.tipAngleDeg < 180))
    problems.push(`${it.id}: tipAngleDeg`);
  // the table's rear diameter is hard evidence of a rear step
  if (it.rearShoulderDiameterMm != null && a.rearStep === false)
    problems.push(`${it.id}: drawing says no rear step but the table has a rear diameter`);
  it.rearStep = a.rearStep;
  it.slotEnd = a.slotEnd;
  it.tipAngleDeg = a.tipAngleDeg;
  merged++;
  if (a.rearStep === true) stat.rear++;
  if (a.rearStep === false) stat.noRear++;
  if (a.slotEnd === 'tapered') stat.tapered++;
  if (a.slotEnd === 'rounded') stat.rounded++;
  if (a.tipAngleDeg) stat.angled++;
}

console.log(`rows ${catalog.items.length}, merged ${merged}`, JSON.stringify(stat));
if (problems.length) {
  console.error('Problems:\n  ' + problems.slice(0, 40).join('\n  '));
  process.exit(1);
}
fs.mkdirSync(path.dirname(outAbs), { recursive: true });
fs.writeFileSync(outAbs, JSON.stringify(catalog));
console.log(`wrote ${outAbs} (${(fs.statSync(outAbs).size / 1e3).toFixed(0)} KB)`);
