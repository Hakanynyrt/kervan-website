import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Lang } from '../types';
import { ORIGIN, EXPORTS, type ExportPoint } from '../lib/exports';

interface Props {
  lang: Lang;
}

/** Lat/lon (decimal degrees) → unit-sphere XYZ. East-positive longitude;
 *  origin offsets centre Greenwich on the front of the globe at default
 *  rotation. */
function latLonToVec3(lat: number, lon: number, r = 1): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

/** Great-circle interpolation between two unit-sphere points, lifted
 *  by a sinusoidal arc so paths read as flight lines, not surface
 *  scribbles. `lift` is the peak elevation above the sphere's surface
 *  (in unit-sphere units). */
function greatCircleArc(
  start: THREE.Vector3,
  end: THREE.Vector3,
  segments: number,
  lift: number,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Slerp via lerp+normalize is good enough at this density.
    const v = new THREE.Vector3().copy(start).lerp(end, t).normalize();
    const liftAmount = Math.sin(t * Math.PI) * lift;
    v.multiplyScalar(1 + liftAmount);
    points.push(v);
  }
  return points;
}

/**
 * ExportsGlobe — interaktif 3D dünya. Kocaeli merkezli ember arc'lar
 * her destinasyona, drag-rotate + inertia + idle auto-rotate. Hover/tap
 * dot'a tooltip (şehir + ülke). Tek WebGL canvas, kendi animation
 * loop'u — Scene.tsx'in chisel canvas'ından bağımsız.
 */
export default function ExportsGlobe({ lang }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<ExportPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

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

    // World group rotates as a unit so dots/arcs/graticule track the
    // sphere together when the user drags.
    const world = new THREE.Group();
    scene.add(world);

    // Filled globe — dark warm metal with a soft response so the
    // brand-warm key light catches the curve on the lit side.
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0x1a1815,
        metalness: 0.15,
        roughness: 0.85,
      }),
    );
    world.add(globe);

    // Latitude/longitude graticule — wireframe at 1.001 so it floats
    // just above the surface. Warm dim hair-line for an atelier feel.
    const grat = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(1.001, 24, 16)),
      new THREE.LineBasicMaterial({
        color: 0x3a3528,
        transparent: true,
        opacity: 0.55,
      }),
    );
    world.add(grat);

    // ──── Origin (Kocaeli) ────────────────────────────────────────
    const originPos = latLonToVec3(ORIGIN.lat, ORIGIN.lon, 1.012);
    const origin = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff6a1a }),
    );
    origin.position.copy(originPos);
    origin.userData = { ...ORIGIN, isOrigin: true };
    world.add(origin);

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

    // ──── Destinations ───────────────────────────────────────────
    const destDots: THREE.Mesh[] = [];
    EXPORTS.forEach((d) => {
      const pos = latLonToVec3(d.lat, d.lon, 1.012);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xe8e2d6 }),
      );
      dot.position.copy(pos);
      dot.userData = d;
      world.add(dot);
      destDots.push(dot);
    });

    // ──── Arcs ───────────────────────────────────────────────────
    EXPORTS.forEach((d) => {
      const start = latLonToVec3(ORIGIN.lat, ORIGIN.lon, 1.005);
      const end = latLonToVec3(d.lat, d.lon, 1.005);
      const points = greatCircleArc(start, end, 64, 0.28);
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0xff6a1a,
        transparent: true,
        opacity: 0.55,
      });
      world.add(new THREE.Line(geom, mat));
    });

    // ──── Lights ─────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xfff1d8, 0.9);
    key.position.set(3, 2, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.3);
    fill.position.set(-3, -2, -3);
    scene.add(fill);

    // Initial orientation — bring Türkiye + Europe roughly forward,
    // tilted slightly so the user reads a hemisphere not a circle.
    world.rotation.y = -Math.PI * 0.45;
    world.rotation.x = -Math.PI * 0.12;

    // ──── Interaction ────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let vx = 0;
    let vy = 0;
    let lastInteractionT = performance.now();

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
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
        const sensitivity = 0.006;
        world.rotation.y += dx * sensitivity;
        world.rotation.x += dy * sensitivity;
        // Don't flip past the poles; ±70° feels natural.
        world.rotation.x = Math.max(-1.2, Math.min(1.2, world.rotation.x));
        vx = dx * sensitivity;
        vy = dy * sensitivity;
        lastInteractionT = performance.now();
        return;
      }
      // Hover / pick (only when not dragging).
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects([origin, ...destDots]);
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
      if (!isDragging) return;
      isDragging = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch { /* ignore */ }
      renderer.domElement.style.cursor = 'grab';
    };
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.style.touchAction = 'pan-y';
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

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
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      if (!isDragging) {
        // Inertial decay after release.
        if (Math.abs(vx) > 0.0001 || Math.abs(vy) > 0.0001) {
          world.rotation.y += vx;
          world.rotation.x += vy;
          world.rotation.x = Math.max(-1.2, Math.min(1.2, world.rotation.x));
          vx *= 0.94;
          vy *= 0.94;
        }
        // Auto-rotate after 4 s of inactivity (skipped under reduced motion).
        const idleMs = now - lastInteractionT;
        if (!reduced && idleMs > 4000) {
          world.rotation.y += dt * 0.06;
        }
      }
      // Origin halo pulse — keeps the eye on Kocaeli even when the
      // continents are rotating into / out of view.
      const pulse = 1 + Math.sin(now * 0.003) * 0.18;
      originHalo.scale.setScalar(pulse);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
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
