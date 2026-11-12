/* 3dtrading · coded replica of Binance's web screens for creating a sub-account API key.
 * Built in HTML/CSS from the 2026.10.10 setup guide (real zh dark-mode screens) and Binance's public FAQs;
 * the Binance logo images are the official files served on binance.com (see account/BINANCE-SOURCES.md).
 * No screenshots, no network. Names, UIDs and keys are made-up examples (account "3dtrading"), never real ones.
 * window.TD_BN.scenes[i] = { h, cap:{zh:{t,x},en:{t,x}}, html(lang, cfg) }.
 * In each scene, [data-t] marks what the cursor clicks and [data-focus] what the camera keeps in view. */
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
      notes: ['1. 每个子账户最多可以创建30个 API Key。', '2. 请勿将您的API密钥、HMAC密钥、Ed25519或RSA私钥透露给任何人，以免造成资产损失。', '3. 为提高您账户的安全性，建议仅授予可信IP访问权限。', '4. 请在创建API密钥前完成身份认证。'],
      apiCols: ['邮箱', '标签', '现货账户', '杠杆账户', '合约账户', 'IP 限制'],
      kTitle: '选择API密钥类型', k1: '系统生成', k1p: '使用HMAC对称加密方式运作。您将获得API密钥和HMAC密钥。请将该API密钥和HMAC密钥视为密码一样妥善保管，切勿与任何第三方分享。',
      k2: '自行生成', k2p: '使用Ed25519或RSA非对称加密方式运作。您将获得API密钥，且必须通过软件（如币安密钥生成器）自行创建一对公钥和私钥，然后仅向币安提供公钥。', next: '下一步',
      cTitle: '创建API', cSub: '子账户', cLabel: 'API 标签',
      qr: '扫码获取地址', lbl: '标签', pm: '统一账户', warn: '请务必立即复制您的 API 密钥和私钥。离开此页面后，它们将不会再完整显示。',
      key: 'API 密钥:', sec: '密钥:', copy: 'Copy', perm: 'API权限:', edit: '编辑',
      ipT: 'IP访问限制', ipAny: '无限制(缺乏安全)', ipAnyW: '这个API密钥允许任何地址访问，不推荐。', ipOnly: '只访问受信任的IP(推荐)', ipPh: '输入多个IP地址时，请使用空格隔开。'
    },
    en: {
      brand: 'BINANCE', acct: '3dtrading', uid: '1024 3366', homeH: ['Trade 24/7', 'One account, every market'], est: 'Estimated Balance', estV: '0.00 USDT', pnl: "Today's PnL", pnlV: '+0.00 USDT', homeB: ['Deposit', 'Trade', 'Convert'], nav: ['Buy Crypto', 'Markets', 'Trade', 'Futures', 'Earn', 'Square', 'Institutional', 'AI', 'More'], navDd: [0, 0, 1, 1, 1, 1, 1, 1, 1], dep: 'Deposit',
      side: ['Dashboard', 'Assets', 'Orders', 'Rewards Hub', 'Referral', 'Account', 'Sub Accounts'], sideDd: [0, 1, 1, 0, 0, 1, 1],
      sub: ['Account Management', 'API Management', 'Asset Management', 'Order Management', 'Transaction History', 'Login History', 'Trading Data'],
      menu: ['Dashboard', 'Assets', 'Orders', 'Account', 'Referral', 'Rewards Hub', 'Sub Accounts', 'Settings'], logout: 'Log Out', sw: 'Switch Sub Account', tags: ['Regular User', 'Verified'],
      crumb: 'Sub Account', amTitle: 'Account Management', apiTitle: 'API Management', deposit: 'Deposit', transfer: 'Transfer',
      fSub: 'Sub Accounts', fAll: 'All', fSt: 'Status', fAllSt: 'All Status', search: 'Search', reset: 'Reset', cnt: 'Sub Account', create: 'Create Sub Account',
      cols: ['Email', 'User ID', 'Status', 'Date of creation', 'Email Verification', 'Phone Number', 'Action'], normal: 'Normal', freeze: 'Freeze',
      mTitle: 'Create Sub Account', mType: 'Sub-account type', mTypeV: 'Create with virtual email', mName: 'Create with virtual email', mHint: 'Enter a string and we will create a virtual email to register with.', mNote: 'Note: the sub-account can only be operated by the master account through API. Please create an API Key for the sub-account.', ok: 'Confirm',
      dd1: ['Transfer In', 'Enable Futures', 'Enable Options', 'Delete'], dd2: ['Transfer In', 'Enable Portfolio Margin', 'Enable Futures', 'Enable Options', 'Delete'],
      stp: 'Self-Trade Prevention', createApi: 'Create API', apiCnt: 'API',
      notes: ['1. Each subaccount can create up to 30 API Keys.', '2. Do not disclose your API Key, Secret Key (HMAC) or Private Key (Ed25519, RSA) to anyone to avoid asset losses.', '3. It is recommended to restrict access to trusted IPs only to increase your account security.', '4. Please complete KYC before creating an API Key.'],
      apiCols: ['Email', 'Label', 'Spot', 'Margin', 'Futures', 'IP restriction'],
      kTitle: 'Choose API Key type', k1: 'System generated', k1p: 'Works using HMAC symmetric encryption. An API Key and Secret Key will be provided to you. Please keep these keys secure and treat it like your password. Do not share the keys with any third parties.',
      k2: 'Self-generated', k2p: 'Works using Ed25519 or RSA asymmetric encryption. You will be provided with an API Key and must create a public-private key pair via software (for example: Binance Key Generator), then provide the public key to Binance.', next: 'Next',
      cTitle: 'Create API', cSub: 'Sub Account', cLabel: 'API Label',
      qr: 'Scan to get address', lbl: 'Label', pm: 'Portfolio Margin', warn: 'Make sure you copy your API Key and Secret Key now. They will not be shown in full again after you leave this page.',
      key: 'API Key', sec: 'Secret Key', copy: 'Copy', perm: 'API restrictions:', edit: 'Edit',
      ipT: 'IP access restrictions:', ipAny: 'Unrestricted (Less Secure)', ipAnyW: 'This API Key allows access from any IP address. This is not recommended.', ipOnly: 'Restrict access to trusted IPs only (Recommended)', ipPh: 'When entering more than one IP address, separate them with spaces.'
    }
  };

  var I = {
    mark: '<img class="bn-mark" src="assets/binance/binance-mark.png" alt="" width="22" height="22">',
    word: '<img class="bn-word" src="assets/binance/binance-logo-horizontal.png" alt="Binance" width="120" height="64">',
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
    return '<div class="bn-top"><span class="bn-logo">' + (w === W.en ? I.word : I.mark + '<b>' + esc(w.brand) + '</b>') + '</span>' +
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
    return head(w, w.apiTitle, '<span class="bn-btn yd">' + esc(w.stp) + '</span><span class="bn-btn g">+ ' + esc(w.createApi) + '</span><span class="bn-mut">' + esc(w.apiCnt) + ' (0)</span>') +
      '<ol class="bn-notes">' + w.notes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      '<div class="bn-filt"><div class="bn-lab"><small>' + esc(w.fSub) + '</small>' + sel('', w.fAll, 'w2') + '</div><span class="bn-btn yd">' + esc(w.search) + '</span><span class="bn-btn g">' + esc(w.reset) + '</span></div>' +
      '<div class="bn-tbl api"><div class="bn-th">' + w.apiCols.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div></div>';
  }
  function modal(title, body, cls) { return '<div class="bn-dim"></div><div class="bn-modal ' + (cls || '') + '" data-focus><div class="bn-mh"><b>' + esc(title) + '</b>' + I.x + '</div>' + body + '</div>'; }
  function ddMenu(items, hot, grey) {
    return '<div class="bn-dd">' + items.map(function (x, i) { return '<span' + (i === hot ? ' data-t="dd"' : '') + (i === grey ? ' class="off"' : '') + '>' + esc(x) + '</span>'; }).join('') + '</div>';
  }
  function keyPage(w, cfg, part) {
    var perms = cfg.perms.map(function (p) {
      return '<span class="bn-ck' + (p.on ? ' on' : '') + (p.fixed ? ' fix' : '') + '"><i></i><u>' + esc(w === W.en ? p.en : p.zh) + '</u>' + (p.edit ? '<em>' + esc(w.edit) + '</em>' : '') + '</span>';
    }).join('');
    var keyRow = function (lab, n, hot) {
      return '<div class="bn-kl">' + esc(lab) + '</div><div class="bn-kr"><span class="bn-kv">' + esc(n ? cfg.secretEx : cfg.keyEx) + '</span><span class="bn-copy"' + (hot ? ' data-t="copy"' : '') + '>' + esc(w.copy) + '</span></div>';
    };
    return '<div class="bn-key">' +
      '<div class="bn-qr"><div class="q"></div><span>' + esc(w.qr) + '</span></div>' +
      '<div class="bn-kd"><div class="bn-kl">' + esc(w.lbl) + '</div><div class="bn-tags"><span class="t1">HMAC</span><span class="t2">' + esc(w.pm) + '</span><b>' + esc(cfg.labelEx) + '</b></div>' +
      '<div class="bn-warn">' + I.info + '<span>' + esc(w.warn) + '</span></div>' +
      '<div' + (part === 'keys' ? ' data-focus' : '') + '>' + keyRow(w.key, 0, part === 'keys') + keyRow(w.sec, 1, false) + '</div>' +
      '<div class="bn-perm"' + (part === 'perm' ? ' data-focus' : '') + '><div class="bn-kl">' + esc(w.perm) + '</div><div class="bn-grid">' + perms + '</div>' +
      '<div class="bn-ipt">' + esc(w.ipT) + '</div>' +
      '<div class="bn-rad"><i></i>' + esc(w.ipAny) + ' <em>' + esc(w.ipAnyW) + '</em></div>' +
      '<div class="bn-rad on"><i></i>' + esc(w.ipOnly) + '</div>' +
      '<div class="bn-chips">' + cfg.ips.map(function (ip) { return '<span>' + esc(ip) + '<b>✕</b></span>'; }).join('') + '</div>' +
      '<div class="bn-ipin"><span>' + esc(w.ipPh) + '</span><b' + (part === 'perm' ? ' data-t="ipok"' : '') + '>' + esc(w.ok) + '</b></div></div>' +
      '</div></div>';
  }

  var scenes = [
    // narrow: on phones this scene is drawn at Binance's own narrow-header width so the logo and the click both stay in frame
    { h: 640, narrow: 480, cap: {
        zh: { t: '打开子账户', x: '在电脑上登录币安主账户，点右上角头像，选「子账户」。' },
        en: { t: 'Open Sub Accounts', x: 'Log in to your main Binance account on a computer, click the avatar at the top right and choose Sub Accounts.' } },
      html: function (l) {
        var w = W[l];
        return nav(w, true) + '<div class="bn-home"><h2>' + esc(w.homeH[0]) + '</h2><h3>' + esc(w.homeH[1]) + '</h3>' +
          '<small>' + esc(w.est) + '</small><b class="bal">' + esc(w.estV) + '</b><small>' + esc(w.pnl) + ' <em>' + esc(w.pnlV) + '</em></small>' +
          '<div class="hb">' + w.homeB.map(function (x, i) { return '<b' + (i ? ' class="g"' : '') + '>' + esc(x) + '</b>'; }).join('') + '</div></div>' +
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
          '<div class="bn-f"><small>' + esc(w.mName) + '</small><div class="bn-in focus">' + esc(cfg.nameEx) + '<i class="caret"></i></div><p>' + esc(w.mHint) + '</p></div>' +
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
        zh: { t: '选择「系统生成」', x: '左侧「API管理」→ 右上角「+ 创建API」，选「系统生成」，点下一步。' },
        en: { t: 'Choose “System generated”', x: 'Open API Management, click “+ Create API”, choose System generated and click Next.' } },
      html: function (l) {
        var w = W[l];
        return frame(w, 1, apiPage(w), modal(w.kTitle,
          '<div class="bn-opt on">' + I.keyA + '<div><b>' + esc(w.k1) + '</b><p>' + esc(w.k1p) + '</p></div><i class="corner"></i></div>' +
          '<div class="bn-opt">' + I.keyB + '<div><b>' + esc(w.k2) + '</b><p>' + esc(w.k2p) + '</p></div></div>' +
          '<span class="bn-btn y block" data-t="next">' + esc(w.next) + '</span>', 'wide'));
      } },
    { h: 640, cap: {
        zh: { t: '选子账户、填标签', x: '选刚创建的子账户，API 标签填 3dtrading01，点下一步，再由你本人完成币安的安全验证。' },
        en: { t: 'Pick the sub-account and label', x: 'Pick the new sub-account, enter 3dtrading01 as the label, click Next, then pass Binance’s security check yourself.' } },
      html: function (l, cfg) {
        var w = W[l];
        return frame(w, 1, apiPage(w), modal(w.cTitle,
          '<div class="bn-f"><small>' + esc(w.cSub) + '</small><div class="bn-in sel">3dtusdt01_virtual@example.com' + I.tri + '</div></div>' +
          '<div class="bn-f"><small>' + esc(w.cLabel) + '</small><div class="bn-in">' + esc(cfg.labelEx) + '</div></div>' +
          '<span class="bn-btn y block" data-t="next2">' + esc(w.next) + '</span>'));
      } },
    { h: 860, cap: {
        zh: { t: '立即复制两项密钥', x: '复制 API Key 与 Secret Key（Secret Key 在币安端仅显示一次；如采用私有云独立部署，直接在你本人云环境内配置，无需提交至外部网页）。' },
        en: { t: 'Copy both keys now', x: 'Copy the API Key and Secret Key (shown only once on Binance; for private cloud deployments, configure keys directly inside your own cloud environment).' } },
      html: function (l, cfg) { var w = W[l]; return frame(w, 1, head(w, w.apiTitle, '') + keyPage(w, cfg, 'keys')); } },
    { h: 930, cap: {
        zh: { t: '权限与 IP 白名单', x: '仅勾选读取与约定的现货/统一账户交易权限，严禁勾选提现与跨账户转账；选择「只访问受信任的 IP」并填入专属授权 IP 后保存。' },
        en: { t: 'Permissions and trusted IPs', x: 'Enable only Read and agreed Spot/Portfolio Margin trading—keep Withdrawals and Universal Transfer off. Select “Restrict access to trusted IPs only” and save.' } },
      html: function (l, cfg) { var w = W[l]; return frame(w, 1, head(w, w.apiTitle, '') + keyPage(w, cfg, 'perm')); } }
  ];

  global.TD_BN = { scenes: scenes, width: 1100, words: W };
})(window);
