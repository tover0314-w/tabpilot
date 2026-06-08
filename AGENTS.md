# AGENTS.md — TabMosaic AI Product Harness Operating Guide

Last updated: 2026-06-08  
Harness version: v0.3  
Product: TabMosaic AI  
Audience: AI coding agents, product agents, design agents, research agents, QA agents, and any human collaborator using this harness.

---

## 0. Why this file exists

This repository is not just a collection of Markdown notes. It is a **product harness**: a structured, decision-aware workspace for turning the TabMosaic AI idea into product design, implementation, launch, and monetization work.

Any agent working inside this harness must follow three ideas:

1. **Harness before output**  
   Read the relevant harness files before producing product, design, or technical work.

2. **Confirmation before irreversible direction**  
   If a decision affects product scope, privacy, paid features, default behavior, data upload, AI provider, or tab-closing behavior, stop and ask the user to confirm.

3. **Traceability before speed**  
   Every meaningful change should be reflected in the right Markdown file, not only in a chat response.

The user explicitly required: **需要和我核对的内容一定要停下来找我确认**. Treat this as a hard operating rule.

---

## 1. Product north star

TabMosaic AI is a Chrome Extension + Sidebar Agent + Dashboard product.

The core product promise is:

> Click once. Every work tab falls into place. Continue from the sidebar.

Chinese version:

> 点一下，所有办公标签页自动归位；在侧边栏继续处理。

The P0 aha moment is not a chat answer. The aha moment is:

```text
User clicks the extension icon
→ all normal windows in the current browser get clean native tab groups
→ safe duplicate tabs are removed
→ sidebar opens and explains what happened
→ user can undo, refine, review, summarize, or chat
```

Do not accidentally turn the product back into a passive chatbot. The chatbot is the control layer. The visible top-bar organization is the primary result.

---

## 2. Non-negotiable product principles

These principles are already core to the harness and should not be changed without explicit user confirmation.

### 2.1 One-click first

The main entry is clicking the Chrome extension icon. The user should not need to type a prompt before seeing value.

### 2.2 Native tab groups as the visible result

The browser's top tab bar must show real Chrome native tab groups. The sidebar and dashboard may mirror or manage those groups, but they are not substitutes for the top-bar result.

### 2.3 Sidebar is the control center

The sidebar should show:

```text
- what was organized
- which groups were created or updated
- which duplicates were closed
- which duplicates need review
- Undo / Restore
- guided prompts
- chat with current tab / selected tabs / group / workspace
- current page summary
```

### 2.4 Dashboard is the paid long-term workspace

The dashboard is not merely a settings page. It is the paid user value center:

```text
- Smart Groups board
- Workspaces
- Rules & Memory
- Tab Knowledge
- Duplicate Center
- Templates
- Usage & Billing
- Settings
```

### 2.5 Trust beats automation

Automation should feel magical but never reckless.

Safe by default:

```text
- auto-grouping is allowed because it is reversible
- exact duplicate closing may be allowed if confirmed
- tracking-param duplicate closing may be allowed if confirmed
- hash/query/semantic duplicates should not auto-close by default
- active/pinned/audible/incognito/protected tabs must not be auto-closed
- every organize action needs Undo
- closed tabs need Restore
```

### 2.6 Privacy is a product feature

Default behavior should minimize data exposure:

```text
- default classification should use title + hostname + path where possible
- full URL upload to cloud AI is not assumed
- page text is only read when user asks for summary/chat
- multi-tab page content reading requires explicit confirmation
- cloud storage of summaries or workspace memory requires explicit confirmation
```

### 2.7 User correction becomes memory

If the user says:

```text
以后 GitHub PR 都放 Code Review。
```

The product should create a rule, apply it, and surface it in Dashboard → Rules & Memory.

---

## 3. Required reading order for agents

Before doing substantial work, read the relevant files.

### For any task

Read first:

```text
README.md
INDEX.md
00_START_HERE/01_READ_ME_FIRST.md
00_START_HERE/02_CONFIRMATION_PROTOCOL.md
00_START_HERE/03_DECISIONS_TO_CONFIRM.md
AGENTS.md
```

### For product or PRD work

Also read:

```text
01_PRODUCT/01_PRD.md
01_PRODUCT/02_PRODUCT_STRATEGY.md
01_PRODUCT/04_AHA_MOMENT.md
02_FEATURE_SPECS/01_ONE_CLICK_AUTOPILOT.md
02_FEATURE_SPECS/05_DASHBOARD.md
```

### For feature specification work

Read the matching file in:

```text
02_FEATURE_SPECS/
```

For example:

```text
Deduplication → 02_FEATURE_SPECS/03_DEDUPLICATION.md
Sidebar Agent → 02_FEATURE_SPECS/04_SIDEBAR_AGENT.md
Tab Chat → 02_FEATURE_SPECS/06_TAB_CHAT.md
Privacy → 02_FEATURE_SPECS/11_PRIVACY_CONTROLS.md
```

### For UX work

Read:

```text
03_UX/01_INFORMATION_ARCHITECTURE.md
03_UX/02_USER_FLOWS.md
03_UX/03_WIREFRAMES_TEXT.md
03_UX/04_COPYWRITING.md
03_UX/05_EMPTY_ERROR_STATES.md
```

### For technical architecture or implementation work

Read:

```text
04_TECH/01_TECH_ARCHITECTURE.md
04_TECH/02_CHROME_EXTENSION_APIS.md
04_TECH/03_DATA_MODEL.md
04_TECH/04_AI_PROMPTS_SCHEMAS.md
04_TECH/05_AI_PROVIDER_STRATEGY.md
04_TECH/06_STORAGE_SYNC.md
04_TECH/07_SECURITY_PRIVACY_IMPLEMENTATION.md
04_TECH/09_TEST_PLAN.md
```

### For commercialization work

Read:

```text
02_FEATURE_SPECS/05_DASHBOARD.md
02_FEATURE_SPECS/10_PAYWALL_BILLING.md
05_PROJECT/01_ROADMAP.md
05_PROJECT/04_RISKS.md
```

---

## 4. Confirmation Gate rules

The most important harness rule is: **do not silently decide high-impact issues.**

Use the confirmation protocol in:

```text
00_START_HERE/02_CONFIRMATION_PROTOCOL.md
00_START_HERE/03_DECISIONS_TO_CONFIRM.md
```

### 4.1 Must stop and ask the user before deciding

Stop and ask before finalizing or implementing any of the following:

```text
- Product name
- P0/P1/P2 scope changes
- changes to the confirmed default organize scope
- whether sidebar opens automatically
- whether exact duplicates are auto-closed
- whether tracking-param duplicates are auto-closed
- whether hash duplicates are auto-closed
- whether existing user-created groups may be changed
- whether full URL is sent to cloud AI
- whether page text is read automatically
- whether page summaries are stored in cloud
- whether dashboard is extension page or web app
- whether user login is required
- whether multi-tab chat is free or Pro only
- whether hosted AI is part of MVP
- pricing, lifetime deal, credits, billing limits
- analytics collection involving browsing activity
- Chrome Web Store privacy disclosures
```

### 4.2 Confirmation status labels

Use these labels in Markdown files:

```text
CONFIRMED
CONFIRMED BY DISCUSSION
RECOMMENDED
CONFIRM
OPEN QUESTION
DO NOT BUILD YET
BLOCKED UNTIL CONFIRMED
```

Do not use a confident final tone for anything marked `CONFIRM`, `OPEN QUESTION`, or `DO NOT BUILD YET`.

### 4.3 How to ask for confirmation

Ask in a short, decision-oriented format.

Good:

```text
Decision Gate: D-008 Auto-close exact duplicates
Current recommendation: Yes, but never close active/pinned/audible tabs and always provide Restore.
Please confirm: approve / change / reject.
```

Bad:

```text
I assume we should close duplicates automatically, so I will implement that.
```

### 4.4 Do not over-confirm trivial edits

You do not need to stop for:

```text
- typo fixes
- formatting
- adding cross-links
- clarifying wording without changing meaning
- updating index entries
- adding examples that do not create new product decisions
```

---

## 5. Agent roles and responsibilities

Agents may work in different modes. Pick the mode that matches the task.

### 5.1 Product Agent

Responsible for:

```text
- PRD updates
- feature scope
- prioritization
- user stories
- acceptance criteria
- monetization assumptions
- roadmap and backlog
```

Must update:

```text
01_PRODUCT/
02_FEATURE_SPECS/
05_PROJECT/
00_START_HERE/03_DECISIONS_TO_CONFIRM.md when a new unresolved decision appears
```

Must not:

```text
- silently convert recommendations into confirmed decisions
- invent pricing as final
- remove user-confirmation requirements
```

### 5.2 UX / Design Agent

Responsible for:

```text
- information architecture
- sidebar flows
- dashboard flows
- empty states
- text wireframes
- user-facing copy
```

Must update:

```text
03_UX/
02_FEATURE_SPECS/04_SIDEBAR_AGENT.md
02_FEATURE_SPECS/05_DASHBOARD.md
02_FEATURE_SPECS/06_TAB_CHAT.md
```

Must preserve:

```text
- top tab bar is the primary visible result
- sidebar explains and controls
- dashboard manages long-term paid workflows
- Undo / Restore must remain prominent
```

### 5.3 Technical Architecture Agent

Responsible for:

```text
- Chrome Extension MV3 architecture
- service worker flow
- side panel integration
- dashboard architecture
- data model
- AI provider abstraction
- storage strategy
- privacy/security implementation
```

Must update:

```text
04_TECH/
02_FEATURE_SPECS/11_PRIVACY_CONTROLS.md
05_PROJECT/02_SPRINT_PLAN.md if implementation sequencing changes
```

Must not:

```text
- add broad host permissions without confirmation
- assume <all_urls> is acceptable
- add remote code execution patterns
- assume cloud upload of URL/page text
- assume default_popup is compatible with one-click action flow
```

### 5.4 Coding Agent

Responsible for implementation once code exists.

Must do before coding:

```text
1. Read this AGENTS.md.
2. Identify the relevant feature spec.
3. Check if the feature has unresolved CONFIRM items.
4. If blocked, stop and ask the user.
5. Implement the smallest safe slice.
6. Add or update tests where applicable.
7. Update docs if behavior changes.
```

Must not:

```text
- implement DO NOT BUILD YET items
- silently change default privacy behavior
- silently make destructive actions automatic
- bypass Undo/Restore requirements
- introduce data collection not described in docs
```

### 5.5 AI Prompt / Model Agent

Responsible for:

```text
- classification prompts
- page summary prompts
- multi-tab chat prompts
- JSON schemas
- hallucination and validation handling
- prompt cost optimization
```

Must update:

```text
04_TECH/04_AI_PROMPTS_SCHEMAS.md
04_TECH/05_AI_PROVIDER_STRATEGY.md
02_FEATURE_SPECS/02_AUTO_CLASSIFICATION.md
02_FEATURE_SPECS/06_TAB_CHAT.md
```

Must enforce:

```text
- AI must never invent tab IDs
- AI must return machine-validated structured output for actions
- AI recommendations are not automatically trusted without validation
- AI must not decide to close non-duplicate tabs
```

### 5.6 QA / Test Agent

Responsible for:

```text
- acceptance criteria
- test cases
- regression tests
- privacy and safety test matrix
- Chrome extension behavior checks
```

Must update:

```text
04_TECH/09_TEST_PLAN.md
05_PROJECT/05_LAUNCH_CHECKLIST.md
02_FEATURE_SPECS/ relevant feature files if acceptance criteria change
```

Must pay special attention to:

```text
- Restore closed tabs
- Undo group operations
- active/pinned/audible tabs protection
- low-confidence duplicate review
- permission prompts
- dashboard apply-back-to-browser
```

---

## 6. Source of truth map

Use this map to decide where to write changes.

```text
High-level product decisions      → 01_PRODUCT/01_PRD.md
Strategy and positioning          → 01_PRODUCT/02_PRODUCT_STRATEGY.md
User personas                     → 01_PRODUCT/03_USER_PERSONAS.md
Aha moment                        → 01_PRODUCT/04_AHA_MOMENT.md
Open-source competitor notes      → 01_PRODUCT/05_COMPETITOR_REFERENCE_NOTES.md
One-click autopilot               → 02_FEATURE_SPECS/01_ONE_CLICK_AUTOPILOT.md
Auto classification               → 02_FEATURE_SPECS/02_AUTO_CLASSIFICATION.md
Deduplication                     → 02_FEATURE_SPECS/03_DEDUPLICATION.md
Sidebar agent                     → 02_FEATURE_SPECS/04_SIDEBAR_AGENT.md
Dashboard                         → 02_FEATURE_SPECS/05_DASHBOARD.md
Tab/tabs/group chat               → 02_FEATURE_SPECS/06_TAB_CHAT.md
Page summary                      → 02_FEATURE_SPECS/07_PAGE_SUMMARY.md
Rules and memory                  → 02_FEATURE_SPECS/08_RULES_MEMORY.md
Workspaces                        → 02_FEATURE_SPECS/09_WORKSPACES.md
Paywall and billing               → 02_FEATURE_SPECS/10_PAYWALL_BILLING.md
Privacy controls                  → 02_FEATURE_SPECS/11_PRIVACY_CONTROLS.md
UX flows and wireframes           → 03_UX/
Technical architecture            → 04_TECH/01_TECH_ARCHITECTURE.md
Chrome extension APIs             → 04_TECH/02_CHROME_EXTENSION_APIS.md
Data models                       → 04_TECH/03_DATA_MODEL.md
AI prompts and schemas            → 04_TECH/04_AI_PROMPTS_SCHEMAS.md
AI providers                      → 04_TECH/05_AI_PROVIDER_STRATEGY.md
Storage and sync                  → 04_TECH/06_STORAGE_SYNC.md
Security and privacy implementation → 04_TECH/07_SECURITY_PRIVACY_IMPLEMENTATION.md
Analytics                         → 04_TECH/08_ANALYTICS_EVENTS.md
Testing                           → 04_TECH/09_TEST_PLAN.md
Roadmap and sprint planning       → 05_PROJECT/
Sources, assumptions, research    → 06_REFERENCES/
Agent operating rules             → AGENTS.md
```

When adding a new document, also update:

```text
README.md
INDEX.md
```

---

## 7. Change management rules

### 7.1 Small doc changes

For small changes:

```text
- update the relevant Markdown file
- update INDEX.md if a file is added, renamed, or removed
- mention changed files in the final summary
```

### 7.2 Significant product changes

For significant product changes:

```text
1. Update the relevant feature spec.
2. Update PRD if the change affects overall product scope.
3. Update Decisions To Confirm if a user decision is needed.
4. Update Roadmap/Sprint/Backlog if sequencing changes.
5. Add acceptance criteria.
6. Mention unresolved decisions in final summary.
```

### 7.3 Technical behavior changes

If implementation behavior changes, update:

```text
- feature spec
- tech architecture
- data model if needed
- test plan
- privacy controls if user data changes
```

### 7.4 Privacy or billing changes

If a change affects privacy or billing, stop and ask unless the user explicitly requested it.

Then update:

```text
02_FEATURE_SPECS/10_PAYWALL_BILLING.md
02_FEATURE_SPECS/11_PRIVACY_CONTROLS.md
04_TECH/07_SECURITY_PRIVACY_IMPLEMENTATION.md
06_REFERENCES/02_ASSUMPTIONS.md
```

---

## 8. Implementation guardrails for Chrome extension work

These are product-aligned technical guardrails. If code is added later, agents should follow them unless the user confirms a change.

### 8.1 Manifest and action flow

The intended P0 flow is:

```text
Chrome action icon click
→ background service worker handles click
→ side panel opens
→ organize pipeline runs
→ native tab groups update
→ sidebar result renders
```

Do not set a traditional `default_popup` as the primary action if it prevents `chrome.action.onClicked` from firing for the one-click organize flow.

### 8.2 API expectations

Expected APIs:

```text
chrome.tabs          → tab query, move, group, close, reopen support
chrome.tabGroups     → native group title/color/collapse updates
chrome.sidePanel     → sidebar UI
chrome.storage       → settings, rules, snapshots, local state
chrome.scripting     → user-triggered page content extraction
activeTab            → current page access after user gesture
```

Avoid by default:

```text
<all_urls>
history
bookmarks
cookies
webRequest
browsingData
```

Any move toward broad host permissions is a Confirmation Gate.

### 8.3 No silent destructive operations

Never implement automatic destructive behavior without a documented rule and user confirmation.

Destructive or sensitive operations include:

```text
- closing non-duplicate tabs
- closing hash/query/semantic duplicates
- deleting saved workspaces
- deleting rules
- clearing summaries
- uploading full URL or page text
- reading multiple page bodies
```

### 8.4 Undo/Restore is mandatory

For P0 organize and safe dedupe:

```text
- save an UndoSnapshot before applying the plan
- keep closed-tab restore data
- expose Undo in sidebar result
- expose Restore closed duplicates
```

### 8.5 AI output validation is mandatory

AI output must be validated before application.

Reject or repair if:

```text
- JSON is invalid
- tab IDs are invented
- a tab appears in multiple groups unexpectedly
- group count is unreasonable
- AI proposes closing tabs
- protected tabs are included in close actions
- confidence is missing where required
```

---

## 9. Dashboard-specific rules

Dashboard exists to support paid retention and long-term workflows.

Do not reduce it to a settings page.

Dashboard should support:

```text
- viewing AI-organized groups
- adjusting groups
- applying adjustments back to the browser
- saving groups as workspaces/templates
- chatting with selected tab/tabs/group/workspace
- reviewing rules and memory
- seeing tab summaries
- billing and usage visibility
```

### Dashboard P0 vs Pro boundary

Current recommendation:

```text
P0 dashboard:
- current workspace view
- smart group board
- basic group adjustments
- apply back to browser
- basic settings

Pro dashboard:
- historical workspaces
- multi-tab chat
- group/workspace summaries
- AI memory
- advanced rules
- sync
- usage and billing
```

This boundary is not fully confirmed. Check `00_START_HERE/03_DECISIONS_TO_CONFIRM.md` before treating it as final.

---

## 10. Sidebar chat and tab chat rules

The product supports chatting with different scopes.

Valid context scopes:

```text
current_tab
selected_tabs
current_group
current_window
workspace
```

### Current tab chat

P0 includes current tab chat / summary.

Allowed actions:

```text
- summarize this page
- explain this page
- extract key points
- suggest group
- suggest keep/close/read-later
```

Reading page content requires a user-triggered action and an appropriate permission flow.

### Multi-tab chat

Multi-tab chat is currently recommended as P1 / Pro. Do not treat it as free P0 unless confirmed.

Multi-tab chat may require:

```text
- selecting tabs
- asking permission to read multiple pages
- batching extraction
- summarization cache
- AI usage metering
```

### Agent action output

Chat should not only produce prose. When the user asks to change tabs, the agent should produce an action plan:

```text
- action summary
- affected tabs/groups
- whether confirmation is required
- Apply / Cancel / Undo path
```

---

## 11. Classification and dedupe rules

### 11.1 Classification principle

Classify by task/project/intent first, not by domain first.

Good group names:

```text
AI Tab Manager Research
Chrome Extension Docs
Product Planning
GitHub PR Review
Design References
Articles to Read
Shopping
Finance
Misc
```

Weak group names:

```text
github.com
docs.google.com
youtube.com
other
websites
tabs
```

### 11.2 Classification pipeline

Expected pipeline:

```text
1. Collect tab metadata
2. Normalize URLs
3. Detect duplicates
4. Apply user rules
5. Apply learned rules
6. Apply built-in rules
7. Use AI clustering for remaining tabs
8. Validate plan
9. Save undo snapshot
10. Apply native tab groups
11. Render sidebar result
```

### 11.3 Dedupe policy

Current recommendation:

```text
exact duplicate               → may auto-close after confirmation
tracking-param duplicate      → may auto-close after confirmation
hash duplicate                → Review, do not auto-close
query duplicate               → Review, do not auto-close
semantic duplicate            → Review, P1
active/pinned/audible tabs    → never auto-close
incognito tabs                → do not process by default
```

Check decisions D-008, D-009, D-010 before implementing automatic closing.

---

## 12. Privacy and data handling rules

Agents must treat tab data as sensitive.

### 12.1 Data categories

```text
tab title             → sensitive browsing metadata
hostname              → sensitive browsing metadata
full URL              → more sensitive; may include tokens or private paths
page text             → highly sensitive; may include private content
summaries             → derived sensitive data
chat history          → sensitive user intent data
workspace memory      → sensitive behavioral/work data
```

### 12.2 Default data minimization

Recommended defaults:

```text
classification input      → title + hostname + path
full URL to cloud AI      → off unless confirmed
page text reading         → only after user asks for summary/chat
multi-page text reading   → explicit confirmation
cloud summary storage     → explicit opt-in / Pro setting
```

### 12.3 Do not collect without explicit product purpose

Do not add analytics that record full URLs, page text, or browsing history. Any analytics involving browsing activity is a Confirmation Gate and must be documented in privacy controls.

---

## 13. Testing and quality bar

Any implementation should be tested against the user trust model.

### 13.1 Must test

```text
- one-click action opens sidebar and organizes all normal windows in the current browser
- top tab bar shows native groups
- active tab remains open
- pinned tabs remain open
- audible tabs remain open
- exact duplicate handling
- tracking-param duplicate handling
- hash duplicate goes to Review
- Undo restores groups and positions as much as possible
- Restore reopens closed duplicates
- current tab summary asks for page access
- AI plan validation rejects bad IDs
- dashboard apply-back-to-browser updates real tab groups
```

### 13.2 Quality target

P0 classification target:

```text
70% tabs clearly right
20% acceptable
10% Review/Misc
0% dangerous auto-close mistakes
```

If the implementation cannot meet this, prefer a safer review flow over pretending it is automatic.

---

## 14. Documentation style rules

Keep docs usable by both humans and agents.

### 14.1 Use stable headings

Prefer headings that can be referenced later:

```text
## User Story
## Acceptance Criteria
## Decision Gate
## Open Questions
## Implementation Notes
```

### 14.2 Keep recommendations distinct from decisions

Write:

```text
RECOMMENDED: Hosted AI should use a gateway before public launch.
CONFIRM: User has not final-approved hosted AI pricing.
```

Do not write:

```text
Hosted AI will be unlimited for every user.
```

unless confirmed.

### 14.3 Preserve context

When changing a doc, avoid deleting product rationale unless it is clearly obsolete. If you remove an assumption, explain why.

### 14.4 Keep cross-links current

If adding or renaming docs, update:

```text
README.md
INDEX.md
AGENTS.md if agent workflow changes
```

---

## 15. Final response requirements for agents

When finishing a task, summarize:

```text
- what changed
- which files changed
- any decisions still needing confirmation
- where the user should start reading
- download/link if an artifact was created
```

Do not claim that a decision is final if it remains marked `CONFIRM` or `OPEN QUESTION`.

For artifact updates, provide the updated file link.

---

## 16. Example agent workflows

### 16.1 Adding a new feature spec

```text
1. Read PRD and relevant feature docs.
2. Determine whether feature is P0/P1/P2.
3. If scope is not confirmed, add to Decisions To Confirm.
4. Create feature spec in 02_FEATURE_SPECS/.
5. Add user stories and acceptance criteria.
6. Update INDEX.md and README.md if needed.
7. Mention confirmation gates in final summary.
```

### 16.2 Preparing implementation tasks

```text
1. Read feature spec.
2. Check unresolved decisions.
3. If blocked, ask user.
4. If clear, create tasks in 05_PROJECT/03_BACKLOG.md.
5. Update sprint plan if relevant.
6. Add test cases in 04_TECH/09_TEST_PLAN.md.
```

### 16.3 Changing privacy behavior

```text
1. Stop.
2. Identify what data changes: URL, title, page text, summaries, chat history, workspace memory.
3. Ask user to confirm the new default.
4. Update Privacy Controls and Security Implementation.
5. Update onboarding copy and settings copy.
6. Update Chrome Web Store disclosure notes later.
```

### 16.4 Adjusting monetization

```text
1. Read Dashboard, Paywall/Billing, and Roadmap docs.
2. Separate free aha from paid retention.
3. Mark unclear boundaries as CONFIRM.
4. Do not invent final prices unless asked.
5. Update Usage & Billing specs.
```

---

## 17. Current confirmed-by-discussion items

These items are treated as confirmed by the conversation so far, unless the user later changes them:

```text
- P0 aha moment is clicking plugin icon and seeing top tab bar organized.
- Top tab bar should show real native Chrome tab groups.
- Sidebar should open/show results, explain, guide conversation, and support tab chat.
- Dashboard should exist and is important for paid value.
- Product working name is TabMosaic AI.
- First target audience is office / knowledge workers; indie developers remain an early adopter subsegment.
- P0 language scope is English + Chinese first, multilingual later.
- P0 default organize scope is all normal windows in the current browser.
- MVP AI starts with DeepSeek API through an OpenAI-compatible provider abstraction.
- Users should be able to view organized groups in dashboard and adjust them.
- Users should be able to chat with a tab or tabs directly in sidebar.
- The harness must stop and ask user for items that need confirmation.
```

Still not fully confirmed:

```text
- final free/pro limits
- final Pro pricing
- cloud storage defaults
- domain purchase and trademark clearance
```

---

## 18. Bottom line

When in doubt, preserve the harness philosophy:

```text
Document the reasoning.
Mark uncertainty.
Ask before high-impact decisions.
Keep user trust central.
Make visible value happen in the top tab bar.
Use sidebar for explanation and control.
Use dashboard for long-term paid workflow.
Never let automation outrun reversibility, privacy, or confirmation.
```
