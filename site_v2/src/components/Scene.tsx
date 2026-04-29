import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

/**
 * Scene — Sayfa = Dünya, chisel = Ay.
 *
 * Daha sıkı yörünge, daha büyük chisel — mobilde ekrandan kaybolmasın diye.
 *   yatay ±1.2 · dikey ±0.6 · derinlik ±0.4
 *
 * Yörünge ilerleyişi:
 *   - Baseline drift: 90 sn'de bir tam tur (scroll yok bile)
 *   - Scroll boost: tam sayfa scroll = +1 ek tur
 *
 * prefers-reduced-motion → statik üst-sağda asılı.
 */
export default function Scene() {
  return (
    <div className="scene-bg" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 9], fov: 30 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
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
      <ambientLight intensity={0.22} />
      <directionalLight position={[-3, 4, 4]} intensity={3.0} color="#FFCFA0" />
      <directionalLight position={[4, 2, 3]} intensity={0.45} color="#9CA8B8" />
      <directionalLight position={[2, 1, -5]} intensity={4.2} color="#FF6A1A" />
    </>
  );
}

function Moon() {
  const gltf = useLoader(GLTFLoader, '/kirici-uc.glb');
  const tiltGroup = useRef<THREE.Group>(null!);
  const orbitGroup = useRef<THREE.Group>(null!);
  const spinGroup = useRef<THREE.Group>(null!);
  const reduced = useReducedMotion();

  // Mouse + scroll proxy state — bağlanması mount'a kadar ertelenir.
  const mouse = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);

  // Auto-orient + center model — yalnızca GLB değişince yeniden hesapla.
  // Tip -Y'ye baksın, AABB merkezde, scale ~%38 görünür yükseklik.
  const oriented = useMemo(() => {
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

    const targetH = 4.82 * 0.50;
    const box3 = new THREE.Box3().setFromObject(scene);
    const size3 = new THREE.Vector3();
    box3.getSize(size3);
    const scale = targetH / size3.y;
    scene.scale.setScalar(scale);

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
  }, [gltf]);

  // Window listener'ları React standart pattern'inde — useEffect + cleanup.
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scroll.current = Math.min(1, window.scrollY / max);
    };

    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial value

    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Reduced motion için ilk frame'de pozisyonu sabitleyip animasyondan çık.
  // Hooks-rule respected: useFrame her zaman çağrılır, sadece içeriği koşullu.
  useFrame((state, delta) => {
    if (reduced) {
      if (orbitGroup.current && orbitGroup.current.position.x === 0) {
        orbitGroup.current.position.set(1.0, 0.5, 0);
      }
      return;
    }

    const t = state.clock.elapsedTime;

    const baselineAngle = t * (Math.PI * 2 / 90);
    const scrollAngle = scroll.current * Math.PI * 2;
    const angle = baselineAngle + scrollAngle;

    const rx = 1.2;
    const ry = 0.6;
    const rz = 0.4;

    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry + 0.1;
    const z = Math.cos(angle * 0.5) * rz;

    if (orbitGroup.current) {
      orbitGroup.current.position.set(x, y, z);
    }

    if (spinGroup.current) {
      spinGroup.current.rotation.y += delta * 0.22;
      spinGroup.current.rotation.x += delta * 0.05;
    }

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
