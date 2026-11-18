/* r49 · 独立登录页脚本。不依赖后台的 td-account.js / api-adapter.js。
   语言、主题、表单校验、协议全文、本机演示账号。存储只用 3dt.r49login.*，从不保存密码。
   外部业务未接通：「登录 / 注册」只在这台浏览器里记一个演示账号，不校验密码，不连接任何服务器。 */
(function () {
  'use strict';
  var D = document, root = D.documentElement, NS = '3dt.r49login.';
  /* r56 · no signed-in card: login / sign-up success, and opening this page while signed in, go straight to the dashboard */
  var DASH_URL = '/3dtrading-site/dashboard/enter.html';
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
      'auth.regT': '创建账号', 'auth.regS': '注册后直接进入后台，币安子账户可以随时在后台绑定。',
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
      'auth.fine': '本机演示：账号只存在这台浏览器（密码只存加盐哈希），没有连接真实服务器；邮箱验证码不会真的发邮件。',
      'auth.e.email': '请输入有效的邮箱地址。', 'auth.e.pw': '请输入密码。', 'auth.e.pwRule': '密码至少 8 位，并同时包含字母和数字。',
      'auth.e.pw2': '两次输入的密码不一致。', 'auth.e.agree': '请先勾选同意合作服务协议与风险披露。',
      'auth.e.exists': '这个邮箱已经注册过了。<button type="button" class="link" data-to="login">直接登录</button>',
      'auth.e.notFound': '这台浏览器上还没有用这个邮箱注册过（演示账号只存在本机）。<button type="button" class="link" data-to="register">去注册</button>',
      'auth.going': '正在进入后台…'
    },
    en: {
      'auth.title': '3dtrading · Log in / Sign up', 'top.home': '3dtrading', 'top.demo': 'Local demo · No backend',
      'top.toDay': 'Switch to day', 'top.toNight': 'Switch to night', 'auth.tabs': 'Log in or sign up', 'auth.tLogin': 'Log in', 'auth.tReg': 'Sign up',
      'auth.h1': 'Your account, <br><em>our strategy</em>',
      'auth.lede': 'Connect your own Binance sub-account; the strategy runs inside your own account.',
      'auth.p1t': 'Funds stay in your own sub-account', 'auth.p2t': 'Only the API permissions you grant', 'auth.p3t': 'Delete the API key on Binance anytime',
      'auth.loginT': 'Welcome back', 'auth.loginS': 'Log in to see your account and strategy status.',
      'auth.regT': 'Create an account', 'auth.regS': 'You go straight to the dashboard; bind your Binance sub-account there any time.',
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
      'auth.fine': 'Local demo: the account lives only in this browser (only a salted hash of the password), no real server is contacted, and no email is actually sent.',
      'auth.e.email': 'Enter a valid email address.', 'auth.e.pw': 'Enter your password.', 'auth.e.pwRule': 'Use at least 8 characters with both letters and numbers.',
      'auth.e.pw2': 'The passwords do not match.', 'auth.e.agree': 'Please tick to accept the Service Terms & Risk Disclosure.',
      'auth.e.exists': 'This email is already registered. <button type="button" class="link" data-to="login">Log in instead</button>',
      'auth.e.notFound': 'No account with this email in this browser yet (demo accounts live only here). <button type="button" class="link" data-to="register">Sign up</button>',
      'auth.going': 'Opening the dashboard…'
    }
  };
  var lang = root.dataset.lang === 'en' ? 'en' : 'zh';
  /* r58 · email code (demo), password check, Google Authenticator step, carried-over demo binding */
  var T58 = {
    zh: {
      'auth.code': '邮箱验证码', 'auth.codeRule': '6 位数字', 'auth.codeHint': '演示验证码在本页显示', 'auth.codePh': '6 位验证码', 'auth.send': '发送验证码', 'auth.resend': '重新发送', 'auth.wait': '{n} 秒后重发',
      'auth.inbox': '<b>演示收件箱</b>没有接入邮件服务，不会真的发邮件。发给 {e} 的验证码：<code>{c}</code><small>仅显示在这台浏览器</small>',
      'auth.e.code': '请输入 6 位数字验证码。', 'auth.e.codeNone': '请先点「发送验证码」。', 'auth.e.codeOther': '邮箱改过了，请重新发送验证码。',
      'auth.e.codeExp': '验证码已过期，请重新发送。', 'auth.e.codeWrong': '验证码不对，还可以再试 {n} 次。', 'auth.e.codeLock': '错误次数太多，请重新发送验证码。',
      'auth.e.emailFirst': '先填写有效的邮箱，再发送验证码。', 'auth.e.badPw': '邮箱或密码不正确。', 'auth.e.insecure': '这个地址不是安全连接（HTTPS / localhost），无法完成两步验证。请用 localhost 打开。',
      'auth.tfBack': '换个账号', 'auth.tfT': '两步验证', 'auth.tfS': '打开 Google Authenticator，输入 3dtrading（{e}）当前的 6 位验证码。',
      'auth.tfSRec': '输入你在开启两步验证时保存的一个恢复码（形如 abcd-efgh），每个只能用一次。',
      'auth.tfL': '6 位验证码', 'auth.tfLRec': '恢复码', 'auth.tfGo': '验证并登录', 'auth.tfUseRec': '手机不在身边？用恢复码', 'auth.tfUseCode': '改用验证器的 6 位验证码',
      'auth.tfE': '请输入 6 位数字验证码。', 'auth.tfBad': '验证码不对或已过期，请看验证器里当前的数字。', 'auth.tfBadRec': '恢复码不对或已经用过。', 'auth.tfRecOk': '已用恢复码登录，还剩 {n} 个。',
      'auth.tfFine': '验证码由 Google Authenticator 按时间生成，与币安或绑定页的二维码无关。',
      'auth.pend': '<b>演示账户「{n}」已准备好</b>登录或注册后会自动加入你的后台（演示绑定，未连接币安）。'
    },
    en: {
      'auth.code': 'Email code', 'auth.codeRule': '6 digits', 'auth.codeHint': 'Demo code is shown on this page', 'auth.codePh': '6-digit code', 'auth.send': 'Send code', 'auth.resend': 'Resend', 'auth.wait': 'Resend in {n}s',
      'auth.inbox': '<b>Demo inbox</b>No mail service is connected, so no email is really sent. Code for {e}: <code>{c}</code><small>Shown only in this browser</small>',
      'auth.e.code': 'Enter the 6-digit code.', 'auth.e.codeNone': 'Click “Send code” first.', 'auth.e.codeOther': 'The email changed — send a new code.',
      'auth.e.codeExp': 'The code has expired. Send a new one.', 'auth.e.codeWrong': 'Wrong code. {n} tries left.', 'auth.e.codeLock': 'Too many wrong tries. Send a new code.',
      'auth.e.emailFirst': 'Enter a valid email first, then send the code.', 'auth.e.badPw': 'The email or password is not right.', 'auth.e.insecure': 'This address is not a secure connection (HTTPS / localhost), so two-step verification can’t run. Open it via localhost.',
      'auth.tfBack': 'Use another account', 'auth.tfT': 'Two-step verification', 'auth.tfS': 'Open Google Authenticator and enter the current 6-digit code for 3dtrading ({e}).',
      'auth.tfSRec': 'Enter one of the recovery codes you saved when you turned on two-step verification (like abcd-efgh). Each works once.',
      'auth.tfL': '6-digit code', 'auth.tfLRec': 'Recovery code', 'auth.tfGo': 'Verify and log in', 'auth.tfUseRec': 'Phone not with you? Use a recovery code', 'auth.tfUseCode': 'Use the 6-digit authenticator code instead',
      'auth.tfE': 'Enter the 6-digit code.', 'auth.tfBad': 'That code is wrong or expired — use the number the app shows now.', 'auth.tfBadRec': 'That recovery code is wrong or already used.', 'auth.tfRecOk': 'Logged in with a recovery code; {n} left.',
      'auth.tfFine': 'The code is made by Google Authenticator from the time; it has nothing to do with Binance or the binding-page QR code.',
      'auth.pend': '<b>Demo account “{n}” is ready</b>Log in or sign up and it will be added to your dashboard (demo binding, Binance not connected).'
    }
  };
  Object.keys(T58.zh).forEach(function (k) { T.zh[k] = T58.zh[k]; T.en[k] = T58.en[k]; });
  function tv(k, o) { return t(k).replace(/\{(\w+)\}/g, function (m, x) { return o && o[x] != null ? String(o[x]).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }) : m; }); }
  var AU = window.TDAuth;

  function t(k) { var v = T[lang][k]; return v == null ? (T.zh[k] == null ? k : T.zh[k]) : v; }
  function apply() {
    root.lang = lang === 'en' ? 'en' : 'zh-CN'; root.dataset.lang = lang; D.title = t('auth.title');
    D.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
    D.querySelectorAll('[data-i18n-html]').forEach(function (e) { e.innerHTML = t(e.getAttribute('data-i18n-html')); });
    D.querySelectorAll('[data-i18n-attr]').forEach(function (e) {
      e.getAttribute('data-i18n-attr').split(';').forEach(function (p) { var kv = p.split(':'); if (kv[1]) e.setAttribute(kv[0], t(kv[1])); });
    });
    D.querySelectorAll('#lang [data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    renderMode(); renderAgree(); renderCode(); renderTf(); renderPend();
  }
  function setLang(l) { if (l !== 'zh' && l !== 'en' || l === lang) return; lang = l; set('lang', l); apply(); emit('td:lang'); }
  $('#lang').addEventListener('click', function (e) { var b = e.target.closest('[data-lang]'); if (b) setLang(b.getAttribute('data-lang')); });

  // Single default space appearance; old saved day preferences are ignored.
  root.dataset.theme = 'night';

  /* ---------------- local demo accounts (no passwords, ever) ---------------- */
  function accounts() { var a = getJ('accounts', {}); return a && typeof a === 'object' ? a : {}; }
  function session() { var s = getJ('session', null); return s && s.email ? s : null; }
  function nameOf(email) { return String(email).split('@')[0] || email; }

  /* ---------------- form ---------------- */
  var qs = new URLSearchParams(location.search), qm = qs.get('mode');
  var mode = qm === 'register' || qm === 'login' ? qm : (Object.keys(accounts()).length || get('seen') ? 'login' : 'register');
  var card = $('#card'), form = $('#f'), go = $('#go'), email = $('#email'), pw = $('#pw'), pw2 = $('#pw2'), agree = $('#agree'), code = $('#code'), sendc = $('#sendc');
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
    /* r59 (MWG autofill-sign-in-form): the phone keyboard's Enter key says what happens next */
    pw.setAttribute('enterkeyhint', mode === 'login' ? 'go' : 'next');
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
  function clearErr() { ['#fEmail', '#fCode', '#fPw', '#fPw2', '#fAgree'].forEach(function (s) { $(s).classList.remove('err'); }); ['#mEmail', '#mCode', '#mPw', '#mPw2', '#mAgree'].forEach(function (s) { $(s).textContent = ''; }); alertMsg(null); }
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

  /* r57 · Enter walks the form one field at a time. Only the field you leave (or press Enter in) is checked; fields you
     have not reached never show an error (no "passwords differ" or "tick the agreement" after typing an email).
     Everything is checked only on a real submit: the button, or Enter once every field before it is done. */
  function check(el) {
    var v = el.value;
    if (el === email) return fieldErr('#fEmail', '#mEmail', EMAIL.test(v.trim().toLowerCase()) ? null : 'auth.e.email');
    if (el === pw) return fieldErr('#fPw', '#mPw', mode === 'login' ? (v ? null : 'auth.e.pw') : (rule(v) ? null : 'auth.e.pwRule'));
    if (el === pw2) return fieldErr('#fPw2', '#mPw2', v && v === pw.value ? null : 'auth.e.pw2');
    if (el === code) return fieldErr('#fCode', '#mCode', /^\d{6}$/.test(v.trim()) ? null : 'auth.e.code');
    return true;
  }
  function chain() { return mode === 'login' ? [email, pw] : [email, code, pw, pw2, agree]; }
  function filled(el) { return el === agree ? el.checked : !!el.value; }
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.isComposing || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return;
    var el = e.target, c = chain(), i = c.indexOf(el); if (i < 0) return;
    e.preventDefault();
    if (mode === 'login') { if (el === email && !pw.value) { pw.focus(); return; } if (typeof form.requestSubmit === 'function') form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true })); return; }
    if (el !== agree && !check(el)) { emit('td:session'); return; }
    for (var k = 0; k < c.length; k++) { if (k !== i && !filled(c[k])) { if (k > i || !filled(c[k])) { c[k].focus(); emit('td:session'); return; } } }
    if (typeof form.requestSubmit === 'function') form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
  [email, code, pw, pw2].forEach(function (el) {
    el.addEventListener('blur', function () {
      if (!el.value || go.disabled) return;          /* an untouched or empty field stays quiet until submit */
      if (mode === 'login') return;                 /* r67: log in checks nothing */
      if (el === pw2 && !pw.value) return;
      check(el); emit('td:session');
    });
  });
  pw.addEventListener('input', function () { if (pw2.value && $('#fPw2').classList.contains('err') && pw2.value === pw.value) fieldErr('#fPw2', '#mPw2', null); });

  /* ---------- r58 · email code (DEMO) ---------- */
  var CD = { e: '', timer: 0 };
  function renderCode() {
    var st = AU && AU.codeState(), left = st ? Math.max(0, Math.ceil((st.resendAt - Date.now()) / 1000)) : 0;
    sendc.disabled = left > 0; sendc.textContent = left > 0 ? tv('auth.wait', { n: left }) : t(st ? 'auth.resend' : 'auth.send');
    var ib = $('#inbox'); if (CD.c && st) { ib.hidden = false; ib.innerHTML = tv('auth.inbox', { e: CD.e, c: CD.c }); } else { ib.hidden = true; ib.innerHTML = ''; }
  }
  function tick() { clearInterval(CD.timer); CD.timer = setInterval(function () { renderCode(); var st = AU.codeState(); if (!st || Date.now() >= st.resendAt) clearInterval(CD.timer); }, 1000); }
  sendc.addEventListener('click', function () {
    var em = email.value.trim().toLowerCase();
    if (!EMAIL.test(em)) { fieldErr('#fEmail', '#mEmail', 'auth.e.emailFirst'); email.focus(); emit('td:session'); return; }
    fieldErr('#fEmail', '#mEmail', null);
    var r = AU.sendCode(em); if (!r.ok) { renderCode(); return; }
    CD.e = em; CD.c = r.demoCode; fieldErr('#fCode', '#mCode', null); code.value = ''; renderCode(); tick(); code.focus(); emit('td:session');
  });
  code.addEventListener('input', function () { code.value = code.value.replace(/\D/g, '').slice(0, 6); if ($('#fCode').classList.contains('err')) fieldErr('#fCode', '#mCode', null); });
  function codeErr(r) {
    if (r === 'none') return CD.e && CD.e !== email.value.trim().toLowerCase() ? 'auth.e.codeOther' : 'auth.e.codeNone';
    return r === 'expired' ? 'auth.e.codeExp' : r === 'locked' ? 'auth.e.codeLock' : 'auth.e.codeWrong';
  }

  /* ---------- r58 · carried-over demo binding note ---------- */
  function renderPend() {
    var p = AU && AU.pending(), el = $('#pend');
    if (!p) { if (el) el.remove(); return; }
    if (!el) { el = D.createElement('div'); el.id = 'pend'; el.className = 'pend'; el.setAttribute('role', 'status'); $('#f').insertBefore(el, $('#f .sub').nextSibling); }
    el.innerHTML = '<span class="pk" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg></span><span>' + tv('auth.pend', { n: p.name }) + '</span>';
  }

  /* ---------- r58 · submit: register (code + password hash) / log in (password, then 2FA if on) ---------- */
  var HELD = null; // the password, in memory only, between the password step and the 2FA step
  form.addEventListener('submit', function (e) {
    e.preventDefault(); if (go.disabled) return;
    clearErr();
    /* r67 · log in lets anyone in: no account / password / 2FA check, empty fields included.
       The name is what comes before @ (or the whole input); nothing typed → 访客 / Guest. */
    if (mode === 'login') {
      var raw = email.value.trim(), lo = raw.toLowerCase(), nm = raw ? (raw.split('@')[0] || raw) : (lang === 'en' ? 'Guest' : '访客');
      var em2 = EMAIL.test(lo) ? lo : (raw ? (lo.replace(/[^a-z0-9._-]+/g, '') || 'user') + '@guest.3dtrading.local' : 'guest@3dtrading.local');
      pw.value = ''; meter(); emit('td:session');
      set('session', JSON.stringify({ email: em2, name: nm.slice(0, 40), at: Date.now(), demo: true }));
      set('seen', '1'); $('#goT').textContent = t('auth.going'); go.disabled = true;
      enter(session());
      return;
    }
    var em = email.value.trim().toLowerCase(), p = pw.value, ok = true, first = null;
    function bad(sel, msg, k, el) { fieldErr(sel, msg, k); ok = false; if (!first) first = el; }
    if (!EMAIL.test(em)) bad('#fEmail', '#mEmail', 'auth.e.email', email);
    if (mode === 'login') { if (!p) bad('#fPw', '#mPw', 'auth.e.pw', pw); }
    else {
      if (!/^\d{6}$/.test(code.value.trim())) bad('#fCode', '#mCode', AU.codeState() ? 'auth.e.code' : 'auth.e.codeNone', code);
      if (!rule(p)) bad('#fPw', '#mPw', 'auth.e.pwRule', pw);
      if (pw2.value !== p || !pw2.value) bad('#fPw2', '#mPw2', 'auth.e.pw2', pw2);
      if (!agree.checked) bad('#fAgree', '#mAgree', 'auth.e.agree', agree);
    }
    emit('td:session');
    if (!ok) { first.focus(); return; }
    if (mode === 'register') {
      if (AU.account(em)) { alertMsg('auth.e.exists'); emit('td:session'); return; }
      var cr = AU.verifyCode(em, code.value);
      if (cr !== 'ok') {
        var st = AU.codeState(); var k = codeErr(cr);
        fieldErr('#fCode', '#mCode', null); $('#fCode').classList.add('err'); $('#mCode').textContent = tv(k, { n: st ? 5 - st.tries : 0 });
        if (cr === 'expired' || cr === 'locked') { CD.c = ''; renderCode(); }
        code.focus(); emit('td:session'); return;
      }
      CD.c = ''; renderCode();
    }
    /* the password field is cleared before anything is stored; only a salted hash is kept */
    pw.value = ''; pw2.value = ''; meter();
    go.disabled = true; go.classList.add('busy');
    var job = mode === 'register' ? AU.register(em, p) : AU.login(em, p);
    job.then(function (r) {
      go.disabled = false; go.classList.remove('busy');
      if (!r.ok) {
        if (r.code === 'notFound') { alertMsg('auth.e.notFound'); email.focus(); }
        else if (r.code === 'exists') alertMsg('auth.e.exists');
        else if (r.code === 'badPw') { alertMsg('auth.e.badPw'); pw.focus(); }
        else if (r.code === 'insecure') alertMsg('auth.e.insecure');
        else if (r.code === 'tfa') { HELD = p; p = null; showTf(em); }
        emit('td:session'); return;
      }
      p = null; done(em, mode === 'register');
    });
  });
  function done(em, fresh) {
    var acc = AU.accounts();
    set('session', JSON.stringify({ email: em, name: (acc[em] && acc[em].name) || nameOf(em), at: Date.now(), demo: true }));
    set('seen', '1'); agree.checked = false; $('#goT').textContent = t('auth.going'); go.disabled = true; $('#tfGo').disabled = true;
    var ses = session(); if (ses && fresh) ses.fresh = true;
    enter(ses);
  }

  /* ---------- r58 · the Google Authenticator step ---------- */
  var TF = { e: '', rec: false }, tf = $('#tf'), tfc = $('#tfc');
  function renderTf() {
    if (!TF.e) return;
    $('#tfS').textContent = TF.rec ? t('auth.tfSRec') : tv('auth.tfS', { e: TF.e }).replace(/&amp;/g, '&');
    $('#tfL').textContent = t(TF.rec ? 'auth.tfLRec' : 'auth.tfL'); $('#tfGoT').textContent = t('auth.tfGo');
    $('#tfRec').textContent = t(TF.rec ? 'auth.tfUseCode' : 'auth.tfUseRec');
    tfc.setAttribute('inputmode', TF.rec ? 'text' : 'numeric'); tfc.maxLength = TF.rec ? 9 : 6;
    tfc.placeholder = TF.rec ? 'abcd-efgh' : '000000';
  }
  function tfAlert(k, o) { var a = $('#tfAlert'); if (!k) { a.classList.remove('on'); return; } $('#tfAlertT').textContent = tv(k, o).replace(/&amp;/g, '&'); a.classList.add('on'); }
  function showTf(em) {
    TF.e = em; TF.rec = false; tfc.value = ''; tfAlert(null); fieldErr('#fTf', '#mTf', null);
    form.hidden = true; $('#tabs').hidden = true; tf.hidden = false; card.dataset.step = 'tfa'; renderTf();
    setTimeout(function () { tfc.focus(); }, 30);
  }
  function hideTf() { HELD = null; TF.e = ''; tf.hidden = true; form.hidden = false; $('#tabs').hidden = false; delete card.dataset.step; ink(); pw.focus(); }
  $('#tfBack').addEventListener('click', hideTf);
  $('#tfRec').addEventListener('click', function () { TF.rec = !TF.rec; tfc.value = ''; fieldErr('#fTf', '#mTf', null); tfAlert(null); renderTf(); tfc.focus(); });
  tfc.addEventListener('input', function () { if (!TF.rec) tfc.value = tfc.value.replace(/\D/g, '').slice(0, 6); if ($('#fTf').classList.contains('err')) fieldErr('#fTf', '#mTf', null); });
  tf.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); hideTf(); } });
  tf.addEventListener('submit', function (e) {
    e.preventDefault(); var b = $('#tfGo'); if (b.disabled) return;
    var v = tfc.value.trim(); tfAlert(null);
    if (!TF.rec && !/^\d{6}$/.test(v)) { fieldErr('#fTf', '#mTf', 'auth.tfE'); tfc.focus(); return; }
    if (TF.rec && !/^[a-z2-7]{4}-?[a-z2-7]{4}$/i.test(v)) { fieldErr('#fTf', '#mTf', 'auth.tfBadRec'); tfc.focus(); return; }
    b.disabled = true; b.classList.add('busy');
    AU.loginTfa(TF.e, HELD || '', v).then(function (r) {
      b.disabled = false; b.classList.remove('busy');
      if (!r.ok && r.code === 'badPw') { HELD = null; hideTf(); alertMsg('auth.e.badPw'); return; }
      if (!r.ok) { fieldErr('#fTf', '#mTf', r.code === 'badRec' ? 'auth.tfBadRec' : 'auth.tfBad'); tfc.select(); emit('td:session'); return; }
      HELD = null;
      if (r.recovery) { try { sessionStorage.setItem('3dt.auth.recLeft', String(r.left)); } catch (x) {} }
      done(TF.e, false);
    });
  });

  /* ---------------- signed in → the dashboard (local demo) ----------------
     who signed in travels as #who= (a base64url {e,n} in the URL fragment, never sent to a server); enter.html makes the
     dashboard's own demo session from it and opens the dashboard with no Binance account bound. */
  function dashHref(s) {
    var who = '';
    try { who = btoa(unescape(encodeURIComponent(JSON.stringify({ e: s.email, n: s.name || nameOf(s.email) })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch (e) { who = ''; }
    return DASH_URL + '#' + (who ? 'who=' + who + '&' : '') + 'lang=' + lang + (s && s.fresh ? '&new=1' : '');
  }
  /* r57: a brand-new registration carries &new=1 so the dashboard shows the one-time 「绑定币安账户」 prompt */
  function enter(s) { if (s) (window.__EMBED ? top.location : location).replace(dashHref(s)); }
  /* ?out=1 (sent by the dashboard's 退出登录) ends the local demo sign-in here too, so this page shows the form again */
  if (qs.get('out') === '1') { set('session', null); try { history.replaceState(null, '', location.pathname + (qm ? '?mode=' + qm : '')); } catch (e) {} }
  else if (session()) {
    /* r58: with 2FA on, a remembered sign-in is not enough — ask for the authenticator code again */
    /* r67: no 2FA gate on log in any more */
    enter(session());
  }

  /* phones: keep the field you type in visible above the keyboard */
  D.addEventListener('focusin', function (e) {
    if (innerWidth > 900 || !e.target.matches || !e.target.matches('#f input')) return;
    var el = e.target; setTimeout(function () { try { el.closest('.fld').scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {} }, 280);
  });

  window.__login = { t: t, lang: function () { return lang; }, mode: function () { return mode; }, session: session, accounts: accounts, setLang: setLang, setMode: setMode, dashUrl: DASH_URL, dashHref: dashHref, showTf: showTf };
  apply();
})();
