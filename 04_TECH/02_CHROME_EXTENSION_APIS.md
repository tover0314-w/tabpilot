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

- 监听 toolbar icon 点击。
- 触发一键整理。

重要：如果配置了 `default_popup`，点击 action 时不会触发 `action.onClicked`。因此 P0 不建议使用传统 popup 作为主入口。

## 5. scripting + activeTab

用途：

- 用户要求总结当前页面时，临时注入脚本提取正文。

策略：

- 默认不申请 `<all_urls>`。
- 使用 `activeTab` 让用户点击/触发后获取当前 tab 临时权限。
- 只读取 visible/readable content，不读取表单值、密码字段、storage。

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

用途：仅用于用户在 Dashboard 中开启 DeepSeek/OpenAI-compatible AI 分类后调用 DeepSeek API。

### 7.1 当前 UI 权限解释

CONFIRMED BY IMPLEMENTATION:

```text
Dashboard -> Settings -> Permissions & Data Use explains each current permission:
- tabs: tab metadata, all-normal-window organize, safe duplicate restore
- tabGroups: real Chrome native group creation/update
- sidePanel: sidebar control center after toolbar click
- storage: local settings, rules, Undo/Restore snapshots, optional local API key
- scripting + activeTab: user-triggered current-page visible text summary
- https://api.deepseek.com/*: optional DeepSeek classification with user-provided API key
```

The UI also states that TabMosaic does not request:

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
- `<all_urls>` 仅作为 P1/Pro multi-tab summary 的可选权限候选，进入前需要再次确认。
