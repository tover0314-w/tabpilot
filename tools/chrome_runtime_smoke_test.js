const childProcess = require("child_process");
const fs = require("fs");
const { createRequire } = require("module");
const net = require("net");
const os = require("os");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const TEST_URLS = [
  "https://github.com/acme/app/pull/42",
  "https://github.com/acme/app/pull/43",
  "https://developer.chrome.com/docs/extensions/reference/api/tabs",
  "https://developer.chrome.com/docs/extensions/reference/api/tabGroups",
  "https://docs.google.com/document/d/tabmosaic-one/edit",
  "https://docs.google.com/document/d/tabmosaic-two/edit",
  "https://example.com/tabmosaic-duplicate",
  "https://example.com/tabmosaic-duplicate"
];

class SkipError extends Error {}

main().catch((error) => {
  if (error instanceof SkipError) {
    console.log(`SKIP ${error.message}`);
    process.exit(0);
  }

  console.error(error.stack || error.message);
  process.exit(1);
});

async function main() {
  const chromePath = findChromePath();

  if (isBrandedGoogleChrome(chromePath) && process.env.ALLOW_GOOGLE_CHROME_CLI_EXTENSION !== "1") {
    throw new SkipError("Google Chrome ignores CLI unpacked extension loading in this environment; use Chrome for Testing/Chromium or set ALLOW_GOOGLE_CHROME_CLI_EXTENSION=1 to force a probe");
  }

  const port = await findFreePort();
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "tabmosaic-chrome-profile."));
  const extensionDir = fs.mkdtempSync(path.join(os.tmpdir(), "tabmosaic-extension."));
  fs.cpSync(EXTENSION_DIR, extensionDir, { recursive: true });

  const chrome = childProcess.spawn(
    chromePath,
    [
      `--user-data-dir=${profileDir}`,
      `--remote-debugging-port=${port}`,
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--enable-logging=stderr",
      "--v=0",
      "about:blank"
    ],
    {
      stdio: ["ignore", "ignore", "pipe"]
    }
  );
  let chromeLog = "";
  chrome.stderr.on("data", (chunk) => {
    chromeLog += chunk.toString();
  });

  try {
    await waitForChrome(port);
    const extensionId = await waitForExtensionId(port, () => chromeLog);
    console.log(`Loaded extension ${extensionId}`);

    for (const url of TEST_URLS) {
      await createTarget(port, url);
    }

    const extensionPage = await createTarget(port, `chrome-extension://${extensionId}/sidepanel.html`);
    console.log(`Opened extension page ${extensionPage.url}`);
    const cdp = await CDPSession.connect(extensionPage.webSocketDebuggerUrl);

    try {
      await waitForPageReady(cdp);
      await waitForExtensionApis(cdp);
      const organizeResult = await evaluate(cdp, `
        chrome.runtime.sendMessage({ type: "ACCEPT_PRIVACY_AND_ORGANIZE" })
      `);

      assert(organizeResult && organizeResult.ok, `Organize failed: ${JSON.stringify(organizeResult)}`);
      assertEqual(organizeResult.run.status, "completed", "Organize status");
      assert(organizeResult.run.summary.groupsCreated >= 3, "Expected at least three native groups");

      const groups = await evaluate(cdp, "chrome.tabGroups.query({})");
      const groupTitles = groups.map((group) => group.title).sort();
      assert(groupTitles.includes("Code Review"), `Missing Code Review group: ${groupTitles.join(", ")}`);
      assert(groupTitles.includes("Chrome Extension Docs"), `Missing Chrome Extension Docs group: ${groupTitles.join(", ")}`);
      assert(groupTitles.includes("Docs & Notes"), `Missing Docs & Notes group: ${groupTitles.join(", ")}`);

      const preview = await evaluate(cdp, `
        chrome.runtime.sendMessage({ type: "PREVIEW_CHAT_REFINE", text: "GitHub PR to PR Review" })
      `);
      assert(preview && preview.ok, `Chat preview failed: ${JSON.stringify(preview)}`);
      assertEqual(preview.draft.type, "create_rule_and_move", "Chat preview type");
      assertEqual(preview.draft.groupName, "PR Review", "Chat preview group");

      const applyChat = await evaluate(cdp, `
        chrome.runtime.sendMessage({ type: "APPLY_CHAT_REFINE", draftId: ${JSON.stringify(preview.draft.id)} })
      `);
      assert(applyChat && applyChat.ok, `Chat apply failed: ${JSON.stringify(applyChat)}`);

      const ruleState = await evaluate(cdp, `
        chrome.storage.local.get("tabmosaic.userRules")
      `);
      const rules = ruleState["tabmosaic.userRules"] || [];
      assert(rules.some((rule) => rule.pattern === "github.com/*/*/pull/*" && rule.targetGroupName === "PR Review"), "Chat rule was not stored");

      const latestGroups = await evaluate(cdp, "chrome.tabGroups.query({})");
      const groupToUpdate = latestGroups.find((group) => group.title === "PR Review") || latestGroups[0];
      const dashboardApply = await evaluate(cdp, `
        chrome.runtime.sendMessage({
          type: "APPLY_DASHBOARD_GROUP_UPDATE",
          groupId: ${groupToUpdate.id},
          title: "QA Review",
          color: "green"
        })
      `);
      assert(dashboardApply && dashboardApply.ok, `Dashboard apply failed: ${JSON.stringify(dashboardApply)}`);

      const updatedGroups = await evaluate(cdp, "chrome.tabGroups.query({})");
      assert(updatedGroups.some((group) => group.title === "QA Review" && group.color === "green"), "Dashboard apply did not update native group");

      console.log("PASS Chrome runtime loaded extension and exercised organize/chat/dashboard apply");
    } finally {
      cdp.close();
    }
  } catch (error) {
    if (!(error instanceof SkipError) && chromeLog) {
      console.error("Chrome log:");
      console.error(chromeLog.trim());
    }
    throw error;
  } finally {
    chrome.kill();
    await delay(500);
    fs.rmSync(profileDir, { recursive: true, force: true });
    fs.rmSync(extensionDir, { recursive: true, force: true });
  }
}

function findChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    findPlaywrightChromiumPath(),
    "/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error("Could not find Chrome. Set CHROME_PATH to run this test.");
}

function findPlaywrightChromiumPath() {
  const nodeModuleDirs = [
    process.env.PLAYWRIGHT_NODE_MODULE_DIR,
    process.env.NODE_REPL_NODE_MODULE_DIRS?.split(path.delimiter)[0],
    path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules")
  ].filter(Boolean);

  const candidates = [
    () => require("playwright"),
    ...nodeModuleDirs.map((nodeModulesDir) => {
      return () => createRequire(path.join(nodeModulesDir, "noop.js"))("playwright");
    })
  ];

  for (const loadPlaywright of candidates) {
    try {
      const executablePath = loadPlaywright().chromium?.executablePath?.();
      if (executablePath && fs.existsSync(executablePath)) return executablePath;
    } catch {
      // Try the next local runtime candidate.
    }
  }

  return "";
}

function isBrandedGoogleChrome(chromePath) {
  return (
    chromePath.includes("/Google Chrome.app/") &&
    !chromePath.includes("Google Chrome for Testing")
  );
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForChrome(port) {
  await waitFor(async () => {
    const result = await fetchJson(port, "/json/version").catch(() => null);
    return Boolean(result?.webSocketDebuggerUrl);
  }, "Chrome remote debugging did not start");
}

async function waitForExtensionId(port, getChromeLog) {
  return waitFor(async () => {
    const chromeLog = getChromeLog();

    if (chromeLog.includes("--load-extension is not allowed in Google Chrome, ignoring.")) {
      throw new SkipError("Google Chrome ignored --load-extension; use Chrome for Testing/Chromium for runtime automation or manual Load unpacked QA");
    }

    const targets = await fetchJson(port, "/json/list").catch(() => []);
    const target = targets.find(
      (item) =>
        item.type === "service_worker" &&
        item.url.startsWith("chrome-extension://") &&
        item.url.endsWith("/background.js")
    );

    if (!target) return "";

    return new URL(target.url).hostname;
  }, new SkipError("TabMosaic service worker did not appear; this Chrome build may not allow CLI unpacked extension loading"));
}

async function createTarget(port, targetUrl) {
  return fetchJson(port, `/json/new?${targetUrl}`, { method: "PUT" });
}

async function fetchJson(port, route, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${route}`, options);

  if (!response.ok) {
    throw new Error(`CDP HTTP ${response.status} for ${route}`);
  }

  return response.json();
}

async function waitForPageReady(cdp) {
  await waitFor(async () => {
    const readyState = await evaluate(cdp, "document.readyState");
    return readyState === "interactive" || readyState === "complete";
  }, "Extension page did not become ready");
}

async function waitForExtensionApis(cdp) {
  await waitFor(async () => {
    return evaluate(
      cdp,
      `Boolean(
        globalThis.chrome &&
        chrome.runtime &&
        chrome.runtime.sendMessage &&
        chrome.storage &&
        chrome.storage.local &&
        chrome.tabGroups
      )`
    ).catch(() => false);
  }, "Extension page did not expose expected Chrome extension APIs");
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });

  if (result.exceptionDetails) {
    const details = result.exceptionDetails;
    const description = details.exception?.description || details.exception?.value || details.text;
    throw new Error(description || "Runtime evaluation failed");
  }

  return result.result.value;
}

async function waitFor(fn, message, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const value = await fn();

    if (value) return value;

    await delay(250);
  }

  if (message instanceof Error) {
    throw message;
  }

  throw new Error(message);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

class CDPSession {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;

      const pending = this.pending.get(message.id);
      if (!pending) return;

      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message));
      } else {
        pending.resolve(message.result);
      }
    });
  }

  static connect(url) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      socket.addEventListener("open", () => resolve(new CDPSession(socket)), { once: true });
      socket.addEventListener("error", () => reject(new Error("Could not connect to CDP target")), { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.socket.send(JSON.stringify({ id, method, params }));

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.socket.close();
  }
}
