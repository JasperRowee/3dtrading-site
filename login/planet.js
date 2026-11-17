/* 3dtrading r58 · planet body re-lit in the deep-space palette (cool, shaded, finer dots and pillars); r57 · the earlier planet over the r55 deep space (space.js, WebGL). This file draws only the planet
   while space.js runs; its own 2D sky below is now only the fallback when WebGL is missing or fails.
   r56 · login background: the earlier planet, back.
   PLANET = the r42–r47 night planet (account/auth.html in r47-refinement, first drawn in 28d0e36): 1100 Fibonacci dots in
   teal on a dark body #11191b → #06090a, seven gold pillars, tilt −0.32, spin now × 0.00004, a soft teal atmosphere.
   Place as before: desktop R = min(0.36W, 0.74H), centre (0.3W, H + 0.12R) — a dome rising from the lower left;
   phone (W < 900) R = 0.62W, centre (0.92W, 40) — the top-right corner.
   DEEP SPACE (kept from r55, now in plain 2D, baked once per size): three depths of stars (fine dust, mid stars, a few bright
   ones with a glint), a diagonal Milky Way band with a dark dust lane, a teal nebula near the planet's limb, one small far
   galaxy and one small far moon. A live layer twinkles and drifts with the pointer at different depths. Everything behind
   the copy and the form is dimmed, never on the text.
   No WebGL, no three.js: two 2D canvases. Reduced motion = one still frame. A hidden tab stops drawing. */
(function () {
  'use strict';
  var GL = document.getElementById('gx'), cv = document.getElementById('orb');
  if (!cv || !cv.getContext || !GL) return;
  var g = cv.getContext('2d'), W, H, dpr, cx, cy, R, mob;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MODE = 'wait'; // 'wait' → 'gl' (space.js draws the sky) or '2d' (this file draws the r56 sky too)
  function setMode(m) { if (MODE === m) return; MODE = m; GL.hidden = m !== '2d'; if (still) draw(performance.now()); }
  GL.hidden = true;
  addEventListener('td:space', function (e) { setMode(e.detail && e.detail.mode === 'webgl' ? 'gl' : '2d'); });
  if (window.__space) setMode(window.__space.mode === 'webgl' ? 'gl' : '2d');
  setTimeout(function () { if (MODE === 'wait') setMode('2d'); }, 2500);
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function rnd(seed) { var x = Math.sin(seed * 91.17 + 12.9) * 43758.5453; return x - Math.floor(x); }

  /* ---- the planet (28d0e36 / r47, unchanged) ---- */
  var N = 1100, P = [], GA = Math.PI * (3 - Math.sqrt(5)), i;
  for (i = 0; i < N; i++) { var y0 = 1 - 2 * (i + .5) / N, r0 = Math.sqrt(1 - y0 * y0), t0 = GA * i; P.push([Math.cos(t0) * r0, y0, Math.sin(t0) * r0]); }
  var GOLD = [[.3, .55, .2], [-.5, .62, .1], [.05, .8, -.2], [.62, .35, -.3], [-.2, .45, .55], [-.7, .3, -.35], [.4, .7, .45]];
  GOLD.forEach(function (q) { var l = Math.hypot(q[0], q[1], q[2]); q[0] /= l; q[1] /= l; q[2] /= l; });
  var tilt = -.32, ct = Math.cos(tilt), st = Math.sin(tilt);
  function rot(p, a) { var c = Math.cos(a), s = Math.sin(a), x = p[0] * c + p[2] * s, z = -p[0] * s + p[2] * c, y = p[1]; return [x, y * ct - z * st, y * st + z * ct]; }
  var LX = -.55, LY = .6, LZ = .58; (function () { var l = Math.hypot(LX, LY, LZ); LX /= l; LY /= l; LZ /= l; })();

  var FIELD = [], MOON = null, boxes = [], SKY = null, GM = null;

  /* ---- deep space, baked once per size ---- */
  function bake() {
    var pad = 40, q = Math.min(2, dpr), c = document.createElement('canvas'), w = W + pad * 2, h = H + pad * 2;
    c.width = Math.ceil(w * q); c.height = Math.ceil(h * q);
    var x = c.getContext('2d'); x.scale(q, q);
    var s, n, b, sx, sy, sz, a, A = w * h;
    // two very faint wide hazes: depth, not cloud
    [[.82, .14, '52,96,140', .05], [.12, .9, '30,120,112', .035]].forEach(function (hz) {
      var gr = x.createRadialGradient(hz[0] * w, hz[1] * h, 0, hz[0] * w, hz[1] * h, Math.max(w, h) * .55);
      gr.addColorStop(0, 'rgba(' + hz[2] + ',' + hz[3] + ')'); gr.addColorStop(1, 'rgba(' + hz[2] + ',0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    });
    // the Milky Way: a soft diagonal band from the upper right toward the lower middle, with a dark dust lane and dense dust
    var bx0 = w * (mob ? 1.05 : .98), by0 = -h * .08, bx1 = w * (mob ? .05 : .42), by1 = h * 1.08;
    var ang = Math.atan2(by1 - by0, bx1 - bx0), len = Math.hypot(bx1 - bx0, by1 - by0), bw = Math.min(w, h) * (mob ? .34 : .26);
    x.save(); x.translate(bx0, by0); x.rotate(ang);
    for (s = 0; s < 46; s++) { // clouds along the band
      var u = rnd(s + 7001), v = (rnd(s + 7007) - .5) * bw * .7, rr = bw * (.35 + rnd(s + 7013) * .6);
      var cg = x.createRadialGradient(u * len, v, 0, u * len, v, rr), tint = rnd(s + 7019) > .7 ? '120,170,210' : '150,190,200';
      cg.addColorStop(0, 'rgba(' + tint + ',' + (.022 + rnd(s + 7027) * .03).toFixed(3) + ')'); cg.addColorStop(1, 'rgba(' + tint + ',0)');
      x.fillStyle = cg; x.fillRect(u * len - rr, v - rr, rr * 2, rr * 2);
    }
    n = Math.round(len * bw / (mob ? 260 : 300)); // dense dust in the band (gaussian across)
    for (s = 0; s < n; s++) {
      var u2 = rnd(s + 8101) * len, gv = (rnd(s + 8107) + rnd(s + 8111) + rnd(s + 8117) - 1.5) * bw * .62;
      b = rnd(s + 8123); x.fillStyle = 'rgba(220,232,240,' + (.06 + b * b * .3).toFixed(3) + ')'; sz = .4 + b * .6; x.fillRect(u2 - sz / 2, gv - sz / 2, sz, sz);
    }
    for (s = 0; s < 26; s++) { // the dark dust lane, a little off the band's centre
      var u3 = rnd(s + 9001) * len, rr3 = bw * (.12 + rnd(s + 9007) * .16), v3 = bw * (.05 + Math.sin(u3 / len * 6) * .05);
      var dg = x.createRadialGradient(u3, v3, 0, u3, v3, rr3); dg.addColorStop(0, 'rgba(2,4,6,.55)'); dg.addColorStop(1, 'rgba(2,4,6,0)');
      x.fillStyle = dg; x.fillRect(u3 - rr3, v3 - rr3, rr3 * 2, rr3 * 2);
    }
    x.restore();
    // one small far galaxy: a tilted soft ellipse with a bright core, in the upper middle (desktop) / middle left (phone)
    var gx0 = mob ? w * .18 : w * .66, gy0 = mob ? h * .5 : h * .16, gr0 = Math.max(16, Math.min(w, h) * .028);
    x.save(); x.translate(gx0, gy0); x.rotate(-.5); x.scale(1, .34);
    var gg = x.createRadialGradient(0, 0, 0, 0, 0, gr0 * 2.2);
    gg.addColorStop(0, 'rgba(236,230,214,.5)'); gg.addColorStop(.18, 'rgba(200,210,226,.2)'); gg.addColorStop(.55, 'rgba(140,170,210,.06)'); gg.addColorStop(1, 'rgba(140,170,210,0)');
    x.fillStyle = gg; x.beginPath(); x.arc(0, 0, gr0 * 2.2, 0, 7); x.fill(); x.restore();
    n = Math.round(A / (mob ? 1300 : 1500)); // fine dust over the whole sky
    for (s = 0; s < n; s++) { b = rnd(s + 901); sx = rnd(s + 907) * w; sy = rnd(s + 913) * h; sz = .45 + b * .5; a = .07 + b * b * .3;
      x.fillStyle = 'rgba(' + (b > .9 ? '196,226,236' : '214,222,232') + ',' + a.toFixed(3) + ')'; x.fillRect(sx - sz / 2, sy - sz / 2, sz, sz); }
    n = Math.round(A / (mob ? 13000 : 15000)); // mid stars
    for (s = 0; s < n; s++) { b = rnd(s + 3301); sx = rnd(s + 3307) * w; sy = rnd(s + 3313) * h; sz = 1 + b * .8; a = .35 + b * .4;
      x.fillStyle = b > .85 ? 'rgba(255,232,190,' + a + ')' : b > .6 ? 'rgba(170,236,226,' + a + ')' : 'rgba(226,234,244,' + a + ')';
      x.beginPath(); x.arc(sx, sy, sz / 2 + .15, 0, 7); x.fill(); }
    n = mob ? 5 : 10; // a few bright stars with a soft glow and a cross glint
    for (s = 0; s < n; s++) { sx = rnd(s * 7 + 5101) * w; sy = rnd(s * 7 + 5107) * h; b = rnd(s * 7 + 5113); var rg = 5 + b * 6;
      var gl = x.createRadialGradient(sx, sy, 0, sx, sy, rg); gl.addColorStop(0, 'rgba(220,240,246,.45)'); gl.addColorStop(1, 'rgba(220,240,246,0)');
      x.fillStyle = gl; x.beginPath(); x.arc(sx, sy, rg, 0, 7); x.fill();
      x.strokeStyle = 'rgba(230,244,248,.28)'; x.lineWidth = .7; x.beginPath(); x.moveTo(sx - rg * 1.5, sy); x.lineTo(sx + rg * 1.5, sy); x.moveTo(sx, sy - rg * 1.5); x.lineTo(sx, sy + rg * 1.5); x.stroke();
      x.fillStyle = '#f4fbfd'; x.beginPath(); x.arc(sx, sy, 1.1 + b * .6, 0, 7); x.fill(); }
    return c;
  }
  function mask() { // full strength everywhere, a feathered dip (~50%) under each text block and the form
    GM = GM || document.createElement('canvas'); GM.width = Math.ceil(W / 4); GM.height = Math.ceil(H / 4);
    var m = GM.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, GM.width, GM.height);
    m.fillStyle = '#000'; m.fillRect(0, 0, GM.width, GM.height);
    m.globalCompositeOperation = 'destination-out'; m.filter = 'blur(8px)'; m.fillStyle = 'rgba(0,0,0,.5)';
    boxes.forEach(function (b) { m.fillRect(b[0] / 4, b[1] / 4, (b[2] - b[0]) / 4, (b[3] - b[1]) / 4); });
    m.filter = 'none'; m.globalCompositeOperation = 'source-over';
  }
  function sky(t) {
    var l = GL.getContext('2d'), pad = 40, T = still ? 0 : t;
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, GL.width, GL.height);
    l.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!SKY) SKY = bake();
    l.drawImage(SKY, -pad - Math.sin(T * .00003) * 14 - mx * 12, -pad - Math.cos(T * .000025) * 9 - my * 8, W + pad * 2, H + pad * 2);
    if (GM) { l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'destination-in'; l.drawImage(GM, 0, 0, GL.width, GL.height); l.globalCompositeOperation = 'source-over'; }
  }

  function size() {
    dpr = Math.min(2, devicePixelRatio || 1); W = document.documentElement.clientWidth; H = innerHeight; mob = W < 900;
    cv.width = GL.width = Math.round(W * dpr); cv.height = GL.height = Math.round(H * dpr);
    SKY = null; place();
    FIELD = []; var n = Math.round(W * H / (mob ? 9000 : 11000));
    for (var s = 0; s < n; s++) {
      var z = hash(s * 1.37 + .2); z = z * z; // most far away, a few near
      FIELD.push({ x: hash(s + .1), y: hash(s + .7), z: z, ph: hash(s + .9) * 6.28, sp: .3 + hash(s + .3) * .7, slow: s % 9 === 0 });
    }
    measure();
  }
  function place() {
    if (mob) { R = W * .62; cx = W * .92; cy = 40; return; }
    R = Math.min(W * .36, H * .74); cx = W * .3; cy = H + R * .12;
  }
  function measure() {
    boxes = []; var hr = 0, cl = W; place();
    document.querySelectorAll('.hero h1,.hero .lede,.pts li,.card,.top').forEach(function (e) { var b = e.getBoundingClientRect(); if (b.width > 2 && b.height > 2) { boxes.push([b.left - 14, b.top - 10, b.right + 14, b.bottom + 10]); if (e.classList.contains('card')) cl = b.left; else if (!e.classList.contains('top')) hr = Math.max(hr, b.right); } });
    var mr = Math.max(9, Math.min(W, H) * .02); // the far moon sits in the open gap between the copy and the form
    MOON = !mob && cl - hr > mr * 7 ? { x: (hr + cl) / 2, y: Math.max(130, H * .2), r: mr } : null;
    mask();
  }
  function clear(x, y) { for (var i = 0; i < boxes.length; i++) { var b = boxes[i]; if (x > b[0] && x < b[2] && y > b[1] && y < b[3]) return .45; } return 1; }
  var mx = 0, my = 0, tx = 0, ty = 0;
  if (!still) addEventListener('pointermove', function (e) { tx = e.clientX / W - .5; ty = e.clientY / H - .5; }, { passive: true });

  function field(t) { // the live, twinkling layer; near stars move more with the pointer than far ones
    for (var i = 0; i < FIELD.length; i++) {
      var f = FIELD[i], z = f.z, drift = still ? 0 : t * .000003 * (.3 + z * 1.4) * f.sp;
      var x = ((f.x + drift) % 1) * W - mx * (4 + z * 22), y = f.y * H - my * (3 + z * 16);
      var dx = x - cx, dy = y - cy; if (dx * dx + dy * dy < R * R * 1.02) continue; // behind the planet
      var tw = still ? .8 : f.slow ? .35 + .65 * Math.pow(.5 + .5 * Math.sin(t * .0007 * f.sp + f.ph), 2) : .7 + .3 * Math.sin(t * .0011 * f.sp + f.ph);
      var m = clear(x, y), s = .6 + z * 1.6, al = (.14 + .5 * z) * tw * m;
      g.fillStyle = (z > .7 ? 'rgba(150,240,224,' : 'rgba(220,230,238,') + al.toFixed(3) + ')'; g.fillRect(x - s / 2, y - s / 2, s, s);
      if (f.slow && z > .3 && !still) { var gl = al * .5; g.fillStyle = 'rgba(230,246,250,' + gl.toFixed(3) + ')'; g.fillRect(x - s * 2, y - .35, s * 4, .7); g.fillRect(x - .35, y - s * 2, .7, s * 4); }
    }
  }
  function moon() {
    if (!MOON) return; var x = MOON.x - mx * 6, y = MOON.y - my * 4, r = MOON.r;
    var h = g.createRadialGradient(x, y, r * .8, x, y, r * 3.2);
    h.addColorStop(0, 'rgba(47,220,188,.07)'); h.addColorStop(1, 'rgba(47,220,188,0)');
    g.fillStyle = h; g.beginPath(); g.arc(x, y, r * 3.2, 0, 7); g.fill();
    var b = g.createRadialGradient(x + LX * r * .55, y - LY * r * .55, r * .1, x, y, r);
    b.addColorStop(0, '#1e2b2d'); b.addColorStop(.6, '#0e1517'); b.addColorStop(1, '#070a0b');
    g.fillStyle = b; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.strokeStyle = 'rgba(110,240,215,.4)'; g.lineWidth = 1;
    g.beginPath(); g.arc(x, y, r - .5, Math.PI * .72, Math.PI * 1.62); g.stroke();
  }
  function nebula(X, Y, t) { // a quiet teal nebula just outside the planet's lit limb, breathing very slowly
    var br = still ? 1 : .9 + .1 * Math.sin(t * .00016);
    var nx = X + R * (mob ? -.55 : .62), ny = Y - R * (mob ? -.55 : .78), nr = R * (mob ? .9 : .75);
    var ng = g.createRadialGradient(nx, ny, 0, nx, ny, nr);
    ng.addColorStop(0, 'rgba(47,200,180,' + (.07 * br).toFixed(3) + ')'); ng.addColorStop(.5, 'rgba(40,140,170,' + (.03 * br).toFixed(3) + ')'); ng.addColorStop(1, 'rgba(40,140,170,0)');
    g.fillStyle = ng; g.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
  }
  function planet(a, px, py, t) {
    var X = cx + px, Y = cy + py;
    if (MODE === '2d') nebula(X, Y, t);
    haloOut(X, Y);
    /* r58 · the body takes the deep-space palette (cool blue-black, not olive) and is lit from the same side as its rim:
       a soft day side, a terminator, a night side that sinks into the sky; the dots fade with the light, so it reads round */
    var bd = g.createRadialGradient(X + LX * R * .45, Y - LY * R * .45, R * .05, X, Y, R * 1.02);
    bd.addColorStop(0, '#16262f'); bd.addColorStop(.45, '#0b141b'); bd.addColorStop(.8, '#050a0f'); bd.addColorStop(1, '#03060a');
    g.beginPath(); g.arc(X, Y, R, 0, 7); g.fillStyle = bd; g.fill();
    var sh = g.createLinearGradient(X + LX * R, Y - LY * R, X - LX * R, Y + LY * R); // terminator
    sh.addColorStop(0, 'rgba(2,4,8,0)'); sh.addColorStop(.55, 'rgba(2,4,8,.18)'); sh.addColorStop(1, 'rgba(2,4,8,.62)');
    g.fillStyle = sh; g.beginPath(); g.arc(X, Y, R, 0, 7); g.fill();
    haloIn(X, Y);
    for (var i = 0; i < N; i++) {
      var q = rot(P[i], a); if (q[2] < -.15) continue;
      var x = X + q[0] * R, y = Y - q[1] * R, k = (q[2] + .15) / 1.15;
      var lit = Math.max(0, q[0] * LX + q[1] * LY + q[2] * LZ), li = .4 + .6 * Math.pow(lit, .8);
      g.fillStyle = 'rgba(' + (lit > .55 ? '120,236,214' : '47,206,184') + ',' + ((.1 + .7 * k * k) * li).toFixed(3) + ')';
      var s = .55 + 1.15 * k; g.fillRect(x - s / 2, y - s / 2, s, s);
    }
    pillars(a, X, Y);
  }
  function pillars(a, X, Y) {
    GOLD.forEach(function (p, idx) {
      var q = rot(p, a); if (q[2] < .05) return;
      var x0 = X + q[0] * R, y0 = Y - q[1] * R, L = 1 + (idx % 3 + 1) * .07;
      var x1 = X + q[0] * R * L, y1 = Y - q[1] * R * L, f = Math.min(1, q[2] * 2);
      var gr = g.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, 'rgba(232,184,74,' + (.15 * f) + ')'); gr.addColorStop(1, 'rgba(245,210,122,' + (.95 * f) + ')');
      g.strokeStyle = gr; g.lineWidth = mob ? 1.8 : 2.6; g.lineCap = 'round'; // r58: finer, they read as light, not sticks
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.fillStyle = 'rgba(255,226,150,' + f + ')'; g.beginPath(); g.arc(x1, y1, mob ? 1.5 : 2.1, 0, 7); g.fill();
    });
  }
  function fall(gr, rgb, a0, stops) { stops.forEach(function (s) { gr.addColorStop(s[0], 'rgba(' + rgb + ',' + (a0 * s[1]).toFixed(4) + ')'); }); }
  var FALL = [[0, 1], [.12, .62], [.28, .34], [.48, .15], [.7, .05], [1, 0]];
  function haloOut(X, Y) {
    var ox = X + LX * R * .035, oy = Y - LY * R * .035, gr = g.createRadialGradient(ox, oy, R * .99, ox, oy, R * 1.34);
    fall(gr, '47,220,188', .24, FALL); g.fillStyle = gr; g.beginPath(); g.arc(ox, oy, R * 1.34, 0, 7); g.fill();
    var wide = g.createRadialGradient(X, Y, R, X, Y, R * 1.75);
    fall(wide, '60,170,190', .035, FALL); g.fillStyle = wide; g.beginPath(); g.arc(X, Y, R * 1.75, 0, 7); g.fill();
  }
  function haloIn(X, Y) {
    g.save(); g.beginPath(); g.arc(X, Y, R, 0, 7); g.clip();
    var ix = X - LX * R * .05, iy = Y + LY * R * .05, gr = g.createRadialGradient(ix, iy, R * .95, ix, iy, R * 1.05);
    gr.addColorStop(0, 'rgba(47,220,188,0)'); gr.addColorStop(.5, 'rgba(47,220,188,.08)'); gr.addColorStop(1, 'rgba(110,240,214,.38)');
    g.fillStyle = gr; g.fillRect(X - R, Y - R, R * 2, R * 2); g.restore();
  }
  var t0 = 0, frames = 0;
  function draw(now) {
    if (!t0) t0 = now; var el = still ? 1 : Math.min(1, (now - t0) / 1400), ein = 1 - Math.pow(1 - el, 3);
    mx += (tx - mx) * .04; my += (ty - my) * .04;
    var a = now * .00004;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    if (MODE === '2d') sky(now);
    g.save(); g.globalAlpha = ein; if (MODE === '2d') { field(now); moon(); } planet(a, -mx * 8, -my * 6, now); g.restore();
    frames++;
  }
  var raf = 0;
  function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
  size(); addEventListener('resize', function () { size(); draw(performance.now()); });
  if (still) draw(performance.now()); else raf = requestAnimationFrame(loop);
  addEventListener('td:lang', function () { setTimeout(function () { measure(); draw(performance.now()); }, 30); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); });
  if (window.ResizeObserver) { var ro = new ResizeObserver(function () { measure(); }); ['.card', '.hero'].forEach(function (q) { var e = document.querySelector(q); if (e) ro.observe(e); }); }
  document.addEventListener('visibilitychange', function () { if (still) return; cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(loop); });
  window.__planet = {
    version: 'r57', mode: function () { return MODE; }, source: 'r42–r47 night planet (28d0e36)', webgl: false, still: still, frames: function () { return frames; },
    planet: function () { return { R: Math.round(R), cx: Math.round(cx), cy: Math.round(cy), mob: mob, W: W, H: H, dots: N, pillars: GOLD.length }; },
    stars: function () { return FIELD.length; }, moon: function () { return MOON ? { x: Math.round(MOON.x), y: Math.round(MOON.y) } : null; }
  };
})();
