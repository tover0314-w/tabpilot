const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT_DIR, ".env.local");
const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-flash";
const SUPPORTED_AI_HOSTNAME = "api.deepseek.com";
const MODELS_TIMEOUT_MS = 8000;
const CLASSIFICATION_TIMEOUT_MS = 12000;
const PAGE_AGENT_TIMEOUT_MS = 15000;
const SHOULD_CLASSIFY_FIXTURE = process.argv.includes("--classify-fixture");
const SHOULD_PAGE_AGENT_FIXTURE = process.argv.includes("--page-agent-fixture");
const SHOULD_PAGE_AGENT_10_TURN_FIXTURE = process.argv.includes("--page-agent-10-turn-fixture");
const PAGE_AGENT_TEN_TURN_HISTORY_LIMIT = 20;

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});

async function main() {
  const env = {
    ...readDotEnv(ENV_PATH),
    ...process.env
  };
  const apiKey = normalizeApiKey(env.DEEPSEEK_API_KEY || env.OPENAI_COMPATIBLE_API_KEY || "");
  const baseUrl = normalizeBaseUrl(env.DEEPSEEK_BASE_URL || env.OPENAI_COMPATIBLE_BASE_URL || DEFAULT_BASE_URL);
  const model = String(env.DEEPSEEK_MODEL || env.OPENAI_COMPATIBLE_MODEL || DEFAULT_MODEL).trim();

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY in .env.local or environment.");
  }

  const models = await fetchModels({ baseUrl, apiKey });
  const modelIds = models.map((item) => item.id).filter(Boolean);
  const modelAvailable = modelIds.includes(model);

  console.log("PASS DeepSeek/OpenAI-compatible /models reachable");
  console.log(`baseUrl=${baseUrl}`);
  console.log(`configuredModel=${model}`);
  console.log(`modelAvailable=${modelAvailable ? "yes" : "no"}`);
  console.log(`modelCount=${modelIds.length}`);

  if (!modelAvailable && modelIds.length) {
    console.log(`availableModels=${modelIds.slice(0, 12).join(",")}`);
  }

  if (SHOULD_CLASSIFY_FIXTURE) {
    const classification = await classifySyntheticFixture({ baseUrl, apiKey, model });
    console.log("PASS synthetic classification fixture completed");
    console.log(`fixtureGroupCount=${classification.groupCount}`);
    console.log(`fixtureAssignedTabs=${classification.assignedTabs}`);
  } else {
    console.log("SKIP synthetic classification fixture; pass --classify-fixture to test chat/completions with fake tabs.");
  }

  if (SHOULD_PAGE_AGENT_FIXTURE) {
    const pageAgent = await answerSyntheticPageFixture({ baseUrl, apiKey, model });
    console.log("PASS synthetic Page Agent fixture completed");
    console.log(`pageAgentAnswerChars=${pageAgent.answerChars}`);
    console.log(`pageAgentKeyPoints=${pageAgent.keyPointCount}`);
  } else {
    console.log("SKIP synthetic Page Agent fixture; pass --page-agent-fixture to test current-page chat with fake visible text.");
  }

  if (SHOULD_PAGE_AGENT_10_TURN_FIXTURE) {
    const report = await answerSyntheticPageTenTurnFixture({ baseUrl, apiKey, model });
    console.log("PASS synthetic Page Agent 10-turn fixture completed");
    console.log(`pageAgent10TurnAverage=${report.averageScore.toFixed(1)}`);
    console.log(`pageAgent10TurnMin=${report.minScore.toFixed(1)}`);
    console.log(`pageAgent10TurnPassed=${report.passed ? "yes" : "no"}`);
    for (const turn of report.turns) {
      console.log(`TURN ${turn.index}: score=${turn.score.toFixed(1)}/10 judge=${turn.judge}`);
      console.log(`Q: ${turn.question}`);
      console.log(`A: ${turn.answer}`);
    }

    if (!report.passed) {
      throw new Error("Synthetic Page Agent 10-turn fixture did not meet the quality threshold.");
    }
  } else {
    console.log("SKIP synthetic Page Agent 10-turn fixture; pass --page-agent-10-turn-fixture to test multi-turn current-page chat.");
  }
}

function readDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const env = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
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
    "DeepSeek /models timed out."
  );

  if (!response.ok) {
    throw new Error(`DeepSeek /models failed with status ${response.status}.`);
  }

  const data = await response.json();
  return Array.isArray(data?.data) ? data.data : [];
}

async function classifySyntheticFixture({ baseUrl, apiKey, model }) {
  const fixtureTabs = [
    {
      tabId: 101,
      title: "Pull request review for sidebar result state",
      hostname: "github.com",
      path: "/example/app/pull/42",
      windowId: 1,
      active: false,
      pinned: false,
      audible: false
    },
    {
      tabId: 102,
      title: "Chrome tabs API reference",
      hostname: "developer.chrome.com",
      path: "/docs/extensions/reference/api/tabs",
      windowId: 1,
      active: false,
      pinned: false,
      audible: false
    },
    {
      tabId: 103,
      title: "Weekly planning notes",
      hostname: "docs.example",
      path: "/document/project-plan",
      windowId: 1,
      active: false,
      pinned: false,
      audible: false
    }
  ];
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
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You classify browser tabs into task-oriented groups. Return only valid JSON with a groups array. Do not invent tabIds."
          },
          {
            role: "user",
            content: JSON.stringify({
              schema: {
                groups: [
                  {
                    name: "string",
                    color: "blue",
                    confidence: 0.9,
                    reason: "short string",
                    tabIds: [101]
                  }
                ]
              },
              privacyNote: "Synthetic fixture only. No real browser tabs, page text, full URLs, or API keys are included in this payload.",
              tabs: fixtureTabs
            })
          }
        ]
      })
    },
    CLASSIFICATION_TIMEOUT_MS,
    "DeepSeek chat/completions fixture timed out."
  );

  if (!response.ok) {
    throw new Error(`DeepSeek chat/completions fixture failed with status ${response.status}.`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek chat/completions fixture returned no content.");
  }

  const parsed = parseJsonObject(content);
  const validTabIds = new Set(fixtureTabs.map((tab) => tab.tabId));
  const groups = Array.isArray(parsed?.groups) ? parsed.groups : [];
  let assignedTabs = 0;

  for (const group of groups) {
    const tabIds = Array.isArray(group?.tabIds) ? group.tabIds : [];
    for (const tabId of tabIds) {
      if (!validTabIds.has(tabId)) {
        throw new Error(`DeepSeek fixture invented tabId ${tabId}.`);
      }
      assignedTabs += 1;
    }
  }

  return {
    groupCount: groups.length,
    assignedTabs
  };
}

async function answerSyntheticPageFixture({ baseUrl, apiKey, model }) {
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
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You are TabMosaic's Page Agent. Answer using only the provided synthetic visible page text. Return only valid JSON."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Answer the user's question about the current visible page.",
              userQuestion: "What should I check before changing these database settings?",
              privacyNote:
                "Synthetic fixture only. No real browser tabs, full URLs, query strings, page text from the user's browser, cookies, form values, hidden DOM, browser history, workspace memory, or API keys are included.",
              schema: {
                answer: "direct conversational answer grounded in visible text",
                keyPoints: ["up to four concise supporting points"],
                suggestedGroup: "short Chrome tab group name",
                suggestedAction: "keep|read_later|review",
                confidence: 0.0
              },
              page: {
                title: "Synthetic Database Settings",
                hostname: "example.test",
                description: "Synthetic settings page for database backups and connection pooling.",
                headings: ["Database", "Connection pooling", "Backups"],
                selectedText: "",
                visibleText:
                  "This synthetic database settings page describes backup status, connection pooling, project connection limits, and migration controls. Before changing settings, review recent backups, production service dependencies, and connection pool limits."
              },
              conversationHistory: [
                {
                  role: "user",
                  text: "What is this page?"
                },
                {
                  role: "assistant",
                  text: "It is a synthetic database settings page."
                }
              ]
            })
          }
        ]
      })
    },
    PAGE_AGENT_TIMEOUT_MS,
    "DeepSeek Page Agent fixture timed out."
  );

  if (!response.ok) {
    throw new Error(`DeepSeek Page Agent fixture failed with status ${response.status}.`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek Page Agent fixture returned no content.");
  }

  const parsed = parseJsonObject(content);
  const answer = String(parsed?.answer || "").trim();
  const keyPoints = Array.isArray(parsed?.keyPoints) ? parsed.keyPoints : [];

  if (!answer) {
    throw new Error("DeepSeek Page Agent fixture returned an empty answer.");
  }

  if (!/backup|pool|connection|database/i.test(answer)) {
    throw new Error("DeepSeek Page Agent fixture answer did not use the synthetic visible text.");
  }

  return {
    answerChars: answer.length,
    keyPointCount: keyPoints.length
  };
}

async function answerSyntheticPageTenTurnFixture({ baseUrl, apiKey, model }) {
  const page = buildSyntheticDatabaseSettingsPage();
  const turns = buildSyntheticPageTenTurnQuestions();
  const history = [];
  const scoredTurns = [];

  for (let index = 0; index < turns.length; index += 1) {
    const turn = turns[index];
    const output = await callSyntheticPageAgent({
      baseUrl,
      apiKey,
      model,
      page,
      question: turn.question,
      conversationHistory: history.slice(-PAGE_AGENT_TEN_TURN_HISTORY_LIMIT)
    });
    const score = scoreSyntheticPageAgentTurn(output.answer, turn);
    const answer = output.answer.replace(/\s+/g, " ").trim();

    scoredTurns.push({
      index: index + 1,
      question: turn.question,
      answer: answer.slice(0, 360),
      score: score.score,
      judge: score.judge,
      hits: score.hits
    });

    history.push({ role: "user", text: turn.question });
    history.push({ role: "assistant", text: answer });
  }

  const scores = scoredTurns.map((turn) => turn.score);
  const averageScore = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const minScore = Math.min(...scores);

  return {
    averageScore,
    minScore,
    passed: averageScore >= 8.0 && minScore >= 7.0,
    turns: scoredTurns
  };
}

async function callSyntheticPageAgent({ baseUrl, apiKey, model, page, question, conversationHistory }) {
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
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content:
              "You are TabMosaic's Page Agent. Answer the user's current-page question using only the provided synthetic visible page text and up to 10 local page-chat Q/A turns. Preserve multi-turn context. If a user asks for a decision, make a cautious recommendation grounded in the page. Return only valid JSON."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Answer the user's question about the current visible page.",
              userQuestion: question,
              privacyNote:
                "Synthetic 10-turn fixture only. No real browser tabs, full URLs, query strings, page text from the user's browser, cookies, form values, hidden DOM, browser history, workspace memory, or API keys are included.",
              schema: {
                answer: "direct conversational answer grounded in visible text",
                keyPoints: ["up to four concise supporting points"],
                suggestedGroup: "short Chrome tab group name",
                suggestedAction: "keep|read_later|review",
                confidence: 0.0
              },
              page,
              conversationHistory
            })
          }
        ]
      })
    },
    PAGE_AGENT_TIMEOUT_MS,
    "DeepSeek Page Agent 10-turn fixture timed out."
  );

  if (!response.ok) {
    throw new Error(`DeepSeek Page Agent 10-turn fixture failed with status ${response.status}.`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek Page Agent 10-turn fixture returned no content.");
  }

  const parsed = parseJsonObject(content);
  const answer = String(parsed?.answer || parsed?.summary || "").trim();

  if (!answer) {
    throw new Error("DeepSeek Page Agent 10-turn fixture returned an empty answer.");
  }

  return {
    answer,
    keyPoints: Array.isArray(parsed?.keyPoints) ? parsed.keyPoints : [],
    confidence: Number(parsed?.confidence || 0)
  };
}

function buildSyntheticDatabaseSettingsPage() {
  return {
    title: "Settings | Database | ai-music | Supabase",
    hostname: "supabase.com",
    description: "Synthetic Supabase database settings page for the ai-music production project.",
    headings: [
      "Database",
      "Connection pooling",
      "Backups",
      "Point-in-time recovery",
      "Pending migrations",
      "Password rotation"
    ],
    selectedText: "",
    visibleText: [
      "Project ai-music is a production Supabase project in region ap-southeast-1 running Postgres 15.8.",
      "Storage usage is 1.2 GB of an 8 GB limit.",
      "Active database connections are currently 38 of a 60 direct connection limit.",
      "Connection pooling is enabled in transaction mode with pool size 15.",
      "The production service named music-worker still uses a direct database connection.",
      "Prepared statements may need review before switching more traffic to transaction pooling.",
      "Daily backups run at 02:00 UTC and are retained for 7 days.",
      "Point-in-time recovery is currently off.",
      "A pending migration named 20260610_add_tracks_index may affect the tracks table.",
      "The page recommends checking a recent backup and testing migrations in staging before applying production changes.",
      "Password rotation is available, but app secrets must be updated before rotating credentials.",
      "SSL is required for database connections.",
      "There are no read replicas configured.",
      "The page warns that changing pooling, rotating credentials, or running migrations can affect production traffic."
    ].join(" ")
  };
}

function buildSyntheticPageTenTurnQuestions() {
  return [
    {
      question: "What is this page for?",
      expected: [["database", "settings"], ["supabase", "project"], ["ai-music", "production"]]
    },
    {
      question: "What are the most important health signals on this page?",
      expected: [["storage", "1.2"], ["38", "connections"], ["backups", "02:00"]]
    },
    {
      question: "Should I change connection pooling right now?",
      expected: [["pool", "pooling"], ["music-worker", "direct"], ["prepared statements", "review"]]
    },
    {
      question: "What is the risk if I rotate the database password?",
      expected: [["password", "credentials"], ["app secrets", "secrets"], ["production", "traffic", "downtime"]]
    },
    {
      question: "Is point-in-time recovery enabled?",
      expected: [["point-in-time", "pitr"], ["off", "not enabled", "disabled"]]
    },
    {
      question: "Which project and environment are we talking about?",
      expected: [["ai-music"], ["production"], ["ap-southeast-1", "region"]]
    },
    {
      question: "Before running the pending migration, what should I check?",
      expected: [["20260610_add_tracks_index", "pending migration"], ["tracks"], ["backup"], ["staging"]]
    },
    {
      question: "Could this page help me reduce connection errors?",
      expected: [["connection"], ["pooling", "pool"], ["38", "60", "limit"], ["music-worker", "direct"]]
    },
    {
      question: "Summarize the action plan from what we discussed, in priority order.",
      expected: [["backup"], ["music-worker", "direct"], ["prepared statements", "pooling"], ["migration", "staging"], ["password", "secrets"]],
      needsHistory: true
    },
    {
      question: "Final decision: should I change settings now or prepare first?",
      expected: [["prepare", "not change", "do not change"], ["backup"], ["staging", "migration"], ["music-worker", "direct"], ["secrets", "password"]],
      needsHistory: true
    }
  ];
}

function scoreSyntheticPageAgentTurn(answer, turn) {
  const text = String(answer || "").toLowerCase();
  const expectedGroups = Array.isArray(turn.expected) ? turn.expected : [];
  const hits = expectedGroups.map((terms) => terms.some((term) => text.includes(String(term).toLowerCase())));
  const hitRatio = hits.length ? hits.filter(Boolean).length / hits.length : 1;
  const answerScore = text.length >= 40 ? 2 : text.length >= 16 ? 1 : 0;
  const groundingScore = 4 * hitRatio;
  const safe = !/full url|cookie|hidden dom|browser history|i cannot|can't access|not provided/i.test(answer);
  const safetyScore = safe ? 2 : 0;
  const continuityScore = turn.needsHistory
    ? (/discussed|priority|first|before|prepare|plan|we/i.test(answer) ? 2 : 1)
    : 2;
  const score = Math.round((answerScore + groundingScore + safetyScore + continuityScore) * 10) / 10;

  return {
    score,
    judge: score >= 9 ? "excellent" : score >= 8 ? "good" : score >= 7 ? "usable" : "weak",
    hits
  };
}

function parseJsonObject(content) {
  const text = String(content || "").trim();

  try {
    return JSON.parse(text);
  } catch {
    const extracted = extractFirstJsonObject(text);
    if (!extracted) {
      throw new Error("DeepSeek chat/completions fixture returned invalid JSON.");
    }

    return JSON.parse(extracted);
  }
}

function extractFirstJsonObject(text) {
  const value = String(text || "");
  const start = value.indexOf("{");

  if (start === -1) return "";

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const char = value[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return value.slice(start, index + 1);
      }
    }
  }

  return "";
}

function normalizeBaseUrl(value) {
  const rawValue = String(value || DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL;
  let url;

  try {
    url = new URL(rawValue);
  } catch {
    throw new Error("Current beta supports only https://api.deepseek.com as the AI base URL.");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== SUPPORTED_AI_HOSTNAME ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Current beta supports only https://api.deepseek.com as the AI base URL.");
  }

  return url.toString().replace(/\/+$/, "");
}

function normalizeApiKey(value) {
  return String(value || "").trim().replace(/;+$/g, "");
}

async function fetchWithTimeout(url, options = {}, timeoutMs, timeoutMessage) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (controller.signal.aborted || error?.name === "AbortError") {
      throw new Error(timeoutMessage || "DeepSeek request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
