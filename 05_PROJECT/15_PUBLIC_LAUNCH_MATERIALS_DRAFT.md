# Public Launch Materials Draft

Status: DRAFT - DO NOT PUBLISH YET  
Decision state: CONFIRM before posting, publishing, recording, or submitting  
Last updated: 2026-06-12

This file collects the first public-facing launch materials for TabMosaic AI. It is intended for review and iteration, not immediate publication.

Current blockers before public use:

```text
final product name / domain
open-source license
public repo URL and repo boundary
support email
privacy policy URL
Chrome Web Store data disclosure
final screenshots and demo recording
real-profile manual QA
beta user feedback
```

## 1. Positioning

Primary positioning:

```text
TabMosaic AI is an open-source AI browser layer for Chrome.
It organizes messy work tabs into native Chrome tab groups and lets you continue from a sidebar agent using your own model.
```

Short positioning:

```text
Open-source AI browser layer for Chrome.
Bring your own model. Organize tabs into native groups.
```

Avoid these claims until built and confirmed:

```text
Chrome Web Store available
production public launch
hosted AI included
cloud sync included
team workspaces included
automatic background page reading
unrestricted browser automation
browser history agent
multi-tab cloud memory
```

## 2. Landing Page Draft

### Hero

H1:

```text
Open-source AI browser layer for Chrome
```

Subheadline:

```text
Click once to organize messy work tabs into real Chrome native groups, then continue from a lightweight sidebar agent.
```

Primary CTA:

```text
Install from source
```

Secondary CTA:

```text
Read privacy architecture
```

Status note:

```text
Controlled local/private beta. Public Chrome Web Store launch is not ready yet.
```

Trust row:

```text
Open source direction confirmed
BYOK provider setup
Metadata-first organize
User-triggered page reads
Undo / Restore
```

### Above-the-fold visual

Use a before/after visual based on mock data:

```text
Before: crowded Chrome window with many ungrouped work tabs
After: clean native tab groups plus sidebar assistant message
```

Preferred source assets:

```text
artifacts/store-screenshots/01-one-click-native-groups.png
artifacts/store-screenshots/02-tab-agent-sidebar.png
artifacts/store-screenshots/03-smart-groups-dashboard.png
```

Important:

```text
Use mock data only.
Do not show real tab titles, URLs, emails, or private pages.
Do not imply final Chrome Web Store availability.
```

### Problem Section

Heading:

```text
Tabs are not the problem. Context switching is.
```

Body:

```text
Work happens across docs, dashboards, tickets, chats, meetings, code review, and research. Traditional tab managers make you sort that mess by hand. TabMosaic starts with the visible thing you already use: Chrome's native tab bar.
```

### Product Flow Section

Heading:

```text
One click, visible result
```

Steps:

```text
1. Click the extension icon.
2. Choose Smart Organize.
3. TabMosaic scans normal Chrome windows.
4. Real native tab groups appear in the top tab bar.
5. The sidebar explains what changed and lets you Undo, Restore, refine, or chat.
```

### AI Browser Layer Section

Heading:

```text
The sidebar is the control layer
```

Body:

```text
After organizing, the sidebar becomes a small agent for the browser context you are already in. Ask about the current page, selected tabs, or a group. Browser-changing actions are proposed first and require Apply.
```

Feature bullets:

```text
Chat with the current page after a user-triggered read.
Ask selected tabs or a group using capped visible-text context.
Preview content-assisted regrouping before applying.
Turn corrections into local rules.
Undo group changes and restore safely closed duplicates.
```

### BYOK Section

Heading:

```text
Bring your own model
```

Body:

```text
Use DeepSeek for private-beta testing, configure another OpenAI-compatible provider, or point TabMosaic at a local model endpoint. Provider presets fill fields only; Save/Test requests the needed origin permission explicitly.
```

Provider examples:

```text
DeepSeek
OpenAI
OpenRouter
Groq
Together AI
Mistral AI
LM Studio
Ollama
Custom OpenAI-compatible endpoint
```

### Privacy Section

Heading:

```text
Privacy boundaries you can inspect
```

Body:

```text
Smart Organize is metadata-first. It does not read page text by default. Page text is read only after a user asks a page, selected-tabs, or group question. Diagnostics are local copy-only and redacted. API keys stay local.
```

Links:

```text
Privacy architecture explainer: 04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md
BYOK provider setup: 04_TECH/10_BYOK_PROVIDER_SETUP.md
Contributing guide: CONTRIBUTING.md
```

### Open Source Section

Heading:

```text
Built in the open
```

Body:

```text
The local extension core is intended to be fully open source so users can inspect permissions, payloads, prompts, and safety checks. Commercial work can happen later through optional hosted services such as managed AI, sync, team workflows, and support.
```

Disclosure:

```text
License is still being confirmed. No LICENSE file is included yet.
```

### Final CTA

Heading:

```text
Try the local beta
```

CTA:

```text
Read the self-test guide
```

Supporting copy:

```text
The current build is ready for controlled local/private beta. It is not ready for public Chrome Web Store launch.
```

## 3. Demo Video Storyboard

Working title:

```text
From 80 messy tabs to native Chrome groups in one click
```

Target length:

```text
45-60 seconds
```

Required constraints:

```text
Use synthetic tabs only.
Use mock accounts and mock pages only.
Do not show private emails, real workspaces, real URLs, real API keys, or personal Chrome profile data.
Do not mention Chrome Web Store availability until approved.
```

Storyboard:

| Time | Scene | Voiceover / Caption |
|---|---|---|
| 0-5s | Crowded synthetic Chrome window with many tabs | "Work tabs pile up fast: docs, dashboards, tickets, chats, and research." |
| 5-10s | Click extension icon, compact menu opens | "TabMosaic AI starts with one action: Smart Organize." |
| 10-18s | Native Chrome tab groups appear | "It creates real Chrome native tab groups across normal windows." |
| 18-25s | Sidebar assistant result appears | "The sidebar explains what changed, what was grouped, and what can be undone." |
| 25-32s | Duplicate review / Restore Closed | "Safe duplicates can be restored. Risky candidates stay in review." |
| 32-42s | Ask current page / selected tabs question | "Ask about the current page or selected tabs only when you choose to read them." |
| 42-52s | BYOK settings / provider presets | "Bring your own model: DeepSeek, OpenAI-compatible providers, or local endpoints." |
| 52-60s | README/privacy docs/GitHub | "Open source direction, privacy-first defaults, and local beta docs are ready for review." |

End card:

```text
TabMosaic AI
Open-source AI browser layer for Chrome
Controlled local/private beta
```

## 4. Product Hunt Draft

Product name:

```text
TabMosaic AI
```

Tagline:

```text
Open-source AI browser layer for Chrome
```

Short description:

```text
Organize messy work tabs into native Chrome groups and continue from a sidebar agent using your own model.
```

Topics:

```text
Chrome Extensions
Open Source
Productivity
Artificial Intelligence
Developer Tools
```

Gallery asset plan:

```text
1. Before/after native Chrome groups
2. Sidebar assistant result
3. Current-page or selected-tabs chat
4. Smart Groups dashboard
5. BYOK provider settings / privacy architecture
```

Maker comment draft:

```text
Hi Product Hunt,

I built TabMosaic AI because my browser often becomes the real workspace: docs, dashboards, tickets, chats, and research spread across too many tabs.

Instead of making another separate tab manager, TabMosaic starts with Chrome's native tab bar. Click Smart Organize and it creates real native tab groups, explains the result in a sidebar, and lets you Undo, Restore safe duplicates, refine groups, or ask about the current page.

The direction is full open source + BYOK. You can configure DeepSeek, another OpenAI-compatible provider, or a local model endpoint. Smart Organize is metadata-first; page text is read only after a user-triggered page/group/selected-tabs question.

Current status: controlled local/private beta. I am looking for feedback on grouping quality, provider support, privacy copy, and whether this feels like a useful "AI browser layer" rather than just a tab cleaner.
```

Do not post until:

```text
license confirmed
public repo URL confirmed
privacy policy URL confirmed if linked
demo video approved
real-profile QA completed or risk accepted
```

## 5. Hacker News Draft

Title options:

```text
Show HN: TabMosaic AI - open-source AI browser layer for Chrome tabs
Show HN: I built an open-source BYOK AI tab organizer for Chrome
Show HN: Organize Chrome tabs into native groups with your own AI model
```

Post draft:

```text
Hi HN,

I am building TabMosaic AI, an open-source Chrome extension that organizes messy work tabs into real Chrome native tab groups and then lets you continue from a sidebar agent.

The core flow is:

1. Click the extension icon.
2. Choose Smart Organize.
3. Your normal Chrome windows are grouped into native tab groups.
4. The sidebar explains what changed, what can be undone, and what duplicates need review.
5. You can ask follow-up questions about the current page, selected tabs, or a group.

The direction is full open source + BYOK. DeepSeek is the private-beta default, but the extension keeps an OpenAI-compatible provider abstraction and supports custom HTTPS providers plus localhost model endpoints. Provider origins are permission-gated, and local endpoints can run without an API key when the server does not require one.

Privacy model:

- one-click organize is metadata-first
- no default page-body reading
- page text is read only after a user-triggered page/group/selected-tabs question
- multi-tab reads are capped and session-only
- API keys stay local
- browser-changing AI actions require Apply
- no history/bookmarks/cookies/webRequest/browsingData permissions

I am especially looking for feedback on:

- whether the grouping model should prioritize project/task/intent over domain
- provider setup expectations for BYOK users
- the privacy architecture wording
- whether this feels like a browser layer or just another tab manager

Current status: controlled local/private beta, not Chrome Web Store public launch yet.
```

First comment checklist:

```text
Link to GitHub repo
Link to privacy architecture explainer
Link to BYOK setup guide
State license status clearly
State Chrome Web Store status clearly
Invite provider requests and grouping-quality feedback
```

Do not post until:

```text
public repo URL confirmed
license confirmed or clearly disclosed as pending
support/contact path exists
real-profile QA status is accurately stated
```

## 6. X / Twitter Thread Draft

Post 1:

```text
I am building TabMosaic AI: an open-source AI browser layer for Chrome.

It starts with the most visible pain: too many work tabs.
Click once -> real Chrome native tab groups -> continue from a sidebar agent.
```

Post 2:

```text
The aha moment is not a chatbot answer.

It is your actual Chrome tab bar changing from messy to organized:
docs, tickets, dashboards, meetings, research, code review, and read-later tabs grouped into native Chrome groups.
```

Post 3:

```text
Why native groups?

Because users already live in the top tab bar.
A sidebar-only board can be useful, but it should not replace the visible browser result.
```

Post 4:

```text
The sidebar is the control layer:

- what changed
- Undo
- Restore safe duplicates
- review risky duplicate candidates
- refine groups
- ask about the current page or selected tabs
```

Post 5:

```text
Privacy model:

Smart Organize is metadata-first.
Page text is not read by default.
Current page / group / selected-tabs text is read only after a user asks.
API keys stay local.
Browser-changing AI actions require Apply.
```

Post 6:

```text
BYOK is core.

Use DeepSeek for testing, an OpenAI-compatible provider, OpenRouter/Groq/Together/Mistral, or a local Ollama/LM Studio endpoint.
Provider origins are explicitly permission-gated.
```

Post 7:

```text
I am making the local extension core open source because browser extensions need trust.

Users should be able to inspect permissions, AI payloads, prompts, local storage, and safety checks.
```

Post 8:

```text
Current status: controlled local/private beta, not public Chrome Web Store launch yet.

Looking for feedback on grouping quality, BYOK provider setup, privacy wording, and whether this feels like a real AI browser layer.
```

## 7. SEO Draft

Meta title:

```text
TabMosaic AI - Open-source AI browser layer for Chrome
```

Meta description:

```text
Organize messy work tabs into native Chrome groups, review duplicates, and continue from a sidebar agent using your own AI model.
```

Target search phrases:

```text
open-source AI tab manager
AI browser layer for Chrome
Chrome AI tab organizer
organize Chrome tabs with AI
BYOK Chrome extension
chat with browser tabs
native Chrome tab groups AI
OpenAI-compatible Chrome extension
DeepSeek Chrome tab organizer
local model Chrome extension
```

## 8. Review Checklist

Before publishing any of this:

```text
[ ] Product name confirmed.
[ ] Domain / public repo URL confirmed.
[ ] Open-source license confirmed or visibly disclosed as pending.
[ ] Public support email confirmed.
[ ] Privacy policy URL confirmed if external links are used.
[ ] Chrome Web Store status stated accurately.
[ ] Demo uses synthetic tabs and mock pages only.
[ ] No real URLs, tab titles, page text, emails, screenshots, or API keys appear.
[ ] Claims match the current implementation and launch checklist.
[ ] User approves final screenshots and demo video.
```

