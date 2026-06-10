const childProcess = require("child_process");
const fs = require("fs");
const { createRequire } = require("module");
const net = require("net");
const os = require("os");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const ENV_PATH = path.join(ROOT_DIR, ".env.local");
const SHOULD_RUN_LARGE_TABS = process.argv.includes("--large-tabs");
const SHOULD_RUN_AGENT_FLOW = process.argv.includes("--agent-flow");
const LARGE_TAB_COUNT = Number(process.env.TABMOSAIC_LARGE_TAB_COUNT || 96);
const DEFAULT_AI_BASE_URL = "https://api.deepseek.com";
const DEFAULT_AI_MODEL = "deepseek-v4-flash";
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

      const groups = await evaluate(cdp, "chrome.tabGroups.query({})");
      const groupTitles = groups.map((group) => group.title).sort();
      assertGroupFamily(groupTitles, ["code review", "pr review", "pull request", "github pr", "review pages", "review tabs"], "code review");
      assertGroupFamily(groupTitles, ["chrome extension", "extension docs", "chrome docs", "browser extension", "chrome api", "api docs"], "Chrome extension docs");
      assertGroupFamily(groupTitles, ["docs & notes", "documents", "document", "google docs", "design docs", "not found docs"], "documents/notes");

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
              /Current page|当前页面/.test(text) &&
              /cannot be read|could not|classify it from title/i.test(text)
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
              /Question|问题/.test(text) &&
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

      await evaluate(cdp, `document.querySelector("#summaryButton")?.click()`);
      const quickActionThreaded = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const userMessages = Array.from(panel?.querySelectorAll(".chat-thread-message.user") || []);
            const assistantMessages = Array.from(panel?.querySelectorAll(".chat-thread-message.assistant") || []);
            return Boolean(
              userMessages.some((node) => /Summarize Current Tab|总结当前标签页/.test(node.textContent || "")) &&
              assistantMessages.some((node) => /Current page|当前页面/.test(node.textContent || ""))
            );
          })()`
        );
      }, "Sidebar quick action did not enter the chat message thread");
      assert(quickActionThreaded, "Quick action did not preserve user and assistant messages in the chat thread");

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
      const openChatAnswerRendered = await waitFor(async () => {
        return evaluate(
          cdp,
          `(() => {
            const panel = document.querySelector("#chatPanel");
            const text = panel?.textContent || "";
            const latestAssistant = Array.from(panel?.querySelectorAll(".chat-thread-message.assistant") || []).pop();
            const latestText = latestAssistant?.textContent || "";
            const renderedAIAgent = Boolean(latestAssistant?.querySelector(".ai-agent-card"));
            const renderedFallback = /local DeepSeek private-beta config|enable DeepSeek|启用 DeepSeek|本地 DeepSeek 私测配置/.test(latestText);

            return Boolean(
              panel &&
              !panel.hidden &&
              /Which tabs should I focus on for Chrome extension planning/.test(text) &&
              (renderedAIAgent || renderedFallback) &&
              !/could not turn that into a safe tab action|无法把这句话变成安全的标签页操作/i.test(latestText)
            );
          })()`
        );
      }, "Sidebar open-ended chat answer did not render as a normal assistant message");
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

      console.log("PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore plus sidebar composer commands, quick-action chat routing, ephemeral chat thread, capability answer, open-ended chat fallback, workspace save command, next-step answer, chat summary/page-question answers, read-only answers, optimization/memory-relief answer, duplicate-review/closed-tab answers, protected/read-later answers, and tab search/open");
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
    await removePathWithRetry(profileDir);
    await removePathWithRetry(extensionDir);
  }
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
            hasPrivacyNote: /Page text and full URLs were not sent|页面正文或完整 URL/.test(text),
            tabRows: latest.querySelectorAll(".chat-tab-row").length,
            nextSteps: /Suggested next steps|建议下一步/.test(text),
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
  assert(agentAnswer.hasPrivacyNote, "DeepSeek Agent answer did not disclose metadata-only privacy boundary");
  assert(agentAnswer.actionButtons >= 1, "DeepSeek Agent answer did not render a safe action chip");
  assert(!/fullUrl|restoreUrl|pageText|token=abc/i.test(agentAnswer.text), "DeepSeek Agent answer leaked sensitive field names or fixture token text");

  const clickedAction = await evaluate(
    cdp,
    `(() => {
      const messages = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant.ai-agent"));
      const latest = messages[messages.length - 1];
      const button =
        latest?.querySelector('[data-chat-action="quick-command"][data-command="show groups"]') ||
        latest?.querySelector('[data-chat-action="quick-command"][data-command="open dashboard"]') ||
        latest?.querySelector('[data-chat-action="quick-command"]');

      if (!button) return null;

      const beforeUserMessages = document.querySelectorAll("#chatPanel .chat-thread-message.user").length;
      const beforeAssistantMessages = document.querySelectorAll("#chatPanel .chat-thread-message.assistant").length;
      const label = button.dataset.label || button.textContent.trim();
      const command = button.dataset.command || "";
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));

      return { label, command, beforeUserMessages, beforeAssistantMessages };
    })()`
  );
  assert(clickedAction?.command, "DeepSeek Agent action chip did not expose a safe chat command");

  let actionContinuation;
  try {
    actionContinuation = await waitFor(async () => {
      return evaluate(
        cdp,
        `(() => {
          const userMessages = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.user"));
          const assistantMessages = Array.from(document.querySelectorAll("#chatPanel .chat-thread-message.assistant"));
          const latestUser = userMessages[userMessages.length - 1];
          const fullText = document.querySelector("#chatPanel")?.textContent || "";

          return {
            userCount: userMessages.length,
            assistantCount: assistantMessages.length,
            latestUserText: (latestUser?.textContent || "").replace(/\\s+/g, " ").trim(),
            fullText: fullText.replace(/\\s+/g, " ").trim(),
            dashboardOpen: false
          };
        })()`
      ).then(async (state) => {
        if (clickedAction.command === "open dashboard") {
          const tabs = await evaluate(cdp, "chrome.tabs.query({})");
          state.dashboardOpen = tabs.some((tab) => String(tab.url || "").endsWith("/dashboard.html"));
        }

        const userContinued = state.userCount > clickedAction.beforeUserMessages &&
          state.latestUserText.includes(clickedAction.label);
        const assistantContinued = clickedAction.command === "show groups"
          ? /Current groups|当前分组/.test(state.fullText)
          : state.assistantCount > clickedAction.beforeAssistantMessages || state.dashboardOpen;

        return userContinued && assistantContinued ? state : null;
      });
    }, "DeepSeek Agent action chip did not continue the chat thread");
  } catch (error) {
    const chatDebug = await evaluate(
      cdp,
      `(() => Array.from(document.querySelectorAll("#chatPanel .chat-thread-message"))
        .slice(-8)
        .map((node) => ({
          className: node.className,
          text: (node.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 260)
        })))()`
    );
    throw new Error(`${error.message}. clickedAction=${JSON.stringify(clickedAction)} chat=${JSON.stringify(chatDebug)}`);
  }

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

  const appliedDraft = await waitFor(async () => {
    const groups = await evaluate(cdp, "chrome.tabGroups.query({})");
    const tabs = await evaluate(cdp, "chrome.tabs.query({})");
    const targetGroup = groups.find((group) => group.title === "Extension Planning");
    const targetTabs = targetGroup
      ? tabs.filter((tab) => tab.groupId === targetGroup.id && String(tab.url || "").includes("developer.chrome.com/docs/extensions"))
      : [];

    return targetGroup && targetTabs.length >= 1
      ? { groupId: targetGroup.id, movedTabs: targetTabs.length, tabCount: tabs.length }
      : null;
  }, "DeepSeek Agent Apply did not move tabs into a native Extension Planning group");

  assertEqual(appliedDraft.tabCount, tabsBeforeDraftApply.length, "AI Agent move draft must not close tabs");

  console.log(
    `PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer with metadata-only privacy note, ${agentAnswer.tabRows} relevant tab rows, actionButtons=${agentAnswer.actionButtons}, clickedAction=${clickedAction.command}, continued=${actionContinuation ? "yes" : "no"}, aiDraft=${aiDraft.matchedRows} tabs, aiDraftApplied=${appliedDraft.movedTabs} tabs, nextSteps=${agentAnswer.nextSteps ? "yes" : "no"}`
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

    assertGroupFamily(groupTitles, ["code review", "pr review", "pull request", "github pr", "review pages", "review tabs"], "code review");
    assertGroupFamily(groupTitles, ["chrome extension", "extension docs", "chrome docs", "browser extension", "chrome api", "api docs"], "Chrome extension docs");
    assertGroupFamily(groupTitles, ["docs & notes", "documents", "document", "google docs", "design docs", "not found docs"], "documents/notes");
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
