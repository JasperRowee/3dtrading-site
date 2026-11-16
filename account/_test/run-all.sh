#!/bin/sh
# Runs every r38 account test once against the preview (BASE, default http://127.0.0.1:8978).
# jsdom is NOT in the repo: npm i jsdom@24 --prefix /tmp/r38-tests   (or set NODE_PATH yourself)
cd "$(dirname "$0")"
export NODE_PATH="${NODE_PATH:-/tmp/r38-tests/node_modules}"
OLD=/tmp/r38-tests/old-td-account.js
[ -f "$OLD" ] || git show 802dc0d:account/td-account.js > "$OLD"
rc=0
for t in static.js e2e.js statuses.js codes.js demo.js theme.js auth-r45.js "compat.js $OLD" "site-lang.js ../../site/index.html ../td-account.js" "site-contract.js ../../site/index.html ../td-account.js"; do
  echo "===== node $t"; node $t || rc=1
done
echo "===== python3 _test/scan.py"; (cd ../.. && python3 _test/scan.py) || rc=1
echo; [ $rc = 0 ] && echo "RUN-ALL: ALL PASS" || echo "RUN-ALL: SOMETHING FAILED"; exit $rc
