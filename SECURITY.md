# Security Policy

TabMosaic AI handles browser-adjacent context, so security and privacy reports are high priority.

## Supported Status

Current public status:

```text
Source release: yes
Chrome Web Store launch: no
Hosted cloud service: no
```

The local extension is a controlled local/private beta. Please do not treat it as a Chrome Web Store production release yet.

## What To Report

Please report security issues involving:

- API keys, bearer tokens, or provider credentials leaking into logs, diagnostics, screenshots, issue templates, or release packages.
- Full URLs, page text, real tab titles, cookies, browser history, or profile data being collected or persisted unexpectedly.
- Page text being read without a user-triggered page/context question.
- Browser-changing Agent actions applying without user confirmation, except the confirmed Smart Organize pipeline.
- Broad Chrome host permissions or sensitive Chrome APIs being introduced without clear need.
- Unsafe duplicate closing, especially active, pinned, audible, protected, or non-duplicate tabs.
- Remote code execution or remotely hosted extension code paths.

## Privacy Baseline

Expected defaults:

- One-click organize is metadata-first.
- Page text is user-triggered only.
- Multi-tab text is capped, disclosed, and session-only.
- Full URLs are not sent to AI by default.
- BYOK API keys remain local.
- Diagnostics are redacted and copy-only.
- No browsing-activity analytics are shipped in the public source release.

Read [Privacy Architecture Explainer](04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md) for the full model.

## How To Report

For non-sensitive bugs, use GitHub issues.

For sensitive security reports, do not open a public issue with secrets, screenshots, full URLs, page text, or account data. Until a dedicated security contact is confirmed, open a minimal public issue saying that you have a private security report and include only:

```text
affected area
severity estimate
whether secrets or private browser data are involved
safe way to contact you
```

Do not paste exploit details or private data into the public issue.

## Development Checks

Before opening PRs that touch browser data, permissions, model calls, storage, diagnostics, or tab actions, run:

```bash
node tools/preflight.js
node tools/secret_scan.js
node tools/public_repo_audit.js
```

Optional runtime checks:

```bash
node tools/preflight.js --runtime
node tools/preflight.js --agent-flow
```

Do not run real-profile QA results into git. Use [the real-profile QA template](05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md), redact manually, and commit only sanitized evidence if needed.
