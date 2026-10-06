// Parametric breaker tip mesh from a TipSpec (@kervan/tips renderSpec). Build-time only:
// bundled into the render page that scripts/render-tips.ts drives in headless Chromium.
//
// Local frame: tool axis = +Y, striking end at y = 0, working end at y = L, millimetres.
// Key slots are flat cuts on +Z (and -Z for two keys). One revolved profile (hard edges,
// per-run material) for everything axisymmetric, then three-bvh-csg for slots and flats.
import * as THREE from 'three';
import { Brush, Evaluator, INTERSECTION, SUBTRACTION } from 'three-bvh-csg';
import type { TipSpec } from '@kervan/tips';

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

function profileRuns(s: TipSpec): { runs: Run[]; workStart: number } {
  const runs: Run[] = [];
  const { D, R, Rb, L } = s;
  const cb = Math.max(2, 0.03 * D); // striking-face chamfer
  const r0 = s.rearStep && s.Rs !== null ? s.Rs : Rb;
  runs.push({
    pts: [
      [0, 0],
      [r0 - cb, 0],
    ],
    mat: MAT.GROUND,
  });
  runs.push({
    pts: [
      [r0 - cb, 0],
      [r0, cb],
    ],
    mat: MAT.BODY,
  });
  let y = cb;
  if (s.rearStep && s.Rs !== null) {
    runs.push({
      pts: [
        [s.Rs, y],
        [s.Rs, s.stubLen],
      ],
      mat: MAT.BODY,
    });
    runs.push({
      pts: [
        [s.Rs, s.stubLen],
        [Rb, s.stubLen + (Rb - s.Rs)],
      ],
      mat: MAT.BODY,
    });
    y = s.stubLen + (Rb - s.Rs);
  }

  let workStart: number;
  const tipRuns: Run[] = [];
  if (s.type === 'moil' || s.type === 'conical') {
    const half = deg(s.angle! / 2);
    const rho = (s.type === 'moil' ? 0.06 : 0.1) * D; // blunted point radius
    const rt = rho * Math.cos(half);
    const yt = L - rho + rho * Math.sin(half);
    workStart = yt - (R - rt) / Math.tan(half);
    tipRuns.push({
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
    tipRuns.push({ pts: cap, mat: MAT.GROUND, smooth: true });
  } else if (s.type === 'blunt') {
    const c = 0.07 * D;
    workStart = L - c;
    tipRuns.push({
      pts: [
        [R, L - c],
        [R - c, L],
      ],
      mat: MAT.GROUND,
    });
    tipRuns.push({
      pts: [
        [R - c, L],
        [0, L],
      ],
      mat: MAT.GROUND,
    });
  } else {
    const c0 = 1.5; // chisel / pyramid: flats come from CSG
    workStart = L - c0;
    tipRuns.push({
      pts: [
        [R, L - c0],
        [R - c0, L],
      ],
      mat: MAT.GROUND,
    });
    tipRuns.push({
      pts: [
        [R - c0, L],
        [0, L],
      ],
      mat: MAT.GROUND,
    });
  }

  if (s.hasCollar) {
    const yc = s.collarEnd ?? s.slotStart + s.slotLen + 0.6 * D;
    const yc2 = yc + (Rb - R) / Math.tan(deg(15));
    runs.push({
      pts: [
        [Rb, y],
        [Rb, yc],
      ],
      mat: MAT.BODY,
    });
    runs.push({
      pts: [
        [Rb, yc],
        [R, yc2],
      ],
      mat: MAT.BODY,
    });
    y = yc2;
  }
  if (workStart <= y + 1) throw new Error('profile does not fit');
  runs.push({
    pts: [
      [R, y],
      [R, workStart],
    ],
    mat: MAT.BODY,
  });
  runs.push(...tipRuns);
  return { runs, workStart };
}

/** Slot cutter on +Z: shape in (axial y, radial z), extruded along X. */
function slotCutter(s: TipSpec, Rloc: number): THREE.BufferGeometry {
  const y0 = s.slotStart;
  const y1 = y0 + s.slotLen;
  const top = Rloc + 40;
  const floor = Rloc - s.t;
  const sh = new THREE.Shape();
  sh.moveTo(y0, top);
  sh.lineTo(y0, Rloc);
  if (s.slotEnd === 'tapered') {
    const ramp = Math.min(s.t / Math.tan(deg(12)), 0.3 * s.slotLen);
    sh.lineTo(y0 + ramp, floor);
    sh.lineTo(y1 - ramp, floor);
    sh.lineTo(y1, Rloc);
  } else {
    const rr = Math.min(s.t, s.slotLen / 2 - 1);
    sh.absarc(y0 + rr, Rloc, rr, Math.PI, 1.5 * Math.PI, false);
    sh.lineTo(y1 - rr, floor);
    sh.absarc(y1 - rr, Rloc, rr, 1.5 * Math.PI, 2 * Math.PI, false);
  }
  sh.lineTo(y1, top);
  sh.lineTo(y0, top);
  const W = Rloc + 40;
  const g = new THREE.ExtrudeGeometry(sh, { depth: 2 * W, bevelEnabled: false, curveSegments: 24 });
  // (sx, sy, sz) → (x = sz − W, y = sx, z = sy): a proper rotation, keeps winding
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, -W, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  return g;
}

/** Wedge prism whose half-width shrinks to e/2 at y = L. Flats face ±X; extruded along Z. */
function wedgePrism(s: TipSpec, e: number): THREE.BufferGeometry {
  const th = Math.tan(deg(s.angle! / 2));
  const W = s.Rb + 60;
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

export function buildTip(s: TipSpec, materials: THREE.Material[], segs = 160): THREE.Mesh {
  const { runs } = profileRuns(s);
  const ev = new Evaluator();
  ev.useGroups = true;
  ev.attributes = ['position', 'uv', 'normal'];

  let brush = new Brush(revolve(runs, segs), materials);
  brush.updateMatrixWorld();

  const cut = slotCutter(s, s.Rb);
  for (const rot of s.keyCount === 2 ? [0, Math.PI] : [0]) {
    const c = new Brush(cut.clone(), materials[MAT.MACHINED]);
    c.rotation.y = rot;
    c.updateMatrixWorld();
    brush = ev.evaluate(brush, c, SUBTRACTION);
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
