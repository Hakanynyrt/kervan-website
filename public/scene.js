// Kervan Heat — scene.js
// Sakin tek keski: hafifçe döner, nefes alır gibi. Dikkat dağıtmaz.
// Repodaki /kirici-uc.glb kullanılır. Dış kaynak yok.

(async function () {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const reduce   = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // ── Root ──────────────────────────────────────────────────────────────
  const root = document.getElementById('scene-root') || (() => {
    const d = document.createElement('div');
    d.id = 'scene-root';
    document.body.insertBefore(d, document.body.firstChild);
    return d;
  })();

  // ── Renderer ──────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  cam.position.set(0, 0, 14);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  root.appendChild(renderer.domElement);

  function resize() {
    const w = root.clientWidth || innerWidth;
    const h = root.clientHeight || innerHeight;
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resize();
  addEventListener('resize', resize);

  // ── Lights — soft studio ──────────────────────────────────────────────
  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xE8E1D4, 0.85));

  const key = new THREE.DirectionalLight(0xFFF5E8, 2.4);
  key.position.set(4, 6, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xFFD9B0, 0.9);
  fill.position.set(-6, 2, 3);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xE8781A, 1.2);
  rim.position.set(-4, -2, -5);
  scene.add(rim);

  // ── Chisel pivot ──────────────────────────────────────────────────────
  const spin = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.add(spin);
  tilt.rotation.z = 0.12;
  scene.add(tilt);

  new GLTFLoader().load(
    '/kirici-uc.glb',
    (gltf) => {
      const m = gltf.scene;
      const box = new THREE.Box3().setFromObject(m);
      const sz = box.getSize(new THREE.Vector3());
      m.position.sub(box.getCenter(new THREE.Vector3()));
      m.scale.setScalar(11 / Math.max(sz.x, sz.y, sz.z));
      if (sz.z >= sz.y && sz.z >= sz.x) m.rotation.x = Math.PI / 2;
      else if (sz.x > sz.y) m.rotation.z = -Math.PI / 2;
      m.traverse(o => {
        if (o.isMesh && o.material) {
          o.material.metalness = Math.max(o.material.metalness ?? 0, 0.85);
          o.material.roughness = Math.min(o.material.roughness ?? 1, 0.38);
        }
      });
      spin.add(m);
    },
    undefined,
    err => console.warn('[scene] GLB load failed', err)
  );

  // ── Loop ──────────────────────────────────────────────────────────────
  let prevT = performance.now() / 1000;
  let elapsed = 0;

  function tick() {
    const now = performance.now() / 1000;
    const dt = Math.min(now - prevT, 0.05);
    prevT = now;
    elapsed += dt;

    if (!reduce) {
      spin.rotation.y = elapsed * 0.18;
      tilt.position.y = Math.sin(elapsed * 0.35) * 0.18;
      tilt.rotation.x = Math.sin(elapsed * 0.22) * 0.05;
    }

    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
