# account/_test — r38 账户模块测试

jsdom 24 装在仓库外（不要把 node_modules 放进仓库）：

    npm i jsdom@24 --prefix /tmp/r38-tests

预览要先在 BASE 上跑（默认 http://127.0.0.1:8978，可用环境变量 BASE 改）。一次跑完全部：

    sh account/_test/run-all.sh          # 约 3–4 分钟

单个跑：`cd account/_test && NODE_PATH=/tmp/r38-tests/node_modules node <文件>.js`

| 文件 | 查什么 |
|---|---|
| `static.js` | 不用服务器。无 Secret 输入框、页面里无写死 IP/权限清单、无币安标志图片、无 fetch/XHR（只走 TDApi）、无 Key 形字符串、脚本版本 `?v=20261113-r38`、BINANCE-SOURCES.md |
| `e2e.js` | 注册（密码不存）→ 风险披露 → 选方案 → 绑定 ①–⑤：公钥卡、示意教程、单个 API Key 框（64 位、提交即清空、逐项打勾）、通过/未通过、问 Dodo、重测同一把公钥、安全红页、解绑提示、`?id=` 重测、en、390 |
| `statuses.js` | 8 个状态 + 未知 → 处理中 + 旧 pending → awaiting_key，行、正文、头像菜单，中英 |
| `codes.js` | 9 个失败码中英文案（getFailureText）、演示块逐个触发、两种安全码的全屏红页 |
| `demo.js` | 示例账户：不测试、不贴 Key、删除只提示 |
| `theme.js` | 默认/夜/日/非法值 × auth/onboard/bind × 1280/390，theme-color、菜单主题、不写 3dt.theme、storage 事件，语言往返 |
| `compat.js <旧 td-account.js>` | 浏览器缓存了 r31 的 td-account.js 时 bind/onboard 照常工作 |
| `site-lang.js` / `site-contract.js <site/index.html> <td-account.js>` | 官网内嵌的账户代码；当前官网没有内嵌块时打印 N/A |
| `lib.js` | 共用的 jsdom 加载器、seed（已登录 + 已同意协议）、K64 |
| `frames.html?u=<页面>&w=360,390,440&h=<高>` | 浏览器里并排看几种手机宽度 |
| `auth-frames.html?mode=login\|register` | 390×844 日/夜两框 |
| `scenes-fit.js` | 在 bind.html 控制台执行 `__fit(window)`，节选 4 段播完，检查点击目标都在框内（约 20 秒） |
