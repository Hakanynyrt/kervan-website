// Builds the shank outline ("profile", see ShankProfile in @kervan/tips) of every tip from its
// catalogue drawing, for the shop's renders.
//
//   node scripts/vega-profile.mjs <catalog.json> <drawings.json> <readings.json> <out.json> [report.json]
//
// - catalog.json: the private catalog (`catalog:v1`); drawings.json: `drawings:v1`
//   (scripts/vega-drawings.mjs).
// - readings.json: { schema: 1, items: { "<item id>": reading } }, one reading per drawing
//   (two independent visual passes plus a tie-break): the PRINTED values (top dimensions,
//   slot section, diameters tagged backEnd/beforeSlot/afterSlot/collar/body/front) and the
//   shape (key count, rear stub/head/flush, shoulder, back edge, slot-end shapes, collar,
//   front step).
//
// The drawings are not to scale (px/mm varies up to ~30 % within one drawing), so:
// - every printed value is used exactly;
// - lengths the drawing does not print (rear stub, shoulder, slot ends, collar, back chamfer)
//   are measured on the outline with the LOCAL scale of the printed dimension they sit in:
//   the extension lines of "back end → slot" and "slot length" give two px/mm factors;
// - the front step position is not on the drawing (it is beyond the break): 2.5 × its Ø,
//   reported as an estimate.
// Rows whose reading contradicts the table or whose outline cannot be measured get no
// profile (the renderer then falls back to the table) and are listed in the report.
//
// Like the catalog and the drawings, the output is private: it must be written OUTSIDE the
// repo (this script refuses paths inside it) and replaces `catalog:v1`. Prints counts only.
// Needs ImageMagick `convert` on PATH.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const r1 = (v) => Math.round(v * 10) / 10;
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[s.length >> 1] : NaN;
};

/** Grey image from a base64 PNG. */
function decode(b64) {
  const pgm = execFileSync('convert', ['png:-', '-colorspace', 'gray', '-depth', '8', 'pgm:-'], {
    input: Buffer.from(b64, 'base64'),
    maxBuffer: 1 << 26,
  });
  let off = 0;
  const tok = () => {
    while (/\s/.test(String.fromCharCode(pgm[off]))) off++;
    const s = off;
    while (!/\s/.test(String.fromCharCode(pgm[off]))) off++;
    return pgm.subarray(s, off).toString();
  };
  if (tok() !== 'P5') throw new Error('not a PGM');
  const w = Number(tok());
  const h = Number(tok());
  tok();
  off++;
  return { w, h, px: pgm.subarray(off, off + w * h) };
}

/**
 * Per-column interior bounds of the part. The interior is the white that is not connected to
 * the image border and crosses the centreline; dimension rectangles above the part do not.
 */
export function outline(img, thr = 150) {
  const { w, h, px } = img;
  const ink = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) ink[i] = px[i] < thr ? 1 : 0;
  const lab = new Int32Array(w * h).fill(0);
  const comps = [];
  const q = new Int32Array(w * h);
  let id = 0;
  for (let s = 0; s < w * h; s++) {
    if (ink[s] || lab[s]) continue;
    id++;
    let head = 0;
    let tail = 0;
    q[tail++] = s;
    lab[s] = id;
    let border = false;
    const pix = [];
    while (head < tail) {
      const i = q[head++];
      pix.push(i);
      const x = i % w;
      const y = (i / w) | 0;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) border = true;
      const nb = [
        x + 1 < w ? i + 1 : -1,
        x > 0 ? i - 1 : -1,
        y + 1 < h ? i + w : -1,
        y > 0 ? i - w : -1,
      ];
      for (const j of nb) {
        if (j >= 0 && !ink[j] && !lab[j]) {
          lab[j] = id;
          q[tail++] = j;
        }
      }
    }
    if (!border && pix.length >= 25) comps.push(pix);
  }
  if (!comps.length) return null;
  const big = comps.reduce((a, b) => (b.length > a.length ? b : a));
  const lo = new Map();
  const hi = new Map();
  for (const i of big) {
    const x = i % w;
    const y = (i / w) | 0;
    lo.set(x, Math.min(lo.get(x) ?? y, y));
    hi.set(x, Math.max(hi.get(x) ?? y, y));
  }
  let acc = 0;
  for (const [x, a] of lo) acc += (a + hi.get(x)) / 2;
  const yc = Math.round(acc / lo.size);
  const top = new Array(w).fill(null);
  const bot = new Array(w).fill(null);
  for (const pix of comps) {
    if (!pix.some((i) => Math.abs(((i / w) | 0) - yc) <= 1)) continue;
    for (const i of pix) {
      const x = i % w;
      const y = (i / w) | 0;
      if (top[x] === null || y < top[x]) top[x] = y;
      if (bot[x] === null || y > bot[x]) bot[x] = y;
    }
  }
  return { w, h, yc, top, bot, ink, px };
}

/** Fills gaps of up to 4 columns (dimension lines inside the part) by interpolation. */
function fillGaps(a, from, to) {
  for (let x = from; x <= to; x++) {
    if (a[x] !== null) continue;
    let e = x;
    while (e <= to && a[e] === null) e++;
    if (e - x <= 4 && x > from && e <= to) {
      for (let k = x; k < e; k++)
        a[k] = Math.round(a[x - 1] + ((a[e] - a[x - 1]) * (k - x + 1)) / (e - x + 1));
    }
    x = e;
  }
}

/** x of vertical extension lines standing on the part's top outline. */
export function extensionLines(o, x0, x1) {
  const xs = [];
  for (let x = x0 - 3; x <= x1; x++) {
    if (x < 0 || x >= o.w) continue;
    let t = null;
    for (let d = 0; d <= 5 && t === null; d++)
      t = o.top[Math.min(o.w - 1, x + d)] ?? o.top[Math.max(0, x - d)];
    if (t === null || t < 12) continue;
    let run = 0;
    let best = 0;
    for (let y = t - 3; y >= Math.max(0, t - 40); y--) {
      run = o.px[y * o.w + x] < 210 ? run + 1 : 0;
      best = Math.max(best, run);
    }
    if (best >= 10) xs.push(x);
  }
  const groups = [];
  for (const x of xs) {
    const g = groups[groups.length - 1];
    if (g && x - g[g.length - 1] <= 1) g.push(x);
    else groups.push([x]);
  }
  return groups.map((g) => (g[0] + g[g.length - 1]) / 2);
}

/** Median of 5 neighbours, nulls kept. */
function median5(a) {
  return a.map((v, x) => {
    if (v === null) return null;
    const win = a.slice(Math.max(0, x - 2), x + 3).filter((u) => u !== null);
    return median(win);
  });
}

/** Maximal runs where v stays within ±tol of the run median, at least minLen long. */
function plateaus(v, from, to, tol = 1, minLen = 3) {
  const out = [];
  let s = from;
  while (s <= to) {
    let e = s;
    const vals = [v[s]];
    while (e + 1 <= to && Math.abs(v[e + 1] - median(vals)) <= tol) {
      e++;
      vals.push(v[e]);
    }
    if (e - s + 1 >= minLen) out.push({ x0: s, x1: e, v: median(vals) });
    s = e + 1;
  }
  return out;
}

/** Profile of one row, or { error } with the reason. */
export function measure(row, b64, rd) {
  const o = outline(decode(b64));
  if (!o) return { error: 'no outline' };
  const valid = o.top.map((t, x) => (t !== null ? x : -1)).filter((x) => x >= 0);
  const xA = valid[0];
  fillGaps(o.top, xA, valid[valid.length - 1]);
  fillGaps(o.bot, xA, valid[valid.length - 1]);
  // Arrowheads and digits touching the outline leave single-column spikes.
  o.top = median5(o.top);
  o.bot = median5(o.bot);
  const hgt = o.top.map((t, x) => (t === null || o.bot[x] === null ? null : o.bot[x] - t));

  // Printed values, falling back to the table.
  const [dimA, dimB] = rd.topDims.length >= 2 ? rd.topDims : [];
  const slotStart = dimA ?? row.key.backEndToSlotMm;
  const slotLen = dimB ?? row.key.slotLengthMm;
  const section = rd.slotSection ?? row.key.thicknessMm;
  const dia = Object.fromEntries(rd.diameters.map((d) => [d.at, d.value]));
  const body = dia.body ?? row.diameterMm;
  if (!slotStart || !slotLen || !section || !body) return { error: 'missing printed values' };

  // Slot: the longest run where the top edge (and the bottom one for two keys) dips.
  const topRef = median(valid.map((x) => o.top[x]));
  const botRef = median(valid.map((x) => o.bot[x]));
  // The slot is found on the top edge; whether the bottom edge dips too decides the key count.
  const dipAt = (x) => o.top[x] !== null && o.top[x] > topRef + 1;
  // Slot: the first dip of the top edge from the back (a rear stub starts at the back end and
  // a front step comes after the slot, so neither is taken). Its ends snap to the extension
  // lines of the two printed top dimensions when those are found (exact positions).
  let best = null;
  for (let x = xA + 2; x < o.w && !best; x++) {
    if (!dipAt(x)) continue;
    let e = x;
    while (e + 1 < o.w && dipAt(e + 1)) e++;
    if (x > xA + 4 && e - x >= 4) best = { x0: x, x1: e };
    x = e;
  }
  if (!best || best.x1 - best.x0 < 4) return { error: 'slot not found' };
  const ext = extensionLines(o, xA, best.x1 + 8);
  const snap = (x, tol) => {
    let c = null;
    for (const e of ext)
      if (Math.abs(e - x) <= tol && (c === null || Math.abs(e - x) < Math.abs(c - x))) c = e;
    return c;
  };
  const xa = snap(xA, 4) ?? xA - 1;
  const xb = snap(best.x0, 6) ?? best.x0 - 0.5;
  const xc = snap(best.x1, 6) ?? best.x1 + 0.5;
  const sx1 = (xb - xa) / slotStart;
  const sx2 = (xc - xb) / slotLen;
  // Each span keeps its own scale, so a drawing out of proportion still measures right;
  // a ratio past 3 means the chain was misread.
  if (!(sx1 > 0.12 && sx2 > 0.12) || Math.max(sx1, sx2) / Math.min(sx1, sx2) > 3)
    return { error: `inconsistent scales ${r1(sx1)} / ${r1(sx2)} px/mm` };
  const mmAt = (x) => (x <= xb ? (x - xa) / sx1 : slotStart + (x - xb) / sx2);

  // Slot ends: from the slot edge to the floor, the most common level of the dipped edge.
  const counts = new Map();
  for (let x = best.x0; x <= best.x1; x++) counts.set(o.top[x], (counts.get(o.top[x]) ?? 0) + 1);
  const level = [...counts].reduce((a, b) =>
    b[1] > a[1] || (b[1] === a[1] && b[0] > a[0]) ? b : a,
  )[0];
  const floor = { x0: best.x0, x1: best.x1 };
  while (floor.x0 < best.x1 && o.top[floor.x0] < level) floor.x0++;
  while (floor.x1 > best.x0 && o.top[floor.x1] < level) floor.x1--;
  const mid = floor.x1 > floor.x0 + 2 ? [floor.x0 + 1, floor.x1 - 1] : [best.x0, best.x1];
  const botDip = median(o.bot.slice(mid[0], mid[1] + 1).map((b) => botRef - b));
  const topDip = level - topRef;
  const keyCount = botDip >= 2 ? 2 : 1;
  const backLen = Math.max(0, (floor.x0 - xb) / sx2);
  const frontLen = Math.max(0, (xc - floor.x1) / sx2);

  // Break: first gap of 3+ columns after the slot.
  let xBreak = o.w - 1;
  for (let x = best.x1 + 1; x < o.w - 3; x++) {
    if (hgt[x] === null && hgt[x + 1] === null && hgt[x + 2] === null) {
      xBreak = x - 1;
      break;
    }
  }
  const sx = sx2; // past the slot only the slot's scale is near

  // Back chamfer.
  const rearTop = median(o.top.slice(xA + 3, xA + 8));
  let cb = xA;
  while (cb < xA + 8 && o.top[cb] > rearTop + 0.5) cb++;
  const backChamferMm = Math.max(0.5, (cb - xA + 0.5) / sx1);

  const sections = [];
  const flags = [];
  const shank = dia.beforeSlot ?? dia.afterSlot ?? body;
  // Rear stub or head: the first plateau differs from the shank before the slot.
  if (rd.rearType !== 'flush') {
    const rearDia = dia.backEnd ?? row.rearShoulderDiameterMm;
    if (!rearDia) return { error: 'rear stub/head without a printed Ø' };
    const left = plateaus(hgt, xA + 2, best.x0 - 1);
    if (left.length < 2) return { error: 'rear step not found on the outline' };
    const stub = left[0];
    const next = left[1];
    const stepLen = Math.max(0, (next.x0 - stub.x1 - 1) / sx1);
    sections.push({
      diameterMm: rearDia,
      lengthMm: r1(mmAt(next.x0 - 0.5)),
      step: {
        kind: rd.rearShoulder === 'none' ? 'square' : rd.rearShoulder,
        lengthMm: r1(stepLen),
      },
    });
  }

  // Past the slot: an optional collar ring, the body, an optional front step.
  const right = plateaus(hgt, best.x1 + 2, xBreak - 2);
  let cur = shank;
  let y = sections.length ? sections[sections.length - 1].lengthMm : 0;
  const push = (d, upTo, kind, stepMm) => {
    sections.push({
      diameterMm: cur,
      lengthMm: r1(upTo - y),
      step: { kind, lengthMm: r1(stepMm) },
    });
    y = upTo;
    cur = d;
  };
  if (rd.collar) {
    const collarDia = dia.collar ?? row.collarDiameterMm;
    if (!collarDia) return { error: 'collar without a printed Ø' };
    const ring = right.reduce((a, b) => (b.v > a.v ? b : a), right[0] ?? null);
    if (!ring) return { error: 'collar not found on the outline' };
    const before = right.filter((p) => p.x1 < ring.x0).pop();
    const after = right.find((p) => p.x0 > ring.x1);
    const upLen = before ? (ring.x0 - before.x1 - 1) / sx : 0.5;
    const downLen = after ? (after.x0 - ring.x1 - 1) / sx : 0.3 * body;
    push(collarDia, mmAt(ring.x0 - 0.5), upLen > 0.15 * body ? 'fillet' : 'chamfer', upLen);
    const afterDia = dia.afterSlot && dia.body && dia.afterSlot !== dia.body ? dia.body : body;
    push(
      afterDia,
      mmAt(ring.x1 + 0.5) + downLen,
      downLen > 0.15 * body ? 'fillet' : 'chamfer',
      downLen,
    );
  } else if (shank !== body) {
    // A shank Ø of its own without a collar: the step is where the outline changes height.
    const stepAt = right.length >= 2 ? right[1].x0 - 0.5 : best.x1 + 1;
    const stepLen = right.length >= 2 ? (right[1].x0 - right[0].x1 - 1) / sx : 0;
    push(body, mmAt(stepAt), stepLen < 1 ? 'square' : 'taper', stepLen);
    flags.push('shank Ø differs from the body');
  }
  if (rd.frontStep !== 'none') {
    const frontDia = dia.front;
    if (!frontDia) return { error: 'front step without a printed Ø' };
    // Beyond the break: the drawing does not say where. Kept as an estimate.
    sections.push({
      diameterMm: cur,
      lengthMm: -1,
      step: { kind: 'taper', lengthMm: r1(0.15 * frontDia) },
    });
    cur = frontDia;
    flags.push('front step position estimated (2.5 × Ø from the working end)');
  }
  sections.push({ diameterMm: cur, lengthMm: null, step: null });

  // Cross-checks against the table (same numbers from another source).
  const near = (a, b) => a == null || b == null || Math.abs(a - b) <= 0.6;
  if (!near(slotStart, row.key.backEndToSlotMm)) flags.push('slot start ≠ table');
  if (!near(slotLen, row.key.slotLengthMm)) flags.push('slot length ≠ table');
  if (!near(section, row.key.thicknessMm)) flags.push('slot section ≠ table');
  if (keyCount !== rd.keyCount) flags.push('key count: outline ≠ reading (outline used)');
  if (keyCount !== row.key.count) flags.push('key count ≠ table');
  const depth = keyCount === 2 ? (shank - section) / 2 : shank - section;
  if (!(depth > 0.02 * shank && depth < 0.45 * shank))
    return { error: `slot depth ${r1(depth)} mm implausible for Ø${shank}` };

  return {
    flags,
    scales: [r1(sx1 * 100) / 100, r1(sx2 * 100) / 100],
    profile: {
      backChamferMm: r1(Math.min(backChamferMm, 0.08 * shank)),
      sections,
      slot: {
        count: keyCount,
        startMm: slotStart,
        lengthMm: slotLen,
        sectionMm: section,
        // Uneven only beyond pixel noise: ≥ 3 px apart and the split more than 15 % off even.
        ...(keyCount === 2 &&
        Math.abs(topDip - botDip) >= 3 &&
        Math.abs(topDip / (topDip + botDip) - 0.5) > 0.15
          ? { splitTop: Math.round((100 * topDip) / (topDip + botDip)) / 100 }
          : {}),
        back: { kind: rd.slotBackEnd, lengthMm: r1(Math.min(backLen, 0.6 * slotLen)) },
        front: { kind: rd.slotFrontEnd, lengthMm: r1(Math.min(frontLen, 0.8 * slotLen)) },
      },
    },
  };
}

/** Resolves the estimated front step position once the length is known (per SKU it varies). */
function placeFrontStep(profile, lengthMm) {
  const i = profile.sections.findIndex((s) => s.lengthMm === -1);
  if (i < 0) return profile;
  const front = profile.sections[i + 1].diameterMm;
  const used = profile.sections.slice(0, i).reduce((a, s) => a + s.lengthMm, 0);
  const len = Math.max(front, lengthMm - 2.5 * front - used);
  profile.sections[i].lengthMm = r1(len);
  return profile;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [CATALOG, DRAWINGS, READINGS, OUT, REPORT] = process.argv.slice(2);
  if (!CATALOG || !DRAWINGS || !READINGS || !OUT) {
    console.error(
      'usage: node scripts/vega-profile.mjs <catalog.json> <drawings.json> <readings.json> <out.json> [report.json]',
    );
    process.exit(2);
  }
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const p of [OUT, REPORT].filter(Boolean)) {
    const abs = path.resolve(p);
    if (abs === repoRoot || abs.startsWith(repoRoot + path.sep)) {
      console.error('Refusing to write inside the repo (it is public). Choose a path outside it.');
      process.exit(2);
    }
  }
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  const drawings = JSON.parse(fs.readFileSync(DRAWINGS, 'utf8')).images;
  const readings = JSON.parse(fs.readFileSync(READINGS, 'utf8')).items;
  const report = [];
  let ok = 0;
  let flagged = 0;
  for (const row of catalog.items) {
    delete row.profile;
    const b64 = drawings[row.id];
    const rd = readings[row.id];
    if (!b64 || !rd) {
      report.push({ id: row.id, error: !b64 ? 'no drawing' : 'no reading' });
      continue;
    }
    let res;
    try {
      res = measure(row, b64, rd);
    } catch (e) {
      res = { error: String(e.message ?? e) };
    }
    if (res.error) {
      report.push({ id: row.id, error: res.error });
      continue;
    }
    // Shortest catalogue length: the front step (if any) must fit every variant.
    const L = Math.min(
      ...[row.lengthMm, ...Object.values(row.lengthByType ?? {})].filter(Boolean).map((r) => r.min),
    );
    const profile = placeFrontStep(res.profile, Number.isFinite(L) ? L : 10 * row.diameterMm);
    row.profile = profile;
    ok++;
    if (res.flags.length) flagged++;
    report.push({ id: row.id, flags: res.flags, scales: res.scales, profile });
  }
  fs.writeFileSync(OUT, JSON.stringify(catalog));
  if (REPORT) fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
  console.log(
    `vega-profile: ${ok}/${catalog.items.length} rows with a profile, ${flagged} flagged, ${catalog.items.length - ok} without`,
  );
}
