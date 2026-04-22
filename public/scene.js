// Kervan Heat — scene.js
// Scroll-choreographed hot-metal chisel. No jackhammer. No debris.
// Breathing ember cycle at the core; scene CHARACTER changes with scroll section.

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

  // ═══════════════════════════════════════════════════════════════════
  // EMBER GLOW — breathing halo behind the chisel
  // Intensity driven by (breath cycle + services-section scrollFactor)
  // ═══════════════════════════════════════════════════════════════════
  const glowGeo = new THREE.PlaneGeometry(32, 32);
  const glowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uTime:   { value: 0 },
      uEmber:  { value: 0 },     // 0..1 — overall ember intensity (breath × services)
      uHeat:   { value: 0 },     // 0..1 — services section boost (forge moment)
    },
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
      uniform float uEmber;
      uniform float uHeat;

      // simple 2d noise for heat shimmer
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1,0));
        float c = hash(i + vec2(0,1));
        float d = hash(i + vec2(1,1));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
      }

      void main() {
        vec2 c = vUv - 0.5;
        float d = length(c);

        // Core ember — warm red/orange, soft radial
        float core = smoothstep(0.45, 0.0, d);
        vec3 ember = vec3(0.85, 0.28, 0.08);

        // Heat shimmer (strong during forge moment)
        float shim = noise(vUv * 8.0 + uTime * 0.3) * 0.12 * uHeat;

        float intensity = core * (uEmber + shim);
        float alpha = core * uEmber * (1.0 + shim);

        gl_FragColor = vec4(ember * intensity * 1.8, alpha);
      }
    `
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, -0.5, -8);
  scene.add(glow);

  // ═══════════════════════════════════════════════════════════════════
  // LIGHTING
  // ═══════════════════════════════════════════════════════════════════
  scene.add(new THREE.HemisphereLight(0xb8c2d4, 0x14151a, 0.55));

  const keyLight = new THREE.DirectionalLight(0xfff3dc, 3.0);
  keyLight.position.set(5, 6, 4);
  scene.add(keyLight);

  // Rim light warms up during "forge" section
  const rimLight = new THREE.DirectionalLight(0xff6a28, 2.4);
  rimLight.position.set(-6, -2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x6a8aff, 1.0, 25);
  fillLight.position.set(-4, 3, 6);
  scene.add(fillLight);

  const topRim = new THREE.DirectionalLight(0xffffff, 1.1);
  topRim.position.set(2, 8, 2);
  scene.add(topRim);

  // Forge light — turns on strongly in services section
  const forgeLight = new THREE.PointLight(0xff4a12, 0, 16);
  forgeLight.position.set(0, -2, 3);
  scene.add(forgeLight);

  // ═══════════════════════════════════════════════════════════════════
  // TECHNICAL GRID (appears during "brands" section)
  // ═══════════════════════════════════════════════════════════════════
  const gridMat = new THREE.LineBasicMaterial({
    color: 0x4a5568, transparent: true, opacity: 0, depthWrite: false
  });
  const gridGroup = new THREE.Group();
  const GRID_RANGE = 12;
  const GRID_STEP = 1;
  const gridPts = [];
  for (let i = -GRID_RANGE; i <= GRID_RANGE; i += GRID_STEP) {
    gridPts.push(new THREE.Vector3(i, -GRID_RANGE, -6), new THREE.Vector3(i, GRID_RANGE, -6));
    gridPts.push(new THREE.Vector3(-GRID_RANGE, i, -6), new THREE.Vector3(GRID_RANGE, i, -6));
  }
  const gridGeo = new THREE.BufferGeometry().setFromPoints(gridPts);
  const gridLines = new THREE.LineSegments(gridGeo, gridMat);
  gridGroup.add(gridLines);
  scene.add(gridGroup);

  // ═══════════════════════════════════════════════════════════════════
  // ORBIT RINGS (appear during "products" section — diversity metaphor)
  // 3 wireframe tori circling the chisel at different radii/speeds
  // ═══════════════════════════════════════════════════════════════════
  const orbitGroup = new THREE.Group();
  const orbits = [];
  for (let i = 0; i < 3; i++) {
    const radius = 2.3 + i * 0.55;
    const geo = new THREE.TorusGeometry(radius, 0.012, 8, 120);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x7a8598, transparent: true, opacity: 0, depthWrite: false
    });
    const torus = new THREE.Mesh(geo, mat);
    torus.rotation.x = Math.PI / 2 + (i - 1) * 0.22;
    torus.rotation.z = i * 0.31;
    orbitGroup.add(torus);
    orbits.push({ mesh: torus, mat, speedX: 0.04 + i * 0.02, speedY: 0.03 - i * 0.008 });
  }
  scene.add(orbitGroup);

  // ═══════════════════════════════════════════════════════════════════
  // CNC SPARK DRIFT (appears during "gallery" section — small, constant, falling)
  // ═══════════════════════════════════════════════════════════════════
  const CNC_COUNT = 140;
  const cncGeo = new THREE.BufferGeometry();
  const cncPos = new Float32Array(CNC_COUNT * 3);
  const cncVel = new Float32Array(CNC_COUNT * 3);
  const cncLife = new Float32Array(CNC_COUNT);
  const cncSeed = new Float32Array(CNC_COUNT);
  for (let i = 0; i < CNC_COUNT; i++) {
    cncSeed[i] = Math.random();
    resetCncParticle(i, true);
  }
  function resetCncParticle(i, randomY) {
    cncPos[i * 3 + 0] = (Math.random() - 0.5) * 10;
    cncPos[i * 3 + 1] = randomY ? (Math.random() - 0.5) * 8 : 5 + Math.random() * 2;
    cncPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    cncVel[i * 3 + 0] = (Math.random() - 0.5) * 0.08;
    cncVel[i * 3 + 1] = -0.35 - Math.random() * 0.3;
    cncVel[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    cncLife[i] = 1.5 + Math.random() * 2;
  }
  cncGeo.setAttribute('position', new THREE.BufferAttribute(cncPos, 3));
  const cncMat = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xffb080,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const cncPoints = new THREE.Points(cncGeo, cncMat);
  scene.add(cncPoints);

  // ═══════════════════════════════════════════════════════════════════
  // CHISEL MODEL
  // ═══════════════════════════════════════════════════════════════════
  const outerPivot = new THREE.Group(); // scroll-position + drift
  const driftPivot = new THREE.Group(); // EVA multi-axis drift
  const spinPivot  = new THREE.Group(); // very slow self-axis rotation

  outerPivot.add(driftPivot);
  driftPivot.add(spinPivot);
  scene.add(outerPivot);

  let chisel = null;

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  loader.load(
    'https://kervanheat.com/kirici-uc.glb',
    (gltf) => {
      chisel = gltf.scene;

      // Normalize: center + scale so the chisel is ~4 units tall, pointing down
      const box = new THREE.Box3().setFromObject(chisel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      chisel.position.sub(center);

      const targetH = 4.0;
      // Use the model's longest dimension as its "length"
      const longest = Math.max(size.x, size.y, size.z);
      const s = targetH / longest;
      chisel.scale.setScalar(s);

      // Orient upright: model's long axis may come toward the camera (Z).
      // Rotate so the long axis is vertical (Y).
      if (size.z > size.y && size.z > size.x) {
        chisel.rotation.x = -Math.PI / 2;
      } else if (size.x > size.y) {
        chisel.rotation.z = Math.PI / 2;
      }

      // Enhance material response to lighting
      chisel.traverse((o) => {
        if (o.isMesh && o.material) {
          const m = o.material;
          if ('metalness' in m) m.metalness = 0.85;
          if ('roughness' in m) m.roughness = 0.42;
          if ('envMapIntensity' in m) m.envMapIntensity = 1.4;
          // Store original emissive so we can animate it
          if (m.emissive) {
            m.userData._origEmissive = m.emissive.clone();
          }
        }
      });

      spinPivot.add(chisel);
      layout();
    },
    undefined,
    (err) => {
      console.warn('[scene] chisel load failed, using fallback primitive', err);
      // Fallback: simple stylized chisel
      const fg = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 3.0, 24),
        new THREE.MeshStandardMaterial({ color: 0x555a62, metalness: 0.9, roughness: 0.38 })
      );
      body.position.y = 0.5;
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 1.0, 24),
        new THREE.MeshStandardMaterial({ color: 0x444951, metalness: 0.9, roughness: 0.42 })
      );
      tip.position.y = -1.5;
      fg.add(body); fg.add(tip);
      chisel = fg;
      spinPivot.add(chisel);
      layout();
    }
  );

  // ═══════════════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════════════
  const idleBase = new THREE.Vector3(0, 0, 0);

  function layout() {
    const w = innerWidth, h = innerHeight;
    const aspect = w / h;
    cam.aspect = aspect;
    cam.updateProjectionMatrix();
    renderer.setSize(w, h);

    if (!chisel) return;

    if (innerWidth <= 900) {
      // Mobile: centered, slightly below middle
      idleBase.set(0, -1.4, 0);
      outerPivot.scale.setScalar(0.85);
    } else {
      // Desktop: right side, centered vertically
      const fovY = cam.fov * Math.PI / 180;
      const viewH = 2 * cam.position.z * Math.tan(fovY / 2);
      const viewW = viewH * aspect;
      const xOffset = Math.min(viewW * 0.22, 3.4);
      idleBase.set(xOffset, -0.6, 0);
      outerPivot.scale.setScalar(1.15);
    }
    outerPivot.position.copy(idleBase);
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCROLL SECTION FACTORS
  // Reads section positions once layout is stable; computes a 0..1 factor
  // per named section based on viewport center overlap.
  // ═══════════════════════════════════════════════════════════════════
  const sectionIds = ['hero', 'products', 'services', 'gallery', 'brands', 'contact'];
  // The hero doesn't have an id — use the first <section class="hero"> instead.
  const sections = {};
  function collectSections() {
    sections.hero = document.querySelector('section.hero');
    sectionIds.forEach(id => {
      if (id !== 'hero') sections[id] = document.getElementById(id);
    });
  }
  collectSections();

  const sectionFactor = {
    hero: 1, products: 0, services: 0, gallery: 0, brands: 0, contact: 0
  };
  // Smoothed version (lerped toward raw each frame)
  const sectionLerped = { ...sectionFactor };

  function computeSectionFactors() {
    const vpMid = window.scrollY + innerHeight / 2;
    sectionIds.forEach(id => {
      const el = sections[id];
      if (!el) { sectionFactor[id] = 0; return; }
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const bot = top + rect.height;
      // Triangular falloff: 1 when viewport midpoint is inside the section,
      // decays linearly for one viewport beyond either edge.
      if (vpMid >= top && vpMid <= bot) {
        sectionFactor[id] = 1;
      } else if (vpMid < top) {
        const d = (top - vpMid) / innerHeight;
        sectionFactor[id] = Math.max(0, 1 - d);
      } else {
        const d = (vpMid - bot) / innerHeight;
        sectionFactor[id] = Math.max(0, 1 - d);
      }
    });
  }

  addEventListener('resize', () => { layout(); collectSections(); computeSectionFactors(); });
  addEventListener('scroll', computeSectionFactors, { passive: true });
  // Initial
  requestAnimationFrame(() => { collectSections(); computeSectionFactors(); });

  // ═══════════════════════════════════════════════════════════════════
  // ANIMATION LOOP
  // ═══════════════════════════════════════════════════════════════════
  const clock = new THREE.Clock();

  // Breath cycle: 14s — ember waxes and wanes
  const BREATH_PERIOD = 14.0;

  function tick() {
    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    // Smooth section factors toward targets
    const LERP = 1 - Math.pow(0.001, dt); // ~ 0.05 at 60fps
    sectionIds.forEach(id => {
      sectionLerped[id] += (sectionFactor[id] - sectionLerped[id]) * Math.min(1, LERP * 3.2);
    });

    // ── Breath cycle (ember base level) ─────────────────────────
    // Slow sin from 0.08 up to 0.55 over the breath period
    const breath = reduce ? 0.18 : 0.30 + 0.25 * Math.sin(t * (Math.PI * 2 / BREATH_PERIOD));

    // ── Section-driven intensities ──────────────────────────────
    const fHero     = sectionLerped.hero;
    const fProducts = sectionLerped.products;
    const fServices = sectionLerped.services;
    const fGallery  = sectionLerped.gallery;
    const fBrands   = sectionLerped.brands;
    const fContact  = sectionLerped.contact;

    // Ember: breath × (base + services boost + contact calm glow)
    const emberTarget = breath * (0.55 + fServices * 1.4 + fContact * 0.35 + fHero * 0.2);
    glowMat.uniforms.uTime.value = t;
    glowMat.uniforms.uEmber.value = Math.min(1.6, emberTarget);
    glowMat.uniforms.uHeat.value = fServices;

    // Forge light: only in services
    forgeLight.intensity = fServices * (1.8 + breath * 0.8);
    rimLight.intensity = 2.0 + fServices * 2.5 + breath * 0.6;

    // ── Orbit rings: fade in during products section ───────────
    orbits.forEach((o, i) => {
      o.mat.opacity = fProducts * 0.42;
      o.mesh.rotation.z += o.speedX * dt;
      o.mesh.rotation.x += o.speedY * dt;
    });
    // Rings also tilt slightly with scroll
    orbitGroup.rotation.y = t * 0.04;

    // ── CNC sparks: fade in during gallery section ─────────────
    cncMat.opacity = fGallery * 0.75;
    if (fGallery > 0.03) {
      for (let i = 0; i < CNC_COUNT; i++) {
        cncPos[i * 3 + 0] += cncVel[i * 3 + 0] * dt;
        cncPos[i * 3 + 1] += cncVel[i * 3 + 1] * dt;
        cncPos[i * 3 + 2] += cncVel[i * 3 + 2] * dt;
        // tiny gravity-drift
        cncVel[i * 3 + 1] -= 0.08 * dt;
        cncLife[i] -= dt;
        if (cncLife[i] < 0 || cncPos[i * 3 + 1] < -6) resetCncParticle(i, false);
      }
      cncGeo.attributes.position.needsUpdate = true;
    }

    // ── Technical grid: fade in during brands section ──────────
    gridMat.opacity = fBrands * 0.22;
    gridGroup.rotation.z = Math.sin(t * 0.05) * 0.02;

    // ── Chisel emissive: glow hotter during services ───────────
    if (chisel) {
      const emissiveLevel = breath * (0.2 + fServices * 0.9);
      chisel.traverse((o) => {
        if (o.isMesh && o.material && o.material.emissive) {
          const m = o.material;
          const orig = m.userData._origEmissive || new THREE.Color(0, 0, 0);
          m.emissive.copy(orig);
          m.emissive.r += 0.55 * emissiveLevel;
          m.emissive.g += 0.18 * emissiveLevel;
          m.emissive.b += 0.04 * emissiveLevel;
        }
      });
    }

    // ── EVA drift (position) ────────────────────────────────────
    if (!reduce) {
      const floatX = Math.sin(t * 0.25) * 0.22 + Math.sin(t * 0.11) * 0.14;
      const floatY = Math.cos(t * 0.19) * 0.18 + Math.sin(t * 0.33) * 0.09;
      outerPivot.position.x = idleBase.x + floatX;
      outerPivot.position.y = idleBase.y + floatY;
    }

    // ── Drift rotation (weightless tumble, subtle) ─────────────
    if (!reduce) {
      driftPivot.rotation.y = Math.sin(t * 0.07) * 0.35 + Math.sin(t * 0.13) * 0.12;
      driftPivot.rotation.x = Math.sin(t * 0.09) * 0.14 + Math.cos(t * 0.15) * 0.06;
      driftPivot.rotation.z = Math.sin(t * 0.05) * 0.10;
    }

    // ── Very slow self-spin ─────────────────────────────────────
    if (!reduce && chisel) {
      spinPivot.rotation.y = t * 0.08;
    }

    // ── Scroll-driven scale & depth shift (subtle parallax) ────
    // Chisel pulls slightly closer during services, recedes during brands
    const scrollScale = 1 + fServices * 0.06 - fBrands * 0.05;
    outerPivot.scale.setScalar((innerWidth <= 900 ? 0.85 : 1.15) * scrollScale);

    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
