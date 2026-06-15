# 信息架构

## 1. 核心界面

```text
Chrome Top Tab Bar
Extension Action Icon
Page Quick Rail
Sidebar Agent
Dashboard
```

## 2. 职责分工

| 界面 | 角色 | 不该做什么 |
|---|---|---|
| Top Tab Bar | 展示真实整理结果 | 不解释复杂逻辑 |
| Action Icon | 直接打开 Sidebar Agent，并绑定当前 tab 上下文 | 不打开 toolbar popup / 复杂设置页 |
| Page Quick Rail | 在普通网页右侧提供极简 AI 快捷入口：Chat、Read、Region、Translate、Save | 不做 Monica 式大工具箱，不后台读取页面 |
| Sidebar | 结果解释、Undo、聊天、总结 | 不承载长期复杂管理 |
| Dashboard | 长期管理、付费能力、workspace | 不阻塞首次 aha |

## 3. 顶部 Tab Bar

显示：

- 原生 Chrome tab groups。
- group name。
- group color。
- collapsed/expanded。
- tabs actual order。

## 4. Sidebar IA

```text
Sidebar
├─ Outcome Summary
├─ Quick Actions
│  ├─ Undo
│  ├─ Review duplicates
│  ├─ Save workspace
│  └─ Open dashboard
├─ Group Overview
│  └─ Group cards / tabs list
├─ Duplicate Review
├─ Guided Prompts
├─ Prompt / Skill Templates
├─ Chat
└─ Current Tab Summary
```

## 4.1 Page Quick Rail IA

CONFIRMED BY USER: 可以学习 Monica 右侧快捷入口，但必须极简。

```text
Page Quick Rail
├─ Chat
├─ Read current page
├─ Select region
├─ Translate
├─ Save
└─ More
   ├─ Create todo
   ├─ Compare tabs
   └─ Decision brief
```

Rules:

- 默认最多 4 个可见 icon，其余进 More。
- icon-only + tooltip，不显示长文本。
- 点击后打开 Sidebar 或把上下文放进 composer。
- 不因为渲染 rail 就读取页面正文、截图或上传内容。
- 用户可以隐藏。
- Chrome internal/restricted pages 不显示。

## 5. Dashboard IA

```text
Dashboard
├─ Home
├─ Smart Groups
├─ Workspaces
├─ Tab Knowledge
├─ Rules & Memory
├─ Duplicate Center
├─ Templates
├─ Usage & Billing
└─ Settings
```

## 6. Navigation Rules

- 用户第一次点击插件：不进入 dashboard，不出现 toolbar popup，直接打开 Sidebar Agent；Smart Organize 是首要 quick action。
- Sidebar 中需要复杂调整时，引导打开 dashboard。
- Dashboard 调整完成后，必须能 apply 回浏览器顶部 tab bar。
- Chat 始终可用，但 scope 要明确。

## 7. Context Selector

Chat 入口使用统一上下文选择器：

```text
Current Tab
Selected Tabs
Current Group
Current Window
Workspace
```

P0 支持 Current Tab；P1 支持 Selected Tabs、Group、Window、Workspace。

## 8. Prompt / Skill Templates

CONFIRMED BY USER: 需要 Prompt / Skill Templates。

Templates are curated browser-work workflows, not an open marketplace:

```text
Cleanup
Page Understanding
Research / Decision Brief
Writing
Review / QA
Translation
```

Placement:

- Sidebar composer/context picker.
- Assistant follow-up suggestions.
- Page Quick Rail shortcuts for the most common templates.
- Dashboard may show saved outputs later, but not a giant template gallery in MVP.
