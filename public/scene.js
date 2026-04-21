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

  // ─── Spark particles (bright, short-lived) ─────────────────────
  const SPARK_COUNT = 120;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(SPARK_COUNT * 3);
  const sparkVel = new Float32Array(SPARK_COUNT * 3);
  const sparkLife = new Float32Array(SPARK_COUNT);
  for (let i = 0; i < SPARK_COUNT; i++) sparkLife[i] = 0;
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    color: 0xffb060, size: 0.09, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  scene.add(sparks);

  // ─── Debris particles (gray/dark, gravity-affected, longer life) ─
  const DEBRIS_COUNT = 80;
  const debrisGeo = new THREE.BufferGeometry();
  const debrisPos = new Float32Array(DEBRIS_COUNT * 3);
  const debrisVel = new Float32Array(DEBRIS_COUNT * 3);
  const debrisLife = new Float32Array(DEBRIS_COUNT);
  for (let i = 0; i < DEBRIS_COUNT; i++) debrisLife[i] = 0;
  debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPos, 3));
  const debrisMat = new THREE.PointsMaterial({
    color: 0xc8a878, size: 0.28, transparent: true, opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const debris = new THREE.Points(debrisGeo, debrisMat);
  scene.add(debris);

  // ─── Dust cloud (large, fading) ────────────────────────────────
  const DUST_COUNT = 40;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST_COUNT * 3);
  const dustVel = new Float32Array(DUST_COUNT * 3);
  const dustLife = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) dustLife[i] = 0;
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xe8d4a8, size: 0.85, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  function emitSparks(originX, originY) {
    // Emit ~35 sparks per strike (overwriting oldest)
    let emitted = 0;
    for (let i = 0; i < SPARK_COUNT && emitted < 35; i++) {
      if (sparkLife[i] > 0.1) continue;
      const ang = Math.random() * Math.PI * 2;
      const spd = 2.5 + Math.random() * 5;
      sparkPos[i * 3 + 0] = originX + (Math.random() - 0.5) * 0.3;
      sparkPos[i * 3 + 1] = originY;
      sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      sparkVel[i * 3 + 0] = Math.cos(ang) * spd;
      sparkVel[i * 3 + 1] = Math.abs(Math.sin(ang)) * spd * 0.4 + Math.random() * 1.2;
      sparkVel[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
      sparkLife[i] = 0.8 + Math.random() * 0.4;
      emitted++;
    }
  }

  function emitDebris(originX, originY) {
    // Chunks of rock — tumble out with gravity
    let emitted = 0;
    for (let i = 0; i < DEBRIS_COUNT && emitted < 20; i++) {
      if (debrisLife[i] > 0.1) continue;
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3;
      debrisPos[i * 3 + 0] = originX + (Math.random() - 0.5) * 0.4;
      debrisPos[i * 3 + 1] = originY - 0.2;
      debrisPos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      debrisVel[i * 3 + 0] = Math.cos(ang) * spd;
      debrisVel[i * 3 + 1] = Math.random() * 2.5 + 1;  // mostly upward initial
      debrisVel[i * 3 + 2] = (Math.random() - 0.5) * 2;
      debrisLife[i] = 1.5 + Math.random() * 0.8;
      emitted++;
    }
  }

  function emitDust(originX, originY) {
    let emitted = 0;
    for (let i = 0; i < DUST_COUNT && emitted < 10; i++) {
      if (dustLife[i] > 0.1) continue;
      const ang = Math.random() * Math.PI * 2;
      const spd = 0.6 + Math.random() * 1.2;
      dustPos[i * 3 + 0] = originX + (Math.random() - 0.5) * 0.6;
      dustPos[i * 3 + 1] = originY;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      dustVel[i * 3 + 0] = Math.cos(ang) * spd;
      dustVel[i * 3 + 1] = Math.random() * 0.8 + 0.2;
      dustVel[i * 3 + 2] = (Math.random() - 0.5) * 1;
      dustLife[i] = 2.0 + Math.random();
      emitted++;
    }
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
      // Mobile: centered, lower — tip reaches into view
      outerPivot.position.set(0, -2.0, 0);
      outerPivot.scale.setScalar(0.85);
    } else {
      // Desktop: right side, vertically centered in viewport
      const fovY = cam.fov * Math.PI / 180;
      const viewH = 2 * cam.position.z * Math.tan(fovY / 2);
      const viewW = viewH * aspect;
      const xOffset = Math.min(viewW * 0.22, 3.4);
      outerPivot.position.set(xOffset, -1.6, 0);
      outerPivot.scale.setScalar(1.2);
    }
  }

  // ─── Scroll (sticky — no fade-out) ─────────────────────────────
  let scrollY = 0;
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  addEventListener('resize', layout);

  // ─── Animation loop ────────────────────────────────────────────
  const clock = new THREE.Clock();

  // Burst pattern: 6s total cycle.
  // 0.0–1.0s: burst of 7 rapid strikes (every ~0.143s — jackhammer rate)
  // 1.0–6.0s: quiet (no strikes, chisel idle)
  const BURST_CYCLE = 6.0;
  const BURST_WINDOW = 1.0;
  const STRIKE_COUNT = 7;
  const STRIKE_INTERVAL = BURST_WINDOW / STRIKE_COUNT;  // ~0.143s
  const STRIKE_DUR = 0.12;     // each strike very short to fit the cadence
  let lastStrikeIndex = -1;    // tracks which strike in current cycle has already emitted sparks
  let lastCycle = -1;

  function tick() {
    const t = clock.getElapsedTime();
    glowMat.uniforms.uTime.value = t;

    // ── Burst timing ─────────────────────────────────────────────
    const cycleTime = t % BURST_CYCLE;
    const cycleIdx = Math.floor(t / BURST_CYCLE);
    if (cycleIdx !== lastCycle) { lastCycle = cycleIdx; lastStrikeIndex = -1; }

    let impactY = 0;
    let impactIntensity = 0;
    let shake = 0;

    if (!reduce && cycleTime < BURST_WINDOW) {
      // Which strike are we in? 0..4
      const strikeIdx = Math.floor(cycleTime / STRIKE_INTERVAL);
      const strikeT = cycleTime - strikeIdx * STRIKE_INTERVAL;
      const sp = strikeT / STRIKE_DUR;  // 0..1 within this strike, then idle

      if (sp <= 1) {
        // Tight jackhammer motion — small anticipation, sharp down, quick recoil
        // 0..0.15: up a little
        // 0.15..0.40: slam down
        // 0.40..1.0: bounce back
        if (sp < 0.15) {
          const k = sp / 0.15;
          impactY = easeOut(k) * 0.18;
        } else if (sp < 0.40) {
          const k = (sp - 0.15) / 0.25;
          impactY = 0.18 - easeIn(k) * 0.80;
        } else {
          const k = (sp - 0.40) / 0.60;
          impactY = -0.62 * Math.exp(-k * 8) * Math.cos(k * 18);
        }

        if (sp >= 0.35 && sp < 0.70) {
          const k = (sp - 0.35) / 0.35;
          impactIntensity = 1 - k;
        }

        if (sp >= 0.38 && sp < 0.80) {
          const k = (sp - 0.38) / 0.42;
          shake = (1 - k) * 0.09;
        }

        // Emit particles once per strike at slam moment
        if (sp >= 0.38 && strikeIdx > lastStrikeIndex) {
          lastStrikeIndex = strikeIdx;
          const tipWorldY = outerPivot.position.y - 2.0 * outerPivot.scale.y;
          const ox = outerPivot.position.x;
          emitSparks(ox, tipWorldY);
          emitDebris(ox, tipWorldY);
          emitDust(ox, tipWorldY);
        }
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
        outerPivot.rotation.y = t * 0.08;
        outerPivot.rotation.x = Math.sin(t * 0.3) * 0.04;
        spinPivot.rotation.y = t * 0.35;
      } else {
        outerPivot.rotation.y = 0.3;
      }
    }

    // ── Particle updates ─────────────────────────────────────────
    const DT = 0.016;

    // Sparks: quick, burn out fast
    for (let i = 0; i < SPARK_COUNT; i++) {
      if (sparkLife[i] > 0) {
        sparkPos[i * 3 + 0] += sparkVel[i * 3 + 0] * DT;
        sparkPos[i * 3 + 1] += sparkVel[i * 3 + 1] * DT;
        sparkPos[i * 3 + 2] += sparkVel[i * 3 + 2] * DT;
        sparkVel[i * 3 + 1] -= 0.18;  // gravity
        sparkVel[i * 3 + 0] *= 0.97;
        sparkVel[i * 3 + 2] *= 0.97;
        sparkLife[i] -= DT * 1.4;
      } else {
        sparkPos[i * 3 + 1] = -1000;
      }
    }
    sparkGeo.attributes.position.needsUpdate = true;

    // Debris: heavier, longer tumble, strong gravity
    for (let i = 0; i < DEBRIS_COUNT; i++) {
      if (debrisLife[i] > 0) {
        debrisPos[i * 3 + 0] += debrisVel[i * 3 + 0] * DT;
        debrisPos[i * 3 + 1] += debrisVel[i * 3 + 1] * DT;
        debrisPos[i * 3 + 2] += debrisVel[i * 3 + 2] * DT;
        debrisVel[i * 3 + 1] -= 0.22;  // gravity
        debrisVel[i * 3 + 0] *= 0.985;
        debrisVel[i * 3 + 2] *= 0.985;
        debrisLife[i] -= DT * 0.6;
      } else {
        debrisPos[i * 3 + 1] = -1000;
      }
    }
    debrisGeo.attributes.position.needsUpdate = true;

    // Dust: drifts up, slow, fades
    for (let i = 0; i < DUST_COUNT; i++) {
      if (dustLife[i] > 0) {
        dustPos[i * 3 + 0] += dustVel[i * 3 + 0] * DT;
        dustPos[i * 3 + 1] += dustVel[i * 3 + 1] * DT;
        dustPos[i * 3 + 2] += dustVel[i * 3 + 2] * DT;
        dustVel[i * 3 + 1] += 0.04;   // slight buoyancy
        dustVel[i * 3 + 0] *= 0.99;
        dustVel[i * 3 + 2] *= 0.99;
        dustLife[i] -= DT * 0.5;
      } else {
        dustPos[i * 3 + 1] = -1000;
      }
    }
    dustGeo.attributes.position.needsUpdate = true;

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
