/* 3dtrading r49 · 币安绑定页独立预览 · shared by index.html and tutorial/.
 * Replaces the dashboard's td-account.js / api-adapter.js for this page only: no login, no session, no other routes.
 * Own storage namespace "3dt49bn." (language + day/night only; never a key). Nothing is sent anywhere.
 *
 * Binding scheme = r48 「自行生成」 (Ed25519): 3dtrading would create the key pair on its server and hand this page ONLY the
 * public key; the user pastes it into Binance, Binance returns an API Key (no Secret). Until a backend exists, the public
 * key and the two IPs below are clearly labelled EXAMPLES:
 *  - examplePub() is the same format-valid example key as r48 api-adapter.js (examplePub('connect-self')). No private key
 *    exists for it anywhere, so nothing can ever sign with it.
 *  - the IPs are RFC 5737 documentation addresses, never routed on the internet.
 * submitKey() is a format check only and always answers "not connected". */
(function (g) {
  'use strict';
  var NS = '3dt49bn.';
  function get(k) { try { return g.localStorage.getItem(NS + k); } catch (e) { return null; } }
  function set(k, v) { try { g.localStorage.setItem(NS + k, v); } catch (e) { /* private mode */ } }
  var EV = { lang: 'bn49:lang', theme: 'bn49:theme' };
  function emit(n, d) { try { g.dispatchEvent(new CustomEvent(n, { detail: d })); } catch (e) { /* old browsers */ } }

  /* ?lang=en / ?theme=day open the preview in that state (kept for the next visit) */
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('lang') === 'zh' || q.get('lang') === 'en') set('lang', q.get('lang'));
    /* r55: ?theme= is ignored; one fixed dark look */ try { g.localStorage.removeItem(NS + 'theme'); } catch (e) {}
  } catch (e) { /* no URLSearchParams */ }

  /* ---------- language ---------- */
  /* read once per page, so another open tab switching language never half-changes this one */
  var CUR = { lang: get('lang') === 'en' ? 'en' : 'zh', theme: 'night' };
  function lang() { return CUR.lang; }
  var DICT = { zh: {}, en: {} };
  function i18n(d) { ['zh', 'en'].forEach(function (l) { var s = d && d[l]; if (s) for (var k in s) DICT[l][k] = s[k]; }); }
  function has(k) { return DICT.zh[k] != null || DICT.en[k] != null; }
  function t(k, v) {
    var s = DICT[lang()][k]; if (s == null) s = DICT.zh[k]; if (s == null) return k;
    if (v) s = s.replace(/\{(\w+)\}/g, function (m, n) { return v[n] != null ? v[n] : m; });
    return s;
  }
  function apply(root) {
    root = root || document;
    var q = function (s) { return root.querySelectorAll(s); };
    Array.prototype.forEach.call(q('[data-i18n]'), function (el) { var k = el.getAttribute('data-i18n'); if (has(k)) el.textContent = t(k); });
    Array.prototype.forEach.call(q('[data-i18n-html]'), function (el) { var k = el.getAttribute('data-i18n-html'); if (has(k)) el.innerHTML = t(k); });
    Array.prototype.forEach.call(q('[data-i18n-attr]'), function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (p) {
        var i = p.indexOf(':'), k = p.slice(i + 1).trim(); if (i > 0 && has(k)) el.setAttribute(p.slice(0, i).trim(), t(k));
      });
    });
  }
  function htmlLang() { document.documentElement.lang = lang() === 'en' ? 'en' : 'zh-CN'; }
  function setLang(l) { if ((l !== 'zh' && l !== 'en') || l === lang()) return; CUR.lang = l; set('lang', l); htmlLang(); apply(document); emit(EV.lang, { lang: l }); }
  htmlLang();

  /* ---------- day / night (the main page only; the tutorial is always a dark Binance screen) ---------- */
  function theme() { return CUR.theme; }
  function setTheme(v) { return; /* r55: no switching */ if (v !== 'day' && v !== 'night') return; CUR.theme = v; set('theme', v); document.documentElement.dataset.theme = v; emit(EV.theme, { theme: v }); }

  /* ---------- the binding kit (examples until a backend supplies real values) ---------- */
  function examplePub(id) {
    var h = 2166136261 >>> 0, s = 'td-demo-pub:' + id, bytes = [0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00];
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    for (var j = 0; j < 32; j++) { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; bytes.push(h & 255); }
    var b64 = btoa(String.fromCharCode.apply(null, bytes));
    return '-----BEGIN PUBLIC KEY-----\n' + b64 + '\n-----END PUBLIC KEY-----';
  }
  function fingerprintOf(pem) { var b = pem.replace(/-----[^-]+-----|\s/g, ''), body = b.slice(16); return body.slice(0, 8) + '…' + body.slice(-8).replace(/=+$/, ''); }
  var PERMS = [
    { key: 'read', required: true, zh: '允许读取', en: 'Enable Reading' },
    { key: 'spot_margin', required: true, zh: '启用现货、杠杆和股票交易', en: 'Enable Spot & Margin Trading' },
    { key: 'margin_loan', required: true, zh: '允许杠杆质押借币、还款和划转', en: 'Enable Margin Loan, Repay & Transfer' },
    { key: 'pm_trade', required: true, zh: '开启统一账户交易', en: 'Enable Portfolio Margin Trading' },
    { key: 'universal_transfer', required: true, zh: '允许万向划转', en: 'Permits Universal Transfer' },
    /* r57: per Binance's own list (Jasper's image 2): prediction trading stays unticked; the pair whitelist is optional */
    { key: 'prediction', required: false, zh: '允许预测交易权限', en: 'Enable Prediction Trading' },
    { key: 'symbol_whitelist', required: false, optional: true, zh: '允许交易币对白名单', en: 'Enable Symbol Whitelist' }
  ];
  var PEM = examplePub('connect-self');
  /* real = null until a 3dtrading backend hands over its public key / outbound IPs; then the page drops the 「示例」 badges */
  var REAL = { publicKeyPem: null, ips: null };
  function kit() {
    var pem = REAL.publicKeyPem || PEM;
    return {
      keyType: 'ED25519', pubExample: !REAL.publicKeyPem, ipsExample: !(REAL.ips && REAL.ips.length),
      publicKeyPem: pem, fingerprint: fingerprintOf(pem),
      ips: REAL.ips && REAL.ips.length ? REAL.ips.slice(0, 2) : ['192.0.2.10', '198.51.100.20'],
      perms: PERMS.map(function (p) { var o = {}; for (var k in p) o[k] = p[k]; return o; })
    };
  }
  /* format check only: 64 letters / digits. The value is dropped before this returns; nothing is stored, logged or sent. */
  function submitKey(raw) {
    var ok = /^[A-Za-z0-9]{64}$/.test(String(raw || '').trim()); raw = null;
    return new Promise(function (res) {
      setTimeout(function () {
        res(ok ? { status: 'not_connected', connected: false, stored: false, sent: false } : { status: 'invalid', code: 'KEY_FORMAT' });
      }, ok ? 600 : 200);
    });
  }

  g.BN49 = { ns: NS, events: EV, lang: lang, setLang: setLang, t: t, i18n: i18n, apply: apply, theme: theme, setTheme: setTheme, kit: kit, submitKey: submitKey,
    url: { sub: { zh: 'https://www.binance.com/zh-CN/my/sub-account/account-management', en: 'https://www.binance.com/en/my/sub-account/account-management' },
      api: { zh: 'https://www.binance.com/zh-CN/my/sub-account/api-management', en: 'https://www.binance.com/en/my/sub-account/api-management' } } };
})(window);
