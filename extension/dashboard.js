import { applyI18n, initI18n, msg } from "./i18n.js";
import { buildDiagnosticSnapshot, buildFeedbackTemplate } from "./diagnostics.js";

const CURRENT_RUN_KEY = "tabmosaic.currentRun";
const AI_SETTINGS_KEY = "tabmosaic.aiSettings";
const USER_RULES_KEY = "tabmosaic.userRules";
const ERROR_LOG_KEY = "tabmosaic.errorLog";
const DUPLICATE_SAFETY_AUDIT_KEY = "tabmosaic.duplicateSafetyAudit";
const SAVED_WORKSPACES_KEY = "tabmosaic.savedWorkspaces";
const SIDEBAR_CONTEXT_KEY = "tabmosaic.sidebarContext";
const GROUP_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan"];
const DEFAULT_AI_SETTINGS = {
  enabled: false,
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
  apiKey: ""
};
const GROUP_COLOR_CLASS = new Map(GROUP_COLORS.map((color, index) => [color, `g-${index}`]));
const GROUP_FILTERS = new Set(["all", "ai", "rules"]);

const refreshButton = document.querySelector("#refreshButton");
const workspaceRefreshButton = document.querySelector("#workspaceRefreshButton");
const saveWorkspaceButton = document.querySelector("#saveWorkspaceButton");
const organizeNowButton = document.querySelector("#organizeNowButton");
const dashboardUndoButton = document.querySelector("#dashboardUndoButton");
const dashboardRestoreButton = document.querySelector("#dashboardRestoreButton");
const workspaceActionStatus = document.querySelector("#workspaceActionStatus");
const rulesCountBadge = document.querySelector("#rulesCountBadge");
const rulesSubtitle = document.querySelector("#rulesSubtitle");
const allGroupsCount = document.querySelector("#allGroupsCount");
const aiGroupsCount = document.querySelector("#aiGroupsCount");
const ruleGroupsCount = document.querySelector("#ruleGroupsCount");
const dashboardGroups = document.querySelector("#dashboardGroups");
const dashboardDuplicates = document.querySelector("#dashboardDuplicates");
const dashboardWorkspaces = document.querySelector("#dashboardWorkspaces");
const dashboardRules = document.querySelector("#dashboardRules");
const settingsSnapshot = document.querySelector("#settingsSnapshot");
const aiSettingsForm = document.querySelector("#aiSettingsForm");
const aiEnabledInput = document.querySelector("#aiEnabledInput");
const aiBaseUrlInput = document.querySelector("#aiBaseUrlInput");
const aiModelInput = document.querySelector("#aiModelInput");
const aiKeyInput = document.querySelector("#aiKeyInput");
const aiSettingsStatus = document.querySelector("#aiSettingsStatus");
const testAIButton = document.querySelector("#testAIButton");
const clearAIKeyButton = document.querySelector("#clearAIKeyButton");
const copyDiagnosticsButton = document.querySelector("#copyDiagnosticsButton");
const copyFeedbackButton = document.querySelector("#copyFeedbackButton");
const diagnosticsStatus = document.querySelector("#diagnosticsStatus");
const clearDataButton = document.querySelector("#clearDataButton");
const clearDataStatus = document.querySelector("#clearDataStatus");
let latestRun = null;
let activeGroupFilter = "all";
let draggedDashboardTab = null;

await initI18n();
applyI18n();

refreshButton.addEventListener("click", loadDashboard);
workspaceRefreshButton.addEventListener("click", loadDashboard);
organizeNowButton.addEventListener("click", organizeFromDashboard);
saveWorkspaceButton.addEventListener("click", saveWorkspaceFromDashboard);
dashboardUndoButton.addEventListener("click", undoFromDashboard);
dashboardRestoreButton.addEventListener("click", restoreClosedFromDashboard);
aiSettingsForm.addEventListener("submit", saveAISettings);
testAIButton.addEventListener("click", testAIConnection);
clearAIKeyButton.addEventListener("click", clearAIKey);
dashboardRules.addEventListener("click", handleRuleAction);
dashboardGroups.addEventListener("click", handleGroupAction);
dashboardDuplicates.addEventListener("click", handleGroupAction);
dashboardWorkspaces.addEventListener("click", handleSavedWorkspaceAction);
dashboardGroups.addEventListener("dragstart", handleDashboardTabDragStart);
dashboardGroups.addEventListener("dragover", handleDashboardTabDragOver);
dashboardGroups.addEventListener("dragleave", handleDashboardTabDragLeave);
dashboardGroups.addEventListener("drop", handleDashboardTabDrop);
dashboardGroups.addEventListener("dragend", handleDashboardTabDragEnd);
copyDiagnosticsButton.addEventListener("click", copyDiagnosticSnapshot);
copyFeedbackButton.addEventListener("click", copyFeedbackTemplate);
clearDataButton.addEventListener("click", clearLocalData);
document.querySelectorAll(".dashboard-nav-item").forEach((button) => {
  button.addEventListener("click", () => setActiveDashboardPage(button.dataset.page));
});
document.querySelectorAll(".dashboard-chip[data-filter]").forEach((button) => {
  button.addEventListener("click", () => setActiveGroupFilter(button.dataset.filter || "all"));
});

loadDashboard();
loadAISettings();

async function loadDashboard() {
  const result = await chrome.storage.local.get([CURRENT_RUN_KEY, USER_RULES_KEY, SAVED_WORKSPACES_KEY]);
  renderDashboard(
    result[CURRENT_RUN_KEY],
    result[USER_RULES_KEY] || [],
    result[SAVED_WORKSPACES_KEY] || []
  );
}

function renderDashboard(run, rules = [], workspaces = []) {
  latestRun = run || null;
  renderRules(rules);
  renderSavedWorkspaces(workspaces);
  syncGroupFilterButtons();
  syncDashboardActionButtons(run);
  renderRuleCount(rules);

  if (run?.status === "error") {
    dashboardGroups.innerHTML = renderDashboardError(run.error || msg("scanDidNotFinish"));
    dashboardDuplicates.innerHTML = `<p class="empty">${escapeHtml(msg("noDuplicateDataYet"))}</p>`;
    renderSettingsSnapshot({});
    renderGroupFilterCounts([]);
    return;
  }

  if (!run || !["completed", "closed-restored", "undone"].includes(run.status)) {
    dashboardGroups.innerHTML = `<p class="empty">${escapeHtml(msg("openSidePanelToPopulateDashboard"))}</p>`;
    dashboardDuplicates.innerHTML = `<p class="empty">${escapeHtml(msg("noDuplicateDataYet"))}</p>`;
    renderSettingsSnapshot({});
    renderGroupFilterCounts([]);
    return;
  }

  renderGroupFilterCounts(run.groups || []);
  renderGroups(run.groups || [], run);
  renderDuplicates(run.duplicateGroups || []);
  renderSettingsSnapshot(run.summary || {});
}

function setActiveDashboardPage(pageName) {
  document.querySelectorAll(".dashboard-nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });
  document.querySelectorAll(".dashboard-page").forEach((page) => {
    page.classList.toggle("active", page.dataset.page === pageName);
  });
}

function setActiveGroupFilter(filterName) {
  activeGroupFilter = GROUP_FILTERS.has(filterName) ? filterName : "all";
  syncGroupFilterButtons();
  renderGroups(latestRun?.groups || [], latestRun);
}

function syncGroupFilterButtons() {
  document.querySelectorAll(".dashboard-chip[data-filter]").forEach((button) => {
    const isActive = button.dataset.filter === activeGroupFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function syncDashboardActionButtons(run = latestRun) {
  const summary = run?.summary || {};
  saveWorkspaceButton.disabled = !isWorkspaceSaveableRun(run);
  dashboardUndoButton.disabled = !summary.undoAvailable;
  dashboardRestoreButton.disabled = !summary.closedTabsRestoreAvailable;
}

function isWorkspaceSaveableRun(run) {
  return Boolean(
    run &&
      ["completed", "closed-restored", "undone"].includes(run.status) &&
      Array.isArray(run.groups) &&
      Array.isArray(run.snapshot?.tabs)
  );
}

async function organizeFromDashboard() {
  organizeNowButton.disabled = true;
  organizeNowButton.textContent = msg("organizing");
  dashboardGroups.innerHTML = `<p class="empty">${escapeHtml(msg("scanningAllNormalWindows"))}</p>`;

  try {
    const response = await chrome.runtime.sendMessage({ type: "ORGANIZE_NOW" });
    if (!response?.ok) {
      dashboardGroups.innerHTML = renderDashboardError(response?.error || msg("scanDidNotFinish"));
      return;
    }
    renderDashboard(response.run, await loadRules(), await loadSavedWorkspaces());
  } catch (error) {
    dashboardGroups.innerHTML = renderDashboardError(error?.message || msg("scanDidNotFinish"));
  } finally {
    organizeNowButton.disabled = false;
    organizeNowButton.textContent = msg("organizeBrowser");
  }
}

async function undoFromDashboard() {
  dashboardUndoButton.disabled = true;
  dashboardUndoButton.textContent = msg("undoing");

  try {
    const response = await chrome.runtime.sendMessage({ type: "UNDO_LAST" });

    if (!response?.ok) {
      window.alert(response?.error || msg("couldNotUndo"));
      return;
    }

    renderDashboard(response.run, await loadRules(), await loadSavedWorkspaces());
  } catch (error) {
    window.alert(error?.message || msg("couldNotUndo"));
  } finally {
    dashboardUndoButton.textContent = msg("undo");
    syncDashboardActionButtons(latestRun);
  }
}

async function restoreClosedFromDashboard() {
  dashboardRestoreButton.disabled = true;
  dashboardRestoreButton.textContent = msg("restoring");

  try {
    const response = await chrome.runtime.sendMessage({ type: "RESTORE_CLOSED_DUPLICATES" });

    if (!response?.ok) {
      window.alert(response?.error || msg("couldNotRestoreClosed"));
      return;
    }

    renderDashboard(response.run, await loadRules(), await loadSavedWorkspaces());
  } catch (error) {
    window.alert(error?.message || msg("couldNotRestoreClosed"));
  } finally {
    dashboardRestoreButton.textContent = msg("restoreClosed");
    syncDashboardActionButtons(latestRun);
  }
}

async function saveWorkspaceFromDashboard() {
  saveWorkspaceButton.disabled = true;
  saveWorkspaceButton.textContent = msg("saving");
  workspaceActionStatus.textContent = "";

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_CURRENT_WORKSPACE",
      source: "dashboard"
    });

    if (!response?.ok) {
      workspaceActionStatus.textContent = response?.error || msg("couldNotSaveWorkspace");
      return;
    }

    renderSavedWorkspaces(response.result?.workspaces || []);
    workspaceActionStatus.textContent = msg("workspaceSaved");
  } catch (error) {
    workspaceActionStatus.textContent = `${msg("couldNotSaveWorkspace")} ${error?.message || ""}`.trim();
  } finally {
    saveWorkspaceButton.textContent = msg("saveWorkspace");
    syncDashboardActionButtons(latestRun);
  }
}

async function loadRules() {
  const result = await chrome.storage.local.get(USER_RULES_KEY);
  return Array.isArray(result[USER_RULES_KEY]) ? result[USER_RULES_KEY] : [];
}

async function loadSavedWorkspaces() {
  const result = await chrome.storage.local.get(SAVED_WORKSPACES_KEY);
  return Array.isArray(result[SAVED_WORKSPACES_KEY]) ? result[SAVED_WORKSPACES_KEY] : [];
}

function renderRuleCount(rules = []) {
  rulesCountBadge.textContent = String(rules.length);
  rulesSubtitle.textContent = msg("rulesSubtitleWithCount", [
    rules.filter((rule) => rule.enabled !== false).length,
    rules.filter((rule) => rule.enabled === false).length
  ]);
}

async function handleRuleAction(event) {
  const button = event.target.closest("[data-rule-action]");
  if (!button) return;

  const result = await chrome.storage.local.get(USER_RULES_KEY);
  const rules = Array.isArray(result[USER_RULES_KEY]) ? result[USER_RULES_KEY] : [];
  const ruleId = button.dataset.ruleId;
  let nextRules = rules;

  if (button.dataset.ruleAction === "toggle") {
    nextRules = rules.map((rule) =>
      rule.id === ruleId
        ? {
            ...rule,
            enabled: rule.enabled === false,
            updatedAt: new Date().toISOString()
          }
        : rule
    );
  }

  if (button.dataset.ruleAction === "delete") {
    const confirmed = window.confirm(msg("deleteRuleConfirm"));
    if (!confirmed) return;

    nextRules = rules.filter((rule) => rule.id !== ruleId);
  }

  await chrome.storage.local.set({ [USER_RULES_KEY]: nextRules });
  await loadDashboard();
}

async function handleSavedWorkspaceAction(event) {
  const button = event.target.closest("[data-workspace-action]");
  if (!button) return;

  if (button.dataset.workspaceAction !== "delete") return;

  await deleteSavedWorkspaceFromDashboard(button);
}

async function deleteSavedWorkspaceFromDashboard(button) {
  const workspaceId = button.dataset.workspaceId || "";

  if (!workspaceId) return;

  const confirmed = window.confirm(msg("deleteWorkspaceConfirm"));
  if (!confirmed) return;

  button.disabled = true;
  button.textContent = msg("deleting");
  workspaceActionStatus.textContent = "";

  try {
    const response = await chrome.runtime.sendMessage({
      type: "DELETE_SAVED_WORKSPACE",
      workspaceId
    });

    if (!response?.ok) {
      workspaceActionStatus.textContent = response?.error || msg("couldNotDeleteWorkspace");
      return;
    }

    renderSavedWorkspaces(response.result?.workspaces || []);
    workspaceActionStatus.textContent = msg("workspaceDeleted");
  } catch (error) {
    workspaceActionStatus.textContent = `${msg("couldNotDeleteWorkspace")} ${error?.message || ""}`.trim();
  } finally {
    button.disabled = false;
    button.textContent = msg("delete");
  }
}

async function handleGroupAction(event) {
  const button = event.target.closest("[data-group-action]");

  if (!button) {
    await handleDashboardGroupContextClick(event);
    return;
  }

  if (button.dataset.groupAction === "move-tab") {
    await handleDashboardTabMove(button);
    return;
  }

  if (button.dataset.groupAction === "focus-tab") {
    await handleDashboardTabFocus(button);
    return;
  }

  if (button.dataset.groupAction !== "apply") return;

  const card = button.closest("[data-group-id]");
  if (!card) return;

  const titleInput = card.querySelector("[data-group-title]");
  const colorInput = card.querySelector("[data-group-color]");
  button.disabled = true;
  button.textContent = msg("applying");

  const response = await chrome.runtime.sendMessage({
    type: "APPLY_DASHBOARD_GROUP_UPDATE",
    groupId: Number(card.dataset.groupId),
    title: titleInput.value.trim(),
    color: colorInput.value
  });

  if (!response?.ok) {
    button.disabled = false;
    button.textContent = msg("apply");
    window.alert(response?.error || msg("couldNotApplyGroupUpdate"));
    return;
  }

  await loadDashboard();
}

async function handleDashboardTabFocus(button) {
  const row = button.closest("[data-tab-id]");
  if (!row) return;

  const openSidebarPromise = openSidebarForDashboardContext(Number(row.dataset.windowId));
  await setSidebarContextFromDashboard(buildSidebarTabContext(row));
  await openSidebarPromise;

  const response = await chrome.runtime.sendMessage({
    type: "FOCUS_DASHBOARD_TAB",
    tabId: Number(row.dataset.tabId)
  });

  if (!response?.ok) {
    window.alert(response?.error || msg("couldNotOpenTab"));
  }
}

async function handleDashboardGroupContextClick(event) {
  const card = event.target.closest("[data-group-id][data-window-id]");
  if (!card || isDashboardContextClickIgnored(event.target)) return;

  const openSidebarPromise = openSidebarForDashboardContext(Number(card.dataset.windowId));
  await setSidebarContextFromDashboard(buildSidebarGroupContext(card));
  await openSidebarPromise;
  markDashboardContextCard(card);
}

function isDashboardContextClickIgnored(target) {
  return Boolean(
    target?.closest?.("button, input, select, textarea, summary, details, a, [data-tab-id], [draggable='true']")
  );
}

function buildSidebarTabContext(row) {
  const tabId = Number(row?.dataset?.tabId);
  const tab = findDashboardTab(tabId);
  const group = findDashboardGroup(Number(row?.dataset?.currentGroupId));

  return {
    scope: "current_tab",
    tabId,
    windowId: toOptionalInteger(tab?.windowId || row?.dataset?.windowId || group?.windowId),
    title: tab?.title || row?.querySelector(".dashboard-tab-title-button")?.textContent?.trim() || "",
    hostname: tab?.hostname || "",
    groupId: toOptionalInteger(group?.id || row?.dataset?.currentGroupId),
    groupName: group?.name || "",
    source: "dashboard",
    updatedAt: new Date().toISOString()
  };
}

function buildSidebarGroupContext(card) {
  const group = findDashboardGroup(Number(card?.dataset?.groupId));
  const tabs = group ? getTabsForGroup(group, latestRun) : [];

  return {
    scope: "current_group",
    groupId: toOptionalInteger(group?.id || card?.dataset?.groupId),
    windowId: toOptionalInteger(group?.windowId || card?.dataset?.windowId),
    groupName: group?.name || card?.querySelector("[data-group-title]")?.value?.trim() || msg("contextUnnamedGroup"),
    tabCount: tabs.length || Number(group?.tabCount || 0) || 0,
    tabIds: tabs.map((tab) => tab.id).filter(Number.isInteger),
    source: "dashboard",
    updatedAt: new Date().toISOString()
  };
}

async function setSidebarContextFromDashboard(context) {
  await chrome.storage.local.set({ [SIDEBAR_CONTEXT_KEY]: sanitizeSidebarContext(context) });
}

function sanitizeSidebarContext(context = {}) {
  const tabIds = Array.isArray(context.tabIds)
    ? Array.from(new Set(context.tabIds.map((tabId) => Number(tabId)).filter(Number.isInteger))).slice(0, 80)
    : [];

  return {
    scope: ["current_tab", "current_group"].includes(context.scope) ? context.scope : "current_tab",
    tabId: toOptionalInteger(context.tabId),
    groupId: toOptionalInteger(context.groupId),
    windowId: toOptionalInteger(context.windowId),
    title: String(context.title || "").slice(0, 160),
    hostname: String(context.hostname || "").slice(0, 120),
    groupName: String(context.groupName || "").slice(0, 120),
    tabCount: Number.isInteger(Number(context.tabCount)) ? Math.max(0, Number(context.tabCount)) : tabIds.length,
    tabIds,
    source: "dashboard",
    updatedAt: new Date().toISOString()
  };
}

function toOptionalInteger(value) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

async function openSidebarForDashboardContext(windowId) {
  if (!Number.isInteger(windowId) || !chrome.sidePanel?.open) return;

  try {
    await chrome.sidePanel.open({ windowId });
  } catch {
    // The Dashboard can still update Sidebar context when the panel is already open.
  }
}

function markDashboardContextCard(card) {
  dashboardGroups.querySelectorAll(".dashboard-group-card.context-active").forEach((element) => {
    element.classList.remove("context-active");
  });
  card.classList.add("context-active");
}

function findDashboardTab(tabId) {
  return (latestRun?.snapshot?.tabs || []).find((tab) => Number(tab.id) === Number(tabId)) || null;
}

function findDashboardGroup(groupId) {
  return (latestRun?.groups || []).find((group) => Number(group.id) === Number(groupId)) || null;
}

async function handleDashboardTabMove(button) {
  const row = button.closest("[data-tab-id]");
  const select = row?.querySelector("[data-tab-target-group]");
  const targetGroupId = Number(select?.value);

  if (!row || !Number.isInteger(targetGroupId)) return;

  button.disabled = true;
  button.textContent = msg("moving");

  const response = await moveDashboardTab(Number(row.dataset.tabId), targetGroupId);

  if (!response?.ok) {
    button.disabled = false;
    button.textContent = msg("move");
    window.alert(response?.error || msg("couldNotMoveTab"));
    return;
  }
}

async function moveDashboardTab(tabId, targetGroupId) {
  const response = await chrome.runtime.sendMessage({
    type: "APPLY_DASHBOARD_TAB_MOVE",
    tabId,
    targetGroupId
  });

  if (response?.ok) {
    await loadDashboard();
  }

  return response;
}

function handleDashboardTabDragStart(event) {
  const row = event.target.closest('[data-tab-id][data-tab-draggable="true"]');

  if (!row) {
    event.preventDefault();
    return;
  }

  draggedDashboardTab = {
    tabId: Number(row.dataset.tabId),
    sourceGroupId: Number(row.dataset.currentGroupId),
    windowId: Number(row.dataset.windowId)
  };
  row.classList.add("dragging");

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-tabmosaic-tab", JSON.stringify(draggedDashboardTab));
    event.dataTransfer.setData("text/plain", String(draggedDashboardTab.tabId));
  }
}

function handleDashboardTabDragOver(event) {
  const card = getDashboardDropCard(event);
  const dragState = getDashboardDragState(event);

  if (!card || !isDashboardTabDropAllowed(card, dragState)) return;

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
  card.classList.add("drag-over");
}

function handleDashboardTabDragLeave(event) {
  const card = getDashboardDropCard(event);

  if (!card || card.contains(event.relatedTarget)) return;

  card.classList.remove("drag-over");
}

async function handleDashboardTabDrop(event) {
  const card = getDashboardDropCard(event);
  const dragState = getDashboardDragState(event);
  clearDashboardDragState();

  if (!card || !isDashboardTabDropAllowed(card, dragState)) return;

  event.preventDefault();
  const response = await moveDashboardTab(dragState.tabId, Number(card.dataset.groupId));

  if (!response?.ok) {
    window.alert(response?.error || msg("couldNotMoveTab"));
  }
}

function handleDashboardTabDragEnd() {
  clearDashboardDragState();
}

function getDashboardDropCard(event) {
  return event.target.closest("[data-group-id][data-window-id]");
}

function getDashboardDragState(event) {
  if (draggedDashboardTab?.tabId) return draggedDashboardTab;

  try {
    const rawValue = event.dataTransfer?.getData("application/x-tabmosaic-tab");
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function isDashboardTabDropAllowed(card, dragState) {
  if (!card || !dragState?.tabId) return false;

  const targetGroupId = Number(card.dataset.groupId);
  const targetWindowId = Number(card.dataset.windowId);

  return (
    Number.isInteger(targetGroupId) &&
    Number.isInteger(targetWindowId) &&
    targetGroupId !== Number(dragState.sourceGroupId) &&
    targetWindowId === Number(dragState.windowId)
  );
}

function clearDashboardDragState() {
  dashboardGroups.querySelectorAll(".dragging, .drag-over").forEach((element) => {
    element.classList.remove("dragging", "drag-over");
  });
  draggedDashboardTab = null;
}

async function loadAISettings() {
  const result = await chrome.storage.local.get(AI_SETTINGS_KEY);
  const settings = {
    ...DEFAULT_AI_SETTINGS,
    ...(result[AI_SETTINGS_KEY] || {})
  };

  aiEnabledInput.checked = Boolean(settings.enabled);
  aiBaseUrlInput.value = settings.baseUrl || DEFAULT_AI_SETTINGS.baseUrl;
  aiModelInput.value = settings.model || DEFAULT_AI_SETTINGS.model;
  aiKeyInput.value = "";
  aiKeyInput.placeholder = settings.apiKey
    ? msg("apiKeySavedPlaceholder")
    : msg("apiKeyStoredPlaceholder");
  aiSettingsStatus.textContent = settings.enabled && settings.apiKey
    ? msg("aiClassificationEnabled")
    : msg("localRulesActiveUntilKey");
}

async function saveAISettings(event) {
  event.preventDefault();

  try {
    const existing = await chrome.storage.local.get(AI_SETTINGS_KEY);
    const previous = {
      ...DEFAULT_AI_SETTINGS,
      ...(existing[AI_SETTINGS_KEY] || {})
    };
    const next = {
      ...previous,
      enabled: Boolean(aiEnabledInput.checked),
      provider: "deepseek",
      baseUrl: normalizeBaseUrl(aiBaseUrlInput.value),
      model: aiModelInput.value.trim() || DEFAULT_AI_SETTINGS.model,
      apiKey: aiKeyInput.value.trim() || previous.apiKey
    };

    await chrome.storage.local.set({ [AI_SETTINGS_KEY]: next });
    aiKeyInput.value = "";
    await loadAISettings();
  } catch (error) {
    aiSettingsStatus.textContent = error?.message || msg("unsupportedAIBaseUrl");
  }
}

async function testAIConnection() {
  testAIButton.disabled = true;
  testAIButton.textContent = msg("testing");
  aiSettingsStatus.textContent = msg("testingAIConnection");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "TEST_AI_CONNECTION",
      baseUrl: normalizeBaseUrl(aiBaseUrlInput.value),
      model: aiModelInput.value.trim() || DEFAULT_AI_SETTINGS.model,
      apiKey: aiKeyInput.value.trim()
    });

    if (!response?.ok) {
      aiSettingsStatus.textContent = response?.error || msg("aiConnectionFailed");
      return;
    }

    const result = response.result || {};
    aiSettingsStatus.textContent = result.modelAvailable
      ? msg("aiConnectionOk", [result.model || DEFAULT_AI_SETTINGS.model])
      : msg("aiConnectionModelMissing", [result.model || DEFAULT_AI_SETTINGS.model]);
  } catch (error) {
    aiSettingsStatus.textContent = `${msg("aiConnectionFailed")} ${error?.message || ""}`.trim();
  } finally {
    testAIButton.disabled = false;
    testAIButton.textContent = msg("testAIConnection");
  }
}

async function clearAIKey() {
  const confirmed = window.confirm(msg("clearAIKeyConfirm"));

  if (!confirmed) return;

  clearAIKeyButton.disabled = true;
  clearAIKeyButton.textContent = msg("clearing");
  aiSettingsStatus.textContent = "";

  try {
    const result = await chrome.storage.local.get(AI_SETTINGS_KEY);
    const previous = {
      ...DEFAULT_AI_SETTINGS,
      ...(result[AI_SETTINGS_KEY] || {})
    };
    const next = {
      ...previous,
      enabled: false,
      apiKey: ""
    };

    await chrome.storage.local.set({ [AI_SETTINGS_KEY]: next });
    aiKeyInput.value = "";
    await loadAISettings();
    aiSettingsStatus.textContent = msg("aiKeyCleared");
  } catch (error) {
    aiSettingsStatus.textContent = `${msg("couldNotClearAIKey")} ${error?.message || ""}`.trim();
  } finally {
    clearAIKeyButton.disabled = false;
    clearAIKeyButton.textContent = msg("clearAIKey");
  }
}

async function clearLocalData() {
  const confirmed = window.confirm(msg("clearLocalDataConfirm"));

  if (!confirmed) return;

  clearDataButton.disabled = true;
  clearDataButton.textContent = msg("clearing");
  clearDataStatus.textContent = "";

  const response = await chrome.runtime.sendMessage({ type: "CLEAR_LOCAL_DATA" });

  if (!response?.ok) {
    clearDataButton.disabled = false;
    clearDataButton.textContent = msg("clearLocalData");
    clearDataStatus.textContent = response?.error || msg("couldNotClearLocalData");
    return;
  }

  clearDataButton.disabled = false;
  clearDataButton.textContent = msg("clearLocalData");
  clearDataStatus.textContent = msg("localDataCleared");
  await loadAISettings();
  await loadDashboard();
}

async function copyDiagnosticSnapshot() {
  copyDiagnosticsButton.disabled = true;
  copyDiagnosticsButton.textContent = msg("copying");
  diagnosticsStatus.textContent = "";

  try {
    const snapshot = await loadDiagnosticSnapshot();
    const text = JSON.stringify(snapshot, null, 2);
    await navigator.clipboard.writeText(text);
    diagnosticsStatus.textContent = msg("diagnosticsCopied");
  } catch (error) {
    diagnosticsStatus.textContent = `${msg("diagnosticsCopyFailed")} ${error?.message || ""}`.trim();
  } finally {
    copyDiagnosticsButton.disabled = false;
    copyDiagnosticsButton.textContent = msg("copyDiagnostics");
  }
}

async function copyFeedbackTemplate() {
  copyFeedbackButton.disabled = true;
  copyFeedbackButton.textContent = msg("copying");
  diagnosticsStatus.textContent = "";

  try {
    const uiLanguage = chrome.i18n?.getUILanguage?.() || "";
    const snapshot = await loadDiagnosticSnapshot();
    const text = buildFeedbackTemplate({
      diagnosticSnapshot: snapshot,
      uiLanguage
    });
    await navigator.clipboard.writeText(text);
    diagnosticsStatus.textContent = msg("feedbackTemplateCopied");
  } catch (error) {
    diagnosticsStatus.textContent = `${msg("feedbackTemplateCopyFailed")} ${error?.message || ""}`.trim();
  } finally {
    copyFeedbackButton.disabled = false;
    copyFeedbackButton.textContent = msg("copyFeedbackTemplate");
  }
}

async function loadDiagnosticSnapshot() {
  const result = await chrome.storage.local.get([
    CURRENT_RUN_KEY,
    USER_RULES_KEY,
    AI_SETTINGS_KEY,
    ERROR_LOG_KEY,
    DUPLICATE_SAFETY_AUDIT_KEY,
    SAVED_WORKSPACES_KEY
  ]);
  return buildDiagnosticSnapshot({
    manifest: chrome.runtime.getManifest(),
    run: result[CURRENT_RUN_KEY],
    rules: result[USER_RULES_KEY] || [],
    aiSettings: result[AI_SETTINGS_KEY] || {},
    errorLog: result[ERROR_LOG_KEY] || [],
    duplicateSafetyAudit: result[DUPLICATE_SAFETY_AUDIT_KEY] || [],
    savedWorkspaces: result[SAVED_WORKSPACES_KEY] || [],
    uiLanguage: chrome.i18n?.getUILanguage?.() || ""
  });
}

function normalizeBaseUrl(value) {
  const rawValue = String(value || "").trim() || DEFAULT_AI_SETTINGS.baseUrl;
  let url;

  try {
    url = new URL(rawValue);
  } catch {
    throw new Error(msg("unsupportedAIBaseUrl"));
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== "api.deepseek.com" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(msg("unsupportedAIBaseUrl"));
  }

  return url.toString().replace(/\/+$/, "");
}

function renderSettingsSnapshot(summary) {
  const aiStatus = summary.aiClassificationStatus || "not-configured";

  settingsSnapshot.innerHTML = `
    <div class="row"><span>${escapeHtml(msg("aiProvider"))}</span><strong>${escapeHtml(formatAIStatus(aiStatus))}</strong></div>
    <div class="row"><span>${escapeHtml(msg("aiGroups"))}</span><strong>${escapeHtml(String(summary.aiGroupsSuggested ?? "—"))}</strong></div>
    <div class="row"><span>${escapeHtml(msg("pageBodyReading"))}</span><strong>${escapeHtml(msg("userTriggered"))}</strong></div>
    <div class="row"><span>${escapeHtml(msg("incognito"))}</span><strong>${escapeHtml(msg("off"))}</strong></div>
    <div class="row"><span>${escapeHtml(msg("cloudSync"))}</span><strong>${escapeHtml(msg("off"))}</strong></div>
  `;
}

function formatAIStatus(status) {
  if (status === "applied") return msg("deepSeekApplied");
  if (status === "not-configured") return msg("localRules");
  if (status === "empty") return msg("aiNoUsableGroups");
  if (status === "no-tabs") return msg("aiNoEligibleTabs");
  if (String(status).startsWith("fallback:")) return msg("fallbackToLocal");
  return status;
}

function renderGroupFilterCounts(groups) {
  const aiGroupCount = groups.filter((group) => isAIGroup(group)).length;
  const ruleGroupCount = groups.filter((group) => isRuleGroup(group)).length;
  allGroupsCount.textContent = String(groups.length);
  aiGroupsCount.textContent = String(aiGroupCount);
  ruleGroupsCount.textContent = String(ruleGroupCount);
}

function renderGroups(groups, run = latestRun) {
  if (!groups.length) {
    dashboardGroups.innerHTML = `<p class="empty">${escapeHtml(msg("noNativeGroupsLatest"))}</p>`;
    return;
  }

  const filteredGroups = getFilteredGroups(groups, activeGroupFilter);

  if (!filteredGroups.length) {
    dashboardGroups.innerHTML = `<p class="empty">${escapeHtml(msg("noGroupsForFilter"))}</p>`;
    return;
  }

  dashboardGroups.innerHTML = filteredGroups
    .map((group, index) => renderGroupCard(group, run, index))
    .join("");
}

function renderSavedWorkspaces(workspaces = []) {
  if (!Array.isArray(workspaces) || !workspaces.length) {
    dashboardWorkspaces.innerHTML = `<p class="empty">${escapeHtml(msg("noSavedWorkspaces"))}</p>`;
    return;
  }

  dashboardWorkspaces.innerHTML = workspaces
    .slice(0, 6)
    .map((workspace) => renderSavedWorkspaceRow(workspace))
    .join("");
}

function renderSavedWorkspaceRow(workspace) {
  const summary = workspace.summary || {};
  const savedAt = formatSavedWorkspaceDate(workspace.updatedAt || workspace.createdAt);
  const tabCount = Number(summary.tabCount ?? workspace.tabs?.length ?? 0);
  const groupCount = Number(summary.groupCount ?? workspace.groups?.length ?? 0);

  return `
    <article class="dashboard-workspace-row">
      <div>
        <strong>${escapeHtml(workspace.name || msg("savedWorkspace"))}</strong>
        <small>${escapeHtml(msg("workspaceSavedMeta", [tabCount, groupCount, savedAt]))}</small>
      </div>
      <span>${escapeHtml(msg("localSnapshot"))}</span>
      <button
        class="mini-button"
        type="button"
        data-workspace-action="delete"
        data-workspace-id="${escapeHtml(String(workspace.id || ""))}"
      >${escapeHtml(msg("delete"))}</button>
    </article>
  `;
}

function formatSavedWorkspaceDate(value) {
  if (!value) return msg("unknownTime");

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return msg("unknownTime");
  }
}

function renderDashboardError(errorText) {
  return `
    <article class="dashboard-error-card" data-dashboard-error-state="safe">
      <div>
        <h2>${escapeHtml(msg("dashboardErrorTitle"))}</h2>
        <p>${escapeHtml(errorText || msg("scanDidNotFinish"))}</p>
      </div>
      <div class="dashboard-error-note">
        <strong>${escapeHtml(msg("nothingChangedOnError"))}</strong>
        <small>${escapeHtml(msg("dashboardErrorNextStep"))}</small>
      </div>
    </article>
  `;
}

function getFilteredGroups(groups, filterName) {
  if (filterName === "ai") {
    return groups.filter((group) => isAIGroup(group));
  }

  if (filterName === "rules") {
    return groups.filter((group) => isRuleGroup(group));
  }

  return groups;
}

function renderGroupCard(group, run, index) {
  const tabs = getTabsForGroup(group, run);
  const colorClass = GROUP_COLOR_CLASS.get(group.color) || "g-0";
  const sourceClass = isRuleGroup(group) ? "rule" : group.reason?.includes("manual") ? "manual" : "";

  return `
    <article
      class="dashboard-group-card ${index === 0 ? "active" : ""}"
      data-group-id="${escapeHtml(String(group.id))}"
      data-window-id="${escapeHtml(String(group.windowId || ""))}"
    >
      <div class="dashboard-group-head">
        <span class="dashboard-dot ${escapeHtml(colorClass)}" aria-hidden="true"></span>
        <div class="dashboard-group-title-block">
          <label class="sr-only" for="group-title-${escapeHtml(String(group.id))}">${escapeHtml(msg("groupName"))}</label>
          <input
            id="group-title-${escapeHtml(String(group.id))}"
            class="dashboard-group-title-input"
            data-group-title
            type="text"
            value="${escapeHtml(group.name)}"
          />
          <div class="dashboard-group-meta-line">
            <span>${escapeHtml(msg("tabsCount", [group.tabCount ?? tabs.length]))}</span>
            <span>${escapeHtml(formatTopHosts(tabs))}</span>
          </div>
        </div>
        <details class="dashboard-group-edit">
          <summary>${escapeHtml(msg("editGroup"))}</summary>
          <div class="dashboard-group-actions">
            <span class="dashboard-source-tag ${escapeHtml(sourceClass)}">${escapeHtml(formatGroupSource(group))}</span>
            <select class="dashboard-color-select" data-group-color aria-label="${escapeHtml(msg("groupColor"))}">
              ${GROUP_COLORS.map(
                (color) => `<option value="${color}" ${color === group.color ? "selected" : ""}>${color}</option>`
              ).join("")}
            </select>
            <button class="dashboard-apply-button" type="button" data-group-action="apply">${escapeHtml(msg("apply"))}</button>
          </div>
        </details>
      </div>
      <p class="dashboard-group-reason">${escapeHtml(group.reason || msg("builtInRule"))}</p>
      <div class="dashboard-group-body">
        ${renderGroupTabs(tabs, group)}
      </div>
    </article>
  `;
}

function getTabsForGroup(group, run) {
  const tabs = run?.snapshot?.tabs || [];
  const groupTabIds = Array.isArray(group.tabIds) ? new Set(group.tabIds) : null;

  if (groupTabIds?.size) {
    return tabs.filter((tab) => groupTabIds.has(tab.id));
  }

  return tabs.filter((tab) => tab.groupId === group.id);
}

function renderGroupTabs(tabs, group) {
  if (!tabs.length) {
    return `
      <div class="dashboard-more-row">
        <span>${escapeHtml(msg("groupTabsPending"))}</span>
      </div>
    `;
  }

  const visibleTabs = tabs.slice(0, 3);
  const hiddenTabs = tabs.slice(visibleTabs.length);
  const hiddenCount = hiddenTabs.length;
  const rows = visibleTabs.map((tab) => renderGroupTabRow(tab, group)).join("");
  const moreRow = hiddenCount
    ? `
      <details class="dashboard-more-tabs">
        <summary class="dashboard-more-row">
          <span>${escapeHtml(msg("moreTabs", [hiddenCount]))}</span>
          <span>${escapeHtml(group.windowId ? msg("windowLabel", [group.windowId]) : msg("currentWorkspace"))}</span>
        </summary>
        <div class="dashboard-hidden-tabs">
          ${hiddenTabs.map((tab) => renderGroupTabRow(tab, group)).join("")}
        </div>
      </details>
    `
    : `
      <div class="dashboard-more-row compact">
        <span>${escapeHtml(msg("noMoreTabs"))}</span>
      </div>
    `;

  return `${rows}${moreRow}`;
}

function renderGroupTabRow(tab, currentGroup) {
  const moveTargets = getDashboardTabMoveTargets(currentGroup, tab);
  const canDrag = moveTargets.length > 0;
  const classes = [
    "dashboard-tabrow",
    tab.discarded ? "suspended" : "",
    tab.audible ? "audible" : "",
    canDrag ? "draggable" : ""
  ].filter(Boolean).join(" ");
  const badges = [
    tab.active ? msg("currentTab") : "",
    tab.pinned ? msg("pinned") : "",
    tab.audible ? msg("audible") : "",
    tab.discarded ? msg("discarded") : ""
  ].filter(Boolean);
  const title = tab.title || msg("untitled");

  return `
    <div
      class="${escapeHtml(classes)}"
      data-tab-id="${escapeHtml(String(tab.id))}"
      data-current-group-id="${escapeHtml(String(currentGroup.id))}"
      data-window-id="${escapeHtml(String(tab.windowId || currentGroup.windowId || ""))}"
      data-tab-draggable="${canDrag ? "true" : "false"}"
      draggable="${canDrag ? "true" : "false"}"
      title="${canDrag ? escapeHtml(msg("dragTabToGroup")) : ""}"
    >
      ${renderTabFavicon(tab)}
      <span class="dashboard-tab-title" title="${escapeHtml(tab.hostname || "")}">
        <button
          class="dashboard-tab-title-button"
          type="button"
          data-group-action="focus-tab"
          title="${escapeHtml(msg("openTab"))}: ${escapeHtml(title)}"
          aria-label="${escapeHtml(msg("openTab"))}: ${escapeHtml(title)}"
        >
          ${escapeHtml(title)}
        </button>
      </span>
      <span class="dashboard-tab-host">${escapeHtml(tab.hostname || tab.path || "")}</span>
      <span class="dashboard-tab-badges">
        ${badges.map((badge) => `<span class="dashboard-tab-badge">${escapeHtml(badge)}</span>`).join("")}
      </span>
      ${renderTabMoveControl(tab, currentGroup)}
    </div>
  `;
}

function renderTabMoveControl(tab, currentGroup) {
  const options = getDashboardTabMoveTargets(currentGroup, tab);

  if (!options.length) {
    return "";
  }

  return `
    <details class="dashboard-tab-move">
      <summary>${escapeHtml(msg("move"))}</summary>
      <span>
        <select data-tab-target-group aria-label="${escapeHtml(msg("moveToGroup"))}">
          ${options
            .map((group) => `<option value="${escapeHtml(String(group.id))}">${escapeHtml(group.name)}</option>`)
            .join("")}
        </select>
        <button class="mini-button" type="button" data-group-action="move-tab">${escapeHtml(msg("move"))}</button>
      </span>
    </details>
  `;
}

function getDashboardTabMoveTargets(currentGroup, tab = {}) {
  if (tab.pinned) return [];

  const groups = latestRun?.groups || [];
  return groups.filter(
    (group) =>
      group.id !== currentGroup.id &&
      Number(group.windowId) === Number(currentGroup.windowId) &&
      Array.isArray(group.tabIds) &&
      group.tabIds.length > 0
  );
}

function renderTabFavicon(tab) {
  const faviconUrl = normalizeFaviconUrl(tab.favIconUrl);

  if (!faviconUrl) {
    return `<span class="dashboard-favicon fallback" aria-hidden="true">${escapeHtml(getFaviconLetter(tab))}</span>`;
  }

  return `
    <span class="dashboard-favicon has-image" aria-hidden="true">
      <img src="${escapeHtml(faviconUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer" />
    </span>
  `;
}

function normalizeFaviconUrl(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  if (rawValue.startsWith("data:image/")) {
    return rawValue;
  }

  try {
    const url = new URL(rawValue);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }

    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function getFaviconLetter(tab) {
  const source = tab.hostname || tab.title || "t";
  return source.replace(/^www\./, "").charAt(0).toLowerCase() || "t";
}

function formatTopHosts(tabs) {
  const hosts = [...new Set(tabs.map((tab) => tab.hostname).filter(Boolean))].slice(0, 2);
  return hosts.length ? hosts.join(" · ") : msg("noHostDataYet");
}

function formatGroupSource(group) {
  if (isRuleGroup(group)) return msg("rules");
  if (isAIGroup(group)) return msg("aiStatus");
  if (String(group.reason || "").toLowerCase().includes("manual")) return msg("manual");
  return msg("localRules");
}

function isAIGroup(group) {
  return String(group.reason || "").toLowerCase().includes("ai");
}

function isRuleGroup(group) {
  return String(group.reason || "").toLowerCase().includes("user rule");
}

function renderDuplicates(duplicates) {
  if (!duplicates.length) {
    dashboardDuplicates.innerHTML = `<p class="empty">${escapeHtml(msg("noDuplicateCandidatesLatest"))}</p>`;
    return;
  }

  const tabById = new Map((latestRun?.snapshot?.tabs || []).map((tab) => [tab.id, tab]));
  dashboardDuplicates.innerHTML = duplicates
    .map((duplicate) => {
      const status = duplicate.reviewStatus || duplicate.action;
      const tabs = (duplicate.tabIds || []).map((tabId) => tabById.get(tabId)).filter(Boolean);
      const tabRows = tabs.length
        ? tabs.map(renderDuplicateTabRow).join("")
        : `<p class="empty">${escapeHtml(msg("groupTabsPending"))}</p>`;

      return `
        <details class="dashboard-duplicate-group">
          <summary class="row">
            <span>${escapeHtml(duplicate.label)} · ${escapeHtml(duplicate.type)} · ${escapeHtml(status)}</span>
            <strong>${escapeHtml(String(duplicate.tabCount))}</strong>
          </summary>
          <div class="dashboard-duplicate-tabs">
            ${tabRows}
          </div>
        </details>
      `;
    })
    .join("");
}

function renderDuplicateTabRow(tab) {
  const title = tab.title || msg("untitled");
  const meta = [tab.hostname, tab.path].filter(Boolean).join(" · ");

  return `
    <div class="dashboard-duplicate-tab" data-tab-id="${escapeHtml(String(tab.id))}">
      ${renderTabFavicon(tab)}
      <span>
        <b>${escapeHtml(title)}</b>
        <small>${escapeHtml(meta || msg("noHostDataYet"))}</small>
      </span>
      <button
        class="mini-button"
        type="button"
        data-group-action="focus-tab"
        aria-label="${escapeHtml(msg("openTab"))}: ${escapeHtml(title)}"
      >
        ${escapeHtml(msg("openTab"))}
      </button>
    </div>
  `;
}

function renderRules(rules) {
  if (!rules.length) {
    dashboardRules.innerHTML = `<p class="empty">${escapeHtml(msg("noLocalRulesYet"))}</p>`;
    return;
  }

  dashboardRules.innerHTML = rules
    .map(
      (rule) => `
        <div class="rule-row">
          <div class="rule-icon" aria-hidden="true">${escapeHtml(rule.enabled === false ? "pause" : "rule")}</div>
          <span>
            <b>${escapeHtml(rule.pattern)} → ${escapeHtml(rule.targetGroupName || msg("misc"))}</b>
            <small>${escapeHtml(rule.type)} · ${escapeHtml(rule.createdFrom || msg("manual"))} · ${escapeHtml(msg("hits", [rule.hitCount || 0]))}</small>
          </span>
          <div class="rule-actions">
            <button
              class="dashboard-toggle ${rule.enabled === false ? "" : "on"}"
              type="button"
              data-rule-action="toggle"
              data-rule-id="${escapeHtml(rule.id)}"
              aria-label="${escapeHtml(rule.enabled === false ? msg("enable") : msg("disable"))}"
            >
              <span></span>
            </button>
            <button class="mini-button" type="button" data-rule-action="delete" data-rule-id="${escapeHtml(rule.id)}">
              ${escapeHtml(msg("delete"))}
            </button>
          </div>
        </div>
      `
    )
    .join("");
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
