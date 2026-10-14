import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateRawSync } from 'node:zlib';
import {
  MAX_TOTAL_BYTES,
  crc32,
  extensionOf,
  matchesSignature,
  sanitizeFileName,
  toBase64,
  toMailAttachments,
  validateAttachments,
  zipOne,
  type IncomingFile,
} from './rfq-attachments.ts';

const enc = (s: string) => new TextEncoder().encode(s);
const bytes = (...b: number[]) => new Uint8Array(b);
const file = (name: string, data: Uint8Array): IncomingFile => ({ name, bytes: data });

const PDF = enc('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n');
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13);
const JPG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 16);
const WEBP = enc('RIFF\x10\x00\x00\x00WEBPVP8 ');
const DWG = enc('AC1032\x00\x00\x00\x00');
const DXF = enc('  0\r\nSECTION\r\n  2\r\nHEADER\r\n');
const STEP = enc('ISO-10303-21;\nHEADER;\n');
const EXE = bytes(0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00);

test('extensionOf: lower case, last dot only', () => {
  assert.equal(extensionOf('Çizim.PDF'), 'pdf');
  assert.equal(extensionOf('parça.v2.step'), 'step');
  assert.equal(extensionOf('README'), '');
});

test('each accepted type passes with its real signature', () => {
  assert.equal(matchesSignature('pdf', PDF), true);
  assert.equal(matchesSignature('png', PNG), true);
  assert.equal(matchesSignature('jpg', JPG), true);
  assert.equal(matchesSignature('jpeg', JPG), true);
  assert.equal(matchesSignature('webp', WEBP), true);
  assert.equal(matchesSignature('dwg', DWG), true);
  assert.equal(matchesSignature('dxf', DXF), true);
  assert.equal(matchesSignature('dxf', enc('AutoCAD Binary DXF\r\n\x1a\x00')), true);
  assert.equal(matchesSignature('step', STEP), true);
  const bom = bytes(0xef, 0xbb, 0xbf, ...enc(' ISO-10303-21;'));
  assert.equal(matchesSignature('stp', bom), true);
});

test('a program renamed to .pdf (or any accepted type) is refused', () => {
  for (const ext of ['pdf', 'png', 'jpg', 'webp', 'dwg', 'dxf', 'step'] as const) {
    assert.equal(matchesSignature(ext, EXE), false, ext);
  }
  assert.equal(validateAttachments([file('cizim.pdf', EXE)]), 'type');
});

test('a PNG named .jpg is refused (content must match the extension)', () => {
  assert.equal(validateAttachments([file('foto.jpg', PNG)]), 'type');
});

test('unknown extensions are refused', () => {
  assert.equal(validateAttachments([file('setup.exe', EXE)]), 'type');
  assert.equal(validateAttachments([file('notes.txt', enc('hello'))]), 'type');
  assert.equal(validateAttachments([file('noext', PDF)]), 'type');
});

test('at most three files', () => {
  const three = [file('a.pdf', PDF), file('b.png', PNG), file('c.dxf', DXF)];
  assert.equal(validateAttachments(three), null);
  assert.equal(validateAttachments([...three, file('d.step', STEP)]), 'count');
});

test('total size at most 8 MB', () => {
  const big = new Uint8Array(MAX_TOTAL_BYTES);
  big.set(PDF);
  assert.equal(validateAttachments([file('a.pdf', big)]), null);
  const over = new Uint8Array(MAX_TOTAL_BYTES - 100);
  over.set(PDF);
  assert.equal(validateAttachments([file('a.pdf', over), file('b.png', PNG.slice())]), null);
  const tooMuch = new Uint8Array(MAX_TOTAL_BYTES + 1);
  tooMuch.set(PDF);
  assert.equal(validateAttachments([file('a.pdf', tooMuch)]), 'size');
});

test('no files is fine', () => {
  assert.equal(validateAttachments([]), null);
});

test('sanitizeFileName drops paths and odd characters, keeps Turkish letters', () => {
  assert.equal(sanitizeFileName('C:\\Users\\x\\Keski çizimi.PDF', 0), 'Keski çizimi.pdf');
  assert.equal(sanitizeFileName('../../etc/passwd.png', 0), 'passwd.png');
  assert.equal(sanitizeFileName('<script>"a".dwg', 1), 'script_a.dwg');
  assert.equal(sanitizeFileName('a\r\nBcc: x@y.z.pdf', 0), 'a_Bcc_ x_y.z.pdf');
  assert.equal(sanitizeFileName('.pdf', 2), 'ek-3.pdf');
  assert.ok(sanitizeFileName('x'.repeat(300) + '.step', 0).length <= 95);
});

test('base64 matches Node', () => {
  const data = new Uint8Array(100_000).map((_, i) => (i * 7) % 256);
  assert.equal(toBase64(data), Buffer.from(data).toString('base64'));
});

test('crc32 of "123456789" is the check value', () => {
  assert.equal(crc32(enc('123456789')), 0xcbf43926);
});

test('zipOne writes a valid stored zip holding the file', () => {
  const zip = zipOne('parça.dwg', DWG);
  const v = new DataView(zip.buffer);
  assert.equal(v.getUint32(0, true), 0x04034b50);
  const nameLen = v.getUint16(26, true);
  const size = v.getUint32(18, true);
  assert.equal(new TextDecoder().decode(zip.subarray(30, 30 + nameLen)), 'parça.dwg');
  assert.deepEqual(zip.subarray(30 + nameLen, 30 + nameLen + size), DWG);
  // End of central directory: one entry, central directory right after the data.
  const eocd = zip.length - 22;
  assert.equal(v.getUint32(eocd, true), 0x06054b50);
  assert.equal(v.getUint32(eocd + 16, true), 30 + nameLen + size);
  // Stored data inflates to itself only when wrapped; here just check it is not compressed.
  assert.throws(() => inflateRawSync(zip.subarray(30 + nameLen, 30 + nameLen + size)));
});

test('toMailAttachments: PDF and images as they are, CAD files and WebP zipped', () => {
  const out = toMailAttachments([
    file('Çizim 1.PDF', PDF),
    file('foto.webp', WEBP),
    file('model.STEP', STEP),
  ]);
  assert.deepEqual(
    out.map((a) => [a.name, a.type]),
    [
      ['Çizim 1.pdf', 'application/pdf'],
      ['foto.webp.zip', 'application/zip'],
      ['model.step.zip', 'application/zip'],
    ],
  );
  assert.equal(
    Buffer.from(out[0].content, 'base64').toString('latin1'),
    '%PDF-1.7\n1 0 obj\n<<>>\nendobj\n',
  );
});
