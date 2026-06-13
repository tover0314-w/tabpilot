# 技术架构

## 1. 总体架构

```text
Chrome Extension MV3
├─ background service worker
│  ├─ action click handler
│  ├─ tab snapshot collector
│  ├─ duplicate detector
│  ├─ rules engine
│  ├─ AI classifier client
│  ├─ native tab group applier
│  ├─ undo manager
│  └─ sync/backend client
│
├─ side panel
│  ├─ result summary
│  ├─ group overview
│  ├─ duplicate review
│  ├─ chat UI
│  ├─ current tab summary
│  └─ dashboard launcher
│
├─ dashboard page
│  ├─ smart groups board
│  ├─ workspaces
│  ├─ rules & memory
│  ├─ tab knowledge
│  ├─ duplicate center
│  ├─ billing
│  └─ settings
│
├─ content extraction
│  ├─ activeTab + scripting
│  ├─ readable text extractor
│  ├─ article/main parser
│  └─ site-specific parsers / P1
│
└─ backend / Pro
   ├─ auth
   ├─ subscription
   ├─ AI gateway
   ├─ workspace sync
   ├─ summaries storage
   └─ usage metering
```

## 2. Chrome Extension 组件

### Background service worker

职责：

- 监听 action click。
- 收集当前浏览器所有普通窗口 tabs snapshot。
- 去重。
- 分类。
- 应用 tab groups。
- 管理 Undo/Restore。
- 与 sidebar/dashboard 通信。

### Side Panel

职责：

- 展示实时整理状态。
- 展示结果摘要。
- 提供 chat UI。
- 请求 current tab summary。
- 打开 dashboard。

### Dashboard

职责：

- Smart Groups 看板。
- Workspaces（P0 local-only Save snapshot；restore/history/chat P1）。
- Rules & Memory。
- Tab Knowledge。
- Billing/Settings。

## 3. 点击插件流程

```ts
// popup.html
smartOrganizeButton.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

  await chrome.runtime.sendMessage({
    type: "RUN_TOOLBAR_ACTION",
    action: "smart-organize",
    activeWindowId: tab?.windowId,
    activeTabId: tab?.id
  });
});

// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "RUN_TOOLBAR_ACTION") return false;

  runToolbarAction(message, sender).then(sendResponse);
  return true;
});

async function runToolbarAction(message, sender) {
  const activeWindowId = message.activeWindowId ?? sender?.tab?.windowId;

  await chrome.storage.local.set({ "tabmosaic.sidebarMode": { mode: "agent" } });
  await chrome.sidePanel.open({ windowId: activeWindowId });
  await emitToSidePanel('ORGANIZE_STARTED', { activeWindowId });

  const snapshot = await collectAllNormalWindowTabs();
  const duplicates = detectDuplicates(snapshot);
  const safeDedupeActions = buildSafeDedupeActions(duplicates);

  const classificationInput = buildClassificationInput(snapshot, duplicates);
  const groupPlan = await classifyTabs(classificationInput);
  const validatedPlan = validateGroupPlan(groupPlan, snapshot);

  const undoSnapshot = await saveUndoSnapshot(snapshot);
  const result = await applyPlan(validatedPlan, safeDedupeActions);

  await emitToSidePanel('ORGANIZE_COMPLETED', { result, undoSnapshotId: undoSnapshot.id });
}
```

## 4. Manifest 建议

CONFIRMED BY USER: 设置 `default_popup` 为极简 toolbar action menu。popup 不承载复杂设置，不直接执行分组；它只收集当前 active tab/window 并向 background 发送动作消息。

```json
{
  "manifest_version": 3,
  "name": "TabMosaic AI",
  "version": "0.1.0",
  "action": {
    "default_title": "Open TabMosaic menu",
    "default_popup": "popup.html"
  },
  "permissions": [
    "tabs",
    "tabGroups",
    "storage",
    "sidePanel",
    "scripting",
    "activeTab"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  }
}
```

## 5. 关键模块

### Duplicate Detector

输入 TabSnapshot[]，输出 DuplicateGroup[]。

### Rules Engine

应用用户规则、学习规则和内置规则。

### AI Classifier

把未命中规则的 tabs 聚类成工作流导向 groups。

### Plan Validator

校验 AI 输出，防止 tabId 编造、重复分配、group 过多。

### Group Applier

使用 Chrome tabs/tabGroups API 创建、移动、更新 group。

### Undo Manager

保存操作前状态和关闭 tabs 信息。

## 6. P0 技术取舍

- Dashboard 可以先做 extension page，不一定马上做独立 web app。
- AI provider 抽象先做，hosted AI 可以 P1。
- Storage 先本地，云同步 P1。
- Multi-tab content extraction P1。
- Current tab summary P0。
