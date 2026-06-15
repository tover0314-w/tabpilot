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

## 3.1 Page Quick Rail：网页右侧快捷入口

CONFIRMED BY USER: 可以参考 Monica 的右侧快捷入口，但 TabMosaic 只做极简 icon rail。

```text
Browser page
┌──────────────────────────────────────────┬──┐
│                                          │AI│  Chat
│              current webpage             │Pg│  Page
│                                          │▣ │  Region
│                                          │+ │  Todo
└──────────────────────────────────────────┴──┘
```

Interaction:

```text
Click Page
→ Sidebar opens
→ Composer context row shows `Current page · visible text`
→ Composer is prefilled with `What is this page about?`
→ User still sends/confirms the actual request
→ Page text is read only after the user submits/accepts the tool flow
```

Rules:

- 默认最多 4 个可见 icon。
- 不显示大面积文字说明。
- 不遮挡网页核心控件。
- 用户可以 hide。
- 受限页面不显示。
- 渲染 icon 不等于读取页面。

## 3.2 Sidebar：Prompt / Skill Templates

```text
┌─────────────────────────────┐
│ TabMosaic               ▦    │
│                             │
│ Assistant                   │
│ What do you want to do with │
│ this page?                  │
│                             │
│ [Explain page] [Find risks] │
│ [Make checklist] [Translate]│
│                             │
│ Current tab · Supabase      │
│ +  Ask about this tab...  ↑  │
└─────────────────────────────┘
```

Template picker:

```text
Current page        Selected text
Page region         Search web
Save as todo

Only when selected-tabs/group context is active:
Selected tabs/group Decision brief
```

Each template declares the context it needs and the data it will use before running.

First beta implementation:

- The `+` button in the bottom composer opens this compact picker.
- Picker items run existing Sidebar Agent flows and return to the same chat thread.
- Selected text uses highlighted text only; it does not fall back to full-page reading.
- Selected-tabs/group-only actions are hidden until that context is active.
- It does not show unimplemented file upload, full screenshot upload, vision upload, or third-party skill marketplace entries yet.
- Selected-text rewrite is now wired through the copy-only `Rewrite selection` template and natural selected-text rewrite prompts.

## 4. Dashboard：Home

CONFIRMED BY USER: Dashboard 默认不要 Latest Result、时间、Current Workspace 这类占空间信息。默认直接进入 Smart Groups。
CONFIRMED BY USER: Dashboard follows less-is-more. Work Queue, Collections, Project Space navigation, filters, and disabled action chips are hidden from the default customer page.

```text
┌──────────────────────────────────────────────┐
│ TabMosaic                         Local       │
├──────────────────────────────────────────────┤
│ Smart Groups                                 │
│ 6 groups · 33 tabs · Local                    │
│                                              │
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
│ Smart Groups                                  │
│ 6 groups · 33 tabs · Local                    │
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
