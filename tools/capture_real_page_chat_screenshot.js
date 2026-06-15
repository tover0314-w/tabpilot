const childProcess = require("child_process");
const fs = require("fs");
const { createRequire } = require("module");
const net = require("net");
const os = require("os");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const ENV_PATH = path.join(ROOT_DIR, ".env.local");
const OUTPUT_DIR = path.join(ROOT_DIR, "artifacts", "real-page-chat");
const DEFAULT_URL = "https://www.hao123.com/";
const DEFAULT_QUESTION = "What content does this page have?";
const DEFAULT_AI_BASE_URL = "https://api.deepseek.com";
const DEFAULT_AI_MODEL = "deepseek-v4-flash";

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
  const targetUrl = normalizeTargetUrl(process.argv[2] || DEFAULT_URL);
  const questions = getQuestionsFromArgs();
  const regionQuestion = getFlagValue("--region-question") || "";
  const useAI = hasFlag("--ai") || hasFlag("--use-ai");
  const aiSettings = useAI ? getDeepSeekSettingsFromEnv() : { enabled: false };
  const chromePath = findChromePath();

  if (isBrandedGoogleChrome(chromePath) && process.env.ALLOW_GOOGLE_CHROME_CLI_EXTENSION !== "1") {
    throw new SkipError("Google Chrome may ignore CLI unpacked extension loading; use Chrome for Testing/Chromium or set ALLOW_GOOGLE_CHROME_CLI_EXTENSION=1 to force a probe");
  }

  const port = await findFreePort();
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "tabmosaic-real-page-profile."));
  const extensionDir = fs.mkdtempSync(path.join(os.tmpdir(), "tabmosaic-real-page-extension."));
  fs.cpSync(EXTENSION_DIR, extensionDir, { recursive: true });
  fs.rmSync(path.join(extensionDir, "private-beta-ai-settings.json"), { force: true });
  addTemporaryHostPermissions(extensionDir, targetUrl);

  const chromeArgs = [
      `--user-data-dir=${profileDir}`,
      `--remote-debugging-port=${port}`,
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--enable-logging=stderr",
      "--v=0",
      "about:blank"
    ];

  if (hasFlag("--headless")) {
    chromeArgs.splice(chromeArgs.length - 1, 0, "--headless=new", "--disable-gpu", "--window-size=1280,900");
  }

  const chrome = childProcess.spawn(
    chromePath,
    chromeArgs,
    {
      stdio: ["ignore", "ignore", "pipe"]
    }
  );
  let chromeLog = "";
  chrome.stderr.on("data", (chunk) => {
    chromeLog += chunk.toString();
  });

  let sidepanelCdp;
  let pageCdp;

  try {
    await waitForChrome(port);
    const extensionId = await waitForExtensionId(port, () => chromeLog);
    const realPageTarget = await createTarget(port, targetUrl);
    pageCdp = await CDPSession.connect(realPageTarget.webSocketDebuggerUrl);
    await waitForPageReady(pageCdp, "Real page did not become ready", 30000);
    await setPageViewport(pageCdp);
    await delay(2500);

    const sidepanelTarget = await createTarget(port, `chrome-extension://${extensionId}/sidepanel.html`);
    sidepanelCdp = await CDPSession.connect(sidepanelTarget.webSocketDebuggerUrl);
    await waitForPageReady(sidepanelCdp, "Sidepanel page did not become ready", 15000);
    await waitForExtensionApis(sidepanelCdp);
    const pageTab = await configureRealPageContext(sidepanelCdp, targetUrl, aiSettings);

    const transcript = [];
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const baseOutputSlug = `${slugForUrl(targetUrl)}-${getCaptureSlug(questions, regionQuestion)}`;
    let browserRegionPath = "";

    for (const turnQuestion of questions) {
      console.log(`RUN current-tab turn ${transcript.length + 1}: ${turnQuestion}`);
      const previousCounts = await getChatMessageCounts(sidepanelCdp);
      await submitSidepanelComposerTrusted(sidepanelCdp, turnQuestion);
      const chatResult = await waitForCurrentPageAnswer(sidepanelCdp, previousCounts);
      transcript.push({
        type: chatResult.isSummary ? "current-tab" : "assistant",
        question: turnQuestion,
        ...chatResult
      });
    }

    if (regionQuestion) {
      console.log(`RUN page-region turn ${transcript.length + 1}: ${regionQuestion}`);
      const previousCounts = await getChatMessageCounts(sidepanelCdp);
      browserRegionPath = path.join(OUTPUT_DIR, `${baseOutputSlug}-browser-region-picker.png`);
      const previewPoint = await captureStandaloneRegionPickerPreview(pageCdp, browserRegionPath).catch((error) => {
        console.log(`WARN browser region preview skipped: ${error?.message || error}`);
        browserRegionPath = "";
        return {};
      });
      if (previewPoint?.screenshotCaptured) {
        console.log(`RUN browser region screenshot method: cdp-preview`);
      } else {
        browserRegionPath = "";
      }
      await startPageRegionFromComposer(sidepanelCdp, regionQuestion);
      console.log("RUN waiting for page region picker");
      pageCdp?.close();
      pageCdp = await connectPageCdpForUrl(port, targetUrl);
      const regionPoint = await waitForRegionPickerPoint(pageCdp);
      console.log(`RUN clicking page region: ${regionPoint.label || previewPoint?.label || "selected page region"}`);
      await clickPagePoint(pageCdp, regionPoint);
      const regionResult = await waitForCurrentPageAnswer(sidepanelCdp, previousCounts, 70000);
      transcript.push({
        type: regionResult.isSummary ? "page-region" : "assistant",
        question: regionQuestion,
        region: regionPoint,
        ...regionResult
      });
    }

    const outputPath = path.join(OUTPUT_DIR, `${baseOutputSlug}.png`);
    await captureSidepanelScreenshot(sidepanelCdp, outputPath, {
      targetUrl,
      pageTab
    });

    console.log("PASS real page chat captured");
    console.log(`url=${targetUrl}`);
    console.log(`turns=${transcript.length}`);
    console.log(`ai=${useAI ? "deepseek" : "disabled"}`);
    transcript.forEach((turn, index) => {
      console.log(`turn${index + 1}.type=${turn.type}`);
      console.log(`turn${index + 1}.question=${turn.question}`);
      console.log(`turn${index + 1}.context=${turn.contextText}`);
      if (turn.region) {
        console.log(`turn${index + 1}.region=${turn.region.label || "selected page region"}`);
      }
      console.log(`turn${index + 1}.answer=${turn.answerText}`);
    });
    if (browserRegionPath) {
      console.log(`browserScreenshot=${browserRegionPath}`);
    }
    console.log(`screenshot=${outputPath}`);
  } finally {
    sidepanelCdp?.close();
    pageCdp?.close();
    await stopChrome(chrome);
    await removePathWithRetry(profileDir);
    await removePathWithRetry(extensionDir);
  }
}

function normalizeTargetUrl(value) {
  const rawValue = String(value || DEFAULT_URL).trim();
  const withScheme = /^[a-z]+:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;
  const url = new URL(withScheme);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Use an http or https URL for real page chat capture.");
  }
  return url.toString();
}

function getFlagValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function getFlagValues(flag) {
  const values = [];

  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === flag && process.argv[index + 1]) {
      values.push(process.argv[index + 1]);
    }
  }

  return values;
}

function getQuestionsFromArgs() {
  if (hasFlag("--region-only")) return [];

  const repeatedQuestions = getFlagValues("--question").flatMap(splitTurnQuestions).filter(Boolean);
  const turns = getFlagValue("--turns");
  const turnQuestions = turns ? splitTurnQuestions(turns) : [];
  const questions = [...repeatedQuestions, ...turnQuestions].filter(Boolean);

  return questions.length ? questions : [DEFAULT_QUESTION];
}

function splitTurnQuestions(value) {
  return String(value || "")
    .split(/\s*\|\|\|\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function getDeepSeekSettingsFromEnv() {
  const env = {
    ...readDotEnv(ENV_PATH),
    ...process.env
  };
  const apiKey = normalizeApiKey(env.DEEPSEEK_API_KEY || env.OPENAI_COMPATIBLE_API_KEY || "");

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY in .env.local or environment. Re-run without --ai for the no-model configuration prompt.");
  }

  return {
    enabled: true,
    provider: "deepseek",
    baseUrl: String(env.DEEPSEEK_BASE_URL || env.OPENAI_COMPATIBLE_BASE_URL || DEFAULT_AI_BASE_URL).trim() || DEFAULT_AI_BASE_URL,
    model: String(env.DEEPSEEK_MODEL || env.OPENAI_COMPATIBLE_MODEL || DEFAULT_AI_MODEL).trim() || DEFAULT_AI_MODEL,
    apiKey
  };
}

function readDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const env = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) {
      if (!env.DEEPSEEK_API_KEY && /^sk-[A-Za-z0-9_-]+$/.test(trimmed)) {
        env.DEEPSEEK_API_KEY = trimmed;
      }
      continue;
    }

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

function normalizeApiKey(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

function addTemporaryHostPermissions(extensionDir, targetUrl) {
  const manifestPath = path.join(extensionDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const url = new URL(targetUrl);
  const host = url.hostname;
  const hosts = new Set([
    `http://${host}/*`,
    `https://${host}/*`
  ]);

  if (host.startsWith("www.")) {
    const rootHost = host.replace(/^www\./, "");
    hosts.add(`http://${rootHost}/*`);
    hosts.add(`https://${rootHost}/*`);
    hosts.add(`http://*.${rootHost}/*`);
    hosts.add(`https://*.${rootHost}/*`);
  }

  manifest.host_permissions = Array.from(new Set([...(manifest.host_permissions || []), ...hosts]));
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function configureRealPageContext(cdp, targetUrl, aiSettings) {
  const targetHost = new URL(targetUrl).hostname;
  const pageTab = await waitFor(async () => {
    const tabs = await evaluate(cdp, "chrome.tabs.query({})");
    return tabs.find((tab) => {
      try {
        const url = new URL(tab.url || tab.pendingUrl || "");
        return url.hostname === targetHost || url.hostname.endsWith(`.${targetHost.replace(/^www\./, "")}`);
      } catch {
        return false;
      }
    });
  }, `Could not find real page tab for ${targetHost}`, 30000);

  await evaluate(
    cdp,
    `chrome.storage.local.set({
      "tabmosaic.aiSettings": ${JSON.stringify(aiSettings)},
      "tabmosaic.sidebarMode": {
        mode: "agent",
        source: "real-page-chat-capture",
        activeWindowId: ${JSON.stringify(pageTab.windowId)},
        activeTabId: ${JSON.stringify(pageTab.id)},
        updatedAt: new Date().toISOString()
      },
      "tabmosaic.sidebarContext": {
        scope: "current_tab",
        tabId: ${JSON.stringify(pageTab.id)},
        windowId: ${JSON.stringify(pageTab.windowId)},
        title: ${JSON.stringify(pageTab.title || "")},
        hostname: ${JSON.stringify(targetHost)},
        source: "real-page-chat-capture",
        updatedAt: new Date().toISOString()
      }
    })`
  );
  await evaluate(cdp, `chrome.windows.update(${JSON.stringify(pageTab.windowId)}, { focused: true })`);
  await evaluate(cdp, `chrome.tabs.update(${JSON.stringify(pageTab.id)}, { active: true })`);

  await waitFor(async () => {
    return evaluate(
      cdp,
      `(() => {
        const bar = document.querySelector("#agentContextBar");
        const text = (bar?.textContent || "").replace(/\\s+/g, " ").trim();
        return bar?.dataset.contextScope === "current_tab" && /Current tab/.test(text) ? text : "";
      })()`
    );
  }, "Sidepanel did not render current-tab context");

  return pageTab;
}

async function getChatMessageCounts(cdp) {
  return evaluate(
    cdp,
    `(() => ({
      assistant: document.querySelectorAll("#chatPanel .chat-thread-message.assistant").length,
      summary: document.querySelectorAll("#chatPanel .chat-thread-message.assistant.summary").length
    }))()`
  );
}

async function waitForCurrentPageAnswer(cdp, previousCounts = {}, timeoutMs = 55000) {
  const previousAssistantCount = Number(previousCounts.assistant || previousCounts || 0);

  return waitFor(async () => {
    return evaluate(
      cdp,
      `(() => {
        const assistants = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant"));
        if (assistants.length <= ${JSON.stringify(previousAssistantCount)}) return null;
        const latest = assistants[assistants.length - 1];
        if (!latest || latest.classList.contains("loading") || latest.classList.contains("tool-card")) return null;
        if (/Reading current tab|Checking page access|Extracting visible text|Select a page region|Reading selected region|Click one visible section/i.test(latest.textContent || "")) return null;

        const contextText = (document.querySelector("#agentContextBar")?.textContent || "").replace(/\\s+/g, " ").trim();
        const answerText = (latest.textContent || "").replace(/\\s+/g, " ").trim();
        return {
          contextText,
          answerText,
          status: Array.from(latest.classList).filter((item) => !["chat-thread-message", "assistant"].includes(item)).join(" "),
          isSummary: latest.classList.contains("summary"),
          hasSummaryCard: Boolean(latest.querySelector(".chat-summary-card"))
        };
      })()`
    );
  }, "Current-page answer did not render", timeoutMs);
}

async function waitForRegionPickerPoint(cdp) {
  await waitFor(async () => {
    return evaluate(cdp, `Boolean(document.querySelector(".tabmosaic-region-hint"))`).catch(() => false);
  }, "Page region picker did not appear", 15000);

  const point = await evaluate(
    cdp,
    `(() => {
      const blockedSelectors = "script,style,noscript,template,svg,canvas,iframe,input,textarea,select,button,[hidden],[aria-hidden='true']";
      const selector = "article,main,section,aside,nav,header,footer,table,ul,ol,[role='main'],[role='article'],[role='region'],[role='dialog'],[data-testid],[aria-label],div";
      const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
      const candidates = Array.from(document.querySelectorAll(selector))
        .map((element) => {
          if (element.closest(blockedSelectors)) return null;
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          const text = String(element.innerText || element.textContent || "").replace(/\\s+/g, " ").trim();
          if (
            !text ||
            text.length < 18 ||
            rect.width < 80 ||
            rect.height < 24 ||
            rect.bottom <= 0 ||
            rect.right <= 0 ||
            rect.top >= window.innerHeight ||
            rect.left >= window.innerWidth ||
            style.visibility === "hidden" ||
            style.display === "none"
          ) {
            return null;
          }

          const visibleLeft = Math.max(0, rect.left);
          const visibleTop = Math.max(0, rect.top);
          const visibleRight = Math.min(window.innerWidth, rect.right);
          const visibleBottom = Math.min(window.innerHeight, rect.bottom);
          const area = Math.max(1, (visibleRight - visibleLeft) * (visibleBottom - visibleTop));
          const areaPenalty = area > viewportArea * 0.7 ? 650 : area > viewportArea * 0.45 ? 260 : 0;
          const topBonus = visibleTop > 70 ? 80 : 0;
          const sizeBonus = visibleBottom - visibleTop < 360 ? 90 : 0;
          const score = Math.min(text.length, 1000) + topBonus + sizeBonus - areaPenalty;

          return {
            x: Math.round(visibleLeft + (visibleRight - visibleLeft) / 2),
            y: Math.round(visibleTop + (visibleBottom - visibleTop) / 2),
            label: text.slice(0, 90),
            score
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);

      return candidates[0] || null;
    })()`
  );

  if (!point) {
    throw new Error("Could not find a readable visible region to click.");
  }

  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: point.x,
    y: point.y
  });
  await delay(250);

  return point;
}

async function clickPagePoint(cdp, point) {
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: point.x,
    y: point.y
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: point.x,
    y: point.y,
    button: "left",
    buttons: 1,
    clickCount: 1
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: point.x,
    y: point.y,
    button: "left",
    buttons: 0,
    clickCount: 1
  });
}

async function captureSidepanelScreenshot(cdp, outputPath, context = {}) {
  await focusExtensionPageTab(cdp, "sidepanel.html");

  await cdp.send("Page.enable", {}, 5000).catch(() => {});
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 860,
    deviceScaleFactor: 1,
    mobile: false
  });
  await cdp.send("Page.bringToFront", {}, 5000).catch(() => {});
  await restoreCapturedPageContext(cdp, context);
  await delay(500);

  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false
  }, 30000);
  fs.writeFileSync(outputPath, Buffer.from(result.data, "base64"));
}

async function restoreCapturedPageContext(cdp, context = {}) {
  if (!context.pageTab?.id || !context.targetUrl) return;

  const targetHost = new URL(context.targetUrl).hostname;
  await evaluate(
    cdp,
    `chrome.storage.local.set({
      "tabmosaic.sidebarContext": {
        scope: "current_tab",
        tabId: ${JSON.stringify(context.pageTab.id)},
        windowId: ${JSON.stringify(context.pageTab.windowId)},
        title: ${JSON.stringify(context.pageTab.title || "")},
        hostname: ${JSON.stringify(targetHost)},
        source: "real-page-chat-capture",
        updatedAt: new Date().toISOString()
      }
    })`
  );

  await waitFor(async () => {
    return evaluate(
      cdp,
      `(() => {
        const bar = document.querySelector("#agentContextBar");
        const text = (bar?.textContent || "").replace(/\\s+/g, " ").trim();
        return bar?.dataset.contextScope === "current_tab" && !/chrome-extension/i.test(text) ? text : "";
      })()`
    );
  }, "Sidepanel screenshot context did not restore to the captured page", 5000);
}

async function focusExtensionPageTab(cdp, pathName, bounds = {}) {
  const tab = await evaluate(
    cdp,
    `chrome.tabs.query({}).then((tabs) => {
      const tab = tabs.find((item) => String(item.url || "").includes(${JSON.stringify(pathName)}));
      return tab ? { id: tab.id, windowId: tab.windowId } : null;
    })`
  );

  if (!tab?.id || !tab?.windowId) return false;

  const updateInfo = {
    focused: true,
    ...(Number.isInteger(bounds.width) ? { width: bounds.width } : {}),
    ...(Number.isInteger(bounds.height) ? { height: bounds.height } : {})
  };

  await evaluate(
    cdp,
    `chrome.tabs.update(${JSON.stringify(tab.id)}, { active: true })
      .then(() => chrome.windows.update(${JSON.stringify(tab.windowId)}, ${JSON.stringify(updateInfo)}))`
  );
  await delay(650);

  return true;
}

async function capturePageScreenshot(cdp, outputPath) {
  await cdp.send("Page.enable", {}, 5000).catch(() => {});
  await cdp.send("Page.bringToFront", {}, 5000).catch(() => {});
  await delay(350);
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false
  }, 6000);
  fs.writeFileSync(outputPath, Buffer.from(result.data, "base64"));
}

async function captureStandaloneRegionPickerPreview(cdp, outputPath) {
  const point = await evaluate(
    cdp,
    `(() => {
      document.querySelectorAll("[data-tabmosaic-preview='region']").forEach((node) => node.remove());

      const blockedSelectors = "script,style,noscript,template,svg,canvas,iframe,input,textarea,select,button,[hidden],[aria-hidden='true']";
      const selector = "article,main,section,aside,nav,header,footer,table,ul,ol,[role='main'],[role='article'],[role='region'],[role='dialog'],[data-testid],[aria-label],div";
      const viewportArea = Math.max(1, window.innerWidth * window.innerHeight);
      const candidates = Array.from(document.querySelectorAll(selector))
        .map((element) => {
          if (element.closest(blockedSelectors)) return null;
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          const text = String(element.innerText || element.textContent || "").replace(/\\s+/g, " ").trim();
          if (
            !text ||
            text.length < 18 ||
            rect.width < 80 ||
            rect.height < 24 ||
            rect.bottom <= 0 ||
            rect.right <= 0 ||
            rect.top >= window.innerHeight ||
            rect.left >= window.innerWidth ||
            style.visibility === "hidden" ||
            style.display === "none"
          ) {
            return null;
          }

          const visibleLeft = Math.max(0, rect.left);
          const visibleTop = Math.max(0, rect.top);
          const visibleRight = Math.min(window.innerWidth, rect.right);
          const visibleBottom = Math.min(window.innerHeight, rect.bottom);
          const area = Math.max(1, (visibleRight - visibleLeft) * (visibleBottom - visibleTop));
          const areaPenalty = area > viewportArea * 0.7 ? 650 : area > viewportArea * 0.45 ? 260 : 0;
          const topBonus = visibleTop > 70 ? 80 : 0;
          const sizeBonus = visibleBottom - visibleTop < 360 ? 90 : 0;
          const score = Math.min(text.length, 1000) + topBonus + sizeBonus - areaPenalty;

          return {
            rect: { left: visibleLeft, top: visibleTop, width: visibleRight - visibleLeft, height: visibleBottom - visibleTop },
            x: Math.round(visibleLeft + (visibleRight - visibleLeft) / 2),
            y: Math.round(visibleTop + (visibleBottom - visibleTop) / 2),
            label: text.slice(0, 90),
            score
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);
      const candidate = candidates[0];
      if (!candidate) return null;

      const style = document.createElement("style");
      style.dataset.tabmosaicPreview = "region";
      style.textContent = \`
        .tabmosaic-region-highlight[data-tabmosaic-preview='region'] {
          position: fixed;
          z-index: 2147483646;
          pointer-events: none;
          border: 2px solid rgba(42, 139, 242, 0.95);
          background: rgba(42, 139, 242, 0.12);
          box-shadow: 0 0 0 99999px rgba(8, 13, 23, 0.12), 0 14px 40px rgba(15, 23, 42, 0.18);
          border-radius: 10px;
        }
        .tabmosaic-region-hint[data-tabmosaic-preview='region'] {
          position: fixed;
          z-index: 2147483647;
          left: 16px;
          bottom: 16px;
          max-width: min(420px, calc(100vw - 32px));
          padding: 10px 12px;
          border-radius: 14px;
          color: #0f172a;
          font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(148, 163, 184, 0.38);
          box-shadow: 0 18px 60px rgba(15, 23, 42, 0.18);
          backdrop-filter: blur(18px);
          pointer-events: none;
        }
      \`;
      const highlight = document.createElement("div");
      highlight.className = "tabmosaic-region-highlight";
      highlight.dataset.tabmosaicPreview = "region";
      highlight.style.left = \`\${candidate.rect.left}px\`;
      highlight.style.top = \`\${candidate.rect.top}px\`;
      highlight.style.width = \`\${candidate.rect.width}px\`;
      highlight.style.height = \`\${candidate.rect.height}px\`;

      const hint = document.createElement("div");
      hint.className = "tabmosaic-region-hint";
      hint.dataset.tabmosaicPreview = "region";
      hint.textContent = "TabMosaic: click one visible page section. Press Esc to cancel.";
      document.documentElement.append(style, highlight, hint);

      return candidate;
    })()`
  );

  if (!point) {
    throw new Error("Could not find a readable visible region to preview.");
  }

  let screenshotCaptured = true;

  try {
    await capturePageScreenshot(cdp, outputPath);
  } catch (error) {
    screenshotCaptured = false;
    console.log(`WARN browser preview screenshot failed: ${error?.message || error}`);
  } finally {
    await evaluate(
      cdp,
      `document.querySelectorAll("[data-tabmosaic-preview='region']").forEach((node) => node.remove())`
    ).catch(() => {});
  }

  return {
    ...point,
    screenshotCaptured
  };
}

function slugForUrl(value) {
  const url = new URL(value);
  return url.hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "real-page";
}

function getCaptureSlug(questions, regionQuestion) {
  if (regionQuestion && questions.length > 1) return "multiturn-region-chat";
  if (regionQuestion) return "region-chat";
  if (questions.length > 1) return "multiturn-chat";
  return "current-tab-chat";
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

  throw new Error("Could not find Chrome. Set CHROME_PATH to run this capture.");
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
  return fetchJson(port, `/json/new?${encodeURIComponent(targetUrl)}`, { method: "PUT" });
}

async function connectPageCdpForUrl(port, targetUrl) {
  const target = await findPageTargetForUrl(port, targetUrl);
  return CDPSession.connect(target.webSocketDebuggerUrl);
}

async function findPageTargetForUrl(port, targetUrl) {
  const expectedUrl = new URL(targetUrl).toString();
  const expectedHost = new URL(targetUrl).hostname.replace(/^www\./, "");
  const targets = await fetchJson(port, "/json/list");
  const exact = targets.find((target) => target.type === "page" && target.url === expectedUrl);

  if (exact) return exact;

  const hostMatch = targets.find((target) => {
    if (target.type !== "page") return false;

    try {
      const url = new URL(target.url);
      const host = url.hostname.replace(/^www\./, "");
      return host === expectedHost || host.endsWith(`.${expectedHost}`);
    } catch {
      return false;
    }
  });

  if (hostMatch) return hostMatch;

  throw new Error(`Could not find real page target for ${expectedUrl}`);
}

async function fetchJson(port, route, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${route}`, options);

  if (!response.ok) {
    throw new Error(`CDP HTTP ${response.status} for ${route}`);
  }

  return response.json();
}

async function waitForPageReady(cdp, message = "Page did not become ready", timeoutMs = 15000) {
  await waitFor(async () => {
    const readyState = await evaluate(cdp, "document.readyState");
    return readyState === "interactive" || readyState === "complete";
  }, message, timeoutMs);
}

async function setPageViewport(cdp) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });
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
        chrome.tabs
      )`
    ).catch(() => false);
  }, "Extension page did not expose expected Chrome extension APIs");
}

async function evaluate(cdp, expression, timeoutMs = 15000) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  }, timeoutMs);

  if (result.exceptionDetails) {
    const details = result.exceptionDetails;
    const description = details.exception?.description || details.exception?.value || details.text;
    throw new Error(description || "Runtime evaluation failed");
  }

  return result.result.value;
}

async function submitSidepanelComposerTrusted(cdp, text) {
  await evaluate(
    cdp,
    `(() => {
      const input = document.querySelector("#chatInput");
      if (!input) throw new Error("Sidepanel composer is not available");
      input.value = ${JSON.stringify(text)};
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      return true;
    })()`
  );
  const buttonCenter = await evaluate(
    cdp,
    `(() => {
      const button = document.querySelector("#chatSendButton");
      if (!button) throw new Error("Sidepanel send button is not available");
      const rect = button.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    })()`
  );

  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: buttonCenter.x,
    y: buttonCenter.y
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: buttonCenter.x,
    y: buttonCenter.y,
    button: "left",
    buttons: 1,
    clickCount: 1
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: buttonCenter.x,
    y: buttonCenter.y,
    button: "left",
    buttons: 0,
    clickCount: 1
  });

}

async function startPageRegionFromComposer(cdp, question) {
  await evaluate(
    cdp,
    `(() => {
      const input = document.querySelector("#chatInput");
      if (!input) throw new Error("Sidepanel composer is not available");
      input.value = ${JSON.stringify(question || "")};
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      return true;
    })()`
  );
  const buttonCenter = await evaluate(
    cdp,
    `(() => {
      const button = document.querySelector("#pageRegionButton");
      if (!button) throw new Error("Composer page-region button is not available");
      const rect = button.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    })()`
  );

  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: buttonCenter.x,
    y: buttonCenter.y
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: buttonCenter.x,
    y: buttonCenter.y,
    button: "left",
    buttons: 1,
    clickCount: 1
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: buttonCenter.x,
    y: buttonCenter.y,
    button: "left",
    buttons: 0,
    clickCount: 1
  });

  const regionItemCenter = await waitFor(async () => {
    return evaluate(
      cdp,
      `(() => {
        const item = document.querySelector('[data-picker-action="page-region"]');
        if (!item || item.closest("[hidden]")) return null;
        const rect = item.getBoundingClientRect();
        if (!rect.width || !rect.height) return null;
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      })()`
    );
  }, "Page region picker item did not appear", 5000);

  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: regionItemCenter.x,
    y: regionItemCenter.y
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: regionItemCenter.x,
    y: regionItemCenter.y,
    button: "left",
    buttons: 1,
    clickCount: 1
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: regionItemCenter.x,
    y: regionItemCenter.y,
    button: "left",
    buttons: 0,
    clickCount: 1
  });
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

async function stopChrome(chrome) {
  if (chrome.exitCode !== null || chrome.signalCode) {
    return;
  }

  chrome.kill();
  await Promise.race([
    new Promise((resolve) => chrome.once("exit", resolve)),
    delay(2500)
  ]);

  if (chrome.exitCode === null && !chrome.signalCode) {
    chrome.kill("SIGKILL");
    await Promise.race([
      new Promise((resolve) => chrome.once("exit", resolve)),
      delay(1500)
    ]);
  }
}

async function removePathWithRetry(targetPath) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.rmSync(targetPath, { recursive: true, force: true });
      return;
    } catch (error) {
      if (!["ENOTEMPTY", "EBUSY", "EPERM"].includes(error?.code) || attempt === 5) {
        throw error;
      }

      await delay(250 * (attempt + 1));
    }
  }
}

class CDPSession {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.binaryType = "arraybuffer";
    socket.addEventListener("message", async (event) => {
      const message = JSON.parse(await normalizeWebSocketMessageData(event.data));
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

  send(method, params = {}, timeoutMs = 15000) {
    const id = this.nextId;
    this.nextId += 1;
    this.socket.send(JSON.stringify({ id, method, params }));

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP ${method} timed out`));
      }, timeoutMs);

      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeoutId);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
    });
  }

  close() {
    this.socket.close();
  }
}

async function normalizeWebSocketMessageData(data) {
  if (typeof data === "string") return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString("utf8");
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString("utf8");
  if (data && typeof data.text === "function") return data.text();
  return String(data || "");
}
