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
const REAL_PROFILE_QA_TEMPLATE_PATH = path.join(ROOT_DIR, "05_PROJECT", "12_REAL_PROFILE_QA_RESULT_TEMPLATE.md");
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
  const realProfileQaTemplate = fs.readFileSync(REAL_PROFILE_QA_TEMPLATE_PATH, "utf8");
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
      realProfileQaTemplatePath: REAL_PROFILE_QA_TEMPLATE_PATH,
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
        dashboardUrl,
        realProfileQaTemplate
      })
    );

    await createTarget(port, checklistUrl);
    for (const url of urls) {
      await createTarget(port, url);
    }

    await createTarget(port, sidepanelUrl);
    await createTarget(port, dashboardUrl);

    if (IS_SELF_TEST) {
      const targets = await fetchJson(port, "/json/list").catch(() => []);
      assertTargetOpened(targets, checklistUrl, "Manual QA checklist");
      assertTargetOpened(targets, sidepanelUrl, "sidepanel page");
      assertTargetOpened(targets, dashboardUrl, "dashboard page");
      assertChecklistHtml(checklistPath);
    }

    printPlan({
      chromePath,
      port,
      profileDir,
      extensionDir,
      extensionId,
      checklistUrl,
      sidepanelUrl,
      dashboardUrl,
      realProfileQaTemplatePath: REAL_PROFILE_QA_TEMPLATE_PATH,
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
  console.log(`realProfileQaTemplate=${details.realProfileQaTemplatePath}`);
  console.log("");
  console.log("Safety:");
  console.log("- Uses a disposable Chrome profile under artifacts/.");
  console.log("- Opens synthetic QA URLs only.");
  console.log("- Does not read your real Chrome profile, real browser tabs, or .env.local.");
  console.log("");
  console.log("Next:");
  console.log("1. Start with the opened Manual QA Checklist tab.");
  console.log("2. In the opened browser, click the TabMosaic AI toolbar icon if needed.");
  console.log("3. Copy the QA result from the checklist before sharing feedback.");
  console.log("4. Close the QA browser when finished.");
  console.log(`5. Cleanup after closing: rm -rf ${JSON.stringify(path.dirname(details.profileDir))}`);

  if (IS_SELF_TEST) {
    console.log("");
    console.log("Self-test mode will close and clean up this profile automatically.");
  }
}

function renderChecklistHtml(details) {
  const realProfileQaTemplateJson = serializeForScript(details.realProfileQaTemplate);
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
        "No page body is read before Summarize Current Tab.",
        "The synthetic billing-dashboard tab asks for confirmation before visible text is read."
      ]
    },
    {
      title: "Tab Agent Chat UI",
      items: [
        "Sidebar stays chat-first and does not show a dashboard-like result panel.",
        "Latest organize result appears as one assistant message bubble with impact metrics and quick actions inside it.",
        "The bottom composer remains visible and works like a normal chat input.",
        "Typed user messages and Agent replies stay in the same short conversation thread.",
        "Asking how much memory was saved returns an honest optimization answer without invented exact MB."
      ]
    },
    {
      title: "AI Verification",
      items: [
        "If testing AI, use only a disposable DeepSeek key in this disposable profile.",
        "Test AI Connection calls /models and does not send tab data.",
        "A non-DeepSeek base URL is rejected before any network request.",
        "After AI organize, Sidebar Tab Agent completion message lightly mentions DeepSeek help or local fallback.",
        "Ask the Sidebar Agent an open tab-management question and confirm the reply is a normal assistant message.",
        "Ask the Sidebar Agent to move Chrome extension docs tabs into Extension Planning, confirm a move draft appears, then click Apply.",
        "The AI move draft updates real Chrome native tab groups only after Apply and does not close tabs.",
        "Dashboard folded settings/details still expose fuller AI status when opened.",
        "AI classification falls back to local rules if the API fails."
      ]
    },
    {
      title: "Dashboard",
      items: [
        "Dashboard opens directly to Smart Groups without Latest Result, timestamp, or Current Workspace clutter.",
        "Duplicate Center stays folded until opened.",
        "Duplicate Center rows expand to show duplicate tabs and Open tab focuses an existing tab.",
        "Dashboard Undo and Restore Closed are compact and enabled only when available.",
        "Smart Groups filters switch between All, AI groups, and Rule groups.",
        "Clicking a tab title focuses the existing browser tab/window.",
        "Same-window Move sends a tab into an existing native group and does not close tabs.",
        "Dragging a tab row into another same-window group updates the native Chrome group.",
        "Group title/color Apply updates real Chrome native groups."
      ]
    },
    {
      title: "Error States",
      items: [
        "If organize fails, Sidebar says no tabs were moved or closed.",
        "If Dashboard shows an organize error, the compact error card says no tabs were moved or closed.",
        "Error states point to retrying or copying redacted diagnostics instead of asking for private browsing data."
      ]
    },
    {
      title: "Controls",
      items: [
        "Undo restores group state for still-open tabs.",
        "Restore Closed reopens safely closed duplicate tabs.",
        "Chat Refine previews before Apply and does not close tabs.",
        "Dashboard tab actions never close tabs."
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
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
      }
      button {
        min-height: 36px;
        padding: 0 12px;
        border: 1px solid var(--text);
        border-radius: 7px;
        background: var(--text);
        color: #ffffff;
        cursor: pointer;
        font: inherit;
      }
      button.secondary {
        background: var(--panel);
        color: var(--text);
      }
      .notes-label {
        display: block;
        margin-top: 14px;
        color: var(--muted);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
      }
      textarea {
        width: 100%;
        min-height: 160px;
        margin-top: 12px;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: 7px;
        color: var(--text);
        font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      textarea[data-qa-notes] {
        min-height: 110px;
        background: #fbfbfb;
      }
      .status {
        margin-top: 10px;
        font-size: 12px;
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
        <div class="toolbar">
          <button type="button" data-copy-report>Copy QA Result</button>
          <button class="secondary" type="button" data-copy-real-profile-template>Copy Real-Profile Template</button>
          <button class="secondary" type="button" data-reset-checklist>Reset Checks</button>
        </div>
        <p class="status" data-status>Checklist state is saved in this disposable profile only.</p>
        <label class="notes-label" for="qaNotes">Local QA Notes</label>
        <textarea id="qaNotes" data-qa-notes aria-label="Local QA notes" placeholder="Issues, observations, and decision gates triggered. Do not paste secrets or real browsing data."></textarea>
        <textarea data-report readonly aria-label="QA result markdown"></textarea>
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
        <h2>Real Profile QA Template</h2>
        <p>After this disposable QA profile passes, use the blank redaction-safe template for a non-critical real Chrome profile test. Keep completed real-profile notes private unless they are manually redacted.</p>
      </section>
      <section class="warning">
        <h2>Do Not Treat This As Public Launch Approval</h2>
        <p>This disposable QA pass does not replace a final real-profile manual QA pass, Chrome Web Store confirmation gates, privacy policy confirmation, or pricing/domain decisions.</p>
      </section>
    </main>
    <script>
      const storageKey = "tabmosaic.manualQaChecklist.v1";
      const notesStorageKey = storageKey + ".notes";
      const realProfileTemplate = ${realProfileQaTemplateJson};
      const checkboxes = Array.from(document.querySelectorAll("input[type='checkbox']"));
      const notes = document.querySelector("[data-qa-notes]");
      const report = document.querySelector("[data-report]");
      const status = document.querySelector("[data-status]");
      const saved = loadSavedState();

      notes.value = localStorage.getItem(notesStorageKey) || "";
      notes.addEventListener("input", () => {
        localStorage.setItem(notesStorageKey, notes.value);
        renderReport();
      });

      checkboxes.forEach((checkbox) => {
        checkbox.checked = Boolean(saved[checkbox.dataset.checkId]);
        checkbox.addEventListener("change", () => {
          const next = {};
          checkboxes.forEach((item) => {
            next[item.dataset.checkId] = item.checked;
          });
          localStorage.setItem(storageKey, JSON.stringify(next));
          renderReport();
        });
      });

      document.querySelector("[data-reset-checklist]").addEventListener("click", () => {
        checkboxes.forEach((checkbox) => {
          checkbox.checked = false;
        });
        localStorage.removeItem(storageKey);
        localStorage.removeItem(notesStorageKey);
        notes.value = "";
        renderReport("Checklist reset.");
      });

      document.querySelector("[data-copy-report]").addEventListener("click", async () => {
        renderReport();
        try {
          await navigator.clipboard.writeText(report.value);
          status.textContent = "QA result copied. Review it before sharing.";
        } catch {
          report.focus();
          report.select();
          const copied = document.execCommand("copy");
          status.textContent = copied
            ? "QA result copied. Review it before sharing."
            : "Clipboard blocked. Select and copy the report manually.";
        }
      });

      document.querySelector("[data-copy-real-profile-template]").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(realProfileTemplate);
          status.textContent = "Blank real-profile QA template copied. Keep completed results private or redacted.";
        } catch {
          report.value = realProfileTemplate;
          report.focus();
          report.select();
          const copied = document.execCommand("copy");
          status.textContent = copied
            ? "Blank real-profile QA template copied. Keep completed results private or redacted."
            : "Clipboard blocked. Select and copy the template manually.";
        }
      });

      function loadSavedState() {
        try {
          return JSON.parse(localStorage.getItem(storageKey) || "{}");
        } catch {
          return {};
        }
      }

      function renderReport(message) {
        const lines = [
          "# TabMosaic Manual QA Result",
          "",
          "- Date: " + new Date().toISOString(),
          "- Extension ID: ${escapeJs(details.extensionId)}",
          "- Profile: ${escapeJs(details.profileDir)}",
          "- Synthetic tabs: ${urls.length}",
          "",
          "## Checklist"
        ];

        document.querySelectorAll("section").forEach((section) => {
          const title = section.querySelector("h2")?.textContent || "";
          const items = Array.from(section.querySelectorAll("li"));
          if (!items.length) return;

          lines.push("", "### " + title);
          items.forEach((item) => {
            const checked = item.querySelector("input")?.checked ? "x" : " ";
            const text = item.querySelector("label")?.textContent || "";
            lines.push("- [" + checked + "] " + text);
          });
        });

        lines.push(
          "",
          "## Notes",
          ""
        );

        const qaNotes = notes.value.trim();
        if (qaNotes) {
          lines.push(qaNotes, "");
        } else {
          lines.push("- Issues:", "- Decision gates triggered:", "");
        }

        lines.push(
          "Do not paste API keys, bearer tokens, cookies, full URLs, tab titles, page text, emails, private screenshots, or private rule patterns into public issues."
        );

        report.value = lines.join("\\n");
        status.textContent = message || "Checklist state is saved in this disposable profile only.";
      }

      renderReport();
    </script>
  </body>
</html>
`;
}

function renderChecklistSection(section, sectionIndex) {
  return `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        <ul>
          ${section.items
            .map((item, itemIndex) => {
              const id = `qa-${sectionIndex}-${itemIndex}`;
              return `<li><input id="${id}" data-check-id="${id}" type="checkbox" /> <label for="${id}">${escapeHtml(item)}</label></li>`;
            })
            .join("")}
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

function escapeJs(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/"/g, '\\"')
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
}

function serializeForScript(value) {
  return JSON.stringify(String(value)).replace(/</g, "\\u003c");
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

function assertTargetOpened(targets, expectedUrl, label) {
  const opened = targets.some((target) => target.url === expectedUrl);
  if (!opened) {
    throw new Error(`${label} did not open`);
  }
}

function assertChecklistHtml(checklistPath) {
  const html = fs.readFileSync(checklistPath, "utf8");
  const required = [
    "TabMosaic Manual QA Checklist",
    "data-copy-report",
    "data-copy-real-profile-template",
    "data-reset-checklist",
    "data-qa-notes",
    "Local QA Notes",
    "Real Profile QA Template",
    "Status: BLANK TEMPLATE - NOT A COMPLETED QA RESULT",
    "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no",
    "Keep completed real-profile notes private unless they are manually redacted.",
    "tabmosaic.manualQaChecklist.v1",
    "Tab Agent Chat UI",
    "Latest organize result appears as one assistant message bubble",
    "AI Verification",
    "Ask the Sidebar Agent to move Chrome extension docs tabs into Extension Planning",
    "The AI move draft updates real Chrome native tab groups only after Apply and does not close tabs.",
    "Dashboard opens directly to Smart Groups",
    "Error States",
    "If organize fails, Sidebar says no tabs were moved or closed.",
    "Dashboard Undo and Restore Closed are compact and enabled only when available.",
    "Duplicate Center rows expand to show duplicate tabs and Open tab focuses an existing tab.",
    "Clicking a tab title focuses the existing browser tab/window.",
    "Same-window Move sends a tab into an existing native group and does not close tabs.",
    "billing-dashboard",
    "# TabMosaic Manual QA Result"
  ];

  for (const token of required) {
    if (!html.includes(token)) {
      throw new Error(`Manual QA checklist is missing ${token}`);
    }
  }
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
