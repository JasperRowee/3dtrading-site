/* r38 dashboard checks (jsdom). jsdom is NOT installed in this repo: install it in a scratch folder and point NODE_PATH there.
   Usage: NODE_PATH=/path/to/scratch/node_modules node app/_test/run.mjs [http://127.0.0.1:8978/app/index.html]
   Loads the page from the local preview server, never from Binance or any real backend. */
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(join(process.env.NODE_PATH || '.', 'x.js'));
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const URL0 = process.argv[2] || 'http://127.0.0.1:8978/app/index.html';
const ORIGIN = new URL(URL0).origin + '/'; /* r39: follow the preview port given on the command line */
const APP = join(dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0, fail = 0; const out = [];
const ok = (c, name, extra) => { (c ? pass++ : fail++); out.push(`${c ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + String(extra).replace(/\s+/g, ' ').slice(0, 160) : ''}`); };
let DONE = false;
process.on('exit', () => { console.log(out.join('\n')); console.log(`\n${pass} passed, ${fail} failed${DONE ? '' : ' (stopped early)'}`); });
process.on('uncaughtException', e => { fail++; out.push('FAIL  crashed: ' + (e && e.stack || e).toString().split('\n').slice(0, 2).join(' ')); process.exit(1); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms = 4000) { const t = Date.now(); while (Date.now() - t < ms) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(40); } return null; }

/* ---------- 1. static: no fetch / XHR / /api/ anywhere in app/ ---------- */
const files = readdirSync(APP).filter(f => /\.(html|js|mjs)$/.test(f));
for (const f of files) {
  const src = readFileSync(join(APP, f), 'utf8');
  const bad = [];
  src.split('\n').forEach((l, i) => { if (/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|new\s+WebSocket|EventSource/.test(l)) bad.push(`${i + 1}: network call`); if (l.includes('/api/')) bad.push(`${i + 1}: /api/`); });
  ok(!bad.length, `app/${f}: no fetch / XHR / "/api/"`, bad.slice(0, 3).join('; '));
}

/* ---------- jsdom page loader ---------- */
const NET = [];
class Loader extends ResourceLoader { fetch(url, o) { NET.push(url); if (/\/api\//.test(url) || !url.startsWith(ORIGIN)) return Promise.resolve(Buffer.from('')); return super.fetch(url, o); } }
async function open(url = URL0, { width = 1280, theme } = {}) {
  const errs = [], calls = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', e => errs.push(String(e && (e.stack || e.message) || e).split('\n')[0])); vc.on('error', e => errs.push(String(e)));
  const dom = await JSDOM.fromURL(url, { runScripts: 'dangerously', resources: new Loader(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.innerWidth = width; w.innerHeight = 900;
      w.matchMedia = q => { const m = /max-width:\s*(\d+)/.exec(q), n = /min-width:\s*(\d+)/.exec(q); const matches = m ? width <= +m[1] : n ? width >= +n[1] : false; return { matches, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null }; };
      w.fetch = (...a) => { calls.push(['fetch', String(a[0])]); return Promise.reject(new Error('blocked in test')); };
      w.XMLHttpRequest = function () { calls.push(['xhr']); this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; };
      w.navigator.sendBeacon = (u) => { calls.push(['beacon', u]); return true; };
      w.Element.prototype.animate = function () { return { finished: Promise.resolve(), cancel() {}, onfinish: null, addEventListener() {} }; };
      w.Element.prototype.scrollIntoView = function () {}; w.Element.prototype.scrollTo = function () {}; w.scrollTo = () => {};
      w.HTMLDialogElement && (w.HTMLDialogElement.prototype.showModal = function () { this.open = true; }, w.HTMLDialogElement.prototype.close = function () { this.open = false; });
      w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }; w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
      w.visualViewport = { width, height: 900, addEventListener() {}, removeEventListener() {} };
      Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return width > 600 ? 900 : 360; } });
      Object.defineProperty(w.HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return 300; } });
      if (theme) w.localStorage.setItem('3dt.theme.app', theme);
    } });
  const w = dom.window, d = w.document;
  await until(() => w.TDApi && d.querySelector('#main'), 6000); await sleep(400);
  return { dom, w, d, errs, calls, $: s => d.querySelector(s), $$: s => [...d.querySelectorAll(s)], text: s => (d.querySelector(s) || {}).textContent || '' };
}
const click = (P, el) => el.dispatchEvent(new P.w.MouseEvent('click', { bubbles: true, cancelable: true }));
const submit = (P, form) => form.dispatchEvent(new P.w.Event('submit', { bubbles: true, cancelable: true }));
const go = async (P, h) => { P.w.location.hash = h; await sleep(250); };

/* ---------- 2. signed out: no auto demo login ---------- */
let P = await open();
ok(P.$('meta[name="robots"][content*="noindex"]'), 'index.html carries <meta name="robots" content="noindex">');
ok(!P.w.TDAccount.session(), 'no automatic login: session is empty after load');
ok(P.$('#main [data-empty="signed-out"]'), 'signed-out state shows 未登录 panel', P.text('#main h2'));
ok(P.$('#main [data-empty="signed-out"] a.btn[href*="mode=login"]') && P.$('#main [data-demologin]'), 'signed-out state offers 登录 and 用演示账号进入 (user chooses)');
for (const pg of ['actions', 'notify', 'wallet', 'me']) { await go(P, '#/' + pg); ok(P.$(`#pg-${pg} [data-empty="signed-out"]`), `#/${pg} signed out shows the 未登录 panel`); }
await go(P, '#/dashboard');

/* ---------- 3. user picks the demo account → no account yet ---------- */
click(P, P.$('#main [data-demologin]'));
ok(await until(() => P.w.TDAccount.session()), 'clicking 用演示账号进入 signs in (demo)');
ok(await until(() => P.$('#main [data-empty="no-account"]')), 'empty state: 没有账户', P.text('#main h2'));
ok(P.$('#main [data-adddemo]') && P.$('#main a.btn[href*="connect"]'), 'no-account state offers 添加币安账户 (→ account/connect.html, r41) and 先看示例账户');
ok(!/[0-9],[0-9]{3}/.test(P.text('#main')), 'no-account state shows no money figures');

/* ---------- 4. each account status → its empty state (8 statuses + legacy + unknown) ---------- */
const A = P.w.TDAccount, ST = [['observing', 'observing', '试运行（只观察）'], ['halted', 'halted', '已停机'], ['failed', 'test-failed', '测试失败'], ['checking', 'processing'], ['awaiting_key', 'processing'], ['pending', 'processing'], ['what-is-this', 'processing', '处理中'], ['unbound', 'unbound']];
for (const [st, key, h] of ST) {
  A.upsertAccount({ id: 'b-test', name: '测试子账户', uid: '123456', status: st }); A.setActive('b-test');
  const el = await until(() => P.$(`#main [data-empty="${key}"]`));
  ok(el && (!h || el.querySelector('h2').textContent.includes(h)), `status "${st}" → empty state "${key}"${h ? ' 「' + h + '」' : ''}`, el ? el.querySelector('h2').textContent : P.text('#main').slice(0, 80));
  ok(!/已连接/.test(P.text('#main')) && !P.$('#main #curve'), `status "${st}": no data panels, never "已连接"`);
}
A.upsertAccount({ id: 'b-test', status: 'observing' }); await until(() => P.$('#main [data-demorun]'));
click(P, P.$('#main [data-demorun]'));
ok(await until(() => P.$('#main #curve')), 'observing → 演示：切换为运行中 shows the (demo-labelled) dashboard');
ok(P.$$('#main .demo').length >= 3, 'running non-demo account: numbers carry 演示 labels', P.$$('#main .demo').length + ' labels');
A.removeAccount('b-test');

/* ---------- 5. demo account, comparison lines, alerts ---------- */
await until(() => P.$('#main [data-adddemo]')); click(P, P.$('#main [data-adddemo]'));
ok(await until(() => P.$('#main #curve')), 'user-added 示例账户 shows the dashboard');
ok(P.$$('#main .demo.dm').length >= 3, 'demo numbers labelled 演示 (hero, curve, yield/positions)', P.$$('#main .demo.dm').map(x => x.parentElement.textContent.slice(0, 14)).join(' | '));
ok(!/已连接币安/.test(P.text('#main')), 'demo data never reads 已连接币安');
const lg = P.text('#cmpLg');
ok(/直接存理财/.test(lg) && /不做平补/.test(lg) && /演示，口径待业务确认/.test(lg), 'comparison legend: 直接存理财 / 不做平补 / 演示，口径待业务确认');
ok(P.$('#curve path.cmp-save') && P.$('#curve path.cmp-nr'), 'curve draws both comparison lines');
/* r44: Jasper removed the overview reminder cards and the plan card. The old checks ("two alert cards", "every alert has 建议动作 and 问 Dodo",
   the whole plan-card + 6-digit verification block and "alert 建议动作 → 来自提醒") were replaced by the checks below. */
ok(!P.$('#alerts') && !P.$('#main .alert-c') && !P.$('#main .plan-card') && !P.$('#planIn'), 'r44: overview has no reminder cards and no plan card');
const spy = {}; for (const k of Object.keys(P.w.TDApi)) if (typeof P.w.TDApi[k] === 'function') { const f = P.w.TDApi[k]; P.w.TDApi[k] = function (...a) { (spy[k] = spy[k] || []).push(a); return f.apply(this, a); }; }

/* ---------- 6. r44 positions: fully locked 50% / 50%, one profit leg per coin ---------- */
const pr = await until(() => { const t = P.text('#posMini .px-ratio'); return /多\s*50\.0%/.test(t) && /50\.0%\s*空/.test(t) ? t : null; }, 2500) || P.text('#posMini .px-ratio'); /* count-up settles in ~520 ms */
ok(/多\s*50\.0%/.test(pr) && /50\.0%\s*空/.test(pr), 'r44: long / short notional 50.0% / 50.0%', pr.replace(/\s+/g, ' ').slice(0, 60));
ok(/完全锁定/.test(P.text('#posMini .px-lock')), 'r44: positions read 完全锁定', P.text('#posMini .px-lock'));
const sp = P.$('#posMini .px-split'); ok(sp && sp.children.length === 2, 'r44: one seamless split bar with two halves');
const prow = P.$$('#posMini .bh');
ok(prow.length >= 3 && prow.every(r => r.querySelectorAll('em.lt').length === 2 && /^\+/.test((r.querySelector('.ul') || r.children[1]).textContent.replace(/[^+\-−0-9]/g, '')) ), 'r44: each coin row has both legs tagged, left value positive', prow.map(r => r.textContent.replace(/\s+/g, ' ').slice(0, 40)).join(' | '));
ok(prow.every(r => { const t = [...r.querySelectorAll('em.lt')].map(e => e.textContent); return t.includes('多') && t.includes('空'); }), 'r44: every row marks which side is 多 and which is 空');

/* ---------- 6b. r44 fees: 1% subscription, crypto top-up with no address configured ---------- */
await go(P, '#/wallet');
ok(P.text('#fnav [data-nav="wallet"]') === '费用' && !/钱包/.test(P.text('#fnav')), 'r44b: nav entry reads 费用 (route #/wallet kept)', P.text('#fnav [data-nav="wallet"]'));
/* r46 · fees went back to the r43 layout (dark card + principle card · by account + rules · timeline) with the r44 subscription rules */
ok(/1\s*%\s*\/\s*月/.test(P.text('#walBody .bal')) && /本月剩余额度/.test(P.text('#walBody .bal')) && P.$('#walBody .bal [role=progressbar]'), 'r46: dark card shows 1% / 月 and this month\'s remaining quota with a bar', P.text('#walBody .bal').replace(/\s+/g, ' ').slice(0, 80));
ok(P.$('#walBody .subc .fx') && /总资产/.test(P.text('#walBody .subc')) && /×/.test(P.text('#walBody .subc .fx')), 'r46: principle card: 总资产 × 1% = 本月应付');
ok(P.$('#walBody .wsp table.wt') && /计费规则/.test(P.text('#walBody .wru')) && /下月优惠/.test(P.text('#walBody .wru')) && /Crypto/.test(P.text('#walBody .wru')), 'r46: by-account table and 计费规则 list (1%, quota, discount, Crypto only)');
ok(!/[0-9]+(\.[0-9]+)?\s*%\s*(折|off)/.test(P.text('#walBody')) && /以正式规则为准/.test(P.text('#walBody .wru')), 'r46: discount size is not invented (以正式规则为准)');
{ const li = P.$$('#bills .tl li:not(.empty)'); ok(P.$('#bills') && li.every(l => /示例/.test(l.textContent)), 'r46: every record in the timeline is marked 示例 (no real top-ups)', li.length + ' rows'); }
click(P, P.$('#topBtn')); await sleep(200);
ok(!P.$('#tuBox').hidden && /收款地址未配置/.test(P.text('#tuBox')), 'r44: top-up says 收款地址未配置');
ok(P.$('#tuCopy').disabled && P.$('#tGo').disabled, 'r44: copy address and 我已转账 are disabled without an address');
ok(!/\b(T[1-9A-HJ-NP-Za-km-z]{33}|0x[0-9a-fA-F]{40})\b/.test(P.text('#tuBox')), 'r44: no wallet address appears anywhere in top-up');
click(P, P.$('[data-tuc="USDC"]')); await sleep(100);
ok(P.$('[data-tuc="USDC"]').getAttribute('aria-checked') === 'true' && !P.$('[data-tun="TRC20"]'), 'r44: picking USDC limits networks to ERC20 / BEP20');
ok(!P.$$('#tuBox .tu-st li.on').length, 'r44: no deposit status is active');
await go(P, '#/dashboard');

/* ---------- 7. Dodo: on every page, read-only, never orders ---------- */
ok(P.$$('main section.page').every(s => s.querySelector('.ph [data-askq], .cv-foot, #chat') ), '问 Dodo reachable on every page', P.$$('main section.page').filter(s => !s.querySelector('.ph [data-askq]')).map(s => s.id).join(','));
for (const k in spy) delete spy[k];
const btn = P.d.createElement('button'); btn.dataset.askq = '帮我买入 BTC 并平仓 ETH'; P.d.body.appendChild(btn); click(P, btn);
const ans = await until(() => { const a = P.$$('#log .qa'); const t = a.length && a[a.length - 1].textContent; return t && /只读/.test(t) && t; }, 6000);
ok(ans, 'Dodo answers an order request with 只读 (cannot place orders)', (ans || '').slice(0, 60));
const orderish = Object.keys(spy).filter(k => /confirm|order|trade|place|propose|setStatus|upsert|bind/i.test(k));
ok(!orderish.length, 'asking Dodo triggers no order / confirm / plan calls', orderish.join(','));

/* ---------- 7b. r46 Dodo: head peeks from the nav edge, no sessions, flat presets beside it ---------- */
await go(P, '#/ai'); await sleep(120);
const hd = P.$('#ddHead'), pk = P.$('#ddPeek');
ok(pk && !pk.closest('section.page') && !P.$('#ddMenu') && !hd.hasAttribute('aria-haspopup'), 'r46: Dodo head lives outside the page (no teleport with the page animation) and is not a session menu');
ok(hd && hd.querySelector('.ddp-pu') && hd.querySelector('.ddp-lid') && !/arm|leg/.test(hd.innerHTML), 'r46: head keeps the following pupil and blink lid, no limbs');
ok(pk.classList.contains('in'), 'r46: on the Dodo page the head is peeking');
const qb = P.$$('#ddQ [data-ddq]'); ok(qb.length >= 2 && qb.every(b => b.textContent.trim()), 'r46: flat preset questions beside the head', qb.map(b => b.textContent).join(' | '));
const n0 = P.$$('#log .qa').length; click(P, qb[0]);
const got = await until(() => P.$$('#log .qa').length > n0, 4000); ok(got, 'r46: a preset question is asked straight away');
ok(!/NaN/.test(P.text('#log')), 'r46: no NaN in Dodo answers');
const had = P.$$('#log .qa').length;
await go(P, '#/dashboard'); ok(!pk.classList.contains('in'), 'r46: leaving the Dodo page tucks the head back');
await go(P, '#/ai'); ok(P.$$('#log .qa').length === had, 'r46: no sessions: coming back keeps the same chat (no 新会话)', had + ' → ' + P.$$('#log .qa').length);
ok(!P.$('#ddPeek .ddp-it') && !/新会话|更多历史/.test(P.text('#ddPeek')), 'r46: no 新会话 / 更多历史 beside Dodo');

/* ---------- 8. 我们替你做了什么 ---------- */
await go(P, '#/actions');
const rows = await until(() => P.$$('#actBody .act-r').length && P.$$('#actBody .act-r'));
ok(rows && rows.length >= 3, '#/actions lists actions', rows && rows.length + ' rows');
ok(rows && rows.every(r => ['时间', '做了什么', '结果', '方案版本'].every(k => r.querySelector(`[data-k="${k}"]`) && r.querySelector(`[data-k="${k}"]`).textContent.trim())), 'each action has 时间 / 做了什么 / 结果 / 方案版本');
ok(P.$('#actBody .demo'), '#/actions carries a 演示 label');

/* ---------- 9. notification settings ---------- */
await go(P, '#/notify');
const note = await until(() => P.$('#ntBody [data-demo-note]'));
ok(note && /演示/.test(note.textContent) && /不会真实发送/.test(note.textContent), '#/notify has the demo label and says nothing is really sent', note && note.textContent.trim());
ok(['telegram', 'discord', 'email'].every(k => P.$(`#ntBody [data-ch="${k}"]`)), 'Telegram / Discord / 邮箱 rows');
const tg = P.$('#ntBody [data-nt-bind="telegram"]'); tg.elements.t.value = '@demo_user'; submit(P, tg);
ok(await until(() => P.$('#ntBody [data-nt-on="telegram"]')), 'binding Telegram (demo) shows its on/off switch');

/* ---------- 10. language + theme ---------- */
P.w.I18N.set('en'); await sleep(300);
ok(P.text('#fnav [data-nav="wallet"]') === 'Fees' && !/Wallet/.test(P.text('#fnav')), 'r44b: English nav entry reads Fees', P.text('#fnav [data-nav="wallet"]'));
ok(P.d.documentElement.lang === 'en' && /What we did for you/.test(P.text('#h-actions')), 'English: page titles translated', P.text('#h-notify'));
await go(P, '#/me'); const tb = P.$('[data-theme-set="night"]');
ok(tb, 'Me has a day / night switch'); if (tb) click(P, tb);
ok(P.d.documentElement.dataset.theme === 'night' && P.w.localStorage.getItem('3dt.theme.app') === 'night' && P.w.localStorage.getItem('3dt.theme.site') === null, 'night switch sets data-theme and the dashboard-only 3dt.theme.app (website key untouched)');
for (const pg of ['dashboard', 'actions', 'notify', 'me', 'trades', 'wallet', 'ai']) { await go(P, '#/' + pg); await sleep(100); }
const NEW = /方案|演示|提醒|通知|绑定|只读|试运行|停机|处理中|未登录|对比|理财|平补|操作|验证|Dodo|日间|夜间|确认|修改|渠道|Telegram|Discord|邮箱|动作|版本/;
const miss = P.w.I18N.missing().filter(([k]) => NEW.test(k)); if (process.env.DUMP_MISSING) console.error(JSON.stringify(P.w.I18N.missing().map(x => x[0])));
ok(!miss.length, 'English: no untranslated r38 strings', miss.slice(0, 12).map(x => x[0]).join(' | '));

ok(!P.calls.length, 'no fetch / XHR / beacon at runtime', JSON.stringify(P.calls.slice(0, 3)));
ok(!NET.some(u => /\/api\//.test(u)) && NET.every(u => u.startsWith(ORIGIN)), 'only local static files loaded, nothing under /api/', NET.filter(u => !u.startsWith(ORIGIN) || /\/api\//.test(u)).join(','));
ok(!P.errs.length, 'no script errors (1280 run)', P.errs.slice(0, 3).join(' || '));
P.w.close();

/* ---------- 11. 390 px + night theme from the shared choice, phone.html noindex ---------- */
P = await open(URL0 + '?lang=en', { width: 390, theme: 'night' });
ok(P.d.documentElement.dataset.theme === 'night' && P.$('#main [data-empty="signed-out"]'), '390 px, night theme: loads and shows 未登录');
ok(/Not signed in/.test(P.text('#main h2')) && /Enter with the demo account/.test(P.text('#main [data-demologin]')), '390 px English: signed-out state translated', P.text('#main h2'));
ok(!P.errs.length, 'no script errors (390 run)', P.errs.slice(0, 3).join(' || '));
P.w.close();
P = await open(URL0.replace('index.html', 'phone.html'));
ok(P.$('meta[name="robots"][content*="noindex"]'), 'phone.html carries noindex'); P.w.close();

/* ---------- 12. ?ask=dodo&topic=CODE from the binding page's failure link ---------- */
P = await open(URL0 + '?ask=dodo&topic=PERM_MISSING#/dashboard');
const FT = P.w.TDApi.getFailureText('PERM_MISSING');
ok(P.$('#main [data-empty="signed-out"]') && P.d.body.dataset.page !== 'ai', '?ask=dodo signed out: stays on the 未登录 panel first', P.text('#main h2'));
ok(!/ask=dodo/.test(P.w.location.search), '?ask=dodo is read once and removed from the address', P.w.location.href.replace(/^.*\/app\//, ''));
click(P, P.$('#main [data-demologin]'));
ok(await until(() => P.d.body.dataset.page === 'ai'), 'after signing in, ?ask=dodo opens the Dodo page', P.d.body.dataset.page);
const fAns = await until(() => { const t = P.text('#log'); return t.includes(FT.title) && t.includes(FT.how) && P.$('#log .qa .src') ? t : null; }, 8000);
ok(fAns, 'Dodo shows the failure-code explanation from TDApi.getFailureText', FT.title + ' / ' + FT.how);
ok(fAns && /PERM_MISSING/.test(fAns) && /只读/.test(fAns), 'answer names the code and says Dodo is read-only');
P.w.close();
P = await open(URL0 + '?ask=dodo&topic=SIGNATURE_MISMATCH#/dashboard');
click(P, P.$('#main [data-demologin]')); await until(() => P.d.body.dataset.page === 'ai');
const FT2 = P.w.TDApi.getFailureText('SIGNATURE_MISMATCH');
ok(await until(() => P.$('#log .qa .src') && P.text('#log').includes(FT2.title) && /安全事件/.test(P.text('#log')), 8000), 'security failure code: answer flags it as a security event', FT2.title);
ok(!P.calls.length && !P.errs.length, '?ask=dodo: no network calls, no script errors', P.errs.slice(0, 2).join(' | '));
P.w.close();

/* ---------- 13. night readability in real headless Chrome (see night.mjs) ---------- */
/* r39: SKIP_HEADLESS=1 skips the puppeteer run; the same checks are then done in the mounted browser instead */
if (!process.env.SKIP_HEADLESS) { const { run: night } = await import('./night.mjs');
await night(ok, URL0); }

DONE = true; process.exit(fail ? 1 : 0);
