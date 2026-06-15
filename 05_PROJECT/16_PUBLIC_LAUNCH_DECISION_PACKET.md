# Public Launch Decision Packet

Status: CONFIRM BEFORE PUBLIC LAUNCH
Purpose: collect the remaining user decisions blocking public source release / Chrome Web Store / launch posts
Last updated: 2026-06-15

This packet does not finalize decisions. It turns the remaining blockers into a compact approval list.

The generated local handoff packet also includes `launch-decision-review.html`, a local-only visual review page for the same gates and copyable reply. It does not approve, publish, submit, or change any public state.

For final local review, run `node tools/prepare_release_candidate_packet.js`. It generates an ignored release candidate packet that links the packaged extension zip/checksum, this launch decision handoff, the screenshot review packet, and the real-profile QA checklist from one local HTML page. It is still a review aid only and does not approve launch or run real-profile QA.

Recommended reply format:

```text
D-L01 approve
D-L02 approve
D-L03 change: ...
D-L04 approve after I provide email/domain
```

Before applying any filled reply, validate it locally:

```bash
node tools/launch_readiness_report.js --template-only > /tmp/tabmosaic-launch-reply.txt
# Fill /tmp/tabmosaic-launch-reply.txt, then run:
node tools/validate_public_launch_decision_reply.js /tmp/tabmosaic-launch-reply.txt
```

The validator checks missing gates, duplicate gates, unresolved `<placeholder>` values, and gates the user still marked `keep blocked`. It does not approve decisions, edit docs, publish anything, submit to Chrome Web Store, run QA, or change launch state.

## 1. Current Readiness

Current evidence:

```text
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
```

Why GitHub-only public source release is now clear:

```text
Apache-2.0 license confirmed and LICENSE added
raw imported archive moved out of the public repo into private backup
real-profile QA explicitly deferred for GitHub-only source release
```

Why public marketing / Chrome Web Store launch is still blocked:

```text
privacy policy URL / support email not confirmed
Chrome Web Store disclosures not confirmed
final screenshots / demo not approved
real-profile manual QA not completed
beta user feedback not collected
```

`LICENSE` is now included with Apache-2.0.
Public repo boundary is now treated as confirmed by the user's full-open-source direction, while secrets, ignored local artifacts, local private-beta config, completed real-profile QA notes, and raw imported archives remain excluded from the public source release.

The product can move toward a GitHub source release before Chrome Web Store launch, but only if the README clearly says local/private beta, install-from-source, and public Chrome Web Store launch not ready yet.

## 1.1 One-Page Launch Tracker

This is the operational checklist for moving from source-release ready to public launch ready. Items marked `USER INPUT` need the user to provide or approve something; items marked `QA` need a real-world verification pass; items marked `BUILD` can be implemented after the related decision is approved.

| Gate | Status | Owner | What Is Needed Next | Evidence / Source |
|---|---|---|---|---|
| D-L03 Brand/domain | BLOCKING | USER INPUT | Choose final public name and domain path, or approve launching GitHub with `TabMosaic AI` clearly labeled as working name only | `01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md` |
| D-L04 Developer identity/support | BLOCKING | USER INPUT | Provide public developer name, support email, and website URL for store/legal copy | `05_PROJECT/13_PRIVACY_POLICY_DRAFT.md` placeholders |
| D-L05 Privacy policy URL | BLOCKING | USER INPUT | Approve final privacy policy wording and where it will be hosted | `05_PROJECT/13_PRIVACY_POLICY_DRAFT.md` |
| D-L06 Store single purpose | BLOCKING | USER INPUT | Approve exact Chrome Web Store single-purpose wording before submission | `05_PROJECT/07_STORE_SUBMISSION_DRAFT.md` |
| D-L07 Store data disclosure | BLOCKING | USER INPUT | Confirm Chrome Web Store data category checkbox mapping and Limited Use wording from the actual dashboard | `05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md` |
| D-L08 First public BYOK scope | BLOCKING | USER INPUT | Confirm first public build remains local/open-source/BYOK with no hosted AI, account, cloud sync, or cloud memory | README + provider docs |
| D-L09 Free/Pro boundary | BLOCKING | USER INPUT | Confirm public copy may say local BYOK core is free/open source and hosted services are later paid | Paywall/billing spec |
| D-L10 Analytics policy | BLOCKING | USER INPUT | Confirm first public build has no remote analytics involving browsing activity | `04_TECH/08_ANALYTICS_EVENTS.md` |
| D-L11 Real-profile QA | BLOCKING FOR STORE | QA | Run one redacted real-profile manual QA pass before Chrome Web Store/public marketing; temporary Chrome runtime QA already passed | `05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md`, `05_PROJECT/08_QA_EVIDENCE.md` |
| D-L12 Final screenshots/demo | BLOCKING | USER INPUT + QA | Approve final screenshot/demo assets generated from synthetic/mock data only | `artifacts/store-screenshots/`, `artifacts/store-asset-review/`, `05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md` |
| D-L13 Beta ramp | BLOCKING | USER INPUT | Approve 5-10 trusted tester ramp, issue templates, and feedback handling | `.github/ISSUE_TEMPLATE/` |
| D-L14 Launch timing | BLOCKING | USER INPUT | Approve when GitHub, marketing, Product Hunt/HN/X, and Chrome Web Store submission may happen | this packet |

Current executable status:

```text
Can do now without more confirmation:
- keep improving local/open-source build quality;
- run temporary Chrome runtime QA;
- regenerate synthetic screenshots and release package;
- prepare draft copy and checklists.

Needs user confirmation before changing public state:
- final brand/domain;
- support email / privacy URL;
- store listing submission;
- public marketing posts;
- hosted/cloud/payment decisions;
- any analytics involving browsing activity.
```

## 2. Decision Summary

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| D-L01 | Open-source license | Apache-2.0 for permissive adoption plus explicit patent grant | CONFIRMED BY USER |
| D-L02 | Public repo boundary | Publish the local extension core, docs, prompts/schemas, tools, issue templates, and privacy materials; exclude secrets, ignored artifacts, completed real-profile QA notes, local private-beta config, and unapproved raw imported archives | CONFIRMED BY USER |
| D-L03 | Product name / domain | Keep TabMosaic AI as working name only for now; re-confirm public brand/domain because the 2026-06-15 scan confirmed a Chrome Web Store extension named `Tab Mosaic` and a crowded `Tab + noun` naming space | CONFIRM |
| D-L04 | Public developer identity / support email | Use a stable public support email on the chosen domain | CONFIRM |
| D-L05 | Privacy policy URL | Publish the standalone privacy policy after placeholders are replaced and approved | CONFIRM |
| D-L06 | Chrome Web Store single-purpose wording | Use the draft in `05_PROJECT/07_STORE_SUBMISSION_DRAFT.md` after final review; 2026-06-12 official policy review completed, but acceptance still requires actual submission | CONFIRM |
| D-L07 | Chrome Web Store data-use / Limited Use disclosure | Use the conservative mapping in `05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md` after final review; 2026-06-12 official policy review completed, but final dashboard checkboxes still need confirmation | CONFIRM |
| D-L08 | First public build includes BYOK AI | Yes, keep BYOK as core positioning; no hosted AI, no account, no cloud sync in first public build | CONFIRM |
| D-L09 | Free / Pro boundary | Local extension + BYOK core free/open source; hosted AI, sync, team, long-term memory, and managed workspace services later paid | CONFIRM |
| D-L10 | Analytics policy | Ship first public build with no remote analytics involving browsing activity | CONFIRM |
| D-L11 | Real-profile QA requirement | Deferred for GitHub-only source release; before Chrome Web Store submission, run one full redacted real-profile QA pass | CONFIRMED BY USER FOR SOURCE RELEASE DEFERRAL |
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

Completed after confirmation:

```text
Add LICENSE.
Update README license section.
Update package/repo metadata if added later.
Mark D-034-A as confirmed.
```

Status:

```text
CONFIRMED BY USER on 2026-06-13.
LICENSE added with Apache-2.0 text.
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
Resolved for GitHub-only source release: raw imported archive files are not public. The imported UI zip was moved to a private backup outside the repository.
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
The 2026-06-15 rescan also found multiple occupied or risky `Tab + noun` names: TabPilot, TabWeave, TabAtlas, TabCraft, TabMind, TabOrbit, and TabForge.
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
For GitHub-only source release: deferred by user confirmation on 2026-06-13.
For Chrome Web Store / public marketing launch: run one full redacted real-profile QA pass before submission or launch posts.
Run disposable QA profile first.
Run one non-critical real-profile QA pass.
Only then run one real day-to-day profile pass if the user is comfortable.
```

D-L11_SOURCE_RELEASE_STATUS=DEFERRED_FOR_GITHUB_SOURCE_RELEASE

Evidence template:

```text
05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md
artifacts/real-profile-qa/<timestamp>/real-profile-qa-checklist.html
```

Latest automated evidence:

```text
2026-06-15 Chrome runtime QA refresh passed with temporary synthetic Chrome profiles:
- normal runtime smoke passed real native groups, Sidebar composer, Dashboard apply/move/drag/drop/focus, Undo, Restore, and selected-tabs/page-context flows;
- large-tab probe organized 96 synthetic tabs in 1446ms with 9 groups, 96 moved tabs, 8 safe duplicate closes, and 9 review duplicate groups;
- DeepSeek Agent runtime flow passed through the real Sidebar composer with follow-up, AI draft, and Apply moving 2 tabs.

This lowers launch risk but does not replace the required redacted real-profile manual QA pass.
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
artifacts/store-asset-review/<timestamp>/store-asset-review.html
```

Recommendation:

```text
Use mock/synthetic data only.
Generate final assets from the current approved UI.
Review the generated local HTML preview before asking for D-L12 approval.
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
Clearly say Apache-2.0 license.
```

## 4. After Approval Work Plan

When the user approves the packet, next implementation/doc steps:

```text
1. Replace privacy policy placeholders once D-L04/D-L05 are provided.
2. Finalize Chrome Store wording once D-L06/D-L07 are approved.
3. Run real-profile QA and record redacted result outside git or in a sanitized copy.
4. Generate and user-review final screenshots/demo.
5. Prepare public marketing and Chrome Web Store launch only after remaining public-launch gates are resolved.
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
