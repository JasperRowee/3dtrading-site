/* 3dtrading · 后台演示数据源（r38）
 * 只在演示模式下使用：所有数字都是按固定种子生成的示例，不是真实账户、不来自币安。
 * 通过 TDApi.demoControls.registerDashboard 注册；页面只经 TDApi.getDashboard / getHistory / getLive / getAlerts 取数。
 * 这里没有任何网络请求。后端接好后删掉本文件的 <script> 即可，页面不需要改取数方式。 */
(function (global) {
  'use strict';
  if (!global.TDApi || !TDApi.demoControls) return;

  /* ---------- deterministic simulation ---------- */
  function rng(seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(r) { var u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  var COINS = [['BTC', 61800, .024, .24], ['ETH', 2480, .031, .17], ['SOL', 142, .042, .14], ['BNB', 552, .027, .10], ['XRP', .54, .04, .08], ['DOGE', .118, .05, .08], ['LINK', 11.6, .04, .09], ['AVAX', 26.4, .046, .10]];
  var DAYS = 91, SUB = 8, FEE = .0004, TZ = 'Asia/Singapore';
  var DEMO_ID = 'demo-binance', DEMO_NAME = '示例账户';
  var SIMP = [
    { deposit: 200000, lev: .9, stable: .58, apy: .056, th: .017, seed: 11, tilt: [0, 0, 0, 0, 0, 0, 0, 0] },
    { deposit: 320000, lev: .7, stable: .66, apy: .052, th: .021, seed: 23, tilt: [0, 0, 0, 0, 0, 0, 0, 0] }
  ];
  var STB = [
    { s: 'RWUSD', c: '#0c8f78', w: .45, ref: 3.61, off: -.0007, amp: .0018, f: 7.3, ph: .3 },
    { s: 'BFUSD', c: '#c98500', w: .35, ref: 2.99, off: -.0069, amp: .0022, f: 11.1, ph: 1.7 },
    { s: 'USD1', c: '#3a6ed6', w: .20, ref: 5.05, off: .0137, amp: .0040, f: 5.2, ph: 2.9 }
  ];
  var hashId = function (id) { return Array.from(String(id)).reduce(function (h, c) { return Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; }, 2166136261); };

  var cache = null, sims = {};
  function base(mkq) {
    var key = JSON.stringify(mkq || {});
    if (cache && cache.key === key) return cache;
    var now = Date.now();
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(now));
    var h = +parts.find(function (p) { return p.type === 'hour'; }).value, m = +parts.find(function (p) { return p.type === 'minute'; }).value;
    var todaySubs = Math.max(1, Math.floor((h + m / 60) / 24 * SUB));
    var MKP = Object.assign({ av: .12, dr: .00001, mr: .15 }, mkq || {});
    var r = rng(20261108), n = (DAYS + 1) * SUB;
    var MK = COINS.map(function (c) { var p0 = c[1], vol = c[2], a = [p0], p = p0, anc = p0;
      for (var k = 1; k <= n; k++) { anc *= Math.exp(gauss(r) * vol * MKP.av / Math.sqrt(SUB) + MKP.dr); p *= Math.exp(gauss(r) * vol / Math.sqrt(SUB) + MKP.mr * Math.log(anc / p)); a.push(p); }
      return a; });
    /* r44 · fully locked demo: every coin holds equal long/short size (tilt 0). After rebalancing, the long and short entries can
       straddle the price, which leaves both legs slightly under water; for the example account the last few 3-hour slots of today
       drift (monotonically, without crossing a take-profit line) just past the nearer entry, so one leg shows a float profit and the
       other a float loss. Only demo prices change; every page still derives its numbers from the same simulation. */
    (function lockDemo() {
      var th = SIMP[0].th, last = DAYS * SUB + todaySubs, K = Math.max(1, last - 3);
      MK.forEach(function (a, j) {
        var eL = COINS[j][1], eS = eL;
        for (var i = 1; i <= K; i++) { if (a[i] >= eL * (1 + th)) eL = a[i]; if (a[i] <= eS * (1 - th)) eS = a[i]; }
        var p = a[K]; if (!(p < eL && p > eS)) return;
        var up = (eL - p) / eL <= (p - eS) / eS ? (j % 2 === 0) : (j % 2 === 0 && (eL - p) / eL < th * .6);
        var tg = up ? eL * (1 + th * .35) : eS * (1 - th * .35), n = last - K;
        for (var k = 1; k <= n; k++) a[K + k] = p * Math.pow(tg / p, k / n);
      });
    })();
    /* 1-hour candles: a seeded bridge through the 3-hour prices, so the K line passes through every trade price */
    var NSLOT = DAYS * SUB + todaySubs, NH = NSLOT * 3;
    var KH = COINS.map(function (c, j) {
      var vol = c[2], rr = rng(1000 + j), P = [MK[j][0]], sd = vol / Math.sqrt(24) * .55;
      for (var s = 1; s <= NSLOT; s++) {
        var a = Math.log(MK[j][s - 1]), b = Math.log(MK[j][s]), w1 = gauss(rr) * sd, w2 = gauss(rr) * sd;
        P.push(Math.exp(a + (b - a) / 3 + w1 * .82), Math.exp(a + (b - a) * 2 / 3 + w2 * .82), MK[j][s]);
      }
      var C = [];
      for (var hh = 1; hh <= NH; hh++) { var o = P[hh - 1], cc = P[hh], u = Math.abs(gauss(rr)) * sd * .5, d = Math.abs(gauss(rr)) * sd * .5; C.push({ h: hh, o: o, c: cc, hi: Math.max(o, cc) * (1 + u), lo: Math.min(o, cc) * (1 - d) }); }
      return C;
    });
    /* each reward asset's demo rate wanders around its 2026-10-10 snapshot reference; today's point equals the reference */
    var rates = []; for (var i = 0; i <= DAYS; i++) rates.push(STB.map(function (c) { var wv = function (x) { return c.amp * Math.sin(x / c.f + c.ph) + .0011 * Math.sin(x / 2.3 + c.ph * 2); }; return (c.ref / 100 + wv(i) - wv(DAYS)) * 100; }));
    var umrPts = []; for (var k2 = 29; k2 >= 0; k2--) umrPts.push({ t: now - k2 * 864e5, v: k2 ? +(4.85 + .42 * Math.sin(k2 * .43) + .16 * Math.sin(k2 * 1.9) - k2 * .006).toFixed(4) : 4.85, now: !k2 });
    var day0 = new Date(now); day0.setHours(0, 0, 0, 0);
    cache = { key: key, now: now, todaySubs: todaySubs, MK: MK, KH: KH, NH: NH, rates: rates, umr: 4.85, umrPts: umrPts,
      /* r46 · 订阅示例（只给示例账户）：本月已用 62% 额度；上月剩余 18%，按示例幅度 50% 换本月优惠。
         记录由后台用示例账户的模拟净资产按「总资产 × 1%」算出，全部标「示例」，不是真实到账 */
      wallet: { tok: 12500, used: 0.62, lastLeft: 0.18, discRate: 0.5 } };
    sims = {};
    return cache;
  }

  function simAccount(cfg, B) {
    var r = rng(cfg.seed), D = cfg.deposit, MK = B.MK, todaySubs = B.todaySubs;
    var st = COINS.map(function (c, j) { var q = D * cfg.lev * c[3] / c[1]; return { s: c[0], qL: q, qS: q * (1 + cfg.tilt[j]), eL: c[1], eS: c[1], q0: q }; });
    var realized = 0, fees = 0, interest = 0, stable = D * cfg.stable;
    st.forEach(function (p) { fees += (p.qL + p.qS) * p.eL * FEE; });
    stable -= fees;
    /* D3 comparison lines (demo, basis pending business sign-off):
       cmpSave = the same deposit simply placed in savings at the reward-pool rate;
       cmpNoRebal = the same opening positions held without any rebalancing (only the starting fee and the stable part's interest) */
    var save = D, nrStable = stable, nrI = 0;
    var days = [], trades = [];
    for (var d = 0; d <= DAYS; d++) {
      var n = d < DAYS ? SUB : todaySubs;
      var dy = { i: d, realized: 0, fees: 0, interest: 0, rebal: 0, coins: {} };
      var apy = cfg.apy + .006 * Math.sin(d / 9) + .003 * Math.sin(d / 3.1);
      for (var k = 1; k <= n; k++) {
        var idx = d * SUB + k;
        var tm = Math.floor((k - 1) * 24 / SUB * 60 + r() * 24 / SUB * 60);
        var time = String(Math.floor(tm / 60)).padStart(2, '0') + ':' + String(tm % 60).padStart(2, '0');
        st.forEach(function (p, j) {
          var px = MK[j][idx];
          var push = function (act, side, pnl, fee, extra) { trades.push(Object.assign({ d: d, time: time, ts: d * 1440 + tm, acct: cfg.id, coin: p.s, act: act, side: side, px: px, pnl: pnl, fee: fee }, extra)); };
          var pnl, f;
          if (px >= p.eL * (1 + cfg.th)) {
            pnl = p.qL * (px - p.eL); f = p.qL * px * FEE * 2;
            realized += pnl; fees += f; dy.realized += pnl; dy.fees += f; dy.rebal++; dy.coins[p.s] = (dy.coins[p.s] || 0) + 1;
            push('平多止盈', 'L', pnl, f / 2, { notional: p.qL * px }); push('现价补回多仓', 'L', 0, f / 2, { notional: p.qL * px }); push('配置计奖资产', 'G', 0, 0, { amount: pnl - f });
            stable += pnl - f; p.eL = px;
          }
          if (px <= p.eS * (1 - cfg.th)) {
            pnl = p.qS * (p.eS - px); f = p.qS * px * FEE * 2;
            realized += pnl; fees += f; dy.realized += pnl; dy.fees += f; dy.rebal++; dy.coins[p.s] = (dy.coins[p.s] || 0) + 1;
            push('平空止盈', 'S', pnl, f / 2, { notional: p.qS * px }); push('现价补回空仓', 'S', 0, f / 2, { notional: p.qS * px }); push('配置计奖资产', 'G', 0, 0, { amount: pnl - f });
            stable += pnl - f; p.eS = px;
          }
        });
        var it = stable * apy / 365 / SUB; interest += it; stable += it; dy.interest += it;
        save += save * apy / 365 / SUB;
        var it2 = nrStable * apy / 365 / SUB; nrI += it2; nrStable += it2;
      }
      var last = d * SUB + n, uL = 0, uS = 0, nL = 0, nS = 0, nrU = 0;
      var pos = st.map(function (p, j) { var px = MK[j][last], a = p.qL * (px - p.eL), b = p.qS * (p.eS - px); uL += a; uS += b; nL += p.qL * px; nS += p.qS * px;
        nrU += p.q0 * (px - COINS[j][1]) + p.q0 * (1 + cfg.tilt[j]) * (COINS[j][1] - px);
        return { s: p.s, px: px, qL: p.qL, qS: p.qS, eL: p.eL, eS: p.eS, nL: p.qL * px, nS: p.qS * px, uL: a, uS: b }; });
      var fee0 = st.reduce(function (t, p) { return t + (p.q0 + p.q0) * COINS[st.indexOf(p)][1] * FEE; }, 0);
      Object.assign(dy, { uL: uL, uS: uS, nL: nL, nS: nS, stable: stable, apy: apy, cumR: realized, cumF: fees, cumI: interest, equity: D + realized - fees + interest + uL + uS, deposit: D,
        cmpSave: save - D, cmpNoRebal: nrU + nrI - fee0 });
      if (d === DAYS) dy.pos = pos;
      days.push(dy);
    }
    return { days: days, trades: trades };
  }

  function sim(a, B) {
    if (sims[a.id]) return sims[a.id];
    var p = SIMP[(a.index || 0) % SIMP.length];
    var cfg = Object.assign({ id: a.id }, p, { seed: p.seed + (hashId(a.id) % 997) });
    return sims[a.id] = simAccount(cfg, B);
  }

  var src = {
    /* everything the overview / trades / wallet pages draw; accounts = [{ id, index }] the page wants numbers for */
    getDashboard: function (o) {
      var B = base(o.mk);
      var out = { now: B.now, tz: TZ, days: DAYS, sub: SUB, todaySubs: B.todaySubs, coins: COINS.map(function (c) { return c.slice(); }),
        kh: B.KH, nh: B.NH, stb: STB.map(function (c) { return Object.assign({}, c); }), rates: B.rates, umr: B.umr, umrSeries: B.umrPts,
        wallet: { tok: B.wallet.tok, used: B.wallet.used, lastLeft: B.wallet.lastLeft, discRate: B.wallet.discRate }, accounts: {},
        compare: { note: '演示，口径待业务确认', save: '直接存理财', noRebal: '不做平补' } };
      (o.accounts || []).forEach(function (a) { out.accounts[a.id] = sim(a, B); });
      return out;
    },
    /* real history / live data need the backend: in demo mode they are simply not connected */
    getHistory: function () { return { available: false, reason: '未接入' }; },
    getLive: function () { return { available: false, reason: '未接入' }; },
    getAlerts: function (o) {
      var t = Date.now();
      return { rows: [
        { id: 'al-1', level: 'warn', at: t - 42 * 6e4, title: '保证金率接近下限（演示）', body: '统一账户维持保证金率 3.1，低于方案设定的 3.5 提醒线。', ask: '保证金率接近下限，应该怎么处理？' },
        { id: 'al-2', level: 'info', at: t - 5.2 * 36e5, title: '计奖资产利率下调（演示）', body: 'BFUSD 参考年化比昨天低 0.3 个百分点。', ask: 'BFUSD 利率下调对我有什么影响？' }
      ].filter(function () { return !o || !o.none; }) };
    },
    /* user-initiated only: adds the clearly labelled demo account (metadata only, no key) */
    addDemoAccount: function () {
      var A = global.TDAccount; if (!A || !A.getSession()) return { ok: false };
      A.upsertAccount({ id: DEMO_ID, name: DEMO_NAME, uid: 'DEMO', label: 'DEMO', status: 'running', checkedAt: Date.now() });
      A.setActive(DEMO_ID);
      return { ok: true, id: DEMO_ID };
    }
  };
  TDApi.demoControls.registerDashboard(src);
})(window);
