/* 3dtrading · Binance sub-account binding: made-up example values for the tutorial panels (bind-bn.js).
 * r38: IPs, the permission list, the public key and every failure text come from TDApi (account/api-adapter.js) —
 * never from this file. There is no Secret and no private key anywhere in the front end.
 * Where the tutorial wording comes from is recorded in account/BINANCE-SOURCES.md. */
window.TD_BIND = {
  source: { date: '2026-11-13', guide: '2026.10.10' },
  nameEx: '3dtUSDT01', labelEx: '3dtrading01',
  // made-up API Key for the tutorial only: hyphens make it fail the 64-character check, so it can never be submitted
  keyEx: 'EXAMPLE-3dtrading-apikey-0000-not-real',
  // r41 connect.html (HMAC): made-up Secret Key for the tutorial only, also fails the format check
  secretEx: 'EXAMPLE-3dtrading-secret-0000-not-real'
};
