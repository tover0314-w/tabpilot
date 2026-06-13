import { applyI18n, initI18n, msg } from "./i18n.js";

const LAST_CLOSED_TABS_KEY = "tabmosaic.lastClosedTabs";
const SIDEBAR_CONTEXT_KEY = "tabmosaic.sidebarContext";
const SIDEBAR_MODE_KEY = "tabmosaic.sidebarMode";
const SIDEBAR_PENDING_PROMPT_KEY = "tabmosaic.sidebarPendingPrompt";
const AGENT_TASKS_KEY = "tabmosaic.agentTasks";
const SAVED_COLLECTIONS_KEY = "tabmosaic.savedCollections";
const CHAT_THREAD_LIMIT = 22;
const AI_AGENT_CONVERSATION_LIMIT = 4;
const PAGE_CHAT_CONVERSATION_LIMIT = 20;
const CONTEXT_TABS_PERMISSION_LIMIT = 6;
const CONTEXT_TABS_CHAT_CONVERSATION_LIMIT = 20;
const MAX_AGENT_ITEMS = 30;
const MAX_TODO_LINKED_TABS = 24;

const statusPanel = document.querySelector("#statusPanel");
const metricsGrid = document.querySelector("#metricsGrid");
const hostsList = document.querySelector("#hostsList");
const groupsList = document.querySelector("#groupsList");
const protectedList = document.querySelector("#protectedList");
const duplicatesList = document.querySelector("#duplicatesList");
const privacyPanel = document.querySelector("#privacyPanel");
const dashboardTopButton = document.querySelector("#dashboardTopButton");
const organizeButton = document.querySelector("#organizeButton");
const undoButton = document.querySelector("#undoButton");
const restoreButton = document.querySelector("#restoreButton");
const dashboardButton = document.querySelector("#dashboardButton");
const startButton = document.querySelector("#startButton");
const summaryPanel = document.querySelector("#summaryPanel");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const pageRegionButton = document.querySelector("#pageRegionButton");
const chatSendButton = document.querySelector("#chatSendButton");
const chatPanel = document.querySelector("#chatPanel");
const agentThread = document.querySelector(".agent-thread");
const agentComposerSection = document.querySelector(".agent-composer-section");
const agentContextBar = document.querySelector("#agentContextBar");
const agentContextLabel = document.querySelector("#agentContextLabel");
const agentContextName = document.querySelector("#agentContextName");
const verticalTabsPanel = document.querySelector("#verticalTabsPanel");
const verticalTabsSearch = document.querySelector("#verticalTabsSearch");
const verticalTabsList = document.querySelector("#verticalTabsList");
const verticalTabsOrganizeButton = document.querySelector("#verticalTabsOrganizeButton");
const verticalTabsChatButton = document.querySelector("#verticalTabsChatButton");
const PAGE_CHAT_CONTEXT_TTL_MS = 10 * 60 * 1000;
let latestRun = null;
let latestChatDraft = null;
let latestPageChatContext = null;
let latestContextTabsChatContext = null;
let pageChatMessages = [];
let contextTabsMessages = [];
let chatMessages = [];
let activeSidebarContext = { scope: "current_tab" };
let activeSidebarMode = "agent";
let verticalTabsSearchTerm = "";
let latestWebSearchResults = [];
let latestDetectedLinks = [];

await initI18n();
applyI18n();
await initSidebarContext();
await initSidebarMode();
await initSidebarPendingPrompt();

dashboardTopButton.addEventListener("click", () => openDashboard());
organizeButton.addEventListener("click", () => runQuickChatCommand("organize again", msg("organizeAgain")));
undoButton.addEventListener("click", () => runQuickChatCommand("undo", msg("undo")));
restoreButton.addEventListener("click", () => runQuickChatCommand("restore closed", msg("restoreClosed")));
dashboardButton.addEventListener("click", () => runQuickChatCommand("open dashboard", msg("openDashboard")));
startButton.addEventListener("click", acceptPrivacyAndOrganize);
duplicatesList.addEventListener("click", handleDuplicateAction);
chatForm.addEventListener("submit", previewChatRefine);
chatInput.addEventListener("keydown", handleComposerKeydown);
chatInput.addEventListener("input", resizeComposer);
pageRegionButton?.addEventListener("click", handlePageRegionButtonClick);
chatPanel.addEventListener("click", handleChatPanelAction);
agentThread.addEventListener("scroll", updateAgentThreadScrollState);
verticalTabsSearch?.addEventListener("input", () => {
  verticalTabsSearchTerm = verticalTabsSearch.value.trim().toLowerCase();
  renderVerticalTabs();
});
verticalTabsList?.addEventListener("click", handleVerticalTabsClick);
verticalTabsOrganizeButton?.addEventListener("click", async () => {
  await switchSidebarMode("agent");
  await runQuickChatCommand("organize again", msg("smartOrganize"));
});
verticalTabsChatButton?.addEventListener("click", async () => {
  await switchSidebarMode("agent");
  chatInput?.focus();
});
document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    chatInput.value = button.dataset.prompt || "";
    resizeComposer();
    chatInput.focus();
    chatForm.requestSubmit();
  });
});

async function organizeNow() {
  setBusy(true);
  renderRun({
    status: "scanning",
    message: msg("scanningAllNormalWindows")
  });

  const response = await chrome.runtime.sendMessage({ type: "ORGANIZE_NOW" });
  setBusy(false);

  if (response?.ok) {
    renderRun(response.run);
  } else {
    renderRun({
      status: "error",
      error: response?.error || msg("scanDidNotFinish")
    });
  }
}

async function undoLast() {
  setBusy(true);
  renderRun({
    status: "undoing",
    message: msg("restoringGroups")
  });

  const response = await chrome.runtime.sendMessage({ type: "UNDO_LAST" });
  setBusy(false);

  if (response?.ok) {
    renderRun(response.run);
  } else {
    renderRun({
      status: "error",
      error: response?.error || "Undo failed."
    });
  }
}

async function restoreClosed() {
  setBusy(true);
  renderRun({
    status: "restoring-closed",
    message: msg("restoringClosedTabs")
  });

  const response = await chrome.runtime.sendMessage({ type: "RESTORE_CLOSED_DUPLICATES" });
  setBusy(false);

  if (response?.ok) {
    renderRun(response.run);
  } else {
    renderRun({
      status: "error",
      error: response?.error || "Restore failed."
    });
  }
}

async function acceptPrivacyAndOrganize() {
  setBusy(true);
  renderRun({
    status: "scanning",
    activeWindowId: latestRun?.activeWindowId,
    message: msg("startingFirstOrganize")
  });

  const response = await chrome.runtime.sendMessage({
    type: "ACCEPT_PRIVACY_AND_ORGANIZE",
    activeWindowId: latestRun?.activeWindowId
  });
  setBusy(false);

  if (response?.ok) {
    renderRun(response.run);
  } else {
    renderRun({
      status: "error",
      error: response?.error || msg("couldNotStartOrganizing")
    });
  }
}

async function openDashboard(page = "") {
  const hash = page ? `#${encodeURIComponent(page)}` : "";
  await chrome.tabs.create({
    url: chrome.runtime.getURL(`dashboard.html${hash}`)
  });
}

async function initSidebarMode() {
  try {
    const result = await chrome.storage.local.get(SIDEBAR_MODE_KEY);
    renderSidebarMode(result[SIDEBAR_MODE_KEY]);
  } catch {
    renderSidebarMode("agent");
  }

  chrome.storage?.onChanged?.addListener?.((changes, areaName) => {
    if (areaName !== "local" || !changes[SIDEBAR_MODE_KEY]) return;
    renderSidebarMode(changes[SIDEBAR_MODE_KEY].newValue);
  });

  chrome.tabs?.onActivated?.addListener?.(() => {
    refreshVerticalTabsIfNeeded();
  });
  chrome.tabs?.onUpdated?.addListener?.((_tabId, changeInfo) => {
    if (!changeInfo?.title && !changeInfo?.url && !changeInfo?.favIconUrl && !changeInfo?.groupId) return;
    refreshVerticalTabsIfNeeded();
  });
  chrome.tabs?.onRemoved?.addListener?.(() => {
    refreshVerticalTabsIfNeeded();
  });
  chrome.tabs?.onMoved?.addListener?.(() => {
    refreshVerticalTabsIfNeeded();
  });
  chrome.tabGroups?.onUpdated?.addListener?.(() => {
    refreshVerticalTabsIfNeeded();
  });
  chrome.tabGroups?.onRemoved?.addListener?.(() => {
    refreshVerticalTabsIfNeeded();
  });
}

function normalizeSidebarMode(value) {
  const mode = typeof value === "string" ? value : value?.mode;
  return mode === "vertical_tabs" ? "vertical_tabs" : "agent";
}

function renderSidebarMode(value) {
  activeSidebarMode = normalizeSidebarMode(value);
  const isVerticalTabs = activeSidebarMode === "vertical_tabs";

  document.body.classList.toggle("sidebar-mode-vertical-tabs", isVerticalTabs);

  if (verticalTabsPanel) {
    verticalTabsPanel.hidden = !isVerticalTabs;
  }

  if (agentComposerSection) {
    agentComposerSection.hidden = isVerticalTabs;
  }

  if (isVerticalTabs) {
    renderVerticalTabs();
  } else {
    requestAnimationFrame(() => updateAgentThreadScrollState());
  }
}

async function switchSidebarMode(mode) {
  await chrome.storage.local.set({
    [SIDEBAR_MODE_KEY]: {
      mode: normalizeSidebarMode(mode),
      source: "sidepanel",
      updatedAt: new Date().toISOString()
    }
  });
}

async function initSidebarPendingPrompt() {
  if (!chatInput) return;

  try {
    const result = await chrome.storage.local.get(SIDEBAR_PENDING_PROMPT_KEY);
    const prompt = result[SIDEBAR_PENDING_PROMPT_KEY];
    const text = String(prompt?.text || "").trim();

    if (!text || isStaleSidebarPendingPrompt(prompt)) return;

    chatInput.value = text;
    resizeComposer();
    requestAnimationFrame(() => {
      chatInput.focus();
      chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
    });
    await chrome.storage.local.remove(SIDEBAR_PENDING_PROMPT_KEY);
  } catch {
    // Pending prompts are a convenience only; ignore storage failures.
  }
}

function isStaleSidebarPendingPrompt(prompt) {
  const createdAt = Date.parse(prompt?.createdAt || "");
  if (!Number.isFinite(createdAt)) return true;
  return Date.now() - createdAt > 5 * 60 * 1000;
}

function refreshVerticalTabsIfNeeded() {
  if (activeSidebarMode === "vertical_tabs") {
    renderVerticalTabs();
  }
}

async function initSidebarContext() {
  const storedContext = await getStoredSidebarContext();

  if (storedContext) {
    renderSidebarContext(storedContext);
  } else {
    await renderActiveTabContext();
  }

  chrome.storage?.onChanged?.addListener?.((changes, areaName) => {
    if (areaName !== "local" || !changes[SIDEBAR_CONTEXT_KEY]) return;

    const nextContext = normalizeSidebarContext(changes[SIDEBAR_CONTEXT_KEY].newValue);
    if (nextContext) {
      renderSidebarContext(nextContext);
    }
  });

  chrome.tabs?.onActivated?.addListener?.(() => {
    renderActiveTabContext();
  });

  chrome.tabs?.onUpdated?.addListener?.((_tabId, changeInfo, tab) => {
    if (!tab?.active || (!changeInfo?.title && !changeInfo?.url && !changeInfo?.favIconUrl)) return;
    renderActiveTabContext();
  });
}

async function getStoredSidebarContext() {
  try {
    const result = await chrome.storage.local.get(SIDEBAR_CONTEXT_KEY);
    return normalizeSidebarContext(result[SIDEBAR_CONTEXT_KEY]);
  } catch {
    return null;
  }
}

async function renderActiveTabContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    renderSidebarContext(tab ? buildTabContextFromChromeTab(tab, "browser") : { scope: "current_tab" });
  } catch {
    renderSidebarContext({ scope: "current_tab" });
  }
}

function buildTabContextFromChromeTab(tab, source = "browser") {
  const rawUrl = tab?.url || tab?.pendingUrl || "";
  return {
    scope: "current_tab",
    tabId: Number.isInteger(tab?.id) ? tab.id : null,
    windowId: Number.isInteger(tab?.windowId) ? tab.windowId : null,
    title: String(tab?.title || "").slice(0, 160),
    hostname: getHostnameFromUrl(rawUrl).slice(0, 120),
    source,
    updatedAt: new Date().toISOString()
  };
}

function normalizeSidebarContext(context) {
  if (!context || typeof context !== "object") return null;

  const scope = ["current_tab", "current_group", "selected_tabs", "current_window", "workspace", "browser"].includes(context.scope)
    ? context.scope
    : "current_tab";
  const tabIds = Array.isArray(context.tabIds)
    ? Array.from(new Set(context.tabIds.map((tabId) => Number(tabId)).filter(Number.isInteger))).slice(0, 80)
    : [];

  return {
    scope,
    tabId: toOptionalInteger(context.tabId),
    groupId: toOptionalInteger(context.groupId),
    windowId: toOptionalInteger(context.windowId),
    title: String(context.title || "").slice(0, 160),
    groupName: String(context.groupName || "").slice(0, 120),
    hostname: String(context.hostname || "").slice(0, 120),
    tabCount: Number.isInteger(Number(context.tabCount)) ? Math.max(0, Number(context.tabCount)) : tabIds.length,
    tabIds,
    source: String(context.source || "").slice(0, 40),
    updatedAt: String(context.updatedAt || "").slice(0, 40)
  };
}

function toOptionalInteger(value) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function renderSidebarContext(context) {
  const normalized = normalizeSidebarContext(context) || { scope: "current_tab" };
  activeSidebarContext = normalized;
  clearStalePageChatContext();
  clearStaleContextTabsChatContext();

  if (!agentContextBar || !agentContextLabel || !agentContextName) return;

  const labelByScope = {
    current_tab: msg("contextCurrentTab"),
    current_group: msg("contextCurrentGroup"),
    selected_tabs: msg("contextSelectedTabs"),
    current_window: msg("contextCurrentWindow"),
    workspace: msg("contextWorkspace"),
    browser: msg("contextBrowser")
  };
  const name = getSidebarContextName(normalized);

  agentContextBar.dataset.contextScope = normalized.scope;
  agentContextLabel.textContent = labelByScope[normalized.scope] || msg("contextCurrentTab");
  agentContextName.textContent = name;
  agentContextBar.title = `${agentContextLabel.textContent}: ${getSidebarContextFullName(normalized)}`;
}

function getSidebarContextName(context) {
  if (context.scope === "selected_tabs") {
    const count = Number(context.tabCount || context.tabIds?.length || 0);
    return count ? msg("tabsCount", [count]) : msg("contextSelectedTabs");
  }

  if (context.scope === "current_group") {
    const count = Number(context.tabCount || context.tabIds?.length || 0);
    const name = context.groupName || msg("contextUnnamedGroup");
    return count ? `${name} · ${msg("tabsCount", [count])}` : name;
  }

  if (context.scope === "browser" || context.scope === "current_window") {
    return msg("contextAllWindows");
  }

  if (context.scope === "workspace") {
    return context.title || msg("currentWorkspace");
  }

  if (context.scope === "current_tab") {
    return getCompactCurrentTabContextName(context);
  }

  return context.title || context.hostname || msg("contextNoTab");
}

function getSidebarContextFullName(context) {
  if (context.scope === "current_tab") {
    return context.title || context.hostname || msg("contextNoTab");
  }

  return getSidebarContextName(context);
}

function getCompactCurrentTabContextName(context) {
  const hostLabel = formatSidebarHostname(context.hostname);
  if (hostLabel) return hostLabel;

  const compactTitle = compactPageTitle(context.title);
  return compactTitle || msg("contextNoTab");
}

function formatSidebarHostname(hostname) {
  const normalized = String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
  if (!normalized) return "";

  const labels = new Map([
    ["supabase.com", "Supabase"],
    ["github.com", "GitHub"],
    ["docs.google.com", "Google Docs"],
    ["developer.chrome.com", "Chrome Docs"],
    ["vercel.com", "Vercel"],
    ["figma.com", "Figma"],
    ["notion.so", "Notion"],
    ["linear.app", "Linear"],
    ["jira.com", "Jira"],
    ["atlassian.net", "Jira"],
    ["localhost", "Localhost"],
    ["127.0.0.1", "Localhost"]
  ]);

  if (labels.has(normalized)) return labels.get(normalized);

  const withoutTld = normalized
    .split(".")
    .filter(Boolean)
    .slice(-2, -1)[0] || normalized.split(".")[0] || normalized;
  return titleCaseContextLabel(withoutTld);
}

function compactPageTitle(title) {
  const firstUsefulPart = String(title || "")
    .split(/\s[|·•-]\s|[|·•]/)
    .map((part) => part.trim())
    .find(Boolean);

  return firstUsefulPart ? firstUsefulPart.slice(0, 32) : "";
}

function titleCaseContextLabel(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .slice(0, 32);
}

function getCurrentContextWindowId() {
  const contextWindowId = Number(activeSidebarContext?.windowId);
  if (Number.isInteger(contextWindowId)) return contextWindowId;

  const latestWindowId = Number(latestRun?.activeWindowId);
  return Number.isInteger(latestWindowId) ? latestWindowId : null;
}

function getAIAgentContextPayload() {
  return normalizeSidebarContext(activeSidebarContext) || { scope: "current_tab" };
}

async function saveCurrentWorkspace() {
  setBusy(true);
  const response = await chrome.runtime.sendMessage({
    type: "SAVE_CURRENT_WORKSPACE",
    source: "sidepanel"
  });
  setBusy(false);

  if (!response?.ok) {
    renderChatPanel({
      status: "error",
      answer: response?.error || msg("couldNotSaveWorkspace")
    });
    return;
  }

  renderChatPanel({
    status: "applied",
    answer: msg("agentWorkspaceSaved", [
      response.result?.workspace?.name || msg("savedWorkspace")
    ])
  });
}

async function createTodoFromSidebarContext(text) {
  const context = normalizeSidebarContext(activeSidebarContext) || { scope: "current_tab" };
  setBusy(true);

  try {
    const rawTabs = await getTodoTabsForSidebarContext(context);
    const tabs = dedupeTabsById(rawTabs)
      .slice(0, MAX_TODO_LINKED_TABS)
      .map((tab) => sanitizeTabForSidebarWork(tab, context))
      .filter((tab) => Number.isInteger(tab.id));

    if (!tabs.length) {
      renderChatPanel({
        status: "info",
        answer: msg("agentTodoNoContext")
      });
      return;
    }

    const now = new Date().toISOString();
    const task = {
      id: `task-${Date.now()}`,
      title: buildSidebarTodoTitle(tabs, context),
      status: "open",
      source: "sidebar_agent",
      sourcePrompt: sanitizeTodoSourcePrompt(text),
      contextScope: context.scope,
      createdAt: now,
      updatedAt: now,
      tabIds: tabs.map((tab) => tab.id).filter(Number.isInteger),
      tabs
    };
    const stored = await chrome.storage.local.get(AGENT_TASKS_KEY);
    const existingTasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];
    await chrome.storage.local.set({
      [AGENT_TASKS_KEY]: [task, ...existingTasks].slice(0, MAX_AGENT_ITEMS)
    });

    renderChatPanel({
      status: "todo-created",
      answer: buildSidebarTodoMarkdown(task),
      task
    });
  } catch (error) {
    renderChatPanel({
      status: "error",
      answer: error?.message || msg("couldNotBuildSafeAction")
    });
  } finally {
    setBusy(false);
  }
}

async function createChecklistTodoFromCurrentPage(text) {
  setBusy(true);
  renderChatPanel({
    status: "loading",
    answer: msg("agentTodoReadingPage")
  });

  const privacyResponse = await chrome.runtime.sendMessage({
    type: "CHECK_SUMMARY_PRIVACY",
    activeWindowId: getCurrentContextWindowId()
  });

  if (!privacyResponse?.ok) {
    setBusy(false);
    renderChatPanel({
      status: "error",
      answer: privacyResponse?.error || msg("pageCouldNotBeRead")
    });
    return;
  }

  const confirmedSensitiveTabId = confirmSensitiveSummaryIfNeeded(privacyResponse.result);

  if (confirmedSensitiveTabId === false) {
    setBusy(false);
    renderChatPanel({
      status: "info",
      answer: msg("summaryCancelledCopy")
    });
    return;
  }

  renderChatPanel({
    status: "loading",
    answer: msg("agentTodoCreatingChecklist")
  });

  const question = buildPageTodoQuestion(text);
  let response = await requestCurrentTabSummary(confirmedSensitiveTabId, question);

  if (response?.ok && response.summary?.status === "needs-confirmation") {
    const retryConfirmedTabId = confirmSensitiveSummaryIfNeeded(response.summary);

    if (retryConfirmedTabId === false) {
      setBusy(false);
      renderChatPanel({
        status: "info",
        answer: msg("summaryCancelledCopy")
      });
      return;
    }

    response = await requestCurrentTabSummary(retryConfirmedTabId, question);
  }

  setBusy(false);

  if (!response?.ok) {
    renderChatPanel({
      status: "error",
      answer: response?.error || msg("pageCouldNotBeRead")
    });
    return;
  }

  if (response.summary?.status !== "completed") {
    renderChatPanel({
      status: response.summary?.status === "needs-ai-config" ? "info" : "error",
      answer: response.summary?.summary || msg("pageCouldNotBeRead")
    });
    return;
  }

  const task = await saveChecklistTodoFromPageSummary(response.summary, text);
  renderChatPanel({
    status: "todo-created",
    answer: buildChecklistTodoMarkdown(task),
    task
  });
}

function buildPageTodoQuestion(text) {
  const userIntent = sanitizeTodoSourcePrompt(text);
  const prefix = "Turn this page into a concise execution checklist for the user.";
  const suffix = "Return concrete next actions, risks to check, and anything the user should not change casually.";

  return [prefix, userIntent ? `User request: ${userIntent}.` : "", suffix]
    .filter(Boolean)
    .join(" ")
    .slice(0, 240);
}

async function saveChecklistTodoFromPageSummary(summary, sourcePrompt) {
  const context = normalizeSidebarContext(activeSidebarContext) || { scope: "current_tab" };
  const rawTabs = await getTodoTabsForSidebarContext({ ...context, scope: "current_tab" });
  const tabs = dedupeTabsById(rawTabs)
    .slice(0, 1)
    .map((tab) => sanitizeTabForSidebarWork(tab, context))
    .filter((tab) => Number.isInteger(tab.id));
  const checklist = buildChecklistItemsFromPageSummary(summary);
  const now = new Date().toISOString();
  const task = {
    id: `task-${Date.now()}`,
    title: buildPageChecklistTodoTitle(summary, tabs),
    status: "open",
    source: "current_page_agent",
    sourcePrompt: sanitizeTodoSourcePrompt(sourcePrompt),
    contextScope: "current_tab",
    createdAt: now,
    updatedAt: now,
    tabIds: tabs.map((tab) => tab.id).filter(Number.isInteger),
    tabs,
    checklist,
    pageAgent: {
      provider: String(summary.provider || "").slice(0, 80),
      aiUsed: Boolean(summary.aiUsed),
      extractedChars: Number.isInteger(Number(summary.extractedChars)) ? Number(summary.extractedChars) : 0
    }
  };
  const stored = await chrome.storage.local.get(AGENT_TASKS_KEY);
  const existingTasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];
  await chrome.storage.local.set({
    [AGENT_TASKS_KEY]: [task, ...existingTasks].slice(0, MAX_AGENT_ITEMS)
  });

  return task;
}

function buildChecklistItemsFromPageSummary(summary = {}) {
  const keyPoints = Array.isArray(summary.keyPoints) ? summary.keyPoints : [];
  const fromKeyPoints = keyPoints
    .map(cleanChecklistItem)
    .filter(Boolean);
  const fromAnswer = String(summary.summary || "")
    .split(/\n+|(?<=\.)\s+|(?<=。)\s*/)
    .map((item) => item.replace(/^[-*]\s+|\d+[.)]\s+/g, ""))
    .map(cleanChecklistItem)
    .filter(Boolean);
  const items = Array.from(new Set([...fromKeyPoints, ...fromAnswer]))
    .filter((item) => item.length >= 8)
    .slice(0, 6);

  if (items.length) return items;
  return [msg("agentTodoFallbackChecklist")];
}

function cleanChecklistItem(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^[-*]\s+|\d+[.)]\s+/g, "")
    .trim()
    .replace(/[.。]+$/g, "")
    .slice(0, 180);
}

function buildPageChecklistTodoTitle(summary = {}, tabs = []) {
  const host = tabs[0]?.hostname || summary.hostname || "";
  const label = host ? formatSidebarHostname(host) || host : compactPageTitle(summary.title);
  return msg("todoReviewPageChecklist", [label || msg("currentTab")]);
}

function buildChecklistTodoMarkdown(task = {}) {
  const checklist = Array.isArray(task.checklist) ? task.checklist.slice(0, 6) : [];
  const lines = [
    msg("agentTodoCreated", [task.title || msg("todo")]),
    "",
    ...checklist.map((item) => `- ${item}`),
    "",
    msg("agentTodoChecklistStoredLocally")
  ];

  return lines.join("\n");
}

async function getTodoTabsForSidebarContext(context) {
  const snapshotTabs = getTodoTabsFromSnapshot(context);
  if (snapshotTabs.length) return snapshotTabs;

  if (context?.scope === "selected_tabs" || context?.scope === "current_group") {
    const tabIds = resolveContextTabIdsForPermission(context).slice(0, MAX_TODO_LINKED_TABS);
    const liveTabs = await getLiveTabsByIds(tabIds);
    if (liveTabs.length) return liveTabs;
  }

  if (context?.scope === "current_tab" && Number.isInteger(context.tabId)) {
    const liveTab = await getLiveTabById(context.tabId);
    if (liveTab) return [liveTab];
  }

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return activeTab ? [activeTab] : [];
  } catch {
    return [];
  }
}

function getTodoTabsFromSnapshot(context) {
  const tabs = getSnapshotTabs(latestRun);
  if (!tabs.length) return [];

  if (context?.scope === "selected_tabs" && Array.isArray(context.tabIds) && context.tabIds.length) {
    const tabById = new Map(tabs.map((tab) => [Number(tab.id), tab]));
    return context.tabIds
      .map((tabId) => tabById.get(Number(tabId)))
      .filter(Boolean);
  }

  if (context?.scope === "current_group" && Number.isInteger(context.groupId)) {
    return tabs.filter((tab) => Number(tab.groupId) === Number(context.groupId));
  }

  if (context?.scope === "current_window" && Number.isInteger(context.windowId)) {
    return tabs.filter((tab) => Number(tab.windowId) === Number(context.windowId));
  }

  if (context?.scope === "current_tab" && Number.isInteger(context.tabId)) {
    return tabs.filter((tab) => Number(tab.id) === Number(context.tabId));
  }

  return [];
}

async function getLiveTabsByIds(tabIds) {
  const tabs = [];

  for (const tabId of tabIds) {
    const tab = await getLiveTabById(tabId);
    if (tab) tabs.push(tab);
  }

  return tabs;
}

async function getLiveTabById(tabId) {
  if (!Number.isInteger(tabId) || !chrome.tabs?.get) return null;

  try {
    return await chrome.tabs.get(tabId);
  } catch {
    return null;
  }
}

function sanitizeTabForSidebarWork(tab, context = {}) {
  const rawUrl = tab?.url || tab?.pendingUrl || "";
  const parsed = parseBrowserWorkUrl(rawUrl);
  const group = findLatestRunGroup(tab?.groupId) || findLatestRunGroup(context.groupId);

  return {
    id: toOptionalInteger(tab?.id),
    windowId: toOptionalInteger(tab?.windowId || context.windowId),
    groupId: toOptionalInteger(tab?.groupId || context.groupId),
    groupName: String(group?.name || tab?.groupName || tab?.groupTitle || context.groupName || "").slice(0, 120),
    title: String(tab?.title || "").slice(0, 180),
    hostname: String(tab?.hostname || parsed.hostname || "").slice(0, 120),
    path: sanitizeBrowserWorkPath(tab?.path || parsed.path || ""),
    active: Boolean(tab?.active),
    pinned: Boolean(tab?.pinned),
    audible: Boolean(tab?.audible)
  };
}

function parseBrowserWorkUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return {
      hostname: url.hostname,
      path: sanitizeBrowserWorkPath(url.pathname)
    };
  } catch {
    return { hostname: "", path: "" };
  }
}

function sanitizeBrowserWorkPath(value) {
  return String(value || "")
    .split(/[?#]/)[0]
    .slice(0, 180);
}

function findLatestRunGroup(groupId) {
  if (!Number.isInteger(Number(groupId))) return null;
  return (Array.isArray(latestRun?.groups) ? latestRun.groups : []).find(
    (group) => Number(group.id) === Number(groupId)
  ) || null;
}

function buildSidebarTodoTitle(tabs, context = {}) {
  const groupNames = Array.from(
    new Set([
      context.groupName,
      ...tabs.map((tab) => tab.groupName)
    ].filter(Boolean))
  );

  if (groupNames.length === 1) {
    return msg("todoReviewGroup", [groupNames[0]]);
  }

  if (context.scope === "selected_tabs") {
    return msg("todoReviewSelectedTabs");
  }

  const host = mostCommonValue(tabs.map((tab) => tab.hostname).filter(Boolean));
  return host ? msg("todoReviewHostTabs", [host]) : msg("todoReviewSelectedTabs");
}

function buildSidebarTodoMarkdown(task = {}) {
  const tabCount = Array.isArray(task.tabs) ? task.tabs.length : 0;

  return [
    msg("agentTodoCreated", [task.title || msg("todo")]),
    "",
    `- ${msg("agentTodoLinkedTabs", [tabCount])}`,
    `- ${msg("agentTodoStoredLocally")}`,
    "",
    msg("agentTodoOpenDashboardHint")
  ].join("\n");
}

function sanitizeTodoSourcePrompt(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

async function summarizeCurrentTab(question = "") {
  setBusy(true);
  renderSummary({
    status: "loading",
    title: question ? msg("answeringCurrentPage") : msg("checkingSummaryPrivacy"),
    question,
    summary: msg("checkingSummaryPrivacyCopy")
  });

  const privacyResponse = await chrome.runtime.sendMessage({
    type: "CHECK_SUMMARY_PRIVACY",
    activeWindowId: getCurrentContextWindowId()
  });

  if (!privacyResponse?.ok) {
    setBusy(false);
    renderSummary({
      status: "error",
      title: msg("couldNotSummarizeTitle"),
      question,
      summary: privacyResponse?.error || msg("pageCouldNotBeRead")
    });
    return;
  }

  const confirmedSensitiveTabId = confirmSensitiveSummaryIfNeeded(privacyResponse.result);

  if (confirmedSensitiveTabId === false) {
    setBusy(false);
    renderSummary({
      status: "unreadable",
      title: msg("summaryCancelledTitle"),
      question,
      summary: msg("summaryCancelledCopy")
    });
    return;
  }

  renderSummary({
    status: "loading",
    title: question ? msg("answeringCurrentPage") : msg("readingCurrentTab"),
    question,
    summary: msg("extractingVisibleText")
  });

  const response = await requestCurrentTabSummary(confirmedSensitiveTabId, question);
  setBusy(false);

  if (response?.ok && response.summary?.status === "needs-confirmation") {
    const retryConfirmedTabId = confirmSensitiveSummaryIfNeeded(response.summary);

    if (retryConfirmedTabId === false) {
      renderSummary({
        status: "unreadable",
        title: msg("summaryCancelledTitle"),
        question,
        summary: msg("summaryCancelledCopy")
      });
      return;
    }

    setBusy(true);
    renderSummary({
      status: "loading",
      title: question ? msg("answeringCurrentPage") : msg("readingCurrentTab"),
      question,
      summary: msg("extractingVisibleText")
    });

    const retryResponse = await requestCurrentTabSummary(retryConfirmedTabId, question);
    setBusy(false);
    renderSummary(
      retryResponse?.ok
        ? retryResponse.summary
        : {
            status: "error",
            title: msg("couldNotSummarizeTitle"),
            question,
            summary: retryResponse?.error || msg("pageCouldNotBeRead")
          }
    );
    return;
  }

  if (response?.ok) {
    renderSummary(response.summary);
  } else {
    renderSummary({
      status: "error",
      title: msg("couldNotSummarizeTitle"),
      question,
      summary: response?.error || msg("pageCouldNotBeRead")
    });
  }
}

function requestCurrentTabSummary(confirmedSensitiveTabId, question = "") {
  return chrome.runtime.sendMessage({
    type: "SUMMARIZE_CURRENT_TAB",
    activeWindowId: getCurrentContextWindowId(),
    confirmedSensitiveTabId: confirmedSensitiveTabId || null,
    question: question || "",
    pageConversationHistory: buildPageChatHistory()
  });
}

async function summarizeSelectedPageRegion(question = "") {
  appendChatMessage({
    role: "assistant",
    status: "tool-card",
    html: renderToolCard(buildPageRegionToolCard("running")),
    text: "",
    includeInAIAgentContext: false
  });

  setBusy(true);
  renderSummary({
    status: "loading",
    title: msg("selectingPageRegion"),
    question,
    summary: msg("selectingPageRegionCopy")
  });

  const privacyResponse = await chrome.runtime.sendMessage({
    type: "CHECK_SUMMARY_PRIVACY",
    activeWindowId: getCurrentContextWindowId()
  });

  if (!privacyResponse?.ok) {
    setBusy(false);
    updateLatestToolCard(buildPageRegionToolCard("error", 0, 1, ["privacy_check_failed"]));
    renderSummary({
      status: "error",
      title: msg("couldNotSummarizeTitle"),
      question,
      summary: privacyResponse?.error || msg("pageCouldNotBeRead")
    });
    return;
  }

  const confirmedSensitiveTabId = confirmSensitiveSummaryIfNeeded(privacyResponse.result);

  if (confirmedSensitiveTabId === false) {
    setBusy(false);
    updateLatestToolCard(buildPageRegionToolCard("cancelled", 0, 1, ["cancelled"]));
    renderSummary({
      status: "unreadable",
      title: msg("summaryCancelledTitle"),
      question,
      summary: msg("summaryCancelledCopy")
    });
    return;
  }

  renderSummary({
    status: "loading",
    title: msg("readingSelectedRegion"),
    question,
    summary: msg("selectingPageRegionCopy")
  });

  let response;

  try {
    response = await requestPageRegionSummary(confirmedSensitiveTabId, question);
  } catch (error) {
    response = {
      ok: false,
      error: error?.message || msg("pageCouldNotBeRead")
    };
  } finally {
    setBusy(false);
  }

  if (response?.ok && response.summary?.status === "needs-confirmation") {
    const retryConfirmedTabId = confirmSensitiveSummaryIfNeeded(response.summary);

    if (retryConfirmedTabId === false) {
      updateLatestToolCard(buildPageRegionToolCard("cancelled", 0, 1, ["cancelled"]));
      renderSummary({
        status: "unreadable",
        title: msg("summaryCancelledTitle"),
        question,
        summary: msg("summaryCancelledCopy")
      });
      return;
    }

    setBusy(true);
    renderSummary({
      status: "loading",
      title: msg("readingSelectedRegion"),
      question,
      summary: msg("selectingPageRegionCopy")
    });

    try {
      response = await requestPageRegionSummary(retryConfirmedTabId, question);
    } catch (error) {
      response = {
        ok: false,
        error: error?.message || msg("pageCouldNotBeRead")
      };
    } finally {
      setBusy(false);
    }
  }

  if (response?.ok) {
    updateLatestToolCard(response.summary?.toolCard);
    renderSummary(response.summary);
  } else {
    updateLatestToolCard(buildPageRegionToolCard("error", 0, 1, ["unreadable"]));
    renderSummary({
      status: "error",
      title: msg("couldNotSummarizeTitle"),
      question,
      summary: response?.error || msg("pageCouldNotBeRead")
    });
  }
}

function requestPageRegionSummary(confirmedSensitiveTabId, question = "") {
  return chrome.runtime.sendMessage({
    type: "SUMMARIZE_PAGE_REGION",
    activeWindowId: getCurrentContextWindowId(),
    confirmedSensitiveTabId: confirmedSensitiveTabId || null,
    question: question || "",
    pageConversationHistory: buildPageChatHistory()
  });
}

function buildPageRegionToolCard(status = "running", readCount = 0, skippedCount = 0, skippedReasons = []) {
  return {
    toolName: "extract_selected_page_region",
    label: msg("toolCardSelectPageRegion"),
    scope: {
      type: "page_region",
      requestedTabCount: 1,
      readTabCount: readCount,
      skippedTabCount: skippedCount,
      maxTabs: 1
    },
    dataUsed: ["selected_region_visible_text", "structure", "cropped_screenshot_metadata"],
    storage: "session_only",
    status,
    skippedReasons
  };
}

function buildWebSearchToolCard(query = "", status = "needs-provider", resultCount = 0) {
  return {
    toolName: "search_web_provider",
    label: msg("toolCardSearchWeb"),
    scope: {
      type: "web_search",
      query: String(query || "").slice(0, 120),
      resultCount: Math.max(0, Number(resultCount || 0))
    },
    dataUsed: ["user_typed_query"],
    storage: "session_only_until_saved",
    status,
    skippedReasons: status === "needs-provider" ? ["provider_not_configured"] : []
  };
}

function buildContextTabsRunningToolCard(context = {}) {
  const scopeType = context.scope === "selected_tabs" ? "selected_tabs" : "current_group";

  return {
    toolName: scopeType === "selected_tabs" ? "read_selected_tabs_pages" : "read_group_pages",
    label: scopeType === "selected_tabs" ? msg("toolCardReadSelectedTabs") : msg("toolCardReadGroupPages"),
    scope: {
      type: scopeType,
      requestedTabCount: Number(context.tabCount || context.tabIds?.length || 0),
      readTabCount: 0,
      skippedTabCount: 0,
      maxTabs: CONTEXT_TABS_PERMISSION_LIMIT
    },
    dataUsed: ["visible_text"],
    storage: "session_only",
    status: "running",
    skippedReasons: []
  };
}

async function summarizeContextTabs(question = "") {
  const context = getAIAgentContextPayload();

  if (!["current_group", "selected_tabs"].includes(context.scope)) {
    renderChatPanel({
      status: "info",
      answer: msg("contextTabsNoContext")
    });
    return;
  }

  appendChatMessage({
    role: "assistant",
    status: "tool-card",
    html: renderToolCard(buildContextTabsRunningToolCard(context)),
    text: "",
    includeInAIAgentContext: false
  });

  const permissionSession = await requestContextTabOriginPermissions(context);

  setBusy(true);
  renderChatPanel({
    status: "loading",
    answer: msg("readingContextTabsCopy")
  });

  let response;

  try {
    response = await chrome.runtime.sendMessage({
      type: "SUMMARIZE_CONTEXT_TABS",
      question,
      context,
      contextConversationHistory: buildContextTabsChatHistory()
    });
  } catch (error) {
    response = {
      ok: false,
      error: error?.message || msg("pageCouldNotBeRead")
    };
  } finally {
    setBusy(false);
    await releaseContextTabOriginPermissions(permissionSession.grantedOrigins);
  }

  if (response?.ok) {
    updateLatestToolCard(response.summary?.toolCard);
    rememberContextTabsChatContext(response.summary);
    renderChatPanel({
      status: "context-summary",
      summary: response.summary
    });
    return;
  }

  renderChatPanel({
    status: "error",
    answer: response?.error || msg("pageCouldNotBeRead")
  });
}

async function regroupContextTabs(question = "") {
  const context = getAIAgentContextPayload();

  if (!["current_group", "selected_tabs"].includes(context.scope)) {
    renderChatPanel({
      status: "info",
      answer: msg("contextTabsNoContext")
    });
    return;
  }

  appendChatMessage({
    role: "assistant",
    status: "tool-card",
    html: renderToolCard(buildContextTabsRunningToolCard(context)),
    text: "",
    includeInAIAgentContext: false
  });

  const permissionSession = await requestContextTabOriginPermissions(context);

  setBusy(true);
  renderChatPanel({
    status: "loading",
    answer: msg("regroupingContextTabsCopy")
  });

  let response;

  try {
    response = await chrome.runtime.sendMessage({
      type: "REGROUP_CONTEXT_TABS",
      question,
      context
    });
  } catch (error) {
    response = {
      ok: false,
      error: error?.message || msg("couldNotBuildSafeAction")
    };
  } finally {
    setBusy(false);
    await releaseContextTabOriginPermissions(permissionSession.grantedOrigins);
  }

  if (response?.ok && response.draft) {
    updateLatestToolCard(response.draft.toolCard);
    latestChatDraft = response.draft;
    renderChatPanel(response.draft);
    return;
  }

  renderChatPanel({
    status: "error",
    answer: response?.error || msg("couldNotBuildSafeAction")
  });
}

async function requestContextTabOriginPermissions(context) {
  const origins = await getContextTabPermissionOrigins(context);

  if (!origins.length || !chrome.permissions?.request) {
    return { grantedOrigins: [], requestedOrigins: origins, alreadyGrantedOrigins: [] };
  }

  const originsToRequest = [];
  const alreadyGrantedOrigins = [];

  for (const origin of origins) {
    try {
      const alreadyGranted = chrome.permissions?.contains
        ? await chrome.permissions.contains({ origins: [origin] })
        : false;

      if (alreadyGranted) {
        alreadyGrantedOrigins.push(origin);
      } else {
        originsToRequest.push(origin);
      }
    } catch {
      originsToRequest.push(origin);
    }
  }

  if (!originsToRequest.length) {
    return { grantedOrigins: [], requestedOrigins: origins, alreadyGrantedOrigins };
  }

  try {
    const granted = await chrome.permissions.request({ origins: originsToRequest });
    return {
      grantedOrigins: granted ? originsToRequest : [],
      requestedOrigins: origins,
      alreadyGrantedOrigins
    };
  } catch {
    return { grantedOrigins: [], requestedOrigins: origins, alreadyGrantedOrigins };
  }
}

async function releaseContextTabOriginPermissions(origins) {
  if (!origins?.length || !chrome.permissions?.remove) return;

  try {
    await chrome.permissions.remove({ origins });
  } catch {
    // Best-effort cleanup only. A failed removal should not hide the answer.
  }
}

async function getContextTabPermissionOrigins(context) {
  const tabIds = resolveContextTabIdsForPermission(context);
  const origins = [];

  for (const tabId of tabIds.slice(0, CONTEXT_TABS_PERMISSION_LIMIT)) {
    try {
      const tab = await chrome.tabs.get(tabId);
      const origin = buildOptionalOriginPermission(tab);
      if (origin && !origins.includes(origin)) {
        origins.push(origin);
      }
    } catch {
      // Tabs may have closed between the dashboard click and the Agent question.
    }
  }

  return origins;
}

function resolveContextTabIdsForPermission(context) {
  if (Array.isArray(context?.tabIds) && context.tabIds.length) {
    return Array.from(new Set(context.tabIds.map((tabId) => Number(tabId)).filter(Number.isInteger)));
  }

  if (context?.scope === "current_group" && Number.isInteger(context.groupId)) {
    return getSnapshotTabs(latestRun)
      .filter((tab) => Number(tab.groupId) === Number(context.groupId))
      .map((tab) => Number(tab.id))
      .filter(Number.isInteger);
  }

  return [];
}

function buildOptionalOriginPermission(tab) {
  if (!tab?.url || tab.incognito || tab.pinned || tab.audible) return "";

  try {
    const url = new URL(tab.url);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    if (isSensitivePermissionTarget(tab, url)) return "";

    return `${url.protocol}//${url.hostname}/*`;
  } catch {
    return "";
  }
}

function isSensitivePermissionTarget(tab, url) {
  const value = [
    tab.title || "",
    url.hostname || "",
    url.pathname || ""
  ].join(" ").toLowerCase();

  return /(bank|billing|payment|finance|medical|health|password|admin|database|connection|supabase|stripe|aws|cloudflare|internal|localhost|127\.0\.0\.1)/.test(value);
}

function confirmSensitiveSummaryIfNeeded(check) {
  if (!check?.requiresConfirmation) {
    return null;
  }

  const target = check.hostname || check.title || msg("currentTab");
  return window.confirm(msg("sensitiveSummaryConfirm", [target]))
    ? check.tabId
    : false;
}

async function runQuickChatCommand(commandText, displayText = commandText) {
  appendUserChatMessage(displayText);
  await processChatText(commandText);
}

async function previewChatRefine(event) {
  event.preventDefault();
  const text = chatInput.value.trim();

  if (!text) {
    renderChatPanel({
      status: "error",
      answer: msg("tryChatExamples")
    });
    return;
  }

  appendUserChatMessage(getUserVisibleChatText(text));
  await processChatText(text);
}

async function handlePageRegionButtonClick() {
  const question = chatInput.value.trim();
  const displayText = question || msg("toolCardSelectPageRegion");

  latestChatDraft = null;
  appendUserChatMessage(displayText);
  await summarizeSelectedPageRegion(question);
  clearComposer();
}

function getUserVisibleChatText(text) {
  const normalized = normalizeAgentText(text);

  if (isPageRegionCommand(normalized)) {
    return extractRegionQuestion(text) || msg("toolCardSelectPageRegion");
  }

  return text;
}

function handleComposerKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;

  event.preventDefault();
  chatForm.requestSubmit();
}

function resizeComposer() {
  if (!chatInput) return;

  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 112)}px`;
}

function clearComposer() {
  chatInput.value = "";
  resizeComposer();
}

async function processChatText(text) {
  if (await handleAgentCommand(text)) {
    clearComposer();
    return true;
  }

  if (shouldRouteAgentWebSearch(text)) {
    latestChatDraft = null;
    await runAgentWebSearch(text);
    clearComposer();
    return true;
  }

  if (shouldRouteCurrentPageQuestion(text)) {
    latestChatDraft = null;
    await summarizeCurrentTab(text);
    clearComposer();
    return true;
  }

  if (shouldRouteContextTabsRegroupQuestion(text)) {
    latestChatDraft = null;
    await regroupContextTabs(text);
    clearComposer();
    return true;
  }

  if (shouldRouteContextTabsQuestion(text)) {
    latestChatDraft = null;
    await summarizeContextTabs(text);
    clearComposer();
    return true;
  }

  if (shouldRoutePastedLinks(text)) {
    latestChatDraft = null;
    latestDetectedLinks = extractPastedLinks(text);
    renderChatPanel({
      status: "link-detected",
      answer: buildDetectedLinksMarkdown(latestDetectedLinks),
      links: latestDetectedLinks
    });
    clearComposer();
    return true;
  }

  const readOnlyAnswer = await buildReadOnlyAgentAnswer(text, latestRun);
  if (readOnlyAnswer) {
    latestChatDraft = null;
    clearComposer();
    renderChatPanel(
      typeof readOnlyAnswer === "string"
        ? {
            status: "info",
            answer: readOnlyAnswer
          }
        : readOnlyAnswer
    );
    return true;
  }

  const tabSearchResult = buildTabSearchResult(text, latestRun);
  if (tabSearchResult) {
    latestChatDraft = null;
    clearComposer();
    renderChatPanel(tabSearchResult);
    return true;
  }

  setBusy(true);
  renderChatPanel({
    status: "loading",
    answer: msg("checkingCurrentTabs")
  });

  const response = await chrome.runtime.sendMessage({
    type: "PREVIEW_CHAT_REFINE",
    text
  });
  setBusy(false);

  if (response?.ok) {
    latestChatDraft = response.draft;
    renderChatPanel(response.draft);
    clearComposer();
    return true;
  }

  latestChatDraft = null;

  if (await askMetadataAgent(text)) {
    return true;
  }

  latestChatDraft = null;
  clearComposer();
  renderChatPanel({
    status: "info",
    answer: buildOpenChatFallbackAnswer(text)
  });
  return true;
}

function shouldRouteAgentWebSearch(text) {
  const normalized = normalizeAgentText(text);
  if (!normalized) return false;
  if (/\b(search|find|show|list)\s+tabs?\b/.test(normalized)) return false;
  if (/(搜索|查找|找).*(标签页|标签|tab)/.test(normalized)) return false;

  return (
    /\b(web\s+search|search\s+(the\s+)?web|search\s+online|look\s+up|research\s+online|find\s+online)\b/.test(normalized) ||
    /(联网搜索|网上搜索|网页搜索|搜索网页|上网查|网上查|查一下网上|搜一下网上)/.test(normalized)
  );
}

function shouldRoutePastedLinks(text) {
  return extractPastedLinks(text).length > 0;
}

function extractPastedLinks(text) {
  const matches = String(text || "").match(/https?:\/\/[^\s<>"'`]+/gi) || [];
  const seen = new Set();
  const links = [];

  for (const rawLink of matches) {
    const url = normalizeOpenableSearchResultUrl(rawLink.replace(/[),.;!?，。！？）]+$/g, ""));
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const parsed = parseBrowserWorkUrl(url);
    links.push({
      index: links.length,
      title: parsed.hostname || msg("linkedSource"),
      url,
      hostname: parsed.hostname,
      path: sanitizeBrowserWorkPath(parsed.path || ""),
      snippet: "",
      sourceType: "pasted_link"
    });
  }

  return links.slice(0, 4);
}

function buildDetectedLinksMarkdown(links = []) {
  const safeLinks = Array.isArray(links) ? links : [];
  const lines = [
    safeLinks.length === 1 ? msg("agentLinkDetected") : msg("agentLinksDetected", [safeLinks.length])
  ];

  safeLinks.slice(0, 4).forEach((link) => {
    const label = [link.hostname, link.path].filter(Boolean).join("");
    lines.push(`- ${label || link.url || msg("linkedSource")}`);
  });

  lines.push("", msg("agentLinksNoFetch"));
  return lines.join("\n");
}

async function runAgentWebSearch(text) {
  const query = extractAgentWebSearchQuery(text);

  appendChatMessage({
    role: "assistant",
    status: "tool-card",
    html: renderToolCard(buildWebSearchToolCard(query, "running")),
    text: "",
    includeInAIAgentContext: false
  });

  renderChatPanel({
    status: "loading",
    answer: msg("agentWebSearchRunning", [query || msg("webSearch")])
  });

  setBusy(true);
  let response;

  try {
    response = await chrome.runtime.sendMessage({
      type: "RUN_AGENT_WEB_SEARCH",
      query,
      requestPermission: true
    });
  } catch (error) {
    response = { ok: false, error: error?.message || msg("agentWebSearchFailed") };
  }

  setBusy(false);

  if (response?.ok && response.result?.status === "completed") {
    const resultCount = Number(response.result.resultCount || response.result.results?.length || 0);
    latestWebSearchResults = sanitizeSearchResultsForLocalWork(response.result.results || []);
    updateLatestToolCard(buildWebSearchToolCard(query, "completed", resultCount));
    renderChatPanel({
      status: "web-search",
      answer: buildWebSearchAnswer(response.result),
      results: latestWebSearchResults,
      providerLabel: response.result.providerLabel,
      query
    });
    return true;
  }

  updateLatestToolCard(buildWebSearchToolCard(query, "needs-provider"));

  if (response?.ok && response.result?.status === "not-configured") {
    renderChatPanel({
      status: "search-provider-needed",
      answer: msg("agentWebSearchNeedsProvider", [query || msg("webSearch")])
    });
    return true;
  }

  if (response?.ok && response.result?.status === "unsupported-provider") {
    renderChatPanel({
      status: "error",
      answer: msg("agentWebSearchUnsupportedProvider", [response.result.providerLabel || response.result.provider || msg("webSearch")])
    });
    return true;
  }

  renderChatPanel({
    status: "error",
    answer: msg("agentWebSearchFailed", [response?.error || msg("scanDidNotFinish")])
  });
  return true;
}

function extractAgentWebSearchQuery(text) {
  const normalized = String(text || "")
    .replace(/^\s*(please\s+)?/i, "")
    .replace(/\b(web\s+search|search\s+(the\s+)?web|search\s+online|look\s+up|research\s+online|find\s+online)\b/gi, " ")
    .replace(/(帮我|请|一下|联网搜索|网上搜索|网页搜索|搜索网页|上网查|网上查|查一下网上|搜一下网上|搜索一下|查一下)/g, " ")
    .replace(/[?？。.!！]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.slice(0, 120);
}

function buildOpenChatFallbackAnswer(text) {
  if (!latestRun?.snapshot?.tabs?.length && !latestRun?.groups?.length) {
    return msg("agentChatNeedsOrganize");
  }

  if (isAIGatedOpenChatQuestion(text)) {
    return msg("agentChatNeedsAI");
  }

  return msg("agentChatFallbackAnswer");
}

function isAIGatedOpenChatQuestion(text) {
  return !parseAgentCommand(text) &&
    !buildTabSearchResult(text, latestRun) &&
    !isCapabilityQuestion(normalizeAgentText(text));
}

function shouldRouteCurrentPageFollowUp(text) {
  const normalized = normalizeAgentText(text);

  if (!normalized || !isPageChatContextActive()) return false;
  if (isExplicitTabManagementQuestion(normalized)) return false;

  return isLikelyPageFollowUp(normalized);
}

function shouldRouteCurrentPageQuestion(text) {
  const normalized = normalizeAgentText(text);

  if (!normalized) return false;
  if (shouldRouteCurrentPageFollowUp(normalized)) return true;
  if (isExplicitTabManagementQuestion(normalized)) return false;
  if (!hasCurrentPageReference(normalized)) return false;

  return isLikelyPageFollowUp(normalized) || isQuestionLikeText(normalized);
}

function shouldRouteContextTabsQuestion(text) {
  const normalized = normalizeAgentText(text);
  const context = normalizeSidebarContext(activeSidebarContext);

  if (!normalized || !context) return false;
  if (!["current_group", "selected_tabs"].includes(context.scope)) return false;
  if (!context.tabIds?.length && !Number.isInteger(context.groupId)) return false;
  if (isCapabilityQuestion(normalized) || isRunOverviewQuestion(normalized) || isOptimizationQuestion(normalized)) return false;
  if (isDuplicateQuestion(normalized) || isDuplicateReviewQuestion(normalized) || isClosedTabsQuestion(normalized)) return false;
  if (isAIQuestion(normalized) || isProtectedTabsQuestion(normalized) || isReadLaterQuestion(normalized)) return false;
  if (shouldRouteContextTabsFollowUp(normalized)) return true;

  return isLikelyContextTabsDeepQuestion(normalized);
}

function shouldRouteContextTabsRegroupQuestion(text) {
  const normalized = normalizeAgentText(text);
  const context = normalizeSidebarContext(activeSidebarContext);

  if (!normalized || !context) return false;
  if (!["current_group", "selected_tabs"].includes(context.scope)) return false;
  if (!context.tabIds?.length && !Number.isInteger(context.groupId)) return false;

  return isLikelyContextTabsRegroupQuestion(normalized);
}

function isLikelyContextTabsRegroupQuestion(text) {
  return (
    /\b(reclassify|regroup|reorganize|re-organize|split|cluster|sort)\b.*\b(group|tabs?|pages?|content|actual|visible)\b/.test(text) ||
    /\b(group|tabs?|pages?)\b.*\b(reclassify|regroup|reorganize|re-organize|split|cluster|sort)\b/.test(text) ||
    /\bby\s+(actual\s+)?(page\s+)?content\b/.test(text) ||
    /(重新整理|重新分组|重新分类|按内容|根据内容|页面内容|实际内容|细分|拆分).*(分组|标签|tabs?|group)?/.test(text) ||
    /(分组|标签|tabs?|group).*(重新整理|重新分组|重新分类|按内容|根据内容|页面内容|实际内容|细分|拆分)/.test(text)
  );
}

function shouldRouteContextTabsFollowUp(text) {
  const normalized = normalizeAgentText(text);

  if (!normalized || !isContextTabsChatContextActive()) return false;
  if (isExplicitContextTabsManagementQuestion(normalized)) return false;

  return isLikelyContextTabsFollowUp(normalized);
}

function isExplicitContextTabsManagementQuestion(text) {
  const hasPageReference = hasCurrentPageReference(text);

  return (
    (isCapabilityQuestion(text) && !hasPageReference) ||
    isRunOverviewQuestion(text) ||
    isOptimizationQuestion(text) ||
    isDuplicateQuestion(text) ||
    isDuplicateReviewQuestion(text) ||
    isClosedTabsQuestion(text) ||
    isAIQuestion(text) ||
    isActiveTabQuestion(text) ||
    isProtectedTabsQuestion(text) ||
    isReadLaterQuestion(text) ||
    Boolean(extractTabSearchQuery(text) && !hasPageReference)
  );
}

function isLikelyContextTabsDeepQuestion(text) {
  return (
    /\b(this|current)\s+group\b/.test(text) ||
    /\b(these|selected)\s+tabs\b/.test(text) ||
    /\b(group|tabs?)\b.*\b(about|saying|say|content|summarize|summary|compare|explain|understand|actually|deep|reclassify|regroup|split)\b/.test(text) ||
    /\b(what|why|how|summarize|explain|compare|reclassify|regroup|split)\b.*\b(group|tabs?)\b/.test(text) ||
    /(这个|当前)?分组.*(讲|内容|总结|解释|比较|重新整理|重新分组|细分|是什么|干嘛)/.test(text) ||
    /(这些|选中).*标签.*(讲|内容|总结|解释|比较|重新整理|重新分组|细分)/.test(text)
  );
}

function isLikelyContextTabsFollowUp(text) {
  return (
    /\b(these|those|this|that|them|they|group|tabs?|pages?|context|content|priority|important|risk|next|compare|split|keep|close|read later)\b/.test(text) ||
    /\b(what about|how about|what should|what are|what is|what's|which|why|how|tell me|list|summarize|recap|rank|prioritize|compare|final decision|decision)\b/.test(text) ||
    /(这些|那些|这个|那个|它们|这个分组|这些标签|页面|内容|重点|优先级|风险|下一步|比较|总结|重新|拆分|保留|关闭|稍后|还有|那|然后呢|哪些|哪个|为什么|怎么|如何)/.test(text)
  );
}

function hasCurrentPageReference(text) {
  return (
    /\b(this|current|active)\s+(page|site|screen|tab)\b/.test(text) ||
    /\b(on|from|in)\s+this\s+(page|site|screen|tab)\b/.test(text) ||
    /(这个页面|当前页面|这页|当前网页|这个网页|这里|页面内容|网页内容)/.test(text)
  );
}

function isQuestionLikeText(text) {
  return /\b(what|why|how|where|which|who|is|are|does|do|can|could|would|should|explain|summarize|show|tell)\b/.test(text) ||
    /(什么|哪些|哪个|怎么|如何|为什么|是否|能不能|可以|总结|解释|显示|内容)/.test(text);
}

function isPageChatContextActive() {
  clearStalePageChatContext();

  return Boolean(
    latestPageChatContext &&
    isSamePageChatContext(activeSidebarContext, latestPageChatContext)
  );
}

function clearStalePageChatContext() {
  if (!latestPageChatContext) {
    pageChatMessages = [];
    return;
  }

  const updatedAt = Number(latestPageChatContext.updatedAt || 0);
  const expired = !updatedAt || Date.now() - updatedAt > PAGE_CHAT_CONTEXT_TTL_MS;

  if (expired || !isSamePageChatContext(activeSidebarContext, latestPageChatContext)) {
    latestPageChatContext = null;
    pageChatMessages = [];
  }
}

function isSamePageChatContext(activeContext, pageContext) {
  if (!pageContext) return false;

  const context = normalizeSidebarContext(activeContext) || {};
  const pageTabId = Number(pageContext.tabId);
  const contextTabId = Number(context.tabId);

  if (Number.isInteger(pageTabId) && Number.isInteger(contextTabId)) {
    return pageTabId === contextTabId;
  }

  const pageHost = String(pageContext.hostname || "").toLowerCase();
  const contextHost = String(context.hostname || "").toLowerCase();
  const pageTitle = normalizeConversationText(pageContext.title || "");
  const contextTitle = normalizeConversationText(context.title || "");

  return Boolean(pageHost && contextHost && pageHost === contextHost && (!pageTitle || !contextTitle || pageTitle === contextTitle));
}

function isContextTabsChatContextActive() {
  clearStaleContextTabsChatContext();

  return Boolean(
    latestContextTabsChatContext &&
    isSameContextTabsChatContext(activeSidebarContext, latestContextTabsChatContext)
  );
}

function clearStaleContextTabsChatContext() {
  if (!latestContextTabsChatContext) {
    contextTabsMessages = [];
    return;
  }

  const updatedAt = Number(latestContextTabsChatContext.updatedAt || 0);
  const expired = !updatedAt || Date.now() - updatedAt > PAGE_CHAT_CONTEXT_TTL_MS;

  if (expired || !isSameContextTabsChatContext(activeSidebarContext, latestContextTabsChatContext)) {
    latestContextTabsChatContext = null;
    contextTabsMessages = [];
  }
}

function isSameContextTabsChatContext(activeContext, savedContext) {
  if (!savedContext) return false;

  const context = normalizeSidebarContext(activeContext) || {};
  if (!["current_group", "selected_tabs"].includes(context.scope)) return false;
  if (context.scope !== savedContext.scope) return false;

  if (context.scope === "current_group") {
    const contextGroupId = Number(context.groupId);
    const savedGroupId = Number(savedContext.groupId);

    if (Number.isInteger(contextGroupId) && Number.isInteger(savedGroupId)) {
      return contextGroupId === savedGroupId;
    }

    return normalizeConversationText(context.groupName || "") === normalizeConversationText(savedContext.groupName || "");
  }

  return stableTabIds(context.tabIds).join(",") === stableTabIds(savedContext.tabIds).join(",");
}

function stableTabIds(tabIds) {
  return Array.from(new Set((Array.isArray(tabIds) ? tabIds : [])
    .map((tabId) => Number(tabId))
    .filter(Number.isInteger)))
    .sort((a, b) => a - b);
}

function isExplicitTabManagementQuestion(text) {
  const hasPageReference = hasCurrentPageReference(text);

  return (
    (isCapabilityQuestion(text) && !hasPageReference) ||
    isRunOverviewQuestion(text) ||
    isOptimizationQuestion(text) ||
    isGroupQuestion(text) ||
    isDuplicateQuestion(text) ||
    isDuplicateReviewQuestion(text) ||
    isClosedTabsQuestion(text) ||
    isAIQuestion(text) ||
    isActiveTabQuestion(text) ||
    isProtectedTabsQuestion(text) ||
    isReadLaterQuestion(text) ||
    Boolean(extractTabSearchQuery(text) && !hasCurrentPageReference(text))
  );
}

function isLikelyPageFollowUp(text) {
  return (
    /\b(this|that|it|there|here|page|content|section|setting|settings|database|backup|backups|pooling|connection|configuration|config|project)\b/.test(text) ||
    /\b(what about|how about|what should|what are|what is|what's|is|are|do|does|did|could|would|should i|can i|does it|is it|where|which|why|how|tell me|list|summarize|recap|final decision|decision)\b/.test(text) ||
    /(这个|这个页面|当前页面|这页|这里|它|里面|内容|设置|数据库|备份|连接|配置|项目|还有|那|然后呢|是否|怎么|如何|为什么|哪里|哪些)/.test(text)
  );
}

async function askMetadataAgent(text) {
  const conversationHistory = buildAIAgentConversationHistory(text);

  renderChatPanel({
    status: "loading",
    answer: msg("askingAIAgent")
  });

  setBusy(true);

  let response;
  try {
    response = await chrome.runtime.sendMessage({
      type: "ASK_TAB_AGENT",
      text,
      context: getAIAgentContextPayload(),
      conversationHistory
    });
  } catch (error) {
    setBusy(false);
    renderChatPanel({
      status: "error",
      answer: error?.message || msg("couldNotBuildSafeAction")
    });
    clearComposer();
    return true;
  }

  setBusy(false);

  if (response?.ok && response.result?.status === "answered") {
    renderChatPanel({
      ...response.result,
      status: "ai-agent"
    });
    clearComposer();
    return true;
  }

  if (response?.ok && response.result?.status === "draft" && response.result.draft) {
    latestChatDraft = response.result.draft;
    renderChatPanel(response.result.draft);
    clearComposer();
    return true;
  }

  if (response?.ok && ["not-configured", "no-context"].includes(response.result?.status)) {
    return false;
  }

  if (response?.ok && response.result?.status === "fallback") {
    renderChatPanel({
      status: "error",
      answer: msg("agentAIAnswerFailed", [response.result.error || msg("scanDidNotFinish")])
    });
    clearComposer();
    return true;
  }

  renderChatPanel({
    status: "error",
    answer: response?.error || msg("couldNotBuildSafeAction")
  });
  clearComposer();
  return true;
}

async function handleAgentCommand(text) {
  const command = parseAgentCommand(text);

  if (!command) {
    return false;
  }

  const pageQuestion = command === "summarize" ? extractPageQuestion(text) : "";
  if (command === "summarize") {
    await summarizeCurrentTab(pageQuestion);
    return true;
  }

  const regionQuestion = command === "selectRegion" ? extractRegionQuestion(text) : "";
  if (command === "selectRegion") {
    await summarizeSelectedPageRegion(regionQuestion);
    return true;
  }

  if (command === "createPageTodo") {
    await createChecklistTodoFromCurrentPage(text);
    return true;
  }

  if (command === "createTodo") {
    await createTodoFromSidebarContext(text);
    return true;
  }

  const messages = {
    summarize: pageQuestion ? msg("agentCommandAskPage") : msg("agentCommandSummarize"),
    selectRegion: msg("agentCommandSelectRegion"),
    organize: msg("agentCommandOrganize"),
    undo: msg("agentCommandUndo"),
    restore: msg("agentCommandRestore"),
    dashboard: msg("agentCommandDashboard"),
    saveWorkspace: msg("agentCommandSaveWorkspace")
  };

  renderChatPanel({
    status: "applied",
    answer: messages[command] || msg("applied")
  });

  if (command === "organize") {
    await organizeNow();
    return true;
  }

  if (command === "undo") {
    await undoLast();
    return true;
  }

  if (command === "restore") {
    await restoreClosed();
    return true;
  }

  if (command === "dashboard") {
    await openDashboard();
    return true;
  }

  if (command === "saveWorkspace") {
    await saveCurrentWorkspace();
    return true;
  }

  return false;
}

function parseAgentCommand(text) {
  const normalized = normalizeAgentText(text);

  if (isPageRegionCommand(normalized)) return "selectRegion";
  if (isCreatePageTodoCommand(normalized)) return "createPageTodo";
  if (isSummaryCommand(normalized)) return "summarize";
  if (isCreateTodoCommand(normalized)) return "createTodo";
  if (isSaveWorkspaceCommand(normalized)) return "saveWorkspace";
  if (isDashboardCommand(normalized)) return "dashboard";
  if (isRestoreCommand(normalized)) return "restore";
  if (isUndoCommand(normalized)) return "undo";
  if (isOrganizeCommand(normalized)) return "organize";

  return "";
}

function normalizeAgentText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isSummaryCommand(text) {
  return (
    /\b(summarize|summary|explain|ask page|read this page|current page summary|summarize current tab)\b/.test(text) ||
    /\bwhat('s| is) this page\b/.test(text) ||
    /\bwhat (content|information) (does|is on|is in) this page\b/.test(text) ||
    /\bwhat (does|can) this page (do|show|say|explain|contain)\b/.test(text) ||
    /\bwhat is this page (for|about)\b/.test(text) ||
    /总结|摘要|问页面|解释页面/.test(text) ||
    /(这个页面|当前页面|这页|这个网页|当前网页).*(讲了什么|是什么|是啥|干嘛|做什么|有什么用|用来做什么|有什么内容|包含什么|显示什么|有哪些内容|内容|总结|摘要|解释)/.test(text)
  );
}

function isPageRegionCommand(text) {
  return (
    /\b(select|pick|choose|read|summarize|explain|ask)\s+(?:this\s+)?(?:page\s+)?(?:region|section|area|block|panel|table|card)\b/.test(text) ||
    /\b(?:page\s+)?(?:region|section|area|block|panel|table|card)\s+(?:context|chat|question)\b/.test(text) ||
    /(?:选择|选取|点选|读取|总结|解释|问).*(?:页面|网页|当前页)?.*(?:区域|区块|板块|卡片|表格)/.test(text) ||
    /(?:区域|区块|板块|卡片|表格).*(?:作为上下文|问答|对话|总结|解释)/.test(text)
  );
}

function extractRegionQuestion(text) {
  const value = String(text || "").trim();
  const patterns = [
    /^(?:ask|question)\s+(?:this\s+)?(?:page\s+)?(?:region|section|area|block|panel|table|card)(?:\s+about)?[:：]?\s+(.+)$/i,
    /^(?:select|pick|choose|read|summarize|summarise|explain)\s+(?:this\s+)?(?:page\s+)?(?:region|section|area|block|panel|table|card)(?:\s+and)?(?:\s+ask)?[:：]?\s*(.+)$/i,
    /^(?:use|from)\s+(?:this\s+)?(?:page\s+)?(?:region|section|area|block|panel|table|card)(?:\s+as\s+context)?[:：]?\s*(.+)$/i,
    /^(?:选择|选取|点选|读取|总结|解释|问)(?:这个|当前)?(?:页面|网页|当前页)?(?:的)?(?:区域|区块|板块|卡片|表格)[:：]?\s*(.+)$/,
    /^(?:把|用)(?:这个|当前)?(?:区域|区块|板块|卡片|表格)(?:作为上下文)?(?:问|总结|解释)?[:：]?\s*(.+)$/
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const question = sanitizePageQuestion(match?.[1] || "");

    if (question && !isGenericPageRegionQuestion(question)) {
      return question;
    }
  }

  return "";
}

function extractPageQuestion(text) {
  const value = String(text || "").trim();
  const patterns = [
    /^(?:ask|question)\s+(?:this\s+)?page(?:\s+about)?[:：]?\s+(.+)$/i,
    /^(?:ask|question)\s+(?:the\s+)?current\s+page(?:\s+about)?[:：]?\s+(.+)$/i,
    /^(?:on\s+this\s+page|from\s+this\s+page)[:,]?\s+(.+)$/i,
    /^(?:summarize|summarise|explain|recap|list|tell me)\s+(.+)$/i,
    /^(?:what(?:'s| is) this page(?: for| about)?|what does this page (?:do|show|say|explain|contain))$/i,
    /^(?:what (?:content|information) (?:does|is on|is in) this page(?:\s+(?:have|show|contain))?)$/i,
    /^(?:问|问一下|问问)(?:这个|当前)?页面[:：]?\s*(.+)$/,
    /^(?:这个|当前)?(?:页面|网页|页)(?:里|中)?(?:.*?)(?:是什么|是啥|干嘛|做什么|有什么用|用来做什么|有什么内容|包含什么|显示什么|有哪些内容|有哪些|怎么|如何|为什么|是否).*$/
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const question = sanitizePageQuestion(match?.[1] || match?.[0] || "");

    if (question && !isGenericPageSummaryQuestion(question)) {
      return question;
    }
  }

  return "";
}

function sanitizePageQuestion(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?？。.!！]+$/g, "")
    .slice(0, 240);
}

function isGenericPageSummaryQuestion(value) {
  const text = normalizeAgentText(value);
  return /^(summarize|summary|explain|read this page|what is this page|what's this page)$/.test(text) ||
    /^(what content does this page|what content does this page have|what information does this page|what information is on this page|what information is in this page)$/.test(text) ||
    /^(总结|摘要|解释|这个页面讲了什么|当前页面讲了什么|这个页面有什么内容|当前页面有什么内容|这个页面包含什么|当前页面包含什么|这个页面显示什么|当前页面显示什么)$/.test(text);
}

function isGenericPageRegionQuestion(value) {
  const text = normalizeAgentText(value);
  return /^(select|pick|choose|read|summarize|summary|explain)?\s*(page\s+)?(region|section|area|block|panel|table|card)$/.test(text) ||
    /^(选择|选取|点选|读取|总结|解释)?(这个|当前)?(页面|网页|当前页)?(的)?(区域|区块|板块|卡片|表格)$/.test(text);
}

function isDashboardCommand(text) {
  return /\bdashboard\b/.test(text) || /打开\s*dashboard|打开工作台|去工作台|看工作台/.test(text);
}

function isSaveWorkspaceCommand(text) {
  return (
    /\b(save|store)\s+(this\s+|current\s+)?workspace\b/.test(text) ||
    /\bsave\s+(this\s+|current\s+)?browser\b/.test(text) ||
    /保存.*(工作区|当前整理|浏览器)/.test(text)
  );
}

function isCreateTodoCommand(text) {
  return (
    /\b(create|make|add|save|turn)\b.{0,60}\b(todo|to-do|task|action item|work queue)\b/.test(text) ||
    /\b(this|these|tab|tabs?|group|page|context)\b.{0,40}\b(should be|as|into)\b.{0,20}\b(todo|to-do|task|action item)\b/.test(text) ||
    /(?:创建|生成|加入|保存|变成).{0,40}(?:待办|任务|todo|行动项)/.test(text) ||
    /(?:把|将).{0,50}(?:页面|标签|tab|tabs|group|分组|这些|当前).{0,50}(?:待办|任务|todo|行动项)/.test(text)
  );
}

function isCreatePageTodoCommand(text) {
  return (
    /\b(create|make|turn|convert)\b.{0,80}\b(page|current page|this page)\b.{0,80}\b(todo|to-do|task|checklist|action plan|next steps?)\b/.test(text) ||
    /\b(page|current page|this page)\b.{0,80}\b(into|as)\b.{0,30}\b(todo|to-do|task|checklist|action plan)\b/.test(text) ||
    /(?:把|将).{0,20}(?:当前)?(?:页面|网页|这页).{0,50}(?:待办|任务|清单|执行计划|行动项)/.test(text) ||
    /(?:根据|基于).{0,20}(?:当前)?(?:页面|网页|这页).{0,50}(?:生成|创建|整理).{0,20}(?:待办|任务|清单|执行计划|行动项)/.test(text)
  );
}

function isRestoreCommand(text) {
  return (
    /\brestore (closed|duplicate|duplicates|tabs)\b/.test(text) ||
    /恢复.*(关闭|已关闭|重复)/.test(text)
  );
}

function isUndoCommand(text) {
  return /\b(undo|revert)\b/.test(text) || /撤销|还原上次/.test(text);
}

function isOrganizeCommand(text) {
  return (
    /\b(organize|organise|organize again|clean up tabs|group tabs|sort tabs)\b/.test(text) ||
    /重新整理|整理标签|整理一下|分组标签/.test(text)
  );
}

async function buildReadOnlyAgentAnswer(text, run) {
  const normalized = normalizeAgentText(text);

  if (isCapabilityQuestion(normalized)) {
    return msg("agentCapabilitiesAnswer");
  }

  if (!run || !["completed", "closed-restored", "undone"].includes(run.status)) {
    if (
      isNextStepQuestion(normalized) ||
      isOptimizationQuestion(normalized) ||
      isRunOverviewQuestion(normalized) ||
      isGroupQuestion(normalized) ||
      isDuplicateQuestion(normalized) ||
      isDuplicateReviewQuestion(normalized) ||
      isClosedTabsQuestion(normalized) ||
      isAIQuestion(normalized) ||
      isActiveTabQuestion(normalized) ||
      isProtectedTabsQuestion(normalized) ||
      isReadLaterQuestion(normalized)
    ) {
      return msg("agentNoRunYet");
    }

    return "";
  }

  if (isNextStepQuestion(normalized)) {
    return buildNextStepAnswer(run);
  }

  if (isOptimizationQuestion(normalized)) {
    return buildOptimizationAnswer(run);
  }

  if (isActiveTabQuestion(normalized)) {
    return buildActiveTabsAnswer(run);
  }

  if (isProtectedTabsQuestion(normalized)) {
    return buildProtectedTabsAnswer(run);
  }

  if (isReadLaterQuestion(normalized)) {
    return buildReadLaterAnswer(run);
  }

  if (isClosedTabsQuestion(normalized)) {
    return buildClosedTabsAnswer(run, await getClosedDuplicateSnapshot());
  }

  if (isDuplicateReviewQuestion(normalized)) {
    return buildDuplicateReviewAnswer(run);
  }

  if (isAIQuestion(normalized)) {
    return buildAIStatusAnswer(run);
  }

  if (isDuplicateQuestion(normalized)) {
    return buildDuplicateAnswer(run);
  }

  if (isGroupQuestion(normalized)) {
    return buildGroupsAnswer(run);
  }

  if (isRunOverviewQuestion(normalized)) {
    return buildRunOverviewAnswer(run);
  }

  return "";
}

function isRunOverviewQuestion(text) {
  return (
    /\b(what happened|what did you do|what changed|status|result|results|overview|recap)\b/.test(text) ||
    /刚才.*(做了什么|整理了什么)|结果|状态|概览|整理情况|发生了什么/.test(text)
  );
}

function isCapabilityQuestion(text) {
  return (
    /\b(help|commands?|what can you do|what can i ask|how do i use|how to use)\b/.test(text) ||
    /帮助|怎么用|如何使用|你能做什么|可以问什么|有哪些命令|能干什么/.test(text)
  );
}

function isNextStepQuestion(text) {
  return (
    /\b(what next|what'?s next|next step|next steps|what should i do next|what do i do next|where should i start|recommend next)\b/.test(text) ||
    /下一步|接下来|然后呢|我该做什么|建议.*做什么|从哪里开始/.test(text)
  );
}

function isOptimizationQuestion(text) {
  return (
    /\b(optimi[sz](e|ed|ation)|clean(?:ed)? up|memory saved|memory freed|memory relief|how much memory|freed memory|saved memory|impact)\b/.test(text) ||
    /优化|清理|释放.*内存|内存.*(释放|省|节省|降低)|本次优化|效果如何|节省了多少/.test(text)
  );
}

function isGroupQuestion(text) {
  return /\b(groups?|what groups|show groups|list groups)\b/.test(text) || /分组|有哪些组|哪些组|组了什么/.test(text);
}

function isDuplicateQuestion(text) {
  return /\b(duplicates?|dupes?|closed tabs?|memory|restore)\b/.test(text) || /重复|关闭了|恢复|内存/.test(text);
}

function isDuplicateReviewQuestion(text) {
  return (
    /\b(what should i review|what needs review|needs review|review duplicates?|duplicates? to review|which duplicates? need review)\b/.test(text) ||
    /需要.*(确认|review|检查)|待确认.*重复|哪些.*重复.*(确认|检查)|我该.*(看|检查).*(重复|review)/.test(text)
  );
}

function isClosedTabsQuestion(text) {
  return (
    /\b(what did you close|what was closed|which tabs did you close|what tabs were closed|closed duplicate tabs)\b/.test(text) ||
    /刚才.*(关|关闭).*(什么|哪些)|关闭了哪些|关掉了哪些|已关闭.*标签/.test(text)
  );
}

function isAIQuestion(text) {
  return /\b(ai|deepseek|model|classification)\b/.test(text) || /ai|deepseek|模型|智能|分类/.test(text);
}

function isActiveTabQuestion(text) {
  return (
    /\b(active tab|current active tab|what tab am i on|which tab am i on|where am i now)\b/.test(text) ||
    /当前(活跃|打开|正在看).*标签|现在.*(哪个|哪一个).*标签/.test(text)
  );
}

function isProtectedTabsQuestion(text) {
  return (
    /\b(protected tabs?|what is protected|pinned tabs?|audible tabs?|tabs? protected from close|cannot close|won'?t close)\b/.test(text) ||
    /受保护|固定标签|播放声音|哪些.*不能关闭|不会关闭/.test(text)
  );
}

function isReadLaterQuestion(text) {
  return (
    /\b(read later|reading list|later tabs|articles to read|save for later|to read)\b/.test(text) ||
    /稍后(再)?看|稍后阅读|待读|待读|阅读列表|可以晚点看/.test(text)
  );
}

function buildRunOverviewAnswer(run) {
  const summary = run.summary || {};
  const groupNames = getTopGroupNames(run);
  const groupCopy = groupNames.length ? msg("agentOverviewGroups", [groupNames.join(", ")]) : msg("agentOverviewNoGroups");
  return msg("agentOverviewAnswer", [
    summary.groupsCreated ?? 0,
    summary.tabsMoved ?? 0,
    summary.safeDuplicatesClosed ?? 0,
    summary.reviewDuplicateGroups ?? 0,
    groupCopy
  ]);
}

function buildOptimizationAnswer(run) {
  const summary = run.summary || {};
  const groupNames = getTopGroupNames(run);
  const groupCopy = groupNames.length ? msg("agentOverviewGroups", [groupNames.join(", ")]) : msg("agentOverviewNoGroups");
  const safeClosed = Number(summary.safeDuplicatesClosed || 0);
  const reviewGroups = Number(summary.reviewDuplicateGroups || 0);

  return {
    status: "optimization",
    answer: msg("agentOptimizationAnswer", [
      summary.groupsCreated ?? 0,
      summary.tabsMoved ?? 0,
      safeClosed,
      reviewGroups,
      safeClosed,
      groupCopy
    ]),
    metrics: [
      { label: msg("groups"), value: summary.groupsCreated ?? 0 },
      { label: msg("tabsOrganized"), value: summary.tabsMoved ?? 0 },
      { label: msg("closedDupes"), value: safeClosed },
      { label: msg("reviewDupes"), value: reviewGroups },
      { label: msg("memoryRelief"), value: safeClosed }
    ],
    actions: buildOptimizationActions(summary)
  };
}

function buildOptimizationActions(summary) {
  const actions = [
    { label: msg("groups"), command: "show groups" },
    { label: msg("openDashboard"), command: "open dashboard" }
  ];

  if (Number(summary.reviewDuplicateGroups || 0) > 0) {
    actions.splice(1, 0, { label: msg("reviewDuplicates"), command: "what needs review" });
  }

  if (summary.closedTabsRestoreAvailable || Number(summary.safeDuplicatesClosed || 0) > 0) {
    actions.splice(1, 0, { label: msg("restoreClosed"), command: "restore closed" });
  }

  return actions.slice(0, 4);
}

function buildNextStepAnswer(run) {
  const summary = run.summary || {};
  const reviewGroups = Number(summary.reviewDuplicateGroups || getReviewDuplicateGroups(run).length || 0);
  const restoreAvailable = Boolean(summary.closedTabsRestoreAvailable);
  const groupNames = getTopGroupNames(run);

  if (reviewGroups > 0) {
    return msg("agentNextStepReview", [reviewGroups]);
  }

  if (restoreAvailable) {
    return msg("agentNextStepRestore");
  }

  if (groupNames.length) {
    return msg("agentNextStepGroups", [groupNames.join(", ")]);
  }

  return msg("agentNextStepNoGroups");
}

function buildGroupsAnswer(run) {
  const groups = Array.isArray(run.groups) ? run.groups : [];

  if (!groups.length) {
    return msg("agentGroupsEmpty");
  }

  const groupCopy = groups
    .slice(0, 4)
    .map((group) => `${group.name} (${group.tabCount || 0})`)
    .join(", ");
  const hiddenCount = Math.max(0, groups.length - 4);

  return hiddenCount
    ? msg("agentGroupsAnswerMore", [groupCopy, hiddenCount])
    : msg("agentGroupsAnswer", [groupCopy]);
}

function buildDuplicateAnswer(run) {
  const summary = run.summary || {};
  const safeClosed = Number(summary.safeDuplicatesClosed || summary.restoredClosedTabs || 0);
  const reviewGroups = Number(summary.reviewDuplicateGroups || 0);
  const restoreAvailable = Boolean(summary.closedTabsRestoreAvailable);

  if (!safeClosed && !reviewGroups) {
    return msg("agentDuplicatesNone");
  }

  return msg("agentDuplicatesAnswer", [
    safeClosed,
    reviewGroups,
    restoreAvailable ? msg("available") : msg("notAvailable")
  ]);
}

function buildDuplicateReviewAnswer(run) {
  const duplicateGroups = getReviewDuplicateGroups(run);

  if (!duplicateGroups.length) {
    return msg("agentReviewDuplicatesNone");
  }

  const groupsCopy = duplicateGroups
    .slice(0, 4)
    .map((group) => `${group.label || msg("duplicates")} (${group.tabCount || group.tabIds?.length || 0})`)
    .join("; ");
  const hiddenCount = Math.max(0, duplicateGroups.length - 4);

  return hiddenCount
    ? msg("agentReviewDuplicatesAnswerMore", [duplicateGroups.length, groupsCopy, hiddenCount])
    : msg("agentReviewDuplicatesAnswer", [duplicateGroups.length, groupsCopy]);
}

function buildClosedTabsAnswer(run, restoreSnapshot) {
  const summary = run.summary || {};
  const restoredCount = Number(summary.restoredClosedTabs || 0);
  const failedCount = Number(summary.restoreFailedTabs || 0);

  if (restoredCount > 0) {
    return msg("agentClosedTabsRestored", [restoredCount, failedCount]);
  }

  const closedTabs = Array.isArray(restoreSnapshot?.closedTabs) ? restoreSnapshot.closedTabs : [];

  if (closedTabs.length) {
    const visibleTabs = closedTabs.slice(0, 5);
    const hiddenCount = Math.max(0, closedTabs.length - visibleTabs.length);
    const tabCopy = visibleTabs.map(formatClosedTabLine).join("; ");

    return hiddenCount
      ? msg("agentClosedTabsAnswerMore", [closedTabs.length, tabCopy, hiddenCount])
      : msg("agentClosedTabsAnswer", [closedTabs.length, tabCopy]);
  }

  const closedCount = Number(summary.safeDuplicatesClosed || 0) + Number(summary.reviewDuplicatesClosed || 0);

  if (closedCount > 0) {
    return msg("agentClosedTabsCountOnly", [
      closedCount,
      summary.closedTabsRestoreAvailable ? msg("available") : msg("notAvailable")
    ]);
  }

  return msg("agentClosedTabsNone");
}

function buildAIStatusAnswer(run) {
  const summary = run.summary || {};
  const status = summary.aiClassificationStatus || "not-configured";
  const groupCount = Number(summary.aiGroupsSuggested || 0);

  if (status === "applied") {
    return msg("agentAIStatusApplied", [groupCount]);
  }

  if (String(status).startsWith("fallback:")) {
    return msg("agentAIStatusFallback");
  }

  if (status === "empty") {
    return msg("agentAIStatusEmpty");
  }

  return msg("agentAIStatusLocal");
}

function buildActiveTabsAnswer(run) {
  const activeTabs = getSnapshotTabs(run).filter((tab) => tab.active);

  if (!activeTabs.length) {
    return msg("agentActiveTabsNone");
  }

  const visibleTabs = activeTabs.slice(0, 3);
  const tabCopy = visibleTabs.map(formatAgentTabLine).join("; ");
  const hiddenCount = Math.max(0, activeTabs.length - visibleTabs.length);

  return hiddenCount
    ? msg("agentActiveTabsAnswerMore", [tabCopy, hiddenCount])
    : msg("agentActiveTabsAnswer", [tabCopy]);
}

function buildProtectedTabsAnswer(run) {
  const tabs = getSnapshotTabs(run);
  const protectedTabs = tabs.filter((tab) => getTabProtectionReasons(tab).length > 0);

  if (!protectedTabs.length) {
    return msg("agentProtectedTabsNone");
  }

  const counts = run.summary?.protectedCounts || buildProtectedCounts(protectedTabs);
  const countCopy = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([reason, count]) => `${formatProtectionReason(reason)} ${count}`)
    .join(", ");
  const exampleCopy = protectedTabs.slice(0, 3).map(formatAgentTabLine).join("; ");

  return msg("agentProtectedTabsAnswer", [
    protectedTabs.length,
    countCopy || msg("none"),
    exampleCopy || msg("none")
  ]);
}

function buildReadLaterAnswer(run) {
  const groups = Array.isArray(run.groups) ? run.groups : [];
  const tabs = getSnapshotTabs(run);
  const tabById = new Map(tabs.map((tab) => [tab.id, tab]));
  const groupCandidates = groups
    .filter((group) => isReadLaterGroupName(group.name))
    .flatMap((group) => (group.tabIds || []).map((tabId) => tabById.get(tabId)).filter(Boolean));
  const heuristicCandidates = tabs.filter(isReadLaterTabCandidate);
  const candidates = dedupeTabsById([...groupCandidates, ...heuristicCandidates])
    .filter((tab) => !tab.active)
    .slice(0, 5);

  if (!candidates.length) {
    return msg("agentReadLaterNone");
  }

  return msg("agentReadLaterAnswer", [
    candidates.length,
    candidates.map(formatAgentTabLine).join("; ")
  ]);
}

function getTopGroupNames(run) {
  return (Array.isArray(run.groups) ? run.groups : [])
    .filter((group) => group?.name)
    .slice(0, 3)
    .map((group) => group.name);
}

function getSnapshotTabs(run) {
  return Array.isArray(run?.snapshot?.tabs) ? run.snapshot.tabs : [];
}

function getReviewDuplicateGroups(run) {
  return (Array.isArray(run?.duplicateGroups) ? run.duplicateGroups : []).filter(
    (group) => group.action === "review" && group.reviewStatus !== "kept"
  );
}

async function getClosedDuplicateSnapshot() {
  const result = await chrome.storage.local.get(LAST_CLOSED_TABS_KEY);
  return result[LAST_CLOSED_TABS_KEY] || null;
}

function getTabProtectionReasons(tab) {
  const reasons = Array.isArray(tab.protectedReasons) ? [...tab.protectedReasons] : [];

  if (tab.active) reasons.push("active");
  if (tab.pinned) reasons.push("pinned");
  if (tab.audible) reasons.push("audible");
  if (tab.incognito) reasons.push("incognito");
  if (tab.urlScheme && !["http", "https"].includes(tab.urlScheme)) reasons.push("internal");

  return Array.from(new Set(reasons));
}

function buildProtectedCounts(tabs) {
  return tabs.reduce((counts, tab) => {
    for (const reason of getTabProtectionReasons(tab)) {
      counts[reason] = (counts[reason] || 0) + 1;
    }
    return counts;
  }, {});
}

function formatProtectionReason(reason) {
  const copy = {
    active: msg("currentTab"),
    pinned: msg("pinned"),
    audible: msg("audible"),
    incognito: msg("incognito"),
    internal: "internal"
  };

  return copy[reason] || reason;
}

function formatAgentTabLine(tab) {
  const title = tab.title || msg("untitled");
  const meta = [tab.hostname]
    .filter(Boolean)
    .join(" · ");

  return meta ? `${title} (${meta})` : title;
}

function formatClosedTabLine(tab) {
  const title = tab.title || msg("untitled");
  const hostname = getHostnameFromUrl(tab.url);

  return hostname ? `${title} (${hostname})` : title;
}

function getHostnameFromUrl(rawUrl) {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return "";
  }
}

function normalizeFaviconUrl(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) return "";
  if (rawValue.startsWith("data:image/")) return rawValue;

  try {
    const url = new URL(rawValue);

    if (!["http:", "https:"].includes(url.protocol)) return "";

    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function getFaviconLetter(tab = {}) {
  const source = getHostnameFromUrl(tab.url || tab.pendingUrl || "") || tab.title || "t";
  return source.replace(/^www\./, "").charAt(0).toLowerCase() || "t";
}

function isReadLaterGroupName(name) {
  return /\b(read|reading|article|articles|later|research|docs?)\b|阅读|稍后|待读|待读|资料|文档/.test(
    normalizeAgentText(name)
  );
}

function isReadLaterTabCandidate(tab) {
  const text = `${tab.title || ""} ${tab.hostname || ""} ${tab.path || ""}`.toLowerCase();
  return /\b(article|blog|post|guide|tutorial|docs?|reference|research|paper|readme)\b|阅读|文档|教程|文章|资料/.test(text);
}

function dedupeTabsById(tabs) {
  const seen = new Set();
  const deduped = [];

  for (const tab of tabs) {
    if (!tab?.id || seen.has(tab.id)) continue;
    seen.add(tab.id);
    deduped.push(tab);
  }

  return deduped;
}

function mostCommonValue(values) {
  const counts = new Map();
  values.forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function buildTabSearchResult(text, run) {
  const query = extractTabSearchQuery(text);

  if (!query) {
    return null;
  }

  if (!run?.snapshot?.tabs?.length) {
    return {
      status: "info",
      answer: msg("agentNoRunYet")
    };
  }

  const matches = findMatchingTabs(run.snapshot.tabs, query);

  if (!matches.length) {
    return {
      status: "info",
      answer: msg("agentFindNoMatches", [query])
    };
  }

  return {
    status: "tab-search",
    answer: msg("agentFindTabsAnswer", [matches.length, query]),
    matchedTabs: matches.slice(0, 8),
    matchedTabCount: matches.length
  };
}

function extractTabSearchQuery(text) {
  const normalized = normalizeAgentText(text);
  const patterns = [
    /^(?:find|search|show|list)\s+(?:tabs?\s+)?(?:for\s+)?(.+)$/,
    /^(?:open|focus|go to)\s+(?!dashboard\b)(?:tab\s+)?(.+)$/,
    /^(?:找|查找|搜索|打开|定位)(?:一下)?(?:标签页|标签|tab)?(?:里)?(?:的)?(.+)$/
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const query = sanitizeTabSearchQuery(match?.[1] || "");

    if (query) {
      return query;
    }
  }

  return "";
}

function sanitizeTabSearchQuery(value) {
  return String(value || "")
    .replace(/\b(tabs?|tab|please|for|about)\b/g, " ")
    .replace(/[?？。.!！]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function findMatchingTabs(tabs, query) {
  const tokens = query
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length >= 2)
    .slice(0, 6);

  if (!tokens.length) return [];

  return (Array.isArray(tabs) ? tabs : [])
    .map((tab) => ({
      tab,
      score: scoreTabSearchMatch(tab, tokens)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(Boolean(b.tab.active)) - Number(Boolean(a.tab.active)))
    .slice(0, 12)
    .map((item) => item.tab);
}

function scoreTabSearchMatch(tab, tokens) {
  const title = String(tab.title || "").toLowerCase();
  const hostname = String(tab.hostname || "").toLowerCase();
  const path = String(tab.path || "").toLowerCase();
  const haystack = `${title} ${hostname} ${path}`;
  let score = 0;

  for (const token of tokens) {
    if (hostname.includes(token)) score += 4;
    if (title.includes(token)) score += 3;
    if (path.includes(token)) score += 2;
    if (!haystack.includes(token)) score -= 2;
  }

  if (tab.active) score += 0.5;
  return score;
}

async function handleChatPanelAction(event) {
  const button = event.target.closest("[data-chat-action]");
  if (!button || button.disabled) return;

  if (button.dataset.chatAction === "focus-tab") {
    await focusChatTab(Number(button.dataset.tabId));
    return;
  }

  if (button.dataset.chatAction === "open-search-result") {
    await openSearchResult(button.dataset.searchUrl || "");
    return;
  }

  if (button.dataset.chatAction === "save-search-result") {
    await saveSearchResultAsCollection(Number(button.dataset.searchIndex));
    return;
  }

  if (button.dataset.chatAction === "todo-search-result") {
    await createTodoFromSearchResult(Number(button.dataset.searchIndex));
    return;
  }

  if (button.dataset.chatAction === "save-detected-link") {
    await saveDetectedLinkAsCollection(Number(button.dataset.linkIndex));
    return;
  }

  if (button.dataset.chatAction === "todo-detected-link") {
    await createTodoFromDetectedLink(Number(button.dataset.linkIndex));
    return;
  }

  if (button.dataset.chatAction === "open-search-settings") {
    await openDashboard("settings");
    return;
  }

  if (button.dataset.chatAction === "open-dashboard") {
    await openDashboard();
    return;
  }

  if (button.dataset.chatAction === "quick-command") {
    await runQuickChatCommand(button.dataset.command || "", button.dataset.label || button.textContent.trim());
    return;
  }

  if (button.dataset.chatAction === "cancel") {
    if (!isActiveDraftButton(button)) return;
    latestChatDraft = null;
    disableStaleChatDraftButtons();
    renderChatPanel({
      status: "info",
      answer: msg("cancelledAction")
    });
    return;
  }

  if (button.dataset.chatAction !== "apply" || !latestChatDraft?.id) return;
  if (!isActiveDraftButton(button)) return;

  setBusy(true);
  renderChatPanel({
    status: "loading",
    answer: msg("applyingConfirmedAction")
  });

  const response = await chrome.runtime.sendMessage({
    type: "APPLY_CHAT_REFINE",
    draftId: latestChatDraft.id
  });
  setBusy(false);

  if (response?.ok) {
    latestChatDraft = null;
    clearComposer();
    renderRun(response.run);
    renderChatPanel({
      status: "applied",
      answer: response.run?.message || msg("applied")
    });
  } else {
    renderChatPanel({
      status: "error",
      answer: response?.error || msg("couldNotApplyAction")
    });
  }
}

async function focusChatTab(tabId) {
  if (!Number.isInteger(tabId)) return;

  setBusy(true);
  const response = await chrome.runtime.sendMessage({
    type: "FOCUS_DASHBOARD_TAB",
    tabId
  });
  setBusy(false);

  renderChatPanel({
    status: response?.ok ? "applied" : "error",
    answer: response?.ok ? msg("agentOpenedTab") : response?.error || msg("couldNotOpenTab")
  });
}

async function openSearchResult(rawUrl) {
  const url = normalizeOpenableSearchResultUrl(rawUrl);

  if (!url) {
    renderChatPanel({
      status: "error",
      answer: msg("webSearchOpenFailed")
    });
    return;
  }

  try {
    await chrome.tabs.create({ url });
    renderChatPanel({
      status: "info",
      answer: msg("webSearchOpenedResult")
    });
  } catch {
    renderChatPanel({
      status: "error",
      answer: msg("webSearchOpenFailed")
    });
  }
}

async function saveSearchResultAsCollection(index) {
  const source = getSearchResultByIndex(index);

  if (!source) {
    renderChatPanel({
      status: "error",
      answer: msg("browserWorkSourceUnavailable")
    });
    return;
  }

  const now = new Date().toISOString();
  const collection = {
    id: `collection-${Date.now()}`,
    name: source.title || source.hostname || msg("webSearchResult"),
    source: "sidebar_search_result",
    createdAt: now,
    updatedAt: now,
    tabIds: [],
    tabs: [],
    sources: [sanitizeSourceForLocalWork(source)]
  };
  const stored = await chrome.storage.local.get(SAVED_COLLECTIONS_KEY);
  const existingCollections = Array.isArray(stored[SAVED_COLLECTIONS_KEY]) ? stored[SAVED_COLLECTIONS_KEY] : [];
  await chrome.storage.local.set({
    [SAVED_COLLECTIONS_KEY]: [collection, ...existingCollections].slice(0, MAX_AGENT_ITEMS)
  });

  renderChatPanel({
    status: "info",
    answer: msg("searchResultSavedToCollection", [collection.name])
  });
}

async function createTodoFromSearchResult(index) {
  const source = getSearchResultByIndex(index);

  if (!source) {
    renderChatPanel({
      status: "error",
      answer: msg("browserWorkSourceUnavailable")
    });
    return;
  }

  const now = new Date().toISOString();
  const task = {
    id: `task-${Date.now()}`,
    title: msg("todoReviewSearchResult", [source.title || source.hostname || msg("webSearchResult")]),
    status: "open",
    source: "sidebar_search_result",
    createdAt: now,
    updatedAt: now,
    tabIds: [],
    tabs: [],
    sources: [sanitizeSourceForLocalWork(source)]
  };
  const stored = await chrome.storage.local.get(AGENT_TASKS_KEY);
  const existingTasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];
  await chrome.storage.local.set({
    [AGENT_TASKS_KEY]: [task, ...existingTasks].slice(0, MAX_AGENT_ITEMS)
  });

  renderChatPanel({
    status: "todo-created",
    answer: buildSourceTodoMarkdown(task),
    task
  });
}

async function saveDetectedLinkAsCollection(index) {
  const source = getDetectedLinkByIndex(index);

  if (!source) {
    renderChatPanel({
      status: "error",
      answer: msg("browserWorkSourceUnavailable")
    });
    return;
  }

  await saveSourceAsCollection(source, "sidebar_pasted_link");
}

async function createTodoFromDetectedLink(index) {
  const source = getDetectedLinkByIndex(index);

  if (!source) {
    renderChatPanel({
      status: "error",
      answer: msg("browserWorkSourceUnavailable")
    });
    return;
  }

  await createTodoFromSource(source, "sidebar_pasted_link", msg("todoReviewLinkedSource", [source.hostname || source.title || msg("linkedSource")]));
}

function getSearchResultByIndex(index) {
  const resultIndex = Number(index);
  if (!Number.isInteger(resultIndex)) return null;
  return latestWebSearchResults.find((result) => Number(result.index) === resultIndex) || null;
}

function getDetectedLinkByIndex(index) {
  const linkIndex = Number(index);
  if (!Number.isInteger(linkIndex)) return null;
  return latestDetectedLinks.find((link) => Number(link.index) === linkIndex) || null;
}

async function saveSourceAsCollection(source, sourceName) {
  const localSource = sanitizeSourceForLocalWork(source);
  const now = new Date().toISOString();
  const collection = {
    id: `collection-${Date.now()}`,
    name: localSource.title || localSource.hostname || msg("linkedSource"),
    source: sourceName,
    createdAt: now,
    updatedAt: now,
    tabIds: [],
    tabs: [],
    sources: [localSource]
  };
  const stored = await chrome.storage.local.get(SAVED_COLLECTIONS_KEY);
  const existingCollections = Array.isArray(stored[SAVED_COLLECTIONS_KEY]) ? stored[SAVED_COLLECTIONS_KEY] : [];
  await chrome.storage.local.set({
    [SAVED_COLLECTIONS_KEY]: [collection, ...existingCollections].slice(0, MAX_AGENT_ITEMS)
  });

  renderChatPanel({
    status: "info",
    answer: msg("searchResultSavedToCollection", [collection.name])
  });
}

async function createTodoFromSource(source, sourceName, title) {
  const now = new Date().toISOString();
  const task = {
    id: `task-${Date.now()}`,
    title,
    status: "open",
    source: sourceName,
    createdAt: now,
    updatedAt: now,
    tabIds: [],
    tabs: [],
    sources: [sanitizeSourceForLocalWork(source)]
  };
  const stored = await chrome.storage.local.get(AGENT_TASKS_KEY);
  const existingTasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];
  await chrome.storage.local.set({
    [AGENT_TASKS_KEY]: [task, ...existingTasks].slice(0, MAX_AGENT_ITEMS)
  });

  renderChatPanel({
    status: "todo-created",
    answer: buildSourceTodoMarkdown(task),
    task
  });
}

function sanitizeSourceForLocalWork(source = {}) {
  const url = normalizeOpenableSearchResultUrl(source.url || "");
  const parsed = parseBrowserWorkUrl(url);

  return {
    title: String(source.title || parsed.hostname || msg("webSearchResult")).slice(0, 180),
    hostname: String(source.hostname || parsed.hostname || "").slice(0, 120),
    path: sanitizeBrowserWorkPath(parsed.path || source.path || ""),
    url: sanitizePersistentSourceUrl(url),
    snippet: String(source.snippet || "").replace(/\s+/g, " ").trim().slice(0, 240),
    sourceType: String(source.sourceType || "search_result").slice(0, 40),
    savedAt: new Date().toISOString()
  };
}

function sanitizePersistentSourceUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "";
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function buildSourceTodoMarkdown(task = {}) {
  const source = Array.isArray(task.sources) ? task.sources[0] : null;
  const title = task.title || msg("todo");
  const snippet = source?.snippet || source?.hostname || "";
  const lines = [
    msg("agentTodoCreated", [title])
  ];

  if (snippet) {
    lines.push("", `- ${snippet}`);
  }

  lines.push("", msg("agentTodoSourceStoredLocally"));
  return lines.join("\n");
}

function normalizeOpenableSearchResultUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function isActiveDraftButton(button) {
  return Boolean(latestChatDraft?.id && button.dataset.draftId === latestChatDraft.id);
}

async function handleDuplicateAction(event) {
  const button = event.target.closest("[data-duplicate-action]");
  if (!button || button.disabled) return;

  const action = button.dataset.duplicateAction;

  if (action === "close-review-tab") {
    const tabId = Number(button.dataset.tabId);
    const title = button.dataset.tabTitle || msg("currentTab");
    const shouldClose = window.confirm(msg("closeReviewedDuplicateConfirm", [title]));

    if (!shouldClose) return;

    await sendDuplicateReviewMessage({
      type: "CLOSE_REVIEW_DUPLICATE_TAB",
      tabId
    });
    return;
  }

  if (action === "keep-review-group") {
    await sendDuplicateReviewMessage({
      type: "MARK_REVIEW_DUPLICATE_GROUP_KEPT",
      groupId: button.dataset.groupId
    });
  }
}

async function sendDuplicateReviewMessage(message) {
  setBusy(true);
  const response = await chrome.runtime.sendMessage(message);
  setBusy(false);

  if (response?.ok) {
    renderRun(response.run);
  } else {
    renderRun({
      ...latestRun,
      status: "error",
      error: response?.error || msg("duplicateReviewActionFailed")
    });
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "RUN_UPDATED") {
    renderRun(message.run);
  }
});

loadLatestRun();

async function loadLatestRun() {
  const response = await chrome.runtime.sendMessage({ type: "GET_CURRENT_RUN" });
  if (response?.ok) {
    renderRun(response.run);
  } else {
    renderRun({ status: "idle", message: msg("clickIconToOrganize") });
  }
}

function renderRun(run) {
  latestRun = run;
  renderStatus(run);
  renderLatestRunMessage(run);

  if (run?.status === "privacy-onboarding") {
    renderPrivacy(true);
    renderMetrics();
    renderHosts();
    renderGroups();
    renderProtected();
    renderDuplicates();
    renderUndo(false);
    renderRestore(false);
    return;
  }

  renderPrivacy(false);

  if (run?.status === "completed") {
    renderMetrics(run.summary);
    renderHosts(run.summary.topHosts);
    renderGroups(run.groups);
    renderProtected(run.summary.protectedCounts);
    renderDuplicates(run.duplicateGroups, run.summary);
    renderUndo(run.summary.undoAvailable);
    renderRestore(run.summary.closedTabsRestoreAvailable);
    return;
  }

  if (run?.status === "undone") {
    renderUndo(false);
    renderRestore(false);
    renderMetrics({
      windowCount: "—",
      tabCount: run.summary?.restoredTabs ?? "—",
      exactDuplicateGroups: "—",
      groupsCreated: run.summary?.restoredGroups ?? "—"
    });
    renderHosts();
    renderGroups();
    renderProtected();
    renderDuplicates();
    return;
  }

  if (run?.status === "closed-restored") {
    renderUndo(false);
    renderRestore(false);
    renderMetrics({
      windowCount: "—",
      tabCount: run.summary?.restoredClosedTabs ?? "—",
      groupsCreated: run.summary?.restoredClosedGroups ?? "—",
      safeDuplicatesClosed: "—"
    });
    renderHosts();
    renderGroups();
    renderProtected();
    renderDuplicates();
    return;
  }

  renderMetrics();
  renderHosts();
  renderGroups();
  renderProtected();
  renderDuplicates();
  renderUndo(false);
  renderRestore(false);
}

function renderStatus(run) {
  const status = run?.status || "idle";
  const titleByStatus = {
    idle: msg("readyWhenYouAre"),
    "privacy-onboarding": msg("oneQuickPrivacyCheck"),
    scanning: msg("scanningTabs"),
    grouping: msg("creatingNativeGroups"),
    completed: msg("organizeComplete"),
    undoing: msg("restoringGroups"),
    undone: msg("undoComplete"),
    "restoring-closed": msg("restoringClosedTabs"),
    "closed-restored": msg("restoreComplete"),
    error: msg("somethingNeedsAttention")
  };

  const bodyByStatus = {
    idle: run?.message || msg("clickIconToOrganize"),
    "privacy-onboarding": msg("reviewBasics"),
    scanning: run?.message || msg("scanningAllNormalWindows"),
    grouping: run?.message || msg("applyingNativeGroups"),
    completed: getCompletedMessage(run),
    undoing: run?.message || msg("restoringGroups"),
    undone: msg("restoredTabsGroups", [run?.summary?.restoredTabs ?? 0, run?.summary?.restoredGroups ?? 0]),
    "restoring-closed": run?.message || msg("restoringClosedTabs"),
    "closed-restored": msg("restoredClosedTabsCount", [
      run?.summary?.restoredClosedTabs ?? 0,
      run?.summary?.restoreFailedTabs ?? 0
    ]),
    error: run?.error || msg("scanDidNotFinish")
  };

  const errorNote =
    status === "error"
      ? `
        <div class="error-note" data-error-state="safe">
          <strong>${escapeHtml(msg("nothingChangedOnError"))}</strong>
          <small>${escapeHtml(msg("errorNextStepHint"))}</small>
        </div>
      `
      : "";

  statusPanel.className = `status-panel agent-message-system ${status}`;
  statusPanel.innerHTML = `
    <div class="status-dot" aria-hidden="true"></div>
    <div>
      <h2>${escapeHtml(titleByStatus[status] || titleByStatus.idle)}</h2>
      <p>${escapeHtml(bodyByStatus[status] || bodyByStatus.idle)}</p>
      ${errorNote}
    </div>
  `;
}

function renderMetrics(summary) {
  if (!summary) {
    metricsGrid.innerHTML = `
      <article class="agent-welcome-card">
        <p>${escapeHtml(msg("tabAgentWelcome"))}</p>
        <small>${escapeHtml(msg("tabAgentPrivacyHint"))}</small>
      </article>
    `;
    return;
  }

  const closedCount = summary?.safeDuplicatesClosed ?? 0;
  const impact = [
    { label: msg("groups"), value: summary?.groupsCreated ?? "—" },
    { label: msg("tabsOrganized"), value: summary?.tabsMoved ?? "—" },
    { label: msg("closedDupes"), value: closedCount },
    { label: msg("reviewDupes"), value: summary?.reviewDuplicateGroups ?? 0 }
  ];

  metricsGrid.innerHTML = `
    <div class="agent-result-list agent-inline-metrics" aria-label="${escapeHtml(msg("impact"))}">
      ${impact.map((metric) => renderImpactMetric(metric.label, metric.value)).join("")}
    </div>
  `;
}

function renderImpactMetric(label, value) {
  return `
    <span>
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(String(value))}</strong>
    </span>
  `;
}

function renderLatestRunMessage(run) {
  if (!run || run.status === "privacy-onboarding") return;

  const status = run.status || "idle";
  if (status === "idle") return;

  const title = status === "idle" ? msg("readyWhenYouAre") : getRunMessageTitle(run);
  const body = getRunMessageBody(run);
  const summary = run.summary || null;
  const actions = buildRunMessageActions(summary, status);
  const insights = status === "completed" ? run.classificationInsights : null;

  upsertSystemChatMessage({
    role: "assistant",
    status: `run-${status}`,
    html: renderRunMessageCard({ title, body, actions, status, insights })
  });
}

function getRunMessageTitle(run) {
  const titleByStatus = {
    scanning: msg("scanningTabs"),
    grouping: msg("creatingNativeGroups"),
    completed: msg("organizeComplete"),
    undoing: msg("restoringGroups"),
    undone: msg("undoComplete"),
    "restoring-closed": msg("restoringClosedTabs"),
    "closed-restored": msg("restoreComplete"),
    error: msg("somethingNeedsAttention")
  };

  return titleByStatus[run?.status] || msg("readyWhenYouAre");
}

function getRunMessageBody(run) {
  const status = run?.status || "idle";

  if (status === "completed") return getCompletedAgentReply(run);
  if (status === "undone") return msg("restoredTabsGroups", [run?.summary?.restoredTabs ?? 0, run?.summary?.restoredGroups ?? 0]);
  if (status === "closed-restored") {
    return msg("restoredClosedTabsCount", [
      run?.summary?.restoredClosedTabs ?? 0,
      run?.summary?.restoreFailedTabs ?? 0
    ]);
  }
  if (status === "error") return run?.error || msg("scanDidNotFinish");

  return run?.message || msg("clickIconToOrganize");
}

function buildRunMessageActions(summary, status) {
  if (["scanning", "grouping", "undoing", "restoring-closed"].includes(status)) {
    return [];
  }

  return [];
}

function renderRunMessageCard({ title, body, actions, status, insights }) {
  const shouldRenderExtras = status !== "completed";

  return `
    <article class="run-message-card" data-run-message-status="${escapeHtml(status || "")}">
      <div class="chat-answer markdown-message">${renderSafeMarkdown(formatRunMessageText(title, body, status))}</div>
      ${shouldRenderExtras ? renderClassificationInsights(insights) : ""}
      ${shouldRenderExtras && actions.length ? renderQuickCommandActions(actions) : ""}
    </article>
  `;
}

function renderSafeMarkdown(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const parts = [];
  let paragraph = [];
  let listItems = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    parts.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    parts.push(`<ul>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ul>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      listItems.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return parts.join("");
}

function renderInlineMarkdown(value) {
  const tokens = [];
  const tokenized = escapeHtml(value)
    .replace(/`([^`]+)`/g, (_match, code) => {
      const token = `@@CODE${tokens.length}@@`;
      tokens.push(`<code>${code}</code>`);
      return token;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  return tokens.reduce((html, token, index) => html.replace(`@@CODE${index}@@`, token), tokenized);
}

function renderClassificationInsights(insights) {
  const suggestions = [
    ...(Array.isArray(insights?.splitSuggestions) ? insights.splitSuggestions : []),
    ...(Array.isArray(insights?.mergeSuggestions) ? insights.mergeSuggestions : [])
  ].slice(0, 4);

  if (!suggestions.length) return "";

  return `
    <details class="classification-refinements">
      <summary>${escapeHtml(msg("suggestedRefinements"))}</summary>
      <div class="classification-refinement-list">
        ${suggestions.map(renderClassificationSuggestion).join("")}
      </div>
      <small>${escapeHtml(msg("classificationRefinementNote"))}</small>
    </details>
  `;
}

function renderClassificationSuggestion(suggestion) {
  if (suggestion?.type === "merge") {
    const groups = Array.isArray(suggestion?.groups)
      ? suggestion.groups.slice(0, 4)
      : [];

    return `
      <div class="classification-refinement merge">
        <b>${escapeHtml(groups.join(" · ") || msg("contextUnnamedGroup"))}</b>
        <span>${escapeHtml(`→ ${suggestion?.suggestedGroup || msg("contextUnnamedGroup")}`)}</span>
        <small>${escapeHtml(suggestion?.reason || msg("classificationMergeReason"))}</small>
      </div>
    `;
  }

  const groups = Array.isArray(suggestion?.suggestedGroups)
    ? suggestion.suggestedGroups.slice(0, 4)
    : [];

  return `
    <div class="classification-refinement">
      <b>${escapeHtml(suggestion?.fromGroup || msg("contextUnnamedGroup"))}</b>
      <span>${escapeHtml(groups.join(" · "))}</span>
      <small>${escapeHtml(suggestion?.reason || msg("classificationRefinementReason"))}</small>
    </div>
  `;
}

function formatRunMessageText(title, body, status) {
  const cleanTitle = String(title || "").trim();
  const cleanBody = String(body || "").trim();

  if (status === "completed" && cleanBody) return cleanBody;
  if (!cleanTitle) return cleanBody;
  if (!cleanBody) return cleanTitle;
  if (cleanBody.startsWith(cleanTitle)) return cleanBody;

  return `${cleanTitle}. ${cleanBody}`;
}

function renderQuickCommandActions(actions) {
  return `
    <div class="chat-action-row">
      ${actions
        .map(
          (action) => `
            <button
              class="mini-button"
              type="button"
              data-chat-action="quick-command"
              data-command="${escapeHtml(action.command)}"
              data-label="${escapeHtml(action.label)}"
            >
              ${escapeHtml(action.label)}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

async function renderVerticalTabs() {
  if (!verticalTabsPanel || !verticalTabsList || activeSidebarMode !== "vertical_tabs") return;

  verticalTabsList.innerHTML = `<p class="empty">${escapeHtml(msg("checkingCurrentTabs"))}</p>`;

  try {
    const { tabs, groupsById } = await getVerticalTabsModel();
    const filteredTabs = filterVerticalTabs(tabs, groupsById, verticalTabsSearchTerm);

    if (!filteredTabs.length) {
      verticalTabsList.innerHTML = `<p class="empty">${escapeHtml(msg("noTabsForFilter"))}</p>`;
      return;
    }

    verticalTabsList.innerHTML = buildVerticalTabsHtml(filteredTabs, groupsById);
  } catch {
    verticalTabsList.innerHTML = `<p class="empty">${escapeHtml(msg("couldNotLoadVerticalTabs"))}</p>`;
  }
}

async function getVerticalTabsModel() {
  const [tabs, groups, windows] = await Promise.all([
    chrome.tabs.query({}),
    chrome.tabGroups?.query ? chrome.tabGroups.query({}) : [],
    chrome.windows?.getAll ? chrome.windows.getAll({ windowTypes: ["normal"] }) : []
  ]);
  const normalWindowIds = new Set((windows || []).map((window) => window.id).filter(Number.isInteger));
  const groupsById = new Map((groups || []).map((group) => [group.id, group]));
  const normalizedTabs = (tabs || [])
    .filter((tab) => !normalWindowIds.size || normalWindowIds.has(tab.windowId))
    .sort((a, b) => (a.windowId - b.windowId) || (a.index - b.index));

  return { tabs: normalizedTabs, groupsById };
}

function filterVerticalTabs(tabs, groupsById, searchTerm) {
  const term = String(searchTerm || "").trim().toLowerCase();

  if (!term) return tabs;

  return tabs.filter((tab) => {
    const group = groupsById.get(tab.groupId);
    const text = [
      tab.title,
      getHostnameFromUrl(tab.url || tab.pendingUrl || ""),
      group?.title,
      tab.url || tab.pendingUrl || ""
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(term);
  });
}

function buildVerticalTabsHtml(tabs, groupsById) {
  const sections = buildVerticalTabSections(tabs, groupsById);

  return sections
    .map(
      (section) => `
        <section class="vertical-tabs-section">
          <div class="vertical-tabs-group-title">
            <span class="vertical-group-dot ${escapeHtml(section.color)}" aria-hidden="true"></span>
            <strong>${escapeHtml(section.title)}</strong>
            <small>${escapeHtml(msg("windowLabel", [section.windowId]))} · ${escapeHtml(msg("tabsCount", [section.tabs.length]))}</small>
          </div>
          <div class="vertical-tab-stack">
            ${section.tabs.map((tab) => renderVerticalTabRow(tab, section)).join("")}
          </div>
        </section>
      `
    )
    .join("");
}

function buildVerticalTabSections(tabs, groupsById) {
  const sectionMap = new Map();

  for (const tab of tabs) {
    const groupId = Number.isInteger(tab.groupId) ? tab.groupId : -1;
    const group = groupsById.get(groupId);
    const windowId = Number.isInteger(tab.windowId) ? tab.windowId : 0;
    const key = `${windowId}:${groupId}`;

    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        key,
        windowId,
        groupId,
        title: groupId === -1 ? msg("ungroupedTabs") : group?.title || msg("contextUnnamedGroup"),
        color: group?.color || "grey",
        tabs: []
      });
    }

    sectionMap.get(key).tabs.push(tab);
  }

  return Array.from(sectionMap.values());
}

function renderVerticalTabRow(tab, section) {
  const title = tab.title || msg("untitled");
  const rawUrl = tab.url || tab.pendingUrl || "";
  const hostname = getHostnameFromUrl(rawUrl);
  const isActive = Boolean(tab.active);

  return `
    <button
      class="vertical-tab-row ${isActive ? "active" : ""}"
      type="button"
      data-vertical-tab-id="${escapeHtml(String(tab.id || ""))}"
      data-window-id="${escapeHtml(String(tab.windowId || ""))}"
      title="${escapeHtml(title)}"
    >
      ${renderVerticalFavicon(tab)}
      <span class="vertical-tab-copy">
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(hostname || section.title)}</small>
      </span>
      ${isActive ? `<span class="vertical-tab-active-dot" aria-label="${escapeHtml(msg("currentTab"))}"></span>` : ""}
    </button>
  `;
}

function renderVerticalFavicon(tab) {
  const faviconUrl = normalizeFaviconUrl(tab.favIconUrl);

  if (!faviconUrl) {
    return `<span class="vertical-favicon fallback" aria-hidden="true">${escapeHtml(getFaviconLetter(tab))}</span>`;
  }

  return `
    <span class="vertical-favicon has-image" aria-hidden="true">
      <img src="${escapeHtml(faviconUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" />
    </span>
  `;
}

async function handleVerticalTabsClick(event) {
  const button = event.target.closest("[data-vertical-tab-id]");
  if (!button) return;

  const tabId = Number(button.dataset.verticalTabId);
  const windowId = Number(button.dataset.windowId);

  if (!Number.isInteger(tabId)) return;

  try {
    await chrome.tabs.update(tabId, { active: true });
    if (Number.isInteger(windowId) && chrome.windows?.update) {
      await chrome.windows.update(windowId, { focused: true });
    }
    await renderActiveTabContext();
    refreshVerticalTabsIfNeeded();
  } catch {
    renderChatPanel({
      status: "error",
      answer: msg("couldNotOpenTab")
    });
  }
}

function renderGroups(groups = []) {
  if (!groups.length) {
    groupsList.innerHTML = `<p class="empty">${escapeHtml(msg("noNativeGroupsYet"))}</p>`;
    return;
  }

  groupsList.innerHTML = groups
    .map(
      (group) => `
        <div class="row group-row">
          <span>
            <b>${escapeHtml(group.name)}</b>
            <small>${escapeHtml(group.reason || msg("builtInRule"))}</small>
          </span>
          <strong>${escapeHtml(String(group.tabCount))}</strong>
        </div>
      `
    )
    .join("");
}

function renderHosts(hosts = []) {
  if (!hosts.length) {
    hostsList.innerHTML = `<p class="empty">${escapeHtml(msg("noHostDataYet"))}</p>`;
    return;
  }

  hostsList.innerHTML = hosts
    .map(
      (host) => `
        <div class="row">
          <span>${escapeHtml(host.hostname)}</span>
          <strong>${escapeHtml(String(host.count))}</strong>
        </div>
      `
    )
    .join("");
}

function renderProtected(counts = {}) {
  const entries = Object.entries(counts);
  if (!entries.length) {
    protectedList.innerHTML = `<p class="empty">${escapeHtml(msg("noProtectedTabsFound"))}</p>`;
    return;
  }

  protectedList.innerHTML = entries
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(
      ([reason, count]) => `
        <div class="row">
          <span>${escapeHtml(reason)}</span>
          <strong>${escapeHtml(String(count))}</strong>
        </div>
      `
    )
    .join("");
}

function renderDuplicates(duplicates = [], summary = {}) {
  if (!duplicates.length) {
    duplicatesList.innerHTML = `<p class="empty">${escapeHtml(msg("noDuplicateCandidatesYet"))}</p>`;
    return;
  }

  const tabById = new Map((latestRun?.snapshot?.tabs || []).map((tab) => [tab.id, tab]));

  duplicatesList.innerHTML = duplicates
    .slice(0, 8)
    .map((duplicate) => {
      if (duplicate.action === "review") {
        return renderReviewDuplicate(duplicate, tabById);
      }

      const action =
        duplicate.action === "safe-close-candidate" && summary.safeDuplicatesClosed > 0
          ? msg("closedSafely")
          : duplicate.action === "safe-close-candidate"
            ? msg("safe")
            : msg("review");
      return `
        <div class="row group-row">
          <span>
            <b>${escapeHtml(duplicate.label)}</b>
            <small>${escapeHtml(duplicate.type)} · ${escapeHtml(action)}</small>
          </span>
          <strong>${escapeHtml(String(duplicate.tabCount))}</strong>
        </div>
      `;
    })
    .join("");
}

function renderReviewDuplicate(duplicate, tabById) {
  const isKept = duplicate.reviewStatus === "kept";
  const status = isKept ? msg("kept") : msg("needsReview");
  const tabs = (duplicate.tabIds || []).map((tabId) => tabById.get(tabId)).filter(Boolean);
  const groupId = getDuplicateGroupId(duplicate);

  return `
    <div class="duplicate-review-card">
      <div class="duplicate-review-header">
        <span>
          <b>${escapeHtml(duplicate.label)}</b>
          <small>${escapeHtml(duplicate.type)} · ${escapeHtml(status)}</small>
        </span>
        <button
          class="mini-button"
          type="button"
          data-duplicate-action="keep-review-group"
          data-group-id="${escapeHtml(groupId)}"
          ${isKept ? "disabled" : ""}
        >
          ${escapeHtml(msg("keepAll"))}
        </button>
      </div>
      <div class="duplicate-review-tabs">
        ${tabs.map((tab) => renderReviewDuplicateTab(tab, duplicate)).join("")}
      </div>
    </div>
  `;
}

function renderReviewDuplicateTab(tab, duplicate) {
  const reasons = getReviewTabProtectionReasons(tab);
  const isProtected = reasons.length > 0 || duplicate.reviewStatus === "kept";
  const reasonCopy = reasons.length ? msg("protectedPrefix", [reasons.join(", ")]) : msg("close");
  const meta = [
    tab.hostname,
    tab.path,
    tab.active ? "active" : "",
    tab.pinned ? "pinned" : "",
    tab.audible ? "audible" : ""
  ]
    .filter(Boolean)
    .join(" · ");

  return `
    <div class="duplicate-review-tab">
      <span>
        <b>${escapeHtml(tab.title || msg("untitled"))}</b>
        <small>${escapeHtml(meta)}</small>
      </span>
      <button
        class="mini-button"
        type="button"
        data-duplicate-action="close-review-tab"
        data-tab-id="${escapeHtml(String(tab.id))}"
        data-tab-title="${escapeHtml(tab.title || msg("untitled"))}"
        ${isProtected ? "disabled" : ""}
        title="${escapeHtml(reasonCopy)}"
      >
        ${escapeHtml(msg("close"))}
      </button>
    </div>
  `;
}

function getReviewTabProtectionReasons(tab) {
  const reasons = Array.isArray(tab.protectedReasons) ? [...tab.protectedReasons] : [];

  if (!["http", "https"].includes(tab.urlScheme)) {
    reasons.push("not restorable");
  }

  return Array.from(new Set(reasons));
}

function getDuplicateGroupId(duplicate) {
  return duplicate.id || `${duplicate.type}:${duplicate.label}:${(duplicate.tabIds || []).join("-")}`;
}

function renderSummary(summary) {
  summaryPanel.hidden = true;
  summaryPanel.innerHTML = "";

  if (summary?.status === "loading") {
    renderChatPanel({
      status: "loading",
      answer: summary.summary || summary.title || msg("readingCurrentTab")
    });
    return;
  }

  rememberPageChatContext(summary);
  renderChatPanel({
    status: "summary",
    summary
  });
}

function rememberPageChatContext(summary) {
  if (summary?.status !== "completed") return;

  const context = normalizeSidebarContext(activeSidebarContext) || {};

  if (context.scope !== "current_tab") return;

  const nextContext = {
    tabId: context.tabId,
    windowId: context.windowId,
    title: summary.title || context.title || "",
    hostname: summary.hostname || context.hostname || "",
    lastQuestion: summary.question || "",
    lastAnswer: summary.summary || "",
    updatedAt: Date.now()
  };

  if (latestPageChatContext && !isSamePageChatContext(context, latestPageChatContext)) {
    pageChatMessages = [];
  }

  latestPageChatContext = nextContext;
  rememberPageChatTurn(summary);
}

function rememberPageChatTurn(summary) {
  const question = normalizeConversationText(summary?.question || "");
  const answer = normalizeConversationText([
    summary?.summary || "",
    ...(Array.isArray(summary?.keyPoints) ? summary.keyPoints : [])
  ].filter(Boolean).join(" "));

  if (question) {
    pageChatMessages.push({
      role: "user",
      text: question
    });
  }

  if (answer) {
    pageChatMessages.push({
      role: "assistant",
      text: answer
    });
  }

  pageChatMessages = pageChatMessages.slice(-PAGE_CHAT_CONVERSATION_LIMIT);
}

function buildPageChatHistory() {
  clearStalePageChatContext();

  return pageChatMessages
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .map((message) => ({
      role: message.role,
      text: normalizeConversationText(message.text)
    }))
    .filter((message) => message.text)
    .slice(-PAGE_CHAT_CONVERSATION_LIMIT);
}

function rememberContextTabsChatContext(summary) {
  if (summary?.status !== "completed") return;

  const context = normalizeSidebarContext(activeSidebarContext) || {};
  if (!["current_group", "selected_tabs"].includes(context.scope)) return;

  const nextContext = {
    scope: context.scope,
    groupId: context.groupId,
    groupName: context.groupName || summary.context?.groupName || "",
    tabIds: stableTabIds(context.tabIds),
    tabCount: Number(context.tabCount || context.tabIds?.length || summary.context?.tabCount || 0),
    lastQuestion: summary.question || "",
    lastAnswer: summary.summary || summary.answer || "",
    updatedAt: Date.now()
  };

  if (latestContextTabsChatContext && !isSameContextTabsChatContext(context, latestContextTabsChatContext)) {
    contextTabsMessages = [];
  }

  latestContextTabsChatContext = nextContext;
  rememberContextTabsChatTurn(summary);
}

function rememberContextTabsChatTurn(summary) {
  const question = normalizeConversationText(summary?.question || "");
  const answer = normalizeConversationText([
    summary?.summary || summary?.answer || "",
    ...(Array.isArray(summary?.keyPoints) ? summary.keyPoints : []),
    ...(Array.isArray(summary?.recommendations) ? summary.recommendations : [])
  ].filter(Boolean).join(" "));

  if (question) {
    contextTabsMessages.push({
      role: "user",
      text: question
    });
  }

  if (answer) {
    contextTabsMessages.push({
      role: "assistant",
      text: answer
    });
  }

  contextTabsMessages = contextTabsMessages.slice(-CONTEXT_TABS_CHAT_CONVERSATION_LIMIT);
}

function buildContextTabsChatHistory() {
  clearStaleContextTabsChatContext();

  return contextTabsMessages
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .map((message) => ({
      role: message.role,
      text: normalizeConversationText(message.text)
    }))
    .filter((message) => message.text)
    .slice(-CONTEXT_TABS_CHAT_CONVERSATION_LIMIT);
}

function renderChatSummary(summary) {
  const keyPoints = Array.isArray(summary?.keyPoints) ? summary.keyPoints : [];
  const status = summary?.status || "completed";
  const showKeyPoints = status === "completed" && keyPoints.length > 0 && !summary?.question;

  return renderAssistantMarkdownMessage(
    buildPageSummaryMarkdown(summary, showKeyPoints ? keyPoints : []),
    `chat-summary-card ${status}`
  );
}

function buildPageSummaryMarkdown(summary, keyPoints = []) {
  const lines = [];
  const answer = String(summary?.summary || summary?.answer || "").trim();

  if (answer) lines.push(answer);
  const cleanPoints = keyPoints
    .map((point) => String(point || "").trim())
    .filter(Boolean)
    .slice(0, 4);

  if (cleanPoints.length) {
    if (lines.length) lines.push("");
    cleanPoints.forEach((point) => lines.push(`- ${point}`));
  }

  return lines.join("\n") || "I could not find enough readable page content to answer yet.";
}

function renderChatPanel(draft) {
  const transcript = buildChatPanelTranscript(draft);
  appendChatMessage({
    role: "assistant",
    status: draft.status || "info",
    html: renderChatPanelContent(draft),
    text: transcript.text,
    includeInAIAgentContext: transcript.includeInAIAgentContext
  });
}

function buildChatPanelTranscript(draft = {}) {
  const status = draft.status || "info";

  if (status === "ai-agent") {
    return {
      text: draft.answer || "",
      includeInAIAgentContext: true
    };
  }

  if (status === "summary") {
    return {
      text: "",
      includeInAIAgentContext: false
    };
  }

  if (status === "context-summary") {
    return {
      text: draft.summary?.summary || draft.summary?.answer || "",
      includeInAIAgentContext: true
    };
  }

  if (["loading", "error", "tool-card"].includes(status)) {
    return {
      text: "",
      includeInAIAgentContext: false
    };
  }

  const text = [
    draft.answer,
    draft.actionSummary,
    draft.risk
  ]
    .filter(Boolean)
    .join(" ");

  return {
    text,
    includeInAIAgentContext: Boolean(text)
  };
}

function renderChatPanelContent(draft) {
  if (draft.status === "summary") {
    return renderChatSummary(draft.summary || {});
  }

  if (draft.status === "context-summary") {
    return renderContextTabsSummary(draft.summary || {});
  }

  if (draft.status === "regroup-preview" || draft.type === "regroup_tabs") {
    return renderRegroupPreview(draft);
  }

  if (draft.status === "optimization") {
    return renderOptimizationCard(draft);
  }

  if (draft.status === "tool-card") {
    return renderToolCard(draft.toolCard || draft);
  }

  if (draft.status === "ai-agent") {
    return renderAIAgentCard(draft);
  }

  if (draft.status === "web-search") {
    return renderWebSearchCard(draft);
  }

  if (draft.status === "search-provider-needed") {
    return renderSearchProviderNeeded(draft);
  }

  if (draft.status === "todo-created") {
    return renderTodoCreatedMessage(draft);
  }

  if (draft.status === "link-detected") {
    return renderDetectedLinksMessage(draft);
  }

  if (["loading", "error", "applied", "info"].includes(draft.status)) {
    return `
      <p class="chat-answer">${escapeHtml(draft.answer || "")}</p>
    `;
  }

  const tabs = Array.isArray(draft.matchedTabs) ? draft.matchedTabs : [];

  if (draft.status === "tab-search") {
    return `
      <p class="chat-answer">${escapeHtml(draft.answer || "")}</p>
      ${renderChatMatchedTabs(tabs, draft.matchedTabCount, { showOpenAction: true })}
    `;
  }

  return `
    <p class="chat-answer">${escapeHtml(draft.answer || "")}</p>
    <div class="chat-action-summary">
      <span>${escapeHtml(draft.actionSummary || msg("previewAction"))}</span>
      <small>${escapeHtml(draft.risk || msg("noTabsWillBeClosed"))}</small>
    </div>
    ${renderChatMatchedTabs(tabs, draft.matchedTabCount)}
    <div class="chat-action-row">
      <button class="primary-button" type="button" data-chat-action="apply" data-draft-id="${escapeHtml(draft.id || "")}">${escapeHtml(msg("apply"))}</button>
      <button class="secondary-button" type="button" data-chat-action="cancel" data-draft-id="${escapeHtml(draft.id || "")}">${escapeHtml(msg("cancel"))}</button>
    </div>
  `;
}

function renderAIAgentCard(draft) {
  return renderAssistantMarkdownMessage(draft.answer || "", "ai-agent-card");
}

function renderWebSearchCard(draft) {
  const results = Array.isArray(draft.results) ? draft.results.slice(0, 5) : [];

  return `
    <article class="assistant-answer-message web-search-message">
      <div class="chat-answer markdown-message">${renderSafeMarkdown(buildWebSearchMarkdown(draft))}</div>
      ${
        results.length
          ? `<div class="web-search-sources" aria-label="${escapeHtml(msg("webSearchSources"))}">
              <span>${escapeHtml(msg("webSearchSources"))}</span>
              ${results.map(renderWebSearchSource).join("")}
            </div>`
          : ""
      }
    </article>
  `;
}

function buildWebSearchMarkdown(draft = {}) {
  const answer = String(draft.answer || msg("agentWebSearchNoResults")).trim();
  return answer || msg("agentWebSearchNoResults");
}

function renderSearchProviderNeeded(draft = {}) {
  return `
    <article class="assistant-answer-message web-search-message">
      <div class="chat-answer markdown-message">${renderSafeMarkdown(draft.answer || "")}</div>
      <div class="chat-action-row">
        <button class="secondary-button" type="button" data-chat-action="open-search-settings">${escapeHtml(msg("openSettings"))}</button>
      </div>
    </article>
  `;
}

function renderTodoCreatedMessage(draft = {}) {
  return `
    <article class="assistant-answer-message todo-created-message">
      <div class="chat-answer markdown-message">${renderSafeMarkdown(draft.answer || buildSidebarTodoMarkdown(draft.task || {}))}</div>
      <div class="chat-action-row">
        <button class="secondary-button" type="button" data-chat-action="open-dashboard">${escapeHtml(msg("openDashboard"))}</button>
      </div>
    </article>
  `;
}

function renderDetectedLinksMessage(draft = {}) {
  const links = Array.isArray(draft.links) ? draft.links.slice(0, 4) : [];

  return `
    <article class="assistant-answer-message link-detected-message">
      <div class="chat-answer markdown-message">${renderSafeMarkdown(draft.answer || buildDetectedLinksMarkdown(links))}</div>
      ${
        links.length
          ? `<div class="chat-action-row">
              <button class="secondary-button" type="button" data-chat-action="save-detected-link" data-link-index="${escapeHtml(String(links[0].index || 0))}">${escapeHtml(msg("saveSource"))}</button>
              <button class="secondary-button" type="button" data-chat-action="todo-detected-link" data-link-index="${escapeHtml(String(links[0].index || 0))}">${escapeHtml(msg("createTodo"))}</button>
            </div>`
          : ""
      }
    </article>
  `;
}

function renderWebSearchSource(result = {}) {
  const title = result.title || result.hostname || msg("webSearchResult");
  const hostname = result.hostname || "";
  const url = normalizeOpenableSearchResultUrl(result.url || "");
  const resultIndex = Number.isInteger(Number(result.index)) ? Number(result.index) : -1;

  return `
    <section class="web-search-source">
      <div>
        <strong>${escapeHtml(title)}</strong>
        ${hostname ? `<small>${escapeHtml(hostname)}</small>` : ""}
      </div>
      <div class="web-search-source-actions">
        ${
          url
            ? `<button class="mini-button" type="button" data-chat-action="open-search-result" data-search-url="${escapeHtml(url)}">${escapeHtml(msg("webSearchOpenResult"))}</button>`
            : ""
        }
        ${
          resultIndex >= 0
            ? `<button class="mini-button" type="button" data-chat-action="save-search-result" data-search-index="${escapeHtml(String(resultIndex))}">${escapeHtml(msg("saveSource"))}</button>
               <button class="mini-button" type="button" data-chat-action="todo-search-result" data-search-index="${escapeHtml(String(resultIndex))}">${escapeHtml(msg("createTodoShort"))}</button>`
            : ""
        }
      </div>
    </section>
  `;
}

function renderWebSearchResult(result = {}) {
  return renderWebSearchSource(result);
}

function buildWebSearchAnswer(result = {}) {
  const answer = String(result.answer || "").trim();
  const count = Number(result.resultCount || result.results?.length || 0);

  if (answer) {
    return answer;
  }

  if (count > 0) {
    return msg("agentWebSearchResultsFound", [count]);
  }

  return msg("agentWebSearchNoResults");
}

function sanitizeSearchResultsForLocalWork(results = []) {
  return (Array.isArray(results) ? results : [])
    .map((result, index) => {
      const url = normalizeOpenableSearchResultUrl(result.url || "");
      const parsed = parseBrowserWorkUrl(url);

      return {
        index,
        title: String(result.title || parsed.hostname || msg("webSearchResult")).slice(0, 180),
        url,
        hostname: String(result.hostname || parsed.hostname || "").slice(0, 120),
        path: sanitizeBrowserWorkPath(parsed.path || ""),
        snippet: String(result.snippet || "").replace(/\s+/g, " ").trim().slice(0, 240),
        score: Number.isFinite(Number(result.score)) ? Number(result.score) : null
      };
    })
    .filter((result) => result.title || result.url || result.hostname)
    .slice(0, 8);
}

function renderRegroupPreview(draft) {
  return `
    <article class="assistant-answer-message content-regroup-card content-regroup-message">
      <div class="chat-answer markdown-message">${renderSafeMarkdown(buildRegroupPreviewMarkdown(draft))}</div>
      <div class="chat-action-row">
        <button class="primary-button" type="button" data-chat-action="apply" data-draft-id="${escapeHtml(draft.id || "")}">${escapeHtml(msg("apply"))}</button>
        <button class="secondary-button" type="button" data-chat-action="cancel" data-draft-id="${escapeHtml(draft.id || "")}">${escapeHtml(msg("cancel"))}</button>
      </div>
    </article>
  `;
}

function buildRegroupPreviewMarkdown(draft) {
  const groups = Array.isArray(draft.groups) ? draft.groups.slice(0, 8) : [];
  const lines = [];
  const answer = String(draft.answer || "").trim();

  if (answer) {
    lines.push(answer);
    lines.push("");
  } else {
    lines.push("I can regroup these tabs by what the pages are actually about.");
    lines.push("");
  }

  for (const group of groups) {
    const name = group.name || msg("contextUnnamedGroup");
    const tabCount = Number(group.tabIds?.length || group.matchedTabs?.length || 0);
    const reason = String(group.reason || "Grouped by visible page content.").trim();
    const tabs = (Array.isArray(group.matchedTabs) ? group.matchedTabs : [])
      .slice(0, 3)
      .map((tab) => tab.title || msg("untitled"))
      .filter(Boolean);
    const extraCount = Math.max(0, tabCount - tabs.length);
    const tabText = tabs.length
      ? ` Tab${tabs.length > 1 ? "s" : ""}: ${tabs.join(", ")}${extraCount ? `, +${extraCount} more` : ""}.`
      : "";

    lines.push(`- **${name}** (${tabCount || 1} ${tabCount === 1 ? "tab" : "tabs"}): ${reason}${tabText}`);
  }

  lines.push("");
  lines.push("No browser changes happen until you click **Apply**. No tabs will be closed.");

  return lines.join("\n");
}

function renderContextTabsSummary(summary) {
  const keyPoints = Array.isArray(summary?.keyPoints) ? summary.keyPoints.slice(0, 4) : [];
  const recommendations = Array.isArray(summary?.recommendations) ? summary.recommendations.slice(0, 3) : [];

  return renderAssistantMarkdownMessage(
    buildContextTabsSummaryMarkdown(summary, keyPoints, recommendations),
    "context-tabs-message",
    `data-provider="${escapeHtml(summary?.provider || "")}" data-ai-used="${summary?.aiUsed ? "true" : "false"}"`
  );
}

function buildContextTabsSummaryMarkdown(summary, keyPoints = [], recommendations = []) {
  const lines = [];
  const answer = String(summary?.summary || summary?.answer || "").trim();
  const cleanPoints = keyPoints
    .map((point) => String(point || "").trim())
    .filter(Boolean)
    .slice(0, 4);
  const cleanRecommendations = recommendations
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 2);

  if (answer) lines.push(answer);

  if (cleanPoints.length) {
    if (lines.length) lines.push("");
    cleanPoints.forEach((point) => lines.push(`- ${point}`));
  }

  if (cleanRecommendations.length) {
    if (lines.length) lines.push("");
    lines.push(`Suggested next: ${cleanRecommendations.join(" ")}`);
  }

  return lines.join("\n") || "I read the selected tabs, but I do not have enough clear content to answer yet.";
}

function renderAssistantMarkdownMessage(markdown, className = "", attributes = "") {
  return `
    <article class="assistant-answer-message ${escapeHtml(className)}" ${attributes}>
      <div class="chat-answer markdown-message">${renderSafeMarkdown(markdown)}</div>
    </article>
  `;
}

function formatContextSkipBreakdownItem(item) {
  const count = Number(item?.count || 0);
  const reason = String(item?.reason || "").trim();
  const fallback = String(item?.label || reason || "unreadable").trim();
  const labelByReason = {
    over_cap: msg("skipReasonOverCap"),
    protected: msg("skipReasonProtected"),
    restricted: msg("skipReasonRestricted"),
    missing_permission: msg("skipReasonMissingPermission"),
    sensitive: msg("skipReasonSensitive"),
    unreadable: msg("skipReasonUnreadable"),
    empty: msg("skipReasonEmpty"),
    unavailable: msg("skipReasonUnavailable")
  };
  const label = labelByReason[reason] || fallback;

  return count ? `${count} ${label}` : label;
}

function renderToolCard(toolCard = {}) {
  const scope = toolCard.scope || {};
  const isPageRegion = scope.type === "page_region";
  const isWebSearch = scope.type === "web_search";
  const requested = Number(scope.requestedTabCount || 0);
  const read = Number(scope.readTabCount || 0);
  const skipped = Number(scope.skippedTabCount || 0);
  const maxTabs = Number(scope.maxTabs || 6);
  const status = String(toolCard.status || "running");
  const skippedBreakdown = Array.isArray(toolCard.skippedBreakdown)
    ? toolCard.skippedBreakdown.slice(0, 2)
    : [];
  const scopeCopy = isWebSearch
    ? msg("toolCardSearchScope", [scope.query || msg("webSearch")])
    : isPageRegion
    ? (read > 0 ? msg("toolCardRegionSelected") : msg("toolCardRegionPending"))
    : `${read || 0}/${Math.min(requested || maxTabs, maxTabs)} tabs`;
  const dataCopy = isWebSearch
    ? msg("toolCardDataSearchQuery")
    : isPageRegion
    ? msg("toolCardDataSelectedRegion")
    : msg("toolCardDataVisibleText");
  const webSearchStatusCopy =
    status === "needs-provider"
      ? msg("toolCardSearchProviderNeeded")
      : status === "completed"
      ? msg("toolCardSearchCompleted", [Number(scope.resultCount || 0)])
      : msg("toolCardSearchRunning");
  const skippedCopy = skipped > 0 ? msg("toolCardSkipped", [skipped]) : "";
  const skippedReasonCopy = skippedBreakdown
    .map(formatContextSkipBreakdownItem)
    .filter(Boolean)
    .join(" · ");
  const titleCopy = isWebSearch
    ? (toolCard.label || msg("toolCardSearchWeb"))
    : isPageRegion
    ? scopeCopy
    : toolCard.label || msg("toolCardReadGroupPages");
  const detailParts = isWebSearch
    ? [scopeCopy, dataCopy, webSearchStatusCopy, msg("toolCardStorageSessionOnly")]
    : isPageRegion
    ? [dataCopy, msg("toolCardStorageSessionOnly")]
    : [scopeCopy, dataCopy, msg("toolCardStorageSessionOnly"), skippedCopy, skippedReasonCopy].filter(Boolean);

  return `
    <article class="agent-tool-card ${isPageRegion ? "page-region-tool" : ""} ${isWebSearch ? "web-search-tool" : ""} ${escapeHtml(status)}">
      <p class="agent-tool-card-header chat-answer">
        <span class="tool-dot" aria-hidden="true"></span>
        <strong>${escapeHtml(titleCopy)}</strong>
      </p>
      <div class="agent-tool-card-grid">
        ${detailParts.map((part) => `<span>${escapeHtml(part)}</span>`).join("")}
      </div>
    </article>
  `;
}

function updateLatestToolCard(toolCard) {
  if (!toolCard) return;

  for (let index = chatMessages.length - 1; index >= 0; index -= 1) {
    if (chatMessages[index]?.status !== "tool-card") continue;

    chatMessages[index] = {
      ...chatMessages[index],
      html: renderToolCard(toolCard),
      text: "",
      includeInAIAgentContext: false
    };
    renderChatThread();
    return;
  }
}

function renderOptimizationCard(draft) {
  const metrics = Array.isArray(draft.metrics) ? draft.metrics : [];
  const actions = Array.isArray(draft.actions) ? draft.actions : [];

  return `
    <article class="run-message-card chat-optimization-card">
      <div>
        <h2>${escapeHtml(msg("impact"))}</h2>
        <p>${escapeHtml(draft.answer || "")}</p>
      </div>
      <div class="agent-result-list">
        ${metrics.map((metric) => renderImpactMetric(metric.label, metric.value)).join("")}
      </div>
      ${
        actions.length
          ? `
            <div class="chat-action-row">
              ${actions
                .map(
                  (action) => `
                    <button
                      class="mini-button"
                      type="button"
                      data-chat-action="quick-command"
                      data-command="${escapeHtml(action.command)}"
                      data-label="${escapeHtml(action.label)}"
                    >
                      ${escapeHtml(action.label)}
                    </button>
                  `
                )
                .join("")}
            </div>
          `
          : ""
      }
    </article>
  `;
}

function appendUserChatMessage(text) {
  appendChatMessage({
    role: "user",
    status: "user",
    html: `<p class="chat-answer">${escapeHtml(text)}</p>`,
    text,
    includeInAIAgentContext: true
  });
}

function buildAIAgentConversationHistory(currentText = "") {
  const entries = chatMessages
    .filter((message) => message?.includeInAIAgentContext !== false)
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .filter((message) => !["loading", "summary", "error"].includes(message?.status))
    .map((message) => ({
      role: message.role,
      text: normalizeConversationText(message.text)
    }))
    .filter((message) => message.text);
  const normalizedCurrentText = normalizeConversationText(currentText);
  const latestEntry = entries[entries.length - 1];

  if (latestEntry?.role === "user" && latestEntry.text === normalizedCurrentText) {
    entries.pop();
  }

  return entries.slice(-AI_AGENT_CONVERSATION_LIMIT);
}

function normalizeConversationText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

function appendChatMessage(message) {
  const previous = chatMessages[chatMessages.length - 1];

  if (previous?.role === "assistant" && previous.status === "loading") {
    chatMessages[chatMessages.length - 1] = message;
  } else {
    chatMessages.push(message);
  }

  if (chatMessages.length > CHAT_THREAD_LIMIT) {
    chatMessages = chatMessages.slice(-CHAT_THREAD_LIMIT);
  }

  renderChatThread();
}

function upsertSystemChatMessage(message) {
  const lastIndex = chatMessages.length - 1;
  const lastMessage = chatMessages[lastIndex];
  const shouldReplaceLast =
    lastMessage?.role === "assistant" &&
    String(lastMessage.status || "").startsWith("run-");

  if (shouldReplaceLast) {
    chatMessages[lastIndex] = message;
  } else {
    chatMessages.push(message);
  }

  if (chatMessages.length > CHAT_THREAD_LIMIT) {
    chatMessages = chatMessages.slice(-CHAT_THREAD_LIMIT);
  }

  renderChatThread();
}

function renderChatThread() {
  agentThread.classList.toggle("long-chat", chatMessages.length >= 10);
  chatPanel.hidden = chatMessages.length === 0;
  chatPanel.innerHTML = chatMessages
    .map(
      (message, index) => `
        <div class="chat-thread-message ${escapeHtml(message.role)} ${escapeHtml(message.status)}" data-chat-message-index="${index}">
          ${message.html}
        </div>
      `
    )
    .join("");
  disableStaleChatDraftButtons();
  scrollAgentThreadToBottom();
}

function scrollAgentThreadToBottom() {
  requestAnimationFrame(() => {
    resetHorizontalScroll();
    agentThread.scrollLeft = 0;
    agentThread.scrollTop = agentThread.scrollHeight;
    updateAgentThreadScrollState();
  });
}

function updateAgentThreadScrollState() {
  resetHorizontalScroll();
  agentThread.scrollLeft = 0;
  const canScroll = agentThread.scrollHeight > agentThread.clientHeight + 4;
  const isScrolled = agentThread.scrollTop > 4;

  agentThread.classList.toggle("can-scroll", canScroll);
  agentThread.classList.toggle("is-scrolled", canScroll && isScrolled);
}

function resetHorizontalScroll() {
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  if (document.scrollingElement) {
    document.scrollingElement.scrollLeft = 0;
  }
}

function disableStaleChatDraftButtons() {
  const activeDraftId = latestChatDraft?.id || "";
  chatPanel.querySelectorAll('[data-chat-action="apply"], [data-chat-action="cancel"]').forEach((button) => {
    button.disabled = !activeDraftId || button.dataset.draftId !== activeDraftId;
  });
}

function renderChatMatchedTabs(tabs, totalCount, options = {}) {
  if (!tabs.length) {
    return `<p class="empty tight-empty">${escapeHtml(msg("noCurrentTabsMatch"))}</p>`;
  }

  const hiddenCount = Math.max(0, Number(totalCount || tabs.length) - tabs.length);
  return `
    <div class="chat-tabs">
      ${tabs
        .slice(0, 5)
        .map(
          (tab) => `
            <div class="chat-tab-row">
              <span>
                <b>${escapeHtml(tab.title || msg("untitled"))}</b>
                <small>${escapeHtml([tab.hostname].filter(Boolean).join(" · "))}</small>
              </span>
              ${options.showOpenAction ? `
                <button
                  class="mini-button"
                  type="button"
                  data-chat-action="focus-tab"
                  data-tab-id="${escapeHtml(String(tab.id))}"
                >
                  ${escapeHtml(msg("openTab"))}
                </button>
              ` : ""}
            </div>
          `
        )
        .join("")}
      ${hiddenCount ? `<p class="chat-more">${escapeHtml(msg("more", [hiddenCount]))}</p>` : ""}
    </div>
  `;
}

function renderUndo(isAvailable) {
  undoButton.disabled = !isAvailable;
}

function renderRestore(isAvailable) {
  restoreButton.disabled = !isAvailable;
}

function renderPrivacy(isVisible) {
  privacyPanel.hidden = !isVisible;
  organizeButton.disabled = isVisible;
  dashboardTopButton.disabled = isVisible;
  chatInput.disabled = isVisible;
  if (pageRegionButton) pageRegionButton.disabled = isVisible;
  chatSendButton.disabled = isVisible;
  if (verticalTabsOrganizeButton) verticalTabsOrganizeButton.disabled = isVisible;
  if (verticalTabsChatButton) verticalTabsChatButton.disabled = isVisible;
}

function setBusy(isBusy) {
  dashboardTopButton.disabled = isBusy;
  organizeButton.disabled = isBusy;
  undoButton.disabled = isBusy || undoButton.disabled;
  restoreButton.disabled = isBusy || restoreButton.disabled;
  dashboardButton.disabled = isBusy;
  startButton.disabled = isBusy;
  chatInput.disabled = isBusy;
  if (pageRegionButton) pageRegionButton.disabled = isBusy;
  chatSendButton.disabled = isBusy;
  if (verticalTabsOrganizeButton) verticalTabsOrganizeButton.disabled = isBusy;
  if (verticalTabsChatButton) verticalTabsChatButton.disabled = isBusy;
  if (verticalTabsSearch) verticalTabsSearch.disabled = isBusy;
  chatPanel.querySelectorAll("button").forEach((button) => {
    button.disabled = isBusy;
  });

  if (!isBusy) {
    disableStaleChatDraftButtons();
  }
}

function getCompletedMessage(run) {
  if (run?.summary?.skippedReason === "tabs-too-few") {
    return msg("tabsTooFewCompleted");
  }

  const groupsCreated = run?.summary?.groupsCreated ?? 0;
  const tabsMoved = run?.summary?.tabsMoved ?? 0;
  const skippedGroups = run?.summary?.skippedGroups ?? 0;
  const safeDuplicatesClosed = run?.summary?.safeDuplicatesClosed ?? 0;
  const reviewDuplicatesClosed = run?.summary?.reviewDuplicatesClosed ?? 0;
  const reviewGroupsKept = run?.summary?.reviewDuplicateGroupsKept ?? 0;
  const chatRefineTabsMoved = run?.summary?.chatRefineTabsMoved ?? 0;
  const aiStatus = run?.summary?.aiClassificationStatus || "not-configured";
  const duplicateActions = [];

  if (safeDuplicatesClosed > 0) {
    duplicateActions.push(msg("closedSafeDuplicates", [safeDuplicatesClosed]));
  }

  if (reviewDuplicatesClosed > 0) {
    duplicateActions.push(msg("closedReviewedDuplicates", [reviewDuplicatesClosed]));
  }

  if (reviewGroupsKept > 0) {
    duplicateActions.push(msg("markedReviewGroupsKept", [reviewGroupsKept]));
  }

  if (chatRefineTabsMoved > 0) {
    duplicateActions.push(msg("movedTabsFromChatRefine", [chatRefineTabsMoved]));
  }

  const duplicateCopy = duplicateActions.length
    ? `${duplicateActions.join(". ")}. ${msg("restoreAvailableForClosedTabs")}`
    : msg("noTabsWereClosed");

  if (groupsCreated === 0) {
    return msg("scannedNoGroupableTabs", [duplicateCopy]);
  }

  const skippedCopy = skippedGroups > 0 ? msg("groupsSkippedByChrome", [skippedGroups]) : "";
  const aiCopy = aiStatus === "applied" ? msg("deepSeekHelped") : "";
  const fallbackCopy = String(aiStatus).startsWith("fallback:") ? msg("aiFellBackLocal") : "";
  return msg("createdGroupsMovedTabs", [
    groupsCreated,
    tabsMoved,
    duplicateCopy,
    aiCopy,
    fallbackCopy,
    skippedCopy
  ]).replace(/\s+/g, " ").trim();
}

function getCompletedAgentReply(run) {
  if (run?.summary?.skippedReason === "tabs-too-few") {
    return msg("tabsTooFewCompleted");
  }

  const groupsCreated = run?.summary?.groupsCreated ?? 0;
  const tabsMoved = run?.summary?.tabsMoved ?? 0;
  const reviewGroups = run?.summary?.reviewDuplicateGroups ?? 0;
  const memoryRelief = run?.summary?.safeDuplicatesClosed ?? 0;
  const aiStatus = run?.summary?.aiClassificationStatus || "not-configured";
  const aiCopy = aiStatus === "applied" ? msg("deepSeekHelped") : "";
  const fallbackCopy = String(aiStatus).startsWith("fallback:") ? msg("aiFellBackLocal") : "";
  const duplicateCopy = memoryRelief > 0
    ? msg("closedSafeDuplicates", [memoryRelief])
    : msg("noTabsWereClosed");

  if (groupsCreated === 0) {
    return msg("scannedNoGroupableTabs", [duplicateCopy]);
  }

  return msg("completedAgentReply", [
    groupsCreated,
    tabsMoved,
    duplicateCopy,
    memoryRelief,
    reviewGroups,
    aiCopy,
    fallbackCopy
  ])
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
