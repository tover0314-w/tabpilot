# AI Provider 策略

## 1. 目标

支持不同隐私和成本偏好的用户：

- 不调用 AI：本地规则。
- DeepSeek API：MVP 简单测试和默认开发 provider。
- User-provided OpenAI-compatible API：用户自己的 API key 和 base URL。Private beta 暂不支持任意 host。
- Hosted AI：Pro 用户最顺滑体验。
- Local LLM：高级用户隐私优先。
- Chrome built-in AI：后续可用时优先本地。

## 2. Provider 类型

| Provider | P0/P1 | 优点 | 缺点 |
|---|---|---|---|
| Rules only | P0 | 免费、快、隐私好 | 智能有限 |
| DeepSeek API via OpenAI-compatible client | P0 | 成本低、实现快、适合 MVP 验证 | 仍需外部 API 和网络 |
| User-provided OpenAI-compatible API beyond DeepSeek | P1/CONFIRM | 成本由用户承担，可兼容 OpenAI/其他兼容服务 | 配置门槛高，且需要新增 host permission |
| Hosted AI | P1/Pro | 体验最好 | 你承担成本和合规 |
| Local LLM endpoint | P1 | 隐私好 | 用户门槛高 |
| Chrome built-in AI | P1/P2 | 本地、低成本 | 设备/版本限制 |

## 3. Provider Interface

```ts
export interface AIProvider {
  id: string;
  name: string;
  classifyTabs(input: ClassificationInput): Promise<ClassificationOutput>;
  summarizeTab(input: SummaryInput): Promise<TabSummary>;
  chat(input: ChatInput): Promise<ChatOutput>;
}
```

P0 Provider 默认参数：

```text
defaultProvider: deepseek
protocol: OpenAI-compatible chat/completions
configurable: apiKey, model
privateBetaBaseUrl: https://api.deepseek.com
defaultBaseUrl: https://api.deepseek.com
defaultModel: deepseek-v4-flash
```

实现状态：

- `extension/` 已接入可选 DeepSeek 分类，request format 保持 OpenAI-compatible。
- Private beta 保留 OpenAI-compatible 协议抽象，但网络 host 限制在 `https://api.deepseek.com/*`，避免为了任意 provider 申请更宽 host permissions。
- API key 仅保存到 `chrome.storage.local`。
- 分类输入只包含 title、hostname、path、window id 和 tab state，不发送页面正文或完整 URL。
- API 不可用时自动 fallback 到 built-in rules。
- Dashboard 已接入 user-triggered `Test AI Connection`，只调用 DeepSeek host 的 `/models` endpoint 检查 API key 和 model 是否可用，不发送 tab data、page text、full URL 或 request body。
- `/models` connection test has an 8s timeout.
- `chat/completions` classification has a 12s timeout.
- Sidebar metadata Agent answers use the same DeepSeek/OpenAI-compatible chat endpoint with a 12s timeout.
- Metadata Agent input is limited to minimized current run metadata: title, hostname, path, window id, tab state, group state, and duplicate-review counts.
- Metadata Agent input does not include page body, full URL, restore URL, favicon URL, cookies, form data, hidden DOM, browser history, chat history, summaries, or cloud memory.
- Metadata Agent output is validated before rendering: invented tab IDs are ignored, safe action chips are restricted to an allowlist, and no browser action is applied automatically.
- Classification timeout or provider failure returns `fallback:*` status and one-click organize continues with local rules.
- Timeout handling does not change host permission, request payload, full URL policy, page text policy, or cloud storage defaults.
- Sidebar 和 Dashboard 已显示 latest run 的 AI 状态（DeepSeek applied / fallback / local rules）和 AI suggested group count，方便私测确认 AI 是否真的参与分类。
- Other OpenAI-compatible hosts are `CONFIRM` / P1 because they require an explicit host-permission decision.

## 4. Hosted AI Gateway

职责：

- API key 不暴露给客户端。
- Rate limit。
- Usage metering。
- Prompt versioning。
- JSON validation。
- Fallback。
- Cost tracking。
- PII redaction。

## 5. 成本控制

- 先跑规则，减少 AI 输入。
- hostname/path 分类缓存。
- 同一 URL 摘要缓存。
- 对于 80+ tabs 先聚类 metadata，再少量 AI。
- Group summary 优先使用已有 tab summaries。
- Pro credits 限额。

## 6. 隐私控制

默认发送：

```text
title
hostname
path
pinned/active/audible status
```

可选发送：

```text
full URL
page content
stored summaries
```

绝不发送：

```text
cookies
passwords
form inputs
localStorage/sessionStorage
hidden DOM
```

## 7. 决定

- MVP 先用 DeepSeek API 做简单测试。
- Provider client 保留 OpenAI-compatible 协议，避免锁死 DeepSeek。
- Private beta 不支持任意 OpenAI-compatible host；支持其他 host 前需要确认 Chrome host permissions。
- P0 不做 hosted AI gateway 和账号系统。
- Hosted AI、credits、cloud sync、账号系统进入 P1/Pro。
- Local LLM 和 Chrome built-in AI 作为后续增强。
