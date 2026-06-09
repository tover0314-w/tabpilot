import { applyI18n, msg } from "./i18n.js";
import { buildDiagnosticSnapshot, buildFeedbackTemplate } from "./diagnostics.js";

const CURRENT_RUN_KEY = "tabmosaic.currentRun";
const AI_SETTINGS_KEY = "tabmosaic.aiSettings";
const USER_RULES_KEY = "tabmosaic.userRules";
const ERROR_LOG_KEY = "tabmosaic.errorLog";
const DUPLICATE_SAFETY_AUDIT_KEY = "tabmosaic.duplicateSafetyAudit";
const GROUP_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan"];
const DEFAULT_AI_SETTINGS = {
  enabled: false,
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
  apiKey: ""
};
const GROUP_COLOR_CLASS = new Map(GROUP_COLORS.map((color, index) => [color, `g-${index}`]));

const refreshButton = document.querySelector("#refreshButton");
const workspaceRefreshButton = document.querySelector("#workspaceRefreshButton");
const organizeNowButton = document.querySelector("#organizeNowButton");
const workspaceTitle = document.querySelector("#workspaceTitle");
const workspaceSubtitle = document.querySelector("#workspaceSubtitle");
const sidebarWorkspaceLabel = document.querySelector("#sidebarWorkspaceLabel");
const sidebarWorkspaceName = document.querySelector("#sidebarWorkspaceName");
const sidebarWorkspaceMetric = document.querySelector("#sidebarWorkspaceMetric");
const rulesCountBadge = document.querySelector("#rulesCountBadge");
const rulesSubtitle = document.querySelector("#rulesSubtitle");
const allGroupsCount = document.querySelector("#allGroupsCount");
const aiGroupsCount = document.querySelector("#aiGroupsCount");
const ruleGroupsCount = document.querySelector("#ruleGroupsCount");
const dashboardMetrics = document.querySelector("#dashboardMetrics");
const dashboardGroups = document.querySelector("#dashboardGroups");
const dashboardDuplicates = document.querySelector("#dashboardDuplicates");
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

applyI18n();

refreshButton.addEventListener("click", loadDashboard);
workspaceRefreshButton.addEventListener("click", loadDashboard);
organizeNowButton.addEventListener("click", organizeFromDashboard);
aiSettingsForm.addEventListener("submit", saveAISettings);
testAIButton.addEventListener("click", testAIConnection);
clearAIKeyButton.addEventListener("click", clearAIKey);
dashboardRules.addEventListener("click", handleRuleAction);
dashboardGroups.addEventListener("click", handleGroupAction);
copyDiagnosticsButton.addEventListener("click", copyDiagnosticSnapshot);
copyFeedbackButton.addEventListener("click", copyFeedbackTemplate);
clearDataButton.addEventListener("click", clearLocalData);
document.querySelectorAll(".dashboard-nav-item").forEach((button) => {
  button.addEventListener("click", () => setActiveDashboardPage(button.dataset.page));
});
document.querySelectorAll(".dashboard-chip").forEach((button) => {
  button.addEventListener("click", () => setActiveGroupFilter(button.dataset.filter || "all"));
});

loadDashboard();
loadAISettings();

async function loadDashboard() {
  const result = await chrome.storage.local.get([CURRENT_RUN_KEY, USER_RULES_KEY]);
  renderDashboard(result[CURRENT_RUN_KEY], result[USER_RULES_KEY] || []);
}

function renderDashboard(run, rules = []) {
  latestRun = run || null;
  renderWorkspaceSidebar(run, rules);

  if (!run || !["completed", "closed-restored", "undone"].includes(run.status)) {
    workspaceTitle.textContent = msg("noOrganizeResultYet");
    workspaceSubtitle.textContent = msg("openSidePanelToPopulateDashboard");
    dashboardMetrics.innerHTML = "";
    dashboardGroups.innerHTML = `<p class="empty">${escapeHtml(msg("openSidePanelToPopulateDashboard"))}</p>`;
    dashboardDuplicates.innerHTML = `<p class="empty">${escapeHtml(msg("noDuplicateDataYet"))}</p>`;
    renderRules(rules);
    renderSettingsSnapshot({});
    renderGroupFilterCounts([], {});
    return;
  }

  workspaceTitle.textContent = run.completedAt
    ? msg("latestResultWithDate", [new Date(run.completedAt).toLocaleString()])
    : msg("latestResult");
  workspaceSubtitle.textContent = formatWorkspaceSubtitle(run);
  renderMetrics(run.summary || {});
  renderGroupFilterCounts(run.groups || [], run.summary || {});
  renderGroups(run.groups || [], run);
  renderDuplicates(run.duplicateGroups || []);
  renderRules(rules);
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
  document.querySelectorAll(".dashboard-chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filterName);
  });
}

async function organizeFromDashboard() {
  organizeNowButton.disabled = true;
  organizeNowButton.textContent = msg("organizing");
  workspaceTitle.textContent = msg("scanningTabs");
  workspaceSubtitle.textContent = msg("scanningAllNormalWindows");

  try {
    const response = await chrome.runtime.sendMessage({ type: "ORGANIZE_NOW" });
    if (!response?.ok) {
      workspaceSubtitle.textContent = response?.error || msg("scanDidNotFinish");
      return;
    }
    renderDashboard(response.run, await loadRules());
  } catch (error) {
    workspaceSubtitle.textContent = error?.message || msg("scanDidNotFinish");
  } finally {
    organizeNowButton.disabled = false;
    organizeNowButton.textContent = msg("organizeBrowser");
  }
}

async function loadRules() {
  const result = await chrome.storage.local.get(USER_RULES_KEY);
  return Array.isArray(result[USER_RULES_KEY]) ? result[USER_RULES_KEY] : [];
}

function renderWorkspaceSidebar(run, rules = []) {
  const summary = run?.summary || {};
  const tabCount = summary.tabCount ?? run?.snapshot?.tabs?.length;
  const windowCount = summary.windowCount ?? run?.snapshot?.windows?.length;
  const groupCount = summary.groupsCreated ?? run?.groups?.length;

  sidebarWorkspaceLabel.textContent = run?.source || "current";
  sidebarWorkspaceName.textContent = msg("currentWorkspace");
  sidebarWorkspaceMetric.textContent = run
    ? msg("workspaceSidebarMetric", [
        tabCount ?? "—",
        groupCount ?? "—",
        windowCount ?? "—"
      ])
    : msg("noOrganizeResultYet");
  rulesCountBadge.textContent = String(rules.length);
  rulesSubtitle.textContent = msg("rulesSubtitleWithCount", [
    rules.filter((rule) => rule.enabled !== false).length,
    rules.filter((rule) => rule.enabled === false).length
  ]);
}

function formatWorkspaceSubtitle(run) {
  const summary = run.summary || {};
  const tabCount = summary.tabCount ?? run.snapshot?.tabs?.length ?? "—";
  const windowCount = summary.windowCount ?? run.snapshot?.windows?.length ?? "—";
  const groupCount = run.groups?.length ?? summary.groupsCreated ?? "—";
  const completedAt = run.completedAt ? new Date(run.completedAt).toLocaleTimeString() : "—";
  return msg("workspaceSubtitle", [tabCount, groupCount, windowCount, completedAt]);
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

async function handleGroupAction(event) {
  const button = event.target.closest("[data-group-action]");
  if (!button || button.dataset.groupAction !== "apply") return;

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
    DUPLICATE_SAFETY_AUDIT_KEY
  ]);
  return buildDiagnosticSnapshot({
    manifest: chrome.runtime.getManifest(),
    run: result[CURRENT_RUN_KEY],
    rules: result[USER_RULES_KEY] || [],
    aiSettings: result[AI_SETTINGS_KEY] || {},
    errorLog: result[ERROR_LOG_KEY] || [],
    duplicateSafetyAudit: result[DUPLICATE_SAFETY_AUDIT_KEY] || [],
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

function renderMetrics(summary) {
  const metrics = [
    [msg("windows"), summary.windowCount ?? "—"],
    [msg("tabs"), summary.tabCount ?? "—"],
    [msg("groups"), summary.groupsCreated ?? "—"],
    [msg("moved"), summary.tabsMoved ?? "—"],
    [msg("closedDupes"), summary.safeDuplicatesClosed ?? "—"],
    [msg("reviewDupes"), summary.reviewDuplicateGroups ?? "—"],
    [msg("aiStatus"), formatAIStatus(summary.aiClassificationStatus || "not-configured")],
    [msg("aiGroups"), summary.aiGroupsSuggested ?? "—"]
  ];

  dashboardMetrics.innerHTML = metrics
    .map(
      ([label, value]) => `
        <article class="metric-card dashboard-metric-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(String(value))}</strong>
        </article>
      `
    )
    .join("");
}

function renderGroupFilterCounts(groups, summary) {
  const aiGroupCount = Number(summary.aiGroupsSuggested || 0);
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

  dashboardGroups.innerHTML = groups
    .map((group, index) => renderGroupCard(group, run, index))
    .join("");
}

function renderGroupCard(group, run, index) {
  const tabs = getTabsForGroup(group, run);
  const colorClass = GROUP_COLOR_CLASS.get(group.color) || "g-0";
  const sourceClass = isRuleGroup(group) ? "rule" : group.reason?.includes("manual") ? "manual" : "";

  return `
    <article class="dashboard-group-card ${index === 0 ? "active" : ""}" data-group-id="${escapeHtml(String(group.id))}">
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
        <div class="dashboard-group-actions">
          <span class="dashboard-source-tag ${escapeHtml(sourceClass)}">${escapeHtml(formatGroupSource(group))}</span>
          <select class="dashboard-color-select" data-group-color aria-label="${escapeHtml(msg("groupColor"))}">
            ${GROUP_COLORS.map(
              (color) => `<option value="${color}" ${color === group.color ? "selected" : ""}>${color}</option>`
            ).join("")}
          </select>
          <button class="dashboard-apply-button" type="button" data-group-action="apply">${escapeHtml(msg("apply"))}</button>
        </div>
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

  const visibleTabs = tabs.slice(0, 4);
  const hiddenCount = Math.max(0, tabs.length - visibleTabs.length);
  const rows = visibleTabs.map(renderGroupTabRow).join("");
  const moreRow = hiddenCount
    ? `
      <div class="dashboard-more-row">
        <span>${escapeHtml(msg("moreTabs", [hiddenCount]))}</span>
        <span>${escapeHtml(group.windowId ? msg("windowLabel", [group.windowId]) : msg("currentWorkspace"))}</span>
      </div>
    `
    : `
      <div class="dashboard-more-row compact">
        <span>${escapeHtml(msg("noMoreTabs"))}</span>
      </div>
    `;

  return `${rows}${moreRow}`;
}

function renderGroupTabRow(tab) {
  const classes = [
    "dashboard-tabrow",
    tab.discarded ? "suspended" : "",
    tab.audible ? "audible" : ""
  ].filter(Boolean).join(" ");
  const badges = [
    tab.active ? msg("currentTab") : "",
    tab.pinned ? msg("pinned") : "",
    tab.audible ? msg("audible") : "",
    tab.discarded ? msg("discarded") : ""
  ].filter(Boolean);

  return `
    <div class="${escapeHtml(classes)}">
      <span class="dashboard-favicon" aria-hidden="true">${escapeHtml(getFaviconLetter(tab))}</span>
      <span class="dashboard-tab-title" title="${escapeHtml(tab.hostname || "")}">
        ${escapeHtml(tab.title || msg("untitled"))}
      </span>
      <span class="dashboard-tab-host">${escapeHtml(tab.hostname || tab.path || "")}</span>
      <span class="dashboard-tab-badges">
        ${badges.map((badge) => `<span class="dashboard-tab-badge">${escapeHtml(badge)}</span>`).join("")}
      </span>
    </div>
  `;
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
  if (String(group.reason || "").toLowerCase().includes("ai")) return msg("aiStatus");
  if (String(group.reason || "").toLowerCase().includes("manual")) return msg("manual");
  return msg("localRules");
}

function isRuleGroup(group) {
  return String(group.reason || "").toLowerCase().includes("user rule");
}

function renderDuplicates(duplicates) {
  if (!duplicates.length) {
    dashboardDuplicates.innerHTML = `<p class="empty">${escapeHtml(msg("noDuplicateCandidatesLatest"))}</p>`;
    return;
  }

  dashboardDuplicates.innerHTML = duplicates
    .map((duplicate) => {
      const status = duplicate.reviewStatus || duplicate.action;

      return `
        <div class="row">
          <span>${escapeHtml(duplicate.label)} · ${escapeHtml(duplicate.type)} · ${escapeHtml(status)}</span>
          <strong>${escapeHtml(String(duplicate.tabCount))}</strong>
        </div>
      `;
    })
    .join("");
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
