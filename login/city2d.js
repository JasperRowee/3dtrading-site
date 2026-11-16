/* r54: single default deep-space login scene; r53 daytime sphere size, finer LED lattice, upper-right mobile crop. */
(function () {
  'use strict';
  var D = document, root = D.documentElement, cv = D.getElementById('city');
  if (!cv || !cv.getContext) return;
  var g = cv.getContext('2d');
  var RM = null; try { RM = matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) {}
  var still = !!(RM && RM.matches);
  var W = 0, H = 0, DPR = 1, day = false, G = null, bg = null, lat = null, lit = null, tmp = null, raf = 0, last = 0, t0 = performance.now();

  function rnd(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function mk(w, h) { var c = D.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }

  /* geometry: desktop is the reference's ratios; phones put the arc behind the headline */
  function geo() {
    var mob = W <= 900, R = mob ? Math.min(W*.72,340)*1.15 : H*.725*1.15;
    return {mob:mob,cx:W*(mob?.96:.30),cy:mob?84:H*1.097,R:R,hz:H,tilt:.32};
  }

  var PAL = {
    night: { sky0: '#030507', sky1: '#071012', sky2: '#0b1a1a', far: [16, 27, 29], near: [9, 15, 17], win: 'rgba(120,235,214,', warm: 'rgba(240,190,90,',
      plaza0: '#071011', plaza1: '#040708', grid: 'rgba(62,230,198,.06)', hzl: 'rgba(62,230,198,.32)',
      body0: '#0a1414', body1: '#040808', dot: [70, 150, 135], dotA: .28, rim: [94, 236, 207], lit: [80, 240, 205], gold: [233, 196, 106] },
    day: { sky0: '#1fc4a8', sky1: '#7fdcca', sky2: '#c8f4ea', far: [176, 199, 196], near: [124, 152, 150], win: 'rgba(255,255,255,', warm: 'rgba(214,150,40,',
      plaza0: '#cfe0dc', plaza1: '#c3d7d3', grid: 'rgba(10,125,104,.07)', hzl: 'rgba(10,125,104,.28)',
      body0: '#f7fbfa', body1: '#dbe9e6', dot: [40, 120, 108], dotA: .22, rim: [10, 150, 124], lit: [10, 160, 132], gold: [196, 146, 40] }
  };
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')'; }

  /* ---------- the backdrop: sky, stars, our city, plaza ---------- */
  function tower(x, c, base, w, h, col, P, r, near) {
    var top = base - h;
    c.fillStyle = rgba(col, 1); c.fillRect(x, top, w, h);
    /* the wick: a thin spire, sometimes with a set-back step */
    var wk = r() < .7, wh = h * (.08 + r() * .14);
    if (wk) { c.fillRect(x + w / 2 - Math.max(1, w * .04), top - wh, Math.max(2, w * .08), wh); }
    if (r() < .35) { var sw = w * .62; c.fillRect(x + (w - sw) / 2, top - h * .06, sw, h * .06); }
    /* the cap: rising teal, a few warm, a rare red — the city's candles */
    var k = r(), capC = k < .62 ? P.win : (k < .86 ? P.warm : 'rgba(246,90,108,');
    c.fillStyle = capC + (near ? (day ? .55 : .75) : (day ? .35 : .45)) + ')'; c.fillRect(x, top, w, Math.max(1.5, h * .006 + 1));
    if (wk && r() < .5) { c.fillStyle = capC + (day ? .6 : .9) + ')'; c.beginPath(); c.arc(x + w / 2, top - wh, Math.max(1.2, w * .05), 0, 6.283); c.fill(); }
    /* windows: sparse lit cells */
    var cw = near ? 6 : 4.5, chh = near ? 9 : 7, a0 = day ? .55 : .5;
    for (var yy = top + chh * 1.4; yy < base - chh; yy += chh) for (var xx = x + cw * .8; xx < x + w - cw; xx += cw) {
      var q = r(); if (q < (day ? .1 : .085)) { c.fillStyle = (q < .012 ? P.warm : P.win) + (a0 * (.4 + r() * .6)).toFixed(2) + ')'; c.fillRect(xx, yy, near ? 2 : 1.5, near ? 2.4 : 1.8); }
    }
    /* a soft vertical edge light so the volume reads */
    var eg = c.createLinearGradient(x, 0, x + w, 0); eg.addColorStop(0, day ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.035)'); eg.addColorStop(.35, 'rgba(255,255,255,0)'); eg.addColorStop(1, day ? 'rgba(0,40,40,.06)' : 'rgba(0,0,0,.18)');
    c.fillStyle = eg; c.fillRect(x, top, w, h);
  }
  function bakeBg() {
    var c=bg.getContext('2d'), r=rnd(4207);
    c.setTransform(DPR,0,0,DPR,0,0); c.fillStyle='#02050c'; c.fillRect(0,0,W,H);
    var halo=c.createRadialGradient(G.cx,G.cy,G.R*.7,G.cx,G.cy,G.R*1.8);
    halo.addColorStop(0,'rgba(24,116,125,.12)'); halo.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=halo; c.fillRect(0,0,W,H);
    for(var i=0;i<W*H/6400;i++){c.fillStyle='rgba(180,216,232,'+(.15+r()*.4)+')';c.fillRect(r()*W,r()*H,1,1);}
  }

  /* ---------- the sphere: body + LED lattice (static), lit LEDs (masked by a moving light each frame) ---------- */
  function bakeSphere() {
    var P = day ? PAL.day : PAL.night, cx = G.cx, cy = G.cy, R = G.R, ti = G.tilt, ct = Math.cos(ti), st = Math.sin(ti);
    var a = lat.getContext('2d'), b = lit.getContext('2d');
    [a, b].forEach(function (c) { c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, W, H); });
    /* body */
    var bd = a.createRadialGradient(cx - R * .35, cy - R * .6, R * .1, cx, cy, R); bd.addColorStop(0, P.body0); bd.addColorStop(1, P.body1);
    a.fillStyle = bd; a.beginPath(); a.arc(cx, cy, R, 0, 6.2832); a.fill();
    /* LED lattice: rings of latitude on a sphere tilted towards us; spacing ~ 10 px at the reference size */
    var step = Math.max(3.2, Math.min(4.5,R / 155)) / R, dot = Math.max(.8, R / 700);
    for (var ph = -1.5; ph <= 1.5; ph += step) {
      var cp = Math.cos(ph), sp = Math.sin(ph), n = Math.max(6, Math.round(6.2832 * cp / step));
      for (var i = 0; i < n; i++) {
        var lo = i / n * 6.2832, x = cp * Math.sin(lo), y = sp, z = cp * Math.cos(lo);
        var y2 = y * ct + z * st, z2 = -y * st + z * ct; if (z2 <= 0.02) continue;
        var px = cx + x * R, py = cy - y2 * R; if (px < -4 || px > W + 4 || py < -4 || py > H + 4) continue;
        var limb = Math.pow(z2, .6), al = P.dotA * (.35 + .65 * limb);
        a.fillStyle = rgba(P.dot, al.toFixed(3)); a.fillRect(px - dot / 2, py - dot / 2, dot, dot);
        b.fillStyle = rgba(P.lit, (.55 + .45 * limb).toFixed(3)); b.fillRect(px - dot * .6, py - dot * .6, dot * 1.2, dot * 1.2);
      }
    }
    /* limb shade + rim light (brightest on the upper left, like the reference) */
    var sh = a.createRadialGradient(cx, cy, R * .72, cx, cy, R); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, day ? 'rgba(20,60,56,.10)' : 'rgba(0,0,0,.45)');
    a.fillStyle = sh; a.beginPath(); a.arc(cx, cy, R, 0, 6.2832); a.fill();
    for (var k = 0; k < 3; k++) {
      var rg = a.createLinearGradient(cx - R, cy - R, cx + R * .9, cy - R * .2);
      rg.addColorStop(0, rgba(P.rim, [.9, .28, .1][k])); rg.addColorStop(.55, rgba(P.rim, [.55, .14, .05][k])); rg.addColorStop(1, rgba(P.rim, 0));
      a.strokeStyle = rg; a.lineWidth = [1.4, 5, 14][k]; a.beginPath(); a.arc(cx, cy, R - [0, 2, 6][k], Math.PI * 1.02, Math.PI * 2.02); a.stroke();
    }
  }

  /* the moving light shown through the LEDs: one wide slow band + a drifting glow; gold streak on the right shoulder */
  function frame(now) {
    var P = day ? PAL.day : PAL.night, t = (now - t0) / 1000, cx = G.cx, cy = G.cy, R = G.R;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.drawImage(bg, 0, 0); g.drawImage(lat, 0, 0);
    var m = tmp.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, tmp.width, tmp.height);
    m.setTransform(DPR, 0, 0, DPR, 0, 0);
    var ph = still ? .35 : (t * .045) % 1, bx = cx - R * 1.3 + ph * R * 2.6;
    var band = m.createLinearGradient(bx - R * .45, cy - R, bx + R * .45, cy - R * .4);
    band.addColorStop(0, 'rgba(0,0,0,0)'); band.addColorStop(.5, 'rgba(0,0,0,' + (day ? .5 : .55) + ')'); band.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = band; m.fillRect(0, 0, W, H);
    var gx = cx + Math.sin(t * .11) * R * .35, gy = cy - R * (.72 + .08 * Math.sin(t * .07));
    var gr = m.createRadialGradient(gx, gy, 0, gx, gy, R * .42); gr.addColorStop(0, 'rgba(0,0,0,' + (day ? .45 : .5) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = gr; m.fillRect(0, 0, W, H);
    m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-in'; m.drawImage(lit, 0, 0);
    g.drawImage(tmp, 0, 0);
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    /* gold streak on the right shoulder (reference: a short gold stroke just inside the edge) */
    var an = -Math.PI * .365, sx = cx + Math.cos(an) * R * .985, sy = cy + Math.sin(an) * R * .985, len = R * .11, pu = still ? .85 : .65 + .35 * Math.sin(t * .8);
    var gs = g.createLinearGradient(sx, sy, sx - len * .38, sy + len); gs.addColorStop(0, rgba(P.gold, (.95 * pu).toFixed(3))); gs.addColorStop(1, rgba(P.gold, 0));
    g.strokeStyle = gs; g.lineWidth = Math.max(2, R / 240); g.lineCap = 'round'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx - len * .38, sy + len); g.stroke();
    /* a faint orbit ring across the foreground */
    g.strokeStyle = rgba(P.rim, day ? .22 : .18); g.lineWidth = 1; g.beginPath(); g.ellipse(cx + R * .05, cy + R * .07, R * 1.55, R * .5, -.06, Math.PI * 1.02, Math.PI * 1.98); g.stroke();
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  function loop(now) { raf = 0; if (D.hidden) return; if (now - last > 33) { last = now; frame(now); } if (!still) raf = requestAnimationFrame(loop); }
  function kick() { if (!raf && !D.hidden) raf = requestAnimationFrame(loop); }
  function build() {
    var r = cv.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height); if (!W || !H) return;
    DPR = Math.min(2, window.devicePixelRatio || 1); day = false; G = geo();
    var w = Math.round(W * DPR), h = Math.round(H * DPR); cv.width = w; cv.height = h;
    bg = mk(w, h); lat = mk(w, h); lit = mk(w, h); tmp = mk(w, h);
    bakeBg(); bakeSphere(); frame(performance.now()); kick();
  }
  var sigv = ''; function sig() { return [innerWidth, innerHeight, root.dataset.theme, root.lang].join('|'); }
  function maybe() { var s = sig(); if (s !== sigv) { sigv = s; build(); } }
  addEventListener('resize', maybe);
  addEventListener('td:theme', function () { sigv = ''; maybe(); });
  addEventListener('td:lang', function () { setTimeout(function () { sigv = ''; maybe(); }, 40); });
  D.addEventListener('visibilitychange', function () { if (!D.hidden) kick(); });
  addEventListener('pageshow', kick);
  if (RM) { var onRM = function () { still = RM.matches; frame(performance.now()); kick(); }; if (RM.addEventListener) RM.addEventListener('change', onRM); }
  maybe();
  window.__city = { mode: '2d', grid: false, geo: function () { return G && { W: W, H: H, cx: G.cx, cy: G.cy, R: G.R, hz: G.hz, top: G.cy - G.R, mob: G.mob }; }, still: function () { return still; } };
})();
