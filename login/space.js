/* 3dtrading r57 · login deep space = the r55 sky, unchanged, behind the earlier planet (planet.js).
   Kept from r55 city.js verbatim: the sky shader (Milky-Way band with dark lanes, teal nebula hugging the planet's limb,
   one distant galaxy, three star layers with a slow twinkle, everything damped behind the card), the two parallax dust
   layers, the slow camera drift plus a little of the mouse, and the same bloom.
   Removed for good: the Dodo LED sphere, its scheme textures and dots, the city (ground, buildings, cars, beacons, lamps),
   the day plaza and sea. No geometry is built for any of them.
   The disc the sky keeps clear is the planet's own disc, with planet.js's placement:
   desktop R = min(0.36W, 0.74H), centre (0.3W, H + 0.12R); phone (W < 900) R = 0.62W, centre (0.92W, 40).
   The GL frame is drawn at most 30 times a second (the drift is ~90 s per orbit); a hidden tab draws nothing;
   reduced motion = one still frame. No WebGL → planet.js keeps its own 2D sky (the r56 fallback). */
import * as THREE from './vendor/three/build/three.module.min.js';
import { EffectComposer } from './vendor/three/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/three/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/three/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/three/jsm/postprocessing/OutputPass.js';

const D = document, root = D.documentElement, sceneEl = D.getElementById('scene'), cv0 = D.getElementById('space');
let RM = null; try { RM = matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { /* old browsers */ }

function fail(why) {
  window.__space = { mode: '2d', why: why || 'webgl' };
  if (cv0) cv0.hidden = true;
  window.dispatchEvent(new CustomEvent('td:space', { detail: window.__space }));
}

let renderer = null;
if (sceneEl && cv0 && !/[?&]nogl\b/.test(location.search)) {
  try { renderer = new THREE.WebGLRenderer({ canvas: cv0, antialias: false, powerPreference: 'high-performance', stencil: false, depth: true }); }
  catch (e) { renderer = null; }
}
if (!renderer) fail('no-webgl'); else { try { start(); } catch (e) { console.warn('space', e); fail('error'); } }

function start() {
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const col = h => new THREE.Color(h);
  const u = v => ({ value: v });

  const cv = renderer.domElement;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); fail('context-lost'); }, false);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, 1, 2, 32000);
  const S = new THREE.Vector3(0, 22, 0), SR = 60;              // a virtual sphere the camera orbits: the planet's disc on screen
  const U = { uNight: u(1), uTime: u(0), uSun: u(new THREE.Vector3(-.5, .75, .45).normalize()), uSunC: u(col('#1a2632')) };
  let W = 0, H = 0, DPR = 1, G = null, still = !!(RM && RM.matches);

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

  /* ---------- geometry: the planet's disc (same numbers as planet.js) ---------- */
  function geo() {
    const mob = W < 900;
    const R = mob ? W * .78 : Math.min(W * .36, H * .74);   // r61: phone placement = planet.js PM
    const cx = mob ? W * .97 : W * .3, cy = mob ? 24 : H + R * .12;
    return { mob, cx, cy, R, hz: mob ? cy - R * .62 : H * .47 };
  }

  /* ---------- post: bloom, tone map (r55 night values) ---------- */
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .6, .45, .72); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------- the camera (r55) ---------- */
  function placeCamera(yaw) {
    yaw = yaw || 0;
    const f = G.mob ? 1.3 * Math.min(H, 1.6 * W) : 1.3 * H;
    const fullW = 2 * Math.max(G.cx, W - G.cx), fullH = 2 * Math.max(G.cy, H - G.cy);
    cam.fov = 2 * Math.atan(fullH / 2 / f) * 180 / Math.PI; cam.aspect = fullW / fullH;
    cam.setViewOffset(fullW, fullH, fullW / 2 - G.cx, fullH / 2 - G.cy, W, H);
    const th = Math.atan((G.cy - G.hz) / f), d = SR / Math.sin(Math.atan(G.R / f));
    cam.position.set(S.x + d * Math.cos(th) * Math.sin(yaw), S.y + d * Math.sin(th), S.z + d * Math.cos(th) * Math.cos(yaw)); cam.up.set(0, 1, 0); cam.lookAt(S);
    cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    G.f = f; G.d = d; sky.position.copy(cam.position);
  }

  /* ---------- loop ---------- */
  const T0 = performance.now(); let frozenT = 6.5;
  const clock = () => still ? frozenT : (performance.now() - T0) / 1000;
  let raf = 0, lastDraw = 0, frames = 0, pmx = 0, smx = 0;
  function render() {
    U.uTime.value = clock();
    if (!still) { smx += (pmx - smx) * .06; placeCamera(.022 * Math.sin(U.uTime.value * .07) + .018 * smx); }
    composer.render(); frames++;
  }
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') pmx = e.clientX / innerWidth - .5; }, { passive: true });
  D.addEventListener('mouseleave', () => { pmx = 0; });
  function loop(now) { raf = 0; if (D.hidden || still || D.documentElement.classList.contains('embed-wait')) return; if (now - lastDraw >= 32) { lastDraw = now; render(); } raf = requestAnimationFrame(loop); }
  function kick() { if (!raf && !D.hidden && !still) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  function build() {
    const r = sceneEl.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height); if (!W || !H) return;
    DPR = Math.min(window.devicePixelRatio || 1, W * H > 1.6e6 ? 1.5 : 2);
    G = geo(); placeCamera(0);
    renderer.setPixelRatio(DPR); renderer.setSize(W, H, false); composer.setPixelRatio(DPR); composer.setSize(W, H);
    spaceLayout(); render(); kick();
  }
  /* r55: the resting camera's basis for the sky, the card to keep clear, and the dust for this layout */
  function spaceLayout() {
    placeCamera(0);
    skyU.uRt.value.setFromMatrixColumn(cam.matrixWorld, 0); skyU.uUp.value.setFromMatrixColumn(cam.matrixWorld, 1);
    skyU.uFw.value.setFromMatrixColumn(cam.matrixWorld, 2).negate();
    skyU.uC.value.set(G.cx, G.cy); skyU.uWH.value.set(W, H); skyU.uFp.value = G.f; skyU.uDiscS.value.set(G.cx, G.cy, G.R);
    const ar = W / H, ce = D.getElementById('card'), cr = ce ? ce.getBoundingClientRect() : null, sy = window.scrollY || 0;
    if (cr && cr.width) skyU.uCard.value.set(cr.left, cr.top + sy, cr.right, cr.bottom + sy); else skyU.uCard.value.set(-9e3, -9e3, -9e3, -9e3);
    if (G.mob) {   /* phone: the planet sits top-right, so space opens to its lower left */
      skyU.uNebDir.value.set(-.62, .78); skyU.uBand.value.set(.05 * ar, .62, .55, -1); skyU.uGal.value.set(.20 * ar, .25, -.5, .032);
    } else {
      skyU.uNebDir.value.set(.72, -.69); skyU.uBand.value.set(.30 * ar, .12, 1, -.30); skyU.uGal.value.set(.105 * ar, .15, .45, .036);
    }
    dustU.uDpr.value = DPR; dustU.uDiscD.value.set(G.cx * DPR, (H - G.cy) * DPR, (G.R + 2) * DPR);
    const cv4 = skyU.uCard.value; dustU.uCardD.value.set(cv4.x * DPR, (H - cv4.w) * DPR, cv4.z * DPR, (H - cv4.y) * DPR);
    const n = Math.min(1, W * H / 1.2e6);
    fillDust(dustFar, Math.round((G.mob ? 140 : 260) * Math.max(.6, n)), G.d * 1.8, G.d * 5, 1.2, 2.6, .18, .55, 5501);
    fillDust(dustNear, G.mob ? 14 : 26, G.d * .32, G.d * .7, 3, 7, .05, .16, 5502);
    skyU.uStill.value = dustU.uStill.value = still ? 1 : 0;
  }
  let sigv = ''; const sig = () => [innerWidth, innerHeight, root.lang].join('|');
  function maybe(force) { const s = sig(); if (force || s !== sigv) { sigv = s; build(); } }
  let rzT = 0; addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => maybe(), 60); });
  addEventListener('td:lang', () => setTimeout(() => maybe(true), 40));
  D.addEventListener('visibilitychange', () => { if (D.hidden) stop(); else kick(); });
  addEventListener('td:join', () => kick());   // r63 · 预载在官网里时不画；交接那一刻开始
  addEventListener('pageshow', kick);
  if (RM && RM.addEventListener) RM.addEventListener('change', () => { still = RM.matches; if (still) { frozenT = clock(); placeCamera(0); } skyU.uStill.value = dustU.uStill.value = still ? 1 : 0; render(); kick(); });
  if (window.ResizeObserver) { const ce = D.getElementById('card'); if (ce) new ResizeObserver(() => { if (G) { spaceLayout(); if (still) render(); } }).observe(ce); }
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(() => maybe(true));
  maybe(true);

  window.__space = {
    mode: 'webgl', version: 'r57', sky: 'r55', still: () => still, frames: () => frames,
    snap: () => { if (!G) maybe(true); if (G) render(); return cv0; },   // r73 · 6: the website takes one real frame even while this page waits hidden (rendered and read in the same task)
    disc: () => G && { cx: Math.round(G.cx), cy: Math.round(G.cy), R: Math.round(G.R), mob: G.mob },
    dust: () => [dustFar, dustNear].map(m => m.geometry.attributes.position ? m.geometry.attributes.position.count : 0),
    meshes: () => scene.children.length, yaw: () => +Math.atan2(cam.position.x - S.x, cam.position.z - S.z).toFixed(4)
  };
  window.dispatchEvent(new CustomEvent('td:space', { detail: window.__space }));
}
