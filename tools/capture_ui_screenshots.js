const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const OUT_DIR = path.join(ROOT_DIR, "artifacts", "ui-screenshots");
const DEFAULT_VIEWPORT = { width: 1366, height: 980 };
const DASHBOARD_MOBILE_VIEWPORT = { width: 390, height: 1200 };
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
    aiGroupsSuggested: 3,
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
      windowId: 1,
      name: "Product Planning",
      color: "blue",
      tabCount: 8,
      tabIds: [301, 302, 303, 304, 305, 306, 307, 308],
      reason: "AI matched roadmap, PRD, and planning docs"
    },
    {
      id: 102,
      windowId: 2,
      name: "Code Review",
      color: "green",
      tabCount: 7,
      tabIds: [309, 310, 311, 312, 313, 314, 315],
      reason: "User rule: GitHub PR to Code Review"
    },
    {
      id: 103,
      windowId: 3,
      name: "Customer Research",
      color: "purple",
      tabCount: 6,
      tabIds: [316, 317, 318, 319, 320, 321],
      reason: "AI clustered interviews and market notes"
    },
    {
      id: 104,
      windowId: 1,
      name: "Design References",
      color: "pink",
      tabCount: 5,
      tabIds: [322, 323, 324, 325, 326],
      reason: "Figma and visual inspiration tabs"
    },
    {
      id: 105,
      windowId: 2,
      name: "Chrome Extension Docs",
      color: "cyan",
      tabCount: 4,
      tabIds: [327, 328, 329, 330],
      reason: "Built-in docs rule"
    },
    {
      id: 106,
      windowId: 3,
      name: "Articles to Read",
      color: "yellow",
      tabCount: 3,
      tabIds: [331, 332, 333],
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
      mockTab(301, 1, "Q3 planning doc", "docs.google.com", "/document/d/mock-planning", { groupId: 101, active: true }),
      mockTab(302, 1, "Product roadmap", "notion.so", "/workspace/roadmap", { groupId: 101 }),
      mockTab(303, 1, "MVP private beta checklist", "linear.app", "/acme/project/tabmosaic", { groupId: 101 }),
      mockTab(304, 1, "Pricing notes draft", "docs.google.com", "/document/d/mock-pricing", { groupId: 101, discarded: true }),
      mockTab(305, 1, "Customer interview notes", "coda.io", "/doc/interviews", { groupId: 101 }),
      mockTab(306, 1, "Office workflow research", "notion.so", "/workspace/research", { groupId: 101 }),
      mockTab(307, 1, "Launch checklist", "docs.google.com", "/spreadsheet/d/mock-launch", { groupId: 101 }),
      mockTab(308, 1, "Competitor positioning", "docs.google.com", "/document/d/mock-competitors", { groupId: 101 }),
      mockTab(309, 2, "PR #24 - Add sidebar control center", "github.com", "/tover0314-w/tabpilot/pull/24", { groupId: 102 }),
      mockTab(310, 2, "PR #26 - Privacy copy", "github.com", "/tover0314-w/tabpilot/pull/26", { groupId: 102 }),
      mockTab(311, 2, "PR #29 - Dashboard apply", "github.com", "/tover0314-w/tabpilot/pull/29", { groupId: 102 }),
      mockTab(312, 2, "GitHub Actions checks", "github.com", "/tover0314-w/tabpilot/actions", { groupId: 102, audible: true }),
      mockTab(313, 2, "Issue triage", "github.com", "/tover0314-w/tabpilot/issues", { groupId: 102 }),
      mockTab(314, 2, "Review comment thread", "github.com", "/tover0314-w/tabpilot/pull/31", { groupId: 102 }),
      mockTab(315, 2, "Release branch compare", "github.com", "/tover0314-w/tabpilot/compare", { groupId: 102 }),
      mockTab(316, 3, "Knowledge worker survey", "forms.gle", "/mock-survey", { groupId: 103 }),
      mockTab(317, 3, "Tab fatigue interview notes", "notion.so", "/workspace/interviews", { groupId: 103 }),
      mockTab(318, 3, "Chrome productivity reviews", "chromewebstore.google.com", "/detail/mock", { groupId: 103 }),
      mockTab(319, 3, "AI tab manager article", "example.com", "/article/ai-tabs", { groupId: 103 }),
      mockTab(320, 3, "Desk research board", "miro.com", "/app/board/mock", { groupId: 103 }),
      mockTab(321, 3, "Research synthesis", "docs.google.com", "/document/d/mock-synthesis", { groupId: 103 }),
      mockTab(322, 1, "TabMosaic dashboard design", "figma.com", "/file/mock", { groupId: 104 }),
      mockTab(323, 1, "Monochrome dashboard cards", "dribbble.com", "/shots/mock-cards", { groupId: 104 }),
      mockTab(324, 1, "Sidebar pattern reference", "mobbin.com", "/patterns/sidebar", { groupId: 104 }),
      mockTab(325, 1, "Command palette examples", "raycast.com", "/design", { groupId: 104 }),
      mockTab(326, 1, "Typography sample", "typewolf.com", "/site-of-the-day", { groupId: 104 }),
      mockTab(327, 2, "chrome.sidePanel API", "developer.chrome.com", "/docs/extensions/reference/api/sidePanel", { groupId: 105 }),
      mockTab(328, 2, "chrome.tabs API", "developer.chrome.com", "/docs/extensions/reference/api/tabs", { groupId: 105 }),
      mockTab(329, 2, "chrome.tabGroups API", "developer.chrome.com", "/docs/extensions/reference/api/tabGroups", { groupId: 105 }),
      mockTab(330, 2, "MV3 service worker lifecycle", "developer.chrome.com", "/docs/extensions/develop/concepts/service-workers", { groupId: 105 }),
      mockTab(331, 3, "How teams manage context switching", "example.com", "/blog/context-switching", { groupId: 106 }),
      mockTab(332, 3, "Browser extension growth notes", "example.com", "/article/extension-growth", { groupId: 106 }),
      mockTab(333, 3, "Tab overload and focus", "example.com", "/research/tab-overload", { groupId: 106, discarded: true })
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

function mockTab(id, windowId, title, hostname, path, overrides = {}) {
  return {
    id,
    windowId,
    title,
    hostname,
    path,
    urlScheme: "https",
    active: false,
    pinned: false,
    audible: false,
    discarded: false,
    protectedReasons: [],
    groupId: -1,
    ...overrides
  };
}

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
        name: "dashboard-mobile.png",
        path: "/dashboard.html",
        viewport: DASHBOARD_MOBILE_VIEWPORT,
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
          await page.locator('.dashboard-nav-item[data-page="settings"]').click();
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

  await page.waitForSelector("#dashboardMetrics .dashboard-result-summary", { timeout: 5000 });
  await page.waitForFunction(
    () => document.querySelector("#aiBaseUrlInput")?.value === "https://api.deepseek.com",
    null,
    { timeout: 5000 }
  );
}
