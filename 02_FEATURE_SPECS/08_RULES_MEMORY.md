# 功能规格：Rules & Memory

## 1. 目标

让 TabMosaic AI 越来越符合用户自己的分类习惯。AI 第一次可能分错，但用户纠正后，下次必须变聪明。

## 2. 核心原则

```text
用户规则 > 用户纠错记忆 > 内置规则 > AI 分类 > Review/Misc
```

## 3. 规则来源

| 来源 | 示例 |
|---|---|
| 手动创建 | dashboard 中创建 domain rule |
| Chat 创建 | “以后 GitHub PR 都放 Code Review” |
| 拖拽纠错 | 用户把 linear.app 从 Misc 拖到 Product |
| Rename 习惯 | 用户把 Dev 改名为 Engineering |
| 关闭保护 | 用户标记 stripe.com 永不自动关闭 |

## 4. 规则类型

```ts
DomainRule
UrlPatternRule
TitleKeywordRule
SemanticRule
ProtectedTabRule
DoNotReadContentRule
CollapsePreferenceRule
NamingPreferenceRule
```

## 5. 示例规则

```json
{
  "id": "rule_001",
  "type": "url_pattern",
  "pattern": "github.com/*/*/pull/*",
  "targetGroupName": "Code Review",
  "priority": 100,
  "enabled": true,
  "createdFrom": "chat",
  "hitCount": 12
}
```

## 6. Chat 创建规则

用户：

```text
以后所有 GitHub PR 都放 Code Review。
```

Agent：

```text
我会创建规则：github.com/*/*/pull/* → Code Review。
现在找到 6 个匹配 tabs，可以立即移动。
[Apply]
```

## 7. Dashboard 管理

Rules & Memory 页面显示：

- 规则名称。
- pattern。
- target group。
- 来源。
- 命中次数。
- 上次使用时间。
- 启用/禁用。
- 编辑/删除。

### 7.1 当前实现

CONFIRMED BY IMPLEMENTATION:

```text
- Chat Refine can create local rules.
- Rules are stored in chrome.storage.local under tabmosaic.userRules.
- Rule inputs use metadata only: hostname, path, title, and tab state.
- User rules apply before AI and built-in classification on future organize runs.
- Dashboard → Rules & Memory lists rules.
- Dashboard Delete requires confirmation before removing a local rule.
- Dashboard supports Enable, Disable, and Delete.
- Hit count and last-used timestamp update when rules match during organize/apply.
```

First supported rule types:

```text
url_pattern: github.com/*/*/pull/* → Code Review
domain: docs.google.com → Docs & Notes
domain: any current hostname mentioned in Chat Refine → target group
```

First supported Chinese Chat Refine examples:

```text
把 GitHub PR 放到 Code Review
把 docs.google.com 放到文档笔记
把当前标签页放到阅读
把 Misc 改名为阅读
```

## 8. 自动建议规则

当用户连续多次把相同 domain/path 移到同一 group，系统提示：

```text
你已经 3 次把 linear.app 放到 Product。要创建长期规则吗？
[Create rule]
```

## 9. 隐私规则

用户可创建：

```text
bank.com → never summarize
stripe.com/dashboard → never auto-close
docs.google.com → ask before reading content
```

## 10. 验收标准

```gherkin
Given 用户通过聊天表达分类偏好
When Agent 创建规则
Then 规则出现在 dashboard Rules 页面
And 下次自动分类优先应用该规则
And 用户可以禁用或删除规则
```
