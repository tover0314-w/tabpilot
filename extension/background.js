const CURRENT_RUN_KEY = "tabmosaic.currentRun";
const LAST_UNDO_KEY = "tabmosaic.lastUndo";
const LAST_CLOSED_TABS_KEY = "tabmosaic.lastClosedTabs";
const PRIVACY_ACCEPTED_KEY = "tabmosaic.privacyAccepted";
const AI_SETTINGS_KEY = "tabmosaic.aiSettings";
const PRIVATE_BETA_AI_SETTINGS_PATH = "private-beta-ai-settings.json";
const USER_RULES_KEY = "tabmosaic.userRules";
const CHAT_DRAFT_KEY = "tabmosaic.chatDraft";
const ERROR_LOG_KEY = "tabmosaic.errorLog";
const DUPLICATE_SAFETY_AUDIT_KEY = "tabmosaic.duplicateSafetyAudit";
const SAVED_WORKSPACES_KEY = "tabmosaic.savedWorkspaces";
const SIDEBAR_CONTEXT_KEY = "tabmosaic.sidebarContext";
const MAX_ERROR_LOG_ENTRIES = 12;
const MAX_DUPLICATE_SAFETY_AUDIT_ENTRIES = 20;
const MAX_SAVED_WORKSPACES = 12;
const LOCAL_DATA_KEYS = [
  CURRENT_RUN_KEY,
  LAST_UNDO_KEY,
  LAST_CLOSED_TABS_KEY,
  PRIVACY_ACCEPTED_KEY,
  AI_SETTINGS_KEY,
  USER_RULES_KEY,
  CHAT_DRAFT_KEY,
  ERROR_LOG_KEY,
  DUPLICATE_SAFETY_AUDIT_KEY,
  SAVED_WORKSPACES_KEY,
  SIDEBAR_CONTEXT_KEY
];
const DEFAULT_AI_SETTINGS = {
  enabled: false,
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
  apiKey: ""
};
let privateBetaAISettingsPromise = null;
const SUPPORTED_AI_HOSTNAME = "api.deepseek.com";
const AI_CONNECTION_TIMEOUT_MS = 8000;
const AI_CLASSIFICATION_TIMEOUT_MS = 12000;
const AI_AGENT_TIMEOUT_MS = 12000;
const MAX_AI_AGENT_TABS = 80;
const AI_AGENT_CONVERSATION_LIMIT = 4;
const AI_AGENT_ACTIONS = {
  open_dashboard: "open dashboard",
  organize_again: "organize again",
  restore_closed: "restore closed",
  review_duplicates: "what needs review",
  show_groups: "show groups"
};
const NO_GROUP_ID = -1;
const SENSITIVE_SUMMARY_TERMS = [
  "admin",
  "aws",
  "bank",
  "billing",
  "cloudflare",
  "finance",
  "health",
  "internal",
  "localhost",
  "medical",
  "password",
  "paypal",
  "stripe"
];
const QUESTION_STOP_WORDS = new Set([
  "about",
  "again",
  "current",
  "does",
  "from",
  "have",
  "into",
  "page",
  "please",
  "show",
  "that",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with"
]);
const SUPPORTED_GROUP_COLORS = new Set([
  "grey",
  "blue",
  "red",
  "yellow",
  "green",
  "pink",
  "purple",
  "cyan"
]);

chrome.action.onClicked.addListener((tab) => {
  organizeFromAction(tab).catch(async (error) => {
    await recordLocalError("ACTION_ORGANIZE", error);
    await publishRun({
      status: "error",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error: normalizeError(error)
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  if (message.type === "GET_CURRENT_RUN") {
    getCurrentRun()
      .then((run) => sendResponse({ ok: true, run }))
      .catch((error) => sendErrorResponse(sendResponse, "GET_CURRENT_RUN", error));
    return true;
  }

  if (message.type === "ORGANIZE_NOW") {
    organizeFromSidePanel(sender)
      .then((run) => sendResponse({ ok: true, run }))
      .catch((error) => sendErrorResponse(sendResponse, "ORGANIZE_NOW", error));
    return true;
  }

  if (message.type === "ACCEPT_PRIVACY_AND_ORGANIZE") {
    acceptPrivacyAndOrganize(message, sender)
      .then((run) => sendResponse({ ok: true, run }))
      .catch((error) => sendErrorResponse(sendResponse, "ACCEPT_PRIVACY_AND_ORGANIZE", error));
    return true;
  }

  if (message.type === "UNDO_LAST") {
    undoLastOrganize()
      .then((run) => sendResponse({ ok: true, run }))
      .catch((error) => sendErrorResponse(sendResponse, "UNDO_LAST", error));
    return true;
  }

  if (message.type === "RESTORE_CLOSED_DUPLICATES") {
    restoreClosedDuplicates()
      .then((run) => sendResponse({ ok: true, run }))
      .catch((error) => sendErrorResponse(sendResponse, "RESTORE_CLOSED_DUPLICATES", error));
    return true;
  }

  if (message.type === "CLOSE_REVIEW_DUPLICATE_TAB") {
    closeReviewDuplicateTab(message)
      .then((run) => sendResponse({ ok: true, run }))
      .catch((error) => sendErrorResponse(sendResponse, "CLOSE_REVIEW_DUPLICATE_TAB", error));
    return true;
  }

  if (message.type === "MARK_REVIEW_DUPLICATE_GROUP_KEPT") {
    markReviewDuplicateGroupKept(message)
      .then((run) => sendResponse({ ok: true, run }))
      .catch((error) => sendErrorResponse(sendResponse, "MARK_REVIEW_DUPLICATE_GROUP_KEPT", error));
    return true;
  }

  if (message.type === "PREVIEW_CHAT_REFINE") {
    previewChatRefine(message)
      .then((draft) => sendResponse({ ok: true, draft }))
      .catch((error) => sendErrorResponse(sendResponse, "PREVIEW_CHAT_REFINE", error));
    return true;
  }

  if (message.type === "ASK_TAB_AGENT") {
    askTabAgent(message)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendErrorResponse(sendResponse, "ASK_TAB_AGENT", error));
    return true;
  }

  if (message.type === "APPLY_CHAT_REFINE") {
    applyChatRefine(message)
      .then((run) => sendResponse({ ok: true, run }))
      .catch((error) => sendErrorResponse(sendResponse, "APPLY_CHAT_REFINE", error));
    return true;
  }

  if (message.type === "APPLY_DASHBOARD_GROUP_UPDATE") {
    applyDashboardGroupUpdate(message)
      .then((run) => sendResponse({ ok: true, run }))
      .catch((error) => sendErrorResponse(sendResponse, "APPLY_DASHBOARD_GROUP_UPDATE", error));
    return true;
  }

  if (message.type === "APPLY_DASHBOARD_TAB_MOVE") {
    applyDashboardTabMove(message)
      .then((run) => sendResponse({ ok: true, run }))
      .catch((error) => sendErrorResponse(sendResponse, "APPLY_DASHBOARD_TAB_MOVE", error));
    return true;
  }

  if (message.type === "FOCUS_DASHBOARD_TAB") {
    focusDashboardTab(message)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendErrorResponse(sendResponse, "FOCUS_DASHBOARD_TAB", error));
    return true;
  }

  if (message.type === "SAVE_CURRENT_WORKSPACE") {
    saveCurrentWorkspace(message)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendErrorResponse(sendResponse, "SAVE_CURRENT_WORKSPACE", error));
    return true;
  }

  if (message.type === "DELETE_SAVED_WORKSPACE") {
    deleteSavedWorkspace(message)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendErrorResponse(sendResponse, "DELETE_SAVED_WORKSPACE", error));
    return true;
  }

  if (message.type === "TEST_AI_CONNECTION") {
    testAIConnection(message)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendErrorResponse(sendResponse, "TEST_AI_CONNECTION", error));
    return true;
  }

  if (message.type === "CHECK_SUMMARY_PRIVACY") {
    getSummaryPrivacyCheck(message, sender)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendErrorResponse(sendResponse, "CHECK_SUMMARY_PRIVACY", error));
    return true;
  }

  if (message.type === "SUMMARIZE_CURRENT_TAB") {
    summarizeCurrentTab(message, sender)
      .then((summary) => sendResponse({ ok: true, summary }))
      .catch((error) => sendErrorResponse(sendResponse, "SUMMARIZE_CURRENT_TAB", error));
    return true;
  }

  if (message.type === "CLEAR_LOCAL_DATA") {
    clearLocalData()
      .then((run) => sendResponse({ ok: true, run }))
      .catch((error) => sendErrorResponse(sendResponse, "CLEAR_LOCAL_DATA", error));
    return true;
  }

  return false;
});

async function organizeFromAction(tab) {
  const activeWindowId = tab?.windowId;

  if (typeof activeWindowId === "number") {
    await chrome.sidePanel.open({ windowId: activeWindowId });
  }

  return runOrganizeIfAllowed({ activeWindowId, source: "action" });
}

async function organizeFromSidePanel(sender) {
  return runOrganizeIfAllowed({
    activeWindowId: sender?.tab?.windowId,
    source: "sidepanel"
  });
}

async function acceptPrivacyAndOrganize(message, sender) {
  await chrome.storage.local.set({ [PRIVACY_ACCEPTED_KEY]: true });

  return runOrganize({
    activeWindowId: message.activeWindowId ?? sender?.tab?.windowId,
    source: "privacy-onboarding"
  });
}

async function runOrganizeIfAllowed(context) {
  const isAccepted = await isPrivacyAccepted();

  if (!isAccepted) {
    return showPrivacyOnboarding(context);
  }

  return runOrganize(context);
}

async function isPrivacyAccepted() {
  const result = await chrome.storage.local.get(PRIVACY_ACCEPTED_KEY);
  return Boolean(result[PRIVACY_ACCEPTED_KEY]);
}

async function showPrivacyOnboarding({ activeWindowId, source }) {
  const run = {
    status: "privacy-onboarding",
    source,
    activeWindowId,
    startedAt: new Date().toISOString(),
    summary: {
      undoAvailable: false,
      closedTabsRestoreAvailable: false
    },
    message: "Review privacy basics before the first organize."
  };

  await publishRun(run);
  return run;
}

async function runOrganize({ activeWindowId, source }) {
  const startedAt = new Date().toISOString();

  await publishRun({
    status: "scanning",
    source,
    activeWindowId,
    startedAt,
    message: "Scanning all normal windows..."
  });

  const snapshot = await collectAllNormalWindowTabs();
  const duplicateGroups = detectDuplicateGroups(snapshot.tabs);
  const baseSummary = summarizeSnapshot(snapshot, duplicateGroups);
  const closePlan = buildSafeDuplicateClosePlan(duplicateGroups, snapshot.tabs);

  if (snapshot.tabs.length < 6) {
    const completedRun = {
      status: "completed",
      source,
      activeWindowId,
      startedAt,
      completedAt: new Date().toISOString(),
      snapshot: sanitizeSnapshotForRun(snapshot),
      duplicateGroups,
      summary: {
        ...baseSummary,
        groupsCreated: 0,
        tabsMoved: 0,
        safeDuplicatesClosed: 0,
        closedTabsRestoreAvailable: false,
        skippedReason: "tabs-too-few",
        undoAvailable: false
      },
      groups: []
    };

    await publishRun(completedRun);
    return completedRun;
  }

  await publishRun({
    status: "grouping",
    source,
    activeWindowId,
    startedAt,
    message: "Building native tab groups..."
  });

  const undoSnapshot = buildUndoSnapshot(snapshot);
  const userRules = await getUserRules();
  const userRuleClassification = classifyTabsWithUserRules(snapshot.tabs, userRules);
  const aiClassification = await classifyTabsWithAIIfConfigured(snapshot);
  const groupPlan = buildGroupPlan(snapshot, aiClassification.byTabId, userRuleClassification.byTabId);
  const validatedPlan = validateGroupPlan(groupPlan, snapshot);
  await chrome.storage.local.set({ [LAST_UNDO_KEY]: undoSnapshot });
  const applyResult = await applyGroupPlan(validatedPlan);
  const closeResult = await closeSafeDuplicates(closePlan);
  await updateUserRuleHitCounts(userRules, userRuleClassification.ruleHits);

  if (applyResult.groupsCreated === 0) {
    await chrome.storage.local.remove(LAST_UNDO_KEY);
  }

  const completedRun = {
    status: "completed",
    source,
    activeWindowId,
    startedAt,
    completedAt: new Date().toISOString(),
    snapshot: sanitizeSnapshotForRun(snapshot),
    duplicateGroups,
    summary: {
      ...baseSummary,
      groupsCreated: applyResult.groupsCreated,
      tabsMoved: applyResult.tabsMoved,
      skippedGroups: applyResult.skippedGroups,
      safeDuplicatesClosed: closeResult.closedTabs,
      safeDuplicatesSkipped: closeResult.skippedTabs,
      closedTabsRestoreAvailable: closeResult.closedTabs > 0,
      aiClassificationStatus: aiClassification.status,
      aiGroupsSuggested: aiClassification.groupCount,
      userRulesApplied: userRuleClassification.byTabId.size,
      undoAvailable: applyResult.groupsCreated > 0
    },
    groups: applyResult.groups
  };

  await publishRun(completedRun);
  return completedRun;
}

async function classifyTabsWithAIIfConfigured(snapshot) {
  const settings = await getAISettings();

  if (!settings.enabled || !settings.apiKey) {
    return { status: "not-configured", byTabId: new Map(), groupCount: 0 };
  }

  const tabs = snapshot.tabs
    .filter(canGroupTab)
    .slice(0, 120)
    .map((tab) => ({
      tabId: tab.id,
      title: tab.title,
      hostname: tab.hostname,
      path: tab.path,
      windowId: tab.windowId,
      active: tab.active,
      pinned: tab.pinned,
      audible: tab.audible,
      discarded: tab.discarded,
      existingGroup: tab.groupTitle || null
    }));

  if (!tabs.length) {
    return { status: "no-tabs", byTabId: new Map(), groupCount: 0 };
  }

  try {
    const output = await callOpenAICompatibleClassifier(settings, tabs);
    const byTabId = validateAIClassification(output, snapshot);
    return {
      status: byTabId.size ? "applied" : "empty",
      byTabId,
      groupCount: new Set(Array.from(byTabId.values()).map((item) => item.name)).size
    };
  } catch (error) {
    return {
      status: `fallback:${normalizeError(error).slice(0, 120)}`,
      byTabId: new Map(),
      groupCount: 0
    };
  }
}

async function getAISettings() {
  const result = await chrome.storage.local.get(AI_SETTINGS_KEY);
  const storedSettings = {
    ...DEFAULT_AI_SETTINGS,
    ...(result[AI_SETTINGS_KEY] || {})
  };

  if (storedSettings.enabled && storedSettings.apiKey) {
    return storedSettings;
  }

  const privateBetaSettings = await loadPrivateBetaAISettings();

  if (!privateBetaSettings?.apiKey) {
    return storedSettings;
  }

  return {
    ...storedSettings,
    ...privateBetaSettings,
    enabled: true,
    provider: "deepseek",
    source: "private-beta-config"
  };
}

async function loadPrivateBetaAISettings() {
  if (!privateBetaAISettingsPromise) {
    privateBetaAISettingsPromise = fetch(chrome.runtime.getURL(PRIVATE_BETA_AI_SETTINGS_PATH), {
      cache: "no-store"
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return sanitizePrivateBetaAISettings(await response.json());
      })
      .catch(() => null);
  }

  return privateBetaAISettingsPromise;
}

function sanitizePrivateBetaAISettings(settings = {}) {
  const apiKey = String(settings.apiKey || "").trim();

  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: normalizeAIBaseUrl(settings.baseUrl || DEFAULT_AI_SETTINGS.baseUrl),
    model: String(settings.model || DEFAULT_AI_SETTINGS.model).trim() || DEFAULT_AI_SETTINGS.model
  };
}

async function testAIConnection(message = {}) {
  const storedSettings = await getAISettings();
  const settings = {
    ...storedSettings,
    baseUrl: normalizeAIBaseUrl(message.baseUrl || storedSettings.baseUrl),
    model: String(message.model || storedSettings.model || DEFAULT_AI_SETTINGS.model).trim(),
    apiKey: String(message.apiKey || storedSettings.apiKey || "").trim()
  };

  if (!settings.apiKey) {
    throw new Error("API key is required before testing AI connection.");
  }

  const models = await fetchOpenAICompatibleModels(settings);
  const hasConfiguredModel = models.some((model) => model.id === settings.model);

  return {
    provider: settings.provider || "deepseek",
    baseUrl: settings.baseUrl,
    model: settings.model,
    modelAvailable: hasConfiguredModel,
    modelCount: models.length,
    checkedAt: new Date().toISOString(),
    privacy: {
      sentTabData: false,
      sentPageText: false,
      sentFullUrls: false
    }
  };
}

async function fetchOpenAICompatibleModels(settings) {
  const response = await fetchWithTimeout(
    `${normalizeAIBaseUrl(settings.baseUrl)}/models`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${settings.apiKey}`
      }
    },
    Number(settings.connectionTimeoutMs) || AI_CONNECTION_TIMEOUT_MS,
    "AI connection test timed out"
  );

  if (!response.ok) {
    throw new Error(`AI connection test failed (${response.status})`);
  }

  const data = await response.json();
  const models = Array.isArray(data?.data) ? data.data : [];

  return models
    .map((model) => ({
      id: String(model?.id || "").trim()
    }))
    .filter((model) => model.id);
}

async function callOpenAICompatibleClassifier(settings, tabs, options = {}) {
  const baseUrl = normalizeAIBaseUrl(settings.baseUrl);
  const safeTabs = sanitizeTabsForAIClassification(tabs);
  const timeoutMs = Number(options.timeoutMs || settings.classificationTimeoutMs || AI_CLASSIFICATION_TIMEOUT_MS);
  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || DEFAULT_AI_SETTINGS.model,
        response_format: { type: "json_object" },
        max_tokens: 1800,
        messages: [
          {
            role: "system",
            content:
              "You classify browser tabs into task-oriented Chrome tab groups. Return only valid JSON. Do not invent tabIds. Use concise group names. Prefer office-work categories over domain-only names."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Classify these tabs into 4-10 useful work groups.",
              allowedColors: Array.from(SUPPORTED_GROUP_COLORS),
              schema: {
                groups: [
                  {
                    name: "string",
                    color: "grey|blue|red|yellow|green|pink|purple|cyan",
                    confidence: 0.0,
                    reason: "short string",
                    tabIds: [123]
                  }
                ],
                reviewTabIds: [123]
              },
              privacyNote: "Input contains title, hostname, path, and tab state only. No page body or full URL.",
              tabs: safeTabs
            })
          }
        ]
      })
    },
    timeoutMs,
    "AI classification timed out"
  );

  if (!response.ok) {
    throw new Error(`AI classification failed (${response.status})`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI classification returned no content");
  }

  return JSON.parse(content);
}

async function callOpenAICompatibleTabAgent(settings, { instruction, state, activeContext, conversationHistory, language }, options = {}) {
  const baseUrl = normalizeAIBaseUrl(settings.baseUrl);
  const timeoutMs = Number(options.timeoutMs || settings.agentTimeoutMs || AI_AGENT_TIMEOUT_MS);
  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || DEFAULT_AI_SETTINGS.model,
        response_format: { type: "json_object" },
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content:
              "You are TabMosaic's sidebar Tab Agent. Answer browser tab management questions using only the provided tab metadata, active sidebar context, short sanitized conversation history, and current group state. Use conversationHistory to resolve follow-up references like 'those tabs' or 'why that group'. Prioritize the active context when it is a current tab or group. Do not claim you read page bodies. Do not mention full URLs. Do not invent tabIds. Do not apply actions. Do not say you closed, moved, or changed tabs. If the user asks for destructive action, explain that confirmation is required. Return only valid JSON."
          },
          {
            role: "user",
            content: JSON.stringify({
              userMessage: instruction,
              language,
              privacyNote:
                "Input contains tab title, hostname, path, window id, protected state, current group state, active sidebar context, duplicate-review counts, and up to four sanitized recent sidebar chat turns only. No page body, page summaries, full URL, restore URL, favicon URL, cookies, form data, hidden DOM, browser history, saved workspace contents, or cloud memory is included.",
              schema: {
                answer: "short conversational answer",
                relevantTabIds: [123],
                suggestedNextSteps: ["short safe suggestion"],
                suggestedActions: [
                  {
                    type: "open_dashboard|organize_again|restore_closed|review_duplicates|show_groups",
                    reason: "short reason"
                  }
                ],
                actionDraft: {
                  type: "move_tabs",
                  groupName: "short Chrome group name",
                  tabIds: [123],
                  reason: "why these existing tabs belong together"
                },
                confidence: 0.0
              },
              actionDraftRules: [
                "Only include actionDraft when the user explicitly asks to move or regroup existing tabs.",
                "actionDraft may only use type move_tabs.",
                "actionDraft.tabIds must be existing tabIds from state.tabs.",
                "Never include close/delete actions.",
                "The browser will only change after the user clicks Apply."
              ],
              conversationHistory: sanitizeAIAgentConversation(conversationHistory),
              activeContext: activeContext || { scope: "browser" },
              state
            })
          }
        ]
      })
    },
    timeoutMs,
    "AI Agent answer timed out"
  );

  if (!response.ok) {
    throw new Error(`AI Agent answer failed (${response.status})`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI Agent returned no content");
  }

  return JSON.parse(content);
}

function validateAIAgentAnswer(output, state, options = {}) {
  const answer = String(output?.answer || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);

  if (!answer) {
    throw new Error("AI Agent returned an empty answer");
  }

  const tabById = new Map((state.tabs || []).map((tab) => [tab.tabId, tab]));
  const relevantTabIds = extractAIAgentRelevantTabIds(output)
    .filter((tabId) => tabById.has(tabId))
    .slice(0, 8);
  const nextSteps = (Array.isArray(output?.suggestedNextSteps) ? output.suggestedNextSteps : [])
    .map((step) => String(step || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((step) => step.slice(0, 160));
  const actionDraft = buildAIAgentActionDraft(output, {
    state,
    instruction: options.instruction || "",
    language: options.language || "en",
    answer,
    tabById
  });

  if (actionDraft) {
    return {
      status: "draft",
      provider: "deepseek",
      draft: actionDraft,
      privacy: {
        sentTabMetadata: true,
        sentPageText: false,
        sentFullUrls: false
      }
    };
  }

  return {
    status: "answered",
    provider: "deepseek",
    answer: addAIAgentSafetyNoteIfNeeded(answer),
    matchedTabs: relevantTabIds.map((tabId) => buildAIAgentMatchedTab(tabById.get(tabId))),
    matchedTabCount: relevantTabIds.length,
    nextSteps,
    actions: buildAIAgentActions(output, { nextSteps, state }),
    confidence: clamp(Number(output?.confidence || 0.6), 0, 1),
    privacy: {
      sentTabMetadata: true,
      sentPageText: false,
      sentFullUrls: false
    }
  };
}

function buildAIAgentActionDraft(output, { instruction = "", language = "en", answer = "", tabById = new Map() } = {}) {
  if (!isAIAgentActionRequest(instruction)) {
    return null;
  }

  const rawDraft = output?.actionDraft || output?.actionPlan;
  const type = normalizeAIAgentDraftType(rawDraft?.type || rawDraft?.action);

  if (type !== "move_tabs") {
    return null;
  }

  const groupName = cleanGroupName(rawDraft?.groupName || rawDraft?.targetGroupName || rawDraft?.name);
  const tabIds = extractAIAgentDraftTabIds(rawDraft)
    .filter((tabId) => tabById.has(tabId))
    .filter((tabId) => isAIAgentMovableTab(tabById.get(tabId)))
    .slice(0, 24);

  if (!groupName || !tabIds.length) {
    return null;
  }

  const fallbackAnswer = `I can move ${tabIds.length} existing tab(s) to ${groupName}.`;

  return {
    id: buildDraftId(`ai:${instruction}:${groupName}:${tabIds.join(",")}`),
    type: "move_tabs",
    createdAt: new Date().toISOString(),
    createdFrom: "ai-agent",
    instruction,
    answer: addAIAgentSafetyNoteIfNeeded(answer || fallbackAnswer),
    actionSummary: `Move ${tabIds.length} existing tab(s) to ${groupName}.`,
    groupName,
    groupColor: inferGroupColor(groupName),
    tabIds,
    matchedTabs: tabIds.map((tabId) => buildAIAgentMatchedTab(tabById.get(tabId))),
    matchedTabCount: tabIds.length,
    risk: "No browser changes happen until Apply. No tabs will be closed; page text and full URLs were not sent."
  };
}

function isAIAgentActionRequest(instruction) {
  const text = String(instruction || "").toLowerCase();
  return (
    /\b(move|put|place|group|regroup|sort|send)\b/.test(text) ||
    /放到|放进|归到|分到|移动|移到|重新分组|分组|整理到/.test(instruction)
  );
}

function normalizeAIAgentDraftType(type) {
  return String(type || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function extractAIAgentDraftTabIds(rawDraft) {
  const fromIds = Array.isArray(rawDraft?.tabIds) ? rawDraft.tabIds : [];
  const fromTabs = Array.isArray(rawDraft?.tabs)
    ? rawDraft.tabs.map((tab) => tab?.tabId ?? tab?.id)
    : [];
  const seen = new Set();
  const ids = [];

  for (const value of [...fromIds, ...fromTabs]) {
    const id = Number(value);
    if (!Number.isInteger(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return ids;
}

function isAIAgentMovableTab(tab) {
  return Boolean(tab && Number.isInteger(tab.tabId) && !tab.pinned);
}

function buildAIAgentActions(output, { nextSteps = [], state = {} } = {}) {
  const fromOutput = Array.isArray(output?.suggestedActions)
    ? output.suggestedActions.map((action) => action?.type || action?.action || action)
    : [];
  const inferred = inferAIAgentActionsFromText(nextSteps.join(" "));
  const fallback = state.groups?.length ? ["show_groups", "open_dashboard"] : ["open_dashboard"];
  const actions = [];
  const seen = new Set();

  for (const type of [...fromOutput, ...inferred, ...fallback]) {
    const normalized = normalizeAIAgentActionType(type);
    if (!normalized || seen.has(normalized)) continue;
    if (normalized === "restore_closed" && !state.summary?.closedTabsRestoreAvailable) continue;
    if (normalized === "review_duplicates" && !state.summary?.reviewDuplicateGroups) continue;

    seen.add(normalized);
    actions.push({
      type: normalized,
      command: AI_AGENT_ACTIONS[normalized]
    });

    if (actions.length >= 3) break;
  }

  return actions;
}

function inferAIAgentActionsFromText(text) {
  const value = String(text || "").toLowerCase();
  const actions = [];

  if (/dashboard|workbench|工作台/.test(value)) actions.push("open_dashboard");
  if (/organize|organise|整理/.test(value)) actions.push("organize_again");
  if (/restore|恢复/.test(value)) actions.push("restore_closed");
  if (/review|duplicate|重复|确认/.test(value)) actions.push("review_duplicates");
  if (/group|分组/.test(value)) actions.push("show_groups");

  return actions;
}

function normalizeAIAgentActionType(type) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return AI_AGENT_ACTIONS[normalized] ? normalized : "";
}

function extractAIAgentRelevantTabIds(output) {
  const fromIds = Array.isArray(output?.relevantTabIds) ? output.relevantTabIds : [];
  const fromTabs = Array.isArray(output?.relevantTabs)
    ? output.relevantTabs.map((tab) => tab?.tabId ?? tab?.id)
    : [];
  const seen = new Set();
  const ids = [];

  for (const value of [...fromIds, ...fromTabs]) {
    const id = Number(value);
    if (!Number.isInteger(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return ids;
}

function buildAIAgentMatchedTab(tab) {
  return {
    id: tab.tabId,
    title: tab.title,
    hostname: tab.hostname,
    path: tab.path,
    windowId: tab.windowId,
    active: tab.active,
    pinned: tab.pinned,
    audible: tab.audible
  };
}

function addAIAgentSafetyNoteIfNeeded(answer) {
  if (!/\b(i\s+(closed|moved|changed|deleted)|i'?ll\s+(close|move|delete)|closing now|moving now)\b/i.test(answer)) {
    return answer;
  }

  return `${answer} No browser changes have been applied from this answer.`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs, timeoutMessage) {
  const ms = Number(timeoutMs);
  if (!Number.isFinite(ms) || ms <= 0) {
    return fetch(url, options);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (controller.signal.aborted || error?.name === "AbortError") {
      throw new Error(timeoutMessage || "AI request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function sanitizeTabsForAIClassification(tabs) {
  return (Array.isArray(tabs) ? tabs : []).map((tab) => ({
    tabId: tab.tabId,
    title: String(tab.title || ""),
    hostname: String(tab.hostname || ""),
    path: String(tab.path || ""),
    windowId: tab.windowId,
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    audible: Boolean(tab.audible),
    discarded: Boolean(tab.discarded),
    existingGroup: tab.existingGroup || null
  }));
}

function normalizeAIBaseUrl(value) {
  const rawValue = String(value || DEFAULT_AI_SETTINGS.baseUrl).trim() || DEFAULT_AI_SETTINGS.baseUrl;
  let url;

  try {
    url = new URL(rawValue);
  } catch {
    throw new Error("Current beta supports only https://api.deepseek.com as the AI base URL.");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== SUPPORTED_AI_HOSTNAME ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Current beta supports only https://api.deepseek.com as the AI base URL.");
  }

  return url.toString().replace(/\/+$/, "");
}

function validateAIClassification(output, snapshot) {
  const validTabs = new Map(snapshot.tabs.filter(canGroupTab).map((tab) => [tab.id, tab]));
  const byTabId = new Map();
  const groups = Array.isArray(output?.groups) ? output.groups.slice(0, 12) : [];

  for (const group of groups) {
    const name = String(group?.name || "").trim().slice(0, 48);
    const color = SUPPORTED_GROUP_COLORS.has(group?.color) ? group.color : "grey";
    const confidence = clamp(Number(group?.confidence || 0.75), 0, 1);
    const reason = String(group?.reason || "AI classification").slice(0, 120);
    const tabIds = Array.isArray(group?.tabIds) ? group.tabIds : [];

    if (!name || confidence < 0.62) continue;

    for (const tabId of tabIds) {
      if (!validTabs.has(tabId) || byTabId.has(tabId)) continue;

      byTabId.set(tabId, {
        name,
        color,
        confidence,
        reason
      });
    }
  }

  return byTabId;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

async function clearLocalData() {
  const completedAt = new Date().toISOString();
  await chrome.storage.local.remove(LOCAL_DATA_KEYS);

  const run = {
    status: "idle",
    source: "clear-local-data",
    startedAt: completedAt,
    completedAt,
    message: "Local data cleared. The first-run privacy check will appear again before the next organize.",
    summary: {
      undoAvailable: false,
      closedTabsRestoreAvailable: false
    }
  };

  await publishRun(run);
  return run;
}

async function saveCurrentWorkspace(message = {}) {
  const result = await chrome.storage.local.get([CURRENT_RUN_KEY, SAVED_WORKSPACES_KEY]);
  const run = result[CURRENT_RUN_KEY];

  if (!isWorkspaceSaveableRun(run)) {
    throw new Error("Organize the browser before saving a workspace.");
  }

  const workspace = buildSavedWorkspace(run, {
    source: message.source || "dashboard"
  });
  const previousWorkspaces = Array.isArray(result[SAVED_WORKSPACES_KEY])
    ? result[SAVED_WORKSPACES_KEY]
    : [];
  const nextWorkspaces = [workspace, ...previousWorkspaces]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, MAX_SAVED_WORKSPACES);

  await chrome.storage.local.set({ [SAVED_WORKSPACES_KEY]: nextWorkspaces });

  return {
    workspace,
    workspaces: nextWorkspaces
  };
}

async function deleteSavedWorkspace(message = {}) {
  const workspaceId = String(message.workspaceId || "");

  if (!workspaceId) {
    throw new Error("A saved workspace id is required.");
  }

  const result = await chrome.storage.local.get(SAVED_WORKSPACES_KEY);
  const workspaces = Array.isArray(result[SAVED_WORKSPACES_KEY])
    ? result[SAVED_WORKSPACES_KEY]
    : [];
  const nextWorkspaces = workspaces.filter((workspace) => workspace?.id !== workspaceId);

  if (nextWorkspaces.length === workspaces.length) {
    throw new Error("This saved workspace was not found.");
  }

  await chrome.storage.local.set({ [SAVED_WORKSPACES_KEY]: nextWorkspaces });

  return {
    deletedWorkspaceId: workspaceId,
    workspaces: nextWorkspaces
  };
}

function isWorkspaceSaveableRun(run) {
  return Boolean(
    run &&
      ["completed", "closed-restored", "undone"].includes(run.status) &&
      Array.isArray(run.groups) &&
      Array.isArray(run.snapshot?.tabs)
  );
}

function buildSavedWorkspace(run, { source = "dashboard", now = new Date() } = {}) {
  const savedAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const groups = sanitizeWorkspaceGroups(run.groups || []);
  const tabs = sanitizeWorkspaceTabs(run.snapshot?.tabs || []);
  const summary = sanitizeWorkspaceSummary(run.summary || {}, {
    tabCount: tabs.length,
    groupCount: groups.length
  });

  return {
    id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: buildWorkspaceName(groups, savedAt),
    createdAt: savedAt,
    updatedAt: savedAt,
    source: String(source || "dashboard").slice(0, 32),
    summary,
    groups,
    tabs
  };
}

function buildWorkspaceName(groups, savedAt) {
  const groupNames = groups.map((group) => group.name).filter(Boolean).slice(0, 2);

  if (groupNames.length) {
    return groupNames.join(" + ").slice(0, 72);
  }

  return `Workspace ${savedAt.slice(0, 10)}`;
}

function sanitizeWorkspaceGroups(groups) {
  return groups.slice(0, 32).map((group) => ({
    id: Number.isInteger(Number(group.id)) ? Number(group.id) : NO_GROUP_ID,
    windowId: Number.isInteger(Number(group.windowId)) ? Number(group.windowId) : 0,
    name: cleanGroupName(group.name || group.title || "Untitled Group") || "Untitled Group",
    color: SUPPORTED_GROUP_COLORS.has(group.color) ? group.color : "grey",
    tabCount: nonNegativeInt(group.tabCount),
    reason: String(group.reason || "").slice(0, 80),
    tabIds: Array.isArray(group.tabIds) ? group.tabIds.map((id) => Number(id)).filter(Number.isInteger) : []
  }));
}

function sanitizeWorkspaceTabs(tabs) {
  return tabs.slice(0, 400).map((tab) => ({
    id: Number.isInteger(Number(tab.id)) ? Number(tab.id) : 0,
    windowId: Number.isInteger(Number(tab.windowId)) ? Number(tab.windowId) : 0,
    index: nonNegativeInt(tab.index),
    title: String(tab.title || "Untitled").slice(0, 160),
    hostname: String(tab.hostname || "").slice(0, 120),
    path: String(tab.path || "").slice(0, 160),
    groupId: Number.isInteger(tab.groupId) ? tab.groupId : NO_GROUP_ID,
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    audible: Boolean(tab.audible),
    discarded: Boolean(tab.discarded)
  }));
}

function sanitizeWorkspaceSummary(summary, fallback = {}) {
  return {
    tabCount: nonNegativeInt(summary.tabCount ?? fallback.tabCount),
    groupCount: nonNegativeInt(fallback.groupCount),
    windowCount: nonNegativeInt(summary.windowCount),
    safeDuplicatesClosed: nonNegativeInt(summary.safeDuplicatesClosed),
    reviewDuplicateGroups: nonNegativeInt(summary.reviewDuplicateGroups),
    aiClassificationStatus: String(summary.aiClassificationStatus || "not-configured").slice(0, 48)
  };
}

async function previewChatRefine(message) {
  const instruction = normalizeInstruction(message.text);

  if (!instruction) {
    throw new Error("Tell TabMosaic what to fix, for example: GitHub PR to Code Review.");
  }

  const snapshot = await collectAllNormalWindowTabs();
  const draft = buildChatRefineDraft(instruction, snapshot);

  await chrome.storage.local.set({ [CHAT_DRAFT_KEY]: draft });
  return draft;
}

async function askTabAgent(message = {}) {
  const instruction = normalizeInstruction(message.text);

  if (!instruction) {
    throw new Error("Ask TabMosaic something about the latest tab context.");
  }

  const settings = await getAISettings();

  if (!settings.enabled || !settings.apiKey) {
    return { status: "not-configured" };
  }

  const run = await getCurrentRun();
  const state = buildAIAgentState(run);
  const activeContext = sanitizeAIAgentContext(message.context, state);
  const conversationHistory = sanitizeAIAgentConversation(message.conversationHistory);

  if (!state.tabs.length) {
    return { status: "no-context" };
  }

  try {
    const output = await callOpenAICompatibleTabAgent(settings, {
      instruction,
      state,
      activeContext,
      conversationHistory,
      language: "en"
    });
    const result = validateAIAgentAnswer(output, state, {
      instruction,
      language: "en"
    });

    if (result.status === "draft" && result.draft) {
      await chrome.storage.local.set({ [CHAT_DRAFT_KEY]: result.draft });
    }

    return result;
  } catch (error) {
    return {
      status: "fallback",
      error: normalizeError(error).slice(0, 120)
    };
  }
}

function buildAIAgentState(run) {
  const tabs = sanitizeAIAgentTabs(run?.snapshot?.tabs || []);
  const tabGroupNameById = buildAIAgentTabGroupMap(run);

  return {
    summary: sanitizeAIAgentSummary(run?.summary || {}),
    groups: sanitizeAIAgentGroups(run?.groups || []),
    duplicateReview: sanitizeAIAgentDuplicateReview(run?.duplicateGroups || []),
    tabs: tabs.map((tab) => ({
      ...tab,
      groupName: tabGroupNameById.get(tab.tabId) || ""
    }))
  };
}

function sanitizeAIAgentContext(context, state = {}) {
  if (!context || typeof context !== "object") {
    return { scope: "browser" };
  }

  const scope = ["current_tab", "current_group", "current_window", "workspace", "browser"].includes(context.scope)
    ? context.scope
    : "browser";
  const tabIds = Array.isArray(context.tabIds)
    ? Array.from(new Set(context.tabIds.map((tabId) => Number(tabId)).filter(Number.isInteger)))
    : [];
  const validTabIds = new Set((state.tabs || []).map((tab) => tab.tabId));
  const filteredTabIds = tabIds.filter((tabId) => validTabIds.has(tabId)).slice(0, 40);
  const tabId = Number(context.tabId);

  return {
    scope,
    tabId: Number.isInteger(tabId) && validTabIds.has(tabId) ? tabId : null,
    groupId: toOptionalInteger(context.groupId),
    windowId: toOptionalInteger(context.windowId),
    title: String(context.title || "").slice(0, 120),
    hostname: String(context.hostname || "").slice(0, 120),
    groupName: String(context.groupName || "").slice(0, 100),
    tabCount: nonNegativeInt(context.tabCount || filteredTabIds.length),
    tabIds: filteredTabIds
  };
}

function sanitizeAIAgentConversation(history) {
  return (Array.isArray(history) ? history : [])
    .map((entry) => {
      const role = entry?.role === "assistant" ? "assistant" : entry?.role === "user" ? "user" : "";
      const text = sanitizeAIAgentConversationText(entry?.text);

      return role && text ? { role, text } : null;
    })
    .filter(Boolean)
    .slice(-AI_AGENT_CONVERSATION_LIMIT);
}

function sanitizeAIAgentConversationText(value) {
  return String(value || "")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted-token]")
    .replace(/\bsk-[A-Za-z0-9_-]{6,}\b/g, "[redacted-api-key]")
    .replace(/\b(?:https?|file|chrome|chrome-extension|edge|brave):\/\/[^\s"'<>]+/gi, redactConversationUrl)
    .replace(/([?&](?:token|key|api_key|apikey|access_token|auth|session|code|secret)=)[^\s&]+/gi, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function redactConversationUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.hostname ? `[redacted URL: ${url.hostname}]` : "[redacted URL]";
  } catch {
    return "[redacted URL]";
  }
}

function toOptionalInteger(value) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function buildAIAgentTabGroupMap(run) {
  const map = new Map();

  for (const group of Array.isArray(run?.groups) ? run.groups : []) {
    const name = String(group?.name || "").slice(0, 80);
    for (const tabId of Array.isArray(group?.tabIds) ? group.tabIds : []) {
      if (Number.isInteger(Number(tabId)) && name) {
        map.set(Number(tabId), name);
      }
    }
  }

  return map;
}

function sanitizeAIAgentSummary(summary) {
  return {
    tabCount: nonNegativeInt(summary.tabCount),
    windowCount: nonNegativeInt(summary.windowCount),
    groupsCreated: nonNegativeInt(summary.groupsCreated),
    tabsMoved: nonNegativeInt(summary.tabsMoved),
    safeDuplicatesClosed: nonNegativeInt(summary.safeDuplicatesClosed),
    reviewDuplicateGroups: nonNegativeInt(summary.reviewDuplicateGroups),
    closedTabsRestoreAvailable: Boolean(summary.closedTabsRestoreAvailable),
    aiClassificationStatus: String(summary.aiClassificationStatus || "not-configured").slice(0, 60),
    userRulesApplied: nonNegativeInt(summary.userRulesApplied)
  };
}

function sanitizeAIAgentGroups(groups) {
  return (Array.isArray(groups) ? groups : []).slice(0, 20).map((group) => ({
    name: String(group?.name || "Untitled Group").slice(0, 80),
    color: SUPPORTED_GROUP_COLORS.has(group?.color) ? group.color : "grey",
    tabCount: nonNegativeInt(group?.tabCount),
    tabIds: Array.isArray(group?.tabIds)
      ? group.tabIds.map((tabId) => Number(tabId)).filter(Number.isInteger).slice(0, 80)
      : [],
    reason: String(group?.reason || "").slice(0, 120)
  }));
}

function sanitizeAIAgentDuplicateReview(duplicateGroups) {
  return (Array.isArray(duplicateGroups) ? duplicateGroups : [])
    .filter((group) => group?.action === "review" && group?.reviewStatus !== "kept")
    .slice(0, 12)
    .map((group) => ({
      type: String(group?.type || "duplicate").slice(0, 40),
      label: String(group?.label || "Duplicate candidates").slice(0, 120),
      tabCount: nonNegativeInt(group?.tabCount || group?.tabIds?.length),
      tabIds: Array.isArray(group?.tabIds)
        ? group.tabIds.map((tabId) => Number(tabId)).filter(Number.isInteger).slice(0, 20)
        : []
    }));
}

function sanitizeAIAgentTabs(tabs) {
  return (Array.isArray(tabs) ? tabs : [])
    .filter((tab) => Number.isInteger(Number(tab?.id)))
    .slice(0, MAX_AI_AGENT_TABS)
    .map((tab) => ({
      tabId: Number(tab.id),
      title: String(tab.title || "Untitled").slice(0, 160),
      hostname: String(tab.hostname || "").slice(0, 120),
      path: String(tab.path || "").slice(0, 160),
      windowId: Number.isInteger(Number(tab.windowId)) ? Number(tab.windowId) : 0,
      active: Boolean(tab.active),
      pinned: Boolean(tab.pinned),
      audible: Boolean(tab.audible),
      discarded: Boolean(tab.discarded),
      protectedReasons: Array.isArray(tab.protectedReasons)
        ? tab.protectedReasons.map((reason) => String(reason).slice(0, 32)).slice(0, 4)
        : []
    }));
}

async function applyChatRefine(message) {
  const draftId = String(message.draftId || "");
  const result = await chrome.storage.local.get(CHAT_DRAFT_KEY);
  const draft = result[CHAT_DRAFT_KEY];

  if (!draft || draft.id !== draftId) {
    throw new Error("This chat action is no longer available. Preview it again.");
  }

  if (draft.type === "create_rule_and_move") {
    return applyRuleAndMoveDraft(draft);
  }

  if (draft.type === "move_tabs") {
    return applyMoveTabsDraft(draft);
  }

  if (draft.type === "rename_group") {
    return applyRenameGroupDraft(draft);
  }

  throw new Error("This chat action type is not supported yet.");
}

async function applyDashboardGroupUpdate(message) {
  const startedAt = new Date().toISOString();
  const groupId = Number(message.groupId);
  const title = cleanGroupName(message.title);
  const color = SUPPORTED_GROUP_COLORS.has(message.color) ? message.color : "grey";

  if (!Number.isInteger(groupId)) {
    throw new Error("A valid group id is required.");
  }

  if (!title) {
    throw new Error("Group name is required.");
  }

  const snapshot = await collectAllNormalWindowTabs();
  const group = (snapshot.groups || []).find((item) => item.id === groupId);

  if (!group) {
    throw new Error("This Chrome tab group is no longer available.");
  }

  await chrome.storage.local.set({ [LAST_UNDO_KEY]: buildUndoSnapshot(snapshot) });

  try {
    await chrome.tabGroups.update(groupId, {
      title,
      color,
      collapsed: Boolean(group.collapsed)
    });
  } catch (error) {
    await chrome.storage.local.remove(LAST_UNDO_KEY);
    throw error;
  }

  const previousRun = await getCurrentRun();
  const latestSnapshot = await collectAllNormalWindowTabs();
  const duplicateGroups = previousRun.duplicateGroups || detectDuplicateGroups(latestSnapshot.tabs);
  const baseSummary = summarizeSnapshot(latestSnapshot, duplicateGroups);
  const previousSummary = previousRun.summary || {};
  const run = {
    ...previousRun,
    status: "completed",
    source: "dashboard-apply",
    startedAt,
    completedAt: new Date().toISOString(),
    message: `Updated ${title} in the browser.`,
    snapshot: sanitizeSnapshotForRun(latestSnapshot),
    duplicateGroups,
    summary: {
      ...previousSummary,
      ...baseSummary,
      undoAvailable: true,
      dashboardApplies: Number(previousSummary.dashboardApplies || 0) + 1
    },
    groups: buildDisplayGroupsFromSnapshot(latestSnapshot, previousRun.groups || []),
    dashboardActions: [
      ...(previousRun.dashboardActions || []),
      {
        type: "update_group",
        groupId,
        previousTitle: group.title,
        title,
        previousColor: group.color,
        color,
        appliedAt: new Date().toISOString()
      }
    ]
  };

  await publishRun(run);
  return run;
}

async function applyDashboardTabMove(message) {
  const startedAt = new Date().toISOString();
  const tabId = Number(message.tabId);
  const targetGroupId = Number(message.targetGroupId);

  if (!Number.isInteger(tabId) || !Number.isInteger(targetGroupId)) {
    throw new Error("A valid tab and target group are required.");
  }

  const snapshot = await collectAllNormalWindowTabs();
  const tab = (snapshot.tabs || []).find((item) => item.id === tabId);
  const targetGroup = (snapshot.groups || []).find((group) => group.id === targetGroupId);

  if (!tab || !canGroupTab(tab)) {
    throw new Error("This tab is no longer available for grouping.");
  }

  if (!targetGroup) {
    throw new Error("The target Chrome tab group is no longer available.");
  }

  if (tab.groupId === targetGroupId) {
    throw new Error("This tab is already in that group.");
  }

  if (tab.windowId !== targetGroup.windowId) {
    throw new Error("Dashboard can only move tabs between groups in the same window.");
  }

  await chrome.storage.local.set({ [LAST_UNDO_KEY]: buildUndoSnapshot(snapshot) });

  try {
    await chrome.tabs.group({
      tabIds: [tabId],
      groupId: targetGroupId
    });
  } catch (error) {
    await chrome.storage.local.remove(LAST_UNDO_KEY);
    throw error;
  }

  const previousRun = await getCurrentRun();
  const latestSnapshot = await collectAllNormalWindowTabs();
  const duplicateGroups = previousRun.duplicateGroups || detectDuplicateGroups(latestSnapshot.tabs);
  const baseSummary = summarizeSnapshot(latestSnapshot, duplicateGroups);
  const previousSummary = previousRun.summary || {};
  const run = {
    ...previousRun,
    status: "completed",
    source: "dashboard-apply",
    startedAt,
    completedAt: new Date().toISOString(),
    message: `Moved one tab to ${targetGroup.title || "Untitled Group"} from Dashboard.`,
    snapshot: sanitizeSnapshotForRun(latestSnapshot),
    duplicateGroups,
    summary: {
      ...previousSummary,
      ...baseSummary,
      tabsMoved: Number(previousSummary.tabsMoved || 0) + 1,
      undoAvailable: true,
      dashboardApplies: Number(previousSummary.dashboardApplies || 0) + 1,
      dashboardTabsMoved: Number(previousSummary.dashboardTabsMoved || 0) + 1
    },
    groups: buildDisplayGroupsFromSnapshot(latestSnapshot, previousRun.groups || []),
    dashboardActions: [
      ...(previousRun.dashboardActions || []),
      {
        type: "move_tab",
        tabId,
        previousGroupId: tab.groupId,
        targetGroupId,
        targetGroupTitle: targetGroup.title || "Untitled Group",
        appliedAt: new Date().toISOString()
      }
    ]
  };

  await publishRun(run);
  return run;
}

async function focusDashboardTab(message) {
  const tabId = Number(message.tabId);

  if (!Number.isInteger(tabId)) {
    throw new Error("A valid tab id is required.");
  }

  const tab = await chrome.tabs.get(tabId);

  if (!tab || tab.incognito) {
    throw new Error("This tab is no longer available.");
  }

  await chrome.tabs.update(tabId, { active: true });

  if (typeof tab.windowId === "number") {
    await chrome.windows.update(tab.windowId, { focused: true });
  }

  return {
    tabId,
    windowId: tab.windowId
  };
}

function buildChatRefineDraft(instruction, snapshot) {
  const currentTabDraft = buildCurrentTabMoveDraft(instruction, snapshot);
  if (currentTabDraft) return currentTabDraft;

  const ruleDraft = buildRuleAndMoveDraft(instruction, snapshot);
  if (ruleDraft) return ruleDraft;

  const renameDraft = buildRenameGroupDraft(instruction, snapshot);
  if (renameDraft) return renameDraft;

  throw new Error(
    "I can handle examples like: GitHub PR to Code Review, docs.google.com to Docs & Notes, current tab to Reading, or rename Misc to Reading."
  );
}

function buildRuleAndMoveDraft(instruction, snapshot) {
  const githubPrRule = buildGitHubPrRuleDraft(instruction, snapshot);
  if (githubPrRule) return githubPrRule;

  const domainRule = buildDomainRuleDraft(instruction, snapshot);
  if (domainRule) return domainRule;

  return null;
}

function buildGitHubPrRuleDraft(instruction, snapshot) {
  const lower = instruction.toLowerCase();

  if (!lower.includes("github") || !/\b(pr|pull|pull request)\b/.test(lower)) {
    return null;
  }

  const groupName = extractTargetGroupName(instruction, "Code Review");
  const rule = buildUserRule({
    type: "url_pattern",
    pattern: "github.com/*/*/pull/*",
    targetGroupName: groupName,
    targetGroupColor: inferGroupColor(groupName),
    createdFrom: "chat",
    reason: "GitHub pull requests should stay together."
  });
  const matchedTabs = snapshot.tabs.filter((tab) => canGroupTab(tab) && ruleMatchesTab(rule, tab));

  return buildRuleDraft({
    instruction,
    rule,
    matchedTabs,
    answer: `I can create a rule for GitHub pull requests and move ${matchedTabs.length} matching tabs now.`
  });
}

function buildDomainRuleDraft(instruction, snapshot) {
  const groupName = extractTargetGroupName(instruction, "");
  const hostname = findMentionedHostname(instruction, snapshot);

  if (!hostname || !groupName) {
    return null;
  }

  const rule = buildUserRule({
    type: "domain",
    pattern: hostname,
    targetGroupName: groupName,
    targetGroupColor: inferGroupColor(groupName),
    createdFrom: "chat",
    reason: `${hostname} should go to ${groupName}.`
  });
  const matchedTabs = snapshot.tabs.filter((tab) => canGroupTab(tab) && ruleMatchesTab(rule, tab));

  return buildRuleDraft({
    instruction,
    rule,
    matchedTabs,
    answer: `I can create a rule for ${hostname} and move ${matchedTabs.length} matching tabs now.`
  });
}

function buildCurrentTabMoveDraft(instruction, snapshot) {
  const lower = instruction.toLowerCase();
  const mentionsCurrentTab =
    lower.includes("current tab") ||
    lower.includes("this tab") ||
    instruction.includes("当前标签页") ||
    instruction.includes("当前 tab") ||
    instruction.includes("这个标签页") ||
    instruction.includes("这个 tab") ||
    instruction.includes("当前页") ||
    instruction.includes("当前页面") ||
    instruction.includes("这个页面") ||
    instruction.includes("这一页");

  if (!mentionsCurrentTab) return null;

  const groupName = extractTargetGroupName(instruction, "");
  if (!groupName) return null;

  const activeTab =
    snapshot.tabs.find((tab) => tab.active && snapshot.windows.some((window) => window.id === tab.windowId && window.focused)) ||
    snapshot.tabs.find((tab) => tab.active);

  if (!activeTab || !canGroupTab(activeTab)) {
    throw new Error("The current tab cannot be moved into a group.");
  }

  return {
    id: buildDraftId(instruction),
    type: "move_tabs",
    createdAt: new Date().toISOString(),
    instruction,
    answer: `I can move the current tab to ${groupName}.`,
    actionSummary: `Move 1 tab to ${groupName}.`,
    groupName,
    groupColor: inferGroupColor(groupName),
    tabIds: [activeTab.id],
    matchedTabs: [sanitizeTabPreview(activeTab)],
    risk: getChatRefineRisk(instruction)
  };
}

function buildRenameGroupDraft(instruction, snapshot) {
  const parsed = parseRenameInstruction(instruction);
  if (!parsed) return null;

  const matchedGroups = (snapshot.groups || []).filter(
    (group) => normalizeComparable(group.title) === normalizeComparable(parsed.oldName)
  );

  if (!matchedGroups.length) {
    throw new Error(`I could not find a group named ${parsed.oldName}.`);
  }

  return {
    id: buildDraftId(instruction),
    type: "rename_group",
    createdAt: new Date().toISOString(),
    instruction,
    answer: `I can rename ${matchedGroups.length} group(s) from ${parsed.oldName} to ${parsed.newName}.`,
    actionSummary: `Rename ${matchedGroups.length} group(s) to ${parsed.newName}.`,
    oldName: parsed.oldName,
    newName: parsed.newName,
    groupColor: inferGroupColor(parsed.newName),
    groupIds: matchedGroups.map((group) => group.id),
    risk: "No tabs will be moved or closed. Page content will not be read."
  };
}

function buildRuleDraft({ instruction, rule, matchedTabs, answer }) {
  return {
    id: buildDraftId(instruction),
    type: "create_rule_and_move",
    createdAt: new Date().toISOString(),
    instruction,
    answer,
    actionSummary: `Create rule ${rule.pattern} -> ${rule.targetGroupName}. Move ${matchedTabs.length} current tabs.`,
    rule,
    groupName: rule.targetGroupName,
    groupColor: rule.targetGroupColor,
    matchedTabs: matchedTabs.slice(0, 20).map(sanitizeTabPreview),
    matchedTabCount: matchedTabs.length,
    risk: getChatRefineRisk(instruction, { storesRule: true })
  };
}

async function applyRuleAndMoveDraft(draft) {
  const startedAt = new Date().toISOString();
  const snapshot = await collectAllNormalWindowTabs();
  const matchedTabs = snapshot.tabs.filter((tab) => canGroupTab(tab) && ruleMatchesTab(draft.rule, tab));
  const undoSnapshot = buildUndoSnapshot(snapshot);

  if (matchedTabs.length) {
    await chrome.storage.local.set({ [LAST_UNDO_KEY]: undoSnapshot });
  }

  const savedRule = await upsertUserRule(draft.rule, matchedTabs.length);
  const applyResult = matchedTabs.length
    ? await applyGroupPlan(buildMoveTabsPlan(matchedTabs, draft.groupName, draft.groupColor, "User chat rule"))
    : { groupsCreated: 0, tabsMoved: 0, skippedGroups: 0, groups: [] };

  if (matchedTabs.length && applyResult.groupsCreated === 0) {
    await chrome.storage.local.remove(LAST_UNDO_KEY);
  }

  const run = await buildChatRefineCompletedRun({
    startedAt,
    snapshot,
    applyResult,
    action: {
      type: "create_rule_and_move",
      instruction: draft.instruction,
      ruleId: savedRule.id,
      rulePattern: savedRule.pattern,
      targetGroupName: savedRule.targetGroupName,
      matchedTabCount: matchedTabs.length
    },
    message: `Created a local rule and moved ${applyResult.tabsMoved} matching tabs.`
  });

  await chrome.storage.local.remove(CHAT_DRAFT_KEY);
  await publishRun(run);
  return run;
}

async function applyMoveTabsDraft(draft) {
  const startedAt = new Date().toISOString();
  const snapshot = await collectAllNormalWindowTabs();
  const liveTabIds = new Set(snapshot.tabs.map((tab) => tab.id));
  const matchedTabs = snapshot.tabs.filter((tab) => draft.tabIds.includes(tab.id) && liveTabIds.has(tab.id) && canGroupTab(tab));

  if (!matchedTabs.length) {
    throw new Error("The tab to move is no longer available.");
  }

  await chrome.storage.local.set({ [LAST_UNDO_KEY]: buildUndoSnapshot(snapshot) });
  const applyResult = await applyGroupPlan(buildMoveTabsPlan(matchedTabs, draft.groupName, draft.groupColor, "User chat move"));

  if (applyResult.groupsCreated === 0) {
    await chrome.storage.local.remove(LAST_UNDO_KEY);
  }

  const run = await buildChatRefineCompletedRun({
    startedAt,
    snapshot,
    applyResult,
    action: {
      type: "move_tabs",
      instruction: draft.instruction,
      targetGroupName: draft.groupName,
      matchedTabCount: matchedTabs.length
    },
    message: `Moved ${applyResult.tabsMoved} tab(s) to ${draft.groupName}.`
  });

  await chrome.storage.local.remove(CHAT_DRAFT_KEY);
  await publishRun(run);
  return run;
}

async function applyRenameGroupDraft(draft) {
  const startedAt = new Date().toISOString();
  const snapshot = await collectAllNormalWindowTabs();
  const matchedGroups = (snapshot.groups || []).filter((group) => draft.groupIds.includes(group.id));

  if (!matchedGroups.length) {
    throw new Error("The group to rename is no longer available.");
  }

  await chrome.storage.local.set({ [LAST_UNDO_KEY]: buildUndoSnapshot(snapshot) });

  let renamedGroups = 0;
  for (const group of matchedGroups) {
    try {
      await chrome.tabGroups.update(group.id, {
        title: draft.newName,
        color: draft.groupColor
      });
      renamedGroups += 1;
    } catch {
      // Continue renaming the remaining matching groups.
    }
  }

  if (renamedGroups === 0) {
    await chrome.storage.local.remove(LAST_UNDO_KEY);
  }

  const run = await buildChatRefineCompletedRun({
    startedAt,
    snapshot,
    applyResult: {
      groupsCreated: 0,
      tabsMoved: 0,
      skippedGroups: matchedGroups.length - renamedGroups,
      groups: []
    },
    action: {
      type: "rename_group",
      instruction: draft.instruction,
      oldName: draft.oldName,
      newName: draft.newName,
      renamedGroups
    },
    message: `Renamed ${renamedGroups} group(s) to ${draft.newName}.`
  });

  await chrome.storage.local.remove(CHAT_DRAFT_KEY);
  await publishRun(run);
  return run;
}

async function buildChatRefineCompletedRun({ startedAt, snapshot, applyResult, action, message }) {
  const previousRun = await getCurrentRun();
  const latestSnapshot = await collectAllNormalWindowTabs();
  const duplicateGroups = previousRun.duplicateGroups || detectDuplicateGroups(latestSnapshot.tabs);
  const baseSummary = summarizeSnapshot(latestSnapshot, duplicateGroups);
  const previousSummary = previousRun.summary || {};
  const hasUndoableBrowserChange =
    applyResult.groupsCreated > 0 || applyResult.tabsMoved > 0 || Number(action.renamedGroups || 0) > 0;

  return {
    ...previousRun,
    status: "completed",
    source: "chat-refine",
    startedAt,
    completedAt: new Date().toISOString(),
    message,
    snapshot: sanitizeSnapshotForRun(latestSnapshot),
    duplicateGroups,
    summary: {
      ...previousSummary,
      ...baseSummary,
      groupsCreated: Number(previousSummary.groupsCreated || 0) + applyResult.groupsCreated,
      tabsMoved: Number(previousSummary.tabsMoved || 0) + applyResult.tabsMoved,
      skippedGroups: Number(previousSummary.skippedGroups || 0) + applyResult.skippedGroups,
      undoAvailable: Boolean(previousSummary.undoAvailable || hasUndoableBrowserChange),
      chatRefineApplied: Number(previousSummary.chatRefineApplied || 0) + 1,
      chatRefineTabsMoved: Number(previousSummary.chatRefineTabsMoved || 0) + applyResult.tabsMoved
    },
    groups: buildDisplayGroupsFromSnapshot(latestSnapshot, mergeAppliedGroups(previousRun.groups || [], applyResult.groups || [])),
    chatActions: [
      ...(previousRun.chatActions || []),
      {
        ...action,
        appliedAt: new Date().toISOString()
      }
    ]
  };
}

function buildDisplayGroupsFromSnapshot(snapshot, fallbackGroups = []) {
  if (!snapshot.groups?.length) {
    return fallbackGroups;
  }

  const tabCountByGroupId = new Map();
  const tabIdsByGroupId = new Map();
  for (const tab of snapshot.tabs || []) {
    if (tab.groupId === NO_GROUP_ID) continue;
    tabCountByGroupId.set(tab.groupId, (tabCountByGroupId.get(tab.groupId) || 0) + 1);
    const tabIds = tabIdsByGroupId.get(tab.groupId) || [];
    tabIds.push(tab.id);
    tabIdsByGroupId.set(tab.groupId, tabIds);
  }

  return snapshot.groups
    .map((group) => ({
      id: group.id,
      windowId: group.windowId,
      name: group.title || "Untitled Group",
      color: group.color || "grey",
      tabCount: tabCountByGroupId.get(group.id) || 0,
      tabIds: tabIdsByGroupId.get(group.id) || [],
      reason: "Current Chrome group",
      confidence: 1
    }))
    .filter((group) => group.tabCount > 0);
}

function buildMoveTabsPlan(tabs, groupName, color, reason) {
  const byWindow = new Map();

  for (const tab of tabs) {
    if (!byWindow.has(tab.windowId)) {
      byWindow.set(tab.windowId, []);
    }

    byWindow.get(tab.windowId).push(tab.id);
  }

  return Array.from(byWindow.entries()).map(([windowId, tabIds]) => ({
    windowId,
    name: groupName,
    color,
    confidence: 1,
    reason,
    tabIds
  }));
}

function mergeAppliedGroups(existingGroups, newGroups) {
  const merged = new Map();

  for (const group of [...existingGroups, ...newGroups]) {
    const key = group.id || `${group.windowId}:${group.name}`;
    const previous = merged.get(key);
    merged.set(key, previous ? { ...previous, ...group } : group);
  }

  return Array.from(merged.values());
}

async function getUserRules() {
  const result = await chrome.storage.local.get(USER_RULES_KEY);
  return Array.isArray(result[USER_RULES_KEY]) ? result[USER_RULES_KEY] : [];
}

async function upsertUserRule(rule, hitCountDelta = 0) {
  const rules = await getUserRules();
  const now = new Date().toISOString();
  const existingIndex = rules.findIndex((item) => item.id === rule.id);
  const existingRule = existingIndex >= 0 ? rules[existingIndex] : null;
  const nextRule = {
    ...existingRule,
    ...rule,
    enabled: true,
    updatedAt: now,
    hitCount: Number(existingRule?.hitCount || 0) + hitCountDelta,
    lastUsedAt: hitCountDelta > 0 ? now : existingRule?.lastUsedAt
  };

  if (existingIndex >= 0) {
    rules[existingIndex] = nextRule;
  } else {
    rules.push(nextRule);
  }

  await chrome.storage.local.set({ [USER_RULES_KEY]: sortUserRules(rules) });
  return nextRule;
}

async function updateUserRuleHitCounts(rules, ruleHits) {
  if (!ruleHits.size) return;

  const now = new Date().toISOString();
  const updatedRules = rules.map((rule) => {
    const hitCount = ruleHits.get(rule.id) || 0;

    if (!hitCount) return rule;

    return {
      ...rule,
      hitCount: Number(rule.hitCount || 0) + hitCount,
      lastUsedAt: now,
      updatedAt: now
    };
  });

  await chrome.storage.local.set({ [USER_RULES_KEY]: sortUserRules(updatedRules) });
}

function classifyTabsWithUserRules(tabs, rules) {
  const enabledRules = sortUserRules(rules).filter((rule) => rule.enabled !== false);
  const byTabId = new Map();
  const ruleHits = new Map();

  for (const tab of tabs) {
    if (!canGroupTab(tab)) continue;

    for (const rule of enabledRules) {
      if (!ruleMatchesTab(rule, tab)) continue;

      byTabId.set(tab.id, {
        name: rule.targetGroupName,
        color: SUPPORTED_GROUP_COLORS.has(rule.targetGroupColor) ? rule.targetGroupColor : inferGroupColor(rule.targetGroupName),
        confidence: 1,
        reason: `User rule: ${rule.pattern}`
      });
      ruleHits.set(rule.id, (ruleHits.get(rule.id) || 0) + 1);
      break;
    }
  }

  return { byTabId, ruleHits };
}

function ruleMatchesTab(rule, tab) {
  if (!rule || !tab) return false;

  if (rule.type === "domain") {
    const pattern = normalizeHostname(rule.pattern);
    const host = normalizeHostname(tab.hostname);
    return host === pattern || host.endsWith(`.${pattern}`);
  }

  if (rule.type === "url_pattern") {
    const target = `${normalizeHostname(tab.hostname)}${tab.path || "/"}`;
    return wildcardToRegExp(rule.pattern).test(target);
  }

  if (rule.type === "title_keyword") {
    return tab.title.toLowerCase().includes(String(rule.pattern || "").toLowerCase());
  }

  return false;
}

function buildUserRule({ type, pattern, targetGroupName, targetGroupColor, createdFrom, reason }) {
  const normalizedPattern = String(pattern || "").trim();
  const normalizedGroup = cleanGroupName(targetGroupName) || "Misc";

  return {
    id: `rule_${simpleHash(`${type}:${normalizedPattern}`)}`,
    type,
    pattern: normalizedPattern,
    targetGroupName: normalizedGroup,
    targetGroupColor: SUPPORTED_GROUP_COLORS.has(targetGroupColor) ? targetGroupColor : inferGroupColor(normalizedGroup),
    priority: type === "url_pattern" ? 120 : 100,
    enabled: true,
    createdFrom,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hitCount: 0,
    reason
  };
}

function sortUserRules(rules) {
  return [...rules].sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0) || String(a.pattern).localeCompare(String(b.pattern)));
}

function extractTargetGroupName(instruction, fallback) {
  const patterns = [
    /(?:放到|放进|归到|分到|放在|移到|移进)\s*([^。！？!?,，;；]+)/i,
    /(?:都放|放)\s*([^。！？!?,，;；]+)/i,
    /(?:to|into|under)\s+([^。！？!?,，;；]+)/i
  ];

  for (const pattern of patterns) {
    const match = instruction.match(pattern);
    const groupName = cleanGroupName(match?.[1]);

    if (groupName) {
      return groupName;
    }
  }

  return fallback;
}

function cleanGroupName(value) {
  return String(value || "")
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/\s*(group|组|分组|里|里面)$/i, "")
    .trim()
    .slice(0, 48);
}

function findMentionedHostname(instruction, snapshot) {
  const lower = instruction.toLowerCase();
  const knownHosts = Array.from(new Set(snapshot.tabs.map((tab) => tab.hostname)))
    .filter((host) => host && host !== "unknown")
    .sort((a, b) => b.length - a.length);
  const knownHost = knownHosts.find((host) => lower.includes(host.toLowerCase()));

  if (knownHost) {
    return normalizeHostname(knownHost);
  }

  const domainMatch = lower.match(/\b([a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/i);
  return domainMatch ? normalizeHostname(domainMatch[1]) : "";
}

function parseRenameInstruction(instruction) {
  const englishMatch = instruction.match(/rename\s+(.+?)\s+(?:to|as)\s+(.+)/i);
  const chineseMatch = instruction.match(/把\s*(.+?)\s*(?:改名为|重命名为|重命名成|改成|改为|叫做|叫成)\s*(.+)/);
  const match = englishMatch || chineseMatch;

  if (!match) return null;

  const oldName = cleanGroupName(match[1]);
  const newName = cleanGroupName(match[2]);

  if (!oldName || !newName || normalizeComparable(oldName) === normalizeComparable(newName)) {
    return null;
  }

  return { oldName, newName };
}

function inferGroupColor(groupName) {
  const name = String(groupName || "").toLowerCase();

  if (name.includes("review") || name.includes("pr") || name.includes("评审") || name.includes("审查")) return "red";
  if (name.includes("doc") || name.includes("note") || name.includes("文档") || name.includes("笔记")) return "green";
  if (name.includes("design") || name.includes("设计")) return "pink";
  if (name.includes("research") || name.includes("analytics") || name.includes("研究") || name.includes("分析")) return "purple";
  if (name.includes("meeting") || name.includes("communication") || name.includes("会议") || name.includes("沟通")) return "cyan";
  if (name.includes("read") || name.includes("learning") || name.includes("阅读") || name.includes("学习")) return "yellow";
  if (name.includes("dev") || name.includes("code") || name.includes("开发") || name.includes("代码")) return "grey";

  return "blue";
}

function sanitizeTabPreview(tab) {
  return {
    id: tab.id,
    title: tab.title,
    hostname: tab.hostname,
    path: tab.path,
    windowId: tab.windowId,
    active: tab.active,
    pinned: tab.pinned,
    audible: tab.audible
  };
}

function buildDraftId(instruction) {
  return `draft_${Date.now()}_${simpleHash(instruction)}`;
}

function getChatRefineRisk(instruction, options = {}) {
  return options.storesRule
    ? "No tabs will be closed. Page content will not be read. The rule is stored locally."
    : "No tabs will be closed. Page content will not be read.";
}

function isChineseInstruction(value) {
  return /[\u3400-\u9fff]/.test(String(value || ""));
}

function normalizeInstruction(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 240);
}

function normalizeComparable(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeHostname(value) {
  return String(value || "").trim().toLowerCase().replace(/^www\./, "");
}

function wildcardToRegExp(pattern) {
  const escaped = String(pattern || "")
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");

  return new RegExp(`^${escaped}$`, "i");
}

async function restoreClosedDuplicates() {
  const startedAt = new Date().toISOString();
  const result = await chrome.storage.local.get(LAST_CLOSED_TABS_KEY);
  const restoreSnapshot = result[LAST_CLOSED_TABS_KEY];

  if (!restoreSnapshot?.closedTabs?.length) {
    throw new Error("No closed duplicate tabs are available to restore.");
  }

  await publishRun({
    status: "restoring-closed",
    startedAt,
    message: "Restoring closed duplicate tabs..."
  });

  const restoreResult = await restoreClosedTabsSnapshot(restoreSnapshot);
  await chrome.storage.local.remove(LAST_CLOSED_TABS_KEY);
  await appendDuplicateSafetyAudit({
    action: "restore_closed_tabs",
    requestedTabs: restoreSnapshot.closedTabs.length,
    restoredTabs: restoreResult.restoredTabs,
    failedTabs: restoreResult.failedTabs,
    restoredGroups: restoreResult.restoredGroups,
    autoClosedTabs: restoreSnapshot.closedTabs.filter((tab) => !tab.reviewed).length,
    reviewedClosedTabs: restoreSnapshot.closedTabs.filter((tab) => Boolean(tab.reviewed)).length
  });

  const completedRun = {
    status: "closed-restored",
    startedAt,
    completedAt: new Date().toISOString(),
    summary: {
      restoredClosedTabs: restoreResult.restoredTabs,
      restoreFailedTabs: restoreResult.failedTabs,
      restoredClosedGroups: restoreResult.restoredGroups,
      closedTabsRestoreAvailable: false
    }
  };

  await publishRun(completedRun);
  return completedRun;
}

async function closeReviewDuplicateTab(message) {
  const tabId = Number(message.tabId);

  if (!Number.isInteger(tabId)) {
    throw new Error("A valid tab id is required.");
  }

  const run = await getCurrentRun();
  const duplicateGroup = findReviewDuplicateGroupForTab(run, tabId);

  if (!duplicateGroup) {
    throw new Error("This tab is not in the current duplicate review list.");
  }

  const liveTab = await chrome.tabs.get(tabId);
  const rawUrl = liveTab.url || liveTab.pendingUrl || "";
  const parsedUrl = parseUrl(rawUrl);

  if (!canManuallyCloseReviewTab(liveTab, parsedUrl)) {
    throw new Error("This review tab is protected and cannot be closed.");
  }

  const snapshotTab = findSnapshotTab(run, tabId);
  const closedTab = {
    tabId,
    title: liveTab.title || snapshotTab?.title || "Untitled",
    url: rawUrl,
    windowId: liveTab.windowId,
    index: liveTab.index,
    groupName: snapshotTab?.groupTitle || "",
    groupColor: snapshotTab?.groupColor || "grey",
    pinned: Boolean(liveTab.pinned),
    active: Boolean(liveTab.active),
    closedAt: Date.now(),
    duplicateReason: duplicateGroup.type,
    duplicateLabel: duplicateGroup.label,
    keepTabId: null,
    reviewed: true
  };

  await appendClosedTabsSnapshot([closedTab]);

  try {
    await chrome.tabs.remove(tabId);
  } catch (error) {
    await removeClosedTabFromSnapshot(tabId, closedTab.closedAt);
    throw error;
  }

  await appendDuplicateSafetyAudit({
    action: "manual_review_close",
    requestedTabs: 1,
    closedTabs: 1,
    duplicateTypes: countDuplicateReasons([closedTab]),
    restoreAvailable: true
  });

  const completedRun = updateRunAfterReviewAction(run, {
    action: "closed",
    tabId,
    groupId: duplicateGroup.id,
    label: duplicateGroup.label,
    type: duplicateGroup.type,
    title: closedTab.title
  });

  await publishRun(completedRun);
  return completedRun;
}

async function markReviewDuplicateGroupKept(message) {
  const run = await getCurrentRun();
  const groupId = String(message.groupId || "");
  const duplicateGroup = (run.duplicateGroups || []).find(
    (group) => group.action === "review" && getDuplicateGroupId(group) === groupId
  );

  if (!duplicateGroup) {
    throw new Error("This duplicate review group is no longer available.");
  }

  const completedRun = updateRunAfterReviewAction(run, {
    action: "kept",
    groupId: getDuplicateGroupId(duplicateGroup),
    label: duplicateGroup.label,
    type: duplicateGroup.type,
    tabIds: duplicateGroup.tabIds
  });

  await publishRun(completedRun);
  return completedRun;
}

function findReviewDuplicateGroupForTab(run, tabId) {
  return (run.duplicateGroups || []).find(
    (group) =>
      group.action === "review" &&
      group.reviewStatus !== "kept" &&
      Array.isArray(group.tabIds) &&
      group.tabIds.includes(tabId)
  );
}

function findSnapshotTab(run, tabId) {
  return (run.snapshot?.tabs || []).find((tab) => tab.id === tabId);
}

function canManuallyCloseReviewTab(tab, parsedUrl) {
  return (
    typeof tab.id === "number" &&
    isRestorableUrl(tab.url || tab.pendingUrl || "", parsedUrl) &&
    !tab.active &&
    !tab.pinned &&
    !tab.audible &&
    !tab.incognito &&
    !isInternalScheme(parsedUrl.scheme)
  );
}

async function appendClosedTabsSnapshot(newClosedTabs) {
  const result = await chrome.storage.local.get(LAST_CLOSED_TABS_KEY);
  const previousSnapshot = result[LAST_CLOSED_TABS_KEY];
  const createdAt = previousSnapshot?.createdAt || new Date().toISOString();
  const closedTabs = [...(previousSnapshot?.closedTabs || []), ...newClosedTabs];

  await chrome.storage.local.set({
    [LAST_CLOSED_TABS_KEY]: {
      createdAt,
      updatedAt: new Date().toISOString(),
      closedTabs
    }
  });
}

async function removeClosedTabFromSnapshot(tabId, closedAt) {
  const result = await chrome.storage.local.get(LAST_CLOSED_TABS_KEY);
  const previousSnapshot = result[LAST_CLOSED_TABS_KEY];

  if (!previousSnapshot?.closedTabs?.length) return;

  const closedTabs = previousSnapshot.closedTabs.filter(
    (tab) => !(tab.tabId === tabId && tab.closedAt === closedAt)
  );

  if (!closedTabs.length) {
    await chrome.storage.local.remove(LAST_CLOSED_TABS_KEY);
    return;
  }

  await chrome.storage.local.set({
    [LAST_CLOSED_TABS_KEY]: {
      ...previousSnapshot,
      updatedAt: new Date().toISOString(),
      closedTabs
    }
  });
}

function updateRunAfterReviewAction(run, reviewAction) {
  const decidedAt = new Date().toISOString();
  const duplicateGroups = (run.duplicateGroups || [])
    .map((group) => updateDuplicateGroupAfterReviewAction(group, reviewAction))
    .filter((group) => group.action !== "review" || group.reviewStatus === "kept" || group.tabIds.length >= 2);
  const closedCount = reviewAction.action === "closed" ? 1 : 0;
  const previousSummary = run.summary || {};

  return {
    ...run,
    status: "completed",
    completedAt: decidedAt,
    snapshot: reviewAction.action === "closed" && run.snapshot
      ? {
          ...run.snapshot,
          tabs: (run.snapshot.tabs || []).filter((tab) => tab.id !== reviewAction.tabId)
        }
      : run.snapshot,
    duplicateGroups,
    summary: {
      ...previousSummary,
      tabCount: Math.max(0, Number(previousSummary.tabCount || 0) - closedCount),
      reviewDuplicateGroups: duplicateGroups.filter(
        (group) => group.action === "review" && group.reviewStatus !== "kept"
      ).length,
      reviewDuplicatesClosed: Number(previousSummary.reviewDuplicatesClosed || 0) + closedCount,
      reviewDuplicateGroupsKept:
        Number(previousSummary.reviewDuplicateGroupsKept || 0) + (reviewAction.action === "kept" ? 1 : 0),
      closedTabsRestoreAvailable: Boolean(previousSummary.closedTabsRestoreAvailable || closedCount > 0),
      lastReviewAction: reviewAction.action
    },
    reviewActions: [
      ...(run.reviewActions || []),
      {
        ...reviewAction,
        decidedAt
      }
    ],
    message:
      reviewAction.action === "closed"
        ? "Closed one review duplicate after manual confirmation."
        : "Marked one duplicate review group as kept."
  };
}

function updateDuplicateGroupAfterReviewAction(group, reviewAction) {
  if (reviewAction.groupId !== getDuplicateGroupId(group)) {
    return group;
  }

  if (reviewAction.action === "kept") {
    return {
      ...group,
      reviewStatus: "kept"
    };
  }

  if (reviewAction.action === "closed") {
    const tabIds = (group.tabIds || []).filter((tabId) => tabId !== reviewAction.tabId);
    return {
      ...group,
      tabIds,
      tabCount: tabIds.length,
      reviewStatus: tabIds.length >= 2 ? "pending" : "resolved"
    };
  }

  return group;
}

function getDuplicateGroupId(group) {
  return group.id || `${group.type}:${group.label}:${(group.tabIds || []).join("-")}`;
}

async function getSummaryPrivacyCheck(message, sender) {
  const tab = await getCurrentTabForSummary(message.activeWindowId ?? sender?.tab?.windowId);

  if (!tab?.id) {
    throw new Error("No active tab is available to summarize.");
  }

  const rawUrl = tab.url || tab.pendingUrl || "";
  const parsedUrl = parseUrl(rawUrl);

  return buildSummaryPrivacyCheck(tab, parsedUrl);
}

async function summarizeCurrentTab(message, sender) {
  const tab = await getCurrentTabForSummary(message.activeWindowId ?? sender?.tab?.windowId);
  const question = sanitizePageQuestion(message.question);

  if (!tab?.id) {
    throw new Error("No active tab is available to summarize.");
  }

  const rawUrl = tab.url || tab.pendingUrl || "";
  const parsedUrl = parseUrl(rawUrl);
  const privacyCheck = buildSummaryPrivacyCheck(tab, parsedUrl);

  if (!isRestorableUrl(rawUrl, parsedUrl)) {
    return {
      ...buildUnreadableSummary(tab, parsedUrl, "This page type cannot be read by the extension."),
      question
    };
  }

  if (
    privacyCheck.requiresConfirmation &&
    Number(message.confirmedSensitiveTabId) !== tab.id
  ) {
    return {
      ...buildSensitiveSummaryConfirmation(tab, parsedUrl, privacyCheck),
      question
    };
  }

  const [injectionResult] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractReadablePageContent
  });
  const page = injectionResult?.result;

  if (!page?.text && !page?.description && !page?.headings?.length) {
    return {
      ...buildUnreadableSummary(tab, parsedUrl, "I could not find readable visible content on this page."),
      question
    };
  }

  return buildLocalPageSummary({
    tab,
    parsedUrl,
    page,
    question
  });
}

async function getCurrentTabForSummary(activeWindowId) {
  if (typeof activeWindowId === "number") {
    const [tab] = await chrome.tabs.query({ active: true, windowId: activeWindowId });
    if (tab) return tab;
  }

  const [lastFocusedTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (lastFocusedTab) return lastFocusedTab;

  const [currentWindowTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return currentWindowTab;
}

function buildSummaryPrivacyCheck(tab, parsedUrl) {
  const reason = getSensitiveSummaryReason({
    title: tab.title || "",
    hostname: parsedUrl.hostname,
    path: parsedUrl.path,
    urlScheme: parsedUrl.scheme
  });

  return {
    tabId: tab.id,
    title: tab.title || "Untitled",
    hostname: parsedUrl.hostname,
    requiresConfirmation: Boolean(reason),
    reason: reason || ""
  };
}

function getSensitiveSummaryReason(tab) {
  const host = String(tab.hostname || "").toLowerCase();
  const path = String(tab.path || "").toLowerCase();
  const title = String(tab.title || "").toLowerCase();
  const text = `${host} ${path} ${title}`;

  if (tab.urlScheme && !["http", "https"].includes(tab.urlScheme)) {
    return "";
  }

  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
    return "local or internal page";
  }

  const term = SENSITIVE_SUMMARY_TERMS.find((item) => text.includes(item));
  return term ? `${term} context` : "";
}

function extractReadablePageContent() {
  const blockedSelectors = [
    "script",
    "style",
    "noscript",
    "template",
    "svg",
    "canvas",
    "iframe",
    "input",
    "textarea",
    "select",
    "button",
    "[hidden]",
    "[aria-hidden='true']"
  ];
  const clone = document.body ? document.body.cloneNode(true) : null;

  if (clone) {
    for (const node of clone.querySelectorAll(blockedSelectors.join(","))) {
      node.remove();
    }
  }

  const selectedText = String(window.getSelection?.() || "").trim().slice(0, 4000);
  const description =
    document.querySelector("meta[name='description']")?.content ||
    document.querySelector("meta[property='og:description']")?.content ||
    "";
  const headings = Array.from(document.querySelectorAll("h1,h2,h3"))
    .map((heading) => heading.innerText.trim())
    .filter(Boolean)
    .slice(0, 12);
  const main =
    document.querySelector("article") ||
    document.querySelector("main") ||
    clone;
  const text = normalizeExtractedText((selectedText || main?.innerText || clone?.innerText || "").slice(0, 24000));

  return {
    title: document.title || "",
    description: description.trim().slice(0, 1200),
    headings,
    selectedText,
    text
  };

  function normalizeExtractedText(value) {
    return String(value || "")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }
}

function buildUnreadableSummary(tab, parsedUrl, reason) {
  return {
    status: "unreadable",
    title: tab.title || "Untitled",
    hostname: parsedUrl.hostname,
    summary: reason,
    keyPoints: [
      "The page may be a browser internal page, PDF, restricted page, or protected by site policy.",
      "TabMosaic did not read page body content.",
      "I can still classify it from title, hostname, and path."
    ],
    suggestedGroup: classifyTab({
      title: tab.title || "",
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      urlScheme: parsedUrl.scheme
    }).name,
    suggestedAction: "keep",
    confidence: 0.4
  };
}

function buildSensitiveSummaryConfirmation(tab, parsedUrl, privacyCheck) {
  return {
    status: "needs-confirmation",
    tabId: tab.id,
    title: "Sensitive page confirmation needed",
    hostname: parsedUrl.hostname,
    summary: "This page may contain sensitive information. Confirm before reading visible page text.",
    keyPoints: [
      "No page body was read.",
      "TabMosaic checked only tab metadata before this prompt.",
      "Ask from the sidebar composer again and confirm if you want a local summary."
    ],
    suggestedGroup: classifyTab({
      title: tab.title || "",
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      urlScheme: parsedUrl.scheme
    }).name,
    suggestedAction: "keep",
    confidence: 0.35,
    requiresConfirmation: true,
    reason: privacyCheck.reason || "sensitive context"
  };
}

function buildLocalPageSummary({ tab, parsedUrl, page, question = "" }) {
  const title = page.title || tab.title || "Untitled";
  const sentences = splitSentences([page.description, page.text].filter(Boolean).join("\n\n"));
  const summary = question
    ? buildLocalPageQuestionAnswer(question, sentences, page)
    : buildSummaryText(page.description, sentences);
  const keyPoints = buildKeyPoints(page.headings, sentences);
  const classification = classifyTab({
    title,
    hostname: parsedUrl.hostname,
    path: parsedUrl.path,
    urlScheme: parsedUrl.scheme
  });

  return {
    status: "completed",
    title,
    hostname: parsedUrl.hostname,
    question,
    summary,
    keyPoints,
    suggestedGroup: classification.name,
    suggestedAction: suggestPageAction({ sentences, title, hostname: parsedUrl.hostname }),
    confidence: Math.min(0.9, Math.max(0.55, classification.confidence || 0.65)),
    extractedChars: (page.text || "").length
  };
}

function sanitizePageQuestion(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?？。.!！]+$/g, "")
    .slice(0, 240);
}

function buildLocalPageQuestionAnswer(question, sentences, page) {
  const ranked = rankSentencesForQuestion(question, [
    page.description || "",
    ...(Array.isArray(page.headings) ? page.headings : []),
    ...sentences
  ]);

  if (ranked.length && ranked[0].score > 0) {
    return ranked
      .slice(0, 2)
      .map((item) => item.sentence)
      .join(" ")
      .slice(0, 460);
  }

  const fallback = buildSummaryText(page.description, sentences);
  return `I did not find a direct answer in the visible page text. Closest useful context: ${fallback}`;
}

function rankSentencesForQuestion(question, candidates) {
  const tokens = getQuestionTokens(question);

  return (Array.isArray(candidates) ? candidates : [])
    .map((sentence) => String(sentence || "").replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length >= 8)
    .map((sentence) => ({
      sentence,
      score: scoreSentenceForQuestion(sentence, tokens)
    }))
    .sort((a, b) => b.score - a.score || b.sentence.length - a.sentence.length);
}

function getQuestionTokens(question) {
  const asciiTokens = String(question || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !QUESTION_STOP_WORDS.has(token));
  const cjkTokens = Array.from(String(question || "").matchAll(/[\u4e00-\u9fff]{2,}/g), (match) => match[0]);
  return Array.from(new Set([...asciiTokens, ...cjkTokens])).slice(0, 12);
}

function scoreSentenceForQuestion(sentence, tokens) {
  const text = sentence.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (text.includes(token.toLowerCase())) score += token.length >= 6 ? 3 : 2;
  }

  if (sentence.length <= 220) score += 0.5;
  return score;
}

function splitSentences(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。！？])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 32)
    .slice(0, 16);
}

function buildSummaryText(description, sentences) {
  if (description && description.length >= 50) {
    return description.replace(/\s+/g, " ").slice(0, 360);
  }

  if (sentences.length) {
    return sentences.slice(0, 2).join(" ").slice(0, 420);
  }

  return "I found limited readable text, but the page appears worth keeping until you review it.";
}

function buildKeyPoints(headings = [], sentences = []) {
  const headingPoints = headings
    .filter((heading) => heading.length >= 4)
    .slice(0, 3)
    .map((heading) => `Section: ${heading}`);
  const sentencePoints = sentences
    .filter((sentence) => !headingPoints.some((point) => point.includes(sentence.slice(0, 24))))
    .slice(0, 3);
  const points = [...headingPoints, ...sentencePoints].slice(0, 5);

  if (points.length) return points;

  return [
    "Readable text was limited.",
    "Use the suggested group as a starting point.",
    "Keep the tab if it is still part of your current task."
  ];
}

function suggestPageAction({ sentences, title, hostname }) {
  const haystack = `${title} ${hostname} ${sentences.slice(0, 3).join(" ")}`.toLowerCase();

  if (haystack.includes("login") || haystack.includes("sign in")) return "keep";
  if (haystack.includes("tutorial") || haystack.includes("guide") || haystack.includes("docs")) return "keep";
  if (haystack.includes("read later") || haystack.includes("article") || haystack.includes("blog")) return "read later";

  return "keep";
}

async function undoLastOrganize() {
  const startedAt = new Date().toISOString();
  const result = await chrome.storage.local.get(LAST_UNDO_KEY);
  const undoSnapshot = result[LAST_UNDO_KEY];

  if (!undoSnapshot) {
    throw new Error("No organize action is available to undo.");
  }

  await publishRun({
    status: "undoing",
    startedAt,
    message: "Restoring previous tab groups..."
  });

  const restoreResult = await restoreUndoSnapshot(undoSnapshot);
  await chrome.storage.local.remove(LAST_UNDO_KEY);

  const completedRun = {
    status: "undone",
    startedAt,
    completedAt: new Date().toISOString(),
    summary: {
      restoredTabs: restoreResult.restoredTabs,
      restoredGroups: restoreResult.restoredGroups,
      missingTabs: restoreResult.missingTabs,
      undoAvailable: false
    }
  };

  await publishRun(completedRun);
  return completedRun;
}

async function collectAllNormalWindowTabs() {
  const windows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ["normal"]
  });

  const normalWindows = windows.filter((window) => !window.incognito);
  const groups = await collectTabGroups(normalWindows);
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const tabs = normalWindows.flatMap((window) =>
    (window.tabs || []).map((tab) => buildTabSnapshot(tab, window, groupById))
  );

  return {
    collectedAt: new Date().toISOString(),
    windows: normalWindows.map((window) => ({
      id: window.id,
      focused: Boolean(window.focused),
      state: window.state,
      tabCount: (window.tabs || []).length
    })),
    groups,
    tabs
  };
}

async function collectTabGroups(windows) {
  const groups = [];

  for (const window of windows) {
    if (typeof window.id !== "number") continue;

    try {
      const windowGroups = await chrome.tabGroups.query({ windowId: window.id });
      groups.push(
        ...windowGroups.map((group) => ({
          id: group.id,
          windowId: group.windowId,
          title: group.title || "",
          color: group.color || "grey",
          collapsed: Boolean(group.collapsed)
        }))
      );
    } catch {
      // Keep the scan useful even if a single window cannot provide group data.
    }
  }

  return groups;
}

function buildTabSnapshot(tab, window, groupById) {
  const rawUrl = tab.url || tab.pendingUrl || "";
  const parsedUrl = parseUrl(rawUrl);
  const groupId = typeof tab.groupId === "number" ? tab.groupId : NO_GROUP_ID;
  const group = groupById.get(groupId);

  return {
    id: tab.id,
    windowId: window.id,
    index: tab.index,
    title: tab.title || "Untitled",
    favIconUrl: sanitizeFavIconUrl(tab.favIconUrl),
    restoreUrl: isRestorableUrl(rawUrl, parsedUrl) ? rawUrl : "",
    lastAccessed: typeof tab.lastAccessed === "number" ? tab.lastAccessed : 0,
    hostname: parsedUrl.hostname,
    path: parsedUrl.path,
    hasQuery: parsedUrl.hasQuery,
    hasHash: parsedUrl.hasHash,
    urlScheme: parsedUrl.scheme,
    duplicateLabel: parsedUrl.label,
    exactUrlHash: parsedUrl.exactHash,
    trackingUrlHash: parsedUrl.trackingHash,
    reviewUrlHash: parsedUrl.reviewHash,
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    audible: Boolean(tab.audible),
    discarded: Boolean(tab.discarded),
    incognito: Boolean(tab.incognito || window.incognito),
    groupId,
    groupTitle: group?.title || "",
    groupColor: group?.color || "grey",
    status: tab.status || "unknown",
    protectedReasons: getProtectedReasons(tab, parsedUrl)
  };
}

function parseUrl(rawUrl) {
  if (!rawUrl) {
    return {
      scheme: "unknown",
      hostname: "unknown",
      path: "",
      label: "unknown",
      hasQuery: false,
      hasHash: false,
      exactHash: "",
      trackingHash: "",
      reviewHash: ""
    };
  }

  try {
    const url = new URL(rawUrl);
    const normalizedExact = normalizeUrlForKey(url, { stripTracking: false, stripHash: false });
    const normalizedTracking = normalizeUrlForKey(url, { stripTracking: true, stripHash: false });
    const normalizedReview = normalizeUrlForKey(url, { stripTracking: true, stripHash: true, stripQuery: true });

    return {
      scheme: url.protocol.replace(":", ""),
      hostname: url.hostname || url.protocol.replace(":", ""),
      path: url.pathname || "/",
      label: `${url.hostname}${url.pathname || "/"}`,
      hasQuery: Boolean(url.search),
      hasHash: Boolean(url.hash),
      exactHash: simpleHash(normalizedExact),
      trackingHash: simpleHash(normalizedTracking),
      reviewHash: simpleHash(normalizedReview)
    };
  } catch {
    const scheme = rawUrl.split(":")[0] || "unknown";
    return {
      scheme,
      hostname: scheme,
      path: "",
      label: scheme,
      hasQuery: false,
      hasHash: false,
      exactHash: simpleHash(rawUrl),
      trackingHash: simpleHash(rawUrl),
      reviewHash: simpleHash(rawUrl)
    };
  }
}

function sanitizeFavIconUrl(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  if (rawValue.startsWith("data:image/")) {
    return rawValue.slice(0, 8192);
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
    return url.toString().slice(0, 512);
  } catch {
    return "";
  }
}

function normalizeUrlForKey(url, options) {
  const clone = new URL(url.toString());

  if (options.stripHash) {
    clone.hash = "";
  }

  if (options.stripQuery) {
    clone.search = "";
    return clone.toString();
  }

  if (options.stripTracking) {
    for (const param of Array.from(clone.searchParams.keys())) {
      if (isTrackingParam(param)) {
        clone.searchParams.delete(param);
      }
    }
  }

  clone.searchParams.sort();
  return clone.toString();
}

function isTrackingParam(param) {
  const key = param.toLowerCase();
  return (
    key.startsWith("utm_") ||
    [
      "fbclid",
      "gclid",
      "dclid",
      "msclkid",
      "igshid",
      "mc_cid",
      "mc_eid",
      "ref",
      "ref_src",
      "spm",
      "twclid",
      "yclid"
    ].includes(key)
  );
}

function simpleHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getProtectedReasons(tab, parsedUrl) {
  const reasons = [];

  if (tab.active) reasons.push("active");
  if (tab.pinned) reasons.push("pinned");
  if (tab.audible) reasons.push("audible");
  if (tab.incognito) reasons.push("incognito");
  if (isInternalScheme(parsedUrl.scheme)) reasons.push("internal");

  return reasons;
}

function isInternalScheme(scheme) {
  return [
    "chrome",
    "chrome-extension",
    "devtools",
    "edge",
    "brave",
    "about"
  ].includes(scheme);
}

function isRestorableUrl(rawUrl, parsedUrl) {
  return Boolean(rawUrl) && ["http", "https"].includes(parsedUrl.scheme);
}

function summarizeSnapshot(snapshot, duplicateGroups = []) {
  const protectedCounts = {};
  const hostCounts = {};

  for (const tab of snapshot.tabs) {
    hostCounts[tab.hostname] = (hostCounts[tab.hostname] || 0) + 1;

    for (const reason of tab.protectedReasons) {
      protectedCounts[reason] = (protectedCounts[reason] || 0) + 1;
    }

  }

  const topHosts = Object.entries(hostCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([hostname, count]) => ({ hostname, count }));

  const safeDuplicateGroups = duplicateGroups.filter((group) => group.action === "safe-close-candidate");
  const reviewDuplicateGroups = duplicateGroups.filter((group) => group.action === "review");

  return {
    windowCount: snapshot.windows.length,
    tabCount: snapshot.tabs.length,
    protectedCounts,
    topHosts,
    exactDuplicateGroups: duplicateGroups.filter((group) => group.type === "exact").length,
    trackingDuplicateGroups: duplicateGroups.filter((group) => group.type === "tracking").length,
    reviewDuplicateGroups: reviewDuplicateGroups.length,
    safeDuplicateGroups: safeDuplicateGroups.length
  };
}

function detectDuplicateGroups(tabs) {
  const duplicateGroups = [];
  const usedTabIds = new Set();

  collectDuplicateType(tabs, "exactUrlHash", "exact", "safe-close-candidate", usedTabIds, duplicateGroups);
  collectDuplicateType(tabs, "trackingUrlHash", "tracking", "safe-close-candidate", usedTabIds, duplicateGroups);
  collectDuplicateType(tabs, "reviewUrlHash", "same-page-review", "review", usedTabIds, duplicateGroups);

  return duplicateGroups;
}

function collectDuplicateType(tabs, keyName, type, action, usedTabIds, duplicateGroups) {
  const buckets = new Map();

  for (const tab of tabs) {
    const key = tab[keyName];
    if (!key || usedTabIds.has(tab.id)) continue;

    if (!buckets.has(key)) {
      buckets.set(key, []);
    }

    buckets.get(key).push(tab);
  }

  for (const bucketTabs of buckets.values()) {
    if (bucketTabs.length < 2) continue;

    const hasQueryOrHashDifference = new Set(bucketTabs.map((tab) => `${tab.hasQuery}:${tab.hasHash}:${tab.exactUrlHash}`)).size > 1;

    if (type === "same-page-review" && !hasQueryOrHashDifference) {
      continue;
    } else {
      duplicateGroups.push(buildDuplicateGroup(bucketTabs, type, action));
    }

    for (const tab of bucketTabs) {
      usedTabIds.add(tab.id);
    }
  }
}

function buildDuplicateGroup(tabs, type, action) {
  const label = tabs[0]?.duplicateLabel || "duplicate tabs";

  return {
    id: `${type}:${simpleHash(`${label}:${tabs.map((tab) => tab.id).join(",")}`)}`,
    type,
    action,
    label,
    tabCount: tabs.length,
    protectedCount: tabs.filter((tab) => tab.protectedReasons.length > 0).length,
    tabIds: tabs.map((tab) => tab.id)
  };
}

function buildSafeDuplicateClosePlan(duplicateGroups, tabs) {
  const tabById = new Map(tabs.map((tab) => [tab.id, tab]));
  const closeTabs = [];
  const skippedGroups = [];

  for (const duplicateGroup of duplicateGroups) {
    if (duplicateGroup.action !== "safe-close-candidate") continue;

    const duplicateTabs = duplicateGroup.tabIds
      .map((tabId) => tabById.get(tabId))
      .filter(Boolean);
    const keepTab = chooseDuplicateTabToKeep(duplicateTabs);
    const tabsToClose = duplicateTabs.filter((tab) => tab.id !== keepTab?.id && canAutoCloseDuplicateTab(tab));

    if (!keepTab || !tabsToClose.length) {
      skippedGroups.push({
        label: duplicateGroup.label,
        reason: "No safe tabs to close"
      });
      continue;
    }

    for (const tab of tabsToClose) {
      closeTabs.push({
        tabId: tab.id,
        title: tab.title,
        url: tab.restoreUrl,
        windowId: tab.windowId,
        index: tab.index,
        groupName: tab.groupTitle || "",
        groupColor: tab.groupColor || "grey",
        pinned: Boolean(tab.pinned),
        active: Boolean(tab.active),
        closedAt: Date.now(),
        duplicateReason: duplicateGroup.type,
        duplicateLabel: duplicateGroup.label,
        keepTabId: keepTab.id
      });
    }
  }

  return {
    closeTabs,
    skippedGroups
  };
}

function chooseDuplicateTabToKeep(tabs) {
  return [...tabs].sort((a, b) => scoreDuplicateKeepTab(b) - scoreDuplicateKeepTab(a))[0];
}

function scoreDuplicateKeepTab(tab) {
  let score = 0;

  if (tab.active) score += 100000;
  if (tab.pinned) score += 80000;
  if (tab.audible) score += 60000;
  if (tab.groupId !== NO_GROUP_ID) score += 1000;
  if (!tab.discarded) score += 500;
  score += Math.min(tab.lastAccessed || 0, 9999999999999) / 1000000000;
  score -= tab.index || 0;

  return score;
}

function canAutoCloseDuplicateTab(tab) {
  return (
    typeof tab.id === "number" &&
    tab.restoreUrl &&
    !tab.active &&
    !tab.pinned &&
    !tab.audible &&
    !tab.incognito &&
    tab.protectedReasons.length === 0 &&
    ["http", "https"].includes(tab.urlScheme)
  );
}

async function closeSafeDuplicates(closePlan) {
  const closedTabs = [];
  let skippedTabs = 0;

  if (!closePlan.closeTabs.length) {
    await chrome.storage.local.remove(LAST_CLOSED_TABS_KEY);
    return { closedTabs: 0, skippedTabs, skippedGroups: closePlan.skippedGroups };
  }

  const restoreSnapshot = {
    createdAt: new Date().toISOString(),
    closedTabs: closePlan.closeTabs
  };
  await chrome.storage.local.set({ [LAST_CLOSED_TABS_KEY]: restoreSnapshot });

  for (const tab of closePlan.closeTabs) {
    try {
      await chrome.tabs.remove(tab.tabId);
      closedTabs.push(tab);
    } catch {
      skippedTabs += 1;
    }
  }

  if (!closedTabs.length) {
    await chrome.storage.local.remove(LAST_CLOSED_TABS_KEY);
  } else if (closedTabs.length !== closePlan.closeTabs.length) {
    await chrome.storage.local.set({
      [LAST_CLOSED_TABS_KEY]: {
        createdAt: restoreSnapshot.createdAt,
        closedTabs
      }
    });
  }

  await appendDuplicateSafetyAudit({
    action: "auto_safe_close",
    requestedTabs: closePlan.closeTabs.length,
    closedTabs: closedTabs.length,
    skippedTabs,
    skippedGroups: closePlan.skippedGroups,
    duplicateTypes: countDuplicateReasons(closedTabs),
    restoreAvailable: closedTabs.length > 0
  });

  return {
    closedTabs: closedTabs.length,
    skippedTabs,
    skippedGroups: closePlan.skippedGroups
  };
}

async function restoreClosedTabsSnapshot(restoreSnapshot) {
  const createdTabs = [];
  let failedTabs = 0;

  for (const closedTab of restoreSnapshot.closedTabs) {
    try {
      const createdTab = await createRestoredTab(closedTab);
      createdTabs.push({ tab: createdTab, closedTab });
    } catch {
      failedTabs += 1;
    }
  }

  const restoredGroups = await groupRestoredTabs(createdTabs);

  return {
    restoredTabs: createdTabs.length,
    failedTabs,
    restoredGroups
  };
}

async function createRestoredTab(closedTab) {
  const createProperties = {
    url: closedTab.url,
    active: false,
    pinned: Boolean(closedTab.pinned)
  };

  if (typeof closedTab.windowId === "number") {
    createProperties.windowId = closedTab.windowId;
  }

  if (typeof closedTab.index === "number") {
    createProperties.index = Math.max(0, closedTab.index);
  }

  try {
    return await chrome.tabs.create(createProperties);
  } catch {
    delete createProperties.windowId;
    delete createProperties.index;
    return chrome.tabs.create(createProperties);
  }
}

async function groupRestoredTabs(createdTabs) {
  const tabsByGroup = new Map();

  for (const entry of createdTabs) {
    const title = entry.closedTab.groupName || "Restored Duplicates";
    const color = SUPPORTED_GROUP_COLORS.has(entry.closedTab.groupColor) ? entry.closedTab.groupColor : "grey";
    const key = `${entry.tab.windowId}:${title}:${color}`;

    if (!tabsByGroup.has(key)) {
      tabsByGroup.set(key, {
        windowId: entry.tab.windowId,
        title,
        color,
        tabIds: []
      });
    }

    tabsByGroup.get(key).tabIds.push(entry.tab.id);
  }

  let restoredGroups = 0;
  for (const group of tabsByGroup.values()) {
    if (!group.tabIds.length) continue;

    try {
      const groupId = await chrome.tabs.group({ tabIds: group.tabIds });
      await chrome.tabGroups.update(groupId, {
        title: group.title,
        color: group.color,
        collapsed: false
      });
      restoredGroups += 1;
    } catch {
      // Restored tabs are still open even if group restoration fails.
    }
  }

  return restoredGroups;
}

function buildGroupPlan(snapshot, aiByTabId = new Map(), userRuleByTabId = new Map()) {
  const groupedByWindowAndName = new Map();

  for (const tab of snapshot.tabs) {
    if (!canGroupTab(tab)) continue;

    const classification = userRuleByTabId.get(tab.id) || aiByTabId.get(tab.id) || classifyTab(tab);
    const key = `${tab.windowId}:${classification.name}`;

    if (!groupedByWindowAndName.has(key)) {
      groupedByWindowAndName.set(key, {
        windowId: tab.windowId,
        name: classification.name,
        color: classification.color,
        confidence: classification.confidence,
        reason: classification.reason,
        tabIds: []
      });
    }

    groupedByWindowAndName.get(key).tabIds.push(tab.id);
  }

  return Array.from(groupedByWindowAndName.values())
    .filter((group) => group.tabIds.length >= 2 || group.name !== "Misc")
    .sort((a, b) => a.windowId - b.windowId || a.name.localeCompare(b.name));
}

function canGroupTab(tab) {
  return (
    typeof tab.id === "number" &&
    typeof tab.windowId === "number" &&
    !tab.incognito &&
    !tab.pinned &&
    !isInternalScheme(tab.urlScheme)
  );
}

function classifyTab(tab) {
  const host = tab.hostname.toLowerCase();
  const path = tab.path.toLowerCase();
  const title = tab.title.toLowerCase();

  if (host === "developer.chrome.com" && path.includes("/docs/extensions")) {
    return rule("Chrome Extension Docs", "blue", "Chrome extension documentation");
  }

  if (host === "github.com" && /\/pull\/\d+/.test(path)) {
    return rule("Code Review", "red", "GitHub pull request");
  }

  if (host === "github.com" && /\/issues\/\d+/.test(path)) {
    return rule("GitHub Issues", "purple", "GitHub issue");
  }

  if (host === "github.com") {
    return rule("GitHub Projects", "grey", "GitHub project context");
  }

  if (["docs.google.com", "notion.so", "www.notion.so", "coda.io"].includes(host)) {
    return rule("Docs & Notes", "green", "Document or notes workspace");
  }

  if (["mail.google.com", "outlook.live.com", "outlook.office.com"].includes(host) || host.includes("slack.com") || host.includes("teams.microsoft.com")) {
    return rule("Communication", "cyan", "Mail or team communication");
  }

  if (host === "calendar.google.com" || host.includes("calendly.com")) {
    return rule("Meetings", "cyan", "Calendar or meeting context");
  }

  if (host.includes("figma.com") || host.includes("canva.com")) {
    return rule("Design", "pink", "Design tool");
  }

  if (host.includes("linear.app") || host.includes("jira") || host.includes("atlassian.net") || host.includes("trello.com") || host.includes("asana.com")) {
    return rule("Product & Tasks", "green", "Product or task management");
  }

  if (host.includes("stripe.com") || host.includes("paypal.com") || host.includes("billing") || host.includes("revenuecat.com")) {
    return rule("Finance & Payments", "yellow", "Finance or payment dashboard");
  }

  if (host.includes("vercel.com") || host.includes("supabase.com") || host.includes("cloudflare.com") || host.includes("console.aws.amazon.com") || host === "localhost" || host === "127.0.0.1") {
    return rule("Dev Tools", "grey", "Developer tooling");
  }

  if (host.includes("analytics.google.com") || host.includes("mixpanel.com") || host.includes("amplitude.com") || host.includes("posthog.com")) {
    return rule("Analytics", "purple", "Analytics dashboard");
  }

  if (host.includes("youtube.com") && path.includes("/watch")) {
    if (title.includes("tutorial") || title.includes("course") || title.includes("lesson") || title.includes("how to")) {
      return rule("Learning", "yellow", "Learning video");
    }
    return rule("Video", "grey", "Video tab");
  }

  if (host.includes("google.") && path.includes("/search")) {
    return rule("Research", "purple", "Search result");
  }

  if (title.includes("blog") || title.includes("article") || path.includes("/blog") || path.includes("/article")) {
    return rule("Articles to Read", "yellow", "Article or blog post");
  }

  return rule("Misc", "grey", "No strong built-in rule matched", 0.55);
}

function rule(name, color, reason, confidence = 0.86) {
  return { name, color, reason, confidence };
}

function validateGroupPlan(groupPlan, snapshot) {
  const tabById = new Map(snapshot.tabs.map((tab) => [tab.id, tab]));
  const seenTabIds = new Set();
  const validated = [];

  for (const group of groupPlan) {
    const tabIds = [];
    const groupWindowId = group.windowId;

    for (const tabId of group.tabIds) {
      const tab = tabById.get(tabId);
      if (!tab || seenTabIds.has(tabId)) continue;
      if (tab.windowId !== groupWindowId) continue;
      if (!canGroupTab(tab)) continue;

      seenTabIds.add(tabId);
      tabIds.push(tabId);
    }

    if (!tabIds.length) continue;

    validated.push({
      windowId: groupWindowId,
      name: String(group.name || "Misc").slice(0, 48),
      color: SUPPORTED_GROUP_COLORS.has(group.color) ? group.color : "grey",
      confidence: Number(group.confidence || 0.5),
      reason: group.reason || "Built-in rule",
      tabIds
    });
  }

  return validated;
}

async function applyGroupPlan(groupPlan) {
  const appliedGroups = [];
  let tabsMoved = 0;
  let skippedGroups = 0;

  for (const group of groupPlan) {
    try {
      const groupId = await chrome.tabs.group({ tabIds: group.tabIds });
      await chrome.tabGroups.update(groupId, {
        title: group.name,
        color: group.color,
        collapsed: false
      });

      tabsMoved += group.tabIds.length;
      appliedGroups.push({
        id: groupId,
        windowId: group.windowId,
        name: group.name,
        color: group.color,
        tabCount: group.tabIds.length,
        tabIds: group.tabIds.slice(),
        reason: group.reason,
        confidence: group.confidence
      });
    } catch {
      skippedGroups += 1;
    }
  }

  return {
    groupsCreated: appliedGroups.length,
    tabsMoved,
    skippedGroups,
    groups: appliedGroups
  };
}

function buildUndoSnapshot(snapshot) {
  return {
    createdAt: new Date().toISOString(),
    tabs: snapshot.tabs.map((tab) => ({
      id: tab.id,
      windowId: tab.windowId,
      index: tab.index,
      groupId: tab.groupId
    })),
    groups: snapshot.groups
  };
}

function sanitizeSnapshotForRun(snapshot) {
  return {
    ...snapshot,
    tabs: snapshot.tabs.map(({
      restoreUrl,
      exactUrlHash,
      trackingUrlHash,
      reviewUrlHash,
      url,
      fullUrl,
      pageText,
      ...tab
    }) => {
      const sanitizedTab = {
        ...tab,
        favIconUrl: sanitizeFavIconUrl(tab.favIconUrl)
      };

      if (!sanitizedTab.favIconUrl) {
        delete sanitizedTab.favIconUrl;
      }

      return sanitizedTab;
    })
  };
}

async function restoreUndoSnapshot(undoSnapshot) {
  const currentWindows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ["normal"]
  });
  const currentTabIds = new Set(
    currentWindows.flatMap((window) => (window.tabs || []).map((tab) => tab.id))
  );
  const restorableTabs = undoSnapshot.tabs.filter((tab) => currentTabIds.has(tab.id));
  const restorableTabIds = restorableTabs.map((tab) => tab.id);

  if (restorableTabIds.length) {
    await safeUngroup(restorableTabIds);
  }

  const tabsByPreviousGroup = new Map();
  for (const tab of restorableTabs) {
    if (tab.groupId === NO_GROUP_ID) continue;
    if (!tabsByPreviousGroup.has(tab.groupId)) {
      tabsByPreviousGroup.set(tab.groupId, []);
    }
    tabsByPreviousGroup.get(tab.groupId).push(tab.id);
  }

  let restoredGroups = 0;
  for (const group of undoSnapshot.groups || []) {
    const tabIds = tabsByPreviousGroup.get(group.id) || [];
    if (!tabIds.length) continue;

    const newGroupId = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(newGroupId, {
      title: group.title || "",
      color: SUPPORTED_GROUP_COLORS.has(group.color) ? group.color : "grey",
      collapsed: Boolean(group.collapsed)
    });
    restoredGroups += 1;
  }

  return {
    restoredTabs: restorableTabIds.length,
    restoredGroups,
    missingTabs: undoSnapshot.tabs.length - restorableTabIds.length
  };
}

async function safeUngroup(tabIds) {
  try {
    await chrome.tabs.ungroup(tabIds);
  } catch {
    for (const tabId of tabIds) {
      try {
        await chrome.tabs.ungroup(tabId);
      } catch {
        // The tab may already be ungrouped or unavailable.
      }
    }
  }
}

async function publishRun(run) {
  await chrome.storage.local.set({ [CURRENT_RUN_KEY]: run });

  try {
    await chrome.runtime.sendMessage({ type: "RUN_UPDATED", run });
  } catch {
    // The side panel may not be ready yet; it will request the latest run on load.
  }
}

async function getCurrentRun() {
  const result = await chrome.storage.local.get(CURRENT_RUN_KEY);
  return result[CURRENT_RUN_KEY] || {
    status: "idle",
    message: "Click the extension icon to organize your tabs."
  };
}

function sendErrorResponse(sendResponse, operation, error) {
  void recordLocalError(operation, error);
  sendResponse({ ok: false, error: normalizeError(error) });
}

async function recordLocalError(operation, error) {
  try {
    const result = await chrome.storage.local.get(ERROR_LOG_KEY);
    const previousEntries = Array.isArray(result[ERROR_LOG_KEY]) ? result[ERROR_LOG_KEY] : [];
    const entry = buildErrorLogEntry(operation, error);
    await chrome.storage.local.set({
      [ERROR_LOG_KEY]: [entry, ...previousEntries].slice(0, MAX_ERROR_LOG_ENTRIES)
    });
  } catch {
    // Diagnostics must never break user-facing browser actions.
  }
}

async function appendDuplicateSafetyAudit(event) {
  try {
    const result = await chrome.storage.local.get(DUPLICATE_SAFETY_AUDIT_KEY);
    const previousEvents = Array.isArray(result[DUPLICATE_SAFETY_AUDIT_KEY])
      ? result[DUPLICATE_SAFETY_AUDIT_KEY]
      : [];
    const nextEvent = sanitizeDuplicateSafetyEvent(event);
    await chrome.storage.local.set({
      [DUPLICATE_SAFETY_AUDIT_KEY]: [nextEvent, ...previousEvents].slice(0, MAX_DUPLICATE_SAFETY_AUDIT_ENTRIES)
    });
  } catch {
    // Safety audit must never block close, restore, or review actions.
  }
}

function sanitizeDuplicateSafetyEvent(event) {
  return {
    id: `dup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    action: sanitizeAllowedDuplicateAuditValue(event?.action, ["auto_safe_close", "manual_review_close", "restore_closed_tabs"]),
    requestedTabs: nonNegativeInt(event?.requestedTabs),
    closedTabs: nonNegativeInt(event?.closedTabs),
    restoredTabs: nonNegativeInt(event?.restoredTabs),
    failedTabs: nonNegativeInt(event?.failedTabs),
    skippedTabs: nonNegativeInt(event?.skippedTabs),
    skippedGroups: nonNegativeInt(event?.skippedGroups),
    restoredGroups: nonNegativeInt(event?.restoredGroups),
    autoClosedTabs: nonNegativeInt(event?.autoClosedTabs),
    reviewedClosedTabs: nonNegativeInt(event?.reviewedClosedTabs),
    restoreAvailable: Boolean(event?.restoreAvailable),
    duplicateTypes: sanitizeDuplicateTypeCounts(event?.duplicateTypes)
  };
}

function countDuplicateReasons(tabs) {
  const counts = {};

  for (const tab of tabs || []) {
    const key = sanitizeAllowedDuplicateAuditValue(tab?.duplicateReason, ["exact", "tracking", "same-page-review"]);
    counts[key] = nonNegativeInt(counts[key]) + 1;
  }

  return counts;
}

function sanitizeDuplicateTypeCounts(value) {
  const allowedTypes = ["exact", "tracking", "same-page-review", "unknown"];
  const result = {};

  for (const [rawKey, rawCount] of Object.entries(value || {})) {
    const key = sanitizeAllowedDuplicateAuditValue(rawKey, allowedTypes);
    result[key] = nonNegativeInt(rawCount);
  }

  return result;
}

function sanitizeAllowedDuplicateAuditValue(value, allowedValues) {
  const text = String(value || "");
  return allowedValues.includes(text) ? text : "unknown";
}

function nonNegativeInt(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function buildErrorLogEntry(operation, error, now = new Date()) {
  const message = normalizeError(error);
  const name = typeof error?.name === "string" ? error.name : "Error";

  return {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: now instanceof Date ? now.toISOString() : new Date(now).toISOString(),
    operation: sanitizeErrorField(operation, 64),
    name: sanitizeErrorField(name, 40),
    message: sanitizeErrorText(message)
  };
}

function sanitizeErrorField(value, maxLength) {
  return String(value || "unknown")
    .replace(/[^a-z0-9:_-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLength) || "unknown";
}

function sanitizeErrorText(value) {
  return String(value || "Unknown error")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted-token]")
    .replace(/\bsk-[A-Za-z0-9_-]{6,}\b/g, "[redacted-api-key]")
    .replace(/\b(?:https?|file|chrome|chrome-extension|edge|brave):\/\/[^\s"'<>]+/gi, "[redacted-url]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s"'<>]*)?/gi, "[redacted-host]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "Unknown error";
}

function normalizeError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  return error.message || String(error);
}
