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
# Recommended when testing selected-tabs page context and fixture refresh/link behavior:
node tools/open_manual_qa_profile.js --keep-fixture-server
```

Expected:

```text
- A temporary Chrome for Testing / Chromium profile opens.
- TabMosaic AI is loaded from a copied unpacked extension directory.
- A local Manual QA Checklist tab is opened.
- Checklist state is saved only in the disposable profile.
- The checklist can save local QA notes in the disposable profile, copy a Markdown QA result for review before sharing, and copy the blank redaction-safe real-profile QA template.
- The checklist includes AI status, sensitive-summary confirmation, Undo/Restore, Dashboard Smart Groups, Dashboard Duplicate Center, Dashboard tab focus/move/apply, safe error states, and privacy-output checks.
- Synthetic QA tabs are opened.
- Three local synthetic context fixture pages are opened under `tabmosaic-manual.test`: Product Roadmap, Release Checklist, and Interface Review. These are the preferred pages for selected-tabs page-context permission testing.
- `--keep-fixture-server` keeps the local fixture server alive until Ctrl+C, so fixture links and refreshed fixture tabs continue to work during selected-tabs page-context QA.
- Sidepanel and Dashboard extension pages are opened.
- The script prints profileDir, extensionId, checklist URL, sidepanel URL, dashboard URL, real-profile QA template path, and cleanup command.
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
Clicking the toolbar icon opens the compact TabMosaic action menu.
Smart Organize, Vertical Tabs, Current Page Chat, and Dashboard are visible.
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

## 9. Optional DeepSeek Agent Flow

Only run this in a disposable or non-critical profile with a disposable DeepSeek key.

1. Confirm `.env.local` contains a disposable `DEEPSEEK_API_KEY=...` entry or a single-line `sk-...` private-test key.
2. Run `node tools/write_private_beta_ai_config.js`.
3. Reload the unpacked extension from `chrome://extensions`.
4. Organize the browser again.
5. In the Sidebar composer, ask an open tab-management question, such as `Which tabs should I focus on for Chrome extension planning?`.
6. Confirm the answer renders as a normal assistant message, not as a raw parser error.
7. Ask `Move the Chrome extension docs tabs into Extension Planning`.
8. Confirm the Agent shows a move draft with Apply / Cancel.
9. Click `Apply`.

Expected:

```text
- The local private-beta config file is ignored by git and not included in release zips.
- The open answer uses minimized tab metadata only, not page body or full URLs.
- The move draft requires Apply before browser changes.
- Apply updates real Chrome native tab groups.
- No tabs are closed by the AI move draft.
- Unknown/destructive AI actions are not rendered as browser actions.
```

Fail if:

```text
- AI moves tabs before Apply.
- AI closes tabs.
- AI asks for broad permissions or page text for this metadata-only flow.
- Full URLs or page bodies are required for the answer.
```

## 10. Current Tab Summary

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

## 11. Selected Tabs And Group Page Context

Run this in the disposable QA profile first. Real-profile results should be redacted before sharing.

1. Open Dashboard.
2. In the Manual QA Checklist, use the `Context Fixture Guide` to identify the already opened local fixture pages and copy the selected-tabs prompt.
3. Find the local Manual QA fixture pages in Dashboard Smart Groups: Product Roadmap, Release Checklist, and Interface Review.
4. In Smart Groups, select at least two same-window Manual QA fixture tab rows.
5. Click `Chat selected`.
6. In the Sidebar composer, paste the copied page-content prompt.
7. If Chrome shows a native site-access prompt, approve access only for the `tabmosaic-manual.test` fixture origin.
8. Confirm the answer renders as normal chat, not a dashboard panel, and uses fixture markers such as `ORBITALPLANNING`, `BUGLANTERN`, or `GLASSHARBOR` when access is allowed.
9. Ask a follow-up question such as: `Which one should I read first and why?`
10. Ask a content regroup request such as: `Regroup these selected tabs by what the pages are actually about.`
11. Confirm any regroup result shows `Apply` / `Cancel` before native tab groups change.
12. Repeat once while denying or closing the site-access prompt for one readable page.

Expected:

```text
- Page content is read only after the selected-tabs/current-group question.
- The running tool card says Read selected tabs for selected-tabs scope, not Read group pages.
- Chrome optional site access is requested per selected origin, not as broad all-site access.
- Local fixture answers can use `ORBITALPLANNING`, `BUGLANTERN`, and `GLASSHARBOR` because those markers exist only in the synthetic fixture pages.
- Tabs over the read cap, restricted pages, protected pages, sensitive pages, and permission-denied pages are skipped with clear reason chips.
- Denied or missing site access is explained as site access not granted and gives a retry path.
- The answer can be partial when some pages are unreadable.
- Follow-up questions reuse only the short local context for the same scoped selection.
- Content-assisted regrouping previews before Apply and does not close tabs.
- Selected-tabs visible text, summaries, and follow-up context are session-only and do not appear in diagnostics, feedback templates, local workspaces, or stored run snapshots.
```

Fail if:

```text
- The extension reads selected-tab page text before the user asks.
- Chrome grants broad all-site access or the extension asks for <all_urls>.
- The answer silently claims to read pages that were skipped, denied, restricted, or over the cap.
- Native tab groups change before Apply.
- Selected-tabs page text appears in copied diagnostics, feedback templates, local workspaces, or stored run snapshots.
```

## 12. Dashboard

1. Click `Open Dashboard`.
2. Review Smart Groups and Duplicate Center.
3. Confirm the default Dashboard opens to Smart Groups without Latest Result, timestamp, or Current Workspace clutter.
4. Open Duplicate Center when review groups exist.
5. Click a Smart Group tab title and confirm the existing browser tab/window is focused.
6. Move one tab into another group in the same window.
7. Edit a Smart Group title/color and click `Apply`.
8. Optional: verify the hidden private-beta Settings path still rejects non-DeepSeek AI base URLs before any network request.

Expected:

```text
- Dashboard opens directly to Smart Groups and keeps Latest Result, timestamp, Current Workspace, and metric-wall clutter out of the default page.
- Rules & Memory and Settings are not primary default navigation items in the commercial Dashboard UI.
- Clicking a tab title focuses the existing tab/window and does not create or close tabs.
- Same-window tab move updates the target native tab group and does not close tabs.
- Group title/color updates real Chrome native group.
- Undo can restore group state after dashboard apply.
- Dashboard does not create new groups manually, move tabs across windows, or close tabs from Smart Groups.
- Non-DeepSeek AI base URLs are rejected before any network request in this private beta.
```

## 13. Optional UI Screenshot Preview

Run before or after manual QA when a visual snapshot is useful:

```bash
node tools/capture_ui_screenshots.js
node tools/build_store_screenshots.js
```

Expected:

```text
- Sidebar completed-state screenshot is generated in English.
- No mixed-language or Chinese visible UI screenshot is generated in the MVP.
- Dashboard overview screenshot is generated.
- Dashboard mobile screenshot is generated.
- Five local 1280x800 Chrome Web Store screenshot drafts are generated.
- Screenshots use mock extension data only.
- The scripts do not read real browser tabs or .env.local.
- Output goes to ignored local artifacts/ui-screenshots/.
- Store screenshot draft output goes to ignored local artifacts/store-screenshots/ and remains DO NOT SUBMIT YET until user approval.
```

This is not a substitute for real Chrome manual QA because it does not prove native tab groups were created in the browser top bar.

## 14. Beta Diagnostics And Feedback

1. Open the hidden private-beta Settings path in a development build.
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

## 15. Privacy Check

Expected:

```text
- Default organize uses title, hostname, path, and tab state.
- Full URL is stored only where needed for Restore Closed.
- Page body is read only after Summarize Current Tab.
- Chat Refine does not read page body.
- No default all-site access, history, bookmarks, cookies, webRequest, or browsingData permission is granted. User-triggered group/selected-tabs page questions may request specific site access and release it after the answer.
```

## 16. Result Log Template

Use:

```text
05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md
```

Rules:

```text
- Do not paste full URLs, real tab titles, page text, API keys, bearer tokens, cookies, private screenshots, private emails, private rule patterns, or confidential customer/company names.
- Prefer keeping completed real-profile QA notes outside git.
- If a completed result must be shared, manually redact it first.
- Keep READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no until the public-launch blockers are resolved.
```
