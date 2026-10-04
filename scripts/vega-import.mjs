// Normalizes the private VEGA tip catalog CSV into catalog.json for Cloudflare KV.
//
//   node scripts/vega-import.mjs <catalog.csv> <out.json>
//
// The catalog is private (the repo is public): the output must be written OUTSIDE
// the repo and uploaded to the KV key `catalog:v1` (binding VEGA_CATALOG). This script
// refuses to write inside the repo and prints only counts, never catalog rows.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const [SRC, OUT] = process.argv.slice(2);
if (!SRC || !OUT) {
  console.error('usage: node scripts/vega-import.mjs <catalog.csv> <out.json>');
  process.exit(2);
}
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outAbs = path.resolve(OUT);
if (outAbs === repoRoot || outAbs.startsWith(repoRoot + path.sep)) {
  console.error('Refusing to write inside the repo (it is public). Choose a path outside it.');
  process.exit(2);
}

// --- CSV (';' separated, quotes, CRLF, BOM) ---
function parseCsv(t) {
  t = t.replace(/^﻿/, '');
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ';') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}
const n1 = s => { const v = parseFloat(String(s).replace(',', '.')); return Number.isFinite(v) ? v : null; };
const slug = s => s.toLowerCase().replace(/ø/g, 'o').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const TYPE = { chisel: 'chisel', 'moil point': 'moil', 'blunt tool': 'blunt', pyramid: 'pyramid' };
const ALL = ['chisel', 'moil', 'blunt', 'pyramid'];
const typeKey = s => TYPE[s.trim().toLowerCase()] || null;

// "480 - 560" | "12,5" | "" -> {min,max}|null
function range(s) {
  const m = String(s).trim().match(/^(\d+(?:[.,]\d+)?)(?:\s*-\s*(\d+(?:[.,]\d+)?))?$/);
  if (!m) return null;
  const a = n1(m[1]), b = m[2] ? n1(m[2]) : a;
  return { min: Math.min(a, b), max: Math.max(a, b) };
}
// "550 (Chisel) / 550 - 700 (Moil Point, Pyramid) / 680 (Blunt Tool)" -> {byType:{chisel:{min,max},..}, all:{min,max}}
function perType(s) {
  s = String(s).trim(); if (!s) return null;
  const parts = s.split(/\s+\/\s+/); const byType = {}; let any = true;
  for (const p of parts) {
    const m = p.match(/^(.*?)\s*(?:\((.*)\))?$/); const r = range(m[1]);
    if (!r) { any = false; continue; }
    const types = m[2] ? m[2].split(',').map(typeKey).filter(Boolean) : ALL;
    for (const t of types) byType[t] = r;
  }
  if (!any && !Object.keys(byType).length) return null;
  const rs = Object.values(byType);
  const all = { min: Math.min(...rs.map(r => r.min)), max: Math.max(...rs.map(r => r.max)) };
  const uniform = rs.every(r => r.min === rs[0].min && r.max === rs[0].max);
  return { all, byType: uniform ? null : byType };
}
function brandList(seriRaw) {
  const out = []; const re = /([A-Z0-9&][A-Z0-9&\/\- .]*?)\s*\(([^)]*SERIES)\)/g; let m;
  while ((m = re.exec(seriRaw))) for (const b of m[1].split('/')) out.push(b.trim());
  if (!out.length) out.push(...seriRaw.replace(/\(.*?\)/g, '').split('/').map(s => s.trim()).filter(Boolean));
  return [...new Set(out.filter(Boolean))];
}
function compat(s) {
  const out = [];
  for (const item of s.split(';').map(x => x.trim()).filter(Boolean)) {
    const parts = item.split(/\s*,\s*/); let prefix = '';
    parts.forEach((p, i) => {
      if (i === 0) { out.push(p); const m = p.match(/^(.*\s)\S+$/); prefix = m ? m[1] : ''; }
      else out.push(/^\d+\w*$/.test(p) ? prefix + p : p); // "Stanley MB 350, 356" -> Stanley MB 356
    });
  }
  return [...new Set(out)];
}
const FLAGS = new Set(['back_dia', 'key_count', 'key_thickness', 'drawing_body_dia', 'diameter_table', 'part_nos']);

const rows = parseCsv(fs.readFileSync(SRC, 'utf8'));
const H = rows.shift(); const ix = n => H.indexOf(n);
const C = Object.fromEntries(['Seri', 'Model', 'Uyumlu kırıcılar', 'VEGA parça no', 'Çap (mm)', 'Kama kalınlığı (mm)', 'Kama', 'Arka uç → kanal başı (mm)', 'Kama kanalı boyu (mm)', 'Arka çıkıntı Ø (mm)', 'Boy (mm)', 'Ağırlık (kg)', 'Uç tipleri', 'Diğer ölçüler', 'Okuma güveni', 'Not', 'PDF sayfa', 'Katalog sayfa'].map(k => [k, ix(k)]));
if (Object.values(C).some(v => v < 0)) throw new Error('header mismatch: ' + H.join('|'));

const items = [], failures = [], ids = new Map();
const knownBrands = new Set(rows.flatMap(r => brandList((r[C.Seri] || '').trim())));
const brandsSorted = [...knownBrands].sort((a, b) => b.length - a.length);

rows.forEach((r, i) => {
  const line = i + 2, g = k => (r[C[k]] ?? '').trim(), warn = [];
  try {
    const model = g('Model'); if (!model) throw new Error('no model');
    const seriRaw = g('Seri');
    // brand: from model prefix if it matches a known series brand, else first series brand
    const mu = model.toUpperCase().replace(/\s+/g, ' ');
    const brand = brandsSorted.find(b => mu.startsWith(b.replace(/\s+/g, ' '))) || brandList(seriRaw)[0] || model.split(' ')[0];
    let dia = n1(g('Çap (mm)')), boy = g('Boy (mm)'), kg = g('Ağırlık (kg)');
    let diaMax = null, collar = null;
    const note = g('Not'), other = g('Diğer ölçüler');

    // stepped diameter: catalog "A - B" split across columns -> Boy begins with "- B ..."
    let m = boy.match(/^-\s*(\d+(?:[.,]\d+)?)(.*)$/);
    if (m) {
      const second = n1(m[1]), rest = m[2].trim();
      if (!rest) { // shifted: length landed in weight column (Montabert BRH 1000, MTB MT 26)
        boy = kg; kg = ''; diaMax = Math.max(dia, second); dia = Math.min(dia, second); warn.push('columns_shifted_weight_missing');
      } else if (/^\d+\s*(?:-|\()?/.test(rest) && dia > 400 && /yer değiştir/i.test(other)) { // TEX 1400 H: Çap/Boy swapped
        const lenMax = second, d = n1(rest.split(/\s/)[0]); boy = `${dia} - ${lenMax}`; dia = d; warn.push('dia_length_swapped');
        const w = kg; kg = w;
      } else {
        diaMax = Math.max(dia, second); dia = Math.min(dia, second);
        boy = rest.replace(/\/\s*-\s*\d+(?:[.,]\d+)?\s+/g, '/ ');  // per-variant "- 60 550" -> "550"
      }
      if (diaMax !== null && diaMax !== dia) collar = diaMax;
    }
    const L = perType(boy), W = perType(kg);
    if (boy && !L) warn.push('length_unparsed');
    if (kg && !W) warn.push('weight_unparsed');
    const tipTypes = g('Uç tipleri').split(',').map(typeKey).filter(Boolean);
    const geometryMissing = !L && !W;

    const keyCount = g('Kama') === 'Çift' ? 2 : g('Kama') === 'Tek' ? 1 : null;
    if (keyCount === null) warn.push('kama_unknown');
    const fl = [], free = [];
    for (const t of note.split(';').map(x => x.trim()).filter(Boolean)) (FLAGS.has(t) ? fl : free).push(t.replace(/^katalog:\s*/, ''));

    let id = slug(model); if (ids.has(id)) id += '-p' + g('PDF sayfa'); ids.set(id, 1);
    const num = k => { const v = n1(g(k)); return v; };
    items.push({
      id, model, brand, seriesRaw: seriRaw,
      partNos: g('VEGA parça no').split(/\s*,\s*/).filter(Boolean),
      fitsBreakers: compat(g('Uyumlu kırıcılar')),
      tipTypes,
      diameterMm: dia, collarDiameterMm: collar,
      key: { count: keyCount, thicknessMm: num('Kama kalınlığı (mm)'), slotLengthMm: num('Kama kanalı boyu (mm)'), backEndToSlotMm: num('Arka uç → kanal başı (mm)') },
      rearShoulderDiameterMm: num('Arka çıkıntı Ø (mm)'),
      lengthMm: L?.all ?? null, lengthByType: L?.byType ?? null,
      weightKg: W?.all ?? null, weightByType: W?.byType ?? null,
      confidence: g('Okuma güveni') === 'yüksek' ? 'high' : g('Okuma güveni') === 'orta' ? 'medium' : 'low',
      reviewFlags: fl, notes: free, extra: other || null,
      source: { pdfPage: n1(g('PDF sayfa')), catalogPage: n1(g('Katalog sayfa')), line },
      quality: [...warn, ...(geometryMissing ? ['geometry_missing'] : [])],
    });
  } catch (e) { failures.push({ line, error: e.message, model: (r[C.Model] || '').trim() }); }
});

// plausibility checks
for (const it of items) {
  const q = it.quality;
  if (it.key.thicknessMm > it.diameterMm) q.push('key_thickness_gt_diameter');
  if (it.rearShoulderDiameterMm > (it.collarDiameterMm || it.diameterMm)) q.push('rear_shoulder_gt_diameter');
  if (it.lengthMm && it.key.backEndToSlotMm + it.key.slotLengthMm > it.lengthMm.min) q.push('slot_beyond_length');
  if (it.lengthMm && it.weightKg) {
    const d = it.diameterMm / 1000, kgSolid = Math.PI * d * d / 4 * (it.lengthMm.max / 1000) * 7850, ratio = it.weightKg.max / kgSolid;
    if (ratio > 1.05 || ratio < 0.45) q.push('weight_implausible_for_dia_length');
  }
}
const out = { schema: 1, source: path.basename(SRC), count: items.length, items };
const json = JSON.stringify(out);
fs.writeFileSync(outAbs, json);
console.log(JSON.stringify({ rowsIn: rows.length, items: items.length, failures, rawBytes: Buffer.byteLength(json), gzipBytes: zlib.gzipSync(json).length, brotliBytes: zlib.brotliCompressSync(json).length,
  qualityCounts: items.flatMap(i => i.quality).reduce((a, k) => (a[k] = (a[k] || 0) + 1, a), {}), brands: [...new Set(items.map(i => i.brand))].length }, null, 1));
