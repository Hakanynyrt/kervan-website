// Secret guard: stops a commit, push or PR that would put private data into this PUBLIC repo
// (CLAUDE.md "The repo and CI logs are public"): price sheets and price rows, the sheet key,
// source drawings, VEGA part numbers, tokens, passwords and private keys.
//
//   node scripts/secret-guard.mjs                 staged + unstaged changes against HEAD (before a commit)
//   node scripts/secret-guard.mjs <base>..<head>  every change in a commit range (before a push, in CI)
//
// It only ever prints file, line and rule, never the matched text, so a hit cannot leak through
// the (public) CI log. It holds no secret itself: values are recognised by their shape, and the
// values of secret-looking environment variables of the machine it runs on are matched without
// being printed. Exit 1 = blocked.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/** File names that must never be committed. */
export const FILE_RULES = [
  [/\.(xlsx|xlsm|xls|ods|csv|tsv)$/i, 'spreadsheet / table (price sheet, sales list)'],
  [/\.(dwg|dxf)$/i, 'source drawing'],
  [/\.enc\.txt$|fiyat/i, 'price sheet'],
  [/SHOP_SHEET_KEY/i, 'price sheet key'],
  [/vega-(catalog|drawings?)[^/]*\.json$/i, 'VEGA catalogue data'],
  [/(^|\/)\.env(\.|$)|(^|\/)\.dev\.vars/, 'environment / secrets file'],
  [/\.(pem|key|p12|pfx|jks)$/i, 'private key file'],
];

/** Content of added lines. Test files may carry made-up price rows (`cents`). */
export const LINE_RULES = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\b(ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/, 'GitHub token'],
  [/\bsk-(proj-|ant-)?[A-Za-z0-9_-]{24,}/, 'API key (sk-…)'],
  [/\bxkeysib-[a-f0-9]{32,}|\bxsmtpsib-[a-f0-9]{32,}/, 'Brevo key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS key'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'Google API key'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/SHOP_SHEET_KEY\s*[:=]\s*['"]?[A-Za-z0-9+/_=-]{16,}/, 'price sheet key value'],
  [/enc:v1:[A-Za-z0-9+/=]{40,}/, 'encrypted price sheet'],
  [/\bVT\d{7}\b/, 'VEGA part number'],
  [/\b(password|passwd|parola|şifre|sifre)\b\s*[:=]\s*['"][^'"\s]{6,}['"]/i, 'password'],
  [/\bcents\b['"]?\s*:\s*\d{3,}/, 'price row (cents)', (path) => !/\.test\.[cm]?[jt]sx?$/.test(path)],
];

/** Larger files are refused: data dumps and archives do not belong here (pictures are far smaller). */
export const MAX_BYTES = 8 * 1024 * 1024;

/** Values of this machine's secret-looking environment variables (name only is ever reported). */
export const envSecrets = (env = process.env) =>
  Object.entries(env)
    .filter(
      ([k, v]) =>
        /(^|_)(KEY|TOKEN|SECRET|PASSWORD|PASS)(_|$)/i.test(k) &&
        !/^GIT_CONFIG_|_FILE$|_PATH$|_ID$/.test(k) &&
        typeof v === 'string' &&
        v.length >= 12 &&
        !/\s/.test(v),
    )
    .map(([k, v]) => ({ name: k, value: v }));

/**
 * files: [{ path, added: [{ line, text }], bytes? }]. Returns [{ path, line?, rule }].
 */
export function scan(files, secrets = []) {
  const problems = [];
  for (const f of files) {
    for (const [re, rule] of FILE_RULES) if (re.test(f.path)) problems.push({ path: f.path, rule });
    if (f.bytes != null && f.bytes > MAX_BYTES)
      problems.push({ path: f.path, rule: `file larger than ${MAX_BYTES / 1024 / 1024} MB` });
    for (const { line, text } of f.added) {
      for (const [re, rule, applies] of LINE_RULES)
        if ((!applies || applies(f.path)) && re.test(text)) problems.push({ path: f.path, line, rule });
      for (const s of secrets)
        if (text.includes(s.value))
          problems.push({ path: f.path, line, rule: `value of the environment variable ${s.name}` });
    }
  }
  return problems;
}

/** Parses `git diff -U0` output into the files' added lines. */
export function parseDiff(diff) {
  const files = [];
  let cur = null;
  let next = 0;
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('diff --git ')) {
      cur = null;
      continue;
    }
    if (raw.startsWith('+++ ')) {
      const p = raw.slice(4);
      cur = p === '/dev/null' ? null : { path: p.replace(/^b\//, ''), added: [] };
      if (cur) files.push(cur);
      continue;
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (hunk) {
      next = Number(hunk[1]);
      continue;
    }
    if (cur && raw.startsWith('+')) cur.added.push({ line: next++, text: raw.slice(1) });
  }
  return files;
}

const git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe'] });

function collect(range) {
  const diffArgs = range ? [range] : ['HEAD'];
  const files = parseDiff(git(['diff', '-U0', '--no-color', '--no-ext-diff', '--no-renames', ...diffArgs]));
  // Every added / changed path, binary ones included (they have no text lines above).
  const names = git(['diff', '--name-only', '--diff-filter=ACMR', '--no-renames', ...diffArgs])
    .split('\n')
    .filter(Boolean);
  const byPath = new Map(files.map((f) => [f.path, f]));
  const head = range ? range.split('..').pop() : null;
  const add = (p) => {
    if (!byPath.has(p)) byPath.set(p, { path: p, added: [] });
    return byPath.get(p);
  };
  for (const p of names) {
    const f = add(p);
    try {
      f.bytes = head ? Number(git(['cat-file', '-s', `${head}:${p}`]).trim()) : fs.statSync(p).size;
    } catch {
      // deleted from the working tree after staging: nothing to measure
    }
  }
  if (!range) {
    // New files not added yet: what a following `git add . && git commit` would take in.
    for (const p of git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)) {
      const f = add(p);
      f.bytes = fs.statSync(p).size;
      if (f.bytes <= MAX_BYTES) {
        const buf = fs.readFileSync(p);
        if (!buf.subarray(0, 8000).includes(0))
          f.added = buf.toString('utf8').split('\n').map((text, i) => ({ line: i + 1, text }));
      }
    }
  }
  return [...byPath.values()];
}

function main() {
  const range = process.argv[2];
  const problems = scan(collect(range), envSecrets());
  if (!problems.length) {
    process.stdout.write('secret-guard: ok\n');
    return;
  }
  const lines = problems
    .slice(0, 50)
    .map((p) => `  ${p.path}${p.line ? `:${p.line}` : ''}  ${p.rule}`)
    .join('\n');
  process.stderr.write(
    `secret-guard: BLOCKED, ${problems.length} problem(s). This repo is public; remove these before committing.\n` +
      `secret-guard: ENGELLENDİ, depo herkese açık; bunları çıkarmadan kayıt/gönderim yapılamaz.\n${lines}\n`,
  );
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
