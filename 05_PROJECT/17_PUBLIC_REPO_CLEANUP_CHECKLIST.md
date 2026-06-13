# Public Repo Cleanup Checklist

Status: PUBLIC SOURCE RELEASE READY AFTER FINAL AUDIT; DO NOT LAUNCH STORE/MARKETING UNTIL PUBLIC-LAUNCH MATERIALS ARE CLEARED
Decision state: D-L01, D-L02, ARCHIVE, and D-L11 source-release deferral are confirmed; this checklist still blocks store/marketing launch until separate public-launch materials are cleared
Last updated: 2026-06-13

This checklist is for the final pass before making the repository public, pushing a public source-release branch, or preparing a public-launch branch.

Current readiness:

```text
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_SOURCE_RELEASE=yes
READY_PUBLIC_MARKETING_LAUNCH=no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
```

Meaning:

```text
Public source release = GitHub/source code can be public with clear beta warnings.
Public marketing launch = launch posts, website campaign, Product Hunt/HN/X-style announcement.
Public Chrome Web Store launch = Chrome Web Store listing submitted/published for general users.
```

## 1. Principle

The public repo should show enough to earn trust:

```text
extension source
privacy implementation
AI payload boundaries
prompts and schemas
provider setup
tests and packaging tools
product/UX/technical docs
issue templates
launch status
```

It should not expose:

```text
secrets
private browser data
real-profile QA notes
private screenshots
ignored local artifacts
unapproved legal/store copy as final
raw imported archives
```

## 2. Must Confirm Before Public Push

These are not solved by this checklist:

```text
[x] D-L01 Open-source license confirmed.
[x] D-L02 Public repo boundary confirmed.
[x] ARCHIVE Raw imported archive reviewed and moved to private backup outside the public repo.
[x] D-L11 Real-profile QA requirement explicitly deferred for GitHub-only source release.
```

D-L11_SOURCE_RELEASE_STATUS=DEFERRED_FOR_GITHUB_SOURCE_RELEASE

These block public marketing and Chrome Web Store launch, but should not be mixed up with a GitHub-only source release:

```text
[ ] D-L03 Product name / domain confirmed or public copy clearly says working name.
[ ] D-L04 Public developer identity / support email confirmed if store/legal docs are published.
[ ] D-L05 Privacy policy URL confirmed if linked externally.
[ ] D-L06 Chrome Web Store single-purpose wording approved before store submission.
[ ] D-L07 Chrome Web Store data-use / Limited Use disclosure approved before store submission.
[ ] D-L12 Final screenshots/demo approved before public marketing/store use.
```

## 3. Keep In Public Repo

Recommended keep list after D-L02 approval:

```text
README.md
AGENTS.md
agents.md
CONTRIBUTING.md
CHANGELOG.md
INDEX.md
.github/workflows/ci.yml
.github/ISSUE_TEMPLATE/
extension/
tools/
00_START_HERE/
01_PRODUCT/
02_FEATURE_SPECS/
03_UX/
04_TECH/
05_PROJECT/
06_REFERENCES/ curated docs
.env.example
.gitignore
```

Notes:

```text
Docs marked DO NOT SUBMIT YET / DO NOT PUBLISH YET can stay if their draft status is visible.
Private-beta release notes can stay if they clearly say private beta and not Chrome Web Store launch.
QA evidence can stay only because it is synthetic/redacted and explicitly forbids secrets and real browsing data.
```

## 4. Exclude From Public Repo

Do not commit / do not publish:

```text
.env
.env.*
!.env.example
extension/private-beta-ai-settings.json
dist/
artifacts/
output/
completed real-profile QA reports
private screenshots or recordings
real browser profile data
API keys
provider console screenshots
Chrome Web Store dashboard screenshots containing account data
```

`dist/`, `artifacts/`, and `output/` are local generated outputs. They should be reproducible from source and ignored by git.

## 5. Archive Decision

Resolved for public source release:

```text
The raw imported UI archive was removed from git tracking and moved to a private backup outside the public repository.
```

Do not re-add to the public repository unless the user separately approves after manual inspection.

Previous archive:

```text
06_REFERENCES/ARCHIVES/TabPilot-AI-UI.zip
```

## 6. Pre-Public Commands

Run from repo root:

```bash
git status --short
git ls-files
node tools/secret_scan.js
node tools/public_repo_audit.js
node tools/issue_form_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/beta_readiness_check.js
node tools/preflight.js
git diff --check
```

Optional but recommended before a public source release:

```bash
node tools/preflight.js --screenshots
node tools/preflight.js --runtime
node tools/preflight.js --agent-flow
node tools/preflight.js --large-runtime
```

Important:

```text
Do not run real-profile QA notes into git.
Keep completed real-profile QA results outside git or commit only a manually redacted copy after review.
```

## 7. Manual File Audit

Before public push, inspect:

```bash
git ls-files | rg '(^\.env|private-beta|dist/|artifacts/|output/|\.zip$|\.pem$|\.key$|secret|token|cookie|profile|real-profile|screenshot|recording)'
git status --short --ignored
```

Expected:

```text
.env and .env.local are ignored, not tracked.
extension/private-beta-ai-settings.json is ignored, not tracked.
dist/ is ignored.
artifacts/ is ignored.
output/ is ignored.
No completed real-profile QA report is tracked.
No API key or provider secret appears in tracked or unignored candidate files.
```

`tools/public_repo_audit.js` scans tracked plus unignored candidate files for common secret patterns such as `sk-...` API keys and bearer tokens. Synthetic test keys such as `sk-secret` in local tests are allowed; real provider keys are not.

Known archive status:

```text
No raw imported archive should be tracked in the public source release.
```

## 8. Public README Audit

Confirm README says:

```text
open-source AI browser layer for Chrome
controlled local/private beta
public Chrome Web Store launch is not ready yet
license is Apache-2.0
metadata-first Smart Organize
page text is user-triggered only
BYOK provider setup
privacy architecture explainer
contributing guide
```

## 9. Store / Legal Draft Audit

Confirm these remain draft-only until approved:

```text
05_PROJECT/07_STORE_SUBMISSION_DRAFT.md
05_PROJECT/13_PRIVACY_POLICY_DRAFT.md
05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md
05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md
05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md
```

They must keep visible status labels such as:

```text
DO NOT SUBMIT YET
DO NOT PUBLISH YET
CONFIRM BEFORE PUBLIC LAUNCH
```

## 10. Final Public Push Checklist

GitHub/source release only after confirmation:

```text
[x] License added if approved.
[x] Public repo boundary approved.
[x] Raw archive decision resolved.
[x] Real-profile QA completed or explicitly deferred for GitHub-only source release.
[x] Secrets scan passed.
[x] Public repo audit passed.
[x] Issue forms smoke passed.
[x] Extension smoke passed.
[x] Release package verification passed.
[x] README first screen reviewed.
[x] Privacy architecture reviewed.
[x] Final public branch contains no ignored generated outputs.
```

Marketing / Chrome Web Store launch only after additional confirmation:

```text
[ ] Support/contact path reviewed.
[ ] Privacy policy URL reviewed.
[ ] Chrome Web Store wording reviewed.
[ ] Chrome Web Store disclosure reviewed.
[ ] Real-profile QA status stated truthfully.
[ ] Final screenshots/demo approved.
[ ] Beta readiness still says public Chrome Web Store launch is not ready unless all public-launch blockers are actually resolved.
```
