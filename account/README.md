# 3dtrading 账户 / 语言公共模块 · 接入说明（v1.1.0，演示版）

负责人：Sova。目录：`/Users/sen/.chorus2/workspaces/ba7a4ad4-cec3-4a41-85fe-153e0b18442b/3dtrading-account/`
统一预览（同源，localStorage 共享）：http://127.0.0.1:8796/ → `/site/` 官网 · `/app/` 后台方案二 · `/account/` 本模块。完整路线：官网 → 注册/登录 → 连接币安（可跳过）→ 方案二后台
**演示版：没有后端。** 注册/登录不校验密码、不存密码；绑定只做格式检查，密钥提交后立即清空、从不写入任何存储；“接入测试通过”只能由页面上标着“演示”的模拟按钮产生。禁止上线。

## 文件
| 文件 | 作用 |
|---|---|
| `td-account.js` / `td-account.css` | 公共模块：会话、币安账户列表、语言、共享头像菜单（样式全部在 `.tda-*` 下，不影响宿主） |
| `auth.html` | 注册 / 登录（`?mode=register|login&next=`），注册后进入 `bind.html?first=1` |
| `bind.html` | 连接币安子账户：左侧黑底轮播（代码复刻币安网页 9 个画面，自动切换、可手动上一步/下一步/暂停，字幕同步），右侧只有表单、反馈和「暂时跳过」。电脑一屏不滚动；手机上方轮播、下方紧凑表单 |
| `bind-bn.js`, `bind-bn.css` | 轮播里的币安复刻界面（中英两套文字）；不用截图、不访问币安、无类密钥字符串 |
| `bind-steps.js` | 共用设置：IP 白名单、权限格子、示例名称；`ipsConfirmed` / `permsConfirmed` |
| `BINANCE-SOURCES.md` | 复刻依据、核对日期、不登录无法核实的项 |
| `page.css`, `img/`, `assets/` | 页面样式、指南 PDF 截图（只作核对依据，页面不引用）、logo |

## 引入
```html
<script src="/account/td-account.js" data-site="/site/index.html" data-app="/app/index.html#/dashboard" defer></script>
```
`data-site` / `data-app` 可选；也可以用 `window.TD_ROUTES = {...}` 覆盖。auth/bind 地址跟随脚本所在目录。

## API：`window.TDAccount`
| 成员 | 说明 |
|---|---|
| `getSession()` | `{email,name,demo:true}` 或 `null` |
| `onChange(cb)` | 会话 / 账户 / 语言变化时回调 `{session,accounts,lang}`，返回取消函数 |
| `openMenu(anchor, opt?)` | 在宿主自己的头像按钮下切换共享菜单；`opt.context`: `'site'`(默认) / `'app'` / `'account'`；按钮或祖先有 `.lt` 用浅色，或传 `theme:'light'` |
| `mountMenu(btn, opt)` | 让模块自己绑定点击（opt 同上，另有 `items`、`onSwitch`、`logoutTo`） |
| `accounts()` | `{list:[{id,name,uid,label,status:'pending'|'verified'|'failed',reason?}], active:'all'|id}` |
| `DEMO_ID` / `isDemo(a|id)` / `accountName(a)` / `accountSub(a)` | 后台种下的演示子账户（id `demo-binance`）：名称和副标题随语言（「示例账户 / Sample account」「示例数据 · 未连接币安」；`displayName(s)` 把自动创建的默认身份（新「3dtrading 用户」、旧「演示用户」）显示为「3dtrading 用户 / 3dtrading user」，不改存储，自定义名字原样）；其他账户原样返回名称 |
| `setActive(id)` | 切换当前账户（`'all'` = 全部） |
| `requireUser(next?)` | 未登录跳到登录页并带回跳地址，返回 false |
| `lang()` / `setLang('zh'|'en')` | 共享语言 |
| `logout({redirect:false})` | 退出（默认回官网） |
| `routes` | `site, app, dashboard, me, auth, signup, login, bind` |

## 存储与事件（各页面一致）
- localStorage：`3dt.lang`、`3dt.session`、`3dt.demoUsers`、`3dt.accounts:<email>`（只有名称、UID、备注、状态；**没有密钥**）。
- window 事件：`td:lang`、`td:session`、`td:accounts`、`td:account`（兼容官网）。模块也会发出 `3dt:lang`（`detail.from==='td-account'`），并监听宿主的 `3dt:lang` 和 `langchange`。存在后台的 `window.I18N.set` 时会同步调用。
- 跨标签页：通过 `storage` 事件同步。

## 官网（Nova）—— 已接入
已完成：`account` 软链接、脚本标签、`#td-account-slot` 加 `openMenu`、`td:lang` 监听。契约测试：未登录显示注册/登录 → 注册后变头像 → 点击打开菜单、再点关闭 → `.lt` 浅色 → 切英文后重建的头像仍可用 → 退出变回注册/登录（9/9）；语言双向同步无循环（5/5）。

## 后台（Grace）—— 待接入
1. 加上面的脚本标签（`/account/td-account.js`）。
2. 进入后台先调用 `TDAccount.requireUser()`。
3. 头像：`TDAccount.mountMenu(document.getElementById('avBtn'), {context:'app', theme:'light'})`，替代 `#avMenu`；或在自己的点击处理里调用 `openMenu(avBtn, {context:'app', theme:'light'})`。
4. 账户切换器：用 `TDAccount.accounts()` 渲染，替代写死的 `ACCTS`，监听 `td:accounts`，切换时调用 `setActive(id)`。
5. 把所有 `#/bind` 链接改成 `TDAccount.routes.bind`（新增用 `+ '?add=1'`，重新校验用 `?id=<id>`）。旧的模拟绑定页可以删除；其中“只读 + 交易权限”与 PDF 不符（PDF 要求开 5 项：读取、现货及杠杆交易、杠杆质押借币还款划转、统一账户交易、万向划转，关闭提现）。
6. 语言：模块已与 `I18N` 双向同步（`3dtrading.dash.lang` ↔ `3dt.lang`）；如果改用 `3dt.lang` 更简单。
7. 未登录 / 无账户 / 账户状态 pending、failed 时，后台应显示对应空态，不展示假数据为“已连接”。

## 教程替换（团队核实后）
改 `bind-steps.js`：`ipsConfirmed` / `permsConfirmed` 改为 `true`，页面自动去掉“待确认”标签；界面文字改 `bind-bn.js` 里的 `W.zh` / `W.en`，依据记在 `BINANCE-SOURCES.md`。

## 真实后端需要的接口（缺口）
`POST /auth/register|login|logout`、`GET /me`（httpOnly 会话 cookie）；`POST /binance/accounts`（服务端加密保存密钥，并测试 API：权限、IP 白名单、统一账户），`GET /binance/accounts`，`POST /binance/accounts/:id/verify`，`DELETE /binance/accounts/:id`。接入后把 `register/login/upsertAccount/verify` 换成请求即可，页面结构不用改。

## 演示子账户（11:55）
绑定页、共享菜单里的 `demo-binance`：名称随语言，副标题写“未连接币安”，状态点是灰色；不显示重新校验、不进 API 表单、没有模拟接入测试按钮；`?id=demo-binance` 打开说明卡；可两次确认删除；普通账户的重新校验不变。测试：`_test/demo.js`（20 项）。

## r20（2026-11-12）：多子账户、节选动画、去掉电脑版/手机版切换
**多子账户契约（后台照此读取，结构未变）**
- 一次提交多组 = 多次 `upsertAccount`，每组一条：`{id, name, uid, label, device:'web', status:'pending', reason:'', at, checkedAt}`，存于 `3dt.accounts:<email>` 的 `list`；`active` 设为本次最后保存的那条。
- 字段只有这些，**没有 Key / Secret**：密钥只在表单内存中比较格式与是否重复，校验后立即清空，不写入任何存储或日志。
- 状态：前端只会写 `pending`（显示「待接入测试 / Awaiting connection test」）。`verified` / `failed` 只来自绑定页的「演示：模拟」按钮，页面标明是模拟；真实状态需服务端接口。
- 逐组校验：名称必填、不与已有账户或本次其他组重名（不分大小写）；UID 6–12 位数字、不重复；Key/Secret 各 64 位字母数字、两者不同、不与本次其他组复用。通过的组立即保存并移出表单，失败的组保留名称/UID/标签与各自错误，密钥清空需重贴；顶部提示「已保存 N 个（待接入测试），M 个没有保存」，用错误样式，不出成功页。
- 一次最多 8 组；重新校验（`?id=`）只有一组，不能加组；「暂时跳过」直接回后台，不建账户。

**节选动画**：电脑和手机共用一个自动播放的节选，取自 `bind-bn.js` 的 4 个画面（创建子账户、创建 API、复制两项密钥、权限与 IP 白名单），只有一行短说明和一个暂停键；没有编号、上一页/下一页和分页。失败页「看权限与 IP 示意」跳到最后一个画面并暂停。

**电脑版/手机版切换已去掉**：`td-account.js` 不再挂切换按钮，页面按宽度自适应；加载时清掉旧的 `3dtrading.dash.layout='phone'`。`phone.html` 只剩跳回原页（`?u=` 同源）的兜底，旧书签不会死循环。后台自己的 `#layTg` 按钮和 `index.html` 开头的跳转脚本属于后台，需后台移除（现在点「手机版」会立即跳回，不会卡住）。

**登录/注册页手机顶栏**：顶栏改为 `position:fixed` + 安全区高度，`overscroll-behavior-y:none`，内容从顶栏下方开始；聚焦输入框时若被顶栏或键盘挡住，自动滚到可见位置（`visualViewport`）。iOS 真机的橡皮筋回弹与真实键盘未在真机验证。

**日夜模式**：账户页暂时保持深色；官网/后台的日夜开关存储键确定后再接。

## r21（2026-11-12）：日夜继承、示例数据说明
- 日夜契约（与官网一致）：`localStorage['3dt.theme']` = `'day'|'night'`，`html[data-theme]` 同值，缺省或其他值一律 night。auth.html / bind.html 在 `<head>` 内联读取，只读不写；返回官网后官网自己再读同一个值，所以选择保持。
- `day.css`：所有规则都限定在 `html[data-theme=day]` 下，内容是浅色顶栏、深色字标、白卡片、白输入框和状态色。bind 节选的 `.stage` 保持黑底（按既定要求），`bind-bn.css` 没改。夜间不加载任何新样式。
- `td-account.js` 1.3.1：
  - 新增 `TDAccount.theme()`；
  - 新增 `td:theme` 事件，其他标签页改了 `3dt.theme` 时会同步；
  - 菜单和语言切换的主题可以传函数；
  - 到达遮罩跟随日夜。
  - 后台没有 `data-theme`，所以仍是白底，不受影响。
- 文案：
  - 菜单头部去掉“演示”徽章；
  - 菜单底部改为“示例数据 · 账号与子账户只保存在本机浏览器，未连接币安，也没有真实校验。”；
  - `acct.st.verified` 改为“测试通过 · 未连接币安”（与后台一致；只表示绑定页测试结果，不是真实币安校验）；
  - 演示子账户副标题改为“示例数据 · 未连接币安”。
- bind.html 自己的“演示”标签改名为 `bind.demoTag`，不再覆盖共享的 `demo.badge`。
- 测试：`_test/theme.js`。
