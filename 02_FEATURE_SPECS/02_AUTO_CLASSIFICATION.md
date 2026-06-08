# 功能规格：AI + Rules 自动分类

## 1. 目标

把当前浏览器所有普通窗口的 tabs 自动分成接近人工整理效果的 Chrome 原生 tab groups。

分类目标不是按网站分，而是按用户任务、项目、意图分。

## 2. 好分类 vs 坏分类

### 好分类

```text
AI Tab Manager Research
Chrome Extension Docs
GitHub PR Review
Product Planning
Dev Tools
Articles to Read
Shopping
Misc
```

### 坏分类

```text
GitHub
Google
YouTube
Docs
Other
Websites
```

按域名分可以作为 fallback，但不是理想结果。

## 3. 分类输入

默认输入：

```json
{
  "tabId": 123,
  "title": "chrome.sidePanel API - Chrome for Developers",
  "hostname": "developer.chrome.com",
  "path": "/docs/extensions/reference/api/sidePanel",
  "existingGroup": null,
  "windowId": 456,
  "active": true,
  "pinned": false,
  "audible": false,
  "discarded": false
}
```

默认不输入：

- 页面正文。
- cookie。
- 表单内容。
- localStorage/sessionStorage。
- 密码字段。

## 4. 分类 Pipeline

```text
1. Collect tabs from all normal windows
2. Normalize metadata
3. Remove/mark duplicate candidates
4. Apply user rules
5. Apply learned rules
6. Apply built-in rules
7. AI clustering for unmatched tabs
8. Validate result
9. Generate native group plan
10. Apply to browser
```

## 5. Rule 优先级

```text
User explicit rule
> User correction memory
> Protected rules
> Built-in domain rules
> AI classification
> Review/Misc
```

## 6. Built-in Rules 示例

```text
developer.chrome.com/docs/extensions/* → Chrome Extension Docs
github.com/*/*/pull/* → GitHub PR Review
github.com/*/*/issues/* → GitHub Issues
docs.google.com → Docs
figma.com → Design
linear.app → Product / Tasks
stripe.com/dashboard → Finance / Payments
vercel.com → Dev Tools
supabase.com → Dev Tools
youtube.com/watch + tutorial/lesson/course → Learning
```

Built-in rules 不能过度武断。若用户纠正，用户规则优先。

## 7. AI 输出 Schema

```json
{
  "groups": [
    {
      "name": "Chrome Extension Docs",
      "color": "blue",
      "tabIds": [1, 2, 3],
      "confidence": 0.94,
      "reason": "These tabs are Chrome extension API documentation."
    }
  ],
  "reviewTabIds": [9, 10],
  "suggestedRules": [
    {
      "pattern": "developer.chrome.com/docs/extensions/*",
      "groupName": "Chrome Extension Docs"
    }
  ]
}
```

## 8. Validation

AI 输出必须校验：

- 不得 invent tabId。
- 每个 tab 至多出现一次。
- group name 不得为空。
- group 数量不得过多。
- group color 必须是 Chrome 支持颜色。
- protected tabs 不得被放入关闭动作。
- confidence 低于阈值的 tabs 放 Review/Misc。

## 9. 分类置信度

| Confidence | 行为 |
|---|---|
| 0.90+ | 直接应用 |
| 0.70-0.89 | 应用，但 sidebar 标记可调整 |
| 0.50-0.69 | 放 Review Needed |
| < 0.50 | 放 Misc |

## 10. 用户纠错学习

用户可以说：

```text
以后 GitHub PR 都放 Code Review。
不要把 YouTube 放娱乐，放 Learning。
Linear 和 Notion 都放 Product。
```

系统生成规则并应用当前 tabs。

## 11. 验收标准

```gherkin
Given 当前浏览器所有普通窗口有多个主题的 tabs
When 用户点击插件
Then 系统生成 4-10 个任务/项目导向的 groups
And 大部分 tabs 被分入合理 group
And 低置信度 tabs 被放入 Misc/Review
And 用户可以通过 sidebar chat 修改分类
And 用户修改可沉淀为规则
```
