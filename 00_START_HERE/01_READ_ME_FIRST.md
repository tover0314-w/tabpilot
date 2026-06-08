# 先读这个

本文档包的目的不是“写一篇 PRD”，而是建立一个可以持续迭代的产品 harness：每个关键模块都有独立 Markdown 文件，方便你之后直接拆成 Linear/Jira 任务、给设计师画 UI、给工程师做架构、给投资人做产品叙事。

如果未来让 AI coding/product/design agents 继续协作，先读根目录 `AGENTS.md`。它规定了如何读取 harness、何时必须停下来找用户确认、如何更新文档、以及 Chrome extension 实现中的安全和隐私护栏。

## 产品当前版本定义

产品名暂定：**TabMosaic AI**  
一句话：**点一下，所有办公标签页自动归位；在侧边栏继续处理。**

命名说明：`TabPilot` 已发现同类 Chrome 扩展和 `tabpilot.ai` 冲突，不适合作为独立开发者 SEO/域名增长的主品牌。

## 当前核心产品结构

```text
Chrome 顶部 tab bar（当前浏览器所有普通窗口）
  └─ 展示真实的原生 Chrome tab groups

Extension action icon
  └─ 点击后触发一键自动整理

Sidebar Agent
  ├─ 显示整理结果
  ├─ Undo / Restore
  ├─ Review duplicates
  ├─ Chat refine
  └─ 和当前 tab / tabs / group 聊天与总结

Dashboard
  ├─ Smart Groups 看板
  ├─ Workspaces
  ├─ Rules & Memory
  ├─ Tab Knowledge
  ├─ Duplicate Center
  ├─ Usage & Billing
  └─ Settings
```

## 最重要的产品共识

### 1. 主入口不是聊天，是点击即整理

用户不应该先打开 sidebar 再想怎么和 AI 说。用户应该点击插件图标，然后立刻看到当前浏览器所有普通窗口的顶部 tab bar 出现清晰分组。

### 2. Sidebar 是控制台，不是主舞台

Sidebar 用于解释“刚才发生了什么”、提供 Undo、查看重复 tabs、继续聊天、总结当前页面。

### 3. Dashboard 是付费核心

一键整理解决即时混乱，dashboard 解决长期工作流。用户为 dashboard、workspace memory、多 tab chat、AI 记忆和历史工作区付费。

### 4. 必须建立信任

自动分组可以大胆一点，因为可撤销。自动关闭 tabs 要非常谨慎，只自动关闭高置信度重复项，active/pinned/audible 绝不自动关闭。

## 如何使用这套文档

- 产品讨论：从 `01_PRODUCT/01_PRD.md` 开始。
- 功能拆解：看 `02_FEATURE_SPECS/`。
- 设计稿：看 `03_UX/`。
- 技术开发：看 `04_TECH/`。
- 项目管理：看 `05_PROJECT/`。
- 每次做重大调整前：先看 `AGENTS.md`、`00_START_HERE/02_CONFIRMATION_PROTOCOL.md` 和 `00_START_HERE/03_DECISIONS_TO_CONFIRM.md`。
