/* 3dtrading r45b/r46 · coded replica of the Binance APP's phone screens (an illustration: never the live app, never an iframe,
 * no network, no Binance logo; the reference screenshots live only in _evidence/, never on the page). Used by connect.html on phones (connect-r45.js).
 *
 * Layout reference (r45b): the Excepta guide's phone section — 26 real Binance App screenshots, pages 11–23 of
 * 项目/…/Excepta_币安子账户配置指南_电脑版与手机版/…pdf (guide dated 2026.10.10; the screenshots' own clocks/rows show they were
 * taken 2026-04-28). Every screen below maps to one of those pages; see account/BINANCE-SOURCES.md and
 * _evidence/reference/excepta-phone/ for the side-by-side table. Route in the App (all inside the App, no website):
 *   top-left ☰ → profile card ›  → 账号信息 → 子账户 → + 创建子账户 (虚拟邮箱创建) → ⋮ 允许合约 → 确认 → ⋮ 开通统一账户 → 确认
 *   → 账号管理 ▾ → API管理 → + 创建API → 选择API密钥类型: 系统生成 → 下一步 (r46: drawn again; 3dtrading only uses
 *   system-generated HMAC keys, the self-generated route is never taken) → 子账户 + API 标签 → 下一步 → (the user's own passkey check)
 *   → API密钥 / 密钥 Copy → API权限 + 只访问受信任的IP → 保存.
 * r48 (Jasper): connect.html now takes the 自行生成 route instead (o.self): 选择API密钥类型 → 自行生成 → 下一步 → 子账户 + 标签 +
 *   粘贴 3dtrading 的公钥 (sheet 'pub') → 下一步 → (passkey) → API 密钥 only (no 密钥/Secret) → 只访问受信任的IP + the two IPs → 保存.
 *   The 自行生成 screens are 示意: the Excepta screenshots only cover 系统生成; wording follows Binance's FAQ (read 2026-11-16).
 * Binance's official pages (read 2026-11-16) do not describe these App screens; they are taken from the screenshots only.
 * The real App was shown in light mode; this replica uses Binance's dark palette to match our night page — a colour choice,
 * the layout follows the screenshots. Names, UIDs and keys are made-up examples. [data-t] marks the one control the guide
 * may light up.
 * r59 (Jasper, 2026-11-17): profile / 账号信息 / 子账户 / API管理 / 上传公钥 / 编辑API are redrawn from Jasper's own Binance App
 * screenshots (layout only — no name, e-mail, UID or key from them is used; everything shown is a made-up example).
 * Route: 个人主页 › → 账号信息 → 子账户 → + 创建子账户 (虚拟邮箱) → ⋮ 允许合约 → ⋮ 开通统一账户 → 账号管理 ▾ → API管理 → + 创建API →
 * 自行生成 → 上传公钥 → 编辑API (API 密钥 → 只访问受信任的IP → IP → 勾选 → 保存). The HMAC 编辑API screenshot is layout reference only. */
(function (global) {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var W = {
    zh: { seg: ['交易平台', '钱包'], search: 'USDT 热搜', est: '预估总资产 (USDT)', estV: '0.00', add: '添加资金',
      mk: [['BNB', '622.87', '-1.35%'], ['BTC', '76,758.47', '-1.61%']], tabs: ['首页', '行情', '交易', '合约', '资产'],
      tags: ['普通用户', '已认证'], quick: '快捷入口', qk: ['C2C买币', '理财', '热门活动', '邀请奖励'],
      info: '账号信息', uid: '币安 ID (UID)', reg: '注册信息', vip: '升级至 VIP 1', vipS: '交易更多资产，以升至下一等级', perk: '福利',
      rows: [['认证中心', '已认证'], ['账户安全', ''], ['绑定社交账号', ''], ['子账户', '']], out: '退出',
      idL: 'ID', cs: '币安客服', csS: '获取支持', cards: [['邀请好友', '邀请好友，一起赚'], ['猜你喜欢', '为你推荐'], ['现货跟单', '跟随优秀交易员'], ['合约跟单', '一键跟单']], lite: '简易版',
      dep: '充值', xfer: '划转', pubT: '上传公钥', pubY: '您的公钥', pubHow: '如何生成公钥？', pubPem: 'RSA公钥须符合PEM格式。', warnK: '请务必立即复制您的 API 密钥和私钥。离开此页面后，它们将不会再完整显示。',
      anyW: '这个API密钥允许任何地址访问，不推荐。为保障您的资金安全，如果此IP不受限制，且启用了除读取以外的任何权限，则该API密钥将被删除。',
      subT: '子账户', mgmt: '账号管理', apiM: 'API管理', cnt: '子账户', create: '创建子账户', uidL: '用户 ID', stL: '状态', dtL: '创建日期', normal: '正常', more: '更多',
      ok1: '成功', pmWait: '统一账户更新中。请稍后查看。',
      mT: '创建子账户', mType: '子账户类型', mTypeV: '虚拟邮箱创建', mName: '虚拟邮箱创建', mHint: '请输入字符串，我们将为您创建一个虚拟邮箱进行注册。',
      mNote: '注意：虚拟邮箱不能用于登录子账户。请使用主账户创建子账户API来管理子账户。', ok: '确认', cancel: '取消',
      vmail: '3dtusdt01_virtual@example.com', menu1: ['转入', '允许合约', '启用期权', '充值', '划转', '冻结', '删除'], menu2: ['转入', '开通统一账户', '允许合约', '启用期权', '充值', '划转', '冻结', '删除'],
      cf1: '请确认是否为该子账户开通合约功能。', tip: '提示', cf2: '请确认是否为该子账户开通统一账户。', cf2n: '注意：此操作耗时几分钟，请稍后返回查看。',
      mgT: '子账户', mgRows: ['账号管理', 'API管理', '资产管理', '订单管理'],
      notes: ['每个子账户最多可以创建30个 API Key。', '请勿将您的API密钥、HMAC密钥、Ed25519或RSA私钥透露给任何人，以免造成资产损失。您应将您的API密钥、HMAC密钥、Ed25519或RSA私钥视为密码一样妥善保管。', '为提高您账户的安全性，建议仅授予可信IP以访问权限。', '请在创建API密钥前完成身份认证。',
        '使用 API Key 即表示您已阅读并同意受 API Key 条款约束，该等条款自您首次使用或接受（以较早者为准）之日起生效。', '若通过 API Key 将 OMS 提供商绑定至您的币安账户，即表示您确认 OMS 提供商会收取服务费用，币安可代 OMS 提供商收取该等费用，收费形式为在您的交易手续费基础上加价计收。'],
      api: 'API', stp: '自成交预防', newApi: '创建API',
      cT: '创建API', cSub: '子账户', cLabel: 'API 标签', next: '下一步',
      kT: '选择API密钥类型', k1: '系统生成', k1p: '使用HMAC对称加密方式运作。您将获得API密钥和HMAC密钥。请将该API密钥和HMAC密钥视为密码一样妥善保管，切勿与任何第三方分享。',
      k2: '自行生成', k2p: '使用Ed25519或RSA非对称加密方式运作。您将获得API密钥，且必须通过软件（如币安密钥生成器）自行创建一对公钥和私钥，然后仅向币安提供公钥。',
      edit: '编辑API', save: '保存', label: '标签', pm: '统一账户', key: 'API 密钥', sec: '密钥', copy: 'Copy', perm: 'API权限：',
      ipT: 'IP访问限制', ipAny: '无限制（缺乏安全）', ipOnly: '只访问受信任的IP（推荐）', ipPh: '3dtrading 服务器 IP：未配置',
      pubL: '公钥', pubPh: '粘贴公钥（Ed25519 / RSA）', ipIn: '输入 IP 地址', ipOk: '确认' },
    en: { seg: ['Exchange', 'Wallet'], search: 'USDT trending', est: 'Est. total value (USDT)', estV: '0.00', add: 'Add Funds',
      mk: [['BNB', '622.87', '-1.35%'], ['BTC', '76,758.47', '-1.61%']], tabs: ['Home', 'Markets', 'Trade', 'Futures', 'Assets'],
      tags: ['Regular', 'Verified'], quick: 'Shortcuts', qk: ['P2P', 'Earn', 'Campaigns', 'Referral'],
      info: 'Account Info', uid: 'Binance ID (UID)', reg: 'Registration info', vip: 'Upgrade to VIP 1', vipS: 'Trade more to reach the next level', perk: 'Perks',
      rows: [['Verification Center', 'Verified'], ['Security', ''], ['Linked Social Accounts', ''], ['Sub Accounts', '']], out: 'Log Out',
      idL: 'ID', cs: 'Binance Support', csS: 'Get help', cards: [['Referral', 'Invite friends, earn together'], ['For You', 'Picked for you'], ['Spot Copy Trading', 'Follow top traders'], ['Futures Copy Trading', 'Copy in one tap']], lite: 'Lite',
      dep: 'Deposit', xfer: 'Transfer', pubT: 'Upload Public Key', pubY: 'Your public key', pubHow: 'How do I generate a public key?', pubPem: 'An RSA public key must be in PEM format.', warnK: 'Copy your API key and private key now. They will not be shown in full again after you leave this page.',
      anyW: 'This API key allows access from any IP address. This is not recommended. To keep your funds safe, if the IP is unrestricted and any permission other than reading is enabled, the API key will be deleted.',
      subT: 'Sub Accounts', mgmt: 'Account Management', apiM: 'API Management', cnt: 'Sub accounts', create: 'Create Sub Account', uidL: 'User ID', stL: 'Status', dtL: 'Created', normal: 'Normal', more: 'More',
      ok1: 'Success', pmWait: 'Portfolio Margin is updating. Check back later.',
      mT: 'Create Sub Account', mType: 'Sub-account type', mTypeV: 'Create with virtual email', mName: 'Create with virtual email', mHint: 'Enter a string; we create a virtual email to register with.',
      mNote: 'Note: a virtual email cannot log in to the sub-account. Use the master account to create a sub-account API to manage it.', ok: 'Confirm', cancel: 'Cancel',
      vmail: '3dtusdt01_virtual@example.com', menu1: ['Transfer In', 'Enable Futures', 'Enable Options', 'Deposit', 'Transfer', 'Freeze', 'Delete'], menu2: ['Transfer In', 'Enable Portfolio Margin', 'Enable Futures', 'Enable Options', 'Deposit', 'Transfer', 'Freeze', 'Delete'],
      cf1: 'Enable futures for this sub-account?', tip: 'Notice', cf2: 'Enable Portfolio Margin for this sub-account?', cf2n: 'Note: this takes a few minutes; check back later.',
      mgT: 'Sub Accounts', mgRows: ['Account Management', 'API Management', 'Asset Management', 'Order Management'],
      notes: ['Each sub-account can create up to 30 API keys.', 'Never share your API key, HMAC key or Ed25519/RSA private key with anyone, to avoid losing assets. Keep them as safe as a password.', 'For your account’s security, grant access to trusted IPs only.', 'Complete identity verification before creating API keys.',
        'By using an API key you agree to the API Key terms, effective from when you first use or accept them (whichever is earlier).', 'If you link an OMS provider to your Binance account through an API key, you confirm the OMS provider charges a service fee, which Binance may collect on its behalf as a mark-up on your trading fees.'],
      api: 'API', stp: 'Self-Trade Prevention', newApi: 'Create API',
      cT: 'Create API', cSub: 'Sub-account', cLabel: 'API label', next: 'Next',
      kT: 'Choose API Key type', k1: 'System generated', k1p: 'Works using HMAC symmetric encryption. You get an API key and an HMAC key. Keep them as safe as a password and never share them with anyone.',
      k2: 'Self-generated', k2p: 'Works using Ed25519 or RSA asymmetric encryption. You get an API key and must create a public/private key pair yourself with software (such as Binance Key Generator), then give Binance only the public key.',
      edit: 'Edit API', save: 'Save', label: 'Label', pm: 'Portfolio Margin', key: 'API Key', sec: 'Secret Key', copy: 'Copy', perm: 'API restrictions:',
      ipT: 'IP access restrictions', ipAny: 'Unrestricted (less secure)', ipOnly: 'Restrict to trusted IPs (recommended)', ipPh: '3dtrading server IPs: not configured',
      pubL: 'Public key', pubPh: 'Paste the public key (Ed25519 / RSA)', ipIn: 'Enter an IP address', ipOk: 'Confirm' }
  };
  var I = {
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4"/><path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    head: '<svg viewBox="0 0 24 24"><path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2"/><rect x="3.5" y="13" width="4" height="6" rx="1.5"/><rect x="16.5" y="13" width="4" height="6" rx="1.5"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M5 6h14v10H9l-4 3z"/></svg>',
    srch: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    tri: '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>',
    filt: '<svg viewBox="0 0 24 24"><path d="M4 5h16l-6 7v6l-4 2v-8z"/></svg>',
    ok: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/></svg>',
    addU: '<svg viewBox="0 0 24 24"><circle cx="10" cy="9" r="3.5"/><path d="M3.5 19c1.2-3 3.6-4.6 6.5-4.6s5.3 1.6 6.5 4.6M18 7v6M15 10h6"/></svg>',
    scan: '<svg viewBox="0 0 24 24"><path d="M4 9V5h4M16 5h4v4M20 15v4h-4M8 19H4v-4M4 12h16"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>',
    cp: '<svg viewBox="0 0 16 16"><rect x="5" y="5" width="8.5" height="8.5" rx="1.8"/><path d="M3 10.5V3.8C3 3.3 3.3 3 3.8 3h6.7"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    tab: ['<svg viewBox="0 0 24 24"><path d="M12 3l8 9-8 9-8-9z"/></svg>', '<svg viewBox="0 0 24 24"><path d="M4 19l5-6 4 3 7-9"/></svg>',
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8l4 4-4 4"/></svg>', '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 9h8M8 13h5"/></svg>',
      '<svg viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="13" rx="2"/><path d="M15 12.5h5.5"/></svg>'],
    q: '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 12h6"/></svg>',
    keyA: '<svg viewBox="0 0 48 48" class="kic"><circle cx="18" cy="19" r="10" fill="#F0B90B" stroke="none"/><circle cx="18" cy="19" r="3.5" fill="#1e2329" stroke="none"/><path d="M25 26l13 13M32 33l3-3M35 36l3-3" stroke="#F0B90B" stroke-width="3.2"/></svg>',
    keyB: '<svg viewBox="0 0 48 48" class="kic"><circle cx="17" cy="18" r="9" stroke="#b7bdc6" stroke-width="2.6"/><path d="M23 24l12 12M29 30l3-3M32 33l3-3" stroke="#b7bdc6" stroke-width="3"/><circle cx="30" cy="16" r="5" stroke="#F0B90B" stroke-width="2.4"/></svg>'
  };
  function sbar() { return '<div class="ba-sb"><b>9:41</b><span><i></i><i></i><i></i><u></u></span></div>'; }
  function nav(title, right, back) { return sbar() + '<div class="ba-nav"><span class="ba-ic">' + I.back + '</span><b>' + esc(title) + '</b><span class="ba-ic">' + (right || '') + '</span></div>'; }
  function sheet(title, body, cls) { return '<div class="ba-dim"></div><div class="ba-sheet' + (cls ? ' ' + cls : '') + '"><div class="ba-sh"><h4>' + esc(title) + '</h4><span class="ba-ic">' + I.x + '</span></div>' + body + '</div>'; }
  function hot(o, k) { return o.hot === k ? ' data-t="' + k + '"' : ''; }
  function subCard(w, o, i) {
    var mine = i === 0;
    return '<div class="ba-sc"><div class="ba-sct"><b>' + esc(mine ? w.vmail : '••••_virtual@••••') + '</b><span class="ba-more"' + (mine && o.hot === 'more' ? ' data-t="more"' : '') + '>⋮</span></div>' +
      '<p><span>' + esc(w.uidL) + '</span><em>' + (mine ? '2048 7731' : '•••• ••••') + '</em></p><p><span>' + esc(w.stL) + '</span><em class="g">' + esc(w.normal) + '</em></p>' +
      '<p><span>' + esc(w.dtL) + '</span><em>' + (mine ? '2026-11-16 09:41:02' : '•••') + '</em></p><small>' + esc(w.more) + ' ⌄</small>' +
      (mine && o.menu ? '<div class="ba-pop">' + w[o.menu].map(function (x, k) {
        var target = (o.menu === 'menu1' && k === 1) || (o.menu === 'menu2' && k === 1);
        return '<span' + (target ? ' data-t="dd"' : '') + (o.menu === 'menu2' && k === 2 ? ' class="mute"' : '') + '>' + esc(x) + '</span>';
      }).join('') + '</div>' : '') + '</div>';
  }
  function permsOf(cfg) { return (cfg && cfg.kit && cfg.kit.perms) || []; }
  var S = {
    /* Excepta p.11 left: App home, the ☰ at the top left */
    home: function (w, cfg, o) {
      return '<div class="ba-app">' + sbar() + '<div class="ba-top"><span class="ba-ic"' + hot(o, 'menu') + '>' + I.menu + '</span><span class="ba-ic">' + I.head + '</span>' +
        '<span class="ba-tog">' + w.seg.map(function (x, i) { return '<em' + (i === 0 ? ' class="on"' : '') + '>' + esc(x) + '</em>'; }).join('') + '</span><span class="ba-ic">' + I.bell + '</span></div>' +
        '<div class="ba-search">' + I.srch + esc(w.search) + '</div>' +
        '<div class="ba-bal"><small>' + esc(w.est) + ' ▾</small><div><b>' + esc(w.estV) + '</b></div><span class="ba-btn y sm">' + esc(w.add) + '</span></div>' +
        '<div class="ba-mk">' + w.mk.map(function (r) { return '<div><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span><i class="r">' + esc(r[2]) + '</i></div>'; }).join('') + '</div>' +
        '<nav class="ba-tabs">' + w.tabs.map(function (x, i) { return '<span' + (i === 0 ? ' class="on"' : '') + '>' + I.tab[i] + '<em>' + esc(x) + '</em></span>'; }).join('') + '</nav></div>';
    },
    /* r59 · 个人主页 (Jasper's screenshot): ← and three icons on top, avatar + name + ID + tags with › on the right, 币安客服,
     * four cards, 简易版. Example name/ID only. */
    profile: function (w, cfg, o) {
      return '<div class="ba-app">' + sbar() + '<div class="ba-nav"><span class="ba-ic">' + I.back + '</span><span class="ba-icr"><span class="ba-ic">' + I.addU + '</span><span class="ba-ic">' + I.scan + '</span><span class="ba-ic">' + I.gear + '</span></span></div>' +
        '<div class="ba-me pf"' + hot(o, 'prof') + '><span class="ba-av big">' + I.user + '</span><div><b>3dtrading</b><small>' + esc(w.idL) + ': 1024 3366 <span class="ba-cpi">' + I.cp + '</span></small>' +
        '<p><em class="g">' + esc(w.tags[1]) + '</em><em>' + esc(w.tags[0]) + '</em></p></div><span class="ba-ic go">' + I.chev + '</span></div>' +
        '<div class="ba-row ba-cs"><span class="ba-ic">' + I.head + '</span><span>' + esc(w.cs) + '</span><em>' + esc(w.csS) + '</em>' + I.chev + '</div>' +
        '<div class="ba-cards">' + w.cards.map(function (c) { return '<div><b>' + esc(c[0]) + '</b><small>' + esc(c[1]) + '</small></div>'; }).join('') + '</div>' +
        '<div class="ba-row ba-lite"><span><b class="ba-brandw">BINANCE</b> ' + esc(w.lite) + '</span>' + I.chev + '</div></div>';
    },
    /* r59 · 账号信息: card (name, 普通用户 corner badge, 币安 ID, 注册信息), rows 认证中心 / 账户安全 / 绑定社交账号 / 子账户, 退出 */
    info: function (w, cfg, o) {
      return '<div class="ba-app">' + nav(w.info) + '<div class="ba-card ba-ic2"><i class="ba-corner">' + esc(w.tags[0]) + '</i><div class="ba-me in"><span class="ba-av big">' + I.user + '</span><b>3dtrading</b></div>' +
        '<p><span>' + esc(w.uid) + '</span><em>1024 3366</em></p><p><span>' + esc(w.reg) + '</span><em>•••</em></p></div>' +
        '<div class="ba-list">' + w.rows.map(function (r, i) { return '<div class="ba-row"' + (i === 3 ? hot(o, 'subacc') : '') + '><span>' + esc(r[0]) + '</span><em' + (i === 0 ? ' class="g"' : '') + '>' + esc(r[1]) + '</em>' + I.chev + '</div>'; }).join('') + '</div>' +
        '<span class="ba-btn block ghost">' + esc(w.out) + '</span></div>';
    },
    /* 子账户 page (r59 screenshot): 账号管理 ▾ with 充值 / 划转 on the right, 子账户 (n) + filter, + 创建子账户, cards with ⋮ and 更多;
     * the ⋮ popover lists 转入 允许合约 启用期权 充值 划转 冻结 删除 (after 允许合约: 开通统一账户 is added, 允许合约 greyed). */
    sub: function (w, cfg, o) {
      var n = o.rows ? 1 : 0, body = nav(w.subT) +
        '<div class="ba-subh"><div class="ba-dd"' + hot(o, 'mgmt') + '><b>' + esc(w.mgmt) + '</b>' + I.tri + '</div><span class="ba-btn y sm">' + esc(w.dep) + '</span><span class="ba-btn sm">' + esc(w.xfer) + '</span></div>' +
        (o.toast ? '<div class="ba-toast">' + (o.toast === 'pm' ? I.sun + esc(w.pmWait) : I.ok + esc(w.ok1)) + '</div>' : '') +
        '<div class="ba-cnt"><u>' + esc(w.cnt) + ' (' + n + ')</u>' + I.filt + '</div>' +
        '<div class="ba-bar"' + hot(o, 'create') + '>+ ' + esc(w.create) + '</div>';
      /* r60 (Jasper): no extra sub-accounts from his own screenshots — only the one this guide creates */
      if (o.rows) body += subCard(w, o, 0);
      if (o.sheet === 'create') body += sheet(w.mT, '<small>' + esc(w.mType) + '</small><div class="ba-in sel">' + esc(w.mTypeV) + I.tri + '</div>' +
        '<small>' + esc(w.mName) + '</small><div class="ba-in focus">' + esc(cfg.nameEx) + '<i class="caret"></i></div><p class="ba-hint">' + esc(w.mHint) + '</p><p class="ba-hint">' + esc(w.mNote) + '</p>' +
        '<span class="ba-btn y block" data-t="ok">' + esc(w.ok) + '</span>');
      if (o.sheet === 'cf1') body += '<div class="ba-dim"></div><div class="ba-sheet"><div class="ba-sh"><span></span><span class="ba-ic">' + I.x + '</span></div><p class="ba-cf">' + esc(w.cf1) + '</p>' +
        '<div class="ba-two"><span class="ba-btn">' + esc(w.cancel) + '</span><span class="ba-btn y" data-t="cf">' + esc(w.ok) + '</span></div></div>';
      if (o.sheet === 'cf2') body += '<div class="ba-dim"></div><div class="ba-sheet c"><span class="ba-av big">' + I.user + '</span><h4>' + esc(w.tip) + '</h4><p class="ba-cf">' + esc(w.cf2) + '</p><p class="ba-cfn">' + esc(w.cf2n) + '</p>' +
        '<div class="ba-two"><span class="ba-btn">' + esc(w.cancel) + '</span><span class="ba-btn y" data-t="cf">' + esc(w.ok) + '</span></div></div>';
      if (o.sheet === 'mgmt') body += sheet(w.mgT, '<div class="ba-acts">' + w.mgRows.map(function (x, i) { return '<span' + (i === 1 ? ' data-t="apim"' : '') + '>' + esc(x) + (i === 0 ? '<i>✓</i>' : '') + '</span>'; }).join('') + '</div>');
      return '<div class="ba-app">' + body + '</div>';
    },
    /* API管理: six notes, API (0) + filter, 自成交预防, + 创建API; sheets: 选择API密钥类型 (自行生成 chosen), 上传公钥 (r59 screenshot:
     * 您的公钥 box, a help link, the PEM note, 下一步). The 您的公钥 box here is the guide's copy control for 3dtrading's public key. */
    api: function (w, cfg, o) {
      var en = w === W.en;
      var body = nav(w.subT, I.x) + '<div class="ba-dd"><b>' + esc(w.apiM) + '</b>' + I.tri + '</div>' +
        '<ol class="ba-notes">' + w.notes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
        '<div class="ba-cnt"><span>' + esc(w.api) + ' (0)</span>' + I.filt + '</div><div class="ba-bar y">' + esc(w.stp) + '</div>' +
        '<div class="ba-bar"' + hot(o, 'newapi') + '>+ ' + esc(w.newApi) + '</div>';
      if (o.sheet === 'type') body += sheet(w.kT,
        '<div class="ba-opt' + (o.sys ? ' on' : '') + '" data-t="optSys">' + I.keyA + '<div><b>' + esc(w.k1) + '</b><p>' + esc(w.k1p) + '</p></div>' + (o.sys ? '<i class="corner"></i>' : '') + '</div>' +
        '<div class="ba-opt' + (o.self ? ' on' : ' off') + '" data-t="optSelf"' + (o.self ? '' : ' aria-disabled="true"') + '>' + I.keyB + '<div><b>' + esc(w.k2) + '</b><p>' + esc(w.k2p) + '</p></div>' + (o.self ? '<i class="corner"></i>' : '') + '</div>' +
        '<span class="ba-btn y block" data-t="next">' + esc(w.next) + '</span>', 'tall');
      if (o.sheet === 'pub') body += sheet(w.pubT, '<small>' + esc(w.pubY) + '</small>' +
        '<button type="button" class="ba-in ba-ta ba-pk" data-copy="pub" aria-label="' + esc(en ? 'Copy 3dtrading’s full public key' : '复制 3dtrading 的完整公钥') + '"><code>' + esc(cfg.pubShort || '') + '</code><span class="cpi" aria-hidden="true">' + I.cp + '</span></button>' +
        '<p class="ba-link">' + esc(w.pubHow) + '</p><p class="ba-hint ba-pem">' + I.info + esc(w.pubPem) + '</p>' +
        '<span class="ba-btn y block" data-t="next2">' + esc(w.next) + '</span>', 'tall');
      if (o.sheet === 'label') body += sheet(w.cT, '<small>' + esc(w.cSub) + '</small><div class="ba-in sel">' + esc(w.vmail) + I.tri + '</div><small>' + esc(w.cLabel) + '</small><div class="ba-in focus">' + esc(cfg.labelEx) + '<i class="caret"></i></div>' +
        '<span class="ba-btn y block" data-t="next2">' + esc(w.next) + '</span>', 'mid');
      return '<div class="ba-app">' + body + '</div>';
    },
    /* r59 · 编辑API card (layout from Jasper's screenshot of the App's edit page): 编辑API with 保存 / 取消, a QR box (filled by the
     * guide with this site's own binding page, no key in it), 子账户, 标签 Ed25519 · 统一账户, the "copy now" warning, 公钥 (copy
     * 3dtrading's public key), API 密钥 = the guide's own input (from the first key step on), API权限 as a vertical list, and
     * IP访问限制 (无限制 carries Binance's red warning while chosen). parts: keys → iponly → ips → save → bind. */
    key: function (w, cfg, o, en) {
      /* r61 (Jasper): guide parts ip (只访问受信任的IP chosen + whitelist filled, tap it to copy) → perm (what we need ticked) →
       * bind (paste the API Key). The QR is a dark card, white code at the top left, 「扫码获取地址」 under it. */
      var part = o.part, open = part === 'save' || part === 'bind' || part === 'perm', ipsIn = part === 'ips' || part === 'ip' || open, tr = part !== 'keys' && part !== 'iponly';
      var LK = '<svg class="lk" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.6"/><path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7"/></svg>';
      var perms = permsOf(cfg).map(function (p) {
        var lock = !open && p.key !== 'read', on = p.key === 'read' || (open && p.required);
        return '<span class="ba-ck' + (on ? ' on' : '') + (lock ? ' lock' : '') + (open && !p.required ? ' skip' : '') + '"><i></i><u>' + esc(en ? p.en : p.zh) + '</u>' + (lock ? LK : '') + '</span>';
      }).join('');
      var ips = (cfg.kit && cfg.kit.ips) || [];
      var ipw = part === 'ip' ? ' data-t="ipw" data-copy="ips"' : ' data-copy="ips"';
      return '<div class="ba-app">' + nav(w.subT, I.x) + '<div class="ba-dd"><b>' + esc(w.apiM) + '</b>' + I.tri + '</div><div class="ba-key ba-ecard">' +
        '<div class="ba-eh"><b>' + esc(w.edit) + '</b><span class="ba-btn y sm"' + (part === 'save' ? ' data-t="save"' : '') + '>' + esc(w.save) + '</span><span class="ba-btn sm">' + esc(w.cancel) + '</span></div>' +
        '<div class="ba-qr" data-slot="qr"><div class="q"></div><span>' + esc(en ? 'Scan to get address' : '扫码获取地址') + '</span></div>' +
        '<small>' + esc(w.cSub) + '</small><p class="ba-v">' + esc(w.vmail) + '</p>' +
        '<small>' + esc(w.label) + '</small><div class="ba-kt"><span class="t1">Ed25519</span><span class="t2">' + esc(w.pm) + '</span><b>' + esc(cfg.labelEx) + '</b></div>' +
        '<p class="ba-warn">' + esc(w.warnK) + '</p>' +
        '<small>' + esc(w.pubL) + '</small><button type="button" class="ba-kv ba-pk" data-copy="pub" aria-label="' + esc(en ? 'Copy 3dtrading’s full public key' : '复制 3dtrading 的完整公钥') + '"><code>' + esc(cfg.pubShort || '') + '</code><span class="cpi" aria-hidden="true">' + I.cp + '</span></button>' +
        '<small>' + esc(w.key) + '</small><div class="ba-kv slot" data-slot="key"></div>' +
        '<small>' + esc(w.perm) + '</small><div class="ba-grid one"' + (part === 'perm' ? ' data-t="pg"' : '') + '>' + perms + '</div>' +
        (open ? '' : '<p class="ba-lockn">' + LK + esc(en ? 'Trading permissions unlock once trusted IPs are added.' : '添加受信任的 IP 后，才能勾选交易权限。') + '</p>') +
        '<b class="ba-ipt">' + esc(w.ipT) + '</b><div class="ba-rad' + (tr ? '' : ' on') + '"><i></i>' + esc(w.ipAny) + '</div>' + (tr ? '' : '<p class="ba-anyw">' + esc(w.anyW) + '</p>') +
        '<div class="ba-rad' + (tr ? ' on' : '') + '"' + (part === 'iponly' ? ' data-t="iponly"' : '') + '><i></i>' + esc(w.ipOnly) + '</div>' +
        (tr ? (part === 'ip' || open
          ? '<div class="ba-ipw"' + ipw + '><div class="ba-chips">' + ips.map(function (ip) { return '<span>' + esc(ip) + '<b>✕</b></span>'; }).join('') + '</div>' +
            '<div class="ba-in mute ba-ipin"><code>' + esc(ips.join(' ')) + '</code><b>' + esc(part === 'ip' ? (en ? 'Copy' : '复制') : w.ipOk) + '</b></div></div>'
          : '<div class="ba-chips">' + (ipsIn ? ips.map(function (ip) { return '<span>' + esc(ip) + '<b>✕</b></span>'; }).join('') : '') + '</div>' +
            '<div class="ba-in mute ba-ipin">' + esc(w.ipIn) + '<b' + (part === 'ips' ? ' data-t="ipadd"' : '') + '>' + esc(w.ipOk) + '</b></div>') : '') + '</div></div>';
    }
  };
  global.TD_BNAPP = {
    width: 390,
    words: W,
    kind: function () { return 'app'; },
    html: function (id, l, cfg, o) { var w = W[l] || W.zh; return S[id](w, cfg || {}, o || {}, l === 'en'); }
  };
})(window);
