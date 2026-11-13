/* 3dtrading · Binance sub-account binding: shared settings for bind.html and the coded carousel (bind-bn.js).
 * Where every label comes from is recorded in account/BINANCE-SOURCES.md.
 * ipsConfirmed / permsConfirmed stay false until the team confirms the production egress IPs and the minimum permission set. */
window.TD_BIND = {
  source: { date: '2026-11-11', guide: '2026.10.10' },
  // order as shown on the guide's key page (d08)
  ips: ['47.236.171.168', '47.245.58.251'],
  ipsConfirmed: false,
  permsConfirmed: false,
  publicEx: 'EXAMPLE-PUBLIC-KEY-3dtrading-NOT-REAL',
  privateEx: 'EXAMPLE-PRIVATE-KEY-3dtrading-NOT-REAL',
  nameEx: '3dtUSDT01', labelEx: '3dtrading01',
  // made-up keys for the tutorial only: hyphens make them fail the form's key check, so they can never be submitted
  keyEx: 'EXAMPLE-3dtrading-apikey-0000-not-real', secretEx: 'EXAMPLE-3dtrading-secret-0000-not-real',
  // the permission grid of a Portfolio Margin sub-account key, in Binance's order (3 columns on the web).
  // on: what the guide ticks. Withdrawals are not in this grid; if Binance shows them, they must stay off.
  perms: [
    { id: 'read', on: true, fixed: true, zh: '允许读取', en: 'Enable Reading' },
    { id: 'spot', on: true, zh: '启用现货、杠杆和股票交易', en: 'Enable Spot & Margin Trading' },
    { id: 'loan', on: true, zh: '允许杠杆质押借币、还款和划转', en: 'Enable Margin Loan, Repay & Transfer' },
    { id: 'pm', on: true, zh: '开启统一账户交易', en: 'Enable Portfolio Margin Trading' },
    { id: 'univ', on: false, zh: '允许万向划转', en: 'Permits Universal Transfer' },
    { id: 'pred', on: false, zh: '允许预测交易权限', en: 'Enable Prediction Trading' },
    { id: 'wl', on: false, edit: true, zh: '允许交易币对白名单', en: 'Enable Symbol Whitelist' }
  ]
};
