# 功能规格：隐私控制

## 1. 目标

隐私不是合规附录，而是产品信任核心。TabMosaic AI 会处理用户的 tab title、URL、页面正文和浏览活动，因此必须默认最小化读取、明确披露、可控制、可撤销。

## 2. 隐私等级

| Level | 读取内容 | 用途 | 默认 |
|---|---|---|---|
| 0 | title + hostname | 基础分类 | 开启 |
| 1 | URL path | 精准分类、规则与去重 | 开启但披露 |
| 1b | full URL | 更精准规则或用户自定义需求 | 默认关闭，用户显式开启 |
| 2 | 当前页面正文 | 当前 tab 总结 | 用户触发 |
| 3 | 多页面正文 | group/multi-tab summary / content-assisted regrouping | 用户发起后默认允许；tool card 披露；最多 6 tabs；敏感页额外确认或跳过 |
| 4 | 云端保存摘要/记忆 | dashboard、workspace memory | Pro + 明确开启 |

## 3. 默认原则

- 默认不读取页面正文。
- 默认不后台读取所有 tabs 正文；只有用户发起 group/selected-tabs 问答或内容辅助重分组时，才读取最多 6 个 tabs 的可见文本。
- 默认不读取表单输入。
- 默认不读取密码字段。
- 默认不上传 cookie、localStorage、sessionStorage。
- 关闭 tabs 前保存 restore snapshot。
- 用户可以禁用 hosted AI，改用自配模型/API key。Private beta 默认 DeepSeek；自定义 OpenAI-compatible HTTPS provider host 和 `http://localhost` local model endpoint 已通过显式 origin 权限流启用。
- BYOK 不降低数据最小化标准：即使用用户自己的模型，默认仍不发送完整 URL、页面正文、cookies、表单值、隐藏 DOM 或浏览历史。

## 4. 首次使用文案

```text
TabMosaic 会读取标签页标题、网站域名和路径来自动整理分组与检测重复。
默认不会把完整 URL 发送给 AI。
只有当你要求总结页面时，才会读取当前页面正文。
你可以随时撤销自动整理。
```

## 5. 设置项

```text
[ ] 只使用本地规则，不调用 AI
[ ] 调用 AI 时只发送 title + hostname
[ ] 允许发送 URL path
[ ] 允许发送完整 URL
[ ] 允许总结当前页面
[x] 允许用户发起的多个 tabs 总结（最多 6 个，tool card 披露，不后台读取）
[ ] 允许保存摘要到 dashboard
[ ] 对以下网站永不读取正文
[ ] 对以下网站永不自动关闭 tabs
```

### 5.1 当前设置实现

CONFIRMED BY IMPLEMENTATION:

```text
Hidden private-beta Settings includes:
- Settings Snapshot
- DeepSeek AI settings using an OpenAI-compatible request format
- Permissions & Data Use
- Beta Diagnostics
- Clear AI Key
- Clear Local Data
```

`Permissions & Data Use` explains why existing Chrome permissions are needed. It states that all-URL access is not granted by default, optional site access is requested only for the specific sites in a user-triggered group/selected-tabs page question and released after the answer, and TabMosaic does not request history, bookmarks, cookies, webRequest, browsingData, or incognito access.

`Beta Diagnostics` copies a redacted local QA snapshot to the clipboard. It includes version, locale, permission names, latest run counts, duplicate counts, rule count, AI enabled/provider/model, and privacy flags. It does not include URLs, tab titles, hostnames, rule patterns, group names, page text, API keys, or automatic upload.

The same Dashboard section can copy a beta feedback Markdown template. The template is local-only, user-triggered, and includes manual feedback prompts, 70/20/10/0 classification quality labeling, dangerous-close review, Undo/Restore review, rule-memory prompts, plus the redacted diagnostic snapshot. It does not submit data automatically.

Local error summaries are kept in a capped `chrome.storage.local` ring buffer and are included in copied diagnostics only after redaction. They must not include URLs, hostnames, emails, bearer tokens, API keys, tab titles, page text, rule patterns, or group names. This is not telemetry and has no upload path.

Duplicate close safety audit entries are kept locally as count-only events for beta validation. They may record whitelisted event types such as `auto_safe_close`, `manual_review_close`, and `restore_closed_tabs`, plus counts for requested, closed, restored, failed, and skipped tabs. They must not include URLs, hostnames, tab titles, page text, duplicate labels, rule patterns, group names, or API keys. This is not browsing analytics and has no upload path.

Saved workspace snapshots are created only from hidden/private-beta workspace save paths. They are local-only, stored in `chrome.storage.local`, and keep minimized workspace metadata: group names/colors/counts, tab title/hostname/path/group mapping, and summary counts. They must not include full URLs, restore URLs, URL hashes, favicon URLs, page text, cloud data, summaries, or chat history. Copied diagnostics expose only the saved workspace count.

Work Queue tasks and saved Collections are local-only, stored in `chrome.storage.local`, and created only after user action from Dashboard selection, Sidebar todo commands, Search Tool source actions, pasted-link actions, or current-page checklist todo commands. Tab-linked items store tab title, hostname, path, tab IDs, and tab state only. Source-linked items store sanitized source title, hostname, path, optional snippet, and a local source URL with username/password/query/hash stripped. Current-page checklist todos may store generated checklist items locally after the user explicitly asks to read the current page; they must not persist raw page text, full URLs, browser history, cookies, form values, or cloud IDs.

An individual saved workspace snapshot can be deleted from the hidden/private-beta workspace path after browser confirmation. This deletes only the selected local snapshot and must not restore, close, move, or regroup tabs.

`Clear AI Key` removes only the locally saved AI API key, disables AI classification, and keeps local rules, recent organize results, Undo/Restore snapshots, privacy acceptance, chat drafts, diagnostics, and duplicate safety audit counts. It asks for browser confirmation and does not move or close tabs, call the AI provider, delete browser history, or delete cookies.

Current-tab summary and page Q&A read visible page text only after the user sends a current-page request from the sidebar composer. The composer context bar may show the current tab or selected group using metadata only. For sensitive contexts such as bank, billing, health, medical, password, admin, database, connection, Supabase, Stripe, AWS, Cloudflare, internal, or localhost pages, the sidebar asks for an extra confirmation before the background script executes content extraction. If the user cancels, no page body is read.

CONFIRMED BY DISCUSSION / IMPLEMENTATION: for current-tab page chat, the configured BYOK Page Agent may receive current-tab visible page text after the user explicitly asks from the Sidebar composer and completes any sensitive-page confirmation. The payload includes title, hostname, visible text, selected text, headings, description, cropped selected-region screenshot metadata when applicable, and up to 10 local page-chat Q/A turns only. It must not include screenshot image bytes/data URLs, full visible-tab screenshots, full URL, query/hash, cookies, form values, hidden DOM, browser history, workspace memory, multi-tab page bodies, or TabMosaic cloud storage. Obvious API-key-like strings and connection strings are redacted best-effort before upload. If the configured provider fails, the product falls back to local visible-text summary / matching.

CONFIRMED BY IMPLEMENTATION: selected page-region chat may transiently capture the current visible tab only after the user starts the selected-region flow and clicks a page region. The image is cropped in memory to the selected region, the full visible-tab capture is discarded, and only cropped screenshot metadata is kept for the text-only Page Agent. Screenshot image bytes are not uploaded, persisted, copied to diagnostics/feedback, saved to workspace memory, or included in chat history. Any future vision-model upload of cropped screenshot image bytes requires separate confirmation.

CONFIRMED BY USER: current-group and selected-tabs visible-text reading is enabled by default only after the user initiates that scoped question or content-assisted regrouping request. The Sidebar must show a compact tool card before extraction, such as `Tool: Read group pages`, with scope, tab count, data type, storage boundary, and skipped tabs. Private beta reads at most 6 tabs per batch. The Sidebar may request optional per-site access for the specific http/https origins in that batch. It checks already-granted origins first, requests only missing origins, and releases only origins newly granted for that temporary context-read session after the answer. Sensitive, internal, restricted, or unreadable pages are skipped or require extra confirmation. Extracted multi-tab context is session-only and must not be persisted or cloud-synced.

Sidebar metadata Agent answers use the configured BYOK provider only when a local key/config is available from extension storage or the ignored private-beta config file generated from `.env.local`. Private beta defaults to DeepSeek and also supports explicit-permission custom OpenAI-compatible hosts / localhost endpoints. This path sends minimized current run metadata: tab title, hostname, path, window id, active/pinned/audible/discarded state, current group state, duplicate-review counts, active Sidebar context, and up to 4 sanitized recent user/assistant chat turns for follow-up resolution. It must not send page body, page summaries, full URL, restore URL, favicon URL, cookies, form data, hidden DOM, browser history, saved workspace contents, or cloud memory. Recent chat turns are sent only per request and are not stored in cloud by TabMosaic. Open-ended answers render as plain chat messages without automatic action chips or tab rows. Explicit `move_tabs` drafts still require Apply and do not apply browser actions automatically.

## 6. Sensitive Sites

内置敏感域名提示：

```text
bank
finance
medical
health
password
admin
dashboard
database
connection
supabase
stripe
aws
cloudflare
internal
localhost
```

对于敏感页面，summary 前提示：

```text
这个页面可能包含敏感信息。请确认是否读取当前页面正文。
```

## 7. Incognito

P0 建议不支持 incognito 自动整理。若后续支持，必须单独说明并默认关闭。

## 8. 数据删除

Dashboard 设置必须提供：

- 删除所有本地规则。
- 删除所有摘要。
- 删除所有 workspace。
- 删除云端账号数据 / Pro。
- 导出数据。

### 8.1 当前实现

CONFIRMED BY IMPLEMENTATION:

```text
Hidden private-beta Settings includes Clear Local Data.
The action asks for browser confirmation before deleting local data.
It clears:
- latest organize result
- Undo snapshot
- Restore Closed snapshot
- first-run privacy acceptance
- AI settings and local API key
- user rules
- chat refine draft
- saved workspace snapshots
- local error log
- duplicate close safety audit counts
```

It does not:

```text
- close tabs
- move tabs
- delete cloud data
- delete browser history
- delete cookies
```

After clearing, the next organize shows the first-run privacy check again.

## 9. 验收标准

```gherkin
Given 用户首次使用
When 插件需要读取 URL/title
Then UI 明确说明用途

Given 用户要求总结当前页面
When 页面正文读取首次发生
Then 系统请求确认

Given 用户要求总结敏感页面
When 页面域名、路径或标题命中敏感上下文
Then 系统先提示二次确认
And 用户取消时不读取页面正文

Given 用户要求总结当前 group 或 selected tabs
When Agent 需要读取多个页面正文
Then Sidebar 先显示 tool card，说明工具、范围、最多 6 个 tabs、visible text 和 session-only
And 敏感/受限/不可读页面被跳过或额外确认
And 页面正文和摘要不被持久保存

Given 用户把当前页面生成 checklist todo
When Agent 读取当前页面 visible text
Then 复用 current-page sensitive confirmation 和 Page Agent payload boundary
And 只把生成后的 checklist 存在本地 Work Queue
And 不持久保存原始页面正文、完整 URL、query/hash 或云端记忆

Given 用户粘贴链接或保存搜索结果
When 用户点击 Save 或 Todo
Then 只保存本地 source metadata
And 不自动打开、抓取、总结或上传链接页面内容

Given 用户进入 privacy settings
Then 用户可以查看权限解释、配置本地 API、单独清除本地 AI key、删除本地数据

Given 用户点击 Copy Diagnostic Snapshot
When 诊断快照被复制
Then 快照不包含 URL、tab title、hostname、rule pattern、group name、page text、email、bearer token 或 API key
And 快照只包含脱敏后的最近本地错误摘要
And 误关恢复安全审计只包含计数和白名单事件类型
And saved workspace 只显示数量，不包含 workspace 名称或浏览元数据

Given 用户点击 Copy Feedback Template
When 反馈模板被复制
Then 模板只包含手动填写项和脱敏诊断快照
And 不自动上传任何数据

Given 用户点击 Clear AI Key
When 用户确认
Then 本地 AI key 被删除，AI 分类被停用
And 本地 rules、最近整理结果、Undo/Restore snapshot、对话草稿、诊断和安全审计仍保留
And 不关闭、不移动任何 tabs
And 不调用 AI provider

Given 用户点击 Clear Local Data
When 用户确认
Then 本地 rules、saved workspace snapshots、API key、Undo/Restore snapshot、最近整理结果、本地错误日志、本地误关恢复安全审计被删除
And 不关闭、不移动任何 tabs

Given 用户删除单个 saved workspace snapshot
When 用户确认删除
Then 只有该本地 snapshot 从 tabmosaic.savedWorkspaces 移除
And 不关闭、不移动、不恢复任何 tabs
```
