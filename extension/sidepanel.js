import { applyI18n, initI18n, msg } from "./i18n.js";

const LAST_CLOSED_TABS_KEY = "tabmosaic.lastClosedTabs";
const SIDEBAR_CONTEXT_KEY = "tabmosaic.sidebarContext";
const SIDEBAR_MODE_KEY = "tabmosaic.sidebarMode";
const SIDEBAR_PENDING_PROMPT_KEY = "tabmosaic.sidebarPendingPrompt";
const CHAT_DRAFT_KEY = "tabmosaic.chatDraft";
const AGENT_TASKS_KEY = "tabmosaic.agentTasks";
const SAVED_COLLECTIONS_KEY = "tabmosaic.savedCollections";
const SAVED_MEMOS_KEY = "tabmosaic.savedMemos";
const AGENT_RUN_TRANSCRIPTS_KEY = "tabmosaic.agentRunTranscripts";
const WORKSPACE_GOAL_KEY = "tabmosaic.workspaceGoal";
const SAVED_WORKSPACES_KEY = "tabmosaic.savedWorkspaces";
const TAB_WORK_STATES_KEY = "tabmosaic.tabWorkStates";
const CHAT_THREAD_LIMIT = 22;
const AI_AGENT_CONVERSATION_LIMIT = 4;
const PAGE_CHAT_CONVERSATION_LIMIT = 20;
const CONTEXT_TABS_PERMISSION_LIMIT = 6;
const CONTEXT_TABS_CHAT_CONVERSATION_LIMIT = 20;
const MAX_AGENT_ITEMS = 30;
const MAX_AGENT_RUN_TRANSCRIPTS = 20;
const MAX_TODO_LINKED_TABS = 24;
const MAX_TRIAGE_TODO_LINKED_TABS = 8;
const BROWSER_WORK_SEARCH_RESULT_LIMIT = 5;
const TAB_WORK_STATES = new Set(["done", "later", "keep"]);

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
const composerPicker = document.querySelector("#composerPicker");
const pageRegionButton = document.querySelector("#pageRegionButton");
const chatSendButton = document.querySelector("#chatSendButton");
const chatPanel = document.querySelector("#chatPanel");
const agentThread = document.querySelector(".agent-thread");
const agentComposerSection = document.querySelector(".agent-composer-section");
const agentContextBar = document.querySelector("#agentContextBar");
const agentContextLabel = document.querySelector("#agentContextLabel");
const agentContextName = document.querySelector("#agentContextName");
const composerContextChips = document.querySelector("#composerContextChips");
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
let latestCompareTabsResult = null;
let latestResearchBriefResult = null;
let latestDecisionBriefResult = null;
let latestPageReviewResult = null;
let latestSmartFillResult = null;
let pageChatMessages = [];
let contextTabsMessages = [];
let chatMessages = [];
let activeSidebarContext = { scope: "current_tab" };
let activeSidebarMode = "agent";
let verticalTabsSearchTerm = "";
let latestWebSearchResults = [];
let latestDetectedLinks = [];
let latestFetchedLinkResult = null;
const memoCandidatesById = new Map();
const copyCandidatesById = new Map();
const agentRunTranscriptsById = new Map();
let composerPickerMode = "tools";
let composerPickerTrigger = "button";
let composerMentionRange = null;
let composerMentionQuery = "";

const COMPOSER_PICKER_ITEMS = [
  {
    action: "current-page",
    labelKey: "pickerCurrentPage",
    descriptionKey: "pickerCurrentPageCopy"
  },
  {
    action: "selected-text",
    labelKey: "pickerSelectedText",
    descriptionKey: "pickerSelectedTextCopy"
  },
  {
    action: "page-region",
    labelKey: "pickerPageRegion",
    descriptionKey: "pickerPageRegionCopy"
  },
  {
    action: "visible-screenshot",
    labelKey: "pickerVisibleScreenshot",
    descriptionKey: "pickerVisibleScreenshotCopy"
  },
  {
    action: "selected-tabs",
    labelKey: "pickerSelectedTabs",
    descriptionKey: "pickerSelectedTabsCopy",
    requiresContextTabs: true
  },
  {
    action: "search-web",
    labelKey: "pickerSearchWeb",
    descriptionKey: "pickerSearchWebCopy"
  },
  {
    action: "templates",
    labelKey: "pickerTemplates",
    descriptionKey: "pickerTemplatesCopy"
  },
  {
    action: "decision-brief",
    labelKey: "pickerDecisionBrief",
    descriptionKey: "pickerDecisionBriefCopy",
    requiresContextTabs: true
  },
  {
    action: "research-brief",
    labelKey: "pickerResearchBrief",
    descriptionKey: "pickerResearchBriefCopy",
    requiresContextTabs: true
  },
  {
    action: "save-todo",
    labelKey: "pickerSaveTodo",
    descriptionKey: "pickerSaveTodoCopy"
  }
];

const COMPOSER_TEMPLATE_ITEMS = [
  {
    id: "cleanup-tabs",
    labelKey: "templateCleanupTabs",
    descriptionKey: "templateCleanupTabsCopy",
    promptKey: "templateCleanupTabsPrompt",
    route: "organize",
    allowedContextTypes: ["current_window", "workspace"],
    toolPermissions: ["organize_tabs", "safe_duplicate_close"],
    outputFormat: "native groups plus assistant summary",
    sourceBehavior: "tab metadata only",
    blockedActions: ["close_non_duplicates", "read_page_text", "history_access", "cloud_storage"],
    requiresApplyForDestructiveActions: true
  },
  {
    id: "find-duplicates",
    labelKey: "templateFindDuplicates",
    descriptionKey: "templateFindDuplicatesCopy",
    promptKey: "templateFindDuplicatesPrompt",
    route: "chat-command",
    allowedContextTypes: ["current_window", "workspace"],
    toolPermissions: ["read_duplicate_metadata"],
    outputFormat: "assistant markdown",
    sourceBehavior: "duplicate metadata only",
    blockedActions: ["close_tabs", "read_page_text", "history_access", "cloud_storage"],
    requiresApplyForDestructiveActions: true
  },
  {
    id: "review-page",
    labelKey: "templateReviewPage",
    descriptionKey: "templateReviewPageCopy",
    promptKey: "templateReviewPagePrompt",
    route: "current-page",
    workflow: "review_page",
    allowedContextTypes: ["current_tab"],
    toolPermissions: ["read_visible_page_text_after_user_request"],
    outputFormat: "findings and next steps",
    sourceBehavior: "current page visible text only after user request",
    blockedActions: ["auto_submit", "mutate_page", "full_url_upload", "cloud_storage"],
    requiresApplyForDestructiveActions: false
  },
  {
    id: "visual-review",
    labelKey: "templateVisualReview",
    descriptionKey: "templateVisualReviewCopy",
    promptKey: "templateVisualReviewPrompt",
    route: "visible-screenshot",
    workflow: "screenshot_vision",
    allowedContextTypes: ["current_tab"],
    toolPermissions: ["capture_visible_screenshot_after_user_click"],
    outputFormat: "visual findings and next steps",
    sourceBehavior: "current visible screenshot only after user request",
    blockedActions: ["read_hidden_dom", "auto_submit", "mutate_page", "full_url_upload", "cloud_storage"],
    requiresApplyForDestructiveActions: false
  },
  {
    id: "draft-response",
    labelKey: "templateDraftResponse",
    descriptionKey: "templateDraftResponseCopy",
    promptKey: "templateDraftResponsePrompt",
    route: "current-page",
    workflow: "contextual_writing",
    allowedContextTypes: ["current_tab"],
    toolPermissions: ["read_visible_page_text_after_user_request"],
    outputFormat: "copy-only draft text",
    sourceBehavior: "current page visible text only after user request",
    blockedActions: ["auto_submit", "mutate_page", "insert_text", "full_url_upload", "cloud_storage"],
    requiresApplyForDestructiveActions: false
  },
  {
    id: "smart-fill-lite",
    labelKey: "templateSmartFill",
    descriptionKey: "templateSmartFillCopy",
    promptKey: "templateSmartFillPrompt",
    route: "page-region",
    workflow: "smart_fill_lite",
    allowedContextTypes: ["page_region"],
    toolPermissions: ["read_selected_page_region_after_user_click"],
    outputFormat: "copy-only Markdown table and row actions",
    sourceBehavior: "one user-selected page region only",
    blockedActions: ["auto_fill", "auto_submit", "mutate_page", "background_crawl", "web_search", "full_url_upload", "cloud_storage"],
    requiresApplyForDestructiveActions: false
  },
  {
    id: "compare-selected-tabs",
    labelKey: "templateCompareTabs",
    descriptionKey: "templateCompareTabsCopy",
    promptKey: "templateCompareTabsPrompt",
    route: "context-tabs",
    workflow: "compare_selected_tabs",
    allowedContextTypes: ["selected_tabs", "current_group"],
    toolPermissions: ["read_selected_tabs_pages_after_site_access"],
    outputFormat: "comparison table and recommendation",
    sourceBehavior: "selected/group tabs only",
    blockedActions: ["read_unselected_tabs", "close_tabs", "auto_submit", "cloud_storage"],
    requiresContextTabs: true,
    requiresApplyForDestructiveActions: false
  },
  {
    id: "decision-brief",
    labelKey: "templateDecisionBrief",
    descriptionKey: "templateDecisionBriefCopy",
    promptKey: "templateDecisionBriefPrompt",
    route: "context-tabs",
    workflow: "decision_brief",
    allowedContextTypes: ["selected_tabs", "current_group"],
    toolPermissions: ["read_selected_tabs_pages_after_site_access"],
    outputFormat: "recommendation, tradeoffs, missing information, sources",
    sourceBehavior: "selected/group tabs only",
    blockedActions: ["read_unselected_tabs", "close_tabs", "auto_submit", "cloud_storage"],
    requiresContextTabs: true,
    requiresApplyForDestructiveActions: false
  },
  {
    id: "research-brief",
    labelKey: "templateResearchBrief",
    descriptionKey: "templateResearchBriefCopy",
    promptKey: "templateResearchBriefPrompt",
    route: "context-tabs",
    workflow: "research_brief",
    allowedContextTypes: ["selected_tabs", "current_group"],
    toolPermissions: ["read_selected_tabs_pages_after_site_access", "search_web_provider_after_user_click"],
    outputFormat: "findings, contradictions, gaps, next steps, and source notes",
    sourceBehavior: "selected/group tabs first; search only after explicit follow-up",
    blockedActions: ["read_unselected_tabs", "background_crawl", "close_tabs", "auto_submit", "cloud_storage"],
    requiresContextTabs: true,
    requiresApplyForDestructiveActions: false
  },
  {
    id: "draft-from-tabs",
    labelKey: "templateDraftFromTabs",
    descriptionKey: "templateDraftFromTabsCopy",
    promptKey: "templateDraftFromTabsPrompt",
    route: "context-tabs",
    workflow: "contextual_writing",
    allowedContextTypes: ["selected_tabs", "current_group"],
    toolPermissions: ["read_selected_tabs_pages_after_site_access"],
    outputFormat: "copy-only draft text",
    sourceBehavior: "selected/group tabs visible text only after user request",
    blockedActions: ["read_unselected_tabs", "auto_submit", "mutate_page", "insert_text", "close_tabs", "full_url_upload", "cloud_storage"],
    requiresContextTabs: true,
    requiresApplyForDestructiveActions: false
  },
  {
    id: "translate-selection",
    labelKey: "templateTranslateSelection",
    descriptionKey: "templateTranslateSelectionCopy",
    promptKey: "templateTranslateSelectionPrompt",
    route: "selected-text",
    allowedContextTypes: ["selected_text"],
    toolPermissions: ["read_selected_text_after_user_request"],
    outputFormat: "bilingual translation and glossary",
    sourceBehavior: "highlighted text only",
    blockedActions: ["read_full_page", "auto_submit", "full_url_upload", "cloud_storage"],
    requiresApplyForDestructiveActions: false
  },
  {
    id: "rewrite-selection",
    labelKey: "templateRewriteSelection",
    descriptionKey: "templateRewriteSelectionCopy",
    promptKey: "templateRewriteSelectionPrompt",
    route: "selected-text",
    workflow: "contextual_writing",
    allowedContextTypes: ["selected_text"],
    toolPermissions: ["read_selected_text_after_user_request"],
    outputFormat: "copy-only rewritten draft",
    sourceBehavior: "highlighted text only",
    blockedActions: ["read_full_page", "auto_submit", "insert_text", "full_url_upload", "cloud_storage"],
    requiresApplyForDestructiveActions: false
  },
  {
    id: "create-todo",
    labelKey: "templateCreateTodo",
    descriptionKey: "templateCreateTodoCopy",
    promptKey: "templateCreateTodoPrompt",
    route: "todo",
    allowedContextTypes: ["current_tab", "selected_tabs", "current_group"],
    toolPermissions: ["write_local_todo"],
    outputFormat: "local Work Queue item",
    sourceBehavior: "minimized tab metadata only unless page read was explicitly requested",
    blockedActions: ["close_tabs", "read_page_text", "auto_submit", "cloud_storage"],
    requiresApplyForDestructiveActions: false
  }
];

await initI18n();
applyI18n();
await initSidebarContext();
await initSidebarMode();
await initSidebarPendingPrompt();
renderComposerPicker();

dashboardTopButton.addEventListener("click", () => openDashboard());
organizeButton.addEventListener("click", () => runQuickChatCommand("organize again", msg("organizeAgain")));
undoButton.addEventListener("click", () => runQuickChatCommand("undo", msg("undo")));
restoreButton.addEventListener("click", () => runQuickChatCommand("restore closed", msg("restoreClosed")));
dashboardButton.addEventListener("click", () => runQuickChatCommand("open dashboard", msg("openDashboard")));
startButton.addEventListener("click", acceptPrivacyAndOrganize);
duplicatesList.addEventListener("click", handleDuplicateAction);
chatForm.addEventListener("submit", previewChatRefine);
chatInput.addEventListener("keydown", handleComposerKeydown);
chatInput.addEventListener("input", handleComposerInput);
pageRegionButton?.addEventListener("click", toggleComposerPicker);
composerPicker?.addEventListener("click", handleComposerPickerClick);
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
document.addEventListener("click", handleComposerDocumentClick);

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
  renderComposerContextChips();
  renderComposerPicker();
}

function renderComposerContextChips(text = chatInput?.value || "") {
  if (!composerContextChips) return;

  const chips = buildComposerContextChips(text);
  composerContextChips.hidden = chips.length === 0;
  composerContextChips.innerHTML = chips
    .map((chip) => `
      <span
        class="composer-context-chip ${escapeHtml(chip.tone || "")}"
        title="${escapeHtml(chip.title || chip.label)}"
      >${escapeHtml(chip.label)}</span>
    `)
    .join("");
}

function buildComposerContextChips(text = "") {
  const chips = [];
  const normalizedText = normalizeAgentText(text);

  if (extractPastedLinks(text).length) {
    chips.push({
      label: msg("composerChipLink"),
      title: msg("composerChipLinkTitle"),
      tone: "link"
    });
  }

  if (isSelectedTextIntent(normalizedText)) {
    chips.push({
      label: msg("composerChipSelectedText"),
      title: msg("pickerSelectedTextCopy"),
      tone: "text"
    });
  }

  if (isPageRegionCommand(normalizedText) || isSmartFillCommand(normalizedText)) {
    chips.push({
      label: msg("composerChipPageRegion"),
      title: msg("pickerPageRegionCopy"),
      tone: "region"
    });
  }

  if (isVisibleScreenshotIntent(normalizedText)) {
    chips.push({
      label: msg("composerChipScreenshot"),
      title: msg("pickerVisibleScreenshotCopy"),
      tone: "screenshot"
    });
  }

  if (shouldRouteAgentWebSearch(text)) {
    chips.push({
      label: msg("composerChipSearch"),
      title: msg("pickerSearchWebCopy"),
      tone: "search"
    });
  }

  if (isComposerTemplatePrompt(normalizedText)) {
    chips.push({
      label: msg("composerChipTemplate"),
      title: msg("pickerTemplatesCopy"),
      tone: "template"
    });
  }

  return dedupeComposerContextChips(chips).slice(0, 4);
}

function dedupeComposerContextChips(chips = []) {
  const seen = new Set();
  return chips.filter((chip) => {
    const key = `${chip.tone || ""}:${chip.label || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isSelectedTextIntent(text = "") {
  return (
    /\bselected\s+text\b/.test(text) ||
    /\bhighlighted\s+text\b/.test(text) ||
    /\btranslate\s+selection\b/.test(text) ||
    /选中/.test(text)
  );
}

function isComposerTemplatePrompt(text = "") {
  if (!text) return false;
  return COMPOSER_TEMPLATE_ITEMS.some((item) => {
    const prompt = normalizeAgentText(msg(item.promptKey));
    return prompt && text === prompt;
  });
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
    const explicitTitle = extractTodoTitleFromCommand(text);
    const task = {
      id: `task-${Date.now()}`,
      title: explicitTitle || buildSidebarTodoTitle(tabs, context),
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

async function updateLatestTodoFromCommand(action, text) {
  setBusy(true);

  try {
    const stored = await chrome.storage.local.get(AGENT_TASKS_KEY);
    const tasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];
    const target = resolveTodoCommandTarget(text, tasks, action);

    if (target.status === "empty") {
      renderChatPanel({
        status: "info",
        answer: msg("agentTodoNoOpenTodo")
      });
      return;
    }

    if (target.status === "no-match") {
      renderChatPanel({
        status: "info",
        answer: msg("agentTodoTargetNoMatch", [target.query || msg("todo")])
      });
      return;
    }

    if (target.status === "ambiguous") {
      renderChatPanel({
        status: "info",
        answer: buildTodoTargetAmbiguousMarkdown(target.query, target.matches)
      });
      return;
    }

    const targetIndex = target.index;
    const currentTask = tasks[targetIndex];
    const nextTask = {
      ...currentTask,
      checklist: normalizeTodoChecklist(currentTask.checklist),
      updatedAt: new Date().toISOString()
    };
    let changeSummary = "";

    if (action === "rename") {
      const nextTitle = extractTodoRenameTitle(text);
      if (!nextTitle) {
        renderChatPanel({
          status: "info",
          answer: msg("agentTodoRenameMissing")
        });
        return;
      }
      nextTask.title = nextTitle;
      changeSummary = msg("agentTodoRenamed");
    }

    if (action === "addChecklist") {
      const item = extractTodoChecklistItem(text);
      if (!item) {
        renderChatPanel({
          status: "info",
          answer: msg("agentTodoChecklistItemMissing")
        });
        return;
      }
      nextTask.checklist = appendTodoChecklistItem(nextTask.checklist, item);
      nextTask.checklistUpdatedAt = nextTask.updatedAt;
      changeSummary = "";
    }

    if (action === "markChecklistDone") {
      const doneResult = markTodoChecklistItemDone(nextTask.checklist, text);
      if (!doneResult.updated) {
        renderChatPanel({
          status: "info",
          answer: msg("agentTodoChecklistItemNotFound")
        });
        return;
      }
      nextTask.checklist = doneResult.checklist;
      nextTask.checklistUpdatedAt = nextTask.updatedAt;
      changeSummary = "";
    }

    if (action === "mergeContext") {
      const context = normalizeSidebarContext(activeSidebarContext) || { scope: "current_tab" };
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

      const mergeResult = mergeTodoLinkedTabs(nextTask, tabs);
      nextTask.tabs = mergeResult.tabs;
      nextTask.tabIds = mergeResult.tabIds;
      nextTask.contextScope = nextTask.contextScope || context.scope;
      nextTask.mergedContexts = appendTodoMergedContext(nextTask.mergedContexts, context, tabs, text);
      changeSummary = mergeResult.added > 0
        ? msg("agentTodoContextMerged", [mergeResult.added])
        : msg("agentTodoContextMergeNoNewTabs");
    }

    const nextTasks = tasks.map((task, index) => (index === targetIndex ? nextTask : task));
    await chrome.storage.local.set({ [AGENT_TASKS_KEY]: nextTasks.slice(0, MAX_AGENT_ITEMS) });

    renderChatPanel({
      status: "todo-updated",
      answer: buildTodoUpdatedMarkdown(nextTask, changeSummary),
      task: nextTask
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

function findLatestEditableTodoIndex(tasks = []) {
  return tasks.findIndex((task) => (
    task &&
    typeof task === "object" &&
    task.status !== "archived" &&
    task.status !== "done"
  ));
}

function resolveTodoCommandTarget(text = "", tasks = [], action = "") {
  const editable = tasks
    .map((task, index) => ({ task, index }))
    .filter(({ task }) => (
      task &&
      typeof task === "object" &&
      task.status !== "archived" &&
      task.status !== "done"
    ));

  if (!editable.length) return { status: "empty", index: -1, query: "", matches: [] };

  const query = extractTodoTargetQuery(text, action);
  if (!query) return { status: "ok", index: editable[0].index, query: "", matches: [editable[0]] };

  const matches = findTodoTargetMatches(editable, query);
  if (!matches.length) return { status: "no-match", index: -1, query, matches: [] };
  if (matches.length > 1) return { status: "ambiguous", index: -1, query, matches };
  return { status: "ok", index: matches[0].index, query, matches };
}

function extractTodoTargetQuery(text = "", action = "") {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  const patternsByAction = {
    rename: [
      /\b(?:rename|retitle|name|title)\s+(.+?)\s+(?:todo|to-do|task|work queue item)\s+(?:to|as)\s+.+$/i,
      /\b(?:change|update)\s+(.+?)\s+(?:todo|to-do|task)\s+(?:title|name)\s+(?:to|as)\s+.+$/i
    ],
    addChecklist: [
      /\b(?:add|append)\s+(?:a\s+)?(?:checklist\s+)?(?:item|step)\s+(?:to|into)\s+(.+?)\s+(?:todo|to-do|task|checklist)\s*(?::|-|—)\s*.+$/i,
      /\b(?:add|append)\s+(?:to|into)\s+(.+?)\s+(?:todo|to-do|task|checklist)\s*(?::|-|—)\s*.+$/i,
      /\b(?:add|append)\s+.+?\s+(?:to|into)\s+(.+?)\s+(?:todo|to-do|task|checklist)$/i
    ],
    markChecklistDone: [
      /\b(?:done|complete|completed|finished)\s+.+?\s+(?:in|on|for)\s+(.+?)\s+(?:todo|to-do|task|checklist)$/i,
      /\b(?:mark|check|complete|finish)\s+.+?\s+(?:done|complete|completed|finished)\s+(?:in|on|for)\s+(.+?)\s+(?:todo|to-do|task|checklist)$/i,
      /\b(?:in|on|for)\s+(.+?)\s+(?:todo|to-do|task|checklist)\s*$/i
    ],
    mergeContext: [
      /\b(?:to|into|with)\s+(.+?)\s+(?:todo|to-do|task|work queue item)\s*$/i,
      /\b(?:todo|to-do|task|work queue item)\s+["'“”]?(.+?)["'“”]?\s*$/i
    ]
  };
  const patterns = patternsByAction[action] || [];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const query = sanitizeTodoTargetQuery(match?.[1] || "");
    if (query) return query;
  }

  return "";
}

function sanitizeTodoTargetQuery(value = "") {
  const query = String(value || "")
    .replace(/^[\s"'“”]+|[\s"'“”]+$/g, "")
    .replace(/\b(the|a|an|latest|current|last|local|open|work queue)\b/gi, " ")
    .replace(/\b(todo|to-do|task|checklist|item|step)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  return /^(latest|current|last)$/i.test(query) ? "" : query;
}

function findTodoTargetMatches(editable = [], query = "") {
  const queryTokens = tokenizeBrowserWorkText(query);
  if (!queryTokens.length) return [];

  return editable.filter(({ task }) => {
    const title = String(task?.title || "");
    const haystack = [
      title,
      task?.sourcePrompt,
      ...(Array.isArray(task?.tabs) ? task.tabs.map((tab) => `${tab?.title || ""} ${tab?.hostname || ""} ${tab?.groupName || ""}`) : [])
    ].join(" ");
    const haystackTokens = tokenizeBrowserWorkText(haystack);
    const titleNormalized = normalizeAgentText(title);
    const queryNormalized = normalizeAgentText(query);

    return titleNormalized.includes(queryNormalized) ||
      queryTokens.every((token) => haystackTokens.includes(token));
  }).slice(0, 4);
}

function buildTodoTargetAmbiguousMarkdown(query = "", matches = []) {
  const lines = [
    msg("agentTodoTargetAmbiguous", [query || msg("todo")]),
    "",
    ...matches.slice(0, 4).map(({ task }, index) => `${index + 1}. ${task?.title || msg("todo")}`),
    "",
    msg("agentTodoTargetAmbiguousHint")
  ];

  return lines.join("\n");
}

function mergeTodoLinkedTabs(task = {}, tabs = []) {
  const existingTabs = Array.isArray(task.tabs) ? task.tabs : [];
  const merged = [];
  const seen = new Set();
  let added = 0;

  for (const tab of existingTabs) {
    const id = toOptionalInteger(tab?.id);
    if (Number.isInteger(id)) {
      seen.add(id);
      merged.push({ ...tab, id });
    } else if (tab && typeof tab === "object") {
      merged.push(tab);
    }
  }

  for (const tab of tabs) {
    const id = toOptionalInteger(tab?.id);
    if (!Number.isInteger(id) || seen.has(id)) continue;
    seen.add(id);
    merged.push({ ...tab, id });
    added += 1;
  }

  const limitedTabs = merged.slice(0, MAX_TODO_LINKED_TABS);
  return {
    added,
    tabs: limitedTabs,
    tabIds: limitedTabs.map((tab) => toOptionalInteger(tab?.id)).filter(Number.isInteger)
  };
}

function appendTodoMergedContext(mergedContexts = [], context = {}, tabs = [], text = "") {
  const entry = {
    scope: String(context?.scope || "current_tab").slice(0, 40),
    tabCount: tabs.length,
    sourcePrompt: sanitizeTodoSourcePrompt(text),
    updatedAt: new Date().toISOString()
  };

  return [entry, ...(Array.isArray(mergedContexts) ? mergedContexts : [])].slice(0, 5);
}

function normalizeTodoChecklist(checklist = []) {
  return (Array.isArray(checklist) ? checklist : [])
    .map(cleanChecklistItem)
    .filter(Boolean)
    .slice(0, 12);
}

function extractTodoTitleFromCommand(text = "") {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  const patterns = [
    /\b(?:todo|task|work queue item)\s*(?:called|named|titled|as|:)\s*["'“”]?(.+?)["'“”]?$/i,
    /\b(?:call|name|title)\s+(?:this\s+)?(?:todo|task)\s+["'“”]?(.+?)["'“”]?$/i,
    /(?:待办|任务)(?:叫|命名为|标题为|：|:)\s*(.+)$/i
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const title = sanitizeTodoTitle(match?.[1] || "");
    if (title) return title;
  }

  return "";
}

function extractTodoRenameTitle(text = "") {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  const patterns = [
    /\b(?:rename|retitle|name|title)\s+.+?\s+(?:todo|task|work queue item)\s+(?:to|as)\s*["'“”]?(.+?)["'“”]?$/i,
    /\b(?:change|update)\s+.+?\s+(?:todo|task)\s+(?:title|name)\s+(?:to|as)\s*["'“”]?(.+?)["'“”]?$/i,
    /\b(?:rename|retitle|name|title)\s+(?:the\s+|latest\s+|current\s+|last\s+)?(?:todo|task|work queue item)\s+(?:to|as)\s*["'“”]?(.+?)["'“”]?$/i,
    /\b(?:change|update)\s+(?:the\s+|latest\s+|current\s+|last\s+)?(?:todo|task)\s+(?:title|name)\s+(?:to|as)\s*["'“”]?(.+?)["'“”]?$/i,
    /(?:重命名|改名|修改).{0,20}(?:待办|任务).{0,10}(?:为|成|叫|：|:)\s*(.+)$/i
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const title = sanitizeTodoTitle(match?.[1] || "");
    if (title) return title;
  }

  return "";
}

function sanitizeTodoTitle(value = "") {
  return String(value || "")
    .replace(/^[\s"'“”]+|[\s"'“”]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function extractTodoChecklistItem(text = "") {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  const patterns = [
    /\b(?:add|append)\s+(?:a\s+)?(?:checklist\s+)?(?:item|step)\s+(?:to|into)\s+.+?\s+(?:todo|task|checklist)\s*(?::|-|—)\s*(.+)$/i,
    /\b(?:add|append)\s+(?:to|into)\s+.+?\s+(?:todo|task|checklist)\s*(?::|-|—)\s*(.+)$/i,
    /\b(?:add|append)\s*["'“”]?(.+?)["'“”]?\s+(?:to|into)\s+.+?\s+(?:todo|task|checklist)$/i,
    /\b(?:add|append)\s+(?:a\s+)?(?:checklist\s+)?(?:item|step)\s*(?:to\s+(?:the\s+|latest\s+|current\s+)?(?:todo|task|checklist))?\s*(?::|-|—)?\s*(.+)$/i,
    /\b(?:add|append)\s*["'“”]?(.+?)["'“”]?\s+(?:to|into)\s+(?:the\s+|latest\s+|current\s+)?(?:todo|task|checklist)$/i,
    /(?:添加|加入|新增).{0,12}(?:待办|任务|清单)?.{0,12}(?:步骤|事项|条目)?(?:：|:)?\s*(.+)$/i
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const item = cleanChecklistItem(match?.[1] || "");
    if (item) return item;
  }

  return "";
}

function appendTodoChecklistItem(checklist = [], item = "") {
  const cleanItem = cleanChecklistItem(item);
  if (!cleanItem) return normalizeTodoChecklist(checklist);

  const nextChecklist = normalizeTodoChecklist(checklist);
  const hasDuplicate = nextChecklist.some((entry) => normalizeAgentText(stripChecklistDonePrefix(entry)) === normalizeAgentText(cleanItem));
  if (!hasDuplicate) nextChecklist.push(cleanItem);
  return nextChecklist.slice(0, 12);
}

function markTodoChecklistItemDone(checklist = [], text = "") {
  const nextChecklist = normalizeTodoChecklist(checklist);
  if (!nextChecklist.length) return { updated: false, checklist: nextChecklist, item: "" };

  const index = resolveChecklistItemIndex(text, nextChecklist);
  if (index < 0 || index >= nextChecklist.length) {
    return { updated: false, checklist: nextChecklist, item: "" };
  }

  const item = stripChecklistDonePrefix(nextChecklist[index]);
  nextChecklist[index] = `Done: ${item}`.slice(0, 220);
  return { updated: true, checklist: nextChecklist, item };
}

function resolveChecklistItemIndex(text = "", checklist = []) {
  const normalized = normalizeAgentText(text);
  const ordinalMap = {
    first: 0,
    "1": 0,
    "1st": 0,
    second: 1,
    "2": 1,
    "2nd": 1,
    third: 2,
    "3": 2,
    "3rd": 2,
    fourth: 3,
    "4": 3,
    "4th": 3,
    fifth: 4,
    "5": 4,
    "5th": 4
  };

  if (/\blast\b/.test(normalized)) return checklist.length - 1;

  for (const [token, index] of Object.entries(ordinalMap)) {
    if (new RegExp(`\\b${token}\\b`).test(normalized)) return index;
  }

  const explicitNumber = normalized.match(/\b(?:item|step|checklist)\s*#?\s*(\d{1,2})\b/);
  if (explicitNumber) return Number(explicitNumber[1]) - 1;

  const query = extractChecklistDoneQuery(text);
  if (query) {
    const queryTokens = tokenizeBrowserWorkText(query);
    const matchIndex = checklist.findIndex((item) => {
      const itemText = stripChecklistDonePrefix(item);
      const itemTokens = tokenizeBrowserWorkText(itemText);
      return queryTokens.length && queryTokens.every((token) => itemTokens.includes(token));
    });
    if (matchIndex >= 0) return matchIndex;
  }

  return checklist.length === 1 ? 0 : -1;
}

function extractChecklistDoneQuery(text = "") {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  const patterns = [
    /\b(?:mark|check|complete|finish)\s+(?:off\s+)?(?:the\s+)?(?:checklist\s+)?(?:item|step)?\s*(.+?)\s+(?:as\s+)?(?:done|complete|completed|finished)\s+(?:in|on|for)\s+.+?\s+(?:todo|task|checklist)$/i,
    /\b(?:mark|check|complete|finish)\s+(?:off\s+)?(?:the\s+)?(?:checklist\s+)?(?:item|step)?\s*(.+?)\s+(?:as\s+)?(?:done|complete|completed|finished)$/i,
    /\b(?:done|complete|completed|finished)\s*[:：-]\s*(.+)$/i,
    /(?:完成|勾选|标记完成).{0,12}(?:事项|步骤|条目)?(?:：|:)?\s*(.+)$/i
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const query = cleanChecklistItem(match?.[1] || "");
    if (query && !/^(first|second|third|fourth|fifth|last|\d+)$/i.test(query)) return query;
  }

  return "";
}

function stripChecklistDonePrefix(value = "") {
  return String(value || "")
    .replace(/^\s*(?:done|completed|finished)\s*:\s*/i, "")
    .replace(/^\s*\[[xX]\]\s*/, "")
    .trim();
}

function buildTodoUpdatedMarkdown(task = {}, changeSummary = "") {
  const checklist = normalizeTodoChecklist(task.checklist).slice(0, 8);
  const lines = [
    msg("agentTodoUpdated", [task.title || msg("todo")]),
    changeSummary ? `- ${changeSummary}` : "",
    "",
    ...checklist.map(formatTodoChecklistMarkdownItem),
    "",
    msg("agentTodoUpdatedLocally")
  ];

  return lines.filter((line, index) => line || index < lines.length - 1).join("\n");
}

function formatTodoChecklistMarkdownItem(item = "") {
  const cleanItem = stripChecklistDonePrefix(item);
  const isDone = cleanItem !== String(item || "").trim();
  return isDone ? `- Done: ${cleanItem}` : `- ${cleanItem}`;
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

async function createTodoFromPageReview() {
  const reviewResult = getActivePageReviewResult();

  if (!reviewResult?.summary) {
    renderChatPanel({
      status: "error",
      answer: msg("pageReviewUnavailable")
    });
    return;
  }

  setBusy(true);
  try {
    const task = await saveChecklistTodoFromPageSummary(reviewResult.summary, reviewResult.summary.question || "review this page");
    const stored = await chrome.storage.local.get(AGENT_TASKS_KEY);
    const existingTasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];
    task.source = "page_review";
    task.pageAgent = {
      ...(task.pageAgent || {}),
      workflow: "review_page"
    };
    await chrome.storage.local.set({
      [AGENT_TASKS_KEY]: [task, ...existingTasks.filter((item) => item?.id !== task.id)].slice(0, MAX_AGENT_ITEMS)
    });
    renderChatPanel({
      status: "todo-created",
      answer: buildChecklistTodoMarkdown(task),
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
  const keyPoints = [
    ...(Array.isArray(summary.reviewChecklist) ? summary.reviewChecklist : []),
    ...(Array.isArray(summary.nextSteps) ? summary.nextSteps : []),
    ...(Array.isArray(summary.risks) ? summary.risks.map((item) => `Check risk: ${item}`) : []),
    ...(Array.isArray(summary.openQuestions) ? summary.openQuestions.map((item) => `Answer: ${item}`) : []),
    ...(Array.isArray(summary.keyPoints) ? summary.keyPoints : [])
  ];
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

async function createTodoFromAITriage(text = "") {
  const triage = buildLocalAITriage(latestRun);

  if (!latestRun || latestRun.status !== "completed" || !triage.hasSignal) {
    renderChatPanel({
      status: "info",
      answer: msg("aiTriageTodoUnavailable")
    });
    return;
  }

  setBusy(true);

  try {
    const tabs = buildAITriageLinkedTabs(latestRun)
      .slice(0, MAX_TRIAGE_TODO_LINKED_TABS)
      .map((tab) => sanitizeTabForSidebarWork(tab, { scope: "workspace" }))
      .filter((tab) => Number.isInteger(tab.id));
    const now = new Date().toISOString();
    const task = {
      id: `task-${Date.now()}`,
      title: buildAITriageTodoTitle(triage),
      status: "open",
      source: "ai_triage",
      sourcePrompt: sanitizeTodoSourcePrompt(text),
      contextScope: "workspace",
      createdAt: now,
      updatedAt: now,
      tabIds: tabs.map((tab) => tab.id).filter(Number.isInteger),
      tabs,
      checklist: buildAITriageTodoChecklist(triage),
      triage: sanitizeAITriageForTask(triage)
    };
    const stored = await chrome.storage.local.get(AGENT_TASKS_KEY);
    const existingTasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];

    await chrome.storage.local.set({
      [AGENT_TASKS_KEY]: [task, ...existingTasks].slice(0, MAX_AGENT_ITEMS)
    });

    renderChatPanel({
      status: "todo-created",
      answer: buildCompareTodoMarkdown(task),
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

async function createTodoFromWorkspaceGoal(text = "make goal a todo") {
  setBusy(true);

  try {
    const stored = await chrome.storage.local.get([WORKSPACE_GOAL_KEY, AGENT_TASKS_KEY]);
    const goal = normalizeWorkspaceGoal(stored[WORKSPACE_GOAL_KEY]);

    if (!goal?.text) {
      renderChatPanel({
        status: "info",
        answer: msg("workspaceGoalNoSuggestion")
      });
      return;
    }

    const tabs = findTabsForWorkspaceGoal(goal.text, getSnapshotTabs(latestRun))
      .slice(0, MAX_TODO_LINKED_TABS);
    const now = new Date().toISOString();
    const task = {
      id: `task-${Date.now()}`,
      title: buildWorkspaceGoalTodoTitle(goal.text),
      status: "open",
      source: "workspace_goal",
      sourcePrompt: sanitizeTodoSourcePrompt(text),
      contextScope: "workspace",
      createdAt: now,
      updatedAt: now,
      tabIds: tabs.map((tab) => tab.id).filter(Number.isInteger),
      tabs,
      checklist: buildWorkspaceGoalTodoChecklist(goal.text, latestRun, tabs),
      workspaceGoal: {
        text: goal.text,
        source: goal.source,
        metadataOnly: goal.metadataOnly !== false
      },
      metadataOnly: true
    };
    const existingTasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];

    await chrome.storage.local.set({
      [AGENT_TASKS_KEY]: [task, ...existingTasks].slice(0, MAX_AGENT_ITEMS)
    });

    renderChatPanel({
      status: "todo-created",
      answer: buildCompareTodoMarkdown(task),
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

function buildWorkspaceGoalTodoTitle(goalText = "") {
  const goal = sanitizeWorkspaceGoalText(goalText);
  return goal ? `Goal: ${goal}`.slice(0, 120) : msg("todo");
}

function buildWorkspaceGoalTodoChecklist(goalText = "", run = null, tabs = []) {
  const goal = sanitizeWorkspaceGoalText(goalText);
  const checklist = [
    goal ? `Clarify the next decision for: ${goal}` : "",
    tabs.length ? `Review ${formatTabCountLabel(tabs.length)} matching open tab${tabs.length === 1 ? "" : "s"}.` : "",
    getReviewDuplicateGroups(run).length ? "Clear duplicate-review candidates before deep work." : "",
    "Save or close anything that no longer supports the goal."
  ]
    .map(cleanChecklistItem)
    .filter(Boolean);

  return Array.from(new Set(checklist)).slice(0, 5);
}

async function setWorkspaceGoalFromTriage() {
  const inferredGoal = inferWorkspaceGoalTextFromRun(latestRun);

  if (!inferredGoal) {
    renderChatPanel({
      status: "info",
      answer: msg("workspaceGoalNoSuggestion")
    });
    return;
  }

  await saveWorkspaceGoal(inferredGoal, "ai_triage");
}

async function setWorkspaceGoalFromCommand(text = "") {
  const explicitGoal = extractWorkspaceGoalText(text);
  let stored = {};
  if (!explicitGoal) {
    try {
      stored = await chrome.storage.local.get([
        AGENT_TASKS_KEY,
        SAVED_COLLECTIONS_KEY,
        SAVED_MEMOS_KEY,
        SAVED_WORKSPACES_KEY,
        TAB_WORK_STATES_KEY
      ]);
    } catch {
      stored = {};
    }
  }
  const fallbackGoal = inferWorkspaceGoalTextFromLocalWork(latestRun, stored) || inferWorkspaceGoalTextFromRun(latestRun);
  const goalText = explicitGoal || fallbackGoal;

  if (!goalText) {
    renderChatPanel({
      status: "info",
      answer: msg("workspaceGoalNoSuggestion")
    });
    return;
  }

  await saveWorkspaceGoal(goalText, explicitGoal ? "user" : "ai_triage");
}

async function saveWorkspaceGoal(goalText, source = "user") {
  const text = sanitizeWorkspaceGoalText(goalText);

  if (!text) {
    renderChatPanel({
      status: "info",
      answer: msg("workspaceGoalNoSuggestion")
    });
    return;
  }

  const now = new Date().toISOString();
  const goal = {
    text,
    source: String(source || "user").slice(0, 60),
    metadataOnly: source !== "user",
    createdAt: now,
    updatedAt: now
  };

  await chrome.storage.local.set({ [WORKSPACE_GOAL_KEY]: goal });
  renderChatPanel({
    status: "workspace-goal",
    answer: buildWorkspaceGoalSavedMarkdown(goal),
    goal
  });
}

async function clearWorkspaceGoal() {
  await chrome.storage.local.remove(WORKSPACE_GOAL_KEY);
  renderChatPanel({
    status: "workspace-goal",
    answer: msg("workspaceGoalCleared")
  });
}

async function buildWorkspaceGoalAnswer() {
  const stored = await chrome.storage.local.get(WORKSPACE_GOAL_KEY);
  const goal = normalizeWorkspaceGoal(stored[WORKSPACE_GOAL_KEY]);

  if (!goal?.text) {
    const stored = await chrome.storage.local.get([
      AGENT_TASKS_KEY,
      SAVED_COLLECTIONS_KEY,
      SAVED_MEMOS_KEY,
      SAVED_WORKSPACES_KEY,
      TAB_WORK_STATES_KEY
    ]);
    const inferred = inferWorkspaceGoalTextFromLocalWork(latestRun, stored) || inferWorkspaceGoalTextFromRun(latestRun);
    return inferred
      ? [msg("workspaceGoalInferredLocal", [inferred]), "", msg("workspaceGoalBoundary")].join("\n")
      : msg("workspaceGoalEmpty");
  }

  return [
    msg("workspaceGoalCurrent", [goal.text]),
    "",
    msg("workspaceGoalBoundary")
  ].join("\n");
}

function buildWorkspaceGoalSavedMarkdown(goal = {}) {
  return [
    msg("workspaceGoalSaved", [goal.text || msg("currentWorkspace")]),
    "",
    msg("workspaceGoalBoundary")
  ].join("\n");
}

function extractWorkspaceGoalText(text = "") {
  const raw = String(text || "").trim();
  const patterns = [
    /\b(?:set|save|update|change)\b.{0,30}\b(?:workspace\s+)?goal\b\s*(?:to|as|is|=|:)?\s*(.+)$/i,
    /\b(?:my|current|workspace)\s+goal\s+(?:is|=|should be)\s+(.+)$/i,
    /(?:设置|保存|更新|修改).{0,20}(?:工作目标|workspace goal|目标).{0,10}(?:为|是|:|：)?\s*(.+)$/i,
    /(?:当前|我的).{0,10}(?:工作目标|目标).{0,10}(?:是|为)\s*(.+)$/i
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return sanitizeWorkspaceGoalText(match[1]);
  }

  return "";
}

function inferWorkspaceGoalTextFromRun(run) {
  const triage = buildLocalAITriage(run);
  const focus = String(triage.workspaceFocus || "").replace(/^continue\s+/i, "").trim();

  if (focus) return sanitizeWorkspaceGoalText(focus);

  const group = pickWorkBriefGroup(Array.isArray(run?.groups) ? run.groups : [], getSnapshotTabs(run));
  if (group?.name) return sanitizeWorkspaceGoalText(group.name);

  return "";
}

function inferWorkspaceGoalTextFromLocalWork(run, stored = {}) {
  const candidates = [];

  normalizeBrowserWorkTasks(stored[AGENT_TASKS_KEY])
    .filter((task) => task.status !== "done" && task.status !== "archived")
    .sort(sortBrowserWorkByUpdatedAt)
    .slice(0, 8)
    .forEach((task, index) => {
      addWorkspaceGoalCandidate(candidates, {
        text: task.title,
        weight: 12 - index * 0.8,
        updatedAt: task.updatedAt || task.createdAt,
        context: summarizeBrowserWorkLinkedContext(task),
        linkedTabs: getBrowserWorkItemTabs(task).length,
        checklistCount: Array.isArray(task.checklist) ? task.checklist.filter(Boolean).length : 0
      });
    });

  normalizeBrowserWorkMemos(stored[SAVED_MEMOS_KEY])
    .sort(sortBrowserWorkByUpdatedAt)
    .slice(0, 8)
    .forEach((memo, index) => {
      addWorkspaceGoalCandidate(candidates, {
        text: memo.title,
        weight: 8 - index * 0.5,
        updatedAt: memo.updatedAt || memo.createdAt,
        context: summarizeBrowserWorkLinkedContext(memo)
      });
    });

  normalizeBrowserWorkCollections(stored[SAVED_COLLECTIONS_KEY])
    .sort(sortBrowserWorkByUpdatedAt)
    .slice(0, 8)
    .forEach((collection, index) => {
      addWorkspaceGoalCandidate(candidates, {
        text: collection.name,
        weight: 7 - index * 0.5,
        updatedAt: collection.updatedAt || collection.createdAt,
        context: summarizeBrowserWorkLinkedContext(collection)
      });
    });

  normalizeBrowserWorkWorkspaces(stored[SAVED_WORKSPACES_KEY])
    .sort(sortBrowserWorkByUpdatedAt)
    .slice(0, 5)
    .forEach((workspace, index) => {
      addWorkspaceGoalCandidate(candidates, {
        text: workspace.name,
        weight: 6 - index * 0.4,
        updatedAt: workspace.updatedAt || workspace.createdAt,
        context: summarizeBrowserWorkWorkspace(workspace)
      });
    });

  normalizeBrowserWorkTabStates(stored[TAB_WORK_STATES_KEY])
    .filter((entry) => entry.state === "later")
    .sort(sortBrowserWorkByUpdatedAt)
    .slice(0, 5)
    .forEach((entry, index) => {
      addWorkspaceGoalCandidate(candidates, {
        text: entry.title || entry.hostname,
        weight: 4 - index * 0.3,
        updatedAt: entry.updatedAt,
        context: [entry.hostname, entry.path].filter(Boolean).join(" ")
      });
    });

  const triageGoal = inferWorkspaceGoalTextFromRun(run);
  if (triageGoal) {
    addWorkspaceGoalCandidate(candidates, {
      text: triageGoal,
      weight: 5,
      context: "latest organize triage"
    });
  }

  return pickWorkspaceGoalCandidate(candidates);
}

function addWorkspaceGoalCandidate(candidates, candidate = {}) {
  const text = sanitizeInferredWorkspaceGoalText(candidate.text || "");
  if (!text) return;

  candidates.push({
    text,
    weight: Number(candidate.weight || 0),
    updatedAt: candidate.updatedAt || "",
    context: String(candidate.context || "").slice(0, 500),
    linkedTabs: Number(candidate.linkedTabs || 0),
    checklistCount: Number(candidate.checklistCount || 0)
  });
}

function pickWorkspaceGoalCandidate(candidates = []) {
  const scored = (Array.isArray(candidates) ? candidates : [])
    .map((candidate) => {
      const titleTokens = tokenizeBrowserWorkQuery(candidate.text);
      const contextTokens = tokenizeBrowserWorkQuery(candidate.context);
      const contextOverlap = titleTokens.filter((token) => contextTokens.includes(token)).length;
      const recencyTime = Date.parse(candidate.updatedAt || "") || 0;
      const recencyBonus = recencyTime ? Math.min(2, Math.max(0, (Date.now() - recencyTime) / (1000 * 60 * 60 * 24 * 14))) : 0;
      const score =
        candidate.weight +
        contextOverlap * 0.8 +
        Math.min(2, candidate.linkedTabs * 0.4) +
        Math.min(1.5, candidate.checklistCount * 0.25) -
        recencyBonus;

      return { ...candidate, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || sortBrowserWorkByUpdatedAt(a, b));

  return scored[0]?.text || "";
}

function sanitizeInferredWorkspaceGoalText(value = "") {
  const text = sanitizeWorkspaceGoalText(value)
    .replace(/^(goal|todo|task|memo|collection|workspace)\s*[:：-]\s*/i, "")
    .replace(/^(review\s+)?(research|decision)\s+brief\s*[:：-]\s*/i, "")
    .replace(/^continue\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text || isGenericWorkspaceGoalText(text)) return "";
  return text.slice(0, 120);
}

function isGenericWorkspaceGoalText(value = "") {
  const text = normalizeAgentText(value);
  return (
    !text ||
    /^(untitled|todo|task|memo|collection|workspace|saved workspace|current workspace|browser work|local work|misc|other|later|read later)$/.test(text) ||
    /^[\d\s._-]+$/.test(text)
  );
}

function normalizeWorkspaceGoal(value = {}) {
  if (!value || typeof value !== "object") return null;
  const text = sanitizeWorkspaceGoalText(value.text || value.goal || "");
  if (!text) return null;

  return {
    text,
    source: String(value.source || "user").slice(0, 60),
    metadataOnly: value.metadataOnly === true,
    createdAt: String(value.createdAt || "").slice(0, 40),
    updatedAt: String(value.updatedAt || "").slice(0, 40)
  };
}

function sanitizeWorkspaceGoalText(value = "") {
  return sanitizeRunTranscriptText(value, 140)
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.。]+$/g, "")
    .trim();
}

async function setTabWorkStateFromSidebarContext(state, text) {
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
        answer: msg("agentTabStateNoContext")
      });
      return;
    }

    const stored = await chrome.storage.local.get([TAB_WORK_STATES_KEY, AGENT_TASKS_KEY]);
    const nextStates = normalizeTabWorkStates(stored[TAB_WORK_STATES_KEY]);
    const now = new Date().toISOString();

    tabs.forEach((tab) => {
      nextStates[String(tab.id)] = {
        state,
        tabId: tab.id,
        title: tab.title,
        hostname: tab.hostname,
        path: tab.path,
        source: "sidebar_agent",
        updatedAt: now
      };
    });

    const updates = { [TAB_WORK_STATES_KEY]: nextStates };

    if (state === "later") {
      const task = buildSidebarLaterTask(tabs, text, context, now);
      const existingTasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];
      updates[AGENT_TASKS_KEY] = [task, ...existingTasks].slice(0, MAX_AGENT_ITEMS);
    }

    await chrome.storage.local.set(updates);

    renderChatPanel({
      status: "todo-created",
      answer: buildTabWorkStateMarkdown(tabs.length, state)
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

async function previewTabWorkStateCommand(state, text) {
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
        answer: msg("agentTabStateNoContext")
      });
      return;
    }

    const draft = buildTabWorkStateDraft(state, text, tabs, context);
    latestChatDraft = draft;
    await chrome.storage.local.set({ [CHAT_DRAFT_KEY]: draft });
    renderChatPanel(draft);
  } catch (error) {
    renderChatPanel({
      status: "error",
      answer: error?.message || msg("couldNotBuildSafeAction")
    });
  } finally {
    setBusy(false);
  }
}

function buildTabWorkStateDraft(state, text, tabs, context = {}) {
  const now = new Date().toISOString();
  const tabLabel = formatTabCountLabel(tabs.length);
  const stateLabel = formatTabWorkStateForDraft(state, text);
  const laterNote = state === "later" ? `\n\n- ${msg("tabStateDraftLaterNote")}` : "";

  return {
    id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "tab_state",
    status: "safe-command",
    state,
    instruction: sanitizeTodoSourcePrompt(text),
    contextScope: context.scope,
    createdAt: now,
    tabIds: tabs.map((tab) => tab.id).filter(Number.isInteger),
    tabs,
    matchedTabCount: tabs.length,
    displayStateLabel: stateLabel,
    answer: [
      msg("tabStateDraftAnswer", [tabLabel, stateLabel]),
      laterNote,
      "",
      `- ${msg("tabStateDraftLocalOnly")}`
    ].join("\n"),
    actionSummary: msg("tabStateDraftAction", [tabLabel, stateLabel]),
    risk: msg("tabStateDraftRisk")
  };
}

function formatTabWorkStateForDraft(state, text) {
  const normalized = normalizeAgentText(text);
  if (state === "keep" && (/\bprotect|protected|important\b/.test(normalized) || /保护|重要/.test(String(text || "")))) {
    return msg("tabStateProtected");
  }
  return formatTabWorkState(state);
}

function formatTabCountLabel(tabCount) {
  return tabCount === 1 ? "1 tab" : msg("tabsCount", [tabCount]);
}

function buildSidebarLaterTask(tabs, text, context = {}, now = new Date().toISOString()) {
  return {
    id: `task-${Date.now()}`,
    title: buildSidebarTodoTitle(tabs, context),
    status: "open",
    source: "tab_work_state_later",
    sourcePrompt: sanitizeTodoSourcePrompt(text),
    contextScope: context.scope,
    createdAt: now,
    updatedAt: now,
    tabIds: tabs.map((tab) => tab.id).filter(Number.isInteger),
    tabs
  };
}

function buildTabWorkStateMarkdown(tabCount, state) {
  const tabLabel = formatTabCountLabel(tabCount);

  return [
    msg("agentTabStateUpdated", [state === "later" ? "Saved" : "Marked", tabLabel, formatTabWorkState(state)]),
    "",
    msg("agentTabStateStoredLocally")
  ].join("\n");
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

function formatTabWorkState(state) {
  if (state === "done") return msg("tabStateDone");
  if (state === "later") return msg("tabStateLater");
  if (state === "keep") return msg("tabStateKeep");
  return "";
}

function sanitizeTodoSourcePrompt(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

async function summarizeCurrentTab(question = "", options = {}) {
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

  const response = await requestCurrentTabSummary(confirmedSensitiveTabId, question, options);
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

    const retryResponse = await requestCurrentTabSummary(retryConfirmedTabId, question, options);
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

function requestCurrentTabSummary(confirmedSensitiveTabId, question = "", options = {}) {
  return chrome.runtime.sendMessage({
    type: "SUMMARIZE_CURRENT_TAB",
    activeWindowId: getCurrentContextWindowId(),
    confirmedSensitiveTabId: confirmedSensitiveTabId || null,
    question: question || "",
    workflow: options.workflow || "",
    pageConversationHistory: buildPageChatHistory()
  });
}

async function summarizeSelectedText(question = "", options = {}) {
  appendChatMessage({
    role: "assistant",
    status: "tool-card",
    html: renderToolCard(buildSelectedTextToolCard("running")),
    text: "",
    includeInAIAgentContext: false
  });

  setBusy(true);
  renderSummary({
    status: "loading",
    title: msg("readingSelectedText"),
    question,
    summary: msg("readingSelectedTextCopy")
  });

  const privacyResponse = await chrome.runtime.sendMessage({
    type: "CHECK_SUMMARY_PRIVACY",
    activeWindowId: getCurrentContextWindowId()
  });

  if (!privacyResponse?.ok) {
    setBusy(false);
    updateLatestToolCard(buildSelectedTextToolCard("error", 0, 1, ["privacy_check_failed"]));
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
    updateLatestToolCard(buildSelectedTextToolCard("cancelled", 0, 1, ["cancelled"]));
    renderSummary({
      status: "unreadable",
      title: msg("summaryCancelledTitle"),
      question,
      summary: msg("summaryCancelledCopy")
    });
    return;
  }

  let response;

  try {
    response = await requestSelectedTextSummary(confirmedSensitiveTabId, question, options);
  } catch (error) {
    response = {
      ok: false,
      error: error?.message || msg("pageCouldNotBeRead")
    };
  } finally {
    setBusy(false);
  }

  if (response?.ok) {
    const isCompleted = response.summary?.status === "completed";
    updateLatestToolCard(
      response.summary?.toolCard ||
        buildSelectedTextToolCard(isCompleted ? "completed" : "error", isCompleted ? 1 : 0, isCompleted ? 0 : 1, isCompleted ? [] : ["unreadable"])
    );
    renderSummary(response.summary);
  } else {
    updateLatestToolCard(buildSelectedTextToolCard("error", 0, 1, ["unreadable"]));
    renderSummary({
      status: "error",
      title: msg("couldNotSummarizeTitle"),
      question,
      summary: response?.error || msg("pageCouldNotBeRead")
    });
  }
}

function requestSelectedTextSummary(confirmedSensitiveTabId, question = "", options = {}) {
  return chrome.runtime.sendMessage({
    type: "SUMMARIZE_SELECTED_TEXT",
    activeWindowId: getCurrentContextWindowId(),
    confirmedSensitiveTabId: confirmedSensitiveTabId || null,
    question: question || "",
    workflow: options.workflow || "",
    pageConversationHistory: buildPageChatHistory()
  });
}

async function summarizeSelectedPageRegion(question = "", options = {}) {
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
    response = await requestPageRegionSummary(confirmedSensitiveTabId, question, options);
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
      response = await requestPageRegionSummary(retryConfirmedTabId, question, options);
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

function requestPageRegionSummary(confirmedSensitiveTabId, question = "", options = {}) {
  return chrome.runtime.sendMessage({
    type: "SUMMARIZE_PAGE_REGION",
    activeWindowId: getCurrentContextWindowId(),
    confirmedSensitiveTabId: confirmedSensitiveTabId || null,
    question: question || "",
    workflow: options.workflow || "",
    pageConversationHistory: buildPageChatHistory()
  });
}

async function summarizeVisibleScreenshot(question = "", options = {}) {
  appendChatMessage({
    role: "assistant",
    status: "tool-card",
    html: renderToolCard(buildVisibleScreenshotToolCard("running")),
    text: "",
    includeInAIAgentContext: false
  });

  setBusy(true);
  renderSummary({
    status: "loading",
    title: msg("capturingVisibleScreenshot"),
    question,
    summary: msg("capturingVisibleScreenshotCopy")
  });

  const privacyResponse = await chrome.runtime.sendMessage({
    type: "CHECK_SUMMARY_PRIVACY",
    activeWindowId: getCurrentContextWindowId()
  });

  if (!privacyResponse?.ok) {
    setBusy(false);
    updateLatestToolCard(buildVisibleScreenshotToolCard("error", 0, 1, ["privacy_check_failed"]));
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
    updateLatestToolCard(buildVisibleScreenshotToolCard("cancelled", 0, 1, ["cancelled"]));
    renderSummary({
      status: "unreadable",
      title: msg("summaryCancelledTitle"),
      question,
      summary: msg("summaryCancelledCopy")
    });
    return;
  }

  let response;

  try {
    response = await requestVisibleScreenshotSummary(confirmedSensitiveTabId, question, options);
  } catch (error) {
    response = {
      ok: false,
      error: error?.message || msg("pageCouldNotBeRead")
    };
  } finally {
    setBusy(false);
  }

  if (response?.ok) {
    updateLatestToolCard(response.summary?.toolCard);
    renderSummary(response.summary);
  } else {
    updateLatestToolCard(buildVisibleScreenshotToolCard("error", 0, 1, ["unreadable"]));
    renderSummary({
      status: "error",
      title: msg("couldNotSummarizeTitle"),
      question,
      summary: response?.error || msg("pageCouldNotBeRead")
    });
  }
}

function requestVisibleScreenshotSummary(confirmedSensitiveTabId, question = "", options = {}) {
  return chrome.runtime.sendMessage({
    type: "SUMMARIZE_VISIBLE_SCREENSHOT",
    activeWindowId: getCurrentContextWindowId(),
    confirmedSensitiveTabId: confirmedSensitiveTabId || null,
    question: question || "",
    workflow: options.workflow || "",
    pageConversationHistory: buildPageChatHistory()
  });
}

function buildSelectedTextToolCard(status = "running", readCount = 0, skippedCount = 0, skippedReasons = []) {
  const toolPermissions = ["read_selected_text_after_user_request"];
  const blockedActions = ["read_full_page", "auto_submit", "mutate_page", "full_url_upload", "cloud_storage"];

  return {
    toolName: "extract_selected_text",
    label: msg("toolCardSelectedText"),
    scope: {
      type: "selected_text",
      requestedTabCount: 1,
      readTabCount: readCount,
      skippedTabCount: skippedCount,
      maxTabs: 1
    },
    dataUsed: ["selected_text"],
    storage: "session_only",
    toolPermissions,
    toolPermissionLabels: formatToolPermissionLabels(toolPermissions),
    blockedActions,
    blockedActionLabels: formatBlockedActionLabels(blockedActions),
    security: {
      pageTextTrusted: false
    },
    status,
    skippedReasons
  };
}

function buildVisibleScreenshotToolCard(status = "running", readCount = 0, skippedCount = 0, skippedReasons = []) {
  const toolPermissions = ["capture_visible_screenshot_after_user_click"];
  const blockedActions = ["auto_submit", "mutate_page", "insert_text", "web_search", "full_url_upload", "cloud_storage"];

  return {
    toolName: "analyze_visible_screenshot",
    label: msg("toolCardVisibleScreenshot"),
    scope: {
      type: "visible_screenshot",
      requestedTabCount: 1,
      readTabCount: readCount,
      skippedTabCount: skippedCount,
      maxTabs: 1
    },
    dataUsed: ["visible_screenshot_image", "tab_title", "hostname"],
    storage: "session_only",
    toolPermissions,
    toolPermissionLabels: formatToolPermissionLabels(toolPermissions),
    blockedActions,
    blockedActionLabels: formatBlockedActionLabels(blockedActions),
    security: {
      pageTextTrusted: false
    },
    status,
    skippedReasons
  };
}

function buildPageRegionToolCard(status = "running", readCount = 0, skippedCount = 0, skippedReasons = [], includesImageData = false) {
  const toolPermissions = [
    "read_selected_page_region_after_user_click",
    ...(includesImageData ? ["capture_selected_region_screenshot_after_user_click"] : [])
  ];
  const blockedActions = ["auto_fill", "auto_submit", "mutate_page", "background_crawl", "web_search", "full_url_upload", "cloud_storage"];

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
    dataUsed: [
      "selected_region_visible_text",
      "structure",
      includesImageData ? "cropped_region_image" : "cropped_screenshot_metadata"
    ],
    storage: "session_only",
    toolPermissions,
    toolPermissionLabels: formatToolPermissionLabels(toolPermissions),
    blockedActions,
    blockedActionLabels: formatBlockedActionLabels(blockedActions),
    security: {
      pageTextTrusted: false
    },
    status,
    skippedReasons
  };
}

function buildWebSearchToolCard(query = "", status = "needs-provider", resultCount = 0) {
  const toolPermissions = ["search_web_provider_after_user_click"];
  const blockedActions = ["read_page_text", "full_url_upload", "cloud_storage"];

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
    toolPermissions,
    toolPermissionLabels: formatToolPermissionLabels(toolPermissions),
    blockedActions,
    blockedActionLabels: formatBlockedActionLabels(blockedActions),
    security: {
      pageTextTrusted: false
    },
    status,
    skippedReasons: status === "needs-provider" ? ["provider_not_configured"] : []
  };
}

function buildContextTabsRunningToolCard(context = {}) {
  const scopeType = context.scope === "selected_tabs" ? "selected_tabs" : "current_group";
  const toolPermissions = ["read_selected_tabs_pages_after_site_access"];
  const blockedActions = ["read_unselected_tabs", "close_tabs", "auto_submit", "mutate_page", "cloud_storage"];

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
    toolPermissions,
    toolPermissionLabels: formatToolPermissionLabels(toolPermissions),
    blockedActions,
    blockedActionLabels: formatBlockedActionLabels(blockedActions),
    security: {
      pageTextTrusted: false
    },
    status: "running",
    skippedReasons: []
  };
}

async function summarizeContextTabs(question = "", options = {}) {
  const context = getAIAgentContextPayload();
  const workflow = normalizeContextTabsWorkflow(options.workflow, question);

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
      workflow,
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
    rememberCompareTabsResult(response.summary, context);
    rememberResearchBriefResult(response.summary, context);
    rememberDecisionBriefResult(response.summary, context);
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

async function draftFromSavedSources(question = "", options = {}) {
  const workflow = normalizeSavedSourcesWorkflow(options.workflow, question);
  const sources = await collectSavedSourcesForWriting(question);

  if (!sources.length) {
    renderChatPanel({
      status: "info",
      answer: msg("savedSourcesNoSources")
    });
    return;
  }

  setBusy(true);
  renderChatPanel({
    status: "loading",
    answer: workflow === "decision_brief"
      ? msg("decidingFromSavedSources")
      : workflow === "research_brief"
        ? msg("researchingSavedSources")
        : msg("draftingFromSavedSources")
  });

  let response;
  try {
    response = await chrome.runtime.sendMessage({
      type: "DRAFT_FROM_SAVED_SOURCES",
      question: buildSavedSourcesQuestion(question, workflow),
      sources,
      workflow
    });
  } catch (error) {
    response = {
      ok: false,
      error: error?.message || msg("couldNotBuildSafeAction")
    };
  } finally {
    setBusy(false);
  }

  if (response?.ok) {
    if (isDecisionBriefSummary(response.summary)) {
      rememberDecisionBriefResult(response.summary, response.summary?.context || {
        scope: "saved_sources",
        title: msg("sourceSavedSources"),
        tabCount: sources.length
      });
    }

    if (isResearchBriefSummary(response.summary)) {
      rememberResearchBriefResult(response.summary, response.summary?.context || {
        scope: "saved_sources",
        title: msg("sourceSavedSources"),
        tabCount: sources.length
      });
    }

    renderChatPanel({
      status: "summary",
      summary: response.summary
    });
    return;
  }

  renderChatPanel({
    status: "error",
    answer: response?.error || msg("couldNotBuildSafeAction")
  });
}

async function draftDecisionFromSearchResults(question = "") {
  const sources = collectSearchResultsForDecisionBrief();

  if (!sources.length) {
    renderChatPanel({
      status: "info",
      answer: msg("searchResultsNoSources")
    });
    return;
  }

  setBusy(true);
  renderChatPanel({
    status: "loading",
    answer: msg("decidingFromSearchResults")
  });

  let response;
  try {
    response = await chrome.runtime.sendMessage({
      type: "DRAFT_FROM_SEARCH_RESULTS",
      question: buildSearchResultsDecisionQuestion(question),
      sources,
      workflow: "decision_brief"
    });
  } catch (error) {
    response = {
      ok: false,
      error: error?.message || msg("couldNotBuildSafeAction")
    };
  } finally {
    setBusy(false);
  }

  if (response?.ok) {
    if (isDecisionBriefSummary(response.summary)) {
      rememberDecisionBriefResult(response.summary, response.summary?.context || {
        scope: "search_results",
        title: msg("sourceSearchResults"),
        tabCount: sources.length
      });
    }

    renderChatPanel({
      status: "summary",
      summary: response.summary
    });
    return;
  }

  renderChatPanel({
    status: "error",
    answer: response?.error || msg("couldNotBuildSafeAction")
  });
}

function collectSearchResultsForDecisionBrief() {
  return (Array.isArray(latestWebSearchResults) ? latestWebSearchResults : [])
    .filter((result) => result?.title || result?.hostname || result?.snippet)
    .slice(0, 5)
    .map((result, index) => ({
      sourceId: `search-result-${index + 1}`,
      type: "search_result",
      title: cleanMarkdownLine(result.title || result.hostname || msg("webSearchResult")).slice(0, 180),
      hostname: cleanMarkdownLine(result.hostname || "").slice(0, 120),
      path: sanitizeBrowserWorkPath(result.path || ""),
      tags: ["search-result"],
      snippet: cleanMarkdownLine(result.snippet || "").slice(0, 320),
      sourceNotes: [
        [result.title, result.hostname].filter(Boolean).join(" · ")
      ].filter(Boolean)
    }));
}

function buildSearchResultsDecisionQuestion(text = "") {
  const userIntent = String(text || "").replace(/\s+/g, " ").trim().slice(0, 240);
  return [
    "Create a decision brief from the current session search results.",
    userIntent ? `User request: ${userIntent}.` : "",
    "Return a recommendation, decision criteria, source tradeoffs, assumptions, missing information, next steps, and source notes. Do not read selected tabs, open result pages, run additional search, upload full URLs, parse files/PDFs/screenshots, mutate pages, move tabs, close tabs, or claim any action was taken."
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 620);
}

function normalizeSavedSourcesWorkflow(value, question = "") {
  const workflow = String(value || "").trim().toLowerCase().replace(/[-\s]+/g, "_");
  if (workflow === "decision_brief") return "decision_brief";
  if (workflow === "research_brief") return "research_brief";
  if (workflow === "contextual_writing") return "contextual_writing";

  const text = normalizeAgentText(question || value || "");
  if (
    /\b(decision\s+brief|decision\s+memo|recommend\s+a\s+path|recommendation\s+brief|make\s+a\s+decision|decide\s+(between|which|what)|what\s+should\s+we\s+choose)\b/.test(text) ||
    /(决策简报|决策备忘|决策建议|推荐路径|怎么决策|应该选哪个|应该选择|怎么选)/.test(text)
  ) {
    return "decision_brief";
  }

  if (
    /\b(research\s+brief|research\s+report|source\s+synthesis|synthesize|findings\s+and\s+gaps|research\s+summary)\b/.test(text) ||
    /(调研简报|研究简报|研究报告|资料综合|综合这些|发现和缺口|结论和缺口)/.test(text)
  ) {
    return "research_brief";
  }

  return "contextual_writing";
}

function buildSavedSourcesQuestion(text = "", workflow = "contextual_writing") {
  const normalizedWorkflow = normalizeSavedSourcesWorkflow(workflow, text);
  if (normalizedWorkflow === "decision_brief") return buildSavedSourcesDecisionQuestion(text);
  if (normalizedWorkflow === "research_brief") return buildSavedSourcesResearchQuestion(text);
  return buildSavedSourcesWritingQuestion(text);
}

function buildSavedSourcesWritingQuestion(text = "") {
  const userIntent = String(text || "").replace(/\s+/g, " ").trim().slice(0, 240);
  return [
    "Draft copy-only text from saved local sources.",
    userIntent ? `User request: ${userIntent}.` : "",
    "Return a ready-to-copy draft, a short purpose, audience/tone if inferable, and caveats or missing facts. Do not read live pages, search the web, insert text, submit forms, send messages, mutate pages, move tabs, close tabs, or claim any action was taken."
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 560);
}

function buildSavedSourcesResearchQuestion(text = "") {
  const userIntent = String(text || "").replace(/\s+/g, " ").trim().slice(0, 240);
  return [
    "Create a research brief from saved local sources.",
    userIntent ? `User request: ${userIntent}.` : "",
    "Return grounded findings, contradictions, gaps, next steps, and source notes. Do not read live pages, search the web, parse files/PDFs/screenshots, mutate pages, move tabs, close tabs, or claim any action was taken."
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 620);
}

function buildSavedSourcesDecisionQuestion(text = "") {
  const userIntent = String(text || "").replace(/\s+/g, " ").trim().slice(0, 240);
  return [
    "Create a decision brief from saved local sources.",
    userIntent ? `User request: ${userIntent}.` : "",
    "Return a recommendation, decision criteria, source tradeoffs, assumptions, missing information, next steps, and source notes. Do not read live pages, search the web, parse files/PDFs/screenshots, mutate pages, move tabs, close tabs, or claim any action was taken."
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 660);
}

function normalizeContextTabsWorkflow(value, question = "") {
  const workflow = String(value || "").trim().toLowerCase().replace(/[-\s]+/g, "_");

  if (workflow === "compare_selected_tabs") return "compare_selected_tabs";
  if (workflow === "decision_brief") return "decision_brief";
  if (workflow === "research_brief") return "research_brief";
  if (workflow === "contextual_writing") return "contextual_writing";

  const text = String(question || value || "").toLowerCase();
  if (
    /\b(decision\s+brief|decision\s+memo|decision\s+artifact|recommend\s+a\s+path|recommendation\s+brief|make\s+a\s+decision|decide\s+(between|which|what)|what\s+should\s+we\s+choose)\b/.test(text) ||
    /(决策简报|决策备忘|决策建议|推荐路径|怎么决策|应该选哪个|应该选择|怎么选)/.test(text)
  ) {
    return "decision_brief";
  }

  if (
    /\b(research\s+brief|research\s+report|deep\s+research|synthesize\s+(these|this)|research\s+summary|source\s+synthesis|findings\s+and\s+gaps)\b/.test(text) ||
    /(调研简报|研究简报|深度研究|研究报告|综合这些|综合一下|资料综合|结论和缺口|发现和缺口)/.test(text)
  ) {
    return "research_brief";
  }

  if (
    /\b(compare|comparison|versus|vs\.?|tradeoffs?|pros and cons|which option|which one|best option|decision table|contradictions?)\b/.test(text) ||
    /(对比|比较|取舍|权衡|哪个更好|哪一个|决策表|矛盾|冲突)/.test(text)
  ) {
    return "compare_selected_tabs";
  }

  if (
    /\b(draft|write|compose|prepare)\b.{0,80}\b(email|message|reply|response|comment|update|status|memo|note|report|post|copy)\b/.test(text) ||
    /\b(email|message|reply|response|comment|update|status|memo|note|report|post)\b.{0,80}\b(from|based on|using|with)\b.{0,80}\b(tabs?|pages?|sources?|group|context)\b/.test(text) ||
    /(?:起草|草拟|写|生成|撰写).{0,50}(?:邮件|消息|回复|评论|更新|进展|备忘|笔记|报告|文案)/.test(text)
  ) {
    return "contextual_writing";
  }

  return "general_qa";
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

function renderComposerPicker(mode = composerPickerMode) {
  if (!composerPicker) return;

  composerPickerMode = mode;
  composerPicker.dataset.trigger = composerPickerTrigger;
  composerPicker.dataset.mode = mode;
  if (mode === "templates") {
    renderComposerTemplatePicker();
    return;
  }

  const hasContextTabsScope = hasComposerContextTabsScope();
  const items = filterComposerPickerItems(
    COMPOSER_PICKER_ITEMS.filter((item) => !item.requiresContextTabs || hasContextTabsScope)
  );
  composerPicker.innerHTML = `
    ${renderComposerPickerHeader()}
    ${renderComposerRouterHint()}
    <div class="composer-picker-grid" role="menu">
      ${items.map((item) => {
        return `
          <button
            class="composer-picker-item"
            type="button"
            role="menuitem"
            data-picker-action="${escapeHtml(item.action)}"
          >
            <strong>${escapeHtml(msg(item.labelKey))}</strong>
            <span>${escapeHtml(msg(item.descriptionKey))}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderComposerRouterHint() {
  const route = buildComposerModelRouteHint(chatInput?.value || "");

  return `
    <section class="composer-router-hint" aria-label="${escapeHtml(msg("modelRouterHintAria"))}">
      <span>${escapeHtml(msg("modelRouterHintLabel"))}</span>
      <strong>${escapeHtml(route.route)}</strong>
      <small>${escapeHtml(route.copy)}</small>
    </section>
  `;
}

function buildComposerModelRouteHint(text = "") {
  const normalized = normalizeAgentText(text);
  const context = normalizeSidebarContext(activeSidebarContext) || { scope: "current_tab" };

  if (shouldRouteAgentWebSearch(text)) {
    return {
      route: msg("modelRouteSearchTool"),
      copy: msg("modelRouteSearchToolCopy")
    };
  }

  if (isPageRegionCommand(normalized) || isSmartFillCommand(normalized)) {
    return {
      route: msg("modelRoutePageRegion"),
      copy: msg("modelRoutePageRegionCopy")
    };
  }

  if (isVisibleScreenshotIntent(normalized)) {
    return {
      route: msg("modelRouteVision"),
      copy: msg("modelRouteVisionCopy")
    };
  }

  if (isSelectedTextIntent(normalized)) {
    return {
      route: msg("modelRouteSelectedText"),
      copy: msg("modelRouteSelectedTextCopy")
    };
  }

  if (hasComposerContextTabsScope() && (isContextTabsWritingCommand(normalized) || shouldRouteContextTabsQuestion(text) || shouldRouteContextTabsRegroupQuestion(text))) {
    return {
      route: context.scope === "current_group" ? msg("modelRouteCurrentGroup") : msg("modelRouteSelectedTabs"),
      copy: msg("modelRouteContextTabsCopy")
    };
  }

  if (shouldRouteCurrentPageQuestion(text) || context.scope === "current_tab") {
    return {
      route: msg("modelRoutePageAgent"),
      copy: msg("modelRoutePageAgentCopy")
    };
  }

  return {
    route: msg("modelRouteMetadata"),
    copy: msg("modelRouteMetadataCopy")
  };
}

function renderComposerTemplatePicker() {
  const hasContextTabsScope = hasComposerContextTabsScope();
  const items = filterComposerPickerItems(
    COMPOSER_TEMPLATE_ITEMS.filter((item) => !item.requiresContextTabs || hasContextTabsScope)
  );
  composerPicker.innerHTML = `
    <div class="composer-picker-header">
      <button class="composer-picker-back" type="button" data-picker-action="tools">${escapeHtml(msg("pickerBackToTools"))}</button>
      <strong>${escapeHtml(msg("pickerTemplates"))}</strong>
    </div>
    <div class="composer-picker-grid" role="menu">
      ${items.map((item) => {
        return `
          <button
            class="composer-picker-item"
            type="button"
            role="menuitem"
            data-template-id="${escapeHtml(item.id)}"
          >
            <strong>${escapeHtml(msg(item.labelKey))}</strong>
            <span>${escapeHtml(msg(item.descriptionKey))}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function filterComposerPickerItems(items = []) {
  const query = composerPickerTrigger === "mention" ? composerMentionQuery.trim().toLowerCase() : "";
  if (!query) return items;

  return items.filter((item) => {
    const haystack = [
      item.action || "",
      item.id || "",
      msg(item.labelKey) || "",
      msg(item.descriptionKey) || ""
    ].join(" ").toLowerCase();

    return haystack.includes(query);
  });
}

function renderComposerPickerHeader() {
  if (composerPickerTrigger !== "mention") return "";

  return `
    <div class="composer-picker-header mention">
      <strong>${escapeHtml(msg("pickerMentionTitle"))}</strong>
    </div>
  `;
}

function hasComposerContextTabsScope() {
  const scope = activeSidebarContext?.scope;
  const tabCount = Number(activeSidebarContext?.tabCount || activeSidebarContext?.tabIds?.length || 0);

  return (
    (scope === "selected_tabs" && tabCount > 0) ||
    (scope === "current_group" && (tabCount > 0 || Number.isInteger(activeSidebarContext?.groupId)))
  );
}

function toggleComposerPicker(event) {
  event?.preventDefault();
  if (!composerPicker || pageRegionButton?.disabled) return;

  if (composerPicker.hidden) {
    openComposerPicker("button");
  } else {
    hideComposerPicker();
  }
}

function openComposerPicker(trigger = "button") {
  if (!composerPicker) return;

  composerPickerTrigger = trigger;
  if (trigger !== "mention") {
    composerMentionRange = null;
    composerMentionQuery = "";
  }

  renderComposerPicker("tools");
  composerPicker.hidden = false;
  pageRegionButton?.setAttribute("aria-expanded", "true");
}

function hideComposerPicker() {
  if (!composerPicker) return;

  composerPicker.hidden = true;
  composerPickerMode = "tools";
  composerPickerTrigger = "button";
  composerMentionRange = null;
  composerMentionQuery = "";
  pageRegionButton?.setAttribute("aria-expanded", "false");
}

function handleComposerDocumentClick(event) {
  if (!composerPicker || composerPicker.hidden) return;
  const eventPath = typeof event.composedPath === "function" ? event.composedPath() : [];
  if (agentComposerSection?.contains(event.target) || eventPath.includes(agentComposerSection)) return;

  hideComposerPicker();
}

async function handleComposerPickerClick(event) {
  const templateButton = event.target.closest("[data-template-id]");
  if (templateButton && composerPicker?.contains(templateButton)) {
    event.preventDefault();
    const templateId = templateButton.dataset.templateId || "";

    if (composerPickerTrigger === "mention") {
      applyComposerMentionTemplate(templateId);
      hideComposerPicker();
      return;
    }

    hideComposerPicker();
    await runComposerTemplate(templateId);
    return;
  }

  const button = event.target.closest("[data-picker-action]");
  if (!button || !composerPicker?.contains(button)) return;

  event.preventDefault();
  const action = button.dataset.pickerAction || "";
  if (action === "templates") {
    renderComposerPicker("templates");
    composerPicker.hidden = false;
    pageRegionButton?.setAttribute("aria-expanded", "true");
    return;
  }

  if (action === "tools") {
    renderComposerPicker("tools");
    composerPicker.hidden = false;
    pageRegionButton?.setAttribute("aria-expanded", "true");
    return;
  }

  const trigger = composerPickerTrigger;
  if (trigger === "mention") {
    applyComposerMentionAction(action);
    hideComposerPicker();
    return;
  }

  hideComposerPicker();
  await runComposerPickerAction(action);
}

async function runComposerTemplate(templateId) {
  const template = COMPOSER_TEMPLATE_ITEMS.find((item) => item.id === templateId);
  if (!template) return false;

  if (template.requiresContextTabs && !hasComposerContextTabsScope()) {
    renderChatPanel({
      status: "info",
      answer: msg("contextTabsNoContext")
    });
    return true;
  }

  const draft = chatInput.value.trim();
  const prompt = draft || msg(template.promptKey);
  latestChatDraft = null;

  if (template.route === "organize") {
    await runQuickChatCommand("organize again", msg(template.labelKey));
    clearComposer();
    return true;
  }

  if (template.route === "chat-command") {
    await runQuickChatCommand(prompt);
    clearComposer();
    return true;
  }

  if (template.route === "current-page") {
    appendUserChatMessage(prompt);
    await summarizeCurrentTab(prompt, { workflow: template.workflow || "" });
    clearComposer();
    return true;
  }

  if (template.route === "visible-screenshot") {
    appendUserChatMessage(prompt);
    await summarizeVisibleScreenshot(prompt, { workflow: template.workflow || "" });
    clearComposer();
    return true;
  }

  if (template.route === "selected-text") {
    appendUserChatMessage(prompt);
    await summarizeSelectedText(prompt, { workflow: template.workflow || "" });
    clearComposer();
    return true;
  }

  if (template.route === "page-region") {
    appendUserChatMessage(prompt);
    await summarizeSelectedPageRegion(prompt, { workflow: template.workflow || "" });
    clearComposer();
    return true;
  }

  if (template.route === "context-tabs") {
    appendUserChatMessage(prompt);
    await summarizeContextTabs(prompt, { workflow: template.workflow || "" });
    clearComposer();
    return true;
  }

  if (template.route === "todo") {
    appendUserChatMessage(prompt);
    await createTodoFromSidebarContext(prompt);
    clearComposer();
    return true;
  }

  prefillComposer(prompt);
  return true;
}

async function runComposerPickerAction(action) {
  const draft = chatInput.value.trim();

  if (action === "current-page") {
    const question = draft || msg("pickerCurrentPagePrompt");
    latestChatDraft = null;
    appendUserChatMessage(question);
    await summarizeCurrentTab(question);
    clearComposer();
    return true;
  }

  if (action === "selected-text") {
    const question = draft || msg("pickerSelectedTextPrompt");
    latestChatDraft = null;
    appendUserChatMessage(question);
    await summarizeSelectedText(question);
    clearComposer();
    return true;
  }

  if (action === "page-region") {
    await handlePageRegionButtonClick();
    return true;
  }

  if (action === "visible-screenshot") {
    const question = draft || msg("pickerVisibleScreenshotPrompt");
    latestChatDraft = null;
    appendUserChatMessage(question);
    await summarizeVisibleScreenshot(question, { workflow: getVisibleScreenshotWorkflow(question) });
    clearComposer();
    return true;
  }

  if (action === "selected-tabs") {
    if (!hasComposerContextTabsScope()) {
      renderChatPanel({
        status: "info",
        answer: msg("contextTabsNoContext")
      });
      return true;
    }

    const question = draft || msg("pickerSelectedTabsPrompt");
    latestChatDraft = null;
    appendUserChatMessage(question);
    await summarizeContextTabs(question);
    clearComposer();
    return true;
  }

  if (action === "search-web") {
    if (!draft) {
      prefillComposer(msg("pickerSearchWebPrompt"));
      return true;
    }

    const query = shouldRouteAgentWebSearch(draft) ? draft : `${msg("pickerSearchWebPrompt")}${draft}`;
    latestChatDraft = null;
    appendUserChatMessage(query);
    await runAgentWebSearch(query);
    clearComposer();
    return true;
  }

  if (action === "decision-brief") {
    if (!hasComposerContextTabsScope()) {
      renderChatPanel({
        status: "info",
        answer: msg("contextTabsNoContext")
      });
      return true;
    }

    const question = draft || msg("pickerDecisionBriefPrompt");
    latestChatDraft = null;
    appendUserChatMessage(question);
    await summarizeContextTabs(question, { workflow: "decision_brief" });
    clearComposer();
    return true;
  }

  if (action === "research-brief") {
    if (!hasComposerContextTabsScope()) {
      renderChatPanel({
        status: "info",
        answer: msg("contextTabsNoContext")
      });
      return true;
    }

    const question = draft || msg("pickerResearchBriefPrompt");
    latestChatDraft = null;
    appendUserChatMessage(question);
    await summarizeContextTabs(question, { workflow: "research_brief" });
    clearComposer();
    return true;
  }

  if (action === "save-todo") {
    const command = draft || "make this a todo";
    const displayText = draft || msg("pickerSaveTodo");
    latestChatDraft = null;
    appendUserChatMessage(displayText);
    await createTodoFromSidebarContext(command);
    clearComposer();
    return true;
  }

  return false;
}

function prefillComposer(text) {
  if (!chatInput) return;

  chatInput.value = text;
  resizeComposer();
  renderComposerContextChips();
  chatInput.focus();
  chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
}

function handleComposerInput() {
  resizeComposer();
  renderComposerContextChips();
  updateComposerMentionPicker();
}

async function runQuickChatCommand(commandText, displayText = commandText) {
  appendUserChatMessage(displayText);
  await processChatText(commandText);
}

async function previewChatRefine(event) {
  event.preventDefault();
  hideComposerPicker();
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
  if (event.key === "Escape" && !composerPicker?.hidden) {
    event.preventDefault();
    hideComposerPicker();
    return;
  }

  if (!composerPicker?.hidden && composerPickerTrigger === "mention") {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      composerPicker.querySelector("[data-picker-action], [data-template-id]")?.focus();
      return;
    }

    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      const firstItem = composerPicker.querySelector("[data-picker-action], [data-template-id]");
      if (firstItem) {
        event.preventDefault();
        firstItem.click();
        return;
      }
    }
  }

  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;

  event.preventDefault();
  chatForm.requestSubmit();
}

function updateComposerMentionPicker() {
  if (!chatInput || document.activeElement !== chatInput) return;

  const mention = findActiveComposerMention();
  if (!mention) {
    if (composerPickerTrigger === "mention" && !composerPicker?.hidden) {
      hideComposerPicker();
    }
    return;
  }

  composerMentionRange = mention.range;
  composerMentionQuery = mention.query;
  composerPickerTrigger = "mention";
  renderComposerPicker(composerPickerMode === "templates" ? "templates" : "tools");
  composerPicker.hidden = false;
  pageRegionButton?.setAttribute("aria-expanded", "true");
}

function findActiveComposerMention() {
  if (!chatInput) return null;

  const value = chatInput.value || "";
  const caret = chatInput.selectionStart ?? value.length;
  if (caret !== (chatInput.selectionEnd ?? caret)) return null;

  const before = value.slice(0, caret);
  const atIndex = before.lastIndexOf("@");
  if (atIndex < 0) return null;
  if (atIndex > 0 && !/\s/.test(before.charAt(atIndex - 1))) return null;

  const query = before.slice(atIndex + 1);
  if (/[\s@]/.test(query) || query.length > 32) return null;

  return {
    query,
    range: {
      start: atIndex,
      end: caret
    }
  };
}

function applyComposerMentionTemplate(templateId) {
  const template = COMPOSER_TEMPLATE_ITEMS.find((item) => item.id === templateId);
  if (!template) return;

  replaceActiveComposerMentionWith(msg(template.promptKey));
}

function applyComposerMentionAction(action) {
  const prompt = getComposerMentionPrompt(action);
  if (!prompt) return;

  replaceActiveComposerMentionWith(prompt);
}

function getComposerMentionPrompt(action) {
  if (action === "current-page") return msg("pickerCurrentPagePrompt");
  if (action === "selected-text") return msg("pickerSelectedTextPrompt");
  if (action === "page-region") return msg("pickerPageRegionPrompt");
  if (action === "visible-screenshot") return msg("pickerVisibleScreenshotPrompt");
  if (action === "selected-tabs") return msg("pickerSelectedTabsPrompt");
  if (action === "search-web") return msg("pickerSearchWebPrompt");
  if (action === "decision-brief") return msg("pickerDecisionBriefPrompt");
  if (action === "research-brief") return msg("pickerResearchBriefPrompt");
  if (action === "save-todo") return msg("pickerSaveTodoPrompt");
  return "";
}

function replaceActiveComposerMentionWith(text) {
  if (!chatInput) return;

  const range = composerMentionRange || findActiveComposerMention()?.range;
  const insertion = String(text || "").trimStart();
  if (!range || !insertion) {
    prefillComposer(insertion);
    return;
  }

  const value = chatInput.value || "";
  const before = value.slice(0, range.start);
  const after = value.slice(range.end);
  const prefix = before && !/\s$/.test(before) ? `${before} ` : before;
  const spacer = after && !/^\s/.test(after) && !/\s$/.test(insertion) ? " " : "";
  const nextValue = `${prefix}${insertion}${spacer}${after}`;
  const cursor = prefix.length + insertion.length;

  chatInput.value = nextValue;
  resizeComposer();
  renderComposerContextChips();
  chatInput.focus();
  chatInput.setSelectionRange(cursor, cursor);
}

function resizeComposer() {
  if (!chatInput) return;

  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 112)}px`;
}

function clearComposer() {
  chatInput.value = "";
  resizeComposer();
  renderComposerContextChips();
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

  if (shouldRouteVisibleScreenshotQuestion(text)) {
    latestChatDraft = null;
    await summarizeVisibleScreenshot(text, { workflow: getVisibleScreenshotWorkflow(text) });
    clearComposer();
    return true;
  }

  if (shouldRouteCurrentPageQuestion(text)) {
    latestChatDraft = null;
    await summarizeCurrentTab(text);
    clearComposer();
    return true;
  }

  if (shouldRouteAIAgentFollowUp(text)) {
    latestChatDraft = null;
    const handled = await askMetadataAgent(text);
    if (handled) {
      clearComposer();
      return true;
    }
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

  const workspaceChatResult = await buildWorkspaceChatResult(text, latestRun);
  if (workspaceChatResult) {
    latestChatDraft = null;
    clearComposer();
    renderChatPanel(workspaceChatResult);
    return true;
  }

  const browserWorkSearchResult = await buildBrowserWorkSearchResult(text, latestRun);
  if (browserWorkSearchResult) {
    latestChatDraft = null;
    clearComposer();
    renderChatPanel(browserWorkSearchResult);
    return true;
  }

  if (await previewChatRefineAction(text)) {
    return true;
  }

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

async function previewChatRefineAction(text, options = {}) {
  setBusy(true);
  renderChatPanel({
    status: "loading",
    answer: msg("checkingCurrentTabs")
  });

  let response;
  try {
    response = await chrome.runtime.sendMessage({
      type: "PREVIEW_CHAT_REFINE",
      text
    });
  } catch (error) {
    response = { ok: false, error: error?.message || msg("couldNotBuildSafeAction") };
  }

  setBusy(false);

  if (response?.ok) {
    latestChatDraft = response.draft;
    renderChatPanel(response.draft);
    clearComposer();
    return true;
  }

  latestChatDraft = null;

  if (options.renderErrorOnFailure) {
    renderChatPanel({
      status: "error",
      answer: response?.error || msg("couldNotBuildSafeAction")
    });
    clearComposer();
    return true;
  }

  return false;
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

function shouldRouteVisibleScreenshotQuestion(text) {
  const normalized = normalizeAgentText(text);
  if (!normalized) return false;
  return isVisibleScreenshotIntent(normalized);
}

function isVisibleScreenshotIntent(text) {
  return (
    /\b(screenshot|screen shot|visible screen|current screen|image context|vision)\b/.test(text) ||
    /\b(analy[sz]e|read|explain|summarize|describe|look at|inspect)\b.{0,60}\b(image|screenshot|screen)\b/.test(text) ||
    /(?:截图|屏幕|当前画面|视觉|图片).{0,20}(?:分析|总结|解释|看看|识别|问答)/.test(text) ||
    /(?:分析|总结|解释|看看|识别).{0,20}(?:截图|屏幕|当前画面|视觉|图片)/.test(text)
  );
}

function isScreenshotDecisionBriefIntent(text) {
  const normalized = normalizeAgentText(text);
  const decisionIntent =
    /\b(decision\s+brief|decision\s+memo|recommend\s+a\s+path|recommendation\s+brief|make\s+a\s+decision|decide\s+(between|which|what)|what\s+should\s+we\s+choose)\b/.test(normalized) ||
    /(决策简报|决策备忘|决策建议|推荐路径|怎么决策|应该选哪个|应该选择|怎么选)/.test(normalized);

  return decisionIntent && isVisibleScreenshotIntent(normalized);
}

function isScreenshotResearchBriefIntent(text) {
  const normalized = normalizeAgentText(text);
  const researchIntent =
    /\b(research\s+brief|research\s+memo|research\s+summary|research\s+this|investigate|desk\s+research|findings\s+and\s+gaps|what\s+are\s+the\s+gaps)\b/.test(normalized) ||
    /(研究简报|研究备忘|调研简报|调研一下|研究一下|发现和缺口|有什么缺口|信息缺口)/.test(normalized);

  return researchIntent && isVisibleScreenshotIntent(normalized);
}

function getVisibleScreenshotWorkflow(text) {
  if (isScreenshotResearchBriefIntent(text)) return "research_brief";
  if (isScreenshotDecisionBriefIntent(text)) return "decision_brief";
  return "";
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

async function runAgentWebSearch(text, options = {}) {
  const query = extractAgentWebSearchQuery(text);
  const researchAddendum = normalizeResearchSearchAddendumOptions(options.researchAddendum);
  const isResearchAddendum = ["research_brief", "decision_brief"].includes(researchAddendum?.kind);
  const researchQueries = isResearchAddendum
    ? buildResearchAddendumSearchQueries(query, researchAddendum.researchSummary)
    : [];
  const queries = researchQueries.length ? researchQueries : [query].filter(Boolean);
  const displayQuery = researchQueries.length > 1
    ? msg("researchAddendumQueryBundle", [researchQueries.length])
    : query;

  appendChatMessage({
    role: "assistant",
    status: "tool-card",
    html: renderToolCard(buildWebSearchToolCard(displayQuery || query, "running")),
    text: "",
    includeInAIAgentContext: false
  });

  renderChatPanel({
    status: "loading",
    answer: msg("agentWebSearchRunning", [displayQuery || query || msg("webSearch")])
  });

  setBusy(true);
  let response;

  response = isResearchAddendum
    ? await runAgentResearchAddendumSearch(queries)
    : await requestAgentWebSearch(query);

  setBusy(false);

  if (response?.ok && response.result?.status === "completed") {
    const resultCount = Number(response.result.resultCount || response.result.results?.length || 0);
    latestWebSearchResults = sanitizeSearchResultsForLocalWork(response.result.results || []);
    updateLatestToolCard(buildWebSearchToolCard(displayQuery || query, "completed", resultCount));
    if (isResearchAddendum) {
      renderChatPanel({
        status: "research-addendum",
        answer: buildResearchSearchAddendumMarkdown({
          query,
          queries: response.result.queries || queries,
          result: response.result,
          results: latestWebSearchResults,
          researchSummary: researchAddendum.researchSummary
        }),
        results: latestWebSearchResults,
        providerLabel: response.result.providerLabel,
        query: response.result.query || query,
        queries: response.result.queries || queries
      });
      return true;
    }

    renderChatPanel({
      status: "web-search",
      answer: buildWebSearchAnswer(response.result),
      results: latestWebSearchResults,
      providerLabel: response.result.providerLabel,
      query
    });
    return true;
  }

  updateLatestToolCard(buildWebSearchToolCard(displayQuery || query, "needs-provider"));

  if (response?.ok && response.result?.status === "not-configured") {
    renderChatPanel({
      status: "search-provider-needed",
      answer: buildSearchProviderNeededMarkdown(query, response.result.diagnostics)
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

  if (response?.ok && response.result?.status === "failed") {
    renderChatPanel({
      status: "error",
      answer: buildSearchProviderFailureMarkdown(response.result.error, response.result.diagnostics)
    });
    return true;
  }

  renderChatPanel({
    status: "error",
    answer: msg("agentWebSearchFailed", [response?.error || msg("scanDidNotFinish")])
  });
  return true;
}

async function requestAgentWebSearch(query) {
  try {
    return await chrome.runtime.sendMessage({
      type: "RUN_AGENT_WEB_SEARCH",
      query,
      requestPermission: true
    });
  } catch (error) {
    return { ok: false, error: error?.message || msg("agentWebSearchFailed") };
  }
}

async function runAgentResearchAddendumSearch(queries = []) {
  const safeQueries = (Array.isArray(queries) ? queries : [])
    .map(sanitizeResearchSearchQuery)
    .filter(Boolean)
    .slice(0, 3);

  if (!safeQueries.length) {
    return { ok: false, error: msg("researchBriefNoMissingInfo") };
  }

  const completed = [];

  for (const query of safeQueries) {
    const response = await requestAgentWebSearch(query);

    if (!(response?.ok && response.result?.status === "completed")) {
      return response;
    }

    completed.push(response.result);
  }

  return {
    ok: true,
    result: mergeResearchAddendumSearchResults(completed, safeQueries)
  };
}

function mergeResearchAddendumSearchResults(results = [], queries = []) {
  const first = results[0] || {};
  const mergedResults = [];
  const seen = new Set();

  for (const result of results) {
    for (const item of Array.isArray(result.results) ? result.results : []) {
      const key = String(item.url || `${item.hostname || ""}:${item.title || ""}`).toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      mergedResults.push(item);
      if (mergedResults.length >= 8) break;
    }
    if (mergedResults.length >= 8) break;
  }

  const answers = results
    .map((result, index) => {
      const answer = cleanMarkdownLine(result.answer || "");
      return answer ? `[${index + 1}] ${answer}` : "";
    })
    .filter(Boolean)
    .slice(0, 3);

  return {
    ...first,
    status: "completed",
    query: queries[0] || first.query || "",
    queries,
    answer: answers[0] || "",
    results: mergedResults,
    resultCount: mergedResults.length,
    privacy: {
      ...(first.privacy || {}),
      sentQuery: true,
      sentTabData: false,
      sentPageText: false,
      sentFullUrls: false,
      storage: "session_only_until_saved"
    }
  };
}

function normalizeResearchSearchAddendumOptions(options = {}) {
  if (!options || typeof options !== "object") return null;
  if (!["research_brief", "decision_brief"].includes(options.kind)) return null;

  return {
    kind: options.kind,
    researchSummary: options.kind === "decision_brief"
      ? sanitizeDecisionBriefForLocalActions(options.researchSummary || {})
      : sanitizeResearchBriefForLocalActions(options.researchSummary || {})
  };
}

function buildSearchProviderNeededMarkdown(query, diagnostics = null) {
  return [
    msg("agentWebSearchNeedsProvider", [query || msg("webSearch")]),
    "",
    ...formatSearchProviderDiagnosticsLines(diagnostics)
  ]
    .filter((line, index, lines) => line || (index > 0 && lines[index - 1]))
    .join("\n");
}

function buildSearchProviderFailureMarkdown(error, diagnostics = null) {
  return [
    msg("agentWebSearchFailed", [error || msg("scanDidNotFinish")]),
    "",
    ...formatSearchProviderDiagnosticsLines(diagnostics)
  ]
    .filter((line, index, lines) => line || (index > 0 && lines[index - 1]))
    .join("\n");
}

function formatSearchProviderDiagnosticsLines(diagnostics = null) {
  if (!diagnostics || typeof diagnostics !== "object") return [];

  const provider = String(diagnostics.providerLabel || diagnostics.provider || msg("webSearch"));
  const origin = String(diagnostics.baseOrigin || diagnostics.permissionOrigin || "").replace(/\/\*$/, "");
  const keyStatus = diagnostics.apiKeyStatus === "saved" ? msg("searchDiagnosticKeySaved") : msg("searchDiagnosticKeyMissing");
  const resultCount = Number.isFinite(Number(diagnostics.resultCount)) ? Number(diagnostics.resultCount) : 0;
  const errorType = String(diagnostics.errorType || "").trim();
  const privacy = diagnostics.privacy || {};

  return [
    msg("searchDiagnosticsHeading"),
    `- ${msg("searchDiagnosticProvider", [provider])}`,
    origin ? `- ${msg("searchDiagnosticOrigin", [origin])}` : "",
    `- ${msg("searchDiagnosticKeyStatus", [keyStatus])}`,
    `- ${msg("searchDiagnosticResultCount", [resultCount])}`,
    errorType ? `- ${msg("searchDiagnosticErrorType", [errorType])}` : "",
    `- ${msg("searchDiagnosticPrivacy", [
      privacy.sentQuery ? msg("yes") : msg("no"),
      privacy.sentTabData ? msg("yes") : msg("no"),
      privacy.sentPageText ? msg("yes") : msg("no"),
      privacy.sentFullUrls ? msg("yes") : msg("no")
    ])}`
  ].filter(Boolean);
}

function extractAgentWebSearchQuery(text) {
  const normalized = String(text || "")
    .replace(/^\s*(please\s+)?/i, "")
    .replace(/\b(web\s+search|search\s+(the\s+)?web|search\s+online|look\s+up|research\s+online|find\s+online)\b/gi, " ")
    .replace(/^\s*(for|about|on)\s+/i, "")
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
    !extractBrowserWorkSearchQuery(text) &&
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

function shouldRouteAIAgentFollowUp(text) {
  const normalized = normalizeAgentText(text);

  if (!normalized) return false;
  if (hasCurrentPageReference(normalized)) return false;
  if (/\b(these|selected)\s+(tabs?|pages?|sources?)\b/.test(normalized)) return false;
  if (/\b(this|current)\s+group\b/.test(normalized)) return false;
  if (!isLikelyAIAgentFollowUp(normalized)) return false;

  return findLastAssistantChatStatus() === "ai-agent";
}

function isLikelyAIAgentFollowUp(text) {
  return (
    /\b(why|why those|why them|why these|why that|which ones?|what about|how about|explain|elaborate|tell me more|those tabs?|that recommendation)\b/.test(text) ||
    /为什么|为啥|那些|它们|这个建议|解释一下|展开说说/.test(text)
  );
}

function findLastAssistantChatStatus() {
  for (let index = chatMessages.length - 1; index >= 0; index -= 1) {
    const message = chatMessages[index];
    if (message?.role !== "assistant") continue;
    if (["loading", "tool-card", "error"].includes(message.status)) continue;
    return message.status || "";
  }

  return "";
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
  if (isGlobalTabSelectionQuestion(normalized)) return false;
  if (isApplyGatedTabActionIntent(normalized)) return false;
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
  if (isGlobalTabSelectionQuestion(normalized)) return false;
  if (isApplyGatedTabActionIntent(normalized)) return false;

  return isLikelyContextTabsFollowUp(normalized);
}

function isGlobalTabSelectionQuestion(text) {
  const asksForTabs =
    /\b(which|what)\s+tabs?\b/.test(text) ||
    /\btabs?\s+should\s+i\b/.test(text) ||
    /\btabs?\s+(?:to|for)\s+(?:focus|review|open|read)\b/.test(text);
  const scopedToContext =
    /\b(these|selected|those|them|they)\s+(tabs?|pages?|sources?)\b/.test(text) ||
    /\b(this|current)\s+group\b/.test(text) ||
    /\b(selected\s+tabs?|current\s+group|this\s+context|the\s+context|these\s+sources?)\b/.test(text);

  return asksForTabs && !scopedToContext;
}

function isApplyGatedTabActionIntent(text) {
  return (
    /\b(move|put|send|place|sort|group|regroup|rename)\b.{0,80}\b(tabs?|group|into|to)\b/.test(text) ||
    /\b(tabs?|group)\b.{0,80}\b(move|put|send|place|sort|group|regroup|rename)\b/.test(text) ||
    /(?:移动|挪到|放到|归到|重命名|改名|分组|重新分组).{0,50}(?:标签|分组|tabs?|group)/.test(text)
  );
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
    /\b(decision\s+brief|decision\s+memo|decision\s+artifact|recommend\s+a\s+path|recommendation\s+brief|make\s+a\s+decision|decide\s+(between|which|what)|what\s+should\s+we\s+choose)\b/.test(text) ||
    /\b(these|selected)\s+(sources|pages?)\b.*\b(research|brief|synthesize|summary|findings|gaps?)\b/.test(text) ||
    /\b(research\s+brief|research\s+report|deep\s+research|source\s+synthesis|findings\s+and\s+gaps)\b/.test(text) ||
    /\b(draft|write|compose|prepare)\b.{0,80}\b(email|message|reply|response|comment|update|status|memo|note|report|post|copy)\b.*\b(tabs?|pages?|sources?|group|context)\b/.test(text) ||
    /\b(tabs?|pages?|sources?|group|context)\b.*\b(draft|write|compose|prepare)\b.{0,80}\b(email|message|reply|response|comment|update|status|memo|note|report|post|copy)\b/.test(text) ||
    /\b(group|tabs?|sources|pages?)\b.*\b(about|saying|say|content|summarize|summary|compare|explain|understand|actually|deep|research|brief|decision|findings|gaps?|reclassify|regroup|split)\b/.test(text) ||
    /\b(what|why|how|summarize|explain|compare|research|synthesize|decision|decide|recommend|reclassify|regroup|split|draft|write|compose|prepare)\b.*\b(group|tabs?|sources|pages?)\b/.test(text) ||
    /(这个|当前)?分组.*(讲|内容|总结|解释|比较|重新整理|重新分组|细分|是什么|干嘛|写|起草|草拟|生成)/.test(text) ||
    /(决策简报|决策备忘|决策建议|推荐路径|怎么决策|应该选哪个|应该选择|怎么选)/.test(text) ||
    /(这些|选中).*(标签|来源|页面).*(讲|内容|总结|解释|比较|调研|研究|简报|综合|决策|推荐|重新整理|重新分组|细分|写|起草|草拟|生成)/.test(text)
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
    latestPageReviewResult = null;
    latestSmartFillResult = null;
    return;
  }

  const updatedAt = Number(latestPageChatContext.updatedAt || 0);
  const expired = !updatedAt || Date.now() - updatedAt > PAGE_CHAT_CONTEXT_TTL_MS;

  if (expired || !isSamePageChatContext(activeSidebarContext, latestPageChatContext)) {
    latestPageChatContext = null;
    latestPageReviewResult = null;
    latestSmartFillResult = null;
    pageChatMessages = [];
  }
}

function rememberPageReviewResult(summary = {}) {
  if (!isPageReviewSummary(summary)) {
    latestPageReviewResult = null;
    return;
  }

  const context = normalizeSidebarContext(activeSidebarContext) || {};
  latestPageReviewResult = {
    summary: sanitizePageReviewResultForLocalActions(summary),
    context: {
      scope: "current_tab",
      tabId: context.tabId,
      windowId: context.windowId,
      title: summary.title || context.title || "",
      hostname: summary.hostname || context.hostname || ""
    },
    updatedAt: Date.now()
  };
}

function rememberSmartFillResult(summary = {}) {
  if (!isSmartFillSummary(summary)) {
    latestSmartFillResult = null;
    return;
  }

  const context = normalizeSidebarContext(activeSidebarContext) || {};
  latestSmartFillResult = {
    summary: sanitizeSmartFillResultForLocalActions(summary),
    context: {
      scope: "current_tab",
      tabId: context.tabId,
      windowId: context.windowId,
      title: summary.title || context.title || "",
      hostname: summary.hostname || context.hostname || ""
    },
    updatedAt: Date.now()
  };
}

function getActiveSmartFillResult() {
  if (!latestSmartFillResult) return null;
  if (Date.now() - Number(latestSmartFillResult.updatedAt || 0) > PAGE_CHAT_CONTEXT_TTL_MS) {
    latestSmartFillResult = null;
    return null;
  }

  if (!isSamePageChatContext(activeSidebarContext, latestSmartFillResult.context)) {
    latestSmartFillResult = null;
    return null;
  }

  return latestSmartFillResult;
}

function getActivePageReviewResult() {
  if (!latestPageReviewResult) return null;
  if (Date.now() - Number(latestPageReviewResult.updatedAt || 0) > PAGE_CHAT_CONTEXT_TTL_MS) {
    latestPageReviewResult = null;
    return null;
  }

  if (!isSamePageChatContext(activeSidebarContext, latestPageReviewResult.context)) {
    latestPageReviewResult = null;
    return null;
  }

  return latestPageReviewResult;
}

function isPageReviewSummary(summary = {}) {
  return summary?.workflow === "review_page";
}

function isContextualWritingSummary(summary = {}) {
  return summary?.workflow === "contextual_writing";
}

function isSmartFillSummary(summary = {}) {
  return summary?.workflow === "smart_fill_lite";
}

function sanitizePageReviewResultForLocalActions(summary = {}) {
  return {
    ...summary,
    workflow: "review_page",
    summary: cleanMarkdownLine(summary.summary || summary.answer || "").slice(0, 1000),
    risks: sanitizeReviewList(summary.risks, 6),
    openQuestions: sanitizeReviewList(summary.openQuestions, 6),
    reviewChecklist: sanitizeReviewList(summary.reviewChecklist, 8),
    nextSteps: sanitizeReviewList(summary.nextSteps, 6),
    keyPoints: sanitizeReviewList(summary.keyPoints, 4)
  };
}

function sanitizeSmartFillResultForLocalActions(summary = {}) {
  return {
    ...summary,
    workflow: "smart_fill_lite",
    summary: cleanMarkdownLine(summary.summary || summary.answer || "").slice(0, 1000),
    tableTitle: cleanMarkdownLine(summary.tableTitle || summary.title || "").slice(0, 120),
    tableHeaders: sanitizeReviewList(summary.tableHeaders, 8),
    tableRows: sanitizeSmartFillTableRows(summary.tableRows, 10, 6),
    rowClassifications: sanitizeSmartFillRows(summary.rowClassifications, 10),
    markdownTable: sanitizeMemoBody(summary.markdownTable || "").slice(0, 2400),
    csv: sanitizeMemoBody(summary.csv || "").slice(0, 2400),
    tableNotes: sanitizeReviewList(summary.tableNotes, 6),
    keyPoints: sanitizeReviewList(summary.keyPoints, 4)
  };
}

function sanitizeSmartFillRows(values, limit) {
  return (Array.isArray(values) ? values : [])
    .map((row) => ({
      rowLabel: cleanMarkdownLine(row?.rowLabel || row?.label || row?.item || "").slice(0, 120),
      classification: cleanMarkdownLine(row?.classification || row?.tag || row?.status || "").slice(0, 80),
      reason: cleanMarkdownLine(row?.reason || row?.evidence || "").slice(0, 160),
      nextAction: cleanMarkdownLine(row?.nextAction || row?.action || "").slice(0, 160)
    }))
    .filter((row) => row.rowLabel || row.classification || row.nextAction)
    .slice(0, limit);
}

function sanitizeSmartFillTableRows(values, rowLimit, cellLimit) {
  return (Array.isArray(values) ? values : [])
    .map((row) => (Array.isArray(row) ? row : [])
      .map((cell) => cleanMarkdownLine(cell).slice(0, 140))
      .filter(Boolean)
      .slice(0, cellLimit))
    .filter((row) => row.length)
    .slice(0, rowLimit);
}

function sanitizeReviewList(values, limit) {
  return (Array.isArray(values) ? values : [])
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, limit);
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
    latestCompareTabsResult = null;
    latestResearchBriefResult = null;
    return;
  }

  const updatedAt = Number(latestContextTabsChatContext.updatedAt || 0);
  const expired = !updatedAt || Date.now() - updatedAt > PAGE_CHAT_CONTEXT_TTL_MS;

  if (expired || !isSameContextTabsChatContext(activeSidebarContext, latestContextTabsChatContext)) {
    latestContextTabsChatContext = null;
    latestCompareTabsResult = null;
    latestResearchBriefResult = null;
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

  if (command === "selectedTextReading") {
    await summarizeSelectedText(buildReadingAssistantQuestion(text, "selected_text"));
    return true;
  }

  if (command === "selectedTextWriting") {
    await summarizeSelectedText(buildContextualWritingQuestion(text, "selected_text"), { workflow: "contextual_writing" });
    return true;
  }

  if (command === "savedSourcesWriting") {
    await draftFromSavedSources(text);
    return true;
  }

  if (command === "savedSourcesDecision") {
    await draftFromSavedSources(text, { workflow: "decision_brief" });
    return true;
  }

  if (command === "searchResultsDecision") {
    await draftDecisionFromSearchResults(text);
    return true;
  }

  if (command === "savedSourcesResearch") {
    await draftFromSavedSources(text, { workflow: "research_brief" });
    return true;
  }

  if (command === "currentPageReading") {
    await summarizeCurrentTab(buildReadingAssistantQuestion(text, "current_page"));
    return true;
  }

  const regionQuestion = command === "selectRegion" ? extractRegionQuestion(text) : "";
  if (command === "selectRegion") {
    await summarizeSelectedPageRegion(regionQuestion);
    return true;
  }

  if (command === "pageRegionWriting") {
    await summarizeSelectedPageRegion(buildContextualWritingQuestion(text, "selected_region"), { workflow: "contextual_writing" });
    return true;
  }

  if (command === "smartFillLite") {
    await summarizeSelectedPageRegion(buildSmartFillQuestion(text), { workflow: "smart_fill_lite" });
    return true;
  }

  if (command === "createPageTodo") {
    await createChecklistTodoFromCurrentPage(text);
    return true;
  }

  if (command === "contextualWriting") {
    await summarizeCurrentTab(buildContextualWritingQuestion(text), { workflow: "contextual_writing" });
    return true;
  }

  if (command === "contextTabsWriting") {
    const context = normalizeSidebarContext(activeSidebarContext) || {};
    const scope = context.scope === "current_group" ? "current_group" : "selected_tabs";
    await summarizeContextTabs(buildContextualWritingQuestion(text, scope), { workflow: "contextual_writing" });
    return true;
  }

  if (command === "createTodo") {
    await createTodoFromSidebarContext(text);
    return true;
  }

  if (command === "createTriageTodo") {
    await createTodoFromAITriage(text);
    return true;
  }

  if (command === "createGoalTodo") {
    await createTodoFromWorkspaceGoal(text);
    return true;
  }

  if (command === "renameTodo") {
    await updateLatestTodoFromCommand("rename", text);
    return true;
  }

  if (command === "addTodoChecklistItem") {
    await updateLatestTodoFromCommand("addChecklist", text);
    return true;
  }

  if (command === "markTodoChecklistItemDone") {
    await updateLatestTodoFromCommand("markChecklistDone", text);
    return true;
  }

  if (command === "mergeTodoContext") {
    await updateLatestTodoFromCommand("mergeContext", text);
    return true;
  }

  if (command === "setWorkspaceGoal") {
    await setWorkspaceGoalFromCommand(text);
    return true;
  }

  if (command === "clearWorkspaceGoal") {
    await clearWorkspaceGoal();
    return true;
  }

  if (command === "protectScope") {
    await previewChatRefineAction(text, { renderErrorOnFailure: true });
    return true;
  }

  if (command === "suggestGroup") {
    await previewChatRefineAction(text, { renderErrorOnFailure: true });
    return true;
  }

  if (command === "markDone" || command === "markLater" || command === "markKeep") {
    const state = command === "markDone" ? "done" : command === "markLater" ? "later" : "keep";
    await previewTabWorkStateCommand(state, text);
    return true;
  }

  if (command === "closeSafeDuplicates") {
    await previewChatRefineAction(text, { renderErrorOnFailure: true });
    return true;
  }

  if (command === "memoryRelief") {
    await previewChatRefineAction(text, { renderErrorOnFailure: true });
    return true;
  }

  const messages = {
    summarize: pageQuestion ? msg("agentCommandAskPage") : msg("agentCommandSummarize"),
    selectRegion: msg("agentCommandSelectRegion"),
    organize: msg("agentCommandOrganize"),
    undo: msg("agentCommandUndo"),
    restore: msg("agentCommandRestore"),
    dashboard: msg("agentCommandDashboard"),
    saveWorkspace: msg("agentCommandSaveWorkspace"),
    markDone: msg("tabStateMarkedDone"),
    markLater: msg("tabStateSavedLater"),
    markKeep: msg("tabStateMarkedKeep")
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

  if (isSmartFillCommand(normalized)) return "smartFillLite";
  if (isPageRegionWritingCommand(normalized)) return "pageRegionWriting";
  if (isPageRegionCommand(normalized)) return "selectRegion";
  if (isCreatePageTodoCommand(normalized)) return "createPageTodo";
  if (isSelectedTextWritingCommand(normalized)) return "selectedTextWriting";
  if (isSavedSourcesDecisionCommand(normalized)) return "savedSourcesDecision";
  if (isSearchResultsDecisionCommand(normalized)) return "searchResultsDecision";
  if (isSavedSourcesResearchCommand(normalized)) return "savedSourcesResearch";
  if (isSavedSourcesWritingCommand(normalized)) return "savedSourcesWriting";
  if (isContextTabsWritingCommand(normalized)) return "contextTabsWriting";
  if (isContextualWritingCommand(normalized)) return "contextualWriting";
  if (isSelectedTextReadingCommand(normalized)) return "selectedTextReading";
  if (isCurrentPageReadingCommand(normalized)) return "currentPageReading";
  if (isWorkspaceChatQuestion(normalized)) return null;
  if (isSummaryCommand(normalized)) return "summarize";
  if (isClearWorkspaceGoalCommand(normalized)) return "clearWorkspaceGoal";
  if (isSetWorkspaceGoalCommand(normalized)) return "setWorkspaceGoal";
  if (isCreateWorkspaceGoalTodoCommand(normalized)) return "createGoalTodo";
  if (isCreateTriageTodoCommand(normalized)) return "createTriageTodo";
  if (isRenameTodoCommand(normalized)) return "renameTodo";
  if (isMergeContextIntoTodoCommand(normalized)) return "mergeTodoContext";
  if (isAddTodoChecklistItemCommand(normalized)) return "addTodoChecklistItem";
  if (isMarkTodoChecklistItemDoneCommand(normalized)) return "markTodoChecklistItemDone";
  if (isCreateTodoCommand(normalized)) return "createTodo";
  if (isProtectScopeRuleCommand(normalized)) return "protectScope";
  if (isSuggestGroupCommand(normalized)) return "suggestGroup";
  if (isMarkTabDoneCommand(normalized)) return "markDone";
  if (isMarkTabLaterCommand(normalized)) return "markLater";
  if (isMarkTabKeepCommand(normalized)) return "markKeep";
  if (isCloseSafeDuplicatesCommand(normalized)) return "closeSafeDuplicates";
  if (isMemoryReliefActionCommand(normalized)) return "memoryRelief";
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

function tokenizeBrowserWorkText(text = "") {
  return Array.from(new Set(
    normalizeAgentText(text)
      .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
      .slice(0, 24)
  ));
}

function isCloseSafeDuplicatesCommand(text) {
  if (isRestoreCommand(text) || isUndoCommand(text)) return false;

  return (
    /\b(close|remove|clean|clear)\b.{0,48}\b(safe\s+)?(duplicates?|dupes?|duplicate tabs?)\b/.test(text) ||
    /\b(duplicates?|dupes?|duplicate tabs?)\b.{0,48}\b(close|remove|clean|clear)\b/.test(text) ||
    /(?:关闭|清理|删除).{0,24}(?:安全)?.{0,24}(?:重复标签|重复的标签|重复)/.test(text) ||
    /(?:重复标签|重复的标签|重复).{0,24}(?:关闭|清理|删除)/.test(text)
  );
}

function isMemoryReliefActionCommand(text) {
  if (!text || isRestoreCommand(text) || isUndoCommand(text) || isCloseSafeDuplicatesCommand(text)) return false;
  if (/\b(how much|what|show|status|result|impact)\b.{0,32}\b(memory|optimization|relief)\b/.test(text)) return false;

  return (
    /\b(free|reduce|lower|relieve|save|sleep|suspend|discard|collapse|clean up)\b.{0,60}\b(memory|pressure|inactive|idle|sleeping|suspended|tabs?|groups?)\b/.test(text) ||
    /\b(memory|pressure|inactive|idle|tabs?|groups?)\b.{0,60}\b(free|reduce|lower|relieve|sleep|suspend|discard|collapse|clean up)\b/.test(text) ||
    /(?:释放|降低|减少|缓解|优化|清理).{0,24}(?:内存|压力|不活跃|空闲|标签|分组)/.test(text) ||
    /(?:休眠|挂起|折叠).{0,24}(?:不活跃|空闲|标签|分组)/.test(text)
  );
}

function isSuggestGroupCommand(text) {
  if (!text || isRestoreCommand(text) || isUndoCommand(text) || isCloseSafeDuplicatesCommand(text) || isMemoryReliefActionCommand(text)) {
    return false;
  }

  if (/\b(show|list|what|which)\b.{0,24}\bgroups?\b/.test(text) || /有哪些分组|列出分组|显示分组/.test(text)) {
    return false;
  }

  const mentionsCurrentTab =
    /\b(this|current|active)\s+(tab|page)\b/.test(text) ||
    /\btab\b.{0,24}\b(this|current|active)\b/.test(text) ||
    /(?:当前|这个|这一个|这页|当前页).{0,10}(?:标签页|tab|页面|网页)?/.test(text);

  const asksSuggestion =
    /\b(suggest|recommend|where|which|right|best)\b.{0,48}\b(group|workspace|place|belong|go|put|move|add)\b/.test(text) ||
    /\b(group|workspace|place)\b.{0,48}\b(suggest|recommend|right|best|belong)\b/.test(text) ||
    /(?:建议|推荐|应该|适合|放哪|放到哪|归到哪|哪个分组|哪一个分组|合适的分组)/.test(text);

  return mentionsCurrentTab && asksSuggestion;
}

function isSelectedTextReadingCommand(text) {
  const mentionsSelection =
    /\b(selected|highlighted|selection)\s+(text|copy|paragraph|sentence|content)\b/.test(text) ||
    /\b(text|copy|paragraph|sentence)\s+(i\s+)?selected\b/.test(text) ||
    /(?:选中|高亮|划选).{0,16}(?:文本|文字|内容|段落|句子)/.test(text);

  return mentionsSelection && isReadingAssistantIntent(text);
}

function isCurrentPageReadingCommand(text) {
  const mentionsPage =
    /\b(this|current)\s+(page|tab|article|doc|document)\b/.test(text) ||
    /\bpage\b/.test(text) ||
    /(?:这个|当前)?(?:页面|网页|文章|文档|标签页)/.test(text);

  return mentionsPage && isReadingAssistantIntent(text);
}

function isContextualWritingCommand(text) {
  const mentionsCurrentContext =
    /\b(this|current)\s+(page|tab|doc|document|issue|pr|pull request|thread|ticket)\b/.test(text) ||
    /\bfrom\s+(this|current)\s+(page|tab|doc|document|issue|pr|pull request|thread|ticket)\b/.test(text) ||
    /(?:这个|当前)?(?:页面|网页|文档|工单|PR|问题|内容)/i.test(text);
  const writingIntent =
    /\b(draft|write|compose|prepare)\b.{0,60}\b(reply|response|comment|update|message|email|note|follow[-\s]?up|status)\b/.test(text) ||
    /\b(reply|respond|comment)\b.{0,60}\b(based on|from|to)\b/.test(text) ||
    /\b(create|make)\b.{0,40}\b(copy-only|copy only)\b.{0,40}\b(draft|reply|comment|message)\b/.test(text) ||
    /(?:草拟|起草|写|生成).{0,40}(?:回复|评论|更新|邮件|消息|跟进|说明|文案)/.test(text);

  return mentionsCurrentContext && writingIntent;
}

function isContextTabsWritingCommand(text) {
  if (!hasComposerContextTabsScope()) return false;
  if (hasCurrentPageReference(text) || isSelectedTextIntent(text) || isPageRegionCommand(text)) return false;

  const mentionsContextTabs =
    /\b(these|selected|current)\s+(tabs?|pages?|sources?|group|context)\b/.test(text) ||
    /\bfrom\s+(these|selected|current)\s+(tabs?|pages?|sources?|group|context)\b/.test(text) ||
    /\b(tab\s+group|selected\s+context|selected\s+sources?)\b/.test(text) ||
    /(?:这些|选中|当前).{0,12}(?:标签|tab|tabs|页面|网页|来源|资料|分组|上下文)/.test(text) ||
    /(?:基于|根据|从).{0,12}(?:这些|选中|当前).{0,12}(?:标签|tab|tabs|页面|网页|来源|资料|分组|上下文)/.test(text);
  const writingIntent =
    /\b(draft|write|compose|prepare)\b.{0,80}\b(email|message|reply|response|comment|update|status|memo|note|report|post|copy)\b/.test(text) ||
    /\b(email|message|reply|response|comment|update|status|memo|note|report|post)\b.{0,80}\b(from|based on|using|with)\b.{0,80}\b(tabs?|pages?|sources?|group|context)\b/.test(text) ||
    /(?:起草|草拟|写|生成|撰写).{0,50}(?:邮件|消息|回复|评论|更新|进展|备忘|笔记|报告|文案)/.test(text);

  return writingIntent && mentionsContextTabs;
}

function isSavedSourcesWritingCommand(text) {
  const mentionsSavedSources =
    /\b(saved|local)\s+(sources?|memos?|notes?|collections?|work|research|context)\b/.test(text) ||
    /\bfrom\s+(my\s+)?(saved|local)\s+(sources?|memos?|notes?|collections?|work|research|context)\b/.test(text) ||
    /\busing\s+(my\s+)?(saved|local)\s+(sources?|memos?|notes?|collections?|work|research|context)\b/.test(text) ||
    /(?:已保存|保存的|本地).{0,12}(?:来源|资料|memo|备忘|笔记|收藏|上下文|研究)/.test(text);
  const writingIntent =
    /\b(draft|write|compose|prepare)\b.{0,80}\b(email|message|reply|response|comment|update|status|memo|note|report|post|copy)\b/.test(text) ||
    /\b(email|message|reply|response|comment|update|status|memo|note|report|post)\b.{0,80}\b(from|based on|using|with)\b/.test(text) ||
    /(?:起草|草拟|写|生成|撰写).{0,50}(?:邮件|消息|回复|评论|更新|进展|备忘|笔记|报告|文案)/.test(text);

  return mentionsSavedSources && writingIntent;
}

function isSavedSourcesDecisionCommand(text) {
  const mentionsSavedSources =
    /\b(saved|local)\s+(sources?|memos?|notes?|collections?|work|research|context)\b/.test(text) ||
    /\bfrom\s+(my\s+)?(saved|local)\s+(sources?|memos?|notes?|collections?|work|research|context)\b/.test(text) ||
    /\busing\s+(my\s+)?(saved|local)\s+(sources?|memos?|notes?|collections?|work|research|context)\b/.test(text) ||
    /(?:已保存|保存的|本地).{0,12}(?:来源|资料|memo|备忘|笔记|收藏|上下文|研究)/.test(text);
  const decisionIntent =
    /\b(decision\s+brief|decision\s+memo|recommend\s+a\s+path|recommendation\s+brief|make\s+a\s+decision|decide\s+(between|which|what)|what\s+should\s+we\s+choose)\b/.test(text) ||
    /(决策简报|决策备忘|决策建议|推荐路径|怎么决策|应该选哪个|应该选择|怎么选)/.test(text);

  return mentionsSavedSources && decisionIntent;
}

function isSearchResultsDecisionCommand(text) {
  const mentionsSearchResults =
    /\b(search|web)\s+(results?|sources?|snippets?)\b/.test(text) ||
    /\bfrom\s+(these|the|current|latest|session)?\s*(search|web)\s+(results?|sources?|snippets?)\b/.test(text) ||
    /\busing\s+(these|the|current|latest|session)?\s*(search|web)\s+(results?|sources?|snippets?)\b/.test(text) ||
    /(?:搜索结果|搜索来源|搜索摘要|检索结果)/.test(text);
  const decisionIntent =
    /\b(decision\s+brief|decision\s+memo|recommend\s+a\s+path|recommendation\s+brief|make\s+a\s+decision|decide\s+(between|which|what)|what\s+should\s+we\s+choose)\b/.test(text) ||
    /(决策简报|决策备忘|决策建议|推荐路径|怎么决策|应该选哪个|应该选择|怎么选)/.test(text);

  return mentionsSearchResults && decisionIntent;
}

function isSavedSourcesResearchCommand(text) {
  const mentionsSavedSources =
    /\b(saved|local)\s+(sources?|memos?|notes?|collections?|work|research|context)\b/.test(text) ||
    /\bfrom\s+(my\s+)?(saved|local)\s+(sources?|memos?|notes?|collections?|work|research|context)\b/.test(text) ||
    /\busing\s+(my\s+)?(saved|local)\s+(sources?|memos?|notes?|collections?|work|research|context)\b/.test(text) ||
    /(?:已保存|保存的|本地).{0,12}(?:来源|资料|memo|备忘|笔记|收藏|上下文|研究)/.test(text);
  const researchIntent =
    /\b(research\s+brief|research\s+report|source\s+synthesis|synthesize|findings\s+and\s+gaps|research\s+summary|summarize\s+research)\b/.test(text) ||
    /(调研简报|研究简报|研究报告|资料综合|综合这些|发现和缺口|结论和缺口)/.test(text);

  return mentionsSavedSources && researchIntent;
}

function isSelectedTextWritingCommand(text) {
  const mentionsSelection =
    /\b(selected|highlighted|selection)\s+(text|copy|paragraph|sentence|content)\b/.test(text) ||
    /\b(text|copy|paragraph|sentence)\s+(i\s+)?selected\b/.test(text) ||
    /(?:选中|高亮|划选).{0,16}(?:文本|文字|内容|段落|句子)/.test(text);

  return mentionsSelection && isCopyRewriteIntent(text);
}

function isPageRegionWritingCommand(text) {
  const mentionsRegion =
    /\b(?:selected\s+)?(?:page\s+)?(?:region|section|area|block|panel|card)\b/.test(text) ||
    /(?:区域|区块|板块|卡片|选区)/.test(text);

  return mentionsRegion && isCopyRewriteIntent(text);
}

function isCopyRewriteIntent(text) {
  return (
    /\b(rewrite|rephrase|polish|make shorter|shorten|make more formal|formalize|make clearer|improve copy|draft|write|compose|prepare)\b/.test(text) ||
    /(?:改写|润色|更正式|更短|缩短|更清晰|优化文案|起草|草拟|写|生成)/.test(text)
  );
}

function isSmartFillCommand(text) {
  return (
    /\b(smart\s*fill|extract|export|copy|classify|tag|turn)\b.{0,80}\b(table|rows?|list|selected region|region|section|csv|markdown table|todos?)\b/.test(text) ||
    /\b(table|rows?|list|selected region|region|section)\b.{0,80}\b(extract|export|copy|classify|tag|markdown|csv|todos?)\b/.test(text) ||
    /(?:提取|导出|复制|分类|标记).{0,40}(?:表格|列表|行|区域|选区|待办)/.test(text) ||
    /(?:表格|列表|行|区域|选区).{0,40}(?:提取|导出|复制|分类|标记|待办)/.test(text)
  );
}

function buildSmartFillQuestion(text) {
  const userIntent = String(text || "").replace(/\s+/g, " ").trim().slice(0, 240);
  return [
    "Extract the selected page region into a copy-only structured table.",
    userIntent ? `User request: ${userIntent}.` : "",
    "Return useful columns, visible rows, row classifications/tags, next actions, a Markdown table, and optional CSV. Do not fill forms, edit the page, search the web, or claim any page action was taken."
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 520);
}

function buildContextualWritingQuestion(text, scope = "current_page") {
  const userIntent = String(text || "").replace(/\s+/g, " ").trim().slice(0, 240);
  const target =
    scope === "selected_text"
      ? "the selected text"
      : scope === "selected_region"
      ? "the selected page region"
      : scope === "selected_tabs"
      ? "the selected tabs"
      : scope === "current_group"
      ? "the current tab group"
      : "the current page context";
  return [
    `Draft copy-only text from ${target}.`,
    userIntent ? `User request: ${userIntent}.` : "",
    "Return a ready-to-copy draft, a short purpose, audience/tone if inferable, and caveats or missing facts. Do not edit the page, insert text, submit forms, send messages, approve, merge, deploy, or claim any action was taken."
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 520);
}

function isReadingAssistantIntent(text) {
  return (
    /\b(translate|translation|bilingual|simplify|plain english|plain language|explain simply|glossary|terms?|rewrite|rephrase|polish|make shorter|more formal|summarize bilingual|bilingual summary)\b/.test(text) ||
    /(?:翻译|双语|中英|英中|简化|简单解释|通俗解释|术语|词汇表|改写|润色|更正式|更短|双语总结|双语摘要)/.test(text)
  );
}

function buildReadingAssistantQuestion(text, scope) {
  const normalized = normalizeAgentText(text);
  const isSelectedText = scope === "selected_text";
  const target = isSelectedText ? "the selected text" : "this page";
  const hasChinese = /[\u3400-\u9fff]/.test(String(text || ""));

  if (/\b(glossary|terms?)\b/.test(normalized) || /(?:术语|词汇表)/.test(text)) {
    return hasChinese
      ? `从${isSelectedText ? "选中文本" : "当前页面"}中提取关键术语，给出中英双语解释。只输出可复制文本，不要修改网页。`
      : `Extract a bilingual glossary from ${target}. Explain key terms simply. Output copy-only text and do not edit the page.`;
  }

  if (/\b(rewrite|rephrase|polish|make shorter|more formal)\b/.test(normalized) || /(?:改写|润色|更正式|更短)/.test(text)) {
    return hasChinese
      ? `改写${isSelectedText ? "选中文本" : "当前页面中的核心内容"}，让表达更清晰。只输出可复制文本，不要修改网页或提交表单。`
      : `Rewrite ${target} to be clearer. Output copy-only text and do not edit the page or submit anything.`;
  }

  if (/\b(simplify|plain english|plain language|explain simply)\b/.test(normalized) || /(?:简化|简单解释|通俗解释)/.test(text)) {
    return hasChinese
      ? `用更简单的语言解释${isSelectedText ? "这段选中文本" : "这个页面"}，并列出要点。只输出可复制文本。`
      : `Explain ${target} in simpler language and list the key points. Output copy-only text.`;
  }

  if (/\b(bilingual|summarize bilingual|bilingual summary)\b/.test(normalized) || /(?:双语|中英|英中|双语总结|双语摘要)/.test(text)) {
    return hasChinese
      ? `给${isSelectedText ? "选中文本" : "当前页面"}做中英双语总结，并解释关键术语。只输出可复制文本。`
      : `Create an English-Chinese bilingual summary of ${target}, then explain key terms simply. Output copy-only text.`;
  }

  if (/\b(translate|translation)\b/.test(normalized) || /翻译/.test(text)) {
    return hasChinese
      ? `把${isSelectedText ? "选中文本" : "当前页面的核心内容"}在中文和英文之间翻译，并解释关键术语。只输出可复制文本，不要修改网页。`
      : `Translate ${target} between English and Chinese, then explain key terms simply. Output copy-only text and do not edit the page.`;
  }

  return String(text || "").trim() || (isSelectedText ? msg("pickerSelectedTextPrompt") : msg("pickerCurrentPagePrompt"));
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

function isRenameTodoCommand(text) {
  return (
    /\b(rename|retitle|name|title)\b.{0,40}\b(todo|to-do|task|work queue item)\b/.test(text) ||
    /\b(change|update)\b.{0,30}\b(todo|to-do|task)\b.{0,20}\b(title|name)\b/.test(text) ||
    /(?:重命名|改名|修改).{0,20}(?:待办|任务)/.test(text)
  );
}

function isAddTodoChecklistItemCommand(text) {
  return (
    /\b(add|append)\b.{0,30}\b(checklist\s+)?(item|step)\b/.test(text) ||
    /\b(add|append)\b.{0,80}\b(to|into)\b.{0,20}\b(todo|to-do|task|checklist)\b/.test(text) ||
    /(?:添加|加入|新增).{0,30}(?:待办|任务|清单).{0,30}(?:步骤|事项|条目)?/.test(text)
  );
}

function isMergeContextIntoTodoCommand(text) {
  return (
    /\b(add|append|attach|link|merge)\b.{0,50}\b(current\s+)?(context|tab|tabs?|group|page|selection|selected tabs?)\b.{0,50}\b(to|into|with)\b.{0,50}\b(todo|to-do|task|work queue)\b/.test(text) ||
    /\b(todo|to-do|task|work queue)\b.{0,50}\b(add|append|attach|link|merge)\b.{0,50}\b(current\s+)?(context|tab|tabs?|group|page|selection|selected tabs?)\b/.test(text) ||
    /(?:把|将|添加|合并|关联).{0,40}(?:当前|这个|这些)?(?:上下文|标签|标签组|页面|tab|tabs|group).{0,50}(?:到|进|加入|合并到).{0,40}(?:待办|任务|todo)/.test(text)
  );
}

function isMarkTodoChecklistItemDoneCommand(text) {
  return (
    /\b(mark|check|complete|finish)\b.{0,40}\b(checklist\s+)?(item|step|first|second|third|last|\d+)\b.{0,30}\b(done|complete|completed|finished)\b/.test(text) ||
    /\b(done|complete|completed|finished)\b\s*[:：-]\s*.+/.test(text) ||
    /(?:完成|勾选|标记完成).{0,30}(?:待办|任务|清单|步骤|事项|条目)/.test(text)
  );
}

function isCreateTriageTodoCommand(text) {
  return (
    /\b(create|make|add|save|turn)\b.{0,80}\b(triage|next steps?|work plan|organize result|latest result)\b.{0,80}\b(todo|to-do|task|action item|work queue)\b/.test(text) ||
    /\b(triage|next steps?|work plan|organize result|latest result)\b.{0,80}\b(into|as|to)\b.{0,30}\b(todo|to-do|task|action item|work queue)\b/.test(text) ||
    /(?:把|将).{0,30}(?:triage|整理结果|下一步|工作计划).{0,50}(?:待办|任务|todo|行动项)/.test(text) ||
    /(?:根据|基于).{0,30}(?:triage|整理结果|下一步|工作计划).{0,50}(?:生成|创建|整理).{0,30}(?:待办|任务|todo|行动项)/.test(text)
  );
}

function isCreateWorkspaceGoalTodoCommand(text) {
  return (
    /\b(create|make|add|save|turn)\b.{0,80}\b(workspace\s+)?goal\b.{0,80}\b(todo|to-do|task|action item|checklist|work queue)\b/.test(text) ||
    /\b(workspace\s+)?goal\b.{0,80}\b(into|as|to)\b.{0,30}\b(todo|to-do|task|action item|checklist|work queue)\b/.test(text) ||
    /(?:把|将).{0,30}(?:工作目标|workspace goal|目标).{0,50}(?:待办|任务|todo|行动项|清单)/.test(text) ||
    /(?:根据|基于).{0,30}(?:工作目标|workspace goal|目标).{0,50}(?:生成|创建|整理).{0,30}(?:待办|任务|todo|行动项|清单)/.test(text)
  );
}

function isSetWorkspaceGoalCommand(text) {
  return (
    /\b(set|save|update|change)\b.{0,30}\b(workspace\s+)?goal\b/.test(text) ||
    /\b(my|current|workspace)\s+goal\s+(is|=|should be)\b/.test(text) ||
    /(?:设置|保存|更新|修改).{0,20}(?:工作目标|workspace goal|目标)/.test(text) ||
    /(?:当前|我的).{0,10}(?:工作目标|目标).{0,10}(?:是|为)/.test(text)
  );
}

function isClearWorkspaceGoalCommand(text) {
  return (
    /\b(clear|delete|remove|reset)\b.{0,30}\b(workspace\s+)?goal\b/.test(text) ||
    /(?:清除|删除|重置).{0,20}(?:工作目标|workspace goal|目标)/.test(text)
  );
}

function isWorkspaceGoalQuestion(text) {
  return (
    /\b(what'?s|what is|show|current)\b.{0,30}\b(workspace\s+)?goal\b/.test(text) ||
    /\bwhat am i working on\b/.test(text) ||
    /(?:当前|我的).{0,10}(?:工作目标|目标).{0,10}(?:是什么|是啥)|我现在在做什么/.test(text)
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

function isMarkTabDoneCommand(text) {
  return (
    /\b(mark|set|make)\b.{0,30}\b(this|current|selected|these|tabs?|group)\b.{0,30}\b(done|complete|completed|finished)\b/.test(text) ||
    /\b(done|complete|completed|finished)\b.{0,30}\b(this|current|selected|these|tabs?|group)\b/.test(text) ||
    /(?:标记|设为).{0,30}(?:完成|已完成)/.test(text) ||
    /(?:这个|当前|这些|选中|标签|分组).{0,30}(?:完成了|已完成|标记完成)/.test(text)
  );
}

function isMarkTabLaterCommand(text) {
  return (
    /\b(save|mark|set|move|keep)\b.{0,40}\b(this|current|selected|these|tabs?|group)\b.{0,40}\b(later|read later|for later|review later)\b/.test(text) ||
    /\b(read later|review later|for later|later)\b.{0,40}\b(this|current|selected|these|tabs?|group)\b/.test(text) ||
    /(?:稍后|以后|之后).{0,30}(?:看|处理|阅读|再看|再处理)/.test(text) ||
    /(?:把|将|保存).{0,40}(?:这个|当前|这些|选中|标签|分组).{0,40}(?:稍后|以后|之后)/.test(text)
  );
}

function isProtectScopeRuleCommand(text) {
  if (!text) return false;
  const mentionsProtectedAction =
    /\b(protect|lock|keep safe|never move|never close|do not move|don't move|do not close|don't close)\b/.test(text) ||
    /(?:保护|锁定|不要移动|别移动|不要关闭|别关)/.test(text);

  if (!mentionsProtectedAction) return false;
  if (/\b(this|current)\s+tab\b/.test(text) || /(?:这个|当前).{0,6}(?:标签页|tab)/.test(text)) return false;

  return (
    /\b(this|current)\s+group\b/.test(text) ||
    /\b(group|domain|site|host)\b/.test(text) ||
    /\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\b/.test(text) ||
    /(?:分组|域名|网站|站点)/.test(text)
  );
}

function isMarkTabKeepCommand(text) {
  return (
    /\b(mark|set|keep|protect)\b.{0,40}\b(this|current|selected|these|tabs?|group)\b.{0,40}\b(keep|kept|protected|important)\b/.test(text) ||
    /\b(keep|protect)\b.{0,40}\b(this|current|selected|these|tabs?|group)\b/.test(text) ||
    /(?:保留|保护).{0,40}(?:这个|当前|这些|选中|标签|分组)/.test(text) ||
    /(?:这个|当前|这些|选中|标签|分组).{0,40}(?:保留|保护|不要关|别关)/.test(text)
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

  if (isWorkBriefQuestion(normalized)) {
    return await buildWorkBriefAnswer(run);
  }

  if (isWorkspaceGoalQuestion(normalized)) {
    return {
      status: "workspace-goal",
      answer: await buildWorkspaceGoalAnswer()
    };
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

  const tabSearch = buildTabSearchResult(text, run);
  if (tabSearch) {
    return tabSearch;
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

function isWorkBriefQuestion(text) {
  return (
    /\b(what should i continue|what should i work on|what should i focus on|where should i continue|continue workspace|resume workspace|resume work|work brief|brief my browser|morning brief|daily brief|what did i leave open)\b/.test(text) ||
    /继续什么|接着做什么|该继续|从哪里继续|恢复工作|工作简报|浏览器简报|晨间简报|我该先看什么|今天做什么/.test(text)
  );
}

function isWorkspaceChatQuestion(text) {
  const normalized = normalizeAgentText(text);
  if (!normalized) return false;
  if (isWorkBriefQuestion(normalized) || isWorkspaceGoalQuestion(normalized)) return false;
  if (/^(?:find|search|open|focus|go to)\b/.test(normalized) || /^(?:找|查找|搜索|打开|定位)/.test(normalized)) return false;

  const mentionsWorkspace =
    /\b(workspace|browser work|saved work|work queue|saved sources?|memos?|collections?|local work)\b/.test(normalized) ||
    /工作区|工作台|浏览器工作|已保存|保存的|待办|任务|备忘|收藏|资料|来源/.test(normalized);
  const asksAboutIt =
    /\b(what|show|summari[sz]e|summary|overview|status|list|explain|review|todos?|tasks?|sources?|memos?|collections?|tabs?|groups?|risks?|blockers?|next steps?)\b/.test(normalized) ||
    /有什么|有哪些|总结|概览|状态|列出|看看|解释|复盘|待办|任务|资料|来源|备忘|收藏|标签|分组|风险|阻塞|下一步/.test(normalized);

  return mentionsWorkspace && asksAboutIt;
}

function classifyWorkspaceChatIntent(text) {
  const normalized = normalizeAgentText(text);

  if (/\b(todos?|to-dos?|tasks?|work queue|checklist)\b/.test(normalized) || /待办|任务|清单/.test(normalized)) {
    return "todos";
  }

  if (/\b(sources?|memos?|notes?|collections?|saved)\b/.test(normalized) || /资料|来源|备忘|笔记|收藏|已保存|保存的/.test(normalized)) {
    return "saved";
  }

  if (/\b(tabs?|groups?|open work|open pages?)\b/.test(normalized) || /标签|分组|打开的|当前打开/.test(normalized)) {
    return "tabs";
  }

  if (/\b(risks?|blockers?|cleanup|duplicates?|stale|review)\b/.test(normalized) || /风险|阻塞|清理|重复|待确认|需要检查/.test(normalized)) {
    return "risks";
  }

  return "overview";
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

async function buildWorkBriefAnswer(run) {
  const stored = await loadBrowserWorkSearchStorage();
  const brief = buildLocalWorkBrief(run, stored);

  if (!brief.steps.length) {
    return {
      status: "work-brief",
      answer: [msg("workBriefNoContext"), "", msg("workBriefBoundary")].join("\n"),
      matchedTabs: [],
      matchedTabCount: 0
    };
  }

  return {
    status: "work-brief",
    answer: buildWorkBriefMarkdown(brief),
    matchedTabs: brief.matchedTabs.slice(0, 3),
    matchedTabCount: brief.matchedTabs.length
  };
}

async function buildWorkspaceChatResult(text, run) {
  if (!isWorkspaceChatQuestion(text)) {
    return null;
  }

  const stored = await loadBrowserWorkSearchStorage();
  const state = buildLocalWorkspaceChatState(run, stored);
  const intent = classifyWorkspaceChatIntent(text);

  if (!state.hasContext) {
    return {
      status: "workspace-chat",
      answer: [msg("workspaceChatNoContext"), "", msg("workspaceChatBoundary")].join("\n"),
      matchedTabs: [],
      matchedTabCount: 0
    };
  }

  return {
    status: "workspace-chat",
    answer: buildWorkspaceChatMarkdown(state, intent),
    matchedTabs: state.matchedTabs.slice(0, 4),
    matchedTabCount: state.matchedTabs.length
  };
}

function buildLocalWorkspaceChatState(run, stored = {}) {
  const tabs = getSnapshotTabs(run);
  const groups = Array.isArray(run?.groups) ? run.groups : [];
  const tasks = normalizeBrowserWorkTasks(stored[AGENT_TASKS_KEY]).sort(sortBrowserWorkByUpdatedAt);
  const openTasks = tasks.filter((task) => task.status !== "done");
  const doneTasks = tasks.filter((task) => task.status === "done");
  const collections = normalizeBrowserWorkCollections(stored[SAVED_COLLECTIONS_KEY]).sort(sortBrowserWorkByUpdatedAt);
  const memos = normalizeBrowserWorkMemos(stored[SAVED_MEMOS_KEY]).sort(sortBrowserWorkByUpdatedAt);
  const workspaces = normalizeBrowserWorkWorkspaces(stored[SAVED_WORKSPACES_KEY]).sort(sortBrowserWorkByUpdatedAt);
  const workspaceGoal = normalizeWorkspaceGoal(stored[WORKSPACE_GOAL_KEY]);
  const inferredGoalText = workspaceGoal?.text ? "" : inferWorkspaceGoalTextFromLocalWork(run, stored);
  const inferredGoal = inferredGoalText
    ? {
        text: inferredGoalText,
        source: "local_work",
        metadataOnly: true
      }
    : null;
  const laterStates = normalizeBrowserWorkTabStates(stored[TAB_WORK_STATES_KEY])
    .filter((entry) => entry.state === "later")
    .sort(sortBrowserWorkByUpdatedAt);
  const reviewGroups = getReviewDuplicateGroups(run);
  const topGroups = groups
    .map((group) => {
      const groupTabs = tabs.filter((tab) => Number(tab.groupId) === Number(group.id));
      return {
        ...group,
        tabCount: Number(group.tabCount || groupTabs.length || group.tabIds?.length || 0),
        tabs: groupTabs
      };
    })
    .filter((group) => group.tabCount > 0)
    .sort((a, b) => b.tabCount - a.tabCount)
    .slice(0, 4);
  const goalTabs = workspaceGoal?.text ? findTabsForWorkspaceGoal(workspaceGoal.text, tabs) : [];
  const groupTabs = topGroups.flatMap((group) => group.tabs || []).slice(0, 6);
  const laterTabs = laterStates
    .map((entry) => ({
      id: toOptionalInteger(entry.tabId),
      title: entry.title || msg("untitled"),
      hostname: entry.hostname || "",
      path: entry.path || ""
    }))
    .filter((tab) => Number.isInteger(tab.id));
  const taskTabs = openTasks.flatMap((task) => getBrowserWorkItemTabs(task)).slice(0, 6);
  const matchedTabs = dedupeTabsById([...goalTabs, ...taskTabs, ...laterTabs, ...groupTabs]);

  return {
    workspaceGoal,
    inferredGoal,
    tabs,
    groups: topGroups,
    tasks,
    openTasks,
    doneTasks,
    collections,
    memos,
    workspaces,
    laterStates,
    reviewGroups,
    matchedTabs,
    hasContext: Boolean(
      tabs.length ||
      groups.length ||
      openTasks.length ||
      doneTasks.length ||
      collections.length ||
      memos.length ||
      workspaces.length ||
      laterStates.length ||
      reviewGroups.length ||
      workspaceGoal?.text
    )
  };
}

function buildWorkspaceChatMarkdown(state = {}, intent = "overview") {
  const lines = [msg("workspaceChatIntro")];

  if (state.workspaceGoal?.text) {
    lines.push("", `**${msg("workspaceChatGoalTitle")}**`, `- ${state.workspaceGoal.text}`);
  } else if (state.inferredGoal?.text) {
    lines.push(
      "",
      `**${msg("workspaceChatInferredGoalTitle")}**`,
      `- ${state.inferredGoal.text}`,
      `- ${msg("workspaceChatInferredGoalHint", [state.inferredGoal.text])}`
    );
  }

  if (intent === "todos") {
    appendWorkspaceTodoSection(lines, state);
  } else if (intent === "saved") {
    appendWorkspaceSavedSection(lines, state);
  } else if (intent === "tabs") {
    appendWorkspaceTabsSection(lines, state);
  } else if (intent === "risks") {
    appendWorkspaceRiskSection(lines, state);
  } else {
    appendWorkspaceSummarySection(lines, state);
    appendWorkspaceTodoSection(lines, state, { compact: true });
    appendWorkspaceRiskSection(lines, state, { compact: true });
  }

  const nextCommands = buildWorkspaceChatNextCommands(state, intent);
  if (nextCommands.length) {
    lines.push("", `**${msg("workspaceChatNextTitle")}**`);
    nextCommands.forEach((command) => lines.push(`- \`${command}\``));
  }

  lines.push("", msg("workspaceChatBoundary"));
  return lines.join("\n");
}

function appendWorkspaceSummarySection(lines, state = {}) {
  const parts = [
    msg("workspaceChatOpenTabsCount", [state.tabs.length]),
    msg("workspaceChatGroupsCount", [state.groups.length]),
    msg("workspaceChatOpenTodosCount", [state.openTasks.length]),
    msg("workspaceChatSavedSourcesCount", [state.memos.length + state.collections.length]),
    msg("workspaceChatSavedWorkspacesCount", [state.workspaces.length])
  ];

  lines.push("", `**${msg("workspaceChatSummaryTitle")}**`);
  parts.forEach((part) => lines.push(`- ${part}`));
}

function appendWorkspaceTodoSection(lines, state = {}, options = {}) {
  if (!state.openTasks?.length && !state.laterStates?.length) {
    if (!options.compact) {
      lines.push("", `**${msg("workspaceChatTodoTitle")}**`, `- ${msg("workspaceChatNoTodos")}`);
    }
    return;
  }

  lines.push("", `**${msg("workspaceChatTodoTitle")}**`);
  state.openTasks.slice(0, options.compact ? 3 : 6).forEach((task) => {
    const checklist = Array.isArray(task.checklist) ? task.checklist.filter(Boolean).length : 0;
    const tabs = getBrowserWorkItemTabs(task).length;
    const details = [
      checklist ? msg("workspaceChatChecklistCount", [checklist]) : "",
      tabs ? msg("workspaceChatLinkedTabsCount", [tabs]) : ""
    ].filter(Boolean).join(" · ");
    lines.push(`- **${cleanMarkdownLine(task.title || msg("todo"))}**${details ? ` — ${details}` : ""}`);
  });

  if (state.laterStates.length) {
    lines.push(`- ${msg("workspaceChatLaterTabs", [
      state.laterStates.slice(0, 3).map((entry) => cleanMarkdownLine(entry.title || entry.hostname || msg("untitled"))).join(", ")
    ])}`);
  }
}

function appendWorkspaceSavedSection(lines, state = {}, options = {}) {
  const saved = [
    ...state.memos.slice(0, options.compact ? 2 : 4).map((memo) => ({
      type: msg("browserWorkTypeMemo"),
      title: memo.title || msg("memo"),
      detail: Array.isArray(memo.tags) ? memo.tags.slice(0, 2).join(", ") : ""
    })),
    ...state.collections.slice(0, options.compact ? 2 : 4).map((collection) => ({
      type: msg("browserWorkTypeCollection"),
      title: collection.name || msg("collections"),
      detail: summarizeBrowserWorkLinkedContext(collection)
    })),
    ...state.workspaces.slice(0, options.compact ? 1 : 3).map((workspace) => ({
      type: msg("browserWorkTypeWorkspace"),
      title: workspace.name || msg("savedWorkspace"),
      detail: summarizeBrowserWorkWorkspace(workspace)
    }))
  ].slice(0, options.compact ? 4 : 8);

  if (!saved.length) {
    if (!options.compact) {
      lines.push("", `**${msg("workspaceChatSavedTitle")}**`, `- ${msg("workspaceChatNoSavedSources")}`);
    }
    return;
  }

  lines.push("", `**${msg("workspaceChatSavedTitle")}**`);
  saved.forEach((item) => {
    const detail = cleanMarkdownLine(item.detail || "");
    lines.push(`- **${cleanMarkdownLine(item.title)}** — ${item.type}${detail ? ` · ${detail}` : ""}`);
  });
}

function appendWorkspaceTabsSection(lines, state = {}, options = {}) {
  if (!state.tabs?.length && !state.groups?.length) {
    if (!options.compact) {
      lines.push("", `**${msg("workspaceChatTabsTitle")}**`, `- ${msg("workspaceChatNoOpenTabs")}`);
    }
    return;
  }

  lines.push("", `**${msg("workspaceChatTabsTitle")}**`);
  state.groups.slice(0, options.compact ? 3 : 5).forEach((group) => {
    const examples = (group.tabs || [])
      .slice(0, 2)
      .map((tab) => cleanMarkdownLine(tab.title || tab.hostname || msg("untitled")))
      .filter(Boolean)
      .join(", ");
    lines.push(`- **${cleanMarkdownLine(group.name || group.title || msg("contextUnnamedGroup"))}** — ${msg("tabsCount", [group.tabCount])}${examples ? ` · ${examples}` : ""}`);
  });

  if (!state.groups.length && state.tabs.length) {
    state.tabs.slice(0, options.compact ? 3 : 5).forEach((tab) => {
      lines.push(`- **${cleanMarkdownLine(tab.title || msg("untitled"))}**${tab.hostname ? ` — ${cleanMarkdownLine(tab.hostname)}` : ""}`);
    });
  }
}

function appendWorkspaceRiskSection(lines, state = {}, options = {}) {
  const risks = [];

  if (!state.workspaceGoal?.text) {
    risks.push(state.inferredGoal?.text ? msg("workspaceChatRiskInferredGoalNotSaved") : msg("workspaceChatRiskNoGoal"));
  }
  if (state.reviewGroups.length) {
    risks.push(msg("workspaceChatRiskDuplicates", [state.reviewGroups.length]));
  }
  if (state.openTasks.length > 6) {
    risks.push(msg("workspaceChatRiskManyTodos", [state.openTasks.length]));
  }
  if (state.laterStates.length > 8) {
    risks.push(msg("workspaceChatRiskManyLater", [state.laterStates.length]));
  }
  if (!state.memos.length && !state.collections.length) {
    risks.push(msg("workspaceChatRiskNoSavedContext"));
  }

  if (!risks.length) {
    if (!options.compact) {
      lines.push("", `**${msg("workspaceChatRiskTitle")}**`, `- ${msg("workspaceChatNoRisks")}`);
    }
    return;
  }

  lines.push("", `**${msg("workspaceChatRiskTitle")}**`);
  risks.slice(0, options.compact ? 3 : 6).forEach((risk) => lines.push(`- ${risk}`));
}

function buildWorkspaceChatNextCommands(state = {}, intent = "overview") {
  const commands = [];

  if (!state.workspaceGoal?.text) {
    commands.push(state.inferredGoal?.text ? `set goal: ${state.inferredGoal.text}` : "set goal: ...");
  }
  if (intent !== "todos") {
    commands.push("show workspace todos");
  }
  if (intent !== "saved") {
    commands.push("show saved sources");
  }
  if (state.reviewGroups?.length) {
    commands.push("what should I review?");
  }
  commands.push("what should I continue?");

  return Array.from(new Set(commands)).slice(0, 4);
}

function buildLocalWorkBrief(run, stored = {}) {
  const tabs = getSnapshotTabs(run);
  const groups = Array.isArray(run?.groups) ? run.groups : [];
  const tasks = normalizeBrowserWorkTasks(stored[AGENT_TASKS_KEY])
    .filter((task) => task.status !== "done")
    .sort(sortBrowserWorkByUpdatedAt);
  const collections = normalizeBrowserWorkCollections(stored[SAVED_COLLECTIONS_KEY]).sort(sortBrowserWorkByUpdatedAt);
  const memos = normalizeBrowserWorkMemos(stored[SAVED_MEMOS_KEY]).sort(sortBrowserWorkByUpdatedAt);
  const workspaces = normalizeBrowserWorkWorkspaces(stored[SAVED_WORKSPACES_KEY]).sort(sortBrowserWorkByUpdatedAt);
  const workspaceGoal = normalizeWorkspaceGoal(stored[WORKSPACE_GOAL_KEY]);
  const laterStates = normalizeBrowserWorkTabStates(stored[TAB_WORK_STATES_KEY])
    .filter((entry) => entry.state === "later")
    .sort(sortBrowserWorkByUpdatedAt);
  const reviewGroups = getReviewDuplicateGroups(run);
  const steps = [];
  const matchedTabs = [];
  const inferredGoalText = workspaceGoal?.text ? "" : inferWorkspaceGoalTextFromLocalWork(run, stored);
  const effectiveGoalText = workspaceGoal?.text || inferredGoalText;
  const goalMatchedTask = effectiveGoalText ? findGoalMatchedBrowserWorkItem(effectiveGoalText, tasks) : null;
  const goalMatchedMemo = effectiveGoalText ? findGoalMatchedBrowserWorkItem(effectiveGoalText, memos) : null;

  if (effectiveGoalText) {
    steps.push(msg(workspaceGoal?.text ? "workBriefGoalStep" : "workBriefInferredGoalStep", [effectiveGoalText]));
    matchedTabs.push(...findTabsForWorkspaceGoal(effectiveGoalText, tabs));

    if (goalMatchedTask) {
      const linkedTabs = getBrowserWorkItemTabs(goalMatchedTask);
      matchedTabs.push(...linkedTabs);
      steps.push(msg("workBriefGoalTodoStep", [goalMatchedTask.title || msg("todo")]));
    } else {
      steps.push(msg("workBriefGoalTodoSuggestion", [effectiveGoalText]));
    }

    if (goalMatchedMemo) {
      steps.push(msg("workBriefGoalMemoStep", [goalMatchedMemo.title || msg("memo")]));
    }
  }

  if (reviewGroups.length) {
    const reviewCopy = reviewGroups.length === 1 ? "1 group" : `${reviewGroups.length} groups`;
    steps.push(msg("workBriefDuplicateStep", [reviewCopy]));
  }

  const firstTask = tasks.find((task) => task !== goalMatchedTask);
  if (firstTask) {
    const linkedTabs = getBrowserWorkItemTabs(firstTask);
    matchedTabs.push(...linkedTabs);
    steps.push(msg(
      linkedTabs.length ? "workBriefTodoStepWithTabs" : "workBriefTodoStep",
      linkedTabs.length ? [firstTask.title || msg("todo"), linkedTabs.length] : [firstTask.title || msg("todo")]
    ));
  }

  if (laterStates.length) {
    const laterTabs = laterStates
      .map((entry) => ({
        id: toOptionalInteger(entry.tabId),
        title: entry.title || msg("untitled"),
        hostname: entry.hostname || "",
        path: entry.path || ""
      }))
      .filter((tab) => Number.isInteger(tab.id));
    matchedTabs.push(...laterTabs);
    steps.push(msg("workBriefLaterStep", [
      laterStates.slice(0, 3).map((entry) => entry.title || entry.hostname || msg("untitled")).join(", ")
    ]));
  }

  const group = pickWorkBriefGroup(groups, tabs);
  if (group) {
    const groupTabs = tabs.filter((tab) => Number(tab.groupId) === Number(group.id)).slice(0, 3);
    matchedTabs.push(...groupTabs.map((tab) => ({
      id: toOptionalInteger(tab.id),
      title: tab.title || msg("untitled"),
      hostname: tab.hostname || "",
      path: tab.path || ""
    })));
    steps.push(msg("workBriefGroupStep", [
      group.name || group.title || msg("contextUnnamedGroup"),
      Number(group.tabCount || groupTabs.length || group.tabIds?.length || 0)
    ]));
  }

  const workspace = workspaces[0];
  if (workspace) {
    steps.push(msg("workBriefWorkspaceStep", [workspace.name || msg("savedWorkspace")]));
  }

  const collection = collections[0];
  if (collection) {
    steps.push(msg("workBriefCollectionStep", [collection.name || msg("collections")]));
  }

  const memo = memos.find((item) => item !== goalMatchedMemo);
  if (memo) {
    steps.push(msg("workBriefMemoStep", [memo.title || msg("memo")]));
  }

  if (!steps.length && activeSidebarContext?.scope === "current_tab" && (activeSidebarContext.title || activeSidebarContext.hostname)) {
    steps.push(msg("workBriefCurrentTabStep", [
      activeSidebarContext.title || activeSidebarContext.hostname || msg("currentTab")
    ]));
  }

  return {
    steps: steps.slice(0, 4),
    matchedTabs: dedupeTabsById(matchedTabs.filter((tab) => Number.isInteger(tab.id)))
  };
}

function findGoalMatchedBrowserWorkItem(goalText = "", items = []) {
  const tokens = tokenizeBrowserWorkQuery(goalText).slice(0, 8);
  if (!tokens.length) return null;

  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const searchText = [
        item.title,
        item.sourcePrompt,
        item.body,
        summarizeBrowserWorkLinkedContext(item),
        ...(Array.isArray(item.tags) ? item.tags : []),
        ...(Array.isArray(item.checklist) ? item.checklist : [])
      ].filter(Boolean).join(" ");
      const haystack = tokenizeBrowserWorkQuery(searchText);
      const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || sortBrowserWorkByUpdatedAt(a.item, b.item))
    .map((entry) => entry.item)[0] || null;
}

function buildWorkBriefMarkdown(brief = {}) {
  const lines = [
    msg("workBriefIntro"),
    "",
    ...brief.steps.map((step) => `- ${step}`),
    "",
    msg("workBriefAskCommand"),
    "",
    msg("workBriefBoundary")
  ];

  return lines.join("\n");
}

function findTabsForWorkspaceGoal(goalText = "", tabs = []) {
  const tokens = tokenizeBrowserWorkQuery(goalText).slice(0, 8);
  if (!tokens.length) return [];

  return (Array.isArray(tabs) ? tabs : [])
    .map((tab) => {
      const haystack = tokenizeBrowserWorkQuery([
        tab.title,
        tab.hostname,
        tab.path,
        tab.groupName,
        tab.groupTitle
      ].filter(Boolean).join(" "));
      const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
      return { tab, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ tab }) => ({
      id: toOptionalInteger(tab.id),
      title: tab.title || msg("untitled"),
      hostname: tab.hostname || "",
      path: tab.path || ""
    }))
    .filter((tab) => Number.isInteger(tab.id));
}

function getBrowserWorkItemTabs(item = {}) {
  return (Array.isArray(item.tabs) ? item.tabs : [])
    .map((tab) => ({
      id: toOptionalInteger(tab.id),
      title: tab.title || msg("untitled"),
      hostname: tab.hostname || "",
      path: tab.path || ""
    }))
    .filter((tab) => Number.isInteger(tab.id));
}

function pickWorkBriefGroup(groups = [], tabs = []) {
  const usableGroups = (Array.isArray(groups) ? groups : [])
    .filter((group) => Number(group.id) !== -1 && !/^(misc|other|ungrouped)$/i.test(String(group.name || group.title || "")));

  if (!usableGroups.length) return null;

  const activeGroup = usableGroups.find((group) => tabs.some((tab) => tab.active && Number(tab.groupId) === Number(group.id)));
  if (activeGroup) return activeGroup;

  return [...usableGroups].sort((a, b) => Number(b.tabCount || b.tabIds?.length || 0) - Number(a.tabCount || a.tabIds?.length || 0))[0] || null;
}

function sortBrowserWorkByUpdatedAt(a = {}, b = {}) {
  const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
  const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
  return bTime - aTime;
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
    internal: "internal",
    user: msg("userProtected"),
    group: "Protected group",
    domain: "Protected domain"
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

async function collectSavedSourcesForWriting(text = "") {
  let stored = {};
  try {
    stored = await chrome.storage.local.get([SAVED_COLLECTIONS_KEY, SAVED_MEMOS_KEY]);
  } catch {
    stored = {};
  }

  const query = extractSavedSourcesWritingQuery(text);
  const tokens = tokenizeBrowserWorkQuery(query);
  const candidates = [
    ...normalizeBrowserWorkMemos(stored[SAVED_MEMOS_KEY]).map(buildSavedSourceCandidateFromMemo),
    ...normalizeBrowserWorkCollections(stored[SAVED_COLLECTIONS_KEY]).map(buildSavedSourceCandidateFromCollection)
  ]
    .filter((source) => source.title || source.snippet || source.bodyExcerpt)
    .map((source) => ({
      ...source,
      score: tokens.length ? scoreSavedSourceCandidate(source, tokens) : 0
    }));

  const sorted = tokens.length
    ? candidates
      .filter((source) => source.score > 0)
      .sort((a, b) => b.score - a.score || sortBrowserWorkByUpdatedAt(a, b))
    : candidates.sort(sortBrowserWorkByUpdatedAt);

  return sorted.slice(0, 5).map(({ score, ...source }) => source);
}

function buildSavedSourceCandidateFromMemo(memo = {}) {
  const sources = sanitizeMemoSources(memo.sources);
  const firstSource = sources[0] || {};
  return {
    sourceId: String(memo.id || `memo-${hashMemoString(memo.title || memo.body || "")}`).slice(0, 80),
    type: "memo",
    title: sanitizeMemoTitle(memo.title || msg("memo")),
    hostname: firstSource.hostname || "",
    path: firstSource.path || "",
    tags: sanitizeMemoTags(memo.tags),
    snippet: summarizeBrowserWorkLinkedContext(memo).slice(0, 500),
    bodyExcerpt: sanitizeMemoBody(memo.body || "").slice(0, 900),
    sourceNotes: sources
      .map((source) => [source.title, source.hostname, source.snippet].filter(Boolean).join(" · "))
      .filter(Boolean)
      .slice(0, 4),
    createdAt: memo.createdAt || "",
    updatedAt: memo.updatedAt || memo.createdAt || ""
  };
}

function buildSavedSourceCandidateFromCollection(collection = {}) {
  const sources = sanitizeMemoSources(collection.sources);
  const firstSource = sources[0] || {};
  return {
    sourceId: String(collection.id || `collection-${hashMemoString(collection.name || "")}`).slice(0, 80),
    type: "collection",
    title: sanitizeMemoTitle(collection.name || msg("collections")),
    hostname: firstSource.hostname || "",
    path: firstSource.path || "",
    tags: sanitizeMemoTags([collection.source, firstSource.sourceType].filter(Boolean)),
    snippet: summarizeBrowserWorkLinkedContext(collection).slice(0, 700),
    bodyExcerpt: "",
    sourceNotes: sources
      .map((source) => [source.title, source.hostname, source.snippet].filter(Boolean).join(" · "))
      .filter(Boolean)
      .slice(0, 4),
    createdAt: collection.createdAt || "",
    updatedAt: collection.updatedAt || collection.createdAt || ""
  };
}

function scoreSavedSourceCandidate(source = {}, tokens = []) {
  const title = String(source.title || "").toLowerCase();
  const hostname = String(source.hostname || "").toLowerCase();
  const snippet = String(source.snippet || "").toLowerCase();
  const body = String(source.bodyExcerpt || "").toLowerCase();
  const tags = (Array.isArray(source.tags) ? source.tags : []).join(" ").toLowerCase();
  const notes = (Array.isArray(source.sourceNotes) ? source.sourceNotes : []).join(" ").toLowerCase();
  let score = 0;

  tokens.forEach((token) => {
    if (title.includes(token)) score += 6;
    if (tags.includes(token)) score += 4;
    if (hostname.includes(token)) score += 3;
    if (snippet.includes(token)) score += 3;
    if (body.includes(token)) score += 2;
    if (notes.includes(token)) score += 2;
  });

  return score;
}

function extractSavedSourcesWritingQuery(text = "") {
  const value = normalizeAgentText(text);
  const patterns = [
    /\b(?:about|for|on|regarding)\s+(.+)$/,
    /\b(?:围绕|关于|针对|有关)\s*(.+)$/
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const query = sanitizeBrowserWorkSearchQuery(match?.[1] || "");
    if (query && !/\b(saved|local)\s+(sources?|memos?|collections?)\b/.test(query)) return query;
  }

  return sanitizeBrowserWorkSearchQuery(value
    .replace(/\b(draft|write|compose|prepare|email|message|reply|response|comment|update|status|memo|note|report|post|copy)\b/g, " ")
    .replace(/\b(from|using|with|based on|my|saved|local|sources?|memos?|notes?|collections?|work|research|context)\b/g, " ")
    .replace(/(?:起草|草拟|写|生成|撰写|邮件|消息|回复|评论|更新|进展|备忘|笔记|报告|文案|基于|根据|从|已保存|保存的|本地|来源|资料|收藏|上下文|研究)/g, " "));
}

async function buildBrowserWorkSearchResult(text, run) {
  const query = extractBrowserWorkSearchQuery(text);

  if (!query) {
    return null;
  }

  const stored = await loadBrowserWorkSearchStorage();
  const results = findBrowserWorkMatches(query, run, stored);
  const matchedTabs = results
    .filter((result) => result.type === "tab" && Number.isInteger(result.tabId))
    .map((result) => ({
      id: result.tabId,
      title: result.title,
      hostname: result.hostname,
      path: result.path
    }));

  if (!results.length) {
    return {
      status: "browser-work-search",
      answer: [
        msg("browserWorkSearchNoResults", [query]),
        "",
        msg("browserWorkSearchBoundary")
      ].join("\n"),
      results: [],
      matchedTabs: [],
      matchedTabCount: 0
    };
  }

  return {
    status: "browser-work-search",
    answer: buildBrowserWorkSearchMarkdown(query, results),
    results,
    matchedTabs: matchedTabs.slice(0, 5),
    matchedTabCount: matchedTabs.length
  };
}

async function loadBrowserWorkSearchStorage() {
  try {
    return await chrome.storage.local.get([
      AGENT_TASKS_KEY,
      SAVED_COLLECTIONS_KEY,
      SAVED_MEMOS_KEY,
      SAVED_WORKSPACES_KEY,
      TAB_WORK_STATES_KEY,
      WORKSPACE_GOAL_KEY
    ]);
  } catch {
    return {};
  }
}

function findBrowserWorkMatches(query, run, stored = {}) {
  const tokens = tokenizeBrowserWorkQuery(query);

  if (!tokens.length) return [];

  return buildBrowserWorkSearchCorpus(run, stored)
    .map((item) => ({
      ...item,
      score: scoreBrowserWorkSearchItem(item, tokens)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || browserWorkTypePriority(a.type) - browserWorkTypePriority(b.type))
    .slice(0, BROWSER_WORK_SEARCH_RESULT_LIMIT);
}

function buildBrowserWorkSearchCorpus(run, stored = {}) {
  const corpus = [];
  const tabs = getSnapshotTabs(run);
  const groupsById = new Map(
    (Array.isArray(run?.groups) ? run.groups : [])
      .map((group) => [Number(group.id), group])
      .filter(([groupId]) => Number.isInteger(groupId))
  );

  tabs.forEach((tab) => {
    const group = groupsById.get(Number(tab.groupId));
    addBrowserWorkSearchItem(corpus, {
      type: "tab",
      title: tab.title || msg("untitled"),
      subtitle: [tab.hostname, group?.name || tab.groupTitle].filter(Boolean).join(" · "),
      description: tab.path || "",
      hostname: tab.hostname || "",
      path: tab.path || "",
      tabId: toOptionalInteger(tab.id),
      active: Boolean(tab.active)
    });
  });

  Array.from(groupsById.values()).forEach((group) => {
    const groupTabs = tabs.filter((tab) => Number(tab.groupId) === Number(group.id));
    addBrowserWorkSearchItem(corpus, {
      type: "group",
      title: group.name || group.title || msg("contextUnnamedGroup"),
      subtitle: msg("tabsCount", [Number(group.tabCount || groupTabs.length || group.tabIds?.length || 0)]),
      description: [
        group.reason,
        ...groupTabs.slice(0, 4).map((tab) => tab.title || tab.hostname).filter(Boolean)
      ].filter(Boolean).join(" · "),
      groupId: toOptionalInteger(group.id)
    });
  });

  getReviewDuplicateGroups(run).forEach((group) => {
    addBrowserWorkSearchItem(corpus, {
      type: "duplicate",
      title: group.label || msg("duplicates"),
      subtitle: [msg("review"), group.type].filter(Boolean).join(" · "),
      description: msg("tabsCount", [Number(group.tabCount || group.tabIds?.length || 0)])
    });
  });

  normalizeBrowserWorkTasks(stored[AGENT_TASKS_KEY]).forEach((task) => {
    addBrowserWorkSearchItem(corpus, {
      type: "todo",
      title: task.title || msg("todo"),
      subtitle: [msg("workQueue"), task.status || "open"].filter(Boolean).join(" · "),
      description: summarizeBrowserWorkLinkedContext(task),
      status: task.status || "open"
    });
  });

  normalizeBrowserWorkCollections(stored[SAVED_COLLECTIONS_KEY]).forEach((collection) => {
    addBrowserWorkSearchItem(corpus, {
      type: "collection",
      title: collection.name || msg("collections"),
      subtitle: msg("collections"),
      description: summarizeBrowserWorkLinkedContext(collection)
    });
  });

  normalizeBrowserWorkMemos(stored[SAVED_MEMOS_KEY]).forEach((memo) => {
    addBrowserWorkSearchItem(corpus, {
      type: "memo",
      title: memo.title || msg("memo"),
      subtitle: [msg("memos"), ...(Array.isArray(memo.tags) ? memo.tags.slice(0, 2) : [])].filter(Boolean).join(" · "),
      description: summarizeBrowserWorkLinkedContext(memo),
      status: memo.source || "saved_memo"
    });
  });

  normalizeBrowserWorkWorkspaces(stored[SAVED_WORKSPACES_KEY]).forEach((workspace) => {
    const summary = workspace.summary || {};
    const groupCount = Number(summary.groupCount || workspace.groups?.length || 0);
    const tabCount = Number(summary.tabCount || workspace.tabs?.length || 0);
    addBrowserWorkSearchItem(corpus, {
      type: "workspace",
      title: workspace.name || msg("savedWorkspace"),
      subtitle: `${msg("savedWorkspace")} · ${groupCount} groups · ${msg("tabsCount", [tabCount])}`,
      description: summarizeBrowserWorkWorkspace(workspace)
    });
  });

  normalizeBrowserWorkTabStates(stored[TAB_WORK_STATES_KEY]).forEach((entry) => {
    addBrowserWorkSearchItem(corpus, {
      type: "tab_state",
      title: entry.title || msg("untitled"),
      subtitle: [formatTabWorkState(entry.state), entry.hostname].filter(Boolean).join(" · "),
      description: entry.path || "",
      hostname: entry.hostname || "",
      path: entry.path || "",
      tabId: toOptionalInteger(entry.tabId),
      status: entry.state
    });
  });

  return corpus;
}

function addBrowserWorkSearchItem(corpus, item) {
  const cleanItem = {
    ...item,
    title: String(item.title || "").slice(0, 180),
    subtitle: String(item.subtitle || "").slice(0, 180),
    description: String(item.description || "").replace(/\s+/g, " ").trim().slice(0, 260),
    hostname: String(item.hostname || "").slice(0, 120),
    path: sanitizeBrowserWorkPath(item.path || "")
  };
  cleanItem.searchText = [
    cleanItem.type,
    cleanItem.title,
    cleanItem.subtitle,
    cleanItem.description,
    cleanItem.hostname,
    cleanItem.path,
    cleanItem.status
  ].filter(Boolean).join(" ").toLowerCase();
  corpus.push(cleanItem);
}

function normalizeBrowserWorkTasks(value) {
  return (Array.isArray(value) ? value : [])
    .filter((task) => task && typeof task === "object" && task.status !== "archived")
    .slice(0, MAX_AGENT_ITEMS);
}

function normalizeBrowserWorkCollections(value) {
  return (Array.isArray(value) ? value : [])
    .filter((collection) => collection && typeof collection === "object")
    .slice(0, MAX_AGENT_ITEMS);
}

function normalizeBrowserWorkMemos(value) {
  return (Array.isArray(value) ? value : [])
    .filter((memo) => memo && typeof memo === "object")
    .slice(0, MAX_AGENT_ITEMS);
}

function normalizeBrowserWorkWorkspaces(value) {
  return (Array.isArray(value) ? value : [])
    .filter((workspace) => workspace && typeof workspace === "object")
    .slice(0, MAX_AGENT_ITEMS);
}

function normalizeBrowserWorkTabStates(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.values(source)
    .filter((entry) => entry && typeof entry === "object" && TAB_WORK_STATES.has(entry.state))
    .slice(0, MAX_AGENT_ITEMS);
}

function summarizeBrowserWorkLinkedContext(item = {}) {
  const tabTitles = (Array.isArray(item.tabs) ? item.tabs : [])
    .map((tab) => [tab.title, tab.hostname].filter(Boolean).join(" · "))
    .filter(Boolean);
  const sources = (Array.isArray(item.sources) ? item.sources : [])
    .map((source) => [source.title, source.hostname, source.snippet].filter(Boolean).join(" · "))
    .filter(Boolean);
  const checklist = (Array.isArray(item.checklist) ? item.checklist : [])
    .map((step) => String(step || "").trim())
    .filter(Boolean);
  const memoBody = String(item.body || "").trim();
  const tags = Array.isArray(item.tags)
    ? item.tags.map((tag) => String(tag || "").trim()).filter(Boolean)
    : [];

  return [...tabTitles, ...sources, memoBody, ...tags, ...checklist].slice(0, 5).join(" · ");
}

function summarizeBrowserWorkWorkspace(workspace = {}) {
  const groups = (Array.isArray(workspace.groups) ? workspace.groups : [])
    .map((group) => group.name || group.title)
    .filter(Boolean);
  const tabs = (Array.isArray(workspace.tabs) ? workspace.tabs : [])
    .map((tab) => [tab.title, tab.hostname].filter(Boolean).join(" · "))
    .filter(Boolean);

  return [...groups, ...tabs].slice(0, 6).join(" · ");
}

function tokenizeBrowserWorkQuery(query) {
  const normalized = normalizeAgentText(query);
  const chunks = normalized.match(/[\u4e00-\u9fff]+|[a-z0-9][a-z0-9._-]*/gi) || [];
  const tokens = [];

  chunks.forEach((chunk) => {
    const value = chunk.toLowerCase();
    if (/^[\u4e00-\u9fff]+$/.test(value) && value.length > 2) {
      tokens.push(value);
      for (let index = 0; index < value.length - 1; index += 1) {
        tokens.push(value.slice(index, index + 2));
      }
      return;
    }

    if (value.length >= 2) {
      tokens.push(value);
    }
  });

  return Array.from(new Set(tokens)).slice(0, 8);
}

function scoreBrowserWorkSearchItem(item, tokens) {
  let score = 0;
  const title = String(item.title || "").toLowerCase();
  const subtitle = String(item.subtitle || "").toLowerCase();
  const description = String(item.description || "").toLowerCase();
  const hostname = String(item.hostname || "").toLowerCase();
  const path = String(item.path || "").toLowerCase();
  const haystack = item.searchText || [title, subtitle, description, hostname, path, item.status].filter(Boolean).join(" ");

  tokens.forEach((token) => {
    if (title.includes(token)) score += 6;
    if (hostname.includes(token)) score += 4;
    if (subtitle.includes(token)) score += 3;
    if (path.includes(token)) score += 2;
    if (description.includes(token)) score += 2;
    if (!haystack.includes(token)) score -= 1.5;
  });

  if (item.active) score += 0.5;
  if (item.type === "tab") score += 0.75;
  if (item.type === "tab_state") score += 0.2;
  if (item.status === "open" || item.status === "later") score += 0.25;

  return score;
}

function browserWorkTypePriority(type) {
  const priorities = {
    tab: 1,
    tab_state: 2,
    todo: 3,
    memo: 4,
    group: 5,
    collection: 6,
    workspace: 7,
    duplicate: 8
  };

  return priorities[type] || 20;
}

function buildBrowserWorkSearchMarkdown(query, results = []) {
  const lines = [
    msg("browserWorkSearchAnswer", [results.length, query]),
    ""
  ];

  results.slice(0, BROWSER_WORK_SEARCH_RESULT_LIMIT).forEach((result) => {
    lines.push(formatBrowserWorkSearchResultLine(result));
  });

  lines.push("");
  lines.push(msg("browserWorkSearchBoundary"));
  return lines.join("\n");
}

function formatBrowserWorkSearchResultLine(result = {}) {
  const typeLabel = formatBrowserWorkSearchType(result.type);
  const details = [typeLabel, result.subtitle, result.description]
    .filter(Boolean)
    .join(" · ");

  return `- **${result.title || typeLabel}**${details ? ` — ${details}` : ""}`;
}

function formatBrowserWorkSearchType(type) {
  const keyByType = {
    tab: "browserWorkTypeTab",
    group: "browserWorkTypeGroup",
    todo: "browserWorkTypeTodo",
    memo: "browserWorkTypeMemo",
    collection: "browserWorkTypeCollection",
    workspace: "browserWorkTypeWorkspace",
    tab_state: "browserWorkTypeTabState",
    duplicate: "browserWorkTypeDuplicate"
  };

  return msg(keyByType[type] || "browserWorkTypeItem");
}

function extractBrowserWorkSearchQuery(text) {
  const normalized = normalizeAgentText(text);
  const patterns = [
    /^(?:find|search|show|list)\s+(?:browser\s+work|saved\s+work|local\s+work|workspaces?|collections?|todos?|tasks?|groups?)\s*(?:for|about|matching)?\s*(.+)$/,
    /^(?:find|search|show|list)\s+(?:tabs?\s+)?(?:for\s+)?(.+)$/,
    /^(?:open|focus|go to)\s+(?!dashboard\b)(?:tab\s+)?(.+)$/,
    /^(?:找|查找|搜索|打开|定位)(?:一下)?(?:本地工作|浏览器工作|已保存工作|工作区|待办|任务|收藏|分组|标签页|标签|tab)?(?:里)?(?:的)?(.+)$/
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const query = sanitizeBrowserWorkSearchQuery(match?.[1] || "");

    if (query) {
      return query;
    }
  }

  return "";
}

function sanitizeBrowserWorkSearchQuery(value) {
  const raw = String(value || "")
    .replace(/[?？。.!！]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const cleaned = raw
    .replace(/\b(browser work|saved work|local work|open tabs?|tabs?|tab|please|for|about|matching)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (cleaned || raw).slice(0, 80);
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
  if (isExplicitBrowserWorkSearchText(text)) return "";
  return extractBrowserWorkSearchQuery(text);
}

function isExplicitBrowserWorkSearchText(text = "") {
  const normalized = normalizeAgentText(text);
  return (
    /\b(browser work|saved work|local work|workspaces?|collections?|memos?|notes?|todos?|tasks?|work queue|saved sources?|local sources?)\b/.test(normalized) ||
    /(?:本地工作|浏览器工作|已保存工作|工作区|待办|任务|备忘|笔记|收藏|资料|来源)/.test(normalized)
  );
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

  if (button.dataset.chatAction === "decision-from-search-results") {
    await draftDecisionFromSearchResults(msg("searchResultsDecisionDefaultQuestion"));
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

  if (button.dataset.chatAction === "fetch-detected-link") {
    await fetchDetectedLink(Number(button.dataset.linkIndex));
    return;
  }

  if (button.dataset.chatAction === "todo-compare-result") {
    await createTodoFromCompareResult();
    return;
  }

  if (button.dataset.chatAction === "research-compare-missing") {
    await researchCompareMissingInfo();
    return;
  }

  if (button.dataset.chatAction === "todo-research-brief") {
    await createTodoFromResearchBrief();
    return;
  }

  if (button.dataset.chatAction === "research-brief-missing") {
    await researchBriefMissingInfo();
    return;
  }

  if (button.dataset.chatAction === "todo-decision-brief") {
    await createTodoFromDecisionBrief();
    return;
  }

  if (button.dataset.chatAction === "decision-brief-missing") {
    await researchDecisionBriefMissingInfo();
    return;
  }

  if (button.dataset.chatAction === "todo-page-review") {
    await createTodoFromPageReview();
    return;
  }

  if (button.dataset.chatAction === "copy-writing-draft") {
    await copyWritingDraft(button.dataset.copyId || "");
    return;
  }

  if (button.dataset.chatAction === "copy-smart-fill-table") {
    await copySmartFillTable(button.dataset.copyId || "", "markdown");
    return;
  }

  if (button.dataset.chatAction === "copy-smart-fill-csv") {
    await copySmartFillTable(button.dataset.copyId || "", "csv");
    return;
  }

  if (button.dataset.chatAction === "todo-smart-fill") {
    await createTodoFromSmartFill();
    return;
  }

  if (button.dataset.chatAction === "todo-ai-triage") {
    await createTodoFromAITriage("create todo from latest triage");
    return;
  }

  if (button.dataset.chatAction === "set-workspace-goal") {
    await setWorkspaceGoalFromTriage();
    return;
  }

  if (button.dataset.chatAction === "save-memo") {
    await saveMemoFromAssistantAnswer(button.dataset.memoId || "");
    return;
  }

  if (button.dataset.chatAction === "show-run-transcript") {
    await showAgentRunTranscript(button.dataset.transcriptId || "");
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

async function fetchDetectedLink(index) {
  const source = getDetectedLinkByIndex(index);

  if (!source?.url) {
    renderChatPanel({
      status: "error",
      answer: msg("browserWorkSourceUnavailable")
    });
    return;
  }

  appendChatMessage({
    role: "assistant",
    status: "tool-card",
    html: renderToolCard(buildFetchLinkToolCard(source, "running")),
    text: "",
    includeInAIAgentContext: false
  });

  setBusy(true);
  renderChatPanel({
    status: "loading",
    answer: msg("fetchingLink", [source.hostname || msg("linkedSource")])
  });

  let response;
  try {
    response = await chrome.runtime.sendMessage({
      type: "FETCH_USER_LINK",
      url: source.url,
      question: chatInput?.value?.trim() || msg("fetchLinkDefaultQuestion"),
      requestPermission: true
    });
  } catch (error) {
    response = {
      ok: false,
      error: error?.message || msg("fetchLinkFailed")
    };
  } finally {
    setBusy(false);
  }

  if (response?.ok) {
    latestFetchedLinkResult = sanitizeFetchedLinkResultForLocalWork(response.result, source);
    updateLatestToolCard(buildFetchLinkToolCard(source, "completed", response.result));
    renderChatPanel({
      status: "link-fetched",
      answer: buildFetchedLinkMarkdown(response.result),
      summary: response.result,
      link: latestFetchedLinkResult
    });
    clearComposer();
    return;
  }

  updateLatestToolCard(buildFetchLinkToolCard(source, "error"));
  renderChatPanel({
    status: "error",
    answer: response?.error || msg("fetchLinkFailed")
  });
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

function buildFetchLinkToolCard(source = {}, status = "running", result = {}) {
  const toolPermissions = ["fetch_user_link_after_permission"];
  const blockedActions = ["background_crawl", "auto_submit", "mutate_page", "full_url_upload", "cloud_storage"];

  return {
    toolName: "fetch_user_link",
    label: msg("toolCardFetchLink"),
    scope: {
      type: "pasted_link",
      hostname: String(source.hostname || result.hostname || "").slice(0, 120),
      readTabCount: status === "completed" ? 1 : 0,
      skippedTabCount: status === "error" ? 1 : 0,
      maxTabs: 1
    },
    dataUsed: ["user_provided_url", "fetched_visible_text"],
    storage: "session_only_until_saved",
    toolPermissions,
    toolPermissionLabels: formatToolPermissionLabels(toolPermissions),
    blockedActions,
    blockedActionLabels: formatBlockedActionLabels(blockedActions),
    security: {
      pageTextTrusted: false
    },
    status,
    skippedReasons: status === "error" ? ["fetch_failed"] : []
  };
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

async function copyWritingDraft(copyId) {
  const draft = copyCandidatesById.get(copyId);

  if (!draft) {
    renderChatPanel({
      status: "error",
      answer: msg("writingDraftUnavailable")
    });
    return;
  }

  try {
    await navigator.clipboard.writeText(draft);
    renderChatPanel({
      status: "info",
      answer: msg("writingDraftCopied")
    });
  } catch {
    renderChatPanel({
      status: "error",
      answer: msg("couldNotBuildSafeAction")
    });
  }
}

async function copySmartFillTable(copyId, format = "markdown") {
  const tableText = copyCandidatesById.get(copyId);

  if (!tableText) {
    renderChatPanel({
      status: "error",
      answer: msg("smartFillTableUnavailable")
    });
    return;
  }

  try {
    await navigator.clipboard.writeText(tableText);
    renderChatPanel({
      status: "info",
      answer: format === "csv" ? msg("smartFillCsvCopied") : msg("smartFillTableCopied")
    });
  } catch {
    renderChatPanel({
      status: "error",
      answer: msg("couldNotBuildSafeAction")
    });
  }
}

async function createTodoFromSmartFill() {
  const smartFillResult = getActiveSmartFillResult();

  if (!smartFillResult?.summary) {
    renderChatPanel({
      status: "error",
      answer: msg("smartFillUnavailable")
    });
    return;
  }

  setBusy(true);
  try {
    const summary = smartFillResult.summary;
    const context = sanitizeMemoContext(activeSidebarContext) || {};
    const rows = Array.isArray(summary.rowClassifications) ? summary.rowClassifications.slice(0, 8) : [];
    const fallbackRows = Array.isArray(summary.tableRows)
      ? summary.tableRows.slice(0, 8).map((row) => ({
          rowLabel: row[0] || msg("smartFillRow"),
          classification: "",
          reason: "",
          nextAction: "Review this extracted row."
        }))
      : [];
    const candidates = rows.length ? rows : fallbackRows;
    const checklist = candidates
      .map((row) => cleanChecklistItem(row.nextAction || row.rowLabel || "Review extracted row"))
      .filter(Boolean)
      .slice(0, 8);
    const now = new Date().toISOString();
    const task = {
      id: `task-${Date.now()}`,
      title: msg("todoReviewSmartFillRows", [summary.tableTitle || summary.title || msg("smartFillTable")]),
      status: "open",
      source: "smart_fill_lite",
      sourcePrompt: sanitizeTodoSourcePrompt(summary.question || "smart fill selected region"),
      contextScope: "current_tab",
      createdAt: now,
      updatedAt: now,
      tabIds: Number.isInteger(context.tabId) ? [context.tabId] : [],
      tabs: [],
      checklist: checklist.length ? checklist : [msg("agentTodoFallbackChecklist")],
      pageAgent: {
        workflow: "smart_fill_lite",
        provider: String(summary.provider || "").slice(0, 80),
        aiUsed: Boolean(summary.aiUsed),
        extractedRows: Array.isArray(summary.tableRows) ? summary.tableRows.length : 0
      }
    };
    const stored = await chrome.storage.local.get(AGENT_TASKS_KEY);
    const existingTasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];

    await chrome.storage.local.set({
      [AGENT_TASKS_KEY]: [task, ...existingTasks].slice(0, MAX_AGENT_ITEMS)
    });

    renderChatPanel({
      status: "todo-created",
      answer: buildChecklistTodoMarkdown(task),
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

async function saveMemoFromAssistantAnswer(memoId) {
  const candidate = memoCandidatesById.get(memoId);

  if (!candidate) {
    renderChatPanel({
      status: "error",
      answer: msg("memoUnavailable")
    });
    return;
  }

  setBusy(true);

  try {
    const rawTabs = shouldMemoLinkTabs(candidate.context)
      ? await getTodoTabsForSidebarContext(candidate.context)
      : [];
    const tabs = dedupeTabsById(rawTabs)
      .slice(0, MAX_TODO_LINKED_TABS)
      .map((tab) => sanitizeTabForSidebarWork(tab, candidate.context))
      .filter((tab) => Number.isInteger(tab.id));
    const memo = buildSavedMemoFromCandidate(candidate, tabs);
    const stored = await chrome.storage.local.get(SAVED_MEMOS_KEY);
    const existingMemos = normalizeBrowserWorkMemos(stored[SAVED_MEMOS_KEY]);

    await chrome.storage.local.set({
      [SAVED_MEMOS_KEY]: [memo, ...existingMemos].slice(0, MAX_AGENT_ITEMS)
    });

    renderChatPanel({
      status: "memo-saved",
      answer: buildMemoSavedMarkdown(memo),
      memo
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

async function showAgentRunTranscript(transcriptId = "") {
  const localId = String(transcriptId || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  let transcript = agentRunTranscriptsById.get(localId);

  if (!transcript) {
    const stored = await chrome.storage.local.get(AGENT_RUN_TRANSCRIPTS_KEY);
    transcript = normalizeAgentRunTranscripts(stored[AGENT_RUN_TRANSCRIPTS_KEY]).find((item) => item.id === localId) || null;
  }

  if (!transcript) {
    renderChatPanel({
      status: "error",
      answer: msg("runLogUnavailable")
    });
    return;
  }

  renderChatPanel({
    status: "run-transcript",
    transcript,
    answer: buildAgentRunTranscriptMarkdown(transcript)
  });
}

function shouldMemoLinkTabs(context = {}) {
  return ["current_tab", "selected_tabs", "current_group", "current_window"].includes(context?.scope);
}

function buildSavedMemoFromCandidate(candidate = {}, tabs = []) {
  const now = new Date().toISOString();
  return {
    id: `memo-${Date.now()}`,
    title: sanitizeMemoTitle(candidate.title || msg("memo")),
    body: sanitizeMemoBody(candidate.body || ""),
    source: String(candidate.source || "assistant_answer").slice(0, 60),
    tags: sanitizeMemoTags(candidate.tags),
    createdAt: now,
    updatedAt: now,
    context: sanitizeMemoContext(candidate.context),
    provider: String(candidate.provider || "").slice(0, 80),
    aiUsed: Boolean(candidate.aiUsed),
    tabIds: tabs.map((tab) => tab.id).filter(Number.isInteger),
    tabs,
    sources: sanitizeMemoSources(candidate.sources)
  };
}

function buildMemoSavedMarkdown(memo = {}) {
  return [
    msg("memoSaved", [memo.title || msg("memo")]),
    "",
    `- ${msg("memoSavedBoundary")}`,
    `- ${msg("memoSearchHint")}`
  ].join("\n");
}

function renderSaveMemoActionRow(candidate, className = "memo-action-row") {
  const button = renderSaveMemoButton(candidate);
  if (!button) return "";
  return `<div class="chat-action-row ${escapeHtml(className)}">${button}</div>`;
}

function renderSaveMemoButton(candidate) {
  const memoId = registerMemoCandidate(candidate);
  if (!memoId) return "";

  return `<button class="secondary-button" type="button" data-chat-action="save-memo" data-memo-id="${escapeHtml(memoId)}">${escapeHtml(msg("saveMemo"))}</button>`;
}

function appendRunTranscriptAction(actionRow = "", transcript = null) {
  const button = renderAgentRunTranscriptButton(transcript);
  if (!button) return actionRow || "";
  if (!actionRow) return `<div class="chat-action-row run-transcript-action-row">${button}</div>`;

  return actionRow.replace(/<\/div>\s*$/, `${button}</div>`);
}

function renderAgentRunTranscriptButton(transcript = null) {
  const transcriptId = registerAgentRunTranscript(transcript);
  if (!transcriptId) return "";

  return `<button class="secondary-button" type="button" data-chat-action="show-run-transcript" data-transcript-id="${escapeHtml(transcriptId)}">${escapeHtml(msg("runLog"))}</button>`;
}

function registerMemoCandidate(candidate = {}) {
  const body = sanitizeMemoBody(candidate.body || candidate.answer || "");
  if (!body) return "";

  const normalizedCandidate = {
    title: sanitizeMemoTitle(candidate.title || inferMemoTitle(candidate, body)),
    body,
    source: String(candidate.source || "assistant_answer").slice(0, 60),
    tags: sanitizeMemoTags(candidate.tags),
    context: sanitizeMemoContext(candidate.context || activeSidebarContext),
    provider: String(candidate.provider || "").slice(0, 80),
    aiUsed: Boolean(candidate.aiUsed),
    sources: sanitizeMemoSources(candidate.sources)
  };
  const memoId = `memo-candidate-${hashMemoString([
    normalizedCandidate.source,
    normalizedCandidate.title,
    normalizedCandidate.body
  ].join("|"))}`;

  memoCandidatesById.set(memoId, normalizedCandidate);
  return memoId;
}

function registerAgentRunTranscript(transcript = null) {
  const normalized = sanitizeAgentRunTranscript(transcript);
  if (!normalized?.id) return "";

  if (!agentRunTranscriptsById.has(normalized.id)) {
    agentRunTranscriptsById.set(normalized.id, normalized);
    persistAgentRunTranscript(normalized);
  }

  return normalized.id;
}

async function persistAgentRunTranscript(transcript = {}) {
  if (!transcript?.id) return;

  try {
    const stored = await chrome.storage.local.get(AGENT_RUN_TRANSCRIPTS_KEY);
    const existing = normalizeAgentRunTranscripts(stored[AGENT_RUN_TRANSCRIPTS_KEY]);
    const previous = existing.find((item) => item.id === transcript.id);
    const next = {
      ...transcript,
      createdAt: previous?.createdAt || transcript.createdAt || new Date().toISOString()
    };

    await chrome.storage.local.set({
      [AGENT_RUN_TRANSCRIPTS_KEY]: [next, ...existing.filter((item) => item.id !== transcript.id)].slice(0, MAX_AGENT_RUN_TRANSCRIPTS)
    });
  } catch {
    // Local transcript persistence is best-effort and should never block the answer UI.
  }
}

function normalizeAgentRunTranscripts(values = []) {
  return (Array.isArray(values) ? values : [])
    .map(sanitizeAgentRunTranscript)
    .filter((item) => item?.id)
    .slice(0, MAX_AGENT_RUN_TRANSCRIPTS);
}

function buildPageRunTranscript(summary = {}, markdown = "") {
  const tool = sanitizeRunTranscriptTool(summary.toolCard || {});
  const context = {
    scope: String(summary.source || "current_page").slice(0, 40),
    title: sanitizeRunTranscriptText(summary.title || activeSidebarContext.title || "", 140),
    hostname: sanitizeRunTranscriptHostname(summary.hostname || activeSidebarContext.hostname || ""),
    tabId: Number.isInteger(Number(summary.tabId || activeSidebarContext.tabId)) ? Number(summary.tabId || activeSidebarContext.tabId) : null,
    readCount: tool.readCount,
    skippedCount: tool.skippedCount
  };
  const request = sanitizeRunTranscriptText(summary.question || "", 180);
  const workflow = String(summary.workflow || "general_qa").slice(0, 80);
  const basis = ["page", workflow, context.scope, context.hostname, context.title, request, tool.name, markdown.slice(0, 160)].join("|");

  return {
    id: `run-${hashRunTranscriptBasis(basis)}`,
    title: inferRunTranscriptTitle({ kind: "page", workflow, context }),
    kind: "page_agent",
    workflow,
    request,
    context,
    tools: tool.name ? [tool] : [],
    skippedPages: buildRunTranscriptSkippedPages(summary.toolCard),
    appliedActions: [],
    browserChanged: false,
    undoRestore: msg("runLogUndoNotNeeded"),
    provider: sanitizeRunTranscriptText(summary.provider || "", 80),
    aiUsed: Boolean(summary.aiUsed),
    privacy: sanitizeRunTranscriptPrivacy(summary.privacy),
    safety: sanitizeRunTranscriptSafety(summary),
    createdAt: new Date().toISOString()
  };
}

function buildContextRunTranscript(summary = {}, markdown = "") {
  const tool = sanitizeRunTranscriptTool(summary.toolCard || {});
  const context = {
    scope: sanitizeRunTranscriptText(summary.context?.scope || summary.toolCard?.scope?.type || "selected_tabs", 40),
    groupName: sanitizeRunTranscriptText(summary.context?.groupName || "", 100),
    tabCount: nonNegativeRunInt(summary.context?.tabCount || summary.toolCard?.scope?.requestedTabCount),
    readCount: tool.readCount,
    skippedCount: tool.skippedCount
  };
  const request = sanitizeRunTranscriptText(summary.question || "", 180);
  const workflow = String(summary.workflow || "general_qa").slice(0, 80);
  const basis = ["context", workflow, context.scope, context.groupName, context.tabCount, request, tool.name, markdown.slice(0, 160)].join("|");

  return {
    id: `run-${hashRunTranscriptBasis(basis)}`,
    title: inferRunTranscriptTitle({ kind: "context", workflow, context }),
    kind: "context_tabs_agent",
    workflow,
    request,
    context,
    tools: tool.name ? [tool] : [],
    skippedPages: buildRunTranscriptSkippedPages(summary.toolCard, summary.skippedBreakdown),
    appliedActions: [],
    browserChanged: false,
    undoRestore: msg("runLogUndoNotNeeded"),
    provider: sanitizeRunTranscriptText(summary.provider || "", 80),
    aiUsed: Boolean(summary.aiUsed),
    privacy: sanitizeRunTranscriptPrivacy(summary.privacy),
    safety: sanitizeRunTranscriptSafety(summary),
    createdAt: new Date().toISOString()
  };
}

function sanitizeAgentRunTranscript(transcript = {}) {
  if (!transcript || typeof transcript !== "object") return null;

  const id = String(transcript.id || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  if (!id) return null;

  return {
    id,
    title: sanitizeRunTranscriptText(transcript.title || msg("runLog"), 120),
    kind: sanitizeRunTranscriptText(transcript.kind || "agent_run", 60),
    workflow: sanitizeRunTranscriptText(transcript.workflow || "general_qa", 80),
    request: sanitizeRunTranscriptText(transcript.request || "", 180),
    context: sanitizeRunTranscriptContext(transcript.context),
    tools: (Array.isArray(transcript.tools) ? transcript.tools : [])
      .map(sanitizeRunTranscriptTool)
      .filter((tool) => tool.name)
      .slice(0, 4),
    skippedPages: sanitizeRunTranscriptList(transcript.skippedPages, 6, 140),
    appliedActions: sanitizeRunTranscriptList(transcript.appliedActions, 6, 120),
    browserChanged: Boolean(transcript.browserChanged),
    undoRestore: sanitizeRunTranscriptText(transcript.undoRestore || msg("runLogUndoNotNeeded"), 140),
    provider: sanitizeRunTranscriptText(transcript.provider || "", 80),
    aiUsed: Boolean(transcript.aiUsed),
    privacy: sanitizeRunTranscriptPrivacy(transcript.privacy),
    safety: {
      pageTextTrusted: transcript.safety?.pageTextTrusted === true,
      warnings: sanitizeRunTranscriptList(transcript.safety?.warnings, 4, 180)
    },
    createdAt: sanitizeRunTranscriptText(transcript.createdAt || new Date().toISOString(), 40)
  };
}

function sanitizeRunTranscriptContext(context = {}) {
  return {
    scope: sanitizeRunTranscriptText(context.scope || "", 40),
    title: sanitizeRunTranscriptText(context.title || "", 140),
    hostname: sanitizeRunTranscriptHostname(context.hostname || ""),
    groupName: sanitizeRunTranscriptText(context.groupName || "", 100),
    tabId: Number.isInteger(Number(context.tabId)) ? Number(context.tabId) : null,
    tabCount: nonNegativeRunInt(context.tabCount),
    readCount: nonNegativeRunInt(context.readCount),
    skippedCount: nonNegativeRunInt(context.skippedCount)
  };
}

function sanitizeRunTranscriptTool(toolCard = {}) {
  const scope = toolCard.scope || {};

  return {
    name: sanitizeRunTranscriptText(toolCard.toolName || toolCard.name || "", 80),
    label: sanitizeRunTranscriptText(toolCard.label || toolCard.toolName || toolCard.name || "", 80),
    status: sanitizeRunTranscriptText(toolCard.status || "", 40),
    dataUsed: sanitizeRunTranscriptList(toolCard.dataUsed, 6, 80),
    storage: sanitizeRunTranscriptText(toolCard.storage || "", 60),
    readCount: nonNegativeRunInt(scope.readTabCount ?? toolCard.readCount),
    skippedCount: nonNegativeRunInt(scope.skippedTabCount ?? toolCard.skippedCount),
    maxTabs: nonNegativeRunInt(scope.maxTabs ?? toolCard.maxTabs),
    allowed: sanitizeRunTranscriptList(toolCard.toolPermissionLabels || toolCard.toolPermissions || toolCard.allowed, 4, 80),
    blocked: sanitizeRunTranscriptList(toolCard.blockedActionLabels || toolCard.blockedActions || toolCard.blocked, 6, 80)
  };
}

function buildRunTranscriptSkippedPages(toolCard = {}, fallbackBreakdown = []) {
  const breakdown = Array.isArray(toolCard?.skippedBreakdown) && toolCard.skippedBreakdown.length
    ? toolCard.skippedBreakdown
    : fallbackBreakdown;

  if (Array.isArray(breakdown) && breakdown.length) {
    return breakdown
      .map((item) => {
        const count = nonNegativeRunInt(item?.count);
        const label = sanitizeRunTranscriptText(item?.label || item?.reason || "", 80);
        return count && label ? `${count} ${label}` : label;
      })
      .filter(Boolean)
      .slice(0, 6);
  }

  return (Array.isArray(toolCard?.skippedReasons) ? toolCard.skippedReasons : [])
    .map((reason) => sanitizeRunTranscriptText(reason, 80))
    .filter(Boolean)
    .slice(0, 6);
}

function sanitizeRunTranscriptPrivacy(privacy = {}) {
  return {
    sentTabMetadata: Boolean(privacy.sentTabMetadata),
    sentPageText: Boolean(privacy.sentPageText),
    sentFullUrls: Boolean(privacy.sentFullUrls),
    storedCloud: Boolean(privacy.storedCloud)
  };
}

function sanitizeRunTranscriptSafety(summary = {}) {
  const warnings = Array.isArray(summary.securityWarnings) ? summary.securityWarnings : [];

  return {
    pageTextTrusted: summary.security?.pageTextTrusted === true,
    warnings: sanitizeRunTranscriptList(warnings, 4, 180)
  };
}

function sanitizeRunTranscriptList(values = [], limit = 6, maxLength = 120) {
  return (Array.isArray(values) ? values : [])
    .map((value) => sanitizeRunTranscriptText(value, maxLength))
    .filter(Boolean)
    .slice(0, limit);
}

function sanitizeRunTranscriptText(value = "", maxLength = 160) {
  return String(value || "")
    .replace(/\b(?:https?|file|chrome|chrome-extension|edge|brave):\/\/([^\s"'<>/?#]+)[^\s"'<>]*/gi, "[redacted URL: $1]")
    .replace(/([?&](?:token|key|api_key|apikey|access_token|auth|session|code|secret|password)=)[^\s&]+/gi, "$1[redacted]")
    .replace(/\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s"'<>]+/gi, "[redacted connection string]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted-token]")
    .replace(/\bsk-[A-Za-z0-9_-]{6,}\b/g, "[redacted-api-key]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeRunTranscriptHostname(value = "") {
  return String(value || "")
    .replace(/[^a-z0-9.-]/gi, "")
    .slice(0, 120);
}

function nonNegativeRunInt(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function hashRunTranscriptBasis(value = "") {
  let hash = 5381;
  const text = String(value || "");

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

function inferRunTranscriptTitle({ kind = "page", workflow = "", context = {} } = {}) {
  const workflowLabel = workflow && workflow !== "general_qa" ? workflow.replace(/_/g, " ") : msg("runLog");
  const contextLabel = kind === "context"
    ? (context.groupName || context.scope || msg("runLogContext"))
    : (context.hostname || context.title || msg("currentTab"));

  return sanitizeRunTranscriptText(`${workflowLabel} · ${contextLabel}`, 120);
}

function buildAgentRunTranscriptMarkdown(transcript = {}) {
  const run = sanitizeAgentRunTranscript(transcript);
  if (!run) return msg("runLogUnavailable");

  const lines = [
    `**${msg("runLog")}**`,
    run.title ? `- ${msg("runLogTitle")}: ${run.title}` : "",
    run.request ? `- ${msg("runLogRequest")}: ${run.request}` : "",
    `- ${msg("runLogWorkflow")}: ${run.workflow || "general_qa"}`,
    `- ${msg("runLogProvider")}: ${run.aiUsed ? (run.provider || "AI") : "local"}`,
    `- ${msg("runLogContext")}: ${formatRunTranscriptContext(run.context)}`
  ].filter(Boolean);

  if (run.tools.length) {
    lines.push("");
    lines.push(`**${msg("runLogTools")}**`);
    run.tools.forEach((tool) => {
      lines.push(`- ${formatRunTranscriptTool(tool)}`);
      if (tool.allowed.length) lines.push(`  - ${msg("toolCardAllowed", [tool.allowed.slice(0, 3).join(", ")])}`);
      if (tool.blocked.length) lines.push(`  - ${msg("toolCardBlocked", [tool.blocked.slice(0, 3).join(", ")])}`);
    });
  }

  if (run.skippedPages.length) {
    lines.push("");
    lines.push(`**${msg("runLogSkipped")}**`);
    run.skippedPages.forEach((item) => lines.push(`- ${item}`));
  }

  lines.push("");
  lines.push(`**${msg("runLogPrivacy")}**`);
  lines.push(`- ${formatRunTranscriptPrivacy(run.privacy)}`);
  lines.push(`- ${run.safety.pageTextTrusted ? msg("runLogTrustedSource") : msg("toolCardUntrustedSource")}`);

  if (run.safety.warnings.length) {
    lines.push("");
    lines.push(`**${msg("runLogSafety")}**`);
    run.safety.warnings.forEach((item) => lines.push(`- ${item}`));
  }

  lines.push("");
  lines.push(`**${msg("runLogActions")}**`);
  if (run.appliedActions.length) {
    run.appliedActions.forEach((item) => lines.push(`- ${item}`));
  } else {
    lines.push(`- ${run.browserChanged ? msg("runLogBrowserChanged") : msg("runLogNoBrowserChange")}`);
  }
  lines.push(`- ${run.undoRestore || msg("runLogUndoNotNeeded")}`);

  return lines.join("\n");
}

function formatRunTranscriptContext(context = {}) {
  const parts = [
    context.scope || "",
    context.hostname || context.title || context.groupName || "",
    context.tabCount ? `${context.tabCount} tabs` : "",
    context.readCount || context.skippedCount ? `read ${context.readCount || 0} / skipped ${context.skippedCount || 0}` : ""
  ].filter(Boolean);

  return parts.join(" · ") || msg("runLogContext");
}

function formatRunTranscriptTool(tool = {}) {
  const counts = tool.readCount || tool.skippedCount
    ? ` · read ${tool.readCount || 0} / skipped ${tool.skippedCount || 0}`
    : "";
  const data = tool.dataUsed.length ? ` · ${tool.dataUsed.slice(0, 3).join(", ")}` : "";
  const storage = tool.storage ? ` · ${tool.storage.replace(/_/g, " ")}` : "";

  return `${tool.label || tool.name || msg("runLogTools")}${counts}${data}${storage}`;
}

function formatRunTranscriptPrivacy(privacy = {}) {
  return [
    privacy.sentTabMetadata ? msg("runLogSentTabMetadata") : msg("runLogNoTabMetadata"),
    privacy.sentPageText ? msg("runLogSentPageText") : msg("runLogNoPageText"),
    privacy.sentFullUrls ? msg("runLogSentFullUrls") : msg("runLogNoFullUrls"),
    privacy.storedCloud ? msg("runLogStoredCloud") : msg("runLogNoCloud")
  ].join(" · ");
}

function inferMemoTitle(candidate = {}, body = "") {
  const context = candidate.context || {};
  const firstSource = Array.isArray(candidate.sources) ? candidate.sources[0] : null;
  const firstLine = String(body || "").split("\n").map((line) => cleanMarkdownLine(line)).find(Boolean) || "";
  return context.groupName || context.title || firstSource?.title || firstSource?.hostname || firstLine || msg("memo");
}

function buildPageSummaryMemoCandidate(summary = {}, markdown = "") {
  return {
    title: summary.title || summary.hostname || activeSidebarContext?.title || msg("currentTab"),
    body: markdown || buildPageSummaryMarkdown(summary, Array.isArray(summary.keyPoints) ? summary.keyPoints : []),
    source: summary.workflow || "current_page_chat",
    tags: [summary.hostname, "current-page", summary.workflow, summary.suggestedGroup].filter(Boolean),
    context: {
      ...(sanitizeMemoContext(activeSidebarContext) || {}),
      title: summary.title || activeSidebarContext?.title || "",
      hostname: summary.hostname || activeSidebarContext?.hostname || ""
    },
    provider: summary.provider,
    aiUsed: summary.aiUsed,
    sources: [{
      title: summary.title || activeSidebarContext?.title || "",
      hostname: summary.hostname || activeSidebarContext?.hostname || "",
      path: summary.path || activeSidebarContext?.path || "",
      snippet: summary.summary || summary.answer || ""
    }]
  };
}

function buildFetchedLinkMemoCandidate(summary = {}, markdown = "") {
  const source = latestFetchedLinkResult || summary || {};

  return {
    title: summary.title || source.title || summary.hostname || source.hostname || msg("linkedSource"),
    body: markdown || buildFetchedLinkMarkdown(summary),
    source: "fetched_link",
    tags: [summary.hostname || source.hostname, "pasted-link"].filter(Boolean),
    context: {
      scope: "pasted_link",
      title: summary.title || source.title || "",
      hostname: summary.hostname || source.hostname || "",
      path: summary.path || source.path || ""
    },
    provider: summary.provider,
    aiUsed: summary.aiUsed,
    sources: [sanitizeFetchedLinkResultForLocalWork(summary, source)]
  };
}

function buildContextSummaryMemoCandidate(summary = {}, markdown = "") {
  const context = sanitizeMemoContext(summary.context || activeSidebarContext);
  const workflow = summary.workflow || (isCompareTabsSummary(summary) ? "compare_selected_tabs" : "context_tabs_chat");
  const title = summary.context?.groupName || context.groupName || summary.title || msg("contextSelectedTabs");

  return {
    title,
    body: markdown || buildContextTabsSummaryMarkdown(summary),
    source: workflow,
    tags: [
      workflow.replace(/_/g, "-"),
      context.scope,
      context.groupName,
      summary.provider
    ].filter(Boolean),
    context,
    provider: summary.provider,
    aiUsed: summary.aiUsed,
    sources: (Array.isArray(summary.sourceNotes) && summary.sourceNotes.length ? summary.sourceNotes : summary.sourceGrounding || [])
      .map((note) => ({ title: note, snippet: note, sourceType: "source_note" }))
  };
}

function sanitizeMemoTitle(value) {
  return cleanMarkdownLine(value || msg("memo"))
    .replace(/^#+\s*/, "")
    .slice(0, 120) || msg("memo");
}

function sanitizeMemoBody(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\bhttps?:\/\/[^\s)]+/gi, redactMemoUrlInText)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 2400);
}

function redactMemoUrlInText(rawUrl) {
  try {
    const url = new URL(String(rawUrl || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "[link]";
    return `${url.hostname}${sanitizeBrowserWorkPath(url.pathname || "/")}`;
  } catch {
    return "[link]";
  }
}

function sanitizeMemoTags(tags = []) {
  return Array.from(new Set(
    (Array.isArray(tags) ? tags : [])
      .map((tag) => cleanMarkdownLine(tag).replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 8)
  ));
}

function sanitizeMemoContext(context = {}) {
  if (!context || typeof context !== "object") return {};

  const cleanContext = {
    scope: String(context.scope || "").slice(0, 40),
    tabId: toOptionalInteger(context.tabId),
    windowId: toOptionalInteger(context.windowId),
    groupId: toOptionalInteger(context.groupId),
    title: String(context.title || "").slice(0, 180),
    hostname: String(context.hostname || "").slice(0, 120),
    path: sanitizeBrowserWorkPath(context.path || ""),
    groupName: String(context.groupName || "").slice(0, 120),
    tabCount: Number(context.tabCount || 0)
  };

  Object.keys(cleanContext).forEach((key) => {
    if (cleanContext[key] === undefined) {
      delete cleanContext[key];
    }
  });

  return cleanContext;
}

function sanitizeMemoSources(sources = []) {
  return (Array.isArray(sources) ? sources : [])
    .map(sanitizeSourceForLocalWork)
    .filter((source) => source.title || source.hostname || source.snippet)
    .slice(0, 5);
}

function hashMemoString(value) {
  let hash = 0;
  const text = String(value || "");

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

async function createTodoFromCompareResult() {
  const compareResult = getActiveCompareTabsResult();

  if (!compareResult) {
    renderChatPanel({
      status: "error",
      answer: msg("compareResultUnavailable")
    });
    return;
  }

  setBusy(true);

  try {
    const rawTabs = await getTodoTabsForSidebarContext(compareResult.context);
    const tabs = dedupeTabsById(rawTabs)
      .slice(0, MAX_TODO_LINKED_TABS)
      .map((tab) => sanitizeTabForSidebarWork(tab, compareResult.context))
      .filter((tab) => Number.isInteger(tab.id));
    const now = new Date().toISOString();
    const task = {
      id: `task-${Date.now()}`,
      title: buildCompareTodoTitle(compareResult.summary, tabs),
      status: "open",
      source: "compare_selected_tabs",
      sourcePrompt: sanitizeTodoSourcePrompt(compareResult.summary.question),
      contextScope: compareResult.context.scope,
      createdAt: now,
      updatedAt: now,
      tabIds: tabs.map((tab) => tab.id).filter(Number.isInteger),
      tabs,
      checklist: buildCompareTodoChecklist(compareResult.summary),
      compare: {
        recommendation: compareResult.summary.recommendation,
        provider: compareResult.summary.provider,
        aiUsed: compareResult.summary.aiUsed
      }
    };
    const stored = await chrome.storage.local.get(AGENT_TASKS_KEY);
    const existingTasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];
    await chrome.storage.local.set({
      [AGENT_TASKS_KEY]: [task, ...existingTasks].slice(0, MAX_AGENT_ITEMS)
    });

    renderChatPanel({
      status: "todo-created",
      answer: buildCompareTodoMarkdown(task),
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

async function researchCompareMissingInfo() {
  const compareResult = getActiveCompareTabsResult();

  if (!compareResult) {
    renderChatPanel({
      status: "error",
      answer: msg("compareResultUnavailable")
    });
    return;
  }

  const query = buildCompareMissingInfoSearchQuery(compareResult.summary);

  if (!query) {
    renderChatPanel({
      status: "info",
      answer: msg("compareNoMissingInfo")
    });
    return;
  }

  await runAgentWebSearch(query);
}

async function createTodoFromResearchBrief() {
  const researchResult = getActiveResearchBriefResult();

  if (!researchResult) {
    renderChatPanel({
      status: "error",
      answer: msg("researchBriefUnavailable")
    });
    return;
  }

  setBusy(true);

  try {
    const rawTabs = await getTodoTabsForSidebarContext(researchResult.context);
    const tabs = dedupeTabsById(rawTabs)
      .slice(0, MAX_TODO_LINKED_TABS)
      .map((tab) => sanitizeTabForSidebarWork(tab, researchResult.context))
      .filter((tab) => Number.isInteger(tab.id));
    const now = new Date().toISOString();
    const task = {
      id: `task-${Date.now()}`,
      title: buildResearchBriefTodoTitle(researchResult.summary, tabs),
      status: "open",
      source: "research_brief",
      sourcePrompt: sanitizeTodoSourcePrompt(researchResult.summary.question),
      contextScope: researchResult.context.scope,
      createdAt: now,
      updatedAt: now,
      tabIds: tabs.map((tab) => tab.id).filter(Number.isInteger),
      tabs,
      checklist: buildResearchBriefTodoChecklist(researchResult.summary),
      research: {
        provider: researchResult.summary.provider,
        aiUsed: researchResult.summary.aiUsed,
        workflow: "research_brief"
      }
    };
    const stored = await chrome.storage.local.get(AGENT_TASKS_KEY);
    const existingTasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];
    await chrome.storage.local.set({
      [AGENT_TASKS_KEY]: [task, ...existingTasks].slice(0, MAX_AGENT_ITEMS)
    });

    renderChatPanel({
      status: "todo-created",
      answer: buildCompareTodoMarkdown(task),
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

async function researchBriefMissingInfo() {
  const researchResult = getActiveResearchBriefResult();

  if (!researchResult) {
    renderChatPanel({
      status: "error",
      answer: msg("researchBriefUnavailable")
    });
    return;
  }

  const query = buildResearchBriefMissingInfoSearchQuery(researchResult.summary);

  if (!query) {
    renderChatPanel({
      status: "info",
      answer: msg("researchBriefNoMissingInfo")
    });
    return;
  }

  await runAgentWebSearch(query, {
    researchAddendum: {
      kind: "research_brief",
      researchSummary: researchResult.summary
    }
  });
}

async function createTodoFromDecisionBrief() {
  const decisionResult = getActiveDecisionBriefResult();

  if (!decisionResult) {
    renderChatPanel({
      status: "error",
      answer: msg("decisionBriefUnavailable")
    });
    return;
  }

  setBusy(true);

  try {
    const rawTabs = await getTodoTabsForSidebarContext(decisionResult.context);
    const tabs = dedupeTabsById(rawTabs)
      .slice(0, MAX_TODO_LINKED_TABS)
      .map((tab) => sanitizeTabForSidebarWork(tab, decisionResult.context))
      .filter((tab) => Number.isInteger(tab.id));
    const now = new Date().toISOString();
    const task = {
      id: `task-${Date.now()}`,
      title: buildDecisionBriefTodoTitle(decisionResult.summary, tabs),
      status: "open",
      source: "decision_brief",
      sourcePrompt: sanitizeTodoSourcePrompt(decisionResult.summary.question),
      contextScope: decisionResult.context.scope,
      createdAt: now,
      updatedAt: now,
      tabIds: tabs.map((tab) => tab.id).filter(Number.isInteger),
      tabs,
      checklist: buildDecisionBriefTodoChecklist(decisionResult.summary),
      decision: {
        recommendation: decisionResult.summary.recommendation,
        provider: decisionResult.summary.provider,
        aiUsed: decisionResult.summary.aiUsed,
        workflow: "decision_brief"
      }
    };
    const stored = await chrome.storage.local.get(AGENT_TASKS_KEY);
    const existingTasks = Array.isArray(stored[AGENT_TASKS_KEY]) ? stored[AGENT_TASKS_KEY] : [];
    await chrome.storage.local.set({
      [AGENT_TASKS_KEY]: [task, ...existingTasks].slice(0, MAX_AGENT_ITEMS)
    });

    renderChatPanel({
      status: "todo-created",
      answer: buildCompareTodoMarkdown(task),
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

async function researchDecisionBriefMissingInfo() {
  const decisionResult = getActiveDecisionBriefResult();

  if (!decisionResult) {
    renderChatPanel({
      status: "error",
      answer: msg("decisionBriefUnavailable")
    });
    return;
  }

  const query = buildDecisionBriefMissingInfoSearchQuery(decisionResult.summary);

  if (!query) {
    renderChatPanel({
      status: "info",
      answer: msg("decisionBriefNoMissingInfo")
    });
    return;
  }

  await runAgentWebSearch(query, {
    researchAddendum: {
      kind: "decision_brief",
      researchSummary: decisionResult.summary
    }
  });
}

function getActiveCompareTabsResult() {
  if (!latestCompareTabsResult) return null;
  if (Date.now() - Number(latestCompareTabsResult.updatedAt || 0) > PAGE_CHAT_CONTEXT_TTL_MS) {
    latestCompareTabsResult = null;
    return null;
  }

  if (!isSameContextTabsChatContext(activeSidebarContext, latestCompareTabsResult.context)) {
    latestCompareTabsResult = null;
    return null;
  }

  return latestCompareTabsResult;
}

function getActiveResearchBriefResult() {
  if (!latestResearchBriefResult) return null;
  if (Date.now() - Number(latestResearchBriefResult.updatedAt || 0) > PAGE_CHAT_CONTEXT_TTL_MS) {
    latestResearchBriefResult = null;
    return null;
  }

  if (["saved_sources", "search_results", "visible_screenshot"].includes(latestResearchBriefResult.context?.scope)) {
    return latestResearchBriefResult;
  }

  if (!isSameContextTabsChatContext(activeSidebarContext, latestResearchBriefResult.context)) {
    latestResearchBriefResult = null;
    return null;
  }

  return latestResearchBriefResult;
}

function getActiveDecisionBriefResult() {
  if (!latestDecisionBriefResult) return null;
  if (Date.now() - Number(latestDecisionBriefResult.updatedAt || 0) > PAGE_CHAT_CONTEXT_TTL_MS) {
    latestDecisionBriefResult = null;
    return null;
  }

  if (["saved_sources", "search_results", "visible_screenshot"].includes(latestDecisionBriefResult.context?.scope)) {
    return latestDecisionBriefResult;
  }

  if (!isSameContextTabsChatContext(activeSidebarContext, latestDecisionBriefResult.context)) {
    latestDecisionBriefResult = null;
    return null;
  }

  return latestDecisionBriefResult;
}

function buildCompareTodoTitle(summary = {}, tabs = []) {
  const contextName = summary.context?.groupName || mostCommonValue(tabs.map((tab) => tab.groupName).filter(Boolean));
  if (contextName) return msg("todoReviewCompareResult", [contextName]);
  return msg("todoReviewCompareResult", [msg("contextSelectedTabs")]);
}

function buildCompareTodoChecklist(summary = {}) {
  const items = [
    summary.recommendation ? `Review recommendation: ${summary.recommendation}` : "",
    ...(Array.isArray(summary.missingInformation) ? summary.missingInformation.map((item) => `Resolve missing info: ${item}`) : []),
    ...(Array.isArray(summary.tradeoffs) ? summary.tradeoffs.map((item) => `Check tradeoff: ${item}`) : [])
  ]
    .map(cleanChecklistItem)
    .filter(Boolean);

  return Array.from(new Set(items)).slice(0, 6).length
    ? Array.from(new Set(items)).slice(0, 6)
    : [msg("agentTodoFallbackChecklist")];
}

function buildCompareTodoMarkdown(task = {}) {
  const tabCount = Array.isArray(task.tabs) ? task.tabs.length : 0;
  const checklist = Array.isArray(task.checklist) ? task.checklist.slice(0, 3) : [];
  const lines = [
    msg("agentTodoCreated", [task.title || msg("todo")]),
    "",
    `- ${msg("agentTodoLinkedTabs", [tabCount])}`,
    `- ${msg("agentTodoStoredLocally")}`
  ];

  if (checklist.length) {
    lines.push("", ...checklist.map((item) => `- ${item}`));
  }

  lines.push("", msg("agentTodoOpenDashboardHint"));
  return lines.join("\n");
}

function buildCompareMissingInfoSearchQuery(summary = {}) {
  const missing = (Array.isArray(summary.missingInformation) ? summary.missingInformation : [])
    .map(cleanMarkdownLine)
    .filter(Boolean);
  const sourceHint = (Array.isArray(summary.sourceNotes) ? summary.sourceNotes : [])
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
  const recommendationHint = cleanMarkdownLine(summary.recommendation || "").slice(0, 80);

  return [missing[0] || recommendationHint, sourceHint]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function buildResearchBriefTodoTitle(summary = {}, tabs = []) {
  const contextName = summary.context?.groupName || mostCommonValue(tabs.map((tab) => tab.groupName).filter(Boolean));
  if (contextName) return msg("todoReviewResearchBrief", [contextName]);
  return msg("todoReviewResearchBrief", [msg("contextSelectedTabs")]);
}

function buildResearchBriefTodoChecklist(summary = {}) {
  const items = [
    ...(Array.isArray(summary.researchFindings) ? summary.researchFindings.map((item) => `Review finding: ${item}`) : []),
    ...(Array.isArray(summary.missingInformation) ? summary.missingInformation.map((item) => `Resolve missing info: ${item}`) : []),
    ...(Array.isArray(summary.recommendations) ? summary.recommendations.map((item) => `Next step: ${item}`) : [])
  ]
    .map(cleanChecklistItem)
    .filter(Boolean);

  return Array.from(new Set(items)).slice(0, 6).length
    ? Array.from(new Set(items)).slice(0, 6)
    : [msg("agentTodoFallbackChecklist")];
}

function buildDecisionBriefTodoTitle(summary = {}, tabs = []) {
  const contextName = summary.context?.groupName || mostCommonValue(tabs.map((tab) => tab.groupName).filter(Boolean));
  if (contextName) return msg("todoReviewDecisionBrief", [contextName]);
  return msg("todoReviewDecisionBrief", [msg("contextSelectedTabs")]);
}

function buildDecisionBriefTodoChecklist(summary = {}) {
  const items = [
    summary.recommendation ? `Decision recommendation: ${summary.recommendation}` : "",
    ...(Array.isArray(summary.decisionCriteria) ? summary.decisionCriteria.map((item) => `Decision criterion: ${item}`) : []),
    ...(Array.isArray(summary.assumptions) ? summary.assumptions.map((item) => `Validate assumption: ${item}`) : []),
    ...(Array.isArray(summary.missingInformation) ? summary.missingInformation.map((item) => `Resolve missing info: ${item}`) : []),
    ...(Array.isArray(summary.recommendations) ? summary.recommendations.map((item) => `Next step: ${item}`) : [])
  ]
    .map(cleanChecklistItem)
    .filter(Boolean);

  return Array.from(new Set(items)).slice(0, 6).length
    ? Array.from(new Set(items)).slice(0, 6)
    : [msg("agentTodoFallbackChecklist")];
}

function buildResearchBriefMissingInfoSearchQuery(summary = {}) {
  const missing = (Array.isArray(summary.missingInformation) ? summary.missingInformation : [])
    .map(cleanMarkdownLine)
    .filter(Boolean);
  const findings = (Array.isArray(summary.researchFindings) ? summary.researchFindings : [])
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
  const sourceHint = (Array.isArray(summary.sourceNotes) ? summary.sourceNotes : [])
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  return [missing[0], findings || sourceHint]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function buildResearchAddendumSearchQueries(primaryQuery = "", summary = {}) {
  const missing = (Array.isArray(summary.missingInformation) ? summary.missingInformation : [])
    .map(sanitizeResearchSearchQuery)
    .filter(Boolean)
    .slice(0, 3);
  const findingCandidates = Array.isArray(summary.researchFindings) && summary.researchFindings.length
    ? summary.researchFindings
    : [
        ...(Array.isArray(summary.decisionCriteria) ? summary.decisionCriteria : []),
        ...(Array.isArray(summary.assumptions) ? summary.assumptions : []),
        ...(Array.isArray(summary.tradeoffs) ? summary.tradeoffs : []),
        ...(Array.isArray(summary.recommendations) ? summary.recommendations : []),
        summary.recommendation || ""
      ];
  const findings = findingCandidates
    .map(sanitizeResearchSearchQuery)
    .filter(Boolean)
    .slice(0, 2);
  const sourceTerms = extractResearchAddendumSourceTerms(summary);
  const primary = compactResearchSearchQuery(primaryQuery);
  const primaryMissing = compactResearchSearchQuery(missing[0] || primary);
  const candidates = [
    primaryMissing || primary,
    ...missing.map((item, index) => compactResearchSearchQuery([
      compactResearchSearchQuery(item),
      sourceTerms[index] || sourceTerms[0] || findings[0] || ""
    ].filter(Boolean).join(" "))),
    compactResearchSearchQuery([primaryMissing, "benchmark pricing evidence"].filter(Boolean).join(" ")),
    ...findings.map((item) => compactResearchSearchQuery([primaryMissing, item].filter(Boolean).join(" ")))
  ];
  const seen = new Set();
  const queries = [];

  for (const candidate of candidates) {
    const normalized = normalizeAgentText(candidate);
    if (!candidate || seen.has(normalized)) continue;
    seen.add(normalized);
    queries.push(candidate);
    if (queries.length >= 3) break;
  }

  return queries;
}

function extractResearchAddendumSourceTerms(summary = {}) {
  return (Array.isArray(summary.sourceNotes) ? summary.sourceNotes : [])
    .map(sanitizeResearchSearchQuery)
    .filter(Boolean)
    .map((note) => note
      .replace(/\b(source|tab|page|finding|note|mentions?|shows?|suggests?)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60))
    .filter(Boolean)
    .slice(0, 3);
}

function sanitizeResearchSearchQuery(value = "") {
  return cleanMarkdownLine(value)
    .replace(/\b(?:https?|file|chrome|chrome-extension|edge|brave):\/\/[^\s"'<>]+/gi, " ")
    .replace(/[?#][^\s]+/g, " ")
    .replace(/\b(?:token|key|api_key|apikey|access_token|auth|session|code|secret|password)=\S+/gi, " ")
    .replace(/[|*_`~<>{}[\]\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function compactResearchSearchQuery(value = "") {
  const cleaned = sanitizeResearchSearchQuery(value)
    .replace(/\b(actual|current|missing|information|question|strongest|source|selected|tabs?|pages?|brief|finding|findings|should|shape|around|before|changing|create|review|validate|validation)\b/gi, " ")
    .replace(/\b(the|a|an|and|or|to|for|from|with|into|this|that|these|those|per)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  return tokens.slice(0, 12).join(" ").slice(0, 96);
}

function buildDecisionBriefMissingInfoSearchQuery(summary = {}) {
  const missing = (Array.isArray(summary.missingInformation) ? summary.missingInformation : [])
    .map(cleanMarkdownLine)
    .filter(Boolean);
  const assumptions = (Array.isArray(summary.assumptions) ? summary.assumptions : [])
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
  const recommendation = cleanMarkdownLine(summary.recommendation || "").slice(0, 80);

  return [missing[0] || assumptions || recommendation, "decision criteria evidence"]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
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

function sanitizeFetchedLinkResultForLocalWork(result = {}, source = {}) {
  const localSource = sanitizeSourceForLocalWork(source);

  return {
    ...localSource,
    title: String(result.title || localSource.title || msg("linkedSource")).slice(0, 180),
    hostname: String(result.hostname || localSource.hostname || "").slice(0, 120),
    path: sanitizeBrowserWorkPath(result.path || localSource.path || ""),
    snippet: String(result.summary || result.answer || localSource.snippet || "").replace(/\s+/g, " ").trim().slice(0, 260),
    sourceType: "fetched_link",
    fetchedAt: String(result.fetchedAt || new Date().toISOString()).slice(0, 40),
    aiUsed: Boolean(result.aiUsed),
    provider: String(result.provider || "").slice(0, 80)
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
    undone: run?.source === "tab-state-undo"
      ? run?.message || msg("undoComplete")
      : msg("restoredTabsGroups", [run?.summary?.restoredTabs ?? 0, run?.summary?.restoredGroups ?? 0]),
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
    metricsGrid.innerHTML = "";
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
  if (status === "idle") {
    const title = msg("sidebarWelcomeTitle");
    const body = msg("sidebarWelcomeBody");

    upsertSystemChatMessage({
      role: "assistant",
      status: "run-idle",
      html: renderRunMessageCard({
        title,
        body,
        actions: buildIdleWelcomeActions(),
        status,
        insights: null
      }),
      text: `${title}\n\n${body}`,
      includeInAIAgentContext: false
    });
    return;
  }

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

function buildIdleWelcomeActions() {
  return [
    { label: msg("smartOrganize"), command: "organize again", tone: "primary" },
    { label: msg("askCurrentPage"), command: "what is this page about?" },
    { label: msg("setupAI"), action: "open-search-settings" },
    { label: msg("openDashboardShort"), action: "open-dashboard" }
  ];
}

function getRunMessageTitle(run) {
  if (run?.source === "safe-duplicate-close") {
    return msg("safeDuplicateCloseComplete");
  }

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

  if (run?.source === "safe-duplicate-close") return run?.message || msg("safeDuplicateCloseComplete");
  if (status === "completed") return getCompletedAgentReply(run);
  if (status === "undone" && run?.source === "tab-state-undo") return run?.message || msg("undoComplete");
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

  if (status === "completed" && buildLocalAITriage(latestRun).hasSignal) {
    return [
      { label: msg("setGoal"), action: "set-workspace-goal" },
      { label: msg("createTodo"), action: "todo-ai-triage" }
    ];
  }

  return [];
}

function renderRunMessageCard({ title, body, actions, status, insights }) {
  const shouldRenderExtras = hasClassificationInsights(insights);
  const shouldRenderActions = Array.isArray(actions) && actions.length > 0;

  return `
    <article class="run-message-card" data-run-message-status="${escapeHtml(status || "")}">
      <div class="chat-answer markdown-message">${renderSafeMarkdown(formatRunMessageText(title, body, status))}</div>
      ${shouldRenderExtras ? renderClassificationInsights(insights) : ""}
      ${shouldRenderActions ? renderQuickCommandActions(actions) : ""}
    </article>
  `;
}

function hasClassificationInsights(insights) {
  return Boolean(
    (Array.isArray(insights?.splitSuggestions) && insights.splitSuggestions.length) ||
    (Array.isArray(insights?.mergeSuggestions) && insights.mergeSuggestions.length)
  );
}

function renderSafeMarkdown(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const parts = [];
  let paragraph = [];
  let listItems = [];
  let tableRows = [];

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

  const flushTable = () => {
    if (!tableRows.length) return;
    const parsedRows = tableRows.map(parseMarkdownTableRow).filter((row) => row.length >= 2);
    const hasDivider = parsedRows.length >= 2 && isMarkdownTableDivider(parsedRows[1]);

    if (!hasDivider) {
      parsedRows.forEach((row) => parts.push(`<p>${renderInlineMarkdown(row.join(" | "))}</p>`));
      tableRows = [];
      return;
    }

    const header = parsedRows[0];
    const body = parsedRows.slice(2);
    parts.push(`
      <div class="markdown-table-wrap">
        <table>
          <thead><tr>${header.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join("")}</tr></thead>
          <tbody>${body.map((row) => `<tr>${header.map((_cell, index) => `<td>${renderInlineMarkdown(row[index] || "")}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>
    `);
    tableRows = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    if (isMarkdownTableLine(line)) {
      flushParagraph();
      flushList();
      tableRows.push(line);
      continue;
    }

    flushTable();

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
  flushTable();

  return parts.join("");
}

function isMarkdownTableLine(line) {
  return /^\|.+\|$/.test(String(line || "").trim());
}

function parseMarkdownTableRow(line) {
  return String(line || "")
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isMarkdownTableDivider(row) {
  return row.every((cell) => /^:?-{3,}:?$/.test(cell));
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
  if (status === "idle") {
    if (!cleanTitle) return cleanBody;
    if (!cleanBody) return cleanTitle;
    return `${cleanTitle}\n\n${cleanBody}`;
  }
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
              class="${action.tone === "primary" ? "primary-button" : "mini-button"}"
              type="button"
              data-chat-action="${escapeHtml(action.action || "quick-command")}"
              ${action.command ? `data-command="${escapeHtml(action.command)}"` : ""}
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
  rememberPageReviewResult(summary);
  rememberSmartFillResult(summary);
  if (isResearchBriefSummary(summary)) {
    rememberResearchBriefResult(summary, summary.context || {
      scope: summary.source === "visible_screenshot" ? "visible_screenshot" : "current_tab",
      tabId: summary.tabId || activeSidebarContext?.tabId || null,
      windowId: activeSidebarContext?.windowId || null,
      title: summary.title || activeSidebarContext?.title || "",
      hostname: summary.hostname || activeSidebarContext?.hostname || "",
      tabCount: 1
    });
  }
  if (isDecisionBriefSummary(summary)) {
    rememberDecisionBriefResult(summary, summary.context || {
      scope: summary.source === "visible_screenshot" ? "visible_screenshot" : "current_tab",
      tabId: summary.tabId || activeSidebarContext?.tabId || null,
      windowId: activeSidebarContext?.windowId || null,
      title: summary.title || activeSidebarContext?.title || "",
      hostname: summary.hostname || activeSidebarContext?.hostname || "",
      tabCount: 1
    });
  }
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
    summary?.recommendation || "",
    ...(Array.isArray(summary?.researchFindings) ? summary.researchFindings : []),
    ...(Array.isArray(summary?.contradictions) ? summary.contradictions : []),
    ...(Array.isArray(summary?.keyPoints) ? summary.keyPoints : []),
    ...(Array.isArray(summary?.recommendations) ? summary.recommendations : []),
    ...(Array.isArray(summary?.decisionCriteria) ? summary.decisionCriteria : []),
    ...(Array.isArray(summary?.tradeoffs) ? summary.tradeoffs : []),
    ...(Array.isArray(summary?.assumptions) ? summary.assumptions : []),
    ...(Array.isArray(summary?.missingInformation) ? summary.missingInformation : [])
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

function rememberCompareTabsResult(summary = {}, context = {}) {
  if (!isCompareTabsSummary(summary)) {
    latestCompareTabsResult = null;
    return;
  }

  latestCompareTabsResult = {
    summary: sanitizeCompareResultForLocalActions(summary),
    context: normalizeSidebarContext(context) || normalizeSidebarContext(activeSidebarContext) || { scope: "selected_tabs" },
    updatedAt: Date.now()
  };
}

function isCompareTabsSummary(summary = {}) {
  return summary?.workflow === "compare_selected_tabs" ||
    (!summary?.workflow && Array.isArray(summary?.comparisonRows) && summary.comparisonRows.length > 0);
}

function sanitizeCompareResultForLocalActions(summary = {}) {
  return {
    workflow: "compare_selected_tabs",
    question: cleanMarkdownLine(summary.question || ""),
    recommendation: cleanMarkdownLine(summary.recommendation || summary.summary || summary.answer || "").slice(0, 360),
    missingInformation: (Array.isArray(summary.missingInformation) ? summary.missingInformation : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 3),
    tradeoffs: (Array.isArray(summary.tradeoffs) ? summary.tradeoffs : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 3),
    sourceNotes: (Array.isArray(summary.sourceNotes) ? summary.sourceNotes : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 4),
    provider: String(summary.provider || "").slice(0, 80),
    aiUsed: Boolean(summary.aiUsed),
    context: {
      scope: String(summary.context?.scope || "").slice(0, 40),
      groupName: String(summary.context?.groupName || "").slice(0, 120),
      tabCount: Number(summary.context?.tabCount || 0)
    }
  };
}

function rememberResearchBriefResult(summary = {}, context = {}) {
  if (!isResearchBriefSummary(summary)) {
    latestResearchBriefResult = null;
    return;
  }

  const sourceContextScope = ["saved_sources", "search_results", "visible_screenshot"].includes(context?.scope)
    ? context.scope
    : ["saved_sources", "search_results", "visible_screenshot"].includes(summary.context?.scope)
      ? summary.context.scope
      : "";
  const sourceContext = sourceContextScope
    ? {
        scope: sourceContextScope,
        title: summary.context?.title || context.title || (
          sourceContextScope === "search_results"
            ? msg("sourceSearchResults")
            : sourceContextScope === "visible_screenshot"
              ? msg("sourceVisibleScreenshot")
              : msg("sourceSavedSources")
        ),
        tabCount: Number(summary.context?.tabCount || context.tabCount || summary.savedSources?.length || (sourceContextScope === "visible_screenshot" ? 1 : 0))
      }
    : normalizeSidebarContext(context) || normalizeSidebarContext(activeSidebarContext) || { scope: "selected_tabs" };

  latestResearchBriefResult = {
    summary: sanitizeResearchBriefForLocalActions(summary),
    context: sourceContext,
    updatedAt: Date.now()
  };
}

function isResearchBriefSummary(summary = {}) {
  return summary?.workflow === "research_brief";
}

function rememberDecisionBriefResult(summary = {}, context = {}) {
  if (!isDecisionBriefSummary(summary)) {
    latestDecisionBriefResult = null;
    return;
  }

  const sourceContext = context?.scope === "saved_sources" || summary.context?.scope === "saved_sources"
    ? {
        scope: "saved_sources",
        title: summary.context?.title || context.title || msg("sourceSavedSources"),
        tabCount: Number(summary.context?.tabCount || context.tabCount || summary.savedSources?.length || 0)
      }
    : normalizeSidebarContext(context) || normalizeSidebarContext(activeSidebarContext) || { scope: "selected_tabs" };

  latestDecisionBriefResult = {
    summary: sanitizeDecisionBriefForLocalActions(summary),
    context: sourceContext,
    updatedAt: Date.now()
  };
}

function isDecisionBriefSummary(summary = {}) {
  return summary?.workflow === "decision_brief";
}

function sanitizeResearchBriefForLocalActions(summary = {}) {
  return {
    workflow: "research_brief",
    question: cleanMarkdownLine(summary.question || ""),
    answer: cleanMarkdownLine(summary.summary || summary.answer || "").slice(0, 420),
    researchFindings: (Array.isArray(summary.researchFindings) ? summary.researchFindings : Array.isArray(summary.keyPoints) ? summary.keyPoints : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 4),
    contradictions: (Array.isArray(summary.contradictions) ? summary.contradictions : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 3),
    missingInformation: (Array.isArray(summary.missingInformation) ? summary.missingInformation : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 4),
    recommendations: (Array.isArray(summary.recommendations) ? summary.recommendations : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 4),
    sourceNotes: (Array.isArray(summary.sourceNotes) ? summary.sourceNotes : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 5),
    provider: String(summary.provider || "").slice(0, 80),
    aiUsed: Boolean(summary.aiUsed),
    context: {
      scope: String(summary.context?.scope || "").slice(0, 40),
      groupName: String(summary.context?.groupName || "").slice(0, 120),
      tabCount: Number(summary.context?.tabCount || 0)
    }
  };
}

function sanitizeDecisionBriefForLocalActions(summary = {}) {
  return {
    workflow: "decision_brief",
    question: cleanMarkdownLine(summary.question || ""),
    answer: cleanMarkdownLine(summary.summary || summary.answer || "").slice(0, 420),
    recommendation: cleanMarkdownLine(summary.recommendation || summary.summary || summary.answer || "").slice(0, 420),
    decisionCriteria: (Array.isArray(summary.decisionCriteria) ? summary.decisionCriteria : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 4),
    assumptions: (Array.isArray(summary.assumptions) ? summary.assumptions : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 4),
    tradeoffs: (Array.isArray(summary.tradeoffs) ? summary.tradeoffs : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 4),
    missingInformation: (Array.isArray(summary.missingInformation) ? summary.missingInformation : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 4),
    sourceNotes: (Array.isArray(summary.sourceNotes) ? summary.sourceNotes : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 5),
    recommendations: (Array.isArray(summary.recommendations) ? summary.recommendations : [])
      .map(cleanMarkdownLine)
      .filter(Boolean)
      .slice(0, 4),
    provider: String(summary.provider || "").slice(0, 80),
    aiUsed: Boolean(summary.aiUsed),
    context: {
      scope: String(summary.context?.scope || "").slice(0, 40),
      groupName: String(summary.context?.groupName || "").slice(0, 120),
      tabCount: Number(summary.context?.tabCount || 0)
    }
  };
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
  if (isDecisionBriefSummary(summary)) {
    return renderSavedSourcesDecisionSummary(summary);
  }

  if (isResearchBriefSummary(summary)) {
    return renderSavedSourcesResearchSummary(summary);
  }

  const keyPoints = Array.isArray(summary?.keyPoints) ? summary.keyPoints : [];
  const status = summary?.status || "completed";
  const showKeyPoints = status === "completed" && keyPoints.length > 0 && !summary?.question;
  const markdown = buildPageSummaryMarkdown(summary, showKeyPoints ? keyPoints : []);
  const transcript = status === "completed" ? buildPageRunTranscript(summary, markdown) : null;
  const actionRow = status === "completed"
    ? appendRunTranscriptAction(
        renderSmartFillActionRow(summary, markdown) ||
        renderContextualWritingActionRow(summary, markdown) ||
        renderPageReviewActionRow(summary, markdown) ||
        renderSaveMemoActionRow(buildPageSummaryMemoCandidate(summary, markdown)),
        transcript
      )
    : "";

  return renderAssistantMarkdownMessage(
    markdown,
    `chat-summary-card ${status}`,
    "",
    buildPageSourceChips(summary),
    actionRow
  );
}

function renderSavedSourcesResearchSummary(summary = {}) {
  const markdown = buildResearchBriefMarkdown(
    summary,
    Array.isArray(summary.keyPoints) ? summary.keyPoints : [],
    Array.isArray(summary.recommendations) ? summary.recommendations : []
  );
  const actionRow = renderResearchBriefActionRow(summary, markdown) || renderSaveMemoActionRow(buildContextSummaryMemoCandidate(summary, markdown));

  return renderAssistantMarkdownMessage(
    markdown,
    `chat-summary-card ${summary?.status || "completed"}`,
    "",
    buildPageSourceChips(summary),
    actionRow
  );
}

function renderSavedSourcesDecisionSummary(summary = {}) {
  const markdown = buildDecisionBriefMarkdown(
    summary,
    Array.isArray(summary.keyPoints) ? summary.keyPoints : [],
    Array.isArray(summary.recommendations) ? summary.recommendations : []
  );
  const actionRow = renderDecisionBriefActionRow(summary, markdown) ||
    renderSaveMemoActionRow(buildContextSummaryMemoCandidate(summary, markdown));

  return renderAssistantMarkdownMessage(
    markdown,
    `chat-summary-card ${summary?.status || "completed"}`,
    "",
    buildPageSourceChips(summary),
    actionRow
  );
}

function buildPageSummaryMarkdown(summary, keyPoints = []) {
  if (isVisionSummary(summary)) {
    return buildVisionSummaryMarkdown(summary);
  }

  if (isSmartFillSummary(summary)) {
    return buildSmartFillMarkdown(summary);
  }

  if (isContextualWritingSummary(summary)) {
    return buildContextualWritingMarkdown(summary);
  }

  if (isPageReviewSummary(summary)) {
    return buildPageReviewMarkdown(summary);
  }

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

  appendSecurityWarnings(lines, summary);

  return lines.join("\n") || "I could not find enough readable page content to answer yet.";
}

function isVisionSummary(summary = {}) {
  return summary?.workflow === "screenshot_vision" || summary?.source === "visible_screenshot";
}

function buildVisionSummaryMarkdown(summary = {}) {
  const lines = [];
  const answer = cleanMarkdownLine(summary?.summary || summary?.answer || "");
  const points = (Array.isArray(summary.keyPoints) ? summary.keyPoints : [])
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 4);
  const risks = (Array.isArray(summary.visualRisks) ? summary.visualRisks : [])
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 3);
  const nextSteps = (Array.isArray(summary.nextSteps) ? summary.nextSteps : [])
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 3);

  if (answer) lines.push(answer);

  if (points.length) {
    if (lines.length) lines.push("");
    lines.push("**Observations**");
    points.forEach((item) => lines.push(`- ${item}`));
  }

  if (risks.length) {
    if (lines.length) lines.push("");
    lines.push("**Watch-outs**");
    risks.forEach((item) => lines.push(`- ${item}`));
  }

  if (nextSteps.length) {
    if (lines.length) lines.push("");
    lines.push("**Next steps**");
    nextSteps.forEach((item) => lines.push(`- ${item}`));
  }

  appendSecurityWarnings(lines, summary);
  return lines.join("\n") || msg("pageCouldNotBeRead");
}

function buildPageReviewMarkdown(summary = {}) {
  const lines = [];
  const answer = String(summary.summary || summary.answer || "").trim();
  const pageType = String(summary.pageType || "").trim();

  if (answer) lines.push(answer);
  if (pageType) {
    if (lines.length) lines.push("");
    lines.push(`**Page type:** ${pageType}`);
  }

  appendMarkdownListSection(lines, "Risks", summary.risks);
  appendMarkdownListSection(lines, "Open questions", summary.openQuestions);
  appendMarkdownListSection(lines, "Review checklist", summary.reviewChecklist);
  appendMarkdownListSection(lines, "Next steps", summary.nextSteps);
  appendSecurityWarnings(lines, summary);

  return lines.join("\n") || "I could not find enough readable page content to review yet.";
}

function buildContextualWritingMarkdown(summary = {}) {
  const lines = [];
  const answer = String(summary.summary || summary.answer || "").trim();
  const draft = String(summary.draft || "").trim();
  const purpose = String(summary.draftPurpose || "").trim();
  const audience = String(summary.audience || "").trim();
  const tone = String(summary.tone || "").trim();

  if (answer) lines.push(answer);

  if (draft) {
    if (lines.length) lines.push("");
    lines.push("**Draft**");
    lines.push("");
    lines.push(draft);
  }

  const meta = [
    purpose ? `Purpose: ${purpose}` : "",
    audience ? `Audience: ${audience}` : "",
    tone ? `Tone: ${tone}` : ""
  ].filter(Boolean);

  if (meta.length) {
    if (lines.length) lines.push("");
    lines.push("**Context**");
    meta.forEach((item) => lines.push(`- ${item}`));
  }

  appendMarkdownListSection(lines, "Use before sending", summary.copyNotes || summary.caveats);
  appendMarkdownListSection(lines, "Grounded in", summary.sourceGrounding);
  appendSecurityWarnings(lines, summary);

  return lines.join("\n") || "I could not find enough readable page content to draft from yet.";
}

function buildSmartFillMarkdown(summary = {}) {
  const lines = [];
  const answer = String(summary.summary || summary.answer || "").trim();
  const title = String(summary.tableTitle || "").trim();
  const markdownTable = String(summary.markdownTable || "").trim() || buildMarkdownTableFromSmartFill(summary);
  const rowClassifications = sanitizeSmartFillRows(summary.rowClassifications, 8);

  if (answer) lines.push(answer);
  if (title) {
    if (lines.length) lines.push("");
    lines.push(`**Table:** ${title}`);
  }

  if (markdownTable) {
    if (lines.length) lines.push("");
    lines.push(markdownTable);
  }

  if (rowClassifications.length) {
    if (lines.length) lines.push("");
    lines.push("**Row actions**");
    rowClassifications.slice(0, 5).forEach((row) => {
      const label = row.rowLabel || msg("smartFillRow");
      const tag = row.classification ? ` (${row.classification})` : "";
      const action = row.nextAction || row.reason || "Review";
      lines.push(`- ${label}${tag}: ${action}`);
    });
  }

  appendMarkdownListSection(lines, "Notes", summary.tableNotes);
  appendSecurityWarnings(lines, summary);

  return lines.join("\n") || "I could not find enough selected-region table or list content to extract yet.";
}

function buildMarkdownTableFromSmartFill(summary = {}) {
  const rows = sanitizeSmartFillTableRows(summary.tableRows, 10, 6);
  if (!rows.length) return "";

  const headers = sanitizeReviewList(summary.tableHeaders, 6);
  const columnCount = Math.max(headers.length, ...rows.map((row) => row.length), 2);
  const finalHeaders = Array.from({ length: columnCount }, (_, index) => headers[index] || (index === 0 ? "Item" : `Field ${index + 1}`));
  const lines = [
    `| ${finalHeaders.map(cleanMarkdownTableCell).join(" | ")} |`,
    `| ${finalHeaders.map(() => "---").join(" | ")} |`
  ];

  rows.forEach((row) => {
    const cells = Array.from({ length: columnCount }, (_, index) => cleanMarkdownTableCell(row[index] || ""));
    lines.push(`| ${cells.join(" | ")} |`);
  });

  return lines.join("\n");
}

function appendMarkdownListSection(lines, title, values) {
  const items = (Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .slice(0, 6);

  if (!items.length) return;
  if (lines.length) lines.push("");
  lines.push(`**${title}**`);
  items.forEach((item) => lines.push(`- ${item}`));
}

function appendSecurityWarnings(lines, summary = {}) {
  appendMarkdownListSection(lines, "Safety note", summary.securityWarnings);
}

function renderContextualWritingActionRow(summary = {}, markdown = "") {
  if (!isContextualWritingSummary(summary)) return "";

  const copyButton = renderCopyWritingDraftButton(summary);
  const saveMemoButton = renderSaveMemoButton(
    summary.context
      ? buildContextSummaryMemoCandidate(summary, markdown)
      : buildPageSummaryMemoCandidate(summary, markdown)
  );
  return `
    <div class="chat-action-row contextual-writing-action-row">
      ${copyButton}
      ${saveMemoButton}
    </div>
  `;
}

function renderCopyWritingDraftButton(summary = {}) {
  const copyId = registerCopyCandidate(summary.draft || "");
  if (!copyId) return "";

  return `<button class="secondary-button" type="button" data-chat-action="copy-writing-draft" data-copy-id="${escapeHtml(copyId)}">${escapeHtml(msg("copyDraft"))}</button>`;
}

function registerCopyCandidate(value = "") {
  const draft = sanitizeMemoBody(value);
  if (!draft) return "";

  const copyId = `copy-candidate-${hashMemoString(draft)}`;
  copyCandidatesById.set(copyId, draft);

  if (copyCandidatesById.size > 30) {
    const firstKey = copyCandidatesById.keys().next().value;
    if (firstKey) copyCandidatesById.delete(firstKey);
  }

  return copyId;
}

function renderSmartFillActionRow(summary = {}, markdown = "") {
  if (!isSmartFillSummary(summary)) return "";

  const tableText = summary.markdownTable || buildMarkdownTableFromSmartFill(summary);
  const csvText = String(summary.csv || "").trim();
  const tableCopyId = registerCopyCandidate(tableText);
  const csvCopyId = registerCopyCandidate(csvText);
  const saveMemoButton = renderSaveMemoButton(buildPageSummaryMemoCandidate(summary, markdown));
  const hasRows = Array.isArray(summary.tableRows) && summary.tableRows.length > 0;

  return `
    <div class="chat-action-row smart-fill-action-row">
      ${tableCopyId ? `<button class="secondary-button" type="button" data-chat-action="copy-smart-fill-table" data-copy-id="${escapeHtml(tableCopyId)}">${escapeHtml(msg("copyTable"))}</button>` : ""}
      ${csvCopyId ? `<button class="secondary-button" type="button" data-chat-action="copy-smart-fill-csv" data-copy-id="${escapeHtml(csvCopyId)}">${escapeHtml(msg("copyCsv"))}</button>` : ""}
      ${hasRows ? `<button class="secondary-button" type="button" data-chat-action="todo-smart-fill">${escapeHtml(msg("createTodo"))}</button>` : ""}
      ${saveMemoButton}
    </div>
  `;
}

function renderPageReviewActionRow(summary = {}, markdown = "") {
  if (!isPageReviewSummary(summary)) return "";

  const saveMemoButton = renderSaveMemoButton(buildPageSummaryMemoCandidate(summary, markdown));
  return `
    <div class="chat-action-row page-review-action-row">
      ${saveMemoButton}
      <button class="secondary-button" type="button" data-chat-action="todo-page-review">${escapeHtml(msg("createTodo"))}</button>
    </div>
  `;
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

  if (["loading", "error", "tool-card", "memo-saved", "run-transcript"].includes(status)) {
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

  if (draft.status === "research-addendum") {
    return renderResearchAddendumCard(draft);
  }

  if (draft.status === "search-provider-needed") {
    return renderSearchProviderNeeded(draft);
  }

  if (draft.status === "todo-created") {
    return renderTodoCreatedMessage(draft);
  }

  if (draft.status === "todo-updated") {
    return renderAssistantMarkdownMessage(draft.answer || buildTodoUpdatedMarkdown(draft.task || {}), "todo-updated-message");
  }

  if (draft.status === "memo-saved") {
    return renderAssistantMarkdownMessage(draft.answer || "", "memo-saved-message");
  }

  if (draft.status === "workspace-goal") {
    return renderAssistantMarkdownMessage(draft.answer || "", "workspace-goal-message");
  }

  if (draft.status === "run-transcript") {
    return renderAssistantMarkdownMessage(draft.answer || buildAgentRunTranscriptMarkdown(draft.transcript), "run-transcript-message");
  }

  if (draft.status === "link-detected") {
    return renderDetectedLinksMessage(draft);
  }

  if (draft.status === "link-fetched") {
    return renderFetchedLinkMessage(draft);
  }

  if (draft.status === "browser-work-search") {
    return renderBrowserWorkSearchMessage(draft);
  }

  if (draft.status === "work-brief") {
    return renderWorkBriefMessage(draft);
  }

  if (draft.status === "workspace-chat") {
    return renderWorkspaceChatMessage(draft);
  }

  if (draft.status === "safe-command" || draft.type === "tab_state") {
    return renderSafeCommandPreview(draft);
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

function renderSafeCommandPreview(draft = {}) {
  return `
    <article class="assistant-answer-message safe-command-message">
      <div class="chat-answer markdown-message">${renderSafeMarkdown(draft.answer || "")}</div>
      <div class="chat-action-row">
        <button class="primary-button" type="button" data-chat-action="apply" data-draft-id="${escapeHtml(draft.id || "")}">${escapeHtml(msg("apply"))}</button>
        <button class="secondary-button" type="button" data-chat-action="cancel" data-draft-id="${escapeHtml(draft.id || "")}">${escapeHtml(msg("cancel"))}</button>
      </div>
    </article>
  `;
}

function renderAIAgentCard(draft) {
  const answer = draft.answer || "";

  return renderAssistantMarkdownMessage(
    answer,
    "ai-agent-card",
    "",
    buildAIAgentSourceChips(draft),
    renderSaveMemoActionRow({
      title: inferMemoTitle({ context: activeSidebarContext }, answer),
      body: answer,
      source: "ai_agent_chat",
      tags: ["agent-chat", draft.provider].filter(Boolean),
      context: activeSidebarContext,
      provider: draft.provider,
      aiUsed: true
    })
  );
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
      ${
        results.length
          ? `<div class="chat-action-row">
              <button class="secondary-button" type="button" data-chat-action="decision-from-search-results">${escapeHtml(msg("decisionBriefFromSearchResults"))}</button>
            </div>`
          : ""
      }
    </article>
  `;
}

function renderResearchAddendumCard(draft) {
  const results = Array.isArray(draft.results) ? draft.results.slice(0, 5) : [];

  return `
    <article class="assistant-answer-message web-search-message research-addendum-message">
      <div class="chat-answer markdown-message">${renderSafeMarkdown(draft.answer || "")}</div>
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
              <button class="secondary-button" type="button" data-chat-action="fetch-detected-link" data-link-index="${escapeHtml(String(links[0].index || 0))}">${escapeHtml(msg("fetchLink"))}</button>
            </div>`
          : ""
      }
    </article>
  `;
}

function renderFetchedLinkMessage(draft = {}) {
  const summary = draft.summary || draft.link || {};
  const markdown = draft.answer || buildFetchedLinkMarkdown(summary);

  return renderAssistantMarkdownMessage(
    markdown,
    "link-fetched-message",
    "",
    buildFetchedLinkSourceChips(summary),
    renderSaveMemoActionRow(buildFetchedLinkMemoCandidate(summary, markdown))
  );
}

function buildFetchedLinkMarkdown(summary = {}) {
  const lines = [];
  const answer = String(summary?.summary || summary?.answer || "").trim();
  const keyPoints = (Array.isArray(summary?.keyPoints) ? summary.keyPoints : [])
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 4);
  const title = cleanMarkdownLine(summary?.title || summary?.hostname || "");

  if (answer) lines.push(answer);
  if (!answer && title) lines.push(`I fetched **${title}** and extracted readable text from the link.`);

  if (keyPoints.length) {
    if (lines.length) lines.push("");
    lines.push("**Key points**");
    keyPoints.forEach((point) => lines.push(`- ${point}`));
  }

  if (summary?.suggestedAction || summary?.suggestedGroup) {
    if (lines.length) lines.push("");
    lines.push(`Suggested next: ${[
      summary.suggestedAction ? `mark as ${summary.suggestedAction}` : "",
      summary.suggestedGroup ? `group with ${summary.suggestedGroup}` : ""
    ].filter(Boolean).join(", ")}.`);
  }

  return lines.join("\n") || msg("fetchLinkNoReadableText");
}

function renderBrowserWorkSearchMessage(draft = {}) {
  const tabs = Array.isArray(draft.matchedTabs) ? draft.matchedTabs : [];
  let tabRows = "";

  if (tabs.length) {
    tabRows = renderChatMatchedTabs(tabs, draft.matchedTabCount, { showOpenAction: true });
  }

  return `
    <article class="assistant-answer-message browser-work-search-message">
      <div class="chat-answer markdown-message">${renderSafeMarkdown(draft.answer || "")}</div>
    </article>
    ${tabRows}
  `;
}

function renderWorkBriefMessage(draft = {}) {
  const tabs = Array.isArray(draft.matchedTabs) ? draft.matchedTabs : [];
  let tabRows = "";

  if (tabs.length) {
    tabRows = renderChatMatchedTabs(tabs, draft.matchedTabCount, { showOpenAction: true });
  }

  return `
    <article class="assistant-answer-message work-brief-message">
      <div class="chat-answer markdown-message">${renderSafeMarkdown(draft.answer || "")}</div>
    </article>
    ${tabRows}
  `;
}

function renderWorkspaceChatMessage(draft = {}) {
  const tabs = Array.isArray(draft.matchedTabs) ? draft.matchedTabs : [];
  let tabRows = "";

  if (tabs.length) {
    tabRows = renderChatMatchedTabs(tabs, draft.matchedTabCount, { showOpenAction: true });
  }

  return `
    <article class="assistant-answer-message workspace-chat-message">
      <div class="chat-answer markdown-message">${renderSafeMarkdown(draft.answer || "")}</div>
    </article>
    ${tabRows}
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

function buildResearchSearchAddendumMarkdown({ query = "", queries = [], result = {}, results = [], researchSummary = {} } = {}) {
  const safeQuery = cleanMarkdownLine(query || result.query || "");
  const safeQueries = (Array.isArray(queries) ? queries : result.queries || [])
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 3);
  const providerLabel = cleanMarkdownLine(result.providerLabel || result.provider || msg("webSearch"));
  const providerAnswer = cleanMarkdownLine(result.answer || "").slice(0, 260);
  const strongestSourceLabel = buildResearchAddendumSourceLabel((Array.isArray(results) ? results : [])[0]);
  const missingInformation = (Array.isArray(researchSummary.missingInformation) ? researchSummary.missingInformation : [])
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 3);
  const findingCandidates = Array.isArray(researchSummary.researchFindings) && researchSummary.researchFindings.length
    ? researchSummary.researchFindings
    : [
        ...(Array.isArray(researchSummary.decisionCriteria) ? researchSummary.decisionCriteria : []),
        ...(Array.isArray(researchSummary.assumptions) ? researchSummary.assumptions : []),
        ...(Array.isArray(researchSummary.recommendations) ? researchSummary.recommendations : []),
        researchSummary.recommendation || ""
      ];
  const findings = findingCandidates
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 2);
  const nextSteps = (Array.isArray(researchSummary.recommendations) ? researchSummary.recommendations : [])
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 2);
  const lines = [`**${msg("researchAddendumTitle")}**`];

  if (safeQueries.length > 1) {
    lines.push(msg("researchAddendumCheckedMultiple", [safeQueries.length]));
    safeQueries.forEach((item) => lines.push(`- ${item}`));
  } else {
    lines.push(msg("researchAddendumChecked", [safeQueries[0] || safeQuery || msg("webSearch")]));
  }

  if (providerAnswer) {
    lines.push("", `**${msg("researchAddendumProviderSummary")}**`, providerAnswer);
  }

  lines.push("", `**${msg("researchAddendumHowItChangesBrief")}**`);
  if (strongestSourceLabel && missingInformation.length) {
    lines.push(msg("researchAddendumExternalSignal", [
      `[1] ${strongestSourceLabel}`,
      missingInformation[0]
    ]));
  } else if (strongestSourceLabel) {
    lines.push(msg("researchAddendumExternalContext", [strongestSourceLabel]));
  } else {
    lines.push(msg("researchAddendumNoSignals"));
  }
  if (findings.length) {
    lines.push(msg("researchAddendumKeepsBoundary", [findings[0]]));
  }

  const nextStep = missingInformation[1] || nextSteps[0] || "";
  if (nextStep) {
    lines.push("", `**${msg("researchAddendumNextStep")}**`);
    lines.push(`- ${nextStep}`);
  }

  lines.push("", msg("researchAddendumBoundary", [providerLabel]));
  return lines.join("\n");
}

function buildResearchAddendumSourceLabel(result = {}) {
  const title = cleanMarkdownLine(result.title || result.hostname || msg("webSearchResult")).slice(0, 92);
  const hostname = cleanMarkdownLine(result.hostname || "").slice(0, 64);

  if (!title && !hostname) return "";
  return hostname ? `${title || hostname} (${hostname})` : title;
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
  const markdown = buildContextTabsSummaryMarkdown(summary, keyPoints, recommendations);
  const transcript = buildContextRunTranscript(summary, markdown);
  const actionRow = appendRunTranscriptAction(
    renderContextualWritingActionRow(summary, markdown) || renderCompareTabsActionRow(summary, markdown) || renderResearchBriefActionRow(summary, markdown) || renderDecisionBriefActionRow(summary, markdown) || renderSaveMemoActionRow(
      buildContextSummaryMemoCandidate(summary, markdown),
      "context-summary-action-row"
    ),
    transcript
  );

  return renderAssistantMarkdownMessage(
    markdown,
    "context-tabs-message context-tabs-card",
    `data-provider="${escapeHtml(summary?.provider || "")}" data-ai-used="${summary?.aiUsed ? "true" : "false"}"`,
    buildContextSourceChips(summary),
    actionRow
  );
}

function buildContextTabsSummaryMarkdown(summary, keyPoints = [], recommendations = []) {
  if (isContextualWritingSummary(summary)) {
    return buildContextualWritingMarkdown(summary);
  }

  if (summary?.workflow === "decision_brief") {
    return buildDecisionBriefMarkdown(summary, keyPoints, recommendations);
  }

  if (summary?.workflow === "research_brief") {
    return buildResearchBriefMarkdown(summary, keyPoints, recommendations);
  }

  if (summary?.workflow === "compare_selected_tabs" || Array.isArray(summary?.comparisonRows) && summary.comparisonRows.length) {
    return buildCompareSelectedTabsMarkdown(summary, keyPoints, recommendations);
  }

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

  appendSecurityWarnings(lines, summary);

  return lines.join("\n") || "I read the selected tabs, but I do not have enough clear content to answer yet.";
}

function buildCompareSelectedTabsMarkdown(summary, keyPoints = [], recommendations = []) {
  const lines = [];
  const answer = String(summary?.summary || summary?.answer || "").trim();
  const recommendation = String(summary?.recommendation || "").trim();
  const rows = (Array.isArray(summary?.comparisonRows) ? summary.comparisonRows : []).slice(0, 6);
  const tradeoffs = (Array.isArray(summary?.tradeoffs) ? summary.tradeoffs : []).map(cleanMarkdownLine).filter(Boolean).slice(0, 3);
  const missingInformation = (Array.isArray(summary?.missingInformation) ? summary.missingInformation : []).map(cleanMarkdownLine).filter(Boolean).slice(0, 3);
  const sourceNotes = (Array.isArray(summary?.sourceNotes) ? summary.sourceNotes : []).map(cleanMarkdownLine).filter(Boolean).slice(0, 4);
  const cleanPoints = keyPoints.map(cleanMarkdownLine).filter(Boolean).slice(0, 3);
  const cleanRecommendations = recommendations.map(cleanMarkdownLine).filter(Boolean).slice(0, 2);

  if (answer) lines.push(answer);
  if (recommendation) {
    if (lines.length) lines.push("");
    lines.push(`**Recommendation:** ${recommendation}`);
  }

  if (rows.length) {
    if (lines.length) lines.push("");
    lines.push("| Source | Why it matters | Watch out |");
    lines.push("|---|---|---|");
    rows.forEach((row) => {
      const why = [row.bestFor, row.evidence].map(cleanMarkdownLine).filter(Boolean).join(": ");
      lines.push([
        cleanMarkdownTableCell(row.title || "Untitled"),
        cleanMarkdownTableCell(why || "Reference"),
        cleanMarkdownTableCell(row.watchOut || "")
      ].join("|").replace(/^/, "|").replace(/$/, "|"));
    });
  }

  if (tradeoffs.length) {
    if (lines.length) lines.push("");
    lines.push("**Tradeoffs**");
    tradeoffs.forEach((item) => lines.push(`- ${item}`));
  }

  if (missingInformation.length) {
    if (lines.length) lines.push("");
    lines.push("**Missing information**");
    missingInformation.forEach((item) => lines.push(`- ${item}`));
  }

  if (sourceNotes.length || cleanPoints.length) {
    if (lines.length) lines.push("");
    lines.push("**Source notes**");
    [...sourceNotes, ...cleanPoints].slice(0, 4).forEach((item) => lines.push(`- ${item}`));
  }

  if (cleanRecommendations.length) {
    if (lines.length) lines.push("");
    lines.push(`Suggested next: ${cleanRecommendations.join(" ")}`);
  }

  appendSecurityWarnings(lines, summary);

  return lines.join("\n") || "I read the selected tabs, but I do not have enough clear content to compare yet.";
}

function buildResearchBriefMarkdown(summary, keyPoints = [], recommendations = []) {
  const lines = [];
  const answer = String(summary?.summary || summary?.answer || "").trim();
  const findings = (Array.isArray(summary?.researchFindings) ? summary.researchFindings : keyPoints).map(cleanMarkdownLine).filter(Boolean).slice(0, 4);
  const contradictions = (Array.isArray(summary?.contradictions) ? summary.contradictions : []).map(cleanMarkdownLine).filter(Boolean).slice(0, 3);
  const missingInformation = (Array.isArray(summary?.missingInformation) ? summary.missingInformation : []).map(cleanMarkdownLine).filter(Boolean).slice(0, 4);
  const nextSteps = (Array.isArray(summary?.recommendations) ? summary.recommendations : recommendations).map(cleanMarkdownLine).filter(Boolean).slice(0, 4);
  const sourceNotes = (Array.isArray(summary?.sourceNotes) ? summary.sourceNotes : []).map(cleanMarkdownLine).filter(Boolean).slice(0, 5);

  if (answer) lines.push(answer);

  if (findings.length) {
    if (lines.length) lines.push("");
    lines.push("**Findings**");
    findings.forEach((item) => lines.push(`- ${item}`));
  }

  if (contradictions.length) {
    if (lines.length) lines.push("");
    lines.push("**Contradictions**");
    contradictions.forEach((item) => lines.push(`- ${item}`));
  }

  if (missingInformation.length) {
    if (lines.length) lines.push("");
    lines.push("**Gaps**");
    missingInformation.forEach((item) => lines.push(`- ${item}`));
  }

  if (nextSteps.length) {
    if (lines.length) lines.push("");
    lines.push("**Next steps**");
    nextSteps.forEach((item) => lines.push(`- ${item}`));
  }

  if (sourceNotes.length) {
    if (lines.length) lines.push("");
    lines.push("**Sources**");
    sourceNotes.forEach((item) => lines.push(`- ${item}`));
  }

  appendSecurityWarnings(lines, summary);

  return lines.join("\n") || "I read the selected tabs, but I do not have enough clear content to build a research brief yet.";
}

function buildDecisionBriefMarkdown(summary, keyPoints = [], recommendations = []) {
  const lines = [];
  const answer = String(summary?.summary || summary?.answer || "").trim();
  const recommendation = cleanMarkdownLine(summary?.recommendation || "");
  const rows = (Array.isArray(summary?.comparisonRows) ? summary.comparisonRows : []).slice(0, 6);
  const criteria = (Array.isArray(summary?.decisionCriteria) ? summary.decisionCriteria : []).map(cleanMarkdownLine).filter(Boolean).slice(0, 4);
  const tradeoffs = (Array.isArray(summary?.tradeoffs) ? summary.tradeoffs : []).map(cleanMarkdownLine).filter(Boolean).slice(0, 4);
  const assumptions = (Array.isArray(summary?.assumptions) ? summary.assumptions : []).map(cleanMarkdownLine).filter(Boolean).slice(0, 4);
  const missingInformation = (Array.isArray(summary?.missingInformation) ? summary.missingInformation : []).map(cleanMarkdownLine).filter(Boolean).slice(0, 4);
  const sourceNotes = (Array.isArray(summary?.sourceNotes) ? summary.sourceNotes : []).map(cleanMarkdownLine).filter(Boolean).slice(0, 5);
  const nextSteps = (Array.isArray(summary?.recommendations) ? summary.recommendations : recommendations).map(cleanMarkdownLine).filter(Boolean).slice(0, 3);
  const cleanPoints = keyPoints.map(cleanMarkdownLine).filter(Boolean).slice(0, 3);

  if (answer) lines.push(answer);
  if (recommendation) {
    if (lines.length) lines.push("");
    lines.push(`**Recommendation:** ${recommendation}`);
  }

  if (criteria.length) {
    if (lines.length) lines.push("");
    lines.push("**Decision criteria**");
    criteria.forEach((item) => lines.push(`- ${item}`));
  }

  if (rows.length) {
    if (lines.length) lines.push("");
    lines.push("| Source | Decision value | Risk / gap |");
    lines.push("|---|---|---|");
    rows.forEach((row) => {
      const value = [row.bestFor, row.evidence].map(cleanMarkdownLine).filter(Boolean).join(": ");
      lines.push([
        cleanMarkdownTableCell(row.title || "Untitled"),
        cleanMarkdownTableCell(value || "Decision evidence"),
        cleanMarkdownTableCell(row.watchOut || "")
      ].join("|").replace(/^/, "|").replace(/$/, "|"));
    });
  }

  if (tradeoffs.length) {
    if (lines.length) lines.push("");
    lines.push("**Tradeoffs**");
    tradeoffs.forEach((item) => lines.push(`- ${item}`));
  }

  if (assumptions.length) {
    if (lines.length) lines.push("");
    lines.push("**Assumptions**");
    assumptions.forEach((item) => lines.push(`- ${item}`));
  }

  if (missingInformation.length) {
    if (lines.length) lines.push("");
    lines.push("**Missing information**");
    missingInformation.forEach((item) => lines.push(`- ${item}`));
  }

  if (sourceNotes.length || cleanPoints.length) {
    if (lines.length) lines.push("");
    lines.push("**Sources**");
    [...sourceNotes, ...cleanPoints].slice(0, 5).forEach((item) => lines.push(`- ${item}`));
  }

  if (nextSteps.length) {
    if (lines.length) lines.push("");
    lines.push("**Next steps**");
    nextSteps.forEach((item) => lines.push(`- ${item}`));
  }

  appendSecurityWarnings(lines, summary);

  return lines.join("\n") || "I read the selected tabs, but I do not have enough clear content to build a decision brief yet.";
}

function cleanMarkdownLine(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanMarkdownTableCell(value) {
  return cleanMarkdownLine(value)
    .replace(/\|/g, "/")
    .slice(0, 180);
}

function renderCompareTabsActionRow(summary = {}, markdown = "") {
  if (!isCompareTabsSummary(summary)) return "";

  const hasMissingInfo = Array.isArray(summary.missingInformation) && summary.missingInformation.some((item) => String(item || "").trim());
  const saveMemoButton = renderSaveMemoButton(buildContextSummaryMemoCandidate(summary, markdown));

  return `
    <div class="chat-action-row compare-action-row">
      ${saveMemoButton}
      <button class="secondary-button" type="button" data-chat-action="todo-compare-result">${escapeHtml(msg("createTodo"))}</button>
      ${
        hasMissingInfo
          ? `<button class="secondary-button" type="button" data-chat-action="research-compare-missing">${escapeHtml(msg("researchMissingInfo"))}</button>`
          : ""
      }
    </div>
  `;
}

function renderResearchBriefActionRow(summary = {}, markdown = "") {
  if (!isResearchBriefSummary(summary)) return "";

  const hasMissingInfo = Array.isArray(summary.missingInformation) && summary.missingInformation.some((item) => String(item || "").trim());
  const saveMemoButton = renderSaveMemoButton(buildContextSummaryMemoCandidate(summary, markdown));
  const isSourceOnlyBrief = ["saved_sources", "search_results", "visible_screenshot"].includes(summary.source) ||
    ["saved_sources", "search_results", "visible_screenshot"].includes(summary.context?.scope);

  return `
    <div class="chat-action-row research-brief-action-row">
      ${saveMemoButton}
      ${isSourceOnlyBrief ? "" : `<button class="secondary-button" type="button" data-chat-action="todo-research-brief">${escapeHtml(msg("createTodo"))}</button>`}
      ${
        hasMissingInfo
          ? `<button class="secondary-button" type="button" data-chat-action="research-brief-missing">${escapeHtml(msg("researchMissingInfo"))}</button>`
          : ""
      }
    </div>
  `;
}

function renderDecisionBriefActionRow(summary = {}, markdown = "") {
  if (!isDecisionBriefSummary(summary)) return "";

  const hasMissingInfo = Array.isArray(summary.missingInformation) && summary.missingInformation.some((item) => String(item || "").trim());
  const saveMemoButton = renderSaveMemoButton(buildContextSummaryMemoCandidate(summary, markdown));
  const isSourceOnlyBrief = ["saved_sources", "search_results", "visible_screenshot"].includes(summary.source) || ["saved_sources", "search_results", "visible_screenshot"].includes(summary.context?.scope);

  return `
    <div class="chat-action-row decision-brief-action-row">
      ${saveMemoButton}
      ${isSourceOnlyBrief ? "" : `<button class="secondary-button" type="button" data-chat-action="todo-decision-brief">${escapeHtml(msg("createTodo"))}</button>`}
      ${
        hasMissingInfo
          ? `<button class="secondary-button" type="button" data-chat-action="decision-brief-missing">${escapeHtml(msg("researchMissingInfo"))}</button>`
          : ""
      }
    </div>
  `;
}

function renderAssistantMarkdownMessage(markdown, className = "", attributes = "", sourceChips = [], actionRow = "") {
  return `
    <article class="assistant-answer-message ${escapeHtml(className)}" ${attributes}>
      <div class="chat-answer markdown-message">${renderSafeMarkdown(markdown)}</div>
      ${renderSourceChips(sourceChips)}
      ${actionRow}
    </article>
  `;
}

function renderSourceChips(chips = []) {
  const safeChips = (Array.isArray(chips) ? chips : [])
    .filter((chip) => chip?.label)
    .slice(0, 5);

  if (!safeChips.length) return "";

  return `
    <div class="source-chip-row" aria-label="${escapeHtml(msg("sourceChipsLabel"))}">
      ${safeChips.map(renderSourceChip).join("")}
    </div>
  `;
}

function renderSourceChip(chip = {}) {
  const label = String(chip.label || "").trim();
  const detail = String(chip.detail || "").trim();
  const tone = String(chip.tone || "neutral").replace(/[^a-z-]/g, "");
  const hasTabId = chip.tabId !== null && chip.tabId !== undefined && chip.tabId !== "";
  const tabId = Number(chip.tabId);
  const content = `
    <span>${escapeHtml(label)}</span>
    ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
  `;

  if (hasTabId && Number.isInteger(tabId)) {
    return `
      <button class="source-chip ${escapeHtml(tone)} is-action" type="button" data-chat-action="focus-tab" data-tab-id="${escapeHtml(String(tabId))}">
        ${content}
      </button>
    `;
  }

  return `<span class="source-chip ${escapeHtml(tone)}">${content}</span>`;
}

function buildPageSourceChips(summary = {}) {
  const toolCard = summary.toolCard || {};
  const sourceType = summary.source || toolCard.scope?.type || "current_page";
  const chips = [
    {
      label: getPageSourceTypeLabel(sourceType),
      detail: summary.title || summary.hostname || "",
      tabId: Number.isInteger(Number(summary.tabId)) ? Number(summary.tabId) : null
    }
  ];

  if (summary.hostname) {
    chips.push({ label: summary.hostname, detail: msg("sourceSite") });
  }

  chips.push(buildReadStatusSourceChip(summary, toolCard));
  chips.push({ label: msg("sourceNotSaved"), detail: msg("sourceSessionOnly") });

  if (summary.privacy?.sentFullUrls === false || summary.privacy?.sentFullUrls === undefined) {
    chips.push({ label: msg("sourceNoFullUrl") });
  }

  return chips.filter(Boolean);
}

function buildContextSourceChips(summary = {}) {
  const toolCard = summary.toolCard || {};
  const scope = toolCard.scope || {};
  const context = summary.context || {};
  const scopeType = context.scope || scope.type || "selected_tabs";
  const label = scopeType === "current_group" ? msg("sourceCurrentGroup") : msg("sourceSelectedTabs");
  const requested = Number(scope.requestedTabCount || context.tabCount || 0);
  const read = Number(scope.readTabCount || summary.groupSummary?.readTabCount || 0);
  const skipped = Number(scope.skippedTabCount || summary.groupSummary?.skippedTabCount || 0);
  const groupName = context.groupName || summary.groupSummary?.label || "";

  return [
    {
      label,
      detail: groupName || (requested ? formatTabCountLabel(requested) : "")
    },
    {
      label: msg("sourceReadSkipped", [read, skipped]),
      tone: skipped > 0 ? "partial" : "ok"
    },
    {
      label: msg("sourceNotSaved"),
      detail: toolCard.storage === "session_only" ? msg("sourceSessionOnly") : ""
    },
    {
      label: msg("sourceNoFullUrl")
    }
  ];
}

function buildFetchedLinkSourceChips(summary = {}) {
  const chips = [
    {
      label: msg("sourceFetchedLink"),
      detail: summary.hostname || summary.title || ""
    },
    {
      label: msg("sourceNotSaved"),
      detail: msg("sourceSessionOnly")
    },
    {
      label: msg("sourceNoFullUrl")
    }
  ];

  if (summary.aiUsed) {
    chips.push({ label: msg("sourceAI"), detail: summary.provider || "" });
  } else {
    chips.push({ label: msg("sourceLocalExtract") });
  }

  return chips;
}

function buildAIAgentSourceChips(draft = {}) {
  const privacy = draft.privacy || {};
  const matchedCount = Number(draft.matchedTabCount || draft.matchedTabs?.length || 0);
  const chips = [];

  if (privacy.sentTabMetadata || matchedCount) {
    chips.push({
      label: msg("sourceTabMetadata"),
      detail: matchedCount ? formatTabCountLabel(matchedCount) : ""
    });
  }

  if (privacy.sentPageText === false || privacy.sentPageText === undefined) {
    chips.push({ label: msg("sourceNoPageText") });
  }

  if (privacy.sentFullUrls === false || privacy.sentFullUrls === undefined) {
    chips.push({ label: msg("sourceNoFullUrl") });
  }

  return chips;
}

function getPageSourceTypeLabel(sourceType) {
  if (sourceType === "selected_text") return msg("sourceSelectedText");
  if (sourceType === "selected_region" || sourceType === "page_region") return msg("sourcePageRegion");
  if (sourceType === "visible_screenshot") return msg("sourceVisibleScreenshot");
  if (sourceType === "saved_sources") return msg("sourceSavedSources");
  if (sourceType === "search_results") return msg("sourceSearchResults");
  return msg("sourceCurrentPage");
}

function buildReadStatusSourceChip(summary = {}, toolCard = {}) {
  const scope = toolCard.scope || {};
  const read = Number(scope.readTabCount || 0);
  const skipped = Number(scope.skippedTabCount || 0);

  if (read || skipped) {
    return {
      label: msg("sourceReadSkipped", [read, skipped]),
      tone: skipped > 0 ? "partial" : "ok"
    };
  }

  if (summary.status === "unreadable" || summary.status === "needs-ai-config" || summary.status === "needs-vision-model" || summary.status === "needs-confirmation") {
    return {
      label: msg("sourceMetadataOnly"),
      tone: "partial"
    };
  }

  if (summary.privacy?.sentScreenshot) {
    return {
      label: msg("sourceScreenshotSent"),
      tone: "ok"
    };
  }

  if (summary.extractedChars || summary.privacy?.sentPageText) {
    return {
      label: msg("sourceVisibleTextRead"),
      tone: "ok"
    };
  }

  return {
    label: msg("sourceMetadataOnly"),
    tone: "partial"
  };
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
  const isSelectedText = scope.type === "selected_text";
  const isWebSearch = scope.type === "web_search";
  const isFetchedLink = scope.type === "pasted_link";
  const isVisibleScreenshot = scope.type === "visible_screenshot";
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
    : isFetchedLink
    ? (read > 0 ? msg("toolCardFetchLinkReady") : msg("toolCardFetchLinkPending", [scope.hostname || msg("linkedSource")]))
    : isSelectedText
    ? (read > 0 ? msg("toolCardSelectedTextReady") : msg("toolCardSelectedTextPending"))
    : isPageRegion
    ? (read > 0 ? msg("toolCardRegionSelected") : msg("toolCardRegionPending"))
    : isVisibleScreenshot
    ? (read > 0 ? msg("toolCardScreenshotCaptured") : msg("toolCardScreenshotPending"))
    : `${read || 0}/${Math.min(requested || maxTabs, maxTabs)} tabs`;
  const dataCopy = isWebSearch
    ? msg("toolCardDataSearchQuery")
    : isFetchedLink
    ? msg("toolCardDataFetchedLink")
    : isSelectedText
    ? msg("toolCardDataSelectedText")
    : isPageRegion
    ? (Array.isArray(toolCard.dataUsed) && toolCard.dataUsed.includes("cropped_region_image")
        ? msg("toolCardDataSelectedRegionVision")
        : msg("toolCardDataSelectedRegion"))
    : isVisibleScreenshot
    ? msg("toolCardDataVisibleScreenshot")
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
    : isSelectedText
    ? (toolCard.label || msg("toolCardSelectedText"))
    : isPageRegion
    ? scopeCopy
    : isVisibleScreenshot
    ? (toolCard.label || msg("toolCardVisibleScreenshot"))
    : toolCard.label || msg("toolCardReadGroupPages");
  const detailParts = isWebSearch
    ? [scopeCopy, dataCopy, webSearchStatusCopy, msg("toolCardStorageSessionOnly")]
    : isSelectedText
    ? [scopeCopy, dataCopy, msg("toolCardStorageSessionOnly"), skippedCopy, skippedReasonCopy].filter(Boolean)
    : isPageRegion
    ? [dataCopy, msg("toolCardStorageSessionOnly")]
    : isVisibleScreenshot
    ? [scopeCopy, dataCopy, msg("toolCardStorageSessionOnly"), skippedCopy, skippedReasonCopy].filter(Boolean)
    : [scopeCopy, dataCopy, msg("toolCardStorageSessionOnly"), skippedCopy, skippedReasonCopy].filter(Boolean);
  const permissionCopy = formatToolCardPermissionCopy(toolCard);
  const blockedCopy = formatToolCardBlockedCopy(toolCard);
  const safetyCopy = toolCard.security?.pageTextTrusted === false ? msg("toolCardUntrustedSource") : "";
  const safetyParts = [permissionCopy, blockedCopy, safetyCopy].filter(Boolean);

  return `
    <article class="agent-tool-card ${isPageRegion ? "page-region-tool" : ""} ${isSelectedText ? "selected-text-tool" : ""} ${isVisibleScreenshot ? "screenshot-tool" : ""} ${isWebSearch ? "web-search-tool" : ""} ${escapeHtml(status)}">
      <p class="agent-tool-card-header chat-answer">
        <span class="tool-dot" aria-hidden="true"></span>
        <strong>${escapeHtml(titleCopy)}</strong>
      </p>
      <div class="agent-tool-card-grid">
        ${detailParts.map((part) => `<span>${escapeHtml(part)}</span>`).join("")}
      </div>
      ${safetyParts.length ? `
        <div class="agent-tool-card-grid agent-tool-card-safety">
          ${safetyParts.map((part) => `<span>${escapeHtml(part)}</span>`).join("")}
        </div>
      ` : ""}
    </article>
  `;
}

function formatToolCardPermissionCopy(toolCard = {}) {
  const labels = Array.isArray(toolCard.toolPermissionLabels)
    ? toolCard.toolPermissionLabels
    : formatToolPermissionLabels(toolCard.toolPermissions);
  const text = labels.filter(Boolean).slice(0, 2).join(", ");

  return text ? msg("toolCardAllowed", [text]) : "";
}

function formatToolCardBlockedCopy(toolCard = {}) {
  const labels = Array.isArray(toolCard.blockedActionLabels)
    ? toolCard.blockedActionLabels
    : formatBlockedActionLabels(toolCard.blockedActions);
  const text = labels.filter(Boolean).slice(0, 2).join(", ");

  return text ? msg("toolCardBlocked", [text]) : "";
}

function formatToolPermissionLabels(values = []) {
  const labels = {
    read_visible_page_text_after_user_request: msg("toolPermissionReadVisiblePage"),
    read_selected_text_after_user_request: msg("toolPermissionReadSelectedText"),
    read_selected_page_region_after_user_click: msg("toolPermissionReadPageRegion"),
    capture_selected_region_screenshot_after_user_click: msg("toolPermissionCaptureSelectedRegionScreenshot"),
    capture_visible_screenshot_after_user_click: msg("toolPermissionCaptureVisibleScreenshot"),
    read_selected_tabs_pages_after_site_access: msg("toolPermissionReadSelectedTabs"),
    read_saved_local_sources_after_user_request: msg("toolPermissionReadSavedSources"),
    read_session_search_results_after_user_request: msg("toolPermissionReadSearchResults"),
    search_web_provider_after_user_click: msg("toolPermissionSearchProvider"),
    fetch_user_link_after_permission: msg("toolPermissionFetchLink"),
    write_local_todo: msg("toolPermissionWriteLocalTodo"),
    save_local_memo: msg("toolPermissionSaveLocalMemo"),
    organize_tabs: msg("toolPermissionOrganizeTabs"),
    safe_duplicate_close: msg("toolPermissionSafeDuplicateClose")
  };

  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((value) => labels[value] || String(value || "").replace(/_/g, " "))
    .filter(Boolean)
  )).slice(0, 4);
}

function formatBlockedActionLabels(values = []) {
  const labels = {
    auto_fill: msg("blockedActionAutoFill"),
    auto_submit: msg("blockedActionAutoSubmit"),
    mutate_page: msg("blockedActionMutatePage"),
    insert_text: msg("blockedActionInsertText"),
    close_tabs: msg("blockedActionCloseTabs"),
    close_non_duplicates: msg("blockedActionCloseNonDuplicates"),
    read_unselected_tabs: msg("blockedActionReadUnselectedTabs"),
    read_full_page: msg("blockedActionReadFullPage"),
    read_page_text: msg("blockedActionReadPageText"),
    background_crawl: msg("blockedActionBackgroundCrawl"),
    web_search: msg("blockedActionWebSearch"),
    full_url_upload: msg("blockedActionFullUrlUpload"),
    history_access: msg("blockedActionHistoryAccess"),
    cloud_storage: msg("blockedActionCloudStorage")
  };

  return Array.from(new Set((Array.isArray(values) ? values : [])
    .map((value) => labels[value] || `No ${String(value || "").replace(/_/g, " ")}`)
    .filter(Boolean)
  )).slice(0, 4);
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
    alignAgentThreadToBottom();
    requestAnimationFrame(alignAgentThreadToBottom);
    window.setTimeout(alignAgentThreadToBottom, 80);
  });
}

function alignAgentThreadToBottom() {
  resetHorizontalScroll();
  agentThread.scrollLeft = 0;
  const latestMessage = chatPanel?.lastElementChild;
  if (latestMessage) {
    latestMessage.scrollIntoView({ block: "end", inline: "nearest" });
  }
  agentThread.scrollTop = agentThread.scrollHeight;
  updateAgentThreadScrollState();
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
  if (isVisible) hideComposerPicker();
  organizeButton.disabled = isVisible;
  dashboardTopButton.disabled = isVisible;
  chatInput.disabled = isVisible;
  if (pageRegionButton) pageRegionButton.disabled = isVisible;
  chatSendButton.disabled = isVisible;
  if (verticalTabsOrganizeButton) verticalTabsOrganizeButton.disabled = isVisible;
  if (verticalTabsChatButton) verticalTabsChatButton.disabled = isVisible;
}

function setBusy(isBusy) {
  if (isBusy) hideComposerPicker();
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
  if (run?.source === "safe-duplicate-close") {
    return run?.message || msg("safeDuplicateCloseComplete");
  }

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
  if (run?.source === "safe-duplicate-close") {
    return run?.message || msg("safeDuplicateCloseComplete");
  }

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
  const triageMarkdown = buildLocalAITriageMarkdown(run);

  if (groupsCreated === 0) {
    return msg("scannedNoGroupableTabs", [duplicateCopy]);
  }

  const baseReply = msg("completedAgentReply", [
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

  return [baseReply, triageMarkdown].filter(Boolean).join("\n\n");
}

function buildLocalAITriageMarkdown(run) {
  const triage = buildLocalAITriage(run);
  if (!triage.hasSignal) return "";

  const lines = [
    `**${msg("aiTriageTitle")}**`
  ];

  if (triage.workspaceFocus) {
    lines.push(`- **${msg("aiTriageWorkspaceFocus")}**: ${triage.workspaceFocus}`);
  }

  lines.push(`- **${msg("aiTriageActNow")}**: ${formatAITriageItems(triage.actNow)}`);
  lines.push(`- **${msg("aiTriageReadLater")}**: ${formatAITriageItems(triage.readLater)}`);
  lines.push(`- **${msg("aiTriageReference")}**: ${formatAITriageItems(triage.reference)}`);
  lines.push(`- **${msg("aiTriageCanClose")}**: ${formatAITriageItems(triage.canClose)}`);
  lines.push(`- **${msg("aiTriageNeedsReview")}**: ${formatAITriageItems(triage.needsReview)}`);
  lines.push("", `- ${msg("aiTriageMetadataOnly")}`);

  return lines.join("\n");
}

function buildLocalAITriage(run) {
  const tabs = getSnapshotTabs(run);
  const groups = Array.isArray(run?.groups) ? run.groups : [];
  const summary = run?.summary || {};
  const groupNameByTabId = buildGroupNameByTabId(groups);
  const activeTabs = tabs.filter((tab) => tab.active);
  const actNow = dedupeTriageLabels([
    ...activeTabs.map((tab) => formatAITriageTab(tab, groupNameByTabId)),
    ...tabs.filter(isActNowTabCandidate).map((tab) => formatAITriageTab(tab, groupNameByTabId))
  ]).slice(0, 3);
  const excludedTitles = new Set(actNow.map(normalizeAgentText));
  const readLater = dedupeTriageLabels([
    ...groups
      .filter((group) => isTriageReadLaterGroupName(group.name))
      .map((group) => formatAITriageGroup(group)),
    ...tabs
      .filter((tab) => isReadLaterTabCandidate(tab))
      .map((tab) => formatAITriageTab(tab, groupNameByTabId))
  ])
    .filter((label) => !excludedTitles.has(normalizeAgentText(label)))
    .slice(0, 3);
  readLater.forEach((label) => excludedTitles.add(normalizeAgentText(label)));
  const reference = dedupeTriageLabels([
    ...groups
      .filter((group) => isReferenceGroupName(group.name))
      .map((group) => formatAITriageGroup(group)),
    ...tabs
      .filter((tab) => isReferenceTabCandidate(tab))
      .map((tab) => formatAITriageTab(tab, groupNameByTabId))
  ])
    .filter((label) => !excludedTitles.has(normalizeAgentText(label)))
    .slice(0, 3);
  const safeClosed = Number(summary.safeDuplicatesClosed || 0);
  const canClose = safeClosed > 0
    ? [msg("aiTriageCanCloseClosed", [safeClosed])]
    : [msg("aiTriageCanCloseNone")];
  const reviewGroups = getReviewDuplicateGroups(run);
  const reviewCount = Math.max(Number(summary.reviewDuplicateGroups || 0), reviewGroups.length);
  const needsReview = [
    ...(reviewCount ? [msg("aiTriageReviewDuplicates", [reviewCount])] : []),
    ...tabs.filter(isNeedsReviewTabCandidate).map((tab) => formatAITriageTab(tab, groupNameByTabId))
  ].slice(0, 3);
  const workspaceFocus = inferWorkspaceFocus(run, activeTabs);

  return {
    workspaceFocus,
    actNow,
    readLater,
    reference,
    canClose,
    needsReview,
    hasSignal: tabs.length > 0 || groups.length > 0 || canClose.length > 0 || needsReview.length > 0
  };
}

function buildAITriageLinkedTabs(run) {
  const tabs = getSnapshotTabs(run);

  return dedupeTabsById([
    ...tabs.filter((tab) => tab.active),
    ...tabs.filter(isActNowTabCandidate),
    ...tabs.filter(isNeedsReviewTabCandidate),
    ...tabs.filter(isReadLaterTabCandidate),
    ...tabs.filter(isReferenceTabCandidate)
  ]);
}

function buildAITriageTodoTitle(triage = {}) {
  const focus = String(triage.workspaceFocus || "").replace(/^continue\s+/i, "").trim();
  return msg("todoReviewAITriage", [focus || msg("currentWorkspace")]);
}

function buildAITriageTodoChecklist(triage = {}) {
  const items = [
    triage.workspaceFocus ? `${msg("aiTriageWorkspaceFocus")}: ${triage.workspaceFocus}` : "",
    triage.actNow?.length ? `${msg("aiTriageActNow")}: ${triage.actNow.join("; ")}` : "",
    triage.needsReview?.length ? `${msg("aiTriageNeedsReview")}: ${triage.needsReview.join("; ")}` : "",
    triage.readLater?.length ? `${msg("aiTriageReadLater")}: ${triage.readLater.join("; ")}` : "",
    triage.reference?.length ? `${msg("aiTriageReference")}: ${triage.reference.join("; ")}` : "",
    triage.canClose?.length ? `${msg("aiTriageCanClose")}: ${triage.canClose.join("; ")}` : ""
  ]
    .map(cleanChecklistItem)
    .filter(Boolean);

  return Array.from(new Set(items)).slice(0, 6).length
    ? Array.from(new Set(items)).slice(0, 6)
    : [msg("agentTodoFallbackChecklist")];
}

function sanitizeAITriageForTask(triage = {}) {
  return {
    workspaceFocus: cleanChecklistItem(triage.workspaceFocus || ""),
    actNow: sanitizeTriageTaskList(triage.actNow),
    readLater: sanitizeTriageTaskList(triage.readLater),
    reference: sanitizeTriageTaskList(triage.reference),
    canClose: sanitizeTriageTaskList(triage.canClose),
    needsReview: sanitizeTriageTaskList(triage.needsReview),
    metadataOnly: true
  };
}

function sanitizeTriageTaskList(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => cleanChecklistItem(item))
    .filter(Boolean)
    .slice(0, 5);
}

function buildGroupNameByTabId(groups = []) {
  const map = new Map();

  for (const group of groups) {
    const name = String(group?.name || "").trim();
    if (!name) continue;
    for (const tabId of Array.isArray(group?.tabIds) ? group.tabIds : []) {
      const numericId = Number(tabId);
      if (Number.isInteger(numericId)) map.set(numericId, name);
    }
  }

  return map;
}

function formatAITriageItems(items = []) {
  return items.length ? items.join("; ") : msg("aiTriageNothingObvious");
}

function dedupeTriageLabels(labels = []) {
  const seen = new Set();
  const result = [];

  for (const label of labels) {
    const clean = String(label || "").replace(/\s+/g, " ").trim();
    const key = normalizeAgentText(clean);
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }

  return result;
}

function formatAITriageTab(tab = {}, groupNameByTabId = new Map()) {
  const title = String(tab.title || tab.hostname || msg("untitled")).replace(/\s+/g, " ").trim();
  const groupName = groupNameByTabId.get(Number(tab.id)) || "";
  const meta = groupName || tab.hostname || "";
  const clippedTitle = title.length > 72 ? `${title.slice(0, 69)}...` : title;
  const clippedMeta = String(meta || "").length > 40 ? `${String(meta).slice(0, 37)}...` : meta;

  return clippedMeta ? `${clippedTitle} (${clippedMeta})` : clippedTitle;
}

function formatAITriageGroup(group = {}) {
  const name = String(group.name || group.title || msg("contextUnnamedGroup")).replace(/\s+/g, " ").trim();
  const count = Number(group.tabCount || group.tabIds?.length || 0);
  return count ? `${name} (${count})` : name;
}

function inferWorkspaceFocus(run, activeTabs = []) {
  const groups = Array.isArray(run?.groups) ? run.groups : [];
  const activeGroupId = activeTabs.map((tab) => Number(tab.groupId)).find(Number.isInteger);
  const activeGroup = groups.find((group) => Number(group.id) === activeGroupId);
  const focusGroup = activeGroup || pickWorkBriefGroup(groups, getSnapshotTabs(run));

  if (!focusGroup) return "";

  const name = String(focusGroup.name || focusGroup.title || "").trim();
  const count = Number(focusGroup.tabCount || focusGroup.tabIds?.length || 0);
  if (!name) return "";

  return count ? msg("aiTriageFocusGroup", [name, count]) : name;
}

function isActNowTabCandidate(tab = {}) {
  const text = normalizeAgentText(`${tab.title || ""} ${tab.hostname || ""} ${tab.path || ""}`);
  return /\b(pr|pull request|review|issue|todo|task|checklist|launch|deploy|deployment|error|failed|failing|blocked|incident|alert|settings|database|billing|invoice|admin|security|auth|supabase|vercel|stripe|linear|jira)\b/.test(text) ||
    /待办|任务|检查|发布|部署|失败|错误|阻塞|设置|数据库|账单|安全|权限/.test(text);
}

function isNeedsReviewTabCandidate(tab = {}) {
  const text = normalizeAgentText(`${tab.title || ""} ${tab.hostname || ""} ${tab.path || ""}`);
  return /\b(risk|review|needs review|conflict|duplicate|error|failed|blocked|warning|security|permission|billing|database|settings)\b/.test(text) ||
    /风险|复核|确认|冲突|重复|错误|失败|阻塞|警告|安全|权限|账单|数据库|设置/.test(text);
}

function isReferenceGroupName(name) {
  return /\b(reference|docs?|documentation|api|spec|design reference|examples?)\b|参考|文档|资料|规范/.test(normalizeAgentText(name));
}

function isTriageReadLaterGroupName(name) {
  return /\b(read|reading|article|articles|later|research)\b|阅读|稍后|待读|资料/.test(normalizeAgentText(name));
}

function isReferenceTabCandidate(tab = {}) {
  const text = normalizeAgentText(`${tab.title || ""} ${tab.hostname || ""} ${tab.path || ""}`);
  return /\b(docs?|documentation|api|reference|spec|guide|manual|readme|examples?|stackoverflow|developer\.chrome|mdn)\b/.test(text) ||
    /文档|参考|规范|指南|教程|示例/.test(text);
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
