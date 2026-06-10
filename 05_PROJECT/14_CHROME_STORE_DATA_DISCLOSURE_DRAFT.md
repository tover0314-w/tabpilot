# Chrome Web Store Data Disclosure Draft

Status: DO NOT SUBMIT YET
Decision state: CONFIRM before Chrome Web Store submission
Last checked: 2026-06-10
Scope: TabMosaic AI private-beta extension package

This document turns the current implementation into a Chrome Web Store privacy/data-use disclosure checklist. It is a draft only. Do not paste these answers into the Chrome Web Store dashboard until the user confirms the final public build, privacy policy URL, support email, optional DeepSeek scope, and final data-use wording.

## Official Sources Checked

- Fill out the privacy fields: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- Chrome Web Store Privacy Policies: https://developer.chrome.com/docs/webstore/program-policies/privacy
- Limited Use: https://developer.chrome.com/docs/webstore/program-policies/limited-use
- Disclosure Requirements: https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements
- Complete your listing information: https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- User Data FAQ: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
- Review process: https://developer.chrome.com/docs/webstore/review-process

## Current Implementation Summary

Current private-beta build handles:

```text
- open tab title, hostname, path, tab state, tab IDs, window IDs, group metadata
- full URL only in local Restore Closed snapshots
- visible current-page text only after user-triggered summary/page question
- local rules created from user correction/chat refine
- local saved workspace snapshots with minimized metadata
- optional local DeepSeek API key and optional DeepSeek classification request
- local redacted diagnostics and local count-only duplicate safety audit
```

Current private-beta build does not include:

```text
- all-URLs permission
- browsing history permission
- bookmarks permission
- cookies permission
- webRequest permission
- browsingData permission
- incognito processing
- hosted AI account
- cloud sync
- billing
- No analytics upload
- remote telemetry endpoint
```

## Data Type Checkbox Draft

These labels may differ slightly in the Chrome Web Store dashboard. Treat this as a mapping guide, not final legal advice.

Final data-use categories must be confirmed in the Chrome Web Store dashboard.

| Dashboard data category | Draft selection | Reason | Confirmation status |
|---|---|---|---|
| Personally identifiable information | RECOMMENDED: No | TabMosaic does not ask for name, email, phone, address, or account profile data. Browsing metadata may incidentally contain personal info, but it is not intentionally collected as PII. | CONFIRM |
| Health information | RECOMMENDED: No | The product does not target or classify health data. Sensitive pages require extra confirmation before current-tab text is read. | CONFIRM |
| Financial and payment information | RECOMMENDED: No | The product does not process payments or financial records. Sensitive billing/finance pages require extra confirmation before current-tab text is read. | CONFIRM |
| Authentication information | CONFIRM: likely Yes if optional DeepSeek user key remains | The extension stores a user-provided DeepSeek API key locally and uses it to call DeepSeek only if AI classification is enabled. If optional user-key AI is removed from the public build, this may change. | CONFIRM |
| Personal communications | RECOMMENDED: No | The product does not target email, chat, messages, or calls. User-triggered page summary could read the current active page if the user requests it; confirm whether the dashboard wording requires this category. | CONFIRM |
| Location | RECOMMENDED: No | The product does not request or infer location data. | CONFIRM |
| Web history / web browsing activity | RECOMMENDED: Yes | The product processes current open tab metadata, including tab title, hostname, path, state, IDs, and group mapping, to organize tabs and detect duplicates. It does not request the Chrome history API. | CONFIRM |
| User activity | RECOMMENDED: Yes | The product handles local user actions such as organize results, undo/restore state, local rules, saved workspace actions, and count-only safety audit events. No remote analytics upload exists. | CONFIRM |
| Website content / website resources | RECOMMENDED: Yes | The product can read visible current-tab text only after the user asks for current-tab summary or page question. It also handles tab title/hostname/path for grouping. | CONFIRM |
| User-provided content | RECOMMENDED: Yes | The product handles local chat refine instructions, local rules, chat drafts, and copied feedback templates. | CONFIRM |

## Data Use Certification Draft

Recommended certification posture:

```text
- Use data only for the single purpose: organizing open work tabs into Chrome native tab groups and providing sidebar/dashboard controls.
- TabMosaic AI does not sell user data.
- Do not use or transfer user data for advertising.
- Do not use user data for creditworthiness or lending.
- Do not allow humans to read user data unless the user explicitly sends redacted diagnostics/feedback or support content.
- Transfer data to DeepSeek only when the user enables optional AI classification and provides an API key.
- Do not upload diagnostics automatically.
- Do not upload page text in the current build.
- No analytics upload exists in the current build.
```

## Data Sharing Draft

Third parties in current build:

| Party | Data shared | Trigger | Status |
|---|---|---|---|
| DeepSeek | Tab title, hostname, path, window ID, tab state | Only when user enables optional AI classification and saves a local API key | CONFIRM before public build |
| GitHub Issues / user-chosen feedback channel | Redacted diagnostics and manual feedback text | Only when user copies and manually submits feedback | CONFIRMED BY IMPLEMENTATION as user-triggered copy only |

No automatic sharing:

```text
- no telemetry endpoint
- no cloud storage endpoint
- no hosted AI gateway
- no account service
- no billing service
```

## Single Purpose Field Draft

Status: CONFIRM

```text
TabMosaic AI organizes open work tabs into Chrome native tab groups, helps review duplicate tabs, and provides sidebar/dashboard controls to undo, restore, refine, save local workspace snapshots, and summarize user-triggered current-tab content.
```

## Remote Code Field Draft

Status: CONFIRM

```text
No. TabMosaic AI does not execute remotely hosted code. The extension package contains its executable JavaScript. If optional DeepSeek classification is enabled, the extension sends a structured API request to DeepSeek and treats the response as data, validates it, and never executes it as code.
```

## Permission Justification Field Draft

Status: CONFIRM

| Permission | Draft justification |
|---|---|
| `tabs` | Required to read open tab metadata, organize all normal windows, protect active/pinned/audible tabs, detect duplicates, focus existing tabs, and restore safely closed duplicate tabs. |
| `tabGroups` | Required to create and update real Chrome native tab groups in the browser tab bar. |
| `sidePanel` | Required to open the sidebar control center after the user clicks the extension icon. |
| `storage` | Required to store local settings, rules, Undo/Restore snapshots, saved workspace snapshots, redacted diagnostics, duplicate safety audit counts, and optional AI settings. |
| `scripting` | Required only for user-triggered current-tab summary/page question, using a content extractor on the active tab after user action. |
| `activeTab` | Required to limit page-content extraction to the active tab after a user gesture. |
| `https://api.deepseek.com/*` | Required only when the user enables optional DeepSeek AI classification with a user-provided API key. |

## Final Confirmation Gates

Do not submit until these are confirmed:

```text
- final product name
- public developer identity
- support email
- privacy policy URL
- whether optional DeepSeek user-key classification remains in public build
- final data category checkboxes
- final Limited Use certification wording
- final single purpose wording
- final remote code answer
- final permission justifications
```
