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
const SIDEPANEL_VIEWPORT = { width: 390, height: 860 };
const TEN_TURN_PAGE_QUESTIONS = [
  "What is this page for?",
  "What are the most important health signals?",
  "Should I change connection pooling right now?",
  "What is the risk if I rotate the database password?",
  "Is point-in-time recovery enabled?",
  "Which project and environment are we talking about?",
  "Before running the pending migration, what should I check?",
  "Could this page help me reduce connection errors?",
  "Summarize the action plan in priority order.",
  "Final decision: change settings now or prepare first?"
];

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
    favIconUrl: mockFaviconDataUrl(hostname),
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

function mockFaviconDataUrl(hostname) {
  const colors = ["#2f7469", "#4c6fff", "#a14c89", "#b4762a", "#5a6978", "#3f7f4d"];
  const cleanHost = String(hostname || "tab").replace(/^www\./, "");
  const label = (cleanHost.charAt(0) || "t").toUpperCase();
  const color = colors[Math.abs(hashString(cleanHost)) % colors.length];
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">',
    `<rect width="32" height="32" rx="7" fill="${color}"/>`,
    `<text x="16" y="21" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#fff">${label}</text>`,
    "</svg>"
  ].join("");

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
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
        name: "sidepanel-chat.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("What content does this page have?");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.user", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.summary", { timeout: 5000 });
          await page.locator("#chatInput").fill("What should I check before changing database settings?");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForFunction(
            () => document.querySelectorAll(".chat-thread-message.assistant.summary").length >= 2,
            null,
            { timeout: 5000 }
          );
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-context-tabs.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [301, 302, 303, 304, 305, 306, 307, 308],
          tabCount: 8,
          windowId: 1,
          title: "Selected planning tabs",
          groupName: "Product Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-11T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("What are these selected tabs about?");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.context-summary", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-web-search.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("search the web for browser work agent");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant .web-search-card", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-10-turn-chat.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          for (const question of TEN_TURN_PAGE_QUESTIONS) {
            await page.locator("#chatInput").fill(question);
            await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
            try {
              await page.waitForFunction(
                () => {
                  const input = document.querySelector("#chatInput");
                  const messages = Array.from(document.querySelectorAll(".chat-thread-message"));
                  const lastMessage = messages[messages.length - 1];

                  return Boolean(
                    input &&
                      !input.disabled &&
                      input.value === "" &&
                      lastMessage?.classList.contains("assistant") &&
                      lastMessage?.classList.contains("summary")
                  );
                },
                null,
                { timeout: 7000 }
              );
            } catch (error) {
              const diagnostic = await page.evaluate(() => {
                const messages = Array.from(document.querySelectorAll(".chat-thread-message"));
                const lastMessage = messages[messages.length - 1];
                const input = document.querySelector("#chatInput");

                return {
                  count: messages.length,
                  inputDisabled: Boolean(input?.disabled),
                  inputValue: input?.value || "",
                  lastClass: lastMessage?.className || "",
                  lastText: lastMessage?.textContent?.replace(/\s+/g, " ").trim().slice(0, 220) || ""
                };
              });
              throw new Error(
                `10-turn sidepanel screenshot timed out after question: ${question}\n${JSON.stringify(diagnostic)}`
              );
            }
          }
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "dashboard-overview.png",
        path: "/dashboard.html",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en"
      },
      {
        name: "dashboard-selected-tabs.png",
        path: "/dashboard.html",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          const checkboxes = page.locator('[data-window-id="1"] [data-tab-select]');
          await checkboxes.nth(0).check();
          await checkboxes.nth(1).check();
          await page.waitForSelector("#chatSelectedTabsButton:not([hidden])", { timeout: 5000 });
        }
      },
      {
        name: "dashboard-workbench.png",
        path: "/dashboard.html",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          const checkboxes = page.locator('[data-window-id="1"] [data-tab-select]');
          await checkboxes.nth(0).check();
          await checkboxes.nth(1).check();
          await page.locator("#createTodoFromSelectionButton").click();
          await page.waitForFunction(
            () => document.querySelectorAll("#dashboardAgentTasks .dashboard-agent-minirow").length >= 1,
            null,
            { timeout: 5000 }
          );
          await page.locator("#saveSelectionCollectionButton").click();
          await page.waitForFunction(
            () => document.querySelectorAll("#dashboardAgentCollections .dashboard-agent-minirow").length >= 1,
            null,
            { timeout: 5000 }
          );
        }
      },
      {
        name: "dashboard-mobile.png",
        path: "/dashboard.html",
        viewport: DASHBOARD_MOBILE_VIEWPORT,
        fullPage: false,
        language: "en"
      }
    ];

    for (const item of pages) {
      const page = await newMockedPage(browser, item.viewport, item.language, item);
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
  if (item.path === "/sidepanel.html") {
    await assertSidepanelLayoutNotClipped(page, item.name);
  }

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

async function assertSidepanelLayoutNotClipped(page, name) {
  const layout = await page.evaluate(() => {
    const rectFor = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        scrollLeft: element.scrollLeft,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth
      };
    };

    return {
      bodyScrollLeft: document.body.scrollLeft,
      documentScrollLeft: document.documentElement.scrollLeft,
      scrollingElementScrollLeft: document.scrollingElement?.scrollLeft || 0,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      shell: rectFor(".tab-agent-shell"),
      thread: rectFor(".agent-thread"),
      firstMessage: rectFor(".chat-thread-message"),
      composer: rectFor(".agent-composer")
    };
  });

  const horizontalDrift =
    layout.bodyScrollLeft !== 0 ||
    layout.documentScrollLeft !== 0 ||
    layout.scrollingElementScrollLeft !== 0 ||
    layout.shell?.scrollLeft !== 0 ||
    layout.thread?.left < 0 ||
    layout.firstMessage?.left < 0 ||
    layout.composer?.right > layout.bodyClientWidth + 1;

  if (horizontalDrift) {
    throw new Error(`${name} sidepanel layout is horizontally clipped:\n${JSON.stringify(layout, null, 2)}`);
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

async function newMockedPage(browser, viewport, language, options = {}) {
  const page = await browser.newPage({ viewport });
  const messages = readMessages(language);
  const storage = {
    "tabmosaic.currentRun": MOCK_RUN,
    "tabmosaic.sidebarContext": options.sidebarContext || {
      scope: "current_tab",
      tabId: 901,
      windowId: 1,
      title: "Settings | Database | ai-music | Supabase",
      hostname: "supabase.com",
      source: "browser",
      updatedAt: "2026-06-11T00:00:00.000Z"
    },
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

      function toChromeTab(tab) {
        return {
          ...tab,
          url: tab.hostname ? `https://${tab.hostname}${tab.path || "/"}` : "",
          pendingUrl: ""
        };
      }

      function buildMockCurrentPageSummary(question) {
        const normalized = String(question || "").toLowerCase();
        const answers = [
          {
            match: /what is this page|what content|content does this page|content.*page|\bfor\?*$/,
            text: "This page is the Database settings area for your Supabase ai-music project. It covers connection details, database configuration, backups, pooling, and production-level database controls."
          },
          {
            match: /check before changing|changing database|database settings/,
            text: "Before changing database settings, confirm a recent backup, review pooling and connection limits, and avoid rotating credentials until you know which services use them."
          },
          {
            match: /health signals|important/,
            text: "The main signals are active connections, storage usage, backup status, pooling mode, pending migrations, and whether recovery options are enabled."
          },
          {
            match: /pooling/,
            text: "Do not change pooling immediately. First check whether production services still use direct connections and whether prepared statements are compatible with transaction pooling."
          },
          {
            match: /password|rotate/,
            text: "Password rotation can break production if app secrets are not updated first. Treat it as a coordinated release task, not a casual settings change."
          },
          {
            match: /point-in-time|pitr|recovery/,
            text: "Point-in-time recovery appears to be off, so recent daily backups become more important before risky database changes."
          },
          {
            match: /project|environment/,
            text: "The context is the ai-music production project in Supabase, so the safer default is to prepare and test before changing settings."
          },
          {
            match: /migration/,
            text: "Before the pending migration, confirm a recent backup, test in staging, and check whether the tracks table impact is acceptable for production traffic."
          },
          {
            match: /connection errors/,
            text: "Yes. This page can help diagnose connection errors by showing pooling configuration, direct connection pressure, and connection limits."
          },
          {
            match: /action plan|priority/,
            text: "Priority plan: confirm backups, review direct connections, test pooling and migrations in staging, then coordinate password or production setting changes."
          },
          {
            match: /final decision|change settings|prepare first/,
            text: "Prepare first. The page shows enough production risk that you should verify backups, staging migration behavior, pooling compatibility, and app secrets before changing settings."
          }
        ];
        const match = answers.find((item) => item.match.test(normalized));

        return match?.text || "This page is the Database settings area for your Supabase ai-music project, covering connection details, backups, pooling, migrations, and production database controls.";
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

            if (request?.type === "CHECK_SUMMARY_PRIVACY") {
              return {
                ok: true,
                result: {
                  tabId: 901,
                  title: "Settings | Database | ai-music | Supabase",
                  hostname: "supabase.com",
                  requiresConfirmation: false,
                  reason: ""
                }
              };
            }

            if (request?.type === "SUMMARIZE_CURRENT_TAB") {
              const question = String(request.question || "");
              const answer = buildMockCurrentPageSummary(question);

              return {
                ok: true,
                summary: {
                  status: "completed",
                  title: "Settings | Database | ai-music | Supabase",
                  hostname: "supabase.com",
                  question: question || "What content does this page have?",
                  summary: answer,
                  keyPoints: [
                    "Confirm backups or recovery options first.",
                    "Review pooling and connection limits before traffic changes.",
                    "Avoid rotating credentials until you know which services use them."
                  ],
                  suggestedGroup: "Backend Setup",
                  suggestedAction: "keep",
                  confidence: 0.82,
                  extractedChars: 1840,
                  provider: "deepseek",
                  aiUsed: true,
                  privacy: {
                    sentTabMetadata: true,
                    sentPageText: true,
                    sentFullUrls: false,
                    storedCloud: false
                  }
                }
              };
            }

            if (request?.type === "SUMMARIZE_CONTEXT_TABS") {
              return {
                ok: true,
                summary: {
                  status: "completed",
                  provider: "deepseek",
                  aiUsed: true,
                  question: request.question || "What are these selected tabs about?",
                  answer: "These selected tabs are mostly about private beta planning: roadmap decisions, launch checklist work, pricing notes, customer research, and competitor positioning. I read the safe visible pages I could, skipped two that exceeded the beta cap, and did not store the extracted text.",
                  summary: "These selected tabs are mostly about private beta planning: roadmap decisions, launch checklist work, pricing notes, customer research, and competitor positioning. I read the safe visible pages I could, skipped two that exceeded the beta cap, and did not store the extracted text.",
                  keyPoints: [
                    "The strongest theme is planning the private beta launch.",
                    "Several pages support product decisions: roadmap, pricing, customer research, and competitor positioning.",
                    "The group should stay task-based rather than split by website."
                  ],
                  tabSummaries: [
                    {
                      tabId: 301,
                      title: "Q3 planning doc",
                      summary: "Roadmap and priority planning for the next beta slice.",
                      suggestedAction: "keep"
                    },
                    {
                      tabId: 303,
                      title: "MVP private beta checklist",
                      summary: "Launch readiness tasks and QA checkpoints.",
                      suggestedAction: "review"
                    },
                    {
                      tabId: 306,
                      title: "Office workflow research",
                      summary: "Research notes about how office workers deal with tab overload.",
                      suggestedAction: "keep"
                    }
                  ],
                  recommendations: [
                    "Keep these together as Product Planning, then split only if pricing or research grows into separate work."
                  ],
                  toolCard: {
                    toolName: "read_selected_tabs_pages",
                    label: "Read selected tabs",
                    scope: {
                      type: "selected_tabs",
                      requestedTabCount: 8,
                      readTabCount: 6,
                      skippedTabCount: 2,
                      maxTabs: 6
                    },
                    dataUsed: ["visible_text", "title", "hostname", "headings"],
                    storage: "session_only",
                    status: "partial",
                    skippedReasons: ["over_cap"]
                  },
                  skippedTabs: [
                    {
                      tabId: 307,
                      title: "Launch checklist",
                      hostname: "docs.google.com",
                      reason: "over_cap"
                    },
                    {
                      tabId: 308,
                      title: "Competitor positioning",
                      hostname: "docs.google.com",
                      reason: "over_cap"
                    }
                  ],
                  privacy: {
                    sentTabMetadata: true,
                    sentPageText: true,
                    sentFullUrls: false,
                    storedCloud: false
                  }
                }
              };
            }

            if (request?.type === "RUN_AGENT_WEB_SEARCH") {
              return {
                ok: true,
                result: {
                  status: "completed",
                  provider: "tavily",
                  providerLabel: "Tavily",
                  query: request.query || "browser work agent",
                  answer: "A browser work agent combines page context, open tabs, web search, todos, and safe browser actions so the browser can help finish knowledge-work tasks instead of only displaying pages.",
                  resultCount: 3,
                  searchedAt: "2026-06-13T00:00:00.000Z",
                  results: [
                    {
                      title: "Browser work agents: context, tools, and safe actions",
                      url: "https://example.com/browser-work-agent",
                      hostname: "example.com",
                      snippet: "A practical overview of browser agents that use page context, search results, and user-approved actions.",
                      score: 0.94
                    },
                    {
                      title: "Designing AI browser extensions for knowledge work",
                      url: "https://example.org/ai-browser-extension",
                      hostname: "example.org",
                      snippet: "Patterns for sidebars, tab context, privacy boundaries, and action confirmation in browser extensions.",
                      score: 0.88
                    },
                    {
                      title: "From tab manager to browser workbench",
                      url: "https://research.example.net/browser-workbench",
                      hostname: "research.example.net",
                      snippet: "Why tasks, collections, and summaries can make tab organization useful after the initial cleanup.",
                      score: 0.82
                    }
                  ],
                  privacy: {
                    sentQuery: true,
                    sentTabData: false,
                    sentPageText: false,
                    sentFullUrls: false,
                    storage: "session_only_until_saved"
                  }
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
          onChanged: {
            addListener: () => {}
          },
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
          create: async () => ({ id: 999 }),
          query: async (queryInfo = {}) => {
            const tabs = storage["tabmosaic.currentRun"]?.snapshot?.tabs || [];
            const matches = queryInfo.active
              ? tabs.filter((tab) => tab.active)
              : tabs;
            return matches.map(toChromeTab);
          },
          onActivated: {
            addListener: () => {}
          },
          onUpdated: {
            addListener: () => {}
          }
        },
        sidePanel: {
          open: async () => {}
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
    await page.waitForSelector(".chat-thread-message.assistant.run-completed .run-message-card", { timeout: 5000 });
    return;
  }

  await page.waitForSelector("#dashboardGroups .dashboard-group-card", { timeout: 5000 });
  await page.waitForFunction(
    () => document.querySelector("#aiBaseUrlInput")?.value === "https://api.deepseek.com",
    null,
    { timeout: 5000 }
  );
}
