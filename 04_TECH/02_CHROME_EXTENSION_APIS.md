# Chrome Extension API 设计说明

## 1. tabs API

用途：

- 查询当前浏览器所有普通窗口 tabs。
- 获取 tab title/url/favIcon 等 metadata。
- 移动 tabs。
- 创建/恢复 tabs。
- 关闭重复 tabs。
- 与 content script 通信。

注意：读取 `url`、`pendingUrl`、`title`、`favIconUrl` 等敏感属性需要 `tabs` permission 或对应 host permissions。

## 2. tabGroups API

用途：

- 修改 tab group 标题、颜色、折叠状态。
- 移动 tab group。
- 查询 group。

注意：创建/取消分组和查询 group 内 tabs 需要配合 `chrome.tabs` API。

## 3. sidePanel API

用途：

- 承载 sidebar agent UI。
- 在点击 action icon 后打开 side panel。
- 作为 extension page 访问 Chrome APIs。

## 4. action API

用途：

- 点击 extension action icon 后直接打开 Sidebar Agent。
- background service worker 通过 `chrome.action.onClicked` 接收用户手势，并调用 `chrome.sidePanel.open`。
- Sidebar 内的 Smart Organize quick action 触发一键整理；Vertical Tabs / Current Page Chat / Dashboard 作为 Sidebar 入口出现。

CONFIRMED BY LATEST USER CORRECTION: P0 默认入口不允许 `default_popup`。Chrome 配置 `default_popup` 后不会触发 `action.onClicked`，会导致用户点击插件时看到 popup/窄条而不是 Sidebar，所以 manifest action 必须保持无 `default_popup`。

CONFIRMED BY IMPLEMENTATION:

```text
- manifest action has no `default_popup`.
- background.js listens to `chrome.action.onClicked`.
- action clicks call `openSidePanelForWindow(activeWindowId)` from the background service worker.
- action clicks set Sidebar mode to `agent` and bind the current tab metadata as `current_tab` context.
- `tools/extension_smoke_test.js` has a regression guard for this contract.
```

## 5. scripting + activeTab

用途：

- 用户要求总结当前页面时，临时注入脚本提取正文。
- 页面 quick rail 只作为 content script UI 入口渲染；它不读取正文，真正读取仍然走用户触发的 `scripting + activeTab` / optional site access flow。

策略：

- 默认不申请 `<all_urls>`。
- 使用 `activeTab` 让用户点击/触发后获取当前 tab 临时权限。
- current-group / selected-tabs 页面问答使用 optional `http://*/*` / `https://*/*`，只在用户主动询问后按具体站点临时请求，回答后释放。
- 只读取 visible/readable content，不读取表单值、密码字段、storage。

### 5.1 Page Quick Rail content script

CONFIRMED BY IMPLEMENTATION:

```text
- manifest content_scripts injects page_quick_rail.js only on http://*/* and https://*/*.
- The content script renders a small right-edge UI in a shadow root.
- It does not call executeScript, getSelection, innerText, captureVisibleTab, tabs, tabGroups, cookies, history, network APIs, or page storage APIs.
- It uses only extension-local `chrome.storage.local` for the user-hidden quick-rail preference.
- It sends only a user-clicked quick action id to the background: chat, read, region, or save.
- Background handles RUN_QUICK_RAIL_ACTION by opening Sidebar, setting current-tab metadata context, and pre-filling a pending prompt.
- Page text reading, region picking, todo creation, and AI provider calls still require the Sidebar flow after the user click.
```

## 6. storage API

用途：

- 保存用户规则。
- 保存设置。
- 保存 undo snapshot。
- 保存本地 workspace。
- 保存摘要缓存。

建议：

```text
chrome.storage.local：规则、设置、workspace metadata
chrome.storage.session：当前整理任务临时状态
IndexedDB：较大的摘要、chat history、workspace history
backend DB：Pro 云同步
```

## 7. 权限最小化

P0 建议权限：

```json
[
  "tabs",
  "tabGroups",
  "storage",
  "sidePanel",
  "scripting",
  "activeTab"
]
```

P0 host permissions：

```json
[
  "https://api.deepseek.com/*"
]
```

用途：DeepSeek 默认 provider。请求格式保持 OpenAI-compatible；开源/BYOK 方向确认支持用户自配模型/API key。其他 provider host 或 local model endpoint 不放进 required host permissions，而是在用户保存/测试配置时请求对应 origin。

Optional host permissions：

```json
[
  "http://*/*",
  "https://*/*"
]
```

用途：

```text
1. 用户主动发起 current-group / selected-tabs 页面内容问答或内容辅助重分组时，按具体站点临时请求页面读取权限。权限请求由 Sidebar 在 tool card 之后触发，读取完成后释放；拒绝授权时继续返回 metadata / skipped answer。
2. 用户在 Dashboard Settings 配置非默认 BYOK provider 时，请求该 provider 的具体 origin，例如 https://api.example.com/* 或 http://localhost/*。拒绝授权时不保存启用该 provider。
```

### 7.1 当前 UI 权限解释

CONFIRMED BY IMPLEMENTATION:

```text
Dashboard -> Settings -> Permissions & Data Use explains each current permission:
- tabs: tab metadata, all-normal-window organize, safe duplicate restore
- tabGroups: real Chrome native group creation/update
- sidePanel: sidebar control center after toolbar click
- storage: local settings, rules, Undo/Restore snapshots, optional local API key
- scripting + activeTab: user-triggered current-page visible text summary
- optional http/https site access: user-triggered group/selected-tabs visible text read, released after answer; custom BYOK provider origins requested explicitly before save/test
- https://api.deepseek.com/*: default DeepSeek provider host when the user enables a local API key
```

The UI also states that all-URL access is not granted by default, and that TabMosaic does not request:

```text
all URLs
history
bookmarks
cookies
webRequest
browsingData
incognito access
```

暂不默认申请：

```text
<all_urls>
history
bookmarks
cookies
webRequest
browsingData
```

## 8. 已确认 / 后续项

- P0 默认不申请 `<all_urls>`。
- P0 默认不处理 incognito。
- P0 默认整理当前浏览器所有普通窗口。
- `downloads` / `bookmarks` / `history` 权限不进入 P0。
- optional `http://*/*` / `https://*/*` 已确认用于用户触发的 group/selected-tabs 内容读取；默认不授予，按具体站点请求，回答后释放。
- Page Quick Rail content script renders on ordinary http/https pages as UI only. It is not a page-reading permission and does not replace the user-triggered scripting/permission flow.
