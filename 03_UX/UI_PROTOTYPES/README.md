# TabMosaic AI — UI 设计交付

**美学方向**:Monochrome Forge — 纯黑白灰,无任何彩色
**字体**:Fraunces(展示) + Inter(正文) + JetBrains Mono(数字/计数)

---

## 📂 文件清单

### 设计规范
- **`../06_UI_DESIGN_SYSTEM.md`** — 完整设计规范(Monochrome Forge token 体系、组件规范、信息架构、4 个核心界面线框、10 种 tab 状态、9 种 empty/error 状态)

### 可交互 HTML 原型
打开 `index.html` 浏览所有页面,或单独打开 `XX-name.html`

| 文件 | 内容 |
|---|---|
| `index.html` | 7 份 HTML 的导航索引 |
| `01-browser.html` | 浏览器主入口(完整 Chrome 外观 + 顶部 tab groups + 浮动 sidePanel) |
| `02-dashboard.html` | Dashboard v3(左 sidebar + 右 group 卡片网格) |
| `03-sidebar-states.html` | Sidebar 6 态(Result / Progress / Summary / Chat / Empty / Error) |
| `04-tab-states.html` | Tab 10 态(Active / Pinned / Audible / Suspended / Closed / Incognito / Protected / Chrome internal / Loading / Hover) |
| `05-onboarding.html` | 首装 4 帧(Welcome / Privacy / Aha moment / Toast) |
| `06-permissions.html` | 权限 6 帧(Read / Multi-tab / Sensitive / AI provider / Incognito / Web Store) |
| `07-command-palette.html` | ⌘K 命令面板(Recent / Groups / Tabs / Commands 4 分区) |

---

## 🎯 设计决策(Why Monochrome)

1. **完全去色** — TabMosaic 是生产力工具,不应"彩虹化"用户界面。Chrome 原生 8 色的 group tag 全部映射为 8 级灰阶
2. **状态不用颜色** — Active / Pinned / Audible / Suspended 用形状 + 字符 + 位置区分(✓ ● ○ / 2px 左 bar / 6px 圆角 pin dot)
3. **隐私语义显式** — 不藏 chip,直接告诉用户 `🔒 数据都在本机 / 不上传任何网站`
4. **3 档字体** — Fraunces 衬线作展示(空状态大字有"出版感"),Inter 正文,JetBrains Mono 数字

## ⌨️ 全局快捷键

- `⌘K` — 命令面板
- `⌘.` — 一键整理
- `⌘D` — 打开 Dashboard
- `⌘Z` — Undo
- 主题切换 — 右下角月亮按钮

---

**版本**:v0.4.2 · **交付日期**:2026-06-08
