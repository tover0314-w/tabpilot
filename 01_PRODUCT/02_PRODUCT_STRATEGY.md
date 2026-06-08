# 产品策略

## 1. 战略判断

TabMosaic AI 不应该被做成“又一个 tab manager”。现有 tab manager 很多，单纯搜索、关闭、保存 session 的功能难以形成强差异化。真正的机会是把办公用户的浏览器顶部 tab bar 变成 AI 自动维护的工作区。

## 2. 主叙事

不是：

> 管理你的 tabs。

而是：

> 点击一次，你本来要花 10 分钟整理的浏览器，AI 直接整理好。

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
```

## 4. 为什么 dashboard 是付费核心

一键整理虽然惊艳，但用户可能认为它是一个轻工具。Dashboard 把一次性整理变成长期资产：

- 用户可以保存好的分组。
- 用户可以恢复历史 workspace。
- 用户可以管理自己的规则和偏好。
- 用户可以查看页面摘要和知识库。
- 用户可以和一组 tabs 或 workspace 聊天。
- 用户有理由长期订阅。

## 5. 免费到付费路径

```text
首次使用：免费体验 one-click organize。
产生 aha：顶部 tab bar 变整洁。
建立信任：sidebar 告诉用户关闭了哪些重复 tabs，可 Undo。
展示价值：提示“保存这个工作区 / 总结整个 group / 和这些 tabs 聊天”。
转化付费：这些长期能力进入 Pro。
```

## 6. 核心差异化

| 差异化 | 描述 |
|---|---|
| 顶部真实整理 | 直接使用 Chrome native tab groups，不只是 sidebar 视图 |
| 点击即结果 | 不要求用户先写 prompt 或手动配置 |
| 安全去重 | 自动关闭高置信度重复项，低置信度进 Review |
| Sidebar Agent | 结果解释、Undo、聊天、总结 |
| Dashboard Workspace | 长期分组、workspace、摘要和规则管理 |
| 学习用户偏好 | 用户纠错会沉淀成规则 |
| Tab Chat | 和当前 tab / tabs / group / workspace 聊天 |

## 7. 市场进入策略

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
Click extension。
After：顶部出现 8 个清晰 groups，sidebar 显示关闭 12 个重复 tabs。
```

### Developer-oriented hooks

- GitHub PR 自动归到 Code Review。
- Chrome docs / API docs 自动归到 Docs。
- Vercel/Supabase/Stripe dashboard 自动归到 Dev Tools/Finance。
- 当前 GitHub repo 一键总结。

### Office-oriented hooks

- Gmail/Outlook、Google Docs、Notion、Slack、Teams、Calendar 自动归到 Communication / Docs / Meetings。
- Salesforce/HubSpot、Linear/Jira、Analytics、Sheets 自动归到 Sales / Projects / Reports。
- 跨窗口整理：用户不用先合并窗口，点击一次整理整个当前浏览器上下文。

## 8. 产品原则

1. 先产生可见结果，再解释。
2. 分类可以大胆，关闭必须谨慎。
3. 默认最小数据读取。
4. 每个自动操作都要可撤销。
5. 用户修正必须转化成记忆。
6. Dashboard 要服务长期价值，不做成复杂设置页。
7. 任何 AI 输出必须可审查和可纠错。
