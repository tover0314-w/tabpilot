# 确认协议：哪些内容必须停下来找用户确认

用户明确要求：“需要和我核对的内容一定要停下来找我确认”。因此本项目采用 **Confirmation Gate** 机制。

## 原则

1. 已经在对话中明确达成的共识，可以直接写入文档。
2. 属于产品方向、默认行为、付费策略、隐私边界、数据上传、自动关闭 tab、技术栈绑定的内容，如果没有明确确认，必须标记为 `待确认`。
3. 进入设计稿、开发任务、上架材料、隐私政策、定价页之前，必须清理所有 P0/P1 的待确认项。
4. 文档中的 `建议` 不等于最终决策。
5. 未确认内容不能伪装成“已经决定”。

## 必须停下来确认的内容类型

### A. 产品定位

- 产品最终名称或品牌迁移：当前工作名 TabMosaic AI；变更前必须确认。
- 目标用户首发选择：当前已定办公/知识工作者优先；变更前必须确认。
- 主语言：当前 MVP 可见 UI 已改为 English-only；中文资源保留但不默认启用。后续重新启用中文默认体验前必须确认。
- 是否定位成 productivity extension，还是 AI research workspace。

### B. P0 默认行为

- 点击插件后是否立即自动分组。
- 点击插件后是否默认打开 sidebar。
- 是否默认整理当前浏览器所有普通窗口；变更为当前窗口或所有浏览器前必须确认。
- 是否默认自动关闭安全重复 tabs。
- 安全重复的定义：exact URL + tracking params，是否包括 hash。
- 是否默认移动已有用户手动创建的 groups。

### C. 隐私和数据

- 默认是否发送完整 URL 给云端 AI。
- 默认是否只发送 title + hostname + path。
- 当前页面总结时是否允许读取正文。
- 多 tab 总结是否允许批量读取正文。
- 是否保存页面摘要到云端。
- 是否做跨设备同步。

### D. AI 方案

- MVP 是否继续使用 DeepSeek API 起步。
- 是否提供 hosted AI。
- 首发支持 DeepSeek / OpenAI / Claude / Gemini / 本地模型中的哪些。
- 是否需要用户登录后才能使用 hosted AI。
- AI 分类是否需要 streaming progress。

### E. 付费策略

- 免费版是否允许无限一键整理。
- 当前 tab summary 免费次数。
- Multi-tab chat 是否 Pro only。
- Dashboard 是否部分免费。
- 是否提供 lifetime deal。
- 月费和年费区间。

### F. Dashboard 范围

- P0 dashboard 是只做当前 workspace，还是支持历史 workspace。
- Dashboard 是否作为 extension page，还是独立 web app。
- Dashboard 是否必须登录。
- Dashboard 是否可直接 apply back to browser。

### G. 安全动作

- 关闭 tabs 是否必须预览。
- exact duplicate 是否可默认自动关闭。
- tracking-param duplicate 是否可默认自动关闭。
- hash duplicate 是否永不自动关闭。
- incognito 是否完全不支持。

## 推荐确认节奏

### 第 1 次确认：产品范围确认

确认 `01_PRODUCT/01_PRD.md` 和 `02_FEATURE_SPECS/01_ONE_CLICK_AUTOPILOT.md`。

### 第 2 次确认：隐私与默认行为确认

确认 `02_FEATURE_SPECS/02_AUTO_CLASSIFICATION.md`、`03_DEDUPLICATION.md`、`04_SIDEBAR_AGENT.md`、`04_TECH/07_SECURITY_PRIVACY_IMPLEMENTATION.md`。

### 第 3 次确认：Dashboard 与商业化确认

确认 `02_FEATURE_SPECS/05_DASHBOARD.md`、`10_PAYWALL_BILLING.md`。

### 第 4 次确认：开发范围确认

确认 `05_PROJECT/02_SPRINT_PLAN.md` 和 `05_PROJECT/03_BACKLOG.md`。

## 标注规范

文档内使用这些标识：

- `CONFIRMED`：对话中已经明确确认。
- `RECOMMENDED`：当前建议方案，但未最终确认。
- `CONFIRM`：必须找用户确认。
- `OPEN QUESTION`：需要后续研究或讨论。
- `DO NOT BUILD YET`：未确认前不得进入开发。
