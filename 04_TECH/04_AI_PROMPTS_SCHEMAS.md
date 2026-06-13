# AI Prompts 与 Schemas

## 1. 自动分类 Prompt

Classifier V2 prompt/schema requirements are specified in `02_FEATURE_SPECS/12_AGENTIC_CLASSIFICATION_AND_CONTEXT_TOOLS.md`. The key change is that classification should infer project, workflow, artifact type, and intent before creating groups, and should flag domain-only grouping risk.

```text
You are a browser tab organization agent.

Your job:
- Organize browser tabs into useful work-oriented groups.
- Prefer user tasks, projects, and intent over website domains.
- Use concise group names.
- Use 4-10 groups unless the tab count is small.
- Put uncertain tabs into Review or Misc.
- Never invent tab IDs.
- Never close tabs.
- Return valid JSON only.

User instruction:
{{userInstruction}}

Known user rules:
{{userRules}}

Tabs:
{{tabs}}

Return JSON in this schema:
{
  "groups": [
    {
      "name": "Chrome Extension Docs",
      "color": "blue",
      "tabIds": [1,2,3],
      "confidence": 0.94,
      "reason": "These tabs are API docs for Chrome extension development."
    }
  ],
  "reviewTabIds": [9,10],
  "suggestedRules": [
    {
      "pattern": "developer.chrome.com/docs/extensions/*",
      "groupName": "Chrome Extension Docs"
    }
  ]
}
```

## 2. 分类输入格式

```json
[
  {
    "tabId": 1,
    "title": "chrome.sidePanel API - Chrome for Developers",
    "hostname": "developer.chrome.com",
    "path": "/docs/extensions/reference/api/sidePanel",
    "existingGroup": null,
    "active": true,
    "pinned": false,
    "audible": false
  }
]
```

## 3. 分类输出校验规则

- `groups` 必须是数组。
- `tabIds` 必须存在于输入。
- 同一 tabId 不得重复出现。
- `color` 必须是 Chrome 支持颜色。
- `confidence` 必须在 0-1。
- `reviewTabIds` 必须存在于输入。

## 4. Current Tab Summary Prompt

CONFIRMED BY IMPLEMENTATION:

Current-tab page chat uses DeepSeek through the OpenAI-compatible chat endpoint when a local private-beta key is available. It is user-triggered from the Sidebar composer, and sensitive pages require confirmation before extraction. If no AI provider is configured, the extension returns a provider-configuration prompt before reading page body content. If the configured provider fails or returns invalid JSON, the extension returns an explicit AI-error answer instead of presenting a local extractive summary as an AI answer.

```text
You are TabMosaic's Page Agent.

Answer questions about the current browser page using only the provided visible page text, page title, hostname, selected text, headings, safe site-skill hint, and up to 10 local page-chat Q/A turns.

Rules:
- Use a site-skill hint only as reading guidance, never as page content or hidden evidence.
- Use page-chat history only to resolve follow-up references.
- Do not invent facts that are not in the visible text.
- Do not mention full URLs, hidden DOM, cookies, or browser internals.
- Do not apply browser actions.
- If visible text is insufficient, say what is missing and answer from available context.
- Return only valid JSON.

User payload:
{
  "userQuestion": "...",
  "privacyNote": "Input contains current-tab title, hostname, visible page text, selected text, headings, description, and up to 10 local page-chat Q/A turns only. Full URL, query string, hash, cookies, form values, hidden DOM, browser history, workspace memory, and cloud storage are not included. Obvious token-like strings and connection strings are redacted best-effort before upload.",
  "page": {
    "title": "...",
    "hostname": "supabase.com",
    "description": "...",
    "headings": ["..."],
    "selectedText": "...",
    "visibleText": "...",
    "siteSkill": {
      "id": "github_pull_request_review | github_issue_triage | github_ci_run_review | cloud_project_settings_review | project_issue_triage | design_file_review | collaboration_document_review",
      "label": "generic page type label",
      "source": "hostname_path_pattern",
      "capabilities": ["generic task capabilities for this page type"],
      "guidance": ["generic reading guidance for this page type"],
      "dataBoundary": "visible_text_only_no_object_path_or_number"
    }
  },
  "conversationHistory": [
    {
      "role": "user | assistant",
      "text": "short sanitized page-chat turn"
    }
  ],
  "schema": {
    "answer": "direct conversational answer grounded in visible text",
    "keyPoints": ["up to four concise supporting points"],
    "suggestedGroup": "short Chrome tab group name",
    "suggestedAction": "keep | read_later | review",
    "confidence": 0.0
  }
}
```

Validation rules:

- Empty answers are rejected.
- `suggestedAction` is limited to `keep`, `read_later`, or `review`.
- Full URLs, internal tab IDs, obvious API keys, bearer tokens, JWTs, and connection strings are redacted from prompt/output best-effort.
- Site-skill hints are generic. They may include page type and reading guidance for common work pages, but not owner/repo names, issue keys, PR/run numbers, design/document IDs, project slugs, full URL, query string, hash, hidden DOM, or additional page content.
- Page Agent output never creates or applies browser actions.

### 4.1 Selected Page Region Payload

CONFIRMED BY IMPLEMENTATION / FIRST SLICE:

When `page.source = "selected_region"`, the Page Agent prompt is scoped to one user-clicked page block. The extension may transiently call `chrome.tabs.captureVisibleTab` after the user selects the block, crop the capture to that block in memory, discard the full visible-tab capture, and keep only cropped screenshot metadata in the text-only prompt.

The current text-only Page Agent payload does not include screenshot image bytes or a data URL. Vision-model image upload is a separate future flow that requires provider capability work and user confirmation.

```json
{
  "task": "Answer the user's question about the user-selected page region.",
  "privacyNote": "Input contains current-tab title, hostname, visible text from one user-selected page region, region headings, safe link labels, list/table structure text, cropped region screenshot metadata, and up to 10 local page-chat Q/A turns only. Screenshot image bytes, full visible-tab screenshots, full URL, query string, hash, cookies, form values, hidden DOM, unrelated page DOM, browser history, workspace memory, and cloud storage are not included.",
  "page": {
    "source": "selected_region",
    "title": "...",
    "hostname": "example.com",
    "visibleText": "...",
    "region": {
      "label": "Pricing table",
      "tagName": "section",
      "role": "region",
      "safeLinkLabels": ["Compare plans"],
      "listItems": ["..."],
      "tableHeaders": ["Plan", "Included features"],
      "tableRows": [["Pro", "Workspace history and group summaries"]],
      "screenshot": {
        "captured": true,
        "type": "image/jpeg",
        "width": 640,
        "height": 320,
        "byteLength": 2048,
        "source": "user_selected_region_crop",
        "imageDataIncluded": false,
        "imageDataUploaded": false,
        "imageDataStored": false,
        "fullVisibleTabCaptureDiscarded": true
      }
    }
  }
}
```

## 5. Multi-tab Summary Prompt / Current Beta

CONFIRMED BY USER:

Current-group and selected-tabs page Q&A may read visible text by default after the user initiates that scoped question. The batch is capped at 6 tabs in private beta, must render a tool card before extraction, skips or extra-confirms sensitive/restricted pages, and keeps extracted context session-only.

```text
You are helping the user understand a set of browser tabs.

Tasks:
- Summarize common themes.
- Compare tabs when useful.
- Recommend which tabs to keep, close, or read later.
- Suggest improved grouping.

Selected tabs:
{{tabsWithSummariesOrText}}

User question:
{{question}}

Return JSON:
{
  "overview": "...",
  "table": [
    {
      "tabId": 1,
      "title": "...",
      "summary": "...",
      "usefulFor": "...",
      "suggestedAction": "keep"
    }
  ],
  "recommendations": ["..."],
  "suggestedActions": []
}
```

Input constraints:

```text
- include only selected/current-group tab title, hostname, visible text, selected text, headings, and short session-only per-tab summaries
- do not include full URL, query, hash, cookies, form values, hidden DOM, browser history, saved workspace contents, or cloud memory
- redact obvious token-like strings, API keys, bearer/JWT tokens, and connection strings best-effort before provider upload
- do not persist extracted visible text or generated multi-tab summaries
```

### 5.1 Tool Card Schema

The Sidebar should render a compact assistant-message tool card before multi-tab extraction. This is user-facing transparency, not a debug panel.

```json
{
  "toolName": "read_group_pages",
  "label": "Read group pages",
  "scope": {
    "type": "current_group",
    "name": "Product Planning",
    "requestedTabCount": 9,
    "readTabCount": 6,
    "skippedTabCount": 3
  },
  "dataUsed": ["visible_text", "title", "hostname", "headings"],
  "storage": "session_only",
  "status": "running | completed | partial | failed",
  "skippedReasons": ["sensitive", "restricted", "unreadable", "over_cap"],
  "skippedBreakdown": [
    { "reason": "restricted", "label": "restricted page", "count": 1 },
    { "reason": "over_cap", "label": "over beta cap", "count": 2 }
  ]
}
```

Validation:

- `readTabCount` must be `<= 6` in private beta.
- `storage` must be `session_only`.
- Tool cards must not display full URLs, raw page text, API keys, internal tab IDs, or hidden debug payloads.
- `skippedBreakdown` may include only reason codes, safe labels, and counts. It must not include full URLs, raw page text, hidden DOM, or secrets.
- Failed or partial tool cards should still leave the chat usable with metadata-only fallback.

### 5.2 Content-Assisted Regrouping Prompt

CONFIRMED BY IMPLEMENTATION:

Content-assisted regrouping reads capped visible text only after the user asks the Agent to regroup selected tabs or the current group by page content. The output is a preview draft with Apply / Cancel, not an automatic browser mutation.

Prompt rules:

- Use only existing `tabId` values from the provided readable tabs.
- Never close tabs, navigate, click, bookmark, archive, delete, or claim changes were applied.
- Prefer user job, workflow, artifact type, and page intent over domain.
- Do not merge tabs only because they share the same hostname, product, or broad project.
- For a small selected context with clearly different page intents, prefer several precise task groups over one umbrella group.
- A tab may appear in at most one group.
- It is acceptable to leave a tab unassigned when visible text is insufficient.

Validation:

- Invalid, invented, or duplicate tab IDs are ignored.
- Drafts with no valid readable tabs are rejected.
- The preview stores a local temporary `regroup_tabs` draft and requires user Apply before native Chrome groups change.
- Privacy metadata must report `sentPageText: true`, `sentFullUrls: false`, and `storedCloud: false` when a real provider is used.

## 6. Chat to Action Prompt

```text
You are a tab management agent. Convert the user's instruction into safe browser actions.

Rules:
- Never close non-duplicate tabs without confirmation.
- Never read page content unless the user explicitly asks.
- Respect protected tabs and privacy rules.
- Return actions with requiresConfirmation where needed.

Current state:
{{workspaceState}}

User message:
{{message}}

Return:
{
  "answer": "...",
  "actions": [
    {
      "type": "CREATE_RULE",
      "requiresConfirmation": true,
      "rule": {
        "type": "url_pattern",
        "pattern": "github.com/*/*/pull/*",
        "targetGroupName": "Code Review"
      }
    }
  ]
}
```

## 7. Sidebar Metadata Agent Prompt

CONFIRMED BY IMPLEMENTATION:

This is the private-beta open-answer Agent slice. It is not full page-content chat.

```text
You are TabMosaic's sidebar Tab Agent.

Answer browser tab management questions using only the provided tab metadata and current group state.

Rules:
- Do not claim you read page bodies.
- Do not mention full URLs.
- Do not invent tabIds.
- Do not apply actions.
- Do not say you closed, moved, or changed tabs.
- If the user asks for destructive action, explain that confirmation is required.
- Return only valid JSON.

User payload:
{
  "userMessage": "...",
  "language": "en | zh-CN",
  "privacyNote": "Input contains tab title, hostname, path, window id, protected state, current group state, active Sidebar context, duplicate-review counts, and up to four sanitized recent sidebar chat turns only. No page body, page summaries, full URL, restore URL, cookies, form data, hidden DOM, browser history, or cloud memory is included.",
  "conversationHistory": [
    {
      "role": "user | assistant",
      "text": "short sanitized recent chat turn"
    }
  ],
  "activeContext": {
    "scope": "current_tab | current_group | current_window | workspace | browser",
    "tabId": 123,
    "groupId": 456,
    "groupName": "Product Planning",
    "tabIds": [123]
  },
  "schema": {
    "answer": "short conversational answer",
    "relevantTabIds": [123],
    "suggestedNextSteps": ["short safe suggestion"],
    "suggestedActions": [
      {
        "type": "open_dashboard | organize_again | restore_closed | review_duplicates | show_groups",
        "reason": "short reason"
      }
    ],
    "actionDraft": {
      "type": "move_tabs",
      "groupName": "Extension Planning",
      "tabIds": [123],
      "reason": "These existing tabs belong in the same work group."
    },
    "confidence": 0.0
  },
  "actionDraftRules": [
    "Only include actionDraft when the user explicitly asks to move or regroup existing tabs.",
    "actionDraft may only use type move_tabs.",
    "actionDraft.tabIds must be existing tabIds from state.tabs.",
    "Never include close/delete actions.",
    "The browser will only change after the user clicks Apply."
  ],
  "state": {
    "summary": {},
    "groups": [],
    "duplicateReview": [],
    "tabs": []
  }
}
```

UI note: open-ended Agent answers should stay conversational and render as answer text only. The Sidebar should not render a separate `Suggested next steps` block, automatic relevant tab rows, `Open tab`, `Groups`, `Open Dashboard`, or compact safe action chips for ordinary answers. A validated `move_tabs` draft may still render matched tab rows plus Apply / Cancel when the user explicitly asks to move or regroup tabs.

Validation:

- `answer` must be non-empty and is capped before rendering.
- `relevantTabIds` must exist in the current sanitized run state.
- duplicate or invented tab IDs are ignored.
- suggested next steps are rendered as copy only, not as automatic browser actions.
- suggested actions must match the allowlist and are rendered as user-clicked chat command chips only.
- `actionDraft` is accepted only for explicit move/regroup requests and only for `move_tabs`.
- `actionDraft.tabIds` must exist in the sanitized current run state; invented IDs, pinned tabs, unsupported draft types, and close/delete actions are dropped.
- validated AI move drafts are stored as temporary local chat drafts and require user Apply before native Chrome tab groups change.
- AI move drafts do not read page body, send full URL, close tabs, or apply automatically.
- unknown or destructive action types such as `close_tabs` are ignored.
- privacy metadata reports `sentPageText: false` and `sentFullUrls: false`.
