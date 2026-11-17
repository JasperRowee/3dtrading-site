/* 3dtrading · shared account + language module (TDAccount)
 *
 * One file both the website and the dashboard load, so sign-in state, the chosen language and the
 * bound Binance sub-accounts stay the same on every page of one origin.
 *
 * DEMO ONLY: there is no auth or binding backend yet. Everything lives in this browser's
 * localStorage. Passwords, API keys and Secret keys are NEVER written to storage, logs or the URL.
 *
 * Public API (window.TDAccount) — see /account/README.md for the integration contract.
 */
(function (global) {
  'use strict';
  if (global.TDAccount) return;

  /* r42: two theme groups. The website and the log-in / sign-up page share '3dt.theme.site' (default night): the page a
     visitor signs in on looks like the website they came from. The dashboard and the pages behind it (connect, bind,
     onboard) share '3dt.theme.app' (default pure-white day). A page names its group with <html data-theme-key="...">;
     without one, the dashboard group is assumed, except on the website itself, which runs its own switch. */
  var meTag = document.currentScript, meDs = (meTag && meTag.dataset) || {};
  var THEME_KEY = document.documentElement.getAttribute('data-theme-key') || (meDs.site && !meDs.app ? '' : '3dt.theme.app');
  var THEME_DEF = THEME_KEY === '3dt.theme.site' ? 'night' : 'day';
  /* r55: the day / night switch is retired site-wide. Each page group keeps its fixed default (website / sign-in: night;
     dashboard: pure-white day); old saved choices are cleared and never read, the system theme is ignored. */
  function themeKey() { return THEME_DEF; }
  try{['3dt.theme','3dt.theme.app','3dt.theme.site','r49site.theme','3dt49bn.theme','3dt.r49login.theme'].forEach(function(k){localStorage.removeItem(k)})}catch(e){}

  /* r42 · day / night "dye": the new palette spreads out as a circle from the point that was clicked, over the whole
     page (3D scene, background, cards, dialogs), instead of every colour fading at once. View Transitions API: the old
     page is a still picture, the new one is live underneath and is revealed by a growing clip. Reduced motion, a hidden
     tab or a browser without the API: the switch is instant. Nothing here touches navigation. */
  /* r44: 700 → 480 ms and a curve without the slow start / slow tail of r43's ease-in-out (.62,0,.24,1): the circle
     starts at a visible radius, so the click answers on the first frame, runs near-linear through the middle and lands
     without a pause. Colours change once, inside the transition (html.tdt-vt kills every CSS transition until it ends). */
  var REVEAL_MS = 480, REVEAL_EASE = 'cubic-bezier(.3,.45,.6,.95)';
  function revealOrigin(src) {
    if (src && typeof src.clientX === 'number' && (src.clientX || src.clientY)) return [src.clientX, src.clientY];
    var el = src && src.getBoundingClientRect ? src : src && src.currentTarget && src.currentTarget.getBoundingClientRect ? src.currentTarget : null;
    if (el) { var b = el.getBoundingClientRect(); if (b.width) return [b.left + b.width / 2, b.top + b.height / 2]; }
    return [document.documentElement.clientWidth - 40, 40];
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
        { duration: global.TD_REVEAL_MS || REVEAL_MS, easing: REVEAL_EASE, pseudoElement: '::view-transition-new(root)' });
    }, function () {});
    var done = function () { de.classList.remove('tdt-vt'); return 'reveal'; };
    return vt.finished.then(done, done);
  }
  /* switch this page's group (account pages and connect use it; the website and the dashboard call reveal() with their own switch) */
  function setTheme(v, src) {
    return; /* r55: no switching */
    if (!THEME_KEY) return;
    v = v === 'night' ? 'night' : 'day';
    try { localStorage.setItem(THEME_KEY, v); } catch (e) {}
    var de = document.documentElement; if (de.getAttribute('data-theme') === v) return;
    reveal(function () { de.setAttribute('data-theme', v); try { global.dispatchEvent(new CustomEvent('td:theme', { detail: v })); } catch (x) {} }, src);
  }
  /* round day/night button with the website's moon / sun, for pages that have no other switch */
  var MOON = '<svg class="m" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  var SUN = '<svg class="s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
  function mountThemeToggle(btn) {
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn); return null; /* r55: no day / night button */
    if (!btn || !THEME_KEY) return null;
    ensureCss(); btn.type = 'button'; btn.classList.add('tdt-tm'); btn.innerHTML = MOON + SUN;
    function lab() { var day = document.documentElement.dataset.theme === 'day'; btn.setAttribute('aria-label', t(day ? 'theme.toNight' : 'theme.toDay')); btn.title = btn.getAttribute('aria-label'); btn.setAttribute('aria-pressed', String(!day)); }
    btn.addEventListener('click', function (e) { setTheme(document.documentElement.dataset.theme === 'day' ? 'night' : 'day', e); });
    global.addEventListener('td:theme', lab); global.addEventListener('td:lang', lab); lab();
    return { render: lab };
  }

  /* arriving from the website's "going in" move: the page opens out of the same black, with nothing to click while it does */
  try {
    var dt = +sessionStorage.getItem('td-door');
    if (dt) {
      sessionStorage.removeItem('td-door');
      if (Date.now() - dt < 5000) {
        var rm = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, st = document.createElement('style');
        st.textContent = 'html.td-arrive::after{content:"";position:fixed;inset:0;z-index:2147483647;background:' + ((function () { try { return localStorage.getItem('3dt.theme.site') === 'day'; } catch (e) { return false; } })() ? '#ffffff' : '#06090b') + ';pointer-events:none;animation:tdArrive ' + (rm ? '.2s' : '.6s .08s') + ' cubic-bezier(.3,0,.2,1) forwards}@keyframes tdArrive{to{opacity:0;visibility:hidden}}';
        (document.head || document.documentElement).appendChild(st); document.documentElement.classList.add('td-arrive');
        setTimeout(function () { document.documentElement.classList.remove('td-arrive'); }, 1000);
      }
    }
  } catch (e) {}

  var VERSION = '1.5.0';
  var K = { lang: '3dt.lang', session: '3dt.session', returning: '3dt.returning', users: '3dt.demoUsers', accts: '3dt.accounts:' };
  var EV = { lang: 'td:lang', session: 'td:session', accounts: 'td:accounts', theme: 'td:theme' };
  /* another tab of the same group switched day/night: follow it (dyed in from this page's own switch when the tab is visible, instant when hidden) */
  global.addEventListener('storage', function (e) {
    return; /* r55: other tabs can no longer change the theme */
    if (!THEME_KEY || e.key !== THEME_KEY) return;
    var root = document.documentElement, v = themeKey();
    if (root.hasAttribute('data-theme') && root.getAttribute('data-theme') !== v) {
      reveal(function () { root.setAttribute('data-theme', v); try { global.dispatchEvent(new CustomEvent(EV.theme, { detail: v })); } catch (x) {} }, document.querySelector('.tdt-tm,[data-theme-set="' + v + '"]'));
    } else { try { global.dispatchEvent(new CustomEvent(EV.theme, { detail: v })); } catch (x) {} }
  });

  /* ---------- routes: one origin, configurable from the script tag or window.TD_ROUTES ---------- */
  var me = document.currentScript;
  var base = me && me.src ? me.src.replace(/[^/]*(\?.*)?$/, '') : new URL('/account/', location.href).href;
  var ds = (me && me.dataset) || {};
  /* relative to this script's folder, so the pages work under any sub-path (e.g. GitHub Pages /<repo>/) */
  var abs = function (v, rel) { try { return new URL(v || rel, v ? location.href : base).href; } catch (e) { return v || rel; } };
  var ROUTES = {
    site: abs(ds.site, '../site/index.html'),
    app: abs(ds.app, '../app/index.html#/dashboard'),
    me: abs(ds.me, '../app/index.html#/me'),
    auth: base + 'auth.html',
    bind: base + 'bind.html',
    connect: base + 'connect.html'
  };
  // aliases the website already reads (signup / login / bind / dashboard)
  ROUTES.signup = ROUTES.auth + '?mode=register';
  ROUTES.login = ROUTES.auth + '?mode=login';
  ROUTES.entry = ROUTES.auth; // r42 · generic "Log in / Sign up": no mode, the page picks (returning → log in, new → sign up)
  ROUTES.dashboard = ROUTES.app;
  /* The website's tag sets data-site but no data-app. Remember where that page really lives on this origin, so
     "back to website" from the dashboard or account pages returns there even when a preview serves the site
     folder at the root (where /3dtrading-site/site/index.html does not exist). Same-origin paths only. */
  try {
    var SITE_K = '3dt.siteUrl';
    if (ds.site && !ds.app) {
      var su = new URL(ds.site, location.href);
      if (su.origin === location.origin) localStorage.setItem(SITE_K, su.pathname);
    }
    var sp = localStorage.getItem(SITE_K);
    if (sp && /^\/(?!\/)[^\s<>"']*$/.test(sp)) ROUTES.site = sp;
  } catch (e) {}
  if (global.TD_ROUTES) for (var r in global.TD_ROUTES) ROUTES[r] = global.TD_ROUTES[r];

  /* ---------- storage (never throws; private mode just loses persistence) ---------- */
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function getJSON(k) { try { return JSON.parse(get(k) || 'null'); } catch (e) { return null; } }
  function setJSON(k, v) { set(k, JSON.stringify(v)); }
  function emit(name, detail) {
    try { global.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) {}
    if (name === EV.accounts) emit('td:account', detail);   // the website listens for td:account
  }

  /* ---------- language ---------- */
  var LANGS = ['zh', 'en'];
  function lang() {
    var s = get(K.lang);
    return LANGS.indexOf(s) >= 0 ? s : 'zh';
  }
  function applyHtmlLang(l) { document.documentElement.lang = l === 'en' ? 'en' : 'zh-CN'; }
  var syncing = false;
  function setLang(l) {
    if (LANGS.indexOf(l) < 0 || l === lang()) return;
    set(K.lang, l);
    applyHtmlLang(l);
    apply(document);
    emit(EV.lang, { lang: l });
    syncHost(l);
  }
  /* host language engines: the website emits/listens '3dt:lang' (same key 3dt.lang);
     the dashboard engine is window.I18N { lang, set(l) } and emits 'langchange'. */
  function syncHost(l) {
    if (syncing) return; syncing = true;
    try {
      emit('3dt:lang', { lang: l, from: 'td-account' });
      if (global.I18N && typeof global.I18N.set === 'function' && global.I18N.lang !== l) global.I18N.set(l);
    } finally { syncing = false; }
  }
  function fromHost(e) {
    var l = e && e.detail && e.detail.lang;
    if (syncing || (e.detail && e.detail.from === 'td-account') || LANGS.indexOf(l) < 0) return;
    if (l !== lang()) { set(K.lang, l); applyHtmlLang(l); apply(document); emit(EV.lang, { lang: l }); }
  }
  global.addEventListener('3dt:lang', fromHost);
  global.addEventListener('langchange', fromHost);
  (function fromUrl() {
    try { var q = new URLSearchParams(location.search).get('lang'); if (LANGS.indexOf(q) >= 0) set(K.lang, q); } catch (e) {}
  })();
  applyHtmlLang(lang());
  // a host engine that kept its own stored language is brought in line with the shared one
  function alignHost() { if (global.I18N && typeof global.I18N.set === 'function' && global.I18N.lang !== lang()) { syncing = true; try { global.I18N.set(lang()); } finally { syncing = false; } } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', alignHost); else setTimeout(alignHost, 0);

  /* ---------- i18n: pages register their own dictionaries; module keys live under acct.* lang.* nav.* demo.* ---------- */
  var DICT = { zh: {}, en: {} };
  function add(d) { LANGS.forEach(function (l) { var s = d && d[l]; if (s) for (var k in s) DICT[l][k] = s[k]; }); }
  function has(key) { return DICT.zh[key] != null || DICT.en[key] != null; }
  function t(key, vars) {
    var l = lang(), s = DICT[l][key];
    if (s == null) s = DICT.zh[key];
    if (s == null) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, n) { return vars[n] != null ? vars[n] : m; });
    return s;
  }
  /* data-i18n="key" → textContent · data-i18n-html="key" → innerHTML (trusted dictionary only)
     data-i18n-attr="aria-label:key;placeholder:key2" → attributes */
  function apply(root) {
    root = root || document;
    var q = function (s) { return root.querySelectorAll ? root.querySelectorAll(s) : []; };
    // keys this module doesn't know are left alone, so host pages keep their own copy
    Array.prototype.forEach.call(q('[data-i18n]'), function (el) { var k = el.getAttribute('data-i18n'); if (has(k)) el.textContent = t(k); });
    Array.prototype.forEach.call(q('[data-i18n-html]'), function (el) { var k = el.getAttribute('data-i18n-html'); if (has(k)) el.innerHTML = t(k); });
    Array.prototype.forEach.call(q('[data-i18n-attr]'), function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (p) {
        var i = p.indexOf(':'), k = p.slice(i + 1).trim(); if (i > 0 && has(k)) el.setAttribute(p.slice(0, i).trim(), t(k));
      });
    });
  }

  add({
    zh: {
      'lang.label': '语言', 'lang.zh': '中文', 'lang.en': 'EN', 'theme.toNight': '切换到夜间', 'theme.toDay': '切换到日间',
      'acct.login': '登录', 'acct.register': '注册', 'acct.logout': '退出登录', 'acct.guest': '未登录',
      'acct.guestHint': '登录后可绑定币安子账户、查看策略运行情况。',
      'acct.menu': '账户菜单', 'acct.demoUser': '本机账号', 'acct.defaultUser': '3dtrading 用户',
      'acct.binance': '币安子账户', 'acct.all': '全部账户', 'acct.allSub': '合并查看 {n} 个子账户',
      'acct.none': '还没有绑定币安子账户', 'acct.bindNew': '绑定新的币安子账户', 'acct.bindFirst': '去绑定第一个子账户',
      'acct.toApp': '进入控制台', 'acct.toSite': '回到官网', 'acct.me': '我的', 'acct.profile': '个人资料', 'acct.settings': '设置', 'acct.settingsSub': '个性化、单位、隐私、通知等',
      'acct.st.awaiting_key': '等待贴回 API Key', 'acct.st.checking': '接入测试中', 'acct.st.verified': '测试通过 · 演示', 'acct.st.failed': '测试未通过',
      'acct.st.observing': '试运行（只观察）· 演示', 'acct.st.running': '运行中 · 演示', 'acct.st.halted': '已停机', 'acct.st.unbound': '已解绑', 'acct.st.unknown': '处理中',
      'acct.demo.name': '示例账户', 'acct.demo.sub': '示例数据 · 未连接币安', 'acct.demo.st': '示例数据 · 未连接币安',
      'demo.note': '账号与子账户只保存在本机浏览器，未连接币安，也没有真实校验。',
      'demo.badge': '示例数据'
    },
    en: {
      'lang.label': 'Language', 'lang.zh': '中文', 'lang.en': 'EN', 'theme.toNight': 'Switch to night', 'theme.toDay': 'Switch to day',
      'acct.login': 'Log in', 'acct.register': 'Sign up', 'acct.logout': 'Log out', 'acct.guest': 'Not signed in',
      'acct.guestHint': 'Sign in to link Binance sub-accounts and follow your strategy.',
      'acct.menu': 'Account menu', 'acct.demoUser': 'Local account', 'acct.defaultUser': '3dtrading user',
      'acct.binance': 'Binance sub-accounts', 'acct.all': 'All sub-accounts', 'acct.allSub': 'Combined · {n} total',
      'acct.none': 'No Binance sub-account linked yet', 'acct.bindNew': 'Link a Binance sub-account', 'acct.bindFirst': 'Link your first sub-account',
      'acct.toApp': 'Open dashboard', 'acct.toSite': 'Back to website', 'acct.me': 'Me', 'acct.profile': 'Profile', 'acct.settings': 'Settings', 'acct.settingsSub': 'Appearance, units, privacy, notifications…',
      'acct.st.awaiting_key': 'Waiting for your API Key', 'acct.st.checking': 'Connection test running', 'acct.st.verified': 'Test passed · demo', 'acct.st.failed': 'Test failed',
      'acct.st.observing': 'Trial run (observe only) · demo', 'acct.st.running': 'Running · demo', 'acct.st.halted': 'Halted', 'acct.st.unbound': 'Unbound', 'acct.st.unknown': 'Processing',
      'acct.demo.name': 'Sample account', 'acct.demo.sub': 'Sample data · not connected to Binance', 'acct.demo.st': 'Sample data · not connected to Binance',
      'demo.note': 'Your account and sub-accounts stay in this browser only. Binance is not connected and nothing is actually verified.',
      'demo.badge': 'Sample data'
    }
  });

  /* ---------- session (demo: no password is checked or stored) ---------- */
  function normEmail(e) { return String(e || '').trim().toLowerCase(); }
  function session() { var s = getJSON(K.session); return s && s.email ? s : null; }
  function users() { var u = getJSON(K.users); return Array.isArray(u) ? u : []; }
  function startSession(u) {
    var s = { v: 1, demo: true, email: u.email, name: u.name || u.email.split('@')[0], since: Date.now() };
    setJSON(K.session, s); set(K.returning, '1');
    emit(EV.session, { session: s });
    emit(EV.accounts, accounts());
    return s;
  }
  function register(o) {
    var email = normEmail(o && o.email), list = users();
    if (!email) return { ok: false, code: 'email' };
    if (list.some(function (u) { return u.email === email; })) return { ok: false, code: 'exists' };
    var u = { email: email, name: String((o && o.name) || '').trim().slice(0, 40) || email.split('@')[0], at: Date.now() };
    list.push(u); setJSON(K.users, list);
    return { ok: true, session: startSession(u) };
  }
  function login(o) {
    var email = normEmail(o && o.email), u = users().filter(function (x) { return x.email === email; })[0];
    if (!u) return { ok: false, code: 'not_found' };
    return { ok: true, session: startSession(u) };
  }
  /* r42 · someone who has signed in or out on this browser before is "returning": the generic entry (auth.html with no
     ?mode) opens on Log in for them and on Sign up for everyone else. Only the flag '1' is kept: no email, no password. */
  function returning() { return get(K.returning) === '1'; }
  function logout(opt) {
    del(K.session); set(K.returning, '1');
    emit(EV.session, { session: null });
    emit(EV.accounts, accounts());
    if (!opt || opt.redirect !== false) location.href = (opt && opt.to) || ROUTES.site;
  }
  function requireUser(next) {
    if (session()) return true;
    location.replace(authUrl('login', next || location.href));
    return false;
  }
  function authUrl(mode, next) {
    return ROUTES.auth + '?mode=' + (mode === 'register' ? 'register' : 'login') + (next ? '&next=' + encodeURIComponent(next) : '');
  }

  /* ---------- bound Binance sub-accounts (per user; metadata only, no keys) ---------- */
  var ALLOWED = ['id', 'name', 'uid', 'email', 'label', 'device', 'status', 'reason', 'at', 'checkedAt'];
  function acctKey() { var s = session(); return s ? K.accts + s.email : null; }
  function accounts() {
    var k = acctKey(), d = k ? getJSON(k) : null;
    var list = d && Array.isArray(d.list) ? d.list : [];
    var active = d && d.active && (d.active === 'all' || list.some(function (a) { return a.id === d.active; })) ? d.active : (list.length > 1 ? 'all' : (list[0] ? list[0].id : 'all'));
    return { active: active, list: list };
  }
  function saveAccounts(d) { var k = acctKey(); if (!k) return; setJSON(k, d); emit(EV.accounts, accounts()); }
  function clean(a) { var o = {}; ALLOWED.forEach(function (f) { if (a[f] != null) o[f] = a[f]; }); return o; }
  function upsertAccount(a) {
    var d = accounts(), c = clean(a);
    if (!c.id) c.id = 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    if (!c.at) c.at = Date.now();
    var i = d.list.findIndex(function (x) { return x.id === c.id; });
    if (i >= 0) d.list[i] = Object.assign({}, d.list[i], c); else d.list.push(c);
    if (i < 0) d.active = d.list.length > 1 ? d.active : c.id;
    saveAccounts(d);
    return c;
  }
  function removeAccount(id) { var d = accounts(); d.list = d.list.filter(function (a) { return a.id !== id; }); if (d.active === id) d.active = 'all'; saveAccounts(d); }
  function setActive(id) { var d = accounts(); if (id !== 'all' && !d.list.some(function (a) { return a.id === id; })) return; d.active = id; saveAccounts(d); }
  /* r38: 8 account statuses from the backend contract. Legacy data: pending → awaiting_key (old 'verified' / 'failed' keep
     their meaning). Anything unknown reads 「处理中」 and never throws. */
  var STATUSES = ['awaiting_key', 'checking', 'verified', 'failed', 'observing', 'running', 'halted', 'unbound'];
  var TONES = { awaiting_key: 'wait', checking: 'wait', verified: 'ok', failed: 'bad', observing: 'ok', running: 'ok', halted: 'bad', unbound: 'off' };
  function normStatus(s) { s = s == null || s === '' || s === 'pending' ? 'awaiting_key' : String(s); return s; }
  function statusKnown(s) { return STATUSES.indexOf(normStatus(s)) >= 0; }
  function statusText(s) { s = normStatus(s); return t('acct.st.' + (statusKnown(s) ? s : 'unknown')); }
  function statusTone(s) { return TONES[normStatus(s)] || 'wait'; }
  /* demo sub-account seeded by the dashboard (id 'demo-binance'): simulated data only, never connected to Binance */
  var DEMO_ID = 'demo-binance';
  function isDemo(a) { return !!a && (a === DEMO_ID || a.id === DEMO_ID); }
  /* auto-created default identity (new '3dtrading 用户', legacy '演示用户'): display only, stored name untouched */
  var DEFAULT_NAMES = ['演示用户', '3dtrading 用户'];
  function displayName(s) { var n = s && s.name; return n && DEFAULT_NAMES.indexOf(n) < 0 ? n : (n ? t('acct.defaultUser') : (s && s.email) || ''); }
  function accountName(a) { return isDemo(a) ? t('acct.demo.name') : (a && a.name) || ''; }
  function accountSub(a) { return isDemo(a) ? t('acct.demo.sub') : (a.uid ? 'UID ' + a.uid + ' · ' : '') + statusText(a.status); }

  /* ---------- cross-tab sync ---------- */
  global.addEventListener('storage', function (e) {
    if (!e.key) return;
    if (e.key === K.lang) { applyHtmlLang(lang()); apply(document); emit(EV.lang, { lang: lang() }); }
    else if (e.key === K.session) { emit(EV.session, { session: session() }); emit(EV.accounts, accounts()); }
    else if (e.key.indexOf(K.accts) === 0) emit(EV.accounts, accounts());
  });

  /* ---------- UI: styles ---------- */
  function ensureCss() {
    if (document.getElementById('tda-css')) return;
    var l = document.createElement('link'); l.id = 'tda-css'; l.rel = 'stylesheet'; l.href = base + 'td-account.css?v=r56b';
    document.head.appendChild(l);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ICON = {
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    app: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="8" rx="2"/><rect x="13.5" y="3.5" width="7" height="5" rx="2"/><rect x="13.5" y="11.5" width="7" height="9" rx="2"/><rect x="3.5" y="14.5" width="7" height="6" rx="2"/></svg>',
    site: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19z"/><path d="M10 20.5v-5h4v5"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.2 7.5-5.2s6.3 1.6 7.5 5.2"/></svg>',
    out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h7"/><path d="M16 8l4 4-4 4M20 12H10"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
    gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5s1.1-6.1 3.4-8.5z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6"/></svg>'
  };

  /* ---------- UI: language toggle (segmented 中文 / EN) ---------- */
  function langToggleHtml() {
    var l = lang();
    return '<div class="tda-lang" role="group" aria-label="' + esc(t('lang.label')) + '">' +
      LANGS.map(function (x) { return '<button type="button" data-tda-lang="' + x + '" aria-pressed="' + (x === l) + '" lang="' + (x === 'zh' ? 'zh-CN' : 'en') + '">' + esc(t('lang.' + x)) + '</button>'; }).join('') + '</div>';
  }
  function mountLangToggle(el, opt) {
    if (!el) return null;
    ensureCss();
    el.classList.add('tda-scope');
    function th() { var v = opt && opt.theme; v = typeof v === 'function' ? v() : v; return v === 'light' ? 'light' : 'dark'; }
    function render() { el.setAttribute('data-theme', th()); el.innerHTML = langToggleHtml(); }
    global.addEventListener(EV.theme, render);
    el.addEventListener('click', function (e) { var b = e.target.closest('[data-tda-lang]'); if (b) setLang(b.getAttribute('data-tda-lang')); });
    global.addEventListener(EV.lang, render);
    render();
    return { render: render };
  }

  /* ---------- UI: avatar menu, attached to the host's own avatar button ---------- */
  var curMenu = null;
  function mountMenu(btn, opt) {
    if (!btn) return null;
    ensureCss();
    opt = opt || {};
    var ctx = opt.context || 'site';            // 'site' | 'app' | 'account'
    var menu = document.createElement('div');
    menu.className = 'tda-menu tda-scope'; menu.setAttribute('role', 'menu'); menu.hidden = true;
    menu.id = 'tda-menu-' + Math.random().toString(36).slice(2, 7);
    document.body.appendChild(menu);
    btn.setAttribute('aria-haspopup', 'menu'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', menu.id);

    function theme() { var th = typeof opt.theme === 'function' ? opt.theme() : opt.theme; return th === 'light' ? 'light' : 'dark'; }
    function itemHtml(it) {
      var label = typeof it.label === 'object' ? (it.label[lang()] || it.label.zh) : it.label;
      var sub = it.sub ? (typeof it.sub === 'object' ? (it.sub[lang()] || it.sub.zh) : it.sub) : '';
      return '<a class="tda-mi" role="menuitem" href="' + esc(it.href) + '"><span class="tda-ic">' + (it.icon || ICON.user) + '</span><span class="tda-tx"><b>' + esc(label) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></a>';
    }
    function render() {
      menu.setAttribute('data-theme', theme());
      btn.setAttribute('aria-label', t('acct.menu'));
      var s = session(), h = '';
      if (!s) {
        h += '<div class="tda-hd guest"><span class="tda-av">' + dodo() + '</span><div><b>' + esc(t('acct.guest')) + '</b><small>' + esc(t('acct.guestHint')) + '</small></div></div>' +
          '<div class="tda-auth"><a class="tda-btn pri" role="menuitem" href="' + esc(authUrl('register', opt.next)) + '">' + esc(t('acct.register')) + '</a>' +
          '<a class="tda-btn" role="menuitem" href="' + esc(authUrl('login', opt.next)) + '">' + esc(t('acct.login')) + '</a></div>';
      } else {
        var A = accounts();
        if (opt.layout === 'r56') {
          /* r56 · 顶部是可点的「个人资料」；下面币安子账户；再下面 设置 / 语言 / 退出登录 同一行格式 */
          h += '<a class="tda-hd tda-prof" role="menuitem" href="' + esc(opt.profile || ROUTES.me) + '"><span class="tda-av ini">' + esc((displayName(s) || '?').slice(0, 1).toUpperCase()) + '</span><div><em>' + esc(t('acct.profile')) + '</em><b>' + esc(displayName(s)) + '</b><small>' + esc(s.email) + '</small></div><span class="tda-chev">' + ICON.chev + '</span></a>';
        } else
        h += '<div class="tda-hd"><span class="tda-av ini">' + esc((displayName(s) || '?').slice(0, 1).toUpperCase()) + '</span><div><b>' + esc(displayName(s)) + '</b><small>' + esc(s.email) + '</small></div></div>';
        h += '<div class="tda-sec">' + esc(t('acct.binance')) + '</div>';
        if (!A.list.length) {
          h += '<a class="tda-mi add" role="menuitem" href="' + esc(ROUTES.connect) + '"><span class="tda-ic">' + ICON.plus + '</span><span class="tda-tx"><b>' + esc(t('acct.bindFirst')) + '</b><small>' + esc(t('acct.none')) + '</small></span></a>';
        } else {
          if (A.list.length > 1) h += acctRow('all', t('acct.all'), t('acct.allSub', { n: A.list.length }), A.active === 'all', '');
          A.list.forEach(function (a) { h += acctRow(a.id, accountName(a), accountSub(a), A.active === a.id, isDemo(a) ? 'demo' : statusTone(a.status)); });
          h += '<a class="tda-mi add" role="menuitem" href="' + esc(ROUTES.connect) + '"><span class="tda-ic">' + ICON.plus + '</span><span class="tda-tx"><b>' + esc(t('acct.bindNew')) + '</b></span></a>';
        }
        h += '<hr>';
        if (opt.layout === 'r56') {
          h += '<a class="tda-mi row" role="menuitem" href="' + esc(opt.settings || '#/settings') + '"><span class="tda-ic">' + ICON.gear + '</span><span class="tda-tx"><b>' + esc(t('acct.settings')) + '</b></span><span class="tda-chev">' + ICON.chev + '</span></a>';
          h += '<div class="tda-mi row lang"><span class="tda-ic">' + ICON.globe + '</span><span class="tda-tx"><b>' + esc(t('lang.label')) + '</b></span>' + langToggleHtml() + '</div>';
          h += '<button type="button" class="tda-mi row out" role="menuitem" data-tda-out><span class="tda-ic">' + ICON.out + '</span><span class="tda-tx"><b>' + esc(t('acct.logout')) + '</b></span><span class="tda-chev"></span></button>';
          h += '<p class="tda-foot"><span class="tda-demo">' + esc(t('demo.badge')) + '</span> ' + esc(t('demo.note')) + '</p>';
          menu.innerHTML = h; return;
        }
        if (ctx !== 'app') h += itemHtml({ label: t('acct.toApp'), href: ROUTES.app, icon: ICON.app });
        if (ctx !== 'site') h += itemHtml({ label: t('acct.toSite'), href: ROUTES.site, icon: ICON.site });
        (opt.items || []).forEach(function (it) { h += itemHtml(it); });
      }
      h += '<div class="tda-row"><span>' + esc(t('lang.label')) + '</span>' + langToggleHtml() + '</div>';
      if (s) h += '<button type="button" class="tda-mi out" role="menuitem" data-tda-out><span class="tda-ic">' + ICON.out + '</span><span class="tda-tx"><b>' + esc(t('acct.logout')) + '</b></span></button>';
      h += '<p class="tda-foot"><span class="tda-demo">' + esc(t('demo.badge')) + '</span> ' + esc(t('demo.note')) + '</p>';
      menu.innerHTML = h;
    }
    function acctRow(id, name, sub, on, st) {
      return '<button type="button" class="tda-mi acct' + (on ? ' on' : '') + '" role="menuitemradio" aria-checked="' + on + '" data-tda-acct="' + esc(id) + '">' +
        '<span class="tda-dot ' + esc(st || 'all') + '" aria-hidden="true"></span><span class="tda-tx"><b>' + esc(name) + '</b><small>' + esc(sub) + '</small></span>' +
        (on ? '<span class="tda-ck">' + ICON.check + '</span>' : '') + '</button>';
    }
    function place() {
      var r = btn.getBoundingClientRect(), w = Math.min(320, global.innerWidth - 16);
      menu.style.width = w + 'px';
      var left = Math.max(8, Math.min(r.right - w, global.innerWidth - w - 8));
      menu.style.left = left + 'px';
      menu.style.top = (r.bottom + 10) + 'px';
      menu.style.maxHeight = (global.innerHeight - r.bottom - 22) + 'px';
    }
    function items() { return Array.prototype.slice.call(menu.querySelectorAll('[role^="menuitem"], [data-tda-lang]')); }
    function open(focusFirst) {
      if (curMenu && curMenu !== api) curMenu.close();
      render(); place(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); curMenu = api;
      if (focusFirst) { var f = items()[0]; if (f) f.focus(); }
    }
    function close(refocus) {
      if (menu.hidden) return;
      menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (curMenu === api) curMenu = null;
      if (refocus) btn.focus();
    }
    function toggle(kb) { menu.hidden ? open(kb) : close(); }
    // manual: the host calls openMenu(btn) from its own click handler
    if (!opt.manual) btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); toggle(e.detail === 0); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); open(true); } });
    menu.addEventListener('click', function (e) {
      var a = e.target.closest('[data-tda-acct]');
      if (a) { setActive(a.getAttribute('data-tda-acct')); render(); if (opt.onSwitch) opt.onSwitch(accounts()); return; }
      var l = e.target.closest('[data-tda-lang]');
      if (l) { setLang(l.getAttribute('data-tda-lang')); render(); var nb = menu.querySelector('[data-tda-lang="' + l.getAttribute('data-tda-lang') + '"]'); if (nb) nb.focus(); return; }
      if (e.target.closest('[data-tda-out]')) { close(); logout(opt.logoutTo ? { to: opt.logoutTo } : null); return; }
      if (e.target.closest('a')) close();
    });
    menu.addEventListener('keydown', function (e) {
      var it = items(), i = it.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); (it[i + 1] || it[0]).focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); (it[i - 1] || it[it.length - 1]).focus(); }
      else if (e.key === 'Tab') close();
    });
    document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) close(); });
    function destroy() { close(); if (menu.parentNode) menu.parentNode.removeChild(menu); }
    global.addEventListener('resize', function () { if (!menu.hidden) place(); });
    global.addEventListener('scroll', function () { if (!menu.hidden) place(); }, { passive: true });
    [EV.lang, EV.session, EV.accounts].forEach(function (n) { global.addEventListener(n, function () { if (!menu.hidden) render(); }); });
    var api = { open: open, close: close, toggle: toggle, render: render, destroy: destroy, el: menu };
    return api;
  }

  /* ---------- adapter for hosts that render their own avatar button ---------- */
  function getSession() { return session(); }
  function onChange(cb) {
    var h = function () { cb({ session: session(), accounts: accounts(), lang: lang() }); };
    [EV.session, EV.accounts, EV.lang].forEach(function (n) { global.addEventListener(n, h); });
    return function off() { [EV.session, EV.accounts, EV.lang].forEach(function (n) { global.removeEventListener(n, h); }); };
  }
  var hostMenu = null, hostBtn = null;
  // openMenu(anchor[, opt]) toggles the shared menu under the host's own button; a re-rendered button gets a fresh menu.
  function openMenu(anchor, o) {
    if (!anchor) return null;
    if (hostBtn !== anchor || !document.contains(hostBtn)) {
      if (hostMenu) hostMenu.destroy();
      o = o || {};
      hostBtn = anchor;
      hostMenu = mountMenu(anchor, {
        manual: true, context: o.context || 'site', items: o.items, next: o.next, onSwitch: o.onSwitch, logoutTo: o.logoutTo,
        theme: o.theme || function () { return anchor.classList.contains('lt') || (anchor.closest && anchor.closest('.lt')) || document.documentElement.getAttribute('data-theme') === 'day' ? 'light' : 'dark'; }
      });
    }
    hostMenu.toggle(false);
    return hostMenu;
  }

  function dodo() {
    return '<svg viewBox="0 0 84 84" aria-hidden="true"><defs><linearGradient id="tda-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fe3c6"/><stop offset="1" stop-color="#139c84"/></linearGradient><radialGradient id="tda-e" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#ece5d3"/></radialGradient></defs><rect width="84" height="84" fill="#0b1513"/><rect x="12" y="16" width="60" height="58" rx="18" fill="url(#tda-b)"/><rect x="12" y="16" width="60" height="22" rx="18" fill="#fff" opacity=".12"/><circle cx="42" cy="43" r="17" fill="url(#tda-e)"/><circle cx="42" cy="44" r="9.5" fill="#141416"/><rect x="38" y="39.5" width="3" height="6.5" rx=".6" fill="#22c55e"/><rect x="39.1" y="37.5" width=".8" height="10.5" fill="#22c55e"/><rect x="43.2" y="42" width="3" height="6.5" rx=".6" fill="#e5484d"/><rect x="44.3" y="40" width=".8" height="10.5" fill="#e5484d"/><circle cx="38" cy="40" r="2" fill="#fff" opacity=".85"/></svg>';
  }

  global.TDAccount = {
    version: VERSION, demo: true, routes: ROUTES, events: EV,
    lang: lang, setLang: setLang, t: t, i18n: add, apply: apply,
    session: session, register: register, login: login, logout: logout, requireUser: requireUser, authUrl: authUrl,
    accounts: accounts, upsertAccount: upsertAccount, removeAccount: removeAccount, setActive: setActive, statusText: statusText,
    statusTone: statusTone, normStatus: normStatus, statuses: function () { return STATUSES.slice(); },
    DEMO_ID: DEMO_ID, isDemo: isDemo, accountName: accountName, accountSub: accountSub,
    mountMenu: mountMenu, mountLangToggle: mountLangToggle, dodo: dodo, theme: themeKey, themeKey: function () { return THEME_KEY; },
    setTheme: setTheme, reveal: reveal, revealMs: REVEAL_MS, revealEase: REVEAL_EASE, mountThemeToggle: mountThemeToggle, returning: returning,
    displayName: displayName, DEFAULT_NAME: '3dtrading 用户',
    getSession: getSession, onChange: onChange, openMenu: openMenu
  };
})(window);

/* ---------- 电脑版 ⇄ 手机版切换已移除（2026-11-12）：页面按屏幕宽度自动适配。
   旧版本会在 localStorage 留下 3dtrading.dash.layout = 'phone'，这里清掉它，免得任何页面再被带进手机外框。 */
(function () {
  try { if (localStorage.getItem('3dtrading.dash.layout') === 'phone') localStorage.removeItem('3dtrading.dash.layout'); } catch (e) {}
})();
