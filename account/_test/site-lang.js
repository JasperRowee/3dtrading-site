const { JSDOM } = require('jsdom'); const fs = require('fs');
const site = fs.readFileSync(process.argv[2], 'utf8');
if (!site.includes('const Account = (() => {')) { console.log('N/A: this site build has no embedded Account block / avatar template (the site owns its own account entry now); nothing to check.'); process.exit(0); }
const a0=site.indexOf('const I18nUI = (() => {'); const blk = site.slice(a0, site.indexOf('const Account = (() => {', a0));
const tpl = site.match(/<template id="tdAvatar">[\s\S]*?<\/template>/)[0];
const dom = new JSDOM(`<!doctype html><html lang="zh-CN"><body><button id="tdLang"></button><div id="td-account-slot"></div>${tpl}</body></html>`, { url: 'http://127.0.0.1:8978/site/index.html', runScripts: 'outside-only', pretendToBeVisual: true });
const w=dom.window; let n=0; w.addEventListener('3dt:lang',()=>n++);
w.eval(fs.readFileSync(process.argv[3],'utf8'));
try { w.eval('var LANG="zh", I18N={}, T=(k,z)=>z, _T=T; var Loop={refresh(){}},Story={build(){}},SafeFlow={draw(){}},Tradeoff={paint(){}},Account={render(){}},__v15={reveal(){}};'+blk+';window.__I=I18nUI;'); } catch(e){ console.log('EVAL ERR', e.message); }
let f=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)f++;};
w.TDAccount.setLang('en'); ok(w.LANG==='en', 'module→site: site LANG='+w.LANG); ok(n<5,'no event loop ('+n+' 3dt:lang)');
n=0; w.__I.set('zh'); ok(w.TDAccount.lang()==='zh','site→module: module lang='+w.TDAccount.lang()); ok(n<5,'no loop ('+n+')');
ok(w.localStorage.getItem('3dt.lang')==='zh','shared key 3dt.lang=zh');
console.log(f?f+' FAILED':'ALL PASS');
