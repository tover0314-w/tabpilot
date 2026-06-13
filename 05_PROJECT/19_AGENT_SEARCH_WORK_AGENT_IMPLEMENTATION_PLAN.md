# Agent Search And Browser Work Agent Implementation Plan

Status: DRAFT / READY FOR USER REVIEW  
Date: 2026-06-13  
Owner: Product + Engineering + AI Prompt  
Related:

- `02_FEATURE_SPECS/13_BROWSER_WORK_AGENT_SEARCH_DASHBOARD_SKILLS.md`
- `02_FEATURE_SPECS/12_AGENTIC_CLASSIFICATION_AND_CONTEXT_TOOLS.md`
- `02_FEATURE_SPECS/04_SIDEBAR_AGENT.md`
- `02_FEATURE_SPECS/05_DASHBOARD.md`
- `00_START_HERE/03_DECISIONS_TO_CONFIRM.md`

## 1. Goal

Make TabMosaic feel less like a tab manager and more like a lightweight AI browser layer.

The next implementation should focus on:

```text
Sidebar Agent asks for work
→ Agent calls internal tools
→ user sees a simple tool card
→ Agent returns a useful answer
→ user can save, turn into todo, organize, or continue
```

Search is an internal Agent tool. It is not Dashboard UI.

## 2. Product Principles

```text
- Less is more: do not expose a tool console.
- Sidebar is the command surface.
- Dashboard shows Agent outputs: tasks, collections, smart groups.
- Search only runs after the user explicitly asks the Agent.
- External providers receive only the user-typed query by default.
- Page text / tab titles are not sent to search providers by default.
- Browser-changing actions require Apply / Undo.
- No background crawler, no hidden recurring search, no dynamic skill marketplace.
```

## 3. Decision Gates

These must be confirmed before treating the implementation as public-product behavior.

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| D-039 | Search provider/key UX | Add a compact Search Provider section under existing BYOK settings; keep Dashboard free of search UI | CONFIRM |
| D-039-A | First public search provider | Tavily first; Exa/Brave/SearXNG later | CONFIRM |
| D-039-B | Search permission copy | "Only your typed query is sent to the configured search provider" | CONFIRM |
| D-043 | Attachment upload first types | txt/md/image first, PDF later | CONFIRM |
| D-044 | Vision/cropped screenshot upload | User-triggered, session-only, model-capability gated | CONFIRM |

Until confirmed, implementation may keep provider settings in private-beta/dev paths and avoid public onboarding copy.

## 4. Implementation Slices

### Slice 1: Search Provider Configuration

Purpose:

```text
Make the already-built Tavily-style executor usable without hardcoding keys.
```

Tasks:

- Add Search Provider settings model for `tabmosaic.searchSettings`.
- Add compact provider config UI in existing Settings, not as Dashboard search UI.
- Support Tavily fields: enabled, baseUrl, apiKey, maxResults, searchDepth.
- Add "Test Search Provider" using a synthetic query, not browser tab data.
- Request provider origin permission only for the configured provider.
- Redact search key from diagnostics, screenshots, logs, and package checks.
- Add smoke tests for save/test/clear behavior.

Acceptance criteria:

- Without provider config, Sidebar says search provider is not connected and sends nothing.
- With provider config, explicit "web search ..." runs `search_web_provider`.
- The request body contains user query, max results, depth, and no page text/tab list/full browser URL.
- Dashboard still has no search bar.

### Slice 2: Search Results As Agent Work

Purpose:

```text
Search results should become useful browser work, not a dead answer.
```

Tasks:

- Render search results in the assistant message card.
- Add actions under the Agent answer: Open result, Save to collection, Make todo.
- Store saved search results as local collection items with title, hostname, snippet, provider, and timestamp.
- Do not store raw result pages.
- Add Dashboard Collections rendering for saved search result items.
- Add tests for saved result privacy boundary.

Acceptance criteria:

- User can ask "web search best Chrome tab managers" and get a clean answer.
- User can save a result list locally.
- Dashboard Collections shows the saved result set without becoming a search UI.

### Slice 3: Todo Agent MVP

Purpose:

```text
Turn browser context into next steps.
```

Tasks:

- Support "make a todo from this tab/group/search result".
- Support todo status: open, done, archived.
- Link todos to current tab, selected tabs, current group, or saved search result collection.
- Add Dashboard Work Queue actions: mark done, focus/open source tab, open sidebar context.
- Add Sidebar follow-up: "what should I do next?" can reference active todo context.
- Keep all todo data local in MVP.

Acceptance criteria:

- User can create a todo from current browser work without typing a long prompt.
- User can return to the related tabs from the todo.
- No page text or full URLs are stored unless separately confirmed later.

### Slice 4: Link Understanding

Purpose:

```text
Let the Agent handle links the user explicitly provides.
```

Tasks:

- Detect pasted URLs in Sidebar messages.
- Ask whether to treat the pasted link as context if fetching is required.
- For first slice, use metadata and search-provider result snippets when possible.
- Add future path for user-confirmed URL fetch.

Acceptance criteria:

- User can paste a link and ask "what is this / save this / compare with current page".
- No arbitrary page fetch happens silently.

### Slice 5: Screenshot / Attachment Inputs

Purpose:

```text
Move toward AI browser input beyond tabs.
```

Tasks:

- Add user-triggered screenshot/selected-region visual upload path only after confirmation.
- Add txt/md upload first; PDF/doc/csv later.
- Keep uploads session-only by default.
- Add model capability checks before vision requests.

Acceptance criteria:

- User can add a small explicit context object.
- Agent explains what data will be sent before sending it.

## 5. Agent Architecture

Use a single bounded Agent with a local tool registry.

```text
User message
→ intent router
→ context builder
→ tool executor
→ validator
→ assistant message card
→ optional Save / Todo / Apply action
```

Do not build multi-agent planner/executor/researcher in MVP.

## 6. Tool List For MVP

| Tool | Status | Next action |
|---|---|---|
| `search_web_provider` | Executor implemented | Add public config UX and real-key QA |
| `search_open_tabs` | Local metadata search implemented | Keep as Agent answer path |
| `search_saved_work` | Contract exists | Wire to Work Queue / Collections after saved result model |
| `save_search_results` | Not implemented | Slice 2 |
| `create_todo_from_search_results` | Not implemented | Slice 2 / 3 |
| `create_todo_from_tabs` | First local action exists | Expand status/actions |
| `read_current_page` | Implemented | Continue prompt quality polish |
| `read_selected_tabs` | Implemented first slice | Real-profile QA pending |
| `select_page_region` | Implemented first slice | Vision upload pending confirmation |

## 7. QA Plan

Automated:

```bash
node tools/extension_smoke_test.js
node tools/capture_ui_screenshots.js
node tools/package_extension.js
node tools/verify_release_package.js
node tools/preflight.js
```

Manual / real Chrome:

```text
- Search provider not configured: no request sent.
- Tavily key configured: explicit search request succeeds.
- Search result card is readable and not dashboard-like.
- Save result creates local collection.
- Todo from search result appears in Work Queue.
- Page/tab data is not sent to search provider.
- Optional host permission prompt is understandable.
```

## 8. Suggested Sequence

1. Confirm D-039 provider/key UX.
2. Implement Slice 1.
3. Run preflight + real Tavily smoke with a user-provided key.
4. Implement Slice 2.
5. Implement Slice 3.
6. Revisit link/screenshot/attachment scope after UI and privacy review.

## 9. Out Of Scope For This Implementation Plan

```text
- Dashboard search bar
- Skills marketplace
- Hosted cloud browser agent
- Full browser automation
- Background crawling
- Cloud memory
- Billing
- Public Chrome Web Store submission
```
