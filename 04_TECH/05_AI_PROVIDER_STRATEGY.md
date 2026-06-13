# AI Provider 策略

## 1. 目标

支持不同隐私和成本偏好的用户：

- 不调用 AI：本地规则。
- DeepSeek API：MVP 简单测试和默认开发 provider。
- BYOK / user-provided model：用户自己的 API key、model 和 provider config。
- User-provided OpenAI-compatible API：用户自己的 API key、model 和 base URL。非默认 host 通过显式 provider-origin permission 启用。
- Hosted AI：Pro 用户最顺滑体验。
- Local LLM：高级用户隐私优先。
- Chrome built-in AI：后续可用时优先本地。

## 2. Provider 类型

| Provider | P0/P1 | 优点 | 缺点 |
|---|---|---|---|
| Rules only | P0 | 免费、快、隐私好 | 智能有限 |
| DeepSeek API via OpenAI-compatible client | P0 | 成本低、实现快、适合 MVP 验证 | 仍需外部 API 和网络 |
| User-provided OpenAI-compatible API beyond DeepSeek | P0 | 成本由用户承担，可兼容 OpenAI-compatible 服务，是开源/BYOK 的核心承诺 | 配置门槛高，且需要显式 provider-origin permission |
| Hosted AI | P1/Pro | 体验最好 | 你承担成本和合规 |
| Local LLM endpoint | P0 basic / P1 guided UX | 隐私好，契合开源用户 | 用户门槛高；当前只支持 OpenAI-compatible localhost endpoint 配置，不做模型安装向导 |
| Chrome built-in AI | P1/P2 research only | 本地、低成本、无需外部 API key | 不是 OpenAI-compatible endpoint；有 Chrome 版本、设备、磁盘、模型下载、user activation、语言/模态和 API 成熟度限制 |

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

Open-source/BYOK target parameters:

```text
providerName: user-defined
baseUrl: user-defined OpenAI-compatible endpoint
apiKey: user-provided, stored locally
model: user-defined
dataBoundary: same minimized payload rules as DeepSeek
permissionBoundary: explicit host permission / allowlist before non-DeepSeek hosts
```

实现状态：

- `extension/` 已接入可选 BYOK AI 分类和 Agent answers，request format 保持 OpenAI-compatible。
- Default host permission 仍仅包含 `https://api.deepseek.com/*`。其他 HTTPS provider host 或 `http://localhost` local endpoint 在 Dashboard Settings 保存/测试前请求对应 provider origin，例如 `https://api.example.com/*`。
- `extension/provider_registry.js` is the shared provider registry for Dashboard presets, known provider host labels, the default DeepSeek host, and default AI settings. Background and Dashboard import this registry to avoid drift.
- Dashboard Settings includes provider presets for DeepSeek, OpenAI, OpenRouter, Gemini, Groq, Together AI, Mistral AI, xAI, Perplexity, Cerebras, Fireworks AI, DeepInfra, SiliconFlow, Kimi / Moonshot, MiniMax, DashScope / Qwen, LM Studio, and Ollama. Presets only fill Base URL and model; they do not save, test, enable AI, or request permissions until the user clicks Save/Test.
- Selecting the LM Studio or Ollama preset shows a compact local setup guide in Dashboard Settings. The guide explains how to start the local OpenAI-compatible server and click Test AI Connection; it does not install models, call providers, save settings, request permissions, or read tab/page data by itself.
- API key 仅保存到 `chrome.storage.local`。
- Remote providers require a user-provided API key. Localhost OpenAI-compatible endpoints may be used without an API key when the local model server does not require auth; in that case no Authorization header is sent.
- For private local testing, `tools/write_private_beta_ai_config.js` can copy `.env.local` DeepSeek settings into ignored `extension/private-beta-ai-settings.json` so a locally loaded unpacked extension can use DeepSeek without manual Dashboard Settings entry. This file must never be committed or included in release zips.
- 分类输入只包含 title、hostname、path、window id 和 tab state，不发送页面正文或完整 URL。
- API 不可用时自动 fallback 到 built-in rules。
- Dashboard 已接入 user-triggered `Test AI Connection`。它优先调用配置 provider 的 model-list endpoint 检查 API key 和 model 是否可用；如果 provider 没有标准 model-list endpoint，则退到固定 synthetic chat ping。不发送 tab data、page text、full URL、真实用户内容、浏览器历史、workspace 或规则。
- When the provider model-list endpoint succeeds, `Test AI Connection` returns up to 30 model IDs as Dashboard model suggestions in a native datalist. Suggestions are not persisted, do not enable AI, and are not generated from tab/page data. Synthetic chat fallback does not invent model suggestions.
- Test AI Connection now returns compact provider diagnostics: provider label, whether `/models` or synthetic chat ping was used, model suggestion count, local vs remote endpoint, permission origin, whether Authorization was sent, explicit no-tab/no-page/no-full-URL flags, and short troubleshooting codes for common setup issues. Dashboard renders this as a single status line plus concise `Next:` guidance rather than a larger settings panel.
- `/models` connection test has an 8s timeout.
- Synthetic chat ping uses the same 8s timeout and sends only a fixed non-user prompt.
- `chat/completions` classification has a 12s timeout.
- Sidebar metadata Agent answers use the configured OpenAI-compatible chat endpoint with a 12s timeout.
- Metadata Agent input is limited to minimized current run metadata: title, hostname, path, window id, tab state, group state, and duplicate-review counts.
- Metadata Agent input includes minimized tab metadata, active Sidebar context, and up to 4 sanitized recent user/assistant chat turns for follow-up resolution. It does not include page body, page summaries, full URL, restore URL, favicon URL, cookies, form data, hidden DOM, browser history, saved workspace contents, or cloud memory.
- Metadata Agent output is validated before rendering: invented tab IDs are ignored, open-ended answers render as plain assistant bubbles without automatic action chips, `move_tabs` action drafts require explicit Apply, and no browser action is applied automatically.
- Current-tab Page Agent uses the same configured OpenAI-compatible chat endpoint with a 15s timeout after the user explicitly asks a current-page question and completes any sensitive-page confirmation.
- Page Agent input includes current-tab title, hostname, visible page text, selected text, headings, description, and up to 10 short local page-chat Q/A turns for follow-up resolution. It does not include full URL, query/hash, cookies, form values, hidden DOM, browser history, workspace memory, multi-tab page bodies, or TabMosaic cloud storage.
- Page Agent redacts obvious API-key-like strings, bearer tokens, JWTs, full URLs, and database connection strings best-effort before upload. If no provider is configured, current-page chat shows a provider-configuration prompt before reading page body content. If the configured provider fails, current-page chat shows an explicit AI-error answer instead of falling back to a local extractive answer that could look like AI.
- Classification timeout or provider failure returns `fallback:*` status and one-click organize continues with local rules.
- Timeout handling does not change host permission, request payload, full URL policy, page text policy, or cloud storage defaults.
- Sidebar 和 Dashboard 已显示 latest run 的 AI 状态（AI provider applied / fallback / local rules）和 AI suggested group count，方便私测确认 AI 是否真的参与分类。
- Acceptance evidence for product behavior should use the real configured AI provider when available. `tools/deepseek_real_tabs_classification.js` reads the user's current Chrome tab metadata, calls the configured DeepSeek/OpenAI-compatible model, and writes a Markdown/JSON/screenshot report. `tools/capture_real_ai_sidepanel_result.js` renders that real model result inside the Sidebar UI for acceptance review. These tools must not print API keys and must not send full URLs, query/hash, page body text, cookies, form values, browser history, local storage, or saved workspace contents.
- Other OpenAI-compatible hosts and local model endpoints are enabled only through explicit origin permission. The implementation rejects remote HTTP providers, rejects Base URLs containing username/password/query/hash, allows HTTP only for localhost-style endpoints, and sends Authorization only when an API key is present.
- Known provider hosts get provider-specific labels in local status; unknown OpenAI-compatible hosts remain supported as `openai-compatible`.
- Agent web search is a separate optional BYOK provider path, not part of the OpenAI-compatible model provider. The first adapter is Tavily-style `POST /search`; it is disabled until the user saves a local search API key in Dashboard Settings, grants the configured search provider origin permission, and explicitly asks the Sidebar Agent to search the web.
- Web search sends only the normalized user-typed query by default. It does not send open tab titles, page text, full browser URLs, summaries, workspace memory, rules, or chat history to the search provider. Raw content and image search are off by default, and results remain session-only unless a later Save flow is implemented.

### 3.1 Chrome built-in AI research status

RESEARCHED 2026-06-12 from official Chrome documentation:

```text
Conclusion:
Chrome built-in AI is a future optional local provider adapter, not a replacement for the current P0 BYOK/OpenAI-compatible provider path.
```

Why:

- Official Chrome docs say built-in AI APIs can be used in Chrome Extensions, and the Prompt API is available in Chrome stable for extensions.
- The Prompt API runs through the browser's `LanguageModel` API and Gemini Nano, not an OpenAI-compatible `chat/completions` endpoint.
- Models are downloaded separately on first use and must pass `availability()` checks.
- User activation may be required before `create()` when model download/session creation is needed.
- Device support has practical constraints: desktop-class OS support, disk space, RAM/CPU/GPU requirements, and no mobile support for Gemini Nano APIs.
- Language and modality support is still narrower than the BYOK model matrix.
- API stage varies by API: some APIs are stable, some are origin trial / developer trial / early preview.

Product stance:

```text
P0: keep DeepSeek/OpenAI-compatible BYOK as the default tested path.
P1/P2: add a separate `chrome_builtin_ai` provider adapter only after an implementation spike.
Do not represent Chrome built-in AI as a Base URL preset.
Do not add permissions, UI claims, public launch copy, or fallback routing until the adapter is implemented and QA'd.
```

Recommended first adapter scope later:

- Current-tab summary fallback for eligible Chrome builds.
- Selected-region text Q&A fallback for eligible Chrome builds.
- Metadata-only classification experiment with strict schema validation.
- Clear UI for model availability, download progress, unsupported-device fallback, and language limitations.

## 4. Hosted AI Gateway

Hosted AI is no longer the default model story. It is a convenience layer for users who do not want to configure providers, want sync/memory/team workflows, or need managed routing.

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

- MVP 默认用 DeepSeek API 做简单测试。
- Provider client 保留 OpenAI-compatible 协议，避免锁死 DeepSeek。
- 开源 + BYOK 是确认方向：用户应该能配置自己的模型/API key。
- Private beta 支持用户配置 OpenAI-compatible HTTPS provider host、model、API key，以及 `http://localhost` local model endpoint；非默认 origin 必须由用户显式授权。
- P0 不做 hosted AI gateway 和账号系统。
- Hosted AI、credits、cloud sync、账号系统进入 P1/Pro。
- Local LLM first slice includes Dashboard setup help for Ollama / LM Studio plus the existing localhost connection test. Model-list suggestions, compact connection diagnostics, and provider-specific troubleshooting next steps from the provider test are implemented.
- Chrome built-in AI official-docs research is complete. It remains a P1/P2 adapter candidate, not a P0 dependency and not a Dashboard Base URL preset.
- Model installation automation and rich model metadata browsing remain future work.
