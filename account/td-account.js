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

  /* day / night is the website's choice (localStorage '3dt.theme' = 'day' | 'night', default night); this module only reads it */
  function themeKey() { try { return localStorage.getItem('3dt.theme') === 'day' ? 'day' : 'night'; } catch (e) { return 'night'; } }

  /* arriving from the website's "going in" move: the page opens out of the same black, with nothing to click while it does */
  try {
    var dt = +sessionStorage.getItem('td-door');
    if (dt) {
      sessionStorage.removeItem('td-door');
      if (Date.now() - dt < 5000) {
        var rm = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, st = document.createElement('style');
        st.textContent = 'html.td-arrive::after{content:"";position:fixed;inset:0;z-index:2147483647;background:' + (themeKey() === 'day' ? '#e6eaee' : '#06090b') + ';pointer-events:none;animation:tdArrive ' + (rm ? '.2s' : '.6s .08s') + ' cubic-bezier(.3,0,.2,1) forwards}@keyframes tdArrive{to{opacity:0;visibility:hidden}}';
        (document.head || document.documentElement).appendChild(st); document.documentElement.classList.add('td-arrive');
        setTimeout(function () { document.documentElement.classList.remove('td-arrive'); }, 1000);
      }
    }
  } catch (e) {}

  var VERSION = '1.3.1';
  var K = { lang: '3dt.lang', session: '3dt.session', users: '3dt.demoUsers', accts: '3dt.accounts:' };
  var EV = { lang: 'td:lang', session: 'td:session', accounts: 'td:accounts', theme: 'td:theme' };
  /* another tab (the website) switched day/night: pages that opted in (html[data-theme]) follow at once */
  global.addEventListener('storage', function (e) {
    if (e.key !== '3dt.theme') return;
    var root = document.documentElement;
    if (root.hasAttribute('data-theme')) root.setAttribute('data-theme', themeKey());
    try { global.dispatchEvent(new CustomEvent(EV.theme, { detail: themeKey() })); } catch (x) {}
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
    bind: base + 'bind.html'
  };
  // aliases the website already reads (signup / login / bind / dashboard)
  ROUTES.signup = ROUTES.auth + '?mode=register';
  ROUTES.login = ROUTES.auth + '?mode=login';
  ROUTES.dashboard = ROUTES.app;
  /* The website's tag sets data-site but no data-app. Remember where that page really lives on this origin, so
     "back to website" from the dashboard or account pages returns there even when a preview serves the site
     folder at the root (where /site/index.html does not exist). Same-origin paths only. */
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
      'lang.label': '语言', 'lang.zh': '中文', 'lang.en': 'EN',
      'acct.login': '登录', 'acct.register': '注册', 'acct.logout': '退出登录', 'acct.guest': '未登录',
      'acct.guestHint': '登录后可绑定币安子账户、查看策略运行情况。',
      'acct.menu': '账户菜单', 'acct.demoUser': '本机账号', 'acct.defaultUser': '3dtrading 用户',
      'acct.binance': '币安子账户', 'acct.all': '全部账户', 'acct.allSub': '合并查看 {n} 个子账户',
      'acct.none': '还没有绑定币安子账户', 'acct.bindNew': '绑定新的币安子账户', 'acct.bindFirst': '去绑定第一个子账户',
      'acct.toApp': '进入控制台', 'acct.toSite': '回到官网', 'acct.me': '我的',
      'acct.st.pending': '待接入测试', 'acct.st.verified': '测试通过 · 未连接币安', 'acct.st.failed': '校验未通过',
      'acct.demo.name': '示例账户', 'acct.demo.sub': '示例数据 · 未连接币安', 'acct.demo.st': '示例数据 · 未连接币安',
      'demo.note': '账号与子账户只保存在本机浏览器，未连接币安，也没有真实校验。',
      'demo.badge': '示例数据'
    },
    en: {
      'lang.label': 'Language', 'lang.zh': '中文', 'lang.en': 'EN',
      'acct.login': 'Log in', 'acct.register': 'Sign up', 'acct.logout': 'Log out', 'acct.guest': 'Not signed in',
      'acct.guestHint': 'Sign in to link Binance sub-accounts and follow your strategy.',
      'acct.menu': 'Account menu', 'acct.demoUser': 'Local account', 'acct.defaultUser': '3dtrading user',
      'acct.binance': 'Binance sub-accounts', 'acct.all': 'All sub-accounts', 'acct.allSub': 'Combined · {n} total',
      'acct.none': 'No Binance sub-account linked yet', 'acct.bindNew': 'Link a Binance sub-account', 'acct.bindFirst': 'Link your first sub-account',
      'acct.toApp': 'Open dashboard', 'acct.toSite': 'Back to website', 'acct.me': 'Me',
      'acct.st.pending': 'Awaiting connection test', 'acct.st.verified': 'Test passed · Binance not connected', 'acct.st.failed': 'Check failed',
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
    setJSON(K.session, s);
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
  function logout(opt) {
    del(K.session);
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
  function statusText(s) { return t('acct.st.' + (s || 'pending')); }
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
    var l = document.createElement('link'); l.id = 'tda-css'; l.rel = 'stylesheet'; l.href = base + 'td-account.css?v=20261112-r21';
    document.head.appendChild(l);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ICON = {
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    app: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="8" rx="2"/><rect x="13.5" y="3.5" width="7" height="5" rx="2"/><rect x="13.5" y="11.5" width="7" height="9" rx="2"/><rect x="3.5" y="14.5" width="7" height="6" rx="2"/></svg>',
    site: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19z"/><path d="M10 20.5v-5h4v5"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.2 7.5-5.2s6.3 1.6 7.5 5.2"/></svg>',
    out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h7"/><path d="M16 8l4 4-4 4M20 12H10"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>'
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
        h += '<div class="tda-hd"><span class="tda-av ini">' + esc((displayName(s) || '?').slice(0, 1).toUpperCase()) + '</span><div><b>' + esc(displayName(s)) + '</b><small>' + esc(s.email) + '</small></div></div>';
        h += '<div class="tda-sec">' + esc(t('acct.binance')) + '</div>';
        if (!A.list.length) {
          h += '<a class="tda-mi add" role="menuitem" href="' + esc(ROUTES.bind) + '"><span class="tda-ic">' + ICON.plus + '</span><span class="tda-tx"><b>' + esc(t('acct.bindFirst')) + '</b><small>' + esc(t('acct.none')) + '</small></span></a>';
        } else {
          if (A.list.length > 1) h += acctRow('all', t('acct.all'), t('acct.allSub', { n: A.list.length }), A.active === 'all', '');
          A.list.forEach(function (a) { h += acctRow(a.id, accountName(a), accountSub(a), A.active === a.id, isDemo(a) ? 'demo' : (a.status || 'pending')); });
          h += '<a class="tda-mi add" role="menuitem" href="' + esc(ROUTES.bind + '?add=1') + '"><span class="tda-ic">' + ICON.plus + '</span><span class="tda-tx"><b>' + esc(t('acct.bindNew')) + '</b></span></a>';
        }
        h += '<hr>';
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
    DEMO_ID: DEMO_ID, isDemo: isDemo, accountName: accountName, accountSub: accountSub,
    mountMenu: mountMenu, mountLangToggle: mountLangToggle, dodo: dodo, theme: themeKey,
    displayName: displayName, DEFAULT_NAME: '3dtrading 用户',
    getSession: getSession, onChange: onChange, openMenu: openMenu
  };
})(window);

/* ---------- 电脑版 ⇄ 手机版切换已移除（2026-11-12）：页面按屏幕宽度自动适配。
   旧版本会在 localStorage 留下 3dtrading.dash.layout = 'phone'，这里清掉它，免得任何页面再被带进手机外框。 */
(function () {
  try { if (localStorage.getItem('3dtrading.dash.layout') === 'phone') localStorage.removeItem('3dtrading.dash.layout'); } catch (e) {}
})();
