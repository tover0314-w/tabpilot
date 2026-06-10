import { applyI18n, msg } from "./i18n.js";

const LAST_CLOSED_TABS_KEY = "tabmosaic.lastClosedTabs";
const CHAT_THREAD_LIMIT = 12;

const statusPanel = document.querySelector("#statusPanel");
const metricsGrid = document.querySelector("#metricsGrid");
const hostsList = document.querySelector("#hostsList");
const groupsList = document.querySelector("#groupsList");
const protectedList = document.querySelector("#protectedList");
const duplicatesList = document.querySelector("#duplicatesList");
const privacyPanel = document.querySelector("#privacyPanel");
const scanButton = document.querySelector("#scanButton");
const organizeButton = document.querySelector("#organizeButton");
const undoButton = document.querySelector("#undoButton");
const restoreButton = document.querySelector("#restoreButton");
const dashboardButton = document.querySelector("#dashboardButton");
const startButton = document.querySelector("#startButton");
const summaryButton = document.querySelector("#summaryButton");
const summaryPanel = document.querySelector("#summaryPanel");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatSendButton = document.querySelector("#chatSendButton");
const chatPanel = document.querySelector("#chatPanel");
let latestRun = null;
let latestChatDraft = null;
let chatMessages = [];

applyI18n();

scanButton.addEventListener("click", organizeNow);
organizeButton.addEventListener("click", () => runQuickChatCommand("organize again", msg("organizeAgain")));
undoButton.addEventListener("click", () => runQuickChatCommand("undo", msg("undo")));
restoreButton.addEventListener("click", () => runQuickChatCommand("restore closed", msg("restoreClosed")));
dashboardButton.addEventListener("click", () => runQuickChatCommand("open dashboard", msg("openDashboard")));
startButton.addEventListener("click", acceptPrivacyAndOrganize);
summaryButton.addEventListener("click", () => runQuickChatCommand("summarize this page", msg("summarizeCurrentTab")));
duplicatesList.addEventListener("click", handleDuplicateAction);
chatForm.addEventListener("submit", previewChatRefine);
chatPanel.addEventListener("click", handleChatPanelAction);
document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    chatInput.value = button.dataset.prompt || "";
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

async function openDashboard() {
  await chrome.tabs.create({
    url: chrome.runtime.getURL("dashboard.html")
  });
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
    activeWindowId: latestRun?.activeWindowId
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
    activeWindowId: latestRun?.activeWindowId,
    confirmedSensitiveTabId: confirmedSensitiveTabId || null,
    question: question || ""
  });
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
  await handleAgentCommand(commandText);
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

  appendUserChatMessage(text);

  if (await handleAgentCommand(text)) {
    chatInput.value = "";
    return;
  }

  const readOnlyAnswer = await buildReadOnlyAgentAnswer(text, latestRun);
  if (readOnlyAnswer) {
    latestChatDraft = null;
    chatInput.value = "";
    renderChatPanel({
      status: "info",
      answer: readOnlyAnswer
    });
    return;
  }

  const tabSearchResult = buildTabSearchResult(text, latestRun);
  if (tabSearchResult) {
    latestChatDraft = null;
    chatInput.value = "";
    renderChatPanel(tabSearchResult);
    return;
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
  } else {
    latestChatDraft = null;
    renderChatPanel({
      status: "error",
      answer: response?.error || msg("couldNotBuildSafeAction")
    });
  }
}

async function handleAgentCommand(text) {
  const command = parseAgentCommand(text);

  if (!command) {
    return false;
  }

  const pageQuestion = command === "summarize" ? extractPageQuestion(text) : "";
  const messages = {
    summarize: pageQuestion ? msg("agentCommandAskPage") : msg("agentCommandSummarize"),
    organize: msg("agentCommandOrganize"),
    undo: msg("agentCommandUndo"),
    restore: msg("agentCommandRestore"),
    dashboard: msg("agentCommandDashboard")
  };

  renderChatPanel({
    status: "applied",
    answer: messages[command] || msg("applied")
  });

  if (command === "summarize") {
    await summarizeCurrentTab(pageQuestion);
    return true;
  }

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

  return false;
}

function parseAgentCommand(text) {
  const normalized = normalizeAgentText(text);

  if (isSummaryCommand(normalized)) return "summarize";
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
    /总结|摘要|问页面|解释页面/.test(text) ||
    /(这个页面|当前页面|这页).*(讲了什么|是什么|总结|摘要|解释)/.test(text)
  );
}

function extractPageQuestion(text) {
  const value = String(text || "").trim();
  const patterns = [
    /^(?:ask|question)\s+(?:this\s+)?page(?:\s+about)?[:：]?\s+(.+)$/i,
    /^(?:ask|question)\s+(?:the\s+)?current\s+page(?:\s+about)?[:：]?\s+(.+)$/i,
    /^(?:on\s+this\s+page|from\s+this\s+page)[:,]?\s+(.+)$/i,
    /^(?:问|问一下|问问)(?:这个|当前)?页面[:：]?\s*(.+)$/,
    /^当前页面(?:里|中)?(?:.*?)(?:是什么|有哪些|怎么|如何|为什么|是否).*$/
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
    /^(总结|摘要|解释|这个页面讲了什么|当前页面讲了什么)$/.test(text);
}

function isDashboardCommand(text) {
  return /\bdashboard\b/.test(text) || /打开\s*dashboard|打开工作台|去工作台|看工作台/.test(text);
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
  const meta = [tab.hostname, tab.path, msg("windowLabel", [tab.windowId])]
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
    chatInput.value = "";
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

  statusPanel.className = `status-panel agent-message agent-message-system ${status}`;
  statusPanel.innerHTML = `
    <div class="status-dot" aria-hidden="true"></div>
    <div>
      <h2>${escapeHtml(titleByStatus[status] || titleByStatus.idle)}</h2>
      <p>${escapeHtml(bodyByStatus[status] || bodyByStatus.idle)}</p>
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
    <article class="agent-result-card">
      <div>
        <h2>${escapeHtml(msg("browserCleanedUp"))}</h2>
        <p>${escapeHtml(closedCount > 0 ? msg("memoryReliefCopy") : msg("noTabsWereClosed"))}</p>
      </div>
      <div class="agent-result-list">
        ${impact.map((metric) => renderImpactMetric(metric.label, metric.value)).join("")}
      </div>
    </article>
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
    msg("windowLabel", [tab.windowId]),
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
  renderChatPanel({
    status: "summary",
    summary
  });
}

function renderChatSummary(summary) {
  const title = summary?.title || msg("currentTab");
  const keyPoints = Array.isArray(summary?.keyPoints) ? summary.keyPoints : [];
  const showMeta = Boolean(summary?.suggestedGroup || summary?.suggestedAction);
  const question = summary?.question || "";

  return `
    <div class="chat-summary-card ${escapeHtml(summary?.status || "completed")}">
      <small>${escapeHtml(msg("currentPageAnswer"))}</small>
      <h2>${escapeHtml(title)}</h2>
      ${question ? `<p class="chat-summary-question"><b>${escapeHtml(msg("currentPageQuestion"))}:</b> ${escapeHtml(question)}</p>` : ""}
      <p>${escapeHtml(summary?.summary || "")}</p>
      ${keyPoints.length ? renderKeyPoints(keyPoints) : ""}
      ${showMeta ? renderSummaryMeta(summary) : ""}
    </div>
  `;
}

function renderKeyPoints(points) {
  if (!points.length) return "";

  return `
    <ol>
      ${points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
    </ol>
  `;
}

function renderSummaryMeta(summary) {
  return `
    <div class="summary-meta">
      <span>${escapeHtml(msg("groupLabel"))}: <b>${escapeHtml(summary.suggestedGroup || msg("misc"))}</b></span>
      <span>${escapeHtml(msg("actionLabel"))}: <b>${escapeHtml(summary.suggestedAction || msg("keep"))}</b></span>
    </div>
  `;
}

function renderChatPanel(draft) {
  appendChatMessage({
    role: "assistant",
    status: draft.status || "info",
    html: renderChatPanelContent(draft)
  });
}

function renderChatPanelContent(draft) {
  if (draft.status === "summary") {
    return renderChatSummary(draft.summary || {});
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

function appendUserChatMessage(text) {
  appendChatMessage({
    role: "user",
    status: "user",
    html: `<p class="chat-answer">${escapeHtml(text)}</p>`
  });
}

function appendChatMessage(message) {
  const previous = chatMessages[chatMessages.length - 1];

  if (message.status !== "loading" && previous?.role === "assistant" && previous.status === "loading") {
    chatMessages[chatMessages.length - 1] = message;
  } else {
    chatMessages.push(message);
  }

  if (chatMessages.length > CHAT_THREAD_LIMIT) {
    chatMessages = chatMessages.slice(-CHAT_THREAD_LIMIT);
  }

  renderChatThread();
}

function renderChatThread() {
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
  chatPanel.scrollTop = chatPanel.scrollHeight;
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
                <small>${escapeHtml([tab.hostname, tab.path, msg("windowLabel", [tab.windowId])].filter(Boolean).join(" · "))}</small>
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
  scanButton.disabled = isVisible;
  summaryButton.disabled = isVisible;
  chatInput.disabled = isVisible;
  chatSendButton.disabled = isVisible;
}

function setBusy(isBusy) {
  scanButton.disabled = isBusy;
  organizeButton.disabled = isBusy;
  undoButton.disabled = isBusy || undoButton.disabled;
  restoreButton.disabled = isBusy || restoreButton.disabled;
  dashboardButton.disabled = isBusy;
  startButton.disabled = isBusy;
  summaryButton.disabled = isBusy;
  chatInput.disabled = isBusy;
  chatSendButton.disabled = isBusy;
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
