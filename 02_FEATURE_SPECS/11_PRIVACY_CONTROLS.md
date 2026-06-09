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
| 3 | 多页面正文 | group/multi-tab summary | 明确确认 |
| 4 | 云端保存摘要/记忆 | dashboard、workspace memory | Pro + 明确开启 |

## 3. 默认原则

- 默认不读取页面正文。
- 默认不读取所有 tabs 正文。
- 默认不读取表单输入。
- 默认不读取密码字段。
- 默认不上传 cookie、localStorage、sessionStorage。
- 关闭 tabs 前保存 restore snapshot。
- 用户可以禁用 hosted AI，改用自配 DeepSeek API key 或 local。任意 OpenAI-compatible host 属于后续 P1/CONFIRM，因为需要新增 host permission。

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
[ ] 允许总结多个 tabs
[ ] 允许保存摘要到 dashboard
[ ] 对以下网站永不读取正文
[ ] 对以下网站永不自动关闭 tabs
```

### 5.1 当前设置实现

CONFIRMED BY IMPLEMENTATION:

```text
Dashboard Settings includes:
- Settings Snapshot
- DeepSeek AI settings using an OpenAI-compatible request format
- Permissions & Data Use
- Beta Diagnostics
- Clear AI Key
- Clear Local Data
```

`Permissions & Data Use` explains why existing Chrome permissions are needed and states that TabMosaic does not request all URLs, history, bookmarks, cookies, webRequest, browsingData, or incognito access.

`Beta Diagnostics` copies a redacted local QA snapshot to the clipboard. It includes version, locale, permission names, latest run counts, duplicate counts, rule count, AI enabled/provider/model, and privacy flags. It does not include URLs, tab titles, hostnames, rule patterns, group names, page text, API keys, or automatic upload.

The same Dashboard section can copy a beta feedback Markdown template. The template is local-only, user-triggered, and includes manual feedback prompts, 70/20/10/0 classification quality labeling, dangerous-close review, Undo/Restore review, rule-memory prompts, plus the redacted diagnostic snapshot. It does not submit data automatically.

Local error summaries are kept in a capped `chrome.storage.local` ring buffer and are included in copied diagnostics only after redaction. They must not include URLs, hostnames, emails, bearer tokens, API keys, tab titles, page text, rule patterns, or group names. This is not telemetry and has no upload path.

Duplicate close safety audit entries are kept locally as count-only events for beta validation. They may record whitelisted event types such as `auto_safe_close`, `manual_review_close`, and `restore_closed_tabs`, plus counts for requested, closed, restored, failed, and skipped tabs. They must not include URLs, hostnames, tab titles, page text, duplicate labels, rule patterns, group names, or API keys. This is not browsing analytics and has no upload path.

`Clear AI Key` removes only the locally saved AI API key, disables AI classification, and keeps local rules, recent organize results, Undo/Restore snapshots, privacy acceptance, chat drafts, diagnostics, and duplicate safety audit counts. It asks for browser confirmation and does not move or close tabs, call the AI provider, delete browser history, or delete cookies.

Current-tab summary reads visible page text only after the user clicks Summarize Current Tab. For sensitive contexts such as bank, billing, health, medical, password, admin, Stripe, AWS, Cloudflare, internal, or localhost pages, the sidebar asks for an extra confirmation before the background script executes content extraction. If the user cancels, no page body is read.

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
Dashboard -> Settings includes Clear Local Data.
The action asks for browser confirmation before deleting local data.
It clears:
- latest organize result
- Undo snapshot
- Restore Closed snapshot
- first-run privacy acceptance
- AI settings and local API key
- user rules
- chat refine draft
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

Given 用户进入 privacy settings
Then 用户可以查看权限解释、配置本地 API、单独清除本地 AI key、删除本地数据

Given 用户点击 Copy Diagnostic Snapshot
When 诊断快照被复制
Then 快照不包含 URL、tab title、hostname、rule pattern、group name、page text、email、bearer token 或 API key
And 快照只包含脱敏后的最近本地错误摘要
And 误关恢复安全审计只包含计数和白名单事件类型

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
Then 本地 rules、API key、Undo/Restore snapshot、最近整理结果、本地错误日志、本地误关恢复安全审计被删除
And 不关闭、不移动任何 tabs
```
