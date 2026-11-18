/* r67 · 3dtrading 资源中心 · hash router: #/ list · #/c/<cat> filtered list · #/<slug> one post (fixed, shareable link) */
(function () {
  'use strict';
  var D = document, root = D.documentElement, main = D.getElementById('main');
  var POSTS = (window.BLOG_POSTS || []).slice().sort(function (a, b) { return (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (a.date < b.date ? 1 : a.date > b.date ? -1 : 0); });
  var BY = {}; POSTS.forEach(function (p) { BY[p.slug] = p; });
  var T = {
    zh: { hub: '资源中心', login: '登录', site: '官网', foot: '资产留在你本人的币安子账户 · 提现永远关闭',
      eyebrow: 'Resources', h1: '把 3dtrading <em>讲清楚</em>', lede: '策略怎么运作、后台数字怎么算、怎么绑定币安，以及每次更新的说明，都在这里。',
      all: '全部', article: '文章', notice: '公告', guide: '教程', min: ' 分钟', back: '资源中心', copy: '复制链接', copied: '链接已复制', share: '分享',
      copyFail: '复制失败，请手动复制地址栏', more: '继续阅读', nf: '没有找到这篇内容', nfp: '链接可能已更新，回到资源中心看看其他内容。', none: '这一栏暂时还没有内容。', title: '资源中心 · 3dtrading', newest: '最新' },
    en: { hub: 'Resources', login: 'Log in', site: 'Website', foot: 'Assets stay in your own Binance sub-account · withdrawals always off',
      eyebrow: 'Resources', h1: '3dtrading, <em>explained</em>', lede: 'How the strategy works, how the dashboard counts, how to bind Binance, and what changed in each update.',
      all: 'All', article: 'Articles', notice: 'Notices', guide: 'Guides', min: ' min read', back: 'Resources', copy: 'Copy link', copied: 'Link copied', share: 'Share',
      copyFail: 'Copy failed. Please copy the address bar', more: 'Keep reading', nf: 'Post not found', nfp: 'The link may have changed. Head back to the Resource Center.', none: 'Nothing here yet.', title: 'Resources · 3dtrading', newest: 'Latest' }
  };
  var CAT1 = { zh: { article: '文章', notice: '公告', guide: '教程' }, en: { article: 'Article', notice: 'Notice', guide: 'Guide' } };
  function L() { return root.dataset.lang === 'en' ? 'en' : 'zh'; }
  function t(k) { return T[L()][k]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtDate(d) {
    var p = d.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
    return L() === 'en' ? dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : (+p[0]) + ' 年 ' + (+p[1]) + ' 月 ' + (+p[2]) + ' 日';
  }
  function meta(p) { return '<div class="meta"><span>' + fmtDate(p.date) + '</span><i></i><span>' + p.min + t('min') + '</span></div>'; }
  function chip(p) { return '<span class="chip ' + p.cat + '">' + (p.pin ? '<span class="pin"></span>' : '') + CAT1[L()][p.cat] + '</span>'; }

  /* covers: drawn per post from its slug, in the site's palette; no images to load */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rnd(seed) { var s = seed || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 10000) / 10000; }; }
  function cover(p) {
    var r = rnd(hash(p.slug)), c = p.cat === 'notice' ? '#f0b90b' : p.cat === 'guide' ? '#8fa8ff' : '#2fdcbc', id = 'g' + hash(p.slug).toString(36);
    var s = '<svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' +
      '<radialGradient id="' + id + 'a" cx="' + (55 + r() * 30) + '%" cy="' + (30 + r() * 40) + '%" r="70%"><stop offset="0" stop-color="' + c + '" stop-opacity=".32"/><stop offset=".55" stop-color="' + c + '" stop-opacity=".06"/><stop offset="1" stop-color="#06090b" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + 'l" x1="0" x2="1"><stop offset="0" stop-color="' + c + '" stop-opacity="0"/><stop offset=".6" stop-color="' + c + '" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient></defs>' +
      '<rect width="400" height="220" fill="#080d10"/><rect width="400" height="220" fill="url(#' + id + 'a)"/>';
    for (var i = 0; i < 46; i++) s += '<circle cx="' + (r() * 400).toFixed(1) + '" cy="' + (r() * 220).toFixed(1) + '" r="' + (r() * .9 + .25).toFixed(2) + '" fill="#fff" opacity="' + (r() * .55 + .1).toFixed(2) + '"/>';
    if (p.cat === 'guide') {          /* steps: a dotted path through numbered nodes */
      var pts = [], n = 4; for (var k = 0; k < n; k++) pts.push([60 + k * 95, 150 - k * 22 - r() * 20]);
      s += '<path d="M' + pts.map(function (q) { return q.join(','); }).join('L') + '" fill="none" stroke="' + c + '" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="3 5"/>';
      pts.forEach(function (q, k) { s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + (k === n - 1 ? 13 : 9) + '" fill="#06090b" stroke="' + c + '" stroke-width="1.5" stroke-opacity="' + (k === n - 1 ? 1 : .55) + '"/><text x="' + q[0] + '" y="' + (q[1] + 4) + '" text-anchor="middle" font-family="SF Mono,Menlo,monospace" font-size="11" fill="' + c + '">' + (k + 1) + '</text>'; });
    } else if (p.cat === 'notice') {  /* rings around a bright point */
      var cx = 270 + r() * 60, cy = 100 + r() * 30;
      for (var j = 1; j <= 4; j++) s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + j * 28 + '" fill="none" stroke="' + c + '" stroke-opacity="' + (.42 - j * .08) + '"/>';
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="#fff"/><circle cx="' + cx + '" cy="' + cy + '" r="14" fill="' + c + '" opacity=".25"/>';
    } else {                          /* a calm rising line with paired bars under it */
      var y = 160, d = 'M0,' + y, x;
      for (x = 20; x <= 400; x += 20) { y = Math.max(40, Math.min(185, y - 5 + (r() - .45) * 26)); d += ' L' + x + ',' + y.toFixed(1); }
      for (x = 24; x < 400; x += 32) { var h1 = 10 + r() * 26; s += '<rect x="' + x + '" y="' + (212 - h1) + '" width="5" height="' + h1 + '" rx="1" fill="#0ecb81" opacity=".28"/><rect x="' + (x + 8) + '" y="' + (212 - h1) + '" width="5" height="' + h1 + '" rx="1" fill="#f6465d" opacity=".24"/>'; }
      s += '<path d="' + d + '" fill="none" stroke="url(#' + id + 'l)" stroke-width="2"/>';
    }
    return '<div class="art">' + s + '</svg></div>';
  }

  function card(p) {
    var x = p[L()];
    return '<a class="card" href="#/' + p.slug + '">' + cover(p) + '<div class="tx">' + chip(p) + '<h3>' + esc(x.t) + '</h3><p>' + esc(x.d) + '</p>' + meta(p) + '</div></a>';
  }
  function list(cat) {
    var ps = cat ? POSTS.filter(function (p) { return p.cat === cat; }) : POSTS;
    var n = function (c) { return POSTS.filter(function (p) { return !c || p.cat === c; }).length; };
    var tabs = [['', 'all'], ['article', 'article'], ['notice', 'notice'], ['guide', 'guide']].map(function (a) {
      return '<a class="tab" role="tab" href="#/' + (a[0] ? 'c/' + a[0] : '') + '" aria-selected="' + ((cat || '') === a[0]) + '">' + t(a[1]) + '<b>' + n(a[0]) + '</b></a>';
    }).join('');
    var h = '<section class="hero fade"><div class="eyebrow">' + t('eyebrow') + '</div><h1>' + t('h1') + '</h1><p>' + t('lede') + '</p></section><nav class="tabs" role="tablist">' + tabs + '</nav>';
    if (!ps.length) return h + '<p class="empty">' + t('none') + '</p>';
    var f = ps[0], x = f[L()];
    h += '<a class="feat fade" href="#/' + f.slug + '">' + cover(f) + '<div class="tx">' + chip(f) + '<h2>' + esc(x.t) + '</h2><p>' + esc(x.d) + '</p>' + meta(f) + '</div></a>';
    h += '<div class="grid fade">' + ps.slice(1).map(card).join('') + '</div>';
    return h;
  }
  var IC = {
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13"/><path d="M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
  };
  function post(p) {
    var x = p[L()];
    var rel = POSTS.filter(function (q) { return q !== p && q.cat === p.cat; }).concat(POSTS.filter(function (q) { return q !== p && q.cat !== p.cat; })).slice(0, 2);
    return '<article class="post fade"><a class="back" href="#/c/' + p.cat + '" data-back>' + IC.back + t('back') + '</a>' +
      '<header>' + chip(p) + '<h1>' + esc(x.t) + '</h1><p class="lede">' + esc(x.d) + '</p>' + meta(p) + '</header>' +
      '<div class="cover">' + cover(p).replace('class="art"', 'class="art" style="height:100%"') + '</div>' +
      '<div class="body">' + x.b + '</div>' +
      '<div class="share"><button class="btn pri" type="button" data-copy>' + IC.link + t('copy') + '</button>' +
      (navigator.share ? '<button class="btn" type="button" data-share>' + IC.share + t('share') + '</button>' : '') + '</div>' +
      '<section class="more"><h4>' + t('more') + '</h4><div class="grid">' + rel.map(card).join('') + '</div></section></article>';
  }
  function permalink(slug) { return location.href.split('#')[0].split('?')[0] + '#/' + slug; }

  var lastList = null;
  function route() {
    var h = location.hash.replace(/^#\/?/, ''), q = null;
    try { q = new URLSearchParams(location.search).get('p'); } catch (e) {}
    if (!h && q && BY[q]) { history.replaceState(null, '', location.pathname + '#/' + q); h = q; }
    var m = /^c\/(article|notice|guide)$/.exec(h), html, title = t('title');
    if (!h || m) { html = list(m ? m[1] : ''); lastList = '#/' + h; }
    else if (BY[h]) { html = post(BY[h]); title = BY[h][L()].t + ' · 3dtrading'; }
    else html = '<div class="notfound fade"><h1>' + t('nf') + '</h1><p>' + t('nfp') + '</p><a class="btn pri" href="#/">' + t('hub') + '</a></div>';
    main.innerHTML = html; D.title = title;
    var b = main.querySelector('[data-back]'); if (b && lastList) b.setAttribute('href', lastList);
    if (route.done) { scrollTo(0, 0); main.focus({ preventScroll: true }); }
    route.done = true;
  }
  function staticText() {
    D.querySelectorAll('[data-i]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i')); });
    root.lang = L() === 'en' ? 'en' : 'zh-CN';
  }

  var toastT;
  function toast(s) { var e = D.getElementById('toast'); e.textContent = s; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { e.classList.remove('on'); }, 1800); }
  function copy(s) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(s);
    return new Promise(function (ok, no) {
      var a = D.createElement('textarea'); a.value = s; a.setAttribute('readonly', ''); a.style.cssText = 'position:fixed;opacity:0'; D.body.appendChild(a); a.select();
      try { D.execCommand('copy') ? ok() : no(); } catch (e) { no(e); } a.remove();
    });
  }
  main.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]'), s = e.target.closest('[data-share]'), slug = location.hash.replace(/^#\/?/, '');
    if (c) copy(permalink(slug)).then(function () { toast(t('copied')); }, function () { toast(t('copyFail')); });
    if (s && BY[slug]) navigator.share({ title: BY[slug][L()].t, text: BY[slug][L()].d, url: permalink(slug) }).catch(function () {});
  });
  D.getElementById('lang').addEventListener('click', function () {
    var n = L() === 'en' ? 'zh' : 'en'; root.dataset.lang = n;
    try { localStorage.setItem('r49site.lang', n); localStorage.setItem('3dt.r49login.lang', n); } catch (e) {}
    staticText(); route.done = false; route(); route.done = true;
  });
  addEventListener('hashchange', route);
  addEventListener('storage', function (e) { if (e.key === 'r49site.lang' && (e.newValue === 'en' ? 'en' : 'zh') !== L()) { root.dataset.lang = e.newValue === 'en' ? 'en' : 'zh'; staticText(); route.done = false; route(); route.done = true; } });
  staticText(); route();

  /* a quiet star field like the site's deep-space backdrop; drawn once per resize, no animation loop */
  var cv = D.getElementById('sky'), cx = cv.getContext('2d');
  function sky() {
    var w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2), R = rnd(7);
    cv.width = w * dpr; cv.height = h * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var g = cx.createRadialGradient(w * .82, h * .08, 0, w * .82, h * .08, Math.max(w, h) * .7);
    g.addColorStop(0, 'rgba(47,220,188,.10)'); g.addColorStop(.45, 'rgba(47,120,160,.04)'); g.addColorStop(1, 'rgba(6,9,11,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, w, h);
    var g2 = cx.createRadialGradient(w * .08, h * .9, 0, w * .08, h * .9, Math.max(w, h) * .5);
    g2.addColorStop(0, 'rgba(110,90,200,.07)'); g2.addColorStop(1, 'rgba(6,9,11,0)'); cx.fillStyle = g2; cx.fillRect(0, 0, w, h);
    var n = Math.round(w * h / 5200);
    for (var i = 0; i < n; i++) { cx.globalAlpha = R() * .5 + .08; cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(R() * w, R() * h, R() * .8 + .2, 0, 6.283); cx.fill(); }
    cx.globalAlpha = 1;
  }
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(sky, 120); }); sky();
})();
