# Feature Spec: Monica Reference, AI Browser Layer Feature List, and Commercial Model

Status: DRAFT / REVIEW WITH USER  
Date: 2026-06-13  
Owner: Product + UX + Technical Architecture  
Implementation status: DO NOT IMPLEMENT LOGIN / HOSTED CLOUD / BILLING UNTIL CONFIRMED

Related:

- `01_PRODUCT/01_PRD.md`
- `01_PRODUCT/07_OPEN_SOURCE_BYOK_STRATEGY.md`
- `02_FEATURE_SPECS/04_SIDEBAR_AGENT.md`
- `02_FEATURE_SPECS/05_DASHBOARD.md`
- `02_FEATURE_SPECS/06_TAB_CHAT.md`
- `02_FEATURE_SPECS/10_PAYWALL_BILLING.md`
- `02_FEATURE_SPECS/11_PRIVACY_CONTROLS.md`
- `02_FEATURE_SPECS/12_AGENTIC_CLASSIFICATION_AND_CONTEXT_TOOLS.md`
- `02_FEATURE_SPECS/13_BROWSER_WORK_AGENT_SEARCH_DASHBOARD_SKILLS.md`
- `04_TECH/05_AI_PROVIDER_STRATEGY.md`
- `04_TECH/07_SECURITY_PRIVACY_IMPLEMENTATION.md`

## 1. Executive Summary

Monica is a useful reference because it has already trained users to expect an AI assistant that works across webpages: chat, read, search, write, translate, summarize, upload files, use multiple models, and run agent-like research workflows.

TabMosaic should learn from that surface area without becoming a crowded all-in-one AI toolbox.

The product direction should be:

```text
Open-source AI browser layer for Chrome:
Smart tab/workspace organization first,
then a context-aware Browser Work Agent for pages, tabs, groups, search, todos, collections, and safe browser actions.
```

The commercial direction should be:

```text
Mode A: Open-source self-use / BYOK / local-first
No login required. User configures their own model/API key or local model.

Mode B: Optional logged-in cloud plan
User signs in. TabMosaic provides hosted model routing, search, memory/sync, usage/billing, and a low-configuration Pro experience.
```

This spec is not approval to build cloud login, billing, cloud memory, or hosted AI. Those remain confirmation-gated.

## 2. Monica Research Summary

Sources used:

- Monica homepage: `https://monica.im/`
- Monica help / quick start: `https://monica.im/help/`
- Monica Read feature: `https://monica.im/help/Features/Read`
- Monica Write feature: `https://monica.im/help/Features/Write`
- Monica Agent feature: `https://monica.im/help/Features/AI-Agent/Monica_Agent`
- Monica Memo feature: `https://monica.im/help/Features/Memo`
- Monica Smart Fill feature: `https://monica.im/help/Web_Tool/Smart_Fill`
- Monica pricing page: `https://monica.im/pricing`
- Chrome Web Store Limited Use policy: `https://developer.chrome.com/docs/webstore/program-policies/limited-use`

Observed Monica capability groups:

| Monica area | What it does | Relevance to TabMosaic |
|---|---|---|
| AI sidebar | AI entry on any webpage | Borrow the always-available browser-side experience |
| Smart toolbar / selected text | Explain, translate, summarize, rewrite selected text | Borrow, but keep low-clutter and context-based |
| Read | Summarize/chat with webpages, URLs, PDFs, images, screenshots | Borrow for current page, selected region, PDF/image later |
| Search / Search Agent | Search web, synthesize sources, answer with references | Borrow as internal agent tool, not Dashboard UI |
| Write / Writing Agent | Draft, rewrite, reply, generate outline/document, search web during writing | Borrow selected workflows for office users |
| Translate | Webpage/text translation | P1 optional; not central to tab/workspace value |
| YouTube/email/search enhancements | Host-specific AI buttons | Borrow carefully; each host permission must be deliberate |
| Memo | Save webpages, chats, images, PDFs into AI knowledge base | Borrow as local-first Collections/Memory, cloud opt-in |
| Smart Fill | AI-assisted table/data tasks | Borrow as later workflow for extraction/comparison |
| Bots / skills | User-created bots and reusable capabilities | Borrow as reviewed built-in workflows first; marketplace later |
| Multi-model hub | One subscription to multiple models | Borrow for hosted cloud plan; keep BYOK open-source mode |
| Art/image/video generation | Generate and edit media | Not core to AI browser layer; do not build now |
| Desktop/mobile apps | Cross-platform AI assistant | Not extension MVP |

## 3. Product Filter

Every Monica-inspired feature must pass this filter before entering TabMosaic:

```text
1. Does it make Chrome feel like an AI browser for work, not a generic chatbot?
2. Does it use real browser context: current page, selected region, tabs, groups, links, screenshots, files, or workspace?
3. Does it strengthen Smart Organize, Sidebar Agent, Dashboard Workbench, or BYOK/open-source trust?
4. Can it be done with explicit user intent and clear privacy boundaries?
5. Can it stay simple enough that first-time users understand what to do?
6. Can risky browser actions be previewed, confirmed, applied, and undone?
7. Does it create a clear free/BYOK vs hosted cloud paid boundary?
```

If a feature fails this filter, it should not enter MVP even if Monica has it.

## 4. Feature Decision Matrix

| Reference capability | User pain | TabMosaic decision | Phase | Reason |
|---|---|---|---|---|
| AI sidebar on any page | "I want AI beside the page I am using." | Build | P0 / ongoing | Already core Sidebar Agent direction |
| Current page read/Q&A | "What is on this page?" | Build | P0 | Core AI browser feeling |
| Selected text quick action | "Explain this paragraph without copy/paste." | Borrow | P1 | Valuable, but should not clutter page UI |
| Page region / element selection | "Only analyze this block/table." | Build | P1 beta | Confirmed by user; strong Tabbit-like value |
| PDF chat | "Understand a PDF in the browser." | Borrow | P1 | Office/work use case, but needs parser and permissions |
| Image/screenshot chat | "Ask about what I see." | Borrow | P0.5/P1 | User confirmed cropped screenshot context |
| YouTube summary | "Summarize long videos." | Borrow | P1 | Useful but host-specific; not P0 |
| Web search agent | "Find external sources for this task." | Build | P0.5/P1 | Internal Tavily-style agent tool, not Dashboard search UI |
| Search enhance on Google | "Answer search queries faster." | Borrow only | P2 | Optional overlay; easy to feel spammy |
| Writing/reply assistant | "Draft based on page context." | Build narrow workflows | P1 | High office value: emails, PR replies, research notes |
| Translate any page | "Read foreign-language pages." | Borrow | P1/P2 | Useful, but not core organizing/workflow moat |
| Memo/knowledge base | "Save useful browser work." | Build as Collections/Memory | P1 | Core Dashboard Workbench value |
| Smart Fill/table work | "Extract and compare structured info." | Borrow | P1/P2 | Good workflow, not first slice |
| Bot platform | "Create reusable assistants." | Borrow concept | P2 | Start with built-in reviewed workflows |
| Skills marketplace | "Use community workflows." | Do not build yet | P2/CONFIRM | Security/license/privacy risk |
| Multi-model subscription | "I do not want to configure keys." | Build as hosted cloud option | P1/CONFIRM | Commercial plan value |
| Image/video generation | "Generate creative media." | Do not build now | P2/no default | Not core AI browser layer |
| Unrestricted Auto Agent | "Do work automatically." | Do not build yet | P2/blocked | Too risky in extension without hard gates |
| Desktop/mobile apps | "Use it everywhere." | Do not build now | Later | Extension-first focus |

## 5. Full TabMosaic Feature List

### 5.1 Core Tab Workspace

Goal:

```text
Make the visible browser tab bar clean and useful in one click.
```

Features:

- Smart Organize from compact extension menu.
- Real Chrome native tab groups.
- Task/project/intent-first classification, not domain-first grouping.
- Safe exact/tracking duplicate cleanup.
- Duplicate Review Center for uncertain cases.
- Undo for group operations.
- Restore for closed duplicates.
- Basic vertical tabs entry.
- Local user rules for recurring classification corrections.

Commercial boundary:

- Free/open-source core.
- Hosted AI may improve classification quality, but local/BYOK must remain usable.

### 5.2 Sidebar Browser Agent

Goal:

```text
Make the sidebar feel like the AI control layer for the current browser context.
```

Features:

- ChatGPT/Notion-like message stream.
- Current context shown in the composer: current tab, selected tabs, group, workspace, or region.
- Current page chat and summary.
- Follow-up questions stay attached to the active context.
- Page region / selected block context.
- Selected tabs / current group chat with capped visible-text reading.
- Tool cards for reading, search, saving, todos, and action plans.
- Quick message chips below assistant messages for likely next actions.
- Action drafts with Apply / Cancel / Undo.

Commercial boundary:

- Current-tab chat should exist in free/BYOK.
- Larger multi-tab/group/workspace chat can be paid in hosted mode, while BYOK users pay their own provider cost.

### 5.3 Browser Work Agent Tools

Goal:

```text
Give the agent a small, understandable set of tools that solve real browser work.
```

MVP/P1 tool list:

| Tool | Purpose | Data boundary |
|---|---|---|
| `read_current_page` | Answer from visible current page text | User-triggered, session/current chat |
| `read_selected_tabs` | Answer from selected tabs/group | User-triggered, capped pages, session-only unless saved |
| `select_page_region` | Use a selected DOM block/region | User-triggered, region-only |
| `capture_region_screenshot` | Add visual context for selected region | User-triggered, region crop, session-only |
| `search_open_tabs` | Find open tabs by metadata/content already read | Local |
| `search_web_provider` | Tavily-style external search | Sends search query to configured provider |
| `ingest_link` | Understand a pasted URL | User-provided link; fetch requires disclosure |
| `create_todo` | Make browser-linked tasks | Local first |
| `save_collection` | Save selected tabs/results/context | Local first; cloud opt-in later |
| `apply_group_plan` | Move/rename/group tabs | Preview + Apply + Undo |
| `open_tab` | Open selected link/result | User action |
| `close_duplicate_tabs` | Close safe duplicates | Policy-validated + Restore |

Not MVP:

- Generic unrestricted browser automation.
- Background reading all tabs/history.
- Auto-submit forms, emails, purchases, payments, or posts.
- Dynamic third-party skill execution inside extension runtime.

### 5.4 AI Browser Workflows

Goal:

```text
Use browser context to finish concrete office/knowledge-work jobs.
```

Recommended first workflows:

| Workflow | Input | Output | Phase |
|---|---|---|---|
| Research Brief | Selected tabs + optional web search | Short report with sources and next steps | P1 |
| Compare Tabs | 2-6 selected tabs/pages | Comparison table and recommendation | P1 |
| Page Explainer | Current page | Plain-language explanation and checklist | P0 |
| Extract Table / Facts | Selected region/page | Structured list or CSV-like table | P1 |
| Save Research Set | Tabs/search results | Local collection | P1 |
| Todo From Tabs | Tabs/group/page | Browser-linked todo list | P1 |
| Draft Reply | Current page/email/doc + instruction | Draft text only, never auto-send | P1 |
| GitHub PR Explain | PR page/tab group | Summary, risks, review checklist | P1 |
| SaaS Console Helper | Supabase/Vercel/Stripe-like pages | Explain settings/status and suggested checks | P1 |
| PDF/YouTube Summary | PDF/video page | Summary, chapters/key points | P1/P2 |

Design rule:

```text
Do not show a giant workflow catalog on day one.
Surface 2-4 context-aware suggestions based on what the user is looking at.
```

### 5.5 Dashboard Workbench

Goal:

```text
Dashboard becomes the calm place to review current browser work, not a dense settings page.
```

Default areas:

- Smart Groups board.
- Selected tabs handoff to Sidebar Agent.
- Duplicate Center folded by default.
- Work Queue / Todos.
- Collections / saved research sets.
- Pending Action Review.
- Rules & Memory.

Hidden or later:

- Raw provider settings in default UI.
- Full billing screens before hosted plan exists.
- Debug diagnostics.
- Workflow marketplace.
- Dense usage dashboards.

Commercial boundary:

- Dashboard inspection/editing of current groups stays free.
- Long-term workspace history, cross-device sync, cloud memory, usage/billing, and team areas are paid/hosted candidates.

### 5.6 Memory, Collections, and Sync

Goal:

```text
Let the product remember useful browser work without feeling like it is spying.
```

Local-first features:

- Save selected tabs as a collection.
- Save agent-produced summaries/research outputs by explicit user action.
- Save todos linked to tabs/pages.
- Save user rules and corrections.
- Session-only page content by default.

Cloud candidates:

- Account-level sync.
- Cross-device collections.
- Long-term workspace memory.
- Hosted embedding/search index.
- Team shared spaces.

Privacy rule:

```text
No cloud memory by default.
No background upload of browsing history.
No automatic persistent storage of raw page text without explicit opt-in.
```

### 5.7 Open-Source / BYOK Mode

Goal:

```text
Make the product useful and trustworthy even without paying TabMosaic.
```

Features:

- Full local extension source.
- Smart Organize and Sidebar core.
- Provider registry and OpenAI-compatible adapter.
- BYOK API key support.
- Local endpoint support for localhost OpenAI-compatible servers.
- Prompt/schema docs.
- Local privacy controls.
- Contribution guide and issue templates.

User promise:

```text
You can use the extension with your own model/API key.
You do not need a TabMosaic account for the local open-source product.
```

### 5.8 Hosted Cloud Mode

Goal:

```text
Give users a no-configuration AI browser experience when they do not want to manage API keys.
```

Features:

- Login/account.
- Hosted model routing.
- Hosted search provider.
- Usage ledger and credit/fair-use controls.
- Cloud sync for collections/todos/rules/workspaces.
- Optional long-term memory.
- Billing and subscription management.
- Better defaults for non-technical users.

Confirmation-gated:

- Account provider.
- What data is stored in cloud.
- What page content can be sent to hosted AI.
- Hosted free quota.
- Paid plan prices and limits.
- Analytics and usage event boundaries.

## 6. Commercial Model

### 6.1 Two-Mode Strategy

| Mode | User | Login | Model config | Storage | Monetization |
|---|---|---|---|---|---|
| Open-source self-use / BYOK | Developers, privacy-sensitive users, early community | Not required | User supplies API key/local endpoint | Local by default | Community growth, trust, SEO, optional support |
| Hosted cloud plan | Mainstream office users who want setup-free AI | Required | TabMosaic manages models/search | Cloud optional/plan-based | Subscription, credits, teams |

This resolves the tension between open source and commercial value:

```text
The local browser product is open and useful.
The paid product sells convenience, hosted compute, better model routing, sync, memory, and support.
```

### 6.2 Pricing Philosophy

Do not paywall the first aha moment.

Free users should experience:

- Smart Organize.
- Native groups.
- Safe duplicate cleanup.
- Sidebar explanation.
- Current-page chat with BYOK/local provider.
- Local collections/todos/rules.

Paid users should pay because:

- They do not want to configure API keys.
- Hosted models/search just work.
- They need more multi-tab research and bigger context.
- They want sync and long-term memory.
- They want reliable high-quality model routing.
- They need team/admin features later.

Do not promise unlimited top-model usage. Use fair-use language and clear usage counters.

### 6.3 Recommended Plan Draft

These are planning ranges, not final prices.

| Plan | Target | Price status | Included |
|---|---|---|---|
| Free / BYOK | Open-source users, first-time users | CONFIRM exact hosted quota | Local extension, Smart Organize, BYOK/local model, limited hosted trial credits if logged in |
| Plus Hosted | Daily office users | RECOMMENDED range: USD 12-20/month, exact price CONFIRM | Managed models, current-page AI, search, small multi-tab workflows, local/cloud collections, fair-use credits |
| Pro Hosted | Heavy researchers/builders | RECOMMENDED range: USD 29-79/month, exact price CONFIRM | Larger multi-tab research, longer context, stronger models, memory/projects, more credits, priority routing |
| Team | Small teams | DO NOT BUILD YET | Shared workspaces, admin, billing, team memory, compliance controls |

Plan principle:

```text
Free/BYOK should be good enough to trust and share.
Plus should be good enough for daily work.
Pro should be for heavy browser research and advanced agent workflows.
```

### 6.4 Usage and Cost Controls

Track usage by action type, not by sensitive browsing details.

Suggested metering units:

- Hosted chat request.
- Hosted current-page read.
- Hosted selected-tabs/group read.
- Hosted search request.
- Hosted research workflow.
- Hosted embedding/memory write.
- Hosted attachment/image processing.

Do not meter/store:

- Raw tab titles for analytics.
- Full URLs for analytics.
- Raw page text for analytics.
- Raw screenshots for analytics.

Cost guardrails:

- Prefer fast/cheap models for simple tasks.
- Route complex research to stronger models only when needed.
- Cap multi-tab reads by plan.
- Cap search depth by plan.
- Cache user-saved summaries only when opted in.
- Expose quota before hard failure.

### 6.5 Hosted Cloud Value Proposition

User-facing copy direction:

```text
Use TabMosaic locally with your own model, or sign in for hosted AI that just works.
Hosted plans include managed models, search, sync, memory, and higher limits.
```

Avoid:

```text
Unlimited top models.
We read all your tabs automatically.
Browser automation without review.
Cloud memory on by default.
```

## 7. Login and Cloud Data Boundary

Login is useful but not MVP-default.

Recommended cloud account objects:

| Object | Needed for | Storage default |
|---|---|---|
| User profile | Account/session | Cloud |
| Subscription | Billing/entitlement | Cloud |
| Usage ledger | Credits/fair-use | Cloud, no raw browsing data |
| Provider route config | Hosted model routing | Cloud |
| Collections | Cross-device saved context | Opt-in cloud |
| Todos | Cross-device work queue | Opt-in cloud |
| Rules | Cross-device preferences | Opt-in cloud |
| Workspace history | Restore/continue work | Opt-in cloud |
| Memory embeddings | Semantic recall | Opt-in cloud, derived sensitive data |
| Page raw text | Deep recall/debug | Avoid by default; explicit opt-in only |

Open-source local mode:

```text
No account required.
API keys stay local.
Page text is read only after user action.
Saved work is local unless user chooses cloud sync later.
```

Hosted mode:

```text
Account required.
Hosted model/search calls go through TabMosaic cloud.
User must see what data is sent for each context/tool category.
Cloud memory and workspace sync require explicit opt-in.
```

## 8. What Not To Build

Do not build these into MVP:

- Generic AI image/video generation suite.
- Public skill marketplace with dynamic third-party code.
- Always-on page watcher.
- Background browsing history agent.
- Unrestricted browser automation agent.
- Gmail/WhatsApp/social posting automation.
- Payment/purchase/form-submit automation.
- Dashboard search portal.
- Dense settings-first Dashboard.
- Cloud memory by default.

These could be explored later only after clear user demand, security review, permission review, and confirmation.

## 9. UX Principles

### 9.1 Sidebar

```text
Conversation first.
Current context visible in composer.
Tool activity appears as small assistant tool messages.
Actions appear as Apply / Cancel / Undo cards.
No dense panels.
No settings-heavy top area.
No generic feature catalog.
```

### 9.2 Dashboard

```text
Smart Groups + Work Queue + Collections.
Minimal glass UI.
No metrics wall.
No provider/debug clutter.
Search results appear only when saved or produced by an Agent workflow.
Billing appears only when hosted plan exists.
```

### 9.3 Page Surface

```text
Low-clutter selected text / region action.
No aggressive floating buttons everywhere.
Use context menu, composer controls, or a subtle mini-toolbar.
Host-specific buttons are opt-in and later.
```

## 10. Implementation Roadmap

### Slice 1: Browser Work Agent MVP

Build or polish:

- Current page chat quality.
- Selected region context UI inside composer.
- Search provider tool result rendering.
- Todo-from-tabs workflow.
- Save selected tabs/results as local collection.
- Dashboard Work Queue / Collections minimal view.

No login required.

### Slice 2: Hosted Cloud Design

Write before code:

- Account architecture.
- Hosted AI gateway architecture.
- Usage ledger design.
- Billing/plan entitlement model.
- Cloud data boundary and privacy copy.
- Free/Plus/Pro limits.

Requires confirmation.

### Slice 3: Hosted AI Gateway MVP

Only after confirmation:

- Optional sign-in.
- Hosted model route.
- Hosted search route.
- Basic credit usage counter.
- Hosted mode onboarding.
- User can switch between BYOK/local and hosted mode.

### Slice 4: Cloud Sync and Memory

Only after confirmation:

- Sync collections/todos/rules.
- Workspace history.
- Opt-in memory.
- Export/delete cloud data.
- Billing dashboard.

### Slice 5: Workflow Ecosystem

Only after confirmation:

- Built-in workflow gallery.
- Reviewed workflow adapter SDK.
- License/security review process.
- No unreviewed remote code execution in extension.

## 11. Acceptance Criteria

This spec is ready for implementation planning when:

- User confirms which Monica-inspired features enter near-term scope.
- User confirms whether optional login/cloud hosted plan is a P1 direction.
- User confirms the cloud data boundary.
- User confirms rough Free/Plus/Pro pricing and credit philosophy.
- User confirms whether cloud backend is fully open-source, separate-source, or private hosted service.
- Dashboard Workbench remains simple and not settings-first.
- Sidebar remains a chat/message interface, not an all-in-one control panel.
- Open-source/BYOK mode remains useful without login.

## 12. Decision Gates

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| D-044 | Monica-inspired feature boundary | Borrow browser-context, search, read, write, memo concepts; do not copy generic media/bot/toolbox sprawl | CONFIRM |
| D-045 | Optional login / hosted cloud plan | P0 local no-login remains; P1 optional login for hosted plan | CONFIRM |
| D-046 | Hosted AI gateway scope | Build only after cloud data boundary and pricing are confirmed | CONFIRM |
| D-047 | Free/Plus/Pro pricing and credits | Free/BYOK useful; hosted Plus/Pro sell convenience, search, memory, sync, higher limits | CONFIRM |
| D-048 | Cloud memory/sync defaults | Local-first; cloud memory/sync explicit opt-in | CONFIRM |
| D-049 | Account provider and payment stack | Decide later after architecture review | CONFIRM |
| D-050 | Command palette / selected-text toolbar scope | P1, subtle and context-first, not cluttered page UI | CONFIRM |
| D-051 | Host-specific integrations | PDF/YouTube first; Gmail/social automation later or not built | CONFIRM |
| D-052 | Skill/workflow ecosystem policy | Built-in reviewed workflows first; no dynamic third-party code in MVP | CONFIRM |
| D-053 | Hosted cloud source boundary | Local extension fully open-source; hosted backend boundary needs confirmation | CONFIRM |
| D-054 | Usage analytics for billing | Track action/credit counts without raw browsing content | CONFIRM |

## 13. Plain-Language Product Shape

What the user should feel:

```text
I installed this extension.
It cleaned my tabs into real groups.
I can ask the sidebar about the page I am on.
I can select a few tabs and ask it to compare or turn them into todos.
I can search the web through the agent when it needs outside sources.
I can save useful browser work into collections.
If I am technical or privacy-sensitive, I can use my own API key.
If I do not want setup, I can sign in and pay for hosted AI that just works.
```

That is the AI browser path. Not more buttons. Better browser work.
