# QA Runbook

This runbook is for local P0 validation before private beta. It uses a real Chrome profile, so run it only when you are ready to let the extension organize the currently open normal windows.

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

## 2. Load The Extension

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

## 3. Seed QA Tabs

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
```

Manual setup additions:

```text
- Pin one non-critical QA tab before organizing.
- Optionally play audio in one tab to verify audible protection.
- Keep one active duplicate tab selected to verify active protection.
```

## 4. First Run

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

## 5. Undo And Restore

1. Click `Undo`.
2. Confirm groups are restored as much as possible.
3. If duplicates were closed, click `Restore Closed`.

Expected:

```text
- Undo restores previous group state for still-open tabs.
- Restore Closed reopens closed duplicate URLs.
- Restored duplicate tabs are grouped when possible.
```

## 6. Duplicate Review

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

## 7. Chat Refine

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

## 8. Current Tab Summary

1. Select a normal web page.
2. Click `Summarize Current Tab`.

Expected:

```text
- Page content is read only after the click.
- Summary appears in the side panel.
- No cloud AI request is made in this slice.
```

## 9. Dashboard

1. Click `Open Dashboard`.
2. Review Smart Groups, Duplicate Center, Rules & Memory, and Settings.
3. Edit a Smart Group title/color and click `Apply`.
4. Optional: enter a DeepSeek/OpenAI-compatible API key and click `Test AI Connection`.

Expected:

```text
- Dashboard shows the latest local organize result.
- Rules & Memory can enable, disable, and delete local rules.
- Deleting a local rule asks for confirmation and does not move or close tabs.
- Group title/color updates real Chrome native group.
- Undo can restore group state after dashboard apply.
- Dashboard apply does not move tabs or close tabs in this slice.
- Test AI Connection checks /models and does not send tab data, page text, or full URLs.
```

## 10. Beta Diagnostics And Feedback

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

## 11. Privacy Check

Expected:

```text
- Default organize uses title, hostname, path, and tab state.
- Full URL is stored only where needed for Restore Closed.
- Page body is read only after Summarize Current Tab.
- Chat Refine does not read page body.
- No <all_urls>, history, bookmarks, cookies, webRequest, or browsingData permission is requested.
```

## 12. Result Log Template

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
