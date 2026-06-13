# Feature Spec: Browser Work Agent, Search, Dashboard Workbench, and Skill Reuse

Status: DRAFT / IMPLEMENTABLE FIRST SLICE  
Date: 2026-06-13  
Owner: Product + Technical Architecture + AI Prompt  
Related:

- `01_PRODUCT/01_PRD.md`
- `01_PRODUCT/06_AI_BROWSER_LAYER_PRD_REVIEW.md`
- `01_PRODUCT/07_OPEN_SOURCE_BYOK_STRATEGY.md`
- `02_FEATURE_SPECS/04_SIDEBAR_AGENT.md`
- `02_FEATURE_SPECS/05_DASHBOARD.md`
- `02_FEATURE_SPECS/06_TAB_CHAT.md`
- `02_FEATURE_SPECS/12_AGENTIC_CLASSIFICATION_AND_CONTEXT_TOOLS.md`
- `04_TECH/04_AI_PROMPTS_SCHEMAS.md`
- `04_TECH/05_AI_PROVIDER_STRATEGY.md`
- `04_TECH/07_SECURITY_PRIVACY_IMPLEMENTATION.md`

## 1. Executive Summary

Tab management alone does not make Chrome feel like an AI browser.

TabMosaic should evolve from:

```text
AI tab manager
```

to:

```text
Open-source Browser Work Agent for Chrome
```

The core promise becomes:

```text
Bring the browser work in front of me into one AI workspace:
pages, tabs, groups, links, screenshots, files, search results, todos, and safe browser actions.
```

MVP must stay simple. The first agent should not expose a giant tool catalog, a multi-agent diagram, or a developer dashboard. It should solve a few obvious work problems:

```text
- use Tavily-style web search as an internal Agent tool
- search open tabs and saved browser work from the Agent, not from a Dashboard search box
- understand current page / selected tabs / selected page region
- turn browser work into todos, checklists, memos, and comparison tables
- save important tabs or research sets
- organize and clean tabs safely
- execute browser actions only through validated Apply / Undo flows
```

## 2. Product Correction From User

User feedback:

```text
Tab management does not by itself make a browser evolve into an AI browser.
Search means a Tavily-like agent search tool, not merely Chrome's default search page.
Dashboard design is critical.
Skills should learn from strong open-source agent ecosystems, not only custom in-house skills.
First MVP should be less is more and target clear user pain.
```

Product response:

```text
Tab groups remain the visible entry point, but Browser Work Agent becomes the deeper product layer.
Dashboard becomes the user's Browser Workbench for reviewing Agent outputs, not a search command surface.
Tasks, saved context, and action review become first-class dashboard concepts.
Search remains an internal Agent tool surfaced through Sidebar tool cards and answers.
High-star open-source tools/skills may inform adapters and schemas, but MVP must not dynamically install or execute third-party skill code inside the Chrome extension.
```

## 3. Researched Inputs

### 3.1 Browser extension constraints

Official Chrome extension guidance shapes the architecture:

```text
- MV3 service workers are event-driven and may be suspended, so agent runs must be resumable.
- activeTab gives temporary access after user action; it is not background permission to read all pages.
- scripting is appropriate for user-triggered visible text / region extraction.
- sidePanel is the correct persistent UI surface for chat beside the current page.
- tabs and tabGroups APIs are the real browser action surface.
- Chrome Web Store policies require limited use, data minimization, and clear privacy disclosure.
```

Implication:

```text
The model must never call Chrome APIs directly.
All browser actions go through local tool executors, validation, and Apply / Undo gates.
```

### 3.2 Agent search research

Tavily-style search is different from opening a search engine tab.

A real agent search provider usually offers:

```text
- query input
- max results
- search depth / freshness controls
- answer or summary option
- result title / URL / snippet / score
- optional raw content or extracted chunks
- domain include / exclude controls
```

Product stance:

```text
P0 search tool means an external web-search provider adapter, with Tavily as the recommended first provider.
Search query text is user content and must be disclosed as sent to the configured search provider.
Search result URLs/snippets are external context; they should be session-only until the user saves them.
```

### 3.3 Open-source agent / skill ecosystem research

Open-source projects worth learning from:

| Project / ecosystem | What to learn | MVP use in TabMosaic |
|---|---|---|
| Pi / `pi-web-access` | Web access skill composition: search, URL fetch, PDF, YouTube, GitHub clone, fallback behavior | Learn capability boundaries and fallback chain; do not dynamically install packages in MV3 |
| Browser-use | Browser automation abstractions and task-step reasoning | Useful for local QA / future local companion; not embedded as default extension runtime |
| LangGraph / LangChain | Tool schema discipline, state graphs, durable execution concepts | Learn state-machine patterns; avoid bundling heavy runtime in MVP extension |
| LlamaIndex | Readers / loaders for documents and web content | Future attachment parsing reference; MVP starts with lightweight local parsers |
| MCP servers | Separation of tools/resources/prompts and explicit capability negotiation | Use MCP-like internal contracts; full MCP connector is P1/P2 |
| Composio / integration toolkits | Large integration catalog and auth patterns | Too broad for MVP; possible hosted/pro layer later |

MVP rule:

```text
Use high-star ecosystems as reference implementations, not as unreviewed runtime dependencies.
Any imported/adapted skill must pass license review, privacy review, dependency review, and deterministic tests.
```

## 4. What AI Browser Means For TabMosaic

An AI browser layer is not defined by how many tabs it manages.

It is defined by whether the user can say:

```text
Here is what I am working on in the browser.
Understand it.
Find what I need.
Turn it into next steps.
Keep the useful parts.
Clean the noise.
Do safe browser actions for me.
```

The product object model should expand from tabs to browser work objects:

| Object | Examples | MVP status |
|---|---|---|
| Page | current SaaS page, article, doc, PR, dashboard | Already first slice |
| Tab | one browser tab with metadata and optional visible text | Already first slice |
| Group | native Chrome tab group | Already first slice |
| Search result | Tavily-like result with title, URL, snippet, score | New MVP slice |
| Link | pasted URL or result URL | New MVP slice |
| Screenshot | page region crop or uploaded screenshot | P0.5/P1 |
| Attachment | txt/md/image first; PDF/doc/csv later | P1 |
| Todo | task linked to tabs/pages/results | New MVP slice |
| Collection | saved tab/result set | New MVP slice |
| Action plan | validated browser action draft | Already first slice, expand |

## 5. Agent Architecture Decision

### 5.1 Recommended MVP architecture

Use:

```text
Context-first Browser Work Agent
```

Flow:

```text
User asks in Sidebar or Dashboard
→ Intent Router
→ Context Builder
→ Skill Router
→ Tool Executor
→ Validator
→ Assistant response / Todo / Memo / Action draft
→ Apply / Save / Undo
```

Why this architecture:

```text
- Simple enough for MVP.
- Fits MV3 service worker lifecycle.
- Keeps UI understandable.
- Allows Tavily-style search without turning the extension into a crawler.
- Allows future skill reuse through clear contracts.
- Avoids letting a model directly operate the browser.
```

### 5.2 Architecture options considered

| Option | Description | Decision |
|---|---|---|
| Single bounded agent + tool registry | One orchestrator with explicit tools and skills | RECOMMENDED / MVP |
| Multi-agent planner/executor/researcher | Several model agents hand off tasks | NOT MVP; too complex and token-heavy |
| MCP-compatible local companion | Extension connects to local MCP tools | P1/P2; powerful but needs user setup and security model |
| Hosted cloud browser agent | Cloud worker does search/fetch/automation | P2/Pro; not open-source/BYOK-first MVP |
| Full browser automation agent | Clicks, fills forms, buys, posts, approves | DO NOT BUILD YET |

## 6. Dashboard Workbench Design

Dashboard should become the place where the user sees browser work as tasks and context, not only groups.

### 6.1 Default Dashboard principles

```text
less is more
work objects over metrics
tasks and saved context are first-class
search is internal to the Agent, not a Dashboard control
settings stay hidden / private-beta
no dense admin layout
no giant tool catalog
action plans are reviewable
saved context is local-first
```

### 6.2 First-screen layout

Recommended first screen:

```text
Top bar:
TabMosaic                                      Local

Work in progress:
- 3 suggested todos from current tabs
- saved research sets
- pending action plan, if any

Smart Groups:
- current native groups
- select tabs → ask / todo / save

Duplicate Center:
- folded by default
```

### 6.3 Dashboard areas

| Area | User pain | MVP behavior |
|---|---|---|
| Work Queue / Todos | "I opened tabs but forgot the next steps" | Create local todos linked to tabs/results |
| Collections | "I want to keep this research set" | Save selected tabs/results as local collection |
| Smart Groups | "Where did my tabs go?" | Keep existing minimal group board |
| Action Review | "What will the agent change?" | Apply / Cancel / Undo for browser changes |
| Duplicate Center | "What can I clean safely?" | Keep folded by default |

Implementation note, 2026-06-13:

```text
FIRST SLICE IMPLEMENTED:
- Dashboard selected tabs can create a local todo.
- Dashboard selected tabs can save a local collection.
- Todo / collection rows show compact linked-tab previews.
- Todo / collection rows can send linked open tabs to Sidebar Agent as selected-tabs context.
- Storage remains local-only and metadata-only; no cloud sync, no page text, no full URL persistence.
```

Search result card implementation note, 2026-06-13:

```text
FIRST SLICE IMPLEMENTED:
- Sidebar Agent recognizes explicit web-search requests such as "search the web for ...".
- Search runs through the internal `search_web_provider` tool contract.
- The result appears as an assistant message card with query, provider, and session-only storage disclosure.
- Results render as compact source rows with user-triggered Open buttons.
- Open only creates a new tab after user click; the Agent does not auto-open results.
- The UI screenshot fixture covers the completed Tavily-style result card.
```

Dashboard should not include a visible search bar in MVP. Search happens when the user asks the Sidebar Agent. Dashboard may later show saved search-derived collections, but not as a primary search UI.

### 6.4 What should not appear by default

```text
- complex Settings
- usage/billing
- raw provider details
- workflow marketplace
- debug logs
- latest result metrics wall
- internal tool registry
```

## 7. MVP Tool Registry

Tools are local capabilities. The model may request them, but only local code executes them.

Each tool must declare:

```ts
type ToolPolicy = {
  id: string;
  category: "search" | "context" | "task" | "collection" | "browser_action" | "provider";
  readsPageText: boolean | "already_extracted";
  sendsToExternalProvider: boolean;
  storesData: "none" | "session" | "local";
  appliesBrowserChanges: boolean;
  requiresUserGesture: boolean;
  requiresApply: boolean;
  undoable: boolean;
  destructive: boolean;
};
```

### 7.1 Search tools

| Tool | Purpose | Data boundary | MVP |
|---|---|---|---|
| `search_open_tabs` | Search current open tabs by title/hostname/path/group | Local metadata only | Build now |
| `search_saved_work` | Search local collections/todos/workspaces | Local saved metadata only | Build now |
| `search_current_page` | Search extracted visible text in current page/session | User-triggered page text only | P0.5 |
| `search_web_provider` | Tavily-style web search | Sends user query to configured search provider | First Tavily adapter implemented; public provider/key UX required |
| `open_search_result` | Open selected result in a new tab | Browser action, user click | P0.5 |
| `save_search_result` | Save result to collection | Local storage | P0.5 |

### 7.2 Context tools

| Tool | Purpose | Data boundary | MVP |
|---|---|---|---|
| `read_current_page` | Current page Q&A | Visible text only, user-triggered | Existing |
| `read_selected_tabs` | Selected tabs/group Q&A | Up to 6 tabs, visible text only | Existing first slice |
| `select_page_region` | User selects a page block | Region text/structure, session-only | Existing first slice |
| `ingest_link` | Understand pasted URL | URL string provided by user; no fetch until confirmed | Build now |
| `ingest_screenshot` | Use user screenshot as context | Session-only; vision requires capable provider | P0.5/P1 |
| `ingest_attachment` | Read txt/md/image; PDF/doc/csv later | Session-only by default | P1 |

### 7.3 Task tools

| Tool | Purpose | Data boundary | MVP |
|---|---|---|---|
| `create_todo_from_tabs` | Turn selected/current group tabs into todo items | Local metadata; page text only if user asks | Build now |
| `create_todo_from_search_results` | Turn results into research tasks | Search result metadata/snippets | P0.5 |
| `update_todo` | Done/rename/link/unlink | Local storage | Build now |
| `link_tabs_to_todo` | Connect tabs to a task | Local tab IDs + metadata | Build now |
| `generate_checklist` | Make checklist from page/tabs/context | AI provider if content used | P0.5 |

### 7.4 Collection tools

| Tool | Purpose | Data boundary | MVP |
|---|---|---|---|
| `save_tab` | Save current/open tab into local collection | Title/hostname/path, optional restore URL only if user confirms | Build now |
| `save_tab_group` | Save current group as collection | Local tab metadata | Build now |
| `save_selected_tabs` | Save selected tabs | Local tab metadata | Build now |
| `save_search_results` | Save selected result list | Search result metadata | P0.5 |
| `open_collection` | Focus/open saved local tabs | Needs restore URL policy confirmation for closed tabs | P1 |

### 7.5 Browser action tools

Keep existing safe action tools:

```text
organize_tabs
apply_group_plan
move_tabs_to_group
rename_group
focus_tab
clean_safe_duplicates
undo_last_action
restore_closed_duplicates
open_dashboard
```

Reject in MVP:

```text
click_page_button
fill_form
submit_form
send_message
send_email
approve_purchase
close_non_duplicate_tabs
read_all_pages_in_background
store_page_text_in_cloud
```

## 8. Search Provider Strategy

### 8.1 Tavily-style provider contract

Recommended internal interface:

```ts
type WebSearchRequest = {
  query: string;
  maxResults: number;
  searchDepth?: "basic" | "advanced";
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
};

type WebSearchResult = {
  title: string;
  url: string;
  hostname: string;
  snippet: string;
  score?: number;
  publishedAt?: string;
  sourceProvider: "tavily" | "exa" | "brave" | "searxng" | "custom";
};
```

MVP default:

```text
Provider: Tavily-style custom search
Key: user-provided
Storage: chrome.storage.local
Host permission: explicit provider-origin permission
Query source: user typed query only, unless user explicitly says to search from page/tabs
Raw content: off by default
Result persistence: session-only until saved by user
```

### 8.2 Search privacy rules

```text
- Do not send open tab titles to search provider by default.
- Do not send page text to search provider by default.
- If user says "search web for this page", first summarize/minimize the query locally or ask confirmation.
- Do not store full result pages unless user saves.
- Do not run recurring/background search in MVP.
- Search provider errors should be plain: "Connect a search provider" or "Search failed".
```

### 8.3 Provider options

| Provider | Fit | MVP stance |
|---|---|---|
| Tavily | Agent-oriented search API | Recommended first adapter |
| Exa | Neural/link search, research workflows | P1 optional |
| Brave Search API | Traditional web search | P1 optional |
| SearXNG | Self-hosted privacy option | P1/P2 open-source-friendly |
| Perplexity/Sonar | Search + answer via model provider | Already AI provider preset; treat separately |

## 9. Skill Strategy

### 9.1 Skill definition

In TabMosaic, a skill is not a random plugin.

It is a small, reviewed workflow package:

```ts
type BrowserSkill = {
  id: string;
  label: string;
  userJobs: string[];
  allowedTools: string[];
  contextPolicy: string;
  prompt: string;
  outputSchema: object;
  privacyBoundary: string;
  tests: string[];
};
```

### 9.2 MVP skills

| Skill | User job | Tools |
|---|---|---|
| Research Skill | Search web, compare sources, save useful results | search_web_provider, save_search_results, create_todo |
| Current Page Skill | Ask page and follow up | read_current_page, select_page_region |
| Page Region Skill | Ask about one block/table/panel | select_page_region |
| Tab Todo Skill | Turn tabs into next steps | search_open_tabs, create_todo_from_tabs |
| Collection Skill | Save useful tabs/results | save_tab, save_selected_tabs, save_tab_group |
| Cleanup Skill | Clean duplicates/noise safely | clean_safe_duplicates, duplicate review |
| Developer Console Skill | Understand GitHub/Supabase/Vercel/Chrome docs pages | read_current_page, read_selected_tabs |

### 9.3 Reusing high-star open-source skills

MVP policy:

```text
Do not dynamically install external skills in the Chrome extension.
Do not run third-party code fetched from the internet.
Do not add broad permissions to support a skill marketplace.
```

Allowed:

```text
- study open-source skill design
- adapt prompt patterns with attribution if license allows
- reuse small MIT/Apache-compatible utility code only after review
- expose MCP-like schemas for future local companion integrations
- create contribution templates so community can add reviewed skills
```

P1/P2:

```text
Local companion mode can support MCP servers or Pi-like skills outside the extension sandbox.
Hosted mode can offer curated skill packs.
Both require separate security, license, and privacy review.
```

## 10. Link, Screenshot, and Attachment Context

### 10.1 Links

MVP:

```text
User pastes a link.
Agent extracts hostname/path/title-like hints locally.
Agent can ask:
"Open and read this link?" or "Save this link?"
No background fetching by default.
```

### 10.2 Screenshots

P0.5/P1:

```text
User uploads screenshot or selects page region.
If provider supports vision, agent can answer from image.
Image bytes are session-only by default.
No full-screen background screenshots.
No screenshot persistence unless user saves explicitly.
```

### 10.3 Attachments

Recommended sequence:

```text
P1: txt, markdown, small image
P1.5: PDF
P2: docx, csv, xlsx
```

Attachment rule:

```text
The file belongs to the current chat unless the user saves it to a collection.
```

## 11. Dashboard MVP Implementation Slice

Build now:

```text
Dashboard Agent Workbench shell:
- Work Queue preview
- Collections preview
- selected tabs can create todo or collection
```

Storage keys:

```text
tabmosaic.agentTasks
tabmosaic.savedCollections
tabmosaic.searchSettings
```

Do not build yet:

```text
- live Tavily request without user key
- screenshot upload UI
- attachment upload UI
- dynamic skill marketplace
- automated web browsing
- background search
```

## 12. Acceptance Criteria

### 12.1 Dashboard

```text
- Dashboard still opens to a simple glass UI.
- Top workbench does not feel like Settings.
- Dashboard does not expose search as a primary UI.
- Explicit web-search requests from Sidebar route to an internal `search_web_provider` tool state.
- If no search provider is configured, Sidebar explains that Tavily-style search needs a provider and sends only the typed query by default.
- User can see Tasks and Collections as lightweight browser work concepts.
- Smart Groups board remains visible and useful.
- Duplicate Center remains folded.
```

### 12.2 Agent / tools

```text
- Tool registry includes search/task/collection categories.
- Tools declare privacy policies.
- External search provider query is never run unless provider is configured and user triggers it.
- Configured Tavily-style search sends only the normalized user-typed query, with raw content and images off by default.
- Browser-changing tools remain Apply/Undo gated.
- Local tab search does not read page text.
```

### 12.3 Open-source

```text
- New skill contribution policy is documented.
- No third-party agent runtime is bundled without review.
- No LICENSE file is added until D-034-A is confirmed.
- No generated artifacts or API keys are committed.
```

## 13. Decision Gates

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| D-039 | First external search provider | Tavily-style adapter, Tavily as first provider | CONFIRM |
| D-040 | Search query privacy copy | Tell users web search sends query to configured provider | RECOMMENDED |
| D-041 | Dashboard workbench first screen | Add tasks and collections above Smart Groups; keep search inside the Agent conversation | RECOMMENDED |
| D-042 | Dynamic third-party skill installation | Do not allow in MVP; reviewed built-in skills only | RECOMMENDED |
| D-043 | MCP/local companion support | Design-compatible, do not build in MVP | RECOMMENDED |
| D-044 | Screenshot vision upload | P0.5/P1 only, user-triggered, session-only | CONFIRM |
| D-045 | Attachment upload types | Start with txt/md/image, PDF later | CONFIRM |

## 14. Implementation Plan

### Slice A: Spec + UI shell

```text
1. Add this spec.
2. Update README / INDEX.
3. Add Dashboard Workbench shell without search UI.
4. Add Tasks and Collections preview cards.
5. Route explicit Sidebar web-search requests to an internal tool state.
6. Add smoke tests for UI and privacy wording.
```

### Slice B: Local tasks and collections

```text
1. Save selected tabs as local collection.
2. Create todo from selected tabs.
3. Link todo to group/tab metadata.
4. Render local task/collection lists.
```

### Slice C: Tavily-style search provider

```text
1. Add search settings storage behind private-beta/dev configuration. DONE.
2. Request explicit provider origin permission. DONE for the internal executor.
3. Implement Tavily adapter. DONE for POST /search with query-only payload.
4. Render result list. DONE in Sidebar Agent message card.
5. Save selected results to collection. NEXT.
6. Add redacted diagnostics and tests. PARTIAL: executor smoke test added; user-facing diagnostics still pending.
```

### Slice D: richer AI browser inputs

```text
1. Link understanding flow.
2. Screenshot / vision flow after confirmation.
3. Attachment flow after confirmation.
4. Research memo / comparison table generation.
```

## 15. Self Review

### Product clarity

Pass:

```text
The spec moves beyond tab management into browser work: search, tasks, collections, page/region context, links, screenshots, and attachments.
```

Risk:

```text
Dashboard can become too complex if all areas are visible at once.
```

Mitigation:

```text
First UI slice uses two lightweight Dashboard previews and keeps search inside Sidebar Agent tool flow. It does not expose Settings, raw tools, or a marketplace.
```

### Privacy

Pass:

```text
External search is explicitly user-triggered and provider-configured.
Page text and tab titles are not sent to search by default.
```

Risk:

```text
Users may assume "search web for this" can include current page context.
```

Mitigation:

```text
Show concise copy when page/tab context would be converted into a search query.
```

### Open-source

Pass:

```text
The spec supports high-star ecosystem learning without unsafe dynamic code loading.
```

Risk:

```text
Community may ask for arbitrary skills quickly.
```

Mitigation:

```text
Skill contribution contract requires privacy, tests, and license review.
```

### MVP scope

Pass:

```text
The first implementation slice is Dashboard task/collection previews plus an internal Sidebar search-tool executor. A Tavily-style adapter now exists, but it does not run unless a search provider key is configured and the user explicitly asks the Agent to search.
```

Risk:

```text
If external search is delayed too long, AI browser value may still feel shallow.
```

Mitigation:

```text
Slice C should follow immediately after Slice A/B once search provider confirmation and API key flow are settled.
```

## 16. Sources

- Chrome Extension service workers: `https://developer.chrome.com/docs/extensions/develop/concepts/service-workers`
- Chrome `activeTab`: `https://developer.chrome.com/docs/extensions/develop/concepts/activeTab`
- Chrome `scripting`: `https://developer.chrome.com/docs/extensions/reference/api/scripting`
- Chrome `sidePanel`: `https://developer.chrome.com/docs/extensions/reference/api/sidePanel`
- Chrome `tabs`: `https://developer.chrome.com/docs/extensions/reference/api/tabs`
- Chrome `tabGroups`: `https://developer.chrome.com/docs/extensions/reference/api/tabGroups`
- Chrome Web Store Program Policies: `https://developer.chrome.com/docs/webstore/program-policies/`
- Tavily Search API docs: `https://docs.tavily.com/documentation/api-reference/endpoint/search`
- MCP tools specification: `https://modelcontextprotocol.io/specification/2025-06-18/server/tools`
- Pi `pi-web-access`: `https://github.com/earendil-works/pi/tree/main/packages/pi-web-access`
- Browser-use: `https://github.com/browser-use/browser-use`
- LangGraph: `https://github.com/langchain-ai/langgraph`
- LlamaIndex: `https://github.com/run-llama/llama_index`
- Composio: `https://github.com/ComposioHQ/composio`
