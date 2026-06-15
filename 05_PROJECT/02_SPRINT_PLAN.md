# Sprint Plan

## Sprint 1：Chrome Extension Skeleton

状态：已实现第一版无构建 MV3 切片，代码在 `extension/`。

目标：跑通点击插件 → 打开 sidebar → 扫描 tabs。

任务：

- MV3 manifest。
- action icon click → `chrome.action.onClicked` background handler。
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

状态：已实现 safe exact/tracking duplicate close、Restore Closed、Review-only duplicate UI、Keep All、manual confirmed close、Google Workspace same-document / YouTube same-video review-only first slice。

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

状态：已实现 optional BYOK classification with OpenAI-compatible request format、default DeepSeek provider、custom provider origin permission、local dashboard settings、Ollama / LM Studio local setup help first slice、JSON output validation、fallback to local rules。

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

状态：已实现 local Chat Refine preview/apply first slice、local user rules、current tab local extractive summary、composer direct command router、Sidebar save workspace command、latest-run read-only answers、duplicate review/closed-tab local answers、active/protected/read-later local answers、local tab search/focus。

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
- 用户能通过侧边栏输入 save workspace / 保存工作区，把当前整理结果保存成本地 workspace 快照。

## Sprint 6：Dashboard V0

状态：已实现 extension page dashboard、workspace metrics、smart group cards、duplicate center、rules memory、AI settings、group title/color apply、same-window tab move、same-window drag/drop tab assignment、Dashboard Undo/Restore、Smart Group expandable tab rows、Duplicate Center tab details/focus、Save current workspace local snapshot first slice、Saved Workspace restore currently-open-tabs first slice。Workspace history/full restore/chat 仍未实现。

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
- 用户可把当前整理结果保存成本地 workspace 快照，并在隐藏/private-beta path 中把仍打开的 saved tabs 恢复为原生分组；完整历史恢复、云同步和 workspace chat 后续再做。

## Sprint 7：Private Beta Polish

目标：可给真实用户试用。

状态：已实现 first-run privacy onboarding、Sidepanel/Dashboard actionable safe error states first slice、180-tab synthetic local planning performance guard、96-tab synthetic Chrome runtime native group probe。Analytics、real-profile large-tab manual QA、Chrome Web Store final submission 仍未完成或需确认。

任务：

- onboarding。
- privacy settings。
- error states（Sidepanel + Dashboard first slice 已实现）。
- analytics minimal。
- performance optimization（synthetic local planning guard 和 96-tab temporary Chrome runtime probe 已实现；真实用户 profile 大规模性能仍需手动 QA）。
- Chrome Web Store draft。

交付：

- Controlled local/private beta build。

## Sprint 8：Agentic Classification + Context Tools

目标：让 Agent 从“会回答 tab 状态”升级为“能理解当前 tab / tab 组 / 选中 tabs 的真实页面上下文，并能提出可执行整理方案”。

状态：已实现第四片：metadata semantic classification V2 foundation、metadata-only split/merge refinement suggestions in Sidebar、Sidebar Agent tool registry prompt contract、current group / selected-tabs tool-card visible-text extraction、DeepSeek multi-tab Page Agent first slice、session-only group summary card、group/selected-tabs session follow-up reuse、Dashboard selected-tabs context entry、content-assisted regrouping preview、selected page-region context first slice、selected-region cropped screenshot metadata first slice、真实 Chrome runtime selected-tabs tool-card/follow-up QA，以及 synthetic HTTP 页面正文读取 + content regroup Apply runtime QA（使用临时 fixture host grant）。原生 Chrome optional site permission prompt 的自动接受/人工确认 QA 仍待补。

任务：

- Agentic Classification V2：按 project / workflow / artifact / intent 分类，降低 domain-only grouping。（first slice done）
- Classification refinement：整理完成后折叠展示 metadata-only split/merge suggestions；不会自动重分组。（split/merge first slice done；real-profile QA pending）
- Sidebar Agent tool registry：把 read-only tools、planning tools、action tools 变成可验证契约。（first slice done）
- Multi-tab tool card：在消息流里显示正在调用的工具、读取范围、tab 数、session-only 边界和跳过项。（first slice done）
- Current group / selected-tabs visible-text extraction：用户发起后默认允许，private beta 最多 6 tabs，敏感/受限页跳过或额外确认。（first slice done）
- Group / selected-tabs deep Q&A：支持对 tab 组或选中 tabs 做总结、比较、解释，并渲染 session-only group summary card。（first slice done；连续 follow-up reuse done）
- Dashboard selected-tabs entry：Dashboard tab 行可勾选同窗口多个 tabs，点击 `Chat selected` 打开 Sidebar selected-tabs 上下文；不直接读取页面正文。（first slice done）
- Content-assisted regrouping preview：用户要求后读取 capped visible text，生成重分组 preview，必须 Apply / Cancel。（first slice done）
- Selected page-region context：用户在 Sidebar 输入 `select region` / `ask region: ...` 后点选当前页面的一块内容，读取该块可见文本、安全结构和裁剪截图元信息给 text-only Page Agent；session-only，图片 bytes 不上传/不保存。（first slice done）

交付：

- 用户能问“这个 group 主要讲什么”，Agent 基于 capped visible text 给出更深入回答。
- 用户能问“不要按网站分，用页面内容重新整理这个 group”，Agent 给出可应用的原生分组方案。
- 一键整理仍保持 metadata-only，不后台读取页面正文。
- 多页面正文和摘要不持久保存。

## Sprint 9：Agent Search + Browser Work Agent

目标：把 Sidebar Agent 从“会回答和整理 tabs”推进到“能调用搜索、保存结果、生成 todo，并把浏览器工作串起来”。

状态：计划已拆解，见 `05_PROJECT/19_AGENT_SEARCH_WORK_AGENT_IMPLEMENTATION_PLAN.md`。第一版 Tavily-style executor 已实现；正式 provider/key 配置 UX、权限文案和真实 key 端到端 QA 仍需 D-039 确认。

任务：

- Search Provider configuration：Tavily-style BYOK search provider 设置、测试、清除和权限提示。
- Search as Agent tool：明确搜索意图才调用 `search_web_provider`，Dashboard 不出现 search UI。
- Search results as work：搜索结果可 Open、Save to collection、Make todo。
- Todo Agent MVP：从 current tab / selected tabs / group / search results 创建本地 todo。
- Work Queue polish：Dashboard Work Queue 支持 done / archive / focus source / open Sidebar context。
- Link understanding first slice：用户粘贴链接后由 Agent 识别并请求确认后作为上下文。
- QA：无 provider 不发请求；有 provider 只发 query；结果保存不存 raw pages；preflight + real-key QA。

交付：

- 用户能在 Sidebar 说 “web search ...”，Agent 调用内部 search tool 并返回简洁结果卡片。
- 用户能把结果保存成 collection 或 todo。
- Dashboard 只展示 Agent 产物，不变成搜索页。
- Search provider 相关数据流有清楚隐私边界和测试证据。
