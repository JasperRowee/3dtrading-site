/* r38 night-theme readability check in real headless Chrome (puppeteer-core + the installed Google Chrome).
   puppeteer-core is NOT installed in this repo: install it in a scratch folder and point NODE_PATH there.
   Usage: NODE_PATH=/path/to/scratch/node_modules node app/_test/night.mjs [base-url] [--dump]
   Exports run(ok) so run.mjs can include these checks. Only loads the local preview server. */
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(join(process.env.NODE_PATH || '.', 'x.js'));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* in-page: every visible text node's colour against the first opaque background behind it (rough, like getComputedStyle by eye) */
function lowContrast(min) {
  const rgb = s => { const m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const mix = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  function bgOf(el) {
    const stack = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && /gradient/.test(cs.backgroundImage)) { const c = rgb(cs.backgroundImage.match(/rgba?\([^)]+\)/)?.[0]); if (c) { stack.push({ ...c, a: 1 }); break; } }
      const c = rgb(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= .95) break; }
    }
    let b = { r: 255, g: 255, b: 255, a: 1 };
    const root = rgb(getComputedStyle(document.body).backgroundColor); if (root && root.a > 0) b = { ...root, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) b = mix(stack[i], b);
    return b;
  }
  const bad = [], seen = new Set();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    if (el.closest('script,style,[hidden],[aria-hidden="true"] noscript')) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    let hidden = false; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || +s.opacity === 0) { hidden = true; break; } } if (hidden) continue;
    const isSvg = el instanceof SVGElement;
    const fg = rgb(isSvg ? cs.fill : cs.color); if (!fg) continue;
    const bg = bgOf(isSvg ? el.ownerSVGElement || el : el);
    const k = ratio(mix(fg, bg), bg);
    if (k < min) bad.push({ k: +k.toFixed(2), t: n.textContent.trim().slice(0, 24), sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''), fg: cs.color || cs.fill, bg: `rgb(${bg.r|0},${bg.g|0},${bg.b|0})` });
  }
  return bad;
}

export async function run(ok, base = 'http://127.0.0.1:8978/app/index.html', dump = false) {
  let puppeteer; try { puppeteer = require('puppeteer-core'); } catch (e) { ok(false, 'night checks: puppeteer-core not found on NODE_PATH'); return; }
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run', '--no-default-browser-check'] });
  try {
    const page = await browser.newPage();
    const net = [];
    await page.setRequestInterception(true);
    page.on('request', r => { const u = r.url(); if (!u.startsWith(new URL(base).origin + '/') && !u.startsWith('data:') || /\/api\//.test(u)) { net.push(u); r.abort(); } else r.continue(); });
    const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
    await page.setViewport({ width: 1280, height: 900 });
    /* day snapshot first: day must not change */
    await page.goto(base, { waitUntil: 'load' });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    const signIn = async () => {
      await page.goto(base + '#/dashboard', { waitUntil: 'load' }); await sleep(300);
      await page.click('#main [data-demologin]'); await sleep(400);
      await page.click('#main [data-adddemo]'); await sleep(700);
    };
    await signIn();
    const dayBg = await page.evaluate(() => [getComputedStyle(document.body).backgroundColor, document.documentElement.dataset.theme]);
    /* r44: day background has been pure white since Jasper restored it (r41); the r38 check for #f1f0ef was stale */
    ok(dayBg[1] === 'day' && dayBg[0] === 'rgb(255, 255, 255)', 'day theme: body background pure white #fff', dayBg.join(' '));

    await page.evaluate(() => localStorage.setItem('3dt.theme.app', 'night'));
    await page.reload({ waitUntil: 'load' }); await sleep(800);
    ok(await page.evaluate(() => document.documentElement.dataset.theme === 'night'), 'night: data-theme="night" after reload');
    const pages = ['dashboard', 'trades', 'wallet', 'ai', 'me', 'actions', 'notify'];
    for (const pg of pages) {
      await page.evaluate(h => { location.hash = h; }, '#/' + pg); await sleep(700);
      if (pg === 'dashboard') { await page.evaluate(() => { document.querySelectorAll('[data-plan-input], #planBar input').forEach(i => {}); }); }
      const bad = await page.evaluate(lowContrast, 4.5);
      if (dump) console.error(pg, JSON.stringify(bad, null, 1));
      ok(!bad.length, `night #/${pg}: every visible text ≥ 4.5:1`, bad.slice(0, 4).map(b => `${b.k} "${b.t}" ${b.sel}`).join(' | '));
    }
    /* named elements from the browser review */
    await page.evaluate(() => { location.hash = '#/dashboard'; }); await sleep(800);
    const named = await page.evaluate(() => {
      const lum = s => { const p = (/rgba?\(([^)]+)\)/.exec(s) || [0, '0,0,0'])[1].split(/[ ,]+/).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(p[0]) + .7152 * f(p[1]) + .0722 * f(p[2]); };
      const bgL = lum(getComputedStyle(document.body).backgroundColor);
      const logos = [...document.querySelectorAll('img[src*="3dtrading-logo"]')].filter(i => i.getBoundingClientRect().width > 0); const lf = logos.length ? logos.map(i => getComputedStyle(i).content).join(' ') : ''; const logoOk = logos.length && logos.every(i => /logo-white/.test(getComputedStyle(i).content));
      const pm = document.querySelector('.lg .pm'); const pmL = pm ? lum(getComputedStyle(pm).backgroundColor) : null;
      const yld = document.querySelector('#yld'); const yb = yld ? (getComputedStyle(yld).backgroundImage.match(/rgba?\([^)]+\)/) || [''])[0] : '';
      const grid = [...document.querySelectorAll('#curve line, #curve path')].filter(e => /grid|gl/.test(e.getAttribute('class') || '') || e.getAttribute('stroke-dasharray') == null && e.tagName === 'line');
      const gridStroke = grid.map(e => getComputedStyle(e).stroke).filter(s => s && s !== 'none');
      const brightGrid = gridStroke.filter(s => lum(s) > .5);
      const av = document.querySelector('.av-btn .av'); const avc = av ? [getComputedStyle(av).color, getComputedStyle(av).backgroundColor] : null; const avK = av ? (Math.max(lum(avc[0]), lum(avc[1])) + .05) / (Math.min(lum(avc[0]), lum(avc[1])) + .05) : 0; const avB = av ? (lum(avc[1]) + .05) / (bgL + .05) : 0;
      return { logoOk, avK, avB, pmL, yldL: yb ? lum(yb) : null, lf, bgL, gridN: gridStroke.length, bright: brightGrid.slice(0, 3), avc };
    });
    ok(named.logoOk, 'night: every visible 3dtrading logo uses the white version', named.lf);
    ok(named.pmL != null && named.pmL < .1, 'night: +/− expand buttons are dark, not white', named.pmL);
    ok(named.yldL != null && named.yldL < .1, 'night: 底层收益资产池 card is dark', named.yldL);
    ok(named.gridN > 0 && !named.bright.length, 'night: curve grid lines are not bright white', `${named.gridN} lines; bright: ${named.bright.join(',')}`);
    ok(named.avK >= 4.5 && named.avB > 1.2, 'night: avatar letter readable and tile stands out from the top bar', `text ${named.avK.toFixed(2)}:1, tile vs bg ${named.avB.toFixed(2)}:1`);
    ok(!errs.length, 'night: no script errors', errs.slice(0, 2).join(' | '));
    ok(!net.length, 'night: nothing loaded beyond the local preview', net.slice(0, 3).join(' '));
  } finally { await browser.close(); }
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] || '')) {
  let pass = 0, fail = 0; const out = [];
  const ok = (c, n, x) => { (c ? pass++ : fail++); out.push(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + String(x).replace(/\s+/g, ' ').slice(0, 220) : ''}`); };
  await run(ok, process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : undefined, process.argv.includes('--dump'));
  console.log(out.join('\n')); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
}
