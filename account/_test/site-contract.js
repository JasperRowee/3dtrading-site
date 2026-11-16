const { JSDOM } = require('jsdom'); const fs = require('fs');
const site = fs.readFileSync(process.argv[2], 'utf8');
if (!site.includes('const Account = (() => {')) { console.log('N/A: this site build has no embedded Account block / avatar template (the site owns its own account entry now); nothing to check.'); process.exit(0); }
const acct = site.slice(site.indexOf('const Account = (() => {'), site.indexOf('</script>', site.indexOf('const Account = (() => {')));
const tpl = site.match(/<template id="tdAvatar">[\s\S]*?<\/template>/)[0];
const mod = fs.readFileSync(process.argv[3], 'utf8');
function run(store) {
  const dom = new JSDOM(`<!doctype html><body><div id="td-account-slot"></div>${tpl}</body>`, { url: 'http://127.0.0.1:8978/site/index.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window; for (const k in store) w.localStorage.setItem(k, store[k]);
  w.eval(mod); w.eval('window.T = (k, z) => z; var _T = (k, z) => z;' + acct + ';window.__Account = Account;');
  return w;
}
let f = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) f++; };
let w = run({});
let a = w.document.querySelector('#td-account-slot a.tdauth');
ok(a && a.getAttribute('href') === '/account/auth.html?mode=register', 'guest: site shows 注册/登录 → ' + (a && a.getAttribute('href')));
w.TDAccount.register({ email: 'x@y.com', name: 'X' });
let av = w.document.querySelector('#td-account-slot .avatar');
ok(!!av, 'after register (same page): onChange re-renders slot to avatar');
av.click(); let m = w.document.querySelector('.tda-menu:not([hidden])');
ok(m && /进入控制台/.test(m.textContent) && /退出登录/.test(m.textContent), 'avatar click opens shared menu (site context)');
ok(!/回到官网/.test(m.textContent), 'site context hides 回到官网');
av.click(); ok(!w.document.querySelector('.tda-menu:not([hidden])'), 'second click closes');
av.classList.add('lt'); av.click(); m = w.document.querySelector('.tda-menu:not([hidden])'); ok(m.getAttribute('data-theme') === 'light', 'avatar .lt → light menu');
w.TDAccount.setLang('en'); av = w.document.querySelector('#td-account-slot .avatar'); av.click(); m = w.document.querySelector('.tda-menu:not([hidden])');
ok(m && /Open dashboard/.test(m.textContent), 'lang en re-renders, re-created avatar still opens menu');
ok(w.document.querySelectorAll('.tda-menu').length === 1, 'no leaked menus: ' + w.document.querySelectorAll('.tda-menu').length);
w.TDAccount.logout({ redirect: false });
ok(!!w.document.querySelector('#td-account-slot a.tdauth'), 'logout → slot back to 注册/登录');
console.log(f ? f + ' FAILED' : 'ALL PASS');
