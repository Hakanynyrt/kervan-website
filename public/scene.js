// Kervan Heat — scene.js
// Keski yağmuru: scroll ilerledikçe keski'ler yukarıdan düşer,
// birbirini iter, zemine yığılır. Repodaki /kirici-uc.glb kullanılır.

(async function () {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const reduce   = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // ── Root ──────────────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'scene-root';
  root.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;background:#050608;';
  document.body.insertBefore(root, document.body.firstChild);

  // ── Renderer ──────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050608, 0.024);

  const cam = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 200);
  cam.position.set(0, 2, 17);
  cam.lookAt(0, -2, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile, alpha: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  root.appendChild(renderer.domElement);

  addEventListener('resize', () => {
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // ── Lights ────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x07080F, 0.14));

  const forge = new THREE.PointLight(0xFF5500, 10, 45, 1.7);
  forge.position.set(0, -14, 5);
  scene.add(forge);

  const forgeB = new THREE.PointLight(0xFF7020, 5, 30, 2);
  forgeB.position.set(-5, -10, 3);
  scene.add(forgeB);

  const rim = new THREE.DirectionalLight(0x90B0FF, 2.2);
  rim.position.set(-7, 10, -3);
  scene.add(rim);

  // ── Background ember glow (shader plane) ──────────────────────────────
  const glowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uEmber: { value: 0.3 } },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `
      varying vec2 vUv; uniform float uEmber;
      void main(){
        float d=length(vUv-.5);
        float c=smoothstep(.48,0.,d);
        vec3 col=mix(vec3(.55,.12,.04),vec3(1.,.42,.14),c);
        gl_FragColor=vec4(col*c*uEmber*1.8, c*uEmber);
      }
    `,
  });
  const glowMesh = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), glowMat);
  glowMesh.position.set(0, -6, -12);
  scene.add(glowMesh);

  // ── Physics constants ─────────────────────────────────────────────────
  const GRAVITY     = -16.0;
  const RESTITUTION =  0.28;
  const FRICTION    =  0.70;
  const ANG_DAMP    =  0.86;   // per-frame factor (applied as Math.pow per dt)
  const GROUND_Y    = -7.0;
  const WALL_X      =  8.5;
  const COL_R       =  1.25;   // collision sphere radius per chisel
  const N_MAX       = isMobile ? 9 : 22;
  const CHISEL_LEN  = isMobile ? 7 : 9;

  // ── Chisel pool ───────────────────────────────────────────────────────
  const pool = [];   // { group, pos, vel, quat, angVel, active, settled }
  let   lastSpawn = -99;
  const SPAWN_GAP = reduce ? 0 : 0.28; // seconds between each drop

  const _axis = new THREE.Vector3();
  const _dq   = new THREE.Quaternion();
  const _sep  = new THREE.Vector3();

  function spawnOne(idx) {
    const c = pool[idx];
    c.active  = true;
    c.settled = false;
    c.pos.set((Math.random() - 0.5) * 11, 13 + Math.random() * 5, (Math.random() - 0.5) * 3.5);
    c.vel.set((Math.random() - 0.5) * 2.5, -(0.5 + Math.random() * 1.5), (Math.random() - 0.5) * 1.5);
    c.quat.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
    c.angVel.set((Math.random()-0.5)*9, (Math.random()-0.5)*9, (Math.random()-0.5)*7);
    c.group.visible  = true;
    c.group.position.copy(c.pos);
    c.group.quaternion.copy(c.quat);
  }

  // Load GLB, build pool once loaded
  new GLTFLoader().load(
    '/kirici-uc.glb',
    (gltf) => {
      // Orient template: center + scale + longest axis = Y
      const tmpl = gltf.scene;
      const box  = new THREE.Box3().setFromObject(tmpl);
      const sz   = box.getSize(new THREE.Vector3());
      tmpl.position.sub(box.getCenter(new THREE.Vector3()));
      const longest = Math.max(sz.x, sz.y, sz.z);
      tmpl.scale.setScalar(CHISEL_LEN / longest);
      if (sz.z >= sz.y && sz.z >= sz.x) tmpl.rotation.x =  Math.PI / 2;
      else if (sz.x > sz.y)             tmpl.rotation.z = -Math.PI / 2;
      // Boost metal look
      tmpl.traverse(o => {
        if (o.isMesh && o.material) {
          o.material.metalness = Math.max(o.material.metalness ?? 0, 0.88);
          o.material.roughness = Math.min(o.material.roughness ?? 1, 0.38);
        }
      });

      // Populate pool
      for (let i = 0; i < N_MAX; i++) {
        const grp = new THREE.Group();
        grp.add(tmpl.clone(true));
        grp.visible = false;
        scene.add(grp);
        pool.push({
          group:  grp,
          pos:    new THREE.Vector3(0, 30, 0), // park off-screen
          vel:    new THREE.Vector3(),
          quat:   new THREE.Quaternion(),
          angVel: new THREE.Vector3(),
          active:  false,
          settled: false,
        });
      }
    },
    undefined,
    err => console.warn('[scene] GLB load error', err)
  );

  // ── Scroll ────────────────────────────────────────────────────────────
  let rawScroll = 0, smoothScroll = 0;
  function updateScroll() {
    const d = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    rawScroll = Math.min(1, Math.max(0, window.scrollY / d));
  }
  addEventListener('scroll', updateScroll, { passive: true });
  requestAnimationFrame(updateScroll);

  // ── Physics ───────────────────────────────────────────────────────────
  function physicsStep(dt) {
    const live = pool.filter(c => c.active);

    for (const c of live) {
      if (c.settled) continue;

      // Gravity
      c.vel.y += GRAVITY * dt;

      // Integrate
      c.pos.addScaledVector(c.vel, dt);

      // Rotate
      const spd = c.angVel.length();
      if (spd > 0.001) {
        _axis.copy(c.angVel).divideScalar(spd);
        _dq.setFromAxisAngle(_axis, spd * dt);
        c.quat.premultiply(_dq).normalize();
      }

      // Ground
      if (c.pos.y < GROUND_Y + COL_R) {
        c.pos.y = GROUND_Y + COL_R;
        if (c.vel.y < 0) {
          c.vel.y  *= -RESTITUTION;
          c.vel.x  *= FRICTION;
          c.vel.z  *= FRICTION;
          c.angVel.multiplyScalar(0.62);
        }
      }

      // Side walls
      for (const [axis, limit] of [['x', WALL_X], ['z', 5.5]]) {
        if (Math.abs(c.pos[axis]) > limit - COL_R) {
          c.pos[axis] = Math.sign(c.pos[axis]) * (limit - COL_R);
          c.vel[axis] *= -RESTITUTION * 0.7;
        }
      }

      // Angular damping
      c.angVel.multiplyScalar(Math.pow(ANG_DAMP, dt * 60));

      // Settled?
      if (c.vel.lengthSq() < 0.006 && c.angVel.lengthSq() < 0.015 && c.pos.y < GROUND_Y + COL_R + 0.25) {
        c.settled = true;
        c.vel.set(0, 0, 0);
        c.angVel.set(0, 0, 0);
      }

      c.group.position.copy(c.pos);
      c.group.quaternion.copy(c.quat);
    }

    // Chisel ↔ chisel collisions (sphere approximation, O(n²))
    const minD = COL_R * 2;
    for (let i = 0; i < live.length - 1; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i], b = live[j];
        _sep.subVectors(b.pos, a.pos);
        const dist = _sep.length();
        if (dist < minD && dist > 0.001) {
          _sep.divideScalar(dist); // normalize
          const overlap = (minD - dist) * 0.51;
          if (!a.settled) a.pos.addScaledVector(_sep, -overlap);
          if (!b.settled) b.pos.addScaledVector(_sep,  overlap);

          const relV = a.vel.dot(_sep) - b.vel.dot(_sep);
          if (relV >= 0) continue; // separating

          const imp = -(1 + RESTITUTION) * relV * 0.5;
          if (!a.settled) { a.vel.addScaledVector(_sep, -imp); a.angVel.addScaledVector(_sep, imp * 0.35); }
          if (!b.settled) { b.vel.addScaledVector(_sep,  imp); b.angVel.addScaledVector(_sep, imp * 0.35); }

          a.settled = false;
          b.settled = false;
        }
      }
    }
  }

  // ── Loop ──────────────────────────────────────────────────────────────
  let prevT   = performance.now() / 1000;
  let elapsed = 0;

  function tick() {
    const now = performance.now() / 1000;
    const dt  = Math.min(now - prevT, 0.033);
    prevT = now; elapsed += dt;

    smoothScroll += (rawScroll - smoothScroll) * Math.min(1, dt * 1.4);
    const p = smoothScroll;

    // Forge breath
    const br = 0.5 + 0.5 * Math.sin(elapsed * 0.68);
    forge.intensity  = 8  + br * 8;
    forgeB.intensity = 3  + br * 4;
    rim.intensity    = 1.8 + (1 - br) * 1.2;
    glowMat.uniforms.uEmber.value = 0.22 + br * 0.28 + p * 0.55;

    // Spawn chisels as scroll increases
    if (pool.length > 0) {
      const want   = reduce ? Math.min(3, pool.length) : Math.round(p * N_MAX);
      const active = pool.filter(c => c.active).length;
      if (active < want && elapsed - lastSpawn > SPAWN_GAP) {
        const idle = pool.find(c => !c.active);
        if (idle) { spawnOne(pool.indexOf(idle)); lastSpawn = elapsed; }
      }
    }

    if (!reduce) physicsStep(dt);

    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
