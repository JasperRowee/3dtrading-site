/* 3dtrading r49 · 绑定币安 · 图解教程 (standalone, from r48 connect-r45.js)
 * The 自行生成 (Ed25519) route in three big steps — 开通子账户 → 创建API → 绑定API. Each big step is a list of sub-steps drawn on
 * our own coded Binance screens (desktop = Binance website, bind-bn.js; phones < 760 px = Binance App, bn-app.js); never the
 * live site. A demo cursor rests on the control to press.
 *  - Autoplay is OFF by default (switch in the bottom bar). With it on, the demo moves on inside the current big step only.
 *  - 上一步 / 下一步 / the dots / the big steps in the top bar / 跳过 move by hand; ← → too (never while typing). Esc or
 *    「返回绑定页」 goes back to ../ . Every move drops every pending timer and redraws.
 *  - The last step is a link back to the binding page (../#key): there is no form, no key and no submit in the tutorial.
 *  - The public key / IPs shown are the binding page's own values (shim.js), badged 「示例」 while they are examples.
 *  - Reduced motion: no glide and no autoplay. */
(function () {
  'use strict';
  var A = window.BN49, BN = window.TD_BN, BA = window.TD_BNAPP;
  var $ = function (s) { return document.querySelector(s); };
  if (!A || !BN || !BA) return;
  /* r49b · the tutorial lives INSIDE the binding page (index.html #guide), never as a page of its own:
     opened directly, it sends you to the binding page's tutorial section. */
  var EMBED = false;
  try { EMBED = window.parent !== window && !!window.parent.document.getElementById('guideFrame'); } catch (x) { EMBED = false; }
  if (!EMBED) { location.replace('../#guide'); return; }
  document.documentElement.classList.add('embed');
  function up(m) { try { window.parent.postMessage({ bn49: m }, location.origin); } catch (x) { /* */ } }
  var QP = new URLSearchParams(location.search);
  var MOVE = +(QP.get('move') || 700), DWELL = +(QP.get('dwell') || 1700), SETTLE = 260; // ms; tests may shorten them
  var B = { nameEx: '3dtUSDT01', labelEx: '3dtrading01', keyEx: 'EXAMPLE-3dtrading-apikey-0000-not-real', secretEx: 'EXAMPLE-3dtrading-secret-0000-not-real' }; // illustration values (r48 bind-steps.js)
  document.documentElement.dataset.theme = 'night'; // always a dark Binance screen; the page's own theme key is never written here
  A.i18n({
    zh: {
      'cx.prog': '绑定进度', 'cx.tag': '操作演示 · 不是真实币安页面', 'cx.stageL': '币安操作演示（不是真实币安页面）',
      'cx.b1': '开通子账户', 'cx.b2': '创建API', 'cx.b3': '绑定API', 'cx.open': '在币安打开', 'cx.skip': '跳过', 'cx.demo': '演示',
      'cx.state': '账户状态 <b>未连接</b><span class="dm">演示画面</span>', 'cx.copy': '复制', 'cx.copied': '已复制', 'cx.copyFail': '浏览器没让复制，请手动输入：{v}',
      'cx.pT': '把 API Key 填回 3dtrading', 'cx.pSub': '回到绑定窗口，把刚复制的 API Key 粘贴进输入框，点「绑定」。', 'cx.backKey': '回到绑定，粘贴 API Key',
      'cx.note': '自行生成的 API 只有 API Key，没有 Secret Key。演示版只检查格式，账户保持「未连接」。',
      'cx.cpPub': '复制公钥', 'cx.ex': '示例', 'cx.toBind': '回到绑定',
      'cx.close': '回到绑定', 'cx.prev': '上一步', 'cx.next': '下一步', 'cx.auto': '自动播放', 'cx.tcL': '教程控制', 'cx.dot': '第 {n} 步，共 {m} 步',
      'cx.autoRm': '已开启“减少动态效果”，不会自动播放', 'cx.cpdPub': '已复制公钥', 'cx.cpdEx': '（示例）', 'cx.cpdIp': '已复制 IP：{v}'
    },
    en: {
      'cx.prog': 'Binding progress', 'cx.tag': 'Demo · not the real Binance site', 'cx.stageL': 'Binance walkthrough demo (not the real Binance site)',
      'cx.b1': 'Sub-account', 'cx.b2': 'Create API', 'cx.b3': 'Bind API', 'cx.open': 'Open on Binance', 'cx.skip': 'Skip', 'cx.demo': 'Demo',
      'cx.state': 'Account <b>Not connected</b><span class="dm">Demo</span>', 'cx.copy': 'Copy', 'cx.copied': 'Copied', 'cx.copyFail': 'The browser blocked copying; type it instead: {v}',
      'cx.pT': 'Paste the API Key into 3dtrading', 'cx.pSub': 'Go back to the binding window, paste the API Key you just copied into the field and click Bind.', 'cx.backKey': 'Back to binding: paste the API Key',
      'cx.note': 'A self-generated API has an API Key only — no Secret Key. The demo only checks the format; the account stays “Not connected”.',
      'cx.cpPub': 'Copy public key', 'cx.ex': 'Example', 'cx.toBind': 'Back to binding',
      'cx.close': 'Back to binding', 'cx.prev': 'Back', 'cx.next': 'Next', 'cx.auto': 'Autoplay', 'cx.tcL': 'Tutorial controls', 'cx.dot': 'Step {n} of {m}',
      'cx.autoRm': 'Reduce motion is on, so autoplay is unavailable', 'cx.cpdPub': 'Public key copied', 'cx.cpdEx': ' (example)', 'cx.cpdIp': 'IP copied: {v}'
    }
  });
  var t = function (k, v) { return A.t(k, v); };
  var L = function () { return A.lang() === 'en' ? 'en' : 'zh'; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var RM = window.matchMedia('(prefers-reduced-motion:reduce)');
  var KIT = A.kit();
  function pubPem() { return KIT.publicKeyPem; }
  function pubFp() { return KIT.fingerprint; }
  function pubEx() { return KIT.pubExample; }
  function ipsEx() { return KIT.ipsExample; }
  function ipList() { return KIT.ips.slice(0, 2); }
  function cfg() { return { nameEx: B.nameEx, labelEx: B.labelEx, keyEx: B.keyEx, secretEx: B.secretEx, pubPem: pubPem(), pubText: pubFp(), kit: { perms: KIT.perms, ips: ipList(), fingerprint: pubFp() } }; }
  function phone() { return window.innerWidth < 760; }
  var URL_ = A.url;

  /* ---------- the steps (r48, 自行生成 route) ----------
   * d = desktop screen (bind-bn.js guide page + its phase), p = phone screen (bn-app.js id + options), t / pt = target selector,
   * our = a control on this page (the last step), copy = a value the hint can copy (never a key). zh/en = the hint. */
  var G = BN.guide;
  var BIG = [
    { id: 'sub', url: 'sub', subs: [
      { d: ['home', 0], t: '[data-t="av"]', zh: '点右上角头像', en: 'Click the avatar at the top right' },
      { d: ['home', 1], t: '[data-t="subacc"]', zh: '点「子账户」', en: 'Click Sub Accounts' },
      { d: ['create'], t: '[data-t="create"]', zh: '点「+ 创建子账户」', en: 'Click + Create Sub Account' },
      { d: ['vmail'], t: '[data-t="ok"]', copy: 'name', zh: '选「虚拟邮箱创建」，粘贴名称后点「确认」', en: 'Pick virtual email, paste the name, click Confirm' },
      { d: ['futures', 0], t: '.bn-tr .more', zh: '点这一行的「···」', en: 'Click “···” on the row' },
      { d: ['futures', 1], t: '[data-t="dd"]', zh: '点「允许合约」', en: 'Click Enable Futures' },
      { d: ['pm', 0], t: '.bn-tr .more', zh: '再点「···」', en: 'Click “···” again' },
      { d: ['pm', 1], t: '[data-t="dd"]', zh: '点「开通统一账户」', en: 'Click Enable Portfolio Margin' },
      { p: ['home', { hot: 'menu' }], pt: '[data-t="menu"]', zh: '打开币安 App，点左上角「☰」', en: 'Open the Binance App, tap ☰ at the top left' },
      { p: ['profile', { hot: 'prof' }], pt: '[data-t="prof"]', zh: '点个人资料右侧「›」', en: 'Tap › on the profile card' },
      { p: ['info', { hot: 'subacc' }], pt: '[data-t="subacc"]', zh: '点「子账户」', en: 'Tap Sub Accounts' },
      { p: ['sub', { hot: 'create' }], pt: '[data-t="create"]', zh: '点「+ 创建子账户」', en: 'Tap + Create Sub Account' },
      { p: ['sub', { sheet: 'create' }], pt: '[data-t="ok"]', copy: 'name', zh: '选「虚拟邮箱创建」，粘贴名称后点「确认」', en: 'Pick virtual email, paste the name, tap Confirm' },
      { p: ['sub', { rows: 1, toast: 'ok', hot: 'more' }], pt: '[data-t="more"]', zh: '点新子账户右上角「⋮」', en: 'Tap ⋮ on the new sub-account' },
      { p: ['sub', { rows: 1, menu: 'menu1' }], pt: '[data-t="dd"]', zh: '点「允许合约」', en: 'Tap Enable Futures' },
      { p: ['sub', { rows: 1, sheet: 'cf1' }], pt: '[data-t="cf"]', zh: '点「确认」', en: 'Tap Confirm' },
      { p: ['sub', { rows: 1, toast: 'ok', hot: 'more' }], pt: '[data-t="more"]', zh: '再点「⋮」', en: 'Tap ⋮ again' },
      { p: ['sub', { rows: 1, menu: 'menu2' }], pt: '[data-t="dd"]', zh: '点「开通统一账户」', en: 'Tap Enable Portfolio Margin' },
      { p: ['sub', { rows: 1, sheet: 'cf2' }], pt: '[data-t="cf"]', zh: '点「确认」，再由你本人完成币安验证', en: 'Tap Confirm, then pass Binance’s check yourself' }
    ] },
    { id: 'api', url: 'api', subs: [
      { d: ['apis'], t: '.bn-newapi', zh: '「API管理」里点「+ 创建API」', en: 'In API Management click + Create API' },
      { d: ['type', 'next'], t: '[data-t="next"]', kind: 'self', zh: '选「自行生成」，点「下一步」', en: 'Choose Self-generated, click Next' },
      { d: ['pub'], t: '[data-t="next3"]', copy: 'pub', zh: '选子账户、填标签、粘贴 3dtrading 的公钥，点「下一步」，再由你本人完成安全验证', en: 'Pick the sub-account, enter the label, paste 3dtrading’s public key, click Next, then pass the security check yourself' },
      { d: ['selfKeys'], t: '.bn-edit', zh: '点「编辑权限」', en: 'Click Edit restrictions' },
      { d: ['perm'], t: '[data-t="ipok"]', kind: 'self', copy: 'ips', zh: '只勾亮着的权限，提现保持关闭；选「只访问受信任的 IP」，填入两个 IP 后确认并保存', en: 'Tick only the lit permissions, keep withdrawals off; choose trusted IPs only, add the two IPs, confirm and save' },
      { p: ['sub', { rows: 1, toast: 'pm', hot: 'mgmt' }], pt: '[data-t="mgmt"]', zh: '统一账户更新完成后，点左上角「账号管理 ▾」', en: 'When Portfolio Margin is ready, tap Account Management ▾' },
      { p: ['sub', { rows: 1, sheet: 'mgmt' }], pt: '[data-t="apim"]', zh: '点「API管理」', en: 'Tap API Management' },
      { p: ['api', { hot: 'newapi' }], pt: '[data-t="newapi"]', zh: '点「+ 创建API」', en: 'Tap + Create API' },
      { p: ['api', { sheet: 'type', self: true }], pt: '[data-t="next"]', zh: '选「自行生成」，点「下一步」', en: 'Choose Self-generated, tap Next' },
      { p: ['api', { sheet: 'pub' }], pt: '[data-t="next2"]', copy: 'pub', zh: '选子账户、填标签、粘贴 3dtrading 的公钥，点「下一步」，再由你本人完成验证', en: 'Pick the sub-account, enter the label, paste 3dtrading’s public key, tap Next, then pass the check yourself' },
      { p: ['key', { self: true, part: 'perm' }], pt: '[data-t="iponly"]', zh: '只勾亮着的权限，提现不开；选「只访问受信任的IP」', en: 'Tick only the lit permissions, no withdrawals; choose trusted IPs only' },
      { p: ['key', { self: true, part: 'ips' }], pt: '[data-t="ipadd"]', copy: 'ips', zh: '逐个填入两个 IP，点「确认」', en: 'Add the two IPs one by one, tap Confirm' },
      { p: ['key', { self: true, part: 'save' }], pt: '[data-t="save"]', zh: '回到上方点「保存」，再由你本人完成验证', en: 'Scroll up, tap Save, then pass the check yourself' }
    ] },
    { id: 'bind', url: 'api', subs: [
      { d: ['selfKeys'], t: '[data-slot="key"] .bn-copy', p: ['key', { self: true, part: 'keys', saved: true }], pt: '[data-t="copyk"]', zh: '在币安复制 API Key（自行生成没有 Secret Key）', en: 'Copy the API Key on Binance (self-generated keys have no Secret)' },
      { our: '#backKey', last: true, zh: '回到本页上方粘贴 API Key，点「绑定」', en: 'Scroll up, paste the API Key and click Bind' }
    ] }
  ];
  function subs(b) { var ph = phone(); return BIG[b].subs.filter(function (s) { return s.our || (ph ? s.p : s.d); }); }

  /* ---------- state + timers (every scheduled callback is tracked, and dropped on any change) ---------- */
  var S = { b: 0, s: 0, hold: false, tok: 0, loops: 0, auto: false };
  var TM = [];
  function later(fn, ms) { var tok = S.tok, id = setTimeout(function () { TM = TM.filter(function (x) { return x !== id; }); if (tok === S.tok) fn(); }, ms); TM.push(id); }
  function stopAll() { S.tok++; TM.forEach(clearTimeout); TM = []; }

  var hb = $('#hb'), hum = $('#hum'), hic = $('#hic');
  var stage = $('#stage'), view = $('#view'), bn = $('#bn'), ba = $('#ba'), panel = $('#panel'), cur = $('#cur'), hintEl = $('#hint');
  var tc = $('#tc'), autoEl = $('#auto');
  var HOT = null, CUR = null;

  function progress() {
    $('#big').innerHTML = BIG.map(function (x, i) {
      var n = i === S.b ? subs(i).length : 0, k = Math.min(S.s, n - 1) + 1;
      return '<li class="' + (i === S.b ? 'on' : i < S.b ? 'done' : '') + '"><button type="button" data-big="' + i + '"' + (i === S.b ? ' aria-current="step"' : '') + '><span class="n">' + (i < S.b ? '✓' : i + 1) + '</span><span class="tx">' + esc(t('cx.b' + (i + 1))) + '</span>' +
        (n ? '<span class="ct" aria-hidden="true">' + k + '/' + n + '</span><i class="pb" aria-hidden="true" style="--p:' + (k / n).toFixed(3) + '"></i>' : '') + '</button></li>';
    }).join('');
    $('#st').innerHTML = t('cx.state');
    $('#skip').hidden = S.b === BIG.length - 1;
    $('#out').href = URL_[BIG[S.b].url][L()];
    var list = subs(S.b), m = list.length;
    $('#dots').innerHTML = list.map(function (x, i) {
      return '<li><button type="button" data-dot="' + i + '"' + (i === S.s ? ' aria-current="step" class="on"' : i < S.s ? ' class="done"' : '') + ' aria-label="' + esc(t('cx.dot', { n: i + 1, m: m })) + '"></button></li>';
    }).join('');
    $('#tcPrev').disabled = S.b === 0 && S.s === 0;
    $('#tcNext').disabled = !!(list[Math.min(S.s, m - 1)] || {}).last;
  }
  function layout() {
    stage.style.top = Math.round(hb.getBoundingClientRect().bottom) + 'px';
    stage.style.bottom = tc.offsetHeight + 'px';
  }
  function icons() {
    var I = BN.icons, en = L() === 'en';
    hic.innerHTML = '<span class="bi" data-t="av" aria-hidden="true">' + I.user + '</span><span class="bi" aria-hidden="true">' + I.wallet + '</span>' +
      '<span class="bi dot" aria-hidden="true">' + I.msg + '</span><span class="bi" aria-hidden="true">' + I.dl + '</span>' +
      '<button type="button" class="bi lg" id="lg" aria-label="' + (en ? '切换到中文' : 'Switch to English') + '" title="' + (en ? '中文' : 'English') + '">' + I.globe + '<b>' + (en ? 'EN' : '中') + '</b></button>';
  }
  function draw(scr, fresh) {
    var ph = phone(), l = L();
    bn.hidden = ph; ba.hidden = !ph;
    if (ph) ba.innerHTML = BA.html(scr.p[0], l, cfg(), scr.p[1]);
    else {
      var gp = G[scr.d[0]], html = typeof gp === 'function' ? gp(l, cfg(), scr.kind || 'hmac', scr.d[1]) : gp.html(l, cfg());
      bn.innerHTML = html;
      if (scr.d[1] != null) bn.setAttribute('data-ph', String(scr.d[1])); else bn.removeAttribute('data-ph');
      var top = bn.querySelector('.bn-top'); if (top) top.remove();
      var um = bn.querySelector('.bn-um'); hum.innerHTML = ''; hum.hidden = true;
      if (um) { um.remove(); if (scr.d[1] === 1) { hum.appendChild(um); hum.hidden = false; } }
    }
    if (ph) { hum.innerHTML = ''; hum.hidden = true; }
    if (fresh) { view.classList.remove('fade'); void view.offsetWidth; view.classList.add('fade'); }
    return ph ? ba : bn;
  }
  function render(fresh) {
    stopAll();
    var list = subs(S.b); S.s = Math.max(0, Math.min(S.s, list.length - 1));
    layout(); progress();
    document.title = '3dtrading · ' + (A.lang() === 'en' ? 'Bind Binance · Tutorial' : '绑定币安 · 图解教程');
    var st = list[S.s], ph = phone(), big3 = S.b === 2;
    panel.hidden = !big3;
    var scr = st; if (st.our) for (var k = S.s; k >= 0; k--) if (!list[k].our) { scr = list[k]; break; }
    if (scr.our) scr = list.filter(function (x) { return !x.our; })[0];
    var host = draw(scr, fresh);
    if (HOT) { HOT.classList.remove('hot', 'cue'); if (!HOT.closest('.panel')) HOT.removeAttribute('tabindex'); }
    var sel = ph ? st.pt : st.t;
    HOT = st.our ? $(st.our) : host.querySelector(sel) || hb.querySelector(sel);
    if (HOT && !st.our) { HOT.classList.add('hot'); HOT.setAttribute('tabindex', '0'); HOT.setAttribute('role', 'button'); HOT.setAttribute('aria-label', st[L()]); }
    if (HOT && st.our) HOT.classList.add('cue');
    if (big3) panel.scrollTop = 0;
    camera(host, st);
    showHint(st);
    demo(st);
    if (window.__guideHook) window.__guideHook(S.b, S.s);
  }
  function camera(host, st) {
    var ph = phone(), W = stage.clientWidth, H = stage.clientHeight;
    var pw = panel.hidden ? 0 : ph ? 0 : panel.offsetWidth, phH = panel.hidden || !ph ? 0 : panel.offsetHeight;
    var aw = W - pw, ah = H - phH, natW, s;
    if (ph) { natW = BA.width; s = aw / natW; }
    else { var pref = aw >= 1500 ? Math.min(1.25, aw / 1400) : 1; natW = Math.max(aw < 900 ? 900 : 1000, Math.round(aw / pref)); s = Math.max(.62, aw / natW); }
    view.style.transform = 'none';
    view.style.width = natW + 'px';
    host.style.width = natW + 'px';
    host.style.minHeight = Math.ceil(ph ? Math.max(760, ah / s) : ah / s) + 'px';
    var nh = host.scrollHeight;
    var tgt = st.our || !HOT || !host.contains(HOT) ? null : HOT, r = null;
    if (tgt) { var a = tgt.getBoundingClientRect(), o = host.getBoundingClientRect(); r = { x: a.left - o.left, y: a.top - o.top, w: a.width, h: a.height }; }
    var tx = 0, ty = 0;
    if (r && natW * s > aw + 1) tx = Math.max(aw - natW * s, Math.min(0, aw / 2 - (r.x + r.w / 2) * s));
    if (nh * s > ah + 1) {
      if (r) ty = Math.max(ah - nh * s, Math.min(0, ah / 2 - (r.y + r.h / 2) * s));
      if (ph && S.b === 2 && !r) ty = Math.max(ah - nh * s, -150 * s);
    }
    view.style.transform = 'translate(' + Math.round(tx) + 'px,' + Math.round(ty) + 'px) scale(' + s.toFixed(4) + ')';
  }
  function showHint(st) {
    if (st.last) { hintEl.hidden = true; return; } // r49h: the bind panel already says this (desktop right, phone bottom); the bubble only covered content
    var txt = st[L()], cp = st.copy || null, ex = '<em class="ex">' + esc(t('cx.ex')) + '</em>', body = '', btns = '';
    if (cp === 'pub') { body = ' <code>' + esc(pubFp()) + '</code>' + (pubEx() ? ex : ''); btns = '<button type="button" class="cp" data-copy="pub">' + esc(t('cx.cpPub')) + '</button>'; }
    else if (cp === 'ips') { body = ipsEx() ? ex : ''; btns = ipList().map(function (ip, i) { return '<button type="button" class="cp ip" data-copy="ip" data-i="' + i + '">' + esc(ip) + '</button>'; }).join(''); }
    else if (cp) { body = ' <code>' + esc(cp === 'name' ? B.nameEx : B.labelEx) + '</code>'; btns = '<button type="button" class="cp" data-copy="' + cp + '">' + esc(t('cx.copy')) + '</button>'; }
    hintEl.innerHTML = '<span>' + esc(txt) + body + '</span>' + (btns ? '<span class="cps">' + btns + '</span>' : '');
    hintEl.hidden = false;
    placeHint();
  }
  function placeHint() {
    if (!HOT || hintEl.hidden) return;
    var r = HOT.getBoundingClientRect(), hw = hintEl.offsetWidth, hh = hintEl.offsetHeight, VW = window.innerWidth, VH = window.innerHeight - tc.offsetHeight;
    var top0 = stage.getBoundingClientRect().top, G2 = 14, M = 10, x, y;
    var cy = function (v) { return Math.max(top0 + M, Math.min(v, VH - hh - M)); }, cx = function (v) { return Math.max(M, Math.min(v, VW - hw - M)); };
    if (r.right + G2 + hw <= VW - M && !phone()) { x = r.right + G2; y = cy(r.top + r.height / 2 - hh / 2); }
    else if (r.left - G2 - hw >= M && !phone()) { x = r.left - G2 - hw; y = cy(r.top + r.height / 2 - hh / 2); }
    else if (r.bottom + G2 + 22 + hh <= VH - M) { y = r.bottom + G2 + 18; x = cx(r.left + r.width / 2 - hw / 2); }
    else { y = Math.max(top0 + M, r.top - G2 - hh); x = cx(r.left + r.width / 2 - hw / 2); }
    hintEl.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }

  /* ---------- the demo cursor ---------- */
  function aim() { if (!HOT) return null; var r = HOT.getBoundingClientRect(); return { x: r.left + Math.min(r.width * .5, r.width - 8), y: r.top + r.height * .55 }; }
  function putCursor(p, glide) {
    cur.style.transition = glide ? '' : 'none';
    cur.style.transform = 'translate(' + Math.round(p.x - 3) + 'px,' + Math.round(p.y - 2) + 'px)';
    if (!glide) { void cur.offsetWidth; cur.style.transition = ''; }
    CUR = p;
  }
  function demo() {
    cur.classList.remove('press');
    var p = aim();
    if (!p || S.hold) { cur.classList.remove('on'); return; }
    cur.classList.add('on');
    if (RM.matches) { putCursor(p, false); return; }
    if (!CUR) putCursor({ x: p.x + 80, y: p.y + 60 }, false);
    later(function () {
      putCursor(p, true);
      later(function () {
        cur.classList.remove('press'); void cur.offsetWidth; cur.classList.add('press');
        if (S.auto) later(auto, DWELL); // only with 自动播放 switched on (off by default)
      }, MOVE);
    }, SETTLE);
  }
  /* autoplay: next sub-step, or back to the first sub-step of the SAME big step — never into another big step */
  function auto() { var n = subs(S.b).length; if (S.s < n - 1) S.s++; else { S.s = 0; S.loops++; } render(true); }
  /* by hand: next sub-step; from the last one of steps 1–2, the next big step */
  function manual() {
    var n = subs(S.b).length, st = subs(S.b)[S.s];
    if (st.last) return; // the last target is the link back to the binding page
    if (S.s < n - 1) S.s++; else if (S.b < BIG.length - 1) { S.b++; S.s = 0; S.hold = false; } else return;
    render(true);
  }
  function back() { if (S.s > 0) { S.s--; S.hold = false; render(true); } else if (S.b > 0) { S.b--; S.s = subs(S.b).length - 1; S.hold = false; render(true); } }
  function bigGo(i) { if (i < 0 || i >= BIG.length) return; S.b = i; S.s = 0; S.hold = false; render(true); }
  function subGo(i) { var n = subs(S.b).length; if (i < 0 || i >= n) return; S.s = i; S.hold = false; render(true); }
  function close() { up('top'); } // r49k: back to the binding window over this replica
  function setAuto(on) { S.auto = !!on && !RM.matches; autoEl.checked = S.auto; if (S.auto) { S.hold = false; render(false); } else stopAll(); }
  function nudge() { if (!HOT || RM.matches || HOT.closest('.panel')) return; HOT.classList.remove('nudge'); void HOT.offsetWidth; HOT.classList.add('nudge'); }
  function focusHot() { if (HOT && !HOT.closest('.panel')) try { HOT.focus({ preventScroll: true }); } catch (x) { HOT.focus(); } }

  hb.addEventListener('click', function (e) {
    if (e.target.closest('#lg')) { A.setLang(L() === 'en' ? 'zh' : 'en'); return; }
    if (HOT && hb.contains(HOT) && e.target.closest('.hot') === HOT) { manual(); if (e.detail === 0) focusHot(); }
  });
  hb.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === HOT) { e.preventDefault(); manual(); focusHot(); } });
  view.addEventListener('click', function (e) {
    if (HOT && view.contains(HOT) && e.target.closest('.hot') === HOT) { manual(); if (e.detail === 0) focusHot(); return; }
    nudge();
  });
  view.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === HOT) { e.preventDefault(); manual(); focusHot(); } });
  $('#big').addEventListener('click', function (e) { var b = e.target.closest('[data-big]'); if (b) bigGo(+b.dataset.big); });
  $('#skip').addEventListener('click', function () { bigGo(S.b + 1); });
  $('#tcPrev').addEventListener('click', back);
  $('#tcNext').addEventListener('click', function () { S.hold = false; manual(); });
  $('#dots').addEventListener('click', function (e) { var d = e.target.closest('[data-dot]'); if (d) subGo(+d.dataset.dot); });
  autoEl.addEventListener('change', function () { setAuto(autoEl.checked); });
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); S.hold = false; manual(); focusHot(); } else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); focusHot(); }
  });

  /* ---------- copy: the example name, and the binding page's public key / IPs. Never an API Key, never a private key. ---------- */
  function toast(s) { var e = $('#toast'); e.textContent = s; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 1800); }
  function execCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (x) { ok = false; } document.body.removeChild(ta); return ok;
  }
  function copyVal(kind, i) { return kind === 'name' ? B.nameEx : kind === 'label' ? B.labelEx : kind === 'pub' ? pubPem() : kind === 'ip' ? ipList()[+i || 0] || '' : ''; }
  function doCopy(b) {
    var kind = b.dataset.copy, v = copyVal(kind, b.dataset.i); if (!v) return;
    var p = navigator.clipboard && window.isSecureContext && navigator.clipboard.writeText ? navigator.clipboard.writeText(v).then(function () { return true; }, function () { return execCopy(v); }) : Promise.resolve(execCopy(v));
    p.then(function (ok) {
      var said = kind === 'pub' ? t('cx.cpdPub') + (pubEx() ? t('cx.cpdEx') : '') : kind === 'ip' ? t('cx.cpdIp', { v: v }) + (ipsEx() ? t('cx.cpdEx') : '') : t('cx.copied') + (L() === 'en' ? ': ' : '：') + v;
      toast(ok ? said : t('cx.copyFail', { v: kind === 'pub' ? '' : v }));
      if (ok) { b.classList.add('done'); clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove('done'); }, 1600); }
    });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('#hint [data-copy]'); if (b) doCopy(b); });
  /* the two ways back up: 回到上方绑定 (bar) and 回到上方粘贴 API Key (last step) — scroll the page, no navigation */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('#tcClose, #backKey, #logo'); if (!a) return;
    e.preventDefault(); if (S.auto) setAuto(false); up(a.id === 'backKey' ? 'key' : 'top');
  });

  /* ---------- boot: step 1, autoplay off ---------- */
  function relang() { A.apply(document); icons(); render(false); }
  icons();
  window.addEventListener(A.events.lang, relang);
  var rz, lastW = window.innerWidth;
  window.addEventListener('resize', function () { lastW = window.innerWidth; clearTimeout(rz); rz = setTimeout(function () { CUR = null; render(false); }, 120); });
  if (typeof RM.addEventListener === 'function') RM.addEventListener('change', function () { if (RM.matches) setAuto(false); autoEl.disabled = RM.matches; render(false); });
  autoEl.checked = false; autoEl.disabled = RM.matches; if (RM.matches) autoEl.parentNode.title = t('cx.autoRm');
  A.apply(document);
  /* r49k · the binding page drives two states: 'intro' = the replica sits dimmed behind the binding window (Binance home, no
     tutorial bar / hint / cursor, no timers); 'tut' = the step-by-step tutorial, always from step 1 with autoplay off. */
  function mode(m) {
    var intro = m === 'intro'; document.documentElement.classList.toggle('intro', intro);
    if (S.auto) setAuto(false); S.b = 0; S.s = 0; S.hold = intro; CUR = null; render(false); if (intro) stopAll();
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || e.source !== window.parent || !e.data) return;
    if (e.data.bn49cmd === 'intro' || e.data.bn49cmd === 'tut') mode(e.data.bn49cmd);
  });
  document.documentElement.classList.add('intro'); S.hold = true; render(false); stopAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!S.hold) render(false); });

  /* test hooks: read-only state, plus the same moves a person can make */
  window.__guide = {
    get big() { return S.b; }, get sub() { return S.s; }, get loops() { return S.loops; }, get pending() { return TM.length; },
    get auto() { return S.auto; }, get target() { return HOT; },
    subs: function (b) { return subs(b == null ? S.b : b).length; },
    go: function (b, s) { S.b = b; S.s = s || 0; S.hold = false; render(false); },
    tap: manual, back: back, skip: function () { bigGo(S.b + 1); }, bigGo: bigGo, subGo: subGo, setAuto: setAuto
  };
})();
