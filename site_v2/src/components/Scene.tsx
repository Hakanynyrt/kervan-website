import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

/**
 * Scene — Sayfa = Dünya, chisel = Ay.
 *
 * Chisel sayfanın etrafında elips bir yörüngede süzülür.
 * Konum eksenleri (kamera bakış açısından):
 *   x ekseni: yatay ±3.5  (uzun süpürme)
 *   y ekseni: dikey  ±1.4 (kısa kavis — moon-arc gibi)
 *   z ekseni: derinlik ±0.5 (close ↔ far drift)
 *
 * Yörünge ilerleyişi:
 *   - Baseline drift: kullanıcı hiç scroll etmese bile ~120 sn'de bir tam tur
 *   - Scroll boost: tam sayfa scroll = +1 tam tur (yan yana eklenir)
 *   - Toplam = baseline + scroll → asla durmaz
 *
 * Chisel kendi eksenleri etrafında da yavaş döner (tidal-lock'ed ay gibi
 * değil, canlı bir gök cismi gibi). Mouse parallax tüm yörüngenin
 * pivotunu hafifçe eğer (±5°).
 *
 * prefers-reduced-motion → hareket yok, statik göz hizasında.
 */
export default function Scene() {
  return (
    <div className="scene-bg" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.4, 9], fov: 30 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Lights />
        <Suspense fallback={null}>
          <Moon />
        </Suspense>
      </Canvas>
    </div>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[-3, 4, 4]} intensity={2.4} color="#FFCFA0" />
      <directionalLight position={[4, 2, 3]} intensity={0.35} color="#9CA8B8" />
      <directionalLight position={[2, 1, -5]} intensity={3.2} color="#FF6A1A" />
    </>
  );
}

function Moon() {
  const gltf = useLoader(GLTFLoader, '/kirici-uc.glb');
  const tiltGroup = useRef<THREE.Group>(null!);
  const orbitGroup = useRef<THREE.Group>(null!);
  const spinGroup = useRef<THREE.Group>(null!);
  const reduced = useReducedMotion();

  const mouse = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);

  // Listeners — tek seferde mount
  if (typeof window !== 'undefined' && !(window as unknown as { __scenebound?: boolean }).__scenebound) {
    (window as unknown as { __scenebound?: boolean }).__scenebound = true;
    window.addEventListener('mousemove', (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    window.addEventListener('scroll', () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scroll.current = Math.min(1, window.scrollY / max);
    }, { passive: true });
  }

  // Auto-orient + center model. Tip -Y'ye bak (sarkıyor gibi).
  // Boyutu kameraya göre ~%38'e küçült — yörüngede gezecek alan kalsın.
  const oriented = (() => {
    const scene = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);

    const longest = Math.max(size.x, size.y, size.z);
    if (size.x === longest) {
      scene.rotation.z = -Math.PI / 2;
    } else if (size.z === longest) {
      scene.rotation.x = Math.PI / 2;
    }

    const box2 = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box2.getCenter(center);
    scene.position.sub(center);

    // Görünür yükseklik @ z=9 fov=30 ≈ 4.82m. Chisel yüksekliği = %38 → ~1.83m.
    const targetH = 4.82 * 0.38;
    const box3 = new THREE.Box3().setFromObject(scene);
    const size3 = new THREE.Vector3();
    box3.getSize(size3);
    const scale = targetH / size3.y;
    scene.scale.setScalar(scale);

    // Material — koyu sıcak çelik
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: '#3a342e',
          metalness: 0.94,
          roughness: 0.32,
        });
      }
    });

    return scene;
  })();

  useFrame((state, delta) => {
    if (reduced) {
      // Reduced motion: statik, üst-sağda asılı dur — tek sefer set et
      if (orbitGroup.current && orbitGroup.current.position.x === 0) {
        orbitGroup.current.position.set(2.4, 1.0, 0);
      }
      return;
    }
    const t = state.clock.elapsedTime;

    // Baseline drift — kullanıcı scroll etmese bile sürekli orbit
    // 120 sn'de bir tam tur (2π / 120)
    const baselineAngle = t * (Math.PI * 2 / 120);

    // Scroll boost — tam sayfa scroll = +1 tam tur
    const scrollAngle = scroll.current * Math.PI * 2;

    const angle = baselineAngle + scrollAngle;

    // Elliptical orbit — yatay sweep dominant (moon-arc), dikey daha kısa
    const rx = 3.5;   // yatay radius (geniş)
    const ry = 1.4;   // dikey radius (kısa kavis)
    const rz = 0.5;   // derinlik modülasyonu (perspektif close↔far)

    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry + 0.2;     // hafif baseline yukarı offset
    const z = Math.cos(angle * 0.5) * rz;     // yarım frekans → daha smooth

    if (orbitGroup.current) {
      orbitGroup.current.position.set(x, y, z);
    }

    // Self-rotation — moon kendi etrafında dönüyor
    if (spinGroup.current) {
      spinGroup.current.rotation.y += delta * 0.22;
      spinGroup.current.rotation.x += delta * 0.05;  // hafif tumble
    }

    // Mouse parallax — tüm yörünge pivotunu eğ
    if (tiltGroup.current) {
      const targetX = mouse.current.y * -0.05;
      const targetZ = mouse.current.x * 0.05;
      tiltGroup.current.rotation.x += (targetX - tiltGroup.current.rotation.x) * 0.04;
      tiltGroup.current.rotation.z += (targetZ - tiltGroup.current.rotation.z) * 0.04;
    }
  });

  return (
    <group ref={tiltGroup}>
      <group ref={orbitGroup}>
        <group ref={spinGroup}>
          <primitive object={oriented} />
        </group>
      </group>
    </group>
  );
}
