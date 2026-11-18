/* r67 · 3dtrading 资源中心的全部内容。只写本项目已有的产品事实；示例数字一律标「示例」。
   每篇：slug（固定链接 #/slug）、cat（article | notice | guide）、date、min（阅读分钟）、zh / en 各自 { t 标题, d 摘要, b 正文 HTML }。 */
window.BLOG_POSTS = [
{
  slug: 'r67-update', cat: 'notice', date: '2026-11-18', min: 2, pin: true,
  zh: { t: '后台更新：账号安全设置、Dodo 斜杠命令、资源中心上线',
    d: '设置里可以改密码了，Dodo 支持 / 命令和更丰富的图表回复，教程和公告集中到资源中心。',
    b: `<p>这次更新集中在三处：账号安全、Dodo，以及你正在看的资源中心。</p>
<h2>设置 · 账号安全</h2>
<p>在后台右上角打开「我的 → 设置 → 账号」，新增了<b>修改密码</b>等账号安全选项。设置以居中小窗打开，改完直接关闭即可回到原来的页面。</p>
<h2>Dodo · 斜杠命令</h2>
<p>在 Dodo 页面的输入框里输入 <code>/</code>，会弹出命令列表，继续打字可以筛选。命令名称跟随界面语言：中文界面显示中文命令，英文界面显示英文命令。</p>
<ul><li>收益、订单、手续费、当日盈亏拆解等都可以用命令直接调出。</li>
<li>回复里会带上折线图、柱状图等可视化，点图上的点或段可以跳到后台对应的位置。</li></ul>
<p>具体用法见教程<a href="#/dodo-slash">《用 Dodo 斜杠命令快速查账户》</a>。</p>
<h2>资源中心</h2>
<p>文章、公告和教程放在同一处，官网和后台都能进入。每篇都有固定链接，可以直接复制给别人。</p>
<h2>绑定币安窗口更简洁</h2>
<p>后台里的绑定窗口只保留五项：账户名称、公钥、IP 白名单、权限配置、API Key。完整步骤仍可以在资源中心的绑定教程里查看。</p>` },
  en: { t: 'Dashboard update: account security, Dodo slash commands and the Resource Center',
    d: 'You can now change your password in Settings, Dodo answers / commands with richer charts, and guides and notices live in one place.',
    b: `<p>This update touches three places: account security, Dodo, and the Resource Center you are reading now.</p>
<h2>Settings · Account security</h2>
<p>Open <b>Me → Settings → Account</b> in the dashboard. New account-security options, starting with <b>Change password</b>, are there. Settings opens as a centred window; close it to return to where you were.</p>
<h2>Dodo · Slash commands</h2>
<p>Type <code>/</code> in Dodo's input box to open the command list, then keep typing to filter. Command names follow the interface language.</p>
<ul><li>Profit, orders, fees and the daily P&amp;L breakdown can each be called up with a command.</li>
<li>Replies include line and bar charts; tapping a point or a bar takes you to the matching place in the dashboard.</li></ul>
<p>See the guide <a href="#/dodo-slash">Use Dodo slash commands to check your account</a>.</p>
<h2>Resource Center</h2>
<p>Articles, notices and guides now sit together and can be opened from both the website and the dashboard. Every post has a fixed link you can share.</p>
<h2>A simpler Binance binding window</h2>
<p>The binding window in the dashboard now keeps five rows only: account name, public key, IP whitelist, permissions and API Key. The full walkthrough stays in the binding guides here.</p>` }
},
{
  slug: 'funds-stay-in-your-account', cat: 'article', date: '2026-11-17', min: 4,
  zh: { t: '资金始终在你自己的币安账户里',
    d: '本金留在你本人的币安子账户，提现永远关闭。3dtrading 能做什么、不能做什么，一次说清。',
    b: `<p>3dtrading 的前提是：<b>你的账户，我们的策略</b>。资产不转给我们保管，策略在你本人的币安子账户里运行。</p>
<h2>钱在哪里</h2>
<p>本金始终留在你本人的币安子账户。你随时可以登录币安查看余额、持仓和每一笔成交。</p>
<h2>我们能做什么</h2>
<ul><li><b>下单与调仓</b>：按策略在你的子账户里建立、兑现和补回仓位。</li>
<li><b>万向划转</b>：只用于在你这个子账户自己的钱包之间调度保证金。任何不是系统计划内发起的划转，都会立即停机并通知你。</li></ul>
<h2>我们不能做什么</h2>
<ul><li><b>提现永远关闭</b>。API 不开提现权限，资产无法被转出你的账户体系。</li>
<li>能下单的私钥只在我们隔离的签名服务器里，从不经过网页；网页也不保存、不发送你的 API Key。</li></ul>
<h2>钥匙只认我们的服务器</h2>
<p>绑定时，你在币安上传 3dtrading 给你的<b>公钥</b>，币安生成 API Key。这把钥匙设置了 IP 白名单，只接受来自我们服务器 IP 的请求。即使 API Key 被别人看到，从其他地址也无法使用。</p>
<div class="note"><b>和托管有什么不同</b>　不必为增强收益交出本金保管权：子账户自持资产，多空配对与保证金监控管理风险。</div>
<p>具体怎么绑定，见<a href="#/bind-desktop">电脑绑定教程</a>和<a href="#/bind-phone">手机绑定教程</a>。</p>` },
  en: { t: 'Your funds always stay in your own Binance account',
    d: 'Your principal stays in your own Binance sub-account and withdrawals are always off. What 3dtrading can and cannot do.',
    b: `<p>3dtrading starts from one rule: <b>your account, our strategy</b>. Your assets are never handed to us; the strategy runs inside your own Binance sub-account.</p>
<h2>Where the money is</h2>
<p>Your principal always stays in your own Binance sub-account. You can log in to Binance at any time and see the balance, positions and every fill.</p>
<h2>What we can do</h2>
<ul><li><b>Place and adjust orders</b>: open, realise and restore positions in your sub-account according to the strategy.</li>
<li><b>Universal Transfer</b>: used only to move margin between the wallets of that same sub-account. Any transfer the system did not plan stops the strategy at once and notifies you.</li></ul>
<h2>What we cannot do</h2>
<ul><li><b>Withdrawals are always off.</b> The API has no withdrawal permission, so assets cannot leave your account.</li>
<li>The private key that can trade lives only on our isolated signing servers and never passes through a web page. The website neither stores nor sends your API Key.</li></ul>
<h2>The key only answers our servers</h2>
<p>When you bind, you upload the <b>public key</b> 3dtrading gives you, and Binance generates the API Key. That key is limited to an IP whitelist, so it only accepts requests from our servers' IPs. Even if someone sees the API Key, it does not work from anywhere else.</p>
<div class="note"><b>How this differs from custody</b>　You don't give up custody of your principal to enhance returns: the sub-account holds the assets, while long/short pairing and margin monitoring manage the risk.</div>
<p>To bind, see the <a href="#/bind-desktop">desktop guide</a> or the <a href="#/bind-phone">phone guide</a>.</p>` }
},
{
  slug: 'bind-desktop', cat: 'guide', date: '2026-11-17', min: 5,
  zh: { t: '电脑绑定币安 API：从子账户到 API Key',
    d: '在电脑浏览器上创建子账户、开通合约与统一账户，再用 3dtrading 的公钥生成 API Key。',
    b: `<p>整个过程分三大步：<b>准备子账户 → 在币安创建 API → 回后台填 API Key</b>。每一步需要的安全验证都由你本人在币安完成。</p>
<h2>第一步 · 准备子账户</h2>
<ol><li>登录币安，打开「子账户」，点「+ 创建子账户」。</li>
<li>在新子账户右上角点「⋮」，点「允许合约」并确认。</li>
<li>再点「⋮」开通<b>统一账户</b>。统一账户更新完成后，就可以为这个子账户创建 API。</li></ol>
<h2>第二步 · 在币安创建 API</h2>
<ol><li>进入 API 管理，选择「自行生成」的方式，选中刚才的子账户，填一个标签。</li>
<li><b>公钥</b>：在 3dtrading 后台的绑定窗口复制公钥，粘贴进币安的「您的公钥」，点「下一步」，完成安全验证。</li>
<li><b>IP 访问限制</b>：选「只访问受信任的 IP」，把后台给出的 IP 白名单粘贴进去，点「确认」。详见<a href="#/ip-whitelist">《IP 白名单怎么填》</a>。</li>
<li><b>权限</b>：IP 加好后权限会解锁。只勾选下面 5 项，其余不勾，点「保存」并完成验证：
<ul><li>允许读取</li><li>启用现货、杠杆和股票交易</li><li>允许杠杆质押借币、还款和划转</li><li>开启统一账户交易</li><li>允许万向划转</li></ul></li>
<li>保存后币安会生成 API Key，点复制。</li></ol>
<h2>第三步 · 回后台绑定</h2>
<p>回到 3dtrading 后台，打开绑定窗口，依次是<b>账户名称、公钥、IP 白名单、权限配置、API Key</b>。粘贴 API Key，点「绑定」即可。</p>
<div class="note"><b>为什么没有 Secret Key</b>　自行生成的 API 只有 API Key，没有 Secret Key。网页不保存、不发送你的 API Key。</div>
<p>想绑定多个子账户，换一个子账户从第一步再走一遍，并用不同的账户名称区分。</p>` },
  en: { t: 'Bind a Binance API on desktop: from sub-account to API Key',
    d: 'Create a sub-account, enable futures and Portfolio Margin, then generate an API Key with 3dtrading\'s public key.',
    b: `<p>Three big steps: <b>prepare a sub-account → create the API on Binance → paste the API Key in the dashboard</b>. Every security check on Binance is done by you.</p>
<h2>Step 1 · Prepare a sub-account</h2>
<ol><li>Log in to Binance, open <b>Sub-accounts</b> and click <b>+ Create Sub-account</b>.</li>
<li>Click <b>⋮</b> at the top right of the new sub-account, choose <b>Enable Futures</b> and confirm.</li>
<li>Click <b>⋮</b> again to open <b>Portfolio Margin</b>. When the upgrade finishes you can create an API for this sub-account.</li></ol>
<h2>Step 2 · Create the API on Binance</h2>
<ol><li>Go to API Management, choose the <b>self-generated</b> type, pick the sub-account and give it a label.</li>
<li><b>Public key</b>: copy the public key from the binding window in the 3dtrading dashboard, paste it into <b>Your public key</b>, click Next and pass the check.</li>
<li><b>IP access</b>: choose <b>Restrict to trusted IPs</b>, paste the IP whitelist from the dashboard and confirm. See <a href="#/ip-whitelist">How to fill in the IP whitelist</a>.</li>
<li><b>Permissions</b> unlock once the IPs are added. Tick only these 5, leave the rest, click Save and pass the check:
<ul><li>Enable Reading</li><li>Enable Spot &amp; Margin Trading</li><li>Enable Margin Loan, Repay &amp; Transfer</li><li>Enable Portfolio Margin Trading</li><li>Permits Universal Transfer</li></ul></li>
<li>Binance then shows the API Key. Copy it.</li></ol>
<h2>Step 3 · Bind in the dashboard</h2>
<p>Open the binding window in the 3dtrading dashboard. It lists <b>account name, public key, IP whitelist, permissions and API Key</b>. Paste the API Key and click <b>Bind</b>.</p>
<div class="note"><b>Why there is no Secret Key</b>　A self-generated API has an API Key only, no Secret Key. The website neither stores nor sends your API Key.</div>
<p>To bind more sub-accounts, repeat from step 1 with another sub-account and a different account name.</p>` }
},
{
  slug: 'bind-phone', cat: 'guide', date: '2026-11-17', min: 4,
  zh: { t: '手机绑定币安 API：用币安 App 完成',
    d: '在 iPhone 或安卓上，用币安 App 创建子账户和 API，再回 3dtrading 粘贴 API Key。',
    b: `<p>手机上的步骤和电脑一样，只是操作在币安 App 里完成。建议先在 3dtrading 后台打开绑定窗口，公钥和 IP 白名单都可以一键复制。</p>
<h2>1 · 子账户</h2>
<ol><li>币安 App →「子账户」→「+ 创建子账户」。</li>
<li>在新子账户那一行点「···」，选「允许合约」并确认，再开通<b>统一账户</b>。</li></ol>
<h2>2 · 创建 API</h2>
<ol><li>进入 API 管理，选「自行生成」，选子账户、填标签。</li>
<li>回 3dtrading 绑定窗口，点「公钥」复制，切回币安 App 粘贴到「您的公钥」，点「下一步」，完成验证。</li>
<li>选「只访问受信任的 IP」，同样从绑定窗口复制 IP 白名单粘贴，点「确认」。</li>
<li>权限只勾 5 项：允许读取、启用现货杠杆和股票交易、允许杠杆质押借币还款和划转、开启统一账户交易、允许万向划转。点「保存」。</li>
<li>复制生成的 API Key。</li></ol>
<h2>3 · 粘贴并绑定</h2>
<p>回到 3dtrading，在绑定窗口的 API Key 一栏粘贴，点「绑定」。</p>
<div class="note"><b>粘贴不了？</b>　如果浏览器没让读取剪贴板，长按输入框选择「粘贴」即可。</div>
<p>手机上来回切换 App 时，3dtrading 的绑定窗口会保持原样，不用重新填写。</p>` },
  en: { t: 'Bind a Binance API on your phone with the Binance app',
    d: 'On iPhone or Android, create the sub-account and API in the Binance app, then paste the API Key into 3dtrading.',
    b: `<p>The steps are the same as on desktop, only done in the Binance app. Open the binding window in the 3dtrading dashboard first: the public key and IP whitelist copy with one tap.</p>
<h2>1 · Sub-account</h2>
<ol><li>Binance app → <b>Sub-accounts</b> → <b>+ Create Sub-account</b>.</li>
<li>Tap <b>···</b> on the new sub-account, choose <b>Enable Futures</b> and confirm, then open <b>Portfolio Margin</b>.</li></ol>
<h2>2 · Create the API</h2>
<ol><li>Open API Management, choose <b>self-generated</b>, pick the sub-account and add a label.</li>
<li>Back in 3dtrading, tap the public key to copy it, switch to Binance and paste it into <b>Your public key</b>. Tap Next and pass the check.</li>
<li>Choose <b>Restrict to trusted IPs</b>, copy the IP whitelist from the binding window the same way, paste and confirm.</li>
<li>Tick only 5 permissions: Enable Reading, Enable Spot &amp; Margin Trading, Enable Margin Loan, Repay &amp; Transfer, Enable Portfolio Margin Trading, Permits Universal Transfer. Tap Save.</li>
<li>Copy the API Key Binance shows.</li></ol>
<h2>3 · Paste and bind</h2>
<p>Back in 3dtrading, paste into the API Key field of the binding window and tap <b>Bind</b>.</p>
<div class="note"><b>Paste not working?</b>　If the browser won't read the clipboard, long-press the field and choose Paste.</div>
<p>Switching between apps keeps the 3dtrading binding window as it was, so you don't have to fill it in again.</p>` }
},
{
  slug: 'ip-whitelist', cat: 'guide', date: '2026-11-16', min: 3,
  zh: { t: 'IP 白名单怎么填，为什么必须填',
    d: '只有填了受信任 IP，币安才允许开启交易权限；这也是这把钥匙只认我们服务器的原因。',
    b: `<p>在币安创建 API 时，「IP 访问限制」有两个选项。3dtrading 需要你选<b>「只访问受信任的 IP」</b>。</p>
<h2>为什么必须填</h2>
<ul><li><b>币安的规则</b>：如果 IP 不受限制，且启用了除读取以外的任何权限，这个 API 密钥会被删除。不填 IP，交易权限根本开不了。</li>
<li><b>安全</b>：填了白名单后，这把钥匙只接受来自 3dtrading 服务器的请求。别人拿到 API Key，从其他地址也用不了。</li></ul>
<h2>怎么填</h2>
<ol><li>在 3dtrading 后台打开绑定窗口，找到「IP 白名单」一行，点击即可复制全部 IP。</li>
<li>在币安选「只访问受信任的 IP」，把复制的内容粘贴进输入框。</li>
<li>点「确认」。IP 加好后，下面的权限选项就会解锁。</li></ol>
<div class="note"><b>注意</b>　IP 以后台绑定窗口里显示的为准；带「示例」标记的是演示用地址，不能用于真实绑定。</div>` },
  en: { t: 'How to fill in the IP whitelist, and why it is required',
    d: 'Binance only allows trading permissions once trusted IPs are set, and it is why the key only answers our servers.',
    b: `<p>When you create an API on Binance, IP access has two options. 3dtrading needs <b>Restrict to trusted IPs</b>.</p>
<h2>Why it is required</h2>
<ul><li><b>Binance's rule</b>: if IPs are unrestricted and any permission other than reading is enabled, the API key is deleted. Without IPs, trading permissions cannot be turned on.</li>
<li><b>Security</b>: with a whitelist, the key only accepts requests from 3dtrading's servers. An API Key someone else sees is useless from any other address.</li></ul>
<h2>How to fill it in</h2>
<ol><li>Open the binding window in the 3dtrading dashboard and click the <b>IP whitelist</b> row to copy all the IPs.</li>
<li>On Binance choose <b>Restrict to trusted IPs</b> and paste them in.</li>
<li>Click Confirm. Once the IPs are added, the permission options below unlock.</li></ol>
<div class="note"><b>Note</b>　Use the IPs shown in the dashboard's binding window. Addresses marked <b>Example</b> are for the demo only and won't work for a real binding.</div>` }
},
{
  slug: 'six-models', cat: 'article', date: '2026-11-15', min: 4,
  zh: { t: '「6 类模型，全天候」是什么意思',
    d: '不猜单边涨跌，只看波动空间、成交量与盘口深度。策略从监测到复投的一整圈。',
    b: `<p>官网第一屏写着「6 类模型，全天候扫描有效波动」。这里的重点不是预测涨跌，而是找到<b>可以被兑现的波动</b>。</p>
<h2>模型在看什么</h2>
<p>不猜单边涨跌，只看<b>波动空间、成交量与盘口深度</b>。多个模型交叉评估，筛选流动性充足、适合分批配对的标的。</p>
<h2>一整圈是怎么走的</h2>
<ol><li><b>配对建仓</b>：先按平台规则配置合资格收益底仓，再分批建立等量多空仓位，对冲单边涨跌。</li>
<li><b>波动展开</b>：行情走出波段时，一侧积累浮盈，另一侧等额浮亏，扣除浮亏后的净权益保持平稳。</li>
<li><b>浮盈兑现</b>：平掉盈利一侧，浮盈变成新增账面余额。另一侧浮亏仍在，净权益并未因此翻倍，但可配置计奖的资金池变大了。</li>
<li><b>同量补回</b>：按现价补回同量仓位，恢复多空平衡；核对保证金余量与计奖资格后，把新增余额配置为收益资产。</li>
<li><b>收益增强</b>：多轮兑现与补回，持续争取扩大合资格计奖资产规模；实际入账的奖励再次投入配置。</li></ol>
<h2>风险怎么管</h2>
<p>多空配对管住单边方向风险，维持保证金率（uniMMR）持续监控保证金安全余量。这些指标都可以在后台随时问 Dodo。</p>
<div class="note"><b>说明</b>　官网动画中的数字是合成条件演示，账面余额未扣浮亏，不代表真实账户或未来收益。</div>` },
  en: { t: 'What "6 model types, around the clock" means',
    d: 'No betting on direction: only volatility room, volume and order-book depth. The full loop from scanning to reinvesting.',
    b: `<p>The first screen of the website says <b>6 model types scan for usable volatility around the clock</b>. The point is not predicting direction but finding <b>volatility that can be realised</b>.</p>
<h2>What the models look at</h2>
<p>No guessing which way the market goes; only <b>room to move, volume and order-book depth</b>. Several models cross-check to pick liquid symbols suited to pairing in batches.</p>
<h2>The full loop</h2>
<ol><li><b>Paired entry</b>: set up an eligible yield base under platform rules, then build equal long and short positions in batches to hedge direction.</li>
<li><b>Volatility unfolds</b>: when price swings, one side gains while the other loses the same amount, so net equity after unrealised losses stays steady.</li>
<li><b>Realise the gain</b>: close the winning side and the unrealised gain becomes new book balance. The other side's loss remains, so net equity does not double, but the pool available for reward-earning grows.</li>
<li><b>Restore the same size</b>: re-open the same size at the current price to rebalance; after checking margin headroom and eligibility, the new balance goes into yield assets.</li>
<li><b>Enhance</b>: repeated rounds aim to grow the eligible reward base, and rewards actually credited are reinvested.</li></ol>
<h2>How risk is managed</h2>
<p>Long/short pairing handles directional risk, and the unified maintenance margin ratio (uniMMR) is watched continuously. You can ask Dodo about any of these in the dashboard.</p>
<div class="note"><b>Note</b>　Numbers in the website animation are a synthetic demo; book balance excludes unrealised losses and does not represent a real account or future returns.</div>` }
},
{
  slug: 'fees-and-funding', cat: 'article', date: '2026-11-14', min: 4,
  zh: { t: '手续费与资金费：后台的收益是怎么算的',
    d: '已实现口径、资金费、手续费、利息分别指什么，后台的收益曲线又是用哪个口径画的。',
    b: `<p>后台里同一天会看到好几个数字。理解它们的关系，就知道钱从哪来、花在了哪。</p>
<h2>已实现口径</h2>
<p class="formula">已实现口径收益 = 已实现盈亏 + 资金费 − 手续费 + 利息 + 其他流水</p>
<ul><li><b>已实现盈亏</b>：平仓兑现的盈亏。</li>
<li><b>资金费</b>：永续合约多空双方定期互付的费用，可能是收入也可能是支出。</li>
<li><b>手续费</b>：每一笔成交付给币安的费用。用 BNB 抵扣时，按当天 BNBUSDT 收盘价折算成 USDT。</li>
<li><b>利息</b>：底层收益资产实际入账的部分。</li></ul>
<p>这个口径<b>不含浮盈亏</b>，所以它反映的是已经落袋的部分。</p>
<h2>总收益率</h2>
<p class="formula">总收益率 = (净权益 − 净转入) ÷ 净转入</p>
<p>净权益已经扣除了浮亏，所以总收益率包含浮盈亏的变化。两个数字对照着看：已实现口径看「兑现了多少」，总收益率看「整体变化了多少」。</p>
<h2>一个例子（示例）</h2>
<table><tr><td>已实现盈亏</td><td class="r up">+120.00</td></tr><tr><td>资金费</td><td class="r up">+8.40</td></tr><tr><td>手续费</td><td class="r dn">−15.20</td></tr><tr><td>利息</td><td class="r up">+3.10</td></tr><tr class="sum"><td>已实现口径收益</td><td class="r">+116.30 USDT</td></tr></table>
<p class="cap">示例数字，不代表真实账户。</p>
<p>后台里点任意一天，可以看到这一天的拆解；也可以直接问 Dodo「今天手续费多少」。</p>` },
  en: { t: 'Fees and funding: how the dashboard counts your returns',
    d: 'What realised basis, funding, fees and interest each mean, and which basis the profit curve uses.',
    b: `<p>The dashboard shows several numbers for the same day. Knowing how they relate tells you where money came from and where it went.</p>
<h2>Realised basis</h2>
<p class="formula">Realised return = realised P&amp;L + funding − fees + interest + other flows</p>
<ul><li><b>Realised P&amp;L</b>: gains and losses locked in by closing positions.</li>
<li><b>Funding</b>: the periodic payment between longs and shorts on perpetuals; it can be income or a cost.</li>
<li><b>Fees</b>: what each fill pays Binance. Fees paid in BNB are converted to USDT at that day's BNBUSDT close.</li>
<li><b>Interest</b>: what the yield assets actually credit.</li></ul>
<p>This basis <b>excludes unrealised P&amp;L</b>, so it shows what has actually been banked.</p>
<h2>Total return</h2>
<p class="formula">Total return = (net equity − net deposits) ÷ net deposits</p>
<p>Net equity already deducts unrealised losses, so total return includes unrealised changes. Read the two together: realised basis for what was banked, total return for the overall change.</p>
<h2>An example (Example)</h2>
<table><tr><td>Realised P&amp;L</td><td class="r up">+120.00</td></tr><tr><td>Funding</td><td class="r up">+8.40</td></tr><tr><td>Fees</td><td class="r dn">−15.20</td></tr><tr><td>Interest</td><td class="r up">+3.10</td></tr><tr class="sum"><td>Realised return</td><td class="r">+116.30 USDT</td></tr></table>
<p class="cap">Example numbers, not a real account.</p>
<p>Tap any day in the dashboard for its breakdown, or just ask Dodo "how much were fees today".</p>` }
},
{
  slug: 'read-overview', cat: 'guide', date: '2026-11-13', min: 3,
  zh: { t: '读懂总览：收益曲线与单日盈亏拆解',
    d: '总览上的曲线、时间筛选和单日拆解怎么看，点哪里能看到明细。',
    b: `<p>后台「总览」是打开后看到的第一页。手机和电脑上都由一个时间筛选统一管住整页的数据。</p>
<h2>时间筛选</h2>
<p>选今天、昨天、近 7 天、近 30 天、本月或全部，也可以自由选择起止日期。切换后，曲线、卡片和明细同时更新。</p>
<h2>收益曲线</h2>
<ul><li>曲线按<b>已实现口径</b>累计，不含浮盈亏；口径说明见<a href="#/fees-and-funding">《手续费与资金费》</a>。</li>
<li>把鼠标移到或手指按住曲线上的点，可以看到当天的数值；点一下打开这一天的详情。</li></ul>
<h2>单日盈亏拆解</h2>
<p>一天的结果拆成已实现盈亏、资金费、手续费、利息等几部分，正负分开显示，一眼看出这一天是赚在哪、花在哪。</p>
<h2>维持保证金率（uniMMR）</h2>
<p>总览里会显示当前 uniMMR 及其状态。这个数字越高，保证金余量越充足。想知道当前处在什么区间，直接问 Dodo。</p>
<div class="note"><b>演示账户</b>　未绑定真实币安账户时，后台里的数字均为演示数据。</div>` },
  en: { t: 'Reading the overview: profit curve and daily P&L breakdown',
    d: 'How to read the curve, the time filter and the daily breakdown on the overview, and where to tap for details.',
    b: `<p>The <b>Overview</b> is the first page of the dashboard. On phone and desktop, one time filter controls all the data on the page.</p>
<h2>Time filter</h2>
<p>Pick today, yesterday, last 7 days, last 30 days, this month or all, or choose your own start and end dates. The curve, cards and details update together.</p>
<h2>Profit curve</h2>
<ul><li>The curve accumulates on the <b>realised basis</b>, excluding unrealised P&amp;L; see <a href="#/fees-and-funding">Fees and funding</a>.</li>
<li>Hover or press a point to see that day's value; click it to open the day's details.</li></ul>
<h2>Daily P&amp;L breakdown</h2>
<p>A day's result splits into realised P&amp;L, funding, fees, interest and so on, gains and costs shown apart, so you can see at a glance where the day made and spent money.</p>
<h2>Maintenance margin ratio (uniMMR)</h2>
<p>The overview shows the current uniMMR and its status. Higher means more margin headroom. Ask Dodo which range you are in.</p>
<div class="note"><b>Demo account</b>　Until a real Binance account is bound, all numbers in the dashboard are demo data.</div>` }
},
{
  slug: 'dodo-slash', cat: 'guide', date: '2026-11-18', min: 3,
  zh: { t: '用 Dodo 斜杠命令快速查账户',
    d: '在 Dodo 输入框打 /，收益、订单、手续费、当日拆解一条命令调出来，还带图表。',
    b: `<p>Dodo 本来就能听懂自然语言。斜杠命令是更快的方式：不用组织句子，选一条命令就能得到带图表的回答。</p>
<h2>怎么用</h2>
<ol><li>打开后台的 Dodo 页面，在输入框里输入 <code>/</code>。</li>
<li>弹出命令列表，继续打字可以筛选，用方向键或点击选中。</li>
<li>发送后，Dodo 用文字加图表回答。</li></ol>
<h2>能查什么</h2>
<ul><li><b>收益</b>：收益卡片和折线图，点曲线上的一天，跳到总览对应的日期。</li>
<li><b>订单</b>：最近订单的小表，可以一键在交易记录里打开，账户、币种、日期都已选好。</li>
<li><b>手续费</b>：手续费的构成图，点其中一段查看对应的成交明细。</li>
<li><b>当日拆解</b>：已实现盈亏、资金费、手续费等组成当天结果的各部分。</li>
<li><b>帮助</b>：列出全部命令。</li></ul>
<p>命令名称跟随界面语言，以命令列表实际显示为准。</p>
<div class="note"><b>小技巧</b>　直接打中文也可以，比如「上周手续费」，Dodo 会匹配到对应的命令。</div>` },
  en: { t: 'Use Dodo slash commands to check your account',
    d: 'Type / in Dodo\'s input to call up profit, orders, fees or the daily breakdown in one command, with charts.',
    b: `<p>Dodo already understands plain language. Slash commands are faster: no need to phrase a question, just pick a command and get an answer with charts.</p>
<h2>How to use them</h2>
<ol><li>Open the Dodo page in the dashboard and type <code>/</code> in the input box.</li>
<li>The command list opens; keep typing to filter, then pick one with the arrow keys or a click.</li>
<li>Send it and Dodo answers with text and charts.</li></ol>
<h2>What you can check</h2>
<ul><li><b>Profit</b>: a profit card and line chart; click a day on the curve to jump to that date on the overview.</li>
<li><b>Orders</b>: a small table of recent orders that opens in the trade history with the account, coin and date already set.</li>
<li><b>Fees</b>: a breakdown of fees; click a segment to see the fills behind it.</li>
<li><b>Daily breakdown</b>: realised P&amp;L, funding, fees and the other parts of a day's result.</li>
<li><b>Help</b>: lists every command.</li></ul>
<p>Command names follow the interface language; the command list shows the exact names.</p>
<div class="note"><b>Tip</b>　You can also type a plain request such as "fees last week" and Dodo matches it to the right command.</div>` }
}
];
