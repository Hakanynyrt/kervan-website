// Kervan Heat — scene.js
// Minimal hot-metal chisel. Breath cycle + slow scroll choreography + EVA drift.
// No jackhammer, no debris, no decorative rings/grids. Just the object.

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
  // The emotional core. Waxes and wanes on a 14s cycle.
  // Stronger during "services" (forge) section.
  // ═══════════════════════════════════════════════════════════════════
  const glowGeo = new THREE.PlaneGeometry(36, 36);
  const glowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uTime:  { value: 0 },
      uEmber: { value: 0 },   // 0..1.5 — breath × section modulation
      uHeat:  { value: 0 },   // 0..1   — shimmer intensity (services boost)
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

        // Soft radial core
        float core = smoothstep(0.48, 0.0, d);

        // Heat shimmer — animated noise, only strong during forge
        float shim = noise(vUv * 7.0 + uTime * 0.25) * 0.14 * uHeat;

        // Color: deep red → orange gradient
        vec3 inner  = vec3(1.00, 0.42, 0.14);
        vec3 outer  = vec3(0.55, 0.12, 0.04);
        vec3 ember  = mix(outer, inner, core);

        float amt = core * (uEmber + shim);
        gl_FragColor = vec4(ember * amt * 1.6, amt);
      }
    `
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, -0.5, -8);
  scene.add(glow);

  // ═══════════════════════════════════════════════════════════════════
  // VIGNETTE — subtle dark corners for premium feel
  // ═══════════════════════════════════════════════════════════════════
  const vigGeo = new THREE.PlaneGeometry(2, 2);
  const vigMat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: {},
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        vec2 c = vUv - 0.5;
        float v = smoothstep(0.3, 0.85, length(c));
        gl_FragColor = vec4(0.0, 0.0, 0.0, v * 0.55);
      }
    `
  });
  const vignette = new THREE.Mesh(vigGeo, vigMat);
  vignette.frustumCulled = false;
  vignette.renderOrder = 999;
  // Use a separate ortho scene so vignette is always full-screen
  const vigScene = new THREE.Scene();
  vigScene.add(vignette);
  const vigCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ═══════════════════════════════════════════════════════════════════
  // LIGHTING
  // ═══════════════════════════════════════════════════════════════════
  scene.add(new THREE.HemisphereLight(0xb8c2d4, 0x14151a, 0.5));

  const keyLight = new THREE.DirectionalLight(0xfff3dc, 2.8);
  keyLight.position.set(5, 6, 4);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xff6a28, 2.2);
  rimLight.position.set(-6, -2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x6a8aff, 0.9, 25);
  fillLight.position.set(-4, 3, 6);
  scene.add(fillLight);

  const topRim = new THREE.DirectionalLight(0xffffff, 1.0);
  topRim.position.set(2, 8, 2);
  scene.add(topRim);

  // ═══════════════════════════════════════════════════════════════════
  // CHISEL MODEL
  // ═══════════════════════════════════════════════════════════════════
  const outerPivot = new THREE.Group(); // scroll-driven position + rotation
  const driftPivot = new THREE.Group(); // EVA weightless drift
  const spinPivot  = new THREE.Group(); // very slow self-spin

  outerPivot.add(driftPivot);
  driftPivot.add(spinPivot);
  scene.add(outerPivot);

  let chisel = null;

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  const TARGET_LENGTH = 24.0; // world-units along the chisel's long axis

  loader.load(
    'https://kervanheat.com/kirici-uc.glb',
    (gltf) => {
      chisel = gltf.scene;

      // Center + scale to normalize
      const box = new THREE.Box3().setFromObject(chisel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      chisel.position.sub(center);

      // Use longest dimension as the chisel's "length"
      const longest = Math.max(size.x, size.y, size.z);
      const s = TARGET_LENGTH / longest;
      chisel.scale.setScalar(s);

      // Orient: long axis vertical (Y), tip pointing DOWN
      if (size.z >= size.y && size.z >= size.x) {
        chisel.rotation.x = Math.PI / 2;
      } else if (size.x > size.y) {
        chisel.rotation.z = -Math.PI / 2;
      } else {
        chisel.rotation.z = Math.PI; // flip to tip-down
      }

      // Enhance material response
      chisel.traverse((o) => {
        if (o.isMesh && o.material) {
          const m = o.material;
          if ('metalness' in m) m.metalness = 0.85;
          if ('roughness' in m) m.roughness = 0.40;
          if ('envMapIntensity' in m) m.envMapIntensity = 1.4;
          if (m.emissive) m.userData._origEmissive = m.emissive.clone();
        }
      });

      spinPivot.add(chisel);
      layout();
    },
    undefined,
    (err) => {
      console.warn('[scene] chisel load failed, using primitive fallback', err);
      const fg = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 16, 28),
        new THREE.MeshStandardMaterial({ color: 0x555a62, metalness: 0.9, roughness: 0.38 })
      );
      body.position.y = 2;
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.9, 5, 28),
        new THREE.MeshStandardMaterial({ color: 0x444951, metalness: 0.9, roughness: 0.42 })
      );
      tip.position.y = -8.5;
      fg.add(body); fg.add(tip);
      chisel = fg;
      spinPivot.add(chisel);
      layout();
    }
  );

  // ═══════════════════════════════════════════════════════════════════
  // LAYOUT — idle base position (scroll offsets layered on top)
  // ═══════════════════════════════════════════════════════════════════
  const idleBase = new THREE.Vector3(0, 0, 0);

  function layout() {
    const w = innerWidth, h = innerHeight;
    const aspect = w / h;
    cam.aspect = aspect;
    cam.updateProjectionMatrix();
    renderer.setSize(w, h);

    if (innerWidth <= 900) {
      // Mobile: centered, low
      idleBase.set(0, -3.0, 0);
      outerPivot.scale.setScalar(0.85);
    } else {
      // Desktop: LEFT side (text is on the right), low
      const fovY = cam.fov * Math.PI / 180;
      const viewH = 2 * cam.position.z * Math.tan(fovY / 2);
      const viewW = viewH * aspect;
      const xOffset = Math.min(viewW * 0.22, 3.4);
      idleBase.set(-xOffset, -2.0, 0);
      outerPivot.scale.setScalar(1.15);
    }
    outerPivot.position.copy(idleBase);
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCROLL PROGRESS (smoothed — very slow follow for cinematic feel)
  // ═══════════════════════════════════════════════════════════════════
  let rawProgress = 0;
  let smoothedProgress = 0;

  function updateRawProgress() {
    const docH = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    rawProgress = Math.min(1, Math.max(0, window.scrollY / docH));
  }
  addEventListener('scroll', updateRawProgress, { passive: true });
  addEventListener('resize', () => { layout(); updateRawProgress(); });
  requestAnimationFrame(updateRawProgress);

  // ═══════════════════════════════════════════════════════════════════
  // ANIMATION LOOP
  // ═══════════════════════════════════════════════════════════════════
  const clock = new THREE.Clock();
  const BREATH_PERIOD = 16.0; // seconds for full ember breath cycle

  // Helper: smoothstep 0..1
  function smooth(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }

  // Keyframe interpolation — maps progress (0..1) to a piecewise target
  // Returns target value at this progress point
  function keyframes(p, frames) {
    // frames: [[p, value], [p, value], ...] sorted by p
    if (p <= frames[0][0]) return frames[0][1];
    if (p >= frames[frames.length - 1][0]) return frames[frames.length - 1][1];
    for (let i = 0; i < frames.length - 1; i++) {
      const [p0, v0] = frames[i];
      const [p1, v1] = frames[i + 1];
      if (p >= p0 && p <= p1) {
        const k = smooth((p - p0) / (p1 - p0));
        return v0 + (v1 - v0) * k;
      }
    }
    return frames[frames.length - 1][1];
  }

  function tick() {
    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    // Very slow scroll smoothing (cinematic)
    smoothedProgress += (rawProgress - smoothedProgress) * Math.min(1, dt * 0.6);
    const p = smoothedProgress;

    // ── Breath cycle ────────────────────────────────────────────
    const breath = reduce ? 0.3 : 0.35 + 0.3 * Math.sin(t * (Math.PI * 2 / BREATH_PERIOD));

    // ── Scroll keyframes ────────────────────────────────────────
    // 0.0 hero, ~0.2 products, ~0.4 services, ~0.6 gallery, ~0.8 brands, 1.0 contact
    // X (desktop): starts at idleBase.x (left negative), sweeps right, centers at end
    const desktopX = keyframes(p, [
      [0.00, idleBase.x],       // hero: left
      [0.35, idleBase.x * 0.4], // partial right
      [0.55, 0.6],              // slight right (gallery)
      [0.80, 0.2],              // brands
      [1.00, 0.0],              // contact: center
    ]);
    const mobileX = 0; // stays centered on mobile

    // Y offset
    const yOffset = keyframes(p, [
      [0.00, 0.0],
      [0.40, 0.4],   // rise slightly in services (forge lift)
      [0.70, 0.2],
      [1.00, -0.3],  // settle low in contact
    ]);

    // Scale multiplier
    const scaleMul = keyframes(p, [
      [0.00, 1.00],
      [0.40, 1.18],  // zoom in at forge moment
      [0.70, 0.92],  // pull back during brands
      [1.00, 1.05],  // slight emphasis on contact
    ]);

    // Ember intensity driven by scroll (layered on breath)
    const emberScrollBoost = keyframes(p, [
      [0.00, 0.2],
      [0.40, 1.3],   // peak at services
      [0.60, 0.5],
      [1.00, 0.45],
    ]);

    // Heat shimmer — strong only around services
    const heatAmount = keyframes(p, [
      [0.25, 0.0],
      [0.40, 1.0],
      [0.55, 0.0],
      [1.00, 0.0],
    ]);

    // Drift damping — chisel settles in contact
    const driftAmount = keyframes(p, [
      [0.00, 1.0],
      [0.90, 0.8],
      [1.00, 0.15],  // heavily damped at bottom
    ]);

    // ── Apply to glow shader ───────────────────────────────────
    glowMat.uniforms.uTime.value = t;
    glowMat.uniforms.uEmber.value = breath * emberScrollBoost;
    glowMat.uniforms.uHeat.value = heatAmount;

    // ── Apply to chisel emissive (so metal itself glows subtly) ─
    if (chisel) {
      const emissiveLevel = breath * (0.15 + heatAmount * 0.8);
      chisel.traverse((o) => {
        if (o.isMesh && o.material && o.material.emissive) {
          const m = o.material;
          const orig = m.userData._origEmissive || new THREE.Color(0, 0, 0);
          m.emissive.copy(orig);
          m.emissive.r += 0.55 * emissiveLevel;
          m.emissive.g += 0.16 * emissiveLevel;
          m.emissive.b += 0.03 * emissiveLevel;
        }
      });
    }

    // Rim light warms with heat
    rimLight.intensity = 1.8 + heatAmount * 2.8 + breath * 0.5;

    // ── Position (scroll target + EVA drift) ───────────────────
    const targetX = innerWidth <= 900 ? mobileX : desktopX;
    const targetY = idleBase.y + yOffset;

    if (!reduce) {
      const floatX = (Math.sin(t * 0.23) * 0.22 + Math.sin(t * 0.11) * 0.14) * driftAmount;
      const floatY = (Math.cos(t * 0.19) * 0.18 + Math.sin(t * 0.33) * 0.09) * driftAmount;
      outerPivot.position.x = targetX + floatX;
      outerPivot.position.y = targetY + floatY;
    } else {
      outerPivot.position.x = targetX;
      outerPivot.position.y = targetY;
    }

    // ── Drift rotation (weightless tumble) ─────────────────────
    if (!reduce) {
      driftPivot.rotation.y = (Math.sin(t * 0.07) * 0.35 + Math.sin(t * 0.13) * 0.12) * driftAmount;
      driftPivot.rotation.x = (Math.sin(t * 0.09) * 0.14 + Math.cos(t * 0.15) * 0.06) * driftAmount;
      driftPivot.rotation.z = (Math.sin(t * 0.05) * 0.10) * driftAmount;
    } else {
      driftPivot.rotation.set(0, 0, 0);
    }

    // ── Scroll-driven outer Y rotation (one slow turn across page) ─
    outerPivot.rotation.y = p * Math.PI * 2;

    // ── Very slow self-spin (always on) ────────────────────────
    if (!reduce && chisel) {
      spinPivot.rotation.y = t * 0.05;
    }

    // ── Scale ──────────────────────────────────────────────────
    const baseScale = innerWidth <= 900 ? 0.85 : 1.15;
    outerPivot.scale.setScalar(baseScale * scaleMul);

    // ── Render ─────────────────────────────────────────────────
    renderer.autoClear = true;
    renderer.render(scene, cam);
    renderer.autoClear = false;
    renderer.render(vigScene, vigCam);
    renderer.autoClear = true;

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
