import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/** Section-tied chisel poses. The active section's pose is the lerp
 *  target; current pose eases toward it over a few frames. Y rotation
 *  is independent (continuous slow revolution); these only set the
 *  baseline X/Z lean, the world position of the orbit centre, the
 *  scale multiplier on top of the GLB-fitted size, and the canvas
 *  opacity (so content sections don't drown under the chisel).
 */
interface ScenePose {
  px: number; py: number; pz: number;
  rx: number; rz: number;
  s: number;
  o: number;
}

const POSES: Record<string, ScenePose> = {
  // Opening — bolt-upright at centre, full size, full opacity.
  // The dedicated cinematic moment.
  opening:    { px:  0,    py:  0,    pz:  0,    rx:  0,     rz:  0,     s: 1.00, o: 1.00 },

  // Hero — diagonal lean, slight left bias, near-full size.
  hero:       { px: -0.4,  py:  0.0,  pz:  0,    rx: -0.05,  rz: -0.20,  s: 0.95, o: 1.00 },

  // Products — far right corner, small (chisel as a "signature" off
  // to the side so the 4-card grid owns the centre).
  products:   { px:  1.2,  py: -0.4,  pz:  0.4,  rx:  0,     rz: -0.12,  s: 0.50, o: 0.45 },

  // Atölye — far left, tucked behind, even smaller (carousel + dots
  // claim the visual focus; chisel as ambient framing).
  atolye:     { px: -1.4,  py:  0.2,  pz:  0.3,  rx:  0,     rz: -0.18,  s: 0.40, o: 0.35 },

  // Brand marquee — top-right; dim so the marquee row reads cleanly.
  brands:     { px:  1.3,  py:  0.4,  pz:  0,    rx:  0,     rz: -0.10,  s: 0.45, o: 0.40 },

  // Craft — left, medium scale, slight forward tilt. Story section
  // can carry a stronger chisel presence (atelier mood).
  craft:      { px: -1.0,  py: -0.2,  pz: -0.2,  rx: -0.04,  rz: -0.15,  s: 0.60, o: 0.55 },

  // Industries — top-right, small. The list reads top-down; chisel
  // sits like a counterweight up there.
  industries: { px:  1.1,  py:  0.5,  pz:  0.2,  rx:  0,     rz: -0.10,  s: 0.40, o: 0.35 },

  // Contact — top-left, smallest. Reads as a quiet signature in the
  // form's opposite corner.
  contact:    { px: -1.2,  py:  0.6,  pz:  0.4,  rx:  0,     rz: -0.08,  s: 0.35, o: 0.25 },
};

/** Round soft-edged star sprite. 64×64 radial gradient drawn once. */
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

interface StarLayerSpec {
  count: number;
  /** [width, height, depth] — half-widths used for placement */
  box: [number, number, number];
  /** Z-near (closest to camera, more negative pushes back) */
  zNear: number;
  /** Z-far (deeper into the scene) */
  zFar: number;
  sizeMin: number;
  sizeMax: number;
  brightnessMin: number;
  brightnessMax: number;
  sprite: THREE.CanvasTexture;
}

/** Realistic spectral mix — mostly cream, with warm whites, cool
 *  blues, ember accents and a few far-redshift dim reds. */
const STAR_PALETTE: Array<{ weight: number; color: THREE.Color }> = [
  { weight: 0.60, color: new THREE.Color(0xE8E2D6) }, // brand cream
  { weight: 0.18, color: new THREE.Color(0xFFF1D8) }, // warm white
  { weight: 0.10, color: new THREE.Color(0xC8D8FF) }, // cool blue
  { weight: 0.07, color: new THREE.Color(0xFF6A1A) }, // ember accent
  { weight: 0.05, color: new THREE.Color(0xC07060) }, // dim red
];

function pickStarColor(): THREE.Color {
  const r = Math.random();
  let acc = 0;
  for (const p of STAR_PALETTE) {
    acc += p.weight;
    if (r <= acc) return p.color;
  }
  return STAR_PALETTE[0].color;
}

/** Build one parallax layer of stars. Per-vertex colors + per-vertex
 *  sizes (via an `aSize` attribute interpreted by PointsMaterial.size
 *  scaled by sizeAttenuation — Three.js doesn't accept per-vertex size
 *  on the standard PointsMaterial, so we stagger sizes by splitting
 *  into a few size buckets isn't worth it; instead we vary the *color*
 *  brightness which reads as size variance under bloom). */
function makeStarLayer(spec: StarLayerSpec): { points: THREE.Points } {
  const { count, box, zNear, zFar, sizeMin, sizeMax, brightnessMin, brightnessMax, sprite } = spec;
  const geom = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3 + 0] = (Math.random() - 0.5) * box[0];
    pos[i * 3 + 1] = (Math.random() - 0.5) * box[1];
    pos[i * 3 + 2] = zNear + Math.random() * (zFar - zNear);
    const c = pickStarColor();
    const b = brightnessMin + Math.random() * (brightnessMax - brightnessMin);
    col[i * 3 + 0] = c.r * b;
    col[i * 3 + 1] = c.g * b;
    col[i * 3 + 2] = c.b * b;
  }
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: (sizeMin + sizeMax) / 2,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95,
    vertexColors: true,
    map: sprite,
    alphaMap: sprite,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geom, mat);
  return { points };
}

/**
 * Scene — vanilla Three.js (R3F yerine). v1 pattern'i: direkt DOM mount,
 * kendi animation loop'u, kendi resize listener'ı. iOS Safari + lazy import
 * + Suspense + ErrorBoundary chain'inde tıkandığı için R3F'ten ayrıldık.
 *
 * Chisel arkaplanda eliptik orbital drift'te, görünür alana sığar.
 */
export default function Scene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    // ─── Camera framing constants ────────────────────────────────────
    // Single source of truth — `targetH` and the orbit clamp both
    // derive from these. Bring CAM_Z in to dolly the camera closer;
    // bump CHISEL_H_RATIO to fill more of the frame vertically.
    const CAM_Z = 7;
    const FOV_DEG = 28;
    const VISIBLE_H = 2 * Math.tan(THREE.MathUtils.degToRad(FOV_DEG / 2)) * CAM_Z;
    const CHISEL_H_RATIO = 0.62;

    // ─── Renderer ────────────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch (e) {
      console.error('[scene] WebGLRenderer init failed', e);
      return;
    }
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    // Cinematic colour pipeline: physically-based output, ACES Filmic
    // tone mapping (the de-facto film response curve) at 1.05 exposure
    // — gives shadows their density back and lets bright specular hits
    // roll off without clipping to white.
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // Visual viewport — iOS Safari URL-bar collapse cycles change layout
    // height while content (and a fixed `inset:0` element) re-flow late.
    // `visualViewport` always reflects the *visible* area; fall back to
    // `innerWidth/Height`, then `container.clientWidth/Height` as a last
    // resort for environments without either (very old WebViews).
    const w = () =>
      window.visualViewport?.width ?? window.innerWidth ?? container.clientWidth;
    const h = () =>
      window.visualViewport?.height ?? window.innerHeight ?? container.clientHeight;
    renderer.setSize(w(), h(), false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // ─── Scene + Camera ──────────────────────────────────────────────
    const scene = new THREE.Scene();
    // FOV 28 + camera dropped slightly below eye-line, looking up at the
    // model — classic monument/hero framing. Tighter FOV compresses
    // perspective slightly, makes the chisel feel longer and weightier.
    // CAM_Z 7 (was 9) brings the model closer for a cinematic close-up.
    const camera = new THREE.PerspectiveCamera(FOV_DEG, w() / h(), 0.1, 100);
    camera.position.set(0, -0.55, CAM_Z);
    camera.lookAt(0, 0.45, 0);

    // MeshStandardMaterial with high metalness reflects the environment;
    // without one, metallic surfaces render nearly black (only direct-light
    // specular highlights are visible) and the chisel disappears against
    // body bg #0A0A0B. v1 had this (public/scene.js:41) — restored here.
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // ─── Lights ──────────────────────────────────────────────────────
    // Cinematic 4-point: low ambient for shadow density, strong warm key
    // from camera-left (chiselled facets), dim cool fill on the right
    // (don't fully wash shadows), bright ember rim from behind-right
    // (silhouette pop against dark bg), warm sun catches the tip face.
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));

    const key = new THREE.DirectionalLight(0xffcfa0, 4.2);
    key.position.set(-3, 4, 4);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x9ca8b8, 0.35);
    fill.position.set(4, 2, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xff6a1a, 6.5);
    rim.position.set(2.4, 1, -5);
    scene.add(rim);

    const sun = new THREE.DirectionalLight(0xffe8b0, 5.6);
    sun.position.set(7, 0.8, 1.5);
    scene.add(sun);

    // ─── Starfield: layered cosmic ambiance behind the chisel ────────
    // Two parallax layers + a soft round sprite for each star.
    //
    // - Far (1800 stars, 220×160×100 box, z ∈ [-130, -30]): tiny dim
    //   stars that drift slowly, anchor the depth.
    // - Near (700 stars, 100×70×50 box, z ∈ [-62, -12]): brighter,
    //   chunkier stars that drift faster — parallax against the far
    //   layer reads as 3D depth, not wallpaper.
    //
    // Color mix is realistic spectral-ish (mostly cream, with warm
    // whites, cool blues, ember accents and a few far-redshift dim
    // reds) so the field feels varied without drifting from Mood C.
    //
    // The sprite is a 64-px radial gradient drawn once on a canvas —
    // round soft stars, not square pixels. Bloom (already at 0.85
    // threshold) twinkles the brightest near-layer stars naturally.
    const starSprite = makeStarSprite();
    const FAR = makeStarLayer({
      count: 1800,
      box: [220, 160, 100],
      zNear: -30,
      zFar: -130,
      sizeMin: 0.18,
      sizeMax: 0.28,
      brightnessMin: 0.18,
      brightnessMax: 0.55,
      sprite: starSprite,
    });
    const NEAR = makeStarLayer({
      count: 700,
      box: [100, 70, 50],
      zNear: -12,
      zFar: -62,
      sizeMin: 0.45,
      sizeMax: 0.65,
      brightnessMin: 0.55,
      brightnessMax: 1.0,
      sprite: starSprite,
    });
    scene.add(FAR.points);
    scene.add(NEAR.points);

    // ─── Postprocessing: bloom for cinematic rim glow ────────────────
    // RenderPass → UnrealBloomPass → OutputPass (does the final colour
    // space conversion when the renderer is in linear-WG mode). Bloom
    // strength is intentionally light — only the brightest highlights
    // (specular hits where rim/sun catch the polished steel) bloom; the
    // shadow body stays clean. Threshold 0.85 keeps mid-tones out of it.
    const composer = new EffectComposer(renderer);
    composer.setSize(w(), h());
    composer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(w(), h()),
      0.55,  // strength
      0.7,   // radius
      0.85,  // threshold (0..1)
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // ─── Group hierarchy: orbit > spin > model ───────────────────────
    const orbitGroup = new THREE.Group();
    const spinGroup = new THREE.Group();
    orbitGroup.add(spinGroup);
    scene.add(orbitGroup);

    // ─── Fallback ember sphere — GLB yüklenene/yüklenmezse görünür ───
    const fallbackGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const fallbackMat = new THREE.MeshStandardMaterial({
      color: 0x7a6a5a,
      metalness: 0.85,
      roughness: 0.42,
      emissive: 0xff6a1a,
      emissiveIntensity: 0.25,
    });
    const fallback = new THREE.Mesh(fallbackGeo, fallbackMat);
    spinGroup.add(fallback);

    let modelLoaded = false;

    // ─── Load GLB asynchronously, replace fallback ───────────────────
    // GLB plain glTF (DRACO compression decompressed via gltf-transform).
    // Standart GLTFLoader natively handle eder, ekstra loader gerekmez.
    const loader = new GLTFLoader();
    loader.load(
      '/kirici-uc.glb',
      (gltf) => {
        try {
          const model = gltf.scene;

          // Minimal orient: longest axis → world Y. v1 hard-coded
          // -π/2 around Z worked for tip-down (commit bc23cf30).
          // Fancy centroid heuristic kaldırıldı — sessizce throw etmek
          // riskli, simple yaklaşım daha güvenilir.
          const box1 = new THREE.Box3().setFromObject(model);
          const size1 = new THREE.Vector3();
          box1.getSize(size1);
          const longest = Math.max(size1.x, size1.y, size1.z);
          if (size1.x === longest) {
            model.rotation.z = -Math.PI / 2;
          } else if (size1.z === longest) {
            model.rotation.x = Math.PI / 2;
          }
          model.updateMatrixWorld(true);

          // Scale FIRST so model.position is computed in scaled units below.
          // (Three.js doesn't scale `position` itself; it scales children's
          // vertices. Centering pre-scale leaves a huge offset that survives
          // scaling and parks the model far below the camera frustum.)
          // Fill ~85% of visible viewport height — close-up hero framing.
          // Derived from CAM_Z/FOV constants above so a single edit
          // there re-proportions the whole composition.
          const targetH = VISIBLE_H * CHISEL_H_RATIO;
          const box2 = new THREE.Box3().setFromObject(model);
          const size2 = new THREE.Vector3();
          box2.getSize(size2);
          const s = targetH / Math.max(0.01, size2.y);
          model.scale.setScalar(s);
          model.updateMatrixWorld(true);

          // Center bbox at origin (after scale, in scaled-world units)
          const box3 = new THREE.Box3().setFromObject(model);
          const center = new THREE.Vector3();
          box3.getCenter(center);
          model.position.sub(center);

          // Material — forged tool steel, tightened for cinematic
          // specular response. Roughness dropped from 0.28 → 0.22 makes
          // highlight transitions crisper without glassing the surface;
          // envMapIntensity 1.6 lets the room env reflection contribute
          // more — combined with the bloom pass downstream, the ember
          // rim now glows along the silhouette.
          model.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0x2a2a2e,
                metalness: 0.94,
                roughness: 0.22,
                envMapIntensity: 1.6,
              });
            }
          });

          spinGroup.remove(fallback);
          fallback.geometry.dispose();
          fallback.material.dispose();
          spinGroup.add(model);
          modelLoaded = true;
        } catch (err) {
          console.error('[scene] post-load processing failed, fallback stays', err);
        }
      },
      undefined,
      (err) => {
        console.warn('[scene] GLB load failed, fallback ember stays', err);
      },
    );

    // ─── Resize listener ─────────────────────────────────────────────
    const onResize = () => {
      const W = w(), H = h();
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H, false);
      composer.setSize(W, H);
      bloom.setSize(W, H);
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    // Section-tied pose target. As the user scrolls (or snap-paginates)
    // between sections, the section whose centre is closest to the
    // viewport centre wins; its key (data-scene-pose) drives the lerp
    // target each frame. Plain mutable object — no React state, no
    // re-renders, just a pointer the rAF loop reads.
    const targetPoseKey: { current: keyof typeof POSES } = { current: 'opening' };
    const updateActiveSection = () => {
      const sections = document.querySelectorAll<HTMLElement>('[data-scene-pose]');
      if (!sections.length) return;
      const vpCenter = window.scrollY + window.innerHeight / 2;
      let bestKey = targetPoseKey.current;
      let bestDist = Infinity;
      sections.forEach((s) => {
        const key = s.dataset.scenePose;
        if (!key || !(key in POSES)) return;
        const top = s.getBoundingClientRect().top + window.scrollY;
        const center = top + s.offsetHeight / 2;
        const dist = Math.abs(vpCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestKey = key as keyof typeof POSES;
        }
      });
      targetPoseKey.current = bestKey;
    };
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    updateActiveSection(); // capture refresh-mid-page
    // visualViewport: iOS Safari URL-bar collapse fires resize *only* here,
    // not on `window`. Without this, the canvas keeps the URL-bar-expanded
    // height after the bar collapses, projecting the chisel into a buffer
    // taller than the visible area.
    window.visualViewport?.addEventListener('resize', onResize);

    // ─── Animation loop ──────────────────────────────────────────────
    const startTime = performance.now();
    let raf = 0;

    // Mutable current-pose accumulator. Each frame we exponentially
    // ease toward POSES[targetPoseKey.current] using a time-constant
    // (frame-rate independent — converges to ~95% of the gap in
    // ~3 × TC ≈ 750 ms regardless of 30/60/120 fps). Initial values
    // match the opening pose.
    const cur: ScenePose = { ...POSES.opening };
    const POSE_TC = 0.25; // seconds — feels like a slow spring without overshoot
    let lastTickT = performance.now();

    const tick = () => {
      const now = performance.now();
      const t = (now - startTime) / 1000;
      const dt = Math.min(0.05, (now - lastTickT) / 1000);
      lastTickT = now;
      const aspect = w() / h();
      const isPortrait = aspect < 0.85;

      // Resolve target. Mobile portrait scales lateral offsets down
      // so the chisel stays inside the narrow frame; pz, rotations,
      // scale, opacity are kept as-is.
      const target = POSES[targetPoseKey.current] ?? POSES.opening;
      const lateral = isPortrait ? 0.4 : 1;
      const targetPx = target.px * lateral;
      const targetPy = target.py * lateral;

      if (!reduced) {
        // Frame-rate independent exp decay — `a` is fraction of gap
        // closed this frame given dt and time-constant POSE_TC.
        const a = 1 - Math.exp(-dt / POSE_TC);
        cur.px += (targetPx - cur.px) * a;
        cur.py += (targetPy - cur.py) * a;
        cur.pz += (target.pz - cur.pz) * a;
        cur.rx += (target.rx - cur.rx) * a;
        cur.rz += (target.rz - cur.rz) * a;
        cur.s  += (target.s  - cur.s ) * a;
        cur.o  += (target.o  - cur.o ) * a;

        // Tiny breath on top of the baseline lean so the chisel reads
        // as alive even at rest. Y rotation is independent — a slow
        // continuous revolution at ~250 s / full turn.
        const breathX = Math.sin(t * 0.03) * 0.012;
        const breathZ = Math.sin(t * 0.04 + 1.5) * 0.012;
        // Sub-perceptible drift around the target position so the
        // chisel doesn't read as "frozen between sections".
        const driftX = Math.cos(t * 0.04) * 0.10;
        const driftY = Math.sin(t * 0.05) * 0.06;

        orbitGroup.position.set(cur.px + driftX, cur.py + driftY, cur.pz);
        spinGroup.rotation.x = cur.rx + breathX;
        spinGroup.rotation.y = t * 0.025;
        spinGroup.rotation.z = cur.rz + breathZ;
        spinGroup.scale.setScalar(cur.s);
        container.style.opacity = String(cur.o);
      } else {
        // Reduced motion: snap to target instantly, no breath, no
        // drift, no continuous Y rotation.
        orbitGroup.position.set(targetPx, targetPy, target.pz);
        spinGroup.rotation.set(target.rx, 0, target.rz);
        spinGroup.scale.setScalar(target.s);
        container.style.opacity = String(target.o);
      }

      // Layered parallax drift — far layer slower (anchors depth),
      // near layer faster (foreground). The relative speed is the
      // visual cue; absolute speeds are still imperceptible per-frame.
      FAR.points.rotation.y = t * 0.003;
      FAR.points.rotation.x = Math.sin(t * 0.0008) * 0.015;
      NEAR.points.rotation.y = t * 0.008;
      NEAR.points.rotation.x = Math.sin(t * 0.0014) * 0.025;

      // Fallback ember pulse — model yüklenene kadar
      if (!modelLoaded) {
        const pulse = 0.18 + Math.sin(t * 1.6) * 0.08;
        fallbackMat.emissiveIntensity = pulse;
      }

      // Composer chain (RenderPass → UnrealBloomPass → OutputPass)
      // owns the final draw — no direct renderer.render here.
      composer.render();
      raf = requestAnimationFrame(tick);
    };
    tick();

    // ─── Cleanup ─────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('scroll', updateActiveSection);
      window.visualViewport?.removeEventListener('resize', onResize);
      FAR.points.geometry.dispose();
      (FAR.points.material as THREE.PointsMaterial).dispose();
      NEAR.points.geometry.dispose();
      (NEAR.points.material as THREE.PointsMaterial).dispose();
      starSprite.dispose();
      bloom.dispose();
      composer.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="scene-bg" aria-hidden="true" />;
}
