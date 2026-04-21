// Kervan Heat — Hero 3D scene
// Vertical chisel, always visible (sticky), slow spin + self-axis rotation, periodic impact.

(async function() {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');

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
  renderer.toneMappingExposure = 1.15;
  root.appendChild(renderer.domElement);

  // ─── Ember glow behind the chisel (hot-forge atmosphere) ───────
  const glowGeo = new THREE.PlaneGeometry(30, 30);
  const glowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uImpact: { value: 0 } },
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
      uniform float uImpact;
      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c);
        float glow = smoothstep(0.5, 0.0, d) * (0.18 + uImpact * 0.35);
        float flicker = 0.94 + 0.06 * sin(uTime * 0.7);
        vec3 color = vec3(0.85, 0.29, 0.10) * glow * flicker;
        gl_FragColor = vec4(color, glow * flicker);
      }
    `
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, -0.5, -8);
  scene.add(glow);

  // ─── Lighting ──────────────────────────────────────────────────
  scene.add(new THREE.HemisphereLight(0xb8c2d4, 0x14151a, 0.55));

  const keyLight = new THREE.DirectionalLight(0xfff3dc, 3.4);
  keyLight.position.set(5, 6, 4);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xff6a28, 2.6);
  rimLight.position.set(-6, -2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x6a8aff, 1.2, 25);
  fillLight.position.set(-4, 3, 6);
  scene.add(fillLight);

  const topRim = new THREE.DirectionalLight(0xffffff, 1.2);
  topRim.position.set(2, 8, 2);
  scene.add(topRim);

  // Impact flash light — briefly bright orange on each strike
  const flashLight = new THREE.PointLight(0xff5a1a, 0, 14);
  flashLight.position.set(0, -3, 2);
  scene.add(flashLight);

  // ─── Spark particles (created at impact) ───────────────────────
  const SPARK_COUNT = 60;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(SPARK_COUNT * 3);
  const sparkVel = new Float32Array(SPARK_COUNT * 3);
  const sparkLife = new Float32Array(SPARK_COUNT);
  for (let i = 0; i < SPARK_COUNT; i++) sparkLife[i] = 0;
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    color: 0xffb060, size: 0.08, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  scene.add(sparks);

  function emitSparks(originX, originY) {
    for (let i = 0; i < SPARK_COUNT; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4;
      const up = Math.random() * 0.3; // sparks mostly fly sideways & down
      sparkPos[i * 3 + 0] = originX;
      sparkPos[i * 3 + 1] = originY;
      sparkPos[i * 3 + 2] = 0;
      sparkVel[i * 3 + 0] = Math.cos(ang) * spd;
      sparkVel[i * 3 + 1] = Math.sin(ang) * spd * 0.5 - up;
      sparkVel[i * 3 + 2] = (Math.random() - 0.5) * 2;
      sparkLife[i] = 1.0;
    }
    sparkGeo.attributes.position.needsUpdate = true;
  }

  // ─── Chisel ────────────────────────────────────────────────────
  // Outer pivot = orbital position on screen
  // Inner pivot = self-axis spin + impact animation
  const outerPivot = new THREE.Group();
  const spinPivot = new THREE.Group();  // rotates on chisel's long axis
  const impactPivot = new THREE.Group(); // translates during impact

  outerPivot.position.set(0, 0, 0);
  scene.add(outerPivot);
  outerPivot.add(impactPivot);
  impactPivot.add(spinPivot);

  let chisel = null;
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
  loader.setDRACOLoader(dracoLoader);
  loader.load(
    '/kirici-uc.glb',
    (gltf) => {
      const model = gltf.scene;

      // Normalize scale
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3(); box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetHeight = 4.2;
      model.scale.setScalar(targetHeight / maxDim);

      // Center on origin
      box.setFromObject(model);
      const center = new THREE.Vector3(); box.getCenter(center);
      model.position.sub(center);

      // Rotate to vertical: tip down, shank up
      model.rotation.z = -Math.PI / 2;

      // Industrial steel material
      model.traverse((o) => {
        if (o.isMesh) {
          o.material = new THREE.MeshStandardMaterial({
            color: 0x8a929e,
            metalness: 0.78,
            roughness: 0.28,
            envMapIntensity: 1.2,
          });
          o.castShadow = false;
          o.receiveShadow = false;
        }
      });

      chisel = model;
      spinPivot.add(chisel);
      console.log('[scene] Chisel loaded');
      layout();
    },
    (xhr) => {
      if (xhr.total) console.log('[scene] Loading GLB...', Math.round((xhr.loaded / xhr.total) * 100) + '%');
    },
    (err) => {
      console.error('[scene] GLB load failed', err);
    }
  );

  // ─── Layout ────────────────────────────────────────────────────
  function layout() {
    const w = innerWidth, h = innerHeight;
    const aspect = w / h;
    cam.aspect = aspect;
    cam.updateProjectionMatrix();
    renderer.setSize(w, h);

    if (!chisel) return;

    if (innerWidth <= 900) {
      // Mobile: centered, lower third
      outerPivot.position.set(0, -1.2, 0);
      outerPivot.scale.setScalar(0.70);
    } else {
      // Desktop: right side, vertically centered in viewport
      const fovY = cam.fov * Math.PI / 180;
      const viewH = 2 * cam.position.z * Math.tan(fovY / 2);
      const viewW = viewH * aspect;
      const xOffset = Math.min(viewW * 0.22, 3.4);
      outerPivot.position.set(xOffset, -0.6, 0);
      outerPivot.scale.setScalar(1.0);
    }
  }

  // ─── Scroll (sticky — no fade-out) ─────────────────────────────
  let scrollY = 0;
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  addEventListener('resize', layout);

  // ─── Animation loop ────────────────────────────────────────────
  const clock = new THREE.Clock();

  // Impact cycle: 4s total. 3.6s idle, 0.4s strike.
  const IMPACT_CYCLE = 4.0;
  const STRIKE_DUR = 0.4;
  let nextImpactFlash = 0;

  function tick() {
    const t = clock.getElapsedTime();
    const dt = clock.getDelta ? 0 : 0; // not used; we use absolute time
    glowMat.uniforms.uTime.value = t;

    // ── Impact cycle ─────────────────────────────────────────────
    // Phase within cycle: 0..1
    const cyclePos = (t % IMPACT_CYCLE) / IMPACT_CYCLE;
    const strikeStart = (IMPACT_CYCLE - STRIKE_DUR) / IMPACT_CYCLE; // ~0.9
    let impactY = 0;
    let impactIntensity = 0;
    let shake = 0;

    if (!reduce && cyclePos > strikeStart) {
      // Normalized strike progress 0..1
      const sp = (cyclePos - strikeStart) / (1 - strikeStart);
      // Anticipation wind-up (0..0.4): pull up slightly
      // Strike (0.4..0.55): slam down fast
      // Recoil (0.55..1.0): bounce back and settle
      if (sp < 0.4) {
        const k = sp / 0.4;
        impactY = easeOut(k) * 0.35; // wind-up upward
      } else if (sp < 0.55) {
        const k = (sp - 0.4) / 0.15;
        impactY = 0.35 - easeIn(k) * 1.1; // slam down to -0.75
      } else {
        const k = (sp - 0.55) / 0.45;
        // Damped bounce back to 0
        impactY = -0.75 * Math.exp(-k * 6) * Math.cos(k * 14);
      }

      // Intensity peaks right at strike moment
      if (sp >= 0.5 && sp < 0.75) {
        const k = (sp - 0.5) / 0.25;
        impactIntensity = 1 - k;
      }

      // Camera shake after strike
      if (sp >= 0.55 && sp < 0.8) {
        const k = (sp - 0.55) / 0.25;
        shake = (1 - k) * 0.08;
      }

      // Emit sparks exactly once at strike moment
      if (sp >= 0.52 && nextImpactFlash < Math.floor(t / IMPACT_CYCLE) + 1) {
        nextImpactFlash = Math.floor(t / IMPACT_CYCLE) + 1;
        // Origin in world space: bottom of chisel relative to outerPivot
        const tipWorldY = outerPivot.position.y - 2.0 * outerPivot.scale.y;
        emitSparks(outerPivot.position.x, tipWorldY);
      }
    }

    impactPivot.position.y = impactY;
    flashLight.intensity = impactIntensity * 3.5;
    glowMat.uniforms.uImpact.value = impactIntensity;

    // Camera shake
    cam.position.x = (Math.random() - 0.5) * shake;
    cam.position.y = (Math.random() - 0.5) * shake;

    // ── Rotation: outer orbit + self-axis spin ──────────────────
    if (chisel) {
      if (!reduce) {
        // Slow orbit around global Y (swings the chisel around)
        outerPivot.rotation.y = t * 0.18;
        outerPivot.rotation.x = Math.sin(t * 0.3) * 0.04;

        // Self-axis spin: chisel rotates on its own long axis.
        // Because model is rotated -90° on Z (vertical), its local long axis is now world Y.
        // But the model itself is a child of spinPivot — we spin spinPivot on its local Y,
        // which — after the model's Z rotation — corresponds to rotating around the chisel's shaft axis.
        // To spin around the chisel's vertical axis we rotate spinPivot on world Y.
        // Use a slightly different rate so the two rotations don't sync.
        spinPivot.rotation.y = t * 0.9;
      } else {
        outerPivot.rotation.y = 0.3;
      }
    }

    // ── Spark update ─────────────────────────────────────────────
    for (let i = 0; i < SPARK_COUNT; i++) {
      if (sparkLife[i] > 0) {
        sparkPos[i * 3 + 0] += sparkVel[i * 3 + 0] * 0.016;
        sparkPos[i * 3 + 1] += sparkVel[i * 3 + 1] * 0.016;
        sparkPos[i * 3 + 2] += sparkVel[i * 3 + 2] * 0.016;
        sparkVel[i * 3 + 1] -= 0.15; // gravity
        sparkVel[i * 3 + 0] *= 0.98;
        sparkVel[i * 3 + 2] *= 0.98;
        sparkLife[i] -= 0.016 * 1.2;
      } else {
        sparkPos[i * 3 + 1] = -1000; // hide
      }
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkMat.opacity = 0.9;

    // ── Subtle scroll parallax (no fade — sticky) ───────────────
    const parallax = Math.min(scrollY * 0.0008, 0.6);
    outerPivot.rotation.z = -parallax;
    // Always visible
    root.style.opacity = 1;

    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }

  function easeIn(k) { return k * k; }
  function easeOut(k) { return 1 - (1 - k) * (1 - k); }

  layout();
  tick();
})();
