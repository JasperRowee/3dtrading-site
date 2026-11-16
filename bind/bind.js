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
  function skipUrl() { return DASH + '#' + (WHO ? 'who=' + WHO + '&' : '') + 'lang=' + A.lang() + '&theme=' + A.theme(); }
  A.i18n({
    zh: {
      'b.h1': '绑定币安', 'b.demo': '演示', 'b.demoT': '公钥和 IP 是示例；「绑定」只检查格式，不发送、不保存。',
      'b.lead': '在币安子账户「API 管理 → 创建 API」选「自行生成」，填好下面三项，再粘贴 API Key。',
      'b.pub': '公钥', 'b.perm': '权限', 'b.copy': '复制', 'b.cpPub': '复制公钥', 'b.cpIp': '复制两个 IP',
      'b.pmOn': '开启：读取、现货杠杆交易、借币还款划转、统一账户、万向划转', 'b.pmOff': '关闭：提现',
      'b.key': 'API Key', 'b.keyPh': '粘贴 API Key', 'b.nm': '账户名称', 'b.nmPh': '账户名，如 3dtUSDT01',
      'b.go': '绑定', 'b.busy': '检查中…',
      'b.safe': '私钥只在我们的签名服务器，从不经过网页；提现永远关闭。',
      'b.tut': '查看教程', 'b.skip': '跳过，进入后台', 'b.skipN': '暂不绑定，之后可在后台随时绑定',
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
      'b.tut': 'Tutorial', 'b.skip': 'Skip, go to dashboard', 'b.skipN': 'Not now? You can bind any time from the dashboard',
      'b.bad': 'The API Key should be 64 letters or digits', 'b.empty': 'Paste the API Key first', 'b.nmE': 'Enter an account name', 'b.nmBad': 'Use letters, digits, - or _ only',
      'b.rT': 'Not connected', 'b.rB': 'The demo only checks the format: this API Key was not sent or saved, and the field has been cleared.',
      'b.cpdPub': 'Public key copied', 'b.cpdIp': 'IPs copied: {v}', 'b.cpdEx': ' (example)', 'b.cpFail': 'The browser blocked copying; select and copy it by hand',
      'b.langL': '切换到中文', 'b.themeL': 'Switch day / night', 'b.gFrame': 'Tutorial: creating a self-generated API on Binance (demo)'
    }
  });
  var t = A.t, L = function () { return A.lang(); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var K = A.kit();
  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.3 8.3 0 0 1 9.4 4a8.3 8.3 0 1 0 10.6 10.6z"/></svg>';
  function ipText() { return K.ips.join(' '); }

  function fill() {
    K = A.kit();
    /* one line of the key (the base64 body); 复制 copies the full PEM, BEGIN / END lines included */
    $('#pem').textContent = K.publicKeyPem.split('\n').filter(function (x) { return x && x.indexOf('-----') !== 0; }).join('');
    $('#ips').textContent = K.ips.join('   ');
    $('#pms').innerHTML = '<span>' + esc(t('b.pmOn')) + '</span><span class="no">' + esc(t('b.pmOff')) + '</span>';
    var dm = $('.dm'); dm.hidden = !(K.pubExample || K.ipsExample); dm.title = t('b.demoT');
    $('#lang').textContent = L() === 'en' ? '中文' : 'EN';
    $('#theme').innerHTML = A.theme() === 'day' ? MOON : SUN;
    $('#go').textContent = t(busy ? 'b.busy' : 'b.go');
    document.title = '3dtrading · ' + t('b.h1');
    $('#skip').href = skipUrl();
  }

  /* ---------- copy (only the public key and the IPs; never an API Key) ---------- */
  function toast(s) { var e = $('#toast'); e.textContent = s; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 1800); }
  function execCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (x) { ok = false; } document.body.removeChild(ta); return ok;
  }
  function copy(b) {
    var kind = b.dataset.copy, v = kind === 'pub' ? K.publicKeyPem : ipText(); if (!v) return;
    var p = navigator.clipboard && window.isSecureContext && navigator.clipboard.writeText ? navigator.clipboard.writeText(v).then(function () { return true; }, function () { return execCopy(v); }) : Promise.resolve(execCopy(v));
    p.then(function (ok) {
      if (!ok) { toast(t('b.cpFail')); return; }
      var ex = kind === 'pub' ? K.pubExample : K.ipsExample;
      toast((kind === 'pub' ? t('b.cpdPub') : t('b.cpdIp', { v: v })) + (ex ? t('b.cpdEx') : ''));
      var s = b.querySelector('span'); b.classList.add('done'); s.textContent = '✓'; clearTimeout(b._t);
      b._t = setTimeout(function () { b.classList.remove('done'); s.textContent = t('b.copy'); }, 1500);
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
    var v = key.value.trim(), n = nm.value.trim();
    if (!v) { err('b.empty', 'key'); key.focus(); return; }
    if (!n) { err('b.nmE', 'nm'); nm.focus(); return; }
    if (!/^[A-Za-z0-9_-]{1,24}$/.test(n)) { err('b.nmBad', 'nm'); nm.focus(); return; }
    busy = true; var go = $('#go'); go.disabled = true; go.textContent = t('b.busy'); $('#res').hidden = true;
    A.submitKey(v).then(function (r) {
      v = null;
      if (r.status === 'invalid') { err('b.bad', 'key'); key.focus(); return; }
      wipe();
      var res = $('#res'); res.hidden = false; res.innerHTML = '<b>' + esc(t('b.rT')) + '</b> ' + esc(t('b.rB'));
    }).then(function () { busy = false; go.disabled = false; go.textContent = t('b.go'); });
  });
  window.addEventListener('pagehide', wipe);

  /* ---------- language / theme ---------- */
  $('#lang').addEventListener('click', function () { A.setLang(L() === 'en' ? 'zh' : 'en'); });
  $('#theme').addEventListener('click', function () { A.setTheme(A.theme() === 'day' ? 'night' : 'day'); });
  window.addEventListener(A.events.lang, function () {
    fill(); if (!$('#res').hidden) $('#res').innerHTML = '<b>' + esc(t('b.rT')) + '</b> ' + esc(t('b.rB'));
    if (errK) $('#mKey').textContent = t(errK === 'nm' ? (nm.value.trim() ? 'b.nmBad' : 'b.nmE') : (key.value.trim() ? 'b.bad' : 'b.empty'));
  });
  window.addEventListener(A.events.theme, fill);
  document.documentElement.dataset.theme = A.theme();
  A.apply(document); fill(); count();

  /* ---------- the window over the Binance replica, and the tutorial behind it ---------- */
  var gf = $('#guideFrame'), win = $('#win'), dim = $('#dim');
  gf.src = 'tutorial/?lang=' + L() + '&v=r49l'; // set after this page has stored ?lang=, so both agree
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
    if (e.data.bn49 === 'key' || e.data.bn49 === 'top') openWin(e.data.bn49 === 'key');
  });
  window.addEventListener(A.events.lang, function () { try { gf.contentWindow.BN49.setLang(L()); } catch (x) { /* not loaded yet: it reads the stored language */ } });
  if (location.hash === '#guide') openTut(); else openWin(location.hash === '#key');
})();
