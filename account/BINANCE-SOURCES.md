# 币安绑定引导的依据（r46 更新，2026-11-16 核对）

r43 起，绑定入口 `connect.html`（`connect.js` + `bind-bn.js/.css`）改成**一屏聚光引导**：铺满全屏的是用代码画的币安网页**示意**（不是截图、不是实时页面、不嵌入币安、页面不访问币安），当前要操作的区域亮起，其余变暗，上方是简短步骤文字，配上一步/下一步，以及在需要的地方放复制按钮或输入框。每屏都标注「示意」，并提供「在币安打开」链接（跳转币安官网真实页面，由用户自己登录操作）。示意界面**从不要求输入币安登录信息或验证码**。

r44：去掉白色引导大卡片和「下一步」按钮，币安**示意**界面铺满可视区；直接点亮起的币安控件前进（头像 → 子账户 → 创建子账户 → … → 编辑权限 → 确认），旁边是一个深色半透明小提示，左上角保留 ‹ 返回和步骤点；复制按钮与 Key/Secret 输入框放进示意里对应的币安字段。两种密钥类型、提交接口（`submitApiCredentials`、`submitSelfGeneratedKey`）和「未配置」状态均**未改**；界面仍是示意，不是真实币安页面。

## r46 变更（2026-11-16）
- **一个币安界面**：去掉外层白色导航和昼夜开关。页面只有一条币安风格深色顶栏：左边 3dtrading Logo（点了回后台 `app/`，不回官网），中间是三个大步骤（开通子账户 / 创建API / 绑定API）和「跳过」，右边只保留币安「我的」往右的图标（头像、钱包、消息、下载、地球）。地球是我们真实的语言切换，其余图标只是示意。页面固定深色，不读不写任何昼夜存储，后台切昼夜也不会影响它。手机同理。
- **恢复「选择API密钥类型」页面**：真实币安在「+ 创建API」后先弹这个页面（Excepta 指南 p6 桌面、p19 手机左图：系统生成 / 自行生成）。r45b 跳过了它，这一版按真实顺序画出来：演示光标先点「系统生成」（亮黄角标），再点「下一步」，接着进入标签页。「自行生成」按币安原样画出，但**从不被选中**，也没有后续路线（按要求不做）。文字说明用中性描述（HMAC：币安生成 API Key 和 Secret Key；Ed25519/RSA：你提供公钥）。
- 三个大步骤、步骤内循环、提前点击立即前进并取消旧计时、跳过和进度条跳转都保留；提交仍走原契约 `TDApi.submitApiCredentials`（未改），只检查格式，账户一直「未连接」，不访问币安、不保存密钥。
- 测试：`account/_test/e2e.js`、`theme.js`（jsdom），`tools/connect-r46.mjs`（真实 Chrome，桌面/手机/矮屏 × 中英）。

## r45 / r45b 变更（2026-11-16）
- **（r46 已改回：类型页面重新画出，见上）只用系统生成密钥（HMAC），不出现密钥类型二选一（r45b）**：桌面示意在「API管理」直接点「+ 创建API」进入标签页，手机示意同样不画「选择API密钥类型」弹窗。真实币安 App/网页**有**这个弹窗（Excepta p19 左图：系统生成 / 自行生成），演示按要求略过，提示文字写明「系统生成密钥」。我们只收 API Key + Secret Key，提交仍走原契约 `TDApi.submitApiCredentials`（未改）；`submitSelfGeneratedKey` 保留在适配层但此页不调用。
- **进度只有三个大步骤**：开通子账户 → 创建API → 绑定API。假光标移到要点的按钮上停留后自动进下一个小步骤；最后一个小步骤之后回到同一大步骤第一个小步骤，**永不自动跨大步骤**。演示从不输入、从不点「连接并验证」、从不显示成功。
- **手机（<760px）全程在币安 App 内（r45b 更正）**：r45 曾画成「App 进到子账户后转手机网页」，并在 bn-app.js 注释里说官方 FAQ 明确支持该路径——**两点都不对**，已改。依据是已提供的 Excepta 指南手机版第 11–23 页的 26 张真实 App 截图（指南 2026.10.10，截图拍于 2026-04-28）：☰ → 个人中心头像卡片 › → 账号信息 → 子账户 → + 创建子账户（虚拟邮箱创建）→ ⋮ 允许合约 → 确认 → ⋮ 开通统一账户 → 确认 → 账号管理 ▾ → API管理 → + 创建API →（密钥类型，演示略过）→ 子账户 + API 标签 → 下一步 →（通行密钥验证，演示不画）→ 编辑API：API 密钥 / 密钥 Copy、API权限、只访问受信任的IP → 保存。逐页对照表与参考图：`_evidence/reference/excepta-phone/README.md`。
- 币安官方页面（下表）**没有**这些 App 画面的截图或逐步说明；手机布局只来自上述截图，不由官方文字推导。
- 桌面仍是币安网页示意（bind-bn.js），手机是 App 示意（bn-app.js）；两者都是代码画的**示意**，不是截图、不访问币安。手机示意用深色配色（参考截图为浅色模式），只照布局、文字和位置。

### r45 官方来源（2026-11-16 读取）
| 来源 | 页面日期 | 结论 / 用在哪里 |
|---|---|---|
| How to Create API Keys on Binance https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072 | 发布 2018-04-09，更新 2026-11-06 | System-generated「use HMAC symmetric encryption. You'll get the API key and the Secret Key」→ 我们只用这一种。App 路径「tap [More]」→「[Others]」→「[API Management]」→「[Create API]」（主账户）；网页路径 [Profile]-[Account]→[API Management]。「Verify with your 2FA devices or passkeys」→ 引导写「由你本人完成安全验证」。未写明 Secret 是否只显示一次。 |
| Binance Sub-Account Function Available on Binance App Now! https://www.binance.com/en/support/announcement/binance-sub-account-function-available-on-binance-app-now-9bd4f648be424ed291e0de95fcdf6f83 | 发布 2022-06-09，2023-01-30 更新 | App 端子账户只写明 [My Account] > [Sub Account] > [Asset Management]（查看资产）；未写明 App 可创建子账户或子账户 API → 手机引导在 App 找到子账户后转网页完成。 |
| Sub-Account Functions and FAQ https://www.binance.com/en/support/faq/binance-sub-account-functions-and-frequently-asked-questions-360020632811 | 2026-09-29 更新 | 网页 Profile → Sub-Accounts →「+ Create Sub Account」，虚拟邮箱子账户只能由母账户经 API 操作；子账户 API 在网页 [API Management] 创建。 |

| Excepta 配置指南 PDF 手机版 p11–23（26 张 App 截图） | 指南 2026.10.10，截图 2026-04-28 | 手机 App 全部画面的布局、中文文字、菜单位置（r45b） |

### r45b 未能核实（需登录真实币安 App）
- 2026-04-28 之后 App 是否改版；当前真实 App 的逐字文字与位置。
- 英文 App 的按钮名（手机英文为我方对中文截图的翻译）。
- 确认开通统一账户、创建 API 时的币安安全验证画面（未画）。
- 真机 iPhone 效果与剪贴板复制（只在无头浏览器 390 宽测过）。

## 官方来源（2026-11-15 读取）
| 来源 | 页面日期 | 用到哪里 |
|---|---|---|
| Binance FAQ「How to Create API Keys on Binance」 https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072 | 2026-11-06 更新 | 两种密钥：System-generated（「use HMAC symmetric encryption」，「You'll get the API key and the Secret Key」）与 Self-generated（「use Ed25519 or RSA asymmetric encryption」，「provide the public key to Binance」，得到 API Key）；「Unrestricted-IP-Access HMAC API Key(s) won't have any permission other than reading」；提现须 IPv4 白名单 |
| Binance FAQ「Sub-Account Functions and FAQ」 https://www.binance.com/en/support/faq/sub-account-functions-and-frequently-asked-questions-360020632811 | 2026-09-29 更新 | 子账户菜单、虚拟邮箱子账户只能由母账户经 API 操作、在 [API Management] 为子账户创建 API Key（每个最多 30 个） |
| Spot API「Endpoint security type」 https://developers.binance.com/docs/binance-spot-api-docs/rest-api/endpoint-security-type | 2026-11-12 修改 | 「We support HMAC, RSA, and Ed25519 keys」；官方推荐 Ed25519；RSA 只支持 PKCS#8；默认不能 TRADE，须在 API Management 开启 |
| RSA 密钥对 FAQ https://www.binance.com/en/support/faq/how-to-generate-an-rsa-key-pair-to-send-api-requests-on-binance-2b79728f331e43079b27440d9d15c5db | 2022-12-29 发布 | 复制**公钥**粘贴到币安注册；「Do not share your private keys with anyone」 |
| Sub Account Quick Start https://developers.binance.com/docs/sub_account | 2026-11-12 修改 | 新建 Key 默认只有 Enable Reading；建议设 IP 限制；提现权限须在币安界面修改 |
| excepta 配置指南 PDF（`img/` 下截图） | 2026.10.10 | 中文按钮文字、菜单位置、权限格子（r38 起沿用） |

## 两条路径与本项目的对应（r43–r44 历史；r45 起引导只走系统生成，自行生成仅保留在适配层，页面不再呈现）
- **系统生成（HMAC，默认路径）**：创建子账户 → 虚拟邮箱 → 开合约 → 统一账户 → 选「系统生成」→ 标签 → 币安给出 API Key + Secret Key → 权限/IP → 在我们这里输入 API Key 与 Secret → 验证状态。前端只做格式校验后交给原 HMAC 适配契约 `TDApi.submitApiCredentials({ name, apiKey, secret })`（r42 已有，r43 **未改**），**未改签名方案和交易权限**。权限与 IP 由 `TDApi.getConnectKit()` 提供。
- **自行生成（Ed25519/RSA）**：多一步「粘贴 3dtrading 的公钥」。公钥只能由真实服务经 `TDApi.getConnectKit().selfGenerated.publicKey` 提供（r43 在 getConnectKit 返回值中新增 `selfGenerated`、`allowIps` 两个字段，当前均为未配置：`supported:false`、`publicKey:null`、`allowIps:null`）；显示「未配置」，复制按钮禁用，页面里没有任何公钥文本，**私钥永远不在前端**。随后只输入 API Key（没有 Secret），交给 r43 **新增**的前端占位提交接口 `TDApi.submitSelfGeneratedKey({ name, apiKey })`：只做格式校验，固定返回 `PUBLIC_KEY_NOT_CONFIGURED`、未连接、不保存；**后面没有任何真实签名或验证服务**。
- IP 白名单同样只来自服务（`getConnectKit().allowIps`）；未配置时显示「未配置」并禁用复制，**从不复制示例 IP**。旧绑定页 `bind.html` 仍按原样使用 `getBindKit`。

## 支持 / 示意 边界
| 项 | 状态 |
|---|---|
| HMAC Key+Secret 格式校验、提交后清空、Key/Secret 不写 localStorage/sessionStorage | 已实现、已测 |
| 原 HMAC 适配契约 submitApiCredentials | 保留未改 |
| submitSelfGeneratedKey（自行生成） | r43 新增的前端占位接口：仅格式校验，固定未连接，无真实签名/验证服务 |
| getConnectKit | 原有字段不变；r43 新增 allowIps、selfGenerated（均未配置） |
| 验证服务（真实连通币安测试） | **未接入** → 显示「账户未连接 / 验证服务未接入」，不假通过、不创建账户 |
| 3dtrading 公钥、服务器 IP 白名单 | **未配置** → 显示未配置、复制禁用 |
| 币安界面复刻 | **仅示意**，不可当真实币安页面操作；文字可能与币安当前界面略有出入 |

## 必须守住的规则
- 只用子账户 API，不用主账户；永远不开提现权限。
- 公钥/私钥/Secret/API Key 不混淆：给币安的是公钥（明确标注）；私钥绝不在前端出现。
- Secret 不持久化；提交后输入框立即清空。

## 无法在不登录币安的情况下核实
- 币安当前英文界面的逐字按钮名与权限格子文字。
- Secret Key 是否只展示一次：本次读取的官方页面未写明；引导文案**不作此断言**，只提示「完成当前步骤前妥善保存 Secret Key，并按币安页面的实际提示操作」，属待登录核实项。
- 未限制 IP 的自行生成（Ed25519/RSA）Key 的权限限制（官方只对 HMAC 写明仅读取）。r45 起引导只有系统生成；权限步骤只亮「只访问受信任的IP」，不另写权限限制结论（官方对不限 IP 的 HMAC 写明仅读取）；自行生成不再出现，不作推断。
