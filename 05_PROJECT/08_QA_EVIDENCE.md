# QA Evidence

This file records concrete local verification evidence for private-beta readiness. It must not contain secrets, real browsing data, tab titles from the user's browser, full URLs from the user's browser, API keys, or private screenshots.

## 2026-06-10 Local Verification

Status: PASSED for local private-beta evidence  
Machine scope: local workspace  
Real browsing data used: No  
Secrets printed: No
Source state verified: v0.102 DeepSeek smoke provider guardrails in this commit

### Unified Preflight

Command:

```bash
node tools/preflight.js --runtime --large-runtime --screenshots --deepseek-fixture
```

Result:

```text
PASS secret scan checked 102 tracked files
39 smoke tests passed
PASS issue form smoke checked 2 forms
PASS DeepSeek/OpenAI-compatible /models reachable
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, quick-action chat routing, ephemeral chat thread, capability answer, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
PASS Chrome runtime large-tab probe organized 96 synthetic tabs in 927ms with 8 groups, 96 moved tabs, 8 safe duplicate closes, and 9 review duplicate groups
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PASS preflight completed
```

Evidence notes:

- This preflight run called DeepSeek only for `/models` and a synthetic 3-tab classification fixture; it did not read real browser tabs or page text.
- `--runtime` used a temporary Chrome for Testing profile with synthetic tabs and verified real native tab groups plus Dashboard apply/tab move/drag-drop/focus/workspace save/delete/duplicate focus/undo/restore, real Sidebar composer command submission, quick-action chat routing, ephemeral chat thread rendering, capability/help answer, Sidebar workspace save command, next-step answer, current-page chat summary/page-question rendering, latest-run read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, active/protected/read-later answers, and tab search/open.
- `--large-runtime` used a separate temporary Chrome for Testing profile with 96 synthetic tabs and verified the real native group path, safe duplicate closes, review duplicate groups, bounded runtime, and sanitized run snapshots.
- `--screenshots` generated mock-data UI screenshots for the chat-first Tab Agent side panel and Smart Groups Dashboard and did not read real browser tabs or `.env.local`.
- `--screenshots` also generated five local 1280x800 Chrome Web Store screenshot drafts from the mock UI screenshots. These are review drafts only and remain marked `DO NOT SUBMIT YET`.
- Runtime smoke can still `SKIP` on branded Google Chrome CLI extension loading, but this run auto-detected Chrome for Testing through Playwright and passed.
- Release package verifier checks required extension files and rejects `.env*`, source maps, `node_modules`, `.DS_Store`, `__MACOSX`, and `.git` metadata.
- Beta readiness check confirms controlled local/private beta evidence is present, including the large-runtime evidence, while public Chrome Web Store launch remains blocked.
- Beta readiness check also verifies that the real-profile QA result template exists and includes privacy redaction rules.
- Beta readiness check also verifies that the standalone privacy policy draft exists, remains unpublished, keeps required placeholders, and includes Limited Use / permissions / deletion disclosures.
- Beta readiness check also verifies that the standalone Chrome Web Store data disclosure draft exists, remains unsubmitted, keeps the final dashboard confirmation gate, maps sensitive data categories, and records the optional DeepSeek/no-analytics boundaries.
- GitHub Actions runs the same beta readiness check after release package verification.
- Beta readiness check requires the beginner self-test guide and its controlled-beta/public-launch boundary.
- Disposable manual QA checklist self-test verifies that testers can copy the blank redaction-safe real-profile QA template before testing a non-critical real profile.
- Dashboard local workspace save stores only minimized local snapshot metadata and excludes full URLs, restore URLs, URL hashes, favicon URLs, and page text; Dashboard local workspace delete removes only the selected local snapshot.

### DeepSeek / OpenAI-Compatible Provider

Command:

```bash
node tools/deepseek_smoke_test.js
node tools/deepseek_smoke_test.js --classify-fixture
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
```

Evidence notes:

- `.env.local` was used locally but not printed.
- The default `/models` check sends no tab data.
- The synthetic classification fixture used fake tabs only and did not use real browser data.
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
39 smoke tests passed
```

Covered:

- MV3 manifest one-click action guardrails.
- Narrow permissions and no `default_popup`.
- English/Chinese locale parity.
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
- Dashboard simple MVP UI guard: no default P1 placeholders, advanced Settings folded.
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
- AI classification timeout aborts the provider request and falls back to local rules.
- AI connection and classification fetches carry abort signals.
- AI classification status stays lightweight in the sidebar completion message while Dashboard retains fuller AI status.
- Dashboard Smart Group cards and local favicon-backed tab-row rendering from sanitized run data, with expandable hidden tab rows and edit/move controls folded/contextual by default.
- Dashboard local workspace save/delete guard: minimized local snapshot, no full URL, no restore URL, no URL hashes, no favicon URL, no page text, and delete only updates local saved workspace storage.
- Store screenshot draft guard: five 1280x800 local draft screenshots, output to ignored artifacts, marked DO NOT SUBMIT YET, and sourced from mock UI screenshots only.
- Standalone privacy policy draft guard: unpublished status, confirmation gate, developer/support/website placeholders, saved workspace disclosure, DeepSeek optional-sharing boundary, no all-URLs permission, no cloud/account/analytics paths, local data deletion, and Limited Use disclosure.
- Standalone Chrome Web Store data disclosure draft guard: unsubmitted status, confirmation gate, conservative data category mapping, optional DeepSeek sharing boundary, no-sale posture, no analytics upload, and privacy policy draft linkage.
- Sidebar Agent optimization answer guard: latest-run optimization/memory-relief questions are answered locally as assistant message cards and avoid inventing exact memory MB.
- Dashboard Settings first screen shows compact AI Classification; provider details, privacy defaults, permission, diagnostics, and local reset controls remain available under folded sections.
- AI connection test without tab data.
- Dashboard rule deletion confirmation.
- Dashboard scoped AI key clearing.
- Local data deletion.
- Disposable manual QA checklist includes current MVP Sidebar chat UI checks, Dashboard workflow checks, Duplicate Center, safe error states, AI status, sensitive-summary confirmation, privacy-output checks, and local QA notes.

### Chrome Runtime Smoke

Command:

```bash
node tools/chrome_runtime_smoke_test.js
```

Result:

```text
Loaded extension <temporary-extension-id>
Opened extension page chrome-extension://<temporary-extension-id>/sidepanel.html
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, quick-action chat routing, ephemeral chat thread, capability answer, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
```

Evidence notes:

- The script used a temporary Chrome for Testing profile and a copied unpacked extension directory.
- It submitted `open dashboard`, `summarize this page`, `restore closed`, `undo`, and `organize again` through the real Sidebar composer.
- It verified `summarize this page` rendered a current-page chat summary and kept the legacy summary panel hidden.
- It submitted `ask page: what does this page say about tabs` and verified the page question rendered in the current-page chat summary card.
- It verified the Sidebar kept both the user page question and multiple Agent replies in the same local message thread.
- It clicked the Ask page quick action and verified it entered the same local user/Agent message thread.
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
PASS Chrome runtime large-tab probe organized 96 synthetic tabs in 927ms with 8 groups, 96 moved tabs, 8 safe duplicate closes, and 9 review duplicate groups
```

Evidence notes:

- The probe used a temporary Chrome for Testing profile and synthetic URLs only.
- It verified the real native Chrome tab group path, not only local planning code.
- It checked organize completion, moved tabs, safe duplicate closes, review duplicate groups, expected group titles, bounded runtime, and sanitized run snapshots.
- It did not read the user's real Chrome profile, real browser tabs, `.env.local`, page content, or API keys.
- It did not call DeepSeek or any AI provider.
- This still does not replace the remaining real-profile manual QA pass.

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
- The checklist now covers Tab Agent chat UI, latest organize result as one assistant message bubble, bottom composer behavior, Smart Groups filters, Duplicate Center tab focus, tab focus, same-window tab move, Dashboard apply, safe error states, AI status, sensitive-summary confirmation, privacy outputs, local QA notes, and one-click copying of the blank real-profile QA result template.
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
sha256=b168c92f61e677a53d65d231469b6d6fc4ef1addb05dcca45c1a3bb01978bf6a
```

Evidence notes:

- `.env.local` is ignored by git.
- `.env.local` is not included in the extension zip.
- Package manifest safety flags state `includesEnvFiles=false`, `includesSourceMaps=false`, and `includesNodeModules=false`.
- Repeated package generation produced the same package checksum after unchanged icon writes and zip extra attributes were removed.
- `dist/` is ignored because the zip is regenerable from source.

### Sidebar Agent Optimization Card

Command:

```bash
node tools/extension_smoke_test.js
node tools/chrome_runtime_smoke_test.js
```

Result:

```text
39 smoke tests passed
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, quick-action chat routing, ephemeral chat thread, capability answer, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
```

Evidence notes:

- Sidebar Agent now answers `how much memory did you save?` as a visible assistant message card.
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
artifacts/ui-screenshots/sidepanel-result-zh.png
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-mobile.png
artifacts/ui-screenshots/dashboard-ai-settings.png
PASS store screenshot drafts captured
artifacts/store-screenshots/01-one-click-native-groups.png
artifacts/store-screenshots/02-tab-agent-sidebar.png
artifacts/store-screenshots/03-smart-groups-dashboard.png
artifacts/store-screenshots/04-privacy-ai-settings.png
artifacts/store-screenshots/05-mobile-dashboard.png
```

Evidence notes:

- Screenshots use mock extension data only, including Dashboard desktop, mobile, and AI Settings views.
- The scripts do not read real browser tabs.
- The scripts do not read `.env.local`.
- Store screenshot drafts are 1280x800 PNGs generated for review. They are not final Chrome Web Store listing assets and must not be submitted without user approval.
- `artifacts/` is ignored by git because screenshots are reproducible local evidence.
- Screenshot capture is visual QA only and does not prove real Chrome native tab groups were created.

## Remaining Evidence Gaps

- P0 manual QA runbook has not been run against the user's real Chrome profile.
- Chrome Web Store submission materials, standalone privacy policy, and standalone data disclosure draft remain drafts marked `CONFIRM` / `DO NOT SUBMIT YET` / `DO NOT PUBLISH YET`.
- Public privacy policy URL, support email, final brand/domain, and final store disclosures still need user confirmation.
