# Private Beta Handoff

Date: 2026-06-10
Status: READY FOR CONTROLLED LOCAL PRIVATE BETA
Release package: `dist/tabmosaic-ai-extension-v0.1.0.zip`

This handoff summarizes what is ready, what has been verified, what still needs manual validation, and which decisions must not be silently finalized.

## What Is Ready

CONFIRMED BY IMPLEMENTATION:

```text
- MV3 Chrome extension
- English-only visible Sidebar/Dashboard UI for the MVP
- action icon opens the Sidebar Agent directly
- Smart Organize runs from the Sidebar quick action and starts the organize pipeline
- first-run privacy gate
- all normal windows tab scan
- Chrome native tab groups
- safe exact/tracking duplicate close with Restore Closed
- hash/query/same-page duplicate review
- Undo grouping changes
- Sidebar Chat Refine local preview/apply
- Sidebar quick actions routed through the local chat thread
- Sidebar ephemeral in-memory user/Agent message thread
- Sidebar latest organize result as one assistant reply with plain-language impact text and quick action chips below it
- Sidebar local capability/help answer
- Sidebar local next-step guidance answer
- Sidebar composer direct commands for current-page summary, organize, Undo, Restore Closed, and Dashboard
- Sidebar current-page summary rendered as a chat message
- Sidebar current-page question answering rendered as a chat message, using DeepSeek Page Agent when local key is available and local visible-text fallback otherwise
- Sidebar current-page chat keeps up to 10 local Q/A turns for follow-up resolution
- Sidebar current-page natural follow-ups stay in page chat after the first page answer
- Sidebar composer read-only answers for latest result, groups, duplicates, and AI status
- Sidebar composer read-only answers for optimization / memory relief from the latest local organize result, rendered as an assistant message card with safe next-step buttons
- Sidebar composer read-only answers for duplicate review queue and closed duplicate restore state
- Sidebar composer read-only answers for active tabs, protected tabs, and possible read-later tabs
- Sidebar composer local tab search and focus existing tab
- Sidebar open-ended fallback answer when DeepSeek is not enabled or no organize context exists
- Sidebar DeepSeek metadata-only Agent fallback for open-ended tab-management answers after local commands/actions do not match
- Sidebar DeepSeek metadata-only Agent open answers as plain assistant bubbles with no automatic action chips
- Sidebar DeepSeek metadata-only Agent validated `move_tabs` Apply/Cancel drafts for explicit regroup/move requests
- local user rules and Rules & Memory
- current-tab Page Agent after user click, with sensitive-page confirmation and local visible-text fallback
- Dashboard Smart Groups and Duplicate Center as the default commercial UI
- Dashboard Duplicate Center tab details and safe focus existing tab action
- Chat-first Tab Agent side panel with message thread, compact actions, and bottom composer
- Dashboard Smart Groups default page with no Latest Result, timestamp, Current Workspace card, or result metrics area
- Dashboard HTML-prototype workbench layout with expanded local tab rows
- Dashboard expandable Smart Group tab rows for hidden group tabs
- Dashboard Smart Groups filter chips for All / AI groups / Rule groups
- Dashboard tab title focus back to the existing browser tab/window
- Dashboard default UI hides unwired P1/prototype actions, Saved Workspaces, Auto Organize, Settings, and Save Workspace
- Dashboard group title/color apply back to real native tab groups
- Dashboard same-window tab move into existing native tab groups
- Dashboard same-window drag/drop tab assignment into existing native tab groups
- Dashboard local workspace save/delete snapshot path remains available but hidden from the default UI
- Dashboard compact Undo / Restore Closed actions
- Sidepanel/Dashboard actionable safe organize error states
- optional BYOK AI classification through OpenAI-compatible request format, defaulting to DeepSeek
- optional BYOK metadata-only Agent answers through OpenAI-compatible request format
- optional BYOK current-tab Page Agent answers through OpenAI-compatible request format after user-triggered page questions
- optional BYOK selected-tabs/current-group Page Agent answers after user-triggered scoped page questions, with capped visible-text extraction, skipped reason chips, and session-only context
- selected-tabs/current-group content-assisted regroup drafts that require Apply before changing native Chrome groups
- local private-beta DeepSeek config injection from `.env.local` into ignored `extension/private-beta-ai-settings.json` for full-flow unpacked-extension testing without manual Settings entry
- BYOK provider connection test without tab data
- AI classification timeout fallback to local rules
- AI classification status and suggested group count visible in Sidebar and Dashboard
- Dashboard Clear AI Key
- Dashboard Clear Local Data
- local redacted diagnostics and feedback template
- redaction-safe real-profile QA result template and disposable checklist copy action
- local-only real-profile QA packet generator with blank draft, copyable commands, and redaction-check self-test
- standalone privacy policy draft marked DO NOT PUBLISH YET
- standalone Chrome Web Store data disclosure draft marked DO NOT SUBMIT YET
- mock-data Chrome Web Store screenshot drafts
- mock-data 10-turn side panel chat screenshot for long-chat spacing review
- GitHub private beta issue forms with privacy redlines
```

## Verified Evidence

Current verified evidence is recorded in `05_PROJECT/08_QA_EVIDENCE.md`.

Most complete local verification command:

```bash
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots --deepseek-fixture
```

Verified:

```text
- secret scan
- JavaScript syntax checks
- 47 extension smoke tests
- synthetic 180-tab local planning guard for classification/dedupe/sanitization
- issue form smoke tests
- Chrome runtime smoke with temporary Chrome for Testing profile and synthetic tabs
- Chrome runtime large-tab probe with 96 synthetic tabs in a temporary Chrome profile
- real native tab groups in runtime smoke
- safe duplicate close and Restore Closed in runtime smoke
- Chat Refine in runtime smoke
- Dashboard apply, same-window tab move, drag/drop tab assignment, tab focus, Duplicate Center focus, Undo, and Restore Closed in runtime smoke
- Dashboard local workspace save/delete in runtime smoke remains covered as a hidden private-beta path, not a default visible UI
- Sidebar composer direct commands in runtime smoke
- Sidebar quick-action chat routing in runtime smoke
- Sidebar ephemeral chat thread in runtime smoke
- Sidebar capability/help answer in runtime smoke
- Sidebar workspace save command in runtime smoke
- Sidebar next-step answer in runtime smoke
- Sidebar current-page chat summary in runtime smoke
- Sidebar current-page question rendering in runtime smoke
- Sidebar latest-run read-only answers in runtime smoke
- Sidebar optimization/memory-relief answer in runtime smoke
- Sidebar open-ended chat fallback in runtime smoke
- Sidebar duplicate-review/closed-tab local answers in runtime smoke
- Sidebar active/protected/read-later local answers in runtime smoke
- Sidebar tab search and Open existing tab in runtime smoke
- DeepSeek metadata-only Agent flow in runtime smoke through the real Sidebar composer, including plain open-answer bubbles and a validated Apply/Cancel move draft
- DeepSeek metadata-only Agent payload minimization, invented-tab-id filtering, and destructive-action rejection in extension smoke
- DeepSeek Page Agent payload minimization in extension smoke: current visible text only after user request, no full URL/query/hash, and best-effort secret redaction
- DeepSeek Page Agent synthetic 10-turn current-page conversation fixture, with average score 9.8/10 and lowest turn 8.7/10
- Sidebar 10-turn mock screenshot verifies long-chat messages sit near the context/composer without a large bottom gap
- mock-data UI screenshot capture, including side panel result/current-page chat states and Dashboard desktop/mobile states
- selected-tabs context tool-card runtime coverage and optional per-site access cleanup
- disposable manual QA checklist coverage for optional BYOK Agent open-answer / move-draft checks plus selected-tabs page-context permission checks against local `tabmosaic-manual.test` fixture pages
- mock-data Chrome Web Store screenshot drafts, generated as five 1280x800 local PNGs
- disposable manual QA profile self-test with synthetic QA tabs, local context fixture tabs, current MVP Dashboard checklist coverage, and blank real-profile QA template copy control
- real-profile QA result template exists, but completed real-profile QA is still pending
- standalone privacy policy draft exists, but final policy URL / wording is still pending user confirmation
- standalone Chrome Web Store data disclosure draft exists, but final data category checkboxes / Limited Use wording are still pending user confirmation
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
- provider smoke uses bounded requests, rejects non-DeepSeek hosts before fetch, and does not print API keys
- no real browser tab data is used
```

DeepSeek Sidebar Agent flow verification:

```bash
node tools/chrome_runtime_smoke_test.js --agent-flow
```

Verified:

```text
- temporary Chrome profile and synthetic tabs only
- first organize creates real native tab groups
- local DeepSeek key is stored only in the temporary extension storage
- real Sidebar composer submits an open-ended tab-management question
- DeepSeek metadata-only Agent returns an assistant message card
- open-ended Agent answers render as plain assistant cards with no relevant tab rows or automatic action chips
- DeepSeek returns a validated move draft for an explicit regroup request
- clicking Apply moves matching synthetic tabs into a real native Chrome group without closing tabs
- page text and full URLs are not read or sent
- no browser actions are applied automatically from the AI answer before user Apply
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
- Store screenshot drafts exist, but final screenshots and demo video are not approved.
- Chrome Web Store data disclosure checkboxes and Limited Use wording are drafted but not confirmed.
- Design-prototype features are not all wired yet: manual new groups, workspace restore/history management, group/workspace chat, billing and usage, templates, multi-tab chat, cloud sync, and account login.
- Real-profile selected-tabs/current-group page-context QA is not complete. The implemented path is user-triggered, capped, session-only, and covered by synthetic/runtime checks, but the browser-native optional site-access prompt still needs manual acceptance/denial testing in Chrome.
- Persistent/cloud multi-tab knowledge is not built. Page-content context is not saved as workspace memory or synced to cloud in this beta.
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
node tools/write_private_beta_ai_config.js
node tools/open_manual_qa_profile.js --self-test
node tools/open_manual_qa_profile.js
# Recommended while testing selected-tabs fixture refresh/link behavior:
node tools/open_manual_qa_profile.js --keep-fixture-server
```

This opens a temporary Chrome for Testing / Chromium profile, loads a copied unpacked extension, opens a local Manual QA Checklist, opens synthetic QA tabs, opens three local `tabmosaic-manual.test` context fixture pages, and opens sidepanel/dashboard extension pages. Checklist state and local QA notes are saved only in the disposable profile, and the page can copy a Markdown QA result with notes for review before sharing plus the blank real-profile QA template for the next manual pass. The checklist includes a Context Fixture Guide with fixture links and a copyable selected-tabs prompt, Tab Agent chat UI, latest organize result as one assistant message bubble, optional BYOK Agent open-answer / move-draft checks, selected-tabs page-context permission checks, AI status, sensitive-summary confirmation, Undo/Restore, Dashboard Smart Groups, Dashboard Duplicate Center, Dashboard tab focus/move/apply, safe error states, and privacy-output checks. It does not read the user's real Chrome profile, real browser tabs, or `.env.local`; if `tools/write_private_beta_ai_config.js` was run first, the copied local extension can use the ignored DeepSeek private-beta config. `--self-test` opens the disposable browser, verifies setup, local context fixture tabs, checklist report controls, Context Fixture Guide, and the real-profile template copy control, then closes and removes the temporary profile automatically. `--keep-fixture-server` keeps the local fixture server alive until Ctrl+C so fixture links and refreshed fixture tabs continue to work during selected-tabs page-context QA.

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
- selected-tabs page context reads only after user question and handles Chrome site-access approval/denial clearly
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
- final user-approved store screenshots and demo video
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
