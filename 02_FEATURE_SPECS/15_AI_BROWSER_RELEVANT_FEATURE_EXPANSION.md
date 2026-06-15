# Feature Spec: AI Browser Relevant Feature Expansion

Status: DRAFT / REVIEW WITH USER
Date: 2026-06-14
Owner: Product + UX + Technical Architecture
Implementation status: LOCAL-FIRST FEATURES MAY BE PLANNED; NEW PERMISSIONS, HISTORY ACCESS, BOOKMARK ACCESS, CLOUD MEMORY, AND AUTONOMOUS BROWSER OPERATOR REQUIRE CONFIRMATION

Related:

- `01_PRODUCT/01_PRD.md`
- `01_PRODUCT/02_PRODUCT_STRATEGY.md`
- `01_PRODUCT/05_COMPETITOR_REFERENCE_NOTES.md`
- `02_FEATURE_SPECS/04_SIDEBAR_AGENT.md`
- `02_FEATURE_SPECS/05_DASHBOARD.md`
- `02_FEATURE_SPECS/12_AGENTIC_CLASSIFICATION_AND_CONTEXT_TOOLS.md`
- `02_FEATURE_SPECS/13_BROWSER_WORK_AGENT_SEARCH_DASHBOARD_SKILLS.md`
- `02_FEATURE_SPECS/14_MONICA_REFERENCE_AI_BROWSER_LAYER_COMMERCIAL_MODEL.md`
- `02_FEATURE_SPECS/11_PRIVACY_CONTROLS.md`
- `04_TECH/02_CHROME_EXTENSION_APIS.md`
- `04_TECH/07_SECURITY_PRIVACY_IMPLEMENTATION.md`

## 1. Executive Summary

After Monica, the more relevant reference set is the broader AI browser and advanced tab workspace market:

```text
ChatGPT Atlas, Perplexity Comet, Dia, Arc Max, SigmaOS, Opera AI, Brave Leo, Chrome AI Mode, Firefox AI tab groups, VertiTab, and Microsoft Edge Copilot.
```

The strongest product lesson is:

```text
AI browser value is not a feature list.
It is the browser remembering, organizing, comparing, resuming, and safely acting on the work context already in front of the user.
```

For TabMosaic, the next relevant capabilities should cluster around:

- making tabs become tasks;
- resuming browser journeys;
- searching across current browser work;
- comparing selected tabs and groups;
- issuing safe tab commands;
- auto-joining new tabs to the right group;
- protecting important tabs;
- saving useful outputs into local memory;
- showing source provenance;
- keeping agent actions bounded and inspectable.

## 2. Research Sources

Research date: 2026-06-14. Re-check before external claims.

Primary / official sources reviewed:

- ChatGPT Atlas launch: `https://openai.com/index/introducing-chatgpt-atlas/`
- ChatGPT Atlas release notes: `https://help.openai.com/en/articles/12591856-chatgpt-atlas-release-notes`
- Dia homepage: `https://www.diabrowser.com/`
- Arc Max: `https://arc.net/max`
- SigmaOS homepage: `https://sigmaos.com/`
- Perplexity Comet: `https://www.perplexity.ai/comet/`
- Microsoft Edge Copilot help: `https://support.microsoft.com/en-us/microsoft-copilot/getting-started-with-copilot-in-microsoft-edge`
- Chrome AI innovations: `https://www.google.com/chrome/ai-innovations/`
- Chrome AI Mode tabs/files help: `https://support.google.com/chrome/answer/17025061`
- Opera AI: `https://www.opera.com/features/opera-ai`
- Opera Tab Commands: `https://investor.opera.com/news-releases/news-release-details/opera-introduces-new-way-manage-tabs-ai-tab-commands`
- Brave Leo: `https://brave.com/leo/`
- Firefox AI-enhanced tab groups: `https://support.mozilla.org/en-US/kb/how-use-ai-enhanced-tab-groups`
- VertiTab Chrome Web Store listing: `https://chromewebstore.google.com/detail/vertitab-%E2%80%93-vertical-tab-m/chejfhdknideagdnddjpgamkchefjhoi`

Secondary sources were used only to find leads; product decisions should rely on primary/official sources above where possible.

## 3. Feature Lessons From Adjacent Products

| Product | Relevant observed pattern | Lesson for TabMosaic |
|---|---|---|
| ChatGPT Atlas | Agent mode, tab organization, browser memories, auto-organize/remove duplicates/merge tabs | Browser memory and tab organization are converging; TabMosaic should stay safer and open-source |
| Perplexity Comet | Assistant that understands, searches, shops, and delegates tasks | Build bounded research and work execution; do not jump to shopping/form automation |
| Dia | Reports, Live Work, meetings, profiles, splits, organized tabs | Dashboard can become a calm Workbench: reports, live work, meeting/workspace prep |
| Arc Max | Opt-in AI features via command bar | Keep AI features opt-in and discoverable through command/context surfaces |
| SigmaOS | Workspaces, vertical tabs, tabs as tasks, Lazy Search, Simplify | Tab-as-task and universal search are very relevant |
| Opera AI | Contextual AI over tabs/Tab Islands; tab commands with prompt-only server processing | Local tab commands can be privacy-first and very valuable |
| Brave Leo | Chat with any tab, BYOM, temporary chats, organize tabs, privacy copy | BYOK/local-first trust is a differentiator, not only a setting |
| Chrome AI Mode | Ask about tabs, images, files; session-limited temporary data | Context picker should support tabs/files/images and clearly label storage duration |
| Firefox AI tab groups | Local model suggests group names/tabs; URLs not shared | On-device/local tab intelligence should be a long-term advantage |
| VertiTab | Tree tabs, sessions, snapshots, auto-join groups, universal search, locks, suspend, context menus | Traditional tab power-user features can be selectively borrowed |

## 4. Product Fit Matrix

| Candidate feature | Fit | Phase | Why |
|---|---:|---|---|
| Tabs as tasks / Done | Very high | P1 | Directly turns tab overload into workflow completion |
| Continue Workspace / Journey Resume | Very high | P1 | Converts saved workspace into daily retention |
| Universal Browser Work Search | Very high | P1 | Find tabs, todos, collections, memos, recent runs |
| Compare selected tabs | Very high | P1 | Strong office/research use case already supported by selected-tabs context |
| Safe Tab Commands | Very high | P1 | Natural language browser control without unrestricted automation |
| Auto-add new tabs to groups | High | P1 | Keeps browser clean after first organize |
| Protected / locked tabs | High | P1 | Trust feature that prevents accidental close/move |
| Memory Relief / Sleep tabs | High | P1/P2 | Tangible value beyond grouping; must protect active/pinned/audible |
| Source provenance / citations | High | P1 | Makes AI answers trustworthy |
| Local Browser Memory | High | P1/P2 | Useful if explicit/local; risky if hidden |
| Work Brief / Morning Brief | High | P1/P2 | Dashboard retention and daily habit |
| Meeting / Focus workspace prep | Medium-high | P2 | Valuable but needs calendar/account for full version |
| Split/compare layout | Medium | P2 | Useful, but may require window/layout permissions |
| Reader/Simplify mode | Medium | P2 | Nice page experience, not core tab/workspace moat |
| Search result overlay | Medium-low | P2 optional | Can feel noisy and conflicts with minimal UI |
| Full browser operator | Low for MVP | DO NOT BUILD YET | Too risky for extension and trust |
| Browser history AI | Low until confirmed | P2/confirm | High privacy impact |
| Bookmarks manager | Low for MVP | P2/confirm | Requires new permission and broad scope |

## 5. Recommended Features

### 5.1 Tabs As Tasks

User pain:

```text
I keep tabs open because they represent unfinished work.
```

Build:

- Add `Done` / `Keep` / `Later` states to tab rows in Dashboard and Vertical Tabs.
- `Done` can:
  - close the tab after confirmation or safe setting;
  - move it to a local completed work log;
  - keep minimal metadata only;
  - create a Restore option if closed.
- `Keep` protects the tab from cleanup.
- `Later` saves the tab into Work Queue / Collection and optionally closes it.
- Sidebar command examples:
  - `mark this tab done`
  - `save these tabs for later`
  - `what tabs are still unfinished?`

Data boundary:

```text
Local tab metadata only by default.
No page text unless the user asks for a summary/checklist.
```

Why relevant:

This turns tab management into work management without adding a heavy task app.

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Dashboard tab rows expose a lightweight State menu with Done, Later, Keep, and Clear.
- Current state appears as a compact tab-row badge; the menu stays hidden until hover/focus or explicit open.
- Sidebar natural-language commands such as `mark this tab done`, `save this tab for later`, and `keep this tab` now create an Apply / Cancel safe-command preview before updating the active current-tab / selected-tabs / current-group context.
- Done is local metadata only and does not close the tab.
- Keep records user intent locally; it does not yet become a global protected-domain rule.
- Later records local state and creates a Work Queue item only after Apply, but it does not close the tab.
- Storage key: `tabmosaic.tabWorkStates`.
- Stored data is tab id, title, hostname, path, state, source, and updatedAt only. No page text, full URL, cookies, history, form values, screenshots, or cloud data are stored.
```

### 5.2 Continue Workspace / Journey Resume

User pain:

```text
I organized my tabs yesterday, but today I don't know where to continue.
```

Build:

- Dashboard `Continue` card:
  - last organized groups;
  - open todos;
  - saved collections;
  - tabs marked Later;
  - unresolved duplicate review.
- Sidebar `what should I continue?` answer.
- Workspace resume actions:
  - reopen still-restorable saved tabs if allowed;
  - focus first still-open tab;
  - ask Agent to summarize current progress;
  - create a short work brief.
- Store only local snapshots unless user explicitly saves cloud sync later.

Data boundary:

```text
No browsing history access.
Use only extension-created snapshots, todos, collections, and runs.
```

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Sidebar recognizes `what should I continue?`, `brief my browser`, `work brief`, `resume work`, and similar continue-work prompts.
- The answer is generated locally from extension-created metadata: latest tab/group snapshot, duplicate review items, Work Queue todos, saved Collections, saved workspace snapshots, and Done/Later/Keep tab states.
- It prioritizes duplicate review, open todos, Later tabs, the strongest active group, saved workspace, and saved collection context.
- The output renders as a normal assistant Markdown message with Open buttons only for still-open tab matches.
- Dashboard renders a compact `Continue` strip only when local work signals exist, then hands the user to Sidebar Work Brief or focuses a still-open local source.
- It does not read page text, full URLs, Chrome history, bookmarks, browser cookies, screenshots, hidden DOM, search provider results, or AI provider output.
- It does not close, move, restore, reopen, upload, summarize, or create anything.
- Screenshot evidence: `artifacts/ui-screenshots/dashboard-continue.png`.
```

### 5.3 Universal Browser Work Search

User pain:

```text
I know I had a tab/source/todo/memo, but I don't remember where.
```

Build:

- Local search across:
  - open tabs;
  - native groups;
  - local todos;
  - local collections;
  - saved memos;
  - latest run groups;
  - duplicate review entries.
- Sidebar command:
  - `find supabase`
  - `find my database settings tabs`
  - `search saved work for launch checklist`
- Dashboard search command palette:
  - not a big search portal;
  - small command/search input for local work objects.
- Search results can be opened, focused, sent to Sidebar context, saved, or turned into todos.

Data boundary:

```text
Local index only.
No Chrome history/bookmarks unless separately confirmed.
```

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Sidebar now treats `find ...`, `search ...`, `show ...`, and `open/focus ...` as a local Browser Work Search intent before open-ended AI fallback.
- Search covers the latest open-tab snapshot, native groups from the latest organize run, duplicate review entries, local Work Queue todos, saved Collections, saved workspace snapshots, and Done/Later/Keep tab states.
- Results render as a normal assistant Markdown message, with Open buttons only for still-open tab matches.
- The search is local-only and reads extension-created minimized metadata only.
- It does not read page text, full URLs, Chrome history, bookmarks, browser cookies, form values, screenshots, or the web.
- It does not create, close, move, restore, upload, or summarize anything.
```

### 5.4 Compare Selected Tabs

User pain:

```text
I have several pages open and need a decision, not summaries one by one.
```

Build:

- From Dashboard selected tabs or Sidebar context picker:
  - `Compare these tabs`
  - `Which option is best?`
  - `Find contradictions`
  - `Make a decision table`
- Output:
  - short recommendation;
  - comparison table;
  - confidence and missing information;
  - cited source tabs;
  - `Save as memo`, `Create todo`, `Research missing info`.

Initial workflows:

- compare docs/specs;
- compare pricing/product pages;
- compare GitHub issues/PRs;
- compare cloud settings pages;
- compare research articles.

Safety:

```text
Read up to capped visible tabs.
Skip restricted/sensitive tabs or ask confirmation.
Never use page text from unselected tabs.
```

Implementation status:

```text
FIRST SLICE DONE:
- Sidebar template and natural-language compare prompts route through `workflow: compare_selected_tabs`.
- Existing selected-tabs/current-group page-read flow is reused; no new permissions or storage keys.
- The Page Agent payload asks for recommendation, comparison rows, tradeoffs, missing information, and source notes.
- AI validation drops comparison rows that reference tabs outside the readable selected-tab context.
- Local fallback creates a metadata/visible-text comparison when the provider is unavailable.
- Sidebar renders the result as one normal assistant Markdown message with a compact comparison table and source chips.
- Explicit `Create todo` action stores a local Work Queue item with linked selected-tab metadata and a small checklist from recommendation/missing-info/tradeoffs.
- Explicit `Research missing info` action reuses the internal Agent web-search tool and sends only the generated search query to the configured search provider.

STILL PENDING:
- Save as memo.
```

### 5.5 Safe Tab Commands

User pain:

```text
I want to tell the browser what to do, but I don't want it to act recklessly.
```

Build:

- Commands:
  - group tabs;
  - rename group;
  - move selected tabs;
  - close safe duplicates;
  - mark tabs done/later;
  - protect tabs;
  - focus/open matching tab;
  - save current group/workspace.
- All destructive actions are previewed.
- Local tab matching should happen in the extension runtime.
- AI should produce an action plan, not directly call Chrome APIs.
- User sees:

```text
I found 8 likely read-later tabs.
Action: move to Reading and collapse group.
Apply / Cancel
```

Privacy note:

Opera's prompt-only tab command approach is a useful inspiration, but TabMosaic can often do better locally because it already has sanitized tab metadata and validation.

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Existing safe command drafts already support explicit move current tab, create local rule and move matching tabs, rename group, and content-assisted regrouping; native Chrome group changes require Apply.
- Sidebar Done / Later / Keep natural-language commands now render as a normal assistant safe-command message with Apply / Cancel.
- Applying a tab-state draft writes only local `tabmosaic.tabWorkStates`; Later also creates a local Work Queue item.
- Tab-state commands do not close, move, read, screenshot, summarize, upload, or mutate pages.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-safe-tab-command.png`.
- Tab-level `protect this tab` / `keep this tab` now uses the same Apply-gated Keep state. After Apply, future organize snapshots treat that tab as `user` protected, skip it during automatic grouping, and keep it safe during duplicate close planning.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-protect-tab-command.png`.
- The last Apply-gated Done / Later / Keep / Protected change can be undone locally with `undo`. Undo restores previous tab states and removes any Work Queue todo created by the reverted Later action.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-tab-state-undo.png`.
- Natural-language safe duplicate close commands such as `close safe duplicates` now create a Markdown safe-command preview with Apply / Cancel.
- The preview stores only tab IDs and minimized title/hostname/path metadata. It does not store full URLs or restore URLs.
- Apply re-scans the live browser state, closes only previewed tabs that are still exact/tracking safe-close candidates, then writes the existing Restore Closed snapshot for actually closed tabs.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-safe-duplicate-close-command.png`.

PENDING:
- User-protected groups/domains.
- Auto-add new tabs to groups.
```

### 5.6 Auto-Add New Tabs To Groups

User pain:

```text
I organized once, then five minutes later the browser is messy again.
```

Build:

- Rule-assisted auto-join:
  - if current group is active and user opens a related tab, suggest adding it;
  - if a user rule matches, auto-add if enabled;
  - otherwise show lightweight suggestion.
- Modes:
  - Off;
  - Suggest;
  - Auto for high-confidence local rules only.
- Never auto-close or move protected tabs.
- Sidebar message:

```text
I added 3 new tabs to Product Planning based on your rule.
Undo
```

Confirmation:

Changing automatic default behavior requires user confirmation. Recommended MVP mode is `Suggest`, not auto.

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / SAFE FIRST SLICE:
- Sidebar natural-language prompts such as `suggest group for this tab` render an Apply / Cancel safe-command message.
- The suggestion uses local title, hostname, path, existing native group names, and latest organize metadata only.
- It scores by task/project/workflow signals first and treats same-domain evidence as supporting context only.
- Apply moves only the current still-open tab through the existing `move_tabs` / Undo-backed path.
- It does not read page text, send full URLs, use AI/search providers, upload data, close tabs, request new permissions, or run in the background.

STILL CONFIRM:
- background listeners for newly-created tabs;
- default Suggest/Off setting;
- Auto mode for high-confidence local rules;
- any automatic move without an explicit user click.
```

### 5.7 Protected / Locked Tabs

User pain:

```text
Some tabs must not be closed or moved.
```

Build:

- Mark tab/group/domain as protected.
- Protected tabs are excluded from:
  - auto-close;
  - mark-done close;
  - bulk close;
  - auto-move unless user explicitly applies.
- Protection reasons:
  - active/pinned/audible/internal already automatic;
  - user-protected;
  - domain rule;
  - sensitive page.
- Dashboard / Sidebar exposes protection state.

Why relevant:

This is a trust multiplier. It makes automation feel safer.

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE A:
- `protect this tab` / `keep this tab` renders an Apply / Cancel safe-command message.
- Apply stores local `tabmosaic.tabWorkStates` with state `keep` and minimized tab metadata only.
- Future organize snapshots read Keep states, add protected reason `user`, skip those tabs from automatic group planning, and prioritize keeping them during safe duplicate close planning.
- This does not add host permissions, read page text, store full URLs, close tabs, move tabs, upload data, or create cloud memory.

CONFIRMED BY IMPLEMENTATION / FIRST SLICE B:
- Sidebar natural-language commands such as `protect docs.google.com domain` and `protect this group` now render an Apply / Cancel safe-command message.
- Apply stores a local `tabmosaic.userRules` rule with `type: protected` and `protectionScope: domain | group`.
- Domain protection matches hostnames and subdomains; group protection matches the current Chrome native group title.
- Future organize snapshots add protected reasons `domain` or `group`, skip matching tabs during automatic grouping, and keep them safe during duplicate-close planning.
- Apply does not move, close, read, summarize, screenshot, upload, or mutate tabs/pages.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-protect-domain-rule.png`.

PENDING:
- richer Dashboard protected-management surface beyond the existing Rules & Memory list;
- disable/edit UX for protected rules from the minimal Dashboard;
- domain/group rule suggestions from repeated user behavior.
```

### 5.8 Memory Relief / Sleep Tabs

User pain:

```text
I want fewer heavy tabs consuming memory, but I don't want to lose work.
```

Build:

- Show approximate relief using:
  - safe duplicates closed;
  - discarded/sleepable tabs count;
  - tabs saved for later;
  - hidden technical details optional.
- Actions:
  - CONFIRMED BY IMPLEMENTATION / SAFE FIRST SLICE: save likely read-later tabs locally without closing them;
  - CONFIRMED BY IMPLEMENTATION / SAFE FIRST SLICE: discard inactive tabs using browser-supported APIs after Apply;
  - CONFIRMED BY IMPLEMENTATION / SAFE FIRST SLICE: collapse inactive groups after Apply;
  - CONFIRM: save for later and close non-duplicate tabs remains unbuilt until confirmed;
  - protect active/pinned/audible tabs.
- Do not invent exact MB unless the browser exposes reliable data.

Confirmation:

Manual safe memory relief now exists as an Apply-gated Sidebar safe command. Auto-discard, background relief, and any non-duplicate auto-close / manual close-later policy still need user confirmation.

### 5.9 Local Browser Memory

User pain:

```text
I want the agent to remember useful context, not secretly track everything.
```

Build local-first memory:

- Saved memos.
- Saved collections.
- User rules.
- Completed work log.
- Manual notes.
- Saved research briefs.
- Recent organize snapshots.

Do not build by default:

- Chrome history ingestion.
- Background content watcher.
- Cloud embeddings.
- Full-page raw text memory.

Memory UI:

```text
Saved because you clicked Save.
Stored locally.
Clear anytime.
```

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- `Save memo` is available under assistant answers, current-page answers, selected-tabs/current-group answers, Compare Selected Tabs, Research Brief, and fetched-link answers.
- Saved memos are stored in `tabmosaic.savedMemos` locally and are searchable from Sidebar Browser Work Search.
- Work Brief can suggest the latest saved memo as prior AI context.
- Dashboard has a hidden/lightweight Memory view at `#memory` for explicit local saved memos and collections.
- Memory view supports local search, Focus source for still-open linked tabs, and Ask in Sidebar through a saved-source prompt.
- Memory view is not shown on the default Dashboard, does not read pages, does not call AI/search by itself, does not add storage keys, and redacts query/hash when rendering legacy URL-like memo text.
- Editable tags, cloud memory/sync, raw content memory, embeddings, and history/bookmark ingestion are not implemented.
```

### 5.10 Work Brief / Morning Brief

User pain:

```text
I open Chrome and need to know what matters now.
```

Build:

- Dashboard `Work Brief` generated from local data:
  - open groups;
  - active todos;
  - saved memos;
  - saved-later tabs;
  - duplicate reviews;
  - recently saved collections;
  - pending action drafts.
- Optional command:
  - `brief my current browser`
  - `what should I do first?`
- Output:
  - 3 priorities;
  - blockers;
  - tabs to close/later;
  - suggested next action.

No external calendar/slack/notion integration in MVP.

### 5.11 Source Provenance And Citations

User pain:

```text
AI answers are hard to trust if I cannot see which tab/page/source they came from.
```

Build:

- Every answer from page/tab/search/file context includes compact source chips.
- Source chip fields:
  - context type;
  - title/site label;
  - read status;
  - saved/not saved;
  - open/focus action when local tab exists.
- For PDFs, cite page/section when possible.
- For search, cite source hostname and snippet.
- For group answers, show read/skipped counts.

This should replace verbose privacy footnotes in normal chat.

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Current-page answers render compact source chips for context type, page/site label, read status, session-only/not-saved state, and no-full-URL boundary.
- Selected-text and selected-page-region answers reuse the same source chip renderer through their explicit `source` / tool-card metadata.
- Selected-tabs/current-group answers render read/skipped source chips from the existing Agent tool card.
- AI Agent metadata answers render tab-metadata / no-page-text / no-full-URL chips.
- Search answers keep the existing compact Sources attachment with Open / Save / Todo actions.
- Current-page source chips can focus the local tab when a local tab id is present.
- No new page reads, storage keys, permissions, analytics, cloud sync, or source persistence were added.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-chat.png` and `artifacts/ui-screenshots/sidepanel-context-tabs.png`.

STILL PENDING:
- File/PDF source chips after file/PDF context exists.
- Save/focus actions for selected-tab source chips beyond the current page.
- Citation-level page/section references for PDF/long documents.
```

### 5.12 Agent Safety Layer

User pain:

```text
I want agent features, but I do not trust browser automation blindly.
```

Build:

- Tool permission labels:
  - Read;
  - Search;
  - Save;
  - Change browser;
  - Close tabs.
- Prompt injection guard for page text:
  - page text is untrusted content;
  - page text cannot instruct the agent to ignore user/system/browser-action policies;
  - browser actions require structured validated plans.
- Action review:
  - Apply / Cancel;
  - Undo/Restore path;
  - protected tab checks.
- Sensitive action blocklist:
  - payments;
  - purchases;
  - password changes;
  - email/social posting;
  - calendar invites;
  - form submission;
  - account deletion.

This is essential before any Browser Operator-like feature.

Implementation status:

```text
FIRST SLICE DONE:
- Page Agent and multi-tab Agent payloads now include a security boundary.
- Page text is marked as untrusted source material, not agent instructions.
- Prompt-injection-like page text is detected and surfaced as a safety warning.
- Unsafe instruction-like model output is blocked before rendering.
- Tool cards show compact Allowed / Blocked / Page text is untrusted labels.

STILL PENDING:
- broader red-team prompt-injection corpus;
- local redacted Agent run transcript;
- per-tool allowlist audit for future Browser Operator-like workflows;
- host-specific sensitive-action blocklist beyond current generic blocked actions.
```

### 5.13 Additional AI-Native Capability Candidates

The next AI features should make the browser feel smarter around real work, not broader for the sake of breadth.

Use this filter:

```text
Does this help the user understand, continue, decide, save, or safely act on browser work?
If not, it should stay out of the MVP.
```

#### A. AI Triage For Open Tabs

User pain:

```text
I do not just need groups. I need to know what needs action now.
```

Build:

- After Smart Organize, optionally classify groups/tabs into:
  - `Act now`;
  - `Read later`;
  - `Reference`;
  - `Can close`;
  - `Needs review`.
- Show the triage as a normal assistant message and local Work Queue suggestions.
- Let the user apply small actions:
  - make todos;
  - mark Later;
  - protect important tabs;
  - close only safe duplicates.

Data boundary:

```text
Metadata-only by default.
Page text is read only when the user asks for deeper triage.
```

#### B. Goal Detection And Workspace Objective

User pain:

```text
I have many tabs open, but I have lost the reason they are open.
```

Build:

- Infer a short current work goal from group names, titles, hostnames, local todos, and explicit user messages.
- Examples:
  - `Prepare Supabase database setup`
  - `Review Chrome extension launch readiness`
  - `Compare AI browser competitors`
- Use the goal to:
  - name a workspace;
  - generate a Work Brief;
  - suggest the next tab to open;
  - create a todo checklist.
- The user can edit or clear the goal.

Why relevant:

This turns the product from "organized tabs" into "understood work".

#### C. Decision Brief

User pain:

```text
I have enough sources open. I need a recommendation.
```

Build:

- A focused workflow on selected tabs, saved sources, search results, visible screenshots, or files:
  - summarize options;
  - compare tradeoffs;
  - state recommendation;
  - list assumptions;
  - cite sources;
  - create follow-up todos.
- Example prompts:
  - `which provider should I use?`
  - `which competitor features should we copy?`
  - `what is the decision from these tabs?`

This is stronger than a generic summary because it produces a decision artifact.

#### D. Webpage Understanding Mode

User pain:

```text
I am on a dense SaaS/admin page and want the AI to explain what I am seeing.
```

Build:

- Current-page assistant can answer:
  - what page this is;
  - what the visible settings/fields mean;
  - what likely next steps are;
  - what looks risky;
  - what information is missing.
- For pages with unreadable internal state, answer from title/metadata and explain the limit plainly.
- For supported visible pages, read visible text and selected regions on user action.

This is the core "ordinary Chrome becomes AI browser" feeling.

#### E. Clip-To-Context

User pain:

```text
I only care about one part of the page, not the whole page.
```

Build:

- User can add context from:
  - selected text;
  - selected page region;
  - pasted link;
  - screenshot crop;
  - selected tabs;
  - file/PDF.
- Composer shows these as compact context chips.
- The agent response cites which clips were used.

This extends the confirmed page-region direction into a unified context model.

#### F. Translation And Reading Assistant

User pain:

```text
I read English and Chinese sources every day and need fast translation/explanation.
```

Build:

- Selected-text and current-page commands:
  - translate;
  - explain in simpler language;
  - summarize bilingual;
  - extract terms/glossary;
  - rewrite selected text.
- Output is copy-only in MVP.
- No automatic page replacement or form submission.

Why relevant:

This supports the confirmed English + Chinese audience without turning the UI itself into mixed-language clutter.

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Sidebar now recognizes natural-language selected-text reading commands such as `translate selected text`, `simplify selected text`, `extract glossary from selected text`, and rewrite/polish variants.
- Sidebar also recognizes current-page reading commands such as `translate this page`, `simplify this page`, `bilingual summary of this page`, and `extract glossary from this page`.
- Selected-text commands use the existing `SUMMARIZE_SELECTED_TEXT` Page Agent flow, which reads highlighted text only and renders the existing selected-text tool card.
- Current-page commands use the existing current-page Page Agent flow and sensitive-page confirmation.
- The generated prompt explicitly asks for copy-only output and no page editing, form submission, or page mutation.
- Source provenance chips show selected-text/current-page context, read/skipped state, session-only/not-saved state, and no-full-URL boundary.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-translation-assistant.png`.

STILL PENDING:
- richer current-page bilingual reading UX after real-profile QA;
- current-page translation template variant if the template picker needs it later;
- copy/save actions for translated output.
```

#### G. Review And QA Workflows

User pain:

```text
I use the browser to inspect docs, PRs, settings pages, designs, and launch checklists.
```

Build reviewed workflows:

- `Review this PR`
- `Review this settings page`
- `Check this launch doc`
- `Find missing information`
- `Turn this page into a QA checklist`
- `Summarize this design reference`

First targets:

- GitHub PR/issues/actions pages;
- docs and PRD pages;
- Supabase/Vercel/Stripe-like console pages;
- design/spec reference pages.

Constraint:

The agent can draft findings and todos. It does not submit comments, change settings, or click destructive page controls.

#### H. Agent Run Transcript

User pain:

```text
I want to trust the agent, but I need to know what it read and what it changed.
```

Build:

- Each agent run keeps a local visible transcript:
  - user request;
  - context sources used;
  - tools called;
  - skipped pages and reasons;
  - browser action plan;
  - applied changes;
  - undo/restore availability.
- Transcript is local and redacted by default.
- A user can copy a sanitized bug report.

Why relevant:

This is open-source trust made visible in the UI.

Implementation note:

```text
FIRST SLICE DONE:
- Page Agent and selected-tabs answers expose a compact `Run log` action.
- Clicking it renders one Markdown-style assistant message with request, context, provider, tools used, skipped reasons, privacy flags, safety notes, browser-change status, and Undo/Restore state.
- Transcripts are capped in local storage under `tabmosaic.agentRunTranscripts`.
- Transcript content is redacted best-effort and excluded from follow-up AI context.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-run-transcript.png`.

STILL PENDING:
- copy sanitized bug report action;
- richer action timeline for Apply-gated browser commands;
- real-profile QA that confirms no raw page text/full URLs enter transcript storage.
```

#### I. Cost And Model Router

User pain:

```text
I have my own model keys, but I do not know which model should handle which task.
```

Build:

- Local/default routing suggestions:
  - tab metadata grouping -> cheaper/smaller model or local model;
  - current page Q&A -> configured chat model;
  - selected screenshot -> vision-capable model only;
  - search synthesis -> search-capable/provider-supported path;
  - sensitive/private pages -> warn and offer local model if configured.
- UI copy:

```text
This request uses page text from 3 selected tabs and your configured model.
```

Do not overbuild a full model marketplace in MVP.

Implementation note:

```text
FIRST SLICE DONE:
- Sidebar composer picker now shows a compact Routing hint before the tool/template entries.
- The hint is derived locally from the typed draft and current Sidebar scope.
- Routes covered in the first slice: tab metadata, current-page Page Agent, selected-text, page-region / Smart Fill, selected-tabs / group, and Agent Search Tool.
- Routes covered now include tab metadata, current-page Page Agent, selected-text, page-region / Smart Fill, visible Screenshot Vision, selected-tabs / group, and Agent Search Tool.
- The hint does not switch providers, call AI, call search, read page text, read selected text, start page-region selection, capture screenshots, request permissions, write storage, upload data, move/close tabs, or mutate pages.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-model-router.png`.

STILL PENDING:
- actual multi-model automatic routing;
- local-model preference suggestions after a local endpoint is configured;
- provider cost/latency display;
- provider-side capability probing beyond conservative model-name/provider heuristics.
```

#### J. Lightweight Page Monitor

User pain:

```text
Some pages matter only when they change.
```

Possible later build:

- User explicitly marks a tab/source:
  - `watch this page`
  - `tell me if this status changes`
  - `remind me if this doc changes`
- The extension records minimal snapshots and checks only user-marked pages.

Default:

```text
DO NOT BUILD YET for MVP.
Background page reading and monitoring need separate privacy confirmation.
```

This is useful, but riskier than user-triggered chat.

#### K. Meeting / Session Prep Without Calendar Integration

User pain:

```text
Before a meeting or work session, I have related docs/tabs but no clean prep brief.
```

Build:

- User selects tabs or a group and asks:
  - `prep me for this session`
  - `make a 5-minute brief`
  - `what should I ask?`
- Output:
  - agenda;
  - key context;
  - open questions;
  - source tabs;
  - todos.

No calendar account integration in MVP.

#### L. Browser Skill Cards

User pain:

```text
I do not know what to ask the agent to do.
```

CONFIRMED BY USER: Prompt / Skill Templates are needed, but they must stay curated and product-specific.

Build a small set of built-in, reviewed prompt/skill templates as message-level suggestions:

- Clean up tabs
- Ask current page
- Compare selected tabs
- Make decision brief
- Create todo
- Save sources
- Translate selection
- Review page
- Prepare session

Each template should define:

- name;
- one-sentence job;
- allowed context types;
- tool permissions;
- prompt skeleton;
- output format;
- source/citation behavior;
- blocked actions;
- whether Apply / Cancel is required.

Initial template packs:

| Pack | Templates | Why |
|---|---|---|
| Tab cleanup | Smart Organize, Find duplicates, Save later, Protect tabs | Directly supports the core aha |
| Page understanding | Explain current page, Summarize page, Extract checklist, Find risks | Makes current-tab chat useful |
| Research | Compare selected tabs, Decision Brief, Research Brief, Search missing info | Turns many tabs into decisions |
| Writing | Rewrite selection, Draft update, Draft reply, Make shorter/more formal | Office work value without auto-submit |
| Dev/work review | Review PR, Explain issue, Check CI, Review settings page | Strong fit for early adopters |
| Reading/translation | Translate selection, Explain simply, Make glossary, Bilingual summary | Useful for English/Chinese knowledge work |

Placement:

```text
Inside the composer/context picker or as small assistant follow-up suggestions.
Not a dashboard feature wall.
```

Do not build:

- dynamic third-party skill installation in MVP;
- a public skill marketplace in MVP;
- arbitrary user scripts inside the extension;
- skills that auto-submit forms, post comments, send emails, create calendar invites, or make purchases.

Implementation status:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Sidebar composer `+` now includes a compact Templates entry.
- Templates render inside the same glass composer picker, not Dashboard and not a feature catalog.
- Built-in templates include cleanup tabs, find duplicates, review page, visual review from screenshot, compare selected tabs, decision brief, translate selection, and create todo.
- Each template is declared in code with allowed context types, tool permissions, output format, source behavior, blocked actions, and whether Apply is needed for destructive actions.
- Context-only templates hide when there is no selected-tabs/current-group context.
- Templates route through existing safe flows: Smart Organize, read-only duplicate answer, current-page visible-text read, explicit visible screenshot capture, selected-text read, selected-tabs/group context read, and local todo creation.
- No third-party dynamic skills, marketplace, arbitrary user scripts, new permissions, new storage keys, or auto-submit actions were added.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-template-picker.png` and `artifacts/ui-screenshots/sidepanel-template-visual-review.png`.
```

Context Picker update:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE:
- Typing `@` in the Sidebar composer opens the same compact context/template picker as a context-selection mode.
- `@` mode inserts a natural prompt for Current page, Selected text, Page region, Screenshot, Selected tabs/group, Search web, Decision brief, Save as todo, or a reviewed template; it does not immediately read page text, capture screenshots, call AI, upload data, or mutate browser state.
- The `+` button remains available for direct shortcut actions.
- Visible Screenshot first slice is implemented as an explicit Sidebar action. It requires a configured vision-capable OpenAI-compatible model, captures one current visible-tab screenshot only after user action, compresses it in memory, sends it session-only with title/hostname metadata, and does not store image bytes. Explicit screenshot prompts can also produce Decision Brief and Research Brief artifacts via `workflow: decision_brief` or `workflow: research_brief`. File and PDF contexts remain pending.
- Page Region cropped vision first slice is implemented for the existing user-selected region flow. When the configured model appears vision-capable, the background worker sends the cropped selected-region image as a multimodal `image_url` part together with minimized selected-region text/structure metadata; text JSON excludes the image data URL, full URL, query, and hash. Text-only models keep the earlier metadata-only region flow.
```

Research Brief update:

```text
CONFIRMED BY IMPLEMENTATION / FIRST SLICE + POLISH FIRST SLICE:
- Selected-tabs/current-group Research Brief routes through `workflow: research_brief`.
- It reuses the capped visible-text tool flow and renders findings, contradictions, gaps, next steps, and source notes as a normal assistant message.
- It exposes explicit Save memo, Create todo, and Research missing info follow-ups.
- `Research missing info` runs only after user click, uses the internal Search Tool, and renders a session-only research addendum with provider summary, useful source signals, citations, and a boundary note.
- The addendum uses provider-returned title/hostname/snippet/optional answer only; it does not open or crawl source pages, persist search results, add permissions beyond the configured search provider, or send selected-tab page text to the search provider.
- Query decomposition first slice is implemented: the explicit `Research missing info` action decomposes the brief's missing information into up to 3 focused Search Tool queries, runs them through the existing configured search provider, dedupes source results, and renders a compact addendum. It sends query text only; it does not send selected-tab page text, full URLs, screenshots, saved-source bodies, files, PDFs, or cloud memory to the search provider.
- Saved-source input first slice is implemented: natural saved-source research prompts route through `DRAFT_FROM_SAVED_SOURCES` with `workflow: research_brief`, use only explicit local saved memos/collections, and render findings, contradictions, gaps, next steps, and source notes as one assistant Markdown message. It exposes Save memo and Research missing info, but no tab-based todo action in this first slice.
- Visible-screenshot input first slice is implemented: explicit screenshot research prompts route through `SUMMARIZE_VISIBLE_SCREENSHOT` with `workflow: research_brief`, use only one current visible screenshot plus title/hostname metadata, and render findings, contradictions, gaps, recommendations, and source notes as one assistant Markdown message. It exposes Save memo and Research missing info, but no tab-based todo action in this first slice.
- File/PDF/uploaded-image context and deeper citation refinement remain pending.
```

#### M. Right-Edge Quick Access Rail

User pain:

```text
I want fast AI actions on the page without opening a heavy menu or remembering commands.
```

CONFIRMED BY USER: Learn Monica's right-side quick-entry pattern, but keep it extremely minimal.

Build:

- A slim right-edge icon rail / handle on normal webpages, enabled after the user has installed the extension and site access/user gesture allows the relevant action.
- It opens the Sidebar Agent or pre-fills context, not a separate feature-heavy panel.
- Icon-only by default with tooltips.
- Recommended first icons:
  - open chat;
  - read current page;
  - select page region;
  - translate selected text/current page;
  - save context.
- Optional later icons:
  - compare tabs;
  - create todo;
  - decision brief.

UX rules:

```text
Maximum 4 visible icons by default.
Overflow goes behind one `More` icon.
No text labels unless hovered/focused.
User can hide the rail.
The rail never appears on restricted Chrome internal pages.
The rail must not cover page controls or create layout shift.
```

Data rules:

```text
Clicking an icon selects an action/context.
It does not silently read full page text, take a screenshot, upload content, or change browser state.
The actual read/search/save/action still happens through the Sidebar Agent tool disclosure.
```

## 6. Extension Permission Impact

| Feature | Existing permissions likely enough? | Notes |
|---|---|---|
| Tabs as tasks | Yes | Uses current tab snapshot/local state |
| Continue Workspace | Yes for extension snapshots | Full browser history is not included |
| Universal local work search | Yes | Search extension-created local objects |
| Compare selected tabs | Yes, existing user-triggered page reads | Requires site access flow |
| Safe Tab Commands | Mostly yes | Pin/move/group/close within tabs/tabGroups |
| Auto-add new tabs | Mostly yes | Needs careful event handling and default off/suggest |
| Protected tabs | Yes | Local rules/state |
| Memory relief / discard | Likely yes | Verify `chrome.tabs.discard` behavior |
| AI triage / goal detection | Yes for metadata-only first slice | Page text only if user asks for deeper triage |
| Decision Brief | Yes for selected-tabs/current-group, saved sources, current-session search results, and explicit visible screenshots; file inputs pending | Source chips and context caps required |
| Research Brief | Yes for selected-tabs/current-group, saved sources, Search Tool addenda, and explicit visible screenshots; file/PDF/uploaded-image inputs pending | Source chips, no fake web-search claims, and context caps required |
| Webpage Understanding Mode | Yes for current-page visible text flow | Restricted/internal pages may only allow title/metadata |
| Clip-to-context | Mostly yes | Screenshot/vision upload depends on provider capability and confirmation |
| Translation / reading assistant | Yes for selected text/current page | Copy-only; no page rewriting by default |
| Review / QA workflows | Yes for supported visible pages | No auto-submit or destructive page actions |
| Agent run transcript | Yes | Local redacted event log only |
| Cost/model router | Yes | Uses configured provider metadata; no new provider marketplace |
| Page monitor | No / confirm first | Background reads/snapshots are privacy-sensitive |
| Session prep | Yes for selected tabs/groups | Calendar integration is out of MVP |
| Prompt / skill templates | Yes | Curated prompt/tool schemas only; no dynamic external code |
| Right-edge quick access rail | Existing activeTab/scripting paths for user-triggered actions | Content-script UI must remain optional/minimal and respect restricted pages |
| Split/compare layout | Maybe | Window layout may require extra APIs/confirmation |
| Bookmark integration | No | Requires bookmarks permission; not MVP |
| History journeys | No | Requires history permission; not MVP |
| Calendar/email workflows | No / external auth | Confirmation-gated |

## 7. UI Placement

### Sidebar

- Chat-first control surface.
- Context picker.
- Source chips.
- Action drafts.
- Quick actions only when contextually relevant.
- Prompt / skill templates as compact suggestions, not a full template catalog.

### Page Right-Edge Rail

- Optional slim icon rail inspired by Monica's quick-entry pattern.
- Opens Sidebar or attaches context to composer.
- Maximum 4 visible icons by default.
- Default visible icons: Chat, Read, Region, Save.
- Translate stays behind More until it proves frequent enough to become a primary action.
- No background read or upload on icon render.

### Dashboard

- Work Queue.
- Conditional Continue strip.
- Universal local work search.
- Collections / Memos.
- Local agent run transcripts.
- Smart Groups.
- Pending Actions.
- Rules & Protected Tabs.

### Toolbar menu

Keep minimal:

```text
Smart Organize
Vertical Tabs
Current Page Chat
Dashboard
```

Do not put the whole feature catalog in the toolbar.

## 8. Recommended Next Implementation Order

### Next Slice 1: Universal Local Work Search

Why:

- High utility.
- Low privacy risk.
- Uses existing local data.
- Helps Dashboard feel like a Workbench.

Scope:

- Search open tabs, groups, todos, collections, saved workspaces, latest run.
- Results can focus tab, open Sidebar context, create todo, save collection.
- No Chrome history/bookmarks.

### Next Slice 2: Tabs As Tasks

Why:

- Very aligned with tab overload.
- Creates daily workflow value.
- Complements existing Todo Agent.

Scope:

- Done / Keep / Later states.
- Protect / Restore.
- Dashboard and Vertical Tabs first.

Implementation status:

```text
FIRST SLICES DONE:
- Dashboard Work Queue supports done/reopen/archive, source focus, and opening Sidebar context.
- Sidebar can create local Work Queue todos from current tab, current group, selected tabs, current page checklist, search result, triage, and workspace goal flows.
- Sidebar Todo Agent polish now accepts explicit local task names and can update the latest open local todo with `rename todo to ...`, `add checklist item: ...`, and `mark first checklist item done`.
- Sidebar Todo Agent can now target a named open local todo when multiple todos exist, for example `add checklist item to launch checklist todo: confirm onboarding email copy`, `mark final QA done in launch checklist todo`, or `rename launch checklist todo to Private beta launch checklist`.
- Sidebar Todo Agent can merge the current Sidebar context into an existing local todo with commands such as `add current context to launch checklist todo`; it dedupes linked tab IDs and stores only minimized tab metadata.
- Hidden Dashboard Workbench rows now include a lightweight inline checklist editor for local todos: add item, delete item, move item up, and move item down.
- Hidden Dashboard Workbench checklist rows now support per-item local source notes through `checklistMeta[].sourceNote`, edited directly by the user and kept aligned with add/delete/reorder.
- Hidden Dashboard Workbench todos now expose `Suggest steps`, a local-only decomposition action that appends up to four checklist suggestions from existing source notes, linked tabs/sources, saved memos, and saved collections. It now prioritizes concrete action lines extracted from already-local saved memo bodies and source snippets, such as unresolved cost assumptions, QA gates, or source-of-truth notes, before falling back to generic source review items. It does not read live pages, call AI/search, or create a new storage key.
- Todo updates render as normal Markdown assistant messages, not Apply/Cancel safe-command cards.
- All updates rewrite only `tabmosaic.agentTasks` with sanitized title/checklist text, optional `checklistMeta`, optional `mergedContexts`, and minimized linked-tab/source metadata.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-todo-checklist-edit.png`, `artifacts/ui-screenshots/sidepanel-todo-targeted-merge.png`, and `artifacts/ui-screenshots/dashboard-workbench-checklist-editor.png`.

STILL PENDING:
- automatic multi-source decomposition across explicit search result bodies/files/PDFs/screenshots;
- page mutation or auto-execution, which remains blocked until separately confirmed.
```

### Next Slice 3: Compare Selected Tabs

Why:

- Makes multi-tab content reading feel useful and deep.
- Builds directly on existing selected-tabs flow.

Scope:

- Compare 2-6 selected tabs.
- Decision table.
- Source chips.
- Create todo / research missing info follow-up actions.
- Save as memo. `IMPLEMENTED FIRST SLICE`

### Next Slice 4: Continue Workspace

Why:

- Retention and daily habit.
- Turns current snapshots/todos/collections into a product loop.

Scope:

- Dashboard continue card.
- Sidebar "what should I continue?" answer.
- Work brief from local state.

Implementation note:

```text
FIRST SLICE DONE:
- Sidebar Work Brief answers `what should I continue?` from local extension state only.
- Dashboard now renders a compact `Continue` strip only when local work signals exist.
- Signals include saved workspace goal, open Work Queue todos, saved Collections, Later tab states, saved workspace snapshots, and duplicate-review candidates.
- The strip can hand off `what should I continue?` to Sidebar, focus a still-open linked task source, focus a Later tab, or open folded Duplicate Center.
- It does not read page text, full URLs, Chrome history/bookmarks, screenshots, provider/search output, cloud storage, or mutate tabs.
- Screenshot evidence: `artifacts/ui-screenshots/dashboard-continue.png`.

STILL PENDING:
- richer daily resume from confirmed workspace history;
- workspace chat;
- cloud/sync-backed journey resume, blocked by cloud-memory and hosted-plan confirmation gates.
```

### Next Slice 5: Safe Tab Commands

Why:

- Makes the agent feel active, not just analytical.
- Needs careful validation.

Scope:

- Natural-language command to preview browser action plans.
- Apply / Cancel.
- Undo / Restore.

Implementation note:

```text
FIRST SLICE DONE:
- Move / rename / regroup drafts are Apply-gated.
- Done / Later / Keep tab-state drafts are Apply-gated and local-only.
- Tab-level protect is represented by Apply-gated Keep and now affects future auto organize / duplicate-close planning.
- Local-state Undo for Done / Later / Keep / Protected is supported through `undo`.
- Safe duplicate close commands are Apply-gated, revalidated against live tabs on Apply, and use Restore Closed only after actual close.

STILL PENDING:
- Group/domain protect commands.
```

### Next Slice 6: AI Triage + Goal Detection

Why:

- Moves the product from "grouped tabs" to "understood work".
- Low permission risk when metadata-only.
- Directly feeds Work Queue and Continue Workspace.

Scope:

- After organize, generate optional `Act now / Read later / Reference / Can close / Needs review`.
- Infer one editable workspace goal.
- Create todo suggestions without auto-closing non-duplicates.

Implementation note:

```text
FIRST SLICE DONE:
- Organize-complete assistant messages now include a compact `Triage` section.
- The triage uses sanitized local run metadata only: titles, hostnames, paths, group names, active/protected state, duplicate-review counts, and safe-duplicate-close counts.
- It renders Workspace focus / Act now / Read later / Reference / Can close / Needs review as plain Markdown text.
- It explicitly states that page text was not read.
- The message exposes one explicit `Create todo` action and recognizes `make triage a todo` style commands.
- Triage todo writes one local `ai_triage` Work Queue item with at most 8 minimized linked-tab records and a metadata-only checklist.
- The message exposes one explicit `Set goal` action and recognizes `set goal: ...`, `my goal is ...`, `clear goal`, and `what is my goal` style commands.
- Workspace Goal writes one local `tabmosaic.workspaceGoal` object with sanitized goal text, source, timestamps, and `metadataOnly`.
- Work Brief prioritizes the saved workspace goal and can match still-open tabs from local metadata only.
- Saved workspace snapshots use the local workspace goal as the default snapshot name when available.
- `make goal a todo` / goal-to-task style commands create one local `workspace_goal` Work Queue item with minimized linked-tab metadata and a metadata-only checklist.
- Work Brief highlights goal-linked Work Queue items and saved memos before generic local work suggestions.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-ai-triage.png`.
- Todo screenshot evidence: `artifacts/ui-screenshots/sidepanel-ai-triage-todo.png`.
- Workspace Goal screenshot evidence: `artifacts/ui-screenshots/sidepanel-workspace-goal.png`.
- Goal todo screenshot evidence: `artifacts/ui-screenshots/sidepanel-goal-todo.png`.

STILL PENDING:
- richer workspace-goal editing UX and stronger local inference from saved work artifacts;
- deeper page-text triage only after the user asks;
- cloud/paid journey resume after confirmation;
- real-profile QA for triage quality.
```

### Next Slice 7: Decision Brief

Why:

- High office-worker value.
- Uses existing selected-tabs, saved-source, search, file, and source-chip direction.
- Gives users a finished artifact instead of another summary.

Scope:

- Selected 2-6 tabs, saved sources, or current-session Agent Search results.
- Recommendation, tradeoff table, assumptions, missing info, citations.
- Save as memo / create todos for selected-tabs/current-group briefs; saved-source briefs expose Save memo and Research missing info only in the first slice.

Implementation status:

```text
FIRST SLICE DONE + SAVED-SOURCE + SEARCH-RESULT + VISIBLE-SCREENSHOT FIRST SLICES:
- Sidebar picker/template includes Decision Brief for selected-tabs/current-group context.
- `workflow: decision_brief` reuses the capped selected-tabs/current-group visible-text tool flow.
- The AI schema asks for recommendation, decision criteria, source tradeoffs, assumptions, missing information, source notes, and next steps.
- Sidebar renders the result as one natural Markdown assistant message with compact source chips.
- Follow-up buttons can save a local memo, create a local Work Queue todo, or run the internal Search Tool for missing information after user click.
- Natural saved-source/memo/collection decision prompts route through `DRAFT_FROM_SAVED_SOURCES` with `workflow: decision_brief`, use only explicit local saved memos/collections, and render the same decision artifact as one assistant Markdown message.
- Saved-source decision exposes Save memo and Research missing info, but no tab-based todo action in this first slice.
- Search-result decision prompts and the Search card `Brief` action route through `DRAFT_FROM_SEARCH_RESULTS` with `workflow: decision_brief`, use only the current session's search-result titles, hostnames, sanitized paths, snippets, and source labels, and render the same decision artifact as one assistant Markdown message.
- Search-result decision exposes Save memo and Research missing info, but no tab-based todo action in this first slice.
- Explicit visible-screenshot decision prompts route through `SUMMARIZE_VISIBLE_SCREENSHOT` with `workflow: decision_brief`, use only one current visible screenshot plus title/hostname metadata, and render the same decision artifact as one assistant Markdown message.
- Visible-screenshot decision exposes Save memo and Research missing info, but no tab-based todo action in this first slice.
- Decision Brief missing-info follow-up now decomposes decision gaps into up to 3 focused Search Tool queries after explicit click, dedupes returned sources, and renders a session-only addendum. It sends query text only; it does not send selected-tab page text, full URLs, screenshots, saved-source bodies, files, PDFs, or cloud memory to the search provider.
- No file/PDF context, hidden DOM/off-screen page text, background crawl, automatic result-page opening, new permissions, page mutation, or cloud storage was added. Screenshot context is limited to the explicit visible-screenshot vision workflow.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-decision-brief.png`.
- Decision missing-info screenshot evidence: `artifacts/ui-screenshots/sidepanel-decision-addendum.png`.
- Saved-source screenshot evidence: `artifacts/ui-screenshots/sidepanel-saved-source-decision-brief.png`.
- Search-result screenshot evidence: `artifacts/ui-screenshots/sidepanel-search-results-decision-brief.png`.
- Visible-screenshot evidence: `artifacts/ui-screenshots/sidepanel-screenshot-decision-brief.png`.
```

### Next Slice 8: Webpage Understanding + Review Workflows

Why:

- Makes current-tab chat feel like an AI browser, not a generic sidebar chatbot.
- Strong fit for SaaS consoles, docs, PRs, settings pages, and launch QA.

Scope:

- Explain visible current page.
- Suggest risks and next steps.
- Built-in reviewed workflows: PR review, settings review, QA checklist, design/spec review.
- No auto-submit or destructive page actions.

Implementation status:

```text
FIRST SLICE DONE:
- Sidebar Review page template now routes through `workflow: review_page`.
- Natural current-page review/risk/next-step questions infer the same Page Agent workflow in background validation.
- The Page Agent schema asks for page type, risks, open questions, review checklist, and safe next steps.
- Sidebar renders the result as one Markdown assistant message with source chips and explicit `Save memo` / `Create todo` follow-ups.
- `Create todo` stores only a local Work Queue item from the derived review answer/checklist.
- Existing safe site-skill hints cover GitHub PR/issues/CI, cloud settings consoles, project issues, design files, and collaboration docs.
- No auto-submit, page mutation, background crawl, file/PDF/screenshot context, new permissions, full URL upload, cloud storage, or hosted memory was added.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-page-review.png`.
```

### Next Slice 8.5: Contextual Writing Agent

Why:

- Gives office users a concrete AI-browser moment on real work pages: turn the current page into a reply, comment, update, or follow-up without leaving the browser.
- Keeps the experience useful but safe: the assistant drafts text; the user decides where to paste/send it.

Scope:

- Current-page `contextual_writing` workflow from the Sidebar Draft response template or natural draft/reply/comment/update prompts.
- Selected-text rewrite/polish workflow from the Sidebar Rewrite selection template or natural rewrite selected text prompts.
- Selected page-region draft/rewrite workflow from natural selected region writing prompts.
- Selected-tabs/current-group project update/email/memo draft workflow from the Sidebar Draft from tabs template or natural selected-tabs/group writing prompts.
- Copy-only draft output with purpose, audience, tone, copy notes, and source grounding.
- Explicit `Copy draft` and `Save memo` actions.
- No page insertion, form submit, comment post, email send, PR approval/merge, deploy, settings change, background crawl, or cloud memory.

Implementation note:

```text
FIRST SLICE DONE + SELECTED-CONTEXT + MULTI-TAB + SAVED-SOURCE FIRST SLICE:
- Sidebar Draft response template now routes through `workflow: contextual_writing`.
- Natural current-page writing prompts infer the same workflow.
- Sidebar Rewrite selection template routes highlighted text through `workflow: contextual_writing`.
- Natural selected-text rewrite/polish prompts and selected page-region draft/rewrite prompts infer the same copy-only workflow.
- Sidebar Draft from tabs template and natural selected-tabs/current-group writing prompts route through `SUMMARIZE_CONTEXT_TABS` with `workflow: contextual_writing`.
- Natural saved-source/memo/collection writing prompts route through `DRAFT_FROM_SAVED_SOURCES` with `workflow: contextual_writing`.
- Natural saved-source/memo/collection research prompts route through `DRAFT_FROM_SAVED_SOURCES` with `workflow: research_brief`.
- Natural saved-source/memo/collection decision prompts route through `DRAFT_FROM_SAVED_SOURCES` with `workflow: decision_brief`.
- Page Agent, multi-tab Page Agent, and saved-source writing prompt/schema/validator preserve `draft`, `draftPurpose`, `audience`, `tone`, `copyNotes`, `sourceGrounding`, and `copyOnly`.
- Sidebar renders the result as one Markdown assistant message with source chips and session-only `Copy draft` action.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-contextual-writing.png`.
- Selected text screenshot evidence: `artifacts/ui-screenshots/sidepanel-selected-text-writing.png`.
- Selected-tabs/current-group screenshot evidence: `artifacts/ui-screenshots/sidepanel-context-tabs-writing.png`.
- Saved-source screenshot evidence: `artifacts/ui-screenshots/sidepanel-saved-source-writing.png`.
- Saved-source research screenshot evidence: `artifacts/ui-screenshots/sidepanel-saved-source-research-brief.png`.
- Saved-source decision screenshot evidence: `artifacts/ui-screenshots/sidepanel-saved-source-decision-brief.png`.

STILL PENDING:
- host-specific adapters;
- file/PDF/screenshot writing inputs;
- auto-insert or auto-submit flows, which remain blocked until separately confirmed.
```

### Next Slice 8.6: Smart Fill Lite

Why:

- Monica-style Smart Fill is useful when the browser page contains work rows: pricing plans, issues, leads, tasks, invoices, settings checks, feedback, or competitors.
- It makes selected page regions actionable without turning TabMosaic into an auto-filling robot.

Scope:

- User-triggered selected page-region extraction.
- Copy-only Markdown table and CSV output.
- Row classifications/tags and safe next actions.
- Optional local Work Queue checklist from extracted row actions.
- No auto-fill, page mutation, external enrichment, background crawl, full URL upload, or cloud memory.

Implementation note:

```text
FIRST SLICE DONE:
- Sidebar Smart Fill table template routes through `workflow: smart_fill_lite`.
- Natural table/row extraction prompts infer the same workflow.
- The Page Agent prompt/schema and validator preserve table title, headers, rows, row classifications, row actions, Markdown table, CSV, table notes, and `copyOnly`.
- Sidebar renders one Markdown assistant message with source chips and session-only `Copy table` / `Copy CSV` actions.
- `Create todo` stores one local Work Queue checklist derived from row actions.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-smart-fill-lite.png`.

STILL PENDING:
- richer row editing UX;
- per-row todo editor;
- search enrichment after separate confirmation;
- auto-fill or auto-submit flows, which remain blocked until separately confirmed.
```

### Next Slice 9: Clip-To-Context + Translation

Why:

- Gives users a smooth way to target exactly the content they care about.
- Supports bilingual knowledge work without making the core UI bilingual by default.

Scope:

- Selected text / selected region / pasted link / selected tabs / screenshot crop chips.
- Translate, explain, summarize, rewrite selected context.
- Copy-only output.

Implementation note:

```text
FIRST SLICE DONE:
- Sidebar composer now renders unified context chips inside the same composer surface.
- The active browser scope remains the primary context label: Current tab, Selected tabs, or Group.
- Typed extra context/tool signals render as compact chips: Link, Selected text, Page region, Screenshot, Search, or Template.
- Pasted-link chips are previews only; the link is not fetched until the user submits and chooses the existing link flow.
- Selected-text and page-region chips are previews only; they do not read highlighted text or open the region picker until the user submits/chooses the flow.
- Screenshot chips are previews only; the visible screenshot is captured only after the user submits an explicit screenshot prompt or chooses the Screenshot action.
- Search chips indicate the internal Agent Search Tool path; they do not call the search provider until the user submits.
- Screenshot evidence: `artifacts/ui-screenshots/sidepanel-composer-context-chips.png` and `artifacts/ui-screenshots/sidepanel-screenshot-vision.png`.
- Page-region vision evidence: `artifacts/ui-screenshots/sidepanel-page-region-vision.png`.

STILL PENDING:
- file/PDF attachment chips;
- richer cropped image editing/annotation;
- richer removable chips or context-editing interactions.
```

### Next Slice 10: Prompt / Skill Templates + Quick Rail

Why:

- Helps users discover what the agent can do without turning Dashboard into a feature catalog.
- Makes the browser feel AI-native on the page, while keeping Sidebar as the real control surface.

Scope:

- Curated templates for cleanup, page understanding, research, writing, review, and translation.
- Template metadata: required context, tool permissions, output format, blocked actions.
- Right-edge icon rail first slice with Chat / Read / Region / Translate / Save.
- Icons open Sidebar or attach context; they do not silently read/upload.

Implementation note:

```text
FIRST SLICE DONE:
- Curated Sidebar template picker with template metadata and existing-tool routing.
- Current-page / selected-text / selected-tabs-group / organize / duplicate-status / todo template routes.
- Visual Review template route using the existing explicit screenshot vision flow.
- Right-edge quick rail first slice with three primary actions: Chat / Page / Region.
- Quick rail More overflow first slice with Todo and Translate selected text routed into existing Sidebar flows.
- Quick rail local hide control, keyboard Escape overflow close, and collapsed/expanded accessibility state.

STILL PENDING:
- source chips for template answers;
- file/PDF templates.
```

## 9. Not Recommended Now

Do not build now:

- Full browser history journeys.
- Bookmark manager.
- Email/calendar/social automations.
- Shopping/purchase agent.
- Search result page overlay by default.
- Full Browser Operator.
- Dynamic skill marketplace.
- Cloud memory.
- Agent actions on sensitive forms.
- Background page monitors or automatic webpage change detection.
- Auto-writing into webpages, emails, social posts, comments, settings forms, or admin consoles.
- Broad connected-app integrations such as Gmail, Calendar, Drive, Slack, Notion, or CRM until account/privacy scopes are separately confirmed.
- Floating toolbars that expose a large feature catalog on every webpage.
- Dynamic external prompt/skill code execution inside the extension.

These can be revisited after the local-first Browser Workbench is clearly useful.

## 10. Decision Gates

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| D-057 | Auto-add new tabs to groups | Safe first slice implemented for user-triggered Sidebar Suggest mode; background listeners, default Suggest/Off behavior, and Auto for confirmed local rules still need confirmation | CONFIRM |
| D-058 | Tabs as tasks | Add Done / Keep / Later as local tab workflow states | RECOMMENDED |
| D-059 | Universal Browser Work Search scope | Search only local extension-created objects first; no history/bookmarks | RECOMMENDED |
| D-060 | Browser history / journeys | Do not request history permission in MVP | CONFIRM |
| D-061 | Bookmarks integration | Do not request bookmarks permission in MVP | CONFIRM |
| D-062 | Memory relief actions | Safe first slice implemented for Apply-gated discard inactive tabs, collapse inactive groups, and local Later saves; save-for-later then close non-duplicates and automatic/background relief still require confirmation; no exact MB promises | CONFIRM |
| D-063 | Protected tabs | Add user-protected tabs/groups/domains as safety layer | RECOMMENDED |
| D-064 | Safe Tab Commands | Allow validated Apply-gated tab commands; no unrestricted Browser Operator | RECOMMENDED |
| D-065 | Local/on-device tab intelligence | Prefer local models/derived metadata for grouping when practical | RECOMMENDED |
| D-066 | AI triage and goal detection | Add metadata-first `Act now / Later / Reference / Can close / Needs review` and one editable workspace goal | RECOMMENDED |
| D-067 | Decision Brief workflow | Add selected-tabs/source decision artifact with citations, assumptions, save/todo actions | RECOMMENDED |
| D-068 | Webpage understanding and review workflows | Add current-page explain/review/checklist flows; no auto-submit or destructive page actions | RECOMMENDED |
| D-069 | Clip-to-context and translation | Add selected text/region/link/file/screenshot context chips plus copy-only translate/explain/rewrite | RECOMMENDED |
| D-070 | Agent run transcript | Keep local redacted transcript of context used, tools called, actions applied, and undo/restore state | CONFIRMED BY IMPLEMENTATION / FIRST SLICE |
| D-071 | Page monitor / watch mode | Do not build in MVP; background reads and change checks require separate privacy confirmation | CONFIRM |
| D-072 | AI Browser skill card placement | Keep built-in prompt/skill templates in composer/context picker and assistant suggestions; do not add a large dashboard feature wall | CONFIRMED BY USER |
| D-073 | Right-edge quick access rail | Add a Monica-inspired minimal right-side icon rail for Chat / Read / Region / Translate / Save; no silent read/upload/action | CONFIRMED BY USER |

## 11. Plain-Language Shape

The product should feel like:

```text
My tabs are not just tabs anymore.
They are unfinished work, saved work, protected work, and completed work.

The agent can find, compare, continue, summarize, save, and safely act on that work.
It does not secretly read everything or change the browser without review.
```

This is more relevant to TabMosaic than copying generic AI assistant features.
