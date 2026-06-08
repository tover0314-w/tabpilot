# TabMosaic AI — Design System & UI Specification

> **Status**: Design v0.1 · 2026-06-08
> **Source of truth**: `/Users/bytedance/个人项目/aitab/` 产品文档 harness
> **Designer**: UI Designer
> **Aesthetic**: **Monochrome Forge** — 黑白灰为主,克制、精密、有"工程感"的高级极简

---

## 目录

1. [设计哲学与原则](#1-设计哲学与原则)
2. [配色系统(黑白灰)](#2-配色系统黑白灰)
3. [字体系统](#3-字体系统)
4. [间距、圆角、阴影、动效](#4-间距圆角阴影动效)
5. [信息架构总览](#5-信息架构总览)
6. [组件规范](#6-组件规范)
7. [核心界面设计](#7-核心界面设计)
   - 7.1 [顶部 Tab Bar(原生结果展示)](#71-顶部-tab-bar原生结果展示)
   - 7.2 [Action Icon 一键触发](#72-action-icon-一键触发)
   - 7.3 [Sidebar Agent(控制台)](#73-sidebar-agent控制台)
   - 7.4 [Dashboard(长期工作台)](#74-dashboard长期工作台)
8. [状态设计](#8-状态设计)
9. [可访问性](#9-可访问性)
10. [交付物清单](#10-交付物清单)

---

## 1. 设计哲学与原则

### 1.1 北极星

> **顶部 tab bar 立刻变整洁,sidebar 解释为什么,dashboard 沉淀长期价值。**

界面要让用户在使用时"看不见"我们,只看见自己想要的清晰分组。

### 1.2 Monochrome Forge 美学宣言

| 原则 | 含义 |
|---|---|
| **静默是基础色** | 90% 像素是黑/白/灰,信息靠**明度差**而非色相区分 |
| **一把刀做切割** | 只有"决策性"操作才用强调(CTA、active 状态、错误),其余退入背景 |
| **结构即装饰** | 用排版节奏、分割线、留白建立层级,不用阴影堆叠 |
| **数字很冷静** | 所有数字(计数、内存、credit)用 mono 字体,与文字形成对比 |
| **状态不用色** | Active / Pinned / Suspended 等状态使用图标 + 文字,不强加颜色语义 |
| **可逆才大胆** | 任何破坏性操作前必须可 Undo,UI 上让 Undo 永远随手可及 |

### 1.3 产品不可破坏的规则(来自 AGENTS.md)

- ✅ 自动整理后**必须**看到原生 tab groups 在顶部
- ✅ 关闭任何 tab 前**必须**可 Restore
- ✅ active / pinned / audible / incognito **永不**自动关闭
- ✅ Undo 按钮**永远**在 sidebar 第一屏可点
- ✅ AI 不可绕过确认直接做破坏性动作
- ❌ 不用渐变、霓虹、毛玻璃滥用
- ❌ 不用 AI 通用审美(紫蓝渐变、青+深色、玻璃光晕)

---

## 2. 配色系统(黑白灰)

### 2.1 灰阶系统(主色)

设计采用 **10 级灰阶**,以 `neutral-50 ~ neutral-1000` 命名:

```css
:root {
  /* —— Light theme (主推) —— */
  --neutral-0:    #FFFFFF;  /* 纯白,主面板背景 */
  --neutral-50:   #FAFAFA;  /* 主背景 */
  --neutral-100:  #F4F4F4;  /* 卡片/分组头 */
  --neutral-150:  #ECECEC;  /* hover 底 */
  --neutral-200:  #E0E0E0;  /* 默认边框 */
  --neutral-300:  #CCCCCC;  /* 强边框/分隔线 */
  --neutral-400:  #999999;  /* placeholder / icon idle */
  --neutral-500:  #767676;  /* 次要文字 (4.6:1 on #FFF ✅ AA) */
  --neutral-600:  #555555;  /* 副标题 (7.1:1 on #FFF ✅ AAA) */
  --neutral-700:  #333333;  /* 正文 (12.6:1 on #FFF ✅ AAA) */
  --neutral-800:  #1A1A1A;  /* 标题 */
  --neutral-900:  #0A0A0A;  /* 最高对比,仅 logo/数字大字 */
  --neutral-1000: #000000;  /* 极限黑(慎用) */

  /* —— 强调黑(主操作色) —— */
  --accent-black:    #0A0A0A;  /* 主 CTA */
  --accent-black-h:  #1F1F1F;  /* hover */
  --accent-black-a:  #000000;  /* active */

  /* —— 状态语义(仅用灰阶变化 + 图标,不靠颜色) —— */
  --state-success-fg: #1A1A1A;
  --state-success-bg: #F0F0F0;
  --state-warn-fg:    #1A1A1A;
  --state-warn-bg:    #ECECEC;
  --state-error-fg:   #0A0A0A;
  --state-error-bg:   #F4F4F4;
  --state-info-fg:    #1A1A1A;
  --state-info-bg:    #FAFAFA;
}

[data-theme="dark"] {
  --neutral-0:    #0A0A0A;
  --neutral-50:   #121212;
  --neutral-100:  #1A1A1A;
  --neutral-150:  #222222;
  --neutral-200:  #2A2A2A;
  --neutral-300:  #383838;
  --neutral-400:  #555555;
  --neutral-500:  #767676;
  --neutral-600:  #999999;
  --neutral-700:  #CCCCCC;
  --neutral-800:  #E0E0E0;
  --neutral-900:  #F4F4F4;
  --neutral-1000: #FFFFFF;

  --accent-black:    #F4F4F4;
  --accent-black-h:  #FFFFFF;
  --accent-black-a:  #E0E0E0;
}
```

### 2.2 Chrome 原生 Tab Group 颜色 → 灰阶映射

Chrome 原生 tab group 颜色是 8 色系统,我们将每一色映射为对应的灰阶变体,**只保留灰度区分**,不引入色相。

| Chrome 原生 | 我们的映射 | 灰度值 | 用途 |
|---|---|---|---|
| grey | `neutral-300` | #CCCCCC | 通用 / Misc |
| blue → blue-grey | `neutral-400` | #999999 | 默认 / 默认分组 |
| red → dark grey | `neutral-700` | #333333 | Code Review / 重要 |
| yellow → warm grey | `neutral-500` | #767676 | Reading / Learning |
| green → sage | `neutral-600` | #555555 | Product / Tasks |
| pink → mid grey | `neutral-450` | #888888 | Design |
| purple → slate | `neutral-550` | #6E6E6E | Research |
| cyan → cool grey | `neutral-480` | #808080 | Personal |

> AI 决定颜色 → 我们把它**灰度化**,让界面在视觉上不"彩虹化",但保留 8 个可区分的状态槽。

### 2.3 对比度核查(亮色)

| 组合 | 比值 | 标准 |
|---|---|---|
| `--neutral-900` on `--neutral-50` | 18.7:1 | ✅ AAA |
| `--neutral-800` on `--neutral-50` | 15.4:1 | ✅ AAA |
| `--neutral-700` on `--neutral-50` | 12.6:1 | ✅ AAA |
| `--neutral-600` on `--neutral-50` | 7.1:1 | ✅ AAA |
| `--neutral-500` on `--neutral-50` | 4.6:1 | ✅ AA 正文 |

所有文字、icon、border 在白底上**全部通过 WCAG AA**(正文 4.5:1,大字体 3:1)。

### 2.4 颜色使用铁律

| ✅ 允许 | ❌ 禁止 |
|---|---|
| 黑/白/灰 | 任何饱和色(除用户 favicon) |
| 透明度变化 | 渐变 |
| 1px 边框分隔 | 多层阴影堆叠 |
| 字重 + 字号区分层级 | 颜色作为唯一层级区分 |
| 图标形状表示状态 | 仅靠颜色表示状态 |

---

## 3. 字体系统

```css
:root {
  /* —— 展示字(衬线,带"出版感") —— */
  --font-display: "Fraunces", "Source Serif Pro", "Songti SC", Georgia, serif;
  /* 用于:产品 logo、空状态大字、dashboard page title */

  /* —— 正文字 —— */
  --font-sans: "Inter", -apple-system, "PingFang SC", "SF Pro Text", system-ui, sans-serif;
  /* 用于:UI 主体 */

  /* —— 数字 / 等宽 —— */
  --font-mono: "JetBrains Mono", "SF Mono", ui-monospace, monospace;
  /* 用于:计数、URL、时间戳、键盘提示、credit 数字、tab id */
}
```

### 3.1 字阶(模数 1.25)

| Token | 尺寸 | 字重 | 用途 |
|---|---|---|---|
| `text-display` | 32px | 500 | 页面大标题 |
| `text-h1` | 24px | 500 | sidebar/dashboard 一级标题 |
| `text-h2` | 18px | 500 | section 标题 |
| `text-h3` | 14px | 500 | group name, button |
| `text-body` | 13px | 400 | 默认正文 |
| `text-body-sm` | 12px | 400 | 副标题、URL、tab 描述 |
| `text-caption` | 11px | 500 | section label (大写 + 字距 0.08em) |
| `text-mono` | 12px | 400 | 数字、计数 |
| `text-mono-lg` | 16px | 500 | 数字大字(memory、credit 数字) |

---

## 4. 间距、圆角、阴影、动效

### 4.1 间距(4px 基线)

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
}
```

### 4.2 圆角

```css
:root {
  --radius-sm:   4px;   /* tag, kbd */
  --radius-md:   6px;   /* button, input */
  --radius-lg:   10px;  /* card */
  --radius-xl:   14px;  /* panel, modal */
  --radius-pill: 999px; /* 状态徽章 */
}
```

### 4.3 边框(代替阴影)

```css
:root {
  --border-1: 1px solid var(--neutral-200);
  --border-2: 1px solid var(--neutral-300);
  --border-3: 1px solid var(--neutral-400);  /* 强调 */
  --border-active: 2px solid var(--neutral-900);  /* 当前 group / active 状态 */
}
```

### 4.4 阴影(仅 2 档,克制)

```css
:root {
  --shadow-1: 0 1px 0 0 var(--neutral-200);  /* 仅做"凸起"暗示 */
  --shadow-2: 0 1px 2px 0 rgba(0,0,0,0.04), 0 4px 8px -2px rgba(0,0,0,0.06);
  /* modal/cmd palette 使用 */
}
```

### 4.5 动效

```css
:root {
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);
  --dur-instant: 80ms;
  --dur-fast:    150ms;
  --dur-base:    240ms;
  --dur-slow:    400ms;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-instant: 0ms;
    --dur-fast: 0ms;
    --dur-base: 0ms;
    --dur-slow: 0ms;
  }
}
```

**严禁**弹性回弹(back/elastic),只用 exponential ease-out。

---

## 5. 信息架构总览

```
┌─────────────────────────────────────────────────────────────┐
│ Chrome Top Tab Bar   ← 真实整理结果(原生 tab groups)        │
│ [Chrome Docs] [AI Research] [GitHub] [Product] [Reading]... │
└─────────────────────────────────────────────────────────────┘
         ▲ action icon click                ▲ sidebar open
         │                                  │
         │  ┌─────────────────┐  ┌──────────────────────────┐ │
         └──┤  Service Worker ├──┤  Sidebar (Chrome sidePanel)│
            └─────────────────┘  │  - Result Summary         │ │
                                  │  - Quick Actions [Undo]   │ │
                                  │  - Smart Groups           │ │
                                  │  - Duplicate Review       │ │
                                  │  - Chat                   │ │
                                  │  - Current Tab Summary    │ │
                                  └──────────────────────────┘ │
                                              │
                                              │ Open Dashboard
                                              ▼
                                  ┌──────────────────────────┐
                                  │ Dashboard (extension page)│
                                  │ Home / Smart Groups /     │
                                  │ Workspaces / Rules /     │
                                  │ Duplicates / Billing /   │
                                  │ Settings                  │
                                  └──────────────────────────┘
```

**职责矩阵**:

| 界面 | 角色 | 不该做什么 |
|---|---|---|
| **Top Tab Bar** | 展示真实整理结果 | 不解释复杂逻辑 |
| **Action Icon** | 一键触发自动整理 | 不弹传统 popup 拖慢流程 |
| **Sidebar** | 结果解释、Undo、聊天、总结 | 不承载长期复杂管理 |
| **Dashboard** | 长期管理、付费能力、workspace | 不阻塞首次 aha |

---

## 6. 组件规范

### 6.1 Button

| Variant | 用途 | 样式 |
|---|---|---|
| **Primary** | 主操作 (Organize / Apply) | bg `--accent-black`, fg `#FFF`, hover 上浮 1px |
| **Secondary** | 次操作 (Undo / Review) | bg transparent, 1px `--neutral-300` border, fg `--neutral-800` |
| **Ghost** | 工具栏按钮 | bg transparent, hover bg `--neutral-100` |
| **Danger** | 关闭 / 删除 | fg `--neutral-900` + 下划线,hover bg `--neutral-100` |
| **Icon** | 32×32 方形按钮 | 仅 icon,用于工具栏 |

- 高度:sm=28, md=36, lg=44
- 圆角: `--radius-md`
- 字号: `text-h3`
- 焦点环: 2px `--accent-black`,offset 2px

### 6.2 Tab Card (核心组件)

```
┌──────────────────────────────────────────────┐
│ ┌──┐  Title goes here, truncates...     ✕  │
│ │  │  domain.com · 2h ago                  │
│ └──┘                                        │
└──────────────────────────────────────────────┘
```

- 尺寸: 宽度自适应 grid,高度 64px
- 内边距: `--space-3 --space-4`
- 圆角: `--radius-lg`
- 背景: `--neutral-0`,hover → `--neutral-50` + 1px border 升 `--neutral-300`
- **Favicon**: 16px 圆角方块,左对齐;占位符显示域名首字 + `neutral-100` 底
- **State 视觉**:
  - **Active**(当前 group 中当前 tab):左侧 2px solid `--neutral-900` + 1px border 同色
  - **Pinned**:favicon 右上 4px 实心 `--neutral-900` 圆点 + 1.5px 白描边
  - **Audible**:右下 6px 同心圆,内圆 `--neutral-900`,外环 1px 透明圈 + 1px `--neutral-300`
  - **Suspended / Closed duplicate**:opacity 0.45,favicon 加 `grayscale(0.9)`,border 改 `dashed` + `--neutral-300`,右上角 `↺` 角标
  - **Incognito**:左侧 1px 斜纹(用 `repeating-linear-gradient(45deg, ...)` 模拟),icon 加 `🕶` 文字标签
  - **Protected**:favicon 右上加 `🛡` 文字标签,极小 9px

### 6.3 Sidebar Group Row

```
┌────────────────────────────────────────┐
│ ●  AI Tab Manager Research   14  ▾    │
└────────────────────────────────────────┘
```

- 高度 36px,内边距 `--space-3 --space-4`
- 行首:8px 圆点,使用 8 级灰阶之一
- 标题: `text-body`,`--neutral-900`,truncate
- 计数: `text-mono`,`--neutral-500`
- 展开/折叠图标右对齐,默认展开
- Hover:bg `--neutral-50`
- 子项 (tab 行):缩进 28px,高度 28px,字号 `text-body-sm`

### 6.4 Chat Input

```
┌──────────────────────────────────────────────────┐
│  Context: [Current Tab ▾]                        │
│  ┌────────────────────────────────────────┐  ↵   │
│  │ Ask TabMosaic about your tabs...        │      │
│  └────────────────────────────────────────┘      │
└──────────────────────────────────────────────────┘
```

- 高度 input 44px,context selector 在上方 32px
- 圆角 `--radius-md`
- 1px `--neutral-200` border
- 聚焦:border 变 `--neutral-900` + 1px 光环
- placeholder: `--neutral-500`

### 6.5 Status Badge

仅文字 + 背景,不用颜色:

| 状态 | 文字 | 背景 | 文字色 |
|---|---|---|---|
| Success | "Organized" | `--neutral-100` | `--neutral-900` |
| Warning | "Need review" | `--neutral-150` | `--neutral-900` |
| Error | "Closed" | `--neutral-200` | `--neutral-900` |
| Info | "Protected" | `--neutral-100` | `--neutral-700` |

### 6.6 Toast

- 背景 `--neutral-900`,文字 `--neutral-0`
- 圆角 `--radius-md`,padding 10px 14px
- 字号 `text-body`,icon 在左侧
- 入场: fade + translateY(-8px → 0),`--dur-base`
- 自动消失 1.8s
- 位置:sidebar 底部 / dashboard 底部居中

### 6.7 Command Palette (⌘K)

- 覆盖全屏,半透明黑底 `rgba(10,10,10,0.4)`
- 居中卡片 width min(640px, 92vw)
- 圆角 `--radius-xl`,bg `--neutral-0`
- 搜索框 56px,带 kbd 提示
- 结果列表 max-height 50vh
- 分组:Groups / Tabs / Sessions
- 选中行 bg `--neutral-100`

### 6.8 Progress (sidebar 整理中)

```
┌────────────────────────────────────────┐
│  Organizing your tabs...               │
│                                        │
│  ✓ Scanned 73 tabs                     │
│  ✓ Found 9 safe duplicates             │
│  ● Creating smart groups               │
│  ○ Updating top tab bar                │
│                                        │
│  This will be undoable.                │
└────────────────────────────────────────┘
```

- 已完成项:✓ 字符,`--neutral-400` 灰
- 进行中项:● 圆点 + 1px 流动虚线(可选)
- 待办:○ 圆圈,`--neutral-300`
- 整体:左对齐纵向列表,无 spinner

### 6.9 Privacy Indicator

数据流向用极小 mono 字 + 边框图标:

| 场景 | 图标 | 文字 |
|---|---|---|
| 仅本地处理 | `[ LOCAL ]` | "Local only" |
| 发送到云端 AI | `[ CLOUD ]` | "Sent to AI provider" |
| 用户提供 key | `[ API KEY ]` | "Using your API key" |

样式:1px `--neutral-300` border,圆角 3px,padding 1px 5px,`text-mono` 9px,`--neutral-700`

### 6.10 Permission Prompt(首次读取当前页正文)

```text
TabMosaic 需要读取当前页面文本来生成摘要。

默认不会读取其他 tabs 的页面内容。
默认不会读取密码、表单输入或隐藏内容。

[Allow for this page]  [Don't allow]
```

- 居中 modal,宽度 440px
- 标题用 `text-h1` 衬线
- 正文用 `text-body`
- 主操作黑底,次操作灰边
- 下方 1px `--neutral-200` 分割,加 1 行 9px `text-caption` 灰字解释数据用途

---

## 7. 核心界面设计

### 7.1 顶部 Tab Bar(原生结果展示)

#### 7.1.1 设计原则

顶部 tab bar **不是我们设计的 UI** — 它是 Chrome 原生 chrome。
我们设计的是:
- **Sidebar** 解释 bar 的变化
- **Group color/icon 映射规则**(让用户能理解每个 group 的含义)
- **首次整理后的状态通知**(让用户立刻看到结果)

#### 7.1.2 Group 颜色映射(灰度化)

每个 group 名称左边有 Chrome 原生彩色圆点(保留作为视觉锚点),
但在我们自己的 UI 中(Sidebar / Dashboard)统一用 8 级灰度色块表示:

| Group 用途示例 | 原生色 | 我们的灰度 | 含义 |
|---|---|---|---|
| Chrome Extension Docs | blue | neutral-400 | 工程/技术 |
| AI Tab Manager Research | purple | neutral-550 | 研究 |
| GitHub PR / Code Review | red | neutral-700 | 重要/紧急 |
| Product Planning | green | neutral-600 | 任务 |
| Reading / Learning | yellow | neutral-500 | 阅读 |
| Design | pink | neutral-450 | 设计 |
| Personal | cyan | neutral-480 | 个人 |
| Misc | grey | neutral-300 | 其他 |

#### 7.1.3 顶部状态条(可选浮层)

首次整理完成后,在 tab bar 下方淡入一条 1px 高提示条,3 秒后自动消失:

```text
✓ Organized 73 tabs into 8 groups · Closed 9 duplicates · [Undo]
```

- 背景 `--neutral-900`,文字 `--neutral-0`
- 高度 28px,字号 `text-body-sm`
- 关闭按钮在右,点击立即消失
- 不用颜色,只用 ✓ 字符 + 文字

---

### 7.2 Action Icon 一键触发

#### 7.2.1 浏览器工具栏图标

- 尺寸 16×16 / 32×32 / 48×48
- 设计:黑底白字"T"或简单几何拼图(保持识别度,不追求精致插画)
- 状态:无 click 动画(Chrome 不支持)

#### 7.2.2 首次使用 onboarding(替换 popup)

> 关键:不要用 `default_popup`,否则 `chrome.action.onClicked` 不会触发。
> 改为:首次 click 时,sidebar 自动打开并显示轻量隐私说明。

```
┌────────────────────────────────────────────┐
│  TabMosaic AI                       [×]    │
├────────────────────────────────────────────┤
│                                            │
│  Click once. Your browser organizes        │
│  itself.                                   │
│                                            │
│  TabMosaic reads tab titles and URLs to     │
│  group tabs and find duplicates.           │
│  It only reads page content when you ask   │
│  for a summary.                            │
│                                            │
│  Every organize action is undoable.        │
│                                            │
│  [Start organizing]  [Privacy settings]    │
│                                            │
└────────────────────────────────────────────┘
```

- 标题: `text-display` 32px 衬线,`--neutral-900`
- 正文: `text-body`,`--neutral-600`
- Start organizing: Primary 黑底
- Privacy settings: Secondary 灰边
- 字号、行距遵循 token

#### 7.2.3 日常 click(第二次起)

- 不显示 onboarding
- sidebar 自动打开 active window
- 直接进入"整理中"进度态(见 6.8)
- 1.5 秒内完成(本地规则优先)

---

### 7.3 Sidebar Agent(控制台)

#### 7.3.1 Sidebar 整体布局

Chrome sidePanel 推荐宽度 320-400px。我们的设计:

- 宽度:固定 360px
- 背景: `--neutral-50`
- 顶部:固定 header(48px),含产品名 + 设置 icon
- 底部:固定 footer(60px),含 chat input
- 中部:scroll 区域,容纳所有结果

```
┌──────────────────────────────────────┐
│ TabMosaic AI                     ⚙   │  ← header
├──────────────────────────────────────┤
│                                      │
│  [Result Summary / Progress]         │
│                                      │
│  [Quick Actions]                     │
│                                      │
│  [Smart Groups]                      │
│                                      │
│  [Duplicate Review]                  │
│                                      │
│  [Guided Prompts]                    │
│                                      │
│  [Current Tab Summary]               │
│                                      │
│  ...scrollable...                    │
│                                      │
├──────────────────────────────────────┤
│ Context: [Current Tab ▾]             │
│ [Ask TabMosaic...]              [↵]   │  ← footer (sticky)
└──────────────────────────────────────┘
```

#### 7.3.2 整理完成态(主屏)

参考 PRD 文字线框图 03_UX/03_WIREFRAMES_TEXT.md 第二节:

```
┌──────────────────────────────────────┐
│ TabMosaic AI                     ⚙   │
├──────────────────────────────────────┤
│                                      │
│  ✓ Organized 73 tabs                 │  ← 大字,24px,h1
│  8 groups created                    │
│  61 tabs moved                       │
│  9 safe duplicates closed            │
│  4 duplicates need review            │
│                                      │
│  [ Undo ]  [ Review ]  [ Dashboard ] │  ← 行动按钮组
│                                      │
│  ─────────────────────────────       │
│                                      │
│  SMART GROUPS                        │  ← label caption
│                                      │
│  ▾ AI Tab Manager Research     14    │  ← 展开的 group
│    · open-source tabs manager repo   │
│    · competitor: Toby                 │
│    · ...                             │
│  ▸ Chrome Extension Docs        9    │
│  ▸ GitHub Projects             12    │
│  ▸ Product Planning             8    │
│  ▾ Reading                       10    │  ← 展开
│    · Medium article                  │
│    · ...                             │
│  ▸ Misc                          4    │
│                                      │
│  ─────────────────────────────       │
│                                      │
│  DUPLICATE REVIEW                    │
│  9 closed · 4 to review              │
│  [ See all ]                         │
│                                      │
│  ─────────────────────────────       │
│                                      │
│  TRY ASKING                          │
│  [按项目重新分类]                     │
│  [把 GitHub PR 单独分组]             │
│  [总结当前页面]                       │
│                                      │
├──────────────────────────────────────┤
│ Context: [Current Tab ▾]             │
│ Ask TabMosaic...                 [↵]  │
└──────────────────────────────────────┘
```

**关键规范**:
- "Organized 73 tabs" 用 `text-display` 衬线大字,**让"成功"有仪式感**
- 数字用 `text-mono` `text-mono-lg` 16px,加粗,与中文文字形成对比
- Undo 按钮 **永远**是 Secondary(不是 Ghost,确保用户能找到)
- Smart Groups 列表每个 group 最多展开 3 行 tabs,更多可"View all"进入 dashboard
- 4 个 guided prompt 是预设 chip,可点击直接发送

#### 7.3.3 整理中态(进度)

```
┌──────────────────────────────────────┐
│ TabMosaic AI                     ⚙   │
├──────────────────────────────────────┤
│                                      │
│  Organizing your tabs...             │  ← h1
│                                      │
│  ✓ Scanned 73 tabs                   │
│  ✓ Found 9 safe duplicates           │
│  ● Creating smart groups             │  ← 当前
│  ○ Updating top tab bar              │
│                                      │
│  This will be undoable.              │
│                                      │
│  [ Cancel ]                          │
│                                      │
└──────────────────────────────────────┘
```

- 不用 spinner(避免 AI 通用感)
- 用文字列表 + ✓/●/○ 字符,极简
- 步骤完成时整行变 `--neutral-400`(视觉退场)
- 当前步骤保持 `--neutral-900` + ●

#### 7.3.4 Current Tab Summary

```
┌──────────────────────────────────────┐
│ ← Back to results                    │
│                                      │
│ CURRENT TAB SUMMARY                  │
│                                      │
│ chrome.sidePanel API                 │  ← h2
│ developer.chrome.com                 │  ← mono,中性灰
│                                      │
│ 这个页面介绍 Chrome 扩展如何在浏览器  │
│ 侧边栏承载 UI。                        │
│                                      │
│ Key points                           │
│ 1. side panel 是 extension page      │
│ 2. 可通过用户动作打开                  │
│ 3. 适合伴随浏览的工具                  │
│                                      │
│ Suggested group                      │
│ Chrome Extension Docs                 │
│                                      │
│ Suggested action                     │
│ Keep                                  │
│                                      │
│ [ Move ]  [ Save ]  [ Ask more ]     │
│                                      │
└──────────────────────────────────────┘
```

- "← Back" 是文字按钮,左上角
- 大字标题用 `text-h1`,不是 display
- Key points 用有序列表,数字 1/2/3 不加粗
- 三个 action 按钮一字排开,主操作在右

#### 7.3.5 Chat 状态(对话中)

```
┌──────────────────────────────────────┐
│ ← Back to results                    │
│                                      │
│ You · 14:23                           │
│ ┌──────────────────────────────────┐ │
│ │ 把 GitHub PR 都单独放 Code       │ │
│ │ Review,以后也这么做。             │ │
│ └──────────────────────────────────┘ │
│                                      │
│ TabMosaic · 14:23                     │
│ ┌──────────────────────────────────┐ │
│ │ 已创建规则:                       │ │
│ │ github.com/*/*/pull/*            │ │
│ │ → Code Review                    │ │
│ │                                  │ │
│ │ 找到 5 个 PR tabs,已移动。        │ │
│ │  [ Apply ]                       │ │
│ └──────────────────────────────────┘ │
│                                      │
│ You · 14:24                           │
│ ┌──────────────────────────────────┐ │
│ │ 再帮我看看 Reading 那个 group。   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ TabMosaic · 14:25                     │
│ ● typing...                          │  ← 三点动画可选,或省略
│                                      │
├──────────────────────────────────────┤
│ Context: [Current Tab ▾]             │
│ Ask TabMosaic...                 [↵]  │
└──────────────────────────────────────┘
```

- 用户消息:右对齐,bg `--neutral-100`,圆角左下/右下小
- AI 消息:左对齐,bg `--neutral-0`,1px `--neutral-200` 边框
- AI 消息中的 action 块:单独卡片,有明确 Apply 按钮
- 时间用 mono 9px 灰字

#### 7.3.6 Empty / Error 状态

| 场景 | 主文案 | 副文案 | Actions |
|---|---|---|---|
| Tabs < 6 | "你的标签页还不多" | "我检查了重复标签页,没有强制分组" | [Check again] [Dashboard] |
| 无重复 | "没有发现安全重复标签页" | "我会继续帮你按主题整理分组" | [Organize anyway] |
| AI 失败 | "AI 分类暂时不可用" | "我已先使用本地规则整理,你可以稍后重试 AI 优化" | [Retry AI] [Rules only] |
| 页面不可总结 | "这个页面无法读取内容" | "可能是浏览器内部页面、PDF、权限限制或站点安全策略" | [Use URL only] |
| Restore 失败 | "有些标签页无法恢复" | "可能是 URL 不可访问或浏览器限制。我已恢复可以恢复的" | [View log] |

每个空状态居中,大留白,主文案用 `text-display` 24px,**保持产品语气"我在"而非"系统错误"**。

---

### 7.4 Dashboard(长期工作台)

#### 7.4.1 Dashboard 整体结构

作为 extension page,采用经典左侧导航 + 右侧主区的两栏布局:

```
┌────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐  ┌────────────────────────────────────────┐ │
│ │              │  │ Home                                    │ │
│ │  TabMosaic    │  │  Current Workspace                      │ │
│ │  AI          │  │                                        │ │
│ │              │  │  73 tabs · 8 groups                     │ │
│ │ ─────────    │  │  9 duplicates closed                   │ │
│ │  Home        │  │  4 need review                         │ │
│ │  Smart Groups│  │  Memory: 1.2 GB / 4.0 GB               │ │
│ │  Workspaces  │  │  AI credits: 320 / 1000                │ │
│ │  Tab         │  │                                        │ │
│ │   Knowledge  │  │  [ Organize Window ]                   │ │
│ │  Rules &     │  │  [ Open Current Workspace ]            │ │
│ │   Memory     │  │  [ Review Duplicates ]                 │ │
│ │  Duplicate   │  │  [ Chat with Current Tabs ]            │ │
│ │   Center     │  │                                        │ │
│ │  Billing     │  │  ────────────────────────              │ │
│ │  Settings    │  │                                        │ │
│ │              │  │  Recent Activity                       │ │
│ │              │  │  • 14:23 Organized 73 tabs            │ │
│ │              │  │  • 13:01 Closed 9 duplicates           │ │
│ │              │  │  • Yesterday Created rule: PR→Review   │ │
│ │              │  │                                        │ │
│ └──────────────┘  └────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

- 左导航 240px,固定
- 右主区自适应,内部 padding `--space-6`
- 左导航 active 项:bg `--neutral-100`,左侧 2px solid `--neutral-900`
- 顶部无 header 栏(节省空间)

#### 7.4.2 Home

见 02_FEATURE_SPECS/05_DASHBOARD.md 第 5 节。当前浏览器指标 + AI credits + 4 个 CTA。

```
Current Workspace
═══════════════════════════════════

 73         8            4           1.2 GB
 tabs       groups       need        memory used
 
───────────────────────────────────
 
 320 / 1000
 AI credits this month
 
───────────────────────────────────
 
 [ Organize Window ]    [ Open Workspace ]
 [ Review Duplicates ]  [ Chat with Tabs ]
```

- 数字用 `text-mono-lg` 16px,加粗
- 标签用 `text-caption` 11px 大写灰
- 4 个 CTA 排成 2x2 grid

#### 7.4.3 Smart Groups 看板

参考 PRD 文字线框图第 5 节。Group Card 列表:

```
┌────────────────────────────────────────────────────┐
│ SMART GROUPS                              8 groups │
├────────────────────────────────────────────────────┤
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ ●  AI Tab Manager Research    14 tabs        │  │
│ │    open-source and competitor research        │  │
│ │    github.com · chromewebstore · blogs        │  │
│ │                                              │  │
│ │    [Chat] [Summarize] [Rename] [Apply]       │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ ●  Chrome Extension Docs        9 tabs        │  │
│ │    ...                                        │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

- Group Card: bg `--neutral-0`,1px border,radius-lg
- Hover: border 升 `--neutral-400`,可拖拽区域出现
- 4 个 action 按钮在底部,文字按钮,无填充
- 圆点用 8 级灰度色(不染色)

#### 7.4.4 Group Detail + Chat

打开某个 Group Card 后,右侧主区切换为双栏:

```
┌────────────────────────────────────────────────────────────────┐
│ ← Back to Smart Groups                                         │
│                                                                │
│ AI Tab Manager Research                                        │
│ 14 tabs · last updated 2 min ago                               │
│                                                                │
│ ┌──────────────────────────────┐  ┌────────────────────────┐  │
│ │ TABS                         │  │ CHAT                  │  │
│ │                              │  │                       │  │
│ │ □ GitHub repo A              │  │ Ask about this        │  │
│ │   github.com · 5m            │  │ group...              │  │
│ │ □ GitHub repo B              │  │                       │  │
│ │   github.com · 1h            │  │ [Send]                │  │
│ │ □ Chrome Web Store listing   │  │                       │  │
│ │   chromewebstore · 2h        │  │                       │  │
│ │ ...                          │  │                       │  │
│ │                              │  │                       │  │
│ │ [Move] [Close] [Protect]     │  │                       │  │
│ └──────────────────────────────┘  └────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

- 左 60% / 右 40% 比例
- Tab 列表项可勾选,选中后顶部出现 batch action bar
- 右侧 chat 是独立 context(scope = current group)

#### 7.4.5 Workspaces

```
WORKSPACES                                  [ + New ]
─────────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│ ●  AI Tab Manager Research        Saved 2h ago  │
│    8 groups · 73 tabs                            │
│    Research workspace for AI tab management.    │
│                                                  │
│    [ Open ]  [ Restore ]  [ Chat ]  [ ⋯ ]      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ●  Travel plan — Tokyo             Saved 1d ago  │
│    5 groups · 22 tabs                            │
│    ...                                            │
│                                                  │
│    [ Open ]  [ Restore ]  [ Chat ]  [ ⋯ ]      │
└─────────────────────────────────────────────────┘
```

- 卡片纵向堆叠
- "●" 圆点用 8 级灰度
- 时间用 mono,`--neutral-500`
- "⋯" 触发 dropdown:Duplicate / Rename / Archive / Delete / Export

#### 7.4.6 Tab Knowledge(摘要库)

```
TAB KNOWLEDGE
─────────────────────────────────────────────────────

  Search summaries...                  [ 🔍 ]

  Filter: [ All ] [ Saved ] [ Recent ]

─────────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│ chrome.sidePanel API                    2h ago  │
│ developer.chrome.com · Chrome Extension Docs    │
│                                                  │
│ This page explains how Chrome extensions can     │
│ use the side panel.                              │
│                                                  │
│ Key points:                                      │
│ 1. Extensions can host content in side panel     │
│ 2. Side panel remains open across navigation     │
│ 3. It can be opened from a user gesture          │
│                                                  │
│ [ Open tab ]  [ Chat ]  [ Delete ]               │
└─────────────────────────────────────────────────┘
```

#### 7.4.7 Rules & Memory

```
RULES & MEMORY                         12 active
─────────────────────────────────────────────────────

  Filter: [ All ] [ Manual ] [ Chat-created ] [ Auto-suggested ]

┌─────────────────────────────────────────────────┐
│ github.com/*/*/pull/*  →  Code Review      ON  │
│ Created from chat · 12 hits · last used 2h ago   │
│                                                  │
│ [ Edit ]  [ Disable ]  [ Delete ]                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ developer.chrome.com/docs/extensions/*  →  ...  │
│ Built-in rule · 47 hits                          │
│                                                  │
│ [ Edit ]  [ Disable ]  [ Delete ]                │
└─────────────────────────────────────────────────┘
```

- 规则行:左侧 pattern(mono)+ → + target group
- 右侧 toggle(自定义组件,纯黑白)
- 来源 chip:`[ Manual ]` `[ Chat ]` `[ Auto ]` `[ Built-in ]`

#### 7.4.8 Duplicate Center

```
DUPLICATE CENTER
─────────────────────────────────────────────────────

  9 closed  ·  4 to review  ·  3 protected

[ Closed (9) ]  [ To Review (4) ]  [ Protected (3) ]

─────────────────────────────────────────────────────

Closed today
─────────────────

  ✓ Stripe Dashboard                  stripe.com
    Closed 14:23 · exact duplicate                [ Restore ]

  ✓ Stripe Dashboard                  stripe.com
    Closed 14:23 · exact duplicate                [ Restore ]

  ✓ Vercel — Edge functions           vercel.com?utm=...
    Closed 14:23 · tracking-param duplicate      [ Restore ]
```

- Tab 切换 Closed / To Review / Protected
- 每行:✓ 字符 + title + domain + 关闭原因 + Restore 按钮
- Restore 按钮:文字按钮,在右侧

#### 7.4.9 Billing

```
USAGE & BILLING
─────────────────────────────────────────────────────

  Current plan:  Free
  Status:  Active

  [ Upgrade to Pro ]   [ Manage subscription ]

─────────────────────────────────────────────────────

  This month
  
  Organize actions       12 / ∞
  Current tab summary    8 / 20
  Group summary          0 / 0      (Pro)
  Multi-tab chat         0 / 0      (Pro)
  Saved workspaces       1 / 3
  
─────────────────────────────────────────────────────

  AI credits
  
  320 / 1000  used this month
  
  [ Get more credits ]   [ Use your own API key ]
```

- 进度条用纯灰度条,不用颜色
- "Pro" 字样加灰底 chip 标识
- 自配 API key 入口在底部,引导自配 API key

#### 7.4.10 Settings

```
SETTINGS
─────────────────────────────────────────────────────

  General
  ────────
  Language                 [ English ▾ ]
  Default scope            [ All windows ▾ ]
  Sidebar opens on click   [ ON ]
  
  Privacy
  ────────
  Local only (no AI)                [ OFF ]
  Send title + hostname only        [ ON ]
  Allow full URL to cloud AI        [ OFF ]
  Allow summarize current tab       [ ON ]
  Allow summarize multiple tabs     [ OFF ]   (Pro)
  Save summaries to dashboard       [ OFF ]
  
  Sensitive sites
  ────────────────
  Never read content from these sites
  [ bank.com  ✕ ]  [ stripe.com  ✕ ]  [ + add ]
  
  Never auto-close tabs from these sites
  [ mail.google.com  ✕ ]  [ + add ]
  
  Data
  ─────
  Export all data
  Delete all local rules
  Delete all summaries
  Delete all workspaces
  Sign out
  
  About
  ──────
  Version 0.1.0
  Help & feedback
  Privacy policy
```

- 所有 toggle 组件:黑底 + 白圆点,极简
- 敏感域名用 chip 形式列出,带 ✕ 按钮
- "Delete" 类操作需二次确认 modal

---

## 8. 状态设计

### 8.1 状态总览

| 状态 | 视觉处理 | 文字标识 |
|---|---|---|
| **Active (当前 group 中当前 tab)** | 左侧 2px solid `--neutral-900` + 1px border 同色 | 无(光看视觉) |
| **Pinned** | favicon 右上 4px 实心黑圆 + 白边 | 无 |
| **Audible** | 右下 6px 同心圆,内黑外环透明 | "·" 字符 |
| **Suspended** | opacity 0.45,grayscale 0.9,border dashed | "Suspended" 角标 |
| **Closed duplicate (待 review)** | opacity 0.35,border dashed | "↺" 角标 + Restore 按钮 |
| **Incognito** | 1px 斜纹条 + 9px "🕶" | "Incognito" 文字 |
| **Protected (user-marked)** | favicon 右上 9px "🛡" | 无 |
| **chrome://** | 整卡 opacity 0.5 | "System" 角标 |

### 8.2 不确定状态的可视化

- 分类 confidence < 0.7:tab card 右侧加 1px 虚线 + "?" 图标
- 分类 confidence 0.5-0.69:自动放入 "Review Needed" group
- 分类 confidence < 0.5:自动放入 "Misc" group

### 8.3 进度态(整理进行中)

- 不用 spinner(避免 AI 通用感)
- 文字列表 + ✓/●/○ 字符
- 当前步骤文字保持 `--neutral-900`,已完成的步骤淡到 `--neutral-400`
- 整个 sidebar 在整理期间不可点击(只有 Cancel 可用)

### 8.4 Empty / Loading / Error 全表

| 状态 | 视觉 | 文案模板 |
|---|---|---|
| **Empty** | 居中,大留白 ≥ 40% 高度,大字 display 24px | "[X] 还没有" + 引导 CTA |
| **Loading** | 文字进度(见 6.8) | "Organizing your tabs..." |
| **Error** | 居中卡片,1px 红边(实际是 `--neutral-700`),display 标题 | "[X] 失败" + Retry / Help |
| **Partial** | 主内容 + 顶部 1px 提示条 | "[X] 部分完成,其余请稍后重试" |

---

## 9. 可访问性

### 9.1 视觉

- 所有交互文本 ≥ 12px
- 正文文字对比度 ≥ 4.5:1(`--neutral-600` on `--neutral-50` = 7.1:1,达标)
- 大字体(>18px)对比度 ≥ 3:1
- 焦点环: 2px `--accent-black`,offset 2px,**永远可见**
- 选中态:用 2px 左边条 + 1px border,不只靠颜色

### 9.2 键盘

- 所有交互可键盘完成
- ⌘K / Ctrl+K 打开 command palette
- Esc 关闭 modal/command palette
- Tab/Shift+Tab 在 sidebar 中循环
- 方向键 ↑↓ 在列表中移动
- Enter 触发主操作
- ⌘Z Undo(全局)

### 9.3 屏幕阅读器

- 所有 icon 按钮带 `aria-label`
- 状态变化用 `aria-live="polite"` 通知
- 模态框 trap focus
- Sidebar landmark:`<aside aria-label="Primary">`
- Tab group 状态:`aria-label="AI Tab Manager Research, 14 tabs, expanded"`

### 9.4 动效

- `@media (prefers-reduced-motion: reduce)` 关闭所有动效
- 进度态不依赖颜色变化
- 状态变化有文字说明(不只靠图标)

### 9.5 隐私语义

- 每个 AI 操作前显示 `[ LOCAL ]` / `[ CLOUD ]` / `[ API KEY ]` 标签
- 数据流向用文字明确告知,不仅靠 icon
- 首次读取页面正文时,modal 解释 4 条数据原则

---

## 10. 交付物清单

本次 `06_UI_DESIGN_SYSTEM.md` 对应的可交付资产:

| 资产 | 路径 | 状态 |
|---|---|---|
| **本文档** | `03_UX/06_UI_DESIGN_SYSTEM.md` | ✅ v0.1 |
| **设计 Token (CSS Variables)** | 见 §2 §3 §4 | ✅ |
| **组件规范** | 见 §6 | ✅ |
| **核心界面线框描述** | 见 §7 | ✅ |
| **可交互 HTML 原型** | `03_UX/UI_PROTOTYPES/index.html` | ✅ 已归档到 harness |
| **静态设计稿 (SVG)** | 不在本次 zip 中 | 未交付 |

### 后续待办(按优先级)

- [ ] 基于 `03_UX/UI_PROTOTYPES/` 校准所有原型与最新 TabMosaic 决策(P0 整理所有普通窗口、英中双语、DeepSeek/OpenAI-compatible provider)
- [ ] Dashboard 静态设计稿(Smart Groups 看板、Group Detail、Workspaces、Rules、Billing、Settings)
- [ ] Empty / Error 状态设计稿(汇总 9 种状态)
- [ ] 整理流程动画(进度态)演示
- [ ] Dark mode 完整对照(已交付 dark mode 截图,但需补完所有界面)

---

## 附录 A:与产品文档的对应关系

| 设计章节 | 对应产品文档 |
|---|---|
| §1 设计哲学 | `AGENTS.md` §1, §2 |
| §2 配色 | `AGENTS.md` §2(克制 + 黑白灰) |
| §3 字体 | `01_PRODUCT/04_AHA_MOMENT.md`(产品语气) |
| §5 信息架构 | `03_UX/01_INFORMATION_ARCHITECTURE.md` |
| §6 组件 | `02_FEATURE_SPECS/*` 各功能模块 |
| §7.1 顶部 Tab Bar | `02_FEATURE_SPECS/01_ONE_CLICK_AUTOPILOT.md` §5 |
| §7.2 Action Icon | `02_FEATURE_SPECS/01_ONE_CLICK_AUTOPILOT.md` §4 |
| §7.3 Sidebar | `02_FEATURE_SPECS/04_SIDEBAR_AGENT.md` §3-7 |
| §7.3.3 Progress | `02_FEATURE_SPECS/01_ONE_CLICK_AUTOPILOT.md` §4 |
| §7.3.4 Current Tab Summary | `02_FEATURE_SPECS/07_PAGE_SUMMARY.md` §7 |
| §7.3.5 Chat | `02_FEATURE_SPECS/06_TAB_CHAT.md` §2 |
| §7.3.6 Empty/Error | `03_UX/05_EMPTY_ERROR_STATES.md` |
| §7.4 Dashboard | `02_FEATURE_SPECS/05_DASHBOARD.md` §6-12 |
| §8 状态 | `02_FEATURE_SPECS/02_AUTO_CLASSIFICATION.md` §9 |
| §9 可访问性 | `AGENTS.md` §13(quality bar) |

---

## 附录 B:与原有 TabsForge 原型的关系

之前的设计材料含有通用 Tab Manager / TabsForge 思路。本次 `06_UI_DESIGN_SYSTEM.md` 基于 `aitab/` 实际产品 harness **重新设计**:

| 维度 | TabsForge(原) | TabMosaic AI(本次) |
|---|---|---|
| 配色 | 黑白灰 + 一点赤铜 | **纯黑白灰,完全去色** |
| 顶部 tab bar | 模拟在主视图 | **强调用 Chrome 原生 tab groups** |
| 主入口 | sidebar | **点击 action icon → sidebar 打开** |
| Sidebar 角色 | tab 管理 | **结果解释 + Undo + Chat** |
| Dashboard | 不在原设计中 | **完整 P0 dashboard 规范** |
| Chat | 命令面板 | **对话 + 上下文选择器 + 行动** |
| 隐私 | 通用 | **LOCAL/CLOUD/API KEY 标签明示** |
| 状态设计 | Active/Suspended | **10 种状态(加 Pinned/Audible/Incognito/Protected)** |

后续实现或继续迭代原型时,以本设计系统、`03_UX/UI_PROTOTYPES/` 和 `00_START_HERE/03_DECISIONS_TO_CONFIRM.md` 为准。

---

**Owner**: UI Designer
**Date**: 2026-06-08
**Status**: v0.1, ready for prototype rebuild
**Confirmed by product harness**: Yes (based on `aitab/AGENTS.md` §17 confirmed items)

> 本文档不替代产品 harness。任何与产品决策冲突时,以 `aitab/00_START_HERE/03_DECISIONS_TO_CONFIRM.md` 为准。
