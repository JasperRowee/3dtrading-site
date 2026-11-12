# 绑定页币安复刻的依据（2026-11-11 核对）

`bind.html` 左侧是用代码复刻的币安网页示意（`bind-bn.js` + `bind-bn.css`），**不是截图，也不是实时页面**，页面不访问币安。账户名 `3dtrading`、UID `1024 3366`、子账户 `3dtusdt01_virtual@example.com`（example.com 是保留的示例域名）、余额 0.00 USDT 都是编造的示例，不打码；示例密钥写成 `EXAMPLE-3dtrading-apikey-0000-not-real` / `EXAMPLE-3dtrading-secret-0000-not-real`，含连字符，过不了表单的 64 位字母数字校验，不可能被当成真密钥提交。

## 依据
| 来源 | 日期 | 用到哪里 |
|---|---|---|
| excepta 配置指南 PDF（截图存于 `img/d02–d08`、`m11`） | 2026.10.10 | 中文界面文字、9 步顺序、菜单位置、权限格子、IP 输入框和确认按钮的位置 |
| Binance FAQ「How to Create API Keys on Binance」360002502072（EN） | 2026-11-06 更新 | System generated / Self-generated 两种密钥、Secret 只显示一次、IP 限制 |
| Binance FAQ「Sub-Account Functions and FAQ」360020632811（EN） | 2026-09-29 更新 | 子账户菜单、虚拟邮箱创建、子账户 API 管理 |
| 币安中文 FAQ（创建 API） | 2025-03-20 更新 | 中文按钮名「创建API」「系统生成」「自行生成」 |
| Binance 开发者文档 `GET /sapi/v1/account/apiRestrictions` | 2026-11-11 查阅 | 英文权限名：enableReading、enableSpotAndMarginTrading、enableMargin、enablePortfolioMarginTrading、permitsUniversalTransfer、enableWithdrawals、enableInternalTransfer、enableFutures、enableVanillaOptions |

## 币安 logo（官方文件，2026-11-11 取得）
官方品牌规范 design.binance.vision（binance.com/en-GB/press「Media Assets」链接）需要密码，打不开，所以用 binance.com 自己线上用的文件，不是手画或近似：
| 文件 | 来源 | 尺寸 | sha256 |
|---|---|---|---|
| `assets/binance/binance-logo-horizontal.png`（标志 + BINANCE 字标，英文界面用） | https://www.binance.com/en 页头 `<img alt="Binance">` 内嵌 PNG | 360×192 | af97178827aeed5637e1409ef17c63ef8215411b0537743af4f0a2748840c582 |
| `assets/binance/binance-mark.png`（标志，中文界面配「币安」文字，同指南截图 d02 的页头） | https://bin.bnbstatic.com/static/images/common/logo.png | 200×200 | 83eef421c3682a87d0a7107f6872a1e36222cb1623ade9211b817ee2dfc0059b |

商标归 Binance 所有；这里只用于说明“去币安哪里点”的演示，正式上线前需确认币安品牌使用条款。

## 9 个画面
1 打开子账户 · 2 创建子账户 · 3 虚拟邮箱创建 · 4 允许合约 · 5 开通统一账户 · 6 选择「系统生成」· 7 选子账户、填标签 · 8 立即复制两项密钥 · 9 权限与 IP 白名单。中文文字按指南截图逐字核对；英文按上面 FAQ 和开发者文档的叫法。

## 必须守住的规则（页面右侧和第 9 步都写明）
- 只用子账户的 API，不用主账户。
- 永远不开提现权限。
- 密钥只在本页内存中做格式检查，提交后立即清空，不写入 localStorage / sessionStorage / 日志。

## 不登录币安无法核实的项
- 统一账户子账户 API 权限格子在英文界面上的确切文字（目前用开发者文档字段名推出，如 Enable Spot & Margin Trading）。
- 英文界面是否写成「Spot, Margin & Stock」（中文指南是「现货、杠杆和股票交易」）。
- 英文界面「选择子账户」下拉框的确切标签。
- 子账户密钥页是否显示「允许提现」勾选项（如显示，必须保持不勾）。
- 币安当前线上界面是否已改版（指南截图是 2026.10.10 的）。
- 密钥页「保存」按钮的确切位置。

## 待团队确认
- IP 白名单：`47.236.171.168`、`47.245.58.251`（来自指南，`bind-steps.js` 里 `ipsConfirmed: false`，页面显示“待确认”）。
- 最少权限集合：指南勾选读取、现货杠杆、杠杆借币还款划转、统一账户交易、万向划转 5 项（`permsConfirmed: false`）。
