import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

/**
 * Scene — fixed full-viewport 3D background of the chisel head.
 *
 * Default animation set ("Atelier Spin"):
 *   - Slow Y-axis museum rotation (~50s/turn)
 *   - Subtle vertical bob (sine wave, ±0.06m, 6s period)
 *   - Mouse parallax tilt (max ±5°)
 *   - Scroll-driven slow forward lean (max 6°)
 *   - prefers-reduced-motion → static, no rotation
 *
 * Lighting: warm ember key + cool dim fill + bright orange rim.
 * Camera: FOV 30 telephoto, looking up slightly (heroic framing).
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
          <ChiselModel />
        </Suspense>
      </Canvas>
    </div>
  );
}

function Lights() {
  return (
    <>
      {/* Ambient: very dim, just enough to pull form out of pure shadow */}
      <ambientLight intensity={0.18} />

      {/* Key — warm ember from upper-left, soft */}
      <directionalLight
        position={[-3, 4, 4]}
        intensity={2.4}
        color="#FFCFA0"
        castShadow={false}
      />

      {/* Fill — cool dim, opposite side, moonlit */}
      <directionalLight
        position={[4, 2, 3]}
        intensity={0.35}
        color="#9CA8B8"
      />

      {/* Rim — saturated ember, behind, kicks the silhouette edge */}
      <directionalLight
        position={[2, 1, -5]}
        intensity={3.2}
        color="#FF6A1A"
      />
    </>
  );
}

function ChiselModel() {
  const gltf = useLoader(GLTFLoader, '/kirici-uc.glb');
  const tiltGroup = useRef<THREE.Group>(null!);
  const spinGroup = useRef<THREE.Group>(null!);
  const reduced = useReducedMotion();

  const mouse = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);

  // Listeners — mounted once
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

  // Auto-orient + center the model — GLB tip orientation isn't standardised,
  // so we compute its bounds and rotate so the long axis aligns with -Y
  // (tip pointing down). Same approach as v1 scene.js.
  const oriented = (() => {
    const scene = gltf.scene.clone(true);
    // Compute bounding box BEFORE rotation
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Find longest axis
    const longest = Math.max(size.x, size.y, size.z);
    if (size.x === longest) {
      scene.rotation.z = -Math.PI / 2; // X → -Y
    } else if (size.z === longest) {
      scene.rotation.x = Math.PI / 2;  // Z → -Y
    }
    // else: already on Y axis

    // Re-center after rotation
    const box2 = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box2.getCenter(center);
    scene.position.sub(center);

    // Scale to ~70% of camera-visible height @ z=9, fov=30
    // visibleH ≈ 2 * 9 * tan(15°) ≈ 4.82
    const targetH = 4.82 * 0.72;
    const box3 = new THREE.Box3().setFromObject(scene);
    const size3 = new THREE.Vector3();
    box3.getSize(size3);
    const scale = targetH / size3.y;
    scene.scale.setScalar(scale);

    // Material — dark warm steel, polished but not mirror
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

  useFrame((_, delta) => {
    if (reduced) return;

    // Slow Y-axis spin: 2π / 50s
    if (spinGroup.current) {
      spinGroup.current.rotation.y += delta * (Math.PI * 2) / 50;
    }

    // Tilt: blend mouse parallax (±5°) + scroll lean (max 6° forward)
    if (tiltGroup.current) {
      const targetX = scroll.current * 0.105 + mouse.current.y * -0.06;
      const targetZ = mouse.current.x * 0.06;
      // Lerp toward target — smooth, never snaps
      tiltGroup.current.rotation.x += (targetX - tiltGroup.current.rotation.x) * 0.04;
      tiltGroup.current.rotation.z += (targetZ - tiltGroup.current.rotation.z) * 0.04;

      // Vertical bob — sine wave, gentle
      tiltGroup.current.position.y = Math.sin(performance.now() * 0.001) * 0.06;
    }
  });

  return (
    <group ref={tiltGroup}>
      <group ref={spinGroup}>
        <primitive object={oriented} />
      </group>
    </group>
  );
}
