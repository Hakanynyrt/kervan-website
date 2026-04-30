import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

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
    const CHISEL_H_RATIO = 0.85;

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

    // ─── Starfield: cosmic ambiance behind the chisel ────────────────
    // 1000 procedural points in a 120×80×60 box positioned strictly
    // behind z=-10 so the chisel always reads in front of them. 90%
    // ink-cream, 10% ember-orange — same brand palette, just scattered.
    // Random brightness 0.3–1.0; bloom pass naturally twinkles the
    // brightest ones (above 0.85 threshold) without us doing anything.
    // AdditiveBlending so stars sit on top of the dark body bg without
    // a hard cutoff, depthWrite false so they never occlude the chisel.
    const STAR_COUNT = 1000;
    const starGeom = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starCol = new Float32Array(STAR_COUNT * 3);
    const cream = new THREE.Color(0xE8E2D6);
    const ember = new THREE.Color(0xFF6A1A);
    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3 + 0] = (Math.random() - 0.5) * 120;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      starPos[i * 3 + 2] = -10 - Math.random() * 60;
      const c = Math.random() > 0.9 ? ember : cream;
      const b = 0.3 + Math.random() * 0.7;
      starCol[i * 3 + 0] = c.r * b;
      starCol[i * 3 + 1] = c.g * b;
      starCol[i * 3 + 2] = c.b * b;
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.4,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starfield = new THREE.Points(starGeom, starMat);
    scene.add(starfield);

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
    // visualViewport: iOS Safari URL-bar collapse fires resize *only* here,
    // not on `window`. Without this, the canvas keeps the URL-bar-expanded
    // height after the bar collapses, projecting the chisel into a buffer
    // taller than the visible area.
    window.visualViewport?.addEventListener('resize', onResize);

    // ─── Animation loop ──────────────────────────────────────────────
    const startTime = performance.now();
    let raf = 0;

    const tick = () => {
      const t = (performance.now() - startTime) / 1000;
      const aspect = w() / h();
      const isPortrait = aspect < 0.85;

      if (!reduced) {
        // Slowed from 0.018 → 0.012 — slower orbit + spin reads as
        // weighty/deliberate (cinematic), not jittery.
        const orbitT = t * 0.012;

        // Frustum-safe orbit clamp. Visible half-width at the chisel's
        // depth = (VISIBLE_H / 2) * aspect. Subtract chisel half-width
        // plus breathing room to get the largest safe horizontal radius;
        // ditto vertically (the chisel now fills 85% of frame height,
        // so ry must stay under ~0.26 to avoid clipping the tip).
        const halfW = (VISIBLE_H / 2) * aspect;
        const safetyMargin = 0.49; // chisel half-width + breathing room
        const rxMax = Math.max(0.1, halfW - safetyMargin);
        const ryMax = (VISIBLE_H / 2) * (1 - CHISEL_H_RATIO) - 0.02;

        const cx = isPortrait ? 0 : -0.4;
        const cy = 0.0;
        const rx = Math.min(isPortrait ? 0.18 : 0.9, rxMax);
        const ry = Math.min(isPortrait ? 0.10 : 0.20, ryMax);
        const rz = isPortrait ? 0.10 : 0.25;

        orbitGroup.position.set(
          cx + Math.cos(orbitT) * rx,
          cy + Math.sin(orbitT * 1.13) * ry,
          Math.sin(orbitT * 0.71 + 1.2) * rz,
        );

        spinGroup.rotation.y = t * 0.05;
        spinGroup.rotation.x = Math.sin(t * 0.04) * 0.07;
        spinGroup.rotation.z = Math.sin(t * 0.05 + 1.5) * 0.05;
      } else {
        // Reduced motion: statik
        const restX = isPortrait ? 0 : 1.0;
        orbitGroup.position.set(restX, 0.5, 0);
      }

      // Slow starfield drift — Y rotation creates lateral parallax,
      // tiny X rotation gives a barely-there vertical drift. Speeds
      // chosen so a full revolution takes ~21 minutes; you read it as
      // "the camera is gently floating in space" not "things spinning".
      starfield.rotation.y = t * 0.005;
      starfield.rotation.x = Math.sin(t * 0.001) * 0.02;

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
      window.visualViewport?.removeEventListener('resize', onResize);
      starGeom.dispose();
      starMat.dispose();
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
