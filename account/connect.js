/* 3dtrading r44 · 添加币安账户 (connect.html) — the page is our own coded Binance front end; click the lit control to go on.
 * The viewport is the coded Binance replica (an illustration, never the live site and never an iframe). Everything but the
 * field to act on is dimmed; the guide sits on top; where Binance asks for something we supply, our copy chip sits on that
 * field, and where Binance hands the user something, our input sits there instead.
 * Key types (Binance docs, checked 2026-11-15): 「系统生成」= HMAC → Binance returns API Key + Secret Key;
 * 「自行生成」= Ed25519 / RSA → the user gives Binance a PUBLIC key and Binance returns only an API Key (no Secret).
 * 3dtrading has no public key configured yet (TDApi.getConnectKit().selfGenerated.supported === false), so the copy is
 * disabled and says 「未配置」; the private key never exists in the front end. The server IP allow-list is likewise
 * 「未配置」(allowIps null) — the documentation-range demo IPs are never shown or copied.
 * The Secret lives only in its input until submit; it is never written to storage, logs or the URL, and every input is
 * cleared after submit and on pagehide. With no verification service the result is always 「未连接」. */
(function () {
  'use strict';
  var A = window.TDAccount, API = window.TDApi, B = window.TD_BIND, BN = window.TD_BN;
  var $ = function (s) { return document.querySelector(s); };
  if (!A || !A.requireUser()) return;
  A.i18n({
    zh: {
      'cx.h1': '添加币安账户', 'cx.back': '返回后台', 'cx.tag': '操作示意', 'cx.open': '在币安打开', 'cx.prev': '上一步', 'cx.stageL': '币安操作示意（不是真实币安页面）', 'cx.copy': '复制',
      'cx.step': '第 {n} / {N} 步', 'cx.copied': '已复制', 'cx.copiedT': '已复制：{v}',
      'cx.copyFail': '浏览器没让复制。下面的框已全选，请按 Ctrl/⌘+C（手机长按）手动复制。',
      'cx.nameL': '子账户名称 · 复制后粘到这里', 'cx.labelL': 'API 标签 · 复制后粘到这里', 'cx.pubL': '3dtrading 公钥 · 复制到这里', 'cx.ipsL': 'IP 白名单 · 填到这里',
      'cx.unset': '未配置', 'cx.pubUnset': '未配置：3dtrading 还没有可给币安的公钥', 'cx.ipsUnset': '未配置：3dtrading 服务器 IP 还没确定',
      'cx.toSys': '改用系统生成',
      'cx.keyIn': '把币安的 API Key 粘贴到这里', 'cx.keyPh': '粘贴 64 位 API Key', 'cx.keyHint': '在币安点「复制」后粘贴；不会保存', 'cx.secIn': '把 Secret Key 粘贴到这里',
      'cx.secPh': '粘贴 64 位 Secret Key', 'cx.secHint': '请妥善保存；这里不保存', 'cx.show': '显示 Secret Key', 'cx.hide': '隐藏 Secret Key',
      'cx.name': '账户名称（在 3dtrading 里显示）', 'cx.namePh': '例如 3dtUSDT01', 'cx.go': '连接并验证', 'cx.busy': '正在检查…',
      'cx.sName': '名称', 'cx.sType': 'API 类型', 'cx.tSys': '系统生成（HMAC）', 'cx.tSelf': '自行生成（Ed25519 / RSA）', 'cx.sKey': 'API Key', 'cx.sSec': 'Secret Key',
      'cx.sPub': '3dtrading 公钥', 'cx.sIps': '服务器 IP 白名单', 'cx.sSvc': '验证服务', 'cx.filled': '已填 {n} 位', 'cx.empty': '未填', 'cx.noSvc': '未接入',
      'cx.safe': '演示版：安全验证服务还没接入。点「连接并验证」只检查格式，Key 和 Secret 不会发送到任何地方，也不保存在浏览器；账户不会显示为已连接。',
      'cx.rBusyT': '正在检查', 'cx.rBusyP': '正在检查格式…',
      'cx.rNoSvcT': '账户未连接', 'cx.rNoSvcB': '验证服务未接入', 'cx.rNoSvcL1': '填写的内容没有发送、没有保存，输入框已清空。', 'cx.rNoSvcL2': '后台会继续显示「未连接」，金额都是 0。', 'cx.rNoSvcL3': '服务上线后，重新填写一次即可连接。',
      'cx.rNoPubB': '公钥未配置',
      'cx.rBadT': '请检查标出的输入', 'cx.rFailT': '连接失败', 'cx.rFailB': '未通过', 'cx.again': '重新填写', 'cx.toApp': '返回后台',
      'cx.rOkT': '已提交，等待验证结果', 'cx.rOkB': '验证中', 'cx.goFix': '去修改'
    },
    en: {
      'cx.h1': 'Add a Binance account', 'cx.back': 'Back to dashboard', 'cx.tag': 'Illustration', 'cx.open': 'Open on Binance', 'cx.prev': 'Back', 'cx.stageL': 'Binance walkthrough (an illustration, not the real Binance site)', 'cx.copy': 'Copy',
      'cx.step': 'Step {n} of {N}', 'cx.copied': 'Copied', 'cx.copiedT': 'Copied: {v}',
      'cx.copyFail': 'The browser blocked copying. The box below is selected — press Ctrl/⌘+C (long-press on a phone) to copy it.',
      'cx.nameL': 'Sub-account name · copy, then paste here', 'cx.labelL': 'API label · copy, then paste here', 'cx.pubL': '3dtrading public key · copy it here', 'cx.ipsL': 'IP allow-list · enter here',
      'cx.unset': 'Not configured', 'cx.pubUnset': 'Not configured: 3dtrading has no public key for Binance yet', 'cx.ipsUnset': 'Not configured: 3dtrading’s server IPs are not set yet',
      'cx.toSys': 'Use System generated instead',
      'cx.keyIn': 'Paste Binance’s API Key here', 'cx.keyPh': 'Paste the 64-character API Key', 'cx.keyHint': 'Click Copy on Binance, then paste; not stored', 'cx.secIn': 'Paste the Secret Key here',
      'cx.secPh': 'Paste the 64-character Secret Key', 'cx.secHint': 'Keep it safe; not stored here', 'cx.show': 'Show Secret Key', 'cx.hide': 'Hide Secret Key',
      'cx.name': 'Account name (shown in 3dtrading)', 'cx.namePh': 'e.g. 3dtUSDT01', 'cx.go': 'Connect and verify', 'cx.busy': 'Checking…',
      'cx.sName': 'Name', 'cx.sType': 'API type', 'cx.tSys': 'System generated (HMAC)', 'cx.tSelf': 'Self-generated (Ed25519 / RSA)', 'cx.sKey': 'API Key', 'cx.sSec': 'Secret Key',
      'cx.sPub': '3dtrading public key', 'cx.sIps': 'Server IP allow-list', 'cx.sSvc': 'Verification service', 'cx.filled': '{n} characters', 'cx.empty': 'Empty', 'cx.noSvc': 'Not connected',
      'cx.safe': 'Demo build: the secure verification service is not connected. “Connect and verify” only checks the format; nothing is sent anywhere or stored in the browser, and the account will not show as connected.',
      'cx.rBusyT': 'Checking', 'cx.rBusyP': 'Checking the format…',
      'cx.rNoSvcT': 'Account not connected', 'cx.rNoSvcB': 'Verification service missing', 'cx.rNoSvcL1': 'Nothing you entered was sent or saved, and the fields have been cleared.', 'cx.rNoSvcL2': 'The dashboard keeps showing “Not connected” with all amounts at 0.', 'cx.rNoSvcL3': 'Once the service is live, enter them again to connect.',
      'cx.rNoPubB': 'Public key not configured',
      'cx.rBadT': 'Please check the marked fields', 'cx.rFailT': 'Connection failed', 'cx.rFailB': 'Not passed', 'cx.again': 'Enter again', 'cx.toApp': 'Back to dashboard',
      'cx.rOkT': 'Submitted, waiting for verification', 'cx.rOkB': 'Verifying', 'cx.goFix': 'Fix it'
    }
  });
  var t = function (k, v) { var s = A.t(k); if (v) Object.keys(v).forEach(function (n) { s = s.split('{' + n + '}').join(v[n]); }); return s; };
  var L = function () { return A.lang() === 'en' ? 'en' : 'zh'; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var RM = window.matchMedia('(prefers-reduced-motion:reduce)');
  var IC = {
    eye: '<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-3 3.6M6.4 7.5C3.9 9.2 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>'
  };
  var KIT = null;
  /* what the replica may show: our values are only the suggested name / label; no IPs (allowIps is null), and the public-key
   * row says 未配置 rather than a fingerprint or placeholder */
  function cfg() { return { nameEx: B.nameEx, labelEx: B.labelEx, keyEx: B.keyEx, secretEx: B.secretEx, pubText: t('cx.unset'), kit: { perms: KIT ? KIT.perms : [], ips: [] } }; }
  function pubKey() { var s = KIT && KIT.selfGenerated; return s && s.supported && s.publicKey ? s.publicKey : null; }
  function allowIps() { return KIT && KIT.allowIps && KIT.allowIps.length ? KIT.allowIps : null; }

  /* Binance's own pages (need the user's own Binance login; we never ask for it). Not verified while signed out. */
  var URL_ = {
    sub: { zh: 'https://www.binance.com/zh-CN/my/sub-account/account-management', en: 'https://www.binance.com/en/my/sub-account/account-management' },
    api: { zh: 'https://www.binance.com/zh-CN/my/settings/api-management', en: 'https://www.binance.com/en/my/settings/api-management' }
  };

  /* ---------- the steps ----------
   * r44 · no guide card and no 下一步 button: each step lists the Binance controls to click, in order (`taps`, one per
   * phase). The lit one is a real button inside the replica — clicking it (or Enter / Space on it) moves on. A step whose
   * first phase opens something (avatar menu, ··· dropdown, 创建API dialog) starts with that thing closed (#bn[data-ph=0]). */
  var G = BN.guide, S = { i: 0, ph: 0, kind: 'hmac' };
  function sc(o) { return function (l, c) { return o.html(l, c); }; }
  var COMMON = [
    { id: 'home', url: 'sub', h: G.home.h, html: sc(G.home),
      taps: ['[data-t="av"]', '[data-t="subacc"]'], tz: ['点右上角头像', '点「子账户」'], te: ['Click the avatar at the top right', 'Click Sub Accounts'],
      zh: ['在币安打开「子账户」', '在电脑浏览器里<b>由你本人登录币安主账户</b>。3dtrading 不会要你的币安密码。'],
      en: ['Open Sub Accounts on Binance', '<b>Sign in to your main Binance account yourself</b> in a desktop browser. 3dtrading never asks for your Binance password.'] },
    { id: 'create', url: 'sub', h: G.create.h, html: sc(G.create),
      taps: ['[data-t="create"]'], tz: ['点「+ 创建子账户」'], te: ['Click + Create Sub Account'],
      zh: ['创建子账户', '在「子账户 → 账户管理」里创建。策略只在这个子账户里运行。'],
      en: ['Create a sub-account', 'In Sub Accounts → Account Management. The strategy runs only inside this sub-account.'] },
    { id: 'vmail', url: 'sub', h: G.vmail.h, html: sc(G.vmail), slots: [['name', 'wName']],
      taps: ['[data-t="ok"]'], tz: ['粘好名称后点「确认」'], te: ['Paste the name, then click Confirm'],
      zh: ['用虚拟邮箱创建', '类型选「虚拟邮箱创建」，名称处<b>复制我们给的名称</b>粘贴进去。'],
      en: ['Create with a virtual email', 'Choose “Create with virtual email” and <b>copy our name</b> into the name field.'] },
    { id: 'futures', url: 'sub', h: G.futures.h, html: sc(G.futures),
      taps: ['.bn-tr .more', '[data-t="dd"]'], tz: ['点这一行最右侧「···」', '点「允许合约」并确认'], te: ['Click “···” at the end of the row', 'Click Enable Futures and confirm'],
      zh: ['允许合约', '在新子账户这一行打开更多操作，<b>允许合约</b>。'],
      en: ['Enable futures', 'Open more actions on the new sub-account’s row and <b>enable futures</b>.'] },
    { id: 'pm', url: 'sub', h: G.pm.h, html: sc(G.pm),
      taps: ['.bn-tr .more', '[data-t="dd"]'], tz: ['再点「···」', '点「统一账户」开通'], te: ['Click “···” again', 'Click Portfolio Margin to enable it'],
      zh: ['开通统一账户', '同一处开通「<b>统一账户</b>」。币安会要求先完成统一账户激活和资格确认，这些都在币安完成。'],
      en: ['Enable Portfolio Margin', 'From the same menu enable <b>Portfolio Margin</b>. Binance asks you to finish its activation and eligibility checks there first.'] },
    { id: 'type', url: 'api', h: 640, branch: true, html: function (l) { return G.type(l, S.kind); }, slots: [[function () { return S.kind === 'self' ? 'optSelf' : 'optSys'; }, null]],
      taps: ['.bn-newapi', '[data-t="next"]'], tz: ['左侧「API管理」，点右上角「+ 创建API」', '点选一种类型，再点「下一步」'], te: ['In API Management, click + Create API', 'Pick a type, then click Next'],
      zh: ['创建 API，选密钥类型', '<b>系统生成（HMAC）</b>：币安给 API Key 和 Secret Key，本页现在就能走完。<b>自行生成（Ed25519 / RSA）</b>：需要 3dtrading 的公钥，目前<b>未配置</b>。'],
      en: ['Create an API key and pick its type', '<b>System generated (HMAC)</b>: Binance gives an API Key and a Secret Key — works with this page today. <b>Self-generated (Ed25519 / RSA)</b>: needs 3dtrading’s public key, <b>not configured</b> yet.'] },
    { id: 'label', url: 'api', h: G.label.h, html: sc(G.label), slots: [['label', 'wLabel']],
      taps: ['[data-t="next2"]'], tz: ['粘好标签后点「下一步」'], te: ['Paste the label, then click Next'],
      zh: ['选子账户、填标签', '选刚创建的子账户，标签处<b>复制我们给的标签</b>粘贴进去；下一步后由你本人完成币安的安全验证。'],
      en: ['Pick the sub-account and label', 'Pick the new sub-account and <b>copy our label</b> into the label field; after Next, pass Binance’s security check yourself.'] }
  ];
  var SELF = [
    { id: 'pub', url: 'api', h: 700, html: function (l, c) { return G.pub(l, c); }, slots: [['pub', 'wPub']],
      taps: ['[data-t="next3"]'], tz: ['粘好公钥后点「下一步」'], te: ['Paste the public key, then click Next'],
      zh: ['把 3dtrading 公钥粘到币安', '「自行生成」要把<b>3dtrading 的公钥</b>粘到这个框（只有公钥，私钥永远不出我们的服务器）。公钥目前<b>未配置</b>，这条路还走不通，请改用系统生成。'],
      en: ['Paste 3dtrading’s public key into Binance', 'Self-generated keys need <b>3dtrading’s public key</b> in this box (only the public key — the private key never leaves our server). It is <b>not configured</b> yet, so this path cannot finish; use System generated instead.'] },
    { id: 'selfKeys', url: 'api', h: 860, html: function (l, c) { return G.selfKeys(l, c); }, slots: [['key', 'wKey']],
      taps: ['.bn-edit'], tz: ['粘好 API Key 后点「编辑权限」'], te: ['Paste the API Key, then click Edit restrictions'],
      zh: ['复制 API Key，粘到这里', '币安生成 API Key 后点「复制」，<b>粘贴到这个框</b>。自行生成的密钥<b>没有 Secret Key</b>。'],
      en: ['Copy the API Key and paste it here', 'When Binance shows the API Key, click Copy and <b>paste it into this box</b>. A self-generated key has <b>no Secret Key</b>.'] }
  ];
  var SYS = [
    { id: 'sysKeys', url: 'api', h: 860, html: function (l, c) { return G.sysKeys(l, c); }, slots: [['key', 'wKey'], ['sec', 'wSec']],
      taps: ['.bn-edit'], tz: ['两项都粘好后点「编辑权限」'], te: ['Paste both, then click Edit restrictions'],
      zh: ['复制 API Key 和 Secret Key', '安全验证后币安显示两项。分别在币安点「复制」，<b>粘贴到对应的框</b>。完成这一步前请妥善保存 Secret Key，并按币安页面的实际提示操作。'],
      en: ['Copy the API Key and Secret Key', 'After the security check Binance shows both. Click Copy on each and <b>paste it into the matching box</b>. Keep the Secret Key safe before you leave this step, and follow what Binance’s page tells you.'] }
  ];
  var TAIL = [
    { id: 'perm', url: 'api', h: 930, html: function (l, c) { return G.perm(l, c, S.kind); }, slots: [['ips', 'wIps']],
      taps: ['[data-t="ipok"]'], tz: ['设好权限和 IP 后点「确认」'], te: ['Set permissions and IPs, then click Confirm'],
      /* r43 · the unrestricted-IP rule is type-specific: Binance's FAQ states it for HMAC keys only, so the self-generated
       * branch must not claim a permission limit the official pages do not state (see BINANCE-SOURCES.md). */
      get zh() { return ['权限与 IP 白名单', '只勾选亮着的权限，<b>提现必须关闭</b>；选「只访问受信任的 IP」。3dtrading 服务器 IP <b>未配置</b>，所以这里没有可复制的 IP；' +
        (S.kind === 'self' ? '自行生成密钥在不限 IP 时有哪些权限，币安官方页面未写明，请按币安页面的实际提示操作。' : '币安说明：不限 IP 的 HMAC（系统生成）密钥只有读取权限。')]; },
      get en() { return ['Permissions and trusted IPs', 'Tick only the highlighted permissions; <b>Withdrawals stay off</b>. Choose “Restrict access to trusted IPs only”. 3dtrading’s server IPs are <b>not configured</b>, so there is nothing to copy yet; ' +
        (S.kind === 'self' ? 'Binance’s pages do not state what an unrestricted-IP self-generated key may do, so follow what Binance’s page tells you.' : 'per Binance, an unrestricted-IP HMAC (system-generated) key can only read.')]; } },
    { id: 'verify', final: true, h: 930, html: function (l, c) { return G.perm(l, c, S.kind); }, slots: [[null, 'wFin']], taps: [],
      zh: ['填写名称并验证', '最后在 3dtrading 这边起个名字，检查填写情况，点「连接并验证」。'],
      en: ['Name it and verify', 'Give the account a name in 3dtrading, check what you entered and click Connect and verify.'] }
  ];
  function steps() { return COMMON.concat(S.kind === 'self' ? SELF : SYS, TAIL); }
  function phases(st) { return (st.taps || []).length; }

  /* ---------- layout: camera on the lit control, spotlight, callout beside it, our controls on the Binance fields ---------- */
  var gd = $('#gd'), stage = $('#stage'), bn = $('#bn'), spot = $('#spot'), tip = $('#tip'), slots = $('#slots'), pool = $('#pool'), ctl = $('#cCtl');
  var lastTr = '', HOT = null, PHW = 560; // phone: frame at most 560 replica px across, so text stays readable; the lit control is kept on screen
  function sheet() { return window.innerWidth < 760 || window.innerHeight < 560; }
  function boxIn(el) { var r = el.getBoundingClientRect(), b = bn.getBoundingClientRect(); return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height }; }
  function shown(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function union(a, b) { if (!a) return b; if (!b) return a; var x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x: x, y: y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }; }
  function slotName(s) { return typeof s[0] === 'function' ? s[0]() : s[0]; }
  function hint(st) { var a = st[L() === 'en' ? 'te' : 'tz']; return a ? a[S.ph] || '' : ''; }

  function render(anim) {
    var list = steps(); S.i = Math.max(0, Math.min(S.i, list.length - 1));
    var st = list[S.i], l = L(), sh = sheet(), np = phases(st); S.ph = Math.max(0, Math.min(S.ph, Math.max(0, np - 1)));
    var lastPh = S.ph === np - 1 || !np;
    gd.classList.toggle('sheet', sh);
    tip.classList.toggle('final', !!st.final);
    /* the callout */
    $('#cN').textContent = t('cx.step', { n: S.i + 1, N: list.length });
    $('#cT').textContent = st[l][0].replace(/<[^>]+>/g, '');
    $('#cP').innerHTML = st[l][1];
    var out = $('#cOut'); out.hidden = !st.url; if (st.url) out.href = URL_[st.url][l];
    $('#prev').disabled = S.i === 0 && S.ph === 0;
    $('#cBar').innerHTML = list.map(function (x, k) { return '<i class="' + (k === S.i ? 'on' : k < S.i ? 'done' : '') + '"></i>'; }).join('');
    var hx = hint(st), hEl = $('#cHint');
    hEl.textContent = hx; hEl.hidden = !hx;
    /* park every control; this step's ones come out on its last phase only (before that their Binance field is closed) */
    Array.prototype.forEach.call(document.querySelectorAll('.w'), function (w) { w.classList.remove('on'); w.removeAttribute('style'); pool.appendChild(w); });
    if (st.id === 'verify') summary();
    var inTip = !!st.final; // r44b: phones too keep the copy chips / inputs in their Binance field; only the last step's form is ours
    if (inTip && lastPh) (st.slots || []).forEach(function (s2) { if (s2[1]) { var w0 = document.getElementById(s2[1]); ctl.appendChild(w0); w0.classList.add('on'); } });
    /* the replica at its natural width; measure with no transform, then animate to the new camera */
    var prev = lastTr;
    bn.style.transition = 'none'; bn.style.transform = 'none'; bn.style.width = BN.width + 'px'; bn.style.height = 'auto';
    bn.setAttribute('data-ph', String(S.ph)); if (np < 2) bn.removeAttribute('data-ph');
    bn.innerHTML = st.html(l, cfg());
    /* our controls are taller than Binance's one-line fields: make each field that holds one tall enough first, so the
     * control never covers the next row (or the lit button) */
    var sG = Math.min(1.3, stage.clientWidth / BN.width);
    if (sh) { // phone: the camera zooms to the lit part, so estimate that zoom from the un-enlarged fields + the lit control
      var f0 = null; (st.slots || []).forEach(function (s0) { var n0 = slotName(s0); var e0 = n0 && bn.querySelector('[data-slot="' + n0 + '"]'); if (e0 && shown(e0)) f0 = union(f0, boxIn(e0)); });
      var h0 = np ? bn.querySelector(st.taps[S.ph]) : null; if (h0 && shown(h0)) f0 = union(f0, boxIn(h0));
      if (!st.final) Array.prototype.forEach.call(bn.querySelectorAll('[data-focus]'), function (fe) { // same framing rule as below
        if (!shown(fe)) return;
        if (h0 && !fe.contains(h0) && !(lastPh && (st.slots || []).some(function (s0) { var n0 = slotName(s0); return n0 && fe.querySelector('[data-slot="' + n0 + '"]'); }))) return;
        f0 = union(f0, boxIn(fe));
      });
      sG = f0 ? Math.min(1, (stage.clientWidth - 24) / (Math.min(f0.w, PHW) + 32)) : 1;
    }
    if (lastPh && !inTip) (st.slots || []).forEach(function (s2) {
      var n = slotName(s2), id = s2[1]; if (!n || !id) return; var el = bn.querySelector('[data-slot="' + n + '"]'); if (!el || !shown(el)) return;
      var w = document.getElementById(id); slots.appendChild(w); w.classList.add('on');
      w.style.left = '-9999px'; w.style.top = '0'; w.style.width = Math.round(Math.min(Math.max(el.getBoundingClientRect().width * sG + 12, sh ? 0 : 300), stage.clientWidth - 24)) + 'px';
      var need = (w.offsetHeight - 12) / sG; if (need > el.getBoundingClientRect().height) { el.style.height = 'auto'; el.style.minHeight = Math.ceil(need) + 'px'; el.style.boxSizing = 'border-box'; el.style.marginBottom = Math.ceil(26 / sG) + 'px'; /* keeps the next row's lit button and its 48 px touch area clear */ }
    });
    var H = Math.max(st.h || 640, bn.scrollHeight); bn.style.height = H + 'px';
    var f = null, slotBox = {};
    if (lastPh) (st.slots || []).forEach(function (s) { var n = slotName(s); if (!n) return; var el = bn.querySelector('[data-slot="' + n + '"]'); if (el && shown(el)) { slotBox[n] = boxIn(el); f = union(f, slotBox[n]); } });
    HOT = np ? bn.querySelector(st.taps[S.ph]) : null;
    if (HOT) {
      HOT.classList.add('hot'); HOT.setAttribute('tabindex', '0'); HOT.setAttribute('role', 'button'); HOT.setAttribute('aria-label', hx);
      f = union(f, boxIn(HOT));
    }
    if (!st.final) Array.prototype.forEach.call(bn.querySelectorAll('[data-focus]'), function (fe) {
      if (!shown(fe)) return;
      // a closed step (phase 0) only frames what is open; the key page frames only its own part
      if (HOT && !fe.contains(HOT) && !(lastPh && Object.keys(slotBox).some(function (n) { return fe.querySelector('[data-slot="' + n + '"]'); }))) return;
      f = union(f, boxIn(fe));
    });
    if (st.branch && lastPh) Array.prototype.forEach.call(bn.querySelectorAll('.bn-opt[data-slot]'), function (o) {
      var on = o.dataset.slot === (S.kind === 'self' ? 'optSelf' : 'optSys');
      o.setAttribute('tabindex', '0'); o.setAttribute('role', 'radio'); o.setAttribute('aria-checked', String(on));
    });
    if (!f) f = { x: 0, y: 0, w: BN.width, h: H };
    /* where the user can see the replica: under the bar (desktop) or between the bar and the docked callout (phone) */
    var W = stage.clientWidth, SH = stage.clientHeight, bar = document.querySelector('.bar').offsetHeight;
    var top = bar, bot = sh && !st.final ? SH - tip.offsetHeight - 30 : SH; // phone: leave room under the lit part for the hint
    var avH = Math.max(110, bot - top - 24);
    var s = sh ? (st.final ? Math.min(1, (W - 24) / (f.w + 32), avH / (f.h + 32)) : Math.min(sG, (W - 24) / (Math.min(f.w, PHW) + 32))) /* phone: zoom by width only, so the fields stay readable and match the controls laid on them */ : Math.min(1.3, W / BN.width, avH / (f.h + 32)); // fill the width (may enlarge a little); never smaller than needed to show the focus
    if (st.final && !sh) s = Math.min(1.3, W / BN.width);
    // last step: the dimmed Binance page still fills the screen behind our panel
    var cx = (f.x + f.w / 2) * s, cy = (f.y + f.h / 2) * s, cw = BN.width * s;
    var tx = cw <= W ? (W - cw) / 2 : Math.max(W - cw, Math.min(0, W / 2 - cx));
    if (f.w * s + 24 > W || cx + tx < 12 || cx + tx > W - 12) tx = W / 2 - cx;
    if (sh && HOT) { // phone: the lit control's 48 px touch area must not run off the screen edge
      var hb0 = boxIn(HOT), hcx = (hb0.x + hb0.w / 2) * s + tx;
      if (hcx > W - 26) tx -= hcx - (W - 26); else if (hcx < 26) tx += 26 - hcx;
    }
    var ty = top + 12 + avH / 2 - cy, ch = H * s;
    if (sh && f.h * s > avH) { // phone, tall focus: start at its top, but the lit control must stay on screen above the hint
      ty = top + 12 - f.y * s;
      if (HOT) { var hb = boxIn(HOT), hy = (hb.y + hb.h) * s + ty; if (hy > bot - 30) ty -= hy - (bot - 30); }
    }
    /* keep the page filling the screen (no empty band above or below it) whenever the focus still sits in view */
    var tyC = Math.max(SH - ch, Math.min(bar, ty)), fy0 = f.y * s + tyC, fy1 = fy0 + f.h * s;
    if (fy0 >= top + 6 && fy1 <= bot - 6) ty = tyC;
    var tr = 'translate(' + Math.round(tx) + 'px,' + Math.round(ty) + 'px) scale(' + s.toFixed(4) + ')';
    var moving = anim && prev && !RM.matches;
    bn.style.transform = moving ? prev : tr; void bn.offsetWidth;
    bn.style.transition = RM.matches ? 'none' : ''; bn.style.transform = tr; lastTr = tr;
    bn.style.setProperty('--hs', (1 / s).toFixed(4)); // the lit control's touch area is ≥44 px on screen at any zoom
    stage.scrollTop = 0; stage.scrollLeft = 0;
    /* our controls on the Binance field (desktop, stacked if two would overlap) */
    var lit = { x: f.x * s + tx, y: f.y * s + ty, w: f.w * s, h: f.h * s }, below = -1e9;
    if (st.final) lit = { x: W / 2, y: SH / 2, w: 0, h: 0 }; // last step: nothing on Binance is lit; the whole page is dimmed
    (st.slots || []).forEach(function (s2) {
      var id = s2[1]; if (!id || inTip || !lastPh) return; var w = document.getElementById(id), n = slotName(s2), b = n && slotBox[n];
      if (!b) { ctl.appendChild(w); w.classList.add('on'); return; }
      slots.appendChild(w);
      var left = b.x * s + tx - 6, wide = Math.max(b.w * s + 12, sh ? 0 : 300); wide = Math.min(wide, W - 24); left = Math.max(12, Math.min(left, W - 12 - wide));
      var y = Math.max(b.y * s + ty - 6, below + 8);
      w.style.left = Math.round(left) + 'px'; w.style.top = Math.round(y) + 'px'; w.style.width = Math.round(wide) + 'px';
      w.style.minHeight = Math.round(b.h * s + 12) + 'px';
      w.classList.add('on');
      below = y + w.offsetHeight;
      lit = union(lit, { x: left, y: y, w: wide, h: w.offsetHeight });
    });
    /* spotlight over the lit control (and our controls on it), in screen coordinates */
    var P = 8;
    spot.classList.toggle('none', !!st.final);
    if (!moving) spot.style.transition = 'none';
    spot.style.transform = 'translate(' + Math.round(lit.x - P) + 'px,' + Math.round(lit.y - P) + 'px)';
    spot.style.width = Math.round(lit.w + 2 * P) + 'px'; spot.style.height = Math.round(lit.h + 2 * P) + 'px';
    if (!moving) { void spot.offsetWidth; spot.style.transition = ''; }
    fillCopies();
    placeTip(st, lit, W, SH, bar, sh, moving);
    if (window.__guideHook) window.__guideHook(st.id, S.ph);
  }
  /* the callout goes beside the lit area: right, left, below, above — whichever fits first — never on top of it */
  function placeTip(st, lit, W, SH, bar, sh, moving) {
    tip.removeAttribute('data-side');
    if (!moving) tip.style.transition = 'none';
    if (st.final) {
      var fw = tip.offsetWidth, fh = tip.offsetHeight;
      tip.style.left = Math.round((W - fw) / 2) + 'px'; tip.style.top = Math.round(Math.max(bar + 16, Math.min(bar + (SH - bar - fh) / 2, SH - fh - 16))) + 'px';
    } else {
      var tw = tip.offsetWidth, th = tip.offsetHeight, G2 = 18, M = 12, P = 8;
      var L0 = lit.x - P, T0 = lit.y - P, R0 = lit.x + lit.w + P, B0 = lit.y + lit.h + P;
      var clampY = function (y) { return Math.max(bar + 8, Math.min(y, SH - th - M)); };
      var clampX = function (x) { return Math.max(M, Math.min(x, W - tw - M)); };
      var x, y, side;
      if (R0 + G2 + tw <= W - M) { side = 'right'; x = R0 + G2; y = clampY(T0); }
      else if (L0 - G2 - tw >= M) { side = 'left'; x = L0 - G2 - tw; y = clampY(T0); }
      else if (B0 + G2 + th <= SH - M) { side = 'below'; y = B0 + G2; x = clampX(L0); }
      else if (T0 - G2 - th >= bar + 8) { side = 'above'; y = T0 - G2 - th; x = clampX(L0); }
      else { side = ''; x = W - tw - M; y = SH - th - M; }
      tip.style.left = Math.round(x) + 'px'; tip.style.top = Math.round(y) + 'px';
      if (side) {
        tip.setAttribute('data-side', side);
        var hc = HOT ? HOT.getBoundingClientRect() : null;
        var a = side === 'right' || side === 'left' ? (hc ? hc.top + hc.height / 2 : T0 + 20) - y - 5 : (hc ? hc.left + hc.width / 2 : L0 + 20) - x - 5;
        var lim = side === 'right' || side === 'left' ? th : tw;
        tip.style.setProperty('--a', Math.round(Math.max(14, Math.min(a, lim - 20))) + 'px');
      }
    }
    if (!moving) { void tip.offsetWidth; tip.style.transition = ''; }
  }
  /* the last step's panel changes height when a result appears: keep it inside the screen */
  function refit() {
    if (!tip.classList.contains("final")) return;
    var bar = document.querySelector('.bar').offsetHeight, SH = stage.clientHeight, fh = tip.offsetHeight;
    tip.style.top = Math.round(Math.max(bar + 16, Math.min(bar + (SH - bar - fh) / 2, SH - fh - 16))) + 'px';
  }
  function go(i, anim, ph) { var n = steps().length; if (i < 0 || i >= n) return; S.i = i; S.ph = ph || 0; render(anim !== false); }
  /* clicking the lit Binance control: next phase of this step, or the next step */
  function activate(kb) {
    var st = steps()[S.i];
    if (st.final) return;
    if (S.ph < phases(st) - 1) { S.ph++; render(true); } else go(S.i + 1);
    if (kb) focusHot();
  }
  function back(kb) {
    if (S.ph > 0) { S.ph--; render(true); }
    else if (S.i > 0) { var p = steps()[S.i - 1]; go(S.i - 1, true, Math.max(0, phases(p) - 1)); }
    if (kb) focusHot();
  }
  function focusHot() { var el = HOT || $('#name'); if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } stage.scrollTop = 0; } }
  function nudge() { if (!HOT || RM.matches) return; HOT.classList.remove('nudge'); void HOT.offsetWidth; HOT.classList.add('nudge'); }
  function setKind(k) {
    if (k === S.kind) return;
    S.kind = k;
    if (k === 'self') { F.sec.value = ''; eye(false); count(F.sec, $('#nSec')); } // a self-generated key has no Secret: never hold one
    render(true);
  }
  bn.addEventListener('click', function (e) {
    var st = steps()[S.i];
    var o = st.branch && e.target.closest('.bn-opt[data-slot]');
    if (o && S.ph === phases(st) - 1) { setKind(o.dataset.slot === 'optSelf' ? 'self' : 'hmac'); var o2 = bn.querySelector('[data-slot="' + o.dataset.slot + '"]'); if (o2 && e.detail === 0) o2.focus({ preventScroll: true }); return; }
    if (HOT && e.target.closest('.hot') === HOT) { activate(e.detail === 0); return; }
    nudge();
  });
  bn.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target; if (!el || !bn.contains(el)) return;
    if (el === HOT || el.classList.contains('bn-opt')) { e.preventDefault(); el.click(); }
  });
  $('#prev').addEventListener('click', function () { back(false); });
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); activate(true); } else if (e.key === 'ArrowLeft') { e.preventDefault(); back(true); }
  });

  /* ---------- copy: real result, with a manual fallback ---------- */
  var VAL = { name: function () { return B.nameEx; }, label: function () { return B.labelEx; } };
  function fillCopies() {
    $('#wNameL').textContent = t('cx.nameL'); $('#wNameV').textContent = B.nameEx;
    $('#wLabelL').textContent = t('cx.labelL'); $('#wLabelV').textContent = B.labelEx;
    var pk = pubKey(), pb = $('#pubCopy');
    $('#wPubV').textContent = pk || t('cx.pubUnset'); pb.disabled = !pk; $('#wPub .cp').classList.toggle('off', !pk);
    if (pk) pb.setAttribute('data-copy', 'pub'); else pb.removeAttribute('data-copy');
    $('#wPubM').innerHTML = pk ? '' : '<button type="button" class="btn ghost sm" data-kind-to="hmac">' + esc(t('cx.toSys')) + '</button>';
    var ips = allowIps(), ib = $('#wIps .btn');
    $('#wIpsV').textContent = ips ? ips.join(' ') : t('cx.ipsUnset'); ib.disabled = !ips; $('#wIps .cp').classList.toggle('off', !ips);
    if (ips) ib.setAttribute('data-copy', 'ips'); else ib.removeAttribute('data-copy');
  }
  VAL.pub = function () { return pubKey(); };
  VAL.ips = function () { var x = allowIps(); return x ? x.join(' ') : null; };
  function toast(s) { var e = $('#toast'); e.textContent = s; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 1800); }
  function execCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta); ta.select(); var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta); return ok;
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return execCopy(text); });
    }
    return Promise.resolve(execCopy(text));
  }
  document.addEventListener('click', function (e) {
    var to = e.target.closest('[data-kind-to]'); if (to) { setKind(to.dataset.kindTo); return; }
    var b = e.target.closest('[data-copy]'); if (!b || b.disabled) return;
    var w = b.closest('.w'), msg = w.querySelector('.cp-msg'), text = VAL[b.dataset.copy] && VAL[b.dataset.copy]();
    if (!text) return; // nothing real to copy: never fall back to an example or placeholder
    var man = w.querySelector('.cp-man'); if (man) man.remove();
    copyText(text).then(function (ok) {
      if (ok) { msg.className = 'cp-msg ok'; msg.textContent = t('cx.copied'); toast(t('cx.copiedT', { v: text })); b.textContent = t('cx.copied'); setTimeout(function () { b.textContent = t('cx.copy'); }, 1600); return; }
      msg.className = 'cp-msg bad'; msg.textContent = t('cx.copyFail');
      var m = document.createElement('input'); m.className = 'cp-man'; m.readOnly = true; m.value = text; m.setAttribute('aria-label', text);
      msg.after(m); m.focus(); m.select();
    });
  });

  /* ---------- the inputs (values live only in these elements) ---------- */
  var F = { name: $('#name'), key: $('#key'), sec: $('#sec') };
  var FLD = { name: ['#fName', '#mName'], apiKey: ['#fKey', '#mKey'], secret: ['#fSec', '#mSec'] };
  var STEP_OF = { name: 'verify', apiKey: function () { return S.kind === 'self' ? 'selfKeys' : 'sysKeys'; }, secret: 'sysKeys' };
  function count(inp, out) { var n = inp.value.trim().length; out.textContent = n + ' / 64'; out.classList.toggle('ok', n === 64 && /^[A-Za-z0-9]+$/.test(inp.value.trim())); }
  function clearErr(k) { $(FLD[k][0]).classList.remove('err'); $(FLD[k][1]).textContent = ''; }
  F.name.addEventListener('input', function () { clearErr('name'); });
  F.key.addEventListener('input', function () { clearErr('apiKey'); count(F.key, $('#nKey')); });
  F.sec.addEventListener('input', function () { clearErr('secret'); count(F.sec, $('#nSec')); });
  function eye(on) { F.sec.type = on ? 'text' : 'password'; var e = $('#eye'); e.innerHTML = on ? IC.eyeOff : IC.eye; e.setAttribute('aria-pressed', String(on)); e.setAttribute('aria-label', t(on ? 'cx.hide' : 'cx.show')); }
  $('#eye').addEventListener('click', function () { eye(F.sec.type === 'password'); });
  function summary() {
    var self = S.kind === 'self', k = F.key.value.trim().length, sc2 = F.sec.value.trim().length;
    var row = function (ok, a, b) { return '<li class="' + (ok ? 'y' : 'n') + '"><i>' + (ok ? '✓' : '!') + '</i><span>' + esc(a) + ' · ' + esc(b) + '</span></li>'; };
    var h = row(true, t('cx.sType'), t(self ? 'cx.tSelf' : 'cx.tSys')) +
      row(k > 0, t('cx.sKey'), k ? t('cx.filled', { n: k }) : t('cx.empty'));
    if (!self) h += row(sc2 > 0, t('cx.sSec'), sc2 ? t('cx.filled', { n: sc2 }) : t('cx.empty'));
    if (self) h += row(!!pubKey(), t('cx.sPub'), pubKey() ? '✓' : t('cx.unset'));
    h += row(!!allowIps(), t('cx.sIps'), allowIps() ? allowIps().length + '' : t('cx.unset')) + row(false, t('cx.sSvc'), t('cx.noSvc'));
    $('#sum').innerHTML = h;
    $('#safe').textContent = t('cx.safe');
  }
  function res(kind, title, badge, body, actions) {
    var r = $('#res'); r.hidden = false; r.className = 'res ' + kind;
    r.innerHTML = '<div class="rt">' + esc(title) + (badge ? '<span class="bdg">' + esc(badge) + '</span>' : '') + '</div>' + (body || '') +
      (actions ? '<div class="ract">' + actions + '</div>' : '');
    refit();
  }
  function wipe() { F.key.value = ''; F.sec.value = ''; eye(false); count(F.key, $('#nKey')); count(F.sec, $('#nSec')); }
  var busy = false;
  function stepIndex(id) { var l = steps(); for (var k = 0; k < l.length; k++) if (l[k].id === id) return k; return -1; }
  $('#f').addEventListener('submit', function (e) {
    e.preventDefault(); if (busy) return;
    ['name', 'apiKey', 'secret'].forEach(clearErr);
    var self = S.kind === 'self';
    var o = self ? { name: F.name.value, apiKey: F.key.value } : { name: F.name.value, apiKey: F.key.value, secret: F.sec.value };
    busy = true; var gob = $('#go'); gob.disabled = true; gob.textContent = t('cx.busy');
    res('busy', t('cx.rBusyT'), '', '<p>' + esc(t('cx.rBusyP')) + '</p>');
    (self ? API.submitSelfGeneratedKey(o) : API.submitApiCredentials(o)).then(function (r) {
      o.secret = o.apiKey = null;
      if (r.status === 'invalid') {
        r.errors.forEach(function (x) { var f = FLD[x.field]; if (!f) return; $(f[0]).classList.add('err'); $(f[1]).textContent = x.message; });
        /* 去修改 goes to the first error that lives on another step (Key / Secret sit before 验证); a name error on this step just gets focus */
        var stepOf = function (x) { var w = x && STEP_OF[x.field]; return typeof w === 'function' ? w() : w; };
        var other = r.errors.map(stepOf).filter(function (w) { return w && w !== 'verify'; })[0];
        var where = other || stepOf(r.errors[0]);
        res('bad', t('cx.rBadT'), '', '<ul>' + r.errors.map(function (x) { return '<li>' + esc(x.message) + '</li>'; }).join('') + '</ul>',
          where && where !== 'verify' ? '<button type="button" class="btn pri sm" data-fix="' + esc(where) + '">' + esc(t('cx.goFix')) + '</button>' : '');
        if (r.errors.some(function (x) { return stepOf(x) === 'verify'; })) F.name.focus();
        return;
      }
      wipe(); summary();
      var acts = '<a class="btn pri sm" href="' + esc(A.routes.app) + '">' + esc(t('cx.toApp')) + '</a><button type="button" class="btn ghost sm" data-again>' + esc(t('cx.again')) + '</button>';
      if (r.status === 'service_unavailable') {
        res('', t('cx.rNoSvcT'), r.code === 'PUBLIC_KEY_NOT_CONFIGURED' ? t('cx.rNoPubB') : t('cx.rNoSvcB'), '<p>' + esc(r.message) + '</p><ul><li>' + esc(t('cx.rNoSvcL1')) + '</li><li>' + esc(t('cx.rNoSvcL2')) + '</li><li>' + esc(t('cx.rNoSvcL3')) + '</li></ul>', acts);
      } else if (r.status === 'failed') {
        res('bad', t('cx.rFailT'), t('cx.rFailB'), (r.errors || []).length ? '<ul>' + r.errors.map(function (x) { return '<li>' + esc(x.message) + '</li>'; }).join('') + '</ul>' : '', acts);
      } else { // a real backend may answer checking / observing; it is still never shown as passed here
        res('busy', t('cx.rOkT'), t('cx.rOkB'), r.message ? '<p>' + esc(r.message) + '</p>' : '', acts);
      }
    }, function (err) {
      o.secret = o.apiKey = null; wipe(); summary();
      res('bad', t('cx.rFailT'), '', '<p>' + esc(err && err.message || '') + '</p>');
    }).then(function () { busy = false; gob.disabled = false; gob.textContent = t('cx.go'); });
  });
  $('#res').addEventListener('click', function (e) {
    var fx = e.target.closest('[data-fix]'); if (fx) { var k = stepIndex(fx.dataset.fix); $('#res').hidden = true; if (k >= 0) { go(k); var inp = document.querySelector('#' + (fx.dataset.fix === 'verify' ? 'name' : 'key')); if (inp) inp.focus({ preventScroll: true }); } return; }
    if (e.target.closest('[data-again]')) { $('#res').hidden = true; go(stepIndex(S.kind === 'self' ? 'selfKeys' : 'sysKeys')); }
  });
  window.addEventListener('pagehide', wipe);

  /* ---------- boot ---------- */
  function relang() { A.apply(document); render(false); eye(F.sec.type === 'text'); $('#go').textContent = t(busy ? 'cx.busy' : 'cx.go'); }
  $('[data-href="site"]').href = A.routes.site;
  $('#back').href = A.routes.app;
  var th = function () { return document.documentElement.dataset.theme === 'day' ? 'light' : 'dark'; };
  A.mountThemeToggle($('#thm'));
  A.mountLangToggle($('#lang'), { theme: th });
  var ss = A.session(); if (ss) $('#av').textContent = (ss.name || ss.email).slice(0, 1).toUpperCase();
  A.mountMenu($('#av'), { context: 'account', theme: th, logoutTo: A.routes.site });
  window.addEventListener(A.events.lang, relang);
  window.addEventListener(A.events.session, function () { if (!A.session()) A.requireUser(location.pathname + location.search); });
  if (RM.matches) document.documentElement.classList.add('bn-nomo');
  var rz, lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener('resize', function () {
    // a phone keyboard only changes the height: keep the layout (lift() keeps the field above the keyboard)
    if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 160 && document.activeElement && document.activeElement.tagName === 'INPUT') return;
    lastW = window.innerWidth; lastH = window.innerHeight; clearTimeout(rz); rz = setTimeout(function () { render(false); }, 120);
  });
  /* phone keyboard: the layout stays put; if the focused field would sit under the keyboard, lift the whole screen */
  function lift() {
    var a = document.activeElement, vv = window.visualViewport;
    if (!a || a.tagName !== 'INPUT' || !gd.contains(a) || !vv) { gd.style.transform = ''; return; }
    gd.style.transform = '';
    var r = (a.closest('.w') || a).getBoundingClientRect(), over = r.bottom + 12 - (vv.height + vv.offsetTop);
    if (over > 0) gd.style.transform = 'translateY(' + Math.round(-Math.min(over, r.top - 56)) + 'px)';
  }
  if (window.visualViewport) window.visualViewport.addEventListener('resize', lift);
  gd.addEventListener('focusout', function () { setTimeout(lift, 50); });
  A.apply(document); eye(false); render(false);
  API.getConnectKit().then(function (k) { KIT = k; render(false); });
  window.__guide = {
    get step() { return steps()[S.i].id; }, get index() { return S.i; }, get kind() { return S.kind; }, get phase() { return S.ph; },
    steps: function () { return steps().map(function (x) { return x.id; }); },
    go: function (i, ph) { go(typeof i === 'string' ? stepIndex(i) : i, false, ph); }, branch: setKind,
    tap: function () { activate(false); }, back: function () { back(false); }
  };
})();
