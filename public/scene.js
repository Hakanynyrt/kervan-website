// Kervan Heat — scene.js
// Scroll-driven chisel: different pose per section, smoothly lerped.

(async function () {
  const THREE = await import('three');
  const { GLTFLoader }      = await import('three/addons/loaders/GLTFLoader.js');
  const { DRACOLoader }     = await import('three/addons/loaders/DRACOLoader.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.getElementById('scene-root') || (() => {
    const d = document.createElement('div');
    d.id = 'scene-root';
    document.body.insertBefore(d, document.body.firstChild);
    return d;
  })();

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  cam.position.set(0, 0, 22);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  root.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  function resize() {
    const w = root.clientWidth  || innerWidth;
    const h = root.clientHeight || innerHeight;
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resize();
  addEventListener('resize', resize);

  const key = new THREE.DirectionalLight(0xFFFFFF, 2.8);
  key.position.set(3, 6, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xE8781A, 2.0);
  rim.position.set(-5, -1, -4);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0x9DB4D8, 0.6);
  fill.position.set(-4, 3, 2);
  scene.add(fill);

  // Pose group — all keyframe targets apply here. Rest pose is identity.
  const pose = new THREE.Group();
  scene.add(pose);

  // ─────────────────────────────────────────────────────────────────────
  // Keyframes per section. Each entry: the selector for that section +
  // the pose the chisel should settle into while that section is centered.
  //   rx,ry,rz : rotation in radians
  //   px,py    : offset in world units (z kept at 0)
  //   s        : uniform scale multiplier
  //   o        : opacity (0..1) — driven into material
  // ─────────────────────────────────────────────────────────────────────
  // Small-badge keyframes: chisel stays centered in its 380px canvas; only
  // rotation and small sub-pixel drift change per section. Opacity eases
  // on sections that already have heavy content so the badge recedes.
  const KF = [
    // 0 — Hero: diagonal attack
    { sel: '.hero',       rx: -0.06, ry:  0.22, rz: -Math.PI / 5.5,  px:  0.0, py:  0.0, s: 1.00, o: 1.00 },
    // 1 — Products: turned 3/4, slight tilt; cards are busy so fade a bit
    { sel: '#products',   rx:  0.10, ry: -0.60, rz: -Math.PI / 3.5,  px:  0.0, py:  0.0, s: 1.00, o: 0.55 },
    // 2 — Craft: vertical, tip up, stands on its axis
    { sel: '#craft',      rx: -0.02, ry:  0.85, rz:  Math.PI * 0.02, px:  0.0, py:  0.2, s: 1.00, o: 0.85 },
    // 3 — Industries: lying horizontal, as if resting
    { sel: '#industries', rx: -0.08, ry:  0.30, rz:  Math.PI / 2,    px:  0.0, py:  0.0, s: 0.95, o: 0.65 },
    // 4 — Contact: soft diagonal, faint — form is the hero here
    { sel: '#contact',    rx:  0.12, ry: -0.40, rz: -Math.PI / 4,    px:  0.0, py:  0.0, s: 0.90, o: 0.40 },
  ];

  let needsCompute = true;

  // Resolve actual section elements. React mounts asynchronously, so the
  // sections may not exist when this module first runs. Re-poll until they
  // show up, then stop.
  let sections = [];
  function resolveSections() {
    const next = KF
      .map(k => ({ ...k, el: document.querySelector(k.sel) }))
      .filter(k => k.el);
    if (next.length > sections.length) {
      sections = next;
      needsCompute = true;
    }
    return sections.length === KF.length;
  }
  if (!resolveSections()) {
    const iv = setInterval(() => { if (resolveSections()) clearInterval(iv); }, 120);
    setTimeout(() => clearInterval(iv), 15000);
  }

  // Current animated state (lerp target). Start at KF[0].
  const cur = { rx: KF[0].rx, ry: KF[0].ry, rz: KF[0].rz, px: 0, py: 0, s: 1, o: 1 };
  const tgt = { ...cur };

  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); } // smoothstep

  // Decide which two keyframes to blend between based on viewport center.
  function computeTarget() {
    if (sections.length === 0) return;
    const vhHalf = innerHeight * 0.5;
    // For each section, find its center's distance from viewport center,
    // normalized. We blend between the section we're currently "in" and
    // the neighbor we're heading toward.
    const centers = sections.map(s => {
      const r = s.el.getBoundingClientRect();
      return r.top + r.height * 0.5;
    });

    // Find the section whose center is closest — that's the "active" one.
    let active = 0;
    let minD = Infinity;
    for (let i = 0; i < centers.length; i++) {
      const d = Math.abs(centers[i] - vhHalf);
      if (d < minD) { minD = d; active = i; }
    }

    // Determine the neighbor we're heading toward (above or below).
    let neighbor = active;
    if (active < sections.length - 1 && centers[active] < vhHalf) neighbor = active + 1;
    else if (active > 0 && centers[active] > vhHalf) neighbor = active - 1;

    const a = sections[active];
    const b = sections[neighbor];

    // Blend factor: 0 at active center, 1 at neighbor center.
    let t = 0;
    if (neighbor !== active) {
      const span = Math.abs(centers[neighbor] - centers[active]);
      const prog = Math.abs(centers[active] - vhHalf) / (span || 1);
      t = Math.max(0, Math.min(1, prog));
    }
    t = smooth(t);

    tgt.rx = lerp(a.rx, b.rx, t);
    tgt.ry = lerp(a.ry, b.ry, t);
    tgt.rz = lerp(a.rz, b.rz, t);
    tgt.px = lerp(a.px, b.px, t);
    tgt.py = lerp(a.py, b.py, t);
    tgt.s  = lerp(a.s,  b.s,  t);
    tgt.o  = lerp(a.o,  b.o,  t);
  }

  addEventListener('scroll',  () => { needsCompute = true; }, { passive: true });
  addEventListener('resize',  () => { needsCompute = true; });

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
  draco.setDecoderConfig({ type: 'js' });
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  const materials = [];
  let modelLoaded = false;

  loader.load(
    '/kirici-uc.glb',
    (gltf) => {
      const m = gltf.scene;
      const box = new THREE.Box3().setFromObject(m);
      const sz = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const s = 11 / Math.max(sz.x, sz.y, sz.z);
      m.scale.setScalar(s);
      m.position.copy(center).multiplyScalar(-s);
      m.traverse(o => {
        if (o.isMesh && o.material) {
          o.material.color = new THREE.Color(0x2a2a2e);
          o.material.metalness = 0.92;
          o.material.roughness = 0.28;
          o.material.envMapIntensity = 1.3;
          o.material.transparent = true;
          o.material.needsUpdate = true;
          materials.push(o.material);
        }
      });
      pose.add(m);
      modelLoaded = true;
      computeTarget();
    },
    undefined,
    err => console.error('[scene] /kirici-uc.glb load failed', err)
  );

  // Ease factor — higher = snappier. reduced-motion jumps instantly.
  const EASE = reduced ? 1.0 : 0.08;

  function tick() {
    if (needsCompute) { computeTarget(); needsCompute = false; }

    cur.rx = lerp(cur.rx, tgt.rx, EASE);
    cur.ry = lerp(cur.ry, tgt.ry, EASE);
    cur.rz = lerp(cur.rz, tgt.rz, EASE);
    cur.px = lerp(cur.px, tgt.px, EASE);
    cur.py = lerp(cur.py, tgt.py, EASE);
    cur.s  = lerp(cur.s,  tgt.s,  EASE);
    cur.o  = lerp(cur.o,  tgt.o,  EASE);

    pose.rotation.set(cur.rx, cur.ry, cur.rz);
    pose.position.set(cur.px, cur.py, 0);
    pose.scale.setScalar(cur.s);

    if (modelLoaded) {
      for (let i = 0; i < materials.length; i++) materials[i].opacity = cur.o;
    }

    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
