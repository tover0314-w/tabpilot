# AI Browser Layer PRD Review

Status: DISCUSSION DRAFT  
Source: `/Users/bytedance/Downloads/prd(1).md`  
Source date: 2026-06-12  
Reviewed against: TabMosaic AI harness v0.3

## 1. Short Take

The imported PRD is valuable, but it should not replace the current TabMosaic PRD as-is.

It describes a broader product: a Chrome Extension that turns Chrome into an **AI Browser Layer** through New Tab Mission Control, Side Panel, Command Palette, Spaces, Skills, Safe Assistant Actions, and local-first memory.

TabMosaic's current confirmed north star is narrower and sharper:

```text
Click extension icon
→ organize all normal browser windows into real Chrome native tab groups
→ safely close exact/tracking duplicates
→ open Sidebar Agent for explanation, Undo, Restore, and chat
```

Recommended interpretation:

```text
Keep TabMosaic's one-click native-tab-group aha as P0.
Use the imported PRD as a P1/P2 expansion map for "AI Browser Layer for Chrome".
Do not move New Tab Mission Control, Skills, Command Palette, Ollama, history, or cloud sync into MVP without confirmation.
```

## 2. Strong Ideas To Absorb

### 2.1 Plugin Feasibility Boundaries

The PRD's L1/L2/L3/L4 feasibility model is useful and should be absorbed into technical/product planning:

| Level | Meaning | Good use in TabMosaic |
|---|---|---|
| L1 | Stable extension APIs | tabs, tabGroups, sidePanel, storage |
| L2 | Possible with user permission | current-page and selected-tabs visible text |
| L3 | Possible but not MVP-safe | background indexing, history, guided web actions |
| L4 | Not extension-MVP feasible | native tab strip redesign, full omnibox replacement, CDP/debugger agent |

This matches TabMosaic's current trust model and helps prevent overpromising "AI browser" capabilities that a Chrome extension cannot reliably provide.

### 2.2 Browser Context First

The imported PRD's strongest product insight is:

```text
The moat is not "chat with this page".
The moat is browser context: tabs, groups, windows, selected pages, workspace, and safe actions.
```

This aligns with the current Agentic Classification and Context Tools direction.

### 2.3 Safe Assistant Actions

The Safe Assistant Actions model is compatible with TabMosaic:

```text
observe context
→ explain what data will be used
→ propose a plan
→ Apply / Cancel for browser-changing actions
→ log what happened
→ keep Undo / Restore available
```

Good additions for future specs:

- risk level per tool
- action log visible to the user
- hard blocklist for click/type/submit/purchase/send/delete
- prompt-injection guard for page content
- stop/cancel for long-running Agent tasks

### 2.4 Spaces As Future Workspaces

The imported PRD's "Space" is very close to TabMosaic's "Workspace".

Recommended naming decision:

```text
Use "Workspace" in TabMosaic docs unless the user later chooses "Space".
Treat Space ideas as input for Workspaces, Tab Knowledge, and Dashboard Pro.
```

### 2.5 Skills As Packaged Workflows

The imported PRD's Skills system is not MVP, but it gives a useful long-term product direction:

- Compare Open Tabs
- Research Brief
- GitHub Repo Summary
- Shopping Comparison
- Paper Reading
- Tab Cleanup Advisor
- Draft from Sources

Recommended scope:

```text
Do not build a skill marketplace in MVP.
Use a few built-in "guided workflows" later as Pro retention hooks.
```

## 3. Conflicts With Current Confirmed Direction

### 3.1 Product Name

Imported PRD uses:

```text
TabMind / AI Browser Layer
```

Current harness uses:

```text
TabMosaic AI
```

Decision impact: brand, domain, SEO, store listing, product copy.

Recommendation:

```text
Keep TabMosaic AI for now.
Use "AI Browser Layer" as positioning language, not product name.
```

Status: CONFIRM if user wants to rename.

### 3.2 Primary Entry

Imported PRD makes New Tab Mission Control the main entry.

Current confirmed P0 makes toolbar click the main entry:

```text
Click extension icon → organize immediately → sidebar opens.
```

Decision impact: product aha, permissions, onboarding, information architecture, implementation scope.

Recommendation:

```text
Do not move New Tab Mission Control into P0.
Consider it a P1/P2 optional Mission Control mode if user testing shows Dashboard is not enough.
```

Status: CONFIRM before changing.

### 3.3 Apply Flow

Imported PRD says AI grouping suggestions should be previewed before applying.

Current confirmed TabMosaic P0 says one-click organize should apply native groups immediately, because the visible top tab bar transformation is the aha moment.

Recommendation:

```text
Keep P0 auto-apply for grouping because it is reversible.
Use preview/Apply for chat-initiated regrouping, content-assisted regrouping, and medium/high-risk actions.
```

Status: existing P0 is confirmed; changing it requires confirmation.

### 3.4 MVP Size

Imported MVP includes New Tab, Spaces, current window summary, selected-tabs compare, provider setup, local snapshots, source map, privacy center, data dashboard, and more.

Current TabMosaic MVP is already focused on:

- one-click native grouping
- safe duplicate cleanup
- Sidebar Agent
- current-page chat
- minimal Dashboard Smart Groups
- selected-tabs/current-group context tools first slice

Recommendation:

```text
Do not expand MVP to the imported PRD's full scope.
Split imported ideas into P1/P2 roadmap items.
```

Status: CONFIRM before expanding MVP.

### 3.5 Language Strategy

Imported PRD says MVP supports Chinese and English.

Current harness says MVP visible UI is English-only, with Chinese locale resources preserved for later.

Recommendation:

```text
Keep English-only visible UI for private beta unless user re-confirms bilingual MVP.
```

Status: existing English-only direction is decided.

### 3.6 Persistent Page Summaries

Imported PRD proposes local snapshots, summaries, Space notes, source maps, and optional embeddings.

Current confirmed boundary for group/selected-tabs content:

```text
session-only, not persisted
no cloud summary storage
persistent local cache requires separate confirmation
```

Recommendation:

```text
Keep current session-only multi-tab context.
Treat persistent local summaries as P1/P2 and confirm before building.
```

Status: CONFIRM before persistence.

### 3.7 Open Source Strategy

Imported PRD suggested a possible open-core strategy.

Current harness now confirms full open-source/public repo direction.

Updated recommendation:

```text
Use open source as trust and growth strategy.
Use BYOK as the default model-control story.
Keep license, repo launch timing, and hosted service boundaries as explicit decision gates.
```

Status: OPEN SOURCE CONFIRMED BY USER. LICENSE CONFIRM.

## 4. Recommended Integration Plan

### Now

Keep current source of truth:

```text
01_PRODUCT/01_PRD.md
02_FEATURE_SPECS/01_ONE_CLICK_AUTOPILOT.md
02_FEATURE_SPECS/04_SIDEBAR_AGENT.md
02_FEATURE_SPECS/05_DASHBOARD.md
02_FEATURE_SPECS/06_TAB_CHAT.md
02_FEATURE_SPECS/12_AGENTIC_CLASSIFICATION_AND_CONTEXT_TOOLS.md
```

Add imported PRD ideas as discussion/roadmap input, not as confirmed MVP changes.

### Next Product Docs To Update After Confirmation

If the user agrees with this interpretation:

```text
01_PRODUCT/02_PRODUCT_STRATEGY.md
  Add "AI Browser Layer for Chrome" as long-term positioning language.

04_TECH/01_TECH_ARCHITECTURE.md
  Add plugin feasibility levels L1/L2/L3/L4.

02_FEATURE_SPECS/12_AGENTIC_CLASSIFICATION_AND_CONTEXT_TOOLS.md
  Expand Safe Assistant Actions, action log, prompt-injection guard, and skill-like workflows.

05_PROJECT/01_ROADMAP.md
  Add New Tab Mission Control, Command Palette, Workspaces/Spaces, and Skills as P1/P2/P3 candidates.

05_PROJECT/04_RISKS.md
  Add New Tab takeover risk, extension feasibility overpromise risk, prompt injection, and open-source license risk.
```

## 5. Decision Gates

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| ABL-001 | Should TabMosaic reposition as "AI Browser Layer for Chrome"? | Use as long-term positioning, not P0 replacement | CONFIRMED BY USER |
| ABL-002 | Should New Tab Mission Control become a main entry? | P1/P2 optional mode, not P0 | CONFIRM |
| ABL-003 | Should P0 organize become preview-before-apply? | No. Keep one-click auto-apply with Undo | CONFIRM if changing |
| ABL-004 | Should Workspace be renamed to Space? | No. Keep Workspace for now | CONFIRM if changing |
| ABL-005 | Should persistent local page snapshots/summaries be built? | Later, separate privacy decision | CONFIRM |
| ABL-006 | Should MVP include Ollama/local model? | Not MVP; consider P1/P2 | CONFIRM |
| ABL-007 | Should Command Palette and Context Menu enter MVP? | Not MVP; consider P1/P2 | CONFIRM |
| ABL-008 | Should the project be open source? | Yes. Open-source + BYOK is now the growth and trust strategy | CONFIRMED BY USER |
| ABL-009 | Which open-source license should be used? | Decide before adding LICENSE / public repo launch | CONFIRM |

## 6. My Recommended Answer To The PRD

Use this PRD as a strategic expansion map, not an MVP rewrite.

The clean product stack becomes:

```text
P0: One-click native tab organization
P0: Sidebar Agent as control/chat layer
P0/P1: Minimal Dashboard Smart Groups
P1: Deeper selected-tabs/group chat and content-assisted regrouping
P1/P2: Workspace history / restore / ask workspace
P2: New Tab Mission Control if users need a higher-frequency home
P2/P3: Command Palette, Skills, Safe Assistant Actions, local model, prompt-injection hardening
```

This preserves the current aha moment while giving the product a larger story:

```text
TabMosaic starts as the fastest way to clean your work tabs.
Over time it becomes an AI Browser Layer for Chrome.
```

## 7. Tabbit Feature Learning Notes

Date: 2026-06-12  
Sources reviewed:

- Tabbit official home page
- Tabbit quick start guide
- Tabbit AI browser comparison pages

### 7.1 What Tabbit Emphasizes

Tabbit presents itself as an agentic AI browser, not a Chrome extension.

Observed feature themes:

```text
- unified home search box for browse / search / chat / agent / skills
- @ context references for tabs, tab groups, favorites, local files, screenshots, and highlights
- / skills menu for reusable workflows
- Agent mode for complex tasks
- Smart Tab Group with one-click intelligent organization
- Vertical Tabs for a cleaner tab layout
- Tab Group management, preview, and chat
- multi-model switching inside the browser
- local-first / privacy-oriented messaging
- Skills as packaged repeatable workflows
```

Key product lesson:

```text
Tabbit turns tab organization into one mode inside a broader AI browser workspace.
TabMosaic should learn the mode structure and context model, but should not pretend a Chrome extension can fully replace browser chrome.
```

### 7.2 User Feedback From This Discussion

USER LEANING / NEEDS FINAL CONFIRMATION:

```text
1. New Tab Mission Control should not become the main entry.
2. Clicking the extension icon should not immediately force one action only.
3. The click entry should open a compact dropdown / action menu.
4. Primary menu actions should include:
   - Smart Organize
   - Switch to Vertical Tabs
5. This should learn from Tabbit's Smart Tab Group / Vertical Tabs pattern.
6. P0 organize should still not become preview-before-apply.
7. "AI Browser Layer for Chrome" can become a stronger positioning direction.
8. Spaces / Skills / Command Palette are recognized as useful, but should not be pushed into MVP.
```

CONFIRMED BY USER:

```text
Toolbar click should open a compact action menu.
Smart Organize and Vertical Tabs are the two primary actions.
```

### 7.3 Recommended TabMosaic Adaptation

Because TabMosaic is a Chrome extension, "Switch to Vertical Tabs" should mean:

```text
Open the Side Panel in Vertical Tabs mode.
Show the user's real open tabs in a clean vertical list.
Mirror native Chrome tab groups and allow focus/search/manage.
Do not claim to hide or replace Chrome's native top tab strip.
```

Recommended extension icon click behavior:

```text
Click TabMosaic icon
→ compact popup / dropdown opens
→ user chooses:
   Smart Organize
   Vertical Tabs
   Chat with Current Page
   Dashboard
```

Smart Organize path:

```text
User clicks Smart Organize
→ open Sidebar Agent
→ run one-click organization
→ apply native Chrome tab groups automatically
→ show result as an assistant message
→ keep Undo / Restore
```

Vertical Tabs path:

```text
User clicks Vertical Tabs
→ open Side Panel in vertical tab mode
→ show current browser tabs/groups as a calm list
→ let user search, focus, inspect, and start group/tab chat
→ no automatic grouping unless the user clicks Smart Organize
```

### 7.4 Product Tradeoff

This changes the original P0 "click icon equals organize" into:

```text
click icon equals choose the tab workspace mode
Smart Organize remains one click inside that menu
```

Upside:

```text
- safer and less surprising for users
- supports both "clean my browser now" and "show me vertical tabs" jobs
- closer to Tabbit / Arc-like mental model
- creates a path for a richer AI browser layer without forcing New Tab
```

Downside:

```text
- one-click aha becomes two clicks
- implementation has changed from action.onClicked to popup/menu architecture
- Chrome default_popup means action.onClicked will no longer fire directly
- product copy must be adjusted from "click once" to something like "Open TabMosaic, then organize or switch views"
```

### 7.5 New Decision Gate

Decision Gate: D-028-A Toolbar Entry Menu

Current recommendation:

```text
Use a compact toolbar dropdown as the primary extension click entry.
Keep Smart Organize as the first/default action.
Add Vertical Tabs as the second primary action.
Do not make New Tab Mission Control the default MVP entry.
```

Needs confirmation:

```text
approve / change / reject
```

Status: CONFIRMED BY USER.

## 8. Page Region / Element Context Picker

The user called out another Tabbit-like feature as especially attractive:

```text
Select a specific HTML div / visible page block and use that block as AI context.
```

Tabbit's public copy describes this pattern as adding "the element you just highlighted" as context, alongside tabs, files, screenshots, and pages.

### 8.1 Why This Matters

Current-page chat can feel too broad when the page is large:

```text
- a pricing table inside a SaaS page
- a GitHub PR diff block
- a Supabase settings panel
- a dashboard error card
- a table in documentation
- a chart or generated report section
```

The user often wants to ask:

```text
Explain this part.
Summarize this table.
What should I do with this warning?
Compare this card with the other tab.
Use only this section as context.
```

Reading the whole page can be noisy and privacy-heavy. Selecting one visible block is more precise, more trustworthy, and more agentic.

### 8.2 Recommended TabMosaic Version

Feature name:

```text
Page Region Context
```

User flow:

```text
User opens Sidebar Agent on a page
→ clicks "Select region" / "Use page section"
→ content script enters element picker mode
→ hovering outlines visible blocks
→ user clicks one block
→ Sidebar shows a compact tool card:
   Tool: Read selected page section
   Data: visible text + headings + links/table structure
   Storage: session-only
→ user asks a question or the selected block becomes the next chat context
```

### 8.3 Data Boundary

Recommended first slice:

```text
Read:
- visible text from the selected element
- headings and labels inside the selected element
- table rows/cells when the element is a table or grid
- link text and hostnames, not full hrefs by default
- ARIA labels / role only when useful for understanding UI controls

Do not read:
- hidden inputs
- password fields
- form values
- cookies / localStorage / sessionStorage
- scripts / styles
- full raw HTML by default
- unrelated sibling DOM outside the selected block
```

Confirmed extension:

```text
Captured screenshot crop of the selected region.
This is user-triggered, region-only, session-only, and not persisted by default.
```

### 8.4 Product Scope Recommendation

```text
P0: Do not build yet.
P1: Build after current-page chat and selected-tabs/group chat are stable.
P1 value: lets TabMosaic feel more like a precise browser-context Agent without reading an entire page.
```

### 8.5 Open Decision

Decision Gate: D-035 Page Region Context

Current recommendation:

```text
Approve as P1 buildable.
Only user-triggered.
Session-only.
Visible text / semantic structure plus optional cropped screenshot of the selected region.
No raw HTML, full-page screenshot, fullscreen screenshot, or background screenshot by default.
Sensitive pages still require confirmation.
```

Needs confirmation:

```text
approve / change / reject
```

Status: CONFIRMED BY USER.

## 9. Additional Tabbit Features To Learn From

Tabbit has several patterns that are worth studying beyond Smart Tab Group, Vertical Tabs, and Page Region Context.

### 9.1 Feature Matrix

| Tabbit pattern | What it does | TabMosaic adaptation | Suggested priority |
|---|---|---|---|
| `@` context references | User can add tabs, tab groups, favorites, files, screenshots, highlights, or selected elements as context | Add a lightweight context picker in Sidebar composer: current tab, current group, selected tabs, selected region, workspace | P1 |
| Context attachments | Highlight text or attach screenshot/context directly to chat | Support selected text, page region, and user-triggered cropped region screenshot | P1 |
| `/` Skills menu | User runs reusable workflows from the command box | Start with a few built-in guided workflows, not a marketplace | P2 |
| Prompt to Skill | Turn a repeated prompt into a reusable skill | Later turn saved user prompts into local templates | P2 |
| Tab Group as knowledge base | Preview group content and chat with a tab group | Already aligned with current group/selected-tabs chat; strengthen group preview and citations | P1 |
| Favorites as notes | Save pages, text, images, and summaries as usable notes | Map to Workspaces / Tab Knowledge; do not build full Favorites replacement yet | P2 |
| Smart Summary hover | Hover saved content to preview summary | Useful for Dashboard/Workspace saved pages after summaries are confirmed | P2 |
| Multi-agent roles | Researcher / Operator / Writer / Analyst style separation | Do not expose multi-agent UI in MVP; use internal tool routing language only | P3 |
| Site-specific skills | YouTube, GitHub, Gmail, Papers, Reddit style workflows | Build narrow first-party workflows for office/dev research scenarios | P2 |
| Model switching | Pick models and keep context | MVP stays DeepSeek private beta; later provider picker after permissions/product decision | P2 |
| Data route transparency | Show model/provider/region/data handling | Learn the transparency pattern; show provider and data categories before sensitive AI calls | P1 |

### 9.2 Highest-Leverage Features For TabMosaic

Recommended near-term learning order:

```text
1. Toolbar dropdown entry
2. Vertical Tabs side-panel mode
3. Page Region Context
4. @ context picker in Sidebar composer
5. Group as knowledge base: preview + ask + citations
6. Built-in guided workflows for Compare Tabs / Research Brief / GitHub PR Explain
```

Why this order:

```text
Toolbar + Vertical Tabs improves the shell.
Page Region + @ context improves the chat feeling.
Group knowledge base improves the core tab-management moat.
Built-in workflows can become paid retention later.
```

### 9.3 `@` Context Picker Recommendation

Tabbit's `@` pattern is a strong interaction idea because it lets users make context explicit without opening settings.

TabMosaic version:

```text
User types @ in Sidebar composer
→ compact menu appears:
   Current tab
   Current group
   Selected tabs
   Page region
   Latest organize result
   Workspace (later)
→ user chooses context
→ composer context bar updates
→ Agent answer uses only that selected context scope
```

This should remain lightweight and not become a dense command palette.

### 9.4 Built-In Workflows, Not Skill Marketplace

Tabbit's Skill catalog is ambitious. For TabMosaic, the better first version is a small set of built-in workflows:

```text
Compare Selected Tabs
Research Brief From Current Group
Explain GitHub PR
Summarize Meeting / Notes Page
Extract Table From Selected Region
Save Group As Workspace Brief
Tab Cleanup Advisor
```

MVP should not include:

```text
skill marketplace
user-imported scripts
site MCPs
browser automation crawler
multi-agent role picker
```

### 9.5 Favorites / Highlights / Saved Pages

Tabbit turns saved web content into usable context. This is productively close to TabMosaic's future Tab Knowledge.

TabMosaic adaptation:

```text
Save page / group / selected region to Workspace
→ generate local summary only after user confirms persistence
→ show source cards in Dashboard / Workspace
→ allow "Ask this workspace" later
```

Important boundary:

```text
Do not persist page summaries or selected-region content until the user confirms local persistent memory.
```

### 9.6 Screenshot Context

Tabbit supports screenshot context. For TabMosaic, this is attractive and now confirmed as part of Page Region Context with a narrow boundary.

Confirmed boundary:

```text
User-triggered only.
Capture only the selected page region, not full screen or full page.
Use as session-only context.
Do not persist by default.
Do not run in the background.
Sensitive pages still require confirmation.
```

### 9.7 Things Not To Copy Yet

Do not copy these into current MVP:

```text
full browser replacement promise
large public skill marketplace
site MCPs
history/bookmarks import as a core promise
free unlimited model picker claims
browser-wide autonomous agent tasks
debugger/CDP-style automation
cloud sync / encrypted memory as default
```

Reason:

```text
They either require a full browser, a backend/business model, broader permissions, or much heavier safety work.
TabMosaic's current wedge is still tab organization + sidebar context agent inside Chrome.
```
