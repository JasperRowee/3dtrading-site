/* 3dtrading · 真实模式数据层（r38）
   页面不直接请求任何地址：真实数据只经 TDApi.getLive() 取得（演示模式下返回「未接入」）。
   build() 是纯函数：后端返回的只读账户数据 → 原后台的日/成交/持仓模型。 */
window.LiveAccount = window.LiveAccount || {};
/* ===== Live data layer for the original dashboard (TD_LIVE) =====
   load(done): asks TDApi.getLive() for read-only account data, builds window.TD_LIVE, then calls done().
   build(): pure — real Binance responses in, the original app's day/trade/position model out.
   Rules: nothing unknown becomes 0 (unknown = null + a flag); every estimate carries its basis. */
Object.assign(window.LiveAccount, (() => {
  const DAYS = 91, DAY = 864e5, SG = 8 * 36e5;
  const QUOTE = /(USDT|USDC|USD1|FDUSD|BUSD)$/, FACE = new Set(['USDT', 'USDC', 'USD1', 'FDUSD', 'BUSD', 'BFUSD', 'RWUSD']);
  const f = v => { const n = Number(v); return v !== null && v !== '' && Number.isFinite(n) ? n : null; };
  const sgDay = ms => Math.floor((ms + SG) / DAY);
  const base = s => s.replace(QUOTE, '');
  /* CM symbols look like BTCUSD_PERP / BTCUSD_251226; UM like ETHUSDC */
  const coinOf = s => /USD_/.test(s) ? s.split('USD_')[0] : base(s);
  /* unknown numbers become undefined (not null) in totals so that arithmetic gives NaN, never a silent 0 */
  const U = v => v == null ? undefined : v;
  function dailyClose(rows) { const m = new Map(); (rows || []).forEach(r => m.set(sgDay(r[0]), f(r[4]))); return m; }
  function priceOn(m, day) { if (!m || !m.size) return null; for (let d = day; d > day - 10; d--) if (m.has(d)) return m.get(d); return null; }
  function build(A, H, K, nowMs) {
    const today = sgDay(nowMs), idx = ms => DAYS - (today - sgDay(ms)), day0 = (today - DAYS) * DAY - SG;
    const acc = A.account || {}, bal = Object.fromEntries((A.balances || []).map(b => [b.asset, b]));
    const PX = { BNB: dailyClose(K.BNB), WLFI: dailyClose(K.WLFI) }, unpriced = {};
    const usd = (asset, amt, ms) => { const a = f(amt); if (a == null) return null; if (FACE.has(asset)) return a; const p = priceOn(PX[asset], sgDay(ms)); if (p == null) { unpriced[asset] = (unpriced[asset] || 0) + 1; return null; } return a * p; };
    const days = []; for (let i = 0; i <= DAYS; i++) days.push({ i, realized: 0, pnl: 0, funding: 0, fees: 0, interest: 0, air: 0, airQty: 0, other: 0, rebal: null, coins: {}, uL: null, uS: null, nL: null, nS: null, stable: null, apy: null, flow: 0 });
    const other = {}; let before = 0;
    [...(H.umIncome || []), ...(H.cmIncome || [])].forEach(r => {
      const i = idx(r.time); if (i < 0) { before++; return; } const d = days[i], v = usd(r.asset, r.income, r.time); if (v == null) return;
      if (r.incomeType === 'REALIZED_PNL') d.pnl += v; else if (r.incomeType === 'FUNDING_FEE') d.funding += v; else if (r.incomeType === 'COMMISSION') d.fees -= v;
      else { other[r.incomeType] = (other[r.incomeType] || 0) + v; if (r.incomeType !== 'TRANSFER' && r.incomeType !== 'INTERNAL_TRANSFER') d.other += v; }
    });
    const airRows = [];
    (H.dividends || []).forEach(r => { const i = idx(r.divTime); if (i < 0) return; const d = days[i];
      if (r.asset === 'BFUSD' || r.asset === 'RWUSD') d.interest += f(r.amount) || 0;
      else { const v = usd(r.asset, r.amount, r.divTime); d.airQty += f(r.amount) || 0; if (v != null) d.air += v; airRows.push({ t: r.divTime, asset: r.asset, qty: f(r.amount), usd: v, info: r.enInfo }); } });
    let dep0 = 0; const flows = [];
    [[H.transfersIn, 1], [H.transfersOut, -1]].forEach(([rows, s]) => (rows || []).forEach(r => { if (r.status && r.status !== 'CONFIRMED') return; const v = usd(r.asset, r.amount, r.timestamp); if (v == null) return; const i = idx(r.timestamp); flows.push({ t: r.timestamp, asset: r.asset, amt: s * f(r.amount) }); if (i < 0) dep0 += s * v; else days[i].flow += s * v; }));
    /* fills → one row per order */
    const trades = [], tf = H.tradeFrom || nowMs - 7 * DAY, tfI = idx(tf);
    /* CM fills: qty is contracts, baseQty is coin, pnl and fee are in the margin coin → valued at the fill price */
    const cmUsd = (x, v) => { const a = f(v), p = f(x.price); return a == null || p == null ? null : a * p; };
    [...Object.entries(H.trades || {}).map(e => [...e, 'UM']), ...Object.entries(H.cmTrades || {}).map(e => [...e, 'CM'])].forEach(([sym, fills, mkt]) => {
      const m = new Map(); fills.forEach(x => { const o = m.get(x.orderId) || { sym, mkt, oid: x.orderId, side: x.side, ps: x.positionSide, q: 0, quote: 0, pnl: 0, fee: 0, feeNa: 0, n: 0, maker: x.maker, t: 0 };
        if (mkt === 'CM') { o.q += f(x.baseQty) || 0; o.quote += (f(x.baseQty) || 0) * (f(x.price) || 0); o.pnl += cmUsd(x, x.realizedPnl) || 0; const fe = cmUsd(x, x.commission); fe == null ? o.feeNa++ : o.fee += fe; }
        else { o.q += f(x.qty) || 0; o.quote += f(x.quoteQty) || 0; o.pnl += f(x.realizedPnl) || 0; const fe = usd(x.commissionAsset, x.commission, x.time); fe == null ? o.feeNa++ : o.fee += fe; }
        o.n++; o.t = Math.max(o.t, +x.time); m.set(x.orderId, o); });
      m.forEach(o => { const d = idx(o.t); if (d < 0) return; const ms = (o.t + SG) % DAY, mn = Math.floor(ms / 6e4);
        const L = o.ps === 'LONG' || (o.ps === 'BOTH' && o.side === 'BUY'), close = (o.ps === 'LONG' && o.side === 'SELL') || (o.ps === 'SHORT' && o.side === 'BUY');
        let act = o.ps === 'BOTH' ? (o.side === 'BUY' ? '买入' : '卖出') : (close ? '平' : '开') + (L ? '多' : '空'); if (close && o.pnl > 0) act += '止盈';
        trades.push({ d, time: `${String(Math.floor(mn / 60)).padStart(2, '0')}:${String(mn % 60).padStart(2, '0')}`, ts: d * 1440 + ms / 6e4, acct: 'binance-live', coin: coinOf(sym), sym, mkt: o.mkt, act, side: L ? 'L' : 'S',
          px: o.q ? o.quote / o.q : null, qty: o.q, notional: o.quote, pnl: o.pnl, fee: o.fee, feeNa: o.feeNa, fills: o.n, maker: o.maker, oid: o.oid, live: true }); });
    });
    trades.sort((a, b) => b.ts - a.ts); const seen = new Set(); trades.forEach(t => { while (seen.has(t.ts)) t.ts += 1e-6; seen.add(t.ts); });
    for (let i = Math.max(0, tfI); i <= DAYS; i++) days[i].rebal = 0;
    trades.forEach(t => { const d = days[t.d]; if (d.rebal == null) return; d.rebal++; d.coins[t.coin] = (d.coins[t.coin] || 0) + 1; });
    /* positions, merged per base coin; legs keep every symbol and side */
    const umA = new Map(((A.umAccount || {}).positions || []).map(p => [p.symbol + p.positionSide, p]));
    const P = new Map(), posErr = !!(A.errors && (A.errors.um || A.errors.cm)) || !A.um || !A.cm; let uL = 0, uS = 0, nL = 0, nS = 0;
    [...(A.um || []).map(p => [p, 'UM']), ...(A.cm || []).map(p => [p, 'CM'])].forEach(([p, mkt]) => { const q = f(p.positionAmt); if (!q) return;
      const c = mkt === 'CM' ? coinOf(p.symbol) : base(p.symbol), L = p.positionSide === 'LONG' || (p.positionSide === 'BOTH' && q > 0);
      const o = P.get(c) || { s: c, px: null, nL: 0, nS: 0, uL: 0, uS: 0, qL: 0, qS: 0, legs: [], top: 0 }; const n = Math.abs(f(p.notional) || 0), u = f(p.unRealizedProfit) || 0, ua = umA.get(p.symbol + p.positionSide) || {};
      if (L) { o.nL += n; o.uL += u; o.qL += Math.abs(q); uL += u; nL += n; } else { o.nS += n; o.uS += u; o.qS += Math.abs(q); uS += u; nS += n; }
      if (n > o.top) { o.top = n; o.px = f(p.markPrice); o.sym = p.symbol; }
      o.legs.push({ sym: p.symbol, mkt, side: L ? 'L' : 'S', qty: Math.abs(q), entry: f(p.entryPrice), be: f(p.breakEvenPrice), mark: f(p.markPrice), liq: f(p.liquidationPrice), lev: f(p.leverage), u, n, im: f(ua.initialMargin), mm: f(ua.maintMargin), upd: f(p.updateTime) });
      P.set(c, o); });
    if (posErr) uL = uS = nL = nS = undefined;
    const pos = [...P.values()].sort((a, b) => (b.nL + b.nS) - (a.nL + a.nS));
    const coins = [...pos.map(p => p.s), ...[...new Set(trades.map(t => t.coin))].filter(c => !P.has(c))];
    const ksym = Object.fromEntries(coins.map(c => [c, (P.get(c) || {}).sym || (trades.find(t => t.coin === c) || {}).sym]));
    coins.filter(c => !P.has(c)).forEach(c => pos.push({ s: c, px: null, nL: 0, nS: 0, uL: 0, uS: 0, qL: 0, qS: 0, legs: [], closed: true }));
    /* stable pool = USD1 / BFUSD / RWUSD balances in the unified account */
    const balErr = !A.balances || !!(A.errors && A.errors.balances);
    const wb = k => balErr ? undefined : bal[k] ? U(f(bal[k].totalWalletBalance)) : 0, stTot = wb('USD1') + wb('BFUSD') + wb('RWUSD');
    const rateMap = rows => { const m = new Map(); (rows || []).forEach(r => m.set(sgDay(+r.time), f(r.annualPercentageRate) * 100)); return m; };
    const RM = { BFUSD: rateMap(H.bfusdRates), RWUSD: rateMap(H.rwusdRates) };
    const rateAt = (k, i) => { const m = RM[k]; if (!m || !m.size) return null; const mn = Math.min(...m.keys()); for (let d = today - DAYS + i; d >= mn; d--) if (m.has(d)) return m.get(d); return null; };
    const stb = [{ s: 'USD1', c: '#3a6ed6', amt: wb('USD1'), na: true }, { s: 'BFUSD', c: '#c98500', amt: wb('BFUSD') }, { s: 'RWUSD', c: '#0c8f78', amt: wb('RWUSD') }]
      .map(c => Object.assign(c, { w: stTot > 0 ? c.amt / stTot : 0, ref: c.na ? null : rateAt(c.s, DAYS) }));
    const rates = days.map((_, i) => stb.map(c => c.na ? null : rateAt(c.s, i)));
    /* Two bases, never mixed:
       - realized (cash) basis for every day incl. today: d.net = realized PNL + funding − fees + interest + other income;
         d.cum is its running total. This is what the curve, today/7d/30d/month and the day ledger use.
       - equity basis only where a real equity exists at both ends (live today, or a kept snapshot):
         d.eqNet = equity − previous equity − that day's net transfer. Otherwise null (shown as "needs snapshot").
       d.recEq = net transfers + realized cumulative is only a scale for charts, never presented as an equity. */
    const snaps = new Map(); (H.snapshots || []).forEach(s => { const i = idx(s.t); if (i >= 0 && i < DAYS) snaps.set(i, s); });
    const liveEq = U(f(acc.actualEquity));
    let dep = dep0, cR = 0, cF = 0, cI = 0, cA = 0, cO = 0, cum = 0, first = null;
    days.forEach((d, i) => {
      dep += d.flow; d.realized = d.pnl + d.funding; cR += d.realized; cF += d.fees; cI += d.interest; cA += d.air; cO += d.other;
      d.net = d.realized - d.fees + d.interest + d.other; cum += d.net;
      Object.assign(d, { deposit: dep, cumR: cR, cumF: cF, cumI: cI, cumA: cA, cumO: cO, cum, recEq: dep + cum });
      if (first == null && (dep > 0 || d.realized || d.fees)) first = i;
      const s = snaps.get(i);
      if (i === DAYS) Object.assign(d, { equity: liveEq, eqReal: liveEq ?? null, uL, uS, nL, nS, stable: stTot, pos, src: 'live' });
      else if (s && s.actualEquity != null) Object.assign(d, { equity: s.actualEquity, eqReal: s.actualEquity, uL: s.uL, uS: s.uS, stable: s.stable, uniMMR: s.uniMMR, src: 'snap' });
      else Object.assign(d, { equity: d.recEq, eqReal: null, src: first == null || i < first ? 'pre' : 'rec' });
    });
    days.forEach((d, i) => { const p = days[i - 1];
      d.eqNet = p && d.eqReal != null && p.eqReal != null ? d.eqReal - p.eqReal - d.flow : null;
      d.dU = p && p.uL != null && d.uL != null && p.uS != null && d.uS != null ? (d.uL + d.uS) - (p.uL + p.uS) : null; });
    /* total since first record incl. unrealized: only today, where both terms are real */
    const T = days[DAYS]; T.eqCum = T.eqReal == null ? null : T.eqReal - T.deposit;
    /* hourly candles on the app's axis: h = hours since SG midnight of day 0, plus 1 */
    const sgNow = (nowMs + SG) % DAY, NH = DAYS * 24 + Math.floor(sgNow / 36e5) + 1, kerr = {};
    /* a missing hour stays a gap (all prices null): nothing is filled with a previous close or a placeholder */
    const kh = coins.map(c => { const rows = K.coins[c]; const out = new Array(NH); let gaps = 0;
      if (rows) rows.forEach(r => { const h = Math.floor((r[0] - day0) / 36e5) + 1, o = f(r[1]), hi = f(r[2]), lo = f(r[3]), cl = f(r[4]);
        if (h >= 1 && h <= NH && o != null && hi != null && lo != null && cl != null) out[h - 1] = { h, o, hi, lo, c: cl }; });
      for (let h = 1; h <= NH; h++) if (!out[h - 1]) { out[h - 1] = { h, o: null, c: null, hi: null, lo: null, gap: true }; gaps++; }
      if (gaps === NH) kerr[c] = 'UNAVAILABLE'; else if (gaps) kerr[c] = gaps; return out; });
    const n = k => f(acc[k]);
    return { ok: true, now: nowMs, fetchedAt: A.fetchedAt, histAt: H.fetchedAt, from: H.from, tradeFrom: tf, tradeFromI: tfI, first: first == null ? DAYS : first,
      acct: { uniMMR: n('uniMMR'), accountEquity: n('accountEquity'), actualEquity: n('actualEquity'), accountMaintMargin: n('accountMaintMargin'), accountInitialMargin: n('accountInitialMargin'),
        totalAvailableBalance: n('totalAvailableBalance'), virtualMaxWithdrawAmount: n('virtualMaxWithdrawAmount'), totalMarginOpenLoss: n('totalMarginOpenLoss'), accountStatus: acc.accountStatus, updateTime: n('updateTime') },
      uid: (A.spot || {}).uid, restrictions: A.restrictions || {}, balances: A.balances || [], bfusd: A.bfusd, rwusd: A.rwusd, income24h: A.income || [],
      posErr, balErr, coverage: H.coverage || {}, coins, ksym, days, trades, pos, stb, rates, kh, NH, kerr, airRows: airRows.sort((a, b) => b.t - a.t), flows: flows.sort((a, b) => b.t - a.t), dep0,
      /* uniMMR history: every raw local snapshot that holds a real ratio, oldest first. Sparse points stay sparse:
         no resampling, no interpolation, no synthetic rows. The current live value is NOT appended here (the UI adds it as "now"). */
      umrHist: (H.snapshots || []).map(s => ({ t: +s.t, v: f(s.uniMMR) })).filter(p => Number.isFinite(p.t) && p.t <= nowMs && p.v != null && p.v > 0).sort((a, b) => a.t - b.t),
      unpriced, other, beforeWindow: before, snapCount: snaps.size, errors: Object.assign({}, A.errors, H.errors) };
  }
  /* 真实数据只经适配层取：TDApi.getLive 返回 { account, history, klines }；演示模式下没有接入，直接给出「未接入」，不造数字 */
  async function load(done) {
    const nowMs = Date.now();
    try {
      if (!window.TDApi || typeof TDApi.getLive !== 'function') throw new Error('未接入');
      const r = await TDApi.getLive({ days: DAYS });
      if (!r || r.available === false || !r.account || !r.history) throw new Error(r && r.reason || '未接入');
      const K = r.klines || {};
      window.TD_LIVE = build(r.account, r.history, { coins: K.coins || {}, BNB: K.BNB || null, WLFI: K.WLFI || null }, nowMs);
      if (!K.BNB) window.TD_LIVE.errors['klines:BNBUSDT'] = 'UNAVAILABLE'; if (!K.WLFI) window.TD_LIVE.errors['klines:WLFIUSDT'] = 'UNAVAILABLE';
    } catch (e) { window.TD_LIVE = { ok: false, error: String(e && (e.message || e.code) || e), at: nowMs }; }
    done();
  }
  return { load, build };
})());
