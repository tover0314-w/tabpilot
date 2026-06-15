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
  sourceType: 'search_result' | 'pasted_link' | 'fetched_link' | string;
  savedAt: string;
};

export type FetchedLinkSessionResult = {
  status: 'completed' | 'error';
  source: 'fetched_link';
  title: string;
  hostname: string;
  path: string;
  summary: string;
  keyPoints: string[];
  suggestedGroup?: string;
  suggestedAction?: 'keep' | 'read_later' | 'review';
  provider: string;
  aiUsed: boolean;
  permissionOrigin: string;
  fetchedAt: string;
  privacy: {
    fetchedUserProvidedUrl: true;
    sentTabMetadata: false;
    sentPageText: boolean;
    sentFullUrls: false;
    storedCloud: false;
    storage: 'session_only_until_saved';
  };
};

export type SearchProviderDiagnostics = {
  status: 'not-configured' | 'unsupported-provider' | 'completed' | 'failed' | string;
  provider: string;
  providerLabel: string;
  enabled: boolean;
  configured: boolean;
  apiKeyStatus: 'saved' | 'missing';
  baseOrigin: string;
  permissionOrigin: string;
  maxResults: number;
  searchDepth: 'basic' | 'advanced';
  resultCount: number;
  errorType?: string;
  checkedAt: string;
  privacy: {
    sentQuery: boolean;
    sentTabData: false;
    sentPageText: false;
    sentFullUrls: false;
    storedResults: false;
    storedQuery: false;
    storedApiKey: false;
  };
};

export type AgentTask = {
  id: string;
  title: string;
  status: 'open' | 'done' | 'archived';
  source: 'dashboard_selection' | 'sidebar_agent' | 'current_page_agent' | 'sidebar_search_result' | 'sidebar_pasted_link' | 'ai_triage' | string;
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
  checklistMeta?: Array<{
    sourceNote?: string;
  }>;
  checklistUpdatedAt?: string;
  mergedContexts?: Array<{
    scope: 'current_tab' | 'selected_tabs' | 'current_group' | 'current_window' | string;
    tabCount: number;
    sourcePrompt: string;
    updatedAt: string;
  }>;
  triage?: {
    workspaceFocus?: string;
    actNow?: string[];
    readLater?: string[];
    reference?: string[];
    canClose?: string[];
    needsReview?: string[];
    metadataOnly?: true;
  };
};

export type TabWorkState = {
  state: 'done' | 'later' | 'keep';
  tabId: number;
  title: string;
  hostname: string;
  path: string;
  source: 'dashboard_tab_row' | 'sidebar_agent' | string;
  updatedAt: string;
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

export type SavedMemo = {
  id: string;
  title: string;
  body: string;
  source: 'ai_agent_chat' | 'current_page_chat' | 'context_tabs_chat' | 'compare_selected_tabs' | 'research_brief' | 'fetched_link' | string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  context: {
    scope?: 'current_tab' | 'selected_tabs' | 'current_group' | 'current_window' | 'pasted_link' | string;
    tabId?: number;
    windowId?: number;
    groupId?: number;
    title?: string;
    hostname?: string;
    path?: string;
    groupName?: string;
    tabCount?: number;
  };
  provider?: string;
  aiUsed?: boolean;
  tabIds: number[];
  tabs: AgentTask['tabs'];
  sources?: BrowserWorkSource[];
};

export type BrowserWorkSearchResult = {
  type: 'tab' | 'group' | 'todo' | 'memo' | 'collection' | 'workspace' | 'tab_state' | 'duplicate';
  title: string;
  subtitle?: string;
  description?: string;
  hostname?: string;
  path?: string;
  tabId?: number;
  groupId?: number;
  status?: string;
  score: number;
};

export type BrowserWorkBrief = {
  steps: string[];
  matchedTabs: Array<{
    id: number;
    title: string;
    hostname: string;
    path: string;
  }>;
};
```

Sidebar Todo Agent polish may rewrite the latest open `AgentTask` title or checklist after explicit chat commands. The checklist remains an array of sanitized strings; completed checklist items are stored as string state (`Done: ...`) in this first slice instead of adding a new nested checklist item schema. This keeps backward compatibility with existing Dashboard previews and local search.

Storage keys:

```text
tabmosaic.agentTasks
tabmosaic.savedMemos
tabmosaic.savedCollections
tabmosaic.savedWorkspaces
tabmosaic.tabWorkStates
tabmosaic.lastTabStateUndo
tabmosaic.agentRunTranscripts
tabmosaic.workspaceGoal
```

Privacy notes:

```text
- Tab-linked tasks/collections store tab title, hostname, path, state, and local tab IDs only.
- Saved memos are explicit-save only. They store the derived assistant answer Markdown, source/workflow label, tags, provider label, `aiUsed`, minimized linked-tab metadata, and sanitized source metadata. They must not store raw page text, full URLs, query/hash, screenshots, search result bodies, browser history, cookies, form values, or cloud IDs.
- Dashboard Memory view creates no new data model. It reads existing `SavedMemo` and `SavedCollection` records, filters them in memory, and hands off to Sidebar through `tabmosaic.sidebarPendingPrompt` only after user click.
- Selected-tabs/current-group contextual writing drafts stay in Sidebar session memory until `Copy draft` or explicit `Save memo`. `Copy draft` stores nothing persistent; `Save memo` stores only the derived assistant Markdown plus minimized linked-tab/source metadata through `tabmosaic.savedMemos`, never raw selected-tab text, unselected-tab text, full URLs, query/hash, screenshots, browser history, or cloud IDs.
- Saved-source contextual writing creates no new storage key. It reads existing `tabmosaic.savedMemos` / `tabmosaic.savedCollections` only after a saved-source writing prompt, sends only sanitized titles/tags/source labels/hostnames/paths/snippets/derived excerpts to the configured provider, and keeps the generated draft in Sidebar session memory until `Copy draft` or explicit `Save memo`.
- Compare Selected Tabs todos store the same minimized linked-tab metadata plus a short local checklist derived from the recommendation, missing-info, and tradeoff text. They may store provider label and `aiUsed`; they must not store raw visible page text, full URLs, query/hash, screenshots, or cloud IDs.
- Research Brief todos store the same minimized linked-tab metadata plus a short local checklist derived from findings, gaps, and next-step text. They may store provider label, `aiUsed`, and `workflow: research_brief`; they must not store raw visible page text, full URLs, query/hash, screenshots, search result bodies, or cloud IDs. Research missing-info addenda stay in Sidebar session memory only and use sanitized Search Tool answer/title/hostname/snippet metadata unless the user separately clicks an existing Save/Todo source action.
- Tab work states store only tab id, title, hostname, path, state, source, and updatedAt.
- Browser Work Search builds an in-memory local index over open-tab snapshots, groups, duplicate review entries, tasks, memos, collections, saved workspaces, and tab states. It does not store a separate search index.
- Browser Work Brief is an ephemeral chat answer generated from the same local metadata categories, including explicit saved memos. It does not create a persistent brief record.
- Workspace Goal uses `tabmosaic.workspaceGoal` for one local editable objective: sanitized text, source (`user` or `ai_triage`), timestamps, and metadata-only flag. Work Brief can prioritize this goal, match still-open tabs from local metadata, and highlight local Work Queue / memo items that match the goal. Saved workspace snapshots may derive their default name from the sanitized local goal. Goal-to-todo writes one `tabmosaic.agentTasks` item with source `workspace_goal`, a metadata-only checklist, and minimized linked-tab metadata. It must not store page text, full URLs, browser history, screenshots, provider output, search results, or cloud IDs.
- Sidebar Todo Agent targeted edits and hidden Dashboard Workbench checklist edits rewrite an existing `tabmosaic.agentTasks` item only. Named-target commands match local task titles/source metadata, current-context merge dedupes linked tab IDs before writing minimized tab metadata plus a capped `mergedContexts` audit trail, and Dashboard checklist add/delete/reorder/source-note/suggest-step edits rewrite only sanitized `checklist`, optional aligned `checklistMeta[].sourceNote`, `checklistUpdatedAt`, and `updatedAt`. Local `Suggest steps` does not persist a separate decomposition artifact; it appends derived checklist strings plus source notes from existing local task/source/memo/collection metadata. The richer action extraction uses already-local saved memo bodies/source snippets in memory and stores only the resulting bounded checklist text plus source note. These paths must not store live page text, selected text, full URLs, browser history, screenshots, provider output, search results, or cloud IDs.
- Visible Screenshot Vision does not create a data model or persistent screenshot artifact. The screenshot data URL exists only in memory during the explicit `SUMMARIZE_VISIBLE_SCREENSHOT` request and is discarded after the provider call. If the user clicks `Save memo`, `tabmosaic.savedMemos` may store only the derived assistant Markdown, source/workflow label, provider label, `aiUsed`, and minimized tab/source metadata; it must not store screenshot bytes/data URLs, full URLs, hidden DOM, browser history, cookies, form values, or cloud IDs.
- Page Region cropped vision does not create a data model or persistent image artifact. The full visible-tab capture and cropped region data URL exist only in memory during the user-triggered selected-region request. Text-only flows keep `imageDataUploaded: false`; vision flows disclose `imageDataUploaded: true` in the sanitized request metadata while keeping the actual data URL only in the multimodal `image_url` part. Saved memos may store only derived Markdown and minimized source metadata, never the cropped image data URL or full URL/query/hash.
- Sidebar tab-state safe commands use `tabmosaic.chatDraft` to store a temporary `tab_state` preview until the user clicks Apply or Cancel.
- Sidebar safe duplicate close commands use `tabmosaic.chatDraft` to store a temporary `safe_duplicate_close` preview with instruction, closeTabIds, minimized matched-tab previews, counts, and Markdown copy only. Full URLs / restore URLs are intentionally excluded from the draft.
- Agent run transcripts use `tabmosaic.agentRunTranscripts` for a capped local-only list of sanitized run summaries: request text, context scope, provider label, tool labels/counts, skipped-page reason labels, privacy flags, safety notes, browser-change status, and Undo/Restore state. They are excluded from follow-up AI context and must not store raw page text, full URLs, screenshot bytes, hidden DOM, browser history, cookies, form values, or cloud IDs.
- `tabmosaic.lastTabStateUndo` stores the previous minimized tab-state entries and newly-created local task ids needed to undo the last tab-state Apply.
- `tabmosaic.lastClosedTabs` stores restore URLs only after the user clicks Apply and Chrome actually closes safe duplicate tabs.
- Search-result and pasted-link sources store sanitized source title, hostname, path, optional snippet, and a local source URL with username/password/query/hash stripped.
- Current-page checklist todos store generated checklist text locally only after the user explicitly asks to read the page.
- These objects do not store raw page text, full tab URLs, browser history, cookies, form values, or cloud IDs.
- No TabMosaic cloud storage is used in the current implementation.
- Done/Keep/Later from the Sidebar require Apply before local state is written. Keep is read during future organize snapshots as a local `user` protected reason and excludes that tab from automatic grouping / duplicate close planning. Undo restores the previous local state and removes a created Later task when applicable. These states do not close, move, read, screenshot, summarize, or upload page content in the first slice.
- Protected group/domain rules are stored locally in `tabmosaic.userRules` with `type: 'protected'`, `protectionScope: 'group' | 'domain'`, `pattern`, `createdFrom`, timestamps, and hit counts. Domain rules match hostname/subdomain metadata; group rules match the current Chrome native group title. They add protected reasons `domain` or `group` during future snapshots and exclude matching tabs from automatic grouping / duplicate-close planning. They do not store full URLs, page text, screenshots, browser history, cookies, form values, or cloud IDs.
- Safe duplicate close from the Sidebar requires Apply, revalidates the live browser state before closing, and only closes previewed tabs that are still exact/tracking safe-close candidates. Active, pinned, audible, protected, restricted/internal, hash/query, and review duplicates remain open.
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
