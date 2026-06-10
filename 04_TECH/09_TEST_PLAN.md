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
- no default_popup one-click action constraint
- English-only visible Sidebar/Dashboard copy, with English locale references loaded at runtime
- Chinese locale key parity kept only as future localization material
- Chat Refine parser examples, including English and Chinese commands
- user rule priority before AI/built-in classification
- exact/tracking duplicate safe close policy
- hash/query duplicate review policy
- protected duplicate tabs not auto-closed
- large synthetic local planning guard for 180 tabs, covering duplicate detection, safe-close planning, group-plan validation, privacy sanitization, and bounded runtime without reading real browser tabs
- current-tab summary confirms sensitive pages before visible text extraction
- AI output validation for invented/repeated tab IDs
- AI classification request includes minimized metadata only and excludes full URL, restore URL, favicon URL, query token, and page text
- AI classification request carries an abort signal and falls back to local rules on timeout
- AI classification status remains lightweight in the sidebar completion message, while Dashboard retains the fuller AI status view
- Dashboard workbench layout keeps the HTML prototype shell: top bar, project rail, filter chips, expanded group cards, and favicon-backed tab rows
- Side panel opens as a chat-first Tab Agent UI, not a result metrics panel
- Side panel organize error states disclose that no tabs were moved or closed and show a retry/diagnostics next step
- Side panel composer preserves recent user and Agent messages in an in-memory local thread
- Side panel disables stale Chat Refine Apply/Cancel buttons when a newer draft appears or a draft is cancelled
- Side panel quick action chips route through the same chat command path and append user/Agent messages to the local thread
- Side panel composer routes direct safe agent commands for current-tab summary, organize, Undo, Restore Closed, Dashboard, and local workspace save before falling back to chat-refine preview
- Side panel composer answers local capability/help questions without requiring page reads or an organize run
- Side panel composer renders open-ended fallback questions as normal assistant messages when DeepSeek is not enabled or no organize context exists, instead of surfacing the local parser error
- Side panel current-page summary and local page question answers render inside the chat message flow and keep the legacy summary panel hidden
- Background current-page summary accepts an optional question and answers from visible page text with local sentence matching
- Side panel composer answers latest organize status, group, duplicate, and AI-status questions from local run state before falling back to chat-refine preview
- Side panel composer answers next-step questions from latest local organize state before falling back to chat-refine preview
- Side panel composer answers duplicate review queue and closed duplicate restore questions from latest local run state / local restore state without rendering full restore URLs
- Side panel composer answers active-tab, protected-tab, and read-later candidate questions from the latest sanitized local run snapshot
- Side panel composer finds tabs from the latest local snapshot and focuses an existing matching tab through the existing focus action
- Side panel composer falls back to DeepSeek metadata-only Agent answers after direct commands, local status answers, tab search, and safe local chat-refine drafts do not match
- DeepSeek metadata-only Agent answers send title, hostname, path, tab state, group state, and duplicate-review counts only; they do not send page body, full URLs, restore URLs, favicon URLs, browser history, chat history, or saved workspace contents
- DeepSeek metadata-only Agent output filters invented tab IDs, rejects unknown/destructive action types, renders optional relevant tabs, safe action chips, and validated `move_tabs` Apply/Cancel drafts, and does not apply browser actions automatically before user Apply
- DeepSeek metadata-only Agent `move_tabs` drafts require an explicit Apply, reuse the existing local `move_tabs` path, create native Chrome tab groups, keep Undo, and do not close tabs
- Dashboard default page opens directly to Smart Groups and does not show Latest Result, timestamp, Current Workspace card, or result metrics area
- Dashboard Smart Groups filter chips render All / AI groups / Rule groups views and localized empty states
- Dashboard Smart Groups keep first rows compact while expandable `+ N tabs` rows reveal remaining local tab rows and actions
- Dashboard Duplicate Center expands duplicate groups into local tab details and focuses existing tabs without close actions
- Dashboard stored organize errors render as a compact safe error card instead of an empty workspace
- Dashboard tab title focus activates the existing browser tab/window without storage writes or destructive tab actions
- Hidden/private-beta local workspace save stores a minimized local snapshot and excludes full URLs, restore URLs, URL hashes, favicon URLs, and page text
- Hidden/private-beta local workspace delete requires confirmation and only removes the selected local snapshot without calling tab, tab group, or window APIs
- Dashboard same-window tab move UI calls the background action, limits target groups to the same window, and avoids tab close actions
- Dashboard drag/drop tab assignment reuses the same same-window background move action and avoids tab close actions
- Dashboard Undo and Restore Closed actions reuse existing background actions, enable only from latest run state, and avoid direct destructive tab actions
- Dashboard keeps unwired P1/prototype placeholders, Saved Workspaces, Auto Organize, and Settings out of the default commercial UI
- Disposable manual QA checklist covers the current MVP flows: Tab Agent chat UI, latest organize result as one assistant message bubble, bottom composer, DeepSeek Agent open answer / move draft when tested, Smart Groups filters, Duplicate Center tab focus, tab focus, same-window tab move, Dashboard apply, safe error states, AI status, sensitive summary, privacy outputs, local QA notes in copied Markdown reports, and one-click copying of the blank redaction-safe real-profile QA template
- Hidden/private-beta permission explanation remains aligned with manifest permissions
- local error log entries redact URLs, hostnames, emails, bearer tokens, and API keys
- duplicate close safety audit stores only counts and whitelisted event types
- current run snapshot strips restore URLs, URL hashes, raw/full URLs, page text, and favicon query/hash data before storing UI state
- Undo snapshot stores only the minimum IDs, window, index, and group fields needed to restore grouping
- Beta diagnostic snapshot and feedback template redact URLs, tab titles, hostnames, rules, group names, page text, and API keys
- Beta feedback template uses English-only classification quality labeling for the 70/20/10/0 target
- AI connection test calls `/models` without sending tab data, full URLs, page text, or a request body
- AI connection test carries an abort signal
- AI connection rejects unsupported OpenAI-compatible hosts before fetch; private beta permits only `https://api.deepseek.com`
- AI host guardrail keeps background validation, Dashboard validation, Dashboard permission copy, and manifest host permissions aligned
- Hidden private-beta AI settings copy still explains the DeepSeek host limit when the Settings path is opened intentionally for testing
- Local private-beta AI config tool can copy `.env.local` DeepSeek settings into ignored `extension/private-beta-ai-settings.json`; release package verification rejects that file if it appears in a zip
- Dashboard local rule deletion requires confirmation and does not move or close tabs
- Dashboard Clear AI Key removes only the local API key, disables AI classification, keeps other local data, and does not move or close tabs
- Dashboard Clear Local Data removes local rules, saved workspace snapshots, AI key/settings, run state, Undo/Restore snapshots, privacy acceptance, chat draft, and local error log
```

Optional provider smoke test:

```bash
node tools/preflight.js --deepseek
node tools/preflight.js --deepseek-fixture
node tools/deepseek_smoke_test.js
node tools/deepseek_smoke_test.js --classify-fixture
```

Expected:

```text
- default mode reads .env.local and calls /models only
- no real browser tab data is sent
- --classify-fixture sends synthetic tabs only and rejects invented tabIds
- provider smoke uses bounded requests and rejects non-DeepSeek hosts before fetch in the private beta
```

Optional runtime smoke test:

```bash
node tools/preflight.js --runtime
node tools/preflight.js --agent-flow
node tools/preflight.js --large-runtime
node tools/chrome_runtime_smoke_test.js
node tools/chrome_runtime_smoke_test.js --agent-flow
node tools/chrome_runtime_smoke_test.js --large-tabs
node tools/open_manual_qa_profile.js --dry-run
node tools/open_manual_qa_profile.js --self-test
```

The runtime script uses a temporary browser profile and synthetic tabs. It prefers `CHROME_PATH`, then auto-detects Playwright / Chrome for Testing / Chromium before falling back to system Google Chrome.

Runtime coverage includes one-click organize, safe duplicate close, Restore Closed, Chat Refine apply, Dashboard group title/color apply, Dashboard same-window tab move into an existing native group, Dashboard drag/drop tab assignment into an existing native group, Dashboard tab focus, Dashboard local workspace save/delete, Dashboard Duplicate Center tab focus, Dashboard Restore Closed, Dashboard Undo, and real Sidebar composer command submission for Open Dashboard, context-aware composer state, ephemeral chat thread rendering, capability/help answer, open-ended fallback answer without DeepSeek, local workspace save command, next-step answer, current-page chat summary response, current-page question rendering, Restore Closed, Undo, Organize Again, group-status answer, AI-status answer, duplicate-review answer, closed-duplicate answer, active-tab answer, protected-tab answer, read-later candidate answer, tab search, and opening a matching existing tab.

The optional DeepSeek Agent-flow runtime check opens a temporary Chrome profile with synthetic URLs, enables DeepSeek only inside temporary extension storage, submits an open-ended tab-management question through the real Sidebar composer, verifies that the metadata-only Agent answer renders as a normal assistant message card with privacy note, relevant tab rows, safe action chips, and safe next-step suggestions, then clicks one safe action chip and verifies the same chat thread continues with a user message and Agent reply. It then asks DeepSeek to move Chrome extension docs tabs into `Extension Planning`, verifies a validated Apply/Cancel draft renders with matched tab rows, clicks Apply, and verifies the real native Chrome tab group updates without closing tabs. It does not read the user's real Chrome profile, real browser tabs, page text, or full URLs, and AI answers do not apply browser actions automatically without user Apply.

The optional large-tab runtime probe opens a temporary Chrome profile with synthetic URLs only and verifies the real native tab group path against 96 tabs by default. It checks organize completion, moved tabs, safe duplicate closes, review duplicate groups, expected group titles, bounded runtime, and sanitized run snapshots. It does not read the user's real Chrome profile, real browser tabs, or `.env.local`.

The manual QA profile launcher opens a disposable browser only when run without `--dry-run`; dry-run validates browser discovery, profile paths, extension path, real-profile QA template path, and synthetic tab count without opening Chrome. Self-test opens the disposable browser, verifies setup, opens a local checklist page, verifies local checklist report controls, verifies the checklist includes Tab Agent chat UI, AI connection plus DeepSeek Agent move-draft checks, sensitive-summary, Dashboard, Duplicate Center, safe error-state checks, and the blank real-profile QA template copy control, then closes and removes the temporary profile automatically.

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
- renders dashboard overview with mock workspace data
- renders dashboard mobile overview with mock workspace data
- renders side panel result/chat states plus Dashboard desktop/mobile with mock extension data
- generates five 1280x800 Chrome Web Store screenshot drafts from mock UI screenshots
- does not read real browser tabs
- does not read .env.local
- writes screenshots only to ignored local artifacts/ui-screenshots/
- writes store screenshot drafts only to ignored local artifacts/store-screenshots/
- marks store screenshot drafts DO NOT SUBMIT YET until user approval
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
- default_popup is not present
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
→ 注入 content extractor
→ 返回 visible text
→ AI summary
→ UI 展示
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
→ 填写 DeepSeek base URL、model、API key
→ 点击 Test AI Connection
→ background 调用 /models
→ UI 显示 connection works / model missing / failed
```

Safety:

```text
不发送 tab title。
不发送 hostname/path/full URL。
不发送页面正文。
不移动/关闭 tabs。
不写入远程日志。
不支持非 `https://api.deepseek.com` host；其他 OpenAI-compatible host 需要后续权限确认。
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
- user rules 是否优先于 AI/built-in。
- undo 是否有效。
- dashboard title/color apply 是否同步浏览器。
- Clear AI Key 是否只清本地 API key 且不移动/关闭 tabs。
- Clear Local Data 是否只清本地数据且不移动/关闭 tabs。
