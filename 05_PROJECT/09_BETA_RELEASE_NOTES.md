# Beta Release Notes

Release: TabMosaic AI v0.1.0  
Status: PRIVATE BETA ONLY  
Package: `dist/tabmosaic-ai-extension-v0.1.0.zip`  
Checksum: `dist/tabmosaic-ai-extension-v0.1.0.sha256`  
Package manifest: `dist/tabmosaic-ai-extension-v0.1.0.package.json`  
Date: 2026-06-10

This release is ready for controlled local/private testing. It is not ready for public Chrome Web Store submission until the confirmation gates in `05_PROJECT/07_STORE_SUBMISSION_DRAFT.md` are approved and the manual QA runbook is completed.

## What Testers Should See

```text
Click extension icon
→ side panel opens
→ first-run privacy gate appears
→ after Start Organizing, normal Chrome windows are scanned
→ real Chrome native tab groups appear in the top tab bar
→ sidebar shows one assistant reply with what changed, quick action chips, Undo/Restore when available, and current-tab chat actions
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
- Sidebar quick action chips route through the same local chat thread as typed commands.
- Sidebar keeps recent user and Agent messages in a local in-memory chat thread.
- Sidebar latest organize result now appears as one assistant reply with plain-language impact text and quick action chips below it.
- Sidebar latest organize result includes groups moved, duplicate-tab memory relief, review duplicate count, and DeepSeek/local fallback status without a heavy metric panel.
- Sidebar answers `what can you do` / `你能做什么` with local wired-command guidance.
- Sidebar answers `what should I do next` / `下一步` with local guidance from the latest organize state.
- Current-page summary and local page questions return inside the Sidebar Agent chat message flow.
- Sidebar composer local answers for latest result, optimization / memory relief, groups, duplicates, duplicate review queue, closed duplicate restore state, AI status, active tabs, protected tabs, possible read-later tabs, and tab search/open.
- Sidebar open-ended fallback answer when DeepSeek is not enabled or no organize context exists, so unsupported open questions render as assistant messages instead of parser errors.
- Sidebar optimization / memory-relief answer renders as an assistant message card with safe next-step buttons instead of plain text only.
- Sidebar DeepSeek metadata-only Agent fallback for open-ended tab-management questions after local commands/actions do not match.
- Sidebar DeepSeek Agent answers can include compact validated safe action chips, routed through the normal user-triggered chat command path and continuing the same chat thread after click.
- Sidebar DeepSeek Agent can return a validated `move_tabs` draft for explicit regroup/move requests; the user must click Apply before native Chrome groups change.
- Current-tab summary only after user click.
- Dashboard Smart Groups and Duplicate Center as the default commercial UI.
- Dashboard hides Saved Workspaces, Auto Organize, Settings, and Save Workspace from the default view until those workflows are real user-facing value.
- Dashboard expandable Smart Group tab rows for groups with more than three visible tabs.
- Dashboard Duplicate Center expands duplicate groups and can focus existing duplicate tabs for review.
- Dashboard same-window drag/drop tab assignment between existing native groups.
- Dashboard compact Undo / Restore Closed actions when available.
- Side panel and Dashboard organize errors explain that no tabs were moved or closed and suggest retrying or copying redacted diagnostics.
- Optional DeepSeek classification and metadata-only Agent answers through an OpenAI-compatible request format.
- Local private-beta DeepSeek config can be generated from `.env.local` into ignored `extension/private-beta-ai-settings.json`, so local unpacked-extension testing does not require manual Settings entry.
- AI connection test that calls DeepSeek `/models` only and sends no tab data.
- Redacted local error summaries and count-only duplicate safety audit for beta diagnostics.
- Standalone privacy policy draft marked `DO NOT PUBLISH YET`.
- Standalone Chrome Web Store data disclosure draft marked `DO NOT SUBMIT YET`.
- Mock-data UI screenshots include side panel result/chat states and Dashboard desktop/mobile states; Chrome Web Store screenshot drafts are generated locally as five 1280x800 PNGs.

## Privacy Defaults

- No `<all_urls>` permission.
- No browsing history, bookmarks, cookies, `webRequest`, or `browsingData` permission.
- No incognito processing by default.
- No automatic page-body reading.
- No cloud sync or account requirement.
- Optional AI classification is off unless a local key is present in extension storage or the ignored private-beta config file.
- Private beta AI network access is limited to `https://api.deepseek.com/*`; other OpenAI-compatible hosts require a later permission confirmation.
- The ignored private-beta AI config is for local unpacked testing only, must not be committed, and is rejected by release package verification if it appears in a zip.
- AI classification sends tab title, hostname, path, window ID, and tab state only; it does not send page text or full URL by default.
- Metadata-only Agent answers use the same minimized tab metadata boundary and do not send page body, full URL, restore URL, favicon URL, browser history, chat history, saved workspace contents, or cloud memory.
- Metadata-only Agent answers do not apply browser actions automatically; safe action chips require a user click, `move_tabs` drafts require Apply, and close/delete actions are rejected.
- Full URLs may be stored locally only where needed to restore closed duplicate tabs.
- Copied diagnostics and feedback exclude URLs, hostnames, tab titles, page text, rule patterns, group names, emails, bearer tokens, and API keys.

## Verified Locally

Evidence file: `05_PROJECT/08_QA_EVIDENCE.md`

```text
node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots --deepseek-fixture
PASS preflight completed
42 smoke tests passed
PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, quick-action chat routing, ephemeral chat thread, capability answer, open-ended chat fallback, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open
PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer with metadata-only privacy note, safe action chips, and a validated Apply/Cancel move draft
PASS Chrome runtime large-tab probe organized 96 synthetic tabs with real native tab groups, safe duplicate closes, and review duplicate groups
PASS UI screenshots captured
PASS store screenshot drafts captured
PASS controlled private beta readiness evidence checked

PASS DeepSeek/OpenAI-compatible /models reachable
modelAvailable=yes
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
```

Package safety:

```text
env_in_zip=no
.env.local ignored by git
dist/ ignored by git
sha256 generated
package manifest generated
repeated package generation checksum stable
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
node tools/write_private_beta_ai_config.js
node tools/beta_readiness_check.js
node tools/open_manual_qa_profile.js --dry-run
node tools/open_manual_qa_profile.js --self-test
node tools/open_manual_qa_profile.js
node tools/qa_seed_tabs.js
node tools/qa_seed_tabs.js --open
```

Then follow:

```text
05_PROJECT/06_QA_RUNBOOK.md
```

Use `open_manual_qa_profile.js` first when possible. It opens a disposable Chrome profile with a local Manual QA Checklist, synthetic tabs, sidepanel, and dashboard. The checklist covers the Tab Agent chat UI, latest organize result as one assistant message bubble, optional DeepSeek Agent open-answer / move-draft checks, current Smart Groups Dashboard, Duplicate Center focus, safe error states, AI/sensitive-summary checks, privacy outputs, and local notes. Checklist state and local QA notes stay in the disposable profile, and the checklist can copy a Markdown QA result plus the blank real-profile QA result template. It does not touch the user's real Chrome profile.

Minimum manual checks:

- Sidebar opens after toolbar click.
- Native tab groups appear in the top tab bar.
- Active/pinned/audible tabs are not closed.
- Exact/tracking duplicates can be restored.
- Hash/query candidates are not auto-closed.
- Undo restores group state for still-open tabs.
- Dashboard group title/color apply updates real Chrome tab groups.
- Current-tab summary reads page content only after click.
- Optional diagnostics/feedback copies exclude sensitive data when opened from the hidden private-beta Settings path.

## Known Limits

- Public Chrome Web Store submission is not approved yet.
- Standalone privacy policy draft exists, but final policy URL and wording are not approved yet.
- Standalone Chrome Web Store data disclosure draft exists, but final data category checkboxes and Limited Use wording are not approved yet.
- P0 manual QA runbook has not been completed on the user's real Chrome profile.
- Automated runtime smoke has passed with a temporary Chrome for Testing profile, synthetic tabs, real Sidebar composer command submission, Dashboard Undo/Restore, Dashboard local workspace save/delete, quick-action chat routing, ephemeral chat thread rendering, capability/help answer, Sidebar workspace save command, next-step answer, current-page chat summary/page-question rendering, latest-run read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, active/protected/read-later answers, and tab search/open. A separate DeepSeek Agent-flow runtime check has passed through the real Sidebar composer, and a separate large-tab runtime probe has also passed with 96 synthetic tabs. These do not replace real-profile manual QA.
- Dashboard apply supports group title/color edits, tab focus, same-window tab moves into existing groups, and same-window drag/drop tab assignment; it does not support manual new groups, saved workspace restore, cloud sync, or cross-window tab moves. Local workspace snapshot code remains hidden from the default UI.
- Current-tab summary is local extractive summary, not cloud AI summary.
- Sidebar DeepSeek open answers are metadata-only tab-management answers, not cloud page-content chat.
- Multi-tab chat is P1/Pro and not part of this beta slice.
- Hosted AI, accounts, billing, cloud sync, and analytics are not included.
- DeepSeek API key in `.env.local` is for local testing only and should be rotated before public or broader beta use.
- Real-profile QA results should use `05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md` or the checklist's `Copy Real-Profile Template` action, and must be manually redacted before sharing or committing.
- Store screenshot drafts exist, but final Chrome Web Store screenshots and demo video are not approved.

## Confirmation Gates Before Public Launch

- Final product name and domain.
- Public developer identity and support email.
- Privacy policy URL.
- Final privacy policy wording.
- Chrome Web Store single-purpose wording.
- Final data-use disclosure and Limited Use wording.
- Whether optional DeepSeek user-key classification remains in the first public build.
- Free/Pro boundary and pricing.
- Any analytics involving browsing activity.
- Final Chrome Web Store screenshots and demo video.

## Feedback Path

For beta feedback during private testing, open the hidden Settings path from a development build and use:

```text
Hidden private-beta Settings -> Copy Feedback Template
```

The copied template includes manual quality labels and a redacted diagnostic snapshot. It does not upload automatically.

After reviewing the copied text, testers can file one of the repository issue forms:

```text
.github/ISSUE_TEMPLATE/beta_bug_report.yml
.github/ISSUE_TEMPLATE/beta_feedback.yml
```

Do not paste API keys, bearer tokens, cookies, full URLs, tab titles, page text, emails, screenshots with private content, or private rule patterns into GitHub issues.
