/* 3dtrading r49 · 绑定币安 · 图解教程 (standalone, from r48 connect-r45.js)
 * The 自行生成 (Ed25519) route in three big steps — 开通子账户 → 创建API → 绑定API. Each big step is a list of sub-steps drawn on
 * our own coded Binance screens (desktop = Binance website, bind-bn.js; phones < 760 px = Binance App, bn-app.js); never the
 * live site. A demo cursor rests on the control to press.
 *  - Autoplay is OFF by default (switch in the bottom bar). With it on, the demo moves on inside the current big step only.
 *  - 上一步 / 下一步 / the dots / the big steps in the top bar / 跳过 move by hand; ← → too (never while typing). Esc or
 *    「返回绑定页」 goes back to ../ . Every move drops every pending timer and redraws.
 *  - r57: the last step has the API Key field and 绑定 right in the panel (TDBind, shared with the dashboard modal). The key
 *    is only looked at, never stored or sent; 1234 makes a demo-bound account, a 64-char key stays 「未连接」.
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
  function up(m) {
    /* r58: opened on its own (not inside /3dtrading-site/bind/), log-in / sign-up / dashboard are plain links */
    if (window.parent === window && (m === 'login' || m === 'register')) { location.href = '/3dtrading-site/login/?mode=' + m + '&lang=' + (window.BN49 ? BN49.lang() : 'zh'); return; }
    try { window.parent.postMessage({ bn49: m }, location.origin); } catch (x) { /* */ }
  }
  var QP = new URLSearchParams(location.search);
  var MOVE = +(QP.get('move') || 700), DWELL = +(QP.get('dwell') || 1700), SETTLE = 260; // ms; tests may shorten them
  var B = { nameEx: '3dtUSDT01', labelEx: '3dtrading01', keyEx: 'EXAMPLE-3dtrading-apikey-0000-not-real', secretEx: 'EXAMPLE-3dtrading-secret-0000-not-real' }; // illustration values (r48 bind-steps.js)
  document.documentElement.dataset.theme = 'night'; // always a dark Binance screen; the page's own theme key is never written here
  A.i18n({
    zh: {
      'cx.prog': '绑定进度', 'cx.tag': '操作演示 · 不是真实币安页面', 'cx.stageL': '币安操作演示（不是真实币安页面）',
      'cx.b1': '开通子账户', 'cx.b2': '创建API', 'cx.b3': '绑定API', 'cx.open': '在币安打开', 'cx.skip': '跳过', 'cx.demo': '演示',
      'cx.state': '账户状态 <b>未连接</b><span class="dm">演示画面</span>', 'cx.copy': '复制', 'cx.copied': '已复制', 'cx.copyFail': '浏览器没让复制，请手动输入：{v}',
      'cx.kL': 'API Key', 'cx.qrL': '本页地址二维码', 'cx.eName': '账户名称不能包含 < > " \' `',
      'cx.okS': '账户已加入后台的账户列表。', 'cx.okSo': '登录或注册后，这个账户会带进你的后台。', 'cx.okNew': '新', 'cx.okWait': '待带入',
      'cx.okPo': '没有连接真实币安，也没有发送或保存 API Key。只记住了账户名称，并且只在这个标签页里、只带入一次。',
      'cx.okLogin': '登录并带入后台', 'cx.okReg': '注册新账号',
      'cx.pT': '在这里填入 API Key，直接绑定', 'cx.pSub': '把刚在币安复制的 API Key 粘贴到下面，点「绑定」。不用回后台再填一次。', 'cx.backKey': '绑定',
      'cx.note': '自行生成的 API 只有 API Key，没有 Secret Key。网页不保存、不发送你的 API Key。',
      'cx.kPh': '点这里直接粘贴 API Key', 'cx.nL': '账户名称（可选）', 'cx.nPh': '例如：主账户', 'cx.bind': '绑定',
      'cx.demoH': '<b>演示</b>没有真实币安时，输入 <code>1234</code> 可模拟绑定成功（演示账户，不连接币安）。',
      'cx.eEmpty': '请填写 API Key', 'cx.eBad': 'API Key 应为 64 位字母和数字（演示可填 1234）', 'cx.eDup': '已有同名账户「{n}」，换一个名称', 'cx.eSess': '请先登录 3dtrading，再绑定',
      'cx.fmtT': '账户未连接', 'cx.fmtP': '格式正确，但后台还没接入币安：这次没有发送、没有保存你的 API Key。',
      'cx.okT': '演示绑定成功', 'cx.okTag': '演示账户', 'cx.okP': '没有连接真实币安，也没有发送或保存 API Key；后台里的数字均为演示数据。',
      'cx.okL': '已演示绑定的账户', 'cx.okSub': '演示绑定 · 未连接币安', 'cx.okNext': '继续绑定下一个账户', 'cx.okDash': '完成，回到后台', 'cx.okToast': '演示绑定成功：{n}', 'cx.nextToast': '换一个子账户，从第 1 步再走一遍',
      'cx.cpPub': '复制公钥', 'cx.ex': '示例', 'cx.toBind': '回到绑定',
      'cx.close': '回到绑定', 'cx.prev': '上一步', 'cx.next': '下一步', 'cx.auto': '自动播放', 'cx.tcL': '教程控制', 'cx.dot': '第 {n} 步，共 {m} 步',
      'cx.autoRm': '已开启“减少动态效果”，不会自动播放', 'cx.cpdPub': '已复制公钥', 'cx.cpdEx': '（示例）', 'cx.cpdIp': '已复制 IP：{v}',
      'cx.cpdIps': '已复制白名单：{v}', 'cx.pasted': '已粘贴 API Key', 'cx.pasteNone': '剪贴板是空的，先在币安复制 API Key', 'cx.pasteFail': '浏览器没让读取剪贴板，请长按输入框或按 ⌘/Ctrl+V 粘贴', 'cx.spotL': '点暗处进入下一步'
    },
    en: {
      'cx.prog': 'Binding progress', 'cx.tag': 'Demo · not the real Binance site', 'cx.stageL': 'Binance walkthrough demo (not the real Binance site)',
      'cx.b1': 'Sub-account', 'cx.b2': 'Create API', 'cx.b3': 'Bind API', 'cx.open': 'Open on Binance', 'cx.skip': 'Skip', 'cx.demo': 'Demo',
      'cx.state': 'Account <b>Not connected</b><span class="dm">Demo</span>', 'cx.copy': 'Copy', 'cx.copied': 'Copied', 'cx.copyFail': 'The browser blocked copying; type it instead: {v}',
      'cx.kL': 'API Key', 'cx.qrL': 'QR code of this page’s address', 'cx.eName': 'The account name can’t contain < > " \' `',
      'cx.okS': 'The account is now in the dashboard’s account list.', 'cx.okSo': 'Log in or register and this account comes with you into the dashboard.', 'cx.okNew': 'New', 'cx.okWait': 'Pending',
      'cx.okPo': 'Binance is not connected and your API Key was not sent or stored. Only the account name is remembered — in this tab only, and carried over once.',
      'cx.okLogin': 'Log in and carry it over', 'cx.okReg': 'Create an account',
      'cx.pT': 'Enter the API Key here and bind', 'cx.pSub': 'Paste the API Key you just copied on Binance below and click Bind. No need to type it again in the dashboard.', 'cx.backKey': 'Bind',
      'cx.note': 'A self-generated API has an API Key only — no Secret Key. This page never stores or sends your API Key.',
      'cx.kPh': 'Click here to paste the API Key', 'cx.nL': 'Account name (optional)', 'cx.nPh': 'e.g. Main account', 'cx.bind': 'Bind',
      'cx.demoH': '<b>Demo</b>Without a real Binance account, enter <code>1234</code> to simulate a successful binding (demo account, not connected to Binance).',
      'cx.eEmpty': 'Enter the API Key', 'cx.eBad': 'The API Key should be 64 letters and digits (demo: 1234)', 'cx.eDup': 'An account named “{n}” already exists — choose another name', 'cx.eSess': 'Log in to 3dtrading first, then bind',
      'cx.fmtT': 'Account not connected', 'cx.fmtP': 'The format is right, but the dashboard isn’t connected to Binance yet: your API Key was not sent or stored.',
      'cx.okT': 'Demo binding complete', 'cx.okTag': 'Demo account', 'cx.okP': 'Binance is not connected and your API Key was not sent or stored; the dashboard’s numbers are demo data.',
      'cx.okL': 'Demo-bound accounts', 'cx.okSub': 'Demo binding · Not connected to Binance', 'cx.okNext': 'Bind another account', 'cx.okDash': 'Done, back to the dashboard', 'cx.okToast': 'Demo binding complete: {n}', 'cx.nextToast': 'Use another sub-account and go through step 1 again',
      'cx.cpPub': 'Copy public key', 'cx.ex': 'Example', 'cx.toBind': 'Back to binding',
      'cx.close': 'Back to binding', 'cx.prev': 'Back', 'cx.next': 'Next', 'cx.auto': 'Autoplay', 'cx.tcL': 'Tutorial controls', 'cx.dot': 'Step {n} of {m}',
      'cx.autoRm': 'Reduce motion is on, so autoplay is unavailable', 'cx.cpdPub': 'Public key copied', 'cx.cpdEx': ' (example)', 'cx.cpdIp': 'IP copied: {v}',
      'cx.cpdIps': 'Whitelist copied: {v}', 'cx.pasted': 'API Key pasted', 'cx.pasteNone': 'The clipboard is empty — copy the API Key on Binance first', 'cx.pasteFail': 'The browser blocked reading the clipboard; long-press the field or press ⌘/Ctrl+V to paste', 'cx.spotL': 'Click the dark area to go on'
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
  function pubShort() { var b = pubPem().replace(/-----[^-]+-----|\s/g, ''); return b.slice(0, 10) + '…' + b.slice(-8); }
  function cfg() { return { pubShort: pubShort(), nameEx: B.nameEx, labelEx: B.labelEx, keyEx: B.keyEx, secretEx: B.secretEx, pubPem: pubPem(), pubText: pubFp(), kit: { perms: KIT.perms, ips: ipList(), fingerprint: pubFp() } }; }
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
      { d: ['futures', 0], t: '.bn-tr .more', cam: '.bn-tr', zh: '点这一行的「···」', en: 'Click “···” on the row' },
      { d: ['futures', 1], t: '[data-t="dd"]', cam: '.bn-tr', zh: '点「允许合约」', en: 'Click Enable Futures' },
      { d: ['pm', 0], t: '.bn-tr .more', cam: '.bn-tr', zh: '再点「···」', en: 'Click “···” again' },
      { d: ['pm', 1], t: '[data-t="dd"]', cam: '.bn-tr', zh: '点「开通统一账户」', en: 'Click Enable Portfolio Margin' },
      { p: ['home', { hot: 'menu' }], pt: '[data-t="menu"]', zh: '打开币安 App，点左上角「☰」', en: 'Open the Binance App, tap ☰ at the top left' },
      { p: ['profile', { hot: 'prof' }], pt: '[data-t="prof"]', zh: '点个人资料右侧「›」', en: 'Tap › on the profile card' },
      { p: ['info', { hot: 'subacc' }], pt: '[data-t="subacc"]', zh: '点「子账户」', en: 'Tap Sub Accounts' },
      { p: ['sub', { hot: 'create' }], pt: '[data-t="create"]', zh: '点「+ 创建子账户」', en: 'Tap + Create Sub Account' },
      { p: ['sub', { sheet: 'create' }], pt: '[data-t="ok"]', copy: 'name', zh: '选「虚拟邮箱创建」，粘贴名称后点「确认」', en: 'Pick virtual email, paste the name, tap Confirm' },
      { p: ['sub', { rows: 1, toast: 'ok', hot: 'more' }], pt: '[data-t="more"]', pcam: '.ba-sc', zh: '点新子账户右上角「⋮」', en: 'Tap ⋮ on the new sub-account' },
      { p: ['sub', { rows: 1, menu: 'menu1' }], pt: '[data-t="dd"]', pcam: '.ba-sc', zh: '点「允许合约」', en: 'Tap Enable Futures' },
      { p: ['sub', { rows: 1, sheet: 'cf1' }], pt: '[data-t="cf"]', pcam: '.ba-sc', zh: '点「确认」', en: 'Tap Confirm' },
      { p: ['sub', { rows: 1, toast: 'ok', hot: 'more' }], pt: '[data-t="more"]', pcam: '.ba-sc', zh: '再点「⋮」', en: 'Tap ⋮ again' },
      { p: ['sub', { rows: 1, menu: 'menu2' }], pt: '[data-t="dd"]', pcam: '.ba-sc', zh: '点「开通统一账户」', en: 'Tap Enable Portfolio Margin' },
      { p: ['sub', { rows: 1, sheet: 'cf2' }], pt: '[data-t="cf"]', pcam: '.ba-sc', zh: '点「确认」，再由你本人完成币安验证', en: 'Tap Confirm, then pass Binance’s check yourself' }
    ] },
    { id: 'api', url: 'api', subs: [
      { d: ['apis'], t: '.bn-newapi', zh: '「API管理」里点「+ 创建API」', en: 'In API Management click + Create API' },
      { d: ['type', 'next'], t: '[data-t="next"]', kind: 'self', zh: '选「自行生成」，点「下一步」', en: 'Choose Self-generated, click Next' },
      { d: ['pub'], t: '[data-t="next3"]', copy: 'pub', zh: '选子账户、填标签；点「公钥」框复制 3dtrading 的公钥并粘贴，点「下一步」，再由你本人完成安全验证', en: 'Pick the sub-account and enter the label; click the Public key box to copy 3dtrading’s key and paste it, click Next, then pass the security check yourself' },
      /* r61 (Jasper): after the public key, the edit page is shown ready-made, in Binance's order of what to do there:
       * IP whitelist (already filled — click it to copy) → permissions (what we need already ticked) → last, the API Key (click to paste).
       * Click anywhere in the dark to go on. */
      { d: ['perm', 'ip'], t: '[data-t="ipw"]', ha: '.bn-rad.on', kind: 'self', zh: '「只访问受信任的IP」已选好，白名单也已填好。点白名单复制，到币安粘贴后点「确认」。点暗处继续', en: 'Restrict to trusted IPs is chosen and the whitelist is filled in. Click the whitelist to copy it, paste it on Binance and click Confirm. Click the dark area to go on' },
      { d: ['perm', 'perm'], t: '[data-t="pg"]', kind: 'self', zh: 'IP 加好后权限会解锁。在币安照着勾选亮着的 5 项，其余不勾，点「保存」并由你本人完成验证。点暗处继续', en: 'Once the IPs are added, permissions unlock. On Binance tick the 5 lit ones, leave the rest, click Save and pass the check yourself. Click the dark area to go on' },
      { p: ['sub', { rows: 1, toast: 'pm', hot: 'mgmt' }], pt: '[data-t="mgmt"]', zh: '统一账户更新完成后，点左上角「账号管理 ▾」', en: 'When Portfolio Margin is ready, tap Account Management ▾' },
      { p: ['sub', { rows: 1, sheet: 'mgmt' }], pt: '[data-t="apim"]', zh: '点「API管理」', en: 'Tap API Management' },
      { p: ['api', { hot: 'newapi' }], pt: '[data-t="newapi"]', zh: '点「+ 创建API」', en: 'Tap + Create API' },
      { p: ['api', { sheet: 'type', self: true }], pt: '[data-t="next"]', zh: '选「自行生成」，点「下一步」', en: 'Choose Self-generated, tap Next' },
      { p: ['api', { sheet: 'pub' }], pt: '[data-t="next2"]', copy: 'pub', zh: '在「上传公钥」里点下面的公钥框复制 3dtrading 的公钥，粘贴进「您的公钥」，点「下一步」，再由你本人完成验证', en: 'In Upload public key, tap the key box below to copy 3dtrading’s public key, paste it into Your public key, tap Next, then pass the check yourself' },
      { p: ['key', { self: true, part: 'ip' }], pt: '[data-t="ipw"]', ha: '.ba-rad.on', zh: '「只访问受信任的IP」已选好，白名单也已填好。点白名单复制，到币安粘贴后点「确认」。点暗处继续', en: 'Restrict to trusted IPs is chosen and the whitelist is filled in. Tap it to copy, paste it on Binance and tap Confirm. Tap the dark area to go on' },
      { p: ['key', { self: true, part: 'perm' }], pt: '[data-t="pg"]', zh: 'IP 加好后权限会解锁。在币安照着勾选亮着的 5 项，其余不勾，点「保存」并由你本人完成验证。点暗处继续', en: 'Once the IPs are added, permissions unlock. On Binance tick the 5 lit ones, leave the rest, tap Save and pass the check yourself. Tap the dark area to go on' }
    ] },
    { id: 'bind', url: 'api', subs: [
      { d: ['perm', 'bind'], kind: 'self', p: ['key', { self: true, part: 'bind' }], our: '#tkKey', last: true, zh: '最后，复制币安给出的 API Key，点这一行直接粘贴，再点「绑定」', en: 'Last, copy the API Key Binance shows, click this row to paste it, then click Bind' }
    ] }
  ];
  function subs(b) { var ph = phone(); return BIG[b].subs.filter(function (s) { return s.our || (ph ? s.p : s.d); }); }

  /* ---------- state + timers (every scheduled callback is tracked, and dropped on any change) ---------- */
  var S = { b: 0, s: 0, hold: false, tok: 0, loops: 0, auto: false };
  var TM = [];
  function later(fn, ms) { var tok = S.tok, id = setTimeout(function () { TM = TM.filter(function (x) { return x !== id; }); if (tok === S.tok) fn(); }, ms); TM.push(id); }
  function stopAll() { S.tok++; TM.forEach(clearTimeout); TM = []; }

  var hb = $('#hb'), hum = $('#hum'), hic = $('#hic');
  var stage = $('#stage'), view = $('#view'), bn = $('#bn'), ba = $('#ba'), panel = $('#panel'), cur = document.createElement('div'), hintEl = $('#hint');
  /* r61 (Jasper): no demo cursor. A spotlight dims everything but the control of this step; the hole lets clicks through to it,
   * and a click on the dark part goes to the next step. */
  var spotEl = document.createElement('div'); spotEl.className = 'spot'; spotEl.setAttribute('role', 'button'); spotEl.setAttribute('tabindex', '-1');
  var ring = document.createElement('div'); ring.className = 'spot-ring'; ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(spotEl); document.body.appendChild(ring);
  /* r60: a sizer gives the phone stage a real scroll height; the hint and cursor follow the page while it scrolls */
  var sizer = document.createElement('div'); sizer.className = 'stz'; sizer.setAttribute('aria-hidden', 'true'); stage.appendChild(sizer);
  stage.addEventListener('scroll', function () { placeHint(); spot(); }, { passive: true });
  if (panel && panel.parentNode !== document.body) document.body.appendChild(panel); /* r58: the result card covers the whole page, not the moving stage */
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
    document.documentElement.style.setProperty('--tcH', tc.offsetHeight + 'px');
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
    /* r59 (Jasper: 允许合约 / 统一账户 — the screen must not move, only the menu changes): fade only when the page itself
     * changes; the ··· / menu / confirm steps of one page share a key, so they swap the menu in place. */
    var key = ph ? 'p:' + scr.p[0] : 'd:' + ({ futures: 'am', pm: 'am' }[scr.d[0]] || scr.d[0]);
    if (fresh && key !== draw.key) { view.classList.remove('fade'); void view.offsetWidth; view.classList.add('fade'); }
    draw.key = key;
    return ph ? ba : bn;
  }
  function render(fresh) {
    stopAll();
    var list = subs(S.b); S.s = Math.max(0, Math.min(S.s, list.length - 1));
    layout(); progress();
    document.title = '3dtrading · ' + (A.lang() === 'en' ? 'Bind Binance · Tutorial' : '绑定币安 · 图解教程');
    var st = list[S.s], ph = phone(), big3 = S.b === 2;
    panel.hidden = !(big3 && OKV);
    var scr = st; if (!(ph ? st.p : st.d)) { for (var k = S.s; k >= 0; k--) if (!list[k].our) { scr = list[k]; break; } if (!(ph ? scr.p : scr.d)) scr = list.filter(function (x) { return !x.our; })[0]; }
    parkForm();
    var host = draw(scr, fresh);
    mountForm(host); fillQr(host);
    if (HOT) { HOT.classList.remove('hot', 'cue'); if (!HOT.closest('.panel')) HOT.removeAttribute('tabindex'); }
    var sel = ph ? st.pt : st.t;
    HOT = st.our ? $(st.our) : host.querySelector(sel) || hb.querySelector(sel);
    var inForm = HOT && tkF && tkF.contains(HOT);
    if (tkF) tkF.classList.toggle('pre', !st.last); // r59: before the last step only the API Key box shows (name + 绑定 come last)
    if (HOT && (st.our || inForm)) HOT.classList.add('cue');
    if (HOT && !st.our && !inForm) { HOT.classList.add('hot'); HOT.setAttribute('tabindex', '0'); HOT.setAttribute('role', 'button'); HOT.setAttribute('aria-label', st[L()]); }
    if (big3) panel.scrollTop = 0;
    camera(host, st);
    showHint(st);
    demo(st);
    if (window.__guideHook) window.__guideHook(S.b, S.s);
  }
  function camera(host, st) {
    var ph = phone(), W = stage.clientWidth, H = stage.clientHeight;
    var pw = 0, phH = 0; // r58: no side panel — the API Key field sits in the Binance screen itself
    var aw = W - pw, ah = H - phH, natW, s;
    if (ph) { natW = BA.width; s = Math.min(aw / natW, 1.2); } // r60: landscape phones keep the app phone-sized and centred
    else { var pref = aw >= 1500 ? Math.min(1.25, aw / 1400) : 1; natW = Math.max(aw < 900 ? 900 : 1000, Math.round(aw / pref)); s = Math.max(.62, aw / natW); }
    view.style.transform = 'none'; sizer.style.height = '0px'; if (!ph) stage.scrollTop = 0;
    view.style.width = natW + 'px';
    host.style.width = natW + 'px';
    /* r60 (Jasper: 手机教程被顶栏/底栏裁切): on a phone the drawn app is exactly as tall as the visible stage, so its
     * bottom sheets (确认 / 下一步) sit right above our controls instead of under them; longer pages scroll natively. */
    host.style.minHeight = Math.ceil(ah / s) + 'px';
    var nh = host.scrollHeight;
    if (ph) return phoneCam(host, st, s, ah, nh);
    /* r59: a step may name a fixed anchor (cam / pcam): the camera frames that, not the menu item, so the page holds still */
    var anc = st && (ph ? st.pcam : st.cam), aEl = anc ? host.querySelector(anc) : null;
    var tgt = aEl || (!HOT || !host.contains(HOT) ? null : HOT), r = null;
    if (tgt) { var a = tgt.getBoundingClientRect(), o = host.getBoundingClientRect(); r = { x: a.left - o.left, y: a.top - o.top, w: a.width, h: a.height }; }
    var tx = 0, ty = 0;
    if (r && natW * s > aw + 1) tx = Math.max(aw - natW * s, Math.min(0, aw / 2 - (r.x + r.w / 2) * s));
    if (nh * s > ah + 1) {
      if (r) ty = Math.max(ah - nh * s, Math.min(0, ah / 2 - (r.y + r.h / 2) * s));
      if (ph && S.b === 2 && !r) ty = Math.max(ah - nh * s, -150 * s);
    }
    view.style.transform = 'translate(' + Math.round(tx) + 'px,' + Math.round(ty) + 'px) scale(' + s.toFixed(4) + ')';
  }
  function phoneCam(host, st, s, ah, nh) {
    var aw = stage.clientWidth, lx = Math.max(0, Math.round((aw - BA.width * s) / 2));
    view.style.transform = 'translate(' + lx + 'px,0) scale(' + s.toFixed(4) + ')';
    sizer.style.height = Math.ceil(nh * s) + 'px';
    var mine = HOT && host.contains(HOT), sh = mine && HOT.closest('.ba-sheet'), pop = mine && HOT.closest('.ba-pop');
    var anc = !sh && !pop && st && st.pcam ? host.querySelector(st.pcam) : null, tgt = sh ? HOT : anc || (mine ? HOT : null);
    var max = Math.max(0, Math.ceil(nh * s - ah)), y = 0;
    if (tgt) {
      var a = tgt.getBoundingClientRect(), o = host.getBoundingClientRect(), top = (a.top - o.top), bot = top + a.height;
      y = sh ? max : Math.round((top + bot) / 2 - ah / 2);
      if (mine && !sh) { var h = HOT.getBoundingClientRect(), ht = h.top - o.top, hb2 = ht + h.height; y = Math.max(y, Math.round(hb2 - ah + Math.min(70, ah * .3))); y = Math.min(y, Math.round(ht - 12)); }
    }
    stage.scrollTop = Math.max(0, Math.min(max, y));
  }
  function showHint(st) {
    if (OKV) { hintEl.hidden = true; return; } // r61: the last step has its hint too (there is no side panel any more)
    var txt = st[L()], cp = st.copy || null, ex = '<em class="ex">' + esc(t('cx.ex')) + '</em>', body = '', btns = '';
    if (cp === 'pub') { body = pubEx() ? ex : ''; }
    else if (cp === 'ips') { body = ipsEx() ? ex : ''; btns = ipList().map(function (ip, i) { return '<button type="button" class="cp ip" data-copy="ip" data-i="' + i + '">' + esc(ip) + '</button>'; }).join(''); }
    else if (cp === 'ipw') { body = ipsEx() ? ex : ''; }
    else if (cp) { body = ' <code>' + esc(cp === 'name' ? B.nameEx : B.labelEx) + '</code>'; btns = '<button type="button" class="cp" data-copy="' + cp + '">' + esc(t('cx.copy')) + '</button>'; }
    hintEl.innerHTML = '<span>' + esc(txt) + body + '</span>' + (btns ? '<span class="cps">' + btns + '</span>' : '');
    hintEl.hidden = false;
    placeHint();
  }
  function placeHint() {
    if (!HOT || hintEl.hidden) return;
    /* r61: keep the hint off the whole lit area (the bind form on the last step) and off anything the step names in ha (the chosen IP radio) */
    var r = (spotTarget() || HOT).getBoundingClientRect(), st0 = subs(S.b)[S.s], ha = st0 && st0.ha && stage.querySelector(st0.ha);
    if (ha) { var q = ha.getBoundingClientRect(); r = { left: Math.min(r.left, q.left), right: Math.max(r.right, q.right), top: Math.min(r.top, q.top), bottom: Math.max(r.bottom, q.bottom) }; r.width = r.right - r.left; r.height = r.bottom - r.top; }
    var hw = hintEl.offsetWidth, hh = hintEl.offsetHeight, VW = window.innerWidth, VH = window.innerHeight - tc.offsetHeight;
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
    spotFollow();
    if (!HOT || S.hold) return;
    if (S.auto) later(auto, MOVE + DWELL); // only with 自动播放 switched on (off by default)
  }
  function spotTarget() {
    var st = subs(S.b)[S.s];
    if (st && st.last && tkF && tkF.parentNode && tkF.parentNode !== hold) return tkF; // the whole form: key, name and 绑定
    return HOT;
  }
  function spot() {
    var de = document.documentElement, el = (S.hold || OKV || de.classList.contains('intro')) ? null : spotTarget();
    var r = el && el.getBoundingClientRect();
    /* r61: the public-key step says "click the key box to copy it, then Next", so the lit area takes in the key box as well as Next
       (a dimmed key box would only have moved on, and the key could not be copied) */
    var cur = subs(S.b)[S.s], pk = r && cur && cur.copy === 'pub' && document.querySelector('#view [data-copy="pub"]'), q = pk && pk.getBoundingClientRect();
    if (q && q.width && q.height) { var L0 = Math.min(r.left, q.left), T0 = Math.min(r.top, q.top), R0 = Math.max(r.right, q.right), B0 = Math.max(r.bottom, q.bottom);
      r = { left: L0, top: T0, right: R0, bottom: B0, width: R0 - L0, height: B0 - T0 }; }
    if (!r || (!r.width && !r.height)) { spotEl.classList.remove('on'); ring.classList.remove('on'); de.classList.remove('spotting'); return; }
    var W = window.innerWidth, H = Math.max(0, window.innerHeight - tc.offsetHeight), P = 6;
    var x = Math.max(2, r.left - P), y = Math.max(2, r.top - P), x2 = Math.min(W - 2, r.right + P), y2 = Math.min(H - 2, r.bottom + P);
    var hole = x2 - x > 4 && y2 - y > 4, d = 'M0 0H' + W + 'V' + H + 'H0Z';
    if (hole) {
      var k = Math.min(10, (x2 - x) / 2, (y2 - y) / 2), f = function (n) { return Math.round(n * 10) / 10; };
      x = f(x); y = f(y); x2 = f(x2); y2 = f(y2); k = f(k);
      var A = 'A' + k + ' ' + k + ' 0 0 1 ';
      d += 'M' + f(x + k) + ' ' + y + 'H' + f(x2 - k) + A + x2 + ' ' + f(y + k) + 'V' + f(y2 - k) + A + f(x2 - k) + ' ' + y2 + 'H' + f(x + k) + A + x + ' ' + f(y2 - k) + 'V' + f(y + k) + A + f(x + k) + ' ' + y + 'Z';
    }
    spotEl.style.height = H + 'px';
    var cp = "path(evenodd, '" + d + "')"; spotEl.style.clipPath = cp; spotEl.style.webkitClipPath = cp;
    spotEl.setAttribute('aria-label', t('cx.spotL')); spotEl.title = t('cx.spotL');
    spotEl.classList.add('on'); de.classList.add('spotting');
    if (hole) { ring.style.transform = 'translate(' + x + 'px,' + y + 'px)'; ring.style.width = (x2 - x) + 'px'; ring.style.height = (y2 - y) + 'px'; ring.classList.add('on'); }
    else ring.classList.remove('on');
  }
  /* follow the target while the page fades / the stage settles after a step change */
  function spotFollow() {
    cancelAnimationFrame(spotFollow.id); var t0 = performance.now();
    (function f() { spot(); if (performance.now() - t0 < 900) spotFollow.id = requestAnimationFrame(f); })();
  }
  spotEl.addEventListener('click', function (e) {
    e.preventDefault(); if (S.auto) setAuto(false);
    var st = subs(S.b)[S.s];
    if (st && st.last) { ring.classList.remove('nudge'); void ring.offsetWidth; ring.classList.add('nudge'); return; }
    S.hold = false; manual();
  });
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
  function nudge() { if (!HOT || RM.matches || HOT.closest('.panel') || HOT.closest('#tkF')) return; HOT.classList.remove('nudge'); void HOT.offsetWidth; HOT.classList.add('nudge'); }
  function focusHot() { if (HOT && !HOT.closest('.panel') && !HOT.closest('#tkF')) try { HOT.focus({ preventScroll: true }); } catch (x) { HOT.focus(); } }

  hb.addEventListener('click', function (e) {
    if (e.target.closest('#lg')) { A.setLang(L() === 'en' ? 'zh' : 'en'); return; }
    if (HOT && hb.contains(HOT) && e.target.closest('.hot') === HOT) { manual(); if (e.detail === 0) focusHot(); }
  });
  hb.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === HOT) { e.preventDefault(); manual(); focusHot(); } });
  view.addEventListener('click', function (e) {
    var cpb = e.target.closest('[data-copy]'); if (cpb) { doCopy(cpb); return; }
    if (e.target.closest('#tkF')) return;
    if (HOT && view.contains(HOT) && e.target.closest('.hot') === HOT) { manual(); if (e.detail === 0) focusHot(); return; }
    nudge();
  });
  view.addEventListener('keydown', function (e) { if (e.target.closest('#tkF')) return; if ((e.key === 'Enter' || e.key === ' ') && e.target === HOT) { e.preventDefault(); manual(); focusHot(); } });
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
  function copyVal(kind, i) { return kind === 'name' ? B.nameEx : kind === 'label' ? B.labelEx : kind === 'pub' ? pubPem() : kind === 'ip' ? ipList()[+i || 0] || '' : kind === 'ips' ? ipList().join(' ') : ''; }
  function doCopy(b) {
    var kind = b.dataset.copy, v = copyVal(kind, b.dataset.i); if (!v) return;
    var p = navigator.clipboard && window.isSecureContext && navigator.clipboard.writeText ? navigator.clipboard.writeText(v).then(function () { return true; }, function () { return execCopy(v); }) : Promise.resolve(execCopy(v));
    p.then(function (ok) {
      var said = kind === 'pub' ? t('cx.cpdPub') + (pubEx() ? t('cx.cpdEx') : '') : kind === 'ips' ? t('cx.cpdIps', { v: v }) + (ipsEx() ? t('cx.cpdEx') : '') : kind === 'ip' ? t('cx.cpdIp', { v: v }) + (ipsEx() ? t('cx.cpdEx') : '') : t('cx.copied') + (L() === 'en' ? ': ' : '：') + v;
      toast(ok ? said : t('cx.copyFail', { v: kind === 'pub' ? '' : v }));
      if (ok) { b.classList.add('done'); clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove('done'); }, 1600); }
    });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('#hint [data-copy]'); if (b) doCopy(b); });
  /* the two ways back up: 回到上方绑定 (bar) and 回到上方粘贴 API Key (last step) — scroll the page, no navigation */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('#tcClose, #logo'); if (!a) return;
    e.preventDefault(); if (S.auto) setAuto(false); up('top');
  });

  /* ---------- r58 · last step: the API Key row of the Binance screen IS the field (shared rules with the dashboard via TDBind) ----------
     Signed in → the demo account is added at once. Signed out → the binding still "succeeds" as a demo, the name is kept as a
     one-time pending item (TDAuth.setPending, this tab only, never a key) and the result asks to log in / register; the
     dashboard picks it up once after sign-in. The key itself is only looked at: never stored, logged, put in a URL or sent. */
  var TB = window.TDBind, AU = window.TDAuth, tkF = $('#tkF'), tkKey = $('#tkKey'), tkNm = $('#tkNm'), tkErr = $('#tkErr'), tkRes = $('#tkRes'), tkOk = $('#tkOk'), tkN = $('#tkN'), hold = $('#tkHold');
  var OKV = null; // the result being shown, or null
  function parkForm() { if (tkF && tkF.parentNode !== hold) hold.appendChild(tkF); }
  function mountForm(host) { var sl = host.querySelector('[data-slot="key"].slot'); if (sl && tkF) sl.appendChild(tkF); }
  /* the QR box on the key page: this site's own binding page (phone opens the App-style walkthrough). Built from the live origin;
     no caption, no key or secret in it. It is NOT the authenticator QR of the dashboard's 2FA settings. */
  function bindHref() { return new URL('../?lang=' + L() + '#guide', location.href).href; } // r59: relative, so it also works under the /3dtrading-site/ prefix
  function fillQr(host) {
    var q = host.querySelector('[data-slot="qr"] .q'); if (!q || typeof window.qrcode !== 'function') return;
    try { var qr = window.qrcode(0, 'M'); qr.addData(bindHref()); qr.make(); q.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); q.classList.add('real'); q.setAttribute('role', 'img'); q.setAttribute('aria-label', t('cx.qrL')); q.dataset.href = bindHref(); } catch (x) { /* leave the plain box */ }
  }
  if (TB && tkNm) tkNm.value = TB.draft();
  function tkReset() { OKV = null; setTimeout(spot, 0); panel.hidden = true; tkOk.innerHTML = ''; tkKey.value = ''; tkN.textContent = '0 / 64'; tkErr.textContent = ''; tkRes.hidden = true; tkNm.value = TB ? TB.draft() : ''; }
  var CK = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="rg" cx="32" cy="32" r="28"/><path class="tk" d="M20 33l8.5 8.5L45 24"/></svg>';
  function okHtml(v) {
    var all = v.signed && TB ? TB.demoList() : [];
    return '<div class="tk-burst" aria-hidden="true">' + CK + '</div>' +
      '<h3 tabindex="-1" id="tkOkT">' + esc(t('cx.okT')) + '</h3>' +
      '<p class="tk-oks">' + esc(t(v.signed ? 'cx.okS' : 'cx.okSo')) + '</p>' +
      '<div class="tk-acc"><i aria-hidden="true">' + esc(String(v.name).charAt(0)) + '</i><span><b>' + esc(v.name) + '</b><small>' + esc(t('cx.okSub')) + '</small></span><em>' + esc(t(v.signed ? 'cx.okNew' : 'cx.okWait')) + '</em></div>' +
      (all.length > 1 ? '<ul class="tk-okl" aria-label="' + esc(t('cx.okL')) + '">' + all.map(function (a) { return '<li><i aria-hidden="true">✓</i>' + esc(a.name) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="tk-okp"><span class="dm">' + esc(t('cx.demo')) + '</span>' + esc(t(v.signed ? 'cx.okP' : 'cx.okPo')) + '</p>' +
      '<div class="tk-okf">' + (v.signed
        ? '<button type="button" class="tcb" id="tkNext">' + esc(t('cx.okNext')) + '</button><button type="button" class="tk-go" id="tkDash">' + esc(t('cx.okDash')) + '</button>'
        : '<button type="button" class="tcb" id="tkReg">' + esc(t('cx.okReg')) + '</button><button type="button" class="tk-go" id="tkLogin">' + esc(t('cx.okLogin')) + '</button>') + '</div>';
  }
  function showOk(v) {
    OKV = v; tkKey.value = ''; tkN.textContent = '0 / 64'; panel.hidden = false; tkOk.innerHTML = okHtml(v); spot();
    if (S.auto) setAuto(false); cur.classList.remove('on'); hintEl.hidden = true;
    toast(t('cx.okToast', { n: v.name }));
    try { $('#tkOkT').focus({ preventScroll: true }); } catch (x) { $('#tkOkT').focus(); }
  }
  if (tkF) {
    tkKey.addEventListener('input', function () { tkN.textContent = tkKey.value.trim().length + ' / 64'; tkErr.textContent = ''; tkRes.hidden = true; tkKey.classList.remove('bad'); });
    /* r61 (Jasper): on the last step a click in the empty API Key field pastes what was just copied on Binance (read only
     * on that click, never stored or sent; the browser may ask first). If reading is refused, the field keeps focus for ⌘/Ctrl+V. */
    tkKey.addEventListener('click', function () {
      var st = subs(S.b)[S.s]; if (!st || !st.last || tkKey.value.trim()) return;
      var cb = navigator.clipboard;
      if (!cb || !cb.readText || !window.isSecureContext) { toast(t('cx.pasteFail')); return; }
      cb.readText().then(function (v) {
        v = String(v || '').trim();
        if (!v) { toast(t('cx.pasteNone')); return; }
        tkKey.value = v.slice(0, 80); tkKey.dispatchEvent(new Event('input', { bubbles: true })); toast(t('cx.pasted')); spot();
      }, function () { toast(t('cx.pasteFail')); });
    });
    tkNm.addEventListener('input', function () { tkErr.textContent = ''; tkNm.classList.remove('bad'); if (TB) TB.saveDraft(tkNm.value); });
    tkF.addEventListener('submit', function (e) {
      e.preventDefault(); if (S.auto) setAuto(false);
      if (tkF.classList.contains('pre')) { manual(); return; } // r59: Enter in the API Key box before the last step = go on (IP + permissions come first)
      tkErr.textContent = ''; tkRes.hidden = true;
      var c = TB ? TB.check(tkKey.value) : 'bad', en = L() === 'en';
      if (c === 'empty' || c === 'bad') { tkErr.textContent = t(c === 'empty' ? 'cx.eEmpty' : 'cx.eBad'); tkKey.classList.add('bad'); tkKey.focus(); return; }
      if (c === 'format') { tkKey.value = ''; tkN.textContent = '0 / 64'; tkRes.hidden = false; tkRes.innerHTML = '<b>' + esc(t('cx.fmtT')) + '</b><span>' + esc(t('cx.fmtP')) + '</span>'; return; }
      var nm = tkNm.value.trim();
      if (nm && !/^[^<>"'`]{1,24}$/.test(nm)) { tkErr.textContent = t('cx.eName'); tkNm.classList.add('bad'); tkNm.focus(); return; }
      if (TB.signedIn()) {
        var r = TB.bind({ key: tkKey.value, name: nm, en: en });
        if (!r.ok) { if (r.code === 'dup') { tkErr.textContent = t('cx.eDup', { n: r.name }); tkNm.classList.add('bad'); tkNm.focus(); tkNm.select(); } else tkErr.textContent = t('cx.eSess'); return; }
        showOk({ name: r.name, signed: true });
      } else {
        /* signed out: keep only the display name, once, for after sign-in */
        var name = nm || TB.nextName(en);
        if (AU) AU.setPending(name); if (TB) TB.saveDraft('');
        showOk({ name: name, signed: false });
      }
    });
    tkOk.addEventListener('click', function (e) {
      if (e.target.closest('#tkNext')) { tkReset(); toast(t('cx.nextToast')); S.b = 0; S.s = 0; render(true); try { $('#tcNext').focus({ preventScroll: true }); } catch (x) {} }
      else if (e.target.closest('#tkDash')) up('done');
      else if (e.target.closest('#tkLogin')) up('login');
      else if (e.target.closest('#tkReg')) up('register');
    });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); var signed = OKV && OKV.signed; tkReset(); render(false); if (!signed) { /* the pending name stays until sign-in */ } try { tkKey.focus({ preventScroll: true }); } catch (x) {} return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(panel.querySelectorAll('button,[tabindex="-1"]#tkOkT'), function (x) { return x.offsetParent !== null; });
      var bs = f.filter(function (x) { return x.tagName === 'BUTTON'; }); if (!bs.length) return;
      if (e.shiftKey && (document.activeElement === bs[0] || document.activeElement.id === 'tkOkT')) { e.preventDefault(); bs[bs.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === bs[bs.length - 1]) { e.preventDefault(); bs[0].focus(); }
    });
  }

  /* ---------- boot: step 1, autoplay off ---------- */
  function relang() { A.apply(document); icons(); render(false); }
  icons();
  window.addEventListener(A.events.lang, relang);
  var rz, lastW = window.innerWidth;
  window.addEventListener('resize', function () { lastW = window.innerWidth; clearTimeout(rz); rz = setTimeout(function () { CUR = null; render(false); }, 120); spot(); });
  if (typeof RM.addEventListener === 'function') RM.addEventListener('change', function () { if (RM.matches) setAuto(false); autoEl.disabled = RM.matches; render(false); });
  autoEl.checked = false; autoEl.disabled = RM.matches; if (RM.matches) autoEl.parentNode.title = t('cx.autoRm');
  A.apply(document);
  /* r49k · the binding page drives two states: 'intro' = the replica sits dimmed behind the binding window (Binance home, no
     tutorial bar / hint / cursor, no timers); 'tut' = the step-by-step tutorial, always from step 1 with autoplay off. */
  function mode(m) {
    var intro = m === 'intro'; document.documentElement.classList.toggle('intro', intro);
    if (S.auto) setAuto(false); S.b = 0; S.s = 0; S.hold = intro; CUR = null; render(false); if (intro) stopAll(); spot();
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || e.source !== window.parent || !e.data) return;
    if (e.data.bn49cmd === 'intro' || e.data.bn49cmd === 'tut') mode(e.data.bn49cmd);
  });
  document.documentElement.classList.add('intro'); S.hold = true; render(false); stopAll(); spot();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!S.hold) render(false); });

  /* test hooks: read-only state, plus the same moves a person can make */
  window.__guide = {
    get big() { return S.b; }, get sub() { return S.s; }, get loops() { return S.loops; }, get pending() { return TM.length; },
    get auto() { return S.auto; }, get target() { return HOT; }, get spot() { return spotEl.classList.contains('on') ? spotTarget() : null; },
    get step() { var a = subs(S.b)[S.s]; return a ? { d: a.d, p: a.p, cam: a.cam, pcam: a.pcam, last: !!a.last } : null; }, // r59: read-only, for tests
    subs: function (b) { return subs(b == null ? S.b : b).length; },
    go: function (b, s) { S.b = b; S.s = s || 0; S.hold = false; render(false); },
    tap: manual, back: back, skip: function () { bigGo(S.b + 1); }, bigGo: bigGo, subGo: subGo, setAuto: setAuto
  };
})();
