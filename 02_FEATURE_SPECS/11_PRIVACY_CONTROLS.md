# 功能规格：隐私控制

## 1. 目标

隐私不是合规附录，而是产品信任核心。TabMosaic AI 会处理用户的 tab title、URL、页面正文和浏览活动，因此必须默认最小化读取、明确披露、可控制、可撤销。

## 2. 隐私等级

| Level | 读取内容 | 用途 | 默认 |
|---|---|---|---|
| 0 | title + hostname | 基础分类 | 开启 |
| 1 | URL path | 精准分类、规则与去重 | 开启但披露 |
| 1b | full URL | 更精准规则或用户自定义需求 | 默认关闭，用户显式开启 |
| 2 | 当前页面正文 | 当前 tab 总结 | 用户触发 |
| 2b | 当前页面选中文本 | selected-text explain / translate / rewrite candidates | 用户触发；只读高亮文本；session-only |
| 2c | 用户粘贴链接正文 | pasted-link Q&A / save source / todo follow-up | 用户点击 Fetch link 后触发；Chrome optional origin permission；session-only until Save/Todo |
| 3 | 多页面正文 | group/multi-tab summary / content-assisted regrouping | 用户发起后默认允许；tool card 披露；最多 6 tabs；敏感页额外确认或跳过 |
| 4 | 云端保存摘要/记忆 | dashboard、workspace memory | Pro + 明确开启 |

## 3. 默认原则

- 默认不读取页面正文。
- 默认不后台读取所有 tabs 正文；只有用户发起 group/selected-tabs 问答或内容辅助重分组时，才读取最多 6 个 tabs 的可见文本。
- 默认不读取表单输入。
- 默认不读取密码字段。
- 默认不上传 cookie、localStorage、sessionStorage。
- 关闭 tabs 前保存 restore snapshot。
- 用户可以禁用 hosted AI，改用自配模型/API key。Private beta 默认 DeepSeek；自定义 OpenAI-compatible HTTPS provider host 和 `http://localhost` local model endpoint 已通过显式 origin 权限流启用。
- BYOK 不降低数据最小化标准：即使用用户自己的模型，默认仍不发送完整 URL、页面正文、cookies、表单值、隐藏 DOM 或浏览历史。

## 4. 首次使用文案

```text
TabMosaic 会读取标签页标题、网站域名和路径来自动整理分组与检测重复。
默认不会把完整 URL 发送给 AI。
只有当你要求总结页面时，才会读取当前页面正文。
你可以随时撤销自动整理。
```

## 5. 设置项

```text
[ ] 只使用本地规则，不调用 AI
[ ] 调用 AI 时只发送 title + hostname
[ ] 允许发送 URL path
[ ] 允许发送完整 URL
[ ] 允许总结当前页面
[x] 允许用户发起的多个 tabs 总结（最多 6 个，tool card 披露，不后台读取）
[ ] 允许保存摘要到 dashboard
[ ] 对以下网站永不读取正文
[ ] 对以下网站永不自动关闭 tabs
```

### 5.1 当前设置实现

CONFIRMED BY IMPLEMENTATION:

```text
Hidden private-beta Settings includes:
- Settings Snapshot
- DeepSeek AI settings using an OpenAI-compatible request format
- Permissions & Data Use
- Beta Diagnostics
- Clear AI Key
- Clear Local Data
```

`Permissions & Data Use` explains why existing Chrome permissions are needed. It states that all-URL access is not granted by default, optional site access is requested only for the specific sites in a user-triggered group/selected-tabs page question and released after the answer, and TabMosaic does not request history, bookmarks, cookies, webRequest, browsingData, or incognito access.

`Beta Diagnostics` copies a redacted local QA snapshot to the clipboard. It includes version, locale, permission names, latest run counts, duplicate counts, rule count, AI enabled/provider/model, and privacy flags. It does not include URLs, tab titles, hostnames, rule patterns, group names, page text, API keys, or automatic upload.

The same Dashboard section can copy a beta feedback Markdown template. The template is local-only, user-triggered, and includes manual feedback prompts, 70/20/10/0 classification quality labeling, dangerous-close review, Undo/Restore review, rule-memory prompts, plus the redacted diagnostic snapshot. It does not submit data automatically.

Local error summaries are kept in a capped `chrome.storage.local` ring buffer and are included in copied diagnostics only after redaction. They must not include URLs, hostnames, emails, bearer tokens, API keys, tab titles, page text, rule patterns, or group names. This is not telemetry and has no upload path.

Duplicate close safety audit entries are kept locally as count-only events for beta validation. They may record whitelisted event types such as `auto_safe_close`, `manual_review_close`, and `restore_closed_tabs`, plus counts for requested, closed, restored, failed, and skipped tabs. They must not include URLs, hostnames, tab titles, page text, duplicate labels, rule patterns, group names, or API keys. This is not browsing analytics and has no upload path.

Saved workspace snapshots are created only from hidden/private-beta workspace save paths. They are local-only, stored in `chrome.storage.local`, and keep minimized workspace metadata: group names/colors/counts, tab title/hostname/path/group mapping, and summary counts. They must not include full URLs, restore URLs, URL hashes, favicon URLs, page text, cloud data, summaries, or chat history. Copied diagnostics expose only the saved workspace count.

Work Queue tasks and saved Collections are local-only, stored in `chrome.storage.local`, and created only after user action from Dashboard selection, Sidebar todo commands, Search Tool source actions, pasted-link actions, or current-page checklist todo commands. Tab-linked items store tab title, hostname, path, tab IDs, and tab state only. Source-linked items store sanitized source title, hostname, path, optional snippet, and a local source URL with username/password/query/hash stripped. Current-page checklist todos may store generated checklist items locally after the user explicitly asks to read the current page; they must not persist raw page text, full URLs, browser history, cookies, form values, or cloud IDs.

CONFIRMED BY IMPLEMENTATION: Sidebar Todo Agent polish can rename a local todo, add a checklist item, mark one checklist item done, or merge the current Sidebar context into an existing local todo from explicit chat commands. If the user names a todo, the Sidebar resolves that local target; if multiple todos match, it asks for a clearer name instead of changing the wrong item. It rewrites only `tabmosaic.agentTasks` with sanitized title/checklist text, deduped minimized linked-tab metadata, optional `mergedContexts`, and updated timestamps. It does not read page text, selected text, selected-region text, screenshots, hidden DOM, full URLs, browser history, cookies, form values, provider APIs, search APIs, analytics, tab moves/closes, page mutation, upload, or cloud storage.

CONFIRMED BY IMPLEMENTATION: Hidden Dashboard Workbench checklist editing is local-only. It can add, delete, reorder checklist strings, save per-item local source notes, and append local `Suggest steps` suggestions inside an existing `tabmosaic.agentTasks` item after direct user interaction. Suggestions are derived only from already-local task source notes, linked tab/source metadata, `tabmosaic.savedMemos`, and `tabmosaic.savedCollections`. The current extraction can turn bounded local saved memo bodies and saved source snippets into short checklist action lines, but it does not fetch, crawl, refresh, or upload those sources. It rewrites only sanitized checklist text, optional aligned `checklistMeta[].sourceNote`, `checklistUpdatedAt`, and `updatedAt`. It does not read live page text, selected text, selected-region text, screenshots, hidden DOM, full URLs, browser history, cookies, form values, provider APIs, search APIs, analytics, tab moves/closes, page mutation, upload, or cloud storage.

CONFIRMED BY IMPLEMENTATION: Pasted-link fetch is explicit and user-triggered. Link detection alone does not open, fetch, summarize, upload, or store the linked page. When the user clicks `Fetch link`, the background worker requests Chrome optional origin permission for that link's site, fetches readable text with `credentials: "omit"`, and keeps the fetched result session-only until the user separately clicks Save or Todo. If a BYOK/provider config is usable, the Page Agent receives title, hostname, sanitized path, description, headings, and readable text only. It must not receive the full URL, query string, hash, cookies, form values, hidden DOM, browser history, workspace memory, or TabMosaic cloud storage. Local Save/Todo actions store only sanitized source metadata with username/password/query/hash stripped.

Tab work states are local-only, stored in `tabmosaic.tabWorkStates`, and created only after user action from Dashboard tab rows or after the user clicks Apply on a Sidebar safe-command preview. `Done`, `Later`, and `Keep` store tab id, title, hostname, path, state, source, and updatedAt only. They do not close, move, read, screenshot, summarize, upload, or mutate the page. `Later` may also create a local Work Queue todo using the same minimized tab metadata boundary after Apply. `Keep` is treated as a local `user` protection reason in future organize snapshots, so automatic grouping skips that tab and safe duplicate close planning does not close it. `tabmosaic.lastTabStateUndo` stores only the previous minimized tab-state entries and any newly-created local Work Queue task ids needed to undo the last tab-state Apply.

CONFIRMED BY IMPLEMENTATION: Protected group/domain rules are Apply-gated and local-only. Sidebar commands such as `protect docs.google.com domain` or `protect this group` create a temporary safe-command preview first. Apply writes a `tabmosaic.userRules` item with `type: protected`, `protectionScope`, pattern, source, timestamps, and hit count only. Domain protection uses hostname/subdomain metadata; group protection uses the current Chrome native group title. It does not read page text, selected text, selected-region text, screenshots, hidden DOM, full URLs, browser history, cookies, form values, provider APIs, search APIs, analytics, tab moves/closes, page mutation, upload, or cloud storage. Matching future tabs receive protected reasons `domain` or `group`, so automatic grouping and safe duplicate close planning skip them.

CONFIRMED BY IMPLEMENTATION: Hidden Dashboard Rules & Memory manual editor can create or edit only local `domain` and `url_pattern` Group rules. It writes sanitized pattern, target group name, source, timestamps, enabled state, and hit count to `tabmosaic.userRules`. It blocks repurposing protected rules through the form. Saving a rule does not organize, move, close, read, summarize, screenshot, upload, call AI/search providers, collect analytics, mutate pages, or use cloud storage.

CONFIRMED BY IMPLEMENTATION: Sidebar safe duplicate close commands are Apply-gated. The temporary `tabmosaic.chatDraft` preview stores only the user instruction, preview tab IDs, minimized tab title/hostname/path metadata, count, and Markdown explanation. It must not store full URLs, restore URLs, page text, screenshots, cookies, history, form values, or cloud data. After the user clicks Apply, the background service worker re-scans live tabs and closes only previewed tabs that are still exact/tracking safe-close candidates. Only then does the existing `tabmosaic.lastClosedTabs` Restore Closed snapshot store the full restore URL for actually closed tabs.

CONFIRMED BY IMPLEMENTATION: Sidebar Browser Work Search is local-only. It searches the latest extension-created tab snapshot, native group metadata, duplicate review metadata, `tabmosaic.agentTasks`, `tabmosaic.savedMemos`, `tabmosaic.savedCollections`, `tabmosaic.savedWorkspaces`, and `tabmosaic.tabWorkStates`. It uses only minimized titles, hostnames, paths, group names, task/memo/collection/workspace names, local tab IDs, sanitized source snippets, memo answer text explicitly saved by the user, and local status fields already stored by the extension. It does not read page text, full URLs, Chrome history, bookmarks, cookies, form values, screenshots, hidden DOM, or the web. It does not call the AI provider or search provider, and it does not create, close, move, restore, upload, or summarize tabs.

CONFIRMED BY IMPLEMENTATION: Sidebar Work Brief / Continue answer and Dashboard Continue strip are local-only. They use the same minimized local metadata categories as Browser Work Search to recommend where to continue: saved workspace goal, duplicate review count, open Work Queue todos, saved memos, Later tab states, active/high-signal groups, saved workspace names, and collection names. They do not read page text, full URLs, Chrome history, bookmarks, cookies, form values, screenshots, hidden DOM, AI provider output, or web search results. They do not create, close, move, restore, reopen, upload, summarize, or mutate tabs; Open buttons only focus still-open tabs after user click, and Dashboard can only hand off a `what should I continue?` prompt to Sidebar.

CONFIRMED BY IMPLEMENTATION: Sidebar Workspace Chat first slice is local-only. Natural prompts such as `summarize my workspace`, `show workspace todos`, `show saved sources`, or `review workspace risks` build one Markdown assistant answer from the latest extension-created tab/group snapshot, saved workspace goal, local Work Queue items, saved memos, saved collections, saved workspace snapshots, local tab states, and duplicate-review metadata. It does not read live page text, full URLs, Chrome history/bookmarks, cookies, form values, screenshots, hidden DOM, AI/search providers, analytics, tab moves/closes/restores, page mutation, upload, or cloud storage. Any future historical workspace chat, full restore, cloud sync, embedding index, or cross-device memory remains a separate confirmation gate.

CONFIRMED BY IMPLEMENTATION: Sidebar Local Memo is explicit-save only. The Sidebar may render a `Save memo` button under assistant answers, current-page answers, selected-tabs/current-group answers, Compare Selected Tabs, Research Brief, and fetched-link answers. Clicking it writes `tabmosaic.savedMemos` locally with derived assistant answer Markdown, source/workflow label, suggested tags, provider label, `aiUsed`, minimized linked-tab metadata, and sanitized source metadata with username/password/query/hash stripped. It must not store raw visible page text, full URLs, query/hash, cookies, form values, hidden DOM, screenshots, Chrome history/bookmarks, search result bodies, or cloud data. It is included in Clear Local Data.

CONFIRMED BY IMPLEMENTATION: Dashboard Memory view is local-only and hidden from the default Dashboard. Opening `#memory` reads only explicit saved `tabmosaic.savedMemos` and `tabmosaic.savedCollections`, renders sanitized titles/tags/source labels/snippets/derived memo excerpts, can focus still-open linked source tabs, and can send a saved-source prompt to Sidebar after user click. Rendering/searching Memory does not read live pages, request permissions, call AI/search providers, upload data, ingest Chrome history/bookmarks, store full URLs/query/hash, create embeddings, mutate tabs/pages, or create cloud memory.

CONFIRMED BY IMPLEMENTATION: Sidebar Prompt / Skill Templates are built-in shortcuts only. They do not introduce third-party dynamic skills, marketplace code, new storage keys, new permissions, analytics, or a new data boundary. Each template declares allowed context, tool permissions, output format, source behavior, and blocked actions in code, then routes through existing flows such as Smart Organize, duplicate-status answers, current-page visible-text read, selected-text read, selected-tabs/group context read, or local todo creation. The underlying flow's existing privacy rule still applies.

CONFIRMED BY IMPLEMENTATION: Sidebar unified composer context chips are a UI preview layer only. They render the active local scope and typed intent hints such as pasted link, selected text, page region, Agent Search, or template inside the composer surface. Rendering a chip does not fetch pasted links, read selected text, start page-region picking, capture screenshots, call AI/search providers, write storage, request permissions, upload data, move/close tabs, or mutate pages. The underlying flow's existing user-triggered privacy boundary still applies after the user submits or chooses that flow.

CONFIRMED BY IMPLEMENTATION: Sidebar model/tool routing hints are a UI explanation layer only. They inspect the current typed draft and local Sidebar scope to label the likely route, such as tab metadata, current-page Page Agent, selected text, page region, visible Screenshot Vision, selected-tabs/group, or Agent Search Tool. Rendering the hint does not switch providers, call AI/search, read page text, read selected text, start page-region selection, capture screenshots, request permissions, write storage, upload data, move/close tabs, or mutate pages. The underlying flow's existing user-triggered privacy boundary still applies after the user submits or chooses the flow.

CONFIRMED BY IMPLEMENTATION: Visible Screenshot Vision is explicit and session-only. It runs only after the user chooses Screenshot from the Sidebar composer picker or submits an explicit screenshot prompt. The background worker first checks page sensitivity and requires a configured vision-capable OpenAI-compatible model; if the current provider/model does not look vision-capable, it does not capture or send a screenshot. When allowed, it captures the current visible tab area, compresses it in memory to a bounded JPEG, sends that image plus current-tab title/hostname and short local page-chat history to the configured BYOK provider, then discards the image data. It does not store screenshot bytes/data URLs, add a storage key, include full URLs/query/hash, read hidden DOM, read page text outside the visible screenshot, access cookies/form values/browser history, search the web, mutate pages, move/close tabs, or create cloud memory. The answer may be saved only as a derived local memo if the user separately clicks `Save memo`; the memo must not include screenshot bytes.

CONFIRMED BY IMPLEMENTATION: Visible Screenshot Decision Brief is an explicit vision workflow. It runs only after the user asks for a decision brief from the current screenshot or uses an explicit screenshot-decision prompt. The configured BYOK provider receives one compressed current visible-tab screenshot, current-tab title/hostname, screenshot metadata, `workflow: decision_brief`, and short local page-chat context. It does not receive hidden DOM, off-screen page text, full URL/query/hash, file/PDF bodies, saved-source bodies, search-result bodies, browser history/bookmarks, cookies, form values, analytics identifiers, or cloud memory. Screenshot bytes/data URLs are discarded after the request and must not be written to storage, memos, run transcripts, diagnostics, release packages, or feedback drafts. The resulting decision text is session-only until the user explicitly clicks `Save memo`; `Research missing info` remains a separate Search Tool action that sends generated query strings only.

CONFIRMED BY IMPLEMENTATION: Visible Screenshot Research Brief is an explicit vision workflow. It runs only after the user asks for a research brief from the current screenshot or uses an explicit screenshot-research prompt. The configured BYOK provider receives one compressed current visible-tab screenshot, current-tab title/hostname, screenshot metadata, `workflow: research_brief`, and short local page-chat context. It does not receive hidden DOM, off-screen page text, full URL/query/hash, file/PDF bodies, uploaded-image bodies, saved-source bodies, search-result bodies, browser history/bookmarks, cookies, form values, analytics identifiers, or cloud memory. Screenshot bytes/data URLs are discarded after the request and must not be written to storage, memos, run transcripts, diagnostics, release packages, or feedback drafts. The resulting research text is session-only until the user explicitly clicks `Save memo`; `Research missing info` remains a separate Search Tool action that sends generated query strings only.

CONFIRMED BY IMPLEMENTATION: Page Region cropped vision is explicit and session-only. It runs only after the user starts the selected-region flow and clicks one visible page region. Text-only models receive selected-region visible text, safe labels/list/table structure, and cropped screenshot metadata only. If the configured OpenAI-compatible model appears vision-capable, the background worker sends the cropped selected-region image as a multimodal `image_url` part together with minimized region text/structure metadata. The text JSON must not include the image data URL, full URL, query string, hash, hidden DOM, unrelated page areas, cookies, form values, browser history, search results, files, PDFs, or cloud memory. The full visible-tab capture is discarded after cropping, the cropped image data is discarded after the request, and screenshot bytes/data URLs must not be written to storage, memos, transcripts, diagnostics, or package metadata.

CONFIRMED BY IMPLEMENTATION: Search provider diagnostics are local-only and redacted. Background writes `tabmosaic.searchDiagnostics` after explicit Search Tool attempts or missing-provider checks. Stored fields are status, provider label, enabled/configured flags, API-key status (`saved` / `missing` only), provider origin, permission origin, max results, search depth, result count, error type, timestamp, and privacy booleans. Diagnostics must not store the typed query, API key, source URLs, source snippets, result bodies, tab titles, page text, selected text, selected-region text, screenshots, hidden DOM, browser history, cookies, form values, analytics, tab moves/closes, uploads, or cloud storage. Clear Local Data removes this key.

CONFIRMED BY IMPLEMENTATION: Research Brief query decomposition is an explicit Search Tool follow-up only. It runs after the user clicks `Research missing info`, decomposes the existing brief's missing-information items into up to three short focused search queries, and sends only those query strings to the configured search provider. It does not send selected-tab page text, selected-tab full URLs, screenshot bytes, saved-source bodies, files, PDFs, browser history, cookies, form values, analytics identifiers, or cloud memory to the search provider. Returned search results stay session-only unless the user explicitly saves a source or creates a todo.

CONFIRMED BY IMPLEMENTATION: Decision Brief query decomposition is an explicit Search Tool follow-up only. It runs after the user clicks `Research missing info`, decomposes the decision brief's missing-information items plus decision criteria/assumption hints into up to three short focused search queries, and sends only those query strings to the configured search provider. It does not send selected-tab page text, selected-tab full URLs, screenshot bytes, saved-source bodies, files, PDFs, browser history, cookies, form values, analytics identifiers, or cloud memory to the search provider. Returned search results stay session-only unless the user explicitly saves a source or creates a todo.

CONFIRMED BY IMPLEMENTATION: Saved-source Research Brief runs only after the user explicitly asks to create a research brief from saved sources/memos/collections. It reuses `DRAFT_FROM_SAVED_SOURCES` with `workflow: research_brief` and sends only selected explicit local saved memo/collection titles, tags, source labels, hostnames, sanitized paths, snippets, and derived memo excerpts to the configured BYOK provider. It must not read live pages, request site access, search the web before the separate `Research missing info` action, include full URLs/query/hash, parse files/PDFs/screenshots, create new storage keys, mutate pages, move/close tabs, or create cloud memory. The answer stays session-only until the user clicks `Save memo`; `Research missing info` sends only generated query strings to the configured search provider.

CONFIRMED BY IMPLEMENTATION: Sidebar Source Provenance chips are a UI disclosure layer over already-available answer metadata. They show context type, site/title label, read/skipped state, session-only/not-saved state, and no-full-URL/no-page-text boundaries where applicable. They do not create a new storage key, do not read additional page content, do not upload data, do not add analytics, and do not persist sources. Current-page chips may focus an existing local tab by tab id only; Search result Sources continue to use explicit user-click Open / Save / Todo actions.

An individual saved workspace snapshot can be deleted from the hidden/private-beta workspace path after browser confirmation. This deletes only the selected local snapshot and must not restore, close, move, or regroup tabs.

`Clear AI Key` removes only the locally saved AI API key, disables AI classification, and keeps local rules, recent organize results, Undo/Restore snapshots, privacy acceptance, chat drafts, diagnostics, and duplicate safety audit counts. It asks for browser confirmation and does not move or close tabs, call the AI provider, delete browser history, or delete cookies.

Current-tab summary and page Q&A read visible page text only after the user sends a current-page request from the sidebar composer. The composer context bar may show the current tab or selected group using metadata only. For sensitive contexts such as bank, billing, health, medical, password, admin, database, connection, Supabase, Stripe, AWS, Cloudflare, internal, or localhost pages, the sidebar asks for an extra confirmation before the background script executes content extraction. If the user cancels, no page body is read.

CONFIRMED BY DISCUSSION / IMPLEMENTATION: for current-tab page chat, the configured BYOK Page Agent may receive current-tab visible page text after the user explicitly asks from the Sidebar composer and completes any sensitive-page confirmation. The payload includes title, hostname, visible text, selected text, headings, description, cropped selected-region screenshot metadata when applicable, and up to 10 local page-chat Q/A turns only. It must not include screenshot image bytes/data URLs, full visible-tab screenshots, full URL, query/hash, cookies, form values, hidden DOM, browser history, workspace memory, multi-tab page bodies, or TabMosaic cloud storage. Obvious API-key-like strings and connection strings are redacted best-effort before upload. If the configured provider fails, the product falls back to local visible-text summary / matching.

CONFIRMED BY IMPLEMENTATION: Contextual Writing reuses existing Agent boundaries only after the user asks for draft/reply/comment/update/rewrite from the Sidebar composer, Draft response template, Rewrite selection template, Draft from tabs template, selected-region writing prompt, selected-tabs/current-group writing prompt, or saved-source/memo/collection writing prompt. Current-page writing may send minimized current-tab visible text; selected-text writing sends highlighted text only; selected page-region writing sends only the clicked region's visible text/structure and screenshot metadata, never screenshot bytes; selected-tabs/current-group writing sends only capped readable selected/group tab titles, hostnames, headings, visible text, skipped reason counts, workflow label, and short local context conversation; saved-source writing sends only explicit local saved memo/collection titles, tags, source labels, hostnames, sanitized paths, snippets, and derived assistant-answer excerpts selected for that request. All use `workflow: contextual_writing`. The configured BYOK provider must not receive full URLs, query/hash, cookies, form values, hidden DOM, browser history, unrelated page DOM, unselected-tab bodies, screenshot bytes, live page text for saved-source writing, search-provider data, or TabMosaic cloud storage. The generated draft stays session-only until the user clicks `Copy draft` or `Save memo`. `Copy draft` writes only generated draft text to the system clipboard and must not insert text into a webpage, submit forms, post comments, send messages/email, approve/merge/deploy, mutate settings, move/close tabs, search the web, read live pages for saved-source writing, or create cloud memory. `Save memo` remains a separate explicit local-save action for derived assistant Markdown only.

CONFIRMED BY IMPLEMENTATION: selected-text chat is user-triggered from the Sidebar composer picker. It reads only the text currently highlighted on the active page, plus current-tab title and hostname. It does not include full-page visible text, page description, headings, full URL, query/hash, cookies, form values, hidden DOM, browser history, workspace memory, diagnostics, feedback templates, or TabMosaic cloud storage. If no text is highlighted, it asks the user to select text first and does not fall back to full-page extraction.

CONFIRMED BY IMPLEMENTATION: Translation / reading assistant commands reuse the existing Page Agent privacy boundaries. Selected-text translate/simplify/glossary commands read highlighted text only through `SUMMARIZE_SELECTED_TEXT`; selected-text rewrite/polish now routes through Contextual Writing so it can expose `Copy draft`. Current-page translate/simplify/bilingual-summary/glossary commands use the current-page visible-text flow and sensitive-page confirmation. The prompt asks for copy-only output and no page editing, form submission, or mutation. No translated output is persisted unless a future explicit save/memo action is separately implemented.

CONFIRMED BY IMPLEMENTATION: selected page-region chat may transiently capture the current visible tab only after the user starts the selected-region flow and clicks a page region. The image is cropped in memory to the selected region, the full visible-tab capture is discarded, and only cropped screenshot metadata is kept for the text-only Page Agent. Screenshot image bytes are not uploaded, persisted, copied to diagnostics/feedback, saved to workspace memory, or included in chat history. Any future vision-model upload of cropped screenshot image bytes requires separate confirmation.

CONFIRMED BY IMPLEMENTATION: Smart Fill Lite reuses the selected page-region boundary. It runs only after the user chooses the Smart Fill template or asks to extract/classify a selected table/list/region, then clicks one page region. The configured BYOK provider may receive selected-region visible text, safe link labels, list/table structure, cropped screenshot metadata, workflow label, and short local page-chat conversation only. It must not receive screenshot image bytes, full URLs, query/hash, cookies, form values, hidden DOM, unrelated page DOM, browser history, workspace memory, web-search results, or TabMosaic cloud storage. The generated table stays session-only until the user clicks `Copy table`, `Copy CSV`, `Create todo`, or `Save memo`. `Copy table` and `Copy CSV` write only derived table text to the clipboard; `Create todo` stores one local Work Queue checklist derived from row actions. Smart Fill Lite does not auto-fill forms, edit page tables, mutate pages, submit data, enrich rows with search, crawl pages, or create cloud memory in the first slice.

CONFIRMED BY IMPLEMENTATION: Agent Safety Layer first slice treats page-provided text as untrusted source material across current-page, selected-text, selected-region, fetched-link, and selected-tabs/current-group Page Agent flows. The payload includes a local `security` boundary with allowed tool labels, blocked action labels, and prompt-injection signal flags. This boundary does not add page reads or storage; it only annotates already user-triggered context. The validator blocks unsafe instruction-like model output before rendering, and the Sidebar may show a short `Safety note` only when suspicious page/model text is detected. Tool cards show `Allowed`, `Blocked`, and `Page text is untrusted` labels. No page text, full URL, screenshot bytes, hidden DOM, browser history, cookies, form values, analytics, or cloud data is added by this safety layer.

CONFIRMED BY IMPLEMENTATION: Agent Run Transcript first slice is local-only and user-opened from a compact `Run log` action under Page Agent / selected-tabs answers. It stores at most a capped set of sanitized transcript summaries in `tabmosaic.agentRunTranscripts`, including request text, context scope, provider label, tool labels/counts, skipped-page reason labels, privacy flags, safety notes, browser-change status, and Undo/Restore state. It redacts full URLs, token-like query values, connection strings, bearer tokens, and API-key-like strings best-effort. It is excluded from follow-up AI chat context. It must not persist raw visible page text, selected-region text, screenshot bytes/data URLs, full URLs, query/hash, hidden DOM, browser history, cookies, form values, cloud IDs, or TabMosaic cloud storage.

CONFIRMED BY IMPLEMENTATION: AI Triage first slice runs only after the local organize result exists and appends plain Markdown triage text to the organize-complete assistant message. It uses tab title, hostname, path, group name, active/protected state, duplicate-review counts, and safe-duplicate-close counts already present in the sanitized run. If the user clicks `Create todo` or explicitly asks to make the triage a todo, the Sidebar writes one `tabmosaic.agentTasks` item with source `ai_triage`, a metadata-only triage checklist, and at most 8 minimized linked-tab records. It does not read visible page text, selected text, selected-region text, screenshot data, hidden DOM, full URLs, browser history, cookies, form values, provider APIs, search APIs, analytics, new storage keys, or TabMosaic cloud storage. It does not close non-duplicate tabs, create todos automatically, mutate pages, or move tabs.

CONFIRMED BY IMPLEMENTATION: Memory relief safe first slice is user-triggered from Sidebar and Apply-gated. The preview and apply paths use only local tab metadata: title, hostname, path, group state, active/pinned/audible/discarded/protected state, and `lastAccessed`. Apply may discard/sleep inactive tabs with `chrome.tabs.discard`, collapse inactive native groups, and save likely read-later tabs into local `tabmosaic.tabWorkStates` plus one local Work Queue item. It must not close non-duplicate tabs, read page text, selected text, selected-region text, screenshots, hidden DOM, full URLs, browser history, cookies, form values, provider APIs, search APIs, analytics, or cloud storage. It does not claim exact MB saved.

CONFIRMED BY IMPLEMENTATION: Sidebar suggested-group safe first slice is user-triggered and Apply-gated. Prompts such as `suggest group for this tab` create a temporary `tabmosaic.chatDraft` with the current tab id, minimized title/hostname/path preview, target group name/color, and Markdown explanation only. The preview uses local tab metadata, current native group names, and latest organize metadata; it does not read page text, selected text, selected-region text, screenshots, hidden DOM, full URLs, browser history, cookies, form values, provider APIs, search APIs, analytics, or cloud storage. Apply re-scans live tabs and moves only the current still-open safe tab through the existing move/Undo path. Background new-tab listeners, default Suggest/Off behavior, and Auto mode remain unimplemented until D-057 is confirmed.

CONFIRMED BY IMPLEMENTATION: Workspace Goal first slice is local-only. The Sidebar writes `tabmosaic.workspaceGoal` only after the user clicks `Set goal` under organize triage or explicitly sends a goal command such as `set goal: ...`. Stored data is sanitized goal text, source (`user` or `ai_triage`), timestamps, and `metadataOnly`. The goal is used by Work Brief and local tab matching only. Saved workspace snapshots may use the sanitized local goal as the default name. If the user asks to make the goal a todo, the Sidebar writes one local `tabmosaic.agentTasks` item with source `workspace_goal`, the sanitized goal text, a metadata-only checklist, and minimized linked-tab metadata only. It does not read page text, selected text, selected-region text, screenshots, hidden DOM, full URLs, browser history, cookies, form values, provider APIs, search APIs, analytics, tab moves/closes, or cloud storage. Clear Local Data removes this key.

CONFIRMED BY IMPLEMENTATION: Page Quick Rail renders as a minimal right-edge content-script UI on ordinary http/https pages. Rendering the rail does not read visible text, selected text, DOM content, full URLs, screenshots, cookies, page localStorage/sessionStorage, form values, browser history, or TabMosaic cloud data. Clicking a rail action sends only the action id (`chat`, `read`, `region`, `save`, or `translate`) to the background script so Sidebar can open with current-tab metadata and an optional draft prompt. Todo and Translate sit behind the More overflow and only pre-fill existing Sidebar commands; Translate does not directly read selected text from the page. Page reading, region picking, todo creation, selected-text translation, and AI calls still happen only through the Sidebar flow. The hide control stores only an extension-local `tabmosaic.quickRailHidden` boolean.

CONFIRMED BY USER: current-group and selected-tabs visible-text reading is enabled by default only after the user initiates that scoped question or content-assisted regrouping request. The Sidebar must show a compact tool card before extraction, such as `Tool: Read group pages`, with scope, tab count, data type, storage boundary, and skipped tabs. Private beta reads at most 6 tabs per batch. The Sidebar may request optional per-site access for the specific http/https origins in that batch. It checks already-granted origins first, requests only missing origins, and releases only origins newly granted for that temporary context-read session after the answer. Sensitive, internal, restricted, or unreadable pages are skipped or require extra confirmation. Extracted multi-tab context is session-only and must not be persisted or cloud-synced.

CONFIRMED BY IMPLEMENTATION: Compare Selected Tabs reuses the same current-group / selected-tabs visible-text boundary. It runs only after the user asks from the Sidebar or picks the curated compare template, reads at most the capped selected/current-group tabs through the existing tool-card and temporary site-access flow, and never reads unselected tabs. The provider payload may include selected tab titles, hostnames, headings, visible text, skipped reason counts, and short local context conversation only. It must not include full URLs, query/hash, cookies, form values, hidden DOM, browser history, screenshots, workspace memory, or TabMosaic cloud storage. The answer renders recommendation, comparison rows, tradeoffs, missing information, and source notes as a normal assistant message. Follow-up buttons are explicit user actions only: `Save memo` stores a local memo from the derived assistant answer and minimized linked-tab/source metadata; `Create todo` stores a local Work Queue item with minimized linked-tab metadata, a short recommendation/checklist, provider label, and AI-used flag; `Research missing info` calls the existing internal web-search tool with a generated query only. Compare does not close tabs, move tabs, mutate pages, or create cloud memory automatically.

CONFIRMED BY IMPLEMENTATION: Research Brief reuses the same current-group / selected-tabs visible-text boundary. It runs only after the user asks from the Sidebar or picks the curated Research Brief template, reads at most the capped selected/current-group tabs through the existing tool-card and temporary site-access flow, and never reads unselected tabs. The provider payload may include selected tab titles, hostnames, headings, visible text, skipped reason counts, workflow label, and short local context conversation only. It must not include full URLs, query/hash, cookies, form values, hidden DOM, browser history, screenshots, workspace memory, or TabMosaic cloud storage. The model is explicitly told not to claim web search unless search results are provided. Follow-up buttons are explicit user actions only: `Save memo` stores a local memo from the derived assistant answer and minimized linked-tab/source metadata; `Create todo` stores a local Work Queue item with minimized linked-tab metadata, short findings/checklist, provider label, and AI-used flag for selected-tabs/current-group briefs only; `Research missing info` calls the existing internal web-search tool after click, decomposes missing information into up to three generated query strings, then renders a session-only research addendum from provider-returned answer/title/hostname/snippet metadata. The addendum does not open or crawl returned source pages, does not persist search results automatically, and does not send selected-tab page text, full URLs, screenshots, hidden DOM, or cloud memory to the search provider. Research Brief does not close tabs, move tabs, mutate pages, or create cloud memory automatically.

CONFIRMED BY IMPLEMENTATION: Decision Brief reuses the same current-group / selected-tabs visible-text boundary. It runs only after the user asks from the Sidebar or picks the curated Decision Brief template, reads at most the capped selected/current-group tabs through the existing tool-card and temporary site-access flow, and never reads unselected tabs. The provider payload may include selected tab titles, hostnames, headings, visible text, skipped reason counts, workflow label, and short local context conversation only. It must not include full URLs, query/hash, cookies, form values, hidden DOM, browser history, screenshots, workspace memory, or TabMosaic cloud storage. The answer renders recommendation, decision criteria, source tradeoffs, assumptions, missing information, source notes, and next steps as a normal assistant message. Follow-up buttons are explicit user actions only: `Save memo` stores a local memo from the derived assistant answer and minimized linked-tab/source metadata; `Create todo` stores a local Work Queue item with minimized linked-tab metadata, recommendation, criteria, assumptions, and missing information; `Research missing info` calls the existing internal web-search tool after click, decomposes decision gaps into up to three generated query strings, then renders a session-only addendum from provider-returned answer/title/hostname/snippet metadata. Decision Brief does not close tabs, move tabs, mutate pages, crawl new pages, claim unavailable search/file evidence, or create cloud memory automatically.

CONFIRMED BY IMPLEMENTATION: Saved-source Decision Brief runs only after the user explicitly asks to create a decision brief from saved sources/memos/collections. It reuses `DRAFT_FROM_SAVED_SOURCES` with `workflow: decision_brief` and sends only explicit local saved memo/collection titles, tags, source labels, hostnames, sanitized paths, snippets, and derived memo excerpts to the configured BYOK provider. It must not read live pages, request site access, search the web before the separate `Research missing info` action, include full URLs/query/hash, parse files/PDFs/screenshots, create new storage keys, create tab-based todos, mutate pages, move/close tabs, or create cloud memory. The answer stays session-only until the user clicks `Save memo`; `Research missing info` sends only generated query strings to the configured search provider.

CONFIRMED BY IMPLEMENTATION: Search-result Decision Brief runs only after the user explicitly clicks `Brief` on a Search Tool result card or asks to create a decision brief from the current/session search results. It reuses `DRAFT_FROM_SEARCH_RESULTS` with `workflow: decision_brief` and sends only current-session search-result titles, hostnames, sanitized paths, snippets, source labels, workflow label, and short local conversation context to the configured BYOK provider. It must not open returned result pages, read live page text, search again, include full URLs/query/hash, send saved-source bodies, parse files/PDFs/screenshots, create new storage keys, create tab-based todos, mutate pages, move/close tabs, or create cloud memory. The answer stays session-only until the user clicks `Save memo`; `Research missing info` remains a separate explicit Search Tool action.

CONFIRMED BY IMPLEMENTATION: Review Page reuses the existing current-page visible-text Page Agent boundary. It runs only after the user asks from the Sidebar or picks the curated Review page template, follows the same sensitive-page confirmation path, and sends only current-tab title, hostname, visible text, selected text, headings, description, safe site-skill hint, workflow label, and short local page-chat conversation to the configured provider. It must not include full URLs, query/hash, cookies, form values, hidden DOM, browser history, screenshots, workspace memory, or TabMosaic cloud storage. The answer renders page type, risks, open questions, review checklist, and safe next steps as a normal assistant message. Follow-up buttons are explicit user actions only: `Save memo` stores a local memo from the derived assistant answer and minimized current-tab/source metadata; `Create todo` stores a local Work Queue item from the derived review checklist. Review Page does not submit forms, edit pages, approve/merge PRs, rotate credentials, change settings, deploy, delete, crawl pages, or create cloud memory automatically.

Sidebar metadata Agent answers use the configured BYOK provider only when a local key/config is available from extension storage or the ignored private-beta config file generated from `.env.local`. Private beta defaults to DeepSeek and also supports explicit-permission custom OpenAI-compatible hosts / localhost endpoints. This path sends minimized current run metadata: tab title, hostname, path, window id, active/pinned/audible/discarded state, current group state, duplicate-review counts, active Sidebar context, and up to 4 sanitized recent user/assistant chat turns for follow-up resolution. It must not send page body, page summaries, full URL, restore URL, favicon URL, cookies, form data, hidden DOM, browser history, saved workspace contents, or cloud memory. Recent chat turns are sent only per request and are not stored in cloud by TabMosaic. Open-ended answers render as plain chat messages without automatic action chips or tab rows. Explicit `move_tabs` drafts still require Apply and do not apply browser actions automatically.

## 6. Sensitive Sites

内置敏感域名提示：

```text
bank
finance
medical
health
password
admin
dashboard
database
connection
supabase
stripe
aws
cloudflare
internal
localhost
```

对于敏感页面，summary 前提示：

```text
这个页面可能包含敏感信息。请确认是否读取当前页面正文。
```

## 7. Incognito

P0 建议不支持 incognito 自动整理。若后续支持，必须单独说明并默认关闭。

## 8. 数据删除

Dashboard 设置必须提供：

- 删除所有本地规则。
- 删除所有摘要。
- 删除所有 workspace。
- 删除云端账号数据 / Pro。
- 导出数据。

### 8.1 当前实现

CONFIRMED BY IMPLEMENTATION:

```text
Hidden private-beta Settings includes Clear Local Data.
The action asks for browser confirmation before deleting local data.
It clears:
- latest organize result
- Undo snapshot
- Restore Closed snapshot
- first-run privacy acceptance
- AI settings and local API key
- user rules
- chat refine draft
- saved workspace snapshots
- tab work states
- saved memos
- local error log
- duplicate close safety audit counts
```

It does not:

```text
- close tabs
- move tabs
- delete cloud data
- delete browser history
- delete cookies
```

After clearing, the next organize shows the first-run privacy check again.

## 9. 验收标准

```gherkin
Given 用户首次使用
When 插件需要读取 URL/title
Then UI 明确说明用途

Given 用户要求总结当前页面
When 页面正文读取首次发生
Then 系统请求确认

Given 用户要求总结敏感页面
When 页面域名、路径或标题命中敏感上下文
Then 系统先提示二次确认
And 用户取消时不读取页面正文

Given 用户要求总结当前 group 或 selected tabs
When Agent 需要读取多个页面正文
Then Sidebar 先显示 tool card，说明工具、范围、最多 6 个 tabs、visible text 和 session-only
And 敏感/受限/不可读页面被跳过或额外确认
And 页面正文和摘要不被持久保存

Given 用户把当前页面生成 checklist todo
When Agent 读取当前页面 visible text
Then 复用 current-page sensitive confirmation 和 Page Agent payload boundary
And 只把生成后的 checklist 存在本地 Work Queue
And 不持久保存原始页面正文、完整 URL、query/hash 或云端记忆

Given 用户通过 Sidebar `+` 选择 Selected text
When 当前页面有高亮文本
Then 只读取高亮文本作为本轮上下文
And 不读取整页 visible text、description、headings、full URL、query/hash 或隐藏 DOM
And 结果只保留在本地会话消息流中

Given 普通 http/https 页面渲染 Page Quick Rail
When 用户还没有点击 Sidebar 内的发送/确认动作
Then 插件不读取页面正文、选中文本、DOM、截图、full URL、表单值、cookies 或页面 storage
And Quick Rail 只发送被点击的 action id 给 background
And hide 状态只保存为 extension-local boolean

Given 用户粘贴链接或保存搜索结果
When 用户点击 Save 或 Todo
Then 只保存本地 source metadata
And 不自动打开、抓取、总结或上传链接页面内容

Given 用户粘贴链接
When 用户点击 Fetch link
Then Chrome 只请求该链接站点的 optional origin permission
And 抓取请求不带 cookies/credentials
And AI payload 不包含完整 URL、query/hash、cookies、form values、hidden DOM 或 browser history
And 结果只保留在本次 Sidebar 会话，除非用户再点击 Save 或 Todo

Given 用户进入 privacy settings
Then 用户可以查看权限解释、配置本地 API、单独清除本地 AI key、删除本地数据

Given 用户点击 Copy Diagnostic Snapshot
When 诊断快照被复制
Then 快照不包含 URL、tab title、hostname、rule pattern、group name、page text、email、bearer token 或 API key
And 快照只包含脱敏后的最近本地错误摘要
And 误关恢复安全审计只包含计数和白名单事件类型
And saved workspace 只显示数量，不包含 workspace 名称或浏览元数据

Given 用户点击 Copy Feedback Template
When 反馈模板被复制
Then 模板只包含手动填写项和脱敏诊断快照
And 不自动上传任何数据

Given 用户点击 Clear AI Key
When 用户确认
Then 本地 AI key 被删除，AI 分类被停用
And 本地 rules、最近整理结果、Undo/Restore snapshot、对话草稿、诊断和安全审计仍保留
And 不关闭、不移动任何 tabs
And 不调用 AI provider

Given 用户点击 Clear Local Data
When 用户确认
Then 本地 rules、saved workspace snapshots、API key、Undo/Restore snapshot、最近整理结果、本地错误日志、本地误关恢复安全审计被删除
And 不关闭、不移动任何 tabs

Given 用户删除单个 saved workspace snapshot
When 用户确认删除
Then 只有该本地 snapshot 从 tabmosaic.savedWorkspaces 移除
And 不关闭、不移动、不恢复任何 tabs
```
