import { applyI18n, initI18n, msg } from "./i18n.js";
import { buildDiagnosticSnapshot, buildFeedbackTemplate } from "./diagnostics.js";
import {
  AI_PROVIDER_HOST_IDS,
  AI_PROVIDER_PRESETS,
  DEFAULT_AI_HOSTNAME,
  DEFAULT_AI_PROVIDER_ORIGIN,
  DEFAULT_AI_SETTINGS
} from "./provider_registry.js";

const CURRENT_RUN_KEY = "tabmosaic.currentRun";
const AI_SETTINGS_KEY = "tabmosaic.aiSettings";
const SEARCH_SETTINGS_KEY = "tabmosaic.searchSettings";
const SEARCH_DIAGNOSTICS_KEY = "tabmosaic.searchDiagnostics";
const USER_RULES_KEY = "tabmosaic.userRules";
const ERROR_LOG_KEY = "tabmosaic.errorLog";
const DUPLICATE_SAFETY_AUDIT_KEY = "tabmosaic.duplicateSafetyAudit";
const SAVED_WORKSPACES_KEY = "tabmosaic.savedWorkspaces";
const SIDEBAR_CONTEXT_KEY = "tabmosaic.sidebarContext";
const SIDEBAR_PENDING_PROMPT_KEY = "tabmosaic.sidebarPendingPrompt";
const AGENT_TASKS_KEY = "tabmosaic.agentTasks";
const SAVED_COLLECTIONS_KEY = "tabmosaic.savedCollections";
const SAVED_MEMOS_KEY = "tabmosaic.savedMemos";
const TAB_WORK_STATES_KEY = "tabmosaic.tabWorkStates";
const WORKSPACE_GOAL_KEY = "tabmosaic.workspaceGoal";
const GROUP_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan"];
const GROUP_COLOR_CLASS = new Map(GROUP_COLORS.map((color, index) => [color, `g-${index}`]));
const GROUP_FILTERS = new Set(["all", "ai", "rules"]);
const TAB_WORK_STATES = new Set(["done", "later", "keep"]);
const DASHBOARD_SOURCE_STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "todo", "task", "review", "local", "only",
  "tab", "tabs", "source", "note", "notes", "check", "confirm", "prepare", "run"
]);
const DASHBOARD_ACTION_VERB_RE = /^(audit|check|collect|compare|confirm|create|decide|draft|extract|follow up|prepare|review|resolve|run|save|ship|summarize|test|validate|verify|write)\b/i;
const DASHBOARD_ACTION_SIGNAL_RE = /\b(assumption|assumptions|blocked|checklist|cost|gap|gates?|launch|missing|onboarding|packaging|permission|pricing|privacy|qa|risk|source of truth|store listing|tab overload|unresolved|user pain|validate|validation|watch out|workflow research)\b/i;
const MAX_CHECKLIST_SUGGESTIONS_PER_RUN = 4;
const MAX_AGENT_ITEMS = 30;

const refreshButton = document.querySelector("#refreshButton");
const workspaceRefreshButton = document.querySelector("#workspaceRefreshButton");
const saveWorkspaceButton = document.querySelector("#saveWorkspaceButton");
const chatSelectedTabsButton = document.querySelector("#chatSelectedTabsButton");
const refineSelectedTabsButton = document.querySelector("#refineSelectedTabsButton");
const organizeNowButton = document.querySelector("#organizeNowButton");
const dashboardUndoButton = document.querySelector("#dashboardUndoButton");
const dashboardRestoreButton = document.querySelector("#dashboardRestoreButton");
const workspaceActionStatus = document.querySelector("#workspaceActionStatus");
const createTodoFromSelectionButton = document.querySelector("#createTodoFromSelectionButton");
const saveSelectionCollectionButton = document.querySelector("#saveSelectionCollectionButton");
const dashboardAgentTasks = document.querySelector("#dashboardAgentTasks");
const dashboardAgentCollections = document.querySelector("#dashboardAgentCollections");
const dashboardContinue = document.querySelector("#dashboardContinue");
const memorySearchInput = document.querySelector("#memorySearchInput");
const dashboardMemoryItems = document.querySelector("#dashboardMemoryItems");
const dashboardMemorySummary = document.querySelector("#dashboardMemorySummary");
const rulesCountBadge = document.querySelector("#rulesCountBadge");
const rulesSubtitle = document.querySelector("#rulesSubtitle");
const allGroupsCount = document.querySelector("#allGroupsCount");
const aiGroupsCount = document.querySelector("#aiGroupsCount");
const ruleGroupsCount = document.querySelector("#ruleGroupsCount");
const dashboardGroupSummary = document.querySelector("#dashboardGroupSummary");
const dashboardGroups = document.querySelector("#dashboardGroups");
const dashboardDuplicates = document.querySelector("#dashboardDuplicates");
const dashboardWorkspaces = document.querySelector("#dashboardWorkspaces");
const dashboardRules = document.querySelector("#dashboardRules");
const dashboardRuleForm = document.querySelector("#dashboardRuleForm");
const dashboardRuleIdInput = document.querySelector("#dashboardRuleIdInput");
const dashboardRuleTypeInput = document.querySelector("#dashboardRuleTypeInput");
const dashboardRulePatternInput = document.querySelector("#dashboardRulePatternInput");
const dashboardRuleTargetInput = document.querySelector("#dashboardRuleTargetInput");
const dashboardRuleSubmitButton = document.querySelector("#dashboardRuleSubmitButton");
const dashboardRuleResetButton = document.querySelector("#dashboardRuleResetButton");
const dashboardRuleFormStatus = document.querySelector("#dashboardRuleFormStatus");
const settingsSnapshot = document.querySelector("#settingsSnapshot");
const aiSettingsForm = document.querySelector("#aiSettingsForm");
const aiEnabledInput = document.querySelector("#aiEnabledInput");
const aiProviderPresetSelect = document.querySelector("#aiProviderPresetSelect");
const aiBaseUrlInput = document.querySelector("#aiBaseUrlInput");
const aiModelInput = document.querySelector("#aiModelInput");
const aiModelOptions = document.querySelector("#aiModelOptions");
const aiKeyInput = document.querySelector("#aiKeyInput");
const localModelHelp = document.querySelector("#localModelHelp");
const aiSettingsStatus = document.querySelector("#aiSettingsStatus");
const testAIButton = document.querySelector("#testAIButton");
const clearAIKeyButton = document.querySelector("#clearAIKeyButton");
const searchSettingsForm = document.querySelector("#searchSettingsForm");
const searchEnabledInput = document.querySelector("#searchEnabledInput");
const searchBaseUrlInput = document.querySelector("#searchBaseUrlInput");
const searchMaxResultsInput = document.querySelector("#searchMaxResultsInput");
const searchKeyInput = document.querySelector("#searchKeyInput");
const searchSettingsStatus = document.querySelector("#searchSettingsStatus");
const searchDiagnosticsPanel = document.querySelector("#searchDiagnosticsPanel");
const clearSearchKeyButton = document.querySelector("#clearSearchKeyButton");
const copyDiagnosticsButton = document.querySelector("#copyDiagnosticsButton");
const copyFeedbackButton = document.querySelector("#copyFeedbackButton");
const diagnosticsStatus = document.querySelector("#diagnosticsStatus");
const clearDataButton = document.querySelector("#clearDataButton");
const clearDataStatus = document.querySelector("#clearDataStatus");
let latestRun = null;
let activeGroupFilter = "all";
let latestAgentTasks = [];
let latestSavedCollections = [];
let latestSavedMemos = [];
let latestSavedWorkspaces = [];
let latestWorkspaceGoal = null;
let latestTabWorkStates = {};
let draggedDashboardTab = null;
let selectedDashboardTabIds = new Set();
let selectionNoticeTimer = null;
let dashboardMemoryQuery = "";

await initI18n();
applyI18n();

refreshButton.addEventListener("click", loadDashboard);
workspaceRefreshButton.addEventListener("click", loadDashboard);
organizeNowButton.addEventListener("click", organizeFromDashboard);
saveWorkspaceButton.addEventListener("click", saveWorkspaceFromDashboard);
chatSelectedTabsButton.addEventListener("click", chatWithSelectedDashboardTabs);
refineSelectedTabsButton?.addEventListener("click", refineSelectedDashboardTabsWithAI);
dashboardUndoButton.addEventListener("click", undoFromDashboard);
dashboardRestoreButton.addEventListener("click", restoreClosedFromDashboard);
aiSettingsForm.addEventListener("submit", saveAISettings);
aiProviderPresetSelect?.addEventListener("change", applyAIProviderPreset);
aiBaseUrlInput.addEventListener("change", () => syncAIProviderPresetSelect(aiBaseUrlInput.value));
testAIButton.addEventListener("click", testAIConnection);
clearAIKeyButton.addEventListener("click", clearAIKey);
searchSettingsForm?.addEventListener("submit", saveSearchSettings);
clearSearchKeyButton?.addEventListener("click", clearSearchKey);
createTodoFromSelectionButton?.addEventListener("click", createTodoFromSelectedTabs);
saveSelectionCollectionButton?.addEventListener("click", saveSelectedTabsAsCollection);
dashboardAgentTasks?.addEventListener("click", handleBrowserWorkAction);
dashboardAgentTasks?.addEventListener("change", handleBrowserWorkChecklistNoteChange);
dashboardAgentCollections?.addEventListener("click", handleBrowserWorkAction);
dashboardContinue?.addEventListener("click", handleDashboardContinueAction);
memorySearchInput?.addEventListener("input", () => {
  dashboardMemoryQuery = memorySearchInput.value.trim();
  renderDashboardMemory();
});
dashboardMemoryItems?.addEventListener("click", handleMemoryAction);
dashboardRules.addEventListener("click", handleRuleAction);
dashboardRuleForm?.addEventListener("submit", saveDashboardRuleFromForm);
dashboardRuleResetButton?.addEventListener("click", resetDashboardRuleForm);
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
window.addEventListener("hashchange", () => setActiveDashboardPage(getDashboardPageFromLocation()));

setActiveDashboardPage(getDashboardPageFromLocation());
loadDashboard();
loadAISettings();
loadSearchSettings();

async function loadDashboard() {
  const result = await chrome.storage.local.get([
    CURRENT_RUN_KEY,
    USER_RULES_KEY,
    SAVED_WORKSPACES_KEY,
    AGENT_TASKS_KEY,
    SAVED_COLLECTIONS_KEY,
    SAVED_MEMOS_KEY,
    TAB_WORK_STATES_KEY,
    WORKSPACE_GOAL_KEY
  ]);
  renderDashboard(
    result[CURRENT_RUN_KEY],
    result[USER_RULES_KEY] || [],
    result[SAVED_WORKSPACES_KEY] || [],
    result[AGENT_TASKS_KEY] || [],
    result[SAVED_COLLECTIONS_KEY] || [],
    result[TAB_WORK_STATES_KEY] || {},
    result[WORKSPACE_GOAL_KEY] || null,
    result[SAVED_MEMOS_KEY] || []
  );
}

function renderDashboard(
  run,
  rules = [],
  workspaces = [],
  tasks = latestAgentTasks,
  collections = latestSavedCollections,
  tabWorkStates = latestTabWorkStates,
  workspaceGoal = latestWorkspaceGoal,
  memos = latestSavedMemos
) {
  latestRun = run || null;
  latestAgentTasks = Array.isArray(tasks) ? tasks : [];
  latestSavedCollections = Array.isArray(collections) ? collections : [];
  latestSavedMemos = normalizeSavedMemos(memos);
  latestSavedWorkspaces = Array.isArray(workspaces) ? workspaces : [];
  latestWorkspaceGoal = normalizeWorkspaceGoal(workspaceGoal);
  latestTabWorkStates = normalizeTabWorkStates(tabWorkStates);
  renderRules(rules);
  renderSavedWorkspaces(workspaces);
  renderDashboardWorkbench();
  renderDashboardContinue();
  syncGroupFilterButtons();
  syncDashboardActionButtons(run);
  renderRuleCount(rules);

  if (run?.status === "error") {
    selectedDashboardTabIds.clear();
    dashboardGroups.innerHTML = renderDashboardError(run.error || msg("scanDidNotFinish"));
    dashboardDuplicates.innerHTML = `<p class="empty">${escapeHtml(msg("noDuplicateDataYet"))}</p>`;
    renderSettingsSnapshot({});
    renderGroupFilterCounts([]);
    syncDashboardSelectedTabsButton();
    return;
  }

  if (!run || !["completed", "closed-restored", "undone"].includes(run.status)) {
    selectedDashboardTabIds.clear();
    dashboardGroups.innerHTML = `<p class="empty">${escapeHtml(msg("openSidePanelToPopulateDashboard"))}</p>`;
    dashboardDuplicates.innerHTML = `<p class="empty">${escapeHtml(msg("noDuplicateDataYet"))}</p>`;
    renderSettingsSnapshot({});
    renderGroupFilterCounts([]);
    syncDashboardSelectedTabsButton();
    return;
  }

  renderGroupFilterCounts(run.groups || []);
  renderGroups(run.groups || [], run);
  renderDuplicates(run.duplicateGroups || []);
  renderSettingsSnapshot(run.summary || {});
}

function setActiveDashboardPage(pageName) {
  const nextPage = ["workspace", "memory", "rules", "settings"].includes(pageName) ? pageName : "workspace";
  document.querySelectorAll(".dashboard-nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === nextPage);
  });
  document.querySelectorAll(".dashboard-page").forEach((page) => {
    page.classList.toggle("active", page.dataset.page === nextPage);
  });
}

function getDashboardPageFromLocation() {
  const value = String(window.location.hash || "").replace(/^#/, "").trim();
  return ["workspace", "memory", "rules", "settings"].includes(value) ? value : "workspace";
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
  dashboardUndoButton.hidden = !summary.undoAvailable;
  dashboardRestoreButton.disabled = !summary.closedTabsRestoreAvailable;
  dashboardRestoreButton.hidden = !summary.closedTabsRestoreAvailable;
  syncDashboardSelectedTabsButton();
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
    renderDashboard(
      response.run,
      await loadRules(),
      await loadSavedWorkspaces(),
      latestAgentTasks,
      latestSavedCollections,
      latestTabWorkStates
    );
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

    renderDashboard(
      response.run,
      await loadRules(),
      await loadSavedWorkspaces(),
      latestAgentTasks,
      latestSavedCollections,
      latestTabWorkStates
    );
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

    renderDashboard(
      response.run,
      await loadRules(),
      await loadSavedWorkspaces(),
      latestAgentTasks,
      latestSavedCollections,
      latestTabWorkStates
    );
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
  setDashboardActionStatus("");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_CURRENT_WORKSPACE",
      source: "dashboard"
    });

    if (!response?.ok) {
      setDashboardActionStatus(response?.error || msg("couldNotSaveWorkspace"));
      return;
    }

    renderSavedWorkspaces(response.result?.workspaces || []);
    setDashboardActionStatus(msg("workspaceSaved"));
  } catch (error) {
    setDashboardActionStatus(`${msg("couldNotSaveWorkspace")} ${error?.message || ""}`.trim());
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

  if (button.dataset.ruleAction === "edit") {
    const rule = rules.find((item) => item.id === ruleId);
    if (rule) populateDashboardRuleForm(rule);
    return;
  }

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

async function saveDashboardRuleFromForm(event) {
  event.preventDefault();
  const rule = buildDashboardRuleFromForm();

  if (!rule.ok) {
    setDashboardRuleFormStatus(rule.error || msg("ruleCouldNotSave"), true);
    return;
  }

  const result = await chrome.storage.local.get(USER_RULES_KEY);
  const rules = Array.isArray(result[USER_RULES_KEY]) ? result[USER_RULES_KEY] : [];
  const now = new Date().toISOString();
  const existingId = dashboardRuleIdInput?.value || "";
  const existingRule = existingId ? rules.find((item) => item.id === existingId) : null;

  if (existingRule?.type === "protected") {
    setDashboardRuleFormStatus(msg("protectedRuleEditBlocked"), true);
    return;
  }

  const nextRule = {
    ...rule.value,
    id: existingId || `rule-${Date.now()}`,
    enabled: existingRule ? existingRule.enabled !== false : true,
    createdFrom: existingId ? "dashboard-edit" : "dashboard",
    createdAt: existingId
      ? existingRule?.createdAt || now
      : now,
    updatedAt: now,
    hitCount: existingId ? Number(existingRule?.hitCount || 0) : 0
  };
  const nextRules = existingId
    ? rules.map((item) => item.id === existingId ? { ...item, ...nextRule } : item)
    : [nextRule, ...rules];

  await chrome.storage.local.set({ [USER_RULES_KEY]: nextRules });
  resetDashboardRuleForm();
  setDashboardRuleFormStatus(msg(existingId ? "ruleUpdated" : "ruleSaved"), false);
  await loadDashboard();
}

function buildDashboardRuleFromForm() {
  const type = normalizeDashboardRuleType(dashboardRuleTypeInput?.value);
  const pattern = cleanDashboardRulePattern(dashboardRulePatternInput?.value);
  const targetGroupName = cleanDashboardRuleGroupName(dashboardRuleTargetInput?.value);

  if (!type) return { ok: false, error: msg("ruleTypeUnsupported") };
  if (!pattern) return { ok: false, error: msg("rulePatternRequired") };
  if (!targetGroupName) return { ok: false, error: msg("ruleTargetRequired") };

  return {
    ok: true,
    value: {
      type,
      pattern,
      targetGroupName,
      priority: 100
    }
  };
}

function normalizeDashboardRuleType(value) {
  const type = String(value || "");
  return ["domain", "url_pattern"].includes(type) ? type : "";
}

function cleanDashboardRulePattern(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/[?#].*$/, "")
    .slice(0, 180);
}

function cleanDashboardRuleGroupName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function populateDashboardRuleForm(rule) {
  if (!dashboardRuleForm || rule?.type === "protected") return;
  dashboardRuleIdInput.value = rule.id || "";
  dashboardRuleTypeInput.value = normalizeDashboardRuleType(rule.type) || "domain";
  dashboardRulePatternInput.value = rule.pattern || "";
  dashboardRuleTargetInput.value = rule.targetGroupName || "";
  dashboardRuleSubmitButton.textContent = msg("updateRule");
  setDashboardRuleFormStatus(msg("editingRule"), false);
  dashboardRulePatternInput.focus();
}

function resetDashboardRuleForm() {
  if (!dashboardRuleForm) return;
  dashboardRuleForm.reset();
  dashboardRuleIdInput.value = "";
  dashboardRuleTypeInput.value = "domain";
  dashboardRulePatternInput.value = "";
  dashboardRuleTargetInput.value = "";
  dashboardRuleSubmitButton.textContent = msg("saveRule");
  setDashboardRuleFormStatus("", false);
}

function setDashboardRuleFormStatus(text, isError = false) {
  if (!dashboardRuleFormStatus) return;
  dashboardRuleFormStatus.textContent = text || "";
  dashboardRuleFormStatus.classList.toggle("error", Boolean(isError));
}

async function handleSavedWorkspaceAction(event) {
  const button = event.target.closest("[data-workspace-action]");
  if (!button) return;

  if (button.dataset.workspaceAction === "restore") {
    await restoreSavedWorkspaceFromDashboard(button);
    return;
  }

  if (button.dataset.workspaceAction === "delete") {
    await deleteSavedWorkspaceFromDashboard(button);
  }
}

async function restoreSavedWorkspaceFromDashboard(button) {
  const workspaceId = button.dataset.workspaceId || "";

  if (!workspaceId) return;

  const confirmed = window.confirm(msg("restoreWorkspaceConfirm"));
  if (!confirmed) return;

  button.disabled = true;
  button.textContent = msg("restoring");
  setDashboardActionStatus("");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "RESTORE_SAVED_WORKSPACE",
      workspaceId
    });

    if (!response?.ok) {
      setDashboardActionStatus(response?.error || msg("couldNotRestoreWorkspace"));
      return;
    }

    const result = response.result || {};
    renderDashboard(
      result.run,
      await loadRules(),
      result.workspaces || await loadSavedWorkspaces(),
      latestAgentTasks,
      latestSavedCollections,
      latestTabWorkStates
    );
    setDashboardActionStatus(msg("workspaceRestoredMeta", [
      Number(result.restoredTabs || 0),
      Number(result.restoredGroups || 0),
      Number(result.skippedTabs || 0)
    ]));
  } catch (error) {
    setDashboardActionStatus(`${msg("couldNotRestoreWorkspace")} ${error?.message || ""}`.trim());
  } finally {
    button.disabled = false;
    button.textContent = msg("restoreWorkspace");
  }
}

async function deleteSavedWorkspaceFromDashboard(button) {
  const workspaceId = button.dataset.workspaceId || "";

  if (!workspaceId) return;

  const confirmed = window.confirm(msg("deleteWorkspaceConfirm"));
  if (!confirmed) return;

  button.disabled = true;
  button.textContent = msg("deleting");
  setDashboardActionStatus("");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "DELETE_SAVED_WORKSPACE",
      workspaceId
    });

    if (!response?.ok) {
      setDashboardActionStatus(response?.error || msg("couldNotDeleteWorkspace"));
      return;
    }

    renderSavedWorkspaces(response.result?.workspaces || []);
    setDashboardActionStatus(msg("workspaceDeleted"));
  } catch (error) {
    setDashboardActionStatus(`${msg("couldNotDeleteWorkspace")} ${error?.message || ""}`.trim());
  } finally {
    button.disabled = false;
    button.textContent = msg("delete");
  }
}

async function handleGroupAction(event) {
  const tabSelect = event.target.closest("[data-tab-select]");

  if (tabSelect) {
    handleDashboardTabSelect(tabSelect);
    return;
  }

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

  if (button.dataset.groupAction === "set-tab-work-state") {
    await handleDashboardTabWorkState(button);
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

async function handleDashboardTabWorkState(button) {
  const row = button.closest("[data-tab-id]");
  const tab = findDashboardTab(Number(row?.dataset?.tabId));
  const state = String(button.dataset.tabWorkState || "");

  if (!tab || !row) return;

  await setDashboardTabWorkState(tab, state);
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

function buildSidebarSelectedTabsContext(tabs = getSelectedDashboardTabs()) {
  const tabIds = tabs.map((tab) => Number(tab.id)).filter(Number.isInteger);
  const windowId = toOptionalInteger(tabs[0]?.windowId);
  const hostnames = Array.from(new Set(tabs.map((tab) => tab.hostname).filter(Boolean))).slice(0, 3);

  return {
    scope: "selected_tabs",
    windowId,
    title: msg("selectedTabsContextTitle", [tabIds.length]),
    hostname: hostnames.join(", "),
    tabCount: tabIds.length,
    tabIds,
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
    scope: ["current_tab", "current_group", "selected_tabs"].includes(context.scope) ? context.scope : "current_tab",
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

function handleDashboardTabSelect(control) {
  const row = control.closest("[data-tab-id]");
  const tabId = Number(row?.dataset?.tabId);
  const tab = findDashboardTab(tabId);

  if (!tab || !Number.isInteger(tabId)) {
    syncDashboardTabSelectionControls();
    return;
  }

  const checked = Boolean(control.checked);
  const selectedWindowId = getSelectedDashboardWindowId();
  const nextWindowId = toOptionalInteger(tab.windowId || row?.dataset?.windowId);

  if (checked && Number.isInteger(selectedWindowId) && Number.isInteger(nextWindowId) && selectedWindowId !== nextWindowId) {
    selectedDashboardTabIds.clear();
    showDashboardSelectionNotice(msg("selectedTabsWindowReset"));
  }

  if (checked) {
    selectedDashboardTabIds.add(tabId);
  } else {
    selectedDashboardTabIds.delete(tabId);
  }

  syncDashboardTabSelectionControls();
}

async function chatWithSelectedDashboardTabs() {
  const tabs = getSelectedDashboardTabs();

  if (tabs.length < 2) {
    syncDashboardSelectedTabsButton();
    return;
  }

  const windowId = toOptionalInteger(tabs[0]?.windowId);
  const openSidebarPromise = openSidebarForDashboardContext(windowId);
  await setSidebarContextFromDashboard(buildSidebarSelectedTabsContext(tabs));
  await openSidebarPromise;
  markDashboardSelectedTabRows();
}

async function refineSelectedDashboardTabsWithAI() {
  const tabs = getSelectedDashboardTabs();

  if (tabs.length < 2) {
    syncDashboardSelectedTabsButton();
    return;
  }

  const windowId = toOptionalInteger(tabs[0]?.windowId);
  const openSidebarPromise = openSidebarForDashboardContext(windowId);
  await setSidebarContextFromDashboard(buildSidebarSelectedTabsContext(tabs));
  await setSidebarPendingPrompt({
    text: msg("refineSelectedTabsPrompt"),
    source: "dashboard-selected-tabs",
    createdAt: new Date().toISOString()
  });
  await openSidebarPromise;
  markDashboardSelectedTabRows();
}

async function setSidebarPendingPrompt(prompt) {
  await chrome.storage.local.set({
    [SIDEBAR_PENDING_PROMPT_KEY]: {
      text: String(prompt?.text || "").slice(0, 500),
      source: String(prompt?.source || "dashboard").slice(0, 80),
      createdAt: String(prompt?.createdAt || new Date().toISOString()).slice(0, 40)
    }
  });
}

function getSelectedDashboardTabs() {
  const tabsById = new Map(
    (latestRun?.snapshot?.tabs || [])
      .map((tab) => [Number(tab.id), tab])
      .filter(([tabId]) => Number.isInteger(tabId))
  );

  return Array.from(selectedDashboardTabIds)
    .map((tabId) => tabsById.get(tabId))
    .filter(Boolean);
}

function getSelectedDashboardWindowId() {
  const tab = getSelectedDashboardTabs()[0];
  return toOptionalInteger(tab?.windowId);
}

function syncDashboardTabSelectionControls() {
  const renderedTabIds = Array.from(dashboardGroups.querySelectorAll("[data-tab-id]"))
    .map((row) => Number(row.dataset.tabId))
    .filter(Number.isInteger);
  const fallbackTabIds = (latestRun?.snapshot?.tabs || [])
    .map((tab) => Number(tab.id))
    .filter(Number.isInteger);
  const validTabIds = new Set(
    renderedTabIds.length ? renderedTabIds : fallbackTabIds
  );
  selectedDashboardTabIds = new Set(
    Array.from(selectedDashboardTabIds)
      .map((tabId) => Number(tabId))
      .filter((tabId) => validTabIds.has(tabId))
  );

  dashboardGroups.querySelectorAll("[data-tab-id]").forEach((row) => {
    const tabId = Number(row.dataset.tabId);
    const checked = selectedDashboardTabIds.has(tabId);
    row.classList.toggle("selected-for-chat", checked);
    row.querySelectorAll("[data-tab-select]").forEach((control) => {
      control.checked = checked;
      control.setAttribute("aria-checked", String(checked));
    });
  });

  syncDashboardSelectedTabsButton();
}

function syncDashboardSelectedTabsButton() {
  const count = getSelectedDashboardTabs().length;
  chatSelectedTabsButton.hidden = count < 2;
  chatSelectedTabsButton.disabled = count < 2;
  chatSelectedTabsButton.textContent = count ? msg("chatSelectedTabs", [count]) : msg("chatSelectedTabsZero");
  chatSelectedTabsButton.setAttribute("aria-label", msg("chatSelectedTabs", [Math.max(count, 0)]));
  if (refineSelectedTabsButton) {
    refineSelectedTabsButton.hidden = count < 2;
    refineSelectedTabsButton.disabled = count < 2;
    refineSelectedTabsButton.textContent = count ? msg("refineSelectedTabs", [count]) : msg("refineSelectedTabsZero");
    refineSelectedTabsButton.setAttribute("aria-label", msg("refineSelectedTabs", [Math.max(count, 0)]));
  }
  syncDashboardWorkbenchSelectionButtons(count);
}

function syncDashboardWorkbenchSelectionButtons(count = getSelectedDashboardTabs().length) {
  if (createTodoFromSelectionButton) {
    createTodoFromSelectionButton.disabled = count < 1;
    createTodoFromSelectionButton.textContent = count ? msg("createTodoFromSelection", [count]) : msg("createTodo");
  }

  if (saveSelectionCollectionButton) {
    saveSelectionCollectionButton.disabled = count < 1;
    saveSelectionCollectionButton.textContent = count ? msg("saveSelectionCount", [count]) : msg("saveSelection");
  }
}

function setDashboardActionStatus(text = "") {
  if (!workspaceActionStatus) return;

  clearTimeout(selectionNoticeTimer);
  workspaceActionStatus.textContent = text;
  if (text) {
    workspaceActionStatus.dataset.statusScope = "action";
  } else {
    delete workspaceActionStatus.dataset.statusScope;
  }
}

function showDashboardSelectionNotice(text) {
  if (!workspaceActionStatus) return;

  clearTimeout(selectionNoticeTimer);
  workspaceActionStatus.textContent = text;
  workspaceActionStatus.dataset.statusScope = "selection";
  selectionNoticeTimer = setTimeout(() => {
    if (workspaceActionStatus.dataset.statusScope === "selection") {
      workspaceActionStatus.textContent = "";
      delete workspaceActionStatus.dataset.statusScope;
    }
  }, 4200);
}

function markDashboardSelectedTabRows() {
  dashboardGroups.querySelectorAll(".dashboard-tabrow.context-active").forEach((element) => {
    element.classList.remove("context-active");
  });
  selectedDashboardTabIds.forEach((tabId) => {
    dashboardGroups.querySelectorAll("[data-tab-id]").forEach((row) => {
      if (Number(row.dataset.tabId) === Number(tabId)) {
        row.classList.add("context-active");
      }
    });
  });
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
  updateAIModelOptions([], aiModelInput.value);
  syncAIProviderPresetSelect(settings.baseUrl);
  aiKeyInput.value = "";
  aiKeyInput.placeholder = settings.apiKey
    ? msg("apiKeySavedPlaceholder")
    : msg("apiKeyStoredPlaceholder");
  aiSettingsStatus.textContent = canUseAISettings(settings)
    ? msg("aiClassificationEnabled")
    : msg("localRulesActiveUntilKey");
}

function applyAIProviderPreset() {
  const preset = AI_PROVIDER_PRESETS.get(aiProviderPresetSelect?.value || "");
  syncLocalModelHelp(aiProviderPresetSelect?.value || "custom");
  if (!preset) return;

  aiBaseUrlInput.value = preset.baseUrl;
  aiModelInput.value = preset.model;
  updateAIModelOptions([], preset.model);
  aiSettingsStatus.textContent = msg("providerPresetApplied", [preset.label]);
}

function syncAIProviderPresetSelect(baseUrl) {
  if (!aiProviderPresetSelect) return;

  const normalized = safeNormalizeBaseUrl(baseUrl || DEFAULT_AI_SETTINGS.baseUrl);
  const matched = normalized
    ? Array.from(AI_PROVIDER_PRESETS.entries()).find(([, preset]) => normalizeBaseUrl(preset.baseUrl) === normalized)
    : null;
  aiProviderPresetSelect.value = matched?.[0] || "custom";
  syncLocalModelHelp(aiProviderPresetSelect.value);
}

function syncLocalModelHelp(presetId = "custom") {
  if (!localModelHelp) return;

  const help = buildLocalModelHelp(presetId);
  localModelHelp.hidden = !help;

  if (!help) {
    localModelHelp.innerHTML = "";
    return;
  }

  localModelHelp.innerHTML = `
    <strong>${escapeHtml(help.title)}</strong>
    <ol>
      ${help.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
    </ol>
    <small>${escapeHtml(help.note)}</small>
  `;
}

function buildLocalModelHelp(presetId) {
  if (presetId === "ollama") {
    return {
      title: msg("ollamaSetupTitle"),
      steps: [
        msg("ollamaSetupStepOne"),
        msg("ollamaSetupStepTwo"),
        msg("ollamaSetupStepThree")
      ],
      note: msg("localModelSetupNote")
    };
  }

  if (presetId === "lmstudio") {
    return {
      title: msg("lmStudioSetupTitle"),
      steps: [
        msg("lmStudioSetupStepOne"),
        msg("lmStudioSetupStepTwo"),
        msg("lmStudioSetupStepThree")
      ],
      note: msg("localModelSetupNote")
    };
  }

  return null;
}

async function saveAISettings(event) {
  event.preventDefault();

  try {
    const existing = await chrome.storage.local.get(AI_SETTINGS_KEY);
    const previous = {
      ...DEFAULT_AI_SETTINGS,
      ...(existing[AI_SETTINGS_KEY] || {})
    };
    const baseUrl = normalizeBaseUrl(aiBaseUrlInput.value);
    const apiKey = aiKeyInput.value.trim() || previous.apiKey;

    if (aiEnabledInput.checked && (apiKey || isLocalAIBaseUrl(baseUrl))) {
      await ensureAIProviderPermission(baseUrl);
    }

    const next = {
      ...previous,
      enabled: Boolean(aiEnabledInput.checked),
      provider: inferAIProviderId(baseUrl),
      baseUrl,
      model: aiModelInput.value.trim() || DEFAULT_AI_SETTINGS.model,
      apiKey
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
  let testedBaseUrl = "";

  try {
    const baseUrl = normalizeBaseUrl(aiBaseUrlInput.value);
    testedBaseUrl = baseUrl;
    await ensureAIProviderPermission(baseUrl);

    const response = await chrome.runtime.sendMessage({
      type: "TEST_AI_CONNECTION",
      baseUrl,
      model: aiModelInput.value.trim() || DEFAULT_AI_SETTINGS.model,
      apiKey: aiKeyInput.value.trim(),
      requestPermission: true
    });

    if (!response?.ok) {
      const troubleshooting = formatAIConnectionTroubleshooting(
        buildAIConnectionFailureTroubleshootingCodes(testedBaseUrl, response?.error || "")
      );
      aiSettingsStatus.textContent = [response?.error || msg("aiConnectionFailed"), troubleshooting].filter(Boolean).join(" ");
      return;
    }

    const result = response.result || {};
    updateAIModelOptions(result.modelSuggestions || [], result.model || aiModelInput.value);
    const connectionStatus = result.modelAvailable
      ? msg("aiConnectionOk", [result.model || DEFAULT_AI_SETTINGS.model])
      : msg("aiConnectionModelMissing", [result.model || DEFAULT_AI_SETTINGS.model]);
    const diagnostics = formatAIConnectionDiagnostics(result.diagnostics);
    const troubleshooting = formatAIConnectionTroubleshooting(result.diagnostics?.troubleshootingCodes || []);
    aiSettingsStatus.textContent = [connectionStatus, diagnostics, troubleshooting].filter(Boolean).join(" ");
  } catch (error) {
    const troubleshooting = formatAIConnectionTroubleshooting(
      buildAIConnectionFailureTroubleshootingCodes(testedBaseUrl || aiBaseUrlInput.value, error?.message || "")
    );
    aiSettingsStatus.textContent = [`${msg("aiConnectionFailed")} ${error?.message || ""}`.trim(), troubleshooting].filter(Boolean).join(" ");
  } finally {
    testAIButton.disabled = false;
    testAIButton.textContent = msg("testAIConnection");
  }
}

function formatAIConnectionDiagnostics(diagnostics = {}) {
  if (!diagnostics || typeof diagnostics !== "object") {
    return "";
  }

  const endpoint = diagnostics.endpoint === "synthetic-chat" ? "synthetic-chat" : "models";
  const endpointLabel = endpoint === "synthetic-chat" ? msg("aiConnectionCheckedSynthetic") : msg("aiConnectionCheckedModels");
  const endpointType = diagnostics.localEndpoint ? msg("localEndpoint") : msg("remoteEndpoint");
  const auth = diagnostics.authorizationSent ? msg("authorizationHeaderSent") : msg("authorizationHeaderNotSent");
  const suggestionCopy = endpoint === "synthetic-chat"
    ? msg("aiConnectionNoModelSuggestions")
    : msg("aiConnectionModelSuggestionCount", [diagnostics.modelSuggestionCount ?? 0]);

  return msg("aiConnectionDiagnostics", [
    diagnostics.providerLabel || diagnostics.provider || "OpenAI-compatible",
    endpointLabel,
    suggestionCopy,
    endpointType,
    auth
  ]);
}

function formatAIConnectionTroubleshooting(codes = []) {
  const items = (Array.isArray(codes) ? codes : [])
    .map((code) => {
      const key = AI_CONNECTION_TROUBLESHOOTING_MESSAGES[code];
      return key ? msg(key) : "";
    })
    .filter(Boolean)
    .slice(0, 3);

  if (!items.length) return "";

  return msg("aiConnectionNextSteps", [items.join("; ")]);
}

function buildAIConnectionFailureTroubleshootingCodes(baseUrl, errorMessage = "") {
  const normalized = safeNormalizeBaseUrl(baseUrl);
  const text = String(errorMessage || "").toLowerCase();

  if (normalized && isLocalAIBaseUrl(normalized)) {
    if (normalized.includes(":11434")) return ["start_ollama_load_model"];
    if (normalized.includes(":1234")) return ["start_lmstudio_server_load_model"];
    return ["check_local_openai_server"];
  }

  if (text.includes("api key")) return ["add_remote_api_key"];
  if (text.includes("permission")) return ["approve_provider_permission"];
  if (text.includes("https")) return ["use_https_or_localhost"];

  return ["check_provider_base_url_model_key"];
}

const AI_CONNECTION_TROUBLESHOOTING_MESSAGES = {
  start_ollama_load_model: "aiTroubleshootOllama",
  start_lmstudio_server_load_model: "aiTroubleshootLMStudio",
  check_local_openai_server: "aiTroubleshootLocalServer",
  choose_listed_model: "aiTroubleshootChooseListedModel",
  check_configured_model_name: "aiTroubleshootCheckModelName",
  model_list_unavailable_synthetic_only: "aiTroubleshootSyntheticOnly",
  add_remote_api_key: "aiTroubleshootAddRemoteKey",
  approve_provider_permission: "aiTroubleshootApprovePermission",
  use_https_or_localhost: "aiTroubleshootUseHttps",
  check_provider_base_url_model_key: "aiTroubleshootProviderSettings"
};

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

async function loadSearchSettings() {
  if (!searchSettingsForm) return;

  const result = await chrome.storage.local.get([SEARCH_SETTINGS_KEY, SEARCH_DIAGNOSTICS_KEY]);
  const settings = normalizeSearchSettings(result[SEARCH_SETTINGS_KEY]);
  const diagnostics = normalizeSearchDiagnostics(result[SEARCH_DIAGNOSTICS_KEY]);
  searchEnabledInput.checked = Boolean(settings.enabled);
  searchBaseUrlInput.value = settings.baseUrl;
  searchMaxResultsInput.value = String(settings.maxResults);
  searchKeyInput.value = "";
  searchKeyInput.placeholder = settings.apiKey
    ? msg("apiKeySavedPlaceholder")
    : msg("apiKeyStoredPlaceholder");
  searchSettingsStatus.textContent = canUseSearchSettings(settings)
    ? msg("agentSearchProviderReady", ["Tavily"])
    : msg("agentSearchProviderNeeded");
  renderSearchDiagnostics(settings, diagnostics);
}

async function saveSearchSettings(event) {
  event.preventDefault();

  try {
    const existing = await chrome.storage.local.get(SEARCH_SETTINGS_KEY);
    const previous = normalizeSearchSettings(existing[SEARCH_SETTINGS_KEY]);
    const baseUrl = normalizeSearchBaseUrl(searchBaseUrlInput.value);
    const apiKey = searchKeyInput.value.trim() || previous.apiKey;
    const maxResults = normalizeSearchMaxResults(searchMaxResultsInput.value);

    if (searchEnabledInput.checked && apiKey) {
      await ensureSearchProviderPermission(baseUrl);
    }

    const next = {
      ...previous,
      enabled: Boolean(searchEnabledInput.checked),
      provider: "tavily",
      baseUrl,
      apiKey,
      maxResults,
      searchDepth: "basic",
      includeAnswer: true
    };

    await chrome.storage.local.set({ [SEARCH_SETTINGS_KEY]: next });
    searchKeyInput.value = "";
    await loadSearchSettings();
    searchSettingsStatus.textContent = msg("searchSettingsSaved");
  } catch (error) {
    searchSettingsStatus.textContent = error?.message || msg("agentSearchProviderNeeded");
  }
}

async function clearSearchKey() {
  const confirmed = window.confirm(msg("clearSearchKeyConfirm"));

  if (!confirmed) return;

  clearSearchKeyButton.disabled = true;
  clearSearchKeyButton.textContent = msg("clearing");
  searchSettingsStatus.textContent = "";

  try {
    const result = await chrome.storage.local.get(SEARCH_SETTINGS_KEY);
    const previous = normalizeSearchSettings(result[SEARCH_SETTINGS_KEY]);
    await chrome.storage.local.set({
      [SEARCH_SETTINGS_KEY]: {
        ...previous,
        enabled: false,
        apiKey: ""
      }
    });
    searchKeyInput.value = "";
    await loadSearchSettings();
    searchSettingsStatus.textContent = msg("searchKeyCleared");
  } catch (error) {
    searchSettingsStatus.textContent = `${msg("couldNotClearSearchKey")} ${error?.message || ""}`.trim();
  } finally {
    clearSearchKeyButton.disabled = false;
    clearSearchKeyButton.textContent = msg("clearSearchKey");
  }
}

function normalizeSearchSettings(settings = {}) {
  return {
    enabled: Boolean(settings.enabled),
    provider: "tavily",
    baseUrl: normalizeSearchBaseUrl(settings.baseUrl || "https://api.tavily.com"),
    apiKey: String(settings.apiKey || "").trim(),
    maxResults: normalizeSearchMaxResults(settings.maxResults),
    searchDepth: String(settings.searchDepth || "basic").toLowerCase() === "advanced" ? "advanced" : "basic",
    includeAnswer: settings.includeAnswer !== false
  };
}

function normalizeSearchBaseUrl(baseUrl) {
  try {
    const parsed = new URL(String(baseUrl || "https://api.tavily.com").trim());
    if (parsed.protocol !== "https:") return "https://api.tavily.com";
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return "https://api.tavily.com";
  }
}

function normalizeSearchMaxResults(value) {
  return Math.min(8, Math.max(1, Number.parseInt(value || "3", 10) || 3));
}

function canUseSearchSettings(settings = {}) {
  return Boolean(settings.enabled && String(settings.apiKey || "").trim());
}

function normalizeSearchDiagnostics(value = {}) {
  const diagnostics = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    status: String(diagnostics.status || "not-run").slice(0, 40),
    providerLabel: String(diagnostics.providerLabel || "Tavily").slice(0, 80),
    enabled: Boolean(diagnostics.enabled),
    configured: Boolean(diagnostics.configured),
    apiKeyStatus: diagnostics.apiKeyStatus === "saved" ? "saved" : "missing",
    baseOrigin: normalizeSearchDiagnosticOrigin(diagnostics.baseOrigin || diagnostics.permissionOrigin || "https://api.tavily.com"),
    maxResults: normalizeSearchMaxResults(diagnostics.maxResults),
    resultCount: Math.min(8, Math.max(0, Number.parseInt(diagnostics.resultCount || 0, 10) || 0)),
    errorType: String(diagnostics.errorType || "").slice(0, 80),
    checkedAt: String(diagnostics.checkedAt || "").slice(0, 40),
    privacy: {
      sentQuery: Boolean(diagnostics.privacy?.sentQuery),
      sentTabData: false,
      sentPageText: false,
      sentFullUrls: false
    }
  };
}

function normalizeSearchDiagnosticOrigin(value = "") {
  try {
    const parsed = new URL(String(value || "https://api.tavily.com").replace(/\*$/, ""));
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return "https://api.tavily.com";
  }
}

function renderSearchDiagnostics(settings = {}, diagnostics = {}) {
  if (!searchDiagnosticsPanel) return;

  const status = diagnostics.status === "not-run"
    ? (canUseSearchSettings(settings) ? "ready" : "not-configured")
    : diagnostics.status;
  const keyStatus = settings.apiKey ? msg("searchDiagnosticKeySaved") : msg("searchDiagnosticKeyMissing");
  const rows = [
    [msg("searchDiagnosticStatusLabel"), formatSearchDiagnosticStatus(status)],
    [msg("searchDiagnosticProviderLabel"), diagnostics.providerLabel || "Tavily"],
    [msg("searchDiagnosticOriginLabel"), normalizeSearchDiagnosticOrigin(settings.baseUrl || diagnostics.baseOrigin)],
    [msg("searchDiagnosticKeyLabel"), keyStatus],
    [msg("searchDiagnosticMaxResultsLabel"), String(settings.maxResults || diagnostics.maxResults || 3)],
    [msg("searchDiagnosticResultCountLabel"), String(diagnostics.resultCount || 0)]
  ];

  if (diagnostics.errorType) {
    rows.push([msg("searchDiagnosticErrorLabel"), diagnostics.errorType]);
  }

  searchDiagnosticsPanel.innerHTML = `
    <div class="settings-diagnostics-head">
      <strong>${escapeHtml(msg("searchDiagnosticsHeading"))}</strong>
      <span>${escapeHtml(msg("searchDiagnosticPrivate"))}</span>
    </div>
    <dl>
      ${rows.map(([label, value]) => `
        <div>
          <dt>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(value)}</dd>
        </div>
      `).join("")}
    </dl>
    <p>${escapeHtml(msg("searchDiagnosticDashboardPrivacy"))}</p>
  `;
}

function formatSearchDiagnosticStatus(status = "") {
  const normalized = String(status || "unknown");
  const keyByStatus = {
    completed: "searchDiagnosticStatusCompleted",
    failed: "searchDiagnosticStatusFailed",
    "not-configured": "searchDiagnosticStatusNotConfigured",
    "unsupported-provider": "searchDiagnosticStatusUnsupported",
    ready: "searchDiagnosticStatusReady",
    "not-run": "searchDiagnosticStatusNotRun"
  };
  return msg(keyByStatus[normalized] || "searchDiagnosticStatusUnknown");
}

async function ensureSearchProviderPermission(baseUrl) {
  const origin = getSearchProviderPermissionOrigin(baseUrl);

  if (!chrome.permissions?.contains || !chrome.permissions?.request) {
    return { granted: true, origin, required: true, reason: "permissions-api-unavailable" };
  }

  const hasPermission = await chrome.permissions.contains({ origins: [origin] });
  if (hasPermission) return { granted: true, origin, required: true };

  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) {
    throw new Error(msg("aiProviderPermissionDenied", [origin]));
  }

  return { granted: true, origin, required: true };
}

function getSearchProviderPermissionOrigin(baseUrl) {
  const url = new URL(normalizeSearchBaseUrl(baseUrl));
  return `${url.protocol}//${url.hostname}/*`;
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

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(msg("unsupportedAIBaseUrl"));
  }

  if (url.protocol === "http:" && !isLocalAIHostname(url.hostname)) {
    throw new Error(msg("unsupportedAIBaseUrl"));
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(msg("unsupportedAIBaseUrl"));
  }

  return url.toString().replace(/\/+$/, "");
}

function safeNormalizeBaseUrl(value) {
  try {
    return normalizeBaseUrl(value);
  } catch {
    return "";
  }
}

function updateAIModelOptions(modelIds = [], currentModel = "") {
  if (!aiModelOptions) return;

  const models = Array.from(new Set([
    String(currentModel || "").trim(),
    ...((Array.isArray(modelIds) ? modelIds : []).map((model) => String(model || "").trim()))
  ]))
    .filter(Boolean)
    .slice(0, 30);

  aiModelOptions.innerHTML = models
    .map((model) => `<option value="${escapeHtml(model)}"></option>`)
    .join("");
}

function canUseAISettings(settings = {}) {
  if (!settings.enabled) return false;
  if (String(settings.apiKey || "").trim()) return true;
  return isLocalAIBaseUrl(settings.baseUrl);
}

function isLocalAIBaseUrl(baseUrl) {
  try {
    const url = new URL(normalizeBaseUrl(baseUrl));
    return isLocalAIHostname(url.hostname);
  } catch {
    return false;
  }
}

async function ensureAIProviderPermission(baseUrl) {
  const origin = getAIProviderPermissionOrigin(baseUrl);

  if (origin === DEFAULT_AI_PROVIDER_ORIGIN) {
    return { granted: true, origin, required: false };
  }

  if (!chrome.permissions?.contains || !chrome.permissions?.request) {
    return { granted: true, origin, required: true, reason: "permissions-api-unavailable" };
  }

  const hasPermission = await chrome.permissions.contains({ origins: [origin] });

  if (hasPermission) {
    return { granted: true, origin, required: true };
  }

  const granted = await chrome.permissions.request({ origins: [origin] });

  if (!granted) {
    throw new Error(msg("aiProviderPermissionDenied", [origin]));
  }

  return { granted: true, origin, required: true };
}

function getAIProviderPermissionOrigin(baseUrl) {
  const url = new URL(normalizeBaseUrl(baseUrl));
  return `${url.protocol}//${url.hostname}/*`;
}

function inferAIProviderId(baseUrl) {
  const url = new URL(normalizeBaseUrl(baseUrl));
  const hostname = normalizeAIHostname(url.hostname);

  if (hostname === DEFAULT_AI_HOSTNAME) return "deepseek";
  if (isLocalAIHostname(hostname)) return "local-openai-compatible";
  return AI_PROVIDER_HOST_IDS.get(hostname) || "openai-compatible";
}

function isLocalAIHostname(hostname) {
  const normalized = normalizeAIHostname(hostname);
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost")
  );
}

function normalizeAIHostname(hostname) {
  return String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
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
  const tabCount = groups.reduce((sum, group) => {
    const directCount = Number(group.tabCount);
    if (Number.isFinite(directCount)) return sum + Math.max(0, directCount);
    return sum + (Array.isArray(group.tabIds) ? group.tabIds.length : 0);
  }, 0);
  allGroupsCount.textContent = String(groups.length);
  aiGroupsCount.textContent = String(aiGroupCount);
  ruleGroupsCount.textContent = String(ruleGroupCount);
  if (dashboardGroupSummary) {
    dashboardGroupSummary.textContent = groups.length
      ? msg("dashboardGroupsSummary", [groups.length, tabCount])
      : msg("dashboardGroupsSummaryEmpty");
  }
}

function renderGroups(groups, run = latestRun) {
  if (!groups.length) {
    selectedDashboardTabIds.clear();
    dashboardGroups.innerHTML = `<p class="empty">${escapeHtml(msg("noNativeGroupsLatest"))}</p>`;
    syncDashboardSelectedTabsButton();
    return;
  }

  const filteredGroups = getFilteredGroups(groups, activeGroupFilter);

  if (!filteredGroups.length) {
    selectedDashboardTabIds.clear();
    dashboardGroups.innerHTML = `<p class="empty">${escapeHtml(msg("noGroupsForFilter"))}</p>`;
    syncDashboardSelectedTabsButton();
    return;
  }

  dashboardGroups.innerHTML = filteredGroups
    .map((group, index) => renderGroupCard(group, run, index))
    .join("");
  syncDashboardTabSelectionControls();
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
      <div class="dashboard-workspace-actions">
        <button
          class="mini-button"
          type="button"
          data-workspace-action="restore"
          data-workspace-id="${escapeHtml(String(workspace.id || ""))}"
        >${escapeHtml(msg("restoreWorkspace"))}</button>
        <button
          class="mini-button"
          type="button"
          data-workspace-action="delete"
          data-workspace-id="${escapeHtml(String(workspace.id || ""))}"
        >${escapeHtml(msg("delete"))}</button>
      </div>
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

function renderDashboardWorkbench() {
  renderAgentTasks();
  renderSavedCollections();
  renderDashboardMemory();
  syncDashboardWorkbenchSelectionButtons();
}

function renderDashboardContinue() {
  if (!dashboardContinue) return;

  const model = buildDashboardContinueModel();
  if (!model.visible) {
    dashboardContinue.hidden = true;
    dashboardContinue.innerHTML = "";
    return;
  }

  dashboardContinue.hidden = false;
  dashboardContinue.innerHTML = `
    <div class="dashboard-continue-copy">
      <span class="dashboard-continue-label">${escapeHtml(msg("continueWorkspace"))}</span>
      <strong>${escapeHtml(model.title)}</strong>
      <small>${escapeHtml(model.copy)}</small>
      <div class="dashboard-continue-pills" aria-label="${escapeHtml(msg("continueSignals"))}">
        ${model.pills.map((pill) => `<span>${escapeHtml(pill)}</span>`).join("")}
      </div>
    </div>
    <div class="dashboard-continue-actions">
      ${model.primaryAction ? `
        <button
          class="dashboard-continue-action"
          type="button"
          data-continue-action="${escapeHtml(model.primaryAction.action)}"
        >${escapeHtml(model.primaryAction.label)}</button>
      ` : ""}
      <button
        class="dashboard-continue-action primary"
        type="button"
        data-continue-action="ask"
      >${escapeHtml(msg("continueAskSidebar"))}</button>
    </div>
  `;
}

function buildDashboardContinueModel() {
  const openTasks = getOpenAgentTasks();
  const laterTabs = getLaterTabs();
  const duplicateReviewCount = getDuplicateReviewCount();
  const collectionCount = latestSavedCollections.length;
  const memoCount = latestSavedMemos.length;
  const savedWorkspaceCount = latestSavedWorkspaces.length;
  const goal = latestWorkspaceGoal?.text || "";
  const hasSignals = Boolean(
    goal ||
      openTasks.length ||
      laterTabs.length ||
      duplicateReviewCount ||
      memoCount ||
      collectionCount ||
      savedWorkspaceCount
  );

  if (!hasSignals) {
    return { visible: false };
  }

  const firstTask = openTasks[0];
  const firstLaterTab = laterTabs[0];
  const title = goal || firstTask?.title || firstLaterTab?.title || msg("continueWorkspaceDefaultTitle");
  const copy = goal
    ? msg("continueWorkspaceGoalCopy")
    : firstTask
      ? msg("continueWorkspaceTaskCopy")
      : duplicateReviewCount
        ? msg("continueWorkspaceDuplicateCopy")
        : firstLaterTab
          ? msg("continueWorkspaceLaterCopy")
          : msg("continueWorkspaceSavedCopy");
  const pills = [];

  if (goal) pills.push(msg("continueGoalPill"));
  if (openTasks.length) pills.push(formatContinueCount(openTasks.length, "continueOpenTaskPill", "continueOpenTasksPill"));
  if (duplicateReviewCount) pills.push(formatContinueCount(duplicateReviewCount, "continueDuplicatePill", "continueDuplicatesPill"));
  if (laterTabs.length) pills.push(formatContinueCount(laterTabs.length, "continueLaterTabPill", "continueLaterPill"));
  if (memoCount) pills.push(formatContinueCount(memoCount, "continueMemoPill", "continueMemosPill"));
  if (collectionCount) pills.push(formatContinueCount(collectionCount, "continueCollectionPill", "continueCollectionsPill"));
  if (savedWorkspaceCount) pills.push(formatContinueCount(savedWorkspaceCount, "continueSnapshotPill", "continueSnapshotsPill"));
  pills.push(msg("continueLocalPill"));

  return {
    visible: true,
    title,
    copy,
    pills: pills.slice(0, 6),
    primaryAction: buildDashboardContinuePrimaryAction(openTasks, laterTabs, duplicateReviewCount)
  };
}

function formatContinueCount(count, singularKey, pluralKey) {
  const safeCount = Math.max(0, Number(count) || 0);
  return msg(safeCount === 1 ? singularKey : pluralKey, [safeCount]);
}

function buildDashboardContinuePrimaryAction(openTasks = [], laterTabs = [], duplicateReviewCount = 0) {
  if (openTasks.length && hasOpenBrowserWorkSource(openTasks[0])) {
    return { action: "open-task", label: msg("continueOpenTask") };
  }

  if (duplicateReviewCount) {
    return { action: "review-duplicates", label: msg("reviewDuplicates") };
  }

  if (laterTabs.length && Number.isInteger(Number(laterTabs[0]?.id || laterTabs[0]?.tabId))) {
    return { action: "open-later", label: msg("continueOpenLater") };
  }

  return null;
}

function getOpenAgentTasks() {
  return latestAgentTasks
    .filter((task) => task && task.status !== "archived" && task.status !== "done")
    .slice(0, 8);
}

function getLaterTabs() {
  const tabsById = new Map(
    (latestRun?.snapshot?.tabs || [])
      .map((tab) => [Number(tab.id), tab])
      .filter(([tabId]) => Number.isInteger(tabId))
  );

  return Object.values(latestTabWorkStates)
    .filter((item) => item?.state === "later")
    .map((item) => tabsById.get(Number(item.tabId)) || item)
    .filter(Boolean)
    .slice(0, 8);
}

function getDuplicateReviewCount() {
  const summaryCount = Number(latestRun?.summary?.reviewDuplicateGroups || 0);
  if (summaryCount > 0) return summaryCount;

  return (Array.isArray(latestRun?.duplicateGroups) ? latestRun.duplicateGroups : [])
    .filter((group) => {
      const marker = `${group?.reviewStatus || ""} ${group?.action || ""} ${group?.type || ""}`.toLowerCase();
      return marker.includes("review") || marker.includes("candidate");
    }).length;
}

function hasOpenBrowserWorkSource(item = {}) {
  const tabIds = Array.isArray(item.tabIds)
    ? item.tabIds.map((tabId) => Number(tabId)).filter(Number.isInteger)
    : [];
  if (!tabIds.length) return false;

  const currentTabIds = new Set(
    (latestRun?.snapshot?.tabs || [])
      .map((tab) => Number(tab.id))
      .filter(Number.isInteger)
  );
  return tabIds.some((tabId) => currentTabIds.has(tabId));
}

function normalizeWorkspaceGoal(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const text = String(value.text || "").replace(/\s+/g, " ").trim().slice(0, 180);
  if (!text) return null;

  return {
    text,
    source: String(value.source || "").slice(0, 80),
    metadataOnly: value.metadataOnly !== false,
    createdAt: String(value.createdAt || "").slice(0, 40),
    updatedAt: String(value.updatedAt || "").slice(0, 40)
  };
}

function normalizeSavedMemos(value = []) {
  return (Array.isArray(value) ? value : [])
    .filter((memo) => memo && typeof memo === "object")
    .map((memo) => ({
      id: String(memo.id || "").slice(0, 100),
      title: String(memo.title || msg("memo")).replace(/\s+/g, " ").trim().slice(0, 140) || msg("memo"),
      body: sanitizeMemoryText(memo.body, 2400),
      source: String(memo.source || "").slice(0, 80),
      tags: (Array.isArray(memo.tags) ? memo.tags : [])
        .map((tag) => String(tag || "").replace(/^#/, "").trim().slice(0, 48))
        .filter(Boolean)
        .slice(0, 8),
      provider: String(memo.provider || "").slice(0, 80),
      aiUsed: Boolean(memo.aiUsed),
      createdAt: String(memo.createdAt || "").slice(0, 40),
      updatedAt: String(memo.updatedAt || memo.createdAt || "").slice(0, 40),
      context: memo.context && typeof memo.context === "object" ? memo.context : {},
      tabIds: (Array.isArray(memo.tabIds) ? memo.tabIds : [])
        .map((tabId) => Number(tabId))
        .filter(Number.isInteger)
        .slice(0, 20),
      tabs: normalizeBrowserWorkTabs(memo.tabs),
      sources: normalizeBrowserWorkSources(memo.sources)
    }))
    .filter((memo) => memo.id || memo.title || memo.body)
    .slice(0, MAX_AGENT_ITEMS);
}

function normalizeBrowserWorkTabs(tabs = []) {
  return (Array.isArray(tabs) ? tabs : [])
    .map((tab) => ({
      id: toOptionalInteger(tab?.id ?? tab?.tabId),
      windowId: toOptionalInteger(tab?.windowId),
      groupId: toOptionalInteger(tab?.groupId),
      groupName: String(tab?.groupName || "").slice(0, 120),
      title: String(tab?.title || "").slice(0, 180),
      hostname: String(tab?.hostname || "").slice(0, 120),
      path: String(tab?.path || "").split(/[?#]/)[0].slice(0, 180)
    }))
    .filter((tab) => Number.isInteger(tab.id) || tab.title || tab.hostname)
    .slice(0, 12);
}

function normalizeBrowserWorkSources(sources = []) {
  return (Array.isArray(sources) ? sources : [])
    .map((source) => ({
      sourceType: String(source?.sourceType || source?.type || "").slice(0, 60),
      title: String(source?.title || "").slice(0, 180),
      hostname: String(source?.hostname || "").slice(0, 120),
      path: String(source?.path || "").split(/[?#]/)[0].slice(0, 180),
      snippet: String(source?.snippet || source?.description || "").replace(/\s+/g, " ").trim().slice(0, 240)
    }))
    .filter((source) => source.title || source.hostname || source.snippet)
    .slice(0, 8);
}

function renderAgentTasks() {
  if (!dashboardAgentTasks) return;

  const visibleTasks = latestAgentTasks.filter((task) => task.status !== "archived");

  if (!visibleTasks.length) {
    dashboardAgentTasks.innerHTML = `<p class="empty">${escapeHtml(msg("noAgentTasksYet"))}</p>`;
    return;
  }

  dashboardAgentTasks.innerHTML = visibleTasks
    .slice(0, 3)
    .map((task) => renderAgentTaskRow(task))
    .join("");
}

function renderAgentTaskRow(task) {
  const count = Array.isArray(task.tabs) ? task.tabs.length : 0;
  const meta = buildBrowserWorkMeta(task);
  const status = task.status === "done" ? "done" : "open";
  const doneLabel = status === "done" ? msg("reopenTodo") : msg("markDone");
  return `
    <article class="dashboard-agent-minirow ${escapeHtml(status)}" data-browser-work-kind="task" data-browser-work-id="${escapeHtml(String(task.id || ""))}">
      <span class="dashboard-agent-minirow-icon" aria-hidden="true">${status === "done" ? "✓" : "□"}</span>
      <div class="dashboard-agent-minirow-copy">
        <strong>${escapeHtml(task.title || msg("todo"))}</strong>
        <small>${escapeHtml(meta || `${msg("tabsCount", [count])} · ${msg("localOnly")}`)}</small>
        ${renderBrowserWorkChecklistEditor(task)}
        ${renderBrowserWorkSourcePreview(task.sources)}
        ${renderBrowserWorkTabPreview(task.tabs)}
      </div>
      <div class="dashboard-agent-row-actions">
        <button class="dashboard-agent-row-action" type="button" data-browser-work-action="focus">
          ${escapeHtml(msg("focusSource"))}
        </button>
        <button class="dashboard-agent-row-action" type="button" data-browser-work-action="ask">
          ${escapeHtml(msg("askInSidebar"))}
        </button>
        <button class="dashboard-agent-row-action" type="button" data-browser-work-action="suggest-checklist">
          ${escapeHtml(msg("suggestSteps"))}
        </button>
        <button class="dashboard-agent-row-action" type="button" data-browser-work-action="toggle-done">
          ${escapeHtml(doneLabel)}
        </button>
        <button class="dashboard-agent-row-action quiet" type="button" data-browser-work-action="archive">
          ${escapeHtml(msg("archiveTodo"))}
        </button>
      </div>
    </article>
  `;
}

function renderSavedCollections() {
  if (!dashboardAgentCollections) return;

  if (!latestSavedCollections.length) {
    dashboardAgentCollections.innerHTML = `<p class="empty">${escapeHtml(msg("noCollectionsYet"))}</p>`;
    return;
  }

  dashboardAgentCollections.innerHTML = latestSavedCollections
    .slice(0, 3)
    .map((collection) => renderCollectionRow(collection))
    .join("");
}

function renderCollectionRow(collection) {
  const count = Array.isArray(collection.tabs) ? collection.tabs.length : 0;
  const meta = buildBrowserWorkMeta(collection);
  return `
    <article class="dashboard-agent-minirow" data-browser-work-kind="collection" data-browser-work-id="${escapeHtml(String(collection.id || ""))}">
      <span class="dashboard-agent-minirow-icon collection" aria-hidden="true">◇</span>
      <div class="dashboard-agent-minirow-copy">
        <strong>${escapeHtml(collection.name || msg("collection"))}</strong>
        <small>${escapeHtml(meta || `${msg("tabsCount", [count])} · ${msg("localOnly")}`)}</small>
        ${renderBrowserWorkSourcePreview(collection.sources)}
        ${renderBrowserWorkTabPreview(collection.tabs)}
      </div>
      <div class="dashboard-agent-row-actions">
        <button class="dashboard-agent-row-action" type="button" data-browser-work-action="focus">
          ${escapeHtml(msg("focusSource"))}
        </button>
        <button class="dashboard-agent-row-action" type="button" data-browser-work-action="ask">
          ${escapeHtml(msg("askInSidebar"))}
        </button>
      </div>
    </article>
  `;
}

function renderDashboardMemory() {
  if (!dashboardMemoryItems) return;

  const items = getFilteredMemoryItems();
  const totalCount = latestSavedMemos.length + latestSavedCollections.length;

  if (dashboardMemorySummary) {
    dashboardMemorySummary.textContent = totalCount
      ? msg("memorySummary", [items.length, totalCount])
      : "";
  }

  if (!totalCount) {
    dashboardMemoryItems.innerHTML = `<p class="empty">${escapeHtml(msg("noMemoryItemsYet"))}</p>`;
    return;
  }

  if (!items.length) {
    dashboardMemoryItems.innerHTML = `<p class="empty">${escapeHtml(msg("noMemoryMatches"))}</p>`;
    return;
  }

  dashboardMemoryItems.innerHTML = items
    .slice(0, 18)
    .map((item) => renderMemoryRow(item))
    .join("");
}

function getFilteredMemoryItems() {
  const query = dashboardMemoryQuery.toLowerCase();
  const items = [
    ...latestSavedMemos.map((memo) => ({ ...memo, kind: "memo" })),
    ...latestSavedCollections.map((collection) => ({ ...collection, kind: "collection" }))
  ].sort(sortMemoryItemByUpdatedAt);

  if (!query) return items;

  return items.filter((item) => buildMemorySearchText(item).includes(query));
}

function renderMemoryRow(item) {
  const kind = item.kind === "collection" ? "collection" : "memo";
  const title = getMemoryItemTitle(item);
  const excerpt = getMemoryItemExcerpt(item);
  const updatedAt = formatSavedWorkspaceDate(item.updatedAt || item.createdAt);
  const metaParts = [
    kind === "memo" ? msg("memo") : msg("collection"),
    formatMemorySource(item),
    updatedAt,
    msg("localOnly")
  ].filter(Boolean);
  const tags = getMemoryItemTags(item);
  const hasSourceTab = hasOpenBrowserWorkSource(item);

  return `
    <article
      class="dashboard-memory-row"
      data-memory-kind="${escapeHtml(kind)}"
      data-memory-id="${escapeHtml(String(item.id || ""))}"
    >
      <span class="dashboard-agent-minirow-icon ${escapeHtml(kind)}" aria-hidden="true">${kind === "memo" ? "✎" : "◇"}</span>
      <div class="dashboard-memory-copy">
        <strong>${escapeHtml(title)}</strong>
        <small>${escapeHtml(metaParts.join(" · "))}</small>
        ${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ""}
        ${renderMemoryTags(tags)}
        ${renderBrowserWorkSourcePreview(item.sources)}
        ${renderBrowserWorkTabPreview(item.tabs)}
      </div>
      <div class="dashboard-agent-row-actions">
        <button
          class="dashboard-agent-row-action"
          type="button"
          data-memory-action="focus"
          ${hasSourceTab ? "" : "disabled"}
        >${escapeHtml(msg("focusSource"))}</button>
        <button class="dashboard-agent-row-action" type="button" data-memory-action="ask">
          ${escapeHtml(msg("askInSidebar"))}
        </button>
      </div>
    </article>
  `;
}

function renderMemoryTags(tags = []) {
  const safeTags = tags.slice(0, 5);
  if (!safeTags.length) return "";

  return `
    <div class="dashboard-memory-tags">
      ${safeTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function getMemoryItemTitle(item = {}) {
  return String(item.title || item.name || msg("memo")).trim().slice(0, 120) || msg("memo");
}

function getMemoryItemExcerpt(item = {}) {
  const body = item.kind === "collection"
    ? summarizeMemoryCollection(item)
    : stripMarkdownForPreview(item.body || "");
  return body.replace(/\s+/g, " ").trim().slice(0, 220);
}

function summarizeMemoryCollection(item = {}) {
  const sources = (Array.isArray(item.sources) ? item.sources : [])
    .map((source) => [source.title, source.hostname, source.snippet].filter(Boolean).join(" · "))
    .filter(Boolean);
  const tabs = (Array.isArray(item.tabs) ? item.tabs : [])
    .map((tab) => [tab.title, tab.hostname].filter(Boolean).join(" · "))
    .filter(Boolean);

  return [...sources, ...tabs].slice(0, 3).join(" · ");
}

function getMemoryItemTags(item = {}) {
  return Array.from(new Set(
    [
      ...(Array.isArray(item.tags) ? item.tags : []),
      item.source,
      item.provider
    ]
      .map((tag) => String(tag || "").replace(/^#/, "").trim())
      .filter(Boolean)
      .slice(0, 8)
  ));
}

function formatMemorySource(item = {}) {
  const source = String(item.source || "").replace(/_/g, " ").trim();
  return source ? source.slice(0, 80) : "";
}

function buildMemorySearchText(item = {}) {
  return [
    getMemoryItemTitle(item),
    item.body,
    item.source,
    item.provider,
    ...(Array.isArray(item.tags) ? item.tags : []),
    ...(Array.isArray(item.sources) ? item.sources.flatMap((source) => [source.title, source.hostname, source.snippet]) : []),
    ...(Array.isArray(item.tabs) ? item.tabs.flatMap((tab) => [tab.title, tab.hostname, tab.groupName]) : [])
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
}

function sortMemoryItemByUpdatedAt(a, b) {
  return Date.parse(b?.updatedAt || b?.createdAt || 0) - Date.parse(a?.updatedAt || a?.createdAt || 0);
}

function stripMarkdownForPreview(value = "") {
  return String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#-]+/g, " ");
}

function sanitizeMemoryText(value = "", maxLength = 1000) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\bhttps?:\/\/[^\s)]+/gi, redactMemoryUrlInText)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function redactMemoryUrlInText(rawUrl) {
  try {
    const url = new URL(String(rawUrl || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "[link]";
    return `${url.hostname}${String(url.pathname || "/").split(/[?#]/)[0]}`;
  } catch {
    return "[link]";
  }
}

function renderBrowserWorkTabPreview(tabs = []) {
  const safeTabs = Array.isArray(tabs) ? tabs : [];
  if (!safeTabs.length) return "";

  const preview = safeTabs
    .slice(0, 2)
    .map((tab) => {
      const label = tab.hostname || tab.title || msg("untitled");
      return `<span>${escapeHtml(label)}</span>`;
    })
    .join("");
  const more = safeTabs.length > 2 ? `<span>${escapeHtml(msg("moreTabsInline", [safeTabs.length - 2]))}</span>` : "";

  return `<div class="dashboard-agent-tab-preview" aria-label="${escapeHtml(msg("linkedTabs"))}">${preview}${more}</div>`;
}

function renderBrowserWorkSourcePreview(sources = []) {
  const sourceList = Array.isArray(sources) ? sources : [];
  const safeSources = sourceList
    .map((source) => ({
      title: String(source?.title || "").trim(),
      hostname: String(source?.hostname || "").trim()
    }))
    .filter((source) => source.title || source.hostname)
    .slice(0, 2);

  if (!safeSources.length) return "";

  const preview = safeSources
    .map((source) => `<span>${escapeHtml(source.hostname || source.title)}</span>`)
    .join("");
  const more = sourceList.length > 2 ? `<span>${escapeHtml(msg("moreTabsInline", [sourceList.length - 2]))}</span>` : "";

  return `<div class="dashboard-agent-source-preview" aria-label="${escapeHtml(msg("linkedSources"))}">${preview}${more}</div>`;
}

function renderBrowserWorkChecklistEditor(task = {}) {
  const items = normalizeDashboardChecklist(task.checklist);
  const meta = normalizeDashboardChecklistMeta(task.checklistMeta, items.length);
  const taskId = escapeHtml(String(task.id || ""));

  return `
    <div class="dashboard-agent-checklist-editor" aria-label="${escapeHtml(msg("todoChecklistEditor"))}">
      <ul class="dashboard-agent-checklist-preview" aria-label="${escapeHtml(msg("todoChecklist"))}">
        ${items.length ? items.map((item, index) => `
          <li>
            <span class="dashboard-checklist-copy">
              <span>${escapeHtml(item)}</span>
              <input type="text" data-checklist-note-input data-checklist-index="${index}" maxlength="120" value="${escapeHtml(meta[index]?.sourceNote || "")}" placeholder="${escapeHtml(msg("sourceNotePlaceholder"))}" aria-label="${escapeHtml(msg("sourceNotePlaceholder"))}">
            </span>
            <span class="dashboard-checklist-actions">
              <button class="dashboard-icon-action" type="button" data-browser-work-action="checklist-up" data-checklist-index="${index}" title="${escapeHtml(msg("moveChecklistItemUp"))}" aria-label="${escapeHtml(msg("moveChecklistItemUp"))}" ${index === 0 ? "disabled" : ""}>↑</button>
              <button class="dashboard-icon-action" type="button" data-browser-work-action="checklist-down" data-checklist-index="${index}" title="${escapeHtml(msg("moveChecklistItemDown"))}" aria-label="${escapeHtml(msg("moveChecklistItemDown"))}" ${index === items.length - 1 ? "disabled" : ""}>↓</button>
              <button class="dashboard-icon-action danger" type="button" data-browser-work-action="checklist-delete" data-checklist-index="${index}" title="${escapeHtml(msg("deleteChecklistItem"))}" aria-label="${escapeHtml(msg("deleteChecklistItem"))}">×</button>
            </span>
          </li>
        `).join("") : `<li class="empty">${escapeHtml(msg("noChecklistItemsYet"))}</li>`}
      </ul>
      <div class="dashboard-checklist-add-row">
        <input type="text" data-checklist-add-input="${taskId}" maxlength="160" placeholder="${escapeHtml(msg("checklistAddPlaceholder"))}" aria-label="${escapeHtml(msg("checklistAddPlaceholder"))}">
        <button class="dashboard-icon-action add" type="button" data-browser-work-action="checklist-add" title="${escapeHtml(msg("addChecklistItem"))}" aria-label="${escapeHtml(msg("addChecklistItem"))}">+</button>
      </div>
    </div>
  `;
}

function normalizeDashboardChecklist(checklist = []) {
  return (Array.isArray(checklist) ? checklist : [])
    .map(cleanDashboardChecklistItem)
    .filter(Boolean)
    .slice(0, 12);
}

function cleanDashboardChecklistItem(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^[-*]\s+|\d+[.)]\s+/g, "")
    .trim()
    .replace(/[.。]+$/g, "")
    .slice(0, 180);
}

function normalizeDashboardChecklistMeta(meta = [], length = 0) {
  const source = Array.isArray(meta) ? meta : [];
  return Array.from({ length }, (_value, index) => ({
    sourceNote: cleanDashboardSourceNote(source[index]?.sourceNote || "")
  }));
}

function cleanDashboardSourceNote(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function buildBrowserWorkMeta(item = {}) {
  const tabs = Array.isArray(item.tabs) ? item.tabs : [];
  const sources = Array.isArray(item.sources) ? item.sources : [];
  const count = tabs.length;
  const sourceCount = sources.length;
  const group = mostCommonValue(tabs.map((tab) => tab.groupName).filter(Boolean));
  const host = mostCommonValue(tabs.map((tab) => tab.hostname).filter(Boolean));
  const sourceHost = mostCommonValue(sources.map((source) => source.hostname).filter(Boolean));
  const source = group || host || sourceHost || msg("selectedTabsCollection");
  const countCopy = count ? msg("tabsCount", [count]) : msg("sourcesCount", [sourceCount]);
  return `${countCopy} · ${source} · ${msg("localOnly")}`;
}

async function handleBrowserWorkAction(event) {
  const button = event.target.closest("[data-browser-work-action]");
  if (!button) return;

  const row = button.closest("[data-browser-work-kind][data-browser-work-id]");
  const action = button.dataset.browserWorkAction;
  const kind = row?.dataset.browserWorkKind;
  const itemId = row?.dataset.browserWorkId;
  const item = findBrowserWorkItem(kind, itemId);

  if (!item) return;

  if (action === "focus") {
    await focusBrowserWorkSource(item);
    return;
  }

  if (kind === "task" && action === "toggle-done") {
    await toggleBrowserWorkTaskDone(item);
    return;
  }

  if (kind === "task" && action === "archive") {
    await archiveBrowserWorkTask(item);
    return;
  }

  if (kind === "task" && action === "suggest-checklist") {
    await suggestChecklistFromLocalSources(item);
    return;
  }

  if (kind === "task" && action.startsWith("checklist-")) {
    await updateBrowserWorkTaskChecklist(item, button, action);
    return;
  }

  if (action !== "ask") return;

  await askAboutBrowserWorkItem(item);
}

async function updateBrowserWorkTaskChecklist(task, button, action) {
  const row = button.closest("[data-browser-work-id]");
  const index = Number(button.dataset.checklistIndex);
  const input = row?.querySelector("[data-checklist-add-input]");
  const now = new Date().toISOString();
  let notice = "";

  if (action === "checklist-add" && !cleanDashboardChecklistItem(input?.value || "")) {
    showDashboardSelectionNotice(msg("agentTodoChecklistItemMissing"));
    return;
  }

  await updateBrowserWorkTask(task.id, (current) => {
    const checklist = normalizeDashboardChecklist(current.checklist);
    const checklistMeta = normalizeDashboardChecklistMeta(current.checklistMeta, checklist.length);

    if (action === "checklist-add") {
      const item = cleanDashboardChecklistItem(input?.value || "");
      if (!item) return current;
      if (!checklist.some((entry) => entry.toLowerCase() === item.toLowerCase())) {
        checklist.push(item);
        checklistMeta.push({ sourceNote: "" });
      }
      notice = msg("checklistItemAdded");
    }

    if (action === "checklist-delete") {
      if (!Number.isInteger(index) || index < 0 || index >= checklist.length) return current;
      checklist.splice(index, 1);
      checklistMeta.splice(index, 1);
      notice = msg("checklistItemDeleted");
    }

    if (action === "checklist-up" || action === "checklist-down") {
      const direction = action === "checklist-up" ? -1 : 1;
      const nextIndex = index + direction;
      if (!Number.isInteger(index) || nextIndex < 0 || nextIndex >= checklist.length) return current;
      [checklist[index], checklist[nextIndex]] = [checklist[nextIndex], checklist[index]];
      [checklistMeta[index], checklistMeta[nextIndex]] = [checklistMeta[nextIndex], checklistMeta[index]];
      notice = msg("checklistItemMoved");
    }

    return {
      ...current,
      checklist: checklist.slice(0, 12),
      checklistMeta: checklistMeta.slice(0, 12),
      checklistUpdatedAt: now,
      updatedAt: now
    };
  });

  if (input && action === "checklist-add") input.value = "";
  showDashboardSelectionNotice(notice || msg("todoUpdatedLocally"));
}

async function handleBrowserWorkChecklistNoteChange(event) {
  const input = event.target.closest("[data-checklist-note-input]");
  if (!input) return;

  const row = input.closest("[data-browser-work-kind='task'][data-browser-work-id]");
  const task = findBrowserWorkItem(row?.dataset?.browserWorkKind, row?.dataset?.browserWorkId);
  const index = Number(input.dataset.checklistIndex);

  if (!task || !Number.isInteger(index)) return;

  const now = new Date().toISOString();
  const sourceNote = cleanDashboardSourceNote(input.value);

  await updateBrowserWorkTask(task.id, (current) => {
    const checklist = normalizeDashboardChecklist(current.checklist);
    if (index < 0 || index >= checklist.length) return current;

    const checklistMeta = normalizeDashboardChecklistMeta(current.checklistMeta, checklist.length);
    checklistMeta[index] = { sourceNote };

    return {
      ...current,
      checklist,
      checklistMeta,
      checklistUpdatedAt: now,
      updatedAt: now
    };
  });

  showDashboardSelectionNotice(msg("sourceNoteSaved"));
}

async function suggestChecklistFromLocalSources(task = {}) {
  const suggestions = buildChecklistSuggestionsFromLocalSources(task);

  if (!suggestions.length) {
    showDashboardSelectionNotice(msg("noLocalSourcesForSteps"));
    return;
  }

  const now = new Date().toISOString();
  let addedCount = 0;

  await updateBrowserWorkTask(task.id, (current) => {
    const checklist = normalizeDashboardChecklist(current.checklist);
    const checklistMeta = normalizeDashboardChecklistMeta(current.checklistMeta, checklist.length);
    const existingKeys = new Set(checklist.map(normalizeDashboardSuggestionKey));

    for (const suggestion of suggestions) {
      const text = cleanDashboardChecklistItem(suggestion.text);
      const key = normalizeDashboardSuggestionKey(text);
      if (!text || existingKeys.has(key) || checklist.length >= 12 || addedCount >= MAX_CHECKLIST_SUGGESTIONS_PER_RUN) continue;

      checklist.push(text);
      checklistMeta.push({ sourceNote: cleanDashboardSourceNote(suggestion.sourceNote) });
      existingKeys.add(key);
      addedCount += 1;
    }

    return {
      ...current,
      checklist,
      checklistMeta,
      checklistUpdatedAt: now,
      updatedAt: now
    };
  });

  showDashboardSelectionNotice(addedCount ? msg("suggestedStepsAdded", [addedCount]) : msg("noNewSuggestedSteps"));
}

function buildChecklistSuggestionsFromLocalSources(task = {}) {
  const contextText = buildTaskLocalContextText(task);
  const candidates = [];
  const fallbackCandidates = [];
  const pushCandidates = (items = [], target = candidates) => {
    items.forEach((item) => {
      if (item?.text) target.push(item);
    });
  };
  const relevantMemos = getRelevantSavedMemosForTask(contextText).slice(0, 3);
  const relevantCollections = getRelevantSavedCollectionsForTask(contextText).slice(0, 3);

  normalizeBrowserWorkSources(task.sources)
    .slice(0, 3)
    .forEach((source) => {
      const label = source.title || source.hostname || source.sourceType;
      pushCandidates(buildChecklistSuggestionsFromLocalText(
        [source.title, source.snippet].filter(Boolean).join(". "),
        source.hostname || source.sourceType || label,
        contextText
      ));
    });

  relevantMemos.forEach((memo) => {
    pushCandidates(buildChecklistSuggestionsFromLocalText(
      memo.body,
      msg("sourceNoteMemo", [memo.title]),
      contextText
    ));

    normalizeBrowserWorkSources(memo.sources)
      .slice(0, 3)
      .forEach((source) => {
        const label = source.title || source.hostname || source.sourceType;
        pushCandidates(buildChecklistSuggestionsFromLocalText(
          [source.title, source.snippet].filter(Boolean).join(". "),
          source.hostname || msg("sourceNoteMemo", [memo.title]) || label,
          contextText
        ));
      });
  });

  relevantCollections.forEach((collection) => {
    normalizeBrowserWorkSources(collection.sources)
      .slice(0, 3)
      .forEach((source) => {
        const label = source.title || source.hostname || collection.name || msg("collection");
        pushCandidates(buildChecklistSuggestionsFromLocalText(
          [source.title, source.snippet].filter(Boolean).join(". "),
          source.hostname || msg("sourceNoteCollection", [collection.name || msg("collection")]) || label,
          contextText
        ));
      });
  });

  normalizeDashboardChecklistMeta(task.checklistMeta, normalizeDashboardChecklist(task.checklist).length)
    .map((item) => item.sourceNote)
    .filter(Boolean)
    .slice(0, 3)
    .forEach((note) => {
      pushCandidates(buildChecklistSuggestionsFromLocalText(note, note, contextText), fallbackCandidates);
      fallbackCandidates.push({
        text: msg("suggestedStepFromSourceNote", [note]),
        sourceNote: note
      });
    });

  normalizeBrowserWorkSources(task.sources)
    .slice(0, 3)
    .forEach((source) => {
      const label = source.title || source.hostname || source.sourceType;
      if (!label) return;
      fallbackCandidates.push({
        text: msg("suggestedStepReviewSource", [label]),
        sourceNote: source.hostname || source.sourceType || label
      });
    });

  normalizeBrowserWorkTabs(task.tabs)
    .slice(0, 3)
    .forEach((tab) => {
      const label = tab.title || tab.hostname;
      if (!label) return;
      fallbackCandidates.push({
        text: msg("suggestedStepReviewTab", [label]),
        sourceNote: tab.hostname || tab.groupName || label
      });
    });

  relevantMemos
    .forEach((memo) => {
      fallbackCandidates.push({
        text: msg("suggestedStepReviewMemo", [memo.title]),
        sourceNote: msg("sourceNoteMemo", [memo.title])
      });
    });

  relevantCollections
    .forEach((collection) => {
      fallbackCandidates.push({
        text: msg("suggestedStepReviewCollection", [collection.name || msg("collection")]),
        sourceNote: msg("sourceNoteCollection", [collection.name || msg("collection")])
      });
    });

  const seen = new Set();
  return [...candidates, ...fallbackCandidates]
    .map((candidate) => ({
      text: cleanDashboardChecklistItem(candidate.text),
      sourceNote: cleanDashboardSourceNote(candidate.sourceNote)
    }))
    .filter((candidate) => {
      const key = normalizeDashboardSuggestionKey(candidate.text);
      if (!candidate.text || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

function buildChecklistSuggestionsFromLocalText(value = "", sourceNote = "", contextText = "") {
  const contextTokens = tokenizeDashboardSourceText(contextText);
  return extractDashboardActionLines(value)
    .filter((line) => shouldKeepDashboardActionLine(line, contextTokens))
    .slice(0, 3)
    .map((line) => ({
      text: line,
      sourceNote
    }));
}

function extractDashboardActionLines(value = "") {
  return String(value || "")
    .split(/[\n.;。!?！？]+/g)
    .map((line) => buildDashboardActionLine(line))
    .filter(Boolean);
}

function buildDashboardActionLine(value = "") {
  const cleaned = cleanDashboardChecklistItem(stripMarkdownForPreview(value)
    .replace(/\bthe saved research brief says\b/i, "")
    .replace(/\bsaved research brief says\b/i, "")
    .replace(/\s+/g, " "));
  const lower = cleaned.toLowerCase();

  if (!cleaned || cleaned.length < 10) return "";
  if (DASHBOARD_ACTION_VERB_RE.test(cleaned)) return cleaned;

  const sourceOfTruthMatch = cleaned.match(/^(?:the\s+)?(.+?)\s+should\s+remain\s+(.+?source of truth)$/i);
  if (sourceOfTruthMatch) {
    return `Confirm ${sourceOfTruthMatch[1]} remains ${sourceOfTruthMatch[2]}`;
  }

  const unresolvedMatch = cleaned.match(/^(.+?)\s+(?:is|are|remains?|remain)\s+(?:still\s+)?(?:the\s+)?(?:biggest\s+)?(?:pricing\s+)?(?:assumption|assumptions|unresolved).*$/i);
  if (unresolvedMatch) {
    return `Validate ${unresolvedMatch[1]}`;
  }

  const validationMatch = cleaned.match(/^(.+?)\s+(?:need|needs)\s+validation.*$/i);
  if (validationMatch) {
    return `Validate ${validationMatch[1]}`;
  }

  const positioningMatch = cleaned.match(/^(.+?)\s+supports positioning around\s+(.+)$/i);
  if (positioningMatch) {
    return `Validate positioning around ${positioningMatch[2]}`;
  }

  if (DASHBOARD_ACTION_SIGNAL_RE.test(lower)) {
    return `Review ${cleaned}`;
  }

  return "";
}

function shouldKeepDashboardActionLine(line = "", contextTokens = []) {
  const cleaned = cleanDashboardChecklistItem(line);
  if (!cleaned || cleaned.length < 10) return false;
  if (DASHBOARD_ACTION_SIGNAL_RE.test(cleaned) || DASHBOARD_ACTION_VERB_RE.test(cleaned)) return true;
  if (!contextTokens.length) return false;
  const lineTokens = new Set(tokenizeDashboardSourceText(cleaned));
  return contextTokens.some((token) => lineTokens.has(token));
}

function getRelevantSavedMemosForTask(contextText = "") {
  const taskTokens = tokenizeDashboardSourceText(contextText);
  return latestSavedMemos
    .map((memo) => ({
      memo,
      score: scoreDashboardSourceMatch(taskTokens, [
        memo.title,
        memo.body,
        ...(Array.isArray(memo.tags) ? memo.tags : []),
        ...(Array.isArray(memo.tabs) ? memo.tabs.map((tab) => `${tab.title || ""} ${tab.hostname || ""}`) : []),
        ...(Array.isArray(memo.sources) ? memo.sources.map((source) => `${source.title || ""} ${source.hostname || ""} ${source.snippet || ""}`) : [])
      ].join(" "))
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.memo);
}

function getRelevantSavedCollectionsForTask(contextText = "") {
  const taskTokens = tokenizeDashboardSourceText(contextText);
  return latestSavedCollections
    .map((collection) => ({
      collection,
      score: scoreDashboardSourceMatch(taskTokens, [
        collection.name,
        ...(Array.isArray(collection.tabs) ? collection.tabs.map((tab) => `${tab.title || ""} ${tab.hostname || ""}`) : []),
        ...(Array.isArray(collection.sources) ? collection.sources.map((source) => `${source.title || ""} ${source.hostname || ""} ${source.snippet || ""}`) : [])
      ].join(" "))
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.collection);
}

function buildTaskLocalContextText(task = {}) {
  const checklist = normalizeDashboardChecklist(task.checklist);
  const checklistMeta = normalizeDashboardChecklistMeta(task.checklistMeta, checklist.length);
  return [
    task.title,
    task.sourcePrompt,
    ...checklist,
    ...checklistMeta.map((item) => item.sourceNote),
    ...(Array.isArray(task.tabs) ? task.tabs.map((tab) => `${tab.title || ""} ${tab.hostname || ""} ${tab.groupName || ""}`) : []),
    ...(Array.isArray(task.sources) ? task.sources.map((source) => `${source.title || ""} ${source.hostname || ""} ${source.snippet || ""}`) : [])
  ].join(" ");
}

function tokenizeDashboardSourceText(value = "") {
  return Array.from(new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !DASHBOARD_SOURCE_STOP_WORDS.has(token))
      .slice(0, 40)
  ));
}

function scoreDashboardSourceMatch(taskTokens = [], sourceText = "") {
  if (!taskTokens.length) return 0;
  const sourceTokens = new Set(tokenizeDashboardSourceText(sourceText));
  return taskTokens.reduce((score, token) => score + (sourceTokens.has(token) ? 1 : 0), 0);
}

function normalizeDashboardSuggestionKey(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function handleMemoryAction(event) {
  const button = event.target.closest("[data-memory-action]");
  if (!button) return;

  const row = button.closest("[data-memory-kind][data-memory-id]");
  const item = findMemoryItem(row?.dataset?.memoryKind, row?.dataset?.memoryId);

  if (!item) return;

  if (button.dataset.memoryAction === "focus") {
    await focusBrowserWorkSource(item);
    return;
  }

  if (button.dataset.memoryAction === "ask") {
    await askAboutMemoryItem(item);
  }
}

async function handleDashboardContinueAction(event) {
  const button = event.target.closest("[data-continue-action]");
  if (!button) return;

  const action = button.dataset.continueAction;

  if (action === "ask") {
    await askSidebarToContinueWorkspace();
    return;
  }

  if (action === "open-task") {
    const task = getOpenAgentTasks().find(hasOpenBrowserWorkSource);
    if (task) {
      await focusBrowserWorkSource(task);
    }
    return;
  }

  if (action === "open-later") {
    const laterTab = getLaterTabs()[0];
    if (laterTab) {
      await focusDashboardTabById(Number(laterTab.id || laterTab.tabId));
    }
    return;
  }

  if (action === "review-duplicates") {
    openDuplicateReviewSection();
  }
}

async function askSidebarToContinueWorkspace() {
  await setSidebarPendingPrompt({
    text: msg("continueWorkspacePrompt"),
    source: "dashboard-continue",
    createdAt: new Date().toISOString()
  });
  await openSidebarForDashboardContext(getDashboardContinueWindowId());
  showDashboardSelectionNotice(msg("continueSentToSidebar"));
}

function getDashboardContinueWindowId() {
  const task = getOpenAgentTasks().find(hasOpenBrowserWorkSource);
  const taskTabId = Array.isArray(task?.tabIds) ? Number(task.tabIds[0]) : NaN;
  const taskTab = findDashboardTab(taskTabId);
  const laterTab = getLaterTabs()[0];
  const activeTab = (latestRun?.snapshot?.tabs || []).find((tab) => tab.active);

  return toOptionalInteger(taskTab?.windowId || laterTab?.windowId || activeTab?.windowId);
}

async function focusDashboardTabById(tabId) {
  if (!Number.isInteger(tabId)) {
    showDashboardSelectionNotice(msg("noOpenSourceTab"));
    return;
  }

  const response = await chrome.runtime.sendMessage({
    type: "FOCUS_DASHBOARD_TAB",
    tabId
  });

  showDashboardSelectionNotice(response?.ok ? msg("browserWorkSourceFocused") : response?.error || msg("couldNotOpenTab"));
}

function openDuplicateReviewSection() {
  const section = document.querySelector("#duplicates");
  if (!section) return;

  section.hidden = false;
  section.open = true;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
  showDashboardSelectionNotice(msg("duplicatesOpened"));
}

function findBrowserWorkItem(kind, itemId) {
  const list = kind === "collection" ? latestSavedCollections : latestAgentTasks;
  return list.find((item) => String(item.id || "") === String(itemId || "")) || null;
}

function findMemoryItem(kind, itemId) {
  const normalizedKind = kind === "collection" ? "collection" : "memo";
  const list = normalizedKind === "collection" ? latestSavedCollections : latestSavedMemos;
  const item = list.find((candidate) => String(candidate.id || "") === String(itemId || "")) || null;
  return item ? { ...item, kind: normalizedKind } : null;
}

async function askAboutBrowserWorkItem(item) {
  const currentTabsById = new Map(
    (latestRun?.snapshot?.tabs || [])
      .map((tab) => [Number(tab.id), tab])
      .filter(([tabId]) => Number.isInteger(tabId))
  );
  const tabIds = Array.isArray(item.tabIds)
    ? item.tabIds.map((tabId) => Number(tabId)).filter((tabId) => currentTabsById.has(tabId))
    : [];

  if (!tabIds.length) {
    showDashboardSelectionNotice(msg("browserWorkTabsUnavailable"));
    return;
  }

  const tabs = tabIds.map((tabId) => currentTabsById.get(tabId)).filter(Boolean);
  const windowId = toOptionalInteger(tabs[0]?.windowId);
  const context = {
    ...buildSidebarSelectedTabsContext(tabs),
    title: item.title || item.name || msg("selectedTabsCollection"),
    source: "dashboard_workbench"
  };

  const openSidebarPromise = openSidebarForDashboardContext(windowId);
  await setSidebarContextFromDashboard(context);
  await openSidebarPromise;
  showDashboardSelectionNotice(msg("browserWorkSentToSidebar", [tabIds.length]));
}

async function askAboutMemoryItem(item) {
  const tabs = getOpenTabsForBrowserWorkItem(item);
  const context = buildSidebarMemoryContext(item, tabs);
  const windowId = toOptionalInteger(context.windowId || getDashboardContinueWindowId());
  const openSidebarPromise = openSidebarForDashboardContext(windowId);

  if (context.scope !== "memory") {
    await setSidebarContextFromDashboard(context);
  }

  await setSidebarPendingPrompt({
    text: msg("memoryAskPrompt", [getMemoryItemTitle(item)]),
    source: "dashboard-memory",
    createdAt: new Date().toISOString()
  });
  await openSidebarPromise;
  showDashboardSelectionNotice(msg("memorySentToSidebar"));
}

function buildSidebarMemoryContext(item = {}, tabs = []) {
  if (tabs.length > 1) {
    return {
      ...buildSidebarSelectedTabsContext(tabs),
      title: getMemoryItemTitle(item),
      source: "dashboard_memory"
    };
  }

  if (tabs.length === 1) {
    const tab = tabs[0];
    const group = findDashboardGroup(Number(tab.groupId));
    return {
      scope: "current_tab",
      tabId: Number(tab.id),
      windowId: toOptionalInteger(tab.windowId),
      title: tab.title || getMemoryItemTitle(item),
      hostname: tab.hostname || "",
      groupId: toOptionalInteger(tab.groupId),
      groupName: group?.name || tab.groupName || "",
      source: "dashboard_memory",
      updatedAt: new Date().toISOString()
    };
  }

  return {
    scope: "memory",
    title: getMemoryItemTitle(item),
    windowId: getDashboardContinueWindowId()
  };
}

async function focusBrowserWorkSource(item) {
  const firstTabId = Number(getOpenTabsForBrowserWorkItem(item)[0]?.id);

  if (!Number.isInteger(firstTabId)) {
    showDashboardSelectionNotice(msg("noOpenSourceTab"));
    return;
  }

  const response = await chrome.runtime.sendMessage({
    type: "FOCUS_DASHBOARD_TAB",
    tabId: firstTabId
  });

  showDashboardSelectionNotice(response?.ok ? msg("browserWorkSourceFocused") : response?.error || msg("couldNotOpenTab"));
}

function getOpenTabsForBrowserWorkItem(item = {}) {
  const currentTabsById = new Map(
    (latestRun?.snapshot?.tabs || [])
      .map((tab) => [Number(tab.id), tab])
      .filter(([tabId]) => Number.isInteger(tabId))
  );
  const tabIds = Array.isArray(item.tabIds)
    ? item.tabIds.map((tabId) => Number(tabId)).filter((tabId) => currentTabsById.has(tabId))
    : [];

  return tabIds.map((tabId) => currentTabsById.get(tabId)).filter(Boolean);
}

async function toggleBrowserWorkTaskDone(task) {
  const nextStatus = task.status === "done" ? "open" : "done";
  await updateBrowserWorkTask(task.id, (current) => ({
    ...current,
    status: nextStatus,
    completedAt: nextStatus === "done" ? new Date().toISOString() : "",
    updatedAt: new Date().toISOString()
  }));
  showDashboardSelectionNotice(nextStatus === "done" ? msg("todoMarkedDone") : msg("todoReopened"));
}

async function setDashboardTabWorkState(tab, requestedState) {
  const tabId = Number(tab?.id);
  if (!Number.isInteger(tabId)) return;

  const state = TAB_WORK_STATES.has(requestedState) ? requestedState : "";
  const previousState = getTabWorkState(tabId);
  const nextStates = { ...latestTabWorkStates };

  if (state) {
    nextStates[String(tabId)] = {
      state,
      tabId,
      title: String(tab.title || "").slice(0, 180),
      hostname: String(tab.hostname || "").slice(0, 120),
      path: String(tab.path || "").slice(0, 180),
      source: "dashboard_tab_row",
      updatedAt: new Date().toISOString()
    };
  } else {
    delete nextStates[String(tabId)];
  }

  latestTabWorkStates = normalizeTabWorkStates(nextStates);
  await chrome.storage.local.set({ [TAB_WORK_STATES_KEY]: latestTabWorkStates });

  if (state === "later" && previousState !== "later") {
    await createLaterTaskFromTab(tab);
  }

  renderGroups(latestRun?.groups || [], latestRun);
  renderDashboardContinue();
  showDashboardSelectionNotice(formatTabWorkStateNotice(state));
}

async function createLaterTaskFromTab(tab) {
  const safeTab = sanitizeTabForBrowserWork(tab);
  if (!Number.isInteger(safeTab.id)) return;

  const now = new Date().toISOString();
  const task = {
    id: `task-${Date.now()}`,
    title: msg("todoReviewLaterTab", [safeTab.hostname || safeTab.title || msg("currentTab")]),
    status: "open",
    source: "tab_work_state_later",
    createdAt: now,
    updatedAt: now,
    tabIds: [safeTab.id],
    tabs: [safeTab]
  };

  const nextTasks = [task, ...latestAgentTasks].slice(0, MAX_AGENT_ITEMS);
  await chrome.storage.local.set({ [AGENT_TASKS_KEY]: nextTasks });
  latestAgentTasks = nextTasks;
  renderAgentTasks();
  renderDashboardContinue();
}

function normalizeTabWorkStates(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const normalized = {};

  for (const [key, item] of Object.entries(source)) {
    const tabId = Number(item?.tabId ?? key);
    const state = String(item?.state || "");
    if (!Number.isInteger(tabId) || !TAB_WORK_STATES.has(state)) continue;

    normalized[String(tabId)] = {
      state,
      tabId,
      title: String(item?.title || "").slice(0, 180),
      hostname: String(item?.hostname || "").slice(0, 120),
      path: String(item?.path || "").slice(0, 180),
      source: String(item?.source || "").slice(0, 80),
      updatedAt: String(item?.updatedAt || "").slice(0, 40)
    };
  }

  return normalized;
}

function getTabWorkState(tabId) {
  const entry = latestTabWorkStates[String(Number(tabId))];
  return TAB_WORK_STATES.has(entry?.state) ? entry.state : "";
}

function formatTabWorkState(state) {
  if (state === "done") return msg("tabStateDone");
  if (state === "later") return msg("tabStateLater");
  if (state === "keep") return msg("tabStateKeep");
  return "";
}

function formatTabWorkStateNotice(state) {
  if (state === "done") return msg("tabStateMarkedDone");
  if (state === "later") return msg("tabStateSavedLater");
  if (state === "keep") return msg("tabStateMarkedKeep");
  return msg("tabStateCleared");
}

async function archiveBrowserWorkTask(task) {
  await updateBrowserWorkTask(task.id, (current) => ({
    ...current,
    status: "archived",
    archivedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  showDashboardSelectionNotice(msg("todoArchived"));
}

async function updateBrowserWorkTask(taskId, updater) {
  const nextTasks = latestAgentTasks.map((task) => (
    String(task.id || "") === String(taskId || "") ? updater(task) : task
  ));
  await chrome.storage.local.set({ [AGENT_TASKS_KEY]: nextTasks });
  latestAgentTasks = nextTasks;
  renderAgentTasks();
  renderDashboardContinue();
}

async function createTodoFromSelectedTabs() {
  const selectedTabs = getSelectedDashboardTabs();
  if (!selectedTabs.length) return;

  const task = {
    id: `task-${Date.now()}`,
    title: buildTodoTitle(selectedTabs),
    status: "open",
    source: "dashboard_selection",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tabIds: selectedTabs.map((tab) => Number(tab.id)).filter(Number.isInteger),
    tabs: selectedTabs.map(sanitizeTabForBrowserWork)
  };
  const nextTasks = [task, ...latestAgentTasks].slice(0, MAX_AGENT_ITEMS);
  await chrome.storage.local.set({ [AGENT_TASKS_KEY]: nextTasks });
  latestAgentTasks = nextTasks;
  renderAgentTasks();
  renderDashboardContinue();
  showDashboardSelectionNotice(msg("todoCreatedFromSelection", [selectedTabs.length]));
}

async function saveSelectedTabsAsCollection() {
  const selectedTabs = getSelectedDashboardTabs();
  if (!selectedTabs.length) return;

  const collection = {
    id: `collection-${Date.now()}`,
    name: buildCollectionName(selectedTabs),
    source: "dashboard_selection",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tabIds: selectedTabs.map((tab) => Number(tab.id)).filter(Number.isInteger),
    tabs: selectedTabs.map(sanitizeTabForBrowserWork)
  };
  const nextCollections = [collection, ...latestSavedCollections].slice(0, MAX_AGENT_ITEMS);
  await chrome.storage.local.set({ [SAVED_COLLECTIONS_KEY]: nextCollections });
  latestSavedCollections = nextCollections;
  renderSavedCollections();
  renderDashboardContinue();
  showDashboardSelectionNotice(msg("collectionSavedFromSelection", [selectedTabs.length]));
}

function sanitizeTabForBrowserWork(tab) {
  const group = findDashboardGroup(tab.groupId);
  return {
    id: Number(tab.id),
    windowId: Number(tab.windowId),
    groupId: Number.isInteger(Number(tab.groupId)) ? Number(tab.groupId) : null,
    groupName: String(group?.name || tab.groupTitle || "").slice(0, 120),
    title: String(tab.title || "").slice(0, 180),
    hostname: String(tab.hostname || "").slice(0, 120),
    path: String(tab.path || "").slice(0, 180),
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    audible: Boolean(tab.audible)
  };
}

function buildTodoTitle(tabs) {
  const groups = Array.from(new Set(tabs.map((tab) => findDashboardGroup(tab.groupId)?.name || tab.groupTitle).filter(Boolean)));
  if (groups.length === 1) return msg("todoReviewGroup", [groups[0]]);
  const host = mostCommonValue(tabs.map((tab) => tab.hostname).filter(Boolean));
  return host ? msg("todoReviewHostTabs", [host]) : msg("todoReviewSelectedTabs");
}

function buildCollectionName(tabs) {
  const groups = Array.from(new Set(tabs.map((tab) => findDashboardGroup(tab.groupId)?.name || tab.groupTitle).filter(Boolean)));
  if (groups.length === 1) return groups[0];
  const host = mostCommonValue(tabs.map((tab) => tab.hostname).filter(Boolean));
  return host || msg("selectedTabsCollection");
}

function mostCommonValue(values) {
  const counts = new Map();
  values.forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
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
  const isSelected = selectedDashboardTabIds.has(Number(tab.id));
  const workState = getTabWorkState(tab.id);
  const classes = [
    "dashboard-tabrow",
    tab.discarded ? "suspended" : "",
    tab.audible ? "audible" : "",
    workState ? `work-${workState}` : "",
    isSelected ? "selected-for-chat" : "",
    canDrag ? "draggable" : ""
  ].filter(Boolean).join(" ");
  const badges = [
    tab.active ? msg("currentTab") : "",
    tab.pinned ? msg("pinned") : "",
    tab.audible ? msg("audible") : "",
    tab.discarded ? msg("discarded") : "",
    workState ? formatTabWorkState(workState) : ""
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
      <label class="dashboard-tab-select" title="${escapeHtml(msg("selectTabForChat"))}">
        <input
          type="checkbox"
          data-tab-select
          ${isSelected ? "checked" : ""}
          aria-label="${escapeHtml(msg("selectTabForChat"))}: ${escapeHtml(title)}"
        />
      </label>
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
      ${renderTabWorkControl(tab, workState)}
      ${renderTabMoveControl(tab, currentGroup)}
    </div>
  `;
}

function renderTabWorkControl(tab, currentState = "") {
  const title = tab.title || msg("untitled");
  return `
    <details class="dashboard-tab-work">
      <summary>${escapeHtml(currentState ? formatTabWorkState(currentState) : msg("tabWorkState"))}</summary>
      <span>
        ${["done", "later", "keep"].map((state) => `
          <button
            class="mini-button"
            type="button"
            data-group-action="set-tab-work-state"
            data-tab-work-state="${escapeHtml(state)}"
            aria-label="${escapeHtml(formatTabWorkState(state))}: ${escapeHtml(title)}"
          >${escapeHtml(formatTabWorkState(state))}</button>
        `).join("")}
        ${currentState ? `
          <button
            class="mini-button quiet"
            type="button"
            data-group-action="set-tab-work-state"
            data-tab-work-state="clear"
            aria-label="${escapeHtml(msg("clearTabState"))}: ${escapeHtml(title)}"
          >${escapeHtml(msg("clearTabState"))}</button>
        ` : ""}
      </span>
    </details>
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
      (rule) => {
        const view = getRuleView(rule);

        return `
        <div class="rule-row ${escapeHtml(view.className)}">
          <div class="rule-icon" aria-hidden="true">${escapeHtml(view.badge)}</div>
          <span>
            <b>${escapeHtml(view.title)}</b>
            <small>${escapeHtml(view.meta)}</small>
            <em>${escapeHtml(view.boundary)}</em>
          </span>
          <div class="rule-actions">
            ${
              rule.type === "protected"
                ? ""
                : `<button class="mini-button" type="button" data-rule-action="edit" data-rule-id="${escapeHtml(rule.id)}">
                    ${escapeHtml(msg("edit"))}
                  </button>`
            }
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
      `;
      }
    )
    .join("");
}

function getRuleView(rule) {
  const pattern = rule.pattern || msg("untitled");
  const source = rule.createdFrom || msg("manual");
  const hitCopy = msg("hits", [rule.hitCount || 0]);
  const lastUsed = formatRuleLastUsed(rule.lastUsedAt);
  const isEnabled = rule.enabled !== false;
  const stateCopy = msg(isEnabled ? "ruleRunning" : "rulePaused");

  if (rule.type === "protected") {
    const scope = formatProtectionScope(rule.protectionScope);
    return {
      badge: isEnabled ? msg("protectRuleBadge") : msg("pausedRuleBadge"),
      className: "protected",
      title: msg("protectRuleTitle", [scope, pattern]),
      meta: [stateCopy, source, hitCopy, lastUsed].filter(Boolean).join(" · "),
      boundary: msg("protectRuleBoundary")
    };
  }

  return {
    badge: isEnabled ? msg("groupRuleBadge") : msg("pausedRuleBadge"),
    className: "classification",
    title: msg("classificationRuleTitle", [pattern, rule.targetGroupName || msg("misc")]),
    meta: [stateCopy, rule.type || msg("manual"), source, hitCopy, lastUsed].filter(Boolean).join(" · "),
    boundary: msg("classificationRuleBoundary")
  };
}

function formatProtectionScope(scope) {
  if (scope === "group") return msg("group");
  if (scope === "domain") return msg("domain");
  return msg("tabs");
}

function formatRuleLastUsed(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return msg("lastUsed", [date.toLocaleDateString()]);
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
