// r42: auth.html follows the WEBSITE theme ('3dt.theme.site', default night); onboard / bind / connect follow the
// DASHBOARD theme ('3dt.theme.app', default day). Each page never writes the other key; loading never writes its own.
// Also: auth has no header bar (logo + day/night toggle float), returning users get login, connect has the toggle.
const { ok, sleep, load, seed, done } = require('./lib');
(async () => {
  const list = [{ id: 'a1', name: 'QA-1', uid: '12345678', status: 'awaiting_key', at: 2 }, { id: 'a2', name: 'QA-2', uid: '22345678', status: 'observing', at: 3 }];
  for (const [label, th, expect] of [['default', undefined, 'day'], ['night', 'night', 'night'], ['day', 'day', 'day'], ['junk', 'sunny', 'day']]) {
    for (const width of [1280, 390]) {
      for (const path of ['/account/auth.html?mode=login', '/account/onboard.html', '/account/bind.html']) { // r46: connect.html has no day/night (own block below)
        const pg = path.split('?')[0].split('/').pop(), tag = `${pg} ${label} ${width}`;
        const isAuth = path.includes('auth'), own = isAuth ? '3dt.theme.site' : '3dt.theme.app', other = isAuth ? '3dt.theme.app' : '3dt.theme.site';
        const want = isAuth && (label === 'default' || label === 'junk') ? 'night' : expect; // auth defaults to the website's night
        const st = isAuth ? {} : seed('qa@example.com', list); if (th) st[own] = th; st[other] = want === 'day' ? 'night' : 'day'; // the other key set to the opposite: must not leak
        const p = await load(path, { store: st, width, settle: 500 });
        ok(p.d.documentElement.dataset.theme === want, `${tag} → html[data-theme=${want}]`);
        ok(p.$('meta[name=theme-color]').content === (want === 'day' ? (/auth\.html/.test(path) ? '#eef8fc' : '#ffffff') : '#06090b'), `${tag} theme-color`);
        ok(p.$('#lang') && p.$('#lang').getAttribute('data-theme') === (want === 'day' ? 'light' : 'dark'), `${tag} language toggle theme`);
        ok(isAuth ? !!p.$('.top .lg-n') && !!p.$('.top .lg-d') && !p.$('.bar') : !!p.$('.bar .lg-n') && !!p.$('.bar .lg-d'), `${tag} has both logos (CSS picks one)` + (isAuth ? ', no header bar' : ''));
        if (isAuth) ok(!!p.$('#thm.tdt-tm') && p.$('#thm').getAttribute('aria-pressed') !== null, `${tag} day/night toggle mounted`);
        ok(p.w.localStorage.getItem(own) === (th || null), `${tag} never writes ${own} on load`);
        ok(p.w.localStorage.getItem(other) === (want === 'day' ? 'night' : 'day'), `${tag} leaves ${other} alone`);
        ok(p.errs.length === 0, `${tag} no script errors` + (p.errs.length ? ' ' + p.errs[0] : ''));
        if (pg !== 'auth.html' && width === 1280) {
          p.click('#av'); await sleep(30);
          const m = p.$('.tda-menu:not([hidden])');
          ok(m && m.getAttribute('data-theme') === (want === 'day' ? 'light' : 'dark'), `${tag} avatar menu theme`);
        }
        if (pg === 'bind.html' && label === 'day' && width === 1280) {
          p.w.localStorage.setItem('3dt.theme.site', 'day');
          p.w.dispatchEvent(new p.w.StorageEvent('storage', { key: '3dt.theme.site', newValue: 'day' }));
          await sleep(30);
          ok(p.d.documentElement.dataset.theme === 'day', 'a website theme change does not touch bind');
          p.w.localStorage.setItem('3dt.theme.app', 'night');
          p.w.dispatchEvent(new p.w.StorageEvent('storage', { key: '3dt.theme.app', newValue: 'night' }));
          await sleep(30);
          ok(p.d.documentElement.dataset.theme === 'night' && p.$('meta[name=theme-color]').content === '#06090b', 'storage event from the dashboard flips bind to night');
          // the security page exists in both themes and keeps its red look via its own class
          ok(!!p.$('#secOv.sec-ov') && !!p.$('#secOv .sec-badge'), 'security page markup present');
        }
      }
    }
  }
  // r46 · connect.html is ONE Binance-style screen: always dark, no day/night toggle, never writes a theme key, logo goes to the dashboard
  for (const th of [undefined, 'day', 'night']) for (const width of [1280, 390]) {
    const st = seed('qa@example.com', list); if (th) st['3dt.theme.app'] = th;
    const p = await load('/account/connect.html', { store: st, width, settle: 500 }), tag = `connect r46 app=${th} ${width}`;
    ok(p.d.documentElement.dataset.theme === 'night' && p.$('meta[name=theme-color]').content === '#181a20', tag + ' always the dark Binance palette');
    ok(!p.$('#thm') && !p.$('.tdt-tm') && !p.$('.bar') && p.$$('header').length === 1, tag + ' one bar, no day/night toggle, no white outer nav');
    ok(/\/app\//.test(p.$('#logo').href), tag + ' logo goes to the dashboard: ' + p.$('#logo').href);
    ok(!!p.$('#hic [data-t="av"]') && !!p.$('#hic #lg'), tag + ' icons from 我的 rightwards + language switch');
    p.w.localStorage.setItem('3dt.theme.app', 'day'); p.w.dispatchEvent(new p.w.StorageEvent('storage', { key: '3dt.theme.app', newValue: 'day' })); p.w.dispatchEvent(new p.w.Event('td:theme')); await sleep(30);
    ok(p.d.documentElement.dataset.theme === 'night', tag + ' a dashboard day switch does not reach it');
    ok(p.w.localStorage.getItem('3dt.theme.bnbind') === null, tag + ' writes no theme key');
    ok(p.errs.length === 0, tag + ' no script errors' + (p.errs.length ? ' ' + p.errs[0] : ''));
    if (p.close) p.close();
  }
  // r42 · auth ↔ website sync: a website storage event flips auth; a dashboard one does not; the toggle writes the site key only
  {
    const p = await load('/account/auth.html', { store: {}, settle: 400 });
    ok(p.d.documentElement.dataset.theme === 'night', 'auth fresh visitor → night (website default)');
    p.w.localStorage.setItem('3dt.theme.app', 'day'); p.w.dispatchEvent(new p.w.StorageEvent('storage', { key: '3dt.theme.app', newValue: 'day' })); await sleep(30);
    ok(p.d.documentElement.dataset.theme === 'night', 'a dashboard theme change does not touch auth');
    p.w.localStorage.setItem('3dt.theme.site', 'day'); p.w.dispatchEvent(new p.w.StorageEvent('storage', { key: '3dt.theme.site', newValue: 'day' })); await sleep(60);
    ok(p.d.documentElement.dataset.theme === 'day', 'a website theme change (other tab) flips auth to day');
    p.click('#thm'); await sleep(60);
    ok(p.d.documentElement.dataset.theme === 'night' && p.w.localStorage.getItem('3dt.theme.site') === 'night' && p.w.localStorage.getItem('3dt.theme.app') === 'day', 'auth toggle → night, writes 3dt.theme.site only');
    ok(p.errs.length === 0, 'auth sync no JS errors ' + p.errs.join(' | '));
  }
  // r42 · returning users: generic entry → register on a first visit, login after a logout; ?mode=register still wins
  {
    const tab = p => p.$('[role=tab][aria-selected=true]').id;
    let p = await load('/account/auth.html', { store: {}, settle: 300 });
    ok(!!p.w.TDAccount.routes.entry && !/mode=/.test(p.w.TDAccount.routes.entry), 'routes.entry is the generic auth page: ' + p.w.TDAccount.routes.entry);
    ok(!p.w.TDAccount.returning() && tab(p) === 't-register', 'first visit, generic entry → register: ' + tab(p));
    p = await load('/account/auth.html', { store: { '3dt.returning': '1' }, settle: 300 });
    ok(p.w.TDAccount.returning() && tab(p) === 't-login', 'after a logout, generic entry → login: ' + tab(p));
    p = await load('/account/auth.html?mode=register', { store: { '3dt.returning': '1' }, settle: 300 });
    ok(tab(p) === 't-register', 'returning user can still open register explicitly');
    p.click('#t-register'); await sleep(30);
    const q = await load('/account/bind.html', { store: seed('qa@example.com', list), settle: 300 });
    q.w.TDAccount.logout(); await sleep(30);
    const all = Object.keys(q.w.localStorage).map(k => k + '=' + q.w.localStorage.getItem(k)).join(' ');
    ok(q.w.localStorage.getItem('3dt.returning') === '1' && !/password|secret|pwd/i.test(all), 'logout sets 3dt.returning=1 and stores no password / secret');
  }
  // r45 · connect page: one screen — Binance replica + demo cursor + one short hint; three big steps; Secret masked; never a page scroll
  {
    const p = await load('/account/connect.html', { store: seed('qa@example.com', list), settle: 700 });
    ok(!!p.$('main.stage#stage #bn') && !!p.$('#cur') && !!p.$('#hint') && !!p.$('#stage .tag') && !p.$('.coach') && !p.$('#next'), 'connect: stage + demo cursor + short hint (演示 tag), no guide card / 下一步');
    ok(!p.$('#stage').hasAttribute('aria-hidden') && p.$$('.hot[tabindex="0"]').length === 1, 'connect: Binance screen is reachable (not aria-hidden), one focusable lit control');
    ok(p.$$('#big li').length === 3 && p.$$('#big li.on').length === 1, 'connect: progress shows the three big steps, exactly one current');
    ok(p.$('#sec').type === 'password' && !!p.$('#res[hidden]') && !!p.$('.safe'), 'connect: Secret masked, no result until submit, demo notice present');
    ok(p.errs.length === 0, 'connect structure no JS errors ' + p.errs.join(' | '));
  }
  // legacy shared key → website key only, then removed; dashboard / account pages stay on their own default (day)
  for (const old of ['day', 'night']) {
    const p = await load('/account/bind.html', { store: Object.assign(seed('qa@example.com', list), { '3dt.theme': old }), settle: 300 });
    ok(p.w.localStorage.getItem('3dt.theme') === null && p.w.localStorage.getItem('3dt.theme.site') === old && p.w.localStorage.getItem('3dt.theme.app') === null && p.d.documentElement.dataset.theme === 'day',
      `legacy 3dt.theme=${old} → 3dt.theme.site=${old}, removed, app untouched, page day`);
  }
  // language round-trip on each page
  for (const path of ['/account/auth.html?mode=register', '/account/onboard.html', '/account/bind.html', '/account/connect.html']) {
    const p = await load(path, { store: seed('qa@example.com', list), settle: 500 });
    const pg = path.split('?')[0].split('/').pop();
    p.w.TDAccount.setLang('en'); await sleep(300);
    ok(p.d.documentElement.lang === 'en' && !/[一-鿿]/.test(p.$('main').textContent.replace(/中文/g, '')), `${pg}: en main text has no Chinese` + ((p.$('main').textContent.match(/.{0,20}[一-鿿]+.{0,10}/) || [''])[0]));
    p.w.TDAccount.setLang('zh'); await sleep(300);
    ok(p.d.documentElement.lang.startsWith('zh'), `${pg}: back to zh`);
    ok(p.errs.length === 0, `${pg}: no JS errors ` + p.errs.join(' | '));
  }
  done();
})().catch(e => { console.error(e); process.exit(2); });
