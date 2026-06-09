const childProcess = require("child_process");
const fs = require("fs");
const { createRequire } = require("module");
const net = require("net");
const os = require("os");
const path = require("path");
const { urls } = require("./qa_seed_tabs");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const ARTIFACT_DIR = path.join(ROOT_DIR, "artifacts", "manual-qa-profiles");
const IS_DRY_RUN = process.argv.includes("--dry-run");
const IS_SELF_TEST = process.argv.includes("--self-test");

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
    throw new SkipError(
      "Google Chrome may ignore CLI unpacked extension loading; use Chrome for Testing/Chromium or set CHROME_PATH"
    );
  }

  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(ARTIFACT_DIR, runId);
  const profileDir = path.join(runDir, "profile");
  const extensionDir = path.join(runDir, "extension");
  const port = await findFreePort();

  if (IS_DRY_RUN) {
    printPlan({
      chromePath,
      port,
      profileDir,
      extensionDir,
      extensionId: "<dry-run>",
      sidepanelUrl: "chrome-extension://<extension-id>/sidepanel.html",
      dashboardUrl: "chrome-extension://<extension-id>/dashboard.html",
      dryRun: true
    });
    return;
  }

  fs.mkdirSync(runDir, { recursive: true });
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
      "about:blank"
    ],
    {
      detached: !IS_SELF_TEST,
      stdio: ["ignore", "ignore", "pipe"]
    }
  );

  if (!IS_SELF_TEST) {
    chrome.unref();
  }

  let chromeLog = "";
  chrome.stderr.on("data", (chunk) => {
    chromeLog += chunk.toString();
  });

  try {
    await waitForChrome(port);
    const extensionId = await waitForExtensionId(port, () => chromeLog);
    const sidepanelUrl = `chrome-extension://${extensionId}/sidepanel.html`;
    const dashboardUrl = `chrome-extension://${extensionId}/dashboard.html`;

    for (const url of urls) {
      await createTarget(port, url);
    }

    await createTarget(port, sidepanelUrl);
    await createTarget(port, dashboardUrl);

    printPlan({
      chromePath,
      port,
      profileDir,
      extensionDir,
      extensionId,
      sidepanelUrl,
      dashboardUrl,
      dryRun: false
    });

    if (IS_SELF_TEST) {
      chrome.kill();
      await delay(500);
      fs.rmSync(runDir, { recursive: true, force: true });
      console.log("PASS self-test closed and cleaned up disposable QA profile");
    }
  } catch (error) {
    if (chromeLog) {
      console.error("Chrome log:");
      console.error(chromeLog.trim());
    }

    try {
      process.kill(-chrome.pid);
    } catch {
      chrome.kill();
    }

    throw error;
  }
}

function printPlan(details) {
  console.log(details.dryRun ? "DRY RUN manual QA profile plan" : "PASS manual QA profile opened");
  console.log(`chromePath=${details.chromePath}`);
  console.log(`profileDir=${details.profileDir}`);
  console.log(`extensionDir=${details.extensionDir}`);
  console.log(`remoteDebuggingPort=${details.port}`);
  console.log(`extensionId=${details.extensionId}`);
  console.log(`seedTabs=${urls.length}`);
  console.log(`sidepanel=${details.sidepanelUrl}`);
  console.log(`dashboard=${details.dashboardUrl}`);
  console.log("");
  console.log("Safety:");
  console.log("- Uses a disposable Chrome profile under artifacts/.");
  console.log("- Opens synthetic QA URLs only.");
  console.log("- Does not read your real Chrome profile, real browser tabs, or .env.local.");
  console.log("");
  console.log("Next:");
  console.log("1. In the opened browser, click the TabMosaic AI toolbar icon if needed.");
  console.log("2. Follow 05_PROJECT/06_QA_RUNBOOK.md.");
  console.log("3. Close the QA browser when finished.");
  console.log(`4. Cleanup after closing: rm -rf ${JSON.stringify(path.dirname(details.profileDir))}`);

  if (IS_SELF_TEST) {
    console.log("");
    console.log("Self-test mode will close and clean up this profile automatically.");
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

  throw new Error("Could not find Chrome. Set CHROME_PATH to Chrome for Testing or Chromium.");
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
  return chromePath.includes("/Google Chrome.app/") && !chromePath.includes("Google Chrome for Testing");
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
      throw new SkipError("Google Chrome ignored --load-extension; use Chrome for Testing/Chromium for manual QA sandbox");
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
