# Sources / 官方参考

本文件列出当前文档包引用或依赖的主要官方资料。进入开发前建议重新核实最新 Chrome API 和 Chrome Web Store 政策。

## Chrome product / native tab management

- Google Chrome official page: https://www.google.com/intl/en_sg/chrome/
  - 用于确认 Chrome 原生支持 group、label、color-code tabs。

## Chrome Extension APIs

- chrome.tabs API: https://developer.chrome.com/docs/extensions/reference/api/tabs
  - 用于查询、创建、修改、移动 tabs。
  - 文档说明 `tabs` permission 可访问 `url`、`pendingUrl`、`title`、`favIconUrl` 等敏感属性。

- chrome.tabGroups API: https://developer.chrome.com/docs/extensions/reference/api/tabGroups
  - 用于修改和移动 Chrome 原生 tab groups。
  - 文档说明 group/ungroup tabs 或查询 group 内 tabs 需要配合 `chrome.tabs` API。

- chrome.sidePanel API: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
  - 用于 extension side panel。
  - 文档说明 side panel 可作为 extension page 访问 Chrome APIs，并可在用户动作后打开。

- chrome.action API: https://developer.chrome.com/docs/extensions/reference/api/action
  - 用于 toolbar action。
  - 文档说明如果 action 指定 popup，则 `action.onClicked` 不会触发。

- activeTab permission: https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
  - 用于用户触发后临时访问当前 tab。

- chrome.scripting API: https://developer.chrome.com/docs/extensions/reference/api/scripting
  - 用于用户要求总结当前页面时注入脚本提取页面文本。

- chrome.storage API: https://developer.chrome.com/docs/extensions/reference/api/storage
  - 用于持久化扩展数据和状态。

## Chrome Web Store Policies

- Developer Program Policies: https://developer.chrome.com/docs/webstore/program-policies/policies
  - 隐私政策、Limited Use、权限最小化、数据处理等要求。

- Privacy Policies: https://developer.chrome.com/docs/webstore/program-policies/privacy
  - 用于确认处理用户数据时需要公开准确、最新的隐私政策，并在 Developer Dashboard 提供链接。

- Limited Use: https://developer.chrome.com/docs/webstore/program-policies/limited-use
  - 用于确认 web browsing activity 只能用于明确的用户可见功能，并需要 Limited Use 声明。

- Fill out the privacy fields: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
  - 用于准备 single purpose、权限 justification、remote code、data use 和 privacy policy URL 草案。

- Disclosure Requirements: https://developer.chrome.com/docs/webstore/program-policies/disclosure-requirements
  - 用于确认用户数据处理需要透明披露，若不贴近产品功能需要显著披露和明确同意。

- User Data FAQ: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
  - web browsing activity、Limited Use、用户数据处理说明。

## Competitor / Reference Products

- Monica homepage: https://monica.im/
  - 用于调研 Monica 作为 all-in-one AI assistant 的公开功能面：AI chat、summary、writing、translation、search、image/video、multi-platform apps 和 browser extension 入口。

- Monica Chrome Web Store listing: https://chromewebstore.google.com/detail/monica-all-in-one-ai-assi/ofpnmcalabcbjgholdjcjblkibolbppb
  - 用于调研 Monica 的 Chrome extension 市场定位、用户规模信号、all-in-one assistant feature framing、Monica Agent、Browser Operator、Deep Research、Slides、multi-model、media generation 等公开 listing 信息。

- Monica help center: https://monica.im/help/
  - 用于调研 Monica 的 browser-side help structure，包括 Chat、Read、Search、Write、Translate、Quick Action、Search Enhance、Video Summary、Agent、Memo、Smart Fill 等功能分类。

- Monica Read feature: https://monica.im/help/Features/Read
  - 用于调研网页、PDF、图片、截图、URL 等内容读取/总结/对话能力。

- Monica Write feature: https://monica.im/help/Features/Write
  - 用于调研写作、回复、改写、格式/语气/语言控制等能力。

- Monica Agent feature: https://monica.im/help/Features/AI-Agent/Monica_Agent
  - 用于调研 Monica Agent 的搜索、写作、自动任务拆解和工具步骤思路。

- Monica Memo feature: https://monica.im/help/Features/Memo
  - 用于调研保存网页、聊天、图片、PDF 等内容到个人知识库的参考模型。

- Monica Smart Fill feature: https://monica.im/help/Web_Tool/Smart_Fill
  - 用于调研表格/网页数据辅助处理能力，作为 TabMosaic 后续 structured extraction workflow 的参考。

- Monica Search feature: https://monica.im/help/Features/Search
  - 用于调研 AI search、query decomposition、result synthesis、related question prompts、search history 和 search-engine enhancement。

- Monica YouTube Summary feature: https://monica.im/help/Features/Summarize/Summarize-YouTube-Video
  - 用于调研视频摘要、timestamp summary 和 host-specific workflow 参考。

- Monica Bots introduction: https://monica.im/help/Features/Bots/Introduction
  - 用于调研 bot/skill/knowledge-base ecosystem 参考；TabMosaic MVP 不动态执行第三方 skills。

- Monica PowerUP introduction: https://monica.im/help/Features/PowerUP/Introduction
  - 用于调研网页内固定 AI tools、Mini Apps、工具收藏和推荐入口；TabMosaic 只借鉴极简 quick-entry / template discovery，不做大工具箱。

- Monica PowerUP customization: https://monica.im/help/Features/PowerUP/Customize_PowerUP
  - 用于调研 Standard Tool 的 prompt、网站范围、内容抽取模式、模型/skill 配置等；TabMosaic MVP 转化为 reviewed Prompt / Skill Templates，不开放动态第三方 skill 代码。

- Monica model response comparison: https://monica.im/help/Features/Chat/Model_response_comparison
  - 用于调研多模型交叉验证；TabMosaic 可作为 P2 / hosted Pro 或 BYOK advanced 方向。

- Monica calendar chat skill: https://monica.im/help/Features/Chat/Chatskill_bookcalendar
  - 用于调研 chat-to-calendar workflow；TabMosaic 需在账号、日历权限和隐私确认后才可考虑。

- Monica pricing page: https://monica.im/pricing
  - 用于调研 Monica 的付费分层参考。具体价格、额度和权益在制定 TabMosaic 公开定价前需要重新人工核实。

- Competitor pricing research: `06_REFERENCES/04_COMPETITOR_PRICING_RESEARCH.md`
  - 记录 2026-06-15 竞品定价和商业化包装调研结论。该调研只作为 market context，不确认 TabMosaic 的最终价格、额度、hosted AI、login、billing 或 cloud storage。

- Workona pricing: https://workona.com/pricing/
  - 用于调研 workspace/tab manager 的 free + upgraded plans、Pro/Team/Enterprise 包装、session backup、sync、templates、team/admin 等付费价值。

- Tavily pricing: https://www.tavily.com/pricing
  - 用于调研 Tavily-style Search Tool 的 free tier、pay-as-you-go、monthly project plan 和 enterprise 包装，说明 agent search 是 hosted 模式的可计量成本。

- Exa pricing: https://exa.ai/pricing
  - 用于调研 AI/web search API 的 pricing 页面和 free offer metadata，作为 hosted Search Tool provider/cost boundary 参考。

- Brave Search API: https://brave.com/search/api/
  - 用于调研 search API provider、large web index、flexible pricing 和 Agent Search Tool provider 备选。具体套餐价格上线前需要重新人工核实。

- Sider pricing: https://sider.ai/pricing
  - 用于调研 AI browser assistant extension 竞品定价。2026-06-15 自动读取被 Cloudflare 阻断，具体价格需要人工核实。

- Merlin pricing: https://www.getmerlin.in/pricing
  - 用于调研 AI browser assistant extension 竞品定价。2026-06-15 自动读取被 Cloudflare 阻断，具体价格需要人工核实。

- MaxAI pricing: https://www.maxai.me/pricing
  - 用于调研 AI browser assistant extension 竞品定价。2026-06-15 自动读取未拿到稳定价格文本，具体价格需要人工核实。

- Perplexity Pro: https://www.perplexity.ai/pro
  - 用于调研 AI search / research assistant 付费包装。2026-06-15 自动读取被 Cloudflare 阻断，具体价格需要人工核实。

- ChatGPT Atlas launch: https://openai.com/index/introducing-chatgpt-atlas/
  - 用于调研 agent mode、browsing context、research/analyze/automation、planning/booking 等 AI browser 方向。

- ChatGPT Atlas release notes: https://help.openai.com/en/articles/12591856-chatgpt-atlas-release-notes
  - 用于调研 auto organize、remove duplicates、merge all tabs、browser memories 和 prompt instructions 对 tab grouping 的影响。

- Dia homepage: https://www.diabrowser.com/
  - 用于调研 Reports、Live Work、Better Meetings、Profiles、Splits、Organized Tabs 等 work-browser 体验。

- Arc Max: https://arc.net/max
  - 用于调研 opt-in AI browser features 和 command-bar 入口。

- SigmaOS homepage: https://sigmaos.com/
  - 用于调研 workspaces、vertical tabs、tabs-as-tasks、Lazy Search、Simplify 等 browser-workflow 特性。

- Perplexity Comet: https://www.perplexity.ai/comet/
  - 用于调研 AI-native browser、assistant、research/search/task delegation 的公开定位。

- Microsoft Edge Copilot help: https://support.microsoft.com/en-us/microsoft-copilot/getting-started-with-copilot-in-microsoft-edge
  - 用于调研 sidebar Copilot、current webpage/open tabs/browser history/preferences context 和 page/video/PDF summary。

- Chrome AI innovations: https://www.google.com/chrome/ai-innovations/
  - 用于调研 Gemini in Chrome、open-tab help、AI Mode tabs/files/images context、auto browse 和 user control/privacy copy。

- Chrome AI Mode tabs/files help: https://support.google.com/chrome/answer/17025061
  - 用于调研 side-by-side AI Mode、add tabs/images/files/tools、temporary data storage and title/URL retention boundaries。

- Opera AI: https://www.opera.com/features/opera-ai
  - 用于调研 contextual AI over current tab / Tab Island、page summaries、multi-topic research and product comparison。

- Opera Tab Commands: https://investor.opera.com/news-releases/news-release-details/opera-introduces-new-way-manage-tabs-ai-tab-commands
  - 用于调研 prompt-driven tab close/group/pin/bookmark commands，以及 prompt-only server processing / local tab data privacy design。

- Brave Leo: https://brave.com/leo/
  - 用于调研 chat-with-any-tab、privacy/no-login framing、BYOM、本地/远程模型、temporary chats、PDF/Docs/Sheets analysis、organize tabs。

- Firefox AI-enhanced tab groups: https://support.mozilla.org/en-US/kb/how-use-ai-enhanced-tab-groups
  - 用于调研 local AI tab group suggestions、on-device operation、specific URLs not shared and review-required group suggestions。

- VertiTab Chrome Web Store listing: https://chromewebstore.google.com/detail/vertitab-%E2%80%93-vertical-tab-m/chejfhdknideagdnddjpgamkchefjhoi
  - 用于调研 vertical tabs、workspaces、sessions/snapshots、AI-powered grouping、auto-join groups、universal search、AI assistant、tab lock、suspend/automation and privacy disclosure。

## 待后续调研

- Chrome built-in AI API 对 extensions 的最新可用性和设备限制。
- Chrome Web Store 对 AI extensions 的最新审核实践。
- 竞品定价和用户评价。
- 开源项目 stars 和维护情况。
