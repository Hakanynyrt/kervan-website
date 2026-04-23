// Kervan Heat — scene.js
// Museum display. Single chisel, tip pointing DOWN, fully visible and
// centred in the badge. Rotates slowly on its own vertical (Y) axis so
// every face gets shown. No scroll coupling, no cursor coupling —
// the object lives on its own time.

(async function () {
  const THREE = await import('three');
  const { GLTFLoader }      = await import('three/addons/loaders/GLTFLoader.js');
  const { DRACOLoader }     = await import('three/addons/loaders/DRACOLoader.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

  if (window.matchMedia('(max-width: 1100px)').matches) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.getElementById('scene-root') || (() => {
    const d = document.createElement('div');
    d.id = 'scene-root';
    document.body.insertBefore(d, document.body.firstChild);
    return d;
  })();

  const scene = new THREE.Scene();
  const FOV = 34;
  const CAM_Z = 18;
  const cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  cam.position.set(0, 0, CAM_Z);

  const VISIBLE_H = 2 * Math.tan((FOV * Math.PI / 180) / 2) * CAM_Z;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearAlpha(0);
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

  // Three-point lighting — warm key, cool fill, orange rim for forge accent.
  const key = new THREE.DirectionalLight(0xFFE6BE, 3.0);
  key.position.set(4, 5, 6);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9DB4D8, 0.7);
  fill.position.set(-4, 2, 3);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xE8781A, 1.4);
  rim.position.set(-3, -2, -4);
  scene.add(rim);

  // spinGroup: spins on Y. orientGroup: holds the centred, tip-down model
  // so scale doesn't affect the spin pivot.
  const spinGroup   = new THREE.Group();
  const orientGroup = new THREE.Group();
  spinGroup.add(orientGroup);
  scene.add(spinGroup);

  let modelLoaded = false;

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
  draco.setDecoderConfig({ type: 'js' });
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  loader.load(
    '/kirici-uc.glb',
    (gltf) => {
      const m = gltf.scene;

      // 1. Centre on origin in object space.
      const box0   = new THREE.Box3().setFromObject(m);
      const center = box0.getCenter(new THREE.Vector3());
      m.position.sub(center);

      // 2. Align longest axis with +Y. Previous build used -π/2 and the tip
      //    ended up UP — so use +π/2 instead (flips the long axis by 180°).
      const sz0 = box0.getSize(new THREE.Vector3());
      const longestVal = Math.max(sz0.x, sz0.y, sz0.z);
      if (sz0.x === longestVal)        m.rotation.z =  Math.PI / 2; // X-long → tip down
      else if (sz0.z === longestVal)   m.rotation.x = -Math.PI / 2; // Z-long → tip down
      else                             m.rotation.z =  Math.PI;     // Y-long → flip so tip is at -Y

      // 3. Re-centre after rotation (AABB centre shifts for asymmetric shapes).
      m.updateMatrixWorld(true);
      const box1   = new THREE.Box3().setFromObject(m);
      const center1 = box1.getCenter(new THREE.Vector3());
      m.position.sub(center1);
      m.updateMatrixWorld(true);

      // 4. Scale so the long (Y) dimension fills ~72% of the visible height,
      //    leaving breathing room top and bottom.
      const box2   = new THREE.Box3().setFromObject(m);
      const sz2    = box2.getSize(new THREE.Vector3());
      const targetH = VISIBLE_H * 0.72;
      const scale = targetH / sz2.y;
      orientGroup.scale.setScalar(scale);

      // 5. Dark-steel material.
      m.traverse(o => {
        if (o.isMesh && o.material) {
          o.material.color           = new THREE.Color(0x2a2a2e);
          o.material.metalness       = 0.92;
          o.material.roughness       = 0.28;
          o.material.envMapIntensity = 1.3;
          o.material.needsUpdate     = true;
        }
      });

      orientGroup.add(m);
      modelLoaded = true;
    },
    undefined,
    err => console.error('[scene] /kirici-uc.glb load failed', err)
  );

  // ─── Museum rotation ─────────────────────────────────────────────────
  // Very slow Y-axis spin. A full turn takes ~40s. Reduced-motion → still.
  const SPIN_PER_SEC = reduced ? 0 : (Math.PI * 2) / 40;

  let lastT = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    if (modelLoaded) spinGroup.rotation.y += SPIN_PER_SEC * dt;
    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
