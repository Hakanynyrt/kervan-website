import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

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
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
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
    // GLB KHR_draco_mesh_compression kullanıyor → DRACOLoader şart.
    // Decoder gstatic CDN'den (Google barındırır, WASM ~200KB).
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    dracoLoader.setDecoderConfig({ type: 'js' }); // WASM unsupported fallback

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.load(
      '/kirici-uc.glb',
      (gltf) => {
        const model = gltf.scene;

        // ─── Step 1: longest axis → world Y ──────────────────────
        const box1 = new THREE.Box3().setFromObject(model);
        const size1 = new THREE.Vector3();
        box1.getSize(size1);
        const longest = Math.max(size1.x, size1.y, size1.z);
        if (size1.x === longest) {
          model.rotation.z = -Math.PI / 2;
        } else if (size1.z === longest) {
          model.rotation.x = Math.PI / 2;
        }
        // size1.y == longest → no rotation needed

        // ─── Step 2: AABB centerla origin'e ──────────────────────
        const box2 = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box2.getCenter(center);
        model.position.sub(center);

        // ─── Step 3: tip-down doğrulama (centroid heuristic) ─────
        // Chisel asimetrik: butt (kafa) bulk, tip (uç) ince. Vertex
        // centroid (kütle merkezi yaklaşımı) bulk'a doğru kayar.
        // bbox center origin'de → centroid_y > 0 ise bulk yukarıda
        // (yani tip aşağıda, doğru). centroid_y < 0 ise bulk aşağıda
        // → tip yukarıda → 180° X flip ile düzelt.
        let sumY = 0;
        let count = 0;
        const v = new THREE.Vector3();
        model.updateWorldMatrix(true, true);
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh || !mesh.geometry?.attributes?.position) return;
          const pos = mesh.geometry.attributes.position;
          // World-space Y'yi sample et (rotate edilmiş geometri için doğru)
          for (let i = 0; i < pos.count; i += 1) {
            v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
            v.applyMatrix4(mesh.matrixWorld);
            sumY += v.y;
            count += 1;
          }
        });
        const meanY = count > 0 ? sumY / count : 0;
        if (meanY < 0) {
          // Bulk aşağıda → tip yukarıda. Flip et.
          model.rotation.x += Math.PI;
          // Re-center (rotation sonrası bbox değişir)
          const box2b = new THREE.Box3().setFromObject(model);
          const center2 = new THREE.Vector3();
          box2b.getCenter(center2);
          model.position.sub(center2);
        }

        // ─── Step 4: scale to ~58% visible height ────────────────
        const targetH = 4.82 * 0.58;
        const box3 = new THREE.Box3().setFromObject(model);
        const size3 = new THREE.Vector3();
        box3.getSize(size3);
        const s = targetH / Math.max(0.01, size3.y);
        model.scale.setScalar(s);

        // Material
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
      dracoLoader.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="scene-bg" aria-hidden="true" />;
}
