/* Live view never reads demo balances, account status or generated history. */
window.LiveAccount = (() => {
  let data = null, error = false, busy = false;
  const expanded = new Set();
  const $ = s => document.querySelector(s);
  const en = () => window.I18N?.lang === 'en';
  const t = (zh,eng) => en() ? eng : zh;
  const esc = v => String(v ?? '—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = (v,d=2) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v).toLocaleString(en()?'en-US':'zh-CN',{maximumFractionDigits:d,minimumFractionDigits:d}) : '—';
  const note = (zh,eng) => `<p class="live-note ov-note">${t(zh,eng)}</p>`;
  const table = (headers,rows) => `<div class="live-scroll"><table><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}">${t('暂无记录','No records')}</td></tr>`}</tbody></table></div>`;
  function draw() {
    document.querySelectorAll("[data-expand]").forEach(el=>{if(el.open)expanded.add(el.dataset.expand);else expanded.delete(el.dataset.expand);});
    const a = data?.account;
    for (const [id,zh,eng] of [['h-dashboard','总览','Overview'],['h-trades','交易记录','Trades'],['h-wallet','费用与结算','Billing & Settlement'],['h-me','我的','Me']]) { const el=$('#'+id); if(el) el.textContent=t(zh,eng); }
    const stamp = data ? new Date(data.fetchedAt).toLocaleString(en()?'en-SG':'zh-CN',{timeZone:'Asia/Singapore',hour12:false}) : '—';
    $('#acctName').textContent=t('币安真实账户','Binance live account');
    $('#acctSub').textContent=t('只读连接 · 联合保证金','Read-only · Portfolio Margin');
    $('#acctBtn').disabled=true;
    $('.live-controls').innerHTML=`<span>${error?t('连接失败，当前数据不可用','Connection failed · data unavailable'):busy?t('正在读取币安…','Reading Binance…'):t('真实账户 · 只读','Live account · read-only')} · ${t('采集时间','Fetched')} ${stamp} (SGT)</span><button class="btn sm" data-live-refresh ${busy?'disabled':''}>${t('刷新','Refresh')}</button><button class="btn sm" data-live-lang>${en()?'中文':'EN'}</button>`;
    document.querySelectorAll('.vsub').forEach(el=>el.textContent=t('币安联合保证金账户 · 30 秒自动更新','Binance Portfolio Margin · refreshes every 30 seconds'));
    const card=(label,value,sub='')=>`<div class="live-metric"><span>${label}</span><strong>${value}</strong><small>${sub}</small></div>`;
    const ratio=a && Number.isFinite(Number(a.uniMMR)) ? num(Number(a.uniMMR)*100)+'%' : '—';
    const metricRow=(key,label,value,detail)=>`<details class="live-ledger" data-expand="${key}" ${expanded.has(key)?'open':''}><summary><span>${label}</span><b class="num">${value}</b><span class="live-plus">＋</span></summary><p>${detail}</p></details>`;
    const metrics=`<div class="ov"><section class="ov-top" id="kpis"><div class="hero" tabindex="0"><span class="geo" aria-hidden="true"></span><span class="geo2" aria-hidden="true"></span><div class="l"><div class="k">${t('账户实际权益','Actual account equity')}<span class="run">${t('只读连接','Read-only')}</span></div><div class="v num">${num(a?.actualEquity)}<small>USD</small></div><div class="d">${t('币安联合保证金账户','Binance Portfolio Margin')}</div><div class="chips"><span>${t('累计净收益','Net return')} <b>—</b></span><span>${t('收益率','Return rate')} <b>—</b></span></div><div class="d gnn">${t('收益历史与净入金尚未接入','Performance history and net deposits not connected')}</div></div><div class="brief"><h3>${t('账户状况','Account status')}</h3><div class="r">${t('联合保证金率','Unified margin ratio')}<b class="num">${ratio}</b></div><div class="r">${t('状态','Status')}<b>${esc(a?.accountStatus)}</b></div><div class="r">${t('维持保证金','Maintenance margin')}<b class="num">${num(a?.accountMaintMargin)} <small>USD</small></b></div><div class="rm"><p>uniMMR · ${t('折算后保证金权益 ÷ 维持保证金','Adjusted equity / maintenance margin')}</p></div></div></div><h2 class="ov-sh">${t('保证金明细','Margin details')}<small>${t('点一行展开','Expand a row')}</small></h2><div class="ldg">${metricRow('equity',t('保证金权益（折算后）','Adjusted margin equity'),num(a?.accountEquity)+' USD',t('币安返回的折算后权益，用于联合保证金率计算。','Adjusted equity reported by Binance, used for uniMMR.'))}${metricRow('initial',t('初始保证金','Initial margin'),num(a?.accountInitialMargin)+' USD',t('币安账户当前初始保证金。','Current initial margin reported by Binance.'))}${metricRow('maintenance',t('维持保证金','Maintenance margin'),num(a?.accountMaintMargin)+' USD',t('当前账户维持保证金要求。','Current account maintenance margin requirement.'))}</div></section>`;

    const unavailable = (key) => note('该项读取失败，未使用示例数据替代。','This data is unavailable. No demo fallback.');
    const balances = data?.balances?.filter(b=>['totalWalletBalance','crossMarginAsset','crossMarginBorrowed','umUnrealizedPNL','cmUnrealizedPNL'].some(k=>Number(b[k])!==0 && Number.isFinite(Number(b[k])))) || [];
    const positionRows = ['um','cm'].flatMap(m => (data?.[m] || []).filter(p=>Number(p.positionAmt)!==0).map(p=>[esc(p.symbol),m.toUpperCase(),`<span class="${p.positionSide==='LONG'||(p.positionSide==='BOTH'&&Number(p.positionAmt)>0)?'L':'S'}">${esc(p.positionSide==='LONG'?t('多仓','Long'):p.positionSide==='SHORT'?t('空仓','Short'):Number(p.positionAmt)>0?t('多仓','Long'):t('空仓','Short'))}</span>`,esc(m==='cm'?p.symbol.replace(/USD.*/, ''):p.symbol.match(/(USDT|USDC|USD1)$/)?.[1] || '—'),num(p.positionAmt,6),num(p.entryPrice,6),num(p.markPrice,6),num(p.unRealizedProfit,4)]));
    const groups=new Map();
    for(const market of ['um','cm']) for(const p of data?.[market]||[]){
      if(!Number(p.positionAmt))continue;
      const key=market+':'+p.symbol;
      if(!groups.has(key))groups.set(key,{symbol:p.symbol,market,long:0,short:0,pnl:0,asset:market==='cm'?p.symbol.replace(/USD.*/,''):p.symbol.match(/(USDT|USDC|USD1)$/)?.[1]||'—'});
      const g=groups.get(key),long=p.positionSide==='LONG'||(p.positionSide==='BOTH'&&Number(p.positionAmt)>0);
      g[long?'long':'short']+=Math.abs(Number(p.positionAmt));g.pnl+=Number(p.unRealizedProfit)||0;
    }
    const positionSummary=`<div class="bf live-bf"><div class="bf-h"><span class="r">${t('多仓数量','Long quantity')}</span><span class="ax">← ${t('多仓','Long')}</span><span class="c">${t('交易对','Symbol')}</span><span class="ax">${t('空仓','Short')} →</span><span class="r">${t('空仓数量','Short quantity')}</span><span class="r">${t('浮盈亏','Unrealized PNL')}</span></div>${[...groups.values()].map(g=>{const max=Math.max(g.long,g.short)||1;return `<div class="bf-r"><div class="bh"><span class="ul num L">${num(g.long,3)}</span><span class="bl"><i style="width:${g.long/max*100}%"></i></span><span class="cn">${esc(g.symbol)}<small>${g.market.toUpperCase()}</small></span><span class="bs2"><i style="width:${g.short/max*100}%"></i></span><span class="us num S">${num(g.short,3)}</span><span class="ut num ${g.pnl<0?'dn':'up'}">${num(g.pnl)} ${esc(g.asset)}</span></div></div>`}).join('')}</div>`;
    $('#main').innerHTML=metrics+note('联合保证金率 = 折算后保证金权益 ÷ 维持保证金；百分比按币安返回的 uniMMR × 100 展示。','uniMMR = adjusted margin equity / maintenance margin; displayed as the Binance ratio × 100%.')+`<div class="ov-mid"><section class="panel cvp" id="curveSec"><div class="hd2"><div><h2>${t('累计净收益','Cumulative net return')}</h2><p>${t('收益与账本','Performance & ledger')}</p></div></div><div class="live-empty"><strong>—</strong><span>${t('收益历史尚未接入','Performance history not connected')}</span><small>${t('接入净入金及历史权益后显示收益曲线','The curve requires net deposits and historical equity')}</small></div><div class="foot"><a class="lnk" href="#/trades">${t('查看资金流水 →','View income ledger →')}</a></div></section><section class="yld live-assets" id="yld"><div class="top"><span class="eyebrow">${t('资产余额','Asset balances')}</span><span class="sp"></span><span>${t('实际持有','Live holdings')}</span></div>`+(!data || data.errors.balances?unavailable('balances'):`<div class="live-asset-list">${balances.map(b=>`<div><b>${esc(b.asset)}</b><span class="num">${num(b.totalWalletBalance,6)}</span></div>`).join('')}</div><details data-expand="balances" ${expanded.has('balances')?'open':''}><summary>${t('余额与借款明细','Balance & borrowing details')}</summary>${table([t('资产','Asset'),t('借款','Borrowed'),t('U 本位盈亏','UM PNL'),t('币本位盈亏','CM PNL')],balances.map(b=>[esc(b.asset),num(b.crossMarginBorrowed,6),num(b.umUnrealizedPNL,4),num(b.cmUnrealizedPNL,4)]))}</details>`)+note('余额和盈亏按各自资产单位展示，不把不同币种直接相加。','Balances and PNL use each asset’s own units; different currencies are not added together.')+`</section></div><section class="posx" id="posMini"><div class="hd"><h2>${t('多空持仓','Long & short positions')}</h2><p>${positionRows.length} ${t('笔实际持仓','open positions')}</p></div>`+(['um','cm'].some(k=>data?.errors[k])?unavailable('positions'):'')+positionSummary+`<details data-expand="positions" ${expanded.has('positions')?'open':''}><summary>${t('全部持仓明细','All position details')}</summary>`+table([t('交易对','Symbol'),t('市场','Market'),t('方向','Side'),t('盈亏单位','PNL asset'),t('数量','Quantity'),t('开仓价','Entry price'),t('标记价','Mark price'),t('未实现盈亏','Unrealized PNL')],positionRows)+'</details>'+note('U 本位盈亏以结算资产计价；币本位数量为合约张数，盈亏以基础币计价。收益曲线、净入金和策略循环尚未接入，暂不计算收益率。','UM PNL uses the settlement asset; CM quantity is contracts and PNL uses the base asset. Performance history, net deposits and strategy cycles are not connected; returns are not calculated.')+'</section></div>';
    const income=data?.income || [];
    $('#trBody').innerHTML=`<h2>${t('近 24 小时资金流水 · U 本位','Last 24 hours · UM income ledger')}</h2>`+note('包含已实现盈亏、手续费和资金费等；这不是完整成交订单，也不代表策略收益。最多显示 1000 条。','Includes realized PNL, commissions and funding; this is not a full trade history or strategy return. Up to 1,000 records.')+(!data || data.errors.income?unavailable('income'):table([t('时间（新加坡）','Time (Singapore)'),t('交易对','Symbol'),t('类型','Type'),t('金额','Amount'),t('资产','Asset')],income.slice().sort((a,b)=>b.time-a.time).map(r=>[esc(new Date(r.time).toLocaleString(en()?'en-SG':'zh-CN',{timeZone:'Asia/Singapore',hour12:false})),esc(r.symbol),esc(r.incomeType),num(r.income,6),esc(r.asset)])));
    $('#walBody').innerHTML='<section class="set">'+note('平台订阅和账单尚未接入。币安余额不作为平台钱包余额显示。','Platform subscriptions and billing are not connected. Binance balances are not platform wallet balances.')+'</section>';
    $('#meBody').innerHTML='<section class="set">'+note('已连接本机配置的真实只读账户。密钥不发送到浏览器；此预览不能下单、划转或提现。','Connected to the locally configured live read-only account. Credentials never reach the browser. This preview cannot trade, transfer or withdraw.')+'</section>';
    $('#pg-ai').innerHTML=`<h1>Dodo</h1>`+note('真实账户已接通，AI 问答尚未接入。请到总览查看实际数据。','The live account is connected. AI chat is not connected; see Overview for real account data.');
  }
  async function refresh() {
    if(busy) return;
    busy=true; draw();
    try {
      const response=await fetch('/api/live-account',{headers:{'X-3dtrading-Local':'1'},cache:'no-store',signal:AbortSignal.timeout(25000)});
      if(!response.ok) throw Error('unavailable');
      data=await response.json();error=false;
    } catch { data=null; error=true; }
    finally {busy=false;draw();}
  }
  function route() {
    const p=location.hash.slice(2)||'dashboard';
    const page=['dashboard','trades','wallet','me','ai'].includes(p)?p:'dashboard';
    document.body.dataset.page=page;
    document.querySelectorAll('#dash > [data-page]').forEach(el=>el.hidden=el.dataset.page!==page);
    document.title=t(({dashboard:'总览',trades:'交易记录',wallet:'费用与结算',me:'我的',ai:'Dodo'})[page],({dashboard:'Overview',trades:'Trades',wallet:'Billing',me:'Me',ai:'Dodo'})[page])+' · 3dtrading';
    document.querySelectorAll('[data-nav]').forEach(el=>{if(el.dataset.nav===page)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  }
  function start() {
    const style=document.createElement('style');style.textContent=`
.live-bf{width:100%;overflow:auto}.live-bf .bh{min-width:640px;cursor:default}.live-bf .cn small{display:block;font-size:10px;color:var(--ink3)}.live-bf .bf-h{min-width:640px}.live-asset-list{margin:18px 0}.live-asset-list>div{display:flex;justify-content:space-between;gap:12px;padding:13px 0;border-bottom:1px solid rgba(47,107,96,.14)}.live-asset-list b{font-size:14px}.live-assets details summary,#posMini>details>summary{cursor:pointer;font-size:13px;color:var(--ink2);padding:12px 0}.live-controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:4px 0 24px;color:var(--ink3);font-size:12px}.live-controls span{flex:1}.live-controls .btn{background:var(--soft);color:var(--ink2)}
.live-scroll{overflow:auto;max-width:100%;margin:16px 0}.live-scroll table{width:100%;border-collapse:collapse;white-space:nowrap;font-size:13px}.live-scroll th,.live-scroll td{text-align:right;padding:13px 16px;border-bottom:1px solid var(--line)}.live-scroll th{color:var(--ink3);font-size:12px;font-weight:500}.live-scroll th:first-child,.live-scroll td:first-child{text-align:left}.live-scroll tbody tr:hover{background:rgba(47,220,188,.05)}
.live-note{font-size:12px;color:var(--ink3);line-height:1.7;margin:12px 0 20px}.live-ledger{border-bottom:1px solid var(--line2)}.live-ledger summary{display:flex;align-items:center;gap:16px;list-style:none;cursor:pointer;padding:20px 16px}.live-ledger summary::-webkit-details-marker{display:none}.live-ledger summary>span:first-child{flex:1;color:var(--ink2)}.live-ledger b{font-size:21px;font-weight:600}.live-ledger p{margin:0;padding:0 16px 20px;color:var(--ink3);font-size:13px}.live-plus{color:var(--ink3)}.live-ledger[open] .live-plus{transform:rotate(45deg)}
.live-empty{min-height:210px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--ink3);text-align:center}.live-empty strong{font-size:40px;color:var(--ink2)}.live-empty small{font-size:12px}.live-assets{min-width:0}.live-assets .live-note{color:#3f6b62}.live-assets .live-scroll th,.live-assets .live-scroll td{border-color:rgba(47,107,96,.15)}
#tnavInk{display:none}.tnav a[aria-current="page"]{background:var(--blk);color:#fff}.live-assets .eyebrow{color:#2f6b60}#main .hero .brief{display:flex}#main .hero .k{flex-wrap:wrap}#main .hero .v{overflow-wrap:anywhere}
@media(max-width:700px){.live-ledger summary{padding:16px 4px;gap:8px}.live-ledger b{font-size:17px}.live-controls{margin-bottom:16px}.live-controls span{flex-basis:100%}#main .hero .v{font-size:36px}.live-empty{min-height:180px}.live-assets{overflow:hidden}}
`;document.head.append(style);
    const controls=document.createElement('div');controls.className='live-controls';controls.dataset.i18nSkip='';$('#dash').prepend(controls);
    document.querySelectorAll('[data-page]').forEach(el=>el.dataset.i18nSkip='');
    $('#avIni').textContent='J';$('#avBtn').onclick=()=>{location.hash='#/me';};
    document.addEventListener('toggle',e=>{const key=e.target.dataset?.expand;if(key && e.target.isConnected){if(e.target.open)expanded.add(key);else expanded.delete(key);}},true);
    document.addEventListener('click',e=>{if(e.target.closest('[data-live-refresh]'))refresh();if(e.target.closest('[data-live-lang]'))I18N.set(en()?'zh':'en');});
    window.addEventListener('langchange',draw);window.addEventListener('hashchange',route);
    route();refresh();setInterval(()=>{if(!document.hidden)refresh();},30000);
  }
  return {start};
})();

/* ===== Live data layer for the original dashboard (TD_LIVE) =====
   load(done): reads the loopback server (read-only Binance), builds window.TD_LIVE, then calls done().
   build(): pure — real Binance responses in, the original app's day/trade/position model out.
   Rules: nothing unknown becomes 0 (unknown = null + a flag); every estimate carries its basis. */
Object.assign(window.LiveAccount, (() => {
  const DAYS = 91, DAY = 864e5, SG = 8 * 36e5, HDR = { 'X-3dtrading-Local': '1' };
  const QUOTE = /(USDT|USDC|USD1|FDUSD|BUSD)$/, FACE = new Set(['USDT', 'USDC', 'USD1', 'FDUSD', 'BUSD', 'BFUSD', 'RWUSD']);
  const f = v => { const n = Number(v); return v !== null && v !== '' && Number.isFinite(n) ? n : null; };
  const sgDay = ms => Math.floor((ms + SG) / DAY);
  const base = s => s.replace(QUOTE, '');
  /* CM symbols look like BTCUSD_PERP / BTCUSD_251226; UM like ETHUSDC */
  const coinOf = s => /USD_/.test(s) ? s.split('USD_')[0] : base(s);
  /* unknown numbers become undefined (not null) in totals so that arithmetic gives NaN, never a silent 0 */
  const U = v => v == null ? undefined : v;
  const get = async u => { const r = await fetch(u, { headers: HDR, cache: 'no-store' }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'HTTP_' + r.status); return r.json(); };
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
  async function load(done) {
    const nowMs = Date.now();
    try {
      const [A, H] = await Promise.all([get('/api/live-account'), get('/api/live-history')]);
      const syms = {}; (A.um || []).forEach(p => { if (!f(p.positionAmt)) return; const c = coinOf(p.symbol); const n = Math.abs(f(p.notional) || 0); if (!syms[c] || n > syms[c][1]) syms[c] = [p.symbol, n]; });
      (A.cm || []).forEach(p => { const c = coinOf(p.symbol); if (f(p.positionAmt) && !syms[c]) syms[c] = [c + 'USDT', 0]; });
      [...Object.keys(H.trades || {}), ...Object.keys(H.cmTrades || {}).map(s => coinOf(s) + 'USDT')].forEach(s => { const c = coinOf(s); if (!syms[c]) syms[c] = [s, 0]; });
      const day0 = (sgDay(nowMs) - DAYS) * DAY - SG, k = (m, s, iv, st) => get(`/api/klines?market=${m}&symbol=${s}&interval=${iv}&startTime=${st}`).catch(() => null);
      const ent = Object.entries(syms), res = await Promise.all([...ent.map(([, [s]]) => k('um', s, '1h', day0)), k('um', 'BNBUSDT', '1d', day0 - 5 * DAY), k('spot', 'WLFIUSDT', '1d', day0 - 5 * DAY)]);
      const K = { coins: Object.fromEntries(ent.map(([c], i) => [c, res[i]])), BNB: res[ent.length], WLFI: res[ent.length + 1] };
      window.TD_LIVE = build(A, H, K, nowMs);
      if (!K.BNB) window.TD_LIVE.errors['klines:BNBUSDT'] = 'UNAVAILABLE'; if (!K.WLFI) window.TD_LIVE.errors['klines:WLFIUSDT'] = 'UNAVAILABLE';
    } catch (e) { window.TD_LIVE = { ok: false, error: String(e && e.message || e), at: nowMs }; }
    done();
  }
  return { load, build };
})());
