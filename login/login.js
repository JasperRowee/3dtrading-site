/* r49 · 独立登录页脚本。不依赖后台的 td-account.js / api-adapter.js。
   语言、主题、表单校验、协议全文、本机演示账号。存储只用 3dt.r49login.*，从不保存密码。
   外部业务未接通：「登录 / 注册」只在这台浏览器里记一个演示账号，不校验密码，不连接任何服务器。 */
(function () {
  'use strict';
  var D = document, root = D.documentElement, NS = '3dt.r49login.';
  var BIND_URL = '/3dtrading-site/bind/';
  function $(s) { return D.querySelector(s); }
  function get(k) { try { return localStorage.getItem(NS + k); } catch (e) { return null; } }
  function set(k, v) { try { if (v == null) localStorage.removeItem(NS + k); else localStorage.setItem(NS + k, v); } catch (e) {} }
  function getJ(k, d) { try { var v = JSON.parse(get(k)); return v == null ? d : v; } catch (e) { return d; } }
  function emit(n) { try { dispatchEvent(new Event(n)); } catch (e) {} }

  /* ---------------- text ---------------- */
  var T = {
    zh: {
      'auth.title': '3dtrading · 登录 / 注册', 'top.home': '3dtrading', 'top.demo': '本机演示 · 未接后端',
      'top.toDay': '切换到白天', 'top.toNight': '切换到夜晚', 'auth.tabs': '登录或注册', 'auth.tLogin': '登录', 'auth.tReg': '注册',
      'auth.h1': '你的账户，<br><em>我们的策略</em>',
      'auth.lede': '连接你本人的币安子账户，策略在你自己的账户里运行。',
      'auth.p1t': '资金留在你本人的子账户', 'auth.p2t': '只用你授权的 API 权限', 'auth.p3t': '随时可在币安删除 API',
      'auth.loginT': '欢迎回来', 'auth.loginS': '登录后查看你的账户与策略状态。',
      'auth.regT': '创建账号', 'auth.regS': '注册后，下一步连接你本人的币安子账户。',
      'auth.email': '邮箱', 'auth.emailPh': 'name@example.com',
      'auth.pw': '密码', 'auth.pwRule': '至少 8 位，含字母和数字', 'auth.pw2': '再输入一次密码', 'auth.show': '显示或隐藏密码',
      'auth.forgot': '忘记密码？', 'auth.forgotNote': '演示环境还不能找回密码。正式上线后会通过邮箱验证码重置。',
      'auth.agree': '我已阅读并同意《合作服务协议与风险披露》', 'auth.agOpen': '查看全文', 'auth.agClose': '收起', 'auth.agTitle': '合作服务协议与风险披露',
      'auth.agNote': '待法务定稿：以下为占位文案，不是正式协议。',
      'auth.ag1': '数字资产价格波动大，策略可能亏损，过往表现不代表未来收益。',
      'auth.ag2': '本金始终在你本人的币安子账户；提现永远关闭，我们无法转走你的资产。',
      'auth.ag3': '我们按协议只做约定的交易与必要查询；任何不在计划内的划转都会立即停机并通知你。',
      'auth.ag4': '费用与结算规则：待定稿。',
      'auth.r1': '资金留存在本人子账户，不代表交易不会亏损。', 'auth.r2': '账面余额增加不等于净权益翻倍。', 'auth.r3': '历史表现与条件测算不代表未来收益。', 'auth.r4': '退出须按四步标准流程执行。',
      'auth.r5': '参与条件以 3dtrading 当前方案说明为准（此前方案：参与资金不低于 20 万 USDT、币安账户达到 VIP2）。注册时不再填写资金规模和风格，但接入前仍按实际要求核对，不因注册而免除。',
      'auth.goLogin': '登录', 'auth.goReg': '同意并注册',
      'auth.fine': '本机演示：账号只保存在这台浏览器，不校验密码，也不连接真实服务器。',
      'auth.e.email': '请输入有效的邮箱地址。', 'auth.e.pw': '请输入密码。', 'auth.e.pwRule': '密码至少 8 位，并同时包含字母和数字。',
      'auth.e.pw2': '两次输入的密码不一致。', 'auth.e.agree': '请先勾选同意合作服务协议与风险披露。',
      'auth.e.exists': '这个邮箱已经注册过了。<button type="button" class="link" data-to="login">直接登录</button>',
      'auth.e.notFound': '这台浏览器上还没有用这个邮箱注册过（演示账号只存在本机）。<button type="button" class="link" data-to="register">去注册</button>',
      'auth.signedBadge': '本机演示', 'auth.signedT': '已登录', 'auth.signedS': '这是这台浏览器上的演示登录，未连接真实后端。',
      'auth.toBind': '下一步：连接币安', 'auth.bindNote': '下一步在币安子账户里创建 API，并粘贴到绑定窗口。', 'auth.switchUser': '退出，换一个账号',
      'hint.desk': '点击球体切换外观', 'hint.mob': '轻点球体切换', 'hint.aria': '切换球面外观，当前：{n}（{i}/4）',
      'sk.planet': '星球', 'sk.dodo': 'Dodo', 'sk.brand': '品牌', 'sk.aurora': '极光'
    },
    en: {
      'auth.title': '3dtrading · Log in / Sign up', 'top.home': '3dtrading', 'top.demo': 'Local demo · No backend',
      'top.toDay': 'Switch to day', 'top.toNight': 'Switch to night', 'auth.tabs': 'Log in or sign up', 'auth.tLogin': 'Log in', 'auth.tReg': 'Sign up',
      'auth.h1': 'Your account, <br><em>our strategy</em>',
      'auth.lede': 'Connect your own Binance sub-account; the strategy runs inside your own account.',
      'auth.p1t': 'Funds stay in your own sub-account', 'auth.p2t': 'Only the API permissions you grant', 'auth.p3t': 'Delete the API key on Binance anytime',
      'auth.loginT': 'Welcome back', 'auth.loginS': 'Log in to see your account and strategy status.',
      'auth.regT': 'Create an account', 'auth.regS': 'Next, you connect your own Binance sub-account.',
      'auth.email': 'Email', 'auth.emailPh': 'name@example.com',
      'auth.pw': 'Password', 'auth.pwRule': '8+ characters, letters and numbers', 'auth.pw2': 'Repeat password', 'auth.show': 'Show or hide password',
      'auth.forgot': 'Forgot password?', 'auth.forgotNote': 'Password reset is not available in this demo. After launch it will use an email code.',
      'auth.agree': 'I have read and agree to the Service Terms & Risk Disclosure', 'auth.agOpen': 'Read', 'auth.agClose': 'Hide', 'auth.agTitle': 'Service Terms & Risk Disclosure',
      'auth.agNote': 'Pending legal review: placeholder text, not the final agreement.',
      'auth.ag1': 'Crypto prices are volatile. The strategy can lose money; past performance does not predict future results.',
      'auth.ag2': 'Your principal stays in your own Binance sub-account. Withdrawals are always off; we cannot move your assets out.',
      'auth.ag3': 'We only place the agreed trades and necessary queries. Any transfer outside the plan halts the system and notifies you.',
      'auth.ag4': 'Fees and settlement: to be finalised.',
      'auth.r1': 'Keeping funds in my own sub-account does not eliminate trading loss risk.', 'auth.r2': 'A larger gross balance does not mean net equity has doubled.', 'auth.r3': 'Past and modelled figures do not guarantee future returns.', 'auth.r4': 'Exits follow the 4-step standard unwinding protocol.',
      'auth.r5': 'Eligibility follows the current 3dtrading plan (previously: at least 200,000 USDT committed and a Binance account at VIP2). Capital range and style are no longer asked at sign-up, but eligibility is still checked before connecting; signing up does not waive it.',
      'auth.goLogin': 'Log in', 'auth.goReg': 'Agree and sign up',
      'auth.fine': 'Local demo: the account lives only in this browser, the password is not checked, and no real server is contacted.',
      'auth.e.email': 'Enter a valid email address.', 'auth.e.pw': 'Enter your password.', 'auth.e.pwRule': 'Use at least 8 characters with both letters and numbers.',
      'auth.e.pw2': 'The passwords do not match.', 'auth.e.agree': 'Please tick to accept the Service Terms & Risk Disclosure.',
      'auth.e.exists': 'This email is already registered. <button type="button" class="link" data-to="login">Log in instead</button>',
      'auth.e.notFound': 'No account with this email in this browser yet (demo accounts live only here). <button type="button" class="link" data-to="register">Sign up</button>',
      'auth.signedBadge': 'Local demo', 'auth.signedT': 'Signed in', 'auth.signedS': 'A demo sign-in in this browser only. No real backend is connected.',
      'auth.toBind': 'Next: connect Binance', 'auth.bindNote': 'Next, create an API key in your Binance sub-account and paste it into the connect window.', 'auth.switchUser': 'Sign out and use another account',
      'hint.desk': 'Click the sphere to change its look', 'hint.mob': 'Tap the sphere', 'hint.aria': 'Change the sphere surface. Now: {n} ({i}/4)',
      'sk.planet': 'Planet', 'sk.dodo': 'Dodo', 'sk.brand': 'Brand', 'sk.aurora': 'Aurora'
    }
  };
  var lang = root.dataset.lang === 'en' ? 'en' : 'zh';
  function t(k) { var v = T[lang][k]; return v == null ? (T.zh[k] == null ? k : T.zh[k]) : v; }
  function apply() {
    root.lang = lang === 'en' ? 'en' : 'zh-CN'; root.dataset.lang = lang; D.title = t('auth.title');
    D.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
    D.querySelectorAll('[data-i18n-html]').forEach(function (e) { e.innerHTML = t(e.getAttribute('data-i18n-html')); });
    D.querySelectorAll('[data-i18n-attr]').forEach(function (e) {
      e.getAttribute('data-i18n-attr').split(';').forEach(function (p) { var kv = p.split(':'); if (kv[1]) e.setAttribute(kv[0], t(kv[1])); });
    });
    D.querySelectorAll('#lang [data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    thmLabel(); renderMode(); renderAgree(); renderDone();
  }
  function setLang(l) { if (l !== 'zh' && l !== 'en' || l === lang) return; lang = l; set('lang', l); apply(); emit('td:lang'); }
  $('#lang').addEventListener('click', function (e) { var b = e.target.closest('[data-lang]'); if (b) setLang(b.getAttribute('data-lang')); });

  /* ---------------- theme ---------------- */
  var thm = $('#thm');
  function thmLabel() { var day = root.dataset.theme === 'day'; thm.setAttribute('aria-label', t(day ? 'top.toNight' : 'top.toDay')); thm.title = thm.getAttribute('aria-label'); }
  function themeColor() { var m = $('meta[name=theme-color]'); if (m) m.content = root.dataset.theme === 'day' ? '#d4e3e0' : '#05070a'; }
  thm.addEventListener('click', function () {
    var v = root.dataset.theme === 'day' ? 'night' : 'day'; root.dataset.theme = v; set('theme', v); themeColor(); thmLabel(); emit('td:theme');
  });
  themeColor();

  /* ---------------- local demo accounts (no passwords, ever) ---------------- */
  function accounts() { var a = getJ('accounts', {}); return a && typeof a === 'object' ? a : {}; }
  function session() { var s = getJ('session', null); return s && s.email ? s : null; }
  function nameOf(email) { return String(email).split('@')[0] || email; }

  /* ---------------- form ---------------- */
  var qs = new URLSearchParams(location.search), qm = qs.get('mode');
  var mode = qm === 'register' || qm === 'login' ? qm : (Object.keys(accounts()).length || get('seen') ? 'login' : 'register');
  var card = $('#card'), form = $('#f'), go = $('#go'), email = $('#email'), pw = $('#pw'), pw2 = $('#pw2'), agree = $('#agree');
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function ink() {
    var b = $('#tabs [aria-selected=true]'), i = $('#tabs .ink'); if (!b || !i) return;
    i.style.width = b.offsetWidth + 'px'; i.style.transform = 'translateX(' + b.offsetLeft + 'px)';
  }
  function renderMode() {
    card.dataset.mode = mode;
    D.querySelectorAll('#tabs [role=tab]').forEach(function (b) { var on = b.getAttribute('data-mode') === mode; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    form.setAttribute('aria-labelledby', mode === 'login' ? 't-login' : 't-register');
    $('#ft').textContent = t(mode === 'login' ? 'auth.loginT' : 'auth.regT');
    $('#fs').textContent = t(mode === 'login' ? 'auth.loginS' : 'auth.regS');
    $('#goT').textContent = t(mode === 'login' ? 'auth.goLogin' : 'auth.goReg');
    pw.setAttribute('autocomplete', mode === 'login' ? 'current-password' : 'new-password');
    ink();
  }
  function setMode(m, keep) {
    if (m !== 'login' && m !== 'register') return;
    mode = m; clearErr(); if (!keep) { pw.value = ''; pw2.value = ''; meter(); }
    $('#fp').classList.remove('on'); $('#forgot').setAttribute('aria-expanded', 'false');
    renderMode(); emit('td:session');
  }
  $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('[role=tab]'); if (b) setMode(b.getAttribute('data-mode'), true); });
  $('#tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault();
    setMode(mode === 'login' ? 'register' : 'login', true); var b = $('#tabs [aria-selected=true]'); if (b) b.focus();
  });
  addEventListener('resize', ink);
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(ink);

  function fieldErr(id, msgId, k) { var f = $(id), m = $(msgId); if (f) f.classList.toggle('err', !!k); if (m) m.textContent = k ? t(k) : ''; return !k; }
  function alertMsg(k) { var a = $('#alert'); if (!k) { a.classList.remove('on'); $('#alertT').innerHTML = ''; return; } $('#alertT').innerHTML = t(k); a.classList.add('on'); }
  function clearErr() { ['#fEmail', '#fPw', '#fPw2', '#fAgree'].forEach(function (s) { $(s).classList.remove('err'); }); ['#mEmail', '#mPw', '#mPw2', '#mAgree'].forEach(function (s) { $(s).textContent = ''; }); alertMsg(null); }
  function rule(v) { return v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v); }
  function strength(v) { if (!v) return 0; var s = 0; if (v.length >= 8) s++; if (/[A-Za-z]/.test(v) && /\d/.test(v)) s++; if (v.length >= 12) s++; if (/[^A-Za-z0-9]/.test(v)) s++; return Math.max(1, s); }
  function meter() { $('#meter').dataset.s = String(strength(pw.value)); }
  pw.addEventListener('input', function () { meter(); if ($('#fPw').classList.contains('err')) fieldErr('#fPw', '#mPw', null); });
  email.addEventListener('input', function () { if ($('#fEmail').classList.contains('err')) fieldErr('#fEmail', '#mEmail', null); alertMsg(null); });
  pw2.addEventListener('input', function () { if ($('#fPw2').classList.contains('err')) fieldErr('#fPw2', '#mPw2', null); });
  agree.addEventListener('change', function () { if (agree.checked) fieldErr('#fAgree', '#mAgree', null); });

  D.addEventListener('click', function (e) {
    var eb = e.target.closest('[data-eye]');
    if (eb) { var i = D.getElementById(eb.getAttribute('data-eye')); var show = i.type === 'password'; i.type = show ? 'text' : 'password'; eb.setAttribute('aria-pressed', String(show)); i.focus(); return; }
    var to = e.target.closest('[data-to]');
    if (to) { setMode(to.getAttribute('data-to'), true); (mode === 'login' ? pw : pw).focus(); }
  });
  $('#forgot').addEventListener('click', function () { var on = !$('#fp').classList.contains('on'); $('#fp').classList.toggle('on', on); this.setAttribute('aria-expanded', String(on)); emit('td:session'); });

  /* agreement text, shown inline */
  function renderAgree() {
    $('#agT').textContent = t('auth.agTitle'); $('#agN').textContent = t('auth.agNote');
    $('#agL').innerHTML = ['auth.ag1', 'auth.ag2', 'auth.ag3', 'auth.ag4', 'auth.r1', 'auth.r2', 'auth.r3', 'auth.r4', 'auth.r5'].map(function (k) { return '<li>' + t(k) + '</li>'; }).join('');
    $('#agOpen').textContent = t($('#agDoc').hidden ? 'auth.agOpen' : 'auth.agClose');
  }
  $('#agOpen').addEventListener('click', function () { var d = $('#agDoc'); d.hidden = !d.hidden; this.setAttribute('aria-expanded', String(!d.hidden)); renderAgree(); emit('td:session'); });

  form.addEventListener('submit', function (e) {
    e.preventDefault(); if (go.disabled) return;
    clearErr();
    var em = email.value.trim().toLowerCase(), p = pw.value, ok = true, first = null;
    function bad(sel, msg, k, el) { fieldErr(sel, msg, k); ok = false; if (!first) first = el; }
    if (!EMAIL.test(em)) bad('#fEmail', '#mEmail', 'auth.e.email', email);
    if (mode === 'login') { if (!p) bad('#fPw', '#mPw', 'auth.e.pw', pw); }
    else {
      if (!rule(p)) bad('#fPw', '#mPw', 'auth.e.pwRule', pw);
      if (pw2.value !== p || !pw2.value) bad('#fPw2', '#mPw2', 'auth.e.pw2', pw2);
      if (!agree.checked) bad('#fAgree', '#mAgree', 'auth.e.agree', agree);
    }
    emit('td:session');
    if (!ok) { first.focus(); return; }
    /* the password goes nowhere: it is cleared before anything is stored */
    pw.value = ''; pw2.value = ''; meter();
    go.disabled = true; go.classList.add('busy');
    setTimeout(function () {
      go.disabled = false; go.classList.remove('busy');
      var acc = accounts();
      if (mode === 'login' && !acc[em]) { alertMsg('auth.e.notFound'); email.focus(); emit('td:session'); return; }
      if (mode === 'register' && acc[em]) { alertMsg('auth.e.exists'); emit('td:session'); return; }
      if (mode === 'register') { acc[em] = { name: nameOf(em), at: Date.now() }; set('accounts', JSON.stringify(acc)); }
      set('session', JSON.stringify({ email: em, name: (acc[em] && acc[em].name) || nameOf(em), at: Date.now(), demo: true }));
      set('seen', '1'); agree.checked = false; renderDone(); emit('td:session');
      var b = $('#dGo'); if (b) b.focus({ preventScroll: true });
    }, 520);
  });

  /* ---------------- signed-in (local demo) ---------------- */
  function renderDone() {
    var s = session(); $('#formBox').hidden = !!s; $('#done').hidden = !s;
    if (!s) return;
    $('#dIni').textContent = (s.name || s.email).charAt(0).toUpperCase();
    $('#dName').textContent = s.name || nameOf(s.email); $('#dEmail').textContent = s.email;
    $('#dGo').href = bindHref(s);
  }
  /* r50 · the binding preview (8994) opens in this page's language / day-night and learns who signed in (#who=, a
     base64url {e,n} that stays in the URL fragment, never sent to a server), so its 「跳过，进入后台」 opens the dashboard
     preview (8996) as this same person, with Binance not connected. */
  function bindHref(s) {
    var who = '';
    try { who = btoa(unescape(encodeURIComponent(JSON.stringify({ e: s.email, n: s.name || nameOf(s.email) })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch (e) { who = ''; }
    return BIND_URL + '?lang=' + lang + '&theme=' + (root.dataset.theme === 'day' ? 'day' : 'night') + (who ? '#who=' + who : '');
  }
  addEventListener('td:theme', function () { var s = session(); if (s) $('#dGo').href = bindHref(s); });
  addEventListener('td:lang', function () { var s = session(); if (s) $('#dGo').href = bindHref(s); });
  $('#dOut').addEventListener('click', function () { set('session', null); setMode('login'); renderDone(); emit('td:session'); email.focus(); });

  /* phones: keep the field you type in visible above the keyboard */
  D.addEventListener('focusin', function (e) {
    if (innerWidth > 900 || !e.target.matches || !e.target.matches('#f input')) return;
    var el = e.target; setTimeout(function () { try { el.closest('.fld').scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {} }, 280);
  });

  window.__login = { t: t, lang: function () { return lang; }, mode: function () { return mode; }, session: session, accounts: accounts, setLang: setLang, setMode: setMode, bindUrl: BIND_URL };
  apply();
})();
