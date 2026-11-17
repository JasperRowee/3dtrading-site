/* 3dtrading r49 · website-only helper (replaces the shared account module for this standalone preview).
 * - routes: every way in (door, header button, scrolling past the end) opens the separate log-in preview on port 8992 of
 *   the same host. Override with ?login=<url> on this page. Nothing here signs anyone in: there is no session, no
 *   dashboard and no account data on this site.
 * - reveal: the day / night switch dyes the page outward from the click (View Transitions), as in r42–r48. */
(function (global) {
  'use strict';
  var q = new URLSearchParams(location.search), base = q.get('login') || '/3dtrading-site/login/';
  var sep = base.indexOf('?') < 0 ? '?' : '&';
  var REVEAL_MS = 480, REVEAL_EASE = 'cubic-bezier(.3,.45,.6,.95)';
  function revealOrigin(src) {
    if (src && typeof src.clientX === 'number' && (src.clientX || src.clientY)) return [src.clientX, src.clientY];
    var el = src && src.getBoundingClientRect ? src : src && src.currentTarget && src.currentTarget.getBoundingClientRect ? src.currentTarget : null;
    if (el) { var b = el.getBoundingClientRect(); if (b.width) return [b.left + b.width / 2, b.top + b.height / 2]; }
    return [document.documentElement.clientWidth - 40, 40];
  }
  /* r59 · the header shows who is signed in: the dashboard's own demo session (localStorage '3dt.session', written by
     /3dtrading-site/dashboard/enter.html after log-in, removed by 退出登录). Same origin, so every page agrees; nothing is sent anywhere. */
  function getSession() {
    try { var s = JSON.parse(localStorage.getItem('3dt.session') || 'null'); return s && typeof s.email === 'string' && s.email ? s : null; }
    catch (e) { return null; }
  }
  function reveal(apply, src) {
    var de = document.documentElement, rm = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm || document.hidden || !document.startViewTransition) { apply(); return Promise.resolve('instant'); }
    if (!document.getElementById('tdt-css')) {
      var c = document.createElement('style'); c.id = 'tdt-css';
      c.textContent = '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}::view-transition-old(root){z-index:1}::view-transition-new(root){z-index:2}html.tdt-vt,html.tdt-vt *{transition:none!important}';
      (document.head || de).appendChild(c);
    }
    var o = revealOrigin(src), x = o[0], y = o[1], w = de.clientWidth, h = innerHeight, r = Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y))) + 2, vt;
    de.classList.add('tdt-vt');
    try { vt = document.startViewTransition(function () { apply(); }); } catch (e) { de.classList.remove('tdt-vt'); apply(); return Promise.resolve('instant'); }
    vt.ready.then(function () {
      var r0 = Math.min(48, Math.round(r * .06));
      de.animate({ clipPath: ['circle(' + r0 + 'px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: REVEAL_MS, easing: REVEAL_EASE, pseudoElement: '::view-transition-new(root)' });
    }, function () {});
    var done = function () { de.classList.remove('tdt-vt'); return 'reveal'; };
    return vt.finished.then(done, done);
  }
  global.TDAccount = {
    standalone: true,
    routes: { entry: base, login: base + sep + 'mode=login', dashboard: '/3dtrading-site/dashboard/app/index.html#/dashboard' },
    getSession: getSession,
    reveal: reveal
  };
})(window);
