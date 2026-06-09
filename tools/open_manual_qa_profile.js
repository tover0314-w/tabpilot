const childProcess = require("child_process");
const fs = require("fs");
const { createRequire } = require("module");
const net = require("net");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");
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
      checklistUrl: "file://<run-dir>/manual-qa-checklist.html",
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
    const checklistPath = path.join(runDir, "manual-qa-checklist.html");
    const checklistUrl = pathToFileURL(checklistPath).href;

    fs.writeFileSync(
      checklistPath,
      renderChecklistHtml({
        profileDir,
        extensionDir,
        extensionId,
        sidepanelUrl,
        dashboardUrl
      })
    );

    await createTarget(port, checklistUrl);
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
      checklistUrl,
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
  console.log(`checklist=${details.checklistUrl}`);
  console.log(`sidepanel=${details.sidepanelUrl}`);
  console.log(`dashboard=${details.dashboardUrl}`);
  console.log("");
  console.log("Safety:");
  console.log("- Uses a disposable Chrome profile under artifacts/.");
  console.log("- Opens synthetic QA URLs only.");
  console.log("- Does not read your real Chrome profile, real browser tabs, or .env.local.");
  console.log("");
  console.log("Next:");
  console.log("1. Start with the opened Manual QA Checklist tab.");
  console.log("2. In the opened browser, click the TabMosaic AI toolbar icon if needed.");
  console.log("3. Close the QA browser when finished.");
  console.log(`4. Cleanup after closing: rm -rf ${JSON.stringify(path.dirname(details.profileDir))}`);

  if (IS_SELF_TEST) {
    console.log("");
    console.log("Self-test mode will close and clean up this profile automatically.");
  }
}

function renderChecklistHtml(details) {
  const sections = [
    {
      title: "First Run",
      items: [
        "Click the TabMosaic AI toolbar icon.",
        "Confirm the side panel opens.",
        "If privacy onboarding appears, click Start Organizing.",
        "Confirm the top Chrome tab bar shows real native tab groups."
      ]
    },
    {
      title: "Safety",
      items: [
        "Active, pinned, audible, internal, and incognito tabs are not closed.",
        "Exact/tracking duplicates close only when safe.",
        "Hash/query duplicate candidates stay in review.",
        "No page body is read before Summarize Current Tab."
      ]
    },
    {
      title: "Controls",
      items: [
        "Undo restores group state for still-open tabs.",
        "Restore Closed reopens safely closed duplicate tabs.",
        "Chat Refine previews before Apply and does not close tabs.",
        "Dashboard title/color Apply updates real Chrome native groups."
      ]
    },
    {
      title: "Privacy Outputs",
      items: [
        "Copy Diagnostic Snapshot excludes URLs, hostnames, tab titles, page text, rule patterns, group names, emails, bearer tokens, and API keys.",
        "Copy Feedback Template is local clipboard only and requires review before submitting.",
        "Clear AI Key removes only the local API key and keeps rules/results."
      ]
    }
  ];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TabMosaic Manual QA Checklist</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f7f7;
        --panel: #ffffff;
        --line: #d8d8d8;
        --text: #161616;
        --muted: #5f5f5f;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
      }
      main {
        max-width: 920px;
        margin: 0 auto;
        padding: 32px 20px 56px;
      }
      header, section {
        margin-bottom: 18px;
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
      }
      .eyebrow {
        margin: 0 0 6px;
        color: var(--muted);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.15;
      }
      h2 {
        margin: 0 0 12px;
        font-size: 16px;
      }
      p {
        margin: 8px 0 0;
        color: var(--muted);
        line-height: 1.5;
      }
      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 12px;
      }
      a {
        color: var(--text);
        font-weight: 650;
      }
      ul {
        display: grid;
        gap: 10px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      li {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        align-items: start;
        line-height: 1.45;
      }
      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        margin-top: 1px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
      }
      .meta {
        display: grid;
        gap: 6px;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 12px;
      }
      .warning {
        border-color: #111111;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="eyebrow">TabMosaic AI</p>
        <h1>Manual QA Checklist</h1>
        <p>This page belongs to a disposable QA profile. It uses synthetic tabs and does not read your real Chrome profile, real tabs, or .env.local.</p>
        <div class="meta">
          <span>Extension ID: <code>${escapeHtml(details.extensionId)}</code></span>
          <span>Profile: <code>${escapeHtml(details.profileDir)}</code></span>
          <span>Extension copy: <code>${escapeHtml(details.extensionDir)}</code></span>
        </div>
      </header>
      <section>
        <h2>Quick Links</h2>
        <div class="grid">
          <p><a href="${escapeAttribute(details.sidepanelUrl)}">Open Sidepanel Page</a></p>
          <p><a href="${escapeAttribute(details.dashboardUrl)}">Open Dashboard Page</a></p>
        </div>
      </section>
      ${sections.map(renderChecklistSection).join("")}
      <section class="warning">
        <h2>Do Not Treat This As Public Launch Approval</h2>
        <p>This disposable QA pass does not replace a final real-profile manual QA pass, Chrome Web Store confirmation gates, privacy policy confirmation, or pricing/domain decisions.</p>
      </section>
    </main>
  </body>
</html>
`;
}

function renderChecklistSection(section) {
  return `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        <ul>
          ${section.items.map((item) => `<li><input type="checkbox" /> <span>${escapeHtml(item)}</span></li>`).join("")}
        </ul>
      </section>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char];
  });
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
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
