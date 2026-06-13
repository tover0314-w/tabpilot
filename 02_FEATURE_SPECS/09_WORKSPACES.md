# 功能规格：Workspaces

## 0. 当前实现状态

CONFIRMED BY IMPLEMENTATION:

```text
P0 first slice supports saving the current organized browser state as a local-only workspace snapshot from Dashboard.
The saved snapshot is stored in chrome.storage.local under tabmosaic.savedWorkspaces.
It keeps minimized local metadata needed to show a saved workspace list: group names/colors/counts, tab title/hostname/path/group mapping, and summary counts.
It does not store full URLs, restore URLs, URL hashes, favicon URLs, page text, summaries, chat history, or cloud data.
Saved workspace UI remains hidden from the default Dashboard. A private-beta restore first slice is wired for local snapshots, but it only regroups tabs that are still open on the same device by saved local tab IDs.
Users can delete an individual saved local snapshot from Dashboard after browser confirmation. This only removes the selected item from tabmosaic.savedWorkspaces and does not restore, close, or move tabs.
Users can restore an individual saved local snapshot from Dashboard after browser confirmation. This saves an Undo snapshot, regroups only currently open, unprotected, non-internal tabs that still match saved local tab IDs, preserves saved group name/color where possible, and reports skipped tabs. It does not reopen closed pages, close tabs, read page text, upload data, or use full URLs.
Full historical workspace management, reopening closed tabs from workspace history, export, cloud sync, and workspace chat remain P1/Pro and are not wired yet.
```

## 1. 目标

让用户保存、恢复和管理一组 tabs + groups + summaries + chat history。

## 2. Workspace 定义

Workspace 是一个浏览器工作上下文：

```text
tabs
groups
group order
group collapsed state
summaries
rules used
chat history
created/updated time
```

## 3. 用户场景

- 保存当前 AI research 工作区。
- 明天恢复昨天写 PRD 的 tabs。
- 把某个竞品研究 workspace 导出成 markdown。
- 和历史 workspace 聊天。
- 从 workspace 生成 dashboard template。

## 4. P0 / P1 范围

### P0

- Save current workspace locally（first slice implemented as local snapshot）。
- Restore currently open tabs from a saved local workspace snapshot（private-beta first slice；tabId-based only；does not reopen closed pages）。
- Delete individual local saved workspace snapshot with confirmation.
- Dashboard 查看当前 workspace。
- Apply current dashboard changes to browser。

### P1 / Pro

- Workspace history。
- Full workspace restore, including reopening previously closed pages after an explicit future privacy/storage design.
- Cloud sync。
- Workspace chat。
- Export markdown/JSON/CSV。
- Template generation。

## 5. 数据结构

```ts
export type Workspace = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  source: 'auto_organize' | 'manual_save' | 'dashboard';
  groups: SavedGroup[];
  tabs: SavedTab[];
  summaries: TabSummary[];
  rulesUsed: string[];
  chatThreadIds: string[];
};
```

## 6. UI

Workspace card：

```text
AI Tab Manager Research
8 groups · 73 tabs · Updated 2 hours ago
Summary: Research workspace for AI browser tab management products.

[Open] [Restore] [Chat] [Export] [Archive]
```

## 7. Restore 行为

用户点击 Restore：

```text
读取本地 saved workspace snapshot
→ 找出当前仍然打开、未 pinned、非内部页、非 incognito 的 saved tab IDs
→ 保存 Undo snapshot
→ 按 saved groups 重新创建/更新原生 tab groups
→ 尽量恢复 group name/color
→ Dashboard 展示 restored/skipped 结果
```

Current limitation:

```text
The snapshot does not contain full URLs by design, so the restore first slice cannot reopen closed pages.
Closed/missing/protected/internal tabs are skipped and counted.
```

## 8. 冲突处理

若当前窗口已有大量 tabs：

```text
你要恢复到当前窗口，还是新窗口？
[Current Window] [New Window]
```

Future full restore can ask current window vs new window. The implemented private-beta first slice only regroups matching tabs that are already open, using their current windows.

## 9. 验收标准

```gherkin
Given 用户已整理一个窗口
When 用户点击 Save Workspace
Then 系统保存当前 tabs、groups、顺序和摘要到本地 snapshot
And default Dashboard 不显示 Saved Workspaces 入口，直到 restore/history/workspace chat 形成完整用户价值
And saved snapshot 不包含 full URL、restore URL、page text 或 cloud data
And full history restore / workspace chat remain future Pro candidates

Given 用户在 Dashboard 删除一个 saved workspace snapshot
When 用户确认删除
Then 仅删除该本地 snapshot
And 不恢复、不关闭、不移动任何 tabs

Given 用户保存过一个本地 workspace snapshot
And 其中部分 saved tabs 仍然打开
When 用户在隐藏/private-beta Dashboard path 中确认 Restore
Then 系统只按 saved local tab IDs 重新分组当前仍打开且安全的 tabs
And 保留 saved group name/color where possible
And 关闭、missing、pinned、内部页或 incognito tabs 被 skipped
And 系统不会重新打开网页、关闭 tabs、读取 page text、上传数据或使用 full URL
And Undo 可以尽量恢复 Restore 前的 group 状态
```
