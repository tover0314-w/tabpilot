# Open Source + BYOK Strategy

Status: CONFIRMED BY USER for full open-source direction  
License: CONFIRM  
Last updated: 2026-06-12

## 1. Strategy Summary

TabMosaic AI should move from a closed-source commercial extension narrative to a full open-source, user-controlled AI browser layer narrative. The public repo should include the local extension source; license selection remains separate.

Core promise:

```text
Install an open-source Chrome extension.
Bring your own model or API key.
Turn your browser into an AI browser for tabs, pages, groups, and work context.
```

This does not remove the product's original aha moment. Smart Organize remains the first visible value: the user's real Chrome tab bar becomes clean native tab groups. Open source and BYOK make that value easier to trust, share, inspect, and adopt.

## 2. Why Open Source

Open source is a growth and trust strategy, not only a code distribution choice.

Expected benefits:

- Trust: users can inspect how tab metadata, page text, API keys, and AI calls are handled.
- SEO and community growth: GitHub, docs, examples, issues, and integrations can bring compounding search traffic.
- Developer adoption: indie developers and power users can configure models, improve prompts, add provider adapters, and share workflows.
- Lower AI cost at launch: BYOK shifts model cost to users who already have API keys or local model endpoints.
- Better privacy positioning: open source makes the privacy story more believable than a black-box browser extension.
- Faster learning: public issues and discussions can reveal real tab-management jobs and provider needs.

## 3. Positioning

Recommended public-facing positioning:

```text
TabMosaic AI is an open-source AI browser layer for Chrome.
It organizes your tabs into native Chrome groups, removes safe duplicates, and lets you chat with the current page, selected tabs, or work context using your own model.
```

Short variants:

```text
Open-source AI tab workspace for Chrome.
Bring your own model. Turn Chrome into an AI browser.
Smart tab groups, page chat, and browser context agent.
```

Avoid overclaiming:

```text
Do not imply TabMosaic replaces Chrome, controls the full browser, reads every page automatically, or runs unrestricted web actions.
```

## 4. Product Model

### Full Open Source Core

CONFIRMED BY USER:

```text
Full open-source local product:
- local Chrome extension
- Smart Organize
- native tab groups
- safe duplicate handling
- Undo / Restore
- Sidebar Agent basics
- current-page chat with user-triggered page reading
- selected-tabs / group chat with user-triggered visible-text reading
- content-assisted regrouping preview
- BYOK model configuration
- provider abstraction
- prompt / schema docs
- local rules and privacy controls

Potential paid hosted service layers:
- hosted AI credits
- cloud sync
- workspace history across devices
- long-term AI memory
- team workspaces
- managed provider routing
- priority templates and support
```

This is a full open-source product strategy. The local browser agent should not depend on a closed-source core module. Commercialization can still happen through optional hosted services, managed AI, sync, collaboration, support, and distribution, but the local extension source remains public once launched.

## 5. BYOK Model Strategy

BYOK means users can configure their own model provider instead of depending on TabMosaic-hosted AI.

Confirmed direction:

```text
Users should be able to configure their own model/API key.
The extension should keep an OpenAI-compatible provider abstraction.
DeepSeek remains the default private-beta provider for simple testing.
Custom HTTPS OpenAI-compatible provider hosts and http://localhost local model endpoints are enabled only through explicit provider-origin permission prompts.
```

Provider phases:

| Phase | Provider support | Status |
|---|---|---|
| P0 private beta | DeepSeek via OpenAI-compatible request format | Implemented / confirmed |
| P0 BYOK | User-configured OpenAI-compatible base URL, model, API key, inferred provider label | Implemented with explicit origin permission |
| P0 local endpoint | `http://localhost` OpenAI-compatible endpoints such as local model servers | Implemented as basic endpoint config; no model setup wizard yet |
| P1/Pro | Hosted TabMosaic AI gateway | Pro / later |
| P2 | Provider marketplace / shared configs | DO NOT BUILD YET |

Important implementation boundary:

```text
Supporting arbitrary provider base URLs may require Chrome host permission changes.
Do not silently add broad host permissions.
Use explicit provider configuration, host validation, and clear permission copy.
Remote provider Base URLs must use HTTPS. HTTP is allowed only for localhost model endpoints.
```

## 6. AI Browser Layer Scope

The open-source story should emphasize browser context, not a generic chatbot.

Good scope:

- organize all normal-window tabs by task/project/intent
- show and manage real Chrome native tab groups
- chat with the current tab after user-triggered page read
- chat with selected tabs / group after tool-card disclosure
- use selected page region as context
- propose browser-changing actions with Apply / Cancel
- keep Undo / Restore for tab operations
- let users choose model/provider

Out of scope for public claims:

- automatic background reading of all pages
- browser history agent by default
- unrestricted click/type/submit actions
- replacing Chrome's native tab strip or omnibox
- storing page memory in cloud by default

## 7. Community Growth Surface

Recommended repository content:

- clear README with install-from-source steps
- privacy architecture diagram
- BYOK provider setup guide
- DeepSeek / OpenAI / OpenRouter / Groq / Together / Mistral / xAI / Perplexity / Cerebras / Fireworks / DeepInfra / SiliconFlow / Kimi / MiniMax / DashScope preset notes
- OpenAI-compatible provider adapter guide
- local model endpoint guide for LM Studio and Ollama
- prompt/schema docs
- safety policy for tab actions
- contribution guide
- issue templates for provider requests, grouping-quality feedback, and UI bugs
- examples of rules: GitHub PR to Code Review, Supabase/Vercel/Stripe to Dev Tools, docs/articles to Reading

Current implementation status:

- `CONTRIBUTING.md` exists as the public repo contribution guide.
- `README.md` now opens with a public-facing open-source AI browser layer first screen, local testing commands, and current readiness status.
- `04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md` exists as the public privacy architecture explainer.
- `05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md` exists as a draft for landing page copy, demo storyboard, Product Hunt, Hacker News, X/Twitter, and SEO launch materials.
- `05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md` exists as the approval packet for license, public repo boundary, public identity, privacy URL, Chrome Web Store disclosures, BYOK public-build scope, Free/Pro boundary, analytics policy, real-profile QA, screenshots/demo, and beta ramp.
- `05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md` exists as the pre-public cleanup checklist for keep/exclude files, generated artifacts, raw archives, secret scan, real-profile QA notes, and public push review.
- `01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md` exists as the preliminary brand/domain risk scan; it flags the Chrome Web Store `Tab Mosaic` near-name conflict and keeps public brand/domain finalization confirmation-gated.
- `extension/provider_registry.js` exists as the shared BYOK provider registry for presets, known host labels, default DeepSeek host, and default AI settings.
- `tools/provider_registry_check.js` exists as the provider contribution verifier for Dashboard select coverage, BYOK guide coverage, manifest host permissions, HTTPS/localhost boundaries, and known host labels.
- `04_TECH/10_BYOK_PROVIDER_SETUP.md` now includes the provider preset contribution checklist.
- `CONTRIBUTING.md` now includes provider preset contribution rules for OpenAI-compatible providers and required checks.
- `.github/ISSUE_TEMPLATE/provider_request.yml` exists for provider preset/setup requests.
- `.github/ISSUE_TEMPLATE/grouping_quality.yml` exists for classification-quality feedback.
- `.github/ISSUE_TEMPLATE/ui_bug.yml` exists for Sidebar/Dashboard/toolbar UI issues.
- `tools/issue_form_smoke_test.js` validates private-beta and public issue forms for privacy redlines and required safety acknowledgements.

Recommended SEO / content topics:

- open-source AI tab manager
- Chrome AI browser extension
- organize Chrome tabs with AI
- BYOK AI browser
- chat with browser tabs
- AI tab groups for Chrome
- DeepSeek Chrome extension tab organizer

## 8. License Decision Gate

Open source is confirmed, but license is not.

Decision Gate: D-034-A Open Source License

Options to evaluate:

| License | Tradeoff |
|---|---|
| MIT | easiest adoption, weakest commercial protection |
| Apache-2.0 | permissive, includes explicit patent grant |
| AGPL-3.0 | stronger reciprocity, may reduce commercial adoption |
| Dual license | more control, more operational complexity; not recommended unless the user reopens the full-open-source decision |

Current recommendation:

```text
Use Apache-2.0 or MIT for fastest developer adoption unless the user wants stronger copyleft protection.
Do not add a LICENSE file until confirmed.
```

## 9. Open Questions

- Which license should the public repo use?
- Should hosted/pro features live in the same public repo as stubs or in a separate repo later?
- Which provider setup guides should get deeper step-by-step pages first: DeepSeek, OpenAI-compatible custom, OpenRouter, Groq, Together, xAI, Perplexity, Cerebras, Fireworks, DeepInfra, SiliconFlow, Kimi, MiniMax, DashScope, Ollama, LM Studio?
- Should local model support get a first-class onboarding wizard before hosted AI gateway?
- What public project name, GitHub repo description, and domain should be used, given the `Tab Mosaic` Chrome Web Store near-name conflict?

## 10. Acceptance Criteria

Docs are aligned when:

- PRD describes TabMosaic as an open-source AI browser layer for Chrome.
- README makes BYOK and open-source growth explicit.
- AI Provider Strategy treats user-configured models as a core direction.
- Privacy docs explain that BYOK does not remove data-minimization requirements.
- Commercial docs describe optional hosted services rather than a closed-source local core.
- Decisions file marks open source as confirmed and license as unresolved.
