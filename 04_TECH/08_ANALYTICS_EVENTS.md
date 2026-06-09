# Analytics Events

## 1. 原则

只收集产品改进所需的最小事件数据，不记录具体 URL、页面正文或用户敏感内容。

## 1.1 Current Implementation Status

DO NOT BUILD YET / CONFIRM:

```text
The private-beta extension currently has no remote analytics endpoint and no automatic telemetry upload.
The event shapes below are future product/analytics design notes, not implemented behavior.
Any analytics involving browsing activity must go through the confirmation gate before implementation.
```

## 2. Core Events

### extension_installed

```json
{
  "timestamp": 0,
  "version": "0.1.0"
}
```

### organize_started

```json
{
  "windowTabCountBucket": "50-100",
  "source": "action_icon"
}
```

### organize_completed

```json
{
  "tabCount": 73,
  "groupCount": 8,
  "movedTabsCount": 61,
  "safeDuplicatesClosed": 9,
  "reviewDuplicates": 4,
  "miscTabsCount": 5,
  "durationMsBucket": "2-5s",
  "aiUsed": true
}
```

### undo_clicked

```json
{
  "actionType": "AUTO_ORGANIZE",
  "timeSinceActionBucket": "0-30s"
}
```

### restore_closed_tabs_clicked

```json
{
  "closedTabsCount": 9,
  "restoredTabsCount": 9
}
```

### chat_refine_sent

```json
{
  "scope": "current_window",
  "intent": "regroup"
}
```

注意：不记录用户原文，除非用户明确 opt-in。

### summary_requested

```json
{
  "scope": "current_tab",
  "contentRead": true,
  "provider": "hosted"
}
```

### dashboard_opened

```json
{
  "source": "sidebar"
}
```

### paywall_seen

```json
{
  "feature": "group_summary"
}
```

## 3. 成功指标计算

- Aha completion rate = organize_completed / organize_started。
- Immediate undo rate = undo_clicked within 60s / organize_completed。
- Dashboard activation = dashboard_opened / organize_completed。
- Paid intent = paywall_seen + upgrade_clicked + workspace_save_attempt。
- Classification friction = chat_refine_sent + dashboard_drag_drop_count。

## 4. 不应收集

- URL。
- full title / 除非用户 opt-in。
- 页面正文。
- chat 原文。
- email/账号之外的身份信息。
- 浏览历史。
