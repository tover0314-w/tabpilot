const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const vm = require("vm");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const BACKGROUND_PATH = path.join(EXTENSION_DIR, "background.js");
const DIAGNOSTICS_PATH = path.join(EXTENSION_DIR, "diagnostics.js");
const MANIFEST_PATH = path.join(EXTENSION_DIR, "manifest.json");
const LOCALES_DIR = path.join(EXTENSION_DIR, "_locales");

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const backgroundCode = fs.readFileSync(BACKGROUND_PATH, "utf8");
const context = {
  console,
  URL,
  Date,
  Map,
  Set,
  Array,
  Number,
  String,
  Boolean,
  RegExp,
  Math,
  fetch,
  chrome: {
    action: { onClicked: { addListener() {} } },
    runtime: {
      onMessage: { addListener() {} },
      sendMessage() {}
    },
    storage: {
      local: {
        async get() {
          return {};
        },
        async set() {},
        async remove() {}
      }
    }
  }
};

vm.createContext(context);
vm.runInContext(backgroundCode, context, { filename: BACKGROUND_PATH });

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`${message}. Expected ${expectedJson}, got ${actualJson}`);
  }
}

function tab(overrides) {
  const parsed = context.parseUrl(overrides.url || "https://example.com/");
  return {
    id: overrides.id,
    windowId: overrides.windowId || 1,
    index: overrides.index || 0,
    title: overrides.title || "Untitled",
    restoreUrl: context.isRestorableUrl(overrides.url || "", parsed) ? overrides.url : "",
    lastAccessed: overrides.lastAccessed || 0,
    hostname: parsed.hostname,
    path: parsed.path,
    hasQuery: parsed.hasQuery,
    hasHash: parsed.hasHash,
    urlScheme: parsed.scheme,
    duplicateLabel: parsed.label,
    exactUrlHash: parsed.exactHash,
    trackingUrlHash: parsed.trackingHash,
    reviewUrlHash: parsed.reviewHash,
    active: Boolean(overrides.active),
    pinned: Boolean(overrides.pinned),
    audible: Boolean(overrides.audible),
    discarded: Boolean(overrides.discarded),
    incognito: Boolean(overrides.incognito),
    groupId: typeof overrides.groupId === "number" ? overrides.groupId : -1,
    groupTitle: overrides.groupTitle || "",
    groupColor: overrides.groupColor || "grey",
    status: "complete",
    protectedReasons: overrides.protectedReasons || []
  };
}

function snapshot(tabs, groups = []) {
  return {
    collectedAt: "2026-06-08T00:00:00.000Z",
    windows: [{ id: 1, focused: true, state: "normal", tabCount: tabs.length }],
    groups,
    tabs
  };
}

test("manifest keeps one-click action and narrow permissions", () => {
  assertEqual(manifest.manifest_version, 3, "Manifest version");
  assert(!manifest.action.default_popup, "Manifest action must not define default_popup");
  assertEqual(manifest.default_locale, "en", "Manifest default locale");
  assertEqual(manifest.name, "__MSG_extensionName__", "Manifest name should use Chrome i18n");
  assertEqual(manifest.description, "__MSG_extensionDescription__", "Manifest description should use Chrome i18n");
  assertEqual(manifest.action.default_title, "__MSG_actionTitle__", "Action title should use Chrome i18n");
  assert(manifest.permissions.includes("sidePanel"), "sidePanel permission is required");
  assert(manifest.permissions.includes("tabs"), "tabs permission is required");
  assert(manifest.permissions.includes("tabGroups"), "tabGroups permission is required");
  assert(manifest.icons?.["16"], "Manifest should include 16px icon");
  assert(manifest.icons?.["48"], "Manifest should include 48px icon");
  assert(manifest.icons?.["128"], "Manifest should include 128px icon");
  assert(manifest.action.default_icon?.["16"], "Action should include 16px icon");

  const forbiddenPermissions = ["<all_urls>", "history", "bookmarks", "cookies", "webRequest", "browsingData"];
  for (const permission of forbiddenPermissions) {
    assert(!manifest.permissions.includes(permission), `Forbidden permission present: ${permission}`);
  }

  assertDeepEqual(manifest.host_permissions, ["https://api.deepseek.com/*"], "Host permissions should stay narrow");

  const iconPaths = new Set([
    ...Object.values(manifest.icons || {}),
    ...Object.values(manifest.action.default_icon || {})
  ]);

  for (const iconPath of iconPaths) {
    assert(fs.existsSync(path.join(EXTENSION_DIR, iconPath)), `Missing icon file: ${iconPath}`);
  }
});

test("locales include matching English and Chinese message keys", () => {
  const enPath = path.join(LOCALES_DIR, "en", "messages.json");
  const zhPath = path.join(LOCALES_DIR, "zh_CN", "messages.json");
  assert(fs.existsSync(enPath), "Missing English locale messages");
  assert(fs.existsSync(zhPath), "Missing Chinese locale messages");

  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const zh = JSON.parse(fs.readFileSync(zhPath, "utf8"));
  const enKeys = Object.keys(en).sort();
  const zhKeys = Object.keys(zh).sort();

  assertDeepEqual(zhKeys, enKeys, "Locale message keys should match");

  for (const key of ["extensionName", "extensionDescription", "actionTitle"]) {
    assert(en[key]?.message, `English locale missing manifest key: ${key}`);
    assert(zh[key]?.message, `Chinese locale missing manifest key: ${key}`);
  }
});

test("UI i18n references resolve to locale messages", () => {
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const files = ["sidepanel.html", "dashboard.html", "sidepanel.js", "dashboard.js"];
  const keys = new Set();

  for (const file of files) {
    const content = fs.readFileSync(path.join(EXTENSION_DIR, file), "utf8");
    for (const match of content.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)) {
      keys.add(match[1]);
    }
    for (const match of content.matchAll(/\bmsg\("([^"]+)"/g)) {
      keys.add(match[1]);
    }
  }

  for (const key of keys) {
    assert(en[key]?.message, `Missing locale message referenced by UI: ${key}`);
  }
});

test("dashboard permission explanation matches manifest permissions", () => {
  const dashboardHtml = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.html"), "utf8");
  const explainedPermissions = ["tabs", "tabGroups", "sidePanel", "storage"];

  for (const permission of explainedPermissions) {
    assert(manifest.permissions.includes(permission), `Manifest missing permission explained by dashboard: ${permission}`);
    assert(dashboardHtml.includes(`<b>${permission}</b>`), `Dashboard missing permission explanation: ${permission}`);
  }

  assert(manifest.permissions.includes("scripting"), "Manifest missing scripting permission");
  assert(manifest.permissions.includes("activeTab"), "Manifest missing activeTab permission");
  assert(dashboardHtml.includes("<b>scripting + activeTab</b>"), "Dashboard missing scripting + activeTab explanation");

  for (const hostPermission of manifest.host_permissions || []) {
    assert(dashboardHtml.includes(`<b>${hostPermission}</b>`), `Dashboard missing host permission explanation: ${hostPermission}`);
  }
});

test("local error log entries redact URLs hosts and secrets", () => {
  const entry = context.buildErrorLogEntry(
    "SUMMARIZE_CURRENT_TAB",
    new Error("Failed https://private.example/secret?token=abc with Bearer secret-token and sk-secret999 for owner@private.example"),
    new Date("2026-06-09T01:00:00.000Z")
  );
  const serialized = JSON.stringify(entry);

  assertEqual(entry.operation, "SUMMARIZE_CURRENT_TAB", "Error log operation");
  assert(serialized.includes("[redacted-url]"), "Error log should redact URL");
  assert(serialized.includes("Bearer [redacted-token]"), "Error log should redact bearer token");
  assert(serialized.includes("[redacted-api-key]"), "Error log should redact API key");
  assert(serialized.includes("[redacted-email]"), "Error log should redact email");
  assert(!serialized.includes("https://private.example/secret"), "Error log must not include URL");
  assert(!serialized.includes("private.example"), "Error log must not include hostname");
  assert(!serialized.includes("sk-secret999"), "Error log must not include API key");
  assert(!serialized.includes("owner@private.example"), "Error log must not include email");
});

test("duplicate safety audit stores only counts and allowed types", () => {
  const event = context.sanitizeDuplicateSafetyEvent({
    action: "auto_safe_close",
    requestedTabs: 3,
    closedTabs: 2,
    skippedTabs: 1,
    duplicateTypes: {
      exact: 1,
      "https://private.example/secret": 1
    },
    url: "https://private.example/secret",
    title: "Private planning doc"
  });
  const serialized = JSON.stringify(event);

  assertEqual(event.action, "auto_safe_close", "Duplicate safety action");
  assertEqual(event.requestedTabs, 3, "Duplicate safety requested tabs");
  assertEqual(event.closedTabs, 2, "Duplicate safety closed tabs");
  assertEqual(event.duplicateTypes.exact, 1, "Duplicate safety exact count");
  assertEqual(event.duplicateTypes.unknown, 1, "Duplicate safety unknown count");
  assert(!serialized.includes("https://private.example/secret"), "Duplicate safety audit must not include URL");
  assert(!serialized.includes("private.example"), "Duplicate safety audit must not include hostname");
  assert(!serialized.includes("Private planning doc"), "Duplicate safety audit must not include title");
});

test("diagnostics and feedback template redact browsing content and secrets", async () => {
  const diagnostics = await import(pathToFileURL(DIAGNOSTICS_PATH).href);
  const snapshot = diagnostics.buildDiagnosticSnapshot({
    manifest: {
      version: "0.1.0",
      permissions: ["tabs", "storage"],
      host_permissions: ["https://api.deepseek.com/*"]
    },
    run: {
      status: "completed",
      source: "action",
      completedAt: "2026-06-09T00:00:00.000Z",
      summary: {
        tabCount: 3,
        groupsCreated: 1,
        safeDuplicatesClosed: 1,
        topHosts: [{ hostname: "private.example", count: 3 }],
        fullUrl: "https://private.example/secret",
        tabTitle: "Private planning doc"
      },
      groups: [{ name: "Secret Project", tabCount: 2 }],
      duplicateGroups: [{ label: "https://private.example/secret", tabCount: 2 }],
      snapshot: {
        tabs: [
          {
            title: "Private planning doc",
            hostname: "private.example",
            path: "/secret"
          }
        ]
      }
    },
    rules: [{ pattern: "private.example", targetGroupName: "Secret Project" }],
    aiSettings: {
      enabled: true,
      provider: "deepseek",
      model: "deepseek-v4-flash",
      apiKey: "sk-secret"
    },
    errorLog: [
      {
        at: "2026-06-09T00:30:00.000Z",
        operation: "SUMMARIZE_CURRENT_TAB",
        name: "Error",
        message: "Failed https://private.example/secret with sk-secret and owner@private.example"
      }
    ],
    duplicateSafetyAudit: [
      {
        at: "2026-06-09T00:35:00.000Z",
        action: "auto_safe_close",
        requestedTabs: 2,
        closedTabs: 2,
        duplicateTypes: {
          exact: 1,
          "https://private.example/secret": 1
        },
        url: "https://private.example/secret"
      },
      {
        at: "2026-06-09T00:40:00.000Z",
        action: "restore_closed_tabs",
        requestedTabs: 2,
        restoredTabs: 1,
        failedTabs: 1
      }
    ],
    uiLanguage: "en-US",
    now: new Date("2026-06-09T01:00:00.000Z")
  });
  const serialized = JSON.stringify(snapshot);

  assertEqual(snapshot.latestRun.groupCount, 1, "Diagnostic group count");
  assertEqual(snapshot.latestRun.duplicateGroupCount, 1, "Diagnostic duplicate group count");
  assertEqual(snapshot.localState.ruleCount, 1, "Diagnostic rule count");
  assertEqual(snapshot.localState.hasLocalApiKey, true, "Diagnostic API key presence flag");
  assertEqual(snapshot.localState.errorCount, 1, "Diagnostic error count");
  assertEqual(snapshot.localState.duplicateSafetyEventCount, 2, "Diagnostic duplicate safety event count");
  assertEqual(snapshot.recentErrors.length, 1, "Diagnostic recent errors");
  assertEqual(snapshot.duplicateSafety.totalAutoClosedTabs, 2, "Diagnostic duplicate safety closed count");
  assertEqual(snapshot.duplicateSafety.totalRestoreRequestedTabs, 2, "Diagnostic duplicate safety requested restore count");
  assertEqual(snapshot.duplicateSafety.totalRestoredTabs, 1, "Diagnostic duplicate safety restored count");
  assertEqual(snapshot.duplicateSafety.totalRestoreFailedTabs, 1, "Diagnostic duplicate safety restore failed count");
  assertEqual(snapshot.privacy.includesUrls, false, "Diagnostic URL privacy flag");
  assert(!serialized.includes("sk-secret"), "Diagnostic snapshot must not include API key");
  assert(!serialized.includes("Private planning doc"), "Diagnostic snapshot must not include tab title");
  assert(!serialized.includes("https://private.example/secret"), "Diagnostic snapshot must not include full URL");
  assert(!serialized.includes("private.example"), "Diagnostic snapshot must not include hostname or rule pattern");
  assert(!serialized.includes("Secret Project"), "Diagnostic snapshot must not include group or rule name");

  const feedback = diagnostics.buildFeedbackTemplate({
    diagnosticSnapshot: snapshot,
    uiLanguage: "en-US"
  });
  assert(feedback.includes("TabMosaic AI Beta Feedback"), "Feedback template heading");
  assert(
    feedback.includes("70% clearly right / 20% acceptable / 10% Review or Misc / 0 dangerous close mistakes"),
    "Feedback template should include beta quality target"
  );
  assert(feedback.includes("Total tabs tested"), "Feedback template should include manual tab count field");
  assert(feedback.includes("What rule should TabMosaic remember next time"), "Feedback template should collect memory rule feedback");
  assert(feedback.includes("Redacted diagnostic snapshot"), "Feedback template diagnostic section");
  assert(!feedback.includes("sk-secret"), "Feedback template must not include API key");
  assert(!feedback.includes("Private planning doc"), "Feedback template must not include tab title");
  assert(!feedback.includes("https://private.example/secret"), "Feedback template must not include full URL");
  assert(!feedback.includes("private.example"), "Feedback template must not include hostname or rule pattern");
  assert(!feedback.includes("Secret Project"), "Feedback template must not include group or rule name");

  const chineseFeedback = diagnostics.buildFeedbackTemplate({
    diagnosticSnapshot: snapshot,
    uiLanguage: "zh-CN"
  });
  assert(chineseFeedback.includes("TabMosaic AI Beta 反馈"), "Chinese feedback template heading");
  assert(
    chineseFeedback.includes("70% 明确正确 / 20% 可接受 / 10% Review 或 Misc / 0 个危险误关"),
    "Chinese feedback template should include beta quality target"
  );
  assert(chineseFeedback.includes("本次测试 tabs 总数"), "Chinese feedback template should include manual tab count field");
  assert(chineseFeedback.includes("希望它记住哪条规则"), "Chinese feedback template should collect memory rule feedback");
  assert(chineseFeedback.includes("脱敏诊断快照"), "Chinese feedback diagnostic section");
});

test("chat refine builds safe local action drafts", () => {
  const tabs = [
    tab({
      id: 1,
      title: "Feature PR",
      url: "https://github.com/acme/app/pull/42",
      active: true,
      protectedReasons: ["active"]
    }),
    tab({
      id: 2,
      title: "Linear task",
      url: "https://linear.app/acme/issue/ABC-1"
    }),
    tab({
      id: 3,
      title: "Google Doc",
      url: "https://docs.google.com/document/d/abc/edit"
    })
  ];
  const state = snapshot(tabs, [{ id: 10, windowId: 1, title: "Misc", color: "grey", collapsed: false }]);

  const githubDraft = context.buildChatRefineDraft("GitHub PR to Code Review", state);
  assertEqual(githubDraft.type, "create_rule_and_move", "GitHub PR draft type");
  assertEqual(githubDraft.rule.pattern, "github.com/*/*/pull/*", "GitHub PR rule pattern");
  assertEqual(githubDraft.groupName, "Code Review", "GitHub PR target group");
  assertEqual(githubDraft.matchedTabCount, 1, "GitHub PR matched tab count");
  assert(githubDraft.risk.includes("No tabs will be closed"), "GitHub PR draft should be non-closing");

  const domainDraft = context.buildChatRefineDraft("docs.google.com to Docs & Notes", state);
  assertEqual(domainDraft.type, "create_rule_and_move", "Domain draft type");
  assertEqual(domainDraft.rule.type, "domain", "Domain rule type");
  assertEqual(domainDraft.rule.pattern, "docs.google.com", "Domain rule pattern");
  assertEqual(domainDraft.groupName, "Docs & Notes", "Domain target group");

  const currentTabDraft = context.buildChatRefineDraft("current tab to Reading", state);
  assertEqual(currentTabDraft.type, "move_tabs", "Current tab draft type");
  assertDeepEqual(currentTabDraft.tabIds, [1], "Current tab draft tab ids");

  const chineseCurrentTabDraft = context.buildChatRefineDraft("把当前标签页放到阅读", state);
  assertEqual(chineseCurrentTabDraft.type, "move_tabs", "Chinese current tab draft type");
  assertEqual(chineseCurrentTabDraft.groupName, "阅读", "Chinese current tab target group");
  assertEqual(chineseCurrentTabDraft.groupColor, "yellow", "Chinese current tab group color");
  assertDeepEqual(chineseCurrentTabDraft.tabIds, [1], "Chinese current tab draft tab ids");
  assert(chineseCurrentTabDraft.answer.includes("当前标签页"), "Chinese current tab answer");
  assert(chineseCurrentTabDraft.risk.includes("不会关闭标签页"), "Chinese current tab risk");

  const chineseDomainDraft = context.buildChatRefineDraft("把 docs.google.com 放到文档笔记", state);
  assertEqual(chineseDomainDraft.type, "create_rule_and_move", "Chinese domain draft type");
  assertEqual(chineseDomainDraft.rule.pattern, "docs.google.com", "Chinese domain pattern");
  assertEqual(chineseDomainDraft.groupName, "文档笔记", "Chinese domain target group");
  assertEqual(chineseDomainDraft.groupColor, "green", "Chinese domain group color");
  assert(chineseDomainDraft.actionSummary.includes("创建规则"), "Chinese domain action summary");
  assert(chineseDomainDraft.risk.includes("规则只保存在本地"), "Chinese domain risk");

  const renameDraft = context.buildChatRefineDraft("rename Misc to Reading", state);
  assertEqual(renameDraft.type, "rename_group", "Rename draft type");
  assertDeepEqual(renameDraft.groupIds, [10], "Rename draft group ids");

  const chineseRenameDraft = context.buildChatRefineDraft("把 Misc 改名为阅读", state);
  assertEqual(chineseRenameDraft.type, "rename_group", "Chinese rename draft type");
  assertEqual(chineseRenameDraft.newName, "阅读", "Chinese rename target");
  assertDeepEqual(chineseRenameDraft.groupIds, [10], "Chinese rename draft group ids");
  assert(chineseRenameDraft.actionSummary.includes("重命名"), "Chinese rename action summary");
});

test("user rules beat AI and built-in classification", () => {
  const tabs = [
    tab({ id: 11, title: "PR", url: "https://github.com/acme/app/pull/7" }),
    tab({ id: 12, title: "Repo", url: "https://github.com/acme/app" })
  ];
  const rules = [
    context.buildUserRule({
      type: "url_pattern",
      pattern: "github.com/*/*/pull/*",
      targetGroupName: "Code Review",
      targetGroupColor: "red",
      createdFrom: "chat",
      reason: "Test"
    })
  ];
  const classified = context.classifyTabsWithUserRules(tabs, rules);
  const aiByTabId = new Map([
    [11, { name: "GitHub Projects", color: "grey", confidence: 0.9, reason: "AI" }]
  ]);
  const groups = context.buildGroupPlan(snapshot(tabs), aiByTabId, classified.byTabId);

  assertEqual(classified.byTabId.get(11).name, "Code Review", "User rule classification");
  assertEqual(classified.ruleHits.get(rules[0].id), 1, "User rule hit count");
  assert(groups.some((group) => group.name === "Code Review" && group.tabIds.includes(11)), "Group plan should use user rule");
});

test("duplicate policy closes only safe exact/tracking duplicates", () => {
  const tabs = [
    tab({
      id: 21,
      title: "Active duplicate",
      url: "https://example.com/a",
      active: true,
      lastAccessed: 100,
      protectedReasons: ["active"]
    }),
    tab({
      id: 22,
      title: "Safe exact duplicate",
      url: "https://example.com/a",
      lastAccessed: 10
    }),
    tab({
      id: 23,
      title: "Tracking original",
      url: "https://example.com/b",
      lastAccessed: 100
    }),
    tab({
      id: 24,
      title: "Tracking duplicate",
      url: "https://example.com/b?utm_source=newsletter",
      lastAccessed: 10
    }),
    tab({
      id: 25,
      title: "Hash one",
      url: "https://example.com/c#one"
    }),
    tab({
      id: 26,
      title: "Hash two",
      url: "https://example.com/c#two"
    }),
    tab({
      id: 27,
      title: "Pinned duplicate",
      url: "https://example.com/d",
      pinned: true,
      protectedReasons: ["pinned"]
    }),
    tab({
      id: 28,
      title: "Pinned pair",
      url: "https://example.com/d"
    })
  ];
  const duplicates = context.detectDuplicateGroups(tabs);
  const closePlan = context.buildSafeDuplicateClosePlan(duplicates, tabs);
  const closeIds = closePlan.closeTabs.map((item) => item.tabId).sort((a, b) => a - b);
  const reviewGroup = duplicates.find((group) => group.type === "same-page-review");

  assert(duplicates.some((group) => group.type === "exact" && group.action === "safe-close-candidate"), "Exact duplicate group");
  assert(duplicates.some((group) => group.type === "tracking" && group.action === "safe-close-candidate"), "Tracking duplicate group");
  assert(reviewGroup, "Hash/query different tabs should enter review");
  assertEqual(reviewGroup.action, "review", "Review duplicate action");
  assert(closeIds.includes(22), "Safe exact duplicate should close");
  assert(closeIds.includes(24), "Safe tracking duplicate should close");
  assert(!closeIds.includes(21), "Active tab must not close");
  assert(!closeIds.includes(27), "Pinned tab must not close");
  assert(!closeIds.includes(25) && !closeIds.includes(26), "Hash review tabs must not auto-close");
});

test("AI validation rejects invented ids and duplicate assignments", () => {
  const tabs = [tab({ id: 31, title: "Chrome docs", url: "https://developer.chrome.com/docs/extensions/" })];
  const state = snapshot(tabs);
  const output = {
    groups: [
      {
        name: "Chrome Extension Docs",
        color: "blue",
        confidence: 0.9,
        reason: "Valid",
        tabIds: [31, 999]
      },
      {
        name: "Duplicate",
        color: "red",
        confidence: 0.9,
        reason: "Duplicate",
        tabIds: [31]
      }
    ]
  };
  const byTabId = context.validateAIClassification(output, state);

  assertEqual(byTabId.size, 1, "AI validation should keep only one valid assignment");
  assertEqual(byTabId.get(31).name, "Chrome Extension Docs", "AI validation should keep first valid group");
});

test("AI connection test does not send tab data", async () => {
  const fetchCalls = [];
  context.fetch = async (url, options = {}) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      async json() {
        return {
          data: [
            {
              id: "deepseek-v4-flash",
              object: "model",
              owned_by: "deepseek"
            }
          ]
        };
      }
    };
  };

  const result = await context.testAIConnection({
    baseUrl: "https://api.deepseek.com/",
    model: "deepseek-v4-flash",
    apiKey: "sk-secret"
  });

  assertEqual(fetchCalls.length, 1, "AI connection fetch call count");
  assertEqual(fetchCalls[0].url, "https://api.deepseek.com/models", "AI connection should call models endpoint");
  assertEqual(fetchCalls[0].options.method, "GET", "AI connection should use GET");
  assert(!fetchCalls[0].options.body, "AI connection should not send request body");
  assertEqual(result.modelAvailable, true, "AI connection model availability");
  assertEqual(result.privacy.sentTabData, false, "AI connection must not send tab data");
  assertEqual(result.privacy.sentPageText, false, "AI connection must not send page text");
  assertEqual(result.privacy.sentFullUrls, false, "AI connection must not send full URLs");
});

test("clear local data removes sensitive local keys and resets run state", async () => {
  const removedKeys = [];
  const setValues = [];
  context.chrome.storage.local = {
    async get() {
      return {};
    },
    async set(value) {
      setValues.push(value);
    },
    async remove(keys) {
      removedKeys.push(...keys);
    }
  };
  context.chrome.runtime.sendMessage = async () => {};

  const run = await context.clearLocalData();
  const expectedKeys = [
    "tabmosaic.currentRun",
    "tabmosaic.lastUndo",
    "tabmosaic.lastClosedTabs",
    "tabmosaic.privacyAccepted",
    "tabmosaic.aiSettings",
    "tabmosaic.userRules",
    "tabmosaic.chatDraft",
    "tabmosaic.errorLog",
    "tabmosaic.duplicateSafetyAudit"
  ];

  assertDeepEqual(removedKeys.sort(), expectedKeys.sort(), "Clear local data keys");
  assertEqual(run.status, "idle", "Clear local data run status");
  assert(setValues.some((value) => value["tabmosaic.currentRun"]?.status === "idle"), "Idle run should be published");
});

runTests();

async function runTests() {
  let failures = 0;

  for (const item of tests) {
    try {
      await item.fn();
      console.log(`PASS ${item.name}`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${item.name}`);
      console.error(error.stack || error.message);
    }
  }

  if (failures > 0) {
    console.error(`${failures} smoke test(s) failed`);
    process.exit(1);
  }

  console.log(`${tests.length} smoke tests passed`);
}
