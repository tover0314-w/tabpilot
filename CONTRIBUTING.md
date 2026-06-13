# Contributing to TabMosaic AI

TabMosaic AI is moving toward a full open-source, bring-your-own-key Chrome extension. The goal is simple: make Chrome feel like an AI browser layer for native tab groups, page chat, and browser work context while keeping user control and privacy visible.

Thank you for helping. This repo handles sensitive browser-adjacent workflows, so contribution quality is measured by product value, reversibility, privacy, and testability.

## Project Status

- Full open-source direction is confirmed.
- The open-source license is not confirmed yet, so this repo intentionally has no `LICENSE` file.
- The local extension should remain inspectable and BYOK-friendly.
- Optional hosted services, sync, managed AI, and billing are future layers, not a closed-source local core.

Do not add a license file or change the public/commercial boundary without an explicit decision update.

## Before You Start

Read these first:

- `README.md`
- `AGENTS.md`
- `00_START_HERE/02_CONFIRMATION_PROTOCOL.md`
- `00_START_HERE/03_DECISIONS_TO_CONFIRM.md`
- `01_PRODUCT/07_OPEN_SOURCE_BYOK_STRATEGY.md`
- `04_TECH/10_BYOK_PROVIDER_SETUP.md`

If your change affects default scope, tab closing, page-content reading, AI provider permissions, analytics, paid limits, cloud storage, or licensing, treat it as a confirmation-gated product decision.

## Good First Contribution Areas

- Provider preset improvements for OpenAI-compatible services.
- Local model setup notes for Ollama, LM Studio, and similar tools.
- Safer grouping rules that classify by task, project, workflow, or intent instead of only by domain.
- UI fixes for Sidebar, Dashboard, toolbar menu, and provider settings.
- Prompt/schema validation improvements.
- Test coverage for privacy boundaries, Apply-gated actions, and synthetic tab workflows.
- Documentation examples using generic, synthetic tab data.

## Provider Preset Contributions

Provider presets are welcome, but they must stay inside the existing BYOK privacy and permission model.

Before opening a provider PR:

- Use only providers that support an OpenAI-compatible `chat/completions` request shape.
- Add provider metadata in `extension/provider_registry.js`.
- Add the Dashboard select option in `extension/dashboard.html`.
- Update `04_TECH/10_BYOK_PROVIDER_SETUP.md` with the preset row and official docs links.
- Do not add provider API keys, account IDs, private endpoints, SDK code, or remotely hosted code.
- Do not add required host permissions; provider origins must remain optional and user-triggered.
- Run `node tools/provider_registry_check.js` and `node tools/preflight.js`.

If the provider needs non-Bearer auth, a native-only API, browser-side SDK, custom response parsing, streaming-only behavior, or broader permissions, open a proposal first instead of adding it as a simple preset.

## Privacy Rules

Never commit or paste:

- API keys, bearer tokens, cookies, session IDs, or database connection strings.
- `.env.local`, `extension/private-beta-ai-settings.json`, or local provider secrets.
- Real full URLs, real tab titles, page text, emails, account names, or private screenshots.
- Browser history exports, user profile data, or private rule patterns.

Use synthetic examples such as:

```text
project docs
ticket tracker
meeting notes
local model provider
code review tabs
```

For screenshots, redact private workspace names, emails, full URLs, page content, and API settings before sharing.

## Local Development Checks

Run the default preflight before opening a PR:

```bash
node tools/preflight.js
```

Useful focused checks:

```bash
node tools/issue_form_smoke_test.js
node tools/extension_smoke_test.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/beta_readiness_check.js
```

Optional checks may require a local Chrome or provider configuration:

```bash
node tools/preflight.js --runtime
node tools/preflight.js --screenshots
node tools/deepseek_smoke_test.js --classify-fixture
```

Do not run tests against your real day-to-day Chrome profile unless you understand the QA guide and have removed private data from any notes you plan to commit.

## Pull Request Expectations

Keep PRs small and easy to review.

Every PR should explain:

- What changed.
- Why it improves the product.
- Which privacy or permission boundary is touched, if any.
- Which checks were run.
- Any decision that remains `CONFIRM`, `OPEN QUESTION`, or `DO NOT BUILD YET`.

For feature behavior changes, update the relevant harness docs:

- Product scope: `01_PRODUCT/`
- Feature specs: `02_FEATURE_SPECS/`
- UX: `03_UX/`
- Technical behavior: `04_TECH/`
- Launch or QA status: `05_PROJECT/`

## Issue Templates

Use the structured GitHub issue forms:

- Provider request: ask for a new BYOK provider preset or setup guide.
- Grouping quality: report where tab grouping felt wrong or too shallow.
- UI bug: report Sidebar, Dashboard, toolbar, or Settings problems.
- Beta bug / feedback: private-beta safety and product feedback.

All forms require privacy acknowledgements before submitting.

## Safety Bar

The product should feel helpful without being reckless.

- One-click organize should produce real Chrome native tab groups.
- Browser-changing AI actions should be proposed first and applied only after user action.
- Undo/Restore paths should remain visible for tab operations.
- Page text should be read only after a user-triggered page or context question.
- Multi-tab visible text should stay capped, disclosed, and session-only.
- Full URLs, page text, and secrets should not appear in diagnostics, issue templates, QA evidence, or tests.
