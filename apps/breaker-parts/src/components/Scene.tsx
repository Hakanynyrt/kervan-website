import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** "Tek Parça": one black breaker tip (pointed / moil, two key slots) standing
 *  steep (65°, point down and to the left, turned 25°) on the dark page, lit like a
 *  studio product shot: a baked softbox environment (long key strip along the tool
 *  axis, cool right strip and back-left kicker, a faint ember strip), a warm key, a
 *  cool fill and an ember rim light that slowly circles it. Under the point a
 *  faint ember pool lies on an unseen floor; an ember radial glow sits behind it
 *  (CSS, on the container). No stars, no bloom, no post-processing.
 *
 *  Scroll rail (continuous, anchored to the hero element, read every frame):
 *    OPENING (scrollY 0 → heroTop)          — tip centred, 80 % of the frame tall
 *    HERO    (heroTop → heroBottom)         — turns a further −10°, shrinks and moves
 *                                             above the hero figures (phones: right of
 *                                             the heading lines)
 *    POST    (heroBottom → heroBottom+⅕ih)  — fades out; nothing is drawn after that
 *
 *  Idle: a very slow ±3.5° sway and the rim light orbiting (~12 s per turn).
 *  Reduced motion (followed live): the static approved frame, drawn only on change.
 *  Drawing is on demand: ~30 fps while idle, every frame while the pose moves,
 *  nothing while the tab is hidden or the tip has faded out.
 */
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => x * x * (3 - 2 * x);
const deg = THREE.MathUtils.degToRad;

/** Model file. Images/models are cached immutable: a changed model gets a new name. */
const MODEL_URL = '/kirici-ucu-siyah-01.glb';

// Approved look (owner, "Tek Parça", realism + pose update 2026-10-13).
const FOV_DEG = 16;
const CAM_D = 4.6;
const CAM_ELEV = -3; // camera slightly below the tool centre, looking up
const ELEV = 65; // the long axis is 65° off horizontal, point down
const TURN = 25; // turned 25° about the vertical
const LEAN = -1; // point to the screen left, striking end to the upper right
const HERO_EXTRA_YAW = -10;
const ROLL = 95; // about the long axis: both key slots read as silhouette notches
const RIM_ANGLE = 70; // rim light angle in the reduced-motion / start frame
const RIM_PERIOD_S = 12;
// Projected tool height as a share of the frame height.
const OPEN_H = 0.8;
const OPEN_Y = -0.03; // half-heights: a little low, clear of the nav
const HERO_H = 0.42;
const OPEN_H_PORTRAIT = 0.7;
const HERO_H_PORTRAIT = 0.34;
const MAX_W_PORTRAIT = 0.8; // never wider than this share of a portrait frame
// Hero position (x in half-widths, y in half-heights): above the hero figures on
// landscape; right of the heading lines on portrait.
const HERO_X = 0.5;
const HERO_Y = 0.33;
const HERO_X_PORTRAIT = 0.65;
const HERO_Y_PORTRAIT = 0.24;

/** Studio environment baked once into a PMREM: a dark room with emissive
 *  softbox panels (colour × intensity, linear). The vertical strips lean with
 *  the tool axis so its reflection is one long continuous highlight. */
function buildStudioEnv(pmrem: THREE.PMREMGenerator): THREE.Texture {
  const studio = new THREE.Scene();
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const roomGeo = new THREE.BoxGeometry(12, 8, 12);
  const roomMat = new THREE.MeshBasicMaterial({ color: 0x040404, side: THREE.BackSide });
  geos.push(roomGeo);
  mats.push(roomMat);
  const room = new THREE.Mesh(roomGeo, roomMat);
  room.position.y = 2;
  studio.add(room);
  const strips = new THREE.Group();
  strips.rotation.z = deg(-(90 - ELEV));
  studio.add(strips);
  const panel = (
    parent: THREE.Object3D,
    w: number,
    h: number,
    col: number,
    I: number,
    pos: [number, number, number],
    look: [number, number, number],
  ) => {
    const g = new THREE.PlaneGeometry(w, h);
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color(col).multiplyScalar(I),
      side: THREE.DoubleSide,
    });
    geos.push(g);
    mats.push(m);
    const mesh = new THREE.Mesh(g, m);
    parent.add(mesh);
    mesh.position.set(...pos);
    parent.updateMatrixWorld(true);
    mesh.lookAt(parent.localToWorld(new THREE.Vector3(...look)));
  };
  panel(strips, 1.4, 6, 0xfff4e8, 16, [-3.2, 0.6, 2.2], [0, 0.3, 0]); // key strip
  panel(strips, 0.5, 6, 0xe6eef8, 7, [3.3, 0.6, -0.4], [0, 0.3, 0]); // right strip
  panel(strips, 0.5, 6, 0xcfd8e6, 3, [-4, 0.5, -2.5], [0, 0.3, 0]); // back-left kicker
  panel(strips, 0.4, 4.5, 0xff5a14, 4, [-1.2, 0.6, -3.6], [0, 0.3, 0]); // ember strip
  panel(studio, 3, 2.4, 0xffffff, 2.5, [0, 4.2, 0.8], [0, 0, 0]); // top box
  panel(studio, 6, 6, 0xff6a1a, 0.2, [0, -1.4, 0], [0, 1, 0]); // ember floor
  const tex = pmrem.fromScene(studio, 0.02).texture;
  geos.forEach((g) => g.dispose());
  mats.forEach((m) => m.dispose());
  return tex;
}

/** 128 px tileable 5-octave value noise (forged surface), drawn once. */
function makeNoiseTexture(): THREE.CanvasTexture {
  const N = 128;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  if (g) {
    const img = g.createImageData(N, N);
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const octave = (f: number) => {
      const G: number[] = [];
      for (let i = 0; i < f * f; i++) G.push(rnd());
      const v = (i: number, j: number) => G[(((j % f) + f) % f) * f + (((i % f) + f) % f)] ?? 0;
      return (x: number, y: number) => {
        const fx = (x * f) / N,
          fy = (y * f) / N;
        const x0 = Math.floor(fx),
          y0 = Math.floor(fy);
        const sx = smooth(fx - x0),
          sy = smooth(fy - y0);
        return (
          (v(x0, y0) * (1 - sx) + v(x0 + 1, y0) * sx) * (1 - sy) +
          (v(x0, y0 + 1) * (1 - sx) + v(x0 + 1, y0 + 1) * sx) * sy
        );
      };
    };
    const octs = [octave(4), octave(8), octave(16), octave(32), octave(64)];
    const wts = [0.3, 0.25, 0.2, 0.15, 0.1];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let n = 0;
        for (let k = 0; k < 5; k++) n += (octs[k]?.(x, y) ?? 0) * (wts[k] ?? 0);
        const i = (y * N + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(n * 255);
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // Sampled with a cylindrical mapping in the shader (no UVs in the model):
  // no mipmaps, so the wrap of the angle leaves no seam.
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/** Forged-surface roughness noise, a light bump and the key-slot occlusion,
 *  added to a standard material. The noise is mapped around the long axis
 *  (3 tiles around, 5 along the length) from the object-space position. */
function addSurfaceDetail(
  mat: THREE.MeshStandardMaterial,
  cacheKey: string,
  noise: THREE.Texture,
  roughVar: number,
  bumpScale: number,
  axis: { swizzle: string; alongScale: number },
) {
  mat.customProgramCacheKey = () => cacheKey;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uNoise = { value: noise };
    sh.uniforms.uRoughVar = { value: roughVar };
    sh.uniforms.uBump = { value: bumpScale };
    sh.uniforms.uAlong = { value: axis.alongScale };
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float ao;\nvarying float vAO;\nvarying vec3 vObjP;',
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\nvAO = ao;\nvObjP = position.${axis.swizzle};`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform sampler2D uNoise;
uniform float uRoughVar;
uniform float uBump;
uniform float uAlong;
varying float vAO;
varying vec3 vObjP; // xy across the long axis, z along it
vec3 cvPerturb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
  vec3 vSigmaX = normalize( dFdx( surf_pos ) );
  vec3 vSigmaY = normalize( dFdy( surf_pos ) );
  vec3 R1 = cross( vSigmaY, surf_norm );
  vec3 R2 = cross( surf_norm, vSigmaX );
  float fDet = dot( vSigmaX, R1 ) * faceDirection;
  vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
  return normalize( abs( fDet ) * surf_norm - vGrad );
}`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `vec2 cvUv = vec2( atan( vObjP.y, vObjP.x ) * ( 3.0 / 6.2831853 ), vObjP.z * uAlong );
float cvH = texture2D( uNoise, cvUv ).g;
float roughnessFactor = roughness + ( cvH - 0.5 ) * 2.0 * uRoughVar;`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
if ( uBump > 0.0 ) normal = cvPerturb( - vViewPosition, normal, vec2( dFdx( cvH ), dFdy( cvH ) ) * uBump, faceDirection );`,
      )
      .replace(
        '#include <aomap_fragment>',
        `#include <aomap_fragment>
reflectedLight.indirectDiffuse *= vAO;
reflectedLight.indirectSpecular *= vAO * vAO;
reflectedLight.directDiffuse *= mix( 1.0, vAO, 0.6 );
reflectedLight.directSpecular *= mix( 1.0, vAO, 0.6 );`,
      );
  };
}

/** Per-vertex occlusion for the key slots: a vertex below the local outer radius
 *  (max radius within ±2 of ~200 bins along the long axis) is darkened by up to
 *  35 %. The end faces are left alone. Positions are in the model's own units. */
function computeSlotAO(geos: THREE.BufferGeometry[], axisIdx: number) {
  const BINS = 200;
  const a = (axisIdx + 1) % 3,
    b = (axisIdx + 2) % 3;
  let lo = Infinity,
    hi = -Infinity;
  for (const g of geos) {
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const t = p.getComponent(i, axisIdx);
      lo = Math.min(lo, t);
      hi = Math.max(hi, t);
    }
  }
  const L = Math.max(1e-9, hi - lo);
  const binOf = (t: number) => Math.min(BINS - 1, Math.max(0, Math.floor(((t - lo) / L) * BINS)));
  const rmax = new Float32Array(BINS);
  for (const g of geos) {
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const k = binOf(p.getComponent(i, axisIdx));
      rmax[k] = Math.max(rmax[k] ?? 0, Math.hypot(p.getComponent(i, a), p.getComponent(i, b)));
    }
  }
  const rnb = new Float32Array(BINS);
  for (let k = 0; k < BINS; k++) {
    let m = 0;
    for (let j = Math.max(0, k - 2); j <= Math.min(BINS - 1, k + 2); j++)
      m = Math.max(m, rmax[j] ?? 0);
    rnb[k] = m;
  }
  for (const g of geos) {
    const p = g.getAttribute('position');
    const ao = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) {
      const tAx = p.getComponent(i, axisIdx);
      const u = (tAx - lo) / L;
      if (u < 0.03 || u > 0.97) {
        ao[i] = 1;
        continue;
      }
      const r = Math.hypot(p.getComponent(i, a), p.getComponent(i, b));
      const t = clamp01(((rnb[binOf(tAx)] ?? 0) - r) / L / 0.02);
      ao[i] = 1 - 0.35 * smooth(t);
    }
    g.setAttribute('ao', new THREE.BufferAttribute(ao, 1));
  }
}

/** Soft ember pool under the point (additive, on an unseen floor). */
function makePoolTexture(): THREE.CanvasTexture {
  const N = 128;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
    grad.addColorStop(0, 'rgba(255,106,26,1)');
    grad.addColorStop(0.25, 'rgba(232,67,27,0.45)');
    grad.addColorStop(0.6, 'rgba(232,67,27,0.12)');
    grad.addColorStop(1, 'rgba(232,67,27,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, N, N);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Round soft-edged sprite for the key star. 64×64 radial gradient drawn once. */
function makeStarSprite(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** One small star in a colour used nowhere else. It circles behind the tip;
 *  clicking it calls `onSecret` (the owner's hidden way into /teknik-bilgiler —
 *  the page itself is still password-protected and reachable by URL). */
const KEY_STAR_COLOR = new THREE.Color(0x3ee6b4);
const KEY_STAR_HIT_PX = 28;
/** Key star depth behind the tip (world units; the tip is 1 unit long). */
const KEY_BEHIND = 0.8;

export default function Scene({ onSecret }: { onSecret?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSecretRef = useRef(onSecret);
  onSecretRef.current = onSecret;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const container: HTMLDivElement = el;

    let raf = 0;
    const wake = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
    };

    // Follows the OS setting live, not just its value at mount.
    const reducedMq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduced = reducedMq?.matches ?? false;
    const onReducedChange = () => {
      reduced = reducedMq?.matches ?? false;
      wake();
    };
    reducedMq?.addEventListener?.('change', onReducedChange);

    // ─── Renderer ────────────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      // No WebGL (blocked, old GPU, headless): silently leave a soft ember glow
      // instead of an empty black opening.
      container.style.background =
        'radial-gradient(ellipse at 50% 55%, color-mix(in srgb, var(--color-brand) 16%, transparent), transparent 60%)';
      reducedMq?.removeEventListener?.('change', onReducedChange);
      return;
    }
    renderer.setClearAlpha(0);
    // Phones render at most 1.5x, desktops 2x.
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const DPR = Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1);
    // The drawing buffer must stay within what the GPU accepts, whatever the
    // viewport: clamp its size to the renderbuffer/texture/viewport limits.
    const gl = renderer.getContext();
    const glMax = (p: number) => {
      const v = Number(gl.getParameter(p));
      return Number.isFinite(v) && v > 0 ? v : 4096;
    };
    const vpDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as ArrayLike<number> | null;
    const maxSide = Math.min(glMax(gl.MAX_RENDERBUFFER_SIZE), glMax(gl.MAX_TEXTURE_SIZE));
    const MAX_W = Math.min(maxSide, vpDims?.[0] || maxSide);
    const MAX_H = Math.min(maxSide, vpDims?.[1] || maxSide);
    const ratioFor = (W: number, H: number) => Math.max(0.1, Math.min(DPR, MAX_W / W, MAX_H / H));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Visual viewport: iOS Safari URL-bar collapse changes the visible height
    // while a fixed `inset:0` element re-flows late. The height is clamped (never
    // taller than the layout viewport or MAX_CSS_H) so a very tall window cannot
    // make a huge drawing buffer.
    const MAX_CSS_H = 1400;
    const w = () =>
      Math.floor(window.visualViewport?.width ?? window.innerWidth ?? container.clientWidth) || 0;
    const h = () =>
      Math.floor(
        Math.min(
          window.visualViewport?.height ?? window.innerHeight ?? container.clientHeight,
          window.innerHeight || MAX_CSS_H,
          MAX_CSS_H,
        ),
      ) || 0;
    const W0 = Math.max(1, w());
    const H0 = Math.max(1, h());
    renderer.setPixelRatio(ratioFor(W0, H0));
    renderer.setSize(W0, H0, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = `${H0}px`;
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // GPU context loss: stop drawing until three restores it.
    let contextLost = false;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
      wake();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    // ─── Scene, camera, environment, lights ──────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV_DEG, W0 / H0, 0.05, 50);
    camera.position.set(0, Math.sin(deg(CAM_ELEV)) * CAM_D, Math.cos(deg(CAM_ELEV)) * CAM_D);
    camera.lookAt(0, 0, 0);
    const TAN = Math.tan(deg(FOV_DEG / 2));

    // Metal reflects the environment; without one it renders flat black.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = buildStudioEnv(pmrem);
    scene.environment = envTex;
    scene.environmentIntensity = 1;

    const key = new THREE.DirectionalLight(0xfff1e0, 1.6);
    key.position.set(-2.5, 3.5, 2.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fb4d0, 0.25);
    fill.position.set(4, 1, 2);
    scene.add(fill);
    const RIM_I = 2.6;
    const rim = new THREE.DirectionalLight(0xff6a1a, RIM_I);
    scene.add(rim);
    // Rim position on its orbit (angle a), turned with the tip's extra hero yaw
    // (dy) so the hero turn keeps the approved light-to-tip relation.
    // Around 115° the orbit passes in front of the tip, above it, where the ember
    // would flood the front instead of edging it: dim it there.
    const RIM_DIP = deg(115);
    const RIM_DIP_W = deg(25);
    const setRim = (a: number, dy = 0) => {
      const d = Math.atan2(Math.sin(a - RIM_DIP), Math.cos(a - RIM_DIP)) / RIM_DIP_W;
      rim.intensity = RIM_I * (1 - 0.8 * Math.exp(-d * d));
      const x = Math.cos(a) * 3;
      const z = Math.sin(a) * 3 - 2.5;
      rim.position.set(
        x * Math.cos(dy) + z * Math.sin(dy),
        2.2,
        z * Math.cos(dy) - x * Math.sin(dy),
      );
    };
    setRim(deg(RIM_ANGLE));

    // Every surface black (owner): forged body with a fine roughness noise and
    // the machined faces (key slots, ends) as smoother metal.
    const noiseTex = makeNoiseTexture();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x202226,
      metalness: 0.6,
      roughness: 0.34,
    });
    const machinedMat = new THREE.MeshStandardMaterial({
      color: 0x1e2024,
      metalness: 1,
      roughness: 0.38,
    });

    // Ember pool on the unseen floor under the point (not part of the tip).
    const poolTex = makePoolTexture();
    const poolMat = new THREE.MeshBasicMaterial({
      map: poolTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const poolGeo = new THREE.PlaneGeometry(1, 1);
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.renderOrder = -1;
    pool.visible = false;
    scene.add(pool);

    // ─── Group hierarchy: outer (pose) > roll > model ────────────────
    // outer: position, scale and the pose quaternion (the long axis, local −X at the
    // point, along `pointDir`); roll: about the long axis (X).
    const outer = new THREE.Group();
    const rollG = new THREE.Group();
    rollG.rotation.x = deg(ROLL);
    outer.add(rollG);
    outer.visible = false;
    scene.add(outer);
    const e = deg(ELEV),
      tn = deg(TURN);
    const pointDir = new THREE.Vector3(
      LEAN * Math.cos(e) * Math.cos(tn),
      -Math.sin(e),
      LEAN * Math.cos(e) * Math.sin(tn),
    ).normalize();
    const qBase = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, 0, 0), pointDir);
    const qYaw = new THREE.Quaternion();
    const qNod = new THREE.Quaternion();
    const AX_X = new THREE.Vector3(1, 0, 0);
    const AX_Y = new THREE.Vector3(0, 1, 0);
    // The tool's world-space extent at unit scale in the base pose (set on load).
    const unitBox = { w: 1, h: 1 };

    // ─── Key star ────────────────────────────────────────────────────
    const starSprite = makeStarSprite();
    const keyMat = new THREE.SpriteMaterial({
      map: starSprite,
      color: KEY_STAR_COLOR,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const keyStar = new THREE.Sprite(keyMat);
    scene.add(keyStar);
    let sceneVisible = true;

    // ─── Model ───────────────────────────────────────────────────────
    let modelLoaded = false;
    let loadedAt = 0;
    let disposed = false;
    const loaded: THREE.BufferGeometry[] = [];
    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        try {
          const model = gltf.scene;
          const meshGeos: THREE.BufferGeometry[] = [];
          model.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            const name = (mesh.material as THREE.Material).name;
            (mesh.material as THREE.Material).dispose();
            mesh.material = name === 'machined' ? machinedMat : bodyMat;
            loaded.push(mesh.geometry);
            meshGeos.push(mesh.geometry);
          });
          // Centre on the bbox, long axis → X, length 1.
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const piv = new THREE.Group();
          model.position.sub(center);
          piv.add(model);
          const L = Math.max(size.x, size.y, size.z);
          const axisIdx = size.y === L ? 1 : size.z === L ? 2 : 0;
          if (axisIdx === 1) piv.rotation.z = Math.PI / 2;
          else if (axisIdx === 2) piv.rotation.y = Math.PI / 2;
          piv.scale.setScalar(1 / Math.max(1e-6, L));
          rollG.add(piv);

          // Surface detail in the model's own (geometry) units.
          let gLo = Infinity,
            gHi = -Infinity;
          for (const g of meshGeos) {
            g.computeBoundingBox();
            const bb = g.boundingBox;
            if (!bb) continue;
            gLo = Math.min(gLo, bb.min.getComponent(axisIdx));
            gHi = Math.max(gHi, bb.max.getComponent(axisIdx));
          }
          const gL = Math.max(1e-9, gHi - gLo);
          computeSlotAO(meshGeos, axisIdx);
          const axis = {
            swizzle: ['yzx', 'xzy', 'xyz'][axisIdx] ?? 'xzy',
            alongScale: 5 / gL,
          };
          addSurfaceDetail(bodyMat, 'kv-tip-body', noiseTex, 0.16, 0.25, axis);
          addSurfaceDetail(machinedMat, 'kv-tip-machined', noiseTex, 0, 0, axis);

          // Extent of the posed tool at unit scale, for sizing by height.
          outer.quaternion.copy(qBase);
          outer.scale.setScalar(1);
          outer.position.set(0, 0, 0);
          outer.updateMatrixWorld(true);
          const ext = new THREE.Box3().setFromObject(outer).getSize(new THREE.Vector3());
          unitBox.w = Math.max(1e-3, ext.x);
          unitBox.h = Math.max(1e-3, ext.y);
          outer.visible = true;
          modelLoaded = true;
          loadedAt = performance.now();
          wake();
        } catch (err) {
          console.error('[scene] post-load processing failed', err);
        }
      },
      undefined,
      (err) => {
        console.warn('[scene] GLB load failed, glow stays', err);
      },
    );

    // ─── Resize ──────────────────────────────────────────────────────
    const onResize = () => {
      const W = w(),
        H = h();
      // Hidden / collapsed viewport (0 × n): keep the last size, draw nothing.
      if (W <= 0 || H <= 0) return;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(ratioFor(W, H));
      renderer.setSize(W, H, false);
      renderer.domElement.style.height = `${H}px`;
      lastGlow = '';
      wake();
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    window.visualViewport?.addEventListener('resize', onResize);

    // ─── Scroll phase ────────────────────────────────────────────────
    //   0..1 OPENING, 1..2 HERO, 2..3 POST (fade). Past 3 nothing is drawn.
    let phase = 0;
    const updatePhase = () => {
      const sy = window.scrollY;
      const ih = window.innerHeight;
      const hero = document.querySelector<HTMLElement>('[data-scene-pose="hero"]');
      const r = hero?.getBoundingClientRect();
      const heroTop = r ? r.top + sy : 0;
      const heroBot = r ? r.bottom + sy : ih;
      const heroSpan = Math.max(1, heroBot - heroTop);
      // Once OpeningHold has unmounted (the visitor is past the opening) the hero
      // sits at the top of the page: the opening is over, so the tip keeps its
      // hero pose even at scrollY 0.
      const holding = !!document.querySelector('[data-scene-pose="opening"]');
      if (holding && sy < heroTop) phase = heroTop > 0 ? sy / heroTop : 1;
      else if (sy < heroBot) phase = 1 + Math.max(0, sy - heroTop) / heroSpan;
      else phase = 2 + Math.min(1, (sy - heroBot) / (ih * 0.2));
    };
    const onScroll = () => {
      updatePhase();
      wake();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    updatePhase();

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        lastTickT = performance.now();
        wake();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // ─── Frame ───────────────────────────────────────────────────────
    const startTime = performance.now();
    let lastTickT = startTime;
    let lastRender = 0;
    let lastGlow = '';
    let first = true;
    // Eased pose accumulator: x/y in half-heights, scale, extra yaw (degrees).
    const cur = { x: 0, y: 0, s: 1, extraYaw: 0 };
    const proj = new THREE.Vector3();
    const pointWorld = new THREE.Vector3();

    function tick() {
      raf = 0;
      const now = performance.now();
      // Layout can shift without a scroll event (OpeningHold unmounting).
      updatePhase();
      const t = (now - startTime) / 1000;
      const dt = Math.min(0.1, (now - lastTickT) / 1000);
      lastTickT = now;
      const vw = w();
      const vh = h();
      if (vw <= 0 || vh <= 0) return;
      const aspect = vw / vh;
      const H2 = CAM_D * TAN; // half the visible height at the tip's plane
      const W2 = H2 * aspect;
      const portrait = aspect < 0.85;

      const pose = smooth(clamp01((phase - 0.6) / 0.4));
      const fade = clamp01((phase - 1.7) / 0.3);

      // Size by projected height (the tip stands steep); on portrait screens also
      // never wider than MAX_W_PORTRAIT of the frame.
      const openH = portrait ? OPEN_H_PORTRAIT : OPEN_H;
      let s0 = (openH * 2 * H2) / unitBox.h;
      if (portrait) s0 = Math.min(s0, (MAX_W_PORTRAIT * 2 * W2) / unitBox.w);
      // Hero pose: right third above the figures on landscape; right of the
      // heading lines (smaller) on portrait.
      const heroX = portrait ? HERO_X_PORTRAIT : HERO_X;
      const heroY = portrait ? HERO_Y_PORTRAIT : HERO_Y;
      const openY = portrait ? 0 : OPEN_Y;
      const heroS = portrait ? HERO_H_PORTRAIT / OPEN_H_PORTRAIT : HERO_H / OPEN_H;
      const tx = lerp(0, heroX, pose) * aspect; // half-height units
      const ty = lerp(openY, heroY, pose);
      const ts = s0 * lerp(1, heroS, pose);
      const tyaw = lerp(0, HERO_EXTRA_YAW, pose);
      const targetO = 1 - fade;

      let moving = false;
      if (!reduced && !first) {
        const a = 1 - Math.exp(-dt / 0.18);
        const step = (k: 'x' | 'y' | 's' | 'extraYaw', target: number, eps: number) => {
          const d = target - cur[k];
          if (Math.abs(d) > eps) moving = true;
          cur[k] += d * a;
        };
        step('x', tx, 1e-4);
        step('y', ty, 1e-4);
        step('s', ts, 1e-4);
        step('extraYaw', tyaw, 0.01);
      } else {
        cur.x = tx;
        cur.y = ty;
        cur.s = ts;
        cur.extraYaw = tyaw;
      }
      first = false;

      // Idle sway (±3.5° yaw, ±1.2° nod) and the orbiting rim light.
      const sway = reduced ? 0 : Math.sin((t * Math.PI * 2) / 14) * 3.5;
      const nod = reduced ? 0 : Math.sin((t * Math.PI * 2) / 19 + 1) * 1.2;
      outer.position.set(cur.x * H2, cur.y * H2, 0);
      outer.scale.setScalar(cur.s);
      qYaw.setFromAxisAngle(AX_Y, deg(cur.extraYaw + sway));
      qNod.setFromAxisAngle(AX_X, deg(nod));
      outer.quaternion.copy(qYaw).multiply(qNod).multiply(qBase);
      setRim(deg(RIM_ANGLE) + (reduced ? 0 : (t / RIM_PERIOD_S) * Math.PI * 2), deg(cur.extraYaw));

      // Ember pool under the point (the point is local −X at half the length).
      outer.updateMatrixWorld();
      pointWorld.set(-0.5, 0, 0);
      outer.localToWorld(pointWorld);
      const poolR = 0.38 * 2 * cur.s;
      pool.position.copy(pointWorld);
      pool.scale.set(poolR, poolR * lerp(3, 4.5, pose), 1);
      poolMat.opacity = lerp(0.5, 0.3, pose);
      pool.visible = modelLoaded;

      // A short fade-in once the model arrives (instant under reduced motion).
      const loadIn = !modelLoaded ? 0 : reduced ? 1 : clamp01((now - loadedAt) / 600);
      if (modelLoaded && loadIn < 1) moving = true;
      const opacity = targetO * loadIn;
      container.style.opacity = String(opacity);
      sceneVisible = opacity > 0.5;

      // Ember glow behind the tip (CSS, so it costs nothing to draw), sitting low,
      // toward the point.
      proj.copy(outer.position).project(camera);
      const gx = Math.round(((proj.x + 1) / 2) * vw);
      const gy = Math.round(((1 - proj.y) / 2) * vh + vh * 0.12);
      const gr = Math.round(vh * lerp(0.8, portrait ? 0.5 : 0.62, pose));
      const glow = `radial-gradient(circle ${gr}px at ${gx}px ${gy}px, rgba(232,67,27,0.16), rgba(232,67,27,0.045) 45%, rgba(232,67,27,0) 100%)`;
      if (glow !== lastGlow) {
        container.style.background = glow;
        lastGlow = glow;
      }

      // Key star: ellipse behind the tip, sized to stay inside the frame. Same
      // screen size and path as before the scene change.
      const kH = (CAM_D + KEY_BEHIND) * TAN;
      const kRx = Math.min(0.523, 0.7 * aspect) * kH;
      const keyA = reduced ? Math.PI * 0.9 : t * 0.2;
      keyStar.position.set(
        cur.x * kH + Math.cos(keyA) * kRx,
        Math.sin(keyA) * 0.2615 * kH,
        -KEY_BEHIND,
      );
      keyStar.scale.setScalar(0.0567 * kH);
      keyMat.opacity = reduced ? 1 : 0.8 + Math.sin(t * 1.3) * 0.2;

      // Draw: every frame while the pose moves, ~30 fps while idling, once when
      // reduced. Nothing before the model arrives (its load wakes the loop) or once
      // faded out (a scroll back wakes it).
      const invisible = targetO < 0.01;
      const animating = modelLoaded && !invisible && (moving || !reduced);
      if (
        modelLoaded &&
        !invisible &&
        !contextLost &&
        (moving || reduced || now - lastRender > 31)
      ) {
        renderer.render(scene, camera);
        lastRender = now;
      }
      if (animating) raf = requestAnimationFrame(tick);
    }
    wake();

    // ─── Key star hit-testing ────────────────────────────────────────
    // The canvas is pointer-events:none behind the page, so listen on the
    // window and compare the pointer with the star's projected position.
    const raycaster = new THREE.Raycaster();
    const keyWorld = new THREE.Vector3();
    const INTERACTIVE = 'a,button,input,select,textarea,label,summary,[role="button"],[tabindex]';
    const overKeyStar = (e: MouseEvent): boolean => {
      if (!sceneVisible || !onSecretRef.current) return false;
      const target = e.target as Element | null;
      if (target?.closest?.(INTERACTIVE)) return false;
      keyStar.getWorldPosition(keyWorld);
      const ndc = keyWorld.clone().project(camera);
      if (ndc.z > 1) return false;
      const rect = renderer.domElement.getBoundingClientRect();
      const sx = rect.left + ((ndc.x + 1) / 2) * rect.width;
      const sy = rect.top + ((1 - ndc.y) / 2) * rect.height;
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > KEY_STAR_HIT_PX) return false;
      // Not while it passes behind the tip (hidden from view).
      raycaster.set(camera.position, keyWorld.clone().sub(camera.position).normalize());
      const dist = camera.position.distanceTo(keyWorld);
      const hit = raycaster.intersectObject(outer, true)[0];
      return !(hit && hit.distance < dist);
    };
    let hovering = false;
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const over = overKeyStar(e);
      if (over !== hovering) {
        hovering = over;
        document.documentElement.style.cursor = over ? 'pointer' : '';
      }
    };
    const onClick = (e: MouseEvent) => {
      if (overKeyStar(e)) onSecretRef.current?.();
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('click', onClick);

    // ─── Cleanup ─────────────────────────────────────────────────────
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('click', onClick);
      if (hovering) document.documentElement.style.cursor = '';
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMq?.removeEventListener?.('change', onReducedChange);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      window.visualViewport?.removeEventListener('resize', onResize);
      loaded.forEach((g) => g.dispose());
      bodyMat.dispose();
      machinedMat.dispose();
      noiseTex.dispose();
      poolGeo.dispose();
      poolMat.dispose();
      poolTex.dispose();
      keyMat.dispose();
      starSprite.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="scene-bg" aria-hidden="true" />;
}
