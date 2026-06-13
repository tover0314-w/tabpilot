# TabMosaic AI PRD v0.2

版本日期：2026-06-08

## 1. 产品概述

TabMosaic AI 是一个面向办公和知识工作场景的开源 Chrome AI browser layer。用户安装扩展后，可以用自配模型/API key 把自己的 Chrome 变成可控的 AI 浏览器工作区。用户点击插件图标后，先进入极简 toolbar action menu；首要动作 Smart Organize 会扫描当前浏览器的所有普通窗口 tabs，识别重复标签页，按任务/项目/主题自动分类，创建或更新 Chrome 原生 tab groups，并在 sidebar 中展示整理进度、结果、Undo、Review、聊天和总结入口。菜单还提供 Vertical Tabs、Current Page Chat 和 Dashboard 入口。

长期来看，TabMosaic AI 不只是 tab manager，而是一个开源、BYOK、AI 维护的浏览器办公工作区：用户可以在 dashboard 里管理长期分组、工作区、规则、摘要和 AI 记忆，也可以选择自己的模型 provider 或后续 hosted AI。

## 2. 一句话定位

**点一下，所有办公标签页自动归位；在侧边栏继续处理。**

英文：**Open-source AI browser layer for Chrome. Bring your own model, organize every work tab, and continue from the sidebar.**

## 3. 背景与机会

Chrome 已经具备原生 tab group 能力，用户可以 group、label、color-code tabs 来保持组织性。但原生能力依赖用户手动创建、命名、拖拽和维护，这在用户打开 30–100 个 tabs 时成本很高。

产品机会在于：让 AI 自动完成用户原本手动做的整理动作，并通过 sidebar 与 dashboard 提供可解释、可撤销、可学习的工作流。开源和 BYOK 让用户可以检查隐私实现、自己选择模型、降低安装疑虑，并形成 GitHub / SEO / 开发者社区增长飞轮。

## 4. 目标用户

### 第一优先级：办公和知识工作者

- 办公人群 / 知识工作者：同时打开邮件、文档、IM、日历、工单、表格、CRM、会议资料和内部系统。
- 产品经理 / 项目经理：打开 PRD、竞品、设计稿、数据后台、用户反馈、任务管理工具。
- 运营 / 市场 / 销售 / 客服：打开广告后台、数据报表、客户资料、知识库、邮件和协作工具。
- 独立开发者 / 工程师：打开 GitHub、文档、PR、issue、云服务后台、AI 工具。
- 研究员 / 学生 / 分析师：打开论文、文章、搜索结果、PDF、视频、公司和报告页面。

### 用户特征

- 经常同时打开 30+ tabs。
- 觉得手动分类非常耗时。
- 重复打开同一页面但不敢关。
- 希望按任务/项目分组，而不是按网站分组。
- 愿意为节省时间、AI 总结、长期工作区付费。
- 日常在多个浏览器窗口中切换任务，需要一次性整理整个浏览器上下文。

## 5. 用户痛点

1. 标签页太多，顶部 tab bar 标题看不清。
2. 同一页面重复打开很多次，浪费空间和注意力。
3. Chrome 原生 tab groups 好用，但手动创建和维护成本高。
4. 用户希望“点击后就自动分类”，而不是先配置或写 prompt。
5. 用户希望分类效果接近人工分类，按任务/项目/主题，而不是简单按域名。
6. 用户打开很多资料页，却没有时间逐个阅读。
7. 用户担心 AI 插件乱关 tabs 或上传隐私数据。
8. 用户需要长期工作区，能保存、恢复、调整、复用好的分组。

## 6. 产品目标

### P0 目标

让用户从 toolbar menu 的 Smart Organize 入口，把当前浏览器所有普通窗口中混乱的 tabs 自动整理成接近人工分类效果的 Chrome 原生 tab groups，并安全清理重复 tabs。P0 同时要建立 open-source + BYOK 信任感：用户知道它如何处理数据，也能用自己的模型。

### P1 目标

让用户可以和一个 tab、多个 tabs、一个 group 或 workspace 聊天，总结内容、对比资料、提炼行动建议，并把结果沉淀到 dashboard。

### P2 目标

形成 AI 维护的浏览器工作区，支持自配模型、local model、跨设备、AI memory、workspace sync、团队协作和更深的研究模式。

## 7. 核心体验

```text
用户打开 73 个 tabs
→ 点击插件图标
→ 选择 Smart Organize
→ 当前浏览器所有普通窗口的顶部 tab bar 出现清晰原生 tab groups
→ 系统自动关闭 9 个安全重复 tabs
→ sidebar 自动打开，展示进度、整理结果、Undo、Review、聊天引导
→ 用户可以继续说：“按项目重新分类”“总结当前页面”“保存为工作区”
```

## 8. P0 功能范围

| 功能 | 描述 | P0 |
|---|---|---|
| Toolbar Action Menu | 点击插件 icon 打开极简动作菜单：Smart Organize、Vertical Tabs、Current Page Chat、Dashboard | 是 |
| Smart Organize Autopilot | 从 toolbar menu 触发后自动整理当前浏览器所有普通窗口 | 是 |
| Native Tab Groups | 顶部 tab bar 展示原生分组 | 是 |
| Auto Classification | 规则 + AI 自动分类 | 是 |
| Safe Deduplication | 自动关闭安全重复 tabs | 是 |
| Sidebar Result | 整理结果解释 | 是 |
| Undo / Restore | 撤销整理和恢复关闭 tabs | 是 |
| Chat Refine | sidebar 内纠错、重分、建规则 | 是 |
| Current Tab Chat | 总结当前页面，与当前页面聊天 | 是 |
| Dashboard V0 | 当前所有窗口 workspace、Smart Groups 看板、Duplicate Center、Basic Settings | 是 |
| Open Source Distribution | 公开核心扩展源码，形成信任、SEO 和社区反馈 | 是 |
| BYOK Model Config | 用户自配 OpenAI-compatible Base URL、model、API key；默认 DeepSeek，非默认 host 显式请求 origin 权限，localhost 支持本地模型 endpoint | 是 |
| Multi-tab Chat | 和多个 tabs/group/workspace 聊天 | P1 |
| Workspace History | 保存/恢复历史 workspace | P1 |
| AI Memory | 规则和偏好长期记忆 | P1 |

## 9. 非目标范围

P0 不做：

- 默认后台持续监听所有网页正文。
- 自动读取所有 tabs 页面内容。
- 自动关闭非重复 tabs。
- 深度浏览历史分析。
- 跨设备同步。
- 团队协作。
- 复杂账号体系。
- 移动端支持。
- 默认处理 incognito 窗口。

## 10. 语言策略

MVP 可见界面、默认文案与 AI 输出偏好使用 English-only，避免中英混排。中文本地化资源暂时保留为后续多语言素材；重新启用中文默认体验前需要确认。多语言作为 P1/P2 国际化扩展。

## 11. AI Provider 策略

MVP 使用 DeepSeek API 做默认测试和分类/总结能力验证，同时保留 OpenAI-compatible 协议抽象。产品方向确认 BYOK：用户可以配置自己的 OpenAI-compatible Base URL、model 和 API key。P0 private beta 默认 `https://api.deepseek.com/*`，非默认 HTTPS provider host 或 `http://localhost` 本地模型 endpoint 会在保存/测试前请求对应 origin 权限。P0 不做完整 hosted AI gateway；后续 Pro/hosted AI 阶段再加入统一网关、用量计费和账号系统。

默认 AI 分类只发送 title + hostname + path + tab 状态；不默认发送页面正文或完整 URL。

## 12. 成功指标

### Aha 指标

- 首次点击后成功整理率。
- 首次整理后未立即 Undo 的比例。
- 首次整理后用户是否点击第二次。
- 用户是否在首次整理后保存 workspace。

### 分类质量指标

- AI 分组接受率。
- 用户手动移动 tabs 的比例。
- Misc/Review tabs 占比。
- 用户重命名 group 的比例。
- 用户创建规则的比例。

### 去重安全指标

- 自动关闭重复 tabs 数。
- Restore closed tabs 比例。
- 误关反馈率。
- active/pinned/audible 保护命中率。

### 付费指标

- Dashboard 打开率。
- Workspace 保存率。
- Group chat 使用率。
- Multi-tab summary 使用率。
- Pro 转化率。
- 付费用户周活。

### 开源增长指标

- GitHub stars / forks / watchers。
- README 到安装文档点击率。
- BYOK 配置完成率。
- Provider request issues 数量。
- 社区提交的规则、prompt、provider adapter 或 bug reports。

## 13. 风险

1. 分类质量不够接近人工。
2. 误关 tabs 造成信任损失。
3. 隐私担忧影响安装和留存。
4. AI 成本不可控。
5. Dashboard 太重，拖慢 MVP。
6. Chrome Web Store 审核要求权限和数据披露严格。
7. 品牌名和域名竞争激烈，必须尽早锁定域名和商标可用性。
8. 开源 license 和 paid hosted service 边界需要清晰，否则容易让用户困惑或削弱商业化。

## 14. 当前待确认

见 `00_START_HERE/03_DECISIONS_TO_CONFIRM.md`。
