// r46 (was r45) · login page: r43 night layout + sun (day) / moon (night) sky, r44 demo entry kept, day/night reveal. Static checks on auth.html / td-account.js / site, then jsdom runtime checks:
// the password-free 「进入演示」 entry, a single register entry, login/register fields intact, en has no Chinese,
// and TDAccount.reveal(): 480 ms, transitions off while it runs, colours applied inside the transition, reduced motion = instant.
// NODE_PATH=/tmp/r38-tests/node_modules BASE=http://127.0.0.1:8984 node auth-r45.js
const fs = require('fs'), path = require('path');
const { ok, sleep, load, CJK, done } = require('./lib');
const ROOT = path.resolve(__dirname, '../..'), read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
(async () => {
  // static
  const ta = read('account/td-account.js'), au = read('account/auth.html');
  ok(/var REVEAL_MS = 480\b/.test(ta), 'td-account: REVEAL_MS = 480');
  ok(/html\.tdt-vt,html\.tdt-vt \*\{transition:none!important\}/.test(ta), 'td-account: every CSS transition is off during the reveal (html.tdt-vt)');
  ok(/if \(rm \|\| document\.hidden \|\| !document\.startViewTransition\) \{ apply\(\); return Promise\.resolve\('instant'\); \}/.test(ta), 'td-account: reduced motion / hidden / no API → instant');
  for (const f of ['site/src.html', 'site/index.html']) ok(/td-account\.js\?v=r45b/.test(read(f)), f + ': loads td-account.js?v=r45b');
  // r46: login/register rolled back to the r44 layout; the background is redrawn (day = light field, no galaxy; night = full-screen nebula)
  ok(!/sky-r4[45]\.js|orb-r44/.test(au.replace(/<!--[\s\S]*?-->/g, '')) && /id="orb"/.test(au), 'auth r46: r44 page with its own background canvas (no r45 sun/moon sky script)');
  ok(/function nightSky\(/.test(au) && /function daySky\(/.test(au) && /galaxy: function \(\) \{ return null; \}/.test(au), 'auth r46: nightSky / daySky drawn, no galaxy band');
  ok(/prefers-reduced-motion: reduce/.test(au) && /visibilitychange/.test(au), 'auth r46: reduced motion = still frame, pauses when hidden');
  ok(!/id="swap"/.test(au) && !/id="dodo"/.test(au), 'auth r46: r44 layout (no r45 Dodo-in-hero / switch link)');
  ok((au.match(/id="demoGo"/g) || []).length === 1, 'auth: r44 password-free 进入演示 entry kept (one)');
  ok(!/银行级|bank-grade|加密存储|encrypted at rest|military|军工/i.test(au), 'auth: no unbuilt security claims');

  for (const [lang, width] of [['zh', 1280], ['en', 1280], ['zh', 390], ['en', 390]]) {
    const tag = `[auth ${lang} ${width}]`;
    const p = await load('/account/auth.html?mode=login', { store: { '3dt.lang': lang }, width });
    ok(!!p.$('#t-login') && !!p.$('#t-register') && p.$$('#tabs button').length === 2, tag + ' one tab pair (login / register)');
    ok(!!p.$('#email') && !!p.$('#pw') && !!p.$('#go'), tag + ' login fields present');
    ok(p.$$('.pts li').length === 3 && !!p.$('.hero h1') && !!p.$('.hero .lede'), tag + ' left column: title, one sentence, three notes');
    const btn = p.$('#demoGo');
    ok(!!btn && btn.type === 'button' && !btn.closest('form'), tag + ' 「进入演示」 button outside the form');
    if (lang === 'en') ok(!CJK.test(p.$('.wrap').textContent), tag + ' no Chinese on the page');
    else ok(btn && /进入演示/.test(btn.textContent), tag + ' button reads 进入演示');
    p.$('#pw').value = '';
    p.click(btn); await sleep(500);
    const s = p.w.TDAccount.session();
    ok(s && s.email === 'demo@3dtrading.local', tag + ' demo entry → signed in as the demo user with no password: ' + (s && s.email));
    ok(!/password|"pw"/i.test(p.dump()), tag + ' nothing password-like stored');
    ok(p.errs.length === 0, tag + ' no JS errors ' + p.errs.join(' | '));
    p.close();
  }
  // register mode still shows its fields and the tabs switch modes
  const p = await load('/account/auth.html?mode=register');
  ok(!p.$('#pw2').closest('[hidden]') && !p.$('#agree').closest('[hidden]'), 'register: repeat password + agreement visible');
  p.click('#t-login'); await sleep(50);
  ok(p.$('#tabs').dataset.mode === 'login' && !!p.$('#pw2').closest('[hidden]'), 'tab → login hides the register-only fields');
  ok(/\.tabs\[data-mode="register"\] \.ink\{transform:translateX\(100%\)\}/.test(au), 'r43 tab pill moves with the selected mode (data-mode)');

  // reveal(): 480 ms, transitions off during, colours applied inside the transition callback
  const w = p.w, de = w.document.documentElement; let cbRan = false, opts = null, during = null, applied = 0;
  w.document.startViewTransition = cb => { cb(); cbRan = true; during = de.classList.contains('tdt-vt'); return { ready: Promise.resolve(), finished: new Promise(r => setTimeout(r, 30)) }; };
  de.animate = (k, o) => { opts = o; return {}; };
  const r1 = await w.TDAccount.reveal(() => { applied++; }, { clientX: 100, clientY: 50 });
  ok(cbRan && applied === 1 && during === true, 'reveal: colours applied once inside the transition, html.tdt-vt on while it runs');
  ok(opts && opts.duration === 480 && opts.pseudoElement === '::view-transition-new(root)', 'reveal: clip animation 480 ms on the new snapshot: ' + (opts && opts.duration));
  ok(r1 === 'reveal' && !de.classList.contains('tdt-vt'), 'reveal: html.tdt-vt removed when it ends');
  ok(w.TDAccount.revealMs === 480, 'TDAccount.revealMs = 480');
  // reduced motion → instant, no transition
  let vtCalls = 0; w.document.startViewTransition = () => { vtCalls++; return {}; };
  w.matchMedia = q => ({ matches: /reduce/.test(q), addEventListener() {}, removeEventListener() {} });
  const r2 = await w.TDAccount.reveal(() => { applied++; }, null);
  ok(r2 === 'instant' && vtCalls === 0 && applied === 2, 'reveal: reduced motion → instant switch, no transition');
  done();
})();
