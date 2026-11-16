
## 2026-11-10 12:10 缓存兼容（演示账户）
- 问题：新 bind.html 配上浏览器缓存里的旧 td-account.js（没有 isDemo）→ TypeError，露出 API 表单。
- bind.html / auth.html 里的 css/js 全部加 `?v=20261110-1210`；以后改公共模块要同步改这个版本号。td-account.js VERSION 升到 1.2.0。
- bind.html 自带兼容层：模块缺 isDemo/accountName/accountSub 时在本页补上，并自带演示账户中英文文案。
- 面板初始带 `boot` 类，表单隐藏；启动成功才移除。启动出错时只显示「请刷新」提示，不露表单。
- 测试：`_test/compat.js <旧 td-account.js>`，强制注入旧模块，中英文 × 1280/390。
- 后台（Grace）仍用不带版本号的 `/account/td-account.js`，那边的缓存不归我管。
