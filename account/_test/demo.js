// r38: the dashboard's sample account (demo-binance) on the bind page — no API Key, no test, no demo outcome;
// unbinding it is a plain removal (no "delete the API in Binance" note). zh / en, 1280 / 390.
const { ok, sleep, load, seed, CJK, done } = require('./lib');
(async () => {
  const list = [{ id: 'demo-binance', name: '示例账户', uid: 'DEMO', label: 'DEMO', status: 'verified', at: 1 }, { id: 'n1', name: 'Main', uid: '12345678', status: 'failed', reason: 'IP_RESTRICT_OFF', at: 2 }];
  for (const [lang, width] of [['zh', 1280], ['en', 1280], ['zh', 390], ['en', 390]]) {
    const tag = `[${lang} ${width}]`;
    let p = await load('/account/bind.html?id=demo-binance', { store: seed('demo@x.com', list, { '3dt.lang': lang }), width, settle: 700 });
    const row = () => p.$('.brow[data-id="demo-binance"]');
    ok(row() && row().textContent.includes(lang === 'zh' ? '示例账户' : 'Sample account') && row().textContent.includes(lang === 'zh' ? '未连接币安' : 'not connected to Binance'), tag + ' demo row: name + not connected');
    ok(!!row().querySelector('.dot.demo'), tag + ' demo dot is neutral');
    ok(row().classList.contains('open') && !row().querySelector('input, [data-pem], [data-retest], [data-keyform]'), tag + ' ?id=demo-binance opens the notice: no key field, no public key, no retest');
    ok(p.w.TDAccount.accounts().list.find(a => a.id === 'demo-binance').status === 'verified', tag + ' ?id=demo-binance does not retest the sample account');
    ok(!/接入测试通过/.test(row().textContent) && !/connection test passed/i.test(row().textContent), tag + ' never says a connection test passed');
    if (lang === 'en') ok(!CJK.test(p.$('#panel').textContent), tag + ' panel has no Chinese');
    ok(p.errs.length === 0, tag + ' no JS errors ' + p.errs.join(' | '));
    if (lang === 'zh' && width === 1280) {
      // normal account next to it keeps its own steps
      p.click(p.$('.brow[data-id="n1"] [data-acc]')); await sleep(300);
      ok(!!p.$('.brow[data-id="n1"] [data-retest]'), 'normal failed account keeps retest');
      // unbind demo: two clicks, toast only
      p.click(row().querySelector('[data-rm]')); await sleep(20);
      ok(!!row(), 'first click only asks');
      p.click(row().querySelector('[data-rm]')); await sleep(500);
      ok(!p.w.TDAccount.accounts().list.some(a => a.id === 'demo-binance') && p.$('#toast').textContent.includes('示例账户'), 'sample account removed with a toast');
      ok(!p.$('#unNote').textContent.includes('删除这个 API'), 'no "delete the API in Binance" note for the sample account');
    }
  }
  done();
})().catch(e => { console.error(e); process.exit(2); });
