// Last build step: fails the build if a page could leak or be indexed.
// - every HTML page has meta robots noindex and the embedded page props;
// - no file in dist/ contains a forbidden string (third-party catalogue names or part
//   numbers, private D1 columns). M4 changes the noindex rule, never the forbidden list.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'dist');
const FORBIDDEN = [/\bvega\b/i, /\bVT\d{7}\b/, /private_ref/, /private_notes/, /cost_try/];

const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(html|js|css|json|txt|xml)$/.test(e.name)) files.push(p);
  }
};
walk(DIST);

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
if (problems.length) {
  process.stderr.write(`check-dist: ${problems.length} problem(s)\n${problems.slice(0, 20).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(`check-dist: ${pages} pages ok\n`);
