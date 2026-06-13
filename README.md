# TabMosaic AI

Open-source AI browser layer for Chrome.

TabMosaic AI turns messy browser work into native Chrome tab groups, then lets you continue from a lightweight sidebar agent. Bring your own model/API key, use DeepSeek or another OpenAI-compatible provider, or point it at a local model endpoint.

```text
Click the extension icon
Choose Smart Organize
Get real Chrome native tab groups
Continue with the sidebar agent
```

Current status:

- Full open-source direction is confirmed; license is still `CONFIRM`, so no `LICENSE` file is added yet.
- Controlled local/private beta is ready.
- Public Chrome Web Store launch is not ready yet.
- Default Smart Organize is metadata-first: title, hostname, path, tab state, and group state.
- Page text is read only after a user-triggered page or selected-tabs/group question.
- BYOK provider support is local-first and explicit-permission based.

Quick start for local testing:

```bash
node tools/preflight.js
node tools/package_extension.js
```

Then load the unpacked extension from:

```text
extension/
```

Start here:

- [Self-test guide](05_PROJECT/11_SELF_TEST_GUIDE.md)
- [Agent Search implementation plan](05_PROJECT/19_AGENT_SEARCH_WORK_AGENT_IMPLEMENTATION_PLAN.md)
- [BYOK provider setup](04_TECH/10_BYOK_PROVIDER_SETUP.md)
- [Privacy architecture explainer](04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md)
- [Brand/domain preliminary scan](01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md)
- [Contributing guide](CONTRIBUTING.md)

This repository also remains a product harness for agents and human collaborators.

版本日期：2026-06-08  
Harness version：v0.3  
产品形态：Chrome Extension + Sidebar Agent + Dashboard  
核心定位：**Open-source AI browser layer for Chrome, starting with smart native tab organization**

`AGENTS.md` 用于约束未来的 AI coding/product/design agents：先读 harness、尊重确认门、不要私自决定高影响事项、所有重要变更要落到对应 Markdown 文件。

当前工作产品名：**TabMosaic AI**。`TabPilot` 已发现同类 Chrome 扩展和 `tabpilot.ai` 冲突，不再作为主品牌候选。
2026-06-12 初扫又发现 Chrome Web Store 已有近似名称 `Tab Mosaic` 扩展，所以 `TabMosaic AI` 目前只应视为 working name；公开品牌、域名和商店 listing 名称需看 [brand/domain preliminary scan](01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md) 后再确认。

## 核心共识

1. **P0 的 aha moment 是点击插件图标打开极简动作菜单，选择 Smart Organize 后，当前浏览器所有普通窗口的顶部 tab bar 直接变整洁。**
2. 整理结果必须使用 **Chrome 原生 tab groups**，而不是只在 sidebar 里做一个假看板。
3. Sidebar 是结果解释、Undo、Review、聊天、当前页面总结和二次指令入口。
4. Dashboard 是付费核心：管理长期分组、workspace、规则、AI 记忆、摘要库、使用量和订阅。
5. 用户可以在 sidebar 或 dashboard 里和当前 tab、选中的 tabs、某个 group、当前窗口、当前浏览器所有普通窗口或历史 workspace 聊天。
6. 所有高风险操作必须可撤销；关闭 tabs 必须区分安全重复和低置信度重复。
7. 产品方向转为开源 + BYOK：用户可以自配模型/API key，把自己的 Chrome 变成可控的 AI browser layer。
8. 任何需要产品拍板的内容必须停下来确认，见 `00_START_HERE/02_CONFIRMATION_PROTOCOL.md` 和 `00_START_HERE/03_DECISIONS_TO_CONFIRM.md`。

## 当前已确认方向

- 首发目标用户：办公和知识工作者，独立开发者作为早期传播子人群。
- MVP 可见 UI 语言：English-only，避免中英混排。中文 `_locales/zh_CN` 资源暂时保留为后续多语言素材，但当前 Sidebar/Dashboard 默认强制加载英文文案。
- P0 整理范围：当前浏览器所有普通窗口，不默认处理 incognito。
- 点击插件后：打开极简 toolbar menu；首要动作是 Smart Organize，第二动作是 Vertical Tabs，另有 Current Page Chat / Dashboard。
- 全量开源方向：确认。开源用于信任、SEO、开发者传播和社区反馈；具体 license 待确认。
- AI Browser Layer 叙事：确认。TabMosaic 从 tab cleanup 切入，逐步变成 Chrome 上的 AI browser layer。
- BYOK 模型方向：确认。MVP 默认 DeepSeek，也支持用户填写 OpenAI-compatible Base URL、model 和 API key；非默认 provider host 会在保存/测试前请求对应 origin 权限，localhost endpoint 可用于本地模型。

## 文档地图

```text
AGENTS.md          Agent 操作规范：如何阅读 harness、何时停下来确认、如何更新文档
agents.md          lowercase compatibility pointer
CHANGELOG.md       版本变化记录
CONTRIBUTING.md    公开仓库贡献指南、隐私红线、PR 要求和本地检查命令
dist/              本地生成的扩展 zip 包
00_START_HERE/     阅读顺序、确认机制、术语表、未决决策
01_PRODUCT/        PRD、产品策略、用户画像、aha moment、竞品参考
01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md  品牌/域名初扫：Tab Mosaic 近似冲突、SEO 风险、域名/商标确认门
02_FEATURE_SPECS/  一键整理、分类、去重、sidebar、dashboard、tab chat、付费等功能规格
03_UX/             信息架构、用户流程、文字线框、文案、状态设计、UI 设计系统、HTML 原型
04_TECH/           Chrome 扩展架构、API、数据模型、AI prompt、BYOK provider 设置、存储、安全、测试
04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md  公开隐私架构说明：默认数据流、BYOK、页面读取、本地存储和诊断边界
05_PROJECT/        路线图、sprint、backlog、风险、发布清单
05_PROJECT/07_STORE_SUBMISSION_DRAFT.md  Chrome Web Store / 隐私政策草案，DO NOT SUBMIT YET
05_PROJECT/08_QA_EVIDENCE.md  私测 MVP 本地验证证据，不包含 secrets 或真实浏览器数据
05_PROJECT/09_BETA_RELEASE_NOTES.md  v0.1.0 私测发布说明和安装/验证路径
05_PROJECT/10_PRIVATE_BETA_HANDOFF.md  私测交接包：已就绪内容、验证证据、人工 QA 路径和确认门
05_PROJECT/11_SELF_TEST_GUIDE.md  小白自测指南：从一次性 QA profile 到真实 Chrome profile
05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md  真实 Chrome profile QA 结果记录模板，提交前必须脱敏
05_PROJECT/13_PRIVACY_POLICY_DRAFT.md  独立隐私政策草稿，DO NOT PUBLISH YET
05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md  Chrome Web Store 数据披露草稿，DO NOT SUBMIT YET
05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md  Landing page、demo、Product Hunt、HN、X 发布素材草稿，DO NOT PUBLISH YET
05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md  Public launch 前的 license、repo、store、QA、素材确认包
05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md  公开仓库前的文件、secret、artifact、archive 和 QA 记录清理清单
05_PROJECT/18_FEATURE_DISCUSSION_GUIDE.md  逐功能讨论指南：当前完成度、UI 截图入口、待讨论问题和剩余缺口
06_REFERENCES/     官方来源、假设、后续调研清单、原始交付归档
extension/         当前可加载的 Chrome Extension 开发切片
extension/provider_registry.js  BYOK provider preset / known host label 共享 registry
tools/             无依赖本地验证脚本，例如 extension smoke test
.github/ISSUE_TEMPLATE/  私测反馈 + public provider / grouping / UI issue forms，带隐私提交红线
```

Agentic 分类、Sidebar 上下文深度和 Agent tool registry 的下一步规格见：

```text
02_FEATURE_SPECS/12_AGENTIC_CLASSIFICATION_AND_CONTEXT_TOOLS.md
```

Browser Work Agent、Tavily-style search、Dashboard Workbench、任务/收藏和开源 skill 复用规格见：

```text
02_FEATURE_SPECS/13_BROWSER_WORK_AGENT_SEARCH_DASHBOARD_SKILLS.md
```

Monica 功能参考、AI Browser Layer 全量 feature list、开源/BYOK 与登录云套餐商业模式规格见：

```text
02_FEATURE_SPECS/14_MONICA_REFERENCE_AI_BROWSER_LAYER_COMMERCIAL_MODEL.md
```

导入的 AI Browser Layer PRD 评审稿见：

```text
01_PRODUCT/06_AI_BROWSER_LAYER_PRD_REVIEW.md
```

它用于讨论 New Tab Mission Control、Spaces、Skills、Safe Assistant Actions 等长期方向，不替代当前已确认的 P0 one-click native tab organization。

开源 + BYOK 增长策略见：

```text
01_PRODUCT/07_OPEN_SOURCE_BYOK_STRATEGY.md
```

它用于定义 public repo、用户自配模型、AI Browser Layer 叙事和 hosted service 商业化边界；license 仍需单独确认。

品牌/域名初扫见：

```text
01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md
```

它用于记录 `Tab Mosaic` Chrome Web Store 近似冲突、SEO 风险和 D-001-A 公开品牌/域名确认门。当前不要把 `TabMosaic AI` 当作已经可公开发布的最终品牌。

## 本地验证

当前不依赖 npm。可从仓库根目录运行：

```bash
node tools/preflight.js
```

它会运行 secret scan、JS 语法检查、extension smoke test、provider registry check、issue form smoke test、public repo audit、打包、zip env 排除检查和 beta readiness check。默认不调用 DeepSeek，不启动真实 Chrome runtime，不运行大标签 runtime 探针，也不生成 UI 截图。

```bash
node tools/beta_readiness_check.js
```

它会读取本地 QA evidence、private beta handoff、release notes、扩展包 checksum 和 package manifest，给出 controlled local/private beta 是否就绪、以及是否 not ready for public Chrome Web Store launch 的明确结论。这个检查不调用网络、不读取真实浏览器 profile、不读取 `.env.local`。

```bash
node tools/extension_smoke_test.js
```

它会检查 manifest 权限、English-only 默认可见 UI、极简玻璃拟态 side panel / Dashboard 守卫、Dashboard selected-tabs → Sidebar Agent 上下文入口、Dashboard selected-tabs 跨窗口选择提示、Dashboard 本地保存 workspace 快照的隐私边界、侧边栏快捷动作进入聊天、侧边栏临时消息流、侧边栏 direct commands（含本地保存 workspace）、本地能力说明回答、当前页 summary / page question 聊天消息渲染、DeepSeek Page Agent 当前页 visible-text payload 边界、multi-tab skipped reason breakdown、multi-tab zero-readable metadata fallback、selected-region 文本/结构/裁剪截图元信息边界、latest-run 只读问答、duplicate-review/closed-tab 本地回答、active/protected/read-later 本地回答、tab search/focus、权限解释、BYOK provider registry 与 Dashboard preset 一致性、脱敏本地错误日志、本地误关恢复安全审计计数、脱敏 beta 诊断快照和反馈模板、Chat action parser、用户规则优先级、重复项安全策略、180-tab synthetic local planning guard、AI 输出校验、AI 连接测试不发送 tab 数据，以及本地数据清除。

```bash
node tools/issue_form_smoke_test.js
```

它会检查 GitHub issue forms 的基础结构、隐私提交红线和 required safety acknowledgements，覆盖私测 bug/feedback，以及 public provider request、grouping quality、UI bug 表单，避免反馈入口要求或鼓励测试者提交敏感浏览数据。

```bash
node tools/provider_registry_check.js
```

它会检查 `extension/provider_registry.js` 里的 BYOK provider preset：默认 DeepSeek host 必须和 manifest required host permission 一致；远程 provider 必须 HTTPS；本地 HTTP 只能是 localhost；每个 preset 必须出现在 Dashboard 下拉和 BYOK guide 表格里；known host label 必须映射回已有 preset。

```bash
node tools/verify_release_package.js
```

它会按 `extension/manifest.json` 的当前版本检查生成的 zip、sha256、package manifest、必需文件，以及 `.env`、source maps、`node_modules`、macOS/git metadata 等禁止项，避免版本升级后本地/CI 还卡在旧包名。

提交前 secret scan：

```bash
node tools/secret_scan.js
```

它只扫描 git tracked files，用于防止 `.env.local` 或真实 `sk-...` key 被误提交。

公开仓库前审计：

```bash
node tools/public_repo_audit.js
```

它会检查 tracked + 未忽略的新增文件，拦截 `.env`、`dist/`、`artifacts/`、`output/`、私测 AI 配置、candidate secrets 和未确认 license 等风险，并输出 public repo 仍然阻塞的确认项。当前预期仍是 `READY_PUBLIC_REPO_PUSH=no`，直到 license、raw archive 公开处理、real-profile QA 和公开发布材料等事项确认。

可选 DeepSeek/OpenAI-compatible request-format provider 检查：

```bash
node tools/preflight.js --deepseek
node tools/preflight.js --deepseek-fixture
node tools/deepseek_smoke_test.js
node tools/deepseek_smoke_test.js --classify-fixture
node tools/deepseek_smoke_test.js --page-agent-fixture
node tools/deepseek_smoke_test.js --page-agent-10-turn-fixture
```

默认只读取 `.env.local` 并调用 DeepSeek `/models`，不发送 tabs。`--classify-fixture` 只发送合成测试 tabs；`--page-agent-fixture` 和 `--page-agent-10-turn-fixture` 只发送合成 current-page visible text，不读取真实浏览器数据。扩展内 Dashboard Settings 已支持 BYOK OpenAI-compatible Base URL / model / API key，并提供 DeepSeek、OpenAI、OpenRouter、Groq、Together AI、Mistral AI、xAI、Perplexity、Cerebras、Fireworks AI、DeepInfra、SiliconFlow、Kimi / Moonshot、MiniMax、DashScope / Qwen、LM Studio、Ollama preset；preset 只填字段，不保存或请求权限。选择 LM Studio / Ollama preset 时，Dashboard 会显示本地模型启动提示，但不会自动安装模型、调用 provider 或读取 tabs。DeepSeek 是默认 host，其他 HTTPS provider host 或 `http://localhost` 本地模型 endpoint 会在保存/测试前请求对应 origin 权限。本地 endpoint 如果不需要鉴权，可以不填 API key；远程 provider 仍需要 API key。AI connection test 优先查 provider model-list endpoint；如果 provider 不支持标准 model list，则只发送固定 synthetic chat ping，不发送真实 tab/page/user 内容。用户触发的 group/selected-tabs 页面问答可临时请求具体站点访问，回答后释放。

GitHub Actions 会在 push / PR 时自动运行 secret scan、语法检查、extension smoke test、provider registry check、issue form smoke test、public repo audit、打包、release package 校验、beta readiness check，并上传扩展 zip artifact。DeepSeek provider smoke 不在 CI 中运行，因为它需要本地 secret。

开源贡献先看：

```text
CONTRIBUTING.md
```

反馈可以走 GitHub issue forms：

```text
.github/ISSUE_TEMPLATE/beta_bug_report.yml
.github/ISSUE_TEMPLATE/beta_feedback.yml
.github/ISSUE_TEMPLATE/provider_request.yml
.github/ISSUE_TEMPLATE/grouping_quality.yml
.github/ISSUE_TEMPLATE/ui_bug.yml
```

这些表单都要求提交者不要提交 API key、full URL、tab title、page text、email、bearer token、私有截图或私有 rule pattern。Dashboard 复制出来的 diagnostics / feedback template 也必须先人工检查再提交。License 仍未确认，所以当前没有 `LICENSE` 文件。

生成图标和打包 beta zip：

```bash
node tools/generate_extension_assets.js
node tools/package_extension.js
```

输出：

```text
dist/tabmosaic-ai-extension-v0.1.0.zip
dist/tabmosaic-ai-extension-v0.1.0.sha256
dist/tabmosaic-ai-extension-v0.1.0.package.json
```

可选真实 Chrome runtime smoke test：

```bash
node tools/preflight.js --runtime
node tools/chrome_runtime_smoke_test.js
```

这个脚本会尝试用临时 profile 加载 unpacked extension，打开合成测试 tabs，并验证 organize、safe duplicate close、same-page duplicate review、Restore Closed、Chat action、侧边栏快捷动作进入聊天、侧边栏临时消息流、本地能力说明回答、未启用 DeepSeek 时的开放式对话兜底、本地下一步建议、当前页 summary / page question 聊天消息、Sidebar 本地问答、selected-tabs tool-card/follow-up 流、tab search/open 和 Dashboard apply/move/drag-drop/focus/undo/restore 能操作真实 Chrome native tab groups。它会优先使用 `CHROME_PATH`，其次自动探测 Playwright / Chrome for Testing / Chromium，最后才回退到系统 Google Chrome。

如果当前 Google Chrome 构建不允许 CLI 加载扩展，会输出 `SKIP`，仍需要手动在 `chrome://extensions` 使用 `Load unpacked` 验收。也可以手动指定 Chrome for Testing 或 Chromium：

```bash
CHROME_PATH="/path/to/chrome-or-chromium" node tools/chrome_runtime_smoke_test.js
```

可选真实 Sidebar Agent + DeepSeek flow：

```bash
node tools/write_private_beta_ai_config.js
node tools/preflight.js --agent-flow
node tools/chrome_runtime_smoke_test.js --agent-flow
```

`write_private_beta_ai_config.js` 会从 `.env.local` 生成本地忽略的 `extension/private-beta-ai-settings.json`，让你用真实 unpacked extension 测 DeepSeek 时不用再进 Settings 手填 key。`.env.local` 可以写 `DEEPSEEK_API_KEY=...`，也兼容只有一行 `sk-...` 的本地私测格式。这个文件不会打印 key、不会进 git、也不会进正式 zip。后面两个脚本会用临时 Chrome profile、synthetic tabs 和 `.env.local`/本地私测配置跑真实 sidebar composer 流程：用户输入开放式 tab 管理问题，DeepSeek metadata-only Agent 返回纯 assistant 消息卡片，不附加 tab 行或安全动作按钮；随后再让 DeepSeek 生成一个受本地校验的 `move_tabs` 草稿，点击 Apply 后验证真实 Chrome native tab group 更新且没有关闭 tab。它不会打印 API key，不读取真实 Chrome profile，不读取真实 tabs，不读取页面正文，不发送完整 URL，也不会让 AI 在用户 Apply 前自动执行浏览器动作。

可选真实 Chrome 大标签 synthetic runtime 探针：

```bash
node tools/preflight.js --large-runtime
node tools/chrome_runtime_smoke_test.js --large-tabs
```

它使用临时 Chrome profile 和 synthetic URLs 打开默认 96 个测试 tabs，验证真实 Chrome native tab groups 路径下的一键整理、重复项处理、review 队列和脱敏 run snapshot。它不读取真实 Chrome profile、真实 tabs 或 `.env.local`。这不替代真实用户 profile 的手动 QA。

可选 UI 截图预览：

```bash
node tools/capture_ui_screenshots.js
node tools/build_store_screenshots.js
node tools/preflight.js --screenshots
```

它使用 mock extension 数据渲染 sidebar 结果态、sidebar 当前页面问答态和 dashboard，并生成 1280x800 Chrome Web Store screenshot 草稿，不读取真实浏览器 tabs，不读取 `.env.local`。这个可选脚本需要本机可用的 Playwright；Codex bundled runtime 会被自动探测。输出在本地忽略目录：

```text
artifacts/ui-screenshots/
artifacts/store-screenshots/
output/
```

可选真实公开页面 Sidebar Page Agent 截图：

```bash
node tools/capture_real_page_chat_screenshot.js https://www.hao123.com/ --ai --question '这个页面有什么内容？' --question '这个页面里哪些部分适合快速办公使用？'
node tools/capture_real_page_chat_screenshot.js https://www.hao123.com/ --ai --region-only --region-question '这个选中的页面区块主要提供什么信息？'
```

这个脚本使用临时 Chrome profile 和临时 extension copy，不读取真实 Chrome profile。`--ai` 会从 `.env.local` 读取 DeepSeek/OpenAI-compatible 配置并写入临时 extension storage，不打印 API key。它会给临时 extension copy 添加目标公开 URL 的临时 host access，用真实 Sidebar composer 跑当前页面多轮对话或 selected page-region 对话，并把截图写到 ignored `artifacts/real-page-chat/`。不传 `--ai` 时，它会验证“未配置 AI provider”提示，不读取页面正文。

小白自测先看 `05_PROJECT/11_SELF_TEST_GUIDE.md`。完整手动 QA 可按 `05_PROJECT/06_QA_RUNBOOK.md` 执行。可先打印测试 tabs：

```bash
node tools/qa_seed_tabs.js
```

确认后再打开：

```bash
node tools/qa_seed_tabs.js --open
```

更安全的手动 QA 前置路径是打开一个一次性 QA profile：

```bash
node tools/open_manual_qa_profile.js --dry-run
node tools/open_manual_qa_profile.js --self-test
node tools/open_manual_qa_profile.js
```

它会加载 extension，打开本地 Manual QA Checklist、合成 QA tabs、sidepanel 和 dashboard 页面，只使用 `artifacts/manual-qa-profiles/` 下的一次性 Chrome profile，不读取你的真实 Chrome profile、真实 tabs 或 `.env.local`。Checklist 覆盖一键整理、Tab Agent UI、AI 状态、敏感页 summary 确认、Undo/Restore、Dashboard Smart Groups、Dashboard Duplicate Center、Dashboard tab focus/move/apply、安全错误态和隐私输出；勾选状态与本地 QA notes 只保存在这个一次性 profile 里，并可复制一份带 notes 的 Markdown QA 结果，也可以复制空白的真实 profile 脱敏 QA 模板。`--self-test` 会打开后自动关闭并清理。

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
