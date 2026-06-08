# 功能规格：和 Tab / Tabs / Group 聊天

## 1. 目标

让用户可以在 sidebar 或 dashboard 中和浏览器上下文聊天，包括当前页面、选中的多个 tabs、某个 group、当前窗口、当前浏览器所有普通窗口或历史 workspace。

## 2. Chat Scope Selector

聊天框上方提供上下文选择器：

```text
Context: [Current Tab] [Selected Tabs] [Current Group] [Current Window] [All Windows] [Workspace]
```

## 3. Scope 定义

| Scope | P0/P1 | 说明 |
|---|---|---|
| Current Tab | P0 | 当前激活页面 |
| Selected Tabs | P1 | 用户在 sidebar/dashboard 勾选多个 tabs |
| Current Group | P1 | 当前 Chrome group 或 dashboard group |
| Current Window | P1 | 当前窗口所有 tabs |
| All Windows | P1/Pro | 当前浏览器所有普通窗口 tabs |
| Workspace | P1/Pro | 保存的历史工作区 |

## 4. Current Tab Chat

用户可以问：

```text
这个页面讲了什么？
总结这个页面。
这个 GitHub 项目有什么功能？
这个文档和我做 Chrome 插件有什么关系？
提取 API 使用方法。
这个页面应该放到哪个 group？
这个页面值得保留吗？
```

输出：

```text
摘要
关键点
建议分组
建议操作：keep / close / read later
相关 tabs
```

## 5. Selected Tabs Chat

用户可以问：

```text
总结这 8 个页面的区别。
这些竞品有什么共同功能？
哪些 tabs 可以关闭？
把这些内容整理成 PRD。
做一个对比表。
```

输出：

- 对比表。
- 每个 tab 摘要。
- 共同主题。
- 建议保留/关闭/归档。
- 建议分组。

## 6. Group Chat

用户可以问：

```text
这个 group 主要在讲什么？
把这个 group 再细分。
这个 group 里哪些页面重复？
把这个 group 总结成研究 memo。
```

## 7. Workspace Chat

Pro 能力：

```text
我昨天的 AI tab manager research 里，哪些项目支持自动去重？
把上周的竞品研究总结成一页 memo。
恢复我写 PRD 时打开的工作区。
```

## 8. 数据读取策略

| 场景 | 默认读取 | 是否需要确认 |
|---|---|---|
| Current tab metadata | title/url/hostname | 不需要 |
| Current tab content | 正文 | 首次需要 |
| Multiple tabs metadata | title/url/hostname | 不需要 |
| Multiple tabs content | 正文 | 必须确认 |
| Workspace stored summaries | 已保存摘要 | 不需要，若用户已同意保存 |

## 9. Agent 行为

Agent 回答不应只是聊天文本，还可以生成 actions：

```json
{
  "answer": "这些 tabs 主要是竞品研究。",
  "suggestedActions": [
    {"type": "CREATE_GROUP", "name": "Competitor Research", "tabIds": [1,2,3]},
    {"type": "CLOSE_TABS", "tabIds": [9], "requiresConfirmation": true}
  ]
}
```

## 10. 验收标准

```gherkin
Given 用户在 sidebar 选择 Current Tab
When 用户输入“总结这个页面”
Then 系统读取当前页面内容并返回摘要
And 建议分组和操作

Given 用户在 dashboard 勾选多个 tabs
When 用户输入“做对比表”
Then 系统生成多 tab 对比结果
And 可保存到 Tab Knowledge
```
