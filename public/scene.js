// Kervan Heat — scene.js
// Single chisel, oriented vertically, slid by scroll progress: at the top of
// the page the chisel's TOP fills the badge; as you scroll down the page the
// camera tour reveals progressively lower parts, ending on the tip.

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
  // Fixed camera looking at origin; the chisel slides up/down past it.
  const FOV = 34;
  const CAM_Z = 18;
  const cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  cam.position.set(0, 0, CAM_Z);

  // Vertical extent visible at the origin plane (z=0).
  const VISIBLE_H = 2 * Math.tan((FOV * Math.PI / 180) / 2) * CAM_Z;

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

  // Static product-photo lighting.
  const key = new THREE.DirectionalLight(0xFFE6BE, 3.0);
  key.position.set(4, 5, 6);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9DB4D8, 0.7);
  fill.position.set(-4, 2, 3);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xE8781A, 1.4);
  rim.position.set(-3, -2, -4);
  scene.add(rim);

  // chiselGroup: parent that we slide vertically. The model is centered and
  // re-oriented inside it so its longest axis is +Y (vertical, head at top).
  const chiselGroup = new THREE.Group();
  scene.add(chiselGroup);

  let chiselHeight = 0;     // world-space vertical extent after scaling
  let modelLoaded  = false;

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
  draco.setDecoderConfig({ type: 'js' });
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  loader.load(
    '/kirici-uc.glb',
    (gltf) => {
      const m = gltf.scene;

      // 1. Center on origin in object space.
      const box0   = new THREE.Box3().setFromObject(m);
      const center = box0.getCenter(new THREE.Vector3());
      m.position.sub(center);

      // 2. Find longest axis in object space and rotate so it aligns with +Y.
      const sz0 = box0.getSize(new THREE.Vector3());
      const longest = Math.max(sz0.x, sz0.y, sz0.z);
      let widthA, widthB;
      if (sz0.x === longest) {
        chiselGroup.rotation.z = -Math.PI / 2; // X → Y
        widthA = sz0.y; widthB = sz0.z;
      } else if (sz0.z === longest) {
        chiselGroup.rotation.x =  Math.PI / 2; // Z → Y
        widthA = sz0.x; widthB = sz0.y;
      } else {
        widthA = sz0.x; widthB = sz0.z;
      }

      // 3. Scale so the cross-axis (width) fills ~65% of the visible canvas.
      //    The vertical axis becomes much taller than the canvas — that's
      //    the point: scrolling slides the chisel past the window.
      const targetWidth = VISIBLE_H * 0.55; // a bit narrower than visible
      const scale       = targetWidth / Math.max(widthA, widthB);
      chiselGroup.scale.setScalar(scale);
      chiselHeight = longest * scale;

      // 4. Slight depth: rotate the inner model around its long axis so
      //    we don't see a perfectly flat silhouette.
      m.rotation.y = 0.35;

      // 5. Material — same dark steel as before.
      m.traverse(o => {
        if (o.isMesh && o.material) {
          o.material.color           = new THREE.Color(0x2a2a2e);
          o.material.metalness       = 0.92;
          o.material.roughness       = 0.28;
          o.material.envMapIntensity = 1.3;
          o.material.needsUpdate     = true;
        }
      });

      chiselGroup.add(m);
      modelLoaded = true;
    },
    undefined,
    err => console.error('[scene] /kirici-uc.glb load failed', err)
  );

  // ─── Scroll → vertical slide ──────────────────────────────────────────
  // scroll01 = 0  → top of chisel sits at top of badge
  // scroll01 = 1  → bottom (tip) sits at bottom of badge
  function scroll01() {
    const docH = document.documentElement.scrollHeight - innerHeight;
    if (docH <= 0) return 0;
    return Math.max(0, Math.min(1, scrollY / docH));
  }

  let curY = 0;
  const EASE = reduced ? 1.0 : 0.10;

  function tick() {
    if (modelLoaded) {
      const slideRange = Math.max(0, chiselHeight - VISIBLE_H);
      // (scroll01 - 0.5) maps 0→-0.5, 1→+0.5
      const targetY = (scroll01() - 0.5) * slideRange;
      curY += (targetY - curY) * EASE;
      chiselGroup.position.y = curY;
    }
    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
