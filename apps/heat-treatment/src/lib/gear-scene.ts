/* Gear heat-treatment scene (three.js, loaded lazily by GearProcess via dynamic import).
 * One spur gear (involute teeth) on a fixed pose, turning very slowly about its axis. The heat look
 * lives in one material's shader: uP (0..1 progress) -> a temperature field over the local section mass.
 *
 *   P 0.00-0.36  heating: thin sections (tooth tips) lead, the hub lags. Ember colour only
 *                (dark cherry -> orange; never yellow/white). Illustration, not measured values.
 *   P 0.36-0.60  quench: thin sections and the rim cool first, the hub last. Steam rises (this stage only).
 *   P 0.60-1.00  tempering: a lasting oxide film spreads from thin to thick sections:
 *                straw -> bronze -> purple -> blue -> dark blue-grey.
 *
 * Brightness only falls while cooling. The warm light sits on the gear's surface only (no glow, no halo). */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const deg = THREE.MathUtils.degToRad;
function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/* ───────── Geometri: düz dişli, evolvent profil ───────── */
const N = 28; // diş sayısı
const RP = 1.0; // taksimat dairesi
const ALPHA = deg(20); // standart basınç açısı
const MOD = (2 * RP) / N;
const RA = RP + MOD; // diş üstü
const RR = RP - 1.25 * MOD; // diş dibi
const RB = RP * Math.cos(ALPHA); // temel daire
const ZR = 0.19; // kenar halkası yarı genişliği
const ZH = 0.3; // göbek arka yüzü (z=-ZH)
const inv = (a: number) => Math.tan(a) - a;
const polar = (r: number, a: number) => new THREE.Vector2(r * Math.cos(a), r * Math.sin(a));

/** Diş ekseninden yarı kalınlık açısı (rad): evolvent. */
function halfAngle(r: number) {
  const ar = Math.acos(Math.min(1, RB / r));
  return Math.PI / (2 * N) + 0.004 + inv(ALPHA) - inv(ar);
}

function bez(
  p0: THREE.Vector2,
  pc: THREE.Vector2,
  p1: THREE.Vector2,
  n: number,
  out: THREE.Vector2[],
  skipFirst?: boolean,
) {
  for (let i = skipFirst ? 1 : 0; i <= n; i++) {
    const t = i / n;
    out.push(
      new THREE.Vector2(
        (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * pc.x + t * t * p1.x,
        (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * pc.y + t * t * p1.y,
      ),
    );
  }
}

function toothedOutline(flankSteps: number, filSteps: number) {
  const pts = [];
  const pitch = (2 * Math.PI) / N;
  const r0 = RB * 1.003;
  const rF = RA - 0.17 * MOD; // pah başlangıcı
  const hb = halfAngle(r0);
  // Kök yuvarlatması (rad): iki diş arasındaki dip boşluğunun %45'i. Sabit 0.058 boşluktan
  // genişti, iki yuvarlatma üst üste biniyor ve pah her dipte sivri bir çıkıntı bırakıyordu
  // (sahibi, 2026-10-28: "dişlinin şekli bozuk").
  const FIL = 0.45 * (pitch - 2 * hb);
  const ROOT_STEPS = 2;
  const hF = halfAngle(rF);
  const hTip = hF * 0.4; // baş pahı: yan yüzden diş üstüne ~45 derece
  for (let k = 0; k < N; k++) {
    const c = k * pitch;
    // sol kök yuvarlatması: diş dibi dairesinden evolvent başlangıcına
    bez(polar(RR, c - hb - FIL), polar(RR, c - hb), polar(r0, c - hb), filSteps, pts, false);
    // sol evolvent yan yüzey
    for (let i = 1; i <= flankSteps; i++) {
      const r = r0 + ((rF - r0) * i) / flankSteps;
      pts.push(polar(r, c - halfAngle(r)));
    }
    // baş pahı + hafif bombeli diş üstü
    pts.push(
      polar(RA * 0.9996, c - hTip),
      polar(RA, c - hTip * 0.35),
      polar(RA, c + hTip * 0.35),
      polar(RA * 0.9996, c + hTip),
    );
    // sağ yan yüzey
    for (let i = flankSteps; i >= 1; i--) {
      const r = r0 + ((rF - r0) * i) / flankSteps;
      pts.push(polar(r, c + halfAngle(r)));
    }
    // sağ kök yuvarlatması
    bez(polar(r0, c + hb), polar(RR, c + hb), polar(RR, c + hb + FIL), filSteps, pts, true);
    // diş dibi yayı: birkaç nokta, tek nokta pah (bevel) sırasında dipte sivri çıkıntı bırakıyordu
    const a0 = c + hb + FIL;
    const a1 = c + pitch - hb - FIL;
    for (let i = 1; i < ROOT_STEPS; i++) pts.push(polar(RR, a0 + ((a1 - a0) * i) / ROOT_STEPS));
  }
  return pts;
}

const circlePts = (r: number, n: number) =>
  Array.from({ length: n }, (_, i) => polar(r, (i / n) * Math.PI * 2));

/** Kama yuvalı mil deliği (yuva belirgin derinlikte). */
function borePts(r: number, keyW: number, keyTop: number) {
  const x = keyW / 2;
  const d = Math.asin(x / r);
  const pts = [];
  const n = 40;
  const a0 = Math.PI / 2 + d;
  const a1 = Math.PI / 2 + Math.PI * 2 - d;
  for (let i = 0; i <= n; i++) pts.push(polar(r, a0 + ((a1 - a0) * i) / n));
  pts.push(new THREE.Vector2(x, keyTop), new THREE.Vector2(-x, keyTop));
  return pts;
}

/** zBack..zFront arası, kenarları pahlı (chamfer) dilim. */
function slab(
  outer: THREE.Vector2[],
  holes: THREE.Vector2[][],
  zFront: number,
  zBack: number,
  bevel: number,
) {
  const s = new THREE.Shape(outer);
  holes.forEach((h: THREE.Vector2[]) => s.holes.push(new THREE.Path(h)));
  const g = new THREE.ExtrudeGeometry(s, {
    depth: zFront - zBack - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 2,
    curveSegments: 1,
    steps: 1,
  });
  g.translate(0, 0, zBack + bevel);
  return g;
}

export function buildGearGeometry(lowPoly: boolean) {
  const flank = lowPoly ? 4 : 8;
  const fil = lowPoly ? 4 : 6;
  const BORE = 0.17;
  const bore = () => borePts(BORE, 0.088, BORE + 0.095);
  // 6 hafifletme deliği
  const lights = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const cx = 0.585 * Math.cos(a);
    const cy = 0.585 * Math.sin(a);
    lights.push(
      circlePts(0.082, lowPoly ? 20 : 32).map((p) => new THREE.Vector2(p.x + cx, p.y + cy)),
    );
  }
  const parts = [
    // dişli kenar (halka)
    slab(toothedOutline(flank, fil), [circlePts(0.74, lowPoly ? 56 : 84)], ZR, -ZR, 0.022),
    // ince gövde (web): iki yüzde derin cep
    slab(circlePts(0.79, 72), [circlePts(0.4, 56), ...lights], 0.055, -0.055, 0.008),
    // göbek (hub)
    slab(circlePts(0.43, 64), [bore()], 0.32, -ZH, 0.024),
    // göbek üstü ikinci kademe (boss)
    slab(circlePts(0.31, 56), [bore()], 0.46, 0.28, 0.02),
  ];
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  const g = toCreasedNormals(merged, deg(18));
  merged.dispose();
  g.computeBoundingSphere();
  return g;
}

/* ───────── Shader ───────── */
const GLSL = /* glsl */ `
uniform float uP; uniform float uDark; uniform float uT; uniform mat3 uNM;
varying vec3 vObj; varying vec3 vNO; varying vec3 vRadV; varying vec3 vAxV; varying vec3 vTanC;
vec3 vRadF; vec3 vTanF; vec3 vAxF;
float gM; float gT; float gMach; float gAO; float gFlake; float gFace; float gEdge; float gFilm; float gTpk; float gTeff; float gHole; float gMark;
vec3 gGlow;
float hash3(vec3 p){ p=fract(p*0.3183+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){ vec3 i=floor(x),f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z); }
float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }
float rn(float x){ float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
// Yerel termal kütle (sürekli): göbek 1, gövde ince, kenar halkası orta, diş ucu en ince; yüz kenarları daha ince.
float massAt(float r, float z){
  float m = mix(1.0, 0.38, smoothstep(0.34, 0.54, r));
  m = mix(m, 0.64, smoothstep(0.58, 0.80, r));
  m = mix(m, 0.22, smoothstep(0.88, 1.08, r));
  float ez = smoothstep(0.12, 0.19, abs(z)) * smoothstep(0.60, 0.80, r);
  return m * (1.0 - 0.22 * ez);
}
// Sıcaklık (°C): doğrusal ısıtma (ince kesit önde) -> su verme: geniş, yumuşak soğuma cephesi dişten göbeğe ilerler.
float tempC(float m, float r, vec3 po){
  float mn = clamp((m - 0.22) / 0.78, 0.0, 1.0);
  float Tpk = 690.0 + 255.0 * pow(1.0 - mn, 0.85); // göbek ~690, diş ucu ~945: belirgin kütle gradyanı
  gTpk = Tpk;
  if (uP < 0.36) {
    float h = clamp((uP - 0.01 - 0.03 * mn) / 0.31, 0.0, 1.0);
    h = 0.75 * h + 0.25 * h * h * (3.0 - 2.0 * h);
    return 20.0 + (Tpk - 20.0) * h;
  }
  float s = clamp((uP - 0.375) / 0.24, 0.0, 1.0);
  float rc = 1.5 - 1.5 * s;
  float rr = r + 0.05 * (vnoise(po * 3.0) - 0.5) + 0.03 * (vnoise(po * 8.0) - 0.5) - 0.05 * smoothstep(0.1, 0.19, abs(po.z)) * smoothstep(0.55, 0.9, r);
  float cool = smoothstep(-0.5, 0.5, rr - rc);
  float T = 20.0 + (Tpk - 20.0) * exp(-1.15 * cool);
  return mix(T, 20.0 + (T - 20.0) * 0.1, smoothstep(0.88, 1.0, s));
}
// Kor ışıması: sıcaklığın artan fonksiyonu. Koyu kiraz -> kiraz -> kiraz-turuncu -> turuncu -> açık turuncu. Sarı/beyaz yok.
vec3 glowOf(float c){
  float on = smoothstep(470.0, 640.0, c);
  vec3 k0 = vec3(0.26, 0.008, 0.004); // ~620 koyu kiraz
  vec3 k1 = vec3(0.56, 0.020, 0.006); // ~700 kiraz
  vec3 k2 = vec3(0.82, 0.062, 0.010); // ~780 kiraz-turuncu
  vec3 k3 = vec3(0.97, 0.160, 0.016); // ~860 turuncu
  vec3 k4 = vec3(1.00, 0.275, 0.034); // ~950 açık turuncu (sarı yok)
  vec3 g = k0;
  g = mix(g, k1, smoothstep(620.0, 710.0, c));
  g = mix(g, k2, smoothstep(710.0, 790.0, c));
  g = mix(g, k3, smoothstep(790.0, 870.0, c));
  g = mix(g, k4, smoothstep(870.0, 950.0, c));
  return g * on;
}
// Temper oksit filmi: saman -> bronz -> kahve-mor -> mor -> mavi -> çelik mavisi. İnce film: az doygun, yansıtıcı.
vec3 filmRamp(float u){
  vec3 c = vec3(0.40, 0.34, 0.22);                                   // saman (sarı değil)
  c = mix(c, vec3(0.37, 0.265, 0.15), smoothstep(0.06, 0.20, u));    // bronz
  c = mix(c, vec3(0.34, 0.225, 0.195), smoothstep(0.22, 0.36, u));   // kahve-mor
  c = mix(c, vec3(0.25, 0.215, 0.285), smoothstep(0.36, 0.50, u));    // mor
  c = mix(c, vec3(0.20, 0.24, 0.31), smoothstep(0.54, 0.72, u));      // mavi
  c = mix(c, vec3(0.215, 0.245, 0.30), smoothstep(0.76, 0.92, u));     // çelik mavisi
  return c;
}`;

type Uniforms = Record<string, THREE.IUniform>;
function makeMaterial(U: Uniforms) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.7, roughness: 0.5 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vObj; varying vec3 vNO; varying vec3 vRadV; varying vec3 vAxV; varying vec3 vTanC;',
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vObj = position; vNO = normal;
        vRadV = normalize(normalMatrix * normalize(vec3(position.xy, 0.0001)));
        vTanC = normalize(normalMatrix * normalize(vec3(-position.y, position.x, 0.0001)));
        vAxV = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float r0 = length(vObj.xy);
        vec2 dirXY = normalize(vObj.xy + vec2(1e-5));
        vRadF = normalize(uNM * vec3(dirXY, 0.0001));
        vTanF = normalize(uNM * vec3(-dirXY.y, dirXY.x, 0.0001));
        vAxF = normalize(uNM * vec3(0.0, 0.0, 1.0));
        vec3 nO = normalize(vNO);
        gFace = smoothstep(0.55, 0.9, abs(nO.z));
        gEdge = smoothstep(0.2, 0.5, abs(nO.z)) * (1.0 - smoothstep(0.7, 0.92, abs(nO.z)));
        gM = massAt(r0, vObj.z);
        gT = tempC(gM, r0, vObj);
        float mn = clamp((gM - 0.22) / 0.78, 0.0, 1.0);
        float endK = smoothstep(0.80, 1.0, uP);
        // İşleme izleri: düzensiz aralıklı, ince (periyodik şerit yok). Yüzlerde eş merkezli torna izi,
        // diş yan yüzünde profil boyunca ince taşlama izi. Piksel altına inen frekans söner.
        float nj = vnoise(vObj * 5.0);
        float f1 = r0 * 170.0 + nj * 2.0;
        float dm1 = 1.0 - smoothstep(0.5, 1.2, fwidth(f1));
        float f2 = r0 * 430.0 + 3.0;
        float dm2 = 1.0 - smoothstep(0.4, 1.0, fwidth(f2));
        float turn = (rn(f1) - 0.5) * 1.3 * dm1 + (rn(f2) - 0.5) * 0.7 * dm2;
        float f3 = r0 * 260.0 + 0.9 * sin(vObj.z * 11.0 + nj * 3.0) + vnoise(vObj * 9.0) * 1.5;
        float dm3 = 1.0 - smoothstep(0.5, 1.2, fwidth(f3));
        float mill = (rn(f3) - 0.5) * 1.6 * dm3;
        gMach = mix(mill, turn, gFace);
        // sahte kovuk koyuluğu: gövde cebi, göbek basamağı, hafifletme delikleri, diş dibi, mil deliği
        float webZ = 1.0 - smoothstep(0.03, 0.08, abs(vObj.z) - 0.055);
        float pocket = gFace * webZ * smoothstep(0.6, 0.735, r0);
        float hubRing = gFace * webZ * (1.0 - smoothstep(0.43, 0.54, r0)) * step(0.4, r0);
        float holes = (1.0 - gFace) * step(0.45, r0) * (1.0 - step(0.7, r0));
        float root = (1.0 - gFace) * (1.0 - smoothstep(0.90, 0.97, r0)) * step(0.7, r0);
        float boreW = (1.0 - gFace) * (1.0 - step(0.25, r0));
        gHole = clamp(holes + boreW, 0.0, 1.0);
        gAO = 1.0 - 0.34 * pocket - 0.26 * hubRing - 0.16 * holes - 0.30 * root - 0.26 * boreW;
        float fine = vnoise(vObj * 85.0);
        float flk = vnoise(vObj * 38.0);
        gFlake = 1.0 - 0.04 * smoothstep(0.58, 0.78, flk);
        float fb = 0.55 * vnoise(vObj * 5.5) + 0.30 * vnoise(vObj * 12.0) + 0.15 * vnoise(vObj * 26.0);
        float blot = smoothstep(0.55, 0.78, vnoise(vObj * 6.5 + 7.0));
        // sıcaklık geçmişi: ısındıkça tufal (bir kez oluşur, geri dönmez)
        float Tmax = uP < 0.36 ? gT : gTpk;
        float ox = smoothstep(250.0, 650.0, Tmax);
        vec3 rawSteel = vec3(0.098, 0.094, 0.090) * (0.94 + 0.12 * fine); // ham, mat, koyu sıcak gri
        float mott = smoothstep(0.42, 0.68, fb);
        vec3 scale = mix(vec3(0.050, 0.051, 0.058), vec3(0.120, 0.100, 0.088), mott * 0.6) * (0.9 + 0.2 * fine);
        scale *= 1.0 - 0.2 * blot;
        vec3 base = mix(rawSteel, scale, ox) * (1.0 + 0.06 * gMach);
        float hotk = smoothstep(350.0, 700.0, gT);
        base = mix(base, vec3(0.060, 0.021, 0.016) * (0.9 + 0.2 * fine), hotk);
        // temper filmi: su verme sonrası tufal yarı saydamlaşır, film yavaş belirir; ince kesit önde
        float t0 = 0.55 + 0.10 * mn;
        float u = clamp((uP - t0) / 0.36, 0.0, 1.0);
        vec3 Ln = normalize(vec3(-0.35, 0.55, 0.75));
        vec3 nV = normalize(vNormal);
        float ndv0 = clamp(dot(nV, normalize(vViewPosition)), 0.0, 1.0);
        float ndl0 = dot(nV, Ln);
        // ince film girişimi: renk bakış ve ışık açısıyla kayar
        float shiftU = 0.22 * (pow(1.0 - ndv0, 1.3) - 0.30) + 0.10 * (0.5 - 0.5 * ndl0) + 0.06 * (fb - 0.5);
        float ue = clamp(u * 0.9 + shiftU * smoothstep(0.04, 0.3, u), 0.0, 1.0);
        float fa = smoothstep(0.0, 0.22, u) * (1.0 - smoothstep(300.0, 420.0, gT)) * 0.95;
        gFilm = fa;
        vec3 fc = pow(filmRamp(ue), vec3(2.2)) * 0.85 * (0.92 + 0.16 * fine) * (1.0 - 0.1 * blot * (1.0 - u));
        fc *= mix(0.5, 1.4, smoothstep(0.0, 0.6, u));
        float lum = dot(fc, vec3(0.3, 0.59, 0.11));
        fc = mix(vec3(lum), fc, 0.62);
        base = mix(base, fc, fa);
        // rapor: ölçüm noktaları (halka çevresinde, üç işaret)
        float uMk = smoothstep(0.93, 0.985, uP);
        float ang = atan(vObj.y, vObj.x);
        float mkd = 9.0;
        for (int mi = 0; mi < 3; mi++) {
          float a = 1.75 + float(mi) * 2.0943951;
          vec2 pm = vec2(cos(a), sin(a)) * 0.825;
          mkd = min(mkd, length(vObj.xy - pm));
        }
        gMark = gFace * step(0.1, vObj.z) * uMk;
        float dimple = (1.0 - smoothstep(0.007, 0.017, mkd)) * gMark;
        float mring = smoothstep(0.024, 0.029, mkd) * (1.0 - smoothstep(0.034, 0.040, mkd)) * gMark;
        base = mix(base, base * 0.35, dimple);
        base += vec3(0.30, 0.31, 0.33) * mring * 0.55;
        diffuseColor.rgb = base * gAO;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        float rgh = mix(0.78, 0.76, smoothstep(250.0, 650.0, uP < 0.36 ? gT : gTpk));
        rgh = mix(rgh, 0.52, hotk);
        rgh = mix(rgh, 0.26 + 0.12 * (1.0 - u), gFilm);
        roughnessFactor = clamp(rgh + 0.07 * (vnoise(vObj * 70.0) - 0.5) - 0.07 * gMach * (1.0 - hotk), 0.2, 1.0);`,
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
        metalnessFactor = mix(mix(0.42, 0.6, hotk), 0.92, gFilm);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        normal = normalize(normal + vRadF * gMach * (0.075 * gFace + 0.07 * (1.0 - gFace)));`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          vec3 Vv = normalize(vViewPosition);
          vec3 Lk = normalize(vec3(-0.35, 0.55, 0.75));
          float ndl = dot(normal, Lk);
          float shade = 0.16 + 0.84 * smoothstep(0.1, 0.95, ndl * 0.5 + 0.5);
          float ndv = clamp(dot(normal, Vv), 0.0, 1.0);
          float cav = clamp((1.0 - gAO) / 0.3, 0.0, 1.0) * (1.0 - gHole);
          float tipR = smoothstep(0.985, 1.06, r0);
          float edge = max(gEdge, tipR);
          float hm = smoothstep(380.0, 640.0, gT);
          // ısı kütleye göre dağılır: diş ucu en açık, diş kökü ve göbek belirgin koyu kızıl; yan yüzde dikey düşüş
          float tz = smoothstep(0.88, 0.95, r0);
          float tipK = smoothstep(0.95, 1.07, r0);
          float tooth = tz * (-270.0 * (1.0 - tipK) + 75.0 * tipK);
          float hubK = 1.0 - smoothstep(0.30, 0.62, r0);
          // düşük frekanslı, yavaş sıcaklık dalgalanması (kıvılcım yok)
          float shim = (vnoise(vObj * 2.3 + vec3(0.0, 0.0, uT * 0.07)) - 0.5) * (36.0 + 40.0 * smoothstep(0.36, 0.42, uP) * (1.0 - smoothstep(0.5, 0.6, uP))) + (vnoise(vObj * 4.6 - vec3(uT * 0.05, 0.0, 0.0)) - 0.5) * 16.0;
          gTeff = gT + (70.0 * edge - 200.0 * cav + tooth - 70.0 * hubK + 85.0 * gHole + shim - 40.0 * (1.0 - ndv)) * hm;
          float grain = 0.96 + 0.04 * vnoise(vObj * 95.0);
          float uneven = 0.96 + 0.08 * vnoise(vObj * 2.1 + 2.0);
          float selfLit = (0.34 + 0.66 * shade) * mix(0.78, 1.0, pow(ndv, 0.5));
          float edgeB = 1.0 + 0.30 * edge;
          gGlow = glowOf(gTeff) * grain * gFlake * uneven * (1.0 + 0.05 * gMach) * selfLit * edgeB * 0.42;
          totalEmissiveRadiance += gGlow;
          // anizotropik metal yansıması (Kajiya-Kay): yüzde eş merkezli izlere dik, yan yüzde eksenel izlere dik
          vec3 Hh = normalize(Lk + Vv);
          vec3 Tt = normalize(mix(vAxF, vTanF, gFace));
          float th = dot(Tt, Hh);
          float an = pow(sqrt(max(0.0, 1.0 - th * th)), 520.0) * smoothstep(0.0, 0.35, ndl);
          float cold = 1.0 - smoothstep(350.0, 620.0, gT);
          vec3 anCol = mix(vec3(0.9, 0.34, 0.12), vec3(0.88, 0.92, 1.0), cold);
          float anAmt = mix(0.13, (0.12 + 0.12 * gFilm) * (1.0 + 0.9 * endK), cold) * (0.65 + 0.35 * (0.5 + 0.5 * gMach));
          totalEmissiveRadiance += anCol * an * anAmt;
          // ışığa göre kayan temper parıltısı: yan yüz ve kenarlarda film rengi açıyla değişir
          float sw = pow(1.0 - ndv, 2.0);
          vec3 shc = pow(filmRamp(clamp(ue + 0.3 * sw - 0.12 * ndl, 0.0, 1.0)), vec3(2.2)) * 3.2;
          float shAmt = (0.10 + 0.40 * gEdge * smoothstep(0.0, 0.7, ndl) + 0.30 * (1.0 - gFace) * smoothstep(0.1, 0.8, ndl)) * (0.5 + 0.5 * endK);
          totalEmissiveRadiance += shc * gFilm * cold * shAmt * 0.55;
          // işlenmiş çelik: pah ve diş uçlarında metal kenar parlaması (bitmiş parçada en belirgin)
          float hard = gEdge * smoothstep(0.05, 0.75, ndl) * gFilm * cold;
          totalEmissiveRadiance += vec3(0.75, 0.82, 1.0) * hard * 0.22;
          totalEmissiveRadiance += vec3(0.86, 0.90, 1.0) * tipR * endK * smoothstep(-0.1, 0.6, ndl) * 0.30 * cold;
        }`,
      );
  };
  return m;
}

/* ───────── Buhar (su verme): çarkın üst kenarından ve yüzeyinden kabarır, genişler, yukarıda dağılır ───────── */
function makeSteam(count: number) {
  const g = new THREE.BufferGeometry();
  const seed = new Float32Array(count * 4);
  let s = 424242;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < count * 4; i++) seed[i] = rnd();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
  const U = {
    uTime: { value: 0 },
    uAmt: { value: 0 },
    uS: { value: 1 },
    uPx: { value: 500 },
    uPose: { value: new THREE.Matrix4() },
    uCol: { value: new THREE.Color(0.45, 0.43, 0.41) },
    uAlpha: { value: 0.3 },
    uRise: { value: 1.0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute vec4 aSeed; uniform float uTime, uAmt, uS, uPx, uAlpha, uRise; uniform mat4 uPose;
      varying float vA; varying float vLife; varying float vSd;
      void main(){
        float sp = 0.55 + 0.6 * aSeed.w;
        float life = fract(aSeed.x + uTime * 0.034 * sp);
        // kaynak: çarkın üst yarısı, dış halka ve diş bölgesi (yüzeyden kabarma)
        float ang = mix(0.07, 0.93, aSeed.y) * 3.14159265;
        float rr = mix(0.55, 1.06, aSeed.z);
        vec4 o = uPose * vec4(cos(ang) * rr, sin(ang) * rr, 0.2, 1.0);
        float sway = sin(uTime * 0.3 + aSeed.x * 40.0 + life * 3.5) * (0.04 + 0.16 * life);
        float spread = (aSeed.w - 0.5) * 0.45 * life;
        vec3 p = o.xyz + vec3((sway + spread) * uS, life * uRise * uS, 0.22 * life * uS);
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(560.0, (0.30 + 1.0 * life) * uS * uPx / -mv.z);
        vec2 nd = gl_Position.xy / gl_Position.w;
        float edgeFade = 1.0 - smoothstep(0.74, 0.99, nd.y);
        vA = uAmt * uAlpha * smoothstep(0.0, 0.16, life) * pow(1.0 - life, 1.15) * edgeFade;
        vLife = life; vSd = aSeed.z * 13.0 + aSeed.w * 7.0;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCol; varying float vA; varying float vLife; varying float vSd;
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float n = vn(c * 3.4 + vSd);
        float n2 = vn(c * 8.0 - vSd + vLife * 2.0);
        // yumuşak, kümelenmiş buhar topağı: kenarı gürültüyle dağılır
        float d = length(c * vec2(1.0, 1.15)) * 2.0 + (n - 0.5) * 0.6;
        float soft = 1.0 - smoothstep(0.1, 1.0, d);
        float a = soft * soft * (0.55 + 0.45 * n2);
        gl_FragColor = vec4(uCol, a * vA);
      }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 3;
  return { pts, U, dispose: () => (g.dispose(), mat.dispose()) };
}

/* ───────── Zemin: yumuşak gölge + temas kararması; gece yalnız gölge tarafında zayıf kızıl yüzey yansıması ───────── */
function makeGround() {
  const U = {
    uDark: { value: 0 },
    uHeat: { value: 0 },
    uOff: { value: new THREE.Vector2(0.1, -0.12) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */ `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uDark, uHeat; uniform vec2 uOff; varying vec2 vP;
      void main(){
        float r = length(vP);
        float inner = mix(0.1, 1.0, smoothstep(0.84, 1.06, r)); // dişlinin arkası (deliklerden görünen) açık kalır
        float sh = (1.0 - smoothstep(0.55, 1.5, length(vP - uOff))) * inner;
        float ao = ((1.0 - smoothstep(0.95, 1.3, r)) * 0.55 + (1.0 - smoothstep(1.0, 1.1, r)) * 0.45) * inner;
        float fade = 1.0 - smoothstep(1.55, 2.05, r);
        float aS = (0.24 * sh + 0.2 * ao) * fade * mix(1.0, 0.45, uDark);
        vec3 shCol = mix(vec3(0.20,0.13,0.08), vec3(0.0), uDark);
        gl_FragColor = vec4(shCol * aS, aS);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), mat);
  mesh.renderOrder = -1;
  return { mesh, U, dispose: () => (mesh.geometry.dispose(), mat.dispose()) };
}

/* ───────── Sahne ───────── */
export interface GearLayout {
  /** gear centre, 0..1 of the canvas */
  cx: number;
  cy: number;
  /** gear diameter in CSS px */
  D: number;
}
export interface GearMountOptions {
  container: HTMLElement;
  /** The tall section; its first child is the sticky stage. */
  section: HTMLElement;
  getLayout: () => GearLayout;
  onP?: (P: number) => void;
  onReady?: () => void;
  /** WebGL context lost / restored (restored calls onReady again after the next frame). */
  onLost?: () => void;
  onFail?: () => void;
  /** Poster rendering only: fixed layout + preserved drawing buffer. */
  debug?: { fixedLayout?: GearLayout } | null;
}
export interface GearScene {
  setP(P: number | null, t?: number): void;
  renderNow(): void;
  dispose(): void;
}

export async function mount({
  container,
  section,
  getLayout,
  onP,
  onReady,
  onLost,
  onFail,
  debug,
}: GearMountOptions): Promise<GearScene | null> {
  const coarse = !!(window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 700);
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      // Antialiasing and the full-detail outline on phones too (owner, 2026-10-28: the gear's
      // shape looked broken on the phone: jagged tooth flanks): one mesh, the 30 fps cap holds.
      antialias: true,
      powerPreference: 'low-power',
      preserveDrawingBuffer: !!debug,
    });
  } catch {
    onFail?.();
    return null;
  }
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  const DPR = Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1);
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block' });
  container.appendChild(canvas);

  const FOV = 24;
  const CAM_D = 6;
  const TAN = Math.tan(deg(FOV / 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 30);
  camera.position.set(0, 0, CAM_D);

  const pm = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pm.fromScene(room, 0.04).texture;
  room.dispose();
  pm.dispose();

  // tek ışık seti: üst-sol anahtar + arkadan soğuk kenar ışığı (siluet) + hafif yarım küre dolgusu
  const key = new THREE.DirectionalLight(0xfff1e0, 2.3);
  key.position.set(-3, 4, 3.5);
  const rimL = new THREE.DirectionalLight(0xdfe8ff, 1.6);
  rimL.position.set(-3.4, 1.2, -3);
  const rimR = new THREE.DirectionalLight(0xdfe8ff, 1.6);
  rimR.position.set(3.4, 2.4, -2.6);
  const hemi = new THREE.HemisphereLight(0xb4bdd0, 0x2a2420, 0.25);
  const rimT = new THREE.DirectionalLight(0xc9d6ff, 2.8);
  rimT.position.set(0.4, 4.2, -1.2);
  scene.add(key, rimL, rimR, rimT, hemi);

  const U = {
    uP: { value: 0 },
    uDark: { value: 0 },
    uT: { value: 0 },
    uNM: { value: new THREE.Matrix3() },
  };
  const mat = makeMaterial(U);
  const geo = buildGearGeometry(false);
  const mesh = new THREE.Mesh(geo, mat);
  const spin = new THREE.Group();
  spin.add(mesh);
  const pose = new THREE.Group();
  pose.rotation.order = 'YXZ';
  pose.add(spin);
  scene.add(pose);

  const ground = makeGround();
  ground.mesh.position.z = -ZH - 0.005;
  pose.add(ground.mesh);

  const steam = makeSteam(coarse ? 84 : 140);
  scene.add(steam.pts);

  let vw = 1;
  let vh = 1;
  const resize = () => {
    const W = container.clientWidth;
    const H = container.clientHeight;
    if (W <= 0 || H <= 0) return;
    vw = W;
    vh = H;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(DPR);
    renderer.setSize(W, H, false);
    steam.U.uPx.value = (H * DPR) / (2 * TAN);
    dirty = true;
    wake();
  };

  const fixed = debug?.fixedLayout; // poster modu: kare tuval, çark ortada
  function place() {
    const L = fixed || getLayout();
    const H2 = CAM_D * TAN;
    const pxPerUnit = vh / (2 * H2);
    const s = L.D / (2 * RA * pxPerUnit);
    pose.scale.setScalar(s);
    const W2 = H2 * (vw / vh);
    pose.position.set((L.cx * 2 - 1) * W2, -(L.cy * 2 - 1) * H2, 0);
    steam.U.uS.value = s;
  }

  const progress = () => {
    const r = section.getBoundingClientRect();
    const stage = section.firstElementChild as HTMLElement | null;
    const span = r.height - (stage?.offsetHeight || window.innerHeight);
    return span > 0 ? clamp01(-r.top / span) : 0;
  };
  const P_HOLD = 0.36;
  const toP = (p: number) => P_HOLD + (1 - P_HOLD) * p;

  let onScreen = false;
  const io = new IntersectionObserver(
    (es) => {
      onScreen = es.some((e) => e.isIntersecting);
      if (onScreen) {
        last = performance.now();
        dirty = true;
        wake();
      }
    },
    { rootMargin: '30% 0px' },
  );
  io.observe(section);
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  const onScroll = () => wake();
  addEventListener('scroll', onScroll, { passive: true });
  const onVis = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      last = performance.now();
      wake();
    }
  };
  document.addEventListener('visibilitychange', onVis);

  // The site's own day/night mark (see globals.css): a hand-picked data-theme wins, else the
  // edge middleware's data-sun; no mark at all means the dark (night) look.
  const isDark = () => {
    const root = document.documentElement;
    const t = root.getAttribute('data-theme');
    if (t === 'light') return false;
    if (t === 'dark') return true;
    return root.getAttribute('data-sun') !== 'day';
  };

  let raf = 0;
  let dirty = true;
  let lost = false;
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    onLost?.();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    readySent = false;
    dirty = true;
    wake();
  });

  let last = performance.now();
  let lastRender = 0;
  let first = true;
  let readySent = false;
  let tReady = 0;
  const INTRO_S = 14; // yavaş, doğrusal ısınma rampası (sn)
  const cur = { P: 0 };
  const dbg: { P: number | null; t: number | null } = { P: null, t: null };
  let spinT = 0;
  const SPIN = deg(5); // rad/sn: sabit açısal hız, ivme yok (tam tur 72 sn)
  const FRAME_MS = coarse ? 45 : 31;
  const tmpQ = new THREE.Quaternion();
  const tmpV = new THREE.Vector3();

  function wake() {
    if (!raf && !document.hidden && onScreen) raf = requestAnimationFrame(tick);
  }

  function tick() {
    raf = 0;
    if (!onScreen || document.hidden) return;
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    // The warm-up clock starts when the section's top first comes into view (not at first paint,
    // which happens before the visitor arrives).
    if (!tReady && section.getBoundingClientRect().top < window.innerHeight * 0.9) tReady = now;
    const sec = tReady ? (now - tReady) / 1000 : 0;
    const x = clamp01(sec / INTRO_S);
    const intro = P_HOLD * (0.85 * x + 0.15 * x * x * (3 - 2 * x));
    const sp = progress();
    let target = sp > 0.002 ? toP(sp) : intro; // sayfa başında zamanla ısınır, kaydırınca ilerleme sürer
    if (dbg.P != null) target = dbg.P;
    let moving = false;
    if (first || dbg.P != null) cur.P = target;
    else {
      const d = target - cur.P;
      if (Math.abs(d) > 4e-4) moving = true;
      cur.P += d * (1 - Math.exp(-dt / 0.16));
    }
    first = false;
    if (sec < INTRO_S + 0.1) moving = true;
    const P = cur.P;
    U.uP.value = P;
    onP?.(P);

    // tema
    const dark = isDark();
    U.uDark.value = dark ? 1 : 0;
    const hot = clamp01(1 - Math.abs(P - 0.36) / 0.3) * (P < 0.66 ? 1 : 0);
    const nf = dark ? 0.62 + 0.38 * smoothstep(0.05, 0.4, P) : 1; // gece: başlangıç çeliği gündüzle aynı ton
    const hotA = smoothstep(0.18, 0.3, P) * (1 - smoothstep(0.42, 0.62, P));
    scene.environmentIntensity = ((dark ? 0.7 * nf : 0.78) - 0.05 * hot) * (1 - 0.18 * hotA);
    key.intensity = dark ? 2.3 : 2.5;
    rimL.intensity = rimR.intensity = dark ? 4.0 * nf : 2.2;
    rimT.intensity = dark ? 2.0 * nf : 0.8;
    hemi.intensity = dark ? 0.5 : 0.35;

    spinT += dt;
    const st = dbg.t != null ? dbg.t : spinT;
    spin.rotation.z = st * SPIN;
    // Yavaş duruş değişimi (kamera sabit): ısıtma/bekletmede ve sonda çark dikleşir, evolvent profil okunur
    const bump = Math.exp(-(((P - 0.32) / 0.11) ** 2));
    const endUp = smoothstep(0.84, 1.0, P);
    const tilt = -37 + 25 * bump + 21 * endUp;
    const yaw = -22 + 11 * bump + 10 * endUp + Math.sin(st * 0.35) * 2.5;
    pose.rotation.set(deg(tilt), deg(yaw), deg(-4));
    place();
    pose.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    mesh.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, mesh.matrixWorld);
    U.uNM.value.getNormalMatrix(mesh.modelViewMatrix);

    // zemin: gölge ışık yönünün tersine, ısıya göre sıcak yansıma
    ground.U.uDark.value = dark ? 1 : 0;
    tmpQ.copy(pose.quaternion).invert();
    tmpV.set(0.2, -0.3, 0).applyQuaternion(tmpQ);
    ground.U.uOff.value.set(tmpV.x, tmpV.y);

    // buhar: yalnız su verme aşamasında, yüzeyden
    const amt = smoothstep(0.385, 0.43, P) * (1 - smoothstep(0.54, 0.63, P));
    steam.U.uAmt.value = amt;
    steam.pts.visible = amt > 0.003;
    steam.U.uTime.value = st;
    steam.U.uRise.value = vw < 700 ? 0.5 : 0.6;
    steam.U.uPose.value.copy(pose.matrixWorld);
    if (dark) {
      steam.U.uCol.value.setRGB(0.8, 0.82, 0.86);
      steam.U.uAlpha.value = 0.36;
    } else {
      steam.U.uCol.value.setRGB(0.38, 0.45, 0.54);
      steam.U.uAlpha.value = 0.46;
    }
    U.uT.value = st;
    ground.U.uHeat.value = smoothstep(0.2, 0.34, P) * (1 - smoothstep(0.42, 0.62, P));

    const idleDue = now - lastRender > FRAME_MS;
    if (!lost && (moving || dirty || idleDue)) {
      renderer.render(scene, camera);
      lastRender = now;
      dirty = false;
      if (!readySent) {
        readySent = true;
        onReady?.();
      }
    }
    raf = requestAnimationFrame(tick);
  }

  resize();
  wake();

  return {
    setP(P: number | null, t?: number) {
      dbg.P = P;
      dbg.t = t ?? 0;
      dirty = true;
      wake();
    },
    renderNow() {
      resize();
      place();
      renderer.render(scene, camera);
    },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
      geo.dispose();
      mat.dispose();
      steam.dispose();
      ground.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
