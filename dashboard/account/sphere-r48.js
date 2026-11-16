/* r48 · log-in / sign-up background: standing on the plaza OUTSIDE the Sphere (the website is the world inside it).
   One camera for day and night. A low viewpoint close to the building: the ball looms over the copy and is a little
   cut by the frame; its base sits in a low podium with a lit lobby; the plaza, a distant skyline, palms and lamps give
   depth. Night: the ball is the main light source (halo, a cove line on the podium, a pool and a rippled reflection
   on the wet plaza). Day: clear teal daylight, the LED face is washed by the sun, sky reflects on the limb.
   The ball shows one of four curated skins — 星球 Planet, Dodo, 品牌 Brand, 极光 Aurora — picked with one tap from four
   small previews and remembered on this browser ('3dt.sphere.skin'). No upload, colour or parameter editing.
   Changing skin never moves the camera, the form or the layout.

   Layers (back → front), all inside #scene (absolute, scrolls with the page):
     #gx      2D, baked: sky, sun / stars, city glow, two skyline depths, horizon haze
     .sp-l1   #sp-mid 2D baked: plaza, podium + lobby + people, mid palms and lamps
              #orb    WebGL, live: the ball (skin, LED lattice, day/night shading), halo, podium cove light,
                      ground light pool and the plaza reflection
     #sp-fg   2D, baked: one foreground palm (left) and a near lamp (right), desktop only
   Pointer parallax moves the three groups by different amounts (CSS transforms). Reduced motion = one still frame,
   no parallax, no blinking. Paused while the page is hidden. Without WebGL the ball is painted once in 2D.
   Geometry follows the real layout: on desktop the podium top sits just above the title (the copy stands in front
   of the podium, never on the ball) and the ball keeps clear of the logo and of the form; on phones the ball is
   at the top right, its podium meets the top of the form. */
(function () {
  'use strict';
  var D = document, root = D.documentElement, P = 14;
  var scene = D.getElementById('scene'), back = D.getElementById('gx'), midC = D.getElementById('sp-mid'),
    orb = D.getElementById('orb'), fgC = D.getElementById('sp-fg'), l1 = D.querySelector('.sp-l1');
  if (!scene || !back || !back.getContext || !midC || !orb || !fgC) return;
  /* reduced motion is followed live: the system switch can change while the page is open (see setStill below) */
  var RM = null; try { RM = matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) {}
  var still = !!(RM && RM.matches);
  var SKINS = ['planet', 'dodo', 'brand', 'aurora'], KEY = '3dt.sphere.skin';
  /* the colour each skin throws on its surroundings (halo, cove, pool, foreground rim) */
  var AVG = { planet: [.22, .55, .68], dodo: [1, .88, .7], brand: [.17, .85, .72], aurora: [.36, .85, .66] };
  function saved() { try { var v = localStorage.getItem(KEY); return SKINS.indexOf(v) >= 0 ? v : 'planet'; } catch (e) { return 'planet'; } }
  var skin = saved(), skinFrom = skin, mixStart = 0, mixT = 0, MIXMS = 950;
  var G = null, dpr = 1, gdpr = 1, GL = null, TG = null, LOGO = null, err = null, day = false;
  function isDay() { return root.dataset.theme === 'day'; }
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function rgba(c, a) { return 'rgba(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ',' + a + ')'; }

  /* ---------------- geometry from the live layout ---------------- */
  function geom() {
    var W = root.clientWidth || innerWidth, vh = innerHeight, wrap = D.querySelector('.wrap'), sy = scrollY || 0;
    var H = Math.max(vh, wrap ? Math.ceil(wrap.getBoundingClientRect().bottom + sy) : vh);
    var mob = W < 901, g = { W: W, H: H, vh: vh, mob: mob, cl: 0, ct: 0, copyL: 0 }, R, cx, cy, yp;
    var hero = D.querySelector('.hero'), h1 = D.querySelector('.hero h1'), card = D.querySelector('.card');
    if (!mob) {
      var hb = h1 && h1.getBoundingClientRect(), ct = hb && hb.height ? hb.top + sy : vh * .64;
      var cb = card && card.getBoundingClientRect(), cl = cb && cb.width ? cb.left : W * .6;
      var yb = Math.max(190, ct - 14);
      var right = cl - 46;
      R = Math.max(90, Math.min(yb / 1.8, right / 1.8)); yp = yb - .24 * R;
      cy = yp - .64 * R; cx = Math.max(R * .8, Math.min(W * .31, right - R));
      var lg = D.querySelector('.top .logo'), lb = lg && lg.getBoundingClientRect();
      if (lb && lb.width) for (var k = 0; k < 80; k++) { // keep the ball clear of the logo
        var dx = cx - lb.right, dy = cy - (lb.bottom + sy);
        if (dx < 0 || dx * dx + dy * dy >= (R + 18) * (R + 18)) break;
        if (cx + R < right - 4) cx += 4; else { R *= .985; yp = yb - .24 * R; cy = yp - .64 * R; }
      }
      g.cl = cl; g.ct = ct; g.copyL = hb && hb.width ? hb.left : 60;
    } else {
      var sh = false; try { sh = matchMedia('(max-height:700px)').matches; } catch (e) {}
      R = sh ? Math.min(W * .27, 150) : Math.min(W * .36, 190);
      var ht = hero && hero.getBoundingClientRect().height ? hero.getBoundingClientRect().top + sy : 52;
      cy = ht + 4 + R; cx = W - .18 * R; yp = cy + .62 * R;
    }
    g.R = R; g.cx = cx; g.cy = cy; g.yp = yp; g.amp = R * .05; g.pw = R * 1.25;
    g.yh = yp + R * (mob ? .1 : .12); g.yg = yp + R * (mob ? .26 : .24);
    g.px0 = cx - R * (mob ? 1.45 : 1.5); g.px1 = mob ? W + 30 : Math.max(cx + R * 1.1, Math.min(cx + R * 1.32, g.cl + 60));
    return g;
  }
  function podTop(x) { var u = (x - G.cx) / G.pw; return G.yp - G.amp * Math.sqrt(Math.max(0, 1 - u * u)); }

  /* ---------------- 2D helpers ---------------- */
  function ctx2(c, q) {
    c.width = Math.max(1, Math.round((G.W + 2 * P) * q)); c.height = Math.max(1, Math.round((G.H + 2 * P) * q));
    var x = c.getContext('2d'); x.setTransform(q, 0, 0, q, P * q, P * q); return x;
  }
  function glow(x, px, py, r, col, a, sx, sy) {
    x.save(); x.translate(px, py); x.scale(sx || 1, sy || 1);
    var g = x.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fillRect(-r, -r, 2 * r, 2 * r); x.restore();
  }

  /* ---------------- back: sky + skyline ---------------- */
  function bakeBack() {
    var W = G.W, H = G.H, x = ctx2(back, gdpr), yh = G.yh, i, r = rng(11);
    var s = x.createLinearGradient(0, -P, 0, yh);
    if (day) { s.addColorStop(0, '#83c3d3'); s.addColorStop(.42, '#ade0e6'); s.addColorStop(.82, '#d8efee'); s.addColorStop(1, '#e8f5f1'); }
    else { s.addColorStop(0, '#02050a'); s.addColorStop(.55, '#050b12'); s.addColorStop(.88, '#0a1520'); s.addColorStop(1, '#10202a'); }
    x.fillStyle = s; x.fillRect(-P, -P, W + 2 * P, H + 2 * P);
    if (day) {
      glow(x, W * .9, -G.vh * .08, Math.max(W, G.vh) * .78, [1, .97, .89], .9);
      glow(x, W * .9, -G.vh * .08, Math.max(W, G.vh) * .22, [1, 1, .97], .55);
      for (i = 0; i < 7; i++) { // thin high wisps, never on the ball centre
        var wx = r() * W, wy = (.05 + r() * .32) * yh, wl = (.12 + r() * .2) * W;
        glow(x, wx, wy, wl / 2, [1, 1, 1], .26 + r() * .18, 1, .07 + r() * .06);
      }
    } else {
      var n = Math.round(W * yh / 5200);
      for (i = 0; i < n; i++) {
        var sx = r() * W, syy = r() * yh * .9, b = r(), fade = Math.max(0, 1 - syy / (yh * .92));
        var a = (.12 + b * b * .62) * fade * fade; if (a < .02) continue;
        x.fillStyle = b > .93 ? 'rgba(255,232,196,' + a + ')' : b > .75 ? 'rgba(178,236,228,' + a + ')' : 'rgba(222,232,244,' + a + ')';
        var sz = .5 + b * 1.1; x.beginPath(); x.arc(sx, syy, sz, 0, 7); x.fill();
        if (b > .965 && fade > .5) { glow(x, sx, syy, 6 + b * 4, [.85, .95, 1], .35 * fade); }
      }
      glow(x, W * .72, yh, W * .62, [1, .66, .4], .12, 1, .32); // city glow on the horizon (sodium + neon, kept low)
      glow(x, W * .2, yh, W * .5, [.25, .8, .72], .07, 1, .3);
    }
    skyline(x);
  }
  function skyline(x) {
    var W = G.W, yh = G.yh, mob = G.mob, Hs = mob ? G.R * .36 : Math.min(yh * .42, G.R * .78), r = rng(5), tx, w, h, i;
    function tower(tx, w, h, far) {
      var top = yh - h;
      if (day) {
        x.fillStyle = far ? 'rgba(128,178,188,.42)' : 'rgba(96,148,158,.52)'; x.fillRect(tx, top, w, h + 12);
        x.fillStyle = far ? 'rgba(236,250,248,.22)' : 'rgba(240,252,250,.3)'; x.fillRect(tx + w * .7, top, w * .3, h + 12); // sunlit face
        if (!far) { x.fillStyle = 'rgba(40,90,100,.10)'; for (var c = tx + 3; c < tx + w * .68; c += 4) x.fillRect(c, top + 4, 1, h); }
      } else {
        x.fillStyle = far ? '#0a131b' : '#060b10'; x.fillRect(tx, top, w, h + 12);
        if (!far) { // lit windows
          var rr = rng(Math.round(tx * 7 + h));
          for (var yy = top + 5; yy < yh - 4; yy += 6) for (var xx = tx + 3; xx < tx + w - 3; xx += 5) {
            var q = rr(); if (q < .16) { x.fillStyle = q < .05 ? 'rgba(170,226,255,.5)' : 'rgba(255,214,160,' + (.3 + q * 2) + ')'; x.fillRect(xx, yy, 2, 2.4); }
          }
        } else if (r() < .5) { x.fillStyle = 'rgba(255,214,170,.18)'; x.fillRect(tx + w * .3, top + 6, 1.2, h * .7); }
        if (h > Hs * .62) { x.fillStyle = 'rgba(255,70,60,.85)'; x.beginPath(); x.arc(tx + w / 2, top - 2, 1.4, 0, 7); x.fill(); glow(x, tx + w / 2, top - 2, 6, [1, .3, .25], .35); }
      }
      if (!far && h > Hs * .5 && r() < .5) { x.fillStyle = day ? 'rgba(96,148,158,.5)' : '#060b10'; x.fillRect(tx + w / 2 - .7, top - h * .12, 1.4, h * .12 + 1); } // mast
    }
    for (tx = -P; tx < W + P; tx += w + r() * 14) { w = 16 + r() * 40; h = (.18 + Math.pow(r(), 1.5) * .82) * Hs * .82; tower(tx, w, h, true); }
    for (tx = -P + r() * 40; tx < W + P; tx += w + 18 + r() * 60) { w = 26 + r() * 58; h = (.12 + Math.pow(r(), 2) * .88) * Hs; if (!mob && tx > G.cx - G.R * 1.6 && tx < G.cx + G.R) h *= .6; tower(tx, w, h, false); }
    var hz = x.createLinearGradient(0, yh - Hs * .7, 0, yh + 2);
    hz.addColorStop(0, day ? 'rgba(234,246,242,0)' : 'rgba(16,32,42,0)'); hz.addColorStop(1, day ? 'rgba(234,246,242,.78)' : 'rgba(16,32,42,.62)');
    x.fillStyle = hz; x.fillRect(-P, yh - Hs * .7, W + 2 * P, Hs * .7 + 14);
  }

  /* ---------------- mid: plaza, podium, people, mid palms / lamps ---------------- */
  function bakeMid() {
    var W = G.W, H = G.H, x = ctx2(midC, gdpr), yh = G.yh, yg = G.yg, R = G.R, cx = G.cx, i;
    // plaza
    var pg = x.createLinearGradient(0, yh, 0, H + P);
    if (day) { pg.addColorStop(0, '#d9e7e3'); pg.addColorStop(.35, '#cfdeda'); pg.addColorStop(1, '#bfd0cc'); }
    else { pg.addColorStop(0, '#0d161c'); pg.addColorStop(.3, '#080e13'); pg.addColorStop(1, '#04070a'); }
    x.fillStyle = pg; x.fillRect(-P, yh, W + 2 * P, H - yh + 2 * P);
    // paving joints in perspective (fainter toward the horizon)
    var vx = cx + R * .2, jg = x.createLinearGradient(0, yh, 0, H);
    jg.addColorStop(0, day ? 'rgba(40,80,84,0)' : 'rgba(150,210,210,0)'); jg.addColorStop(1, day ? 'rgba(40,80,84,.12)' : 'rgba(150,210,210,.06)');
    x.strokeStyle = jg; x.lineWidth = 1;
    x.save(); x.beginPath(); x.rect(-P, yh, W + 2 * P, H - yh + 2 * P); x.clip(); x.beginPath();
    for (i = -40; i <= 40; i++) { x.moveTo(vx, yh); x.lineTo(vx + i * R * 1.02, H + P + (H - yh) * 2); }
    for (i = 1; i < 16; i++) { var y2 = yh + (H - yh + P) * Math.pow(i / 15, 1.9); x.moveTo(-P, y2); x.lineTo(W + P, y2); }
    x.stroke(); x.restore();
    // horizon line
    var hl = x.createLinearGradient(0, yh - 3, 0, yh + 10);
    hl.addColorStop(0, day ? 'rgba(255,255,255,0)' : 'rgba(255,190,130,0)'); hl.addColorStop(.4, day ? 'rgba(255,255,255,.55)' : 'rgba(255,190,130,.10)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = hl; x.fillRect(-P, yh - 3, W + 2 * P, 13);
    if (!GL) sphere2D(x);
    podium(x);
    // mid palms and lamps (desktop): between the ball and the form, and past the form's right edge
    if (!G.mob) {
      var gapL = cx + R, gapR = G.cl, mx = (gapL + gapR) / 2;
      if (gapR - gapL > 40) { palm(x, mx + R * .03, G.yg + R * .03, R * .5, -.05, 'mid', 3); palm(x, mx + R * .15, G.yg + R * .05, R * .38, .12, 'mid', 4); lamp(x, mx - R * .1, G.yg + R * .09, R * .44, false); }
      var card = D.querySelector('.card'), cr = card ? card.getBoundingClientRect().right : W;
      if (W - cr > 70) palm(x, W - Math.min(70, (W - cr) * .5), G.yg + R * .08, R * .6, -.08, 'mid', 6);
    } else {
      lamp(x, G.W * .1, G.yh + G.R * .2, G.R * .55, false);
    }
    // a soft contact shadow / wet sheen line along the podium base
    var cs = x.createLinearGradient(0, yg, 0, yg + R * .06);
    cs.addColorStop(0, day ? 'rgba(20,50,52,.16)' : 'rgba(0,0,0,.5)'); cs.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = cs; x.fillRect(G.px0, yg, G.px1 - G.px0, R * .06);
  }
  function podPath(x) {
    x.beginPath(); x.moveTo(G.px0, G.yg); x.lineTo(G.px0, podTop(G.px0) + G.R * .02);
    for (var i = 0; i <= 64; i++) { var px = G.px0 + (G.px1 - G.px0) * i / 64; x.lineTo(px, podTop(px)); }
    x.lineTo(G.px1, G.yg); x.closePath();
  }
  function podium(x) {
    var R = G.R, yg = G.yg, yp = G.yp, px0 = G.px0, px1 = G.px1, cx = G.cx, lobT = yg - R * .1, i;
    x.save(); podPath(x);
    var f = x.createLinearGradient(0, yp - G.amp, 0, yg);
    if (day) { f.addColorStop(0, '#c6d6d4'); f.addColorStop(1, '#b4c7c4'); } else { f.addColorStop(0, '#0d1418'); f.addColorStop(1, '#080d10'); }
    x.fillStyle = f; x.fill(); x.clip();
    if (day) { var sl = x.createLinearGradient(px0, 0, px1, 0); sl.addColorStop(0, 'rgba(255,255,255,0)'); sl.addColorStop(1, 'rgba(255,255,255,.22)'); x.fillStyle = sl; x.fillRect(px0, yp - G.amp, px1 - px0, yg - yp + G.amp); }
    // vertical fins
    x.fillStyle = day ? 'rgba(40,82,84,.09)' : 'rgba(150,215,215,.035)';
    for (var fx = px0 + R * .02; fx < px1; fx += R * .045) x.fillRect(fx, yp, 1, lobT - yp - R * .015);
    // contact shadow right under the ball
    var cs = x.createLinearGradient(0, yp - G.amp, 0, yp + R * .08);
    cs.addColorStop(0, day ? 'rgba(10,40,44,.26)' : 'rgba(0,0,0,.55)'); cs.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = cs; x.fillRect(cx - G.pw, yp - G.amp, G.pw * 2, R * .1);
    // lobby glass
    var lg = x.createLinearGradient(0, lobT, 0, yg);
    if (day) { lg.addColorStop(0, '#94c8cf'); lg.addColorStop(1, '#5b8f98'); } else { lg.addColorStop(0, 'rgba(255,206,150,.12)'); lg.addColorStop(1, 'rgba(255,214,160,.3)'); }
    x.fillStyle = lg; x.fillRect(px0, lobT, px1 - px0, yg - lobT);
    var ex = G.mob ? cx - R * .45 : cx + R * .12, ew = R * .5;
    if (!day) { glow(x, ex, yg - R * .03, ew * .8, [1, .86, .66], .5, 1, .28); x.fillStyle = 'rgba(255,236,206,.42)'; x.fillRect(ex - ew / 2, lobT + R * .025, ew, yg - lobT - R * .025); }
    else { x.fillStyle = 'rgba(30,70,80,.28)'; x.fillRect(ex - ew / 2, lobT + R * .025, ew, yg - lobT - R * .025); }
    x.fillStyle = day ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.5)';
    for (var mx = px0 + R * .015; mx < px1; mx += R * .032) x.fillRect(mx, lobT, 1, yg - lobT);
    x.fillStyle = day ? 'rgba(255,255,255,.75)' : 'rgba(255,236,212,.55)'; x.fillRect(px0, lobT - 1, px1 - px0, day ? 2 : 1.5); // canopy line
    x.fillStyle = day ? 'rgba(20,50,54,.14)' : 'rgba(0,0,0,.4)'; x.fillRect(px0, lobT + 1, px1 - px0, 3);
    x.restore();
    // people for scale, at the lobby
    var r = rng(21), n = G.mob ? 5 : 11;
    for (i = 0; i < n; i++) {
      var px = ex + (r() - .5) * R * (G.mob ? .9 : 1.3), h = R * .03 * (.82 + r() * .3), w = h * .3;
      if (day) { x.fillStyle = 'rgba(20,50,54,.16)'; x.beginPath(); x.ellipse(px - h * .25, yg + 1, h * .45, h * .07, 0, 0, 7); x.fill(); }
      x.fillStyle = day ? (r() < .5 ? '#3a5357' : '#5a4a44') : '#020304';
      x.beginPath(); x.moveTo(px - w / 2, yg); x.lineTo(px - w * .55, yg - h * .78); x.quadraticCurveTo(px, yg - h * .86, px + w * .55, yg - h * .78); x.lineTo(px + w / 2, yg); x.fill();
      x.beginPath(); x.arc(px, yg - h * .9, h * .11, 0, 7); x.fill();
    }
  }
  /* a palm: tapered leaning trunk, a crown of arching fronds with drooping leaflets */
  function palm(x, bx, by, h, lean, kind, seed, rim) {
    var r = rng(seed * 97 + 13), kx = bx + lean * h * 1.4, ky = by - h, mx = bx + lean * h * .3, my = by - h * .55;
    var tw0 = h * .045, tw1 = h * .026, col, lit = null, trunk;
    if (kind === 'mid') { col = day ? '#58867e' : '#04080b'; trunk = day ? '#7f8a80' : '#04080b'; }
    else { col = day ? '#2f5d50' : '#020406'; trunk = day ? '#7a6e5c' : '#020406'; lit = day ? '#5f977f' : null; }
    function bez(t) { var u = 1 - t; return [u * u * bx + 2 * u * t * mx + t * t * kx, u * u * by + 2 * u * t * my + t * t * ky]; }
    function body(dx, c) {
      x.fillStyle = c; x.beginPath(); var i, p, q, L = [], Rr = [];
      for (i = 0; i <= 24; i++) { var t = i / 24; p = bez(t); q = bez(Math.min(1, t + .01)); var ax = q[0] - p[0], ay = q[1] - p[1], al = Math.hypot(ax, ay) || 1, w = tw0 + (tw1 - tw0) * t;
        L.push([p[0] - ay / al * w + dx, p[1] + ax / al * w]); Rr.push([p[0] + ay / al * w + dx, p[1] - ax / al * w]); }
      x.moveTo(L[0][0], L[0][1]); L.forEach(function (v) { x.lineTo(v[0], v[1]); }); Rr.reverse().forEach(function (v) { x.lineTo(v[0], v[1]); }); x.fill();
      var N = kind === 'mid' ? 9 : 11, cs = kind === 'mid' ? 1 : .74;
      for (i = 0; i < N; i++) {
        var a = -Math.PI / 2 + (i / (N - 1) - .5) * 3.5 + (r() - .5) * .22, len = h * cs * (.36 + r() * .14) * (1 - Math.abs(Math.sin(a)) * .14);
        var ca = Math.cos(a), sa = Math.sin(a), tipx = kx + ca * len + dx, tipy = ky + sa * len * .5 + len * .46 * Math.abs(ca) + len * .2;
        var cpx = kx + ca * len * .55 + dx, cpy = ky + sa * len * .5 - len * .18, U = [], Lo = [], M = 34;
        for (var k = 0; k <= M; k++) {
          var t2 = k / M, u2 = 1 - t2, ppx = u2 * u2 * (kx + dx) + 2 * u2 * t2 * cpx + t2 * t2 * tipx, ppy = u2 * u2 * ky + 2 * u2 * t2 * cpy + t2 * t2 * tipy;
          var tdx = 2 * u2 * (cpx - kx - dx) + 2 * t2 * (tipx - cpx), tdy = 2 * u2 * (cpy - ky) + 2 * t2 * (tipy - cpy), tl = Math.hypot(tdx, tdy) || 1; tdx /= tl; tdy /= tl;
          var nx = -tdy, ny = tdx; if (ny > 0) { nx = -nx; ny = -ny; }
          var wv = len * .11 * Math.pow(Math.sin(Math.PI * Math.min(1, t2 * 1.03)), .7), sr = k % 2 ? 1 : .22;
          U.push([ppx + nx * wv * .45, ppy + ny * wv * .45 + wv * .1]);
          Lo.push([ppx - nx * wv * sr + tdx * wv * .35 * sr, ppy - ny * wv * sr + wv * .75 * sr]);
        }
        x.fillStyle = c; x.beginPath(); x.moveTo(U[0][0], U[0][1]);
        U.forEach(function (v) { x.lineTo(v[0], v[1]); }); Lo.reverse().forEach(function (v) { x.lineTo(v[0], v[1]); }); x.closePath(); x.fill();
      }
      x.fillStyle = c; x.beginPath(); x.arc(kx + dx, ky + h * .01, h * .035, 0, 7); x.fill();
    }
    var save = r; // same random fronds for the rim, the body and the light pass
    if (rim) { r = rng(seed * 97 + 13); body(1.6, rim); }
    r = rng(seed * 97 + 13); x.fillStyle = trunk; body(0, col);
    // trunk colour + rings over the frond-coloured trunk
    x.save(); x.fillStyle = trunk; x.beginPath();
    for (var i = 0; i <= 24; i++) { var t = i / 24, p = bez(t), w = (tw0 + (tw1 - tw0) * t) * .96; x.moveTo(p[0] + w, p[1]); x.arc(p[0], p[1], w, 0, 7); }
    x.fill();
    if (day && kind !== 'mid') { x.strokeStyle = 'rgba(70,60,48,.35)'; x.lineWidth = 1; for (var j = 2; j < 44; j++) { var p2 = bez(j / 44), w2 = tw0 + (tw1 - tw0) * j / 44; x.beginPath(); x.moveTo(p2[0] - w2, p2[1]); x.lineTo(p2[0] + w2, p2[1] - 1.5); x.stroke(); } }
    x.restore();
    if (lit) { r = rng(seed * 97 + 13); x.save(); x.globalAlpha = .55; x.beginPath(); x.rect(kx - h, ky - h, h * 2.2, h * .95); x.clip(); body(-1.2, lit); x.restore(); }
    r = save;
  }
  function lamp(x, bx, by, h, near) {
    var top = by - h, arm = h * .16, w = Math.max(1.2, h * .012);
    x.fillStyle = day ? (near ? '#3f5155' : 'rgba(70,96,100,.8)') : (near ? '#020406' : '#05090c');
    x.fillRect(bx - w / 2, top, w, h); x.fillRect(bx - arm, top, arm + w / 2, w * 1.6);
    if (!day) {
      glow(x, bx - arm * .7, top + w * 2.2, h * .05, [1, .9, .74], .95);
      glow(x, bx - arm * .7, top + w * 2.2, h * .3, [1, .78, .5], .18);
      glow(x, bx - arm * .7, by + h * .02, h * .5, [1, .76, .48], .13, 1, .22);
    } else { x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(bx + w * .1, top, Math.max(.6, w * .35), h); }
  }

  /* ---------------- foreground (desktop): a near palm on the left, a near lamp on the right ---------------- */
  function bakeFg() {
    var x = ctx2(fgC, gdpr);
    if (G.mob) return;
    var R = G.R, H = G.H, a = AVG[skin], rim = day ? null : rgba([a[0] * .9, a[1] * .9, a[2] * .9], .55);
    // the trunk must pass left of the copy; the crown overlaps the ball's left limb
    var bx = -12, by = Math.min(H, G.vh) + 30, ky = G.cy + R * .02, want = G.cx - R + R * .06;
    var lim = bx + (G.copyL - 22 - bx) * (by - ky) / Math.max(1, by - G.ct);
    var kx = Math.max(24, Math.min(want, lim)), h = by - ky, lean = (kx - bx) / (h * 1.4);
    palm(x, bx, by, h, lean, 'fg', 9, rim);
  }

  /* ---------------- 2D fallback ball (no WebGL) ---------------- */
  function sphere2D(x) {
    var cx = G.cx, cy = G.cy, R = G.R, a = AVG[skin];
    if (!day) glow(x, cx, cy, R * 1.5, a, .22);
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip();
    var g = x.createRadialGradient(cx - R * .3, cy - R * .35, R * .1, cx, cy, R);
    if (skin === 'dodo') { g.addColorStop(0, '#fff7ea'); g.addColorStop(.92, '#f3e6d1'); g.addColorStop(.94, '#1fe0bf'); g.addColorStop(1, '#16b49a'); }
    else if (skin === 'brand') { g.addColorStop(0, '#0c3a33'); g.addColorStop(1, '#03110f'); }
    else if (skin === 'aurora') { g.addColorStop(0, '#141a3a'); g.addColorStop(1, '#04060f'); }
    else { g.addColorStop(0, '#2c7d8c'); g.addColorStop(.7, '#0d3442'); g.addColorStop(1, '#05141c'); }
    x.fillStyle = g; x.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    if (skin === 'dodo') {
      var ex = cx + R * .3, ey = cy - R * .22; x.fillStyle = '#3f3b39'; x.beginPath(); x.ellipse(ex, ey, R * .44, R * .46, 0, 0, 7); x.fill();
      x.fillStyle = '#fc6755'; x.fillRect(ex - R * .18, ey - R * .05, R * .15, R * .21); x.fillRect(ex - R * .12, ey - R * .2, R * .034, R * .4);
      x.fillStyle = '#0dae72'; x.fillRect(ex + R * .05, ey - R * .11, R * .15, R * .3); x.fillRect(ex + R * .11, ey - R * .2, R * .034, R * .5);
      x.fillStyle = '#fdf2e1'; x.beginPath(); x.arc(ex + R * .22, ey - R * .31, R * .085, 0, 7); x.fill();
    } else if (skin === 'brand') {
      x.globalAlpha = .55; for (var i = 0; i < 5; i++) { x.strokeStyle = i % 2 ? '#d9c48c' : '#2fdcbc'; x.lineWidth = R * .05; x.beginPath(); x.moveTo(cx - R, cy - R * .8 + i * R * .4); x.lineTo(cx + R, cy - R * .2 + i * R * .4); x.stroke(); }
      x.globalAlpha = 1; if (LOGO && LOGO.img) x.drawImage(LOGO.img, cx - R * .7, cy - R * .25, R * 1.4, R * 1.4 / 4.15);
    } else if (skin === 'aurora') {
      [['#3dffb0', -.1], ['#9d6bff', -.38], ['#ff7ac8', -.55]].forEach(function (b) { glow(x, cx, cy + b[1] * R, R, [0, 0, 0], 0); x.fillStyle = b[0]; x.globalAlpha = .35; x.beginPath(); x.ellipse(cx, cy + b[1] * R, R, R * .1, -.15, 0, 7); x.fill(); });
      x.globalAlpha = 1;
    }
    var sh = x.createRadialGradient(cx, cy, R * .7, cx, cy, R); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, day ? 'rgba(170,215,225,.45)' : 'rgba(0,0,0,.35)');
    x.fillStyle = sh; x.fillRect(cx - R, cy - R, 2 * R, 2 * R); x.restore();
  }

  /* ---------------- WebGL: the ball and its light ---------------- */
  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 uRes,uPodC;uniform float uDpr,uPad,uT,uDay,uSkA,uSkB,uMix,uLed,uHasLogo,uThumb,uRefl;',
    'uniform vec3 uC,uAvg,uEye;uniform vec4 uPod;uniform sampler2D uLogo;',
    'float h31(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
    'float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);',
    ' return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),',
    '  mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}',
    'float fbm(vec3 p,float o){float a=.5,s=0.,n=0.;for(int i=0;i<6;i++){if(float(i)>=o)break;s+=a*vn(p);n+=a;p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s/n;}',
    'vec3 rY(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}',
    'vec3 rX(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}',
    'float sdB(vec2 p,vec2 b,float r){vec2 d=abs(p)-b+r;return length(max(d,0.))+min(max(d.x,d.y),0.)-r;}',
    // 星球: a planet in the brand palette — teal seas, sage / gold land, ice caps, moving clouds, teal + gold city lights on the night side, atmosphere
    'vec3 skPlanet(vec3 n,float lod){',
    ' vec3 p=rY(rX(n,-.38),uT*.045+1.2);float o=lod>.5?2.:5.;',
    ' vec3 wq=p*1.6+3.1;if(lod<.5)wq+=.55*vec3(fbm(p*2.3,3.),fbm(p*2.3+5.2,3.),fbm(p*2.3+9.7,3.));float c=fbm(wq,o),dt=lod>.5?.5:fbm(p*9.,3.);float land=smoothstep(.555,.565,c+.06*(dt-.5));',
    ' vec3 sea=mix(vec3(.01,.07,.11),vec3(.05,.3,.36),smoothstep(.4,.52,c));',
    ' vec3 ld=mix(vec3(.07,.29,.23),vec3(.52,.49,.31),smoothstep(.55,.72,c+.15*(dt-.5)));ld=mix(ld,vec3(.74,.64,.4),smoothstep(.7,.86,c));',
    ' float ice=smoothstep(.9,.94,abs(p.y)+.08*(dt-.5));vec3 col=mix(sea,ld,land);col=mix(col,vec3(.85,.93,.96),ice);',
    ' if(lod<.5){float cl=smoothstep(.6,.82,fbm(rY(p,uT*.012)*3.6+vec3(0.,uT*.01,0.),5.));col=mix(col,vec3(.93,.97,1.),cl*.62);}',
    ' vec3 L=normalize(vec3(-.42,.34,.84));float d=dot(n,L),lit=max(smoothstep(-.28,.22,d),uDay*.55);vec3 nt=col*.06;',
    ' if(lod<.5){vec3 f=fract(p*70.)-.5;float h=h31(floor(p*70.));float ct=step(.84,h)*land*(1.-ice)*(1.-smoothstep(.18,.36,length(f)));',
    '  nt+=mix(vec3(.18,.86,.74),vec3(1.,.8,.45),step(.95,h))*ct;}',
    ' col=mix(nt,col*(.42+.78*max(d,0.)+.25*uDay),lit);col+=vec3(.2,.62,.82)*pow(1.-n.z,2.6)*(.3+.7*lit);return col;}',
    // Dodo: the brand Dodo — cream face, the one dark eye with a red and a green candle and a highlight, teal ring at the edge
    'vec3 skDodo(vec3 n,float lod){',
    ' vec3 col=vec3(.988,.945,.878)*(.94+.06*n.y);float rr=length(n.xy);',
    ' col=mix(col,vec3(.122,.878,.749),smoothstep(.925,.95,rr));',
    ' vec3 e=vec3(uEye.xy,sqrt(max(.05,1.-dot(uEye.xy,uEye.xy))));vec3 tx=normalize(cross(vec3(0.,1.,0.),e)),ty=cross(e,tx);',
    ' float ne=dot(n,e);vec3 dd=n-e*ne;vec2 uv=vec2(dot(dd,tx),dot(dd,ty));',
    ' float px=1./(uC.z*uDpr);vec2 E=vec2(uv.x/.45,uv.y/(.47*max(uEye.z,.02)));E.x/=1.+.1*clamp(E.y,-1.,1.);',
    ' float aa=px/.45/max(uEye.z,.15);float m=(1.-smoothstep(1.-aa,1.+aa,length(E)))*step(0.,ne);',
    ' if(m<=0.)return col;vec3 ey=vec3(.247,.231,.224);',
    ' if(lod<.5){float rd=min(sdB(uv-vec2(-.105,-.15),vec2(.017,.204),.012),sdB(uv-vec2(-.105,-.155),vec2(.079,.105),.024));',
    '  float gd=min(sdB(uv-vec2(.126,-.042),vec2(.017,.249),.012),sdB(uv-vec2(.125,-.041),vec2(.077,.151),.024));',
    '  ey=mix(ey,vec3(.988,.404,.333),1.-smoothstep(-px,px,rd));ey=mix(ey,vec3(.051,.682,.447),1.-smoothstep(-px,px,gd));',
    '  ey=mix(ey,vec3(.992,.949,.882),1.-smoothstep(.086-px,.086+px,length(uv-vec2(.22,.315))));}',
    ' return mix(col,ey,m);}',
    // 品牌: teal / mint / gold light flowing round the ball, the 3dtrading logo across the front with a passing sheen
    'vec3 skBrand(vec3 n,float lod){',
    ' float lon=atan(n.x,n.z),lat=asin(clamp(n.y,-1.,1.));float f=lon*1.4-lat*.9+uT*.2;',
    ' float w=lod>.5?.5:fbm(vec3(lon*1.2,lat*1.6,uT*.05),3.);',
    ' float b1=pow(.5+.5*sin(f*3.+w*4.),6.),b2=pow(.5+.5*sin(f*1.7-uT*.13+1.3+w*3.),10.);',
    ' vec3 col=vec3(.01,.05,.046)+vec3(.184,.863,.737)*b1*.5+mix(vec3(.56,.91,.83),vec3(.85,.77,.55),.5+.5*sin(f*.7))*b2*.7;',
    ' col+=vec3(.184,.863,.737)*.1*(1.-length(n.xy));',
    ' if(lod<.5&&uHasLogo>.5){vec2 uv=vec2(.5+lon/1.36,.5-(lat-.08)/.33);',
    '  if(uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.){float a=texture2D(uLogo,uv).a;float sw=exp(-pow((uv.x-fract(uT*.07)*1.8+.4)*5.,2.));',
    '   col=mix(col,vec3(1.),a*.94);col+=vec3(.35,.9,.8)*a*sw*.5;}}',
    ' return col;}',
    // 极光: curtains of green → violet → pink light drifting over a dark ball with a few stars
    'vec3 skAurora(vec3 n,float lod){',
    ' vec3 p=rY(n,uT*.02);float lon=atan(p.x,p.z),lat=n.y;vec3 col=mix(vec3(.01,.045,.06),vec3(.035,.02,.1),.5+.5*n.y);',
    ' if(lod<.5){vec3 f=fract(p*55.)-.5;col+=vec3(.8,.86,1.)*step(.985,h31(floor(p*55.)))*(1.-smoothstep(.05,.3,length(f)))*.8;}',
    ' for(int k=0;k<3;k++){float fk=float(k);',
    '  float c=-.3+.25*fk+.15*sin(lon*2.+uT*.11*(1.+fk*.3)+fk*2.1)+(lod>.5?0.:.1*(fbm(vec3(lon*2.,fk,uT*.03),3.)-.5));',
    '  float d=lat-c;float cu=smoothstep(-.035,0.,d)*exp(-max(d,0.)/(.2+.05*fk));',
    '  float ry=lod>.5?.7:.45+.55*vn(vec3(lon*26.+fk*7.,uT*.25,fk));',
    '  vec3 cc=mix(vec3(.2,1.,.62),vec3(.62,.38,1.),smoothstep(0.,.25,d));cc=mix(cc,vec3(1.,.45,.75),smoothstep(.18,.4,d)*.6);',
    '  col+=cc*cu*ry*(.75-.15*fk)+vec3(.12,.7,.5)*exp(min(d,0.)/.09)*(1.-cu)*.12;}',
    ' return col;}',
    'vec3 sk(float k,vec3 n,float lod){if(k<.5)return skPlanet(n,lod);if(k<1.5)return skDodo(n,lod);if(k<2.5)return skBrand(n,lod);return skAurora(n,lod);}',
    'vec3 skMix(vec3 n,vec2 q){vec3 a=sk(uSkA,n,0.);if(uMix<=0.)return a;vec3 b=sk(uSkB,n,0.);',
    ' float x=(q.x-q.y*.4)*.42+.5,e=uMix*1.3-.15;vec3 c=mix(b,a,smoothstep(e-.05,e+.05,x));',
    ' return c+vec3(.7,1.,.94)*exp(-pow((x-e)/.018,2.))*.55;}',
    'vec3 shade(vec3 s,vec3 n,vec2 p,float top){',
    ' float lat=asin(clamp(n.y,-1.,1.)),lon=atan(n.x,n.z);vec2 f=abs(fract(vec2(lon,lat)*uLed)-.5);',
    ' float lp=uC.z*uDpr/uLed*max(n.z,.05);s*=1.-smoothstep(2.2,4.5,lp)*.24*smoothstep(.3,.5,max(f.x,f.y));',
    ' vec3 c;',
    ' if(uDay<.5){c=s*mix(.58,1.,pow(n.z,.5))+uAvg*pow(1.-n.z,3.)*.22;}',
    ' else{vec3 L=normalize(vec3(.55,.6,.58));float df=max(dot(n,L),0.),fr=pow(1.-n.z,2.5);',
    '  c=s*(.64+.22*df)*mix(.74,1.,pow(n.z,.4));c=mix(c,vec3(.66,.86,.91),fr*.5);',
    '  c+=vec3(1.,.97,.9)*pow(max(dot(reflect(vec3(0.,0.,-1.),n),L),0.),36.)*.45;c=mix(c,vec3(.8,.9,.91),.07);}',
    ' if(uThumb<.5)c*=mix(.6,1.,smoothstep(0.,.16*uC.z,top-p.y));return c;}',
    'void main(){',
    ' if(uThumb>.5){vec2 q=(gl_FragCoord.xy/uRes)*2.-1.;q*=1.03;float r2=dot(q,q);if(r2>1.){gl_FragColor=vec4(0.);return;}',
    '  vec3 n=vec3(q.x,q.y,sqrt(1.-r2));vec3 c=shade(skMix(n,q),n,vec2(0.),0.);float aa=clamp((1.-sqrt(r2))*uRes.x*.5/1.2,0.,1.);',
    '  gl_FragColor=vec4(c*aa,aa);return;}',
    ' vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr-uPad;float R=uC.z;vec2 q=(p-uC.xy)/R;float r2=dot(q,q),d=sqrt(r2);',
    ' float ix=step(uPod.z,p.x)*step(p.x,uPod.w),dx=(p.x-uC.x)/uPodC.y,top=uPod.x-uPodC.x*sqrt(max(0.,1.-dx*dx));',
    ' float pm=ix*clamp((p.y-top)*uDpr+.5,0.,1.),nt=1.-uDay;vec3 li=vec3(0.);',
    ' if(d>.98){float k=max(d-1.,0.);li+=uAvg*(.3*exp(-k*7.)+.11*exp(-k*1.7))*nt*(1.-pm);li+=vec3(1.,.99,.95)*.12*exp(-k*10.)*uDay*(1.-pm);}',
    ' if(ix>.5&&p.y>top-2.){float dy=p.y-top,hx=1.-smoothstep(.75,1.25,abs(p.x-uC.x)/R);li+=uAvg*(.45*exp(-max(dy,0.)/(.018*R))+.08*exp(-max(dy,0.)/(.2*R)))*hx*(nt+.15*uDay);}',
    ' float yg=uPod.y;',
    ' if(p.y>yg){float dy=p.y-yg;vec2 e=vec2((p.x-uC.x)/(1.7*R),dy/(1.1*R));li+=uAvg*.17*exp(-dot(e,e)*1.8)*nt;',
    '  float rip=sin(p.y*.42+uT*1.4)*1.1+sin(p.y*.11-uT*.6)*2.2;float sy=uPod.x-.04*R-dy/.72;vec2 sp=vec2(p.x+rip*(.25+dy/(.4*R)),sy);',
    '  vec2 sq=(sp-uC.xy)/R;float sr=dot(sq,sq);',
    '  if(sr<1.){vec3 sn=vec3(sq.x,-sq.y,sqrt(1.-sr));vec3 rc=sk(uMix>.5?uSkB:uSkA,sn,1.);',
    '   li+=rc*uRefl*exp(-dy/(.5*R))*smoothstep(0.,6.,dy)*(1.-smoothstep(.9,1.,sqrt(sr)))*(nt+.25*uDay);}}',
    ' vec4 o=vec4(li,clamp(max(li.r,max(li.g,li.b)),0.,1.));',
    ' if(d<1.&&pm<1.){vec3 n=vec3(q.x,-q.y,sqrt(max(0.,1.-r2)));vec3 c=shade(skMix(n,q),n,p,top);',
    '  float aa=clamp((1.-d)*R*uDpr/1.2,0.,1.)*(1.-pm);o=vec4(c*aa+o.rgb*(1.-aa),aa+o.a*(1.-aa));}',
    ' gl_FragColor=o;}'
  ].join('\n');
  var UN = ['uRes', 'uPodC', 'uDpr', 'uPad', 'uT', 'uDay', 'uSkA', 'uSkB', 'uMix', 'uLed', 'uHasLogo', 'uThumb', 'uRefl', 'uC', 'uAvg', 'uEye', 'uPod', 'uLogo'];
  function makeGL(c) {
    var gl = null;
    try { gl = c.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false }) || c.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl || typeof gl.createShader !== 'function') return null;
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { err = 'shader: ' + gl.getShaderInfoLog(s); return null; } return s; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS); if (!vs || !fs) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.bindAttribLocation(pr, 0, 'a'); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { err = 'link: ' + gl.getProgramInfoLog(pr); return null; }
    gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    var U = {}; UN.forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    var tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    ['TEXTURE_MIN_FILTER', 'TEXTURE_MAG_FILTER'].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, gl[k], gl.LINEAR); });
    ['TEXTURE_WRAP_S', 'TEXTURE_WRAP_T'].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, gl[k], gl.CLAMP_TO_EDGE); });
    gl.uniform1i(U.uLogo, 0); gl.disable(gl.BLEND);
    return { gl: gl, pr: pr, U: U, tex: tex, logo: false };
  }
  function upLogo(T) {
    if (!T || !LOGO || !LOGO.cv || T.logo) return;
    var gl = T.gl; gl.bindTexture(gl.TEXTURE_2D, T.tex);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, LOGO.cv); T.logo = true; } catch (e) { T.logo = false; }
  }
  function loadLogo() {
    var img = new Image();
    img.onload = function () {
      try { var c = D.createElement('canvas'); c.width = 1024; c.height = 248; var x = c.getContext('2d'); x.drawImage(img, 0, 0, 1024, 248); LOGO = { img: img, cv: c }; } catch (e) { LOGO = { img: img }; }
      upLogo(GL); upLogo(TG); thumbs(); if (!GL) bake(); else frame(performance.now());
    };
    img.src = 'assets/3dtrading-logo-white.svg';
  }
  var IDX = { planet: 0, dodo: 1, brand: 2, aurora: 3 };
  function setU(T, o) {
    var gl = T.gl, U = T.U;
    gl.uniform2f(U.uRes, o.w, o.h); gl.uniform1f(U.uDpr, o.dpr); gl.uniform1f(U.uPad, o.pad); gl.uniform1f(U.uT, o.t);
    gl.uniform1f(U.uDay, o.day ? 1 : 0); gl.uniform1f(U.uSkA, o.a); gl.uniform1f(U.uSkB, o.b); gl.uniform1f(U.uMix, o.mix);
    gl.uniform1f(U.uLed, o.led); gl.uniform1f(U.uHasLogo, T.logo ? 1 : 0); gl.uniform1f(U.uThumb, o.thumb ? 1 : 0); gl.uniform1f(U.uRefl, o.refl);
    gl.uniform3f(U.uC, o.c[0], o.c[1], o.c[2]); gl.uniform3f(U.uAvg, o.avg[0], o.avg[1], o.avg[2]); gl.uniform3f(U.uEye, o.eye[0], o.eye[1], o.eye[2]);
    gl.uniform4f(U.uPod, o.pod[0], o.pod[1], o.pod[2], o.pod[3]); gl.uniform2f(U.uPodC, o.podc[0], o.podc[1]);
  }
  /* skin previews: each skin rendered once by the same shader, copied into its button */
  function thumbs() {
    var cs = D.querySelectorAll('.sk canvas'); if (!cs.length) return;
    if (!TG && GL !== null) { var c = D.createElement('canvas'); c.width = c.height = 96; TG = makeGL(c); if (TG) { TG.cv = c; upLogo(TG); } else TG = 0; }
    if (!TG) return;
    Array.prototype.forEach.call(cs, function (cv) {
      var k = IDX[cv.parentNode.getAttribute('data-skin')]; if (k == null) return;
      var gl = TG.gl; gl.viewport(0, 0, 96, 96); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      setU(TG, { w: 96, h: 96, dpr: 1, pad: 0, t: k === 3 ? 30 : 8, day: false, a: k, b: k, mix: 0, led: 13, thumb: true, refl: 0, c: [0, 0, 48], avg: AVG[SKINS[k]], eye: [.3, .2, 1], pod: [0, 0, 0, 0], podc: [0, 1] });
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      try { var x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(TG.cv, 0, 0, cv.width, cv.height); cv.parentNode.classList.add('drawn'); } catch (e) {}
    });
  }

  /* ---------------- the eye (Dodo skin): follows the pointer, looks at the field you type in, looks away from the password ---------------- */
  var REST = [.3, .2], eye = { x: .3, y: .2, lid: 1 }, ptr = { x: 0, y: 0, at: -1e9, has: false }, look = 'free', lookEl = null, blinkAt = 0, blinkK = -1;
  function eyeTarget(now) {
    var tx = REST[0], ty = REST[1], lid = 1, vx, vy;
    if (look === 'away') { tx = -.24; ty = .36; lid = .45; }
    else {
      if (look === 'form' && lookEl) { var b = lookEl.getBoundingClientRect(); vx = b.left + Math.min(b.width, 160) / 2; vy = b.top + b.height / 2 + scrollY; }
      else if (ptr.has && now - ptr.at < 6000) { vx = ptr.x; vy = ptr.y + scrollY; }
      if (vx != null) {
        var lx = (vx - G.cx) / (G.W * .45), ly = (vy - G.cy) / (G.vh * .45), l = Math.hypot(lx, ly); if (l > 1) { lx /= l; ly /= l; }
        tx = REST[0] + lx * .27; ty = REST[1] - ly * .22;
      } else if (!still) { tx = REST[0] + Math.sin(now * .00041) * .07; ty = REST[1] + Math.sin(now * .00027 + 1) * .05; }
    }
    var m = Math.hypot(tx, ty); if (m > .58) { tx *= .58 / m; ty *= .58 / m; }
    return [tx, ty, lid];
  }
  function eyeStep(now) {
    var t = eyeTarget(now);
    if (still) { eye.x = t[0]; eye.y = t[1]; eye.lid = t[2]; return; }
    eye.x += (t[0] - eye.x) * .085; eye.y += (t[1] - eye.y) * .085;
    var lid = t[2];
    if (!blinkAt) blinkAt = now + 2600 + Math.random() * 2500;
    if (now > blinkAt) { var k = (now - blinkAt) / 170; if (k >= 1) { blinkAt = now + 3200 + Math.random() * 4200 - (Math.random() < .2 ? 2800 : 0); } else lid *= 1 - Math.sin(Math.PI * k) * .94; }
    eye.lid += (lid - eye.lid) * (lid < eye.lid ? .6 : .3);
  }

  /* ---------------- frame ---------------- */
  var px = 0, py = 0, raf = 0, lastT = 0;
  function avgNow() { var a = AVG[skinFrom], b = AVG[skin], k = mixStart ? mixT : 1; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function frame(now) {
    if (!G) return;
    if (mixStart) { var k = (now - mixStart) / MIXMS; if (k >= 1 || still) { mixStart = 0; mixT = 0; skinFrom = skin; bakeFg(); } else mixT = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
    eyeStep(now);
    var t = still ? 21 : now / 1000;
    if (GL) {
      var gl = GL.gl; gl.viewport(0, 0, orb.width, orb.height);
      setU(GL, { w: orb.width, h: orb.height, dpr: dpr, pad: P, t: t, day: day, a: IDX[skinFrom], b: IDX[skin], mix: mixStart ? mixT : 0, led: G.R / 4.6,
        thumb: false, refl: G.mob ? .16 : .22, c: [G.cx, G.cy, G.R], avg: avgNow(), eye: [eye.x, eye.y, eye.lid], pod: [G.yp, G.yg, G.px0, G.px1], podc: [G.amp, G.pw] });
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    // parallax (desktop pointer only)
    if (!still && !G.mob) {
      var tx = ptr.has ? (ptr.x / G.W - .5) : 0, ty = ptr.has ? (ptr.y / G.vh - .5) : 0;
      px += (tx - px) * .05; py += (ty - py) * .05;
      back.style.transform = 'translate3d(' + (-px * 4).toFixed(2) + 'px,' + (-py * 2).toFixed(2) + 'px,0)';
      l1.style.transform = 'translate3d(' + (-px * 9).toFixed(2) + 'px,' + (-py * 4).toFixed(2) + 'px,0)';
      fgC.style.transform = 'translate3d(' + (-px * 20).toFixed(2) + 'px,' + (-py * 8).toFixed(2) + 'px,0)';
    }
    lastT = now;
  }
  function loop(now) { raf = 0; try { frame(now); } catch (e) { err = String(e && e.message || e); return; } if (!still && !D.hidden) raf = requestAnimationFrame(loop); }
  function kick() { if (still) { frame(performance.now()); return; } if (!raf && !D.hidden) raf = requestAnimationFrame(loop); }
  /* reduce on: stop the loop at once, finish any skin cross-fade, drop parallax offsets and blinking, paint one still frame.
     reduce off: start one loop again (kick never starts a second one; a hidden page waits for visibilitychange).
     Skin, day/night and the form are not touched. */
  function setStill(v) {
    v = !!v; if (v === still) return; still = v;
    if (still) {
      if (raf) cancelAnimationFrame(raf); raf = 0;
      px = 0; py = 0; blinkAt = 0;
      back.style.transform = ''; l1.style.transform = ''; fgC.style.transform = '';
      try { frame(performance.now()); } catch (e) { err = String(e && e.message || e); }
    } else { blinkAt = 0; kick(); }
  }

  /* ---------------- build / rebuild ---------------- */
  function bake() {
    day = isDay(); G = geom();
    var q = Math.min(2, devicePixelRatio || 1); gdpr = q; dpr = Math.min(devicePixelRatio || 1, G.mob ? 2 : 1.5);
    scene.style.height = G.H + 'px';
    bakeBack(); bakeMid(); bakeFg();
    if (GL) { orb.width = Math.round((G.W + 2 * P) * dpr); orb.height = Math.round((G.H + 2 * P) * dpr); }
    frame(performance.now());
  }
  function sig() { var g = geom(); return [g.W, g.H, g.vh, Math.round(g.cx), Math.round(g.cy), Math.round(g.R), Math.round(g.yp), isDay()].join(','); }
  var lastSig = '', rt = 0;
  function maybe() { clearTimeout(rt); rt = setTimeout(function () { try { var s = sig(); if (s !== lastSig) { lastSig = s; bake(); } } catch (e) { err = String(e && e.message || e); } }, 60); }

  /* ---------------- skin picker ---------------- */
  var picks = D.querySelectorAll('.sk[data-skin]');
  function label() {
    Array.prototype.forEach.call(picks, function (b) { var on = b.getAttribute('data-skin') === skin; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    var nm = D.getElementById('skN'), on = D.querySelector('.sk[aria-checked="true"]'); if (nm && on) nm.textContent = on.getAttribute('aria-label') || '';
    root.dataset.sphere = skin;
  }
  function choose(s, focus) {
    if (SKINS.indexOf(s) < 0) return;
    if (s !== skin) {
      if (mixStart) { skinFrom = mixT > .5 ? skin : skinFrom; } // a second tap mid-change continues from what mostly shows
      if (!mixStart) skinFrom = skin;
      skin = s; try { localStorage.setItem(KEY, s); } catch (e) {}
      if (still || !GL) { skinFrom = s; mixStart = 0; mixT = 0; if (!GL) bakeMid(); bakeFg(); } else { mixStart = performance.now(); mixT = 0; }
      kick();
    }
    label();
    if (focus) { var b = D.querySelector('.sk[data-skin="' + s + '"]'); if (b) b.focus(); }
  }
  Array.prototype.forEach.call(picks, function (b) {
    b.addEventListener('click', function () { choose(b.getAttribute('data-skin')); });
    b.addEventListener('keydown', function (e) {
      var i = SKINS.indexOf(skin), k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); choose(SKINS[(i + 1) % 4], true); }
      else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); choose(SKINS[(i + 3) % 4], true); }
      else if (k === 'Home') { e.preventDefault(); choose(SKINS[0], true); } else if (k === 'End') { e.preventDefault(); choose(SKINS[3], true); }
    });
  });

  /* ---------------- events ---------------- */
  addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; ptr.x = e.clientX; ptr.y = e.clientY; ptr.at = performance.now(); ptr.has = true; if (still && skin === 'dodo') frame(performance.now()); }, { passive: true });
  D.addEventListener('focusin', function (e) {
    var t = e.target; if (!t || !t.matches || !t.matches('#f input')) return;
    lookEl = t; look = t.type === 'password' ? 'away' : 'form'; if (still) frame(performance.now());
  });
  D.addEventListener('focusout', function () { setTimeout(function () { var a = D.activeElement; if (!a || !a.matches || !a.matches('#f input')) { look = 'free'; lookEl = null; if (still) frame(performance.now()); } }, 0); });
  D.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-eye]'); if (b) setTimeout(function () { var i = D.getElementById(b.getAttribute('data-eye')); if (i && D.activeElement === i) look = i.type === 'password' ? 'away' : 'form'; if (still) frame(performance.now()); }, 0); });
  addEventListener('resize', maybe);
  addEventListener('td:theme', function () { try { bake(); lastSig = sig(); } catch (e) { err = String(e && e.message || e); } });
  addEventListener('td:lang', function () { setTimeout(function () { label(); maybe(); }, 40); });
  addEventListener('td:session', maybe);
  if (window.ResizeObserver) { var ro = new ResizeObserver(maybe); ['.wrap', '.hero', '.card'].forEach(function (q) { var e = D.querySelector(q); if (e) ro.observe(e); }); }
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(maybe);
  D.addEventListener('visibilitychange', function () { if (D.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else kick(); });
  addEventListener('pageshow', function () { kick(); });
  if (RM) { var onRM = function () { setStill(RM.matches); }; if (RM.addEventListener) RM.addEventListener('change', onRM); else if (RM.addListener) RM.addListener(onRM); }
  orb.addEventListener('webglcontextlost', function (e) { e.preventDefault(); GL = null; orb.style.display = 'none'; try { bakeMid(); } catch (x) {} });

  /* ---------------- start ---------------- */
  try {
    GL = makeGL(orb);
    if (!GL) { orb.style.display = 'none'; GL = null; }
    label(); bake(); lastSig = sig(); thumbs(); loadLogo(); kick();
  } catch (e) { err = String(e && e.message || e); }

  window.__orb = {
    theme: function () { return root.dataset.theme; }, skin: function () { return skin; }, skins: SKINS.slice(), webgl: function () { return !!GL; }, err: function () { return err; },
    sphere: function () { return G ? { cx: Math.round(G.cx), cy: Math.round(G.cy), R: Math.round(G.R), yp: Math.round(G.yp), yg: Math.round(G.yg), mob: G.mob, W: G.W, H: G.H } : null; },
    eye: function () { return { x: +eye.x.toFixed(3), y: +eye.y.toFixed(3), lid: +eye.lid.toFixed(2), look: look }; },
    choose: function (s) { choose(s); return skin; },
    motion: function () { return { still: still, raf: !!raf, parallax: [back.style.transform, l1.style.transform, fgC.style.transform] }; },
    galaxy: function () { return null; },
    bg: function () { return { r48: true, scene: 'outside the Sphere: sky + skyline + podium + plaza + palms/lamps; live ball (4 skins) with halo, cove light, pool and reflection at night', still: still }; }
  };
})();
