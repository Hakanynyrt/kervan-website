// Parametric breaker tip mesh from a TipSpec (@kervan/tips renderSpec). Build-time only:
// bundled into the render page that scripts/render-tips.ts drives in headless Chromium.
//
// Local frame: tool axis = +Y, striking end at y = 0, working end at y = L, millimetres.
// Key slots are flat cuts on +Z (and -Z for two keys). One revolved profile (hard edges,
// per-run material) for everything axisymmetric, then three-bvh-csg for slots and flats.
import * as THREE from 'three';
import { Brush, Evaluator, INTERSECTION, SUBTRACTION } from 'three-bvh-csg';
import type { StepKind, TipSpec } from '@kervan/tips';

const deg = (d: number) => (d * Math.PI) / 180;

/** Material slots: heat-treated body, ground faces, machined cuts. */
export const MAT = { BODY: 0, GROUND: 1, MACHINED: 2 } as const;

interface Run {
  pts: [number, number][];
  mat: number;
  smooth?: boolean;
}

function subdivide(pts: [number, number][], maxSeg: number): [number, number][] {
  const out: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [r0, y0] = pts[i - 1];
    const [r1, y1] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(r1 - r0, y1 - y0) / maxSeg));
    for (let s = 1; s <= n; s++) out.push([r0 + ((r1 - r0) * s) / n, y0 + ((y1 - y0) * s) / n]);
  }
  return out;
}

/** Lathe with smooth normals inside a run, hard edges between runs, one group per run. */
function revolve(runs: Run[], segs = 160, maxSeg = 40): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const groups: { start: number; count: number; mat: number }[] = [];
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  const pc = new THREE.Vector3();
  const n = new THREE.Vector3();
  const tri = (a: number, b: number, c: number) => {
    pa.fromArray(pos, a * 3);
    pb.fromArray(pos, b * 3);
    pc.fromArray(pos, c * 3);
    n.subVectors(pb, pa).cross(pc.clone().sub(pa));
    if (n.lengthSq() < 1e-10) return;
    const vn = new THREE.Vector3()
      .fromArray(nor, a * 3)
      .add(new THREE.Vector3().fromArray(nor, b * 3))
      .add(new THREE.Vector3().fromArray(nor, c * 3));
    if (n.dot(vn) < 0) idx.push(a, c, b);
    else idx.push(a, b, c);
  };
  for (const run of runs) {
    const pts = run.smooth ? run.pts : subdivide(run.pts, maxSeg);
    const start = idx.length;
    const base = pos.length / 3;
    const normals = pts.map((p, i) => {
      let tx = 0;
      let ty = 0;
      if (i > 0) {
        const dx = p[0] - pts[i - 1][0];
        const dy = p[1] - pts[i - 1][1];
        const l = Math.hypot(dx, dy) || 1;
        tx += dx / l;
        ty += dy / l;
      }
      if (i < pts.length - 1) {
        const dx = pts[i + 1][0] - p[0];
        const dy = pts[i + 1][1] - p[1];
        const l = Math.hypot(dx, dy) || 1;
        tx += dx / l;
        ty += dy / l;
      }
      const l = Math.hypot(tx, ty) || 1;
      return [ty / l, -tx / l];
    });
    for (let i = 0; i < pts.length; i++) {
      for (let j = 0; j <= segs; j++) {
        const phi = (j / segs) * Math.PI * 2;
        const s = Math.sin(phi);
        const c = Math.cos(phi);
        const [r, y] = pts[i];
        const [nr, ny] = normals[i];
        pos.push(r * s, y, r * c);
        nor.push(nr * s, ny, nr * c);
        uv.push(j / segs, y / 250);
      }
    }
    for (let i = 0; i < pts.length - 1; i++) {
      for (let j = 0; j < segs; j++) {
        const a = base + i * (segs + 1) + j;
        const b = a + 1;
        const c = a + segs + 1;
        const d = c + 1;
        tri(a, c, b);
        tri(b, c, d);
      }
    }
    groups.push({ start, count: idx.length - start, mat: run.mat });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  for (const gr of groups) g.addGroup(gr.start, gr.count, gr.mat);
  return g;
}

/** Points of the transition between two radii ending at y1 (axial length len). */
function stepPoints(
  kind: StepKind,
  ra: number,
  rb: number,
  y1: number,
  len: number,
): [number, number][] {
  const y0 = y1 - len;
  if (kind === 'square' || len <= 0.05)
    return [
      [ra, y1],
      [rb, y1],
    ];
  if (kind === 'chamfer' || kind === 'taper')
    return [
      [ra, y0],
      [rb, y1],
    ];
  const pts: [number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const u = (i / 14) * (Math.PI / 2);
    // Concave fillet: tangent to the smaller radius, steep at the larger one.
    if (ra > rb) pts.push([rb + (ra - rb) * (1 - Math.sin(u)), y0 + len * (1 - Math.cos(u))]);
    else pts.push([ra + (rb - ra) * (1 - Math.cos(u)), y0 + len * Math.sin(u)]);
  }
  return pts;
}

function profileRuns(s: TipSpec): Run[] {
  const runs: Run[] = [];
  const secs = s.sections;
  const R = secs[secs.length - 1].r;
  const { D, L } = s;
  const seg = (a: [number, number], b: [number, number], mat: number) =>
    runs.push({ pts: [a, b], mat });
  const r0 = secs[0].r;
  const cb = Math.min(s.backChamfer, 0.4 * r0);
  seg([0, 0], [r0 - cb, 0], MAT.GROUND);
  seg([r0 - cb, 0], [r0, cb], MAT.BODY);
  let y = cb;
  for (let i = 0; i < secs.length - 1; i++) {
    const a = secs[i];
    const b = secs[i + 1];
    const st = a.step!;
    const len = Math.min(st.len, 0.9 * (a.y1 - y));
    const pts = stepPoints(st.kind, a.r, b.r, a.y1, len);
    if (pts[0][1] > y + 0.01) seg([a.r, y], [a.r, pts[0][1]], MAT.BODY);
    const radial = st.kind === 'square' || len <= 0.05;
    runs.push({ pts, mat: radial ? MAT.GROUND : MAT.BODY, smooth: st.kind === 'fillet' });
    y = a.y1;
  }
  let workStart: number;
  const tip: Run[] = [];
  if (s.type === 'moil' || s.type === 'conical') {
    const half = deg(s.angle! / 2);
    const rho = (s.type === 'moil' ? 0.06 : 0.1) * D; // blunted point radius
    const rt = rho * Math.cos(half);
    const yt = L - rho + rho * Math.sin(half);
    workStart = yt - (R - rt) / Math.tan(half);
    tip.push({
      pts: [
        [R, workStart],
        [rt, yt],
      ],
      mat: MAT.GROUND,
    });
    const cap: [number, number][] = [];
    for (let i = 0; i <= 12; i++) {
      const b = half + ((Math.PI / 2 - half) * i) / 12;
      cap.push([rho * Math.cos(b), L - rho + rho * Math.sin(b)]);
    }
    tip.push({ pts: cap, mat: MAT.GROUND, smooth: true });
  } else if (s.type === 'blunt') {
    const c = 0.07 * D;
    workStart = L - c;
    tip.push({
      pts: [
        [R, L - c],
        [R - c, L],
      ],
      mat: MAT.GROUND,
    });
    tip.push({
      pts: [
        [R - c, L],
        [0, L],
      ],
      mat: MAT.GROUND,
    });
  } else {
    const c0 = 1.5; // chisel / pyramid: the flats come from CSG
    workStart = L - c0;
    tip.push({
      pts: [
        [R, L - c0],
        [R - c0, L],
      ],
      mat: MAT.GROUND,
    });
    tip.push({
      pts: [
        [R - c0, L],
        [0, L],
      ],
      mat: MAT.GROUND,
    });
  }
  if (workStart <= y + 1) throw new Error('profile does not fit');
  seg([R, y], [R, workStart], MAT.BODY);
  runs.push(...tip);
  return runs;
}

/** One end of the slot, from the shank surface (rs) down to the floor, going +y.
 *  radius: a circular end tangent to the floor; ramp: a straight slope; square: a wall. */
/** Chamfers the corner b of the polyline a → b → c: a straight cut of size r along both legs. */
function blend(
  a: [number, number],
  b: [number, number],
  c: [number, number],
  r: number,
): [number, number][] {
  const toward = (p: [number, number], q: [number, number], t: number): [number, number] => {
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const k = Math.min(t, 0.45 * len) / len;
    return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
  };
  return [toward(b, a, r), toward(b, c, r)];
}

function slotEnd(
  e: TipSpec['slot']['back'],
  y: number,
  rs: number,
  floor: number,
  r = 0,
): [number, number][] {
  const d = rs - floor;
  const l = Math.max(0, e.len);
  // Square and ramp ends meet the floor at a corner: chamfered by r (radius ends are tangent).
  const far: [number, number] = [y + l + Math.max(4 * r, 10), floor];
  if (e.kind === 'square' || l < 0.2)
    return r > 0
      ? [[y, rs], ...blend([y, rs], [y, floor], far, r)]
      : [
          [y, rs],
          [y, floor],
        ];
  if (e.kind === 'ramp')
    return r > 0
      ? [[y, rs], ...blend([y, rs], [y + l, floor], far, r)]
      : [
          [y, rs],
          [y + l, floor],
        ];
  const pts: [number, number][] = [];
  if (l >= d) {
    const rho = (l * l + d * d) / (2 * d); // through (y, rs), tangent to the floor at y + l
    const cy = y + l;
    const cz = floor + rho;
    const a0 = Math.atan2(rs - cz, y - cy);
    const a1 = -Math.PI / 2;
    for (let i = 0; i <= 16; i++) {
      const t = a0 + ((a1 - a0) * i) / 16;
      pts.push([cy + rho * Math.cos(t), cz + rho * Math.sin(t)]);
    }
  } else {
    pts.push([y, rs]);
    for (let i = 0; i <= 12; i++) {
      const t = Math.PI + ((Math.PI / 2) * i) / 12;
      pts.push([y + l + l * Math.cos(t), floor + l + l * Math.sin(t)]);
    }
  }
  return pts;
}

/** The part of a polyline (z falling along it) below height z1, starting exactly at z1. */
function below(poly: [number, number][], z1: number): [number, number][] {
  for (let i = 0; i < poly.length - 1; i++) {
    const [ya, za] = poly[i];
    const [yb, zb] = poly[i + 1];
    if (za >= z1 && zb <= z1) {
      const t = za === zb ? 0 : (za - z1) / (za - zb);
      return [[ya + (yb - ya) * t, z1], ...poly.slice(i + 1)];
    }
  }
  return [poly[poly.length - 1]];
}

/** n points spread evenly along a polyline by length. */
function resample(poly: [number, number][], n: number): [number, number][] {
  const acc = [0];
  for (let i = 1; i < poly.length; i++)
    acc.push(acc[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const total = acc[acc.length - 1];
  const out: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const d = (total * k) / (n - 1);
    let i = 1;
    while (i < acc.length - 1 && acc[i] < d) i++;
    const seg = acc[i] - acc[i - 1] || 1;
    const t = Math.min(1, Math.max(0, (d - acc[i - 1]) / seg));
    out.push([
      poly[i - 1][0] + (poly[i][0] - poly[i - 1][0]) * t,
      poly[i - 1][1] + (poly[i][1] - poly[i - 1][1]) * t,
    ]);
  }
  return out;
}

/**
 * Key flat on +Z, floor plane at z = floor, as a loft across X: every slice follows the end
 * curves in (axial y, radial z) down from the shank surface at that x, so the rim chamfer runs
 * the whole curved edge where each slot end meets the round shank.
 */
function slotCutter(s: TipSpec, floor: number): THREE.BufferGeometry {
  const { start, len, rs, chamfer: c } = s.slot;
  const y0 = start;
  const y1 = start + len;
  const top = rs + 40;
  const back = slotEnd(s.slot.back, y0, rs, floor, c);
  // Front end built going −y from y1, then mirrored: also runs from the surface down.
  const front = slotEnd(s.slot.front, -y1, rs, floor, c).map(
    ([y, z]) => [-y, z] as [number, number],
  );
  const M = 24;
  const W = maxRadius(s) + 40;
  const xs: number[] = [-W];
  const SL = 160;
  for (let i = 0; i <= SL; i++) xs.push(-rs + (2 * rs * i) / SL);
  xs.push(W);
  const slice = (x: number): [number, number][] => {
    const zs = Math.max(floor + 0.5, Math.sqrt(Math.max(0, rs * rs - x * x)));
    const cc = Math.max(0, Math.min(c, zs - floor - 0.4));
    const rimB = below(back, zs)[0];
    const rimF = below(front, zs)[0];
    const b = resample(below(back, zs - cc), M);
    const f = resample(below(front, zs - cc), M).reverse();
    // Carry each bevel line 1.5 mm past the shank surface: a cutter edge lying exactly on the
    // surface makes CSG leave a ragged seam.
    const out = (p: [number, number], q: [number, number]): [number, number] => {
      const dy = p[0] - q[0];
      const dz = p[1] - q[1];
      const l = Math.hypot(dy, dz) || 1;
      return [p[0] + (1.5 * dy) / l, p[1] + (1.5 * dz) / l];
    };
    const tb = out([rimB[0] - cc, zs], b[0]);
    const tf = out([rimF[0] + cc, zs], f[f.length - 1]);
    return [[tb[0], top], tb, ...b, ...f, tf, [tf[0], top]];
  };
  // Crisp at the top corners, both ends of each bevel; smooth along the end curves and floor.
  const crisp = new Set([0, 1, 2, 2 * M + 1, 2 * M + 2, 2 * M + 3]);
  return loftMesh(
    xs.map((x) => slice(x).map(([y, z]) => [x, y, z] as V3)),
    (p) => [p[1], p[2]],
    crisp,
  );
}

type V3 = [number, number, number];

/**
 * Closed solid through a series of rings with the same point count (a loft), capped at both
 * ends. `flat` maps a cap point to 2D for triangulation. Indexed (CSG stays fast); ring corners
 * listed in `crisp` get split normals, so chamfer facets stay sharp and the CSG cut faces,
 * which take the cutter's normals, shade cleanly.
 */
function loftMesh(
  rings: V3[][],
  flat: (p: V3) => [number, number],
  crisp: ReadonlySet<number> = new Set(),
): THREE.BufferGeometry {
  const n = rings[0].length;
  // A crisp ring corner gets two vertices (one per side), so normals do not blend across it.
  const slots: { inn: number; out: number }[] = [];
  let count = 0;
  for (let i = 0; i < n; i++) {
    const inn = count++;
    slots.push({ inn, out: crisp.has(i) ? count++ : inn });
  }
  const pos: number[] = [];
  for (const ring of rings)
    for (let i = 0; i < n; i++) {
      pos.push(...ring[i]);
      if (crisp.has(i)) pos.push(...ring[i]);
    }
  const v = (k: number, i: number, side: 'inn' | 'out') => k * count + slots[i][side];
  const idx: number[] = [];
  for (let k = 0; k < rings.length - 1; k++)
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a = v(k, i, 'out');
      const b = v(k, j, 'inn');
      const c = v(k + 1, j, 'inn');
      const d = v(k + 1, i, 'out');
      idx.push(a, b, c, a, c, d);
    }
  // Caps get their own vertices (flat).
  const capBase = pos.length / 3;
  let capOff = 0;
  const capIdx: number[] = [];
  for (const [k, flip] of [
    [0, false],
    [rings.length - 1, true],
  ] as const) {
    const base = capBase + capOff;
    for (const p of rings[k]) pos.push(...p);
    capOff += n;
    const contour = rings[k].map((p) => new THREE.Vector2(...flat(p)));
    for (const t of THREE.ShapeUtils.triangulateShape(contour, [])) {
      const [p, q, r] = t.map((i) => base + i);
      if (flip) capIdx.push(p, q, r);
      else capIdx.push(p, r, q);
    }
  }
  idx.push(...capIdx);
  // Outward winding: positive signed volume.
  const P = (i: number) => new THREE.Vector3(pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]);
  let vol = 0;
  for (let i = 0; i < idx.length; i += 3) vol += P(idx[i]).dot(P(idx[i + 1]).cross(P(idx[i + 2])));
  if (vol < 0)
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2),
  );
  return g;
}

/** Slot bottom height z at axial y (the uncut surface rs outside the slot). */
function slotDepthAt(
  back: [number, number][],
  front: [number, number][],
  y: number,
  rs: number,
  floor: number,
): number {
  const along = (poly: [number, number][]) => {
    // poly runs with y increasing (back) and z falling; take the lowest z reached at y.
    let z = Infinity;
    for (let i = 0; i < poly.length - 1; i++) {
      const [ya, za] = poly[i];
      const [yb, zb] = poly[i + 1];
      if ((y - ya) * (y - yb) <= 0) {
        const t = ya === yb ? 1 : (y - ya) / (yb - ya);
        z = Math.min(z, za + (zb - za) * t);
      }
    }
    return z;
  };
  if (y <= back[0][0] || y >= front[0][0]) return rs;
  // In an end zone only that end's curve applies; in between, the floor.
  const z = Math.min(along(back), along(front));
  if (z === Infinity) return floor;
  return Math.max(floor, Math.min(rs, z));
}

/**
 * 45° chamfer along both side edges of a slot, as a loft along the axis: in each cross-section
 * the cut leaves a chord at the slot bottom height, and both chord ends are chamfered, so the
 * side chamfer follows the slot ends' curve and joins the end-rim chamfer without a step.
 */
function slotSideChamfer(s: TipSpec, floor: number): THREE.BufferGeometry[] {
  const { start, len, rs, chamfer: c } = s.slot;
  if (c <= 0) return [];
  const back = slotEnd(s.slot.back, start, rs, floor);
  const front = slotEnd(s.slot.front, -(start + len), rs, floor).map(
    ([y, z]) => [-y, z] as [number, number],
  );
  const out: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const rings: V3[][] = [];
    // Dense where the slot ends curve, sparse along the flat floor.
    const lb = Math.min(s.slot.back.len + c, len / 2);
    const lf = Math.min(s.slot.front.len + c, len / 2);
    const ys: number[] = [];
    for (let i = 0; i <= 32; i++) ys.push(start + (lb * i) / 32);
    for (let i = 1; i < 16; i++) ys.push(start + lb + ((len - lb - lf) * i) / 16);
    for (let i = 0; i <= 32; i++) ys.push(start + len - lf + (lf * i) / 32);
    for (const y of ys) {
      const zc = slotDepthAt(back, front, y, rs, floor);
      if (zc > rs - 0.3 || Math.abs(zc) >= rs - 0.3) continue;
      const xc = Math.sqrt(rs * rs - zc * zc);
      const cc = Math.min(c, 0.8 * xc);
      const th = Math.atan2(zc, xc) - cc / rs; // on the circle, below the corner
      const P2: [number, number] = [side * rs * Math.cos(th), rs * Math.sin(th)];
      const C: [number, number] = [side * xc, zc];
      const P1: [number, number] = [side * (xc - cc), zc];
      // Stretch the chamfer line 1 mm past both faces it joins (slot bottom inside the cut,
      // shank surface outside), so no wedge edge lies exactly on a surface.
      const ux = (P2[0] - P1[0]) / Math.hypot(P2[0] - P1[0], P2[1] - P1[1]);
      const uz = (P2[1] - P1[1]) / Math.hypot(P2[0] - P1[0], P2[1] - P1[1]);
      const A: [number, number] = [P1[0] - ux, P1[1] - uz];
      const B: [number, number] = [P2[0] + ux, P2[1] + uz];
      // Outside point beyond the corner, so the wedge A–B–O covers it.
      const O: [number, number] = [
        C[0] + 3 * (C[0] - (P1[0] + P2[0]) / 2),
        C[1] + 3 * (C[1] - (P1[1] + P2[1]) / 2),
      ];
      rings.push([A, B, O].map(([x, z]) => [x, y, z] as V3));
    }
    if (rings.length >= 2) out.push(loftMesh(rings, (p) => [p[0], p[2]], new Set([0, 1, 2])));
  }
  return out;
}

/** Wedge prism whose half-width shrinks to e/2 at y = L. Flats face ±X; extruded along Z. */
function wedgePrism(s: TipSpec, e: number): THREE.BufferGeometry {
  const th = Math.tan(deg(s.angle! / 2));
  const W = maxRadius(s) + 60;
  const yW = s.L - (W - e / 2) / th;
  const xk = Math.max(0.3, e / 2 - th);
  const sh = new THREE.Shape();
  sh.moveTo(-W, -60);
  sh.lineTo(W, -60);
  sh.lineTo(W, yW);
  sh.lineTo(xk, s.L + 1);
  sh.lineTo(xk, s.L + 20);
  sh.lineTo(-xk, s.L + 20);
  sh.lineTo(-xk, s.L + 1);
  sh.lineTo(-W, yW);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 2 * W, bevelEnabled: false });
  g.translate(0, 0, -W);
  return g;
}

/** Largest radius along the tool (any section). */
export const maxRadius = (s: TipSpec): number => Math.max(...s.sections.map((x) => x.r));

export function buildTip(s: TipSpec, materials: THREE.Material[], segs = 160): THREE.Mesh {
  const ev = new Evaluator();
  ev.useGroups = true;
  ev.attributes = ['position', 'uv', 'normal'];

  let brush = new Brush(revolve(profileRuns(s), segs), materials);
  brush.updateMatrixWorld();

  const sides: [number, number][] = [[0, s.slot.floor]];
  if (s.slot.count === 2) sides.push([Math.PI, s.slot.floorB]);
  for (const [rot, floor] of sides) {
    for (const g of [slotCutter(s, floor), ...slotSideChamfer(s, floor)]) {
      const c = new Brush(g, materials[MAT.MACHINED]);
      c.rotation.y = rot;
      c.updateMatrixWorld();
      brush = ev.evaluate(brush, c, SUBTRACTION);
    }
  }

  if (s.type === 'chisel' || s.type === 'pyramid') {
    const e = Math.max(3, 0.03 * s.D); // edge land
    const wedge = wedgePrism(s, e);
    // Default flats face ±X, so the edge runs along Z: perpendicular to the slot faces.
    const base = s.chiselEdge === 'parallel' ? Math.PI / 2 : 0;
    const a = new Brush(wedge, materials[MAT.MACHINED]);
    a.rotation.y = base;
    a.updateMatrixWorld();
    brush = ev.evaluate(brush, a, INTERSECTION);
    if (s.type === 'pyramid') {
      const b = new Brush(wedge.clone(), materials[MAT.MACHINED]);
      b.rotation.y = base + Math.PI / 2;
      b.updateMatrixWorld();
      brush = ev.evaluate(brush, b, INTERSECTION);
    }
  }
  return new THREE.Mesh(brush.geometry, brush.material);
}
