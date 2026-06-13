const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const ROOT_DIR = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT_DIR, ".env.local");
const OUT_DIR = path.join(ROOT_DIR, "artifacts", "real-ai-classification");
const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-flash";
const PREFERRED_MODELS = ["deepseek-chat", "deepseek-reasoner", DEFAULT_MODEL];
const CLASSIFICATION_TIMEOUT_MS = 20000;
const MODELS_TIMEOUT_MS = 8000;
const SUPPORTED_GROUP_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan"];

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

async function main() {
  const env = {
    ...readDotEnv(ENV_PATH),
    ...process.env
  };
  const apiKey = normalizeApiKey(env.DEEPSEEK_API_KEY || env.OPENAI_COMPATIBLE_API_KEY || "");
  const baseUrl = normalizeBaseUrl(env.DEEPSEEK_BASE_URL || env.OPENAI_COMPATIBLE_BASE_URL || DEFAULT_BASE_URL);
  const configuredModel = String(env.DEEPSEEK_MODEL || env.OPENAI_COMPATIBLE_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY in .env.local or environment.");
  }

  const tabs = collectChromeTabsForClassification();

  if (!tabs.length) {
    throw new Error("No classifiable http(s) Chrome tabs were found.");
  }

  const modelProbe = await chooseModel({ baseUrl, apiKey, configuredModel });
  const result = await classifyRealTabs({
    baseUrl,
    apiKey,
    model: modelProbe.model,
    tabs
  });
  const report = buildReport({
    tabs,
    result,
    baseUrl,
    model: modelProbe.model,
    configuredModel,
    modelSource: modelProbe.source
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = path.join(OUT_DIR, "latest.json");
  const markdownPath = path.join(OUT_DIR, "latest.md");
  const htmlPath = path.join(OUT_DIR, "latest.html");
  const screenshotPath = path.join(OUT_DIR, "latest.png");

  fs.writeFileSync(jsonPath, JSON.stringify({ tabs, result, model: modelProbe.model, generatedAt: report.generatedAt }, null, 2));
  fs.writeFileSync(markdownPath, report.markdown);
  fs.writeFileSync(htmlPath, report.html);
  await maybeCaptureReportScreenshot(htmlPath, screenshotPath);

  console.log("PASS real Chrome tabs classified with DeepSeek/OpenAI-compatible chat");
  console.log(`tabsSent=${tabs.length}`);
  console.log(`groupsReturned=${Array.isArray(result.groups) ? result.groups.length : 0}`);
  console.log(`model=${modelProbe.model}`);
  console.log(`markdown=${path.relative(ROOT_DIR, markdownPath)}`);
  console.log(`json=${path.relative(ROOT_DIR, jsonPath)}`);
  if (fs.existsSync(screenshotPath)) {
    console.log(`screenshot=${path.relative(ROOT_DIR, screenshotPath)}`);
  }
}

function collectChromeTabsForClassification() {
  const isRunning = childProcess
    .execFileSync("osascript", ["-e", 'tell application "System Events" to (name of processes) contains "Google Chrome"'], {
      encoding: "utf8"
    })
    .trim();

  if (isRunning !== "true") {
    throw new Error("Google Chrome is not running.");
  }

  const script = [
    'tell application "Google Chrome"',
    '  set output to ""',
    '  set sep to ASCII character 9',
    '  set windowIndex to 0',
    '  repeat with w in windows',
    '    set windowIndex to windowIndex + 1',
    '    set activeIndex to active tab index of w',
    '    set tabIndex to 0',
    '    repeat with t in tabs of w',
    '      set tabIndex to tabIndex + 1',
    '      set output to output & windowIndex & sep & tabIndex & sep & activeIndex & sep & (title of t) & sep & (URL of t) & linefeed',
    '    end repeat',
    '  end repeat',
    'end tell',
    "return output"
  ].join("\n");
  const raw = childProcess.execFileSync("osascript", ["-e", script], { encoding: "utf8", maxBuffer: 1024 * 1024 * 4 });

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseChromeTabLine)
    .filter(Boolean)
    .map((tab, index) => ({
      ...tab,
      tabId: index + 1
    }))
    .filter((tab) => ["http:", "https:"].includes(tab.urlScheme))
    .slice(0, 80)
    .map(buildClassificationTab);
}

function parseChromeTabLine(line) {
  const [windowIndexRaw, tabIndexRaw, activeIndexRaw, title, rawUrl] = line.split("\t");
  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const windowIndex = Number(windowIndexRaw);
  const tabIndex = Number(tabIndexRaw);
  const activeIndex = Number(activeIndexRaw);

  return {
    title: sanitizeText(title, 180),
    hostname: sanitizeHostname(url.hostname),
    path: sanitizePath(url.pathname),
    urlScheme: url.protocol,
    windowId: Number.isFinite(windowIndex) ? windowIndex : 0,
    tabIndex: Number.isFinite(tabIndex) ? tabIndex : 0,
    active: Number.isFinite(activeIndex) && activeIndex === tabIndex,
    pinned: false,
    audible: false,
    discarded: false,
    existingGroup: null
  };
}

function buildClassificationTab(tab) {
  const base = {
    tabId: tab.tabId,
    title: tab.title,
    hostname: tab.hostname,
    path: tab.path,
    windowId: tab.windowId,
    active: tab.active,
    pinned: tab.pinned,
    audible: tab.audible,
    discarded: tab.discarded,
    existingGroup: tab.existingGroup
  };

  return {
    ...base,
    ...buildTabSemanticFeatures(base)
  };
}

async function chooseModel({ baseUrl, apiKey, configuredModel }) {
  try {
    const models = await fetchModels({ baseUrl, apiKey });
    const modelIds = models.map((item) => item.id).filter(Boolean);

    if (modelIds.includes(configuredModel)) {
      return { model: configuredModel, source: "configured" };
    }

    const preferred = PREFERRED_MODELS.find((model) => modelIds.includes(model));
    if (preferred) {
      return { model: preferred, source: "auto-selected" };
    }

    if (modelIds[0]) {
      return { model: modelIds[0], source: "first-available" };
    }
  } catch {
    // Some OpenAI-compatible endpoints do not expose /models. Fall back to the configured model.
  }

  return { model: configuredModel, source: "configured-unverified" };
}

async function fetchModels({ baseUrl, apiKey }) {
  const response = await fetchWithTimeout(
    `${baseUrl}/models`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    },
    MODELS_TIMEOUT_MS,
    "Provider /models timed out"
  );

  if (!response.ok) {
    throw new Error(`Provider /models failed (${response.status})`);
  }

  const data = await response.json();
  return Array.isArray(data?.data) ? data.data : [];
}

async function classifyRealTabs({ baseUrl, apiKey, model, tabs }) {
  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        max_tokens: 4000,
        messages: [
          {
            role: "system",
            content:
              "You classify real browser tabs into useful Chrome tab groups. Return only valid JSON. Do not invent tabIds. Prefer user task, project, workflow, artifact type, and intent over domains. Do not create groups named only by a website unless that site is truly the user's job. When multiple tabs share the same host, split them if their title/path suggests different tasks. Use only the provided metadata and derived metadata features. Do not claim you read page bodies."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Classify these real Chrome tabs into fine-grained work-oriented groups.",
              privacyNote:
                "Real local Chrome tab metadata is included: title, hostname, path without query/hash, window index, active state, and local derived semantic features. Full URLs, query strings, hashes, page body text, cookies, form values, browser history, and API keys are not included.",
              qualityBar: [
                "Prefer project/workflow/intent groups over same-domain groups.",
                "If same-domain tabs represent different tasks, split them.",
                "If metadata is insufficient, mark tabs for review instead of pretending.",
                "Keep names concise and useful for an office/knowledge-work user."
              ],
              allowedColors: SUPPORTED_GROUP_COLORS,
              schema: {
                groups: [
                  {
                    name: "short group name",
                    color: "grey|blue|red|yellow|green|pink|purple|cyan",
                    confidence: 0.0,
                    project: "short project/entity name or empty",
                    workflow: "short workflow/stage name",
                    artifactType: "short artifact type",
                    intent: "short user intent",
                    reason: "short reason based only on title/hostname/path/features",
                    evidence: ["short metadata evidence"],
                    tabIds: [1]
                  }
                ],
                reviewTabIds: [1],
                domainOnlyRisks: ["short notes about groups that may still be too domain-like"],
                contentRefinementRecommendation: "what page-content refinement would improve"
              },
              tabs
            })
          }
        ]
      })
    },
    CLASSIFICATION_TIMEOUT_MS,
    "Real-tab DeepSeek classification timed out"
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Real-tab DeepSeek classification failed (${response.status}) ${sanitizeText(errorText, 180)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Real-tab DeepSeek classification returned no content.");
  }

  return validateClassification(parseJsonObject(content), tabs);
}

function parseJsonObject(content) {
  const value = String(content || "").trim();

  try {
    return JSON.parse(value);
  } catch {
    const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim());
    }

    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(value.slice(start, end + 1));
    }
  }

  throw new Error("Real-tab DeepSeek classification returned invalid JSON.");
}

function validateClassification(result, tabs) {
  const validIds = new Set(tabs.map((tab) => tab.tabId));
  const usedIds = new Set();
  const groups = [];

  for (const rawGroup of Array.isArray(result?.groups) ? result.groups : []) {
    const name = sanitizeText(rawGroup?.name, 64);
    const tabIds = (Array.isArray(rawGroup?.tabIds) ? rawGroup.tabIds : [])
      .map((tabId) => Number(tabId))
      .filter((tabId) => validIds.has(tabId) && !usedIds.has(tabId));

    if (!name || !tabIds.length) continue;

    for (const tabId of tabIds) {
      usedIds.add(tabId);
    }

    groups.push({
      name,
      color: SUPPORTED_GROUP_COLORS.includes(rawGroup?.color) ? rawGroup.color : "grey",
      confidence: clamp(Number(rawGroup?.confidence || 0), 0, 1),
      project: sanitizeText(rawGroup?.project, 64),
      workflow: sanitizeText(rawGroup?.workflow, 64),
      artifactType: sanitizeText(rawGroup?.artifactType, 64),
      intent: sanitizeText(rawGroup?.intent, 80),
      reason: sanitizeText(rawGroup?.reason, 240),
      evidence: (Array.isArray(rawGroup?.evidence) ? rawGroup.evidence : []).map((item) => sanitizeText(item, 120)).filter(Boolean).slice(0, 4),
      tabIds
    });
  }

  const reviewTabIds = Array.from(new Set([
    ...(Array.isArray(result?.reviewTabIds) ? result.reviewTabIds : []).map((tabId) => Number(tabId)),
    ...tabs.map((tab) => tab.tabId).filter((tabId) => !usedIds.has(tabId))
  ])).filter((tabId) => validIds.has(tabId));

  return {
    groups,
    reviewTabIds,
    domainOnlyRisks: (Array.isArray(result?.domainOnlyRisks) ? result.domainOnlyRisks : []).map((item) => sanitizeText(item, 180)).filter(Boolean).slice(0, 6),
    contentRefinementRecommendation: sanitizeText(result?.contentRefinementRecommendation, 500)
  };
}

function buildReport({ tabs, result, baseUrl, model, configuredModel, modelSource }) {
  const generatedAt = new Date().toISOString();
  const tabsById = new Map(tabs.map((tab) => [tab.tabId, tab]));
  const lines = [
    "# Real DeepSeek Tab Classification",
    "",
    `Generated: ${generatedAt}`,
    "",
    "This is a real model run against the currently open Google Chrome tabs. It is not the screenshot mock fixture.",
    "",
    "## Data Boundary",
    "",
    "- Sent: tab title, hostname, path without query/hash, window index, active state, and local semantic hints.",
    "- Not sent: full URL, query string, hash, page body text, cookies, form values, browser history, local storage, or API keys.",
    `- Provider: ${baseUrl}`,
    `- Model: ${model}${model !== configuredModel ? ` (configured: ${configuredModel}, ${modelSource})` : ""}`,
    `- Tabs sent: ${tabs.length}`,
    "",
    "## Model Result",
    ""
  ];

  for (const group of result.groups) {
    lines.push(`### ${group.name}`);
    lines.push("");
    lines.push(`- Confidence: ${Math.round(group.confidence * 100)}%`);
    if (group.intent) lines.push(`- Intent: ${group.intent}`);
    if (group.reason) lines.push(`- Why: ${group.reason}`);
    if (group.evidence.length) {
      lines.push(`- Evidence: ${group.evidence.join("; ")}`);
    }
    lines.push("- Tabs:");
    for (const tabId of group.tabIds) {
      const tab = tabsById.get(tabId);
      if (!tab) continue;
      lines.push(`  - ${tab.title || "(untitled)"} (${tab.hostname}${tab.path === "/" ? "" : tab.path})`);
    }
    lines.push("");
  }

  if (result.reviewTabIds.length) {
    lines.push("## Needs Review");
    lines.push("");
    for (const tabId of result.reviewTabIds) {
      const tab = tabsById.get(tabId);
      if (!tab) continue;
      lines.push(`- ${tab.title || "(untitled)"} (${tab.hostname}${tab.path === "/" ? "" : tab.path})`);
    }
    lines.push("");
  }

  if (result.domainOnlyRisks.length) {
    lines.push("## Domain-Only Risk Notes");
    lines.push("");
    for (const note of result.domainOnlyRisks) {
      lines.push(`- ${note}`);
    }
    lines.push("");
  }

  if (result.contentRefinementRecommendation) {
    lines.push("## Content Refinement Recommendation");
    lines.push("");
    lines.push(result.contentRefinementRecommendation);
    lines.push("");
  }

  const markdown = lines.join("\n");
  return {
    generatedAt,
    markdown,
    html: renderReportHtml(markdown)
  };
}

function renderReportHtml(markdown) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Real DeepSeek Tab Classification</title>
  <style>
    :root {
      color: #18211f;
      background: #eef6f3;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      margin: 0;
      padding: 28px;
      background:
        linear-gradient(145deg, rgba(255,255,255,.82), rgba(238,246,243,.92)),
        #eef6f3;
    }
    main {
      max-width: 980px;
      margin: 0 auto;
      padding: 28px;
      border: 1px solid rgba(33,47,43,.1);
      border-radius: 18px;
      background: rgba(255,255,255,.72);
      box-shadow: 0 24px 70px rgba(29,45,41,.12);
      backdrop-filter: blur(20px);
    }
    h1, h2, h3, p { margin-top: 0; }
    h1 { font-size: 30px; line-height: 1.1; }
    h2 { margin-top: 28px; font-size: 18px; }
    h3 { margin-top: 22px; font-size: 15px; }
    p, li { color: rgba(24,33,31,.78); font-size: 13px; line-height: 1.55; }
    ul { padding-left: 20px; }
    code {
      padding: 1px 4px;
      border-radius: 5px;
      background: rgba(47,116,105,.1);
    }
  </style>
</head>
<body>
  <main>${markdownToHtml(markdown)}</main>
</body>
</html>`;
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let list = [];

  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushList();
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      flushList();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      flushList();
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
    } else if (/^\s*-\s+/.test(line)) {
      list.push(line.replace(/^\s*-\s+/, ""));
    } else {
      flushList();
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }

  flushList();
  return html.join("\n");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

async function maybeCaptureReportScreenshot(htmlPath, screenshotPath) {
  let chromium;

  try {
    ({ chromium } = resolvePlaywright());
  } catch {
    return;
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1180, height: 1400 } });
    await page.goto(`file://${htmlPath}`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } finally {
    await browser.close();
  }
}

function resolvePlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_NODE_MODULE_DIR,
    process.env.NODE_REPL_NODE_MODULE_DIRS?.split(path.delimiter)[0],
    path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules")
  ].filter(Boolean);

  try {
    return require("playwright");
  } catch {
    for (const nodeModulesDir of candidates) {
      const packagePath = path.join(nodeModulesDir, "playwright", "package.json");
      if (fs.existsSync(packagePath)) {
        return createRequire(path.join(nodeModulesDir, "noop.js"))("playwright");
      }
    }
  }

  throw new Error("Playwright is not available.");
}

function buildTabSemanticFeatures(tab) {
  const hostname = String(tab.hostname || "").toLowerCase();
  const path = String(tab.path || "").toLowerCase();
  const title = String(tab.title || "");
  const artifactType = inferTabArtifactType({ hostname, path, title });
  const workflow = inferTabWorkflow({ hostname, path, title, artifactType });
  const domainCategory = inferTabDomainCategory(hostname);
  const projectCandidate = inferProjectCandidate({ hostname, path, title, artifactType });

  return {
    inferredArtifactType: artifactType,
    inferredWorkflow: workflow,
    projectCandidate,
    domainCategory,
    intentHint: inferIntentHint({ workflow, artifactType, title }),
    domainOnlyRisk: Boolean(
      domainCategory !== "general_web" &&
      (projectCandidate || !["web_page", "search_results", "article", "video"].includes(artifactType))
    )
  };
}

function inferTabArtifactType({ hostname, path, title }) {
  const text = `${hostname} ${path} ${String(title || "").toLowerCase()}`;

  if (hostname === "github.com" && /\/pull\/\d+/.test(path)) return "pull_request";
  if (hostname === "github.com" && /\/issues\/\d+/.test(path)) return "issue";
  if (hostname === "github.com" && /\/actions\/runs\//.test(path)) return "ci_run";
  if (hostname === "github.com") return "repository";
  if (hostname === "developer.chrome.com" && path.includes("/docs/extensions")) return "chrome_extension_docs";
  if (hostname.includes("supabase.com")) {
    if (text.includes("database")) return "database_settings";
    if (text.includes("auth")) return "auth_settings";
    if (text.includes("storage")) return "storage_settings";
    if (text.includes("sql")) return "sql_editor";
    return "cloud_dashboard";
  }
  if (hostname.includes("vercel.com")) return text.includes("deployment") ? "deployment" : "cloud_dashboard";
  if (hostname === "docs.google.com") return path.includes("/spreadsheets/") ? "spreadsheet" : "document";
  if (hostname.includes("notion.so") || hostname.includes("coda.io")) return "document";
  if (hostname.includes("figma.com") || hostname.includes("canva.com")) return "design_file";
  if (hostname.includes("linear.app") || hostname.includes("jira") || hostname.includes("atlassian.net")) return "issue";
  if (hostname.includes("stripe.com") || hostname.includes("paypal.com")) return "billing_dashboard";
  if (hostname.includes("analytics.google.com") || hostname.includes("mixpanel.com") || hostname.includes("amplitude.com") || hostname.includes("posthog.com")) return "analytics_report";
  if (hostname.includes("youtube.com") && path.includes("/watch")) return "video";
  if (hostname.includes("google.") && path.includes("/search")) return "search_results";
  if (text.includes("blog") || text.includes("article") || path.includes("/blog") || path.includes("/article")) return "article";
  return "web_page";
}

function inferTabWorkflow({ hostname, path, title, artifactType }) {
  const text = `${hostname} ${path} ${String(title || "").toLowerCase()}`;

  if (["pull_request", "ci_run"].includes(artifactType)) return "code_review";
  if (artifactType === "issue") return "issue_triage";
  if (["chrome_extension_docs", "repository"].includes(artifactType)) return "implementation_reference";
  if (["database_settings", "auth_settings", "storage_settings", "cloud_dashboard"].includes(artifactType)) return "production_config";
  if (["deployment"].includes(artifactType)) return "deployment_debugging";
  if (["document", "spreadsheet"].includes(artifactType)) return text.includes("prd") || text.includes("spec") ? "product_planning" : "writing_notes";
  if (artifactType === "design_file") return "design_review";
  if (artifactType === "analytics_report") return "monitoring";
  if (["search_results", "article", "video"].includes(artifactType)) return "research_learning";
  if (artifactType === "billing_dashboard") return "billing";
  if (text.includes("pricing") || text.includes("checkout")) return "buying";
  return "general";
}

function inferTabDomainCategory(hostname) {
  if (hostname === "github.com") return "code_hosting";
  if (hostname === "developer.chrome.com") return "developer_docs";
  if (hostname.includes("supabase.com") || hostname.includes("vercel.com") || hostname.includes("cloudflare.com")) return "dev_infra";
  if (hostname === "docs.google.com" || hostname.includes("notion.so") || hostname.includes("coda.io")) return "docs_notes";
  if (hostname.includes("linear.app") || hostname.includes("jira") || hostname.includes("atlassian.net")) return "product_tasks";
  if (hostname.includes("figma.com") || hostname.includes("canva.com")) return "design";
  if (hostname.includes("stripe.com") || hostname.includes("paypal.com")) return "finance";
  if (hostname.includes("youtube.com")) return "learning";
  if (hostname.includes("google.")) return "research";
  return "general_web";
}

function inferProjectCandidate({ hostname, path, title, artifactType }) {
  if (hostname === "github.com") {
    const match = path.match(/^\/([^/]+)\/([^/]+)/);
    return sanitizeProjectCandidate(match?.[2] || "");
  }
  if (hostname.includes("supabase.com")) {
    const match = path.match(/\/project\/([^/]+)/);
    return sanitizeProjectCandidate(match?.[1] || "");
  }
  if (["document", "spreadsheet", "database_settings", "auth_settings", "storage_settings"].includes(artifactType)) {
    return pickProjectCandidateFromTitle(title);
  }
  return "";
}

function inferIntentHint({ workflow, artifactType, title }) {
  const text = String(title || "").toLowerCase();
  if (workflow === "code_review") return "review";
  if (workflow === "production_config") return "configure";
  if (workflow === "product_planning") return "plan";
  if (workflow === "research_learning") return "learn";
  if (workflow === "monitoring") return "monitor";
  if (artifactType === "search_results") return "research";
  if (text.includes("compare") || text.includes("vs")) return "compare";
  return "keep_context";
}

function pickProjectCandidateFromTitle(title) {
  const blocked = new Set(["settings", "database", "auth", "storage", "dashboard", "documents", "document", "google docs", "supabase", "overview", "home"]);
  const parts = String(title || "")
    .split(/\s[|·•-]\s|[|·•]/)
    .map((part) => sanitizeProjectCandidate(part))
    .filter(Boolean);
  return parts.find((part) => !blocked.has(part.toLowerCase()) && !part.includes("@")) || "";
}

function readDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) {
      if (!env.DEEPSEEK_API_KEY && /^sk-[A-Za-z0-9_-]+$/.test(trimmed)) {
        env.DEEPSEEK_API_KEY = trimmed;
      }
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function normalizeApiKey(value) {
  return String(value || "").trim();
}

function normalizeBaseUrl(value) {
  const url = new URL(String(value || DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL);
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("Base URL must not include username, password, query string, or hash.");
  }
  return url.toString().replace(/\/+$/, "");
}

function fetchWithTimeout(url, options, timeoutMs, timeoutMessage) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).catch((error) => {
    if (error.name === "AbortError") throw new Error(timeoutMessage);
    throw error;
  }).finally(() => clearTimeout(timeout));
}

function sanitizeHostname(value) {
  return String(value || "").trim().toLowerCase().replace(/^www\./, "").slice(0, 120);
}

function sanitizePath(value) {
  const pathValue = String(value || "/").split(/[?#]/)[0] || "/";
  return pathValue.length > 180 ? `${pathValue.slice(0, 177)}...` : pathValue;
}

function sanitizeText(value, maxLength = 180) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeProjectCandidate(value) {
  return String(value || "")
    .replace(/\.(git|com|net|org|io|app)$/i, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5.-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
