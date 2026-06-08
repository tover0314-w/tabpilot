# Aha Moment 设计

## Aha moment 定义

用户点击插件图标后，当前浏览器所有普通窗口的顶部 tab bar 立刻从混乱变为清晰的原生 tab groups，并且重复 tabs 被安全清理。

用户的内心感受应该是：

> 这就是我本来要花 10 分钟手动做的事情，它点一下做完了。

## Aha moment 的组成

### 1. 可见的顶部变化

结果必须出现在顶部 tab bar：

```text
Before：多个窗口里都是几十个小 favicon，标题不可见。
After：[AI Research] [Chrome Docs] [GitHub Projects] [Product Planning] [Reading] [Misc]
```

### 2. 真实减少混乱

不仅分组，还要关闭安全重复 tabs。

```text
关闭 9 个完整重复或仅 tracking 参数不同的 tabs。
保留 4 个疑似重复供用户确认。
```

### 3. 快速解释

Sidebar 展示：

```text
已整理 73 个 tabs
创建 8 个 groups
关闭 9 个安全重复 tabs
4 个疑似重复待确认
[Undo] [Review] [Chat]
```

### 4. 可继续控制

用户可以立刻说：

```text
按项目重新分类。
不要把 YouTube 放娱乐，放 Learning。
把 GitHub PR 单独分一组。
总结当前页面。
保存这个工作区。
```

## 第一次使用的关键要求

1. 首次点击前只给轻量隐私说明，不能让 onboarding 太长。
2. 点击后必须有进度反馈，不要让用户感觉卡住。
3. 分组名称要像人类会取的名字，而不是域名列表。
4. 不要误关 active/pinned/audible tabs。
5. Undo 必须非常明显。

## Demo 脚本

### Before

打开 60 个 tabs，分布在多个普通窗口：

- 8 个 GitHub repo。
- 6 个 Chrome extension docs。
- 5 个重复的 GitHub issue。
- 6 个竞品页面。
- 8 篇博客文章。
- 4 个 YouTube 教程。
- 3 个购物页面。
- 其他杂项。

### Action

点击 TabMosaic AI icon。

### After

顶部出现：

```text
[Chrome Extension Docs] [AI Tab Manager Research] [GitHub Projects] [Product Planning] [Learning] [Shopping] [Misc]
```

Sidebar 展示：

```text
✅ Organized 60 tabs
7 groups created
48 tabs moved
8 safe duplicates closed
4 tabs need review
```

### User follow-up

用户输入：

```text
把 GitHub PR 都单独放 Code Review，以后也这么做。
```

Agent：

```text
已创建规则 github.com/*/*/pull/* → Code Review。
现在找到 5 个 PR tabs，已移动到 Code Review。
```
