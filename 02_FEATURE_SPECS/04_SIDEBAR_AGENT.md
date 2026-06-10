# 功能规格：Sidebar Agent

## 1. 目标

Sidebar 是点击插件后打开的 Tab Agent 对话框。它的默认形态应该像 OpenAI / ChatGPT 的侧边对话界面：消息流、底部输入框、少量快捷动作。它可以解释顶部 tab bar 的变化，但不能再做成复杂结果面板。

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
Tab Agent

[system]
Organize complete.
Created 8 native groups and moved 61 tabs.

[agent result]
Browser cleaned up
Groups 8 · Tabs moved 61 · Closed 9 · Review 4

[agent action]
Organize · Ask page · Undo · Restore · Dashboard

Ask TabMosaic about your tabs...
[GitHub PR] [Current tab] [Rename]
```

## 4. 模块结构

### A. Conversation Thread

默认显示对话消息流。整理结果、动作草稿、页面总结都作为 agent messages 出现。

P0 UI rule: Quick actions should appear as a lightweight agent message card, not as a separate dashboard toolbar.

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

## 5. Sidebar Chat 能力

- 重新分类。
- 合并/拆分 group。
- 重命名 group。
- 移动 tabs。
- 创建规则。
- 总结当前页面。
- 总结当前 group / P1。
- 找可关闭 tabs。
- 保存 workspace。
- 打开 dashboard。

## 6. Chat 动作安全等级

| 操作 | 默认行为 |
|---|---|
| 创建/移动/重命名 group | 可直接执行，提供 Undo |
| 折叠 group | 可直接执行 |
| 关闭 exact duplicate | 可直接执行，提供 Restore |
| 关闭 non-duplicate tabs | 必须确认 |
| 读取当前页面正文 | 首次必须确认 |
| 读取多个页面正文 | 必须确认 |
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
The first slice is command-to-action, not open-ended cloud chat.
User input creates a safe action draft first.
Browser changes require explicit Apply.
Cancel discards the draft.
No page body is read.
No AI request is made.
No tabs are closed.
Chinese input returns Chinese preview answer/action/risk copy.
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
ask page: what does this page say about tabs / 问页面：这里关于 tabs 说了什么
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
show groups / 有哪些分组
duplicates / 重复项处理了吗
what needs review / 哪些重复项需要确认
what did you close / 刚才关闭了哪些标签页
did AI classify this / AI 有没有参与
what tab am I on / 当前活跃标签页
protected tabs / 哪些标签页受保护
read later / 哪些标签页适合稍后看
```

Tab search:

```text
find github / 找 GitHub
open chrome docs / 打开 Chrome docs 标签页
search docs.google.com / 搜索 docs.google.com
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
```

Rules created from chat are stored locally and appear in Dashboard → Rules & Memory.

## 7.2 Chat-First Glass UI 当前实现

CONFIRMED BY USER / CONFIRMED BY IMPLEMENTATION:

```text
Sidebar default UI uses a minimal glass Tab Agent layout.
First screen shows a conversation thread and bottom composer.
Organize output appears as an agent message, not as a dashboard panel.
Quick actions are compact chips inside the conversation thread: Organize, Ask page, Undo, Restore, Dashboard.
Technical lists are hidden from the default chat surface.
Composer messages stay in a short local in-memory thread, with user messages and Agent replies shown as separate chat bubbles.
Quick action chips route through the same chat command path as typed commands, so clicking Organize / Ask page / Undo / Restore / Dashboard also appears in the message thread.
Current tab summary and first-slice local page Q&A are compact Ask page actions and render back as chat messages in the same conversation flow.
The bottom composer can trigger summary, organize, undo, restore, dashboard, and local save workspace commands directly.
The bottom composer can parse `ask page: ...` / `问页面：...`, read only the current page after the existing user-triggered privacy flow, and answer from visible page text with local sentence matching.
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
And 高风险动作需要确认
And Chat Refine preview 不读取页面正文、不调用云端 AI、不关闭 tabs
And 当前页问答只读取当前页可见文本，不读取多个页面，不上传正文
```
