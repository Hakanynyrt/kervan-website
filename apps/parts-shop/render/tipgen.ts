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

/** Key flat on +Z, floor plane at z = floor: shape in (axial y, radial z), extruded along X. */
function slotCutter(s: TipSpec, floor: number): THREE.BufferGeometry {
  const { start, len, rs } = s.slot;
  const y0 = start;
  const y1 = start + len;
  const top = rs + 40;
  const c = s.slot.chamfer;
  // Chamfered rim: start c before the slot edge and meet the end curve c below the surface.
  const bevel = (pts: [number, number][], y: number, dir: 1 | -1): [number, number][] => {
    if (c <= 0) return pts;
    const k = pts.findIndex(([, z]) => z <= rs - c);
    return k < 0 ? pts : [[y - dir * c, rs], ...pts.slice(k)];
  };
  const back = bevel(slotEnd(s.slot.back, y0, rs, floor, c), y0, 1);
  // Front end: build it going −y from y1, then mirror the order.
  const front = bevel(slotEnd(s.slot.front, -y1, rs, floor, c), -y1, 1)
    .map(([y, z]) => [-y, z] as [number, number])
    .reverse();
  const sh = new THREE.Shape();
  sh.moveTo(back[0][0], top);
  for (const [y, z] of back) sh.lineTo(y, z);
  for (const [y, z] of front) sh.lineTo(y, z);
  sh.lineTo(front[front.length - 1][0], top);
  sh.closePath();
  const W = maxRadius(s) + 40;
  const g = new THREE.ExtrudeGeometry(sh, { depth: 2 * W, bevelEnabled: false, curveSegments: 24 });
  // (sx, sy, sz) → (x = sz − W, y = sx, z = sy): a proper rotation, keeps winding
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, -W, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  return g;
}

/** 45° chamfers along the two long edges where a slot floor (z = floor) meets the shank. */
function slotEdgeChamfers(s: TipSpec, floor: number): THREE.BufferGeometry[] {
  const { rs, chamfer: c, start, len, back, front } = s.slot;
  if (c <= 0 || Math.abs(floor) >= rs - c) return [];
  const xe = Math.sqrt(rs * rs - floor * floor);
  const ya = start + back.len;
  const yb = start + len - front.len;
  if (yb - ya < 2 * c) return [];
  const out: THREE.BufferGeometry[] = [];
  for (const side of [1, -1]) {
    const C: [number, number] = [side * xe, floor];
    const P1: [number, number] = [side * (xe - c), floor];
    const th = Math.atan2(floor, side * xe) - side * (c / rs);
    const P2: [number, number] = [rs * Math.cos(th), rs * Math.sin(th)];
    const m: [number, number] = [(P1[0] + P2[0]) / 2, (P1[1] + P2[1]) / 2];
    const O: [number, number] = [C[0] + 3 * (C[0] - m[0]), C[1] + 3 * (C[1] - m[1])];
    const sh = new THREE.Shape();
    // Shape in (−x, z) so the axis swap below stays a proper rotation.
    sh.moveTo(-P1[0], P1[1]);
    sh.lineTo(-P2[0], P2[1]);
    sh.lineTo(-O[0], O[1]);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: yb - ya, bevelEnabled: false });
    // (sx, sy, sz) → (x = −sx, y = sz + ya, z = sy)
    g.applyMatrix4(new THREE.Matrix4().set(-1, 0, 0, 0, 0, 0, 1, ya, 0, 1, 0, 0, 0, 0, 0, 1));
    out.push(g);
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
    for (const g of [slotCutter(s, floor), ...slotEdgeChamfers(s, floor)]) {
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
