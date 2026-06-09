# QA Runbook

This runbook is for local P0 validation before private beta. Start with the disposable QA profile path when possible. The real Chrome profile path should be run only when you are ready to let the extension organize the currently open normal windows.

## 1. Preflight

Run from the repository root:

```bash
node --check extension/background.js
node --check extension/sidepanel.js
node --check extension/dashboard.js
node tools/extension_smoke_test.js
```

Optional:

```bash
node tools/chrome_runtime_smoke_test.js
```

`SKIP` is acceptable for the optional runtime test on Google Chrome builds that do not expose CLI-loaded unpacked extensions.

## 2. Safer Disposable QA Profile

Before touching a real Chrome profile, open a disposable QA browser:

```bash
node tools/open_manual_qa_profile.js --dry-run
node tools/open_manual_qa_profile.js --self-test
node tools/open_manual_qa_profile.js
```

Expected:

```text
- A temporary Chrome for Testing / Chromium profile opens.
- TabMosaic AI is loaded from a copied unpacked extension directory.
- A local Manual QA Checklist tab is opened.
- Checklist state is saved only in the disposable profile.
- The checklist can copy a Markdown QA result for review before sharing.
- The checklist includes AI status, sensitive-summary confirmation, Undo/Restore, Dashboard Latest Result, Dashboard tab focus/move/apply, and privacy-output checks.
- Synthetic QA tabs are opened.
- Sidepanel and Dashboard extension pages are opened.
- The script prints profileDir, extensionId, checklist URL, sidepanel URL, dashboard URL, and cleanup command.
- `--self-test` opens the disposable browser, verifies setup and checklist report controls, then closes and removes the temporary profile automatically.
```

Safety:

```text
- Does not read the user's real Chrome profile.
- Does not read real browser tabs.
- Does not read .env.local.
- Opens synthetic QA URLs only.
- Does not upload checklist results.
- Stores the temporary profile under ignored artifacts/manual-qa-profiles/.
```

## 3. Load The Extension In A Real Profile

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select `/Users/bytedance/个人项目/aitab/extension`.
5. Confirm the extension name is `TabMosaic AI`.
6. Pin the extension to the toolbar if needed.

Expected:

```text
Manifest V3 extension loads without errors.
No default popup is shown when clicking the toolbar icon.
```

## 4. Seed QA Tabs

To print the URLs first:

```bash
node tools/qa_seed_tabs.js
```

To open the QA tabs in Google Chrome:

```bash
node tools/qa_seed_tabs.js --open
```

Expected seed coverage:

```text
- GitHub PR tabs -> Code Review
- Chrome extension docs -> Chrome Extension Docs
- Docs/notes tabs -> Docs & Notes
- communication tabs -> Communication
- product/task tabs -> Product & Tasks
- exact duplicates -> safe close
- tracking duplicates -> safe close
- hash/query differences -> Duplicate Review
- synthetic billing page -> sensitive summary confirmation
```

Manual setup additions:

```text
- Pin one non-critical QA tab before organizing.
- Optionally play audio in one tab to verify audible protection.
- Keep one active duplicate tab selected to verify active protection.
```

## 5. First Run

1. Click the TabMosaic AI toolbar icon.
2. The side panel should open.
3. If this is first run, read the privacy note and click `Start Organizing`.

Expected:

```text
- Sidebar shows scanning/grouping progress.
- Top Chrome tab bar shows native tab groups.
- Groups include Code Review, Chrome Extension Docs, Docs & Notes, Communication, Product & Tasks where applicable.
- Active, pinned, audible, internal, and incognito tabs are not closed.
- Exact/tracking duplicates may be closed only when safe.
- Restore Closed is enabled if tabs were closed.
- Hash/query duplicate candidates appear in Duplicate Candidates as Review.
```

Fail if:

```text
- Sidebar does not open.
- No native tab groups appear in the top tab bar.
- Active/pinned/audible tabs are closed.
- Hash/query variants are auto-closed.
- The extension reads page content before a summary/chat action.
```

## 6. Undo And Restore

1. Click `Undo`.
2. Confirm groups are restored as much as possible.
3. If duplicates were closed, click `Restore Closed`.

Expected:

```text
- Undo restores previous group state for still-open tabs.
- Restore Closed reopens closed duplicate URLs.
- Restored duplicate tabs are grouped when possible.
```

## 7. Duplicate Review

1. In `Duplicate Candidates`, find a review-only hash/query group.
2. Click `Keep All` for one group.
3. For another review group, close one non-protected tab.

Expected:

```text
- Keep All marks the review group as kept.
- Close asks for browser confirmation.
- Protected review tabs have disabled Close buttons.
- Manually closed review tabs can be restored with Restore Closed.
```

## 8. Chat Refine

Try:

```text
GitHub PR to PR Review
current tab to Reading
rename Misc to Reading
```

Expected:

```text
- Sidebar shows a preview first.
- Apply is required before browser changes.
- No AI request is made.
- No page body is read.
- No tabs are closed.
- GitHub PR rule appears in Dashboard -> Rules & Memory.
- Future organize runs apply user rules before AI/built-in rules.
```

## 9. Current Tab Summary

1. Select a normal web page.
2. Click `Summarize Current Tab`.

Expected:

```text
- Page content is read only after the click.
- Sensitive pages ask for an extra confirmation before visible text is read.
- Cancelling the sensitive-page confirmation does not read page body.
- Summary appears in the side panel.
- No cloud AI request is made in this slice.
```

## 10. Dashboard

1. Click `Open Dashboard`.
2. Review Smart Groups, Duplicate Center, Rules & Memory, and Settings.
3. Confirm `Latest Result` leads with the benefit summary, not a metrics wall.
4. Click `Review duplicates` when review groups exist and confirm it jumps to Duplicate Center.
5. Click a Smart Group tab title and confirm the existing browser tab/window is focused.
6. Move one tab into another group in the same window.
7. Edit a Smart Group title/color and click `Apply`.
8. Optional: enter a DeepSeek API key and click `Test AI Connection`.
9. Optional: click `Clear AI Key`, confirm, and verify only the AI key is removed.

Expected:

```text
- Dashboard shows the Latest Result benefit summary: tabs organized, duplicates removed, duplicate groups needing review, conservative memory relief, Review duplicates, Undo, and technical Details.
- Rules & Memory can enable, disable, and delete local rules.
- Deleting a local rule asks for confirmation and does not move or close tabs.
- Clicking a tab title focuses the existing tab/window and does not create or close tabs.
- Same-window tab move updates the target native tab group and does not close tabs.
- Group title/color updates real Chrome native group.
- Undo can restore group state after dashboard apply.
- Dashboard does not create new groups manually, move tabs across windows, or close tabs from Smart Groups.
- Test AI Connection checks /models and does not send tab data, page text, or full URLs.
- Non-DeepSeek AI base URLs are rejected before any network request in this private beta.
- Clear AI Key asks for confirmation, removes only the local API key, disables AI classification, keeps rules and recent results, and does not move or close tabs.
```

## 11. Optional UI Screenshot Preview

Run before or after manual QA when a visual snapshot is useful:

```bash
node tools/capture_ui_screenshots.js
```

Expected:

```text
- Sidebar completed-state screenshot is generated in English.
- Sidebar completed-state screenshot is generated in Chinese.
- Dashboard overview screenshot is generated.
- Dashboard AI settings screenshot is generated.
- Screenshots use mock extension data only.
- The script does not read real browser tabs or .env.local.
- Output goes to ignored local artifacts/ui-screenshots/.
```

This is not a substitute for real Chrome manual QA because it does not prove native tab groups were created in the browser top bar.

## 12. Beta Diagnostics And Feedback

1. Open Dashboard -> Settings.
2. Click `Copy Diagnostic Snapshot`.
3. Paste into a local text editor and scan the JSON.
4. Click `Copy Feedback Template`.
5. Paste into a local text editor and review the Markdown template.

Expected:

```text
- Both actions copy locally to the clipboard only.
- No browser tab is moved, closed, summarized, or uploaded.
- Diagnostic JSON includes version, locale, permissions, run counts, duplicate counts, rule count, AI enabled/provider/model, recent redacted local error summaries, local duplicate close safety audit counts, error count, and privacy flags.
- Feedback template includes manual fields for before/after, 70/20/10/0 classification quality, duplicate mistakes, Undo/Restore, sidebar/dashboard, privacy, rules to remember, and missing features.
- Neither output includes URLs, tab titles, page text, hostnames, emails, bearer tokens, rule patterns, group names, or API keys.
```

Optional GitHub feedback check:

```text
- Open the beta bug report and beta product feedback issue forms.
- Confirm both forms warn against API keys, bearer tokens, cookies, full URLs, tab titles, page text, emails, private screenshots, and private rule patterns.
- Confirm both forms ask the tester to review copied diagnostics or feedback text before submitting.
```

Fail if:

```text
- Any copied output contains a real URL, tab title, hostname, email, bearer token, API key, page text, or private rule pattern.
- Copying triggers a network request or asks for a new Chrome permission.
- The template implies automatic upload or analytics collection.
- GitHub issue forms ask testers to include sensitive browsing data or secrets.
```

## 13. Privacy Check

Expected:

```text
- Default organize uses title, hostname, path, and tab state.
- Full URL is stored only where needed for Restore Closed.
- Page body is read only after Summarize Current Tab.
- Chat Refine does not read page body.
- No <all_urls>, history, bookmarks, cookies, webRequest, or browsingData permission is requested.
```

## 14. Result Log Template

```text
Date:
Chrome version:
Extension version:
Tabs/windows tested:

Pass:
- One-click sidebar open:
- Native groups:
- Safe duplicate close:
- Duplicate review:
- Undo:
- Restore Closed:
- Chat Refine:
- Current tab summary:
- Dashboard apply:
- UI screenshot preview:
- Beta diagnostics:
- Feedback template:
- Local error redaction:
- Duplicate safety audit:
- Privacy guardrails:

Issues:
- 

Decision gates triggered:
- 
```
