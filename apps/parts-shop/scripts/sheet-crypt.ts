// The owner's price sheet travels encrypted: the "Shop prices" workflow input is public in the
// run's event (and was printed in the job log as an env value), so it only ever carries
// `enc:v1:` + base64(iv ‖ AES-256-GCM(gzip(JSON))). The key is the repository secret
// SHOP_SHEET_KEY (base64, 32 bytes); the owner keeps a copy outside the repository.
//   node --experimental-strip-types scripts/sheet-crypt.ts key                     → a new key
//   SHOP_SHEET_KEY=… node --experimental-strip-types scripts/sheet-crypt.ts encrypt <sheet.json> <out.txt>
// Both paths must be outside the repository. Prints nothing about the sheet's contents.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

export const PREFIX = 'enc:v1:';

const keyOf = (b64: string | undefined): Buffer => {
  const k = Buffer.from(b64 ?? '', 'base64');
  if (k.length !== 32) throw new Error('SHOP_SHEET_KEY must be 32 bytes, base64');
  return k;
};

export function encryptSheet(json: string, keyB64: string | undefined): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', keyOf(keyB64), iv);
  const body = Buffer.concat([c.update(zlib.gzipSync(Buffer.from(json, 'utf8'))), c.final()]);
  return PREFIX + Buffer.concat([iv, body, c.getAuthTag()]).toString('base64');
}

/** Throws on anything but a well-formed sheet sealed with this key (wrong key, edits, plain text). */
export function decryptSheet(text: string, keyB64: string | undefined): string {
  const t = text.trim();
  if (!t.startsWith(PREFIX)) throw new Error('the sheet is not encrypted (enc:v1:)');
  const raw = Buffer.from(t.slice(PREFIX.length), 'base64');
  if (raw.length < 12 + 16 + 1) throw new Error('the encrypted sheet is truncated');
  const d = crypto.createDecipheriv('aes-256-gcm', keyOf(keyB64), raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(raw.length - 16));
  const gz = Buffer.concat([d.update(raw.subarray(12, raw.length - 16)), d.final()]);
  return zlib.gunzipSync(gz).toString('utf8');
}

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const insideRepo = (f: string): boolean => {
  const abs = path.resolve(f);
  return abs === REPO || abs.startsWith(REPO + path.sep);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, inFile, outFile] = process.argv.slice(2);
  if (cmd === 'key') {
    process.stdout.write(`${crypto.randomBytes(32).toString('base64')}\n`);
  } else if (cmd === 'encrypt' && inFile && outFile) {
    if ([inFile, outFile].some(insideRepo)) {
      process.stderr.write('sheet-crypt: refusing a path inside the repository\n');
      process.exit(2);
    }
    const out = encryptSheet(fs.readFileSync(inFile, 'utf8'), process.env.SHOP_SHEET_KEY);
    fs.writeFileSync(outFile, out);
    process.stdout.write(`sheet-crypt: ${out.length} characters (input limit 65535)\n`);
  } else {
    process.stderr.write('usage: sheet-crypt.ts key | encrypt <sheet.json> <out.txt>\n');
    process.exit(2);
  }
}
