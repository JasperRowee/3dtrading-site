/* 3dtrading · r57 · shared binding state (TDBind)
 *
 * Loaded by BOTH the dashboard's 绑定币安 modal and the tutorial's last step (/3dtrading-site/bind/tutorial/), so the two share one
 * account-name draft, one key check and one bound-account list.
 *
 * DEMO ONLY. There is no binding backend:
 *   - the API Key is never written to storage, logs, the URL or sent anywhere; only its length / shape is looked at;
 *   - the fixed demo key "1234" adds a DEMO account (label 'demo-bind', device 'demo') to this browser's local account
 *     list. It is always shown as 「演示绑定 · 未连接币安」 and never claims a real Binance connection;
 *   - a real-looking 64-character key only passes the format check and the account stays 「未连接」 (nothing is added).
 * Accounts live in the same localStorage list TDAccount uses ('3dt.accounts:<email>'), so the dashboard sees them.
 */
(function (g) {
  'use strict';
  if (g.TDBind) return;
  var DRAFT = '3dt.bindDraft', DEMO_KEY = '1234', LABEL = 'demo-bind';
  var KS = '3dt.session', KA = '3dt.accounts:';
  function J(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function sess() { if (g.TDAccount && g.TDAccount.session) return g.TDAccount.session(); var s = J(KS); return s && s.email ? s : null; }
  function list() {
    if (g.TDAccount && g.TDAccount.accounts) return g.TDAccount.accounts().list;
    var s = sess(), d = s ? J(KA + s.email) : null; return d && Array.isArray(d.list) ? d.list : [];
  }
  function add(a) {
    if (g.TDAccount && g.TDAccount.upsertAccount) return g.TDAccount.upsertAccount(a);
    var s = sess(); if (!s) return null;
    var d = J(KA + s.email) || { active: 'all', list: [] }; if (!Array.isArray(d.list)) d.list = [];
    a.id = 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); d.list.push(a);
    if (d.list.length === 1) d.active = a.id; else if (!d.active) d.active = 'all';
    try { localStorage.setItem(KA + s.email, JSON.stringify(d)); } catch (e) { return null; }
    return a;
  }
  /* name draft: per tab (sessionStorage), name only — never the key */
  function draft() { try { return (JSON.parse(sessionStorage.getItem(DRAFT) || '{}') || {}).name || ''; } catch (e) { return ''; } }
  function saveDraft(n) { try { if (n) sessionStorage.setItem(DRAFT, JSON.stringify({ name: String(n).slice(0, 24) })); else sessionStorage.removeItem(DRAFT); } catch (e) {} }
  /* 'empty' | 'demo' | 'format' (64 letters/digits: shape OK, still not connected) | 'bad' */
  function check(key) {
    var k = String(key || '').trim();
    if (!k) return 'empty'; if (k === DEMO_KEY) return 'demo';
    return /^[A-Za-z0-9]{64}$/.test(k) ? 'format' : 'bad';
  }
  function isDemoBind(a) { return !!a && a.label === LABEL; }
  function demoList() { return list().filter(isDemoBind); }
  function taken(n) { n = String(n || '').trim().toLowerCase(); return !!n && list().some(function (a) { return String(a.name || '').trim().toLowerCase() === n; }); }
  function nextName(en) { var i = 1, b = en ? 'Demo account ' : '演示账户 '; while (taken(b + i)) i++; return b + i; }
  /* bind({ key, name, en }) → { ok, code, account, name } ; codes: nosession empty bad format dup */
  function bind(o) {
    o = o || {};
    if (!sess()) return { ok: false, code: 'nosession' };
    var c = check(o.key); if (c !== 'demo') return { ok: false, code: c };
    var n = String(o.name || '').trim().slice(0, 24) || nextName(o.en);
    if (taken(n)) return { ok: false, code: 'dup', name: n };
    var a = add({ name: n, label: LABEL, device: 'demo', status: 'verified', at: Date.now(), checkedAt: Date.now() });
    if (!a) return { ok: false, code: 'nosession' };
    saveDraft('');
    return { ok: true, code: 'demo', account: a, name: n };
  }
  g.TDBind = { check: check, bind: bind, draft: draft, saveDraft: saveDraft, taken: taken, nextName: nextName, demoList: demoList, isDemoBind: isDemoBind, signedIn: function () { return !!sess(); }, DEMO_KEY: DEMO_KEY, version: 'r57' };
})(window);
