# 功能规格：Sidebar Agent

## 1. 目标

Sidebar 是一键整理后的控制台。它解释顶部 tab bar 的变化，提供 Undo/Restore、Review、聊天纠错和当前页面总结。

## 2. Sidebar 角色

```text
顶部 tab bar：展示真实整理结果。
Sidebar：解释、复盘、纠错、对话、总结。
Dashboard：长期管理和付费工作台。
```

## 3. Sidebar 首屏

```text
✅ 已整理 73 个标签页

创建 8 个分组
移动 61 个标签页
关闭 9 个安全重复标签页
4 个疑似重复待确认
5 个标签页放入 Misc

[Undo] [Review duplicates] [Open Dashboard]
```

## 4. 模块结构

### A. Outcome Summary

显示整理结果摘要。

### B. Group Overview

显示 groups 列表：

```text
AI Tab Manager Research     14 tabs
Chrome Extension Docs        9 tabs
GitHub Projects             12 tabs
Product Planning             8 tabs
Reading                     10 tabs
Misc                         4 tabs
```

每个 group 支持：

- 展开查看 tabs。
- Rename。
- Collapse / Expand。
- Move to new window。
- Chat with group。
- Save workspace。

### C. Duplicate Cleanup

显示已关闭和待确认重复项。

### D. Guided Prompts

```text
[按项目重新分类]
[把 GitHub PR 单独分组]
[不要按网站分]
[总结当前页面]
[保存为工作区]
[恢复刚刚关闭的标签页]
```

### E. Chat Input

placeholder：

```text
Ask TabMosaic about your tabs...
```

## 5. Sidebar Chat 能力

- 重新分类。
- 合并/拆分 group。
- 重命名 group。
- 移动 tabs。
- 创建规则。
- 总结当前页面。
- 总结当前 group / P1。
- 找可关闭 tabs。
- 保存 workspace。
- 打开 dashboard。

## 6. Chat 动作安全等级

| 操作 | 默认行为 |
|---|---|
| 创建/移动/重命名 group | 可直接执行，提供 Undo |
| 折叠 group | 可直接执行 |
| 关闭 exact duplicate | 可直接执行，提供 Restore |
| 关闭 non-duplicate tabs | 必须确认 |
| 读取当前页面正文 | 首次必须确认 |
| 读取多个页面正文 | 必须确认 |
| 上传正文到云端 | 必须明确授权 |

## 7. 示例交互

用户：

```text
不要按网站分，按项目分。
```

Agent：

```text
我会把当前分组改成项目维度：
- Chrome Extension Development
- AI Tab Manager Research
- Product Planning
- Reading
- Misc

这会移动 37 个 tabs，不会关闭任何 tab。
[Apply] [Cancel]
```

用户：

```text
以后所有 GitHub PR 都放 Code Review。
```

Agent：

```text
已创建规则 github.com/*/*/pull/* → Code Review。
我现在找到 6 个 PR tabs，可以立刻移动。
[Apply]
```

## 7.1 Chat Refine 当前实现

CONFIRMED BY IMPLEMENTATION:

```text
Sidebar includes a local Chat Refine input.
The first slice is command-to-action, not open-ended cloud chat.
User input creates a preview first.
Browser changes require explicit Apply.
Cancel discards the draft.
No page body is read.
No AI request is made.
No tabs are closed.
Chinese input returns Chinese preview answer/action/risk copy.
```

Supported first commands:

```text
GitHub PR to Code Review
docs.google.com to Docs & Notes
current tab to Reading
rename Misc to Reading
把 GitHub PR 放到 Code Review
把 docs.google.com 放到文档笔记
把当前标签页放到阅读
把 Misc 改名为阅读
```

Supported actions:

```text
- create local user rule and move matching current tabs
- move current tab to a native Chrome group
- rename matching native Chrome groups
```

Rules created from chat are stored locally and appear in Dashboard → Rules & Memory.

## 8. 验收标准

```gherkin
Given 自动整理已完成
When sidebar 打开
Then 用户能看到整理摘要、分组列表、重复清理结果、Undo 和引导 prompts
And 用户能通过聊天调整分组
And 用户能总结当前页面
And 高风险动作需要确认
And Chat Refine preview 不读取页面正文、不调用云端 AI、不关闭 tabs
```
