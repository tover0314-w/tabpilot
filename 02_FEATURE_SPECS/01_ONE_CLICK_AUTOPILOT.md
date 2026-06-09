# 功能规格：One-click Autopilot

## 1. 功能目标

用户点击 Chrome toolbar 的插件图标后，无需输入指令，TabMosaic AI 自动完成：

1. 扫描当前浏览器所有普通窗口 tabs。
2. 检测安全重复 tabs。
3. 按任务/项目/主题自动分类。
4. 创建或更新 Chrome 原生 tab groups。
5. 关闭高置信度安全重复 tabs。
6. 打开 sidebar 展示结果、Undo、Review 和聊天入口。

## 2. 为什么这是 P0

用户明确认为：点击后自动分类、去重，且分类效果接近人工，是产品的 aha moment。

因此 P0 不是“AI 给建议”，而是“AI 自动把浏览器整理好”。

## 3. 默认行为

| 项 | 默认建议 | 状态 |
|---|---|---|
| 整理范围 | 当前浏览器所有普通窗口，不处理 incognito | CONFIRMED |
| Sidebar | 自动打开 active window 的 sidebar | CONFIRMED |
| 分类应用 | 自动应用 | CONFIRMED BY DISCUSSION |
| Exact duplicate | 自动关闭，保留 active/pinned/audible/recent/protected | DECIDED |
| Tracking duplicate | canonical URL 高置信一致时自动关闭 | DECIDED |
| Hash/query duplicate | 只进入 Review | DECIDED |
| Active/pinned/audible | 永不自动关闭 | DECIDED |
| 已有用户 groups | 尽量保留，不强行打乱 | DECIDED |

## 4. 用户流程

```text
用户点击插件 icon
→ sidebar 打开并显示 “Scanning tabs..."
→ 系统收集所有普通窗口 tabs metadata
→ 检测重复 tabs
→ 本地规则分类
→ AI 聚类分类
→ 验证方案
→ 保存 undo snapshot
→ 应用 native tab groups
→ 关闭安全重复 tabs
→ sidebar 显示结果
```

## 5. 成功输出

顶部 tab bar：

```text
[Current Project] [Chrome Docs] [GitHub Projects] [Research] [Reading] [Misc]
```

Sidebar：

```text
✅ 已整理 73 个标签页
创建 8 个分组
移动 61 个标签页
关闭 9 个安全重复标签页
4 个疑似重复待确认

[Undo] [Review duplicates] [Save workspace]
```

## 6. 质量要求

| 指标 | P0 目标 |
|---|---|
| Group 数量 | 4–10 个，视 tab 数变化 |
| 明显错误分类 | < 10% |
| Misc/Review 占比 | < 15% |
| 高置信度重复误关 | 接近 0 |
| 操作可撤销 | 100% |
| 首次整理完成反馈 | 必须有 |

## 7. 保护规则

以下 tabs 不得自动关闭：

- active tab
- pinned tab
- audible tab
- incognito tab
- chrome:// 页面
- extension:// 页面
- 用户标记 protected 的 tabs
- 无法恢复 URL 的 tabs

## 8. 验收标准

```gherkin
Given 当前浏览器所有普通窗口共有 20+ tabs
When 用户点击插件图标
Then 插件自动扫描并整理当前浏览器所有普通窗口
And 浏览器顶部 tab bar 显示 4-10 个原生 tab groups
And group 名称反映任务/项目/主题
And exact duplicate tabs 被安全关闭
And active/pinned/audible tabs 未被关闭
And sidebar 展示整理摘要
And 用户可以 Undo
```

## 9. Edge Cases

### Tabs 太少

若 tabs < 6：

- 可以只检测重复。
- Sidebar 提示“当前 tabs 不多，已检查重复”。
- 不强制创建多个 groups。

### AI 超时

如果 AI 分类超过阈值：

- 先展示进度。
- 可 fallback 到规则分类。
- Sidebar 提示“已先用本地规则整理，AI 优化稍后可重试”。

CONFIRMED BY IMPLEMENTATION:

- DeepSeek/OpenAI-compatible classification request has a timeout guard.
- On timeout, one-click organize continues with local rules and surfaces fallback status in Sidebar/Dashboard.
- Timeout fallback does not change AI payload fields, host permissions, page text reading, or duplicate-close policy.

### 用户正在拖拽 tabs

Chrome 可能暂时不允许移动 tabs。需要 retry/backoff。

### 多窗口

P0 默认整理当前浏览器所有普通窗口。Sidebar 在 active window 打开并展示跨窗口整理进度；结果摘要需要标明涉及的窗口数量。Incognito 窗口默认不处理。
