# TabMosaic AI Product Harness

版本日期：2026-06-08  
Harness version：v0.3  
产品形态：Chrome Extension + Sidebar Agent + Dashboard  
核心定位：**One-click AI tab organizer with a sidebar agent and workspace dashboard**

这是一份面向独立开发者的产品/功能/技术文档包，目标是把我们讨论过的想法沉淀成可继续设计、开发、验证和融资/商业化沟通的项目 harness。

新增根目录 `AGENTS.md` 用于约束未来的 AI coding/product/design agents：先读 harness、尊重确认门、不要私自决定高影响事项、所有重要变更要落到对应 Markdown 文件。

当前工作产品名：**TabMosaic AI**。`TabPilot` 已发现同类 Chrome 扩展和 `tabpilot.ai` 冲突，不再作为主品牌候选。

## 核心共识

1. **P0 的 aha moment 是点击插件图标后，当前浏览器所有普通窗口的顶部 tab bar 直接变整洁。**
2. 整理结果必须使用 **Chrome 原生 tab groups**，而不是只在 sidebar 里做一个假看板。
3. Sidebar 是结果解释、Undo、Review、聊天、当前页面总结和二次指令入口。
4. Dashboard 是付费核心：管理长期分组、workspace、规则、AI 记忆、摘要库、使用量和订阅。
5. 用户可以在 sidebar 或 dashboard 里和当前 tab、选中的 tabs、某个 group、当前窗口、当前浏览器所有普通窗口或历史 workspace 聊天。
6. 所有高风险操作必须可撤销；关闭 tabs 必须区分安全重复和低置信度重复。
7. 任何需要产品拍板的内容必须停下来确认，见 `00_START_HERE/02_CONFIRMATION_PROTOCOL.md` 和 `00_START_HERE/03_DECISIONS_TO_CONFIRM.md`。

## 当前已确认方向

- 首发目标用户：办公和知识工作者，独立开发者作为早期传播子人群。
- 首发语言：英文 + 中文，后续再扩展多语言。当前扩展 UI 已接入 Chrome `_locales/en` 和 `_locales/zh_CN` first slice。
- P0 整理范围：当前浏览器所有普通窗口，不默认处理 incognito。
- 点击插件后：自动打开 sidebar，展示进度和后续操作入口。
- MVP AI：DeepSeek API 简单测试，保留 OpenAI-compatible provider abstraction。

## 文档地图

```text
AGENTS.md          Agent 操作规范：如何阅读 harness、何时停下来确认、如何更新文档
agents.md          lowercase compatibility pointer
CHANGELOG.md       版本变化记录
dist/              本地生成的扩展 zip 包
00_START_HERE/     阅读顺序、确认机制、术语表、未决决策
01_PRODUCT/        PRD、产品策略、用户画像、aha moment、竞品参考
02_FEATURE_SPECS/  一键整理、分类、去重、sidebar、dashboard、tab chat、付费等功能规格
03_UX/             信息架构、用户流程、文字线框、文案、状态设计、UI 设计系统、HTML 原型
04_TECH/           Chrome 扩展架构、API、数据模型、AI prompt、存储、安全、测试
05_PROJECT/        路线图、sprint、backlog、风险、发布清单
05_PROJECT/07_STORE_SUBMISSION_DRAFT.md  Chrome Web Store / 隐私政策草案，DO NOT SUBMIT YET
06_REFERENCES/     官方来源、假设、后续调研清单、原始交付归档
extension/         当前可加载的 Chrome Extension 开发切片
tools/             无依赖本地验证脚本，例如 extension smoke test
```

## 本地验证

当前不依赖 npm。可从仓库根目录运行：

```bash
node tools/extension_smoke_test.js
```

它会检查 manifest 权限、英文/中文本地化、权限解释、脱敏本地错误日志、本地误关恢复安全审计计数、脱敏 beta 诊断快照和反馈模板、Chat Refine parser、用户规则优先级、重复项安全策略、AI 输出校验、AI 连接测试不发送 tab 数据，以及本地数据清除。

可选 DeepSeek/OpenAI-compatible provider 检查：

```bash
node tools/deepseek_smoke_test.js
node tools/deepseek_smoke_test.js --classify-fixture
```

默认只读取 `.env.local` 并调用 `/models`，不发送 tabs。`--classify-fixture` 只发送合成测试 tabs，不读取真实浏览器数据。

生成图标和打包 beta zip：

```bash
node tools/generate_extension_assets.js
node tools/package_extension.js
```

输出：

```text
dist/tabmosaic-ai-extension-v0.1.0.zip
```

可选真实 Chrome runtime smoke test：

```bash
node tools/chrome_runtime_smoke_test.js
```

这个脚本会尝试用临时 profile 加载 unpacked extension；如果当前 Google Chrome 构建不允许 CLI 加载扩展，会输出 `SKIP`，仍需要手动在 `chrome://extensions` 使用 `Load unpacked` 验收。

当前本机官方 Google Chrome 会快速 `SKIP`。要跑自动 runtime QA，可安装 Chrome for Testing 或 Chromium 后设置：

```bash
CHROME_PATH="/path/to/chrome-or-chromium" node tools/chrome_runtime_smoke_test.js
```

手动 QA 可按 `05_PROJECT/06_QA_RUNBOOK.md` 执行。可先打印测试 tabs：

```bash
node tools/qa_seed_tabs.js
```

确认后再打开：

```bash
node tools/qa_seed_tabs.js --open
```

## 立即阅读建议

1. `AGENTS.md`
2. `00_START_HERE/01_READ_ME_FIRST.md`
3. `00_START_HERE/02_CONFIRMATION_PROTOCOL.md`
4. `01_PRODUCT/01_PRD.md`
5. `02_FEATURE_SPECS/01_ONE_CLICK_AUTOPILOT.md`
6. `02_FEATURE_SPECS/05_DASHBOARD.md`
7. `04_TECH/01_TECH_ARCHITECTURE.md`

## 重要提醒

这份文档已经把我们讨论过的方向写成较完整的产品框架。当前 P0 默认行为已基本确认；后续涉及定价、云端存储、账号系统、隐私边界变更、品牌域名最终购买等高影响事项，仍必须按 confirmation gate 停下来确认。
