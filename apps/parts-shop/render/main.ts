// Build-time render page. scripts/render-tips.ts loads it in headless Chromium and calls
// window.renderTip(spec) once per SKU; the result is two transparent WebP data URLs.
import * as THREE from 'three';
import type { TipSpec } from '@kervan/tips';
import { buildTip } from './tipgen';

/** Brand "Forge Ember" (tokens.css --color-brand); a render-only rim light colour. */
const EMBER = 0xe8431b;
export const LARGE = { w: 1200, h: 800 };
export const SMALL = { w: 480, h: 320 };

declare global {
  interface Window {
    renderTip: (spec: TipSpec) => Promise<{ large: string; small: string }>;
    renderReady: boolean;
  }
}

let noise: THREE.CanvasTexture | null = null;
/** Turning rings along the axis plus soft mottling (forge scale). Deterministic. */
function noiseTexture(): THREE.CanvasTexture {
  if (noise) return noise;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const g = c.getContext('2d')!;
  const img = g.createImageData(256, 512);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rows = Array.from({ length: 512 }, () => rnd());
  const blobs = Array.from({ length: 40 }, () => [
    rnd() * 256,
    rnd() * 512,
    20 + rnd() * 60,
    rnd() - 0.5,
  ]);
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 256; x++) {
      let m = 0;
      for (const [bx, by, br, bv] of blobs) {
        const dx = Math.min(Math.abs(x - bx), 256 - Math.abs(x - bx));
        const dy = Math.min(Math.abs(y - by), 512 - Math.abs(y - by));
        m += bv * Math.exp(-(dx * dx + dy * dy) / (br * br));
      }
      const v = Math.min(1, Math.max(0, 0.8 + 0.08 * rows[y] + 0.16 * m));
      const i = (y * 256 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(v * 255);
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  noise = new THREE.CanvasTexture(c);
  noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
  noise.repeat.set(4, 1.2);
  return noise;
}

function materials(): THREE.Material[] {
  const n = noiseTexture();
  return [
    new THREE.MeshPhysicalMaterial({
      color: 0x4f5359,
      metalness: 0.8,
      roughness: 0.55,
      roughnessMap: n,
      bumpMap: n,
      bumpScale: 0.3,
    }),
    new THREE.MeshPhysicalMaterial({ color: 0x9a9fa6, metalness: 0.9, roughness: 0.28 }),
    new THREE.MeshPhysicalMaterial({ color: 0xc3c8cf, metalness: 1, roughness: 0.3 }),
  ];
}

function studioEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  const s = new THREE.Scene();
  s.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(120, 70, 120),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.022, 0.022, 0.025),
        side: THREE.BackSide,
      }),
    ),
  );
  const panel = (w: number, h: number, hex: number, k: number, p: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(hex).multiplyScalar(k),
        side: THREE.DoubleSide,
      }),
    );
    m.position.set(...p);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(60, 20, 0xffffff, 3.0, [0, 32, 6]);
  panel(18, 34, 0xfff2e6, 1.8, [-40, 10, 28]);
  panel(110, 30, 0xffffff, 0.45, [0, -4, 55]);
  panel(24, 40, 0xffffff, 0.9, [56, 8, 6]);
  panel(24, 40, 0xffffff, 0.5, [-56, 8, 6]);
  panel(110, 30, 0x9aa0a8, 0.25, [0, -30, 0]);
  panel(70, 18, 0xffffff, 1.4, [0, 24, -40]);
  panel(110, 26, 0x8c9096, 1.1, [0, -24, -44]);
  panel(110, 3, EMBER, 6.0, [0, 4, -52]);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.03).texture;
  pm.dispose();
  return tex;
}

function fitCamera(box: THREE.Box3, dir: THREE.Vector3, aspect: number, fov = 24, margin = 0.08) {
  const cam = new THREE.PerspectiveCamera(fov, aspect, 1, 1e5);
  const c = box.getCenter(new THREE.Vector3());
  const d = dir.clone().normalize();
  const corners: THREE.Vector3[] = [];
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
  let lo = 1;
  let hi = 1e5;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    cam.position.copy(c).addScaledVector(d, mid);
    cam.lookAt(c);
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();
    const ok = corners.every((p) => {
      const v = p.clone().project(cam);
      return Math.abs(v.x) <= 1 - margin && Math.abs(v.y) <= 1 - margin && v.z < 1;
    });
    if (ok) hi = mid;
    else lo = mid;
  }
  cam.position.copy(c).addScaledVector(d, hi);
  cam.lookAt(c);
  cam.near = hi / 20;
  cam.far = hi * 10;
  cam.updateProjectionMatrix();
  return cam;
}

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.setSize(LARGE.w, LARGE.h);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const env = studioEnv(renderer);
const small = document.createElement('canvas');
small.width = SMALL.w;
small.height = SMALL.h;

window.renderTip = async (spec: TipSpec) => {
  const mats = materials();
  const mesh = buildTip(spec, mats);
  const scene = new THREE.Scene();
  scene.environment = env;
  const key = new THREE.DirectionalLight(0xfff4ea, 1.4);
  key.position.set(-600, 900, 700);
  const rim = new THREE.DirectionalLight(EMBER, 5.0);
  rim.position.set(600, 120, -900);
  const rim2 = new THREE.DirectionalLight(EMBER, 2.5);
  rim2.position.set(-800, -60, -600);
  scene.add(key, rim, rim2, new THREE.HemisphereLight(0x30302e, 0x050505, 0.4));

  // Lying diagonally, working end to the lower right, key slot turned towards the viewer.
  const pivot = new THREE.Group();
  mesh.rotation.z = -Math.PI / 2;
  mesh.position.x = -spec.L / 2;
  pivot.add(mesh);
  pivot.rotation.y = -0.25;
  pivot.rotation.z = -0.42;
  scene.add(pivot);
  scene.updateMatrixWorld(true);

  const box = new THREE.Box3();
  const r = spec.Rb;
  for (const y of [0, spec.L])
    for (const x of [-r, r])
      for (const z of [-r, r])
        box.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld));
  const cam = fitCamera(box, new THREE.Vector3(0.12, 0.38, 1), LARGE.w / LARGE.h);
  renderer.render(scene, cam);

  const large = canvas.toDataURL('image/webp', 0.82);
  const g = small.getContext('2d')!;
  g.clearRect(0, 0, SMALL.w, SMALL.h);
  g.imageSmoothingQuality = 'high';
  g.drawImage(canvas, 0, 0, SMALL.w, SMALL.h);
  const smallUrl = small.toDataURL('image/webp', 0.8);

  mesh.geometry.dispose();
  for (const m of mats) m.dispose();
  return { large, small: smallUrl };
};
window.renderReady = true;
