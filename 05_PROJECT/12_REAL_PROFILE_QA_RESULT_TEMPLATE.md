# Real Profile QA Result Template

Status: BLANK TEMPLATE - NOT A COMPLETED QA RESULT

Use this file as a local copy template after the disposable QA profile passes and you are ready to test a non-critical real Chrome profile/window.

Do not commit a completed real-profile QA result unless it has been manually redacted. Prefer keeping completed real-profile notes outside git.

## Privacy Redaction Rules

Do not paste:

```text
- API keys
- bearer tokens
- cookies
- full URLs
- real tab titles
- page text
- private screenshots
- private emails
- private rule patterns
- customer/company confidential names
```

Allowed:

```text
- counts
- pass/fail labels
- generic domain categories such as docs, code review, communication, tasks
- approximate tab/window counts
- anonymized issue descriptions
- screenshots only after manually blurring private data
```

## Run Metadata

```text
Date:
Tester:
Chrome channel/version:
Extension version:
Commit:
Profile type: non-critical real profile / real day-to-day profile
Windows tested:
Approx tab count:
AI mode: local rules / DeepSeek with user key
DeepSeek connection tested: yes / no / skipped
DeepSeek Agent open answer tested: yes / no / skipped
DeepSeek Agent move draft tested: yes / no / skipped
```

## Required Checks

```text
Preflight passed before manual QA: yes / no
Disposable QA profile passed first: yes / no
Toolbar click opened Sidebar: pass / fail
First-run privacy gate appeared if expected: pass / fail / not applicable
Top tab bar showed real Chrome native groups: pass / fail
Groups looked useful for office/knowledge work: pass / acceptable / fail
Active tabs were not closed: pass / fail
Pinned tabs were not closed: pass / fail / not applicable
Audible tabs were not closed: pass / fail / not applicable
Exact/tracking duplicates closed only when safe: pass / fail / not applicable
Hash/query duplicates stayed in review: pass / fail / not applicable
Restore Closed worked: pass / fail / not applicable
Undo restored grouping state as expected: pass / fail
Sidebar stayed chat-first and simple: pass / fail
Sidebar DeepSeek Agent open answer rendered as chat: pass / fail / not tested
Sidebar DeepSeek Agent move draft required Apply: pass / fail / not tested
Sidebar DeepSeek Agent move draft did not close tabs: pass / fail / not tested
Sidebar Ask page required user-triggered page read: pass / fail / not tested
Sensitive page summary asked for extra confirmation: pass / fail / not tested
Dashboard opened to Smart Groups: pass / fail
Dashboard Duplicate Center stayed folded until opened: pass / fail
Dashboard tab focus opened an existing tab: pass / fail
Dashboard same-window move worked: pass / fail / not tested
Dashboard Apply updated native group title/color: pass / fail / not tested
Dashboard diagnostics copied locally only: pass / fail / not tested
Diagnostic snapshot was manually checked for sensitive data: pass / fail / not tested
Clear AI Key behavior safe: pass / fail / not tested
Clear Local Data behavior safe: pass / fail / not tested
```

## Classification Quality

Use the 70/20/10/0 target:

```text
Clearly right groups/tabs:
Acceptable groups/tabs:
Review or Misc groups/tabs:
Dangerous close mistakes:
```

Pass target:

```text
70% clearly right
20% acceptable
10% Review/Misc
0 dangerous auto-close mistakes
```

## Issues Found

Use anonymized descriptions only.

```text
Issue 1:
Severity: blocker / high / medium / low
Area: one-click / grouping / duplicate safety / Sidebar / Dashboard / privacy / AI / performance
Steps, redacted:
Expected:
Actual:
Reproducible: yes / no / unknown
Private data removed: yes / no
```

## Decision Gates Triggered

Mark any item that needs user confirmation before public launch:

```text
Privacy policy URL:
Support email:
Final brand/domain:
Chrome Web Store disclosure:
Screenshots/demo video:
Pricing/free-Pro limits:
Analytics involving browsing activity:
Additional AI providers/host permissions:
Cloud sync/storage:
```

## Final Result

```text
READY_FOR_NEXT_PRIVATE_BETA_USER=yes/no
READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no
Reason:
```
