# TabMosaic AI Extension

This is the first runnable Chrome Extension slice for the TabMosaic AI harness.

## What Works

- Manifest V3 extension shell.
- English/Chinese UI localization through Chrome `_locales`.
- Toolbar action click.
- Side panel opens from the action click.
- First run shows a lightweight privacy gate before any organizing happens.
- Background service worker scans all non-incognito normal Chrome windows.
- Built-in rules apply native Chrome tab groups across all normal windows.
- Side panel uses a ChatGPT-style Tab Agent UI with a message thread, compact action chips, and a bottom composer.
- Organize status and impact appear as agent messages instead of a dashboard-like result panel.
- Side panel hides technical browser lists from the default Tab Agent chat surface.
- Side panel quick action chips route through the same local chat thread as typed commands.
- Undo restores the previous group state for still-open tabs.
- Exact and tracking-parameter duplicates are closed only when the tab itself is safe to close.
- Restore Closed reopens safely closed duplicate tabs from a local restore snapshot.
- Review-only duplicate candidates show candidate tabs in the side panel.
- Review candidates can be marked `Keep All` or closed one tab at a time only after a confirmation prompt.
- Chat previews local tab actions before applying them.
- The bottom composer can directly run safe commands such as summarize current page, organize again, Undo, Restore Closed, and Open Dashboard.
- The bottom composer keeps recent user and Agent messages in a local in-memory thread for the current side panel session.
- Older Chat Refine Apply/Cancel buttons are disabled when a newer draft appears or the draft is cancelled.
- Current-page summary results render as a chat message in the Tab Agent flow, while the old separate summary panel stays hidden.
- The bottom composer can answer latest organize overview, groups, duplicate handling, and AI status from local run state.
- The bottom composer can answer duplicate review queue and closed duplicate restore questions from local run / restore state without showing full restore URLs.
- The bottom composer can answer active-tab, protected-tab, and possible read-later questions from the latest sanitized local run snapshot.
- The bottom composer can answer `what can you do` / `你能做什么` locally so first-time testers can discover wired commands.
- The bottom composer can answer `what should I do next` / `下一步` locally from the latest organize state.
- The bottom composer can find tabs from the latest local snapshot and focus an existing matching tab.
- Chat Refine can create local rules like `GitHub PR to Code Review` or `把 docs.google.com 放到文档笔记`.
- Chat Refine supports first English/Chinese local commands for current-tab move, domain rule creation, and group rename.
- User rules apply before AI and built-in rules on future organize runs.
- Summarize Current Tab reads visible page text only after a user click, asks for an extra confirmation on sensitive pages, and generates a local extractive summary.
- The composer can answer `ask page: ...` questions from the current page with local visible-text matching after the same current-page privacy flow.
- Open Dashboard shows a minimal glass Smart Groups page with a top bar, compact navigation, smart group cards, folded Duplicate Center, Rules & Memory, and settings.
- Dashboard default page no longer shows Latest Result, timestamp, Current Workspace card, or a result metrics area.
- Dashboard Smart Groups filter chips can show all groups, AI-source groups, or rule-source groups.
- Dashboard Smart Groups tab titles can focus the existing browser tab and window.
- Dashboard Smart Groups can apply title/color edits back to real Chrome native groups.
- Dashboard Smart Groups can move a tab into another existing group in the same window, with Undo available; the move control is folded/contextual by default.
- Dashboard Smart Groups show local tab rows from the latest sanitized run snapshot when group membership is available, with folded `+ N tabs` rows that expand on demand.
- Dashboard Duplicate Center can expand duplicate groups and focus existing duplicate tabs for review without closing anything.
- Side panel and Dashboard organize errors show a safe-state note that no tabs were moved or closed, plus a simple retry/diagnostics next step.
- Dashboard keeps unwired design-prototype features out of the default UI so users see only working MVP actions.
- Dashboard Rules & Memory shows local rules and supports Enable, Disable, and confirmed Delete.
- Dashboard can save a local DeepSeek API key for AI tab classification through an OpenAI-compatible request format.
- Dashboard can test the AI provider connection without sending tab data.
- Dashboard can clear only the locally saved AI key, disabling AI classification while keeping local rules and recent results.
- Side panel and Dashboard show whether AI classification was applied, fell back, or stayed on local rules.
- Side panel and Dashboard show how many AI groups were suggested in the latest organize run.
- AI connection testing and AI classification use request timeouts; classification timeout or provider failure falls back to local rules.
- Dashboard Settings explains each Chrome permission and what data it supports.
- Dashboard Settings keeps AI Classification visible first; provider details, privacy defaults, permissions, diagnostics, and local reset live under folded sections.
- Dashboard Settings can copy a redacted local diagnostic snapshot for beta bug reports.
- Dashboard diagnostics include recent local error summaries after redaction.
- Dashboard diagnostics include local duplicate close safety audit counts for beta validation.
- Dashboard Settings can copy a local beta feedback template with manual prompts and the redacted diagnostic snapshot.
- The beta feedback template asks testers to label classification quality against the 70% clearly right / 20% acceptable / 10% Review or Misc / 0 dangerous close mistakes target.
- Dashboard Settings can clear local data, including local rules, API key, recent results, Undo/Restore snapshots, chat drafts, and first-run privacy acceptance.
- When enabled, organize tries AI classification first and falls back to local rules if the API fails.

Protected tabs are never closed: active, pinned, audible, incognito, internal pages, and non-restorable URLs.

Hash/query/same-page review candidates are never auto-closed.

Chat does not call AI, read page body content, or close tabs in this slice.

Dashboard apply currently edits group title/color, focuses existing tabs, supports same-window tab moves into existing groups, supports lightweight drag/drop tab assignment between existing groups in the same window, and exposes compact Undo / Restore Closed actions when available. It does not close tabs directly, create new groups manually, or move tabs across windows.

Dashboard design-prototype features that are not wired yet: manual new groups, workspace history/save/restore, group/workspace chat, billing and usage, templates, multi-tab chat, cloud sync, and account login.

Current tab summaries and current-page questions do not call AI yet, do not upload page content, and require an extra confirmation before reading sensitive pages.

AI classification sends tab title, hostname, path, and tab state only. It does not send page body or full URL.

AI connection testing calls the configured `/models` endpoint only. It does not send tab data, page text, full URLs, or a request body.

AI classification timeout fallback does not send additional data or change duplicate-close behavior; the browser is organized with local rules and the AI status explains the fallback.

Clear AI Key does not close tabs, move tabs, clear local rules, clear recent results, or call the AI provider.

Clear Local Data does not close tabs, move tabs, delete browser history, delete cookies, or touch cloud account data.

Permission explanations do not add new permissions. The extension still does not request all URLs, history, bookmarks, cookies, webRequest, browsingData, or incognito access.

Beta diagnostics are copied locally and exclude URLs, tab titles, page text, hostnames, rule patterns, group names, emails, bearer tokens, and API keys.

Local error summaries are stored only in `chrome.storage.local`, capped to recent entries, and included in copied diagnostics only after redaction.

Duplicate close safety audit entries are stored only as counts and whitelisted event types. They do not include URLs, tab titles, hostnames, page text, rule patterns, group names, or API keys.

Beta feedback templates are copied locally and do not submit data automatically.

## Load Locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select this folder: `/Users/bytedance/个人项目/aitab/extension`.
5. Click the TabMosaic AI toolbar icon.
6. On first run, review the privacy note and click `Start Organizing`.
7. Click `Open Dashboard` from the side panel to view the local dashboard.
8. Optional: enable DeepSeek classification in Dashboard Settings with your API key.
9. Try Chat Refine examples such as `GitHub PR to Code Review`, `current tab to Reading`, `rename Misc to Reading`, `把当前标签页放到阅读`, or `把 Misc 改名为阅读`.
10. In Dashboard Smart Groups, edit a group name/color and click `Apply`.

## Package

From the repository root:

```bash
node tools/generate_extension_assets.js
node tools/package_extension.js
node tools/verify_release_package.js
```

Output:

```text
dist/tabmosaic-ai-extension-v0.1.0.zip
dist/tabmosaic-ai-extension-v0.1.0.sha256
dist/tabmosaic-ai-extension-v0.1.0.package.json
```

## Verify Locally

Run the no-dependency smoke test from the repository root:

```bash
node tools/extension_smoke_test.js
```

It checks manifest permissions, English/Chinese localization, chat-first Tab Agent UI, quick-action chat routing, ephemeral chat thread rendering, stale draft button guards, direct composer commands, local capability/help answers, local next-step guidance, current-page chat summary/question rendering, latest-run read-only answers, duplicate-review/closed-tab local answers, active/protected/read-later local answers, local tab search/focus, minimal glass Dashboard layout, Dashboard Smart Groups filters, Dashboard tab focus, Dashboard same-window tab move and drag/drop guardrails, Dashboard Undo/Restore guardrails, permission explanation alignment, redacted local error logs, local duplicate safety audit counts, redacted beta diagnostics and feedback templates, Chat action parsing, user-rule priority, duplicate safety policy, 180-tab synthetic local planning guard, AI output validation, AI connection testing without tab data, AI classification timeout fallback, AI key clearing, and local data deletion.

Release package verification checks the generated zip, checksum, package manifest, required package entries, and forbidden entries such as env files, source maps, `node_modules`, `.DS_Store`, `__MACOSX`, and `.git` metadata against the current manifest version.

Optional UI screenshot capture:

```bash
node tools/capture_ui_screenshots.js
```

This renders the sidebar and dashboard with mock extension data, including Dashboard desktop, mobile, and AI Settings screenshots. It does not read real browser tabs or `.env.local`. It requires Playwright locally; the Codex bundled runtime is auto-detected when available. Screenshots are written to `artifacts/ui-screenshots/`.

Optional runtime smoke test:

```bash
node tools/chrome_runtime_smoke_test.js
```

This starts a temporary Chrome profile, loads the unpacked extension, opens synthetic test tabs, and verifies organize, safe duplicate close, same-page duplicate review, Restore Closed, Chat Refine, quick-action chat routing, ephemeral chat thread rendering, local capability/help answers, local next-step guidance, current-page chat summary/question rendering, Dashboard title/color apply, Dashboard same-window tab move, Dashboard drag/drop tab assignment, Dashboard tab focus, Dashboard Undo/Restore, Sidebar local answers, and tab search/open against real Chrome native tab groups. It prefers `CHROME_PATH`, then auto-detects Playwright / Chrome for Testing / Chromium before falling back to system Google Chrome. It may print `SKIP` on Google Chrome builds that do not allow CLI unpacked extension loading; manual `Load unpacked` QA is still required in that case.

To run automated runtime QA, use Chrome for Testing or Chromium:

```bash
CHROME_PATH="/path/to/chrome-or-chromium" node tools/chrome_runtime_smoke_test.js
```

Optional disposable manual QA browser:

```bash
node tools/open_manual_qa_profile.js --dry-run
node tools/open_manual_qa_profile.js --self-test
node tools/open_manual_qa_profile.js
```

This opens a temporary Chrome for Testing / Chromium profile with a local Manual QA Checklist, synthetic QA tabs, sidepanel, and dashboard pages. The checklist covers one-click organize, Tab Agent UI, AI status, sensitive-summary confirmation, Undo/Restore, Dashboard Smart Groups, Dashboard Duplicate Center, Dashboard tab focus/move/apply, safe error states, and privacy outputs. Checklist state and local QA notes are saved only in the disposable profile, and the page can copy a Markdown QA result with notes. It does not read the user's real Chrome profile, real browser tabs, or `.env.local`.

Optional DeepSeek/OpenAI-compatible request-format provider smoke test:

```bash
node tools/deepseek_smoke_test.js
node tools/deepseek_smoke_test.js --classify-fixture
```

The default provider test calls `/models` only and does not send tab data. The fixture mode sends synthetic test tabs only.
