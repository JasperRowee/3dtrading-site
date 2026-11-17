/* 3dtrading · coded replica of Binance's web screens for creating a sub-account API key.
 * Built in HTML/CSS from the 2026.10.10 setup guide (real zh dark-mode screens) and Binance's public FAQs (see account/BINANCE-SOURCES.md).
 * r38: no Binance logo (plain text only), no Secret Key, no private key. The self-generated (Ed25519) screen is 「示意」:
 * it is not checked against a live Binance page. IPs, permissions and the public key come from cfg.kit (bind.html: TDApi.getBindKit; connect.html: TDApi.getConnectKit).
 * No screenshots, no network. Names, UIDs and keys are made-up examples (account "3dtrading"), never real ones.
 * cfg = { nameEx, labelEx, keyEx, kit: { publicKeyPem, fingerprint, ips:[...], perms:[{key,required,forbidden,zh,en}] } | null }
 * window.TD_BN.scenes[i] = { h, cap:{zh:{t,x},en:{t,x}}, html(lang, cfg) }; window.TD_BN.clips[i] = { html(lang, cfg) }.
 * In each scene, [data-t] marks what the cursor clicks and [data-focus] what the camera keeps in view.
 * r44: connect.html makes this replica the page itself — the guide marks one real click target per moment (a [data-t],
 * .bn-tr .more, .bn-newapi or .bn-edit) and the user clicks it in the replica to move on. */
(function (global) {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var W = {
    zh: {
      brand: '币安', acct: '3dtrading', uid: '1024 3366', homeH: ['7×24 小时交易', '一个账户，全球市场'], est: '您的总资产估值', estV: '0.00 USDT', pnl: '今日盈亏', pnlV: '+0.00 USDT', homeB: ['充值', '交易', '闪兑'], nav: ['一键买币', '行情', '交易', '合约', '理财', '广场', '机构服务', 'AI', '更多'], navDd: [0, 0, 1, 1, 1, 1, 1, 1, 1], dep: '充值',
      side: ['总览', '资产', '订单', '奖励中心', '邀请奖励', '账户', '子账户'], sideDd: [0, 1, 1, 0, 0, 1, 1],
      sub: ['账户管理', 'API管理', '资产管理', '订单管理', '资金流水', '登录历史', '交易数据'],
      menu: ['总览', '资产', '订单', '账户', '邀请奖励', '奖励中心', '子账户', '设置'], logout: '退出', sw: '切换子账户', tags: ['普通用户', '已认证'],
      crumb: '子账户', amTitle: '账号管理', apiTitle: 'API管理', deposit: '充值', transfer: '划转',
      fSub: '子账户', fAll: '所有', fSt: '状态', fAllSt: '全部状态', search: '搜索', reset: '重置', cnt: '子账户', create: '创建子账户',
      cols: ['邮箱', '用户 ID', '状态', '创建日期', '邮箱验证', '手机', '操作'], normal: '正常', freeze: '冻结',
      mTitle: '创建子账户', mType: '子账户类型', mTypeV: '虚拟邮箱创建', mName: '虚拟邮箱创建', mHint: '请输入字符串，我们将为您创建一个虚拟邮箱进行注册。', mNote: '注意：虚拟邮箱不能用于登录子账户。请使用主账户创建子账户API来管理子账户。', ok: '确认',
      dd1: ['转入', '允许合约', '启用期权', '删除'], dd2: ['转入', '开通统一账户', '允许合约', '启用期权', '删除'],
      stp: '自成交预防', createApi: '创建API', apiCnt: 'API',
      notes: ['1. 每个子账户最多可以创建30个 API Key。', '2. 请勿将您的API密钥或私钥透露给任何人，以免造成资产损失。', '3. 为提高您账户的安全性，建议仅授予可信IP访问权限。', '4. 请在创建API密钥前完成身份认证。'],
      apiCols: ['邮箱', '标签', '现货账户', '杠杆账户', '合约账户', 'IP 限制'],
      kTitle: '选择API密钥类型', k1: '系统生成', k1p: '使用HMAC对称加密方式运作。3dtrading 的绑定不用这一种。',
      k2: '自行生成', k2p: '使用Ed25519非对称加密方式运作。粘贴 3dtrading 给你的公钥，币安会生成 API 密钥。', next: '下一步',
      cTitle: '创建API', cSub: '子账户', cLabel: 'API 标签',
      qr: '扫码获取地址', lbl: '标签', pm: '统一账户', warn: '复制 API 密钥，贴回 3dtrading 的绑定页。', pub: '公钥:', pubPh: '粘贴 3dtrading 给你的公钥',
      key: 'API 密钥:', copy: '复制', perm: 'API权限:', edit: '编辑权限',
      ipT: 'IP访问限制', ipAny: '无限制(缺乏安全)', ipAnyW: '这个API密钥允许任何地址访问，不推荐。', ipOnly: '只访问受信任的IP(推荐)', ipPh: '输入多个IP地址时，请使用空格隔开。'
    },
    en: {
      brand: 'Binance', acct: '3dtrading', uid: '1024 3366', homeH: ['Trade 24/7', 'One account, every market'], est: 'Estimated Balance', estV: '0.00 USDT', pnl: "Today's PnL", pnlV: '+0.00 USDT', homeB: ['Deposit', 'Trade', 'Convert'], nav: ['Buy Crypto', 'Markets', 'Trade', 'Futures', 'Earn', 'Square', 'Institutional', 'AI', 'More'], navDd: [0, 0, 1, 1, 1, 1, 1, 1, 1], dep: 'Deposit',
      side: ['Dashboard', 'Assets', 'Orders', 'Rewards Hub', 'Referral', 'Account', 'Sub Accounts'], sideDd: [0, 1, 1, 0, 0, 1, 1],
      sub: ['Account Management', 'API Management', 'Asset Management', 'Order Management', 'Transaction History', 'Login History', 'Trading Data'],
      menu: ['Dashboard', 'Assets', 'Orders', 'Account', 'Referral', 'Rewards Hub', 'Sub Accounts', 'Settings'], logout: 'Log Out', sw: 'Switch Sub Account', tags: ['Regular User', 'Verified'],
      crumb: 'Sub Account', amTitle: 'Account Management', apiTitle: 'API Management', deposit: 'Deposit', transfer: 'Transfer',
      fSub: 'Sub Accounts', fAll: 'All', fSt: 'Status', fAllSt: 'All Status', search: 'Search', reset: 'Reset', cnt: 'Sub Account', create: 'Create Sub Account',
      cols: ['Email', 'User ID', 'Status', 'Date of creation', 'Email Verification', 'Phone Number', 'Action'], normal: 'Normal', freeze: 'Freeze',
      mTitle: 'Create Sub Account', mType: 'Sub-account type', mTypeV: 'Create with virtual email', mName: 'Create with virtual email', mHint: 'Enter a string and we will create a virtual email to register with.', mNote: 'Note: the sub-account can only be operated by the master account through API. Please create an API Key for the sub-account.', ok: 'Confirm',
      dd1: ['Transfer In', 'Enable Futures', 'Enable Options', 'Delete'], dd2: ['Transfer In', 'Enable Portfolio Margin', 'Enable Futures', 'Enable Options', 'Delete'],
      stp: 'Self-Trade Prevention', createApi: 'Create API', apiCnt: 'API',
      notes: ['1. Each subaccount can create up to 30 API Keys.', '2. Do not disclose your API Key or private key to anyone to avoid asset losses.', '3. It is recommended to restrict access to trusted IPs only to increase your account security.', '4. Please complete KYC before creating an API Key.'],
      apiCols: ['Email', 'Label', 'Spot', 'Margin', 'Futures', 'IP restriction'],
      kTitle: 'Choose API Key type', k1: 'System generated', k1p: 'Works using HMAC symmetric encryption. 3dtrading binding does not use this type.',
      k2: 'Self-generated', k2p: 'Works using Ed25519 asymmetric encryption. Paste the public key 3dtrading gives you and Binance creates the API Key.', next: 'Next',
      cTitle: 'Create API', cSub: 'Sub Account', cLabel: 'API Label',
      qr: 'Scan to get address', lbl: 'Label', pm: 'Portfolio Margin', warn: 'Copy the API Key and paste it back on the 3dtrading binding page.', pub: 'Public key', pubPh: 'Paste the public key from 3dtrading',
      key: 'API Key', copy: 'Copy', perm: 'API restrictions:', edit: 'Edit restrictions',
      ipT: 'IP access restrictions:', ipAny: 'Unrestricted (Less Secure)', ipAnyW: 'This API Key allows access from any IP address. This is not recommended.', ipOnly: 'Restrict access to trusted IPs only (Recommended)', ipPh: 'When entering more than one IP address, separate them with spaces.'
    }
  };

  var I = {
    // r38: no Binance logo image or drawn mark — plain text only
    word: '<b class="bn-wordt">Binance</b>',
    dd: '<svg class="dd" viewBox="0 0 10 10"><path d="M2.5 3.8 5 6.3l2.5-2.5"/></svg>',
    up: '<svg class="dd" viewBox="0 0 10 10"><path d="M2.5 6.2 5 3.7l2.5 2.5"/></svg>',
    tri: '<svg class="tri" viewBox="0 0 10 10"><path d="M2.5 3.8h5L5 6.6z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.2c1.4-2 3.3-3 5.5-3s4.1 1 5.5 3"/></svg>',
    wallet: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M15 12h5.5"/></svg>',
    msg: '<svg viewBox="0 0 24 24"><path d="M4.5 5.5h15v10h-8l-4 3v-3h-3z"/><path d="M8.5 10.5h7"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><rect x="4.5" y="4.5" width="15" height="15" rx="2"/><path d="M12 8v7M9 12l3 3 3-3"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M12 5v10M8 11l4 4 4-4M6 19h12"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M3 12s3.4-5.5 9-5.5 9 5.5 9 5.5-3.4 5.5-9 5.5S3 12 3 12z"/><path d="M4 20 20 4"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/></svg>',
    side: [
      '<svg viewBox="0 0 24 24"><path d="M4.5 11 12 4.5l7.5 6.5v8.5h-15z"/><path d="M10 19.5v-5h4v5"/></svg>',
      '<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M3.5 9.5h17"/></svg>',
      '<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/></svg>',
      '<svg viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="11" rx="2"/><path d="M9 6.5v11M14.5 10h3"/></svg>',
      '<svg viewBox="0 0 24 24"><circle cx="10" cy="9" r="3.5"/><path d="M3.5 19c.8-3.4 3.3-5.2 6.5-5.2M17.5 13v6M14.5 16h6"/></svg>',
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.9-3.8 3.6-5.7 7-5.7s6.1 1.9 7 5.7"/></svg>',
      '<svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.3"/><path d="M3 19.5c.8-3.4 3.1-5.2 6-5.2s5.2 1.8 6 5.2M15.5 8h5M15.5 11.5h5M17 15h3.5"/></svg>'
    ],
    menu: [
      '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/></svg>',
      '<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M14.5 12h3"/></svg>',
      '<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/></svg>',
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.9-3.8 3.6-5.7 7-5.7s6.1 1.9 7 5.7"/></svg>',
      '<svg viewBox="0 0 24 24"><circle cx="10" cy="9" r="3.5"/><path d="M3.5 19c.8-3.4 3.3-5.2 6.5-5.2M17.5 13v6M14.5 16h6"/></svg>',
      '<svg viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="11" rx="2"/><path d="M9 6.5v11M14.5 10h3"/></svg>',
      '<svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.3"/><path d="M3 19.5c.8-3.4 3.1-5.2 6-5.2s5.2 1.8 6 5.2M15.5 8h5M15.5 11.5h5M17 15h3.5"/></svg>',
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.5M12 18v2.5M3.5 12H6M18 12h2.5M6 6l1.8 1.8M16.2 16.2 18 18M6 18l1.8-1.8M16.2 7.8 18 6"/></svg>'
    ],
    keyA: '<svg viewBox="0 0 48 48" class="kic"><circle cx="17" cy="18" r="11" fill="none" stroke="#5e6673" stroke-width="2" stroke-dasharray="3 3"/><circle cx="19" cy="21" r="8" fill="#F0B90B"/><path d="M24 26l12 12M31 33l3-3M34 36l3-3" stroke="#F0B90B" stroke-width="4" stroke-linecap="round"/><circle cx="19" cy="21" r="2.6" fill="#181a20"/></svg>',
    keyB: '<svg viewBox="0 0 48 48" class="kic"><circle cx="16" cy="18" r="9" fill="none" stroke="#b7bdc6" stroke-width="2.4"/><path d="M21 24l11 11M27 30l3-3" stroke="#b7bdc6" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="20" r="7.5" fill="#F0B90B"/><path d="M28 26l9 9M33 31l3-3" stroke="#F0B90B" stroke-width="3.6" stroke-linecap="round"/></svg>'
  };

  function nav(w, hot) {
    return '<div class="bn-top"><span class="bn-logo">' + (w === W.en ? I.word : '<b class="bn-wordt">' + esc(w.brand) + '</b>') + '</span>' +
      '<nav class="bn-nav">' + w.nav.map(function (n, i) { return '<span>' + esc(n) + (w.navDd[i] ? I.dd : '') + '</span>'; }).join('') + '</nav><i class="bn-sp"></i>' +
      '<span class="bn-ic">' + I.search + '</span><span class="bn-dep">' + I.down + esc(w.dep) + '</span>' +
      '<span class="bn-ic' + (hot ? '" data-t="av' : '') + '">' + I.user + '</span><span class="bn-ic">' + I.wallet + '</span><span class="bn-ic dotted">' + I.msg + '</span><span class="bn-ic">' + I.dl + '</span><span class="bn-ic">' + I.globe + '</span><span class="bn-ic">' + I.moon + '</span></div>';
  }
  function side(w, act) {
    var h = '<aside class="bn-side">';
    w.side.forEach(function (s, i) {
      var open = i === 6;
      h += '<div class="bn-si' + (open ? ' on' : '') + '">' + I.side[i] + '<span>' + esc(s) + '</span>' + (w.sideDd[i] ? (open ? I.up : I.dd) : '') + '</div>';
      if (open) w.sub.forEach(function (x, k) { h += '<div class="bn-ss' + (k === act ? ' act' : '') + '">' + esc(x) + '</div>'; });
    });
    return h + '</aside>';
  }
  function frame(w, act, body, extra) { return nav(w) + '<div class="bn-body">' + side(w, act) + '<main class="bn-main">' + body + '</main></div>' + (extra || ''); }
  function head(w, title, right) { return '<div class="bn-head"><div><small>' + esc(w.crumb) + '</small><h1>' + esc(title) + '</h1></div><div class="bn-hr">' + right + '</div></div>'; }
  function sel(ph, v, cls) { return '<div class="bn-sel ' + (cls || '') + '"><span class="ph">' + esc(ph) + '</span><span class="v">' + esc(v) + I.tri + '</span></div>'; }
  function filters(w, two) {
    return '<div class="bn-filt">' + sel(w.fSub, w.fAll, 'w1') + (two ? sel(w.fSt, w.fAllSt, 'w1') : '') + '<span class="bn-btn y">' + esc(w.search) + '</span><span class="bn-btn g">' + esc(w.reset) + '</span></div>';
  }
  function amPage(w, n, opt) {
    opt = opt || {};
    var row = '';
    if (n) {
      row = '<div class="bn-tr" data-focus>' +
        '<span class="c0">3dtusdt01_virtual@example.com</span><span class="c1">1024 3367</span><span class="c2 grn">' + esc(w.normal) + '</span><span class="c3">2026-11-11 10:00:00</span><span class="c4">-</span><span class="c5">-</span>' +
        '<span class="c6"><b>' + esc(w.freeze) + '</b><b>' + esc(w.deposit) + '</b><b>' + esc(w.transfer) + '</b><b class="more' + (opt.menu ? ' open' : '') + '">···</b>' + (opt.menu || '') + '</span></div>';
    }
    return head(w, w.amTitle, '<span class="bn-btn y lg">' + esc(w.deposit) + '</span><span class="bn-btn g lg">' + esc(w.transfer) + '</span>') + filters(w, true) +
      '<div class="bn-cnt"><span><u>' + esc(w.cnt) + '</u> (' + n + ')</span><span class="bn-btn g"' + (opt.hotCreate ? ' data-t="create" data-focus' : '') + '>+ ' + esc(w.create) + '</span></div>' +
      '<div class="bn-tbl"><div class="bn-th">' + w.cols.map(function (c, i) { return '<span class="c' + i + '">' + esc(c) + '</span>'; }).join('') + '</div>' + row + '</div>';
  }
  function apiPage(w) {
    return head(w, w.apiTitle, '<span class="bn-btn yd">' + esc(w.stp) + '</span><span class="bn-btn g bn-newapi">+ ' + esc(w.createApi) + '</span><span class="bn-mut">' + esc(w.apiCnt) + ' (0)</span>') +
      '<ol class="bn-notes">' + w.notes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      '<div class="bn-filt"><div class="bn-lab"><small>' + esc(w.fSub) + '</small>' + sel('', w.fAll, 'w2') + '</div><span class="bn-btn yd">' + esc(w.search) + '</span><span class="bn-btn g">' + esc(w.reset) + '</span></div>' +
      '<div class="bn-tbl api"><div class="bn-th">' + w.apiCols.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div></div>';
  }
  function modal(title, body, cls) { return '<div class="bn-dim"></div><div class="bn-modal ' + (cls || '') + '" data-focus><div class="bn-mh"><b>' + esc(title) + '</b>' + I.x + '</div>' + body + '</div>'; }
  function ddMenu(items, hot, grey) {
    return '<div class="bn-dd">' + items.map(function (x, i) { return '<span' + (i === hot ? ' data-t="dd"' : '') + (i === grey ? ' class="off"' : '') + '>' + esc(x) + '</span>'; }).join('') + '</div>';
  }
  function kitOf(cfg) { return (cfg && cfg.kit) || null; }
  function shortPub(cfg, w) { if (cfg && cfg.pubText) return cfg.pubText; var k = kitOf(cfg); return k ? k.fingerprint : (w === W.en ? 'shown after you apply' : '申请绑定后显示'); }
  function ipsOf(cfg) { var k = kitOf(cfg); return k && k.ips && k.ips.length ? k.ips : null; }
  function permsOf(cfg) { var k = kitOf(cfg); return k && k.perms ? k.perms : []; }
  /* r58 · keyPage parts: 'keys' (just created: only Reading on, the rest locked), 'ips' (editing: add the two IPs first — the
   * trading permissions stay locked), 'perm' (IPs in: permissions unlocked and ticked, then 保存), 'bind' (saved: the API Key
   * row is left EMPTY — the tutorial puts its own API Key field right there). The QR box is filled by tutorial.js with a code
   * for this page's own address (no caption). */
  var LOCK = '<svg class="lk" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.6"/><path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7"/></svg>';
  function keyPage(w, cfg, part) {
    var en = w.brand === 'Binance'; // r44: w is often a merged copy (gw / hw), so compare by value — the English permission grid was showing Chinese
    var open = part === 'perm' || part === 'bind', ipsIn = part === 'perm' || part === 'bind';
    var perms = permsOf(cfg).map(function (p) {
      var lock = !open && p.key !== 'read', on = p.key === 'read' || (open && p.required);
      return '<span class="bn-ck' + (on ? ' on' : '') + (lock ? ' lock' : '') + (open && p.key === 'prediction' ? ' no' : '') + '"' + (lock ? ' aria-disabled="true"' : '') + '><i></i><u>' + esc(en ? p.en : p.zh) + '</u>' + (lock ? LOCK : '') + '</span>';
    }).join('') || '<span class="bn-ck"><u>' + esc(en ? 'Permission list appears after you apply' : '申请绑定后显示权限清单') + '</u></span>';
    var ips = ipsOf(cfg) || [];
    return '<div class="bn-key">' +
      '<div class="bn-qr" data-slot="qr"><div class="q"></div></div>' +
      '<div class="bn-kd"><div class="bn-kl">' + esc(w.lbl) + '</div><div class="bn-tags"><span class="t1">Ed25519</span><span class="t2">' + esc(w.pm) + '</span><b>' + esc(cfg.labelEx) + '</b></div>' +
      '<div class="bn-warn">' + I.info + '<span>' + esc(w.warn) + '</span></div>' +
      '<div' + (part === 'bind' ? ' data-focus' : '') + '>' +
      '<div class="bn-kl">' + esc(w.pub) + '</div><div class="bn-kr"><span class="bn-kv">' + esc(shortPub(cfg, w)) + '</span></div>' +
      '<div class="bn-kl">' + esc(w.key) + '</div><div class="bn-kr' + (part === 'bind' ? ' slot' : '') + '" data-slot="key">' + (part === 'bind' ? '' : '<span class="bn-kv mute">' + esc(en ? 'Shown after saving' : '保存后显示') + '</span>') + '</div></div>' +
      '<div class="bn-perm"' + (part === 'perm' || part === 'ips' ? ' data-focus' : '') + '><div class="bn-kl bn-plh"><span>' + esc(w.perm) + '</span>' + (part === 'keys' ? '<span class="bn-edit">' + esc(w.edit) + '</span>' : '') + '</div><div class="bn-grid">' + perms + '</div>' +
      (open ? '' : '<p class="bn-lockn">' + LOCK + esc(en ? 'Trading permissions unlock once trusted IPs are added.' : '添加受信任的 IP 后，才能勾选交易权限。') + '</p>') +
      '<div class="bn-ipt">' + esc(w.ipT) + '</div>' +
      '<div class="bn-rad' + (part === 'keys' ? ' on' : '') + '"><i></i>' + esc(w.ipAny) + ' <em>' + esc(w.ipAnyW) + '</em></div>' +
      '<div class="bn-rad' + (part === 'keys' ? '' : ' on') + '"><i></i>' + esc(w.ipOnly) + '</div>' +
      (part === 'keys' ? '' : '<div class="bn-chips" data-slot="ips">' + (ipsIn ? ips.map(function (ip) { return '<span>' + esc(ip) + '<b>✕</b></span>'; }).join('') : '') + '</div>' +
      '<div class="bn-ipin"><span>' + (part === 'ips' ? '<code>' + esc(ips.join(' ')) + '</code>' : esc(w.ipPh)) + '</span><b' + (part === 'ips' ? ' data-t="ipok"' : '') + '>' + esc(w.ok) + '</b></div>') +
      (part === 'perm' ? '<div class="bn-sv"><span class="bn-btn y" data-t="save">' + esc(en ? 'Save' : '保存') + '</span><span class="bn-btn">' + esc(en ? 'Cancel' : '取消') + '</span></div>' : '') +
      '</div></div></div>';
  }

  /* r47: the home page's right column, as on Binance's own home: a market card (illustrative static figures, never live data) */
  function mkCard(w) {
    var M = w.mkH;
    return '<aside class="bn-mkc" aria-hidden="true"><div class="mt">' + M.tabs.map(function (x, i) { return '<span' + (i ? '' : ' class="on"') + '>' + esc(x) + '</span>'; }).join('') + '<em>' + esc(M.more) + ' ›</em></div>' +
      M.rows.map(function (r) { return '<div class="mr"><i class="c c' + r[0] + '">' + esc(r[0].charAt(0)) + '</i><b>' + esc(r[0]) + '</b><small>' + esc(r[1]) + '</small><span>' + esc(r[2]) + '</span><em class="' + (r[3].charAt(0) === '-' ? 'r' : 'g') + '">' + esc(r[3]) + '</em></div>'; }).join('') +
      '<div class="mt n"><span class="on">' + esc(M.news) + '</span><em>' + esc(M.more) + ' ›</em></div>' +
      M.nw.map(function (x) { return '<p class="nw">' + esc(x) + '</p>'; }).join('') + '</aside>';
  }
  var MKR = [['BTC', 'Bitcoin', '76,758.47', '-1.61%'], ['ETH', 'Ethereum', '2,431.06', '-0.84%'], ['BNB', 'BNB', '622.87', '-1.35%'], ['SOL', 'Solana', '142.30', '+0.92%'], ['XRP', 'XRP', '2.07', '+0.38%']];
  W.zh.mkH = { tabs: ['热门', '新币', '涨幅榜'], more: '查看全部', rows: MKR, news: '新闻', nw: ['币安将上线新的现货交易对', '币安理财推出限时活动', '关于系统升级的公告'] };
  W.en.mkH = { tabs: ['Popular', 'New Listing', 'Top Gainers'], more: 'View All', rows: MKR, news: 'News', nw: ['Binance will list new spot trading pairs', 'Binance Earn launches a limited-time offer', 'Notice on a scheduled system upgrade'] };

  var scenes = [
    // narrow: on phones this scene is drawn at Binance's own narrow-header width so the logo and the click both stay in frame
    { h: 640, narrow: 480, cap: {
        zh: { t: '打开子账户', x: '在电脑上登录币安主账户，点右上角头像，选「子账户」。' },
        en: { t: 'Open Sub Accounts', x: 'Log in to your main Binance account on a computer, click the avatar at the top right and choose Sub Accounts.' } },
      html: function (l) {
        var w = W[l];
        return nav(w, true) + '<div class="bn-hw"><div class="bn-home"><h2>' + esc(w.homeH[0]) + '</h2><h3>' + esc(w.homeH[1]) + '</h3>' +
          '<small>' + esc(w.est) + '</small><b class="bal">' + esc(w.estV) + '</b><small>' + esc(w.pnl) + ' <em>' + esc(w.pnlV) + '</em></small>' +
          '<div class="hb">' + w.homeB.map(function (x, i) { return '<b' + (i ? ' class="g"' : '') + '>' + esc(x) + '</b>'; }).join('') + '</div></div>' + mkCard(w) + '</div>' +
          '<div class="bn-um" data-focus><div class="bn-uh"><span class="ava"></span><div><b class="nm">' + esc(w.acct) + '</b><small>ID ' + esc(w.uid) + '</small></div></div><div class="bn-sw">⇆ ' + esc(w.sw) + '</div>' +
          '<div class="bn-ut"><span>' + esc(w.tags[0]) + '</span><span class="g">' + esc(w.tags[1]) + '</span></div>' +
          w.menu.map(function (m, i) { return '<div class="bn-ui"' + (i === 6 ? ' data-t="subacc"' : '') + '>' + I.menu[i] + esc(m) + '</div>'; }).join('') + '<div class="bn-ul">' + esc(w.logout) + '</div></div>';
      } },
    { h: 640, cap: {
        zh: { t: '创建子账户', x: '左侧「子账户 → 账户管理」，点右侧「+ 创建子账户」。' },
        en: { t: 'Create a sub-account', x: 'Under Sub Accounts → Account Management, click “+ Create Sub Account”.' } },
      html: function (l) { var w = W[l]; return frame(w, 0, amPage(w, 0, { hotCreate: true })); } },
    { h: 640, cap: {
        zh: { t: '虚拟邮箱创建', x: '类型选「虚拟邮箱创建」，输入名称（如 3dtUSDT01），点确认。' },
        en: { t: 'Use a virtual email', x: 'Choose “Create with virtual email”, enter a name such as 3dtUSDT01 and confirm.' } },
      html: function (l, cfg) {
        var w = W[l];
        return frame(w, 0, amPage(w, 0), modal(w.mTitle,
          '<div class="bn-f"><small>' + esc(w.mType) + '</small><div class="bn-in sel">' + esc(w.mTypeV) + I.tri + '</div></div>' +
          '<div class="bn-f"><small>' + esc(w.mName) + '</small><div class="bn-in focus" data-slot="name">' + esc(cfg.nameEx) + '<i class="caret"></i></div><p>' + esc(w.mHint) + '</p></div>' +
          '<p class="bn-mnote">' + esc(w.mNote) + '</p><span class="bn-btn y block" data-t="ok">' + esc(w.ok) + '</span>', 'tall'));
      } },
    { h: 640, cap: {
        zh: { t: '允许合约', x: '记下新子账户的用户 ID。点这一行最右侧「···」，选「允许合约」并确认。' },
        en: { t: 'Enable futures', x: 'Note the new sub-account’s User ID. Click “···” at the end of its row, choose Enable Futures and confirm.' } },
      html: function (l) { var w = W[l]; return frame(w, 0, amPage(w, 1, { menu: ddMenu(w.dd1, 1) })); } },
    { h: 640, cap: {
        zh: { t: '开通统一账户', x: '点右侧「···」开通「统一账户（Portfolio Margin）」。须先完成统一账户激活与合规资格确认，再创建 API。' },
        en: { t: 'Turn on Portfolio Margin', x: 'Click “···” and enable Portfolio Margin. Activate Portfolio Margin and confirm account eligibility before creating the API key.' } },
      html: function (l) { var w = W[l]; return frame(w, 0, amPage(w, 1, { menu: ddMenu(w.dd2, 1, 2) })); } },
    { h: 640, cap: {
        zh: { t: '选择「自行生成」（示意）', x: '左侧「API管理」→ 右上角「+ 创建API」，选「自行生成」，点下一步。' },
        en: { t: 'Choose “Self-generated” (illustration)', x: 'Open API Management, click “+ Create API”, choose Self-generated and click Next.' } },
      html: function (l) {
        var w = W[l];
        return frame(w, 1, apiPage(w), modal(w.kTitle,
          '<div class="bn-opt">' + I.keyA + '<div><b>' + esc(w.k1) + '</b><p>' + esc(w.k1p) + '</p></div></div>' +
          '<div class="bn-opt on">' + I.keyB + '<div><b>' + esc(w.k2) + '</b><p>' + esc(w.k2p) + '</p></div><i class="corner"></i></div>' +
          '<span class="bn-btn y block" data-t="next">' + esc(w.next) + '</span>', 'wide'));
      } },
    { h: 640, cap: {
        zh: { t: '选子账户、填标签', x: '选刚创建的子账户，API 标签填 3dtrading01，点下一步，再由你本人完成币安的安全验证。' },
        en: { t: 'Pick the sub-account and label', x: 'Pick the new sub-account, enter 3dtrading01 as the label, click Next, then pass Binance’s security check yourself.' } },
      html: function (l, cfg) {
        var w = W[l];
        return frame(w, 1, apiPage(w), modal(w.cTitle,
          '<div class="bn-f"><small>' + esc(w.cSub) + '</small><div class="bn-in sel">3dtusdt01_virtual@example.com' + I.tri + '</div></div>' +
          '<div class="bn-f"><small>' + esc(w.cLabel) + '</small><div class="bn-in" data-slot="label">' + esc(cfg.labelEx) + '</div></div>' +
          '<span class="bn-btn y block" data-t="next2">' + esc(w.next) + '</span>'));
      } },
    { h: 860, cap: {
        zh: { t: '粘贴公钥 → 复制 API Key（示意）', x: '粘贴 3dtrading 给你的公钥，币安生成 API Key 后点 Copy，贴回绑定页。没有任何 Secret 或私钥要复制。' },
        en: { t: 'Paste the public key → copy the API Key (illustration)', x: 'Paste the public key 3dtrading gave you; when Binance creates the API Key, click Copy and paste it back. There is no Secret or private key to copy.' } },
      html: function (l, cfg) { var w = W[l]; return frame(w, 1, head(w, w.apiTitle, '') + keyPage(w, cfg, 'keys')); } },
    { h: 930, cap: {
        zh: { t: '权限与 IP 白名单', x: '按绑定页给出的清单勾选权限，提现必须关闭；选择「只访问受信任的 IP」，填入绑定页给出的 IP 后保存。' },
        en: { t: 'Permissions and trusted IPs', x: 'Tick the permissions listed on the binding page and keep Withdrawals off. Select “Restrict access to trusted IPs only”, enter the IPs from the binding page and save.' } },
      html: function (l, cfg) { var w = W[l]; return frame(w, 1, head(w, w.apiTitle, '') + keyPage(w, cfg, 'perm')); } }
  ];

  // Purpose-built playback panels. They are laid out at the viewport width, never cropped from a full page.
  // Panel 3 (self-generated → paste public key → copy API Key) is 「示意」: no checked source for Binance's live screen.
  function playback(l, cfg, step) {
    var en = l === 'en', kit = kitOf(cfg);
    function t(zh, eng) { return esc(en ? eng : zh); }
    function field(label, value, cls) { return '<label class="demo-field' + (cls ? ' ' + cls : '') + '"><small>' + label + '</small><code>' + esc(value) + '</code></label>'; }
    function action(label) { return '<span class="demo-action" data-t="action">' + label + '</span>'; }
    var later = en ? 'Shown after you apply' : '申请绑定后显示';
    var body = '';
    if (step === 0) {
      body = '<h2>' + t('创建子账户', 'Create sub-account') + '</h2>' +
        field(t('子账户类型', 'Account type'), en ? 'Virtual email' : '虚拟邮箱') +
        field(t('账户名称', 'Account name'), cfg.nameEx) +
        '<p class="demo-note">3dtusdt01_virtual@example.com</p>' + action(t('创建子账户', 'Create sub-account'));
    } else if (step === 1) {
      body = '<h2>' + t('创建 API', 'Create API') + '</h2>' +
        field(t('子账户', 'Sub-account'), '3dtusdt01_virtual@example.com') +
        field(t('API 标签', 'API label'), cfg.labelEx) +
        '<p class="demo-note">' + t('点下一步后，由你本人完成币安的安全验证。', 'After Next, pass Binance’s security check yourself.') + '</p>' +
        action(t('下一步', 'Next'));
    } else if (step === 2) {
      body = '<h2>' + t('自行生成 · 粘贴公钥', 'Self-generated · paste public key') + ' <em class="demo-tag">' + t('示意', 'Illustration') + '</em></h2>' +
        '<div class="demo-choice">' + t('系统生成', 'System generated') + '<span>○</span></div>' +
        '<div class="demo-choice selected">' + t('自行生成', 'Self-generated') + '<span>●</span></div>' +
        field(t('公钥 · 3dtrading 给你的', 'Public key · from 3dtrading'), kit ? kit.fingerprint : later) +
        field('API Key', cfg.keyEx) +
        '<p class="demo-note">' + t('只复制 API Key 贴回来；没有 Secret，也没有私钥。示例值不能用于连接账户。', 'Copy only the API Key back. There is no Secret and no private key. Example values cannot connect an account.') + '</p>' +
        action(t('复制 API Key', 'Copy API Key'));
    } else {
      var perms = kit && kit.perms ? kit.perms : [];
      body = '<h2>' + t('设置 API 权限', 'Set API permissions') + '</h2>' +
        '<div class="demo-perms">' + (perms.length ? perms.map(function (p) {
          return '<span' + (p.forbidden ? ' class="disabled"' : '') + '>' + (p.forbidden ? '× ' : '✓ ') + esc(en ? p.en : p.zh) + '</span>';
        }).join('') : '<span>' + esc(later) + '</span>') + '</div>' +
        '<div class="demo-choice selected">' + t('只访问受信任的 IP', 'Trusted IPs only') + '<span>●</span></div>' +
        field(t('授权 IP · 演示', 'Allowed IPs · demo'), kit && kit.ips && kit.ips.length ? kit.ips.join(' · ') : later) + action(t('保存权限', 'Save permissions'));
    }
    return '<div class="demo-panel"><header><span class="bn-logo"><b class="bn-wordt">Binance</b></span><small>' + t('连接演示 · 示意', 'Connection demo · illustration') + '</small></header><section>' + body + '</section></div>';
  }
  var clips = [0, 1, 2, 3].map(function (step) {
    return { html: function (l, cfg) { return playback(l, cfg, step); } };
  });
  /* r41 · 「系统生成」(HMAC) path for connect.html: the same Binance replica, but Binance generates the API Key and
   * Secret Key and the user pastes both into 3dtrading. Example values only (never real). bind.html keeps the Ed25519 set above. */
  var HW = {
    zh: { k1p: '使用HMAC对称加密方式运作。返回 API Key 和 Secret Key，3dtrading 用这一种。', k2p: '使用Ed25519非对称加密方式运作。需要自备公钥，这里不用。',
      warn: '请妥善保存 Secret Key，并按币安页面的实际提示操作，和 API Key 一起贴到 3dtrading 的连接页。', sec: 'Secret Key:', key: 'API Key:' },
    en: { k1p: 'Works using HMAC symmetric encryption. Returns an API Key and a Secret Key; 3dtrading uses this type.', k2p: 'Works using Ed25519 asymmetric encryption. Needs your own public key; not used here.',
      warn: 'Keep the Secret Key safe and follow what Binance’s page tells you; paste it with the API Key on the 3dtrading connect page.', sec: 'Secret Key', key: 'API Key' }
  };
  function hw(l) { var b = W[l], o = {}, k; for (k in b) o[k] = b[k]; for (k in HW[l]) o[k] = HW[l][k]; return o; }
  function hKeyPage(w, cfg, part) {
    var en = w.brand === 'Binance';
    var perms = permsOf(cfg).map(function (p) {
      return '<span class="bn-ck' + (p.required ? ' on' : '') + (p.forbidden ? ' off' : '') + '"><i></i><u>' + esc(en ? p.en : p.zh) + '</u></span>';
    }).join('');
    var ips = ipsOf(cfg);
    return '<div class="bn-key">' +
      '<div class="bn-qr"><div class="q"></div><span>' + esc(w.qr) + '</span></div>' +
      '<div class="bn-kd"><div class="bn-kl">' + esc(w.lbl) + '</div><div class="bn-tags"><span class="t1">HMAC</span><span class="t2">' + esc(w.pm) + '</span><b>' + esc(cfg.labelEx) + '</b></div>' +
      '<div class="bn-warn">' + I.info + '<span>' + esc(w.warn) + '</span></div>' +
      '<div' + (part === 'keys' ? ' data-focus' : '') + '>' +
      '<div class="bn-kl">' + esc(w.key) + '</div><div class="bn-kr" data-slot="key"><span class="bn-kv">' + esc(cfg.keyEx) + '</span><span class="bn-copy">' + esc(w.copy) + '</span></div>' +
      '<div class="bn-kl">' + esc(w.sec) + '</div><div class="bn-kr" data-slot="sec"><span class="bn-kv">' + esc(cfg.secretEx) + '</span><span class="bn-copy"' + (part === 'keys' ? ' data-t="copy"' : '') + '>' + esc(w.copy) + '</span></div></div>' +
      '<div class="bn-perm"' + (part === 'perm' ? ' data-focus' : '') + '><div class="bn-kl bn-plh"><span>' + esc(w.perm) + '</span><span class="bn-edit">' + esc(w.edit) + '</span></div><div class="bn-grid">' + perms + '</div>' +
      '<div class="bn-ipt">' + esc(w.ipT) + '</div>' +
      '<div class="bn-rad"><i></i>' + esc(w.ipAny) + ' <em>' + esc(w.ipAnyW) + '</em></div>' +
      '<div class="bn-rad on"><i></i>' + esc(w.ipOnly) + '</div>' +
      '<div class="bn-chips" data-slot="ips">' + (ips || []).map(function (ip) { return '<span>' + esc(ip) + '<b>✕</b></span>'; }).join('') + '</div>' +
      '<div class="bn-ipin"><span>' + esc(w.ipPh) + '</span><b' + (part === 'perm' ? ' data-t="ipok"' : '') + '>' + esc(w.ok) + '</b></div></div>' +
      '</div></div>';
  }
  var hmac = [scenes[0], scenes[1], scenes[2], scenes[3], scenes[4],
    { h: 640, cap: {
        zh: { t: '选择「系统生成」', x: '左侧「API管理」→ 右上角「+ 创建API」，选「系统生成」，点下一步。' },
        en: { t: 'Choose “System generated”', x: 'Open API Management, click “+ Create API”, choose System generated and click Next.' } },
      html: function (l) {
        var w = hw(l);
        return frame(w, 1, apiPage(w), modal(w.kTitle,
          '<div class="bn-opt on">' + I.keyA + '<div><b>' + esc(w.k1) + '</b><p>' + esc(w.k1p) + '</p></div><i class="corner"></i></div>' +
          '<div class="bn-opt">' + I.keyB + '<div><b>' + esc(w.k2) + '</b><p>' + esc(w.k2p) + '</p></div></div>' +
          '<span class="bn-btn y block" data-t="next">' + esc(w.next) + '</span>', 'wide'));
      } },
    scenes[6],
    { h: 860, cap: {
        zh: { t: '复制 API Key 和 Secret Key', x: '完成币安的安全验证后，页面显示 API Key 和 Secret Key。离开这一步前请妥善保存 Secret Key，两项都复制下来。' },
        en: { t: 'Copy the API Key and Secret Key', x: 'After Binance’s security check the page shows the API Key and Secret Key. Keep the Secret Key safe before you leave this step; copy both.' } },
      html: function (l, cfg) { var w = hw(l); return frame(w, 1, head(w, w.apiTitle, '') + hKeyPage(w, cfg, 'keys')); } },
    { h: 930, cap: {
        zh: { t: '权限与 IP 白名单', x: '点「编辑」，按连接页的清单勾选权限，提现保持关闭；选「只访问受信任的 IP」，填入连接页给出的 IP 后保存。' },
        en: { t: 'Permissions and trusted IPs', x: 'Click Edit, tick the permissions listed on the connect page and keep Withdrawals off. Choose “Restrict access to trusted IPs only”, enter the IPs from the connect page and save.' } },
      html: function (l, cfg) { var w = hw(l); return frame(w, 1, head(w, w.apiTitle, '') + hKeyPage(w, cfg, 'perm')); } }
  ];
  /* r43 · connect.html one-screen guide. The same replica pages, plus the two screens the guide needs that the
   * carousel did not have: the key-type choice with EITHER option selected, and the self-generated 「创建API」 form with a
   * public-key box (示意 — Binance's live form was not checked; see BINANCE-SOURCES.md). Neutral wording only: no
   * 3dtrading commentary inside the Binance replica. [data-slot] marks where the guide lays its own copy / input control. */
  var GW = {
    zh: { k1p: '使用 HMAC 对称加密方式运作。币安生成 API Key 和 Secret Key。', k2p: '使用 Ed25519 或 RSA 非对称加密方式运作。你提供公钥，币安生成 API Key。',
      pubL: '公钥', pubPh: '粘贴公钥（Ed25519 / RSA）', warnS: '复制 API Key。自行生成的密钥没有 Secret Key。', warnH: '请妥善保存 Secret Key，并按币安页面的实际提示操作。' },
    en: { k1p: 'Works using HMAC symmetric encryption. Binance generates an API Key and a Secret Key.', k2p: 'Works using Ed25519 or RSA asymmetric encryption. You provide the public key and Binance generates the API Key.',
      pubL: 'Public key', pubPh: 'Paste the public key (Ed25519 / RSA)', warnS: 'Copy the API Key. A self-generated key has no Secret Key.', warnH: 'Keep the Secret Key safe and follow what Binance’s page tells you.' }
  };
  function gw(l, warn) { var o = hw(l); o.k1p = GW[l].k1p; o.k2p = GW[l].k2p; o.warn = warn === 'self' ? GW[l].warnS : GW[l].warnH; return o; }
  var guide = {
    home: scenes[0], create: scenes[1], vmail: scenes[2], futures: scenes[3], pm: scenes[4],
    /* API Management list (the key-type dialog follows as its own page, below) */
    apis: function (l) { var w = gw(l); return frame(w, 1, apiPage(w)); },
    /* r47: Binance's own 「选择API密钥类型」 dialog (Excepta p.6) with 系统生成 already chosen (yellow corner); the cursor goes
     * straight to 下一步. 自行生成 is shown dimmed and inert: this guide only follows the system-generated route. */
    /* r48 · kind 'self' (connect.html since r48, Jasper: the 自行生成 route replaces 系统生成 there): 自行生成 is the chosen
     * option and 系统生成 is drawn plain. Any other kind keeps the r47 drawing above. */
    type: function (l, cfg, kind, ph) {
      var w = gw(l), self = kind === 'self', on = !self;
      return frame(w, 1, apiPage(w), modal(w.kTitle,
        '<div class="bn-opt' + (on ? ' on' : '') + '" data-slot="optSys">' + I.keyA + '<div><b>' + esc(w.k1) + '</b><p>' + esc(w.k1p) + '</p></div>' + (on ? '<i class="corner"></i>' : '') + '</div>' +
        '<div class="bn-opt' + (self ? ' on' : ' off') + '" data-slot="optSelf"' + (self ? '' : ' aria-disabled="true"') + '>' + I.keyB + '<div><b>' + esc(w.k2) + '</b><p>' + esc(w.k2p) + '</p></div>' + (self ? '<i class="corner"></i>' : '') + '</div>' +
        '<span class="bn-btn y block" data-t="next">' + esc(w.next) + '</span>', 'wide'));
    },
    label: scenes[6],
    pub: function (l, cfg) {
      var w = gw(l, 'self');
      return frame(w, 1, apiPage(w), modal(w.cTitle,
        '<div class="bn-f"><small>' + esc(w.cSub) + '</small><div class="bn-in sel">3dtusdt01_virtual@example.com' + I.tri + '</div></div>' +
        '<div class="bn-f"><small>' + esc(w.cLabel) + '</small><div class="bn-in">' + esc(cfg.labelEx) + '</div></div>' +
        '<div class="bn-f"><small>' + esc(GW[l].pubL) + '</small><button type="button" class="bn-in bn-pk" data-slot="pub" data-copy="pub" aria-label="' + esc(l === 'en' ? 'Copy the full public key' : '复制完整公钥') + '"><code>' + esc(cfg.pubShort || '') + '</code><span class="cpi" aria-hidden="true"><svg viewBox="0 0 16 16"><rect x="5" y="5" width="8.5" height="8.5" rx="1.8"/><path d="M3 10.5V3.8C3 3.3 3.3 3 3.8 3h6.7"/></svg></span></button></div>' +
        '<span class="bn-btn y block" data-t="next3">' + esc(w.next) + '</span>', 'tall'));
    },
    selfKeys: function (l, cfg) { var w = gw(l, 'self'); return frame(w, 1, head(w, w.apiTitle, '') + keyPage(w, cfg, 'keys')); },
    sysKeys: function (l, cfg) { var w = gw(l, 'hmac'); return frame(w, 1, head(w, w.apiTitle, '') + hKeyPage(w, cfg, 'keys')); },
    perm: function (l, cfg, kind, part) { var w = gw(l, kind); return frame(w, 1, head(w, w.apiTitle, '') + (kind === 'self' ? keyPage(w, cfg, part || 'perm') : hKeyPage(w, cfg, 'perm'))); }
  };
  global.TD_BN = { scenes: scenes, clips: clips, hmac: hmac, guide: guide, width: 1100, words: W, icons: I };
})(window);
