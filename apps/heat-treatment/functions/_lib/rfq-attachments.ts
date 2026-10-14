/**
 * RFQ form attachments (drawings, photos): validation and e-mail packing for functions/api/rfq.ts.
 *
 * Pure functions, unit-tested in rfq-attachments.test.ts (`pnpm --filter @kervan/heat-treatment test`).
 * The client (src/components/Contact.tsx) applies the same limits; the server re-checks them
 * because a request can be sent without the form. File contents are never logged.
 */

/** Limits shared with the form (keep in sync with src/lib/attachments.ts). */
export const MAX_FILES = 3;
export const MAX_TOTAL_BYTES = 8 * 1024 * 1024;

/** Accepted extensions (lower case, no dot). */
export const ALLOWED_EXTENSIONS = [
  'pdf',
  'dwg',
  'dxf',
  'step',
  'stp',
  'jpg',
  'jpeg',
  'png',
  'webp',
] as const;
export type AttachmentExt = (typeof ALLOWED_EXTENSIONS)[number];

/** Types the mail service takes as they are. The others (CAD files, WebP) travel inside a
 *  one-file zip, which every transport accepts, so an unusual extension never stops the mail. */
const SEND_AS_IS: ReadonlySet<AttachmentExt> = new Set(['pdf', 'jpg', 'jpeg', 'png']);

export type AttachmentError = 'count' | 'size' | 'type';

export interface IncomingFile {
  name: string;
  bytes: Uint8Array;
}

export interface MailAttachment {
  /** Sanitised file name as the owner will see it. */
  name: string;
  /** Base64 content. */
  content: string;
  /** MIME type (MailChannels wants one). */
  type: string;
}

/** Lower-case extension of a file name, or '' when there is none. */
export function extensionOf(name: string): string {
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(name.trim());
  return m ? m[1].toLowerCase() : '';
}

export function isAllowedExtension(ext: string): ext is AttachmentExt {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * A file name safe for an e-mail attachment: no path, no control or markup characters,
 * at most 100 characters, the (lower-cased) extension kept. Falls back to `ek-<n>.<ext>`.
 */
export function sanitizeFileName(raw: string, index: number): string {
  const ext = extensionOf(raw);
  const base = raw
    .split(/[\\/]/)
    .pop()!
    .replace(/\.[A-Za-z0-9]{1,8}$/, '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} ._()-]+/gu, '_')
    .replace(/\s+/g, ' ')
    .replace(/^[\s._-]+|[\s._-]+$/g, '')
    .slice(0, 90);
  const stem = base || `ek-${index + 1}`;
  return ext ? `${stem}.${ext}` : stem;
}

const ascii = (bytes: Uint8Array, from: number, len: number): string => {
  let s = '';
  for (let i = from; i < Math.min(bytes.length, from + len); i++)
    s += String.fromCharCode(bytes[i]);
  return s;
};

/** A UTF-8 byte-order mark as `ascii()` decodes it (one char per byte). */
const UTF8_BOM = /^\xEF\xBB\xBF/;

const startsWith = (bytes: Uint8Array, sig: number[], at = 0): boolean =>
  bytes.length >= at + sig.length && sig.every((b, i) => bytes[at + i] === b);

/** Does the content look like what its extension says? Cheap checks on the first bytes only. */
export function matchesSignature(ext: AttachmentExt, bytes: Uint8Array): boolean {
  switch (ext) {
    case 'pdf':
      // The header must be within the first 1024 bytes (PDF spec allows leading junk).
      return ascii(bytes, 0, 1024).includes('%PDF-');
    case 'png':
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'jpg':
    case 'jpeg':
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case 'webp':
      return ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP';
    case 'dwg':
      // AutoCAD R13 and later: "AC1012" … "AC1032".
      return ascii(bytes, 0, 4) === 'AC10';
    case 'dxf': {
      if (ascii(bytes, 0, 18) === 'AutoCAD Binary DXF') return true;
      // ASCII DXF: group-code lines, the first section starts with "0" / "SECTION"
      // (a "999" comment may come first).
      const head = ascii(bytes, 0, 4096).replace(UTF8_BOM, '');
      return /^\s*(?:0|999)\s*\r?\n/.test(head) && /\n\s*SECTION\s*\r?\n/.test(head);
    }
    case 'step':
    case 'stp':
      return /^\s*ISO-10303-21/.test(ascii(bytes, 0, 256).replace(UTF8_BOM, ''));
  }
}

/**
 * Checks count, total size, extension and content of the attached files.
 * Returns the first problem, or null when all of them may be forwarded.
 */
export function validateAttachments(files: IncomingFile[]): AttachmentError | null {
  if (files.length > MAX_FILES) return 'count';
  const total = files.reduce((n, f) => n + f.bytes.length, 0);
  if (total > MAX_TOTAL_BYTES) return 'size';
  for (const f of files) {
    const ext = extensionOf(f.name);
    if (!isAllowedExtension(ext) || !matchesSignature(ext, f.bytes)) return 'type';
  }
  return null;
}

const MIME: Record<AttachmentExt, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  dwg: 'application/acad',
  dxf: 'application/dxf',
  step: 'application/step',
  stp: 'application/step',
};

/** Base64 of raw bytes (Workers and Node both have btoa). */
export function toBase64(bytes: Uint8Array): string {
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

let CRC_TABLE: Uint32Array | null = null;
export function crc32(bytes: Uint8Array): number {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** A zip archive holding one file, stored without compression (the name is UTF-8). */
export function zipOne(name: string, data: Uint8Array): Uint8Array {
  const nameBytes = new TextEncoder().encode(name);
  const crc = crc32(data);
  const local = new Uint8Array(30 + nameBytes.length);
  const lv = new DataView(local.buffer);
  lv.setUint32(0, 0x04034b50, true); // local file header
  lv.setUint16(4, 20, true); // version needed
  lv.setUint16(6, 0x0800, true); // UTF-8 names
  lv.setUint16(8, 0, true); // stored
  lv.setUint16(10, 0, true); // time
  lv.setUint16(12, 0x21, true); // date: 1980-01-01
  lv.setUint32(14, crc, true);
  lv.setUint32(18, data.length, true);
  lv.setUint32(22, data.length, true);
  lv.setUint16(26, nameBytes.length, true);
  lv.setUint16(28, 0, true);
  local.set(nameBytes, 30);

  const central = new Uint8Array(46 + nameBytes.length);
  const cv = new DataView(central.buffer);
  cv.setUint32(0, 0x02014b50, true); // central directory header
  cv.setUint16(4, 20, true); // version made by
  cv.setUint16(6, 20, true); // version needed
  cv.setUint16(8, 0x0800, true);
  cv.setUint16(10, 0, true);
  cv.setUint16(12, 0, true);
  cv.setUint16(14, 0x21, true);
  cv.setUint32(16, crc, true);
  cv.setUint32(20, data.length, true);
  cv.setUint32(24, data.length, true);
  cv.setUint16(28, nameBytes.length, true);
  // extra, comment, disk, internal attrs, external attrs: 0
  cv.setUint32(42, 0, true); // offset of the local header
  central.set(nameBytes, 46);

  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); // end of central directory
  ev.setUint16(8, 1, true);
  ev.setUint16(10, 1, true);
  ev.setUint32(12, central.length, true);
  ev.setUint32(16, local.length + data.length, true);

  const out = new Uint8Array(local.length + data.length + central.length + end.length);
  out.set(local, 0);
  out.set(data, local.length);
  out.set(central, local.length + data.length);
  out.set(end, local.length + data.length + central.length);
  return out;
}

/** Validated files → e-mail attachments (sanitised names; CAD files and WebP zipped). */
export function toMailAttachments(files: IncomingFile[]): MailAttachment[] {
  return files.map((f, i) => {
    const name = sanitizeFileName(f.name, i);
    const ext = extensionOf(name) as AttachmentExt;
    if (SEND_AS_IS.has(ext)) return { name, content: toBase64(f.bytes), type: MIME[ext] };
    return {
      name: `${name}.zip`,
      content: toBase64(zipOne(name, f.bytes)),
      type: 'application/zip',
    };
  });
}
