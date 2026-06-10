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
  AbortController,
  DOMException,
  setTimeout,
  clearTimeout,
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
    favIconUrl: overrides.favIconUrl || "",
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

function largeSyntheticSnapshot(tabCount = 180) {
  const fixtures = [
    {
      title: (index) => `GitHub PR ${index}`,
      url: (index) => `https://github.com/acme/tabmosaic/pull/${1000 + index}`
    },
    {
      title: (index) => `Chrome extension docs ${index}`,
      url: (index) => `https://developer.chrome.com/docs/extensions/develop/concepts/${index}`
    },
    {
      title: (index) => `Product spec ${index}`,
      url: (index) => `https://docs.google.com/document/d/mock-${index}/edit`
    },
    {
      title: (index) => `Linear issue ${index}`,
      url: (index) => `https://linear.app/acme/issue/TAB-${index}/mvp-polish`
    },
    {
      title: (index) => `Slack thread ${index}`,
      url: (index) => `https://acme.slack.com/archives/C123/p${String(index).padStart(8, "0")}`
    },
    {
      title: (index) => `Tutorial video ${index}`,
      url: (index) => `https://www.youtube.com/watch?v=tabmosaic${index}tutorial`
    },
    {
      title: (index) => `Analytics report ${index}`,
      url: (index) => `https://analytics.google.com/analytics/web/#/p${index}/reports`
    },
    {
      title: (index) => `Article ${index}`,
      url: (index) => `https://example.com/blog/tab-workflow-${index}`
    },
    {
      title: (index) => `Exact duplicate ${Math.floor(Math.floor(index / fixtures.length) / 2)}`,
      url: (index) => `https://example.com/exact-duplicate-${Math.floor(Math.floor(index / fixtures.length) / 2)}`
    },
    {
      title: (index) => `Tracking duplicate ${Math.floor(Math.floor(index / fixtures.length) / 2)}`,
      url: (index) =>
        `https://example.com/tracking-duplicate-${Math.floor(Math.floor(index / fixtures.length) / 2)}?utm_source=newsletter&utm_campaign=${index}`
    },
    {
      title: (index) => `Review duplicate ${Math.floor(Math.floor(index / fixtures.length) / 2)}`,
      url: (index) =>
        `https://example.com/review-duplicate-${Math.floor(Math.floor(index / fixtures.length) / 2)}#section-${Math.floor(index / fixtures.length) % 2}`
    },
    {
      title: (index) => `Misc workspace ${index}`,
      url: (index) => `https://workspace-${index}.example.net/app`
    }
  ];
  const tabs = [];

  for (let index = 0; index < tabCount; index += 1) {
    const fixture = fixtures[index % fixtures.length];
    const windowId = index < tabCount / 2 ? 1 : 2;
    const syntheticTab = tab({
      id: 5000 + index,
      windowId,
      index: index % Math.ceil(tabCount / 2),
      title: fixture.title(index),
      url: fixture.url(index),
      active: index === 0,
      pinned: index === 1,
      audible: index === 2,
      lastAccessed: 1700000000000 + index
    });

    if (syntheticTab.active) syntheticTab.protectedReasons.push("active");
    if (syntheticTab.pinned) syntheticTab.protectedReasons.push("pinned");
    if (syntheticTab.audible) syntheticTab.protectedReasons.push("audible");

    tabs.push(syntheticTab);
  }

  tabs[0].pageText = "Private visible page text must never enter stored run snapshots.";
  tabs[0].fullUrl = "https://secret.example.com/private?token=should-not-persist";

  return {
    collectedAt: "2026-06-08T00:00:00.000Z",
    windows: [
      { id: 1, focused: true, state: "normal", tabCount: Math.ceil(tabCount / 2) },
      { id: 2, focused: false, state: "normal", tabCount: Math.floor(tabCount / 2) }
    ],
    groups: [],
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

test("sidepanel opens as a chat-first Tab Agent UI", () => {
  const sidepanelHtml = fs.readFileSync(path.join(EXTENSION_DIR, "sidepanel.html"), "utf8");
  const sidepanelJs = fs.readFileSync(path.join(EXTENSION_DIR, "sidepanel.js"), "utf8");
  const css = fs.readFileSync(path.join(EXTENSION_DIR, "styles.css"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));

  assert(sidepanelHtml.includes("tab-agent-shell"), "Sidepanel should use the Tab Agent layout shell");
  assert(sidepanelHtml.includes("agent-thread"), "Sidepanel should render a conversation thread");
  assert(sidepanelHtml.includes("agent-composer"), "Sidepanel should use a bottom chat composer");
  assert(sidepanelHtml.includes("agent-action-message"), "Quick actions should appear as an agent message card");
  assert(sidepanelHtml.includes('data-i18n="tabAgentTitle"'), "Sidepanel should title the surface as a Tab Agent");
  assert(sidepanelHtml.includes('data-i18n="ask"'), "Chat action should read like a conversation, not a settings preview");
  assert(sidepanelHtml.indexOf("agent-thread") < sidepanelHtml.indexOf("chatForm"), "Conversation should sit before the composer");
  assert(sidepanelHtml.indexOf("agent-quick-actions") < sidepanelHtml.indexOf("chatForm"), "Quick actions should stay inside the message flow");
  assert(!sidepanelHtml.includes('data-i18n="browserResult"'), "Sidepanel should not expose a dashboard-like Browser Result section");
  assert(sidepanelHtml.includes('<details class="glass-details sidepanel-details" hidden>'), "Technical browser lists should be hidden from the default chat surface");
  assert(!sidepanelHtml.includes("next-card"), "Sidepanel should not expose internal next-build QA copy");
  assert(sidepanelJs.includes("function renderImpactMetric"), "Sidepanel should render a compact impact summary");
  assert(sidepanelJs.includes("agent-result-card"), "Organize output should appear as an agent message");
  assert(sidepanelJs.includes("function parseAgentCommand"), "Sidepanel chat should route direct agent commands");
  assert(sidepanelJs.includes("let chatMessages = []"), "Sidepanel should keep an ephemeral chat message thread");
  assert(sidepanelJs.includes("appendUserChatMessage(text)"), "Sidepanel should render user messages in the chat thread");
  assert(sidepanelJs.includes("function runQuickChatCommand"), "Sidepanel quick actions should enter the chat thread");
  assert(sidepanelJs.includes('runQuickChatCommand("summarize this page"'), "Ask page quick action should route through chat command handling");
  assert(sidepanelJs.includes('runQuickChatCommand("restore closed"'), "Restore quick action should route through chat command handling");
  assert(sidepanelJs.includes("function renderChatThread"), "Sidepanel should render a multi-message chat thread");
  assert(sidepanelJs.includes("disableStaleChatDraftButtons"), "Sidepanel should disable stale draft Apply/Cancel buttons");
  assert(sidepanelJs.indexOf("handleAgentCommand(text)") < sidepanelJs.indexOf('type: "PREVIEW_CHAT_REFINE"'), "Direct agent commands should run before chat-refine preview");
  assert(sidepanelJs.includes("function buildReadOnlyAgentAnswer"), "Sidepanel chat should answer read-only result questions");
  assert(sidepanelJs.indexOf("buildReadOnlyAgentAnswer(text, latestRun)") < sidepanelJs.indexOf('type: "PREVIEW_CHAT_REFINE"'), "Read-only agent answers should run before chat-refine preview");
  assert(sidepanelJs.includes("isCapabilityQuestion(normalized)"), "Sidepanel should answer capability/help questions before requiring an organize run");
  assert(sidepanelJs.includes("isNextStepQuestion(normalized)"), "Sidepanel should answer next-step questions from latest run state");
  assert(sidepanelJs.includes("function buildNextStepAnswer"), "Sidepanel agent should build local next-step recommendations");
  assert(sidepanelJs.includes("buildGroupsAnswer"), "Sidepanel agent should answer group questions from latest run state");
  assert(sidepanelJs.includes("buildDuplicateAnswer"), "Sidepanel agent should answer duplicate questions from latest run state");
  assert(sidepanelJs.includes("buildDuplicateReviewAnswer"), "Sidepanel agent should answer duplicate review questions from latest run state");
  assert(sidepanelJs.includes("buildClosedTabsAnswer"), "Sidepanel agent should answer closed-duplicate questions from local restore state");
  assert(sidepanelJs.includes("buildAIStatusAnswer"), "Sidepanel agent should answer AI status questions from latest run state");
  assert(sidepanelJs.includes("buildActiveTabsAnswer"), "Sidepanel agent should answer active-tab questions from latest run state");
  assert(sidepanelJs.includes("buildProtectedTabsAnswer"), "Sidepanel agent should answer protected-tab questions from latest run state");
  assert(sidepanelJs.includes("buildReadLaterAnswer"), "Sidepanel agent should suggest read-later candidates from latest local tab metadata");
  assert(sidepanelJs.includes("function buildTabSearchResult"), "Sidepanel chat should search latest local tab snapshot");
  assert(sidepanelJs.indexOf("buildReadOnlyAgentAnswer(text, latestRun)") < sidepanelJs.indexOf("buildTabSearchResult(text, latestRun)"), "Run-state answers should win over broad tab search phrases");
  assert(sidepanelJs.includes("isActiveTabQuestion(normalized)"), "Active-tab questions should be recognized as read-only run-state questions");
  assert(sidepanelJs.includes("getSnapshotTabs(run)"), "Read-only tab answers should use the latest sanitized run snapshot");
  assert(sidepanelJs.includes("LAST_CLOSED_TABS_KEY"), "Closed-duplicate answers should use the existing local restore snapshot");
  assert(sidepanelJs.includes("getHostnameFromUrl(tab.url)"), "Closed-duplicate chat answers should avoid rendering full restore URLs");
  assert(sidepanelJs.includes('data-chat-action="focus-tab"'), "Sidepanel tab search results should expose safe focus actions");
  assert(sidepanelJs.includes('type: "FOCUS_DASHBOARD_TAB"'), "Sidepanel tab search should reuse the existing tab focus action");
  assert(sidepanelJs.includes("await summarizeCurrentTab(pageQuestion)"), "Chat command should support current-page summary and page questions");
  assert(sidepanelJs.includes("extractPageQuestion(text)"), "Chat command should extract current-page questions");
  assert(sidepanelJs.includes("function renderChatSummary"), "Current-page summary should render as a chat message");
  assert(sidepanelJs.includes('status: "summary"'), "Summary rendering should use the chat panel summary state");
  assert(sidepanelJs.includes("summaryPanel.hidden = true"), "Legacy summary panel should stay hidden when summary is mirrored into chat");
  assert(sidepanelJs.includes("await organizeNow()"), "Chat command should support organize again");
  assert(sidepanelJs.includes("await undoLast()"), "Chat command should support Undo");
  assert(sidepanelJs.includes("await restoreClosed()"), "Chat command should support Restore Closed");
  assert(sidepanelJs.includes("await openDashboard()"), "Chat command should support opening Dashboard");
  assert(sidepanelJs.includes("await saveCurrentWorkspace()"), "Chat command should support local workspace save");
  assert(sidepanelJs.includes("isSaveWorkspaceCommand(normalized)"), "Save workspace commands should be recognized before chat refine");
  assert(sidepanelJs.includes('type: "SAVE_CURRENT_WORKSPACE"'), "Sidepanel save workspace should use the background action");
  assert(css.includes(".agent-action-message"), "Quick action message card should have scoped styling");
  assert(css.includes(".chat-thread-message.user"), "User chat messages should have scoped styling");
  assert(css.includes(".chat-thread-message.assistant"), "Assistant chat messages should have scoped styling");
  assert(css.includes(".chat-summary-card"), "Current-page summary chat message should have scoped styling");
  assert(css.includes(".chat-summary-question"), "Current-page question should have scoped chat styling");
  assert(css.includes("backdrop-filter: blur"), "Minimal UI should use glass blur styling");
  assert(en.tabAgentTitle?.message && zh.tabAgentTitle?.message, "Tab Agent title should be localized");
  assert(en.agentCommandSummarize?.message && zh.agentCommandSummarize?.message, "Agent command response copy should be localized");
  assert(en.agentCommandAskPage?.message && zh.agentCommandAskPage?.message, "Ask-page command response copy should be localized");
  assert(en.currentPageAnswer?.message && zh.currentPageAnswer?.message, "Current-page chat summary label should be localized");
  assert(en.currentPageQuestion?.message && zh.currentPageQuestion?.message, "Current-page question label should be localized");
  assert(en.agentCapabilitiesAnswer?.message && zh.agentCapabilitiesAnswer?.message, "Agent capability answer should be localized");
  assert(en.agentNextStepReview?.message && zh.agentNextStepReview?.message, "Agent next-step answer should be localized");
  assert(en.agentOverviewAnswer?.message && zh.agentOverviewAnswer?.message, "Read-only agent answer copy should be localized");
  assert(en.agentReviewDuplicatesAnswer?.message && zh.agentReviewDuplicatesAnswer?.message, "Duplicate review answer copy should be localized");
  assert(en.agentClosedTabsAnswer?.message && zh.agentClosedTabsAnswer?.message, "Closed duplicate answer copy should be localized");
  assert(en.agentActiveTabsAnswer?.message && zh.agentActiveTabsAnswer?.message, "Active-tab answer copy should be localized");
  assert(en.agentProtectedTabsAnswer?.message && zh.agentProtectedTabsAnswer?.message, "Protected-tab answer copy should be localized");
  assert(en.agentReadLaterAnswer?.message && zh.agentReadLaterAnswer?.message, "Read-later answer copy should be localized");
  assert(en.agentFindTabsAnswer?.message && zh.agentFindTabsAnswer?.message, "Tab search answer copy should be localized");
  assert(en.agentCommandSaveWorkspace?.message && zh.agentCommandSaveWorkspace?.message, "Save workspace command copy should be localized");
  assert(en.agentWorkspaceSaved?.message && zh.agentWorkspaceSaved?.message, "Saved workspace result copy should be localized");
  assert(en.moreBrowserDetails?.message && zh.moreBrowserDetails?.message, "Folded detail summary should be localized");
});

test("dashboard follows minimal glass workbench structure", () => {
  const dashboardHtml = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.html"), "utf8");
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const dashboardCss = fs.readFileSync(path.join(EXTENSION_DIR, "styles.css"), "utf8");

  for (const selector of [
    "dashboard-topbar",
    "dashboard-workbench",
    "dashboard-rail",
    "dashboard-nav-segment",
    "dashboard-filter-chips",
    "dashboard-group-grid",
    "dashboard-details-section"
  ]) {
    assert(dashboardHtml.includes(selector), `Dashboard missing prototype shell class: ${selector}`);
    assert(dashboardCss.includes(`.${selector}`), `Dashboard missing CSS for prototype class: ${selector}`);
  }

  assert(dashboardCss.includes("backdrop-filter: blur"), "Dashboard should use glass blur styling");
  assert(dashboardJs.includes("function renderGroupCard"), "Dashboard should render workbench group cards");
  assert(dashboardJs.includes("function renderGroupTabs"), "Dashboard should render expanded group tab rows");
  assert(dashboardJs.includes("getTabsForGroup"), "Dashboard should connect group cards to local tab rows");
  assert(dashboardJs.includes('details class="dashboard-more-tabs"'), "Dashboard should let users expand hidden tab rows");
  assert(dashboardJs.includes("hiddenTabs.map((tab) => renderGroupTabRow"), "Expanded Dashboard rows should reuse normal tab row actions");
  assert(dashboardJs.includes("function renderTabFavicon"), "Dashboard should render real tab favicons when available");
  assert(dashboardJs.includes("favIconUrl"), "Dashboard tab rows should read favIconUrl from the local snapshot");
  assert(dashboardHtml.includes("saveWorkspaceButton"), "Dashboard should expose a compact save workspace action");
  assert(dashboardHtml.includes("saved-workspaces"), "Dashboard should keep saved workspaces folded");
  assert(dashboardJs.includes("function renderSavedWorkspaces"), "Dashboard should render saved local workspace snapshots");
  assert(dashboardCss.includes(".dashboard-favicon img"), "Dashboard should style favicon image assets");
  assert(dashboardCss.includes(".dashboard-workspace-row"), "Dashboard should style saved workspace rows");
  assert(dashboardCss.includes(".dashboard-more-tabs"), "Dashboard expandable tab rows should have scoped styling");
  assert(dashboardJs.includes("type: \"ORGANIZE_NOW\""), "Dashboard primary CTA should use existing organize action");
  assert(dashboardJs.includes("SAVE_CURRENT_WORKSPACE"), "Dashboard save should use the background workspace action");
  assert(!dashboardHtml.includes("dashboard-sidebar"), "Dashboard should not use the old basic sidebar layout");
  assert(!dashboardHtml.includes("editable-group-card"), "Dashboard should not use the old settings-card group UI");
  assert(!dashboardHtml.includes("dashboard-sort-label"), "Dashboard should avoid nonessential sort/status clutter");
});

test("dashboard removes latest-result and workspace clutter from the default page", () => {
  const dashboardHtml = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.html"), "utf8");
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");

  assert(!dashboardHtml.includes("workspaceTitle"), "Dashboard should not reserve space for a Latest result title");
  assert(!dashboardHtml.includes("workspaceSubtitle"), "Dashboard should not reserve space for latest-result subtitle copy");
  assert(!dashboardHtml.includes("dashboardMetrics"), "Dashboard should not render a Latest result metrics area");
  assert(!dashboardHtml.includes('data-i18n="latestOrganizeResult"'), "Dashboard should not show Latest result in the default UI");
  assert(!dashboardHtml.includes('data-i18n="currentWorkspace"'), "Dashboard should not show a Current Workspace card");
  assert(!dashboardHtml.includes("dashboard-workspace-card"), "Dashboard should remove the workspace card from the default UI");
  assert(!dashboardJs.includes("latestResultWithDate"), "Dashboard should not format latest-result timestamps");
  assert(!dashboardJs.includes("renderResultSummary"), "Dashboard should not keep the old latest-result renderer");
  assert(!dashboardJs.includes("dashboardMetrics"), "Dashboard JS should not write a metrics wall");
});

test("dashboard saves local workspace snapshots without full URLs or page text", () => {
  const dashboardHtml = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.html"), "utf8");
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));
  const run = {
    status: "completed",
    summary: {
      tabCount: 1,
      windowCount: 1,
      safeDuplicatesClosed: 0,
      reviewDuplicateGroups: 0,
      aiClassificationStatus: "not-configured"
    },
    groups: [
      {
        id: 7,
        windowId: 1,
        name: "Research",
        color: "blue",
        tabCount: 1,
        reason: "Current Chrome group",
        tabIds: [21]
      }
    ],
    snapshot: {
      tabs: [
        {
          id: 21,
          windowId: 1,
          index: 0,
          title: "Private planning doc",
          hostname: "private.example",
          path: "/secret",
          groupId: 7,
          restoreUrl: "https://private.example/secret?token=abc#fragment",
          url: "https://private.example/secret?token=abc#fragment",
          fullUrl: "https://private.example/secret?token=abc#fragment",
          pageText: "Confidential page body",
          favIconUrl: "https://private.example/favicon.ico?token=abc#fragment",
          exactUrlHash: "exact-secret",
          trackingUrlHash: "tracking-secret",
          reviewUrlHash: "review-secret"
        }
      ]
    }
  };
  const workspace = context.buildSavedWorkspace(run, {
    source: "test",
    now: new Date("2026-06-10T00:00:00.000Z")
  });
  const serialized = JSON.stringify(workspace);

  assert(context.isWorkspaceSaveableRun(run), "Completed run should be saveable");
  assertEqual(workspace.summary.tabCount, 1, "Saved workspace tab count");
  assertEqual(workspace.summary.groupCount, 1, "Saved workspace group count");
  assertEqual(workspace.groups[0].tabIds[0], 21, "Saved workspace keeps local tab id mapping");
  assertEqual(workspace.tabs[0].hostname, "private.example", "Saved workspace can keep local hostname metadata");
  assert(!serialized.includes("https://private.example/secret"), "Saved workspace must not include full URL");
  assert(!serialized.includes("token=abc"), "Saved workspace must not include query token");
  assert(!serialized.includes("Confidential page body"), "Saved workspace must not include page text");
  assert(!serialized.includes("favicon.ico"), "Saved workspace must not include favicon URL");
  assert(!serialized.includes("exact-secret"), "Saved workspace must not include URL hash identifiers");
  assert(dashboardHtml.includes("data-i18n=\"savedWorkspaces\""), "Saved workspaces section should be localized");
  assert(dashboardJs.includes("SAVED_WORKSPACES_KEY"), "Dashboard should load saved workspaces from local storage");
  assert(dashboardJs.includes("DELETE_SAVED_WORKSPACE"), "Dashboard should support deleting a local workspace snapshot");
  assert(dashboardJs.includes("deleteWorkspaceConfirm"), "Dashboard should confirm before deleting a local workspace snapshot");
  assert(dashboardJs.includes('data-workspace-action="delete"'), "Saved workspace rows should expose a delete action");
  assert(en.savedWorkspacesCopy?.message.includes("Local snapshots only"), "English saved workspace copy should set local-only scope");
  assert(zh.savedWorkspacesCopy?.message.includes("仅本地快照"), "Chinese saved workspace copy should set local-only scope");
  assert(en.deleteWorkspaceConfirm?.message.includes("does not restore, close, or move tabs"), "English delete workspace confirm should state tab safety");
  assert(zh.deleteWorkspaceConfirm?.message.includes("不会恢复、关闭或移动标签页"), "Chinese delete workspace confirm should state tab safety");
});

test("saved workspace deletion only updates local workspace storage", async () => {
  const originalStorageLocal = context.chrome.storage.local;
  const originalTabs = context.chrome.tabs;
  const originalTabGroups = context.chrome.tabGroups;
  const originalWindows = context.chrome.windows;
  const setValues = [];

  context.chrome.storage.local = {
    async get(key) {
      assertEqual(key, "tabmosaic.savedWorkspaces", "Workspace deletion should read only saved workspace storage");
      return {
        "tabmosaic.savedWorkspaces": [
          { id: "ws_keep", name: "Keep" },
          { id: "ws_delete", name: "Delete" }
        ]
      };
    },
    async set(value) {
      setValues.push(value);
    },
    async remove() {
      throw new Error("Workspace deletion should not remove unrelated local data");
    }
  };
  context.chrome.tabs = new Proxy(
    {},
    {
      get() {
        throw new Error("Workspace deletion must not call tabs APIs");
      }
    }
  );
  context.chrome.tabGroups = new Proxy(
    {},
    {
      get() {
        throw new Error("Workspace deletion must not call tabGroups APIs");
      }
    }
  );
  context.chrome.windows = new Proxy(
    {},
    {
      get() {
        throw new Error("Workspace deletion must not call windows APIs");
      }
    }
  );

  try {
    const result = await context.deleteSavedWorkspace({ workspaceId: "ws_delete" });

    assertEqual(result.deletedWorkspaceId, "ws_delete", "Deleted workspace id");
    assertDeepEqual(result.workspaces.map((workspace) => workspace.id), ["ws_keep"], "Remaining workspaces");
    assertDeepEqual(
      setValues[0]["tabmosaic.savedWorkspaces"].map((workspace) => workspace.id),
      ["ws_keep"],
      "Stored remaining workspaces"
    );
  } finally {
    context.chrome.storage.local = originalStorageLocal;
    context.chrome.tabs = originalTabs;
    context.chrome.tabGroups = originalTabGroups;
    context.chrome.windows = originalWindows;
  }
});

test("dashboard can move tabs between existing groups without adding destructive actions", () => {
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const dashboardCss = fs.readFileSync(path.join(EXTENSION_DIR, "styles.css"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));

  assert(dashboardJs.includes('data-group-action="move-tab"'), "Dashboard tab rows should expose a move action");
  assert(dashboardJs.includes("APPLY_DASHBOARD_TAB_MOVE"), "Dashboard should call the tab move background action");
  assert(dashboardJs.includes("data-tab-target-group"), "Dashboard should render target group selection");
  assert(dashboardJs.includes('dashboardGroups.addEventListener("dragstart"'), "Dashboard should support drag-start for tab assignment");
  assert(dashboardJs.includes('dashboardGroups.addEventListener("drop"'), "Dashboard should support dropping tabs onto groups");
  assert(dashboardJs.includes('data-tab-draggable="${canDrag ? "true" : "false"}"'), "Dashboard should mark only movable tab rows as draggable");
  assert(dashboardJs.includes("function getDashboardTabMoveTargets"), "Dashboard drag/drop should reuse same-window move target logic");
  assert(dashboardJs.includes("moveDashboardTab(dragState.tabId"), "Dashboard drop should use the existing tab move action");
  assert(dashboardJs.includes("Number(group.windowId) === Number(currentGroup.windowId)"), "Dashboard should limit move choices to the same window");
  assert(dashboardCss.includes(".dashboard-tab-move"), "Dashboard tab move controls should have scoped styling");
  assert(dashboardCss.includes(".dashboard-group-card.drag-over"), "Dashboard drop targets should have scoped drag-over styling");
  assert(dashboardCss.includes(".dashboard-tabrow.dragging"), "Dashboard dragged tab rows should have scoped styling");
  assert(backgroundCode.includes("APPLY_DASHBOARD_TAB_MOVE"), "Background should handle Dashboard tab moves");
  assert(backgroundCode.includes("groupId: targetGroupId"), "Background should move tabs into an existing native group");
  assert(backgroundCode.includes("Dashboard can only move tabs between groups in the same window."), "Background should enforce same-window tab moves");
  assert(!dashboardJs.includes("chrome.tabs.remove"), "Dashboard tab move UI must not close tabs");
  assert(en.move?.message && zh.move?.message, "Dashboard tab move copy should be localized");
  assert(en.dragTabToGroup?.message && zh.dragTabToGroup?.message, "Dashboard tab drag copy should be localized");
});

test("dashboard exposes compact undo and restore actions without adding destructive actions", () => {
  const dashboardHtml = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.html"), "utf8");
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const dashboardCss = fs.readFileSync(path.join(EXTENSION_DIR, "styles.css"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));

  assert(dashboardHtml.includes("dashboardUndoButton"), "Dashboard should expose an Undo action");
  assert(dashboardHtml.includes("dashboardRestoreButton"), "Dashboard should expose a Restore Closed action");
  assert(dashboardJs.includes("function undoFromDashboard"), "Dashboard should implement Undo through the background action");
  assert(dashboardJs.includes("function restoreClosedFromDashboard"), "Dashboard should implement Restore Closed through the background action");
  assert(dashboardJs.includes('type: "UNDO_LAST"'), "Dashboard Undo should reuse the existing Undo action");
  assert(dashboardJs.includes('type: "RESTORE_CLOSED_DUPLICATES"'), "Dashboard Restore Closed should reuse the existing restore action");
  assert(dashboardJs.includes("syncDashboardActionButtons"), "Dashboard should enable actions from latest run state");
  assert(dashboardJs.includes("summary.undoAvailable"), "Dashboard Undo should be enabled only when an undo snapshot is available");
  assert(dashboardJs.includes("summary.closedTabsRestoreAvailable"), "Dashboard Restore should be enabled only when closed tabs are available");
  assert(dashboardJs.includes('.dashboard-chip[data-filter]'), "Dashboard action chips should not change the group filter");
  assert(dashboardCss.includes(".dashboard-chip:disabled"), "Dashboard action buttons should have disabled styling");
  assert(!dashboardJs.includes("chrome.tabs.remove"), "Dashboard Undo/Restore UI must not directly close tabs");
  assert(en.undo?.message && zh.undo?.message, "Dashboard Undo copy should be localized");
  assert(en.restoreClosed?.message && zh.restoreClosed?.message, "Dashboard Restore Closed copy should be localized");
  assert(en.restoring?.message && zh.restoring?.message, "Dashboard restoring state copy should be localized");
});

test("dashboard duplicate center exposes non-destructive tab details", () => {
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const dashboardCss = fs.readFileSync(path.join(EXTENSION_DIR, "styles.css"), "utf8");

  assert(dashboardJs.includes("dashboardDuplicates.addEventListener(\"click\", handleGroupAction)"), "Duplicate Center should reuse safe dashboard focus actions");
  assert(dashboardJs.includes("function renderDuplicateTabRow"), "Duplicate Center should render tab detail rows");
  assert(dashboardJs.includes("dashboard-duplicate-group"), "Duplicate Center groups should be expandable details");
  assert(dashboardJs.includes("dashboard-duplicate-tab"), "Duplicate Center should expose individual duplicate tab rows");
  assert(dashboardJs.includes('data-group-action="focus-tab"'), "Duplicate Center tab rows should focus existing tabs only");
  assert(dashboardJs.includes("latestRun?.snapshot?.tabs"), "Duplicate Center should use the latest sanitized local snapshot");
  assert(dashboardCss.includes(".dashboard-duplicate-group"), "Duplicate Center expandable groups should have scoped styling");
  assert(dashboardCss.includes(".dashboard-duplicate-tab"), "Duplicate Center tab rows should have scoped styling");
  assert(!dashboardJs.includes("chrome.tabs.remove"), "Duplicate Center UI must not directly close tabs");
});

test("dashboard tab titles focus existing browser tabs", () => {
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const dashboardCss = fs.readFileSync(path.join(EXTENSION_DIR, "styles.css"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));

  assert(dashboardJs.includes('data-group-action="focus-tab"'), "Dashboard tab titles should expose focus action");
  assert(dashboardJs.includes("FOCUS_DASHBOARD_TAB"), "Dashboard should call the tab focus background action");
  assert(dashboardCss.includes(".dashboard-tab-title-button"), "Dashboard tab title focus control should have scoped styling");
  assert(backgroundCode.includes("FOCUS_DASHBOARD_TAB"), "Background should handle Dashboard tab focus");
  assert(backgroundCode.includes("chrome.tabs.update(tabId, { active: true })"), "Background should activate the requested tab");
  assert(backgroundCode.includes("chrome.windows.update(tab.windowId, { focused: true })"), "Background should focus the tab window");
  assert(!dashboardJs.includes("chrome.tabs.remove"), "Dashboard tab focus UI must not close tabs");
  assert(en.openTab?.message && zh.openTab?.message, "Dashboard tab focus copy should be localized");
});

test("dashboard filter chips filter smart groups", () => {
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));

  assert(dashboardJs.includes("let activeGroupFilter = \"all\""), "Dashboard should keep active group filter state");
  assert(dashboardJs.includes("function getFilteredGroups"), "Dashboard should filter group data before rendering");
  assert(dashboardJs.includes("filterName === \"ai\""), "Dashboard should support AI group filtering");
  assert(dashboardJs.includes("filterName === \"rules\""), "Dashboard should support rule group filtering");
  assert(dashboardJs.includes("groups.filter((group) => isAIGroup(group)).length"), "AI chip count should reflect rendered AI groups");
  assert(dashboardJs.includes("button.setAttribute(\"aria-pressed\""), "Dashboard chips should expose pressed state");
  assert(dashboardJs.includes("noGroupsForFilter"), "Dashboard should render an empty state for filters");
  assert(en.noGroupsForFilter?.message && zh.noGroupsForFilter?.message, "Filter empty state should be localized");
});

test("dashboard keeps MVP UI simple and folds advanced settings", () => {
  const dashboardHtml = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.html"), "utf8");
  const dashboardCss = fs.readFileSync(path.join(EXTENSION_DIR, "styles.css"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));

  assert(!dashboardHtml.includes("P1"), "Dashboard should not expose unwired P1 placeholders in the default UI");
  assert(!dashboardHtml.includes("disabled data-i18n"), "Dashboard should avoid disabled placeholder buttons");
  assert(dashboardHtml.includes('data-i18n="aiClassification"'), "Settings should lead with AI classification");
  assert(dashboardHtml.includes('data-i18n="privacyDefaults"'), "Settings should show compact privacy defaults");
  assert(dashboardHtml.includes('<details class="settings-advanced">'), "Advanced settings should be folded into details");
  assert(dashboardCss.includes(".settings-advanced"), "Advanced settings should have dedicated collapsed styling");
  assert(en.aiClassification?.message && zh.aiClassification?.message, "AI classification settings copy should be localized");
  assert(en.privacyDefaults?.message && zh.privacyDefaults?.message, "Privacy defaults copy should be localized");
});

test("sidepanel and dashboard expose actionable safe error states", () => {
  const sidepanelJs = fs.readFileSync(path.join(EXTENSION_DIR, "sidepanel.js"), "utf8");
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const dashboardCss = fs.readFileSync(path.join(EXTENSION_DIR, "styles.css"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));

  assert(sidepanelJs.includes('data-error-state="safe"'), "Sidepanel error state should disclose safe no-change behavior");
  assert(sidepanelJs.includes("nothingChangedOnError"), "Sidepanel error state should tell users no tabs changed");
  assert(sidepanelJs.includes("errorNextStepHint"), "Sidepanel error state should offer a next step");
  assert(dashboardJs.includes('run?.status === "error"'), "Dashboard should render stored organize errors explicitly");
  assert(dashboardJs.includes("function renderDashboardError"), "Dashboard should use a reusable error card");
  assert(dashboardJs.includes('data-dashboard-error-state="safe"'), "Dashboard error card should disclose safe no-change behavior");
  assert(dashboardCss.includes(".error-note"), "Sidepanel error state should have scoped styling");
  assert(dashboardCss.includes(".dashboard-error-card"), "Dashboard error card should have scoped styling");
  assert(en.nothingChangedOnError?.message && zh.nothingChangedOnError?.message, "No-change error copy should be localized");
  assert(en.dashboardErrorTitle?.message && zh.dashboardErrorTitle?.message, "Dashboard error title should be localized");
  assert(!dashboardJs.includes("chrome.tabs.remove"), "Dashboard error state must not close tabs");
});

test("disposable manual QA checklist covers current MVP workflows", () => {
  const manualQaTool = fs.readFileSync(path.join(ROOT_DIR, "tools", "open_manual_qa_profile.js"), "utf8");

  for (const token of [
    "Dashboard opens directly to Smart Groups without Latest Result",
    "Duplicate Center stays folded until opened",
    "Duplicate Center rows expand to show duplicate tabs and Open tab focuses an existing tab.",
    "Error States",
    "If organize fails, Sidebar says no tabs were moved or closed.",
    "Dashboard Undo and Restore Closed are compact and enabled only when available.",
    "Smart Groups filters switch between All, AI groups, and Rule groups",
    "Clicking a tab title focuses the existing browser tab/window.",
    "Same-window Move sends a tab into an existing native group and does not close tabs.",
    "Dragging a tab row into another same-window group updates the native Chrome group.",
    "Sidebar Tab Agent completion message lightly mentions DeepSeek help or local fallback.",
    "Local QA Notes",
    "data-qa-notes",
    "data-copy-real-profile-template",
    "Copy Real-Profile Template",
    "Status: BLANK TEMPLATE - NOT A COMPLETED QA RESULT",
    "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no",
    "Copy Diagnostic Snapshot excludes URLs",
    "Does not read your real Chrome profile, real browser tabs, or .env.local"
  ]) {
    assert(manualQaTool.includes(token), `Manual QA checklist should include: ${token}`);
  }
});

test("AI host guardrail matches manifest host permission", () => {
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const dashboardHtml = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.html"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));
  const allowedHostPermission = "https://api.deepseek.com/*";
  const allowedHost = new URL(allowedHostPermission.replace("*", "")).hostname;

  assertDeepEqual(manifest.host_permissions, [allowedHostPermission], "Private beta should expose only the DeepSeek host permission");
  assert(backgroundCode.includes(`const SUPPORTED_AI_HOSTNAME = "${allowedHost}"`), "Background AI host guardrail should match manifest");
  assertEqual(context.normalizeAIBaseUrl(allowedHostPermission.replace("*", "")), "https://api.deepseek.com", "Background should normalize the manifest host");
  assert(dashboardJs.includes(`url.hostname !== "${allowedHost}"`), "Dashboard AI host guardrail should match manifest");
  assert(dashboardHtml.includes(`<b>${allowedHostPermission}</b>`), "Dashboard permission copy should show the same host permission");
  assert(dashboardHtml.includes('data-i18n="aiBaseUrlBetaLimit"'), "Dashboard AI settings should explain the private-beta host limit");
  assert(en.aiBaseUrlBetaLimit?.message.includes(allowedHost), "English AI host limit copy should mention DeepSeek host");
  assert(zh.aiBaseUrlBetaLimit?.message.includes(allowedHost), "Chinese AI host limit copy should mention DeepSeek host");
  assert(!dashboardJs.includes("api.openai.com"), "Dashboard must not silently allow OpenAI host without confirmation");
  assert(!backgroundCode.includes("api.openai.com"), "Background must not silently allow OpenAI host without confirmation");
});

test("dashboard rule deletion requires confirmation", () => {
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));
  const deleteBranchIndex = dashboardJs.indexOf('button.dataset.ruleAction === "delete"');
  const confirmIndex = dashboardJs.indexOf('window.confirm(msg("deleteRuleConfirm"))');
  const deleteFilterIndex = dashboardJs.indexOf("rules.filter((rule) => rule.id !== ruleId)");

  assert(deleteBranchIndex >= 0, "Dashboard rule delete branch should exist");
  assert(confirmIndex > deleteBranchIndex, "Dashboard should confirm after delete branch starts");
  assert(deleteFilterIndex > confirmIndex, "Dashboard should confirm before deleting a local rule");
  assert(en.deleteRuleConfirm?.message, "English delete rule confirmation copy");
  assert(zh.deleteRuleConfirm?.message, "Chinese delete rule confirmation copy");
  assert(en.deleteRuleConfirm.message.includes("does not move or close tabs"), "English delete confirmation should state tab safety");
  assert(zh.deleteRuleConfirm.message.includes("不会移动或关闭标签页"), "Chinese delete confirmation should state tab safety");
});

test("dashboard can clear AI key without clearing other local data", () => {
  const dashboardHtml = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.html"), "utf8");
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));
  const functionStart = dashboardJs.indexOf("async function clearAIKey()");
  const functionEnd = dashboardJs.indexOf("async function clearLocalData()");
  const clearAIKeyBody = dashboardJs.slice(functionStart, functionEnd);

  assert(dashboardHtml.includes('id="clearAIKeyButton"'), "Dashboard should expose a Clear AI Key button");
  assert(dashboardHtml.includes('data-i18n="clearAIKey"'), "Clear AI Key button should use locale copy");
  assert(functionStart >= 0, "Dashboard should implement clearAIKey");
  assert(functionEnd > functionStart, "clearAIKey should be scoped before clearLocalData");
  assert(clearAIKeyBody.includes('window.confirm(msg("clearAIKeyConfirm"))'), "Clear AI Key should require confirmation");
  assert(clearAIKeyBody.includes("chrome.storage.local.get(AI_SETTINGS_KEY)"), "Clear AI Key should load existing AI settings");
  assert(clearAIKeyBody.includes("chrome.storage.local.set({ [AI_SETTINGS_KEY]: next })"), "Clear AI Key should update only AI settings");
  assert(clearAIKeyBody.includes("enabled: false"), "Clear AI Key should disable AI classification");
  assert(clearAIKeyBody.includes('apiKey: ""'), "Clear AI Key should remove the local API key");
  assert(!clearAIKeyBody.includes("CLEAR_LOCAL_DATA"), "Clear AI Key must not clear all local data");
  assert(!clearAIKeyBody.includes("chrome.runtime.sendMessage"), "Clear AI Key must not call background actions");
  assert(!clearAIKeyBody.includes("chrome.tabs"), "Clear AI Key must not touch browser tabs");
  assert(en.clearAIKeyConfirm?.message.includes("does not move or close tabs"), "English AI key clear confirmation should state tab safety");
  assert(zh.clearAIKeyConfirm?.message.includes("不会移动或关闭标签页"), "Chinese AI key clear confirmation should state tab safety");
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

test("current run snapshot strips restorable URLs and page text", () => {
  const privateSnapshot = snapshot([
    tab({
      id: 21,
      title: "Private planning doc",
      url: "https://private.example/secret?token=abc#fragment",
      favIconUrl: "https://private.example/favicon.ico?token=abc#fragment",
      groupId: 7,
      groupTitle: "Secret Project"
    })
  ]);
  privateSnapshot.tabs[0].url = "https://private.example/secret?token=abc#fragment";
  privateSnapshot.tabs[0].fullUrl = "https://private.example/secret?token=abc#fragment";
  privateSnapshot.tabs[0].pageText = "Confidential page body";

  const runSnapshot = context.sanitizeSnapshotForRun(privateSnapshot);
  const undoSnapshot = context.buildUndoSnapshot(privateSnapshot);
  const runTab = runSnapshot.tabs[0];
  const runSnapshotJson = JSON.stringify(runSnapshot);
  const undoSnapshotJson = JSON.stringify(undoSnapshot);

  assert(!("restoreUrl" in runTab), "Current run snapshot must not keep restoreUrl");
  assert(!("url" in runTab), "Current run snapshot must not keep raw url");
  assert(!("fullUrl" in runTab), "Current run snapshot must not keep fullUrl");
  assert(!("pageText" in runTab), "Current run snapshot must not keep pageText");
  assert(!("exactUrlHash" in runTab), "Current run snapshot must not keep exact URL hash");
  assert(!("trackingUrlHash" in runTab), "Current run snapshot must not keep tracking URL hash");
  assert(!("reviewUrlHash" in runTab), "Current run snapshot must not keep review URL hash");
  assertEqual(runTab.favIconUrl, "https://private.example/favicon.ico", "Current run snapshot should keep only sanitized favicon display URL");
  assert(!runSnapshotJson.includes("https://private.example/secret"), "Current run snapshot must not include full URL");
  assert(!runSnapshotJson.includes("token=abc"), "Current run snapshot must not include query token");
  assert(!runSnapshotJson.includes("Confidential page body"), "Current run snapshot must not include page text");

  assertDeepEqual(
    Object.keys(undoSnapshot.tabs[0]).sort(),
    ["groupId", "id", "index", "windowId"].sort(),
    "Undo snapshot should keep only minimum fields needed to restore grouping"
  );
  assert(!undoSnapshotJson.includes("https://private.example/secret"), "Undo snapshot must not include full URL");
  assert(!undoSnapshotJson.includes("Confidential page body"), "Undo snapshot must not include page text");
});

test("current tab summary confirms sensitive pages before extraction", () => {
  const sidepanelJs = fs.readFileSync(path.join(EXTENSION_DIR, "sidepanel.js"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));
  const sensitiveParsed = context.parseUrl("https://billing.stripe.com/customer/secret?token=abc");
  const normalParsed = context.parseUrl("https://developer.chrome.com/docs/extensions/");
  const sensitiveCheck = context.buildSummaryPrivacyCheck(
    { id: 22, title: "Stripe billing dashboard" },
    sensitiveParsed
  );
  const normalCheck = context.buildSummaryPrivacyCheck(
    { id: 23, title: "Chrome extension docs" },
    normalParsed
  );
  const blockedSummary = context.buildSensitiveSummaryConfirmation(
    { id: 22, title: "Stripe billing dashboard" },
    sensitiveParsed,
    sensitiveCheck
  );
  const questionAnswer = context.buildLocalPageSummary({
    tab: { title: "Pricing guide" },
    parsedUrl: context.parseUrl("https://example.com/pricing"),
    question: "What does the Pro plan include?",
    page: {
      title: "Pricing guide",
      description: "Compare the Free and Pro plans for TabMosaic.",
      headings: ["Plans", "Pro plan"],
      text: "The Free plan includes local tab grouping. The Pro plan includes workspace history, multi-tab summaries, and advanced rules. Enterprise plans add team controls."
    }
  });
  const sensitiveSerialized = JSON.stringify({ sensitiveCheck, blockedSummary });

  assertEqual(sensitiveCheck.requiresConfirmation, true, "Sensitive summary should require confirmation");
  assertEqual(sensitiveCheck.tabId, 22, "Sensitive summary confirmation should bind to tab id");
  assert(
    sensitiveCheck.reason.includes("billing") || sensitiveCheck.reason.includes("stripe"),
    "Sensitive summary should explain the sensitive reason"
  );
  assertEqual(normalCheck.requiresConfirmation, false, "Normal docs summary should not require confirmation");
  assertEqual(blockedSummary.status, "needs-confirmation", "Sensitive summary should block extraction first");
  assert(blockedSummary.keyPoints.includes("No page body was read."), "Blocked sensitive summary should state no body was read");
  assertEqual(questionAnswer.question, "What does the Pro plan include?", "Local page Q&A should preserve the user question");
  assert(questionAnswer.summary.includes("Pro plan includes workspace history"), "Local page Q&A should answer from visible page text");
  assert(!sensitiveSerialized.includes("https://billing.stripe.com/customer/secret"), "Sensitive confirmation must not expose full URL");
  assert(!sensitiveSerialized.includes("token=abc"), "Sensitive confirmation must not expose query token");

  assert(sidepanelJs.includes('"CHECK_SUMMARY_PRIVACY"'), "Sidepanel should check summary privacy before extraction");
  assert(sidepanelJs.indexOf('"CHECK_SUMMARY_PRIVACY"') < sidepanelJs.indexOf('"SUMMARIZE_CURRENT_TAB"'), "Privacy check should run before summary request");
  assert(sidepanelJs.includes('window.confirm(msg("sensitiveSummaryConfirm"'), "Sidepanel should confirm sensitive summaries");
  assert(sidepanelJs.includes("confirmedSensitiveTabId"), "Sidepanel should pass the confirmed sensitive tab id");
  assert(en.sensitiveSummaryConfirm?.message.includes("sensitive information"), "English sensitive summary confirmation copy");
  assert(zh.sensitiveSummaryConfirm?.message.includes("敏感信息"), "Chinese sensitive summary confirmation copy");
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
    savedWorkspaces: [
      {
        name: "Secret Project",
        tabs: [{ title: "Private planning doc", hostname: "private.example" }]
      }
    ],
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
  assertEqual(snapshot.localState.savedWorkspaceCount, 1, "Diagnostic saved workspace count");
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

test("large synthetic tab planning stays bounded and private", () => {
  const state = largeSyntheticSnapshot();
  const startedAt = process.hrtime.bigint();
  const duplicateGroups = context.detectDuplicateGroups(state.tabs);
  const closePlan = context.buildSafeDuplicateClosePlan(duplicateGroups, state.tabs);
  const groupPlan = context.buildGroupPlan(state);
  const validatedPlan = context.validateGroupPlan(groupPlan, state);
  const summary = context.summarizeSnapshot(state, duplicateGroups);
  const sanitized = context.sanitizeSnapshotForRun(state);
  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1000000;
  const closedTabs = closePlan.closeTabs
    .map((item) => state.tabs.find((tabItem) => tabItem.id === item.tabId))
    .filter(Boolean);

  assert(elapsedMs < 2000, `Large synthetic tab planning should stay bounded, took ${elapsedMs.toFixed(2)}ms`);
  assertEqual(summary.tabCount, 180, "Large synthetic summary tab count");
  assertEqual(summary.windowCount, 2, "Large synthetic summary window count");
  assert(validatedPlan.length > 0, "Large synthetic plan should create useful groups");
  assert(validatedPlan.length <= 32, "Large synthetic plan should avoid unreasonable group explosion");
  assert(duplicateGroups.some((group) => group.action === "safe-close-candidate"), "Large synthetic run should find safe duplicates");
  assert(duplicateGroups.some((group) => group.action === "review"), "Large synthetic run should keep hash/query variants in review");
  assert(closePlan.closeTabs.length > 0, "Large synthetic close plan should include safe duplicates");
  assert(
    closedTabs.every((tabItem) => !tabItem.active && !tabItem.pinned && !tabItem.audible && !tabItem.incognito && !tabItem.protectedReasons.length),
    "Large synthetic close plan must not close protected tabs"
  );
  assert(
    sanitized.tabs.every(
      (tabItem) =>
        !("restoreUrl" in tabItem) &&
        !("exactUrlHash" in tabItem) &&
        !("trackingUrlHash" in tabItem) &&
        !("reviewUrlHash" in tabItem) &&
        !("fullUrl" in tabItem) &&
        !("pageText" in tabItem)
    ),
    "Large synthetic sanitized snapshot should not retain sensitive URL/body fields"
  );
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

test("AI classification request sends minimized tab metadata only", async () => {
  const fetchCalls = [];
  context.fetch = async (url, options = {}) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  groups: [
                    {
                      name: "Private Work",
                      color: "blue",
                      confidence: 0.9,
                      reason: "Synthetic fixture",
                      tabIds: [41]
                    }
                  ],
                  reviewTabIds: []
                })
              }
            }
          ]
        };
      }
    };
  };

  const output = await context.callOpenAICompatibleClassifier(
    {
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      apiKey: "sk-secret"
    },
    [
      {
        tabId: 41,
        title: "Private planning title",
        hostname: "private.example",
        path: "/secret",
        fullUrl: "https://private.example/secret?token=abc",
        restoreUrl: "https://private.example/secret?token=abc",
        favIconUrl: "https://private.example/favicon.ico?token=abc",
        pageText: "Confidential page body",
        windowId: 1,
        active: true,
        pinned: false,
        audible: false,
        discarded: false,
        existingGroup: null
      }
    ]
  );

  assertEqual(fetchCalls.length, 1, "AI classification fetch call count");
  assertEqual(fetchCalls[0].url, "https://api.deepseek.com/chat/completions", "AI classification endpoint");
  assertEqual(fetchCalls[0].options.method, "POST", "AI classification should use POST");
  assert(fetchCalls[0].options.signal, "AI classification fetch should carry an abort signal");

  const bodyText = fetchCalls[0].options.body || "";
  const body = JSON.parse(bodyText);
  const userContent = JSON.parse(body.messages[1].content);
  const firstTab = userContent.tabs[0];

  assertEqual(output.groups[0].tabIds[0], 41, "AI classifier output should parse JSON");
  assertEqual(firstTab.tabId, 41, "AI payload should include tab id");
  assertEqual(firstTab.title, "Private planning title", "AI payload should include title");
  assertEqual(firstTab.hostname, "private.example", "AI payload should include hostname");
  assertEqual(firstTab.path, "/secret", "AI payload should include path");
  assertEqual(firstTab.active, true, "AI payload should include tab state");
  assert(!("fullUrl" in firstTab), "AI payload must not include fullUrl field");
  assert(!("restoreUrl" in firstTab), "AI payload must not include restoreUrl field");
  assert(!("favIconUrl" in firstTab), "AI payload must not include favIconUrl field");
  assert(!("pageText" in firstTab), "AI payload must not include pageText field");
  assert(!bodyText.includes("https://private.example/secret?token=abc"), "AI payload must not include full URL");
  assert(!bodyText.includes("favicon.ico"), "AI payload must not include favicon URL");
  assert(!bodyText.includes("token=abc"), "AI payload must not include URL query token");
  assert(!bodyText.includes("Confidential page body"), "AI payload must not include page text");
  assert(bodyText.includes("No page body or full URL"), "AI payload should include privacy note");
});

test("AI classification timeout falls back to local rules", async () => {
  let aborted = false;
  context.fetch = async (url, options = {}) =>
    new Promise((resolve, reject) => {
      options.signal?.addEventListener(
        "abort",
        () => {
          aborted = true;
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true }
      );
    });
  context.chrome.storage.local = {
    async get(key) {
      if (key === "tabmosaic.aiSettings") {
        return {
          "tabmosaic.aiSettings": {
            enabled: true,
            apiKey: "sk-secret",
            baseUrl: "https://api.deepseek.com",
            model: "deepseek-v4-flash",
            classificationTimeoutMs: 1
          }
        };
      }
      return {};
    },
    async set() {},
    async remove() {}
  };

  const result = await context.classifyTabsWithAIIfConfigured(
    snapshot([
      tab({
        id: 51,
        title: "Chrome docs",
        url: "https://developer.chrome.com/docs/extensions/reference/api/tabs"
      }),
      tab({
        id: 52,
        title: "GitHub PR",
        url: "https://github.com/acme/app/pull/42"
      })
    ])
  );

  assert(aborted, "AI classification fetch should be aborted on timeout");
  assert(String(result.status).includes("AI classification timed out"), "Timeout should surface as fallback reason");
  assertEqual(result.byTabId.size, 0, "Timed out AI classification should not assign tabs");
  assertEqual(result.groupCount, 0, "Timed out AI classification should not count groups");
});

test("AI classification status stays lightweight in sidebar and dashboard", () => {
  const sidepanelJs = fs.readFileSync(path.join(EXTENSION_DIR, "sidepanel.js"), "utf8");
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const screenshotTool = fs.readFileSync(path.join(ROOT_DIR, "tools", "capture_ui_screenshots.js"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));

  assert(sidepanelJs.includes('msg("deepSeekHelped")'), "Sidepanel completion message should mention when DeepSeek helped");
  assert(sidepanelJs.includes('msg("aiFellBackLocal")'), "Sidepanel completion message should mention AI fallback without a metrics panel");
  assert(!sidepanelJs.includes("summary?.aiGroupsSuggested"), "Sidepanel should keep AI group count out of the minimal result card");
  assert(dashboardJs.includes('msg("aiStatus")'), "Dashboard result details should show AI status");
  assert(dashboardJs.includes('msg("aiGroups")'), "Dashboard should show AI group count");
  assert(dashboardJs.includes("summary.aiGroupsSuggested"), "Dashboard should read AI suggested group count");
  assert(dashboardJs.includes('status === "empty"'), "Dashboard should format empty AI output");
  assert(screenshotTool.includes("aiGroupsSuggested: 3"), "Screenshot mock should render AI group count");
  assert(en.aiStatus?.message, "English AI status label");
  assert(en.aiGroups?.message, "English AI group label");
  assert(en.aiNoUsableGroups?.message, "English empty AI copy");
  assert(zh.aiStatus?.message, "Chinese AI status label");
  assert(zh.aiGroups?.message, "Chinese AI group label");
  assert(zh.aiNoUsableGroups?.message, "Chinese empty AI copy");
});

test("store screenshot drafts are reproducible and marked not final", () => {
  const toolPath = path.join(ROOT_DIR, "tools", "build_store_screenshots.js");
  const preflight = fs.readFileSync(path.join(ROOT_DIR, "tools", "preflight.js"), "utf8");
  const tool = fs.readFileSync(toolPath, "utf8");

  assert(fs.existsSync(toolPath), "Store screenshot draft tool should exist");
  assert(preflight.includes("tools/build_store_screenshots.js"), "Preflight should syntax-check store screenshot drafts");
  assert(preflight.includes("Store screenshot draft capture"), "Preflight --screenshots should build store screenshot drafts");
  assert(tool.includes("const WIDTH = 1280"), "Store screenshot drafts should use 1280px width");
  assert(tool.includes("const HEIGHT = 800"), "Store screenshot drafts should use 800px height");
  assert(tool.includes("DO NOT SUBMIT YET"), "Store screenshot drafts should be clearly marked as not final");
  assert(tool.includes('"artifacts", "store-screenshots"'), "Store screenshot drafts should stay in ignored local artifacts");
  assert(tool.includes("do not use real browser tabs"), "Store screenshot draft README should explain privacy scope");
  assert(tool.includes("developer.chrome.com/docs/webstore/images"), "Store screenshot draft README should cite image guidance");
  assert(tool.includes("developer.chrome.com/docs/webstore/best-listing"), "Store screenshot draft README should cite listing guidance");
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
  assert(fetchCalls[0].options.signal, "AI connection fetch should carry an abort signal");
  assert(!fetchCalls[0].options.body, "AI connection should not send request body");
  assertEqual(result.modelAvailable, true, "AI connection model availability");
  assertEqual(result.privacy.sentTabData, false, "AI connection must not send tab data");
  assertEqual(result.privacy.sentPageText, false, "AI connection must not send page text");
  assertEqual(result.privacy.sentFullUrls, false, "AI connection must not send full URLs");
  assertEqual(context.normalizeAIBaseUrl("https://api.deepseek.com/v1/"), "https://api.deepseek.com/v1", "DeepSeek paths should remain supported");

  try {
    await context.testAIConnection({
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4.1-mini",
      apiKey: "sk-secret"
    });
    assert(false, "Unsupported AI base URL should fail");
  } catch (error) {
    assert(
      String(error?.message || "").includes("Current beta supports only https://api.deepseek.com"),
      "Unsupported AI host should explain the current beta host limit"
    );
  }

  assertEqual(fetchCalls.length, 1, "Unsupported AI host must not trigger another fetch");
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
    "tabmosaic.duplicateSafetyAudit",
    "tabmosaic.savedWorkspaces"
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
