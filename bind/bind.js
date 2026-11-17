/* 3dtrading r49k · 绑定币安: one simple window over our dimmed Binance replica (the tutorial frame behind it).
 * Copy the public key / the IPs, paste the API Key + an account name, 绑定 = format check only.
 * 查看教程 closes the window; the tutorial's 「回到绑定」 buttons (postMessage) open it again. */
(function () {
  'use strict';
  var A = window.BN49, $ = function (s) { return document.querySelector(s); };
  /* r50 · who signed in on the log-in preview (8992) arrives as #who=… (base64url JSON {e,n}); it is kept for this tab
     only and handed on by 「跳过，进入后台」 to the dashboard preview (8996), which opens with no Binance account bound. */
  var DASH = '/3dtrading-site/dashboard/enter.html', WHO = '';
  try {
    var mw = /(?:^#|&)who=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (mw) { sessionStorage.setItem('3dt49bn.who', mw[1]); history.replaceState(null, '', location.pathname + location.search + location.hash.replace(/(^#|&)who=[A-Za-z0-9_-]+/, '$1').replace(/^#&?$/, '')); }
    WHO = sessionStorage.getItem('3dt49bn.who') || '';
  } catch (e) { /* storage off: the dashboard opens with a demo user */ }
  /* r56 · 从后台「绑定币安」弹窗点「查看教程」过来（?from=app）：这里只当教程，回去就是后台里的绑定弹窗，名称草稿还在 */
  var APP = /[?&]from=app\b/.test(location.search), APP_BIND = '/3dtrading-site/dashboard/app/index.html#/bind';
  function skipUrl() { return APP ? APP_BIND : DASH + '#' + (WHO ? 'who=' + WHO + '&' : '') + 'lang=' + A.lang(); }
  A.i18n({
    zh: {
      'b.h1': '绑定币安', 'b.demo': '演示', 'b.demoT': '公钥和 IP 是示例；「绑定」只检查格式，不发送、不保存。',
      'b.lead': '在币安子账户「API 管理 → 创建 API」选「自行生成」，填好下面三项，再粘贴 API Key。',
      'b.pub': '公钥', 'b.perm': '权限', 'b.copy': '复制', 'b.cpPub': '复制公钥', 'b.cpIp': '复制两个 IP',
      'b.pmOn': '开启：读取、现货杠杆交易、借币还款划转、统一账户、万向划转', 'b.pmOff': '关闭：提现',
      'b.key': 'API Key', 'b.keyPh': '粘贴 API Key', 'b.nm': '账户名称', 'b.nmPh': '账户名，如 3dtUSDT01',
      'b.go': '绑定', 'b.busy': '检查中…',
      'b.safe': '私钥只在我们的签名服务器，从不经过网页；提现永远关闭。',
      'b.tut': '查看教程', 'b.skip': '跳过，进入后台', 'b.skipN': '暂不绑定，之后可在后台随时绑定', 'b.back': '返回后台绑定',
      'b.bad': 'API Key 应为 64 位字母或数字', 'b.empty': '请先粘贴 API Key', 'b.nmE': '请填写账户名称', 'b.nmBad': '账户名称只用字母、数字、- 或 _',
      'b.rT': '账户未连接', 'b.rB': '演示版只检查格式：这把 API Key 没有发送、没有保存，输入框已清空。',
      'b.cpdPub': '已复制公钥', 'b.cpdIp': '已复制 IP：{v}', 'b.cpdEx': '（示例）', 'b.cpFail': '浏览器不允许复制，请手动选中复制',
      'b.langL': 'Switch to English', 'b.themeL': '切换日间 / 夜间', 'b.gFrame': '图解教程：在币安创建自行生成的 API（操作演示）'
    },
    en: {
      'b.h1': 'Bind Binance', 'b.demo': 'Demo', 'b.demoT': 'The key and IPs are examples. Bind only checks the format; nothing is sent or saved.',
      'b.lead': 'In the sub-account’s API Management → Create API, choose Self-generated, fill in the three items below, then paste back the API Key.',
      'b.pub': 'Public key', 'b.perm': 'Permissions', 'b.copy': 'Copy', 'b.cpPub': 'Copy the public key', 'b.cpIp': 'Copy both IPs',
      'b.pmOn': 'On: Reading, Spot & Margin Trading, Margin Loan/Repay/Transfer, Portfolio Margin, Universal Transfer', 'b.pmOff': 'Off: Withdrawals',
      'b.key': 'API Key', 'b.keyPh': 'Paste the API Key', 'b.nm': 'Account name', 'b.nmPh': 'Name, e.g. 3dtUSDT01',
      'b.go': 'Bind', 'b.busy': 'Checking…',
      'b.safe': 'The private key stays on our signing server and never passes through a web page. Withdrawals stay off for good.',
      'b.tut': 'Tutorial', 'b.skip': 'Skip, go to dashboard', 'b.skipN': 'Not now? You can bind any time from the dashboard', 'b.back': 'Back to dashboard binding',
      'b.bad': 'The API Key should be 64 letters or digits', 'b.empty': 'Paste the API Key first', 'b.nmE': 'Enter an account name', 'b.nmBad': 'Use letters, digits, - or _ only',
      'b.rT': 'Not connected', 'b.rB': 'The demo only checks the format: this API Key was not sent or saved, and the field has been cleared.',
      'b.cpdPub': 'Public key copied', 'b.cpdIp': 'IPs copied: {v}', 'b.cpdEx': ' (example)', 'b.cpFail': 'The browser blocked copying; select and copy it by hand',
      'b.langL': '切换到中文', 'b.themeL': 'Switch day / night', 'b.gFrame': 'Tutorial: creating a self-generated API on Binance (demo)'
    }
  });
  /* r58 strings (override r57 where the same key exists) */
  A.i18n({
    zh: { 'b.tut': '查看完整教程', 'b.skip': '跳过', 'b.lead': '在币安子账户「API 管理 → 创建 API」选「自行生成」，按下面四行填好。',
      'b.ip': 'IP 白名单（只访问受信任的 IP）', 'b.cpPub': '复制完整公钥', 'b.cpIp1': '复制 IP {v}', 'b.cpdIp': '已复制 IP：{v}',
      'b.pmLock': '先加 IP，交易权限才能勾选', 'b.nmPh': '账户名称（可选）', 'b.nmBad': '账户名称不能包含 < > " \' `',
      'b.dup': '「{n}」已经绑定过，换一个名称', 'b.demoH': '没有真实币安 Key 时，输入 {k} 可模拟绑定成功（演示账户，不连接币安）。', 'b.demoB': '演示',
      'b.okT': '演示绑定成功', 'b.okS': '已加进你的账户列表。', 'b.okSo': '登录或注册后，这个账户会带进你的后台。',
      'b.okSub': '演示绑定 · 未连接币安', 'b.okNew': '新', 'b.okWait': '待带入', 'b.okL': '已演示绑定的账户',
      'b.okP': '没有连接真实币安，也没有发送或保存 API Key。', 'b.okPo': '没有连接真实币安，也没有发送或保存 API Key。只记住了账户名称，并且只在这个标签页里、只带入一次。',
      'b.okNext': '继续绑定', 'b.okDash': '进入后台', 'b.okLogin': '登录并带入后台', 'b.okReg': '注册新账号', 'b.okToast': '演示绑定成功：{n}' },
    en: { 'b.tut': 'Full tutorial', 'b.skip': 'Skip', 'b.lead': 'In the sub-account’s API Management → Create API, choose Self-generated and fill it in with the four lines below.',
      'b.ip': 'IP whitelist (trusted IPs only)', 'b.cpPub': 'Copy the full public key', 'b.cpIp1': 'Copy IP {v}', 'b.cpdIp': 'IP copied: {v}',
      'b.pmLock': 'Add the IPs first; trading permissions unlock after that', 'b.nmPh': 'Account name (optional)', 'b.nmBad': 'The name can’t contain < > " \' `',
      'b.dup': '“{n}” is already bound; pick another name', 'b.demoH': 'No real Binance key? Enter {k} to simulate a successful bind (demo account, not connected to Binance).', 'b.demoB': 'Demo',
      'b.okT': 'Demo bind complete', 'b.okS': 'Added to your account list.', 'b.okSo': 'Log in or sign up and this account comes into your dashboard.',
      'b.okSub': 'Demo bind · not connected to Binance', 'b.okNew': 'New', 'b.okWait': 'Waiting', 'b.okL': 'Demo-bound accounts',
      'b.okP': 'Not connected to real Binance; the API Key was not sent or saved.', 'b.okPo': 'Not connected to real Binance; the API Key was not sent or saved. Only the account name is kept, in this tab only, and carried over once.',
      'b.okNext': 'Bind another', 'b.okDash': 'Go to dashboard', 'b.okLogin': 'Log in and bring it over', 'b.okReg': 'Sign up', 'b.okToast': 'Demo bind complete: {n}' }
  });
  var TB = window.TDBind, AU = window.TDAuth;
  var t = A.t, L = function () { return A.lang(); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var K = A.kit();
  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.3 8.3 0 0 1 9.4 4a8.3 8.3 0 1 0 10.6 10.6z"/></svg>';
  var CPI = '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>', OKV = null;

  function fill() {
    K = A.kit();
    /* r58: abbreviated key; clicking the field copies the whole PEM. It is the PUBLIC key; no private key ever reaches a web page. */
    var b64 = K.publicKeyPem.replace(/-----[^-]+-----|\s/g, '');
    $('#pem').textContent = b64.slice(0, 10) + '…' + b64.slice(-8); $('#pk').setAttribute('aria-label', t('b.cpPub'));
    var en = L() === 'en';
    $('#pms').innerHTML = K.perms.map(function (p) {
      var on = p.required, cls = on ? 'on' : p.optional ? 'opt' : 'off';
      return '<span class="pc ' + cls + '">' + (on ? '✓ ' : '') + esc(en ? p.en : p.zh) + (p.optional ? ' · ' + esc(en ? 'optional' : '可选') : '') + '</span>';
    }).join('') + '<span class="pc no">✕ ' + esc(en ? 'Withdrawals' : '提现') + '</span>';
    $('#ips').innerHTML = K.ips.map(function (ip) { return '<button type="button" class="ipb" data-copy="ip" data-v="' + esc(ip) + '" aria-label="' + esc(t('b.cpIp1', { v: ip })) + '"><code>' + esc(ip) + '</code><span class="ci" aria-hidden="true">' + CPI + '</span></button>'; }).join('');
    $('#demoH').innerHTML = '<b>' + esc(t('b.demoB')) + '</b>' + esc(t('b.demoH', { k: '§' })).replace('§', '<code>1234</code>');
    if (OKV) $('#okw').innerHTML = okHtml(OKV);
    var dm = $('.dm'); dm.hidden = !(K.pubExample || K.ipsExample); dm.title = t('b.demoT');
    $('#lang').textContent = L() === 'en' ? '中文' : 'EN';
    /* r55: no day / night button */
    $('#go').textContent = t(busy ? 'b.busy' : 'b.go');
    document.title = '3dtrading · ' + t('b.h1');
    $('#skip').href = TB && !TB.signedIn() && !APP ? '/3dtrading-site/login/?mode=login&lang=' + L() : skipUrl();
    if (APP) { $('#backApp').hidden = false; $('#backAppT').textContent = t('b.back'); }
  }

  /* ---------- copy (only the public key and the IPs; never an API Key) ---------- */
  function toast(s) { var e = $('#toast'); e.textContent = s; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 1800); }
  function execCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (x) { ok = false; } document.body.removeChild(ta); return ok;
  }
  function copy(b) {
    var kind = b.dataset.copy, v = kind === 'pub' ? K.publicKeyPem : b.dataset.v; if (!v) return;
    var p = navigator.clipboard && window.isSecureContext && navigator.clipboard.writeText ? navigator.clipboard.writeText(v).then(function () { return true; }, function () { return execCopy(v); }) : Promise.resolve(execCopy(v));
    p.then(function (ok) {
      if (!ok) { toast(t('b.cpFail')); return; }
      var ex = kind === 'pub' ? K.pubExample : K.ipsExample;
      toast((kind === 'pub' ? t('b.cpdPub') : t('b.cpdIp', { v: v })) + (ex ? t('b.cpdEx') : ''));
      b.classList.add('done'); clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove('done'); }, 1500);
    });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-copy]'); if (b) copy(b); });

  /* ---------- API Key + account name ---------- */
  var key = $('#key'), nm = $('#nm'), busy = false;
  function count() {
    var v = key.value.trim(), n = v.length, ok = n === 64 && /^[A-Za-z0-9]+$/.test(v);
    $('#nKey').textContent = n + '/64'; $('#nKey').classList.toggle('ok', ok);
  }
  var errK = '';
  function err(m, which) { errK = m ? which || 'key' : ''; $('#mKey').textContent = m ? t(m) : ''; $('#kin').classList.toggle('err', which === 'key' && !!m); nm.classList.toggle('err', which === 'nm' && !!m); }
  key.addEventListener('input', function () { err(''); count(); $('#res').hidden = true; });
  nm.addEventListener('input', function () { err(''); $('#res').hidden = true; });
  function wipe() { key.value = ''; count(); }
  $('#f').addEventListener('submit', function (e) {
    e.preventDefault(); if (busy) return;
    err(''); $('#res').hidden = true;
    var c = TB ? TB.check(key.value) : 'bad', n = nm.value.trim(), en = L() === 'en';
    if (c === 'empty' || c === 'bad') { err(c === 'empty' ? 'b.empty' : 'b.bad', 'key'); key.focus(); return; }
    if (n && !/^[^<>"'`]{1,24}$/.test(n)) { err('b.nmBad', 'nm'); nm.focus(); return; }
    if (c === 'format') {
      /* a real-looking key: format only; nothing is sent or saved, the field is cleared, the account stays 未连接 */
      busy = true; var go = $('#go'); go.disabled = true; go.textContent = t('b.busy');
      A.submitKey(key.value).then(function () { wipe(); var res = $('#res'); res.hidden = false; res.innerHTML = '<b>' + esc(t('b.rT')) + '</b> ' + esc(t('b.rB')); })
        .then(function () { busy = false; go.disabled = false; go.textContent = t('b.go'); });
      return;
    }
    if (TB.signedIn()) {
      var r = TB.bind({ key: key.value, name: n, en: en });
      if (!r.ok) { if (r.code === 'dup') { $('#mKey').textContent = t('b.dup', { n: r.name }); errK = 'dup'; nm.classList.add('err'); nm.focus(); nm.select(); } else err('b.empty', 'key'); return; }
      showOk({ name: r.name, signed: true });
    } else {
      var name = n || TB.nextName(en);
      if (AU) AU.setPending(name); TB.saveDraft('');
      showOk({ name: name, signed: false });
    }
  });
  /* ---------- r58 · the result inside the same window ---------- */
  var CK = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="rg" cx="32" cy="32" r="28"/><path class="tk" d="M20 33l8 8 16-17"/></svg>';
  function okHtml(v) {
    var all = v.signed && TB ? TB.demoList() : [];
    return '<div class="okb" aria-hidden="true">' + CK + '</div><h2 id="okT" tabindex="-1">' + esc(t('b.okT')) + '</h2>' +
      '<p class="oks">' + esc(t(v.signed ? 'b.okS' : 'b.okSo')) + '</p>' +
      '<div class="acc"><i aria-hidden="true">' + esc(String(v.name).charAt(0)) + '</i><span><b>' + esc(v.name) + '</b><small>' + esc(t('b.okSub')) + '</small></span><em>' + esc(t(v.signed ? 'b.okNew' : 'b.okWait')) + '</em></div>' +
      (all.length > 1 ? '<ul class="okl" aria-label="' + esc(t('b.okL')) + '">' + all.map(function (a) { return '<li><i aria-hidden="true">✓</i>' + esc(a.name) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="okp"><span class="dmb">' + esc(t('b.demoB')) + '</span>' + esc(t(v.signed ? 'b.okP' : 'b.okPo')) + '</p>' +
      '<div class="okf">' + (v.signed
        ? '<button type="button" class="sec" id="okNext">' + esc(t('b.okNext')) + '</button><button type="button" class="go" id="okDash">' + esc(t('b.okDash')) + '</button>'
        : '<button type="button" class="sec" id="okReg">' + esc(t('b.okReg')) + '</button><button type="button" class="go" id="okLogin">' + esc(t('b.okLogin')) + '</button>') + '</div>';
  }
  function showOk(v) {
    OKV = v; wipe(); nm.value = ''; $('#okw').innerHTML = okHtml(v); $('#okw').hidden = false; $('#wForm').hidden = true;
    toast(t('b.okToast', { n: v.name })); setTimeout(function () { try { $('#okT').focus({ preventScroll: true }); } catch (x) {} }, 20);
  }
  function hideOk() { OKV = null; $('#okw').hidden = true; $('#okw').innerHTML = ''; $('#wForm').hidden = false; }
  function authUrl(mode) { return '/3dtrading-site/login/?mode=' + mode + '&lang=' + L(); }
  $('#okw').addEventListener('click', function (e) {
    if (e.target.closest('#okNext')) { hideOk(); key.focus(); }
    else if (e.target.closest('#okDash')) location.href = '/3dtrading-site/dashboard/enter.html#lang=' + L();
    else if (e.target.closest('#okLogin')) location.href = authUrl('login');
    else if (e.target.closest('#okReg')) location.href = authUrl('register');
  });
  window.addEventListener('pagehide', wipe);

  /* ---------- language / theme ---------- */
  $('#lang').addEventListener('click', function () { A.setLang(L() === 'en' ? 'zh' : 'en'); });
  
  window.addEventListener(A.events.lang, function () {
    fill(); if (!$('#res').hidden) $('#res').innerHTML = '<b>' + esc(t('b.rT')) + '</b> ' + esc(t('b.rB'));
    if (errK === 'dup') err(''); else if (errK) $('#mKey').textContent = t(errK === 'nm' ? 'b.nmBad' : (key.value.trim() ? 'b.bad' : 'b.empty'));
  });
  window.addEventListener(A.events.theme, fill);
  document.documentElement.dataset.theme = A.theme();
  A.apply(document); fill(); count();

  /* ---------- the window over the Binance replica, and the tutorial behind it ---------- */
  var gf = $('#guideFrame'), win = $('#win'), dim = $('#dim');
  gf.src = 'tutorial/?lang=' + L() + '&v=r61'; // set after this page has stored ?lang=, so both agree
  function tell(cmd) { try { gf.contentWindow.postMessage({ bn49cmd: cmd }, location.origin); } catch (x) { /* not loaded yet */ } }
  function setInert(el, on) { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }
  function openWin(focusKey) {
    win.hidden = false; dim.hidden = false; setInert(gf, true); tell('intro');
    if (location.hash === '#guide') history.replaceState(null, '', location.pathname + location.search);
    setTimeout(function () { try { (focusKey ? key : win).focus({ preventScroll: true }); } catch (x) { /* */ } }, 30);
  }
  function openTut() {
    win.hidden = true; dim.hidden = true; setInert(gf, false); tell('tut');
    if (location.hash !== '#guide') history.replaceState(null, '', '#guide');
    setTimeout(function () { try { gf.focus(); } catch (x) { /* */ } }, 30);
  }
  $('#tut').addEventListener('click', function (e) { e.preventDefault(); openTut(); });
  gf.addEventListener('load', function () { tell(win.hidden ? 'tut' : 'intro'); });
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || e.source !== gf.contentWindow || !e.data) return;
    if (e.data.bn49 === 'done') { location.href = APP ? '/3dtrading-site/dashboard/app/index.html#/dashboard' : skipUrl(); return; }
    if (e.data.bn49 === 'login' || e.data.bn49 === 'register') { location.href = authUrl(e.data.bn49); return; }
    if (e.data.bn49 === 'key' || e.data.bn49 === 'top') { if (APP) location.href = APP_BIND; else openWin(e.data.bn49 === 'key'); }
  });
  window.addEventListener(A.events.lang, function () { try { gf.contentWindow.BN49.setLang(L()); } catch (x) { /* not loaded yet: it reads the stored language */ } });
  window.addEventListener('storage', function (e) { if (e.key === A.ns + 'lang' && (e.newValue === 'zh' || e.newValue === 'en') && e.newValue !== L()) A.setLang(e.newValue); });
  if (APP || location.hash === '#guide') openTut(); else openWin(location.hash === '#key');
})();
