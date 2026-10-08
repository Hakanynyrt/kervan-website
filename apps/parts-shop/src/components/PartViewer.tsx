import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useReducedMotion } from '@kervan/motion';
import type { Dict } from '../lib/dict';

/** Brand "Forge Ember": the rim light of every render (render-only colour). */
const EMBER = 0xe8431b;
/** Cut face of the section view: a glowing, freshly cut ember tone (render-only colour). */
const CUT = 0xd9552c;
/** Plane constant that clips nothing. */
const NO_CUT = 1e3;

/**
 * Interactive 3D view of one part (lazy chunk: three.js loads only when a visitor opens it).
 * Drag to turn, pinch or wheel to zoom, arrow keys turn it from the keyboard. It turns slowly
 * by itself until touched, never under reduced motion, and draws only while on screen.
 * "Kesit" adds a slider that moves a cross-section plane from one end of the part to the other;
 * the cut face is drawn by the back faces behind the plane in one flat colour.
 */
export default function PartViewer({ src, label, t }: { src: string; label: string; t: Dict }) {
  const box = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [cut, setCut] = useState(false);
  const [pos, setPos] = useState(50);
  const plane = useRef(new THREE.Plane(new THREE.Vector3(-1, 0, 0), NO_CUT));
  const span = useRef<[number, number]>([0, 0]);
  const view = useRef<{ camera: THREE.Camera; controls: OrbitControls } | null>(null);

  useEffect(() => {
    const [lo, hi] = span.current;
    plane.current.constant = cut ? hi - (pos / 100) * (hi - lo) : NO_CUT;
    const v = view.current;
    if (!cut || !v) return;
    v.controls.autoRotate = false;
    // Keep the cut face (it looks along +x) towards the camera.
    if (v.camera.position.x < 0.1) v.camera.position.set(0.62, 0.36, 0.95);
  }, [cut, pos, state]);

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
    renderer.localClippingEnabled = true;
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
    view.current = { camera, controls };

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
        span.current = [
          b.min.x - b.getCenter(new THREE.Vector3()).x,
          b.max.x - b.getCenter(new THREE.Vector3()).x,
        ];
        const caps: THREE.Mesh[] = [];
        model.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh) return;
          for (const x of ([] as THREE.Material[]).concat(m.material))
            x.clippingPlanes = [plane.current];
          const cap = new THREE.Mesh(
            m.geometry,
            new THREE.MeshBasicMaterial({
              color: CUT,
              side: THREE.BackSide,
              clippingPlanes: [plane.current],
              toneMapped: false,
            }),
          );
          caps.push(cap);
        });
        for (const c of caps) {
          // Same transform as the mesh it caps (the geometry is shared).
          const m = model.getObjectByProperty('geometry', c.geometry);
          m?.parent?.add(c);
          if (m) {
            c.position.copy(m.position);
            c.quaternion.copy(m.quaternion);
            c.scale.copy(m.scale);
          }
        }
        scene.add(model);
        setState('ready');
        loop();
      },
      undefined,
      () => setState('error'),
    );

    return () => {
      cancelAnimationFrame(raf);
      view.current = null;
      ro.disconnect();
      io.disconnect();
      el.removeEventListener('keydown', onKey);
      controls.dispose();
      model?.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose(); // shared by a mesh and its cap: a second dispose is a no-op
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
      {state === 'ready' && (
        <div className="mt-3 font-sans text-sm">
          <button
            type="button"
            onClick={() => setCut((c) => !c)}
            aria-pressed={cut}
            className="cursor-pointer rounded-sm border border-ink-soft bg-bg px-4 py-2 font-medium text-ink hover:bg-bg-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {cut ? t.parts.viewer.cutOff : t.parts.viewer.cut}
          </button>
          {cut && (
            <div className="mt-3">
              <label htmlFor="cut-pos" className="block font-semibold text-ink">
                {t.parts.viewer.cutLabel}
              </label>
              <input
                id="cut-pos"
                type="range"
                min={2}
                max={98}
                value={pos}
                onChange={(e) => setPos(Number(e.target.value))}
                className="mt-2 block w-full cursor-pointer accent-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              />
              <p className="m-0 mt-1 text-ink-mid">{t.parts.viewer.cutHint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
