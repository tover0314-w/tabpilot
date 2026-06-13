# Chrome Web Store Data Disclosure Draft

Status: DO NOT SUBMIT YET
Decision state: CONFIRM before Chrome Web Store submission
Last checked: 2026-06-12
Scope: TabMosaic AI private-beta extension package

This document turns the current implementation into a Chrome Web Store privacy/data-use disclosure checklist. It is a draft only. Do not paste these answers into the Chrome Web Store dashboard until the user confirms the final public build, privacy policy URL, support email, optional BYOK AI provider scope, and final data-use wording.

## Official Sources Checked

- Fill out the privacy fields: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- Chrome Web Store Privacy Policies: https://developer.chrome.com/docs/webstore/program-policies/privacy
- Limited Use: https://developer.chrome.com/docs/webstore/program-policies/limited-use
- Disclosure Requirements: https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements
- Complete your listing information: https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- User Data FAQ: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
- Review process: https://developer.chrome.com/docs/webstore/review-process
- Extensions quality guidelines FAQ: https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines-faq
- `chrome.tabs`: https://developer.chrome.com/docs/extensions/reference/api/tabs
- `chrome.sidePanel`: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- `chrome.scripting`: https://developer.chrome.com/docs/extensions/reference/api/scripting
- `activeTab`: https://developer.chrome.com/docs/extensions/develop/concepts/activeTab

## Official Policy Review Notes - 2026-06-12

Status: RESEARCHED / NOT SUBMITTED

Current disclosure posture should stay conservative:

- A privacy policy URL is required before public submission because the extension handles sensitive browsing metadata and optional user-provided API credentials.
- The Chrome Web Store privacy fields must state the single purpose, justify every permission, declare no remote executable code, disclose data categories, and certify Limited Use.
- `Web history / web browsing activity` should remain `Yes` because open-tab title/hostname/path/state is processed for tab organization, even though the extension does not request the Chrome `history` API.
- `Website content / website resources` should remain `Yes` because current-tab and selected/group-tab visible text can be read after user request and permission flow, and selected-region chat may transiently capture the visible tab to crop one user-selected region in memory.
- `User-provided content` should remain `Yes` because the extension handles local chat instructions, rules, draft feedback, and BYOK settings.
- `Authentication information` is likely `Yes` while BYOK API key storage remains in the public build.
- First-run privacy copy, sensitive-page confirmation, and multi-tab tool cards are in-product prominent disclosures for user-triggered page text. Store listing and privacy policy copy alone are not enough for sensitive data handling.
- No remote analytics, ad targeting, data sale, creditworthiness use, hosted account, billing service, or automatic telemetry exists in the current private-beta build.
- BYOK provider transfer is limited to the user-configured provider and only for the user-facing tab/page Agent features.

## Current Implementation Summary

Current private-beta build handles:

```text
- open tab title, hostname, path, tab state, tab IDs, window IDs, group metadata
- full URL only in local Restore Closed snapshots
- visible current-page text only after user-triggered summary/page question
- selected-region screenshot crop metadata after user-triggered region picker; the full visible-tab capture and image bytes are discarded and not uploaded/stored
- optional per-site access for user-triggered group/selected-tabs page questions, released after the answer
- local rules created from user correction/chat refine
- local saved workspace snapshots with minimized metadata
- optional local BYOK AI API key/provider config and optional OpenAI-compatible classification request
- local redacted diagnostics and local count-only duplicate safety audit
```

Current private-beta build does not include:

```text
- default all-URLs / all-site access
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
| Authentication information | CONFIRM: likely Yes if optional BYOK user key remains | The extension stores a user-provided AI API key locally and uses it to call the configured OpenAI-compatible provider only if AI features are enabled. If optional user-key AI is removed from the public build, this may change. | CONFIRM |
| Personal communications | RECOMMENDED: No | The product does not target email, chat, messages, or calls. User-triggered page summary could read the current active page if the user requests it; confirm whether the dashboard wording requires this category. | CONFIRM |
| Location | RECOMMENDED: No | The product does not request or infer location data. | CONFIRM |
| Web history / web browsing activity | RECOMMENDED: Yes | The product processes current open tab metadata, including tab title, hostname, path, state, IDs, and group mapping, to organize tabs and detect duplicates. It does not request the Chrome history API. | CONFIRM |
| User activity | RECOMMENDED: Yes | The product handles local user actions such as organize results, undo/restore state, local rules, saved workspace actions, and count-only safety audit events. No remote analytics upload exists. | CONFIRM |
| Website content / website resources | RECOMMENDED: Yes | The product can read visible current-tab text only after the user asks for current-tab summary or page question. For group/selected-tabs page questions, optional site access is requested only for the specific sites involved and released after the answer. Selected-region chat may transiently capture the visible tab after the user clicks a page region, crop it in memory, discard image bytes, and include only cropped metadata in the text-only Page Agent payload. It also handles tab title/hostname/path for grouping. | CONFIRM |
| User-provided content | RECOMMENDED: Yes | The product handles local chat refine instructions, local rules, chat drafts, and copied feedback templates. | CONFIRM |

## Data Use Certification Draft

Recommended certification posture:

```text
- Use data only for the single purpose: organizing open work tabs into Chrome native tab groups and providing sidebar/dashboard controls.
- TabMosaic AI does not sell user data.
- Do not use or transfer user data for advertising.
- Do not use user data for creditworthiness or lending.
- Do not allow humans to read user data unless the user explicitly sends redacted diagnostics/feedback or support content.
- Transfer metadata to the configured BYOK AI provider only when the user enables optional AI classification and provides an API key. Transfer visible page text only after a user-triggered page/context question.
- Do not upload diagnostics automatically.
- Do not upload page text automatically or during one-click organize.
- No analytics upload exists in the current build.
```

## Data Sharing Draft

Third parties in current build:

| Party | Data shared | Trigger | Status |
|---|---|---|---|
| Configured BYOK AI provider, default DeepSeek | Tab title, hostname, path, window ID, tab state; visible page text only for user-triggered page/context questions | Only when user enables optional AI features, saves a local API key, and grants any required provider-origin permission | CONFIRM before public build |
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
TabMosaic AI organizes open work tabs into Chrome native tab groups, helps review duplicate tabs, and provides sidebar/dashboard controls to undo, restore, refine, save local workspace snapshots, and summarize user-triggered current-tab or selected-tab context.
```

## Remote Code Field Draft

Status: CONFIRM

```text
No. TabMosaic AI does not execute remotely hosted code. The extension package contains its executable JavaScript. If optional BYOK AI is enabled, the extension sends a structured API request to the configured OpenAI-compatible provider and treats the response as data, validates it, and never executes it as code.
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
| `https://api.deepseek.com/*` | Required only when the user enables optional BYOK AI features with DeepSeek as the configured provider. |
| Optional provider origins | Requested only when the user configures a non-default BYOK provider host or localhost model endpoint and clicks Save/Test. |

## Final Confirmation Gates

Do not submit until these are confirmed:

```text
- final product name
- public developer identity
- support email
- privacy policy URL
- whether optional BYOK user-key AI remains in public build
- final data category checkboxes
- final Limited Use certification wording
- final single purpose wording
- final remote code answer
- final permission justifications
```
