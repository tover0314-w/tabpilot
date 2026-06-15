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
- tab work states（Done / Later / Keep, local metadata only）。
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

P0 keeps `Clear Local Data` in a hidden private-beta Settings path, not as a primary default Dashboard feature.

Cleared `chrome.storage.local` keys:

```text
tabmosaic.currentRun
tabmosaic.lastUndo
tabmosaic.lastTabStateUndo
tabmosaic.lastClosedTabs
tabmosaic.privacyAccepted
tabmosaic.aiSettings
tabmosaic.userRules
tabmosaic.chatDraft
tabmosaic.errorLog
tabmosaic.duplicateSafetyAudit
tabmosaic.savedWorkspaces
tabmosaic.sidebarContext
tabmosaic.sidebarMode
tabmosaic.sidebarPendingPrompt
tabmosaic.quickRailHidden
tabmosaic.agentTasks
tabmosaic.savedCollections
tabmosaic.savedMemos
tabmosaic.tabWorkStates
tabmosaic.searchSettings
tabmosaic.agentRunTranscripts
tabmosaic.workspaceGoal
```

After clearing, the extension publishes an idle run state and first-run privacy onboarding appears again before the next organize.

Current `tabmosaic.savedWorkspaces` snapshot support is local-only, minimized, and hidden from the default Dashboard until restore/history/workspace chat become real user-facing workflows. It stores group names/colors/counts, tab title/hostname/path/group mapping, and summary counts. It does not store full URLs, restore URLs, URL hashes, favicon URLs, page text, summaries, chat history, or cloud data.

Dashboard can delete an individual saved workspace snapshot after browser confirmation. The delete path rewrites only `tabmosaic.savedWorkspaces` with the selected snapshot removed. It does not touch current tabs, groups, Undo/Restore snapshots, rules, browser history, cookies, cloud data, or AI settings.

Current `tabmosaic.tabWorkStates` support is local-only and stores Done / Later / Keep state for open tab IDs. Dashboard row actions write state after direct user selection; Sidebar natural-language tab-state commands first create a temporary `tabmosaic.chatDraft` `tab_state` preview and write state only after Apply. Stored state uses tab id, title, hostname, path, state, source, and updatedAt only. Later may create a local `tabmosaic.agentTasks` item with the same minimized metadata after Apply. Keep is read during future organize snapshots as a local `user` protection reason that prevents automatic grouping and duplicate close for that tab. `tabmosaic.lastTabStateUndo` stores only previous minimized tab-state entries plus created task ids for the last tab-state Apply; `undo` restores those local states and removes the created task if needed. It does not close, move, read, screenshot, summarize, upload, or persist page text/full URLs.

Sidebar safe duplicate close commands also use `tabmosaic.chatDraft`, but only for a temporary `safe_duplicate_close` preview. The draft stores instruction, preview tab IDs, minimized matched-tab previews, counts, and Markdown explanation. It does not store full URLs or restore URLs. After Apply, the background worker re-scans current tabs, closes only previewed tabs that are still safe exact/tracking duplicate candidates, clears the draft, and writes `tabmosaic.lastClosedTabs` only for tabs that Chrome actually closed so Restore Closed can work.

Sidebar Browser Work Search does not create a new persistent storage key. It builds a short-lived in-memory search corpus from `tabmosaic.currentRun`, `tabmosaic.agentTasks`, `tabmosaic.savedMemos`, `tabmosaic.savedCollections`, `tabmosaic.savedWorkspaces`, and `tabmosaic.tabWorkStates` when the user sends a search-like chat message. It stays local-only and does not read Chrome history/bookmarks, page bodies, full URLs, or the web.

Search provider diagnostics use `tabmosaic.searchDiagnostics`. It is local-only and stores only redacted status metadata after explicit Search Tool attempts: provider label, origin, API-key status, max results, result count, error type, timestamp, and privacy booleans. It must not store query text, API keys, source URLs, source snippets, result bodies, tab titles, page text, full URLs, screenshots, history/bookmarks, or cloud IDs. Clear Local Data removes this key.

Sidebar Work Brief / Continue answer does not create a new persistent storage key. It builds a short-lived in-memory brief from `tabmosaic.currentRun`, `tabmosaic.agentTasks`, `tabmosaic.savedMemos`, `tabmosaic.savedCollections`, `tabmosaic.savedWorkspaces`, and `tabmosaic.tabWorkStates` when the user asks what to continue. It stays local-only and does not store the generated brief unless the user separately clicks an explicit memo/save action.

Sidebar Todo Agent polish does not create a new persistent storage key. Explicit chat commands such as `rename todo to ...`, `add checklist item: ...`, `mark first checklist item done`, `add checklist item to launch checklist todo: ...`, and `add current context to launch checklist todo` rewrite only an open item inside `tabmosaic.agentTasks` with sanitized title/checklist text, deduped minimized linked-tab metadata, optional capped `mergedContexts`, and updated timestamps. If a named target is ambiguous, the Sidebar renders a clarification message and does not write storage. The update path does not read page text, call AI/search, store full URLs, move/close tabs, mutate pages, or use cloud storage.

Hidden Dashboard Workbench checklist editing also reuses `tabmosaic.agentTasks` and does not create a new persistent storage key. Add/delete/reorder/source-note/suggest-step controls rewrite only the selected local task's sanitized `checklist`, optional aligned `checklistMeta[].sourceNote`, `checklistUpdatedAt`, and `updatedAt` fields after direct user interaction. `Suggest steps` builds suggestions in memory from existing local task source notes, linked tab/source metadata, `tabmosaic.savedMemos`, and `tabmosaic.savedCollections`, then appends at most four non-duplicate checklist items. It now prioritizes bounded action-line extraction from already-local saved memo bodies and saved source snippets before generic Review fallbacks. The editor does not read live page text, call AI/search, store full URLs, move/close tabs, mutate pages, or use cloud storage.

Visible Screenshot Vision does not create a persistent storage key. The Sidebar sends `SUMMARIZE_VISIBLE_SCREENSHOT` only after an explicit screenshot action/prompt. The background worker checks the current provider/model for vision capability before capture; if it is not suitable, no screenshot is captured. When allowed, the current visible-tab screenshot is compressed in memory, sent once to the configured BYOK provider with title/hostname metadata, then discarded. Only the derived assistant answer remains in Sidebar memory unless the user separately clicks `Save memo`; saved memos must contain derived Markdown and metadata only, never screenshot bytes/data URLs. The flow must not write screenshot bytes, full URLs, hidden DOM, browser history, cookies, form values, or cloud IDs to `chrome.storage.local`.

Visible Screenshot Decision Brief reuses the same no-new-storage boundary. The latest decision result is kept in Sidebar memory only until the user changes context or the context TTL expires. If the user clicks `Save memo`, the Sidebar writes one local `tabmosaic.savedMemos` item from the derived assistant decision Markdown plus minimized visible-screenshot source metadata such as source label, current-tab title, hostname, workflow, provider label, and `aiUsed`. The saved memo must not store screenshot bytes/data URLs, hidden DOM, off-screen page text, full URLs/query/hash, browser history, search result bodies, file/PDF contents, or cloud IDs. `Research missing info` remains a separate Search Tool action and sends only generated query strings to the configured search provider.

Page Region cropped vision also does not create a persistent storage key. The existing selected-region flow may capture the visible tab transiently, crop to the user-clicked region in memory, and discard the full capture. Text-only models receive only selected-region visible text, safe structure, and crop metadata. Vision-capable models may receive the cropped image as a session-only `image_url` payload after the user click. The cropped image data URL must not be written to `chrome.storage.local`, saved memos, agent run transcripts, diagnostics, feedback drafts, release packages, or local source collections. Only the derived assistant answer and minimized source metadata may be saved later after an explicit `Save memo`.

Current `tabmosaic.workspaceGoal` support is local-only and stores one editable current objective after explicit user action: clicking `Set goal` under triage or sending a goal command such as `set goal: ...`. Stored data is sanitized goal text, source, timestamps, and metadata-only flag. Work Brief reads it first, may match still-open tabs using local metadata, and may highlight matching local Work Queue / memo items. Saved workspace snapshots may use the sanitized local goal as their default name. If the user asks to make the goal a todo, the Sidebar writes one existing-key `tabmosaic.agentTasks` item with source `workspace_goal`, a metadata-only checklist, and minimized linked-tab metadata only. It does not store page text, full URLs, browser history, screenshots, provider output, search results, or cloud IDs. Clear Local Data removes this key.

AI Triage create-todo follow-up writes only to the existing `tabmosaic.agentTasks` key after the user clicks `Create todo` or explicitly asks to make triage a todo. The task source is `ai_triage`, stores at most 8 minimized linked-tab records, stores a metadata-only checklist derived from Workspace focus / Act now / Read later / Reference / Can close / Needs review, and marks the derived triage as `metadataOnly: true`. It does not create a new storage key, read page text, store full URLs, call a provider/search tool, close/move tabs, or use cloud storage.

Current `tabmosaic.savedMemos` support is local-only and explicit-save only. The Sidebar writes a memo only after the user clicks `Save memo` under an assistant answer. Stored memo data includes derived assistant answer Markdown, source/workflow label, suggested tags, provider label, `aiUsed`, minimized linked-tab metadata, and sanitized source metadata with username/password/query/hash stripped. It must not store raw visible page text, full URLs, query/hash, cookies, form values, hidden DOM, screenshots, Chrome history/bookmarks, search result bodies, or cloud data. Clear Local Data removes this key.

Dashboard Memory view does not create a new persistent storage key. The hidden/local `#memory` page reads existing `tabmosaic.savedMemos` and `tabmosaic.savedCollections`, filters them in memory, and renders sanitized titles/tags/source labels/snippets/derived excerpts. `Focus source` only focuses still-open linked tabs by local tab id. `Ask in Sidebar` writes a short `tabmosaic.sidebarPendingPrompt` saved-source prompt; it does not upload saved memory until the user continues in Sidebar through the existing saved-source Agent flow. The view must not read live pages, call providers, request permissions, create embeddings, store full URLs/query/hash, or write cloud memory.

Current `tabmosaic.agentRunTranscripts` support is local-only, capped, and opened only after the user clicks `Run log` under a Page Agent / selected-tabs answer. Stored transcript summaries contain sanitized request text, context scope, provider label, tool labels/counts, skipped-page reason labels, privacy flags, safety notes, browser-change status, and Undo/Restore state. They are excluded from follow-up AI context and must not store raw page text, selected-region text, screenshot bytes/data URLs, full URLs, query/hash, hidden DOM, browser history, cookies, form values, or cloud IDs. Clear Local Data removes this key.

Compare Selected Tabs follow-up actions are explicit button clicks. The latest compare result is kept in Sidebar memory only until the user changes context or the context TTL expires. If the user clicks `Save memo`, the Sidebar writes one local `tabmosaic.savedMemos` item from the derived assistant answer and minimized linked-tab/source metadata. If the user clicks `Create todo`, the Sidebar writes one local `tabmosaic.agentTasks` item with minimized linked-tab metadata, source `compare_selected_tabs`, a short checklist derived from recommendation/missing-information/tradeoff text, provider label, and `aiUsed`. It must not store raw page text, full URLs, query/hash, screenshot data, browser history, or cloud IDs. If the user clicks `Research missing info`, the Sidebar reuses the existing Agent web-search tool and sends only a generated search query to the configured search provider.

Research Brief follow-up actions are explicit button clicks. The latest research brief result is kept in Sidebar memory only until the user changes context or the context TTL expires. If the user clicks `Save memo`, the Sidebar writes one local `tabmosaic.savedMemos` item from the derived assistant answer and minimized linked-tab/source metadata. If the user clicks `Create todo`, the Sidebar writes one local `tabmosaic.agentTasks` item with minimized linked-tab metadata, source `research_brief`, a short checklist derived from findings/missing-information/next-step text, provider label, `aiUsed`, and workflow label. It must not store raw page text, full URLs, query/hash, screenshot data, browser history, search result bodies, or cloud IDs. If the user clicks `Research missing info`, the Sidebar reuses the existing Agent web-search tool, sends up to three generated focused search query strings to the configured search provider, and renders a session-only research addendum from sanitized provider answer/title/hostname/snippet metadata. No new storage key is created for the addendum, and returned source pages are not opened or crawled automatically.

Decision Brief follow-up actions are explicit button clicks. The latest decision brief result is kept in Sidebar memory only until the user changes context or the context TTL expires. If the user clicks `Save memo`, the Sidebar writes one local `tabmosaic.savedMemos` item from the derived assistant answer and minimized linked-tab/source metadata. If the user clicks `Create todo`, the Sidebar writes one local `tabmosaic.agentTasks` item with minimized linked-tab metadata, source `decision_brief`, recommendation, criteria, assumptions, missing information, provider label, `aiUsed`, and workflow label. It must not store raw page text, full URLs, query/hash, screenshot data, browser history, search result bodies, or cloud IDs. If the user clicks `Research missing info`, the Sidebar reuses the existing Agent web-search tool, sends up to three generated focused search query strings to the configured search provider, and renders a session-only addendum from sanitized provider answer/title/hostname/snippet metadata. No new storage key is created for the addendum, and returned source pages are not opened or crawled automatically.

Selected-tabs/current-group Contextual Writing does not create a new persistent storage key. The latest draft is kept in Sidebar memory for the active context only, and `Copy draft` writes only generated draft text to the system clipboard after user click. If the user clicks `Save memo`, the Sidebar writes one local `tabmosaic.savedMemos` item from the derived assistant Markdown and minimized linked-tab/source metadata. It must not store raw selected-tab page text, unselected-tab text, full URLs, query/hash, screenshots, browser history, or cloud IDs.

Saved-source Contextual Writing does not create a new persistent storage key. It builds a short-lived selected source set from existing `tabmosaic.savedMemos` and `tabmosaic.savedCollections` when the user asks to draft from saved sources/memos/collections. If AI is configured, the background worker sends only sanitized saved-source titles, tags, source labels, hostnames, paths, snippets, and derived memo excerpts to the configured provider. If AI is not configured, no saved-source text is uploaded and the Sidebar shows the AI setup prompt. The generated draft stays in Sidebar memory until `Copy draft` or explicit `Save memo`; it must not read live pages, search the web, store raw source bodies as a new artifact, store full URLs/query/hash, screenshots, browser history, or cloud IDs.

Saved-source Research Brief uses the same storage boundary and also does not create a new persistent storage key. It builds a short-lived selected source set from existing `tabmosaic.savedMemos` and `tabmosaic.savedCollections` when the user asks for a research brief from saved sources. If AI is configured, the background worker sends only the same sanitized saved-source fields with `workflow: research_brief`. The generated brief stays session-only until explicit `Save memo`; `Research missing info` sends only generated search query strings to the configured search provider. It must not read live pages, request site access, search before the explicit follow-up action, store raw source bodies as a new artifact, parse files/PDFs/screenshots, store full URLs/query/hash, screenshots, browser history, or cloud IDs.

Saved-source Decision Brief uses the same storage boundary and does not create a new persistent storage key. It builds a short-lived selected source set from existing `tabmosaic.savedMemos` and `tabmosaic.savedCollections` when the user asks for a decision brief from saved sources. If AI is configured, the background worker sends only the same sanitized saved-source fields with `workflow: decision_brief`. The generated decision brief stays session-only until explicit `Save memo`; `Research missing info` sends only generated search query strings to the configured search provider. Saved-source decision does not create tab-based Work Queue todos in this first slice because no live tab context is required. It must not read live pages, request site access, search before the explicit follow-up action, store raw source bodies as a new artifact, parse files/PDFs/screenshots, store full URLs/query/hash, screenshots, browser history, or cloud IDs.

Search-result Decision Brief does not create a new persistent storage key. It builds a short-lived selected source set from the current Sidebar session's latest Agent Search results when the user clicks `Brief` or asks for a decision brief from current search results. If AI is configured, the background worker sends only sanitized result titles, hostnames, paths, snippets, source labels, workflow label, and short local conversation context with `workflow: decision_brief`. The generated decision brief stays session-only until explicit `Save memo`; `Research missing info` remains a separate explicit Search Tool action. Search-result decision does not create tab-based Work Queue todos in this first slice because no live tab context is required. It must not open returned result pages, read live pages, search again, store raw result bodies as a new artifact, send saved-source bodies, parse files/PDFs/screenshots, store full URLs/query/hash, screenshots, browser history, or cloud IDs.

Pasted-link explicit fetch does not create a new persistent storage key. The latest fetched-link result is held in Sidebar memory only and rendered as one assistant answer with source chips. The background worker requests optional origin permission only after the user clicks `Fetch link`, fetches readable text with credentials omitted, and sends title/hostname/path/readable text to the Page Agent only when AI is configured. The session result must not store raw linked-page text, full URLs, query/hash, cookies, browser history, or cloud IDs. If the user later clicks Save or Todo, the existing `tabmosaic.savedCollections` / `tabmosaic.agentTasks` paths store only sanitized source metadata with username/password/query/hash stripped.

## 6. Sync 冲突

P1 问题：

- 同一规则跨设备被修改。
- 同一 workspace 被更新。
- Chrome groupId 是 session-specific，不能跨会话依赖。

策略：

- 使用 stable internal IDs。
- tab/group restore 根据 URL/title 重新创建。
- groupId 只作为运行时字段。
