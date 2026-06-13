const SAFE_SUMMARY_KEYS = [
  "windowCount",
  "tabCount",
  "groupsCreated",
  "tabsMoved",
  "safeDuplicatesClosed",
  "reviewDuplicateGroups",
  "reviewDuplicatesClosed",
  "reviewDuplicateGroupsKept",
  "protectedTabs",
  "skippedGroups",
  "undoAvailable",
  "closedTabsRestoreAvailable",
  "aiClassificationStatus",
  "aiClassificationProvider"
];

export function buildDiagnosticSnapshot({
  manifest,
  run,
  rules,
  aiSettings,
  errorLog,
  duplicateSafetyAudit,
  savedWorkspaces,
  uiLanguage,
  now = new Date()
}) {
  const safeErrorLog = sanitizeErrorLog(errorLog);
  const safeDuplicateSafetyAudit = summarizeDuplicateSafetyAudit(duplicateSafetyAudit);

  return {
    product: "TabMosaic AI",
    generatedAt: now instanceof Date ? now.toISOString() : new Date(now).toISOString(),
    extension: {
      version: manifest?.version || "unknown",
      locale: uiLanguage || "unknown",
      permissions: [...(manifest?.permissions || [])].sort(),
      hostPermissions: [...(manifest?.host_permissions || [])].sort()
    },
    latestRun: sanitizeRun(run),
    localState: {
      ruleCount: Array.isArray(rules) ? rules.length : 0,
      aiEnabled: Boolean(aiSettings?.enabled),
      aiProvider: aiSettings?.provider || "deepseek",
      aiModel: aiSettings?.model || "",
      hasLocalApiKey: Boolean(aiSettings?.apiKey),
      savedWorkspaceCount: Array.isArray(savedWorkspaces) ? savedWorkspaces.length : 0,
      errorCount: Array.isArray(errorLog) ? errorLog.length : 0,
      duplicateSafetyEventCount: Array.isArray(duplicateSafetyAudit) ? duplicateSafetyAudit.length : 0
    },
    recentErrors: safeErrorLog,
    duplicateSafety: safeDuplicateSafetyAudit,
    privacy: {
      includesUrls: false,
      includesTabTitles: false,
      includesPageText: false,
      includesHostnames: false,
      includesRulePatterns: false,
      includesGroupNames: false,
      includesApiKey: false,
      uploadedAutomatically: false
    }
  };
}

export function buildFeedbackTemplate({ diagnosticSnapshot, uiLanguage }) {
  const diagnosticsText = JSON.stringify(diagnosticSnapshot || {}, null, 2);

  return [
    "# TabMosaic AI Beta Feedback",
    "",
    "## What happened?",
    "",
    "Describe the issue or experience:",
    "",
    "## What did you expect?",
    "",
    "Describe what you wanted TabMosaic to do:",
    "",
    "## Steps to reproduce",
    "",
    "1. ",
    "2. ",
    "3. ",
    "",
    "## Organize quality",
    "",
    "Target: 70% clearly right / 20% acceptable / 10% Review or Misc / 0 dangerous close mistakes.",
    "",
    "- Total tabs tested:",
    "- Clearly right tabs / groups:",
    "- Acceptable but needs adjustment:",
    "- Review or Misc tabs:",
    "- Clearly wrong tabs / groups:",
    "- Were any tabs closed incorrectly? No / Yes, explain:",
    "- Did Undo / Restore work? Yes / No, explain:",
    "- What rule should TabMosaic remember next time?",
    "",
    "## Redacted diagnostic snapshot",
    "",
    "```json",
    diagnosticsText,
    "```",
    ""
  ].join("\n");
}

function sanitizeRun(run) {
  if (!run) {
    return {
      status: "none"
    };
  }

  return {
    status: run.status || "unknown",
    source: run.source || "unknown",
    completedAt: run.completedAt || "",
    summary: sanitizeSummary(run.summary || {}),
    groupCount: Array.isArray(run.groups) ? run.groups.length : 0,
    duplicateGroupCount: Array.isArray(run.duplicateGroups) ? run.duplicateGroups.length : 0
  };
}

function sanitizeSummary(summary) {
  const result = {};

  for (const key of SAFE_SUMMARY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(summary, key)) {
      result[key] = summary[key];
    }
  }

  return result;
}

function sanitizeErrorLog(errorLog) {
  if (!Array.isArray(errorLog)) return [];

  return errorLog.slice(0, 5).map((entry) => ({
    at: sanitizeShortText(entry?.at, 40),
    operation: sanitizeErrorField(entry?.operation, 64),
    name: sanitizeErrorField(entry?.name, 40),
    message: sanitizeDiagnosticText(entry?.message || entry?.error || "", 180)
  }));
}

function summarizeDuplicateSafetyAudit(events) {
  const safeEvents = sanitizeDuplicateSafetyAudit(events);

  return {
    eventCount: Array.isArray(events) ? events.length : 0,
    totalAutoClosedTabs: sumByAction(safeEvents, "auto_safe_close", "closedTabs"),
    totalManualReviewClosedTabs: sumByAction(safeEvents, "manual_review_close", "closedTabs"),
    totalRestoreRequestedTabs: sumByAction(safeEvents, "restore_closed_tabs", "requestedTabs"),
    totalRestoredTabs: sumByAction(safeEvents, "restore_closed_tabs", "restoredTabs"),
    totalRestoreFailedTabs: sumByAction(safeEvents, "restore_closed_tabs", "failedTabs"),
    recentEvents: safeEvents.slice(0, 5)
  };
}

function sanitizeDuplicateSafetyAudit(events) {
  if (!Array.isArray(events)) return [];

  return events.map((event) => {
    const action = sanitizeAllowedValue(event?.action, ["auto_safe_close", "manual_review_close", "restore_closed_tabs"]);

    return {
      at: sanitizeShortText(event?.at, 40),
      action,
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
  });
}

function sanitizeAllowedValue(value, allowedValues) {
  const text = String(value || "");
  return allowedValues.includes(text) ? text : "unknown";
}

function sanitizeDuplicateTypeCounts(value) {
  const allowedTypes = new Set(["exact", "tracking", "same-page-review", "unknown"]);
  const result = {};

  for (const [rawKey, rawCount] of Object.entries(value || {})) {
    const key = allowedTypes.has(rawKey) ? rawKey : "unknown";
    result[key] = nonNegativeInt(result[key]) + nonNegativeInt(rawCount);
  }

  return result;
}

function sumByAction(events, action, field) {
  return events
    .filter((event) => event.action === action)
    .reduce((sum, event) => sum + nonNegativeInt(event[field]), 0);
}

function nonNegativeInt(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function sanitizeErrorField(value, maxLength) {
  return String(value || "unknown")
    .replace(/[^a-z0-9:_-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLength) || "unknown";
}

function sanitizeShortText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeDiagnosticText(value, maxLength) {
  return String(value || "Unknown error")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted-token]")
    .replace(/\bsk-[A-Za-z0-9_-]{6,}\b/g, "[redacted-api-key]")
    .replace(/\b(?:https?|file|chrome|chrome-extension|edge|brave):\/\/[^\s"'<>]+/gi, "[redacted-url]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s"'<>]*)?/gi, "[redacted-host]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength) || "Unknown error";
}
