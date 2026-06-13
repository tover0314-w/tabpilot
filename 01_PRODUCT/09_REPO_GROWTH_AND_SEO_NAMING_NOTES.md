# Repo Growth And SEO Naming Notes

Status: RECOMMENDED - PUBLIC BRAND STILL CONFIRM  
Last updated: 2026-06-13  
Purpose: learn from high-star open-source AI projects such as OpenClaw and turn TabMosaic AI into a more star-worthy GitHub project without prematurely finalizing the public brand.

## 1. OpenClaw-Inspired Repo Lessons

Observed OpenClaw repo patterns:

- Strong one-line identity: personal open-source AI assistant, local/control-plane framing.
- README first screen is product-first, not internal-doc-first.
- Badge row establishes health, release, community, and license quickly.
- The repo has top-level trust files such as `SECURITY.md`, `VISION.md`, `CONTRIBUTING.md`, and `LICENSE`.
- Quick install is near the top and very short.
- Security defaults are explicit because the product touches real user surfaces.
- Highlights explain why the project is bigger than a narrow utility.
- Docs are organized by user goal, not only by folder structure.
- Community contribution paths are visible.
- Star history and social/community links create momentum cues.

What to copy in spirit:

```text
clear first-screen promise
short install path
trust files at repo root
docs by goal
security model near the top
community contribution paths
star history / project momentum section
```

What not to copy blindly:

```text
over-broad agent claims
too many channels/tools before our product is ready
remote automation claims
marketplace claims before security model exists
mascot-heavy language if it weakens the browser-product positioning
```

## 2. Current GitHub Surface Improvements

Implemented:

- README changed from harness-first to product-first.
- Badge row added: CI, Apache-2.0, Chrome Extension, BYOK, Privacy First.
- First screen now says: `Open-source AI browser layer for Chrome`.
- Added `SECURITY.md`.
- Added `VISION.md`.
- README now has install-from-source, BYOK setup, privacy model, how-it-works diagram, highlights, docs-by-goal, roadmap, repo operations, and star history.
- Repository description/topics should be set to SEO-oriented terms through GitHub repo metadata.

Still recommended:

- Add approved screenshots/GIFs after UI is user-approved.
- Add a short demo video once Chrome Store/privacy material is approved.
- Add a public docs site later if the repo gains traction.
- Add Discussions after there is enough inbound feedback.
- Add good-first-issue labels after the first contributor-ready tasks are curated.

## 3. SEO Positioning

Primary search surface:

```text
open-source AI browser extension
AI browser layer for Chrome
AI tab manager
AI tab organizer
Chrome tab organizer
native Chrome tab groups
chat with browser tabs
BYOK Chrome AI extension
DeepSeek Chrome extension
OpenAI-compatible Chrome extension
local model browser extension
```

Repository description recommendation:

```text
Open-source AI browser layer for Chrome: organize tabs into native groups, chat with pages, and use your own model.
```

GitHub topics recommendation:

```text
chrome-extension
ai-browser
tab-manager
tab-organizer
tab-groups
browser-agent
byok
deepseek
openai-compatible
local-first
productivity
```

## 4. Naming Direction

The user dislikes `tabpilot`, and the prior scan found `Tab Mosaic` as a near-name Chrome Web Store conflict. A stronger name should be:

- easier to own in search
- not only `Tab + generic noun`
- aligned with AI browser/work context, not just cleanup
- short enough for GitHub, domain, and Chrome Store
- still able to rank for tab organizer / AI browser keywords through subtitle and README copy

Do not finalize any name without real-time domain, GitHub, Chrome Web Store, social, and trademark checks.

## 5. Candidate Name Shortlist

These are brainstorming candidates only, not confirmed names.

| Candidate | Direction | SEO/brand thought | Risk |
|---|---|---|---|
| WorkTabs AI | Direct office workflow | Clear, keyword-rich, easy to understand | Generic, may be crowded |
| TabWorkbench | Browser workbench | Strong product metaphor, fits dashboard/work tasks | Longer, still tab-generic |
| BrowserLayer AI | AI browser layer | Owns the positioning phrase | Broad, may sound platform-level |
| ContextTabs | Tab context agent | Good for tab/page/group chat | Generic but descriptive |
| TabContext AI | SEO direct | Very clear for page/tab context | Generic |
| WorkContext AI | Broader than tabs | Good for office workers and browser work | Less obviously Chrome tabs |
| TabCraft AI | Organize/build metaphor | Friendly and short | Generic `Tab + noun` risk |
| Tabridge AI | Tabs + bridge/context | More distinctive coined name | Needs pronunciation check |
| Navo AI | Navigation/workflow feel | Short coined name, easier to own | SEO needs subtitle support |
| OrbiTab | Workspace/orbit metaphor | Distinctive | May feel playful |
| ContextFlow | Agent workflow | Strong for page/tab reasoning | Not tab-specific |
| BrowseMind | AI browser feel | Easy to understand | Could be crowded |

Recommended next shortlist for real scan:

```text
TabWorkbench
ContextTabs
TabContext AI
WorkContext AI
BrowserLayer AI
Navo AI
```

My current preference:

```text
Use a descriptive public subtitle immediately: Open-source AI browser layer for Chrome.
Shortlist names separately.
Avoid rushing a repo rename until domain/social/store checks are done.
```

## 6. Repo Growth Playbook

### First 7 Days

- Keep README first screen strong and product-led.
- Add 3-5 issues tagged `good first issue` after curating safe tasks.
- Pin the repo once GitHub profile is ready.
- Ask early users to star only after they successfully load from source or see the demo.
- Collect grouping-quality feedback through the issue form.

### First 30 Days

- Publish one polished demo GIF/video after privacy review.
- Write one launch post: "Open-source AI browser layer for Chrome".
- Add a provider preset contribution guide and invite provider requests.
- Build one public example: "Organize 80 work tabs into native Chrome groups".
- Build one current-page chat example with synthetic content.

### Star-Worthy Hooks

- "Turn Chrome into an AI browser with your own model."
- "Native tab groups, not another dashboard."
- "BYOK: DeepSeek, OpenAI-compatible providers, Ollama, LM Studio."
- "Metadata-first by default. Page text only when you ask."
- "Agent actions are validated and Apply-gated."

## 7. Confirmation Gates

Still confirmation-gated:

- final public name
- domain purchase
- repo rename
- Chrome Web Store listing name
- support email / public identity
- privacy policy URL
- public screenshots and demo
- Product Hunt / Hacker News / social launch timing

Decision Gate: D-001-A Public brand/domain finalization remains `CONFIRM`.
