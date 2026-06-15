# 功能规格：和 Tab / Tabs / Group 聊天

## 1. 目标

让用户可以在 sidebar 或 dashboard 中和浏览器上下文聊天，包括当前页面、选中的多个 tabs、某个 group、当前窗口、当前浏览器所有普通窗口或历史 workspace。

Context depth model and Agent tool list are specified in `02_FEATURE_SPECS/12_AGENTIC_CLASSIFICATION_AND_CONTEXT_TOOLS.md`. That spec separates metadata-only answers from confirmed multi-tab visible-text reading.

## 2. Chat Scope Selector

Current beta behavior: the active scope is shown as a compact top row inside the bottom composer surface, with the text input below it. This keeps the scope visible without making the tab label feel like part of the user's typed prompt.

```text
Current tab · Supabase
Ask TabMosaic...

Selected tabs · 3 tabs
Ask TabMosaic...
```

Future candidate: clicking the chip can open a scope menu for Current Tab, Selected Tabs, Current Group, Current Window, All Windows, and Workspace. Do not ship the broader scope switcher until the corresponding data and privacy behavior is implemented.

## 3. Scope 定义

| Scope | P0/P1 | 说明 |
|---|---|---|
| Current Tab | P0 | 当前激活页面 |
| Selected Text | P1 / current beta buildable | 用户主动从当前页面选中文本后，仅用高亮文本作为本轮上下文 |
| Selected Tabs | P1 / current beta buildable | 用户在 sidebar/dashboard 勾选多个 tabs；用户发起后可读取最多 6 个 tabs 的可见文本 |
| Current Group | P1 / current beta buildable | 当前 Chrome group 或 dashboard group；用户发起后可读取最多 6 个 tabs 的可见文本 |
| Page Region | P1 candidate | 用户主动框选/点选当前网页里的一个可见区域，仅用该区域作为本轮上下文 |
| Pasted Link | P1 / current beta buildable | 用户粘贴 URL 后可先保存/建 todo；只有点击 Fetch link 并批准站点权限后才读取链接页面正文 |
| Current Window | P1 | 当前窗口所有 tabs |
| All Windows | P1/Pro | 当前浏览器所有普通窗口 tabs |
| Workspace | P1/Pro | 保存的历史工作区 |

## 4. Current Tab Chat

用户可以问：

```text
这个页面讲了什么？
总结这个页面。
这个 GitHub 项目有什么功能？
这个文档和我做 Chrome 插件有什么关系？
提取 API 使用方法。
这个页面应该放到哪个 group？
这个页面值得保留吗？
```

输出：

```text
摘要
关键点
建议分组
建议操作：keep / close / read later
相关 tabs
```

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION:
- Current tab summary / question path is user-triggered.
- Current-page chat UX follows a Notion AI sidebar reference: current tab context is visible inside the composer, page answers appear as normal assistant bubbles, and the user should feel they are asking beside the page rather than opening a separate report panel.
- Current-page chat supports short local multi-turn follow-up for the same tab. After a page answer, natural follow-ups should re-enter current-page Q&A unless they clearly ask for tab-management state or actions.
- Natural questions such as `what is this page for?` and `这个页面是干嘛的？` route to the current-tab question path instead of the metadata-only Agent fallback.
- Natural current-page content questions such as `当前页面有什么内容`, `当前页面包含什么`, and `what content does this page have` route to current-tab chat instead of the metadata-only Agent fallback.
- Sensitive-looking pages ask for confirmation before visible text is read.
- Page answers render inside the Sidebar message flow.
- Follow-up routing stores only local in-memory current-tab context and visible chat answer text; it does not store page body text, full URLs, or cloud memory.
- Current-page loading states are transient and should be replaced by the final answer; they must not remain as separate chat messages.
- Chrome internal / restricted pages should produce one natural unreadable-page reply, not multiple technical status messages.
- Unreadable-page replies should explain the likely reason: browser/extension page, missing temporary site permission, protected page, or no readable visible text.
- DeepSeek Page Agent answers current-tab page questions from current visible page text after the user explicitly asks from the Sidebar composer.
- DeepSeek Page Agent answers selected-text questions from user-highlighted text only after the user explicitly chooses `Selected text` from the Sidebar composer picker. This flow does not include full-page visible text, description, headings, full URL, query/hash, hidden DOM, or cloud storage. If no text is highlighted, it asks the user to select text first.
- Selected-text rewrite/polish prompts and the `Rewrite selection` template reuse the same highlighted-text-only boundary with `workflow: contextual_writing`, then render one copy-only draft with `Copy draft` and `Save memo`. The extension does not insert the rewritten text into the page or submit anything.
- Page Agent input includes current-tab title, hostname, visible text, selected text, headings, description, and up to 10 local page-chat Q/A turns for follow-up resolution. It does not include full URL, query/hash, cookies, form values, hidden DOM, browser history, workspace memory, or TabMosaic cloud storage.
- Common work pages include generic site-skill hints so Page Agent knows whether to read visible text as a code-review surface, issue triage surface, CI/checks surface, cloud console, project issue, design file, or collaborative document. The hints do not include owner/repo names, object paths, issue keys, run numbers, design/document IDs, full URL, query/hash, hidden DOM, or extra page content.
- Obvious token-like strings, API keys, and connection strings are redacted best-effort before Page Agent upload.
- Current-page routing should keep natural follow-ups in page-chat mode after the first page answer, including `what are...`, `is...`, `could this page...`, `summarize the action plan...`, and `final decision...`, unless the user clearly asks for tab-management state or actions.
- If no AI provider is configured, current-tab page chat returns a clear provider-configuration prompt and does not read page body content.
- If the configured AI provider fails or returns invalid JSON, current-tab page chat returns an explicit AI-error answer instead of pretending a local extractive summary is an AI answer.
- Real temporary-profile QA has verified a 4-turn current-page DeepSeek conversation on `https://www.hao123.com/`, with each turn staying in `current_tab` Page Agent scope and using the local `.env.local` DeepSeek config only when the tester passes `--ai`.
- DeepSeek metadata Agent answers open-ended tab-management questions from minimized tab metadata only.
- DeepSeek open-ended answers render as plain assistant bubbles; they should not append separate tab cards, `Open tab`, `Groups`, `Open Dashboard`, or suggested action UI.
- DeepSeek metadata Agent explicit move/group/regroup requests must end in a validated Apply / Cancel preview when a safe target can be verified. If the model returns incomplete/no draft content, the extension may recover with a local verified `move_tabs` preview using the same minimized tab metadata already collected for the Agent request. This recovery path must disclose that browser changes require Apply, must not close tabs, must not read page body, and must not send full URLs.
- The metadata Agent path still does not receive page body text or page summaries.
- Pasted-link Q&A first slice is explicit and user-triggered: the Sidebar detects pasted URLs without opening/fetching them, then `Fetch link` asks Chrome for that link origin, fetches readable text with credentials omitted, and sends a fetched-link Page Agent payload when AI is configured. The payload and session result exclude full URL, query/hash, cookies, hidden DOM, forms, browser history, and cloud storage.

DO NOT BUILD YET WITHOUT CONFIRMATION:
- Automatic/background page-body upload without a user current-page request.
- Cloud storage of page summaries, page-chat history, or workspace memory.
```

CONFIRMED BY USER FOR NEXT BETA SLICE:

```text
- Current-group and selected-tabs Q&A may read visible text by default after the user initiates that scoped question.
- The Sidebar must show a compact inline tool state before multi-tab extraction, for example `Read group pages` or `Read selected tabs`.
- Private beta reads at most 6 tabs per batch.
- Sensitive, internal, restricted, or unreadable pages are skipped or require extra confirmation.
- Extracted multi-tab context is session-only and must not be persisted.
- Content-assisted regrouping is allowed only after user request and must return an Apply / Cancel preview before native groups change.
```

CONFIRMED BY IMPLEMENTATION / FIRST SLICE:

```text
- Sidebar routes current-group and selected-tabs deep questions to a concrete background context-tabs Agent flow.
- The Sidebar shows a compact inline assistant tool state before multi-tab visible-text extraction.
- Selected-tabs questions should show `Read selected tabs` from the running tool-card state; current-group questions should show `Read group pages`.
- The first slice reads at most 6 tabs, skips protected/restricted/sensitive/empty/unreadable tabs, and updates the tool card with read/skipped counts.
- Missing temporary site access is reported separately from restricted/unreadable pages as `missing_permission`, so users can understand when Chrome site access was not granted.
- Missing temporary site access also appears in the compact tool-card skipped reason labels and summary next steps, with a concrete retry path to approve Chrome site access and ask again.
- If no selected/group page can be read because Chrome site access was denied or missing, the answer should explain this in plain assistant language, preserve the privacy boundary, and answer from titles/hostnames only instead of sounding like a technical extraction failure.
- DeepSeek multi-tab Page Agent can answer from capped visible text, titles, hostnames, headings, selected text, skipped reasons, and skipped reason breakdown counts.
- Multi-tab Page Agent payload excludes full URLs, query strings, hashes, cookies, hidden DOM, browser history, saved workspace contents, persistent summaries, and TabMosaic cloud storage.
- AI tab summaries are validated against real readable tab IDs before rendering.
- Compare Selected Tabs is implemented as a selected-tabs/current-group workflow: template or natural-language compare prompts return a recommendation, Markdown comparison table, tradeoffs, missing information, and source notes. AI comparison rows are validated against real readable tab IDs before rendering. Explicit follow-up buttons can create a local Work Queue todo or research missing info through the internal search tool; the workflow still does not save memos, mutate tabs/pages, or act automatically.
- Research Brief is implemented as a selected-tabs/current-group workflow: template or natural-language research brief prompts return findings, contradictions, gaps, next steps, and source notes. The result is rendered as a normal Markdown assistant message with source chips and explicit Create todo / Research missing info follow-ups. It does not claim web search unless the user clicks the follow-up search action, and it does not save memos or store page text.
- Contextual Writing is implemented for selected-tabs/current-group first slice: the `Draft from tabs` template or natural writing prompts such as project update/email/memo draft route through `workflow: contextual_writing`, use the same capped visible-text tool-card flow, and return a normal Markdown assistant message with `Copy draft`, `Save memo`, and `Run log`. It never reads unselected tabs, inserts text, submits forms, sends messages/email, mutates pages, moves/closes tabs, or creates cloud memory.
- Group/selected-tabs answers lead with normal assistant prose, then render compact session-only supporting metadata: scope label, visible-text/metadata source, read/skipped counts, skipped reason chips, top hosts/themes, and safe next steps.
- If every selected/group tab is skipped or unreadable, the answer falls back to metadata only, explicitly says no page body was read/sent/stored, and gives retry guidance for selecting normal readable work pages.
- Group/selected-tabs chat supports session-only follow-up routing for the same active scope. Natural follow-ups such as `Which one should I review first?` re-enter the context-tabs Agent flow and include up to 10 local Q/A turns for reference resolution.
- Content-assisted regrouping can generate Apply / Cancel previews from capped visible text. The preview validates AI tab IDs against real readable tabs, renders as an assistant message card, and does not change native Chrome groups until Apply.
- Dashboard tab rows now support selecting multiple tabs in the same window and opening Sidebar with a `selected_tabs` context.
- The Dashboard selected-tabs entry only writes minimized selected tab IDs/count/metadata into local Sidebar context; it does not read page text or call AI until the user asks from the Sidebar composer.
- Cross-window selected-tabs chat remains separated in the first slice; selecting a tab from another Chrome window resets the previous selected set and shows a compact Dashboard status chip.
- The metadata Agent payload preserves `selected_tabs` as the active scope so open-ended follow-ups can understand that the user is referring to the selected set.
- Real Chrome runtime smoke verifies the selected-tabs tool-card path and selected-tabs follow-up routing in a temporary synthetic profile.
- Local smoke verifies GitHub PR and common work-page site-skill payloads, including that owner/repo path, PR/issue/run IDs, design/document IDs, query token, hash, and full URL are excluded.
```

Still pending:

```text
- Runtime/manual QA for accepted native optional per-site permission prompts and successful extraction after permission grant.
- Real-profile QA for the Dashboard selected-tabs entry, including same-window selection behavior and unreadable/sensitive page edge cases.
```

P1 CANDIDATE / FIRST SLICE IMPLEMENTED:

```text
- Page Region Context: user-triggered element picker for selecting one visible page block as chat context.
- Implemented first slice: Sidebar commands such as `select region`, `ask region: ...`, or `选择页面区域` open a page-local picker.
- Implemented first slice reads visible text, headings, safe link labels, list items, bounded table headers/rows, ARIA role/label, and the selected element label.
- Implemented crop-metadata first slice: after the user clicks a region, TabMosaic may transiently capture the current visible tab, crop it in memory to the selected region, discard the full visible-tab capture, and keep only cropped screenshot metadata for the text-only Page Agent.
- It should not read hidden inputs, password/form values, cookies, storage, scripts/styles, raw full HTML, or unrelated DOM.
- Selected-region context should be session-only and rendered with a compact tool card before use.
- Screenshot image bytes are not sent to the text-only Page Agent, stored, added to chat history, diagnostics, feedback templates, or workspace memory.
- Real temporary-profile QA has verified the selected page-region flow on `https://www.hao123.com/`: Sidebar command opens the page-local picker, automation clicks a visible block, the tool card renders `Select page region`, and DeepSeek answers from that selected block context.
- Not implemented yet: vision-model screenshot upload, complex SaaS table QA, and richer visual understanding.
- Not implemented yet: final smooth UI for region selection. Current beta still uses typed commands such as `select region: ...`; the intended product direction is a lightweight context picker / button, not a command users must memorize.
- Any future cropped screenshot image-byte upload must be user-triggered, region-only, session-only by default, provider-capability-gated, and separately confirmed.
```

## 5. Selected Tabs Chat

用户可以问：

```text
总结这 8 个页面的区别。
这些竞品有什么共同功能？
哪些 tabs 可以关闭？
把这些内容整理成 PRD。
做一个对比表。
```

输出：

- 对比表。
- 每个 tab 摘要。
- 共同主题。
- 建议保留/关闭/归档。
- 建议分组。

Current first-slice UX:

```text
Dashboard Smart Groups
→ user selects two or more tab rows in the same window
→ `Chat selected` appears
→ click opens Sidebar with context = Selected tabs
→ composer chip shows Selected tabs + count
→ user asks a question
→ Sidebar shows a lightweight inline tool state before reading up to 6 visible pages
→ answer renders as a normal assistant message first, with compact metadata after the answer
```

Safety:

```text
- Selecting tabs in Dashboard is metadata-only and local.
- Cross-window selected-tabs chat is not mixed in the first slice; selecting a tab from another window resets the previous selection and explains the reset with a compact Dashboard notice.
- Page text is read only after the user asks from Sidebar and the per-site permission flow allows it.
- If no selected page can be safely read, the Sidebar still answers from metadata and should not imply that page text was read.
- Selected-tabs context and extracted text are session-only and not stored as workspace memory.
```

## 6. Group Chat

用户可以问：

```text
这个 group 主要在讲什么？
把这个 group 再细分。
这个 group 里哪些页面重复？
把这个 group 总结成研究 memo。
```

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Group summary metadata is rendered after the normal assistant prose inside the same message card after a user-triggered current-group / selected-tabs question.
- The summary is session-only and includes label, source, read/skipped counts, top hosts/themes, and safe next steps.
- If readable visible text is unavailable, the summary falls back to minimized tab metadata.
- The summary is not saved to Tab Knowledge, workspace memory, cloud storage, diagnostics, or feedback templates.
```

## 7. Workspace Chat

First local slice implemented:

```text
Sidebar prompt
→ user asks `summarize my workspace`, `show workspace todos`, `show saved sources`, or `review workspace risks`
→ Sidebar answers as one normal Markdown assistant message
→ answer uses only local workspace state:
   - latest extension-created tab/group snapshot
   - saved workspace goal
   - local Work Queue
   - saved memos
   - saved collections
   - saved workspace snapshots
   - local Done/Later/Keep tab states
   - duplicate-review metadata
→ optional Open rows can focus still-open tabs only
```

Safety:

```text
- Does not read live page text.
- Does not send data to AI/search providers.
- Does not read full URLs, Chrome history, bookmarks, cookies, form values, screenshots, hidden DOM, or cloud memory.
- Does not move, close, restore, reopen, upload, summarize, or mutate tabs/pages.
- Full historical workspace chat, full restore, cloud sync, embeddings, and cross-device memory remain future / confirmation-gated work.
```

Future Pro ability:

```text
我昨天的 AI tab manager research 里，哪些项目支持自动去重？
把上周的竞品研究总结成一页 memo。
恢复我写 PRD 时打开的工作区。
```

## 8. 数据读取策略

| 场景 | 默认读取 | 是否需要确认 |
|---|---|---|
| Current tab metadata | title/url/hostname | 不需要 |
| Current tab content | 正文 | 首次需要 |
| Multiple tabs metadata | title/url/hostname | 不需要 |
| Multiple tabs content | 最多 6 个 tabs 的 visible text | 用户发起后默认允许；tool card 披露；敏感/受限页额外确认或跳过 |
| Workspace stored summaries | 已保存摘要 | 暂不做持久保存；当前只允许 session-only |

## 9. Agent 行为

Agent 回答不应只是聊天文本，还可以生成 actions：

```json
{
  "answer": "这些 tabs 主要是竞品研究。",
  "suggestedActions": [
    {"type": "CREATE_GROUP", "name": "Competitor Research", "tabIds": [1,2,3]},
    {"type": "CLOSE_TABS", "tabIds": [9], "requiresConfirmation": true}
  ]
}
```

## 10. 验收标准

```gherkin
Given 用户在 sidebar 选择 Current Tab
When 用户输入“总结这个页面”
Then 系统读取当前页面内容并返回摘要
And 建议分组和操作

Given 用户在 dashboard 勾选多个 tabs
When 用户输入“做对比表”
Then 系统先显示 tool card，说明将读取最多 6 个 tabs 的可见文本
And 系统生成多 tab 对比结果
And 不持久保存页面正文或摘要

Given 用户要求“用页面内容重新整理这个 group”
When Agent 读取 capped visible text 并生成新分组方案
Then Sidebar 显示 Apply / Cancel
And 用户点击 Apply 前不改变 Chrome 原生分组
```
