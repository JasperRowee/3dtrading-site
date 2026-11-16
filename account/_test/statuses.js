// r38: the 8 account statuses (+ an unknown one and the legacy 'pending') through TDApi.statusInfo, in zh and en,
// on the bind page rows and in the shared avatar menu.
const { ok, sleep, load, seed, CJK, done } = require('./lib');
const EIGHT = ['awaiting_key', 'checking', 'verified', 'failed', 'observing', 'running', 'halted', 'unbound'];
const ZH = { awaiting_key: '等待贴回 API Key', checking: '接入测试中', verified: '测试通过', failed: '测试未通过', observing: '试运行（只观察）', running: '运行中', halted: '已停机', unbound: '已解绑' };
(async () => {
  const list = EIGHT.map((st, i) => ({ id: 's' + i, name: 'S-' + st, uid: String(10000000 + i), status: st, reason: st === 'failed' ? 'PM_OFF' : '', at: i + 1 }))
    .concat([{ id: 'sx', name: 'S-unknown', uid: '20000000', status: 'warp_speed', at: 20 }, { id: 'sp', name: 'S-legacy', uid: '20000001', status: 'pending', at: 21 }]);
  for (const lang of ['zh', 'en']) {
    const p = await load('/account/bind.html', { store: seed('st@x.com', list, { '3dt.lang': lang }), settle: 700 });
    const API = p.w.TDApi;
    ok(JSON.stringify(API.statuses()) === JSON.stringify(EIGHT), `[${lang}] TDApi.statuses() = the 8 contract statuses`);
    ok(JSON.stringify(p.w.TDAccount.statuses()) === JSON.stringify(EIGHT), `[${lang}] TDAccount.statuses() matches`);
    for (const st of EIGHT) {
      const i = API.statusInfo(st);
      ok(i.known && i.label && (lang === 'zh' ? i.label === ZH[st] : !CJK.test(i.label)), `[${lang}] ${st} → "${i.label}" (${i.tone})`);
    }
    const u = API.statusInfo('warp_speed');
    ok(!u.known && u.label === (lang === 'zh' ? '处理中' : 'Processing'), `[${lang}] unknown status → ${u.label}`);
    const lg = API.statusInfo('pending');
    ok(lg.status === 'awaiting_key' && lg.known, `[${lang}] legacy pending → awaiting_key`);
    // rows (a stored 'checking' account settles on load; read what each row says now)
    ok(p.$$('#brows .brow').length === list.length, `[${lang}] ${p.$$('#brows .brow').length} rows rendered`);
    for (const a of p.w.TDAccount.accounts().list) {
      const r = p.$(`.brow[data-id="${a.id}"] small[data-st]`), want = API.statusInfo(a.status);
      ok(r && r.textContent.includes(want.label) && p.$(`.brow[data-id="${a.id}"] .dot.${want.tone}`), `[${lang}] row ${a.name}: "${r && r.textContent}" dot ${want.tone}`);
    }
    ok(p.$('.brow[data-id="sx"] small').textContent.includes(lang === 'zh' ? '处理中' : 'Processing'), `[${lang}] unknown row shows 处理中/Processing`);
    ok(p.$('.brow[data-id="sp"] small').textContent.includes(API.statusInfo('awaiting_key').label), `[${lang}] legacy pending row shows awaiting_key wording`);
    // open rows: body by status
    const body = async id => { const h = p.$(`.brow[data-id="${id}"]`); if (!h.classList.contains('open')) { p.click(h.querySelector('[data-acc]')); await sleep(350); } return (p.$(`.brow[data-id="${id}"] .bbody`) || { textContent: '' }).textContent; };
    await body('s0'); ok(!!p.$('.brow[data-id="s0"] [data-pem]') && !!p.$('.brow[data-id="s0"] input[data-key]'), `[${lang}] awaiting_key → public key + API Key field`);
    let t = await body('s3'); ok(t.includes(API.getFailureText('PM_OFF').title) && !!p.$('.brow[data-id="s3"] [data-retest]'), `[${lang}] failed → reasons + retest`);
    await body('s4'); ok(!!p.$('.brow[data-id="s4"] .bbody a[href*="dashboard"]'), `[${lang}] observing → dashboard link`);
    t = await body('s6'); ok(t.length > 4 && !p.$('.brow[data-id="s6"] input'), `[${lang}] halted → text only`);
    t = await body('sx'); ok(t.length > 4 && !p.$('.brow[data-id="sx"] input'), `[${lang}] unknown → text only`);
    // shared avatar menu uses the same wording
    p.click('#av'); await sleep(50);
    const m = p.$('.tda-menu:not([hidden])');
    ok(m && m.textContent.includes(lang === 'zh' ? '处理中' : 'Processing'), `[${lang}] menu: unknown status → 处理中/Processing`);
    if (lang === 'en') ok(m && !CJK.test(m.textContent.replace('中文', '')), '[en] menu has no Chinese (except the 中文 language option)');
    ok(p.errs.length === 0, `[${lang}] no JS errors ` + p.errs.join(' | '));
  }
  done();
})().catch(e => { console.error(e); process.exit(2); });
