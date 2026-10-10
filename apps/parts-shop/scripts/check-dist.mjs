// Last build step: fails the build if a page could leak or be indexed.
// - every HTML page has meta robots noindex and the embedded page props;
// - no file in dist/ contains a forbidden string (third-party catalogue names or part
//   numbers, private D1 columns). M4 changes the noindex rule, never the forbidden list.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'dist');
const FORBIDDEN = [
  /\bvega\b/i,
  /\bVT\d{7}\b/,
  /private_ref/,
  /private_notes/,
  /cost_try/,
  // D1 column / table names of the part prices: only resolved per-page prices may ship.
  /price_usd_net_cents/,
  /part_prices/,
  /part_type/,
];

const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(html|js|css|json|txt|xml)$/.test(e.name)) files.push(p);
  }
};
walk(DIST);

// Cloudflare Pages takes at most 20,000 files per deployment; fail here, with the count, rather
// than at the deploy step. The margin leaves room for the tip renders still to come.
const MAX_FILES = 19000;
let total = 0;
const count = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true }))
    if (e.isDirectory()) count(path.join(d, e.name));
    else total++;
};
count(DIST);

const problems = [];
let pages = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const rel = path.relative(DIST, f);
  for (const re of FORBIDDEN) if (re.test(s)) problems.push(`${rel}: forbidden ${re}`);
  if (f.endsWith('.html')) {
    pages++;
    if (!s.includes('<meta name="robots" content="noindex, nofollow"')) problems.push(`${rel}: no noindex`);
    if (!s.includes('id="kv-page"')) problems.push(`${rel}: no page props`);
  }
}
if (total > MAX_FILES) problems.push(`dist: ${total} files, more than ${MAX_FILES} (Pages limit 20,000)`);
if (problems.length) {
  process.stderr.write(`check-dist: ${problems.length} problem(s)\n${problems.slice(0, 20).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(`check-dist: ${pages} pages ok, ${total} files\n`);
