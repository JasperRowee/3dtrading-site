/* r51 · 3dtrading log-in background — a realistic city of our own, with the great LED sphere standing in it.
   Rendered in 3D (three.js, vendored in ./vendor/three, no network). Nothing here is a real place.

   Composition is unchanged from r50 (Jasper's reference a68fb519…png): on desktop the sphere's centre is at 30% of the
   width and 109.7% of the height, radius 72.5% of the height (top at 37.2%); on phones the arc rises just under the
   headline. To keep that exact, the camera is built from the sphere: its optical axis passes through the sphere's centre
   (setViewOffset puts the principal point on the circle's centre), so the sphere projects to an exact circle of the
   reference radius, and the camera pitch puts the horizon where the layout wants it.

   The city: instanced towers with procedural facades (glass curtain walls, office ribbons, housing, concrete grids),
   lit windows at night and sun + sky light by day; streets with lane marks and street-light pools (no grid lines);
   car-light streams (white heading towards us, red away); red aviation lights on tall roofs; haze for depth.
   The sphere: an LED lattice in latitude rows, ray-traced per pixel so the outline is a perfect circle, showing five
   contents in turn (brand mark, candlestick chart, the Dodo eye, coin bands around the sphere, a teal-gold aurora).
   LEDs behind the headline / lede / feature row are dimmed so the text stays readable.
   Paused when the tab is hidden; reduced motion = one still frame, no auto-advance; no WebGL = the 2D fallback. */
import * as THREE from './vendor/three/build/three.module.min.js';
import { EffectComposer } from './vendor/three/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/three/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/three/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/three/jsm/postprocessing/OutputPass.js';

const D = document, root = D.documentElement, sceneEl = D.getElementById('scene'), cv0 = D.getElementById('city');
let RM = null; try { RM = matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { /* old browsers */ }

function fallback(why) {
  if (window.__city && window.__city.mode === '2d') return;
  window.__cityWhy = why || 'webgl';
  const s = D.createElement('script'); s.src = 'city2d.js?v=r51'; D.body.appendChild(s);
}

let renderer = null;
if (sceneEl && cv0) {
  try { renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false, depth: true }); }
  catch (e) { renderer = null; }
}
if (!renderer) fallback('no-webgl'); else start();

function start() {
  /* ---------- small helpers ---------- */
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const col = h => new THREE.Color(h);
  const u = v => ({ value: v });

  const cv = renderer.domElement; cv.id = 'city'; cv0.replaceWith(cv);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); }, false);
  cv.addEventListener('webglcontextrestored', () => { build(true); }, false);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, 1, 2, 16000);
  const S = new THREE.Vector3(0, 22, 0), SR = 60;              // the sphere: 120 m across, sunk 38 m into its plaza
  const PX = 150, PZ = 120, ROAD = 24;                          // street grid of the city (blocks 126 × 96 m)

  /* ---------- shared uniforms (theme-dependent values are set in applyTheme) ---------- */
  const U = {
    uNight: u(1), uTime: u(0), uFogC: u(col('#0c171b')), uFogK: u(1 / 3600),
    uSun: u(new THREE.Vector3(-.5, .75, .45).normalize()), uSunC: u(col('#ffffff')), uSkyC: u(col('#ffffff')),
    uS: u(S.clone()), uSphC: u(col('#2fdcbc')), uF: u(1000), uPx: u(1)
  };

  const FOG = `
    uniform vec3 uFogC; uniform float uFogK;
    vec3 fogMix(vec3 c, float dist){ float f = 1. - exp(-pow(dist * uFogK, 1.55)); return mix(c, uFogC, f); }
    float fogAmt(float dist){ return 1. - exp(-pow(dist * uFogK, 1.55)); }
    float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }`;

  /* ---------- sky ---------- */
  const skyU = { uZen: u(col('#000')), uHor: u(col('#000')), uGlow: u(col('#000')), uNight: U.uNight };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(12000, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: skyU,
    vertexShader: `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 uZen, uHor, uGlow; uniform float uNight; varying vec3 vD;
      float hs(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main(){ vec3 d = normalize(vD); float e = d.y;
        vec3 c = mix(uHor, uZen, pow(clamp(e, 0., 1.), .5));
        c += uGlow * exp(-max(e, 0.) * 11.) * (.55 + .45 * smoothstep(-.3, .7, d.x));
        if (uNight > .5 && e > .02) { vec3 q = d * 380.; vec3 id = floor(q); float h = hs(id);
          if (h > .9965) { vec3 f = fract(q) - .5; float s = smoothstep(.22, 0., length(f)); c += vec3(.75, .86, .9) * s * (h - .9965) / .0035 * smoothstep(.02, .25, e) * .9; } }
        gl_FragColor = vec4(c, 1.); }`
  }));
  sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);

  /* ---------- ground: streets, pavements, lots, the sphere's plaza ---------- */
  const gU = Object.assign({ uAsph: u(col('#000')), uLot: u(col('#000')), uWalk: u(col('#000')), uPlaza: u(col('#000')), uLamp: u(col('#ff9a45')), uMark: u(col('#fff')), uRing: u(col('#2fdcbc')) }, U);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(26000, 26000, 1, 1), new THREE.ShaderMaterial({
    uniforms: gU, defines: { PX: PX.toFixed(1), PZ: PZ.toFixed(1), ROAD: ROAD.toFixed(1) },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: FOG + `
      uniform float uNight; uniform vec3 uAsph, uLot, uWalk, uPlaza, uLamp, uMark, uRing, uS, uSphC; varying vec3 vW;
      float band(float x, float e){ float w = fwidth(x) * .75 + 1e-4; return 1. - smoothstep(e - w, e + w, x); }
      void main(){
        vec2 p = vW.xz; float dist = length(cameraPosition - vW);
        float ax = abs(mod(p.x + PX * .5, PX) - PX * .5), az = abs(mod(p.y + PZ * .5, PZ) - PZ * .5), hw = ROAD * .5;
        float dS = length(p - uS.xz), plaza = 1. - smoothstep(196., 214., dS);
        float rx = band(ax, hw), rz = band(az, hw), road = max(rx, rz) * (1. - plaza);
        float walk = max(band(ax, hw + 5.), band(az, hw + 5.)) * (1. - road) * (1. - plaza);
        vec3 c = mix(uLot, uWalk, walk); c = mix(c, uAsph, road);
        /* lane marks: faint dashes on the long streets, a solid centre line */
        float fade = 1. - smoothstep(600., 1800., dist);
        float dashZ = band(abs(ax - 6.), .14) * step(.55, fract(p.y / 9.)) + band(ax, .12);
        float dashX = band(abs(az - 6.), .14) * step(.55, fract(p.x / 9.)) + band(az, .12);
        float mk = (rx * (1. - rz) * dashZ + rz * (1. - rx) * dashX) * (1. - plaza) * fade;
        c = mix(c, uMark, clamp(mk, 0., 1.) * mix(.28, .07, uNight));
        /* the plaza: stone rings + radial seams, a teal light ring where the sphere meets the ground */
        float ang = atan(p.y - uS.z, p.x - uS.x);
        float seams = max(band(abs(fract(dS / 14.) - .5) * 14., .12), band(abs(fract(ang * 9.549) - .5) * dS * .1047, .1)) * (1. - smoothstep(60., 200., dist * .2));
        vec3 pc = mix(uPlaza, uPlaza * mix(.86, 1.35, uNight), seams * .6);
        c = mix(c, pc, plaza);
        c += uRing * (exp(-pow((dS - 61.) / 2.2, 2.)) * .7 + exp(-pow((dS - 150.) / 1.4, 2.)) * .35) * uNight * plaza;
        /* street lamps every 32 m on both kerbs: warm pools at night */
        if (uNight > .5) {
          float lz = exp(-(pow(abs(ax - hw - 1.) , 2.) + pow(mod(p.y, 32.) - 16., 2.)) / 70.);
          float lx = exp(-(pow(abs(az - hw - 1.) , 2.) + pow(mod(p.x, 32.) - 16., 2.)) / 70.);
          c += uLamp * max(lz, lx) * .55 * (1. - plaza) + uLamp * road * .018;
          c += uSphC * (.35 / (1. + pow(max(dS - 50., 0.) / 70., 2.)));
        } else { c += uSphC * (.25 / (1. + pow(max(dS - 50., 0.) / 60., 2.))); }
        gl_FragColor = vec4(fogMix(c, dist), 1.); }`
  }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(2000, 0, -5000); ground.renderOrder = -5; scene.add(ground);

  /* ---------- buildings ---------- */
  const boxes = [], beacons = [];
  (function city() {
    const r = rng(51051);
    const g = (x, z, cx, cz, s) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (s * s));
    const add = (x, y0, z, w, h, d, st, seed) => boxes.push([x, y0, z, w, h, d, st, seed]);
    for (let iz = -44; iz <= -1; iz++) {
      const z0 = iz * PZ, zc = z0 + PZ / 2, dz = 130 - zc;
      const xmin = -.8 * dz - 300, xmax = 1.5 * dz + 300;
      for (let ix = Math.floor(xmin / PX); ix <= Math.ceil(xmax / PX); ix++) {
        const x0 = ix * PX, xc = x0 + PX / 2;
        if (Math.hypot(xc, zc) < 250) continue;                        // the plaza around the sphere
        const tall = 300 * g(xc, zc, 1150, -1750, 480) + 250 * g(xc, zc, 1750, -1900, 520) + 270 * g(xc, zc, -120, -2500, 560) + 190 * g(xc, zc, 3100, -3300, 820) + 160 * g(xc, zc, -1400, -3600, 700);
        const mid = 18 + 46 * sm(250, 1500, -zc), near = sm(250, 900, Math.hypot(xc, zc));
        const inX = PX - ROAD - 10, inZ = PZ - ROAD - 10;                 // buildable part of the block
        const far = dz > 3200;
        let lots;                                                       // split the block into 1..4 lots
        const k = r();
        if (far || tall > 140 && k < .55) lots = [[xc, zc, inX, inZ]];
        else if (k < .35) lots = [[xc - inX / 4, zc, inX / 2 - 3, inZ], [xc + inX / 4, zc, inX / 2 - 3, inZ]];
        else if (k < .7) lots = [[xc - inX / 4, zc - inZ / 4, inX / 2 - 3, inZ / 2 - 3], [xc + inX / 4, zc - inZ / 4, inX / 2 - 3, inZ / 2 - 3], [xc, zc + inZ / 4, inX, inZ / 2 - 3]];
        else lots = [[xc - inX / 4, zc - inZ / 4, inX / 2 - 3, inZ / 2 - 3], [xc + inX / 4, zc - inZ / 4, inX / 2 - 3, inZ / 2 - 3], [xc - inX / 4, zc + inZ / 4, inX / 2 - 3, inZ / 2 - 3], [xc + inX / 4, zc + inZ / 4, inX / 2 - 3, inZ / 2 - 3]];
        for (const [lx, lz, lw, ld] of lots) {
          let h = (6 + mid * (.3 + 1.1 * Math.pow(r(), 1.6)) + tall * Math.pow(r(), .75)) * (.3 + .7 * near);
          if (dz < 520) h = Math.min(h, 16 + r() * 26);                // low-rise in the foreground
          h = Math.min(h, 40 + Math.max(0, dz - 300) * .24 + r() * 20);   // heights grow with distance: no wall of towers up close
          h = Math.max(7, h);
          const seed = r();
          let w = lw - 2 - r() * 6, d = ld - 2 - r() * 6;
          let st = h > 110 ? (r() < .7 ? 0 : 1) : h > 38 ? (r() < .5 ? 1 : (r() < .5 ? 3 : 0)) : (r() < .6 ? 2 : 3);
          if (h > 110) { w = Math.min(w, 36 + r() * 22); d = Math.min(d, 34 + r() * 22); }
          const jx = (lw - w) * (r() - .5) * .6, jz = (ld - d) * (r() - .5) * .6, x = lx + jx, z = lz + jz;
          if (h > 110 && r() < .8) {                                    // a podium, then set-back tiers
            add(x, 0, z, lw - 3, 14 + r() * 8, ld - 3, 1, r());
            const h1 = h * (.55 + r() * .12), h2 = h * (.82 + r() * .08);
            add(x, 0, z, w, h1, d, st, seed); add(x, h1, z, w * .84, h2 - h1, d * .84, st, seed); add(x, h2, z, w * .64, h - h2, d * .64, st, seed);
            if (r() < .55) { const sp = h * (.08 + r() * .1); add(x, h, z, 2.4, sp, 2.4, 4, 0); beacons.push([x, h + sp + .8, z, r()]); }
            else beacons.push([x, h + 1, z, r()]);
          } else {
            if (h > 60 && r() < .45) { const h1 = h * (.7 + r() * .15); add(x, 0, z, w, h1, d, st, seed); add(x + w * .08, h1, z - d * .06, w * .7, h - h1, d * .72, st, seed); }
            else add(x, 0, z, w, h, d, st, seed);
            if (h > 95) beacons.push([x, h + 1, z, r()]);
            if (st === 2 && h < 40 && r() < .5) add(x + w * .25, h, z - d * .2, w * .18, 3, d * .22, 4, 0);   // rooftop plant room
          }
        }
      }
    }
  })();
  const bU = Object.assign({ uFac: u([col('#000'), col('#000'), col('#000'), col('#000'), col('#000')]), uGlass: u(col('#000')), uGlassSky: u(col('#000')), uRoof: u(col('#000')),
    uWarm: u(col('#ffc77f')), uCool: u(col('#dcecff')), uTeal: u(col('#5ff0d4')) }, U);
  const bGeo = new THREE.BoxGeometry(1, 1, 1); bGeo.translate(0, .5, 0);
  const bMat = new THREE.ShaderMaterial({
    uniforms: bU,
    vertexShader: `attribute vec3 iSize; attribute vec2 iMeta; varying vec3 vW, vN, vL; varying vec2 vM; varying vec3 vSz;
      void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz; vN = normal; vL = (position + vec3(.5, 0., .5)) * iSize; vM = iMeta; vSz = iSize;
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: FOG + `
      uniform float uNight; uniform vec3 uSun, uSunC, uSkyC, uS, uSphC, uFac[5], uGlass, uGlassSky, uRoof, uWarm, uCool, uTeal;
      varying vec3 vW, vN, vL, vSz; varying vec2 vM;
      float boxAA(vec2 f, vec2 a, vec2 b, vec2 w){ vec2 s = smoothstep(a - w, a + w, f) * (1. - smoothstep(b - w, b + w, f)); return s.x * s.y; }
      void main(){
        vec3 n = normalize(vN), V = cameraPosition - vW; float dist = length(V); V /= dist;
        float seed = vM.x, st = vM.y; vec3 c;
        float tint = h21(vec2(seed * 91.7, 3.1));
        vec3 base = uFac[int(st + .5)] * mix(.82, 1.12, tint);
        if (n.y > .5) {
          c = uRoof * mix(.85, 1.1, tint) * (uNight > .5 ? 1. : (.62 + .5 * max(dot(n, uSun), 0.)));
        } else {
          float face = abs(n.x) > .5 ? (n.x > 0. ? 1. : 2.) : (n.z > 0. ? 3. : 4.);
          float uu = abs(n.x) > .5 ? vL.z : vL.x, vv = vW.y;
          float flH = st < .5 ? 4. : st < 1.5 ? 3.8 : st < 2.5 ? 3. : 3.5, cw = st < .5 ? 1.6 : st < 1.5 ? 3.2 : st < 2.5 ? 3.8 : 2.6;
          vec2 g = vec2(uu / cw, vv / flH), cell = floor(g), f = fract(g), fw = fwidth(g) * .8 + 1e-4;
          vec2 a = st < .5 ? vec2(.06, .1) : st < 1.5 ? vec2(.0, .32) : st < 2.5 ? vec2(.22, .28) : vec2(.2, .26);
          vec2 b = st < .5 ? vec2(.94, .94) : st < 1.5 ? vec2(1., .86) : st < 2.5 ? vec2(.78, .8) : vec2(.8, .78);
          float isWin = st > 3.5 ? 0. : 1.;
          float mull = st > .5 && st < 1.5 ? (1. - boxAA(vec2(fract(g.x * 2.), .5), vec2(.0, 0.), vec2(.9, 1.), vec2(fw.x * 2., .1)) * .0) : 1.;
          float win = boxAA(f, a, b, fw) * isWin * mull;
          float area = (b.x - a.x) * (b.y - a.y) * isWin;
          float detail = 1. - smoothstep(.32, .75, max(fw.x, fw.y));
          if (vv < 5.5 && st < 3.5) { win = boxAA(f, vec2(.04, .05), vec2(.96, .78), fw) * isWin; }   // shop fronts
          /* night: which windows are lit — offices in runs of columns, homes one by one */
          float grp = st < 1.5 ? floor(cell.x / 5.) : cell.x;
          float rr = h21(vec2(grp + face * 37. + seed * 113., cell.y * 1.37 + seed * 71.));
          float r2 = h21(vec2(cell.x * 1.7 + face * 11. + seed * 29., cell.y + seed * 13.));
          float pLit = st < .5 ? .3 : st < 1.5 ? .34 : st < 2.5 ? .3 : .24;
          float top = smoothstep(vSz.y - .5, vSz.y + 1., vv);
          if (uNight > .5) {
            float lit = step(rr, pLit) * step(.12, r2);
            vec3 lc = r2 < .72 ? uWarm : (r2 < .96 ? uCool : uTeal);
            float I = (.35 + .75 * h21(vec2(r2 * 7., rr * 3.))) * (vv < 5.5 ? .8 : 1.);
            vec3 glass = uGlass + uGlassSky * pow(1. - abs(dot(n, V)), 3.) * .6;
            vec3 wc = mix(glass, lc * I, lit);
            vec3 avg = mix(glass, (uWarm * .8 + uCool * .2) * .6, pLit * .9);
            vec3 fac = base * (.55 + .45 * (vv < 30. ? exp(-vv / 30.) : 0.)) + uWarm * .03 * exp(-vv / 14.);
            vec3 near = mix(fac, wc, win), farc = mix(fac, avg, area);
            c = mix(farc, near, detail);
          } else {
            float diff = max(dot(n, uSun), 0.);
            vec3 L = uSkyC * (.42 + .08 * face / 4.) + uSunC * diff * 1.15;
            vec3 R = reflect(-V, n); float fr = pow(1. - max(dot(n, V), 0.), 4.);
            vec3 glass = mix(uGlass, uGlassSky, clamp(.45 + .55 * R.y + fr * .5, 0., 1.)) * (.85 + .3 * diff) + uSunC * pow(max(dot(R, uSun), 0.), 60.) * .5;
            if (st < .5) glass = mix(glass, glass * 1.08, h21(vec2(cell.y, seed)) * .4);
            vec3 fac = base * L;
            vec3 wc = mix(glass, glass * .7, step(.6, r2) * .25);
            vec3 near = mix(fac, wc, win), farc = mix(fac, mix(glass, glass * .8, .2), area);
            c = mix(farc, near, detail);
          }
        }
        /* the sphere lights the buildings that face it */
        vec3 toS = uS - vW; float dS = length(toS);
        c += uSphC * max(dot(n, toS / dS), 0.) / (1. + pow(dS / 260., 2.)) * (uNight > .5 ? .22 : .08);
        gl_FragColor = vec4(fogMix(c, dist), 1.); }`
  });
  const bMesh = new THREE.InstancedMesh(bGeo, bMat, boxes.length);
  { const m = new THREE.Matrix4(), sz = new Float32Array(boxes.length * 3), me = new Float32Array(boxes.length * 2);
    boxes.forEach((b, i) => { m.makeScale(b[3], b[4], b[5]); m.setPosition(b[0], b[1], b[2]); bMesh.setMatrixAt(i, m); sz.set([b[3], b[4], b[5]], i * 3); me.set([b[7], b[6]], i * 2); });
    bGeo.setAttribute('iSize', new THREE.InstancedBufferAttribute(sz, 3)); bGeo.setAttribute('iMeta', new THREE.InstancedBufferAttribute(me, 2));
    bMesh.instanceMatrix.needsUpdate = true; bMesh.frustumCulled = false; }
  scene.add(bMesh);

  /* ---------- lights in the city: cars, street lamps, aviation beacons (all Points) ---------- */
  const PTV = `uniform float uF, uPx, uSz, uMinPx; varying float vDist;
    float pSize(vec4 mv){ vDist = length(mv.xyz); return clamp(uSz * uF / max(-mv.z, 1.), uMinPx, 5.) * uPx; }`;
  const PTF = FOG + `varying float vDist; varying vec3 vC; varying float vA;
    void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .08, d) * vA * (1. - fogAmt(vDist) * .92); if (a < .004) discard; gl_FragColor = vec4(vC * a, a); }`;
  const blendAdd = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  /* cars: right-hand traffic; on the long streets (towards us) heads are white, tails red */
  const carU = Object.assign({ uSz: u(1.3), uMinPx: u(.9), uSpanZ: u(new THREE.Vector2(-5600, 160)), uSpanX: u(new THREE.Vector2(-4200, 8000)) }, U);
  const cars = (() => {
    const r = rng(777), A = [], Bv = [];
    const lane = (axis, line, len) => { for (const off of [-8.5, -4.5, 4.5, 8.5]) { const dir = off > 0 ? -1 : 1; const n = Math.round(len / (axis ? 85 : 70) * (.5 + r())); for (let i = 0; i < n; i++) { A.push(axis, line, off, dir); Bv.push(r(), (axis ? 9 : 11) + r() * 7); } } };
    for (let ix = -26; ix <= 52; ix++) lane(0, ix * PX, 5760);
    for (let iz = -46; iz <= -2; iz++) lane(1, iz * PZ, 12200);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(A.length / 4 * 3), 3));
    geo.setAttribute('aRoad', new THREE.Float32BufferAttribute(A, 4)); geo.setAttribute('aMove', new THREE.Float32BufferAttribute(Bv, 2));
    const p = new THREE.Points(geo, new THREE.ShaderMaterial(Object.assign({ uniforms: carU,
      vertexShader: PTV + `uniform float uTime, uNight; uniform vec2 uSpanZ, uSpanX; attribute vec4 aRoad; attribute vec2 aMove; varying vec3 vC; varying float vA;
        void main(){ vec2 sp = aRoad.x < .5 ? uSpanZ : uSpanX; float L = sp.y - sp.x; float s = sp.x + mod(aMove.x * L + aRoad.w * aMove.y * uTime, L);
          vec3 w = aRoad.x < .5 ? vec3(aRoad.y + aRoad.z, .9, s) : vec3(s, .9, aRoad.y + aRoad.z);
          float dS = length(w.xz); if (dS < 215.) w.y = -50.;                  /* no traffic across the plaza */
          vec4 mv = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = pSize(mv);
          bool head = aRoad.x < .5 ? aRoad.w > 0. : aRoad.w > 0.;
          if (uNight > .5) { vC = head ? vec3(1., .93, .8) * (aRoad.x < .5 ? 1.5 : 1.) : vec3(1., .12, .07) * (aRoad.x < .5 ? 1.5 : 1.); vA = 1.; }
          else { float k = fract(aMove.x * 37.); vC = k < .3 ? vec3(.12) : k < .55 ? vec3(.85) : k < .7 ? vec3(.25, .3, .38) : k < .8 ? vec3(.6, .12, .1) : vec3(.45); vA = .55; } }`,
      fragmentShader: PTF }, blendAdd)));
    p.frustumCulled = false; return p;
  })();
  scene.add(cars);
  /* street lamps (night only) */
  const lampU = Object.assign({ uSz: u(.8), uMinPx: u(.7) }, U);
  const lamps = (() => {
    const P = [], hw = ROAD / 2 + 1;
    for (let ix = -26; ix <= 52; ix++) for (let z = -5600; z < 0; z += 32) { const x = ix * PX; if (Math.hypot(x, z) < 225 || x < -.85 * (130 - z) - 400 || x > 1.55 * (130 - z) + 400) continue; P.push(x - hw, 7, z, x + hw, 7, z + 16); }
    for (let iz = -46; iz <= -2; iz++) { const z = iz * PZ; for (let x = -4200; x < 8000; x += 32) { if (Math.hypot(x, z) < 225 || x < -.85 * (130 - z) - 400 || x > 1.55 * (130 - z) + 400) continue; P.push(x, 7, z - hw, x + 16, 7, z + hw); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    const p = new THREE.Points(geo, new THREE.ShaderMaterial(Object.assign({ uniforms: lampU,
      vertexShader: PTV + `varying vec3 vC; varying float vA; void main(){ vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = pSize(mv); vC = vec3(1., .66, .34) * .9; vA = 1.; }`,
      fragmentShader: PTF }, blendAdd)));
    p.frustumCulled = false; return p;
  })();
  scene.add(lamps);
  /* aviation beacons on the tall roofs: slow red blink */
  const beaconU = Object.assign({ uSz: u(3.2), uMinPx: u(1.6) }, U);
  const beaconPts = (() => {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(beacons.flatMap(b => [b[0], b[1], b[2]]), 3));
    geo.setAttribute('aPh', new THREE.Float32BufferAttribute(beacons.map(b => b[3]), 1));
    const p = new THREE.Points(geo, new THREE.ShaderMaterial(Object.assign({ uniforms: beaconU,
      vertexShader: PTV + `uniform float uTime, uNight; attribute float aPh; varying vec3 vC; varying float vA;
        void main(){ vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = pSize(mv);
          float k = fract(uTime * .5 + aPh); vC = vec3(1., .16, .1) * 3.; vA = (uNight > .5 ? 1. : .35) * (.25 + .75 * smoothstep(.0, .06, k) * (1. - smoothstep(.22, .34, k))); }`,
      fragmentShader: PTF }, blendAdd)));
    p.frustumCulled = false; return p;
  })();
  scene.add(beaconPts);

  /* ---------- the LED sphere ---------- */
  const blank = new THREE.DataTexture(new Uint8Array(4), 1, 1); blank.needsUpdate = true;
  const sU = {
    uR: u(SR), uBB: u(SR * 1.3), uRight: u(new THREE.Vector3(1, 0, 0)), uUp: u(new THREE.Vector3(0, 1, 0)), uVP: u(new THREE.Matrix4()),
    uDisc: u(new THREE.Vector3(0, 0, 1)), uRes: u(new THREE.Vector2(1, 1)), uDpr: u(1), uCell: u(.01),
    uTexA: u(blank), uTexB: u(blank), uModeA: u(0), uModeB: u(0), uMix: u(0), uScroll: u(0),
    uRects: u([0, 1, 2, 3].map(() => new THREE.Vector4(-9e3, -9e3, -9e3, -9e3))), uDim: u(.22),
    uShell: u(col('#000')), uOff: u(col('#000')), uRim: u(col('#000')), uGold: u(col('#e9c46a')), uGain: u(2), uLow: u(col('#000')),
    uAurA: u(col('#2fdcbc')), uAurB: u(col('#e9c46a')),
    uS: U.uS, uNight: U.uNight, uTime: U.uTime, uSun: U.uSun
  };
  const sphere = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: sU, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: `uniform vec3 uS, uRight, uUp; uniform float uBB; varying vec3 vW;
      void main(){ vec3 w = uS + (uRight * position.x + uUp * position.y) * uBB; vW = w; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }`,
    fragmentShader: `
      uniform vec3 uS, uDisc, uShell, uOff, uRim, uGold, uLow, uSun, uAurA, uAurB; uniform float uR, uDpr, uCell, uMix, uScroll, uDim, uGain, uNight, uTime, uModeA, uModeB;
      uniform vec2 uRes; uniform mat4 uVP; uniform sampler2D uTexA, uTexB; uniform vec4 uRects[4]; varying vec3 vW;
      const float PI = 3.14159265, TAU = 6.2831853;
      vec4 aurora(vec3 p){
        float t = uTime * .07;
        float a = sin(p.x * 3.3 + t * 2.1 + sin(p.y * 5.1 - t * 1.6) * 1.7);
        float b = sin(p.y * 7.0 - t * 2.7 + sin(p.x * 2.6 + t * 1.2) * 2.2 + p.z * 1.5);
        float r1 = exp(-pow((p.y - .55 - .12 * a) * 6.5, 2.)), r2 = exp(-pow((p.y - .3 - .1 * b) * 8., 2.)), r3 = exp(-pow((p.y - .78 + .08 * a * b) * 9., 2.));
        float v = r1 * (.65 + .35 * b) + r2 * .8 * (.6 + .4 * a) + r3 * .5;
        vec3 c = mix(uAurA, uAurB, smoothstep(.2, .9, r2 + .3 * b));
        return vec4(c, clamp(v, 0., 1.) * .5 * smoothstep(.95, .55, p.y)); }
      vec4 slot(sampler2D tx, float mode, vec2 uvS, vec2 uvL, vec3 nc){
        if (mode > 1.5) return aurora(nc);
        if (mode > .5) return texture2D(tx, uvL);
        if (uvS.x < 0. || uvS.y < 0. || uvS.x > 1. || uvS.y > 1.) return vec4(0.);
        return texture2D(tx, uvS); }
      float sdSeg(vec2 p, vec2 a, vec2 b, out float h){ vec2 pa = p - a, ba = b - a; h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h); }
      void main(){
        vec3 ro = cameraPosition, rd = normalize(vW - cameraPosition), oc = ro - uS;
        float b = dot(oc, rd), c0 = dot(oc, oc) - uR * uR, hh = b * b - c0;
        float dc = sqrt(max(dot(oc, oc) - b * b, 0.)), aw = fwidth(dc) + 1e-4, alpha = clamp((uR - dc) / aw + .5, 0., 1.);
        if (alpha <= 0.) discard;
        float t = -b - sqrt(max(hh, 0.)); vec3 P = ro + rd * t; if (P.y < 0.) discard;
        vec3 n = normalize(P - uS), V = -rd;
        float phi = asin(clamp(n.y, -1., 1.)), lam = atan(n.x, n.z);
        float i = floor((phi + PI * .5) / uCell), phc = (i + .5) * uCell - PI * .5;
        float nl = max(3., floor(TAU * cos(phc) / uCell)), dl = TAU / nl;
        float j = floor((lam + PI) / dl), lac = (j + .5) * dl - PI;
        vec2 lc = vec2((lam - lac) * cos(phi) / uCell, (phi - phc) / uCell);
        float px = max(fwidth(phi), fwidth(lam) * cos(phi)) / uCell;            /* cells per pixel */
        float rad = .33, aa = px * .8 + .02;
        float dotm = 1. - smoothstep(rad - aa, rad + aa, length(lc));
        dotm = mix(dotm, .55, smoothstep(.28, .7, px));                          /* limb: average, no moiré */
        /* content, sampled once per LED at its centre */
        vec3 nc = vec3(cos(phc) * sin(lac), sin(phc), cos(phc) * cos(lac));
        vec4 cl = uVP * vec4(uS + nc * uR, 1.); vec2 nd = cl.xy / cl.w;
        vec2 sp = vec2((nd.x * .5 + .5) * uRes.x, (.5 - nd.y * .5) * uRes.y);
        vec2 q = vec2(sp.x - uDisc.x, uDisc.y - sp.y) / uDisc.z, uvS = q * .5 + .5;
        vec2 uvL = vec2(fract((lac + uScroll) / TAU + .5), (phc + PI / 3.) / (PI * 5. / 6.));
        vec4 C = mix(slot(uTexA, uModeA, uvS, uvL, nc), slot(uTexB, uModeB, uvS, uvL, nc), uMix);
        float dm = 0.;
        for (int k = 0; k < 4; k++) { vec4 r = uRects[k]; vec2 dd = max(r.xy - sp, sp - r.zw); dm = max(dm, 1. - smoothstep(-26., 20., max(dd.x, dd.y))); }
        float lvl = mix(1., uDim, dm), face = clamp(dot(n, V), 0., 1.), facing = pow(face, .35);
        vec3 led;
        if (uNight > .5) led = uOff + C.rgb * C.a * uGain * lvl * facing;
        else led = uOff + C.rgb * C.a * uGain * lvl * facing;
        vec3 R = reflect(-V, n);
        vec3 shell = uNight > .5 ? uShell * (.55 + .45 * n.y) : uShell * (.7 + .3 * max(dot(n, uSun), 0.)) + vec3(.22) * pow(max(dot(R, uSun), 0.), 14.);
        vec3 col = mix(shell, led, dotm);
        /* a thin light line on the silhouette (as in the reference), strongest upper-left, plus a faint sheen */
        float ePx = (uR - dc) / aw, side = .25 + .75 * smoothstep(-.4, .9, dot(n, normalize(vec3(-.72, .62, .3))));
        col += uRim * (exp(-ePx / 1.3) * .9 + exp(-ePx / 14.) * .1 + pow(1. - face, 6.) * .05) * side;
        col += uLow * smoothstep(.4, -.05, n.y);                                  /* the city's light on its lower half */
        /* the short gold streak on the right shoulder (as in the reference) */
        vec2 fp = vec2(gl_FragCoord.x / uDpr, uRes.y - gl_FragCoord.y / uDpr);
        float an = .365 * PI; vec2 A = uDisc.xy + vec2(cos(an), -sin(an)) * uDisc.z * .985, B = A + normalize(vec2(-.38, 1.)) * uDisc.z * .11;
        float hs; float sd = sdSeg(fp, A, B, hs), th = max(1.1, uDisc.z / 330.);
        col += uGold * (1. - smoothstep(th * .5, th * .5 + 1., sd)) * pow(1. - hs, 1.3) * (uNight > .5 ? 2.2 : 1.1);
        gl_FragColor = vec4(col, alpha); }`
  }));
  sphere.frustumCulled = false; sphere.renderOrder = 10; scene.add(sphere);

  /* ---------- sphere contents (2D canvases → textures) ---------- */
  const N = 512;
  const mkC = (w, h) => { const c = D.createElement('canvas'); c.width = w; c.height = h; return c; };
  const SCH = [
    { id: 'brand', mode: 0, zh: '品牌', en: 'Brand' },
    { id: 'candles', mode: 0, zh: 'K 线', en: 'Candles' },
    { id: 'dodo', mode: 0, zh: 'Dodo', en: 'Dodo' },
    { id: 'coins', mode: 1, zh: '币种环带', en: 'Coin bands' },
    { id: 'aurora', mode: 2, zh: '极光', en: 'Aurora' }
  ];
  SCH.forEach(s => {
    if (s.mode === 2) return;
    s.cv = s.mode === 1 ? mkC(2048, 512) : mkC(N, N); s.cx = s.cv.getContext('2d');
    s.tex = new THREE.CanvasTexture(s.cv); s.tex.colorSpace = THREE.SRGBColorSpace; s.tex.generateMipmaps = false; s.tex.minFilter = THREE.LinearFilter;
    if (s.mode === 1) s.tex.wrapS = THREE.RepeatWrapping;
  });
  const ledDay = false; /* r52: LED content always drawn bright (dark shell by day too) */
  const logo = new Image(); let logoOK = false; logo.onload = () => { logoOK = true; tintLogo(); drawAll(); }; logo.src = 'assets/3dtrading-logo-white.svg';
  let logoT = null;
  function tintLogo() {
    if (!logoOK) return;
    const w = 732, h = Math.round(732 * 88.29564 / 366.41956), c = mkC(w, h), x = c.getContext('2d');
    x.drawImage(logo, 0, 0, w, h); x.globalCompositeOperation = 'source-in';
    const gr = x.createLinearGradient(0, 0, w, 0);
    if (ledDay) { gr.addColorStop(0, '#08806b'); gr.addColorStop(1, '#0d9a7c'); } else { gr.addColorStop(0, '#5eeccf'); gr.addColorStop(.6, '#a7e9c8'); gr.addColorStop(1, '#e3d79f'); }
    x.fillStyle = gr; x.fillRect(0, 0, w, h); logoT = c;
  }
  /* candles: a seeded random walk, scrolled */
  const series = (() => { const r = rng(4242), a = []; let p = 100; for (let i = 0; i < 400; i++) { const o = p, ch = (r() - .48) * 3.2 + Math.sin(i / 23) * .9, c = o + ch, hi = Math.max(o, c) + r() * 1.6, lo = Math.min(o, c) - r() * 1.6; a.push([o, hi, lo, c, .3 + r()]); p = c; } return a; })();
  const twinkle = (() => { const r = rng(99), a = []; for (let i = 0; i < 160; i++) a.push([r(), r(), r(), r()]); return a; })();

  let W = 0, H = 0, DPR = 1, day = false, G = null, ST = null, VIS = null, still = !!(RM && RM.matches);
  const toCx = qx => (qx * .5 + .5) * N, toCy = qy => (.5 - qy * .5) * N;

  function ambient(c, t, a) {          /* faint twinkling LEDs over the visible face */
    const x0 = toCx(VIS.x0), x1 = toCx(VIS.x1), y0 = toCy(VIS.y1), y1 = toCy(VIS.y0);
    for (const p of twinkle) { const k = .5 + .5 * Math.sin(t * (.6 + p[2] * 1.6) + p[3] * 40); if (k < .55) continue;
      c.fillStyle = (p[2] < .8 ? (ledDay ? 'rgba(10,140,118,' : 'rgba(80,230,200,') : (ledDay ? 'rgba(190,140,40,' : 'rgba(240,200,110,')) + (a * (k - .55) / .45).toFixed(3) + ')';
      c.fillRect(x0 + p[0] * (x1 - x0), y0 + p[1] * (y1 - y0), 3, 3); }
  }
  function drawBrand(t) {
    const s = SCH[0], c = s.cx; c.clearRect(0, 0, N, N); ambient(c, t, .55);
    const X0 = toCx(ST.x0), X1 = toCx(ST.x1), Y0 = toCy(ST.y1), Y1 = toCy(ST.y0), w = X1 - X0, h = Y1 - Y0;
    if (logoT) {
      const ar = logoT.width / logoT.height; let lh = Math.min(h * .52, w * .78 / ar), lw = lh * ar;
      const x = X0 + (w - lw) / 2, y = Y0 + (h - lh) / 2 - h * .07;
      c.drawImage(logoT, x, y, lw, lh);
      /* a light sweep across the mark */
      const ph = still ? .3 : (t * .16) % 1.4 - .2, sx = x + ph * lw;
      c.save(); c.globalCompositeOperation = 'source-atop';
      const g = c.createLinearGradient(sx - lw * .12, 0, sx + lw * .12, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, ledDay ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(x, y - 4, lw, lh + 8); c.restore();
      /* a thin rule under it, with a travelling bead */
      const ry = y + lh + h * .13, rw = lw * .62, rx = X0 + (w - rw) / 2;
      c.fillStyle = ledDay ? 'rgba(8,128,107,.55)' : 'rgba(62,230,198,.45)'; c.fillRect(rx, ry, rw, 2.2);
      const bx = rx + ((still ? .6 : (t * .22) % 1)) * rw; c.fillStyle = ledDay ? '#c4922a' : '#f0cf7a'; c.fillRect(bx - 5, ry - 1.4, 10, 5);
    }
  }
  function drawCandles(t) {
    const s = SCH[1], c = s.cx; c.clearRect(0, 0, N, N);
    const X0 = toCx(VIS.x0) + 6, X1 = toCx(Math.min(VIS.x1, ST.x1 + .25)) - 6, Y0 = toCy(ST.y1), Y1 = toCy(ST.y0), w = X1 - X0, h = Y1 - Y0;
    const n = 22, cw = w / n, off = still ? 40 : t * 1.25, i0 = Math.floor(off), fr = off - i0;
    let lo = 1e9, hi = -1e9; for (let k = 0; k <= n + 1; k++) { const d = series[(i0 + k) % series.length]; lo = Math.min(lo, d[2]); hi = Math.max(hi, d[1]); }
    const pad = (hi - lo) * .12, Y = v => Y0 + h * .06 + (1 - (v - lo + pad) / (hi - lo + 2 * pad)) * h * .74;
    const up = ledDay ? '#0f9f6e' : '#22e3a2', dn = ledDay ? '#e0464e' : '#ff5b6b';
    for (let k = 0; k <= n + 1; k++) {
      const d = series[(i0 + k) % series.length], x = X0 + (k - fr) * cw; if (x < X0 - cw || x > X1) continue;
      const isUp = d[3] >= d[0]; c.fillStyle = isUp ? up : dn;
      c.fillRect(x + cw * .47, Y(d[1]), Math.max(1.5, cw * .07), Y(d[2]) - Y(d[1]));
      const yt = Y(Math.max(d[0], d[3])), yb = Y(Math.min(d[0], d[3])); c.fillRect(x + cw * .2, yt, cw * .6, Math.max(2, yb - yt));
      c.globalAlpha = .4; c.fillRect(x + cw * .2, Y1 - h * .14 * d[4], cw * .6, h * .14 * d[4]); c.globalAlpha = 1;   // volume
    }
    const last = series[(i0 + n) % series.length][3], ly = Y(last);
    c.strokeStyle = ledDay ? 'rgba(8,128,107,.7)' : 'rgba(120,240,214,.75)'; c.lineWidth = 1.6; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(X0, ly); c.lineTo(X1, ly); c.stroke(); c.setLineDash([]);
  }
  function drawDodo(t) {
    const s = SCH[2], c = s.cx; c.clearRect(0, 0, N, N); ambient(c, t, .35);
    const X0 = toCx(ST.x0), X1 = toCx(ST.x1), Y0 = toCy(ST.y1), Y1 = toCy(ST.y0), w = X1 - X0, h = Y1 - Y0;
    const D0 = Math.min(h * .96, w * .5), cx = X0 + w / 2, cy = Y0 + h / 2, k = D0 / 220.5;   // the face circle of dodo.svg (r 110.25)
    const gl = c.createRadialGradient(cx, cy, D0 * .3, cx, cy, D0 * .85); gl.addColorStop(0, ledDay ? 'rgba(31,224,191,.55)' : 'rgba(31,224,191,.45)'); gl.addColorStop(1, 'rgba(31,224,191,0)');
    c.fillStyle = gl; c.fillRect(cx - D0, cy - D0, D0 * 2, D0 * 2);
    c.save(); c.translate(cx, cy); c.scale(k, k); c.translate(-169, -169);
    c.fillStyle = '#fcf1e0'; c.globalAlpha = ledDay ? 1 : .5; c.beginPath(); c.arc(169, 169, 110.25, 0, 6.2832); c.fill(); c.globalAlpha = 1;
    /* the eye: blinks every few seconds, glances left and right */
    const bt = still ? 9 : t % 4.6, blink = bt < .16 ? 1 - Math.abs(bt - .08) / .08 : 0, look = still ? 0 : Math.sin(t * .7) * 7;
    c.save(); c.translate(210 + look, 140); c.scale(1, Math.max(.06, 1 - blink)); c.translate(-210, -140);
    c.fillStyle = '#3f3b39'; c.beginPath(); c.ellipse(210.5, 140.5, 50.5, 52.5, 0, 0, 6.2832); c.fill();
    if (blink < .5) {
      c.fillStyle = '#fc6755'; c.fillRect(196.6, 134.7, 3.7, 44.8); c.fillRect(189.8, 146, 17.3, 23.2);
      c.fillStyle = '#0dae72'; c.fillRect(222, 118.2, 3.7, 54.8); c.fillRect(215.2, 128.8, 17.1, 33.2);
      c.fillStyle = '#fdf2e1'; c.beginPath(); c.arc(234.15, 106.45, 9.44, 0, 6.2832); c.fill();
    }
    c.restore(); c.restore();
  }
  function drawCoins() {          /* bands around the sphere at the latitudes of the clear area (lat–long canvas) */
    const s = SCH[3], c = s.cx, CW = 2048, CH = 512; c.clearRect(0, 0, CW, CH);
    const yv = ph => (1 - (ph + Math.PI / 3) / (Math.PI * 5 / 6)) * CH;
    const qx = (ST.x0 + ST.x1) / 2, bands = [[.27, .46, 0], [.79, .36, 1]];
    const coins = [['BTC', '#f7931a', '₿'], ['ETH', '#8c8cf0', 'Ξ'], ['BNB', '#f0b90b', 'B'], ['SOL', '#14f195', 'S'], ['XRP', '#b8c4cc', 'X'], ['DOGE', '#c2a633', 'Ð']];
    for (const [fy, fh, kind] of bands) {
      const y = ST.y1 - fy * (ST.y1 - ST.y0), half = fh * (ST.y1 - ST.y0) / 2;
      const p0 = latAt(qx, y + half), p1 = latAt(qx, y - half); if (p0 == null || p1 == null) continue;
      const ph = (p0 + p1) / 2, ya = yv(p0), yb = yv(p1), bh = yb - ya, kx = (CW / (2 * Math.PI)) / (CH / (Math.PI * 5 / 6)) / Math.max(.2, Math.cos(ph));
      c.fillStyle = ledDay ? 'rgba(10,125,104,.08)' : 'rgba(47,220,188,.10)'; c.fillRect(0, ya, CW, bh);
      c.fillStyle = ledDay ? 'rgba(10,125,104,.45)' : 'rgba(62,230,198,.5)'; c.fillRect(0, ya, CW, 1.5); c.fillRect(0, yb - 1.5, CW, 1.5);
      c.save(); c.translate(0, ya); c.scale(kx, 1);
      const fs = bh * .74, span = CW / kx; c.font = `700 ${fs}px -apple-system,"SF Pro Display","Helvetica Neue",Arial,sans-serif`; c.textBaseline = 'middle';
      const items = kind === 1 ? [['3dtrading', null, null]].concat(coins.slice(0, 3)) : (kind === 0 ? coins : coins.slice().reverse());
      const unit = items.reduce((a, it) => a + (it[1] ? fs * 1.15 : 0) + c.measureText(it[0]).width + fs * 1.6, 0);
      const reps = Math.max(1, Math.round(span / unit)), gap = (span - unit * reps) / (items.length * reps);
      let x = 0;
      for (let rp = 0; rp < reps; rp++) for (const [nm, colr, sym] of items) {
        if (colr) { c.fillStyle = colr; c.beginPath(); c.arc(x + fs * .45, bh / 2, fs * .45, 0, 6.2832); c.fill(); c.fillStyle = ledDay ? '#fff' : '#06100f'; c.font = `800 ${fs * .6}px -apple-system,Arial,sans-serif`; c.textAlign = 'center'; c.fillText(sym, x + fs * .45, bh / 2 + fs * .03); c.textAlign = 'left'; c.font = `700 ${fs}px -apple-system,"SF Pro Display","Helvetica Neue",Arial,sans-serif`; x += fs * 1.15; }
        c.fillStyle = nm === '3dtrading' ? (ledDay ? '#067a63' : '#7ff2da') : (ledDay ? '#0b2427' : '#e9f6f3'); c.fillText(nm, x, bh / 2 + fs * .04);
        x += c.measureText(nm).width + fs * 1.6 + gap;
      }
      c.restore();
    }
    s.tex.needsUpdate = true;
  }
  function drawScheme(i, t) {
    if (i === 0) drawBrand(t); else if (i === 1) drawCandles(t); else if (i === 2) drawDodo(t); else return;
    SCH[i].tex.needsUpdate = true;
  }
  function drawAll() { if (!ST) return; const t = clock(); drawScheme(0, t); drawScheme(1, t); drawScheme(2, t); drawCoins(); }

  /* ---------- geometry (identical to r50 on desktop) ---------- */
  function geo() {
    const mob = W <= 900; let cx, cy, R, hz;
    if (!mob) { cx = W * .30; cy = H * 1.097; R = H * .725; hz = H * .47; }   // r51: horizon behind the sphere's shoulders → the skyline rises on both sides
    else {
      const hero = D.querySelector('.hero'), hb = hero ? hero.getBoundingClientRect().bottom + (window.scrollY || 0) : H * .34;
      R = Math.min(W * .72, 340); cx = W * .30; cy = Math.max(118, hb * .44) + R;
      hz = cy - R * .62;           // r51: the horizon sits on the arc's shoulders so the skyline shows either side of it
    }
    return { mob, cx, cy, R, hz };
  }
  const ray = new THREE.Raycaster(), sph = new THREE.Sphere(S, SR), hit = new THREE.Vector3();
  function latAt(qx, qy) {         /* disc coords → latitude on the sphere (radians) */
    const sx = G.cx + qx * G.R, sy = G.cy - qy * G.R;
    ray.setFromCamera(new THREE.Vector2(sx / W * 2 - 1, 1 - sy / H * 2), cam);
    return ray.ray.intersectSphere(sph, hit) ? Math.asin(Math.max(-1, Math.min(1, (hit.y - S.y) / SR))) : null;
  }
  function textRects() {
    const sy = window.scrollY || 0, out = [];
    for (const sel of ['#hh', '.hero .lede', '.pts']) {
      const e = D.querySelector(sel); if (!e) continue; const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
      out.push([r.left - 16, r.top + sy - 12, r.right + 16, r.bottom + sy + 12]);
    }
    return out;
  }
  function stage(rects) {          /* the clear part of the visible face, in disc coords (y up) */
    const vis = { x0: Math.max(-1, -G.cx / G.R), x1: Math.min(1, (W - G.cx) / G.R), y0: Math.max(-1, (G.cy - H) / G.R), y1: 1 };
    const card = D.getElementById('card'), cr = card && card.getBoundingClientRect(), sy = window.scrollY || 0;
    const tb = rects.length ? Math.max(...rects.map(r => r[3])) : 0;
    let y0 = vis.y0 + .05, y1 = (G.cy - tb - 10) / G.R;
    if (G.mob && cr) y0 = Math.max(y0, (G.cy - (cr.top + sy)) / G.R + .05);
    if (y1 - y0 < .16) { y0 = vis.y0 + .05; y1 = Math.min(.92, y0 + .3); }
    y1 = Math.min(y1, .94);
    const half = Math.sqrt(Math.max(0, 1 - y1 * y1));
    let x0 = Math.max(vis.x0 + .04, -half + .05), x1 = Math.min(vis.x1 - .04, half - .05);
    if (!G.mob && cr) x1 = Math.min(x1, (cr.left - 18 - G.cx) / G.R);
    return [{ x0, x1, y0, y1 }, vis];
  }

  /* ---------- post: bloom, tone map ---------- */
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .8, .55, .7); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------- day / night ---------- */
  const PAL = {
    night: { fog: '#0c161a', fogK: 1 / 3700, zen: '#020406', hor: '#0d181c', glow: '#2a2a20', sunC: '#1a2632', skyC: '#0b141a',
      fac: ['#0d1418', '#121a1f', '#16191b', '#121516', '#0d1012'], glass: '#0a1218', glassSky: '#1d3138', roof: '#0b0f12',
      asph: '#07090b', lot: '#0b0e10', walk: '#0f1316', plaza: '#0d1416', lamp: '#ffa24f', mark: '#cfd8d8', ring: '#3ee6c6', sphC: '#2fdcbc',
      shell: '#040708', off: '#0b1516', rim: '#3ee6c6', gold: '#e9c46a', low: '#1a1610', gain: 2.1, dim: .2, aurA: '#2fdcbc', aurB: '#e9c46a',
      bloom: [.6, .45, .72] },
    /* r52 · a real clear day: blue sky, warm sun, light haze; stone / concrete / brick / glass facades; dark LED shell */
    day: { fog: '#b7cde0', fogK: 1 / 5200, zen: '#1d62c4', hor: '#c6def2', glow: '#fff0d4', sunC: '#fff0d8', skyC: '#9bb4cd',
      fac: ['#6f8796', '#cfcac0', '#c8b18e', '#a8735c', '#8d9296'], glass: '#26404f', glassSky: '#9cc2dd', roof: '#8a8d8c',
      asph: '#474c50', lot: '#8b9182', walk: '#bab5ab', plaza: '#d3ccbf', lamp: '#ffa24f', mark: '#f2f2ee', ring: '#2fdcbc', sphC: '#2fdcbc',
      shell: '#97a1a6', off: '#717b81', rim: '#ffffff', gold: '#e9c46a', low: '#000000', gain: 1.5, dim: .25, aurA: '#2fdcbc', aurB: '#e9c46a',
      bloom: [.22, .4, .9] }
  };
  function applyTheme() {
    day = root.dataset.theme === 'day'; const P = day ? PAL.day : PAL.night;
    U.uNight.value = day ? 0 : 1; U.uFogC.value.set(P.fog); U.uFogK.value = P.fogK; U.uSunC.value.set(P.sunC); U.uSkyC.value.set(P.skyC); U.uSphC.value.set(P.sphC);
    skyU.uZen.value.set(P.zen); skyU.uHor.value.set(P.hor); skyU.uGlow.value.set(P.glow).multiplyScalar(day ? .55 : 1);
    P.fac.forEach((h, i) => bU.uFac.value[i].set(h)); bU.uGlass.value.set(P.glass); bU.uGlassSky.value.set(P.glassSky); bU.uRoof.value.set(P.roof);
    gU.uAsph.value.set(P.asph); gU.uLot.value.set(P.lot); gU.uWalk.value.set(P.walk); gU.uPlaza.value.set(P.plaza); gU.uLamp.value.set(P.lamp); gU.uMark.value.set(P.mark); gU.uRing.value.set(P.ring);
    sU.uShell.value.set(P.shell); sU.uOff.value.set(P.off); sU.uRim.value.set(P.rim).multiplyScalar(day ? .5 : 1.1); sU.uGold.value.set(P.gold); sU.uLow.value.set(P.low);
    sU.uGain.value = P.gain; sU.uDim.value = P.dim; sU.uAurA.value.set(P.aurA); sU.uAurB.value.set(P.aurB);
    lamps.visible = !day;
    cars.material.blending = day ? THREE.NormalBlending : THREE.AdditiveBlending; cars.material.needsUpdate = true;
    carU.uSz.value = day ? 2.2 : 1.3;
    [bloom.strength, bloom.radius, bloom.threshold] = P.bloom;
    tintLogo();
  }

  /* ---------- the camera, from the sphere ---------- */
  const tmpV = new THREE.Vector3();
  function placeCamera() {
    const f = G.mob ? 1.3 * Math.min(H, 1.6 * W) : 1.3 * H;
    const fullW = 2 * Math.max(G.cx, W - G.cx), fullH = 2 * Math.max(G.cy, H - G.cy);
    cam.fov = 2 * Math.atan(fullH / 2 / f) * 180 / Math.PI; cam.aspect = fullW / fullH;
    cam.setViewOffset(fullW, fullH, fullW / 2 - G.cx, fullH / 2 - G.cy, W, H);
    const th = Math.atan((G.cy - G.hz) / f), d = SR / Math.sin(Math.atan(G.R / f));
    cam.position.set(S.x, S.y + d * Math.sin(th), S.z + d * Math.cos(th)); cam.up.set(0, 1, 0); cam.lookAt(S);
    cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    sU.uVP.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    sU.uRight.value.setFromMatrixColumn(cam.matrixWorld, 0); sU.uUp.value.setFromMatrixColumn(cam.matrixWorld, 1);
    sU.uBB.value = SR * d / Math.sqrt(d * d - SR * SR) * 1.08;
    U.uF.value = f; G.f = f; G.d = d; G.pitch = th;
    sky.position.copy(cam.position);
  }

  /* ---------- schemes: auto-advance, crossfade, the little dots ---------- */
  let cur = 0, nxt = -1, tCur = 0, tFade = 0; const DUR = 9000, FADE = 1300;
  const nav = D.createElement('div'); nav.className = 'orbnav'; nav.id = 'orbnav'; nav.setAttribute('role', 'group');
  SCH.forEach((s, i) => { const b = D.createElement('button'); b.type = 'button'; b.dataset.i = i; b.addEventListener('click', () => go(i, true)); nav.appendChild(b); });
  D.body.appendChild(nav);
  function navLabels() {
    const en = root.lang === 'en'; nav.setAttribute('aria-label', en ? 'Sphere display' : '球面画面');
    [...nav.children].forEach((b, i) => { b.setAttribute('aria-label', (en ? SCH[i].en : SCH[i].zh) + ` (${i + 1}/${SCH.length})`); b.title = en ? SCH[i].en : SCH[i].zh; b.setAttribute('aria-pressed', String(i === (nxt >= 0 ? nxt : cur))); });
  }
  function bindSlots() {
    const a = SCH[cur], b = SCH[nxt >= 0 ? nxt : cur];
    sU.uTexA.value = a.tex || blank; sU.uModeA.value = a.mode; sU.uTexB.value = b.tex || blank; sU.uModeB.value = b.mode;
  }
  function go(i, user) {
    i = (i + SCH.length) % SCH.length; if (i === cur && nxt < 0) return;
    if (nxt >= 0) { cur = nxt; nxt = -1; }
    if (still) { cur = i; nxt = -1; sU.uMix.value = 0; bindSlots(); navLabels(); render(performance.now()); return; }
    nxt = i; tFade = performance.now(); bindSlots(); navLabels(); kick();
    if (user) tCur = tFade;   // a click restarts the timer
  }

  /* ---------- build / render loop ---------- */
  const T0 = performance.now(); let frozenT = 6.5;
  const clock = () => still ? frozenT : (performance.now() - T0) / 1000;
  let raf = 0, lastDraw = 0, frames = 0;
  function render(now) {
    const t = clock(); U.uTime.value = t; sU.uScroll.value = still ? .4 : t * .035;
    if (nxt >= 0) {
      const k = Math.min(1, (now - tFade) / FADE); sU.uMix.value = k * k * (3 - 2 * k);
      if (k >= 1) { cur = nxt; nxt = -1; tCur = now; sU.uMix.value = 0; bindSlots(); navLabels(); }
    } else if (!still && now - tCur > DUR) go(cur + 1, false);
    if (now - lastDraw > 33 || still) { lastDraw = now; drawScheme(cur, t); if (nxt >= 0) drawScheme(nxt, t); }
    composer.render(); frames++;
  }
  function loop(now) { raf = 0; if (D.hidden) return; render(now); if (!still) raf = requestAnimationFrame(loop); }
  function kick() { if (!raf && !D.hidden) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  function build() {
    const r = sceneEl.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height); if (!W || !H) return;
    DPR = Math.min(window.devicePixelRatio || 1, W * H > 1.6e6 ? 1.5 : 2);
    G = geo(); applyTheme(); placeCamera();
    renderer.setPixelRatio(DPR); renderer.setSize(W, H, false); composer.setPixelRatio(DPR); composer.setSize(W, H);
    U.uPx.value = DPR; sU.uDisc.value.set(G.cx, G.cy, G.R); sU.uRes.value.set(W, H); sU.uDpr.value = DPR;
    sU.uCell.value = Math.max(4.6, Math.min(6.4, G.R / 115)) / G.R;          // one LED every ~5–6 px across the front
    const rects = textRects(); rects.slice(0, 4).forEach((q, i) => sU.uRects.value[i].set(q[0], q[1], q[2], q[3])); for (let i = rects.length; i < 4; i++) sU.uRects.value[i].set(-9e3, -9e3, -9e3, -9e3);
    [ST, VIS] = stage(rects);
    nav.style.left = G.cx + 'px'; nav.style.top = (H - 44) + 'px';
    drawAll(); bindSlots(); navLabels();
    render(performance.now()); kick();
  }
  let sigv = ''; const sig = () => [innerWidth, innerHeight, root.dataset.theme, root.lang].join('|');
  function maybe(force) { const s = sig(); if (force || s !== sigv) { sigv = s; build(); } }
  let rzT = 0; addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => maybe(), 60); });
  addEventListener('td:theme', () => maybe(true));
  addEventListener('td:lang', () => setTimeout(() => maybe(true), 40));
  D.addEventListener('visibilitychange', () => { if (D.hidden) stop(); else kick(); });
  addEventListener('pageshow', kick);
  if (RM && RM.addEventListener) RM.addEventListener('change', () => { still = RM.matches; if (still) { frozenT = clock(); nxt = -1; sU.uMix.value = 0; bindSlots(); } render(performance.now()); kick(); });
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(() => maybe(true));
  maybe(true);

  window.__city = {
    mode: 'webgl', grid: false,
    geo: () => G && { W, H, cx: G.cx, cy: G.cy, R: G.R, hz: G.hz, top: G.cy - G.R, mob: G.mob, f: G.f, pitch: G.pitch },
    still: () => still, frames: () => frames, buildings: boxes.length, cars: cars.geometry.attributes.aRoad.count,
    schemes: SCH.map(s => s.id), scheme: () => SCH[nxt >= 0 ? nxt : cur].id,
    setScheme: i => { const k = typeof i === 'string' ? SCH.findIndex(s => s.id === i) : i; if (k < 0) return; nxt = -1; cur = k; tCur = performance.now(); sU.uMix.value = 0; bindSlots(); navLabels(); drawScheme(k, clock()); render(performance.now()); },
    stage: () => ST && Object.assign({}, ST),
    /* project a world point to CSS px (for tests: the sphere's silhouette must be the reference circle) */
    project: (x, y, z) => { tmpV.set(x, y, z).applyMatrix4(sU.uVP.value); return [(tmpV.x * .5 + .5) * W, (.5 - tmpV.y * .5) * H]; },
    sphere: { x: S.x, y: S.y, z: S.z, r: SR }, cam: () => cam.position.toArray()
  };
}
