# 测试计划

## 1. 单元测试

Current no-dependency smoke test:

```bash
node tools/preflight.js
node tools/secret_scan.js
node tools/extension_smoke_test.js
node tools/issue_form_smoke_test.js
node tools/verify_release_package.js
node --check tools/capture_ui_screenshots.js
```

Coverage:

```text
- secret scan for tracked env files and real-looking API keys
- issue form smoke test for beta feedback structure, privacy redlines, and required safety acknowledgements
- release package verification against the current manifest version
- manifest permission guardrails
- no default_popup one-click action constraint
- English/Chinese locale parity and UI i18n key references
- Chat Refine parser examples, including English and Chinese commands
- user rule priority before AI/built-in classification
- exact/tracking duplicate safe close policy
- hash/query duplicate review policy
- protected duplicate tabs not auto-closed
- current-tab summary confirms sensitive pages before visible text extraction
- AI output validation for invented/repeated tab IDs
- AI classification request includes minimized metadata only and excludes full URL, restore URL, query token, and page text
- AI classification status and suggested group count are visible in sidebar and dashboard
- Dashboard workbench layout keeps the HTML prototype shell: top bar, project rail, workspace card, filter chips, and expanded group cards
- Dashboard permission explanation remains aligned with manifest permissions
- local error log entries redact URLs, hostnames, emails, bearer tokens, and API keys
- duplicate close safety audit stores only counts and whitelisted event types
- current run snapshot strips restore URLs, URL hashes, raw/full URLs, and page text before storing UI state
- Undo snapshot stores only the minimum IDs, window, index, and group fields needed to restore grouping
- Beta diagnostic snapshot and feedback template redact URLs, tab titles, hostnames, rules, group names, page text, and API keys
- Beta feedback template includes English/Chinese classification quality labeling for the 70/20/10/0 target
- AI connection test calls `/models` without sending tab data, full URLs, page text, or a request body
- AI connection rejects unsupported OpenAI-compatible hosts before fetch; private beta permits only `https://api.deepseek.com`
- AI host guardrail keeps background validation, Dashboard validation, Dashboard permission copy, and manifest host permissions aligned
- Dashboard AI settings copy explains the private-beta DeepSeek host limit
- Dashboard local rule deletion requires confirmation and does not move or close tabs
- Dashboard Clear AI Key removes only the local API key, disables AI classification, keeps other local data, and does not move or close tabs
- Dashboard Clear Local Data removes local rules, AI key/settings, run state, Undo/Restore snapshots, privacy acceptance, chat draft, and local error log
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
```

Optional runtime smoke test:

```bash
node tools/preflight.js --runtime
node tools/chrome_runtime_smoke_test.js
node tools/open_manual_qa_profile.js --dry-run
node tools/open_manual_qa_profile.js --self-test
```

The runtime script uses a temporary browser profile and synthetic tabs. It prefers `CHROME_PATH`, then auto-detects Playwright / Chrome for Testing / Chromium before falling back to system Google Chrome.

The manual QA profile launcher opens a disposable browser only when run without `--dry-run`; dry-run validates browser discovery, profile paths, extension path, and synthetic tab count without opening Chrome. Self-test opens the disposable browser, verifies setup, opens a local checklist page, verifies local checklist report controls, verifies the checklist includes AI and sensitive-summary checks, then closes and removes the temporary profile automatically.

Optional UI screenshot capture:

```bash
node tools/capture_ui_screenshots.js
node tools/preflight.js --screenshots
```

Expected:

```text
- renders sidebar completed state with English mock data
- renders sidebar completed state with Chinese mock data
- renders dashboard overview with mock workspace data
- renders dashboard mobile overview with mock workspace data
- renders dashboard AI settings with mock DeepSeek settings
- does not read real browser tabs
- does not read .env.local
- writes screenshots only to ignored local artifacts/ui-screenshots/
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
- _locales/en/messages.json and _locales/zh_CN/messages.json exist
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
PASS: Chrome/Chromium allowed CLI unpacked extension loading and the script verified organize, Chat Refine, and Dashboard Apply against real native tab groups.
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
Dashboard apply first slice 不移动 tabs。
Dashboard apply first slice 不关闭 tabs。
Dashboard apply first slice 不读取页面正文。
```

### AI Provider Connection Test

```text
用户打开 Dashboard Settings
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
用户打开 Dashboard Settings
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
用户打开 Dashboard Settings
→ 点击 Clear Local Data
→ browser confirm 出现
→ 确认后删除本地 rules、AI key/settings、最近整理结果、Undo/Restore snapshot、chat draft、first-run privacy acceptance
→ 不关闭 tabs
→ 不移动 tabs
→ 下次 organize 重新显示 first-run privacy onboarding
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
