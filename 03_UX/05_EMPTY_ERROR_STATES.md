# Empty / Error States

## 0. 当前实现

CONFIRMED BY IMPLEMENTATION:

```text
Side panel organize error:
- shows the raw safe error summary
- states that no tabs were moved or closed
- suggests Organize Again or copying a redacted diagnostic snapshot from Dashboard

Dashboard organize error:
- renders a compact glass error card
- states that no tabs were moved or closed
- suggests retrying with Organize Browser or copying diagnostics from Settings
```

Safety:

```text
These error states do not move tabs, close tabs, read page content, call AI, upload diagnostics, add analytics, or request new permissions.
```

## 1. Tabs 太少

场景：当前浏览器所有普通窗口合计少于 6 个 tabs。

```text
你的标签页还不多。
我检查了重复标签页，没有必要强制分组。
```

Actions：

```text
[Check duplicates again]
[Open Dashboard]
```

## 2. 没有重复 tabs

```text
没有发现安全重复标签页。
我会继续帮你按主题整理分组。
```

## 3. AI 分类失败

```text
AI 分类暂时不可用。
我已先使用本地规则整理，你可以稍后重试 AI 优化。
```

Actions：

```text
[Retry AI]
[Use rules only]
[Open settings]
```

## 4. 权限不足

```text
TabMosaic 需要读取标签页标题和 URL 才能自动整理。
你可以在 Chrome 扩展设置中调整权限。
```

## 5. 页面不可读取

```text
这个页面无法读取内容。
可能是浏览器内部页面、扩展页面、PDF、权限限制或站点安全策略。
```

## 6. Dashboard 空状态

```text
还没有保存的工作区。
整理当前浏览器后，你可以把好的分组保存成 workspace。
```

CTA：

```text
[Organize Browser]
```

## 7. Rules 空状态

```text
还没有规则。
你可以在聊天中告诉我你的偏好，例如：
“以后 GitHub PR 都放 Code Review。”
```

## 8. Restore 失败

```text
有些标签页无法恢复，可能是 URL 不可访问或浏览器限制。
我已经恢复了可以恢复的标签页。
```

## 9. AI credits 不足

```text
本月 AI credits 已用完。
你可以升级 Pro、等待下个月刷新，或使用自己的 API key。
```
