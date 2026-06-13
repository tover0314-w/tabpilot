# Public Repo Cleanup Checklist

Status: DRAFT - DO NOT PUSH PUBLICLY UNTIL D-L01, ARCHIVE, REAL-PROFILE QA, AND PUBLIC-LAUNCH MATERIALS ARE CLEARED  
Decision state: D-L02 public repo boundary is confirmed by the user's full-open-source direction; this checklist still blocks unsafe or unapproved files  
Last updated: 2026-06-12

This checklist is for the final pass before making the repository public or pushing a public-launch branch.

Current readiness:

```text
READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
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
raw imported archives unless explicitly confirmed
```

## 2. Must Confirm Before Public Push

These are not solved by this checklist:

```text
[ ] D-L01 Open-source license confirmed.
[x] D-L02 Public repo boundary confirmed.
[ ] D-L03 Product name / domain confirmed or public copy clearly says working name.
[ ] D-L04 Public developer identity / support email confirmed if store/legal docs are published.
[ ] D-L05 Privacy policy URL confirmed if linked externally.
[ ] D-L06 Chrome Web Store single-purpose wording approved before store submission.
[ ] D-L07 Chrome Web Store data-use / Limited Use disclosure approved before store submission.
[ ] D-L11 Real-profile QA requirement completed or explicitly deferred for GitHub-only source release.
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

## 5. Archive Decision Gate

Current raw archive found:

```text
06_REFERENCES/ARCHIVES/TabPilot-AI-UI.zip
```

Decision needed before public push:

```text
Option A: keep archive public if it contains only user-owned design source and no private/sensitive content.
Option B: remove archive from public repo and keep only summarized docs/screenshots.
Option C: move archive to private backup outside the public repo.
```

Current recommendation:

```text
Use Option B or C unless the archive has been manually inspected and approved for public release.
```

Do not delete or untrack the archive automatically without user confirmation because it may be part of the imported harness history.

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

Known item requiring decision:

```text
06_REFERENCES/ARCHIVES/TabPilot-AI-UI.zip is currently tracked and must be reviewed before public repo launch.
```

## 8. Public README Audit

Confirm README says:

```text
open-source AI browser layer for Chrome
controlled local/private beta
public Chrome Web Store launch is not ready yet
license is still CONFIRM if not yet approved
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

Only after confirmation:

```text
[ ] License added if approved.
[ ] Public repo boundary approved.
[ ] Raw archive decision resolved.
[ ] Secrets scan passed.
[ ] Public repo audit passed.
[ ] Issue forms smoke passed.
[ ] Extension smoke passed.
[ ] Release package verification passed.
[ ] Beta readiness still says public Chrome Web Store launch is not ready unless all public-launch blockers are actually resolved.
[ ] README first screen reviewed.
[ ] Privacy architecture reviewed.
[ ] Support/contact path reviewed.
[ ] Real-profile QA status stated truthfully.
[ ] Final public branch contains no ignored generated outputs.
```
