/* 3dtrading · r58 · TDAuth — sign-up email code (DEMO), password hash, Google Authenticator 2FA (TOTP), and the
 * logged-out demo binding that is carried into the dashboard after sign-in.
 *
 * THERE IS NO AUTH BACKEND OR MAIL SERVICE IN THIS PROJECT (checked r58: no server code, TDApi is a demo adapter).
 * What is real and what is only a demo:
 *   - Email code: DEMO. A random 6-digit code is made with crypto.getRandomValues and kept ONLY in this page's memory
 *     (never stored, never in the URL). No email is sent; the page shows it in a box marked 「演示收件箱」. Expiry (10 min),
 *     resend wait (60 s) and the 5-try limit are enforced here. A real build must move send + verify to the server.
 *   - Password: a salted PBKDF2-SHA-256 hash (150 000 rounds) is stored in this browser's demo account list; the password
 *     itself is never stored. Real security needs the server to hold and check it.
 *   - 2FA: real RFC 6238 TOTP (HMAC-SHA1, 30 s, 6 digits) — the codes match Google Authenticator. The secret is shown once
 *     while setting up and is then stored ONLY encrypted (AES-GCM, key = PBKDF2(password)); recovery codes are stored as
 *     SHA-256 hashes. Because it all runs in the browser, it is a faithful DEMO of the flow, not server-grade protection.
 *   - Needs a secure context (https:// or localhost) for WebCrypto; on a plain-http LAN address 2FA cannot be turned on.
 * Pending demo binding: { name, at, nonce } in sessionStorage — a display name only, never a key. Taken exactly once.
 */
(function (g) {
  'use strict';
  if (g.TDAuth) return;
  var NS = '3dt.r49login.', KACC = NS + 'accounts', KPEND = '3dt.pendingBind', KTICK = '3dt.auth.ticket', KOK = '3dt.auth.ok', KUSED = '3dt.pendingBind.used';
  var C = g.crypto, S = C && C.subtle;
  var enc = new TextEncoder();
  function J(st, k, d) { try { var v = JSON.parse(st.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function W(st, k, v) { try { if (v == null) st.removeItem(k); else st.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function norm(e) { return String(e || '').trim().toLowerCase(); }
  function rnd(n) { var a = new Uint8Array(n); C.getRandomValues(a); return a; }
  function b64(u) { var s = ''; u = new Uint8Array(u); for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  function unb64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function hex(u) { return Array.prototype.map.call(new Uint8Array(u), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function secure() { return !!(S && g.isSecureContext !== false); }

  /* ---------- the demo account list (shared with /login/) ---------- */
  function accounts() { var a = J(localStorage, KACC, {}); return a && typeof a === 'object' ? a : {}; }
  function account(e) { return accounts()[norm(e)] || null; }
  function saveAccount(e, rec) { var a = accounts(); a[norm(e)] = rec; W(localStorage, KACC, a); return rec; }
  function tfaOn(e) { var r = account(e); return !!(r && r.tfa && r.tfa.on); }

  /* ---------- password: salted PBKDF2-SHA-256 ---------- */
  var ITER = 150000;
  function pbkdf2(pw, salt, bits) {
    return S.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return S.deriveBits({ name: 'PBKDF2', salt: salt, iterations: ITER, hash: 'SHA-256' }, k, bits);
    });
  }
  function hashPw(pw) { var s = rnd(16); return pbkdf2(pw, s, 256).then(function (h) { return { s: b64(s), h: b64(h), it: ITER, alg: 'PBKDF2-SHA256' }; }); }
  function eqConst(a, b) { if (a.length !== b.length) return false; var d = 0; for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
  function checkPw(rec, pw) {
    if (!rec || !rec.pw) return Promise.resolve(null); // legacy demo account made before r58: no password on file
    return pbkdf2(pw, unb64(rec.pw.s), 256).then(function (h) { return eqConst(b64(h), rec.pw.h); });
  }

  /* ---------- email code (DEMO: memory only, shown on the page, never mailed) ---------- */
  var CODE = null, TTL = 10 * 60 * 1000, WAIT = 60 * 1000, TRIES = 5;
  function sendCode(e) {
    var now = Date.now();
    if (CODE && CODE.e === norm(e) && now < CODE.resendAt) return { ok: false, code: 'wait', left: Math.ceil((CODE.resendAt - now) / 1000) };
    var n = (new Uint32Array(rnd(4).buffer)[0] % 1000000), v = ('00000' + n).slice(-6);
    CODE = { e: norm(e), v: v, exp: now + TTL, resendAt: now + WAIT, tries: 0 };
    return { ok: true, demoCode: v, exp: CODE.exp, resendAt: CODE.resendAt };
  }
  function codeState() { return CODE ? { e: CODE.e, exp: CODE.exp, resendAt: CODE.resendAt, tries: CODE.tries } : null; }
  /* 'ok' | 'none' (not sent / other email) | 'expired' | 'wrong' | 'locked' */
  function verifyCode(e, v) {
    if (!CODE || CODE.e !== norm(e)) return 'none';
    if (Date.now() > CODE.exp) return 'expired';
    if (CODE.tries >= TRIES) return 'locked';
    if (String(v || '').trim() === CODE.v) { CODE = null; return 'ok'; }
    CODE.tries++; return CODE.tries >= TRIES ? 'locked' : 'wrong';
  }

  /* ---------- TOTP (RFC 6238 / RFC 4226) ---------- */
  var B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  function b32enc(u) { var bits = 0, val = 0, out = ''; for (var i = 0; i < u.length; i++) { val = (val << 8) | u[i]; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) out += B32[(val << (5 - bits)) & 31]; return out; }
  function b32dec(s) { s = String(s).replace(/[\s=-]/g, '').toUpperCase(); var bits = 0, val = 0, out = []; for (var i = 0; i < s.length; i++) { var x = B32.indexOf(s[i]); if (x < 0) continue; val = (val << 5) | x; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } } return new Uint8Array(out); }
  function newSecret() { return b32enc(rnd(20)); }
  function hotp(secret, counter) {
    var msg = new Uint8Array(8), c = counter; for (var i = 7; i >= 0; i--) { msg[i] = c & 255; c = Math.floor(c / 256); }
    return S.importKey('raw', b32dec(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']).then(function (k) { return S.sign('HMAC', k, msg); }).then(function (sig) {
      var h = new Uint8Array(sig), o = h[19] & 15, n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
      return ('00000' + (n % 1000000)).slice(-6);
    });
  }
  function totp(secret, at) { return hotp(secret, Math.floor((at == null ? Date.now() : at) / 30000)); }
  function verifyTotp(secret, code) {
    code = String(code || '').replace(/\s/g, ''); if (!/^\d{6}$/.test(code)) return Promise.resolve(false);
    var t = Math.floor(Date.now() / 30000);
    return Promise.all([hotp(secret, t - 1), hotp(secret, t), hotp(secret, t + 1)]).then(function (a) { return a.indexOf(code) >= 0; });
  }
  function otpauth(email, secret) { return 'otpauth://totp/' + encodeURIComponent('3dtrading:' + norm(email)) + '?secret=' + secret + '&issuer=3dtrading&algorithm=SHA1&digits=6&period=30'; }

  /* ---------- secret at rest: AES-GCM with a key from the password ---------- */
  function aesKey(pw, salt) {
    return S.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return S.deriveKey({ name: 'PBKDF2', salt: salt, iterations: ITER, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function seal(secret, pw) { var s = rnd(16), iv = rnd(12); return aesKey(pw, s).then(function (k) { return S.encrypt({ name: 'AES-GCM', iv: iv }, k, enc.encode(secret)); }).then(function (ct) { return { s: b64(s), iv: b64(iv), ct: b64(ct) }; }); }
  function unseal(box, pw) { return aesKey(pw, unb64(box.s)).then(function (k) { return S.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, k, unb64(box.ct)); }).then(function (pt) { return new TextDecoder().decode(pt); }, function () { return null; }); }
  function sha(s) { return S.digest('SHA-256', enc.encode(s)).then(hex); }
  function newRecovery() { var out = []; for (var i = 0; i < 8; i++) { var h = b32enc(rnd(5)).toLowerCase(); out.push(h.slice(0, 4) + '-' + h.slice(4, 8)); } return out; }

  /* register(email, pw) → { ok, code } ; makes the demo account with a password hash */
  function register(e, pw) {
    e = norm(e); if (account(e)) return Promise.resolve({ ok: false, code: 'exists' });
    if (!secure()) { saveAccount(e, { name: e.split('@')[0], at: Date.now(), emailVerified: 'demo' }); return Promise.resolve({ ok: true, insecure: true }); }
    return hashPw(pw).then(function (h) { saveAccount(e, { name: e.split('@')[0], at: Date.now(), emailVerified: 'demo', pw: h }); return { ok: true }; });
  }
  /* login(email, pw) → { ok, code: 'notFound'|'badPw'|'tfa'|'insecure' } ; with 2FA on, ok is false and code 'tfa' (ask the code next) */
  function login(e, pw) {
    e = norm(e); var r = account(e); if (!r) return Promise.resolve({ ok: false, code: 'notFound' });
    if (!secure()) return Promise.resolve(r.tfa && r.tfa.on ? { ok: false, code: 'insecure' } : { ok: true, legacy: true });
    return checkPw(r, pw).then(function (m) {
      if (m === false) return { ok: false, code: 'badPw' };
      var up = m === null ? hashPw(pw).then(function (h) { r = account(e); r.pw = h; saveAccount(e, r); }) : Promise.resolve();
      return up.then(function () { return r.tfa && r.tfa.on ? { ok: false, code: 'tfa' } : { ok: true }; });
    });
  }
  /* second step: 6-digit Google Authenticator code (needs the password again to open the sealed secret) or a recovery code */
  function loginTfa(e, pw, code) {
    e = norm(e); var r = account(e); if (!r || !r.tfa || !r.tfa.on) return Promise.resolve({ ok: false, code: 'state' });
    /* 密码和第二因素都要对：恢复码也不能跳过密码 */
    return checkPw(r, pw).then(function (m) { if (m !== true) return { ok: false, code: 'badPw' }; return tfaStep(e, r, pw, code); });
  }
  function tfaStep(e, r, pw, code) {
    code = String(code || '').trim();
    if (/^[a-z2-7]{4}-?[a-z2-7]{4}$/i.test(code)) {
      var c = code.toLowerCase().replace('-', ''); c = c.slice(0, 4) + '-' + c.slice(4);
      return sha(c).then(function (h) {
        var i = (r.tfa.rec || []).indexOf(h); if (i < 0) return { ok: false, code: 'badRec' };
        r.tfa.rec.splice(i, 1); saveAccount(e, r); issueTicket(e); return { ok: true, recovery: true, left: r.tfa.rec.length };
      });
    }
    return unseal(r.tfa.box, pw).then(function (sec) {
      if (!sec) return { ok: false, code: 'badPw' };
      return verifyTotp(sec, code).then(function (ok) { sec = null; if (!ok) return { ok: false, code: 'badCode' }; issueTicket(e); return { ok: true }; });
    });
  }
  /* settings: begin → (QR + manual key shown) → confirm(code) → recovery codes shown once */
  var SETUP = null;
  function tfaBegin(e, pw) {
    e = norm(e); if (!secure()) return Promise.resolve({ ok: false, code: 'insecure' });
    var r = account(e);
    var p = r ? checkPw(r, pw) : Promise.resolve(null);
    return p.then(function (m) {
      if (m === false) return { ok: false, code: 'badPw' };
      if (!pw || pw.length < 8) return { ok: false, code: 'shortPw' };
      var sec = newSecret(); SETUP = { e: e, sec: sec, pw: pw };
      return { ok: true, secret: sec, uri: otpauth(e, sec), newPw: m === null };
    });
  }
  function tfaConfirm(code) {
    if (!SETUP) return Promise.resolve({ ok: false, code: 'state' });
    var st = SETUP;
    return verifyTotp(st.sec, code).then(function (ok) {
      if (!ok) return { ok: false, code: 'badCode' };
      var rec = newRecovery();
      return Promise.all([seal(st.sec, st.pw), Promise.all(rec.map(sha)), account(st.e) && account(st.e).pw ? Promise.resolve(account(st.e).pw) : hashPw(st.pw)]).then(function (x) {
        var r = account(st.e) || { name: st.e.split('@')[0], at: Date.now() };
        r.pw = x[2]; r.tfa = { on: true, at: Date.now(), box: x[0], rec: x[1], alg: 'TOTP-SHA1-30s-6' };
        saveAccount(st.e, r); SETUP = null; markOk(st.e);
        return { ok: true, recovery: rec };
      });
    });
  }
  function tfaCancel() { SETUP = null; }
  function tfaOff(e, pw, code) {
    return loginTfa(e, pw, code).then(function (res) {
      if (!res.ok) return res; takeTicket(e); var r = account(e); delete r.tfa; saveAccount(e, r); return { ok: true };
    });
  }

  /* ---------- the hand-off to the dashboard: a short-lived one-time ticket in this tab only ---------- */
  function issueTicket(e) { W(sessionStorage, KTICK, { e: norm(e), exp: Date.now() + 2 * 60 * 1000, n: hex(rnd(8)) }); }
  function takeTicket(e) { var t = J(sessionStorage, KTICK, null); W(sessionStorage, KTICK, null); return !!(t && t.e === norm(e) && Date.now() < t.exp); }
  function markOk(e) { W(sessionStorage, KOK, { e: norm(e) }); }
  function isOk(e) { var o = J(sessionStorage, KOK, null); return !!(o && o.e === norm(e)); }
  function clearOk() { W(sessionStorage, KOK, null); W(sessionStorage, KTICK, null); }

  /* ---------- pending demo binding (made while signed out) ---------- */
  function setPending(name) { var p = { name: String(name || '').trim().slice(0, 24), at: Date.now(), nonce: hex(rnd(8)) }; W(sessionStorage, KPEND, p); return p; }
  function pending() { var p = J(sessionStorage, KPEND, null); return p && p.nonce ? p : null; }
  function takePending() {
    var p = pending(); W(sessionStorage, KPEND, null); if (!p) return null;
    var used = J(localStorage, KUSED, []); if (!Array.isArray(used)) used = [];
    if (used.indexOf(p.nonce) >= 0) return null;
    used.push(p.nonce); W(localStorage, KUSED, used.slice(-50));
    return p;
  }

  g.TDAuth = {
    secure: secure, accounts: accounts, account: account, tfaOn: tfaOn,
    register: register, login: login, loginTfa: loginTfa,
    sendCode: sendCode, verifyCode: verifyCode, codeState: codeState, TTL: TTL, WAIT: WAIT,
    tfaBegin: tfaBegin, tfaConfirm: tfaConfirm, tfaCancel: tfaCancel, tfaOff: tfaOff, otpauth: otpauth,
    issueTicket: issueTicket, takeTicket: takeTicket, markOk: markOk, isOk: isOk, clearOk: clearOk,
    setPending: setPending, pending: pending, takePending: takePending,
    _t: { totp: totp, expire: function () { if (CODE) { CODE.exp = Date.now() - 1; CODE.resendAt = Date.now() - 1; } }, b32dec: b32dec },
    version: 'r58'
  };
})(window);
