# Feature Spec: Agentic Classification, Context, and Tools

Status: DRAFT / PRIVATE-BETA DECISIONS CONFIRMED  
Date: 2026-06-11  
Owner: Product + AI Prompt + Technical Architecture  
Related:

- `02_FEATURE_SPECS/02_AUTO_CLASSIFICATION.md`
- `02_FEATURE_SPECS/04_SIDEBAR_AGENT.md`
- `02_FEATURE_SPECS/06_TAB_CHAT.md`
- `02_FEATURE_SPECS/11_PRIVACY_CONTROLS.md`
- `04_TECH/04_AI_PROMPTS_SCHEMAS.md`
- `04_TECH/07_SECURITY_PRIVACY_IMPLEMENTATION.md`

## 1. Executive Summary

TabMosaic's next AI quality step is to move from "domain grouping plus shallow chat" to an agentic workflow:

```text
Understand the user's work intent
→ classify tabs by project / task / workflow stage, not domain
→ expose an explicit tool list to the Sidebar Agent
→ retrieve deeper context only when the user asks, with tool-card disclosure
→ return explainable plans and user-approved actions
```

The goal is not to silently read every page. The goal is to make the Agent feel capable while preserving the current privacy model: user-triggered, visible, capped, session-only context.

## 2. Problem Statement

### Who has this problem?

Knowledge workers with many work tabs across docs, code, dashboards, SaaS tools, search results, and AI tools.

### What is broken today?

The current experience can feel shallow in three ways:

```text
1. Classification often looks domain-first.
   Example: GitHub tabs together, docs tabs together, dashboards together.
   This may clean the tab bar visually but does not always map to the user's real work.

2. Sidebar answers can feel under-contextualized.
   Metadata-only Agent answers know title/hostname/path/group state, but not page content.
   Current-tab Page Agent can read one active page after user action, but group/tabs context is not wired.

3. The Agent does not have a visible internal tool contract.
   Without a tool registry, it is unclear what the Agent can inspect, what it can change, what requires Apply, and what requires privacy confirmation.
```

### Why does this matter?

If classification is domain-first, the user thinks:

```text
I could have done this myself with Chrome search or domain grouping.
```

If chat lacks context, the user thinks:

```text
This is not an agent. It is a thin chatbot over tab titles.
```

## 3. Product Principle

RECOMMENDED:

```text
Classify by user job first, domain second.
Answer from real context when available.
Show a tool card before reading multiple page bodies, and ask extra confirmation for sensitive contexts.
Show action plans before changing the browser.
Keep native tab groups as the visible result.
```

Bad classification:

```text
GitHub
Google Docs
Supabase
YouTube
Other
```

Better classification:

```text
TabMosaic Product Spec
Private Beta QA
DeepSeek Agent Implementation
Supabase Production Fix
Chrome Extension Docs
Research To Read
```

## 4. Classification V2

### 4.1 Classification dimensions

Classifier V2 should infer multiple dimensions before creating groups:

| Dimension | Meaning | Examples |
|---|---|---|
| Project / entity | The work object or product being worked on | `TabMosaic`, `ai-music`, `client onboarding` |
| Workflow stage | What the user is doing | `Planning`, `Code Review`, `Debugging`, `QA`, `Research`, `Billing` |
| Artifact type | What kind of page this is | `PR`, `issue`, `API docs`, `dashboard`, `design`, `article` |
| Intent | Why the tab is open | `fix`, `compare`, `learn`, `monitor`, `ship`, `buy`, `read later` |
| Urgency / protection | Whether it should be preserved | active, pinned, audible, admin, checkout, sensitive |

Group names should usually combine project + workflow stage:

```text
TabMosaic Sidebar QA
DeepSeek Agent Implementation
Supabase Database Settings
Chrome Extension API Docs
Product Positioning Research
```

Domain-only group names are allowed only when the domain itself is the task:

```text
GitHub PR Review
Supabase Admin
Stripe Billing
Chrome Extension Docs
```

### 4.2 Metadata-only V2 input

CONFIRMED / SAFE TO BUILD:

Classifier V2 can improve metadata-only classification without changing privacy defaults.

Input remains:

```json
{
  "tabId": 123,
  "title": "Settings | Database | ai-music | Supabase",
  "hostname": "supabase.com",
  "path": "/dashboard/project/.../settings/database",
  "windowId": 1,
  "existingGroup": "Dev Tools",
  "active": false,
  "pinned": false,
  "audible": false,
  "discarded": false
}
```

Add derived local-only features before the AI prompt:

```json
{
  "inferredArtifactType": "database_settings",
  "inferredWorkflow": "production_config",
  "projectCandidate": "ai-music",
  "domainCategory": "dev_infra",
  "duplicateHint": "none",
  "sensitiveHint": "database",
  "domainOnlyRisk": true
}
```

These derived features come from title/path/hostname only. They do not require page body reading.

### 4.3 Classification V2 output schema

RECOMMENDED:

```json
{
  "groups": [
    {
      "name": "Supabase Production Database",
      "intent": "production_config",
      "project": "ai-music",
      "workflow": "Database Settings",
      "color": "green",
      "tabIds": [123, 124],
      "confidence": 0.88,
      "evidence": [
        "titles mention ai-music",
        "paths indicate database settings",
        "hostnames are Supabase"
      ],
      "classificationMode": "metadata_semantic",
      "domainOnlyRisk": false
    }
  ],
  "reviewTabIds": [130],
  "splitSuggestions": [
    {
      "fromGroup": "Dev Tools",
      "suggestedGroups": ["Supabase Production Database", "Chrome Extension Docs"],
      "reason": "Same broad tool category but different user jobs."
    }
  ],
  "suggestedRules": [
    {
      "type": "title_path_pattern",
      "pattern": "title:*ai-music* hostname:supabase.com path:*database*",
      "groupName": "Supabase Production Database"
    }
  ]
}
```

Validation additions:

```text
- reject empty project/workflow fields only if confidence is high and group name depends on them
- flag groups whose name is only a hostname unless allowlisted
- flag large same-domain groups for split review when titles/paths show different workflows
- cap group count but allow more groups when tab count is high
- require evidence strings that point to metadata, not invented page contents
```

## 5. Context Depth Model

The Agent should have explicit context levels.

| Level | Context | Default | Use case |
|---|---|---|---|
| C0 | titles, hostnames, paths, tab state, group state | On | one-click classification, metadata Agent |
| C1 | current tab visible text | User-triggered | current-page Q&A, current-page summary |
| C1S | safe current-page site-skill hint | User-triggered with C1 | site-aware reading guidance, e.g. PR review, issue triage, cloud console, design/doc review |
| C2 | selected tabs / current group visible text | User-triggered, default enabled with tool card | group chat, multi-tab comparison, deep reclassification |
| C2R | selected page region visible text | User-triggered, element picker, session-only | ask about one specific page block/table/card/panel |
| C3 | session-only summaries | Allowed in memory only, not persisted | repeat questions within the current sidebar session |
| C4 | cloud memory / cross-device summaries | DO NOT BUILD YET | Pro workspace intelligence |

### 5.1 Current tab

CONFIRMED:

Current-tab Page Agent may read visible text after user asks from the Sidebar and completes sensitive-page confirmation when needed.

### 5.1.1 Current-page site skill hints

CONFIRMED BY IMPLEMENTATION / FIRST SLICE:

Common work pages can include a generic site-skill hint in the current-tab Page Agent payload.

```text
Implemented hints:
- github_pull_request_review → GitHub Pull Request
- github_issue_triage → GitHub Issue
- github_ci_run_review → GitHub CI Run
- cloud_project_settings_review → Cloud Project Console
- project_issue_triage → Project Issue
- design_file_review → Design File
- collaboration_document_review → Collaboration Document

Purpose:
- help Page Agent choose the right reading strategy for the visible current page
- improve answers for review, triage, debugging, admin-console review, design review, and document synthesis
```

Privacy boundary:

```text
Allowed:
- page type label
- generic reading guidance
- generic capability names

Rejected:
- owner / organization name
- repository name
- PR number
- issue key / run number
- design file ID
- document ID
- project slug
- full URL
- query string / hash
- hidden DOM
- raw HTML
- additional page content beyond the existing current-page visible text flow
```

This is a Tabbit-inspired site-skill direction, but the first slice is intentionally narrow: it improves how the Agent reasons about visible work-page text without adding a new UI surface, new permission, background reading, or automatic browser action.

### 5.2 Current group / selected tabs

CONFIRMED BY USER:

When the user asks:

```text
What is this group about?
Summarize these tabs.
Why did you put these together?
Reclassify this group by actual page content.
```

Default private-beta behavior:

```text
Agent may read visible text from the current group or selected tabs by default because the user initiated a context question.
Before extraction, the Sidebar renders a compact tool card:

Tool: Read group pages
Scope: current group, up to 6 tabs
Data: visible text only
Storage: session-only, not saved
Skipped: reason chips when tabs are sensitive, restricted, protected, empty, unreadable, closed, or over the beta cap

Sensitive, internal, restricted, or unreadable pages are skipped or require extra confirmation.
The user can still choose a titles-only answer when the tool cannot run or when they prefer the lighter path.
```

No background multi-page body reading should happen.

CONFIRMED BY IMPLEMENTATION / FIRST SLICE:

```text
Dashboard Smart Group tab rows can be selected in the same window.
When 2+ rows are selected, Dashboard shows a compact Chat selected action.
Selecting a row from another Chrome window resets the selected-tabs set and shows a compact status notice, because cross-window selected-tabs chat is kept separate in this beta.
Clicking it opens Sidebar with active context = selected_tabs.
Dashboard sends only local tab IDs/count and minimized metadata into Sidebar context.
Dashboard does not read visible text, call the page-content Agent, or upload data.
The Sidebar may later run the C2 tool-card flow only after the user asks a selected-tabs question.
```

### 5.3 Content-assisted classification

CONFIRMED BY USER:

Content-assisted regrouping is allowed when the user explicitly asks the Agent to improve a group or selected tabs using page content.

Confirmed boundary:

```text
One-click classify stays metadata-only.
User can later ask "Improve this group using page content."
Agent renders a tool card and reads only visible text from selected/group tabs with a cap.
Then it proposes a new grouping plan with Apply / Cancel.
```

CONFIRMED BY IMPLEMENTATION:

```text
Dashboard selected-tabs flow exposes a compact `Refine with AI` entry after 2+ same-window tabs are selected.
Clicking it opens Sidebar with selected-tabs context and pre-fills:
`Regroup these selected tabs by actual page content.`
The prompt is not auto-submitted. The user still sends it from Sidebar, which then shows the tool card, reads capped visible text, calls the configured AI provider when available, and renders a Markdown-style assistant message with Apply / Cancel below it.
```

CONFIRMED BY IMPLEMENTATION:

Content-assisted regrouping prompt behavior must split same-host or same-project tabs when their visible page text points to different work activities. The model should not collapse distinct product planning, QA/debugging, design review, research, billing, or implementation pages into one broad umbrella group merely because they share a domain or product name.

### 5.4 Page region context

P1 CANDIDATE / FIRST SLICE IMPLEMENTED:

When the user asks about a specific part of the current page, the Agent can offer a precise region picker instead of reading the whole page.

Expected flow:

```text
User clicks "Select region" or uses a context command
→ content script highlights visible page blocks on hover
→ user clicks one block
→ Sidebar renders tool card:
   Tool: Select page region
   Data: selected region visible text + semantic structure + cropped screenshot metadata
   Storage: session-only
→ Agent answers from only that selected region
```

Implemented first slice:

```text
- Sidebar accepts `select region`, `ask region: ...`, and Chinese selected-region commands.
- Page-local picker highlights readable blocks and cancels on Esc or timeout.
- Background summarizes only the selected element's visible text and safe lightweight structure.
- Bounded table structure is included as headers plus up to 8 rows / 6 cells per row after the same text redaction path.
- Background may capture the current visible tab only after the user clicks a page region, crop it immediately to the selected region in memory, discard the full visible-tab capture, and keep only cropped screenshot metadata for the text-only Page Agent.
- DeepSeek/OpenAI-compatible Page Agent receives `source: selected_region` and a selected-region privacy note.
- Tool card uses `extract_selected_page_region` and stays out of chat memory.
- Screenshot image bytes are not uploaded, stored, added to chat memory, diagnostics, feedback templates, or workspace memory in this first slice.
```

First-slice data boundary:

```text
Allowed:
- visible text inside selected element
- headings / labels / list structure
- table rows and cells
- safe link labels and hostnames
- ARIA role/label when needed to understand UI
- cropped selected-region screenshot metadata: captured flag, image type, dimensions, byte length, and explicit no-upload/no-store flags

Rejected by default:
- raw full HTML
- full-page screenshot upload or persistence
- fullscreen screenshot upload or persistence
- background screenshot capture
- screenshot image bytes in the text-only Page Agent payload
- screenshot image bytes in chat history, diagnostics, feedback templates, or workspace memory
- hidden inputs
- password fields
- form values
- cookies / storage
- scripts / styles
- unrelated sibling DOM
- screenshot upload outside the confirmed selected-region flow
```

Future visual context boundary:

```text
- optional vision-model upload of the cropped selected-region screenshot, only after separate provider capability work and user confirmation
- no full-page screenshot upload or persistence
- no background screenshot capture
- session-only by default
```

This feature should use the same trust model as current-page chat:

```text
user-triggered only
sensitive-page confirmation
tool-card disclosure
session-only context
no full URL upload
no persistence unless separately confirmed
region-only screenshot metadata in the current text-only flow
image-byte upload only after a separate confirmation-gated vision flow
```

## 6. Agent Tool Registry

The Sidebar Agent should have a formal tool list. Tools are not model powers by themselves; they are validated local capabilities the model may request or the router may call.

### 6.1 Read-only tools

| Tool | Purpose | Reads page body? | Confirmation |
|---|---|---:|---|
| `get_current_tab_metadata` | active tab title/hostname/path/state | No | No |
| `get_current_run_snapshot` | latest groups, tabs, duplicates, AI status | No | No |
| `list_groups` | group names, tab counts, colors | No | No |
| `list_tabs_in_group` | tabs in selected/current group | No | No |
| `search_tabs` | find tabs by title/hostname/path | No | No |
| `get_duplicate_review_queue` | duplicate review groups | No | No |
| `get_ai_classification_status` | DeepSeek/local/fallback state | No | No |
| `detect_current_page_site_skill` | generic site/page-type hint for current-page reading strategy | No extra page body; uses current tab metadata already in scope | User request through current-page chat |
| `extract_current_tab_visible_text` | visible text from current tab | Yes, current tab | User request + sensitive confirm |
| `extract_selected_page_region` | visible text, safe lightweight structure, and cropped screenshot metadata from one user-selected page block; image bytes are not uploaded in the current text-only flow | Yes, selected region only | User request + element picker + sensitive confirm |
| `extract_selected_tabs_visible_text` | visible text from selected/group tabs | Yes, multiple tabs | User request + tool card + cap 6 + sensitive confirm/skip |
| `summarize_visible_text_batch` | summarize already extracted texts | Already extracted | Depends on extraction |
| `render_tool_card` | show the user what tool is running and what data scope is used | No | Required before multi-tab content tools |

### 6.2 Planning tools

| Tool | Purpose | Applies browser changes? | Confirmation |
|---|---|---:|---|
| `classify_tabs_v2` | propose semantic grouping plan | No | No |
| `explain_grouping_plan` | explain why groups were chosen | No | No |
| `detect_domain_only_groups` | find weak same-domain grouping | No | No |
| `suggest_split_merge_groups` | suggest better group split/merge | No | No |
| `draft_user_rule` | propose reusable rule from correction | No | No |

### 6.3 Action tools

| Tool | Purpose | Applies browser changes? | Confirmation |
|---|---|---:|---|
| `organize_tabs` | run one-click organize | Yes | Already user action |
| `apply_group_plan` | create/update native tab groups | Yes | Apply required for chat-initiated changes |
| `move_tabs` | move existing tabs to a group | Yes | Apply required |
| `rename_group` | rename native group | Yes | Apply or direct if user explicit |
| `create_rule` | save local rule | Yes, local storage | Confirm in chat copy |
| `focus_tab` | activate existing tab | Yes | User click / explicit request |
| `undo_last_action` | undo latest organize/group action | Yes | Explicit request |
| `restore_closed_duplicates` | reopen safely closed duplicate tabs | Yes | Explicit request |
| `open_dashboard` | open dashboard | Yes | Explicit request |

Rejected tool types:

```text
close_non_duplicate_tabs
read_all_tabs_in_background
upload_full_urls
store_page_summaries_in_cloud
delete_workspace_without_confirmation
```

## 7. Agent Orchestration

### 7.1 Intent router

```text
User message
→ classify intent
→ choose context scope
→ choose allowed tools
→ run read-only tools first
→ ask confirmation when needed
→ produce answer or action draft
→ Apply / Cancel for browser-changing plans
```

### 7.2 Context routing examples

User:

```text
Why are these tabs grouped together?
```

Agent:

```text
Use C0 metadata:
- titles
- hostnames
- paths
- current group state

Answer with evidence from metadata.
Offer deeper read if useful.
```

User:

```text
What are the pages in this group actually saying?
```

Agent:

```text
This asks for page content.
Render a tool card for reading up to 6 visible pages from the group.
Then use C2 for the answer.
Skip or ask extra confirmation for sensitive/restricted tabs.
```

User:

```text
Don't group by website. Group by what I am working on.
```

Agent:

```text
Use classify_tabs_v2 from C0 metadata first.
Produce preview:
- new project/task groups
- affected tab count
- no tabs closed
[Apply] [Cancel]
```

## 8. UX Requirements

### 8.1 Context bar

The composer context should clearly show scope:

```text
Current tab · Settings | Database | ai-music
Group · Supabase Production Database · 4 tabs
Selected tabs · 6 tabs
All tabs · 48 tabs metadata only
```

### 8.2 Tool-card depth disclosure

When the user asks for group/page content and the Agent only has metadata:

```text
Tool: Read group pages
Scope: Product Planning · 6 tabs
Data: visible text only
Storage: session-only

Reading...
```

### 8.3 Tool transparency

Keep this lightweight, not a debug panel. The tool card should look like an assistant message attachment, not Settings:

```text
Using titles + paths
Using current page text
Reading 6 selected pages
Skipped 2 protected pages
```

### 8.4 Deep answer quality bar

A "deep" answer must include:

```text
- direct answer
- supporting evidence from visible text or metadata
- uncertainty when context is missing
- suggested action when useful
- no invented page facts
```

## 9. Privacy And Safety Requirements

CONFIRMED:

```text
- One-click classification does not read page bodies by default.
- Current-tab page chat reads visible text only after user request.
- Current-group / selected-tabs content reading is allowed by default only after the user initiates a group/selected-tabs question or content-assisted regrouping request.
- Multi-tab content reads are capped at 6 tabs in private beta.
- Multi-tab extracted context is session-only and is not persisted.
- Tool cards disclose the running tool, scope, data type, skipped count, and skipped reason breakdown.
- Optional site access may be requested only for the specific http/https origins in the user-triggered batch, and granted origins are released after the answer.
- Full URL is not sent to cloud AI by default.
- AI action drafts require validation and Apply.
```

DO NOT BUILD YET:

```text
- Automatic background page-body extraction during one-click organize.
- Persistent local multi-page summary cache.
- Cloud storage of page text, summaries, or workspace memory.
- Default broad <all_urls> / all-site access.
- Browser history analysis.
```

## 10. Implementation Phases

### Phase 1: Metadata Semantic Classification V2

CONFIRMED BY IMPLEMENTATION / FIRST SLICE:

```text
- add derived metadata features: artifact type, workflow, project candidate, domain category, intent, sensitive hint, domain-only risk
- update classification prompt/schema to prefer project/workflow/artifact/intent over domain
- penalize weak domain-only group names during AI output validation
- keep classification evidence from metadata in validated reasons
- update smoke fixtures for project/task classification
- surface split suggestions in the Sidebar completion message as a folded metadata-only refinement note
- merge AI-provided `splitSuggestions` with conservative local metadata split suggestions when a created group contains multiple projects/workflows
- surface merge suggestions in the same folded Sidebar refinement note when small groups share the same project/workflow metadata
- merge AI-provided `mergeSuggestions` with conservative local metadata merge suggestions
```

Still pending:

```text
- real-profile classification QA against messy office tabs
```

Expected impact:

```text
Better grouping without changing privacy defaults.
```

### Phase 2: Tool Registry And Agent Router

CONFIRMED BY IMPLEMENTATION / FIRST SLICE:

```text
- define local tool registry
- pass compact tool registry into the DeepSeek metadata Agent prompt
- validate action tool outputs
- preserve Apply-required boundaries for browser-changing tools
```

Still pending:

```text
- richer router coverage for ambiguous multi-turn follow-ups
- real Chrome runtime QA for group/selected-tabs content questions
```

Expected impact:

```text
Agent feels less like a chatbot and more like a browser workspace operator.
```

### Phase 3: Group / Selected Tabs Content Read

CONFIRMED BY IMPLEMENTATION / FIRST SLICE:

```text
- render a tool card before reading multiple visible pages
- cap tab count at 6 per batch
- skip sensitive/protected/internal pages by default
- answer group/selected-tabs questions from capped visible text with DeepSeek when configured
- fall back to local visible-text / metadata summary when DeepSeek is unavailable or invalid
- render final group/selected-tabs answers as Markdown-style assistant messages; keep read/skipped counts, skipped reason chips, and visible-text/session-only disclosure inside the lightweight tool state
- when every tab is skipped/unreadable, mark the tool result as metadata-only, state that no page body was read/sent/stored, and give a concrete retry path instead of pretending to summarize page contents
- send no full URLs to the multi-tab Page Agent
- validate AI tab summaries against real readable tab IDs
- keep extracted multi-tab context out of persistent storage
- reuse the same current-group / selected-tabs scope for natural follow-up questions within the sidebar session
- pass up to 10 local context Q/A turns to the multi-tab Page Agent for follow-up reference resolution
- verify selected-tabs tool-card rendering and follow-up routing in real Chrome runtime smoke with a temporary synthetic profile
- verify capped visible-text extraction from synthetic HTTP pages in real Chrome runtime smoke using a temporary fixture host grant
```

Still pending:

```text
- real Chrome runtime QA or manual QA for accepting the native optional per-site permission prompt; the automated synthetic HTTP extraction path uses a temporary fixture host grant because CDP cannot accept the browser-native prompt inside the extension page target
- optional sensitive-page extra confirmation for multi-tab batches; current first slice skips sensitive tabs
```

### Phase 4: Content-Assisted Regrouping

CONFIRMED BY IMPLEMENTATION / FIRST SLICE:

```text
- user asks to improve grouping using page content
- Agent renders a tool card and reads capped group/selected pages
- DeepSeek/OpenAI-compatible provider can produce a validated regrouping preview from capped visible text
- fallback local visible-text keyword grouping can produce a safe preview if AI is unavailable
- the preview renders as a plain assistant message with Markdown-style proposed groups, reasons, matched tabs, and Apply / Cancel
- AI tab IDs are validated against real readable tabs; invented or duplicate IDs are dropped
- user clicks Apply before native Chrome groups change
- no tabs are closed
- Undo remains available after Apply
- real Chrome runtime smoke verifies synthetic HTTP visible-text extraction, regroup preview rendering, Apply, and native Chrome group creation using a temporary fixture host grant
```

Still pending:

```text
- real Chrome runtime QA or manual QA for content-assisted regrouping after accepting the native optional per-site permission prompt
```

### Phase 5: Site Skill Hints

CONFIRMED BY IMPLEMENTATION / FIRST SLICE:

```text
- GitHub PR, GitHub issue, GitHub CI run, cloud console, Linear/Jira issue, design file, and collaboration document pages get generic site-skill hints.
- Current-page Page Agent receives the hint only after the user asks a current-page question.
- The hint guides visible-text answers by page type: code review, issue triage, CI debugging, cloud settings review, project management, design review, or document synthesis.
- The hint does not include owner, repo, issue key, PR/run number, design/document ID, project slug, full URL, query/hash, hidden DOM, or additional content.
- Local smoke verifies the payload boundary.
```

Still pending:

```text
- deeper site skills that can parse structured PR/diff views, issue fields, CI logs, design regions, docs tables, and dashboard tables
- richer per-site extraction such as selected page blocks, screenshots, or structured PR/diff views
- real-profile QA on GitHub PR pages with private repositories
- real-profile QA on Linear/Jira, Figma, cloud consoles, and Google Docs/Notion/Coda pages
```

### Phase 6: Persistent Local Summary Memory

DO NOT BUILD YET:

```text
- do not persist group/selected-tabs summaries yet
- keep extracted multi-tab context session-only
- revisit persistent local cache after a separate user decision
- never cloud sync by default
```

## 11. Acceptance Criteria

### Classification quality

```gherkin
Given tabs from the same domain represent different user jobs
When the user organizes tabs
Then Classifier V2 should split them by project/task when metadata supports it
And group names should not be simple hostnames unless the hostname is the job
And each AI group should include evidence from title/hostname/path
```

### Metadata-only privacy

```gherkin
Given the user clicks one-click organize
When classification runs
Then no page body is read
And no full URL is sent to AI
And AI payload contains only minimized metadata and derived metadata features
```

### Site-skill privacy

```gherkin
Given the user asks a current-page question on a common work page
When the Page Agent payload is built
Then it may include a generic site-skill hint
And it does not include owner, repo, issue key, PR/run number, design/document ID, project slug, full URL, query string, hash, hidden DOM, or additional page content beyond visible text
And the hint is used only as reading guidance, not as evidence
```

### Agent tool behavior

```gherkin
Given the user asks why tabs are grouped
When metadata is sufficient
Then the Agent answers from group/title/path evidence
And does not claim to have read page bodies
```

### Group content tool card

```gherkin
Given the user asks what pages in a group actually say
When group page content has not been read
Then the Agent renders a tool card before reading visible text from up to 6 group tabs
And sensitive, restricted, or unreadable pages are skipped or require extra confirmation
And extracted context is kept session-only
```

### Action safety

```gherkin
Given the Agent proposes regrouping tabs
When the plan changes native Chrome groups
Then the Sidebar shows an Apply / Cancel draft
And no tabs are closed
And Undo remains available after Apply
```

### Content-assisted regrouping privacy

```gherkin
Given the user asks to regroup selected/group tabs by page content
When the Agent builds the regrouping preview
Then it reads only capped visible text after the user-triggered request
And sends no full URLs, query strings, hashes, browser history, saved workspace contents, or cloud memory
And validates proposed tab IDs against the readable tab set before rendering Apply
```

## 12. Open Questions

| ID | Question | Recommendation | Status |
|---|---|---|---|
| ACCT-001 | Should private beta allow current-group / selected-tabs visible text reading? | Yes, user-triggered only, default enabled, tool-card disclosure, sensitive skip/confirm. | CONFIRMED BY USER |
| ACCT-002 | What batch cap should group content reading use? | 6 tabs in beta, 10 tabs later if quality/cost is acceptable. | CONFIRMED BY USER |
| ACCT-003 | Should content-assisted regrouping be P0 beta or P1? | Build in current beta after metadata V2/tool registry foundation. | CONFIRMED BY USER |
| ACCT-004 | Should local summaries be cached after group reads? | No persistent cache for now; session-only context. | DECIDED BY USER |
| ACCT-005 | Should tool usage be visible in the UI? | Yes, a compact tool card in the assistant message flow. | CONFIRMED BY USER |
