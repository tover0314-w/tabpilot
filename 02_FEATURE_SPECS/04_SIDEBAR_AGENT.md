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

P0 UI rule: The latest organize result should appear as one assistant chat message formatted as Markdown text. It should not render a separate metric wall, status card, folded refinement card, dashboard-like toolbar, or metric/action chips inside the result message.

P0 UI rule: The result message may mention commands such as `undo`, `restore closed`, or `organize again` as text. Do not turn the first result message into a specialized control surface.

CONFIRMED BY USER: Product-effect screenshots, classification examples, and Agent conversation examples shown for acceptance must use a real configured AI provider when `.env.local` / BYOK settings are available. Mock data is allowed only for deterministic regression tests and must be labeled as mock. Do not present mock screenshots as proof of AI quality.

P0 UI rule: Current-page chat should feel like Notion AI beside the page: the composer context says which tab is being discussed, the user asks in natural language, and the assistant answers in a plain message bubble from the page context. The page-chat surface should not be dominated by tab-management controls.

P0 UI rule: The active context should be visible inside the bottom composer surface as a compact top row, with the text input and send button below it. It should not behave as an inline prefix inside the text field, and it should not become a separate detached status strip. Examples: `Current tab · Supabase Database`, `Selected tabs · 3 tabs`, `Group · Chrome Extension Docs`.

P0 UI rule: Current-tab context should use a short source label in the composer, such as `Supabase`, `GitHub`, or `Chrome Docs`, instead of rendering the full browser title like `Settings | Database | ai-music | Supabase`. Full titles can remain in tooltips or diagnostics, but the visible composer context must not look like multiple tabs.

P0 UI rule: Current-page chat supports short local multi-turn follow-up. After the user asks about the current page, natural follow-ups such as `what should I check next?` or `那备份呢？` should continue in current-page mode for the same tab, while explicit tab-management questions such as `show groups`, `restore`, `find github`, or `what did you close` still use the tab-management Agent.

P0 UI rule: Dashboard entry is a small top-right icon button. The old header refresh button and visible `Tab Agent` title are removed from the default sidebar chrome.

P0 UI rule: When there is no organize run yet, the first visible guidance appears as one assistant welcome message in the conversation thread. It should offer Smart Organize, current-page chat, AI setup, and Dashboard as compact actions, and it must not render a separate welcome/status panel outside the chat flow.

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

### D2. Prompt / Skill Templates

CONFIRMED BY USER: Prompt / Skill Templates are needed.

Templates are curated Agent workflows that help users start useful actions without memorizing commands.

Initial templates:

```text
Cleanup: Smart Organize, Find Duplicates, Save Later, Protect Tabs
Page: Explain Page, Summarize Page, Extract Checklist, Find Risks
Research: Compare Selected Tabs, Decision Brief, Research Brief
Writing: Rewrite Selection, Draft Update, Draft Reply
Review: Review PR, Explain Issue, Review Settings Page, Launch QA Checklist
Translation: Translate Selection, Explain Simply, Bilingual Summary, Glossary
```

UI rules:

- Show templates as compact suggestions in the composer/context picker or as assistant follow-up chips.
- Do not create a separate template-heavy Dashboard page in MVP.
- Each template declares required context, tools, data boundary, output format, and blocked actions.
- Templates may draft text, todos, memos, or action plans; browser-changing actions still require Apply / Cancel.
- No dynamic third-party skill execution in MVP.

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Sidebar composer `+` opens a compact context / skill picker instead of directly starting page-region selection.
- Typing `@` in the composer opens the same picker in context-selection mode; choosing an entry inserts a natural prompt and does not read page content or call AI until the user submits.
- First picker entries are wired only to existing real flows: Current page, Selected text, Page region, Selected tabs / group, Search web, Decision brief, and Save as todo.
- The default current-tab picker hides selected-tabs/group-only workflows until the active Sidebar context is selected-tabs or current-group.
- Current page calls the user-triggered visible-text Page Agent flow.
- Selected text calls a user-triggered highlighted-text Page Agent flow. If no text is selected on the active page, it returns a normal assistant message asking the user to select text first and does not fall back to full-page extraction.
- Page region calls the selected-region picker flow and keeps selected-region context session-only. Text-only models receive selected-region visible text, safe structure, and cropped screenshot metadata only; vision-capable models can also receive the cropped selected-region image as a session-only `image_url` payload after the user clicks the region. Screenshot bytes are not stored.
- Screenshot calls an explicit visible-screenshot vision flow. It captures only after user action, requires a vision-capable configured model, compresses the visible screenshot in memory, sends it session-only with title/hostname metadata, and stores no image bytes.
- Selected tabs / group and Decision brief call the capped context-tabs Agent flow only when the active Sidebar scope is selected-tabs or current-group.
- Search web calls the internal Agent Search Tool executor; it does not open a browser search tab unless the user later opens a returned source.
- Save as todo creates a local metadata-only Work Queue item from the active Sidebar context.
- Unified composer context chips now show typed extra context/tool intent inside the same composer row: pasted link, selected text, page region/Smart Fill, and Agent Search. The active scope remains the primary left-side context label, so selected-tabs/group counts are not repeated as separate chips.
- The composer picker now shows a compact local-only `Routing` hint derived from the typed draft and current Sidebar scope. It labels the likely route as tab metadata, current-page Page Agent, selected text, page region, selected-tabs/group, or Agent Search Tool, without switching providers or reading/calling/uploading anything before the user submits.
- Unwired candidate templates such as file upload, full screenshot upload, and dynamic third-party skills are not shown in this first slice.
```

### D3. Page Quick Rail

CONFIRMED BY USER: A Monica-like right-side quick-entry icon UI is acceptable if it stays minimal.

Purpose:

```text
Let the user quickly attach page context or open the Sidebar Agent from a normal webpage.
```

Default beta icons:

```text
Chat
Page
Region
Todo
```

Future candidates, behind More and only after the matching tool flow is real:

```text
Translate
Prompt templates
```

Rules:

- Maximum 4 visible icons by default; overflow goes behind More.
- Icon-only with tooltip; no large text panel.
- Clicking an icon opens Sidebar or attaches a context chip.
- Rendering the rail must not read page text, take screenshots, upload data, or change tabs.
- The actual read/search/save/action still happens through the Sidebar Agent tool flow.
- Hide on Chrome internal/restricted pages.
- User can hide/disable it.

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- `page_quick_rail.js` renders a minimal right-edge rail on ordinary http/https top-level pages only.
- The rail shows four visible actions: Chat, Current page, Page region, and Save/Todo.
- The content script does not read visible text, selected text, DOM content, screenshots, full URLs, cookies, page localStorage/sessionStorage, forms, or browser history.
- Its only storage write is an extension-local `tabmosaic.quickRailHidden` boolean when the user hides the rail.
- Clicking an action sends `RUN_QUICK_RAIL_ACTION` to the background service worker.
- Background opens Sidebar, sets current-tab metadata context, and may prefill a pending prompt such as `What is this page about?`, `select region`, or `turn this page into a todo`.
- The user must still send/confirm from Sidebar before any page reading, region selection, todo creation, or AI call happens.
- The rail can be hidden locally from the page via the small hover close control.
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
- Extra context/tool chips such as `Link` and `Search` render beside the active context inside the composer row. They are previews only and do not fetch links, read selected text, start page-region selection, or call search until the user submits/chooses the flow.
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
- 生成本地 Work Brief / Continue 建议。
- 保存 workspace。
- 打开 dashboard。

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Current-group and selected-tabs deep questions route to the background context-tabs Agent flow.
- The flow renders a tool card in the chat stream, reads at most 6 visible pages, skips unsafe/unreadable tabs, and answers from DeepSeek when local private-beta settings are available.
- Tool-card messages are not included in AI chat memory; final context answers are included as normal assistant turns.
- Session-only follow-up reuse is supported for the same group/selected-tabs scope.
- Context answers now render as natural Markdown-style assistant messages. Read/skipped counts and visible-text/session-only disclosure stay in the lightweight tool state, not in a second summary card.
- DeepSeek metadata Agent action requests now recover more gracefully when the model returns incomplete/no draft content: if the user explicitly asks to move/group/regroup tabs and the current safe tab metadata can verify matching real movable tabs plus a target group, Sidebar renders an Apply / Cancel `move_tabs` preview from local validation. This recovery path still follows the same Apply-gated move/Undo path, does not close tabs, does not read page text, does not send full URLs, and does not apply browser changes automatically.
- Compare Selected Tabs routes template and natural-language compare questions through the selected-tabs/current-group Page Agent workflow, returns a recommendation, compact Markdown comparison table, tradeoffs, missing information, and source chips, and rejects model rows that reference non-readable tabs. It exposes explicit `Save memo`, `Create todo`, and `Research missing info` follow-up buttons; Save memo stores only the derived assistant answer plus minimized linked-tab/source metadata.
- Research Brief routes template and natural-language research brief prompts through `workflow: research_brief`, reuses capped selected-tabs/current-group visible-text extraction, returns findings, contradictions, gaps, next steps, and source notes as one Markdown assistant message, and exposes `Save memo`, `Create todo`, and `Research missing info` follow-up buttons for selected-tabs/current-group briefs. `Research missing info` calls the internal Search Tool after user click, decomposes missing information into up to three focused query strings, and renders a session-only research addendum with provider summary, source signals, source citations, and a privacy boundary. Saved-source research prompts now route through `DRAFT_FROM_SAVED_SOURCES` with `workflow: research_brief`, use only explicit local saved memos/collections, and expose Save memo / Research missing info without tab-based todo in the first slice. Research Brief does not open/crawl source pages, use files/PDFs/screenshots, mutate pages, or create cloud memory in this slice.
- Decision Brief routes template and natural-language decision prompts through `workflow: decision_brief`, reuses capped selected-tabs/current-group visible-text extraction, returns one Markdown assistant message with recommendation, decision criteria, source tradeoff table, assumptions, missing information, source notes, and next steps. It exposes explicit `Save memo`, `Create todo`, and `Research missing info` follow-up buttons for selected-tabs/current-group briefs. `Research missing info` calls the internal Search Tool after user click, decomposes decision gaps into up to three focused query strings, and renders a session-only addendum with provider summary, source signals, source citations, and a privacy boundary. Saved-source decision prompts route through `DRAFT_FROM_SAVED_SOURCES` with `workflow: decision_brief`, use only explicit local saved memos/collections, and expose Save memo / Research missing info without tab-based todo in the first slice. Search-result decision prompts and the Search card `Brief` action now route through `DRAFT_FROM_SEARCH_RESULTS`, use only the current session's search-result titles, hostnames, sanitized paths, snippets, and source labels, then render the same Decision Brief Markdown message with Save memo / Research missing info. Visible-screenshot decision prompts route through `SUMMARIZE_VISIBLE_SCREENSHOT` with `workflow: decision_brief`, use only one explicit current visible screenshot plus tab title/hostname metadata, and render the same Markdown Decision Brief message with Save memo / Research missing info. Decision Brief does not use file/PDF uploads, hidden DOM, background crawl, page mutation, automatic result-page opening, or cloud memory in this slice; screenshot evidence is supported only through the explicit visible-screenshot vision workflow.
- Review Page routes the curated `Review page` template and natural current-page review/risk/next-step questions through `workflow: review_page`, reuses the existing current-page visible-text Page Agent flow, and returns one Markdown assistant message with page type, risks, open questions, review checklist, and safe next steps. It exposes explicit `Save memo` and `Create todo` follow-ups; Create todo stores a local Work Queue item from the derived review checklist. It does not submit forms, mutate pages, crawl in the background, upload full URLs, or create cloud memory in the first slice.
- Contextual Writing routes the curated `Draft response`, `Rewrite selection`, and `Draft from tabs` templates plus natural current-page draft/reply/comment/update prompts, selected-text rewrite/polish prompts, selected page-region draft/rewrite prompts, selected-tabs/current-group project update/email/memo draft prompts, and saved-source/memo/collection writing prompts through `workflow: contextual_writing`. It reuses the matching Agent boundary: current-page visible text, highlighted text only, one clicked page region only, capped selected-tabs/current-group visible text only, or explicit local saved memo/collection excerpts only. It returns one Markdown assistant message with copy-only draft text, purpose, audience, tone, copy notes, and source grounding. It exposes explicit `Copy draft`, `Save memo`, and `Run log` actions. Copy draft writes only the generated draft text to the clipboard after user click; it does not read unselected tabs, read live pages for saved-source writing, search the web, insert text, submit forms, post comments, send email/messages, approve/merge/deploy, mutate pages, move/close tabs, upload full URLs, upload screenshot bytes, or create cloud memory in this slice.
- Smart Fill Lite routes the curated `Smart Fill table` template and natural selected-region/table extraction prompts through `workflow: smart_fill_lite`, reuses the user-click selected page-region flow, and returns one Markdown assistant message with extracted rows, row classifications, row actions, Markdown table, CSV, and table notes. It exposes explicit `Copy table`, `Copy CSV`, `Create todo`, and `Save memo` actions. Create todo stores one local Work Queue checklist from row actions. It does not auto-fill forms, edit page tables, mutate pages, search/enrich rows, crawl in the background, upload full URLs, or create cloud memory in the first slice.
- Agent Safety Layer first slice adds an explicit `security` boundary to current-page, selected-text, selected-region, fetched-link, and selected-tabs/current-group Page Agent payloads. The boundary marks page text as untrusted source material, lists allowed tool permissions and blocked actions, detects prompt-injection-like page text, and blocks unsafe instruction-like model output before rendering. Tool cards now show compact `Allowed`, `Blocked`, and `Page text is untrusted` labels. No new permissions, automatic reads, automatic actions, analytics, or cloud storage were added.
- Agent Run Transcript first slice adds a compact `Run log` action under Page Agent / selected-tabs answers. When clicked, it renders one Markdown-style assistant message with the user request, context scope, provider label, tools used, skipped-page reasons, privacy flags, safety notes, browser-change status, and Undo/Restore state. The transcript is capped local-only storage under `tabmosaic.agentRunTranscripts`, redacts URLs/secrets best-effort, is excluded from follow-up AI context, and does not persist raw page text, full URLs, screenshot bytes, hidden DOM, browser history, or cloud data.
- AI Triage first slice appends a compact `Triage` section to the organize-complete assistant message. It uses only local run metadata: tab titles, hostnames, paths, group names, active/protected state, and duplicate-review state. It proposes `Workspace focus`, `Act now`, `Read later`, `Reference`, `Can close`, and `Needs review` as plain Markdown text. It exposes one explicit `Create todo` action and recognizes natural commands such as `make triage a todo`; this stores one local Work Queue item with at most 8 minimized linked-tab records and a checklist derived from the triage. It does not read page text, call the Page Agent, create todos automatically, close non-duplicates, move tabs, add new storage keys, or create cloud memory.
- Workspace Goal first slice adds an explicit `Set goal` action under organize-complete triage and chat commands such as `set goal: ...`, `my goal is ...`, `clear goal`, and `what is my goal`. It stores one local `tabmosaic.workspaceGoal` object with sanitized text, source, timestamps, and metadata-only flag. Work Brief prioritizes the saved goal and matches still-open tabs from local metadata only. Goal polish now lets the user turn the saved goal into one local Work Queue checklist via `make goal a todo`, highlights goal-linked todos/memos in Work Brief, names saved workspace snapshots from the local goal when available, and infers a likely goal from local todos/memos/collections/workspaces/Later tabs when no goal is saved. Inferred goals are suggestions only and are not saved unless the user explicitly says `set goal: ...`. It does not read page text, call AI/search, create cloud memory, or change browser tabs.
- Work Brief / Continue questions such as `what should I continue?` answer locally from latest run metadata, Work Queue todos, local memos, Collections, saved workspaces, tab states, and duplicate review; no page text, full URLs, history/bookmarks, AI provider, or web search is used.
- Content-assisted regrouping preview is supported from capped visible text and renders as a Markdown-style assistant message with Apply / Cancel below the text before native groups change. It should not render nested group cards.
- Explicit Search Tool requests render a lightweight Sidebar Agent tool state plus a natural assistant answer. Sources appear as a compact `Sources` attachment with user-clicked Open actions; query/provider/session-only boundaries stay in the tool state.
- Search Tool does not open a browser search page. It calls the internal `search_web_provider` tool; a browser tab opens only if the user clicks a returned source.
- If Search Tool is not configured or fails, Sidebar renders a normal assistant message with one `Open settings` action and compact redacted diagnostics: provider, origin, API-key status, result count, and error type. The settings path opens Dashboard Settings directly and keeps search out of the default Dashboard workbench. Diagnostics do not store the typed query, API key, source URLs, tab titles, page text, or result bodies.
- Sidebar can create a local Work Queue todo from the active chat context via natural-language commands such as `make this a todo` / `把当前标签变成待办`. It stores linked tab metadata locally only and renders the result as a normal Markdown assistant message.
- Sidebar Todo Agent polish now supports local Work Queue maintenance from chat: explicit task names during creation, `rename todo to ...`, named todo targeting such as `add checklist item to launch checklist todo: confirm copy`, checklist completion by ordinal/text, and current-context merge such as `add current context to launch checklist todo`. Commands default to the latest open local todo when no target is named, ask for clarification when multiple local todos match, render as plain Markdown assistant messages, and do not show Apply/Cancel because they only mutate local todo text/checklist/linked metadata. They do not read page text, call AI/search, upload data, move tabs, close tabs, or mutate pages.
- Sidebar Done / Later / Keep natural-language tab-state commands render as normal safe-command assistant messages with Apply / Cancel before writing local state. Apply stores only minimized tab metadata in `tabmosaic.tabWorkStates`; Later also creates a local Work Queue item. Keep / protect becomes a local `user` protection reason in future organize snapshots, so automatic grouping skips that tab and duplicate-close planning keeps it safe. No page text, full URL, screenshot, upload, close, or move occurs.
- Sidebar protected group/domain commands such as `protect this group` or `protect docs.google.com domain` render as the same safe-command assistant message with Apply / Cancel. Apply stores only a local `tabmosaic.userRules` protection rule, then future organize snapshots add `group` / `domain` protected reasons and skip matching tabs during automatic grouping and duplicate-close planning. It does not move, close, read, summarize, screenshot, upload, or mutate pages.
- Sidebar suggested-group commands such as `suggest group for this tab` render as the same safe-command assistant message with Apply / Cancel. The preview uses local title, hostname, path, current native groups, and latest organize metadata to suggest an existing or new task-based group; Apply moves only the current still-open tab through the existing move/Undo path. It does not run as a background listener, auto-move new tabs, read page text, send full URLs, use AI/search providers, upload data, close tabs, or request new permissions.
- Sidebar can turn the current page into a local checklist todo after a user-triggered current-page request. It reuses the Page Agent visible-text flow, asks sensitive-page confirmation when required, stores the generated checklist locally, and does not store full URLs or use cloud storage.
- Search Tool source rows support user-clicked `Open`, `Save`, and `Todo` actions. Save/Todo persist sanitized source metadata locally only.
- Pasted links are recognized as local link sources without opening or fetching the page. The user can save the source or turn it into a todo first.
- Pasted links now support an explicit `Fetch link` action. After the user clicks it and approves Chrome's optional origin permission for that site, the background worker fetches readable text with credentials omitted, routes the text through the existing Page Agent when a BYOK/provider config is usable, and renders one lightweight tool state plus one normal Markdown assistant message. The Page Agent payload includes title, hostname, path, readable text, description, and headings only; it excludes the full URL, query/hash, cookies, form values, hidden DOM, browser history, and cloud storage. The fetched-link result stays session-only unless the user later clicks Save or Todo, which stores only sanitized source metadata.
- Local Memo first slice lets the user click `Save memo` under a useful assistant answer. It writes `tabmosaic.savedMemos` locally with answer Markdown, source/workflow label, tags, provider label, `aiUsed`, minimized linked-tab metadata, and sanitized source metadata. It does not persist raw page text, full URLs, query/hash, screenshots, history/bookmarks, cookies, or cloud data. Saved memos are available to local Browser Work Search and Work Brief.

STILL PENDING:
- Real Chrome runtime QA for accepted optional per-site permission prompts and synthetic HTTP content extraction on this context-tabs path.
- Real Chrome runtime QA for accepted optional origin permission prompts on pasted-link fetch.
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

Memory relief action behavior:

```text
CONFIRMED BY IMPLEMENTATION / SAFE FIRST SLICE:
- Natural commands such as `reduce memory pressure`, `sleep inactive tabs`, or `collapse inactive groups` create an Apply / Cancel safe-command message.
- Preview uses local tab metadata only: title, hostname, path, active/pinned/audible/discarded/protected state, group state, and lastAccessed.
- Apply re-scans live tabs before action.
- Apply may call `chrome.tabs.discard` only for inactive ordinary http/https tabs that are not active, pinned, audible, protected, incognito, internal, or already suspended.
- Apply may collapse inactive native tab groups that do not contain active, audible, or protected tabs.
- Apply may mark likely read-later tabs as local `Later` state and create one local Work Queue item.
- It does not close non-duplicate tabs, read page text, upload data, call AI/search providers, mutate pages, or claim exact MB saved.

CONFIRM:
- Save-for-later then close non-duplicate tabs remains unbuilt until the user confirms the product policy for non-duplicate tab-closing behavior.
- Automatic/background memory relief remains unbuilt until separately confirmed.
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
Idle / no-run state starts with one assistant welcome message in the conversation thread, not a separate welcome card.
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
And 无整理结果时首屏引导是 assistant welcome message，而不是独立 welcome 面板
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
