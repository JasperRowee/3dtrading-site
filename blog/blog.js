/* r70 白底重写（顶栏同后台、浅色封面）· r67 · 3dtrading 资源中心 · hash router: #/ list · #/c/<cat> filtered list · #/<slug> one post (fixed, shareable link) */
(function () {
  'use strict';
  var D = document, root = D.documentElement, main = D.getElementById('main');
  var POSTS = (window.BLOG_POSTS || []).slice().sort(function (a, b) { return (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (a.date < b.date ? 1 : a.date > b.date ? -1 : 0); });
  var BY = {}; POSTS.forEach(function (p) { BY[p.slug] = p; });
  var T = {
    zh: { hub: '资源', app: '返回后台', login: '登录', site: '官网', foot: '资产留在你本人的币安子账户 · 提现永远关闭',
      eyebrow: '资源中心', h1: '把 3dtrading <em>讲清楚</em>', lede: '策略怎么运作、后台数字怎么算、怎么绑定币安，以及每次更新的说明，都在这里。',
      all: '全部', article: '文章', notice: '公告', guide: '教程', min: ' 分钟', back: '资源中心', copy: '复制链接', copied: '链接已复制', share: '分享',
      copyFail: '复制失败，请手动复制地址栏', more: '继续阅读', nf: '没有找到这篇内容', nfp: '链接可能已更新，回到资源中心看看其他内容。', none: '这一栏暂时还没有内容。', title: '资源中心 · 3dtrading', newest: '最新' },
    en: { hub: 'Resources', app: 'Dashboard', login: 'Log in', site: 'Website', foot: 'Assets stay in your own Binance sub-account · withdrawals always off',
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
  /* r70 · 浅色封面：每篇按 slug 生成，和后台同一套颜色；不用加载图片 */
  function cover(p) {
    var r = rnd(hash(p.slug)), id = 'g' + hash(p.slug).toString(36);
    var K = p.cat === 'notice' ? { bg: '#fbf4e1', bg2: '#f6e7bd', c: '#c99400', d: '#8a6200' } : p.cat === 'guide' ? { bg: '#eef1fd', bg2: '#d9e0fa', c: '#5b72e0', d: '#3a4fb8' } : { bg: '#eaf6f2', bg2: '#cdeee5', c: '#2fdcbc', d: '#087568' };
    var s = '<svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' +
      '<radialGradient id="' + id + 'a" cx="' + (60 + r() * 30) + '%" cy="' + (20 + r() * 30) + '%" r="75%"><stop offset="0" stop-color="' + K.bg2 + '"/><stop offset="1" stop-color="' + K.bg + '"/></radialGradient>' +
      '<pattern id="' + id + 'p" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="' + K.d + '" opacity=".13"/></pattern>' +
      '<filter id="' + id + 's" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0f172a" flood-opacity=".10"/></filter></defs>' +
      '<rect width="400" height="220" fill="url(#' + id + 'a)"/><rect width="400" height="220" fill="url(#' + id + 'p)"/>';
    if (p.cat === 'guide') {          /* 步骤：白色圆点沿虚线一路走到终点 */
      var pts = [], n = 4; for (var k = 0; k < n; k++) pts.push([62 + k * 92, 158 - k * 26 - r() * 14]);
      s += '<path d="M' + pts.map(function (q) { return q.join(','); }).join('L') + '" fill="none" stroke="' + K.c + '" stroke-width="2" stroke-dasharray="4 6" stroke-linecap="round"/>';
      pts.forEach(function (q, k) { var last = k === n - 1, rr = last ? 19 : 14;
        s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + rr + '" fill="' + (last ? K.d : '#fff') + '" filter="url(#' + id + 's)"/>' +
          (last ? '<path d="M' + (q[0] - 7) + ',' + q[1] + ' l5,5 l9,-10" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
                : '<text x="' + q[0] + '" y="' + (q[1] + 4.5) + '" text-anchor="middle" font-family="-apple-system,SF Pro Text,sans-serif" font-weight="700" font-size="13" fill="' + K.d + '">' + (k + 1) + '</text>'); });
    } else if (p.cat === 'notice') {  /* 公告：一圈圈扩散的光环 + 一张白色消息卡 */
      var cx = 285 + r() * 40, cy = 92 + r() * 30;
      for (var j = 4; j >= 1; j--) s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + j * 26 + '" fill="none" stroke="' + K.c + '" stroke-opacity="' + (.5 - j * .09).toFixed(2) + '" stroke-width="1.5"/>';
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="16" fill="' + K.c + '"/><circle cx="' + cx + '" cy="' + cy + '" r="5" fill="#fff"/>';
      s += '<g filter="url(#' + id + 's)"><rect x="34" y="120" width="190" height="62" rx="14" fill="#fff"/></g>' +
        '<rect x="50" y="136" width="30" height="30" rx="9" fill="' + K.bg2 + '"/><path d="M58,148 v6 h4 l7,5 v-16 l-7,5z" fill="' + K.d + '"/>' +
        '<rect x="92" y="139" width="' + (90 + r() * 30).toFixed(0) + '" height="9" rx="4.5" fill="#21201c" opacity=".78"/><rect x="92" y="155" width="' + (60 + r() * 40).toFixed(0) + '" height="7" rx="3.5" fill="#21201c" opacity=".2"/>';
    } else {                          /* 文章：一张白色小图表卡，上升的线和成对的柱 */
      s += '<g filter="url(#' + id + 's)"><rect x="40" y="34" width="320" height="152" rx="16" fill="#fff"/></g>';
      var y = 150, d = 'M60,' + y, a = d, x;
      for (x = 76; x <= 340; x += 16) { y = Math.max(62, Math.min(150, y - 4 + (r() - .45) * 22)); d += ' L' + x + ',' + y.toFixed(1); }
      a = d + ' L340,170 L60,170 Z';
      for (x = 64; x < 340; x += 22) { var h1 = 6 + r() * 16; s += '<rect x="' + x + '" y="' + (170 - h1).toFixed(1) + '" width="5" height="' + h1.toFixed(1) + '" rx="1.5" fill="#0b8a5a" opacity=".22"/><rect x="' + (x + 7) + '" y="' + (170 - h1).toFixed(1) + '" width="5" height="' + h1.toFixed(1) + '" rx="1.5" fill="#d6334a" opacity=".18"/>'; }
      s += '<linearGradient id="' + id + 'f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + K.c + '" stop-opacity=".28"/><stop offset="1" stop-color="' + K.c + '" stop-opacity="0"/></linearGradient>';
      s += '<path d="' + a + '" fill="url(#' + id + 'f)"/><path d="' + d + '" fill="none" stroke="' + K.d + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';
      s += '<rect x="60" y="48" width="56" height="8" rx="4" fill="#21201c" opacity=".7"/><rect x="60" y="62" width="34" height="6" rx="3" fill="#21201c" opacity=".2"/>';
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
    var cnt = [['', 'all'], ['article', 'article'], ['notice', 'notice'], ['guide', 'guide']].map(function (a) {
      return '<a href="#/' + (a[0] ? 'c/' + a[0] : '') + '"' + ((cat || '') === a[0] ? ' aria-current="page"' : '') + '>' + t(a[1]) + '<b>' + n(a[0]) + '</b></a>';
    }).join('');
    var h = '<section class="hero fade"><div><div class="eyebrow">' + t('eyebrow') + '</div><h1>' + t('h1') + '</h1><p>' + t('lede') + '</p></div><nav class="cnt" aria-label="' + t('hub') + '">' + cnt + '</nav></section>';
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
    var cur = !h ? '' : m ? m[1] : null;   /* r70 · 顶栏 / 底栏标签跟着当前栏目 */
    D.querySelectorAll('#fnav .tab').forEach(function (a) { if (cur !== null && a.getAttribute('data-c') === cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    ink();
    var b = main.querySelector('[data-back]'); if (b && lastList) b.setAttribute('href', lastList);
    if (route.done) { scrollTo(0, 0); main.focus({ preventScroll: true }); }
    route.done = true;
  }
  function staticText() {
    D.querySelectorAll('[data-i]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i')); });
    syncAccountLinks();
    root.lang = L() === 'en' ? 'en' : 'zh-CN';
  }

  function syncAccountLinks() {
    var session;
    try { session = JSON.parse(localStorage.getItem('3dt.session')); } catch (e) {}
    var signedIn = !!(session && session.email);
    D.querySelectorAll('[data-account-link]').forEach(function (a) {
      a.href = signedIn ? '../dashboard/app/' : '../login/';
      a.textContent = t(signedIn ? 'app' : 'login');
    });
  }
  addEventListener('pageshow', syncAccountLinks);
  addEventListener('storage', function (e) {
    if (e.key === '3dt.session' || e.key === null) syncAccountLinks();
  });

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

  /* r74 · 手机底栏：选中项下面一块滑动底色，手指按住左右划时底色跟着手走，松手就进那一栏 */
  var inkEl = D.getElementById('fnInk'), fnav = D.getElementById('fnav'), inkCur = null;
  function inkTo(a) {
    if (!inkEl) return;
    var previous = fnav.querySelector('.ink-target');
    if (previous) previous.classList.remove('ink-target');
    if (a) a.classList.add('ink-target');
    if (!a || !a.offsetWidth) { inkEl.style.opacity = 0; return; }
    inkEl.style.opacity = 1; inkEl.style.left = a.offsetLeft + 'px'; inkEl.style.top = a.offsetTop + 'px';
    inkEl.style.width = a.offsetWidth + 'px'; inkEl.style.height = a.offsetHeight + 'px';
  }
  function ink() {
    var a = D.querySelector('#fnav .tab[aria-current="page"]');
    var first = inkCur === null; inkCur = a || false;
    if (first && inkEl) { inkEl.style.transition = 'none'; inkTo(a); void inkEl.offsetWidth; inkEl.style.transition = ''; } else inkTo(a);
  }
  if (fnav) {
    var dn = null, last = null, swallow = false;
    fnav.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return; var a = e.target.closest('.tab'); if (!a) return;
      dn = a; last = a; fnav.classList.add('drag'); inkTo(a);
    });
    fnav.addEventListener('pointermove', function (e) {
      if (!dn) return; var el = D.elementFromPoint(e.clientX, e.clientY), a = el && el.closest && el.closest('#fnav .tab');
      if (a && a !== last) { last = a; inkTo(a); }
    });
    function up() {
      if (!dn) return; var a = last, moved = a !== dn; dn = null; fnav.classList.remove('drag');
      if (moved) { swallow = true; setTimeout(function () { swallow = false; a.click(); }, 0); }
    }
    fnav.addEventListener('pointerup', up);
    fnav.addEventListener('pointercancel', function () { dn = null; fnav.classList.remove('drag'); ink(); });
    fnav.addEventListener('click', function (e) { if (swallow && e.isTrusted) { e.preventDefault(); e.stopPropagation(); } }, true);
    var rzT; addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(ink, 80); });
  }
  addEventListener('hashchange', route);
  addEventListener('storage', function (e) { if (e.key === 'r49site.lang' && (e.newValue === 'en' ? 'en' : 'zh') !== L()) { root.dataset.lang = e.newValue === 'en' ? 'en' : 'zh'; staticText(); route.done = false; route(); route.done = true; } });
  staticText(); route();

  /* r70 · 滚动后顶栏阴影加深（和后台一样） */
  function sc() { D.body.classList.toggle('scrolled', scrollY > 4); }
  addEventListener('scroll', sc, { passive: true }); sc();
  /* r70 · 从后台「我的 → 资源」进来时，左上角回后台 */
  try { if (/[?&]from=app\b/.test(location.search)) sessionStorage.setItem('3dt.blog.from', 'app'); } catch (e) {}
  var fromApp = false; try { fromApp = sessionStorage.getItem('3dt.blog.from') === 'app'; } catch (e) {}
  if (fromApp) { var sd = D.getElementById('side'); sd.setAttribute('href', '../dashboard/app/'); sd.querySelector('span').setAttribute('data-i', 'app'); staticText(); }
})();
