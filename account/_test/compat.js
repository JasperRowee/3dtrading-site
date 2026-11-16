// Stale-cache check: bind.html / onboard.html with the previous td-account.js (r31, before r38) still work.
// Usage: git show HEAD:account/td-account.js > /tmp/r38-tests/old-td-account.js
//        NODE_PATH=/tmp/r38-tests/node_modules node compat.js /tmp/r38-tests/old-td-account.js
const fs = require('fs');
const { ResourceLoader, ok, sleep, load, seed, K64, CJK, done } = require('./lib');
const OLD = fs.readFileSync(process.argv[2] || '/tmp/r38-tests/old-td-account.js', 'utf8');
let seen = [];
class Old extends ResourceLoader {
  fetch(url, o) { seen.push(url); if (/\/account\/td-account\.js/.test(url)) return Promise.resolve(Buffer.from(OLD)); return super.fetch(url, o); }
}
(async () => {
  ok(!/statusInfo|r38/.test(OLD), 'the old module really is pre-r38');
  const list = [{ id: 'demo-binance', name: '示例账户', uid: 'DEMO', label: 'DEMO', status: 'verified', at: 1 },
    { id: 'n1', name: 'Main', uid: '12345678', status: 'failed', reason: 'IP_RESTRICT_OFF', at: 2 },
    { id: 'n2', name: 'Old', uid: '22345678', status: 'pending', at: 3 }];
  for (const [lang, width] of [['zh', 1280], ['en', 1280], ['zh', 390], ['en', 390]]) {
    const tag = `[old module ${lang} ${width}]`; seen = [];
    const p = await load('/account/bind.html', { store: seed('compat@x.com', list, { '3dt.lang': lang }), width, settle: 700, resources: new Old() });
    ok(seen.some(u => /td-account\.js\?v=r45b/.test(u)), tag + ' page asks for td-account.js?v=r45b');
    ok(typeof p.w.TDAccount.statuses !== 'function', tag + ' module in the page is the old one');
    ok(p.errs.length === 0, tag + ' no script errors ' + p.errs.join(' | '));
    ok(p.$$('#brows .brow').length === 3, tag + ' 3 rows rendered');
    ok(p.$('.brow[data-id="n2"] small').textContent.includes(p.w.TDApi.statusInfo('awaiting_key').label), tag + ' legacy pending row → awaiting_key wording');
    if (lang === 'en') ok(!CJK.test(p.$('#panel').textContent), tag + ' panel has no Chinese');
    if (lang === 'zh' && width === 1280) {
      p.click(p.$('.brow[data-id="n2"] [data-acc]')); await sleep(300);
      const r = () => p.$('.brow[data-id="n2"]');
      ok(!!r().querySelector('[data-pem]') && !!r().querySelector('input[data-key]'), tag + ' open row: public key + API Key field');
      r().querySelector('input[data-key]').value = K64(1); p.submit(r().querySelector('[data-keyform]'));
      await sleep(2300);
      ok(['observing', 'failed'].includes(p.w.TDAccount.accounts().list.find(a => a.id === 'n2').status) && p.errs.length === 0, tag + ' key test completes on the old module');
    }
  }
  const o = await load('/account/onboard.html', { store: seed('compat2@x.com', [], { '3dt.onboarding:compat2@x.com': '' }), settle: 600, resources: new Old() });
  ok(o.errs.length === 0 && !!o.$('main'), '[old module] onboard.html loads without errors ' + o.errs.join(' | '));
  done();
})().catch(e => { console.error(e); process.exit(2); });
