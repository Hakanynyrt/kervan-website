// Kervan Heat — Minimal scene
// Just the chisel GLB, right side, slow idle rotation, nothing else.

(async function() {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 900px)').matches;

  // ─── Root container ─────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'scene-root';
  root.style.cssText = `
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background: #0A0B0F;
  `;
  document.body.insertBefore(root, document.body.firstChild);

  // ─── Three basics ───────────────────────────────────────────────
  const scene = new THREE.Scene();

  const cam = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 200);
  cam.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile, alpha: true, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  root.appendChild(renderer.domElement);

  // ─── Subtle ember glow in the background (barely visible) ──────
  const glowGeo = new THREE.PlaneGeometry(30, 30);
  const glowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c);
        float glow = smoothstep(0.5, 0.0, d) * 0.18;
        float flicker = 0.94 + 0.06 * sin(uTime * 0.7);
        vec3 color = vec3(0.85, 0.29, 0.10) * glow * flicker;
        gl_FragColor = vec4(color, glow * flicker);
      }
    `
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(2.4, -0.5, -8);
  scene.add(glow);

  // ─── Lighting ──────────────────────────────────────────────────
  scene.add(new THREE.HemisphereLight(0x8a94a8, 0x0a0a0f, 0.35));

  const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.4);
  keyLight.position.set(5, 6, 4);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xd94a1a, 1.6);  // hot-iron accent
  rimLight.position.set(-6, -2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x4a6aff, 0.6, 25);
  fillLight.position.set(-4, 3, 6);
  scene.add(fillLight);

  // ─── Chisel ────────────────────────────────────────────────────
  const pivot = new THREE.Group();
  // Start centered so it's guaranteed visible; layout() repositions after load.
  pivot.position.set(0, 0, 0);
  scene.add(pivot);

  let chisel = null;
  const loader = new GLTFLoader();
  loader.load(
    '/kirici-uc.glb',
    (gltf) => {
      const model = gltf.scene;

      // Normalize scale to target height
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3(); box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetHeight = 4.0;
      model.scale.setScalar(targetHeight / maxDim);

      // Center on origin
      box.setFromObject(model);
      const center = new THREE.Vector3(); box.getCenter(center);
      model.position.sub(center);

      // Re-skin with a clean industrial steel material
      model.traverse((o) => {
        if (o.isMesh) {
          o.material = new THREE.MeshStandardMaterial({
            color: 0x5c636e,
            metalness: 0.88,
            roughness: 0.34,
          });
          o.castShadow = false;
          o.receiveShadow = false;
        }
      });

      chisel = model;
      pivot.add(chisel);
      console.log('[scene] Chisel loaded, size:', size, 'scale:', targetHeight / maxDim);
      layout();
    },
    (xhr) => {
      console.log('[scene] Loading GLB...', Math.round((xhr.loaded / xhr.total) * 100) + '%');
    },
    (err) => {
      console.error('[scene] GLB load failed', err);
    }
  );

  // ─── Layout: position chisel based on viewport ─────────────────
  function layout() {
    const w = innerWidth, h = innerHeight;
    const aspect = w / h;
    cam.aspect = aspect;
    cam.updateProjectionMatrix();
    renderer.setSize(w, h);

    if (!chisel) return;

    if (isMobileNow()) {
      // Mobile: centered, below the hero copy
      pivot.position.set(0, -1.0, 0);
      pivot.scale.setScalar(0.75);
    } else {
      // Desktop: right side of viewport, around 25% right of centre
      const fovY = cam.fov * Math.PI / 180;
      const viewH = 2 * cam.position.z * Math.tan(fovY / 2);
      const viewW = viewH * aspect;
      // Use a smaller x-offset on narrow desktops so it doesn't clip
      const xOffset = Math.min(viewW * 0.20, 3.2);
      pivot.position.set(xOffset, -0.2, 0);
      pivot.scale.setScalar(1.0);
    }
  }

  function isMobileNow() { return innerWidth <= 900; }

  // ─── Scroll drives a subtle parallax / fade ────────────────────
  let scrollY = 0;
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  // ─── Resize ────────────────────────────────────────────────────
  addEventListener('resize', layout);

  // ─── Animation loop ────────────────────────────────────────────
  const clock = new THREE.Clock();

  function tick() {
    const t = clock.getElapsedTime();
    glowMat.uniforms.uTime.value = t;

    if (chisel) {
      // Idle rotation — slow and dignified
      if (!reduce) {
        chisel.rotation.y = t * 0.18;
        chisel.rotation.x = Math.sin(t * 0.4) * 0.06;
      } else {
        chisel.rotation.y = 0.3;
      }
    }

    // Parallax: scene drifts slightly on scroll, then fades out past the hero
    const vh = innerHeight;
    const fadeStart = vh * 0.6;
    const fadeEnd = vh * 1.6;
    const fade = scrollY < fadeStart ? 1 :
                 scrollY > fadeEnd   ? 0 :
                 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart);
    pivot.rotation.z = -scrollY * 0.00008;
    root.style.opacity = fade.toFixed(3);

    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }

  layout();
  tick();
})();
