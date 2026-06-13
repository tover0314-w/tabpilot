const childProcess = require("child_process");
const fs = require("fs");
const http = require("http");
const { createRequire } = require("module");
const net = require("net");
const os = require("os");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const ENV_PATH = path.join(ROOT_DIR, ".env.local");
const SHOULD_RUN_LARGE_TABS = process.argv.includes("--large-tabs");
const SHOULD_RUN_AGENT_FLOW = process.argv.includes("--agent-flow");
const SHOULD_CAPTURE_REAL_AI_CONTENT_REGROUP = process.argv.includes("--real-ai-content-regroup-screenshot");
const LARGE_TAB_COUNT = Number(process.env.TABMOSAIC_LARGE_TAB_COUNT || 96);
const DEFAULT_AI_BASE_URL = "https://api.deepseek.com";
const DEFAULT_AI_MODEL = "deepseek-v4-flash";
const REAL_AI_ARTIFACT_DIR = path.join(ROOT_DIR, "artifacts", "real-ai-classification");
const REAL_AI_CONTENT_REGROUP_SCREENSHOT = path.join(REAL_AI_ARTIFACT_DIR, "content-regroup-sidepanel.png");
const REAL_AI_CONTEXT_TABS_SCREENSHOT = path.join(REAL_AI_ARTIFACT_DIR, "context-tabs-sidepanel.png");
const SIDEPANEL_SCREENSHOT_VIEWPORT = { width: 390, height: 860 };
const SYNTHETIC_CONTENT_HOST = "tabmosaic-runtime.test";
const SYNTHETIC_CONTENT_PAGES = [
  {
    path: "/product-roadmap",
    title: "Runtime Product Roadmap",
    heading: "Runtime Product Planning",
    body:
      "ORBITALPLANNING anchors the product roadmap planning page. It covers PRD decisions, MVP requirements, workspace acceptance criteria, and customer user stories for the tab agent."
  },
  {
    path: "/release-qa",
    title: "Runtime Release QA",
    heading: "Runtime Debug Notes",
    body:
      "BUGLANTERN appears in the release QA page. This page covers debug traces, error reproduction, incident triage, and deployment validation for the extension runtime."
  },
  {
    path: "/interface-review",
    title: "Runtime Interface Review",
    heading: "Runtime Design Review",
    body:
      "GLASSHARBOR marks the design review page. It covers UI prototype feedback, wireframe decisions, interaction polish, and UX review notes for the sidebar."
  }
];
const TEST_URLS = [
  "https://github.com/acme/app/pull/42",
  "https://github.com/acme/app/pull/43",
  "https://developer.chrome.com/docs/extensions/reference/api/tabs",
  "https://developer.chrome.com/docs/extensions/reference/api/tabGroups",
  "https://docs.google.com/document/d/tabmosaic-one/edit",
  "https://docs.google.com/document/d/tabmosaic-two/edit",
  "https://example.com/tabmosaic-duplicate",
  "https://example.com/tabmosaic-duplicate",
  "https://example.com/tabmosaic-review#one",
  "https://example.com/tabmosaic-review#two"
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
  const syntheticContentServer = SHOULD_RUN_LARGE_TABS ? null : await startSyntheticContentServer();
  fs.cpSync(EXTENSION_DIR, extensionDir, { recursive: true });
  fs.rmSync(path.join(extensionDir, "private-beta-ai-settings.json"), { force: true });
  if (syntheticContentServer) {
    addSyntheticContentHostPermission(extensionDir);
  }

  const chrome = childProcess.spawn(
    chromePath,
    [
      `--user-data-dir=${profileDir}`,
      `--remote-debugging-port=${port}`,
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`,
      syntheticContentServer ? `--host-resolver-rules=MAP ${SYNTHETIC_CONTENT_HOST} 127.0.0.1` : "",
      "--no-first-run",
      "--no-default-browser-check",
      "--enable-logging=stderr",
      "--v=0",
      "about:blank"
    ].filter(Boolean),
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

    if (SHOULD_CAPTURE_REAL_AI_CONTENT_REGROUP) {
      await runRealAIContentRegroupScreenshot(port, extensionId, syntheticContentServer);
      return;
    }

    if (SHOULD_RUN_LARGE_TABS) {
      await runLargeTabsRuntimeProbe(port, extensionId);
      return;
    }

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
      assert(organizeResult.run.summary.safeDuplicatesClosed >= 1, "Expected a safe duplicate tab to be closed");
      assert(organizeResult.run.summary.closedTabsRestoreAvailable, "Expected Restore Closed to be available after safe duplicate close");

      const latestRunMessageRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => Boolean(document.querySelector("#chatPanel .chat-thread-message.assistant.run-completed .run-message-card")))()`
        );
      }, "Sidebar latest organize result did not render as an assistant chat message");
      assert(latestRunMessageRendered, "Latest organize result was not rendered as an assistant chat message");
      await runSelectedTabsContextRuntimeProbe(cdp, organizeResult.run);
      await runSyntheticContentRuntimeProbe(port, cdp, syntheticContentServer);

      const groups = await evaluate(cdp, "chrome.tabGroups.query({})");
      const groupTitles = groups.map((group) => group.title).sort();
      assertGroupFamily(groupTitles, ["code review", "pr review", "pull request", "github pr", "app pr", "app prs", "review pages", "review tabs"], "code review");
      assertGroupFamily(groupTitles, ["chrome extension", "chrome ext", "extension docs", "ext docs", "chrome docs", "browser extension", "chrome api", "api reference", "api docs", "api documentation", "developer documentation", "development docs"], "Chrome extension docs");
      assertGroupFamily(groupTitles, ["docs & notes", "documents", "document", "project docs", "google docs", "design docs", "tabmosaic docs", "not found docs"], "documents/notes");

      if (SHOULD_RUN_AGENT_FLOW) {
        await runDeepSeekAgentFlow(cdp);
        return;
      }

      const tabsBeforeDashboardCommand = await evaluate(cdp, "chrome.tabs.query({})");
      await submitSidepanelComposer(cdp, "open dashboard");
      const dashboardTabs = await waitFor(async () => {
        const tabs = await evaluate(cdp, "chrome.tabs.query({})");
        return tabs.some((tab) => String(tab.url || "").endsWith("/dashboard.html")) ? tabs : null;
      }, "Sidebar composer did not open Dashboard");
      assert(dashboardTabs.length >= tabsBeforeDashboardCommand.length + 1, "Open Dashboard command did not create a Dashboard tab");

      await submitSidepanelComposer(cdp, "summarize this page");
      const summaryRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const legacyPanel = document.querySelector("#summaryPanel");
            const text = panel?.textContent || "";
            return Boolean(
              panel &&
              !panel.hidden &&
              legacyPanel?.hidden &&
              panel.querySelector(".chat-summary-card") &&
              !panel.querySelector(".chat-summary-question") &&
              /summarize this page/.test(text)
            );
          })()`
        );
      }, "Sidebar composer summary command did not render a chat summary response");
      assert(summaryRendered, "Summary command did not render expected local chat summary state");

      await submitSidepanelComposer(cdp, "ask page: what does this page say about tabs");
      const pageQuestionRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const legacyPanel = document.querySelector("#summaryPanel");
            const text = panel?.textContent || "";
            return Boolean(
              panel &&
              !panel.hidden &&
              legacyPanel?.hidden &&
              panel.querySelector(".chat-summary-card") &&
              !panel.querySelector(".chat-summary-question") &&
              /what does this page say about tabs/.test(text)
            );
          })()`
        );
      }, "Sidebar composer page question did not render in the chat summary card");
      assert(pageQuestionRendered, "Page question was not rendered in the local chat summary card");

      const threadedChatRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const userMessages = Array.from(panel?.querySelectorAll(".chat-thread-message.user") || []);
            const assistantMessages = Array.from(panel?.querySelectorAll(".chat-thread-message.assistant") || []);
            return Boolean(
              userMessages.some((node) => /ask page: what does this page say about tabs/.test(node.textContent || "")) &&
              assistantMessages.length >= 2
            );
          })()`
        );
      }, "Sidebar composer did not preserve user and assistant chat messages");
      assert(threadedChatRendered, "Chat thread did not preserve user and assistant messages");

      await submitSidepanelComposer(cdp, "summarize this page");
      const composerSummaryThreaded = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const userMessages = Array.from(panel?.querySelectorAll(".chat-thread-message.user") || []);
            const assistantMessages = Array.from(panel?.querySelectorAll(".chat-thread-message.assistant") || []);
            return Boolean(
              userMessages.some((node) => /summarize this page/.test(node.textContent || "")) &&
              assistantMessages.some((node) => node.querySelector(".chat-summary-card"))
            );
          })()`
        );
      }, "Sidebar composer summary command did not enter the chat message thread");
      assert(composerSummaryThreaded, "Composer summary command did not preserve user and assistant messages in the chat thread");

      await submitSidepanelComposer(cdp, "what can you do");
      const capabilityAnswerRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const text = panel?.textContent || "";
            return Boolean(panel && !panel.hidden && /I can organize your tabs|我可以整理标签页/.test(text));
          })()`
        );
      }, "Sidebar composer did not answer capability/help question");
      assert(capabilityAnswerRendered, "Capability/help answer was not rendered in the chat thread");

      await submitSidepanelComposer(cdp, "Which tabs should I focus on for Chrome extension planning?");
      let openChatAnswerRendered;
      try {
        openChatAnswerRendered = await waitFor(async () => {
          return evaluate(
            cdp,
            `(() => {
              const panel = document.querySelector("#chatPanel");
              const text = panel?.textContent || "";
              const latestAssistant = Array.from(panel?.querySelectorAll(".chat-thread-message.assistant") || []).pop();
              const latestText = latestAssistant?.textContent || "";
              const renderedAIAgent = Boolean(latestAssistant?.querySelector(".ai-agent-card"));
              const renderedFallback = /local DeepSeek private-beta config|enable DeepSeek|connect a BYOK AI provider|BYOK AI provider|启用 DeepSeek|本地 DeepSeek 私测配置/.test(latestText);

              return Boolean(
                panel &&
                !panel.hidden &&
                /Which tabs should I focus on for Chrome extension planning/.test(text) &&
                (renderedAIAgent || renderedFallback) &&
                !/could not turn that into a safe tab action|无法把这句话变成安全的标签页操作/i.test(latestText)
              );
            })()`
          );
        }, "Sidebar open-ended chat answer did not render as a normal assistant message", 30000);
      } catch (error) {
        const chatDebug = await evaluate(
          cdp,
          `(() => Array.from(document.querySelectorAll("#chatPanel .chat-thread-message"))
            .slice(-8)
            .map((node) => ({
              className: node.className,
              text: (node.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 320)
            })))()`
        );
        throw new Error(`${error.message}. Last chat messages: ${JSON.stringify(chatDebug)}`);
      }
      assert(openChatAnswerRendered, "Open-ended chat answer was not rendered in the chat thread");

      await submitSidepanelComposer(cdp, "save workspace");
      const sidepanelSaveState = await waitFor(async () => {
        const state = await evaluate(cdp, `chrome.storage.local.get("tabmosaic.savedWorkspaces")`);
        const savedWorkspaces = state["tabmosaic.savedWorkspaces"] || [];
        return savedWorkspaces.length >= 1 ? savedWorkspaces : null;
      }, "Sidebar save workspace command did not write a local workspace snapshot");
      assert(sidepanelSaveState, "Sidebar save workspace command did not save a workspace");

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

      const targetGroup = updatedGroups.find((group) => group.title === "QA Review" && group.color === "green");
      assert(targetGroup, "Could not find QA Review target group after Dashboard apply");
      const tabsAfterDashboardApply = await evaluate(cdp, "chrome.tabs.query({})");
      const sourceTab = tabsAfterDashboardApply.find(
        (tab) => tab.windowId === targetGroup.windowId && tab.groupId !== targetGroup.id && tab.groupId !== -1
      );
      assert(sourceTab, "Could not find a same-window tab in another group for Dashboard tab move");

      const dashboardMove = await evaluate(cdp, `
        chrome.runtime.sendMessage({
          type: "APPLY_DASHBOARD_TAB_MOVE",
          tabId: ${sourceTab.id},
          targetGroupId: ${targetGroup.id}
        })
      `);
      assert(dashboardMove && dashboardMove.ok, `Dashboard tab move failed: ${JSON.stringify(dashboardMove)}`);
      assert(dashboardMove.run.summary.dashboardTabsMoved >= 1, "Dashboard tab move summary was not updated");

      const movedTab = await evaluate(cdp, `chrome.tabs.get(${sourceTab.id})`);
      assertEqual(movedTab.groupId, targetGroup.id, "Dashboard tab move did not update the native tab group");

      const dashboardFocus = await evaluate(cdp, `
        chrome.runtime.sendMessage({
          type: "FOCUS_DASHBOARD_TAB",
          tabId: ${movedTab.id}
        })
      `);
      assert(dashboardFocus && dashboardFocus.ok, `Dashboard tab focus failed: ${JSON.stringify(dashboardFocus)}`);
      const activeTabs = await evaluate(cdp, `chrome.tabs.query({ active: true, windowId: ${movedTab.windowId} })`);
      assert(activeTabs.some((tab) => tab.id === movedTab.id), "Dashboard tab focus did not activate the requested tab");

      const dashboardSave = await evaluate(cdp, `
        chrome.runtime.sendMessage({
          type: "SAVE_CURRENT_WORKSPACE",
          source: "runtime-smoke"
        })
      `);
      assert(dashboardSave && dashboardSave.ok, `Dashboard workspace save failed: ${JSON.stringify(dashboardSave)}`);
      const savedWorkspaceState = await evaluate(cdp, `chrome.storage.local.get("tabmosaic.savedWorkspaces")`);
      const savedWorkspaces = savedWorkspaceState["tabmosaic.savedWorkspaces"] || [];
      const savedWorkspaceJson = JSON.stringify(savedWorkspaces);
      assert(savedWorkspaces.length >= 1, "Dashboard workspace save did not write local workspace state");
      assert(!savedWorkspaceJson.includes("restoreUrl"), "Saved workspaces must not contain restoreUrl");
      assert(!savedWorkspaceJson.includes("fullUrl"), "Saved workspaces must not contain fullUrl");
      assert(!savedWorkspaceJson.includes("pageText"), "Saved workspaces must not contain page text");
      assert(!savedWorkspaceJson.includes("https://"), "Saved workspaces must not contain full URLs");

      const savedWorkspaceIdToDelete = savedWorkspaces[0]?.id;
      assert(savedWorkspaceIdToDelete, "Dashboard workspace save did not create a deletable workspace id");
      const dashboardDelete = await evaluate(cdp, `
        chrome.runtime.sendMessage({
          type: "DELETE_SAVED_WORKSPACE",
          workspaceId: ${JSON.stringify(savedWorkspaceIdToDelete)}
        })
      `);
      assert(dashboardDelete && dashboardDelete.ok, `Dashboard workspace delete failed: ${JSON.stringify(dashboardDelete)}`);
      const savedWorkspaceAfterDeleteState = await evaluate(cdp, `chrome.storage.local.get("tabmosaic.savedWorkspaces")`);
      const savedWorkspacesAfterDelete = savedWorkspaceAfterDeleteState["tabmosaic.savedWorkspaces"] || [];
      assertEqual(
        savedWorkspacesAfterDelete.length,
        savedWorkspaces.length - 1,
        "Dashboard workspace delete should remove one local workspace snapshot"
      );
      assert(
        !savedWorkspacesAfterDelete.some((workspace) => workspace.id === savedWorkspaceIdToDelete),
        "Dashboard workspace delete should remove the requested local snapshot id"
      );

      const dashboardUiPage = await createTarget(port, `chrome-extension://${extensionId}/dashboard.html`);
      const dashboardCdp = await CDPSession.connect(dashboardUiPage.webSocketDebuggerUrl);

      try {
        await waitForPageReady(dashboardCdp);
        await waitForExtensionApis(dashboardCdp);
        const dashboardDragMove = await waitFor(async () => {
          return evaluate(
            dashboardCdp,
            `new Promise((resolve) => {
              const delay = (ms) => new Promise((done) => setTimeout(done, ms));

              (async () => {
                await delay(250);
                const row = document.querySelector('.dashboard-tabrow[data-tab-draggable="true"]');

                if (!row) {
                  resolve(null);
                  return;
                }

                const sourceGroupId = Number(row.dataset.currentGroupId);
                const sourceWindowId = Number(row.dataset.windowId);
                const targetCard = Array.from(document.querySelectorAll('.dashboard-group-card[data-group-id][data-window-id]')).find((card) => {
                  return Number(card.dataset.groupId) !== sourceGroupId && Number(card.dataset.windowId) === sourceWindowId;
                });

                if (!targetCard || typeof DataTransfer !== "function") {
                  resolve(null);
                  return;
                }

                const tabId = Number(row.dataset.tabId);
                const targetGroupId = Number(targetCard.dataset.groupId);
                const transfer = new DataTransfer();
                row.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: transfer }));
                targetCard.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: transfer }));
                targetCard.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
                row.dispatchEvent(new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer: transfer }));

                const startedAt = Date.now();
                while (Date.now() - startedAt < 5000) {
                  const tab = await chrome.tabs.get(tabId);

                  if (tab.groupId === targetGroupId) {
                    resolve({ ok: true, tabId, targetGroupId });
                    return;
                  }

                  await delay(100);
                }

                resolve(null);
              })().catch((error) => resolve({ ok: false, error: error?.message || String(error) }));
            })`
          );
        }, "Dashboard drag/drop did not move a tab into the target native group");
        assert(dashboardDragMove?.ok, `Dashboard drag/drop failed: ${JSON.stringify(dashboardDragMove)}`);

        const draggedTab = await evaluate(cdp, `chrome.tabs.get(${dashboardDragMove.tabId})`);
        assertEqual(draggedTab.groupId, dashboardDragMove.targetGroupId, "Dashboard drag/drop did not update the native tab group");

        const dashboardDuplicateFocus = await waitFor(async () => {
          return evaluate(
            dashboardCdp,
            `new Promise((resolve) => {
              const delay = (ms) => new Promise((done) => setTimeout(done, ms));

              (async () => {
                await delay(250);
                const duplicateCenter = document.querySelector("#duplicates");
                duplicateCenter.open = true;
                const duplicateGroup = document.querySelector(".dashboard-duplicate-group");

                if (!duplicateGroup) {
                  resolve(null);
                  return;
                }

                duplicateGroup.open = true;
                const row = duplicateGroup.querySelector(".dashboard-duplicate-tab[data-tab-id]");
                const button = row?.querySelector('[data-group-action="focus-tab"]');

                if (!row || !button) {
                  resolve(null);
                  return;
                }

                const tabId = Number(row.dataset.tabId);
                button.click();

                const startedAt = Date.now();
                while (Date.now() - startedAt < 5000) {
                  const [activeTab] = await chrome.tabs.query({ active: true });

                  if (activeTab?.id === tabId) {
                    resolve({ ok: true, tabId });
                    return;
                  }

                  await delay(100);
                }

                resolve(null);
              })().catch((error) => resolve({ ok: false, error: error?.message || String(error) }));
            })`
          );
        }, "Dashboard Duplicate Center Open action did not focus a duplicate tab");
        assert(dashboardDuplicateFocus?.ok, `Dashboard Duplicate Center focus failed: ${JSON.stringify(dashboardDuplicateFocus)}`);
      } finally {
        dashboardCdp.close();
      }

      const tabsBeforeRestore = await evaluate(cdp, "chrome.tabs.query({})");
      const restoreSnapshotState = await evaluate(cdp, `
        chrome.storage.local.get("tabmosaic.lastClosedTabs")
      `);
      const restoreSnapshot = restoreSnapshotState["tabmosaic.lastClosedTabs"];
      assert(
        restoreSnapshot?.closedTabs?.some((tab) => String(tab.url || "").includes("example.com/tabmosaic-duplicate")),
        "Restore snapshot did not include the synthetic duplicate URL"
      );

      await submitSidepanelComposer(cdp, "what did you close");
      const closedTabsAnswerRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const text = panel?.textContent || "";
            return Boolean(panel && !panel.hidden && /Closed duplicates available|可恢复的已关闭重复标签页/.test(text));
          })()`
        );
      }, "Sidebar composer did not answer closed duplicate state");
      assert(closedTabsAnswerRendered, "Closed duplicate answer was not rendered from local restore state");

      await submitSidepanelComposer(cdp, "what needs review");
      const duplicateReviewAnswerRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const text = panel?.textContent || "";
            return Boolean(panel && !panel.hidden && /Review queue|待确认重复项/.test(text));
          })()`
        );
      }, "Sidebar composer did not answer duplicate review state");
      assert(duplicateReviewAnswerRendered, "Duplicate review answer was not rendered from latest run state");

      await submitSidepanelComposer(cdp, "restore closed");
      const restoreClosedRun = await waitForCurrentRunStatus(cdp, "closed-restored", "Sidebar composer Restore Closed command did not complete");
      assert(restoreClosedRun.summary.restoredClosedTabs >= 1, "Restore Closed did not restore any duplicate tabs");
      assertEqual(restoreClosedRun.summary.closedTabsRestoreAvailable, false, "Restore Closed should clear restore availability");

      const tabsAfterRestore = await evaluate(cdp, "chrome.tabs.query({})");
      assert(
        tabsAfterRestore.length >= tabsBeforeRestore.length + restoreClosedRun.summary.restoredClosedTabs,
        "Restore Closed did not increase the open tab count"
      );

      await submitSidepanelComposer(cdp, "undo");
      const undoRun = await waitForCurrentRunStatus(cdp, "undone", "Sidebar composer Undo command did not complete");
      assertEqual(undoRun.summary.undoAvailable, false, "Undo command should clear undo availability");

      await submitSidepanelComposer(cdp, "organize again");
      const organizeAgainRun = await waitForCurrentRunStatus(cdp, "completed", "Sidebar composer Organize Again command did not complete", 45000);
      assert(organizeAgainRun.summary.tabCount >= 6, "Organize Again command should scan the synthetic tabs");

      await submitSidepanelComposer(cdp, "what should I do next");
      const nextStepAnswerRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const text = panel?.textContent || "";
            return Boolean(panel && !panel.hidden && /Next:|下一步/.test(text));
          })()`
        );
      }, "Sidebar composer did not answer next-step guidance");
      assert(nextStepAnswerRendered, "Next-step answer was not rendered from latest run state");

      await submitSidepanelComposer(cdp, "what tab am I on");
      const activeTabAnswerRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const text = panel?.textContent || "";
            return Boolean(panel && !panel.hidden && /Current active tab|当前活跃标签页/.test(text));
          })()`
        );
      }, "Sidebar composer did not answer active-tab state");
      assert(activeTabAnswerRendered, "Active-tab answer was not rendered from latest run state");

      await submitSidepanelComposer(cdp, "protected tabs");
      const protectedTabsAnswerRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const text = panel?.textContent || "";
            return Boolean(panel && !panel.hidden && /protected tabs|受保护标签页/.test(text));
          })()`
        );
      }, "Sidebar composer did not answer protected-tab state");
      assert(protectedTabsAnswerRendered, "Protected-tab answer was not rendered from latest run state");

      await submitSidepanelComposer(cdp, "read later");
      const readLaterAnswerRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const text = panel?.textContent || "";
            return Boolean(panel && !panel.hidden && /read-later tabs|稍后看的标签页|稍后阅读候选/.test(text));
          })()`
        );
      }, "Sidebar composer did not answer read-later candidates");
      assert(readLaterAnswerRendered, "Read-later answer was not rendered from latest local snapshot");

      await submitSidepanelComposer(cdp, "how much memory did you save?");
      const optimizationAnswerRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const text = panel?.textContent || "";
            return Boolean(
              panel &&
              !panel.hidden &&
              /Optimization result|本次优化/.test(text) &&
              /will not invent a memory number|不会编一个内存数字/.test(text) &&
              panel.querySelector(".chat-optimization-card .agent-result-list") &&
              panel.querySelector(".chat-thread-message.assistant.optimization .chat-optimization-card") &&
              panel.querySelector('[data-chat-action="quick-command"][data-command="show groups"]')
            );
          })()`
        );
      }, "Sidebar composer did not answer optimization and memory-relief state");
      assert(optimizationAnswerRendered, "Optimization/memory-relief answer was not rendered from latest local snapshot");

      await submitSidepanelComposer(cdp, "show groups");
      const groupAnswerRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const text = panel?.textContent || "";
            return Boolean(panel && !panel.hidden && /Current groups|当前分组/.test(text));
          })()`
        );
      }, "Sidebar composer did not answer latest group state");
      assert(groupAnswerRendered, "Group answer was not rendered from latest run state");

      await submitSidepanelComposer(cdp, "did AI classify this?");
      const aiAnswerRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const text = panel?.textContent || "";
            return Boolean(panel && !panel.hidden && /DeepSeek helped classify|AI classification is not active|AI was not used successfully|AI returned no usable groups|DeepSeek 参与了|没有启用 AI 分类|AI 没有成功使用|AI 没有返回可用分组/.test(text));
          })()`
        );
      }, "Sidebar composer did not answer AI status from latest run state");
      assert(aiAnswerRendered, "AI status answer was not rendered from latest run state");

      await submitSidepanelComposer(cdp, "find github");
      const tabSearchRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const text = panel?.textContent || "";
            return Boolean(
              panel &&
              !panel.hidden &&
              /matching|匹配/.test(text) &&
              panel.querySelector('[data-chat-action="focus-tab"]')
            );
          })()`
        );
      }, "Sidebar composer did not render tab search results");
      assert(tabSearchRendered, "Tab search results were not rendered");

      const tabSearchClickState = await evaluate(
        cdp,
        `new Promise((resolve) => {
          const delay = (ms) => new Promise((done) => setTimeout(done, ms));
          const messages = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.tab-search"));
          const latestMessage = messages[messages.length - 1];
          const button = latestMessage?.querySelector('[data-chat-action="focus-tab"]');

          if (!button) {
            resolve({ ok: false, reason: "missing-button" });
            return;
          }

          const tabId = Number(button.dataset.tabId);
          button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));

          (async () => {
            await delay(1000);
            const tab = Number.isInteger(tabId) ? await chrome.tabs.get(tabId).catch(() => null) : null;
            const activeTabsInWindow = tab?.windowId ? await chrome.tabs.query({ active: true, windowId: tab.windowId }) : [];
            const text = document.querySelector("#chatPanel")?.textContent || "";

            resolve({
              ok: Number.isInteger(tabId),
              tabId,
              buttonDisabled: button.disabled,
              tabUrl: tab?.url || "",
              tabActive: Boolean(tab?.active),
              activeTabIdsInWindow: activeTabsInWindow.map((item) => item.id),
              openedMessage: /Opened tab|已打开标签页/.test(text),
              errorMessage: /could not open|无法打开/.test(text)
            });
          })().catch((error) => resolve({ ok: false, reason: error?.message || String(error) }));
        })`
      );
      assert(tabSearchClickState?.ok, `Tab search Open action did not expose a valid target tab id: ${JSON.stringify(tabSearchClickState)}`);
      const focusedGithubTab = await waitFor(async () => {
        const tabAfterSearch = await evaluate(cdp, `chrome.tabs.get(${JSON.stringify(tabSearchClickState.tabId)}).catch(() => null)`);
        if (!tabAfterSearch || !String(tabAfterSearch.url || "").includes("github.com")) return null;

        const activeTabsInWindow = await evaluate(cdp, `chrome.tabs.query({ active: true, windowId: ${JSON.stringify(tabAfterSearch.windowId)} })`);
        return activeTabsInWindow.some((tab) => tab.id === tabAfterSearch.id) ? tabAfterSearch : null;
      }, `Sidebar tab search Open action did not focus a matching tab: ${JSON.stringify(tabSearchClickState)}`);
      assert(focusedGithubTab, "Tab search Open action did not focus a GitHub tab");

      const dashboardActionsPage = await createTarget(port, `chrome-extension://${extensionId}/dashboard.html`);
      const dashboardActionsCdp = await CDPSession.connect(dashboardActionsPage.webSocketDebuggerUrl);

      try {
        await waitForPageReady(dashboardActionsCdp);
        await waitForExtensionApis(dashboardActionsCdp);

        const dashboardRestoreClicked = await waitFor(async () => {
          return evaluate(
            dashboardActionsCdp,
            `(() => {
              const button = document.querySelector("#dashboardRestoreButton");

              if (!button || button.disabled) return false;

              button.click();
              return true;
            })()`
          );
        }, "Dashboard Restore Closed action was not enabled");
        assert(dashboardRestoreClicked, "Dashboard Restore Closed action was not clicked");

        const dashboardRestoreRun = await waitForCurrentRunStatus(cdp, "closed-restored", "Dashboard Restore Closed action did not complete");
        assert(dashboardRestoreRun.summary.restoredClosedTabs >= 1, "Dashboard Restore Closed did not restore any duplicate tabs");

        await submitSidepanelComposer(cdp, "organize again");
        const dashboardUndoSeedRun = await waitForCurrentRunStatus(cdp, "completed", "Organize Again before Dashboard Undo did not complete", 45000);
        assert(dashboardUndoSeedRun.summary.undoAvailable, "Organize Again should make Dashboard Undo available");

        await evaluate(dashboardActionsCdp, `document.querySelector("#workspaceRefreshButton")?.click()`);
        const dashboardUndoClicked = await waitFor(async () => {
          return evaluate(
            dashboardActionsCdp,
            `(() => {
              const button = document.querySelector("#dashboardUndoButton");

              if (!button || button.disabled) return false;

              button.click();
              return true;
            })()`
          );
        }, "Dashboard Undo action was not enabled");
        assert(dashboardUndoClicked, "Dashboard Undo action was not clicked");

        const dashboardUndoRun = await waitForCurrentRunStatus(cdp, "undone", "Dashboard Undo action did not complete");
        assertEqual(dashboardUndoRun.summary.undoAvailable, false, "Dashboard Undo should clear undo availability");
      } finally {
        dashboardActionsCdp.close();
      }

      console.log("PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, context-aware composer state, selected-tabs context tool card, selected-tabs follow-up routing, ephemeral chat thread, capability answer, open-ended chat fallback, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open");
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
    await stopChrome(chrome);
    await stopSyntheticContentServer(syntheticContentServer?.server);
    await removePathWithRetry(profileDir);
    await removePathWithRetry(extensionDir);
  }
}

async function runSelectedTabsContextRuntimeProbe(cdp, run) {
  const targetGroup = (run.groups || []).find((group) => Array.isArray(group.tabIds) && group.tabIds.length >= 2);
  assert(targetGroup, "Could not find a synthetic group with multiple tabs for selected-tabs context probe");

  const selectedTabIds = targetGroup.tabIds.slice(0, 4);
  await evaluate(
    cdp,
    `chrome.storage.local.set({
      "tabmosaic.sidebarContext": {
        scope: "selected_tabs",
        tabIds: ${JSON.stringify(selectedTabIds)},
        tabCount: ${selectedTabIds.length},
        windowId: ${JSON.stringify(targetGroup.windowId || run.activeWindowId || null)},
        groupName: ${JSON.stringify(targetGroup.name || "Selected tabs")},
        title: "Selected runtime tabs",
        source: "runtime-smoke",
        updatedAt: new Date().toISOString()
      }
    })`
  );

  const contextRendered = await waitFor(async () => {
    return evaluate(
      cdp,
      `(() => {
        const bar = document.querySelector("#agentContextBar");
        const text = bar?.textContent || "";
        return Boolean(bar && bar.dataset.contextScope === "selected_tabs" && /Selected tabs/.test(text));
      })()`
    );
  }, "Sidebar did not render selected-tabs context before context Agent probe");
  assert(contextRendered, "Selected-tabs sidebar context did not render");

  const toolCardsBefore = await evaluate(cdp, `document.querySelectorAll("#chatPanel .chat-thread-message.assistant.tool-card").length`);
  const contextAnswersBefore = await evaluate(cdp, `document.querySelectorAll("#chatPanel .chat-thread-message.assistant.context-summary").length`);
  await submitSidepanelComposer(cdp, "What are these selected tabs about?");

  const contextResult = await waitFor(async () => {
    return evaluate(
      cdp,
      `(() => {
        const toolCards = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant.tool-card"));
        const summaries = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant.context-summary"));
        if (toolCards.length <= ${Number(toolCardsBefore)} || summaries.length <= ${Number(contextAnswersBefore)}) return null;

        const toolCard = toolCards[toolCards.length - 1];
        const summary = summaries[summaries.length - 1];
        return {
          toolText: (toolCard.textContent || "").replace(/\\s+/g, " ").trim(),
          summaryText: (summary.textContent || "").replace(/\\s+/g, " ").trim(),
          hasToolCard: Boolean(toolCard.querySelector(".agent-tool-card")),
          hasAnswerCard: Boolean(summary.querySelector(".context-tabs-card")),
          contextScope: document.querySelector("#agentContextBar")?.dataset.contextScope || ""
        };
      })()`
    );
  }, "Selected-tabs context Agent did not render a tool card and assistant answer", 30000);

  assert(contextResult.hasToolCard, "Selected-tabs context flow did not render the tool card component");
  assert(contextResult.hasAnswerCard, "Selected-tabs context flow did not render the context summary card");
  assertEqual(contextResult.contextScope, "selected_tabs", "Selected-tabs context flow lost sidebar scope");
  assert(/Read selected tabs|Read group pages/.test(contextResult.toolText), "Selected-tabs tool card did not identify the read tool");
  assert(/\d+\/\d+ tabs/.test(contextResult.toolText), "Selected-tabs tool card did not show read/request counts");
  assert(/Visible text only/.test(contextResult.toolText), "Selected-tabs tool card did not disclose visible-text boundary");
  assert(/Session-only/.test(contextResult.toolText), "Selected-tabs tool card did not disclose session-only storage");
  assert(contextResult.summaryText.length > 40, "Selected-tabs context answer was too short");
  assert(!/https?:\/\//i.test(contextResult.summaryText), "Selected-tabs context answer leaked a full URL");
  assert(!/\btabId\b|\bgroupId\b|\bwindow\s+\d+\b/i.test(contextResult.summaryText), "Selected-tabs context answer leaked internal ids");

  const followUpToolCardsBefore = await evaluate(cdp, `document.querySelectorAll("#chatPanel .chat-thread-message.assistant.tool-card").length`);
  const followUpContextAnswersBefore = await evaluate(cdp, `document.querySelectorAll("#chatPanel .chat-thread-message.assistant.context-summary").length`);
  await submitSidepanelComposer(cdp, "Which one should I review first?");

  const followUpResult = await waitFor(async () => {
    return evaluate(
      cdp,
      `(() => {
        const toolCards = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant.tool-card"));
        const summaries = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant.context-summary"));
        if (toolCards.length <= ${Number(followUpToolCardsBefore)} || summaries.length <= ${Number(followUpContextAnswersBefore)}) return null;

        const latestTool = toolCards[toolCards.length - 1];
        const latestSummary = summaries[summaries.length - 1];
        const text = (latestSummary.textContent || "").replace(/\\s+/g, " ").trim();

        return {
          toolText: (latestTool.textContent || "").replace(/\\s+/g, " ").trim(),
          summaryText: text,
          hasToolCard: Boolean(latestTool.querySelector(".agent-tool-card")),
          hasAnswerCard: Boolean(latestSummary.querySelector(".context-tabs-card")),
          userFollowUpRendered: /Which one should I review first\\?/.test(document.querySelector("#chatPanel")?.textContent || "")
        };
      })()`
    );
  }, "Selected-tabs context follow-up did not stay in the multi-tab Page Agent flow", 30000);

  assert(followUpResult.userFollowUpRendered, "Selected-tabs follow-up user message was not rendered");
  assert(followUpResult.hasToolCard, "Selected-tabs follow-up did not render a tool card");
  assert(followUpResult.hasAnswerCard, "Selected-tabs follow-up did not render a context answer card");
  assert(/Read selected tabs|Read group pages/.test(followUpResult.toolText), "Selected-tabs follow-up tool card did not identify the read tool");
  assert(followUpResult.summaryText.length > 40, "Selected-tabs follow-up answer was too short");
  assert(!/https?:\/\//i.test(followUpResult.summaryText), "Selected-tabs follow-up answer leaked a full URL");
  assert(!/\btabId\b|\bgroupId\b|\bwindow\s+\d+\b/i.test(followUpResult.summaryText), "Selected-tabs follow-up answer leaked internal ids");

  await evaluate(
    cdp,
    `chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([tab]) => chrome.storage.local.set({
      "tabmosaic.sidebarContext": {
        scope: "current_tab",
        tabId: tab?.id || null,
        windowId: tab?.windowId || null,
        title: tab?.title || "Current tab",
        hostname: (() => {
          try { return new URL(tab?.url || "").hostname; } catch { return ""; }
        })(),
        source: "runtime-smoke-reset",
        updatedAt: new Date().toISOString()
      }
    }))`
  );
}

async function runSyntheticContentRuntimeProbe(port, cdp, syntheticContentServer) {
  assert(syntheticContentServer?.origin, "Synthetic content server was not started");

  for (const page of SYNTHETIC_CONTENT_PAGES) {
    await createTarget(port, `${syntheticContentServer.origin}${page.path}`);
  }

  const syntheticTabs = await waitFor(async () => {
    const tabs = await evaluate(cdp, "chrome.tabs.query({})");
    const tabsByPath = new Map();

    for (const tab of tabs) {
      try {
        const url = new URL(tab.url || "");
        if (url.hostname === SYNTHETIC_CONTENT_HOST) {
          tabsByPath.set(url.pathname, tab);
        }
      } catch {
        // Ignore non-URL extension targets.
      }
    }

    const orderedTabs = SYNTHETIC_CONTENT_PAGES.map((page) => tabsByPath.get(page.path)).filter(Boolean);
    return orderedTabs.length === SYNTHETIC_CONTENT_PAGES.length ? orderedTabs : null;
  }, "Synthetic HTTP content tabs did not open");
  const selectedTabIds = syntheticTabs.map((tab) => tab.id);

  await evaluate(
    cdp,
    `chrome.storage.local.set({
      "tabmosaic.aiSettings": { enabled: false },
      "tabmosaic.sidebarContext": {
        scope: "selected_tabs",
        tabIds: ${JSON.stringify(selectedTabIds)},
        tabCount: ${selectedTabIds.length},
        windowId: ${JSON.stringify(syntheticTabs[0]?.windowId || null)},
        title: "Synthetic runtime content",
        source: "runtime-synthetic-content",
        updatedAt: new Date().toISOString()
      }
    })`
  );

  const contextRendered = await waitFor(async () => {
    return evaluate(
      cdp,
      `(() => {
        const bar = document.querySelector("#agentContextBar");
        const text = bar?.textContent || "";
        return Boolean(bar && bar.dataset.contextScope === "selected_tabs" && /Selected tabs/.test(text));
      })()`
    );
  }, "Sidebar did not render selected-tabs context before synthetic content probe");
  assert(contextRendered, "Synthetic selected-tabs context did not render");

  const toolCardsBefore = await evaluate(cdp, `document.querySelectorAll("#chatPanel .chat-thread-message.assistant.tool-card").length`);
  const contextAnswersBefore = await evaluate(cdp, `document.querySelectorAll("#chatPanel .chat-thread-message.assistant.context-summary").length`);
  await submitSidepanelComposerTrusted(cdp, "What do ORBITALPLANNING BUGLANTERN and GLASSHARBOR say in these selected tabs?");

  const contextResult = await waitFor(async () => {
    return evaluate(
      cdp,
      `(() => {
        const toolCards = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant.tool-card"));
        const summaries = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant.context-summary"));
        if (toolCards.length <= ${Number(toolCardsBefore)} || summaries.length <= ${Number(contextAnswersBefore)}) return null;

        const toolCard = toolCards[toolCards.length - 1];
        const summary = summaries[summaries.length - 1];
        return {
          toolText: (toolCard.textContent || "").replace(/\\s+/g, " ").trim(),
          summaryText: (summary.textContent || "").replace(/\\s+/g, " ").trim(),
          hasToolCard: Boolean(toolCard.querySelector(".agent-tool-card")),
          hasAnswerCard: Boolean(summary.querySelector(".context-tabs-card"))
        };
      })()`
    );
  }, "Synthetic selected-tabs content Agent did not read HTTP page text", 30000);

  assert(contextResult.hasToolCard, "Synthetic content flow did not render a tool card");
  assert(contextResult.hasAnswerCard, "Synthetic content flow did not render a context answer card");
  assert(/3\/3 tabs/.test(contextResult.toolText), `Synthetic content tool card did not show 3/3 reads: ${contextResult.toolText}`);
  assert(/Visible text only/.test(contextResult.toolText), "Synthetic content tool card did not disclose visible-text boundary");
  assert(/Session-only/.test(contextResult.toolText), "Synthetic content tool card did not disclose session-only storage");
  assert(/ORBITALPLANNING/.test(contextResult.summaryText), "Synthetic content answer did not include product page visible text");
  assert(/BUGLANTERN/.test(contextResult.summaryText), "Synthetic content answer did not include QA/debug visible text");
  assert(/GLASSHARBOR/.test(contextResult.summaryText), "Synthetic content answer did not include design visible text");
  assert(!/https?:\/\//i.test(contextResult.summaryText), "Synthetic content answer leaked a full URL");
  assert(!/\btabId\b|\bgroupId\b|\bwindow\s+\d+\b/i.test(contextResult.summaryText), "Synthetic content answer leaked internal ids");

  const contentCardsBefore = await evaluate(cdp, `document.querySelectorAll("#chatPanel .content-regroup-card").length`);
  const regroupToolCardsBefore = await evaluate(cdp, `document.querySelectorAll("#chatPanel .chat-thread-message.assistant.tool-card").length`);
  await submitSidepanelComposerTrusted(cdp, "Regroup these selected tabs by actual page content");

  const regroupPreview = await waitFor(async () => {
    return evaluate(
      cdp,
      `chrome.storage.local.get("tabmosaic.chatDraft").then((stored) => {
        const draft = stored["tabmosaic.chatDraft"];
        const toolCards = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant.tool-card"));
        const cards = Array.from(document.querySelectorAll("#chatPanel .content-regroup-card"));
        if (!draft || toolCards.length <= ${Number(regroupToolCardsBefore)} || cards.length <= ${Number(contentCardsBefore)}) return null;

        const toolCard = toolCards[toolCards.length - 1];
        const card = cards[cards.length - 1];
        const applyButton = card.querySelector('[data-chat-action="apply"]');
        return {
          toolText: (toolCard.textContent || "").replace(/\\s+/g, " ").trim(),
          text: (card.textContent || "").replace(/\\s+/g, " ").trim(),
          groupCount: Array.isArray(draft.groups) ? draft.groups.length : 0,
          draftId: applyButton?.dataset.draftId || ""
        };
      })`
    );
  }, "Synthetic content regroup preview did not render", 30000);

  assert(/3\/3 tabs/.test(regroupPreview.toolText), `Synthetic regroup tool card did not show 3/3 reads: ${regroupPreview.toolText}`);
  assert(regroupPreview.groupCount >= 3, `Synthetic regroup preview should show at least 3 groups: ${regroupPreview.text}`);
  assert(/Product Planning/.test(regroupPreview.text), "Synthetic regroup preview did not include Product Planning");
  assert(/Debugging/.test(regroupPreview.text), "Synthetic regroup preview did not include Debugging");
  assert(/Design Review/.test(regroupPreview.text), "Synthetic regroup preview did not include Design Review");
  assert(regroupPreview.draftId, "Synthetic regroup preview did not expose a draft id");
  assert(!/https?:\/\//i.test(regroupPreview.text), "Synthetic regroup preview leaked a full URL");

  const tabsBeforeApply = await evaluate(cdp, "chrome.tabs.query({})");
  await evaluate(
    cdp,
    `(() => {
      const cards = Array.from(document.querySelectorAll("#chatPanel .content-regroup-card"));
      const latest = cards[cards.length - 1];
      const applyButton = latest?.querySelector('[data-chat-action="apply"]');
      if (!applyButton) throw new Error("Synthetic regroup Apply button disappeared");
      applyButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      return true;
    })()`
  );

  const applied = await waitFor(async () => {
    const groups = await evaluate(cdp, "chrome.tabGroups.query({})");
    const tabs = await evaluate(cdp, "chrome.tabs.query({})");
    const syntheticTabsAfter = tabs.filter((tab) => selectedTabIds.includes(tab.id));
    const groupById = new Map(groups.map((group) => [group.id, group]));
    const titles = syntheticTabsAfter
      .map((tab) => groupById.get(tab.groupId)?.title || "")
      .filter(Boolean);

    return titles.includes("Product Planning") && titles.includes("Debugging") && titles.includes("Design Review")
      ? { tabs, titles }
      : null;
  }, "Synthetic content regroup Apply did not create native groups", 30000);

  assertEqual(applied.tabs.length, tabsBeforeApply.length, "Synthetic content regroup must not close tabs");

  console.log("PASS Chrome runtime read synthetic HTTP page content with a temporary fixture host grant, rendered content regroup preview, and applied native groups");
}

async function runRealAIContentRegroupScreenshot(port, extensionId, syntheticContentServer) {
  assert(syntheticContentServer?.origin, "Synthetic content server was not started");
  const aiSettings = getDeepSeekSettingsFromEnv();

  for (const page of SYNTHETIC_CONTENT_PAGES) {
    await createTarget(port, `${syntheticContentServer.origin}${page.path}`);
  }

  const extensionPage = await createTarget(port, `chrome-extension://${extensionId}/sidepanel.html`);
  console.log(`Opened extension page ${extensionPage.url}`);
  const cdp = await CDPSession.connect(extensionPage.webSocketDebuggerUrl);

  try {
    await cdp.send("Page.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: SIDEPANEL_SCREENSHOT_VIEWPORT.width,
      height: SIDEPANEL_SCREENSHOT_VIEWPORT.height,
      deviceScaleFactor: 1,
      mobile: false
    });
    await waitForPageReady(cdp);
    await waitForExtensionApis(cdp);

    const syntheticTabs = await waitFor(async () => {
      const tabs = await evaluate(cdp, "chrome.tabs.query({})");
      const tabsByPath = new Map();

      for (const tab of tabs) {
        try {
          const url = new URL(tab.url || "");
          if (url.hostname === SYNTHETIC_CONTENT_HOST) {
            tabsByPath.set(url.pathname, tab);
          }
        } catch {
          // Ignore non-URL extension targets.
        }
      }

      const orderedTabs = SYNTHETIC_CONTENT_PAGES.map((page) => tabsByPath.get(page.path)).filter(Boolean);
      return orderedTabs.length === SYNTHETIC_CONTENT_PAGES.length ? orderedTabs : null;
    }, "Synthetic HTTP content tabs did not open");
    const selectedTabIds = syntheticTabs.map((tab) => tab.id);
    const selectedTabsContext = {
      scope: "selected_tabs",
      tabIds: selectedTabIds,
      tabCount: selectedTabIds.length,
      windowId: syntheticTabs[0]?.windowId || null,
      title: "Runtime content tabs",
      source: "real-ai-content-regroup-screenshot"
    };

    await evaluate(
      cdp,
      `chrome.storage.local.set({
        "tabmosaic.aiSettings": {
          enabled: true,
          provider: "deepseek",
          baseUrl: ${JSON.stringify(aiSettings.baseUrl)},
          model: ${JSON.stringify(aiSettings.model)},
          apiKey: ${JSON.stringify(aiSettings.apiKey)}
        },
        "tabmosaic.sidebarContext": {
          ...${JSON.stringify(selectedTabsContext)},
          updatedAt: new Date().toISOString()
        }
      })`
    );

    const contextRendered = await waitFor(async () => {
      return evaluate(
        cdp,
        `(async () => {
          const bar = document.querySelector("#agentContextBar");
          const text = bar?.textContent || "";
          if (bar && bar.dataset.contextScope === "selected_tabs" && /Selected tabs/.test(text)) return true;
          await chrome.storage.local.set({
            "tabmosaic.sidebarContext": {
              ...${JSON.stringify(selectedTabsContext)},
              updatedAt: new Date().toISOString()
            }
          });
          return false;
        })()`
      );
    }, "Sidebar did not render selected-tabs context before real AI content regroup screenshot");
    assert(contextRendered, "Selected-tabs context did not render");

    const contextSummariesBefore = await evaluate(cdp, `document.querySelectorAll("#chatPanel .context-tabs-message").length`);
    const contextToolCardsBefore = await evaluate(cdp, `document.querySelectorAll("#chatPanel .chat-thread-message.assistant.tool-card").length`);
    await submitSidepanelComposerTrusted(cdp, "What are these selected tabs about?");

    const contextAnswer = await waitFor(async () => {
      return evaluate(
        cdp,
        `(() => {
          const toolCards = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant.tool-card"));
          const summaries = Array.from(document.querySelectorAll("#chatPanel .context-tabs-message"));
          if (toolCards.length <= ${Number(contextToolCardsBefore)} || summaries.length <= ${Number(contextSummariesBefore)}) return null;

          const toolCard = toolCards[toolCards.length - 1];
          const summary = summaries[summaries.length - 1];
          return {
            toolText: (toolCard.textContent || "").replace(/\\s+/g, " ").trim(),
            text: (summary.textContent || "").replace(/\\s+/g, " ").trim(),
            provider: summary.dataset.provider || "",
            aiUsed: summary.dataset.aiUsed === "true"
          };
        })()`
      );
    }, "Real AI selected-tabs context answer did not render", 45000);

    assert(contextAnswer.aiUsed, `Selected-tabs answer fell back to local mode: ${JSON.stringify(contextAnswer)}`);
    assert(contextAnswer.provider === "deepseek", `Expected DeepSeek provider for selected-tabs answer, got ${contextAnswer.provider || "empty"}`);
    assert(/3\/3 tabs/.test(contextAnswer.toolText), `Selected-tabs tool card did not show 3/3 reads: ${contextAnswer.toolText}`);
    assert(/Product|Planning|Roadmap/i.test(contextAnswer.text), "Selected-tabs answer did not include product/planning content");
    assert(/Debug|QA|Release|Incident/i.test(contextAnswer.text), "Selected-tabs answer did not include QA/debug content");
    assert(/Design|Interface|Review|UX|UI/i.test(contextAnswer.text), "Selected-tabs answer did not include design content");
    assert(!/https?:\/\//i.test(contextAnswer.text), "Selected-tabs answer leaked a full URL");

    await scrollAgentThreadToBottom(cdp);
    fs.mkdirSync(REAL_AI_ARTIFACT_DIR, { recursive: true });
    const contextScreenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true
    });
    fs.writeFileSync(REAL_AI_CONTEXT_TABS_SCREENSHOT, Buffer.from(contextScreenshot.data, "base64"));

    const contentCardsBefore = await evaluate(cdp, `document.querySelectorAll("#chatPanel .content-regroup-card").length`);
    const toolCardsBefore = await evaluate(cdp, `document.querySelectorAll("#chatPanel .chat-thread-message.assistant.tool-card").length`);
    await submitSidepanelComposerTrusted(cdp, "Regroup these selected tabs by actual page content");

    const regroupPreview = await waitFor(async () => {
      return evaluate(
      cdp,
      `chrome.storage.local.get("tabmosaic.chatDraft").then((stored) => {
          const draft = stored["tabmosaic.chatDraft"];
          const toolCards = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant.tool-card"));
          const cards = Array.from(document.querySelectorAll("#chatPanel .content-regroup-card"));
          if (!draft || toolCards.length <= ${Number(toolCardsBefore)} || cards.length <= ${Number(contentCardsBefore)}) return null;

          const toolCard = toolCards[toolCards.length - 1];
          const card = cards[cards.length - 1];
          return {
            toolText: (toolCard.textContent || "").replace(/\\s+/g, " ").trim(),
            text: (card.textContent || "").replace(/\\s+/g, " ").trim(),
            groupCount: Array.isArray(draft.groups) ? draft.groups.length : 0,
            provider: draft.provider || "",
            aiUsed: Boolean(draft.aiUsed),
            aiError: draft.aiError || "",
            groupNames: Array.isArray(draft.groups) ? draft.groups.map((group) => group.name || "") : []
          };
        })`
      );
    }, "Real AI content regroup preview did not render", 45000);

    assert(regroupPreview.aiUsed, `Regroup preview fell back to local mode: ${JSON.stringify(regroupPreview)}`);
    assert(regroupPreview.provider === "deepseek", `Expected DeepSeek provider, got ${regroupPreview.provider || "empty"}`);
    assert(/3\/3 tabs/.test(regroupPreview.toolText), `Regroup tool card did not show 3/3 reads: ${regroupPreview.toolText}`);
    assert(regroupPreview.groupCount >= 3, `Regroup preview should show at least 3 groups: ${regroupPreview.text}`);
    assert(/Product|Planning|Roadmap/i.test(regroupPreview.text), "Regroup preview did not include product/planning content");
    assert(/Debug|QA|Release|Incident/i.test(regroupPreview.text), "Regroup preview did not include QA/debug content");
    assert(/Design|Interface|Review|UX|UI/i.test(regroupPreview.text), "Regroup preview did not include design content");
    assert(!/https?:\/\//i.test(regroupPreview.text), "Regroup preview leaked a full URL");

    await scrollAgentThreadToBottom(cdp);

    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true
    });
    fs.writeFileSync(REAL_AI_CONTENT_REGROUP_SCREENSHOT, Buffer.from(screenshot.data, "base64"));

    console.log("PASS real AI content regroup screenshot captured");
    console.log(`provider=${regroupPreview.provider}`);
    console.log(`aiUsed=${regroupPreview.aiUsed}`);
    console.log(`readTabs=3`);
    console.log(`contextScreenshot=${path.relative(ROOT_DIR, REAL_AI_CONTEXT_TABS_SCREENSHOT)}`);
    console.log(`groups=${regroupPreview.groupNames.join(" | ")}`);
    console.log(`screenshot=${path.relative(ROOT_DIR, REAL_AI_CONTENT_REGROUP_SCREENSHOT)}`);
  } finally {
    cdp.close();
  }
}

async function scrollAgentThreadToBottom(cdp) {
  await evaluate(
    cdp,
    `(() => {
      const thread = document.querySelector(".agent-thread");
      if (thread) {
        thread.scrollTop = thread.scrollHeight;
        thread.dispatchEvent(new Event("scroll", { bubbles: true }));
      }
      return true;
    })()`
  );
  await delay(250);
}

async function runDeepSeekAgentFlow(cdp) {
  const aiSettings = getDeepSeekSettingsFromEnv();

  await evaluate(
    cdp,
    `chrome.storage.local.set({
      "tabmosaic.aiSettings": {
        enabled: true,
        provider: "deepseek",
        baseUrl: ${JSON.stringify(aiSettings.baseUrl)},
        model: ${JSON.stringify(aiSettings.model)},
        apiKey: ${JSON.stringify(aiSettings.apiKey)}
      }
    })`
  );

  await submitSidepanelComposer(cdp, "Which tabs should I focus on for Chrome extension planning?");

  let agentAnswer;
  try {
    agentAnswer = await waitFor(async () => {
      return evaluate(
        cdp,
        `(() => {
          const messages = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant.ai-agent"));
          const latest = messages[messages.length - 1];
          const text = latest?.textContent || "";

          if (!latest || /could not get an AI tab answer|没能拿到 AI 标签页回答/i.test(text)) {
            return null;
          }

          return {
            text,
            hasCard: Boolean(latest.querySelector(".ai-agent-card")),
            tabRows: latest.querySelectorAll(".chat-tab-row").length,
            hasSeparateNextSteps: /Suggested next steps|建议下一步/.test(text),
            actionButtons: latest.querySelectorAll('[data-chat-action="quick-command"]').length
          };
        })()`
      );
    }, "Sidebar DeepSeek Agent flow did not return an assistant metadata answer", 30000);
  } catch (error) {
    const chatDebug = await evaluate(
      cdp,
      `(() => Array.from(document.querySelectorAll("#chatPanel .chat-thread-message"))
        .slice(-6)
        .map((node) => ({
          className: node.className,
          text: (node.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 260)
        })))()`
    );
    throw new Error(`${error.message}. Last chat messages: ${JSON.stringify(chatDebug)}`);
  }

  assert(agentAnswer.hasCard, "DeepSeek Agent answer did not render as an assistant card");
  assert(!agentAnswer.hasSeparateNextSteps, "DeepSeek Agent answer should not render a separate suggested-next-steps panel");
  assertEqual(agentAnswer.tabRows, 0, "DeepSeek Agent open answer should not render tab rows");
  assertEqual(agentAnswer.actionButtons, 0, "DeepSeek Agent open answer should not render action chips");
  assert(!/fullUrl|restoreUrl|pageText|token=abc|window\s+\d+|tabId|groupId/i.test(agentAnswer.text), "DeepSeek Agent answer leaked sensitive field names, fixture token text, or internal ids");

  const agentMessageCountBeforeFollowUp = await evaluate(
    cdp,
    `document.querySelectorAll("#chatPanel .chat-thread-message.assistant.ai-agent").length`
  );
  await submitSidepanelComposer(cdp, "Why those tabs?");

  let followUpAnswer;
  try {
    followUpAnswer = await waitFor(async () => {
      return evaluate(
        cdp,
        `(() => {
          const messages = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant.ai-agent"));
          if (messages.length <= ${Number(agentMessageCountBeforeFollowUp)}) return null;

          const latest = messages[messages.length - 1];
          const text = latest?.textContent || "";

          if (!latest || /could not get an AI tab answer|没能拿到 AI 标签页回答/i.test(text)) {
            return null;
          }

          return {
            text,
            hasCard: Boolean(latest.querySelector(".ai-agent-card")),
            actionButtons: latest.querySelectorAll('[data-chat-action="quick-command"]').length
          };
        })()`
      );
    }, "Sidebar DeepSeek Agent flow did not answer a follow-up message with short-term context", 30000);
  } catch (error) {
    const chatDebug = await evaluate(
      cdp,
      `(() => Array.from(document.querySelectorAll("#chatPanel .chat-thread-message"))
        .slice(-8)
        .map((node) => ({
          className: node.className,
          text: (node.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 320)
        })))()`
    );
    throw new Error(`${error.message}. Last chat messages: ${JSON.stringify(chatDebug)}`);
  }

  assert(followUpAnswer.hasCard, "DeepSeek Agent follow-up did not render as an assistant card");
  assertEqual(followUpAnswer.actionButtons, 0, "DeepSeek Agent follow-up should not render action chips");
  assert(!/fullUrl|restoreUrl|pageText|token=abc|window\s+\d+|tabId|groupId/i.test(followUpAnswer.text), "DeepSeek Agent follow-up leaked sensitive field names, fixture token text, or internal ids");

  const tabsBeforeDraftApply = await evaluate(cdp, "chrome.tabs.query({})");
  await submitSidepanelComposer(cdp, "Move the Chrome extension docs tabs into Extension Planning");

  let aiDraft;
  try {
    aiDraft = await waitFor(async () => {
      return evaluate(
        cdp,
        `(() => {
          const messages = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant"));
          const latest = messages[messages.length - 1];
          const text = (latest?.textContent || "").replace(/\\s+/g, " ").trim();
          const applyButton = latest?.querySelector('[data-chat-action="apply"]');

          if (!latest || !/Extension Planning/.test(text) || !applyButton) return null;

          return {
            text,
            draftId: applyButton.dataset.draftId || "",
            matchedRows: latest.querySelectorAll(".chat-tab-row").length,
            applyText: applyButton.textContent.trim()
          };
        })()`
      );
    }, "DeepSeek Agent did not return a validated Apply/Cancel move draft", 30000);
  } catch (error) {
    const chatDebug = await evaluate(
      cdp,
      `(() => Array.from(document.querySelectorAll("#chatPanel .chat-thread-message"))
        .slice(-8)
        .map((node) => ({
          className: node.className,
          text: (node.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 320)
        })))()`
    );
    throw new Error(`${error.message}. chat=${JSON.stringify(chatDebug)}`);
  }

  assert(aiDraft.draftId, "DeepSeek Agent move draft did not expose a draft id");
  assert(aiDraft.matchedRows >= 1, "DeepSeek Agent move draft did not render matched tab rows");

  await evaluate(
    cdp,
    `(() => {
      const messages = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant"));
      const latest = messages[messages.length - 1];
      const applyButton = latest?.querySelector('[data-chat-action="apply"]');
      if (!applyButton) throw new Error("AI draft Apply button disappeared");
      applyButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      return true;
    })()`
  );

  let appliedDraft;
  try {
    appliedDraft = await waitFor(async () => {
      const groups = await evaluate(cdp, "chrome.tabGroups.query({})");
      const tabs = await evaluate(cdp, "chrome.tabs.query({})");
      const targetGroup = groups.find((group) => /extension planning/i.test(group.title || ""));
      const targetTabs = targetGroup
        ? tabs.filter((tab) => tab.groupId === targetGroup.id)
        : [];

      return targetGroup && targetTabs.length >= 1
        ? { groupId: targetGroup.id, movedTabs: targetTabs.length, tabCount: tabs.length }
        : null;
    }, "DeepSeek Agent Apply did not move tabs into a native Extension Planning group", 30000);
  } catch (error) {
    const debugState = await evaluate(
      cdp,
      `Promise.all([
        chrome.tabGroups.query({}),
        chrome.tabs.query({}),
        chrome.storage.local.get("tabmosaic.currentRun")
      ]).then(([groups, tabs, run]) => ({
        groups: groups.map((group) => ({ id: group.id, title: group.title, windowId: group.windowId })),
        extensionPlanningTabs: tabs
          .filter((tab) => groups.some((group) => /extension planning/i.test(group.title || "") && group.id === tab.groupId))
          .map((tab) => ({ id: tab.id, groupId: tab.groupId, title: tab.title })),
        latestRunStatus: run["tabmosaic.currentRun"]?.status,
        latestRunMessage: run["tabmosaic.currentRun"]?.message
      }))`
    );
    throw new Error(`${error.message}. debug=${JSON.stringify(debugState)}`);
  }

  assertEqual(appliedDraft.tabCount, tabsBeforeDraftApply.length, "AI Agent move draft must not close tabs");

  console.log(
    `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards, tabRows=${agentAnswer.tabRows}, actionButtons=${agentAnswer.actionButtons}, followUp=yes, aiDraft=${aiDraft.matchedRows} tabs, aiDraftApplied=${appliedDraft.movedTabs} tabs`
  );
}

async function runLargeTabsRuntimeProbe(port, extensionId) {
  const testUrls = buildLargeRuntimeUrls(LARGE_TAB_COUNT);

  for (const url of testUrls) {
    await createTarget(port, url);
  }

  const extensionPage = await createTarget(port, `chrome-extension://${extensionId}/sidepanel.html`);
  console.log(`Opened extension page ${extensionPage.url}`);
  const cdp = await CDPSession.connect(extensionPage.webSocketDebuggerUrl);

  try {
    await waitForPageReady(cdp);
    await waitForExtensionApis(cdp);
    const startedAt = Date.now();
    const organizeResult = await evaluate(cdp, `
      chrome.runtime.sendMessage({ type: "ACCEPT_PRIVACY_AND_ORGANIZE" })
    `);
    const elapsedMs = Date.now() - startedAt;

    assert(organizeResult && organizeResult.ok, `Large-tab organize failed: ${JSON.stringify(organizeResult)}`);
    assertEqual(organizeResult.run.status, "completed", "Large-tab organize status");
    assert(organizeResult.run.summary.tabCount >= testUrls.length, "Large-tab run did not scan the synthetic tabs");
    assert(organizeResult.run.summary.groupsCreated >= 6, "Large-tab run should create several native groups");
    assert(organizeResult.run.summary.tabsMoved >= Math.floor(testUrls.length * 0.65), "Large-tab run should move most synthetic tabs");
    assert(organizeResult.run.summary.safeDuplicatesClosed >= 4, "Large-tab run should close safe exact/tracking duplicates");
    assert(organizeResult.run.summary.reviewDuplicateGroups >= 2, "Large-tab run should leave hash/query duplicates in review");
    assert(elapsedMs < 45000, `Large-tab organize took too long: ${elapsedMs}ms`);

    const groups = await evaluate(cdp, "chrome.tabGroups.query({})");
    const groupTitles = groups.map((group) => group.title).sort();

    assertGroupFamily(groupTitles, ["code review", "pr review", "pull request", "github pr", "app pr", "app prs", "review pages", "review tabs"], "code review");
    assertGroupFamily(groupTitles, ["chrome extension", "extension docs", "chrome docs", "browser extension", "chrome api", "api docs"], "Chrome extension docs");
    assertGroupFamily(groupTitles, ["docs & notes", "documents", "document", "google docs", "design docs", "tabmosaic docs", "not found docs"], "documents/notes");
    assertGroupFamily(groupTitles, ["product", "planning", "tasks"], "product/tasks");

    const runState = await evaluate(cdp, 'chrome.storage.local.get("tabmosaic.currentRun")');
    const storedRun = runState["tabmosaic.currentRun"];
    assert(storedRun?.snapshot?.tabs?.length >= testUrls.length, "Large-tab run should store a sanitized local snapshot");
    assert(
      storedRun.snapshot.tabs.every(
        (tab) =>
          !("restoreUrl" in tab) &&
          !("exactUrlHash" in tab) &&
          !("trackingUrlHash" in tab) &&
          !("reviewUrlHash" in tab) &&
          !("pageText" in tab) &&
          !("fullUrl" in tab)
      ),
      "Large-tab runtime snapshot retained sensitive URL/body fields"
    );

    console.log(
      `PASS Chrome runtime large-tab probe organized ${testUrls.length} synthetic tabs in ${elapsedMs}ms with ${organizeResult.run.summary.groupsCreated} groups, ${organizeResult.run.summary.tabsMoved} moved tabs, ${organizeResult.run.summary.safeDuplicatesClosed} safe duplicate closes, and ${organizeResult.run.summary.reviewDuplicateGroups} review duplicate groups`
    );
  } finally {
    cdp.close();
  }
}

function buildLargeRuntimeUrls(tabCount) {
  const count = Number.isFinite(tabCount) && tabCount >= 24 ? Math.floor(tabCount) : 96;
  const fixtures = [
    (index) => `https://github.com/acme/tabmosaic/pull/${1000 + index}`,
    (index) => `https://developer.chrome.com/docs/extensions/reference/api/tabs?sample=${index}`,
    (index) => `https://developer.chrome.com/docs/extensions/reference/api/tabGroups?sample=${index}`,
    (index) => `https://docs.google.com/document/d/synthetic-${index}/edit`,
    (index) => `https://linear.app/acme/issue/TAB-${index}/private-beta-polish`,
    (index) => `https://acme.slack.com/archives/C123/p${String(index).padStart(8, "0")}`,
    (index) => `https://www.youtube.com/watch?v=tabmosaic${index}tutorial`,
    (index) => `https://analytics.google.com/analytics/web/#/p${index}/reports`,
    (index) => `https://example.com/articles/tab-workflow-${index}`,
    (index) => `https://example.com/runtime-exact-${Math.floor(Math.floor(index / fixtures.length) / 2)}`,
    (index) =>
      `https://example.com/runtime-tracking-${Math.floor(Math.floor(index / fixtures.length) / 2)}?utm_source=qa&utm_campaign=${index}`,
    (index) =>
      `https://example.com/runtime-review-${Math.floor(Math.floor(index / fixtures.length) / 2)}#section-${Math.floor(index / fixtures.length) % 2}`
  ];
  const urls = [];

  for (let index = 0; index < count; index += 1) {
    urls.push(fixtures[index % fixtures.length](index));
  }

  return urls;
}

function getDeepSeekSettingsFromEnv() {
  const env = readEnv();
  const apiKey = normalizeApiKey(env.DEEPSEEK_API_KEY || env.OPENAI_COMPATIBLE_API_KEY || "");

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY in .env.local or environment for --agent-flow.");
  }

  return {
    apiKey,
    baseUrl: String(env.DEEPSEEK_BASE_URL || env.OPENAI_COMPATIBLE_BASE_URL || DEFAULT_AI_BASE_URL).trim() || DEFAULT_AI_BASE_URL,
    model: String(env.DEEPSEEK_MODEL || env.OPENAI_COMPATIBLE_MODEL || DEFAULT_AI_MODEL).trim() || DEFAULT_AI_MODEL
  };
}

function readEnv() {
  const fileEnv = {};

  if (fs.existsSync(ENV_PATH)) {
    const lines = fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;

      fileEnv[match[1]] = unquoteEnvValue(match[2].trim());
    }
  }

  return {
    ...fileEnv,
    ...process.env
  };
}

function unquoteEnvValue(value) {
  const trimmed = String(value || "").trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function normalizeApiKey(value) {
  return String(value || "")
    .trim()
    .replace(/[;\s]+$/g, "");
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

function addSyntheticContentHostPermission(extensionDir) {
  const manifestPath = path.join(extensionDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const hostPermission = `http://${SYNTHETIC_CONTENT_HOST}/*`;
  manifest.host_permissions = Array.from(new Set([...(manifest.host_permissions || []), hostPermission]));
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function startSyntheticContentServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const url = new URL(request.url || "/", `http://${SYNTHETIC_CONTENT_HOST}`);
      const page = SYNTHETIC_CONTENT_PAGES.find((item) => item.path === url.pathname);

      if (!page) {
        response.writeHead(404, {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store"
        });
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      });
      response.end(renderSyntheticContentPage(page));
    });

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        port: address.port,
        origin: `http://${SYNTHETIC_CONTENT_HOST}:${address.port}`
      });
    });
  });
}

function stopSyntheticContentServer(server) {
  if (!server) return Promise.resolve();

  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

function renderSyntheticContentPage(page) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.body.slice(0, 160))}">
  </head>
  <body>
    <main>
      <h1>${escapeHtml(page.heading)}</h1>
      <p>${escapeHtml(page.body)}</p>
    </main>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

async function submitSidepanelComposer(cdp, text) {
  return evaluate(
    cdp,
    `(() => {
      const input = document.querySelector("#chatInput");
      const form = document.querySelector("#chatForm");

      if (!input || !form) {
        throw new Error("Sidepanel composer is not available");
      }

      input.value = ${JSON.stringify(text)};
      input.dispatchEvent(new Event("input", { bubbles: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      return true;
    })()`
  );
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

async function waitForCurrentRunStatus(cdp, status, message, timeoutMs = 15000) {
  return waitFor(async () => {
    const result = await evaluate(cdp, 'chrome.storage.local.get("tabmosaic.currentRun")');
    const run = result["tabmosaic.currentRun"];
    return run?.status === status ? run : null;
  }, message, timeoutMs);
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

function assertGroupFamily(groupTitles, acceptableTitles, label) {
  const normalized = groupTitles.map((title) => String(title || "").trim().toLowerCase());
  const matched = acceptableTitles.some((title) => {
    const candidate = String(title || "").trim().toLowerCase();
    return normalized.some((groupTitle) => groupTitle === candidate || groupTitle.includes(candidate));
  });
  assert(matched, `Missing ${label} group. Saw: ${groupTitles.join(", ")}`);
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
