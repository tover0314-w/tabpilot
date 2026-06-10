# Sprint Plan

## Sprint 1：Chrome Extension Skeleton

状态：已实现第一版无构建 MV3 切片，代码在 `extension/`。

目标：跑通点击插件 → 打开 sidebar → 扫描 tabs。

任务：

- MV3 manifest。
- action.onClicked。
- sidePanel.open。
- collectAllNormalWindowTabs()。
- sidePanel progress UI。
- message bus。

交付：

- 点击 icon 可打开 sidebar。
- Sidebar 显示当前浏览器所有普通窗口 tabs 数和窗口数。

## Sprint 2：Native Tab Groups

状态：已实现第一版 built-in rules + native tab group apply + basic undo，代码在 `extension/`。

目标：跑通原生分组应用。

任务：

- built-in domain rules。
- group plan 数据结构。
- tabs.group / tabGroups.update。
- group order。
- collapse/expand。
- undo snapshot basic。

交付：

- 点击后顶部 tab bar 出现 groups。

## Sprint 3：Deduplication

状态：已实现 safe exact/tracking duplicate close、Restore Closed、Review-only duplicate UI、Keep All、manual confirmed close。

目标：安全去重。

任务：

- canonicalUrl。
- exact duplicate。
- tracking params duplicate。
- keep tab scoring。
- close safe duplicates。
- restore closed tabs。
- duplicate sidebar UI。

交付：

- 自动关闭 exact/tracking duplicates。
- 可恢复。

## Sprint 4：AI Classification

状态：已实现 optional DeepSeek classification with OpenAI-compatible request format、local dashboard settings、JSON output validation、fallback to local rules。

目标：AI 分类接近人工。

任务：

- AI provider interface。
- DeepSeek provider settings using an OpenAI-compatible request format。
- classification prompt。
- JSON schema validation。
- AI fallback。
- confidence / Review / Misc。

交付：

- 点击后 AI 生成任务导向 group names。

## Sprint 5：Sidebar Chat + Current Tab Summary

状态：已实现 local Chat Refine preview/apply first slice、local user rules、current tab local extractive summary、composer direct command router、latest-run read-only answers、duplicate review/closed-tab local answers、active/protected/read-later local answers、local tab search/focus。

目标：用户可纠错和总结当前页面。

任务：

- chat UI。
- chat-to-action parser。
- create rule action。
- regroup action。
- activeTab + scripting extractor。
- current tab summary prompt。

交付：

- 用户能说“GitHub PR 放 Code Review”。
- 用户能总结当前页面，也能问当前页面一个问题，并在聊天消息流里看到本地结果。
- 用户最近几条输入和 Agent 回复会保留在侧边栏临时消息流里。
- 用户点击快捷动作按钮时，也会进入同一条聊天消息流。
- 用户能问“你能做什么”并得到本地能力说明。
- 用户能在聊天框直接说 summarize / organize / undo / restore / open dashboard。
- 用户能问“下一步怎么办”并得到基于最新整理结果的本地建议。
- 用户能询问最新整理结果、分组、重复项、待确认重复项、已关闭重复项、AI 状态、当前活跃标签页、受保护标签页和稍后阅读候选。
- 用户能搜索当前 tabs 并打开匹配的已有标签页。

## Sprint 6：Dashboard V0

状态：已实现 extension page dashboard、workspace metrics、smart group cards、duplicate center、rules memory、AI settings、group title/color apply、same-window tab move、same-window drag/drop tab assignment、Dashboard Undo/Restore、Smart Group expandable tab rows、Duplicate Center tab details/focus。Save workspace 仍未实现。

目标：看板管理好的分组。

任务：

- dashboard extension page。
- current workspace overview。
- smart group cards。
- group detail。
- drag/drop tab assignment。
- apply to browser。
- save workspace locally。

交付：

- 用户可在 dashboard 调整分组并同步到浏览器。
- 用户可展开 Smart Group 的 `+ N tabs` 行，查看并操作更多本地 tab 行。
- 用户可在 Dashboard Duplicate Center 展开重复组并打开对应 tab 检查。
- 用户可把 tab 行拖到同窗口另一个已有分组，并同步到真实 Chrome native tab group。
- 用户可在 dashboard 直接 Undo 或 Restore Closed。

## Sprint 7：Private Beta Polish

目标：可给真实用户试用。

任务：

- onboarding。
- privacy settings。
- error states。
- analytics minimal。
- performance optimization。
- Chrome Web Store draft。

交付：

- Private beta build。
