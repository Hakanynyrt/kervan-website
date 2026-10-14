import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** "Isınıp soğuyan parça": one breaker moil tip that cools, as the visitor scrolls
 *  through its section, from just out of the furnace (bright orange-yellow, the
 *  point hottest) through cherry red and dull red to glossy black steel.
 *
 *  One uniform drives the look: `uTemp` 1 (hot) … 0 (cold) = 1 − smoothstep(0.05, 0.9, p),
 *  p = progress through the section. The heat is an emissive term added in the
 *  standard material's shader (blackbody colour ramp, axial gradient toward the
 *  point, fresnel edge boost, scale mottling); while hot, a dark oxide colour and
 *  a rough finish blend in, and fade into the black metal as it cools (no swap).
 *  No bloom, no sparks, no haze.
 *
 *  Drawing is on demand: every frame while the temperature / roll eases, ~30 fps
 *  for the idle drift, only while the section is on screen and the tab visible.
 *  Mounted client-side only (never in the prerender) and never under reduced
 *  motion (CoolingSection shows the poster then). No WebGL or a load error →
 *  `onFail` and the section shows the poster.
 */
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const deg = THREE.MathUtils.degToRad;

/** Model file (cached immutable: a changed model gets a new name). */
const MODEL_URL = '/models/isil-islem-uc-01.glb';

// Approved look (owner, option B, "en son metalik siyah").
const FOV_DEG = 22;
const CAM_D = 3;
const YAW = -30;
const PITCH = 14;
const TILT = 12;
/** Roll about the long axis over the whole section, plus the idle drift. */
const ROLL_START = -40;
const ROLL_SPAN = 150;
const DRIFT_DEG = 4;
const RIM_ANGLE = 140;
/** Shader units: the noise and the °C offsets were tuned on a 1250-unit-long tip. */
const SHADER_LEN = 1250;

const HEAT_GLSL = /* glsl */ `
uniform float uTemp; uniform vec3 uAx; uniform float uRmax; uniform float uGain; uniform float uUnit;
varying vec3 vObj;
float hash3(vec3 p){ p=fract(p*0.3183+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){ vec3 i=floor(x),f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z); }
// Local temperature (°C) at this fragment: the point runs hotter, thin sections
// hotter, grazing angles brighter (metal emissivity), uneven scale.
float localTempC(vec3 nV, vec3 vV){
  float s = clamp((vObj.y-uAx.x)/(uAx.y-uAx.x),0.0,1.0); if(uAx.z<0.0) s=1.0-s;
  float rad = length(vObj.xz)/uRmax;
  float fres = pow(1.0-clamp(abs(dot(nV,vV)),0.0,1.0),2.0);
  float axial = mix(-170.0, 0.0, smoothstep(0.0,1.0,s)) + 40.0*smoothstep(0.55,1.0,s);
  float thin = 45.0*(1.0-smoothstep(0.25,0.9,rad))*smoothstep(0.6,1.0,s);
  float mott = (vnoise(vObj*0.05)-0.5)*36.0 + (vnoise(vObj*0.2)-0.5)*14.0;
  return 500.0 + 500.0*uTemp + axial + thin + 55.0*fres + mott;
}
// Blackbody: linear-sRGB chroma and Wien-law luminance, perceptually compressed
// (1.0 at 1000 °C; below ~550 °C practically no visible glow).
vec3 blackbody(float c){
  float T = c + 273.15;
  float g = clamp(0.000218*(c-585.0),0.0,0.16);
  float L = exp(-12500.0*(1.0/T - 1.0/1273.15));
  return vec3(1.0, g, g*g*0.6) * L;
}`;

type Uniforms = {
  uTemp: { value: number };
  uAx: { value: THREE.Vector3 };
  uRmax: { value: number };
  uGain: { value: number };
  uUnit: { value: number };
};

function heatMaterial(params: THREE.MeshStandardMaterialParameters, U: Uniforms) {
  const m = new THREE.MeshStandardMaterial(params);
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uUnit;\nvarying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position * uUnit;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${HEAT_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float oxide = smoothstep(0.02, 0.25, uTemp);
        float sc = 0.85 + 0.3 * vnoise(vObj * 0.09);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.055, 0.05, 0.048) * sc, oxide);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.78, smoothstep(0.02, 0.25, uTemp));`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += blackbody(localTempC(normalize(normal), normalize(vViewPosition))) * uGain
          * smoothstep(0.0, 0.12, uTemp); // the last faint glow fades out: final = clean black steel`,
      );
  };
  return m;
}

interface Props {
  /** The tall scroll section: progress is read from its rect. */
  section: HTMLElement;
  /** The model has arrived and the first frame is drawn. */
  onReady?: () => void;
  /** No WebGL or the model failed to load: show the poster instead. */
  onFail?: () => void;
}

export default function CoolingScene({ section, onReady, onFail }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef({ onReady, onFail });
  cb.current = { onReady, onFail };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const container: HTMLDivElement = el;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      cb.current.onFail?.();
      return;
    }
    renderer.setClearAlpha(0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const DPR = Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1);
    const MAX_CSS = 1600; // keeps the drawing buffer sane on very large windows
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    let raf = 0;
    let dirty = true;
    let contextLost = false;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
      dirty = true;
      wake();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    // ─── Scene ───────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV_DEG, 1, 0.05, 50);
    camera.position.set(0, 0, CAM_D);
    camera.lookAt(0, 0, 0);
    const TAN = Math.tan(deg(FOV_DEG / 2));

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTex = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    scene.environment = envTex;

    const key = new THREE.DirectionalLight(0xfff1e0, 2.6);
    key.position.set(-3, 4, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fb4d0, 0.3);
    fill.position.set(4, 1, 2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff6a1a, 1.2);
    const ra = deg(RIM_ANGLE);
    rim.position.set(Math.cos(ra) * 3, 2.2, Math.sin(ra) * 3 - 2.5);
    scene.add(rim);
    const RIM_COLD = new THREE.Color(0xffd8bf);
    const RIM_HOT = new THREE.Color(0xff6a1a);

    const U: Uniforms = {
      uTemp: { value: 1 },
      uAx: { value: new THREE.Vector3(0, 1, 1) },
      uRmax: { value: 1 },
      uGain: { value: 1.6 },
      uUnit: { value: 1 },
    };
    // Cold state = glossy black metal (approved final preview).
    const bodyMat = heatMaterial({ color: 0x20232a, metalness: 0.85, roughness: 0.34 }, U);
    const machinedMat = heatMaterial({ color: 0x2c3038, metalness: 1, roughness: 0.24 }, U);

    // outer (pose: yaw, pitch, tilt, position, scale) > lay (long axis → X, point to +X)
    // > spin (roll about the long axis) > norm (centred, length 1) > model
    const outer = new THREE.Group();
    outer.rotation.order = 'YXZ';
    outer.rotation.set(deg(PITCH), deg(YAW), deg(TILT));
    const lay = new THREE.Group();
    const spin = new THREE.Group();
    const norm = new THREE.Group();
    spin.add(norm);
    lay.add(spin);
    outer.add(lay);
    outer.visible = false;
    scene.add(outer);

    // ─── Model ───────────────────────────────────────────────────────
    let disposed = false;
    let modelLoaded = false;
    const geoms: THREE.BufferGeometry[] = [];
    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        try {
          const model = gltf.scene;
          model.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            const mat = mesh.material as THREE.Material;
            const name = mat.name;
            mat.dispose();
            mesh.material = name === 'machined' ? machinedMat : bodyMat;
            geoms.push(mesh.geometry);
          });
          // Object-space axis (Y) from the decoded (dequantized) positions, and which
          // end is the point: the end with the smaller radius.
          let ymin = Infinity;
          let ymax = -Infinity;
          let rmax = 0;
          for (const g of geoms) {
            const p = g.getAttribute('position');
            for (let i = 0; i < p.count; i++) {
              const y = p.getY(i);
              ymin = Math.min(ymin, y);
              ymax = Math.max(ymax, y);
              rmax = Math.max(rmax, Math.hypot(p.getX(i), p.getZ(i)));
            }
          }
          const band = (ymax - ymin) * 0.04;
          let rLo = 0;
          let rHi = 0;
          for (const g of geoms) {
            const p = g.getAttribute('position');
            for (let i = 0; i < p.count; i++) {
              const y = p.getY(i);
              const rr = Math.hypot(p.getX(i), p.getZ(i));
              if (y < ymin + band) rLo = Math.max(rLo, rr);
              if (y > ymax - band) rHi = Math.max(rHi, rr);
            }
          }
          const tipAtMax = rHi < rLo;
          const unit = SHADER_LEN / Math.max(1e-6, ymax - ymin);
          U.uUnit.value = unit;
          U.uAx.value.set(ymin * unit, ymax * unit, tipAtMax ? 1 : -1);
          U.uRmax.value = rmax * unit;

          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);
          norm.add(model);
          norm.scale.setScalar(1 / Math.max(1e-6, size.y));
          lay.rotation.z = ((tipAtMax ? -1 : 1) * Math.PI) / 2;
          outer.visible = true;
          modelLoaded = true;
          dirty = true;
          wake();
        } catch (err) {
          console.error('[cooling] model setup failed', err);
          cb.current.onFail?.();
        }
      },
      undefined,
      (err) => {
        console.warn('[cooling] GLB load failed, poster stays', err);
        cb.current.onFail?.();
      },
    );

    // ─── Size ────────────────────────────────────────────────────────
    let vw = 1;
    let vh = 1;
    const resize = () => {
      const W = Math.min(MAX_CSS, container.clientWidth);
      const H = Math.min(MAX_CSS, container.clientHeight);
      if (W <= 0 || H <= 0) return;
      vw = W;
      vh = H;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(DPR);
      renderer.setSize(W, H, false);
      dirty = true;
      wake();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ─── Visibility ──────────────────────────────────────────────────
    let onScreen = false;
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      if (onScreen) {
        dirty = true;
        wake();
      }
    });
    io.observe(section);

    const progress = () => {
      const r = section.getBoundingClientRect();
      // At least half a screen of scrolling for the whole cooling: the phone section is only
      // 115vh, so the piece keeps cooling while the stage scrolls away (keep in sync: Cooling / CoolingScene).
      const span = Math.max(r.height - window.innerHeight, window.innerHeight * 0.5);
      return span > 0 ? clamp01(-r.top / span) : 0;
    };
    const onScroll = () => wake();
    window.addEventListener('scroll', onScroll, { passive: true });

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        last = performance.now();
        dirty = true;
        wake();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // ─── Frame ───────────────────────────────────────────────────────
    const start = performance.now();
    let last = start;
    let lastRender = 0;
    let first = true;
    let readySent = false;
    const cur = { p: progress() };

    function wake() {
      if (!raf && !document.hidden && onScreen) raf = requestAnimationFrame(tick);
    }

    function tick() {
      raf = 0;
      if (!onScreen || document.hidden) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      // Ease toward the scroll position so wheel steps do not jump.
      const target = progress();
      let moving = false;
      if (first) cur.p = target;
      else {
        const d = target - cur.p;
        if (Math.abs(d) > 1e-4) moving = true;
        cur.p += d * (1 - Math.exp(-dt / 0.15));
      }
      first = false;
      const p = cur.p;
      const temp = 1 - smoothstep(0.05, 0.9, p);
      U.uTemp.value = temp;

      // Cold black metal needs more environment and key to show its highlights.
      const hot = smoothstep(0.02, 0.25, temp);
      scene.environmentIntensity = lerp(0.7, 0.22, hot);
      key.intensity = lerp(2.6, 2.0, hot);
      // Rim: warm white when cold, ember when hot.
      rim.color.lerpColors(RIM_COLD, RIM_HOT, Math.min(1, temp * 2.5));

      // Pose: tip length as a share of the visible width (larger on phones), never
      // taller than the frame; centred on phones, right of the copy on wide screens.
      const aspect = vw / vh;
      const H2 = CAM_D * TAN;
      const W2 = H2 * aspect;
      const portrait = aspect < 0.85;
      const share = portrait ? 0.9 : lerp(0.8, 0.68, clamp01((aspect - 1) / 0.8));
      const s = Math.min(share * 2 * W2, 2.4 * H2);
      outer.scale.setScalar(s);
      outer.position.set(portrait ? 0 : W2 * 0.15, portrait ? -H2 * 0.32 : -H2 * 0.16, 0);

      const t = (now - start) / 1000;
      const drift = Math.sin((t * Math.PI * 2) / 16) * DRIFT_DEG;
      spin.rotation.y = deg(ROLL_START + ROLL_SPAN * p + drift);

      const idleDue = now - lastRender > 31;
      if (modelLoaded && !contextLost && (moving || dirty || idleDue)) {
        renderer.render(scene, camera);
        lastRender = now;
        dirty = false;
        if (!readySent) {
          readySent = true;
          cb.current.onReady?.();
        }
      }
      if (modelLoaded) raf = requestAnimationFrame(tick);
    }
    wake();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      geoms.forEach((g) => g.dispose());
      bodyMat.dispose();
      machinedMat.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [section]);

  return <div ref={ref} className="absolute inset-0" />;
}
