# QA Evidence

This file records concrete local verification evidence for private-beta readiness. It must not contain secrets, real browsing data, tab titles from the user's browser, full URLs from the user's browser, API keys, or private screenshots.

## 2026-06-13 Sidebar Idle Welcome Chat-First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: Sidebar idle/no-run assistant welcome message

### Chat-First Idle State Smoke Passed

Commands:

```bash
node --check extension/sidepanel.js
node tools/extension_smoke_test.js
git diff --check
node tools/capture_ui_screenshots.js
node tools/preflight.js
```

Result:

```text
56 smoke tests passed
PASS UI screenshots captured
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 137 tracked/unignored files
PASS release package verified for v0.1.0
sha256=4fc14e676c5faf3be9aeed21d195cbf51c5617330427b2d9df407934375072e3
```

Follow-up notes:

- Sidebar idle/no-run state now starts with one assistant welcome message inside the chat thread.
- The old standalone welcome card fallback was removed from the idle surface to keep the Sidebar feeling like a chat product.
- The welcome message offers Smart Organize, Current Page, AI setup, and Dashboard actions.
- Smart Organize and Current Page route through the existing chat command path; AI setup and Dashboard open their existing pages directly.
- The welcome message is excluded from AI conversation memory and does not read page text, upload URLs, add permissions, close tabs, or change privacy defaults.
- Generated mock UI evidence: `artifacts/ui-screenshots/sidepanel-idle.png`.

## 2026-06-13 Browser Work Agent Internal Search And Dashboard Workbench Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: Browser Work Agent internal search tool / task / collection dashboard correction

### Browser Workbench Spec And Smoke Passed

Commands:

```bash
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
55 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=22d6f82e6cc7247c589e9b277e65ff854d9eb55dcd5d8e90bf8ea9233b872319
```

Generated synthetic screenshots:

```text
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-selected-tabs.png
artifacts/ui-screenshots/dashboard-mobile.png
```

Follow-up notes:

- Added the Browser Work Agent / internal Tavily-style search tool / Dashboard Workbench / skill reuse spec.
- Dashboard now has a minimal Browser Workbench shell above Smart Groups: Work Queue and Collections only. It does not expose Search as dashboard UI.
- Explicit web-search requests now route inside Sidebar Agent as a `search_web_provider` tool executor instead of a dashboard search box.
- A first Tavily-style adapter is implemented for configured BYOK search settings. It sends only the normalized user query, with raw content and images disabled by default.
- The adapter does not call Tavily or any external search provider without user configuration and an explicit Agent search request.
- Local tasks and collections save only minimized current-tab metadata: tab id, window id, group id/name, title, hostname, path, and protected state flags. They do not save full URLs, page text, screenshots, attachments, cookies, browser history, or cloud data.
- Clear Local Data now removes local agent tasks, saved collections, and search settings.
- The mock mobile screenshot was checked after the Work Queue / Collections panels were changed to single-column mobile layout.
- Public repo push remains blocked by the existing license/raw-archive/real-profile QA blockers; this slice does not resolve public launch decisions.

## 2026-06-12 Real Public Page Page-Agent / Region QA

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: Public test page only (`https://www.hao123.com/`)
Secrets printed: No
Source state verified: v0.170

### Real Current-Page Multi-Turn Chat Passed

Command:

```bash
node tools/capture_real_page_chat_screenshot.js https://www.hao123.com/ --ai --question '这个页面有什么内容？' --question '这个页面里哪些内容最适合办公用户快速使用？' --question '如果我只想减少信息噪音，应该重点看哪些部分？' --question '基于前面的回答，给我一个一分钟使用建议。'
```

Result:

```text
PASS real page chat captured
url=https://www.hao123.com/
turns=4
ai=deepseek
turn1.type=current-tab
turn2.type=current-tab
turn3.type=current-tab
turn4.type=current-tab
screenshot=artifacts/real-page-chat/hao123-com-multiturn-chat.png
```

Notes:

- The script used a temporary Chrome profile and a temporary copied extension.
- The DeepSeek key came from local `.env.local`, but the key was not printed.
- The repeated questions were submitted through the real Sidebar composer.
- All four turns stayed in current-tab Page Agent scope.
- The final screenshot is an ignored local artifact and should not be committed.
- Quality note: the second answer still repeated part of the page overview before narrowing to office-useful content, so Page Agent prompt quality remains a tuning area.

### Real Selected Page-Region Chat Passed

Command:

```bash
node tools/capture_real_page_chat_screenshot.js https://www.hao123.com/ --ai --region-only --region-question '这个选中的页面区块主要提供什么信息？'
```

Result:

```text
PASS real page chat captured
url=https://www.hao123.com/
turns=1
ai=deepseek
turn1.type=page-region
screenshot=artifacts/real-page-chat/hao123-com-region-chat.png
```

Notes:

- The flow opened the page-local element picker, clicked one visible public-page block, rendered a compact `Region selected` assistant state, and answered from the selected block context.
- The user message no longer exposes the internal `select region:` command prefix.
- The text-only Page Agent did not receive screenshot image bytes; selected-region screenshot handling remains metadata-only in this slice.
- Remaining UX gap: the final product should expose this through an `@ Page region` context picker or small composer button instead of typed trigger commands.

### Preflight Screenshot Guard Passed Except Expected Evidence Sync

Command:

```bash
node tools/preflight.js --screenshots
```

Result after this source slice:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 123 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=2c5433ea476cf73d54ee5a50e585ddb10764a0aebd9c3fe83c23092eb3f3403d
```

## 2026-06-12 Current-Tab Context Label Polish

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.169

### Compact Current-Tab Label Screenshot Guard Passed

Commands:

```bash
node tools/preflight.js --screenshots
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 122 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=04d6edb36dcca54b87c8a26f8d233fd6d1479696a637d608ebfd438c32fefbc1
```

Generated synthetic screenshots:

```text
artifacts/ui-screenshots/sidepanel-result.png
artifacts/ui-screenshots/sidepanel-chat.png
artifacts/ui-screenshots/sidepanel-context-tabs.png
artifacts/ui-screenshots/sidepanel-10-turn-chat.png
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-selected-tabs.png
artifacts/ui-screenshots/dashboard-mobile.png
artifacts/store-screenshots/01-one-click-native-groups.png
artifacts/store-screenshots/02-tab-agent-sidebar.png
artifacts/store-screenshots/03-smart-groups-dashboard.png
artifacts/store-screenshots/04-page-chat.png
artifacts/store-screenshots/05-mobile-dashboard.png
```

Follow-up notes:

- The Sidebar current-tab composer context now renders as a short source label, for example `Current tab · Supabase`.
- Full browser titles such as `Settings | Database | ai-music | Supabase` remain available through tooltip context but are not shown as the primary composer label.
- This avoids making a single current tab look like multiple selected tabs.
- This slice changes display copy, screenshot layout, local smoke coverage, docs, and generated mock screenshots only.
- It does not change page-read triggers, optional site-permission prompts, DeepSeek call triggers, data retention, analytics, tab closing, Undo/Restore, or native grouping behavior.
- Current-tab page content is not guaranteed to be fully readable. Normal http/https pages are usually readable after a user question and permission path, while Chrome internal pages, extension pages, protected pages, local files, canvas/image-heavy surfaces, and some cross-origin embedded content may be unavailable or partial.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

Baseline full runtime / Agent-flow evidence carried forward:

```bash
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
```

```text
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
`--agent-flow` used a temporary Chrome for Testing profile
`--large-runtime` used a separate temporary Chrome for Testing profile
blank real-profile QA result template exists
```

## 2026-06-12 Sidebar Stacked Composer Polish

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.168

### Stacked Context Composer Screenshot Guard Passed

Commands:

```bash
node tools/preflight.js --screenshots
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 122 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=83a54aa31074be9287fbc2b7bcb0c4c991ce04d05985bba9e1a186bb1c55978c
```

Generated synthetic screenshots:

```text
artifacts/ui-screenshots/sidepanel-result.png
artifacts/ui-screenshots/sidepanel-chat.png
artifacts/ui-screenshots/sidepanel-context-tabs.png
artifacts/ui-screenshots/sidepanel-10-turn-chat.png
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-selected-tabs.png
artifacts/ui-screenshots/dashboard-mobile.png
artifacts/store-screenshots/01-one-click-native-groups.png
artifacts/store-screenshots/02-tab-agent-sidebar.png
artifacts/store-screenshots/03-smart-groups-dashboard.png
artifacts/store-screenshots/04-page-chat.png
artifacts/store-screenshots/05-mobile-dashboard.png
```

Follow-up notes:

- The Sidebar composer now shows the active current-tab / selected-tabs / group context as a compact top row inside the same composer surface.
- The context is no longer an inline prefix in the text input row, so it does not feel like part of the user's typed prompt.
- The 10-turn chat screenshot still keeps the latest messages and bottom composer visible.
- This slice changes visual styling, screenshot layout guards, local smoke coverage, docs, and generated mock screenshots only.
- It does not change page-read triggers, optional site-permission prompts, DeepSeek call triggers, data retention, analytics, tab closing, Undo/Restore, or native grouping behavior.
- Current-tab page content is not guaranteed to be readable on every page. Normal http/https pages are usually readable after a user question and permission path, while Chrome internal pages, extension pages, protected pages, local files, canvas/image-heavy surfaces, and some cross-origin embedded content may be unavailable or partial.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

Baseline full runtime / Agent-flow evidence carried forward:

```bash
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
```

```text
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
`--agent-flow` used a temporary Chrome for Testing profile
`--large-runtime` used a separate temporary Chrome for Testing profile
blank real-profile QA result template exists
```

## 2026-06-12 Manual QA Fixture Server Keep-Alive

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.167

### Optional Keep-Alive Fixture Server Passed

Commands:

```bash
node --check tools/open_manual_qa_profile.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/open_manual_qa_profile.js --self-test
node tools/open_manual_qa_profile.js --keep-fixture-server
node tools/preflight.js --screenshots
```

Result:

```text
PASS manual QA profile opened
contextFixtureTabs=3
Safety:
- Keeps the local fixture server alive only for tabmosaic-manual.test until you press Ctrl+C.
Fixture server is still running for selected-tabs page-context QA.
PASS context fixture server stopped
PASS self-test closed and cleaned up disposable QA profile
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=38a3dda18d3e070580017e1288194ac4189f114eaacb99083d9250f0c31dcf03
```

Follow-up notes:

- `tools/open_manual_qa_profile.js --keep-fixture-server` now keeps the local `tabmosaic-manual.test` fixture server alive until Ctrl+C.
- This makes fixture links and refreshed fixture tabs usable while testing selected-tabs page-context permission approval/denial.
- Default launcher behavior remains one-shot: it loads fixture pages, exits, and tells testers to rerun if refreshed pages go blank.
- This slice changes manual QA tooling and docs only.
- It does not change extension permissions, page-read triggers, optional site-permission prompts, AI request behavior, data retention, analytics, tab closing, Undo/Restore, or native grouping behavior.
- Native optional site permission prompt acceptance and real-profile selected-tabs QA remain pending.

## 2026-06-12 Manual QA Context Fixture Guide

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.166

### Context Fixture Guide And Copy Prompt Passed

Commands:

```bash
node --check tools/open_manual_qa_profile.js
node --check tools/extension_smoke_test.js
node tools/open_manual_qa_profile.js --self-test
node tools/preflight.js --screenshots
```

Result:

```text
PASS manual QA profile opened
seedTabs=23
contextFixtureTabs=3
contextFixture=http://tabmosaic-manual.test:<port>/product-roadmap
contextFixture=http://tabmosaic-manual.test:<port>/release-checklist
contextFixture=http://tabmosaic-manual.test:<port>/interface-review
PASS self-test closed and cleaned up disposable QA profile
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=38a3dda18d3e070580017e1288194ac4189f114eaacb99083d9250f0c31dcf03
```

Follow-up notes:

- The disposable Manual QA Checklist now includes a `Context Fixture Guide` for selected-tabs page-context QA.
- The guide shows the three local synthetic fixture pages and includes a copyable prompt that asks for `ORBITALPLANNING`, `BUGLANTERN`, and `GLASSHARBOR` when visible page text is readable.
- Self-test verifies the checklist, fixture tabs, guide content, report controls, and real-profile template copy control inside a disposable Chrome for Testing profile.
- This slice changes manual QA tooling, local smoke guards, and docs only.
- It does not change extension permissions, page-read triggers, optional site-permission prompts, AI request behavior, data retention, analytics, tab closing, Undo/Restore, or native grouping behavior.
- Native optional site permission prompt acceptance and real-profile selected-tabs QA remain pending.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Sidebar Chat Composer And Long-Conversation Polish

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.165

### One-Surface Composer And Screenshot Layout Guard Passed

Commands:

```bash
node tools/preflight.js --screenshots
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=38a3dda18d3e070580017e1288194ac4189f114eaacb99083d9250f0c31dcf03
```

Follow-up notes:

- The Sidebar composer now renders the active context chip and textarea as one input surface, instead of a status strip above the input.
- The chat panel is treated as a plain message stream, so the 10-turn screenshot scrolls to the latest messages and keeps the bottom composer visible.
- UI screenshot capture now fails if the side panel horizontally drifts, clips message cards, or clips the composer.
- This slice changes visual styling, screenshot layout guards, local smoke coverage, and docs only.
- It does not change page-read triggers, optional site-permission prompts, DeepSeek call triggers, data retention, analytics, tab closing, Undo/Restore, or native grouping behavior.
- Native optional site permission prompt acceptance and real-profile selected-tabs QA remain pending.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Disposable Manual QA Context Fixture

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.164

### Local Context Fixture Tabs And Checklist Self-Test Passed

Commands:

```bash
node --check tools/open_manual_qa_profile.js
node --check tools/extension_smoke_test.js
node tools/open_manual_qa_profile.js --self-test
node tools/extension_smoke_test.js
```

Result:

```text
PASS manual QA profile opened
seedTabs=23
contextFixtureTabs=3
contextFixture=http://tabmosaic-manual.test:<port>/product-roadmap
contextFixture=http://tabmosaic-manual.test:<port>/release-checklist
contextFixture=http://tabmosaic-manual.test:<port>/interface-review
PASS self-test closed and cleaned up disposable QA profile
54 smoke tests passed
PASS release package verified for v0.1.0
sha256=060e6240db78546ae3ae55e5aacda04ab181c4d1ee376fd8a14791d0d400b536
```

Follow-up notes:

- The disposable manual QA profile now opens stable local `tabmosaic-manual.test` fixture pages for selected-tabs page-context testing.
- Fixture markers are `ORBITALPLANNING`, `BUGLANTERN`, and `GLASSHARBOR`; testers can use them to confirm that visible page content was read only after approving Chrome site access.
- The fixture pages are synthetic local HTML and do not read the user's real Chrome profile, real browser tabs, `.env.local`, browsing history, cookies, or private page text.
- The fixture server is used only to load local synthetic pages into the disposable profile; the extension still must request optional site access from the user-triggered Sidebar flow.
- Native optional site permission prompt acceptance and real-profile selected-tabs QA remain pending.
- P0 manual QA runbook has not been run against the user's real Chrome profile.
- The blank real-profile QA result template remains the required redaction-safe path for any future real-profile evidence.

Baseline full runtime / Agent-flow evidence carried forward:

```bash
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
```

```text
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
```

Baseline safety scope:

- `--agent-flow` used a temporary Chrome for Testing profile and synthetic tabs.
- `--large-runtime` used a separate temporary Chrome for Testing profile.
- DeepSeek Agent-flow was not rerun in this slice to avoid unnecessary provider/API-key usage; prior DeepSeek Agent-flow evidence remains carried forward and should be rerun only when intentionally testing AI provider behavior.

## 2026-06-12 Missing Site Access Assistant Copy

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.163

### Plain-Language Metadata-Only Fallback Passed

Commands:

```bash
node tools/preflight.js --screenshots
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=060e6240db78546ae3ae55e5aacda04ab181c4d1ee376fd8a14791d0d400b536
```

Follow-up notes:

- Missing selected-tabs/current-group site access now answers as plain assistant copy: Chrome site access was not granted, no page body was read/sent/stored, and the answer is from titles/hostnames only.
- Generic zero-readable batches now say the answer is metadata-only instead of using technical extraction-failure wording.
- This slice does not change permissions, page-read defaults, AI request triggers, context storage, analytics, tab closing, or browser grouping behavior.
- Native optional site permission prompt acceptance and real-profile selected-tabs QA remain pending.
- P0 manual QA runbook has not been run against the user's real Chrome profile.
- The blank real-profile QA result template remains the required redaction-safe path for any future real-profile evidence.

Baseline full runtime / Agent-flow evidence carried forward:

```bash
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
```

```text
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
```

Baseline safety scope:

- `--agent-flow` used a temporary Chrome for Testing profile and synthetic tabs.
- `--large-runtime` used a separate temporary Chrome for Testing profile.
- No real Chrome profile, real browser tabs, real page text, browsing history, cookies, or `.env.local` contents were read by this screenshot run.
- DeepSeek Agent-flow was not rerun in this slice to avoid unnecessary provider/API-key usage; prior DeepSeek Agent-flow evidence remains carried forward and should be rerun only when intentionally testing AI provider behavior.

## 2026-06-12 Inline Tool-State Sidebar Polish

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.162

### Inline Context-Read State Screenshots And Package Passed

Commands:

```bash
node tools/preflight.js --screenshots
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=da5442be6f49a51c92c1e3217b49b540327b80f0f032f21e63a202b038afd0ec
```

Generated synthetic screenshots:

```text
artifacts/ui-screenshots/sidepanel-result.png
artifacts/ui-screenshots/sidepanel-chat.png
artifacts/ui-screenshots/sidepanel-context-tabs.png
artifacts/ui-screenshots/sidepanel-10-turn-chat.png
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-selected-tabs.png
artifacts/ui-screenshots/dashboard-mobile.png
artifacts/store-screenshots/01-one-click-native-groups.png
artifacts/store-screenshots/02-tab-agent-sidebar.png
artifacts/store-screenshots/03-smart-groups-dashboard.png
artifacts/store-screenshots/04-page-chat.png
artifacts/store-screenshots/05-mobile-dashboard.png
```

Follow-up notes:

- Sidebar context-read disclosure now renders as a small inline assistant status pill instead of a standalone tool-like card.
- The status still discloses read count, visible-text boundary, session-only storage, and skipped count.
- This slice does not change permissions, page-read defaults, AI request triggers, context storage, analytics, tab closing, or browser grouping behavior.
- Native optional site permission prompt acceptance and real-profile selected-tabs QA remain pending.
- P0 manual QA runbook has not been run against the user's real Chrome profile.
- The blank real-profile QA result template remains the required redaction-safe path for any future real-profile evidence.

Baseline full runtime / Agent-flow evidence carried forward:

```bash
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
```

```text
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
```

Baseline safety scope:

- `--agent-flow` used a temporary Chrome for Testing profile and synthetic tabs.
- `--large-runtime` used a separate temporary Chrome for Testing profile.
- No real Chrome profile, real browser tabs, real page text, browsing history, cookies, or `.env.local` contents were read by this screenshot run.
- DeepSeek Agent-flow was not rerun in this slice to avoid unnecessary provider/API-key usage; prior DeepSeek Agent-flow evidence remains carried forward and should be rerun only when intentionally testing AI provider behavior.

## 2026-06-12 Sidebar Composer Context UX Polish

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.161

### Composer Context Chip, Screenshots, Package, And Manual Checklist Passed

Commands:

```bash
node tools/preflight.js --screenshots
node tools/open_manual_qa_profile.js --self-test
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
PASS manual QA profile opened
PASS self-test closed and cleaned up disposable QA profile
sha256=81af3867aa5d52ce43ecf52d0fdb480d46e40e7c8bde491d413bd0bfe798ba04
```

Generated synthetic screenshots:

```text
artifacts/ui-screenshots/sidepanel-result.png
artifacts/ui-screenshots/sidepanel-chat.png
artifacts/ui-screenshots/sidepanel-context-tabs.png
artifacts/ui-screenshots/sidepanel-10-turn-chat.png
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-selected-tabs.png
artifacts/ui-screenshots/dashboard-mobile.png
artifacts/store-screenshots/01-one-click-native-groups.png
artifacts/store-screenshots/02-tab-agent-sidebar.png
artifacts/store-screenshots/03-smart-groups-dashboard.png
artifacts/store-screenshots/04-page-chat.png
artifacts/store-screenshots/05-mobile-dashboard.png
```

Follow-up notes:

- Sidebar active context now lives inside the bottom composer as a compact chip instead of a separate strip above the input.
- Selected-tabs composer context now reads as scope plus count, for example `Selected tabs · 8 tabs`, without repeating the selected-tabs label twice.
- Multi-tab context answers now lead with assistant prose before compact read/skipped metadata and supporting summaries.
- Tool-card messages are still present for user-triggered page reads, but are styled as lightweight assistant state inside the chat stream.
- Disposable manual QA checklist coverage now includes selected-tabs page-context native permission approval/denial checks.
- The real-profile QA template now has explicit selected-tabs page-context pass/fail fields.
- This slice does not change permissions, page-read defaults, AI request triggers, context storage, analytics, tab closing, or browser grouping behavior.
- Native optional site permission prompt acceptance and real-profile selected-tabs QA remain pending.
- P0 manual QA runbook has not been run against the user's real Chrome profile.
- The blank real-profile QA result template remains the required redaction-safe path for any future real-profile evidence.

Baseline full runtime / Agent-flow evidence carried forward:

```bash
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
```

```text
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
```

Baseline safety scope:

- `--agent-flow` used a temporary Chrome for Testing profile and synthetic tabs.
- `--large-runtime` used a separate temporary Chrome for Testing profile.
- No real Chrome profile, real browser tabs, real page text, browsing history, cookies, or `.env.local` contents were read by the current screenshot/manual-checklist run.
- DeepSeek Agent-flow was not rerun in this slice to avoid unnecessary provider/API-key usage; prior DeepSeek Agent-flow evidence remains carried forward and should be rerun only when intentionally testing AI provider behavior.

## 2026-06-12 Current-Build Runtime Evidence Refresh

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.160

### Temporary Chrome Runtime, Large Tabs, And Screenshots Passed

Commands:

```bash
node tools/preflight.js --runtime --large-runtime --screenshots
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS Chrome runtime read synthetic HTTP page content with a temporary fixture host grant, rendered content regroup preview, and applied native groups
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, context-aware composer state, selected-tabs context tool card, selected-tabs follow-up routing, ephemeral chat thread, capability answer, open-ended chat fallback, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
PASS Chrome runtime large-tab probe organized 96 synthetic tabs in 1141ms with 9 groups, 96 moved tabs, 8 safe duplicate closes, and 9 review duplicate groups
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=69341d7cd08adeb018355c879d686adae2c46eed3a0704a07c154f7b10c09e46
```

Generated synthetic screenshots:

```text
artifacts/ui-screenshots/sidepanel-result.png
artifacts/ui-screenshots/sidepanel-chat.png
artifacts/ui-screenshots/sidepanel-context-tabs.png
artifacts/ui-screenshots/sidepanel-10-turn-chat.png
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-selected-tabs.png
artifacts/ui-screenshots/dashboard-mobile.png
artifacts/store-screenshots/01-one-click-native-groups.png
artifacts/store-screenshots/02-tab-agent-sidebar.png
artifacts/store-screenshots/03-smart-groups-dashboard.png
artifacts/store-screenshots/04-page-chat.png
artifacts/store-screenshots/05-mobile-dashboard.png
```

Follow-up notes:

- `--runtime` used a temporary Chrome for Testing / Chromium profile with synthetic tabs and a synthetic HTTP fixture host grant.
- `--large-runtime` used a separate temporary Chrome for Testing / Chromium profile and synthetic URLs only.
- The runtime refresh does not read the user's real Chrome profile, real tabs, real page text, browsing history, cookies, or `.env.local`.
- This run intentionally did not pass `--agent-flow`, so no DeepSeek/OpenAI-compatible provider call was made and no API key was used.
- Baseline DeepSeek Agent-flow evidence remains carried forward from earlier private-beta QA runs: `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, and the validated Apply-gated move-draft behavior.
- Baseline synthetic classification fixture evidence also remains carried forward: `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, and `fixtureAssignedTabs=3`.
- Native optional site permission prompt acceptance and real-profile selected-tabs QA remain pending.
- P0 manual QA runbook has not been run against the user's real Chrome profile.
- The blank real-profile QA result template remains the required redaction-safe path for any future real-profile evidence.

## 2026-06-12 Selected-Tabs Running Tool-Card Wording

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.159

### Selected-Tabs Reads No Longer Start As Group Reads

Commands:

```bash
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/preflight.js
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=69341d7cd08adeb018355c879d686adae2c46eed3a0704a07c154f7b10c09e46
```

Follow-up notes:

- Selected-tabs context questions now render the running tool card as `Read selected tabs` with `read_selected_tabs_pages`.
- Current-group questions still render as `Read group pages`.
- Selected-tabs Q&A and content-assisted regrouping share the same running tool-card builder.
- This slice changes UI copy only; it does not change permissions, page reads, AI calls, storage, analytics, tab closing, or browser grouping behavior.
- Baseline controlled runtime evidence remains carried forward from earlier private-beta QA runs: `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore`, `open-ended chat fallback`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, `latest organize results rendered as one assistant message bubble`, `optimization/memory-relief answer`, `PASS Chrome runtime large-tab probe organized 96 synthetic tabs`, `--agent-flow` used a temporary Chrome for Testing profile, `--large-runtime` used a separate temporary Chrome for Testing profile, `PASS UI screenshots captured`, `PASS store screenshot drafts captured`, `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, `fixtureAssignedTabs=3`, and the blank real-profile QA result template.
- Native optional site permission prompt acceptance and real-profile selected-tabs QA remain pending.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Missing Site Permission Retry Guidance

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.158

### Tool Cards And Next Steps Explain Permission Retry

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/preflight.js
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=0a91758337c0130293e3223bf6c0edf05a417b37e7867895daa3b27b6818a29d
```

Follow-up notes:

- Context-tab summaries now add a concrete retry recommendation when missing temporary site access caused skipped tabs: approve Chrome site access for the selected work pages, then ask again.
- Context-tab group summary next steps now include the same permission retry guidance for zero-readable and partial-readable cases.
- Sidebar tool cards now render the top skipped reason labels from the tool-card breakdown, so `site access not granted` can appear directly in the running/result tool card.
- This slice does not add permissions, broaden host access, read more page text, run background extraction, persist multi-tab context, add analytics, close tabs, or apply browser changes.
- Baseline controlled runtime evidence remains carried forward from earlier private-beta QA runs: `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore`, `open-ended chat fallback`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, `latest organize results rendered as one assistant message bubble`, `optimization/memory-relief answer`, `PASS Chrome runtime large-tab probe organized 96 synthetic tabs`, `--agent-flow` used a temporary Chrome for Testing profile, `--large-runtime` used a separate temporary Chrome for Testing profile, `PASS UI screenshots captured`, `PASS store screenshot drafts captured`, `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, `fixtureAssignedTabs=3`, and the blank real-profile QA result template.
- Native optional site permission prompt acceptance and real-profile selected-tabs QA remain pending.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Missing Site Permission Skip Reason

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.157

### Missing Temporary Site Access Is User-Readable

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/preflight.js
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=c6b817f0edad963e50d50aaf79a57ff059bb4e4f52f921a2beea32cdfa3028e5
```

Follow-up notes:

- Context-tab extraction now distinguishes `missing_permission` from generic `restricted` and `unreadable` failures.
- Sidebar skipped-reason chips can render `site access not granted`, making denied or missing temporary site access easier to understand.
- Existing restricted pages such as browser/internal pages still remain restricted and are not read.
- This slice does not add permissions, broaden host access, read more page text, run background extraction, persist multi-tab context, add analytics, close tabs, or apply browser changes.
- Baseline controlled runtime evidence remains carried forward from earlier private-beta QA runs: `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore`, `open-ended chat fallback`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, `latest organize results rendered as one assistant message bubble`, `optimization/memory-relief answer`, `PASS Chrome runtime large-tab probe organized 96 synthetic tabs`, `--agent-flow` used a temporary Chrome for Testing profile, `--large-runtime` used a separate temporary Chrome for Testing profile, `PASS UI screenshots captured`, `PASS store screenshot drafts captured`, `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, `fixtureAssignedTabs=3`, and the blank real-profile QA result template.
- Native optional site permission prompt acceptance and real-profile selected-tabs QA remain pending.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Context-Tab Permission Cleanup Hardening

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.156

### Temporary Site Access Releases Only Session-Owned Origins

Commands:

```bash
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/preflight.js
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=d6b95546218c57a578064a83be56f0adbcdd88dbf267d7df395fdb4e7e824ca3
```

Follow-up notes:

- Multi-tab current-group/selected-tabs visible-text reads now check existing per-origin site access before requesting temporary access.
- The Sidebar requests only missing origins and releases only origins granted during that temporary context-read session.
- Already-granted origins are preserved so a context-read cleanup cannot accidentally revoke pre-existing user/provider permissions.
- Cleanup still runs from the existing `finally` path after successful answers, local fallbacks, provider failures, or runtime errors.
- This slice does not add new permissions, broaden host access, read page text automatically, change one-click organize, persist extracted context, add analytics, close tabs, or apply browser changes.
- Baseline controlled runtime evidence remains carried forward from earlier private-beta QA runs: `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore`, `open-ended chat fallback`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, `latest organize results rendered as one assistant message bubble`, `optimization/memory-relief answer`, `PASS Chrome runtime large-tab probe organized 96 synthetic tabs`, `--agent-flow` used a temporary Chrome for Testing profile, `--large-runtime` used a separate temporary Chrome for Testing profile, `PASS UI screenshots captured`, `PASS store screenshot drafts captured`, `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, `fixtureAssignedTabs=3`, and the blank real-profile QA result template.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Dashboard Screenshot Layout Polish

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.155

### Smart Groups Rows And Selected-Tabs Screenshot Were Rechecked

Commands:

```bash
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/preflight.js
```

Result:

```text
54 smoke tests passed
PASS UI screenshots captured
artifacts/ui-screenshots/sidepanel-result.png
artifacts/ui-screenshots/sidepanel-chat.png
artifacts/ui-screenshots/sidepanel-context-tabs.png
artifacts/ui-screenshots/sidepanel-10-turn-chat.png
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-selected-tabs.png
artifacts/ui-screenshots/dashboard-mobile.png
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=074f81db20665a42ae23b7a6a13175005dbb280425eb98d2e0a8d264f808992a
```

Follow-up notes:

- Dashboard Smart Groups tab rows now align checkbox, favicon, title, and action columns in a denser layout.
- Generated screenshots now include `dashboard-selected-tabs.png`, showing the Dashboard state after selecting two local mock tabs and exposing `Chat selected (2)`.
- Screenshot fixtures use mocked extension data only; they do not read the user's real Chrome tabs, page text, full URLs, cookies, browser history, or API keys.
- Smoke tests now guard the Dashboard row layout string and selected-tabs screenshot coverage.
- This slice does not read page text from Dashboard, call AI, request new permissions, broaden host access, persist selected page content, add analytics, close tabs, or apply browser changes.
- Baseline controlled runtime evidence remains carried forward from earlier private-beta QA runs: `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore`, `open-ended chat fallback`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, `latest organize results rendered as one assistant message bubble`, `optimization/memory-relief answer`, `PASS Chrome runtime large-tab probe organized 96 synthetic tabs`, `--agent-flow` used a temporary Chrome for Testing profile, `--large-runtime` used a separate temporary Chrome for Testing profile, `PASS store screenshot drafts captured`, `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, `fixtureAssignedTabs=3`, and the blank real-profile QA result template.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Multi-Tab Zero-Readable Fallback Polish

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.154

### Metadata-Only Fallback Is Explicit When No Pages Are Readable

Commands:

```bash
node --check extension/background.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/preflight.js
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=c6506fff95cbca0c68cd74c7c389cb732f3c2b44aad4d7546845a1458fd936fc
```

Follow-up notes:

- Current-group and selected-tabs context answers now have a clearer zero-readable fallback.
- If all requested tabs are skipped or unreadable, the tool card reports `metadata_only`, and the answer explicitly says no page body was read, sent to AI, or stored.
- The local summary still uses minimized titles/hostnames/group metadata and skipped reason breakdowns, then suggests retrying with normal readable work pages.
- Smoke tests now guard the metadata-only tool status, no-page-body disclosure, concrete retry guidance, and metadata source disclosure.
- This slice does not read additional pages, request additional permissions, broaden host access, call AI for zero-readable batches, upload page bodies, persist extracted context, add analytics, close tabs, or apply browser changes.
- Baseline controlled runtime evidence remains carried forward from earlier private-beta QA runs: `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore`, `open-ended chat fallback`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, `latest organize results rendered as one assistant message bubble`, `optimization/memory-relief answer`, `PASS Chrome runtime large-tab probe organized 96 synthetic tabs`, `--agent-flow` used a temporary Chrome for Testing profile, `--large-runtime` used a separate temporary Chrome for Testing profile, `PASS UI screenshots captured`, `PASS store screenshot drafts captured`, `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, `fixtureAssignedTabs=3`, and the blank real-profile QA result template.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Dashboard Selected-Tabs Multi-Window UX Polish

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.153

### Cross-Window Selection Reset Is Explained

Commands:

```bash
node --check extension/dashboard.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/preflight.js
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=365bbf878913454c05a5fefcc29e4a9d37c84c4c5cca03f040613d10eb3019a5
```

Follow-up notes:

- Dashboard selected-tabs chat remains scoped to one Chrome window at a time.
- When a user selects a tab from another window, the previous selected set is reset and a compact status chip explains that selection moved to the new window.
- The notice auto-clears and reuses the existing minimal Dashboard status area instead of adding a new panel.
- Smoke tests now guard the localized reset copy, selection status scope, compact chip styling, and the existing boundary that Dashboard does not call the context-tabs visible-text tool directly.
- No page text is read from Dashboard, no AI call is made, no host permission is requested, no selected-tabs context is persisted beyond minimized local metadata, no tabs are closed, and no browser grouping changes are applied by this UX slice.
- Baseline controlled runtime evidence remains carried forward from earlier private-beta QA runs: `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore`, `open-ended chat fallback`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, `latest organize results rendered as one assistant message bubble`, `optimization/memory-relief answer`, `PASS Chrome runtime large-tab probe organized 96 synthetic tabs`, `--agent-flow` used a temporary Chrome for Testing profile, `--large-runtime` used a separate temporary Chrome for Testing profile, `PASS UI screenshots captured`, `PASS store screenshot drafts captured`, `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, `fixtureAssignedTabs=3`, and the blank real-profile QA result template.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Multi-Tab Skipped Reason Breakdown First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.152

### Context Answers Explain Why Tabs Were Skipped

Commands:

```bash
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=6344cbf40c2005e71c6611a155f7f3ad18302bf0bede0127ae8a0c5b1bf4f591
```

Follow-up notes:

- Current-group and selected-tabs context extraction now builds safe skipped-tab labels and aggregate reason counts for sensitive, restricted, protected, empty, unreadable, closed/unavailable, and over-cap tabs.
- Sidebar compact group summary cards render skipped reason chips instead of only a skipped count.
- Multi-tab Page Agent payloads include skipped reason labels and aggregate counts so the answer can explain partial context without exposing full URLs or page text.
- Smoke tests now guard skipped breakdown generation, Sidebar rendering contract, prompt payload minimization, and local summary wording.
- No additional page text is read, no new permissions are requested, no host access is broadened, no extracted multi-tab text or summaries are persisted, no analytics are added, and no browser changes are applied in this slice.
- Baseline controlled runtime evidence remains carried forward from earlier private-beta QA runs: `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore`, `open-ended chat fallback`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, `latest organize results rendered as one assistant message bubble`, `optimization/memory-relief answer`, `PASS Chrome runtime large-tab probe organized 96 synthetic tabs`, `--agent-flow` used a temporary Chrome for Testing profile, `--large-runtime` used a separate temporary Chrome for Testing profile, `PASS UI screenshots captured`, `PASS store screenshot drafts captured`, `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, `fixtureAssignedTabs=3`, and the blank real-profile QA result template.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Selected Page-Region Cropped Screenshot Metadata First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.151

### Region Screenshot Metadata Is User-Triggered And Text-Only

Commands:

```bash
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=2cb80d89f49cc1a03fa26eea3a387c3a240cf48b74ed4464a69db1474fc8d9a8
```

Follow-up notes:

- Selected page-region chat now has a cropped screenshot metadata first slice.
- The flow remains user-triggered from Sidebar, uses the existing page-local element picker, and still requires sensitive-page confirmation when the current tab looks sensitive.
- The background may transiently call `chrome.tabs.captureVisibleTab` only after the user clicks a readable page block, crop the visible-tab capture to that selected region in memory, discard the full visible-tab capture, and keep only cropped screenshot metadata.
- The text-only Page Agent payload includes cropped screenshot metadata such as captured flag, image type, dimensions, byte length, and no-upload/no-store flags. It does not include screenshot image bytes, data URLs, full visible-tab screenshots, full URLs, query/hash, hidden DOM, cookies, form values, browser history, workspace memory, or cloud storage.
- Smoke tests now guard selected-region capture/crop code, tool-registry disclosure, Page Agent payload sanitization, no screenshot data URL upload, and conservative store/privacy documentation.
- No manifest permission, required host permission, optional host permission, analytics path, cloud storage path, saved workspace schema, diagnostics upload, destructive tab action, or public launch claim changed in this slice.
- Baseline controlled runtime evidence remains carried forward from earlier private-beta QA runs: `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore`, `open-ended chat fallback`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, `latest organize results rendered as one assistant message bubble`, `optimization/memory-relief answer`, `PASS Chrome runtime large-tab probe organized 96 synthetic tabs`, `--agent-flow` used a temporary Chrome for Testing profile, `--large-runtime` used a separate temporary Chrome for Testing profile, `PASS UI screenshots captured`, `PASS store screenshot drafts captured`, `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, `fixtureAssignedTabs=3`, and the blank real-profile QA result template.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Chrome Web Store Permission / Data Disclosure Research Note

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.150

### Store Policy Notes Are Documented Without Changing Runtime Behavior

Commands:

```bash
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=77a116c42ab7b0bac9cbadf1aa9f334f387de2df1659051987cf25e3d0d032d1
```

Follow-up notes:

- Official Chrome docs were checked for single-purpose guidance, Limited Use, privacy fields, User Data FAQ, review process, `tabs`, `sidePanel`, `scripting`, and `activeTab`.
- Store submission and data disclosure drafts now state that `tabs` is sensitive, `sidePanel` and `scripting` are justified by user-facing flows, `activeTab` is the narrow current-tab access path, optional host access must remain user-triggered, and actual Chrome Web Store acceptance remains unverified until submission.
- Data disclosure notes now keep `Web history / web browsing activity`, `Website content / website resources`, `User-provided content`, and likely `Authentication information` as conservative public-build categories while BYOK and page chat remain in scope.
- No extension runtime code, manifest permission, host access, page-read path, AI request path, storage path, analytics, screenshot capture, public launch claim, or tab action changed in this slice.
- Baseline controlled runtime evidence remains carried forward from earlier private-beta QA runs: `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore`, `open-ended chat fallback`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, `latest organize results rendered as one assistant message bubble`, `optimization/memory-relief answer`, `PASS Chrome runtime large-tab probe organized 96 synthetic tabs`, `--agent-flow` used a temporary Chrome for Testing profile, `--large-runtime` used a separate temporary Chrome for Testing profile, `PASS UI screenshots captured`, `PASS store screenshot drafts captured`, `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, `fixtureAssignedTabs=3`, and the blank real-profile QA result template.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Chrome Built-in AI Extension Research Note

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.149

### Chrome Built-in AI Is Documented As Future Adapter Research

Commands:

```bash
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=77a116c42ab7b0bac9cbadf1aa9f334f387de2df1659051987cf25e3d0d032d1
```

Follow-up notes:

- Official Chrome docs were checked for built-in AI, Prompt API, Chrome Extensions AI, and requirements.
- Provider strategy now treats Chrome built-in AI as a future `chrome_builtin_ai` adapter candidate, not a P0 BYOK/OpenAI-compatible replacement.
- BYOK setup guide now states that Chrome built-in AI is not a Base URL preset and should not ask for API key / provider host.
- Backlog and research todo now mark Chrome built-in AI extension-support research complete.
- No extension runtime code, provider preset, host permission, page-read path, AI request path, storage path, analytics, or tab action changed in this slice.
- Baseline controlled runtime evidence remains carried forward from earlier private-beta QA runs: `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore`, `open-ended chat fallback`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, `latest organize results rendered as one assistant message bubble`, `optimization/memory-relief answer`, `PASS Chrome runtime large-tab probe organized 96 synthetic tabs`, `--agent-flow` used a temporary Chrome for Testing profile, `--large-runtime` used a separate temporary Chrome for Testing profile, `PASS UI screenshots captured`, `PASS store screenshot drafts captured`, `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, `fixtureAssignedTabs=3`, and the blank real-profile QA result template.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 Toolbar Popup Action-Flow Guard

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.148

### Toolbar Popup Delegates Real Work To Background

Commands:

```bash
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
54 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=77a116c42ab7b0bac9cbadf1aa9f334f387de2df1659051987cf25e3d0d032d1
```

Follow-up notes:

- Added a smoke regression guard for the confirmed compact toolbar menu contract.
- The guard verifies the popup exposes only Smart Organize, Vertical Tabs, Current Page Chat, and Dashboard in the confirmed order.
- The guard verifies popup actions delegate through `RUN_TOOLBAR_ACTION`, pass active tab/window hints, and do not call `chrome.sidePanel.open` or `chrome.tabs.group` directly.
- The guard verifies background keeps a toolbar action allowlist, rejects unsupported toolbar actions, opens Dashboard separately, opens side panel through background, and keeps Vertical Tabs from starting organize.
- This was a test/docs-only guard; the release package checksum remained unchanged from v0.147 because extension runtime files were not changed in this slice.

## 2026-06-12 Advanced SaaS Canonical Dedupe Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.147

### More Same-Object SaaS Tabs Enter Review Only

Commands:

```bash
node --check extension/background.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
53 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=77a116c42ab7b0bac9cbadf1aa9f334f387de2df1659051987cf25e3d0d032d1
```

Follow-up notes:

- Duplicate Review now recognizes additional same-object candidates for GitHub Actions runs, GitHub commits, Google Drive open/download links, Dropbox shares/files/folders, Miro boards, Canva designs, and Coda docs.
- These candidates are `domain-review` only and are never auto-closed by the safe duplicate close plan.
- Local smoke verifies generic labels do not expose raw GitHub run/commit IDs, Drive IDs, Dropbox IDs, Miro board IDs, Canva design IDs, Coda doc IDs, YouTube IDs, issue keys, Figma IDs, or Notion IDs.
- This slice does not read page text, call AI, request new permissions, upload data, add analytics, or implement semantic/page-body duplicate detection.

## 2026-06-12 Provider Troubleshooting First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.146

### Test AI Connection Gives Concise Next Steps

Commands:

```bash
node --check extension/background.js
node --check extension/dashboard.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
53 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=6142c72fb03ab1f354ff741c8915bb2221304706622746c1b4b71e9aeca8242e
```

Follow-up notes:

- Test AI Connection now returns troubleshooting codes for missing local model/server setup, choosing a listed model, exact model-name checks, synthetic-only provider fallback, missing remote API key, provider-origin permission, HTTPS/localhost boundary, and generic provider settings checks.
- Dashboard renders those codes as concise `Next:` guidance after the compact connection status.
- The troubleshooting path reuses the existing connection result or failure path and does not add an extra provider probe.
- Local smoke verifies troubleshooting still sends no tab data, page text, full URLs, chat history, rules, workspace snapshots, or real user content.
- Model install automation and richer model metadata browsing remain future work.

## 2026-06-12 Common Work-Page Site Skill Registry First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.145

### Current-Page Page Agent Gets Safe Work-Page Reading Hints

Commands:

```bash
node --check extension/background.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
53 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=30330afdfdc245af9b6985ed821032bdbd25d63a1a7128f11f4c513418e56aa2
```

Follow-up notes:

- Current-page Page Agent now has generic site-skill hints for GitHub PRs, GitHub issues, GitHub CI runs, cloud project consoles, Linear/Jira issues, design files, and collaborative docs.
- These hints guide how the Agent reads already-approved visible text; they do not add a new UI surface, permission, background read, browser action, cloud storage, analytics, or hidden data source.
- Local smoke verifies representative work-page payloads exclude owner/repo names, object paths, issue keys, PR/run numbers, design/document IDs, project slugs, query tokens, hashes, and full URLs.
- Real-profile QA remains pending for private GitHub, Linear/Jira, Figma, cloud consoles, and collaborative docs.

## 2026-06-12 GitHub PR Page Skill First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.144

### Current-Page Page Agent Gets A Safe PR Review Hint

Commands:

```bash
node --check extension/background.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
52 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 121 tracked/unignored files
PASS release package verified for v0.1.0
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=12c9ced498cd375a587079aff7b93c58f2695bdb93e3f0908a8a36f02f413763
```

Follow-up notes:

- GitHub pull request pages now send a generic `github_pull_request_review` site-skill hint to Page Agent after the user asks a current-page question.
- The hint guides review-oriented answers from visible text: change intent, review risks, tests/checks, and next review steps.
- Local smoke verifies the payload excludes owner, repo, PR number/path, query token, hash, full URL, hidden DOM, and additional page content beyond the existing visible-text flow.
- No new permission, background page read, browser action, cloud storage, analytics, or automatic PR/repo extraction was added.

## 2026-06-12 Gemini Provider Preset First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.143

### Gemini Is A BYOK OpenAI-Compatible Preset

Commands:

```bash
node --check extension/provider_registry.js
node --check tools/extension_smoke_test.js
node tools/provider_registry_check.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
PASS provider registry checked 18 presets
51 smoke tests passed
PASS AI provider permissions support BYOK hosts without broad required host permissions
PASS AI connection test does not send tab data
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=aa65d5152bbfbcd4526e0adc9a348c0df0ed9987da22fa16ea07c151b84e8a97
```

Follow-up notes:

- Added the Gemini provider preset using the official OpenAI-compatible Base URL and example model.
- The preset only fills Base URL and model in Dashboard Settings.
- Gemini still requires the user's own API key and explicit provider-origin permission before Save/Test.
- No built-in key, new required host permission, provider call, tab action, page read, analytics, or data upload was added by the preset itself.
- Official references used for the preset are recorded in `04_TECH/10_BYOK_PROVIDER_SETUP.md`.

## 2026-06-12 Provider Connection Diagnostics First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.142

### BYOK Test Connection Explains What Was Checked

Commands:

```bash
node --check extension/background.js
node --check extension/dashboard.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
51 smoke tests passed
PASS AI provider permissions support BYOK hosts without broad required host permissions
PASS AI connection test does not send tab data
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=4d79f54d3750d9414b8bcfc37d0adcd0b570df9222435feef5c182b2aa0c51c6
```

Follow-up notes:

- Test AI Connection now returns compact diagnostics for provider label, `/models` vs synthetic ping, model suggestion count, local vs remote endpoint, permission origin, Authorization status, and explicit no-tab/no-page/no-full-URL flags.
- Dashboard renders the diagnostics as a single status line after the connection result.
- Diagnostics reuse the existing model-list or synthetic ping request and do not add an extra provider probe.
- No API key, tab data, page text, full URL, chat history, rule, workspace snapshot, or real user content is included in diagnostics.
- Still pending: model install automation, rich model metadata browser, and provider-specific troubleshooting beyond this compact connection diagnostic line.

## 2026-06-12 Normalized Title Duplicate Review First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.141

### Same-Host Cleaned Titles Enter Review Only

Commands:

```bash
node --check extension/background.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
51 smoke tests passed
PASS duplicate policy closes only safe exact/tracking duplicates
PASS duplicate safety audit stores only counts and allowed types
PASS current run snapshot strips restorable URLs and page text
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=6a17b0dc2b5f0bab69c23da728b073926e4e3a298c533030587e98b17379878c
```

Follow-up notes:

- Added review-only normalized-title duplicate detection for same-host pages whose cleaned titles match but exact URLs differ.
- Title-review groups are not auto-closed and still require Duplicate Review user action.
- Title-review labels stay generic and do not expose page title text.
- Search pages and YouTube video/result pages are excluded from title-review detection.
- Internal title duplicate hashes are stripped from the stored current run snapshot.
- Still pending: full semantic/page-body duplicate review, more SaaS-specific canonical IDs, and real-profile QA.

## 2026-06-12 Provider Model Suggestions First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.140

### Model Suggestions Come From User-Triggered Provider Test

Commands:

```bash
node --check extension/background.js
node --check extension/dashboard.js
node --check tools/extension_smoke_test.js
node tools/provider_registry_check.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
PASS provider registry checked 17 presets
51 smoke tests passed
PASS AI provider permissions support BYOK hosts without broad required host permissions
PASS AI connection test does not send tab data
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=677406e1a7117dbafd1bf5672135819090eecfe100a680e7d92406152a135c47
```

Follow-up notes:

- Dashboard model input now has a native datalist for provider model suggestions.
- `TEST_AI_CONNECTION` returns bounded `modelSuggestions` only from a successful provider `/models` response.
- Synthetic chat fallback does not invent model suggestions.
- Suggestions are not persisted, do not enable AI, do not save settings, and do not send tab/page data.
- Still pending: rich model browser metadata, provider-specific diagnostics beyond `/models` / synthetic ping, and local model install automation.

## 2026-06-12 Advanced SaaS Canonical Dedupe Polish

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.139

### SaaS Same-Object Review Groups Are Wired

Commands:

```bash
node --check extension/background.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
51 smoke tests passed
PASS duplicate policy closes only safe exact/tracking duplicates
PASS current run snapshot strips restorable URLs and page text
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=4bf6163fc4597e01116f99a73d110f9faffa8557c93c7a9b4f444d10631b7851
```

Follow-up notes:

- Added review-only same-object duplicate detection for Google Drive files/folders, GitHub PRs/issues/discussions, Linear issues, Jira Cloud issues, Figma files/design/prototypes, and Notion pages.
- Existing Google Workspace same-document and YouTube same-video handling remains unchanged.
- The safe close plan still closes only exact/tracking duplicates; all new SaaS canonical matches enter Duplicate Review only.
- Duplicate Review labels stay generic and do not expose raw GitHub/Jira/Linear issue IDs, Figma file IDs, Drive file IDs, Notion page IDs, or YouTube video IDs.
- Still pending: title/semantic similarity review, more SaaS-specific canonical IDs, and real-profile QA.

## 2026-06-12 Selected Page-Region Table Structure Polish

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.138

### Selected Region Table Rows Stay Scoped And Redacted

Commands:

```bash
node --check extension/background.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
51 smoke tests passed
PASS Page Agent selected-region payload stays scoped and session-only
PASS Sidebar Agent tool registry has capped multi-tab tools and Apply-gated actions
PASS current tab summary confirms sensitive pages before extraction
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=f01da26051c65f2ae4ec718ab02445d8a9ebee35406b410128c0a0f9dc17c29b
```

Follow-up notes:

- Selected region extraction now includes bounded table rows in addition to table headers, list items, safe link labels, headings, visible text, and ARIA label/role.
- Page Agent selected-region payload sanitizes `tableRows` through the same redaction path as other prompt text.
- The smoke test now verifies selected-region table rows are present and full URLs inside table cells are redacted.
- No screenshot capture/upload, new permission, persistence, broader DOM read, or cloud memory was added.
- Still pending: cropped region screenshot context and real-profile QA against complex SaaS tables.

## 2026-06-12 Selected Page-Region Context First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.137

### Sidebar Selected Region Context Is Wired

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
51 smoke tests passed
PASS Page Agent selected-region payload stays scoped and session-only
PASS Sidebar Agent tool registry has capped multi-tab tools and Apply-gated actions
PASS current tab summary confirms sensitive pages before extraction
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=22b7b3cbd1e24dc1339cac025507af4463c8d9caca0dd5d2e58d6fb3e126f8b4
```

Follow-up notes:

- Added Sidebar commands for selected page-region context, including `select region`, `ask region: ...`, and Chinese selected-region phrases.
- Added a page-local picker that highlights readable blocks, cancels on Esc/timeout, and removes its temporary DOM/listeners after completion.
- Page Agent payload uses `source: selected_region` and includes only selected-region visible text plus safe lightweight structure labels.
- First slice does not capture screenshots, store region content, send full URLs/query/hash, read hidden DOM/form values, or read unrelated page regions.
- Public repo audit now treats D-L02 as confirmed by the user's full-open-source direction while still blocking public push on license, raw archive approval, and real-profile QA.
- Still pending: real-profile SaaS page QA, richer table handling, and optional cropped region screenshot context.

## 2026-06-12 Advanced Domain-Specific Dedupe First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.136

### Google Workspace / YouTube Review-Only Dedupe Is Wired

Commands:

```bash
node --check extension/background.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
50 smoke tests passed
PASS duplicate policy closes only safe exact/tracking duplicates
PASS current run snapshot strips restorable URLs and page text
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=daa3974d7182b94e37289a8add132a86556527d39a8fc93ec50694301772e6a1
```

Follow-up notes:

- Added review-only domain-specific duplicate detection for Google Workspace same-document pages and YouTube same-video pages.
- Different YouTube videos and different search queries are not grouped merely because stripping query parameters yields the same path.
- Domain-specific duplicate candidates are not auto-closed; they enter the existing Duplicate Review flow and require manual confirmation before any close.
- Internal domain duplicate hashes are stripped from the stored current run snapshot.
- YouTube review labels do not expose raw video IDs or query values.

## 2026-06-12 Local LLM Setup Guidance First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.135

### Ollama / LM Studio Setup Help Is Wired And Guarded

Commands:

```bash
node --check extension/dashboard.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
50 smoke tests passed
PASS AI provider permissions support BYOK hosts without broad required host permissions
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=1dc0397e360c9bdb7ff0ee67c7323da2dfc9b44f44825c201db6fbee3a9d2c3d
```

Follow-up notes:

- Added a compact local setup guide for the Ollama and LM Studio presets in hidden/private-beta Dashboard Settings.
- The guide explains how to start the local OpenAI-compatible server and then use Test AI Connection.
- The guide does not save settings, enable AI, call a provider, install models, request permissions, read tabs, read page text, upload data, or widen host permissions.
- Localhost endpoints still use the existing explicit origin permission and connection-test boundaries.
- Model install automation, richer local diagnostics, a local model picker, and Chrome built-in AI remain future work.

## 2026-06-12 Dashboard Selected-Tabs Context Entry First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.134

### Dashboard Selected Tabs Can Open Sidebar Agent Context

Commands:

```bash
node --check extension/background.js
node --check extension/dashboard.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
50 smoke tests passed
PASS dashboard selected tabs open Sidebar Agent context
PASS AI Agent answer sends minimized tab context and sanitized short conversation only
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=be1d7b3498921403fe1ebffb957a04ccf7a1cd6be0d4e67e6509495f0d05058f
```

Follow-up notes:

- Added a Dashboard selected-tabs entry first slice: select 2+ same-window tab rows, then click `Chat selected` to open Sidebar with `selected_tabs` context.
- Dashboard selection is metadata-only and local. It does not read page text, call AI, upload data, move tabs, or close tabs.
- The metadata Agent now preserves `selected_tabs` as active context instead of downgrading it to browser-wide context.
- Multi-tab visible-text reading remains user-triggered from Sidebar and still uses the existing tool-card / optional site permission flow.
- Real-profile QA for the Dashboard selected-tabs entry and native optional site permission prompt remains pending.

## 2026-06-12 Classification Merge Refinement First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.133

### Metadata-Only Merge Suggestions Surface In Sidebar

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
49 smoke tests passed
PASS Agentic Classification V2 derives metadata features and rejects weak domain groups
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=035aad5dc1f31cd0bb798383313fd06cb4737ce5f8f6b07defd6d4db0c82c899
```

Follow-up notes:

- Added metadata-only `classificationInsights.mergeSuggestions` to completed organize runs.
- Sanitized AI-provided `mergeSuggestions` and merged them with conservative local project/workflow merge suggestions.
- Sidebar `Suggested refinements` now renders split and merge suggestions inside the organize assistant message card.
- Suggestions are not applied automatically; the user must explicitly ask for regrouping before browser changes happen.
- This change does not read page bodies, upload full URLs, add permissions, persist page text, or close/move tabs automatically.
- Real-profile classification QA remains pending.

## 2026-06-12 Classification Split Refinement First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.132

### Metadata-Only Split Suggestions Surface In Sidebar

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
49 smoke tests passed
PASS Agentic Classification V2 derives metadata features and rejects weak domain groups
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=17f688b7b7a2cbfa896f2d5e82b0263c8f8998a618081e058759282d5d88c3fa
```

Follow-up notes:

- Added metadata-only `classificationInsights.splitSuggestions` to completed organize runs.
- Sanitized AI-provided `splitSuggestions` and merged them with conservative local project/workflow split suggestions.
- Sidebar now renders folded `Suggested refinements` inside the organize assistant message card.
- Suggestions are not applied automatically; the user must explicitly ask for regrouping before browser changes happen.
- This change does not read page bodies, upload full URLs, add permissions, persist page text, or close/move tabs automatically.
- Merge suggestions and real-profile classification QA remain pending.

## 2026-06-12 Group Summary First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.131

### Current-Group / Selected-Tabs Answers Include Session-Only Group Summary

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
49 smoke tests passed
PASS Multi-tab Page Agent sends capped visible context without full URLs
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=24f383a1a3c0db678971a66a840f1b78925e6d3991e8da21a0dca38e369ab2a0
```

Follow-up notes:

- Added a compact group summary first slice for current-group / selected-tabs Agent answers.
- Summary card is rendered inside the normal assistant message and includes scope label, visible-text/metadata source, read/skipped counts, top hosts/themes, and safe next steps.
- Local fallback preserves group summary when DeepSeek is unavailable or invalid.
- AI validation preserves the local group summary while validating AI tab summaries against real readable tab IDs.
- Group summaries are session-only and are not saved as Tab Knowledge, workspace memory, diagnostics, feedback content, or cloud data.
- This change adds no new permissions, does not read pages in the background, does not send full URLs, and does not apply browser actions.

## 2026-06-12 Saved Workspace Restore First Slice

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.130

### Hidden Saved Workspace Restore Is Wired And Guarded

Commands:

```bash
node --check extension/background.js
node --check extension/dashboard.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/preflight.js
```

Result:

```text
49 smoke tests passed
PASS saved workspace restore regroups only still-open local tab ids
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=99f97ec53ccb4238e21f6b4102099a41759290875faa0c3e0a5a0f4685ce7597
```

Follow-up notes:

- Added hidden/private-beta Dashboard Restore for local saved workspace snapshots.
- Restore uses `RESTORE_SAVED_WORKSPACE` through the background service worker.
- Restore saves Undo before regrouping and publishes restored/skipped counts in the latest run.
- Restore only regroups currently open saved local tab IDs and skips closed, missing, pinned, internal, or incognito tabs.
- Restore does not reopen closed pages, close tabs, read page text, upload data, or store/use full URLs.
- Saved Workspaces remains hidden from the default commercial Dashboard UI; full history restore, cloud sync, export, and workspace chat remain future work.

## 2026-06-12 Provider Contribution Guide Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.129

### Provider Preset Contributions Are Documented And Guarded

Commands:

```bash
node tools/provider_registry_check.js
node tools/beta_readiness_check.js
node tools/preflight.js
```

Result:

```text
PASS provider registry checked 17 presets
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=1de81ab33c79cd5e0f8812c439da145bd5ea7376db590635d6b45f16c5e9e509
```

Follow-up notes:

- Added a provider preset contribution checklist to `04_TECH/10_BYOK_PROVIDER_SETUP.md`.
- Added `Provider Preset Contributions` to `CONTRIBUTING.md`.
- `tools/provider_registry_check.js` now verifies the BYOK guide keeps the provider contribution safety guidance.
- `tools/beta_readiness_check.js` now requires `CONTRIBUTING.md` and checks provider contribution rules.
- `01_PRODUCT/07_OPEN_SOURCE_BYOK_STRATEGY.md` now records the provider registry, provider registry check, and provider contribution guide as implemented public repo assets.
- This is open-source contribution guidance only. It does not alter extension behavior, provider permissions, AI payloads, page-content reading, tab-closing behavior, telemetry, package contents, license status, publication status, or runtime browsing-data handling.

Baseline runtime evidence carried forward from earlier controlled local runs:

```text
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards
tabRows=0, actionButtons=0
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
`--agent-flow` used a temporary Chrome for Testing profile
`--large-runtime` used a separate temporary Chrome for Testing profile
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
blank real-profile QA result template
P0 manual QA runbook has not been run against the user's real Chrome profile.
```

## 2026-06-12 Provider Registry Check Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.128

### BYOK Provider Registry Stays In Sync

Commands:

```bash
node --check tools/provider_registry_check.js
node tools/provider_registry_check.js
node tools/beta_readiness_check.js
node tools/preflight.js
```

Result:

```text
PASS provider registry checked 17 presets
PASS public repo audit checked 121 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; D-L02: public repo boundary remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=1de81ab33c79cd5e0f8812c439da145bd5ea7376db590635d6b45f16c5e9e509
```

Follow-up notes:

- Added `tools/provider_registry_check.js` as a focused checker for `extension/provider_registry.js`.
- The checker validates preset shape, default DeepSeek settings, manifest required host permission, optional provider host permissions, Dashboard select coverage, BYOK guide table coverage, HTTPS/localhost URL boundaries, and known provider host labels.
- Preflight and GitHub Actions now run the provider registry check.
- GitHub Actions syntax checks now include `extension/provider_registry.js`, `extension/popup.js`, `tools/build_store_screenshots.js`, and `tools/write_private_beta_ai_config.js`.
- This is provider-maintenance safety only. It does not alter extension behavior, provider permissions, AI payloads, page-content reading, tab-closing behavior, telemetry, package contents, license status, publication status, or runtime browsing-data handling.

Baseline runtime evidence carried forward from earlier controlled local runs:

```text
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards
tabRows=0, actionButtons=0
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
`--agent-flow` used a temporary Chrome for Testing profile
`--large-runtime` used a separate temporary Chrome for Testing profile
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
blank real-profile QA result template
P0 manual QA runbook has not been run against the user's real Chrome profile.
```

## 2026-06-12 Public Repo Candidate Secret Audit Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.127

### Public Repo Audit Covers Candidate Secrets

Commands:

```bash
node --check tools/public_repo_audit.js
node tools/public_repo_audit.js
node tools/beta_readiness_check.js
node tools/preflight.js
```

Result:

```text
PASS public repo audit checked 120 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; D-L02: public repo boundary remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
sha256=1de81ab33c79cd5e0f8812c439da145bd5ea7376db590635d6b45f16c5e9e509
```

Follow-up notes:

- `tools/public_repo_audit.js` now scans tracked plus unignored candidate files for common secret patterns before public repo work.
- Candidate secret scanning covers OpenAI-compatible `sk-...` keys and bearer token literals.
- Synthetic smoke-test keys such as `sk-secret` remain allowed only inside `tools/extension_smoke_test.js`.
- README and `05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md` now describe candidate-secret scanning as part of the public repo audit.
- Beta readiness now verifies the public repo audit script contains the candidate-secret guardrails.
- This is public-source hygiene only. It does not alter extension permissions, provider behavior, page-content reading, tab-closing behavior, AI payloads, telemetry, package contents, license status, publication status, or runtime browsing-data handling.

Baseline runtime evidence carried forward from earlier controlled local runs:

```text
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards
tabRows=0, actionButtons=0
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
`--agent-flow` used a temporary Chrome for Testing profile
`--large-runtime` used a separate temporary Chrome for Testing profile
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
blank real-profile QA result template
P0 manual QA runbook has not been run against the user's real Chrome profile.
```

## 2026-06-12 Shared BYOK Provider Registry Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.126

### Provider Registry And Release Package Integrity

Commands:

```bash
node --check extension/provider_registry.js
node --check extension/popup.js
node --check extension/background.js
node --check extension/dashboard.js
node --check tools/extension_smoke_test.js
node tools/public_repo_audit.js
node tools/issue_form_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Result:

```text
PASS public repo audit checked 120 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; D-L02: public repo boundary remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS issue form smoke checked 5 forms
48 smoke tests passed
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=1de81ab33c79cd5e0f8812c439da145bd5ea7376db590635d6b45f16c5e9e509
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
```

Follow-up notes:

- Added `extension/provider_registry.js` as the shared source for BYOK provider presets, known provider host labels, default DeepSeek host, and default AI settings.
- Background and Dashboard now import the shared provider registry, so future open-source provider contributions have one primary implementation file.
- Extension smoke tests now load the provider registry before background logic and verify every registry preset appears in the Dashboard provider dropdown.
- Package generation now includes `provider_registry.js`, `popup.html`, and `popup.js`.
- Release package verification now fails if the shared provider registry or toolbar popup files are missing from the zip.
- Unified preflight now syntax-checks `extension/provider_registry.js` and `extension/popup.js`.
- This change does not alter default one-click metadata-only classification, provider-origin permission requirements, page-content reading defaults, tab-closing policy, telemetry, license status, publication status, or runtime browsing-data handling.

Baseline runtime evidence carried forward from earlier controlled local runs:

```text
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards
tabRows=0, actionButtons=0
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
`--agent-flow` used a temporary Chrome for Testing profile
`--large-runtime` used a separate temporary Chrome for Testing profile
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
blank real-profile QA result template
P0 manual QA runbook has not been run against the user's real Chrome profile.
```

## 2026-06-12 Expanded BYOK Provider Presets Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.125

### More OpenAI-Compatible Provider Choices

Commands:

```bash
node --check extension/background.js
node --check extension/dashboard.js
node --check tools/extension_smoke_test.js
node tools/public_repo_audit.js
node tools/issue_form_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Result:

```text
PASS public repo audit checked 119 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; D-L02: public repo boundary remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS issue form smoke checked 5 forms
48 smoke tests passed
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=2b4257bd47c801ddb7e8b473e4dd171eaded0c41e47cd8b4bfadc5ff11f0e698
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
```

Follow-up notes:

- Dashboard AI Settings now includes presets for DeepSeek, OpenAI, OpenRouter, Groq, Together AI, Mistral AI, xAI, Perplexity, Cerebras, Fireworks AI, DeepInfra, SiliconFlow, Kimi / Moonshot, MiniMax, DashScope / Qwen, LM Studio, and Ollama.
- Presets only fill Base URL and model. They do not save, test, enable AI, request permission, or send data by themselves.
- AI connection testing now tries a provider model-list endpoint first and falls back to a fixed synthetic chat ping only when model listing is unavailable.
- The synthetic ping sends no tab data, page text, full URLs, chat history, rules, workspace snapshots, or real user content.
- Known provider hosts now get provider-specific local labels; unknown OpenAI-compatible hosts still work through the generic custom provider path.
- This change does not alter default one-click metadata-only classification, provider-origin permission requirements, page-content reading defaults, tab-closing policy, telemetry, license status, publication status, or runtime browsing-data handling.

Baseline runtime evidence carried forward from earlier controlled local runs:

```text
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards
tabRows=0, actionButtons=0
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
`--agent-flow` used a temporary Chrome for Testing profile
`--large-runtime` used a separate temporary Chrome for Testing profile
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
blank real-profile QA result template
P0 manual QA runbook has not been run against the user's real Chrome profile.
```

## 2026-06-12 Brand / Domain Preliminary Scan Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.124

### Public Name Risk Before Publishing

Commands:

```bash
node --check tools/beta_readiness_check.js
node tools/public_repo_audit.js
node tools/issue_form_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Result:

```text
PASS public repo audit checked 119 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; D-L02: public repo boundary remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS issue form smoke checked 5 forms
48 smoke tests passed
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=8b2870963595a7298030f91522f3e83ede1da5ba287a7d75d87c2d0ce08a29c1
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
```

Follow-up notes:

- Added `01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md` after a preliminary real-time scan found a Chrome Web Store extension named `Tab Mosaic`.
- Added D-001-A so public brand/domain finalization stays separate from the current working product name.
- `TabMosaic AI` remains usable as the internal beta working name, but it should not be treated as the final public brand until the user reviews the near-name conflict, domain availability, and trademark risk.
- README, INDEX, launch checklist, public launch decision packet, open-source strategy, and beta readiness checks now point to the brand/domain scan.
- No product rename, domain purchase, trademark decision, store listing name, or public launch decision was finalized.
- This is documentation/check coverage only. It does not alter extension permissions, provider behavior, page-content reading, tab-closing behavior, AI payloads, telemetry, license status, publication status, or runtime data handling.

Baseline runtime evidence carried forward from earlier controlled local runs:

```text
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards
tabRows=0, actionButtons=0
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
`--agent-flow` used a temporary Chrome for Testing profile
`--large-runtime` used a separate temporary Chrome for Testing profile
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
blank real-profile QA result template
P0 manual QA runbook has not been run against the user's real Chrome profile.
```

## 2026-06-12 Public Repo Cleanup Checklist Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.123

### Public Repo Hygiene Before Publishing

Commands:

```bash
node --check tools/beta_readiness_check.js
node tools/public_repo_audit.js
node tools/issue_form_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Result:

```text
PASS issue form smoke checked 5 forms
PASS public repo audit checked 118 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; D-L02: public repo boundary remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
48 smoke tests passed
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=8b2870963595a7298030f91522f3e83ede1da5ba287a7d75d87c2d0ce08a29c1
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
```

Follow-up notes:

- Added `05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md` to document the pre-public repo hygiene pass.
- Added `tools/public_repo_audit.js` to audit tracked and unignored files before public repo work.
- The checklist covers keep/exclude file boundaries, generated artifacts, ignored local outputs, raw archive decision gates, secret scan, real-profile QA notes, README audit, draft legal/store docs, and final public push checks.
- `.gitignore` now ignores `output/` alongside `dist/`, `artifacts/`, and `extension/private-beta-ai-settings.json`.
- `tools/preflight.js` and GitHub Actions now run the public repo audit.
- `tools/beta_readiness_check.js` now verifies that the cleanup checklist exists, remains draft-only, includes the raw archive decision gate, verifies the audit script exists, and that `.gitignore` excludes generated local outputs.
- Raw imported archives were not deleted or untracked. `06_REFERENCES/ARCHIVES/TabPilot-AI-UI.zip` remains a user confirmation gate before public repo launch.
- This is documentation/check coverage only. It does not alter extension permissions, provider behavior, page-content reading, tab-closing behavior, AI payloads, telemetry, license status, publication status, or runtime data handling.

Baseline runtime evidence carried forward from earlier controlled local runs:

```text
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards
tabRows=0, actionButtons=0
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
`--agent-flow` used a temporary Chrome for Testing profile
`--large-runtime` used a separate temporary Chrome for Testing profile
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
blank real-profile QA result template
P0 manual QA runbook has not been run against the user's real Chrome profile.
```

## 2026-06-12 Public Launch Decision Packet Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.122

### Confirmation Packet For Public Launch Blockers

Commands:

```bash
node --check tools/beta_readiness_check.js
node tools/issue_form_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Result:

```text
PASS issue form smoke checked 5 forms
48 smoke tests passed
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=8b2870963595a7298030f91522f3e83ede1da5ba287a7d75d87c2d0ce08a29c1
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
```

Follow-up notes:

- Added `05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md` to consolidate remaining public-launch confirmation gates into one approval packet.
- The packet recommends Apache-2.0 for the license, publishing the local extension core/docs/tools, retaining BYOK in the first public build, shipping with no remote analytics involving browsing activity, requiring redacted real-profile QA, and waiting to post/submit until the decisions are resolved.
- README, INDEX, launch checklist, open-source strategy, and beta readiness checks now point to the decision packet.
- No `LICENSE` file was added; open-source license remains a confirmation gate.
- No final license, domain, pricing, analytics policy, store disclosure, screenshot/demo approval, or public launch decision was silently approved.
- This is documentation/check coverage only. It does not alter extension permissions, provider behavior, page-content reading, tab-closing behavior, AI payloads, telemetry, or runtime data handling.

Baseline runtime evidence carried forward from earlier controlled local runs:

```text
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards
tabRows=0, actionButtons=0
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
`--agent-flow` used a temporary Chrome for Testing profile
`--large-runtime` used a separate temporary Chrome for Testing profile
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
blank real-profile QA result template
P0 manual QA runbook has not been run against the user's real Chrome profile.
```

## 2026-06-12 Public Launch Materials Draft Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.121

### Landing / Demo / PH / HN / X Drafts

Commands:

```bash
node --check tools/beta_readiness_check.js
node tools/issue_form_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Result:

```text
PASS issue form smoke checked 5 forms
48 smoke tests passed
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=8b2870963595a7298030f91522f3e83ede1da5ba287a7d75d87c2d0ce08a29c1
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
```

Follow-up notes:

- Added `05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md` with draft landing page copy/wireframe, before/after demo storyboard, Product Hunt materials, Hacker News launch post, X/Twitter thread, SEO metadata, and pre-publish review checklist.
- Launch checklist now separates draft marketing materials from final published/approved assets.
- `tools/beta_readiness_check.js` now verifies that the public launch materials draft exists, remains draft-only, and covers landing/demo/Product Hunt/HN/X/SEO surfaces.
- The draft explicitly says not to publish/post/record/submit yet and keeps public Chrome Web Store launch marked not ready.
- No `LICENSE` file was added; open-source license remains a confirmation gate.
- This is documentation/check coverage only. It does not alter extension permissions, provider behavior, page-content reading, tab-closing behavior, AI payloads, telemetry, or runtime data handling.

Baseline runtime evidence carried forward from earlier controlled local runs:

```text
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards
tabRows=0, actionButtons=0
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
`--agent-flow` used a temporary Chrome for Testing profile
`--large-runtime` used a separate temporary Chrome for Testing profile
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
blank real-profile QA result template
P0 manual QA runbook has not been run against the user's real Chrome profile.
```

## 2026-06-12 Public README + Privacy Architecture Explainer Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.120

### Open-Source First Screen + Privacy Architecture

Commands:

```bash
node --check tools/beta_readiness_check.js
node tools/issue_form_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Result:

```text
PASS issue form smoke checked 5 forms
48 smoke tests passed
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=8b2870963595a7298030f91522f3e83ede1da5ba287a7d75d87c2d0ce08a29c1
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
```

Follow-up notes:

- README now starts with a public-facing open-source AI browser layer first screen, local test commands, readiness status, and links to self-test, BYOK setup, privacy architecture, and contribution docs.
- Added `04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md` as a public explainer for minimized metadata classification, user-triggered page reads, selected-tabs/group context reads, BYOK provider boundaries, local storage, diagnostics, Restore Closed, and Apply-gated browser actions.
- Marked `Open-source README first screen` and `Privacy architecture explainer` complete in the launch checklist.
- Extended `tools/beta_readiness_check.js` so preflight verifies the README first screen and privacy explainer.
- No `LICENSE` file was added; open-source license remains a confirmation gate.
- This is documentation/check coverage only. It does not alter extension permissions, provider behavior, page-content reading, tab-closing behavior, AI payloads, telemetry, or runtime data handling.

Baseline runtime evidence carried forward from earlier controlled local runs:

```text
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore
open-ended chat fallback
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards
tabRows=0, actionButtons=0
latest organize results rendered as one assistant message bubble
optimization/memory-relief answer
PASS Chrome runtime large-tab probe organized 96 synthetic tabs
`--agent-flow` used a temporary Chrome for Testing profile
`--large-runtime` used a separate temporary Chrome for Testing profile
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
blank real-profile QA result template
P0 manual QA runbook has not been run against the user's real Chrome profile.
```

## 2026-06-12 Open-Source Contribution Scaffolding Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.119

### Public Contribution Guide + Issue Forms

Commands:

```bash
node tools/issue_form_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Result:

```text
PASS issue form smoke checked 5 forms
48 smoke tests passed
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=8b2870963595a7298030f91522f3e83ede1da5ba287a7d75d87c2d0ce08a29c1
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
PASS preflight completed
```

Follow-up notes:

- Added `CONTRIBUTING.md` for public repo contribution workflow, privacy redlines, PR expectations, and local checks.
- Added public issue forms for provider requests, grouping-quality feedback, and UI bugs.
- Extended issue form smoke coverage from 2 private-beta forms to 5 total forms.
- Public forms require submitters to review before submitting and avoid API keys, bearer tokens, cookies, full URLs, tab titles, page text, emails, screenshots with private content, and private rule patterns.
- No `LICENSE` file was added; open-source license remains a confirmation gate.
- This is repository scaffolding only. It does not alter extension permissions, provider behavior, page-content reading, tab-closing behavior, AI payloads, telemetry, or runtime data handling.
- Baseline controlled runtime evidence remains carried forward from the v0.113/v0.117 QA runs, including `node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots`, `PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore`, `open-ended chat fallback`, `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards`, `tabRows=0, actionButtons=0`, `latest organize results rendered as one assistant message bubble`, `optimization/memory-relief answer`, `PASS Chrome runtime large-tab probe organized 96 synthetic tabs`, `--agent-flow` used a temporary Chrome for Testing profile, `--large-runtime` used a separate temporary Chrome for Testing profile, `PASS UI screenshots captured`, `PASS store screenshot drafts captured`, `PASS synthetic classification fixture completed`, `fixtureGroupCount=2`, `fixtureAssignedTabs=3`, and the blank real-profile QA result template.
- P0 manual QA runbook has not been run against the user's real Chrome profile.

## 2026-06-12 BYOK Provider Presets Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.118

### Multi-provider BYOK Settings

Commands:

```bash
node --check extension/background.js
node --check extension/dashboard.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Result:

```text
locale json ok
48 smoke tests passed
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=8b2870963595a7298030f91522f3e83ede1da5ba287a7d75d87c2d0ce08a29c1
```

Follow-up notes:

- Dashboard AI Settings now includes presets for DeepSeek, OpenAI, OpenRouter, Groq, Together AI, Mistral AI, xAI, Perplexity, Cerebras, Fireworks AI, DeepInfra, SiliconFlow, Kimi / Moonshot, MiniMax, DashScope / Qwen, LM Studio, and Ollama.
- Presets only fill Base URL and model; they do not save, test, enable AI, or request permissions until the user clicks Save/Test.
- Remote providers still require HTTPS, explicit provider-origin permission, and a user-provided API key.
- Localhost OpenAI-compatible endpoints can be tested/used without an API key when the local server does not require auth; no Authorization header is sent when the API key is blank.
- Added `04_TECH/10_BYOK_PROVIDER_SETUP.md` as the first setup guide for provider presets, local endpoints, and privacy/permission boundaries.

## 2026-06-12 Content-Assisted Regrouping Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.117

### Sidebar Content Regroup Agent Preview

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/chrome_runtime_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Result:

```text
locale json ok
48 smoke tests passed
PASS Chrome runtime read synthetic HTTP page content with a temporary fixture host grant, rendered content regroup preview, and applied native groups
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, context-aware composer state, selected-tabs context tool card, selected-tabs follow-up routing, ephemeral chat thread, capability answer, open-ended chat fallback, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=e32109f2a9ee913c5d3db117a232c10692f4c3da93d64b466440fae07de27aa8
PASS preflight completed
```

Follow-up notes:

- Sidebar Agent now routes selected-tabs/current-group content-regroup requests through `REGROUP_CONTEXT_TABS`.
- The flow renders a tool card, reads capped visible text only after the user-triggered request, and returns an Apply / Cancel regroup preview as an assistant message card.
- The OpenAI-compatible regroup payload excludes full URLs, query strings, hashes, browser history, saved workspace contents, persistent summaries, and TabMosaic cloud storage.
- Smoke coverage verifies redaction of full URLs, query tokens, API-key-like strings, and connection strings.
- AI proposed tab IDs are validated against real readable tabs; invented and duplicate IDs are dropped before rendering Apply.
- The Apply path creates native Chrome groups only after user Apply, keeps Undo, and does not close tabs.
- Chrome runtime smoke now opens synthetic HTTP pages in a temporary Chrome profile, verifies selected-tabs visible-text extraction, renders a content-regroup preview, clicks Apply, and verifies native Chrome group creation without closing tabs.
- The automated synthetic HTTP probe uses a temporary fixture host grant because CDP cannot accept Chrome's browser-native optional site permission prompt from the extension page target.
- Native optional site permission prompt acceptance remains a manual/runtime QA gap recorded in the test plan.

## 2026-06-12 BYOK Provider Permission Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.116

### BYOK Provider Settings + Permission Flow

Commands:

```bash
node --check extension/background.js
node --check extension/dashboard.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Result:

```text
locale json ok
47 smoke tests passed
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=e8b1e914e5d5d5b54430804f46aee4e24871437a2d4f82e89a53f6bdb9007bf2
```

Follow-up notes:

- Dashboard AI Settings now supports user-configured OpenAI-compatible Base URL, model, and API key while keeping DeepSeek as the default provider.
- Custom HTTPS provider hosts and `http://localhost` local model endpoints require explicit provider-origin permission before save/test.
- Remote HTTP provider URLs are rejected; Base URLs with username, password, query string, or hash are rejected.
- AI connection testing sends no tab data, page text, full URLs, chat history, rules, workspace snapshots, or real user content. It uses provider model-list endpoints first and a fixed synthetic chat ping only when model listing is unavailable.
- Background `chat/completions` calls check provider-origin permission before use and fall back to local rules/answers on provider failure.
- Required host permissions remain narrow: `https://api.deepseek.com/*`; custom provider origins remain optional/user-triggered.
- This follow-up did not run real Chrome runtime, large-tab runtime, DeepSeek network smoke, or screenshot capture. Previous controlled runtime evidence remains recorded below.

## 2026-06-12 Toolbar Menu + Vertical Tabs Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.114

### Compact Toolbar Menu Implementation

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/popup.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/manifest.json','utf8')); console.log('json ok')"
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Result:

```text
json ok
47 smoke tests passed
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
PASS preflight completed
sha256=4622514442cb8d133baea95e803c6e3fd861fb45da02c83436dcd0c42406b917
```

Follow-up notes:

- Toolbar click now opens the compact TabMosaic action menu with Smart Organize, Vertical Tabs, Current Page Chat, and Dashboard.
- Smart Organize delegates to the background `RUN_TOOLBAR_ACTION` path, opens the side panel, and keeps the existing privacy gate / organize pipeline.
- Vertical Tabs opens a lightweight side-panel mode using tab metadata, native group state, favicons, and tab focus only.
- This follow-up did not run real Chrome runtime, large-tab runtime, DeepSeek runtime, or screenshot capture. The previous controlled local private-beta runtime evidence remains recorded below.

## 2026-06-11 Local Verification Follow-up

Status: PASSED for local private-beta evidence
Machine scope: local workspace
Real browsing data used: No
Secrets printed: No
Source state verified: v0.113

### v0.113 Context Tabs Agent First Slice

Commands:

```bash
git diff --check
node --check extension/background.js
node tools/extension_smoke_test.js
node tools/preflight.js --runtime --agent-flow --screenshots --deepseek-fixture
```

Result:

```text
PASS secret scan checked 103 tracked files
47 smoke tests passed
PASS issue form smoke checked 2 forms
PASS DeepSeek/OpenAI-compatible /models reachable
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, context-aware composer state, selected-tabs context tool card, selected-tabs follow-up routing, ephemeral chat thread, capability answer, open-ended chat fallback, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PASS preflight completed
sha256=a5e251692ca55418aba78c467578eb57bcd5f93c8270bed6fb8c1a722fb2acad
```

Follow-up notes:

- Sidebar now routes current-group and selected-tabs deep questions through the concrete `SUMMARIZE_CONTEXT_TABS` flow.
- The context-tabs flow renders a compact tool card, caps private-beta visible-text reads at 6 tabs, preserves selected-tabs/current-group scope, and reports skipped tabs.
- The Sidebar now requests optional per-site access only for specific http/https origins in a user-triggered group/selected-tabs batch and releases granted origins after the answer.
- Background context extraction skips over-cap, protected, restricted, sensitive, empty, unavailable, and unreadable tabs instead of claiming full coverage.
- DeepSeek multi-tab Page Agent payloads include capped visible text, titles, hostnames, headings, selected text, skipped reasons, and tool-card counts only; full URLs/query/hash, browser history, saved workspace contents, persistent summaries, and TabMosaic cloud storage are excluded.
- AI tab summaries are validated against real readable tab IDs; invented tab summaries are dropped before rendering.
- Group/selected-tabs follow-up routing is now session-only for the same active scope and sends at most 10 local Q/A turns for reference resolution.
- DeepSeek `/models` and synthetic classification fixture passed after this change.
- Real Chrome runtime smoke passed in a temporary profile with synthetic tabs, including one-click organize, selected-tabs context tool-card rendering, selected-tabs natural follow-up routing, Restore Closed, local chat commands, Dashboard apply/move/drag-drop/focus/workspace save/delete, and local read-only Agent answers.
- Real Chrome DeepSeek Agent flow passed in a temporary profile: plain assistant answer, short follow-up, validated `move_tabs` draft, and Apply into a native Chrome group.
- Mock UI screenshots now include `artifacts/ui-screenshots/sidepanel-context-tabs.png`, showing the selected-tabs tool card plus a context summary answer.
- This follow-up did not read real browser tabs or the user's Chrome profile. DeepSeek checks used the local `.env.local` API key only inside test calls; no secrets were printed.
- Runtime / screenshots / DeepSeek classification fixture evidence from the previous controlled local private-beta run remains recorded below. Runtime QA for accepted optional per-site permission prompts and successful synthetic HTTP page extraction after permission grant is still pending.

## 2026-06-10 Local Verification

Status: PASSED for local private-beta evidence  
Machine scope: local workspace  
Real browsing data used: No  
Secrets printed: No
Source state verified: v0.111

### Unified Preflight

Command:

```bash
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots --deepseek-fixture
```

Result:

```text
PASS secret scan checked 103 tracked files
42 smoke tests passed
PASS issue form smoke checked 2 forms
PASS DeepSeek/OpenAI-compatible /models reachable
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, context-aware composer state, ephemeral chat thread, capability answer, open-ended chat fallback, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
PASS Chrome runtime large-tab probe organized 96 synthetic tabs in 858ms with 8 groups, 96 moved tabs, 8 safe duplicate closes, and 9 review duplicate groups
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PASS preflight completed
```

Evidence notes:

- This preflight run called DeepSeek for `/models` and a synthetic 3-tab classification fixture; runtime/UI tests used synthetic tabs and did not read real browser tabs or page text.
- `--runtime` used a temporary Chrome for Testing profile with synthetic tabs and verified real native tab groups plus Dashboard apply/tab move/drag-drop/focus/workspace save/delete/duplicate focus/undo/restore, real Sidebar composer command submission, context-aware composer state, ephemeral chat thread rendering, capability/help answer, open-ended chat fallback without DeepSeek, Sidebar workspace save command, next-step answer, current-page chat summary/page-question rendering, latest-run read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, active/protected/read-later answers, and tab search/open.
- `--agent-flow` used a temporary Chrome for Testing profile with synthetic tabs, enabled DeepSeek only inside that temporary extension storage, submitted an open-ended question through the real Sidebar composer, verified plain metadata-only assistant message cards with no relevant tab rows or automatic action chips, submitted `Why those tabs?` as a follow-up using short-term conversation context, then verified a DeepSeek-generated `move_tabs` Apply/Cancel draft could be applied into a real native Chrome group without closing tabs.
- `--large-runtime` used a separate temporary Chrome for Testing profile with 96 synthetic tabs and verified the real native group path, safe duplicate closes, review duplicate groups, bounded runtime, and sanitized run snapshots.
- `--screenshots` generated mock-data UI screenshots for the chat-first Tab Agent side panel result state, current-page chat state, and Smart Groups Dashboard and did not read real browser tabs or `.env.local`.
- `--screenshots` also generated five local 1280x800 Chrome Web Store screenshot drafts from the mock UI screenshots. These are review drafts only and remain marked `DO NOT SUBMIT YET`.
- Runtime smoke can still `SKIP` on branded Google Chrome CLI extension loading, but this run auto-detected Chrome for Testing through Playwright and passed.
- Extension smoke verifies the DeepSeek Agent answer path sends minimized current run metadata, active Sidebar context, and up to 4 sanitized recent user/assistant chat turns only; filters invented tab IDs; rejects destructive action drafts; and renders no automatic browser actions before user Apply.
- Release package verifier checks required extension files and rejects `.env*`, source maps, `node_modules`, `.DS_Store`, `__MACOSX`, and `.git` metadata.
- Beta readiness check confirms controlled local/private beta evidence is present, including the large-runtime evidence, while public Chrome Web Store launch remains blocked.
- Beta readiness check also verifies that the real-profile QA result template exists and includes privacy redaction rules.
- Beta readiness check also verifies that the standalone privacy policy draft exists, remains unpublished, keeps required placeholders, and includes Limited Use / permissions / deletion disclosures.
- Beta readiness check also verifies that the standalone Chrome Web Store data disclosure draft exists, remains unsubmitted, keeps the final dashboard confirmation gate, maps sensitive data categories, and records the optional BYOK/no-analytics boundaries.
- GitHub Actions runs the same beta readiness check after release package verification.
- Beta readiness check requires the beginner self-test guide and its controlled-beta/public-launch boundary.
- Disposable manual QA checklist self-test verifies that testers can copy the blank redaction-safe real-profile QA template before testing a non-critical real profile, and now includes DeepSeek Agent open-answer / move-draft checks for optional AI QA.
- Dashboard local workspace save stores only minimized local snapshot metadata and excludes full URLs, restore URLs, URL hashes, favicon URLs, and page text; Dashboard local workspace delete removes only the selected local snapshot.

### v0.111 Current-Page Chat Loading Follow-up

Commands:

```bash
node tools/extension_smoke_test.js
node tools/deepseek_smoke_test.js --page-agent-fixture
node tools/deepseek_smoke_test.js --page-agent-10-turn-fixture
node tools/chrome_runtime_smoke_test.js --agent-flow
node tools/capture_ui_screenshots.js
node tools/build_store_screenshots.js
node tools/preflight.js
```

Result:

```text
43 smoke tests passed
PASS synthetic Page Agent fixture completed
PASS synthetic Page Agent 10-turn fixture completed
pageAgent10TurnAverage=9.8
pageAgent10TurnMin=8.7
pageAgent10TurnPassed=yes
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=f1930bf50fe721a254932be92ef009feec1d380d612b727d7325b9b374b1f561
```

Follow-up notes:

- DeepSeek Page Agent is now wired for current-tab page chat after a user-triggered current-page request and any sensitive-page confirmation.
- Extension smoke verifies the Page Agent payload sends current-tab visible text and up to 10 local page-chat Q/A turns only, excludes full URL/query/hash, excludes multi-tab page bodies, and redacts obvious API-key-like strings and connection strings best-effort.
- `--page-agent-10-turn-fixture` used synthetic Supabase Database settings visible text and real DeepSeek chat/completions for 10 consecutive current-page questions. It scored each turn against grounding, continuity, directness, and safety. Average was 9.8/10 and lowest turn was 8.7/10.
- Current-page chat now keeps up to 10 local Q/A turns for follow-up resolution. This remains in-memory and is sent only during user-triggered current-page requests.
- `--agent-flow` was rerun after the Page Agent changes and verified the existing DeepSeek metadata Agent composer path still works: plain assistant answer, follow-up context, validated `move_tabs` draft, and Apply into a real native Chrome group with synthetic tabs only.
- If DeepSeek Page Agent fails, current-page chat falls back to local visible-text summary / matching.
- Database, connection, and Supabase contexts now require sensitive-page confirmation before visible text extraction.
- Current-page loading states now render as replaceable assistant loading messages, so `Checking the active page...` and `Extracting visible text...` do not remain as separate chat bubbles after the final answer.
- Chrome internal / restricted page reads now return one natural unreadable-page reply instead of exposing technical extension wording.
- Unreadable current-page replies now distinguish browser/extension pages, missing temporary site permission, protected pages, and empty visible text instead of collapsing everything into the same sentence.
- Natural content questions such as `当前页面有什么内容` now route to current-page chat instead of the metadata-only Agent fallback.
- Natural follow-ups such as `is point-in-time recovery enabled?`, `could this page help...`, and `summarize the action plan...` now continue in current-page chat after the first page answer.
- DeepSeek metadata-only open answers now render as plain assistant bubbles without relevant tab rows or automatic action chips; explicit `move_tabs` drafts still use Apply / Cancel.
- Sidebar visuals now follow a Notion AI-style page-chat reference more closely: lighter header, softer message bubbles, textarea composer, icon send button, and current-tab context beside the composer.
- Mock `sidepanel-chat.png` and store screenshot draft `04-page-chat.png` now show a realistic current-page Q&A scenario instead of only a tab-move draft.
- Mock `sidepanel-10-turn-chat.png` now captures a 10-turn current-page chat state for visual review and verifies messages sit near the context/composer without a large bottom gap.
- Current-page chat now has up to 10 local Q/A turns for follow-up routing on the same tab. Natural follow-ups continue page Q&A, while explicit tab-management questions remain routed to the tab Agent.
- `node tools/preflight.js --deepseek-fixture` was also attempted. `/models` was reachable, but the synthetic chat/completions fixture returned invalid JSON, so the fixture was not recorded as passing in this follow-up. This did not involve real browsing data or page text.

### v0.110 Sidebar Simplification Follow-up

Commands:

```bash
node tools/extension_smoke_test.js
node tools/deepseek_smoke_test.js
node tools/preflight.js --deepseek-fixture
```

Result:

```text
42 smoke tests passed
PASS DeepSeek/OpenAI-compatible /models reachable
PASS synthetic classification fixture completed
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PASS preflight completed
```

Follow-up runtime notes:

- `node tools/chrome_runtime_smoke_test.js` was rerun after the Sidebar simplification. Old current-page label assertions were updated, but the latest full runtime attempt did not complete and was stopped after the temporary Chrome for Testing process hung. No temporary runtime process was left running.
- `node tools/chrome_runtime_smoke_test.js --agent-flow` reached the real Sidebar composer path but the temporary Chrome extension request to DeepSeek failed with `Failed to fetch`. A separate Node provider smoke immediately before/after confirmed `/models` was reachable, so this is recorded as a Chrome-extension runtime fetch issue to rerun, not as a passed Agent-flow verification for this change.
- The v0.110 local smoke coverage verifies the new simplified Sidebar contract: current-page answers no longer render separate `Current page` / `Question` labels, AI Agent cards no longer render a per-message privacy footnote or separate suggested-next-steps block, and visible Agent text is sanitized for internal window/tab/group IDs.

### DeepSeek / OpenAI-Compatible Provider

Command:

```bash
node tools/deepseek_smoke_test.js
node tools/deepseek_smoke_test.js --classify-fixture
node tools/deepseek_smoke_test.js --page-agent-fixture
node tools/deepseek_smoke_test.js --page-agent-10-turn-fixture
```

Result:

```text
PASS DeepSeek/OpenAI-compatible /models reachable
baseUrl=https://api.deepseek.com
configuredModel=deepseek-v4-flash
modelAvailable=yes
modelCount=2
SKIP synthetic classification fixture; pass --classify-fixture to test chat/completions with fake tabs.
PASS DeepSeek/OpenAI-compatible /models reachable
baseUrl=https://api.deepseek.com
configuredModel=deepseek-v4-flash
modelAvailable=yes
modelCount=2
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS DeepSeek/OpenAI-compatible /models reachable
baseUrl=https://api.deepseek.com
configuredModel=deepseek-v4-flash
modelAvailable=yes
modelCount=2
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=118
pageAgentKeyPoints=4
PASS synthetic Page Agent 10-turn fixture completed
pageAgent10TurnAverage=9.8
pageAgent10TurnMin=8.7
pageAgent10TurnPassed=yes
```

Evidence notes:

- `.env.local` was used locally but not printed.
- The default `/models` check sends no tab data.
- The synthetic classification fixture used fake tabs only and did not use real browser data.
- The synthetic Page Agent fixture used fake visible page text only, did not read real browser pages, and verified DeepSeek returned a JSON answer grounded in that synthetic page text.
- The synthetic Page Agent 10-turn fixture used fake visible page text only, did not read real browser pages, and scored each answer for grounding, continuity, directness, and safety.
- The provider smoke uses bounded network calls and rejects non-DeepSeek hosts before fetch in this private beta.
- The synthetic fixture group count may vary by model response; pass criteria are fixture completion, no invented tab IDs, and all three synthetic tabs assigned.
- The extension private beta only permits `https://api.deepseek.com/*`; other OpenAI-compatible hosts require later permission confirmation.

### Extension Smoke Test

Command:

```bash
node tools/extension_smoke_test.js
```

Result:

```text
42 smoke tests passed
```

Covered:

- MV3 manifest toolbar-menu guardrails.
- Narrow permissions and compact `default_popup` action menu.
- English-only visible UI guard, with Chinese locale keys retained only as future localization material.
- Permission explanation alignment.
- Side panel minimal glass UI guard: result and Chat are default, technical browser details are hidden from the default chat surface, and internal next-build QA copy is absent.
- Dashboard minimal glass workbench structure guard.
- Side panel opens as a chat-first Tab Agent UI with message thread, bottom composer, and latest organize results rendered as one assistant message bubble rather than separate top status/result/action cards.
- Side panel composer direct command router triggers current-tab summary, organize, Undo, Restore Closed, and Dashboard before falling back to Chat Refine.
- Side panel quick action chips route through the same chat command path as typed commands.
- Side panel keeps recent user and Agent messages in a local in-memory thread.
- Side panel answers capability/help questions locally without page reads, AI calls, or requiring an organize run.
- Side panel current-page summary and page questions render inside the chat message flow while the legacy summary panel stays hidden.
- Side panel composer answers latest organize result, groups, duplicate handling, duplicate review queue, closed duplicate restore state, AI status, active-tab state, protected-tab state, and possible read-later candidates from local run state.
- Side panel composer searches the latest local tab snapshot and focuses an existing tab through the Open action.
- Dashboard default page removes Latest Result, timestamp, Current Workspace card, and result metrics area.
- Dashboard filter chips filter All / AI groups / Rule groups and expose localized empty state copy.
- Dashboard tab title focus guard: localized title button, background action, active-tab update, window focus, and no tab close action.
- Dashboard Duplicate Center detail guard: expandable duplicate groups, local tab rows, safe focus existing tab action, and no direct tab close action.
- Dashboard same-window tab move/drag-drop guard: target group selection, drag/drop event wiring, background action reuse, same-window enforcement, and no tab close action.
- Dashboard Undo/Restore guard: compact action buttons, latest-run availability checks, existing background action reuse, and no direct tab close action.
- Dashboard simple MVP UI guard: no default P1 placeholders; Saved Workspaces, Auto Organize, and Settings hidden from the default commercial UI.
- Disposable manual QA checklist coverage guard: Tab Agent chat UI, latest organize result as one assistant message bubble, bottom composer, Smart Groups filters, Duplicate Center tab focus, tab focus, same-window tab move, Dashboard apply, safe error states, AI status, sensitive summary, privacy outputs, and local QA notes in copied Markdown reports.
- 180-tab synthetic local planning guard: duplicate detection, safe-close planning, group-plan validation, bounded runtime, and sanitized run snapshots without reading real browser tabs.
- AI host guardrail aligned with manifest host permission.
- Redacted local error logs.
- Count-only duplicate safety audit.
- Sensitive current-tab summary confirmation before visible text extraction.
- Current run snapshot privacy boundary: no restore URL, raw/full URL, URL hash, query token, or page text in stored UI state.
- Undo snapshot minimization: only IDs, window, index, and group fields needed to restore grouping.
- Redacted diagnostics and beta feedback template.
- Chat Refine parser and user-rule priority.
- Duplicate safety policy.
- AI output validation.
- AI classification request minimization: no full URL, restore URL, favicon URL, query token, or page text in provider payload.
- AI Agent metadata-answer request minimization: no full URL, restore URL, favicon URL, query token, or page text in provider payload; invented tab IDs are filtered before rendering.
- AI classification timeout aborts the provider request and falls back to local rules.
- AI connection and classification fetches carry abort signals.
- AI classification status stays lightweight in the sidebar completion message while Dashboard retains fuller AI status.
- Dashboard Smart Group cards and local favicon-backed tab-row rendering from sanitized run data, with expandable hidden tab rows and edit/move controls folded/contextual by default.
- Hidden/private-beta local workspace save/delete guard: minimized local snapshot, no full URL, no restore URL, no URL hashes, no favicon URL, no page text, and delete only updates local saved workspace storage.
- Store screenshot draft guard: five 1280x800 local draft screenshots, output to ignored artifacts, marked DO NOT SUBMIT YET, and sourced from mock UI screenshots only.
- Standalone privacy policy draft guard: unpublished status, confirmation gate, developer/support/website placeholders, saved workspace disclosure, DeepSeek optional-sharing boundary, no all-URLs permission, no cloud/account/analytics paths, local data deletion, and Limited Use disclosure.
- Standalone Chrome Web Store data disclosure draft guard: unsubmitted status, confirmation gate, conservative data category mapping, optional BYOK sharing boundary, no-sale posture, no analytics upload, and privacy policy draft linkage.
- Sidebar Agent optimization answer guard: latest-run optimization/memory-relief questions are answered locally as assistant message cards and avoid inventing exact memory MB.
- Hidden private-beta Settings keeps provider details, privacy defaults, permission, diagnostics, and local reset controls behind folded sections.
- AI connection test without tab data.
- Dashboard rule deletion confirmation.
- Dashboard scoped AI key clearing.
- Local data deletion.
- Disposable manual QA checklist includes current MVP Sidebar chat UI checks, DeepSeek Agent open-answer / move-draft checks, Dashboard workflow checks, Duplicate Center, safe error states, AI status, sensitive-summary confirmation, privacy-output checks, and local QA notes.

### Chrome Runtime Smoke

Command:

```bash
node tools/chrome_runtime_smoke_test.js
```

Result:

```text
Loaded extension <temporary-extension-id>
Opened extension page chrome-extension://<temporary-extension-id>/sidepanel.html
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, context-aware composer state, ephemeral chat thread, capability answer, open-ended chat fallback, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
```

Evidence notes:

- The script used a temporary Chrome for Testing profile and a copied unpacked extension directory.
- It submitted `open dashboard`, `summarize this page`, `restore closed`, `undo`, and `organize again` through the real Sidebar composer.
- It verified `summarize this page` rendered a current-page chat summary and kept the legacy summary panel hidden.
- It submitted `ask page: what does this page say about tabs` and verified the page question rendered in the current-page chat summary card.
- It verified the Sidebar kept both the user page question and multiple Agent replies in the same local message thread.
- It submitted `summarize this page` through the composer and verified the current-tab request entered the same local user/Agent message thread.
- It submitted `what can you do` and verified the local capability answer rendered in the chat thread.
- It submitted `what should I do next` and verified the local next-step answer rendered in the chat thread.
- It submitted `show groups`, `how much memory did you save?`, and `did AI classify this?` through the real Sidebar composer and verified local run-state answers.
- It submitted `what did you close` and `what needs review` through the real Sidebar composer and verified local restore/run-state answers.
- It submitted `what tab am I on`, `protected tabs`, and `read later` through the real Sidebar composer and verified local snapshot answers.
- It submitted `find github` through the real Sidebar composer and verified the Open action focused an existing GitHub tab.
- Test tabs were synthetic QA URLs only.
- It verified organize, safe duplicate close, Restore Closed, Chat Refine, Dashboard title/color apply, Dashboard same-window tab move, Dashboard drag/drop tab assignment, Dashboard tab focus, Dashboard Duplicate Center tab focus, Dashboard Restore Closed, and Dashboard Undo against real Chrome native tab groups.
- It verified Dashboard local workspace save writes a minimized local snapshot without full URLs, restore URLs, URL hashes, favicon URLs, or page text, then Dashboard local workspace delete removes only the selected local snapshot.
- Restore Closed used a local restore snapshot containing the synthetic duplicate URL and increased the open synthetic tab count in the temporary profile.
- It did not read the user's real Chrome profile or real browser tabs.

### Chrome Runtime Large-Tab Probe

Command:

```bash
node tools/chrome_runtime_smoke_test.js --large-tabs
```

Result:

```text
Loaded extension <temporary-extension-id>
Opened extension page chrome-extension://<temporary-extension-id>/sidepanel.html
PASS Chrome runtime large-tab probe organized 96 synthetic tabs in 858ms with 8 groups, 96 moved tabs, 8 safe duplicate closes, and 9 review duplicate groups
```

Evidence notes:

- The probe used a temporary Chrome for Testing profile and synthetic URLs only.
- It verified the real native Chrome tab group path, not only local planning code.
- It checked organize completion, moved tabs, safe duplicate closes, review duplicate groups, expected group titles, bounded runtime, and sanitized run snapshots.
- It did not read the user's real Chrome profile, real browser tabs, `.env.local`, page content, or API keys.
- It did not call DeepSeek or any AI provider.
- This still does not replace the remaining real-profile manual QA pass.

### Chrome Runtime DeepSeek Agent Flow

Command:

```bash
node tools/chrome_runtime_smoke_test.js --agent-flow
```

Result:

```text
Loaded extension <temporary-extension-id>
Opened extension page chrome-extension://<temporary-extension-id>/sidepanel.html
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
```

Evidence notes:

- The script used a temporary Chrome for Testing profile and synthetic QA tabs only.
- It wrote the local DeepSeek key into the temporary extension storage and did not print the key.
- It accepted the privacy gate, organized synthetic tabs into real Chrome native tab groups, then submitted `Which tabs should I focus on for Chrome extension planning?` through the real Sidebar composer.
- It verified that DeepSeek returned through the Sidebar Agent path as a normal assistant message card, not a Chat Refine action preview.
- It verified the assistant card stays simple and does not show a separate privacy footnote, suggested-next-steps block, relevant tab rows, or automatic action chips.
- It submitted `Why those tabs?` and verified DeepSeek answered the follow-up from short-term sanitized chat context while preserving the metadata-only payload boundary.
- It submitted an explicit regroup request, verified DeepSeek returned a validated `move_tabs` Apply/Cancel draft, clicked Apply, and verified matching synthetic tabs moved into a real native Chrome group without closing tabs.
- It verified ordinary Agent answers did not render relevant tab rows or automatic action chips, while explicit `move_tabs` drafts still required user Apply before browser changes.
- It did not read the user's real Chrome profile, real browser tabs, real page text, or full URLs.

### Disposable Manual QA Profile Self-Test

Command:

```bash
node tools/open_manual_qa_profile.js --self-test
```

Result:

```text
PASS manual QA profile opened
realProfileQaTemplate=/Users/bytedance/个人项目/aitab/05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md
seedTabs=20
PASS self-test closed and cleaned up disposable QA profile
```

Evidence notes:

- The script used Chrome for Testing with a disposable profile under `artifacts/manual-qa-profiles/`.
- It loaded a copied unpacked extension, opened the local Manual QA Checklist, synthetic QA tabs, sidepanel, and dashboard.
- The checklist now covers Tab Agent chat UI, latest organize result as one assistant message bubble, bottom composer behavior, optional BYOK Agent open-answer / move-draft checks, Smart Groups filters, Duplicate Center tab focus, tab focus, same-window tab move, Dashboard apply, safe error states, AI status, sensitive-summary confirmation, privacy outputs, local QA notes, and one-click copying of the blank real-profile QA result template.
- QA notes are stored only in the disposable profile localStorage and copied into the local Markdown report; the tool does not upload them.
- It did not read the user's real Chrome profile, real browser tabs, or `.env.local`.
- This proves the disposable manual QA tooling opens and cleans up correctly; it does not replace the remaining real-profile manual QA pass.

### Extension Package

Command:

```bash
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=f1930bf50fe721a254932be92ef009feec1d380d612b727d7325b9b374b1f561
```

Evidence notes:

- `.env.local` is ignored by git.
- `.env.local` is not included in the extension zip.
- Package manifest safety flags state `includesEnvFiles=false`, `includesSourceMaps=false`, and `includesNodeModules=false`.
- Repeated package generation produced the same package checksum after unchanged icon writes and zip extra attributes were removed.
- `dist/` is ignored because the zip is regenerable from source.

### Sidebar Agent AI / Optimization Cards

Command:

```bash
node tools/extension_smoke_test.js
node tools/chrome_runtime_smoke_test.js
```

Result:

```text
42 smoke tests passed
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, context-aware composer state, ephemeral chat thread, capability answer, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
```

Evidence notes:

- Sidebar Agent now answers `how much memory did you save?` as a visible assistant message card.
- Sidebar Agent now has a DeepSeek metadata-only fallback for open-ended tab-management questions after local direct commands, local read-only answers, tab search, and safe Chat Refine drafts do not match.
- Sidebar Agent now answers unsupported open-ended questions as normal assistant messages when DeepSeek is not enabled, instead of surfacing the local parser error.
- The metadata-only Agent payload includes title, hostname, path, tab state, group state, active Sidebar context, duplicate-review counts, and up to 4 sanitized recent user/assistant chat turns only; it excludes page body, page summaries, full URL, restore URL, favicon URL, browser history, cloud memory, and saved workspace contents.
- Metadata-only Agent output filters invented tab IDs, rejects destructive action drafts, renders open answers as plain assistant bubbles, and requires Apply before `move_tabs` browser changes.
- The card shows groups, tabs organized, closed duplicates, duplicate review count, and memory relief as duplicate tabs freed.
- The card includes safe quick-command buttons for groups, Restore Closed, Review duplicates, and Dashboard when those actions are relevant.
- The Agent explicitly avoids inventing exact memory MB because Chrome does not expose reliable per-tab memory data through the current extension path.
- This targeted verification did not read the user's real Chrome profile, real tabs, `.env.local`, page text, or API keys.

### Beta Readiness Check

Command:

```bash
node tools/beta_readiness_check.js
```

Result:

```text
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_SOURCE_RELEASE=yes
PUBLIC_SOURCE_RELEASE_BLOCKERS=none
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback
```

Evidence notes:

- The check reads local docs, package checksum, and package manifest only.
- It does not call the network, open Chrome, read real browser tabs, or read `.env.local`.
- It intentionally keeps public launch marked not ready until the remaining confirmation gates and real-profile QA are complete.

### UI Screenshot Capture

Command:

```bash
node tools/capture_ui_screenshots.js
node tools/build_store_screenshots.js
```

Result:

```text
PASS UI screenshots captured
artifacts/ui-screenshots/sidepanel-result.png
artifacts/ui-screenshots/sidepanel-chat.png
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-mobile.png
PASS store screenshot drafts captured
artifacts/store-screenshots/01-one-click-native-groups.png
artifacts/store-screenshots/02-tab-agent-sidebar.png
artifacts/store-screenshots/03-smart-groups-dashboard.png
artifacts/store-screenshots/04-page-chat.png
artifacts/store-screenshots/05-mobile-dashboard.png
```

Evidence notes:

- Screenshots use mock extension data only, including side panel result/current-page chat states and Dashboard desktop/mobile views.
- `sidepanel-chat.png` shows a realistic current-page Q&A scenario with Supabase page context visible near the composer.
- The scripts do not read real browser tabs.
- The scripts do not read `.env.local`.
- Store screenshot drafts are 1280x800 PNGs generated for review. They are not final Chrome Web Store listing assets and must not be submitted without user approval.
- `artifacts/` is ignored by git because screenshots are reproducible local evidence.
- Screenshot capture is visual QA only and does not prove real Chrome native tab groups were created.

### Pre-Push Package Verification

Command:

```bash
node tools/preflight.js
```

Result:

```text
PASS secret scan checked 125 tracked files
55 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 128 tracked/unignored files
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_REPO_PUSH=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PUBLIC_SOURCE_RELEASE_BLOCKERS=none
PUBLIC_LAUNCH_BLOCKERS=D-L03: public brand/domain not finalized; D-L04: public developer identity/support email not confirmed; D-L05: privacy policy URL not confirmed; D-L06: Chrome Web Store single-purpose wording not approved; D-L07: Chrome Web Store data-use disclosure not approved; D-L08: first public build BYOK scope not approved; D-L09: free/pro boundary not approved; D-L10: analytics policy not approved; D-L11: real-profile QA not completed; D-L12: final screenshots/demo not approved; D-L13: beta user ramp not approved; D-L14: public launch timing not approved
PASS release package verified for v0.1.0
sha256=31ce1375cdc57abf979c805866f17a35db174f94819ced09ad4ba5b41af13e80
```

Evidence notes:

- This pre-push check regenerated the local ignored package in `dist/` and verified the package contents.
- `.env.local`, generated artifacts, private-beta AI settings, and local output directories remain ignored.
- The public repo audit passes source-release safety checks. Public marketing and Chrome Web Store launch still remain blocked by separate confirmation gates.
- This does not change the Chrome Web Store readiness state.

## Remaining Evidence Gaps

- P0 manual QA runbook has not been run against the user's real Chrome profile.
- Chrome Web Store submission materials, standalone privacy policy, and standalone data disclosure draft remain drafts marked `CONFIRM` / `DO NOT SUBMIT YET` / `DO NOT PUBLISH YET`.
- Public privacy policy URL, support email, final brand/domain, and final store disclosures still need user confirmation.

## 2026-06-14 Dashboard Less-Is-More Simplification

Source state verified: Dashboard default customer UI simplification.

Commands:

```bash
node --check extension/dashboard.js
node tools/extension_smoke_test.js
git diff --check
node tools/capture_ui_screenshots.js
```

Result:

```text
56 smoke tests passed
PASS UI screenshots captured
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-selected-tabs.png
artifacts/ui-screenshots/dashboard-mobile.png
```

Evidence notes:

- Default Dashboard now hides Project Space navigation, Work Queue, Collections, All/AI/Rule filter chips, and disabled action chips.
- Default Dashboard shows Smart Groups first with a one-line local summary, contextual Undo / Restore only when available, and folded Duplicate Center.
- Selected-tabs actions remain hidden until two tabs are selected, preserving Sidebar linkage without adding default clutter.
- The screenshots use mock extension data only and do not read real browser tabs or `.env.local`.

## 2026-06-14 Sidebar Composer Context / Skill Picker

Source state verified: Sidebar composer `+` context / skill picker.

Commands:

```bash
node --check extension/sidepanel.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
git diff --check
```

Result:

```text
locale json ok
56 smoke tests passed
PASS UI screenshots captured
artifacts/ui-screenshots/sidepanel-composer-picker.png
```

Evidence notes:

- Sidebar composer `+` now opens a compact picker with wired entries for Current page, Page region, Selected tabs / group, Search web, Decision brief, and Save as todo.
- Search web routes through the internal Agent Search Tool path; it does not open a browser search tab from the shortcut.
- Save as todo reuses the local metadata-only Sidebar todo flow.
- Unimplemented selected-text, file upload, full screenshot upload, and third-party skill marketplace entries remain hidden.
- The screenshot uses deterministic mock extension data only and does not read real browser tabs or `.env.local`.

## 2026-06-14 Sidebar Selected-Text Context

Source state verified: Sidebar selected-text context from the composer picker.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
git diff --check
```

Result:

```text
57 smoke tests passed
PASS UI screenshots captured
artifacts/ui-screenshots/sidepanel-composer-picker.png
artifacts/ui-screenshots/sidepanel-context-picker-selected-tabs.png
```

Evidence notes:

- Sidebar composer picker now includes `Selected text` in current-tab context.
- Selected-tabs/group-only shortcuts are hidden from the default current-tab picker and shown when the Sidebar context is selected-tabs/current-group.
- `SUMMARIZE_SELECTED_TEXT` reuses the Page Agent path but forces selected-text-only extraction.
- The selected-text Page Agent payload test verifies highlighted text is included while full-page visible text, description, headings, full URL query token, diagnostics, feedback templates, and cloud storage are excluded.
- Screenshots use deterministic mock extension data only and do not read real browser tabs or `.env.local`.

## 2026-06-14 Page Quick Rail First Slice

Source state verified: minimal right-edge Page Quick Rail entry for ordinary http/https pages.

Commands:

```bash
node --check extension/page_quick_rail.js
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
57 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=9b9b37a9bde01b69d1e46cd4d4d0593148ecb17388278297e7b37c8666d5ede2
artifacts/ui-screenshots/quick-rail-page.png
artifacts/ui-screenshots/sidepanel-composer-picker.png
artifacts/ui-screenshots/sidepanel-context-picker-selected-tabs.png
```

Evidence notes:

- `page_quick_rail.js` renders a compact glass right-edge rail with Chat, Page, Region, and Todo entries.
- The content script is injected only on ordinary `http://*/*` and `https://*/*` pages.
- Quick Rail delegates only the clicked action id through `RUN_QUICK_RAIL_ACTION`; background opens Sidebar, sets current-tab metadata context, and may prefill a prompt.
- Quick Rail does not read visible text, selected text, DOM content, screenshots, full URLs, cookies, page localStorage/sessionStorage, form values, or browser history.
- The hide control stores only an extension-local `tabmosaic.quickRailHidden` boolean, and Clear Local Data removes it.
- `tools/package_extension.js` and `tools/verify_release_package.js` now include/require `page_quick_rail.js` so release zips cannot silently miss the content script.

## 2026-06-14 Tabs As Tasks First Slice

Source state verified: local Done / Later / Keep tab work states.

Commands:

```bash
node --check extension/dashboard.js
node --check extension/sidepanel.js
node --check extension/background.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
57 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=e53bccc6427628f28e3867882194296596ce3e4054682190572c05347bcd127f
artifacts/ui-screenshots/dashboard-tab-states.png
artifacts/ui-screenshots/sidepanel-tab-state-later.png
```

Evidence notes:

- Dashboard tab rows now expose a lightweight State menu with Done, Later, Keep, and Clear.
- Sidebar supports natural-language tab state commands such as `save this tab for later`.
- Done / Keep / Later are stored in `tabmosaic.tabWorkStates` with minimized tab metadata only.
- Later also creates a local Work Queue item with the same minimized tab metadata boundary.
- These actions do not close, move, read, screenshot, summarize, upload, or mutate pages.
- Clear Local Data removes `tabmosaic.tabWorkStates`.

## 2026-06-14 Universal Browser Work Search First Slice

Source state verified: Sidebar local Browser Work Search.

Commands:

```bash
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
git diff --check
```

Result:

```text
locale json ok
57 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=e147c240970ca8acf99ebb3757d90604e7194f899a53f0d3e071b0be4a59340e
```

Evidence notes:

- Sidebar chat now routes `find/search/show/list/open/focus ...` into a local Browser Work Search path before open-ended AI fallback.
- Search covers latest open-tab snapshot, native groups, duplicate review entries, local Work Queue todos, saved Collections, saved workspace snapshots, and Done/Later/Keep tab states.
- Results render as a normal Markdown assistant message with Open buttons only for still-open tabs.
- The search does not read page text, full URLs, Chrome history, bookmarks, cookies, screenshots, hidden DOM, the web, or external providers.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-browser-work-search.png`.

## 2026-06-14 Work Brief Command First Slice

Source state verified: Sidebar local Work Brief / Continue answer.

Commands:

```bash
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
57 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=921107150858ac505a76298f0251ff8a8b3e9c2cec803ed8672e72c24eb40973
artifacts/ui-screenshots/sidepanel-work-brief.png
```

Evidence notes:

- Sidebar now recognizes continue-work prompts such as `what should I continue?`, `brief my browser`, and `resume work`.
- The Work Brief answer is local-only and prioritizes duplicate review, open Work Queue todos, Later tabs, the strongest active group, saved workspace, and saved collection context.
- The output renders as a normal Markdown assistant message with Open buttons only for still-open tab matches.
- It does not read page text, full URLs, Chrome history, bookmarks, cookies, screenshots, hidden DOM, the AI provider, the web, or external providers.
- It does not close, move, restore, reopen, upload, summarize, or create tabs/work items.

## 2026-06-14 Safe Tab Commands First Slice A

Source state verified: Sidebar Apply-gated Done / Later / Keep tab-state commands.

Commands:

```bash
node --check extension/sidepanel.js
node --check extension/background.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
git diff --check
```

Result:

```text
locale json ok
57 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=4fe360a7d367a29432c544bada50683caaf47a8419d3aba7afddb0ea02c38d0c
artifacts/ui-screenshots/sidepanel-safe-tab-command.png
```

Evidence notes:

- Sidebar natural-language commands such as `save this tab for later` now render a normal assistant safe-command message with Apply / Cancel.
- The preview is stored as a temporary local `tabmosaic.chatDraft` `tab_state` draft.
- Apply writes only minimized local metadata to `tabmosaic.tabWorkStates`; Later also creates a local Work Queue item.
- The tab-state safe command does not close, move, read, screenshot, summarize, upload, or mutate pages.
- Existing move / rename / content-regroup drafts remain Apply-gated for native Chrome group changes.

## 2026-06-14 Protected Tabs First Slice

Source state verified: local Keep / Protect state affects future organize and duplicate-close planning.

Commands:

```bash
node --check extension/sidepanel.js
node --check extension/background.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
git diff --check
```

Result:

```text
locale json ok
58 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=7f7dedc46f376984c9a9b7c273d4a38acab85a49953cded9a3e59b80be2806e5
artifacts/ui-screenshots/sidepanel-protect-tab-command.png
```

Evidence notes:

- Sidebar `protect this tab` renders the same simple Apply / Cancel safe-command message shape as other tab-state commands.
- Apply stores local `tabmosaic.tabWorkStates` state `keep` with minimized tab metadata only.
- Future organize snapshots read Keep states as protected reason `user`.
- Automatic grouping skips user-protected tabs.
- Safe duplicate close planning prioritizes user-protected tabs as the keeper and never closes them.
- This adds no new permissions and does not read page text, store full URLs, close tabs, move tabs, upload data, or create cloud memory.

## 2026-06-14 Local Tab State Undo First Slice

Source state verified: Sidebar `undo` restores the previous local Done / Later / Keep / Protected tab state.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
git diff --check
```

Result:

```text
locale json ok
59 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=223e509b459a8eab242bda39c6cda76205df61b2a33434e1e4bc8eed3d99af02
artifacts/ui-screenshots/sidepanel-tab-state-undo.png
```

Evidence notes:

- Applying a Sidebar tab-state draft stores a minimized `tabmosaic.lastTabStateUndo` snapshot with previous tab states and any newly-created Later task id.
- Sidebar `undo` now routes to the newest reversible action: local tab-state undo first, browser group undo second.
- Local tab-state undo restores previous `tabmosaic.tabWorkStates` entries and removes the Work Queue item created by the reverted Later action.
- The undo snapshot is cleared after use and is removed by Clear Local Data.
- This does not close, move, read, screenshot, summarize, upload, or mutate pages.

## 2026-06-14 Safe Duplicate Close Command First Slice

Source state verified: Sidebar natural-language `close safe duplicates` creates an Apply-gated safe-command preview and closes only revalidated safe duplicates after Apply.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
git diff --check
```

Result:

```text
locale json ok
60 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=7b8ac5ec12ef8b15111c287ff023d69dd20abedbdf50e0ce25517e81b1d0e2da
artifacts/ui-screenshots/sidepanel-safe-duplicate-close-command.png
```

Evidence notes:

- Sidebar recognizes natural-language safe duplicate close commands before broad duplicate-status answers.
- The preview renders as a normal Markdown assistant safe-command message with Apply / Cancel.
- The temporary `tabmosaic.chatDraft` stores only instruction, tab IDs, minimized matched-tab previews, counts, and Markdown copy.
- The draft does not store full URLs, restore URLs, page text, screenshots, cookies, history, form values, or cloud data.
- Apply re-scans the live browser state and closes only previewed tabs that are still exact/tracking safe-close candidates.
- Active, pinned, audible, user-protected, internal/restricted, hash/query, title-review, and domain-review duplicates remain open.
- `tabmosaic.lastClosedTabs` is written only after Chrome actually closes tabs, so Restore Closed remains available without exposing restore URLs in the preview.

## 2026-06-14 Prompt / Skill Templates MVP

Source state verified: Sidebar composer picker now exposes curated built-in Prompt / Skill Templates without adding a dashboard feature wall or dynamic third-party skills.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
git diff --check
```

Result:

```text
locale json ok
60 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=1ccedd70cc92e99defcb6dcea130fb213442c6189028b0f88609687eb9ef838a
artifacts/ui-screenshots/sidepanel-template-picker.png
```

Evidence notes:

- Sidebar composer `+` includes a compact Templates entry.
- Templates stay inside the same glass composer picker; no Dashboard feature wall was added.
- Built-in templates cover cleanup tabs, find duplicates, review page, compare selected tabs, decision brief, translate selection, and create todo.
- Each template declares allowed context types, tool permissions, output format, source behavior, blocked actions, and whether Apply is required for destructive actions.
- Selected-tabs/current-group templates hide when that context is not active.
- Templates route through existing safe flows: Smart Organize, duplicate-status answer, current-page read, selected-text read, selected-tabs/group read, and local todo creation.
- This adds no new permissions, no third-party dynamic skill marketplace, no arbitrary user scripts, no new storage key, no analytics, and no auto-submit behavior.

## 2026-06-14 Source Provenance Chips First Slice

Source state verified: Sidebar assistant answers now show compact source chips for page/tab context without adding new reads, storage, permissions, or analytics.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
git diff --check
```

Result:

```text
locale json ok
60 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=5ed46a33c542425a91b6047d4a0e6fc103168eff2271962429ed3acac131aad8
artifacts/ui-screenshots/sidepanel-chat.png
artifacts/ui-screenshots/sidepanel-context-tabs.png
```

Evidence notes:

- Current-page answers render compact chips for Current page, site, visible-text read / metadata-only state, session-only/not-saved state, and no-full-URL boundary.
- Selected-text and selected-region answers share the same chip renderer through explicit source/tool-card metadata.
- Selected-tabs/current-group answers render compact read/skipped chips from the existing Agent tool card.
- AI Agent metadata answers disclose tab-metadata / no-page-text / no-full-URL boundaries.
- Search answers continue to use the existing compact Sources attachment with explicit Open / Save / Todo actions.
- Current-page source chips can focus the existing local tab via tab id only.
- No new page reads, cloud upload, source persistence, analytics, permissions, or storage keys were added.

## 2026-06-14 Translation And Reading Assistant First Slice

Source state verified: Sidebar natural-language reading commands now route selected-text/current-page translate, simplify, glossary, bilingual summary, and rewrite requests through existing Page Agent flows with copy-only output.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
git diff --check
```

Result:

```text
locale json ok
60 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=61c396eeb5e0c82e19b8d3ce21b0a216a7305ea1e5ab2120f12edb3c25d323c1
artifacts/ui-screenshots/sidepanel-translation-assistant.png
```

Evidence notes:

- Commands like `translate selected text`, `simplify selected text`, `extract glossary from selected text`, and rewrite/polish variants route to `SUMMARIZE_SELECTED_TEXT`.
- Commands like `translate this page`, `simplify this page`, `bilingual summary of this page`, and `extract glossary from this page` route to the existing current-page Page Agent flow.
- Selected-text commands read highlighted text only and keep the selected-text tool card plus source chips.
- Current-page commands still use sensitive-page confirmation where applicable.
- Prompts explicitly request copy-only output and no page editing, form submission, or mutation.
- No new permissions, storage keys, analytics, source persistence, or page mutation paths were added.

## 2026-06-14 Quick Rail More / Translate Polish

Source state verified: Page Quick Rail keeps four visible right-edge controls and moves Todo / Translate into a compact More overflow.

Commands:

```bash
node --check extension/page_quick_rail.js
node --check extension/background.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/package_extension.js
node tools/verify_release_package.js
git diff --check
```

Result:

```text
locale json ok
60 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=ac9b91a07feb5d643d431530319dd3ed3cfa9dd145717c2ad491a8528ff0aba2
artifacts/ui-screenshots/quick-rail-page.png
```

Evidence notes:

- Quick Rail now exposes Chat, Page, Region, and More as the only four visible controls.
- Todo and Translate selected text are available from the compact More overflow and only pre-fill existing Sidebar commands.
- The More control exposes collapsed/expanded state and can close with Escape.
- The hide control still stores only the extension-local `tabmosaic.quickRailHidden` boolean.
- Quick Rail still injects only on ordinary `http://*/*` and `https://*/*` pages and does not read visible text, selected text, DOM content, screenshots, full URLs, cookies, page storage, form values, or browser history.

## 2026-06-14 Compare Selected Tabs First Slice

Source state verified: Sidebar selected-tabs/current-group context now supports a dedicated compare workflow with recommendation, Markdown comparison table, source chips, and missing-information output.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/package_extension.js
node tools/verify_release_package.js
git diff --check
```

Result:

```text
locale json ok
61 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=aeade28ba9b8d707ed8b180036a7ca68254d86eeef49aedccce3c7337cb79d34
artifacts/ui-screenshots/sidepanel-compare-tabs.png
```

Evidence notes:

- Compare Selected Tabs template sets `workflow: compare_selected_tabs`; natural selected-tabs compare questions infer the same workflow.
- The workflow reuses capped selected-tabs/current-group visible-text extraction and the existing temporary site-access release path.
- DeepSeek/OpenAI-compatible payload requests recommendation, comparison rows, tradeoffs, missing information, and source notes.
- AI validation drops comparison rows that reference non-readable or invented tab IDs.
- Local fallback creates a metadata/visible-text comparison when the provider is unavailable.
- Sidebar renders the result as one normal assistant Markdown message with a compact table and source chips.
- No new permissions, storage keys, memo persistence, todo creation, web research, tab movement, tab closing, or page mutation were added.

## 2026-06-14 Compare Selected Tabs Action Polish First Slice

Source state verified: Compare Selected Tabs answers now expose explicit follow-up actions for local todo creation and missing-info research.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/package_extension.js
node tools/verify_release_package.js
git diff --check
```

Result:

```text
locale json ok
61 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=98823bf65aeb292aaf7458cb3d1dbda89e3209c1e8f68416d6acc65220754f47
artifacts/ui-screenshots/sidepanel-compare-tabs.png
```

Evidence notes:

- Compare answers keep the latest compare result in Sidebar memory only until context changes or the short context TTL expires.
- `Create todo` writes one local `tabmosaic.agentTasks` item with source `compare_selected_tabs`, linked selected-tab metadata, a short checklist, provider label, and `aiUsed`.
- Compare todo storage excludes raw page text, full URLs, query/hash, screenshots, history, and cloud IDs.
- `Research missing info` reuses the internal Agent web-search tool and sends only a generated search query to the configured search provider after user click.
- No memo persistence, new storage key, new permission, automatic search, automatic todo creation, tab movement, tab closing, or page mutation was added.

## 2026-06-14 Sidebar @ Context Picker First Slice

Source state verified: Sidebar composer now supports an `@` context picker mode that inserts context prompts without reading page content before user submission.

Commands:

```bash
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
git diff --check
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
61 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=b4c6fb1f445c90ba12812da00c757481e706c707c60810c3e74e620220386b91
artifacts/ui-screenshots/sidepanel-at-context-picker.png
```

Evidence notes:

- Typing `@` in the Sidebar composer opens the compact picker in `mention` mode.
- `@` mode filters context/tool/template entries and inserts a natural prompt for the selected entry.
- `@` selection does not read page text, call AI/search, write storage, upload files/screenshots, move tabs, close tabs, or mutate pages.
- The existing `+` button remains a direct shortcut action entry.
- File/PDF/screenshot/vision contexts remain pending separate privacy/provider confirmation.

## 2026-06-14 Research Brief Workflow First Slice

Source state verified: selected-tabs/current-group context can now generate a bounded Research Brief with findings, contradictions, gaps, next steps, source notes, and explicit follow-up actions.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node tools/package_extension.js
node tools/verify_release_package.js
git diff --check
```

Result:

```text
locale json ok
62 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=58fa68ba81472c2ae7b346942cc8a7b8183750784887c622d8ae276bc7d03603
artifacts/ui-screenshots/sidepanel-research-brief.png
```

Evidence notes:

- Research Brief routes through `workflow: research_brief` from template, picker, or natural selected-tabs/current-group prompts.
- The workflow reuses capped selected-tabs/current-group visible-text extraction and the existing temporary site-access release path.
- DeepSeek/OpenAI-compatible payload requests grounded findings, contradictions, gaps, next steps, and source notes.
- The prompt explicitly blocks fake web-search claims when no search results are provided.
- Sidebar renders the brief as one normal Markdown assistant message with source chips.
- `Create todo` writes one local `tabmosaic.agentTasks` item with source `research_brief`, linked selected-tab metadata, short checklist, provider label, and `aiUsed`.
- `Research missing info` reuses the internal Agent web-search tool and sends only a generated search query to the configured search provider after user click.
- No memo persistence, query decomposition, file/PDF/screenshot context, background crawl, new permission, tab movement, tab closing, page mutation, or cloud storage was added.

## 2026-06-14 Pasted Link Explicit Fetch First Slice

Source state verified: pasted links can now be fetched only after the user clicks `Fetch link`, then answered as a normal Sidebar assistant message.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
git diff --check
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
63 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=ad5cd0cff9ec96a32ce1b1c52af2a70cfc2863420768938e9129e4f6b825aa7d
artifacts/ui-screenshots/sidepanel-link-fetch.png
```

Evidence notes:

- Link detection still does not open, fetch, summarize, upload, or store the linked page by default.
- `Fetch link` requests only the pasted link's optional Chrome origin permission and fetches readable text with credentials omitted.
- The Page Agent payload uses fetched-link title, hostname, sanitized path, description, headings, and readable text; it excludes full URL, query/hash, cookies, form values, hidden DOM, browser history, and cloud storage.
- The Sidebar renders one lightweight `fetch_user_link` tool state plus one Markdown assistant message with source chips.
- Save/Todo after a fetched link continues to use existing local sanitized source metadata paths.
- PDF, screenshot/image context, unified composer context chips, and real-profile optional permission QA remain pending.

## 2026-06-14 Local Memo First Slice

Source state verified: useful Sidebar assistant answers can now be explicitly saved as local memos and found later through local Browser Work Search.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node tools/package_extension.js
node tools/verify_release_package.js
git diff --check
```

Result:

```text
locale json ok
63 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=6bca6808f31e45912c4f3e021f3ceedc631c6cedeb11622c336985bf1a21c9d5
artifacts/ui-screenshots/sidepanel-local-memo-search.png
```

Evidence notes:

- `Save memo` is available under AI Agent answers, current-page answers, selected-tabs/current-group answers, Compare Selected Tabs, Research Brief, and fetched-link answers.
- Saving is explicit and writes `tabmosaic.savedMemos` locally only.
- Stored memo data is derived assistant answer Markdown, source/workflow label, tags, provider label, `aiUsed`, minimized linked-tab metadata, and sanitized source metadata.
- Raw page text, full URLs, query/hash, screenshots, Chrome history/bookmarks, search result bodies, cookies, form values, hidden DOM, and cloud storage are not persisted.
- Sidebar Browser Work Search now indexes saved memos locally, and Work Brief can suggest the latest memo.
- Clear Local Data removes `tabmosaic.savedMemos`.
- At the time of this slice, Dashboard Memory view, editable tags, cloud sync/memory, and table-extraction memo save remained pending. Dashboard Memory view is now covered by the 2026-06-15 Dashboard Memory View slice below; editable tags, cloud sync/memory, and table-extraction memo save remain pending.

## 2026-06-14 Decision Brief First Slice

Source state verified: selected-tabs/current-group context can now produce a Decision Brief as a normal Sidebar AI message with recommendation, decision criteria, source tradeoffs, assumptions, missing information, source notes, and explicit follow-up actions.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
git diff --check
node tools/package_extension.js
node tools/verify_release_package.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
```

Result:

```text
locale json ok
64 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=f17f53220521ebdf975085f8d9dec837c455870ea6421d3a8cc7bc006ebea4a4
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=3
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=117
pageAgentKeyPoints=4
artifacts/ui-screenshots/sidepanel-decision-brief.png
```

Evidence notes:

- Decision Brief template and natural-language prompts route through `workflow: decision_brief`.
- The workflow reuses capped selected-tabs/current-group visible-text extraction and the existing temporary site-access release path.
- AI output is schema-validated; invented source tab IDs in decision tradeoff rows are dropped.
- The Sidebar renders one Markdown assistant message plus compact source chips and explicit `Save memo`, `Create todo`, and `Research missing info` actions.
- Follow-up `Save memo` persists only derived assistant Markdown plus minimized linked-tab/source metadata; `Create todo` writes one local Work Queue item; `Research missing info` uses the internal Search Tool only after click.
- No saved-source input, search-result synthesis, file/PDF/screenshot context, background crawl, new permissions, browser mutation, tab close, full URLs, query/hash, raw page text persistence, or cloud storage was added.
- At this point, search-result/saved-source/file inputs for Decision Brief were still pending; saved-source and search-result inputs are now covered by the later 2026-06-15 slices below.

## 2026-06-14 Review Page First Slice

Source state verified: current-page review/risk/next-step questions can now run through a dedicated `review_page` Page Agent workflow and render as a normal Sidebar assistant message with risks, open questions, checklist, and safe next steps.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
git diff --check
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
65 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=114
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=6277c468c65cc9c72ea1ba2a85550c46725df3a8f353b9ee82a8245ae418ffd0
artifacts/ui-screenshots/sidepanel-page-review.png
```

Evidence notes:

- Review page template uses `workflow: review_page`.
- Natural current-page review/risk/next-step questions infer the same workflow in background validation.
- The Page Agent payload includes current-tab title, hostname, visible text, selected text, headings, description, safe site-skill hint, workflow label, and local page-chat context only.
- Full URLs, query/hash, cookies, form values, hidden DOM, browser history, screenshots, workspace memory, and TabMosaic cloud storage are excluded.
- The Sidebar renders page type, risks, open questions, review checklist, and next steps as one Markdown assistant message with source chips.
- `Save memo` stores only the derived assistant answer and minimized current-tab/source metadata; `Create todo` stores one local Work Queue item from the derived checklist.
- No auto-submit, page mutation, approve/merge/deploy/delete/credential rotation, background crawl, file/PDF/screenshot context, new permissions, or cloud memory was added.
- Real-profile current-page review QA and host-specific workflow polish remain pending.

## 2026-06-14 Contextual Writing First Slice

Source state verified: current-page draft/reply/comment/update requests can now run through a dedicated `contextual_writing` Page Agent workflow and render as a normal Sidebar assistant message with copy-only draft text, context notes, source grounding, and explicit Copy draft / Save memo actions.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
66 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=83
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=8d1d176f73aad34c2029e3e78b4c3df87f8e90f88e892b8a16d65a9ab1c1954c
artifacts/ui-screenshots/sidepanel-contextual-writing.png
```

Evidence notes:

- Draft response template uses `workflow: contextual_writing`.
- Natural current-page writing prompts infer the same workflow.
- The Page Agent payload includes current-tab title, hostname, visible text, selected text, headings, description, safe site-skill hint, workflow label, and local page-chat context only.
- Full URLs, query/hash, cookies, form values, hidden DOM, browser history, screenshots, workspace memory, and TabMosaic cloud storage are excluded.
- The Sidebar renders the draft as one Markdown assistant message with source chips and explicit `Copy draft` / `Save memo` actions.
- `Copy draft` stores draft candidates in Sidebar memory and writes only generated draft text to the clipboard after user click.
- No text insertion, form submit, email/message send, comment post, approve/merge/deploy, page mutation, background crawl, file/PDF/screenshot context, new permissions, or cloud memory was added.
- Selected-tabs/current-group writing, host-specific adapters, and any auto-insert/auto-submit flow remain pending.

## 2026-06-14 Smart Fill Lite First Slice

Source state verified: selected page-region extraction can now run through a dedicated `smart_fill_lite` Page Agent workflow and render as a normal Sidebar assistant message with a copy-only Markdown table, CSV option, row classifications, row actions, notes, source chips, and explicit Copy table / Copy CSV / Create todo / Save memo actions.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
67 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=135
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=7e75584e8e283e1dcb6e4f181ea6f24f1da4d5568525db4de7170cc127c69ecb
artifacts/ui-screenshots/sidepanel-smart-fill-lite.png
```

Evidence notes:

- Smart Fill table template uses `workflow: smart_fill_lite`.
- Natural selected-region/table/list extraction prompts infer the same workflow.
- The Page Agent payload includes current-tab title, hostname, selected-region visible text, safe link labels, list/table structure, cropped screenshot metadata, workflow label, and local page-chat context only.
- Screenshot image bytes, full URLs, query/hash, cookies, form values, hidden DOM, unrelated page DOM, browser history, workspace memory, web-search results, and TabMosaic cloud storage are excluded.
- The Sidebar renders extracted rows as one Markdown assistant message with source chips and explicit `Copy table`, `Copy CSV`, `Create todo`, and `Save memo` actions.
- `Copy table` / `Copy CSV` write only derived table text to the clipboard after user click; `Create todo` stores one local Work Queue checklist from row actions.
- No auto-fill, form submit, page-table edit, page mutation, background crawl, search enrichment, file/PDF/full-screenshot context, new permissions, or cloud memory was added.
- Auto-fill/auto-submit and provider-side vision image upload remain blocked until separately confirmed.

## 2026-06-14 Agent Safety Layer First Slice

Source state verified: current-page, selected-text, selected-region, fetched-link, and selected-tabs/current-group Page Agent flows now carry an explicit security boundary that treats page text as untrusted source material, declares allowed tool permissions and blocked actions, flags prompt-injection-like page text, blocks unsafe instruction-like model output before rendering, and shows compact tool-card safety labels.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
68 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=3
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=135
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=e0f81170a8f9a88d68454233e1f25efaff22e8b9354276ffbf2cd397216c68f1
artifacts/ui-screenshots/sidepanel-context-tabs.png
```

Evidence notes:

- Page Agent system prompts now state that visible page text, selected text, fetched text, and selected-region text are untrusted source material, not instructions.
- Page Agent and multi-tab Agent payloads include a `security` object with `pageTextTrusted: false`, tool permission labels, blocked action labels, and prompt-injection signal flags.
- The smoke suite includes a malicious-page fixture with `ignore previous instructions` / `reveal your API key` text and verifies unsafe model output is replaced before rendering.
- Sidebar tool cards show compact `Allowed`, `Blocked`, and `Page text is untrusted` labels without adding a separate dashboard or feature panel.
- No new manifest permissions, automatic page reads, page mutation, screenshot upload, analytics, or cloud storage were added.
- Broader red-team corpus, copyable sanitized bug reports, richer browser-action timelines, and host-specific sensitive-action blocklists remain pending.

## 2026-06-14 Agent Run Transcript First Slice

Source state verified: Page Agent / selected-tabs answers now expose a compact `Run log` action. Clicking it renders one Markdown-style assistant message with request, context scope, provider, tools used, skipped-page reasons, privacy flags, safety notes, browser-change status, and Undo/Restore state. The transcript is capped local-only storage under `tabmosaic.agentRunTranscripts` and is excluded from follow-up AI context.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
68 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=124
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=d0eb30b49532512f1ff519824561b0029c61fd5784be5cd6059b39b8400b46e2
artifacts/ui-screenshots/sidepanel-run-transcript.png
```

Evidence notes:

- The Sidebar stores sanitized run summaries under `tabmosaic.agentRunTranscripts`, capped to 20 entries.
- Clear Local Data removes `tabmosaic.agentRunTranscripts`.
- Run log messages are excluded from follow-up AI context so the transcript does not pollute later user questions.
- Transcript text redacts full URLs, token-like query values, connection strings, bearer tokens, and API-key-like strings best-effort.
- The screenshot mock verifies the selected-tabs answer exposes `Run log`, opens the transcript card, and shows tools/skipped/privacy/action sections.
- No raw page text, selected-region text, screenshot bytes, full URLs, hidden DOM, browser history, cookies, form values, analytics, or cloud storage was added.
- One DeepSeek fixture attempt returned non-JSON model output; the immediate retry passed with the same configured provider/model. This is an external model-format flake to keep watching in provider reliability QA.
- Copy sanitized bug report, richer Apply-gated browser-action timelines, and real-profile storage inspection remain pending.

## 2026-06-14 AI Triage First Slice

Source state verified: organize-complete Sidebar assistant messages now include a compact metadata-only `Triage` section with Workspace focus, Act now, Read later, Reference, Can close, and Needs review. It is rendered as plain Markdown inside the normal assistant result message, not a new dashboard panel.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
68 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=124
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=84ae9392deebb8bafa9de67e385044a194c055676527a2181c1b4de34edb3cdf
artifacts/ui-screenshots/sidepanel-ai-triage.png
```

Evidence notes:

- The triage builder uses only sanitized run metadata: tab titles, hostnames, paths, group names, active/protected state, duplicate-review counts, and safe-duplicate-close counts.
- The assistant message explicitly says page text was not read.
- It does not create todos, close non-duplicates, move tabs, call the Page Agent, call the search provider, add storage keys, mutate pages, or use cloud storage.
- Smoke coverage asserts `buildLocalAITriageMarkdown`, metadata-only disclosure copy, and the dedicated screenshot.
- Follow-up status: triage-to-todo and editable Workspace Goal were completed in later slices below. Deeper page-text triage and real-profile QA remain pending.

## 2026-06-14 AI Triage To Todo First Slice

Source state verified: AI Triage now has an explicit `Create todo` follow-up action under the organize-complete assistant message. The same flow is available through natural language such as `make triage a todo`. It writes one local Work Queue task with source `ai_triage`, at most 8 minimized linked-tab records, and a metadata-only checklist derived from Workspace focus / Act now / Read later / Reference / Can close / Needs review.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
68 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=3
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=133
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=cb4dc5e377eb2ec6a234807e3688095f5678ce28c794f6d93a27d25f1d584d42
artifacts/ui-screenshots/sidepanel-ai-triage-todo.png
```

Evidence notes:

- The todo is created only after explicit user action; no automatic task creation was added.
- The task writes to the existing `tabmosaic.agentTasks` key; no new storage key was added.
- Stored linked tabs are capped at 8 and use title, hostname, path, state, group id/name, and local tab id only.
- The task records `triage.metadataOnly: true`.
- The flow does not read page text, selected text, selected-region text, screenshot data, hidden DOM, full URLs, browser history, cookies, form values, provider APIs, search APIs, analytics, page mutation, tab moves/closes, or cloud storage.
- Follow-up status: editable Workspace Goal was completed in the next slice below. Deeper page-text triage and real-profile QA remain pending.

## 2026-06-14 Workspace Goal First Slice

Source state verified: organize-complete triage now has an explicit `Set goal` follow-up action, and the Sidebar also supports natural commands such as `set goal: ...`, `my goal is ...`, `clear goal`, and `what is my goal`. The saved goal is local-only under `tabmosaic.workspaceGoal`; Work Brief reads it first and uses local tab/group metadata to keep the next-action answer aligned with the user's current objective.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
68 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
First DeepSeek fixture attempt returned invalid JSON; immediate retry passed.
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=129
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=57a98328d9d75d9ec61cac59bb6901c405a6b1a8ae3fe2d8dc8152c3341bec7b
artifacts/ui-screenshots/sidepanel-workspace-goal.png
artifacts/ui-screenshots/sidepanel-work-brief.png
```

Evidence notes:

- `Set goal` creates a normal assistant Markdown message, not a separate dashboard/debug UI.
- The stored value includes sanitized goal text, source, timestamps, and `metadataOnly`.
- `what is my goal` answers from local state; `clear goal` removes the local goal.
- Work Brief starts with the saved goal and then lists local next actions such as duplicate review, Work Queue, and Later tabs.
- Clear Local Data removes `tabmosaic.workspaceGoal`.
- The flow does not read page text, selected text, selected-region text, screenshots, hidden DOM, full URLs, browser history, cookies, form values, provider APIs, search APIs, analytics, page mutation, tab moves/closes, or cloud storage.
- Remaining polish: infer better goals from local todos/memos, name saved workspaces from goals, add richer goal-based todo suggestions, and run real-profile QA on messy browsing sessions.

## 2026-06-14 Dashboard Continue Strip First Slice

Source state verified: Dashboard now renders a compact `Continue` strip only when local work signals exist. It uses the saved workspace goal, open Work Queue todos, saved Collections, Later tab states, saved workspace snapshots, and duplicate-review candidates to show one next-work entry above Smart Groups. It does not restore the old Latest Result / Current Workspace card.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
68 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=124
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=be8d3a2063d54aa7139c0d7e6810bc53b74a5ee371090d1989a763099d41042a
artifacts/ui-screenshots/dashboard-continue.png
```

Evidence notes:

- The strip is hidden until local work signals exist.
- `Ask in Sidebar` writes only a local pending prompt: `what should I continue?`.
- Other actions are narrow and local: focus a still-open task source tab, focus a Later tab, or expand Duplicate Center.
- It reads `tabmosaic.workspaceGoal`, `tabmosaic.agentTasks`, `tabmosaic.savedCollections`, `tabmosaic.savedWorkspaces`, `tabmosaic.tabWorkStates`, and the latest sanitized run only.
- It does not read page text, selected text, selected-region text, screenshots, hidden DOM, full URLs, browser history, cookies, form values, provider APIs, search APIs, analytics, page mutation, tab moves/closes, restore, reopen, upload, or cloud storage.
- Remaining polish: richer workspace history, workspace chat, and cloud/sync-backed journey resume are still blocked by confirmation gates.

## 2026-06-14 Unified Composer Context Chips First Slice

Source state verified: Sidebar composer now renders the active browser scope and typed extra context/tool intent inside the same bottom composer surface. The active scope remains the primary label, while extra preview chips show pasted link, selected text, page region/Smart Fill, Agent Search, or template intent.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
68 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=1
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=83
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=7779e8d20e235fc7b38069e08afc6ba746716f186c76dc4c386b1bece1480539
artifacts/ui-screenshots/sidepanel-composer-context-chips.png
```

Evidence notes:

- The screenshot shows `Selected tabs · 3 tabs` as the primary composer scope, with extra `Link` and `Search` chips beside it.
- Chips update from the typed draft and local Sidebar context only.
- Pasted-link chips do not fetch the linked page.
- Selected-text and page-region chips do not read highlighted text, visible page text, DOM, or screenshots.
- Search chips do not call the search provider until the user submits the search flow.
- The flow adds no storage key, permissions, provider call, analytics, page mutation, tab move/close, upload, or cloud storage.
- Remaining polish: removable/editable chips, file/PDF attachment chips, and vision/screenshot-crop chips remain pending; vision/upload behavior requires separate confirmation.

## 2026-06-14 Cost / Model Router First Slice

Source state verified: Sidebar composer picker now renders a compact local-only `Routing` hint. The hint is derived from the current typed draft and local Sidebar scope, then labels the likely route as tab metadata, current-page Page Agent, selected text, page region, selected-tabs/group, or Agent Search Tool.

Commands:

```bash
node --check extension/sidepanel.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
68 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=154
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=d69d4018cb68cf747ea4e16a8df27ff7ca3a0a20501ab549aefa97aac4651ad2
artifacts/ui-screenshots/sidepanel-model-router.png
```

Evidence notes:

- The screenshot shows the composer picker with `Routing` -> `Search Tool route` after the user types `search the web for browser work agent`.
- The hint does not switch providers, call AI/search, read page text, read selected text, start page-region selection, capture screenshots, request permissions, write storage, upload data, move/close tabs, or mutate pages.
- This is not a model marketplace. Actual multi-model automatic routing, cost/latency display, local-model preference suggestions, and vision-capable routing remain pending.

## 2026-06-14 Protected Groups / Domains First Slice

Source state verified: Sidebar now supports Apply-gated protected group/domain rules. Natural-language commands such as `protect docs.google.com domain` and `protect this group` render a normal safe-command assistant message with Apply / Cancel. Apply stores a local `tabmosaic.userRules` item with `type: protected` and `protectionScope: domain | group`. Future organize snapshots add protected reasons `domain` or `group`, so automatic grouping and safe duplicate close planning skip matching tabs.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
70 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=118
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=c0bf5c4cdfab72edaadf41ce5c4b646bec5193f49ebc684ecb2e97773cbe33c9
artifacts/ui-screenshots/sidepanel-protect-domain-rule.png
```

Evidence notes:

- First DeepSeek fixture attempt reached `/models` but the classification fixture returned invalid JSON. The immediate rerun passed classification and Page Agent fixtures; this is recorded as provider-output instability, not a code or packaging failure.
- The screenshot shows `protect docs.google.com domain` as an assistant safe-command preview with Apply / Cancel.
- The temporary preview stores no full URLs or page text.
- Apply stores only local rule metadata: rule type, protection scope, pattern, timestamps, source, and hit count.
- No tab is moved, closed, read, summarized, screenshot, uploaded, or mutated by the protection rule Apply.
- Remaining polish: richer Dashboard protected-rule management, edit/disable affordance in the minimal UI, and repeated-behavior suggestions.

## 2026-06-14 Workspace Goal Polish First Slice

Source state verified: the saved workspace goal now participates in the local execution loop instead of only being displayed. Saved workspace snapshots can default to the sanitized goal name; Sidebar recognizes goal-to-task commands such as `make goal a todo`; and Work Brief highlights local Work Queue items / saved memos that match the current goal before generic next-work suggestions.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
70 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=135
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=81482659fb4e707a2667e42b78b47cc8626b63cc6f715b271c62837bf4e7a463
artifacts/ui-screenshots/sidepanel-goal-todo.png
```

Evidence notes:

- The screenshot shows a normal chat turn: user sends `make goal a todo`, and the assistant replies with one Markdown-style message card.
- The created task source is `workspace_goal` under the existing local `tabmosaic.agentTasks` key.
- The task stores the sanitized goal, a metadata-only checklist, and minimized linked-tab metadata only.
- Saved workspace naming uses the local goal when available; it does not store page text or full URLs.
- Work Brief can now call out goal-linked todos and saved memos before generic local continuation hints.
- No page text, selected text, screenshot bytes, hidden DOM, full URLs, browser history, provider/search output, cloud storage, tab move, or tab close is added by this slice.
- Remaining polish: richer goal editing UX, stronger inference from saved local work artifacts, real-profile QA on messy sessions, and cloud/paid journey resume after confirmation.

## 2026-06-14 Todo Agent Sidebar Command Polish Second Slice

Source state verified: Sidebar now lets the user maintain the latest open local Work Queue todo from chat. The implemented commands cover explicit local task naming during creation, `rename todo to ...`, `add checklist item: ...`, and `mark first checklist item done`. Todo updates render as normal Markdown assistant messages, not Apply/Cancel safe-command cards.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
70 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=123
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=5881b4c2b96990cd56ac7c0b9157df76082ec58fe464256b14be64f10d22f490
artifacts/ui-screenshots/sidepanel-todo-checklist-edit.png
```

Evidence notes:

- The screenshot shows two normal chat turns: add a checklist item, then mark the first checklist item done.
- The update path rewrites only the latest open local item in `tabmosaic.agentTasks`.
- Stored data is sanitized title/checklist text plus existing minimized linked-tab/source metadata.
- The answer card has no Apply / Cancel preview because it is not changing browser tabs or page state.
- No page text, selected text, selected-region text, screenshots, hidden DOM, full URLs, browser history, provider/search API call, analytics, tab move, tab close, page mutation, upload, or cloud storage is added by this slice.
- Remaining polish: choose which todo to edit when multiple are open, richer checklist editing UI, true multi-source todo merge, and any browser/page execution flow only after separate confirmation.

## 2026-06-15 Search Provider Diagnostics First Slice

Source state verified: Agent Search Tool now writes and renders redacted provider diagnostics. Sidebar not-configured/failed Search Tool messages include provider, origin, API-key status, result count, error type, and privacy booleans. Dashboard Settings shows the same diagnostics as a compact status block under Search Tool settings. Diagnostics are local-only under `tabmosaic.searchDiagnostics`.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
70 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=134
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=731e08a2bfbb838537be2ea625f80197e900667b5da6fc3006c74eac226d3831
artifacts/ui-screenshots/sidepanel-web-search-setup.png
artifacts/ui-screenshots/dashboard-search-settings.png
```

Evidence notes:

- Sidebar `sidepanel-web-search-setup.png` shows the not-configured Search Tool state with redacted diagnostics and one `Open settings` action.
- Dashboard `dashboard-search-settings.png` shows a compact Search diagnostics block under Search Tool settings, not on the default workbench.
- Diagnostics store status metadata only: provider label, origin, API-key status, max results, result count, error type, timestamp, and privacy booleans.
- Smoke tests assert diagnostics do not store the typed search query or API key, and Clear Local Data removes `tabmosaic.searchDiagnostics`.
- Search still uses the internal `search_web_provider` tool. It does not open a browser search tab unless the user clicks a returned source.
- No tab/page metadata, full URLs, tab titles, page text, selected text, screenshots, search result bodies, source URLs, analytics, tab moves/closes, upload, or cloud storage is added by this slice.
- Remaining polish: real-key Tavily QA with a user-provided key, provider-specific troubleshooting copy beyond generic error types, and final provider/API-key UX confirmation for public launch.

## 2026-06-15 Research Brief Addendum First Slice

Source state verified: `Research missing info` under a Research Brief now uses the internal Search Tool after explicit user click and renders a natural assistant research addendum instead of only a raw search-results card. The addendum includes the checked query, optional provider summary, how the result changes the original brief, one next step, compact source citations, and a privacy boundary.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
70 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=83
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=6f8d23d646c1e48bfda6c376d1360245d89a2892ae7669029f5847f5fa044688
artifacts/ui-screenshots/sidepanel-research-addendum.png
```

Evidence notes:

- Screenshot `sidepanel-research-addendum.png` shows the flow after a Research Brief: the user clicks `Research missing info`, the Search Tool runs, and the final response is one assistant message with a lightweight Sources attachment.
- The addendum is session-only and uses sanitized Search Tool answer/title/hostname/snippet metadata only.
- Returned source pages are not opened, crawled, or read automatically; the user can still click `Open`, `Save`, or `Todo` on a source.
- The search provider receives only the generated search query for this follow-up, not selected-tab page text, full URLs, screenshots, hidden DOM, browser history, or cloud memory.
- No new storage key, new permission, tab move, tab close, page mutation, analytics, or cloud storage was added.
- Remaining polish: query decomposition, saved-source input, file/PDF/screenshot context, and deeper citation refinement.

## 2026-06-15 Selected-Context Writing First Slice

Source state verified: Sidebar can now route highlighted selected-text rewrite/polish prompts and the new `Rewrite selection` template through `workflow: contextual_writing`. Selected page-region draft/rewrite prompts also use the same copy-only writing workflow after the user clicks a region. The output is one assistant message with source chips, `Copy draft`, `Save memo`, and `Run log`; it does not insert text into the page.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
71 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=83
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=7c8f5ce1c54fdbd6f96eaffaab05f038a9b37a75004f1804df2a83e62e896bfc
artifacts/ui-screenshots/sidepanel-selected-text-writing.png
```

Evidence notes:

- Screenshot `sidepanel-selected-text-writing.png` shows a natural `rewrite selected text to be clearer` prompt returning a copy-only draft with `Copy draft`, `Save memo`, and `Run log`.
- Smoke tests assert selected-text writing uses `workflow: contextual_writing`, preserves highlighted-text-only payload boundaries, requests copy-only draft schema, excludes full-page body/description/headings/full URL query tokens, and never stores cloud data.
- The new `Rewrite selection` template is curated/local code, not a dynamic skill marketplace entry.
- Selected page-region writing uses the existing user-click region flow and still sends only region visible text/structure plus screenshot metadata, not screenshot bytes.
- No new permission, storage key, page mutation, auto-insert, auto-submit, tab move/close, analytics, or cloud storage was added.
- Remaining polish after this selected-context slice was multi-tab writing, saved-source writing, host-specific reply/comment adapters, and any insert/send/submit workflow. Multi-tab writing is covered by the 2026-06-15 Multi-tab Contextual Writing slice below; saved-source writing is covered by the 2026-06-15 Saved-Source Contextual Writing slice below.

## 2026-06-15 Multi-tab Contextual Writing First Slice

Source state verified: selected-tabs/current-group context can now generate copy-only project update/email/memo drafts through the multi-tab Page Agent. The flow routes the `Draft from tabs` template and natural selected-tabs/current-group writing prompts through `workflow: contextual_writing`, reuses capped selected/group visible-text extraction, validates model draft fields, and renders one normal Sidebar assistant message with `Copy draft`, `Save memo`, and `Run log`.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('quick checks ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
quick checks ok
72 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=83
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=5b3fda5373dc77eefb61a612b9673cff4824c32c44247470ab640a90482ff0e2
artifacts/ui-screenshots/sidepanel-context-tabs-writing.png
```

Evidence notes:

- Screenshot `sidepanel-context-tabs-writing.png` shows the selected-tabs writing flow as one assistant message with Draft / Context / Use before sending / Grounded in sections and `Copy draft`, `Save memo`, `Run log` actions.
- Smoke tests assert selected-tabs/current-group writing uses `workflow: contextual_writing`, requests copy-only draft schema, blocks unselected-tab reads and text insertion, excludes full URLs/query tokens, preserves `draft`, `draftPurpose`, `copyNotes`, `sourceGrounding`, and reports no full URL/cloud storage.
- The flow uses the configured BYOK provider for the capped selected/current-group visible text only after user request; it does not read unselected tabs, insert text, submit forms, send messages/email, move/close tabs, mutate pages, add permissions, add storage keys, add analytics, or create cloud memory.
- Remaining polish: file/PDF/screenshot writing inputs, host-specific reply/comment adapters, and any auto-insert/auto-submit workflow remain unimplemented until separately confirmed.

## 2026-06-15 Saved-Source Contextual Writing First Slice

Source state verified: Sidebar can now draft from explicit local saved memos/collections through a dedicated saved-source writing Agent. The natural prompt `Draft a concise project update from saved sources about pricing.` routes to `DRAFT_FROM_SAVED_SOURCES`, uses the configured OpenAI-compatible provider only when AI is configured, validates copy-only draft output, and renders one normal Sidebar assistant message with `Copy draft`, `Save memo`, and `Run log`.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
73 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=3
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=148
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=abee1498b0e6a616d75e5814894e1c655711f26c4e2e40cc3663ca1cd460da91
artifacts/ui-screenshots/sidepanel-saved-source-writing.png
```

Evidence notes:

- Screenshot `sidepanel-saved-source-writing.png` shows the saved-source writing flow as one assistant Markdown message with Draft / Context / Use before sending / Grounded in sections and compact source/privacy chips.
- Smoke tests assert saved-source writing uses `workflow: contextual_writing`, `source: saved_sources`, declares `read_saved_local_sources_after_user_request`, blocks live page reads and web search, sends sanitized saved memo/collection data only, excludes full URLs/query tokens, preserves `draft`, `draftPurpose`, `copyNotes`, `sourceGrounding`, and reports no live page text/full URL/cloud storage.
- If there are no saved sources, Sidebar renders a normal assistant message asking the user to save a source or memo first.
- If AI is not configured, saved-source text is not uploaded; Sidebar shows the existing AI setup prompt.
- No live page read, unselected-tab read, web search, link crawl, file/PDF/screenshot context, new permission, new storage key, page mutation, insert/send/submit action, tab move/close, analytics, or cloud storage was added.

## 2026-06-15 Dashboard Memory View First Slice

Source state verified: Dashboard now has a hidden/local `#memory` page that lists explicit saved memos and collections from `tabmosaic.savedMemos` and `tabmosaic.savedCollections`. The default Dashboard remains the simple Smart Groups view. Memory supports local search, Focus source for still-open linked tabs, and Ask in Sidebar through a saved-source prompt. It does not read live pages, call AI/search providers, request new permissions, create a new storage key, upload data, or create cloud memory.

Commands:

```bash
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
73 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=118
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=5f1ccb4df9b951cbf056707e6bac6b5261a884d86124ed96a23f0e7630270434
artifacts/ui-screenshots/dashboard-memory.png
```

Evidence notes:

- Screenshot `dashboard-memory.png` shows a compact Memory page with search, saved memo, saved collection, local-only metadata, source chips, Focus source, and Ask actions.
- Smoke tests assert Dashboard reads `tabmosaic.savedMemos`, includes a hidden/lightweight Memory page, renders Memory through `renderDashboardMemory`, and captures `dashboard-memory.png`.
- The Memory page is not part of the default Dashboard route and does not reintroduce default-page clutter.
- No live page read, provider call, web search, file/PDF/screenshot context, new permission, new storage key, page mutation, tab close/move, analytics, raw URL storage, or cloud memory was added.

## 2026-06-15 Todo Agent Targeted Edit / Context Merge Slice

Source state verified: Sidebar Todo Agent can now maintain a specific open local Work Queue todo when multiple todos exist. Commands can target a named todo, update checklist text, mark checklist items by ordinal/text, and merge the current Sidebar context into that todo. Ambiguous local todo matches render a clarification message instead of writing storage. Current-context merge dedupes linked tab IDs and stores only minimized tab metadata under the existing `tabmosaic.agentTasks` key.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
73 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=3
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=118
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=ed58be862cbab213f4e3c826a9a50dd67b8dae2427bd2a6477de40444fd4aecc
artifacts/ui-screenshots/sidepanel-todo-targeted-merge.png
```

Evidence notes:

- Screenshot `sidepanel-todo-targeted-merge.png` shows two open local todos, a named checklist update, and `add current context to launch checklist todo` as normal chat turns with Markdown assistant cards.
- Smoke tests assert Sidebar includes target resolution, current-context-to-todo command routing, deduped local linked-tab merge, and the targeted screenshot scenario.
- The update path rewrites only one open local Work Queue item inside `tabmosaic.agentTasks`; no new storage key was added.
- No page text, selected text, selected-region text, screenshot bytes, full URLs, provider/search calls, analytics, tab movement, tab closing, page mutation, upload, or cloud storage was added.
- Remaining polish: inline checklist reorder/delete, per-item source notes, automatic multi-source decomposition across files/screenshots/search results, and any browser/page execution flow remain pending until separately specified/confirmed.

## 2026-06-15 Dashboard Workbench Checklist Editor Slice

Source state verified: the hidden Dashboard Workbench now exposes a lightweight inline checklist editor for local Work Queue todos. The user can add a checklist item, delete an item, and move items up/down. The default Dashboard remains simple because the Workbench is still hidden from the normal customer route. Edits rewrite only the selected local `tabmosaic.agentTasks` item with sanitized checklist strings plus `checklistUpdatedAt` / `updatedAt`.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
73 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=118
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=f35e207a0e8adcf391e6b0e423f223f8cd1e1359ed4d27d36b14ff05bd25b60e
artifacts/ui-screenshots/dashboard-workbench-checklist-editor.png
```

Evidence notes:

- Screenshot `dashboard-workbench-checklist-editor.png` shows the hidden Workbench opened for QA only, with inline checklist add/reorder/delete controls on a local todo.
- Smoke tests assert Dashboard renders `renderBrowserWorkChecklistEditor`, routes checklist add/delete/up/down through `updateBrowserWorkTaskChecklist`, and captures the checklist-editor screenshot.
- The first all-in-one verification run hit one transient DeepSeek invalid-JSON fixture response. The same DeepSeek fixture was rerun immediately and passed before packaging; this is recorded as provider output variance, not a local test failure.
- No default Dashboard clutter, new storage key, page read, selected text read, screenshot upload, provider/search call, analytics, full URL storage, tab movement, tab closing, page mutation, upload, or cloud storage was added.
- Remaining polish: per-item source notes, automatic multi-source decomposition across files/screenshots/search results, and browser/page execution flow remain pending until separately specified/confirmed.

## 2026-06-15 Dashboard Workbench Checklist Source Notes Slice

Source state verified: the hidden Dashboard Workbench checklist editor now supports per-item local source notes. Each checklist row has a lightweight `Source note` field. Notes are user-edited local text, stored as aligned `checklistMeta[].sourceNote` entries on the existing local Work Queue item. Add/delete/reorder keeps the note array aligned with checklist items. The default Dashboard remains unchanged and hidden Workbench-only.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
73 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=129
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=d8f1dba51c95641773586d405df62064dcf39862abb7ae8fc2843b17872793b3
artifacts/ui-screenshots/dashboard-workbench-checklist-editor.png
```

Evidence notes:

- Screenshot `dashboard-workbench-checklist-editor.png` now shows source notes such as `Chrome Web Store copy`, `QA checklist tab`, and `Onboarding memo` under checklist rows.
- Smoke tests assert Dashboard saves per-item source notes locally via `handleBrowserWorkChecklistNoteChange`, sanitizes note text, preserves checklist metadata alignment, and captures the updated screenshot.
- The editor rewrites only the selected local `tabmosaic.agentTasks` item; no new storage key was added.
- No page read, selected text read, selected-region read, screenshot upload, provider/search call, analytics, full URL storage, tab movement, tab closing, page mutation, upload, or cloud storage was added.
- Remaining polish: automatic multi-source decomposition across saved memos/search results/files/screenshots, and browser/page execution flow remain pending until separately specified/confirmed.

## 2026-06-15 Local Multi-source Todo Decomposition First Slice

Source state verified: the hidden Dashboard Workbench now exposes `Suggest steps` on local Work Queue todos. The action appends up to four non-duplicate checklist suggestions from already-local context: per-item source notes, linked tab/source metadata, saved memos, and saved collections. Each suggested checklist item receives an aligned `checklistMeta[].sourceNote`. This is deterministic local decomposition, not AI generation, and it does not read live pages.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
73 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=118
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=1ca8e56e668c487d1f0ed71998a93d9ade178d7f7f4307b2fa85b354e1a551f8
artifacts/ui-screenshots/dashboard-workbench-checklist-editor.png
```

Evidence notes:

- Screenshot `dashboard-workbench-checklist-editor.png` shows `Suggest steps` and source-derived items such as `Check source note: ...` plus source-note fields under each checklist row.
- Smoke tests assert Dashboard includes `suggestChecklistFromLocalSources`, builds suggestions locally, uses `latestSavedMemos` / `latestSavedCollections`, and captures the source-derived suggested step in the screenshot.
- The action rewrites only one local `tabmosaic.agentTasks` item. No new storage key or decomposition artifact was added.
- No live page read, selected text read, selected-region read, screenshot upload, provider/search call, analytics, full URL storage, tab movement, tab closing, page mutation, upload, or cloud storage was added.
- Remaining polish: explicit search-result bodies, files, PDFs, screenshots, and browser/page execution flow remain pending until separately specified/confirmed.

## 2026-06-15 Local Source Action Extraction Polish

Source state verified: hidden Dashboard Workbench `Suggest steps` now prioritizes concrete action lines from already-local saved memo bodies and saved source snippets before generic Review fallbacks. In the QA fixture, it turns local saved context into checklist items such as `Confirm beta checklist remains the launch source of truth`, `Validate Hosted AI/search cost`, and `Validate positioning around tab overload and unfinished work`. This remains deterministic local decomposition; it does not call AI/search or read live pages.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
73 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=109
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=15c872f921b36e2fcdc384beeea20a8efb63da0ed6ef7dd5224f2f33d209dea2
artifacts/ui-screenshots/dashboard-workbench-checklist-editor.png
```

Evidence notes:

- Screenshot `dashboard-workbench-checklist-editor.png` now shows concrete source-derived action items instead of only `Check source note: ...` rows.
- Smoke tests assert the local action extraction helpers, per-run suggestion cap, saved memo/collection usage, and concrete screenshot wait text.
- The action rewrites only the selected local `tabmosaic.agentTasks` item with sanitized checklist text and aligned `checklistMeta[].sourceNote`.
- No live page read, selected text read, selected-region read, screenshot upload, provider/search call, analytics, full URL storage, tab movement, tab closing, page mutation, upload, or cloud storage was added.
- Remaining polish: explicit search-result body decomposition, files, PDFs, screenshots, and browser/page execution flow remain pending until separately specified/confirmed.

## 2026-06-15 Visible Screenshot Vision First Slice

Source state verified: Sidebar now has an explicit Screenshot context path for visual page questions. The flow requires a user action or explicit screenshot prompt, checks that the configured OpenAI-compatible model appears vision-capable before capture, compresses the current visible tab screenshot in memory, sends the image session-only to the configured BYOK provider with minimized title/hostname context, and renders the result as a normal assistant Markdown message.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
74 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=3
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=122
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=34d799808b57e6b22c87f3a8c60f921be2c59e4238428d34d7adaa25d1c5351e
artifacts/ui-screenshots/sidepanel-screenshot-vision.png
```

Evidence notes:

- Screenshot `sidepanel-screenshot-vision.png` shows the result as one assistant-style Markdown card with lightweight source chips, not a custom dashboard-like panel.
- Smoke tests assert the Vision Agent uses an `image_url` payload, sends the compressed screenshot data URL only for the explicit vision request, excludes full URL/query token text, and marks `sentScreenshot: true`, `sentPageText: false`, and `storedCloud: false`.
- The local summary deliberately strips `screenshot.dataUrl`; screenshot bytes are not written to storage, memos, transcripts, diagnostics, or package metadata.
- The flow does not read hidden DOM, page text outside the visible screenshot, cookies, browser history, form values, search results, or cloud memory; it does not mutate pages, submit forms, move tabs, or close tabs.
- Remaining polish: real vision-provider manual QA, cropped selected-region vision, file/PDF contexts, richer screenshot follow-up grounding, and browser/page execution flow remain pending.

## 2026-06-15 Page Region Cropped Vision First Slice

Source state verified: Sidebar selected page-region flow now has a vision-capable branch. After the user starts the region flow and clicks one visible page region, text-only models keep the existing selected-region text/structure + cropped metadata path. If the configured OpenAI-compatible model appears vision-capable, the background worker sends the cropped selected-region image as a multimodal `image_url` part with minimized selected-region text/structure metadata, then discards the image data.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
75 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=135
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=11d7d41e370d9bf07715eca1037ab42f301be149755a611182016cf47ce3a0a6
artifacts/ui-screenshots/sidepanel-page-region-vision.png
```

Evidence notes:

- Screenshot `sidepanel-page-region-vision.png` shows the flow as a normal assistant conversation: user bubble, lightweight `Region selected` tool card, assistant answer, source chips, and Save memo / Run log.
- Smoke tests assert region vision uses a dedicated multimodal request, sends the cropped image only in the `image_url` part, keeps the text JSON free of image data URLs, full URLs, and query tokens, and validates `sentScreenshot: true`, `sentPageText: true`, `sentFullUrls: false`, and `storedCloud: false`.
- The existing text-only selected-region test still asserts `imageDataUploaded: false` and no screenshot data URL leakage.
- No new storage key, host permission, analytics event, cloud memory, page mutation, form submit, auto-fill, tab move, or tab close was added.
- Remaining polish: real vision-provider manual QA on complex SaaS pages, richer visual grounding, cropped image annotation/editing, file/PDF contexts, and browser/page execution flow.

## 2026-06-15 Research Brief Query Decomposition First Slice

Source state verified: Research Brief follow-up search now supports a bounded multi-query path. When the user explicitly clicks `Research missing info`, the sidebar decomposes the missing-info need into up to three focused Search Tool queries, calls the already-configured provider for each query, dedupes sources, and renders one compact assistant Markdown addendum.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
75 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=3
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=142
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=2d4171c113341efd94d8ea068f83a196b5ca14572aaa42a16e9f876a9f887e1a
artifacts/ui-screenshots/sidepanel-research-addendum.png
```

Evidence notes:

- Screenshot `sidepanel-research-addendum.png` shows the result as a normal assistant Markdown card: focused query list, provider summary, changed recommendation, boundary note, and source links.
- Smoke tests assert the query decomposition helpers, the multi-query screenshot state, matching English/Chinese locale keys, and existing search-provider configuration boundaries.
- The flow sends only sanitized query strings to the configured Search Tool provider. It does not send selected-tab page text, full URLs, screenshot bytes, saved-source bodies, files, PDFs, browser history, cookies, form values, analytics, or cloud memory.
- The source merge caps and dedupes returned links before rendering; the sidebar keeps the addendum compact rather than turning search into a separate dashboard-like panel.
- No new permission, storage key, analytics event, page mutation, tab movement, or tab closing behavior was added.
- Remaining polish: saved-source input, file/PDF/screenshot context, richer citation refinement, and real provider QA once search credentials are configured.

## 2026-06-15 Visual Review Prompt Template First Slice

Source state verified: Prompt / Skill Templates now include a `Visual review` skill. It is a discoverability layer over the existing explicit Screenshot Vision flow: selecting the template sends a normal user prompt, captures the current visible screenshot only after that user action, and renders the answer as the existing assistant Markdown screenshot answer.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
75 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=83
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=9426b1f6900364cb473f2a67f4a0902b1f1a1c32a8b2fd9253375cc918135901
artifacts/ui-screenshots/sidepanel-template-visual-review.png
```

Evidence notes:

- Screenshot `sidepanel-template-visual-review.png` shows `Visual review` as one compact template item inside the existing composer picker, not a new panel or Dashboard surface.
- Smoke tests assert the template id, route, screenshot vision workflow metadata, English/Chinese localization, and screenshot coverage.
- The template reuses the existing explicit screenshot vision path. It does not add background screenshot capture, hidden DOM reading, page mutation, form submission, tab movement, tab closing, analytics, cloud memory, or new permissions.
- The visible screenshot image remains session-only and follows the existing vision-provider gate; non-vision models still fail safely with the existing setup message.
- Remaining polish: file/PDF templates, richer template source chips, and real-profile visual QA on complex SaaS pages.

## 2026-06-15 Saved-Source Research Brief First Slice

Source state verified: Saved local memos/collections can now be used as explicit Research Brief input. Natural prompts such as `Create a research brief from saved sources about pricing` route through `DRAFT_FROM_SAVED_SOURCES` with `workflow: research_brief`, send only sanitized saved-source excerpts to the configured OpenAI-compatible provider, and render findings, contradictions, gaps, next steps, and source notes as one assistant Markdown message.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
76 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=124
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=ccc883d4f61bb02acc7fc94641e943a5b3e15203dee02b42bb33e712ffec7ac9
artifacts/ui-screenshots/sidepanel-saved-source-research-brief.png
```

Evidence notes:

- Screenshot `sidepanel-saved-source-research-brief.png` shows one normal assistant research message with Findings, Contradictions, Gaps, Next steps, Sources, compact source chips, Save memo, and Research missing info.
- Smoke tests assert natural saved-source research routing, the dedicated `workflow: research_brief` payload, the saved-source research system prompt, schema fields, localization/screenshot coverage, and privacy metadata.
- The provider payload uses only explicit local `tabmosaic.savedMemos` / `tabmosaic.savedCollections` excerpts selected for the request. It does not read live pages, request site access, search the web before explicit missing-info follow-up, include full URLs/query/hash, parse files/PDFs/screenshots, add storage keys, mutate pages, move/close tabs, or create cloud memory.
- The first slice intentionally does not show tab-based Create todo for saved-source research because no live tab context is required. Save memo and Research missing info are available.
- Remaining polish: file/PDF/screenshot context for research briefs, deeper citation refinement, and a proper source-based todo model if we decide saved-source research should create Work Queue tasks.

## 2026-06-15 Saved-Source Decision Brief First Slice

Source state verified: Saved local memos/collections can now be used as explicit Decision Brief input. Natural prompts such as `Create a decision brief from saved sources about pricing` route through `DRAFT_FROM_SAVED_SOURCES` with `workflow: decision_brief`, send only sanitized saved-source excerpts to the configured OpenAI-compatible provider, and render recommendation, decision criteria, source tradeoff table, assumptions, missing information, next steps, and source notes as one assistant Markdown message.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
77 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=3
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=135
pageAgentKeyPoints=4
PASS release package verified for v0.1.0
sha256=4afd82fa7b21ba5ad8b3089cda485099b2ca4729dcb044cca29d2c5288fcdb5d
artifacts/ui-screenshots/sidepanel-saved-source-decision-brief.png
```

Evidence notes:

- Screenshot `sidepanel-saved-source-decision-brief.png` shows one normal assistant decision message with Recommendation, Decision criteria, source tradeoff table, Tradeoffs, and compact source/privacy chips.
- Smoke tests assert natural saved-source decision routing, the dedicated `workflow: decision_brief` payload, the saved-source decision system prompt, schema fields, screenshot coverage, and privacy metadata.
- The provider payload uses only explicit local `tabmosaic.savedMemos` / `tabmosaic.savedCollections` excerpts selected for the request. It does not read live pages, request site access, search the web before explicit missing-info follow-up, include full URLs/query/hash, parse files/PDFs/screenshots, add storage keys, mutate pages, move/close tabs, or create cloud memory.
- The first slice intentionally does not show tab-based Create todo for saved-source decision because no live tab context is required. Save memo and Research missing info are available.
- Remaining polish: search-result synthesis, file/PDF/screenshot context for decision briefs, deeper citation refinement, and a proper source-based todo model if we decide saved-source decisions should create Work Queue tasks.

## 2026-06-15 Decision Brief Query Decomposition First Slice

Source state verified: `Research missing info` under a Decision Brief now uses the same bounded addendum path as Research Brief. After explicit user click, the Sidebar decomposes decision gaps into up to three focused Search Tool queries, calls the configured provider for each query, dedupes returned sources, and renders one compact assistant Markdown addendum.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
77 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=118
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=94fbf47b875c3a701a92adf253ce77d7521227c652f1e271696eac9191ddf3da
artifacts/ui-screenshots/sidepanel-decision-addendum.png
```

Evidence notes:

- Screenshot `sidepanel-decision-addendum.png` shows the flow after a Decision Brief: the user clicks `Research missing info`, the Search Tool runs 3 focused queries, and the final response is one assistant addendum with Sources.
- Smoke tests assert Decision Brief missing-info follow-up uses `kind: "decision_brief"` and the shared multi-query addendum path.
- The flow sends only sanitized query strings to the configured Search Tool provider. It does not send selected-tab page text, full URLs, screenshot bytes, saved-source bodies, files, PDFs, browser history, cookies, form values, analytics, or cloud memory.
- No new permission, storage key, analytics event, page mutation, tab movement, or tab closing behavior was added.
- Remaining polish: file/PDF/screenshot context, richer citation refinement, and real provider QA once search credentials are configured.

## 2026-06-15 Search-Result Decision Brief First Slice

Source state verified: current-session Agent Search results can now become explicit Decision Brief input. The Search Tool result card exposes a lightweight `Brief` action, and natural prompts such as `Create a decision brief from these search results` route through `DRAFT_FROM_SEARCH_RESULTS` with `workflow: decision_brief`.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
78 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=3
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=118
pageAgentKeyPoints=3
PASS release package verified for v0.1.0
sha256=2a6f6fedcf37a3e4d565e8def943099cbb4d36aaa2b790aa80a15384e84cb93f
artifacts/ui-screenshots/sidepanel-search-results-decision-brief.png
```

Evidence notes:

- Screenshot `sidepanel-search-results-decision-brief.png` shows the flow after Agent Search: the user can turn session search results into one normal assistant Decision Brief message with source/privacy chips and `Save memo` / `Research missing info`.
- Smoke tests assert Search card `Brief` routing, natural search-result decision command routing, `DRAFT_FROM_SEARCH_RESULTS`, `source: search_results`, source-specific Agent prompt labels, session-search-result permission disclosure, screenshot coverage, and provider payload privacy metadata.
- The provider payload sends only current-session search result titles, hostnames, sanitized paths, snippets, source labels, workflow label, and short local conversation context. It does not send full URLs/query/hash, live page text, selected-tab page text, saved-source bodies, files/PDFs/screenshots, browser history, cookies, form values, analytics, or cloud memory.
- The flow does not open result pages, search again, mutate pages, move/close tabs, create new storage keys, or create tab-based Work Queue todos in this first slice.
- Remaining polish: file/PDF/screenshot context for decision briefs, deeper citation refinement, and real Search Tool provider QA once search credentials are configured.

## 2026-06-15 Visible-Screenshot Decision Brief First Slice

Source state verified: the explicit Screenshot context can now become a Decision Brief input. Prompts such as `Create a decision brief from this screenshot` route through `SUMMARIZE_VISIBLE_SCREENSHOT` with `workflow: decision_brief`, require the existing vision-capable provider gate, send one compressed current visible-tab screenshot plus title/hostname metadata, and render recommendation, criteria, visible-evidence tradeoffs, assumptions, missing information, source notes, and next steps as one normal assistant Markdown message.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
79 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=83
pageAgentKeyPoints=3
SKIP synthetic Page Agent 10-turn fixture; pass --page-agent-10-turn-fixture to test multi-turn current-page chat.
PASS release package verified for v0.1.0
sha256=c7d536fbfb000bb833348c9c681dcbd2844ded9311c881862071c6c4b42ccded
artifacts/ui-screenshots/sidepanel-screenshot-decision-brief.png
```

Evidence notes:

- Screenshot `sidepanel-screenshot-decision-brief.png` shows the flow as one normal assistant Decision Brief card with compact source/privacy chips and the composer below it.
- Smoke tests assert the Vision Agent uses `workflow: decision_brief`, sends the screenshot only through the multimodal `image_url` payload, requests decision-specific schema fields, and avoids full URL/token leakage in text payloads.
- Privacy metadata stays `sentScreenshot: true`, `sentPageText: false`, `sentFullUrls: false`, and `storedCloud: false`.
- The flow does not read hidden DOM or off-screen page text, does not parse files/PDFs/search results/saved-source bodies, does not mutate pages, move/close tabs, create a new storage key, or persist screenshot bytes.
- Remaining polish: real vision-provider manual QA on complex SaaS pages, file/PDF decision inputs, and richer citation refinement.

## 2026-06-15 Sidebar Long-Answer Composer Handoff Polish

Source state verified: Sidebar long assistant answers now align to the bottom of the latest message more reliably, so source chips and follow-up actions remain visible above the composer. The composer handoff uses a lightweight gradient overlay instead of a large blank spacer, keeping the chat surface visually continuous for long Decision Briefs and 10-turn conversations.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node --check tools/package_extension.js
node --check tools/verify_release_package.js
node -e "for (const f of ['extension/_locales/en/messages.json','extension/_locales/zh_CN/messages.json']) { JSON.parse(require('fs').readFileSync(f, 'utf8')); } console.log('locale json ok')"
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
locale json ok
79 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=83
pageAgentKeyPoints=3
SKIP synthetic Page Agent 10-turn fixture; pass --page-agent-10-turn-fixture to test multi-turn current-page chat.
PASS release package verified for v0.1.0
sha256=ea1f6386981e3702ed1aaf2979f1ee97bfd6a0eccf6311b8542be9f0377c4506
artifacts/ui-screenshots/sidepanel-screenshot-decision-brief.png
artifacts/ui-screenshots/sidepanel-10-turn-chat.png
```

Evidence notes:

- Screenshot `sidepanel-screenshot-decision-brief.png` now shows the bottom of the long Decision Brief, source chips, and `Save memo` / `Research missing info` actions above the composer.
- Screenshot `sidepanel-10-turn-chat.png` shows recent multi-turn current-page chat messages with Save memo / Run log actions visible and the composer stable at the bottom.
- Smoke tests assert the new bottom alignment helper and the composer handoff CSS guard.
- No new permission, storage key, AI/search call, page read, screenshot upload behavior, analytics event, tab movement, tab closing, or cloud storage behavior was added.

## 2026-06-15 Visible Screenshot Research Brief

Source state verified: explicit screenshot research prompts now route through the visible screenshot vision path with `workflow: research_brief`. The Sidebar renders the result as one Markdown assistant message with findings, contradictions, gaps, next steps, source notes, source/privacy chips, and only source-appropriate follow-ups (`Save memo` / `Research missing info`).

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/deepseek_smoke_test.js --classify-fixture --page-agent-fixture
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
80 smoke tests passed
PASS UI screenshots captured
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS synthetic Page Agent fixture completed
pageAgentAnswerChars=83
pageAgentKeyPoints=3
SKIP synthetic Page Agent 10-turn fixture; pass --page-agent-10-turn-fixture to test multi-turn current-page chat.
PASS release package verified for v0.1.0
sha256=4aefefb0e2951dcb19989d96c247d467e891e67ddbaf55637a132ba510db3792
artifacts/ui-screenshots/sidepanel-screenshot-research-brief.png
```

Evidence notes:

- Screenshot `sidepanel-screenshot-research-brief.png` shows a screenshot-derived Research Brief as a normal assistant Markdown message, not a custom complex card.
- Smoke tests assert `SUMMARIZE_VISIBLE_SCREENSHOT` uses `workflow: research_brief`, sends the screenshot only through the multimodal `image_url` payload, requests research-specific schema fields, and avoids full URL/token leakage in text payloads.
- Privacy metadata stays `sentScreenshot: true`, `sentPageText: false`, `sentFullUrls: false`, and `storedCloud: false`.
- The flow does not read hidden DOM or off-screen page text, does not parse files/PDFs/search results/saved-source bodies, does not mutate pages, move/close tabs, create a new storage key, or persist screenshot bytes.
- DeepSeek text-provider smoke passed for classification and Page Agent fixtures. Real screenshot/vision manual QA still requires a configured vision-capable OpenAI-compatible model; the current `deepseek-v4-flash` text smoke does not prove image understanding.

## 2026-06-15 Agentic Classification Refinement Visibility Polish

Source state verified: completed organize messages now keep metadata-only split/merge refinement suggestions visible as a folded note inside the normal Sidebar assistant message. Broad same-domain groups such as `GitHub` can surface workflow-level split suggestions, for example Code Review / Issue Triage / CI Runs, instead of silently staying as a domain bucket.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
80 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=6a6ce99efefa6b79324672926b04805d699b78904b11216fe7bc013c11780031
artifacts/ui-screenshots/sidepanel-classification-refinements.png
```

Evidence notes:

- Screenshot `sidepanel-classification-refinements.png` shows the folded `Suggested refinements` section opened inside the organize assistant message, not as a separate Dashboard-like panel.
- Smoke tests assert completed organize output no longer hides classification insights and that broad same-domain groups can produce workflow-level split suggestions from metadata.
- The implementation is metadata-only: title, hostname, path, tab/group state, and derived local workflow/project features. It does not read page text, full URLs, screenshots, history/bookmarks, or cloud data.
- Split/merge suggestions are not applied automatically; they only tell the user where the current grouping may be improved.
- Remaining classification gap: real-profile QA with messy office/knowledge-work tabs and the real configured AI provider when available.

## 2026-06-15 Agentic Classification Refinement Preview Action

Source state verified: users can type `preview refinements` after an organize run to turn the latest metadata-only split suggestions into a normal Apply/Cancel regrouping preview. The preview uses real current tab IDs, includes the suggested refined groups, and still does not change Chrome until Apply.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
git diff --check
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
80 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=1cd9c25db082e4d7463cd2fd8360075f29b8b7e2bb6ab3a9587411b430f25547
artifacts/ui-screenshots/sidepanel-classification-refinement-preview.png
```

Evidence notes:

- Screenshot `sidepanel-classification-refinement-preview.png` shows the user message `preview refinements` followed by one assistant regrouping preview with Apply / Cancel.
- Smoke tests assert `buildClassificationRefinementDraft` turns same-domain metadata split suggestions into `regroup_tabs` drafts with real tab IDs and metadata-only privacy flags.
- The preview does not call the AI provider, read page text, send full URLs, take screenshots, read history/bookmarks, close tabs, or mutate Chrome before Apply.
- GitHub CI run metadata now maps to deployment/debugging-style workflow instead of being collapsed into code review when title/path metadata supports that distinction.
- Remaining classification gap: real-profile QA and user review of how aggressive refinement previews should be on messy work windows.

## 2026-06-15 Sidebar Workspace Chat First Slice

Source state verified: users can ask natural workspace questions such as `summarize my workspace`, `show workspace todos`, `show saved sources`, and `review workspace risks`. The Sidebar returns one compact Markdown assistant message from local workspace state only, with optional Open rows for still-open tabs.

Commands:

```bash
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
git diff --check
node tools/package_extension.js
node tools/preflight.js
```

Result:

```text
80 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=d36a436a07bb75c3892b83b18d9b003c1c0e6b5009037603bea504567b1c1767
artifacts/ui-screenshots/sidepanel-workspace-chat.png
```

Evidence notes:

- Screenshot `sidepanel-workspace-chat.png` shows a normal Sidebar assistant message with goal, local workspace snapshot, Work Queue, cleanup risk, and follow-up prompts.
- Smoke tests assert local Workspace Chat has its own route, avoids being stolen by generic summarize commands, does not steal explicit local `find/search/open/focus` commands, and renders as a normal assistant message.
- The flow uses latest local tab/group snapshot, saved workspace goal, local Work Queue, saved memos, saved collections, saved workspace snapshots, tab states, and duplicate-review metadata only.
- It does not read page text, full URLs, screenshots, Chrome history/bookmarks, AI/search provider output, browser mutation APIs, upload, or cloud storage.
- Full historical workspace chat, full restore, cloud sync, embeddings, and cross-device memory remain confirmation-gated future work.

## 2026-06-15 Full Optional Preflight / Search Routing QA Refresh

Source state verified: local Browser Work Search now keeps a clearer boundary from open-tab search. Queries that explicitly mention local work objects such as memos, todos, workspaces, collections, saved work, or local work route to Browser Work Search; simple open-tab queries such as `find github` remain open-tab search. This fixes the screenshot/runtime route where a saved memo search could be swallowed by tab search.

Commands:

```bash
node --check extension/sidepanel.js
node --check tools/capture_ui_screenshots.js
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/preflight.js --deepseek-fixture --runtime --agent-flow --large-runtime --screenshots
```

Result:

```text
80 smoke tests passed
PASS UI screenshots captured
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_REPO_PUSH=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS Chrome runtime read synthetic HTTP page content with a temporary fixture host grant, rendered content regroup preview, and applied native groups
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, context-aware composer state, selected-tabs context tool card, selected-tabs follow-up routing, ephemeral chat thread, capability answer, open-ended chat fallback, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
PASS Chrome runtime large-tab probe organized 96 synthetic tabs in 485ms with 8 groups, 96 moved tabs, 8 safe duplicate closes, and 9 review duplicate groups
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=4a314f9959d565d7da085681f1ae4e9f3bf018482bb8f8265223e7005a774dda
PUBLIC_LAUNCH_BLOCKERS=D-L03: public brand/domain not finalized; D-L04: public developer identity/support email not confirmed; D-L05: privacy policy URL not confirmed; D-L06: Chrome Web Store single-purpose wording not approved; D-L07: Chrome Web Store data-use disclosure not approved; D-L08: first public build BYOK scope not approved; D-L09: free/pro boundary not approved; D-L10: analytics policy not approved; D-L11: real-profile QA not completed; D-L12: final screenshots/demo not approved; D-L13: beta user ramp not approved; D-L14: public launch timing not approved
```

Generated synthetic screenshots include:

```text
artifacts/ui-screenshots/sidepanel-local-memo-search.png
artifacts/ui-screenshots/sidepanel-browser-work-search.png
artifacts/ui-screenshots/sidepanel-workspace-chat.png
artifacts/ui-screenshots/sidepanel-10-turn-chat.png
artifacts/ui-screenshots/dashboard-overview.png
artifacts/store-screenshots/01-one-click-native-groups.png
artifacts/store-screenshots/02-tab-agent-sidebar.png
artifacts/store-screenshots/03-smart-groups-dashboard.png
artifacts/store-screenshots/04-page-chat.png
artifacts/store-screenshots/05-mobile-dashboard.png
```

Evidence notes:

- The first full optional preflight attempt reached Beta Readiness and failed only because the latest package hash had not yet been recorded in this evidence file. This section records that hash.
- Runtime QA used temporary Chrome for Testing profiles and synthetic QA pages/tabs only.
- DeepSeek QA used the locally configured `.env.local` provider but did not print the API key.
- The Search Tool provider still requires real-key Tavily-style QA later; this run tested the configured DeepSeek text provider and local search routing, not external web search.
- Real-profile manual QA on the user's day-to-day Chrome windows remains pending and is still required before Chrome Web Store / public marketing launch.

## 2026-06-15 Workspace Goal Local Inference Polish

Source state verified: when no workspace goal is saved, Sidebar can infer a likely goal from extension-created local work artifacts: Work Queue todos, saved memos, saved collections, saved workspace snapshots, Later tab states, and latest tab/group metadata. The inferred goal is shown as a suggestion and is not saved unless the user explicitly says `set goal: ...`.

Commands:

```bash
node --check extension/sidepanel.js
node --check tools/capture_ui_screenshots.js
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/preflight.js --screenshots
```

Result:

```text
80 smoke tests passed
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=32766aa96b9c5cf57763958f57a2edd17fec43a6641f5c1bc696f5323fabfd39
artifacts/ui-screenshots/sidepanel-workspace-inferred-goal.png
```

Evidence notes:

- Screenshot `sidepanel-workspace-inferred-goal.png` shows the user asking `what is my workspace goal?` with no saved goal, and the assistant inferring `Review private beta launch checklist` from local work.
- The inference is deterministic local logic. It does not call DeepSeek, Search Tool, vision, or any external provider.
- It does not read page text, full URLs, screenshots, Chrome history/bookmarks, cookies, hidden DOM, cloud storage, or the web.
- Work Brief and Workspace Chat can use the inferred goal for local next-step ordering, but the product still requires an explicit `set goal: ...` command before storing it as `tabmosaic.workspaceGoal`.
- Public launch remains blocked by the existing confirmation and real-profile QA gates.

## 2026-06-15 Dashboard Rules & Memory Readability Polish

Source state verified: Dashboard now keeps the default customer page simple while the hidden `#rules` page renders local rules as human-readable memory rows. Classification rules show as `Group`; protected domain/group rules show as `Protect`; each row includes source, hit count, last-used date when available, and a local-only safety boundary.

Commands:

```bash
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/preflight.js --screenshots
```

Result:

```text
locale json ok
80 smoke tests passed
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=c1df7ba7702cc241e7d83e563eed3f92983779b5e7a46568272577fa620a439c
artifacts/ui-screenshots/dashboard-rules-memory.png
```

Evidence notes:

- Screenshot `dashboard-rules-memory.png` shows two local grouping rules and one protected-domain rule.
- The hidden Rules page uses existing `tabmosaic.userRules` data only.
- The polish does not add permissions, page reads, AI/provider calls, search calls, full URL storage, cloud storage, analytics, tab moves, or tab closes.
- Delete still requires confirmation and only removes the local rule.
- Public launch remains blocked by the existing confirmation and real-profile QA gates.

## 2026-06-15 Memory Relief Safe Command First Slice

Source state verified: Sidebar now supports an Apply-gated memory relief safe command. Natural prompts such as `reduce memory pressure by sleeping inactive tabs` create a normal assistant message with Apply / Cancel. Apply re-scans live tabs, discards/sleeps only inactive safe http/https tabs, collapses inactive groups, and saves likely read-later tabs locally. It does not close non-duplicate tabs or claim exact MB saved.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/preflight.js --screenshots
```

Result:

```text
82 smoke tests passed
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=9b74e97b43fe93106b5ffba19683f63bec6d1c6383d330ac45f4b24b11813a79
artifacts/ui-screenshots/sidepanel-memory-relief-command.png
```

Evidence notes:

- Screenshot `sidepanel-memory-relief-command.png` shows the safe-command preview as a normal Sidebar chat message.
- The tested plan skips active, pinned, audible, protected, incognito, internal, and already-suspended tabs.
- Apply uses `chrome.tabs.discard` for inactive safe tabs and `chrome.tabGroups.update(..., { collapsed: true })` for inactive native groups.
- Likely read-later tabs are saved locally in `tabmosaic.tabWorkStates` and one local Work Queue item; Undo can remove that local Later state through the existing tab-state undo path.
- This slice does not close non-duplicate tabs. Save-for-later then close remains blocked by D-062 confirmation.
- It does not read page text, full URLs, selected text, selected-region text, screenshots, hidden DOM, browser history/bookmarks, cookies, form values, AI/search providers, analytics, cloud storage, or exact memory MB values.
- Public launch remains blocked by the existing confirmation and real-profile QA gates.

## 2026-06-15 Dashboard Rules & Memory Manual Editor First Slice

Source state verified: the hidden Dashboard `#rules` page now includes a compact local rule editor for manual `domain` and `url_pattern` Group rules. It can create a local rule, edit existing Group rules, toggle rules, and delete with confirmation. Protected rules cannot be repurposed by the editor.

Commands:

```bash
node --check extension/dashboard.js
node --check tools/capture_ui_screenshots.js
node --check tools/extension_smoke_test.js
node -e "JSON.parse(require('fs').readFileSync('extension/_locales/en/messages.json','utf8')); JSON.parse(require('fs').readFileSync('extension/_locales/zh_CN/messages.json','utf8')); console.log('locale json ok')"
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/preflight.js --screenshots
```

Result:

```text
locale json ok
82 smoke tests passed
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=b73d481c11a8f5be49399383a6767ddcf2575638215a08c9b405123d611d953d
artifacts/ui-screenshots/dashboard-rules-memory.png
```

Evidence notes:

- Screenshot `dashboard-rules-memory.png` shows the hidden Rules page with the compact editor and a newly saved `linear.app -> Product Work` rule.
- Saving a rule writes only sanitized local `tabmosaic.userRules` fields: type, pattern, target group, source, timestamps, enabled state, priority, and hit count.
- Protected rules can be enabled, disabled, or deleted here, but the editor blocks repurposing them as classification rules.
- This slice does not run organize, move tabs, close tabs, read page text, upload data, call AI/search providers, collect analytics, mutate pages, or add UI to the default Dashboard.
- Public launch remains blocked by the existing confirmation and real-profile QA gates.

## 2026-06-15 Auto-Add Suggest Mode Safe First Slice

Source state verified: Sidebar now supports a user-triggered suggested-group safe command. Natural prompts such as `suggest group for this tab` create a normal assistant message with Apply / Cancel. The preview suggests an existing or new task-based group from local metadata and Apply moves only the current still-open tab through the existing move/Undo path.

Commands:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check tools/extension_smoke_test.js
node --check tools/capture_ui_screenshots.js
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/preflight.js --screenshots
```

Result:

```text
82 smoke tests passed
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
sha256=808c2a1b87df0e1df08566df055d66ecb0db9cd664eba4735667983c11429bfe
artifacts/ui-screenshots/sidepanel-suggest-group-command.png
```

Evidence notes:

- Screenshot `sidepanel-suggest-group-command.png` shows `suggest group for this tab` as a normal Sidebar safe-command message with Apply / Cancel.
- The suggestion scores task/project/workflow metadata before same-domain evidence, so it does not simply group by URL prefix.
- Apply re-scans live tabs and moves only the previewed current tab if it is still safe and open.
- This slice does not add background new-tab listeners, default auto-move, Auto mode, new permissions, page reads, full URL upload, provider/search calls, analytics, cloud storage, tab close, or page mutation.
- D-057 remains the confirmation gate for true background/default auto-add behavior.
- Public launch remains blocked by the existing confirmation and real-profile QA gates.

## 2026-06-15 Chrome Runtime QA Refresh

Source state verified: automated runtime QA was re-run against a temporary Chrome profile with the unpacked extension loaded through Chrome debugging. This is stronger than mock UI screenshots because it exercises real Chrome tabs, real native tab groups, the Sidebar composer, Dashboard operations, Undo/Restore paths, and the DeepSeek Agent flow. It still does not replace the final redacted real-profile manual QA pass required before Chrome Web Store submission.

Commands:

```bash
node tools/chrome_runtime_smoke_test.js
node tools/chrome_runtime_smoke_test.js --large-tabs
node tools/chrome_runtime_smoke_test.js --agent-flow
```

Result:

```text
PASS Chrome runtime read synthetic HTTP page content with a temporary fixture host grant, rendered content regroup preview, and applied native groups
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, context-aware composer state, selected-tabs context tool card, selected-tabs follow-up routing, ephemeral chat thread, capability answer, open-ended chat fallback, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
PASS Chrome runtime large-tab probe organized 96 synthetic tabs in 1446ms with 9 groups, 96 moved tabs, 8 safe duplicate closes, and 9 review duplicate groups
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
```

Evidence notes:

- The normal runtime probe verified real native tab grouping, safe duplicate close/restore, Sidebar composer commands, current-page chat, selected-tabs context disclosure, content-assisted regrouping, Dashboard apply, Dashboard tab move/drag/drop/focus, local workspace save/delete, Undo, and Restore Closed.
- The large-tab probe verified bounded behavior with 96 synthetic tabs and sanitized run snapshots.
- The DeepSeek Agent probe verified a real configured OpenAI-compatible provider path through the Sidebar composer, including a follow-up answer, AI action draft, and Apply moving two tabs.
- Runtime profiles were temporary and synthetic; this did not use the user's real browsing profile.
- Public Chrome Web Store launch still requires final brand/domain, support email, privacy policy URL, store disclosures, final screenshot/demo approval, beta ramp approval, public timing approval, and one redacted real-profile manual QA pass.

## 2026-06-15 Public Launch Tracker Update

Source state verified: `05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md` now includes a one-page launch tracker that turns each remaining public launch gate into an owner, next action, and evidence source. The tracker separates tasks that can continue without confirmation from tasks that must wait for user approval before changing public state.

Commands:

```bash
node --check tools/beta_readiness_check.js
node tools/beta_readiness_check.js
git diff --check
```

Result:

```text
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_SOURCE_RELEASE=yes
PUBLIC_SOURCE_RELEASE_BLOCKERS=none
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
```

Evidence notes:

- The tracker covers D-L03 through D-L14 and identifies whether each blocker requires user input, QA, or later build work.
- `tools/beta_readiness_check.js` now requires the tracker markers so the launch packet keeps this operational checklist.
- No product behavior, permissions, privacy defaults, provider behavior, tab automation, billing, analytics, or public-launch decision was changed.

## 2026-06-15 Launch Readiness Report Command

Source state verified: added `tools/launch_readiness_report.js`, a command-line report that reads the one-page public launch tracker and `tools/public_repo_audit.js` output, then prints the current public source / public repo / marketing / Chrome Web Store readiness plus every remaining gate, owner, next action, and evidence source. It also supports `--json` for future CI or release automation.

Commands:

```bash
node --check tools/launch_readiness_report.js
node tools/launch_readiness_report.js
node tools/launch_readiness_report.js --json
node --check tools/preflight.js
node --check tools/beta_readiness_check.js
node tools/beta_readiness_check.js
node tools/preflight.js
```

Result:

```text
Launch readiness report
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_REPO_PUSH=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
Public source release blockers: none
Public launch blockers: 12 gate(s) still blocking public launch
Needs user input: 11
Needs QA: 2
Needs build after approval: 0
PASS controlled private beta readiness evidence checked
PASS preflight completed
```

Evidence notes:

- `tools/preflight.js` now syntax-checks and runs the launch readiness report after the public repo audit.
- `tools/beta_readiness_check.js` now requires the report tool and its key status/output markers.
- README focused checks and INDEX now link the report command.
- The report is informational and intentionally exits successfully while public launch remains blocked; it does not approve or change any public-launch decision.
- No extension behavior, permissions, privacy defaults, AI provider behavior, tab automation, billing, analytics, Chrome Web Store submission state, or public marketing state changed.

## 2026-06-15 Launch Decision Reply Template

Source state verified: `tools/launch_readiness_report.js` now prints a copyable public launch decision reply template and supports `--template-only`. The template covers D-L03 through D-L14 with placeholders for brand/domain, support email, privacy URL, Chrome Web Store wording, data-use disclosure, BYOK scope, Free/Pro boundary, analytics policy, real-profile QA, screenshots/demo, beta ramp, and launch timing.

Commands:

```bash
node --check tools/launch_readiness_report.js
node tools/launch_readiness_report.js --template-only
node tools/launch_readiness_report.js --json
node --check tools/beta_readiness_check.js
node tools/beta_readiness_check.js
node tools/preflight.js
```

Result:

```text
Copyable public launch decision reply
D-L03 change: final public name = <name>; domain path = <domain or subdomain>; TabMosaic AI is <working-name only / final name>.
D-L04 change: developer name = <name>; support email = <email>; website URL = <url>.
D-L05 change: privacy policy URL = <url>; privacy policy wording = <approve / changes below>.
...
D-L14 approve launch timing: <GitHub source release now / marketing later / Chrome Web Store later>, or change: <timing plan>.
PASS controlled private beta readiness evidence checked
PASS preflight completed
```

Evidence notes:

- JSON output now includes `decisionReplyTemplate` for future release automation.
- `tools/beta_readiness_check.js` requires the template builder and `--template-only` marker.
- README documents `node tools/launch_readiness_report.js --template-only` in focused checks.
- The template is not an approval. It is a structured way for the user to send approvals or changes.
- No public launch decision, product behavior, permissions, privacy defaults, provider behavior, billing, analytics, Chrome Web Store submission, or marketing state changed.

## 2026-06-15 Real-Profile QA Redaction Checker

Source state verified: added `tools/real_profile_qa_redaction_check.js`, a local-only redaction checker for completed real-profile QA Markdown reports. It is meant to reduce D-L11 disclosure risk before a redacted manual QA result is shared or copied into launch evidence.

Commands:

```bash
node --check tools/real_profile_qa_redaction_check.js
node tools/real_profile_qa_redaction_check.js --self-test
node tools/real_profile_qa_redaction_check.js 05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md
node --check tools/preflight.js
node --check tools/beta_readiness_check.js
node tools/beta_readiness_check.js
node tools/preflight.js
```

Result:

```text
PASS real-profile QA redaction checker self-test
PASS 05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md is the blank real-profile QA template, not a completed result
PASS controlled private beta readiness evidence checked
PASS preflight completed
```

Evidence notes:

- The checker scans only a specified Markdown/text QA report file; it does not read Chrome profiles, tabs, browser history, cookies, screenshots, or page content.
- High-confidence failures include full URLs, Chrome/file URLs, OpenAI-compatible API-key-like strings, bearer tokens, private email addresses, and token-like query values.
- Warnings flag screenshot/image references and private-data wording for manual review.
- The blank QA template is explicitly skipped so templates can stay in the repo while completed real-profile QA reports remain local/private until redacted.
- No product behavior, permissions, privacy defaults, provider behavior, tab automation, billing, analytics, public launch decision, Chrome Web Store submission state, or marketing state changed.

## 2026-06-15 Quick Rail Icon-Only Entry Polish

Source state verified: the page quick rail now matches the confirmed Monica-like but minimal entry pattern: four visible icon-only actions for Chat, Current Page, Page Region, and Save/Todo, with Translate behind More. The Sidebar composer template picker remains the main Prompt / Skill Templates surface and is not duplicated into Dashboard.

Commands:

```bash
node --check extension/page_quick_rail.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
82 smoke tests passed
PASS UI screenshots captured
PASS release package verified for v0.1.0
sha256=44d35955b50a95f028a95e1377546f76793f8385356e4a4c1b1977b4f4b84506
```

Generated synthetic screenshot evidence:

```text
artifacts/ui-screenshots/quick-rail-page.png
artifacts/ui-screenshots/sidepanel-template-picker.png
```

Evidence notes:

- The quick rail renders only on ordinary http/https top-level pages.
- Rendering the rail still does not read visible text, selected text, DOM content, screenshots, full URLs, cookies, page storage, forms, browser history, or page data.
- Clicking a rail action still delegates to the background service worker, opens Sidebar, and may prefill a pending prompt. The user must still send/confirm before page reading, region selection, todo creation, translation, or AI calls.
- `tools/extension_smoke_test.js` now asserts that the visible rail actions are exactly Chat / Read / Region / Save and that Translate stays behind More.
- No new permissions, host permissions, privacy defaults, provider behavior, tab automation, billing, analytics, public launch decision, Chrome Web Store submission state, or marketing state changed.

## 2026-06-15 Launch Status Consistency Guard

Source state verified: launch-facing docs now consistently say the project is GitHub source-release ready, while public marketing and Chrome Web Store launch remain blocked. The stale notes that the open-source license was unconfirmed and that Dashboard Continue was still pending were removed or replaced with the current implemented state.

Commands:

```bash
node --check tools/beta_readiness_check.js
node tools/beta_readiness_check.js
rg -n "Open-source license is not confirmed|Dashboard Continue card is still pending|Default icon candidates: Chat, Read, Region, Translate, Save|^- Continue card\\.|^- Open-source license\\.|^- License\\.|^- Public repo boundary\\." 05_PROJECT/18_FEATURE_DISCUSSION_GUIDE.md 02_FEATURE_SPECS/15_AI_BROWSER_RELEVANT_FEATURE_EXPANSION.md
```

Result:

```text
PASS controlled private beta readiness evidence checked
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
No stale launch-status phrases found in the checked docs.
```

Evidence notes:

- `05_PROJECT/18_FEATURE_DISCUSSION_GUIDE.md` now says the source release is ready and the public store launch is not ready.
- `02_FEATURE_SPECS/15_AI_BROWSER_RELEVANT_FEATURE_EXPANSION.md` now records Dashboard Continue as implemented as a conditional local-only strip, with screenshot evidence.
- `tools/beta_readiness_check.js` now fails if those stale launch-status phrases reappear.
- No extension behavior, permissions, privacy defaults, provider behavior, tab automation, billing, analytics, Chrome Web Store submission state, or public marketing state changed.

## 2026-06-15 Launch Checklist Readiness Alignment

Source state verified: `05_PROJECT/05_LAUNCH_CHECKLIST.md` now matches the current launch model: controlled local/private beta and GitHub source release are ready, while public marketing and Chrome Web Store launch remain blocked by confirmation gates and real-profile QA. The checklist no longer says the open-source license or public repo boundary are unresolved.

Commands:

```bash
node --check tools/beta_readiness_check.js
node tools/beta_readiness_check.js
rg -n "D-L02 still CONFIRM|开源 license 确认。|public repo 范围确认。|Open-source license is not confirmed|license remains unconfirmed" 05_PROJECT/05_LAUNCH_CHECKLIST.md 05_PROJECT/18_FEATURE_DISCUSSION_GUIDE.md 05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md 05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md
```

Result:

```text
PASS controlled private beta readiness evidence checked
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
No stale source-release blocker phrases found in the checked launch docs.
```

Evidence notes:

- Launch checklist Product status now marks P0 scope, Apache-2.0 license, public repo boundary, default dedupe behavior, and Dashboard P0 scope as complete.
- Launch checklist still keeps final brand/domain, privacy policy URL/support email, Chrome Web Store disclosure, final screenshots/demo, beta feedback, Free/Pro boundary, and analytics confirmation open.
- Metrics are explicitly marked future-only and blocked until D-L10 analytics confirmation, so they do not imply hidden analytics in the first public build.
- `tools/beta_readiness_check.js` now requires this checklist and fails if the stale source-release blocker wording returns.
- No extension behavior, permissions, privacy defaults, provider behavior, tab automation, billing, analytics, Chrome Web Store submission state, or public marketing state changed.

## 2026-06-15 Agent Search Work Plan Alignment

Source state verified: `05_PROJECT/19_AGENT_SEARCH_WORK_AGENT_IMPLEMENTATION_PLAN.md` now matches the implemented first local slices for Search Tool, search-result Save/Todo/Brief actions, local Work Queue todos, pasted-link handling, and explicit screenshot/region vision context. It no longer says the search-result save/todo tools are unimplemented.

Commands:

```bash
node --check tools/beta_readiness_check.js
node tools/beta_readiness_check.js
rg -n '\| `save_search_results` \| Not implemented \||\| `create_todo_from_search_results` \| Not implemented \|' 05_PROJECT/19_AGENT_SEARCH_WORK_AGENT_IMPLEMENTATION_PLAN.md || true
node tools/launch_readiness_report.js | sed -n '1,24p'
```

Result:

```text
PASS controlled private beta readiness evidence checked
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
No stale unimplemented Search Result Save/Todo tool rows found.
Public source release blockers: none
Public launch blockers: 12 gate(s) still blocking public launch
Needs user input: 11
Needs QA: 2
```

Evidence notes:

- `tools/beta_readiness_check.js` now requires the Agent/Search/Work implementation plan and fails if the stale unimplemented `save_search_results` or `create_todo_from_search_results` rows return.
- The Search Tool remains an internal Sidebar Agent tool, not a Dashboard search UI.
- Search-result Save/Todo/Brief actions are documented as user-clicked local actions with sanitized metadata, not raw result pages or hidden crawls.
- File/PDF/uploaded-image context remains pending and confirmation-gated; screenshot and selected-region vision context remain explicit user-triggered flows.
- No extension behavior, permissions, privacy defaults, provider behavior, tab automation, billing, analytics, Chrome Web Store submission state, or public marketing state changed.

## 2026-06-15 Real-Profile QA Packet Helper

Source state verified: a local-only real-profile QA packet generator was added so the final real Chrome profile QA pass has a safer handoff path. The helper creates a blank result draft, README, and copyable commands under ignored `artifacts/real-profile-qa/`; it does not open Chrome, read tabs, inspect browser history, read page text, read screenshots, read Chrome profile files, read `.env.local`, or read provider keys.

Commands:

```bash
node --check tools/prepare_real_profile_qa_packet.js
node tools/prepare_real_profile_qa_packet.js --self-test
node tools/prepare_real_profile_qa_packet.js --json
node tools/beta_readiness_check.js
```

Result:

```text
PASS real-profile QA packet self-test
PASS controlled private beta readiness evidence checked
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
Generated local packet:
artifacts/real-profile-qa/2026-06-15T09-47-59-976Z/
```

Evidence notes:

- `tools/preflight.js` now runs `tools/prepare_real_profile_qa_packet.js --self-test`.
- `tools/beta_readiness_check.js` now requires the helper and its safety-boundary copy.
- `README.md`, `INDEX.md`, `05_PROJECT/06_QA_RUNBOOK.md`, and `05_PROJECT/10_PRIVATE_BETA_HANDOFF.md` now point to the helper.
- The generated packet remains ignored local evidence and is not a completed real-profile QA result.
- Public Chrome Web Store launch still remains blocked until a real-profile QA pass is actually completed and the remaining public launch confirmation gates are resolved.
- No extension behavior, permissions, privacy defaults, provider behavior, tab automation, billing, analytics, Chrome Web Store submission state, or public marketing state changed.

## 2026-06-15 Store Asset Review Packet

Source state verified: Chrome Web Store screenshot drafts were regenerated from mock/synthetic UI assets, stale old store screenshot PNGs were removed by the generator, and a local D-L12 review packet was prepared. The packet checks the five canonical screenshot drafts, dimensions, file sizes, and extra PNG leftovers, then produces a user approval checklist without approving or submitting anything.

Commands:

```bash
node --check tools/build_store_screenshots.js
node --check tools/prepare_store_asset_review_packet.js
node tools/prepare_store_asset_review_packet.js --self-test
node tools/build_store_screenshots.js
node tools/prepare_store_asset_review_packet.js --json
node tools/beta_readiness_check.js
rg -n "04-agent-actions|04-privacy-ai-settings" 05_PROJECT/07_STORE_SUBMISSION_DRAFT.md artifacts/store-screenshots tools/build_store_screenshots.js tools/prepare_store_asset_review_packet.js || true
```

Result:

```text
PASS store asset review packet self-test
PASS store screenshot drafts captured
PASS controlled private beta readiness evidence checked
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
Store asset packet status: READY_FOR_USER_REVIEW
No stale 04-agent-actions / 04-privacy-ai-settings paths found.
```

Generated local review packet:

```text
artifacts/store-asset-review/2026-06-15T09-52-05-308Z/store-asset-review.md
```

Canonical store screenshot drafts:

```text
artifacts/store-screenshots/01-one-click-native-groups.png
artifacts/store-screenshots/02-tab-agent-sidebar.png
artifacts/store-screenshots/03-smart-groups-dashboard.png
artifacts/store-screenshots/04-page-chat.png
artifacts/store-screenshots/05-mobile-dashboard.png
```

Evidence notes:

- `tools/build_store_screenshots.js` now removes stale store PNGs that are not in the canonical five-file list.
- `tools/prepare_store_asset_review_packet.js` now creates a local ignored review packet with D-L12 approval checklist and a JSON manifest.
- `tools/preflight.js` now runs the store asset review packet self-test.
- `tools/beta_readiness_check.js` now requires the review packet tooling and fails if the old `04-agent-actions.png` / `04-privacy-ai-settings.png` store draft paths return.
- D-L12 remains a user confirmation gate; this packet only makes the screenshots ready for review.
- No extension behavior, permissions, privacy defaults, provider behavior, tab automation, billing, analytics, Chrome Web Store submission state, or public marketing state changed.

## 2026-06-15 Public Launch Handoff Packet

Source state verified: a local-only public launch handoff packet generator was added so the remaining public-launch gates, review artifacts, and copyable approval reply can be reviewed from one place. The generated packet preserves the blocked state; it does not approve any decision, publish the repo, submit to Chrome Web Store, post marketing copy, change product scope, run real-profile QA, or read private browser data.

Commands:

```bash
node --check tools/prepare_public_launch_handoff_packet.js
node tools/prepare_public_launch_handoff_packet.js --self-test
node tools/prepare_public_launch_handoff_packet.js --json
node tools/beta_readiness_check.js
```

Result:

```text
PASS public launch handoff packet self-test
PASS controlled private beta readiness evidence checked
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
Public launch handoff packet status: BLOCKED_NEEDS_USER_INPUT_OR_QA
```

Generated local handoff packet:

```text
artifacts/public-launch-handoff/2026-06-15T09-57-16-807Z/README.md
artifacts/public-launch-handoff/2026-06-15T09-57-16-807Z/approval-reply-template.txt
artifacts/public-launch-handoff/2026-06-15T09-57-16-807Z/launch-gates.json
```

Evidence notes:

- The packet summarizes all 12 current public launch blockers: D-L03 through D-L14.
- The packet links to the latest local store asset review packet and real-profile QA draft packet.
- The packet keeps `READY_PUBLIC_MARKETING_LAUNCH=no` and `READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no`.
- `tools/preflight.js` now runs the public launch handoff packet self-test.
- `tools/beta_readiness_check.js` now requires the generator and its safety-boundary copy.
- No extension behavior, permissions, privacy defaults, provider behavior, tab automation, billing, analytics, Chrome Web Store submission state, or public marketing state changed.

## 2026-06-15 CI Launch Packet Coverage

Source state verified: GitHub Actions CI now explicitly syntax-checks the launch readiness report, public launch handoff packet, real-profile QA redaction checker, real-profile QA packet, and store asset review packet. CI also runs the launch/QA packet self-tests so the public repository quality gate matches the local preflight coverage.

Commands:

```bash
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/beta_readiness_check.js
rg -n "Launch and QA packet self-tests|prepare_public_launch_handoff_packet|prepare_real_profile_qa_packet|prepare_store_asset_review_packet|real_profile_qa_redaction_check|launch_readiness_report" .github/workflows/ci.yml tools/preflight.js tools/extension_smoke_test.js
```

Result:

```text
82 smoke tests passed
PASS controlled private beta readiness evidence checked
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
CI includes launch and QA packet syntax checks plus self-tests.
```

Evidence notes:

- `.github/workflows/ci.yml` now checks the same launch/QA packet tools that local preflight checks.
- `tools/beta_readiness_check.js` now fails if the CI workflow drops those commands.
- `tools/extension_smoke_test.js` now asserts preflight keeps the real-profile QA packet, store asset review packet, and public launch handoff packet self-tests.
- No extension behavior, permissions, privacy defaults, provider behavior, tab automation, billing, analytics, Chrome Web Store submission state, or public marketing state changed.

## 2026-06-15 Brand / Domain Rescan Alignment

Source state verified: D-L03 brand/domain documentation was refreshed with a live public scan. The rescan confirms that `TabMosaic AI` should remain a working name only until the user explicitly confirms whether to keep it despite the near-name risk or choose a new public brand.

External sources checked:

```text
Chrome Web Store - Tab Mosaic:
https://chromewebstore.google.com/detail/tab-mosaic/mdcoeckpicdepmhphfmclbicjnpkbnga

Chrome Web Store - TabPilot:
https://chromewebstore.google.com/detail/tabpilot-formerly-tab-gro/ghbdjeckopemkoomopmpgjifafpcjhga

Chrome Web Store - TabWeave:
https://chromewebstore.google.com/detail/tabweave/pmfoefbiapldlpljfpjienjahdfmefej

Chrome Web Store - TabAtlas:
https://chromewebstore.google.com/detail/tabatlas/lmkkdaefcklkpghjdhhmnmjklhkflhdc

TabCraft public site:
https://tabcraft.me/en/

Chrome Web Store - tabMind:
https://chromewebstore.google.com/detail/tabmind-ai-smart-tree-sty/gflnpbocipnophkejkonleggabjhaghn

Chrome Web Store - TabOrbit:
https://chromewebstore.google.com/detail/taborbit-make-your-browse/oigdipdneppbghoepbmhpclkoehliccp

Y Combinator - StableBrowse:
https://www.ycombinator.com/companies/stablebrowse

Browser Use:
https://browser-use.com/

Google Chrome AI innovations:
https://www.google.com/chrome/ai-innovations/
```

Commands:

```bash
node tools/beta_readiness_check.js
node tools/launch_readiness_report.js --template-only
node tools/prepare_public_launch_handoff_packet.js --json
rg -n "2026-06-15|TabPilot|TabWeave|TabAtlas|TabCraft|TabMind|TabOrbit|BrowserLayer AI|Need a new shortlist|D-L03" 00_START_HERE/03_DECISIONS_TO_CONFIRM.md 01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md 01_PRODUCT/09_REPO_GROWTH_AND_SEO_NAMING_NOTES.md 05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md tools/beta_readiness_check.js
```

Result:

```text
PASS controlled private beta readiness evidence checked
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
Public launch handoff packet status: BLOCKED_NEEDS_USER_INPUT_OR_QA
Updated handoff packet:
artifacts/public-launch-handoff/2026-06-15T10-06-56-679Z/
```

Evidence notes:

- `01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md` now records the 2026-06-15 rescan and marks common `Tab + noun` names as crowded/risky.
- `01_PRODUCT/09_REPO_GROWTH_AND_SEO_NAMING_NOTES.md` now removes the old shortlist as a recommendation and says a new shortlist is needed.
- `00_START_HERE/03_DECISIONS_TO_CONFIRM.md` and `05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md` now reflect the updated D-L03 risk.
- `tools/beta_readiness_check.js` now fails if the updated 2026-06-15 brand scan evidence disappears.
- D-L03 remains `CONFIRM`; no final brand, domain purchase, repo rename, Chrome Web Store listing name, public marketing, or trademark position was approved.
- No extension behavior, permissions, privacy defaults, provider behavior, tab automation, billing, analytics, Chrome Web Store submission state, or public marketing state changed.

## 2026-06-15 DeepSeek Agent Move-Draft Recovery

Source state verified: a real temporary Chrome runtime Agent-flow rerun exposed a provider-response edge case, then the implementation was updated so explicit tab move/group/regroup requests recover to a local verified Apply / Cancel draft when the model returns incomplete/no draft content and safe tab metadata can still verify the requested tabs.

Commands:

```bash
node tools/chrome_runtime_smoke_test.js
node tools/chrome_runtime_smoke_test.js --agent-flow
node --check extension/background.js
node --check tools/extension_smoke_test.js
node tools/extension_smoke_test.js
node tools/chrome_runtime_smoke_test.js --agent-flow
```

Initial runtime finding:

```text
DeepSeek answered the first open tab-management question and the follow-up.
The explicit move request then returned incomplete/no AI action content, so no Apply / Cancel move draft rendered.
```

Implemented fix:

```text
AI Agent action requests now recover only for explicit move/group/regroup prompts.
Recovery uses current minimized tab metadata to match real movable tabs and a target group.
Recovery renders the same Apply / Cancel `move_tabs` preview and reuses the existing Apply/Undo move path.
Recovery does not close tabs, read page text, send full URLs, or apply browser changes automatically.
```

Result after fix:

```text
83 smoke tests passed
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, context-aware composer state, selected-tabs context tool card, selected-tabs follow-up routing, ephemeral chat thread, capability answer, open-ended chat fallback, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
sha256=d23c70568b9d3fd20aa793d14d9b7005657e6589ceb5cdb4e75a8f0a9a8abcff
```

Evidence notes:

- `extension/background.js` now stores a recovered draft under the same local `tabmosaic.chatDraft` Apply path only after local validation succeeds.
- `tools/extension_smoke_test.js` now covers incomplete model response recovery and confirms pinned/protected tabs are not included.
- `02_FEATURE_SPECS/04_SIDEBAR_AGENT.md`, `02_FEATURE_SPECS/06_TAB_CHAT.md`, and `04_TECH/09_TEST_PLAN.md` now document the recovery boundary.
- This was run in temporary Chrome profiles with synthetic tabs. It did not read the user's real Chrome profile, real browser tabs, real page text, full URLs, browser history, or private screenshots.
- Public launch gates remain unchanged: real-profile QA, final screenshots/demo approval, final brand/domain, support email, privacy URL, store disclosure, free/pro boundary, analytics policy, beta ramp, and launch timing still need approval before Chrome Web Store/public marketing launch.

## 2026-06-15 Store Asset HTML Review Preview

Source state verified: the local store asset review packet now includes an HTML preview page for the five canonical Chrome Web Store screenshot drafts. This makes D-L12 review easier without approving, submitting, publishing, uploading, or using real browsing data.

Commands:

```bash
node --check tools/prepare_store_asset_review_packet.js
node tools/prepare_store_asset_review_packet.js --self-test
node --check tools/prepare_public_launch_handoff_packet.js
node tools/prepare_public_launch_handoff_packet.js --self-test
node tools/beta_readiness_check.js
node tools/prepare_store_asset_review_packet.js --json
node tools/prepare_public_launch_handoff_packet.js --json
rg -n "Store asset HTML preview|store-asset-review.html|READY FOR USER REVIEW|D-L12" artifacts/public-launch-handoff/2026-06-15T10-26-04-718Z/README.md artifacts/store-asset-review/2026-06-15T10-26-04-516Z/store-asset-review.md artifacts/store-asset-review/2026-06-15T10-26-04-516Z/manifest.json
```

Result:

```text
PASS store asset review packet self-test
PASS public launch handoff packet self-test
PASS controlled private beta readiness evidence checked
Store asset review packet status: READY_FOR_USER_REVIEW
Store asset HTML preview: artifacts/store-asset-review/2026-06-15T10-26-04-516Z/store-asset-review.html
Public launch handoff status: BLOCKED_NEEDS_USER_INPUT_OR_QA
```

Generated local review artifacts:

```text
artifacts/store-asset-review/2026-06-15T10-26-04-516Z/store-asset-review.md
artifacts/store-asset-review/2026-06-15T10-26-04-516Z/store-asset-review.html
artifacts/store-asset-review/2026-06-15T10-26-04-516Z/manifest.json
artifacts/public-launch-handoff/2026-06-15T10-26-04-718Z/README.md
```

Evidence notes:

- The HTML preview links only to the existing local mock/synthetic store screenshot PNGs under `artifacts/store-screenshots/`.
- The preview page explicitly says it is a local D-L12 review aid and D-L12 still requires user approval.
- `tools/prepare_public_launch_handoff_packet.js` now lists the latest store asset HTML preview path in the launch handoff README.
- `tools/beta_readiness_check.js` now fails if the HTML preview generator or handoff link is removed.
- No Chrome Web Store submission, public launch, screenshot approval, privacy decision, brand/domain decision, analytics decision, hosted AI decision, or real-profile QA status changed.

## 2026-06-15 Real-Profile QA HTML Checklist

Source state verified: the local real-profile QA packet now includes a static HTML checklist page so the final D-L11 manual QA pass is easier to run and review without reading real browser data automatically.

Commands:

```bash
node --check tools/prepare_real_profile_qa_packet.js
node tools/prepare_real_profile_qa_packet.js --self-test
node --check tools/prepare_public_launch_handoff_packet.js
node tools/prepare_public_launch_handoff_packet.js --self-test
node tools/beta_readiness_check.js
node tools/prepare_real_profile_qa_packet.js --json
node tools/prepare_public_launch_handoff_packet.js --json
rg -n "Real-profile QA HTML checklist|real-profile-qa-checklist.html|D-L11|does not open Chrome|does not open Chrome, inspect tabs" artifacts/public-launch-handoff/2026-06-15T10-30-46-838Z/README.md artifacts/real-profile-qa/2026-06-15T10-30-46-640Z/README.md artifacts/real-profile-qa/2026-06-15T10-30-46-640Z/real-profile-qa-checklist.html
```

Result:

```text
PASS real-profile QA packet self-test
PASS public launch handoff packet self-test
PASS controlled private beta readiness evidence checked
Generated real-profile QA checklist:
artifacts/real-profile-qa/2026-06-15T10-30-46-640Z/real-profile-qa-checklist.html
Public launch handoff status: BLOCKED_NEEDS_USER_INPUT_OR_QA
```

Generated local review artifacts:

```text
artifacts/real-profile-qa/2026-06-15T10-30-46-640Z/real-profile-qa-checklist.html
artifacts/real-profile-qa/2026-06-15T10-30-46-640Z/real-profile-qa-draft.md
artifacts/real-profile-qa/2026-06-15T10-30-46-640Z/commands.txt
artifacts/public-launch-handoff/2026-06-15T10-30-46-838Z/README.md
```

Evidence notes:

- The checklist page is static local HTML under ignored `artifacts/real-profile-qa/`.
- It explicitly says it does not open Chrome, inspect tabs, read browser history, read page text, upload results, or approve public launch.
- It lists copyable commands, do-not-paste privacy rules, allowed evidence, required checks, and the launch boundary.
- `tools/prepare_public_launch_handoff_packet.js` now lists the latest real-profile QA HTML checklist path.
- `tools/beta_readiness_check.js` now fails if the real-profile QA checklist generator or related runbook references disappear.
- This improves D-L11 execution readiness, but D-L11 remains blocking until a human actually runs one redacted real-profile QA pass.

## 2026-06-15 Public Launch Decision HTML Review

Source state verified: the public launch handoff packet now includes a local HTML decision review page for the remaining D-L03 through D-L14 launch gates. This makes user approval/rejection easier to review without approving, submitting, publishing, uploading, running real-profile QA, or reading private browser data.

Commands:

```bash
node --check tools/prepare_public_launch_handoff_packet.js
node tools/prepare_public_launch_handoff_packet.js --self-test
node tools/beta_readiness_check.js
node tools/prepare_public_launch_handoff_packet.js --json
rg -n "Launch decision HTML review|launch-decision-review.html|Public launch decision review|D-L03|Copyable decision reply|does not approve decisions|BLOCKED_NEEDS_USER_INPUT_OR_QA" artifacts/public-launch-handoff/2026-06-15T10-34-31-810Z/README.md artifacts/public-launch-handoff/2026-06-15T10-34-31-810Z/launch-decision-review.html artifacts/public-launch-handoff/2026-06-15T10-34-31-810Z/launch-gates.json
```

Result:

```text
PASS public launch handoff packet self-test
PASS controlled private beta readiness evidence checked
Public launch handoff status: BLOCKED_NEEDS_USER_INPUT_OR_QA
Launch decision HTML review:
artifacts/public-launch-handoff/2026-06-15T10-34-31-810Z/launch-decision-review.html
```

Generated local review artifacts:

```text
artifacts/public-launch-handoff/2026-06-15T10-34-31-810Z/README.md
artifacts/public-launch-handoff/2026-06-15T10-34-31-810Z/launch-decision-review.html
artifacts/public-launch-handoff/2026-06-15T10-34-31-810Z/approval-reply-template.txt
artifacts/public-launch-handoff/2026-06-15T10-34-31-810Z/launch-gates.json
```

Evidence notes:

- The HTML page lists each remaining public-launch blocker with owner, source status, recommended decision, next action, and evidence source.
- It includes a copyable decision reply template so the user can approve/change/reject D-L03 through D-L14 in one pass.
- The page explicitly says it does not approve decisions, publish the repo, submit to Chrome Web Store, post marketing copy, run real-profile QA, or read private browser data.
- `tools/prepare_public_launch_handoff_packet.js` now writes `launch-decision-review.html` beside the Markdown handoff packet.
- `tools/beta_readiness_check.js` now fails if the decision-review page generator or packet references disappear.
- D-L03 through D-L14 remain blocking until the user provides the required approvals/inputs and a human completes redacted real-profile QA.

## 2026-06-15 Release Candidate Review Packet

Source state verified: a local release candidate packet generator now gathers the extension zip/checksum, package manifest, launch readiness, store screenshot review packet, real-profile QA checklist, and public launch handoff into one local README / HTML / JSON review surface.

Commands:

```bash
node --check tools/prepare_release_candidate_packet.js
node tools/prepare_release_candidate_packet.js --self-test
node tools/prepare_release_candidate_packet.js --json
rg -n "Working tree clean|working tree clean|gitStatusCount|Release Candidate Review Packet|BLOCKED_NEEDS_USER_INPUT_OR_QA|D-L03|d23c705" artifacts/release-candidate/2026-06-15T10-45-26-363Z/README.md artifacts/release-candidate/2026-06-15T10-45-26-363Z/release-candidate-review.html artifacts/release-candidate/2026-06-15T10-45-26-363Z/release-candidate-manifest.json
```

Result:

```text
PASS release candidate packet self-test
PASS release package verified for v0.1.0
Release candidate packet status: BLOCKED_NEEDS_USER_INPUT_OR_QA
Zip: dist/tabmosaic-ai-extension-v0.1.0.zip
sha256=d23c70568b9d3fd20aa793d14d9b7005657e6589ceb5cdb4e75a8f0a9a8abcff
Working tree clean: no
Uncommitted status rows: 65
```

Generated local review artifacts:

```text
artifacts/release-candidate/2026-06-15T10-45-26-363Z/README.md
artifacts/release-candidate/2026-06-15T10-45-26-363Z/release-candidate-review.html
artifacts/release-candidate/2026-06-15T10-45-26-363Z/release-candidate-manifest.json
```

Linked review artifacts from the packet:

```text
artifacts/public-launch-handoff/2026-06-15T10-45-26-320Z/launch-decision-review.html
artifacts/store-asset-review/2026-06-15T10-45-26-204Z/store-asset-review.html
artifacts/real-profile-qa/2026-06-15T10-45-26-228Z/real-profile-qa-checklist.html
```

Evidence notes:

- `tools/prepare_release_candidate_packet.js` runs package/verify, generates fresh local review packets, and writes a combined local RC review page under ignored `artifacts/release-candidate/`.
- The packet explicitly says it does not approve public launch, submit to Chrome Web Store, post marketing copy, publish a landing page, run real-profile QA, read private browser data, or change any user-facing public state.
- The packet records `workingTreeClean=false` and the uncommitted status row count so the reviewer does not mistake the zip for a clean committed release candidate.
- `tools/preflight.js` now runs the release candidate packet self-test.
- `tools/beta_readiness_check.js` now fails if the release candidate packet generator or its boundary strings disappear.
- Public source release remains ready, but public marketing / Chrome Web Store launch remains blocked by D-L03 through D-L14.

## 2026-06-15 Chrome Web Store Submission Review Packet

Source state verified: a local Chrome Web Store submission review packet generator now gathers draft listing fields, permission justifications, privacy-policy placeholders, data-use category mapping, screenshot review status, manifest permissions, and store-related launch gates into one local README / HTML / copyable-fields / JSON review surface.

Commands:

```bash
node --check tools/prepare_store_submission_review_packet.js
node tools/prepare_store_submission_review_packet.js --self-test
node tools/prepare_store_submission_review_packet.js --json
rg -n "Privacy placeholders still present|\\[CONFIRM DATE\\]|\\[support email\\]|\\[Developer name\\]|\\[website URL\\]|BLOCKED_NEEDS_USER_INPUT_OR_QA|D-L03|Web history / web browsing activity|copyable-store-fields.md" artifacts/store-submission-review/2026-06-15T10-51-22-288Z/README.md artifacts/store-submission-review/2026-06-15T10-51-22-288Z/store-submission-review.html artifacts/store-submission-review/2026-06-15T10-51-22-288Z/copyable-store-fields.md artifacts/store-submission-review/2026-06-15T10-51-22-288Z/store-submission-review.json
```

Result:

```text
PASS store submission review packet self-test
Store submission review packet status: BLOCKED_NEEDS_USER_INPUT_OR_QA
Privacy placeholders still present: [Developer name], [support email], [website URL], [CONFIRM DATE]
Blocking store gates: 10
Store screenshot review status: READY_FOR_USER_REVIEW
```

Generated local review artifacts:

```text
artifacts/store-submission-review/2026-06-15T10-51-22-288Z/README.md
artifacts/store-submission-review/2026-06-15T10-51-22-288Z/store-submission-review.html
artifacts/store-submission-review/2026-06-15T10-51-22-288Z/copyable-store-fields.md
artifacts/store-submission-review/2026-06-15T10-51-22-288Z/store-submission-review.json
```

Evidence notes:

- `tools/prepare_store_submission_review_packet.js` reads only local docs and `extension/manifest.json`, then runs the existing store asset review packet generator.
- It extracts copyable store fields from `05_PROJECT/07_STORE_SUBMISSION_DRAFT.md` and data category rows from `05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md`.
- It now correctly surfaces unresolved privacy placeholders from `05_PROJECT/13_PRIVACY_POLICY_DRAFT.md`.
- The generated packet explicitly says it does not submit to Chrome Web Store, approve store copy, publish a privacy policy, upload screenshots, run real-profile QA, read browser data, or change public launch state.
- `tools/preflight.js` now runs the store submission review packet self-test.
- `tools/beta_readiness_check.js` now fails if the store submission review generator or boundary strings disappear.
- Chrome Web Store launch remains blocked until the user confirms D-L03, D-L04, D-L05, D-L06, D-L07, D-L08, D-L10, D-L11, D-L12, and D-L14.

## 2026-06-15 Public Launch Decision Reply Validator

Source state verified: a read-only local validator now checks a filled public launch decision reply before any human applies it to docs or launch state. It catches missing D-L03 through D-L14 replies, duplicate gate lines, unresolved `<placeholder>` / bracket placeholders, still-blocked gates, and warning cases such as missing support email or privacy URL.

Commands:

```bash
node --check tools/validate_public_launch_decision_reply.js
node tools/validate_public_launch_decision_reply.js --self-test
node tools/launch_readiness_report.js --template-only > /tmp/tabmosaic-launch-reply-template.txt
node tools/validate_public_launch_decision_reply.js /tmp/tabmosaic-launch-reply-template.txt || true
node tools/validate_public_launch_decision_reply.js --json /tmp/tabmosaic-launch-reply-template.txt || true
```

Result:

```text
PASS public launch decision reply validator self-test
OK=no
READY_FOR_HUMAN_REVIEW=no
PUBLIC_LAUNCH_STILL_BLOCKED=yes
VALID_GATES=3/12
APPROVE_OR_CHANGE=11
KEEP_BLOCKED=1
```

Expected failure notes for the unfilled template:

```text
D-L03, D-L04, D-L05, D-L06, D-L07, D-L11, D-L12, D-L13, and D-L14 still contain unresolved placeholders.
D-L04 warns that a concrete support email is needed before store/legal publication.
D-L05 warns that a concrete privacy policy URL is needed before Chrome Web Store submission.
D-L11 remains keep blocked until one redacted real-profile QA pass is completed.
```

Evidence notes:

- `tools/validate_public_launch_decision_reply.js` is read-only. It does not approve decisions, edit docs, publish, submit, run QA, or change launch state.
- `05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md` now documents how to generate the template and run the validator.
- `tools/preflight.js` now runs the validator self-test.
- `tools/beta_readiness_check.js` now fails if the validator or its key boundary strings disappear.
- Public launch remains blocked until the user provides/approves the required values and real-profile QA evidence.

## 2026-06-15 Full Optional QA Refresh

Source state verified: the full optional QA command passed with DeepSeek/OpenAI-compatible provider smoke, synthetic AI classification fixture, temporary Chrome runtime smoke, real Sidebar DeepSeek Agent flow, large-tab runtime probe, mock UI screenshot capture, Chrome Web Store screenshot draft capture, package verification, and beta readiness check.

Command:

```bash
node tools/preflight.js --deepseek-fixture --runtime --agent-flow --large-runtime --screenshots
```

Result:

```text
83 smoke tests passed
PASS DeepSeek/OpenAI-compatible /models reachable
baseUrl=https://api.deepseek.com
configuredModel=deepseek-v4-flash
modelAvailable=yes
modelCount=2
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, context-aware composer state, selected-tabs context tool card, selected-tabs follow-up routing, ephemeral chat thread, capability answer, open-ended chat fallback, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=0, actionButtons=0, followUp=yes, aiDraft=2 tabs, aiDraftApplied=2 tabs
PASS Chrome runtime large-tab probe organized 96 synthetic tabs in 645ms with 8 groups, 96 moved tabs, 8 safe duplicate closes, and 9 review duplicate groups
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_SOURCE_RELEASE=yes
PUBLIC_SOURCE_RELEASE_BLOCKERS=none
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
sha256=d23c70568b9d3fd20aa793d14d9b7005657e6589ceb5cdb4e75a8f0a9a8abcff
```

Refreshed local review artifacts after the full QA run:

```text
artifacts/store-asset-review/2026-06-15T12-04-19-364Z/store-asset-review.html
artifacts/store-submission-review/2026-06-15T12-04-19-593Z/store-submission-review.html
artifacts/release-candidate/2026-06-15T12-04-19-857Z/release-candidate-review.html
```

Evidence notes:

- The runtime QA used temporary Chrome profiles and synthetic/mock tabs/pages. It did not read the user's real Chrome profile, real tabs, real page text, browser history, cookies, or private screenshots.
- The DeepSeek Agent flow used the real Sidebar composer and local BYOK provider configuration, but it used synthetic tab/page context and did not print the API key.
- The large-tab probe validated bounded behavior on 96 synthetic tabs and did not use real browsing data.
- The screenshot capture regenerated local mock/synthetic screenshots under ignored `artifacts/`.
- Public source release remains ready. Public marketing / Chrome Web Store launch remains blocked by D-L03 through D-L14 until the user confirms launch decisions and one redacted real-profile QA pass is completed.

## 2026-06-15 Remote GitHub Actions CI Billing Blocker

Source state verified: after commit `9244fe6` was pushed to `origin/main`, the remote GitHub Actions CI run failed before any job step started. GitHub's check-run annotation identifies the cause as an account billing lock, not a repository test failure.

Commands:

```bash
gh run list --branch main --limit 3 --json databaseId,headSha,status,conclusion,workflowName,createdAt,updatedAt,url
gh api repos/tover0314-w/tabpilot/commits/9244fe628f06ecfbdc352ea181b3fb714b558921/check-runs --jq '.check_runs[] | {name,status,conclusion,html_url,annotations_count:.output.annotations_count}'
gh api repos/tover0314-w/tabpilot/check-runs/81416399124/annotations --jq '.[0]'
```

Result:

```text
Run: 27545121258
Commit: 9244fe628f06ecfbdc352ea181b3fb714b558921
Workflow: CI
Job: Extension smoke and package
Status: completed
Conclusion: failure
Steps: none
Annotation: The job was not started because your account is locked due to a billing issue.
```

Evidence notes:

- The remote job had no runner name and no executed steps, so no checkout, Node setup, smoke test, package, or upload step ran remotely.
- Local `node tools/preflight.js`, `node tools/secret_scan.js`, `node tools/public_repo_audit.js`, package generation, and package verification passed before the push.
- This blocker requires the GitHub account owner to resolve billing / Actions account status, then rerun the CI workflow.
- Suggested rerun command after billing is resolved: `gh run rerun 27545121258`.
- Public source release code is pushed, but remote CI is not green until GitHub Actions can start jobs again.

## 2026-06-15 Remote CI Status Checker

Source state verified: added `tools/check_remote_ci_status.js`, a read-only GitHub Actions status checker that distinguishes a green remote CI run, a still-running CI run, a real test failure, and the GitHub account billing lock that currently prevents the job from starting.

Commands:

```bash
node --check tools/check_remote_ci_status.js
node tools/check_remote_ci_status.js --self-test
node tools/check_remote_ci_status.js --run-id 27545389436 --allow-failure
node tools/check_remote_ci_status.js --run-id 27545389436 --json --allow-failure
```

Result:

```text
PASS remote CI status checker self-test
REMOTE_CI_STATUS=blocked
REMOTE_CI_REASON=GITHUB_ACTIONS_BILLING_LOCK
REMOTE_CI_RUN_ID=27545389436
REMOTE_CI_HEAD_SHA=6bf2347193bfabd3d202cdd56feecb42c1004d90
REMOTE_CI_WORKFLOW=CI
REMOTE_CI_CONCLUSION=failure
REMOTE_CI_URL=https://github.com/tover0314-w/tabpilot/actions/runs/27545389436
REMOTE_CI_MESSAGE=The job was not started because your account is locked due to a billing issue.
REMOTE_CI_NEXT_ACTION=Resolve GitHub account billing / Actions lock, then run: gh run rerun 27545389436
```

Evidence notes:

- The checker is wired into local preflight as a self-test and into GitHub Actions syntax/self-test coverage.
- `--allow-failure` is required when inspecting a known blocked or failed run so release checks can record evidence without pretending the run is green.
- The checked remote run had zero executed steps, so the remaining blocker is still the GitHub account billing / Actions lock. Future latest-run checks can omit `--run-id` and use `node tools/check_remote_ci_status.js --allow-failure`.
