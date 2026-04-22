// Kervan Heat — scene.js
// Sakin tek keski: hafifçe döner, nefes alır gibi.

(async function () {
  const THREE = await import('three');
  const { GLTFLoader }       = await import('three/addons/loaders/GLTFLoader.js');
  const { RoomEnvironment }  = await import('three/addons/environments/RoomEnvironment.js');

  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const reduce   = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const root = document.getElementById('scene-root') || (() => {
    const d = document.createElement('div');
    d.id = 'scene-root';
    document.body.insertBefore(d, document.body.firstChild);
    return d;
  })();

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  cam.position.set(0, 0.5, 16);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  root.appendChild(renderer.domElement);

  // ── Environment (procedural room) for metallic reflections ──
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

  // ── Lights — darker key for contrast on light bg ──
  const key = new THREE.DirectionalLight(0xFFFFFF, 2.8);
  key.position.set(3, 6, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xE8781A, 2.0);
  rim.position.set(-5, -1, -4);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0x9DB4D8, 0.6);
  fill.position.set(-4, 3, 2);
  scene.add(fill);

  // ── Chisel pivot ──
  const spin = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.add(spin);
  tilt.rotation.z = 0.14;
  scene.add(tilt);

  let loaded = false;
  new GLTFLoader().load(
    '/kirici-uc.glb',
    (gltf) => {
      const m = gltf.scene;
      const box = new THREE.Box3().setFromObject(m);
      const sz = box.getSize(new THREE.Vector3());
      m.position.sub(box.getCenter(new THREE.Vector3()));
      m.scale.setScalar(9 / Math.max(sz.x, sz.y, sz.z));
      if (sz.z >= sz.y && sz.z >= sz.x) m.rotation.x = Math.PI / 2;
      else if (sz.x > sz.y) m.rotation.z = -Math.PI / 2;
      m.traverse(o => {
        if (o.isMesh && o.material) {
          // Darker steel so it's readable on cream bg
          o.material.color = new THREE.Color(0x2a2a2e);
          o.material.metalness = 0.92;
          o.material.roughness = 0.28;
          o.material.envMapIntensity = 1.3;
          o.material.needsUpdate = true;
        }
      });
      spin.add(m);
      loaded = true;
    },
    undefined,
    err => {
      console.warn('[scene] GLB load failed, using fallback', err);
      // Fallback — simple cylinder + cone to represent a chisel
      const mat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.92, roughness: 0.28, envMapIntensity: 1.3 });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 6.5, 48), mat);
      const tip   = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 48), mat);
      tip.position.y = 4.35;
      const head  = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.7, 48), mat);
      head.position.y = -3.6;
      const grp = new THREE.Group();
      grp.add(shaft); grp.add(tip); grp.add(head);
      grp.rotation.z = Math.PI / 2;
      spin.add(grp);
      loaded = true;
    }
  );

  // ── Loop ──
  let prevT = performance.now() / 1000;
  let elapsed = 0;

  function tick() {
    const now = performance.now() / 1000;
    const dt = Math.min(now - prevT, 0.05);
    prevT = now;
    elapsed += dt;

    if (!reduce) {
      spin.rotation.y = elapsed * 0.22;
      tilt.position.y = Math.sin(elapsed * 0.35) * 0.22;
      tilt.rotation.x = Math.sin(elapsed * 0.22) * 0.06;
    }

    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
