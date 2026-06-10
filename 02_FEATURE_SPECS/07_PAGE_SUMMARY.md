# 功能规格：当前页面总结

## 1. 目标

让用户在 sidebar 中快速理解当前页面，判断是否值得保留、归到哪个 group、是否稍后阅读。

## 2. P0 范围

- 总结当前激活 tab。
- 提取关键点。
- 建议分组。
- 建议操作：keep / close / read later。
- 用户明确触发后读取页面正文。

## 3. 用户入口

- Sidebar prompt：`总结当前页面`。
- Group overview 中 tab row 的 `Summarize`。
- Chat 输入：`这个页面讲了什么？`

## 4. 首次权限文案

```text
TabMosaic 需要读取当前页面文本来生成摘要。
默认不会读取其他 tabs 的页面内容。
默认不会读取密码、表单输入或隐藏内容。
[Allow for this page]
```

## 5. 内容提取

优先提取：

```text
document.title
canonical URL
meta description
h1/h2/h3
article/main/body readable text
selected text
visible links
```

禁止提取：

```text
password inputs
form values
hidden DOM
cookies
localStorage
sessionStorage
```

## 6. 输出结构

```json
{
  "title": "chrome.sidePanel API",
  "summary": "This page explains how Chrome extensions can use the side panel.",
  "keyPoints": [
    "Extensions can host content in the browser side panel.",
    "The side panel can remain open across tab navigation.",
    "It can be opened from a user gesture."
  ],
  "suggestedGroup": "Chrome Extension Docs",
  "suggestedAction": "keep",
  "confidence": 0.92
}
```

## 7. UI 呈现

```text
当前页面摘要

这个页面是 Chrome sidePanel API 文档，介绍扩展如何在浏览器侧边栏展示 UI。

关键点：
1. side panel 是扩展页面。
2. 可以在用户点击 action icon 后打开。
3. 适合做持续伴随浏览的工具。

建议分组：Chrome Extension Docs
建议操作：保留

[Move to Chrome Extension Docs] [Save summary] [Ask follow-up]
```

## 8. Error States

### 页面不可读取

```text
这个页面无法读取内容，可能是浏览器内部页面、PDF、权限限制或站点安全策略。
我仍然可以根据标题和 URL 帮你分类。
```

### 内容过长

```text
这个页面较长，我会先总结可见主要内容。需要更完整摘要可以使用 Pro deep summary。
```

### 登录页面

```text
这个页面看起来可能包含私密信息。请确认是否读取当前页面正文。
```

## 9. 验收标准

```gherkin
Given 用户打开一个普通网页
When 用户在 Sidebar composer 里发起当前页总结或当前页问答
Then 系统首次请求读取当前页面内容授权
And 返回摘要、关键点、建议分组和建议操作
And 用户可以继续追问
```
