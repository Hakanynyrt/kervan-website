// Kervan Heat — scene.js
// Parts still-life: chisel + piston + bushing + kit arranged as a sculptural
// composition. No scroll coupling, no turntable spin. Cursor parallax only:
// when the user moves the mouse, the whole stage tilts gently toward it.

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
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  cam.position.set(0, 0, 18);

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

  // Product-photo lighting: warm key from upper-right, cool fill from left,
  // orange rim behind. Static — composition is the point, not motion.
  const key = new THREE.DirectionalLight(0xFFE6BE, 3.0);
  key.position.set(4, 5, 6);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9DB4D8, 0.7);
  fill.position.set(-4, 2, 3);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xE8781A, 1.4);
  rim.position.set(-3, -2, -4);
  scene.add(rim);

  // The "stage" is the parent group that holds all four parts. Cursor tilt
  // applies here, so parts move together as one composition.
  const stage = new THREE.Group();
  scene.add(stage);

  function makeMetal(hex, roughness, metalness) {
    return new THREE.MeshStandardMaterial({
      color:           new THREE.Color(hex),
      metalness:       metalness ?? 0.92,
      roughness:       roughness ?? 0.30,
      envMapIntensity: 1.25,
    });
  }

  // ─── 1. Chisel (loaded async from GLB) ────────────────────────────────
  // Sits center-left, slightly tilted, the largest piece.
  const chiselSlot = new THREE.Group();
  chiselSlot.position.set(-1.0, 1.0, 0);
  chiselSlot.rotation.set(-0.08, 0.2, -Math.PI / 6.5);
  stage.add(chiselSlot);

  // ─── 2. Piston — tall cylinder, upper right ──────────────────────────
  const piston = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 4.0, 48),
    makeMetal(0x3a3a42, 0.22)
  );
  piston.position.set(2.8, 1.2, -0.4);
  piston.rotation.z = 0.18;
  // Cap rings to suggest a real piston (top and bottom collars)
  const collarMat = makeMetal(0x2a2a2e, 0.28);
  const collarTop = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.10, 12, 32), collarMat);
  collarTop.position.y = 1.7;
  collarTop.rotation.x = Math.PI / 2;
  piston.add(collarTop);
  const collarBot = collarTop.clone();
  collarBot.position.y = -1.7;
  piston.add(collarBot);
  stage.add(piston);

  // ─── 3. Bushing — flat torus, lower left ─────────────────────────────
  const bushing = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.42, 24, 56),
    makeMetal(0x4a3a2a, 0.36) // warm bronze tint, hints at a different alloy
  );
  bushing.position.set(-2.6, -2.4, 0.4);
  bushing.rotation.x = Math.PI / 2.2;
  bushing.rotation.y = 0.4;
  stage.add(bushing);

  // ─── 4. Kit — small faceted shape, lower right ───────────────────────
  // Stand-in for "seal/fastener kit" — a clustered geometric form.
  const kitGroup = new THREE.Group();
  kitGroup.position.set(2.4, -2.5, 0.6);
  kitGroup.rotation.set(0.3, 0.8, 0.2);
  const kitMat = makeMetal(0x252528, 0.40);
  const kitCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), kitMat);
  kitGroup.add(kitCore);
  const kitRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.08, 10, 28),
    makeMetal(0xE8781A, 0.45, 0.7) // brand-colored ring, pop of orange
  );
  kitRing.rotation.x = Math.PI / 2.5;
  kitGroup.add(kitRing);
  stage.add(kitGroup);

  // ─── Load the chisel GLB into chiselSlot ─────────────────────────────
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
  draco.setDecoderConfig({ type: 'js' });
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  loader.load(
    '/kirici-uc.glb',
    (gltf) => {
      const m = gltf.scene;
      const box = new THREE.Box3().setFromObject(m);
      const sz = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const s = 6.5 / Math.max(sz.x, sz.y, sz.z); // scaled smaller now
      m.scale.setScalar(s);
      m.position.copy(center).multiplyScalar(-s);
      m.traverse(o => {
        if (o.isMesh && o.material) {
          o.material.color           = new THREE.Color(0x2a2a2e);
          o.material.metalness       = 0.92;
          o.material.roughness       = 0.28;
          o.material.envMapIntensity = 1.3;
          o.material.needsUpdate     = true;
        }
      });
      chiselSlot.add(m);
    },
    undefined,
    err => console.error('[scene] /kirici-uc.glb load failed', err)
  );

  // ─── Cursor parallax ─────────────────────────────────────────────────
  // The stage tilts gently toward the cursor (max ±9°). When the cursor
  // leaves the window or the page is loaded with no input, tilt is zero
  // — composition is perfectly still.
  let tgtX = 0, tgtY = 0, curX = 0, curY = 0;
  if (!reduced) {
    addEventListener('mousemove', (e) => {
      const nx = (e.clientX / innerWidth)  * 2 - 1;   // -1..1
      const ny = (e.clientY / innerHeight) * 2 - 1;   // -1..1
      tgtY = nx * 0.16;   // yaw  follows cursor X
      tgtX = -ny * 0.10;  // pitch follows cursor Y (inverted)
    }, { passive: true });
    addEventListener('mouseleave', () => { tgtX = 0; tgtY = 0; });
  }

  function tick() {
    const ease = reduced ? 1.0 : 0.06;
    curX += (tgtX - curX) * ease;
    curY += (tgtY - curY) * ease;
    stage.rotation.x = curX;
    stage.rotation.y = curY;
    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
