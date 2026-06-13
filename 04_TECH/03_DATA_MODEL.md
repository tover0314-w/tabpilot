# 数据模型

## TabSnapshot

```ts
export type TabSnapshot = {
  id: number;
  windowId: number;
  index: number;
  groupId: number;
  title: string;
  url?: string;
  hostname?: string;
  path?: string;
  favIconUrl?: string;
  active: boolean;
  pinned: boolean;
  audible: boolean;
  discarded: boolean;
  incognito: boolean;
  lastAccessed?: number;
};
```

`favIconUrl` is local display metadata only. Runtime snapshots sanitize it by allowing `data:image/*` or stripping query/hash from `http(s)` favicon URLs. It is not included in AI classification payloads.

## GroupSnapshot

```ts
export type GroupSnapshot = {
  id: number;
  windowId: number;
  title?: string;
  color?: ChromeTabGroupColor;
  collapsed: boolean;
  index?: number;
  tabIds: number[];
};
```

## GroupPlan

```ts
export type GroupPlan = {
  id: string;
  name: string;
  color: ChromeTabGroupColor;
  tabIds: number[];
  confidence: number;
  reason: string;
  shouldCollapse: boolean;
  order: number;
};
```

## DuplicateGroup

```ts
export type DuplicateGroup = {
  id: string;
  canonicalUrl: string;
  tabs: TabSnapshot[];
  keepTabId: number;
  closeTabIds: number[];
  duplicateType: 'exact' | 'tracking_params' | 'hash' | 'query' | 'semantic';
  confidence: number;
  autoCloseAllowed: boolean;
  reason: string;
};
```

Current no-build extension slice stores a lightweight runtime shape:

```ts
export type RuntimeDuplicateGroup = {
  id: string;
  type: 'exact' | 'tracking' | 'same-page-review';
  action: 'safe-close-candidate' | 'review';
  label: string;
  tabCount: number;
  protectedCount: number;
  tabIds: number[];
  reviewStatus?: 'pending' | 'kept' | 'resolved';
};
```

Manual review actions append `reviewActions` to the latest run and manually closed review tabs reuse `ClosedTabSnapshot` restore storage.

## AgentPlan

```ts
export type AgentPlan = {
  id: string;
  createdAt: number;
  userInstruction?: string;
  source: 'one_click' | 'chat' | 'dashboard';
  groups: GroupPlan[];
  duplicates: DuplicateGroup[];
  actions: AgentAction[];
  requiresConfirmation: boolean;
};
```

## AgentAction

```ts
export type AgentAction =
  | { type: 'CREATE_GROUP'; name: string; color: string; tabIds: number[] }
  | { type: 'MOVE_TABS'; tabIds: number[]; targetGroupId: number }
  | { type: 'RENAME_GROUP'; groupId: number; name: string }
  | { type: 'COLLAPSE_GROUP'; groupId: number; collapsed: boolean }
  | { type: 'CLOSE_TABS'; tabIds: number[]; reason: string }
  | { type: 'RESTORE_TABS'; closedTabIds: string[] }
  | { type: 'CREATE_RULE'; rule: UserRule }
  | { type: 'SAVE_WORKSPACE'; workspaceId: string }
  | { type: 'SUMMARIZE_TAB'; tabId: number }
  | { type: 'SUMMARIZE_GROUP'; groupId: number };
```

## UndoSnapshot

```ts
export type UndoSnapshot = {
  id: string;
  createdAt: number;
  windowId: number;
  actionType: 'AUTO_ORGANIZE' | 'DEDUP' | 'CHAT_ACTION' | 'DASHBOARD_APPLY';
  tabsBefore: TabSnapshot[];
  groupsBefore: GroupSnapshot[];
  closedTabs: ClosedTabSnapshot[];
  actionsApplied: AgentAction[];
};
```

## ClosedTabSnapshot

```ts
export type ClosedTabSnapshot = {
  id: string;
  originalTabId: number;
  title: string;
  url: string;
  windowId: number;
  index: number;
  groupName?: string;
  groupColor?: ChromeTabGroupColor;
  pinned: boolean;
  closedAt: number;
  duplicateReason: string;
};
```

## Workspace

Current P0 implementation stores a local-only minimized snapshot:

```ts
export type SavedWorkspaceSnapshot = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  source: 'dashboard' | string;
  summary: {
    tabCount: number;
    groupCount: number;
    windowCount: number;
    safeDuplicatesClosed: number;
    reviewDuplicateGroups: number;
    aiClassificationStatus: string;
  };
  groups: Array<{
    id: number;
    windowId: number;
    name: string;
    color: ChromeTabGroupColor;
    tabCount: number;
    reason: string;
    tabIds: number[];
  }>;
  tabs: Array<{
    id: number;
    windowId: number;
    index: number;
    title: string;
    hostname: string;
    path: string;
    groupId: number;
    active: boolean;
    pinned: boolean;
    audible: boolean;
    discarded: boolean;
  }>;
};
```

Storage key:

```text
tabmosaic.savedWorkspaces
```

P0 saved workspace snapshots do not include full URLs, restore URLs, URL hashes, favicon URLs, page text, cloud IDs, summaries, or chat history. Restore/export/chat are P1.

Current private-beta restore first slice uses only saved local tab IDs plus current live browser tab state:

```ts
export type SavedWorkspaceRestoreResult = {
  workspaceId: string;
  workspaceName: string;
  restoredTabs: number;
  restoredGroups: number;
  skippedTabs: number;
};
```

It creates an Undo snapshot before regrouping, restores only currently open unprotected tabs that still match saved tab IDs, and skips missing/closed/pinned/internal/incognito tabs. It does not reopen pages because the saved snapshot intentionally does not store full URLs.

## Browser Work Queue and Collections

Current local-first Workbench objects:

```ts
export type BrowserWorkSource = {
  title: string;
  hostname: string;
  path: string;
  url?: string;
  snippet?: string;
  sourceType: 'search_result' | 'pasted_link' | string;
  savedAt: string;
};

export type AgentTask = {
  id: string;
  title: string;
  status: 'open' | 'done' | 'archived';
  source: 'dashboard_selection' | 'sidebar_agent' | 'current_page_agent' | 'sidebar_search_result' | 'sidebar_pasted_link' | string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
  tabIds: number[];
  tabs: Array<{
    id: number;
    windowId: number;
    groupId: number | null;
    groupName: string;
    title: string;
    hostname: string;
    path: string;
    active: boolean;
    pinned: boolean;
    audible: boolean;
  }>;
  sources?: BrowserWorkSource[];
  checklist?: string[];
};

export type SavedCollection = {
  id: string;
  name: string;
  source: 'dashboard_selection' | 'sidebar_search_result' | 'sidebar_pasted_link' | string;
  createdAt: string;
  updatedAt: string;
  tabIds: number[];
  tabs: AgentTask['tabs'];
  sources?: BrowserWorkSource[];
};
```

Storage keys:

```text
tabmosaic.agentTasks
tabmosaic.savedCollections
```

Privacy notes:

```text
- Tab-linked tasks/collections store tab title, hostname, path, state, and local tab IDs only.
- Search-result and pasted-link sources store sanitized source title, hostname, path, optional snippet, and a local source URL with username/password/query/hash stripped.
- Current-page checklist todos store generated checklist text locally only after the user explicitly asks to read the page.
- These objects do not store raw page text, full tab URLs, browser history, cookies, form values, or cloud IDs.
- No TabMosaic cloud storage is used in the current implementation.
```

Long-term target shape:

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

## UserRule

```ts
export type UserRule = {
  id: string;
  type: 'domain' | 'url_pattern' | 'keyword' | 'title_pattern' | 'semantic' | 'protected' | 'privacy';
  pattern: string;
  targetGroupName?: string;
  priority: number;
  enabled: boolean;
  createdFrom: 'manual' | 'chat' | 'correction' | 'system_suggestion';
  hitCount: number;
  lastUsedAt?: number;
};
```

Current extension storage key:

```text
tabmosaic.userRules
```

Current runtime additions:

```ts
export type RuntimeUserRule = UserRule & {
  targetGroupColor?: ChromeTabGroupColor;
  reason?: string;
  updatedAt: string;
  lastUsedAt?: string;
};
```

The first implemented rule types are `url_pattern` and `domain`. Rules created from Chat Refine are local-only and are applied before AI and built-in classification.

## ChatThread

```ts
export type ChatThread = {
  id: string;
  scope: 'current_tab' | 'selected_tabs' | 'group' | 'window' | 'workspace';
  scopeIds: string[];
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};
```
