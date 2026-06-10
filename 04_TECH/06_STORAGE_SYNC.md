# 存储与同步

## 1. 存储目标

保存用户偏好、规则、整理历史、Undo snapshot、workspace、摘要和 chat history。

## 2. P0 本地存储

### chrome.storage.local

适合：

- settings。
- user rules。
- learned rules。
- recent workspaces metadata。
- saved workspace snapshots（P0 local-only minimized snapshot）。
- privacy preferences。

### chrome.storage.session

适合：

- 当前整理任务状态。
- 临时 plan。
- sidebar progress。

### IndexedDB

适合：

- 大量 tab summaries。
- chat history。
- larger workspace snapshots / P1 restore history。
- restore history。

## 3. P1 云同步

Pro 后端保存：

- account。
- subscription。
- usage。
- synced rules。
- workspace metadata。
- selected summaries。
- AI memory。

## 4. 数据保留策略

建议默认：

```text
Undo snapshots: 保留最近 20 次或 7 天
Closed tabs restore history: 保留 7-30 天
Tab summaries: 用户保存才长期保留
Workspace: Free 限量，Pro 无限/高限额
Chat history: Free 本地短期，Pro 可云同步
```

## 5. 数据删除

用户必须能：

- 删除本地所有数据。
- 删除所有 summaries。
- 删除所有 rules。
- 删除 workspace。
- 删除云端账号数据 / Pro。
- 导出数据。

### 5.1 当前实现

P0 Dashboard Settings includes `Clear Local Data`.

Cleared `chrome.storage.local` keys:

```text
tabmosaic.currentRun
tabmosaic.lastUndo
tabmosaic.lastClosedTabs
tabmosaic.privacyAccepted
tabmosaic.aiSettings
tabmosaic.userRules
tabmosaic.chatDraft
tabmosaic.errorLog
tabmosaic.duplicateSafetyAudit
tabmosaic.savedWorkspaces
```

After clearing, the extension publishes an idle run state and first-run privacy onboarding appears again before the next organize.

Current `tabmosaic.savedWorkspaces` P0 snapshot is local-only and minimized. It stores group names/colors/counts, tab title/hostname/path/group mapping, and summary counts. It does not store full URLs, restore URLs, URL hashes, favicon URLs, page text, summaries, chat history, or cloud data.

Dashboard can delete an individual saved workspace snapshot after browser confirmation. The delete path rewrites only `tabmosaic.savedWorkspaces` with the selected snapshot removed. It does not touch current tabs, groups, Undo/Restore snapshots, rules, browser history, cookies, cloud data, or AI settings.

## 6. Sync 冲突

P1 问题：

- 同一规则跨设备被修改。
- 同一 workspace 被更新。
- Chrome groupId 是 session-specific，不能跨会话依赖。

策略：

- 使用 stable internal IDs。
- tab/group restore 根据 URL/title 重新创建。
- groupId 只作为运行时字段。
