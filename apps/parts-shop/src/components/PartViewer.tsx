import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useReducedMotion } from '@kervan/motion';
import type { Dict } from '../lib/dict';

/** Brand "Forge Ember": the rim light of every render (render-only colour). */
const EMBER = 0xe8431b;

/**
 * Interactive 3D view of one part (lazy chunk: three.js loads only when a visitor opens it).
 * Drag to turn, pinch or wheel to zoom, arrow keys turn it from the keyboard. It turns slowly
 * by itself until touched, never under reduced motion, and draws only while on screen.
 */
export default function PartViewer({ src, label, t }: { src: string; label: string; t: Dict }) {
  const box = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 2),
    );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.display = 'block';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    const key = new THREE.DirectionalLight(0xfff4ea, 1.6);
    key.position.set(-3, 4, 3);
    const rim = new THREE.DirectionalLight(EMBER, 1.6);
    rim.position.set(3, 0.6, -4);
    const rim2 = new THREE.DirectionalLight(EMBER, 0.8);
    rim2.position.set(-4, -0.3, -3);
    scene.add(key, rim, rim2);

    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.01, 50);
    camera.position.set(0.62, 0.36, 0.95);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 0.45;
    controls.maxDistance = 2.2;
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 1.2;
    const stop = () => (controls.autoRotate = false);
    controls.addEventListener('start', stop);

    let visible = true;
    let raf = 0;
    const size = () => {
      const w = el.clientWidth;
      const h = Math.round((w * 9) / 16);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      controls.update();
      renderer.render(scene, camera);
    };

    // Arrow keys turn the part (OrbitControls' own keys only pan).
    const spherical = new THREE.Spherical();
    const onKey = (e: KeyboardEvent) => {
      const turn = {
        ArrowLeft: [-0.15, 0],
        ArrowRight: [0.15, 0],
        ArrowUp: [0, -0.1],
        ArrowDown: [0, 0.1],
      }[e.key];
      if (!turn) return;
      e.preventDefault();
      stop();
      const off = camera.position.clone().sub(controls.target);
      spherical.setFromVector3(off);
      spherical.theta += turn[0];
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + turn[1], 0.15, Math.PI - 0.15);
      camera.position.copy(controls.target).add(off.setFromSpherical(spherical));
    };
    el.addEventListener('keydown', onKey);

    let model: THREE.Object3D | null = null;
    new GLTFLoader().load(
      src,
      (gltf) => {
        model = gltf.scene;
        const b = new THREE.Box3().setFromObject(model);
        model.position.sub(b.getCenter(new THREE.Vector3()));
        scene.add(model);
        setState('ready');
        loop();
      },
      undefined,
      () => setState('error'),
    );

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener('keydown', onKey);
      controls.dispose();
      model?.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          for (const x of ([] as THREE.Material[]).concat(m.material)) x.dispose();
        }
      });
      scene.environment?.dispose();
      pm.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [src, reduced]);

  return (
    <div className="relative">
      <div
        ref={box}
        tabIndex={0}
        role="img"
        aria-label={`${label}. ${t.parts.viewer.hint}`}
        className="aspect-video w-full cursor-grab overflow-hidden rounded-md border border-hair bg-stage focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:cursor-grabbing"
      />
      {state !== 'ready' && (
        <p className="absolute inset-0 m-0 flex items-center justify-center font-sans text-sm text-white">
          {state === 'loading' ? t.parts.viewer.loading : t.parts.viewer.error}
        </p>
      )}
      <p className="m-0 mt-2 font-sans text-sm text-ink-mid">{t.parts.viewer.hint}</p>
    </div>
  );
}
