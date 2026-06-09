# 功能规格：Dashboard 看板

## 0. 当前实现状态

CONFIRMED BY IMPLEMENTATION:

```text
P0 dashboard is an extension page.
It follows the HTML prototype workbench layout: top bar, left project rail, current workspace card, action block, filter chips, Smart Groups board, Auto Organize rules page, and Settings page.
It shows latest workspace metrics, expanded Smart Group cards with local tab rows, Duplicate Center, Settings Snapshot, AI Settings, and Rules & Memory.
Rules & Memory can enable, disable, and delete local chat-created rules. Delete requires confirmation because rules are user correction memory.
Dashboard apply-back-to-browser first slice supports native group title/color updates with Undo.
Dashboard drag/drop tab movement is still not implemented.
Workspace history, manual group creation, new rule creation, group chat, and saved workspaces remain P1/Pro placeholders in the UI.
```

## 1. 定位

Dashboard 不是普通设置页，而是付费用户的长期浏览器工作区。

一键整理解决即时混乱；dashboard 解决长期价值：好的分组、workspace、摘要、规则、AI 记忆、付费用量。

## 2. 用户价值

用户可以：

- 查看 AI 整理好的 Smart Groups。
- 在看板中调整分组并 apply 回浏览器顶部 tab bar。
- 保存当前工作区。
- 恢复历史 workspace。
- 管理分类规则和 AI 记忆。
- 查看页面摘要库。
- 和某个 tab、多个 tabs、group 或 workspace 聊天。
- 管理订阅和 AI credits。

## 3. Dashboard 入口

- Sidebar 顶部 `Open Dashboard`。
- Group card 上的 `Manage`。
- Extension options page。
- 快捷键 / P1。

## 4. 页面结构

```text
Home
Smart Groups
Workspaces
Tab Knowledge
Rules & Memory
Duplicate Center
Templates
Usage & Billing
Settings
```

## 5. Home

显示：

```text
当前浏览器：73 tabs / 4 windows
当前 groups：8
重复 tabs：4 待确认
最近 workspace：AI Tab Manager Research
今日节省：整理 126 tabs，关闭 19 duplicates
AI credits：320 / 1000
```

CTA：

```text
[Organize Browser]
[Open Current Workspace]
[Review Duplicates]
[Chat with Current Tabs]
```

## 6. Smart Groups

看板式 group cards。

### Group Card 字段

```text
name
color
tabs count
confidence
summary
top domains
last updated
source workspace
```

### Actions

```text
Chat
Summarize
Rename
Change color
Merge
Split
Apply to browser
Save as template
Move group to new window
Archive
```

### Tab Row

```text
favicon
title
hostname
summary status
duplicate status
last accessed
group assignment
actions
```

Tab actions：

```text
Open
Move
Close
Protect
Summarize
Chat
Read later
```

## 7. Dashboard 调整同步浏览器

关键能力：dashboard 不是静态管理。用户在 dashboard 拖拽 tabs 到其他 group 后，点击 Apply，浏览器顶部原生 tab group 必须同步更新。

```text
用户拖动 Tab A → Product Planning
→ 点击 Apply
→ Chrome 顶部 tab bar 中 Tab A 移入 Product Planning group
```

## 8. Workspaces

Workspace 是 tabs + groups + summaries + rules context + chat history 的可保存工作区。

Actions：

- Save current workspace。
- Restore workspace。
- Duplicate。
- Rename。
- Archive。
- Delete。
- Export markdown/JSON/CSV。
- Chat with workspace。

## 9. Rules & Memory

显示用户规则：

```text
github.com/*/*/pull/* → Code Review
developer.chrome.com/docs/extensions/* → Chrome Extension Docs
linear.app → Product
youtube.com/watch + tutorial → Learning
```

Actions：

- Create/Edit/Delete rule。
- Enable/Disable。
- View hit count。
- Apply to current browser。
- See source: manual/chat/correction。

## 10. Tab Knowledge

页面摘要库。

包含：

- 当前页面摘要。
- group 摘要。
- workspace 摘要。
- 关键点。
- 建议分组。
- 建议操作。
- chat history。

## 11. Duplicate Center

显示：

- 已关闭重复 tabs。
- 待确认疑似重复 tabs。
- 恢复历史。
- 去重规则。
- protected domains。

## 12. Usage & Billing

付费页面显示：

- 当前 plan。
- AI credits。
- 本月一键整理次数。
- 当前 tab summary 次数。
- multi-tab chat 次数。
- workspace 数量。
- 升级/管理订阅。

## 13. P0 Dashboard Scope

建议 P0 只做：

- Current Workspace Overview。
- Smart Groups 看板。
- 基础拖拽调整。
- Apply to browser。
- Save current workspace locally。
- Basic rules view。

完整历史 workspace、云同步、billing 和 multi-tab chat 可 P1。

## 14. 付费策略

Dashboard 的 Pro 付费点：

- unlimited workspaces。
- workspace history。
- multi-tab chat。
- group summary。
- AI memory。
- sync。
- hosted AI。

## 15. 验收标准

```gherkin
Given 用户已经整理当前浏览器所有普通窗口
When 用户打开 dashboard
Then 用户能看到当前 Smart Groups 看板
And 用户能调整 group 和 tabs
And 用户能 apply 调整回浏览器顶部 tab bar
And 用户能保存当前 workspace
And Pro 用户可以使用高级 workspace / multi-tab chat 能力
```
