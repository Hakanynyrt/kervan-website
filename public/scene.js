// Kervan Heat — scene.js
// "Keski okuyor": chisel tip aims at the heading currently in view; lighting
// shifts per section like the time of day moving across the workshop.

(async function () {
  const THREE = await import('three');
  const { GLTFLoader }      = await import('three/addons/loaders/GLTFLoader.js');
  const { DRACOLoader }     = await import('three/addons/loaders/DRACOLoader.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

  const isMobile = window.matchMedia('(max-width: 1100px)').matches;
  const reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isMobile) return; // badge is hidden under 1100px

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
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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

  // Three lights we lerp per section: key (main), rim (accent), fill (sky).
  const key  = new THREE.DirectionalLight(0xFFFFFF, 2.6); key.position.set(3, 5, 6);   scene.add(key);
  const rim  = new THREE.DirectionalLight(0xE8781A, 1.8); rim.position.set(-5, -1, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x9DB4D8, 0.6); fill.position.set(-4, 3, 2);  scene.add(fill);

  const pose = new THREE.Group();
  scene.add(pose);

  // ─────────────────────────────────────────────────────────────────────
  // Sections: each has a heading the chisel will aim at, plus a light
  // palette that becomes active as the heading nears viewport center.
  // ─────────────────────────────────────────────────────────────────────
  const SECTIONS = [
    {
      sel: '.hero', headSel: '.hero .display',
      // Morning — warm key from upper right, gentle blue fill
      lights: {
        key:  { color: 0xFFE6BE, dir: [ 4,  5,  5], intensity: 2.8 },
        rim:  { color: 0xE8781A, dir: [-5, -1, -4], intensity: 1.6 },
        fill: { color: 0x9DB4D8, dir: [-4,  3,  2], intensity: 0.6 },
        exposure: 1.05,
      },
      opacity: 1.0,
    },
    {
      sel: '#products', headSel: '#products .h2',
      // Noon — clean top-down, low contrast
      lights: {
        key:  { color: 0xFFFFFF, dir: [ 0,  8,  4], intensity: 3.4 },
        rim:  { color: 0xCCCCCC, dir: [ 0, -3, -2], intensity: 0.5 },
        fill: { color: 0xF5F2EC, dir: [-3,  4,  5], intensity: 0.9 },
        exposure: 1.10,
      },
      opacity: 0.85,
    },
    {
      sel: '#craft', headSel: '#craft .h2',
      // Forge — strong orange rim, dim ambient
      lights: {
        key:  { color: 0xFFB070, dir: [ 4,  2,  3], intensity: 2.2 },
        rim:  { color: 0xFF7A14, dir: [-3, -2, -3], intensity: 3.2 },
        fill: { color: 0x4A3520, dir: [-2,  1,  1], intensity: 0.4 },
        exposure: 1.00,
      },
      opacity: 0.95,
    },
    {
      sel: '#industries', headSel: '#industries .h2',
      // Worksite — cool hard side light, deep shadow
      lights: {
        key:  { color: 0xE0E8F2, dir: [ 6,  1,  2], intensity: 3.6 },
        rim:  { color: 0x2E2A26, dir: [-6, -3, -2], intensity: 1.0 },
        fill: { color: 0xB8C0CA, dir: [-2,  4,  4], intensity: 0.3 },
        exposure: 0.92,
      },
      opacity: 0.75,
    },
    {
      sel: '#contact', headSel: '#contact .h2',
      // Dusk — low warm key, dark frame
      lights: {
        key:  { color: 0xFFCFA0, dir: [ 2,  3,  5], intensity: 1.5 },
        rim:  { color: 0x6A4A6A, dir: [-3, -1, -3], intensity: 1.4 },
        fill: { color: 0xA89A88, dir: [-3,  2,  2], intensity: 0.5 },
        exposure: 0.85,
      },
      opacity: 0.45,
    },
  ];

  // Lazy-resolve section + heading elements (React mounts asynchronously).
  let resolved = false;
  function resolveSections() {
    let ok = true;
    for (const s of SECTIONS) {
      if (!s.el) s.el = document.querySelector(s.sel) || null;
      if (!s.headEl) s.headEl = document.querySelector(s.headSel) || null;
      if (!s.el || !s.headEl) ok = false;
    }
    if (ok) resolved = true;
    return ok;
  }
  if (!resolveSections()) {
    const iv = setInterval(() => { if (resolveSections()) clearInterval(iv); }, 120);
    setTimeout(() => clearInterval(iv), 15000);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpColor(out, a, b, t) {
    out.r = lerp(a.r, b.r, t);
    out.g = lerp(a.g, b.g, t);
    out.b = lerp(a.b, b.b, t);
    return out;
  }

  // Pre-build Color objects for palettes so we don't allocate every frame.
  for (const s of SECTIONS) {
    s._kColor = new THREE.Color(s.lights.key.color);
    s._rColor = new THREE.Color(s.lights.rim.color);
    s._fColor = new THREE.Color(s.lights.fill.color);
  }
  const tmpCol = new THREE.Color();

  // Pick the section whose heading center is closest to viewport center,
  // and a blend factor toward the neighbor we are heading toward.
  function activeBlend() {
    if (!SECTIONS.some(s => s.headEl)) return null;
    const vhc = innerHeight * 0.5;
    const centers = SECTIONS.map(s => {
      if (!s.headEl) return Infinity;
      const r = s.headEl.getBoundingClientRect();
      return r.top + r.height * 0.5;
    });
    let active = 0, minD = Infinity;
    for (let i = 0; i < centers.length; i++) {
      const d = Math.abs(centers[i] - vhc);
      if (d < minD) { minD = d; active = i; }
    }
    let neighbor = active;
    if (active < SECTIONS.length - 1 && centers[active] < vhc) neighbor = active + 1;
    else if (active > 0 && centers[active] > vhc) neighbor = active - 1;
    let t = 0;
    if (neighbor !== active) {
      const span = Math.abs(centers[neighbor] - centers[active]);
      const prog = Math.abs(centers[active] - vhc) / (span || 1);
      t = Math.max(0, Math.min(1, prog));
      // smoothstep
      t = t * t * (3 - 2 * t);
    }
    return { a: SECTIONS[active], b: SECTIONS[neighbor], t };
  }

  // The chisel "tip" should aim at the heading currently most in view.
  // We weight each heading by how close it is to viewport center (linear
  // falloff over one viewport height) so the target moves continuously
  // rather than snapping at section boundaries.
  function pointerTargetScreen() {
    if (!resolved && !SECTIONS.some(s => s.headEl)) return null;
    const vh = innerHeight, c = vh * 0.5;
    let totalW = 0, tx = 0, ty = 0;
    for (const s of SECTIONS) {
      if (!s.headEl) continue;
      const r = s.headEl.getBoundingClientRect();
      const hx = r.left + r.width * 0.5;
      const hy = r.top + r.height * 0.5;
      const w = Math.max(0, 1 - Math.abs(hy - c) / vh);
      if (w > 0) {
        totalW += w;
        tx += hx * w;
        ty += hy * w;
      }
    }
    if (totalW === 0) return null;
    return { x: tx / totalW, y: ty / totalW };
  }

  // Tip-axis calibration: after the model loads at default orientation, we
  // pick the world-space direction that the visible "tip" points along.
  // Most chisel GLBs export with the long axis on Y; the tip is one end.
  // This is a single Z rotation offset that makes "rz=0 → tip points up".
  // Tweak if the tip ends up pointing the wrong way after first deploy.
  const TIP_OFFSET_Z = -Math.PI / 2; // tip points along screen +X (right) at rz=0

  // Convert a screen-space point to a desired pose.rotation.z so that the
  // chisel's tip aims toward that point from the chisel canvas center.
  function screenToTipAngle(px, py) {
    const r = root.getBoundingClientRect();
    const cx = r.left + r.width * 0.5;
    const cy = r.top  + r.height * 0.5;
    const dx = px - cx;
    const dy = py - cy;
    // Three.js +Y is up; screen +Y is down. Flip Y for world angle.
    const worldAngle = Math.atan2(-dy, dx);
    return worldAngle + TIP_OFFSET_Z;
  }

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
    },
    undefined,
    err => console.error('[scene] /kirici-uc.glb load failed', err)
  );

  // Animated state
  const cur = {
    rz: -Math.PI / 5.5,
    opacity: 1.0,
    keyColor: new THREE.Color(SECTIONS[0].lights.key.color),
    keyInt:  SECTIONS[0].lights.key.intensity,
    rimColor: new THREE.Color(SECTIONS[0].lights.rim.color),
    rimInt:  SECTIONS[0].lights.rim.intensity,
    fillColor: new THREE.Color(SECTIONS[0].lights.fill.color),
    fillInt: SECTIONS[0].lights.fill.intensity,
    exposure: 1.0,
  };

  const EASE_ROT  = reduced ? 1.0 : 0.10;
  const EASE_LIGHT = reduced ? 1.0 : 0.06;

  function tick() {
    // Pointer
    const tgt = pointerTargetScreen();
    if (tgt) {
      const desiredZ = screenToTipAngle(tgt.x, tgt.y);
      // Wrap-aware lerp: pick the shorter angular path.
      let delta = desiredZ - cur.rz;
      while (delta >  Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      cur.rz += delta * EASE_ROT;
      pose.rotation.set(0, 0, cur.rz);
    }

    // Lighting
    const blend = activeBlend();
    if (blend) {
      const A = blend.a, B = blend.b, t = blend.t;
      // Target colors / intensities / opacity / exposure
      lerpColor(tmpCol, A._kColor, B._kColor, t);
      cur.keyColor.lerp(tmpCol, EASE_LIGHT);
      key.color.copy(cur.keyColor);
      cur.keyInt = lerp(cur.keyInt, lerp(A.lights.key.intensity, B.lights.key.intensity, t), EASE_LIGHT);
      key.intensity = cur.keyInt;

      lerpColor(tmpCol, A._rColor, B._rColor, t);
      cur.rimColor.lerp(tmpCol, EASE_LIGHT);
      rim.color.copy(cur.rimColor);
      cur.rimInt = lerp(cur.rimInt, lerp(A.lights.rim.intensity, B.lights.rim.intensity, t), EASE_LIGHT);
      rim.intensity = cur.rimInt;

      lerpColor(tmpCol, A._fColor, B._fColor, t);
      cur.fillColor.lerp(tmpCol, EASE_LIGHT);
      fill.color.copy(cur.fillColor);
      cur.fillInt = lerp(cur.fillInt, lerp(A.lights.fill.intensity, B.lights.fill.intensity, t), EASE_LIGHT);
      fill.intensity = cur.fillInt;

      cur.exposure = lerp(cur.exposure, lerp(A.lights.exposure, B.lights.exposure, t), EASE_LIGHT);
      renderer.toneMappingExposure = cur.exposure;

      cur.opacity = lerp(cur.opacity, lerp(A.opacity, B.opacity, t), EASE_LIGHT);
      if (modelLoaded) {
        for (let i = 0; i < materials.length; i++) materials[i].opacity = cur.opacity;
      }
    }

    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
