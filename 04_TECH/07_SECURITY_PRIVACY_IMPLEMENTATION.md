# 安全与隐私实现

## 1. 最小权限

P0 默认权限：

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

不默认申请：

```text
<all_urls>
history
bookmarks
cookies
webRequest
browsingData
```

## 2. 页面正文读取

仅在用户明确触发时：

```text
Summarize current tab
Chat with current page
Summarize selected tabs / P1
```

实现：

- `activeTab` + `scripting.executeScript`。
- 只提取 visible/readable content。
- 排除 form/password/hidden fields。

## 3. AI 数据最小化

分类默认只发送：

```text
title
hostname
path
active/pinned/audible/discarded state
```

不发送：

```text
cookies
forms
passwords
full DOM
localStorage
sessionStorage
```

## 4. Sensitive Domain Handling

内置敏感匹配：

```text
bank
billing
stripe
aws
cloudflare
admin
medical
health
password
internal
localhost
```

行为：

- 不自动读取正文。
- 不自动关闭。
- summary 前二次确认。

## 5. Undo 安全

每次应用操作前保存 snapshot。

```text
tabsBefore
groupsBefore
closedTabs
actionsApplied
```

关闭 tabs 必须保存可恢复 URL/title/window/index/group。

## 6. Secret Handling

- 用户自配 API key 只存本地。
- 尽量使用 chrome.storage.local + 用户设备保护。
- Hosted AI key 只在后端。
- 不在日志中写入完整 URL 或 page text。

Dashboard `Clear Local Data` removes the local API key along with local rules, run state, Undo/Restore snapshots, chat draft, local error log, duplicate close safety audit, and privacy acceptance. It does not touch tabs, cookies, browser history, or any cloud account data.

## 7. Logging

默认 analytics 只记录聚合事件：

```text
organize_completed
num_tabs
num_groups
num_safe_duplicates_closed
undo_clicked
summary_requested
```

不记录：

```text
具体 URL
页面正文
用户 chat 原文 / 除非用户同意用于改进
```

## 8. Chrome Web Store 合规

需要：

- 隐私政策。
- UI 中明确数据用途。
- Chrome Web Store listing 中说明 single purpose。
- Limited Use disclosure。
- 权限最小化。
- 不出售数据，不做广告个性化。

### 8.1 当前实现

CONFIRMED BY IMPLEMENTATION:

Dashboard Settings includes `Permissions & Data Use`, which explains the current manifest permissions and DeepSeek host permission in user-facing English/Chinese copy. It also explicitly says the extension does not request all URLs, history, bookmarks, cookies, webRequest, browsingData, or incognito access.

Dashboard Settings also includes `Beta Diagnostics`, a user-triggered local clipboard copy of a redacted QA snapshot and beta feedback Markdown template. It is not analytics and does not upload data. The sanitizer excludes URLs, tab titles, hostnames, rule patterns, group names, page text, emails, bearer tokens, and API keys.

The local `currentRun` state used by the sidebar/dashboard strips restore URLs, URL hashes, raw/full URLs, and page text before storing UI state. It may keep tab title, hostname, and path because those are the documented P0 metadata used for local grouping review. Undo snapshots keep only tab IDs, window IDs, indices, and previous group IDs.

Restore Closed snapshots are the intentional local-only exception: they store the minimum restorable URL/title/window/index/group metadata needed to reopen safely closed duplicate tabs. They are never included in copied diagnostics or feedback templates, are cleared by `Restore Closed` / `Clear Local Data`, and have no upload path.

The extension keeps a small local-only redacted error log ring buffer for beta debugging. Error entries are stored in `chrome.storage.local`, capped, cleared by `Clear Local Data`, and included in copied diagnostics only after redaction. There is no remote log endpoint or automatic telemetry path.

The extension also keeps a local-only duplicate close safety audit for beta validation. It records only counts and whitelisted event types for safe duplicate close, manual review close, and Restore Closed outcomes. It is capped, cleared by `Clear Local Data`, included in copied diagnostics only after redaction, and has no remote endpoint or automatic telemetry path.

## 9. Security Tests

- 确认 password/form fields 不被抽取。
- 确认 active/pinned/audible 不被自动关闭。
- 确认 incognito 不被自动处理。
- 确认 currentRun、logs、诊断、反馈模板、AI payload 不含完整 URL/page text。
- 确认 Undo snapshot 只保存恢复分组所需的最小字段。
- 确认 API key 不出现在客户端日志。
- 确认 Clear Local Data 删除本地 API key 和 rules，但不关闭/移动 tabs。
- 确认 Dashboard 权限解释与 manifest 当前权限一致。
- 确认 Beta Diagnostics 不包含 URL、tab title、hostname、rule pattern、group name、page text、email、bearer token 或 API key。
- 确认 Beta Feedback Template 仅本地复制，不自动提交数据。
- 确认本地错误日志只保存脱敏摘要、可被 Clear Local Data 删除，且没有上传路径。
- 确认本地误关恢复安全审计只保存计数和白名单事件类型、可被 Clear Local Data 删除，且没有上传路径。
