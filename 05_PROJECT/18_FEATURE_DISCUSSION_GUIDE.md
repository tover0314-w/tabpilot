# Feature-by-Feature Discussion Guide

Status: REVIEW PACKET / NOT A SPEC CHANGE  
Date: 2026-06-12  
Owner: Product + UX + Engineering  

## Purpose

This document turns the current implementation state into a feature-by-feature discussion path.

Use it when the user wants to review the product one feature at a time, including UI/UX. It does not confirm new product scope, privacy defaults, pricing, public launch readiness, or destructive automation. Any high-impact decision still goes through `00_START_HERE/02_CONFIRMATION_PROTOCOL.md` and `00_START_HERE/03_DECISIONS_TO_CONFIRM.md`.

## Current Summary

Controlled local/private beta:

```text
READY
```

Public Chrome Web Store launch:

```text
NOT READY
```

Why:

```text
- Real-profile manual QA is still pending.
- Final brand/domain is not confirmed.
- Open-source license is not confirmed.
- Privacy policy URL and support email are not final.
- Chrome Web Store disclosure and final store screenshots/demo are not approved.
- Beta user feedback has not been collected.
```

## How To Review

Recommended order:

```text
1. Toolbar entry / popup
2. Smart Organize and native tab groups
3. Classification quality
4. Deduplication and Undo/Restore
5. Sidebar Chat UI
6. Current Tab Chat
7. Selected Tabs / Group Chat
8. Page Region Context
9. Dashboard
10. Workspace
11. BYOK model settings
12. Privacy and onboarding
13. Open-source / public launch package
```

The first five items are the best place to spend design discussion time before inviting more beta users.

## 1. Toolbar Entry / Popup

Current state:

```text
IMPLEMENTED / PRIVATE-BETA READY
```

What exists:

```text
- Chrome action uses a compact popup menu.
- Smart Organize is the first/default action.
- Vertical Tabs, Current Page Chat, and Dashboard are available from the popup.
- Popup delegates work to the background service worker; it is not a settings page or chatbot.
```

Discussion:

```text
- Is the popup too much, or does it feel like the right compact command menu?
- Should Vertical Tabs stay in the same menu or move later?
- Should Current Page Chat open the sidebar without organizing first?
```

Decision gates:

```text
- Changing the confirmed toolbar-menu direction.
- Changing default organize scope.
- Changing whether sidebar opens automatically.
```

## 2. Smart Organize And Native Tab Groups

Current state:

```text
IMPLEMENTED / PRIVATE-BETA READY
```

What exists:

```text
- Scans all normal windows in the current browser.
- Creates real Chrome native tab groups.
- Keeps active/pinned/internal tabs protected where required.
- Sidebar explains the organize result as one assistant message.
- Undo is available.
```

UI evidence:

```text
artifacts/store-screenshots/01-one-click-native-groups.png
artifacts/ui-screenshots/sidepanel-result.png
```

Discussion:

```text
- Do the resulting group names feel like real work tasks, not just website buckets?
- How many groups should feel right for 20, 50, or 100 tabs?
- Should the first result message be even shorter?
```

Still pending:

```text
- Real-profile QA against the user's day-to-day Chrome windows.
- More classification quality tuning from real examples.
```

## 3. Classification Quality

Current state:

```text
FIRST SLICE IMPLEMENTED / NEEDS REAL-PROFILE QA
```

What exists:

```text
- Optional DeepSeek/OpenAI-compatible classification.
- Local fallback rules.
- Metadata semantic features: project, workflow, artifact type, intent, domain category, sensitive hint.
- Weak domain-only AI group names are rejected.
- Metadata-only split/merge suggestions exist.
```

Good target:

```text
TabMosaic Sidebar QA
Supabase Production Database
Chrome Extension API Docs
Private Beta Launch
Product Positioning Research
```

Weak target:

```text
github.com
docs.google.com
supabase.com
Other
Websites
```

Discussion:

```text
- What should the product do when metadata is not enough: ask, review, or use a broader Misc?
- Should it prefer fewer stable groups or more precise project groups?
- How aggressive should it be about splitting same-domain tabs?
```

Still pending:

```text
- Real-profile classification QA.
- More local fallback intelligence when AI is unavailable.
- Better UI for explaining why a group was created.
```

## 4. Deduplication And Undo/Restore

Current state:

```text
IMPLEMENTED / SAFETY-FIRST
```

What exists:

```text
- Exact duplicate detection.
- Tracking-param duplicate detection.
- Safe duplicate close.
- Restore Closed.
- Hash/query/domain-specific/title-similarity candidates go to review instead of auto-close.
- Active/pinned/audible/protected tabs are not closed.
```

Discussion:

```text
- Should exact duplicates auto-close by default in private beta?
- Should tracking-param duplicates auto-close by default?
- How visible should duplicate review be in the simplified UI?
```

Decision gates:

```text
- Any broader auto-close behavior.
- Semantic/page-body duplicate closing.
```

Still pending:

```text
- Semantic/page-body duplicate review.
- Real-profile duplicate QA.
```

## 5. Sidebar Chat UI

Current state:

```text
IMPLEMENTED / NEEDS PRODUCT TASTE REVIEW
```

What exists:

```text
- Sidebar is chat-first, not a dashboard panel.
- Latest organize result renders as one assistant message.
- Quick actions are lightweight message chips.
- Context is shown as a compact top row inside the bottom composer surface, above the text input.
- Current-tab context uses a short source label, such as `Supabase`, instead of the full browser title.
- Tool states render as compact assistant status, not debug panels.
- 10-turn mock chat screenshot verifies long conversation spacing.
```

UI evidence:

```text
artifacts/ui-screenshots/sidepanel-chat.png
artifacts/ui-screenshots/sidepanel-10-turn-chat.png
artifacts/ui-screenshots/sidepanel-context-tabs.png
```

Discussion:

```text
- Does it feel closer to ChatGPT / Notion AI sidebar?
- Are assistant message cards too heavy or still too plain?
- Should gradients/glass be more obvious or stay quiet?
- Should tool cards be more like inline AI thoughts or more like normal assistant messages?
```

Still pending:

```text
- Final visual taste pass with user feedback.
- Real Chrome side panel screenshot review after loading the extension.
```

## 6. Current Tab Chat

Current state:

```text
IMPLEMENTED / FIRST SLICE
```

What exists:

```text
- User can ask about the current page from the Sidebar composer.
- Visible page text is read only after the user asks.
- Sensitive-looking pages ask for confirmation.
- Chrome internal/restricted pages return a single natural explanation.
- DeepSeek Page Agent is used when configured; local visible-text fallback exists.
- Short local follow-up context is supported.
```

Discussion:

```text
- Should current-page mode be the default whenever the sidebar opens beside a normal page?
- Should the UI show only the composer context chip, or also a tiny source line in the answer?
- What answer depth feels useful for work pages?
```

Still pending:

```text
- Real-profile QA across normal SaaS pages, docs, GitHub, Supabase, and Chrome-restricted pages.
```

## 7. Selected Tabs / Group Chat

Current state:

```text
FIRST SLICE IMPLEMENTED / MANUAL QA PENDING
```

What exists:

```text
- Dashboard can select multiple same-window tabs and open Sidebar with selected-tabs context.
- Current-group / selected-tabs questions route to the context-tabs Agent flow.
- Reads at most 6 visible pages after the user asks.
- Shows compact tool-card state before extraction.
- Skips restricted/sensitive/unreadable tabs and explains skipped reasons.
- Follow-up reuse is session-only.
- Content-assisted regrouping returns Apply / Cancel before native group changes.
```

UI evidence:

```text
artifacts/ui-screenshots/sidepanel-context-tabs.png
artifacts/ui-screenshots/dashboard-selected-tabs.png
```

Discussion:

```text
- Is 6 tabs enough for private beta?
- Should selected-tabs chat be easier to start directly from Sidebar, not only Dashboard?
- Should group chat be visible as a small action on group messages?
```

Still pending:

```text
- Native Chrome optional site-access prompt acceptance/denial QA.
- Real-profile selected-tabs/group context QA.
```

Decision gates:

```text
- Reading more than the current capped batch.
- Persisting multi-tab summaries or workspace memory.
```

## 8. Page Region Context

Current state:

```text
FIRST SLICE IMPLEMENTED
```

What exists:

```text
- Sidebar commands can start selected page-region mode.
- User clicks one visible page block.
- Product reads selected-region visible text and safe lightweight structure.
- Bounded table headers/rows are included.
- Cropped screenshot metadata exists, but screenshot image bytes are not uploaded or stored.
```

Discussion:

```text
- Should this become a highlighted product differentiator?
- Should there be a visible button for region selection, or only a command?
- What should the UI say after a region is selected?
```

Still pending:

```text
- Complex SaaS table QA.
- Richer visual understanding.
- Any future screenshot image upload requires separate confirmation.
```

## 9. Dashboard

Current state:

```text
SIMPLIFIED / PRIVATE-BETA READY FOR BASIC FLOWS
```

What exists:

```text
- Dashboard opens to Smart Groups.
- Latest Result, timestamp, Current Workspace card, Auto Organize, visible Settings, and Saved Workspaces are hidden from the default commercial UI.
- Smart Groups can show tab rows with favicon/title.
- Dashboard can apply group title/color back to browser.
- Same-window tab move and drag/drop assignment exist.
- Duplicate Center is folded until used.
```

UI evidence:

```text
artifacts/ui-screenshots/dashboard-overview.png
artifacts/ui-screenshots/dashboard-selected-tabs.png
artifacts/ui-screenshots/dashboard-mobile.png
```

Discussion:

```text
- Is Dashboard now simple enough?
- What is the one paid-value reason for Dashboard in v1?
- Should settings remain hidden/private-beta or have a tiny advanced entry?
```

Still pending:

```text
- Final paid dashboard IA.
- Workspace history/full restore/chat.
- Usage/billing.
```

## 10. Workspace

Current state:

```text
HIDDEN FIRST SLICE ONLY
```

What exists:

```text
- Local workspace snapshot save/delete exists in hidden/private-beta paths.
- Restore currently open saved tab IDs into native groups exists.
- It does not reopen closed URLs.
- It does not cloud sync.
```

Discussion:

```text
- Should workspace be delayed until the tab agent feels excellent?
- What is the minimum workspace value: save, restore, chat, or templates?
```

Still pending:

```text
- Saved workspace history UI.
- Full restore.
- Workspace chat.
- Cloud sync.
```

## 11. BYOK Model Settings

Current state:

```text
IMPLEMENTED / PRIVATE-BETA READY
```

What exists:

```text
- DeepSeek default.
- OpenAI-compatible Base URL / model / API key.
- Provider presets.
- Local model endpoint support for localhost.
- Remote custom provider host requires explicit origin permission.
- Connection test does not send tab/page data.
```

Discussion:

```text
- How much provider configuration should normal users see?
- Should setup live in Dashboard, README, or both?
- Should the product recommend DeepSeek first while keeping open-source BYOK neutral?
```

Decision gates:

```text
- Arbitrary provider host permission UX.
- Hosted AI gateway.
- Any analytics involving model usage and browsing activity.
```

## 12. Privacy And Onboarding

Current state:

```text
DRAFTED / IMPLEMENTED LOCALLY / FINAL PUBLIC COPY PENDING
```

What exists:

```text
- First-run privacy gate.
- Metadata-first one-click organize.
- Page text only after user-triggered page/group/selected-tabs question.
- Multi-tab context is capped and session-only.
- Diagnostics and feedback templates redact sensitive data.
- Privacy policy draft and Chrome Store data disclosure draft exist.
```

Discussion:

```text
- Is the privacy explanation short enough for normal users?
- Should the first-run gate mention BYOK explicitly?
- What copy makes page-reading feel understandable instead of scary?
```

Still pending:

```text
- Final privacy policy URL.
- Final support email.
- Final Chrome Web Store disclosure confirmation.
```

## 13. Open Source / Public Launch

Current state:

```text
NOT READY FOR PUBLIC PUSH / PUBLIC STORE LAUNCH
```

What exists:

```text
- Open-source direction is confirmed.
- CONTRIBUTING draft exists.
- Public repo audit exists and intentionally blocks unresolved launch items.
- Public launch materials draft exists.
```

Still pending:

```text
- Open-source license.
- Public repo boundary and raw archive handling.
- Final brand/domain.
- Store screenshots/demo approval.
- Real-profile QA.
- Beta feedback.
```

Decision gates:

```text
- License.
- Final brand/domain.
- Public repo boundary.
- Pricing/free-Pro limits.
- Analytics.
```

## Best Next Discussion

Recommended first topic:

```text
Sidebar Chat UI + Agent behavior
```

Reason:

```text
This is the daily product surface. If Sidebar feels simple, intelligent, and trustworthy, the rest of the product can grow around it. If Sidebar feels like a debug panel or settings surface, the product will feel wrong even if the backend works.
```

Recommended second topic:

```text
Classification quality
```

Reason:

```text
The visible aha moment depends on whether native tab groups feel like user work, not website sorting.
```
