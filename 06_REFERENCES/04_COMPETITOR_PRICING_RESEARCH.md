# Competitor Pricing Research / 竞品定价调研

Status: RESEARCH
Research date: 2026-06-15
Owner: Product / Commercial Model

This document is market context only. It does not confirm TabMosaic AI pricing, credit limits, hosted AI scope, login, billing, or cloud storage. Final pricing remains blocked by decision gate D-047.

## 1. Research Question

TabMosaic AI is moving toward:

- full open source core extension
- BYOK and local model support
- optional hosted AI / search / sync / memory later
- "AI Browser Layer for Chrome" positioning

The pricing question is not "how much should tab grouping cost?" The real question is:

```text
What should remain free and open-source,
and what hosted convenience is valuable enough to charge for without weakening trust?
```

## 2. High-level Findings

- AI assistant/browser products usually charge for managed model access, larger context, advanced research, media/vision, and convenience rather than for the basic browser UI alone.
- Workspace/tab managers monetize around workspace history, session backup, sync, team collaboration, templates, admin, and support.
- Agent search tools are a direct variable cost. Tavily-style search must be metered separately from normal local tab management.
- Open-source BYOK should remain useful. If the free open-source version feels crippled, the project loses the growth advantage the user explicitly wants.
- Hosted plans should sell "no setup, managed search/model credits, sync/memory, higher limits, and support", not the first one-click organize aha moment.

## 3. Competitor Pricing Snapshot

Prices and plan names can change. Re-check official pricing pages before publishing a public pricing page.

| Product | Category | Observed pricing / packaging anchor | Lesson for TabMosaic AI | Source confidence |
|---|---|---|---|---|
| Monica | all-in-one AI assistant extension | Official pricing metadata exposes Pro / Pro plus / Unlimited style paid plans; exact price table was JS-rendered and should be manually rechecked. | Monica sells breadth: chat, read, write, translate, search, agent, media, memo. TabMosaic should borrow useful workflows but stay narrower and tab/work focused. | Medium for plan structure, low for exact price |
| Brave Leo | browser-native AI assistant | Official page presents a privacy-forward browser AI assistant; automated read showed free product metadata, not the full premium table. | Privacy/no-login language matters. TabMosaic should keep local/BYOK as a first-class mode. | Medium for positioning, low for exact price |
| Perplexity | AI search / assistant | Official pages were blocked by Cloudflare during automated read. Treat Pro/Max style pricing as requiring manual recheck. | Deep research and search-heavy workflows justify higher tiers because search/model cost is real. | Low until manual recheck |
| Sider | AI browser assistant extension | Official pricing page was blocked by Cloudflare during automated read. | Relevant for side-panel AI assistant packaging, but do not copy a broad toolbox. | Low until manual recheck |
| Merlin | AI browser assistant extension | Official pricing page was blocked by Cloudflare during automated read. | Relevant for extension distribution and prompt/tool template packaging; exact price needs manual recheck. | Low until manual recheck |
| MaxAI | AI browser assistant extension | Official pricing page did not expose stable price text to the automated reader. | Useful as "AI assistant extension" packaging reference, not as a trusted price anchor yet. | Low |
| Workona | workspace/tab manager | Official page says Workona is free with upgraded plans; visible tiers include Pro, Team, and Enterprise, with workspace/session/team features. | Workspace value is a paid retention surface: saved workspaces, templates, backups, sync, team workflows. | High for plan structure, low for exact price |
| SigmaOS | AI/work browser | Official page confirms work-browser positioning; no stable pricing table was extracted in this pass. | Good reference for tabs-as-tasks and workspace UX, less useful for Chrome-extension pricing. | Medium for positioning |
| Tavily | agent search API | Official page data shows Researcher free tier, pay-as-you-go per credit, Project monthly plan, and Enterprise. | Search Tool is not free infrastructure. Hosted Search must have credits/rate limits and usage visibility. | High |
| Exa | agent/web search API | Official pricing page confirms API pricing and free offer metadata; exact plan text was heavily JS-rendered. | Search/research providers should be swappable; hosted search cost should be separated from model cost. | Medium |
| Brave Search API | search API | Official page describes large-scale web search API and flexible pricing; exact current package table was not reliably extracted in this pass. | Useful candidate provider/reference for search tool architecture; pricing needs manual recheck before choosing provider. | Medium |

## 4. Pricing Implications for TabMosaic AI

### 4.1 Keep Free / BYOK genuinely useful

Free open-source should include:

- Smart Organize
- native Chrome tab groups
- safe dedupe
- Undo / Restore
- current-page chat with user-provided model
- selected-tabs/group chat with user-provided model, within local implementation limits
- local todos and collections
- local settings and rules
- provider presets and local model endpoint support

Reason: the project needs GitHub trust, SEO, community adoption, and real daily utility before hosted monetization.

### 4.2 Hosted Plus should sell convenience

Recommended hosted Plus positioning:

```text
No setup AI for ordinary office users.
```

Potential Plus value:

- managed model key
- managed Search Tool quota
- current-page chat
- limited selected-tabs/group research
- light sync or backup, only after cloud privacy is confirmed
- usage dashboard
- support

Do not make Plus feel like "pay to use tab grouping".

### 4.3 Hosted Pro should sell heavier browser work

Recommended hosted Pro positioning:

```text
Turn tab chaos into research, summaries, saved work, and memory across sessions.
```

Potential Pro value:

- larger multi-tab / group / workspace context
- more hosted search and research workflows
- screenshot / image / PDF support after provider and upload boundaries are confirmed
- workspace history and restore
- memory and rules sync
- model compare / advanced routing
- export

### 4.4 Team remains later

Team plans should stay out of MVP unless the product has:

- account system
- cloud workspace model
- access control
- shared workspace permission model
- admin/billing support
- data deletion/export process

## 5. Recommended Packaging Draft

This is a packaging draft, not final pricing.

| Plan | Buyer | Core promise | What to include | Confirmation status |
|---|---|---|---|---|
| Free / Open-source BYOK | developers, privacy-sensitive users, early adopters | Make Chrome feel like an AI browser layer with your own model | local Smart Organize, sidebar agent, BYOK providers, local tasks/collections, privacy-first docs | CONFIRMED direction, exact limits CONFIRM |
| Plus Hosted | mainstream office users | AI works immediately, no model setup | managed model/search credits, current-page chat, light multi-tab research, usage dashboard | CONFIRM |
| Pro Hosted | heavy researchers, PMs, operators, creators | deeper browser work across tabs and sessions | higher credits, research workflows, vision/PDF after confirmation, memory/sync after confirmation | CONFIRM |
| Team | teams and companies | shared browser workspaces | shared workspaces, admin, templates, billing, team memory | DO NOT BUILD YET |

## 6. Metering Design Notes

Hosted billing should meter by work type, not by confusing internal tokens in the UI.

Recommended internal units:

- hosted chat request
- current-page read
- selected-tabs/group read
- Search Tool request
- research workflow
- vision/screenshot/image request
- PDF/file extraction request
- memory write
- cloud workspace sync/storage

User-facing copy should stay simple:

```text
This used 1 search credit.
This used page context.
This used screenshot context.
```

Never meter/log raw sensitive content for analytics:

- raw tab titles
- full URLs
- raw page text
- screenshot/image bytes
- chat contents

## 7. Pricing Guardrails

- Do not charge before the first aha moment.
- Do not hide Undo / Restore or safety features behind a paywall.
- Do not make local BYOK worse to push hosted subscriptions.
- Do not offer unlimited hosted search/vision/research without a fair-use policy.
- Do not publish exact pricing until hosted provider costs, D-047, D-054, and D-055 are confirmed.

## 8. Next Research Tasks

- Manually recheck Monica, Sider, Merlin, Perplexity, MaxAI, Brave Leo premium, and Brave Search API in an interactive browser before public pricing.
- Estimate hosted cost for one typical office user:
  - Smart Organize per day
  - current-page chat per day
  - selected-tabs/group research per week
  - search requests per week
  - screenshot/vision requests per week
- Interview users on whether they prefer:
  - BYOK only
  - hosted convenience
  - hybrid: free BYOK + paid hosted credits
  - lifetime deal with fair-use hosted credits

## 9. Sources Checked

- Monica pricing: https://monica.im/pricing
- Brave Leo: https://brave.com/leo/
- Perplexity Pro: https://www.perplexity.ai/pro
- Sider pricing: https://sider.ai/pricing
- Merlin pricing: https://www.getmerlin.in/pricing
- MaxAI pricing: https://www.maxai.me/pricing
- Workona pricing: https://workona.com/pricing/
- SigmaOS: https://sigmaos.com/
- Tavily pricing: https://www.tavily.com/pricing
- Exa pricing: https://exa.ai/pricing
- Brave Search API: https://brave.com/search/api/
