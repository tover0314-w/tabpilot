const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const OUT_DIR = path.join(ROOT_DIR, "artifacts", "ui-screenshots");
const DEFAULT_VIEWPORT = { width: 1366, height: 980 };
const SIDEPANEL_VIEWPORT = { width: 390, height: 2200 };

const MOCK_RUN = {
  id: "mock-run-2026-06-09",
  status: "completed",
  completedAt: "2026-06-09T02:12:00.000Z",
  activeWindowId: 1,
  summary: {
    windowCount: 3,
    tabCount: 42,
    groupsCreated: 7,
    tabsMoved: 31,
    safeDuplicatesClosed: 4,
    reviewDuplicateGroups: 2,
    reviewDuplicatesClosed: 0,
    reviewDuplicateGroupsKept: 0,
    undoAvailable: true,
    closedTabsRestoreAvailable: true,
    aiClassificationStatus: "applied",
    protectedCounts: {
      active: 3,
      pinned: 2,
      audible: 1
    },
    topHosts: [
      { hostname: "docs.google.com", count: 9 },
      { hostname: "github.com", count: 8 },
      { hostname: "linear.app", count: 5 },
      { hostname: "figma.com", count: 4 }
    ]
  },
  groups: [
    {
      id: 101,
      name: "Product Planning",
      color: "blue",
      tabCount: 8,
      reason: "AI matched roadmap, PRD, and planning docs"
    },
    {
      id: 102,
      name: "Code Review",
      color: "green",
      tabCount: 7,
      reason: "User rule: GitHub PR to Code Review"
    },
    {
      id: 103,
      name: "Customer Research",
      color: "purple",
      tabCount: 6,
      reason: "AI clustered interviews and market notes"
    },
    {
      id: 104,
      name: "Design References",
      color: "pink",
      tabCount: 5,
      reason: "Figma and visual inspiration tabs"
    },
    {
      id: 105,
      name: "Chrome Extension Docs",
      color: "cyan",
      tabCount: 4,
      reason: "Built-in docs rule"
    },
    {
      id: 106,
      name: "Articles to Read",
      color: "yellow",
      tabCount: 3,
      reason: "Reading queue"
    }
  ],
  duplicateGroups: [
    {
      id: "dup-exact-1",
      label: "docs.google.com/product-prd",
      type: "exact",
      action: "safe-close-candidate",
      tabCount: 3
    },
    {
      id: "dup-track-1",
      label: "linear.app/project?utm_source=...",
      type: "tracking",
      action: "safe-close-candidate",
      tabCount: 2
    },
    {
      id: "dup-review-1",
      label: "github.com/tover0314-w/tabpilot/pulls",
      type: "query",
      action: "review",
      reviewStatus: "needs-review",
      tabCount: 2,
      tabIds: [301, 302]
    }
  ],
  snapshot: {
    tabs: [
      {
        id: 301,
        windowId: 1,
        title: "PR #24 - Add sidebar control center",
        hostname: "github.com",
        path: "/tover0314-w/tabpilot/pull/24",
        urlScheme: "https",
        active: false,
        pinned: false,
        audible: false,
        protectedReasons: []
      },
      {
        id: 302,
        windowId: 2,
        title: "PR #24 checks - GitHub Actions",
        hostname: "github.com",
        path: "/tover0314-w/tabpilot/actions/runs/24",
        urlScheme: "https",
        active: true,
        pinned: false,
        audible: false,
        protectedReasons: ["active"]
      }
    ]
  }
};

const MOCK_RULES = [
  {
    id: "rule-1",
    type: "domain",
    pattern: "github.com/*/pull/*",
    targetGroupName: "Code Review",
    enabled: true,
    createdFrom: "chat-refine",
    hitCount: 12
  },
  {
    id: "rule-2",
    type: "domain",
    pattern: "docs.google.com",
    targetGroupName: "Product Planning",
    enabled: true,
    createdFrom: "chat-refine",
    hitCount: 8
  }
];

const MOCK_AI_SETTINGS = {
  enabled: true,
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
  apiKey: "mock-redacted-key"
};

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

async function main() {
  const { chromium } = resolvePlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const output = [];

  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const pages = [
      {
        name: "sidepanel-result.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en"
      },
      {
        name: "sidepanel-result-zh.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "zh"
      },
      {
        name: "dashboard-overview.png",
        path: "/dashboard.html",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en"
      },
      {
        name: "dashboard-ai-settings.png",
        path: "/dashboard.html",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#aiSettingsForm").scrollIntoViewIfNeeded();
        }
      }
    ];

    for (const item of pages) {
      const page = await newMockedPage(browser, item.viewport, item.language);
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") pageErrors.push(message.text());
      });

      await page.goto(`${baseUrl}${item.path}`, { waitUntil: "networkidle" });
      await assertPageReady(page, item.path);
      if (item.beforeScreenshot) await item.beforeScreenshot(page);

      const screenshotPath = path.join(OUT_DIR, item.name);
      await captureScreenshot(page, screenshotPath, item);

      if (pageErrors.length) {
        throw new Error(`${item.name} page errors:\n${pageErrors.join("\n")}`);
      }

      output.push(path.relative(ROOT_DIR, screenshotPath));
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log("PASS UI screenshots captured");
  for (const file of output) {
    console.log(file);
  }
}

async function captureScreenshot(page, screenshotPath, item) {
  try {
    await page.screenshot({
      path: screenshotPath,
      fullPage: item.fullPage
    });
  } catch (error) {
    await page.screenshot({
      path: screenshotPath,
      fullPage: false
    });
    console.warn(`WARN ${item.name} used viewport screenshot fallback: ${error.message}`);
  }

  const stats = fs.statSync(screenshotPath);
  if (stats.size < 10000) {
    throw new Error(`${item.name} screenshot looks too small (${stats.size} bytes)`);
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

  throw new Error(
    [
      "Playwright is required for UI screenshots.",
      "Install it locally or set PLAYWRIGHT_NODE_MODULE_DIR to a node_modules directory that contains playwright."
    ].join(" ")
  );
}

function startStaticServer() {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, "http://127.0.0.1");
    const pathname = decodeURIComponent(requestUrl.pathname.replace(/^\/+/, "")) || "sidepanel.html";
    const targetPath = path.normalize(path.join(EXTENSION_DIR, pathname));

    if (!targetPath.startsWith(EXTENSION_DIR)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(targetPath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "content-type": contentType(targetPath)
      });
      response.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function contentType(filePath) {
  const extension = path.extname(filePath);
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".js") return "text/javascript; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".json") return "application/json; charset=utf-8";
  if (extension === ".png") return "image/png";
  return "application/octet-stream";
}

async function newMockedPage(browser, viewport, language) {
  const page = await browser.newPage({ viewport });
  const messages = readMessages(language);
  const storage = {
    "tabmosaic.currentRun": MOCK_RUN,
    "tabmosaic.userRules": MOCK_RULES,
    "tabmosaic.aiSettings": MOCK_AI_SETTINGS,
    "tabmosaic.errorLog": [],
    "tabmosaic.duplicateSafetyAudit": []
  };

  await page.addInitScript(
    ({ messages, storage, language }) => {
      const listeners = [];

      function clone(value) {
        return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
      }

      function pick(keys) {
        if (Array.isArray(keys)) {
          return Object.fromEntries(keys.map((key) => [key, clone(storage[key])]));
        }

        if (typeof keys === "string") {
          return { [keys]: clone(storage[keys]) };
        }

        if (keys && typeof keys === "object") {
          return Object.fromEntries(
            Object.keys(keys).map((key) => [key, clone(storage[key] === undefined ? keys[key] : storage[key])])
          );
        }

        return clone(storage) || {};
      }

      function message(key, substitutions = []) {
        let text = messages[key]?.message || key;
        const values = Array.isArray(substitutions) ? substitutions : [substitutions];
        values.forEach((value, index) => {
          text = text.replace(new RegExp(`\\$${index + 1}`, "g"), String(value ?? ""));
        });
        return text;
      }

      globalThis.chrome = {
        i18n: {
          getUILanguage: () => (language === "zh" ? "zh-CN" : "en-US"),
          getMessage: message
        },
        runtime: {
          getManifest: () => ({
            version: "0.1.0",
            permissions: ["tabs", "tabGroups", "storage", "sidePanel", "scripting", "activeTab"],
            host_permissions: ["https://api.deepseek.com/*"]
          }),
          getURL: (extensionPath) => `/${extensionPath}`,
          onMessage: {
            addListener: (listener) => listeners.push(listener)
          },
          sendMessage: async (request) => {
            if (request?.type === "GET_CURRENT_RUN") {
              return { ok: true, run: clone(storage["tabmosaic.currentRun"]) };
            }

            if (request?.type === "TEST_AI_CONNECTION") {
              return {
                ok: true,
                result: {
                  modelAvailable: true,
                  model: request.model || "deepseek-v4-flash"
                }
              };
            }

            if (request?.type === "PREVIEW_CHAT_REFINE") {
              return {
                ok: true,
                draft: {
                  id: "mock-chat-draft",
                  status: "preview",
                  answer: "I found matching work tabs and can move them safely.",
                  actionSummary: "Move 4 GitHub PR tabs to Code Review.",
                  risk: "No tabs will be closed.",
                  matchedTabCount: 4,
                  matchedTabs: [
                    {
                      title: "PR #24 - Add sidebar control center",
                      hostname: "github.com",
                      path: "/pull/24",
                      windowId: 1
                    },
                    {
                      title: "PR #26 - Privacy copy",
                      hostname: "github.com",
                      path: "/pull/26",
                      windowId: 2
                    }
                  ]
                }
              };
            }

            return { ok: true, run: clone(storage["tabmosaic.currentRun"]) };
          }
        },
        storage: {
          local: {
            get: async (keys) => pick(keys),
            set: async (value) => Object.assign(storage, clone(value)),
            remove: async (keys) => {
              const list = Array.isArray(keys) ? keys : [keys];
              list.forEach((key) => delete storage[key]);
            }
          }
        },
        tabs: {
          create: async () => ({ id: 999 })
        }
      };
    },
    {
      messages,
      storage,
      language
    }
  );

  return page;
}

function readMessages(language) {
  const locale = language === "zh" ? "zh_CN" : "en";
  const messagesPath = path.join(EXTENSION_DIR, "_locales", locale, "messages.json");
  return JSON.parse(fs.readFileSync(messagesPath, "utf8"));
}

async function assertPageReady(page, pathname) {
  if (pathname.includes("sidepanel")) {
    await page.waitForSelector(".status-panel.completed", { timeout: 5000 });
    return;
  }

  await page.waitForSelector("#dashboardMetrics .metric-card", { timeout: 5000 });
  await page.waitForFunction(
    () => document.querySelector("#aiBaseUrlInput")?.value === "https://api.deepseek.com",
    null,
    { timeout: 5000 }
  );
}
