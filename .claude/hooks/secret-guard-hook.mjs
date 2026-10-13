// Claude Code PreToolUse hook (Bash): runs scripts/secret-guard.mjs before any `git commit` or
// `git push`. Exit 2 blocks the command and shows the guard's report to Claude.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}
const cmd = String(input?.tool_input?.command ?? '');
const commit = /\bgit\b[^\n;&|]*\bcommit\b/.test(cmd);
const push = /\bgit\b[^\n;&|]*\bpush\b/.test(cmd);
if (!commit && !push) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const guard = path.join(root, 'scripts', 'secret-guard.mjs');
const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

const runs = [];
if (commit) runs.push([]);
if (push) {
  // Commits not on the remote yet: against the upstream, else against origin/main.
  let base = 'origin/main';
  try {
    base = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  } catch {
    // no upstream yet (first push of a new branch)
  }
  runs.push([`${base}..HEAD`]);
}
for (const args of runs) {
  const r = spawnSync(process.execPath, [guard, ...args], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) {
    process.stderr.write(r.stderr || r.stdout || 'secret-guard failed\n');
    process.exit(2);
  }
}
process.exit(0);
