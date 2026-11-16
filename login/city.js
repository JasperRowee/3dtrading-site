/* r55: deep space with nebula, Milky-Way band, galaxy, three star layers, parallax dust and a slow camera drift. r54: single default deep-space login scene; r53 daytime sphere size, finer LED lattice, upper-right mobile crop. */
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
  const s = D.createElement('script'); s.src = 'city2d.js?v=r54'; D.body.appendChild(s);
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
  const cam = new THREE.PerspectiveCamera(50, 1, 2, 32000);
  const S = new THREE.Vector3(0, 22, 0), SR = 60;              // the sphere: 120 m across, sunk 38 m into its plaza
  const PX = 150, PZ = 120, ROAD = 24;                          // street grid of the city (blocks 126 × 96 m)
  const PR = 205, SEA = -2.4;                                   // r53 day: the sphere's own small plaza (radius) and the sea level below its edge

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

  /* ---------- sky: r55 deep space ----------
     Painted in the screen's own pixels as seen from the resting camera (basis uRt/uUp/uFw, set in build), but read from
     the world direction, so when the camera drifts the whole sky slides behind the sphere: true parallax at infinity.
     Layers, back to front: near-black blue base, a faint Milky-Way band of dense star dust, a teal nebula that hugs the
     sphere's limb on the side away from the form, one small distant galaxy, three star layers (fine / mid / few bright
     with halos and a slow twinkle). Everything is damped behind the log-in card. */
  const skyU = { uZen: u(col('#000')), uHor: u(col('#000')), uGlow: u(col('#000')), uNight: U.uNight, uTime: U.uTime, uSun: U.uSun, uCloudL: u(col('#fff')), uCloudD: u(col('#000')), uSunC: U.uSunC,
    uRt: u(new THREE.Vector3(1, 0, 0)), uUp: u(new THREE.Vector3(0, 1, 0)), uFw: u(new THREE.Vector3(0, 0, -1)),
    uC: u(new THREE.Vector2(0, 0)), uWH: u(new THREE.Vector2(1, 1)), uFp: u(1000), uDiscS: u(new THREE.Vector3(0, 0, 1)),
    uCard: u(new THREE.Vector4(-9e3, -9e3, -9e3, -9e3)), uNebDir: u(new THREE.Vector2(.7, -.7)), uBand: u(new THREE.Vector4(.5, .1, 1, 0)),
    uGal: u(new THREE.Vector4(.2, .15, .5, .05)), uStill: u(0) };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(12000, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: skyU,
    vertexShader: `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }`,
    fragmentShader: `uniform float uTime, uStill, uFp; uniform vec3 uRt, uUp, uFw, uDiscS; uniform vec2 uC, uWH, uNebDir; uniform vec4 uCard, uBand, uGal; varying vec3 vD;
      float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
      float fbm(vec2 p){ float a = .5, s = 0.; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++) { s += a * noise(p); p = m * p; a *= .5; } return s; }
      vec3 starCol(float h){ return h < .64 ? vec3(.80, .88, 1.) : h < .88 ? vec3(.56, .96, .88) : vec3(1., .85, .62); }
      /* one star per cell, kept away from the cell edge so no neighbour lookups are needed; sizes in CSS px */
      vec3 stars(vec2 P, float cell, float prob, float rad, float gain, float twk, float halo, float seed){
        vec2 g = P / cell, id = floor(g), f = fract(g);
        float h = hash(id + seed); if (h > prob) return vec3(0.);
        vec2 o = .22 + .56 * vec2(hash(id + seed + 1.7), hash(id + seed + 5.3));
        float dp = length((f - o) * cell), b = hash(id + seed + 3.1);
        float tw = 1. + (1. - uStill) * twk * sin(uTime * (.5 + 1.6 * b) + h * 61.);
        float k = exp(-dp * dp / (rad * rad)) + halo * exp(-dp / (rad * 6.));
        return starCol(hash(id + seed + 7.3)) * k * gain * (.3 + .7 * b * b) * tw;
      }
      void main(){
        vec3 d = normalize(vD); float z = dot(d, uFw);
        vec3 c = vec3(.0011, .0024, .0060);
        if (z > .05) {
          vec2 P = uC + vec2(dot(d, uRt), -dot(d, uUp)) / z * uFp;     /* CSS px of the resting view */
          vec2 n = P / uWH.y;
          /* base: the lower sky is a touch bluer, as if lit by the sphere */
          c += vec3(.0004, .0016, .0030) * smoothstep(0., 1., P.y / uWH.y);
          /* the log-in card: decoration fades behind it */
          vec2 cq = max(max(uCard.xy - P, P - uCard.zw), 0.); float card = 1. - smoothstep(0., 60., length(cq));
          float calm = 1. - .7 * card;
          /* the sphere's limb */
          vec2 v = P - uDiscS.xy; float R = uDiscS.z, dd = length(v) - R, side = dot(normalize(v), uNebDir);
          float out1 = max(dd, 0.);
          c += vec3(.010, .055, .050) * exp(-out1 / (R * .03)) * .55 + vec3(.004, .020, .024) * exp(-out1 / (R * .16)) * .6;
          /* Milky-Way band */
          vec2 bd = normalize(uBand.zw); float bl = dot(n - uBand.xy, vec2(-bd.y, bd.x));
          float band = exp(-bl * bl / .0085) * (.55 + .45 * smoothstep(.25, .7, fbm(n * 3.1 + 2.)));
          float bt = fbm(n * 7. + vec2(4.1, 1.3));
          c += vec3(.0040, .0068, .0105) * band * (.5 + bt) * calm;
          c *= 1. - .45 * band * smoothstep(.55, .78, fbm(n * 11. + 9.));      /* thin dark lanes */
          /* teal nebula on the open side of the sphere, slowly drifting */
          vec2 q = n * 2.4 + vec2(.0, -uTime * .0035 * (1. - uStill));
          vec2 w = vec2(fbm(q + 1.7), fbm(q + vec2(8.3, 2.8)));
          float f = fbm(q * 1.25 + 2.1 * w);
          float rim = exp(-pow((dd / R - .12) / .15, 2.)) * smoothstep(-.05, .9, side) * smoothstep(-.02, .05, dd / R);
          float wisp = rim * smoothstep(.45, .9, f);
          vec3 neb = mix(vec3(.002, .012, .020), vec3(.010, .075, .064), smoothstep(.5, .85, f)) * wisp * 1.4;
          neb += vec3(.030, .120, .105) * pow(max(f - .62, 0.) * 2.6, 2.2) * rim;     /* bright filaments */
          neb += vec3(.040, .028, .010) * pow(max(w.x - .66, 0.) * 3., 2.) * rim * .6; /* a trace of the brand gold */
          neb *= 1. - .6 * smoothstep(.5, .8, fbm(q * 2.7 + 5.)) * step(0., dd);      /* dust lanes */
          c += neb * calm * step(0., dd);
          /* one distant galaxy, tilted */
          vec2 gl = n - uGal.xy; float ca = cos(uGal.z), sa = sin(uGal.z); gl = vec2(ca * gl.x + sa * gl.y, -sa * gl.x + ca * gl.y);
          float ge = length(vec2(gl.x, gl.y * 3.4)) / uGal.w;
          c += (vec3(.020, .024, .030) * exp(-ge * ge * 2.2) + vec3(.16, .14, .11) * exp(-ge * ge * 60.)) * (.7 + .3 * fbm(gl * 90.)) * calm;
          /* stars: denser along the band and the nebula, thinner behind the card */
          float dens = (.75 + 1.6 * band * bt + .5 * rim) * calm;
          vec3 st = stars(P, 6., .055 * dens, .48, .45, 0., 0., 1.)
                  + stars(P + 3.1, 19., .11 * dens, .62, .80, .10, 0., 2.)
                  + stars(P + 7.7, 72., .26 * min(dens, 1.4), .95, 1.7, .22, .05, 3.);
          c += st * step(0., dd);
        }
        gl_FragColor = vec4(c, 1.);
      }`
  }));
  sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);

  /* ---------- r55 · two dust layers at finite depth: they slide against the sky and the sphere as the camera drifts ----------
     far: fine motes beyond the sphere; near: a few soft, larger motes between the camera and the sphere. Both stay off
     the sphere's face (masked in screen space) and are faint behind the card. Rebuilt for every layout in build(). */
  const dustU = { uTime: U.uTime, uDpr: u(1), uDiscD: u(new THREE.Vector3(0, 0, 1)), uCardD: u(new THREE.Vector4(-9e3, -9e3, -9e3, -9e3)), uStill: u(0) };
  function dustLayer(order) {
    const m = new THREE.Points(new THREE.BufferGeometry(), new THREE.ShaderMaterial({ uniforms: dustU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform float uTime, uDpr, uStill; attribute float aSz, aA, aPh; attribute vec3 aC; varying float vA; varying vec3 vC;
        void main(){ vec3 p = position; p.y += (1. - uStill) * sin(uTime * .11 + aPh) * aSz * .9;
          vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = aSz * uDpr;
          vA = aA * (1. + (1. - uStill) * .18 * sin(uTime * (.3 + fract(aPh) * .6) + aPh * 7.)); vC = aC; }`,
      fragmentShader: `uniform vec3 uDiscD; uniform vec4 uCardD; varying float vA; varying vec3 vC;
        void main(){ vec2 pc = gl_PointCoord - .5; float r = length(pc) * 2.; if (r > 1.) discard;
          vec2 fc = gl_FragCoord.xy; if (length(fc - uDiscD.xy) < uDiscD.z) discard;
          float inCard = step(uCardD.x, fc.x) * step(fc.x, uCardD.z) * step(uCardD.y, fc.y) * step(fc.y, uCardD.w);
          float a = pow(1. - r, 1.8) * vA * (1. - .75 * inCard); gl_FragColor = vec4(vC * a, a); }` }));
    m.frustumCulled = false; m.renderOrder = order; scene.add(m); return m;
  }
  const dustFar = dustLayer(-9), dustNear = dustLayer(5);
  function fillDust(pts, n, z0, z1, sz0, sz1, a0, a1, seed) {
    const r = rng(seed), P = new Float32Array(n * 3), SZ = new Float32Array(n), A = new Float32Array(n), PH = new Float32Array(n), C = new Float32Array(n * 3);
    const fw = new THREE.Vector3(), rt = skyU.uRt.value, up = skyU.uUp.value; fw.copy(skyU.uFw.value);
    const pal = [[.70, .86, 1.], [.42, .92, .82], [1., .86, .62]];
    for (let i = 0; i < n; i++) {
      const x = (r() * 1.2 - .1) * W, y = (r() * 1.2 - .1) * H, zz = z0 + (z1 - z0) * r();
      const k = zz / G.f;
      tmpD.copy(cam.position).addScaledVector(fw, zz).addScaledVector(rt, (x - G.cx) * k).addScaledVector(up, -(y - G.cy) * k);
      P[i * 3] = tmpD.x; P[i * 3 + 1] = tmpD.y; P[i * 3 + 2] = tmpD.z;
      SZ[i] = sz0 + (sz1 - sz0) * Math.pow(r(), 2.2); A[i] = a0 + (a1 - a0) * r(); PH[i] = r() * 40;
      const h = r(), cc = pal[h < .62 ? 0 : h < .9 ? 1 : 2]; C.set(cc, i * 3);
    }
    const g = pts.geometry; g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aSz', new THREE.BufferAttribute(SZ, 1));
    g.setAttribute('aA', new THREE.BufferAttribute(A, 1)); g.setAttribute('aPh', new THREE.BufferAttribute(PH, 1)); g.setAttribute('aC', new THREE.BufferAttribute(C, 3));
    g.computeBoundingSphere();
  }
  const tmpD = new THREE.Vector3();

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

  /* ---------- r53 · day: a small round plaza around the sphere, its stone edge, and the open sea beyond ---------- */
  const dayG = new THREE.Group(); scene.add(dayG);
  const LIT = `uniform vec3 uSun, uSunC, uSkyC, uS, uC; uniform float uSR, uShine; varying vec3 vW, vN;
    float sphShadow(vec3 p){ vec3 oc = p - uS; float b = dot(oc, uSun), c = dot(oc, oc) - uSR * uSR, h = b * b - c;
      if (h < 0.) return 1.; float t = -b - sqrt(h); return t > 0. ? 1. - .62 * smoothstep(0., 6., sqrt(h)) : 1.; }`;
  const litMat = (hex, shine, inst) => new THREE.ShaderMaterial({
    uniforms: Object.assign({ uC: u(col(hex)), uSR: u(SR), uShine: u(shine || 0) }, U), defines: inst ? { INST: 1 } : {},
    vertexShader: `varying vec3 vW, vN; void main(){
      #ifdef INST
        mat4 M = modelMatrix * instanceMatrix;
      #else
        mat4 M = modelMatrix;
      #endif
      vec4 w = M * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(M) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: FOG + LIT + `void main(){ vec3 n = normalize(vN), V = normalize(cameraPosition - vW); float df = max(dot(n, uSun), 0.);
      vec3 c = uC * (uSkyC * (.55 + .25 * n.y) + uSunC * df * 1.05 * sphShadow(vW));
      c += uSunC * pow(max(dot(reflect(-uSun, n), V), 0.), 40.) * uShine;
      gl_FragColor = vec4(fogMix(c, length(cameraPosition - vW)), 1.); }`
  });
  /* the plaza: pale stone in rings and radial courses, a dark granite band round the sphere's foot, a granite border at the edge */
  const plazaU = Object.assign({ uStone: u(col('#e9e4d8')), uStone2: u(col('#d9d2c3')), uGran: u(col('#4c5458')), uJoint: u(col('#b8b0a0')), uSR: u(SR), uPR: u(PR) }, U);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(PR, 256), new THREE.ShaderMaterial({
    uniforms: plazaU,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: FOG + `uniform vec3 uS, uSun, uSunC, uSkyC, uStone, uStone2, uGran, uJoint; uniform float uSR, uPR; varying vec3 vW;
      float band(float x, float e){ float w = fwidth(x) * .75 + 1e-4; return 1. - smoothstep(e - w, e + w, x); }
      float sphShadow(vec3 p){ vec3 oc = p - uS; float b = dot(oc, uSun), c = dot(oc, oc) - uSR * uSR, h = b * b - c;
        if (h < 0.) return 1.; float t = -b - sqrt(h); return t > 0. ? 1. - .62 * smoothstep(0., 8., sqrt(h)) : 1.; }
      void main(){ vec2 p = vW.xz - uS.xz; float r = length(p), a = atan(p.y, p.x), dist = length(cameraPosition - vW);
        float foot = sqrt(uSR * uSR - uS.y * uS.y);
        float ring = floor(r / 4.2), slab = floor(a * r / 4.2 / 1.6 + ring * .37);
        float tone = h21(vec2(ring, slab));
        vec3 c = mix(uStone, uStone2, tone * .7);
        float joints = max(band(abs(fract(r / 4.2) - .5) * 4.2, .05), band(abs(fract(a * r / 4.2 / 1.6 + ring * .37) - .5) * 1.6 * 4.2 / 4.2, .04));
        c = mix(c, uJoint, joints * .55 * (1. - smoothstep(150., 600., dist)));
        float gr = step(r, foot + 9.) + step(uPR - 7., r);           /* granite at the sphere's foot and at the edge */
        c = mix(c, uGran * mix(.9, 1.1, tone), clamp(gr, 0., 1.));
        c = mix(c, uStone * 1.05, band(abs(r - foot - 9.), .35) + band(abs(r - (uPR - 7.)), .3));
        vec3 L = uSkyC * .62 + uSunC * max(uSun.y, 0.) * 1.15 * sphShadow(vW);
        c *= L;
        c *= 1. - .45 * exp(-max(r - foot, 0.) / 3.5);                /* contact shade where the sphere meets the ground */
        gl_FragColor = vec4(fogMix(c, dist), 1.); }`
  }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(S.x, 0, S.z); dayG.add(plaza);
  /* the edge: a stone sea wall down to the water, a capped balustrade on top */
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(PR, PR + .6, -SEA + 1.2, 256, 1, true), litMat('#c9c1b0', .05)); wall.position.set(S.x, (SEA - 1.2) / 2, S.z); dayG.add(wall);
  const capR = new THREE.Mesh(new THREE.RingGeometry(PR - .55, PR + .05, 256), litMat('#f1ede4', .15)); capR.rotation.x = -Math.PI / 2; capR.position.set(S.x, 1.08, S.z); dayG.add(capR);
  const capF = new THREE.Mesh(new THREE.CylinderGeometry(PR + .05, PR + .05, .16, 256, 1, true), litMat('#e8e3d8', .1)); capF.position.set(S.x, 1.0, S.z); dayG.add(capF);
  { const n = Math.round(2 * Math.PI * PR / 1.15), g = new THREE.BoxGeometry(.22, .92, .22); g.translate(0, .46, 0);
    const im = new THREE.InstancedMesh(g, litMat('#ece7dc', 0, true), n), m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; m.makeRotationY(-a); m.setPosition(S.x + Math.cos(a) * (PR - .25), 0, S.z + Math.sin(a) * (PR - .25)); im.setMatrixAt(i, m); }
    im.frustumCulled = false; dayG.add(im); }
  /* lamp posts round the plaza, and benches between them */
  { const n = 36, g = new THREE.CylinderGeometry(.09, .14, 6.5, 8); g.translate(0, 3.25, 0);
    const gh = new THREE.BoxGeometry(.9, .22, .35); gh.translate(.3, 6.45, 0);
    const gb = new THREE.BoxGeometry(2.4, .45, .6); gb.translate(0, .22, 0);
    const posts = new THREE.InstancedMesh(g, litMat('#3d4549', .4, true), n), heads = new THREE.InstancedMesh(gh, litMat('#3d4549', .4, true), n), benches = new THREE.InstancedMesh(gb, litMat('#a8896a', .05, true), n);
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { const a = (i + .5) / n * Math.PI * 2, rr = PR - 4.5; m.makeRotationY(-a + Math.PI); m.setPosition(S.x + Math.cos(a) * rr, 0, S.z + Math.sin(a) * rr); posts.setMatrixAt(i, m); heads.setMatrixAt(i, m);
      const b2 = a + Math.PI / n; m.makeRotationY(-b2 + Math.PI / 2); m.setPosition(S.x + Math.cos(b2) * (PR - 5), 0, S.z + Math.sin(b2) * (PR - 5)); benches.setMatrixAt(i, m); }
    [posts, heads, benches].forEach(o => { o.frustumCulled = false; dayG.add(o); }); }
  /* people strolling on the plaza: tiny figures that give the sphere its true size */
  const pplU = Object.assign({ uSz: u(1.75), uMinPx: u(1.2) }, U);
  const people = (() => {
    const r = rng(5353), A = [], C = [];
    for (let i = 0; i < 150; i++) { const rr = 70 + Math.pow(r(), .7) * (PR - 82); A.push(r() * 6.2832, rr, (r() < .5 ? -1 : 1) * (.25 + r() * .5) / rr, r()); C.push(r()); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(A.length / 4 * 3), 3));
    geo.setAttribute('aP', new THREE.Float32BufferAttribute(A, 4)); geo.setAttribute('aC', new THREE.Float32BufferAttribute(C, 1));
    const p = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: pplU, transparent: true, depthWrite: false,
      vertexShader: `uniform float uF, uPx, uSz, uMinPx, uTime; uniform vec3 uS; attribute vec4 aP; attribute float aC; varying float vDist; varying vec3 vC; varying float vK;
        void main(){ float a = aP.x + aP.z * uTime; vec3 w = vec3(uS.x + cos(a) * aP.y, .9, uS.z + sin(a) * aP.y);
          vec4 mv = viewMatrix * vec4(w, 1.); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(uSz * uF / max(-mv.z, 1.), uMinPx, 14.) * uPx;
          vC = aC < .3 ? vec3(.12, .14, .16) : aC < .5 ? vec3(.92, .9, .86) : aC < .62 ? vec3(.16, .32, .5) : aC < .72 ? vec3(.62, .22, .2) : aC < .85 ? vec3(.35, .33, .3) : vec3(.85, .7, .42); vK = aP.w; }`,
      fragmentShader: FOG + `varying float vDist; varying vec3 vC; varying float vK;
        void main(){ vec2 q = gl_PointCoord - .5; q.y = -q.y;
          float body = step(abs(q.x), .13) * step(-.5, q.y) * step(q.y, .24), head = step(length(q - vec2(0., .36)), .11);
          float a = max(body, head); if (a < .5) discard;
          vec3 c = mix(vC, vec3(.78, .6, .5), head * .7) * .85; gl_FragColor = vec4(fogMix(c, vDist), 1.); }` }));
    p.frustumCulled = false; return p;
  })();
  dayG.add(people);
  /* the sea: wind ripples on long swells, sky reflected by Fresnel, a sun glitter path, foam where it meets the wall */
  const seaU = Object.assign({ uDeep: u(col('#05535a')), uShal: u(col('#0f8f87')), uHorC: u(col('#000')), uZenC: u(col('#000')), uFoam: u(col('#f4fbf8')), uPR: u(PR) }, U);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000, 1, 1), new THREE.ShaderMaterial({
    uniforms: seaU,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: FOG + `uniform vec3 uS, uSun, uSunC, uDeep, uShal, uHorC, uZenC, uFoam; uniform float uTime, uPR; varying vec3 vW;
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        vec2 p = vW.xz; float r = length(p - uS.xz); if (r < uPR - .5) discard;
        vec3 V = cameraPosition - vW; float dist = length(V); V /= dist;
        float fw = length(fwidth(p)) + 1e-3;
        /* a sum of travelling waves, each faded out once it is smaller than a pixel */
        vec2 g = vec2(0.);
        for (int k = 0; k < 9; k++) { float fk = float(k);
          float ang = fk * 2.39996 + .4, lam = 90. * pow(.63, fk), amp = lam * .045;
          vec2 dir = vec2(cos(ang), sin(ang)); float w = 6.2832 / lam, ph = dot(dir, p) * w + uTime * sqrt(9.81 * w) * .9 + fk * 1.7;
          float keep = 1. - smoothstep(.25, .7, fw / lam);
          g += dir * cos(ph) * w * amp * keep; }
        /* fine wind ripples (value noise), only near */
        float rp = 1. - smoothstep(.3, 1.4, fw); vec2 qn = p * .35 + vec2(uTime * .25, uTime * .12);
        float e = .5, n0 = vn(qn); g += vec2(vn(qn + vec2(e, 0.)) - n0, vn(qn + vec2(0., e)) - n0) * .9 * rp;
        vec3 n = normalize(vec3(-g.x, 1., -g.y));
        float fr = .02 + .98 * pow(1. - max(dot(n, V), 0.), 5.);
        vec3 R = reflect(-V, n); R.y = abs(R.y);
        vec3 sky = mix(uHorC, uZenC, smoothstep(0., .62, pow(R.y, .62)));
        float sd = max(dot(R, uSun), 0.);
        vec3 body = mix(uShal, uDeep, smoothstep(0., 1., -dot(V, vec3(0., -1., 0.)) * 1.4));
        vec3 c = mix(body, sky, clamp(fr, 0., 1.));
        c += uSunC * (pow(sd, 900.) * 6. + pow(sd, 90.) * .45 + pow(sd, 12.) * .06);
        /* the sphere's shadow on the water */
        { vec3 oc = vW - uS; float b = dot(oc, uSun), cc = dot(oc, oc) - 3600., h = b * b - cc; if (h > 0. && -b - sqrt(h) > 0.) c *= .7; }
        float foam = exp(-(r - uPR) / 1.6) * (.55 + .45 * vn(p * .6 + uTime * .3)) + exp(-(r - uPR) / 6.) * .25 * step(.62, vn(p * .25 - uTime * .2));
        c = mix(c, uFoam, clamp(foam, 0., 1.) * (1. - smoothstep(300., 1400., dist)));
        gl_FragColor = vec4(fogMix(c, dist), 1.); }`
  }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(S.x, SEA, S.z - 9000); sea.renderOrder = -5; dayG.add(sea);

  /* ---------- the LED sphere ---------- */
  const blank = new THREE.DataTexture(new Uint8Array(4), 1, 1); blank.needsUpdate = true;
  const sU = {
    uR: u(SR), uBB: u(SR * 1.3), uRight: u(new THREE.Vector3(1, 0, 0)), uUp: u(new THREE.Vector3(0, 1, 0)), uVP: u(new THREE.Matrix4()),
    uDisc: u(new THREE.Vector3(0, 0, 1)), uRes: u(new THREE.Vector2(1, 1)), uDpr: u(1), uCell: u(.01),
    uTexA: u(blank), uTexB: u(blank), uModeA: u(0), uModeB: u(0), uMix: u(0), uScroll: u(0), uTR: u(new THREE.Vector4(-1, -1, 1, 1)), uBase: u(col('#000')), uBase2: u(col('#000')),
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
      uniform vec3 uS, uDisc, uShell, uOff, uRim, uGold, uLow, uSun, uAurA, uAurB, uBase, uBase2; uniform vec4 uTR; uniform float uR, uDpr, uCell, uMix, uScroll, uDim, uGain, uNight, uTime, uModeA, uModeB;
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
        /* r53: by day a continuous, sharp picture (as on the real sphere), sampled per pixel — screen-space for the framed schemes
           (their texture covers only the visible face, so it stays crisp), latitude–longitude for the bands.
           At night it stays as r52: a lattice of LEDs, each sampled once at its centre. */
        float i = floor((phi + PI * .5) / uCell), phc = (i + .5) * uCell - PI * .5;
        float nl = max(3., floor(TAU * cos(phc) / uCell)), dl = TAU / nl;
        float j = floor((lam + PI) / dl), lac = (j + .5) * dl - PI;
        vec2 lc = vec2((lam - lac) * cos(phi) / uCell, (phi - phc) / uCell);
        float cpx = max(fwidth(phi), fwidth(lam) * cos(phi)) / uCell, aa = cpx * .8 + .02;
        float dotm = mix(1. - smoothstep(.33 - aa, .33 + aa, length(lc)), .55, smoothstep(.28, .7, cpx));
        vec2 sp; vec2 uvL; vec3 nS = n;
        if (uNight > .5) {
          vec3 nc = vec3(cos(phc) * sin(lac), sin(phc), cos(phc) * cos(lac)); nS = nc;
          vec4 cl = uVP * vec4(uS + nc * uR, 1.); vec2 nd = cl.xy / cl.w;
          sp = vec2((nd.x * .5 + .5) * uRes.x, (.5 - nd.y * .5) * uRes.y);
          uvL = vec2(fract((lac + uScroll) / TAU + .5), (phc + PI / 3.) / (PI * 5. / 6.));
        } else {
          sp = vec2(gl_FragCoord.x / uDpr, uRes.y - gl_FragCoord.y / uDpr);
          uvL = vec2(fract((lam + uScroll) / TAU + .5), (phi + PI / 3.) / (PI * 5. / 6.));
        }
        vec2 q = vec2(sp.x - uDisc.x, uDisc.y - sp.y) / uDisc.z, uvS = (q - uTR.xy) / (uTR.zw - uTR.xy);
        vec4 C = mix(slot(uTexA, uModeA, uvS, uvL, nS), slot(uTexB, uModeB, uvS, uvL, nS), uMix);
        float dm = 0.;
        for (int k = 0; k < 4; k++) { vec4 r = uRects[k]; vec2 dd = max(r.xy - sp, sp - r.zw); dm = max(dm, 1. - smoothstep(-26., 20., max(dd.x, dd.y))); }
        float lvl = mix(1., uDim, dm), face = clamp(dot(n, V), 0., 1.), facing = pow(face, .35);
        vec3 R = reflect(-V, n);
        /* the screen's own ground: a faint lit field over the whole sphere, brighter at the top */
        float fl = .5 + .5 * sin(lam * 2. + phi * 3. + uTime * .12) * sin(phi * 4. - uTime * .09);
        vec3 ground = mix(uBase2, uBase, smoothstep(-.4, .9, n.y) * .8 + fl * .2);
        vec3 col;
        if (uNight > .5) col = mix(uShell * (.55 + .45 * n.y), uOff + C.rgb * C.a * uGain * lvl * facing, dotm);   /* r52 night, unchanged */
        else {
          /* day: a bright screen in sunlight — light ground, the picture laid over it, gently darker towards the limb */
          col = mix(ground, C.rgb, clamp(C.a * lvl, 0., 1.));
          col *= mix(.7, 1., pow(face, .6));
          col += vec3(.16) * pow(max(dot(R, uSun), 0.), 10.) + vec3(.05) * pow(1. - face, 3.);
        }
        /* a fine panel weave only where the screen is large on the page: gives the surface scale without breaking the picture */
        vec2 pw = abs(fract(vec2(lam * cos(phi), phi) * uR / 1.6) - .5);
        float px = max(fwidth(phi), fwidth(lam) * cos(phi)) * uR / 1.6;
        if (uNight < .5) col *= 1. - .05 * (1. - smoothstep(.2, .55, px)) * (1. - smoothstep(.0, .08, min(pw.x, pw.y)));
        /* a thin light line on the silhouette (as in the reference), strongest upper-left, plus a faint sheen */
        float ePx = (uR - dc) / aw, side = .25 + .75 * smoothstep(-.4, .9, dot(n, normalize(vec3(-.72, .62, .3))));
        col += uRim * (exp(-ePx / 1.3) * .9 + exp(-ePx / 14.) * .1 + pow(1. - face, 6.) * .05) * side;
        col += uLow * smoothstep(.4, -.05, n.y);                                  /* the city's light on its lower half */
        /* the short gold streak on the right shoulder (as in the reference) */
        vec2 fp = vec2(gl_FragCoord.x / uDpr, uRes.y - gl_FragCoord.y / uDpr);
        float an = .365 * PI; vec2 A = uDisc.xy + vec2(cos(an), -sin(an)) * uDisc.z * .985, B = A + normalize(vec2(-.38, 1.)) * uDisc.z * .11;
        float hs; float sd = sdSeg(fp, A, B, hs), th = max(1.1, uDisc.z / 330.);
        col += uGold * (1. - smoothstep(th * .5, th * .5 + 1., sd)) * pow(1. - hs, 1.3) * (uNight > .5 ? 2.2 : 0.);
        gl_FragColor = vec4(col, alpha); }`
  }));
  sphere.frustumCulled = false; sphere.renderOrder = 10; scene.add(sphere);

  /* ---------- sphere contents (2D canvases → textures) ---------- */
  let TW = 512, TH = 512, KS = 1; const LK = () => ledDay ? KS * .6 : KS;   /* line weights: finer on the crisp day screen, as r52 on the night LEDs */     /* r53: the framed schemes' canvas covers only the visible face of the sphere, at screen resolution */
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
    s.cv = s.mode === 1 ? mkC(4096, 1024) : mkC(TW, TH); s.cx = s.cv.getContext('2d');
    s.tex = new THREE.CanvasTexture(s.cv); s.tex.colorSpace = THREE.SRGBColorSpace; s.tex.generateMipmaps = false; s.tex.minFilter = THREE.LinearFilter;
    if (s.mode === 1) s.tex.wrapS = THREE.RepeatWrapping;
  });
  let ledDay = false; /* r53: by day the sphere is a bright screen, so its pictures are drawn dark-on-light */
  function sizeTex() {           /* fit the framed canvases to the visible face, about one texel per device pixel */
    const sw = (VIS.x1 - VIS.x0) * G.R, sh = (VIS.y1 - VIS.y0) * G.R, k = Math.min(1, 1900 / (Math.max(sw, sh) * DPR));
    const w = Math.max(256, Math.round(sw * DPR * k)), h = Math.max(256, Math.round(sh * DPR * k));
    KS = w / (VIS.x1 - VIS.x0) / 256;
    if (w === TW && h === TH) return; TW = w; TH = h;
    SCH.forEach(s => { if (s.mode !== 0) return; s.cv.width = TW; s.cv.height = TH; s.tex.dispose();
      s.tex = new THREE.CanvasTexture(s.cv); s.tex.colorSpace = THREE.SRGBColorSpace; s.tex.generateMipmaps = false; s.tex.minFilter = THREE.LinearFilter; s.tex.anisotropy = 4; });
  }
  const logo = new Image(); let logoOK = false; logo.onload = () => { logoOK = true; tintLogo(); drawAll(); }; logo.src = 'assets/3dtrading-logo-white.svg';
  let logoT = null;
  function tintLogo() {
    if (!logoOK) return;
    const w = 1800, h = Math.round(1800 * 88.29564 / 366.41956), c = mkC(w, h), x = c.getContext('2d');
    x.drawImage(logo, 0, 0, w, h); x.globalCompositeOperation = 'source-in';
    const gr = x.createLinearGradient(0, 0, w, 0);
    if (ledDay) { gr.addColorStop(0, '#08806b'); gr.addColorStop(1, '#0d9a7c'); } else { gr.addColorStop(0, '#5eeccf'); gr.addColorStop(.6, '#a7e9c8'); gr.addColorStop(1, '#e3d79f'); }
    x.fillStyle = gr; x.fillRect(0, 0, w, h); logoT = c;
  }
  /* candles: a seeded random walk, scrolled */
  const series = (() => { const r = rng(4242), a = []; let p = 100; for (let i = 0; i < 400; i++) { const o = p, ch = (r() - .48) * 3.2 + Math.sin(i / 23) * .9, c = o + ch, hi = Math.max(o, c) + r() * 1.6, lo = Math.min(o, c) - r() * 1.6; a.push([o, hi, lo, c, .3 + r()]); p = c; } return a; })();
  const twinkle = (() => { const r = rng(99), a = []; for (let i = 0; i < 160; i++) a.push([r(), r(), r(), r()]); return a; })();

  let W = 0, H = 0, DPR = 1, day = false, G = null, ST = null, VIS = null, still = !!(RM && RM.matches);
  const toCx = qx => (qx - VIS.x0) / (VIS.x1 - VIS.x0) * TW, toCy = qy => (VIS.y1 - qy) / (VIS.y1 - VIS.y0) * TH;

  function ambient(c, t, a) {          /* faint twinkling LEDs over the visible face */
    const x0 = toCx(VIS.x0), x1 = toCx(VIS.x1), y0 = toCy(VIS.y1), y1 = toCy(VIS.y0);
    for (const p of twinkle) { const k = .5 + .5 * Math.sin(t * (.6 + p[2] * 1.6) + p[3] * 40); if (k < .55) continue;
      c.fillStyle = (p[2] < .8 ? (ledDay ? 'rgba(10,140,118,' : 'rgba(80,230,200,') : (ledDay ? 'rgba(190,140,40,' : 'rgba(240,200,110,')) + (a * (k - .55) / .45).toFixed(3) + ')';
      c.beginPath(); c.arc(x0 + p[0] * (x1 - x0), y0 + p[1] * (y1 - y0), 1.1 * KS, 0, 6.2832); c.fill(); }
  }
  function drawBrand(t) {
    const s = SCH[0], c = s.cx; c.clearRect(0, 0, TW, TH); if (!ledDay) ambient(c, t, .55);
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
      const K = LK(); c.fillStyle = ledDay ? 'rgba(8,128,107,.55)' : 'rgba(62,230,198,.45)'; c.fillRect(rx, ry, rw, 2.2 * K);
      const bx = rx + ((still ? .6 : (t * .22) % 1)) * rw; c.fillStyle = ledDay ? '#c4922a' : '#f0cf7a'; c.fillRect(bx - 5 * K, ry - 1.4 * K, 10 * K, 5 * K);
    }
  }
  function drawCandles(t) {
    const s = SCH[1], c = s.cx; c.clearRect(0, 0, TW, TH);
    const X0 = toCx(VIS.x0) + 6, X1 = toCx(Math.min(VIS.x1, ST.x1 + .25)) - 6, Y0 = toCy(ST.y1), Y1 = toCy(ST.y0), w = X1 - X0, h = Y1 - Y0;
    const n = 22, cw = w / n, off = still ? 40 : t * 1.25, i0 = Math.floor(off), fr = off - i0;
    let lo = 1e9, hi = -1e9; for (let k = 0; k <= n + 1; k++) { const d = series[(i0 + k) % series.length]; lo = Math.min(lo, d[2]); hi = Math.max(hi, d[1]); }
    const pad = (hi - lo) * .12, Y = v => Y0 + h * .06 + (1 - (v - lo + pad) / (hi - lo + 2 * pad)) * h * .74;
    const up = ledDay ? '#0f9f6e' : '#22e3a2', dn = ledDay ? '#e0464e' : '#ff5b6b';
    for (let k = 0; k <= n + 1; k++) {
      const d = series[(i0 + k) % series.length], x = X0 + (k - fr) * cw; if (x < X0 - cw || x > X1) continue;
      const isUp = d[3] >= d[0]; c.fillStyle = isUp ? up : dn;
      c.fillRect(x + cw * .48, Y(d[1]), Math.max(1.5, cw * .04), Y(d[2]) - Y(d[1]));
      const yt = Y(Math.max(d[0], d[3])), yb = Y(Math.min(d[0], d[3])); c.fillRect(x + cw * .2, yt, cw * .6, Math.max(2, yb - yt));
      c.globalAlpha = .4; c.fillRect(x + cw * .2, Y1 - h * .14 * d[4], cw * .6, h * .14 * d[4]); c.globalAlpha = 1;   // volume
    }
    const last = series[(i0 + n) % series.length][3], ly = Y(last);
    c.strokeStyle = ledDay ? 'rgba(8,128,107,.7)' : 'rgba(120,240,214,.75)'; c.lineWidth = 1.6 * LK(); c.setLineDash([6 * LK(), 5 * LK()]); c.beginPath(); c.moveTo(X0, ly); c.lineTo(X1, ly); c.stroke(); c.setLineDash([]);
  }
  function drawDodo(t) {
    const s = SCH[2], c = s.cx; c.clearRect(0, 0, TW, TH); if (!ledDay) ambient(c, t, .35);
    const X0 = toCx(ST.x0), X1 = toCx(ST.x1), Y0 = toCy(ST.y1), Y1 = toCy(ST.y0), w = X1 - X0, h = Y1 - Y0;
    const D0 = Math.min(h * .96, w * .5), cx = X0 + w / 2, cy = Y0 + h / 2, k = D0 / 220.5;   // the face circle of dodo.svg (r 110.25)
    const gl = c.createRadialGradient(cx, cy, D0 * .3, cx, cy, D0 * .85); gl.addColorStop(0, ledDay ? 'rgba(31,224,191,.55)' : 'rgba(31,224,191,.45)'); gl.addColorStop(1, 'rgba(31,224,191,0)');
    c.fillStyle = gl; c.fillRect(cx - D0, cy - D0, D0 * 2, D0 * 2);
    c.save(); c.translate(cx, cy); c.scale(k, k); c.translate(-169, -169);
    c.fillStyle = '#fcf1e0'; c.globalAlpha = ledDay ? 1 : .5; c.beginPath(); c.arc(169, 169, 110.25, 0, 6.2832); c.fill(); c.globalAlpha = 1;
    if (ledDay) { c.strokeStyle = '#0d7a66'; c.lineWidth = 5; c.stroke(); }
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
    const s = SCH[3], c = s.cx, CW = 4096, CH = 1024; c.clearRect(0, 0, CW, CH);
    const yv = ph => (1 - (ph + Math.PI / 3) / (Math.PI * 5 / 6)) * CH;
    const qx = (ST.x0 + ST.x1) / 2, bands = [[.27, .46, 0], [.79, .36, 1]];
    const coins = [['BTC', '#f7931a', '₿'], ['ETH', '#8c8cf0', 'Ξ'], ['BNB', '#f0b90b', 'B'], ['SOL', '#14f195', 'S'], ['XRP', '#b8c4cc', 'X'], ['DOGE', '#c2a633', 'Ð']];
    for (const [fy, fh, kind] of bands) {
      const y = ST.y1 - fy * (ST.y1 - ST.y0), half = fh * (ST.y1 - ST.y0) / 2;
      const p0 = latAt(qx, y + half), p1 = latAt(qx, y - half); if (p0 == null || p1 == null) continue;
      const ph = (p0 + p1) / 2, ya = yv(p0), yb = yv(p1), bh = yb - ya, kx = (CW / (2 * Math.PI)) / (CH / (Math.PI * 5 / 6)) / Math.max(.2, Math.cos(ph));
      c.fillStyle = ledDay ? 'rgba(10,125,104,.08)' : 'rgba(47,220,188,.10)'; c.fillRect(0, ya, CW, bh);
      c.fillStyle = ledDay ? 'rgba(10,125,104,.45)' : 'rgba(62,230,198,.5)'; c.fillRect(0, ya, CW, 3); c.fillRect(0, yb - 3, CW, 3);
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
    const mob = W <= 900;
    const R = mob ? Math.min(W * .72, 340) * 1.15 : H * .725 * 1.15;
    return { mob, cx: W * (mob ? .96 : .30), cy: mob ? 84 : H * 1.097,
      R, hz: mob ? 84 - R * .62 : H * .47 };
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
    if (G.mob) return [{ x0: -.82, x1: -.08, y0: -.48, y1: .12 },
      { x0: Math.max(-1, -G.cx/G.R), x1: Math.min(1,(W-G.cx)/G.R), y0: -1, y1: Math.min(1,G.cy/G.R) }];
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
      base: '#000000', base2: '#000000', cloudL: '#ffffff', cloudD: '#000000', seaDeep: '#000000', seaShal: '#000000',
      bloom: [.6, .45, .72] },
    /* r53 · day in the theme's teal: a teal sky with soft cloud, the open sea, a small stone plaza; the sphere is a bright screen */
    day: { fog: '#bdeee3', fogK: 1 / 6800, zen: '#12b296', hor: '#c2f0e5', glow: '#fff4dc', sunC: '#fff2dc', skyC: '#b4ebe0',
      fac: ['#6f8796', '#cfcac0', '#c8b18e', '#a8735c', '#8d9296'], glass: '#26404f', glassSky: '#9cc2dd', roof: '#8a8d8c',
      asph: '#474c50', lot: '#8b9182', walk: '#bab5ab', plaza: '#d3ccbf', lamp: '#ffa24f', mark: '#f2f2ee', ring: '#2fdcbc', sphC: '#2fdcbc',
      shell: '#97a1a6', off: '#717b81', rim: '#ffffff', gold: '#d9a93e', low: '#000000', gain: 1.5, dim: .16, aurA: '#12b394', aurB: '#d6a43a',
      base: '#f1faf7', base2: '#bcdcd4', cloudL: '#ffffff', cloudD: '#a6d9d0', seaDeep: '#06505a', seaShal: '#0c8a84',
      bloom: [.12, .4, .95] }
  };
  function applyTheme() {
    day = false; const P = day ? PAL.day : PAL.night;
    U.uNight.value = day ? 0 : 1; U.uFogC.value.set(P.fog); U.uFogK.value = P.fogK; U.uSunC.value.set(P.sunC); U.uSkyC.value.set(P.skyC); U.uSphC.value.set(P.sphC);
    skyU.uZen.value.set(P.zen); skyU.uHor.value.set(P.hor); skyU.uGlow.value.set(P.glow).multiplyScalar(day ? .55 : 1);
    P.fac.forEach((h, i) => bU.uFac.value[i].set(h)); bU.uGlass.value.set(P.glass); bU.uGlassSky.value.set(P.glassSky); bU.uRoof.value.set(P.roof);
    gU.uAsph.value.set(P.asph); gU.uLot.value.set(P.lot); gU.uWalk.value.set(P.walk); gU.uPlaza.value.set(P.plaza); gU.uLamp.value.set(P.lamp); gU.uMark.value.set(P.mark); gU.uRing.value.set(P.ring);
    sU.uShell.value.set(P.shell); sU.uOff.value.set(P.off); sU.uRim.value.set(P.rim).multiplyScalar(day ? .5 : 1.1); sU.uGold.value.set(P.gold); sU.uLow.value.set(P.low);
    sU.uGain.value = P.gain; sU.uDim.value = P.dim; sU.uAurA.value.set(P.aurA); sU.uAurB.value.set(P.aurB);
    lamps.visible = false;
    /* r53: night is the city as before; day is the plaza and the sea */
    bMesh.visible = ground.visible = cars.visible = beaconPts.visible = dayG.visible = false;
    sU.uBase.value.set(P.base); sU.uBase2.value.set(P.base2); skyU.uCloudL.value.set(P.cloudL); skyU.uCloudD.value.set(P.cloudD);
    seaU.uDeep.value.set(P.seaDeep); seaU.uShal.value.set(P.seaShal); seaU.uHorC.value.set(P.hor); seaU.uZenC.value.set(P.zen);
    U.uSun.value.copy(day ? SUN_DAY : SUN_NIGHT); ledDay = day;
    cars.material.blending = day ? THREE.NormalBlending : THREE.AdditiveBlending; cars.material.needsUpdate = true;
    carU.uSz.value = day ? 2.2 : 1.3;
    [bloom.strength, bloom.radius, bloom.threshold] = P.bloom;
    tintLogo();
  }

  const SUN_NIGHT = new THREE.Vector3(-.5, .75, .45).normalize(), SUN_DAY = new THREE.Vector3(.3, .2, -.93).normalize();
  /* ---------- the camera, from the sphere ---------- */
  const tmpV = new THREE.Vector3();
  function placeCamera(yaw) {
    yaw = yaw || 0;
    const f = G.mob ? 1.3 * Math.min(H, 1.6 * W) : 1.3 * H;
    const fullW = 2 * Math.max(G.cx, W - G.cx), fullH = 2 * Math.max(G.cy, H - G.cy);
    cam.fov = 2 * Math.atan(fullH / 2 / f) * 180 / Math.PI; cam.aspect = fullW / fullH;
    cam.setViewOffset(fullW, fullH, fullW / 2 - G.cx, fullH / 2 - G.cy, W, H);
    const th = Math.atan((G.cy - G.hz) / f), d = SR / Math.sin(Math.atan(G.R / f));
    cam.position.set(S.x + d * Math.cos(th) * Math.sin(yaw), S.y + d * Math.sin(th), S.z + d * Math.cos(th) * Math.cos(yaw)); cam.up.set(0, 1, 0); cam.lookAt(S);
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
    if (!still) {   /* r55: a slow orbit (about 90 s) plus a little of the mouse; the sphere stays put, space slides behind it */
      smx += (pmx - smx) * .035; placeCamera(.022 * Math.sin(t * .07) + .018 * smx);
    }
    composer.render(); frames++;
  }
  /* r55: no day / night, so no switch effect; the pointer only nudges the camera */
  let pmx = 0, smx = 0;
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') pmx = e.clientX / innerWidth - .5; });
  D.addEventListener('mouseleave', () => { pmx = 0; });
  function loop(now) { raf = 0; if (D.hidden) return; render(now); if (!still) raf = requestAnimationFrame(loop); }
  function kick() { if (!raf && !D.hidden) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  function build() {
    const r = sceneEl.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height); if (!W || !H) return;
    DPR = Math.min(window.devicePixelRatio || 1, W * H > 1.6e6 ? 1.5 : 2);
    G = geo(); applyTheme(); placeCamera();
    renderer.setPixelRatio(DPR); renderer.setSize(W, H, false); composer.setPixelRatio(DPR); composer.setSize(W, H);
    U.uPx.value = DPR; sU.uDisc.value.set(G.cx, G.cy, G.R); sU.uRes.value.set(W, H); sU.uDpr.value = DPR;
    sU.uCell.value = Math.max(3.2, Math.min(4.5, G.R / 155)) / G.R;          // one LED every ~3–4.5 CSS px across the front (r54)
    const rects = textRects(); rects.slice(0, 4).forEach((q, i) => sU.uRects.value[i].set(q[0], q[1], q[2], q[3])); for (let i = rects.length; i < 4; i++) sU.uRects.value[i].set(-9e3, -9e3, -9e3, -9e3);
    [ST, VIS] = stage(rects); sizeTex(); sU.uTR.value.set(VIS.x0, VIS.y0, VIS.x1, VIS.y1);
    nav.style.left = G.cx + 'px'; nav.style.top = (H - 44) + 'px';
    spaceLayout();
    drawAll(); bindSlots(); navLabels();
    render(performance.now()); kick();
  }
  /* r55: the resting camera's basis for the sky, the card to keep clear, and the dust for this layout */
  function spaceLayout() {
    placeCamera(0);
    skyU.uRt.value.setFromMatrixColumn(cam.matrixWorld, 0); skyU.uUp.value.setFromMatrixColumn(cam.matrixWorld, 1);
    skyU.uFw.value.setFromMatrixColumn(cam.matrixWorld, 2).negate();
    skyU.uC.value.set(G.cx, G.cy); skyU.uWH.value.set(W, H); skyU.uFp.value = G.f; skyU.uDiscS.value.set(G.cx, G.cy, G.R);
    const ar = W / H, cr = (D.getElementById('card') || {}).getBoundingClientRect ? D.getElementById('card').getBoundingClientRect() : null;
    if (cr && cr.width) skyU.uCard.value.set(cr.left, cr.top + (window.scrollY || 0), cr.right, cr.bottom + (window.scrollY || 0)); else skyU.uCard.value.set(-9e3, -9e3, -9e3, -9e3);
    if (G.mob) {   /* phone: the sphere sits top-right, so space opens to its lower left */
      skyU.uNebDir.value.set(-.62, .78); skyU.uBand.value.set(.05 * ar, .62, .55, -1); skyU.uGal.value.set(.20 * ar, .25, -.5, .032);
    } else {
      skyU.uNebDir.value.set(.72, -.69); skyU.uBand.value.set(.30 * ar, .12, 1, -.30); skyU.uGal.value.set(.105 * ar, .15, .45, .036);
    }
    dustU.uDpr.value = DPR; dustU.uDiscD.value.set(G.cx * DPR, (H - G.cy) * DPR, (G.R + 2) * DPR);
    const cv4 = skyU.uCard.value; dustU.uCardD.value.set(cv4.x * DPR, (H - cv4.w) * DPR, cv4.z * DPR, (H - cv4.y) * DPR);
    const n = Math.round(Math.min(1, W * H / 1.2e6) * 1);
    fillDust(dustFar, Math.round((G.mob ? 140 : 260) * Math.max(.6, n)), G.d * 1.8, G.d * 5, 1.2, 2.6, .18, .55, 5501);
    fillDust(dustNear, G.mob ? 14 : 26, G.d * .32, G.d * .7, 3, 7, .05, .16, 5502);
    skyU.uStill.value = dustU.uStill.value = still ? 1 : 0;
  }
  let sigv = ''; const sig = () => [innerWidth, innerHeight, root.dataset.theme, root.lang].join('|');
  function maybe(force) { const s = sig(); if (force || s !== sigv) { sigv = s; build(); } }
  let rzT = 0; addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => maybe(), 60); });
  // No day/night transition in the single space scene.
  addEventListener('td:lang', () => setTimeout(() => maybe(true), 40));
  D.addEventListener('visibilitychange', () => { if (D.hidden) stop(); else kick(); });
  addEventListener('pageshow', kick);
  if (RM && RM.addEventListener) RM.addEventListener('change', () => { still = RM.matches; skyU.uStill.value = dustU.uStill.value = still ? 1 : 0; if (still) { placeCamera(0); frozenT = clock(); nxt = -1; sU.uMix.value = 0; bindSlots(); } render(performance.now()); kick(); });
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(() => maybe(true));
  maybe(true);

  window.__city = {
    mode: 'webgl', grid: false, environment: 'space', version: 'r55', space: { dustFar: () => dustFar.geometry.attributes.position ? dustFar.geometry.attributes.position.count : 0, dustNear: () => dustNear.geometry.attributes.position ? dustNear.geometry.attributes.position.count : 0, yaw: () => +Math.atan2(cam.position.x - S.x, cam.position.z - S.z).toFixed(4) }, ledSpacing: () => sU.uCell.value * G.R,
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
