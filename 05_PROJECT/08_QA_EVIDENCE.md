# QA Evidence

This file records concrete local verification evidence for private-beta readiness. It must not contain secrets, real browsing data, tab titles from the user's browser, full URLs from the user's browser, API keys, or private screenshots.

## 2026-06-09 Local Verification

Status: PASSED for local private-beta evidence  
Machine scope: local workspace  
Real browsing data used: No  
Secrets printed: No
Source commit verified: `76bdeb4` (`Clarify AI host limit in dashboard`)

### Unified Preflight

Command:

```bash
node tools/preflight.js
```

Result:

```text
PASS secret scan checked 93 tracked files
16 smoke tests passed
PASS issue form smoke checked 2 forms
PASS release package verified for v0.1.0
PASS preflight completed
```

Evidence notes:

- Default preflight did not call DeepSeek classification, did not read real browser tabs, and did not run Chrome runtime automation.
- Chrome runtime smoke remains optional because branded Google Chrome may `SKIP` CLI-loaded unpacked extensions.
- Release package verifier checks required extension files and rejects `.env*`, source maps, `node_modules`, `.DS_Store`, `__MACOSX`, and `.git` metadata.

### DeepSeek / OpenAI-Compatible Provider

Command:

```bash
node tools/deepseek_smoke_test.js
```

Result:

```text
PASS DeepSeek/OpenAI-compatible /models reachable
baseUrl=https://api.deepseek.com
configuredModel=deepseek-v4-flash
modelAvailable=yes
modelCount=2
SKIP synthetic classification fixture; pass --classify-fixture to test chat/completions with fake tabs.
```

Evidence notes:

- `.env.local` was used locally but not printed.
- The default `/models` check sends no tab data.
- The extension private beta only permits `https://api.deepseek.com/*`; other OpenAI-compatible hosts require later permission confirmation.
- `--classify-fixture` remains available when a synthetic `chat/completions` check is needed.

### Extension Smoke Test

Command:

```bash
node tools/extension_smoke_test.js
```

Result:

```text
16 smoke tests passed
```

Covered:

- MV3 manifest one-click action guardrails.
- Narrow permissions and no `default_popup`.
- English/Chinese locale parity.
- Permission explanation alignment.
- AI host guardrail aligned with manifest host permission.
- Redacted local error logs.
- Count-only duplicate safety audit.
- Redacted diagnostics and beta feedback template.
- Chat Refine parser and user-rule priority.
- Duplicate safety policy.
- AI output validation.
- AI classification request minimization: no full URL, restore URL, query token, or page text in provider payload.
- AI connection test without tab data.
- Dashboard rule deletion confirmation.
- Local data deletion.

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
sha256=241dbc6a412854847617796e311a169cbbe8d2d5a6e37a82142967d92c100d51
```

Evidence notes:

- `.env.local` is ignored by git.
- `.env.local` is not included in the extension zip.
- Package manifest safety flags state `includesEnvFiles=false`, `includesSourceMaps=false`, and `includesNodeModules=false`.
- `dist/` is ignored because the zip is reproducible from source.

## Remaining Evidence Gaps

- P0 manual QA runbook has not been run against the user's real Chrome profile.
- Chrome runtime automation still may `SKIP` on branded Google Chrome CLI extension loading.
- Chrome Web Store submission materials remain drafts marked `CONFIRM` / `DO NOT SUBMIT YET`.
- Public privacy policy URL, support email, final brand/domain, and final store disclosures still need user confirmation.
