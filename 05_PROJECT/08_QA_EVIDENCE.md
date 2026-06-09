# QA Evidence

This file records concrete local verification evidence for private-beta readiness. It must not contain secrets, real browsing data, tab titles from the user's browser, full URLs from the user's browser, API keys, or private screenshots.

## 2026-06-09 Local Verification

Status: PASSED for local private-beta evidence  
Machine scope: local workspace  
Real browsing data used: No  
Secrets printed: No
Source state verified: v0.64 changes in this commit

### Unified Preflight

Command:

```bash
node tools/preflight.js --runtime --screenshots
```

Result:

```text
PASS secret scan checked 96 tracked files
26 smoke tests passed
PASS issue form smoke checked 2 forms
PASS Chrome runtime loaded extension and exercised organize/chat/dashboard apply/tab move/tab focus
PASS UI screenshots captured
PASS release package verified for v0.1.0
PASS preflight completed
```

Evidence notes:

- This preflight run did not call DeepSeek classification and did not read real browser tabs.
- `--runtime` used a temporary Chrome for Testing profile with synthetic tabs and verified real native tab groups.
- `--screenshots` generated mock-data UI screenshots and did not read real browser tabs or `.env.local`.
- Runtime smoke can still `SKIP` on branded Google Chrome CLI extension loading, but this run auto-detected Chrome for Testing through Playwright and passed.
- Release package verifier checks required extension files and rejects `.env*`, source maps, `node_modules`, `.DS_Store`, `__MACOSX`, and `.git` metadata.

### DeepSeek / OpenAI-Compatible Provider

Command:

```bash
node tools/deepseek_smoke_test.js
node tools/deepseek_smoke_test.js --classify-fixture
```

Result:

```text
PASS DeepSeek/OpenAI-compatible /models reachable
baseUrl=https://api.deepseek.com
configuredModel=deepseek-v4-flash
modelAvailable=yes
modelCount=2
SKIP synthetic classification fixture; pass --classify-fixture to test chat/completions with fake tabs.
PASS DeepSeek/OpenAI-compatible /models reachable
baseUrl=https://api.deepseek.com
configuredModel=deepseek-v4-flash
modelAvailable=yes
modelCount=2
PASS synthetic classification fixture completed
fixtureGroupCount=2
fixtureAssignedTabs=3
```

Evidence notes:

- `.env.local` was used locally but not printed.
- The default `/models` check sends no tab data.
- The synthetic classification fixture used fake tabs only and did not use real browser data.
- The extension private beta only permits `https://api.deepseek.com/*`; other OpenAI-compatible hosts require later permission confirmation.

### Extension Smoke Test

Command:

```bash
node tools/extension_smoke_test.js
```

Result:

```text
26 smoke tests passed
```

Covered:

- MV3 manifest one-click action guardrails.
- Narrow permissions and no `default_popup`.
- English/Chinese locale parity.
- Permission explanation alignment.
- Dashboard workbench HTML prototype structure guard.
- Dashboard filter chips filter All / AI groups / Rule groups and expose localized empty state copy.
- Dashboard tab title focus guard: localized title button, background action, active-tab update, window focus, and no tab close action.
- Dashboard same-window tab move guard: target group selection, background action, same-window enforcement, and no tab close action.
- Dashboard simple MVP UI guard: no default P1 placeholders, advanced Settings folded.
- AI host guardrail aligned with manifest host permission.
- Redacted local error logs.
- Count-only duplicate safety audit.
- Sensitive current-tab summary confirmation before visible text extraction.
- Current run snapshot privacy boundary: no restore URL, raw/full URL, URL hash, query token, or page text in stored UI state.
- Undo snapshot minimization: only IDs, window, index, and group fields needed to restore grouping.
- Redacted diagnostics and beta feedback template.
- Chat Refine parser and user-rule priority.
- Duplicate safety policy.
- AI output validation.
- AI classification request minimization: no full URL, restore URL, query token, or page text in provider payload.
- AI classification timeout aborts the provider request and falls back to local rules.
- AI connection and classification fetches carry abort signals.
- AI classification status visibility in sidebar and dashboard, including suggested AI group count.
- Dashboard expanded Smart Group cards and local tab-row rendering from sanitized run data.
- Dashboard Settings first screen shows AI Classification and Privacy Defaults; permission, diagnostics, and local reset controls remain available under advanced folded sections.
- AI connection test without tab data.
- Dashboard rule deletion confirmation.
- Dashboard scoped AI key clearing.
- Local data deletion.
- Disposable manual QA checklist includes AI status and sensitive-summary confirmation checks.

### Chrome Runtime Smoke

Command:

```bash
node tools/chrome_runtime_smoke_test.js
```

Result:

```text
Loaded extension <temporary-extension-id>
Opened extension page chrome-extension://<temporary-extension-id>/sidepanel.html
PASS Chrome runtime loaded extension and exercised organize/chat/dashboard apply/tab move/tab focus
```

Evidence notes:

- The script used a temporary Chrome for Testing profile and a copied unpacked extension directory.
- Test tabs were synthetic QA URLs only.
- It verified organize, Chat Refine, Dashboard title/color apply, Dashboard same-window tab move, and Dashboard tab focus against real Chrome native tab groups.
- It did not read the user's real Chrome profile or real browser tabs.

### Extension Package

Command:

```bash
node tools/package_extension.js
node tools/verify_release_package.js
```

Result:

```text
dist/tabmosaic-ai-extension-v0.1.0.zip generated
dist/tabmosaic-ai-extension-v0.1.0.sha256 generated
dist/tabmosaic-ai-extension-v0.1.0.package.json generated
PASS release package verified for v0.1.0
sha256=91b85b278ad03298c66525399930467846932984f50b700cdb03449ddfdf7688
```

Evidence notes:

- `.env.local` is ignored by git.
- `.env.local` is not included in the extension zip.
- Package manifest safety flags state `includesEnvFiles=false`, `includesSourceMaps=false`, and `includesNodeModules=false`.
- Repeated package generation produced the same package checksum after unchanged icon writes and zip extra attributes were removed.
- `dist/` is ignored because the zip is regenerable from source.

### UI Screenshot Capture

Command:

```bash
node tools/capture_ui_screenshots.js
```

Result:

```text
PASS UI screenshots captured
artifacts/ui-screenshots/sidepanel-result.png
artifacts/ui-screenshots/sidepanel-result-zh.png
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-mobile.png
artifacts/ui-screenshots/dashboard-ai-settings.png
```

Evidence notes:

- Screenshots use mock extension data only, including Dashboard desktop, mobile, and AI Settings views.
- The script does not read real browser tabs.
- The script does not read `.env.local`.
- `artifacts/` is ignored by git because screenshots are reproducible local evidence.
- Screenshot capture is visual QA only and does not prove real Chrome native tab groups were created.

## Remaining Evidence Gaps

- P0 manual QA runbook has not been run against the user's real Chrome profile.
- Chrome Web Store submission materials remain drafts marked `CONFIRM` / `DO NOT SUBMIT YET`.
- Public privacy policy URL, support email, final brand/domain, and final store disclosures still need user confirmation.
