# Document Index

## Root files

- `README.md`：harness 总览、文档地图和阅读建议。
- `AGENTS.md`：给 AI coding/product/design agents 的操作规范，包含确认门、文档更新规则和实现护栏。
- `agents.md`：lowercase compatibility pointer，指向 `AGENTS.md`。
- `CHANGELOG.md`：harness 版本变化记录。
- `CONTRIBUTING.md`：公开仓库贡献指南，说明开源状态、隐私红线、PR 要求、issue 模板和本地检查命令。
- `SECURITY.md`：公开安全策略，说明浏览器数据、AI provider、权限和漏洞报告边界。
- `VISION.md`：公开项目愿景，说明 AI browser layer、隐私、开源和长期方向。
- `LICENSE`：Apache-2.0 开源许可证。
- `assets/screenshots/`：公开 README 产品截图，使用 mock/synthetic beta data，不包含真实浏览数据。

## Implementation

- `extension/`：当前可加载的 Chrome Extension 开发切片，包含 MV3 manifest、background service worker 和 side panel。
- `extension/_locales/`：Chrome 原生英文/中文本地化资源。
- `extension/diagnostics.js`：本地 beta 诊断快照 sanitizer，不包含 URL/title/page text/API key。
- `extension/i18n.js`：extension page 静态和动态 UI 文案本地化 helper。
- `extension/provider_registry.js`：BYOK provider preset、known host label、默认 DeepSeek host 和默认 AI settings 的共享 registry。
- `dist/`：本地生成的扩展 zip 包输出目录。
- `.github/workflows/ci.yml`：GitHub Actions CI，运行 extension smoke、打包、zip env 排除检查和 beta readiness check。
- `.github/ISSUE_TEMPLATE/`：私测 bug/feedback 以及 public provider request、grouping quality、UI bug issue forms，要求提交前移除敏感浏览数据和 secrets。
- `tools/generate_extension_assets.js`：无依赖 PNG icon 生成脚本。
- `tools/package_extension.js`：本地扩展打包脚本，输出 beta zip。
- `tools/preflight.js`：统一本地预检入口，运行 secret scan、语法检查、smoke、打包、zip env 检查和 beta readiness check。
- `tools/secret_scan.js`：扫描 git tracked files，防止 `.env` 或真实 API key 进入提交和 CI。
- `tools/public_repo_audit.js`：公开仓库前审计 tracked + 未忽略新增文件，拦截本地输出、私测配置、未确认 license 等风险，并输出 public repo blocker。
- `tools/provider_registry_check.js`：校验 BYOK provider registry、Dashboard 下拉、BYOK guide、manifest host permission 和 provider host label 是否一致。
- `tools/issue_form_smoke_test.js`：检查私测和 public issue forms 的结构、隐私红线和 required safety acknowledgements。
- `tools/verify_release_package.js`：按 manifest 版本校验 release zip、checksum、package manifest 和包内安全内容。
- `tools/beta_readiness_check.js`：检查 QA evidence、private beta handoff、release notes、package checksum 和 public-launch blocker 标注，输出 controlled beta / public launch readiness 结论。
- `tools/capture_ui_screenshots.js`：可选 UI 截图脚本，用 mock extension 数据生成 sidebar / dashboard 预览图。
- `tools/capture_real_page_chat_screenshot.js`：可选真实公开页面 Sidebar QA 截图脚本，使用临时 Chrome profile、临时 extension copy、显式 `--ai` DeepSeek 配置，验证 current-page 多轮对话和 selected page-region 对话。
- `tools/build_store_screenshots.js`：可选 Chrome Web Store screenshot 草稿生成脚本，用 mock UI 截图生成 5 张本地 1280x800 PNG，输出到 ignored artifacts，DO NOT SUBMIT YET。
- `tools/extension_smoke_test.js`：无依赖 Node smoke test，覆盖 manifest、localization、permission explanation、redacted diagnostics、Chat Refine、rules、dedupe safety、sensitive summary confirmation、AI output validation、AI status visibility 和 local data deletion。
- `tools/chrome_runtime_smoke_test.js`：可选 Chrome runtime smoke test，使用临时 profile 尝试加载 unpacked extension 并验证真实 native tab groups；`--real-ai-content-regroup-screenshot` 会用临时 fixture pages + DeepSeek 生成内容重分组 Sidebar 截图。
- `tools/open_manual_qa_profile.js`：打开一次性手动 QA Chrome profile，加载 extension、本地 checklist、合成 QA tabs、sidepanel 和 dashboard，不触碰真实 Chrome profile；checklist 覆盖 AI 状态、敏感页 summary 确认、Undo/Restore、Dashboard apply 和隐私输出。
- `tools/deepseek_smoke_test.js`：读取 `.env.local` 的 DeepSeek/OpenAI-compatible request-format smoke test，默认只检查 `/models`，可选合成 tabs 分类。
- `tools/qa_seed_tabs.js`：手动 QA seed tabs 脚本，默认打印 URLs，`--open` 才会打开 Chrome；包含合成 billing 页面用于敏感 summary 确认。

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
- `06_AI_BROWSER_LAYER_PRD_REVIEW.md`：对导入的 AI Browser Layer PRD 的评审、可吸收内容、冲突点和确认门。
- `07_OPEN_SOURCE_BYOK_STRATEGY.md`：开源增长、BYOK 模型配置、AI Browser Layer 叙事和 hosted service 商业化边界。
- `08_BRAND_DOMAIN_PRELIMINARY_SCAN.md`：品牌/域名初扫，记录 `Tab Mosaic` Chrome Web Store 近似冲突、SEO 风险和 D-001-A 公开品牌/域名确认门。
- `09_REPO_GROWTH_AND_SEO_NAMING_NOTES.md`：OpenClaw-style repo 运营学习、GitHub 门面优化、SEO 关键词和公开命名候选。

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
- `12_AGENTIC_CLASSIFICATION_AND_CONTEXT_TOOLS.md`：Agentic 分类、上下文深度和工具列表规格。
- `13_BROWSER_WORK_AGENT_SEARCH_DASHBOARD_SKILLS.md`：Browser Work Agent、Tavily-style search、Dashboard Workbench、任务/收藏和开源 skill 复用规格。
- `14_MONICA_REFERENCE_AI_BROWSER_LAYER_COMMERCIAL_MODEL.md`：Monica 功能参考、AI Browser Layer 全量 feature list、开源/BYOK 与登录云套餐商业模式规格。

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
- `10_BYOK_PROVIDER_SETUP.md`：BYOK provider preset、OpenAI-compatible endpoint、本地模型和权限边界设置指南。
- `11_PRIVACY_ARCHITECTURE_EXPLAINER.md`：公开隐私架构说明，解释默认数据流、BYOK provider、页面读取、本地存储、诊断和 Apply-gated actions。

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
- `10_PRIVATE_BETA_HANDOFF.md`：私测交接包，汇总已就绪内容、验证证据、人工 QA 路径、剩余缺口和确认门。
- `11_SELF_TEST_GUIDE.md`：小白自测指南，覆盖一次性 QA profile、可选 AI 测试、真实 Chrome profile 测试和剩余上线阻塞项。
- `12_REAL_PROFILE_QA_RESULT_TEMPLATE.md`：真实 Chrome profile QA 结果记录模板，要求先脱敏，避免把真实浏览数据写进 git。
- `13_PRIVACY_POLICY_DRAFT.md`：独立隐私政策草稿，带发布前确认门和占位符，DO NOT PUBLISH YET。
- `14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md`：Chrome Web Store 数据披露草稿，映射数据类别、Limited Use、DeepSeek 共享和确认门，DO NOT SUBMIT YET。
- `15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md`：公开发布素材草稿，包含 landing page、demo video、Product Hunt、Hacker News、X/Twitter 和 SEO 文案，DO NOT PUBLISH YET。
- `16_PUBLIC_LAUNCH_DECISION_PACKET.md`：public launch 决策包，汇总 license、public repo 范围、品牌/域名、隐私 URL、Chrome Store、BYOK、Free/Pro、analytics、QA 和素材确认项。
- `17_PUBLIC_REPO_CLEANUP_CHECKLIST.md`：公开仓库清理清单，覆盖 keep/exclude 文件、secret scan、generated artifacts、raw archive 私有备份状态、real-profile QA 记录和 public push 前检查。
- `18_FEATURE_DISCUSSION_GUIDE.md`：逐功能讨论指南，汇总当前完成度、UI 截图入口、待讨论问题、剩余缺口和确认门。
- `19_AGENT_SEARCH_WORK_AGENT_IMPLEMENTATION_PLAN.md`：Agent Search 和 Browser Work Agent 下一阶段实施计划，拆解 provider 配置、search results、todo agent、link/screenshot/attachment 输入和 QA。

## 06_REFERENCES

- `01_SOURCES.md`：官方参考。
- `02_ASSUMPTIONS.md`：假设。
- `03_RESEARCH_TODO.md`：后续调研。
