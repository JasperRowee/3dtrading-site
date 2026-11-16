/* 3dtrading · API adapter (window.TDApi) — the ONLY place pages talk to a backend.
 *
 * DEMO MODE (2026-11-13, r38): there is no backend yet. Every function below returns made-up demo data,
 * tagged `demo: true`, so pages can label it 「演示 / Demo」. No request ever leaves the browser:
 * nothing here calls fetch / XHR / WebSocket, nothing talks to Binance, no notification is really sent.
 *
 * When the backend contract is final, replace the `demo` transport at the bottom of this file
 * (or swap this file) — pages only call TDApi.*. This holds for the KNOWN contract only: if the final
 * API adds fields, states, paging, error shapes or a different session model, pages need changes too.
 *
 * Rules kept here on purpose (repo is public):
 *  - the frontend never sees a Secret or private key; it only shows the PUBLIC key the backend returns;
 *  - IPs, permissions and failure texts come from this adapter, never hard-coded in pages;
 *  - demo IPs use documentation ranges only (192.0.2.x, 198.51.100.x, 203.0.113.x);
 *  - browser storage holds name / uid / label / status only — never an API Key in full;
 *  - no trading parameter is computed in the browser: plan cards come back from proposePlan().
 *
 * All functions return Promises. Errors reject with { code, message, demo } (shape to confirm with backend).
 */
(function (global) {
  'use strict';
  if (global.TDApi) return;

  var VERSION = 'r38-demo-1';
  var MODE = 'demo';
  var A = function () { return global.TDAccount; };
  var lang = function () { try { return A() ? A().lang() : 'zh'; } catch (e) { return 'zh'; } };
  var L = function (o) { return o ? (o[lang()] || o.zh || o.en || '') : ''; };
  var delay = function (v, ms) { return new Promise(function (r) { setTimeout(function () { r(v); }, ms == null ? 120 : ms); }); };
  var fail = function (code, zh, en) { return Promise.reject({ code: code, message: lang() === 'en' ? en : zh, demo: true }); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  /* ---------- statuses & failure codes (texts are demo copy; backend will own the final wording) ---------- */
  var STATUSES = {
    awaiting_key: { zh: '等待贴回 API Key', en: 'Waiting for your API Key', tone: 'wait' },
    checking: { zh: '接入测试中', en: 'Connection test running', tone: 'wait' },
    verified: { zh: '测试通过', en: 'Test passed', tone: 'ok' },
    failed: { zh: '测试未通过', en: 'Test failed', tone: 'bad' },
    observing: { zh: '试运行（只观察）', en: 'Trial run (observe only)', tone: 'ok' },
    running: { zh: '运行中', en: 'Running', tone: 'ok' },
    halted: { zh: '已停机', en: 'Halted', tone: 'bad' },
    unbound: { zh: '已解绑', en: 'Unbound', tone: 'off' }
  };
  var UNKNOWN_STATUS = { zh: '处理中', en: 'Processing', tone: 'wait' };

  var FAILURES = {
    PERM_MISSING: { security: false,
      zh: { t: '缺少必要权限', how: '回到币安这个 API 的「编辑权限」，按清单把必勾的几项都勾上，保存后点「重新测试」。' },
      en: { t: 'A required permission is missing', how: 'In Binance, edit this API’s permissions, tick every required item on the list, save, then run the test again.' } },
    WITHDRAW_ON: { security: false,
      zh: { t: '提现权限被打开了', how: '提现必须关闭。到币安这个 API 的权限里取消「允许提现」，保存后重新测试。' },
      en: { t: 'Withdrawals are enabled', how: 'Withdrawals must stay off. Untick “Enable Withdrawals” on this API in Binance, save, then test again.' } },
    IP_RESTRICT_OFF: { security: false,
      zh: { t: '没有开启 IP 限制', how: '在币安选择「限制只对受信任 IP 访问」，填入页面给出的 IP，保存后重新测试。' },
      en: { t: 'IP restriction is off', how: 'In Binance choose “Restrict access to trusted IPs only”, enter the IPs shown here, save, then test again.' } },
    IP_MISMATCH: { security: true,
      zh: { t: '请求来自不在白名单里的 IP', how: '这是安全事件。请立即到币安删除这个 API，然后重新申请绑定。' },
      en: { t: 'A request came from an IP outside the whitelist', how: 'This is a security event. Delete this API in Binance now, then start a new binding.' } },
    NOT_SUBACCOUNT: { security: false,
      zh: { t: '这不是子账户的 API', how: '请在币安先创建子账户，再在子账户下创建 API。不要用主账户的 API。' },
      en: { t: 'This API does not belong to a sub-account', how: 'Create a sub-account in Binance first, then create the API under it. Do not use a main-account API.' } },
    PM_OFF: { security: false,
      zh: { t: '子账户没有开通统一账户', how: '在币安为这个子账户开通统一账户（Portfolio Margin），完成后重新测试。' },
      en: { t: 'Portfolio Margin is not enabled', how: 'Enable Portfolio Margin for this sub-account in Binance, then test again.' } },
    KEY_TYPE_WRONG: { security: false,
      zh: { t: 'API 类型不对', how: '创建 API 时要选「自行生成」，并粘贴我们给你的公钥；系统生成的 HMAC 密钥不能用。删掉这个 API 后重新创建。' },
      en: { t: 'Wrong API type', how: 'Choose “Self-generated” when creating the API and paste the public key we gave you. A system-generated HMAC key will not work. Delete it and create a new one.' } },
    SIGNATURE_MISMATCH: { security: true,
      zh: { t: '签名和我们给你的公钥对不上', how: '这是安全事件。请立即到币安删除这个 API，然后重新申请绑定。' },
      en: { t: 'Signature does not match the public key we gave you', how: 'This is a security event. Delete this API in Binance now, then start a new binding.' } },
    UID_MISMATCH: { security: false,
      zh: { t: 'UID 和这个 API 所属账户不一致', how: '检查填写的子账户 UID 是否正确；如果 UID 填错了，解绑后重新申请。' },
      en: { t: 'The UID does not match the account that owns this API', how: 'Check the sub-account UID. If it was wrong, unbind and start a new binding.' } }
  };
  var CODES = Object.keys(FAILURES);

  /* ---------- connection test steps (names / order to confirm with backend) ---------- */
  var TEST_STEPS = [
    { key: 'reach', zh: '能用这个 API Key 访问币安', en: 'Binance accepts this API Key', codes: ['KEY_TYPE_WRONG', 'SIGNATURE_MISMATCH'] },
    { key: 'sub', zh: '属于你填写的子账户', en: 'Belongs to the sub-account you entered', codes: ['NOT_SUBACCOUNT', 'UID_MISMATCH'] },
    { key: 'pm', zh: '已开通统一账户', en: 'Portfolio Margin is on', codes: ['PM_OFF'] },
    { key: 'perm', zh: '权限正确，提现关闭', en: 'Permissions correct, withdrawals off', codes: ['PERM_MISSING', 'WITHDRAW_ON'] },
    { key: 'ip', zh: '只允许我们服务器的 IP', en: 'Only our server IPs are allowed', codes: ['IP_RESTRICT_OFF', 'IP_MISMATCH'] }
  ];

  /* ---------- demo bind kit: documentation-range IPs, permission list ---------- */
  var DEMO_IPS = ['192.0.2.10', '198.51.100.20', '203.0.113.30'];
  var DEMO_PERMS = [
    { key: 'read', required: true, zh: '允许读取', en: 'Enable Reading' },
    { key: 'spot_margin', required: true, zh: '启用现货、杠杆和股票交易', en: 'Enable Spot & Margin Trading' },
    { key: 'margin_loan', required: true, zh: '允许杠杆质押借币、还款和划转', en: 'Enable Margin Loan, Repay & Transfer' },
    { key: 'pm_trade', required: true, zh: '开启统一账户交易', en: 'Enable Portfolio Margin Trading' },
    { key: 'universal_transfer', required: true, zh: '允许万向划转（只在本子账户内调度保证金）', en: 'Permits Universal Transfer (moves margin within this sub-account only)' },
    { key: 'withdraw', required: false, forbidden: true, zh: '允许提现 —— 必须关闭', en: 'Enable Withdrawals — must stay OFF' }
  ];

  /* deterministic EXAMPLE public key per account (format-valid ED25519 SPKI; no private key exists anywhere) */
  function examplePub(id) {
    var h = 2166136261 >>> 0, s = 'td-demo-pub:' + id, bytes = [0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00];
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    for (var j = 0; j < 32; j++) { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; bytes.push(h & 255); }
    var b64 = btoa(String.fromCharCode.apply(null, bytes));
    return '-----BEGIN PUBLIC KEY-----\n' + b64 + '\n-----END PUBLIC KEY-----';
  }
  function fingerprintOf(pem) {
    var b = pem.replace(/-----[^-]+-----|\s/g, ''), body = b.slice(16); // drop the fixed SPKI prefix
    return body.slice(0, 8) + '…' + body.slice(-8).replace(/=+$/, '');
  }

  /* ---------- demo state (accounts persist through TDAccount's whitelist: name/uid/label/status only) ---------- */
  var mem = { keyTail: {}, failCodes: {}, timers: {}, nextOutcome: null };
  /* legacy local data (r28–r37): pending → awaiting_key; old failure reasons → nearest code ('key' has no exact match) */
  var LEGACY_REASON = { ip: 'IP_RESTRICT_OFF', perm: 'PERM_MISSING' };
  function normStatus(s) { return s == null || s === '' || s === 'pending' ? 'awaiting_key' : String(s); }
  function codesOf(reason) { return String(reason || '').split(',').map(function (c) { return LEGACY_REASON[c] || c; }).filter(function (c) { return FAILURES[c]; }); }
  /* a check interrupted by a reload finishes from the outcome saved when it started */
  function settle(id) {
    var a = findAcct(id); if (!a || a.status !== 'checking' || mem.timers[id]) return;
    var codes = codesOf(a.reason); mem.failCodes[id] = codes;
    saveAcct({ id: id, status: codes.length ? 'failed' : 'observing', reason: codes.join(','), checkedAt: Date.now() });
  }
  function acctList() { return A() ? A().accounts().list : []; }
  function findAcct(id) { return acctList().filter(function (a) { return a.id === id; })[0] || null; }
  function saveAcct(a) { return A() ? A().upsertAccount(a) : a; }
  function view(a) {
    if (!a) return null;
    var v = { id: a.id, name: a.name, uid: a.uid || '', label: a.label || '', status: normStatus(a.status), demo: true };
    if (v.status === 'failed') v.failures = mem.failCodes[a.id] ? mem.failCodes[a.id].slice() : codesOf(a.reason);
    if (mem.keyTail[a.id]) v.apiKeyHint = mem.keyTail[a.id];
    return v;
  }
  function sessionOrFail() { var s = A() && A().session(); return s ? Promise.resolve(s) : fail('UNAUTHENTICATED', '请先登录（演示）', 'Please sign in first (demo)'); }

  var demo = {
    /* ---- session ---- */
    register: function (o) { var r = A().register(o || {}); return r.ok ? delay({ ok: true, session: r.session, needsAgreement: true, demo: true }) : fail(r.code === 'exists' ? 'EMAIL_EXISTS' : 'EMAIL_INVALID', r.code === 'exists' ? '这个邮箱已经注册过（演示）' : '请填写有效邮箱', r.code === 'exists' ? 'This email is already registered (demo)' : 'Enter a valid email'); },
    login: function (o) { var r = A().login(o || {}); return r.ok ? delay({ ok: true, session: r.session, twoFactor: 'simulated', demo: true }) : fail('NOT_FOUND', '没有找到这个邮箱（演示账号只在本机浏览器）', 'No account for this email (demo accounts live in this browser only)'); },
    logout: function (o) { A().logout(o); return delay({ ok: true, demo: true }, 0); },
    me: function () { var s = A() && A().session(); return delay(s ? { session: s, onboarding: onboarding(), demo: true } : null, 0); },
    acceptAgreement: function (o) { return sessionOrFail().then(function () { setOb({ agreed: o && o.version || 'placeholder-v0', agreedAt: Date.now() }); return delay({ ok: true, demo: true }); }); },
    getAgreement: function () {
      return delay({ version: 'placeholder-v0', pending: true, demo: true, title: L({ zh: '风险披露与服务协议', en: 'Risk disclosure & service agreement' }),
        note: L({ zh: '待法务定稿：以下为占位文案，不是正式协议。', en: 'Pending legal review: placeholder text, not the final agreement.' }),
        sections: [
          L({ zh: '数字资产价格波动大，策略可能亏损，过往表现不代表未来收益。', en: 'Crypto prices are volatile. The strategy can lose money; past performance does not predict future results.' }),
          L({ zh: '本金始终在你本人的币安子账户；提现永远关闭，我们无法转走你的资产。', en: 'Your principal stays in your own Binance sub-account. Withdrawals are always off; we cannot move your assets out.' }),
          L({ zh: '我们按协议只做约定的交易与必要查询；任何不在计划内的划转都会立即停机并通知你。', en: 'We only place the agreed trades and necessary queries. Any transfer outside the plan halts the system and notifies you.' }),
          L({ zh: '费用与结算规则：待定稿。', en: 'Fees and settlement: to be finalised.' })
        ] });
    },
    getPlanOptions: function () {
      return delay({ demo: true, pending: true,
        note: L({ zh: '档位和资金范围为演示，正式口径待业务确认。', en: 'Tiers and ranges are demo values; final definitions pending business sign-off.' }),
        sizes: [{ key: 's1', zh: '20万–50万 USDT', en: '200k–500k USDT' }, { key: 's2', zh: '50万–200万 USDT', en: '500k–2M USDT' }, { key: 's3', zh: '200万 USDT 以上', en: 'Over 2M USDT' }].map(function (x) { return { key: x.key, label: L(x) }; }),
        risks: [{ key: 'steady', zh: '稳健', en: 'Steady', d: { zh: '保证金率留得更宽，收益更平。', en: 'Wider margin buffer, smoother returns.' } },
                { key: 'balanced', zh: '均衡', en: 'Balanced', d: { zh: '默认档。', en: 'Default tier.' } },
                { key: 'active', zh: '积极', en: 'Active', d: { zh: '仓位更满，波动更大。', en: 'Fuller positions, larger swings.' } }].map(function (x) { return { key: x.key, label: L(x), desc: L(x.d) }; }) });
    },
    choosePlan: function (o) { return sessionOrFail().then(function () { setOb({ size: o && o.size, risk: o && o.risk, planAt: Date.now() }); return delay({ ok: true, demo: true }); }); },

    /* ---- binding ---- */
    createAccount: function (o) {
      return sessionOrFail().then(function () {
        o = o || {};
        var name = String(o.name || '').trim(), uid = String(o.uid || '').trim();
        if (!name) return fail('NAME_REQUIRED', '请填写名称', 'Enter a name');
        if (!/^\d{6,12}$/.test(uid)) return fail('UID_INVALID', 'UID 是 6–12 位数字', 'UID is 6–12 digits');
        var list = acctList().filter(function (a) { return a.status !== 'unbound'; });
        if (list.some(function (a) { return a.name.toLowerCase() === name.toLowerCase(); })) return fail('NAME_TAKEN', '这个名称已经用过', 'That name is already used');
        if (list.some(function (a) { return a.uid === uid && a.id !== 'demo-binance'; })) return fail('UID_TAKEN', '这个 UID 已经绑定过', 'That UID is already linked');
        var a = saveAcct({ name: name.slice(0, 40), uid: uid, label: String(o.label || '').trim().slice(0, 40), device: 'web', status: 'awaiting_key', reason: '' });
        return delay({ id: a.id, status: 'awaiting_key', demo: true });
      });
    },
    getBindKit: function (id) {
      var a = findAcct(id);
      if (!a) return fail('NOT_FOUND', '没有这个账户', 'Account not found');
      var pem = examplePub(id);
      return delay({ id: id, keyType: 'ED25519', publicKeyPem: pem, fingerprint: fingerprintOf(pem), example: true, demo: true,
        ips: DEMO_IPS.slice(), perms: clone(DEMO_PERMS) });
    },
    submitApiKey: function (id, apiKey) {
      var a = findAcct(id);
      if (!a) return fail('NOT_FOUND', '没有这个账户', 'Account not found');
      var k = String(apiKey || '').trim();
      if (!/^[A-Za-z0-9]{64}$/.test(k)) return fail('KEY_FORMAT', 'API Key 应为 64 位字母或数字', 'The API Key should be 64 letters or digits');
      mem.keyTail[id] = k.slice(0, 4) + '…' + k.slice(-4); // memory only, never stored
      k = apiKey = null;
      var out = mem.nextOutcome; mem.nextOutcome = null;
      var codes = out == null || out === 'pass' ? [] : [].concat(out).filter(function (c) { return FAILURES[c]; });
      mem.failCodes[id] = codes;
      // arm the timer before saving: saving fires the accounts event, and a listener that calls getAccount must see
      // a running test (otherwise settle() would finish it at once and the ticks would never show)
      clearTimeout(mem.timers[id]);
      mem.timers[id] = setTimeout(function () { delete mem.timers[id]; if (!findAcct(id)) return; saveAcct({ id: id, status: codes.length ? 'failed' : 'observing', reason: codes.join(','), checkedAt: Date.now() }); }, 1600);
      saveAcct({ id: id, status: 'checking', reason: codes.join(',') });
      return delay({ id: id, status: 'checking', steps: TEST_STEPS.map(function (s) { return { key: s.key, label: L(s) }; }), demo: true });
    },
    /* r41 · connect.html (HMAC, 「系统生成」): permissions and IPs for the page, no account needed. */
    getConnectKit: function () {
      return delay({ keyType: 'HMAC', example: true, demo: true, ips: DEMO_IPS.slice(), perms: clone(DEMO_PERMS),
        verifier: false, note: L({ zh: '验证服务未接入：本版不会把 Key 发到任何地方。', en: 'Verification service not connected: this build sends the keys nowhere.' }),
        /* r43: what the page may offer to COPY. Both are null until a real backend supplies them — the documentation-range
         * IPs above are display examples and must never be copied as an allow-list, and there is no 3dtrading public key
         * for Binance's 「自行生成」(Ed25519 / RSA) type until a server-side key pair exists. */
        allowIps: null,
        selfGenerated: { supported: false, keyTypes: ['ED25519', 'RSA'], publicKey: null,
          reason: L({ zh: '3dtrading 的公钥还没有配置：需要后端生成密钥对并只把公钥发给页面。', en: '3dtrading’s public key is not configured yet: the backend must create the key pair and send only the public key to this page.' }),
          /* r48 · Jasper's 自行生成 binding window shows what to copy even before the backend exists, as clearly labelled
           * EXAMPLES: the format-valid example public key (examplePub, no private key exists for it anywhere, so Binance
           * would accept the paste but nothing could ever sign with it) and the first two documentation-range IPs
           * (RFC 5737, never routed on the internet). publicKey / allowIps stay null: the page must prefer them the
           * moment a real backend supplies them, and must badge the example values 「示例」 until then. */
          example: (function () { var pem = examplePub('connect-self'); return { demo: true, keyType: 'ED25519', publicKeyPem: pem, fingerprint: fingerprintOf(pem), ips: DEMO_IPS.slice(0, 2) }; })() } });
    },
    /* r43 · 「自行生成」path: Binance returns only an API Key (no Secret). Without a configured 3dtrading public key and a
     * verification service this can never connect: format check, then PUBLIC_KEY_NOT_CONFIGURED. Nothing stored or sent. */
    submitSelfGeneratedKey: function (o) {
      return sessionOrFail().then(function () {
        o = o || {};
        var name = String(o.name || '').trim(), k = String(o.apiKey || '').trim();
        o.apiKey = null;
        var bad = [];
        if (!name) bad.push({ field: 'name', code: 'NAME_REQUIRED', message: L({ zh: '请填写名称', en: 'Enter a name' }) });
        if (!/^[A-Za-z0-9]{64}$/.test(k)) bad.push({ field: 'apiKey', code: 'KEY_FORMAT', message: L({ zh: 'API Key 应为 64 位字母或数字', en: 'The API Key should be 64 letters or digits' }) });
        k = null;
        if (bad.length) return delay({ ok: false, status: 'invalid', errors: bad, demo: true });
        return delay({ ok: false, status: 'service_unavailable', code: 'PUBLIC_KEY_NOT_CONFIGURED', connected: false, stored: false, demo: true,
          message: L({ zh: '3dtrading 公钥和验证服务都还没接入：这把 API Key 没有发送、没有保存，账户未连接。', en: 'Neither 3dtrading’s public key nor the verification service is set up yet: this API Key was not sent or saved, and the account is not connected.' }) }, 700);
      });
    },
    /* r41 · API Key + Secret Key. A format check only — never a pass. The Secret is dropped before this returns:
     * not stored, not logged, not sent. With no secure verification service the account stays unconnected. */
    submitApiCredentials: function (o) {
      return sessionOrFail().then(function () {
        o = o || {};
        var name = String(o.name || '').trim(), k = String(o.apiKey || '').trim(), sct = String(o.secret || '').trim();
        o.secret = o.apiKey = null;
        var bad = [];
        if (!name) bad.push({ field: 'name', code: 'NAME_REQUIRED', message: L({ zh: '请填写名称', en: 'Enter a name' }) });
        if (!/^[A-Za-z0-9]{64}$/.test(k)) bad.push({ field: 'apiKey', code: 'KEY_FORMAT', message: L({ zh: 'API Key 应为 64 位字母或数字', en: 'The API Key should be 64 letters or digits' }) });
        if (!/^[A-Za-z0-9]{64}$/.test(sct)) bad.push({ field: 'secret', code: 'SECRET_FORMAT', message: L({ zh: 'Secret Key 应为 64 位字母或数字', en: 'The Secret Key should be 64 letters or digits' }) });
        else if (sct === k) bad.push({ field: 'secret', code: 'SECRET_SAME', message: L({ zh: 'Secret Key 不能和 API Key 相同', en: 'The Secret Key cannot match the API Key' }) });
        k = sct = null;
        if (bad.length) return delay({ ok: false, status: 'invalid', errors: bad, demo: true });
        return delay({ ok: false, status: 'service_unavailable', code: 'VERIFY_SERVICE_MISSING', connected: false, stored: false, demo: true,
          message: L({ zh: '格式没问题，但安全验证服务还没接入：Key 和 Secret 没有发送、没有保存，账户未连接。', en: 'The format is fine, but the secure verification service is not connected yet: the keys were not sent or saved, and the account is not connected.' }) }, 700);
      });
    },
    /* re-check (?id=) reruns step ④ only — same public key, so the page asks for the API Key again */
    retest: function (id) { var a = findAcct(id); if (!a) return fail('NOT_FOUND', '没有这个账户', 'Account not found'); clearTimeout(mem.timers[id]); delete mem.timers[id]; saveAcct({ id: id, status: 'awaiting_key', reason: '' }); delete mem.failCodes[id]; return delay({ id: id, status: 'awaiting_key', demo: true }); },
    getAccount: function (id) {
      settle(id);
      var a = findAcct(id);
      if (!a) return fail('NOT_FOUND', '没有这个账户', 'Account not found');
      var v = view(a);
      if (v.status === 'checking' || v.status === 'failed' || v.status === 'observing' || v.status === 'verified') {
        var bad = v.failures || [];
        v.steps = TEST_STEPS.map(function (s) {
          var hit = s.codes.filter(function (c) { return bad.indexOf(c) >= 0; });
          return { key: s.key, label: L(s), state: v.status === 'checking' ? 'running' : hit.length ? 'failed' : 'passed', codes: hit };
        });
      }
      if (v.failures) v.security = v.failures.some(function (c) { return FAILURES[c].security; });
      return delay(v, 60);
    },
    listAccounts: function () { acctList().forEach(function (a) { settle(a.id); }); return delay(acctList().map(view), 0); },
    unbind: function (id) {
      var a = findAcct(id);
      if (!a) return fail('NOT_FOUND', '没有这个账户', 'Account not found');
      var hint = mem.keyTail[id] || 'EXMP…DEMO';
      clearTimeout(mem.timers[id]); delete mem.timers[id];
      A().removeAccount(id); delete mem.keyTail[id]; delete mem.failCodes[id];
      return delay({ id: id, status: 'unbound', apiKeyHint: hint, demo: true });
    },

    /* ---- dashboard (numbers come from the demo dashboard source registered by app/, see TDApi.demo.registerDashboard) ---- */
    getDashboard: function (o) { return dash('getDashboard', o); },
    getHistory: function (o) { return dash('getHistory', o); },
    getLive: function (o) { return dash('getLive', o); },
    /* alert cards on the overview; each carries a question for Dodo and can become a pending plan card */
    getAlerts: function (o) { return dash('getAlerts', o); },
    /* user-initiated only (button on the "no account" state): adds the labelled demo account, metadata only */
    addDemoAccount: function () { return sessionOrFail().then(function () { return dash('addDemoAccount'); }); },
    getActions: function (o) {
      var t0 = Date.now() - 3 * 864e5;
      var rows = [
        { at: t0 + 3.6e6, action: { zh: '开始试运行（只观察），未下任何单', en: 'Trial run started (observe only), no orders placed' }, result: { zh: '完成', en: 'Done' }, ok: true, plan: 'P-2026.11-001' },
        { at: t0 + 9e7, action: { zh: '按方案分 3 批建立对冲仓位', en: 'Opened hedge in 3 batches per plan' }, result: { zh: '3/3 批成交', en: '3 of 3 batches filled' }, ok: true, plan: 'P-2026.11-002' },
        { at: t0 + 1.4e8, action: { zh: '在本子账户内划转保证金到合约钱包', en: 'Moved margin to the futures wallet within this sub-account' }, result: { zh: '完成 · 计划内', en: 'Done · in plan' }, ok: true, plan: 'P-2026.11-002' },
        { at: t0 + 2.1e8, action: { zh: '保证金率接近下限，暂停加仓', en: 'Margin ratio near floor, paused adding' }, result: { zh: '已暂停', en: 'Paused' }, ok: false, plan: 'P-2026.11-003' }
      ];
      return delay({ demo: true, rows: rows.map(function (r) { return { at: r.at, action: L(r.action), result: L(r.result), ok: r.ok, plan: r.plan }; }) });
    },
    /* plan card: the BACKEND drafts it; the browser never computes trading parameters */
    proposePlan: function (o) {
      var text = String(o && o.text || '').trim();
      if (!text) return fail('EMPTY', '先说一句你想做什么', 'Say what you want to do first');
      var n = ++planSeq;
      return delay({ demo: true, id: 'demo-plan-' + n, version: 'P-2026.11-' + String(100 + n), from: o && o.from || 'input', ask: text,
        what: L({ zh: '把保证金率拉回到更宽的区间：先减一部分对冲仓位', en: 'Bring the margin ratio back into a wider band by trimming part of the hedge' }),
        batches: 3,
        cost: L({ zh: '约 0.04%（演示数字）', en: '≈0.04% (demo figure)' }),
        marginImpact: L({ zh: '保证金率由 3.1 升到约 3.8（演示数字）', en: 'Margin ratio from 3.1 to about 3.8 (demo figure)' }),
        vsNothing: L({ zh: '什么都不做：行情再跌 8% 时会触发自动停机（演示）', en: 'Do nothing: an 8% further drop would trigger an automatic halt (demo)' }),
        expiresIn: 15 * 60 }, 500);
    },
    confirmPlan: function (id, o) {
      var code = String(o && o.otp || '').trim();
      if (!/^\d{6}$/.test(code)) return fail('OTP_REQUIRED', '请输入 6 位验证码（演示：任意 6 位数字）', 'Enter the 6-digit code (demo: any 6 digits)');
      return delay({ ok: true, id: id, status: 'queued', demo: true, note: L({ zh: '演示：没有真实下单', en: 'Demo: no real order placed' }) }, 400);
    },
    /* Dodo is read-only: it can explain and draft a plan card, never place an order */
    askDodo: function (o) {
      var q = String(o && o.q || '').trim();
      return delay({ demo: true, readOnly: true, answer: L({ zh: '（演示回答）我只能读你的账户数据并解释；要改动时我会给你起草一张方案卡，由你确认。', en: '(Demo answer) I can only read your account and explain it. If something should change I will draft a plan card for you to confirm.' }), canDraft: !!q }, 300);
    },
    getNotifySettings: function () { return delay(clone(notify()), 0); },
    setNotifySettings: function (patch) {
      var n = notify();
      Object.keys(patch || {}).forEach(function (ch) { if (n.channels[ch]) Object.assign(n.channels[ch], pick(patch[ch], ['on', 'linked', 'target'])); });
      try { sessionStorage.setItem('3dt.demoNotify', JSON.stringify(n)); } catch (e) {}
      return delay(clone(n));
    },

    /* ---- texts ---- */
    getFailureText: function (code) { var f = FAILURES[code]; return f ? { code: code, title: L(f).t, how: L(f).how, security: f.security, demo: true } : { code: code, title: L({ zh: '未知原因（' + code + '）', en: 'Unknown reason (' + code + ')' }), how: L({ zh: '请联系我们或问 Dodo。', en: 'Contact us or ask Dodo.' }), security: false, demo: true }; }
  };

  var planSeq = 0;
  function pick(o, ks) { var r = {}; ks.forEach(function (k) { if (o && o[k] != null) r[k] = o[k]; }); return r; }
  function notify() {
    var d = null; try { d = JSON.parse(sessionStorage.getItem('3dt.demoNotify') || 'null'); } catch (e) {}
    return d || { demo: true, channels: { telegram: { linked: false, on: false, target: '' }, discord: { linked: false, on: false, target: '' }, email: { linked: true, on: true, target: '' } },
      note: L({ zh: '演示：不会真实发送任何通知', en: 'Demo: no notification is actually sent' }) };
  }
  function obKey() { var s = A() && A().session(); return s ? '3dt.onboarding:' + s.email : null; }
  function onboarding() { var k = obKey(); try { return k ? JSON.parse(localStorage.getItem(k) || '{}') : {}; } catch (e) { return {}; } }
  function setOb(p) { var k = obKey(); if (!k) return; var o = Object.assign(onboarding(), p); try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} }

  var dashSrc = null;
  function dash(fn, o) {
    if (!dashSrc || typeof dashSrc[fn] !== 'function') return fail('NOT_AVAILABLE', '演示数据未加载', 'Demo data not loaded');
    return Promise.resolve(dashSrc[fn](o || {})).then(function (d) { if (d && typeof d === 'object') d.demo = true; return d; });
  }

  /* ---------- public surface ---------- */
  var api = { version: VERSION, mode: MODE, demo: true };
  Object.keys(demo).forEach(function (k) { api[k] = function () { return demo[k].apply(null, arguments); }; });
  api.statuses = function () { return Object.keys(STATUSES); };
  api.statusInfo = function (s) { s = normStatus(s); var x = STATUSES[s] || UNKNOWN_STATUS; return { status: s, known: !!STATUSES[s], label: L(x), tone: x.tone }; };
  api.testSteps = function () { return TEST_STEPS.map(function (s) { return { key: s.key, label: L(s) }; }); };
  api.failureCodes = function () { return CODES.slice(); };
  api.isSecurityCode = function (c) { return !!(FAILURES[c] && FAILURES[c].security); };
  /* demo-only controls: pages show them inside a clearly labelled 「演示」 box */
  api.demoControls = {
    setNextOutcome: function (v) { mem.nextOutcome = v; },
    setStatus: function (id, st, codes) { if (codes) mem.failCodes[id] = [].concat(codes); return saveAcct({ id: id, status: st, reason: codes ? [].concat(codes).join(',') : '' }); },
    registerDashboard: function (src) { dashSrc = src; }
  };

  /* Optional loopback-only read transport. Credentials remain in the Python service. */
  async function liveRead() {
    const DAY = 86400000, SG = 8 * 3600000, DAYS = 91, nowMs = Date.now();
    const sgDay = ms => Math.floor((ms + SG) / DAY);
    const f = v => Number(v) || 0;
    const coinOf = s => String(s).replace(/USDT$|USDC$|USD_PERP$|USD_\d+$/g, '');
    async function get(url) {
      const abort = new AbortController(), timer = setTimeout(() => abort.abort(), 180000);
      try {
        const r = await fetch(url, {headers: {'X-3dtrading-Local': '1'}, cache: 'no-store', credentials: 'omit', signal: abort.signal});
        if (!r.ok) throw new Error('READ_ONLY_HTTP_' + r.status);
        return await r.json();
      } finally { clearTimeout(timer); }
    }
      const [A, H] = await Promise.all([get('/api/live-account'), get('/api/live-history')]);
      const syms = {}; (A.um || []).forEach(p => { if (!f(p.positionAmt)) return; const c = coinOf(p.symbol); const n = Math.abs(f(p.notional) || 0); if (!syms[c] || n > syms[c][1]) syms[c] = [p.symbol, n]; });
      (A.cm || []).forEach(p => { const c = coinOf(p.symbol); if (f(p.positionAmt) && !syms[c]) syms[c] = [c + 'USDT', 0]; });
      [...Object.keys(H.trades || {}), ...Object.keys(H.cmTrades || {}).map(s => coinOf(s) + 'USDT')].forEach(s => { const c = coinOf(s); if (!syms[c]) syms[c] = [s, 0]; });
      const day0 = (sgDay(nowMs) - DAYS) * DAY - SG, k = (m, s, iv, st) => get(`/api/klines?market=${m}&symbol=${s}&interval=${iv}&startTime=${st}`).catch(() => null);
      const ent = Object.entries(syms), res = await Promise.all([...ent.map(([, [s]]) => k('um', s, '1h', day0)), k('um', 'BNBUSDT', '1d', day0 - 5 * DAY), k('spot', 'WLFIUSDT', '1d', day0 - 5 * DAY)]);
      const K = { coins: Object.fromEntries(ent.map(([c], i) => [c, res[i]])), BNB: res[ent.length], WLFI: res[ent.length + 1] };

    return {available: true, demo: false, account: A, history: H, klines: K};
  }
  if (global.TD_LIVE_MODE === true) {
    api.getLive = liveRead;
    api.liveMode = 'readonly';
    api.confirmPlan = function () { return Promise.reject(new Error('READ_ONLY_MODE')); };
  }

  /* r47 · Bot API：只问本站后台（同源 /api/bot/*），不连任何第三方，不带 Cookie，4 秒超时。
     没有这个服务时（静态预览会回 404）就照实返回 ok:false + HTTP 码；页面据此显示「未连接」。
     密钥只放在这一次 POST 的请求体里，这里不缓存、不写任何存储。 */
  function botReq(path, opt) {
    var ab = new AbortController(), timer = setTimeout(function () { ab.abort(); }, 4000);
    var o = { credentials: 'omit', cache: 'no-store', signal: ab.signal, headers: { 'X-3dtrading-Local': '1', 'Accept': 'application/json' } };
    if (opt && opt.body) { o.method = 'POST'; o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(opt.body); }
    return fetch(path, o).then(function (r) {
      var json = (r.headers.get('content-type') || '').indexOf('json') >= 0;
      return (json ? r.json().catch(function () { return null; }) : Promise.resolve(null)).then(function (j) { return { ok: r.ok, code: r.status, j: j }; });
    }, function () { return { ok: false, code: 0, j: null }; }).then(function (x) { clearTimeout(timer); return x; });
  }
  api.botStatus = function () { return botReq('/api/bot/status'); };
  api.botBind = function (url, key) { return botReq('/api/bot/bind', { body: { url: url, key: key } }); };

  global.TDApi = api;
})(window);
