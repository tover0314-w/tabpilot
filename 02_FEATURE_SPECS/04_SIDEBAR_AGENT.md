# 功能规格：Sidebar Agent

## 1. 目标

Sidebar 是点击插件后打开的 Tab Agent 对话框。它的默认形态应该像 Notion AI sidebar / OpenAI / ChatGPT 的侧边对话界面：消息流、当前页面上下文、底部输入框、少量快捷动作。它可以解释顶部 tab bar 的变化，但不能再做成复杂结果面板。

Agent tool registry、上下文深度模型、group/selected-tabs 内容读取 tool-card 流程见 `02_FEATURE_SPECS/12_AGENTIC_CLASSIFICATION_AND_CONTEXT_TOOLS.md`。

## 2. Sidebar 角色

```text
顶部 tab bar：展示真实整理结果。
Sidebar：Tab Agent 对话、纠错、页面问答、总结、Undo/Restore 快捷动作。
Dashboard：长期管理和付费工作台。
```

## 3. Sidebar 首屏

CONFIRMED BY USER: Sidebar must be a ChatGPT-style Tab Agent. The default screen is not a full dashboard and not a result metrics panel.

```text
TabMosaic AI
                                  [Dashboard]

[assistant]
我已经整理好了：创建 8 个原生分组，移动 61 个标签页。
内存压力降低：释放 9 个重复标签页。待看重复：4 组。
这次使用 DeepSeek / 本地规则完成分类，具体取决于本地私测配置是否可用。

[quick messages]
重新整理 · 撤销 · 恢复

[Current tab · chrome.sidePanel API]
Ask TabMosaic about your tabs...
[GitHub PR] [Current tab] [Rename]
```

## 4. 模块结构

### A. Conversation Thread

默认显示对话消息流。整理结果、动作草稿、页面总结都作为 agent messages 出现。

P0 UI rule: The latest organize result should appear as one assistant chat message with plain-language impact text. It should not render a separate metric wall, status card, or dashboard-like toolbar.

P0 UI rule: Assistant actions should look like lightweight chat chips inside the message bubble. They should not look like a settings form or dashboard control panel.

P0 UI rule: Current-page chat should feel like Notion AI beside the page: the composer context says which tab is being discussed, the user asks in natural language, and the assistant answers in a plain message bubble from the page context. The page-chat surface should not be dominated by tab-management controls.

P0 UI rule: The active context should be visible inside the bottom composer surface as a compact top row, with the text input and send button below it. It should not behave as an inline prefix inside the text field, and it should not become a separate detached status strip. Examples: `Current tab · Supabase Database`, `Selected tabs · 3 tabs`, `Group · Chrome Extension Docs`.

P0 UI rule: Current-tab context should use a short source label in the composer, such as `Supabase`, `GitHub`, or `Chrome Docs`, instead of rendering the full browser title like `Settings | Database | ai-music | Supabase`. Full titles can remain in tooltips or diagnostics, but the visible composer context must not look like multiple tabs.

P0 UI rule: Current-page chat supports short local multi-turn follow-up. After the user asks about the current page, natural follow-ups such as `what should I check next?` or `那备份呢？` should continue in current-page mode for the same tab, while explicit tab-management questions such as `show groups`, `restore`, `find github`, or `what did you close` still use the tab-management Agent.

P0 UI rule: Dashboard entry is a small top-right icon button. The old header refresh button and visible `Tab Agent` title are removed from the default sidebar chrome.

P1 beta UI rule: Current-group and selected-tabs content questions render a compact tool state as an assistant message before reading capped visible text. The state should show the tool, read count, skipped count, visible-text boundary, and session-only storage in a lightweight way, not as a debug panel. The visual form should be a small inline status pill inside the conversation, not a standalone card or tool panel.

P1 beta UI rule: Current-group and selected-tabs answers should lead with assistant prose. Read/skipped counts, skipped reason chips, themes, and host metadata may appear after the answer as compact supporting context, never as the first visual block.

### B. Group Overview

P0 UI rule: Group Overview is available to the runtime but is not shown as a heavy default list in the side panel. Dashboard carries the fuller group board.

显示 groups 列表：

```text
AI Tab Manager Research     14 tabs
Chrome Extension Docs        9 tabs
GitHub Projects             12 tabs
Product Planning             8 tabs
Reading                     10 tabs
Misc                         4 tabs
```

每个 group 支持：

- 展开查看 tabs。
- Rename。
- Collapse / Expand。
- Move to new window。
- Chat with group。
- Save workspace。

### C. Duplicate Cleanup

显示已关闭和待确认重复项。

### D. Guided Prompts

```text
[按项目重新分类]
[把 GitHub PR 单独分组]
[不要按网站分]
[总结当前页面]
[保存为工作区]
[恢复刚刚关闭的标签页]
```

### E. Chat Input / Composer

placeholder：

```text
Ask TabMosaic about your tabs...
```

Composer 固定在底部，用户主要通过输入框表达意图。

CONFIRMED BY IMPLEMENTATION:

```text
- The active context chip is inside the composer surface.
- The active context now behaves as the top row of the same composer surface, so `Selected tabs · 8 tabs` is visually connected to the textarea but not placed inside the input line.
- Selected-tabs context shows the scope plus count without repeating `Selected tabs` twice.
- Tool states render as lightweight inline assistant status, not dashboard cards or standalone panels.
- Context-tab answers lead with prose before compact summary metadata.
- The chat panel is a plain message stream, not a nested scrolling card; 10-turn conversations should scroll to the latest messages without horizontal clipping.
- Composer reset: the old right-side `Select page region` square no longer sits beside Send. The composer now uses a ChatGPT-like layout: context row on top, `+` context tool on the left, text input in the middle, and one Send button on the right.
```

## 5. Sidebar Chat 能力

- 重新分类。
- 合并/拆分 group。
- 重命名 group。
- 移动 tabs。
- 创建规则。
- 总结当前页面。
- 总结当前 group / selected tabs（用户触发，tool card，最多 6 tabs）。
- 找可关闭 tabs。
- 保存 workspace。
- 打开 dashboard。

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Current-group and selected-tabs deep questions route to the background context-tabs Agent flow.
- The flow renders a tool card in the chat stream, reads at most 6 visible pages, skips unsafe/unreadable tabs, and answers from DeepSeek when local private-beta settings are available.
- Tool-card messages are not included in AI chat memory; final context answers are included as normal assistant turns.
- Session-only follow-up reuse is supported for the same group/selected-tabs scope.
- Context answers now include a compact session-only group summary card with scope label, read/skipped counts, metadata/visible-text source, top hosts/themes, and safe next steps.
- Content-assisted regrouping preview is supported from capped visible text and renders an Apply / Cancel assistant message card before native groups change.
- Explicit web-search requests render a Sidebar Agent tool card plus a compact search result message; each result has a user-clicked Open action and the card discloses query/provider/session-only boundaries.

STILL PENDING:
- Real Chrome runtime QA for accepted optional per-site permission prompts and synthetic HTTP content extraction on this context-tabs path.
```

## 6. Chat 动作安全等级

| 操作 | 默认行为 |
|---|---|
| 创建/移动/重命名 group | 可直接执行，提供 Undo |
| 折叠 group | 可直接执行 |
| 关闭 exact duplicate | 可直接执行，提供 Restore |
| 关闭 non-duplicate tabs | 必须确认 |
| 读取当前页面正文 | 首次必须确认 |
| 读取多个页面正文 | 用户触发后默认允许；先显示 tool card；最多 6 tabs；敏感/受限页额外确认或跳过 |
| 上传正文到云端 | 必须明确授权 |

## 7. 示例交互

用户：

```text
不要按网站分，按项目分。
```

Agent：

```text
我会把当前分组改成项目维度：
- Chrome Extension Development
- AI Tab Manager Research
- Product Planning
- Reading
- Misc

这会移动 37 个 tabs，不会关闭任何 tab。
[Apply] [Cancel]
```

用户：

```text
以后所有 GitHub PR 都放 Code Review。
```

Agent：

```text
已创建规则 github.com/*/*/pull/* → Code Review。
我现在找到 6 个 PR tabs，可以立刻移动。
[Apply]
```

## 7.1 Chat Refine 当前实现

CONFIRMED BY IMPLEMENTATION:

```text
Sidebar includes a local Chat input.
Local Chat Refine is command-to-action before cloud fallback.
User input creates a safe action draft first.
Browser changes require explicit Apply.
Cancel discards the draft.
No page body is read.
No AI request is made for locally parsed commands.
No tabs are closed.
Chinese input can still be parsed for tolerance, but MVP visible preview answer/action/risk copy stays English-only to avoid mixed-language UI.
```

Supported first commands:

```text
GitHub PR to Code Review
docs.google.com to Docs & Notes
current tab to Reading
rename Misc to Reading
把 GitHub PR 放到 Code Review
把 docs.google.com 放到文档笔记
把当前标签页放到阅读
把 Misc 改名为阅读
```

Direct chat commands:

```text
summarize this page / 总结当前页面
summarize this page / what is this page about / 当前页面讲了什么
what can you do / 你能做什么
organize again / 重新整理
undo / 撤销
restore closed / 恢复已关闭
open dashboard / 打开 Dashboard
save workspace / 保存工作区
```

Read-only status questions:

```text
what happened / 刚才整理了什么
how much memory did you save / 释放了多少内存
optimization result / 本次优化效果
show groups / 有哪些分组
duplicates / 重复项处理了吗
what needs review / 哪些重复项需要确认
what did you close / 刚才关闭了哪些标签页
did AI classify this / AI 有没有参与
what tab am I on / 当前活跃标签页
protected tabs / 哪些标签页受保护
read later / 哪些标签页适合稍后看
```

Open-ended fallback:

```text
If the user types an open-ended question and local commands/actions do not match:
- with DeepSeek + latest organize context: ask the metadata-only Agent
- without latest organize context: answer as a normal assistant message and ask the user to organize first
- with latest context but no DeepSeek enabled: answer as a normal assistant message and explain that freer AI conversation requires enabling DeepSeek
- never show the raw local Chat Refine parser error as the final chat response
```

Tab search:

```text
find github / 找 GitHub
open chrome docs / 打开 Chrome docs 标签页
search docs.google.com / 搜索 docs.google.com
```

Current optimization answer behavior:

```text
- renders as an assistant message card, not plain text only and not a separate dashboard-style result card
- shows groups created, tabs organized, safe duplicates closed, duplicate groups needing review, and memory relief
- memory relief is counted as duplicate tabs freed; the Agent does not invent exact MB
- offers safe next-step buttons: Groups, Restore Closed, Review duplicates, Dashboard when relevant
```

DeepSeek metadata Agent first slice:

```text
- if direct commands, read-only status answers, tab search, and local chat-refine drafts do not match
- and DeepSeek is enabled with a local API key
- Sidebar can ask DeepSeek for a conversational tab-management answer
- input is minimized current run metadata plus active Sidebar context and up to 4 sanitized recent user/assistant chat turns
- recent chat turns are used only to resolve follow-ups like “why those tabs?” and are not stored in cloud
- no page body, page summary, full URL, restore URL, favicon URL, cookies, form data, hidden DOM, browser history, saved workspace contents, or cloud memory is sent
- open-ended output renders as a plain assistant message card without relevant tab rows or compact safe action chips
- it must not show a separate `Suggested next steps` panel or per-message privacy footnote; privacy boundaries stay in first-run copy, docs, and payload tests
- output may include a validated `move_tabs` action draft when the user explicitly asks to move or regroup existing tabs
- AI move drafts render as the same assistant message card shape with matched tab rows and Apply / Cancel
- output does not automatically move, close, rename, save, or read tabs
- invented tab IDs, pinned tabs, unsupported draft types, and destructive close/delete actions are filtered out before rendering
- applying an AI move draft reuses the existing `move_tabs` path, creates native Chrome tab groups, keeps Undo, and does not close tabs
- provider failure falls back to the existing local command/action flow
```

Supported actions:

```text
- create local user rule and move matching current tabs
- move current tab to a native Chrome group
- rename matching native Chrome groups
- run existing safe sidebar actions from the composer: current-tab summary/page question, organize, undo, restore closed, open dashboard
- answer latest run status, groups, duplicate handling, duplicate review queue, closed duplicate tabs, AI status, active-tab state, protected-tab state, and possible read-later candidates from local run state only
- answer “what should I do next / 下一步” from local organize state, prioritizing duplicate review before restore/use-group guidance
- find matching tabs from the latest local snapshot and focus an existing tab with explicit Open
- answer open-ended and follow-up tab-management questions with DeepSeek from minimized tab metadata, active Sidebar context, and sanitized recent chat turns only when enabled
- propose a DeepSeek-assisted `move_tabs` draft for explicit regroup/move requests; the user must click Apply before native groups change
- answer current-group / selected-tabs content questions after a tool card, capped visible-text extraction, and session-only context
- propose content-assisted regrouping from capped visible text; native group changes still require Apply / Cancel
```

Rules created from chat are stored locally and appear in Dashboard → Rules & Memory.

## 7.2 Chat-First Glass UI 当前实现

CONFIRMED BY USER / CONFIRMED BY IMPLEMENTATION:

```text
Sidebar default UI uses a minimal glass Tab Agent layout.
First screen shows a conversation thread and bottom composer.
Organize output appears as an agent message, not as a dashboard panel.
Latest organize result and quick actions are rendered as one assistant message bubble in the conversation thread.
The completion message mentions groups created, tabs organized, duplicate-tab memory relief proxy, review duplicates, and whether DeepSeek or local fallback was used.
Quick actions are compact chips inside the assistant message bubble: Organize, Undo, Restore when relevant.
The composer shows a small context status row, for example `Current tab · chrome.sidePanel API` or `Group · Product Planning · 7 tabs`.
Dashboard tab/group selection writes the same context, so clicking a Smart Group or tab can make the Sidebar conversation target that object.
Dashboard opens from a dedicated top-right icon button, not from a crowded result card.
Technical lists are hidden from the default chat surface.
Composer messages stay in a short local in-memory thread, with user messages and Agent replies shown as separate chat bubbles.
Quick action chips route through the same chat command path as typed commands, so clicking Organize / Undo / Restore / Dashboard also appears in the message thread.
Current tab summary and first-slice local page Q&A are composer-driven current-tab chat requests and render back as chat messages in the same conversation flow.
Current-page Q&A screenshots and QA should use a realistic page conversation scenario, not only a tab-move draft scenario.
Current-page follow-up context is short-lived and local in memory. It stores only the current tab pointer plus recent question/answer text already visible in the chat, not page body text or full URLs.
DeepSeek open-ended Agent answers render as plain assistant message bubbles only; they should not append tab rows, `Open tab`, `Groups`, `Open Dashboard`, or other action chips unless the user explicitly asks for an action that needs Apply / Cancel.
The bottom composer can trigger summary, organize, undo, restore, dashboard, and local save workspace commands directly.
The bottom composer can parse current-page questions, including natural content questions such as `当前页面有什么内容`, read only the current page after the existing user-triggered privacy flow, and answer through DeepSeek Page Agent when a local key is available. If AI is not configured, it should show a provider-configuration prompt before reading page body content. If the provider fails, it should show an explicit AI-error answer instead of using local visible-text matching as a fake AI reply.
The bottom composer can answer help/capability questions locally so first-time users understand the wired MVP commands.
The bottom composer can answer latest-result, group, duplicate, duplicate-review, closed-duplicate, AI status, active-tab, protected-tab, and read-later questions without reading page content.
The bottom composer can answer “what should I do next / 下一步” locally from the latest organize state.
The bottom composer can find tabs from the latest local snapshot and focus a selected existing tab.
The bottom composer can save the latest organized result as a local-only workspace snapshot without full URLs, restore URLs, URL hashes, favicon URLs, page text, cloud data, summaries, or chat history.
The old separate summary panel remains hidden after composer-triggered summaries.
No internal next-build / QA copy is shown in the side panel.
```

## 8. 验收标准

```gherkin
Given 自动整理已完成
When sidebar 打开
Then 用户能看到整理摘要、核心操作、优化情况、Undo/Restore 和 Chat
And 默认界面像对话框，有消息流和底部输入框
And 用户输入和 Agent 回复会保留为最近几条消息，而不是每次只替换最后一条
And 快捷动作按钮也会进入同一个消息流，而不是绕过对话
And 用户能问“你能做什么 / what can you do”并得到本地能力说明
And 技术列表默认不出现在首屏聊天界面
And 用户能通过聊天调整分组
And 用户能问“下一步 / what should I do next”并得到基于最新整理状态的本地建议
And 用户能询问最新整理结果、分组、重复项、待确认重复项、已关闭重复项、AI 状态、当前活跃标签页、受保护标签页和稍后阅读候选
And 用户能搜索当前 tabs 并打开匹配的已有标签页
And 用户能总结当前页面，也能问当前页面一个问题，并在聊天消息流里看到本地回答
And 用户能针对 current group / selected tabs 发起内容问答，并在读取前看到 tool card
And group/selected-tabs 内容读取最多 6 个 tabs，敏感/受限页跳过或额外确认，结果不持久保存
And 高风险动作需要确认
And Chat Refine preview 不读取页面正文、不调用云端 AI、不关闭 tabs
And 当前页问答只读取当前页可见文本；group/selected-tabs 问答必须走单独的 tool-card 批量读取流程
```
