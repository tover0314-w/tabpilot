# Vision

## The Browser Should Become A Work Layer

Knowledge work already happens in the browser. Tabs are not just pages; they are unfinished tasks, dashboards, meetings, docs, code reviews, research trails, and decisions waiting for attention.

TabMosaic AI starts with the visible pain: too many tabs across too many windows.

The first promise is simple:

```text
Click once.
Every work tab falls into place.
Continue from the sidebar.
```

## What We Are Building

TabMosaic AI is an open-source AI browser layer for Chrome:

- native tab groups as the visible result
- a sidebar agent as the control layer
- page and selected-tabs chat as context tools
- dashboard workbench for tasks, collections, rules, and workspace state
- bring-your-own-key model configuration
- local-first privacy boundaries

The product is not trying to replace Chrome. It makes normal Chrome more organized, inspectable, and AI-aware.

## Product Principles

### 1. Visible Browser Value First

The first user value should happen in Chrome's real tab bar, not hidden inside a dashboard.

### 2. Chat Is A Control Layer

The agent should explain, refine, and propose actions. It should not become a generic chatbot that forgets the browser.

### 3. Privacy Is A Feature

Browser context is sensitive. Default flows should minimize what is read, sent, stored, and shared.

### 4. Actions Need Reversibility

Grouping can be bold. Closing must be conservative. Undo and Restore are part of the product, not extras.

### 5. Open Source Builds Trust

People should be able to inspect how the extension reads tabs, handles API keys, calls models, validates AI output, and stores local state.

## Near-Term Direction

The source release focuses on:

- making Smart Organize useful and safe
- improving task/project/intent classification quality
- making Sidebar Agent feel like a real AI control layer
- supporting BYOK providers and local model endpoints
- keeping privacy boundaries legible
- collecting useful public feedback without leaking browser data

## Long-Term Direction

The long-term product is an AI browser layer:

- browser workbench for tasks and collections
- deeper page-region context
- selected-tabs and group reasoning
- useful built-in workflows
- optional hosted AI for non-technical users
- optional sync and memory with explicit consent
- team and managed workspace services

Local extension source remains the trust anchor.

## What We Will Not Do By Default

- silently read every page
- upload full URLs or page text in the background
- request broad Chrome permissions without a product reason
- close uncertain or protected tabs automatically
- ship browsing-activity analytics by default
- apply AI browser changes without validation and user action

## Open Questions

- Final public brand and domain.
- Hosted AI pricing and limits.
- Optional account, sync, and memory architecture.
- Chrome Web Store launch timing after real-profile QA.

Track confirmation gates in [Decisions To Confirm](00_START_HERE/03_DECISIONS_TO_CONFIRM.md).
