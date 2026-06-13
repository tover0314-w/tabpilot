# 信息架构

## 1. 核心界面

```text
Chrome Top Tab Bar
Extension Action Icon
Sidebar Agent
Dashboard
```

## 2. 职责分工

| 界面 | 角色 | 不该做什么 |
|---|---|---|
| Top Tab Bar | 展示真实整理结果 | 不解释复杂逻辑 |
| Action Icon | 打开极简 toolbar menu：Smart Organize、Vertical Tabs、Current Page Chat、Dashboard | 不做复杂设置页 |
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
├─ Chat
└─ Current Tab Summary
```

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

- 用户第一次点击插件：不进入 dashboard，先看到极简 toolbar menu；Smart Organize 会打开 sidebar 并整理。
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
