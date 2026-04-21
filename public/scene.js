// Kervan Heat — Scene v3: Forge → Chisel → Exploded → Assemble → Impact
// A narrative-driven 3D scene that follows Kervan's production story:
//   0-15%   Raw steel billet floating in darkness (cold start)
//   15-35%  Billet enters forge — material glows red → orange → white-hot
//   35-55%  Hot billet morphs into chisel form, cools to steel grey
//   55-75%  Chisel explodes into its component parts (shank, retainer, tip, rings)
//   75-90%  Parts rush back toward center, assemble into a single chisel
//   90-100% Assembled chisel strikes rock — sparks, shake, fade to impact

(async function() {
  const THREE = await import('three');

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  // ─── Root ──────────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'scene-root';
  root.style.cssText = `
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background: #0A0B0F;
    transition: background 0.3s linear;
  `;
  document.body.insertBefore(root, document.body.firstChild);

  // Stage progress overlay (subtle chapter indicator in top-right of scene)
  const stageHUD = document.createElement('div');
  stageHUD.id = 'scene-hud';
  stageHUD.style.cssText = `
    position: fixed; top: 88px; right: 28px; z-index: 3;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 10px; letter-spacing: .22em; text-transform: uppercase;
    color: rgba(255,255,255,.38);
    text-align: right; pointer-events: none;
    transition: color .4s;
    line-height: 1.5;
  `;
  stageHUD.innerHTML = `<div id="hud-label">Raw Steel</div><div id="hud-temp" style="color:rgba(232,120,26,.7);font-size:9px;margin-top:2px;">+22°C</div>`;
  document.body.appendChild(stageHUD);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.028);

  const cam = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 200);
  cam.position.set(0, 0, 11);

  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  root.appendChild(renderer.domElement);

  // ─── Lighting ──────────────────────────────────────────────────────
  const hemi = new THREE.HemisphereLight(0xa0b8d0, 0x080a0e, 0.3);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xffe8cc, 2.4);
  keyLight.position.set(6, 8, 5);
  scene.add(keyLight);

  // Forge light — this one intensity-modulates with the heat stage
  const forgeLight = new THREE.PointLight(0xff4020, 0, 25, 1.4);
  forgeLight.position.set(0, 0, 3);
  scene.add(forgeLight);

  const rimLight = new THREE.DirectionalLight(0xff8a2b, 1.8);
  rimLight.position.set(-7, -3, -2);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x3a6dff, 1.0, 30);
  fillLight.position.set(-5, 4, 6);
  scene.add(fillLight);

  // ─── Starfield (very subtle, brand feels industrial-cosmic) ────────
  const starCount = isMobile ? 400 : 1000;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 50 + Math.random() * 60;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2*Math.random() - 1);
    starPos[i*3]   = r * Math.sin(ph) * Math.cos(th);
    starPos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
    starPos[i*3+2] = r * Math.cos(ph);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.09, transparent: true, opacity: 0.4,
    sizeAttenuation: true, depthWrite: false
  }));
  scene.add(stars);

  // ─── Forge embers (warm rising particles, intensify during heat) ───
  const emberCount = isMobile ? 180 : 450;
  const emberGeo = new THREE.BufferGeometry();
  const emberPos = new Float32Array(emberCount * 3);
  const emberVel = new Float32Array(emberCount * 3);
  for (let i = 0; i < emberCount; i++) {
    emberPos[i*3]   = (Math.random() - 0.5) * 22;
    emberPos[i*3+1] = (Math.random() - 0.5) * 18 - 4;
    emberPos[i*3+2] = (Math.random() - 0.5) * 14 - 2;
    emberVel[i*3]   = (Math.random() - 0.5) * 0.003;
    emberVel[i*3+1] = 0.004 + Math.random() * 0.008;
    emberVel[i*3+2] = (Math.random() - 0.5) * 0.003;
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const emberMat = new THREE.PointsMaterial({
    color: 0xff7a1a, size: 0.08, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const embers = new THREE.Points(emberGeo, emberMat);
  scene.add(embers);

  // ─── Heat shimmer rings (around hot material) ──────────────────────
  const heatRingCount = 3;
  const heatRings = [];
  for (let i = 0; i < heatRingCount; i++) {
    const g = new THREE.RingGeometry(1.2 + i*0.35, 1.25 + i*0.35, 64);
    const m = new THREE.MeshBasicMaterial({
      color: 0xff5020, transparent: true, opacity: 0, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const r = new THREE.Mesh(g, m);
    r.rotation.x = Math.PI / 2;
    scene.add(r);
    heatRings.push(r);
  }

  // ─── The Hero Object: group that morphs across stages ──────────────
  // Single geometry that gets its material (emissive color) modulated for heat.
  // Parts are children so they can explode apart.

  const heroGroup = new THREE.Group();
  scene.add(heroGroup);

  // Create a custom "heat material" — MeshStandardMaterial with tunable emissive
  function heatMat(baseColor = 0x5a6270) {
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.92,
      roughness: 0.28,
      emissive: 0x000000,
      emissiveIntensity: 0
    });
  }

  // Billet form (stage 1): rough rectangular steel block
  // We build ALL parts now but use visibility + morphing for stages.

  const parts = {};

  // BILLET: round steel bar stock — this is how chisels actually start
  // Cylindrical bar with slightly chamfered ends (forge-cut)
  {
    const g = new THREE.CylinderGeometry(0.7, 0.7, 2.8, 48, 4);
    // Slight surface roughness on the ends for forged look
    const m = heatMat();
    const billet = new THREE.Mesh(g, m);
    heroGroup.add(billet);
    parts.billet = billet;
  }

  // CHISEL PARTS — used in explode/assemble (stage 4-6)
  // Each child carries a rest position (assembled) and an exploded offset.

  const steel = () => heatMat(0x5a6270);

  // Part 1: top head (impact cap)
  {
    const g = new THREE.CylinderGeometry(0.48, 0.48, 0.3, 40);
    const m = steel();
    const head = new THREE.Mesh(g, m);
    head.userData.rest = new THREE.Vector3(0, 2.0, 0);
    head.userData.expl = new THREE.Vector3(0, 4.5, 0);
    head.userData.rot  = new THREE.Euler(0, 0, 0);
    heroGroup.add(head);
    parts.head = head;
  }

  // Part 2: retainer ring A (upper groove ring)
  {
    const g = new THREE.TorusGeometry(0.46, 0.055, 20, 40);
    const m = heatMat(0x3a4250);
    const ringA = new THREE.Mesh(g, m);
    ringA.rotation.x = Math.PI / 2;
    ringA.userData.rest = new THREE.Vector3(0, 1.55, 0);
    ringA.userData.expl = new THREE.Vector3(-2.8, 2.3, 1.0);
    heroGroup.add(ringA);
    parts.ringA = ringA;
  }

  // Part 3: retainer ring B
  {
    const g = new THREE.TorusGeometry(0.46, 0.055, 20, 40);
    const m = heatMat(0x3a4250);
    const ringB = new THREE.Mesh(g, m);
    ringB.rotation.x = Math.PI / 2;
    ringB.userData.rest = new THREE.Vector3(0, 1.3, 0);
    ringB.userData.expl = new THREE.Vector3(2.8, 1.8, -1.2);
    heroGroup.add(ringB);
    parts.ringB = ringB;
  }

  // Part 4: main shank body
  {
    const g = new THREE.CylinderGeometry(0.44, 0.44, 2.8, 40);
    const m = steel();
    const shank = new THREE.Mesh(g, m);
    shank.userData.rest = new THREE.Vector3(0, 0.45, 0);
    shank.userData.expl = new THREE.Vector3(-3.5, -0.2, -0.6);
    heroGroup.add(shank);
    parts.shank = shank;
  }

  // Part 5: left retaining-pin flat (milled oval pocket where breaker retainer seats)
  // Positioned on upper shank, sits slightly proud to read as a distinct milled feature
  {
    const flatGroup = new THREE.Group();
    // Main pocket (darker inset face)
    const g = new THREE.BoxGeometry(0.12, 0.55, 0.32);
    const m = heatMat(0x2a303a);
    const flat = new THREE.Mesh(g, m);
    flatGroup.add(flat);
    // Top & bottom chamfer ridges — give pocket depth
    const rG = new THREE.BoxGeometry(0.14, 0.04, 0.34);
    const rM = heatMat(0x4a5260);
    const rTop = new THREE.Mesh(rG, rM);   rTop.position.y = 0.29;  flatGroup.add(rTop);
    const rBot = new THREE.Mesh(rG, rM);   rBot.position.y = -0.29; flatGroup.add(rBot);
    flatGroup.userData.rest = new THREE.Vector3(0.42, 1.05, 0);
    flatGroup.userData.expl = new THREE.Vector3(4.0, 1.6, 0.5);
    heroGroup.add(flatGroup);
    parts.flatL = flatGroup;
  }

  // Part 6: right retaining-pin flat (mirror of left)
  {
    const flatGroup = new THREE.Group();
    const g = new THREE.BoxGeometry(0.12, 0.55, 0.32);
    const m = heatMat(0x2a303a);
    const flat = new THREE.Mesh(g, m);
    flatGroup.add(flat);
    const rG = new THREE.BoxGeometry(0.14, 0.04, 0.34);
    const rM = heatMat(0x4a5260);
    const rTop = new THREE.Mesh(rG, rM);   rTop.position.y = 0.29;  flatGroup.add(rTop);
    const rBot = new THREE.Mesh(rG, rM);   rBot.position.y = -0.29; flatGroup.add(rBot);
    flatGroup.userData.rest = new THREE.Vector3(-0.42, 1.05, 0);
    flatGroup.userData.expl = new THREE.Vector3(-4.0, 1.6, -0.5);
    heroGroup.add(flatGroup);
    parts.flatR = flatGroup;
  }

  // Part 7: tapered neck
  {
    const g = new THREE.CylinderGeometry(0.44, 0.3, 0.9, 40);
    const m = steel();
    const neck = new THREE.Mesh(g, m);
    neck.userData.rest = new THREE.Vector3(0, -1.15, 0);
    neck.userData.expl = new THREE.Vector3(1.5, -2.8, 1.8);
    heroGroup.add(neck);
    parts.neck = neck;
  }

  // Part 8: chisel tip — moil point style (conical sharp point)
  // Upper cylinder blends into a conical taper ending in a sharp point
  {
    const tipGroup = new THREE.Group();

    // Upper cylindrical collar — blends with shank above
    const collarG = new THREE.CylinderGeometry(0.42, 0.38, 0.35, 40);
    const collar = new THREE.Mesh(collarG, heatMat(0x4a5260));
    collar.position.y = 0.55;
    tipGroup.add(collar);

    // Main conical taper — this is the business end
    const coneG = new THREE.CylinderGeometry(0.38, 0.04, 1.4, 40, 1);
    const cone = new THREE.Mesh(coneG, heatMat(0x4a5260));
    cone.position.y = -0.32;
    tipGroup.add(cone);

    // Very sharp tip cap
    const pointG = new THREE.ConeGeometry(0.04, 0.15, 20);
    const point = new THREE.Mesh(pointG, heatMat(0x2a2f38));
    point.position.y = -1.1;
    tipGroup.add(point);

    tipGroup.userData.rest = new THREE.Vector3(0, -1.55, 0);
    tipGroup.userData.expl = new THREE.Vector3(0, -4.5, 2.5);
    tipGroup.userData.rotExpl = new THREE.Euler(0.6, 0.4, 0.3);
    heroGroup.add(tipGroup);
    parts.tip = tipGroup;
  }

  // Start: billet visible, chisel parts hidden (at rest position)
  for (const key in parts) {
    const p = parts[key];
    if (key !== 'billet') {
      p.visible = false;
      if (p.userData.rest) p.position.copy(p.userData.rest);
    }
  }

  // ─── Rock target (shows during impact) ─────────────────────────────
  const rockGeo = new THREE.IcosahedronGeometry(2.6, 1);
  const rpos = rockGeo.attributes.position;
  for (let i = 0; i < rpos.count; i++) {
    const x = rpos.getX(i), y = rpos.getY(i), z = rpos.getZ(i);
    const n = Math.sin(x*3.7) + Math.cos(y*4.1) + Math.sin(z*3.3);
    rpos.setXYZ(i, x + n*0.14, y + n*0.14, z + n*0.14);
  }
  rockGeo.computeVertexNormals();
  const rock = new THREE.Mesh(rockGeo, new THREE.MeshStandardMaterial({
    color: 0x2a2622, metalness: 0.04, roughness: 0.98, flatShading: true
  }));
  rock.position.set(0, -5, -10);
  rock.visible = false;
  scene.add(rock);

  // ─── Sparks ────────────────────────────────────────────────────────
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

  function igniteSparks(origin, count = sparkCount) {
    sparks.visible = true;
    sparkMat.opacity = 1.0;
    for (let i = 0; i < count; i++) {
      sparkPos[i*3]   = origin.x;
      sparkPos[i*3+1] = origin.y;
      sparkPos[i*3+2] = origin.z;
      const a = Math.random() * Math.PI * 2;
      const p = Math.acos(2*Math.random() - 1);
      const s = 0.2 + Math.random() * 0.45;
      sparkVel[i*3]   = Math.sin(p) * Math.cos(a) * s;
      sparkVel[i*3+1] = Math.abs(Math.sin(p) * Math.sin(a)) * s + 0.07;
      sparkVel[i*3+2] = Math.cos(p) * s;
      sparkLife[i] = 1.0;
    }
    sparkGeo.attributes.position.needsUpdate = true;
  }

  // ─── Scroll ────────────────────────────────────────────────────────
  let scrollProgress = 0, targetProgress = 0;
  function updateProgress() {
    const h = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    targetProgress = Math.min(1, Math.max(0, scrollY / h));
  }
  updateProgress();
  addEventListener('scroll', updateProgress, { passive: true });

  // ─── Resize ────────────────────────────────────────────────────────
  addEventListener('resize', () => {
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // ─── Helpers ───────────────────────────────────────────────────────
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (v, lo=0, hi=1) => Math.max(lo, Math.min(hi, v));
  const smooth = k => { k = clamp(k); return k*k*(3 - 2*k); };
  const ease = k => { k = clamp(k); return k < 0.5 ? 2*k*k : 1 - Math.pow(-2*k+2, 2)/2; };

  // Heat color progression: based on steel temperature (K)
  // cold dark → 400°C dull red → 700°C cherry → 950°C orange → 1200°C white-hot
  function heatColor(tempK) {
    // tempK: 0..1 where 0 = cold, 1 = white-hot
    const stops = [
      { t: 0.0,  c: [0x00, 0x00, 0x00] },   // no glow
      { t: 0.35, c: [0x30, 0x05, 0x00] },   // dark dull red
      { t: 0.55, c: [0xa0, 0x18, 0x00] },   // cherry red
      { t: 0.75, c: [0xff, 0x60, 0x10] },   // orange
      { t: 0.90, c: [0xff, 0xb0, 0x50] },   // yellow-white
      { t: 1.00, c: [0xff, 0xf0, 0xd0] },   // near white
    ];
    let a = stops[0], b = stops[1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (tempK >= stops[i].t && tempK <= stops[i+1].t) { a = stops[i]; b = stops[i+1]; break; }
      if (tempK > stops[stops.length-1].t) { a = stops[stops.length-2]; b = stops[stops.length-1]; }
    }
    const k = b.t === a.t ? 0 : (tempK - a.t) / (b.t - a.t);
    return {
      r: Math.round(lerp(a.c[0], b.c[0], k)),
      g: Math.round(lerp(a.c[1], b.c[1], k)),
      b: Math.round(lerp(a.c[2], b.c[2], k)),
    };
  }

  function setHeroHeat(tempK) {
    // Apply emissive color + intensity to every heat-sensitive part
    const col = heatColor(tempK);
    const hexColor = (col.r << 16) | (col.g << 8) | col.b;
    const intensity = tempK * 1.8; // emissive strength

    // Base color also cools from glowing to steel grey
    const baseSteel = { r: 0x5a, g: 0x62, b: 0x70 };
    const hotSteel  = col;
    // When cold, show true base color; when hot, tint toward emissive
    const mix = tempK;
    const shownBase = {
      r: Math.round(lerp(baseSteel.r, hotSteel.r, mix * 0.7)),
      g: Math.round(lerp(baseSteel.g, hotSteel.g, mix * 0.7)),
      b: Math.round(lerp(baseSteel.b, hotSteel.b, mix * 0.7)),
    };
    const baseHex = (shownBase.r << 16) | (shownBase.g << 8) | shownBase.b;

    heroGroup.traverse(o => {
      if (o.isMesh && o.material && o.material.emissive) {
        o.material.emissive.setHex(hexColor);
        o.material.emissiveIntensity = intensity;
        o.material.color.setHex(baseHex);
      }
    });

    // Forge point light intensifies with heat
    forgeLight.intensity = tempK * 4.0;
    forgeLight.color.setHex(hexColor);

    // Heat rings glow
    for (let i = 0; i < heatRings.length; i++) {
      const r = heatRings[i];
      r.material.opacity = tempK * 0.35 * (1 - i*0.25);
      r.material.color.setHex(hexColor);
      const scale = 1 + tempK * (0.3 + i*0.2);
      r.scale.set(scale, scale, 1);
    }

    // Embers opacity
    emberMat.opacity = 0.2 + tempK * 0.6;
  }

  // ─── Stage progression logic ───────────────────────────────────────
  // Each stage has a [start, end) and a function that sets the scene state.
  // We interpolate p within each stage for smooth transitions.

  const hudLabel = document.getElementById('hud-label');
  const hudTemp  = document.getElementById('hud-temp');

  function setHUD(label, temp) {
    if (hudLabel) hudLabel.textContent = label;
    if (hudTemp)  hudTemp.textContent  = temp;
  }

  function updateStage(p, t) {
    // Clear all parts visibility first, then selectively show
    const showPart = (name, visible) => { if (parts[name]) parts[name].visible = visible; };

    // Camera keyframes per stage — designed so the chisel is always visible
    // and well-framed at each narrative beat.
    // [camX, camY, camZ, lookAtX, lookAtY, lookAtZ]
    const camKFs = [
      { p: 0.00, v: [ 1.5,  0.3, 10, 0, 0, 0] },  // billet: 3/4 view from right
      { p: 0.15, v: [ 2.0,  0.8,  9, 0, 0.3, 0] }, // heating: tighter, from above-right
      { p: 0.35, v: [ 2.5,  0.0,  8, 0, 0, 0] },  // morphing: even closer
      { p: 0.55, v: [ 0.0,  1.5,  7, 0, 0, 0] },  // post-forge: top-down hint
      { p: 0.72, v: [ 3.5,  2.0, 11, 0, 0, 0] },  // explosion: pull way back, see spread
      { p: 0.88, v: [ 2.0, -0.5,  9, 0,-0.5, 1] }, // assemble: down-right, follows reassembly
      { p: 0.95, v: [ 1.0, -1.5,  7, 0,-2, 3] },  // strike: low, behind chisel
      { p: 1.00, v: [ 0.5, -2.0,  6, 0,-3, 4] },  // impact: very close to impact point
    ];

    // Interpolate camera position
    let ca = camKFs[0], cb = camKFs[1];
    for (let i = 0; i < camKFs.length - 1; i++) {
      if (p >= camKFs[i].p && p <= camKFs[i+1].p) { ca = camKFs[i]; cb = camKFs[i+1]; break; }
      if (p > camKFs[camKFs.length-1].p) { ca = camKFs[camKFs.length-2]; cb = camKFs[camKFs.length-1]; }
    }
    const ck = cb.p === ca.p ? 0 : (p - ca.p) / (cb.p - ca.p);
    const cke = ease(ck);
    const baseCamX = lerp(ca.v[0], cb.v[0], cke);
    const baseCamY = lerp(ca.v[1], cb.v[1], cke);
    const baseCamZ = lerp(ca.v[2], cb.v[2], cke);
    const lookX    = lerp(ca.v[3], cb.v[3], cke);
    const lookY    = lerp(ca.v[4], cb.v[4], cke);
    const lookZ    = lerp(ca.v[5], cb.v[5], cke);
    // Subtle parallax wobble
    const wobble = Math.sin(t * 0.25) * 0.08;
    cam.userData.baseX = baseCamX + wobble;
    cam.userData.baseY = baseCamY;
    cam.userData.baseZ = baseCamZ;
    cam.userData.lookX = lookX;
    cam.userData.lookY = lookY;
    cam.userData.lookZ = lookZ;

    if (p < 0.15) {
      // STAGE 1: Billet — already HOT and BIG (Kervan's forge never sleeps)
      const k = p / 0.15;
      setHUD('Forge · Heated Billet', `+${Math.round(1080 + Math.sin(t*2)*30)}°C`);
      for (const key in parts) showPart(key, key === 'billet');
      // Start hot — temp 0.85 (orange-yellow)
      const tempK = 0.85 + Math.sin(t * 1.8) * 0.05;
      setHeroHeat(tempK);
      heroGroup.rotation.y = t * 0.18;
      heroGroup.rotation.x = Math.sin(t * 0.3) * 0.08;
      heroGroup.position.set(0, 0, 0);
      // BIG billet — 1.4x scale
      const pulse = 1 + Math.sin(t * 2.2) * 0.015;
      parts.billet.scale.set(1.4 * pulse, 1.4 * pulse, 1.4 * pulse);
    }
    else if (p < 0.35) {
      // STAGE 2: Billet peaks then starts cooling as it shapes
      const k = (p - 0.15) / 0.20;
      const kk = smooth(k);
      // Peaks at k=0.3 (white-hot), then cools toward 0.6
      const tempK = kk < 0.3 ? lerp(0.85, 1.0, kk / 0.3) : lerp(1.0, 0.7, (kk - 0.3) / 0.7);
      const tempC = Math.round(1080 + tempK * 200);
      if (kk < 0.3)      setHUD('Austenitizing · Peak', `+${tempC}°C`);
      else if (kk < 0.7) setHUD('White Hot · Forging', `+${tempC}°C`);
      else               setHUD('Shaping · Cooling', `+${tempC}°C`);
      for (const key in parts) showPart(key, key === 'billet');
      setHeroHeat(tempK);
      heroGroup.rotation.y = t * 0.35;
      heroGroup.rotation.x = Math.sin(t * 0.5) * 0.1;
      heroGroup.position.set(0, 0, 0);
      const pulse = 1 + Math.sin(t * 2.5) * 0.02 * tempK;
      // Billet stays big, starts to compress slightly
      const sc = lerp(1.4, 1.2, kk) * pulse;
      parts.billet.scale.set(sc, sc, sc);
    }
    else if (p < 0.55) {
      // STAGE 3: Morph billet → chisel, still warm
      const k = (p - 0.35) / 0.20;
      const kk = smooth(k);
      const tempK = lerp(0.7, 0.2, kk);
      setHUD('Forging · Shaping', `+${Math.round(850 - kk * 700)}°C`);

      const billetScale = lerp(1.2, 0.05, kk);
      parts.billet.scale.set(billetScale, billetScale, billetScale);
      parts.billet.visible = kk < 0.9;

      const chiselParts = ['head','ringA','ringB','shank','flatL','flatR','neck','tip'];
      for (const name of chiselParts) {
        const pt = parts[name];
        pt.visible = kk > 0.15;
        pt.position.copy(pt.userData.rest);
        pt.scale.setScalar(kk * 1.1); // slightly larger than before
      }

      setHeroHeat(tempK);
      heroGroup.rotation.y = t * 0.3 + kk * Math.PI * 0.5;
      heroGroup.rotation.x = lerp(Math.sin(t * 0.5) * 0.1, 0.1, kk);
      heroGroup.position.set(0, 0, 0);
    }
    else if (p < 0.72) {
      // STAGE 4: Cool + EXPLODE outward
      const k = (p - 0.55) / 0.17;
      const kk = ease(k);
      const tempK = Math.max(0, 0.2 - kk * 0.2);
      setHUD(kk < 0.4 ? 'Quench · Temper' : 'Exploded View', kk < 0.4 ? `+${Math.round(200 - kk*400)}°C` : '42CrMo · HRC 48–52');

      parts.billet.visible = false;
      const chiselParts = ['head','ringA','ringB','shank','flatL','flatR','neck','tip'];
      for (const name of chiselParts) {
        const pt = parts[name];
        pt.visible = true;
        pt.scale.setScalar(1.1);
        const rest = pt.userData.rest;
        const expl = pt.userData.expl;
        pt.position.set(
          lerp(rest.x, expl.x, kk),
          lerp(rest.y, expl.y, kk),
          lerp(rest.z, expl.z, kk),
        );
        if (name === 'tip') pt.rotation.z = kk * 0.3 + Math.sin(t) * 0.05 * kk;
        else if (name === 'neck') pt.rotation.z = kk * 0.4;
        else if (name === 'flatL') pt.rotation.y = kk * 0.6;
        else if (name === 'flatR') pt.rotation.y = -kk * 0.6;
        else if (name === 'ringA') pt.rotation.y = t * 0.5;
        else if (name === 'ringB') pt.rotation.y = -t * 0.5;
      }
      setHeroHeat(tempK);
      heroGroup.rotation.y = t * 0.2 + kk * 0.3;
      heroGroup.rotation.x = -kk * 0.15;
      heroGroup.position.set(0, 0, 0);
    }
    else if (p < 0.90) {
      // STAGE 5: Parts RUSH back
      const k = (p - 0.72) / 0.18;
      const kk = ease(k);
      const assembleK = kk;
      setHUD('Assembly · Final', 'Ready');

      parts.billet.visible = false;
      const chiselParts = ['head','ringA','ringB','shank','flatL','flatR','neck','tip'];
      for (const name of chiselParts) {
        const pt = parts[name];
        pt.visible = true;
        pt.scale.setScalar(1.1);
        const rest = pt.userData.rest;
        const expl = pt.userData.expl;
        pt.position.set(
          lerp(expl.x, rest.x, assembleK),
          lerp(expl.y, rest.y, assembleK),
          lerp(expl.z, rest.z, assembleK),
        );
        if (name === 'tip')   pt.rotation.z = (1 - assembleK) * 0.3;
        if (name === 'neck')  pt.rotation.z = (1 - assembleK) * 0.4;
        if (name === 'flatL') pt.rotation.y = (1 - assembleK) * 0.6;
        if (name === 'flatR') pt.rotation.y = -(1 - assembleK) * 0.6;
        if (name === 'ringA' || name === 'ringB') pt.rotation.y = 0;
      }
      setHeroHeat(0);
      heroGroup.rotation.y = t * 0.2 + assembleK * Math.PI * 0.3;
      heroGroup.rotation.x = -0.15 + assembleK * 0.05;
      heroGroup.position.set(0, assembleK * -0.3, assembleK * 1.5);
    }
    else {
      // STAGE 6: IMPACT
      const k = (p - 0.90) / 0.10;
      const kk = ease(k);
      setHUD('Strike · Impact', '~4.8 Hz');

      parts.billet.visible = false;
      const chiselParts = ['head','ringA','ringB','shank','flatL','flatR','neck','tip'];
      for (const name of chiselParts) {
        const pt = parts[name];
        pt.visible = true;
        pt.scale.setScalar(1.1);
        pt.position.copy(pt.userData.rest);
      }
      parts.tip.rotation.z = 0;
      parts.neck.rotation.z = 0;
      parts.flatL.rotation.y = 0;
      parts.flatR.rotation.y = 0;
      parts.ringA.rotation.y = 0;
      parts.ringB.rotation.y = 0;

      setHeroHeat(0);
      heroGroup.rotation.y = t * 0.15;
      heroGroup.rotation.x = -0.5 + kk * 0.1;
      heroGroup.position.set(0, -0.3 - kk * 1.8, 1.5 + kk * 3.5);
    }
  }

  // ─── Impact trigger (separate from stage visuals) ──────────────────
  let impactTriggered = false;
  let shakeAmount = 0;

  // ─── Main loop ─────────────────────────────────────────────────────
  const clock = new THREE.Clock();

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    scrollProgress += (targetProgress - scrollProgress) * 0.085;
    const p = scrollProgress;

    // ─── Dynamic background: white at top → black at bottom ────────
    // Keep it bright early so the white hero section flows into the scene,
    // then fade to black through the forge sequence.
    // 0.00-0.12:  pure white (hero)
    // 0.12-0.25:  white → warm orange (forge arrival)
    // 0.25-0.55:  orange → deep ember red
    // 0.55-1.00:  ember → black (cooling, strike)
    let bgColor;
    if (p < 0.12) {
      bgColor = '#ffffff';
    } else if (p < 0.25) {
      const k = (p - 0.12) / 0.13;
      // white → warm cream → amber
      const r = Math.round(lerp(255, 255, k));
      const g = Math.round(lerp(255, 200, k));
      const b = Math.round(lerp(255, 140, k));
      bgColor = `rgb(${r},${g},${b})`;
    } else if (p < 0.55) {
      const k = (p - 0.25) / 0.30;
      // amber → deep ember
      const r = Math.round(lerp(255, 90, k));
      const g = Math.round(lerp(200, 30, k));
      const b = Math.round(lerp(140, 20, k));
      bgColor = `rgb(${r},${g},${b})`;
    } else {
      const k = (p - 0.55) / 0.45;
      // ember → near black
      const r = Math.round(lerp(90, 10, k));
      const g = Math.round(lerp(30, 11, k));
      const b = Math.round(lerp(20, 15, k));
      bgColor = `rgb(${r},${g},${b})`;
    }
    root.style.background = bgColor;

    // Toggle light theme for nav/scroll-hint when background is bright
    const shouldBeLight = p < 0.18;
    if (shouldBeLight && !document.body.classList.contains('scene-light')) {
      document.body.classList.add('scene-light');
    } else if (!shouldBeLight && document.body.classList.contains('scene-light')) {
      document.body.classList.remove('scene-light');
    }

    // Adjust fog color and hemispheric light to match background — keeps
    // the chisel grounded in the environment rather than floating awkwardly.
    if (p < 0.12) {
      scene.fog.color = new THREE.Color(0xffffff);
      scene.fog.density = 0.015;
      hemi.intensity = 1.2;
      hemi.color.setHex(0xffffff);
    } else if (p < 0.55) {
      scene.fog.color = new THREE.Color(0x2a1408);
      scene.fog.density = 0.022;
      hemi.intensity = 0.5;
      hemi.color.setHex(0xff9a4a);
    } else {
      scene.fog.color = new THREE.Color(0x000000);
      scene.fog.density = 0.028;
      hemi.intensity = 0.3;
      hemi.color.setHex(0xa0b8d0);
    }

    // Starfield
    stars.rotation.y = t * 0.006;
    stars.rotation.x = t * 0.003;

    // Embers drift (intensity tied to heat stage)
    for (let i = 0; i < emberCount; i++) {
      emberPos[i*3]   += emberVel[i*3];
      emberPos[i*3+1] += emberVel[i*3+1];
      emberPos[i*3+2] += emberVel[i*3+2];
      if (emberPos[i*3+1] > 10) {
        emberPos[i*3]   = (Math.random() - 0.5) * 22;
        emberPos[i*3+1] = -10;
        emberPos[i*3+2] = (Math.random() - 0.5) * 14;
      }
    }
    emberGeo.attributes.position.needsUpdate = true;

    // Update stage
    updateStage(p, t);

    // Rock + impact
    if (p > 0.88) {
      rock.visible = true;
      const rp = (p - 0.88) / 0.12;
      rock.position.set(0, -4.5 + rp * 0.7, -6 + rp * 9);
      rock.rotation.y = t * 0.15;
      rock.rotation.x = t * 0.08;

      if (p > 0.95 && !impactTriggered) {
        impactTriggered = true;
        shakeAmount = 0.5;
        igniteSparks(new THREE.Vector3(0, -2.5, 4.5));
      }
    } else {
      rock.visible = false;
      if (impactTriggered && p < 0.85) {
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
          sparkVel[i*3+1] -= 0.009;
          sparkVel[i*3]   *= 0.985;
          sparkVel[i*3+2] *= 0.985;
          sparkLife[i]    -= 0.014;
        }
      }
      sparkGeo.attributes.position.needsUpdate = true;
      sparkMat.opacity = Math.max(0, sparkMat.opacity - 0.007);
      if (sparkMat.opacity < 0.02) sparks.visible = false;
    }

    // Screen shake
    if (shakeAmount > 0.001) {
      shakeAmount *= 0.88;
      cam.position.x = (cam.userData.baseX || 0) + (Math.random() - 0.5) * shakeAmount;
      cam.position.y = (cam.userData.baseY || 0) + (Math.random() - 0.5) * shakeAmount * 0.6;
      cam.position.z = cam.userData.baseZ || 10;
    } else {
      cam.position.x = cam.userData.baseX || 0;
      cam.position.y = cam.userData.baseY || 0;
      cam.position.z = cam.userData.baseZ || 10;
    }

    cam.lookAt(
      cam.userData.lookX || 0,
      cam.userData.lookY || 0,
      cam.userData.lookZ || 0,
    );

    // Pulsing rim light (softer during forge, stronger at impact)
    rimLight.intensity = 1.8 + Math.sin(t * 1.5) * 0.3 + (p > 0.9 ? 2 : 0);

    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }

  if (reduce) {
    renderer.render(scene, cam);
  } else {
    tick();
  }
})();
