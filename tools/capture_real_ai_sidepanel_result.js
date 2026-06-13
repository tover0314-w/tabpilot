const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const INPUT_PATH = path.join(ROOT_DIR, "artifacts", "real-ai-classification", "latest.json");
const OUT_PATH = path.join(ROOT_DIR, "artifacts", "real-ai-classification", "sidepanel-latest.png");
const SIDEPANEL_VIEWPORT = { width: 390, height: 860 };

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error("Missing real AI classification result. Run tools/deepseek_real_tabs_classification.js first.");
  }

  const fixture = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  const run = buildRunFromRealClassification(fixture);
  const { chromium } = resolvePlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: SIDEPANEL_VIEWPORT });
    await installChromeMock(page, run);
    await page.goto(`http://127.0.0.1:${server.address().port}/sidepanel.html`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".chat-thread-message.assistant.run-completed .markdown-message", { timeout: 5000 });
    await page.screenshot({ path: OUT_PATH, fullPage: false });
  } finally {
    await browser.close();
    server.close();
  }

  console.log("PASS real AI sidepanel screenshot captured");
  console.log(`screenshot=${path.relative(ROOT_DIR, OUT_PATH)}`);
}

function buildRunFromRealClassification(fixture) {
  const tabs = (Array.isArray(fixture.tabs) ? fixture.tabs : []).map((tab) => ({
    id: Number(tab.tabId),
    title: tab.title || "",
    hostname: tab.hostname || "",
    path: tab.path || "/",
    windowId: Number(tab.windowId || 1),
    groupId: -1,
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    audible: Boolean(tab.audible),
    discarded: Boolean(tab.discarded),
    protectedReasons: []
  }));
  const tabsById = new Map(tabs.map((tab) => [tab.id, tab]));
  const groups = (Array.isArray(fixture.result?.groups) ? fixture.result.groups : [])
    .map((group, index) => {
      const tabIds = (Array.isArray(group.tabIds) ? group.tabIds : [])
        .map((tabId) => Number(tabId))
        .filter((tabId) => tabsById.has(tabId));
      const groupId = 1000 + index;

      for (const tabId of tabIds) {
        tabsById.get(tabId).groupId = groupId;
      }

      return {
        id: groupId,
        windowId: tabsById.get(tabIds[0])?.windowId || 1,
        name: group.name || "AI Group",
        color: group.color || "grey",
        tabCount: tabIds.length,
        tabIds,
        reason: group.reason || "Classified by DeepSeek from real tab metadata."
      };
    })
    .filter((group) => group.tabIds.length);
  const organizedTabCount = groups.reduce((sum, group) => sum + group.tabIds.length, 0);

  return {
    id: `real-ai-${Date.now()}`,
    status: "completed",
    startedAt: fixture.generatedAt || new Date().toISOString(),
    completedAt: fixture.generatedAt || new Date().toISOString(),
    summary: {
      windowCount: new Set(tabs.map((tab) => tab.windowId)).size,
      tabCount: tabs.length,
      groupsCreated: groups.length,
      tabsMoved: organizedTabCount,
      safeDuplicatesClosed: 0,
      reviewDuplicateGroups: 0,
      undoAvailable: false,
      closedTabsRestoreAvailable: false,
      aiClassificationStatus: "applied",
      aiGroupsSuggested: groups.length,
      protectedCounts: {
        active: tabs.filter((tab) => tab.active).length,
        pinned: 0,
        audible: 0
      },
      topHosts: buildTopHosts(tabs)
    },
    groups,
    duplicateGroups: [],
    snapshot: {
      tabs
    }
  };
}

function buildTopHosts(tabs) {
  const counts = new Map();
  for (const tab of tabs) {
    if (!tab.hostname) continue;
    counts.set(tab.hostname, (counts.get(tab.hostname) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([hostname, count]) => ({ hostname, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

async function installChromeMock(page, run) {
  const messages = JSON.parse(fs.readFileSync(path.join(EXTENSION_DIR, "_locales", "en", "messages.json"), "utf8"));

  await page.addInitScript(
    ({ run, messages }) => {
      const storage = {
        "tabmosaic.currentRun": run,
        "tabmosaic.sidebarContext": {
          scope: "current_tab",
          title: run.snapshot.tabs.find((tab) => tab.active)?.title || run.snapshot.tabs[0]?.title || "Current tab",
          hostname: run.snapshot.tabs.find((tab) => tab.active)?.hostname || run.snapshot.tabs[0]?.hostname || "",
          source: "real-ai-sidepanel-screenshot",
          updatedAt: new Date().toISOString()
        },
        "tabmosaic.aiSettings": {
          enabled: true,
          provider: "deepseek",
          baseUrl: "https://api.deepseek.com",
          model: "deepseek-v4-flash",
          apiKey: "redacted"
        }
      };

      function clone(value) {
        return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
      }

      function pick(keys) {
        if (Array.isArray(keys)) return Object.fromEntries(keys.map((key) => [key, clone(storage[key])]));
        if (typeof keys === "string") return { [keys]: clone(storage[keys]) };
        if (keys && typeof keys === "object") {
          return Object.fromEntries(Object.keys(keys).map((key) => [key, clone(storage[key] === undefined ? keys[key] : storage[key])]));
        }
        return clone(storage);
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
          getUILanguage: () => "en-US",
          getMessage: message
        },
        runtime: {
          getManifest: () => ({
            version: "0.1.0",
            permissions: ["tabs", "tabGroups", "storage", "sidePanel", "scripting", "activeTab"],
            host_permissions: ["https://api.deepseek.com/*"]
          }),
          getURL: (extensionPath) => `/${extensionPath}`,
          onMessage: { addListener: () => {} },
          sendMessage: async (request) => {
            if (request?.type === "GET_CURRENT_RUN") return { ok: true, run: clone(run) };
            return { ok: true, run: clone(run) };
          }
        },
        storage: {
          onChanged: { addListener: () => {} },
          local: {
            get: async (keys) => pick(keys),
            set: async (value) => Object.assign(storage, clone(value)),
            remove: async (keys) => {
              for (const key of Array.isArray(keys) ? keys : [keys]) delete storage[key];
            }
          }
        },
        tabs: {
          create: async () => ({ id: 999 }),
          query: async () => run.snapshot.tabs.map((tab) => ({
            ...tab,
            url: tab.hostname ? `https://${tab.hostname}${tab.path || "/"}` : "",
            pendingUrl: ""
          })),
          onActivated: { addListener: () => {} },
          onUpdated: { addListener: () => {} },
          onRemoved: { addListener: () => {} },
          onMoved: { addListener: () => {} }
        },
        tabGroups: {
          query: async () => run.groups.map((group) => ({
            id: group.id,
            windowId: group.windowId,
            title: group.name,
            color: group.color
          })),
          onUpdated: { addListener: () => {} },
          onRemoved: { addListener: () => {} }
        },
        windows: {
          getAll: async () => Array.from(new Set(run.snapshot.tabs.map((tab) => tab.windowId))).map((id) => ({ id, type: "normal" }))
        },
        sidePanel: {
          open: async () => {}
        }
      };
    },
    { run, messages }
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

      response.writeHead(200, { "content-type": contentType(targetPath) });
      response.end(data);
    });
  });

  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function contentType(filePath) {
  const extension = path.extname(filePath);
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".js") return "text/javascript; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".json") return "application/json; charset=utf-8";
  return "application/octet-stream";
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

  throw new Error("Playwright is required for the sidepanel screenshot.");
}
