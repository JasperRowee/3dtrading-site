// Shared jsdom loader for the r38 account tests. BASE = preview origin (default http://127.0.0.1:8978).
// jsdom lives in a scratch folder: NODE_PATH=/tmp/r38-tests/node_modules node <test>.js
const { JSDOM, VirtualConsole, ResourceLoader } = require('jsdom');
const BASE = process.env.BASE || 'http://127.0.0.1:8978';
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; return c; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const IGN = /navigation|scrollTo|scrollIntoView|showModal|Could not parse CSS|not implemented/i;
async function load(path, opt = {}) {
  const w0 = opt.width || 1280, store = opt.store || {}, vc = new VirtualConsole(), errs = [];
  vc.on('jsdomError', e => { if (!IGN.test(e.message)) errs.push(e.message.slice(0, 200)); });
  vc.on('error', e => errs.push(String(e).slice(0, 200)));
  const dom = await JSDOM.fromURL(BASE + path, { runScripts: 'dangerously', resources: opt.resources || 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(win) {
      for (const k in store) win.localStorage.setItem(k, store[k]);
      for (const k in (opt.session || {})) win.sessionStorage.setItem(k, opt.session[k]);
      win.innerWidth = w0;
      win.matchMedia = q => { const mx = /max-width:\s*(\d+)px/.exec(q), mn = /min-width:\s*(\d+)px/.exec(q); return { matches: mx ? w0 <= +mx[1] : mn ? w0 >= +mn[1] : false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }; };
      win.scrollTo = () => {}; win.Element.prototype.scrollIntoView = function () {};
      win.HTMLCanvasElement.prototype.getContext = function () { const mk = () => new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : mk(), apply: () => mk(), set: () => true }); return mk(); };
      win.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }; win.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      win.document.execCommand = () => true;
    } });
  await Promise.race([new Promise(r => dom.window.addEventListener('load', r)), sleep(8000)]);
  await sleep(opt.settle == null ? 400 : opt.settle);
  const w = dom.window, d = w.document;
  return { dom, w, d, errs, $: s => d.querySelector(s), $$: s => [...d.querySelectorAll(s)],
    dump() { const o = {}; for (const st of [w.localStorage, w.sessionStorage]) for (let i = 0; i < st.length; i++) o[st.key(i)] = st.getItem(st.key(i)); return JSON.stringify(o); },
    store() { const o = {}, ls = w.localStorage; for (let i = 0; i < ls.length; i++) o[ls.key(i)] = ls.getItem(ls.key(i)); return o; },
    click(el) { if (typeof el === 'string') el = d.querySelector(el); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); },
    submit(el) { if (typeof el === 'string') el = d.querySelector(el); el.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); },
    close() { w.close(); } };
}
// A signed-in demo user with agreed onboarding and the given accounts.
function seed(email, list, extra = {}) {
  const s = { '3dt.session': JSON.stringify({ v: 1, demo: true, email, name: 'QA', since: 1 }),
    ['3dt.accounts:' + email]: JSON.stringify({ list, active: list[0] ? list[0].id : 'all' }),
    ['3dt.onboarding:' + email]: JSON.stringify({ agreed: true, size: 'm', risk: 'mid' }) };
  return Object.assign(s, extra);
}
const K64 = n => ('Ab' + n + 'Z9').repeat(40).slice(0, 64);
const CJK = /[一-鿿]/;
function done() { console.log(fails ? `\n${fails} FAILED` : '\nALL PASS'); process.exit(fails ? 1 : 0); }
module.exports = { JSDOM, VirtualConsole, ResourceLoader, BASE, ok, sleep, load, seed, K64, CJK, done, get fails() { return fails; } };
