# Beta Release Notes

Release: TabMosaic AI v0.1.0  
Status: PRIVATE BETA ONLY  
Package: `dist/tabmosaic-ai-extension-v0.1.0.zip`  
Checksum: `dist/tabmosaic-ai-extension-v0.1.0.sha256`  
Package manifest: `dist/tabmosaic-ai-extension-v0.1.0.package.json`  
Date: 2026-06-09

This release is ready for controlled local/private testing. It is not ready for public Chrome Web Store submission until the confirmation gates in `05_PROJECT/07_STORE_SUBMISSION_DRAFT.md` are approved and the manual QA runbook is completed.

## What Testers Should See

```text
Click extension icon
→ side panel opens
→ first-run privacy gate appears
→ after Start Organizing, normal Chrome windows are scanned
→ real Chrome native tab groups appear in the top tab bar
→ sidebar shows groups, protected tabs, duplicate candidates, Undo, Restore Closed, Chat Refine, and current-tab summary
```

## Included Capabilities

- MV3 Chrome extension.
- English and Chinese UI first slice.
- One-click action flow without `default_popup`.
- Side panel result/control center.
- All normal windows scan; incognito is not processed by default.
- Chrome native tab groups.
- Safe exact/tracking duplicate close with Restore Closed.
- Hash/query/same-page duplicates stay review-only.
- Active, pinned, audible, incognito, internal, and non-restorable tabs are protected from auto-close.
- Undo for grouping changes.
- Sidebar Chat Refine for safe local actions and local rule creation.
- Current-tab summary only after user click.
- Dashboard Smart Groups, Duplicate Center, Rules & Memory, Settings, local data deletion, permissions explanation, diagnostics, and feedback template.
- Optional DeepSeek classification with a user-provided API key through an OpenAI-compatible request format.
- AI connection test that calls DeepSeek `/models` only and sends no tab data.
- Redacted local error summaries and count-only duplicate safety audit for beta diagnostics.

## Privacy Defaults

- No `<all_urls>` permission.
- No browsing history, bookmarks, cookies, `webRequest`, or `browsingData` permission.
- No incognito processing by default.
- No automatic page-body reading.
- No cloud sync or account requirement.
- Optional AI classification is off until the user enables it and saves a local API key.
- Private beta AI network access is limited to `https://api.deepseek.com/*`; other OpenAI-compatible hosts require a later permission confirmation.
- AI classification sends tab title, hostname, path, window ID, and tab state only; it does not send page text or full URL by default.
- Full URLs may be stored locally only where needed to restore closed duplicate tabs.
- Copied diagnostics and feedback exclude URLs, hostnames, tab titles, page text, rule patterns, group names, emails, bearer tokens, and API keys.

## Verified Locally

Evidence file: `05_PROJECT/08_QA_EVIDENCE.md`

```text
node tools/preflight.js
PASS preflight completed

node tools/deepseek_smoke_test.js --classify-fixture
PASS DeepSeek/OpenAI-compatible /models reachable
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=3
fixtureAssignedTabs=3
```

Package safety:

```text
env_in_zip=no
.env.local ignored by git
dist/ ignored by git
sha256 generated
package manifest generated
```

## Install Locally

Unzip or use the unpacked extension folder:

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

## Suggested Private QA

Run:

```bash
node tools/preflight.js
node tools/qa_seed_tabs.js
node tools/qa_seed_tabs.js --open
```

Then follow:

```text
05_PROJECT/06_QA_RUNBOOK.md
```

Minimum manual checks:

- Sidebar opens after toolbar click.
- Native tab groups appear in the top tab bar.
- Active/pinned/audible tabs are not closed.
- Exact/tracking duplicates can be restored.
- Hash/query candidates are not auto-closed.
- Undo restores group state for still-open tabs.
- Dashboard group title/color apply updates real Chrome tab groups.
- Current-tab summary reads page content only after click.
- Copy Diagnostic Snapshot and Copy Feedback Template exclude sensitive data.

## Known Limits

- Public Chrome Web Store submission is not approved yet.
- P0 manual QA runbook has not been completed on the user's real Chrome profile.
- Dashboard apply currently edits group title/color only; it does not move tabs from Dashboard.
- Current-tab summary is local extractive summary, not cloud AI summary.
- Multi-tab chat is P1/Pro and not part of this beta slice.
- Hosted AI, accounts, billing, cloud sync, and analytics are not included.
- DeepSeek API key in `.env.local` is for local testing only and should be rotated before public or broader beta use.

## Confirmation Gates Before Public Launch

- Final product name and domain.
- Public developer identity and support email.
- Privacy policy URL.
- Chrome Web Store single-purpose wording.
- Final data-use disclosure and Limited Use wording.
- Whether optional DeepSeek user-key classification remains in the first public build.
- Free/Pro boundary and pricing.
- Any analytics involving browsing activity.
- Store screenshots and demo video.

## Feedback Path

For beta feedback:

```text
Dashboard -> Settings -> Copy Feedback Template
```

The copied template includes manual quality labels and a redacted diagnostic snapshot. It does not upload automatically.

After reviewing the copied text, testers can file one of the repository issue forms:

```text
.github/ISSUE_TEMPLATE/beta_bug_report.yml
.github/ISSUE_TEMPLATE/beta_feedback.yml
```

Do not paste API keys, bearer tokens, cookies, full URLs, tab titles, page text, emails, screenshots with private content, or private rule patterns into GitHub issues.
