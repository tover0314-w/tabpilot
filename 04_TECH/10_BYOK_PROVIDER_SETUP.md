# BYOK Provider Setup Guide

Status: PRIVATE BETA / IMPLEMENTED FIRST SLICE  
Last updated: 2026-06-12  
Related:

- `04_TECH/05_AI_PROVIDER_STRATEGY.md`
- `02_FEATURE_SPECS/11_PRIVACY_CONTROLS.md`
- `05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md`

## 1. Purpose

TabMosaic supports Bring Your Own Key providers through an OpenAI-compatible request format.

The goal is:

```text
Users can choose their own model provider.
TabMosaic keeps the same privacy boundary regardless of provider.
Remote provider origins require explicit Chrome permission.
Local model endpoints can work without an API key when the local server does not require auth.
```

## 2. Current Dashboard Presets

The Dashboard Settings preset only fills `Base URL` and `Model`. It does not save, test, enable AI, or request permissions until the user clicks Save or Test.

Implementation source:

```text
extension/provider_registry.js
```

This registry is shared by Dashboard and background logic so preset IDs, known provider host labels, default DeepSeek host, and default AI settings stay aligned.

| Preset | Base URL | Example model | API key |
|---|---|---|---|
| DeepSeek | `https://api.deepseek.com` | `deepseek-v4-flash` | Required |
| OpenAI | `https://api.openai.com/v1` | `gpt-4.1-mini` | Required |
| OpenRouter | `https://openrouter.ai/api/v1` | `openai/gpt-4.1-mini` | Required |
| Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-3.5-flash` | Required |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | Required |
| Together AI | `https://api.together.xyz/v1` | `meta-llama/Llama-3.3-70B-Instruct-Turbo` | Required |
| Mistral AI | `https://api.mistral.ai/v1` | `mistral-small-latest` | Required |
| xAI | `https://api.x.ai/v1` | `grok-4.3` | Required |
| Perplexity | `https://api.perplexity.ai` | `sonar-pro` | Required |
| Cerebras | `https://api.cerebras.ai/v1` | `gpt-oss-120b` | Required |
| Fireworks AI | `https://api.fireworks.ai/inference/v1` | `accounts/fireworks/models/llama-v3p1-8b-instruct` | Required |
| DeepInfra | `https://api.deepinfra.com/v1/openai` | `deepseek-ai/DeepSeek-V3` | Required |
| SiliconFlow | `https://api.siliconflow.cn/v1` | `Pro/zai-org/GLM-4.7` | Required |
| Kimi / Moonshot | `https://api.moonshot.ai/v1` | `kimi-k2.6` | Required |
| MiniMax | `https://api.minimax.io/v1` | `MiniMax-M3` | Required |
| DashScope / Qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | Required |
| LM Studio | `http://localhost:1234/v1` | `local-model` | Optional if local server does not require auth |
| Ollama | `http://localhost:11434/v1` | `llama3.1` | Optional if local server does not require auth |

Model names are examples. The connection test first calls a provider model-list endpoint and tells the user if the configured model is not listed. When that endpoint succeeds, Dashboard fills a native model suggestion list from the provider's returned model IDs. If a provider does not expose a standard model-list endpoint, TabMosaic falls back to a fixed synthetic chat ping that sends no tab data, page text, full URLs, or real user content and does not invent model suggestions. The test also returns compact diagnostics so users can see whether `/models` or synthetic ping was used, how many model suggestions were found, whether the endpoint is local or remote, and whether an Authorization header was sent.

## 3. Permission Boundary

Required host permission remains narrow:

```text
https://api.deepseek.com/*
```

Other provider origins are requested explicitly as optional permissions when the user saves/tests that provider.

Examples:

```text
https://api.openai.com/*
https://openrouter.ai/*
https://api.groq.com/*
http://localhost/*
```

Provider Base URL validation:

- Remote providers must use HTTPS.
- HTTP is allowed only for localhost-style local endpoints.
- Base URL must not contain username, password, query string, or hash.
- The extension never adds broad required host permissions for BYOK providers.
- Presets do not save, test, enable AI, or request permission by themselves.

## 4. Data Boundary

BYOK does not loosen data minimization.

One-click classification sends only minimized tab metadata:

```text
title
hostname
path
window id
tab state
derived metadata features
```

It does not send:

```text
full URL
page text
cookies
form values
hidden DOM
browser history
saved workspace contents
TabMosaic cloud memory
```

Current-page or selected-tabs page text is sent only after the user asks a page/context question or requests content-assisted regrouping.

The connection test sends either:

```text
GET provider model-list endpoint
```

or, when a model-list endpoint is unavailable:

```text
POST provider chat/completions with a fixed synthetic "Reply with OK." prompt
```

It does not send tabs, page text, full URLs, browsing history, chat history, rules, workspace snapshots, or page summaries.

The connection test status includes:

```text
provider label
checked via /models or synthetic ping
model suggestion count
local endpoint or remote endpoint
Authorization sent or no Authorization header
```

It does not expose API keys or add any extra provider probe beyond the existing model-list / synthetic ping request.

## 5. Local Model Notes

Local endpoints are useful for privacy-first users and open-source developers.

Current supported shape:

```text
OpenAI-compatible localhost endpoint
GET /models
POST /chat/completions
```

The local endpoint may be used without an API key if the local server does not require auth. If the user enters a key, TabMosaic sends it as a Bearer token.

Known local presets:

- LM Studio: start the local server, then use `http://localhost:1234/v1`.
- Ollama: run a model locally and use the OpenAI-compatible `/v1` endpoint at `http://localhost:11434/v1`.

Guided local model setup first slice is implemented in Dashboard Settings:

```text
Choose LM Studio or Ollama preset
→ Base URL and model are filled
→ a compact local setup card explains how to start the local server
→ user clicks Test AI Connection
→ if /models succeeds, available model IDs appear as model input suggestions
→ no tab data or page text is sent during the connection test
```

Still future work:

```text
- installing local model runtimes
- rich model browser with provider metadata, size, context window, and recommended use
- model install automation and rich model metadata browsing beyond the compact model-list / synthetic ping diagnostics and troubleshooting hints
```

### 5.1 Chrome Built-in AI Notes

Research status: official-docs research complete as of 2026-06-12.

Chrome built-in AI should not be added to this preset table because it is not an OpenAI-compatible Base URL provider. It is a browser API adapter candidate.

Current product stance:

```text
P0: DeepSeek/OpenAI-compatible BYOK remains the primary tested path.
P1/P2: Chrome built-in AI may become a separate local adapter after an implementation spike.
```

Important implementation implications:

- Use `LanguageModel.availability()` / related built-in AI availability checks before showing the feature as usable.
- Expect first-use model download and download progress UI.
- Require user activation where Chrome requires it for session creation or model download.
- Keep the same privacy model: page text still only enters the adapter after a user-triggered page/context question.
- Keep BYOK fallback available because device, Chrome version, language, storage, CPU/GPU/RAM, policy, or model availability may block the built-in API.
- Do not call it "OpenAI-compatible" and do not ask for Base URL / API key.

## 6. Official References

- Chrome built-in AI API status and overview: https://developer.chrome.com/docs/ai/built-in-apis
- Chrome built-in AI get started / requirements: https://developer.chrome.com/docs/ai/get-started
- Chrome Prompt API: https://developer.chrome.com/docs/ai/prompt-api
- Chrome Extensions and AI: https://developer.chrome.com/docs/extensions/ai
- OpenRouter quickstart: https://openrouter.ai/docs/quickstart
- OpenRouter authentication: https://openrouter.ai/docs/api/reference/authentication
- Gemini OpenAI compatibility: https://ai.google.dev/gemini-api/docs/openai
- Gemini models: https://ai.google.dev/gemini-api/docs/models
- Groq OpenAI compatibility: https://console.groq.com/docs/openai
- Groq overview / base URL: https://console.groq.com/docs/overview
- Together AI OpenAI compatibility: https://docs.together.ai/docs/inference/openai-compatibility
- Together AI integrations / base URL: https://docs.together.ai/docs/inference/sdk-integrations
- Mistral migration guides: https://docs.mistral.ai/resources/migration-guides
- xAI chat completions: https://docs.x.ai/developers/rest-api-reference/inference/chat
- xAI model list: https://docs.x.ai/developers/rest-api-reference/inference/models
- Perplexity OpenAI compatibility: https://docs.perplexity.ai/docs/sonar/openai-compatibility
- Perplexity model list: https://docs.perplexity.ai/api-reference/models-get
- Cerebras OpenAI compatibility: https://inference-docs.cerebras.ai/resources/openai
- Cerebras model list: https://inference-docs.cerebras.ai/api-reference/models/list-models
- Fireworks OpenAI compatibility: https://docs.fireworks.ai/tools-sdks/openai-compatibility
- Fireworks model list: https://docs.fireworks.ai/api-reference/list-models
- DeepInfra OpenAI-compatible chat: https://docs.deepinfra.com/chat/overview
- SiliconFlow OpenAI chat completions: https://docs.siliconflow.cn/cn/api-reference/chat-completions/chat-completions
- SiliconFlow model list: https://siliconflow.readme.io/reference/retrieve-a-list-of-models
- Kimi API overview: https://platform.kimi.ai/docs/api/overview
- Kimi model list: https://platform.kimi.ai/docs/models
- MiniMax OpenAI SDK: https://platform.minimax.io/docs/api-reference/text-openai-api
- MiniMax model list: https://platform.minimax.io/docs/api-reference/models/openai/list-models
- DashScope OpenAI compatibility: https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope
- LM Studio OpenAI compatibility: https://lmstudio.ai/docs/developer/openai-compat
- Ollama OpenAI compatibility: https://docs.ollama.com/api/openai-compatibility

## 7. Adding A Provider Preset

Provider preset contributions should stay boring, explicit, and privacy-preserving.

Only add providers that support an OpenAI-compatible `chat/completions` request shape. A provider with a native-only API, custom auth scheme beyond Bearer token, required browser-side SDK, streaming-only interface, or non-standard response format needs a separate feature spec before implementation.

Checklist for adding a preset:

```text
1. Verify official provider docs for Base URL, chat/completions compatibility, model-list behavior, and example model name.
2. Add the preset to `AI_PROVIDER_PRESETS` in `extension/provider_registry.js`.
3. Add the remote hostname to `AI_PROVIDER_HOST_IDS` if the provider is not localhost.
4. Add a matching `<option value="provider-id">` to Dashboard Settings in `extension/dashboard.html`.
5. Add the provider row to this guide's Current Dashboard Presets table.
6. Add official reference links to this guide.
7. Run `node tools/provider_registry_check.js`.
8. Run `node tools/preflight.js`.
```

Rules:

- Remote Base URLs must use HTTPS.
- HTTP is allowed only for localhost-style local endpoints.
- Base URLs must not include username, password, query string, hash, or trailing slash.
- Presets must not include API keys, bearer tokens, organization IDs, account IDs, or private model endpoints.
- Presets only fill Base URL and model. They must not save settings, enable AI, request permission, or send data by themselves.
- Do not add a new required host permission for a provider preset.
- Do not add `<all_urls>`, history, cookies, bookmarks, webRequest, browsingData, or broad background-reading permissions.
- Use only synthetic test data when validating a provider contribution.
- Treat example model names as examples, not availability promises.
- If model listing is unavailable, the existing connection test may fall back to the fixed synthetic chat ping.

## 8. Acceptance Criteria

```gherkin
Given the user opens Dashboard Settings
When they choose a provider preset
Then Base URL and model are filled
And no provider is saved or tested until the user clicks Save or Test

Given the user chooses a remote OpenAI-compatible provider
When they save or test it
Then Chrome asks for that provider origin only
And an API key is required before network testing

Given the user chooses the Ollama or LM Studio preset
When the preset fills the local endpoint fields
Then Dashboard shows a compact local setup guide
And the guide does not save settings, enable AI, call the provider, read tabs, or request permissions by itself

Given the user clicks Test AI Connection
When the provider returns a model-list response
Then Dashboard fills model input suggestions from those returned model IDs
And the suggestions are not persisted, do not enable AI, and do not include tab data or page content
And Dashboard shows a compact diagnostic line with provider label, check type, suggestion count, endpoint type, and Authorization status

Given the user chooses a localhost OpenAI-compatible endpoint
When they save or test it without an API key
Then the endpoint is allowed
And no Authorization header is sent
```
