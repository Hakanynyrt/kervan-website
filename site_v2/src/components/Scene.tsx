import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

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

    const w = () => container.clientWidth || window.innerWidth;
    const h = () => container.clientHeight || window.innerHeight;
    renderer.setSize(w(), h(), false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // ─── Scene + Camera ──────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, w() / h(), 0.1, 100);
    camera.position.set(0, 0, 9);

    // MeshStandardMaterial with high metalness reflects the environment;
    // without one, metallic surfaces render nearly black (only direct-light
    // specular highlights are visible) and the chisel disappears against
    // body bg #0A0A0B. v1 had this (public/scene.js:41) — restored here.
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // ─── Lights ──────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const key = new THREE.DirectionalLight(0xffcfa0, 3.4);
    key.position.set(-3, 4, 4);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x9ca8b8, 0.5);
    fill.position.set(4, 2, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xff6a1a, 4.6);
    rim.position.set(2, 1, -5);
    scene.add(rim);

    const sun = new THREE.DirectionalLight(0xffe8b0, 5.0);
    sun.position.set(7, 0.8, 1.5);
    scene.add(sun);

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
          const targetH = 4.82 * 0.58;
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

          // Material — warm steel + ember emissive
          model.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.material = new THREE.MeshStandardMaterial({
                color: 0x7a6a5a,
                metalness: 0.85,
                roughness: 0.38,
                emissive: 0x3a1c0a,
                emissiveIntensity: 0.18,
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
      camera.aspect = w() / h();
      camera.updateProjectionMatrix();
      renderer.setSize(w(), h(), false);
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    // ─── Animation loop ──────────────────────────────────────────────
    const startTime = performance.now();
    let raf = 0;

    const tick = () => {
      const t = (performance.now() - startTime) / 1000;
      const aspect = w() / h();
      const isPortrait = aspect < 0.85;

      if (!reduced) {
        const orbitT = t * 0.018;
        const cx = isPortrait ? 0 : -0.4;
        const cy = 0.0;
        const rx = isPortrait ? 0.55 : 1.4;
        const ry = isPortrait ? 0.45 : 0.7;
        const rz = isPortrait ? 0.3 : 0.4;

        orbitGroup.position.set(
          cx + Math.cos(orbitT) * rx,
          cy + Math.sin(orbitT * 1.13) * ry,
          Math.sin(orbitT * 0.71 + 1.2) * rz,
        );

        spinGroup.rotation.y = t * 0.08;
        // Hafif wobble — chisel'i stabil göstermek için amplitude küçük
        spinGroup.rotation.x = Math.sin(t * 0.05) * 0.10;
        spinGroup.rotation.z = Math.sin(t * 0.07 + 1.5) * 0.07;
      } else {
        // Reduced motion: statik
        const restX = isPortrait ? 0 : 1.0;
        orbitGroup.position.set(restX, 0.5, 0);
      }

      // Fallback ember pulse — model yüklenene kadar
      if (!modelLoaded) {
        const pulse = 0.18 + Math.sin(t * 1.6) * 0.08;
        fallbackMat.emissiveIntensity = pulse;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    // ─── Cleanup ─────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="scene-bg" aria-hidden="true" />;
}
