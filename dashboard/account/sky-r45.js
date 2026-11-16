/* r45 · log-in / sign-up sky. Day = the sun, night = the moon, both a little high-tech; the page layout around it is r43's.
   Same place and size as the r42/r43 planet (desktop: rises from the lower left, phone: top right corner), same pointer
   parallax, same text-aware masking (nothing busy behind the copy or the form), reduced motion = one still frame.

   NIGHT  · the moon: a shaded sphere rendered once per size into its own canvas (maria, ~230 craters with lit rims and shadowed
            floors, one light from the upper left, a faint earthshine on the dark side). It is tidally locked, so the body does
            not spin; over it a holographic teal dot mesh (the 1100 Fibonacci points of the old planet) turns slowly, with the gold
            pillars as beacons. Two tilted orbit rings with a scale and a satellite each pass behind and in front of it.
            Around it: the r43 Milky Way band (kept, it flows along its length) plus nebula washes, a denser three-depth star
            field and a faint constellation network, so the whole screen is filled rather than one stripe. A small far Earth.
   DAY    · the sun: a warm disc with limb darkening and a slowly turning granulation mesh, a corona, ~40 soft rays that shimmer,
            two HUD rings with ticks turning in opposite directions and one scanning arc, and a solar wind of fine streaks that
            stream outward across the whole sky. The sky itself is a light cyan → pale blue gradient (CSS), bright and clean.
   Exposed for tests: window.__orb. */
(function () {
  var cv = document.getElementById('orb'); if (!cv || !cv.getContext) return;
  var g = cv.getContext('2d'), GL = document.getElementById('gx'), W, H, dpr, cx, cy, R, mob, FN = 0;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function rnd(seed) { var x = Math.sin(seed * 91.17 + 12.9) * 43758.5453; return x - Math.floor(x); }
  function gauss(seed) { return (rnd(seed) + rnd(seed + .31) + rnd(seed + .67) + rnd(seed + .93) - 2) / 1.15; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function nrm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  /* ---- the old planet's mesh: 1100 Fibonacci points + 7 gold pillars, tilt −0.32 ---- */
  var N = 1100, P = [], GA = Math.PI * (3 - Math.sqrt(5));
  for (var i = 0; i < N; i++) { var y = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - y * y), t = GA * i; P.push([Math.cos(t) * r, y, Math.sin(t) * r]); }
  var GOLD = [[.3, .55, .2], [-.5, .62, .1], [.05, .8, -.2], [.62, .35, -.3], [-.2, .45, .55], [-.7, .3, -.35], [.4, .7, .45]].map(nrm);
  var tilt = -.32, ct = Math.cos(tilt), st = Math.sin(tilt);
  function rot(p, a) { var c = Math.cos(a), s = Math.sin(a), x = p[0] * c + p[2] * s, z = -p[0] * s + p[2] * c, y = p[1]; return [x, y * ct - z * st, y * st + z * ct]; }
  var L = nrm([-.55, .5, .62]);   // day: one light from the upper left, toward the viewer
  var LM = nrm([.62, .42, .5]);    // night: the moon is lit from the upper right, so the copy on the left sits over its dark, earthshine side

  /* ---- the moon, rendered once per size ---- */
  var MOONC = null, MOONK = '';
  var MARIA = [[[-.35, .42, .84], .42, .2], [[.18, .3, .94], .3, .17], [[.42, .05, .9], .34, .2], [[-.1, -.2, .97], .26, .12], [[-.6, -.1, .8], .38, .16], [[.25, .62, .74], .22, .12]].map(function (m) { return [nrm(m[0]), m[1], m[2]]; });
  var CRAT = (function () { var out = []; for (var k = 0; k < 230; k++) { var u = rnd(k * 3 + 1), v = rnd(k * 3 + 2), z = .05 + .95 * u, ph = v * 6.283, rr = Math.sqrt(1 - z * z);
      var size = .012 + Math.pow(rnd(k * 3 + 3), 3.2) * .17; out.push([[rr * Math.cos(ph), rr * Math.sin(ph), z], size, .6 + rnd(k + 999) * .5]); }
    out.push([nrm([-.22, -.55, .8]), .07, 1.4]);   // one young bright crater (Tycho-like), with rays below
    return out; })();
  function noise3(x, y, z) { return Math.sin(x * 17.1 + y * 3.7) * Math.sin(y * 13.3 - z * 5.1) * Math.sin(z * 11.7 + x * 7.3) * .5 + Math.sin(x * 41 - y * 29 + z * 13) * Math.sin(y * 37 + z * 23) * .25; }
  function buildMoon() {
    var q = Math.min(2, dpr), S = Math.max(16, Math.ceil(R * 2 * q)), key = S + '';
    if (MOONC && MOONK === key) return; MOONK = key;
    var c = MOONC = MOONC || document.createElement('canvas'); c.width = c.height = S;
    var x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, half = S / 2;
    var alb = new Float32Array(S * S), add = new Float32Array(S * S), nx = new Float32Array(S * S), ny = new Float32Array(S * S), nz = new Float32Array(S * S);
    for (var py = 0; py < S; py++) for (var px = 0; px < S; px++) {
      var o = py * S + px, X = (px + .5) / half - 1, Y = 1 - (py + .5) / half, rr = X * X + Y * Y; if (rr > 1.004) { nz[o] = -1; continue; }
      var Z = Math.sqrt(Math.max(0, 1 - rr)); nx[o] = X; ny[o] = Y; nz[o] = Z;
      var a = .66 + noise3(X * 2, Y * 2, Z * 2) * .06 + noise3(X * 7, Y * 7, Z * 7) * .03;
      for (var m = 0; m < MARIA.length; m++) { var M = MARIA[m], dot = X * M[0][0] + Y * M[0][1] + Z * M[0][2], ang = Math.acos(clamp(dot, -1, 1)) / M[1];
        if (ang < 1.4) { var w = ang < .7 ? 1 : 1 - (ang - .7) / .7; a -= M[2] * w * w * (3 - 2 * w) * (.85 + noise3(X * 5 + m, Y * 5, Z * 5) * .3); } }
      alb[o] = a;
    }
    // craters: only touch the pixels around each one
    for (var k = 0; k < CRAT.length; k++) {
      var C = CRAT[k], c0 = C[0], rho = C[1], str = C[2]; if (c0[2] < -.05) continue;
      var ext = Math.sin(Math.min(1.5, rho * 1.35)) * half + 2, ccx = (c0[0] + 1) * half, ccy = (1 - c0[1]) * half;
      var x0 = Math.max(0, Math.floor(ccx - ext)), x1 = Math.min(S - 1, Math.ceil(ccx + ext)), y0 = Math.max(0, Math.floor(ccy - ext)), y1 = Math.min(S - 1, Math.ceil(ccy + ext));
      for (var yy = y0; yy <= y1; yy++) for (var xx = x0; xx <= x1; xx++) {
        var oo = yy * S + xx; if (nz[oo] < 0) continue;
        var n0 = nx[oo], n1 = ny[oo], n2 = nz[oo], dt = n0 * c0[0] + n1 * c0[1] + n2 * c0[2], tt = Math.acos(clamp(dt, -1, 1)) / rho; if (tt > 1.3) continue;
        var v0 = n0 - c0[0] * dt, v1 = n1 - c0[1] * dt, v2 = n2 - c0[2] * dt, vl = Math.hypot(v0, v1, v2); if (vl < 1e-6) continue;
        var nl = n0 * LM[0] + n1 * LM[1] + n2 * LM[2], l0 = LM[0] - n0 * nl, l1 = LM[1] - n1 * nl, l2 = LM[2] - n2 * nl, ll = Math.hypot(l0, l1, l2) || 1;
        var s = (v0 * l0 + v1 * l1 + v2 * l2) / (vl * ll);   // +1: this pixel is on the crater's side toward the light
        if (tt < 1) { add[oo] += -s * Math.sin(Math.PI * tt) * .42 * str; alb[oo] -= .05 * str * (1 - tt * tt); }
        var b = (tt - 1.0) / .13, rim = Math.exp(-b * b); add[oo] += s * rim * .3 * str; alb[oo] += .05 * rim * str;
      }
    }
    // the young crater's rays
    var T0 = CRAT[CRAT.length - 1][0];
    for (var o2 = 0; o2 < S * S; o2++) { if (nz[o2] < 0) continue; var dd = nx[o2] * T0[0] + ny[o2] * T0[1] + nz[o2] * T0[2], an = Math.acos(clamp(dd, -1, 1));
      if (an > .09 && an < .9) { var bx = nx[o2] - T0[0] * dd, by = ny[o2] - T0[1] * dd, ph2 = Math.atan2(by, bx), ray = Math.pow(Math.max(0, Math.sin(ph2 * 7 + 1.3) * Math.sin(ph2 * 11 + .4)), 6); alb[o2] += ray * .1 * (1 - an / .9); } }
    for (var o3 = 0; o3 < S * S; o3++) {
      if (nz[o3] < 0) continue; var p3 = o3 * 4, X3 = nx[o3], Y3 = ny[o3], Z3 = nz[o3];
      var lam = X3 * LM[0] + Y3 * LM[1] + Z3 * LM[2], lit = clamp(lam * 1.05 + .04, 0, 1); lit = lit * (1 + add[o3] * (lit > .02 ? 1 : 0));
      var earth = .045 * (1 - clamp(lam * 3 + .3, 0, 1)), v3 = clamp(alb[o3], .18, 1) * clamp(lit, 0, 1.25) + earth;
      var limb = .82 + .18 * Z3;   // a touch of limb darkening keeps it round
      v3 *= limb;
      v3 *= .62;   // a night moon: quieter than paper-white so the form and copy stay the brightest things on screen
      d[p3] = clamp(v3 * 226, 0, 255); d[p3 + 1] = clamp(v3 * 232, 0, 255); d[p3 + 2] = clamp(v3 * 236 + earth * 90, 0, 255);
      var rr3 = Math.sqrt(X3 * X3 + Y3 * Y3); d[p3 + 3] = 255 * clamp((1 - rr3) * half + .5, 0, 1);
    }
    x.putImageData(img, 0, 0);
  }

  /* ---- r43 Milky Way (kept): two periodic strips per theme, drawn along one diagonal, scrolled along it ---- */
  var GX = { night: null, day: null }, GM = null, BAND = { ang: 0, ox: 0, oy: 0, len: 0, wid: 0, per: 0 }, boxes = [];
  function strip(day, stars) {
    var per = BAND.per, wid = BAND.wid, q = mob ? 1 : Math.min(1.5, dpr), c = document.createElement('canvas');
    c.width = Math.ceil(per * q); c.height = Math.ceil(wid * q);
    var x = c.getContext('2d'); x.scale(q, q);
    function wrap(fn, px) { fn(px); if (px < wid) fn(px + per); if (px > per - wid) fn(px - per); }
    if (!stars) {
      x.globalCompositeOperation = day ? 'source-over' : 'lighter';
      for (var i = 0; i < 90; i++) {
        var px = rnd(i + 1) * per, py = wid / 2 + gauss(i + 5) * wid * .17, r = wid * (.1 + rnd(i + 9) * .22), k = rnd(i + 13);
        var col = day ? (k < .5 ? '120,186,214' : k < .85 ? '90,196,190' : '240,196,120') : (k < .45 ? '47,200,178' : k < .8 ? '96,118,214' : '232,196,140');
        var al = day ? .05 + rnd(i + 17) * .05 : .055 + rnd(i + 17) * .065;
        wrap(function (X) { var gr = x.createRadialGradient(X, py, 0, X, py, r); gr.addColorStop(0, 'rgba(' + col + ',' + al + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)'); x.fillStyle = gr; x.beginPath(); x.arc(X, py, r, 0, 7); x.fill(); }, px);
      }
      if (!day) { x.globalCompositeOperation = 'destination-out';
        for (var j = 0; j < 70; j++) { var lx = rnd(j + 201) * per, ly = wid * .47 + gauss(j + 207) * wid * .05 + Math.sin(lx / per * 6.283 * 2) * wid * .04, lr = wid * (.04 + rnd(j + 211) * .07);
          wrap(function (X) { var gr = x.createRadialGradient(X, ly, 0, X, ly, lr); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.beginPath(); x.arc(X, ly, lr, 0, 7); x.fill(); }, lx); } }
    } else {
      var n = Math.round(per * wid / (mob ? 260 : 170));
      for (var s2 = 0; s2 < n; s2++) {
        var sx = rnd(s2 + 401) * per, sy = wid / 2 + gauss(s2 + 409) * wid * .2, b = rnd(s2 + 419), z = b * b * b, sz = .5 + z * 1.6; if (sy < 0 || sy > wid) continue;
        var a2 = day ? .1 + z * .34 : .16 + z * .7;
        x.fillStyle = day ? (b > .9 ? 'rgba(10,138,115,' + a2 + ')' : 'rgba(40,86,110,' + a2 + ')') : (b > .93 ? 'rgba(255,226,170,' + a2 + ')' : b > .8 ? 'rgba(150,240,222,' + a2 + ')' : 'rgba(214,228,240,' + a2 + ')');
        wrap(function (X) { x.fillRect(X - sz / 2, sy - sz / 2, sz, sz); }, sx);
      }
    }
    return c;
  }
  function galaxyTex(day) { var k = day ? 'day' : 'night'; if (!GX[k]) GX[k] = { clouds: strip(day, false), stars: strip(day, true) }; return GX[k]; }
  function galaxyGeom() {
    BAND.ang = mob ? Math.atan2(H * .55, -W) : Math.atan2(H * 1.1, -(W * .5));
    BAND.ox = mob ? W * .55 : W * .52; BAND.oy = mob ? H * .3 : H * .48;
    BAND.len = Math.hypot(W, H) * 1.3; BAND.wid = Math.min(mob ? 300 : 520, Math.max(W, H) * .42); BAND.per = Math.round(Math.max(900, BAND.wid * 2.6));
    GX = { night: null, day: null };
    if (GL) { GL.width = cv.width; GL.height = cv.height; }
  }
  function galaxyMask() {
    GM = GM || document.createElement('canvas'); GM.width = Math.ceil(W / 4); GM.height = Math.ceil(H / 4);
    var m = GM.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, GM.width, GM.height);
    m.fillStyle = '#000'; m.fillRect(0, 0, GM.width, GM.height);
    m.globalCompositeOperation = 'destination-out'; m.filter = 'blur(6px)'; m.fillStyle = 'rgba(0,0,0,.66)';
    boxes.forEach(function (b) { m.fillRect(b[0] / 4, b[1] / 4, (b[2] - b[0]) / 4, (b[3] - b[1]) / 4); });
    m.filter = 'none'; m.globalCompositeOperation = 'source-over';
  }
  var G_SPEED = { clouds: .0045, stars: .011 };
  var NEB = [[.86, .16, .55, '47,200,178', .085], [.12, .34, .5, '86,104,214', .07], [.62, .9, .6, '47,170,200', .06], [.4, .05, .35, '150,110,220', .04]];
  function galaxy(t, day) {
    if (!GL) return;
    var tex = galaxyTex(day), l = GL.getContext('2d'), per = BAND.per, wid = BAND.wid, len = BAND.len;
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, GL.width, GL.height);
    l.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!day) NEB.forEach(function (n, k) {   // nebula washes: fill the corners the band does not reach
      var x = n[0] * W - mx * (8 + k * 3), y = n[1] * H - my * 6, r = n[2] * Math.max(W, H), br = still ? 1 : .85 + .15 * Math.sin(t * .0002 + k * 1.7);
      var gr = l.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(' + n[3] + ',' + (n[4] * br).toFixed(3) + ')'); gr.addColorStop(.5, 'rgba(' + n[3] + ',' + (n[4] * br * .35).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + n[3] + ',0)');
      l.fillStyle = gr; l.fillRect(0, 0, W, H); });
    var breathe = still ? 1 : .86 + .14 * Math.sin(t * .00025);
    [['clouds', breathe], ['stars', still ? .9 : .8 + .2 * Math.sin(t * .0007)]].forEach(function (Lr) {
      var img = tex[Lr[0]], off = still ? 0 : (t * G_SPEED[Lr[0]]) % per;
      l.save(); l.translate(BAND.ox - mx * (Lr[0] === 'stars' ? 14 : 6), BAND.oy - my * (Lr[0] === 'stars' ? 10 : 4)); l.rotate(BAND.ang); l.globalAlpha = Lr[1];
      for (var x0 = -len / 2 - per + off; x0 < len / 2; x0 += per) l.drawImage(img, x0, -wid / 2, per, wid);
      l.restore();
    });
    if (GM) { l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'destination-in'; l.drawImage(GM, 0, 0, GL.width, GL.height); l.globalCompositeOperation = 'source-over'; }
  }

  /* ---- star field (night) / solar wind (day), constellation net ---- */
  var FIELD = [], NET = [], WIND = [], FAR = null;
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1); W = document.documentElement.clientWidth; H = innerHeight; mob = W < 900;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (mob) { R = W * .62; cx = W * .92; cy = 40; } else { R = Math.min(W * .36, H * .74); cx = W * .3; cy = H + R * .12; }
    FIELD = []; var n = Math.round(W * H / (mob ? 3000 : 3600));
    for (var s = 0; s < n; s++) { var z = hash(s * 1.37 + .2); z = z * z; FIELD.push({ x: hash(s + .1), y: hash(s + .7), z: z, ph: hash(s + .9) * 6.28, sp: .3 + hash(s + .3) * .7 }); }
    // the network joins the nearer stars that are close to each other; each star at most 3 links
    NET = []; var cand = []; FIELD.forEach(function (f, k) { if (f.z > .22) cand.push(k); });
    var deg = {}, maxD = mob ? 90 : 130;
    for (var a = 0; a < cand.length; a++) for (var b = a + 1; b < cand.length; b++) {
      var A = FIELD[cand[a]], B = FIELD[cand[b]], d = Math.hypot((A.x - B.x) * W, (A.y - B.y) * H);
      if (d < maxD && (deg[a] || 0) < 3 && (deg[b] || 0) < 3) { NET.push([cand[a], cand[b], d / maxD]); deg[a] = (deg[a] || 0) + 1; deg[b] = (deg[b] || 0) + 1; } }
    WIND = []; var nw = mob ? 150 : 300;
    for (var w = 0; w < nw; w++) WIND.push({ th: hash(w * 2.1 + 5) * 6.283, u: hash(w * 3.3 + 1), sp: .5 + hash(w * 1.7 + 9) * 1, len: 6 + hash(w + 77) * 22, k: hash(w + 31) });
    galaxyGeom(); buildMoon(); measure();
  }
  function measure() {
    boxes = []; var hr = 0, cl = W;
    document.querySelectorAll('.hero .eyebrow,.hero h1,.hero .lede,.pts li,.card,.top').forEach(function (e) { var b = e.getBoundingClientRect(); if (b.width > 2 && b.height > 2) { boxes.push([b.left - 14, b.top - 10, b.right + 14, b.bottom + 10]); if (e.classList.contains('card')) cl = b.left; else if (!e.classList.contains('top')) hr = Math.max(hr, b.right); } });
    var mr = Math.max(9, Math.min(W, H) * .02);
    FAR = !mob && cl - hr > mr * 7 ? { x: (hr + cl) / 2, y: Math.max(130, H * .2), r: mr } : null;   // the small far body sits in the gap between copy and form
    galaxyMask();
  }
  function clear(x, y) { for (var i = 0; i < boxes.length; i++) { var b = boxes[i]; if (x > b[0] && x < b[2] && y > b[1] && y < b[3]) return .16; } return 1; }
  var mx = 0, my = 0, tx = 0, ty = 0;
  if (!still) addEventListener('pointermove', function (e) { tx = e.clientX / W - .5; ty = e.clientY / H - .5; }, { passive: true });
  function starPos(f, t) { var drift = still ? 0 : t * .000004 * (.3 + f.z * 1.4) * f.sp; return [((f.x + drift) % 1) * W - mx * (4 + f.z * 22), f.y * H - my * (3 + f.z * 16)]; }
  function stars(t) {
    var X = cx - mx * 8, Y = cy - my * 6, RR = R * R * 1.02;
    g.lineWidth = 1;
    for (var k = 0; k < NET.length; k++) { var e = NET[k], a = starPos(FIELD[e[0]], t), b = starPos(FIELD[e[1]], t);
      var mxp = (a[0] + b[0]) / 2, myp = (a[1] + b[1]) / 2; if ((mxp - X) * (mxp - X) + (myp - Y) * (myp - Y) < RR * 1.1) continue;
      var al = (1 - e[2]) * .16 * clear(mxp, myp) * (still ? 1 : .7 + .3 * Math.sin(t * .0006 + k));
      if (al < .01) continue; g.strokeStyle = 'rgba(110,236,212,' + al.toFixed(3) + ')'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    for (var i = 0; i < FIELD.length; i++) {
      var f = FIELD[i], p = starPos(f, t), x = p[0], y = p[1], dx = x - X, dy = y - Y; if (dx * dx + dy * dy < RR) continue;
      var tw = still ? .8 : .65 + .35 * Math.sin(t * .0011 * f.sp + f.ph), m = clear(x, y), s = .6 + f.z * 1.6, al2 = (.1 + .5 * f.z) * tw * m;
      g.fillStyle = (f.z > .7 ? 'rgba(130,240,218,' : f.z > .5 ? 'rgba(255,230,190,' : 'rgba(205,226,236,') + al2.toFixed(3) + ')'; g.fillRect(x - s / 2, y - s / 2, s, s);
      if (f.z > .82 && m > .5) { g.fillStyle = 'rgba(130,240,218,' + (al2 * .25).toFixed(3) + ')'; g.fillRect(x - s * 2.2, y - .4, s * 4.4, .8); g.fillRect(x - .4, y - s * 2.2, .8, s * 4.4); }   // a few bright ones get a cross glint
    }
  }
  function farBody(day) {
    if (!FAR || day) return; var x = FAR.x - mx * 6, y = FAR.y - my * 4, r = FAR.r;   // night only: a small far Earth, lit by the same light
    var h = g.createRadialGradient(x, y, r * .8, x, y, r * 3.4); h.addColorStop(0, 'rgba(70,170,255,.12)'); h.addColorStop(1, 'rgba(70,170,255,0)');
    g.fillStyle = h; g.beginPath(); g.arc(x, y, r * 3.4, 0, 7); g.fill();
    var b = g.createRadialGradient(x + L[0] * r * .55, y - L[1] * r * .55, r * .1, x, y, r); b.addColorStop(0, '#5fb6e8'); b.addColorStop(.5, '#1d5f86'); b.addColorStop(1, '#06121c');
    g.fillStyle = b; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.strokeStyle = 'rgba(150,220,255,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r - .5, Math.PI * .72, Math.PI * 1.62); g.stroke();
  }

  /* ---- shared: the mesh + pillars over the body ---- */
  function mesh(a, X, Y, rgb, lo, hi, faceOnly) {
    for (var i = 0; i < N; i++) {
      var q = rot(P[i], a); if (q[2] < (faceOnly ? 0 : -.15)) continue;
      var x = X + q[0] * R, y = Y - q[1] * R, k = (q[2] + .15) / 1.15;
      g.fillStyle = 'rgba(' + rgb + ',' + (lo + hi * k * k).toFixed(3) + ')'; var s = .8 + 1.5 * k; g.fillRect(x - s / 2, y - s / 2, s, s);
    }
  }
  function pillars(a, X, Y, day) {
    GOLD.forEach(function (p, idx) {
      var q = rot(p, a); if (q[2] < .05) return;
      var x0 = X + q[0] * R, y0 = Y - q[1] * R, Lp = 1 + (idx % 3 + 1) * .07, x1 = X + q[0] * R * Lp, y1 = Y - q[1] * R * Lp, f = Math.min(1, q[2] * 2);
      var gr = g.createLinearGradient(x0, y0, x1, y1);
      if (day) { gr.addColorStop(0, 'rgba(168,112,10,' + (.2 * f) + ')'); gr.addColorStop(1, 'rgba(214,150,30,' + f + ')'); }
      else { gr.addColorStop(0, 'rgba(232,184,74,' + (.15 * f) + ')'); gr.addColorStop(1, 'rgba(245,210,122,' + (.95 * f) + ')'); }
      g.strokeStyle = gr; g.lineWidth = mob ? 2.5 : 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.fillStyle = (day ? 'rgba(200,136,18,' : 'rgba(255,226,150,') + f + ')'; g.beginPath(); g.arc(x1, y1, mob ? 1.8 : 2.6, 0, 7); g.fill();
    });
  }

  /* ---- night: the moon with two orbit rings ---- */
  var RINGS = [{ k: 1.2, tilt: .34, inc: .26, sp: .00009, dash: 0 }, { k: 1.4, tilt: -.18, inc: .18, sp: -.00005, dash: 1 }];
  function ring(X, Y, rg, t, half) {   // half 0: the back half (drawn before the body), 1: the front half
    var rx = R * rg.k, ry = rx * rg.inc, a0 = half ? 0 : Math.PI, a1 = half ? Math.PI : Math.PI * 2;
    g.save(); g.translate(X, Y); g.rotate(rg.tilt);
    g.strokeStyle = half ? 'rgba(110,240,215,.34)' : 'rgba(110,240,215,.14)'; g.lineWidth = 1; if (rg.dash) g.setLineDash([2, 6]);
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, a0, a1); g.stroke(); g.setLineDash([]);
    if (!rg.dash) for (var k = 0; k < 72; k++) { var an = k / 72 * Math.PI * 2; if (half ? an > Math.PI : an < Math.PI) continue;   // the scale
      var big = k % 6 === 0, l = big ? 7 : 3, c = Math.cos(an), s = Math.sin(an); g.strokeStyle = 'rgba(110,240,215,' + (half ? (big ? .5 : .28) : .1) + ')';
      g.beginPath(); g.moveTo(c * rx, s * ry); g.lineTo(c * (rx + l), s * (ry + l * rg.inc)); g.stroke(); }
    var sa = ((still ? 1.1 : t * rg.sp) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);   // the satellite
    if (half ? sa < Math.PI : sa >= Math.PI) { var sx = Math.cos(sa) * rx, sy = Math.sin(sa) * ry, hg = g.createRadialGradient(sx, sy, 0, sx, sy, 10);
      hg.addColorStop(0, 'rgba(160,255,232,.9)'); hg.addColorStop(.3, 'rgba(110,240,215,.35)'); hg.addColorStop(1, 'rgba(110,240,215,0)'); g.fillStyle = hg; g.beginPath(); g.arc(sx, sy, 10, 0, 7); g.fill(); }
    g.restore();
  }
  function moonNight(a, t, px, py) {
    var X = cx + px, Y = cy + py;
    var halo = g.createRadialGradient(X, Y, R * .98, X, Y, R * 1.6);   // a cold glow, not an atmosphere
    halo.addColorStop(0, 'rgba(200,230,240,.12)'); halo.addColorStop(.25, 'rgba(110,220,220,.05)'); halo.addColorStop(1, 'rgba(110,220,220,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(X, Y, R * 1.6, 0, 7); g.fill();
    RINGS.forEach(function (rg) { ring(X, Y, rg, t, 0); });
    if (MOONC) g.drawImage(MOONC, X - R, Y - R, R * 2, R * 2);
    g.save(); g.beginPath(); g.arc(X, Y, R, 0, 7); g.clip();
    mesh(a, X, Y, '47,220,188', .02, .2, true);   // the holographic mesh turns over the still face
    var sc = (still ? .3 : (t * .00006) % 1.4 - .2), sy = Y - R + sc * 2 * R, sg2 = g.createLinearGradient(0, sy - 40, 0, sy + 4);   // a slow scan line
    sg2.addColorStop(0, 'rgba(110,240,215,0)'); sg2.addColorStop(1, 'rgba(110,240,215,.1)'); g.fillStyle = sg2; g.fillRect(X - R, sy - 40, R * 2, 44);
    g.restore();
    g.strokeStyle = 'rgba(160,240,225,.22)'; g.lineWidth = 1; g.beginPath(); g.arc(X, Y, R - .5, -Math.PI * .62, Math.PI * .28); g.stroke();
    pillars(a, X, Y, false);
    RINGS.forEach(function (rg) { ring(X, Y, rg, t, 1); });
  }

  /* ---- day: the sun ---- */
  var RAYS = []; for (var rI = 0; rI < 40; rI++) RAYS.push({ a: rI / 40 * Math.PI * 2 + rnd(rI + 500) * .12, l: 1.5 + rnd(rI + 600) * 1.3, w: .012 + rnd(rI + 700) * .02, ph: rnd(rI + 800) * 6.28 });
  function sunDay(a, t, px, py) {
    var X = cx + px, Y = cy + py, Rt = Math.hypot(W, H);
    var cor = g.createRadialGradient(X, Y, R * .9, X, Y, R * 2.6);   // corona
    cor.addColorStop(0, 'rgba(255,214,120,.34)'); cor.addColorStop(.12, 'rgba(255,206,110,.16)'); cor.addColorStop(.4, 'rgba(255,214,150,.07)'); cor.addColorStop(1, 'rgba(255,230,190,0)');
    g.fillStyle = cor; g.beginPath(); g.arc(X, Y, R * 2.6, 0, 7); g.fill();
    var ra = still ? 0 : t * .000012;   // rays
    for (var i = 0; i < RAYS.length; i++) { var r0 = RAYS[i], an = r0.a + ra, sh = still ? 1 : .75 + .25 * Math.sin(t * .0008 + r0.ph), len = R * r0.l * sh;
      var c = Math.cos(an), s = Math.sin(an), w = r0.w, gr = g.createLinearGradient(X + c * R, Y + s * R, X + c * len, Y + s * len);
      gr.addColorStop(0, 'rgba(255,200,100,' + (.16 * sh).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,220,150,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(X + Math.cos(an - w) * R, Y + Math.sin(an - w) * R); g.lineTo(X + c * len, Y + s * len); g.lineTo(X + Math.cos(an + w) * R, Y + Math.sin(an + w) * R); g.closePath(); g.fill(); }
    // solar wind: fine streaks streaming outward over the whole sky
    for (var k = 0; k < WIND.length; k++) { var wd = WIND[k], u = still ? wd.u : (wd.u + t * .00003 * wd.sp) % 1, dist = R * 1.05 + u * Rt;
      var c2 = Math.cos(wd.th), s2 = Math.sin(wd.th), x = X + c2 * dist - mx * 10, y = Y + s2 * dist - my * 8; if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
      var al = (1 - u) * (u < .05 ? u / .05 : 1) * .5 * clear(x, y); if (al < .02) continue;
      g.strokeStyle = (wd.k > .75 ? 'rgba(214,150,30,' : 'rgba(10,138,115,') + al.toFixed(3) + ')'; g.lineWidth = wd.k > .9 ? 1.4 : 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - c2 * wd.len, y - s2 * wd.len); g.stroke(); }
    // HUD rings
    g.save(); g.translate(X, Y);
    g.strokeStyle = 'rgba(10,138,115,.3)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, R * 1.22, 0, 7); g.stroke();
    g.rotate(still ? 0 : t * .00004);
    for (var tk = 0; tk < 120; tk++) { var ta = tk / 120 * Math.PI * 2, big = tk % 10 === 0, l = big ? 10 : 4; g.strokeStyle = 'rgba(10,138,115,' + (big ? .5 : .25) + ')';
      g.beginPath(); g.moveTo(Math.cos(ta) * R * 1.22, Math.sin(ta) * R * 1.22); g.lineTo(Math.cos(ta) * (R * 1.22 + l), Math.sin(ta) * (R * 1.22 + l)); g.stroke(); }
    g.rotate(still ? 0 : -t * .0001);
    g.setLineDash([3, 9]); g.strokeStyle = 'rgba(10,138,115,.26)'; g.beginPath(); g.arc(0, 0, R * 1.42, 0, 7); g.stroke(); g.setLineDash([]);
    var sa = still ? .8 : t * .00025; g.strokeStyle = 'rgba(214,150,30,.55)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, R * 1.42, sa, sa + .9); g.stroke();
    g.restore();
    // the disc: limb-darkened, white-gold
    var bd = g.createRadialGradient(X + L[0] * R * .25, Y - L[1] * R * .25, R * .05, X, Y, R);
    bd.addColorStop(0, '#fffffb'); bd.addColorStop(.5, '#fff8e6'); bd.addColorStop(.82, '#ffedc4'); bd.addColorStop(.95, '#ffe0a0'); bd.addColorStop(1, '#ffd283');
    g.beginPath(); g.arc(X, Y, R, 0, 7); g.fillStyle = bd; g.fill();
    g.save(); g.beginPath(); g.arc(X, Y, R, 0, 7); g.clip(); mesh(a, X, Y, '214,128,20', .04, .26, true); g.restore();   // granulation: the old mesh, warm, turning
    var rim = g.createRadialGradient(X, Y, R * .96, X, Y, R * 1.08); rim.addColorStop(0, 'rgba(255,240,200,0)'); rim.addColorStop(.4, 'rgba(255,236,190,.6)'); rim.addColorStop(1, 'rgba(255,236,190,0)');
    g.fillStyle = rim; g.beginPath(); g.arc(X, Y, R * 1.08, 0, 7); g.fill();
    pillars(a, X, Y, true);
  }

  var t0 = 0;
  function draw(now) {
    FN++; var day = document.documentElement.dataset.theme === 'day';
    if (!t0) t0 = now; var el = still ? 1 : Math.min(1, (now - t0) / 1400), ein = 1 - Math.pow(1 - el, 3);
    mx += (tx - mx) * .04; my += (ty - my) * .04;
    var a = now * .00004;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    galaxy(now, day);
    if (!day) { stars(now); farBody(day); }
    g.save(); g.globalAlpha = ein;
    if (day) sunDay(a, now, -mx * 8, -my * 6); else moonNight(a, now, -mx * 8, -my * 6);
    g.restore();
  }
  var raf = 0;
  function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
  size(); addEventListener('resize', function () { size(); draw(performance.now()); });
  if (still) draw(performance.now()); else raf = requestAnimationFrame(loop);
  addEventListener('td:theme', function () { draw(performance.now()); });
  addEventListener('td:lang', function () { setTimeout(function () { measure(); draw(performance.now()); }, 30); });
  addEventListener('td:session', function () { setTimeout(function () { measure(); draw(performance.now()); }, 30); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); });
  if (window.ResizeObserver) { var ro = new ResizeObserver(function () { measure(); }); ['.card', '.hero'].forEach(function (q) { var e = document.querySelector(q); if (e) ro.observe(e); }); }
  document.addEventListener('visibilitychange', function () { if (still) return; if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(loop); });
  window.__orb = { theme: function () { return document.documentElement.dataset.theme; }, body: function () { return document.documentElement.dataset.theme === 'day' ? 'sun' : 'moon'; }, version: 'r45',
    field: function () { return FIELD.length; }, net: function () { return NET.length; }, wind: function () { return WIND.length; }, moonTex: function () { return MOONC ? MOONC.width : 0; }, frames: function () { return FN; }, still: still,
    geom: function () { return { cx: cx, cy: cy, R: R, mob: mob }; }, boxes: function () { return boxes.slice(); },
    galaxy: function () { return { angleDeg: Math.round(BAND.ang * 180 / Math.PI), width: BAND.wid, period: BAND.per, speed: G_SPEED, still: still }; } };
})();
