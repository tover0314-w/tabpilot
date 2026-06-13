# QA Evidence

This file records concrete local verification evidence for private-beta readiness. It must not contain secrets, real browsing data, tab titles from the user's browser, full URLs from the user's browser, API keys, or private screenshots.

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
PASS secret scan checked 103 tracked files
55 smoke tests passed
PASS provider registry checked 18 presets
PASS issue form smoke checked 5 forms
PASS public repo audit checked 126 tracked/unignored files
READY_PUBLIC_REPO_PUSH=no
PUBLIC_REPO_BLOCKERS=D-L01: open-source license remains unconfirmed; ARCHIVE: raw imported archive requires user approval before public repo launch; REAL_PROFILE_QA: completed real-profile QA is not recorded as public-ready evidence
PASS release package verified for v0.1.0
sha256=e4c50617c803cf2e813f2365f28e4ddeabf7b0a70aad14a800bb105a7ee71d7d
```

Evidence notes:

- This pre-push check regenerated the local ignored package in `dist/` and verified the package contents.
- `.env.local`, generated artifacts, private-beta AI settings, and local output directories remain ignored.
- The public repo audit passes its safety checks but still marks public launch as not ready because license, raw archive handling, and real-profile QA approval remain confirmation-gated.
- This does not change the Chrome Web Store readiness state.

## Remaining Evidence Gaps

- P0 manual QA runbook has not been run against the user's real Chrome profile.
- Chrome Web Store submission materials, standalone privacy policy, and standalone data disclosure draft remain drafts marked `CONFIRM` / `DO NOT SUBMIT YET` / `DO NOT PUBLISH YET`.
- Public privacy policy URL, support email, final brand/domain, and final store disclosures still need user confirmation.
