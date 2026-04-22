// Kervan Heat — scene.js
// Kırma simülasyonu: chisel drops, rock shatters, resets. Auto-loop.

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
  scene.fog = new THREE.FogExp2(0x050608, 0.026);

  const cam = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.1, 200);
  const CAM_BASE = new THREE.Vector3(0, 1.5, 14);
  cam.position.copy(CAM_BASE);
  cam.lookAt(0, -1, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  root.appendChild(renderer.domElement);

  addEventListener('resize', () => {
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // ══════════════════════════════════════════════════════════════════════
  // LIGHTS
  // ══════════════════════════════════════════════════════════════════════
  scene.add(new THREE.AmbientLight(0x050608, 0.18));

  const forge = new THREE.PointLight(0xFF5500, 9, 36, 1.8);
  forge.position.set(4, -5, 4);
  scene.add(forge);

  const rim = new THREE.DirectionalLight(0xB0C8FF, 2.2);
  rim.position.set(-6, 8, -2);
  scene.add(rim);

  const fill = new THREE.PointLight(0x304080, 0.55, 22);
  fill.position.set(-5, 2, 5);
  scene.add(fill);

  // Impact flash — positioned at rock top, animated on strike
  const flash = new THREE.PointLight(0xFF6600, 0, 14, 1.6);
  flash.position.set(0, -1.4, 0);
  scene.add(flash);

  // ══════════════════════════════════════════════════════════════════════
  // ROCK
  // ══════════════════════════════════════════════════════════════════════
  const ROCK_Y = -3.4;
  const ROCK_R = 1.9;

  function makeRockGeo(r, detail) {
    const geo = new THREE.IcosahedronGeometry(r, detail);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const f = 0.70 + Math.random() * 0.58;
      pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f, pos.getZ(i) * f);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6E7276, metalness: 0.04, roughness: 0.94 });
  const rock = new THREE.Mesh(makeRockGeo(ROCK_R, 2), rockMat);
  rock.position.y = ROCK_Y;
  scene.add(rock);

  // Ground shadow
  const gndMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uOp: { value: 0.7 } },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float uOp;void main(){vec2 c=vUv-.5;float a=smoothstep(.5,0.,length(vec2(c.x*.55,c.y*2.0)));gl_FragColor=vec4(0.,0.,0.,a*uOp);}`,
  });
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), gndMat);
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.y = ROCK_Y - ROCK_R + 0.15;
  scene.add(gnd);

  // ══════════════════════════════════════════════════════════════════════
  // ROCK FRAGMENTS
  // ══════════════════════════════════════════════════════════════════════
  const FRAG_N  = 13;
  const fragGrp = new THREE.Group();
  fragGrp.position.y = ROCK_Y;
  scene.add(fragGrp);

  const fMats = [
    new THREE.MeshStandardMaterial({ color: 0x606367, metalness: 0.04, roughness: 0.96 }),
    new THREE.MeshStandardMaterial({ color: 0x6E7276, metalness: 0.04, roughness: 0.92 }),
    new THREE.MeshStandardMaterial({ color: 0x79797C, metalness: 0.04, roughness: 0.89 }),
  ];

  const frags = [];
  for (let i = 0; i < FRAG_N; i++) {
    const sz  = 0.32 + Math.random() * 0.68;
    const geo = makeRockGeo(sz, Math.random() > 0.55 ? 1 : 0);
    const mat = fMats[i % fMats.length].clone();
    const mesh = new THREE.Mesh(geo, mat);

    const theta = (i / FRAG_N) * Math.PI * 2 + Math.random() * 0.6;
    const phi   = Math.acos(2 * (i / FRAG_N) - 1);
    const r     = Math.random() * ROCK_R * 0.88;
    mesh.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    mesh.visible = false;
    fragGrp.add(mesh);

    frags.push({
      mesh, mat,
      restPos: mesh.position.clone(),
      restRot: new THREE.Euler().copy(mesh.rotation),
      vel: new THREE.Vector3(),
      angVel: new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14),
      life: 0,
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // SPARKS
  // ══════════════════════════════════════════════════════════════════════
  const SP_N   = isMobile ? 0 : 50;
  const spPos  = new Float32Array(Math.max(SP_N, 1) * 3);
  const spVel  = Array.from({ length: SP_N }, () => new THREE.Vector3());
  const spLife = new Float32Array(SP_N);
  for (let i = 0; i < SP_N; i++) spPos[i * 3] = spPos[i * 3 + 1] = spPos[i * 3 + 2] = 1000;

  const spGeo = new THREE.BufferGeometry();
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  const spMesh = new THREE.Points(spGeo, new THREE.PointsMaterial({
    color: 0xFFAA22, size: 0.13, transparent: true, opacity: 0.9,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(spMesh);

  // ══════════════════════════════════════════════════════════════════════
  // CHISEL (GLB)
  // ══════════════════════════════════════════════════════════════════════
  const CHISEL_LEN    = 13.5;
  const CHISEL_REST_Y = 7.2;   // pivot Y at rest  → tip at 7.2 - 6.75 ≈ 0.45
  const CHISEL_HIGH_Y = 8.5;   // wind-up raise
  const CHISEL_HIT_Y  = 4.9;   // pivot Y on impact → tip at 4.9 - 6.75 ≈ -1.85 ≈ rock top

  const cPivot = new THREE.Group(); // Y-animated
  const cTilt  = new THREE.Group(); // cosmetic tilt
  const cSpin  = new THREE.Group(); // idle slow rotation
  cPivot.add(cTilt); cTilt.add(cSpin);
  cTilt.rotation.z = 0.06;
  cPivot.position.set(-0.4, CHISEL_REST_Y, 0);
  cPivot.visible = false;
  scene.add(cPivot);

  let chiselReady = false;

  new GLTFLoader().load(
    '/kirici-uc.glb',
    (gltf) => {
      const m = gltf.scene;
      const box = new THREE.Box3().setFromObject(m);
      const sz  = box.getSize(new THREE.Vector3());
      m.position.sub(box.getCenter(new THREE.Vector3()));
      m.scale.setScalar(CHISEL_LEN / Math.max(sz.x, sz.y, sz.z));
      if (sz.z >= sz.y && sz.z >= sz.x) m.rotation.x = Math.PI / 2;
      else if (sz.x >= sz.y) m.rotation.z = -Math.PI / 2;
      m.traverse(o => {
        if (o.isMesh && o.material) {
          o.material.metalness = Math.max(o.material.metalness ?? 0, 0.88);
          o.material.roughness = Math.min(o.material.roughness ?? 1, 0.38);
        }
      });
      cSpin.add(m);
      chiselReady = true;
      cPivot.visible = true;
    },
    undefined,
    () => {
      // Fallback geometry
      const mat  = new THREE.MeshStandardMaterial({ color: 0x58626E, metalness: 0.92, roughness: 0.3 });
      const hMat = new THREE.MeshStandardMaterial({ color: 0xFF5500, metalness: 0.85, roughness: 0.3, emissive: 0xFF2000, emissiveIntensity: 0.5 });
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 8, 32), mat); body.position.y = 2; g.add(body);
      const taper = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.38, 3, 32), mat); taper.position.y = -3; g.add(taper);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.38, 2.5, 32), hMat); tip.position.y = -5.5; g.add(tip);
      cSpin.add(g);
      chiselReady = true;
      cPivot.visible = true;
    }
  );

  // ══════════════════════════════════════════════════════════════════════
  // STATE MACHINE
  // ══════════════════════════════════════════════════════════════════════
  const S = { IDLE: 0, WINDUP: 1, STRIKE: 2, SHATTER: 3, RESET: 4 };
  const DUR = reduce
    ? { idle: 0.6, windup: 0.08, strike: 0.04, shatter: 0.5, reset: 0.25 }
    : { idle: 3.6, windup: 0.55, strike: 0.17, shatter: 2.9, reset: 1.05 };

  let state = S.IDLE;
  let stateT = 0;
  let shake = 0;

  function easeOut3(x) { return 1 - Math.pow(1 - x, 3); }
  function easeIn3(x)  { return x * x * x; }
  function sm(x)       { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  function impact() {
    rock.visible = false;
    for (const f of frags) {
      f.mesh.visible = true;
      f.life = 0;
      f.mesh.position.copy(f.restPos);
      f.mesh.rotation.copy(f.restRot);
      f.mat.opacity = 1; f.mat.transparent = false;
      const dir = f.restPos.clone().normalize();
      dir.y = Math.abs(dir.y) + 0.6;
      f.vel.copy(dir).multiplyScalar(3.5 + Math.random() * 5.5);
      f.vel.x += (Math.random() - 0.5) * 2.5;
      f.vel.z += (Math.random() - 0.5) * 2.5;
    }
    for (let i = 0; i < SP_N; i++) {
      spPos[i*3]   = cPivot.position.x + (Math.random()-0.5) * 1.4;
      spPos[i*3+1] = ROCK_Y + ROCK_R * 0.15 + Math.random() * 0.6;
      spPos[i*3+2] = (Math.random()-0.5) * 1.4;
      const a = Math.random() * Math.PI * 2;
      const sp = 2.5 + Math.random() * 7;
      spVel[i].set(Math.cos(a)*sp*0.8, 1.5 + Math.random()*6, Math.sin(a)*sp*0.55);
      spLife[i] = 1.0;
    }
    if (SP_N > 0) spGeo.attributes.position.needsUpdate = true;
    flash.intensity = 18;
    shake = 0.4;
  }

  // ══════════════════════════════════════════════════════════════════════
  // MOUSE PARALLAX
  // ══════════════════════════════════════════════════════════════════════
  const mouse = { x: 0, sx: 0, y: 0, sy: 0 };
  if (!isMobile) {
    addEventListener('pointermove', e => {
      mouse.x = (e.clientX / innerWidth) * 2 - 1;
      mouse.y = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }

  // ══════════════════════════════════════════════════════════════════════
  // LOOP
  // ══════════════════════════════════════════════════════════════════════
  let prevT = performance.now() / 1000;
  let elapsed = 0;

  function tick() {
    const now = performance.now() / 1000;
    const dt  = Math.min(now - prevT, 0.05);
    prevT = now;
    elapsed += dt;
    const t = elapsed;

    mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 2.4);
    mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 2.4);

    // ── Forge breath ────────────────────────────────────────────────
    const br = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 8.5);
    forge.intensity = 7 + br * 7;
    rim.intensity   = 1.5 + (1 - br) * 1.2;
    flash.intensity *= Math.max(0, 1 - dt * 9);

    if (!chiselReady) { renderer.render(scene, cam); requestAnimationFrame(tick); return; }

    stateT += dt;

    switch (state) {
      case S.IDLE: {
        cPivot.position.y = CHISEL_REST_Y + Math.sin(t * 0.88) * 0.14;
        cSpin.rotation.y  = t * 0.24;
        cTilt.rotation.z  = 0.06 + Math.sin(t * 0.55) * 0.035;
        if (stateT > DUR.idle) { state = S.WINDUP; stateT = 0; }
        break;
      }
      case S.WINDUP: {
        const p = Math.min(1, stateT / DUR.windup);
        cPivot.position.y = CHISEL_REST_Y + easeOut3(p) * 1.3;
        cSpin.rotation.y  = t * 0.24;
        if (stateT > DUR.windup) { state = S.STRIKE; stateT = 0; }
        break;
      }
      case S.STRIKE: {
        const p = Math.min(1, stateT / DUR.strike);
        cPivot.position.y = THREE.MathUtils.lerp(CHISEL_REST_Y + 1.3, CHISEL_HIT_Y, easeIn3(p));
        if (stateT > DUR.strike) { impact(); state = S.SHATTER; stateT = 0; }
        break;
      }
      case S.SHATTER: {
        // Chisel bounce-back
        const cb = Math.min(1, stateT / 0.45);
        cPivot.position.y = THREE.MathUtils.lerp(CHISEL_HIT_Y, CHISEL_REST_Y + 0.4, easeOut3(cb));
        cSpin.rotation.y  = t * 0.24;

        // Fragment physics
        const fadeStart = DUR.shatter * 0.52;
        for (const f of frags) {
          if (!f.mesh.visible) continue;
          f.vel.y   -= 9.4 * dt;
          f.mesh.position.addScaledVector(f.vel, dt);
          f.mesh.rotation.x += f.angVel.x * dt;
          f.mesh.rotation.y += f.angVel.y * dt;
          f.mesh.rotation.z += f.angVel.z * dt;
          f.life += dt;
          if (f.life > fadeStart) {
            f.mat.transparent = true;
            f.mat.opacity = Math.max(0, 1 - (f.life - fadeStart) / (DUR.shatter - fadeStart));
          }
        }

        // Spark physics
        let spDirty = false;
        for (let i = 0; i < SP_N; i++) {
          if (spLife[i] <= 0) continue;
          spPos[i*3]   += spVel[i].x * dt;
          spPos[i*3+1] += spVel[i].y * dt;
          spPos[i*3+2] += spVel[i].z * dt;
          spVel[i].y   -= 9.4 * dt;
          spLife[i]    -= dt * 1.1;
          if (spLife[i] <= 0) { spPos[i*3] = spPos[i*3+1] = spPos[i*3+2] = 1000; }
          spDirty = true;
        }
        if (spDirty) spGeo.attributes.position.needsUpdate = true;

        if (stateT > DUR.shatter) { state = S.RESET; stateT = 0; }
        break;
      }
      case S.RESET: {
        const p = Math.min(1, stateT / DUR.reset);
        cPivot.position.y = THREE.MathUtils.lerp(CHISEL_REST_Y + 0.4, CHISEL_REST_Y, sm(p));
        cSpin.rotation.y  = t * 0.24;

        if (stateT < 0.05) {
          for (const f of frags) f.mesh.visible = false;
          rock.visible = true;
          rock.scale.setScalar(0.01);
        }
        rock.scale.setScalar(sm(p));

        if (stateT > DUR.reset) {
          rock.scale.setScalar(1);
          state = S.IDLE;
          stateT = 0;
        }
        break;
      }
    }

    // Camera shake + mouse parallax
    shake = Math.max(0, shake - dt * 5);
    const sx = shake > 0 ? (Math.random() - 0.5) * shake * 0.3 : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * shake * 0.2 : 0;
    cam.position.set(
      CAM_BASE.x + sx + (reduce ? 0 : mouse.sx * 0.55),
      CAM_BASE.y + sy - (reduce ? 0 : mouse.sy * 0.32),
      CAM_BASE.z,
    );

    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
