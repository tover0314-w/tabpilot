# Private Beta Handoff

Date: 2026-06-10
Status: READY FOR CONTROLLED LOCAL PRIVATE BETA
Release package: `dist/tabmosaic-ai-extension-v0.1.0.zip`

This handoff summarizes what is ready, what has been verified, what still needs manual validation, and which decisions must not be silently finalized.

## What Is Ready

CONFIRMED BY IMPLEMENTATION:

```text
- MV3 Chrome extension
- one-click toolbar action without default_popup
- side panel opens from the toolbar action
- first-run privacy gate
- all normal windows tab scan
- Chrome native tab groups
- safe exact/tracking duplicate close with Restore Closed
- hash/query/same-page duplicate review
- Undo grouping changes
- Sidebar Chat Refine local preview/apply
- Sidebar quick actions routed through the local chat thread
- Sidebar ephemeral in-memory user/Agent message thread
- Sidebar local capability/help answer
- Sidebar local next-step guidance answer
- Sidebar composer direct commands for current-page summary, organize, Undo, Restore Closed, and Dashboard
- Sidebar current-page summary rendered as a chat message
- Sidebar local current-page question answering rendered as a chat message
- Sidebar composer read-only answers for latest result, groups, duplicates, and AI status
- Sidebar composer read-only answers for duplicate review queue and closed duplicate restore state
- Sidebar composer read-only answers for active tabs, protected tabs, and possible read-later tabs
- Sidebar composer local tab search and focus existing tab
- local user rules and Rules & Memory
- current-tab local extractive summary after user click, with sensitive-page confirmation
- Dashboard Smart Groups, Duplicate Center, Rules & Memory, Settings
- Dashboard Duplicate Center tab details and safe focus existing tab action
- Chat-first Tab Agent side panel with message thread, compact actions, and bottom composer
- Dashboard Smart Groups default page with no Latest Result, timestamp, Current Workspace card, or result metrics area
- Dashboard HTML-prototype workbench layout with expanded local tab rows
- Dashboard expandable Smart Group tab rows for hidden group tabs
- Dashboard Smart Groups filter chips for All / AI groups / Rule groups
- Dashboard tab title focus back to the existing browser tab/window
- Dashboard default UI hides unwired P1/prototype actions and folds advanced Settings content
- Dashboard group title/color apply back to real native tab groups
- Dashboard same-window tab move into existing native tab groups
- Dashboard same-window drag/drop tab assignment into existing native tab groups
- Dashboard compact Undo / Restore Closed actions
- Sidepanel/Dashboard actionable safe organize error states
- optional DeepSeek AI classification through OpenAI-compatible request format
- DeepSeek connection test without tab data
- AI classification timeout fallback to local rules
- AI classification status and suggested group count visible in Sidebar and Dashboard
- Dashboard Clear AI Key
- Dashboard Clear Local Data
- local redacted diagnostics and feedback template
- GitHub private beta issue forms with privacy redlines
```

## Verified Evidence

Current verified evidence is recorded in `05_PROJECT/08_QA_EVIDENCE.md`.

Most complete local verification command:

```bash
node tools/preflight.js --runtime --large-runtime --screenshots
```

Verified:

```text
- secret scan
- JavaScript syntax checks
- 33 extension smoke tests
- synthetic 180-tab local planning guard for classification/dedupe/sanitization
- issue form smoke tests
- Chrome runtime smoke with temporary Chrome for Testing profile and synthetic tabs
- Chrome runtime large-tab probe with 96 synthetic tabs in a temporary Chrome profile
- real native tab groups in runtime smoke
- safe duplicate close and Restore Closed in runtime smoke
- Chat Refine in runtime smoke
- Dashboard apply, same-window tab move, drag/drop tab assignment, tab focus, Duplicate Center focus, Undo, and Restore Closed in runtime smoke
- Sidebar composer direct commands in runtime smoke
- Sidebar quick-action chat routing in runtime smoke
- Sidebar ephemeral chat thread in runtime smoke
- Sidebar capability/help answer in runtime smoke
- Sidebar next-step answer in runtime smoke
- Sidebar current-page chat summary in runtime smoke
- Sidebar current-page question rendering in runtime smoke
- Sidebar latest-run read-only answers in runtime smoke
- Sidebar duplicate-review/closed-tab local answers in runtime smoke
- Sidebar active/protected/read-later local answers in runtime smoke
- Sidebar tab search and Open existing tab in runtime smoke
- mock-data UI screenshot capture, including Dashboard desktop/mobile/AI Settings
- disposable manual QA profile self-test with synthetic QA tabs and current MVP Dashboard checklist coverage
- extension package generation
- release package verification
- beta readiness check: controlled local/private beta ready, public Chrome Web Store launch not ready
- CI beta readiness check after package verification
```

DeepSeek provider verification:

```bash
node tools/deepseek_smoke_test.js
node tools/deepseek_smoke_test.js --classify-fixture
```

Verified:

```text
- DeepSeek /models reachable
- configured model available
- synthetic classification fixture completes
- no real browser tab data is used
```

Disposable manual QA tooling verification:

```bash
node tools/open_manual_qa_profile.js --self-test
```

Verified:

```text
- disposable Chrome for Testing profile opens
- copied unpacked extension loads
- local Manual QA Checklist, synthetic QA tabs, sidepanel, and dashboard open
- self-test closes and cleans up the disposable profile
- no real browser profile, real tabs, or .env.local are read
```

## Not Yet Verified

OPEN QUESTION / MANUAL QA REQUIRED:

```text
- P0 manual QA has not been run on the user's real day-to-day Chrome profile.
- Chrome Web Store submission has not been attempted.
- Private beta with 20-50 external users has not started.
- Store screenshots and demo video are not final.
- Design-prototype features are not all wired yet: manual new groups, workspace history/save/restore, group/workspace chat, billing and usage, templates, multi-tab chat, cloud sync, and account login.
```

Manual QA source of truth:

```text
05_PROJECT/11_SELF_TEST_GUIDE.md
05_PROJECT/06_QA_RUNBOOK.md
```

## How To Install Locally

Use the unpacked extension folder:

```text
/Users/bytedance/个人项目/aitab/extension
```

Chrome steps:

```text
1. Open chrome://extensions
2. Enable Developer mode
3. Click Load unpacked
4. Select /Users/bytedance/个人项目/aitab/extension
5. Pin TabMosaic AI if needed
6. Click the extension icon
7. Review the first-run privacy note
8. Click Start Organizing
```

## Manual QA Path

Before using a real work profile, open a disposable manual QA profile:

```bash
node tools/open_manual_qa_profile.js --dry-run
node tools/open_manual_qa_profile.js --self-test
node tools/open_manual_qa_profile.js
```

This opens a temporary Chrome for Testing / Chromium profile, loads a copied unpacked extension, opens a local Manual QA Checklist, opens synthetic QA tabs, and opens sidepanel/dashboard extension pages. Checklist state and local QA notes are saved only in the disposable profile, and the page can copy a Markdown QA result with notes for review before sharing. The checklist includes Tab Agent UI, AI status, sensitive-summary confirmation, Undo/Restore, Dashboard Smart Groups, Dashboard Duplicate Center, Dashboard tab focus/move/apply, safe error states, and privacy-output checks. It does not read the user's real Chrome profile, real browser tabs, or `.env.local`. `--self-test` opens the disposable browser, verifies setup and checklist report controls, then closes and removes the temporary profile automatically.

For the real-profile path, print or open synthetic QA tabs:

```bash
node tools/qa_seed_tabs.js
node tools/qa_seed_tabs.js --open
```

Then follow:

```text
05_PROJECT/06_QA_RUNBOOK.md
```

Minimum pass criteria:

```text
- toolbar click opens side panel
- top Chrome tab bar shows native tab groups
- exact/tracking duplicates are safely closed only when eligible
- active/pinned/audible tabs are not closed
- hash/query candidates stay in review
- Undo works
- Restore Closed works
- Chat Refine previews before Apply
- Dashboard group title/color apply updates native tab groups
- current-tab summary reads page body only after click
- diagnostics and feedback template exclude sensitive data
```

## Safety Boundaries

Do not change these without a confirmation gate:

```text
- no broad <all_urls> permission
- no history/bookmarks/cookies/webRequest/browsingData permission
- no incognito processing by default
- no automatic page-body reading
- no arbitrary OpenAI-compatible host permission
- no cloud sync or account requirement in this beta
- no analytics involving browsing activity
- no automatic close of hash/query/semantic duplicates
- no closing active/pinned/audible/internal/non-restorable tabs
```

## Decisions Still Needing Confirmation

CONFIRM before public launch:

```text
- final product name and domain
- public developer identity
- support email
- privacy policy URL
- Chrome Web Store single-purpose wording
- Chrome Web Store data-use and Limited Use disclosures
- free vs Pro limits
- Pro pricing
- cloud storage defaults
- hosted AI strategy
- analytics policy
- final store screenshots and demo video
```

## Current Beta Recommendation

RECOMMENDED:

```text
- Run one full manual QA pass on a non-critical Chrome profile first.
- If clean, run one full manual QA pass on the user's real Chrome profile.
- Start with 5-10 trusted testers before inviting 20-50 users.
- Keep GitHub issue forms as the first feedback path.
- Do not submit to Chrome Web Store until confirmation gates are resolved.
```
