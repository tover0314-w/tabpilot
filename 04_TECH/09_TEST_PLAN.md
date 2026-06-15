# 测试计划

## 1. 单元测试

Current no-dependency smoke test:

```bash
node tools/preflight.js
node tools/secret_scan.js
node tools/extension_smoke_test.js
node tools/issue_form_smoke_test.js
node tools/verify_release_package.js
node tools/beta_readiness_check.js
node --check tools/capture_ui_screenshots.js
node --check tools/build_store_screenshots.js
node --check tools/write_private_beta_ai_config.js
```

Coverage:

```text
- secret scan for tracked env files and real-looking API keys
- issue form smoke test for beta feedback structure, privacy redlines, and required safety acknowledgements
- release package verification against the current manifest version
- beta readiness check for QA evidence, ordinary runtime evidence, large-tab runtime evidence, handoff, release notes, package checksum, controlled-beta status, and public-launch blockers
- standalone privacy policy draft guard for unpublished status, confirmation gate, placeholders, saved workspace disclosure, DeepSeek optional-sharing boundary, no all-URLs permission, no cloud/account/analytics paths, local data deletion, and Limited Use disclosure
- GitHub Actions runs beta readiness after package verification so CI blocks stale readiness evidence
- manifest permission guardrails
- action icon entry constraint: manifest action has no `default_popup`, and clicking the extension icon opens Sidebar Agent directly
- action click flow guard: background handles `chrome.action.onClicked`, opens `sidePanel`, sets agent mode, and binds current-tab context
- English-only visible Sidebar/Dashboard copy, with English locale references loaded at runtime
- Chinese locale key parity kept only as future localization material
- Chat Refine parser examples, including English and Chinese commands
- user rule priority before AI/built-in classification
- exact/tracking duplicate safe close policy
- hash/query duplicate review policy
- duplicate review policy for Google Workspace same-document, Google Drive file/folder/open links, Dropbox shares/files/folders, YouTube same-video, GitHub PR/Issue/Discussion/Actions run/Commit, Linear issue, Jira Cloud issue, Figma file/design/proto, Canva design, Miro board, Coda doc, Notion page, and same-host normalized-title candidates, while different search queries / different objects / different hosts are not grouped and no domain-review or title-review group is auto-closed
- protected duplicate tabs not auto-closed
- large synthetic local planning guard for 180 tabs, covering duplicate detection, safe-close planning, group-plan validation, privacy sanitization, and bounded runtime without reading real browser tabs
- current-tab summary confirms sensitive pages before visible text extraction
- AI output validation for invented/repeated tab IDs
- AI classification request includes minimized metadata only and excludes full URL, restore URL, favicon URL, query token, and page text
- Agentic Classification V2 should classify by project/task/workflow when metadata supports it, flag same-domain-only groups, and include evidence from title/hostname/path without reading page bodies
- Agentic Classification V2 refinement should surface metadata-only split/merge suggestions in the Sidebar completion message without applying browser changes
- Agentic Classification V2 refinement should remain visible after organize completes as a folded note, and broad same-domain groups such as `GitHub` should suggest workflow-level splits instead of another domain bucket when metadata supports it
- `preview refinements` should convert the latest metadata split suggestions into an Apply/Cancel `regroup_tabs` preview using only real current tab IDs, and must not read page text, upload full URLs, call the provider, close tabs, or mutate the browser before Apply
- Sidebar Agent tool registry should keep one validated tool contract for metadata reads, page-content reads, planning tools, and action tools
- Dashboard selected-tabs chat entry should remain hidden until 2+ tab rows are selected, preserve `selected_tabs` scope in Sidebar/Agent context, avoid cross-window mixing, show a compact reset notice when selection moves to another window, and not read page text from Dashboard
- Dashboard selected-tabs AI refinement entry should remain hidden until 2+ tab rows are selected, open Sidebar with `selected_tabs` context, prefill a content-regroup prompt, and not auto-submit or read page text from Dashboard
- Group/selected-tabs visible-text reading is user-triggered and default enabled for the scoped question; it must render a tool card, cap reads at 6 tabs, skip or extra-confirm sensitive/restricted pages, and keep extracted context session-only
- Group/selected-tabs tool disclosure must visually read as a lightweight inline assistant status, not a standalone tool panel
- Selected-tabs running tool cards must use `Read selected tabs` / `read_selected_tabs_pages`, while current-group running tool cards use `Read group pages` / `read_group_pages`
- Group/selected-tabs temporary site access must check existing per-origin permissions, request only missing origins, release only session-owned newly granted origins, and preserve pre-existing user/provider permissions
- Group/selected-tabs answers render as Markdown-style assistant messages, while read/skipped counts, skipped reason chips, visible-text/session-only disclosure, and missing temporary site-access guidance stay in the compact tool card. Zero-readable batches must be marked metadata-only, state that no page body was read/sent/stored, and avoid persisting summaries.
- DeepSeek multi-tab Page Agent payload should include only capped visible text, titles, hostnames, headings, selected text, skipped reasons, skipped reason breakdown counts, and tool-card counts; it must exclude full URLs/query/hash, browser history, saved workspace contents, persistent summaries, and TabMosaic cloud storage
- Selected page-region chat must be user-triggered from Sidebar, render an `extract_selected_page_region` tool card, use a page-local click picker, send only selected element visible text plus safe lightweight structure, include bounded table headers/rows through the redaction path, remain session-only, and include only cropped screenshot metadata while excluding screenshot image bytes/data URLs from the text-only Page Agent payload
- Content-assisted regrouping should route through `REGROUP_CONTEXT_TABS`, read capped visible text only after a user request, redact full URLs/secrets, validate proposed tab IDs against readable tabs, render an Apply / Cancel preview, and avoid native group changes until Apply
- AI classification request carries an abort signal and falls back to local rules on timeout
- AI classification status remains lightweight in the sidebar completion message, while Dashboard retains the fuller AI status view
- Dashboard workbench layout keeps the HTML prototype shell: top bar, project rail, filter chips, expanded group cards, and favicon-backed tab rows
- Dashboard screenshot coverage includes the compact Smart Groups board, dense checkbox/favicon/title tab-row alignment, selected-tabs `Chat selected (N)` state, and mobile stacking; Sidebar screenshot coverage includes the idle welcome assistant message
- Side panel opens as a chat-first Tab Agent UI, not a result metrics panel
- Side panel idle/no-run state renders one assistant welcome message with Smart Organize, Current Page, AI setup, and Dashboard actions; it must not render a separate welcome card outside the chat thread
- Side panel organize error states disclose that no tabs were moved or closed and show a retry/diagnostics next step
- Side panel composer must show the active context as a compact top row inside the same composer surface; selected-tabs/current-group context should not render as an inline prefix inside the text field and must not appear as a detached status strip above the composer
- Side panel composer must show typed extra context/tool intent as compact chips inside the same composer row: pasted link, selected text, page region/Smart Fill, Agent Search, or template. These chips must not read/fetch/upload/call providers until the user submits or chooses the underlying flow.
- Side panel composer picker must show a compact local-only Routing hint for the typed draft: metadata, current-page Page Agent, selected text, page region, selected-tabs/group, or Agent Search Tool. The hint must not switch providers, call AI/search, read content, request permissions, write storage, upload data, or mutate tabs/pages before user submission.
- Side panel screenshot capture must fail if the Sidebar horizontally drifts, clips message cards, clips the composer, or renders the chat panel as a nested scroll container instead of a plain message stream
- Side panel composer preserves recent user and Agent messages in an in-memory local thread
- Side panel disables stale Chat Refine Apply/Cancel buttons when a newer draft appears or a draft is cancelled
- Side panel quick action chips route through the same chat command path and append user/Agent messages to the local thread
- Side panel composer routes direct safe agent commands for current-tab summary, organize, Undo, Restore Closed, Dashboard, local workspace save, and local Work Queue todo creation before falling back to chat-refine preview
- Search provider diagnostics must be redacted and local-only: missing-provider, unsupported-provider, completed, and failed Search Tool paths may write `tabmosaic.searchDiagnostics` with provider/origin/key-status/result-count/error-type/privacy booleans only; Sidebar and Dashboard may display that status; Clear Local Data must remove it; diagnostics must not store API keys, typed queries, source URLs, source snippets, result bodies, tab titles, page text, full URLs, screenshots, history/bookmarks, or cloud IDs.
- Side panel composer `+` opens a compact context / skill picker with only wired flows: current page, selected text, page region, selected tabs/group, Agent Search Tool, Decision Brief, and local todo; Search must use the internal Agent tool executor rather than opening a browser search page, selected-tabs/group-only workflows must be hidden until that context is active, and unimplemented file/full-screenshot skills must stay hidden
- Prompt / Skill Templates must stay inside the compact Sidebar composer picker, declare allowed context/tool/output/blocked-action metadata in code, hide selected-tabs/group templates when no matching context exists, route only through existing safe flows, and must not add dynamic third-party skills, marketplace code, arbitrary scripts, new permissions, or new storage keys
- Sidebar `@` Context Picker must open from the composer without a typed command, filter the compact context/tool/template entries, insert a natural prompt for the selected context, and must not read page text, call AI/search, upload files/screenshots, write storage, or mutate browser state until the user submits or confirms the resulting prompt
- Source provenance chips must render as compact assistant-message chips for current-page, selected-text, page-region, selected-tabs/current-group, and AI Agent metadata answers; they should show context/source type plus read/skipped or metadata-only state, use existing Search Sources for search results, and must not add page reads, persistence, analytics, or new permissions
- Compare Selected Tabs must route template and natural-language compare questions through `workflow: compare_selected_tabs`, reuse the capped selected-tabs/current-group visible-text tool flow, validate comparison rows against real readable tab IDs, render a recommendation plus Markdown comparison table with source chips, expose explicit Save memo / Create todo / Research missing info follow-up buttons, keep the compare result session-only until button click, store only derived assistant text plus minimized metadata for memo, store only a local Work Queue item for todo, and use the internal search tool for missing-info research
- Research Brief must route template and natural-language research brief questions through `workflow: research_brief`, reuse the capped selected-tabs/current-group visible-text tool flow, render findings, contradictions, gaps, next steps, and source notes as a normal Markdown assistant message with source chips, explicitly block fake web-search claims when no search results are provided, expose Save memo / Create todo / Research missing info follow-up buttons, keep the brief session-only until button click, store only derived assistant text plus minimized metadata for memo, store only a local Work Queue item for todo, use the internal search tool for missing-info research, render successful missing-info search as a session-only research addendum with provider summary/source signals/citations/privacy boundary, decompose missing-info follow-up into at most three focused search queries, and avoid opening/crawling returned source pages
- Decision Brief must route template and natural-language decision questions through `workflow: decision_brief`, reuse the capped selected-tabs/current-group visible-text tool flow, render recommendation, decision criteria, source tradeoff table, assumptions, missing information, source notes, and next steps as a normal Markdown assistant message with source chips, reject invented comparison-row tab IDs, expose explicit Save memo / Create todo / Research missing info follow-up buttons, keep the brief session-only until button click, store only derived assistant text plus minimized metadata for memo, store only a local Work Queue item for todo, use the internal search tool only after the missing-info action is clicked, decompose missing-info follow-up into at most three focused search queries, and send no selected-tab page text/full URLs to the search provider
- Review Page must route the curated Review page template and natural current-page review/risk/next-step questions through `workflow: review_page`, reuse the existing current-page visible-text Page Agent flow and sensitive-page confirmation path, render page type, risks, open questions, review checklist, and safe next steps as a normal Markdown assistant message with source chips, expose explicit Save memo / Create todo follow-up buttons, keep the review result session-only until button click, store only derived assistant text plus minimized current-tab metadata for memo, store only a local Work Queue item for todo, and must not submit forms, mutate pages, approve/merge/deploy/delete/rotate credentials, crawl pages, upload full URLs, or use cloud storage
- Contextual Writing must route the curated Draft response template, Rewrite selection template, Draft from tabs template, natural current-page draft/reply/comment/update prompts, selected-text rewrite/polish prompts, selected page-region draft/rewrite prompts, selected-tabs/current-group project update/email/memo draft prompts, and saved-source/memo/collection writing prompts through `workflow: contextual_writing`; reuse the matching Agent boundary (current-page visible text, highlighted text only, clicked region only, capped selected-tabs/current-group visible text only, or sanitized local saved memo/collection excerpts only); render copy-only draft text as a normal Markdown assistant message with source chips; expose explicit Copy draft / Save memo / Run log follow-up buttons; keep the draft session-only until user click; copy only generated draft text to the clipboard; and must not read unselected tabs, read live pages for saved-source writing, search the web, insert text, submit forms, post comments, send email/messages, approve/merge/deploy, mutate pages, move/close tabs, upload full URLs, upload screenshot bytes, or use cloud storage
- Smart Fill Lite must route the curated Smart Fill table template and natural selected-region/table/list extraction prompts through `workflow: smart_fill_lite`, reuse the selected page-region flow and sensitive-page confirmation path, render a copy-only Markdown table, CSV, row classifications, row actions, notes, and source chips as a normal assistant message, expose explicit Copy table / Copy CSV / Create todo / Save memo follow-up buttons, keep the result session-only until user click, store only derived assistant table text plus minimized source metadata for memo, store only a local Work Queue checklist for todo, and must not auto-fill forms, edit page tables, submit data, mutate pages, search/enrich rows, crawl pages, upload screenshot bytes/full URLs, or use cloud storage
- Agent Safety Layer must add a `security` boundary to current-page, selected-text, selected-region, fetched-link, and selected-tabs/current-group Page Agent payloads; mark page text as untrusted source material; list allowed tool permissions and blocked actions; detect prompt-injection-like page text; block unsafe instruction-like model output before rendering; show compact Allowed / Blocked / Page text is untrusted tool-card labels; and must not add permissions, automatic reads, page mutation, analytics, screenshot upload, or cloud storage
- Agent Run Transcript must expose a compact `Run log` action for Page Agent / selected-tabs answers, render a Markdown-style transcript message with request/context/provider/tools/skips/privacy/safety/actions/undo, persist only capped local sanitized summaries in `tabmosaic.agentRunTranscripts`, exclude those transcript messages from follow-up AI context, clear the key through Clear Local Data, redact URLs/secrets best-effort, and must not persist raw page text, full URLs, screenshot bytes, hidden DOM, browser history, cookies, form values, or cloud storage
- AI Triage must append a compact `Triage` section to the organize-complete assistant message with Workspace focus / Act now / Read later / Reference / Can close / Needs review, use only sanitized run metadata and duplicate state, disclose that page text was not read, avoid new storage keys/provider/search calls, and must not automatically create todos, close non-duplicates, move tabs, mutate pages, or use cloud storage. Its explicit `Create todo` action and `make triage a todo` command must write one `ai_triage` Work Queue item to `tabmosaic.agentTasks`, link at most 8 minimized tabs, preserve `metadataOnly: true`, and still avoid page text/full URLs/provider/search/cloud.
- Memory relief safe command must be Apply-gated from Sidebar, re-scan live tabs before Apply, discard/sleep only inactive ordinary http/https tabs that are not active/pinned/audible/protected/incognito/internal/already-suspended, collapse only inactive groups, save likely read-later tabs locally, and avoid non-duplicate tab close, page reads, full URLs, provider/search calls, cloud storage, analytics, page mutation, and exact MB claims.
- Suggested-group safe command must be Apply-gated from Sidebar, route prompts such as `suggest group for this tab` before read-only group answers, score by task/project/workflow metadata before same-domain evidence, re-scan live tabs before Apply, move only the current still-open safe tab, provide Undo through the existing move path, and avoid background listeners, default auto-move, page reads, full URLs, provider/search calls, cloud storage, analytics, tab close, and page mutation.
- Workspace Goal must expose explicit `Set goal`, `set goal: ...`, `clear goal`, and `what is my goal` flows; store only sanitized local `tabmosaic.workspaceGoal` text/source/timestamps/metadataOnly; make Work Brief prioritize the saved goal; infer a likely goal from local todos/memos/collections/workspaces/Later tab states when no goal is saved without automatically saving it; let saved workspace snapshots default to the sanitized goal name; let explicit goal-to-todo commands write one local `workspace_goal` Work Queue checklist with minimized linked-tab metadata; remove the goal key through Clear Local Data; and must not read page text, full URLs, history, screenshots, provider/search output, cloud storage, or change tabs.
- Translation / reading assistant commands must route selected-text translate/simplify/glossary requests through `SUMMARIZE_SELECTED_TEXT`, selected-text rewrite/polish requests through `workflow: contextual_writing`, current-page translate/simplify/bilingual-summary/glossary requests through the existing current-page flow, keep output copy-only, and must not edit pages, submit forms, persist translated text, or bypass sensitive-page confirmation
- Page Quick Rail content script renders only on ordinary http/https pages, exposes Chat / Page / Region plus More as the four visible right-edge controls, keeps Todo and Translate behind a compact overflow, delegates through `RUN_QUICK_RAIL_ACTION`, opens Sidebar with a pending prompt, stores only an extension-local hide preference, and must not read page text, selected text, DOM content, screenshots, page storage, cookies, form values, or browser history
- Selected-text Page Agent requests must read only user-highlighted text plus title/hostname, stay session-only, ask for text selection when empty, and exclude full-page visible text, description, headings, full URLs, query/hash, hidden DOM, diagnostics, feedback templates, and cloud storage
- Sidebar natural-language todo creation stores only local tab metadata from current tab / current group / selected-tabs context, renders a Markdown assistant message, and does not read page text, store full URLs, or contact the AI/search provider. Todo polish commands must support explicit task names, `rename todo to ...`, `add checklist item: ...`, `mark first checklist item done`, named target edits such as `add checklist item to launch checklist todo: ...`, and current-context merge such as `add current context to launch checklist todo`; update only one open local `tabmosaic.agentTasks` item; ask for clarification instead of writing storage when multiple local todos match; render as a plain Markdown assistant message without Apply/Cancel; and avoid page reads, provider/search calls, full URLs, cloud storage, tab moves, tab closes, or page mutation. Hidden Dashboard Workbench checklist controls must add/delete/reorder sanitized checklist text, preserve aligned `checklistMeta[].sourceNote`, save per-item source notes after direct user edits, append local `Suggest steps` from existing task notes/linked metadata/saved memos/saved collections, prioritize concrete action lines from already-local saved memo bodies/source snippets before generic Review fallbacks, keep the default Dashboard hidden/simple, and avoid the same page-read/provider/search/full-URL/cloud/tab-mutation boundaries.
- Visible Screenshot Vision must appear only as an explicit Sidebar Screenshot action or explicit screenshot prompt, render one lightweight tool-card state, require a configured vision-capable OpenAI-compatible model before capture, avoid capture when the model looks text-only, compress the current visible screenshot before provider upload, send only screenshot image bytes plus title/hostname/short local chat context, exclude full URLs/query/hash/hidden DOM/page text outside the image/cookies/form values/browser history/search results/cloud storage, discard image bytes after the request, render the answer as a normal assistant Markdown message with source chips, and never mutate pages, submit forms, move/close tabs, or persist screenshot bytes in storage/memos/transcripts/diagnostics.
- Visible Screenshot Decision Brief must route explicit screenshot decision prompts through `SUMMARIZE_VISIBLE_SCREENSHOT` with `workflow: decision_brief`, require the same vision-capable provider gate, send only one compressed visible screenshot plus title/hostname/screenshot metadata/short local context, render recommendation, decision criteria, visible-evidence row, tradeoffs, assumptions, missing information, source notes, and next steps as one normal assistant Decision Brief message with Save memo / Research missing info, and must not read hidden DOM/off-screen page text, upload full URLs/query/hash, use file/PDF/search/saved-source bodies, mutate pages, move/close tabs, create a new storage key, or persist screenshot bytes.
- Visible Screenshot Research Brief must route explicit screenshot research prompts through `SUMMARIZE_VISIBLE_SCREENSHOT` with `workflow: research_brief`, require the same vision-capable provider gate, send only one compressed visible screenshot plus title/hostname/screenshot metadata/short local context, render findings, contradictions, gaps, recommendations, and source notes as one normal assistant Research Brief message with Save memo / Research missing info, and must not read hidden DOM/off-screen page text, upload full URLs/query/hash, claim live web search, use file/PDF/search/saved-source bodies, mutate pages, move/close tabs, create a new storage key, or persist screenshot bytes.
- Page Region cropped vision must run only after the user clicks one selected page region, keep the existing text-only metadata path for non-vision models, use a dedicated multimodal request for vision-capable models, send the cropped selected-region image only in the `image_url` part, exclude image data URLs from text JSON and local summaries, exclude full URLs/query/hash/hidden DOM/unselected page areas/cookies/form values/browser history/search/cloud storage, discard the full visible-tab capture after cropping, discard the cropped data URL after the request, render as a normal assistant message, and never mutate pages, submit forms, auto-fill, move/close tabs, or persist screenshot bytes.
- Research Brief query decomposition must run only after the explicit `Research missing info` action, produce at most three sanitized focused queries, call the existing Search Tool for each query, dedupe returned sources before rendering, disclose the focused queries in a normal assistant addendum, and send no selected-tab page text, selected-tab full URLs, screenshot bytes, saved-source bodies, files, PDFs, browser history, cookies, form values, analytics identifiers, or cloud memory to the search provider.
- Decision Brief query decomposition must run only after the explicit `Research missing info` action, produce at most three sanitized focused queries from missing information plus decision criteria/assumptions/recommendation hints, call the existing Search Tool for each query, dedupe returned sources before rendering, disclose the focused queries in a normal assistant addendum, and send no selected-tab page text, selected-tab full URLs, screenshot bytes, saved-source bodies, files, PDFs, browser history, cookies, form values, analytics identifiers, or cloud memory to the search provider.
- Saved-source Research Brief must route natural saved-source/memo/collection research prompts through `DRAFT_FROM_SAVED_SOURCES` with `workflow: research_brief`, use only explicit local `tabmosaic.savedMemos` / `tabmosaic.savedCollections` excerpts selected for the request, render findings/contradictions/gaps/next steps/source notes as one assistant Markdown message, expose Save memo and Research missing info without tab-based todo in the first slice, and must not read live pages, search the web before the explicit missing-info action, upload full URLs/query/hash, parse files/PDFs/screenshots, write new storage keys, mutate pages, move/close tabs, or use cloud storage.
- Saved-source Decision Brief must route natural saved-source/memo/collection decision prompts through `DRAFT_FROM_SAVED_SOURCES` with `workflow: decision_brief`, use only explicit local `tabmosaic.savedMemos` / `tabmosaic.savedCollections` excerpts selected for the request, render recommendation/decision criteria/source tradeoff table/assumptions/missing information/source notes/next steps as one assistant Markdown message, expose Save memo and Research missing info without tab-based todo in the first slice, and must not read live pages, search the web before the explicit missing-info action, upload full URLs/query/hash, parse files/PDFs/screenshots, write new storage keys, mutate pages, move/close tabs, or use cloud storage.
- Search-result Decision Brief must be available from the Search Tool result card `Brief` action and natural search-result decision prompts, route through `DRAFT_FROM_SEARCH_RESULTS` with `workflow: decision_brief`, send only current-session search-result titles, hostnames, sanitized paths, snippets, source labels, and short local conversation context to the configured OpenAI-compatible provider, render one normal assistant Decision Brief message with Save memo / Research missing info, and must not open result pages, read live page text, search again, upload full URLs/query/hash, send saved-source bodies, write new storage keys, mutate pages, move/close tabs, or use cloud storage.
- Dashboard Memory view must stay hidden from the default Dashboard, read only existing `tabmosaic.savedMemos` / `tabmosaic.savedCollections`, render local search results without page reads/provider calls/new storage keys, focus only still-open linked source tabs by local tab id, and send saved-source prompts to Sidebar through `tabmosaic.sidebarPendingPrompt` after user click
- Tabs-as-tasks first slice stores Dashboard Done, Later, and Keep states in `tabmosaic.tabWorkStates` with minimized tab metadata only; Sidebar natural-language Done/Later/Keep commands must first render an Apply/Cancel safe-command preview and write state only after Apply; Later may create a local Work Queue item; Keep must become a local `user` protected reason in future organize snapshots and prevent automatic grouping / duplicate close for that tab; `undo` must restore previous local tab states and remove any Work Queue item created by the reverted Later action; none of these actions close, move, read, screenshot, summarize, upload, or mutate the page
- Protected group/domain first slice stores Apply-gated local rules in `tabmosaic.userRules` with `type: protected` and `protectionScope: group | domain`; commands must render a safe-command preview first; Apply must not move/close/read/upload/mutate anything; future snapshots must add `group`/`domain` protected reasons and automatic grouping / duplicate-close planning must skip matching tabs
- Sidebar safe duplicate close commands must render a Markdown safe-command preview before any close, store no full URLs/restore URLs in `tabmosaic.chatDraft`, re-scan live tabs on Apply, close only previewed tabs that are still exact/tracking safe-close candidates, write `tabmosaic.lastClosedTabs` only after actual close, and keep active/pinned/audible/protected/review/internal tabs open
- Sidebar current-page checklist todo creation reuses the user-triggered Page Agent visible-text flow, respects sensitive-page confirmation, stores generated checklist items locally, and does not persist raw page text or full URLs
- Search Tool source rows support Open / Save / Todo; Save/Todo persist sanitized local sources only after user click and never auto-open search result pages
- Pasted link handling renders a normal assistant message, strips query/hash for local persistence, and does not open, fetch, summarize, or send link content without a separate user-triggered content-read flow. Explicit `Fetch link` must request only the pasted link origin, fetch with credentials omitted, send no full URL/query/hash to the Page Agent payload, render a lightweight tool state plus a normal Markdown assistant message, keep the result session-only until Save/Todo, and cover this path in smoke + UI screenshot fixtures.
- Side panel composer answers local capability/help questions without requiring page reads or an organize run
- Side panel composer renders open-ended fallback questions as normal assistant messages when DeepSeek is not enabled or no organize context exists, instead of surfacing the local parser error
- Side panel current-page summary and local page question answers render inside the chat message flow and keep the legacy summary panel hidden
- Side panel mock screenshots include a realistic current-page Q&A scenario with current-tab context visible near the composer
- Side panel current-page follow-up routing keeps a short-lived local context for the same tab, re-enters current-page Q&A for natural follow-ups, and does not steal explicit tab-management questions
- Current-page Page Agent may include generic site-skill hints for common work pages, but the payload must exclude owner/repo names, issue keys, PR/run numbers, design/document IDs, project slugs, full URL, query/hash, hidden DOM, and extra page content beyond the existing visible-text flow
- Side panel current-page loading states are replaceable assistant messages and do not remain as separate checking/extracting chat bubbles after the final answer
- Chrome internal / restricted current-page chats return one natural unreadable-page assistant reply
- Current-page extraction failures use distinct unreadable-page reasons for browser/extension pages, missing temporary site permission, protected pages, and empty visible text
- Background current-page summary accepts an optional question and answers from visible page text with local sentence matching
- Side panel composer answers latest organize status, group, duplicate, and AI-status questions from local run state before falling back to chat-refine preview
- Side panel composer answers next-step questions from latest local organize state before falling back to chat-refine preview
- Side panel composer answers duplicate review queue and closed duplicate restore questions from latest local run state / local restore state without rendering full restore URLs
- Side panel composer answers active-tab, protected-tab, and read-later candidate questions from the latest sanitized local run snapshot
- Side panel composer finds tabs from the latest local snapshot and focuses an existing matching tab through the existing focus action
- Side panel composer falls back to DeepSeek metadata-only Agent answers after direct commands, local status answers, tab search, and safe local chat-refine drafts do not match
- DeepSeek metadata-only Agent answers send title, hostname, path, tab state, group state, duplicate-review counts, active Sidebar context, and up to 4 sanitized recent user/assistant chat turns only; they do not send page body, page summaries, full URLs, restore URLs, favicon URLs, browser history, saved workspace contents, or cloud memory
- DeepSeek metadata-only open answers render as plain assistant bubbles without relevant tab rows or automatic safe action chips; explicit `move_tabs` Agent outputs still render validated Apply/Cancel drafts and do not apply browser actions automatically before user Apply
- DeepSeek metadata-only Agent `move_tabs` drafts require an explicit Apply, reuse the existing local `move_tabs` path, create native Chrome tab groups, keep Undo, and do not close tabs
- DeepSeek metadata-only Agent action requests must recover from incomplete/no-draft model responses by building a local verified `move_tabs` Apply/Cancel preview only when the user explicitly asked to move/group/regroup tabs and current minimized tab metadata can match real movable tabs plus a target group. The recovery must not close tabs, read page text, send full URLs, or apply browser changes before Apply.
- Dashboard default page opens directly to Smart Groups and does not show Latest Result, timestamp, Current Workspace card, or result metrics area
- Dashboard Smart Groups filter chips render All / AI groups / Rule groups views and localized empty states
- Dashboard Smart Groups keep first rows compact while expandable `+ N tabs` rows reveal remaining local tab rows and actions
- Dashboard Duplicate Center expands duplicate groups into local tab details and focuses existing tabs without close actions
- Dashboard stored organize errors render as a compact safe error card instead of an empty workspace
- Dashboard tab title focus activates the existing browser tab/window without storage writes or destructive tab actions
- Hidden/private-beta local workspace save stores a minimized local snapshot and excludes full URLs, restore URLs, URL hashes, favicon URLs, and page text
- Hidden/private-beta local workspace delete requires confirmation and only removes the selected local snapshot without calling tab, tab group, or window APIs
- Hidden/private-beta local workspace restore requires confirmation, saves Undo, regroups only currently open saved local tab IDs, skips closed/protected/internal tabs, and does not reopen URLs or close tabs
- Dashboard same-window tab move UI calls the background action, limits target groups to the same window, and avoids tab close actions
- Dashboard drag/drop tab assignment reuses the same same-window background move action and avoids tab close actions
- Dashboard Undo and Restore Closed actions reuse existing background actions, enable only from latest run state, and avoid direct destructive tab actions
- Dashboard keeps unwired P1/prototype placeholders, Saved Workspaces, Auto Organize, and Settings out of the default commercial UI
- Disposable manual QA checklist covers the current MVP flows: Tab Agent chat UI, latest organize result as one assistant message bubble, bottom composer, selected-tabs page-context native permission approval/denial checks against local `tabmosaic-manual.test` fixture pages with a Context Fixture Guide and copyable selected-tabs prompt, DeepSeek Agent open answer / move draft when tested, Smart Groups filters, Duplicate Center tab focus, tab focus, same-window tab move, Dashboard apply, safe error states, AI status, sensitive summary, privacy outputs, local QA notes in copied Markdown reports, and one-click copying of the blank redaction-safe real-profile QA template
- Hidden/private-beta permission explanation remains aligned with manifest permissions
- local error log entries redact URLs, hostnames, emails, bearer tokens, and API keys
- duplicate close safety audit stores only counts and whitelisted event types
- current run snapshot strips restore URLs, URL hashes, raw/full URLs, page text, and favicon query/hash data before storing UI state
- current run snapshot strips internal domain-specific duplicate hashes before storing UI state
- current run snapshot strips internal title duplicate hashes before storing UI state
- Undo snapshot stores only the minimum IDs, window, index, and group fields needed to restore grouping
- Beta diagnostic snapshot and feedback template redact URLs, tab titles, hostnames, rules, group names, page text, and API keys
- Beta feedback template uses English-only classification quality labeling for the 70/20/10/0 target
- AI connection test calls the provider model-list endpoint first; if unavailable, it sends only a fixed synthetic chat ping
- AI connection test carries an abort signal
- AI connection model-list success returns bounded model suggestions to Dashboard only from provider `/models`; synthetic chat fallback must not invent model suggestions
- AI connection diagnostics show provider label, `/models` vs synthetic ping, model suggestion count, local vs remote endpoint, permission origin, Authorization header status, and no-tab/no-page/no-full-URL flags without sending an extra probe
- AI connection troubleshooting renders concise next-step codes for local server/model loading, listed-model selection, exact model-name checks, synthetic-only fallback, missing remote API key, provider-origin permission, HTTPS/localhost boundary, and generic provider settings without sending an extra probe or real user content
- AI connection supports the configured BYOK OpenAI-compatible provider only after provider-origin permission; it sends no tab data, full URLs, page text, chat history, rules, workspace snapshots, or real user content
- BYOK provider config tests explicit host permission UX, provider validation, local key storage, localhost endpoint handling, remote HTTP rejection, and the same minimized payload boundaries
- Agent web search tests Tavily-style BYOK separately from the AI model provider: missing provider does not send a request, Settings stores the search key locally, provider-origin permission is requested only for the configured search host, and successful search sends only the normalized typed query with raw content/images off
- AI host guardrail keeps background validation, Dashboard validation, Dashboard permission copy, and manifest host permissions aligned: required host stays DeepSeek-only, custom hosts stay optional/user-triggered
- Local model presets for Ollama / LM Studio show compact setup guidance in Dashboard Settings without saving settings, calling providers, requesting permissions, reading tabs, or widening host permissions
- Hidden private-beta AI settings copy explains BYOK provider boundaries when the Settings path is opened intentionally for testing
- Local private-beta AI config tool can copy `.env.local` DeepSeek settings into ignored `extension/private-beta-ai-settings.json`; release package verification rejects that file if it appears in a zip
- Dashboard local rule deletion requires confirmation and does not move or close tabs
- Dashboard Rules & Memory hidden page renders human-readable `Group` and `Protect` rule rows, source/hit/last-used metadata, and local-only safety copy; it must not read page text, upload data, move tabs, close tabs, or add default Dashboard clutter
- Dashboard Rules & Memory manual editor can create/edit local `domain` and `url_pattern` Group rules only, blocks protected-rule repurposing, records dashboard/dashboard-edit source, and writes only `tabmosaic.userRules` without organize, page reads, provider/search calls, tab moves, tab closes, analytics, or cloud storage
- Dashboard Clear AI Key removes only the local API key, disables AI classification, keeps other local data, and does not move or close tabs
- Dashboard Clear Local Data removes local rules, saved workspace snapshots, tab work states, Work Queue items, saved collections, AI/search settings, run state, Undo/Restore snapshots, privacy acceptance, chat draft, quick rail hide state, and local error log
```

Optional provider smoke test:

```bash
node tools/preflight.js --deepseek
node tools/preflight.js --deepseek-fixture
node tools/deepseek_smoke_test.js
node tools/deepseek_smoke_test.js --classify-fixture
node tools/deepseek_real_tabs_classification.js
node tools/capture_real_ai_sidepanel_result.js
```

Expected:

```text
- default mode reads .env.local and calls /models only
- no real browser tab data is sent
- --classify-fixture sends synthetic tabs only and rejects invented tabIds
- provider smoke uses bounded requests. DeepSeek-specific CLI smoke remains limited to DeepSeek, while extension Dashboard connection testing supports custom OpenAI-compatible hosts through explicit origin permission.
- real-tab classification sends current Chrome tab title, hostname, path without query/hash, window index, active state, and local semantic hints to the configured model
- real-tab classification does not send full URLs, query strings, hashes, page body text, cookies, form values, browser history, local storage, saved workspace contents, or API keys
- real AI Sidebar screenshots use the model-produced classification result, not the deterministic UI mock fixture
```

Optional runtime smoke test:

```bash
node tools/preflight.js --runtime
node tools/preflight.js --agent-flow
node tools/preflight.js --large-runtime
node tools/chrome_runtime_smoke_test.js
node tools/chrome_runtime_smoke_test.js --agent-flow
node tools/chrome_runtime_smoke_test.js --real-ai-content-regroup-screenshot
node tools/chrome_runtime_smoke_test.js --large-tabs
node tools/open_manual_qa_profile.js --dry-run
node tools/open_manual_qa_profile.js --self-test
```

The runtime script uses a temporary browser profile and synthetic tabs. It prefers `CHROME_PATH`, then auto-detects Playwright / Chrome for Testing / Chromium before falling back to system Google Chrome.

Runtime coverage includes one-click organize, safe duplicate close, Restore Closed, Chat Refine apply, Dashboard group title/color apply, Dashboard same-window tab move into an existing native group, Dashboard drag/drop tab assignment into an existing native group, Dashboard tab focus, Dashboard selected-tabs context entry UI-contract coverage, Dashboard local workspace save/delete, Dashboard Duplicate Center tab focus, Dashboard Restore Closed, Dashboard Undo, and real Sidebar composer command submission for Open Dashboard, context-aware composer state, selected-tabs context tool-card rendering, selected-tabs follow-up routing, synthetic HTTP visible-text extraction using a temporary fixture host grant, content-assisted regroup preview rendering, content-assisted regroup Apply into native Chrome groups, ephemeral chat thread rendering, capability/help answer, open-ended fallback answer without DeepSeek, local workspace save command, next-step answer, current-page chat summary response, current-page question rendering, Restore Closed, Undo, Organize Again, group-status answer, AI-status answer, duplicate-review answer, closed-duplicate answer, active-tab answer, protected-tab answer, read-later candidate answer, tab search, and opening a matching existing tab.

Current local smoke coverage verifies the group/selected-tabs context path at the background/payload/UI-contract level: Dashboard selected-tabs entry, selected-tabs scope preservation in the metadata Agent, active context rendered as a stacked top row inside the Sidebar composer, selected-tabs running tool-card copy, concrete `SUMMARIZE_CONTEXT_TABS` routing, concrete `REGROUP_CONTEXT_TABS` routing, compact inline assistant tool-state rendering, compact skipped reason rendering, Markdown-style context answers without nested summary cards or tab-summary rows, skipped reason chips/breakdown counts, capped extraction of at most 6 tabs, protected/restricted/missing-permission/unreadable/empty/over-cap skipped-tab reporting, missing-permission retry guidance, zero-readable metadata-only fallback copy, session-only follow-up history capped to 10 local Q/A turns, DeepSeek multi-tab payload minimization, selected-tabs contextual-writing draft schema and copy-only boundaries, content-assisted regroup payload minimization, redaction, no full URLs, no TabMosaic cloud storage, invented tab-summary rejection, invented regroup tab-ID rejection, and Apply-gated regroup draft rendering.

Automated runtime coverage now verifies capped extraction from synthetic HTTP pages with a temporary fixture host grant because CDP page targets cannot accept the browser-native optional permission prompt. Next beta runtime/manual coverage for group/selected-tabs page context should include: accepting the native optional per-site permission prompt in Chrome, sensitive/restricted page skip or extra confirmation, partial answer when some pages are unreadable, and no persistence of multi-tab text or summaries to local storage, diagnostics, feedback templates, or cloud paths.

The optional DeepSeek Agent-flow runtime check opens a temporary Chrome profile with synthetic URLs, enables DeepSeek only inside temporary extension storage, submits an open-ended tab-management question through the real Sidebar composer, verifies that the metadata-only Agent answer renders as a plain assistant message card without relevant tab rows or action chips, then submits a follow-up question (`Why those tabs?`) to verify short-term conversation context. It verifies the card does not show a separate privacy footnote, separate suggested-next-steps block, full URLs, page-text fields, fixture token text, or internal window/tab/group IDs. It then asks DeepSeek to move Chrome extension docs tabs into `Extension Planning`, verifies a validated Apply/Cancel draft renders with matched tab rows even if the provider returns incomplete/no draft content and the local metadata verifier recovers it, clicks Apply, and verifies the real native Chrome tab group updates without closing tabs. It does not read the user's real Chrome profile, real browser tabs, page text, page summaries, or full URLs, and AI answers do not apply browser actions automatically without user Apply.

The optional real-AI content-regroup screenshot check opens a temporary Chrome profile, loads local synthetic HTTP pages through a temporary fixture host permission, enables DeepSeek only in temporary extension storage, submits `Regroup these selected tabs by actual page content` through the real Sidebar composer, verifies that capped visible text was read for 3/3 fixture tabs, verifies the model produced a DeepSeek-backed Apply/Cancel regroup preview rather than local fallback, and writes `artifacts/real-ai-classification/content-regroup-sidepanel.png`. It does not read the user's real Chrome profile, real tabs, real page bodies, full URLs, or browser history.

The optional large-tab runtime probe opens a temporary Chrome profile with synthetic URLs only and verifies the real native tab group path against 96 tabs by default. It checks organize completion, moved tabs, safe duplicate closes, review duplicate groups, expected group titles, bounded runtime, and sanitized run snapshots. It does not read the user's real Chrome profile, real browser tabs, or `.env.local`.

The manual QA profile launcher opens a disposable browser only when run without `--dry-run`; dry-run validates browser discovery, profile paths, extension path, real-profile QA template path, local context fixture URLs, and synthetic tab count without opening Chrome. Self-test opens the disposable browser, verifies setup, opens a local checklist page, opens local `tabmosaic-manual.test` fixture pages with stable visible-text markers, verifies local checklist report controls, verifies the Context Fixture Guide and copyable selected-tabs prompt, verifies the checklist includes Tab Agent chat UI, AI connection plus DeepSeek Agent move-draft checks, selected-tabs page-context permission approval/denial checks, sensitive-summary, Dashboard, Duplicate Center, safe error-state checks, and the blank real-profile QA template copy control, then closes and removes the temporary profile automatically. `--keep-fixture-server` keeps the local fixture server alive until Ctrl+C for fixture link/refresh QA, without reading the user's real Chrome profile.

Optional UI screenshot capture:

```bash
node tools/capture_ui_screenshots.js
node tools/build_store_screenshots.js
node tools/preflight.js --screenshots
```

Expected:

```text
- renders sidebar completed state with English mock data
- does not render mixed-language UI screenshots in the MVP
- renders the less-is-more dashboard overview with mock Smart Groups data
- renders the less-is-more dashboard mobile overview with mock Smart Groups data
- verifies the default dashboard hides Work Queue / Collections, Project Space navigation, and group filter chips
- renders the Dashboard Continue strip only when local work signals exist, with no page text/history/provider/search access
- renders side panel result/chat states plus Dashboard desktop/mobile with mock extension data
- generates five 1280x800 Chrome Web Store screenshot drafts from mock UI screenshots
- does not read real browser tabs
- does not read .env.local
- writes screenshots only to ignored local artifacts/ui-screenshots/
- writes store screenshot drafts only to ignored local artifacts/store-screenshots/
- marks store screenshot drafts DO NOT SUBMIT YET until user approval
- mock screenshots are regression fixtures only; do not use them as acceptance proof of AI classification or Agent answer quality
```

Package check:

```bash
node tools/generate_extension_assets.js
node tools/package_extension.js
node tools/verify_release_package.js
unzip -l dist/tabmosaic-ai-extension-v0.1.0.zip
```

Expected:

```text
- manifest.json is at the zip root
- icons/icon16.png, icon32.png, icon48.png, icon128.png exist
- i18n.js and diagnostics.js exist
- _locales/en/messages.json and _locales/zh_CN/messages.json exist, but visible extension pages force English copy for the MVP
- action.default_popup is absent
- background listens to `chrome.action.onClicked`
- extension icon click opens Sidebar Agent directly and sets current-tab context
- dist/tabmosaic-ai-extension-v0.1.0.sha256 exists
- dist/tabmosaic-ai-extension-v0.1.0.package.json exists and states env files are excluded
- release package verifier passes for the current manifest version
- release package verifier rejects `.env*`, source maps, `node_modules`, `.DS_Store`, `__MACOSX`, and `.git` metadata
```

GitHub Actions CI:

```text
.github/workflows/ci.yml
```

Coverage:

```text
- no unexpected tracked env files
- tracked secret scan
- JavaScript syntax checks
- extension smoke test
- issue form smoke test
- extension package generation
- release package verification, including forbidden-entry exclusion, checksum, package manifest, and required zip entries
- repeated package generation should keep checksum stable when extension source is unchanged
- package artifact upload
```

DeepSeek provider smoke is intentionally local-only because it requires a secret API key.

Optional Chrome runtime smoke test:

```bash
node tools/chrome_runtime_smoke_test.js
node tools/open_manual_qa_profile.js --dry-run
node tools/open_manual_qa_profile.js --self-test
```

Expected outcomes:

```text
PASS: Chrome/Chromium allowed CLI unpacked extension loading and the script verified organize, safe duplicate close, Restore Closed, Chat Refine, Dashboard Apply, same-window tab move, drag/drop tab assignment, tab focus, Duplicate Center focus, Dashboard Undo/Restore, and Sidebar composer direct commands against real native tab groups.
SKIP: The local Google Chrome build does not allow CLI unpacked extension loading. Use Chrome for Testing/Chromium for automated runtime QA, or run manual Load unpacked QA.
FAIL: Runtime behavior regressed.
```

### URL Canonicalization

- exact URL。
- trailing slash。
- tracking params。
- hash。
- query。
- invalid URL。
- chrome:// / extension:// / file://。

### Duplicate Detector

- exact duplicates。
- tracking-param duplicates。
- hash different 不自动关闭。
- query different 不自动关闭。
- active/pinned/audible 保护。
- review candidate Keep All。
- review candidate 手动确认后关闭单个 tab。
- review candidate 关闭失败时清理临时 restore snapshot。

### Rules Engine

- user rule 优先。
- learned rule 优先于 built-in。
- disabled rule 不生效。
- hit count 更新。
- Chat Refine 创建规则。
- Dashboard Enable/Disable/Delete 规则；Delete 必须二次确认。

### AI Output Validator

- tabId 不存在。
- tabId 重复。
- group 空名。
- color 不合法。
- confidence 缺失。

## 2. 集成测试

### One-click Organize

```text
准备 50 个 mock tabs
→ 点击 action
→ 检查 group plan
→ 检查 close actions
→ 检查 sidebar result
```

### Undo

```text
整理前 snapshot
→ apply plan
→ undo
→ tabs/group 状态尽量恢复
```

### Duplicate Review

```text
hash/query/same-page candidates
→ sidebar Duplicate Candidates 显示候选 tabs
→ protected tabs Close disabled
→ Keep All 标记 kept
→ Close 单个非保护 tab 前弹确认
→ confirmed close 写入 Restore Closed
→ Restore Closed 可重新打开 manually closed review tab
```

### Current Tab Summary

```text
用户触发 summary
→ 敏感页先确认
→ 注入 content extractor
→ 返回 visible text
→ DeepSeek Page Agent receives current-tab visible text only when configured
→ no full URL/query/hash/cloud storage in payload
→ no configured AI returns a provider-configuration prompt before page body extraction
→ invalid/failed AI returns an explicit provider-error answer rather than a local answer that looks like AI
→ UI 展示
```

### Group / Selected Tabs Page Chat

```text
用户针对 current group / selected tabs 提问
→ Sidebar 显示 tool card（工具、范围、最多 6 tabs、visible text、session-only）
→ batch extractor 最多读取 6 个 tabs 的 visible text
→ 敏感/受限/不可读页面跳过或额外确认
→ DeepSeek multi-tab Agent 使用 capped visible text 回答
→ follow-up 可复用本次会话上下文
→ 不写入 chrome.storage.local / IndexedDB / diagnostics / feedback / cloud
```

### Content-Assisted Regrouping

```text
用户要求用页面内容重新整理 group / selected tabs
→ Sidebar 显示 tool card 并读取 capped visible text
→ Agent 生成新分组 preview
→ 用户点击 Apply 前不改变 native Chrome groups
→ Apply 后创建/更新 native Chrome groups 并保留 Undo
→ 不关闭任何 tabs
```

### Chat Refine

```text
用户输入 GitHub PR to Code Review
→ sidebar 显示 preview
→ 不读取页面正文
→ 不调用 AI
→ 用户点 Apply
→ 创建本地 url_pattern rule
→ 当前匹配 GitHub PR tabs 移入 Code Review native group
→ Undo 可恢复 group 状态
→ 下次 organize user rule 优先命中
```

```text
用户输入 current tab to Reading
→ 仅当前 active tab 进入 preview
→ Apply 后移动当前 tab
→ 不创建长期规则
```

```text
用户输入 rename Misc to Reading
→ 匹配已有 native group
→ Apply 后重命名 group
→ Undo 可恢复
```

### Dashboard Apply

```text
用户打开 Dashboard
→ 修改 Smart Group title/color
→ 点击该 group 的 Apply
→ background 保存 UndoSnapshot
→ chrome.tabGroups.update 更新真实 native group
→ Dashboard refresh 显示最新 title/color
→ Sidebar 收到 RUN_UPDATED
→ Undo 可恢复原 group title/color
```

Safety:

```text
Dashboard apply supports title/color edits, same-window moves into existing groups, and same-window drag/drop tab assignment.
Dashboard apply 不跨窗口移动 tabs。
Dashboard apply 不关闭 tabs。
Dashboard apply 不读取页面正文。
```

### AI Provider Connection Test

```text
用户打开 hidden private-beta Settings
→ 填写 DeepSeek 或自定义 OpenAI-compatible base URL、model、API key
→ 如果是非默认 host，Chrome 弹出 provider-origin permission prompt
→ 点击 Test AI Connection
→ background 优先调用配置 provider 的 model-list endpoint
→ 如果 provider 没有标准 model-list endpoint，则调用固定 synthetic chat ping
→ UI 显示 connection works / model missing / failed
```

Safety:

```text
不发送 tab title。
不发送 hostname/path/full URL。
不发送页面正文。
不移动/关闭 tabs。
不写入远程日志。
非默认 provider host 必须显式授权；remote HTTP provider 被拒绝，HTTP 只允许 localhost local model endpoint。
```

### AI Key Deletion

```text
用户打开 hidden private-beta Settings
→ 点击 Clear AI Key
→ browser confirm 出现
→ 确认后删除本地 API key 并停用 AI classification
→ 保留 local rules、最近整理结果、Undo/Restore snapshot、chat draft、diagnostics、安全审计和 first-run privacy acceptance
→ 不调用 AI provider
→ 不关闭 tabs
→ 不移动 tabs
```

### Local Data Deletion

```text
用户打开 hidden private-beta Settings
→ 点击 Clear Local Data
→ browser confirm 出现
→ 确认后删除本地 rules、AI key/settings、最近整理结果、Undo/Restore snapshot、chat draft、first-run privacy acceptance
→ 不关闭 tabs
→ 不移动 tabs
→ 下次 organize 重新显示 first-run privacy onboarding
```

### Safe Error States

```text
organize run 失败
→ Sidebar 显示错误消息
→ Sidebar 明确说明没有移动或关闭标签页
→ Dashboard 打开后显示 compact error card
→ Dashboard 明确说明没有移动或关闭标签页
→ 用户能看到重试或复制脱敏诊断的下一步
```

Safety:

```text
不关闭 tabs。
不移动 tabs。
不读取页面正文。
不调用 AI provider。
不上传诊断数据。
不新增权限。
```

## 3. E2E 测试

使用真实 Chrome profile：

- Runbook：`05_PROJECT/06_QA_RUNBOOK.md`。
- Seed tabs：

```bash
node tools/qa_seed_tabs.js
node tools/qa_seed_tabs.js --open
```

- 20 tabs 整理。
- 80 tabs 整理。
- 多窗口。
- 已有用户 groups。
- pinned tabs。
- audible tab。
- Google Docs。
- GitHub PR/issue。
- Chrome docs。
- YouTube。
- 内部页面 chrome://。

## 4. 隐私测试

- 确认默认不读取页面正文。
- 确认 summary 才触发 content extraction。
- 确认 password/form 不被提取。
- 确认敏感域名二次确认。
- 确认 database/connection/Supabase 等设置页 summary 前二次确认。
- 确认 Page Agent payload 只在用户触发后发送当前页 visible text，且不包含 full URL、query/hash、连接串、API key、cookie、form values、hidden DOM、browser history、workspace memory 或多 tab 正文。
- 确认 Page Agent 最多发送 10 轮本地 page-chat Q/A history，不保存页面正文或云端记忆。
- 确认 selected page-region flow 只有用户在 Sidebar 发起并点击页面区域后才读取该元素的可见文本/结构；截图只在用户点击区域后临时 capture visible tab、内存裁剪为选区、丢弃完整可视页截图；Page Agent 只收到裁剪截图元信息，不收到图片 bytes/data URL；不保存、不读取 unrelated DOM。
- 确认 Sidebar Browser Work Search 只搜索 latest run tab/group metadata、本地 Work Queue、saved memos、Collections、saved workspaces、tab states 和 duplicate review metadata；不读取 page text、full URLs、Chrome history/bookmarks、screenshots 或 web search provider。
- 确认 Sidebar Work Brief / Continue answer 和 Dashboard Continue strip 只使用 workspace goal、latest run、本地 Work Queue、saved memos、Collections、saved workspaces、tab states 和 duplicate review metadata；不读取 page text、full URLs、Chrome history/bookmarks、screenshots、AI provider 或 web search provider。
- 确认 Sidebar Workspace Chat 对 `summarize/show/review workspace` 只使用 latest run、本地 Work Queue、saved memos、Collections、saved workspaces、workspace goal、tab states 和 duplicate review metadata；不读取 page text、full URLs、Chrome history/bookmarks、screenshots、AI provider 或 web search provider。
- 确认 Save memo 只能由用户点击触发，保存的是 derived assistant answer Markdown、source/tags/provider/minimized linked-tab/source metadata，不保存 raw page text、full URL、query/hash、截图、history/bookmarks 或 cloud data。
- 确认真实 DeepSeek 10 轮 current-page synthetic fixture 平均分不低于 8.0、最低单轮不低于 7.0。
- 确认 10 轮 Sidebar UI 截图里最后一条消息不会被 composer 遮挡，且消息和输入框之间没有大空隙。
- 确认日志不包含 URL/page text。
- 确认 Clear AI Key 只删除本地 API key 并停用 AI，且保留 rules、最近结果、snapshots 和 privacy acceptance。
- 确认 Clear Local Data 删除本地 API key、rules、snapshots 和 privacy acceptance。
- 确认 Dashboard 权限解释列出的权限与 manifest 一致，且未暗示已申请不存在的权限。
- 确认 Beta Diagnostics 是用户触发、本地复制、不自动上传，且不包含敏感浏览内容或 API key。
- 确认 Beta Feedback Template 是用户触发、本地复制、不自动上传，且只包含手动填写项和脱敏诊断。
- 确认 Beta Feedback Template 要求人工标注 70/20/10/0 分类质量目标和误关情况。
- 确认本地错误日志只保存脱敏错误摘要，且不包含 URL、hostname、email、bearer token、API key、tab title 或 page text。
- 确认本地误关恢复安全审计只保存数量和白名单事件类型，且不包含 URL、hostname、duplicate label、tab title 或 page text。
- 确认 GitHub 私测 issue forms 要求提交前移除 API key、bearer token、cookie、full URL、tab title、page text、email、私有截图和私有 rule pattern。

## 5. 性能测试

| Tabs | 目标 |
|---|---|
| 20 | < 2s 本地整理反馈 |
| 50 | < 5s 完成或显示 AI 进度 |
| 100 | < 8s 完成或 fallback |

## 6. 回归测试

每次发布前测试：

- action click 是否触发。
- sidePanel 是否打开。
- tab groups 是否创建。
- duplicate close 是否安全。
- duplicate review 是否只手动关闭。
- chat refine preview/apply 是否安全。
- Sidebar Browser Work Search 是否能从本地 tabs/groups/todos/memos/collections/workspaces/tab states 找到结果，并只对 open tab 显示 Open。
- Sidebar Work Brief 是否能对 `what should I continue?` 给出本地 continue 建议，并只对 open tab 显示 Open。
- Sidebar Workspace Chat 是否能对 `summarize my workspace`、`show workspace todos`、`show saved sources`、`review workspace risks` 返回一条 Markdown assistant message，并只对 still-open tabs 显示 Open。
- Dashboard Continue strip 是否只在本地 work signals 存在时显示，并且只执行 Ask in Sidebar、focus open source tab、focus Later tab 或展开 Duplicate Center。
- Sidebar Save memo 是否能在保存后被 `find ...` 找到，并被 Clear Local Data 删除。
- user rules 是否优先于 AI/built-in。
- undo 是否有效。
- dashboard title/color apply 是否同步浏览器。
- Clear AI Key 是否只清本地 API key 且不移动/关闭 tabs。
- Clear Local Data 是否只清本地数据且不移动/关闭 tabs。
