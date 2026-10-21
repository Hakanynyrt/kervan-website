import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useReducedMotion } from '@kervan/motion';
import type { Dict } from '../lib/dict';

/** Brand "Forge Ember": the rim light of every render (render-only colour). */
const EMBER = 0xe8431b;
/** Cut face of the section view: a glowing, freshly cut ember tone (render-only colour). */
const CUT = 0xd9552c;
/** Cut face of parts fitted into the body (bushings, GLB nodes named `fitted…`): bronze, so they stand apart
 *  from the ember body in a section (owner: "burçlar kesitte farklı renk görünsün"). */
const CUT_FITTED = 0xc8a050;
/** Black finish of the renders for the GLB steel materials, by name: [colour, metalness, roughness]. */
const FINISH: Record<string, [number, number, number]> = {
  forged: [0x3b404b, 0.3, 0.6],
  machined: [0x4d535c, 0.85, 0.3],
  // bushings' unground surfaces take the front head's colour (owner: "burçlar alt gövdede dışı çok koyu
  // görünüyor" → "alt gövde ile aynı renk"); the renders' near-black read as a hole under the viewer's lighting
  black: [0x3b404b, 0.3, 0.6],
};
/** Plane constant that clips nothing. */
const NO_CUT = 1e3;

/**
 * Interactive 3D view of one part (lazy chunk: three.js loads only when a visitor opens it).
 * Drag to turn, pinch or wheel to zoom, arrow keys turn it from the keyboard. It turns slowly
 * by itself until touched, never under reduced motion, and draws only while on screen.
 * "Kesit" cuts the part lengthwise through its axis and takes the half facing the camera away; the cut
 * plane turns with the camera, so the section always faces the viewer (owner: a lengthwise section at the
 * camera's angle, no position slider). The cut face is drawn by the back faces in one flat colour (ember
 * for the body, bronze for fitted parts such as bushings).
 * A burçlu front head's model carries its bushings and pins as nodes named `fitted…`; they show only with
 * `showFitted` (the page's Burçsuz / Burçlu choice).
 */
export default function PartViewer({
  src,
  label,
  t,
  showFitted = true,
}: {
  src: string;
  label: string;
  t: Dict;
  showFitted?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [cut, setCut] = useState(false);
  // the model is centred on the origin with its axis along x; the cut plane holds the axis and faces the camera
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), NO_CUT));
  const cutOn = useRef(false);
  /** Start camera position, fitted to the model (a 0.2 m bushing and a 0.7 m front head fill the frame alike). */
  const home = useRef(new THREE.Vector3(0.62, 0.36, 0.95));
  const view = useRef<{ camera: THREE.Camera; controls: OrbitControls } | null>(null);
  /** Fitted parts and their cut faces, hidden for Burçsuz. */
  const fittedParts = useRef<THREE.Object3D[]>([]);
  const fittedOn = useRef(showFitted);

  useEffect(() => {
    fittedOn.current = showFitted;
    for (const o of fittedParts.current) o.visible = showFitted;
  }, [showFitted, state]);

  useEffect(() => {
    cutOn.current = cut;
    plane.current.constant = cut ? 0 : NO_CUT;
    const v = view.current;
    if (cut && v) v.controls.autoRotate = false;
  }, [cut, state]);

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
      if (cutOn.current) {
        // the camera direction without its part along the axis: the plane through the axis that faces the camera
        const n = camera.position.clone().sub(controls.target).setX(0);
        if (n.lengthSq() > 1e-9) plane.current.normal.copy(n.normalize().negate());
      }
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
    // bushing models are meshopt-compressed (gltf-transform optimize): 25–180 kB instead of MBs
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(
      src,
      (gltf) => {
        model = gltf.scene;
        const b = new THREE.Box3().setFromObject(model);
        model.position.sub(b.getCenter(new THREE.Vector3()));
        // fit: the camera keeps its direction, its distance follows the model's size
        const r = b.getSize(new THREE.Vector3()).length() / 2;
        const d = (r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.05;
        home.current.set(0.62, 0.36, 0.95).setLength(d);
        camera.position.copy(home.current);
        camera.near = d / 50;
        camera.far = d * 20;
        camera.updateProjectionMatrix();
        controls.minDistance = d * 0.4;
        controls.maxDistance = d * 2;
        const caps: THREE.Mesh[] = [];
        const fittedList: THREE.Object3D[] = [];
        model.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh) return;
          // the renders' black finish: the GLBs carry the generator's grey forged / machined steel, which reads
          // grey under the viewer's lighting (owner: "gövde siyah değil")
          for (const x of ([] as THREE.Material[]).concat(m.material)) {
            const k = x as THREE.MeshStandardMaterial;
            const f = FINISH[k.name];
            if (f) {
              k.color.set(f[0]);
              k.metalness = f[1];
              k.roughness = f[2];
            }
          }
          for (const x of ([] as THREE.Material[]).concat(m.material))
            x.clippingPlanes = [plane.current];
          let fitted = false;
          for (let a: THREE.Object3D | null = m; a; a = a.parent)
            if (a.name.startsWith('fitted')) fitted = true;
          const cap = new THREE.Mesh(
            m.geometry,
            new THREE.MeshBasicMaterial({
              color: fitted ? CUT_FITTED : CUT,
              side: THREE.BackSide,
              clippingPlanes: [plane.current],
              toneMapped: false,
              // a bushing's outer diameter lies exactly on the head's bore: without this the cut face and the
              // other part's bore surface share a depth and flicker into stripes (owner: "kesitte … tırtıklı")
              polygonOffset: true,
              polygonOffsetFactor: -1,
              polygonOffsetUnits: -4,
            }),
          );
          caps.push(cap);
          if (fitted) fittedList.push(m, cap);
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
        for (const o of fittedList) o.visible = fittedOn.current;
        fittedParts.current = fittedList;
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
        className="aspect-video w-full cursor-grab overflow-hidden rounded-md border border-hair bg-pstage focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:cursor-grabbing"
      />
      {state !== 'ready' && (
        <p className="absolute inset-0 m-0 flex items-center justify-center font-sans text-sm text-ink-mid">
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
        </div>
      )}
    </div>
  );
}
