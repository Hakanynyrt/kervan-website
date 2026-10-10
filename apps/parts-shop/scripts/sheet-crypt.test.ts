import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PREFIX, decryptSheet, encryptSheet } from './sheet-crypt.ts';

const key = crypto.randomBytes(32).toString('base64');
const sheet = JSON.stringify({ schema: 1, prices: { 'KU00-01-C': 12345 } });

test('round trip', () => {
  const enc = encryptSheet(sheet, key);
  assert.ok(enc.startsWith(PREFIX));
  assert.ok(!enc.includes('KU00'));
  assert.equal(decryptSheet(enc, key), sheet);
  assert.equal(decryptSheet(`  ${enc}\n`, key), sheet);
});

test('refuses plain JSON, a wrong key, an edited text and a bad key', () => {
  assert.throws(() => decryptSheet(sheet, key), /not encrypted/);
  const enc = encryptSheet(sheet, key);
  assert.throws(() => decryptSheet(enc, crypto.randomBytes(32).toString('base64')));
  const raw = Buffer.from(enc.slice(PREFIX.length), 'base64');
  raw[20] ^= 1;
  assert.throws(() => decryptSheet(PREFIX + raw.toString('base64'), key));
  assert.throws(() => decryptSheet(enc, 'short'), /32 bytes/);
  assert.throws(() => decryptSheet(PREFIX + 'AAAA', key), /truncated/);
});

test('the failure messages never quote the sheet', () => {
  for (const f of [
    () => decryptSheet(sheet, key),
    () => decryptSheet(encryptSheet(sheet, key), crypto.randomBytes(32).toString('base64')),
  ]) {
    try {
      f();
    } catch (e) {
      assert.ok(!(e as Error).message.includes('KU00'));
    }
  }
});
