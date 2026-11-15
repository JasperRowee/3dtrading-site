# 币安绑定引导的依据（r44 更新，2026-11-16 核对）

r43 起，绑定入口 `connect.html`（`connect.js` + `bind-bn.js/.css`）改成**一屏聚光引导**：铺满全屏的是用代码画的币安网页**示意**（不是截图、不是实时页面、不嵌入币安、页面不访问币安），当前要操作的区域亮起，其余变暗，上方是简短步骤文字，配上一步/下一步，以及在需要的地方放复制按钮或输入框。每屏都标注「示意」，并提供「在币安打开」链接（跳转币安官网真实页面，由用户自己登录操作）。示意界面**从不要求输入币安登录信息或验证码**。

r44：去掉白色引导大卡片和「下一步」按钮，币安**示意**界面铺满可视区；直接点亮起的币安控件前进（头像 → 子账户 → 创建子账户 → … → 编辑权限 → 确认），旁边是一个深色半透明小提示，左上角保留 ‹ 返回和步骤点；复制按钮与 Key/Secret 输入框放进示意里对应的币安字段。两种密钥类型、提交接口（`submitApiCredentials`、`submitSelfGeneratedKey`）和「未配置」状态均**未改**；界面仍是示意，不是真实币安页面。

## 官方来源（2026-11-15 读取）
| 来源 | 页面日期 | 用到哪里 |
|---|---|---|
| Binance FAQ「How to Create API Keys on Binance」 https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072 | 2026-11-06 更新 | 两种密钥：System-generated（「use HMAC symmetric encryption」，「You'll get the API key and the Secret Key」）与 Self-generated（「use Ed25519 or RSA asymmetric encryption」，「provide the public key to Binance」，得到 API Key）；「Unrestricted-IP-Access HMAC API Key(s) won't have any permission other than reading」；提现须 IPv4 白名单 |
| Binance FAQ「Sub-Account Functions and FAQ」 https://www.binance.com/en/support/faq/sub-account-functions-and-frequently-asked-questions-360020632811 | 2026-09-29 更新 | 子账户菜单、虚拟邮箱子账户只能由母账户经 API 操作、在 [API Management] 为子账户创建 API Key（每个最多 30 个） |
| Spot API「Endpoint security type」 https://developers.binance.com/docs/binance-spot-api-docs/rest-api/endpoint-security-type | 2026-11-12 修改 | 「We support HMAC, RSA, and Ed25519 keys」；官方推荐 Ed25519；RSA 只支持 PKCS#8；默认不能 TRADE，须在 API Management 开启 |
| RSA 密钥对 FAQ https://www.binance.com/en/support/faq/how-to-generate-an-rsa-key-pair-to-send-api-requests-on-binance-2b79728f331e43079b27440d9d15c5db | 2022-12-29 发布 | 复制**公钥**粘贴到币安注册；「Do not share your private keys with anyone」 |
| Sub Account Quick Start https://developers.binance.com/docs/sub_account | 2026-11-12 修改 | 新建 Key 默认只有 Enable Reading；建议设 IP 限制；提现权限须在币安界面修改 |
| excepta 配置指南 PDF（`img/` 下截图） | 2026.10.10 | 中文按钮文字、菜单位置、权限格子（r38 起沿用） |

## 两条路径与本项目的对应
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
- 未限制 IP 的自行生成（Ed25519/RSA）Key 的权限限制（官方只对 HMAC 写明仅读取）。引导的权限步骤按类型分支：系统生成写明「不限 IP 的 HMAC 密钥只有读取权限」（官方原文）；自行生成只写「币安官方页面未写明，请按币安页面实际提示操作」，不推断。
