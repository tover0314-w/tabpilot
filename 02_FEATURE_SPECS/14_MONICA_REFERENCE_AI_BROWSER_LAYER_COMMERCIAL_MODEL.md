# Feature Spec: Monica-Inspired AI Browser Layer

Status: DRAFT / REVIEW WITH USER
Date: 2026-06-14
Owner: Product + UX + Technical Architecture
Implementation status: IMPLEMENT LOCAL-FIRST SLICES ONLY; DO NOT IMPLEMENT LOGIN / HOSTED CLOUD / BILLING UNTIL CONFIRMED

Related:

- `01_PRODUCT/01_PRD.md`
- `01_PRODUCT/02_PRODUCT_STRATEGY.md`
- `01_PRODUCT/05_COMPETITOR_REFERENCE_NOTES.md`
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

Monica is useful as a reference because it has trained users to expect AI directly inside the browser: a sidebar on any page, current-page reading, web search, writing help, translation, selected-text quick actions, PDF/image/screenshot Q&A, memo/knowledge storage, multi-model access, and increasingly agentic research/browser automation.

TabMosaic should not copy Monica's all-in-one AI toolbox. The product should learn the browser-context patterns, then narrow them into a simpler promise:

```text
Install an open-source extension.
Use your own model or optional hosted AI.
Clean the browser into native groups.
Ask the browser work in front of you.
Turn pages, tabs, links, search results, and screenshots into todos, collections, drafts, summaries, and safe browser actions.
```

The immediate product correction is:

```text
Tab management is the entry point, not the whole product.
The durable product is a Browser Work Agent for Chrome.
```

## 2. Research Sources

Research date: 2026-06-14. Re-check before external launch or pricing decisions.

Official Monica sources reviewed:

- Monica homepage: `https://monica.im/`
- Monica Chrome Web Store listing: `https://chromewebstore.google.com/detail/monica-all-in-one-ai-assi/ofpnmcalabcbjgholdjcjblkibolbppb`
- Monica Quick Start: `https://monica.im/help/`
- Monica Agent: `https://monica.im/help/Features/AI-Agent/Monica_Agent`
- Monica Read: `https://monica.im/help/Features/Read`
- Monica Search: `https://monica.im/help/Features/Search`
- Monica Write: `https://monica.im/help/Features/Write`
- Monica Memo: `https://monica.im/help/Features/Memo`
- Monica Smart Fill: `https://monica.im/help/Web_Tool/Smart_Fill`
- Monica YouTube Summary: `https://monica.im/help/Features/Summarize/Summarize-YouTube-Video`
- Monica Bots: `https://monica.im/help/Features/Bots/Introduction`
- Monica Model Response Comparison: `https://monica.im/help/Features/Chat/Model_response_comparison`
- Monica Calendar skill: `https://monica.im/help/Features/Chat/Chatskill_bookcalendar`

## 3. Monica Capability Map

| Monica capability | Observed public behavior | What TabMosaic should learn | TabMosaic decision |
|---|---|---|---|
| Browser sidebar / shortcut | AI can be summoned on any webpage with shortcut/icon | AI must be available beside the current page | BUILD, already core |
| Read current page | Reads/summarizes current webpage and supports follow-up chat | Current-page chat is mandatory for AI browser feeling | BUILD, improve quality |
| Read link / URL | User can paste a URL for analysis | Link understanding should become explicit, not silent fetch | BUILD with disclosure |
| Chat with PDF | Upload PDF, summarize, cite referenced sections | PDF is high-value for office/research users | P1, not MVP blocker |
| Chat with image/screenshot | Image or screenshot can become chat context | Cropped screenshot/visual context is valuable | P1, user-triggered |
| Search Agent | AI decomposes query, searches, summarizes sources | Search should be an internal agent tool | BUILD as Tavily-style tool |
| Search engine enhancement | AI appears beside search results | Useful but page-clutter risk | P2 / optional |
| Deep Research | Breaks down questions, explores web, synthesizes report | Build bounded research briefs, not an autonomous crawler | P1 |
| Browser Operator | Navigates websites and handles repetitive workflows | Learn action gating; do not build unrestricted operator | DO NOT BUILD YET |
| Write / Compose / Reply | Drafts text with length, tone, format, language | Contextual writing is strong office value | P1 narrow workflows |
| Quick Reply in email | Host-specific summarization/reply button | High value, high permission/product risk | P2 / confirm |
| Translate | Page/text translation and parallel translation | Useful but not core moat | P1/P2 |
| Quick Actions on selected text | Explain/translate/rewrite selected text | Strong low-friction context capture | P1 subtle UI |
| Grammar check | Editor-adjacent writing improvement | Nice-to-have; may clutter page | P2 |
| Memo / knowledge base | Saves web summaries, PDFs, images, chats; can query saved knowledge | Collections and memory are Dashboard value | BUILD local-first |
| Smart Fill | Automates table classification/tagging/search/data extraction | Page-region/table extraction is highly relevant | P1 Smart Fill Lite |
| Bots / skills | Built-in/custom skills, uploads, persistent memory | Use reviewed prompt/skill templates first | BUILD curated templates; DO NOT BUILD marketplace in MVP |
| PowerUP / quick tool rail | Pins contextual tools to webpage side UI | Learn quick-entry icon UX without copying the toolbox | BUILD minimal rail |
| Model comparison | Ask multiple models and compare answers | Useful for trust, but costly/advanced | P2 / hosted or BYOK advanced |
| Calendar skill | Creates events from conversation/context | Workflow idea, but needs account/auth | P2 / confirm |
| Slides/artifacts/media | Generates slides, images, video, artifacts | Broadens too much | DO NOT BUILD NOW |
| Multi-platform apps | Desktop/mobile/messaging access | Not extension MVP | Later |

## 4. Product Filter

Every Monica-inspired feature must pass this filter before entering TabMosaic:

```text
1. Does it make ordinary Chrome feel more like an AI browser for work?
2. Does it use real browser context: current page, tabs, groups, selected text, selected region, link, file, screenshot, search result, todo, or collection?
3. Does it strengthen Smart Organize, Sidebar Agent, Dashboard Workbench, or BYOK/open-source trust?
4. Can it be triggered explicitly by the user instead of background surveillance?
5. Can it be explained in one assistant message or one compact tool card?
6. Can risky browser actions be previewed, confirmed, applied, undone, or restored?
7. Can it stay local-first unless the user explicitly chooses hosted/cloud behavior?
```

Reject or postpone anything that mainly adds a generic AI feature catalog.

## 5. Recommended Feature Set To Add

### 5.1 Context Picker And Quick Context Actions

Pain:

```text
Users do not want to remember commands like "select page region".
They want to tell the agent what object they mean: this page, this selected text, these tabs, this group, this link, this screenshot, this file.
```

Build:

- Composer `@` context picker.
- Available scopes: Current Page, Selected Text, Page Region, Selected Tabs, Current Group, Pasted Link, Search Web, Upload File, Screenshot.
- Each context row includes a small data boundary label:
  - `Visible text`
  - `Selected text only`
  - `Region only`
  - `6 tabs max`
  - `Query only`
  - `File stays local until sent`
- Context appears inside the composer top row, not as a detached panel.
- Existing buttons can collapse into the context picker once stable.

Priority:

```text
P1 / HIGH
```

Why Monica matters:

Monica's Quick Action and Read entry points reduce friction. TabMosaic should learn that, but keep the UI subtle and chat-first.

### 5.2 Read Anything, But Explicitly

Pain:

```text
The current product can answer a current page and selected tabs, but users expect an AI browser to understand links, PDFs, screenshots, and page sections too.
```

Build:

- Current page Q&A polish.
- Pasted link analysis:
  - First response: "I can save this link or fetch it if you want."
  - No silent fetch.
  - Fetch requires user action and provider/tool disclosure.
- PDF first slice:
  - User uploads or opens a browser PDF.
  - Extract text locally where possible.
  - Cite page/section anchors when possible.
  - Session-only unless user saves summary.
- Image/screenshot first slice:
  - User uploads image or captures selected region screenshot.
  - Text-only models receive OCR/metadata only.
  - Vision-capable provider use requires explicit UI label.
- Page region:
  - Existing region picker should move into context picker.
  - Keep region-only visible text/structure by default.

Priority:

```text
P1 / HIGH
```

Data boundary:

```text
No background page reading.
No full-page screenshot by default.
No persistent raw page/PDF/image text unless explicitly saved.
```

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Pasted URL detection renders a normal assistant message and does not fetch/open/summarize by default.
- `Fetch link` is explicit. It requests optional Chrome origin permission for the pasted link's site, fetches readable text with credentials omitted, and routes title/hostname/path/readable text through the Page Agent when a BYOK/provider config is usable.
- The fetched-link answer renders as a normal Markdown assistant message with compact source chips.
- Full URL, query/hash, cookies, form values, hidden DOM, browser history, raw linked-page text persistence, and cloud storage are excluded.
- Visible screenshot vision is explicit. It requires a vision-capable configured OpenAI-compatible provider, captures one current visible-tab screenshot after user action, compresses it in memory, sends it session-only with title/hostname metadata, and discards the image bytes.
- Visible screenshot decision brief is explicit. Screenshot decision prompts use `workflow: decision_brief`, render one normal Markdown assistant message with recommendation, criteria, tradeoffs, assumptions, missing information, and source notes, and expose Save memo / Research missing info only.

STILL PENDING:
- PDF read first slice.
- Uploaded image/file context first slice.
- Unified composer context chips for pasted links/files/screenshots.
- Real-profile QA for accepted optional origin permission prompts on pasted-link fetch.
```

### 5.3 Agent Search And Research Briefs

Pain:

```text
AI browser users want the agent to find outside sources, not just summarize open tabs.
```

Build:

- Tavily-style `search_web_provider` tool.
- Query decomposition:
  - User asks one research question.
  - Agent creates 2-5 subqueries.
  - Search tool runs bounded result count.
- Source answer:
  - Assistant gives a short answer first.
  - Then compact sources with title, hostname, snippet, save/todo actions.
- Research Brief workflow:
  - Inputs: current page, selected tabs, optional search.
  - Output: `Summary`, `Key Findings`, `Contradictions`, `Recommended Next Steps`, `Sources`.
- Save as Collection:
  - Saves sanitized source metadata and user-approved summary, not raw full URLs by default.

Priority:

```text
P1 / HIGH
```

Not build yet:

- Search engine result page overlay.
- Always-on trending news.
- Autonomous long web exploration without bounds.

### 5.4 Contextual Writing Agent

Pain:

```text
Office users do not only read pages. They need to reply, summarize for others, draft notes, turn research into messages, and write next steps.
```

Build narrow workflows:

| Workflow | Input | Output | Safety |
|---|---|---|---|
| Draft Reply | Current page/email/doc + instruction | Draft text | Copy/insert only after user click |
| Rewrite Selection | Selected text | Improved text | No page-wide read |
| Meeting/Project Update | Selected tabs/group | Brief update | Shows sources used |
| PR/Issue Comment Draft | GitHub/Linear/Jira page | Draft comment/checklist | Never auto-submit |
| Customer Follow-up Draft | CRM/email page | Draft follow-up | P2, host-specific confirmation |

Priority:

```text
P1 / MEDIUM-HIGH
```

UI:

- Appears as assistant message with Markdown draft.
- Actions: `Copy`, `Make shorter`, `More formal`, `Turn into todo`.
- Do not create a separate Write tab/page in MVP.

### 5.4-A Prompt / Skill Templates

Pain:

```text
Users need help knowing what the AI browser can do, but they should not face a giant feature catalog.
```

CONFIRMED BY USER: Prompt / Skill Templates are needed.

Build curated templates, not a dynamic marketplace:

| Template pack | First templates | Context |
|---|---|---|
| Cleanup | Smart Organize, Find Duplicates, Save Later, Protect Tabs | tabs/groups |
| Page Understanding | Explain Page, Summarize Page, Extract Checklist, Find Risks | current page/region |
| Research | Compare Tabs, Decision Brief, Research Brief, Search Missing Info | selected tabs/search/sources |
| Writing | Rewrite Selection, Draft Update, Draft Reply, Make Shorter/Formal | selected text/page |
| Review | Review PR, Explain Issue, Review Settings Page, Launch QA Checklist | site-skill current page |
| Translation | Translate Selection, Explain Simply, Bilingual Summary, Glossary | selected text/page/PDF |

Each template should include:

- required context;
- allowed tools;
- output format;
- data boundary label;
- blocked actions;
- whether Apply / Cancel is required.

Placement:

```text
Composer/context picker, assistant follow-up suggestions, or right-edge quick rail.
Do not add a Dashboard template wall in MVP.
```

Do not build yet:

- user-uploaded arbitrary scripts;
- third-party skill marketplace;
- skills that auto-submit forms or messages;
- calendar/email/social posting skills.

### 5.4-B Right-Edge Quick Access Rail

Pain:

```text
Users want a Monica-like quick entry beside the page, but TabMosaic must remain much simpler.
```

CONFIRMED BY USER: A Monica-style right-side icon entry pattern is acceptable.

Build:

- Slim right-edge icon rail on normal webpages.
- Icon-only controls with tooltips.
- Default visible icons:
  - Chat;
  - Read;
  - Region;
  - Translate;
  - Save.
- Overflow behind `More` if more actions are available.
- Opens Sidebar Agent or attaches a context chip to the composer.

Rules:

```text
No more than 4 visible icons by default.
No feature wall.
No background page read.
No silent screenshot.
No upload until the user submits the Sidebar request.
Hide on Chrome internal/restricted pages.
User can disable or hide it.
```

### 5.5 Local Memo, Collections, And Work Memory

Pain:

```text
Users organize and read things, but then lose the useful result.
```

Build:

- Local Collections:
  - Save selected tabs.
  - Save search sources.
  - Save pasted links.
  - Save current page summary by explicit action.
- Local Memo entries:
  - Saved assistant answer.
  - Saved current-page summary.
  - Saved research brief.
  - Saved table extraction.
- Tags:
  - User tags.
  - Suggested tags from group/project/workflow.
- Dashboard Memory view:
  - Default shows recent saved work.
  - Search saved work locally by title/host/tag/summary.
- Rule conversion:
  - If user repeatedly saves or moves similar pages, suggest a rule.

Priority:

```text
P1 / HIGH
```

Cloud boundary:

```text
Local by default.
Cloud sync/memory only after explicit hosted-mode confirmation.
```

Monica difference:

Monica can auto-save some generated knowledge into Memo. TabMosaic should start stricter: save only when the user clicks Save, except local non-sensitive rules/corrections already in product scope.

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Sidebar assistant answers can expose an explicit `Save memo` action.
- Supported first-slice sources: AI Agent answers, current-page answers, selected-tabs/current-group answers, Compare Selected Tabs, Research Brief, and fetched-link answers.
- Save writes `tabmosaic.savedMemos` locally only.
- The saved memo stores assistant answer Markdown, source/workflow label, suggested tags, provider label, `aiUsed`, minimized linked-tab metadata, and sanitized source metadata.
- It does not store raw page text, full URLs, query/hash, cookies, form values, hidden DOM, browser history, screenshots, search result bodies, or cloud data.
- Saved memos are searchable from Sidebar local Browser Work Search and can appear in Work Brief suggestions.
- Clear Local Data removes `tabmosaic.savedMemos`.

STILL PENDING:
- User-editable tags.
- Dashboard Memory view.
- Cloud sync / hosted memory.
- Save table extraction after Smart Fill Lite exists.
```

### 5.6 Smart Fill Lite: Tables And Structured Page Blocks

Pain:

```text
Many office pages contain tables: leads, feedback, issues, competitors, pricing, invoices, tasks. Users want extraction and classification, not only summaries.
```

Build:

- Page-region table detection.
- Extract visible rows/columns from selected region.
- Actions:
  - `Summarize table`
  - `Classify rows`
  - `Find risks`
  - `Turn rows into todos`
  - `Export Markdown table`
  - `Copy CSV`
- Optional search enrichment later:
  - For selected rows, search external info one-by-one only after confirmation.

Priority:

```text
P1 / MEDIUM
```

Do not build yet:

- Automatic multi-page table crawling.
- Background enrichment of all rows.
- CRM/sales automation without confirmation.

### 5.7 Host-Specific Workflows

Pain:

```text
Generic page summaries are useful, but great AI browser UX recognizes common work pages.
```

Build as site-skill hints and workflows:

| Host/page type | First useful workflow | Phase |
|---|---|---|
| GitHub PR | Explain changes, risks, review checklist | P1 |
| GitHub Issue / Linear / Jira | Summarize issue, extract blockers, make todo | P1 |
| Supabase/Vercel/Cloud console | Explain settings/status and safe checks | P1 |
| Google Docs/Notion docs | Summarize doc, draft update | P1 |
| YouTube | Transcript/timestamp summary if available | P1/P2 |
| PDF viewer | Summarize/cite pages | P1 |
| Gmail/Outlook | Summarize and draft reply | P2 / confirm |
| Calendar | Create event draft | P2 / confirm |

Rules:

```text
Host skills provide reading strategy and output format.
They must not leak repo/project IDs/full URLs in prompts unless user explicitly allows it.
They never auto-submit forms, replies, payments, posts, or approvals.
```

### 5.8 Multi-Model And Hosted Plan

Pain:

```text
BYOK is good for developers, but mainstream users do not want provider setup.
```

Build later:

- Hosted mode switch:
  - `Use my API key`
  - `Use TabMosaic hosted AI`
- Managed model routing:
  - Cheap model for simple tab metadata.
  - Strong model for research/page reasoning.
  - Vision model only for screenshot/image tasks.
- Optional model compare:
  - Advanced action: "Compare with another model".
  - Useful for high-stakes research, not default.
- Usage counters:
  - User sees credits/usage before hitting limits.

Priority:

```text
P1 design, P2 implementation after confirmation
```

Confirmation gates:

- Login provider.
- Hosted AI gateway.
- Billing provider.
- Pricing.
- Cloud data boundary.
- Usage analytics boundary.

## 6. What Not To Add From Monica

Do not build these in MVP:

- Generic image/video generation suite.
- One-stop Bot creation platform.
- Dynamic third-party skill marketplace.
- Public prompt marketplace.
- Search engine overlay by default.
- Always-on webpage watcher.
- Background history reader.
- Unrestricted Browser Operator.
- Auto form submission.
- Auto email/social posting.
- Auto purchases/payments.
- Slides/artifact builder.
- Desktop/mobile/messaging apps.

Reason:

```text
They either dilute the product, add heavy permissions, create security/privacy risk, or move away from the core "AI browser layer for work tabs" promise.
```

## 7. Proposed Agent Architecture

Use a bounded, context-first agent:

```text
User message
→ Context Picker / Context Resolver
→ Intent Router
→ Tool Planner
→ Local Tool Executor
→ AI Provider Call
→ Validator
→ Assistant Message
→ Optional Save / Apply / Undo
```

### 7.1 Tool Registry

| Tool | Phase | Reads | Writes | Requires confirmation |
|---|---|---|---|---|
| `read_current_page` | existing/P0 | current page visible text | no | sensitive pages |
| `read_selected_text` | P1 | selected text only | no | no |
| `select_page_region` | existing/P1 polish | selected DOM region | no | no |
| `capture_region_screenshot` | P1 | cropped screenshot | no | vision upload |
| `read_selected_tabs` | existing/P1 | up to capped visible pages | no | site access/sensitive |
| `fetch_user_link` | P1 | user-provided URL | no | yes |
| `read_pdf` | P1 | user-provided/open PDF text | no | if cloud parse |
| `search_web_provider` | existing/P1 polish | user query | no | provider setup |
| `extract_table_region` | P1 | selected table/region | no | no |
| `create_todo` | existing/P1 | selected context metadata/summary | local todo | no |
| `save_collection` | existing/P1 | selected metadata/summary | local collection | no |
| `save_memo` | P1 | user-approved assistant output | local memo | no |
| `draft_reply` | P1 | selected/context text | draft only | insert/send |
| `apply_group_plan` | existing/P1 | tab metadata | browser groups | Apply |
| `close_duplicate_tabs` | existing/P0 | duplicate metadata | closes safe tabs | policy/Restore |

### 7.2 State Model

Browser work objects:

```text
Tab
Group
PageContext
SelectedTextContext
RegionContext
ScreenshotContext
LinkContext
FileContext
SearchResult
Todo
Collection
Memo
ActionDraft
WorkflowRun
```

Storage defaults:

| Object | Default storage |
|---|---|
| Page text | session-only |
| Selected text | session-only unless saved |
| Screenshot bytes | session-only; do not persist by default |
| Search results | session-only unless saved |
| Todos | local |
| Collections | local |
| Memos | local |
| Rules | local |
| Cloud sync | opt-in only |

## 8. UX Spec

### 8.1 Sidebar

Default shape:

```text
[assistant message]
I can help with this browser context.

[composer context row]
Current tab · Supabase

[input]
Ask about this tab or your tabs...
[@] [screenshot/region] [send]
```

Context picker:

```text
@ Current page          Visible text after you ask
@ Selected text         Selection only
@ Page region           Click one area
@ Selected tabs         6 tabs max
@ Current group         6 tabs max
@ Search web            Query only
@ Link                  Fetch only after confirm
@ File                  Upload when selected
@ Screenshot            Region/screen image context
```

Assistant tool message:

```text
Using Search Web
Query only · 5 results · Not saved
```

Assistant answer:

```text
Short answer first.

Sources:
1. Title · hostname
2. Title · hostname

Actions: Save sources · Create todo · Draft update
```

### 8.2 Dashboard Workbench

Dashboard default areas:

```text
Work Queue
Collections
Smart Groups
Pending Actions
Rules & Memory
Settings
```

Keep hidden/collapsed:

- Raw provider settings.
- Diagnostics.
- Billing until hosted mode exists.
- Feature catalog.
- Search box as top-level dashboard feature.

### 8.3 Page Surface

Rules:

```text
No noisy floating toolbox.
Prefer composer context picker, extension context menu, and subtle selected-text bubble.
Host-specific buttons are off by default until confirmed.
```

## 9. Commercial Model

### 9.1 Two Modes

| Mode | User | Login | Model/search | Storage | Monetization |
|---|---|---|---|---|---|
| Open-source BYOK | Developers, privacy-sensitive users | No | User API key/local model | Local | Trust, community, support, optional hosted upsell |
| Hosted cloud | Mainstream office users | Yes | TabMosaic managed providers | Local + opt-in cloud | Subscription / credits |

### 9.2 Free / Plus / Pro Draft

This is planning only, not final pricing.

| Plan | Recommended value | Status |
|---|---|---|
| Free / BYOK | Smart Organize, native groups, safe dedupe, current-page chat, local todos/collections, user provider key | CONFIRM hosted trial quota |
| Plus Hosted | No setup, managed models/search, current-page chat, limited multi-tab research, sync-lite | CONFIRM |
| Pro Hosted | Larger research workflows, more context, memory/sync, higher search/model credits, model compare | CONFIRM |
| Team | Shared workspaces, admin, team memory | DO NOT BUILD YET |

### 9.3 Pricing Research Notes

Market context is tracked in `06_REFERENCES/04_COMPETITOR_PRICING_RESEARCH.md` and must be rechecked before any public pricing page. Current research direction:

- AI assistant/browser products monetize managed model access, larger context, research/search, vision/media, and convenience.
- Workspace/tab managers monetize saved workspaces, session backups, sync, templates, team collaboration, admin, and support.
- Tavily-style Search Tool is a variable-cost agent tool, not a dashboard search box. Hosted search needs credits, rate limits, and usage visibility.
- Open-source BYOK should stay useful enough to drive trust, GitHub stars, SEO, and community contributions.
- Hosted Plus should feel like "no setup AI for office users".
- Hosted Pro should feel like "deeper browser work across tabs and sessions", not merely more tab groups.

Do not publish final prices or quotas until D-047 is confirmed.

Metering units:

- Hosted chat request.
- Hosted current-page read.
- Hosted selected-tabs/group read.
- Hosted search request.
- Hosted research workflow.
- Hosted vision/screenshot/image request.
- Hosted memory write.

Do not meter/log raw sensitive content:

- Raw tab titles for analytics.
- Full URLs for analytics.
- Raw page text for analytics.
- Screenshot/image bytes for analytics.

## 10. Implementation Roadmap

### Slice A: Context Picker MVP

Scope:

- `@` context picker in Sidebar composer.
- Move Page Region into picker.
- Add Selected Text context.
- Keep Current Page / Selected Tabs / Current Group paths.
- Tool messages use consistent compact copy.

Acceptance:

- User can choose context without typed commands.
- No page text is read before the user submits.
- Screenshot test covers picker open state and selected context row.

Implementation status:

```text
FIRST SLICE DONE:
- Typing `@` inside the Sidebar composer opens the compact context picker.
- The `@` picker reuses the existing composer picker, filters context/tool/template entries, and stays inside the bottom chat composer surface.
- Selecting Current page, Selected text, Page region, Selected tabs/group, Search web, Decision brief, Save as todo, or a reviewed template inserts a natural prompt into the composer instead of immediately reading page text or calling AI.
- The existing `+` button remains a shortcut action entry for users who want direct flows.
- No new permissions, storage keys, file upload, screenshot upload, cloud memory, or background page reads were added.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-at-context-picker.png`.
```

### Slice B: Link/PDF/Screenshot Read MVP

Scope:

- Pasted link flow with `Fetch this link` confirmation.
- PDF text extraction first slice.
- Screenshot/region image context UI with provider capability detection.

Acceptance:

- Pasted links are not fetched silently.
- PDF answer includes page/section references when available.
- Screenshot bytes are not persisted by default.

Implementation status:

```text
FIRST SLICE PARTIALLY DONE:
- Pasted-link explicit fetch is implemented.
- Visible screenshot vision is implemented with provider capability detection and no screenshot persistence.
- Visible screenshot can now become a Decision Brief input through `workflow: decision_brief`.
- Visible screenshot can now become a Research Brief input through `workflow: research_brief`.
- PDF text extraction and uploaded image/file context remain pending.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-screenshot-research-brief.png`.
```

### Slice C: Search And Research Brief

Scope:

- Tavily-style provider polish.
- Query decomposition.
- Source cards in assistant response.
- Save sources to collection.
- Create todo from research result.
- Research Brief workflow from selected tabs + search.

Acceptance:

- Search sends user query only.
- Sources include hostname and snippet, not raw full stored URL by default.
- Research Brief output has findings, contradictions, next steps, sources.

Implementation status:

```text
FIRST SLICE DONE + POLISH + SAVED-SOURCE + VISIBLE-SCREENSHOT FIRST SLICES:
- Sidebar picker/template includes Research Brief for selected-tabs/current-group context.
- `workflow: research_brief` reuses the capped selected-tabs/current-group visible-text tool flow.
- The AI schema asks for findings, contradictions, gaps, next steps, and source notes, and explicitly blocks fake web-search claims when no search results are provided.
- Sidebar renders the result as one natural Markdown assistant message with compact source chips.
- Follow-up buttons can save a local memo, create a local Work Queue todo, or run the internal Search Tool for missing information after user click.
- Missing-info search now renders a session-only research addendum with provider summary, useful source signals, citations, and a privacy boundary.
- Query decomposition first slice is implemented: `Research missing info` decomposes gaps into up to 3 focused Search Tool queries, dedupes returned sources, and sends query text only.
- Saved-source input first slice is implemented: natural saved-source/memo/collection research prompts use only explicit local saved memos/collections and expose Save memo / Research missing info without tab-based todo.
- Explicit visible-screenshot research prompts route through `SUMMARIZE_VISIBLE_SCREENSHOT` with `workflow: research_brief`, use one current visible screenshot plus title/hostname metadata, and render findings, contradictions, gaps, recommendations, and source notes as one assistant Markdown message.
- Visible-screenshot research exposes Save memo and Research missing info, but no tab-based todo action in this first slice.
- No file/PDF/uploaded-image context, hidden DOM/off-screen page text, background crawl, source-page auto-open/crawl, new permissions, page mutation, or cloud storage was added. Screenshot context is limited to the explicit visible-screenshot vision workflow.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-research-brief.png`, `artifacts/ui-screenshots/sidepanel-research-addendum.png`, and `artifacts/ui-screenshots/sidepanel-screenshot-research-brief.png`.
```

### Slice C2: Decision Brief

Scope:

- Decision Brief workflow from selected tabs/current group, saved local sources, current-session search results, and explicit visible screenshots.
- Recommendation, decision criteria, source tradeoff table, assumptions, missing information, source notes, and next steps.
- Explicit Save memo, Create todo, and Research missing info follow-ups where the source type supports them.

Acceptance:

- Output is one Markdown assistant message, not a special dashboard-like report UI.
- Source rows reference only real readable selected/context tabs.
- Missing-info research uses the internal Search Tool only after user click.
- File/PDF context, background crawl, page mutation, and cloud storage remain out of scope.

Implementation status:

```text
FIRST SLICE DONE + SAVED-SOURCE + SEARCH-RESULT + VISIBLE-SCREENSHOT FIRST SLICES:
- Sidebar picker/template routes Decision Brief through `workflow: decision_brief`.
- The workflow reuses capped selected-tabs/current-group visible-text extraction and the same temporary site-access release path.
- AI output is schema-validated; invented source tab IDs are dropped.
- Follow-up buttons support local memo, local Work Queue todo for selected-tabs/current-group briefs, and internal missing-info search after explicit user click.
- Saved-source decision prompts route through `DRAFT_FROM_SAVED_SOURCES` and send only explicit local saved memo/collection excerpts.
- Search-result decision prompts and the Search card `Brief` action route through `DRAFT_FROM_SEARCH_RESULTS` and send only current-session title/hostname/path/snippet/source-label metadata.
- Visible-screenshot decision prompts route through `SUMMARIZE_VISIBLE_SCREENSHOT` with `workflow: decision_brief`, require a vision-capable model, and send only one compressed visible screenshot plus title/hostname metadata.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-decision-brief.png`.
- Saved-source screenshot evidence: `artifacts/ui-screenshots/sidepanel-saved-source-decision-brief.png`.
- Search-result screenshot evidence: `artifacts/ui-screenshots/sidepanel-search-results-decision-brief.png`.
- Visible-screenshot evidence: `artifacts/ui-screenshots/sidepanel-screenshot-decision-brief.png`.
```

### Slice C3: Webpage Understanding And Review Workflows

Scope:

- Current-page `review_page` workflow from the Sidebar Review page template or natural review/risk/next-step prompts.
- Page type, risks, open questions, review checklist, and safe next steps.
- Site-skill reading hints for GitHub PR/issues/CI, cloud settings consoles, project issues, design files, and collaboration docs.
- Explicit Save memo and Create todo follow-ups.

Acceptance:

- Output is one Markdown assistant message, not a special report panel.
- The workflow reuses the current-page visible-text Page Agent and sensitive-page confirmation path.
- Create todo stores a local Work Queue item from the derived review checklist only.
- No auto-submit, page mutation, approve/merge/deploy/delete/credential rotation, background crawl, full URL upload, file/PDF/screenshot context, or cloud memory.

Implementation status:

```text
FIRST SLICE DONE:
- Review page template routes through `workflow: review_page`.
- Natural current-page review/risk/next-step prompts infer the same workflow in background validation.
- AI output is schema-validated for page type, risks, open questions, review checklist, and next steps.
- Sidebar renders the result as one natural Markdown assistant message with source chips and Save memo / Create todo actions.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-page-review.png`.
```

### Slice D: Contextual Writing

Scope:

- Draft reply/update/comment from current page or selected context.
- Rewrite selected text.
- Copy action.
- No auto-submit.

Acceptance:

- Draft output is Markdown assistant text.
- Insert/send actions require separate confirmation or are not implemented.
- Host-specific email/social buttons remain off.

Implementation status:

```text
FIRST SLICE DONE + SELECTED-CONTEXT + MULTI-TAB + SAVED-SOURCE FIRST SLICE:
- Sidebar Draft response template routes current-page writing through `workflow: contextual_writing`.
- Natural current-page draft/reply/comment/update requests infer the same workflow.
- Sidebar Rewrite selection template routes highlighted text through `workflow: contextual_writing`.
- Natural selected-text rewrite/polish prompts and selected page-region draft/rewrite prompts infer the same workflow while staying copy-only.
- Sidebar Draft from tabs template and natural selected-tabs/current-group writing prompts route through the same `workflow: contextual_writing`.
- Natural saved-source/memo/collection writing prompts route through a dedicated saved-source writing Agent that uses only explicit local saved memos/collections and the configured OpenAI-compatible provider.
- Page Agent, multi-tab Page Agent, and saved-source writing output is schema-validated for copy-only draft text, purpose, audience, tone, copy notes, and source grounding.
- Sidebar renders the result as one normal Markdown assistant message with source chips plus explicit `Copy draft` and `Save memo` actions.
- `Copy draft` writes only the generated draft text to the clipboard after user click; it does not insert, submit, send, post, approve, merge, deploy, or mutate the page.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-contextual-writing.png`.
- Selected text screenshot evidence: `artifacts/ui-screenshots/sidepanel-selected-text-writing.png`.
- Selected-tabs/current-group screenshot evidence: `artifacts/ui-screenshots/sidepanel-context-tabs-writing.png`.
- Saved-source screenshot evidence: `artifacts/ui-screenshots/sidepanel-saved-source-writing.png`.

STILL PENDING:
- file/PDF/screenshot writing inputs;
- site-specific reply/comment adapters;
- any auto-insert or auto-submit flow, which remains DO NOT BUILD YET until separately confirmed.
```

### Slice D2: Prompt / Skill Templates And Quick Rail

Scope:

- Curated template registry.
- Template picker inside composer/context picker.
- Assistant follow-up suggestions from templates.
- Right-edge quick rail first slice: four visible icon-only entries for Chat / Read / Region / Save, with Translate behind More.
- No third-party skill code or marketplace.

Acceptance:

- User can start a useful workflow without memorizing commands.
- Quick rail opens Sidebar or attaches context; it does not silently read/upload page data.
- Rail has max 4 visible icons by default, a hide option, and no layout shift.
- Templates declare context, tool permissions, blocked actions, and output format.

### Slice E: Local Memo / Collections Upgrade

Scope:

- Save assistant answer as Memo. `IMPLEMENTED FIRST SLICE`
- Save research brief/fetched-link/current-page/compare answers. `IMPLEMENTED FIRST SLICE`
- Save table extraction. `PENDING SMART FILL LITE`
- Local tags and local search. `IMPLEMENTED FIRST SLICE`
- Dashboard Memory view. `PENDING`

Acceptance:

- Save is explicit.
- Page text is not persisted as raw content; the explicit memo stores the derived assistant answer only.
- Clear Local Data removes memos/collections.

### Slice F: Smart Fill Lite

Scope:

- Selected region table extraction.
- Classify/tag rows.
- Copy Markdown/CSV.
- Turn rows into todos.

Acceptance:

- Works only from selected region.
- Shows exact row/column count read.
- No external enrichment without a second confirmation.

Implementation status:

```text
FIRST SLICE DONE:
- Sidebar Smart Fill table template routes through `workflow: smart_fill_lite`.
- Natural selected-region/table extraction prompts infer the same workflow.
- The workflow reuses the user-click selected page-region tool; it reads selected-region visible text, safe link labels, list items, table headers/rows, and cropped screenshot metadata only.
- Page Agent output is schema-validated for table title, headers, rows, row classifications, row actions, Markdown table, CSV, and table notes.
- Sidebar renders the result as one Markdown assistant message with source chips and explicit `Copy table`, `Copy CSV`, `Create todo`, and `Save memo` actions.
- `Create todo` stores one local Work Queue checklist derived from extracted row actions.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-smart-fill-lite.png`.

STILL PENDING:
- richer column typing and row-editing UX;
- multi-row per-row todo creation/editor;
- external search enrichment;
- CRM/sales/table automation;
- any auto-fill or page mutation, which remains DO NOT BUILD YET until separately confirmed.
```

### Slice F2: Agent Safety Layer First Slice

CONFIRMED BY IMPLEMENTATION:

- Current-page, selected-text, selected-region, fetched-link, and selected-tabs/current-group Page Agent payloads include a `security` boundary.
- The boundary marks page text as untrusted source material, declares allowed tool permissions, declares blocked actions, and flags prompt-injection-like text.
- System prompts explicitly tell the model not to follow page-embedded instructions that ask for policy override, prompt/secret reveal, browser/page tool calls, form submission, page edits, tab changes, or settings changes.
- The validator blocks unsafe instruction-like model output before rendering a Sidebar message.
- Tool cards show compact `Allowed`, `Blocked`, and `Page text is untrusted` labels.
- No new permissions, automatic reads, analytics, screenshot upload, page mutation, or cloud storage were added.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-context-tabs.png`.

### Slice F3: Agent Run Transcript First Slice

CONFIRMED BY IMPLEMENTATION:

- Page Agent and selected-tabs answers show a compact `Run log` follow-up action.
- Clicking it renders a normal Markdown-style assistant message, not a separate dashboard/debug panel.
- The message shows request, context scope, provider, tools used, skipped-page reasons, privacy flags, safety notes, browser-change status, and Undo/Restore state.
- The transcript is capped local-only storage under `tabmosaic.agentRunTranscripts`.
- Transcript text is best-effort redacted and excluded from follow-up AI context.
- No raw page text, full URLs, screenshot bytes, hidden DOM, browser history, analytics, or cloud storage were added.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-run-transcript.png`.

### Slice F4: AI Triage First Slice

CONFIRMED BY IMPLEMENTATION:

- Organize-complete Sidebar assistant messages include a compact `Triage` section.
- The triage lists Workspace focus, Act now, Read later, Reference, Can close, and Needs review.
- It uses sanitized local run metadata only: tab titles, hostnames, paths, group names, active/protected state, duplicate-review counts, and safe-duplicate-close counts.
- It explicitly states that page text was not read.
- It exposes one explicit `Create todo` action and recognizes `make triage a todo` style commands.
- The todo follow-up writes one local `ai_triage` Work Queue item with at most 8 minimized linked-tab records and a metadata-only checklist.
- It does not create todos automatically, close non-duplicates, move tabs, call a provider/search tool, add a new storage key, mutate pages, or use cloud storage.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-ai-triage.png`.
- Todo screenshot evidence: `artifacts/ui-screenshots/sidepanel-ai-triage-todo.png`.

### Slice F5: Workspace Goal First Slice

CONFIRMED BY IMPLEMENTATION:

- Organize-complete triage now exposes one explicit `Set goal` follow-up action.
- The Sidebar recognizes natural commands such as `set goal: ...`, `my goal is ...`, `clear goal`, and `what is my goal`.
- The goal is stored locally under `tabmosaic.workspaceGoal` with sanitized text, source, timestamps, and a `metadataOnly` flag.
- Work Brief reads the saved goal first, puts it at the top of the next-action answer, and can match still-open tabs from local metadata.
- If no goal is saved, Sidebar can infer a likely local goal from extension-created Work Queue todos, saved memos, saved collections, saved workspace snapshots, Later tab states, and latest tab/group metadata.
- The inferred goal is shown as a suggestion only. It is not saved as memory unless the user explicitly says `set goal: ...`.
- This is a normal ChatGPT-style assistant message flow, not a separate dashboard panel.
- It does not read page text, full URLs, browser history, screenshots, provider/search output, cloud storage, or move/close tabs.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-workspace-goal.png`.
- Inferred goal screenshot evidence: `artifacts/ui-screenshots/sidepanel-workspace-inferred-goal.png`.
- Work Brief screenshot evidence: `artifacts/ui-screenshots/sidepanel-work-brief.png`.

### Slice F6: Dashboard Continue Strip First Slice

CONFIRMED BY IMPLEMENTATION:

- Dashboard renders a compact `Continue` strip only when local work signals exist.
- Signals include saved workspace goal, open Work Queue todos, saved Collections, Later tab states, saved workspace snapshots, and duplicate-review candidates.
- The strip stays above Smart Groups and does not restore the old Latest Result / Current Workspace metric card.
- Actions are intentionally narrow: ask Sidebar `what should I continue?`, focus a still-open task source, focus a Later tab, or open folded Duplicate Center.
- It does not read page text, full URLs, browser history, screenshots, AI/search provider output, cloud storage, or move/close tabs.
- Screenshot evidence: `artifacts/ui-screenshots/dashboard-continue.png`.

### Slice F6a: Sidebar Workspace Chat First Slice

CONFIRMED BY IMPLEMENTATION:

- Sidebar recognizes natural local-workspace prompts such as `summarize my workspace`, `show workspace todos`, `show saved sources`, and `review workspace risks`.
- The answer renders as one normal ChatGPT-style Markdown assistant message, not a dashboard panel or specialized metric card.
- The first slice uses only local workspace state: latest extension-created tab/group snapshot, saved workspace goal, local Work Queue, saved memos, saved collections, saved workspace snapshots, local tab states, and duplicate-review metadata.
- When no workspace goal is saved, it can show a likely goal inferred from local work artifacts and offer `set goal: ...` as a next prompt.
- It can show Open rows for still-open matching tabs only.
- It does not read page text, full URLs, Chrome history/bookmarks, screenshots, AI/search provider output, cloud storage, move/close/restore/reopen tabs, or mutate pages.
- Full historical workspace chat, full restore, cloud sync, embeddings, and cross-device memory remain confirmation-gated future work.

### Slice F7: Unified Composer Context Chips First Slice

CONFIRMED BY IMPLEMENTATION:

- Sidebar composer now shows the active scope and typed extra context/tool intent in one bottom composer surface.
- The active scope remains the primary label, such as `Current tab`, `Selected tabs`, or `Group`.
- Extra chips include pasted link, selected text, page region/Smart Fill, Agent Search, and template intent.
- Chips are preview-only UI; they do not fetch links, read text, start page-region selection, call providers, upload, write storage, or mutate tabs/pages.
- File/PDF and vision/screenshot-crop chips remain pending until attachment/provider/privacy boundaries are confirmed.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-composer-context-chips.png`.

### Slice G: Hosted Mode Design

Scope:

- Account architecture.
- Hosted AI/search gateway.
- Usage ledger.
- Billing model.
- Cloud data boundary.
- Privacy copy.

Acceptance:

- User confirms login/provider/payment/cloud boundaries before coding.

## 11. Acceptance Criteria For This Spec

This spec is ready for implementation planning when:

- User confirms D-044 Monica-inspired feature boundary.
- User confirms whether Context Picker is the next UX slice.
- User confirms whether PDF/uploaded-image/file context is P1 or later.
- User confirms whether writing workflows should enter P1.
- User confirms hosted cloud direction before any login/billing work.
- Sidebar remains chat-first and not a feature catalog.
- Dashboard remains Workbench-first and not settings/search-first.
- Open-source/BYOK mode remains useful without login.

## 12. Decision Gates

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| D-044 | Monica-inspired feature boundary | Borrow browser-context, search, read, write, memo, smart-fill concepts; do not copy generic media/bot/toolbox sprawl | CONFIRM |
| D-045 | Optional login / hosted cloud plan | P0 local no-login remains; P1/P2 optional login for hosted plan | CONFIRM |
| D-046 | Hosted AI gateway scope | Build only after cloud data boundary and pricing are confirmed | CONFIRM |
| D-047 | Free/Plus/Pro pricing and credits | Free/BYOK useful; hosted Plus/Pro sell convenience, search, memory, sync, higher limits | CONFIRM |
| D-048 | Cloud memory/sync defaults | Local-first; cloud memory/sync explicit opt-in | CONFIRM |
| D-049 | Account provider and payment stack | Decide later after architecture review | CONFIRM |
| D-050 | Command palette / selected-text toolbar scope | P1, subtle and context-first, not cluttered page UI | CONFIRM |
| D-051 | Host-specific integrations | PDF/YouTube/GitHub/issue/cloud-console first; Gmail/social/calendar later or not built | CONFIRM |
| D-052 | Skill/workflow ecosystem policy | Built-in reviewed prompt/skill templates first; no dynamic third-party code in MVP | CONFIRMED BY USER |
| D-053 | Hosted cloud source boundary | Local extension fully open-source; hosted backend boundary needs confirmation | CONFIRM |
| D-054 | Usage analytics for billing | Track action/credit counts without raw browsing content | CONFIRM |
| D-055 | PDF/image/screenshot provider boundary | Text extraction local where possible; vision upload only after provider capability and user action are clear | CONFIRM |
| D-056 | Context Picker priority | Make Context Picker the next UX/Agent implementation slice | RECOMMENDED |
| D-073 | Right-edge quick access rail | Monica-inspired minimal right-side icon rail; max 4 visible icons; no silent read/upload/action | CONFIRMED BY USER |

## 13. Plain-Language Product Shape

What the user should feel:

```text
I clicked once and Chrome cleaned itself into real groups.
The sidebar knows what page or tabs I mean.
I can ask about the current page, a selected region, selected tabs, a link, or a file.
If I need outside information, the agent searches with sources.
If something is useful, I can save it as a todo, collection, or memo.
If I want no setup, I can later sign in for hosted AI.
If I care about control, I can keep using my own API key locally.
```

That is the Monica lesson, translated into TabMosaic's product: less toolbox, more browser work.
