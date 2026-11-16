// r38 static checks on the account pages (no server needed):
// no Secret input, no hard-coded IPs or permission lists in pages (they come from TDApi.getBindKit),
// no Binance logo images, every page call goes through TDApi (no fetch/XHR outside api-adapter.js),
// no key-shaped strings, versioned script links, the 3 pages load api-adapter.js.
// node account/_test/static.js
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '..');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const read = f => fs.readFileSync(path.join(DIR, f), 'utf8');
const PAGES = ['auth.html', 'onboard.html', 'bind.html', 'connect.html'];
const SRC = PAGES.concat(['td-account.js', 'bind-bn.js', 'bind-steps.js', 'phone.html']);
const IP = /(?<![\d.])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?![\d.])/g;
const DOC_IP = /^(192\.0\.2|198\.51\.100|203\.0\.113)\./;
const strip = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');

// 1 no binance logo assets anywhere in account/
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.name === '_test' || e.name === 'img' ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(DIR).map(f => path.relative(DIR, f));
ok(!fs.existsSync(path.join(DIR, 'assets/binance')), 'assets/binance/ removed');
ok(!files.some(f => /binance.*\.(png|jpe?g|svg|webp|gif)$/i.test(f)), 'no Binance image files: ' + files.filter(f => /binance.*\.(png|jpe?g|svg|webp|gif)$/i.test(f)).join(','));
for (const f of SRC.concat(['bind-bn.css', 'page.css', 'day.css', 'td-account.css'])) {
  const s = read(f);
  ok(!/binance[-_]?(logo|mark)|assets\/binance|bnMark|bn-mark/i.test(s), f + ': no Binance logo reference');
}

for (const f of SRC) {
  const raw = read(f), s = strip(raw);
  // 2 Secret input
  // r41: connect.html is the one page that asks for the Secret (Jasper's request); e2e.js proves it is wiped and never stored
  if (f === 'connect.html') ok(/id="sec"[^>]*type="password"|type="password"[^>]*id="sec"/.test(raw) && /wipe/.test(read('connect.js')), f + ': Secret input is masked and wiped by connect.js');
  else ok(!/<input[^>]*secret/i.test(raw) && !/data-f="sec"|name="[^"]*secret/i.test(raw) && !/'bind\.f(Sec|Secret)/.test(raw), f + ': no Secret input');
  // 3 IPs
  const ips = [...s.matchAll(IP)].map(m => m[0]).filter(ip => !/^(127|0)\./.test(ip) && ip.split('.').every(x => +x <= 255));
  const real = ips.filter(ip => !DOC_IP.test(ip));
  ok(real.length === 0, f + ': no real IP addresses' + (real.length ? ' → ' + real.join(', ') : ''));
  ok(ips.filter(ip => DOC_IP.test(ip)).length === 0, f + ': no hard-coded IPs at all (even example ranges) — they come from getBindKit');
  // 4 key-shaped strings
  const keyish = (s.match(/(?<![A-Za-z0-9+/_-])[A-Za-z0-9]{40,}(?![A-Za-z0-9])/g) || []).filter(m => !/^[0-9a-f]+$/.test(m) && !/^[A-Za-z]+$/.test(m));
  ok(keyish.length === 0, f + ': no key-shaped strings' + (keyish.length ? ' → ' + keyish[0].slice(0, 12) + '…' : ''));
  // 5 no backend calls outside the adapter
  ok(!/\bfetch\s*\(|XMLHttpRequest|new WebSocket|sendBeacon/.test(s), f + ': no direct network calls (TDApi only)');
}
// 6 permission lists live in the adapter only
const PERM_WORDS = /(允许现货|允许合约|Enable Spot|Enable Futures|Enable Withdrawals|允许提现|Permits Universal Transfer|允许万向划转)/;
for (const f of PAGES.concat(['bind-steps.js'])) {
  const s = strip(read(f)).replace(/'bind\.[^']+':\s*'[^']*'/g, m => /Withdraw|提现/.test(m) && /how|e\.|fail|s3p|why/i.test(m) ? '' : m);
  const hit = s.match(new RegExp(PERM_WORDS.source, 'g')) || [];
  ok(hit.length === 0, f + ': no hard-coded permission list' + (hit.length ? ' → ' + [...new Set(hit)].join(', ') : ''));
}
ok(/getBindKit/.test(read('bind.html')) && /ips/.test(read('api-adapter.js')) && /perms/.test(read('api-adapter.js')), 'bind.html reads IPs/permissions from TDApi.getBindKit');
const bs = read('bind-steps.js');
ok(!/\bips\b|\bperms\b|ipsConfirmed|permsConfirmed/.test(strip(bs)), 'bind-steps.js no longer carries IP / permission settings');
// 7 every page loads td-account with the r45b cache tag (td-account changed in r45b: binding entries open connect.html) and api-adapter with r43 (unchanged since r43), and calls TDApi
for (const f of PAGES) {
  const s = read(f);
  ok(/td-account\.js\?v=r45b/.test(s) && /api-adapter\.js\?v=r43/.test(s), f + ': loads td-account ?v=r45b + api-adapter ?v=r43');
  ok(/TDApi|API\s*=\s*TDApi/.test(s + (f === 'connect.html' ? read('connect.js') : '')), f + ': calls TDApi');
  ok(/name="robots" content="noindex"/.test(s), f + ': noindex');
}
// 8 page code does not write accounts/sessions directly (bind/onboard go through TDApi)
for (const f of ['bind.html', 'onboard.html']) {
  const s = strip(read(f).split('<script>').slice(1).join('<script>'));
  const direct = s.match(/\bA\.(register|login|upsertAccount|removeAccount|verify)\s*\(|localStorage\.setItem|sessionStorage\.setItem/g) || [];
  ok(direct.length === 0, f + ': no direct storage / account writes' + (direct.length ? ' → ' + direct.join(', ') : ''));
}
// 9 source notes
for (const f of ['connect.js', 'connect.html', 'bind-bn.js']) ok(!/只显示一次|只显示这一次|只在创建时显示|shown only once|Shown once|only this once/.test(read(f)), f + ': no unverified "Secret shown only once" claim');
const md = read('BINANCE-SOURCES.md');
ok(!/47\.\d+\.\d+\.\d+/.test(md) && !/secret-0000|Secret 只显示一次/.test(md) && /示意/.test(md) && /getConnectKit/.test(md) && /submitSelfGeneratedKey[^\n]*新增/.test(md), 'BINANCE-SOURCES.md: no real IP / Secret, 自行生成 marked 示意, connect kit from getConnectKit, submitSelfGeneratedKey marked as new');
console.log(fails ? `\n${fails} FAILED` : '\nALL PASS'); process.exit(fails ? 1 : 0);
// r45b · every binding entry opens connect.html (system-generated keys only); bind.html (self-generated) is no longer linked
{
  const ta = read('td-account.js'), app = fs.readFileSync(path.join(__dirname, '..', '..', 'app', 'index.html'), 'utf8');
  ok(!/esc\(ROUTES\.bind/.test(ta) && (ta.match(/esc\(ROUTES\.connect\)/g) || []).length >= 2, 'r45b: account menu 绑定第一个账户 / 绑定新账户 → connect.html');
  ok(/const bindUrl = \(\) => TDAccount\.routes\.connect/.test(app), 'r45b: dashboard 添加 / 重新校验 links → connect.html');
}
