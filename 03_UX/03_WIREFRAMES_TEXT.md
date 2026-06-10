# 文字线框图

## 1. Sidebar：整理中

```text
┌─────────────────────────────┐
│ TabMosaic AI                 │
├─────────────────────────────┤
│ Organizing your tabs...     │
│                             │
│ ✓ Scanned 73 tabs           │
│ ✓ Found 9 safe duplicates   │
│ • Creating smart groups     │
│ • Updating top tab bar      │
│                             │
│ This will be undoable.      │
└─────────────────────────────┘
```

## 2. Sidebar：Tab Agent / 整理完成

CONFIRMED BY USER: Sidebar 首屏必须是类似 OpenAI 的对话框，用作 Tab Agent。整理结果只能作为消息出现，不做复杂结果面板。

```text
┌─────────────────────────────┐
│ TabMosaic AI            ⊟    │
├─────────────────────────────┤
│ AI                           │
│ I organized the browser:     │
│ created 8 native groups and  │
│ moved 61 tabs. Memory relief:│
│ 9 duplicate tabs freed.      │
│ Duplicate review: 4 groups.  │
│ Context · Current tab         │
│ [Organize Again] [Undo]       │
│ [Undo] [Restore]             │
├─────────────────────────────┤
│ Ask TabMosaic about tabs...  │
│ [GitHub PR] [Current] [Rename]│
└─────────────────────────────┘
```

## 3. Sidebar：当前页面总结

```text
┌─────────────────────────────┐
│ Current Tab Summary         │
├─────────────────────────────┤
│ chrome.sidePanel API        │
│                             │
│ This page explains how Chrome│
│ extensions can use the       │
│ browser side panel for UI.   │
│                             │
│ Key points                  │
│ 1. side panel 是 extension  │
│    page。                   │
│ 2. 可通过用户动作打开。       │
│ 3. 适合伴随浏览的工具。       │
│                             │
│ Suggested group:            │
│ Chrome Extension Docs       │
│                             │
│ [Move] [Save] [Ask more]    │
└─────────────────────────────┘
```

## 4. Dashboard：Home

CONFIRMED BY USER: Dashboard 默认不要 Latest Result、时间、Current Workspace 这类占空间信息。默认直接进入 Smart Groups。

```text
┌──────────────────────────────────────────────┐
│ TabMosaic                         Local       │
├──────────────────────────────────────────────┤
│ [All 6] [AI groups 2] [Rule groups 1]         │
│                                              │
│ Smart Groups                                 │
│ Product Planning                         Edit │
│   Q3 planning doc                            │
│   Product roadmap                            │
│                                              │
│ Code Review                              Edit │
│   PR #24 - Add sidebar control center        │
│   PR #26 - Privacy copy                      │
└──────────────────────────────────────────────┘
```

## 5. Dashboard：Smart Groups

```text
┌──────────────────────────────────────────────┐
│ Smart Groups          [All] [AI] [Rules]      │
├──────────────────────────────────────────────┤
│ Product Planning                         Edit │
│ 8 tabs · docs.google.com · notion.so           │
│   Q3 planning doc                              │
│   Product roadmap                              │
│   MVP private beta checklist                   │
│   +5 tabs  (expand)                            │
│                                              │
│ Code Review                              Edit │
│ 7 tabs · github.com                            │
│   PR #24 - Add sidebar control center          │
│   PR #26 - Privacy copy                        │
│   PR #29 - Dashboard apply                     │
│   +4 tabs  (expand)                            │
│   (drag a tab row to another same-window group)│
└──────────────────────────────────────────────┘
```

## 6. Dashboard：Group Detail + Chat

```text
┌──────────────────────────────────────────────┐
│ AI Tab Manager Research                      │
│ 14 tabs                                      │
├──────────────────────────────┬───────────────┤
│ Tabs                         │ Chat          │
│ □ GitHub repo A              │ Ask about     │
│ □ GitHub repo B              │ this group... │
│ □ Chrome Web Store listing   │               │
│ □ Blog article               │ [Send]        │
│                              │               │
│ [Open tab] [Move] [Drag]     │               │
└──────────────────────────────┴───────────────┘
```
