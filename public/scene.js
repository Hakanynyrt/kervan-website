// Kervan Heat — scene.js
// Sabit çapraz poz, koyu çelik. Hareket yok, temiz zemin.

(async function () {
  const THREE = await import('three');
  const { GLTFLoader }      = await import('three/addons/loaders/GLTFLoader.js');
  const { DRACOLoader }     = await import('three/addons/loaders/DRACOLoader.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

  const isMobile = window.matchMedia('(max-width: 900px)').matches;

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

  // Environment for metallic reflections
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

  // Lights
  const key = new THREE.DirectionalLight(0xFFFFFF, 2.8);
  key.position.set(3, 6, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xE8781A, 2.0);
  rim.position.set(-5, -1, -4);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0x9DB4D8, 0.6);
  fill.position.set(-4, 3, 2);
  scene.add(fill);

  // Pivot — statically posed diagonal
  const pose = new THREE.Group();
  pose.rotation.z = -Math.PI / 5.5;   // ~-33°  → gentle diagonal
  pose.rotation.y =  0.22;            // slight turn toward viewer
  pose.rotation.x = -0.06;            // tiny forward tilt
  scene.add(pose);

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
      m.position.sub(box.getCenter(new THREE.Vector3()));
      m.scale.setScalar(11 / Math.max(sz.x, sz.y, sz.z));
      m.traverse(o => {
        if (o.isMesh && o.material) {
          o.material.color = new THREE.Color(0x2a2a2e);
          o.material.metalness = 0.92;
          o.material.roughness = 0.28;
          o.material.envMapIntensity = 1.3;
          o.material.needsUpdate = true;
        }
      });
      pose.add(m);
    },
    undefined,
    err => console.error('[scene] /kirici-uc.glb load failed', err)
  );

  function tick() {
    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
