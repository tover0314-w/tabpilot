# Chrome Web Store Submission Draft

Status: DO NOT SUBMIT YET  
Last checked: 2026-06-10  
Decision state: CONFIRM before publishing  
Scope: TabMosaic AI private-beta extension package

This document is a draft for Chrome Web Store submission and privacy-policy preparation. It is based on the current extension implementation and official Chrome Web Store policy pages. It must be reviewed and confirmed by the user before any public listing, privacy policy publication, or store dashboard disclosure.

## Official Sources Checked

- Chrome Web Store Program Policies: https://developer.chrome.com/docs/webstore/program-policies/policies
- Privacy Policies: https://developer.chrome.com/docs/webstore/program-policies/privacy
- Limited Use: https://developer.chrome.com/docs/webstore/program-policies/limited-use
- Fill out the privacy fields: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- Disclosure Requirements: https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements
- Complete your listing information: https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- Supplying Images: https://developer.chrome.com/docs/webstore/images
- Creating a great listing page: https://developer.chrome.com/docs/webstore/best-listing

## Confirmation Gates

CONFIRM before submission:

- Final product name and public developer identity.
- Public website / privacy policy URL.
- Public support email.
- Whether optional DeepSeek user-key classification remains in the first public build.
- Whether any hosted AI, account, sync, billing, or analytics is added before submission.
- Final Chrome Web Store data-use checkboxes.
- Final privacy policy wording.

## Single Purpose Draft

Status: CONFIRM

Recommended Chrome Web Store single purpose:

```text
TabMosaic AI organizes the user's open work tabs into Chrome native tab groups, helps review safe duplicate tabs, and provides a sidebar/dashboard to undo, restore, refine, and summarize user-triggered current-tab content.
```

Shorter listing version:

```text
One-click work tab organization using Chrome native tab groups, with sidebar review, Undo, Restore, and optional AI classification.
```

Do not claim:

```text
- It reads every page automatically.
- It stores browsing history in the cloud.
- It supports multi-tab page-content chat in P0.
- It provides hosted AI or account sync in the current build.
```

## Permission Justification Draft

Status: CONFIRM

| Permission | Draft justification |
|---|---|
| `tabs` | Required to read tab title, URL components, window, pinned/audible/active state, and tab IDs so TabMosaic can organize all normal windows, protect sensitive tabs from closure, detect safe duplicates, and reopen closed duplicates. |
| `tabGroups` | Required to create and update real Chrome native tab groups in the browser's top tab bar. |
| `sidePanel` | Required to open the sidebar control center after the user clicks the toolbar icon. |
| `storage` | Required to store local settings, rules, Undo/Restore snapshots, redacted diagnostics, local safety audit counts, and the optional local AI API key. |
| `scripting` | Required only for user-triggered current-tab summary; injects a content extractor into the active page after the user clicks Summarize Current Tab. |
| `activeTab` | Required to limit page-content access to the active tab after a user gesture. |
| `https://api.deepseek.com/*` | Optional host permission used only when the user enables DeepSeek AI classification and saves their own API key. The request format remains OpenAI-compatible, but other hosts are not supported in this private-beta package. |

Permissions not requested:

```text
<all_urls>
history
bookmarks
cookies
webRequest
browsingData
incognito access
```

## Remote Code Draft

Status: CONFIRM

Recommended answer:

```text
No, TabMosaic AI does not execute remotely hosted code. The extension package contains its executable JavaScript. If the user enables optional DeepSeek classification, the extension sends a structured API request to DeepSeek using an OpenAI-compatible request format and validates the JSON response before applying tab-group changes.
```

Risk note:

```text
API responses must remain data, not executable code. Do not add remote script loading.
```

## Data Use Draft

Status: CONFIRM
Standalone data disclosure draft source: `05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md`

Current local data handled:

| Data | Purpose | Stored where | Shared? |
|---|---|---|---|
| Tab title | Classification and sidebar/dashboard display | Local current run snapshot | Sent to DeepSeek only if user enables optional AI classification |
| Hostname and path | Classification, duplicate detection, rule matching | Local current run snapshot | Sent to DeepSeek only if user enables optional AI classification |
| Full URL | Restore closed duplicate tabs | Local restore snapshot only | Not included in copied diagnostics; not sent to AI by default |
| Tab state | Protect active, pinned, audible, incognito, internal, and non-restorable tabs | Local current run snapshot | Sent to DeepSeek only if user enables optional AI classification |
| Page text | Current-tab summary after user click | Not stored as a cloud record in current build | Not sent to AI/cloud in current build |
| User rules | Apply future classification preferences | Local storage | Not shared |
| Optional API key | User-provided DeepSeek classification | Local storage | Used only to call DeepSeek when AI classification is enabled |
| Redacted diagnostics | User-triggered beta feedback | Clipboard only when user clicks copy | Shared only if user manually sends it |
| Local error summaries | Debug beta issues | Local capped storage | Included only in redacted user-copied diagnostics |
| Duplicate safety audit counts | Track close/restore outcomes for beta trust checks | Local capped storage | Included only as count-only user-copied diagnostics |

Recommended store disclosure posture:

```text
TabMosaic handles browsing metadata to provide the user-facing tab organization feature. It does not request browsing history, cookies, bookmarks, webRequest, browsingData, or all-URLs access. Optional AI classification is off by default and uses the user's own API key.
```

## Privacy Policy Draft

Status: CONFIRM  
Standalone draft source: `05_PROJECT/13_PRIVACY_POLICY_DRAFT.md`
Audience: public website / privacy policy URL  
Placeholders to replace: `[Developer name]`, `[support email]`, `[website URL]`, `[CONFIRM DATE]`

```markdown
# TabMosaic AI Privacy Policy

Effective date: [CONFIRM DATE]

TabMosaic AI is a Chrome extension that organizes open work tabs into Chrome native tab groups, helps review duplicate tabs, and provides sidebar/dashboard controls for Undo, Restore, refinement, local workspace snapshots, and user-triggered current-tab summary.

## Data We Handle

TabMosaic AI may process tab title, hostname, URL path, tab state, tab IDs, window IDs, and Chrome tab group metadata to organize the user's open tabs. Full URLs may be stored locally only when needed to restore duplicate tabs that the extension closed or the user manually closed from duplicate review.

Saved workspace snapshots are created only when the user clicks Save. They are stored locally on the user's device and contain minimized workspace metadata such as group names, colors, counts, tab title, hostname, path, and group mapping. They do not store full URLs, restore URLs, URL hashes, favicon URLs, page text, summaries, chat history, or cloud data.

TabMosaic AI reads visible page text only when the user asks for a current-tab summary or page question. Sensitive pages require an extra confirmation before visible page text is read. The current build summarizes that content locally and does not automatically send page text to an AI provider.

If the user enables optional AI classification, TabMosaic AI sends a structured classification request containing tab title, hostname, path, window ID, and tab state to DeepSeek using an OpenAI-compatible request format. Full URLs and page text are not sent for classification by default.

## How We Use Data

We use this data only to provide TabMosaic AI's user-facing features: tab grouping, duplicate review, Undo/Restore, local rules, current-tab summary, local workspace snapshots, redacted diagnostics, and safety validation.

## Data Storage

TabMosaic AI stores settings, local rules, Undo/Restore snapshots, saved workspace snapshots, optional API settings, redacted local error summaries, and duplicate close safety counts in chrome.storage.local on the user's device.

The current build does not provide cloud sync, hosted AI accounts, account storage, billing, analytics upload, or cross-device workspace memory.

Users can delete individual saved workspace snapshots from Dashboard. This removes only the selected local snapshot and does not restore, close, move, or regroup tabs.

Users can clear local TabMosaic data from Dashboard -> Settings -> Clear Local Data. This removes local rules, saved workspace snapshots, API key/settings, recent results, Undo/Restore snapshots, chat drafts, first-run privacy acceptance, redacted local error summaries, and local duplicate safety audit counts. It does not close tabs, move tabs, delete browser history, delete cookies, or touch cloud account data.

Users can also clear only the locally saved AI API key from Dashboard -> Settings -> Clear AI Key. This disables AI classification and keeps local rules, recent organize results, Undo/Restore snapshots, saved workspace snapshots, diagnostics, and safety audit counts.

## Data Sharing

TabMosaic AI does not sell user data and does not use user data for advertising.

The extension shares data with DeepSeek only if the user enables optional AI classification and provides an API key. In that case, the extension sends tab title, hostname, path, window ID, and tab state for classification. Users should review DeepSeek's own terms and privacy policy before enabling it.

Redacted diagnostics and feedback templates are copied locally to the clipboard only after the user clicks the relevant Dashboard button. They are not uploaded automatically.

## Permissions

TabMosaic AI currently uses `tabs`, `tabGroups`, `sidePanel`, `storage`, `scripting`, `activeTab`, and `https://api.deepseek.com/*`. The DeepSeek host is used only when optional AI classification is enabled with a user-provided API key.

TabMosaic AI does not request `<all_urls>`, browsing history, bookmarks, cookies, `webRequest`, `browsingData`, or incognito access in the current build.

## Limited Use

The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Contact

Questions or requests: [support email]
```

## Store Listing Draft

Status: CONFIRM

Short description:

```text
Click once to organize work tabs into Chrome native tab groups, review duplicates, and continue from a sidebar.
```

Long description draft:

```text
TabMosaic AI helps knowledge workers clean up busy browser sessions without turning tabs into a separate fake workspace.

Click the extension icon and TabMosaic organizes all normal Chrome windows into real native tab groups. The sidebar opens to show what changed, which groups were created, which duplicate tabs were safely closed, and which duplicate candidates still need review.

Current beta features:
- One-click organization for all normal Chrome windows
- Chrome native tab groups
- Sidebar progress, results, Undo, and Restore Closed
- Safe exact/tracking duplicate cleanup
- Review-only handling for hash/query duplicate candidates
- Local rules from sidebar refinement
- Current-tab summary after user click
- Dashboard for Smart Groups, Duplicate Center, Rules & Memory, Settings, privacy controls, and beta diagnostics
- Optional DeepSeek classification with the user's own API key using an OpenAI-compatible request format

Privacy-first defaults:
- No all-URLs permission
- No browsing history, bookmarks, cookies, webRequest, or browsingData permission
- No incognito processing by default
- No automatic page-body reading
- No cloud sync or account required in the current beta
- Optional AI classification is off by default
```

## Store Screenshot Draft Pack

Status: DO NOT SUBMIT YET  
Source: generated mock UI screenshots, not real browsing data

Chrome Web Store dashboard guidance currently asks for at least one 1280x800 screenshot and allows up to five. The current local draft pack therefore generates five 1280x800 PNGs:

```text
artifacts/store-screenshots/01-one-click-native-groups.png
artifacts/store-screenshots/02-tab-agent-sidebar.png
artifacts/store-screenshots/03-smart-groups-dashboard.png
artifacts/store-screenshots/04-privacy-ai-settings.png
artifacts/store-screenshots/05-mobile-dashboard.png
```

Generation command:

```bash
node tools/capture_ui_screenshots.js
node tools/build_store_screenshots.js
```

Important boundaries:

```text
- These are local draft assets for review, not final listing assets.
- They use mock extension data only.
- They do not read real browser tabs, .env.local, API keys, page text, or real profile screenshots.
- Final screenshots still need user approval before Chrome Web Store submission.
```

## Final Submission Checklist

- [ ] User confirms final product name.
- [ ] User confirms public developer name and support email.
- [ ] User confirms privacy policy URL.
- [ ] User confirms optional DeepSeek AI remains in public build.
- [ ] User confirms final single-purpose field.
- [ ] User confirms permission justifications.
- [ ] User confirms remote-code declaration.
- [ ] User confirms data-use categories against `05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md`.
- [ ] Manual QA runbook is completed on a real Chrome profile.
- [ ] Privacy policy is published before store submission.
- [ ] Final store screenshots and demo video are approved from the current build.
