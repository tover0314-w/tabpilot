# Decisions To Confirm

这个文件是所有需要你拍板的内容清单。进入设计/开发前，请逐条确认。

## P0 强制确认项

| ID | 决策 | 当前建议 | 状态 |
|---|---|---|---|
| D-001 | 产品名 | TabMosaic AI（TabPilot 已有同类 Chrome 扩展和 tabpilot.ai 冲突） | CONFIRMED BY USER DELEGATION |
| D-001-A | Public brand/domain finalization | 2026-06-12 初扫发现 Chrome Web Store 已有 `Tab Mosaic` 近似扩展；TabMosaic AI 可继续作为 working name，但公开品牌、域名购买和商店 listing 名称需重新确认 | CONFIRM |
| D-002 | P0 主入口 | 点击插件 icon 即自动整理 | CONFIRMED BY DISCUSSION |
| D-003 | 顶部结果展示 | 使用 Chrome 原生 tab groups | CONFIRMED BY DISCUSSION |
| D-004 | Sidebar 角色 | 展示结果、引导对话、Undo、总结 | CONFIRMED BY DISCUSSION |
| D-005 | Dashboard 角色 | 付费核心工作台 | CONFIRMED BY DISCUSSION |
| D-006 | 默认整理范围 | 当前浏览器所有普通窗口，不处理 incognito | CONFIRMED |
| D-007 | 是否自动打开 sidebar | 是，点击后立即打开 active window 的 sidebar 并显示进度 | CONFIRMED |
| D-008 | 是否自动关闭 exact duplicate | 是，保留 active/pinned/audible/recent/protected tabs，并提供 Restore | DECIDED |
| D-009 | 是否自动关闭 tracking-param duplicate | 是，仅 canonical URL 高置信一致时自动关闭，否则进入 Review | DECIDED |
| D-010 | 是否自动关闭 hash duplicate | 否，进入 Review | DECIDED |
| D-011 | 是否默认读取页面正文 | 否，仅用户触发当前页总结/聊天时读取 | DECIDED |
| D-012 | 是否默认上传完整 URL 到云端 AI | 否，默认 title + hostname + path；full URL 需用户显式开启 | DECIDED |
| D-013 | MVP AI 模式 | DeepSeek API 简单测试，使用 OpenAI-compatible provider abstraction | CONFIRMED |
| D-014 | P0 dashboard 范围 | 当前所有窗口 workspace + smart groups board + duplicate center + basic settings | DECIDED |
| D-015 | Multi-tab chat | P1 / Pro | DECIDED |
| D-016 | Current tab chat | P0 | DECIDED |
| D-017 | Pro 付费点 | Dashboard Pro、workspace history、multi-tab chat、AI memory、hosted AI credits | DECIDED |
| D-018 | 免费版限制 | 基础一键整理免费；用户自配模型/API key 不限；hosted AI 有免费额度；OpenAI-compatible host 和 localhost model endpoint 通过显式 origin 权限流启用 | DECIDED |
| D-019 | 是否做账号系统 | P0 不做账号；Pro/hosted/cloud sync 阶段再做 | DECIDED |
| D-020 | 是否支持所有窗口整理 | P0 默认支持当前浏览器所有普通窗口 | CONFIRMED |
| D-021 | Dashboard Latest Result 信息层级 | 主卡片改为整理结果 + 优化收益 + 下一步动作；AI/windows/technical metrics 收进 Details；内存先用 Memory relief，不写精确 MB | CONFIRMED BY USER |
| D-022 | 是否允许 current-group / selected-tabs visible text 读取 | 允许。用户发起 group/selected-tabs 问答或深度整理时默认可用，用 tool 卡片披露读取范围；敏感/受限页跳过或额外确认；不做后台读取 | CONFIRMED BY USER |
| D-023 | group/selected-tabs 内容读取批量上限 | private beta 先限制 6 个 tabs，后续按成本和质量再评估是否提高到 10 | CONFIRMED BY USER |
| D-024 | content-assisted regrouping 是否进入当前 beta | 允许进入当前 beta。仅用户主动要求时读取页面内容，先给分组 preview，必须 Apply / Cancel 后才改浏览器原生分组 | CONFIRMED BY USER |
| D-025 | 多页面摘要是否可本地缓存 | 暂不持久保存；只允许本次会话内临时上下文。持久本地缓存后续单独确认 | DECIDED BY USER |
| D-026 | 是否默认用页面正文参与一键分类 | 否。one-click organize 保持 metadata-only；页面正文只用于用户主动发起的深度问答或内容辅助重分组 | DECIDED |
| D-027 | 是否将产品主叙事扩展为 AI Browser Layer for Chrome | 是。TabMosaic starts as tab cleanup, grows into an open-source AI Browser Layer for Chrome | CONFIRMED BY USER |
| D-028 | New Tab Mission Control 是否进入主入口 / MVP | 用户倾向不要。建议不进入 P0；作为 P1/P2 可选模式观察 | CONFIRM |
| D-028-A | Toolbar 点击后是否打开下拉动作菜单 | 点击插件 icon 打开极简 dropdown，首要动作是 Smart Organize，第二动作是 Vertical Tabs，另有 Current Page Chat / Dashboard | CONFIRMED BY USER |
| D-029 | 是否把 P0 整理改为 preview-before-apply | 用户倾向不要。建议不改；Smart Organize 自动应用原生分组并保留 Undo，chat/content-assisted regrouping 才 Apply / Cancel | CONFIRM IF CHANGING |
| D-030 | Workspace 是否改名为 Space | 建议继续使用 Workspace；Space 概念可作为 imported PRD 参考 | CONFIRM IF CHANGING |
| D-031 | 是否持久保存页面 snapshots / summaries / source maps | 建议暂不进入当前 MVP；任何持久保存都需要单独隐私确认 | CONFIRM |
| D-032 | Ollama/local model 是否进入 MVP | 以 OpenAI-compatible `http://localhost` endpoint 形式进入 BYOK settings；不做复杂本地模型向导或模型市场 | CONFIRMED BY USER |
| D-033 | Command Palette / Context Menu 是否进入 MVP | 建议不进入 MVP；作为 P1/P2 power-user 入口 | CONFIRM |
| D-034 | 项目是否开源 | 是，全量开源。开源用于信任、SEO、开发者传播、社区反馈和 BYOK 模型配置 | CONFIRMED BY USER |
| D-034-A | 开源 license | Apache-2.0；用于全量开源、BYOK 传播、开发者采用和社区贡献 | CONFIRMED BY USER |
| D-035 | 是否支持网页区域 / HTML element 选择作为 AI 上下文 | P1 buildable：用户主动点选页面区域后读取该区域 visible text / semantic structure，session-only，不后台读取整页，不保存 raw HTML | CONFIRMED BY USER |
| D-036 | 是否学习 Tabbit 的 `@` context picker | 建议 P1：Sidebar composer 输入 `@` 后可选择 Current tab / Current group / Selected tabs / Page region / Workspace 等上下文 | CONFIRM |
| D-037 | 是否先做内置 workflows 而不是 Skills marketplace | 建议 P2：Compare Tabs、Research Brief、GitHub PR Explain、Extract Table From Region 等内置工作流；不做 marketplace / scripts | CONFIRM |
| D-038 | 是否支持 screenshot/cropped visual context | 允许进入 Page Region Context：用户主动选择页面区域后，可截取该区域截图作为本轮上下文；session-only，不截全屏，不默认保存，不后台截图 | CONFIRMED BY USER |
| D-039 | Agent search provider | 用户明确 search tool 应是 Tavily-style agent search，不是 Chrome 默认搜索入口。已接入第一版 Tavily-style executor；正式 provider/key 配置 UX 和权限文案仍需确认 | CONFIRM PROVIDER + API KEY UX |
| D-040 | Dashboard 是否升级为 Browser Workbench | 建议在 Smart Groups 上方增加极简 Tasks、Collections 和 Agent 产物管理；Search 是 Agent 内部 tool，不作为 Dashboard 顶部 UI | RECOMMENDED |
| D-041 | 是否允许动态安装第三方 skills | 建议 MVP 不允许。学习高 star 开源 agent/skill 项目，但只接受经过 review 的内置 skill/adapters | RECOMMENDED |
| D-042 | MCP / Pi-like local companion | 建议只做 schema-compatible 设计；不进入 MVP runtime | RECOMMENDED |
| D-043 | 附件上传首批类型 | 建议 P1 先支持 txt / markdown / image，PDF/doc/csv 后续 | CONFIRM |
| D-044 | Monica-inspired feature boundary | 借鉴 Monica 的网页上下文、搜索、阅读、写作、Memo/知识库和多模型经验；不照搬泛 AI 媒体生成、Bot 平台和复杂工具箱 | CONFIRM |
| D-045 | Optional login / hosted cloud plan | P0 local no-login 保持；P1 可做可选登录，让非技术用户使用 hosted AI、search、sync、memory 和 billing | CONFIRM |
| D-046 | Hosted AI gateway scope | 只在云端数据边界、定价、quota 和隐私文案确认后实施；本地 BYOK 仍可独立使用 | CONFIRM |
| D-047 | Free / Plus / Pro pricing and credits | Free/BYOK 提供可用开源核心；Plus/Pro 售卖免配置 hosted AI、搜索、更多多 tab 研究、memory/sync 和更高额度 | CONFIRM |
| D-048 | Cloud memory / sync defaults | 默认 local-first；cloud memory、workspace sync、embedding/search index 都需要用户显式开启 | CONFIRM |
| D-049 | Account provider and payment stack | 登录、订阅、支付、用量账本的具体技术栈待架构评审后确认 | CONFIRM |
| D-050 | Command palette / selected-text toolbar scope | P1 做轻量上下文入口；不要做页面上到处漂浮的复杂按钮 | CONFIRM |
| D-051 | Host-specific integrations | PDF/YouTube 可优先评估；Gmail/social posting/form automation 暂不进入 MVP | CONFIRM |
| D-052 | Skill/workflow ecosystem policy | MVP 先做经过 review 的内置 workflows；不动态执行第三方 skill 代码 | CONFIRM |
| D-053 | Hosted cloud source boundary | 本地 extension 全量开源已确认；云端 hosted backend 是否开源、分仓或闭源托管需确认 | CONFIRM |
| D-054 | Usage analytics for billing | 为计费/额度只记录 action/credit 级别用量，不记录 raw tab title、full URL、page text 或截图内容 | CONFIRM |

## 用户体验确认项

1. 首次点击是否显示隐私说明后再整理？
   - 决定：首次必须轻量说明，用户点 Start；之后点击即整理。
2. 自动整理是否需要进度态？
   - 决定：sidebar 打开并显示 Scanning / Grouping / Cleaning duplicates。
3. 自动分组错误时用户如何纠错？
   - 决定：sidebar chat + dashboard drag/drop，两者都可沉淀规则。
4. 分组命名和可见 UI 是否用英文？
   - 决定：MVP 默认可见 UI 使用 English-only，避免中英混排；中文资源暂保留为后续多语言素材。
5. 分类颜色是否 AI 决定？
   - 决定：AI/规则建议，用户可在 dashboard 修改，规则记忆。
6. Dashboard Latest Result 是否从指标墙改成用户收益摘要？
   - 决定：改成简洁收益版，主打整理结果、重复项处理、内存压力降低和下一步动作；技术指标收进 Details。

## 商业化确认项

1. 是否首发付费墙？
   - 决定：不要。先让用户体验首次 one-click aha。
2. Free 是否限制一键整理次数？
   - 决定：基础一键整理免费；hosted AI 分类和多 tab summary 限制。
3. 用户自配 API key 是否免费？
   - 决定：免费支持用户自配模型/API key，使用 OpenAI-compatible request format。当前 private beta 默认 DeepSeek；自定义 HTTPS provider host 和 `http://localhost` 本地模型 endpoint 通过显式 origin 权限流启用，Pro 提供 hosted AI、sync 和 dashboard memory。
4. 是否做 lifetime deal？
   - 决定：不放入 P0；可作为早期增长实验。

## 技术确认项

1. Dashboard 是 extension page 还是 web app？
   - 决定：P0 extension page，P1 web app + cloud sync。
2. AI gateway 是否从 MVP 就做？
   - 决定：MVP 先做 OpenAI-compatible provider abstraction，DeepSeek API 起步；需要 hosted AI 时再上 gateway。
3. 是否使用 TypeScript + React + Tailwind？
   - 决定：使用 TypeScript + React + Tailwind。
4. 是否使用 IndexedDB 保存摘要？
   - 决定：P0 本地 IndexedDB 保存可恢复状态和用户主动生成的摘要。
5. 是否支持 Chrome built-in AI？
   - 决定：后续可用时优先支持，不作为 MVP 依赖。
