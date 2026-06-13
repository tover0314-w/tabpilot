# Public Launch Decision Packet

Status: CONFIRM BEFORE PUBLIC LAUNCH  
Purpose: collect the remaining user decisions blocking public repo / Chrome Web Store / launch posts  
Last updated: 2026-06-12

This packet does not finalize decisions. It turns the remaining blockers into a compact approval list.

Recommended reply format:

```text
D-L01 approve
D-L02 approve
D-L03 change: ...
D-L04 approve after I provide email/domain
```

## 1. Current Readiness

Current evidence:

```text
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
```

Why public launch is still blocked:

```text
open-source license not confirmed
raw imported archive public-repo treatment not approved
privacy policy URL / support email not confirmed
Chrome Web Store disclosures not confirmed
final screenshots / demo not approved
real-profile manual QA not completed
beta user feedback not collected
```

No `LICENSE` file was added because the open-source license remains unconfirmed.
Public repo boundary is now treated as confirmed by the user's full-open-source direction, while secrets, ignored local artifacts, local private-beta config, completed real-profile QA notes, and unapproved raw archives remain excluded or blocked until separately cleared.

## 2. Decision Summary

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| D-L01 | Open-source license | Apache-2.0 for permissive adoption plus explicit patent grant | CONFIRM |
| D-L02 | Public repo boundary | Publish the local extension core, docs, prompts/schemas, tools, issue templates, and privacy materials; exclude secrets, ignored artifacts, completed real-profile QA notes, local private-beta config, and unapproved raw imported archives | CONFIRMED BY USER |
| D-L03 | Product name / domain | Keep TabMosaic AI as working name only for now; re-confirm public brand/domain because the 2026-06-12 scan found a Chrome Web Store extension named `Tab Mosaic` | CONFIRM |
| D-L04 | Public developer identity / support email | Use a stable public support email on the chosen domain | CONFIRM |
| D-L05 | Privacy policy URL | Publish the standalone privacy policy after placeholders are replaced and approved | CONFIRM |
| D-L06 | Chrome Web Store single-purpose wording | Use the draft in `05_PROJECT/07_STORE_SUBMISSION_DRAFT.md` after final review; 2026-06-12 official policy review completed, but acceptance still requires actual submission | CONFIRM |
| D-L07 | Chrome Web Store data-use / Limited Use disclosure | Use the conservative mapping in `05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md` after final review; 2026-06-12 official policy review completed, but final dashboard checkboxes still need confirmation | CONFIRM |
| D-L08 | First public build includes BYOK AI | Yes, keep BYOK as core positioning; no hosted AI, no account, no cloud sync in first public build | CONFIRM |
| D-L09 | Free / Pro boundary | Local extension + BYOK core free/open source; hosted AI, sync, team, long-term memory, and managed workspace services later paid | CONFIRM |
| D-L10 | Analytics policy | Ship first public build with no remote analytics involving browsing activity | CONFIRM |
| D-L11 | Real-profile QA requirement | Run one full redacted real-profile QA pass before public Chrome Web Store submission | CONFIRM |
| D-L12 | Final screenshots / demo | Use mock/synthetic data only; user must approve final assets before store or launch posts | CONFIRM |
| D-L13 | Beta user ramp | Start with 5-10 trusted testers, then 20-50 after critical issues are resolved | CONFIRM |
| D-L14 | Public launch timing | Do not post PH/HN/X or submit Chrome Web Store until D-L01 through D-L13 are resolved | CONFIRM |

## 3. Detailed Decisions

### D-L01 Open-Source License

Recommendation:

```text
Apache-2.0
```

Why:

- Permissive enough for fast developer adoption.
- More explicit patent grant than MIT.
- Easier for companies to approve than AGPL.
- Fits the user's full open-source growth direction.

Alternatives:

| License | Tradeoff |
|---|---|
| MIT | Simpler and widely understood; weaker patent language |
| Apache-2.0 | Still permissive; includes explicit patent grant |
| AGPL-3.0 | Strong reciprocity; may reduce adoption and provider/community contributions |

Do after confirmation:

```text
Add LICENSE.
Update README license section.
Update package/repo metadata if added later.
Mark D-034-A as confirmed.
```

### D-L02 Public Repo Boundary

Recommendation:

Publish:

```text
extension/
tools/
.github/
00_START_HERE/
01_PRODUCT/
02_FEATURE_SPECS/
03_UX/
04_TECH/
05_PROJECT/
06_REFERENCES/ curated docs only
README.md
AGENTS.md
CONTRIBUTING.md
CHANGELOG.md
INDEX.md
```

Do not publish / do not commit:

```text
.env
.env.local
extension/private-beta-ai-settings.json
dist/
artifacts/
output/
completed real-profile QA reports
private screenshots
real browser profile data
API keys or provider console screenshots
```

Open question:

```text
Whether raw imported archive files in 06_REFERENCES/ARCHIVES should be kept public, moved to a private backup, or replaced by summarized docs only.
```

### D-L03 Product Name / Domain

Recommendation:

```text
Keep working name: TabMosaic AI for beta docs and implementation
Public descriptor: open-source AI browser layer for Chrome
```

Source scan:

```text
01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md
```

Important:

```text
Do not finalize TabMosaic AI publicly until the near-name conflict is reviewed.
Chrome Web Store already has a near-name extension listing: Tab Mosaic.
Domain availability and trademark risk must be checked in real time before purchase or public launch.
Do not assume any domain is available from old notes.
```

Decision needed:

```text
Confirm final public name.
Confirm domain shortlist.
Confirm whether to use .ai, .dev, .app, .io, or a subdomain under an existing site.
Confirm whether to keep TabMosaic AI despite the Tab Mosaic near-conflict or rename before public launch.
```

### D-L04 Developer Identity / Support Email

Recommendation:

```text
Use a stable public support email, ideally support@<confirmed-domain>.
Use a developer identity that matches Chrome Web Store and privacy policy.
```

Needed before publishing:

```text
public developer name
support email
website URL
privacy policy URL
```

### D-L05 Privacy Policy URL

Source draft:

```text
05_PROJECT/13_PRIVACY_POLICY_DRAFT.md
```

Before publishing, replace:

```text
[Developer name]
[support email]
[website URL]
[CONFIRM DATE]
```

Do not publish until:

```text
final public build scope is frozen
BYOK/public provider behavior is confirmed
Chrome Web Store disclosure categories are confirmed
support email/domain are confirmed
```

### D-L06 Chrome Web Store Single Purpose

Source draft:

```text
05_PROJECT/07_STORE_SUBMISSION_DRAFT.md
```

Recommended single purpose:

```text
TabMosaic AI organizes the user's open work tabs into Chrome native tab groups, helps review safe duplicate tabs, and provides a sidebar/dashboard to undo, restore, refine, and summarize user-triggered current-tab content.
```

Decision needed:

```text
Approve exact wording before store submission.
```

### D-L07 Chrome Web Store Data-Use / Limited Use

Source draft:

```text
05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md
```

Recommendation:

```text
Use the conservative disclosure mapping.
Keep no-sale, no-advertising, no-analytics-upload, BYOK-only sharing boundaries.
```

Decision needed:

```text
Confirm final Chrome Web Store dashboard checkbox mapping from the actual dashboard UI before submission.
```

### D-L08 First Public Build Includes BYOK AI

Recommendation:

```text
Yes.
```

Why:

- BYOK is core to the open-source trust story.
- DeepSeek/default provider testing already uses OpenAI-compatible request shape.
- Provider permissions are explicit-origin gated.
- Local endpoints can work without sending Authorization when key is blank.

Boundary:

```text
No hosted AI gateway in first public build unless separately confirmed.
No account.
No cloud sync.
No cloud memory.
```

### D-L09 Free / Pro Boundary

Recommendation:

Free/open-source local core:

```text
Smart Organize
native tab groups
safe duplicate handling
Undo / Restore
Sidebar basic Agent
current-page chat
selected-tabs/group visible-context first slice
content-assisted regroup preview
BYOK provider configuration
local rules
privacy controls
```

Paid hosted services later:

```text
hosted AI credits
cloud sync
workspace history across devices
long-term AI memory
team workspaces
managed provider routing
priority support
```

Decision needed:

```text
Confirm whether this boundary is enough for public README/landing copy.
Do not set final prices yet unless user wants pricing work next.
```

### D-L10 Analytics Policy

Recommendation:

```text
First public build ships with no remote analytics involving browsing activity.
```

Allowed now:

```text
local-only redacted diagnostics copied by user
local-only count-based duplicate safety audit
manual beta feedback through issue templates
```

Do not implement without confirmation:

```text
remote event upload
tab metadata analytics
page-content analytics
user chat analytics
provider payload logging
product analytics tied to browsing activity
```

### D-L11 Real-Profile QA Requirement

Recommendation:

```text
Run disposable QA profile first.
Run one non-critical real-profile QA pass.
Only then run one real day-to-day profile pass if the user is comfortable.
```

Evidence template:

```text
05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md
```

Pass criteria:

```text
0 dangerous auto-close mistakes
no active/pinned/audible tab closed
native groups visible in top tab bar
Undo / Restore works
diagnostics are redacted
AI actions require Apply
```

### D-L12 Final Screenshots / Demo

Sources:

```text
05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md
tools/capture_ui_screenshots.js
tools/build_store_screenshots.js
artifacts/store-screenshots/
```

Recommendation:

```text
Use mock/synthetic data only.
Generate final assets from the current approved UI.
User approves every screenshot and video before posting or store submission.
```

Do not use:

```text
real tab titles
full URLs
emails
real dashboards
API keys
private profile screenshots
customer/company names
```

### D-L13 Beta User Ramp

Recommendation:

```text
Stage 1: 5-10 trusted users
Stage 2: fix blocker/high issues
Stage 3: 20-50 beta users
Stage 4: prepare public launch
```

Feedback paths:

```text
.github/ISSUE_TEMPLATE/beta_bug_report.yml
.github/ISSUE_TEMPLATE/beta_feedback.yml
.github/ISSUE_TEMPLATE/provider_request.yml
.github/ISSUE_TEMPLATE/grouping_quality.yml
.github/ISSUE_TEMPLATE/ui_bug.yml
```

### D-L14 Public Launch Timing

Recommendation:

```text
Do not post Product Hunt, Hacker News, X/Twitter, or submit Chrome Web Store until D-L01 through D-L13 are resolved.
```

If launching GitHub before Chrome Web Store:

```text
Clearly say local/private beta.
Clearly say install from source.
Clearly say public Chrome Web Store launch is not ready yet.
Clearly say license status if still pending.
```

## 4. After Approval Work Plan

When the user approves the packet, next implementation/doc steps:

```text
1. Add LICENSE if D-L01 is approved.
2. Update README license and public repo sections.
3. Update Decisions To Confirm statuses.
4. Replace privacy policy placeholders once D-L04/D-L05 are provided.
5. Finalize Chrome Store wording once D-L06/D-L07 are approved.
6. Run real-profile QA and record redacted result outside git or in a sanitized copy.
7. Generate and user-review final screenshots/demo.
8. Prepare public repo cleanup and push.
```

## 5. Current Non-Negotiables

These remain in force unless separately confirmed:

```text
no broad default all-URL access
no history/bookmarks/cookies/webRequest/browsingData permissions
no incognito processing by default
no automatic background page reading
no cloud sync/account/billing in the current beta
no remote analytics involving browsing activity
no AI action applying browser changes without user Apply, except the confirmed one-click organize pipeline
no Chrome Web Store submission before final confirmation
```
