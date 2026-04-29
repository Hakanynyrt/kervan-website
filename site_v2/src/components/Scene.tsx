import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

/**
 * Scene — uzayda süzülen chisel.
 *
 * Pure ambient drift. Kullanıcı input'u (scroll, mouse) yok.
 * Yavaş, sürekli, sola eğimli orbital bir hareket + üç-eksen
 * non-commensurate gentle rotation = "zero gravity" hissi.
 *
 *   - Yörünge merkezi sola kaymış (cx -0.4)
 *   - Yatay radius ±1.4, dikey ±0.7, derinlik ±0.4
 *   - Frequency oranları irrational → asla aynı pozisyon iki kez
 *   - Y spin 0.08 rad/s + X/Z wobble (sin, ±14°/±10°)
 *   - Tam tur ~6 dakika, baktıkça farklı görünür
 *
 * prefers-reduced-motion → solda statik dur.
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
      {/* Key — warm ember from upper-left */}
      <directionalLight position={[-3, 4, 4]} intensity={3.0} color="#FFCFA0" />
      {/* Fill — cool dim, opposite */}
      <directionalLight position={[4, 2, 3]} intensity={0.45} color="#9CA8B8" />
      {/* Rim — saturated ember, behind */}
      <directionalLight position={[2, 1, -5]} intensity={4.2} color="#FF6A1A" />
      {/* Side sun reflection — yandan parlak güneş, metale çarpan keskin specular */}
      <directionalLight position={[7, 0.8, 1.5]} intensity={4.8} color="#FFE8B0" />
    </>
  );
}

function Moon() {
  const gltf = useLoader(GLTFLoader, '/kirici-uc.glb');
  const orbitGroup = useRef<THREE.Group>(null!);
  const spinGroup = useRef<THREE.Group>(null!);
  const reduced = useReducedMotion();

  // Auto-orient + center model.
  // Tip -Y'ye baksın, AABB merkezde, scale ~%50 görünür yükseklik.
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

  // Pure ambient drift — kullanıcı input'u yok, scroll/mouse listener yok.
  useFrame((state, delta) => {
    if (reduced) {
      if (orbitGroup.current && orbitGroup.current.position.x === 0) {
        orbitGroup.current.position.set(-1.0, 0.0, 0);
      }
      return;
    }

    const t = state.clock.elapsedTime;

    // Yörünge merkezi sola kaymış — chisel zamanın çoğunu ekranın
    // solunda geçirir, soldan kayıp sağdan geri girer.
    const cx = -0.4;
    const cy = 0.0;

    // Frequency oranları irrasyonel: hiçbir periyot başka bir periyodun
    // tam katı değil — pozisyonlar asla repeat etmez (Lissajous-style)
    // Ana yörünge ~350 sn, modülasyonlar farklı oranlarda
    const orbitT = t * 0.018;       // ~350 sn'lik tam tur (yavaş)

    // Sola doğru eğimli ellipse: rx 1.4 yatay, ry 0.7 dikey
    const rx = 1.4;
    const ry = 0.7;
    const rz = 0.4;

    const x = cx + Math.cos(orbitT) * rx;
    const y = cy + Math.sin(orbitT * 1.13) * ry;     // farklı freq → drift'iyor
    const z = Math.sin(orbitT * 0.71 + 1.2) * rz;    // derinlik wobble

    if (orbitGroup.current) {
      orbitGroup.current.position.set(x, y, z);
    }

    // Üç-eksen yavaş rotation — uzayda dönüyormuş gibi tumble.
    if (spinGroup.current) {
      // Y: sürekli yavaş baseline spin (0.08 rad/s ≈ 78s/tur)
      spinGroup.current.rotation.y += delta * 0.08;
      // X ve Z: sin wave, ±0.25/0.18 rad (~14°/10°), farklı frekanslar
      spinGroup.current.rotation.x = Math.sin(t * 0.05) * 0.25;
      spinGroup.current.rotation.z = Math.sin(t * 0.07 + 1.5) * 0.18;
    }
  });

  return (
    <group ref={orbitGroup}>
      <group ref={spinGroup}>
        <primitive object={oriented} />
      </group>
    </group>
  );
}
