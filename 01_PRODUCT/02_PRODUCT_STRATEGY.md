# 产品策略

## 1. 战略判断

TabMosaic AI 不应该被做成“又一个 tab manager”。现有 tab manager 很多，单纯搜索、关闭、保存 session 的功能难以形成强差异化。真正的机会是把办公用户的浏览器顶部 tab bar 变成 AI 自动维护的工作区，并用开源 + BYOK 模型配置建立信任和传播。

## 2. 主叙事

不是：

> 管理你的 tabs。

而是：

> 安装一个开源插件，用你自己的模型，把 Chrome 变成 AI browser；先从一键整理所有办公 tabs 开始。

## 3. 产品层级

```text
第一层：One-click Aha
  点击后顶部 tab bar 自动变整洁。

第二层：Trust Layer
  Sidebar 展示发生了什么，提供 Undo、Restore、Review。

第三层：Agent Layer
  用户可以继续聊天、纠错、总结当前页面。

第四层：Workspace Layer
  Dashboard 保存和管理长期分组、规则、摘要、工作区。

第五层：Paid Intelligence
  Multi-tab chat、workspace memory、hosted AI、跨设备同步。

Growth Layer：Open-source + BYOK
  public repo、provider guides、privacy transparency、community rules/prompts。
```

## 4. 为什么开源是增长核心

闭源浏览器扩展很难让用户相信它不会滥用浏览数据。TabMosaic 处理 tabs、页面正文和 API key，开源可以把信任前置：

- 用户能检查默认不后台读取页面正文。
- 用户能确认 API key 只存在本地。
- 用户能看到 AI payload 不含 full URL / page text，除非主动触发。
- 开发者能贡献 provider adapter、分类规则、prompt 和 bug fix。
- GitHub、文档和教程能带来 SEO 与社区流量。

开源不是放弃商业化。当前确认方向是全量开源本地扩展，商业化放在可选服务层：

```text
本地扩展、prompt/schema、provider abstraction 和隐私实现开源。
托管 AI、云同步、跨设备 workspace、团队协作、长期 memory 和管理体验收费。
```

## 5. 为什么 dashboard 是付费核心

一键整理虽然惊艳，但用户可能认为它是一个轻工具。Dashboard 把一次性整理变成长期资产：

- 用户可以保存好的分组。
- 用户可以恢复历史 workspace。
- 用户可以管理自己的规则和偏好。
- 用户可以查看页面摘要和知识库。
- 用户可以和一组 tabs 或 workspace 聊天。
- 用户有理由长期订阅。

## 6. 免费到付费路径

```text
首次使用：安装开源扩展，配置自己的模型或使用私测默认 provider。
免费体验 Smart Organize。
产生 aha：顶部 tab bar 变整洁。
建立信任：sidebar 告诉用户关闭了哪些重复 tabs，可 Undo。
展示价值：提示“保存这个工作区 / 总结整个 group / 和这些 tabs 聊天”。
转化付费：hosted AI、跨设备、长期 memory、团队和托管工作区进入 Pro。
```

## 7. 核心差异化

| 差异化 | 描述 |
|---|---|
| 开源可信 | 用户可检查权限、AI payload、API key 存储和安全边界 |
| BYOK 模型 | 用户可以使用自己的模型/API key；DeepSeek 只是默认测试 provider |
| 顶部真实整理 | 直接使用 Chrome native tab groups，不只是 sidebar 视图 |
| 点击即结果 | 不要求用户先写 prompt 或手动配置 |
| 安全去重 | 自动关闭高置信度重复项，低置信度进 Review |
| Sidebar Agent | 结果解释、Undo、聊天、总结 |
| Dashboard Workspace | 长期分组、workspace、摘要和规则管理 |
| 学习用户偏好 | 用户纠错会沉淀成规则 |
| Tab Chat | 和当前 tab / tabs / group / workspace 聊天 |

## 8. 市场进入策略

### Office knowledge workers first

首发优先办公和知识工作者，而不是只服务独立开发者：

- 覆盖面更大：PM、运营、市场、销售、客服、分析师、开发者都存在多 tab 工作流。
- 搜索需求更宽：AI tab organizer、Chrome tab manager、organize browser tabs、duplicate tabs、work tabs。
- 日常高频：邮件、文档、IM、数据后台、任务管理和内部系统经常跨多个窗口打开。
- 更适合 SEO 长期增长：可以围绕“office tab management”“AI tab organizer for work”“organize Chrome tabs across windows”等主题建设内容。

独立开发者仍然是早期传播子人群，但不再作为唯一首发 persona。

### Product Hunt / Hacker News / Twitter/X Launch

主 demo 应该非常直观：

```text
Before：顶部 80 个混乱 tabs。
Install open-source extension / configure your model。
Click Smart Organize。
After：顶部出现 8 个清晰 groups，sidebar 显示关闭 12 个重复 tabs。
```

### GitHub / SEO Launch

开源 repo 应该作为增长入口：

- README 第一屏讲清楚：open-source AI browser layer for Chrome, BYOK, native tab groups。
- Docs 写清楚 DeepSeek、OpenAI-compatible、自定义 provider 和后续 local model 配置。
- 隐私架构图展示哪些数据默认不上传。
- Issues 收集 provider requests、classification quality、Tabbit-like feature requests。
- 示例规则和 prompt 成为可搜索内容。

### Developer-oriented hooks

- GitHub PR 自动归到 Code Review。
- Chrome docs / API docs 自动归到 Docs。
- Vercel/Supabase/Stripe dashboard 自动归到 Dev Tools/Finance。
- 当前 GitHub repo 一键总结。

### Office-oriented hooks

- Gmail/Outlook、Google Docs、Notion、Slack、Teams、Calendar 自动归到 Communication / Docs / Meetings。
- Salesforce/HubSpot、Linear/Jira、Analytics、Sheets 自动归到 Sales / Projects / Reports。
- 跨窗口整理：用户不用先合并窗口，点击一次整理整个当前浏览器上下文。

## 9. 产品原则

1. 先产生可见结果，再解释。
2. 分类可以大胆，关闭必须谨慎。
3. 默认最小数据读取。
4. 每个自动操作都要可撤销。
5. 用户修正必须转化成记忆。
6. Dashboard 要服务长期价值，不做成复杂设置页。
7. 任何 AI 输出必须可审查和可纠错。
8. 开源代码必须和隐私承诺一致。
9. BYOK 不等于放松数据最小化；用户自己的模型也要清楚知道发送了什么。
10. 商业化应避免把本地核心能力切成闭源模块；优先通过 hosted AI、sync、team、support 等服务增值。
