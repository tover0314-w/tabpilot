# 文案库

## 产品 Headline

当前 extension first slice 已接入：

```text
extension/_locales/en/messages.json
extension/_locales/zh_CN/messages.json
```

MVP visible UI uses English-only copy to avoid mixed-language friction. Chinese copy remains in `_locales/zh_CN` as a future localization resource, but Sidebar/Dashboard should not switch visible copy based on the browser's Chinese locale until that experience is intentionally re-enabled.

英文：

```text
Click once. Every work tab falls into place.
```

中文：

```text
点一下，所有办公标签页自动归位。
```

## Subheadline

```text
TabMosaic AI automatically groups your tabs, removes safe duplicates, and lets you chat with any tab or workspace from the sidebar.
```

中文：

```text
TabMosaic AI 自动分类、清理安全重复标签页，并让你在侧边栏和任意标签页、分组或工作区聊天。
```

## 首次使用

```text
TabMosaic 会读取标签页标题、网站域名和路径来自动整理分组与检测重复。
默认不会把完整 URL 发送给 AI。
只有当你要求总结页面时，才会读取当前页面正文。
每次整理都可以撤销。
```

按钮：

```text
Start organizing
Customize privacy settings
```

## 整理完成

```text
我帮你整理好了。

73 个标签页已归类为 8 个分组。
我还关闭了 9 个安全重复标签页，并保留了 4 个疑似重复标签页等待你确认。
```

## Dashboard Latest Result

CONFIRMED BY USER: 这组文案作为 Dashboard Latest Result 的 MVP 信息层级。

English:

```text
Browser cleaned up
42 tabs organized into 6 work groups

Impact
4 duplicate tabs removed
31 tabs organized
2 duplicate groups need review
Memory relief: duplicate tabs closed

Review duplicates
Undo
```

中文：

```text
浏览器已整理
42 个标签页归入 6 个工作分组

本次优化
关闭 4 个重复标签页
整理 31 个标签页
2 组疑似重复待确认
内存压力已降低：重复标签页已关闭

处理重复项
撤销
```

Memory copy rule:

```text
MVP 只写 Memory relief / 内存压力已降低。
不要写精确 MB，直到有可信的内存测量或主动 sleep/discard tabs 功能。
```

## Duplicate 说明

```text
我只自动关闭了完整 URL 相同，或仅 tracking 参数不同的标签页。
active、pinned 和正在播放声音的标签页不会被自动关闭。
```

## Chat 引导

```text
你可以继续告诉我：
“按项目重新分类”
“把 GitHub PR 单独分组”
“总结当前页面”
“恢复刚刚关闭的标签页”
```

## Dashboard Paywall

```text
保存这个工作区，随时恢复你的研究上下文。
升级 Pro 后，你可以保存无限 workspace、总结整个分组，并和多个 tabs 聊天。
```

## 页面总结权限

```text
TabMosaic 需要读取当前页面文本来生成摘要。
默认不会读取其他 tabs 的页面内容。
默认不会读取密码、表单输入或隐藏内容。
```

## 错误状态

### AI 失败

```text
AI 分类暂时不可用。我已先用本地规则整理，你可以稍后重试 AI 优化。
```

### 页面不可总结

```text
这个页面无法读取内容，可能是浏览器内部页面、PDF、权限限制或站点安全策略。我仍然可以根据标题和 URL 帮你分类。
```

### tabs 太少

```text
当前浏览器里的标签页不多。我已检查重复标签页，没有强制创建分组。
```
