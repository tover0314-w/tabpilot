# Document Index

## Root files

- `README.md`：harness 总览、文档地图和阅读建议。
- `AGENTS.md`：给 AI coding/product/design agents 的操作规范，包含确认门、文档更新规则和实现护栏。
- `agents.md`：lowercase compatibility pointer，指向 `AGENTS.md`。
- `CHANGELOG.md`：harness 版本变化记录。

## Implementation

- `extension/`：当前可加载的 Chrome Extension 开发切片，包含 MV3 manifest、background service worker 和 side panel。
- `extension/_locales/`：Chrome 原生英文/中文本地化资源。
- `extension/diagnostics.js`：本地 beta 诊断快照 sanitizer，不包含 URL/title/page text/API key。
- `extension/i18n.js`：extension page 静态和动态 UI 文案本地化 helper。
- `dist/`：本地生成的扩展 zip 包输出目录。
- `.github/workflows/ci.yml`：GitHub Actions CI，运行 extension smoke、打包和 zip env 排除检查。
- `.github/ISSUE_TEMPLATE/`：私测 bug report 和产品反馈 issue forms，要求提交前移除敏感浏览数据和 secrets。
- `tools/generate_extension_assets.js`：无依赖 PNG icon 生成脚本。
- `tools/package_extension.js`：本地扩展打包脚本，输出 beta zip。
- `tools/preflight.js`：统一本地预检入口，运行 secret scan、语法检查、smoke、打包和 zip env 检查。
- `tools/secret_scan.js`：扫描 git tracked files，防止 `.env` 或真实 API key 进入提交和 CI。
- `tools/issue_form_smoke_test.js`：检查私测 issue forms 的结构、隐私红线和 required safety acknowledgements。
- `tools/verify_release_package.js`：按 manifest 版本校验 release zip、checksum、package manifest 和包内安全内容。
- `tools/extension_smoke_test.js`：无依赖 Node smoke test，覆盖 manifest、localization、permission explanation、redacted diagnostics、Chat Refine、rules、dedupe safety、AI output validation 和 local data deletion。
- `tools/chrome_runtime_smoke_test.js`：可选 Chrome runtime smoke test，使用临时 profile 尝试加载 unpacked extension 并验证真实 native tab groups。
- `tools/deepseek_smoke_test.js`：读取 `.env.local` 的 DeepSeek/OpenAI-compatible provider smoke test，默认只检查 `/models`，可选合成 tabs 分类。
- `tools/qa_seed_tabs.js`：手动 QA seed tabs 脚本，默认打印 URLs，`--open` 才会打开 Chrome。

## 00_START_HERE

- `01_READ_ME_FIRST.md`：阅读顺序与核心共识。
- `02_CONFIRMATION_PROTOCOL.md`：确认机制。
- `03_DECISIONS_TO_CONFIRM.md`：需要用户拍板的决策。
- `04_GLOSSARY.md`：术语表。

## 01_PRODUCT

- `01_PRD.md`：完整 PRD。
- `02_PRODUCT_STRATEGY.md`：产品策略。
- `03_USER_PERSONAS.md`：用户画像。
- `04_AHA_MOMENT.md`：aha moment 设计。
- `05_COMPETITOR_REFERENCE_NOTES.md`：竞品与开源参考。

## 02_FEATURE_SPECS

- `01_ONE_CLICK_AUTOPILOT.md`：点击即整理。
- `02_AUTO_CLASSIFICATION.md`：自动分类。
- `03_DEDUPLICATION.md`：自动安全去重。
- `04_SIDEBAR_AGENT.md`：Sidebar Agent。
- `05_DASHBOARD.md`：Dashboard 看板。
- `06_TAB_CHAT.md`：和 tab/tabs/group 聊天。
- `07_PAGE_SUMMARY.md`：当前页面总结。
- `08_RULES_MEMORY.md`：规则和记忆。
- `09_WORKSPACES.md`：工作区。
- `10_PAYWALL_BILLING.md`：付费和 billing。
- `11_PRIVACY_CONTROLS.md`：隐私控制。

## 03_UX

- `01_INFORMATION_ARCHITECTURE.md`：信息架构。
- `02_USER_FLOWS.md`：用户流程。
- `03_WIREFRAMES_TEXT.md`：文字线框。
- `04_COPYWRITING.md`：文案库。
- `05_EMPTY_ERROR_STATES.md`：空状态和错误状态。
- `06_UI_DESIGN_SYSTEM.md`：Monochrome Forge UI 设计系统与组件规范。
- `UI_PROTOTYPES/`：可交互 HTML 原型，包括 browser、dashboard、sidebar states、tab states、onboarding、permissions 和 command palette。

## 04_TECH

- `01_TECH_ARCHITECTURE.md`：技术架构。
- `02_CHROME_EXTENSION_APIS.md`：Chrome APIs。
- `03_DATA_MODEL.md`：数据模型。
- `04_AI_PROMPTS_SCHEMAS.md`：AI prompts 和 schemas。
- `05_AI_PROVIDER_STRATEGY.md`：AI provider 策略。
- `06_STORAGE_SYNC.md`：存储和同步。
- `07_SECURITY_PRIVACY_IMPLEMENTATION.md`：安全与隐私实现。
- `08_ANALYTICS_EVENTS.md`：埋点。
- `09_TEST_PLAN.md`：测试计划。

## 05_PROJECT

- `01_ROADMAP.md`：路线图。
- `02_SPRINT_PLAN.md`：Sprint 计划。
- `03_BACKLOG.md`：Backlog。
- `04_RISKS.md`：风险。
- `05_LAUNCH_CHECKLIST.md`：发布清单。
- `06_QA_RUNBOOK.md`：P0 手动 QA 流程、预期结果和记录模板。
- `07_STORE_SUBMISSION_DRAFT.md`：Chrome Web Store single purpose、权限、隐私政策和上架文案草案，提交前必须确认。
- `08_QA_EVIDENCE.md`：私测 MVP 本地验证证据记录，不包含 secrets 或真实浏览器数据。
- `09_BETA_RELEASE_NOTES.md`：v0.1.0 私测发布说明、安装步骤、验证证据和已知限制。

## 06_REFERENCES

- `01_SOURCES.md`：官方参考。
- `02_ASSUMPTIONS.md`：假设。
- `03_RESEARCH_TODO.md`：后续调研。
- `ARCHIVES/`：原始交付压缩包归档。
