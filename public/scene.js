// Kervan Heat — 3D chisel scroll scene
// Uses Three.js r160+ via ESM CDN. Sets up a fixed background canvas,
// loads kirici-uc.glb, animates it across scroll progress (0–1),
// with particle starfield, approaching rock, impact sparks and screen shake.

(async function() {
  const THREE  = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  const root = document.createElement('div');
  root.id = 'scene-root';
  root.style.cssText = `
    position: fixed; inset: 0; z-index: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at 50% 35%, #0B0D11 0%, #040506 60%, #000 100%);
  `;
  document.body.insertBefore(root, document.body.firstChild);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.04);

  const cam = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 200);
  cam.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  root.appendChild(renderer.domElement);

  // ─── Lighting ──────────────────────────────────────────────────────
  const hemi = new THREE.HemisphereLight(0xffffff, 0x101418, 0.5);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xfff0dc, 2.4);
  keyLight.position.set(5, 6, 4);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffa347, 2.0); // brand orange rim
  rimLight.position.set(-6, -2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x3a6dff, 1.2, 30);
  fillLight.position.set(-4, 3, 6);
  scene.add(fillLight);

  // ─── Starfield ─────────────────────────────────────────────────────
  const starCount = isMobile ? 800 : 1800;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starSize = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    const r = 40 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i*3+2] = r * Math.cos(phi);
    starSize[i] = Math.random() * 1.5 + 0.3;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSize, 1));

  const starMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.15, transparent: true, opacity: 0.8,
    sizeAttenuation: true, depthWrite: false
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ─── Forge embers (warm particles drifting upward) ─────────────────
  const emberCount = isMobile ? 200 : 500;
  const emberGeo = new THREE.BufferGeometry();
  const emberPos = new Float32Array(emberCount * 3);
  const emberVel = new Float32Array(emberCount * 3);
  for (let i = 0; i < emberCount; i++) {
    emberPos[i*3]   = (Math.random() - 0.5) * 30;
    emberPos[i*3+1] = (Math.random() - 0.5) * 20 - 5;
    emberPos[i*3+2] = (Math.random() - 0.5) * 20 - 5;
    emberVel[i*3]   = (Math.random() - 0.5) * 0.002;
    emberVel[i*3+1] = 0.004 + Math.random() * 0.008;
    emberVel[i*3+2] = (Math.random() - 0.5) * 0.002;
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const emberMat = new THREE.PointsMaterial({
    color: 0xff7a1a, size: 0.08, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const embers = new THREE.Points(emberGeo, emberMat);
  scene.add(embers);

  // ─── Chisel (loaded from GLB, with fallback) ───────────────────────
  const chiselGroup = new THREE.Group();
  scene.add(chiselGroup);

  function buildFallbackChisel() {
    const group = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({
      color: 0x6a7280, metalness: 0.92, roughness: 0.28
    });
    // cylindrical shank
    const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.2, 32), steel);
    shank.position.y = 0.4;
    group.add(shank);
    // tapered mid
    const taper = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.22, 0.8, 32), steel);
    taper.position.y = -1.6;
    group.add(taper);
    // chisel tip (4-sided pyramid-like cone)
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 4), steel);
    tip.position.y = -2.45;
    tip.rotation.y = Math.PI / 4;
    group.add(tip);
    // top flange
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 32), steel);
    flange.position.y = 2.1;
    group.add(flange);
    return group;
  }

  const loader = new GLTFLoader();
  let chiselLoaded = false;
  loader.load(
    'kirici-uc.glb',
    (gltf) => {
      const model = gltf.scene;
      // Normalize scale so it fits ~3 units tall
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 3.2 / maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      // Upgrade materials to PBR steel
      model.traverse((o) => {
        if (o.isMesh) {
          o.material = new THREE.MeshStandardMaterial({
            color: 0x7a828d, metalness: 0.9, roughness: 0.32
          });
          o.castShadow = true;
        }
      });
      chiselGroup.add(model);
      chiselLoaded = true;
    },
    undefined,
    (err) => {
      console.warn('[scene] GLB failed, using fallback', err);
      chiselGroup.add(buildFallbackChisel());
      chiselLoaded = true;
    }
  );
  // If loader is slow or blocked, show fallback after 2.5s
  setTimeout(() => {
    if (!chiselLoaded) {
      chiselGroup.add(buildFallbackChisel());
      chiselLoaded = true;
    }
  }, 2500);

  // ─── Rock target (appears late) ────────────────────────────────────
  const rockGeo = new THREE.IcosahedronGeometry(2.2, 1);
  // Displace vertices for rocky irregular surface
  const rockPos = rockGeo.attributes.position;
  for (let i = 0; i < rockPos.count; i++) {
    const x = rockPos.getX(i), y = rockPos.getY(i), z = rockPos.getZ(i);
    const n = 0.35 * (Math.sin(x*3.7) + Math.cos(y*4.1) + Math.sin(z*3.3));
    rockPos.setXYZ(i, x + n*0.12, y + n*0.12, z + n*0.12);
  }
  rockGeo.computeVertexNormals();
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x2d2a26, metalness: 0.1, roughness: 0.95, flatShading: true
  });
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.position.set(0, -4, -8);
  rock.visible = false;
  scene.add(rock);

  // ─── Spark burst particles (fires on impact) ───────────────────────
  const sparkCount = 400;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(sparkCount * 3);
  const sparkVel = new Float32Array(sparkCount * 3);
  const sparkLife = new Float32Array(sparkCount);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    color: 0xffc050, size: 0.14, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  sparks.visible = false;
  scene.add(sparks);

  function igniteSparks(origin) {
    sparks.visible = true;
    sparkMat.opacity = 1.0;
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i*3]   = origin.x;
      sparkPos[i*3+1] = origin.y;
      sparkPos[i*3+2] = origin.z;
      const a = Math.random() * Math.PI * 2;
      const p = Math.acos(2*Math.random() - 1);
      const s = 0.15 + Math.random() * 0.35;
      sparkVel[i*3]   = Math.sin(p)*Math.cos(a) * s;
      sparkVel[i*3+1] = Math.abs(Math.sin(p)*Math.sin(a)) * s + 0.05;
      sparkVel[i*3+2] = Math.cos(p) * s;
      sparkLife[i] = 1.0;
    }
    sparkGeo.attributes.position.needsUpdate = true;
  }

  // ─── Scroll progress tracking ──────────────────────────────────────
  let scrollProgress = 0;
  let targetProgress = 0;
  function updateProgress() {
    const h = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    targetProgress = Math.min(1, Math.max(0, window.scrollY / h));
  }
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });

  // ─── Impact state machine ──────────────────────────────────────────
  let impactTriggered = false;
  let impactTime = 0;
  let shakeAmount = 0;

  // ─── Resize ────────────────────────────────────────────────────────
  function onResize() {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // ─── Main loop ─────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t  = clock.elapsedTime;

    // Smoothly interpolate scrollProgress
    scrollProgress += (targetProgress - scrollProgress) * 0.08;
    const p = scrollProgress;

    // Stars slow rotate
    stars.rotation.y = t * 0.008;
    stars.rotation.x = t * 0.004;

    // Embers drift upward, wrap
    for (let i = 0; i < emberCount; i++) {
      emberPos[i*3]   += emberVel[i*3];
      emberPos[i*3+1] += emberVel[i*3+1];
      emberPos[i*3+2] += emberVel[i*3+2];
      if (emberPos[i*3+1] > 10) {
        emberPos[i*3]   = (Math.random() - 0.5) * 30;
        emberPos[i*3+1] = -10;
        emberPos[i*3+2] = (Math.random() - 0.5) * 20 - 5;
      }
    }
    emberGeo.attributes.position.needsUpdate = true;

    // ─── Chisel choreography by scroll progress ────────────────────
    if (chiselLoaded) {
      // Base: slow idle rotation
      chiselGroup.rotation.y = t * 0.25 + p * Math.PI * 2;

      // Position: keep visible slightly right on desktop, centered on mobile
      const hero     = [0, 0, 0];        // 0%
      const close    = [0.5, 0.2, 2.5];  // 25% — closer
      const profile  = [-0.3, 0, 0];     // 50% — back
      const approach = [0, -1.5, 3.8];   // 75% — moving toward rock
      const impact   = [0, -2.8, 5.2];   // 95% — hitting rock

      let px, py, pz, rx, rz, tilt;
      if (p < 0.25) {
        const k = p / 0.25;
        px = lerp(hero[0], close[0], ease(k));
        py = lerp(hero[1], close[1], ease(k));
        pz = lerp(hero[2], close[2], ease(k));
        tilt = lerp(0.1, 0.25, k);
      } else if (p < 0.5) {
        const k = (p - 0.25) / 0.25;
        px = lerp(close[0], profile[0], ease(k));
        py = lerp(close[1], profile[1], ease(k));
        pz = lerp(close[2], profile[2], ease(k));
        tilt = lerp(0.25, 0, k);
      } else if (p < 0.75) {
        const k = (p - 0.5) / 0.25;
        px = lerp(profile[0], approach[0], ease(k));
        py = lerp(profile[1], approach[1], ease(k));
        pz = lerp(profile[2], approach[2], ease(k));
        tilt = lerp(0, -0.35, k);
      } else {
        const k = (p - 0.75) / 0.25;
        px = lerp(approach[0], impact[0], ease(k));
        py = lerp(approach[1], impact[1], ease(k));
        pz = lerp(approach[2], impact[2], ease(k));
        tilt = lerp(-0.35, -0.5, k);
      }

      chiselGroup.position.set(px, py, pz);
      chiselGroup.rotation.x = tilt + Math.sin(t * 0.4) * 0.03;

      // Slight breathing scale to feel alive
      const s = 1 + Math.sin(t * 0.8) * 0.015;
      chiselGroup.scale.set(s, s, s);
    }

    // ─── Rock + impact ─────────────────────────────────────────────
    if (p > 0.65) {
      rock.visible = true;
      const rp = (p - 0.65) / 0.35; // 0→1
      rock.position.set(0, -3.5 + rp*0.4, -4 + rp*7); // rises and comes forward
      rock.rotation.y = t * 0.15;
      rock.rotation.x = t * 0.08;

      if (p > 0.92 && !impactTriggered) {
        impactTriggered = true;
        impactTime = t;
        shakeAmount = 0.35;
        const origin = new THREE.Vector3(0, -2.4, 3.2);
        igniteSparks(origin);
      }
    } else {
      rock.visible = false;
      if (impactTriggered && p < 0.8) {
        // scroll back up — reset so it can fire again
        impactTriggered = false;
        sparks.visible = false;
      }
    }

    // Spark physics
    if (sparks.visible) {
      for (let i = 0; i < sparkCount; i++) {
        if (sparkLife[i] > 0) {
          sparkPos[i*3]   += sparkVel[i*3];
          sparkPos[i*3+1] += sparkVel[i*3+1];
          sparkPos[i*3+2] += sparkVel[i*3+2];
          sparkVel[i*3+1] -= 0.008; // gravity
          sparkVel[i*3]   *= 0.985;
          sparkVel[i*3+2] *= 0.985;
          sparkLife[i]    -= 0.012;
        }
      }
      sparkGeo.attributes.position.needsUpdate = true;
      sparkMat.opacity = Math.max(0, sparkMat.opacity - 0.006);
      if (sparkMat.opacity < 0.02) sparks.visible = false;
    }

    // Screen shake decays
    if (shakeAmount > 0.001) {
      shakeAmount *= 0.92;
      cam.position.x = (Math.random() - 0.5) * shakeAmount;
      cam.position.y = (Math.random() - 0.5) * shakeAmount * 0.6;
    } else {
      cam.position.x = 0;
      cam.position.y = 0;
    }

    // Camera z follows progress slightly (pulls back at hero, pushes in on close)
    const camZ = 8 - 1.5 * ease(Math.min(1, p * 1.4));
    cam.position.z = camZ;
    cam.lookAt(0, 0, 0);

    // Brand rim light pulse
    rimLight.intensity = 2.0 + Math.sin(t * 1.5) * 0.3;

    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }

  function lerp(a, b, k) { return a + (b - a) * k; }
  function ease(k) { return k < 0.5 ? 2*k*k : 1 - Math.pow(-2*k+2, 2)/2; }

  if (reduce) {
    // For reduced motion: static single frame at p=0
    renderer.render(scene, cam);
  } else {
    tick();
  }
})();
