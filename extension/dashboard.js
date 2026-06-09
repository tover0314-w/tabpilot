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

const refreshButton = document.querySelector("#refreshButton");
const workspaceTitle = document.querySelector("#workspaceTitle");
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
const copyDiagnosticsButton = document.querySelector("#copyDiagnosticsButton");
const copyFeedbackButton = document.querySelector("#copyFeedbackButton");
const diagnosticsStatus = document.querySelector("#diagnosticsStatus");
const clearDataButton = document.querySelector("#clearDataButton");
const clearDataStatus = document.querySelector("#clearDataStatus");

applyI18n();

refreshButton.addEventListener("click", loadDashboard);
aiSettingsForm.addEventListener("submit", saveAISettings);
testAIButton.addEventListener("click", testAIConnection);
dashboardRules.addEventListener("click", handleRuleAction);
dashboardGroups.addEventListener("click", handleGroupAction);
copyDiagnosticsButton.addEventListener("click", copyDiagnosticSnapshot);
copyFeedbackButton.addEventListener("click", copyFeedbackTemplate);
clearDataButton.addEventListener("click", clearLocalData);

loadDashboard();
loadAISettings();

async function loadDashboard() {
  const result = await chrome.storage.local.get([CURRENT_RUN_KEY, USER_RULES_KEY]);
  renderDashboard(result[CURRENT_RUN_KEY], result[USER_RULES_KEY] || []);
}

function renderDashboard(run, rules = []) {
  if (!run || !["completed", "closed-restored", "undone"].includes(run.status)) {
    workspaceTitle.textContent = msg("noOrganizeResultYet");
    dashboardMetrics.innerHTML = "";
    dashboardGroups.innerHTML = `<p class="empty">${escapeHtml(msg("openSidePanelToPopulateDashboard"))}</p>`;
    dashboardDuplicates.innerHTML = `<p class="empty">${escapeHtml(msg("noDuplicateDataYet"))}</p>`;
    renderRules(rules);
    renderSettingsSnapshot({});
    return;
  }

  workspaceTitle.textContent = run.completedAt
    ? msg("latestResultWithDate", [new Date(run.completedAt).toLocaleString()])
    : msg("latestResult");
  renderMetrics(run.summary || {});
  renderGroups(run.groups || []);
  renderDuplicates(run.duplicateGroups || []);
  renderRules(rules);
  renderSettingsSnapshot(run.summary || {});
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
    <div class="row"><span>${escapeHtml(msg("pageBodyReading"))}</span><strong>${escapeHtml(msg("userTriggered"))}</strong></div>
    <div class="row"><span>${escapeHtml(msg("incognito"))}</span><strong>${escapeHtml(msg("off"))}</strong></div>
    <div class="row"><span>${escapeHtml(msg("cloudSync"))}</span><strong>${escapeHtml(msg("off"))}</strong></div>
  `;
}

function formatAIStatus(status) {
  if (status === "applied") return msg("deepSeekApplied");
  if (status === "not-configured") return msg("localRules");
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
    [msg("reviewDupes"), summary.reviewDuplicateGroups ?? "—"]
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

function renderGroups(groups) {
  if (!groups.length) {
    dashboardGroups.innerHTML = `<p class="empty">${escapeHtml(msg("noNativeGroupsLatest"))}</p>`;
    return;
  }

  dashboardGroups.innerHTML = groups
    .map(
      (group) => `
        <article class="dashboard-card editable-group-card" data-group-id="${escapeHtml(String(group.id))}">
          <div>
            <label>
              <span>${escapeHtml(msg("groupName"))}</span>
              <input data-group-title type="text" value="${escapeHtml(group.name)}" />
            </label>
            <p>${escapeHtml(group.reason || msg("builtInRule"))}</p>
          </div>
          <div class="group-edit-side">
            <strong>${escapeHtml(String(group.tabCount))}</strong>
            <select data-group-color>
              ${GROUP_COLORS.map(
                (color) => `<option value="${color}" ${color === group.color ? "selected" : ""}>${color}</option>`
              ).join("")}
            </select>
            <button class="secondary-button" type="button" data-group-action="apply">${escapeHtml(msg("apply"))}</button>
          </div>
        </article>
      `
    )
    .join("");
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
          <span>
            <b>${escapeHtml(rule.pattern)} → ${escapeHtml(rule.targetGroupName || msg("misc"))}</b>
            <small>${escapeHtml(rule.type)} · ${escapeHtml(rule.createdFrom || "manual")} · ${escapeHtml(rule.enabled === false ? msg("off") : msg("on"))} · ${escapeHtml(msg("hits", [rule.hitCount || 0]))}</small>
          </span>
          <div class="rule-actions">
            <button class="mini-button" type="button" data-rule-action="toggle" data-rule-id="${escapeHtml(rule.id)}">
              ${escapeHtml(rule.enabled === false ? msg("enable") : msg("disable"))}
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
