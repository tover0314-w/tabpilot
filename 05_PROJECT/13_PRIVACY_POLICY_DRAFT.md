# TabMosaic AI Privacy Policy Draft

Status: DO NOT PUBLISH YET
Decision state: CONFIRM before publishing
Last updated: 2026-06-12
Audience: public website / Chrome Web Store privacy policy URL
Placeholders to replace: `[Developer name]`, `[support email]`, `[website URL]`, `[CONFIRM DATE]`

This is a standalone draft for review. It must not be published or submitted to Chrome Web Store until the user confirms the final developer identity, support email, website/privacy policy URL, data-use disclosures, optional BYOK AI provider scope, and final wording.

---

# TabMosaic AI Privacy Policy

Effective date: [CONFIRM DATE]

TabMosaic AI is a Chrome extension that organizes open work tabs into Chrome native tab groups, helps review duplicate tabs, and provides sidebar/dashboard controls for Undo, Restore, refinement, local workspace snapshots, and user-triggered current-tab summary.

## Data We Handle

TabMosaic AI may process tab title, hostname, URL path, tab state, tab IDs, window IDs, and Chrome tab group metadata to organize the user's open tabs.

Full URLs may be stored locally only when needed to restore duplicate tabs that the extension closed or that the user manually closed from duplicate review.

Saved workspace snapshots are created only when the user clicks Save. They are stored locally on the user's device and contain minimized workspace metadata such as group names, colors, counts, tab title, hostname, path, and group mapping. They do not store full URLs, restore URLs, URL hashes, favicon URLs, page text, summaries, chat history, or cloud data.

TabMosaic AI reads visible page text only when the user asks for a current-tab summary or page question. Sensitive pages require an extra confirmation before visible page text is read. When the user asks about a specific selected page region, the extension may transiently capture the current visible tab after the user clicks a region, crop the capture in memory to that selected region, discard the full visible-tab capture and cropped image bytes, and keep only cropped screenshot metadata for the text-only Page Agent. The current build does not upload screenshot image bytes or data URLs.

If the user enables optional BYOK AI classification, TabMosaic AI sends a structured classification request containing tab title, hostname, path, window ID, and tab state to the configured OpenAI-compatible provider. DeepSeek is the default provider; custom HTTPS provider hosts and `http://localhost` local model endpoints require an explicit Chrome origin permission prompt before use. Full URLs and page text are not sent for classification by default.

## How We Use Data

We use this data only to provide TabMosaic AI's user-facing features: tab grouping, duplicate review, Undo/Restore, local rules, current-tab summary, local workspace snapshots, redacted diagnostics, and safety validation.

## Data Storage

TabMosaic AI stores settings, local rules, Undo/Restore snapshots, saved workspace snapshots, optional API settings, redacted local error summaries, and duplicate close safety counts in `chrome.storage.local` on the user's device.

The current build does not provide cloud sync, hosted AI accounts, account storage, billing, analytics upload, or cross-device workspace memory.

Users can delete individual saved workspace snapshots from Dashboard. This removes only the selected local snapshot and does not restore, close, move, or regroup tabs.

Users can clear local TabMosaic data from Dashboard -> Settings -> Clear Local Data. This removes local rules, saved workspace snapshots, API key/settings, recent results, Undo/Restore snapshots, chat drafts, first-run privacy acceptance, redacted local error summaries, and local duplicate safety audit counts. It does not close tabs, move tabs, delete browser history, delete cookies, or touch cloud account data.

Users can also clear only the locally saved AI API key from Dashboard -> Settings -> Clear AI Key. This disables AI classification and keeps local rules, recent organize results, Undo/Restore snapshots, saved workspace snapshots, diagnostics, and safety audit counts.

## Data Sharing

TabMosaic AI does not sell user data and does not use user data for advertising.

The extension shares data with the configured BYOK AI provider only if the user enables optional AI classification and provides an API key. DeepSeek is the default provider. In that case, the extension sends tab title, hostname, path, window ID, and tab state for classification; visible page text is sent only after a user-triggered page or selected-tabs question. For selected-region chat, the text-only Page Agent receives cropped screenshot metadata only, not screenshot image bytes or data URLs. Users should review their chosen provider's own terms and privacy policy before enabling it.

Redacted diagnostics and feedback templates are copied locally to the clipboard only after the user clicks the relevant Dashboard button. They are not uploaded automatically. Copied diagnostics exclude URLs, tab titles, hostnames, rule patterns, group names, page text, emails, bearer tokens, and API keys.

## Permissions

TabMosaic AI currently uses these Chrome permissions:

- `tabs`: read open tab metadata, organize tabs, protect active/pinned/audible tabs, and restore closed duplicate tabs.
- `tabGroups`: create and update Chrome native tab groups.
- `sidePanel`: open the sidebar control center after the user clicks the extension icon.
- `storage`: store local settings, rules, snapshots, diagnostics, and optional API settings.
- `scripting` and `activeTab`: read visible text from the current active tab only after a user-triggered summary or page question action.
- `http://*/*` and `https://*/*` as optional site access: requested only for the specific sites involved in a user-triggered group or selected-tabs page question, then released after the answer; also used to request the specific origin of a user-configured BYOK AI provider before testing or saving.
- `https://api.deepseek.com/*`: call DeepSeek only when optional BYOK AI features are enabled with a user-provided API key.

TabMosaic AI does not request the literal `<all_urls>` permission, browsing history, bookmarks, cookies, `webRequest`, `browsingData`, or incognito access in the current build. All-website access is not granted by default.

## Limited Use

The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Contact

Questions or requests: [support email]
