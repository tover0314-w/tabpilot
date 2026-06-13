export const DEFAULT_AI_SETTINGS = {
  enabled: false,
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
  apiKey: ""
};

export const AI_PROVIDER_PRESETS = new Map([
  ["deepseek", { label: "DeepSeek", baseUrl: "https://api.deepseek.com", model: "deepseek-v4-flash" }],
  ["openai", { label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini" }],
  ["openrouter", { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-4.1-mini" }],
  ["gemini", { label: "Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-3.5-flash" }],
  ["groq", { label: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" }],
  ["together", { label: "Together AI", baseUrl: "https://api.together.xyz/v1", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" }],
  ["mistral", { label: "Mistral AI", baseUrl: "https://api.mistral.ai/v1", model: "mistral-small-latest" }],
  ["xai", { label: "xAI", baseUrl: "https://api.x.ai/v1", model: "grok-4.3" }],
  ["perplexity", { label: "Perplexity", baseUrl: "https://api.perplexity.ai", model: "sonar-pro" }],
  ["cerebras", { label: "Cerebras", baseUrl: "https://api.cerebras.ai/v1", model: "gpt-oss-120b" }],
  ["fireworks", { label: "Fireworks AI", baseUrl: "https://api.fireworks.ai/inference/v1", model: "accounts/fireworks/models/llama-v3p1-8b-instruct" }],
  ["deepinfra", { label: "DeepInfra", baseUrl: "https://api.deepinfra.com/v1/openai", model: "deepseek-ai/DeepSeek-V3" }],
  ["siliconflow", { label: "SiliconFlow", baseUrl: "https://api.siliconflow.cn/v1", model: "Pro/zai-org/GLM-4.7" }],
  ["kimi", { label: "Kimi / Moonshot", baseUrl: "https://api.moonshot.ai/v1", model: "kimi-k2.6" }],
  ["minimax", { label: "MiniMax", baseUrl: "https://api.minimax.io/v1", model: "MiniMax-M3" }],
  ["dashscope", { label: "DashScope / Qwen", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" }],
  ["lmstudio", { label: "LM Studio", baseUrl: "http://localhost:1234/v1", model: "local-model" }],
  ["ollama", { label: "Ollama", baseUrl: "http://localhost:11434/v1", model: "llama3.1" }]
]);

export const AI_PROVIDER_HOST_IDS = new Map([
  ["api.deepseek.com", "deepseek"],
  ["api.openai.com", "openai"],
  ["openrouter.ai", "openrouter"],
  ["generativelanguage.googleapis.com", "gemini"],
  ["api.groq.com", "groq"],
  ["api.together.xyz", "together"],
  ["api.mistral.ai", "mistral"],
  ["api.x.ai", "xai"],
  ["api.perplexity.ai", "perplexity"],
  ["api.cerebras.ai", "cerebras"],
  ["api.fireworks.ai", "fireworks"],
  ["api.deepinfra.com", "deepinfra"],
  ["api.siliconflow.cn", "siliconflow"],
  ["api.moonshot.ai", "kimi"],
  ["api.minimax.io", "minimax"],
  ["dashscope.aliyuncs.com", "dashscope"],
  ["dashscope-us.aliyuncs.com", "dashscope"]
]);

export const DEFAULT_AI_HOSTNAME = "api.deepseek.com";
export const DEFAULT_AI_PROVIDER_ORIGIN = `https://${DEFAULT_AI_HOSTNAME}/*`;
