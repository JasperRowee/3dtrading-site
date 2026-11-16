// r38: the 9 failure codes — texts from TDApi.getFailureText in zh and en, rendered per code on the bind page with
// a fix and a 问 Dodo link; SIGNATURE_MISMATCH / IP_MISMATCH open the red security page (labelled demo, nothing sent).
const { ok, sleep, load, seed, K64, CJK, done } = require('./lib');
const NINE = ['PERM_MISSING', 'WITHDRAW_ON', 'IP_RESTRICT_OFF', 'IP_MISMATCH', 'NOT_SUBACCOUNT', 'PM_OFF', 'KEY_TYPE_WRONG', 'SIGNATURE_MISMATCH', 'UID_MISMATCH'];
const SEC = ['SIGNATURE_MISMATCH', 'IP_MISMATCH'];
(async () => {
  for (const lang of ['zh', 'en']) {
    const list = NINE.map((c, i) => ({ id: 'c' + i, name: 'C-' + c, uid: String(30000000 + i), status: 'awaiting_key', at: i + 1 }));
    const p = await load('/account/bind.html', { store: seed('codes@x.com', list, { '3dt.lang': lang }), settle: 700 });
    const API = p.w.TDApi;
    ok(JSON.stringify([...API.failureCodes()].sort()) === JSON.stringify([...NINE].sort()), `[${lang}] failureCodes() = the 9 codes`);
    for (const c of NINE) {
      const f = API.getFailureText(c);
      ok(f.title && f.how && f.code === c && (lang === 'en' ? !CJK.test(f.title + f.how) : CJK.test(f.title + f.how)), `[${lang}] ${c}: "${f.title}"`);
      ok(f.security === SEC.includes(c) && API.isSecurityCode(c) === SEC.includes(c), `[${lang}] ${c} security=${f.security}`);
    }
    const unk = API.getFailureText('SOMETHING_NEW');
    ok(unk.title && unk.title.includes('SOMETHING_NEW') && !unk.security, `[${lang}] unknown code → generic text: ${unk.title}`);
    ok(p.$$('#outSel option').length === 10 && !!p.$('#outSel option[value="pass"]'), `[${lang}] demo select: pass + 9 codes`);
    ok(p.$('#demoBox .tag').textContent === (lang === 'zh' ? '演示' : 'Demo'), `[${lang}] demo block labelled ${p.$('#demoBox .tag').textContent}`);
    // drive every code through the page via the demo block (setNextOutcome)
    for (let i = 0; i < NINE.length; i++) {
      const c = NINE[i], id = 'c' + i, row = () => p.$(`.brow[data-id="${id}"]`);
      if (!row().classList.contains('open')) { p.click(row().querySelector('[data-acc]')); await sleep(300); }
      p.$('#outSel').value = c; p.$('#outSel').dispatchEvent(new p.w.Event('change'));
      row().querySelector('input[data-key]').value = K64(i); p.submit(row().querySelector('[data-keyform]'));
      await sleep(2200);
      const f = API.getFailureText(c), li = row().querySelector(`.fails li[data-code="${c}"]`);
      ok(p.w.TDAccount.accounts().list.find(a => a.id === id).status === 'failed' && li && li.textContent.includes(f.title) && li.textContent.includes(f.how), `[${lang}] page shows ${c} title + fix`);
      const a = li && li.querySelector('a.dodo');
      ok(a && a.getAttribute('href').includes('topic=' + c) && a.textContent.includes(lang === 'zh' ? '问 Dodo' : 'Ask Dodo'), `[${lang}] ${c} 问 Dodo link`);
      const ov = p.$('#secOv');
      if (SEC.includes(c)) {
        const tx = ov.textContent;
        ok(!ov.hidden, `[${lang}] ${c} → security page opens`);
        ok(lang === 'zh' ? tx.includes('请立即到币安删除这个 API') && tx.includes('我们已通知你的邮箱 / Telegram') && tx.includes('演示模拟，未实际发送')
          : !CJK.test(tx) && /Delete this API/i.test(tx) && /Telegram/.test(tx) && /simulat|not actually sent/i.test(tx), `[${lang}] ${c} security page wording + demo label`);
        ok(p.$$('#secOv .sec-badge').length >= 1 && p.$('#secWhy').textContent.includes(f.title), `[${lang}] ${c} security page lists the reason`);
        ok(p.$('#secWho').textContent.includes(K64(i).slice(0, 4) + '…' + K64(i).slice(-4)) && !p.$('#secWho').textContent.includes(K64(i)), `[${lang}] ${c} security page shows only the 4…4 hint`);
        ok(p.d.body.classList.contains('locked'), `[${lang}] ${c} security page is full-page (body locked)`);
        p.d.dispatchEvent(new p.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sleep(30);
        ok(ov.hidden, `[${lang}] ${c} Esc closes the security page`);
      } else ok(ov.hidden, `[${lang}] ${c} → no security page`);
    }
    ok(!p.dump().match(/[A-Za-z0-9]{64}/), `[${lang}] no full API Key in local/session storage`);
    ok(p.errs.length === 0, `[${lang}] no JS errors ` + p.errs.join(' | '));
  }
  done();
})().catch(e => { console.error(e); process.exit(2); });
