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

## 待后续调研

- Chrome built-in AI API 对 extensions 的最新可用性和设备限制。
- Chrome Web Store 对 AI extensions 的最新审核实践。
- 竞品定价和用户评价。
- 开源项目 stars 和维护情况。
