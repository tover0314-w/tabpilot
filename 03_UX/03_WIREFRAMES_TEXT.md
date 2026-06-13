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
│ Assistant                    │
│ Done. I cleaned up the       │
│ browser into clearer work    │
│ groups and left protected    │
│ tabs untouched.              │
│                             │
│ Result                      │
│ - Groups: 8                 │
│ - Tabs organized: 61        │
│ - Memory relief: 9 duplicate│
│   tabs                      │
│ - Needs review: 4 possible  │
│   duplicate groups          │
│                             │
│ You can type `undo`,         │
│ `restore closed`, or         │
│ `organize again`.            │
├─────────────────────────────┤
│ Current tab · Supabase       │
│ Ask TabMosaic about tabs...  │
└─────────────────────────────┘
```

## 3. Sidebar：当前页面对话

```text
┌─────────────────────────────┐
│ TabMosaic               ▦    │
│                             │
│ User                        │
│ ┌─────────────────────────┐ │
│ │ 当前页面有什么内容？      │ │
│ └─────────────────────────┘ │
│                             │
│ Assistant                   │
│ ┌─────────────────────────┐ │
│ │ This is the Database     │ │
│ │ settings page for the    │ │
│ │ Supabase ai-music        │ │
│ │ project.                 │ │
│ │ • Review connection info │ │
│ │ • Check pooling/backups  │ │
│ │ • Keep with backend setup│ │
│ └─────────────────────────┘ │
│                             │
│ Current tab · Supabase page │
│ Ask about this tab...    ↑  │
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
