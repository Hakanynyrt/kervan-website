import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Lang } from '../types';
import { ORIGIN, EXPORTS, type ExportPoint } from '../lib/exports';

interface Props {
  lang: Lang;
}

/** Lat/lon (decimal degrees) → unit-sphere XYZ. East-positive longitude;
 *  +180 offset matches the globe's default rotation so Greenwich faces
 *  the camera at world.rotation.y = 0. */
function latLonToVec3(lat: number, lon: number, r = 1): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

/** Great-circle interpolation lifted into a sinusoidal arc — paths
 *  read as flight lines, not surface scribbles. */
function greatCircleArc(
  start: THREE.Vector3,
  end: THREE.Vector3,
  segments: number,
  lift: number,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const v = new THREE.Vector3().copy(start).lerp(end, t).normalize();
    v.multiplyScalar(1 + Math.sin(t * Math.PI) * lift);
    points.push(v);
  }
  return points;
}

/** Decode the standard world-atlas TopoJSON arcs format into absolute
 *  [lon, lat] segments. Delta-encoded; first point of each arc is the
 *  delta from (0, 0), subsequent points are deltas from the previous. */
interface TopoTransform {
  scale: [number, number];
  translate: [number, number];
}
interface Topo {
  transform: TopoTransform;
  arcs: number[][][];
}
function decodeArcs(topo: Topo): number[][][] {
  const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
  return topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * sx + tx, y * sy + ty];
    });
  });
}

/** All "key points" on the globe — origin + destinations — as a single
 *  ordered array. Index 0 is origin (Kocaeli); 1..N are destinations
 *  in the order they appear in `lib/exports.ts`. The `selected` index
 *  drives where the chisel marker hovers. */
function buildPoints(): ExportPoint[] {
  return [ORIGIN, ...EXPORTS];
}

/**
 * ExportsGlobe — interaktif 3D dünya. Drag-rotate, ember arc'lar
 * Kocaeli'den her destinasyona, world-atlas TopoJSON'dan ülke sınırları,
 * tıklanan markere uçan chisel marker (globe scene'inin içinde, kendi
 * canvas'ında — Scene.tsx'in chisel'inden bağımsız).
 */
export default function ExportsGlobe({ lang }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<ExportPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Ref instead of state — the rAF tick reads it without forcing a
  // re-render every selection change.
  const selectedRef = useRef<number>(0); // 0 = origin (Kocaeli)

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch (e) {
      console.error('[exports-globe] WebGLRenderer init failed', e);
      return;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const cw = () => container.clientWidth || 1;
    const ch = () => container.clientHeight || 1;
    renderer.setSize(cw(), ch(), false);
    renderer.setClearAlpha(0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, cw() / ch(), 0.1, 100);
    camera.position.set(0, 0, 3.2);

    const world = new THREE.Group();
    scene.add(world);

    // ──── Filled globe ───────────────────────────────────────────
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0x1a1815,
        metalness: 0.15,
        roughness: 0.85,
      }),
    );
    world.add(globe);

    // ──── Lat/lon graticule ──────────────────────────────────────
    const grat = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(1.001, 24, 16)),
      new THREE.LineBasicMaterial({
        color: 0x2d2820,
        transparent: true,
        opacity: 0.42,
      }),
    );
    world.add(grat);

    // ──── Country borders (TopoJSON, fetched lazily) ─────────────
    // world-atlas 110 m resolution — small enough to fetch each visit
    // (~50 KB compressed, well-cached on jsDelivr CDN). On failure we
    // just skip borders; the globe still works without them.
    const abortCtrl = new AbortController();
    let bordersGroup: THREE.LineSegments | null = null;
    fetch(
      'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
      { signal: abortCtrl.signal },
    )
      .then((r) => r.json())
      .then((topo: Topo) => {
        const arcs = decodeArcs(topo);
        const positions: number[] = [];
        for (const arc of arcs) {
          for (let i = 0; i < arc.length - 1; i++) {
            const [lon1, lat1] = arc[i];
            const [lon2, lat2] = arc[i + 1];
            const v1 = latLonToVec3(lat1, lon1, 1.003);
            const v2 = latLonToVec3(lat2, lon2, 1.003);
            positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
          }
        }
        const geom = new THREE.BufferGeometry();
        geom.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(positions, 3),
        );
        bordersGroup = new THREE.LineSegments(
          geom,
          new THREE.LineBasicMaterial({
            color: 0xd8c8a8,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        world.add(bordersGroup);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('[exports-globe] country borders unavailable', err);
        }
      });

    // ──── Origin + destination dots ──────────────────────────────
    // Each dot has a visible mesh + an invisible larger hit-sphere.
    // The hit-sphere is what the raycaster intersects so taps land
    // on a comfortable ~44 px target on mobile, even though the
    // visible dot stays small.
    const points = buildPoints(); // [origin, ...destinations]
    const dotMeshes: THREE.Mesh[] = [];
    const hitMeshes: THREE.Mesh[] = [];
    points.forEach((pt, i) => {
      const isOrigin = i === 0;
      const pos = latLonToVec3(pt.lat, pt.lon, 1.012);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(isOrigin ? 0.026 : 0.02, 14, 14),
        new THREE.MeshBasicMaterial({
          color: isOrigin ? 0xff6a1a : 0xe8e2d6,
        }),
      );
      dot.position.copy(pos);
      dot.userData = { ...pt, index: i, isOrigin };
      world.add(dot);
      dotMeshes.push(dot);

      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hit.position.copy(pos);
      hit.userData = { ...pt, index: i, isOrigin };
      world.add(hit);
      hitMeshes.push(hit);
    });

    // Origin halo (pulsing).
    const originPos = latLonToVec3(ORIGIN.lat, ORIGIN.lon, 1.012);
    const originHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xff6a1a,
        transparent: true,
        opacity: 0.22,
      }),
    );
    originHalo.position.copy(originPos);
    world.add(originHalo);

    // ──── Arcs ───────────────────────────────────────────────────
    EXPORTS.forEach((d) => {
      const start = latLonToVec3(ORIGIN.lat, ORIGIN.lon, 1.005);
      const end = latLonToVec3(d.lat, d.lon, 1.005);
      const arcPts = greatCircleArc(start, end, 64, 0.28);
      const geom = new THREE.BufferGeometry().setFromPoints(arcPts);
      const mat = new THREE.LineBasicMaterial({
        color: 0xff6a1a,
        transparent: true,
        opacity: 0.55,
      });
      world.add(new THREE.Line(geom, mat));
    });

    // ──── Chisel marker (loaded async from /kirici-uc.glb) ───────
    // Wrapper group lives in `world` so it rotates with the globe.
    // The chisel's tip is locally at -Y (after the GLB orient code):
    // we align +Y with the outward radial so the tip points down at
    // the city, like a hanging marker.
    const chiselWrapper = new THREE.Group();
    chiselWrapper.visible = false; // shown once GLB loads
    world.add(chiselWrapper);

    // Snap-to-target state. `currentPos`/`currentQuat` exponentially
    // ease toward the target each frame — feels like a slow spring.
    const currentPos = new THREE.Vector3().copy(originPos).multiplyScalar(1.18 / 1.012);
    const targetPos = currentPos.clone();
    const currentQuat = new THREE.Quaternion();
    const targetQuat = new THREE.Quaternion();
    const setTargetForIndex = (i: number) => {
      const pt = points[i] ?? ORIGIN;
      const radial = latLonToVec3(pt.lat, pt.lon).normalize();
      targetPos.copy(radial).multiplyScalar(1.18);
      // Default chisel "up" after orient is +Y. Map +Y → outward radial.
      targetQuat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), radial);
    };
    setTargetForIndex(0);
    currentQuat.copy(targetQuat); // start aligned at origin

    new GLTFLoader().load(
      '/kirici-uc.glb',
      (gltf) => {
        const model = gltf.scene;
        // Centre + orient (longest axis to Y, tip-down) — same shape
        // hint as Scene.tsx uses for the main chisel.
        const box1 = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box1.getSize(size);
        const longest = Math.max(size.x, size.y, size.z);
        if (size.x === longest) model.rotation.z = -Math.PI / 2;
        else if (size.z === longest) model.rotation.x = Math.PI / 2;
        model.updateMatrixWorld(true);

        // Scale so the chisel is ~0.32 sphere units long. Orbit-radius
        // here is 1, so ~30 % of the sphere radius reads as a chunky
        // marker without dwarfing the dots.
        const TARGET_LEN = 0.32;
        const box2 = new THREE.Box3().setFromObject(model);
        const sz = new THREE.Vector3();
        box2.getSize(sz);
        const s = TARGET_LEN / Math.max(0.01, sz.y);
        model.scale.setScalar(s);
        model.updateMatrixWorld(true);

        // Re-centre vertically so the chisel sits with its tip pointing
        // toward the world origin (i.e. the city below). After the
        // wrapper's quaternion is applied, +Y is outward.
        const box3 = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box3.getCenter(center);
        model.position.sub(center);

        // Material — bright warm steel so it pops on the dark globe.
        // Higher emissive than Scene.tsx's chisel because there's no
        // PMREM env map here to give metallic highlights to bite into.
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.material = new THREE.MeshStandardMaterial({
              color: 0xc8b89c,
              metalness: 0.6,
              roughness: 0.45,
              emissive: 0xff6a1a,
              emissiveIntensity: 0.6,
            });
          }
        });

        chiselWrapper.add(model);
        chiselWrapper.visible = true;
      },
      undefined,
      (err) => {
        console.warn('[exports-globe] chisel marker load failed', err);
      },
    );

    // ──── Lights ─────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xfff1d8, 0.95);
    key.position.set(3, 2, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.3);
    fill.position.set(-3, -2, -3);
    scene.add(fill);

    world.rotation.y = -Math.PI * 0.45;
    world.rotation.x = -Math.PI * 0.12;

    // ──── Interaction ────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    let isDragging = false;
    let didDrag = false; // track for click-vs-drag
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastY = 0;
    let vx = 0;
    let vy = 0;
    let lastInteractionT = performance.now();

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      didDrag = false;
      downX = lastX = e.clientX;
      downY = lastY = e.clientY;
      vx = vy = 0;
      lastInteractionT = performance.now();
      try {
        renderer.domElement.setPointerCapture(e.pointerId);
      } catch { /* old browsers */ }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) {
          didDrag = true;
        }
        const sensitivity = 0.006;
        world.rotation.y += dx * sensitivity;
        world.rotation.x += dy * sensitivity;
        world.rotation.x = Math.max(-1.2, Math.min(1.2, world.rotation.x));
        vx = dx * sensitivity;
        vy = dy * sensitivity;
        lastInteractionT = performance.now();
        return;
      }
      // Hover detection (only when not dragging).
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(hitMeshes);
      if (hits.length > 0) {
        const data = hits[0].object.userData as ExportPoint;
        setHover(data);
        setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHover(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      const wasDragging = isDragging;
      isDragging = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch { /* ignore */ }
      renderer.domElement.style.cursor = 'grab';
      if (!wasDragging || didDrag) return;
      // Tap (no drag): pick a dot, fly the chisel to it.
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(hitMeshes);
      if (hits.length > 0) {
        const userData = hits[0].object.userData as { index: number };
        selectedRef.current = userData.index;
        setTargetForIndex(userData.index);
      }
    };
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.style.touchAction = 'pan-y';
    const onPointerCancel = (e: PointerEvent) => {
      isDragging = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch { /* ignore */ }
      renderer.domElement.style.cursor = 'grab';
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);

    // ──── Resize ─────────────────────────────────────────────────
    const onResize = () => {
      const w = cw();
      const h = ch();
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', onResize, { passive: true });
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // ──── Animation loop ─────────────────────────────────────────
    let raf = 0;
    let lastT = performance.now();
    const POSE_TC = 0.35; // seconds — chisel ease time-constant

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      if (!isDragging) {
        if (Math.abs(vx) > 0.0001 || Math.abs(vy) > 0.0001) {
          world.rotation.y += vx;
          world.rotation.x += vy;
          world.rotation.x = Math.max(-1.2, Math.min(1.2, world.rotation.x));
          vx *= 0.94;
          vy *= 0.94;
        }
        const idleMs = now - lastInteractionT;
        if (!reduced && idleMs > 4000) {
          world.rotation.y += dt * 0.06;
        }
      }

      // Origin halo pulse.
      const pulse = 1 + Math.sin(now * 0.003) * 0.18;
      originHalo.scale.setScalar(pulse);

      // Highlight selected dot — slightly brighter ember if it's a
      // destination, full ember if origin (default state).
      dotMeshes.forEach((d, i) => {
        const mat = d.material as THREE.MeshBasicMaterial;
        const isSel = i === selectedRef.current;
        if (i === 0) return; // origin always brand colour
        mat.color.setHex(isSel ? 0xff6a1a : 0xe8e2d6);
        d.scale.setScalar(isSel ? 1.4 : 1);
      });

      // Chisel pose lerp toward target (frame-rate independent).
      const a = 1 - Math.exp(-dt / POSE_TC);
      currentPos.lerp(targetPos, a);
      currentQuat.slerp(targetQuat, a);
      chiselWrapper.position.copy(currentPos);
      chiselWrapper.quaternion.copy(currentQuat);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      abortCtrl.abort();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  const hoverCity = hover ? (lang === 'tr' ? hover.cityTr : hover.city) : '';
  const hoverCountry = hover
    ? lang === 'tr'
      ? hover.countryTr
      : hover.country
    : '';

  return (
    <div className="relative w-full max-w-[640px] mx-auto aspect-square">
      <div
        ref={containerRef}
        className="w-full h-full"
        aria-label="İhracat ağı, etkileşimli dünya"
      />
      {hover && hoverPos && (
        <div
          className="absolute pointer-events-none px-3 py-2 bg-bg-soft/95 border border-hair text-ink shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
          style={{
            left: Math.min(hoverPos.x + 14, (containerRef.current?.clientWidth ?? 999) - 180),
            top: Math.max(hoverPos.y - 48, 8),
            zIndex: 10,
          }}
        >
          <div className="font-sans tracking-[0.18em] uppercase text-ink-soft text-[10px]">
            {hoverCity}
          </div>
          <div className="font-serif italic text-base text-ink leading-tight">
            {hoverCountry}
          </div>
        </div>
      )}
    </div>
  );
}
