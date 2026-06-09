import { applyI18n, msg } from "./i18n.js";

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

applyI18n();

scanButton.addEventListener("click", organizeNow);
organizeButton.addEventListener("click", organizeNow);
undoButton.addEventListener("click", undoLast);
restoreButton.addEventListener("click", restoreClosed);
dashboardButton.addEventListener("click", openDashboard);
startButton.addEventListener("click", acceptPrivacyAndOrganize);
summaryButton.addEventListener("click", summarizeCurrentTab);
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

async function summarizeCurrentTab() {
  setBusy(true);
  renderSummary({
    status: "loading",
    title: msg("checkingSummaryPrivacy"),
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
      summary: msg("summaryCancelledCopy")
    });
    return;
  }

  renderSummary({
    status: "loading",
    title: msg("readingCurrentTab"),
    summary: msg("extractingVisibleText")
  });

  const response = await requestCurrentTabSummary(confirmedSensitiveTabId);
  setBusy(false);

  if (response?.ok && response.summary?.status === "needs-confirmation") {
    const retryConfirmedTabId = confirmSensitiveSummaryIfNeeded(response.summary);

    if (retryConfirmedTabId === false) {
      renderSummary({
        status: "unreadable",
        title: msg("summaryCancelledTitle"),
        summary: msg("summaryCancelledCopy")
      });
      return;
    }

    setBusy(true);
    renderSummary({
      status: "loading",
      title: msg("readingCurrentTab"),
      summary: msg("extractingVisibleText")
    });

    const retryResponse = await requestCurrentTabSummary(retryConfirmedTabId);
    setBusy(false);
    renderSummary(
      retryResponse?.ok
        ? retryResponse.summary
        : {
            status: "error",
            title: msg("couldNotSummarizeTitle"),
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
      summary: response?.error || msg("pageCouldNotBeRead")
    });
  }
}

function requestCurrentTabSummary(confirmedSensitiveTabId) {
  return chrome.runtime.sendMessage({
    type: "SUMMARIZE_CURRENT_TAB",
    activeWindowId: latestRun?.activeWindowId,
    confirmedSensitiveTabId: confirmedSensitiveTabId || null
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

async function handleChatPanelAction(event) {
  const button = event.target.closest("[data-chat-action]");
  if (!button || button.disabled) return;

  if (button.dataset.chatAction === "cancel") {
    latestChatDraft = null;
    chatPanel.hidden = true;
    chatPanel.innerHTML = "";
    return;
  }

  if (button.dataset.chatAction !== "apply" || !latestChatDraft?.id) return;

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

  statusPanel.className = `status-panel ${status}`;
  statusPanel.innerHTML = `
    <div class="status-dot" aria-hidden="true"></div>
    <div>
      <h2>${escapeHtml(titleByStatus[status] || titleByStatus.idle)}</h2>
      <p>${escapeHtml(bodyByStatus[status] || bodyByStatus.idle)}</p>
    </div>
  `;
}

function renderMetrics(summary) {
  const metrics = [
    { label: msg("windows"), value: summary?.windowCount ?? "—" },
    { label: msg("tabs"), value: summary?.tabCount ?? "—" },
    { label: msg("groups"), value: summary?.groupsCreated ?? "—" },
    { label: msg("closedDupes"), value: summary?.safeDuplicatesClosed ?? "—" },
    { label: msg("aiStatus"), value: formatAIStatus(summary?.aiClassificationStatus || "not-configured") },
    { label: msg("aiGroups"), value: summary?.aiGroupsSuggested ?? "—" }
  ];

  metricsGrid.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric-card">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(String(metric.value))}</strong>
        </article>
      `
    )
    .join("");
}

function formatAIStatus(status) {
  if (status === "applied") return msg("deepSeekApplied");
  if (status === "not-configured") return msg("localRules");
  if (status === "empty") return msg("aiNoUsableGroups");
  if (status === "no-tabs") return msg("aiNoEligibleTabs");
  if (String(status).startsWith("fallback:")) return msg("fallbackToLocal");
  return status;
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
  summaryPanel.hidden = false;

  if (summary.status === "loading" || summary.status === "error" || summary.status === "unreadable") {
    summaryPanel.innerHTML = `
      <h2>${escapeHtml(summary.title || msg("currentTab"))}</h2>
      <p>${escapeHtml(summary.summary || "")}</p>
      ${summary.keyPoints ? renderKeyPoints(summary.keyPoints) : ""}
      ${summary.suggestedGroup ? renderSummaryMeta(summary) : ""}
    `;
    return;
  }

  summaryPanel.innerHTML = `
    <h2>${escapeHtml(summary.title || msg("currentTab"))}</h2>
    <p>${escapeHtml(summary.summary || "")}</p>
    ${renderKeyPoints(summary.keyPoints || [])}
    ${renderSummaryMeta(summary)}
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
  chatPanel.hidden = false;

  if (draft.status === "loading" || draft.status === "error" || draft.status === "applied") {
    chatPanel.innerHTML = `
      <p class="chat-answer">${escapeHtml(draft.answer || "")}</p>
    `;
    return;
  }

  const tabs = Array.isArray(draft.matchedTabs) ? draft.matchedTabs : [];

  chatPanel.innerHTML = `
    <p class="chat-answer">${escapeHtml(draft.answer || "")}</p>
    <div class="chat-action-summary">
      <span>${escapeHtml(draft.actionSummary || msg("previewAction"))}</span>
      <small>${escapeHtml(draft.risk || msg("noTabsWillBeClosed"))}</small>
    </div>
    ${renderChatMatchedTabs(tabs, draft.matchedTabCount)}
    <div class="chat-action-row">
      <button class="primary-button" type="button" data-chat-action="apply">${escapeHtml(msg("apply"))}</button>
      <button class="secondary-button" type="button" data-chat-action="cancel">${escapeHtml(msg("cancel"))}</button>
    </div>
  `;
}

function renderChatMatchedTabs(tabs, totalCount) {
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
