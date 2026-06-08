const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT_DIR, ".env.local");
const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-flash";
const SHOULD_CLASSIFY_FIXTURE = process.argv.includes("--classify-fixture");

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});

async function main() {
  const env = {
    ...readDotEnv(ENV_PATH),
    ...process.env
  };
  const apiKey = String(env.DEEPSEEK_API_KEY || env.OPENAI_COMPATIBLE_API_KEY || "").trim();
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
  const response = await fetch(`${baseUrl}/models`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

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
  const response = await fetch(`${baseUrl}/chat/completions`, {
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
            tabs: fixtureTabs
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek chat/completions fixture failed with status ${response.status}.`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek chat/completions fixture returned no content.");
  }

  const parsed = JSON.parse(content);
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

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).trim().replace(/\/+$/, "") || DEFAULT_BASE_URL;
}
