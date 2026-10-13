import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** "Tek Parça": one black breaker tip (pointed / moil, two key slots) on the dark
 *  page, lit by a warm key, a cool fill and an ember rim light that slowly circles it.
 *  An ember radial glow sits behind it (CSS, on the container). No stars, no bloom.
 *
 *  Scroll rail (continuous, anchored to the hero element, read every frame):
 *    OPENING (scrollY 0 → heroTop)          — tip centred in the approved pose
 *    HERO    (heroTop → heroBottom)         — turns to yaw −50°, moves to the right
 *                                             third (phones: upper band, smaller)
 *    POST    (heroBottom → heroBottom+⅕ih)  — fades out; nothing is drawn after that
 *
 *  Idle: a very slow ±3.5° sway and the rim light orbiting (~12 s per turn).
 *  Reduced motion (followed live): the static approved frame, drawn only on change.
 *  Drawing is on demand: ~30 fps while idle, every frame while the pose moves,
 *  nothing while the tab is hidden or the tip has faded out.
 */
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => x * x * (3 - 2 * x);
const deg = THREE.MathUtils.degToRad;

/** Model file. Images/models are cached immutable: a changed model gets a new name. */
const MODEL_URL = '/kirici-ucu-siyah-01.glb';

// Approved look (owner, "Tek Parça").
const FOV_DEG = 22;
const CAM_D = 3;
const YAW_OPEN = -22;
const YAW_HERO = -50;
const PITCH = 14;
const ROLL = 100; // about the long axis: one key slot faces up, the other is the lower notch
const RIM_ANGLE = 70; // rim light angle in the reduced-motion / start frame
const RIM_PERIOD_S = 12;

/** Round soft-edged sprite for the key star. 64×64 radial gradient drawn once. */
function makeStarSprite(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** One small star in a colour used nowhere else. It circles behind the tip;
 *  clicking it calls `onSecret` (the owner's hidden way into /teknik-bilgiler —
 *  the page itself is still password-protected and reachable by URL). */
const KEY_STAR_COLOR = new THREE.Color(0x3ee6b4);
const KEY_STAR_HIT_PX = 28;
/** Key star depth behind the tip (world units; the tip is 1 unit long). */
const KEY_BEHIND = 0.8;

export default function Scene({ onSecret }: { onSecret?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSecretRef = useRef(onSecret);
  onSecretRef.current = onSecret;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const container: HTMLDivElement = el;

    let raf = 0;
    const wake = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
    };

    // Follows the OS setting live, not just its value at mount.
    const reducedMq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduced = reducedMq?.matches ?? false;
    const onReducedChange = () => {
      reduced = reducedMq?.matches ?? false;
      wake();
    };
    reducedMq?.addEventListener?.('change', onReducedChange);

    // ─── Renderer ────────────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      // No WebGL (blocked, old GPU, headless): silently leave a soft ember glow
      // instead of an empty black opening.
      container.style.background =
        'radial-gradient(ellipse at 50% 55%, color-mix(in srgb, var(--color-brand) 16%, transparent), transparent 60%)';
      reducedMq?.removeEventListener?.('change', onReducedChange);
      return;
    }
    renderer.setClearAlpha(0);
    // Phones render at most 1.5x, desktops 2x.
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const DPR = Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1);
    // The drawing buffer must stay within what the GPU accepts, whatever the
    // viewport: clamp its size to the renderbuffer/texture/viewport limits.
    const gl = renderer.getContext();
    const glMax = (p: number) => {
      const v = Number(gl.getParameter(p));
      return Number.isFinite(v) && v > 0 ? v : 4096;
    };
    const vpDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as ArrayLike<number> | null;
    const maxSide = Math.min(glMax(gl.MAX_RENDERBUFFER_SIZE), glMax(gl.MAX_TEXTURE_SIZE));
    const MAX_W = Math.min(maxSide, vpDims?.[0] || maxSide);
    const MAX_H = Math.min(maxSide, vpDims?.[1] || maxSide);
    const ratioFor = (W: number, H: number) => Math.max(0.1, Math.min(DPR, MAX_W / W, MAX_H / H));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // Visual viewport: iOS Safari URL-bar collapse changes the visible height
    // while a fixed `inset:0` element re-flows late. The height is clamped (never
    // taller than the layout viewport or MAX_CSS_H) so a very tall window cannot
    // make a huge drawing buffer.
    const MAX_CSS_H = 1400;
    const w = () =>
      Math.floor(window.visualViewport?.width ?? window.innerWidth ?? container.clientWidth) || 0;
    const h = () =>
      Math.floor(
        Math.min(
          window.visualViewport?.height ?? window.innerHeight ?? container.clientHeight,
          window.innerHeight || MAX_CSS_H,
          MAX_CSS_H,
        ),
      ) || 0;
    const W0 = Math.max(1, w());
    const H0 = Math.max(1, h());
    renderer.setPixelRatio(ratioFor(W0, H0));
    renderer.setSize(W0, H0, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = `${H0}px`;
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // GPU context loss: stop drawing until three restores it.
    let contextLost = false;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
      wake();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    // ─── Scene, camera, environment, lights ──────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV_DEG, W0 / H0, 0.05, 50);
    camera.position.set(0, 0, CAM_D);
    camera.lookAt(0, 0, 0);
    const TAN = Math.tan(deg(FOV_DEG / 2));

    // Metal reflects the environment; without one it renders flat black.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTex = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    scene.environment = envTex;
    scene.environmentIntensity = 0.7;

    const key = new THREE.DirectionalLight(0xfff1e0, 2.6);
    key.position.set(-3, 4, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fb4d0, 0.35);
    fill.position.set(4, 1, 2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff6a1a, 5);
    scene.add(rim);
    // Rim position on its orbit (angle a), turned with the tip's yaw change (dy) so
    // the hero turn keeps the approved light-to-tip relation.
    // Around 115° the orbit passes in front of the tip, above it, where the ember
    // would flood the whole top face instead of edging it: dim it there.
    const RIM_DIP = deg(115);
    const RIM_DIP_W = deg(25);
    const setRim = (a: number, dy = 0) => {
      const d = Math.atan2(Math.sin(a - RIM_DIP), Math.cos(a - RIM_DIP)) / RIM_DIP_W;
      rim.intensity = 5 * (1 - 0.8 * Math.exp(-d * d));
      const x = Math.cos(a) * 3;
      const z = Math.sin(a) * 3 - 2.5;
      rim.position.set(
        x * Math.cos(dy) + z * Math.sin(dy),
        2.2,
        z * Math.cos(dy) - x * Math.sin(dy),
      );
    };
    setRim(deg(RIM_ANGLE));

    // Every surface black (owner): forged body and the slightly brighter machined
    // faces (key slots, ends) that keep the slots readable.
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      metalness: 0.5,
      roughness: 0.45,
    });
    const machinedMat = new THREE.MeshStandardMaterial({
      color: 0x1a1c20,
      metalness: 1,
      roughness: 0.32,
    });

    // ─── Group hierarchy: outer (pose) > roll > model ────────────────
    // outer: position, scale, yaw (Y) and pitch (X); roll: about the long axis (X).
    const outer = new THREE.Group();
    const rollG = new THREE.Group();
    rollG.rotation.x = deg(ROLL);
    outer.add(rollG);
    outer.visible = false;
    scene.add(outer);

    // ─── Key star ────────────────────────────────────────────────────
    const starSprite = makeStarSprite();
    const keyMat = new THREE.SpriteMaterial({
      map: starSprite,
      color: KEY_STAR_COLOR,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const keyStar = new THREE.Sprite(keyMat);
    scene.add(keyStar);
    let sceneVisible = true;

    // ─── Model ───────────────────────────────────────────────────────
    let modelLoaded = false;
    let loadedAt = 0;
    let disposed = false;
    const loaded: THREE.BufferGeometry[] = [];
    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        try {
          const model = gltf.scene;
          model.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            const name = (mesh.material as THREE.Material).name;
            (mesh.material as THREE.Material).dispose();
            mesh.material = name === 'machined' ? machinedMat : bodyMat;
            loaded.push(mesh.geometry);
          });
          // Centre on the bbox, long axis → X, length 1.
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const piv = new THREE.Group();
          model.position.sub(center);
          piv.add(model);
          const L = Math.max(size.x, size.y, size.z);
          if (size.y === L) piv.rotation.z = Math.PI / 2;
          else if (size.z === L) piv.rotation.y = Math.PI / 2;
          piv.scale.setScalar(1 / Math.max(1e-6, L));
          rollG.add(piv);
          outer.visible = true;
          modelLoaded = true;
          loadedAt = performance.now();
          wake();
        } catch (err) {
          console.error('[scene] post-load processing failed', err);
        }
      },
      undefined,
      (err) => {
        console.warn('[scene] GLB load failed, glow stays', err);
      },
    );

    // ─── Resize ──────────────────────────────────────────────────────
    const onResize = () => {
      const W = w(),
        H = h();
      // Hidden / collapsed viewport (0 × n): keep the last size, draw nothing.
      if (W <= 0 || H <= 0) return;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(ratioFor(W, H));
      renderer.setSize(W, H, false);
      renderer.domElement.style.height = `${H}px`;
      lastGlow = '';
      wake();
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    window.visualViewport?.addEventListener('resize', onResize);

    // ─── Scroll phase ────────────────────────────────────────────────
    //   0..1 OPENING, 1..2 HERO, 2..3 POST (fade). Past 3 nothing is drawn.
    let phase = 0;
    const updatePhase = () => {
      const sy = window.scrollY;
      const ih = window.innerHeight;
      const hero = document.querySelector<HTMLElement>('[data-scene-pose="hero"]');
      const r = hero?.getBoundingClientRect();
      const heroTop = r ? r.top + sy : 0;
      const heroBot = r ? r.bottom + sy : ih;
      const heroSpan = Math.max(1, heroBot - heroTop);
      // Once OpeningHold has unmounted (the visitor is past the opening) the hero
      // sits at the top of the page: the opening is over, so the tip keeps its
      // hero pose even at scrollY 0.
      const holding = !!document.querySelector('[data-scene-pose="opening"]');
      if (holding && sy < heroTop) phase = heroTop > 0 ? sy / heroTop : 1;
      else if (sy < heroBot) phase = 1 + Math.max(0, sy - heroTop) / heroSpan;
      else phase = 2 + Math.min(1, (sy - heroBot) / (ih * 0.2));
    };
    const onScroll = () => {
      updatePhase();
      wake();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    updatePhase();

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        lastTickT = performance.now();
        wake();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // ─── Frame ───────────────────────────────────────────────────────
    const startTime = performance.now();
    let lastTickT = startTime;
    let lastRender = 0;
    let lastGlow = '';
    let first = true;
    // Eased pose accumulator: x/y in half-heights, scale, yaw, opacity.
    const cur = { x: 0, y: 0, s: 1, yaw: YAW_OPEN };
    const proj = new THREE.Vector3();

    function tick() {
      raf = 0;
      const now = performance.now();
      // Layout can shift without a scroll event (OpeningHold unmounting).
      updatePhase();
      const t = (now - startTime) / 1000;
      const dt = Math.min(0.1, (now - lastTickT) / 1000);
      lastTickT = now;
      const vw = w();
      const vh = h();
      if (vw <= 0 || vh <= 0) return;
      const aspect = vw / vh;
      const H2 = CAM_D * TAN; // half the visible height at the tip's plane
      const W2 = H2 * aspect;
      const portrait = aspect < 0.85;

      const pose = smooth(clamp01((phase - 0.6) / 0.4));
      const fade = clamp01((phase - 1.7) / 0.3);

      // Size: the tip's length as a share of the visible width (wider share on
      // narrow screens), never taller than the frame allows.
      const share = lerp(0.84, 0.61, clamp01((aspect - 0.75) / 0.55));
      const s0 = Math.min(share * 2 * W2, 2.5 * H2);
      // Hero pose: right third on landscape, above the hero figures; upper band
      // (smaller, above the heading) on portrait.
      const heroX = portrait ? 0.02 : 0.5;
      const heroY = portrait ? 0.68 : 0.33;
      const heroS = portrait ? 0.6 : 0.62;
      const tx = lerp(0, heroX, pose) * aspect; // half-height units
      const ty = lerp(0, heroY, pose);
      const ts = s0 * lerp(1, heroS, pose);
      const tyaw = lerp(YAW_OPEN, YAW_HERO, pose);
      const targetO = 1 - fade;

      let moving = false;
      if (!reduced && !first) {
        const a = 1 - Math.exp(-dt / 0.18);
        const step = (k: 'x' | 'y' | 's' | 'yaw', target: number, eps: number) => {
          const d = target - cur[k];
          if (Math.abs(d) > eps) moving = true;
          cur[k] += d * a;
        };
        step('x', tx, 1e-4);
        step('y', ty, 1e-4);
        step('s', ts, 1e-4);
        step('yaw', tyaw, 0.01);
      } else {
        cur.x = tx;
        cur.y = ty;
        cur.s = ts;
        cur.yaw = tyaw;
      }
      first = false;

      // Idle sway (±3.5° yaw, ±1.2° pitch) and the orbiting rim light.
      const sway = reduced ? 0 : Math.sin((t * Math.PI * 2) / 14) * 3.5;
      const nod = reduced ? 0 : Math.sin((t * Math.PI * 2) / 19 + 1) * 1.2;
      outer.position.set(cur.x * H2, cur.y * H2, 0);
      outer.scale.setScalar(cur.s);
      outer.rotation.set(deg(PITCH + nod), deg(cur.yaw + sway), 0);
      setRim(
        deg(RIM_ANGLE) + (reduced ? 0 : (t / RIM_PERIOD_S) * Math.PI * 2),
        deg(cur.yaw - YAW_OPEN),
      );

      // A short fade-in once the model arrives (instant under reduced motion).
      const loadIn = !modelLoaded ? 0 : reduced ? 1 : clamp01((now - loadedAt) / 600);
      if (modelLoaded && loadIn < 1) moving = true;
      const opacity = targetO * loadIn;
      container.style.opacity = String(opacity);
      sceneVisible = opacity > 0.5;

      // Ember glow behind the tip (CSS, so it costs nothing to draw).
      proj.copy(outer.position).project(camera);
      const gx = Math.round(((proj.x + 1) / 2) * vw);
      const gy = Math.round(((1 - proj.y) / 2) * vh + vh * 0.06);
      const gr = Math.round(vh * lerp(0.75, portrait ? 0.5 : 0.62, pose));
      const glow = `radial-gradient(circle ${gr}px at ${gx}px ${gy}px, rgba(232,67,27,0.22), rgba(232,67,27,0.06) 45%, rgba(232,67,27,0) 100%)`;
      if (glow !== lastGlow) {
        container.style.background = glow;
        lastGlow = glow;
      }

      // Key star: ellipse behind the tip, sized to stay inside the frame. Same
      // screen size and path as before the scene change.
      const kH = (CAM_D + KEY_BEHIND) * TAN;
      const kRx = Math.min(0.523, 0.7 * aspect) * kH;
      const keyA = reduced ? Math.PI * 0.9 : t * 0.2;
      keyStar.position.set(
        cur.x * kH + Math.cos(keyA) * kRx,
        Math.sin(keyA) * 0.2615 * kH,
        -KEY_BEHIND,
      );
      keyStar.scale.setScalar(0.0567 * kH);
      keyMat.opacity = reduced ? 1 : 0.8 + Math.sin(t * 1.3) * 0.2;

      // Draw: every frame while the pose moves, ~30 fps while idling, once when
      // reduced. Nothing before the model arrives (its load wakes the loop) or once
      // faded out (a scroll back wakes it).
      const invisible = targetO < 0.01;
      const animating = modelLoaded && !invisible && (moving || !reduced);
      if (
        modelLoaded &&
        !invisible &&
        !contextLost &&
        (moving || reduced || now - lastRender > 31)
      ) {
        renderer.render(scene, camera);
        lastRender = now;
      }
      if (animating) raf = requestAnimationFrame(tick);
    }
    wake();

    // ─── Key star hit-testing ────────────────────────────────────────
    // The canvas is pointer-events:none behind the page, so listen on the
    // window and compare the pointer with the star's projected position.
    const raycaster = new THREE.Raycaster();
    const keyWorld = new THREE.Vector3();
    const INTERACTIVE = 'a,button,input,select,textarea,label,summary,[role="button"],[tabindex]';
    const overKeyStar = (e: MouseEvent): boolean => {
      if (!sceneVisible || !onSecretRef.current) return false;
      const target = e.target as Element | null;
      if (target?.closest?.(INTERACTIVE)) return false;
      keyStar.getWorldPosition(keyWorld);
      const ndc = keyWorld.clone().project(camera);
      if (ndc.z > 1) return false;
      const rect = renderer.domElement.getBoundingClientRect();
      const sx = rect.left + ((ndc.x + 1) / 2) * rect.width;
      const sy = rect.top + ((1 - ndc.y) / 2) * rect.height;
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > KEY_STAR_HIT_PX) return false;
      // Not while it passes behind the tip (hidden from view).
      raycaster.set(camera.position, keyWorld.clone().sub(camera.position).normalize());
      const dist = camera.position.distanceTo(keyWorld);
      const hit = raycaster.intersectObject(outer, true)[0];
      return !(hit && hit.distance < dist);
    };
    let hovering = false;
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const over = overKeyStar(e);
      if (over !== hovering) {
        hovering = over;
        document.documentElement.style.cursor = over ? 'pointer' : '';
      }
    };
    const onClick = (e: MouseEvent) => {
      if (overKeyStar(e)) onSecretRef.current?.();
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('click', onClick);

    // ─── Cleanup ─────────────────────────────────────────────────────
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('click', onClick);
      if (hovering) document.documentElement.style.cursor = '';
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMq?.removeEventListener?.('change', onReducedChange);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      window.visualViewport?.removeEventListener('resize', onResize);
      loaded.forEach((g) => g.dispose());
      bodyMat.dispose();
      machinedMat.dispose();
      keyMat.dispose();
      starSprite.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="scene-bg" aria-hidden="true" />;
}
