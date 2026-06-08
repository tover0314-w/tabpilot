# QA Evidence

This file records concrete local verification evidence for private-beta readiness. It must not contain secrets, real browsing data, tab titles from the user's browser, full URLs from the user's browser, API keys, or private screenshots.

## 2026-06-09 Local Verification

Status: PASSED for local private-beta evidence  
Machine scope: local workspace  
Real browsing data used: No  
Secrets printed: No

### DeepSeek / OpenAI-Compatible Provider

Command:

```bash
node tools/deepseek_smoke_test.js --classify-fixture
```

Result:

```text
PASS DeepSeek/OpenAI-compatible /models reachable
configuredModel=deepseek-v4-flash
modelAvailable=yes
modelCount=2
PASS synthetic classification fixture completed
fixtureGroupCount=3
fixtureAssignedTabs=3
```

Evidence notes:

- `.env.local` was used locally but not printed.
- The default `/models` check sends no tab data.
- `--classify-fixture` sends only synthetic tabs defined in `tools/deepseek_smoke_test.js`.
- The fixture validated that the provider did not invent tab IDs.

### Extension Smoke Test

Command:

```bash
node tools/extension_smoke_test.js
```

Result:

```text
13 smoke tests passed
```

Covered:

- MV3 manifest one-click action guardrails.
- Narrow permissions and no `default_popup`.
- English/Chinese locale parity.
- Permission explanation alignment.
- Redacted local error logs.
- Count-only duplicate safety audit.
- Redacted diagnostics and beta feedback template.
- Chat Refine parser and user-rule priority.
- Duplicate safety policy.
- AI output validation.
- AI connection test without tab data.
- Local data deletion.

### Extension Package

Command:

```bash
node tools/package_extension.js
unzip -l dist/tabmosaic-ai-extension-v0.1.0.zip | rg '\.env'
```

Result:

```text
dist/tabmosaic-ai-extension-v0.1.0.zip generated
env_in_zip=no
```

Evidence notes:

- `.env.local` is ignored by git.
- `.env.local` is not included in the extension zip.
- `dist/` is ignored because the zip is reproducible from source.

## Remaining Evidence Gaps

- P0 manual QA runbook has not been run against the user's real Chrome profile.
- Chrome runtime automation still may `SKIP` on branded Google Chrome CLI extension loading.
- Chrome Web Store submission materials remain drafts marked `CONFIRM` / `DO NOT SUBMIT YET`.
- Public privacy policy URL, support email, final brand/domain, and final store disclosures still need user confirmation.
