// r41 end-to-end: register (agreement incl. risk) → connect (Key + Secret, no service) → legacy two-step binding (createAccount → public key → API Key)
// → pass / fail → retest (?id=) → unbind. Also: no password / full API Key in storage, en, 390 px.
const { ok, sleep, load, K64, CJK, done } = require('./lib');
(async () => {
  let store = {};
  // 1 guest guard
  let p = await load('/account/bind.html');
  ok(!p.w.TDAccount.session() && p.$('#panel').classList.contains('boot'), 'guest: bind does not render');

  // 2 register via TDApi (r41: lighter card — email + password x2 + one agreement tick that includes the risk disclosure)
  p = await load('/account/auth.html?mode=register');
  ok(!!p.w.TDApi, 'auth loads TDApi');
  ok(!p.$('#sizes') && !p.$('#risks'), 'register card asks no asset size / style');
  p.$('#email').value = 'J@Example.com'; p.$('#pw').value = 'abc12345'; p.$('#pw2').value = 'abc12345';
  p.submit('#f'); await sleep(400);
  ok(!p.w.TDAccount.session(), 'register without the agreement tick is refused');
  ok(/风险|risk/i.test(p.$('#fAgree').textContent), 'agreement line covers the risk disclosure: ' + p.$('#fAgree').textContent.trim().slice(0, 60));
  p.$('#pw').value = 'abc12345'; p.$('#pw2').value = 'abc12345'; p.$('#agree').checked = true;
  p.submit('#f'); await sleep(700);
  const s = p.w.TDAccount.session();
  ok(s && s.email === 'j@example.com', 'register → demo session');
  ok(p.$('#pw').value === '' && p.$('#pw2').value === '', 'passwords cleared on submit');
  ok(!p.dump().includes('abc12345'), 'password not in local/session storage');
  ok(JSON.parse(p.w.localStorage.getItem('3dt.onboarding:j@example.com') || '{}').agreed, 'register saves the agreement (no separate plan step)');
  ok(p.errs.length === 0, 'auth no JS errors ' + p.errs.join(' | '));
  store = p.store();
  // existing email
  p = await load('/account/auth.html?mode=register', { store });
  p.w.TDAccount.logout && p.w.TDAccount.session() && p.w.TDAccount.logout({ redirect: false });
  p.$('#email').value = 'j@example.com'; p.$('#pw').value = 'abc12345'; p.$('#pw2').value = 'abc12345'; p.$('#agree').checked = true;
  p.submit('#f'); await sleep(400);
  ok(p.$('#alert').classList.contains('on') && /已经注册|already/.test(p.$('#alert').textContent), 'register existing email → EMAIL_EXISTS alert: ' + p.$('#alert').textContent.trim().slice(0, 40));

  // 3 onboard.html (kept for old links): agreement only, no plan, no size / style
  p = await load('/account/onboard.html?first=1', { store: Object.assign({}, store, { '3dt.onboarding:j@example.com': '{}' }) });
  ok(!p.$('#vA').hidden && p.$('#pendA').textContent.includes('待法务定稿'), 'onboard: risk & agreement, labelled 待法务定稿');
  ok(p.$$('#agL li').length >= 3, 'agreement sections from getAgreement: ' + p.$$('#agL li').length);
  ok(!p.$('#vB') && !p.$('#sizes') && !p.$('#risks'), 'onboard has no plan / asset size / style step');
  p.click('#goA'); await sleep(50);
  ok(p.$('#agErr').classList.contains('on'), 'must tick before continuing');
  p.$('#agree').checked = true; p.click('#goA'); await sleep(400);
  ok(JSON.parse(p.w.localStorage.getItem('3dt.onboarding:j@example.com') || '{}').agreed, 'onboard saves agreed');
  ok(p.errs.length === 0, 'onboard no JS errors ' + p.errs.join(' | '));

  // 3b connect.html: API Key + Secret. Format check only; with no verification service it says so and stores nothing.
  p = await load('/account/connect.html', { store, settle: 700 });
  ok(!!p.$('#key') && !!p.$('#sec') && p.$('#sec').type === 'password', 'connect: API Key + Secret (masked) fields');
  // r45 · three big steps only (开通子账户 → 创建API → 绑定API); system-generated keys only, no key-type choice
  const G = p.w.__guide;
  ok(!!G && G.big3().join(',') === 'sub,api,bind' && p.$$('#big li').length === 3, 'connect: exactly three big steps ' + (G && G.big3().join(',')));
  ok(/开通子账户/.test(p.$('#big').textContent) && /创建API/.test(p.$('#big').textContent) && /绑定API/.test(p.$('#big').textContent), 'connect: progress reads 开通子账户 / 创建API / 绑定API');
  ok(!p.$('#cBar') && !p.$('#next') && !p.$('#coach') && !p.$('#cBr'), 'connect: no sub-step progress, no 下一步, no branch buttons');
  ok(G.big === 0 && G.sub === 0 && p.$$('.hot').length === 1 && p.$('#hb .hot') && p.$('#hb .hot').dataset.t === 'av', 'connect r46: starts on 开通子账户 with only the avatar (in the one merged Binance bar) lit');
  ok(p.$('.hot').getAttribute('tabindex') === '0' && p.$('.hot').getAttribute('role') === 'button' && !!p.$('.hot').getAttribute('aria-label'), 'connect: lit control is focusable, a button, labelled with the hint');
  ok(G.pending <= 1, 'connect: at most one demo timer pending: ' + G.pending);
  p.click('#bn .bn-home'); ok(G.big === 0 && G.sub === 0, 'connect: clicking elsewhere in the Binance screen does not advance');
  const n0 = G.subs(0), n1 = G.subs(1);
  for (let i = 0; i < n0; i++) p.click('.hot');
  ok(G.big === 1 && G.sub === 0, `connect: pressing the lit control through 开通子账户 (${n0} sub-steps) lands on 创建API`);
  for (let i = 0; i < n1; i++) p.click('.hot');
  ok(G.big === 2 && G.sub === 0 && !p.$('#panel').hidden, `connect: through 创建API (${n1} sub-steps) to 绑定API, form shown`);
  ok(p.$('#skip').hidden, 'connect: no 跳过 on the last big step');
  p.click('#big [data-big="0"]'); ok(G.big === 0 && G.sub === 0 && p.$('#panel').hidden, 'connect: progress bar jumps back to 开通子账户');
  p.click('#skip'); ok(G.big === 1 && G.sub === 0, 'connect: 跳过 → 创建API');
  // r46 · Binance's real 「选择API密钥类型」 page is back: 系统生成 is lit first, then 下一步; 自行生成 is drawn but never a target
  { let iT = -1; for (let i = 0; i < n1; i++) { G.go(1, i); if (p.$('#bn [data-slot="optSys"]')) { iT = i; break; } }
    ok(iT >= 0 && /选择API密钥类型/.test(p.$('#bn').textContent) && /系统生成/.test(p.$('#bn').textContent) && /自行生成/.test(p.$('#bn').textContent), 'connect r46: 创建API shows the key-type page (系统生成 / 自行生成)');
    ok(p.$('#bn .hot') && p.$('#bn .hot').dataset.slot === 'optSys', 'connect r46: first the cursor target is 系统生成');
    p.click('#bn .hot'); ok(G.sub === iT + 1 && p.$('#bn .hot') && p.$('#bn .hot').dataset.t === 'next' && p.$('#bn [data-slot="optSys"]').classList.contains('on'), 'connect r46: 系统生成 chosen (corner) then 下一步 lit');
    let selfHot = false; for (let b = 0; b < 3; b++) for (let i = 0; i < G.subs(b); i++) { G.go(b, i); if (p.$('.hot') && p.$('.hot').dataset.slot === 'optSelf') selfHot = true; }
    ok(!selfHot, 'connect r46: 自行生成 is never a step (that route is not built)'); }
  G.go(0, 0); p.$('.hot').dispatchEvent(new p.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); ok(G.big === 0 && G.sub === 1 && p.$('.hot').dataset.t === 'subacc', 'connect: Enter on the lit control = press it');
  p.d.dispatchEvent(new p.w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); ok(G.sub === 2, 'connect: → arrow = next sub-step');
  p.d.dispatchEvent(new p.w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); ok(G.sub === 1, 'connect: ← arrow = back');
  // copy the suggested name (never a key): success only after the clipboard accepted it, fallback message otherwise
  G.go(0, 3);
  ok(!!p.$('#hint [data-copy="name"]') && /3dtUSDT01/.test(p.$('#hint').textContent), 'connect: create-sub-account step offers the name to copy');
  let clip = null; Object.defineProperty(p.w, 'isSecureContext', { value: true, configurable: true });
  Object.defineProperty(p.w.navigator, 'clipboard', { value: { writeText: v => { clip = v; return Promise.resolve(); } }, configurable: true });
  p.click('#hint [data-copy]'); await sleep(60);
  ok(clip === '3dtUSDT01' && /已复制|Copied/.test(p.$('#toast').textContent), 'connect: copy success reported only after the clipboard accepted it');
  Object.defineProperty(p.w.navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true });
  p.d.execCommand = () => false; p.click('#hint [data-copy]'); await sleep(60);
  ok(/手动|type it/.test(p.$('#toast').textContent) && /3dtUSDT01/.test(p.$('#toast').textContent), 'connect: copy failure → says so and shows the value to type');
  ok(!/PRIVATE KEY|BEGIN [A-Z ]*KEY/.test(p.d.documentElement.outerHTML), 'connect: no key material in the page');
  G.go(2, 0); p.$('#key').dispatchEvent(new p.w.Event('focus')); ok(G.hold && G.pending === 0, 'connect: focusing our field stops the demo');
  // empty fields
  p.$('#name').value = ''; p.$('#key').value = ''; p.$('#sec').value = '';
  p.submit('#f'); await sleep(500);
  ok(p.$('#fName').classList.contains('err') && p.$('#fKey').classList.contains('err') && p.$('#fSec').classList.contains('err'), 'connect: empty name / key / secret all flagged');
  p.$('#name').value = 'Main'; p.$('#key').value = 'short'; p.$('#sec').value = 'short2';
  p.submit('#f'); await sleep(500);
  ok(p.$('#fKey').classList.contains('err') && p.$('#fSec').classList.contains('err'), 'connect: bad formats flagged per field');
  const SEC = K64(7).split('').reverse().join('');
  p.$('#key').value = K64(6); p.$('#sec').value = SEC; p.submit('#f'); await sleep(1300);
  const rx = p.$('#res').textContent;
  ok(!p.$('#res').hidden && /验证服务|verification service/i.test(rx), 'connect: valid format → 验证服务未接入: ' + rx.trim().replace(/\s+/g, ' ').slice(0, 60));
  ok(!/连接成功|已连接|connected successfully/i.test(rx.replace(/未连接|not connected/ig, '')), 'connect: never shown as connected');
  ok(p.$('#key').value === '' && p.$('#sec').value === '', 'connect: Key and Secret wiped after submit');
  ok(!p.dump().includes(SEC) && !p.dump().includes(K64(6)), 'connect: Secret / Key not in local or session storage');
  ok(p.w.TDAccount.accounts().list.length === 0, 'connect: no account created when nothing was verified');
  ok(p.errs.length === 0, 'connect no JS errors ' + p.errs.join(' | '));
  store = p.store();

  // 4 bind ①: create up to 8, field errors per row
  p = await load('/account/bind.html?first=1', { store });
  const R = () => p.$$('#rows .arow'), F = (r, f) => r.querySelector(`[data-f="${f}"] input`), E = (r, f) => r.querySelector(`[data-f="${f}"]`).classList.contains('err');
  ok(p.$('#welcome').classList.contains('on') && p.w.location.search === '', 'first=1 welcome, flag removed from URL');
  ok(p.$('#obNote').hidden, 'onboarding agreed → no agreement note');
  ok(!p.$('#formView').hidden && R().length === 1, 'no accounts → form ① with one row');
  ok(!p.d.querySelector('input[name*="sec" i], input[data-f="sec"], [data-f="sec"], [data-f="key"] input') || !p.$('#rows [data-f="key"]'), 'form ① has no API Key / Secret field');
  for (let i = 0; i < 9; i++) p.click('#addRow');
  ok(R().length === 8 && p.$('#addRow').hidden, 'at most 8 rows');
  while (R().length > 3) R()[3].querySelector('[data-rmrow]').click();
  F(R()[0], 'name').value = 'SubA'; F(R()[0], 'uid').value = '123456789';
  F(R()[1], 'name').value = 'SubB'; F(R()[1], 'uid').value = '12ab';
  F(R()[2], 'name').value = 'suba'; F(R()[2], 'uid').value = '223456789';
  p.submit('#f'); await sleep(1200);
  let L = () => p.w.TDAccount.accounts().list;
  ok(L().length === 1 && L()[0].name === 'SubA' && L()[0].status === 'awaiting_key', 'valid row created → awaiting_key');
  ok(R().length === 2 && E(R()[0], 'uid') && E(R()[1], 'name'), 'bad UID and duplicate name stay, each flagged on its own field');
  ok(!p.$('#sum').hidden && /1/.test(p.$('#sumT').textContent), 'summary: 1 created, 2 not');
  F(R()[0], 'uid').value = '323456789'; F(R()[1], 'name').value = 'SubC'; p.submit('#f'); await sleep(1200);
  ok(L().length === 3 && L().every(a => a.status === 'awaiting_key'), 'all three created, each awaiting its key');
  ok(p.$$('#brows .brow').length === 3, 'three rows, each with its own ②–⑤');
  ok(L().every(a => Object.keys(a).every(k => !/key|secret/i.test(k) || k === 'keyHint')), 'stored account has no key fields: ' + Object.keys(L()[0]).join(','));

  // ② public key card
  const idA = L().find(a => a.name === 'SubA').id, idB = L().find(a => a.name === 'SubB').id, idC = L().find(a => a.name === 'SubC').id;
  const row = id => p.$(`.brow[data-id="${id}"]`);
  const open = async id => { if (!row(id).classList.contains('open')) { p.click(row(id).querySelector('[data-acc]')); await sleep(300); } };
  await open(idA);
  const kit = await p.w.TDApi.getBindKit(idA);
  let rt = row(idA).textContent;
  ok(row(idA).querySelector('[data-pem]').textContent.trim() === kit.publicKeyPem.trim() && /BEGIN PUBLIC KEY/.test(kit.publicKeyPem), '② full public key shown');
  ok(rt.includes(kit.fingerprint) && !!row(idA).querySelector('[data-copypub]'), '② fingerprint + copy button');
  ok(rt.includes('公钥是公开的，可以放心复制') && rt.includes('示例公钥 · 演示'), '② "公钥是公开的" + 示例公钥 · 演示 tag');
  ok(kit.ips.every(ip => rt.includes(ip)) && kit.perms.every(x => rt.includes(x.zh)), '② IPs and permissions rendered from getBindKit');
  p.click(row(idA).querySelector('[data-copypub]')); await sleep(30);
  ok(/公钥已复制|已复制/.test(p.$('#toast').textContent), 'copy public key → toast: ' + p.$('#toast').textContent);
  ok(/自行生成/.test(rt) && /粘贴公钥/.test(rt) && /API Key/.test(rt) && /示意/.test(rt), '③ tutorial: 自行生成 → 粘贴公钥 → 复制 API Key, 示意');

  // ④ API Key: format check, cleared on submit, ticks, then ⑤
  const key = id => row(id).querySelector('input[data-key]');
  ok(row(idA).querySelectorAll('input').length === 1 && !!key(idA), '④ exactly one input (API Key), no Secret');
  key(idA).value = 'short-key'; p.submit(row(idA).querySelector('[data-keyform]')); await sleep(300);
  ok(key(idA).value === '' && row(idA).querySelector('[data-f="key"]').classList.contains('err') && /64/.test(row(idA).textContent), '④ bad format → error, field cleared');
  p.$('#outSel').value = 'pass'; p.$('#outSel').dispatchEvent(new p.w.Event('change'));
  key(idA).value = K64(1); p.submit(row(idA).querySelector('[data-keyform]'));
  await sleep(20);
  ok(!key(idA) || key(idA).value === '', '④ field cleared immediately on submit');
  await sleep(400);
  ok(L().find(a => a.id === idA).status === 'checking' && row(idA).querySelector('.ticks:not(.done)'), '④ checking: ticks running');
  const t1 = row(idA).querySelectorAll('.ticks li.w').length; await sleep(650);
  ok(t1 === 1 && row(idA).querySelector('.ticks li.w') && row(idA).querySelector('.ticks li.w') !== null, '④ one step in progress at a time');
  await sleep(1600);
  rt = row(idA).textContent;
  ok(L().find(a => a.id === idA).status === 'observing' && rt.includes('试运行（只观察）'), '⑤ pass → 试运行（只观察）');
  ok(row(idA).querySelectorAll('.ticks.done li.y').length === 5, '⑤ all five checks ticked');
  ok(!p.dump().includes(K64(1)), 'full API Key not in local/session storage (pass)');

  // fail with a normal code: reasons + how + 问 Dodo
  await open(idB); await sleep(300);
  p.$('#outSel').value = 'PERM_MISSING'; p.$('#outSel').dispatchEvent(new p.w.Event('change'));
  key(idB).value = K64(2); p.submit(row(idB).querySelector('[data-keyform]')); await sleep(2300);
  rt = row(idB).textContent;
  const ft = p.w.TDApi.getFailureText('PERM_MISSING');
  ok(L().find(a => a.id === idB).status === 'failed' && rt.includes(ft.title) && rt.includes(ft.how), '⑤ fail → reason + how to fix');
  const dodo = row(idB).querySelector('[data-code="PERM_MISSING"] a.dodo');
  ok(dodo && /ask=dodo/.test(dodo.getAttribute('href')) && /topic=PERM_MISSING/.test(dodo.getAttribute('href')), '⑤ 问 Dodo link with the code: ' + (dodo && dodo.getAttribute('href')));
  ok(p.$('#secOv').hidden, 'non-security code → no security page');
  ok(!p.dump().includes(K64(2)), 'full API Key not in storage (fail)');
  // retest from the row: same public key, only ④ again
  const pem0 = (await p.w.TDApi.getBindKit(idB)).publicKeyPem;
  p.click(row(idB).querySelector('[data-retest]')); await sleep(700);
  ok(L().find(a => a.id === idB).status === 'awaiting_key' && key(idB) && row(idB).querySelector('[data-pem]').textContent.trim() === pem0.trim(), 'retest → back to ④ with the same public key');

  // security code: full-page red security page
  await open(idC); await sleep(300);
  p.$('#outSel').value = 'SIGNATURE_MISMATCH'; p.$('#outSel').dispatchEvent(new p.w.Event('change'));
  key(idC).value = K64(3); p.submit(row(idC).querySelector('[data-keyform]')); await sleep(2400);
  const ov = p.$('#secOv');
  ok(!ov.hidden && ov.textContent.includes('请立即到币安删除这个 API') && ov.textContent.includes('我们已通知你的邮箱 / Telegram') && ov.textContent.includes('演示模拟，未实际发送'), 'SIGNATURE_MISMATCH → security page with demo label');
  ok(/K64|…/.test(p.$('#secWho').textContent) || p.$('#secWho').textContent.includes(K64(3).slice(0, 4) + '…' + K64(3).slice(-4)), 'security page shows key hint 4…4: ' + p.$('#secWho').textContent);
  p.click('#secClose'); await sleep(50);
  ok(ov.hidden, 'security page closes');
  ok(!!row(idC).querySelector('[data-secopen]'), 'failed row can reopen the security page');

  // unbind: confirm twice → 请到币安删除 + 4/4 hint
  p.click(row(idC).querySelector('[data-rm]')); await sleep(30);
  ok(L().some(a => a.id === idC), 'first unbind click only asks');
  p.click(row(idC).querySelector('[data-rm]')); await sleep(600);
  const un = p.$('#unNote').textContent, hint = K64(3).slice(0, 4) + '…' + K64(3).slice(-4);
  ok(!L().some(a => a.id === idC) && un.includes('请到币安删除这个 API') && un.includes(hint), 'unbind → 请到币安删除这个 API + hint ' + hint);
  ok(!un.includes(K64(3)), 'unbind note never shows the full key');
  ok(p.errs.length === 0, 'bind no JS errors ' + p.errs.join(' | '));

  // en
  p.w.TDAccount.setLang('en'); await sleep(700);
  await open(idB); await sleep(300);
  const pt = p.$('#panel').textContent;
  ok(p.d.documentElement.lang === 'en' && !CJK.test(pt.replace(/SubA|SubB/g, '')), 'en: panel has no Chinese' + ((pt.match(/.{0,20}[一-鿿]+.{0,10}/) || [''])[0]));
  ok(/public key is public/i.test(pt) || /Public keys are public/i.test(pt) || /safe to copy/i.test(pt), 'en: public-key wording');
  store = p.store();

  // 5 refresh + ?id= retest (from a failed account) → reruns only ④
  p = await load('/account/bind.html', { store });
  ok(p.$$('#brows .brow').length === 2, 'after refresh: 2 accounts');
  ok(!p.dump().match(/[A-Za-z0-9]{64}/), 'no 64-char key anywhere in storage after reload');
  await p.w.TDApi.demoControls.setStatus(idA, 'failed', ['IP_RESTRICT_OFF']); store = p.store();
  p = await load('/account/bind.html?id=' + idA, { store, settle: 900 });
  ok(p.w.TDAccount.accounts().list.find(a => a.id === idA).status === 'awaiting_key' && p.$(`.brow.open[data-id="${idA}"] input[data-key]`), '?id= → retest: row open at ④');
  ok(p.$(`.brow.open[data-id="${idA}"] [data-pem]`) && p.$$('#formView:not([hidden]) #rows .arow').length === 0, '?id= keeps the public key, no new-account form');
  ok(p.errs.length === 0, '?id= no JS errors ' + p.errs.join(' | '));

  // 6 390 px + login flow
  p = await load('/account/bind.html', { store, width: 390 });
  ok(p.$$('#brows .brow').length === 2 && p.$('#bn').children.length > 0 && p.errs.length === 0, '390: rows + tutorial render, no errors');
  p = await load('/account/auth.html?mode=login', { store });
  p.w.TDAccount.logout({ redirect: false });
  p.$('#email').value = 'nobody@x.com'; p.$('#pw').value = 'whatever1'; p.submit('#f'); await sleep(400);
  ok(p.$('#alert').classList.contains('on'), 'login unknown email → not found');
  p.$('#email').value = 'j@example.com'; p.$('#pw').value = 'whatever1'; p.submit('#f'); await sleep(400);
  ok(p.w.TDAccount.session() && p.w.TDAccount.accounts().list.length === 2 && p.$('#pw').value === '', 'login restores accounts, password cleared');
  ok(!p.dump().includes('whatever1'), 'login password not stored');
  done();
})().catch(e => { console.error(e); process.exit(2); });
