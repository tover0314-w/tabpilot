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
- Side panel shows window count, tab count, protected-tab counts, top hosts, native groups, and duplicate candidates.
- Undo restores the previous group state for still-open tabs.
- Exact and tracking-parameter duplicates are closed only when the tab itself is safe to close.
- Restore Closed reopens safely closed duplicate tabs from a local restore snapshot.
- Review-only duplicate candidates show candidate tabs in the side panel.
- Review candidates can be marked `Keep All` or closed one tab at a time only after a confirmation prompt.
- Chat Refine previews local tab actions before applying them.
- Chat Refine can create local rules like `GitHub PR to Code Review` or `把 docs.google.com 放到文档笔记`.
- Chat Refine supports first English/Chinese local commands for current-tab move, domain rule creation, and group rename.
- User rules apply before AI and built-in rules on future organize runs.
- Summarize Current Tab reads visible page text only after a user click, asks for an extra confirmation on sensitive pages, and generates a local extractive summary.
- Open Dashboard shows a local dashboard page with latest workspace metrics, smart groups, duplicates, and settings snapshot.
- Dashboard Smart Groups can apply title/color edits back to real Chrome native groups.
- Dashboard Rules & Memory shows local rules and supports Enable, Disable, and confirmed Delete.
- Dashboard can save a local DeepSeek API key for AI tab classification through an OpenAI-compatible request format.
- Dashboard can test the AI provider connection without sending tab data.
- Dashboard can clear only the locally saved AI key, disabling AI classification while keeping local rules and recent results.
- Side panel and Dashboard show whether AI classification was applied, fell back, or stayed on local rules.
- Side panel and Dashboard show how many AI groups were suggested in the latest organize run.
- Dashboard Settings explains each Chrome permission and what data it supports.
- Dashboard Settings can copy a redacted local diagnostic snapshot for beta bug reports.
- Dashboard diagnostics include recent local error summaries after redaction.
- Dashboard diagnostics include local duplicate close safety audit counts for beta validation.
- Dashboard Settings can copy a local beta feedback template with manual prompts and the redacted diagnostic snapshot.
- The beta feedback template asks testers to label classification quality against the 70% clearly right / 20% acceptable / 10% Review or Misc / 0 dangerous close mistakes target.
- Dashboard Settings can clear local data, including local rules, API key, recent results, Undo/Restore snapshots, chat drafts, and first-run privacy acceptance.
- When enabled, organize tries AI classification first and falls back to local rules if the API fails.

Protected tabs are never closed: active, pinned, audible, incognito, internal pages, and non-restorable URLs.

Hash/query/same-page review candidates are never auto-closed.

Chat Refine does not call AI, read page body content, or close tabs in this slice.

Dashboard apply currently edits group title/color only. It does not move or close tabs.

Current tab summaries do not call AI yet, do not upload page content, and require an extra confirmation before reading sensitive pages.

AI classification sends tab title, hostname, path, and tab state only. It does not send page body or full URL.

AI connection testing calls the configured `/models` endpoint only. It does not send tab data, page text, full URLs, or a request body.

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

It checks manifest permissions, English/Chinese localization, permission explanation alignment, redacted local error logs, local duplicate safety audit counts, redacted beta diagnostics and feedback templates, Chat Refine parsing, user-rule priority, duplicate safety policy, AI output validation, AI connection testing without tab data, AI key clearing, and local data deletion.

Release package verification checks the generated zip, checksum, package manifest, required package entries, and forbidden entries such as env files, source maps, `node_modules`, `.DS_Store`, `__MACOSX`, and `.git` metadata against the current manifest version.

Optional UI screenshot capture:

```bash
node tools/capture_ui_screenshots.js
```

This renders the sidebar and dashboard with mock extension data. It does not read real browser tabs or `.env.local`. It requires Playwright locally; the Codex bundled runtime is auto-detected when available. Screenshots are written to `artifacts/ui-screenshots/`.

Optional runtime smoke test:

```bash
node tools/chrome_runtime_smoke_test.js
```

This starts a temporary Chrome profile, loads the unpacked extension, opens synthetic test tabs, and verifies organize, Chat Refine, and Dashboard apply against real Chrome native tab groups. It prefers `CHROME_PATH`, then auto-detects Playwright / Chrome for Testing / Chromium before falling back to system Google Chrome. It may print `SKIP` on Google Chrome builds that do not allow CLI unpacked extension loading; manual `Load unpacked` QA is still required in that case.

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

This opens a temporary Chrome for Testing / Chromium profile with a local Manual QA Checklist, synthetic QA tabs, sidepanel, and dashboard pages. The checklist covers one-click organize, AI status, sensitive-summary confirmation, Undo/Restore, Dashboard apply, and privacy outputs. Checklist state is saved only in the disposable profile, and the page can copy a Markdown QA result. It does not read the user's real Chrome profile, real browser tabs, or `.env.local`.

Optional DeepSeek/OpenAI-compatible request-format provider smoke test:

```bash
node tools/deepseek_smoke_test.js
node tools/deepseek_smoke_test.js --classify-fixture
```

The default provider test calls `/models` only and does not send tab data. The fixture mode sends synthetic test tabs only.
