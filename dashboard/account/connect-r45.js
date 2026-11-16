/* 3dtrading r45 · 添加币安账户 (connect.html)
 * Three big steps only — 开通子账户 → 创建API → 绑定API — shown as the one progress bar. Each big step is a list of sub-steps
 * (no progress for those). For each sub-step a demo cursor glides to the real control to press inside our coded Binance
 * screen, rests there, and then the sub-step moves on by itself. After the last sub-step the demo starts the SAME big step
 * again: it never crosses into another big step by itself. Pressing the lit control yourself moves on at once (and cancels the
 * pending timer); pressing it on the last sub-step of 开通子账户 / 创建API goes to the next big step. The big steps can be
 * opened in any order from the progress bar, and 跳过 goes to the next one.
 * r46: one Binance-style top bar (our logo → the dashboard, the three steps, Binance's icons from 「我的」 rightwards; the globe
 * is our language switch), always dark (no day / night). Binance's real 「选择API密钥类型」 page is shown again: the cursor picks
 * 「系统生成」 and then 「下一步」 (the self-generated route is not drawn or offered).
 * Keys: System generated (HMAC) only. Binance gives an API Key + Secret Key; the user pastes them
 * into our form (step 3). The values live only in the inputs, are never stored, logged or put in the URL, are cleared after
 * submit and on pagehide, and with no verification service the account always stays 「未连接」. The demo never types, never
 * presses 连接并验证 and never shows a success.
 * Reduced motion: no glide and no automatic moving on — the cursor sits on the control; press it (or →) to go on.
 * Desktop shows the Binance website (bind-bn.js); phones (<760 px wide) show the Binance App + the official web route (bn-app.js).
 *
 * r48 · Jasper: the 自行生成 (Ed25519 / RSA) route REPLACES 系统生成 on this page (the HMAC notes above are history).
 *  - The page opens on our Binance home replica, dims it, and shows the binding window: 3dtrading's PUBLIC key to paste
 *    into Binance, the two trusted IPs, the permissions, then the API Key input + 绑定, and 查看完整教程.
 *    Binance answers a self-generated key with an API Key only — there is no Secret, so the form has no Secret field.
 *  - The public key / IPs come from TDApi.getConnectKit(): selfGenerated.publicKey / allowIps when a real backend supplies
 *    them, otherwise selfGenerated.example, always badged 「示例」. The private key never reaches this page; nothing here
 *    asks for, shows or sends any private key. 绑定 calls submitSelfGeneratedKey (format check only, never connected);
 *    the HMAC submitApiCredentials is a different entry and is not used here.
 *  - 查看完整教程 = the r45 three-big-step guide on the self-generated route. It starts on step 1 with autoplay OFF; the bottom
 *    bar has 上一步 / 下一步 / the sub-step dots (jump) / an autoplay switch (off by default) / 返回绑定窗口. ← → work only in
 *    the tutorial and never while typing; Esc closes it. Closing, going back and jumping all drop every pending timer and
 *    redraw the screen of the step shown. The one form moves between the window and the step-3 panel, so ids stay unique. */
(function () {
  'use strict';
  var A = window.TDAccount, API = window.TDApi, B = window.TD_BIND, BN = window.TD_BN, BA = window.TD_BNAPP;
  var $ = function (s) { return document.querySelector(s); };
  if (!A || !A.requireUser()) return;
  var QP = new URLSearchParams(location.search);
  var MOVE = +(QP.get('move') || 700), DWELL = +(QP.get('dwell') || 1700), SETTLE = 260; // ms; tests may shorten them
  A.i18n({
    zh: {
      'cx.h1': '添加币安账户', 'cx.back': '返回后台', 'cx.prog': '绑定进度', 'cx.tag': '操作演示 · 不是真实币安页面', 'cx.stageL': '币安操作演示（不是真实币安页面）',
      'cx.b1': '开通子账户', 'cx.b2': '创建API', 'cx.b3': '绑定API', 'cx.open': '在币安打开', 'cx.skip': '跳过', 'cx.demo': '演示',
      'cx.state': '账户状态 <b>未连接</b><span class="dm">演示画面</span>', 'cx.copy': '复制', 'cx.copied': '已复制', 'cx.copyFail': '浏览器没让复制，请手动输入：{v}',
      'cx.pT': '把密钥填到 3dtrading', 'cx.pSub': '在币安点「复制」后粘贴到这里。只检查格式，不发送、不保存。',
      'cx.key': 'API Key', 'cx.sec': 'Secret Key', 'cx.keyPh': '粘贴 64 位 API Key', 'cx.secPh': '粘贴 64 位 Secret Key', 'cx.show': '显示 Secret Key', 'cx.hide': '隐藏 Secret Key',
      'cx.name': '账户名称', 'cx.namePh': '例如 3dtUSDT01', 'cx.go': '连接并验证', 'cx.busy': '正在检查…',
      'cx.safe': '演示版：验证服务还没接入，只检查格式；账户会一直显示「未连接」。',
      'cx.rNoSvcT': '账户未连接', 'cx.rNoSvcB': '验证服务未接入', 'cx.rNoSvcL1': '填写的内容没有发送、没有保存，输入框已清空。', 'cx.rNoSvcL2': '后台继续显示「未连接」，金额都是 0。',
      'cx.rBadT': '请检查标出的输入', 'cx.rFailT': '连接失败', 'cx.rFailB': '未通过', 'cx.rOkT': '已提交，等待验证结果', 'cx.rOkB': '验证中', 'cx.toApp': '返回后台',
      /* r48 · 自行生成 binding window + tutorial controls */
      'cx.pT': '把 API Key 填到 3dtrading', 'cx.pSub': '在币安点「复制」后粘贴到这里。只检查格式，不发送、不保存。',
      'cx.go': '绑定', 'cx.safe': '演示版：只检查格式，不发送、不保存，账户保持「未连接」。',
      'cx.rNoSvcB': '公钥和验证服务未接入', 'cx.rNoSvcL1': '这把 API Key 没有发送、没有保存，输入框已清空。',
      'cx.mEb': '币安 · 自行生成 API', 'cx.mDemo': '演示 · 示例数据', 'cx.mT': '用「自行生成」API 绑定币安',
      'cx.mSub': '在币安子账户「API管理 → + 创建API」选「自行生成」，照下面三项填写。币安只会给你一个 API Key，没有 Secret Key。',
      'cx.m1': '粘贴公钥（Ed25519）', 'cx.m2': '受信任 IP', 'cx.m3': 'API 权限', 'cx.m4': '把币安给你的 API Key 填回来',
      'cx.cpPub': '复制公钥', 'cx.fp': '指纹', 'cx.ex': '示例', 'cx.live': '3dtrading 下发',
      'cx.pubNote': '私钥只在 3dtrading 服务器里，页面不显示；不要把任何私钥交给币安或任何人。',
      'cx.pubEx': '示例公钥无人持有私钥，不能交易；正式公钥由后台生成后替换。',
      'cx.ipHow': '选「只访问受信任的 IP」，逐个填入：', 'cx.ipEx': '示例：文档保留地址（RFC 5737），不是 3dtrading 的生产 IP；正式 IP 由后台下发后替换。',
      'cx.ipLive': '这是 3dtrading 服务器的出口 IP，只填这两个。', 'cx.ipN': 'IP {n}',
      'cx.pmOn': '需要开启', 'cx.pmOff': '必须关闭', 'cx.tutGo': '查看完整教程', 'cx.openApi': '在币安打开 API 管理',
      'cx.close': '返回绑定窗口', 'cx.prev': '上一步', 'cx.next': '下一步', 'cx.auto': '自动播放', 'cx.tcL': '教程控制', 'cx.dot': '第 {n} 步，共 {m} 步',
      'cx.autoRm': '已开启“减少动态效果”，不会自动播放', 'cx.cpdPub': '已复制公钥', 'cx.cpdEx': '（示例）', 'cx.cpdIp': '已复制 IP：{v}'
    },
    en: {
      'cx.h1': 'Add a Binance account', 'cx.back': 'Back to dashboard', 'cx.prog': 'Binding progress', 'cx.tag': 'Demo · not the real Binance site', 'cx.stageL': 'Binance walkthrough demo (not the real Binance site)',
      'cx.b1': 'Sub-account', 'cx.b2': 'Create API', 'cx.b3': 'Bind API', 'cx.open': 'Open on Binance', 'cx.skip': 'Skip', 'cx.demo': 'Demo',
      'cx.state': 'Account <b>Not connected</b><span class="dm">Demo</span>', 'cx.copy': 'Copy', 'cx.copied': 'Copied', 'cx.copyFail': 'The browser blocked copying; type it instead: {v}',
      'cx.pT': 'Enter the keys in 3dtrading', 'cx.pSub': 'Click Copy on Binance, then paste here. Only the format is checked; nothing is sent or stored.',
      'cx.key': 'API Key', 'cx.sec': 'Secret Key', 'cx.keyPh': 'Paste the 64-character API Key', 'cx.secPh': 'Paste the 64-character Secret Key', 'cx.show': 'Show Secret Key', 'cx.hide': 'Hide Secret Key',
      'cx.name': 'Account name', 'cx.namePh': 'e.g. 3dtUSDT01', 'cx.go': 'Connect and verify', 'cx.busy': 'Checking…',
      'cx.safe': 'Demo build: verification is not connected yet, so only the format is checked; the account stays “Not connected”.',
      'cx.rNoSvcT': 'Account not connected', 'cx.rNoSvcB': 'Verification service missing', 'cx.rNoSvcL1': 'Nothing you entered was sent or saved, and the fields have been cleared.', 'cx.rNoSvcL2': 'The dashboard keeps showing “Not connected” with all amounts at 0.',
      'cx.rBadT': 'Please check the marked fields', 'cx.rFailT': 'Connection failed', 'cx.rFailB': 'Not passed', 'cx.rOkT': 'Submitted, waiting for verification', 'cx.rOkB': 'Verifying', 'cx.toApp': 'Back to dashboard',
      'cx.pT': 'Enter the API Key in 3dtrading', 'cx.pSub': 'Click Copy on Binance, then paste here. Only the format is checked; nothing is sent or stored.',
      'cx.go': 'Bind', 'cx.safe': 'Demo: format check only; nothing is sent or stored. Stays “Not connected”.',
      'cx.rNoSvcB': 'Public key and verification not set up', 'cx.rNoSvcL1': 'This API Key was not sent or saved, and the field has been cleared.',
      'cx.mEb': 'Binance · Self-generated API', 'cx.mDemo': 'Demo · example data', 'cx.mT': 'Bind Binance with a self-generated API key',
      'cx.mSub': 'In the sub-account’s API Management → + Create API, choose Self-generated and fill in the three items below. You get an API Key only — no Secret Key.',
      'cx.m1': 'Public key (Ed25519)', 'cx.m2': 'Trusted IPs', 'cx.m3': 'API restrictions', 'cx.m4': 'Paste the API Key Binance gives you',
      'cx.cpPub': 'Copy public key', 'cx.fp': 'Fingerprint', 'cx.ex': 'Example', 'cx.live': 'From 3dtrading',
      'cx.pubNote': 'The private key stays on 3dtrading’s server, never shown. Never give a private key to anyone.',
      'cx.pubEx': 'Example key; the real one will replace it.',
      'cx.ipHow': 'Choose “Trusted IPs only” and add each one:', 'cx.ipEx': 'Examples (RFC 5737), not 3dtrading’s production IPs.',
      'cx.ipLive': 'These are 3dtrading’s server IPs; add only these two.', 'cx.ipN': 'IP {n}',
      'cx.pmOn': 'Turn on', 'cx.pmOff': 'Must stay off', 'cx.tutGo': 'View the full tutorial', 'cx.openApi': 'Open API Management on Binance',
      'cx.close': 'Back to binding', 'cx.prev': 'Back', 'cx.next': 'Next', 'cx.auto': 'Autoplay', 'cx.tcL': 'Tutorial controls', 'cx.dot': 'Step {n} of {m}',
      'cx.autoRm': 'Reduce motion is on, so autoplay is unavailable', 'cx.cpdPub': 'Public key copied', 'cx.cpdEx': ' (example)', 'cx.cpdIp': 'IP copied: {v}'
    }
  });
  var t = function (k, v) { var s = A.t(k); if (v) Object.keys(v).forEach(function (n) { s = s.split('{' + n + '}').join(v[n]); }); return s; };
  var L = function () { return A.lang() === 'en' ? 'en' : 'zh'; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var RM = window.matchMedia('(prefers-reduced-motion:reduce)');
  var KIT = null;
  /* r48 · what the window offers to copy: the backend's real values first, else the labelled examples (never a private key) */
  function SG() { return (KIT && KIT.selfGenerated) || {}; }
  function realPub() { var p = SG().publicKey; return p ? (typeof p === 'string' ? { publicKeyPem: p } : p) : null; }
  function pubPem() { var r = realPub(), e = SG().example; return r ? r.publicKeyPem || '' : e ? e.publicKeyPem : ''; }
  function pubFp() { var r = realPub(), e = SG().example; return r ? r.fingerprint || '' : e ? e.fingerprint : ''; }
  function pubEx() { return !realPub(); }
  function ipsEx() { return !(KIT && KIT.allowIps && KIT.allowIps.length); }
  function ipList() { return !ipsEx() ? KIT.allowIps.slice(0, 2) : SG().example ? SG().example.ips.slice(0, 2) : []; }
  function cfg() { return { nameEx: B.nameEx, labelEx: B.labelEx, keyEx: B.keyEx, secretEx: B.secretEx, pubPem: pubPem(), pubText: pubFp(), kit: { perms: KIT ? KIT.perms : [], ips: ipList(), fingerprint: pubFp() } }; }
  function phone() { return window.innerWidth < 760; }
  var URL_ = {
    sub: { zh: 'https://www.binance.com/zh-CN/my/sub-account/account-management', en: 'https://www.binance.com/en/my/sub-account/account-management' },
    api: { zh: 'https://www.binance.com/zh-CN/my/sub-account/api-management', en: 'https://www.binance.com/en/my/sub-account/api-management' }
  };

  /* ---------- the steps ----------
   * d = desktop screen (bind-bn.js guide page + its phase), p = phone screen (bn-app.js id + options), t = target selector,
   * our = a control in our own form (step 3), copy = a suggested value the hint can copy (never a key). zh/en = the hint. */
  var G = BN.guide;
  /* r45b: desktop rows carry d (+ dz/de), phone rows carry p/pt (+ zh/en); rows with both are shared. The phone list follows
   * the Excepta App screenshots one to one (the page each row maps to is in the comment). Desktop is unchanged from r45 except
   * that the key-type dialog is gone. */
  var BIG = [
    { id: 'sub', url: 'sub', subs: [
      { d: ['home', 0], t: '[data-t="av"]', zh: '点右上角头像', en: 'Click the avatar at the top right' },
      { d: ['home', 1], t: '[data-t="subacc"]', zh: '点「子账户」', en: 'Click Sub Accounts' },
      { d: ['create'], t: '[data-t="create"]', zh: '点「+ 创建子账户」', en: 'Click + Create Sub Account' },
      { d: ['vmail'], t: '[data-t="ok"]', copy: 'name', dcopy: true, zh: '选「虚拟邮箱创建」，粘贴名称后点「确认」', en: 'Pick virtual email, paste the name, click Confirm' },
      { d: ['futures', 0], t: '.bn-tr .more', zh: '点这一行的「···」', en: 'Click “···” on the row' },
      { d: ['futures', 1], t: '[data-t="dd"]', zh: '点「允许合约」', en: 'Click Enable Futures' },
      { d: ['pm', 0], t: '.bn-tr .more', zh: '再点「···」', en: 'Click “···” again' },
      { d: ['pm', 1], t: '[data-t="dd"]', zh: '点「开通统一账户」', en: 'Click Enable Portfolio Margin' },
      /* phone · Excepta pp.11–16 */
      { p: ['home', { hot: 'menu' }], pt: '[data-t="menu"]', zh: '打开币安 App，点左上角「☰」', en: 'Open the Binance App, tap ☰ at the top left' },
      { p: ['profile', { hot: 'prof' }], pt: '[data-t="prof"]', zh: '点个人资料右侧「›」', en: 'Tap › on the profile card' },
      { p: ['info', { hot: 'subacc' }], pt: '[data-t="subacc"]', zh: '点「子账户」', en: 'Tap Sub Accounts' },
      { p: ['sub', { hot: 'create' }], pt: '[data-t="create"]', zh: '点「+ 创建子账户」', en: 'Tap + Create Sub Account' },
      { p: ['sub', { sheet: 'create' }], pt: '[data-t="ok"]', copy: 'name', pcopy: true, zh: '选「虚拟邮箱创建」，粘贴名称后点「确认」', en: 'Pick virtual email, paste the name, tap Confirm' },
      { p: ['sub', { rows: 1, toast: 'ok', hot: 'more' }], pt: '[data-t="more"]', zh: '点新子账户右上角「⋮」', en: 'Tap ⋮ on the new sub-account' },
      { p: ['sub', { rows: 1, menu: 'menu1' }], pt: '[data-t="dd"]', zh: '点「允许合约」', en: 'Tap Enable Futures' },
      { p: ['sub', { rows: 1, sheet: 'cf1' }], pt: '[data-t="cf"]', zh: '点「确认」', en: 'Tap Confirm' },
      { p: ['sub', { rows: 1, toast: 'ok', hot: 'more' }], pt: '[data-t="more"]', zh: '再点「⋮」', en: 'Tap ⋮ again' },
      { p: ['sub', { rows: 1, menu: 'menu2' }], pt: '[data-t="dd"]', zh: '点「开通统一账户」', en: 'Tap Enable Portfolio Margin' },
      { p: ['sub', { rows: 1, sheet: 'cf2' }], pt: '[data-t="cf"]', zh: '点「确认」，再由你本人完成币安验证', en: 'Tap Confirm, then pass Binance’s check yourself' }
    ] },
    /* r48 · the 自行生成 route (Binance's Create-API FAQ, 2026-11-06: Self-generated → Next → paste the public key → label →
     * Next → 2FA → API key). Phone rows follow bn-app.js's self screens (示意). copy: 'pub' / 'ips' copy the window's values. */
    { id: 'api', url: 'api', subs: [
      { d: ['apis'], t: '.bn-newapi', zh: '「API管理」里点「+ 创建API」', en: 'In API Management click + Create API' },
      { d: ['type', 'next'], t: '[data-t="next"]', kind: 'self', zh: '选「自行生成」，点「下一步」', en: 'Choose Self-generated, click Next' },
      { d: ['pub'], t: '[data-t="next3"]', copy: 'pub', zh: '选子账户、填标签、粘贴 3dtrading 的公钥，点「下一步」，再由你本人完成安全验证', en: 'Pick the sub-account, enter the label, paste 3dtrading’s public key, click Next, then pass the security check yourself' },
      { d: ['selfKeys'], t: '.bn-edit', zh: '点「编辑权限」', en: 'Click Edit restrictions' },
      { d: ['perm'], t: '[data-t="ipok"]', kind: 'self', copy: 'ips', zh: '只勾亮着的权限，提现保持关闭；选「只访问受信任的 IP」，填入两个 IP 后确认并保存', en: 'Tick only the lit permissions, keep withdrawals off; choose trusted IPs only, add the two IPs, confirm and save' },
      /* phone */
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
      { d: ['selfKeys'], t: '[data-slot="key"] .bn-copy', p: ['key', { self: true, part: 'keys' }], pt: '[data-t="copyk"]', zh: '在币安复制 API Key（自行生成没有 Secret Key）', en: 'Copy the API Key on Binance (self-generated keys have no Secret)' },
      { our: '#key', zh: '粘贴到这里', en: 'Paste it here' },
      { our: '#name', zh: '起个名字', en: 'Give it a name' },
      { our: '#go', last: true, zh: '检查后点「绑定」', en: 'Check, then click Bind' }
    ] }
  ];
  /* the desktop and phone lists differ only in length: the phone has three App screens before the web route */
  function subs(b) {
    var ph = phone();
    return BIG[b].subs.filter(function (s) { return s.our || (ph ? s.p : s.d); });
  }

  /* ---------- state + the timers (every scheduled callback is tracked, and dropped on any change) ---------- */
  var S = { b: 0, s: 0, hold: false, tok: 0, loops: 0, mode: 'intro', auto: false }; // r48: mode intro (the window) | tut
  var TM = [];
  function later(fn, ms) { var tok = S.tok, id = setTimeout(function () { TM = TM.filter(function (x) { return x !== id; }); if (tok === S.tok) fn(); }, ms); TM.push(id); }
  function stopAll() { S.tok++; TM.forEach(clearTimeout); TM = []; }

  var hb = $('#hb'), hum = $('#hum'), hic = $('#hic');
  var stage = $('#stage'), view = $('#view'), bn = $('#bn'), ba = $('#ba'), panel = $('#panel'), cur = $('#cur'), hintEl = $('#hint');
  var tc = $('#tc'), dim = $('#dim'), cxw = $('#cxw'), cxm = $('#cxm'), bbox = $('#bbox'), autoEl = $('#auto');
  var HOT = null, CUR = null; // the target element; the cursor's last screen position

  function progress() {
    $('#big').innerHTML = BIG.map(function (x, i) {
      var n = i === S.b ? subs(i).length : 0, k = Math.min(S.s, n - 1) + 1;
      return '<li class="' + (i === S.b ? 'on' : i < S.b ? 'done' : '') + '"><button type="button" data-big="' + i + '"' + (i === S.b ? ' aria-current="step"' : '') + '><span class="n">' + (i < S.b ? '✓' : i + 1) + '</span><span class="tx">' + esc(t('cx.b' + (i + 1))) + '</span>' +
        (n ? '<span class="ct" aria-hidden="true">' + k + '/' + n + '</span><i class="pb" aria-hidden="true" style="--p:' + (k / n).toFixed(3) + '"></i>' : '') + '</button></li>';
    }).join('');
    $('#st').innerHTML = t('cx.state');
    $('#skip').hidden = S.b === BIG.length - 1;
    $('#out').href = URL_[BIG[S.b].url][L()];
    /* r48 · tutorial bar: one dot per sub-step of this big step (jump), 上一步 / 下一步 */
    var list = subs(S.b), m = list.length;
    $('#dots').innerHTML = list.map(function (x, i) {
      return '<li><button type="button" data-dot="' + i + '"' + (i === S.s ? ' aria-current="step" class="on"' : i < S.s ? ' class="done"' : '') + ' aria-label="' + esc(t('cx.dot', { n: i + 1, m: m })) + '"></button></li>';
    }).join('');
    $('#tcPrev').disabled = S.b === 0 && S.s === 0;
    $('#tcNext').disabled = !!(list[Math.min(S.s, m - 1)] || {}).last;
  }
  function layout() { // r46: one bar, the stage fills the rest; r48: above the tutorial bar while the tutorial is open
    stage.style.top = Math.round(hb.getBoundingClientRect().bottom) + 'px';
    stage.style.bottom = S.mode === 'tut' && !tc.hidden ? tc.offsetHeight + 'px' : '0px';
  }
  /* r46: Binance's icons from 「我的」 rightwards, in our own bar (user, wallet, messages, download, globe = our language switch) */
  function icons() {
    var I = BN.icons, en = L() === 'en';
    hic.innerHTML = '<span class="bi" data-t="av" aria-hidden="true">' + I.user + '</span><span class="bi" aria-hidden="true">' + I.wallet + '</span>' +
      '<span class="bi dot" aria-hidden="true">' + I.msg + '</span><span class="bi" aria-hidden="true">' + I.dl + '</span>' +
      '<button type="button" class="bi lg" id="lg" aria-label="' + (en ? '切换到中文' : 'Switch to English') + '" title="' + (en ? '中文' : 'English') + '">' + I.globe + '<b>' + (en ? 'EN' : '中') + '</b></button>';
  }

  /* draw the current sub-step's screen, frame the target, then start the demo for it */
  /* draw one Binance screen (desktop: guide page + phase; phone: App screen + options) */
  function draw(scr, fresh) {
    var ph = phone(), l = L();
    bn.hidden = ph; ba.hidden = !ph;
    if (ph) ba.innerHTML = BA.html(scr.p[0], l, cfg(), scr.p[1]);
    else {
      var gp = G[scr.d[0]], html = typeof gp === 'function' ? gp(l, cfg(), scr.kind || 'hmac', scr.d[1]) : gp.html(l, cfg());
      bn.innerHTML = html;
      if (scr.d[1] != null) bn.setAttribute('data-ph', String(scr.d[1])); else bn.removeAttribute('data-ph');
      /* r46: Binance's own top bar lives in our one bar, so it is taken out of the replica; its user menu opens under our 「我的」 icon */
      var top = bn.querySelector('.bn-top'); if (top) top.remove();
      var um = bn.querySelector('.bn-um'); hum.innerHTML = ''; hum.hidden = true;
      if (um) { um.remove(); if (scr.d[1] === 1) { hum.appendChild(um); hum.hidden = false; } }
    }
    if (ph) { hum.innerHTML = ''; hum.hidden = true; }
    if (fresh) { view.classList.remove('fade'); void view.offsetWidth; view.classList.add('fade'); }
    return ph ? ba : bn;
  }
  function clearHot() {
    if (HOT) { HOT.classList.remove('hot'); HOT.removeAttribute('tabindex'); }
    document.querySelectorAll('.panel .cue').forEach(function (e) { e.classList.remove('cue'); });
    HOT = null;
  }
  /* r48 · the one form lives in the window, or in the step-3 panel while the tutorial shows 绑定API (moved only when needed) */
  function placeForm() {
    var want = S.mode === 'tut' && S.b === 2 ? $('#pslot') : $('#mslot');
    if (bbox.parentNode !== want) want.appendChild(bbox);
  }
  /* r48 · the opening view: Binance's home filling the stage, dimmed, with the binding window over it */
  function renderIntro() {
    stopAll(); document.body.classList.add('intro'); document.body.classList.remove('tut');
    tc.hidden = true; layout(); progress(); panel.hidden = true; placeForm();
    var ph = phone(), host = draw(ph ? { p: ['home', {}] } : { d: ['home', 0] }, false);
    clearHot(); cur.classList.remove('on', 'press'); CUR = null; hintEl.hidden = true;
    camera(host, {});
    fillWindow();
    if (window.__guideHook) window.__guideHook(-1, -1);
  }
  function render(fresh) {
    if (S.mode !== 'tut') { renderIntro(); return; }
    stopAll(); document.body.classList.add('tut'); document.body.classList.remove('intro'); tc.hidden = false;
    var list = subs(S.b); S.s = Math.max(0, Math.min(S.s, list.length - 1));
    layout(); progress();
    var st = list[S.s], ph = phone(), big3 = S.b === 2;
    panel.hidden = !big3; placeForm();
    /* the Binance screen: for our own form steps keep the previous Binance screen of this big step */
    var scr = st; if (st.our) for (var k = S.s; k >= 0; k--) if (!list[k].our) { scr = list[k]; break; }
    if (scr.our) scr = list.filter(function (x) { return !x.our; })[0];
    var host = draw(scr, fresh);
    /* the target */
    if (HOT) { HOT.classList.remove('hot'); HOT.removeAttribute('tabindex'); }
    document.querySelectorAll('.panel .cue').forEach(function (e) { e.classList.remove('cue'); });
    var sel = ph ? st.pt : st.t;
    HOT = st.our ? $(st.our) : host.querySelector(sel) || hb.querySelector(sel);
    if (HOT && !st.our) { HOT.classList.add('hot'); HOT.setAttribute('tabindex', '0'); HOT.setAttribute('role', 'button'); HOT.setAttribute('aria-label', hintText(st)); }
    if (HOT && st.our) (HOT.closest('.fld') || HOT).classList.add('cue');
    if (HOT && st.our) { // our own form: scroll the panel (a bottom sheet on phones) so the field and its hint fit
      var pr = panel.getBoundingClientRect(), fr = (HOT.closest('.fld') || HOT).getBoundingClientRect(), pad = 56;
      if (fr.bottom + 8 > pr.bottom) panel.scrollTop += fr.bottom + 8 - pr.bottom;
      else if (fr.top - pad < pr.top) panel.scrollTop -= pr.top - (fr.top - pad);
    } else if (big3) panel.scrollTop = 0;
    camera(host, st);
    showHint(st);
    demo(st);
    if (window.__guideHook) window.__guideHook(S.b, S.s);
  }
  function hintText(st) { return st[L()]; }

  /* fit the screen into the visible area and keep the target in view (no animation of the page itself) */
  /* r47: the replica IS the screen. Its own width follows the free area (sidebar flush left, content in the rest) and its height
   * is at least the free height, so there is never an empty band around it. Wide screens draw it a little larger instead of
   * stretching the content past a readable line; below 620px of desktop width it stops shrinking and the camera pans. */
  function camera(host, st) {
    var ph = phone(), W = stage.clientWidth, H = stage.clientHeight;
    var pw = panel.hidden ? 0 : ph ? 0 : panel.offsetWidth, phH = panel.hidden || !ph ? 0 : panel.offsetHeight;
    var aw = W - pw, ah = H - phH, natW, s;
    if (ph) { natW = BA.width; s = aw / natW; }
    else {
      var pref = aw >= 1500 ? Math.min(1.25, aw / 1400) : 1;
      natW = Math.max(aw < 900 ? 900 : 1000, Math.round(aw / pref)); s = Math.max(.62, aw / natW);
    }
    view.style.transform = 'none';
    view.style.width = natW + 'px';
    host.style.width = natW + 'px';
    host.style.minHeight = Math.ceil(ph ? Math.max(760, ah / s) : ah / s) + 'px'; // the App keeps its own 760pt floor; taller phones fill
    var nh = host.scrollHeight;
    var tgt = st.our || !HOT || !host.contains(HOT) ? null : HOT, r = null; // a target in our bar needs no panning
    if (tgt) { var a = tgt.getBoundingClientRect(), o = host.getBoundingClientRect(); r = { x: a.left - o.left, y: a.top - o.top, w: a.width, h: a.height }; }
    var tx = 0, ty = 0;
    if (r && natW * s > aw + 1) tx = Math.max(aw - natW * s, Math.min(0, aw / 2 - (r.x + r.w / 2) * s));
    if (nh * s > ah + 1) {
      if (r) ty = Math.max(ah - nh * s, Math.min(0, ah / 2 - (r.y + r.h / 2) * s));
      if (ph && S.mode === 'tut' && S.b === 2 && !r) ty = Math.max(ah - nh * s, -150 * s); // phone step 3, own-form sub-steps: keep the key rows above the form
    }
    view.style.transform = 'translate(' + Math.round(tx) + 'px,' + Math.round(ty) + 'px) scale(' + s.toFixed(4) + ')';
  }

  /* the hint: one short line beside the target (right, left, below, above), with a copy button where a value is suggested */
  function showHint(st) {
    var txt = hintText(st), cp = st.copy || null, ex = '<em class="ex">' + esc(t('cx.ex')) + '</em>';
    /* r48: name / label show the value; the public key shows its fingerprint and one button; the IPs one button each */
    var body, btns;
    if (cp === 'pub') { body = ' <code>' + esc(pubFp()) + '</code>' + (pubEx() ? ex : ''); btns = '<button type="button" class="cp" data-copy="pub">' + esc(t('cx.cpPub')) + '</button>'; }
    else if (cp === 'ips') { body = ipsEx() ? ex : ''; btns = ipList().map(function (ip, i) { return '<button type="button" class="cp ip" data-copy="ip" data-i="' + i + '">' + esc(ip) + '</button>'; }).join(''); }
    else if (cp) { body = ' <code>' + esc(cp === 'name' ? B.nameEx : B.labelEx) + '</code>'; btns = '<button type="button" class="cp" data-copy="' + cp + '">' + esc(t('cx.copy')) + '</button>'; }
    else { body = ''; btns = ''; }
    hintEl.innerHTML = '<span>' + esc(txt) + body + '</span>' + (btns ? '<span class="cps">' + btns + '</span>' : '');
    hintEl.hidden = false;
    placeHint();
  }
  function placeHint() {
    if (!HOT || hintEl.hidden) return;
    var r = HOT.getBoundingClientRect(), hw = hintEl.offsetWidth, hh = hintEl.offsetHeight, VW = window.innerWidth, VH = window.innerHeight;
    if (S.mode === 'tut' && !tc.hidden) VH -= tc.offsetHeight; // r48: never over the tutorial controls
    var top0 = stage.getBoundingClientRect().top, G2 = 14, M = 10, x, y;
    var cy = function (v) { return Math.max(top0 + M, Math.min(v, VH - hh - M)); }, cx = function (v) { return Math.max(M, Math.min(v, VW - hw - M)); };
    if (r.right + G2 + hw <= VW - M && !phone()) { x = r.right + G2; y = cy(r.top + r.height / 2 - hh / 2); }
    else if (r.left - G2 - hw >= M && !phone()) { x = r.left - G2 - hw; y = cy(r.top + r.height / 2 - hh / 2); }
    else if (r.bottom + G2 + 22 + hh <= VH - M) { y = r.bottom + G2 + 18; x = cx(r.left + r.width / 2 - hw / 2); } // under the cursor
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
  function demo(st) {
    cur.classList.remove('press');
    var p = aim();
    if (!p || S.hold) { cur.classList.remove('on'); return; }
    cur.classList.add('on');
    if (RM.matches) { putCursor(p, false); return; } // reduced motion: no glide, no automatic moving on
    if (!CUR) putCursor({ x: p.x + 80, y: p.y + 60 }, false);
    later(function () {
      putCursor(p, true);
      later(function () {
        cur.classList.remove('press'); void cur.offsetWidth; cur.classList.add('press');
        if (S.auto) later(function () { auto(); }, DWELL); // r48: only with 自动播放 switched on (off by default)
      }, MOVE);
    }, SETTLE);
  }
  /* automatic: next sub-step, or back to the first sub-step of the SAME big step — never into another big step */
  function auto() {
    var n = subs(S.b).length;
    if (S.s < n - 1) S.s++; else { S.s = 0; S.loops++; }
    render(true);
  }
  /* by hand (the target pressed, or →): next sub-step; from the last one of steps 1–2, the next big step */
  function manual() {
    var n = subs(S.b).length, st = subs(S.b)[S.s];
    if (st.last) return; // step 3's last target is our real submit button: it submits, the demo does not
    if (S.s < n - 1) S.s++; else if (S.b < BIG.length - 1) { S.b++; S.s = 0; S.hold = false; } else return;
    render(true);
  }
  function back() { if (S.s > 0) { S.s--; S.hold = false; render(true); } else if (S.b > 0) { S.b--; S.s = subs(S.b).length - 1; S.hold = false; render(true); } }
  function bigGo(i) { if (i < 0 || i >= BIG.length) return; S.b = i; S.s = 0; S.hold = false; render(true); }
  function subGo(i) { var n = subs(S.b).length; if (i < 0 || i >= n) return; S.s = i; S.hold = false; render(true); }
  /* r48 · open / close the tutorial. Opening always starts at step 1 with autoplay off; closing drops every timer. */
  function openTut() {
    stopAll(); S.mode = 'tut'; S.b = 0; S.s = 0; S.hold = false; S.auto = false; autoEl.checked = false; CUR = null;
    cxw.classList.remove('show'); dim.classList.remove('show');
    render(true);
    try { $('#tcNext').focus({ preventScroll: true }); } catch (x) { /* old browsers */ }
  }
  function closeTut() {
    stopAll(); S.mode = 'intro'; S.auto = false; autoEl.checked = false; S.hold = false;
    render(false); showWindow(true);
    try { cxm.focus({ preventScroll: true }); } catch (x) { /* old browsers */ }
  }
  function setAuto(on) {
    S.auto = !!on && !RM.matches; autoEl.checked = S.auto;
    if (S.mode !== 'tut') return;
    if (S.auto) { S.hold = false; render(false); } else { stopAll(); }
  }
  function nudge() { if (!HOT || RM.matches || HOT.closest('.panel')) return; HOT.classList.remove('nudge'); void HOT.offsetWidth; HOT.classList.add('nudge'); }

  hb.addEventListener('click', function (e) {
    if (e.target.closest('#lg')) { A.setLang(L() === 'en' ? 'zh' : 'en'); return; }
    if (HOT && hb.contains(HOT) && e.target.closest('.hot') === HOT) { manual(); if (e.detail === 0) focusHot(); }
  });
  hb.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === HOT) { e.preventDefault(); manual(); focusHot(); }
  });
  view.addEventListener('click', function (e) {
    if (HOT && view.contains(HOT) && e.target.closest('.hot') === HOT) { manual(); if (e.detail === 0) focusHot(); return; }
    nudge();
  });
  view.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === HOT) { e.preventDefault(); manual(); focusHot(); }
  });
  function focusHot() { if (HOT && !HOT.closest('.panel')) try { HOT.focus({ preventScroll: true }); } catch (x) { HOT.focus(); } }
  $('#big').addEventListener('click', function (e) { var b = e.target.closest('[data-big]'); if (b) bigGo(+b.dataset.big); });
  $('#skip').addEventListener('click', function () { bigGo(S.b + 1); });
  $('#tutGo').addEventListener('click', openTut);
  $('#tcClose').addEventListener('click', closeTut);
  $('#tcPrev').addEventListener('click', function () { back(); });
  $('#tcNext').addEventListener('click', function () { S.hold = false; manual(); });
  $('#dots').addEventListener('click', function (e) { var d = e.target.closest('[data-dot]'); if (d) subGo(+d.dataset.dot); });
  autoEl.addEventListener('change', function () { setAuto(autoEl.checked); });
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || S.mode !== 'tut') return; // r48: the keys belong to the tutorial only
    if (e.key === 'Escape') { e.preventDefault(); closeTut(); return; }
    var tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); S.hold = false; manual(); focusHot(); } else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); focusHot(); }
  });

  /* ---------- step 3: our form. Touching it stops the demo for this big step (it never types or submits) ---------- */
  var F = { name: $('#name'), key: $('#key') };
  var OUR = { key: 1, name: 2 }; // r48: no Secret on the self-generated route
  function takeOver(idx) {
    if (S.mode !== 'tut' || S.b !== 2) return;
    S.hold = true; stopAll(); cur.classList.remove('on', 'press');
    var list = subs(2); if (idx != null && list[idx]) { S.s = idx; }
    document.querySelectorAll('.panel .cue').forEach(function (e) { e.classList.remove('cue'); });
    if (HOT && !HOT.closest('.panel')) { HOT.classList.remove('hot'); HOT.removeAttribute('tabindex'); }
    HOT = null; hintEl.hidden = true;
  }
  Object.keys(OUR).forEach(function (k) {
    F[k].addEventListener('focus', function () { takeOver(OUR[k]); });
    F[k].addEventListener('input', function () { takeOver(OUR[k]); });
  });
  $('#go').addEventListener('pointerdown', function () { takeOver(3); });
  function count(inp, out) { var n = inp.value.trim().length; out.textContent = n + ' / 64'; out.classList.toggle('ok', n === 64 && /^[A-Za-z0-9]+$/.test(inp.value.trim())); }
  var FLD = { name: ['#fName', '#mName'], apiKey: ['#fKey', '#mKey'] };
  function clearErr(k) { $(FLD[k][0]).classList.remove('err'); $(FLD[k][1]).textContent = ''; }
  F.name.addEventListener('input', function () { clearErr('name'); });
  F.key.addEventListener('input', function () { clearErr('apiKey'); count(F.key, $('#nKey')); });
  function res(kind, title, badge, body, actions) {
    var r = $('#res'); r.hidden = false; r.className = 'res ' + kind;
    r.innerHTML = '<div class="rt">' + esc(title) + (badge ? '<span class="bdg">' + esc(badge) + '</span>' : '') + '</div>' + (body || '') + (actions ? '<div class="ract">' + actions + '</div>' : '');
  }
  function wipe() { F.key.value = ''; count(F.key, $('#nKey')); }
  var busy = false;
  $('#f').addEventListener('submit', function (e) {
    e.preventDefault(); if (busy) return; takeOver(3);
    ['name', 'apiKey'].forEach(clearErr);
    var o = { name: F.name.value, apiKey: F.key.value };
    busy = true; var gob = $('#go'); gob.disabled = true; gob.textContent = t('cx.busy');
    /* r48: the self-generated entry (API Key only). The HMAC submitApiCredentials is a separate entry and is not called here. */
    API.submitSelfGeneratedKey(o).then(function (r) {
      o.apiKey = null;
      if (r.status === 'invalid') {
        r.errors.forEach(function (x) { var f = FLD[x.field]; if (!f) return; $(f[0]).classList.add('err'); $(f[1]).textContent = x.message; });
        res('bad', t('cx.rBadT'), '', '');
        var first = r.errors[0] && FLD[r.errors[0].field]; if (first) { var inp = $(first[0] + ' input'); if (inp) inp.focus({ preventScroll: true }); }
        return;
      }
      wipe();
      var acts = '<a class="btn pri sm" href="' + esc(A.routes.app) + '">' + esc(t('cx.toApp')) + '</a>';
      if (r.status === 'service_unavailable') res('', t('cx.rNoSvcT'), t('cx.rNoSvcB'), '<ul><li>' + esc(t('cx.rNoSvcL1')) + '</li><li>' + esc(t('cx.rNoSvcL2')) + '</li></ul>', acts);
      else if (r.status === 'failed') res('bad', t('cx.rFailT'), t('cx.rFailB'), (r.errors || []).length ? '<ul>' + r.errors.map(function (x) { return '<li>' + esc(x.message) + '</li>'; }).join('') + '</ul>' : '', acts);
      else res('busy', t('cx.rOkT'), t('cx.rOkB'), r.message ? '<p>' + esc(r.message) + '</p>' : '', acts); // a real backend may answer checking: never shown as passed here
    }, function (err) {
      o.apiKey = null; wipe();
      res('bad', t('cx.rFailT'), '', '<p>' + esc(err && err.message || '') + '</p>');
    }).then(function () { busy = false; gob.disabled = false; gob.textContent = t('cx.go'); });
  });
  window.addEventListener('pagehide', wipe);

  /* ---------- copy: the suggested name / label, and (r48) the window's public key and IPs. Never an API Key, never a private key. ---------- */
  function toast(s) { var e = $('#toast'); e.textContent = s; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 1800); }
  function execCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (x) { ok = false; } document.body.removeChild(ta); return ok;
  }
  function copyVal(kind, i) {
    if (kind === 'name') return B.nameEx;
    if (kind === 'label') return B.labelEx;
    if (kind === 'pub') return pubPem();
    if (kind === 'ip') return ipList()[+i || 0] || '';
    return '';
  }
  function doCopy(b) {
    var kind = b.dataset.copy, v = copyVal(kind, b.dataset.i); if (!v) return;
    var p = navigator.clipboard && window.isSecureContext && navigator.clipboard.writeText ? navigator.clipboard.writeText(v).then(function () { return true; }, function () { return execCopy(v); }) : Promise.resolve(execCopy(v));
    p.then(function (ok) {
      var said = kind === 'pub' ? t('cx.cpdPub') + (pubEx() ? t('cx.cpdEx') : '') : kind === 'ip' ? t('cx.cpdIp', { v: v }) + (ipsEx() ? t('cx.cpdEx') : '') : t('cx.copied') + '：' + v;
      toast(ok ? said : t('cx.copyFail', { v: kind === 'pub' ? '' : v }));
      if (ok) { b.classList.add('done'); clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove('done'); }, 1600); }
    });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('#hint [data-copy], #cxm [data-copy]'); if (b) doCopy(b); });

  /* ---------- r48 · the binding window ---------- */
  function fillWindow() {
    var sg = SG(), pem = pubPem(), ips = ipList(), perms = KIT ? KIT.perms || [] : [], en = L() === 'en';
    $('#pem').textContent = pem || '…';
    $('#fpv').textContent = pubFp() || '…';
    $('#pubBdg').textContent = pubEx() ? t('cx.ex') : t('cx.live'); $('#pubBdg').className = 'bdg' + (pubEx() ? ' ex' : ' live');
    $('#ipBdg').textContent = ipsEx() ? t('cx.ex') : t('cx.live'); $('#ipBdg').className = 'bdg' + (ipsEx() ? ' ex' : ' live');
    $('#pubNote').textContent = t('cx.pubNote') + (pubEx() ? ' ' + t('cx.pubEx') : '');
    $('#ipNote').textContent = ipsEx() ? t('cx.ipEx') : t('cx.ipLive');
    $('#mDemo').hidden = !(pubEx() || ipsEx());
    $('#ips').innerHTML = ips.map(function (ip, i) {
      return '<div class="ipr"><span class="k">' + esc(t('cx.ipN', { n: i + 1 })) + '</span><code>' + esc(ip) + '</code>' +
        '<button type="button" class="cpb sm" data-copy="ip" data-i="' + i + '" aria-label="' + esc(t('cx.copy') + ' ' + ip) + '">' + esc(t('cx.copy')) + '</button></div>';
    }).join('');
    $('#pms').innerHTML = perms.map(function (p) {
      var no = !!p.forbidden;
      return '<li class="' + (no ? 'no' : p.required ? 'yes' : '') + '"><i aria-hidden="true">' + (no ? '✕' : '✓') + '</i><span>' + esc(en ? p.en : p.zh) + '</span>' +
        '<em>' + esc(no ? t('cx.pmOff') : t('cx.pmOn')) + '</em></li>';
    }).join('');
    $('#mOut').href = URL_.api[L()];
    $('.cpb[data-copy="pub"]').disabled = !pem;
    void sg;
  }
  function showWindow(now) {
    var go = function () { dim.classList.add('show'); cxw.classList.add('show'); };
    if (now || RM.matches) go(); else setTimeout(function () { if (S.mode === 'intro') go(); }, 420);
  }

  /* ---------- boot ---------- */
  function relang() { A.apply(document); icons(); render(false); $('#go').textContent = t(busy ? 'cx.busy' : 'cx.go'); }
  $('#logo').href = A.routes.app; // r46: the logo goes back to the dashboard, not the website
  window.addEventListener(A.events.theme || 'td:theme', function () { document.documentElement.dataset.theme = 'night'; }); // no day here
  icons();
  window.addEventListener(A.events.lang, relang);
  window.addEventListener(A.events.session, function () { if (!A.session()) A.requireUser(location.pathname + location.search); });
  var rz, lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW && document.activeElement && document.activeElement.tagName === 'INPUT') return; // phone keyboard
    lastW = window.innerWidth; clearTimeout(rz); rz = setTimeout(function () { CUR = null; render(false); }, 120);
  });
  if (typeof RM.addEventListener === 'function') RM.addEventListener('change', function () { if (RM.matches) setAuto(false); autoEl.disabled = RM.matches; render(false); });
  autoEl.disabled = RM.matches; if (RM.matches) autoEl.parentNode.title = t('cx.autoRm');
  A.apply(document); render(false); showWindow(false);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!S.hold) render(false); });
  API.getConnectKit().then(function (k) { KIT = k; if (S.mode === 'intro') fillWindow(); if (!S.hold) render(false); });

  /* test hooks: read-only state, plus the same moves a person can make */
  window.__guide = {
    get big() { return S.b; }, get sub() { return S.s; }, get hold() { return S.hold; }, get loops() { return S.loops; },
    get pending() { return TM.length; }, get tok() { return S.tok; }, get target() { return HOT; },
    subs: function (b) { return subs(b == null ? S.b : b).length; },
    big3: function () { return BIG.map(function (x) { return x.id; }); },
    go: function (b, s) { if (S.mode !== 'tut') openTut(); S.b = b; S.s = s || 0; S.hold = false; render(false); },
    tap: manual, back: back, skip: function () { bigGo(S.b + 1); }, bigGo: bigGo,
    /* r48 */
    get mode() { return S.mode; }, get auto() { return S.auto; },
    open: openTut, close: closeTut, setAuto: setAuto, subGo: subGo
  };
})();
