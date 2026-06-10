# QA Evidence

This file records concrete local verification evidence for private-beta readiness. It must not contain secrets, real browsing data, tab titles from the user's browser, full URLs from the user's browser, API keys, or private screenshots.

## 2026-06-10 Local Verification

Status: PASSED for local private-beta evidence  
Machine scope: local workspace  
Real browsing data used: No  
Secrets printed: No
Source state verified: v0.89 safe organize error states in this commit

### Unified Preflight

Command:

```bash
node tools/preflight.js --runtime --screenshots
```

Result:

```text
PASS secret scan checked 98 tracked files
32 smoke tests passed
PASS issue form smoke checked 2 forms
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/duplicate focus/undo/restore plus sidebar composer commands, quick-action chat routing, ephemeral chat thread, capability answer, next-step answer, chat summary/page-question answers, read-only answers, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
PASS UI screenshots captured
PASS release package verified for v0.1.0
PASS controlled private beta readiness evidence checked
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
PASS preflight completed
```

Evidence notes:

- This preflight run did not call DeepSeek classification and did not read real browser tabs.
- `--runtime` used a temporary Chrome for Testing profile with synthetic tabs and verified real native tab groups plus Dashboard apply/tab move/drag-drop/focus/duplicate focus/undo/restore, real Sidebar composer command submission, quick-action chat routing, ephemeral chat thread rendering, capability/help answer, next-step answer, current-page chat summary/page-question rendering, latest-run read-only answers, duplicate-review/closed-tab answers, active/protected/read-later answers, and tab search/open.
- `--screenshots` generated mock-data UI screenshots for the chat-first Tab Agent side panel and Smart Groups Dashboard and did not read real browser tabs or `.env.local`.
- Runtime smoke can still `SKIP` on branded Google Chrome CLI extension loading, but this run auto-detected Chrome for Testing through Playwright and passed.
- Release package verifier checks required extension files and rejects `.env*`, source maps, `node_modules`, `.DS_Store`, `__MACOSX`, and `.git` metadata.
- Beta readiness check confirms controlled local/private beta evidence is present while public Chrome Web Store launch remains blocked.
- GitHub Actions runs the same beta readiness check after release package verification.
- Beta readiness check requires the beginner self-test guide and its controlled-beta/public-launch boundary.

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
fixtureGroupCount=3
fixtureAssignedTabs=3
```

Evidence notes:

- `.env.local` was used locally but not printed.
- The default `/models` check sends no tab data.
- The synthetic classification fixture used fake tabs only and did not use real browser data.
- The extension private beta only permits `https://api.deepseek.com/*`; other OpenAI-compatible hosts require later permission confirmation.

### Extension Smoke Test

Command:

```bash
node tools/extension_smoke_test.js
```

Result:

```text
32 smoke tests passed
```

Covered:

- MV3 manifest one-click action guardrails.
- Narrow permissions and no `default_popup`.
- English/Chinese locale parity.
- Permission explanation alignment.
- Side panel minimal glass UI guard: result and Chat are default, technical browser details are hidden from the default chat surface, and internal next-build QA copy is absent.
- Dashboard minimal glass workbench structure guard.
- Side panel opens as a chat-first Tab Agent UI with message thread, compact actions, and bottom composer.
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
- Disposable manual QA checklist coverage guard: Tab Agent UI, Smart Groups filters, tab focus, same-window tab move, Dashboard apply, AI status, sensitive summary, privacy outputs, and local QA notes in copied Markdown reports.
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
- Dashboard Settings first screen shows compact AI Classification; provider details, privacy defaults, permission, diagnostics, and local reset controls remain available under folded sections.
- AI connection test without tab data.
- Dashboard rule deletion confirmation.
- Dashboard scoped AI key clearing.
- Local data deletion.
- Disposable manual QA checklist includes current MVP Dashboard workflow checks, AI status, sensitive-summary confirmation, privacy-output checks, and local QA notes.

### Chrome Runtime Smoke

Command:

```bash
node tools/chrome_runtime_smoke_test.js
```

Result:

```text
Loaded extension <temporary-extension-id>
Opened extension page chrome-extension://<temporary-extension-id>/sidepanel.html
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/duplicate focus/undo/restore plus sidebar composer commands, quick-action chat routing, ephemeral chat thread, capability answer, next-step answer, chat summary/page-question answers, read-only answers, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
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
- It submitted `show groups` and `did AI classify this?` through the real Sidebar composer and verified local run-state answers.
- It submitted `what did you close` and `what needs review` through the real Sidebar composer and verified local restore/run-state answers.
- It submitted `what tab am I on`, `protected tabs`, and `read later` through the real Sidebar composer and verified local snapshot answers.
- It submitted `find github` through the real Sidebar composer and verified the Open action focused an existing GitHub tab.
- Test tabs were synthetic QA URLs only.
- It verified organize, safe duplicate close, Restore Closed, Chat Refine, Dashboard title/color apply, Dashboard same-window tab move, Dashboard drag/drop tab assignment, Dashboard tab focus, Dashboard Duplicate Center tab focus, Dashboard Restore Closed, and Dashboard Undo against real Chrome native tab groups.
- Restore Closed used a local restore snapshot containing the synthetic duplicate URL and increased the open synthetic tab count in the temporary profile.
- It did not read the user's real Chrome profile or real browser tabs.

### Disposable Manual QA Profile Self-Test

Command:

```bash
node tools/open_manual_qa_profile.js --self-test
```

Result:

```text
PASS manual QA profile opened
seedTabs=20
PASS self-test closed and cleaned up disposable QA profile
```

Evidence notes:

- The script used Chrome for Testing with a disposable profile under `artifacts/manual-qa-profiles/`.
- It loaded a copied unpacked extension, opened the local Manual QA Checklist, synthetic QA tabs, sidepanel, and dashboard.
- The checklist now covers Tab Agent UI, Smart Groups filters, tab focus, same-window tab move, Dashboard apply, AI status, sensitive-summary confirmation, privacy outputs, and local QA notes.
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
sha256=514520a141f0d958e15c9fbece997f83fabc31b4b973ca1943ca31f86136b7d6
```

Evidence notes:

- `.env.local` is ignored by git.
- `.env.local` is not included in the extension zip.
- Package manifest safety flags state `includesEnvFiles=false`, `includesSourceMaps=false`, and `includesNodeModules=false`.
- Repeated package generation produced the same package checksum after unchanged icon writes and zip extra attributes were removed.
- `dist/` is ignored because the zip is regenerable from source.

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
PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, screenshots/demo video, beta user feedback
```

Evidence notes:

- The check reads local docs, package checksum, and package manifest only.
- It does not call the network, open Chrome, read real browser tabs, or read `.env.local`.
- It intentionally keeps public launch marked not ready until the remaining confirmation gates and real-profile QA are complete.

### UI Screenshot Capture

Command:

```bash
node tools/capture_ui_screenshots.js
```

Result:

```text
PASS UI screenshots captured
artifacts/ui-screenshots/sidepanel-result.png
artifacts/ui-screenshots/sidepanel-result-zh.png
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-mobile.png
artifacts/ui-screenshots/dashboard-ai-settings.png
```

Evidence notes:

- Screenshots use mock extension data only, including Dashboard desktop, mobile, and AI Settings views.
- The script does not read real browser tabs.
- The script does not read `.env.local`.
- `artifacts/` is ignored by git because screenshots are reproducible local evidence.
- Screenshot capture is visual QA only and does not prove real Chrome native tab groups were created.

## Remaining Evidence Gaps

- P0 manual QA runbook has not been run against the user's real Chrome profile.
- Chrome Web Store submission materials remain drafts marked `CONFIRM` / `DO NOT SUBMIT YET`.
- Public privacy policy URL, support email, final brand/domain, and final store disclosures still need user confirmation.
