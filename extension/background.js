import {
  AI_PROVIDER_HOST_IDS,
  AI_PROVIDER_PRESETS,
  DEFAULT_AI_HOSTNAME,
  DEFAULT_AI_PROVIDER_ORIGIN,
  DEFAULT_AI_SETTINGS
} from "./provider_registry.js";

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
const SIDEBAR_MODE_KEY = "tabmosaic.sidebarMode";
const AGENT_TASKS_KEY = "tabmosaic.agentTasks";
const SAVED_COLLECTIONS_KEY = "tabmosaic.savedCollections";
const SEARCH_SETTINGS_KEY = "tabmosaic.searchSettings";
const DEFAULT_SEARCH_SETTINGS = {
  enabled: false,
  provider: "tavily",
  baseUrl: "https://api.tavily.com",
  apiKey: "",
  maxResults: 5,
  searchDepth: "basic",
  includeAnswer: true
};
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
  SIDEBAR_CONTEXT_KEY,
  SIDEBAR_MODE_KEY,
  AGENT_TASKS_KEY,
  SAVED_COLLECTIONS_KEY,
  SEARCH_SETTINGS_KEY
];
const TOOLBAR_ACTIONS = new Set(["smart-organize", "vertical-tabs", "current-page-chat", "dashboard"]);
let privateBetaAISettingsPromise = null;
const AI_CONNECTION_TIMEOUT_MS = 8000;
const AI_CLASSIFICATION_TIMEOUT_MS = 12000;
const AI_AGENT_TIMEOUT_MS = 12000;
const AI_PAGE_AGENT_TIMEOUT_MS = 15000;
const WEB_SEARCH_TIMEOUT_MS = 10000;
const MAX_AI_AGENT_TABS = 80;
const AI_AGENT_CONVERSATION_LIMIT = 4;
const AI_PAGE_AGENT_CONVERSATION_LIMIT = 20;
const MAX_PAGE_AGENT_TEXT_CHARS = 18000;
const MULTI_TAB_CONTENT_READ_LIMIT = 6;
const MAX_REGION_SCREENSHOT_SIDE = 768;
const REGION_SCREENSHOT_OUTPUT_TYPE = "image/jpeg";
const REGION_SCREENSHOT_OUTPUT_QUALITY = 0.72;
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
  "connection",
  "database",
  "finance",
  "health",
  "internal",
  "localhost",
  "medical",
  "password",
  "paypal",
  "supabase",
  "stripe"
];
const CONTEXT_TAB_SKIP_REASONS = {
  over_cap: {
    label: "over beta cap",
    hint: "The private beta reads up to 6 tabs per scoped question."
  },
  protected: {
    label: "protected tab",
    hint: "Pinned or audible tabs are skipped by default."
  },
  restricted: {
    label: "restricted page",
    hint: "Browser, extension, incognito, or non-http pages cannot be read here."
  },
  missing_permission: {
    label: "site access not granted",
    hint: "Chrome did not grant temporary site access for this page."
  },
  sensitive: {
    label: "sensitive page",
    hint: "Sensitive-looking pages are skipped instead of read in multi-tab context."
  },
  unreadable: {
    label: "unreadable page",
    hint: "The page did not allow visible-text extraction."
  },
  empty: {
    label: "empty page",
    hint: "No readable visible text was found."
  },
  unavailable: {
    label: "closed tab",
    hint: "The tab was not available when the context was read."
  }
};
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
const AGENT_TOOL_REGISTRY = {
  readOnly: [
    {
      name: "get_current_tab_metadata",
      readsPageText: false,
      appliesBrowserChanges: false,
      confirmation: "none",
      dataUsed: ["title", "hostname", "path", "tab_state"]
    },
    {
      name: "get_current_run_snapshot",
      readsPageText: false,
      appliesBrowserChanges: false,
      confirmation: "none",
      dataUsed: ["groups", "duplicate_counts", "ai_status", "tab_metadata"]
    },
    {
      name: "list_groups",
      readsPageText: false,
      appliesBrowserChanges: false,
      confirmation: "none",
      dataUsed: ["group_names", "tab_counts", "colors"]
    },
    {
      name: "list_tabs_in_group",
      readsPageText: false,
      appliesBrowserChanges: false,
      confirmation: "none",
      dataUsed: ["title", "hostname", "path", "group_state"]
    },
    {
      name: "search_tabs",
      readsPageText: false,
      appliesBrowserChanges: false,
      confirmation: "none",
      dataUsed: ["title", "hostname", "path"]
    },
    {
      name: "search_open_tabs",
      readsPageText: false,
      appliesBrowserChanges: false,
      confirmation: "none",
      dataUsed: ["title", "hostname", "path", "group_state"]
    },
    {
      name: "search_saved_work",
      readsPageText: false,
      appliesBrowserChanges: false,
      confirmation: "none",
      storage: "local",
      dataUsed: ["local_task_collection_metadata"]
    },
    {
      name: "search_web_provider",
      readsPageText: false,
      appliesBrowserChanges: false,
      confirmation: "user_triggered_provider_configured",
      sendsToExternalProvider: true,
      dataUsed: ["user_typed_query"],
      storage: "session_only_until_saved"
    },
    {
      name: "get_duplicate_review_queue",
      readsPageText: false,
      appliesBrowserChanges: false,
      confirmation: "none",
      dataUsed: ["duplicate_type", "tab_count", "protected_state"]
    },
    {
      name: "get_ai_classification_status",
      readsPageText: false,
      appliesBrowserChanges: false,
      confirmation: "none",
      dataUsed: ["provider", "status", "suggested_group_count"]
    },
    {
      name: "extract_current_tab_visible_text",
      readsPageText: true,
      appliesBrowserChanges: false,
      confirmation: "user_request_sensitive_confirm",
      dataUsed: ["visible_text", "selected_text", "headings", "description"]
    },
    {
      name: "extract_selected_page_region",
      readsPageText: true,
      appliesBrowserChanges: false,
      confirmation: "user_request_element_picker_sensitive_confirm",
      storage: "session_only",
      dataUsed: ["selected_region_visible_text", "headings", "safe_link_labels", "list_table_structure", "cropped_screenshot_metadata"]
    },
    {
      name: "extract_selected_tabs_visible_text",
      readsPageText: true,
      appliesBrowserChanges: false,
      confirmation: "user_request_tool_card_sensitive_confirm_or_skip",
      maxTabs: MULTI_TAB_CONTENT_READ_LIMIT,
      storage: "session_only",
      dataUsed: ["visible_text", "selected_text", "headings", "title", "hostname"]
    },
    {
      name: "summarize_visible_text_batch",
      readsPageText: "already_extracted",
      appliesBrowserChanges: false,
      confirmation: "inherits_extraction_boundary",
      maxTabs: MULTI_TAB_CONTENT_READ_LIMIT,
      storage: "session_only",
      dataUsed: ["session_only_extracted_text"]
    },
    {
      name: "render_tool_card",
      readsPageText: false,
      appliesBrowserChanges: false,
      confirmation: "required_before_multi_tab_content_tools",
      dataUsed: ["tool_name", "scope", "tab_count", "storage", "skipped_count"]
    }
  ],
  planning: [
    { name: "classify_tabs_v2", appliesBrowserChanges: false, confirmation: "none" },
    { name: "explain_grouping_plan", appliesBrowserChanges: false, confirmation: "none" },
    { name: "detect_domain_only_groups", appliesBrowserChanges: false, confirmation: "none" },
    { name: "suggest_split_merge_groups", appliesBrowserChanges: false, confirmation: "none" },
    { name: "draft_user_rule", appliesBrowserChanges: false, confirmation: "none" }
  ],
  action: [
    { name: "organize_tabs", appliesBrowserChanges: true, confirmation: "already_user_action" },
    { name: "apply_group_plan", appliesBrowserChanges: true, confirmation: "apply_required" },
    { name: "move_tabs", appliesBrowserChanges: true, confirmation: "apply_required" },
    { name: "rename_group", appliesBrowserChanges: true, confirmation: "apply_or_explicit_request" },
    { name: "create_rule", appliesBrowserChanges: false, confirmation: "confirm_in_chat_copy" },
    { name: "focus_tab", appliesBrowserChanges: true, confirmation: "user_click_or_explicit_request" },
    { name: "undo_last_action", appliesBrowserChanges: true, confirmation: "explicit_request" },
    { name: "restore_closed_duplicates", appliesBrowserChanges: true, confirmation: "explicit_request" },
    { name: "open_dashboard", appliesBrowserChanges: true, confirmation: "explicit_request" },
    { name: "create_todo_from_tabs", appliesBrowserChanges: false, confirmation: "explicit_request", storage: "local" },
    { name: "save_selected_tabs", appliesBrowserChanges: false, confirmation: "explicit_request", storage: "local_metadata_only" }
  ],
  rejected: [
    "close_non_duplicate_tabs",
    "read_all_tabs_in_background",
    "upload_full_urls",
    "store_page_summaries_in_cloud",
    "delete_workspace_without_confirmation"
  ]
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  if (message.type === "RUN_TOOLBAR_ACTION") {
    runToolbarAction(message, sender)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendErrorResponse(sendResponse, "RUN_TOOLBAR_ACTION", error));
    return true;
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

  if (message.type === "RUN_AGENT_WEB_SEARCH") {
    runAgentWebSearch(message)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendErrorResponse(sendResponse, "RUN_AGENT_WEB_SEARCH", error));
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

  if (message.type === "RESTORE_SAVED_WORKSPACE") {
    restoreSavedWorkspace(message)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendErrorResponse(sendResponse, "RESTORE_SAVED_WORKSPACE", error));
    return true;
  }

  if (message.type === "TEST_AI_CONNECTION") {
    testAIConnection(message)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendErrorResponse(sendResponse, "TEST_AI_CONNECTION", error));
    return true;
  }

  if (message.type === "ENSURE_AI_PROVIDER_PERMISSION") {
    ensureAIProviderPermission(message.baseUrl, { requestPermission: Boolean(message.requestPermission) })
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendErrorResponse(sendResponse, "ENSURE_AI_PROVIDER_PERMISSION", error));
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

  if (message.type === "SUMMARIZE_PAGE_REGION") {
    summarizeSelectedPageRegion(message, sender)
      .then((summary) => sendResponse({ ok: true, summary }))
      .catch((error) => sendErrorResponse(sendResponse, "SUMMARIZE_PAGE_REGION", error));
    return true;
  }

  if (message.type === "SUMMARIZE_CONTEXT_TABS") {
    summarizeContextTabs(message)
      .then((summary) => sendResponse({ ok: true, summary }))
      .catch((error) => sendErrorResponse(sendResponse, "SUMMARIZE_CONTEXT_TABS", error));
    return true;
  }

  if (message.type === "REGROUP_CONTEXT_TABS") {
    regroupContextTabs(message)
      .then((draft) => sendResponse({ ok: true, draft }))
      .catch((error) => sendErrorResponse(sendResponse, "REGROUP_CONTEXT_TABS", error));
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

async function runToolbarAction(message, sender) {
  const action = String(message.action || "");

  if (!TOOLBAR_ACTIONS.has(action)) {
    throw new Error("Unsupported toolbar action.");
  }

  if (action === "dashboard") {
    await chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
    return { action };
  }

  const activeTab = await resolveToolbarActiveTab(message, sender);
  const activeWindowId = resolveToolbarWindowId(message, sender, activeTab);

  await setSidebarMode(action === "vertical-tabs" ? "vertical_tabs" : "agent", {
    source: `toolbar-${action}`,
    activeWindowId,
    activeTabId: activeTab?.id ?? null
  });
  await setSidebarContextFromTab(activeTab, `toolbar-${action}`);
  await openSidePanelForWindow(activeWindowId);

  if (action === "smart-organize") {
    const run = await runOrganizeIfAllowed({ activeWindowId, source: "toolbar-menu" });
    return { action, mode: "agent", runStatus: run?.status || "unknown" };
  }

  return {
    action,
    mode: action === "vertical-tabs" ? "vertical_tabs" : "agent"
  };
}

async function resolveToolbarActiveTab(message, sender) {
  if (Number.isInteger(message.activeTabId)) {
    try {
      return await chrome.tabs.get(message.activeTabId);
    } catch {
      // Fall back to the browser's active tab below.
    }
  }

  if (sender?.tab) {
    return sender.tab;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tab || null;
  } catch {
    return null;
  }
}

function resolveToolbarWindowId(message, sender, activeTab) {
  const candidates = [
    message.activeWindowId,
    activeTab?.windowId,
    sender?.tab?.windowId
  ];

  for (const candidate of candidates) {
    const windowId = Number(candidate);
    if (Number.isInteger(windowId)) return windowId;
  }

  return null;
}

async function setSidebarMode(mode, metadata = {}) {
  await chrome.storage.local.set({
    [SIDEBAR_MODE_KEY]: {
      mode,
      source: String(metadata.source || "").slice(0, 80),
      activeWindowId: Number.isInteger(Number(metadata.activeWindowId)) ? Number(metadata.activeWindowId) : null,
      activeTabId: Number.isInteger(Number(metadata.activeTabId)) ? Number(metadata.activeTabId) : null,
      updatedAt: new Date().toISOString()
    }
  });
}

async function setSidebarContextFromTab(tab, source) {
  if (!tab) return;

  const parsed = parseUrl(tab.url || tab.pendingUrl || "");
  await chrome.storage.local.set({
    [SIDEBAR_CONTEXT_KEY]: {
      scope: "current_tab",
      tabId: Number.isInteger(tab.id) ? tab.id : null,
      windowId: Number.isInteger(tab.windowId) ? tab.windowId : null,
      title: String(tab.title || "").slice(0, 160),
      hostname: String(parsed.hostname || "").slice(0, 120),
      source,
      updatedAt: new Date().toISOString()
    }
  });
}

async function openSidePanelForWindow(windowId) {
  if (!Number.isInteger(Number(windowId)) || !chrome.sidePanel?.open) return;
  await chrome.sidePanel.open({ windowId: Number(windowId) });
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

  const classificationInsights = buildClassificationInsights({
    snapshot,
    appliedGroups: applyResult.groups,
    aiSplitSuggestions: aiClassification.splitSuggestions,
    aiMergeSuggestions: aiClassification.mergeSuggestions
  });

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
      aiClassificationProvider: aiClassification.provider || "local",
      aiGroupsSuggested: aiClassification.groupCount,
      classificationSuggestionCount:
        classificationInsights.splitSuggestions.length + classificationInsights.mergeSuggestions.length,
      userRulesApplied: userRuleClassification.byTabId.size,
      undoAvailable: applyResult.groupsCreated > 0
    },
    groups: applyResult.groups,
    classificationInsights
  };

  await publishRun(completedRun);
  return completedRun;
}

async function classifyTabsWithAIIfConfigured(snapshot) {
  const settings = await getAISettings();

  if (!canUseAISettings(settings)) {
    return { status: "not-configured", provider: "local", byTabId: new Map(), groupCount: 0, splitSuggestions: [], mergeSuggestions: [] };
  }

  const tabs = snapshot.tabs
    .filter(canGroupTab)
    .slice(0, 120)
    .map(buildAIClassificationTab);

  if (!tabs.length) {
    return { status: "no-tabs", provider: inferAIProviderId(settings.baseUrl, settings.provider), byTabId: new Map(), groupCount: 0, splitSuggestions: [], mergeSuggestions: [] };
  }

  try {
    const provider = inferAIProviderId(settings.baseUrl, settings.provider);
    const output = await callOpenAICompatibleClassifier(settings, tabs);
    const byTabId = validateAIClassification(output, snapshot);
    return {
      status: byTabId.size ? "applied" : "empty",
      provider,
      byTabId,
      groupCount: new Set(Array.from(byTabId.values()).map((item) => item.name)).size,
      splitSuggestions: validateAIClassificationSplitSuggestions(output),
      mergeSuggestions: validateAIClassificationMergeSuggestions(output)
    };
  } catch (error) {
    return {
      status: `fallback:${normalizeError(error).slice(0, 120)}`,
      provider: inferAIProviderId(settings.baseUrl, settings.provider),
      byTabId: new Map(),
      groupCount: 0,
      splitSuggestions: [],
      mergeSuggestions: []
    };
  }
}

async function getAISettings() {
  const result = await chrome.storage.local.get(AI_SETTINGS_KEY);
  const storedSettings = {
    ...DEFAULT_AI_SETTINGS,
    ...(result[AI_SETTINGS_KEY] || {})
  };
  storedSettings.baseUrl = normalizeAIBaseUrl(storedSettings.baseUrl || DEFAULT_AI_SETTINGS.baseUrl);
  storedSettings.provider = inferAIProviderId(storedSettings.baseUrl, storedSettings.provider);

  if (canUseAISettings(storedSettings)) {
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

  const baseUrl = normalizeAIBaseUrl(settings.baseUrl || DEFAULT_AI_SETTINGS.baseUrl);

  return {
    apiKey,
    baseUrl,
    provider: inferAIProviderId(baseUrl, settings.provider),
    model: String(settings.model || DEFAULT_AI_SETTINGS.model).trim() || DEFAULT_AI_SETTINGS.model
  };
}

async function testAIConnection(message = {}) {
  const storedSettings = await getAISettings();
  const baseUrl = normalizeAIBaseUrl(message.baseUrl || storedSettings.baseUrl);
  const hasMessageApiKey = Object.prototype.hasOwnProperty.call(message, "apiKey");
  const settings = {
    ...storedSettings,
    baseUrl,
    provider: inferAIProviderId(baseUrl, message.provider || storedSettings.provider),
    model: String(message.model || storedSettings.model || DEFAULT_AI_SETTINGS.model).trim(),
    apiKey: String(hasMessageApiKey ? message.apiKey : storedSettings.apiKey || "").trim()
  };

  if (!settings.apiKey && requiresRemoteAIProviderKey(settings.baseUrl)) {
    throw new Error("API key is required before testing AI connection.");
  }

  const permission = await ensureAIProviderPermission(settings.baseUrl, {
    requestPermission: Boolean(message.requestPermission)
  });
  const connection = await fetchOpenAICompatibleModels(settings);
  const models = connection.models;
  const hasConfiguredModel = models.some((model) => model.id === settings.model);
  const modelSuggestions = models
    .filter((model) => model.checkedVia !== "synthetic-chat")
    .map((model) => model.id);
  const sanitizedModelSuggestions = sanitizeAIModelSuggestions(modelSuggestions);

  return {
    provider: settings.provider,
    baseUrl: settings.baseUrl,
    permissionOrigin: permission.origin,
    model: settings.model,
    modelAvailable: hasConfiguredModel,
    modelCount: models.length,
    modelSuggestions: sanitizedModelSuggestions,
    diagnostics: buildAIConnectionDiagnostics({
      settings,
      permission,
      check: connection.check,
      modelCount: models.length,
      modelSuggestionCount: sanitizedModelSuggestions.length,
      modelAvailable: hasConfiguredModel
    }),
    checkedAt: new Date().toISOString(),
    privacy: {
      sentTabData: false,
      sentPageText: false,
      sentFullUrls: false
    }
  };
}

async function runAgentWebSearch(message = {}) {
  const query = sanitizeWebSearchQuery(message.query || message.text || "");

  if (!query) {
    throw new Error("Search query is required.");
  }

  const settings = await getSearchSettings();

  if (!canUseSearchSettings(settings)) {
    return {
      status: "not-configured",
      provider: settings.provider,
      providerLabel: getSearchProviderLabel(settings),
      query,
      results: [],
      answer: "",
      privacy: buildWebSearchPrivacyDisclosure({ configured: false })
    };
  }

  if (settings.provider !== "tavily") {
    return {
      status: "unsupported-provider",
      provider: settings.provider,
      providerLabel: getSearchProviderLabel(settings),
      query,
      results: [],
      answer: "",
      privacy: buildWebSearchPrivacyDisclosure({ configured: true })
    };
  }

  const permission = await ensureWebSearchProviderPermission(settings.baseUrl, {
    requestPermission: Boolean(message.requestPermission)
  });
  const search = await callTavilySearch(settings, {
    query,
    maxResults: message.maxResults
  });

  return {
    status: "completed",
    provider: settings.provider,
    providerLabel: getSearchProviderLabel(settings),
    permissionOrigin: permission.origin,
    query,
    answer: search.answer,
    results: search.results,
    resultCount: search.results.length,
    searchedAt: new Date().toISOString(),
    privacy: buildWebSearchPrivacyDisclosure({ configured: true })
  };
}

async function getSearchSettings() {
  const result = await chrome.storage.local.get(SEARCH_SETTINGS_KEY);
  return sanitizeSearchSettings(result[SEARCH_SETTINGS_KEY]);
}

function sanitizeSearchSettings(settings = {}) {
  const provider = String(settings.provider || DEFAULT_SEARCH_SETTINGS.provider)
    .trim()
    .toLowerCase() || DEFAULT_SEARCH_SETTINGS.provider;
  const baseUrl = normalizeWebSearchBaseUrl(settings.baseUrl || DEFAULT_SEARCH_SETTINGS.baseUrl);
  const maxResults = Math.min(8, Math.max(1, Number.parseInt(settings.maxResults || DEFAULT_SEARCH_SETTINGS.maxResults, 10) || DEFAULT_SEARCH_SETTINGS.maxResults));
  const searchDepth = String(settings.searchDepth || DEFAULT_SEARCH_SETTINGS.searchDepth).toLowerCase() === "advanced" ? "advanced" : "basic";

  return {
    ...DEFAULT_SEARCH_SETTINGS,
    ...settings,
    enabled: Boolean(settings.enabled),
    provider,
    baseUrl,
    apiKey: String(settings.apiKey || "").trim(),
    maxResults,
    searchDepth,
    includeAnswer: settings.includeAnswer !== false
  };
}

function normalizeWebSearchBaseUrl(baseUrl) {
  try {
    const parsed = new URL(String(baseUrl || DEFAULT_SEARCH_SETTINGS.baseUrl).trim());
    if (!["https:", "http:"].includes(parsed.protocol)) {
      return DEFAULT_SEARCH_SETTINGS.baseUrl;
    }

    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return DEFAULT_SEARCH_SETTINGS.baseUrl;
  }
}

function canUseSearchSettings(settings = {}) {
  if (!settings.enabled) return false;
  if (settings.provider !== "tavily") return true;
  return Boolean(String(settings.apiKey || "").trim());
}

function getSearchProviderLabel(settings = {}) {
  const provider = String(settings.provider || DEFAULT_SEARCH_SETTINGS.provider).toLowerCase();
  if (provider === "tavily") return "Tavily";
  return provider || "Search provider";
}

function buildWebSearchPrivacyDisclosure({ configured }) {
  return {
    sentQuery: Boolean(configured),
    sentTabData: false,
    sentPageText: false,
    sentFullUrls: false,
    storage: "session_only_until_saved"
  };
}

async function ensureWebSearchProviderPermission(baseUrl, { requestPermission = false } = {}) {
  const origin = getWebSearchProviderPermissionOrigin(baseUrl);

  if (!chrome.permissions?.contains) {
    return { granted: true, required: true, origin, reason: "permissions-api-unavailable" };
  }

  const hasPermission = await chrome.permissions.contains({ origins: [origin] });

  if (hasPermission) {
    return { granted: true, required: true, origin };
  }

  if (requestPermission && chrome.permissions?.request) {
    const granted = await chrome.permissions.request({ origins: [origin] });

    if (granted) {
      return { granted: true, required: true, origin };
    }
  }

  throw new Error(`Permission is required for search provider origin ${origin}. Run the search again and approve the Chrome permission prompt.`);
}

function getWebSearchProviderPermissionOrigin(baseUrl) {
  const parsed = new URL(normalizeWebSearchBaseUrl(baseUrl));
  return `${parsed.protocol}//${parsed.hostname}/*`;
}

async function callTavilySearch(settings, { query, maxResults } = {}) {
  const safeQuery = sanitizeWebSearchQuery(query);
  const resultLimit = Math.min(8, Math.max(1, Number.parseInt(maxResults || settings.maxResults || DEFAULT_SEARCH_SETTINGS.maxResults, 10) || DEFAULT_SEARCH_SETTINGS.maxResults));

  if (!safeQuery) {
    throw new Error("Search query is required.");
  }

  const response = await fetchWithTimeout(
    getTavilySearchUrl(settings.baseUrl),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${String(settings.apiKey || "").trim()}`
      },
      body: JSON.stringify({
        query: safeQuery,
        search_depth: settings.searchDepth === "advanced" ? "advanced" : "basic",
        max_results: resultLimit,
        include_answer: Boolean(settings.includeAnswer),
        include_raw_content: false,
        include_images: false
      })
    },
    WEB_SEARCH_TIMEOUT_MS,
    "Web search timed out"
  );

  if (!response.ok) {
    throw new Error(`Web search failed (${response.status})`);
  }

  return sanitizeTavilySearchResponse(await response.json(), {
    query: safeQuery,
    maxResults: resultLimit
  });
}

function getTavilySearchUrl(baseUrl) {
  const normalized = normalizeWebSearchBaseUrl(baseUrl || DEFAULT_SEARCH_SETTINGS.baseUrl);
  return normalized.endsWith("/search") ? normalized : `${normalized}/search`;
}

function sanitizeTavilySearchResponse(data = {}, { query, maxResults } = {}) {
  const answer = sanitizeWebSearchText(data.answer || "", 900);
  const results = (Array.isArray(data.results) ? data.results : [])
    .map(sanitizeWebSearchResult)
    .filter(Boolean)
    .slice(0, maxResults || DEFAULT_SEARCH_SETTINGS.maxResults);

  return {
    query: sanitizeWebSearchQuery(query),
    answer,
    results
  };
}

function sanitizeWebSearchResult(result = {}) {
  const url = sanitizeWebSearchUrl(result.url);
  const title = sanitizeWebSearchText(result.title || result.name || "", 140);
  const snippet = sanitizeWebSearchText(result.content || result.snippet || result.description || "", 360);

  if (!url && !title && !snippet) return null;

  return {
    title: title || url.hostname || "Search result",
    url: url.href,
    hostname: url.hostname,
    snippet,
    score: normalizeSearchScore(result.score)
  };
}

function sanitizeWebSearchUrl(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { href: "", hostname: "" };
    }

    return {
      href: parsed.toString().slice(0, 1200),
      hostname: parsed.hostname.toLowerCase().slice(0, 120)
    };
  } catch {
    return { href: "", hostname: "" };
  }
}

function normalizeSearchScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(1, score));
}

function sanitizeWebSearchQuery(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function sanitizeWebSearchText(value, maxLength = 300) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

async function fetchOpenAICompatibleModels(settings) {
  const baseUrl = normalizeAIBaseUrl(settings.baseUrl);
  await ensureAIProviderPermission(baseUrl);

  const response = await fetchWithTimeout(
    getOpenAICompatibleModelsUrl(baseUrl),
    {
      method: "GET",
      headers: buildOpenAICompatibleHeaders(settings)
    },
    Number(settings.connectionTimeoutMs) || AI_CONNECTION_TIMEOUT_MS,
    "AI connection test timed out"
  );

  if (!response.ok) {
    if ([404, 405, 501].includes(response.status)) {
      return testOpenAICompatibleChatModel(settings, baseUrl, {
        modelListStatus: response.status
      });
    }
    throw new Error(`AI connection test failed (${response.status})`);
  }

  const data = await response.json();
  const models = Array.isArray(data?.data) ? data.data : [];

  return {
    models: models
      .map((model) => ({
        id: String(model?.id || "").trim(),
        checkedVia: "models"
      }))
      .filter((model) => model.id),
    check: {
      endpoint: "models",
      method: "GET",
      modelListAvailable: true,
      syntheticPromptUsed: false,
      modelListStatus: response.status
    }
  };
}

async function testOpenAICompatibleChatModel(settings, baseUrl = normalizeAIBaseUrl(settings.baseUrl), options = {}) {
  const model = String(settings.model || DEFAULT_AI_SETTINGS.model).trim() || DEFAULT_AI_SETTINGS.model;
  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: buildOpenAICompatibleHeaders(settings, { json: true }),
      body: JSON.stringify({
        model,
        max_tokens: 2,
        messages: [
          {
            role: "user",
            content: "Reply with OK."
          }
        ]
      })
    },
    Number(settings.connectionTimeoutMs) || AI_CONNECTION_TIMEOUT_MS,
    "AI chat connection test timed out"
  );

  if (!response.ok) {
    throw new Error(`AI chat connection test failed (${response.status})`);
  }

  return {
    models: [{ id: model, checkedVia: "synthetic-chat" }],
    check: {
      endpoint: "synthetic-chat",
      method: "POST",
      modelListAvailable: false,
      syntheticPromptUsed: true,
      modelListStatus: Number(options.modelListStatus || 0) || null,
      chatStatus: response.status
    }
  };
}

function buildAIConnectionDiagnostics({ settings, permission, check = {}, modelCount = 0, modelSuggestionCount = 0, modelAvailable = false } = {}) {
  const baseUrl = normalizeAIBaseUrl(settings?.baseUrl || DEFAULT_AI_SETTINGS.baseUrl);

  return {
    provider: inferAIProviderId(baseUrl, settings?.provider),
    providerLabel: getAIProviderLabel(baseUrl, settings?.provider),
    endpoint: check.endpoint === "synthetic-chat" ? "synthetic-chat" : "models",
    method: check.method === "POST" ? "POST" : "GET",
    modelListAvailable: Boolean(check.modelListAvailable),
    syntheticPromptUsed: Boolean(check.syntheticPromptUsed),
    modelListStatus: Number(check.modelListStatus || 0) || null,
    chatStatus: Number(check.chatStatus || 0) || null,
    modelCount: nonNegativeInt(modelCount),
    modelSuggestionCount: nonNegativeInt(modelSuggestionCount),
    configuredModelListed: Boolean(modelAvailable),
    permissionRequired: Boolean(permission?.required),
    permissionOrigin: String(permission?.origin || getAIProviderPermissionOrigin(baseUrl)),
    localEndpoint: !requiresRemoteAIProviderKey(baseUrl),
    authorizationSent: Boolean(String(settings?.apiKey || "").trim()),
    troubleshootingCodes: buildAIConnectionTroubleshootingCodes({
      baseUrl,
      check,
      modelSuggestionCount,
      modelAvailable
    }),
    sentTabData: false,
    sentPageText: false,
    sentFullUrls: false
  };
}

function buildAIConnectionTroubleshootingCodes({ baseUrl, check = {}, modelSuggestionCount = 0, modelAvailable = false } = {}) {
  const normalizedBaseUrl = normalizeAIBaseUrl(baseUrl || DEFAULT_AI_SETTINGS.baseUrl);
  const codes = [];

  if (!requiresRemoteAIProviderKey(normalizedBaseUrl) && (!modelAvailable || check.endpoint === "synthetic-chat")) {
    const localKind = inferLocalModelEndpointKind(normalizedBaseUrl);
    if (localKind === "ollama") {
      codes.push("start_ollama_load_model");
    } else if (localKind === "lmstudio") {
      codes.push("start_lmstudio_server_load_model");
    } else {
      codes.push("check_local_openai_server");
    }
  }

  if (!modelAvailable && Number(modelSuggestionCount || 0) > 0) {
    codes.push("choose_listed_model");
  } else if (!modelAvailable && check.endpoint === "models") {
    codes.push("check_configured_model_name");
  }

  if (check.endpoint === "synthetic-chat") {
    codes.push("model_list_unavailable_synthetic_only");
  }

  return Array.from(new Set(codes)).slice(0, 3);
}

function inferLocalModelEndpointKind(baseUrl) {
  try {
    const parsed = new URL(normalizeAIBaseUrl(baseUrl));
    const hostname = parsed.hostname.toLowerCase();
    if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) return "";
    if (parsed.port === "11434") return "ollama";
    if (parsed.port === "1234") return "lmstudio";
  } catch {
    return "";
  }

  return "";
}

function getAIProviderLabel(baseUrl, provider = "") {
  const providerId = inferAIProviderId(baseUrl, provider);
  const preset = AI_PROVIDER_PRESETS.get(providerId);

  if (preset?.label) {
    return preset.label;
  }

  if (providerId === "local-openai-compatible") {
    return "Local OpenAI-compatible";
  }

  if (providerId === "openai-compatible") {
    return "OpenAI-compatible";
  }

  return providerId;
}

function sanitizeAIModelSuggestions(modelIds) {
  return Array.from(new Set((Array.isArray(modelIds) ? modelIds : [])
    .map((modelId) => String(modelId || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((modelId) => modelId.slice(0, 160))))
    .slice(0, 30);
}

async function callOpenAICompatibleClassifier(settings, tabs, options = {}) {
  const baseUrl = normalizeAIBaseUrl(settings.baseUrl);
  await ensureAIProviderPermission(baseUrl);

  const safeTabs = sanitizeTabsForAIClassification(tabs);
  const timeoutMs = Number(options.timeoutMs || settings.classificationTimeoutMs || AI_CLASSIFICATION_TIMEOUT_MS);
  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: buildOpenAICompatibleHeaders(settings, { json: true }),
      body: JSON.stringify({
        model: settings.model || DEFAULT_AI_SETTINGS.model,
        response_format: { type: "json_object" },
        max_tokens: 1800,
        messages: [
          {
            role: "system",
            content:
              "You classify browser tabs into task-oriented Chrome tab groups. Return only valid JSON. Do not invent tabIds. Use concise group names. Prefer the user's project, workflow, artifact type, and intent over website domains. Domain-only group names like github.com, Google, YouTube, Other, Websites, or Tabs are weak unless the domain itself is the job. Use only the provided metadata and derived metadata features; do not invent page content."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Classify these tabs into 4-10 useful work groups by project, workflow, artifact type, and intent.",
              allowedColors: Array.from(SUPPORTED_GROUP_COLORS),
              schema: {
                groups: [
                  {
                    name: "string",
                    color: "grey|blue|red|yellow|green|pink|purple|cyan",
                    confidence: 0.0,
                    project: "short project/entity name or empty",
                    workflow: "short workflow/stage name",
                    artifactType: "short artifact type",
                    intent: "short user intent",
                    evidence: ["metadata evidence from title/hostname/path"],
                    reason: "short string based only on metadata",
                    classificationMode: "metadata_semantic",
                    domainOnlyRisk: false,
                    tabIds: [123]
                  }
                ],
                reviewTabIds: [123],
                splitSuggestions: [
                  {
                    fromGroup: "string",
                    suggestedGroups: ["string"],
                    reason: "short metadata reason"
                  }
                ],
                mergeSuggestions: [
                  {
                    groups: ["string"],
                    suggestedGroup: "string",
                    reason: "short metadata reason"
                  }
                ]
              },
              privacyNote:
                "Input contains title, hostname, path, tab state, existing group, and local derived metadata features only. No page body or full URL.",
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
  await ensureAIProviderPermission(baseUrl);

  const timeoutMs = Number(options.timeoutMs || settings.agentTimeoutMs || AI_AGENT_TIMEOUT_MS);
  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: buildOpenAICompatibleHeaders(settings, { json: true }),
      body: JSON.stringify({
        model: settings.model || DEFAULT_AI_SETTINGS.model,
        response_format: { type: "json_object" },
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content:
              "You are TabMosaic's sidebar Tab Agent. Answer browser tab management questions using only the provided tab metadata, active sidebar context, short sanitized conversation history, current group state, and tool registry. The tool registry describes local validated capabilities; it is not permission to claim a tool ran. Use conversationHistory to resolve follow-up references like 'those tabs' or 'why that group'. Prioritize the active context when it is a current tab, selected tabs, or current group, but do not start by restating the active context because the UI already shows it near the composer. Answer the user's question directly in plain language. Do not claim you read page bodies unless a page-content tool actually ran. Do not mention full URLs. Do not mention internal IDs such as tabId, groupId, or windowId unless the user explicitly asks for diagnostics. Do not invent tabIds. Do not apply actions. Do not say you closed, moved, or changed tabs. If the user asks for destructive action, explain that confirmation is required. Return only valid JSON."
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
              toolRegistry: buildAIAgentToolRegistryForPrompt(),
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

function getAgentToolRegistry() {
  return JSON.parse(JSON.stringify(AGENT_TOOL_REGISTRY));
}

function buildAIAgentToolRegistryForPrompt() {
  const registry = getAgentToolRegistry();

  return {
    readOnly: registry.readOnly.map((tool) => ({
      name: tool.name,
      readsPageText: tool.readsPageText,
      confirmation: tool.confirmation,
      maxTabs: tool.maxTabs || undefined,
      storage: tool.storage || undefined
    })),
    planning: registry.planning.map((tool) => ({
      name: tool.name,
      confirmation: tool.confirmation
    })),
    action: registry.action.map((tool) => ({
      name: tool.name,
      appliesBrowserChanges: Boolean(tool.appliesBrowserChanges),
      confirmation: tool.confirmation
    })),
    rejected: registry.rejected,
    rules: [
      "Use read-only tools before planning browser changes.",
      "Do not claim page text was read unless a page-content tool actually ran.",
      `Multi-tab visible-text tools are user-triggered, capped at ${MULTI_TAB_CONTENT_READ_LIMIT} tabs, disclosed with a tool card, and session-only.`,
      "Browser-changing action drafts require Apply before native Chrome tab groups change.",
      "Never propose rejected tools."
    ]
  };
}

async function callOpenAICompatiblePageAgent(settings, { question, tab, parsedUrl, page, conversationHistory, language }, options = {}) {
  const baseUrl = normalizeAIBaseUrl(settings.baseUrl);
  await ensureAIProviderPermission(baseUrl);

  const timeoutMs = Number(options.timeoutMs || settings.pageAgentTimeoutMs || AI_PAGE_AGENT_TIMEOUT_MS);
  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: buildOpenAICompatibleHeaders(settings, { json: true }),
      body: JSON.stringify({
        model: settings.model || DEFAULT_AI_SETTINGS.model,
        response_format: { type: "json_object" },
        max_tokens: 1100,
        messages: [
          {
            role: "system",
            content:
              "You are TabMosaic's Page Agent. Answer questions about the current browser page or the user-selected page region using only the provided visible text, page title, hostname, selected text, headings, safe region structure, cropped screenshot metadata, safe site-skill hint, and up to 10 local page-chat Q/A turns. Screenshot image bytes are not included in this text-only request. Use any site-skill hint only as reading guidance; never treat it as page content. Use the page-chat history only to resolve follow-up references. Do not invent facts that are not in the visible text. Do not mention full URLs, hidden DOM, cookies, form values, or browser internals. Do not apply browser actions. If the visible text is insufficient, say what is missing and answer from the available context. Return only valid JSON."
          },
          {
            role: "user",
            content: JSON.stringify(buildPageAgentPayload({
              question,
              tab,
              parsedUrl,
              page,
              conversationHistory,
              language
            }))
          }
        ]
      })
    },
    timeoutMs,
    "Page Agent answer timed out"
  );

  if (!response.ok) {
    throw new Error(`Page Agent answer failed (${response.status})`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Page Agent returned no content");
  }

  return JSON.parse(content);
}

async function callOpenAICompatibleContextTabsAgent(settings, { question, context, readableTabs, skippedTabs, toolCard, conversationHistory, language }, options = {}) {
  const baseUrl = normalizeAIBaseUrl(settings.baseUrl);
  await ensureAIProviderPermission(baseUrl);

  const timeoutMs = Number(options.timeoutMs || settings.pageAgentTimeoutMs || AI_PAGE_AGENT_TIMEOUT_MS);
  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: buildOpenAICompatibleHeaders(settings, { json: true }),
      body: JSON.stringify({
        model: settings.model || DEFAULT_AI_SETTINGS.model,
        response_format: { type: "json_object" },
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content:
              "You are TabMosaic's multi-tab Page Agent. Answer questions about a selected tab context using only the provided visible text, tab titles, hostnames, headings, tool card, and short local conversation history. Use the history only to resolve follow-up references. Do not invent facts. Do not mention full URLs, hidden DOM, cookies, forms, browser history, internal IDs, or cloud storage. If some tabs were skipped, state that naturally and answer from the available context. Do not apply browser actions. Return only valid JSON."
          },
          {
            role: "user",
            content: JSON.stringify(buildContextTabsAgentPayload({
              question,
              context,
              readableTabs,
              skippedTabs,
              toolCard,
              conversationHistory,
              language
            }))
          }
        ]
      })
    },
    timeoutMs,
    "Multi-tab Page Agent answer timed out"
  );

  if (!response.ok) {
    throw new Error(`Multi-tab Page Agent answer failed (${response.status})`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Multi-tab Page Agent returned no content");
  }

  return JSON.parse(content);
}

async function callOpenAICompatibleContextRegroupAgent(settings, { instruction, context, readableTabs, skippedTabs, toolCard, language }, options = {}) {
  const baseUrl = normalizeAIBaseUrl(settings.baseUrl);
  await ensureAIProviderPermission(baseUrl);

  const timeoutMs = Number(options.timeoutMs || settings.pageAgentTimeoutMs || AI_PAGE_AGENT_TIMEOUT_MS);
  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: buildOpenAICompatibleHeaders(settings, { json: true }),
      body: JSON.stringify({
        model: settings.model || DEFAULT_AI_SETTINGS.model,
        response_format: { type: "json_object" },
        max_tokens: 1400,
        messages: [
          {
            role: "system",
            content:
              "You are TabMosaic's content-assisted regrouping planner. Build a safe Chrome tab grouping preview from the provided visible text and tab metadata. Return only valid JSON. Use only existing tabIds from the input. Do not invent tabIds. Do not close tabs. Do not claim changes were applied. Group by user job, project, workflow, artifact type, or page intent instead of domain. If tabs share a host or project but their visible text points to different work activities, split them into precise workflow groups instead of one broad umbrella group. Keep group names concise and useful."
          },
          {
            role: "user",
            content: JSON.stringify(buildContextRegroupPayload({
              instruction,
              context,
              readableTabs,
              skippedTabs,
              toolCard,
              language
            }))
          }
        ]
      })
    },
    timeoutMs,
    "Content-assisted regrouping timed out"
  );

  if (!response.ok) {
    throw new Error(`Content-assisted regrouping failed (${response.status})`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Content-assisted regrouping returned no content");
  }

  return JSON.parse(content);
}

function buildContextTabsAgentPayload({ question, context, readableTabs, skippedTabs, toolCard, conversationHistory, language }) {
  return {
    task: "Answer the user's question about this selected tab context and produce a concise group summary when the user asks what the group/tabs are about.",
    userQuestion: sanitizePageQuestion(question) || "Summarize this context.",
    language: language || "en",
    privacyNote:
      "Input contains selected/current-group tab titles, hostnames, visible page text, selected text, headings, tool-card counts, skipped reason labels/counts, and up to 10 local context Q/A turns only. Full URLs, query strings, hashes, cookies, form values, hidden DOM, browser history, saved workspace contents, persistent summaries, and cloud storage are not included.",
    toolCard: sanitizeContextToolCardForPrompt(toolCard),
    context: {
      scope: context?.scope || "current_group",
      groupName: String(context?.groupName || "").slice(0, 100),
      tabCount: nonNegativeInt(context?.tabCount)
    },
    skippedBreakdown: sanitizeContextSkipBreakdownForPrompt(toolCard?.skippedBreakdown || buildContextSkipBreakdown(skippedTabs)),
    schema: {
      answer: "direct conversational answer grounded in visible text",
      groupSummary: {
        label: "short group/context label",
        source: "visible_text|metadata",
        themes: ["up to three project/task/content themes"],
        topHosts: ["up to three hostnames"],
        suggestedNextSteps: ["up to three safe next steps"]
      },
      keyPoints: ["up to four concise supporting points"],
      tabSummaries: [
        {
          tabId: 123,
          title: "tab title",
          summary: "short summary",
          usefulFor: "why this tab matters",
          suggestedAction: "keep|read_later|review"
        }
      ],
      recommendations: ["safe next step"],
      confidence: 0.0
    },
    tabs: sanitizeReadableContextTabsForPrompt(readableTabs),
    skippedTabs: sanitizeSkippedContextTabsForPrompt(skippedTabs),
    conversationHistory: sanitizePageAgentConversation(conversationHistory)
  };
}

function buildContextRegroupPayload({ instruction, context, readableTabs, skippedTabs, toolCard, language }) {
  return {
    task: "Create an Apply/Cancel preview for regrouping this selected tab context by actual visible page content.",
    instruction: sanitizePageQuestion(instruction) || "Regroup these tabs by page content.",
    language: language || "en",
    privacyNote:
      "Input contains selected/current-group tab titles, hostnames, visible page text, selected text, headings, tool-card counts, and skipped reason labels/counts only. Full URLs, query strings, hashes, cookies, form values, hidden DOM, browser history, saved workspace contents, persistent summaries, and cloud storage are not included. The browser will not change unless the user clicks Apply.",
    toolCard: sanitizeContextToolCardForPrompt(toolCard),
    context: {
      scope: context?.scope || "current_group",
      groupName: String(context?.groupName || "").slice(0, 100),
      tabCount: nonNegativeInt(context?.tabCount)
    },
    skippedBreakdown: sanitizeContextSkipBreakdownForPrompt(toolCard?.skippedBreakdown || buildContextSkipBreakdown(skippedTabs)),
    schema: {
      answer: "short preview explanation",
      groups: [
        {
          name: "concise Chrome group name",
          color: "grey|blue|red|yellow|green|pink|purple|cyan",
          reason: "why these tabs belong together based only on provided content",
          tabIds: [123]
        }
      ],
      confidence: 0.0
    },
    rules: [
      "Use only tabIds from tabs.",
      "Do not include close, delete, archive, bookmark, history, navigation, form, or page-click actions.",
      "Prefer project/workflow/content groups over host/domain groups.",
      "Do not merge tabs only because they share the same hostname, product, or broad project.",
      "For a small selected context with clearly different page intents, prefer several precise task groups over one umbrella group.",
      "A tab may appear in at most one group.",
      "It is okay to leave a tab unassigned if the visible text is not enough."
    ],
    tabs: sanitizeReadableContextTabsForPrompt(readableTabs),
    skippedTabs: sanitizeSkippedContextTabsForPrompt(skippedTabs)
  };
}

function sanitizeContextToolCardForPrompt(toolCard = {}) {
  return {
    toolName: String(toolCard.toolName || "read_group_pages").slice(0, 60),
    label: String(toolCard.label || "Read group pages").slice(0, 80),
    scope: {
      type: String(toolCard.scope?.type || "current_group").slice(0, 40),
      requestedTabCount: nonNegativeInt(toolCard.scope?.requestedTabCount),
      readTabCount: nonNegativeInt(toolCard.scope?.readTabCount),
      skippedTabCount: nonNegativeInt(toolCard.scope?.skippedTabCount),
      maxTabs: MULTI_TAB_CONTENT_READ_LIMIT
    },
    dataUsed: ["visible_text", "title", "hostname", "headings"],
    storage: "session_only",
    status: String(toolCard.status || "completed").slice(0, 24),
    skippedReasons: Array.isArray(toolCard.skippedReasons)
      ? toolCard.skippedReasons.map((reason) => String(reason).slice(0, 40)).slice(0, 5)
      : [],
    skippedBreakdown: sanitizeContextSkipBreakdownForPrompt(toolCard.skippedBreakdown)
  };
}

function sanitizeReadableContextTabsForPrompt(readableTabs) {
  return (Array.isArray(readableTabs) ? readableTabs : [])
    .slice(0, MULTI_TAB_CONTENT_READ_LIMIT)
    .map((tab) => ({
      tabId: Number(tab.tabId),
      title: sanitizePageAgentPromptText(tab.title, 180),
      hostname: String(tab.hostname || "").slice(0, 120),
      headings: sanitizePageAgentHeadings(tab.page?.headings),
      selectedText: sanitizePageAgentPromptText(tab.page?.selectedText, 1200),
      visibleText: sanitizePageAgentPromptText(tab.page?.visibleText, 5000)
    }));
}

function sanitizeSkippedContextTabsForPrompt(skippedTabs) {
  return (Array.isArray(skippedTabs) ? skippedTabs : [])
    .slice(0, 12)
    .map((tab) => ({
      title: sanitizePageAgentPromptText(tab.title, 120),
      hostname: String(tab.hostname || "").slice(0, 120),
      reason: String(tab.reason || "unreadable").slice(0, 40),
      reasonLabel: sanitizePageAgentPromptText(tab.reasonLabel || getContextSkipReasonMeta(tab.reason).label, 60)
    }));
}

function sanitizeContextSkipBreakdownForPrompt(skippedBreakdown) {
  return (Array.isArray(skippedBreakdown) ? skippedBreakdown : [])
    .map((item) => ({
      reason: String(item.reason || "unreadable").slice(0, 40),
      label: sanitizePageAgentPromptText(item.label || getContextSkipReasonMeta(item.reason).label, 60),
      count: nonNegativeInt(item.count)
    }))
    .filter((item) => item.count > 0)
    .slice(0, 6);
}

function buildPageAgentPayload({ question, tab, parsedUrl, page, conversationHistory, language }) {
  const title = String(page?.title || tab?.title || "Untitled").replace(/\s+/g, " ").trim().slice(0, 180);
  const userQuestion = sanitizePageQuestion(question) || "Summarize this page.";
  const isSelectedRegion = page?.source === "selected_region";
  const siteSkill = buildCurrentPageSiteSkill(parsedUrl, page);
  const siteSkillPrivacyNote =
    siteSkill
      ? " A generic site-skill hint is included to describe page type and reading guidance; it does not include the full URL, owner/repository path, object number, query string, hash, or hidden page content."
      : "";

  return {
    task: question
      ? (isSelectedRegion
          ? "Answer the user's question about the user-selected page region."
          : "Answer the user's question about the current visible page.")
      : (isSelectedRegion
          ? "Summarize the user-selected page region for a knowledge worker."
          : "Summarize the current visible page for a knowledge worker."),
    userQuestion,
    language: language || "en",
    privacyNote:
      isSelectedRegion
        ? `Input contains current-tab title, hostname, visible text from one user-selected page region, region headings, safe link labels, list/table structure text, cropped region screenshot metadata, and up to 10 local page-chat Q/A turns only.${siteSkillPrivacyNote} Screenshot image bytes, full visible-tab screenshots, full URL, query string, hash, cookies, form values, hidden DOM, unrelated page DOM, browser history, workspace memory, and cloud storage are not included. Obvious token-like strings and connection strings are redacted best-effort before upload.`
        : `Input contains current-tab title, hostname, visible page text, selected text, headings, description, and up to 10 local page-chat Q/A turns only.${siteSkillPrivacyNote} Full URL, query string, hash, cookies, form values, hidden DOM, browser history, workspace memory, and cloud storage are not included. Obvious token-like strings and connection strings are redacted best-effort before upload.`,
    schema: {
      answer: "direct conversational answer grounded in visible text",
      keyPoints: ["up to four concise supporting points"],
      suggestedGroup: "short Chrome tab group name",
      suggestedAction: "keep|read_later|review",
      confidence: 0.0
    },
    page: {
      title,
      hostname: String(parsedUrl?.hostname || "").slice(0, 120),
      description: sanitizePageAgentPromptText(page?.description, 1200),
      headings: sanitizePageAgentHeadings(page?.headings),
      selectedText: sanitizePageAgentPromptText(page?.selectedText, 4000),
      visibleText: sanitizePageAgentPromptText(page?.text, MAX_PAGE_AGENT_TEXT_CHARS),
      source: isSelectedRegion ? "selected_region" : "current_page",
      siteSkill: sanitizePageSiteSkillForPrompt(siteSkill),
      region: isSelectedRegion ? sanitizePageRegionForPrompt(page?.region) : null
    },
    conversationHistory: sanitizePageAgentConversation(conversationHistory)
  };
}

function buildCurrentPageSiteSkill(parsedUrl = {}, page = {}) {
  const hostname = String(parsedUrl?.hostname || "").toLowerCase();
  const path = String(parsedUrl?.path || "").toLowerCase();
  const title = String(page?.title || "");
  const artifactType = inferTabArtifactType({ hostname, path, title });

  if (hostname === "github.com" && artifactType === "pull_request") {
    return createPageSiteSkill({
      id: "github_pull_request_review",
      label: "GitHub Pull Request",
      capabilities: [
        "summarize_change_intent",
        "identify_review_risks",
        "find_test_signals",
        "suggest_review_next_steps"
      ],
      guidance: [
        "Treat this page as a code review surface.",
        "Ground answers in visible PR text such as title, description, checks, changed-file headings, and discussion snippets.",
        "Call out missing context when the visible text does not include the diff, tests, CI result, or review discussion.",
        "Prefer review next steps over browser actions."
      ],
      dataBoundary: "visible_text_only_no_repo_path_or_pr_number"
    });
  }

  if (hostname === "github.com" && artifactType === "issue") {
    return createPageSiteSkill({
      id: "github_issue_triage",
      label: "GitHub Issue",
      capabilities: [
        "summarize_problem",
        "extract_acceptance_criteria",
        "identify_blockers",
        "suggest_triage_next_steps"
      ],
      guidance: [
        "Treat this page as an issue triage surface.",
        "Ground answers in visible issue title, description, labels, comments, assignees, and status cues.",
        "Call out missing context when the visible text does not include reproduction steps, owner, priority, or acceptance criteria.",
        "Prefer triage next steps over browser actions."
      ]
    });
  }

  if (hostname === "github.com" && artifactType === "ci_run") {
    return createPageSiteSkill({
      id: "github_ci_run_review",
      label: "GitHub CI Run",
      capabilities: [
        "summarize_check_status",
        "identify_failing_jobs",
        "extract_error_signals",
        "suggest_debug_next_steps"
      ],
      guidance: [
        "Treat this page as a CI/checks review surface.",
        "Ground answers in visible job names, statuses, log snippets, errors, and timing cues.",
        "Call out missing context when the visible text does not include logs, failed steps, or linked commits.",
        "Prefer debugging next steps over browser actions."
      ]
    });
  }

  if (hostname.includes("supabase.com") || hostname.includes("vercel.com") || hostname.includes("console.aws.amazon.com") || hostname.includes("cloudflare.com")) {
    return createPageSiteSkill({
      id: "cloud_project_settings_review",
      label: "Cloud Project Console",
      capabilities: [
        "summarize_configuration_area",
        "identify_risky_settings",
        "find_deployment_or_runtime_signals",
        "suggest_safe_admin_next_steps"
      ],
      guidance: [
        "Treat this page as a cloud project/admin console surface.",
        "Ground answers in visible settings, status labels, deployment/runtime cues, warnings, and table labels.",
        "Call out missing context when the visible text does not include current values, environment, or impact details.",
        "Prefer reversible review steps before suggesting configuration changes."
      ]
    });
  }

  if (hostname.includes("linear.app") || hostname.includes("jira") || hostname.includes("atlassian.net")) {
    return createPageSiteSkill({
      id: "project_issue_triage",
      label: "Project Issue",
      capabilities: [
        "summarize_work_item",
        "extract_status_and_owner",
        "identify_blockers",
        "suggest_project_next_steps"
      ],
      guidance: [
        "Treat this page as a project issue or task surface.",
        "Ground answers in visible title, description, status, priority, owner, comments, and linked context.",
        "Call out missing context when the visible text does not include acceptance criteria, dependencies, or timeline.",
        "Prefer project-management next steps over browser actions."
      ]
    });
  }

  if (hostname.includes("figma.com") || hostname.includes("canva.com")) {
    return createPageSiteSkill({
      id: "design_file_review",
      label: "Design File",
      capabilities: [
        "summarize_design_context",
        "identify_review_focus",
        "extract_visible_labels",
        "suggest_design_review_next_steps"
      ],
      guidance: [
        "Treat this page as a design review surface.",
        "Ground answers in visible frame names, labels, comments, page text, and selected-region context.",
        "Call out missing context when visual details are not available in visible text.",
        "Suggest selecting a page region when the user asks about a specific visual area."
      ]
    });
  }

  if (hostname === "docs.google.com" || hostname.includes("notion.so") || hostname.includes("coda.io")) {
    return createPageSiteSkill({
      id: "collaboration_document_review",
      label: "Collaboration Document",
      capabilities: [
        "summarize_document_intent",
        "extract_decisions_and_tasks",
        "identify_open_questions",
        "suggest_document_next_steps"
      ],
      guidance: [
        "Treat this page as a collaborative document or workspace surface.",
        "Ground answers in visible headings, selected text, document body snippets, comments, and table labels.",
        "Call out missing context when visible text is too partial for a full document answer.",
        "Prefer concise synthesis, decisions, open questions, and next steps."
      ]
    });
  }

  return null;
}

function createPageSiteSkill({ id, label, capabilities, guidance, dataBoundary }) {
  return {
    id,
    label,
    source: "hostname_path_pattern",
    capabilities,
    guidance,
    dataBoundary: dataBoundary || "visible_text_only_no_object_path_or_number"
  };
}

function sanitizePageSiteSkillForPrompt(skill = null) {
  if (!skill || !skill.id) return null;

  return {
    id: sanitizePageAgentPromptText(skill.id, 80),
    label: sanitizePageAgentPromptText(skill.label, 100),
    source: sanitizePageAgentPromptText(skill.source, 80),
    capabilities: sanitizePromptList(skill.capabilities, 8, 80),
    guidance: sanitizePromptList(skill.guidance, 6, 220),
    dataBoundary: sanitizePageAgentPromptText(skill.dataBoundary, 140)
  };
}

function sanitizePageRegionForPrompt(region = {}) {
  return {
    label: sanitizePageAgentPromptText(region.label, 120),
    tagName: sanitizePageAgentPromptText(region.tagName, 24),
    role: sanitizePageAgentPromptText(region.role, 40),
    safeLinkLabels: sanitizePromptList(region.safeLinkLabels, 12, 120),
    listItems: sanitizePromptList(region.listItems, 12, 160),
    tableHeaders: sanitizePromptList(region.tableHeaders, 12, 80),
    tableRows: sanitizePromptTableRows(region.tableRows, 8, 6, 120),
    screenshot: sanitizeRegionScreenshotForPrompt(region.screenshot)
  };
}

function sanitizeRegionScreenshotForPrompt(screenshot = {}) {
  const captured = Boolean(screenshot.captured);

  return {
    captured,
    type: captured ? String(screenshot.type || REGION_SCREENSHOT_OUTPUT_TYPE).slice(0, 32) : "",
    width: captured ? nonNegativeInt(screenshot.width) : 0,
    height: captured ? nonNegativeInt(screenshot.height) : 0,
    byteLength: captured ? nonNegativeInt(screenshot.byteLength) : 0,
    source: captured ? "user_selected_region_crop" : "",
    imageDataIncluded: false,
    imageDataUploaded: false,
    imageDataStored: false,
    fullVisibleTabCaptureDiscarded: captured ? true : false,
    reason: captured ? "" : sanitizePageAgentPromptText(screenshot.reason || "not_captured", 80)
  };
}

function sanitizePromptList(values, limit, charLimit) {
  return (Array.isArray(values) ? values : [])
    .map((value) => sanitizePageAgentPromptText(value, charLimit))
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizePromptTableRows(rows, rowLimit, cellLimit, charLimit) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => (Array.isArray(row) ? row : [])
      .map((cell) => sanitizePageAgentPromptText(cell, charLimit))
      .filter(Boolean)
      .slice(0, cellLimit))
    .filter((row) => row.length)
    .slice(0, rowLimit);
}

function validateAIPageAnswer(output, fallbackSummary = {}, options = {}) {
  const answer = sanitizeVisiblePageAgentText(output?.answer || output?.summary, 1400);

  if (!answer) {
    throw new Error("Page Agent returned an empty answer");
  }

  const keyPoints = (Array.isArray(output?.keyPoints) ? output.keyPoints : [])
    .map((point) => sanitizeVisiblePageAgentText(point, 220))
    .filter(Boolean)
    .slice(0, 4);
  const suggestedGroup = cleanGroupName(output?.suggestedGroup) || fallbackSummary.suggestedGroup || "Current Page";
  const suggestedAction = normalizePageAgentSuggestedAction(output?.suggestedAction) || fallbackSummary.suggestedAction || "keep";

  return {
    ...fallbackSummary,
    status: "completed",
    provider: options.provider || DEFAULT_AI_SETTINGS.provider,
    aiUsed: true,
    summary: answer,
    keyPoints: keyPoints.length ? keyPoints : fallbackSummary.keyPoints || [],
    suggestedGroup,
    suggestedAction,
    confidence: clamp(Number(output?.confidence || fallbackSummary.confidence || 0.68), 0, 1),
    privacy: {
      sentTabMetadata: true,
      sentPageText: true,
      sentFullUrls: false,
      storedCloud: false
    }
  };
}

function validateAIContextTabsAnswer(output, fallbackSummary = {}, options = {}) {
  const answer = sanitizeVisiblePageAgentText(output?.answer || output?.summary, 1600);

  if (!answer) {
    throw new Error("Multi-tab Page Agent returned an empty answer");
  }

  const validReadableIds = new Set((fallbackSummary.tabSummaries || []).map((tab) => Number(tab.tabId)).filter(Number.isInteger));
  const keyPoints = (Array.isArray(output?.keyPoints) ? output.keyPoints : [])
    .map((point) => sanitizeVisiblePageAgentText(point, 240))
    .filter(Boolean)
    .slice(0, 4);
  const recommendations = (Array.isArray(output?.recommendations) ? output.recommendations : [])
    .map((item) => sanitizeVisiblePageAgentText(item, 220))
    .filter(Boolean)
    .slice(0, 4);
  const tabSummaries = (Array.isArray(output?.tabSummaries) ? output.tabSummaries : [])
    .map((item) => {
      const tabId = Number(item?.tabId);
      if (!validReadableIds.has(tabId)) return null;

      return {
        tabId,
        title: sanitizeVisiblePageAgentText(item?.title, 140),
        summary: sanitizeVisiblePageAgentText(item?.summary, 280),
        usefulFor: sanitizeVisiblePageAgentText(item?.usefulFor, 160),
        suggestedAction: normalizePageAgentSuggestedAction(item?.suggestedAction) || "keep"
      };
    })
    .filter(Boolean)
    .slice(0, MULTI_TAB_CONTENT_READ_LIMIT);

  return {
    ...fallbackSummary,
    status: "completed",
    provider: options.provider || DEFAULT_AI_SETTINGS.provider,
    aiUsed: true,
    answer,
    summary: answer,
    groupSummary: fallbackSummary.groupSummary || null,
    keyPoints: keyPoints.length ? keyPoints : fallbackSummary.keyPoints || [],
    tabSummaries: tabSummaries.length ? tabSummaries : fallbackSummary.tabSummaries || [],
    recommendations: recommendations.length ? recommendations : fallbackSummary.recommendations || [],
    confidence: clamp(Number(output?.confidence || fallbackSummary.confidence || 0.7), 0, 1),
    privacy: {
      sentTabMetadata: true,
      sentPageText: true,
      sentFullUrls: false,
      storedCloud: false
    }
  };
}

function validateAIContextRegroupDraft(output, { instruction, context, readableTabs, skippedTabs, toolCard, provider } = {}) {
  const readableById = new Map((Array.isArray(readableTabs) ? readableTabs : []).map((tab) => [Number(tab.tabId), tab]));
  const seenTabIds = new Set();
  const groups = [];
  const rawGroups = Array.isArray(output?.groups) ? output.groups : [];

  for (const rawGroup of rawGroups.slice(0, 8)) {
    const groupName = cleanGroupName(rawGroup?.name) || cleanGroupName(rawGroup?.groupName);
    if (!groupName) continue;

    const tabIds = (Array.isArray(rawGroup?.tabIds) ? rawGroup.tabIds : [])
      .map((tabId) => Number(tabId))
      .filter((tabId) => Number.isInteger(tabId) && readableById.has(tabId) && !seenTabIds.has(tabId))
      .slice(0, MULTI_TAB_CONTENT_READ_LIMIT);

    if (!tabIds.length) continue;

    for (const tabId of tabIds) {
      seenTabIds.add(tabId);
    }

    groups.push({
      name: groupName,
      color: SUPPORTED_GROUP_COLORS.has(rawGroup?.color) ? rawGroup.color : inferGroupColor(groupName),
      reason: sanitizeVisiblePageAgentText(rawGroup?.reason, 180) || "Grouped by visible page content.",
      tabIds
    });
  }

  if (!groups.length) {
    throw new Error("Content-assisted regrouping returned no usable groups.");
  }

  return buildContextRegroupDraft({
    instruction,
    context,
    groups,
    readableTabs,
    skippedTabs,
    toolCard,
    provider: provider || DEFAULT_AI_SETTINGS.provider,
    aiUsed: true,
    answer: sanitizeVisiblePageAgentText(output?.answer || output?.summary, 900) ||
      `I can regroup ${seenTabIds.size} tab(s) by visible page content.`
  });
}

function buildLocalContextRegroupDraft({ instruction, context, readableTabs, skippedTabs, toolCard }) {
  const readable = Array.isArray(readableTabs) ? readableTabs : [];

  if (!readable.length) {
    throw new Error("I could not read enough visible text to build a regrouping preview.");
  }

  const grouped = new Map();

  for (const tab of readable) {
    const groupName = inferLocalContentGroupName(tab, context);
    const existing = grouped.get(groupName) || {
      name: groupName,
      color: inferGroupColor(groupName),
      reason: "Local visible-text keyword grouping.",
      tabIds: []
    };

    existing.tabIds.push(tab.tabId);
    grouped.set(groupName, existing);
  }

  return buildContextRegroupDraft({
    instruction,
    context,
    groups: Array.from(grouped.values()).slice(0, 8),
    readableTabs,
    skippedTabs,
    toolCard,
    provider: "local",
    aiUsed: false,
    answer: `I can preview a local regrouping for ${readable.length} readable tab(s) using visible page text.`
  });
}

function buildContextRegroupDraft({ instruction, context, groups, readableTabs, skippedTabs, toolCard, provider, aiUsed, answer }) {
  const readableById = new Map((Array.isArray(readableTabs) ? readableTabs : []).map((tab) => [Number(tab.tabId), tab]));
  const normalizedGroups = (Array.isArray(groups) ? groups : [])
    .map((group) => {
      const name = cleanGroupName(group?.name) || "Content Group";
      const tabIds = Array.from(new Set((Array.isArray(group?.tabIds) ? group.tabIds : [])
        .map((tabId) => Number(tabId))
        .filter((tabId) => Number.isInteger(tabId) && readableById.has(tabId))));

      if (!tabIds.length) return null;

      return {
        name,
        color: SUPPORTED_GROUP_COLORS.has(group?.color) ? group.color : inferGroupColor(name),
        reason: sanitizeVisiblePageAgentText(group?.reason, 180) || "Grouped by visible page content.",
        tabIds,
        matchedTabs: tabIds.map((tabId) => sanitizeReadableContextTabPreview(readableById.get(tabId)))
      };
    })
    .filter(Boolean);
  const matchedTabs = normalizedGroups.flatMap((group) => group.matchedTabs);
  const movedCount = matchedTabs.length;
  const groupCount = normalizedGroups.length;

  if (!groupCount || !movedCount) {
    throw new Error("No readable tabs were available for regrouping.");
  }

  return {
    id: buildDraftId(`content-regroup:${instruction}:${normalizedGroups.map((group) => `${group.name}:${group.tabIds.join(",")}`).join("|")}`),
    type: "regroup_tabs",
    status: "regroup-preview",
    createdAt: new Date().toISOString(),
    createdFrom: aiUsed ? "content-agent" : "local-content",
    instruction: sanitizeVisiblePageAgentText(instruction, 500) || "Regroup by visible page content",
    answer,
    actionSummary: `Preview ${groupCount} content-based group(s) for ${movedCount} tab(s).`,
    groups: normalizedGroups,
    matchedTabs,
    matchedTabCount: movedCount,
    skippedTabs: Array.isArray(skippedTabs) ? skippedTabs.slice(0, 12) : [],
    toolCard,
    provider,
    aiUsed: Boolean(aiUsed),
    privacy: {
      sentTabMetadata: Boolean(aiUsed),
      sentPageText: Boolean(aiUsed),
      sentFullUrls: false,
      storedCloud: false
    },
    risk: "No browser changes happen until Apply. No tabs will be closed. Visible page text was read only for this user-triggered context and is not stored."
  };
}

function inferLocalContentGroupName(tab, context = {}) {
  const text = [
    tab?.title || "",
    tab?.hostname || "",
    ...(Array.isArray(tab?.page?.headings) ? tab.page.headings : []),
    tab?.page?.description || "",
    tab?.page?.visibleText || ""
  ].join(" ").toLowerCase();

  if (/pull request|code review|\bpr\b|github|commit|merge/.test(text)) return "Code Review";
  if (/chrome extension|manifest|sidepanel|tabs api|tabgroups|mv3/.test(text)) return "Chrome Extension Docs";
  if (/database|supabase|sql|schema|connection|string|migration/.test(text)) return "Database Work";
  if (/deploy|deployment|logs?|error|incident|debug|vercel|cloudflare|aws/.test(text)) return "Debugging";
  if (/prd|spec|roadmap|planning|requirements|user story|mvp/.test(text)) return "Product Planning";
  if (/figma|design|wireframe|prototype|ux|ui/.test(text)) return "Design Review";
  if (/pricing|billing|invoice|subscription|payment|stripe/.test(text)) return "Billing";
  if (/article|research|guide|docs|documentation|learn|tutorial|compare/.test(text)) return "Research";

  return cleanGroupName(context.groupName) || "Content Review";
}

function sanitizeReadableContextTabPreview(tab) {
  return {
    id: Number(tab?.tabId),
    title: String(tab?.title || "Untitled").slice(0, 160),
    hostname: String(tab?.hostname || "").slice(0, 120),
    path: String(tab?.path || "").slice(0, 160),
    active: false,
    pinned: false,
    audible: false
  };
}

function normalizePageAgentSuggestedAction(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (["keep", "read_later", "review"].includes(normalized)) {
    return normalized;
  }

  return "";
}

function sanitizePageAgentConversation(history) {
  return (Array.isArray(history) ? history : [])
    .map((entry) => {
      const role = entry?.role === "assistant" ? "assistant" : entry?.role === "user" ? "user" : "";
      const text = sanitizePageAgentPromptText(entry?.text, 700);

      return role && text ? { role, text } : null;
    })
    .filter(Boolean)
    .slice(-AI_PAGE_AGENT_CONVERSATION_LIMIT);
}

function sanitizePageAgentHeadings(headings) {
  return (Array.isArray(headings) ? headings : [])
    .map((heading) => sanitizePageAgentPromptText(heading, 180))
    .filter(Boolean)
    .slice(0, 12);
}

function sanitizePageAgentPromptText(value, maxLength = 1000) {
  return redactSensitivePromptText(value)
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeVisiblePageAgentText(value, maxLength = 1000) {
  return redactSensitivePromptText(value)
    .replace(/\bwindow\s*[:#]?\s*\d+\b/gi, "the current window")
    .replace(/窗口\s*[:#]?\s*\d+\b/g, "当前窗口")
    .replace(/\btab(?:id|\s+id)?\s*[:#]?\s*\d+\b/gi, "this tab")
    .replace(/\bgroup(?:id|\s+id)?\s*[:#]?\s*-?\d+\b/gi, "this group")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function redactSensitivePromptText(value) {
  return String(value || "")
    .replace(/\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s"'<>]+/gi, "[redacted connection string]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted-token]")
    .replace(/\bsk-[A-Za-z0-9_-]{6,}\b/g, "[redacted-api-key]")
    .replace(/\bAKIA[A-Z0-9]{16}\b/g, "[redacted-access-key]")
    .replace(/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/g, "[redacted-jwt]")
    .replace(/\b(?:https?|file|chrome|chrome-extension|edge|brave):\/\/[^\s"'<>]+/gi, redactConversationUrl)
    .replace(/([?&](?:token|key|api_key|apikey|access_token|auth|session|code|secret|password)=)[^\s&]+/gi, "$1[redacted]");
}

function validateAIAgentAnswer(output, state, options = {}) {
  const answer = sanitizeVisibleAIAgentText(output?.answer, 1000);

  if (!answer) {
    throw new Error("AI Agent returned an empty answer");
  }

  const tabById = new Map((state.tabs || []).map((tab) => [tab.tabId, tab]));
  const relevantTabIds = extractAIAgentRelevantTabIds(output)
    .filter((tabId) => tabById.has(tabId))
    .slice(0, 8);
  const nextSteps = (Array.isArray(output?.suggestedNextSteps) ? output.suggestedNextSteps : [])
    .map((step) => sanitizeVisibleAIAgentText(step, 160))
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
      provider: options.provider || DEFAULT_AI_SETTINGS.provider,
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
    provider: options.provider || DEFAULT_AI_SETTINGS.provider,
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

function sanitizeVisibleAIAgentText(value, maxLength = 1000) {
  return String(value || "")
    .replace(/\bwindow\s*[:#]?\s*\d+\b/gi, "the current window")
    .replace(/窗口\s*[:#]?\s*\d+\b/g, "当前窗口")
    .replace(/\btab(?:id|\s+id)?\s*[:#]?\s*\d+\b/gi, "this tab")
    .replace(/\bgroup(?:id|\s+id)?\s*[:#]?\s*-?\d+\b/gi, "this group")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
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

function buildAIClassificationTab(tab) {
  const base = {
    tabId: tab.id,
    title: String(tab.title || ""),
    hostname: String(tab.hostname || ""),
    path: String(tab.path || ""),
    windowId: tab.windowId,
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    audible: Boolean(tab.audible),
    discarded: Boolean(tab.discarded),
    existingGroup: tab.groupTitle || null
  };

  return {
    ...base,
    ...buildTabSemanticFeatures(base)
  };
}

function sanitizeTabsForAIClassification(tabs) {
  return (Array.isArray(tabs) ? tabs : []).map((tab) => {
    const base = {
      tabId: Number.isInteger(Number(tab.tabId)) ? Number(tab.tabId) : tab.tabId,
      title: String(tab.title || "").slice(0, 180),
      hostname: String(tab.hostname || "").slice(0, 120),
      path: String(tab.path || "").slice(0, 180),
      windowId: Number.isInteger(Number(tab.windowId)) ? Number(tab.windowId) : 0,
      active: Boolean(tab.active),
      pinned: Boolean(tab.pinned),
      audible: Boolean(tab.audible),
      discarded: Boolean(tab.discarded),
      existingGroup: tab.existingGroup || null
    };

    return {
      ...base,
      ...buildTabSemanticFeatures(base)
    };
  });
}

function buildTabSemanticFeatures(tab) {
  const hostname = String(tab.hostname || "").toLowerCase();
  const path = String(tab.path || "").toLowerCase();
  const title = String(tab.title || "");
  const artifactType = inferTabArtifactType({ hostname, path, title });
  const workflow = inferTabWorkflow({ hostname, path, title, artifactType });
  const domainCategory = inferTabDomainCategory(hostname);
  const projectCandidate = inferProjectCandidate({ hostname, path, title, artifactType });
  const sensitiveHint = inferSensitiveHint({ hostname, path, title });
  const intentHint = inferIntentHint({ workflow, artifactType, title });

  return {
    inferredArtifactType: artifactType,
    inferredWorkflow: workflow,
    projectCandidate,
    domainCategory,
    intentHint,
    sensitiveHint,
    duplicateHint: "none",
    domainOnlyRisk: Boolean(
      domainCategory !== "general_web" &&
      (projectCandidate || !["web_page", "search_results", "article", "video"].includes(artifactType))
    )
  };
}

function inferTabArtifactType({ hostname, path, title }) {
  const text = `${hostname} ${path} ${String(title || "").toLowerCase()}`;

  if (hostname === "github.com" && /\/pull\/\d+/.test(path)) return "pull_request";
  if (hostname === "github.com" && /\/issues\/\d+/.test(path)) return "issue";
  if (hostname === "github.com" && /\/actions\/runs\//.test(path)) return "ci_run";
  if (hostname === "github.com" && /\/commit\//.test(path)) return "commit";
  if (hostname === "github.com") return "repository";
  if (hostname === "developer.chrome.com" && path.includes("/docs/extensions")) return "chrome_extension_docs";
  if (hostname.includes("supabase.com")) {
    if (text.includes("database")) return "database_settings";
    if (text.includes("auth")) return "auth_settings";
    if (text.includes("storage")) return "storage_settings";
    if (text.includes("sql")) return "sql_editor";
    if (text.includes("logs")) return "logs";
    return "cloud_dashboard";
  }
  if (hostname.includes("vercel.com")) {
    if (text.includes("deployment")) return "deployment";
    if (text.includes("log")) return "logs";
    if (text.includes("setting")) return "project_settings";
    return "cloud_dashboard";
  }
  if (hostname.includes("console.aws.amazon.com") || hostname.includes("cloudflare.com")) return "cloud_dashboard";
  if (hostname === "docs.google.com") {
    if (path.includes("/spreadsheets/")) return "spreadsheet";
    if (path.includes("/presentation/")) return "slide_deck";
    return "document";
  }
  if (hostname.includes("notion.so") || hostname.includes("coda.io")) return "document";
  if (hostname.includes("figma.com") || hostname.includes("canva.com")) return "design_file";
  if (hostname.includes("linear.app") || hostname.includes("jira") || hostname.includes("atlassian.net")) return "issue";
  if (hostname.includes("stripe.com") || hostname.includes("paypal.com") || hostname.includes("revenuecat.com")) return "billing_dashboard";
  if (hostname.includes("analytics.google.com") || hostname.includes("mixpanel.com") || hostname.includes("amplitude.com") || hostname.includes("posthog.com")) return "analytics_report";
  if (hostname.includes("youtube.com") && path.includes("/watch")) return "video";
  if (hostname.includes("google.") && path.includes("/search")) return "search_results";
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local")) return "local_app";
  if (text.includes("blog") || text.includes("article") || path.includes("/blog") || path.includes("/article")) return "article";
  if (hostname.includes("slack.com") || hostname.includes("teams.microsoft.com") || hostname.includes("mail.google.com")) return "conversation";

  return "web_page";
}

function inferTabWorkflow({ hostname, path, title, artifactType }) {
  const text = `${hostname} ${path} ${String(title || "").toLowerCase()}`;

  if (["pull_request", "commit", "ci_run"].includes(artifactType)) return "code_review";
  if (artifactType === "issue") return "issue_triage";
  if (["chrome_extension_docs", "repository"].includes(artifactType)) return "implementation_reference";
  if (["database_settings", "auth_settings", "storage_settings", "project_settings", "cloud_dashboard"].includes(artifactType)) return "production_config";
  if (["deployment", "logs"].includes(artifactType)) return "deployment_debugging";
  if (["document", "spreadsheet", "slide_deck"].includes(artifactType)) return text.includes("prd") || text.includes("spec") ? "product_planning" : "writing_notes";
  if (artifactType === "design_file") return "design_review";
  if (artifactType === "analytics_report") return "monitoring";
  if (["search_results", "article", "video"].includes(artifactType)) return "research_learning";
  if (artifactType === "billing_dashboard") return "billing";
  if (artifactType === "conversation") return "communication";
  if (artifactType === "local_app") return "local_development";
  if (text.includes("pricing") || text.includes("checkout")) return "buying";

  return "general";
}

function inferTabDomainCategory(hostname) {
  if (hostname === "github.com") return "code_hosting";
  if (hostname === "developer.chrome.com") return "developer_docs";
  if (hostname.includes("supabase.com") || hostname.includes("vercel.com") || hostname.includes("cloudflare.com") || hostname.includes("console.aws.amazon.com")) return "dev_infra";
  if (hostname === "docs.google.com" || hostname.includes("notion.so") || hostname.includes("coda.io")) return "docs_notes";
  if (hostname.includes("slack.com") || hostname.includes("teams.microsoft.com") || hostname.includes("mail.google.com") || hostname.includes("outlook.")) return "communication";
  if (hostname.includes("linear.app") || hostname.includes("jira") || hostname.includes("atlassian.net") || hostname.includes("trello.com") || hostname.includes("asana.com")) return "product_tasks";
  if (hostname.includes("figma.com") || hostname.includes("canva.com")) return "design";
  if (hostname.includes("analytics.google.com") || hostname.includes("mixpanel.com") || hostname.includes("amplitude.com") || hostname.includes("posthog.com")) return "analytics";
  if (hostname.includes("stripe.com") || hostname.includes("paypal.com") || hostname.includes("revenuecat.com")) return "finance";
  if (hostname.includes("youtube.com")) return "learning";
  if (hostname.includes("google.")) return "research";
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local")) return "local_dev";
  return "general_web";
}

function inferProjectCandidate({ hostname, path, title, artifactType }) {
  if (hostname === "github.com") {
    const match = path.match(/^\/([^/]+)\/([^/]+)/);
    const repo = match?.[2] || "";
    return sanitizeProjectCandidate(repo);
  }

  if (hostname.includes("supabase.com")) {
    const pathMatch = path.match(/\/project\/([^/]+)/);
    const fromPath = sanitizeProjectCandidate(pathMatch?.[1]);
    if (fromPath) return fromPath;
  }

  if (hostname.includes("vercel.com")) {
    const pathMatch = path.match(/\/(?:dashboard|projects?)\/([^/]+)/);
    const fromPath = sanitizeProjectCandidate(pathMatch?.[1]);
    if (fromPath) return fromPath;
  }

  if (["document", "spreadsheet", "slide_deck", "database_settings", "auth_settings", "storage_settings", "project_settings"].includes(artifactType)) {
    return pickProjectCandidateFromTitle(title);
  }

  return "";
}

function pickProjectCandidateFromTitle(title) {
  const blocked = new Set([
    "settings",
    "database",
    "auth",
    "storage",
    "dashboard",
    "documents",
    "document",
    "google docs",
    "supabase",
    "vercel",
    "notion",
    "figma",
    "overview",
    "home"
  ]);
  const parts = String(title || "")
    .split(/\s[|·•-]\s|[|·•]/)
    .map((part) => sanitizeProjectCandidate(part))
    .filter(Boolean);

  return parts.find((part) => !blocked.has(part.toLowerCase()) && !part.includes("@")) || "";
}

function sanitizeProjectCandidate(value) {
  return String(value || "")
    .replace(/\.(git|com|net|org|io|app)$/i, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5.-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function inferSensitiveHint({ hostname, path, title }) {
  const text = `${hostname} ${path} ${String(title || "").toLowerCase()}`;
  const term = SENSITIVE_SUMMARY_TERMS.find((item) => text.includes(item));
  return term || "none";
}

function inferIntentHint({ workflow, artifactType, title }) {
  const text = String(title || "").toLowerCase();

  if (workflow === "code_review") return "review";
  if (workflow === "production_config") return "configure";
  if (workflow === "deployment_debugging") return "debug";
  if (workflow === "product_planning") return "plan";
  if (workflow === "research_learning") return "learn";
  if (workflow === "monitoring") return "monitor";
  if (workflow === "billing") return "pay_or_review_billing";
  if (artifactType === "search_results") return "research";
  if (text.includes("compare") || text.includes("vs")) return "compare";

  return "keep_context";
}

function normalizeAIBaseUrl(value) {
  const rawValue = String(value || DEFAULT_AI_SETTINGS.baseUrl).trim() || DEFAULT_AI_SETTINGS.baseUrl;
  let url;

  try {
    url = new URL(rawValue);
  } catch {
    throw new Error("Use an HTTPS OpenAI-compatible Base URL, or http://localhost for a local model endpoint.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error("Base URL must not include username, password, query string, or hash.");
  }

  if (url.protocol === "http:" && !isLocalAIHostname(url.hostname)) {
    throw new Error("Remote AI provider Base URLs must use HTTPS. HTTP is allowed only for localhost model endpoints.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Use an HTTPS OpenAI-compatible Base URL, or http://localhost for a local model endpoint.");
  }

  return url.toString().replace(/\/+$/, "");
}

function inferAIProviderId(baseUrl, provider = "") {
  const explicitProvider = String(provider || "").trim().toLowerCase();

  if (explicitProvider && explicitProvider !== "deepseek") {
    return explicitProvider.slice(0, 48);
  }

  let url;

  try {
    url = new URL(normalizeAIBaseUrl(baseUrl));
  } catch {
    return DEFAULT_AI_SETTINGS.provider;
  }

  const hostname = normalizeAIHostname(url.hostname);

  if (hostname === DEFAULT_AI_HOSTNAME) return "deepseek";
  if (isLocalAIHostname(hostname)) return "local-openai-compatible";
  return AI_PROVIDER_HOST_IDS.get(hostname) || "openai-compatible";
}

function getOpenAICompatibleModelsUrl(baseUrl) {
  const url = new URL(normalizeAIBaseUrl(baseUrl));
  const hostname = normalizeAIHostname(url.hostname);
  const normalizedPath = url.pathname.replace(/\/+$/, "");

  if (hostname === "api.perplexity.ai" && !normalizedPath) {
    return `${url.origin}/v1/models`;
  }

  return `${url.toString().replace(/\/+$/, "")}/models`;
}

function getAIProviderPermissionOrigin(baseUrl) {
  const url = new URL(normalizeAIBaseUrl(baseUrl));
  return `${url.protocol}//${url.hostname}/*`;
}

function isDefaultAIProviderOrigin(origin) {
  return origin === DEFAULT_AI_PROVIDER_ORIGIN;
}

async function ensureAIProviderPermission(baseUrl, { requestPermission = false } = {}) {
  const origin = getAIProviderPermissionOrigin(baseUrl);

  if (isDefaultAIProviderOrigin(origin)) {
    return { granted: true, required: false, origin };
  }

  if (!chrome.permissions?.contains) {
    return { granted: true, required: true, origin, reason: "permissions-api-unavailable" };
  }

  const hasPermission = await chrome.permissions.contains({ origins: [origin] });

  if (hasPermission) {
    return { granted: true, required: true, origin };
  }

  if (requestPermission && chrome.permissions?.request) {
    const granted = await chrome.permissions.request({ origins: [origin] });

    if (granted) {
      return { granted: true, required: true, origin };
    }
  }

  throw new Error(`Permission is required for AI provider origin ${origin}. Save or test the provider again and approve the Chrome permission prompt.`);
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

function canUseAISettings(settings) {
  if (!settings?.enabled) return false;
  if (String(settings.apiKey || "").trim()) return true;

  try {
    const url = new URL(normalizeAIBaseUrl(settings.baseUrl));
    return isLocalAIHostname(url.hostname);
  } catch {
    return false;
  }
}

function requiresRemoteAIProviderKey(baseUrl) {
  const url = new URL(normalizeAIBaseUrl(baseUrl));
  return !isLocalAIHostname(url.hostname);
}

function buildOpenAICompatibleHeaders(settings = {}, { json = false } = {}) {
  const headers = {};
  const apiKey = String(settings.apiKey || "").trim();

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

function normalizeAIHostname(hostname) {
  return String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
}

function validateAIClassification(output, snapshot) {
  const validTabs = new Map(snapshot.tabs.filter(canGroupTab).map((tab) => [tab.id, tab]));
  const byTabId = new Map();
  const groups = Array.isArray(output?.groups) ? output.groups.slice(0, 12) : [];

  for (const group of groups) {
    const name = String(group?.name || "").trim().slice(0, 48);
    const color = SUPPORTED_GROUP_COLORS.has(group?.color) ? group.color : "grey";
    const confidence = clamp(Number(group?.confidence || 0.75), 0, 1);
    const evidence = sanitizeAIClassificationEvidence(group?.evidence);
    const reason = (evidence.length ? evidence.join("; ") : String(group?.reason || "AI classification")).slice(0, 120);
    const tabIds = Array.isArray(group?.tabIds) ? group.tabIds : [];

    if (!name || confidence < 0.62) continue;
    if (isWeakDomainOnlyGroupName(name)) continue;

    for (const tabId of tabIds) {
      if (!validTabs.has(tabId) || byTabId.has(tabId)) continue;

      byTabId.set(tabId, {
        name,
        color,
        confidence,
        reason,
        project: String(group?.project || "").slice(0, 48),
        workflow: String(group?.workflow || "").slice(0, 48),
        artifactType: String(group?.artifactType || "").slice(0, 48),
        intent: String(group?.intent || "").slice(0, 48),
        classificationMode: String(group?.classificationMode || "metadata_semantic").slice(0, 32),
        domainOnlyRisk: Boolean(group?.domainOnlyRisk)
      });
    }
  }

  return byTabId;
}

function validateAIClassificationSplitSuggestions(output) {
  return (Array.isArray(output?.splitSuggestions) ? output.splitSuggestions : [])
    .map((suggestion) => {
      const fromGroup = cleanGroupName(suggestion?.fromGroup);
      const suggestedGroups = (Array.isArray(suggestion?.suggestedGroups) ? suggestion.suggestedGroups : [])
        .map((name) => cleanGroupName(name))
        .filter(Boolean)
        .slice(0, 4);
      const reason = sanitizeAIClassificationEvidence([suggestion?.reason])[0] || "AI suggested a metadata-based split.";

      if (!fromGroup || suggestedGroups.length < 2) return null;

      return {
        type: "split",
        source: "ai",
        fromGroup,
        suggestedGroups,
        reason
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function validateAIClassificationMergeSuggestions(output) {
  return (Array.isArray(output?.mergeSuggestions) ? output.mergeSuggestions : [])
    .map((suggestion) => {
      const groups = (Array.isArray(suggestion?.groups) ? suggestion.groups : [])
        .map((name) => cleanGroupName(name))
        .filter(Boolean)
        .slice(0, 4);
      const suggestedGroup = cleanGroupName(suggestion?.suggestedGroup);
      const reason = sanitizeAIClassificationEvidence([suggestion?.reason])[0] || "AI suggested a metadata-based merge.";

      if (groups.length < 2 || !suggestedGroup) return null;

      return {
        type: "merge",
        source: "ai",
        groups,
        suggestedGroup,
        reason
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function buildClassificationInsights({ snapshot, appliedGroups, aiSplitSuggestions = [], aiMergeSuggestions = [] } = {}) {
  const splitSuggestions = mergeClassificationSplitSuggestions([
    ...validateExistingSplitSuggestions(aiSplitSuggestions),
    ...buildLocalClassificationSplitSuggestions(snapshot, appliedGroups)
  ]);
  const mergeSuggestions = mergeClassificationMergeSuggestions([
    ...validateExistingMergeSuggestions(aiMergeSuggestions),
    ...buildLocalClassificationMergeSuggestions(snapshot, appliedGroups)
  ]);

  return {
    source: "metadata_semantic",
    splitSuggestions,
    mergeSuggestions
  };
}

function validateExistingSplitSuggestions(suggestions) {
  return (Array.isArray(suggestions) ? suggestions : [])
    .map((suggestion) => {
      const fromGroup = cleanGroupName(suggestion?.fromGroup);
      const suggestedGroups = (Array.isArray(suggestion?.suggestedGroups) ? suggestion.suggestedGroups : [])
        .map((name) => cleanGroupName(name))
        .filter(Boolean)
        .slice(0, 4);
      const reason = String(suggestion?.reason || "Metadata suggests this group may be too broad.")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 140);

      if (!fromGroup || suggestedGroups.length < 2) return null;

      return {
        type: "split",
        source: suggestion?.source === "ai" ? "ai" : "metadata",
        fromGroup,
        suggestedGroups,
        reason
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function buildLocalClassificationSplitSuggestions(snapshot, appliedGroups) {
  const tabsById = new Map((snapshot?.tabs || []).map((tab) => [tab.id, tab]));
  const suggestions = [];

  for (const group of Array.isArray(appliedGroups) ? appliedGroups : []) {
    const tabs = (Array.isArray(group.tabIds) ? group.tabIds : [])
      .map((tabId) => tabsById.get(tabId))
      .filter(Boolean);

    if (tabs.length < 4) continue;

    const buckets = buildClassificationRefinementBuckets(tabs);

    if (buckets.length < 2) continue;

    const suggestedGroups = buckets
      .map((bucket) => bucket.name)
      .filter((name) => name && name.toLowerCase() !== String(group.name || "").toLowerCase())
      .slice(0, 4);

    if (suggestedGroups.length < 2) continue;

    suggestions.push({
      type: "split",
      source: "metadata",
      fromGroup: cleanGroupName(group.name) || "Current group",
      suggestedGroups,
      reason: "Metadata shows multiple projects or workflows inside this group.",
      tabCount: tabs.length
    });
  }

  return suggestions.slice(0, 3);
}

function validateExistingMergeSuggestions(suggestions) {
  return (Array.isArray(suggestions) ? suggestions : [])
    .map((suggestion) => {
      const groups = (Array.isArray(suggestion?.groups) ? suggestion.groups : [])
        .map((name) => cleanGroupName(name))
        .filter(Boolean)
        .slice(0, 4);
      const suggestedGroup = cleanGroupName(suggestion?.suggestedGroup);
      const reason = String(suggestion?.reason || "Metadata suggests these groups may belong together.")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 140);

      if (groups.length < 2 || !suggestedGroup) return null;

      return {
        type: "merge",
        source: suggestion?.source === "ai" ? "ai" : "metadata",
        groups,
        suggestedGroup,
        reason
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function buildLocalClassificationMergeSuggestions(snapshot, appliedGroups) {
  const tabsById = new Map((snapshot?.tabs || []).map((tab) => [tab.id, tab]));
  const candidatesByKey = new Map();

  for (const group of Array.isArray(appliedGroups) ? appliedGroups : []) {
    const tabs = (Array.isArray(group.tabIds) ? group.tabIds : [])
      .map((tabId) => tabsById.get(tabId))
      .filter(Boolean);

    if (!tabs.length || tabs.length > 4) continue;

    const bucket = getDominantClassificationRefinementBucket(tabs);
    if (!bucket) continue;

    const key = `${Number(group.windowId || 0)}:${bucket.key}`;
    const candidate = {
      groupName: cleanGroupName(group.name) || "Current group",
      suggestedGroup: bucket.name,
      tabCount: tabs.length
    };
    const previous = candidatesByKey.get(key) || [];
    previous.push(candidate);
    candidatesByKey.set(key, previous);
  }

  return Array.from(candidatesByKey.values())
    .filter((items) => items.length >= 2)
    .map((items) => ({
      type: "merge",
      source: "metadata",
      groups: items.map((item) => item.groupName).slice(0, 4),
      suggestedGroup: cleanGroupName(items[0].suggestedGroup) || "Merged Work",
      reason: "Metadata suggests these small groups share the same project or workflow.",
      tabCount: items.reduce((total, item) => total + item.tabCount, 0)
    }))
    .slice(0, 3);
}

function getDominantClassificationRefinementBucket(tabs) {
  const buckets = buildClassificationRefinementBuckets(tabs, { includeSingletons: true });
  const bucket = buckets[0];

  if (!bucket || bucket.count < 1) return null;
  if (tabs.length > 1 && bucket.count / tabs.length < 0.67) return null;

  return bucket;
}

function buildClassificationRefinementBuckets(tabs, { includeSingletons = false } = {}) {
  const buckets = new Map();

  for (const tab of tabs || []) {
    const features = buildTabSemanticFeatures({
      title: tab.title || "",
      hostname: tab.hostname || "",
      path: tab.path || "",
      windowId: tab.windowId,
      active: tab.active,
      pinned: tab.pinned,
      audible: tab.audible,
      discarded: tab.discarded,
      existingGroup: tab.groupTitle || null
    });
    const key = buildClassificationRefinementKey(features, tab);
    const name = buildClassificationRefinementName(features, tab);

    if (!key || !name) continue;

    const bucket = buckets.get(key) || {
      key,
      name,
      count: 0
    };
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values())
    .filter((bucket) => includeSingletons || bucket.count >= 2)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function buildClassificationRefinementKey(features, tab) {
  if (features.projectCandidate && features.inferredWorkflow && features.inferredWorkflow !== "general") {
    return `project:${features.projectCandidate}:${features.inferredWorkflow}`;
  }

  if (features.inferredWorkflow && features.inferredWorkflow !== "general") {
    return `workflow:${features.inferredWorkflow}`;
  }

  if (features.inferredArtifactType && !["web_page", "article"].includes(features.inferredArtifactType)) {
    return `artifact:${features.inferredArtifactType}`;
  }

  if (tab.hostname && features.domainCategory !== "general_web") {
    return `domain:${normalizeHostname(tab.hostname)}`;
  }

  return "";
}

function buildClassificationRefinementName(features, tab) {
  const project = titleCaseWords(features.projectCandidate);
  const workflow = formatWorkflowLabel(features.inferredWorkflow);
  const artifact = formatWorkflowLabel(features.inferredArtifactType);
  const host = formatHostnameForGroup(tab.hostname);

  if (project && workflow) return cleanGroupName(`${project} ${workflow}`);
  if (workflow) return cleanGroupName(workflow);
  if (artifact) return cleanGroupName(artifact);
  return cleanGroupName(host);
}

function formatWorkflowLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const labels = {
    auth_settings: "Auth Settings",
    billing: "Billing",
    billing_dashboard: "Billing Dashboard",
    chrome_extension_docs: "Chrome Extension Docs",
    ci_run: "CI Runs",
    cloud_dashboard: "Cloud Dashboard",
    code_review: "Code Review",
    database_settings: "Database Settings",
    deployment: "Deployment",
    deployment_debugging: "Deployment Debugging",
    design_file: "Design Review",
    design_review: "Design Review",
    document: "Docs & Notes",
    implementation_reference: "Implementation Reference",
    issue: "Issues",
    issue_triage: "Issue Triage",
    local_app: "Local Development",
    local_development: "Local Development",
    monitoring: "Monitoring",
    product_planning: "Product Planning",
    production_config: "Production Config",
    research_learning: "Research",
    search_results: "Research",
    sql_editor: "SQL Editor",
    storage_settings: "Storage Settings",
    writing_notes: "Writing Notes"
  };

  if (!normalized || normalized === "general" || normalized === "web_page") return "";
  return labels[normalized] || titleCaseWords(normalized.replace(/_/g, " "));
}

function formatHostnameForGroup(hostname) {
  const normalized = normalizeHostname(hostname || "").replace(/^www\./, "");
  if (!normalized || normalized === "unknown") return "";
  const first = normalized.split(".")[0] || normalized;
  return titleCaseWords(first);
}

function titleCaseWords(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .slice(0, 48);
}

function mergeClassificationSplitSuggestions(suggestions) {
  const seen = new Set();
  const merged = [];

  for (const suggestion of suggestions || []) {
    const key = `${String(suggestion.fromGroup || "").toLowerCase()}::${(suggestion.suggestedGroups || []).join("|").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(suggestion);
    if (merged.length >= 3) break;
  }

  return merged;
}

function mergeClassificationMergeSuggestions(suggestions) {
  const seen = new Set();
  const merged = [];

  for (const suggestion of suggestions || []) {
    const groups = Array.isArray(suggestion.groups) ? suggestion.groups : [];
    const key = `${groups.map((group) => String(group).toLowerCase()).sort().join("|")}::${String(suggestion.suggestedGroup || "").toLowerCase()}`;
    if (!groups.length || seen.has(key)) continue;
    seen.add(key);
    merged.push(suggestion);
    if (merged.length >= 3) break;
  }

  return merged;
}

function sanitizeAIClassificationEvidence(evidence) {
  return (Array.isArray(evidence) ? evidence : [])
    .map((item) => String(item || "").replace(/\s+/g, " ").trim().slice(0, 90))
    .filter(Boolean)
    .slice(0, 3);
}

function isWeakDomainOnlyGroupName(name) {
  const normalized = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\s+/g, " ")
    .replace(/[。！!]+$/g, "");
  const compact = normalized.replace(/\s+/g, "");
  const withoutTld = compact.replace(/\.(com|net|org|io|app|dev|ai|co)$/i, "");
  const weakNames = new Set([
    "github",
    "google",
    "googledocs",
    "docs",
    "youtube",
    "supabase",
    "vercel",
    "figma",
    "notion",
    "slack",
    "other",
    "websites",
    "website",
    "tabs",
    "browser tabs"
  ]);

  if (weakNames.has(compact) || weakNames.has(withoutTld)) return true;
  return /^[a-z0-9-]+\.(com|net|org|io|app|dev|ai|co)$/i.test(compact);
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

async function restoreSavedWorkspace(message = {}) {
  const workspaceId = String(message.workspaceId || "");

  if (!workspaceId) {
    throw new Error("A saved workspace id is required.");
  }

  const stored = await chrome.storage.local.get([CURRENT_RUN_KEY, SAVED_WORKSPACES_KEY]);
  const workspaces = Array.isArray(stored[SAVED_WORKSPACES_KEY])
    ? stored[SAVED_WORKSPACES_KEY]
    : [];
  const workspace = workspaces.find((item) => item?.id === workspaceId);

  if (!workspace) {
    throw new Error("This saved workspace was not found.");
  }

  const startedAt = new Date().toISOString();
  const previousRun = stored[CURRENT_RUN_KEY] || {};
  const snapshot = await collectAllNormalWindowTabs();
  const restorePlan = buildSavedWorkspaceRestorePlan(workspace, snapshot);

  if (!restorePlan.groups.length) {
    throw new Error("No tabs from this saved workspace are still open and safe to regroup.");
  }

  await chrome.storage.local.set({ [LAST_UNDO_KEY]: buildUndoSnapshot(snapshot) });
  const applyResult = await applySavedWorkspaceRestorePlan(restorePlan);
  const latestSnapshot = await collectAllNormalWindowTabs();
  const duplicateGroups = detectDuplicateGroups(latestSnapshot.tabs);
  const baseSummary = summarizeSnapshot(latestSnapshot, duplicateGroups);
  const previousSummary = previousRun.summary || {};
  const workspaceName = String(workspace.name || "Saved workspace").slice(0, 72);
  const run = {
    ...previousRun,
    status: "completed",
    source: "workspace-restore",
    startedAt,
    completedAt: new Date().toISOString(),
    message: buildSavedWorkspaceRestoreMessage(workspaceName, applyResult),
    snapshot: sanitizeSnapshotForRun(latestSnapshot),
    duplicateGroups,
    summary: {
      ...previousSummary,
      ...baseSummary,
      undoAvailable: true,
      dashboardApplies: Number(previousSummary.dashboardApplies || 0) + 1,
      workspaceRestoreTabs: applyResult.restoredTabs,
      workspaceRestoreGroups: applyResult.restoredGroups,
      workspaceRestoreSkippedTabs: applyResult.skippedTabs
    },
    groups: buildDisplayGroupsFromSnapshot(latestSnapshot, previousRun.groups || []),
    workspaceActions: [
      ...(previousRun.workspaceActions || []),
      {
        type: "restore_saved_workspace",
        workspaceId,
        workspaceName,
        restoredTabs: applyResult.restoredTabs,
        restoredGroups: applyResult.restoredGroups,
        skippedTabs: applyResult.skippedTabs,
        appliedAt: new Date().toISOString()
      }
    ]
  };

  await publishRun(run);

  return {
    run,
    workspaceId,
    workspaceName,
    restoredTabs: applyResult.restoredTabs,
    restoredGroups: applyResult.restoredGroups,
    skippedTabs: applyResult.skippedTabs,
    workspaces
  };
}

function buildSavedWorkspaceRestorePlan(workspace, snapshot) {
  const currentTabById = new Map((snapshot.tabs || []).map((tab) => [Number(tab.id), tab]));
  const candidateTabIds = getSavedWorkspaceCandidateTabIds(workspace);
  const candidateTabIdSet = new Set(candidateTabIds);
  const assignedTabIds = new Set();
  const groups = [];

  for (const group of Array.isArray(workspace.groups) ? workspace.groups.slice(0, 32) : []) {
    const name = cleanGroupName(group.name || group.title || "Saved Group") || "Saved Group";
    const color = SUPPORTED_GROUP_COLORS.has(group.color) ? group.color : "grey";
    const tabsByCurrentWindow = new Map();

    for (const rawTabId of Array.isArray(group.tabIds) ? group.tabIds : []) {
      const tabId = Number(rawTabId);
      const currentTab = currentTabById.get(tabId);

      if (!Number.isInteger(tabId) || !candidateTabIdSet.has(tabId) || assignedTabIds.has(tabId) || !currentTab) {
        continue;
      }

      if (!canGroupTab(currentTab)) {
        continue;
      }

      assignedTabIds.add(tabId);
      const windowTabs = tabsByCurrentWindow.get(currentTab.windowId) || [];
      windowTabs.push(tabId);
      tabsByCurrentWindow.set(currentTab.windowId, windowTabs);
    }

    for (const [windowId, tabIds] of tabsByCurrentWindow.entries()) {
      if (!tabIds.length) continue;
      groups.push({
        windowId,
        name,
        color,
        originalGroupId: Number.isInteger(Number(group.id)) ? Number(group.id) : NO_GROUP_ID,
        tabIds
      });
    }
  }

  return {
    groups,
    restorableTabIds: Array.from(assignedTabIds),
    skippedTabIds: candidateTabIds.filter((tabId) => !assignedTabIds.has(tabId))
  };
}

function getSavedWorkspaceCandidateTabIds(workspace) {
  const ids = [];

  for (const tab of Array.isArray(workspace.tabs) ? workspace.tabs : []) {
    const tabId = Number(tab?.id);
    if (Number.isInteger(tabId)) {
      ids.push(tabId);
    }
  }

  if (!ids.length) {
    for (const group of Array.isArray(workspace.groups) ? workspace.groups : []) {
      for (const rawTabId of Array.isArray(group?.tabIds) ? group.tabIds : []) {
        const tabId = Number(rawTabId);
        if (Number.isInteger(tabId)) {
          ids.push(tabId);
        }
      }
    }
  }

  return Array.from(new Set(ids)).slice(0, 400);
}

async function applySavedWorkspaceRestorePlan(plan) {
  if (plan.restorableTabIds.length) {
    await safeUngroup(plan.restorableTabIds);
  }

  let restoredTabs = 0;
  let restoredGroups = 0;
  let failedTabs = 0;
  const groups = [];

  for (const group of plan.groups) {
    try {
      const groupId = await chrome.tabs.group({ tabIds: group.tabIds });
      await chrome.tabGroups.update(groupId, {
        title: group.name,
        color: group.color,
        collapsed: false
      });

      restoredTabs += group.tabIds.length;
      restoredGroups += 1;
      groups.push({
        id: groupId,
        windowId: group.windowId,
        name: group.name,
        color: group.color,
        tabCount: group.tabIds.length,
        tabIds: group.tabIds.slice(),
        reason: "Restored from saved workspace",
        confidence: 1
      });
    } catch {
      failedTabs += group.tabIds.length;
    }
  }

  return {
    restoredTabs,
    restoredGroups,
    skippedTabs: plan.skippedTabIds.length + failedTabs,
    groups
  };
}

function buildSavedWorkspaceRestoreMessage(workspaceName, result) {
  const skippedText = result.skippedTabs
    ? ` ${result.skippedTabs} saved tabs were skipped because they are closed or protected.`
    : "";

  return `Restored saved workspace "${workspaceName}" for ${result.restoredTabs} open tabs across ${result.restoredGroups} groups.${skippedText}`;
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

  if (!canUseAISettings(settings)) {
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
      language: "en",
      provider: inferAIProviderId(settings.baseUrl, settings.provider)
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

  const scope = ["current_tab", "current_group", "selected_tabs", "current_window", "workspace", "browser"].includes(context.scope)
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
    aiClassificationProvider: String(summary.aiClassificationProvider || "local").slice(0, 48),
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

  if (draft.type === "regroup_tabs") {
    return applyRegroupTabsDraft(draft);
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

async function applyRegroupTabsDraft(draft) {
  const startedAt = new Date().toISOString();
  const snapshot = await collectAllNormalWindowTabs();
  const liveTabIds = new Set(snapshot.tabs.map((tab) => tab.id));
  const usedTabIds = new Set();
  const groupPlan = [];
  let matchedTabCount = 0;

  for (const draftGroup of Array.isArray(draft.groups) ? draft.groups : []) {
    const groupName = cleanGroupName(draftGroup?.name);
    if (!groupName) continue;

    const tabIds = (Array.isArray(draftGroup?.tabIds) ? draftGroup.tabIds : [])
      .map((tabId) => Number(tabId))
      .filter((tabId) => Number.isInteger(tabId) && liveTabIds.has(tabId) && !usedTabIds.has(tabId));
    const matchedTabs = snapshot.tabs.filter((tab) => tabIds.includes(tab.id) && canGroupTab(tab));

    if (!matchedTabs.length) continue;

    for (const tab of matchedTabs) {
      usedTabIds.add(tab.id);
    }

    matchedTabCount += matchedTabs.length;
    groupPlan.push(...buildMoveTabsPlan(
      matchedTabs,
      groupName,
      SUPPORTED_GROUP_COLORS.has(draftGroup?.color) ? draftGroup.color : inferGroupColor(groupName),
      sanitizeVisiblePageAgentText(draftGroup?.reason, 120) || "Content-assisted regrouping"
    ));
  }

  if (!groupPlan.length) {
    throw new Error("The tabs in this regrouping preview are no longer available.");
  }

  await chrome.storage.local.set({ [LAST_UNDO_KEY]: buildUndoSnapshot(snapshot) });
  const applyResult = await applyGroupPlan(groupPlan);

  if (applyResult.groupsCreated === 0) {
    await chrome.storage.local.remove(LAST_UNDO_KEY);
  }

  const run = await buildChatRefineCompletedRun({
    startedAt,
    snapshot,
    applyResult,
    action: {
      type: "content_assisted_regroup",
      instruction: draft.instruction,
      groupCount: groupPlan.length,
      matchedTabCount
    },
    message: `Applied content-assisted regrouping to ${applyResult.tabsMoved} tab(s).`
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
      ...buildUnreadableSummary(tab, parsedUrl, buildUnsupportedPageReadReason(parsedUrl)),
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

  const settings = await getAISettings();

  if (!canUseAISettings(settings)) {
    return buildAIConfigurationRequiredSummary(tab, parsedUrl, question);
  }

  let injectionResult;
  try {
    [injectionResult] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractReadablePageContent
    });
  } catch (error) {
    return {
      ...buildUnreadableSummary(tab, parsedUrl, buildScriptInjectionReadReason(error, parsedUrl)),
      question
    };
  }
  const page = injectionResult?.result;

  if (!page?.text && !page?.description && !page?.headings?.length) {
    return {
      ...buildUnreadableSummary(tab, parsedUrl, "I could not find readable visible content on this page."),
      question
    };
  }

  const localSummary = buildLocalPageSummary({
    tab,
    parsedUrl,
    page,
    question
  });

  try {
    const output = await callOpenAICompatiblePageAgent(settings, {
      question,
      tab,
      parsedUrl,
      page,
      conversationHistory: message.pageConversationHistory,
      language: "en"
    });

    return validateAIPageAnswer(output, localSummary, {
      provider: inferAIProviderId(settings.baseUrl, settings.provider)
    });
  } catch (error) {
    return buildAIPageAnswerFailedSummary(localSummary, error, settings);
  }
}

async function summarizeSelectedPageRegion(message, sender) {
  const tab = await getCurrentTabForSummary(message.activeWindowId ?? sender?.tab?.windowId);
  const question = sanitizePageQuestion(message.question);
  const cancelledToolCard = buildPageRegionToolCard({
    status: "cancelled",
    readCount: 0,
    skippedCount: 1,
    skippedReasons: ["cancelled"]
  });

  if (!tab?.id) {
    throw new Error("No active tab is available to read.");
  }

  const rawUrl = tab.url || tab.pendingUrl || "";
  const parsedUrl = parseUrl(rawUrl);
  const privacyCheck = buildSummaryPrivacyCheck(tab, parsedUrl);

  if (!isRestorableUrl(rawUrl, parsedUrl)) {
    return {
      ...buildUnreadableSummary(tab, parsedUrl, buildUnsupportedPageReadReason(parsedUrl)),
      question,
      toolCard: buildPageRegionToolCard({
        status: "error",
        readCount: 0,
        skippedCount: 1,
        skippedReasons: ["restricted"]
      })
    };
  }

  if (
    privacyCheck.requiresConfirmation &&
    Number(message.confirmedSensitiveTabId) !== tab.id
  ) {
    return {
      ...buildSensitiveSummaryConfirmation(tab, parsedUrl, privacyCheck),
      question,
      toolCard: cancelledToolCard
    };
  }

  const settings = await getAISettings();

  if (!canUseAISettings(settings)) {
    return {
      ...buildAIConfigurationRequiredSummary(tab, parsedUrl, question, {
        source: "selected_region"
      }),
      toolCard: cancelledToolCard
    };
  }

  let injectionResult;
  try {
    [injectionResult] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: pickReadablePageRegion
    });
  } catch (error) {
    return {
      ...buildUnreadableSummary(tab, parsedUrl, buildScriptInjectionReadReason(error, parsedUrl)),
      question,
      toolCard: buildPageRegionToolCard({
        status: "error",
        readCount: 0,
        skippedCount: 1,
        skippedReasons: ["unreadable"]
      })
    };
  }

  const page = injectionResult?.result;

  if (page?.cancelled) {
    return {
      ...buildUnreadableSummary(tab, parsedUrl, page.reason || "Region selection was cancelled."),
      status: "unreadable",
      title: "Region selection cancelled",
      question,
      keyPoints: [
        "No selected region text was read.",
        "You can try again and click one visible section on the active page.",
        "TabMosaic did not store any page content."
      ],
      toolCard: cancelledToolCard
    };
  }

  if (!page?.text && !page?.description && !page?.headings?.length) {
    return {
      ...buildUnreadableSummary(tab, parsedUrl, "I could not find readable visible text in the selected region."),
      question,
      toolCard: buildPageRegionToolCard({
        status: "partial",
        readCount: 0,
        skippedCount: 1,
        skippedReasons: ["empty"]
      })
    };
  }

  page.region = {
    ...(page.region || {}),
    screenshot: await captureSelectedRegionScreenshot(tab, page.region)
  };

  const toolCard = buildPageRegionToolCard({
    status: "completed",
    readCount: 1,
    skippedCount: 0,
    skippedReasons: []
  });
  const localSummary = {
    ...buildLocalPageSummary({
      tab,
      parsedUrl,
      page,
      question
    }),
    source: "selected_region",
    region: sanitizePageRegionForPrompt(page.region),
    toolCard
  };

  try {
    const output = await callOpenAICompatiblePageAgent(settings, {
      question,
      tab,
      parsedUrl,
      page,
      conversationHistory: message.pageConversationHistory,
      language: "en"
    });

    return validateAIPageAnswer(output, localSummary, {
      provider: inferAIProviderId(settings.baseUrl, settings.provider)
    });
  } catch (error) {
    return buildAIPageAnswerFailedSummary(localSummary, error, settings);
  }
}

async function summarizeContextTabs(message = {}) {
  const question = sanitizePageQuestion(message.question) || "What are these tabs about?";
  const run = await getCurrentRun();
  const context = normalizeContextTabsScope(message.context);
  const targetTabs = await resolveContextTabsForRead(context, run);

  if (!targetTabs.length) {
    throw new Error("No tabs are available in this context yet.");
  }

  const extraction = await extractVisibleTextFromContextTabs(targetTabs, context);
  const localSummary = buildLocalContextTabsSummary({
    question,
    context,
    targetTabs,
    readableTabs: extraction.readableTabs,
    skippedTabs: extraction.skippedTabs,
    toolCard: extraction.toolCard
  });

  if (!extraction.readableTabs.length) {
    return localSummary;
  }

  const settings = await getAISettings();

  if (!canUseAISettings(settings)) {
    return localSummary;
  }

  try {
    const output = await callOpenAICompatibleContextTabsAgent(settings, {
      question,
      context,
      readableTabs: extraction.readableTabs,
      skippedTabs: extraction.skippedTabs,
      toolCard: extraction.toolCard,
      conversationHistory: message.contextConversationHistory,
      language: "en"
    });

    return validateAIContextTabsAnswer(output, localSummary, {
      provider: inferAIProviderId(settings.baseUrl, settings.provider)
    });
  } catch (error) {
    return {
      ...localSummary,
      provider: "local-fallback",
      aiUsed: false,
      aiError: normalizeError(error).slice(0, 120),
      privacy: {
        ...localSummary.privacy,
        sentTabMetadata: true,
        sentPageText: true,
        sentFullUrls: false,
        storedCloud: false
      }
    };
  }
}

async function regroupContextTabs(message = {}) {
  const instruction = sanitizePageQuestion(message.question || message.text) || "Regroup these tabs by visible page content.";
  const run = await getCurrentRun();
  const context = normalizeContextTabsScope(message.context);
  const targetTabs = await resolveContextTabsForRead(context, run);

  if (!targetTabs.length) {
    throw new Error("No tabs are available in this context yet.");
  }

  const extraction = await extractVisibleTextFromContextTabs(targetTabs, context);

  if (!extraction.readableTabs.length) {
    throw new Error("I could not read enough visible text from this context to build a regrouping preview.");
  }

  const settings = await getAISettings();
  let draft;

  if (canUseAISettings(settings)) {
    try {
      const output = await callOpenAICompatibleContextRegroupAgent(settings, {
        instruction,
        context,
        readableTabs: extraction.readableTabs,
        skippedTabs: extraction.skippedTabs,
        toolCard: extraction.toolCard,
        language: "en"
      });

      draft = validateAIContextRegroupDraft(output, {
        instruction,
        context,
        readableTabs: extraction.readableTabs,
        skippedTabs: extraction.skippedTabs,
        toolCard: extraction.toolCard,
        provider: inferAIProviderId(settings.baseUrl, settings.provider)
      });
    } catch (error) {
      draft = buildLocalContextRegroupDraft({
        instruction,
        context,
        readableTabs: extraction.readableTabs,
        skippedTabs: extraction.skippedTabs,
        toolCard: extraction.toolCard
      });
      draft.provider = "local-fallback";
      draft.aiError = normalizeError(error).slice(0, 120);
    }
  } else {
    draft = buildLocalContextRegroupDraft({
      instruction,
      context,
      readableTabs: extraction.readableTabs,
      skippedTabs: extraction.skippedTabs,
      toolCard: extraction.toolCard
    });
  }

  await chrome.storage.local.set({ [CHAT_DRAFT_KEY]: draft });
  return draft;
}

function normalizeContextTabsScope(context = {}) {
  const scope = ["current_group", "selected_tabs", "current_window"].includes(context.scope)
    ? context.scope
    : "current_group";
  const tabIds = Array.isArray(context.tabIds)
    ? Array.from(new Set(context.tabIds.map((tabId) => Number(tabId)).filter(Number.isInteger))).slice(0, 80)
    : [];

  return {
    scope,
    tabId: toOptionalInteger(context.tabId),
    groupId: toOptionalInteger(context.groupId),
    windowId: toOptionalInteger(context.windowId),
    groupName: String(context.groupName || "").slice(0, 100),
    title: String(context.title || "").slice(0, 120),
    hostname: String(context.hostname || "").slice(0, 120),
    tabCount: nonNegativeInt(context.tabCount || tabIds.length),
    tabIds
  };
}

async function resolveContextTabsForRead(context, run) {
  const runTabs = Array.isArray(run?.snapshot?.tabs) ? run.snapshot.tabs : [];
  let targetIds = Array.isArray(context.tabIds) ? context.tabIds.slice() : [];

  if (!targetIds.length && Number.isInteger(context.groupId)) {
    targetIds = runTabs
      .filter((tab) => Number(tab.groupId) === Number(context.groupId))
      .map((tab) => Number(tab.id))
      .filter(Number.isInteger);
  }

  if (!targetIds.length && context.scope === "current_group" && context.groupName) {
    const targetGroup = (run?.groups || []).find(
      (group) => String(group?.name || "").toLowerCase() === context.groupName.toLowerCase()
    );
    if (targetGroup?.tabIds?.length) {
      targetIds = targetGroup.tabIds.map((tabId) => Number(tabId)).filter(Number.isInteger);
    }
  }

  if (!targetIds.length && context.scope === "current_window") {
    targetIds = runTabs
      .filter((tab) => !Number.isInteger(context.windowId) || Number(tab.windowId) === Number(context.windowId))
      .map((tab) => Number(tab.id))
      .filter(Number.isInteger);
  }

  const seen = new Set();
  const targets = [];
  const snapshotTabById = new Map(runTabs.map((tab) => [Number(tab.id), tab]));

  for (const tabId of targetIds) {
    if (!Number.isInteger(tabId) || seen.has(tabId)) continue;
    seen.add(tabId);

    const snapshotTab = snapshotTabById.get(tabId);
    try {
      const liveTab = await chrome.tabs.get(tabId);
      targets.push(buildContextReadTarget(liveTab, snapshotTab));
    } catch {
      if (snapshotTab) {
        targets.push(buildContextReadTarget(snapshotTab, snapshotTab, { unavailable: true }));
      }
    }
  }

  return targets;
}

function buildContextReadTarget(tab, snapshotTab, options = {}) {
  const rawUrl = tab?.url || tab?.pendingUrl || "";
  const parsedUrl = rawUrl ? parseUrl(rawUrl) : {
    scheme: snapshotTab?.urlScheme || "unknown",
    hostname: snapshotTab?.hostname || "",
    path: snapshotTab?.path || "",
    label: snapshotTab?.hostname || "",
    hasQuery: false,
    hasHash: false
  };

  return {
    id: Number(tab?.id ?? snapshotTab?.id),
    windowId: Number(tab?.windowId ?? snapshotTab?.windowId),
    title: String(tab?.title || snapshotTab?.title || "Untitled").slice(0, 180),
    hostname: String(parsedUrl.hostname || snapshotTab?.hostname || "").slice(0, 120),
    path: String(parsedUrl.path || snapshotTab?.path || "").slice(0, 180),
    urlScheme: parsedUrl.scheme,
    rawUrl,
    active: Boolean(tab?.active ?? snapshotTab?.active),
    pinned: Boolean(tab?.pinned ?? snapshotTab?.pinned),
    audible: Boolean(tab?.audible ?? snapshotTab?.audible),
    discarded: Boolean(tab?.discarded ?? snapshotTab?.discarded),
    incognito: Boolean(tab?.incognito ?? snapshotTab?.incognito),
    groupId: Number.isInteger(Number(tab?.groupId ?? snapshotTab?.groupId)) ? Number(tab?.groupId ?? snapshotTab?.groupId) : NO_GROUP_ID,
    unavailable: Boolean(options.unavailable)
  };
}

async function extractVisibleTextFromContextTabs(targetTabs, context = {}) {
  const requestedTabs = Array.isArray(targetTabs) ? targetTabs : [];
  const readableTabs = [];
  const skippedTabs = [];
  const cappedTargets = requestedTabs.slice(0, MULTI_TAB_CONTENT_READ_LIMIT);

  for (const tab of requestedTabs.slice(MULTI_TAB_CONTENT_READ_LIMIT)) {
    skippedTabs.push(buildContextSkippedTab(tab, "over_cap"));
  }

  for (const tab of cappedTargets) {
    const skipReason = getContextTabReadSkipReason(tab);
    if (skipReason) {
      skippedTabs.push(buildContextSkippedTab(tab, skipReason));
      continue;
    }

    try {
      const [injectionResult] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractReadablePageContent
      });
      const page = injectionResult?.result;

      if (!page?.text && !page?.description && !page?.headings?.length) {
        skippedTabs.push(buildContextSkippedTab(tab, "empty"));
        continue;
      }

      readableTabs.push(buildReadableContextTab(tab, page));
    } catch (error) {
      skippedTabs.push(buildContextSkippedTab(tab, buildContextExtractionSkipReason(error, tab)));
    }
  }

  return {
    readableTabs,
    skippedTabs,
    toolCard: buildContextToolCard({
      scopeType: context.scope,
      requestedCount: requestedTabs.length,
      readCount: readableTabs.length,
      skippedCount: skippedTabs.length,
      skippedTabs
    })
  };
}

function getContextTabReadSkipReason(tab) {
  if (!tab || !Number.isInteger(tab.id) || tab.unavailable) return "unavailable";
  if (tab.incognito) return "restricted";
  if (tab.pinned || tab.audible) return "protected";
  if (!isRestorableUrl(tab.rawUrl, { scheme: tab.urlScheme })) return "restricted";
  if (isInternalScheme(tab.urlScheme)) return "restricted";

  const sensitiveReason = getSensitiveSummaryReason({
    title: tab.title || "",
    hostname: tab.hostname,
    path: tab.path,
    urlScheme: tab.urlScheme
  });
  return sensitiveReason ? "sensitive" : "";
}

function buildContextExtractionSkipReason(error, tab) {
  const message = String(error?.message || error || "").toLowerCase();

  if (isInternalScheme(tab?.urlScheme)) return "restricted";
  if (
    message.includes("missing host permission") ||
    message.includes("must request permission") ||
    message.includes("cannot access contents of url") ||
    message.includes("cannot access a chrome") ||
    message.includes("permission")
  ) {
    return "missing_permission";
  }
  if (message.includes("cannot be scripted") || message.includes("chrome web store")) return "restricted";
  return "unreadable";
}

function buildReadableContextTab(tab, page) {
  return {
    tabId: tab.id,
    title: String(page?.title || tab.title || "Untitled").replace(/\s+/g, " ").trim().slice(0, 180),
    hostname: tab.hostname,
    path: tab.path,
    page: {
      description: sanitizePageAgentPromptText(page?.description, 1000),
      headings: sanitizePageAgentHeadings(page?.headings),
      selectedText: sanitizePageAgentPromptText(page?.selectedText, 1600),
      visibleText: sanitizePageAgentPromptText(page?.text, 6000)
    }
  };
}

function buildContextSkippedTab(tab, reason) {
  const normalizedReason = normalizeContextSkipReason(reason);
  const meta = getContextSkipReasonMeta(normalizedReason);

  return {
    tabId: Number(tab?.id) || 0,
    title: String(tab?.title || "Untitled").slice(0, 120),
    hostname: String(tab?.hostname || "").slice(0, 120),
    reason: normalizedReason,
    reasonLabel: meta.label,
    reasonHint: meta.hint
  };
}

function normalizeContextSkipReason(reason) {
  const value = String(reason || "unreadable").trim().toLowerCase();
  return CONTEXT_TAB_SKIP_REASONS[value] ? value : "unreadable";
}

function getContextSkipReasonMeta(reason) {
  return CONTEXT_TAB_SKIP_REASONS[normalizeContextSkipReason(reason)] || CONTEXT_TAB_SKIP_REASONS.unreadable;
}

function buildContextSkipBreakdown(skippedTabs) {
  const counts = new Map();

  for (const tab of Array.isArray(skippedTabs) ? skippedTabs : []) {
    const reason = normalizeContextSkipReason(tab?.reason);
    counts.set(reason, (counts.get(reason) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([reason, count]) => ({
      reason,
      label: getContextSkipReasonMeta(reason).label,
      count
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
}

function buildContextToolCard({ scopeType, requestedCount, readCount, skippedCount, skippedTabs }) {
  const normalizedScope = ["current_group", "selected_tabs", "current_window"].includes(scopeType)
    ? scopeType
    : "current_group";
  const skippedReasons = Array.from(new Set((skippedTabs || []).map((tab) => tab.reason).filter(Boolean))).slice(0, 5);
  const skippedBreakdown = buildContextSkipBreakdown(skippedTabs);
  const safeReadCount = nonNegativeInt(readCount);
  const safeSkippedCount = nonNegativeInt(skippedCount);

  return {
    toolName: normalizedScope === "selected_tabs" ? "read_selected_tabs_pages" : "read_group_pages",
    label: normalizedScope === "selected_tabs" ? "Read selected tabs" : "Read group pages",
    scope: {
      type: normalizedScope,
      requestedTabCount: nonNegativeInt(requestedCount),
      readTabCount: safeReadCount,
      skippedTabCount: safeSkippedCount,
      maxTabs: MULTI_TAB_CONTENT_READ_LIMIT
    },
    dataUsed: ["visible_text", "title", "hostname", "headings"],
    storage: "session_only",
    status: safeReadCount > 0
      ? (safeSkippedCount > 0 ? "partial" : "completed")
      : (safeSkippedCount > 0 ? "metadata_only" : "completed"),
    skippedReasons,
    skippedBreakdown
  };
}

function buildPageRegionToolCard({ status = "completed", readCount = 0, skippedCount = 0, skippedReasons = [] } = {}) {
  return {
    toolName: "extract_selected_page_region",
    label: "Select page region",
    scope: {
      type: "page_region",
      requestedTabCount: 1,
      readTabCount: nonNegativeInt(readCount),
      skippedTabCount: nonNegativeInt(skippedCount),
      maxTabs: 1
    },
    dataUsed: ["selected_region_visible_text", "headings", "safe_link_labels", "list_table_structure", "cropped_screenshot_metadata"],
    storage: "session_only",
    status: String(status || "completed").slice(0, 24),
    skippedReasons: Array.isArray(skippedReasons)
      ? skippedReasons.map((reason) => String(reason).slice(0, 40)).slice(0, 5)
      : []
  };
}

async function captureSelectedRegionScreenshot(tab, region = {}) {
  const rect = normalizeRegionViewportRect(region.viewportRect);

  if (!rect) {
    return {
      captured: false,
      reason: "missing_region_bounds"
    };
  }

  if (!chrome.tabs?.captureVisibleTab || !Number.isInteger(tab?.windowId)) {
    return {
      captured: false,
      reason: "capture_unavailable"
    };
  }

  try {
    const visibleTabDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    const cropped = await cropSelectedRegionScreenshot(visibleTabDataUrl, rect);

    return cropped || {
      captured: false,
      reason: "crop_unavailable"
    };
  } catch (error) {
    return {
      captured: false,
      reason: normalizeScreenshotCaptureReason(error)
    };
  }
}

function normalizeRegionViewportRect(rect = {}) {
  const left = Number(rect.left);
  const top = Number(rect.top);
  const width = Number(rect.width);
  const height = Number(rect.height);
  const viewportWidth = Number(rect.viewportWidth);
  const viewportHeight = Number(rect.viewportHeight);
  const devicePixelRatio = Number(rect.devicePixelRatio || 1);

  if (![left, top, width, height, viewportWidth, viewportHeight].every(Number.isFinite)) return null;
  if (width <= 0 || height <= 0 || viewportWidth <= 0 || viewportHeight <= 0) return null;

  return {
    left: clamp(left, 0, viewportWidth),
    top: clamp(top, 0, viewportHeight),
    width: clamp(width, 1, viewportWidth),
    height: clamp(height, 1, viewportHeight),
    viewportWidth,
    viewportHeight,
    devicePixelRatio: Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1
  };
}

async function cropSelectedRegionScreenshot(visibleTabDataUrl, rect) {
  if (
    !visibleTabDataUrl ||
    typeof fetch !== "function" ||
    typeof createImageBitmap !== "function" ||
    typeof OffscreenCanvas === "undefined"
  ) {
    return null;
  }

  const response = await fetch(visibleTabDataUrl);
  const sourceBlob = await response.blob();
  const bitmap = await createImageBitmap(sourceBlob);

  try {
    const scaleX = bitmap.width / rect.viewportWidth;
    const scaleY = bitmap.height / rect.viewportHeight;
    const sourceX = Math.round(clamp(rect.left * scaleX, 0, Math.max(0, bitmap.width - 1)));
    const sourceY = Math.round(clamp(rect.top * scaleY, 0, Math.max(0, bitmap.height - 1)));
    const sourceWidth = Math.max(1, Math.round(Math.min(rect.width * scaleX, bitmap.width - sourceX)));
    const sourceHeight = Math.max(1, Math.round(Math.min(rect.height * scaleY, bitmap.height - sourceY)));
    const outputScale = Math.min(
      1,
      MAX_REGION_SCREENSHOT_SIDE / sourceWidth,
      MAX_REGION_SCREENSHOT_SIDE / sourceHeight
    );
    const outputWidth = Math.max(1, Math.round(sourceWidth * outputScale));
    const outputHeight = Math.max(1, Math.round(sourceHeight * outputScale));
    const canvas = new OffscreenCanvas(outputWidth, outputHeight);
    const context = canvas.getContext("2d", { alpha: false });

    if (!context) return null;

    context.drawImage(
      bitmap,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    const croppedBlob = await canvas.convertToBlob({
      type: REGION_SCREENSHOT_OUTPUT_TYPE,
      quality: REGION_SCREENSHOT_OUTPUT_QUALITY
    });

    return {
      captured: true,
      type: REGION_SCREENSHOT_OUTPUT_TYPE,
      width: outputWidth,
      height: outputHeight,
      byteLength: nonNegativeInt(croppedBlob.size),
      imageDataIncluded: false,
      imageDataUploaded: false,
      imageDataStored: false,
      fullVisibleTabCaptureDiscarded: true
    };
  } finally {
    bitmap.close?.();
  }
}

function normalizeScreenshotCaptureReason(error) {
  const message = String(error?.message || error || "").toLowerCase();

  if (message.includes("permission")) return "permission_denied";
  if (message.includes("cannot") || message.includes("restricted")) return "restricted_page";
  if (message.includes("timeout")) return "capture_timeout";

  return "capture_failed";
}

function buildLocalContextTabsSummary({ question, context, targetTabs, readableTabs, skippedTabs, toolCard }) {
  const readable = Array.isArray(readableTabs) ? readableTabs : [];
  const skipped = Array.isArray(skippedTabs) ? skippedTabs : [];
  const skippedBreakdown = buildContextSkipBreakdown(skipped);
  const metadataFallback = buildContextMetadataFallback(targetTabs);
  const summarySentences = readable.flatMap((tab) =>
    splitSentences([
      tab.page?.description || "",
      ...(Array.isArray(tab.page?.headings) ? tab.page.headings : []),
      tab.page?.visibleText || ""
    ].filter(Boolean).join(" "))
      .slice(0, 2)
      .map((sentence) => ({
        tab,
        sentence
      }))
  );
  const ranked = rankSentencesForQuestion(question, summarySentences.map((item) => item.sentence));
  const directAnswer = readable.length
    ? buildContextReadableAnswer({ question, readable, ranked, skipped })
    : buildContextNoReadableAnswer({ metadataFallback, skippedBreakdown });
  const keyPoints = readable.length
    ? readable.slice(0, 4).map((tab) => `${tab.title}: ${buildSummaryText(tab.page?.description, splitSentences(tab.page?.visibleText || "")).slice(0, 180)}`)
    : targetTabs.slice(0, 4).map((tab) => `${tab.title || "Untitled"} · ${tab.hostname || "unknown"}`);
  const groupSummary = buildContextGroupSummary({
    question,
    context,
    targetTabs,
    readableTabs: readable,
    skippedTabs: skipped,
    keyPoints
  });

  return {
    status: "completed",
    provider: readable.length ? "local" : "metadata",
    aiUsed: false,
    question,
    answer: directAnswer,
    summary: directAnswer,
    groupSummary,
    keyPoints,
    tabSummaries: readable.slice(0, MULTI_TAB_CONTENT_READ_LIMIT).map((tab) => ({
      tabId: tab.tabId,
      title: tab.title,
      hostname: tab.hostname,
      summary: buildSummaryText(tab.page?.description, splitSentences(tab.page?.visibleText || "")).slice(0, 260),
      suggestedAction: "keep"
    })),
    recommendations: buildContextRecommendations({ readable, skipped, skippedBreakdown }),
    toolCard,
    skippedTabs: skipped,
    skippedBreakdown,
    privacy: {
      sentTabMetadata: false,
      sentPageText: false,
      sentFullUrls: false,
      storedCloud: false
    },
    context: {
      scope: context.scope,
      groupName: context.groupName || "",
      tabCount: targetTabs.length
    }
  };
}

function buildContextNoReadableAnswer({ metadataFallback, skippedBreakdown }) {
  const skippedSummary = formatContextSkipBreakdown(skippedBreakdown);
  const hasMissingPermission = hasContextSkipReason(skippedBreakdown, "missing_permission");
  const reasonText = skippedSummary && skippedSummary !== "none"
    ? ` Skipped pages were mainly: ${skippedSummary}.`
    : "";
  const metadataText = `From titles and hostnames only, it looks like: ${metadataFallback}.`;

  if (hasMissingPermission) {
    return `Chrome site access was not granted for these pages, so I could not read their visible text. No page body was read, sent to AI, or stored. ${metadataText} Approve site access for the selected work pages and ask again for a deeper answer.`;
  }

  return `I could not read visible text from these pages, so I answered from metadata only. No page body was read, sent to AI, or stored. ${metadataText}${reasonText}`;
}

function buildContextRecommendations({ readable, skipped, skippedBreakdown }) {
  const recommendations = [];
  const skippedCount = Array.isArray(skipped) ? skipped.length : 0;
  const hasMissingPermission = hasContextSkipReason(skippedBreakdown, "missing_permission");

  if (skippedCount) {
    recommendations.push(`I skipped ${skippedCount} ${skippedCount === 1 ? "tab" : "tabs"}: ${formatContextSkipBreakdown(skippedBreakdown)}.`);
  }

  if (hasMissingPermission) {
    recommendations.push("Approve Chrome site access for the selected work pages, then ask again for a deeper answer.");
  }

  if (!(readable || []).length && skippedCount) {
    recommendations.push("For deeper answers, select normal http/https work pages that are not pinned, audible, internal, or sensitive-looking, then ask again.");
  }

  return recommendations.slice(0, 3);
}

function formatContextSkipBreakdown(skippedBreakdown) {
  const parts = (Array.isArray(skippedBreakdown) ? skippedBreakdown : [])
    .filter((item) => Number(item.count) > 0)
    .map((item) => `${item.count} ${item.label}`);

  return parts.length ? parts.join(", ") : "none";
}

function hasContextSkipReason(skippedBreakdown, reason) {
  return (Array.isArray(skippedBreakdown) ? skippedBreakdown : []).some(
    (item) => item?.reason === reason && Number(item.count || 0) > 0
  );
}

function buildContextGroupSummary({ context, targetTabs, readableTabs, skippedTabs, keyPoints }) {
  const tabs = Array.isArray(targetTabs) ? targetTabs : [];
  const readable = Array.isArray(readableTabs) ? readableTabs : [];
  const skipped = Array.isArray(skippedTabs) ? skippedTabs : [];
  const skippedBreakdown = buildContextSkipBreakdown(skipped);
  const topHosts = getTopContextValues(tabs.map((tab) => tab.hostname).filter(Boolean), 3);
  const readableThemes = inferContextThemesFromReadableTabs(readable);
  const metadataThemes = inferContextThemesFromMetadataTabs(tabs);
  const themes = (readableThemes.length ? readableThemes : metadataThemes).slice(0, 3);
  const nextSteps = buildContextSummaryNextSteps({ context, readable, skipped, themes, keyPoints });

  return {
    label: buildContextGroupSummaryLabel(context),
    source: readable.length ? "visible_text" : "metadata",
    tabCount: tabs.length,
    readTabCount: readable.length,
    skippedTabCount: skipped.length,
    skippedBreakdown,
    topHosts,
    themes,
    suggestedNextSteps: nextSteps
  };
}

function buildContextGroupSummaryLabel(context = {}) {
  if (context.scope === "selected_tabs") {
    return "Selected tabs";
  }

  return cleanGroupName(context.groupName) || "Current group";
}

function inferContextThemesFromReadableTabs(readableTabs) {
  const phrases = [];

  for (const tab of readableTabs || []) {
    phrases.push(...sanitizePageAgentHeadings(tab.page?.headings).slice(0, 2));
    phrases.push(tab.page?.description || "");
    phrases.push(tab.title || "");
  }

  return getTopContextValues(
    phrases
      .flatMap((phrase) => extractContextThemeCandidates(phrase))
      .filter(Boolean),
    3
  );
}

function inferContextThemesFromMetadataTabs(tabs) {
  return getTopContextValues(
    (tabs || [])
      .flatMap((tab) => [
        inferTabArtifactType({
          hostname: String(tab.hostname || ""),
          path: String(tab.path || ""),
          title: String(tab.title || "")
        }),
        inferTabWorkflow({
          hostname: String(tab.hostname || ""),
          path: String(tab.path || ""),
          title: String(tab.title || ""),
          artifactType: inferTabArtifactType({
            hostname: String(tab.hostname || ""),
            path: String(tab.path || ""),
            title: String(tab.title || "")
          })
        }),
        pickProjectCandidateFromTitle(tab.title || ""),
        tab.hostname || ""
      ])
      .flatMap((phrase) => extractContextThemeCandidates(phrase))
      .filter(Boolean),
    3
  );
}

function extractContextThemeCandidates(value) {
  const text = String(value || "")
    .replace(/[_/|·•:]+/g, " ")
    .replace(/\s+-\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return [];

  const phrases = text
    .split(/[.!?。！？;,，；]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4 && part.length <= 64)
    .slice(0, 4);

  if (phrases.length) {
    return phrases.map(formatContextThemeCandidate);
  }

  return [formatContextThemeCandidate(text)];
}

function formatContextThemeCandidate(value) {
  return String(value || "")
    .replace(/\bhttps?\b/gi, "")
    .replace(/\bwww\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}

function getTopContextValues(values, limit) {
  const counts = new Map();

  for (const rawValue of values || []) {
    const value = String(rawValue || "").trim();
    const key = value.toLowerCase();
    if (!key || key === "unknown" || key === "misc" || key === "other") continue;
    counts.set(key, {
      label: value,
      count: (counts.get(key)?.count || 0) + 1
    });
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .map((item) => item.label)
    .slice(0, limit);
}

function buildContextSummaryNextSteps({ context, readable, skipped, themes, keyPoints }) {
  const nextSteps = [];
  const skippedBreakdown = buildContextSkipBreakdown(skipped || []);
  const hasMissingPermission = hasContextSkipReason(skippedBreakdown, "missing_permission");

  if (!(readable || []).length && (skipped || []).length) {
    if (hasMissingPermission) {
      nextSteps.push("Approve Chrome site access for the selected work pages, then ask again.");
    }
    nextSteps.push("Try again with normal work pages that are not pinned, audible, internal, or sensitive-looking.");
    nextSteps.push(`This answer used metadata only because ${skipped.length} tab(s) were not readable.`);
    return nextSteps.slice(0, 3);
  }

  if (hasMissingPermission) {
    nextSteps.push("Approve Chrome site access for skipped work pages if you want a fuller answer.");
  }

  if (themes?.length) {
    nextSteps.push(`Review the strongest theme first: ${themes[0]}.`);
  }

  if ((readable || []).length >= 2) {
    nextSteps.push("Ask for a comparison if you need to choose what to keep.");
  }

  if (context?.scope === "current_group") {
    nextSteps.push("Ask me to regroup this using page content if the current grouping feels off.");
  }

  if ((skipped || []).length) {
    nextSteps.push(`Open skipped pages manually if they are important; ${skipped.length} tab(s) were not readable.`);
  }

  if (!nextSteps.length && (keyPoints || []).length) {
    nextSteps.push("Use the tab summaries below to decide what to keep open.");
  }

  return nextSteps.slice(0, 3);
}

function buildContextReadableAnswer({ question, readable, ranked, skipped }) {
  const bestSentences = ranked
    .filter((item) => item.score > 0)
    .slice(0, 3)
    .map((item) => item.sentence);

  if (bestSentences.length) {
    return `${bestSentences.join(" ")}${skipped.length ? ` I skipped ${skipped.length} tab(s) that could not be safely read.` : ""}`.slice(0, 900);
  }

  const overview = readable
    .slice(0, 3)
    .map((tab) => `${tab.title}: ${buildSummaryText(tab.page?.description, splitSentences(tab.page?.visibleText || "")).slice(0, 180)}`)
    .join(" ");

  return `${overview || "I found readable text in this context, but it was sparse."}${question ? " I did not find a direct answer to every part of your question." : ""}${skipped.length ? ` I skipped ${skipped.length} tab(s) that could not be safely read.` : ""}`.slice(0, 900);
}

function buildContextMetadataFallback(targetTabs) {
  const examples = (Array.isArray(targetTabs) ? targetTabs : [])
    .slice(0, 5)
    .map((tab) => [tab.title, tab.hostname].filter(Boolean).join(" · "))
    .filter(Boolean);

  return examples.length ? examples.join("; ") : "no readable metadata is available";
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

function buildUnsupportedPageReadReason(parsedUrl) {
  const scheme = String(parsedUrl?.scheme || "").toLowerCase();

  if (["chrome", "chrome-extension", "edge", "brave", "devtools", "about"].includes(scheme)) {
    return "Chrome does not let extensions read browser or extension pages. I can still help organize this tab or answer from its title.";
  }

  if (scheme === "file") {
    return "I do not have permission to read local files from here. I can still help organize this tab or answer from its title.";
  }

  return "This page type cannot be read here. I can still help organize this tab or answer from its title.";
}

function buildScriptInjectionReadReason(error, parsedUrl) {
  const message = String(error?.message || error || "").toLowerCase();
  const scheme = String(parsedUrl?.scheme || "").toLowerCase();

  if (["chrome", "chrome-extension", "edge", "brave", "devtools", "about"].includes(scheme)) {
    return buildUnsupportedPageReadReason(parsedUrl);
  }

  if (
    message.includes("must request permission") ||
    message.includes("cannot access contents") ||
    message.includes("missing host permission") ||
    message.includes("permission")
  ) {
    return "I do not have permission to read this site right now. Open the page, click the TabMosaic icon again, then ask me from the sidebar.";
  }

  if (message.includes("cannot be scripted") || message.includes("chrome web store") || message.includes("extensions gallery")) {
    return "This page is protected from extension content reading. I can still help organize this tab or answer from its title.";
  }

  return "This page did not allow content reading. I can still help organize this tab or answer from its title.";
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

function pickReadablePageRegion() {
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
  const blockSelector = [
    "article",
    "main",
    "section",
    "aside",
    "nav",
    "header",
    "footer",
    "table",
    "ul",
    "ol",
    "[role='main']",
    "[role='article']",
    "[role='region']",
    "[role='dialog']",
    "[data-testid]",
    "[aria-label]",
    "div"
  ].join(",");

  if (!document.body) {
    return Promise.resolve({
      cancelled: true,
      reason: "This page has no readable body."
    });
  }

  return new Promise((resolve) => {
    let currentElement = null;
    let finished = false;
    const style = document.createElement("style");
    style.textContent = `
      .tabmosaic-region-highlight {
        position: fixed;
        z-index: 2147483646;
        pointer-events: none;
        border: 2px solid rgba(42, 139, 242, 0.95);
        background: rgba(42, 139, 242, 0.12);
        box-shadow: 0 0 0 99999px rgba(8, 13, 23, 0.12), 0 14px 40px rgba(15, 23, 42, 0.18);
        border-radius: 10px;
        transition: left 120ms ease, top 120ms ease, width 120ms ease, height 120ms ease;
      }
      .tabmosaic-region-hint {
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
    `;
    const highlight = document.createElement("div");
    const hint = document.createElement("div");
    const timeoutId = window.setTimeout(() => finish({
      cancelled: true,
      reason: "Region selection timed out."
    }), 60000);

    highlight.className = "tabmosaic-region-highlight";
    highlight.hidden = true;
    hint.className = "tabmosaic-region-hint";
    hint.textContent = "TabMosaic: click one visible page section. Press Esc to cancel.";
    document.documentElement.append(style, highlight, hint);

    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);

    function finish(result) {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      style.remove();
      highlight.remove();
      hint.remove();
      resolve(result);
    }

    function handleMouseMove(event) {
      const candidate = findCandidate(event.target);

      if (!candidate) {
        highlight.hidden = true;
        currentElement = null;
        return;
      }

      currentElement = candidate;
      drawHighlight(candidate);
    }

    function handleClick(event) {
      const candidate = currentElement || findCandidate(event.target);

      if (!candidate) return;

      event.preventDefault();
      event.stopPropagation();
      finish(extractRegion(candidate));
    }

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      event.preventDefault();
      event.stopPropagation();
      finish({
        cancelled: true,
        reason: "Region selection was cancelled."
      });
    }

    function drawHighlight(element) {
      const rect = element.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        highlight.hidden = true;
        return;
      }

      highlight.hidden = false;
      highlight.style.left = `${Math.max(0, rect.left)}px`;
      highlight.style.top = `${Math.max(0, rect.top)}px`;
      highlight.style.width = `${Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left)}px`;
      highlight.style.height = `${Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top)}px`;
    }

    function findCandidate(target) {
      let element = target?.nodeType === Node.ELEMENT_NODE ? target : target?.parentElement;

      while (element && element !== document.body && element !== document.documentElement) {
        if (!element.closest(blockedSelectors.join(",")) && element.matches(blockSelector) && isReadableElement(element)) {
          return element;
        }
        element = element.parentElement;
      }

      return isReadableElement(document.body) ? document.body : null;
    }

    function isReadableElement(element) {
      if (!element || element === highlight || element === hint) return false;

      const rect = element.getBoundingClientRect();
      const styleValue = window.getComputedStyle(element);
      const text = normalizeExtractedText(element.innerText || element.textContent || "");

      return rect.width >= 24 &&
        rect.height >= 16 &&
        styleValue.visibility !== "hidden" &&
        styleValue.display !== "none" &&
        text.length >= 2;
    }

    function extractRegion(element) {
      const clone = element.cloneNode(true);

      for (const node of clone.querySelectorAll(blockedSelectors.join(","))) {
        node.remove();
      }

      const title = document.title || "";
      const headings = Array.from(clone.querySelectorAll("h1,h2,h3"))
        .map((heading) => normalizeExtractedText(heading.innerText || heading.textContent || ""))
        .filter(Boolean)
        .slice(0, 8);
      const text = normalizeExtractedText((clone.innerText || clone.textContent || "").slice(0, 18000));
      const rect = element.getBoundingClientRect();
      const region = {
        label: buildRegionLabel(element, headings, text),
        tagName: String(element.tagName || "").toLowerCase().slice(0, 24),
        role: String(element.getAttribute("role") || "").slice(0, 40),
        safeLinkLabels: Array.from(clone.querySelectorAll("a"))
          .map((link) => normalizeExtractedText(link.innerText || link.getAttribute("aria-label") || link.getAttribute("title") || ""))
          .filter(Boolean)
          .slice(0, 12),
        listItems: Array.from(clone.querySelectorAll("li"))
          .map((item) => normalizeExtractedText(item.innerText || item.textContent || ""))
          .filter(Boolean)
          .slice(0, 12),
        tableHeaders: Array.from(clone.querySelectorAll("th"))
          .map((cell) => normalizeExtractedText(cell.innerText || cell.textContent || ""))
          .filter(Boolean)
          .slice(0, 12),
        tableRows: Array.from(clone.querySelectorAll("tr"))
          .map((row) => Array.from(row.querySelectorAll("th,td"))
            .map((cell) => normalizeExtractedText(cell.innerText || cell.textContent || ""))
            .filter(Boolean)
            .slice(0, 6))
          .filter((row) => row.length)
          .slice(0, 8),
        viewportRect: {
          left: Math.max(0, Math.min(window.innerWidth, rect.left)),
          top: Math.max(0, Math.min(window.innerHeight, rect.top)),
          width: Math.max(1, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left)),
          height: Math.max(1, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top)),
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1
        }
      };

      return {
        title,
        description: "",
        headings,
        selectedText: "",
        text,
        source: "selected_region",
        region
      };
    }

    function buildRegionLabel(element, headings, text) {
      const aria = normalizeExtractedText(element.getAttribute("aria-label") || "");
      const firstHeading = headings[0] || "";
      const fallback = text.split("\n").find(Boolean) || "";

      return (aria || firstHeading || fallback || "Selected page region").slice(0, 120);
    }

    function normalizeExtractedText(value) {
      return String(value || "")
        .replace(/\s+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
    }
  });
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
    confidence: 0.4,
    aiUsed: false,
    privacy: {
      sentTabMetadata: false,
      sentPageText: false,
      sentFullUrls: false,
      storedCloud: false
    }
  };
}

function buildAIConfigurationRequiredSummary(tab, parsedUrl, question = "", options = {}) {
  const target = options.source === "selected_region" ? "this selected page region" : "this page";
  const classification = classifyTab({
    title: tab.title || "",
    hostname: parsedUrl.hostname,
    path: parsedUrl.path,
    urlScheme: parsedUrl.scheme
  });

  return {
    status: "needs-ai-config",
    title: "AI provider required",
    hostname: parsedUrl.hostname,
    question,
    summary: `Connect DeepSeek or another OpenAI-compatible provider in Dashboard settings before asking about ${target}. I did not read or send page body content.`,
    keyPoints: [
      "No page body was read.",
      "No page text was sent to an AI provider.",
      "After the model is configured, ask again from the sidebar."
    ],
    suggestedGroup: classification.name,
    suggestedAction: "keep",
    confidence: 0.35,
    aiUsed: false,
    privacy: {
      sentTabMetadata: false,
      sentPageText: false,
      sentFullUrls: false,
      storedCloud: false
    }
  };
}

function buildAIPageAnswerFailedSummary(localSummary, error, settings = {}) {
  const provider = inferAIProviderId(settings.baseUrl, settings.provider);
  const reason = normalizeError(error).slice(0, 120);

  return {
    ...localSummary,
    status: "error",
    provider: "ai-error",
    aiUsed: false,
    aiError: reason,
    summary: `I could not get a usable answer from ${getAIProviderLabel(settings.baseUrl, provider)}. Check the model configuration in Dashboard settings and try again. ${reason ? `Details: ${reason}` : ""}`.trim(),
    keyPoints: [
      "The page was read only for this user-requested answer.",
      "The AI provider did not return a usable response.",
      "TabMosaic did not store the page content."
    ],
    privacy: {
      sentTabMetadata: true,
      sentPageText: true,
      sentFullUrls: false,
      storedCloud: false
    }
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
    reason: privacyCheck.reason || "sensitive context",
    aiUsed: false,
    privacy: {
      sentTabMetadata: false,
      sentPageText: false,
      sentFullUrls: false,
      storedCloud: false
    }
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
    extractedChars: (page.text || "").length,
    aiUsed: false,
    privacy: {
      sentTabMetadata: false,
      sentPageText: false,
      sentFullUrls: false,
      storedCloud: false
    }
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
    .map((heading) => compactPageKeyPoint(`Section: ${heading}`));
  const sentencePoints = sentences
    .filter((sentence) => !headingPoints.some((point) => point.includes(sentence.slice(0, 24))))
    .slice(0, 3)
    .map((sentence) => compactPageKeyPoint(sentence));
  const points = [...headingPoints, ...sentencePoints].slice(0, 5);

  if (points.length) return points;

  return [
    "Readable text was limited.",
    "Use the suggested group as a starting point.",
    "Keep the tab if it is still part of your current task."
  ];
}

function compactPageKeyPoint(value, maxLength = 140) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
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
  const titleDuplicate = buildTitleDuplicateKey(tab.title || "", parsedUrl);
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
    domainDuplicateHash: parsedUrl.domainDuplicateHash,
    domainDuplicateLabel: parsedUrl.domainDuplicateLabel,
    domainDuplicateReason: parsedUrl.domainDuplicateReason,
    samePageReviewEligible: parsedUrl.samePageReviewEligible,
    titleDuplicateHash: titleDuplicate.key ? simpleHash(titleDuplicate.key) : "",
    titleDuplicateLabel: titleDuplicate.label,
    titleDuplicateReason: titleDuplicate.reason,
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
      reviewHash: "",
      domainDuplicateHash: "",
      domainDuplicateLabel: "",
      domainDuplicateReason: "",
      samePageReviewEligible: false
    };
  }

  try {
    const url = new URL(rawUrl);
    const normalizedExact = normalizeUrlForKey(url, { stripTracking: false, stripHash: false });
    const normalizedTracking = normalizeUrlForKey(url, { stripTracking: true, stripHash: false });
    const normalizedReview = normalizeUrlForKey(url, { stripTracking: true, stripHash: true, stripQuery: true });
    const domainDuplicate = buildDomainDuplicateKey(url);

    return {
      scheme: url.protocol.replace(":", ""),
      hostname: url.hostname || url.protocol.replace(":", ""),
      path: url.pathname || "/",
      label: `${url.hostname}${url.pathname || "/"}`,
      hasQuery: Boolean(url.search),
      hasHash: Boolean(url.hash),
      exactHash: simpleHash(normalizedExact),
      trackingHash: simpleHash(normalizedTracking),
      reviewHash: simpleHash(normalizedReview),
      domainDuplicateHash: domainDuplicate.key ? simpleHash(domainDuplicate.key) : "",
      domainDuplicateLabel: domainDuplicate.label || "",
      domainDuplicateReason: domainDuplicate.reason || "",
      samePageReviewEligible: isSamePageReviewEligible(url, domainDuplicate)
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
      reviewHash: simpleHash(rawUrl),
      domainDuplicateHash: "",
      domainDuplicateLabel: "",
      domainDuplicateReason: "",
      samePageReviewEligible: false
    };
  }
}

function buildDomainDuplicateKey(url) {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const pathname = url.pathname || "/";
  const segments = pathname.split("/").filter(Boolean);

  const googleDocMatch = hostname === "docs.google.com"
    ? pathname.match(/^\/(document|spreadsheets|presentation|forms)\/d\/([^/]+)/i)
    : null;

  if (googleDocMatch) {
    const kind = googleDocMatch[1].toLowerCase();
    const docId = googleDocMatch[2];
    return {
      key: `google-workspace:${kind}:${docId}`,
      label: `docs.google.com/${kind}`,
      reason: "google-workspace-doc"
    };
  }

  if (hostname === "drive.google.com") {
    const driveFileMatch = pathname.match(/^\/file\/d\/([^/]+)/i);
    const driveFolderMatch = pathname.match(/^\/drive\/folders\/([^/]+)/i);
    const driveOpenId = ["/open", "/uc"].includes(pathname) ? url.searchParams.get("id") : "";

    if (driveFileMatch) {
      return {
        key: `google-drive:file:${driveFileMatch[1]}`,
        label: "drive.google.com/file",
        reason: "google-drive-file"
      };
    }

    if (driveFolderMatch) {
      return {
        key: `google-drive:folder:${driveFolderMatch[1]}`,
        label: "drive.google.com/folder",
        reason: "google-drive-folder"
      };
    }

    if (driveOpenId) {
      return {
        key: `google-drive:file:${driveOpenId}`,
        label: "drive.google.com/file",
        reason: "google-drive-file"
      };
    }
  }

  if (hostname === "youtube.com" || hostname === "m.youtube.com") {
    const videoId = url.searchParams.get("v");
    if (pathname === "/watch" && videoId) {
      return {
        key: `youtube-video:${videoId}`,
        label: "youtube.com/watch",
        reason: "youtube-video"
      };
    }
  }

  if (hostname === "youtu.be") {
    const videoId = pathname.split("/").filter(Boolean)[0] || "";
    if (videoId) {
      return {
        key: `youtube-video:${videoId}`,
        label: "youtu.be/video",
        reason: "youtube-video"
      };
    }
  }

  if (hostname === "github.com" && segments.length >= 4) {
    const owner = segments[0].toLowerCase();
    const repo = segments[1].toLowerCase();
    const resourceType = segments[2].toLowerCase();
    const resourceId = segments[3];
    const supportedTypes = new Map([
      ["pull", "github-pull-request"],
      ["issues", "github-issue"],
      ["discussions", "github-discussion"]
    ]);

    if (/^\d+$/.test(resourceId) && supportedTypes.has(resourceType)) {
      return {
        key: `github:${owner}/${repo}:${resourceType}:${resourceId}`,
        label: `github.com/${resourceType === "issues" ? "issue" : resourceType}`,
        reason: supportedTypes.get(resourceType)
      };
    }

    if (resourceType === "commit" && /^[a-f0-9]{7,64}$/i.test(resourceId)) {
      return {
        key: `github:${owner}/${repo}:commit:${resourceId.toLowerCase()}`,
        label: "github.com/commit",
        reason: "github-commit"
      };
    }

    if (
      resourceType === "actions" &&
      segments[3]?.toLowerCase() === "runs" &&
      /^\d+$/.test(segments[4] || "")
    ) {
      return {
        key: `github:${owner}/${repo}:actions-run:${segments[4]}`,
        label: "github.com/actions-run",
        reason: "github-actions-run"
      };
    }
  }

  if (hostname === "linear.app" && segments.length >= 3 && segments[1].toLowerCase() === "issue") {
    const workspace = segments[0].toLowerCase();
    const issueKey = segments[2].toUpperCase();

    if (/^[A-Z][A-Z0-9]+-\d+$/.test(issueKey)) {
      return {
        key: `linear:${workspace}:issue:${issueKey}`,
        label: "linear.app/issue",
        reason: "linear-issue"
      };
    }
  }

  if (hostname.endsWith(".atlassian.net")) {
    const jiraIssueMatch = pathname.match(/^\/browse\/([A-Z][A-Z0-9]+-\d+)/i);

    if (jiraIssueMatch) {
      return {
        key: `jira:${hostname}:issue:${jiraIssueMatch[1].toUpperCase()}`,
        label: "atlassian.net/browse",
        reason: "jira-issue"
      };
    }
  }

  if (hostname === "figma.com" && segments.length >= 2) {
    const kind = segments[0].toLowerCase();
    const fileKey = segments[1];

    if (["file", "design", "proto"].includes(kind) && fileKey) {
      return {
        key: `figma:${kind}:${fileKey}`,
        label: `figma.com/${kind}`,
        reason: "figma-file"
      };
    }
  }

  if (hostname === "canva.com" && segments[0]?.toLowerCase() === "design" && segments[1]) {
    return {
      key: `canva:design:${segments[1]}`,
      label: "canva.com/design",
      reason: "canva-design"
    };
  }

  if (hostname === "miro.com" && segments[0]?.toLowerCase() === "app" && segments[1]?.toLowerCase() === "board" && segments[2]) {
    return {
      key: `miro:board:${segments[2]}`,
      label: "miro.com/board",
      reason: "miro-board"
    };
  }

  if (hostname === "dropbox.com") {
    if (segments[0]?.toLowerCase() === "scl" && ["fi", "fo"].includes(segments[1]?.toLowerCase()) && segments[2]) {
      const kind = segments[1].toLowerCase() === "fo" ? "folder" : "file";
      return {
        key: `dropbox:${kind}:${segments[2]}`,
        label: `dropbox.com/${kind}`,
        reason: `dropbox-${kind}`
      };
    }

    if (segments[0]?.toLowerCase() === "s" && segments[1]) {
      return {
        key: `dropbox:share:${segments[1]}`,
        label: "dropbox.com/share",
        reason: "dropbox-share"
      };
    }
  }

  if (hostname === "coda.io" && segments[0]?.toLowerCase() === "d" && segments[1]) {
    const codaDocId = extractCodaDocId(segments[1]);

    if (codaDocId) {
      return {
        key: `coda:doc:${codaDocId}`,
        label: "coda.io/doc",
        reason: "coda-doc"
      };
    }
  }

  if (hostname === "notion.so" || hostname.endsWith(".notion.so") || hostname.endsWith(".notion.site")) {
    const notionPageId = extractNotionPageId(segments);

    if (notionPageId) {
      return {
        key: `notion:page:${notionPageId}`,
        label: "notion.so/page",
        reason: "notion-page"
      };
    }
  }

  return {
    key: "",
    label: "",
    reason: ""
  };
}

function extractNotionPageId(segments) {
  for (const segment of [...segments].reverse()) {
    const normalized = String(segment || "").replace(/-/g, "");
    const match = normalized.match(/([0-9a-f]{32})$/i);

    if (match) {
      return match[1].toLowerCase();
    }
  }

  return "";
}

function extractCodaDocId(segment = "") {
  const normalized = String(segment || "");
  const match = normalized.match(/(?:^|_)(d[a-z0-9]+)$/i);

  return match ? match[1] : "";
}

function isSamePageReviewEligible(url, domainDuplicate = {}) {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const pathname = url.pathname || "/";

  if (domainDuplicate.key) {
    return false;
  }

  if (
    (hostname === "youtube.com" || hostname === "m.youtube.com") &&
    (pathname === "/watch" || pathname === "/results")
  ) {
    return false;
  }

  if (hostname === "youtu.be") {
    return false;
  }

  if (
    (hostname === "google.com" && pathname === "/search") ||
    (hostname === "bing.com" && pathname === "/search") ||
    (hostname === "duckduckgo.com" && pathname === "/") ||
    (hostname === "search.brave.com" && pathname === "/search") ||
    (hostname === "baidu.com" && pathname === "/s")
  ) {
    return false;
  }

  return true;
}

function buildTitleDuplicateKey(title, parsedUrl = {}) {
  const scheme = String(parsedUrl.scheme || "").toLowerCase();
  const hostname = normalizeTitleDuplicateHostname(parsedUrl.hostname);
  const path = String(parsedUrl.path || "/");

  if (!hostname || !["http", "https"].includes(scheme)) {
    return { key: "", label: "", reason: "" };
  }

  if (isTitleDuplicateReviewExcluded(hostname, path)) {
    return { key: "", label: "", reason: "" };
  }

  const normalizedTitle = normalizeTitleForDuplicateReview(title, hostname);

  if (!normalizedTitle) {
    return { key: "", label: "", reason: "" };
  }

  return {
    key: `title:${hostname}:${normalizedTitle}`,
    label: `${hostname}/similar-title`,
    reason: "normalized-title"
  };
}

function normalizeTitleDuplicateHostname(hostname) {
  const value = String(hostname || "").toLowerCase().replace(/^www\./, "");

  if (!value || value === "unknown") {
    return "";
  }

  return value;
}

function isTitleDuplicateReviewExcluded(hostname, path) {
  const normalizedPath = String(path || "/").toLowerCase();

  if (
    (hostname === "youtube.com" || hostname === "m.youtube.com") &&
    (normalizedPath === "/watch" || normalizedPath === "/results")
  ) {
    return true;
  }

  if (hostname === "youtu.be") {
    return true;
  }

  return (
    (hostname === "google.com" && normalizedPath === "/search") ||
    (hostname === "bing.com" && normalizedPath === "/search") ||
    (hostname === "duckduckgo.com" && normalizedPath === "/") ||
    (hostname === "search.brave.com" && normalizedPath === "/search") ||
    (hostname === "baidu.com" && normalizedPath === "/s")
  );
}

function normalizeTitleForDuplicateReview(title, hostname) {
  const rawTitle = String(title || "").trim();

  if (!rawTitle) {
    return "";
  }

  const titleWithoutSiteSuffix = stripLikelySiteSuffix(rawTitle.toLowerCase(), hostname);
  const normalized = titleWithoutSiteSuffix
    .replace(/^\s*(?:\(\d+\)|\[\d+\]|\d+)\s+/, " ")
    .replace(/\s+(?:\(\d+\)|\[\d+\]|\d+)\s*$/, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const compactLength = normalized.replace(/\s/g, "").length;
  const tokenCount = normalized ? normalized.split(" ").length : 0;

  if (compactLength < 18 && tokenCount < 4) {
    return "";
  }

  return normalized;
}

function stripLikelySiteSuffix(title, hostname) {
  const parts = title
    .split(/\s+(?:\||-|::|\u2013|\u2014|\u00b7)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return title;
  }

  const siteTokens = normalizeHostTokensForTitle(hostname);
  const lastPart = normalizeTitleForSiteToken(parts[parts.length - 1]);

  if (!lastPart || !siteTokens.length) {
    return title;
  }

  const isSiteSuffix = siteTokens.some(
    (siteToken) => siteToken && (lastPart === siteToken || lastPart.includes(siteToken) || siteToken.includes(lastPart))
  );

  return isSiteSuffix ? parts.slice(0, -1).join(" ") : title;
}

function normalizeHostTokensForTitle(hostname) {
  return String(hostname || "")
    .toLowerCase()
    .replace(/^www\./, "")
    .split(".")
    .filter((part) => part && !["com", "net", "org", "io", "app", "dev", "ai", "co"].includes(part))
    .map(normalizeTitleForSiteToken)
    .filter(Boolean);
}

function normalizeTitleForSiteToken(value) {
  return String(value || "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
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
  collectDuplicateType(tabs, "domainDuplicateHash", "domain-review", "review", usedTabIds, duplicateGroups);
  collectDuplicateType(tabs, "reviewUrlHash", "same-page-review", "review", usedTabIds, duplicateGroups);
  collectDuplicateType(tabs, "titleDuplicateHash", "title-review", "review", usedTabIds, duplicateGroups);

  return duplicateGroups;
}

function collectDuplicateType(tabs, keyName, type, action, usedTabIds, duplicateGroups) {
  const buckets = new Map();

  for (const tab of tabs) {
    const key = tab[keyName];
    if (!key || usedTabIds.has(tab.id)) continue;
    if (type === "same-page-review" && tab.samePageReviewEligible === false) continue;

    if (!buckets.has(key)) {
      buckets.set(key, []);
    }

    buckets.get(key).push(tab);
  }

  for (const bucketTabs of buckets.values()) {
    if (bucketTabs.length < 2) continue;

    const hasQueryOrHashDifference = new Set(bucketTabs.map((tab) => `${tab.hasQuery}:${tab.hasHash}:${tab.exactUrlHash}`)).size > 1;
    const hasUrlDifference = new Set(bucketTabs.map((tab) => tab.exactUrlHash)).size > 1;

    if (type === "same-page-review" && !hasQueryOrHashDifference) {
      continue;
    } else if (type === "title-review" && !hasUrlDifference) {
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
  const label = type === "domain-review"
    ? tabs[0]?.domainDuplicateLabel || tabs[0]?.duplicateLabel || "duplicate tabs"
    : type === "title-review"
      ? tabs[0]?.titleDuplicateLabel || tabs[0]?.hostname || "similar-title"
    : tabs[0]?.duplicateLabel || "duplicate tabs";

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
      domainDuplicateHash,
      titleDuplicateHash,
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
    const key = sanitizeAllowedDuplicateAuditValue(tab?.duplicateReason, [
      "exact",
      "tracking",
      "same-page-review",
      "domain-review",
      "title-review"
    ]);
    counts[key] = nonNegativeInt(counts[key]) + 1;
  }

  return counts;
}

function sanitizeDuplicateTypeCounts(value) {
  const allowedTypes = ["exact", "tracking", "same-page-review", "domain-review", "title-review", "unknown"];
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
