// Kervan Heat — scene.js
// Loads kirici-uc.glb, clones for two chisels, scroll choreography.

(async function () {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

  const reduce   = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 900px)').matches;

  // ── Root ──────────────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'scene-root';
  root.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;background:#050608;';
  document.body.insertBefore(root, document.body.firstChild);

  // ── Renderer ──────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050608, 0.033);

  const cam = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.1, 200);
  cam.position.set(0, 0, 12);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  root.appendChild(renderer.domElement);

  // ══════════════════════════════════════════════════════════════════════
  // SCENE LIGHTS
  // ══════════════════════════════════════════════════════════════════════
  scene.add(new THREE.AmbientLight(0x07080F, 0.10));

  const forge1 = new THREE.PointLight(0xFF4800, 12, 32, 1.8);
  forge1.position.set(5, -6, 3);
  scene.add(forge1);

  const forge2 = new THREE.PointLight(0xFF7020, 5, 24, 2);
  forge2.position.set(-4, -4, 2);
  scene.add(forge2);

  const rim = new THREE.DirectionalLight(0xAAD0FF, 2.8);
  rim.position.set(-7, 9, -3);
  scene.add(rim);

  // ── Contact shadows ───────────────────────────────────────────────────
  function makeShadow(opacity) {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uOp: { value: opacity } },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec2 vUv;uniform float uOp;void main(){vec2 c=vUv-.5;float d=length(vec2(c.x*.68,c.y*2.1));float a=smoothstep(.52,0.,d);gl_FragColor=vec4(vec3(.24,.05,0.),a*uOp);}`,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -6.2;
    scene.add(mesh);
    return { mesh, mat };
  }

  const sdwA = makeShadow(0.85);
  const sdwB = makeShadow(0.55);

  // ══════════════════════════════════════════════════════════════════════
  // EMBER PARTICLES
  // ══════════════════════════════════════════════════════════════════════
  const N = isMobile ? 0 : 60;
  let embers = null;

  if (N > 0 && !reduce) {
    const pos = new Float32Array(N * 3);
    const vel = [];
    for (let i = 0; i < N; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = -5 - Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      vel.push({ x: (Math.random() - 0.5) * 0.018, y: 0.010 + Math.random() * 0.022, z: (Math.random() - 0.5) * 0.010 });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xFF5500, size: 0.10, transparent: true, opacity: 0.65,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    embers = new THREE.Points(geo, mat);
    embers.userData = { pos, vel };
    scene.add(embers);
  }

  // ══════════════════════════════════════════════════════════════════════
  // LAYOUT & SCROLL
  // ══════════════════════════════════════════════════════════════════════
  const baseA = new THREE.Vector3();
  const baseB = new THREE.Vector3();
  let scaleA = 1, scaleB = 0.8;

  const pivA = { outer: new THREE.Group(), tilt: new THREE.Group(), spin: new THREE.Group() };
  const pivB = { outer: new THREE.Group(), tilt: new THREE.Group(), spin: new THREE.Group() };

  pivA.outer.add(pivA.tilt); pivA.tilt.add(pivA.spin);
  pivB.outer.add(pivB.tilt); pivB.tilt.add(pivB.spin);
  scene.add(pivA.outer);
  scene.add(pivB.outer);

  function layout() {
    const w = innerWidth, h = innerHeight;
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    renderer.setSize(w, h);

    if (w <= 900) {
      baseA.set(-0.8, -2.2,  0.0);
      baseB.set( 1.8, -2.8, -4.0);
      scaleA = 0.70; scaleB = 0.52;
    } else {
      const fovY = cam.fov * Math.PI / 180;
      const viewW = 2 * cam.position.z * Math.tan(fovY / 2) * (w / h);
      const lx = -Math.min(viewW * 0.24, 4.0);
      baseA.set(lx,        -1.8,  0.0);
      baseB.set(lx - 2.8,  -2.4, -4.5);
      scaleA = 1.08; scaleB = 0.82;
    }
    pivA.outer.position.copy(baseA); pivA.outer.scale.setScalar(scaleA);
    pivB.outer.position.copy(baseB); pivB.outer.scale.setScalar(scaleB);
    sdwA.mesh.position.x = baseA.x;
    sdwB.mesh.position.x = baseB.x;
  }
  layout();

  let rawScroll = 0, smoothScroll = 0;
  function updateScroll() {
    const d = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    rawScroll = Math.min(1, Math.max(0, window.scrollY / d));
  }
  addEventListener('scroll', updateScroll, { passive: true });
  addEventListener('resize', () => { layout(); updateScroll(); });
  requestAnimationFrame(updateScroll);

  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  if (!isMobile) {
    addEventListener('pointermove', e => {
      mouse.x = (e.clientX / innerWidth) * 2 - 1;
      mouse.y = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }

  // ══════════════════════════════════════════════════════════════════════
  // LOAD GLB
  // ══════════════════════════════════════════════════════════════════════
  const loader = new GLTFLoader();

  // Glow lights attached to each chisel
  const glowA = new THREE.PointLight(0xFF4400, 3.5, 9, 2);
  const glowB = new THREE.PointLight(0xFF4400, 2.5, 7, 2);

  // Hot emissive materials to paint onto tip meshes after load
  const hotMatA = new THREE.MeshStandardMaterial({
    color: 0xFF5500, metalness: 0.85, roughness: 0.28,
    emissive: new THREE.Color(0xFF2800), emissiveIntensity: 0.6,
  });
  const hotMatB = new THREE.MeshStandardMaterial({
    color: 0xFF5500, metalness: 0.85, roughness: 0.28,
    emissive: new THREE.Color(0xFF2800), emissiveIntensity: 0.45,
  });

  function applyGlowToTip(modelGroup, hotMat, glowLight) {
    // Find the lowest-Y mesh in the model — that's the tip
    let tipMesh = null;
    let lowestY = Infinity;
    modelGroup.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = false;
        const box = new THREE.Box3().setFromObject(obj);
        if (box.min.y < lowestY) {
          lowestY = box.min.y;
          tipMesh = obj;
        }
      }
    });
    if (tipMesh) {
      tipMesh.material = hotMat;
      // Position glow at tip
      glowLight.position.set(0, lowestY - 0.5, 0);
    } else {
      glowLight.position.set(0, -8.8, 0);
    }
    modelGroup.add(glowLight);
  }

  loader.load(
    'https://kervanheat.com/kirici-uc.glb',
    (gltf) => {
      const modelA = gltf.scene;
      const modelB = gltf.scene.clone(true);

      applyGlowToTip(modelA, hotMatA, glowA);
      applyGlowToTip(modelB, hotMatB, glowB);

      pivA.spin.add(modelA);
      pivB.spin.add(modelB);

      pivA.outer.visible = true;
      pivB.outer.visible = true;
    },
    undefined,
    (err) => {
      console.warn('[kervanheat] GLB load failed', err);
    }
  );

  // Hide pivots until GLB is ready
  pivA.outer.visible = false;
  pivB.outer.visible = false;

  // ══════════════════════════════════════════════════════════════════════
  // ANIMATION LOOP
  // ══════════════════════════════════════════════════════════════════════
  const clock = new THREE.Clock();

  function sm(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }
  function kf(p, frames) {
    if (p <= frames[0][0]) return frames[0][1];
    if (p >= frames[frames.length - 1][0]) return frames[frames.length - 1][1];
    for (let i = 0; i < frames.length - 1; i++) {
      const [p0, v0] = frames[i], [p1, v1] = frames[i + 1];
      if (p >= p0 && p <= p1) return v0 + (v1 - v0) * sm((p - p0) / (p1 - p0));
    }
    return frames[frames.length - 1][1];
  }

  function tick() {
    const t  = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    smoothScroll += (rawScroll - smoothScroll) * Math.min(1, dt * 1.6);
    const p = smoothScroll;

    mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 2.2);
    mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 2.2);

    // ── Forge breath ──────────────────────────────────────────────────
    const b1 = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 9.0);
    const b2 = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 11.0 + 1.1);

    forge1.intensity = 8   + b1 * 8;
    forge2.intensity = 3   + b2 * 4.5;
    rim.intensity    = 2   + (1 - b1) * 1.8;

    // ── Tip glows pulse with breath ────────────────────────────────────
    glowA.intensity              = 2.5 + b1 * 3.0;
    glowB.intensity              = 1.8 + b2 * 2.5;
    hotMatA.emissiveIntensity    = 0.4 + b1 * 0.6;
    hotMatB.emissiveIntensity    = 0.25 + b2 * 0.45;

    const mpx = reduce ? 0 : mouse.sx * 0.65;
    const mpy = reduce ? 0 : mouse.sy * 0.44;

    // ── CHISEL A — foreground, scroll hero to contact ─────────────────
    const xA  = kf(p, [[0, baseA.x], [0.40, baseA.x * 0.45], [0.70, -baseA.x * 0.25], [1.0, 0]]);
    const yA  = kf(p, [[0, 0], [0.42, 1.1], [1, -0.9]]);
    const sA  = kf(p, [[0, 1.0], [0.42, 1.24], [1, 0.94]]);
    const rzA = kf(p, [[0, -0.16], [0.50, 0.14], [1, -0.05]]);
    const rxA = kf(p, [[0,  0.10], [1.0, -0.16]]);
    const ryA = reduce ? 0 : p * Math.PI * 2 * 1.4 + t * 0.05;

    pivA.outer.position.set(xA + mpx, baseA.y + yA - mpy, 0);
    pivA.outer.scale.setScalar(scaleA * sA);
    pivA.tilt.rotation.set(rxA + (reduce ? 0 : mouse.sy * 0.07), 0, rzA + (reduce ? 0 : mouse.sx * 0.09));
    pivA.spin.rotation.y = ryA;

    // ── CHISEL B — background, different arc, opposite spin ───────────
    const xB  = kf(p, [[0, baseB.x], [0.35, baseB.x * 1.15], [0.65, baseB.x * 0.3], [1, baseA.x * 0.7]]);
    const yB  = kf(p, [[0, 0.6], [0.5, 1.6], [1, -0.5]]);
    const sB  = kf(p, [[0, 1.0], [0.5, 1.18], [1, 1.02]]);
    const rzB = kf(p, [[0,  0.20], [0.50, -0.10], [1, 0.03]]);
    const rxB = kf(p, [[0, -0.06], [1.0,   0.12]]);
    const ryB = reduce ? Math.PI / 3 : p * Math.PI * 2 * (-1.1) + t * (-0.04) + Math.PI / 3;

    pivB.outer.position.set(xB + mpx * 0.6, baseB.y + yB - mpy * 0.6, -4.5);
    pivB.outer.scale.setScalar(scaleB * sB);
    pivB.tilt.rotation.set(rxB - (reduce ? 0 : mouse.sy * 0.05), 0, rzB - (reduce ? 0 : mouse.sx * 0.06));
    pivB.spin.rotation.y = ryB;

    // ── Contact shadows ───────────────────────────────────────────────
    sdwA.mesh.position.x = pivA.outer.position.x;
    sdwB.mesh.position.x = pivB.outer.position.x;
    sdwA.mat.uniforms.uOp.value = 0.85 * (1 - p * 0.55);
    sdwB.mat.uniforms.uOp.value = 0.50 * (1 - p * 0.60);

    // ── Embers ────────────────────────────────────────────────────────
    if (embers && !reduce) {
      const pos = embers.userData.pos;
      const vel = embers.userData.vel;
      const cx  = (pivA.outer.position.x + pivB.outer.position.x) * 0.5;
      for (let i = 0; i < N; i++) {
        pos[i * 3]     += vel[i].x;
        pos[i * 3 + 1] += vel[i].y;
        pos[i * 3 + 2] += vel[i].z;
        if (pos[i * 3 + 1] > 7) {
          pos[i * 3]     = cx + (Math.random() - 0.5) * 5;
          pos[i * 3 + 1] = -5.5 - Math.random() * 4;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
          vel[i].x = (Math.random() - 0.5) * 0.018;
          vel[i].y = 0.010 + Math.random() * 0.022;
        }
      }
      embers.geometry.attributes.position.array.set(pos);
      embers.geometry.attributes.position.needsUpdate = true;
      embers.material.opacity = 0.35 + b1 * 0.45;
      embers.position.x = cx * 0.3;
    }

    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
