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
const PROVIDER_REGISTRY_PATH = path.join(EXTENSION_DIR, "provider_registry.js");

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const providerRegistryCode = fs.readFileSync(PROVIDER_REGISTRY_PATH, "utf8");
const backgroundSource = fs.readFileSync(BACKGROUND_PATH, "utf8");
const backgroundCode = stripStaticImportsForVm(backgroundSource);
const providerRegistryVmCode = transformProviderRegistryForVm(providerRegistryCode);
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
    },
    permissions: {
      async contains() {
        return true;
      },
      async request() {
        return true;
      }
    }
  }
};

vm.createContext(context);
vm.runInContext(providerRegistryVmCode, context, { filename: PROVIDER_REGISTRY_PATH });
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

function stripStaticImportsForVm(source) {
  return source.replace(/^import[\s\S]*?;\n\n/m, "");
}

function transformProviderRegistryForVm(source) {
  return source.replace(/export const /g, "var ");
}

function tab(overrides) {
  const parsed = context.parseUrl(overrides.url || "https://example.com/");
  const title = overrides.title || "Untitled";
  const titleDuplicate = context.buildTitleDuplicateKey(title, parsed);
  return {
    id: overrides.id,
    windowId: overrides.windowId || 1,
    index: overrides.index || 0,
    title,
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
    domainDuplicateHash: parsed.domainDuplicateHash,
    domainDuplicateLabel: parsed.domainDuplicateLabel,
    domainDuplicateReason: parsed.domainDuplicateReason,
    samePageReviewEligible: parsed.samePageReviewEligible,
    titleDuplicateHash: titleDuplicate.key ? context.simpleHash(titleDuplicate.key) : "",
    titleDuplicateLabel: titleDuplicate.label,
    titleDuplicateReason: titleDuplicate.reason,
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

test("manifest keeps toolbar menu action and narrow permissions", () => {
  assertEqual(manifest.manifest_version, 3, "Manifest version");
  assertEqual(manifest.action.default_popup, "popup.html", "Manifest action should open the compact toolbar menu");
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
  assertDeepEqual(
    manifest.optional_host_permissions,
    ["http://*/*", "https://*/*"],
    "Optional host permissions should be broad only for user-triggered temporary site access"
  );

  const iconPaths = new Set([
    ...Object.values(manifest.icons || {}),
    ...Object.values(manifest.action.default_icon || {})
  ]);

  for (const iconPath of iconPaths) {
    assert(fs.existsSync(path.join(EXTENSION_DIR, iconPath)), `Missing icon file: ${iconPath}`);
  }

  const popupPath = path.join(EXTENSION_DIR, manifest.action.default_popup);
  const popupJsPath = path.join(EXTENSION_DIR, "popup.js");
  assert(fs.existsSync(popupPath), "Toolbar popup HTML should exist");
  assert(fs.existsSync(popupJsPath), "Toolbar popup JS should exist");

  const popupHtml = fs.readFileSync(popupPath, "utf8");
  const popupJs = fs.readFileSync(popupJsPath, "utf8");
  const expectedActions = ["smart-organize", "vertical-tabs", "current-page-chat", "dashboard"];

  for (const action of expectedActions) {
    assert(popupHtml.includes(`data-toolbar-action="${action}"`), `Missing toolbar action: ${action}`);
  }

  assert(popupJs.includes("RUN_TOOLBAR_ACTION"), "Toolbar popup should delegate actions to the service worker");
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

test("toolbar popup delegates user-gesture actions to background", () => {
  const popupPath = path.join(EXTENSION_DIR, manifest.action.default_popup);
  const popupHtml = fs.readFileSync(popupPath, "utf8");
  const popupJs = fs.readFileSync(path.join(EXTENSION_DIR, "popup.js"), "utf8");
  const actionMatches = Array.from(popupHtml.matchAll(/data-toolbar-action="([^"]+)"/g), (match) => match[1]);
  const expectedActions = ["smart-organize", "vertical-tabs", "current-page-chat", "dashboard"];

  assertDeepEqual(actionMatches, expectedActions, "Toolbar popup should expose only the confirmed compact action set in order");
  assert(!popupHtml.includes("apiKey") && !popupHtml.includes("settings"), "Toolbar popup must not become an AI settings page");
  assert(popupJs.includes("chrome.runtime.sendMessage"), "Toolbar popup should delegate to background through runtime messaging");
  assert(popupJs.includes('type: "RUN_TOOLBAR_ACTION"'), "Toolbar popup should send RUN_TOOLBAR_ACTION messages");
  assert(popupJs.includes("activeWindowId") && popupJs.includes("activeTabId"), "Toolbar popup should pass active tab/window hints for the user gesture");
  assert(popupJs.includes("chrome.tabs.query({ active: true, lastFocusedWindow: true })"), "Toolbar popup should resolve the active tab from the focused window");
  assert(!popupJs.includes("chrome.sidePanel.open"), "Toolbar popup should not open the side panel directly");
  assert(!popupJs.includes("chrome.tabs.group"), "Toolbar popup should not manipulate tab groups directly");

  for (const action of expectedActions) {
    assert(backgroundCode.includes(`"${action}"`), `Background toolbar action allowlist should include ${action}`);
  }

  assert(backgroundCode.includes("const TOOLBAR_ACTIONS = new Set"), "Background should keep a toolbar action allowlist");
  assert(backgroundCode.includes("Unsupported toolbar action"), "Background should reject unsupported toolbar actions");
  assert(backgroundCode.includes('message.type === "RUN_TOOLBAR_ACTION"'), "Background should handle RUN_TOOLBAR_ACTION");
  assert(backgroundCode.includes('chrome.runtime.getURL("dashboard.html")'), "Dashboard toolbar action should open the dashboard page");
  assert(backgroundCode.includes('source: "toolbar-menu"'), "Smart Organize should run through the toolbar-menu organize source");
  assert(backgroundCode.includes("await openSidePanelForWindow(activeWindowId)"), "Toolbar side-panel actions should open the side panel through the background service worker");
  assert(backgroundCode.includes('action === "vertical-tabs" ? "vertical_tabs" : "agent"'), "Vertical Tabs should switch the sidebar mode instead of starting organize");
});

test("UI i18n references resolve to locale messages", () => {
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const i18nJs = fs.readFileSync(path.join(EXTENSION_DIR, "i18n.js"), "utf8");
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

  assert(i18nJs.includes("_locales/en/messages.json"), "Visible extension pages should load English UI copy");
  assert(i18nJs.includes('document.documentElement.lang = "en"'), "Visible extension pages should declare English UI language");
  assert(!i18nJs.includes("startsWith(\"zh\")"), "Visible extension pages should not switch copy based on Chinese browser locale in the MVP");
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
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const css = fs.readFileSync(path.join(EXTENSION_DIR, "styles.css"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));

  assert(sidepanelHtml.includes("tab-agent-shell"), "Sidepanel should use the Tab Agent layout shell");
  assert(sidepanelHtml.includes("agent-thread"), "Sidepanel should render a conversation thread");
  assert(sidepanelHtml.includes("agent-composer"), "Sidepanel should use a bottom chat composer");
  assert(sidepanelHtml.includes('id="chatPanel" class="chat-panel"'), "Chat thread should not be wrapped in a separate result card");
  assert(sidepanelHtml.includes("agent-primary-message") && sidepanelHtml.includes("hidden"), "Legacy result containers should stay hidden from the default chat surface");
  assert(!/id="statusPanel" class="[^"]*(^|\s)agent-message(\s|")/.test(sidepanelHtml), "Status should not render as a separate top card");
  assert(!sidepanelJs.includes("status-panel agent-message agent-message-system"), "Status renderer must not re-add a standalone card class");
  assert(!sidepanelHtml.includes('data-i18n="tabAgentTitle"'), "Sidepanel should not show a visible Tab Agent title");
  assert(sidepanelHtml.includes('id="dashboardTopButton"'), "Sidepanel should expose Dashboard as a top-right icon button");
  assert(!sidepanelHtml.includes('id="scanButton"'), "Sidepanel should not keep the old header refresh button");
  assert(sidepanelJs.includes('dashboardTopButton.addEventListener("click", () => openDashboard())'), "Top-right Dashboard button should open Dashboard");
  assert(sidepanelHtml.includes('data-i18n-aria-label="ask"'), "Chat send action should read like a conversation, not a settings preview");
  assert(sidepanelHtml.indexOf("agent-thread") < sidepanelHtml.indexOf("chatForm"), "Conversation should sit before the composer");
  assert(
    sidepanelHtml.indexOf('class="chat-form agent-composer"') < sidepanelHtml.indexOf('id="agentContextBar"') &&
      sidepanelHtml.indexOf('id="agentContextBar"') < sidepanelHtml.indexOf('id="chatInput"'),
    "Active chat context should live inside the bottom composer before the input"
  );
  assert(css.includes(".tab-agent-shell .chat-panel") && css.includes("overflow: visible;"), "Sidepanel should keep one scroll container instead of nesting chatPanel scrolling inside agent-thread");
  assert(sidepanelJs.includes('const agentThread = document.querySelector(".agent-thread")'), "Sidepanel should scroll the real conversation container");
  assert(sidepanelJs.includes("scrollAgentThreadToBottom"), "Sidepanel should keep long conversations anchored to the latest message");
  assert(sidepanelJs.includes("CHAT_THREAD_LIMIT = 22"), "Sidepanel should retain enough visible chat history for ten Q/A turns");
  assert(sidepanelJs.includes('agentThread.classList.toggle("long-chat"'), "Sidepanel should use a denser long-chat view after several turns");
  assert(sidepanelHtml.includes('class="prompt-row"') && sidepanelHtml.includes("hidden"), "Suggested refinements should not crowd the default chat surface");
  assert(!sidepanelHtml.includes('data-i18n="browserResult"'), "Sidepanel should not expose a dashboard-like Browser Result section");
  assert(sidepanelHtml.includes('<details class="glass-details sidepanel-details" hidden>'), "Technical browser lists should be hidden from the default chat surface");
  assert(!sidepanelHtml.includes("next-card"), "Sidepanel should not expose internal next-build QA copy");
  assert(sidepanelJs.includes("function getCompletedAgentReply"), "Completed organize output should render as one assistant reply text");
  assert(sidepanelJs.includes("completedAgentReply"), "Completed organize output should use localized assistant prose");
  assert(sidepanelJs.includes("function renderLatestRunMessage"), "Latest organize output should be rendered into the chat thread");
  assert(sidepanelJs.includes("function upsertSystemChatMessage"), "Latest organize output should update as a chat assistant message");
  assert(sidepanelJs.includes("function renderRunMessageCard"), "Latest organize output should use the shared AI message card markup");
  assert(sidepanelJs.includes("run-message-card"), "Latest organize output should appear as an AI message card");
  assert(sidepanelJs.includes("function renderClassificationInsights"), "Latest organize output should render classification refinement insights");
  assert(sidepanelJs.includes("classification-refinements"), "Classification refinements should stay inside the assistant message card");
  assert(sidepanelJs.includes("mergeSuggestions"), "Classification refinements should render merge suggestions");
  assert(backgroundCode.includes("function buildClassificationInsights"), "Background should build classification refinement insights");
  assert(backgroundCode.includes("function buildLocalClassificationMergeSuggestions"), "Background should build local merge refinement suggestions");
  assert(css.includes(".classification-refinements"), "Classification refinements should have scoped styling");
  assert(sidepanelJs.includes('status: `run-${status}`'), "Latest organize output should get a chat message status class");
  assert(sidepanelJs.includes("chatMessages.push(message)"), "Latest organize output should stay in chronological chat order");
  assert(sidepanelJs.includes("function parseAgentCommand"), "Sidepanel chat should route direct agent commands");
  assert(sidepanelJs.includes("let chatMessages = []"), "Sidepanel should keep an ephemeral chat message thread");
  assert(sidepanelJs.includes("appendUserChatMessage(text)"), "Sidepanel should render user messages in the chat thread");
  assert(sidepanelJs.includes("function runQuickChatCommand"), "Sidepanel quick actions should enter the chat thread");
  assert(!sidepanelHtml.includes('id="summaryButton"'), "Sidepanel should not expose a separate Ask page button");
  assert(sidepanelHtml.includes('id="agentContextBar"'), "Sidepanel composer should show the active chat context");
  assert(sidepanelJs.includes("SIDEBAR_CONTEXT_KEY"), "Sidepanel should read shared Dashboard chat context");
  assert(sidepanelJs.includes("context: getAIAgentContextPayload()"), "AI Agent calls should carry the current sidebar context");
  assert(sidepanelJs.includes("function buildAIAgentConversationHistory"), "Sidepanel should build short-term Agent conversation context");
  assert(sidepanelJs.includes("conversationHistory"), "Sidepanel should send short-term conversation context to the AI Agent");
  assert(sidepanelJs.includes("AI_AGENT_CONVERSATION_LIMIT = 4"), "Sidepanel should cap Agent conversation context to four turns");
  assert(sidepanelJs.includes('"selected_tabs"'), "Sidebar context should support selected-tab chat scope");
  assert(sidepanelJs.includes("function shouldRouteContextTabsQuestion"), "Sidebar should route group/selected-tab deep questions");
  assert(sidepanelJs.includes("function shouldRouteContextTabsFollowUp"), "Sidebar should route natural follow-ups back to group/selected-tabs context");
  assert(sidepanelJs.includes("function isExplicitContextTabsManagementQuestion"), "Context-tabs follow-ups should avoid the over-broad generic tab-management guard");
  assert(sidepanelJs.includes("function shouldRouteAgentWebSearch"), "Sidebar should route explicit web search requests as an internal Agent tool");
  assert(sidepanelJs.includes("search_web_provider"), "Sidebar web search should use the Agent search tool contract");
  assert(sidepanelJs.includes('type: "RUN_AGENT_WEB_SEARCH"'), "Sidebar should execute web search through the internal Agent tool executor");
  assert(sidepanelJs.includes('status: "web-search"'), "Sidebar should render successful web search as an assistant message card");
  assert(sidepanelJs.includes("web-search-sources"), "Web search should render sources as a lightweight assistant attachment");
  assert(sidepanelJs.includes("function renderWebSearchSource"), "Web search sources should use a compact source renderer");
  assert(sidepanelJs.includes("agentWebSearchNeedsProvider"), "Sidebar should explain provider setup when web search is not configured");
  assert(sidepanelJs.includes('status: "search-provider-needed"'), "Sidebar should render missing search setup as a natural assistant message");
  assert(sidepanelJs.includes('data-chat-action="open-search-settings"'), "Missing search setup should offer a minimal settings path");
  assert(sidepanelJs.includes("toolCardSearchWeb"), "Sidebar should render web search as a tool-card state");
  assert(sidepanelJs.includes("await summarizeContextTabs(text)"), "Group/selected-tab questions should trigger context tab reading");
  assert(sidepanelJs.includes('type: "SUMMARIZE_CONTEXT_TABS"'), "Sidebar should call the background context-tabs agent flow");
  assert(sidepanelJs.includes("contextConversationHistory"), "Context-tab requests should send short local context conversation history");
  assert(sidepanelJs.includes("function buildContextTabsChatHistory"), "Sidebar should build short local context-tabs conversation history");
  assert(sidepanelJs.includes("function rememberContextTabsChatContext"), "Sidebar should remember group/selected-tabs chat context in session only");
  assert(sidepanelJs.includes("CONTEXT_TABS_CHAT_CONVERSATION_LIMIT = 20"), "Context-tabs chat should cap history to ten Q/A turns");
  assert(sidepanelJs.includes("chrome.permissions.request"), "Context tab reads should request optional site access only after the user asks");
  assert(sidepanelJs.includes("chrome.permissions.contains"), "Context tab reads should check existing site access before requesting temporary origins");
  assert(sidepanelJs.includes("chrome.permissions.remove"), "Context tab reads should release optional site access after the answer");
  assert(sidepanelJs.includes("const originsToRequest = []"), "Context tab permission requests should separate newly requested origins");
  assert(sidepanelJs.includes("const alreadyGrantedOrigins = []"), "Context tab permission requests should preserve already-granted origins");
  assert(sidepanelJs.includes("grantedOrigins: granted ? originsToRequest : []"), "Context tab permission cleanup should release only origins granted for this temporary session");
  assert(sidepanelJs.includes("await releaseContextTabOriginPermissions(permissionSession.grantedOrigins)"), "Temporary context tab permissions should be released from the session-owned origin list");
  assert(sidepanelJs.includes("return `${url.protocol}//${url.hostname}/*`;"), "Context tab permission origins should use Chrome match patterns without ports");
  assert(!sidepanelJs.includes("url.port ? `:${url.port}`"), "Context tab permission origins must not include ports in Chrome match patterns");
  assert(sidepanelJs.includes("CONTEXT_TABS_PERMISSION_LIMIT = 6"), "Optional site access should be capped to the beta tab limit");
  assert(sidepanelJs.includes("function isSensitivePermissionTarget"), "Optional site access should skip sensitive targets by default");
  assert(sidepanelJs.includes('status: "tool-card"'), "Context tab reads should first render an Agent tool card");
  assert(sidepanelJs.includes("function renderToolCard"), "Sidebar should render Agent tool cards as chat messages");
  assert(sidepanelJs.includes("function buildContextTabsRunningToolCard"), "Running context tool cards should share one scope-aware builder");
  assert(sidepanelJs.includes("read_selected_tabs_pages"), "Selected-tabs running tool cards should use the selected-tabs tool name");
  assert(sidepanelJs.includes('msg("toolCardReadSelectedTabs")'), "Selected-tabs running tool cards should use selected-tabs copy");
  assert(sidepanelJs.includes("function updateLatestToolCard"), "Sidebar should update the running tool card after extraction");
  assert(sidepanelJs.includes('status: "context-summary"'), "Context tab answers should render as normal assistant messages");
  assert(sidepanelJs.includes("function renderContextTabsSummary"), "Context tab answers should have a simple assistant renderer");
  assert(sidepanelJs.includes("function buildContextTabsSummaryMarkdown"), "Context tab answers should render as Markdown-style assistant text");
  assert(sidepanelJs.includes("context-tabs-message"), "Context tab answers should use the unified assistant answer shape");
  assert(!sidepanelJs.includes("function renderContextGroupSummary"), "Context tab answers should not render a separate group-summary card");
  assert(!sidepanelJs.includes("context-tab-summary-row"), "Context tab answers should not render tab-summary rows by default");
  assert(sidepanelJs.includes("const skippedBreakdown = Array.isArray(toolCard.skippedBreakdown)"), "Tool cards should render skipped reason breakdowns when available");
  assert(sidepanelJs.includes(".map(formatContextSkipBreakdownItem)"), "Tool cards should reuse readable skipped-reason labels");
  assert(backgroundCode.includes("function buildContextGroupSummary"), "Background should build explicit group summary metadata");
  assert(backgroundCode.includes("suggestedNextSteps"), "Group summary should include safe next-step suggestions");
  assert(backgroundCode.includes("Approve Chrome site access for the selected work pages"), "Missing site access should produce a concrete retry next step");
  assert(backgroundCode.includes("function buildContextSkipBreakdown"), "Background should build structured skipped-tab reason counts");
  assert(sidepanelJs.includes("function formatContextSkipBreakdownItem"), "Sidebar should render skipped-tab reason chips");
  assert(sidepanelJs.includes("skipReasonMissingPermission"), "Skipped-tab reason chips should distinguish missing site access from restricted pages");
  assert(sidepanelJs.includes("function shouldRouteContextTabsRegroupQuestion"), "Sidebar should route content regroup requests for selected/group tabs");
  assert(sidepanelJs.includes("await regroupContextTabs(text)"), "Content regroup requests should trigger the regroup agent flow");
  assert(sidepanelJs.includes('type: "REGROUP_CONTEXT_TABS"'), "Sidebar should call the background context regroup agent flow");
  assert(sidepanelJs.includes("function renderRegroupPreview"), "Content regroup previews should render in the assistant message flow");
  assert(sidepanelJs.includes("function buildRegroupPreviewMarkdown"), "Content regroup previews should render proposed groups as Markdown-style assistant text");
  assert(sidepanelJs.includes("content-regroup-message"), "Content regroup previews should avoid nested admin-style group cards");
  assert(backgroundCode.includes('message.type === "REGROUP_CONTEXT_TABS"'), "Background should handle the content regroup agent message");
  assert(backgroundCode.includes("function applyRegroupTabsDraft"), "Background should apply regroup previews only after Apply");
  assert(backgroundCode.includes('draft.type === "regroup_tabs"'), "Chat Apply should route regroup drafts through the Apply-gated path");
  assert(sidepanelJs.includes('includeInAIAgentContext: false'), "Tool-card messages should stay out of chat memory");
  assert(sidepanelJs.includes("PAGE_CHAT_CONVERSATION_LIMIT = 20"), "Current-page chat should cap local page-chat context at ten Q/A turns");
  assert(sidepanelJs.includes("function buildPageChatHistory"), "Current-page chat should build short local Page Agent context");
  assert(sidepanelJs.includes("pageConversationHistory"), "Current-page chat should pass page-chat history to the Page Agent");
  assert(sidepanelJs.includes('status === "summary"'), "Current-page summary messages should be excluded from AI Agent conversation context");
  assert(sidepanelJs.includes("PAGE_CHAT_CONTEXT_TTL_MS"), "Current-page chat should keep only a short-lived local follow-up context");
  assert(sidepanelJs.includes("function shouldRouteCurrentPageQuestion"), "Current-page chat should route explicit page questions without an Ask Page button");
  assert(sidepanelJs.includes("function shouldRouteCurrentPageFollowUp"), "Current-page chat should route natural follow-ups back to page Q&A");
  assert(sidepanelJs.includes("await summarizeCurrentTab(text)"), "Current-page follow-ups should re-read visible text after the user asks");
  assert(sidepanelJs.includes("function summarizeSelectedPageRegion"), "Sidebar should support user-triggered selected-region page context");
  assert(sidepanelJs.includes('type: "SUMMARIZE_PAGE_REGION"'), "Sidebar should call the selected page-region background flow");
  assert(sidepanelJs.includes("isPageRegionCommand(normalized)"), "Selected-region commands should route before broad summary commands");
  assert(sidepanelJs.includes('toolName: "extract_selected_page_region"'), "Selected-region reads should render an explicit Agent tool card");
  assert(backgroundCode.includes('message.type === "SUMMARIZE_PAGE_REGION"'), "Background should handle selected page-region summaries");
  assert(backgroundCode.includes("function pickReadablePageRegion"), "Background should inject a user-click region picker");
  assert(backgroundCode.includes("TabMosaic: click one visible page section"), "Injected region picker should show simple page-local guidance");
  assert(backgroundCode.includes("function captureSelectedRegionScreenshot"), "Selected-region flow should capture only after the user picks a region");
  assert(backgroundCode.includes("chrome.tabs.captureVisibleTab"), "Selected-region screenshot crop should use Chrome's visible-tab capture API");
  assert(backgroundCode.includes("function cropSelectedRegionScreenshot"), "Selected-region screenshot should be cropped before any context metadata is built");
  assert(backgroundCode.includes("fullVisibleTabCaptureDiscarded: true"), "Full visible-tab capture should be discarded after crop");
  assert(backgroundCode.includes("imageDataUploaded: false"), "Selected-region screenshot image bytes must not be uploaded in the text-only Page Agent flow");
  assert(sidepanelJs.includes("isExplicitTabManagementQuestion"), "Current-page follow-ups should not steal explicit tab-management questions");
  assert(sidepanelJs.includes('runQuickChatCommand("restore closed"'), "Restore quick action should route through chat command handling");
  assert(sidepanelJs.includes("function renderChatThread"), "Sidepanel should render a multi-message chat thread");
  assert(sidepanelJs.includes("disableStaleChatDraftButtons"), "Sidepanel should disable stale draft Apply/Cancel buttons");
  assert(sidepanelJs.indexOf("handleAgentCommand(text)") < sidepanelJs.indexOf('type: "PREVIEW_CHAT_REFINE"'), "Direct agent commands should run before chat-refine preview");
  assert(sidepanelJs.includes("function buildReadOnlyAgentAnswer"), "Sidepanel chat should answer read-only result questions");
  assert(sidepanelJs.indexOf("buildReadOnlyAgentAnswer(text, latestRun)") < sidepanelJs.indexOf('type: "PREVIEW_CHAT_REFINE"'), "Read-only agent answers should run before chat-refine preview");
  assert(sidepanelJs.includes("isCapabilityQuestion(normalized)"), "Sidepanel should answer capability/help questions before requiring an organize run");
  assert(sidepanelJs.includes("isNextStepQuestion(normalized)"), "Sidepanel should answer next-step questions from latest run state");
  assert(sidepanelJs.includes("function buildNextStepAnswer"), "Sidepanel agent should build local next-step recommendations");
  assert(sidepanelJs.includes("function isOptimizationQuestion"), "Sidepanel agent should recognize optimization and memory-relief questions");
  assert(sidepanelJs.includes("function buildOptimizationAnswer"), "Sidepanel agent should answer optimization and memory-relief questions locally");
  assert(sidepanelJs.includes('status: "optimization"'), "Optimization answer should render as a dedicated agent card");
  assert(sidepanelJs.includes("function renderOptimizationCard"), "Sidepanel should render optimization answers inside an assistant message");
  assert(sidepanelJs.includes("buildOptimizationActions"), "Optimization answer should expose safe next-step actions");
  assert(sidepanelJs.includes('data-chat-action="quick-command"'), "Optimization action buttons should route through chat commands");
  assert(sidepanelJs.includes('data-command="${escapeHtml(action.command)}"'), "Optimization action buttons should carry explicit commands");
  assert(sidepanelJs.indexOf("isOptimizationQuestion(normalized)") < sidepanelJs.indexOf("isDuplicateQuestion(normalized)"), "Optimization answers should win over broad duplicate/memory matching");
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
  assert(sidepanelJs.includes("干嘛|做什么|有什么用"), "Natural Chinese current-page questions should route to current-page chat");
  assert(sidepanelJs.includes("有什么内容|包含什么|显示什么"), "Chinese current-page content questions should route to current-page chat");
  assert(sidepanelJs.includes("what is this page (for|about)"), "Natural English current-page questions should route to current-page chat");
  assert(sidepanelJs.includes("what (content|information)"), "English current-page content questions should route to current-page chat");
  assert(sidepanelJs.includes("what about|how about"), "Natural English current-page follow-ups should route to current-page chat");
  assert(sidepanelJs.includes("what are|what is"), "Natural English current-page follow-up questions should route to current-page chat");
  assert(sidepanelJs.includes("还有|那|然后呢"), "Natural Chinese current-page follow-ups should route to current-page chat");
  assert(sidepanelJs.includes("function renderChatSummary"), "Current-page summary should render as a chat message");
  assert(sidepanelJs.includes('status: "summary"'), "Summary rendering should use the chat panel summary state");
  assert(sidepanelJs.includes('summary?.status === "loading"'), "Current-page loading states should be replaceable chat messages");
  assert(sidepanelJs.includes("summaryPanel.hidden = true"), "Legacy summary panel should stay hidden when summary is mirrored into chat");
  assert(sidepanelJs.includes("await organizeNow()"), "Chat command should support organize again");
  assert(sidepanelJs.includes("await undoLast()"), "Chat command should support Undo");
  assert(sidepanelJs.includes("await restoreClosed()"), "Chat command should support Restore Closed");
  assert(sidepanelJs.includes("await openDashboard()"), "Chat command should support opening Dashboard");
  assert(sidepanelJs.includes("await saveCurrentWorkspace()"), "Chat command should support local workspace save");
  assert(sidepanelJs.includes("isSaveWorkspaceCommand(normalized)"), "Save workspace commands should be recognized before chat refine");
  assert(sidepanelJs.includes('type: "SAVE_CURRENT_WORKSPACE"'), "Sidepanel save workspace should use the background action");
  assert(sidepanelJs.includes("AGENT_TASKS_KEY"), "Sidepanel should write local Browser Work Queue todos");
  assert(sidepanelJs.includes("function isCreateTodoCommand"), "Sidepanel should recognize natural-language todo commands");
  assert(sidepanelJs.includes("await createTodoFromSidebarContext(text)"), "Todo commands should create work items from the active Sidebar context");
  assert(sidepanelJs.includes('status: "todo-created"'), "Created todos should render as a normal assistant message");
  assert(sidepanelJs.includes("Stored locally with tab metadata only") || en.agentTodoStoredLocally?.message.includes("tab metadata"), "Todo creation should disclose local metadata-only storage");
  assert(sidepanelJs.includes("function isCreatePageTodoCommand"), "Sidepanel should recognize current-page checklist todo commands");
  assert(sidepanelJs.includes("await createChecklistTodoFromCurrentPage(text)"), "Current-page checklist todos should run through the page Agent flow");
  assert(sidepanelJs.includes("buildPageTodoQuestion"), "Current-page todo creation should ask for an execution checklist");
  assert(sidepanelJs.includes("SAVED_COLLECTIONS_KEY"), "Sidebar should be able to save Agent sources as local collections");
  assert(sidepanelJs.includes("function sanitizeSearchResultsForLocalWork"), "Search results should be sanitized before local save/todo actions");
  assert(sidepanelJs.includes('data-chat-action="save-search-result"'), "Search result sources should offer local save");
  assert(sidepanelJs.includes('data-chat-action="todo-search-result"'), "Search result sources should offer create todo");
  assert(sidepanelJs.includes("function shouldRoutePastedLinks"), "Sidebar should recognize pasted links as browser work objects");
  assert(sidepanelJs.includes('status: "link-detected"'), "Pasted links should render as a normal assistant message");
  assert(sidepanelJs.includes("I did not open or fetch the page") || en.agentLinksNoFetch?.message.includes("did not open or fetch"), "Link understanding should disclose no silent fetch");
  assert(dashboardJs.includes("renderBrowserWorkSourcePreview"), "Dashboard Work Queue should render saved sources");
  assert(dashboardJs.includes("renderBrowserWorkChecklistPreview"), "Dashboard Work Queue should render checklist previews");
  assert(sidepanelJs.includes("function askMetadataAgent"), "Sidepanel should fall back to metadata-only AI Agent answers");
  assert(sidepanelJs.indexOf('type: "PREVIEW_CHAT_REFINE"') < sidepanelJs.indexOf('type: "ASK_TAB_AGENT"'), "Safe local action drafts should run before AI Agent open answers");
  assert(sidepanelJs.includes("function buildOpenChatFallbackAnswer"), "Open-ended chat fallback should render as a normal assistant answer");
  assert(sidepanelJs.includes("agentChatNeedsOrganize"), "Open-ended chat fallback should explain when tab context is missing");
  assert(sidepanelJs.includes("agentChatNeedsAI"), "Open-ended chat fallback should explain when DeepSeek is needed");
  assert(sidepanelJs.indexOf("await askMetadataAgent(text)") < sidepanelJs.indexOf("buildOpenChatFallbackAnswer(text)"), "Open-ended fallback should run after AI Agent fallback");
  assert(sidepanelJs.includes('status: "ai-agent"'), "AI Agent answers should render as assistant messages");
  assert(sidepanelJs.includes("function renderAIAgentCard"), "AI Agent answers should use a simple assistant message card");
  assert(!sidepanelJs.includes("agentMetadataPrivacy"), "AI Agent answers should not show a per-message privacy footnote in the chat bubble");
  assert(!sidepanelJs.includes("renderAIAgentNextSteps"), "AI Agent answers should not render a separate suggested-next-steps panel");
  assert(!sidepanelJs.includes("function renderAIAgentActions"), "AI Agent open answers should not render action chips");
  assert(!sidepanelJs.includes("getAIAgentActionLabel"), "AI Agent open answers should not need action-chip labels");
  assert(!sidepanelJs.includes("tabs.length ? renderChatMatchedTabs(tabs, draft.matchedTabCount"), "AI Agent open answers should not render tab rows");
  assert(!sidepanelJs.includes("ask_page: msg"), "AI Agent should not render a separate Ask page chip");
  assert(sidepanelJs.includes("renderQuickCommandActions("), "Safe quick commands should still reuse chat chips where explicitly shown");
  assert(sidepanelJs.includes('response.result?.status === "draft"'), "AI Agent action drafts should render as Apply/Cancel chat drafts");
  assert(sidepanelJs.includes("latestChatDraft = response.result.draft"), "AI Agent action drafts should become the active local draft");
  assert(css.includes(".run-message-card"), "Latest organize message card should have scoped styling");
  assert(css.includes(".run-message-heading"), "Latest organize message heading should have scoped styling");
  assert(css.includes(".tab-agent-shell .chat-panel"), "Chat panel should be a plain message stream in the side panel");
  assert(css.includes(".prompt-row[hidden]"), "Suggested refinement chips should stay hidden by default");
  assert(css.includes(".chat-thread-message.user"), "User chat messages should have scoped styling");
  assert(css.includes(".chat-thread-message.assistant"), "Assistant chat messages should have scoped styling");
  assert(css.includes(".chat-summary-card"), "Current-page summary chat message should have scoped styling");
  assert(css.includes(".ai-agent-card"), "AI Agent answer should remain a simple message card");
  assert(css.includes(".assistant-answer-message"), "Assistant answers should share the unified Markdown message styling");
  assert(css.includes(".web-search-sources"), "Web search sources should have lightweight scoped styling");
  assert(css.includes(".agent-tool-card"), "Agent tool cards should have scoped styling");
  assert(!css.includes(".chat-summary-question"), "Current-page chat should not render a separate question label block");
  assert(!css.includes(".agent-privacy-note"), "AI Agent chat should not carry a per-message privacy footnote style");
  assert(css.includes(".agent-context-bar"), "Composer context status should have scoped styling");
  assert(css.includes('grid-template-areas:') && css.includes('"context context"') && css.includes('"input send"'), "Composer should stack context above the input row");
  assert(css.includes(".tab-agent-shell .agent-composer .agent-context-bar"), "Composer context row should be scoped inside the chat composer");
  assert(css.includes(".tab-agent-shell .agent-composer .agent-context-label::after"), "Composer context row should visually separate scope and target");
  assert(sidepanelJs.includes("function getCompactCurrentTabContextName"), "Current-tab context should use a compact display name");
  assert(sidepanelJs.includes("formatSidebarHostname(context.hostname)"), "Current-tab context should prefer a short site label over the full page title");
  assert(sidepanelJs.includes("getSidebarContextFullName(normalized)"), "Current-tab full page title should remain available as tooltip context");
  assert(css.includes("Chat UX v0.168: stacked context composer"), "Sidebar should keep the stacked context composer polish");
  assert(css.includes("grid-area: context") && css.includes("border-bottom: 1px solid"), "Composer context should be a top row, not an inline input prefix");
  assert(css.includes("grid-area: input") && css.includes("grid-area: send"), "Composer input and send button should sit below the context row");
  assert(css.includes(".tab-agent-shell .agent-composer .agent-context-dot") && css.includes("display: block"), "Composer context row should keep a subtle active-context indicator");
  assert(css.includes("overflow-x: hidden") && css.includes("overscroll-behavior-x: none"), "Sidebar chat should prevent horizontal drift in long conversations");
  assert(css.includes("max-height: none") && css.includes("overflow: visible"), "Sidebar chat panel should remain a plain message stream, not a nested scroll panel");
  assert(sidepanelJs.includes("agentThread.scrollLeft = 0"), "Sidebar chat auto-scroll should keep horizontal scroll pinned to zero");
  assert(sidepanelJs.includes("function resetHorizontalScroll") && sidepanelJs.includes("document.scrollingElement.scrollLeft = 0"), "Sidebar should prevent document-level horizontal drift");
  assert(css.includes(".tab-agent-shell .chat-thread-message.assistant.tool-card"), "Tool-card messages should visually read as assistant state");
  assert(css.includes(".chat-thread-message.assistant.tool-card") && css.includes("background: transparent"), "Tool-card message wrapper should not look like a standalone panel");
  assert(css.includes(".agent-tool-card") && css.includes("display: inline-flex"), "Tool-card content should render as a lightweight inline status");
  assert(css.includes("backdrop-filter: blur"), "Minimal UI should use glass blur styling");
  assert(en.openDashboard?.message && zh.openDashboard?.message, "Header Dashboard action should be localized");
  assert(en.contextCurrentTab?.message && zh.contextCurrentTab?.message, "Sidebar context copy should be localized");
  assert(en.contextSelectedTabs?.message && zh.contextSelectedTabs?.message, "Selected-tabs context copy should be localized");
  assert(en.readingContextTabs?.message && zh.readingContextTabs?.message, "Context-tabs loading copy should be localized");
  assert(en.toolCardReadGroupPages?.message && zh.toolCardReadGroupPages?.message, "Tool-card title should be localized");
  assert(en.toolCardReadSelectedTabs?.message && zh.toolCardReadSelectedTabs?.message, "Selected-tabs tool-card title should be localized");
  assert(en.toolCardSelectPageRegion?.message && zh.toolCardSelectPageRegion?.message, "Selected-region tool-card title should be localized");
  assert(en.toolCardDataVisibleText?.message && zh.toolCardDataVisibleText?.message, "Tool-card data disclosure should be localized");
  assert(en.toolCardDataSelectedRegion?.message && zh.toolCardDataSelectedRegion?.message, "Selected-region data disclosure should be localized");
  assert(en.toolCardStorageSessionOnly?.message && zh.toolCardStorageSessionOnly?.message, "Tool-card storage disclosure should be localized");
  assert(en.toolCardRegionPending?.message && zh.toolCardRegionPending?.message, "Selected-region pending state should be localized");
  assert(en.toolCardRegionSelected?.message && zh.toolCardRegionSelected?.message, "Selected-region completed state should be localized");
  assert(en.agentCommandSummarize?.message && zh.agentCommandSummarize?.message, "Agent command response copy should be localized");
  assert(en.agentCommandSelectRegion?.message && zh.agentCommandSelectRegion?.message, "Selected-region command response copy should be localized");
  assert(en.agentCommandAskPage?.message && zh.agentCommandAskPage?.message, "Ask-page command response copy should be localized");
  assert(!en.currentPageQuestion && !zh.currentPageQuestion, "Current-page chat should not require a separate question label");
  assert(en.agentCapabilitiesAnswer?.message && zh.agentCapabilitiesAnswer?.message, "Agent capability answer should be localized");
  assert(en.agentNextStepReview?.message && zh.agentNextStepReview?.message, "Agent next-step answer should be localized");
  assert(en.agentOverviewAnswer?.message && zh.agentOverviewAnswer?.message, "Read-only agent answer copy should be localized");
  assert(en.agentOptimizationAnswer?.message && zh.agentOptimizationAnswer?.message, "Agent optimization answer copy should be localized");
  assert(en.agentOptimizationAnswer.message.includes("will not invent a memory number"), "English optimization answer should avoid fake memory precision");
  assert(zh.agentOptimizationAnswer.message.includes("不会编一个内存数字"), "Chinese optimization answer should avoid fake memory precision");
  assert(en.agentReviewDuplicatesAnswer?.message && zh.agentReviewDuplicatesAnswer?.message, "Duplicate review answer copy should be localized");
  assert(en.agentClosedTabsAnswer?.message && zh.agentClosedTabsAnswer?.message, "Closed duplicate answer copy should be localized");
  assert(en.agentActiveTabsAnswer?.message && zh.agentActiveTabsAnswer?.message, "Active-tab answer copy should be localized");
  assert(en.agentProtectedTabsAnswer?.message && zh.agentProtectedTabsAnswer?.message, "Protected-tab answer copy should be localized");
  assert(en.agentReadLaterAnswer?.message && zh.agentReadLaterAnswer?.message, "Read-later answer copy should be localized");
  assert(en.agentFindTabsAnswer?.message && zh.agentFindTabsAnswer?.message, "Tab search answer copy should be localized");
  assert(en.agentCommandSaveWorkspace?.message && zh.agentCommandSaveWorkspace?.message, "Save workspace command copy should be localized");
  assert(en.agentWorkspaceSaved?.message && zh.agentWorkspaceSaved?.message, "Saved workspace result copy should be localized");
  assert(en.agentChatNeedsOrganize?.message && zh.agentChatNeedsOrganize?.message, "Open-ended chat missing-context fallback should be localized");
  assert(en.agentChatNeedsAI?.message && zh.agentChatNeedsAI?.message, "Open-ended chat AI-gated fallback should be localized");
  assert(en.agentChatFallbackAnswer?.message && zh.agentChatFallbackAnswer?.message, "Open-ended chat generic fallback should be localized");
  assert(en.askingAIAgent?.message && zh.askingAIAgent?.message, "Metadata AI Agent loading copy should be localized");
  assert(en.agentAIAnswerFailed?.message && zh.agentAIAnswerFailed?.message, "Metadata AI Agent failure copy should be localized");
  assert(en.moreBrowserDetails?.message && zh.moreBrowserDetails?.message, "Folded detail summary should be localized");
  assert(en.classificationRefinementNote?.message && zh.classificationRefinementNote?.message, "Classification refinement note should be localized");
  assert(en.classificationMergeReason?.message && zh.classificationMergeReason?.message, "Classification merge reason should be localized");
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
    "dashboard-agent-workbench",
    "dashboard-agent-panels",
    "dashboard-filter-chips",
    "dashboard-group-grid",
    "dashboard-details-section"
  ]) {
    assert(dashboardHtml.includes(selector), `Dashboard missing prototype shell class: ${selector}`);
    assert(dashboardCss.includes(`.${selector}`), `Dashboard missing CSS for prototype class: ${selector}`);
  }

  assert(dashboardCss.includes("backdrop-filter: blur"), "Dashboard should use glass blur styling");
  assert(!dashboardHtml.includes('id="dashboardAgentSearchInput"'), "Dashboard should not expose search as a top-level UI control");
  assert(!dashboardHtml.includes("data-agent-search-mode"), "Dashboard should not expose Tabs/Web/Saved search modes");
  assert(!dashboardCss.includes(".dashboard-agent-search"), "Dashboard should not carry a visible search surface");
  assert(dashboardHtml.includes('id="dashboardAgentTasks"'), "Dashboard workbench should include a lightweight task area");
  assert(dashboardHtml.includes('id="dashboardAgentCollections"'), "Dashboard workbench should include a lightweight collections area");
  assert(dashboardJs.includes('data-browser-work-action="focus"'), "Browser work rows should focus linked source tabs");
  assert(dashboardJs.includes('data-browser-work-action="toggle-done"'), "Work Queue todos should support done/reopen");
  assert(dashboardJs.includes('data-browser-work-action="archive"'), "Work Queue todos should support local archive");
  assert(dashboardJs.includes("function updateBrowserWorkTask"), "Work Queue todo changes should persist locally");
  assert(dashboardHtml.includes('id="searchSettingsForm"'), "Dashboard settings should include optional Agent web search BYOK setup");
  assert(dashboardHtml.includes('id="searchKeyInput"'), "Search setup should store a user-provided search key locally");
  assert(dashboardJs.includes("SEARCH_SETTINGS_KEY"), "Dashboard should save Agent web search settings to the existing local search config");
  assert(!dashboardJs.includes("agentSearchProviderBoundary"), "External search disclosure should live in Agent chat, not Dashboard search UI");
  assert(backgroundCode.includes("search_web_provider"), "Agent search should mean provider-backed web search, not Dashboard UI search");
  assert(dashboardJs.includes("sanitizeTabForBrowserWork"), "Dashboard should sanitize tabs before saving tasks or collections");
  assert(!dashboardJs.includes("restoreUrl:") && !dashboardJs.includes("fullUrl:"), "Dashboard work items should not store full restore URLs in the first slice");
  assert(dashboardJs.includes("function renderGroupCard"), "Dashboard should render workbench group cards");
  assert(dashboardJs.includes("function renderGroupTabs"), "Dashboard should render expanded group tab rows");
  assert(dashboardJs.includes("getTabsForGroup"), "Dashboard should connect group cards to local tab rows");
  assert(dashboardJs.includes('details class="dashboard-more-tabs"'), "Dashboard should let users expand hidden tab rows");
  assert(dashboardJs.includes("hiddenTabs.map((tab) => renderGroupTabRow"), "Expanded Dashboard rows should reuse normal tab row actions");
  assert(dashboardJs.includes("function renderTabFavicon"), "Dashboard should render real tab favicons when available");
  assert(dashboardJs.includes("favIconUrl"), "Dashboard tab rows should read favIconUrl from the local snapshot");
  assert(dashboardHtml.includes('id="saveWorkspaceButton"'), "Dashboard should keep workspace save wiring available");
  assert(dashboardHtml.includes('id="saveWorkspaceButton"') && dashboardHtml.includes("disabled hidden"), "Dashboard should hide workspace save from the default commercial UI");
  assert(dashboardHtml.includes('id="saved-workspaces"') && dashboardHtml.includes("hidden"), "Dashboard should hide saved workspaces from the default commercial UI");
  assert(dashboardJs.includes("function renderSavedWorkspaces"), "Dashboard should render saved local workspace snapshots");
  assert(dashboardCss.includes(".dashboard-favicon img"), "Dashboard should style favicon image assets");
  assert(dashboardCss.includes(".dashboard-workspace-row"), "Dashboard should style saved workspace rows");
  assert(dashboardCss.includes(".dashboard-more-tabs"), "Dashboard expandable tab rows should have scoped styling");
  assert(
    dashboardCss.includes("grid-template-columns: auto auto minmax(0, 1fr) minmax(92px, auto)"),
    "Dashboard tab rows should keep checkbox, favicon, title, and action columns aligned"
  );
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
  assert(dashboardJs.includes("RESTORE_SAVED_WORKSPACE"), "Dashboard should support restoring a local workspace snapshot");
  assert(dashboardJs.includes("restoreWorkspaceConfirm"), "Dashboard should confirm before restoring a local workspace snapshot");
  assert(dashboardJs.includes('data-workspace-action="restore"'), "Saved workspace rows should expose a restore action");
  assert(dashboardJs.includes("deleteWorkspaceConfirm"), "Dashboard should confirm before deleting a local workspace snapshot");
  assert(dashboardJs.includes('data-workspace-action="delete"'), "Saved workspace rows should expose a delete action");
  assert(en.savedWorkspacesCopy?.message.includes("Local snapshots only"), "English saved workspace copy should set local-only scope");
  assert(zh.savedWorkspacesCopy?.message.includes("仅本地快照"), "Chinese saved workspace copy should set local-only scope");
  assert(en.restoreWorkspaceConfirm?.message.includes("will not reopen closed pages"), "English restore workspace confirm should state restore limits");
  assert(zh.restoreWorkspaceConfirm?.message.includes("不会重新打开已关闭网页"), "Chinese restore workspace confirm should state restore limits");
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

test("saved workspace restore regroups only still-open local tab ids", async () => {
  const originalStorageLocal = context.chrome.storage.local;
  const originalTabs = context.chrome.tabs;
  const originalTabGroups = context.chrome.tabGroups;
  const originalWindows = context.chrome.windows;
  const originalRuntimeSendMessage = context.chrome.runtime.sendMessage;
  const setValues = [];
  const groupUpdates = [];
  const currentTabs = [
    {
      id: 101,
      windowId: 1,
      index: 0,
      title: "Planning doc",
      url: "https://docs.example/planning",
      groupId: 900,
      active: false,
      pinned: false,
      audible: false,
      discarded: false,
      incognito: false
    },
    {
      id: 102,
      windowId: 1,
      index: 1,
      title: "Planning issue",
      url: "https://github.com/acme/project/issues/1",
      groupId: -1,
      active: true,
      pinned: false,
      audible: false,
      discarded: false,
      incognito: false
    },
    {
      id: 103,
      windowId: 1,
      index: 2,
      title: "Pinned billing",
      url: "https://billing.example/account",
      groupId: -1,
      active: false,
      pinned: true,
      audible: false,
      discarded: false,
      incognito: false
    }
  ];
  let currentGroups = [
    {
      id: 900,
      windowId: 1,
      title: "Old Group",
      color: "grey",
      collapsed: false
    }
  ];
  let nextGroupId = 1000;

  context.chrome.storage.local = {
    async get(keys) {
      assert(Array.isArray(keys), "Workspace restore should read current run and saved workspace storage together");
      return {
        "tabmosaic.currentRun": {
          status: "completed",
          summary: {
            tabCount: 3,
            groupCount: 1,
            windowCount: 1
          },
          groups: []
        },
        "tabmosaic.savedWorkspaces": [
          {
            id: "ws_restore",
            name: "Planning Workspace",
            groups: [
              {
                id: 11,
                windowId: 1,
                name: "Planning",
                color: "blue",
                tabIds: [101, 102, 999]
              },
              {
                id: 12,
                windowId: 1,
                name: "Billing",
                color: "yellow",
                tabIds: [103]
              }
            ],
            tabs: [
              { id: 101, windowId: 1, title: "Planning doc", hostname: "docs.example", groupId: 11 },
              { id: 102, windowId: 1, title: "Planning issue", hostname: "github.com", groupId: 11 },
              { id: 103, windowId: 1, title: "Pinned billing", hostname: "billing.example", groupId: 12 },
              { id: 999, windowId: 1, title: "Closed tab", hostname: "closed.example", groupId: 11 }
            ]
          }
        ]
      };
    },
    async set(value) {
      setValues.push(value);
    },
    async remove() {
      throw new Error("Workspace restore should not delete local storage");
    }
  };
  context.chrome.windows = {
    async getAll() {
      return [
        {
          id: 1,
          focused: true,
          state: "normal",
          incognito: false,
          tabs: currentTabs
        }
      ];
    }
  };
  context.chrome.tabGroups = {
    async query() {
      return currentGroups;
    },
    async update(groupId, update) {
      groupUpdates.push({ groupId, update });
      const group = currentGroups.find((item) => item.id === groupId);
      if (group) {
        Object.assign(group, update);
      }
    }
  };
  context.chrome.tabs = {
    async ungroup(tabIds) {
      for (const tabId of Array.isArray(tabIds) ? tabIds : [tabIds]) {
        const currentTab = currentTabs.find((item) => item.id === tabId);
        if (currentTab) currentTab.groupId = -1;
      }
    },
    async group({ tabIds }) {
      const groupId = nextGroupId++;
      for (const tabId of tabIds) {
        const currentTab = currentTabs.find((item) => item.id === tabId);
        if (currentTab) currentTab.groupId = groupId;
      }
      currentGroups = currentGroups.filter((group) => group.id !== 900);
      currentGroups.push({
        id: groupId,
        windowId: 1,
        title: "",
        color: "grey",
        collapsed: false
      });
      return groupId;
    },
    async remove() {
      throw new Error("Workspace restore must not close tabs");
    },
    async create() {
      throw new Error("Workspace restore must not reopen tabs without saved full URLs");
    }
  };
  context.chrome.runtime.sendMessage = async () => {};

  try {
    const result = await context.restoreSavedWorkspace({ workspaceId: "ws_restore" });

    assertEqual(result.restoredTabs, 2, "Workspace restore should restore only open unprotected tabs");
    assertEqual(result.restoredGroups, 1, "Workspace restore should create one group for restorable tabs");
    assertEqual(result.skippedTabs, 2, "Workspace restore should skip closed or protected tabs");
    assertEqual(result.run.source, "workspace-restore", "Workspace restore run source");
    assertEqual(result.run.summary.undoAvailable, true, "Workspace restore should be undoable");
    assertEqual(currentTabs.find((item) => item.id === 101).groupId, 1000, "First open tab restored to new group");
    assertEqual(currentTabs.find((item) => item.id === 102).groupId, 1000, "Second open tab restored to new group");
    assertEqual(currentTabs.find((item) => item.id === 103).groupId, -1, "Pinned saved tab should stay ungrouped");
    assertDeepEqual(groupUpdates[0].update, {
      title: "Planning",
      color: "blue",
      collapsed: false
    }, "Restored workspace group metadata");
    assert(setValues.some((value) => value["tabmosaic.lastUndo"]), "Workspace restore should store an undo snapshot first");
    assert(setValues.some((value) => value["tabmosaic.currentRun"]?.source === "workspace-restore"), "Workspace restore should publish a run");
    assert(!JSON.stringify(setValues).includes("https://closed.example"), "Workspace restore should not persist full URLs");
  } finally {
    context.chrome.storage.local = originalStorageLocal;
    context.chrome.tabs = originalTabs;
    context.chrome.tabGroups = originalTabGroups;
    context.chrome.windows = originalWindows;
    context.chrome.runtime.sendMessage = originalRuntimeSendMessage;
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
  assert(dashboardJs.includes("SIDEBAR_CONTEXT_KEY"), "Dashboard tab/group clicks should share context with the Sidebar");
  assert(dashboardJs.includes("function buildSidebarTabContext"), "Dashboard should build current-tab Sidebar context");
  assert(dashboardJs.includes("function buildSidebarGroupContext"), "Dashboard should build current-group Sidebar context");
  assert(dashboardJs.includes("chrome.sidePanel.open"), "Dashboard should try to open the linked Sidebar context");
  assert(dashboardCss.includes(".dashboard-tab-title-button"), "Dashboard tab title focus control should have scoped styling");
  assert(dashboardCss.includes(".dashboard-group-card.context-active"), "Dashboard selected groups should have light context styling");
  assert(backgroundCode.includes("FOCUS_DASHBOARD_TAB"), "Background should handle Dashboard tab focus");
  assert(backgroundCode.includes("chrome.tabs.update(tabId, { active: true })"), "Background should activate the requested tab");
  assert(backgroundCode.includes("chrome.windows.update(tab.windowId, { focused: true })"), "Background should focus the tab window");
  assert(!dashboardJs.includes("chrome.tabs.remove"), "Dashboard tab focus UI must not close tabs");
  assert(en.openTab?.message && zh.openTab?.message, "Dashboard tab focus copy should be localized");
});

test("dashboard selected tabs open Sidebar Agent context", () => {
  const dashboardHtml = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.html"), "utf8");
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const dashboardCss = fs.readFileSync(path.join(EXTENSION_DIR, "styles.css"), "utf8");
  const screenshotTool = fs.readFileSync(path.join(ROOT_DIR, "tools", "capture_ui_screenshots.js"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));

  assert(dashboardHtml.includes('id="chatSelectedTabsButton"'), "Dashboard should expose a selected-tabs chat action");
  assert(dashboardHtml.includes('id="chatSelectedTabsButton"') && dashboardHtml.includes("disabled") && dashboardHtml.includes("hidden"), "Selected-tabs chat action should stay hidden until useful");
  assert(dashboardJs.includes("let selectedDashboardTabIds = new Set()"), "Dashboard should keep selected tab state locally");
  assert(dashboardJs.includes('data-tab-select'), "Dashboard tab rows should expose a checkbox selection control");
  assert(dashboardJs.includes("function buildSidebarSelectedTabsContext"), "Dashboard should build selected-tabs Sidebar context");
  assert(dashboardJs.includes('scope: "selected_tabs"'), "Dashboard selected-tabs context should preserve selected-tabs scope");
  assert(dashboardJs.includes('["current_tab", "current_group", "selected_tabs"]'), "Dashboard context sanitizer should allow selected-tabs scope");
  assert(dashboardJs.includes("chatWithSelectedDashboardTabs"), "Dashboard should open Sidebar from selected tabs");
  assert(dashboardJs.includes("openSidebarForDashboardContext(windowId)"), "Selected-tabs chat should open the linked Sidebar window");
  assert(dashboardJs.includes("selectedWindowId !== nextWindowId"), "Dashboard should keep selected-tabs chat scoped to one window at a time");
  assert(dashboardJs.includes('msg("selectedTabsWindowReset")'), "Dashboard should explain when selected-tabs context moves to another window");
  assert(dashboardJs.includes("showDashboardSelectionNotice"), "Dashboard should render a lightweight selected-tabs reset notice");
  assert(dashboardJs.includes('dataset.statusScope = "selection"'), "Dashboard selected-tabs reset notice should be scoped as a selection status");
  assert(dashboardCss.includes(".dashboard-tab-select"), "Selected-tabs checkbox should have scoped Dashboard styling");
  assert(dashboardCss.includes(".dashboard-tabrow.selected-for-chat"), "Selected tab rows should have a subtle selected state");
  assert(dashboardCss.includes('.dashboard-chip-status[data-status-scope="selection"]'), "Selected-tabs reset notice should reuse compact Dashboard chip styling");
  assert(screenshotTool.includes("dashboard-selected-tabs.png"), "UI screenshots should cover Dashboard selected-tabs state");
  assert(screenshotTool.includes("#chatSelectedTabsButton:not([hidden])"), "Dashboard selected-tabs screenshot should wait for the linked Agent action");
  assert(!dashboardJs.includes("SUMMARIZE_CONTEXT_TABS"), "Dashboard selection must not read page text directly");
  assert(!dashboardJs.includes("chrome.tabs.remove"), "Dashboard selected-tabs chat must not close tabs");
  assert(en.chatSelectedTabs?.message && zh.chatSelectedTabs?.message, "Selected-tabs chat copy should be localized");
  assert(en.selectedTabsWindowReset?.message && zh.selectedTabsWindowReset?.message, "Selected-tabs cross-window reset copy should be localized");
  assert(en.selectTabForChat?.message && zh.selectTabForChat?.message, "Selected-tabs checkbox copy should be localized");
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

test("dashboard keeps MVP UI simple and hides advanced settings from the default view", () => {
  const dashboardHtml = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.html"), "utf8");
  const dashboardCss = fs.readFileSync(path.join(EXTENSION_DIR, "styles.css"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));

  assert(!dashboardHtml.includes("P1"), "Dashboard should not expose unwired P1 placeholders in the default UI");
  assert(!dashboardHtml.includes("disabled data-i18n"), "Dashboard should avoid disabled placeholder buttons");
  assert(dashboardHtml.includes('data-page="rules" hidden'), "Dashboard should hide Auto Organize from the default commercial UI");
  assert(dashboardHtml.includes('data-page="settings" hidden'), "Dashboard should hide Settings from the default commercial UI");
  assert(dashboardHtml.includes('id="organizeNowButton"') && dashboardHtml.includes('data-i18n="organizeBrowser" hidden'), "Dashboard should hide Organize Browser from the default commercial UI");
  assert(dashboardHtml.includes('id="workspaceRefreshButton"') && dashboardHtml.includes('data-i18n="refresh" hidden'), "Dashboard should hide Refresh from the default commercial UI");
  assert(dashboardCss.includes("[hidden]") && dashboardCss.includes("display: none !important"), "Hidden Dashboard controls should not be revived by component display styles");
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
    "Tab Agent Chat UI",
    "Latest organize result appears as one assistant message bubble",
    "The bottom composer remains visible and works like a normal chat input.",
    "Asking how much memory was saved returns an honest optimization answer without invented exact MB.",
    "Sidebar Tab Agent completion message lightly mentions DeepSeek help or local fallback.",
    "Ask the Sidebar Agent to move Chrome extension docs tabs into Extension Planning",
    "The AI move draft updates real Chrome native tab groups only after Apply and does not close tabs.",
    "CONTEXT_FIXTURE_HOST",
    "tabmosaic-manual.test",
    "Context Fixture Guide",
    "data-copy-context-prompt",
    "Copy Selected-Tabs Prompt",
    "Mention ORBITALPLANNING, BUGLANTERN, and GLASSHARBOR",
    "--keep-fixture-server",
    "waitForFixtureServerShutdown",
    "Keeps the local fixture server alive only for tabmosaic-manual.test until you press Ctrl+C.",
    "Manual QA fixture tab rows",
    "ORBITALPLANNING",
    "BUGLANTERN",
    "GLASSHARBOR",
    "rerun with --keep-fixture-server",
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

test("AI provider permissions support BYOK hosts without broad required host permissions", () => {
  const dashboardJs = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.js"), "utf8");
  const dashboardHtml = fs.readFileSync(path.join(EXTENSION_DIR, "dashboard.html"), "utf8");
  const verifier = fs.readFileSync(path.join(ROOT_DIR, "tools", "verify_release_package.js"), "utf8");
  const configTool = fs.readFileSync(path.join(ROOT_DIR, "tools", "write_private_beta_ai_config.js"), "utf8");
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "en", "messages.json"), "utf8"));
  const zh = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, "zh_CN", "messages.json"), "utf8"));
  const allowedHostPermission = "https://api.deepseek.com/*";
  const allowedHost = new URL(allowedHostPermission.replace("*", "")).hostname;

  assertDeepEqual(manifest.host_permissions, [allowedHostPermission], "Default required AI host permission should stay narrow");
  assertDeepEqual(manifest.optional_host_permissions, ["http://*/*", "https://*/*"], "Temporary page-content access and BYOK provider origins should stay optional");
  assert(providerRegistryCode.includes(`DEFAULT_AI_HOSTNAME = "${allowedHost}"`), "Provider registry default AI host should match manifest");
  assert(backgroundSource.includes('from "./provider_registry.js"'), "Background should import shared provider registry");
  assert(dashboardJs.includes('from "./provider_registry.js"'), "Dashboard should import shared provider registry");
  assert(backgroundCode.includes("async function ensureAIProviderPermission"), "Background should require explicit permission for custom AI providers");
  assert(backgroundCode.includes("chrome.permissions.request({ origins: [origin] })"), "Background should request only the configured provider origin");
  assert(dashboardJs.includes("async function ensureAIProviderPermission"), "Dashboard should request custom provider permission from the settings UI");
  assert(dashboardJs.includes("chrome.permissions.request({ origins: [origin] })"), "Dashboard should request only the configured provider origin");
  assert(dashboardHtml.includes('id="aiProviderPresetSelect"'), "Dashboard AI settings should expose provider presets");
  assert(dashboardHtml.includes('id="localModelHelp"'), "Dashboard AI settings should expose local model setup help");
  assert(dashboardHtml.includes('list="aiModelOptions"'), "Dashboard model input should expose provider model suggestions");
  assert(dashboardHtml.includes('id="aiModelOptions"'), "Dashboard should render a model suggestion datalist");
  assert(dashboardJs.includes("function syncLocalModelHelp"), "Dashboard should render local model setup help from preset selection");
  assert(dashboardJs.includes("function updateAIModelOptions"), "Dashboard should update model suggestions from connection results");
  assert(dashboardJs.includes("result.modelSuggestions"), "Dashboard should consume model suggestions returned by the provider test");
  assert(dashboardJs.includes("formatAIConnectionDiagnostics"), "Dashboard should render compact provider connection diagnostics");
  assert(dashboardJs.includes("formatAIConnectionTroubleshooting"), "Dashboard should render provider troubleshooting next steps");
  assert(dashboardJs.includes("buildAIConnectionFailureTroubleshootingCodes"), "Dashboard should render failure-specific AI troubleshooting");
  assert(backgroundCode.includes("buildAIConnectionTroubleshootingCodes"), "Background should return provider troubleshooting codes without extra probes");
  assert(backgroundCode.includes("buildAIConnectionDiagnostics"), "Background should return provider connection diagnostics without extra probes");
  assert(dashboardJs.includes('presetId === "ollama"'), "Dashboard should include Ollama setup guidance");
  assert(dashboardJs.includes('presetId === "lmstudio"'), "Dashboard should include LM Studio setup guidance");
  assert(providerRegistryCode.includes("AI_PROVIDER_PRESETS"), "Provider presets should live in the shared registry");
  assert(providerRegistryCode.includes("AI_PROVIDER_HOST_IDS"), "Provider host labels should live in the shared registry");
  for (const providerToken of [
    "https://api.openai.com/v1",
    "https://openrouter.ai/api/v1",
    "https://generativelanguage.googleapis.com/v1beta/openai",
    "https://api.groq.com/openai/v1",
    "https://api.together.xyz/v1",
    "https://api.mistral.ai/v1",
    "https://api.x.ai/v1",
    "https://api.perplexity.ai",
    "https://api.cerebras.ai/v1",
    "https://api.fireworks.ai/inference/v1",
    "https://api.deepinfra.com/v1/openai",
    "https://api.siliconflow.cn/v1",
    "https://api.moonshot.ai/v1",
    "https://api.minimax.io/v1",
    "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "http://localhost:1234/v1",
    "http://localhost:11434/v1"
  ]) {
    assert(providerRegistryCode.includes(providerToken), `Provider registry should include ${providerToken}`);
  }
  for (const [presetId] of context.AI_PROVIDER_PRESETS || []) {
    assert(dashboardHtml.includes(`value="${presetId}"`), `Dashboard select should expose provider preset ${presetId}`);
  }
  assert(backgroundCode.includes("getOpenAICompatibleModelsUrl"), "Background should support provider-specific model-list endpoints");
  assert(backgroundCode.includes("testOpenAICompatibleChatModel"), "Background should fall back to a synthetic chat ping when /models is unavailable");
  assert(backgroundCode.includes('"Reply with OK."'), "Synthetic chat ping should not contain real tab or page data");
  assertEqual(context.normalizeAIBaseUrl(allowedHostPermission.replace("*", "")), "https://api.deepseek.com", "Background should normalize the manifest host");
  assertEqual(context.normalizeAIBaseUrl("https://api.openai.com/v1/"), "https://api.openai.com/v1", "Background should allow HTTPS OpenAI-compatible providers");
  assertEqual(context.normalizeAIBaseUrl("http://localhost:11434/v1/"), "http://localhost:11434/v1", "Background should allow localhost model endpoints");
  assert(dashboardHtml.includes(`<b>${allowedHostPermission}</b>`), "Dashboard permission copy should show the default AI host permission");
  assert(dashboardHtml.includes("Custom hosts are requested explicitly"), "Dashboard permission copy should explain custom provider origin prompts");
  assert(dashboardHtml.includes('data-i18n="aiBaseUrlBetaLimit"'), "Dashboard AI settings should explain BYOK Base URL boundaries");
  assert(en.aiBaseUrlBetaLimit?.message.includes("OpenAI-compatible"), "English AI Base URL copy should mention OpenAI-compatible providers");
  assert(zh.aiBaseUrlBetaLimit?.message.includes("OpenAI-compatible"), "Chinese AI Base URL copy should mention OpenAI-compatible providers");
  assert(en.providerPreset?.message && en.providerPresetCopy?.message, "English locale should include provider preset copy");
  assert(zh.providerPreset?.message && zh.providerPresetCopy?.message, "Chinese locale should include provider preset copy");
  assert(en.aiConnectionNextSteps?.message && en.aiTroubleshootOllama?.message, "English locale should include AI troubleshooting copy");
  assert(zh.aiConnectionNextSteps?.message && zh.aiTroubleshootOllama?.message, "Chinese locale should include AI troubleshooting copy");
  assert(en.modelSuggestionsCopy?.message && zh.modelSuggestionsCopy?.message, "Model suggestion helper copy should be localized");
  assert(en.aiConnectionDiagnostics?.message && zh.aiConnectionDiagnostics?.message, "AI connection diagnostic copy should be localized");
  assert(en.ollamaSetupTitle?.message && en.lmStudioSetupTitle?.message, "English locale should include local model setup copy");
  assert(zh.ollamaSetupTitle?.message && zh.lmStudioSetupTitle?.message, "Chinese locale should include local model setup copy");
  assert(en.localModelSetupNote?.message.includes("minimized metadata"), "English local model copy should keep the data boundary clear");
  assert(en.apiKeyOptionalLocal?.message.includes("Optional for local endpoints"), "English locale should explain local endpoint keys are optional");
  assert(backgroundCode.includes("private-beta-ai-settings.json"), "Background should support local private-beta AI config for full-flow testing");
  assert(configTool.includes("DEEPSEEK_API_KEY"), "Private beta AI config tool should read the local DeepSeek env key");
  assert(configTool.includes("key was copied") && !configTool.includes("console.log(apiKey"), "Private beta AI config tool must not print the API key");
  assert(verifier.includes("private-beta-ai-settings\\.json"), "Release verifier must reject private beta AI config in package zips");

  try {
    context.normalizeAIBaseUrl("http://api.openai.com/v1");
    assert(false, "Remote HTTP AI providers should fail");
  } catch (error) {
    assert(
      String(error?.message || "").includes("Remote AI provider Base URLs must use HTTPS"),
      "Remote HTTP AI providers should explain HTTPS requirement"
    );
  }
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
      "title-review": 2,
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
  assertEqual(event.duplicateTypes["title-review"], 2, "Duplicate safety title review count");
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
  privateSnapshot.tabs[0].domainDuplicateHash = "domain-secret";
  privateSnapshot.tabs[0].titleDuplicateHash = "title-secret";

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
  assert(!("domainDuplicateHash" in runTab), "Current run snapshot must not keep domain-specific duplicate hash");
  assert(!("titleDuplicateHash" in runTab), "Current run snapshot must not keep title duplicate hash");
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
  const databaseCheck = context.buildSummaryPrivacyCheck(
    { id: 24, title: "Settings | Database | ai-music" },
    context.parseUrl("https://supabase.com/dashboard/project/ai-music/settings/database?token=abc")
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
  const longKeyPoints = context.buildKeyPoints(
    ["搜索热点"],
    [
      "hao123是汇集全网优质网址及资源的中文上网导航及时收录影视音乐小说游戏等分类的网址和内容让您的网络生活更简单精彩上网从hao123开始并继续包含大量热点新闻网址导航娱乐视频财经体育等长文本内容"
    ]
  );
  const chromePageReason = context.buildUnsupportedPageReadReason(context.parseUrl("chrome://extensions"));
  const sitePermissionReason = context.buildScriptInjectionReadReason(
    new Error('Cannot access contents of url "https://example.com/". Extension manifest must request permission to access this host.'),
    context.parseUrl("https://example.com/")
  );
  const protectedPageReason = context.buildScriptInjectionReadReason(
    new Error("The extensions gallery cannot be scripted."),
    context.parseUrl("https://chrome.google.com/webstore")
  );
  const sensitiveSerialized = JSON.stringify({ sensitiveCheck, blockedSummary });

  assertEqual(sensitiveCheck.requiresConfirmation, true, "Sensitive summary should require confirmation");
  assertEqual(databaseCheck.requiresConfirmation, true, "Database settings pages should require confirmation before page text reading");
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
  assert(longKeyPoints.every((point) => point.length <= 140), "Local page key points should not dump oversized visible text into the chat card");
  assert(chromePageReason.includes("browser or extension pages"), "Chrome internal page unreadable copy should be specific");
  assert(sitePermissionReason.includes("permission to read this site"), "Site permission unreadable copy should be specific");
  assert(protectedPageReason.includes("protected from extension content reading"), "Protected page unreadable copy should be specific");
  assert(chromePageReason !== sitePermissionReason, "Unreadable page copy should not collapse all failures into one message");
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
  assert(chineseFeedback.includes("TabMosaic AI Beta Feedback"), "Feedback template should stay English even for zh-CN UI language");
  assert(
    chineseFeedback.includes("70% clearly right / 20% acceptable / 10% Review or Misc / 0 dangerous close mistakes"),
    "Feedback template should keep the English beta quality target"
  );
  assert(chineseFeedback.includes("Total tabs tested"), "Feedback template should include English manual tab count field");
  assert(chineseFeedback.includes("What rule should TabMosaic remember next time"), "Feedback template should collect memory rule feedback in English");
  assert(chineseFeedback.includes("Redacted diagnostic snapshot"), "Feedback template diagnostic section should stay English");
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
  assert(chineseCurrentTabDraft.answer.includes("I can move the current tab"), "Chinese current tab input should still answer in English");
  assert(chineseCurrentTabDraft.risk.includes("No tabs will be closed"), "Chinese current tab input should still show English risk copy");

  const chineseDomainDraft = context.buildChatRefineDraft("把 docs.google.com 放到文档笔记", state);
  assertEqual(chineseDomainDraft.type, "create_rule_and_move", "Chinese domain draft type");
  assertEqual(chineseDomainDraft.rule.pattern, "docs.google.com", "Chinese domain pattern");
  assertEqual(chineseDomainDraft.groupName, "文档笔记", "Chinese domain target group");
  assertEqual(chineseDomainDraft.groupColor, "green", "Chinese domain group color");
  assert(chineseDomainDraft.actionSummary.includes("Create rule"), "Chinese domain input should still show English action summary");
  assert(chineseDomainDraft.risk.includes("The rule is stored locally"), "Chinese domain input should still show English risk copy");

  const renameDraft = context.buildChatRefineDraft("rename Misc to Reading", state);
  assertEqual(renameDraft.type, "rename_group", "Rename draft type");
  assertDeepEqual(renameDraft.groupIds, [10], "Rename draft group ids");

  const chineseRenameDraft = context.buildChatRefineDraft("把 Misc 改名为阅读", state);
  assertEqual(chineseRenameDraft.type, "rename_group", "Chinese rename draft type");
  assertEqual(chineseRenameDraft.newName, "阅读", "Chinese rename target");
  assertDeepEqual(chineseRenameDraft.groupIds, [10], "Chinese rename draft group ids");
  assert(chineseRenameDraft.actionSummary.includes("Rename"), "Chinese rename input should still show English action summary");
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
    }),
    tab({
      id: 29,
      title: "PRD edit",
      url: "https://docs.google.com/document/d/doc-secret-123/edit"
    }),
    tab({
      id: 30,
      title: "PRD preview",
      url: "https://docs.google.com/document/d/doc-secret-123/preview"
    }),
    tab({
      id: 31,
      title: "Launch video",
      url: "https://www.youtube.com/watch?v=video-secret-1&t=20"
    }),
    tab({
      id: 32,
      title: "Launch video later",
      url: "https://youtu.be/video-secret-1?t=40"
    }),
    tab({
      id: 33,
      title: "Different video",
      url: "https://www.youtube.com/watch?v=video-secret-2"
    }),
    tab({
      id: 34,
      title: "Search tabs",
      url: "https://www.google.com/search?q=tab+manager"
    }),
    tab({
      id: 35,
      title: "Search music",
      url: "https://www.google.com/search?q=ai+music"
    }),
    tab({
      id: 36,
      title: "TabMosaic PR conversation",
      url: "https://github.com/tover0314-w/tabpilot/pull/42"
    }),
    tab({
      id: 37,
      title: "TabMosaic PR files",
      url: "https://github.com/tover0314-w/tabpilot/pull/42/files?diff=split"
    }),
    tab({
      id: 38,
      title: "Different GitHub issue",
      url: "https://github.com/tover0314-w/tabpilot/issues/43"
    }),
    tab({
      id: 39,
      title: "Jira issue",
      url: "https://tabmosaic.atlassian.net/browse/TAB-123?focusedCommentId=100"
    }),
    tab({
      id: 40,
      title: "Jira issue activity",
      url: "https://tabmosaic.atlassian.net/browse/TAB-123?atlOrigin=secret"
    }),
    tab({
      id: 41,
      title: "Linear issue",
      url: "https://linear.app/acme/issue/TAB-123/fix-sidebar"
    }),
    tab({
      id: 42,
      title: "Linear issue comments",
      url: "https://linear.app/acme/issue/TAB-123/fix-sidebar?comment=secret"
    }),
    tab({
      id: 43,
      title: "Figma file",
      url: "https://www.figma.com/file/figmaSecret/Product?node-id=1"
    }),
    tab({
      id: 44,
      title: "Figma comments",
      url: "https://www.figma.com/file/figmaSecret/Product?type=design&node-id=2"
    }),
    tab({
      id: 45,
      title: "Notion page",
      url: "https://www.notion.so/acme/Launch-plan-0123456789abcdef0123456789abcdef?pvs=4"
    }),
    tab({
      id: 46,
      title: "Notion page database view",
      url: "https://www.notion.so/0123456789abcdef0123456789abcdef?v=secret"
    }),
    tab({
      id: 47,
      title: "Drive file",
      url: "https://drive.google.com/file/d/driveSecret/view?usp=sharing"
    }),
    tab({
      id: 48,
      title: "Drive file preview",
      url: "https://drive.google.com/file/d/driveSecret/preview"
    }),
    tab({
      id: 49,
      title: "Chrome extension permissions guide - Acme Docs",
      url: "https://docs.acme.example/chrome-extension-permissions"
    }),
    tab({
      id: 50,
      title: "Chrome extension permissions guide | Acme Docs",
      url: "https://docs.acme.example/guides/chrome-extension-permissions"
    }),
    tab({
      id: 51,
      title: "Chrome extension permissions guide - Other Docs",
      url: "https://docs.other.example/chrome-extension-permissions"
    }),
    tab({
      id: 52,
      title: "GitHub run summary",
      url: "https://github.com/tover0314-w/tabpilot/actions/runs/123456789"
    }),
    tab({
      id: 53,
      title: "GitHub run job",
      url: "https://github.com/tover0314-w/tabpilot/actions/runs/123456789/job/987654"
    }),
    tab({
      id: 54,
      title: "GitHub commit",
      url: "https://github.com/tover0314-w/tabpilot/commit/abcdef1234567890abcdef1234567890abcdef12"
    }),
    tab({
      id: 55,
      title: "GitHub commit diff",
      url: "https://github.com/tover0314-w/tabpilot/commit/abcdef1234567890abcdef1234567890abcdef12?diff=split"
    }),
    tab({
      id: 56,
      title: "Drive open file",
      url: "https://drive.google.com/open?id=driveOpenSecret"
    }),
    tab({
      id: 57,
      title: "Drive download file",
      url: "https://drive.google.com/uc?id=driveOpenSecret&export=download"
    }),
    tab({
      id: 58,
      title: "Dropbox spec",
      url: "https://www.dropbox.com/scl/fi/dropboxSecret/spec.pdf?rlkey=secret"
    }),
    tab({
      id: 59,
      title: "Dropbox spec preview",
      url: "https://www.dropbox.com/scl/fi/dropboxSecret/spec.pdf?dl=0"
    }),
    tab({
      id: 60,
      title: "Miro planning board",
      url: "https://miro.com/app/board/miroSecretBoard/"
    }),
    tab({
      id: 61,
      title: "Miro planning board comments",
      url: "https://miro.com/app/board/miroSecretBoard/?moveToWidget=secret"
    }),
    tab({
      id: 62,
      title: "Canva deck",
      url: "https://www.canva.com/design/canvaSecretDeck/edit"
    }),
    tab({
      id: 63,
      title: "Canva deck view",
      url: "https://www.canva.com/design/canvaSecretDeck/view?utm_content=secret"
    }),
    tab({
      id: 64,
      title: "Coda launch doc",
      url: "https://coda.io/d/Launch-plan_dSecretCoda123/Overview_suSecret"
    }),
    tab({
      id: 65,
      title: "Coda launch doc section",
      url: "https://coda.io/d/Launch-plan_dSecretCoda123/Tasks_suOther"
    })
  ];
  const duplicates = context.detectDuplicateGroups(tabs);
  const closePlan = context.buildSafeDuplicateClosePlan(duplicates, tabs);
  const closeIds = closePlan.closeTabs.map((item) => item.tabId).sort((a, b) => a - b);
  const reviewGroup = duplicates.find((group) => group.type === "same-page-review");
  const domainReviewGroups = duplicates.filter((group) => group.type === "domain-review");
  const titleReviewGroup = duplicates.find((group) => group.type === "title-review");
  const domainReviewTabIds = domainReviewGroups.flatMap((group) => group.tabIds).sort((a, b) => a - b);

  assert(duplicates.some((group) => group.type === "exact" && group.action === "safe-close-candidate"), "Exact duplicate group");
  assert(duplicates.some((group) => group.type === "tracking" && group.action === "safe-close-candidate"), "Tracking duplicate group");
  assert(reviewGroup, "Hash/query different tabs should enter review");
  assertEqual(reviewGroup.action, "review", "Review duplicate action");
  assert(titleReviewGroup, "Normalized title matches should enter review");
  assertEqual(titleReviewGroup.action, "review", "Title duplicate action");
  assertDeepEqual(titleReviewGroup.tabIds, [49, 50], "Title review should include same-host normalized title matches only");
  assert(!JSON.stringify(titleReviewGroup).includes("permissions"), "Title duplicate label must not expose the page title");
  assertEqual(domainReviewGroups.length, 15, "Domain-specific duplicate rules should create review groups for same SaaS objects");
  assertDeepEqual(domainReviewTabIds, [29, 30, 31, 32, 36, 37, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65], "Domain-specific review should include same document/video/work object pairs only");
  assert(domainReviewGroups.every((group) => group.action === "review"), "Domain-specific duplicates must be review-only");
  assert(!JSON.stringify(domainReviewGroups).includes("video-secret"), "Domain-specific duplicate labels must not expose YouTube query values");
  assert(!JSON.stringify(domainReviewGroups).includes("TAB-123"), "Domain-specific duplicate labels must not expose issue IDs");
  assert(!JSON.stringify(domainReviewGroups).includes("figmaSecret"), "Domain-specific duplicate labels must not expose Figma file IDs");
  assert(!JSON.stringify(domainReviewGroups).includes("driveSecret"), "Domain-specific duplicate labels must not expose Drive file IDs");
  assert(!JSON.stringify(domainReviewGroups).includes("driveOpenSecret"), "Domain-specific duplicate labels must not expose Drive open IDs");
  assert(!JSON.stringify(domainReviewGroups).includes("123456789"), "Domain-specific duplicate labels must not expose GitHub Actions run IDs");
  assert(!JSON.stringify(domainReviewGroups).includes("abcdef123"), "Domain-specific duplicate labels must not expose GitHub commit IDs");
  assert(!JSON.stringify(domainReviewGroups).includes("dropboxSecret"), "Domain-specific duplicate labels must not expose Dropbox IDs");
  assert(!JSON.stringify(domainReviewGroups).includes("miroSecretBoard"), "Domain-specific duplicate labels must not expose Miro board IDs");
  assert(!JSON.stringify(domainReviewGroups).includes("canvaSecretDeck"), "Domain-specific duplicate labels must not expose Canva design IDs");
  assert(!JSON.stringify(domainReviewGroups).includes("dSecretCoda123"), "Domain-specific duplicate labels must not expose Coda doc IDs");
  assert(!JSON.stringify(domainReviewGroups).includes("0123456789abcdef"), "Domain-specific duplicate labels must not expose Notion page IDs");
  assert(!duplicates.some((group) => group.tabIds.includes(33)), "Different YouTube videos should not be grouped by stripped query");
  assert(!duplicates.some((group) => group.tabIds.includes(34) || group.tabIds.includes(35)), "Different search queries should not be grouped as duplicates");
  assert(!duplicates.some((group) => group.tabIds.includes(38)), "Different GitHub issues should not be grouped with pull requests");
  assert(!duplicates.some((group) => group.tabIds.includes(51)), "Same normalized title on a different host should not be grouped");
  assert(closeIds.includes(22), "Safe exact duplicate should close");
  assert(closeIds.includes(24), "Safe tracking duplicate should close");
  assert(!closeIds.includes(21), "Active tab must not close");
  assert(!closeIds.includes(27), "Pinned tab must not close");
  assert(!closeIds.includes(25) && !closeIds.includes(26), "Hash review tabs must not auto-close");
  assert(!domainReviewTabIds.some((tabId) => closeIds.includes(tabId)), "Domain-specific review tabs must not auto-close");
  assert(!titleReviewGroup.tabIds.some((tabId) => closeIds.includes(tabId)), "Title review tabs must not auto-close");
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

test("Agentic Classification V2 derives metadata features and rejects weak domain groups", () => {
  const supabaseTab = tab({
    id: 81,
    title: "Settings | Database | ai-music | Supabase",
    url: "https://supabase.com/dashboard/project/ai-music/settings/database"
  });
  const githubTab = tab({
    id: 82,
    title: "Improve agent tools by workflow",
    url: "https://github.com/acme/tabmosaic/pull/42"
  });
  const semanticSupabase = context.buildAIClassificationTab(supabaseTab);
  const semanticGithub = context.buildAIClassificationTab(githubTab);
  const sanitized = context.sanitizeTabsForAIClassification([
    {
      tabId: 83,
      title: "Private planning title",
      hostname: "private.example",
      path: "/secret",
      fullUrl: "https://private.example/secret?token=abc",
      pageText: "Confidential page body"
    }
  ]);
  const byTabId = context.validateAIClassification(
    {
      groups: [
        {
          name: "github.com",
          color: "grey",
          confidence: 0.96,
          reason: "Weak domain-only grouping",
          tabIds: [82]
        },
        {
          name: "Supabase Database Settings",
          color: "green",
          confidence: 0.91,
          project: "ai-music",
          workflow: "Database Settings",
          artifactType: "database_settings",
          intent: "configure",
          evidence: ["title mentions Database", "path includes settings/database"],
          classificationMode: "metadata_semantic",
          domainOnlyRisk: false,
          tabIds: [81]
        }
      ]
    },
    snapshot([supabaseTab, githubTab])
  );
  const splitSuggestionTabs = [
    tab({
      id: 91,
      title: "Database | ai-music | Supabase",
      url: "https://supabase.com/dashboard/project/ai-music/settings/database"
    }),
    tab({
      id: 92,
      title: "Auth | ai-music | Supabase",
      url: "https://supabase.com/dashboard/project/ai-music/auth/users"
    }),
    tab({
      id: 93,
      title: "Deployments | tabmosaic | Vercel",
      url: "https://vercel.com/dashboard/tabmosaic/deployments"
    }),
    tab({
      id: 94,
      title: "Deployment Logs | tabmosaic | Vercel",
      url: "https://vercel.com/dashboard/tabmosaic/deployments/123/logs"
    }),
    tab({
      id: 95,
      title: "Review sidebar refinement PR",
      url: "https://github.com/acme/tabmosaic/pull/50"
    }),
    tab({
      id: 96,
      title: "Fix sidebar refinement commit",
      url: "https://github.com/acme/tabmosaic/commit/abc123"
    })
  ];
  const splitInsights = context.buildClassificationInsights({
    snapshot: snapshot(splitSuggestionTabs),
    appliedGroups: [
      {
        name: "Dev Tools",
        tabIds: [91, 92, 93, 94]
      },
      {
        name: "PR Review",
        windowId: 1,
        tabIds: [95]
      },
      {
        name: "Review Fix",
        windowId: 1,
        tabIds: [96]
      }
    ],
    aiSplitSuggestions: context.validateAIClassificationSplitSuggestions({
      splitSuggestions: [
        {
          fromGroup: "Dev Tools",
          suggestedGroups: ["Supabase Production", "Deployment Debugging"],
          reason: "The broad group contains different metadata workflows."
        }
      ]
    }),
    aiMergeSuggestions: context.validateAIClassificationMergeSuggestions({
      mergeSuggestions: [
        {
          groups: ["PR Review", "Review Fix"],
          suggestedGroup: "Tabmosaic Code Review",
          reason: "Both groups are code review work for the same project."
        }
      ]
    })
  });

  assertEqual(semanticSupabase.inferredArtifactType, "database_settings", "Supabase tab artifact type");
  assertEqual(semanticSupabase.inferredWorkflow, "production_config", "Supabase tab workflow");
  assertEqual(semanticSupabase.projectCandidate, "ai-music", "Supabase project candidate");
  assertEqual(semanticSupabase.domainCategory, "dev_infra", "Supabase domain category");
  assertEqual(semanticSupabase.sensitiveHint, "database", "Supabase sensitive hint");
  assertEqual(semanticSupabase.domainOnlyRisk, true, "Supabase should flag domain-only grouping risk");
  assertEqual(semanticGithub.inferredArtifactType, "pull_request", "GitHub PR artifact type");
  assertEqual(semanticGithub.inferredWorkflow, "code_review", "GitHub PR workflow");
  assertEqual(semanticGithub.projectCandidate, "tabmosaic", "GitHub repo project candidate");
  assert(!("fullUrl" in sanitized[0]), "Classification sanitization must not keep fullUrl");
  assert(!("pageText" in sanitized[0]), "Classification sanitization must not keep pageText");
  assertEqual(sanitized[0].inferredArtifactType, "web_page", "Sanitized payload should derive artifact type");
  assert(!byTabId.has(82), "AI validation should reject weak domain-only group names");
  assertEqual(byTabId.get(81).name, "Supabase Database Settings", "AI validation should keep semantic group names");
  assert(byTabId.get(81).reason.includes("settings/database"), "AI validation should keep metadata evidence as reason");
  assertEqual(byTabId.get(81).classificationMode, "metadata_semantic", "AI validation should keep classification mode");
  assertEqual(splitInsights.splitSuggestions.length, 2, "Classification insights should combine AI and local split suggestions");
  assertEqual(splitInsights.splitSuggestions[0].fromGroup, "Dev Tools", "Classification split suggestion source group");
  assert(splitInsights.splitSuggestions.some((suggestion) => suggestion.suggestedGroups.join(" ").includes("Ai Music")), "Local split suggestions should surface project/workflow groups");
  assert(splitInsights.splitSuggestions.every((suggestion) => suggestion.type === "split"), "Classification insights should expose split suggestions only");
  assert(splitInsights.mergeSuggestions.length >= 1, "Classification insights should surface merge suggestions");
  assert(splitInsights.mergeSuggestions.some((suggestion) => suggestion.suggestedGroup.includes("Code Review")), "Merge suggestions should surface shared workflow group names");
  assert(splitInsights.mergeSuggestions.every((suggestion) => suggestion.type === "merge"), "Classification merge insights should expose merge suggestions only");
});

test("Sidebar Agent tool registry has capped multi-tab tools and Apply-gated actions", () => {
  const registry = context.getAgentToolRegistry();
  const promptRegistry = context.buildAIAgentToolRegistryForPrompt();
  const multiTabTool = registry.readOnly.find((tool) => tool.name === "extract_selected_tabs_visible_text");
  const regionTool = registry.readOnly.find((tool) => tool.name === "extract_selected_page_region");
  const toolCard = registry.readOnly.find((tool) => tool.name === "render_tool_card");
  const searchOpenTabs = registry.readOnly.find((tool) => tool.name === "search_open_tabs");
  const searchSavedWork = registry.readOnly.find((tool) => tool.name === "search_saved_work");
  const searchWebProvider = registry.readOnly.find((tool) => tool.name === "search_web_provider");
  const applyGroupPlan = registry.action.find((tool) => tool.name === "apply_group_plan");
  const createTodo = registry.action.find((tool) => tool.name === "create_todo_from_tabs");
  const saveSelectedTabs = registry.action.find((tool) => tool.name === "save_selected_tabs");

  assert(multiTabTool, "Tool registry should include selected/group visible-text extraction");
  assertEqual(multiTabTool.readsPageText, true, "Multi-tab extraction should be marked as page-text reading");
  assertEqual(multiTabTool.maxTabs, 6, "Multi-tab extraction should be capped at 6 tabs");
  assertEqual(multiTabTool.storage, "session_only", "Multi-tab extraction should stay session-only");
  assert(String(multiTabTool.confirmation).includes("tool_card"), "Multi-tab extraction should require tool-card disclosure");
  assert(regionTool, "Tool registry should include selected page-region extraction");
  assertEqual(regionTool.readsPageText, true, "Selected-region extraction should be marked as page-text reading");
  assertEqual(regionTool.storage, "session_only", "Selected-region extraction should stay session-only");
  assert(String(regionTool.confirmation).includes("element_picker"), "Selected-region extraction should require a user picker");
  assert(regionTool.dataUsed.includes("safe_link_labels"), "Selected-region extraction should disclose safe link labels only");
  assert(regionTool.dataUsed.includes("cropped_screenshot_metadata"), "Selected-region extraction should disclose cropped screenshot metadata");
  assert(toolCard, "Tool registry should include render_tool_card");
  assert(searchOpenTabs, "Tool registry should include local open-tab search");
  assertEqual(searchOpenTabs.readsPageText, false, "Open-tab search should not read page text");
  assert(searchSavedWork, "Tool registry should include local saved-work search");
  assertEqual(searchSavedWork.storage, "local", "Saved-work search should search local work items");
  assert(searchWebProvider, "Tool registry should include provider-backed web search");
  assertEqual(searchWebProvider.sendsToExternalProvider, true, "Web search should disclose external provider use");
  assert(searchWebProvider.dataUsed.includes("user_typed_query"), "Web search should send only the user-typed query by default");
  assertEqual(applyGroupPlan.confirmation, "apply_required", "Group plan application should require Apply");
  assertEqual(createTodo.storage, "local", "Tab todos should be stored locally");
  assertEqual(saveSelectedTabs.storage, "local_metadata_only", "Saved selected tabs should be metadata-only in the first slice");
  assert(promptRegistry.rejected.includes("read_all_tabs_in_background"), "Prompt registry should reject background all-tab reads");
  assert(promptRegistry.rules.some((rule) => rule.includes("capped at 6 tabs")), "Prompt registry should disclose the private beta cap");
});

test("Context-tab extraction shows tool-card counts and skips unsafe reads", async () => {
  const oldScripting = context.chrome.scripting;
  context.chrome.scripting = {
    async executeScript({ target }) {
      if (target.tabId === 104) {
        throw new Error("Script crashed while reading the page");
      }

      if (target.tabId === 105) {
        return [{ result: { title: "Empty", text: "", headings: [], description: "", selectedText: "" } }];
      }

      return [
        {
          result: {
            title: `Readable tab ${target.tabId}`,
            text: `Visible text for tab ${target.tabId}.`,
            headings: ["Overview", "Details"],
            description: "Readable page description.",
            selectedText: ""
          }
        }
      ];
    }
  };

  try {
    const targets = [
      { id: 101, title: "Alpha", rawUrl: "https://example.com/a", hostname: "example.com", path: "/a", urlScheme: "https", pinned: false, audible: false, incognito: false },
      { id: 102, title: "Pinned", rawUrl: "https://example.com/b", hostname: "example.com", path: "/b", urlScheme: "https", pinned: true, audible: false, incognito: false },
      { id: 103, title: "Chrome Extensions", rawUrl: "chrome://extensions", hostname: "", path: "/extensions", urlScheme: "chrome", pinned: false, audible: false, incognito: false },
      { id: 104, title: "Blocked", rawUrl: "https://example.com/c", hostname: "example.com", path: "/c", urlScheme: "https", pinned: false, audible: false, incognito: false },
      { id: 105, title: "Empty", rawUrl: "https://example.com/d", hostname: "example.com", path: "/d", urlScheme: "https", pinned: false, audible: false, incognito: false },
      { id: 106, title: "Beta", rawUrl: "https://example.com/e", hostname: "example.com", path: "/e", urlScheme: "https", pinned: false, audible: false, incognito: false },
      { id: 107, title: "Over cap one", rawUrl: "https://example.com/f", hostname: "example.com", path: "/f", urlScheme: "https", pinned: false, audible: false, incognito: false },
      { id: 108, title: "Over cap two", rawUrl: "https://example.com/g", hostname: "example.com", path: "/g", urlScheme: "https", pinned: false, audible: false, incognito: false }
    ];
    const extraction = await context.extractVisibleTextFromContextTabs(targets, { scope: "selected_tabs" });
    const reasons = extraction.skippedTabs.map((item) => item.reason);

    assertEqual(extraction.readableTabs.length, 2, "Context extraction should read only safe, non-empty tabs");
    assertEqual(extraction.toolCard.scope.type, "selected_tabs", "Tool card should preserve selected-tabs scope");
    assertEqual(extraction.toolCard.scope.requestedTabCount, 8, "Tool card should report requested tab count");
    assertEqual(extraction.toolCard.scope.readTabCount, 2, "Tool card should report readable tab count");
    assertEqual(extraction.toolCard.scope.skippedTabCount, 6, "Tool card should report skipped tab count");
    assertEqual(extraction.toolCard.scope.maxTabs, 6, "Tool card should report the beta read cap");
    assert(extraction.toolCard.skippedBreakdown.some((item) => item.reason === "over_cap" && item.count === 2), "Tool card should count over-cap skipped tabs");
    assert(extraction.toolCard.skippedBreakdown.some((item) => item.reason === "protected" && item.count === 1), "Tool card should count protected skipped tabs");
    assert(extraction.skippedTabs.every((tab) => tab.reasonLabel), "Skipped tabs should include human-readable reason labels");
    assert(reasons.includes("over_cap"), "Context extraction should skip tabs over the beta cap");
    assert(reasons.includes("protected"), "Context extraction should skip protected tabs");
    assert(reasons.includes("restricted"), "Context extraction should skip restricted browser pages");
    assert(reasons.includes("unreadable"), "Context extraction should report injection failures");
    assert(reasons.includes("empty"), "Context extraction should report pages with no readable content");
    assertEqual(
      context.buildContextExtractionSkipReason(
        new Error("Cannot access contents of url \"https://example.com/private\". Extension manifest must request permission to access this host."),
        targets[0]
      ),
      "missing_permission",
      "Context extraction should distinguish missing temporary site access from restricted browser pages"
    );
    const missingPermissionSkippedTab = context.buildContextSkippedTab(targets[0], "missing_permission");
    const missingPermissionToolCard = context.buildContextToolCard({
      scopeType: "selected_tabs",
      requestedCount: 1,
      readCount: 0,
      skippedCount: 1,
      skippedTabs: [missingPermissionSkippedTab]
    });
    const missingPermissionSummary = context.buildLocalContextTabsSummary({
      question: "What are these selected tabs saying?",
      context: { scope: "selected_tabs", tabCount: 1 },
      targetTabs: [targets[0]],
      readableTabs: [],
      skippedTabs: [missingPermissionSkippedTab],
      toolCard: missingPermissionToolCard
    });

    assert(
      missingPermissionSummary.answer.includes("Chrome site access was not granted"),
      "Missing site access answer should explain the Chrome permission in plain language"
    );
    assert(
      missingPermissionSummary.answer.includes("No page body was read, sent to AI, or stored"),
      "Missing site access answer should preserve the privacy boundary"
    );
    assert(
      missingPermissionSummary.recommendations.some((item) => item.includes("Approve Chrome site access")),
      "Missing site access fallback should tell the user to approve Chrome site access"
    );
    assert(
      missingPermissionSummary.groupSummary.suggestedNextSteps.some((item) => item.includes("Approve Chrome site access")),
      "Missing site access next steps should explain the permission retry path"
    );

    const metadataOnlyToolCard = context.buildContextToolCard({
      scopeType: "selected_tabs",
      requestedCount: 3,
      readCount: 0,
      skippedCount: 3,
      skippedTabs: extraction.skippedTabs.slice(0, 3)
    });
    const metadataOnlySummary = context.buildLocalContextTabsSummary({
      question: "What are these selected tabs saying?",
      context: { scope: "selected_tabs", tabCount: 3 },
      targetTabs: targets.slice(1, 4),
      readableTabs: [],
      skippedTabs: extraction.skippedTabs.slice(0, 3),
      toolCard: metadataOnlyToolCard
    });

    assertEqual(metadataOnlyToolCard.status, "metadata_only", "Zero-readable tool card should mark metadata-only fallback");
    assertEqual(metadataOnlySummary.provider, "metadata", "Zero-readable context answer should stay metadata-only");
    assertEqual(metadataOnlySummary.groupSummary.source, "metadata", "Zero-readable group summary should disclose metadata source");
    assert(metadataOnlySummary.answer.includes("No page body was read, sent to AI, or stored"), "Zero-readable context answer should state no page body was read or sent");
    assert(metadataOnlySummary.answer.includes("answered from metadata only"), "Zero-readable answer should use natural metadata-only copy");
    assert(metadataOnlySummary.recommendations.some((item) => item.includes("normal http/https work pages")), "Zero-readable context answer should give a concrete retry path");
    assert(metadataOnlySummary.groupSummary.suggestedNextSteps.some((item) => item.includes("metadata only")), "Zero-readable next steps should explain the metadata-only fallback");
  } finally {
    context.chrome.scripting = oldScripting;
  }
});

test("Multi-tab Page Agent sends capped visible context without full URLs", async () => {
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
                  answer: "The selected tabs are mainly about database setup and deployment checks.",
                  keyPoints: [
                    "One tab covers Supabase database settings.",
                    "Another tab covers deployment readiness."
                  ],
                  tabSummaries: [
                    {
                      tabId: 201,
                      title: "Supabase database settings",
                      summary: "Database configuration, pooling, and backups.",
                      usefulFor: "Checking backend configuration before launch.",
                      suggestedAction: "review"
                    },
                    {
                      tabId: 999,
                      title: "Invented",
                      summary: "This should be dropped.",
                      usefulFor: "Nothing",
                      suggestedAction: "keep"
                    }
                  ],
                  recommendations: ["Review the database settings tab before changing production config."],
                  confidence: 0.88
                })
              }
            }
          ]
        };
      }
    };
  };

  const fakeApiKey = "sk-" + "contextsecret";
  const readableTabs = Array.from({ length: 7 }, (_, index) => ({
    tabId: 201 + index,
    title: index === 0 ? "Supabase database settings" : `Deployment note ${index}`,
    hostname: index === 0 ? "supabase.com" : "vercel.com",
    path: index === 0 ? "/dashboard/project/ai-music/settings/database" : `/docs/${index}`,
    page: {
      description: index === 0 ? "Configure database pooling, backups, and migrations." : "Deployment checklist.",
      headings: ["Overview", "Configuration"],
      selectedText: index === 0 ? "postgres://user:secret@db.example:5432/postgres" : "",
      visibleText: index === 0
        ? `Database settings include pooling, backups, and migrations. Visit https://supabase.com/dashboard/project/ai-music/settings/database?token=abc. Secret ${fakeApiKey}.`
        : `Deployment note ${index} with production readiness details.`
    }
  }));
  const skippedTabs = [
    { tabId: 301, title: "Chrome Extensions", hostname: "", reason: "restricted" },
    { tabId: 302, title: "Pinned Email", hostname: "mail.example", reason: "protected" }
  ];
  const toolCard = context.buildContextToolCard({
    scopeType: "selected_tabs",
    requestedCount: 8,
    readCount: 6,
    skippedCount: 2,
    skippedTabs
  });
  const sidebarContext = {
    scope: "selected_tabs",
    tabCount: 8,
    tabIds: readableTabs.map((item) => item.tabId)
  };
  const fallback = context.buildLocalContextTabsSummary({
    question: "What are these selected tabs about?",
    context: sidebarContext,
    targetTabs: readableTabs.map((item) => ({
      id: item.tabId,
      title: item.title,
      hostname: item.hostname
    })),
    readableTabs,
    skippedTabs,
    toolCard
  });
  const output = await context.callOpenAICompatibleContextTabsAgent(
    {
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      apiKey: "sk-secret"
    },
    {
      question: "What are these selected tabs about?",
      context: sidebarContext,
      readableTabs,
      skippedTabs,
      toolCard,
      conversationHistory: [
        {
          role: "user",
          text: "Earlier I asked about https://supabase.com/dashboard/project/ai-music/settings/database?token=abc"
        },
        {
          role: "assistant",
          text: "It was mainly about database settings and deployment readiness."
        },
        {
          role: "tool",
          text: "This role should be dropped."
        }
      ],
      language: "en"
    }
  );
  const validated = context.validateAIContextTabsAnswer(output, fallback);

  assertEqual(fetchCalls.length, 1, "Multi-tab Page Agent fetch call count");
  assertEqual(fetchCalls[0].url, "https://api.deepseek.com/chat/completions", "Multi-tab Page Agent endpoint");
  assert(fetchCalls[0].options.signal, "Multi-tab Page Agent fetch should carry an abort signal");

  const bodyText = fetchCalls[0].options.body || "";
  const body = JSON.parse(bodyText);
  const userContent = JSON.parse(body.messages[1].content);

  assertEqual(userContent.context.scope, "selected_tabs", "Multi-tab Agent payload should keep selected-tabs context");
  assertEqual(userContent.toolCard.scope.type, "selected_tabs", "Multi-tab Agent payload should include selected-tabs tool-card scope");
  assertEqual(userContent.toolCard.scope.maxTabs, 6, "Multi-tab Agent payload should disclose the beta cap");
  assertEqual(userContent.toolCard.storage, "session_only", "Multi-tab Agent payload should disclose session-only storage");
  assertEqual(userContent.tabs.length, 6, "Multi-tab Agent payload should cap readable tabs at six");
  assertEqual(userContent.tabs[0].tabId, 201, "Multi-tab Agent payload should include real tab ids");
  assertEqual(userContent.skippedTabs.length, 2, "Multi-tab Agent payload should include skipped-tab reasons");
  assertEqual(userContent.skippedTabs[0].reasonLabel, "restricted page", "Multi-tab Agent payload should include safe skipped-tab labels");
  assert(userContent.skippedBreakdown.some((item) => item.reason === "restricted" && item.count === 1), "Multi-tab Agent payload should include skipped reason breakdown");
  assert(userContent.toolCard.skippedBreakdown.some((item) => item.reason === "protected" && item.count === 1), "Multi-tab Agent tool-card payload should include skipped breakdown");
  assertEqual(userContent.conversationHistory.length, 2, "Multi-tab Agent payload should keep only user/assistant context history");
  assert(userContent.conversationHistory[0].text.includes("[redacted URL: supabase.com]"), "Multi-tab Agent history should redact full URLs");
  assert(userContent.tabs[0].visibleText.includes("[redacted URL: supabase.com]"), "Multi-tab Agent payload should redact full URLs but keep host context");
  assert(!bodyText.includes("https://supabase.com/dashboard/project/ai-music/settings/database"), "Multi-tab Agent payload must not include full URLs");
  assert(!bodyText.includes("token=abc"), "Multi-tab Agent payload must not include query tokens");
  assert(!bodyText.includes(fakeApiKey), "Multi-tab Agent payload must redact API-key-like strings");
  assert(!bodyText.includes("postgres://user:secret"), "Multi-tab Agent payload must redact connection strings");
  assert(bodyText.includes("Full URLs, query strings, hashes"), "Multi-tab Agent payload should disclose privacy boundary");
  assert(bodyText.includes("up to 10 local context Q/A turns"), "Multi-tab Agent payload should disclose local follow-up context");
  assert(bodyText.includes("cloud storage are not included"), "Multi-tab Agent payload should disclose no cloud storage");
  assertEqual(validated.provider, "deepseek", "Multi-tab Agent validation should mark DeepSeek provider");
  assertEqual(validated.aiUsed, true, "Multi-tab Agent validation should mark AI usage");
  assertEqual(fallback.groupSummary.label, "Selected tabs", "Local context summary should label selected-tab scope");
  assertEqual(fallback.groupSummary.source, "visible_text", "Local context summary should disclose visible text source");
  assertEqual(fallback.groupSummary.tabCount, 7, "Local context summary should count target tabs");
  assertEqual(fallback.groupSummary.readTabCount, 7, "Local context summary should count readable tabs before prompt cap");
  assertEqual(fallback.groupSummary.skippedTabCount, 2, "Local context summary should count skipped tabs");
  assert(fallback.groupSummary.skippedBreakdown.some((item) => item.reason === "restricted" && item.count === 1), "Local context summary should include skipped breakdown");
  assert(fallback.recommendations[0].includes("1 restricted page"), "Local context summary should explain skipped reasons in plain language");
  assert(fallback.groupSummary.topHosts.includes("supabase.com"), "Local context summary should include top host evidence");
  assert(fallback.groupSummary.themes.length > 0, "Local context summary should include themes");
  assert(fallback.groupSummary.suggestedNextSteps.length > 0, "Local context summary should include safe next steps");
  assertEqual(validated.groupSummary.label, "Selected tabs", "AI validation should preserve local group summary");
  assertEqual(validated.tabSummaries.length, 1, "Multi-tab Agent validation should drop invented tab summaries");
  assertEqual(validated.tabSummaries[0].tabId, 201, "Multi-tab Agent validation should keep real tab summaries");
  assertEqual(validated.privacy.sentPageText, true, "Multi-tab Agent validation should report visible text upload");
  assertEqual(validated.privacy.sentFullUrls, false, "Multi-tab Agent validation should report no full URL upload");
  assertEqual(validated.privacy.storedCloud, false, "Multi-tab Agent validation should report no TabMosaic cloud storage");
});

test("Content regroup agent previews Apply-gated groups from visible context only", async () => {
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
                  answer: "I can split these tabs into database work and launch docs before you apply anything.",
                  groups: [
                    {
                      name: "Database Work",
                      color: "green",
                      reason: "The visible content focuses on pooling, backups, migrations, and schema settings.",
                      tabIds: [201]
                    },
                    {
                      name: "Launch Docs",
                      color: "blue",
                      reason: "The visible content focuses on deployment readiness and release checks.",
                      tabIds: [202, 999, 201]
                    }
                  ],
                  confidence: 0.84
                })
              }
            }
          ]
        };
      }
    };
  };

  const fakeApiKey = "sk-" + "regroupsecret";
  const readableTabs = [
    {
      tabId: 201,
      title: "Supabase database settings",
      hostname: "supabase.com",
      path: "/dashboard/project/ai-music/settings/database",
      page: {
        description: "Configure database pooling, backups, and migrations.",
        headings: ["Database", "Pooling", "Backups"],
        selectedText: "postgres://user:secret@db.example:5432/postgres",
        visibleText: `Database settings include pooling, backups, migrations, and schema changes. Visit https://supabase.com/dashboard/project/ai-music/settings/database?token=abc. Secret ${fakeApiKey}.`
      }
    },
    {
      tabId: 202,
      title: "Deployment checklist",
      hostname: "vercel.com",
      path: "/docs/deployments",
      page: {
        description: "Deployment checklist.",
        headings: ["Deploy", "Checks"],
        selectedText: "",
        visibleText: "Deployment readiness, preview checks, environment variables, and release validation."
      }
    }
  ];
  const skippedTabs = [
    { tabId: 301, title: "Chrome Extensions", hostname: "", reason: "restricted" }
  ];
  const toolCard = context.buildContextToolCard({
    scopeType: "selected_tabs",
    requestedCount: 3,
    readCount: 2,
    skippedCount: 1,
    skippedTabs
  });
  const sidebarContext = {
    scope: "selected_tabs",
    tabCount: 3,
    tabIds: [201, 202, 301]
  };
  const output = await context.callOpenAICompatibleContextRegroupAgent(
    {
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      apiKey: "sk-secret"
    },
    {
      instruction: "Regroup these selected tabs by what the pages are actually about.",
      context: sidebarContext,
      readableTabs,
      skippedTabs,
      toolCard,
      language: "en"
    }
  );
  const draft = context.validateAIContextRegroupDraft(output, {
    instruction: "Regroup these selected tabs by what the pages are actually about.",
    context: sidebarContext,
    readableTabs,
    skippedTabs,
    toolCard,
    provider: "deepseek"
  });

  assertEqual(fetchCalls.length, 1, "Content regroup agent fetch call count");
  assertEqual(fetchCalls[0].url, "https://api.deepseek.com/chat/completions", "Content regroup agent endpoint");
  assert(fetchCalls[0].options.signal, "Content regroup agent fetch should carry an abort signal");

  const bodyText = fetchCalls[0].options.body || "";
  const body = JSON.parse(bodyText);
  const userContent = JSON.parse(body.messages[1].content);

  assertEqual(userContent.task, "Create an Apply/Cancel preview for regrouping this selected tab context by actual visible page content.", "Content regroup payload task");
  assertEqual(userContent.context.scope, "selected_tabs", "Content regroup payload should keep selected-tabs context");
  assertEqual(userContent.toolCard.scope.readTabCount, 2, "Content regroup payload should include read count");
  assertEqual(userContent.toolCard.storage, "session_only", "Content regroup payload should disclose session-only storage");
  assertEqual(userContent.tabs.length, 2, "Content regroup payload should include readable tabs");
  assert(userContent.tabs[0].visibleText.includes("[redacted URL: supabase.com]"), "Content regroup payload should redact full URLs but keep host context");
  assert(!bodyText.includes("https://supabase.com/dashboard/project/ai-music/settings/database"), "Content regroup payload must not include full URLs");
  assert(!bodyText.includes("token=abc"), "Content regroup payload must not include query tokens");
  assert(!bodyText.includes(fakeApiKey), "Content regroup payload must redact API-key-like strings");
  assert(!bodyText.includes("postgres://user:secret"), "Content regroup payload must redact connection strings");
  assert(bodyText.includes("The browser will not change unless the user clicks Apply"), "Content regroup payload should disclose Apply-gated behavior");
  assert(userContent.rules.includes("Use only tabIds from tabs."), "Content regroup payload should tell the model not to invent tab ids");

  assertEqual(draft.type, "regroup_tabs", "Content regroup validation should create a regroup draft");
  assertEqual(draft.status, "regroup-preview", "Content regroup validation should keep preview status");
  assertEqual(draft.provider, "deepseek", "Content regroup validation should mark DeepSeek provider");
  assertEqual(draft.aiUsed, true, "Content regroup validation should mark AI usage");
  assertEqual(draft.groups.length, 2, "Content regroup validation should keep usable groups");
  assertDeepEqual(draft.groups[0].tabIds, [201], "Content regroup validation should keep real tab ids");
  assertDeepEqual(draft.groups[1].tabIds, [202], "Content regroup validation should drop invented and duplicate tab ids");
  assertEqual(draft.matchedTabCount, 2, "Content regroup draft should count matched tabs");
  assertEqual(draft.privacy.sentPageText, true, "Content regroup draft should report visible text upload");
  assertEqual(draft.privacy.sentFullUrls, false, "Content regroup draft should report no full URL upload");
  assertEqual(draft.privacy.storedCloud, false, "Content regroup draft should report no cloud storage");
  assert(draft.risk.includes("No browser changes happen until Apply"), "Content regroup draft should explain Apply-gated risk");
  assertEqual(draft.toolCard.scope.readTabCount, 2, "Content regroup draft should preserve tool-card disclosure");
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
  assertEqual(firstTab.inferredArtifactType, "web_page", "AI payload should include metadata-derived artifact type");
  assertEqual(firstTab.inferredWorkflow, "general", "AI payload should include metadata-derived workflow");
  assertEqual(firstTab.domainCategory, "general_web", "AI payload should include metadata-derived domain category");
  assertEqual(firstTab.domainOnlyRisk, false, "Generic private example should not be flagged as domain-only risk");
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

test("Page Agent sends current visible page text without full URLs", async () => {
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
                  answer: "This Database settings page is for Supabase database configuration. Check connection pooling, backups, and migration impact before changing settings.",
                  keyPoints: [
                    "Connection pooling affects how apps connect to the database.",
                    "Backups and restore options matter before risky changes.",
                    "Review migration and connection details before applying changes."
                  ],
                  suggestedGroup: "Supabase Database",
                  suggestedAction: "review",
                  confidence: 0.86
                })
              }
            }
          ]
        };
      }
    };
  };

  const parsedUrl = context.parseUrl("https://supabase.com/dashboard/project/ai-music/settings/database?token=abc#keys");
  const fakeApiKey = "sk-" + "abc123secret";
  const page = {
    title: "Settings | Database | ai-music",
    description: "Configure database backups, connection pooling, and database settings.",
    headings: ["Database", "Connection pooling", "Backups"],
    selectedText: "postgres://user:secret@db.example:5432/postgres",
    text: `Database settings include backups, connection pooling, migration options, and project connection strings. Secret sample ${fakeApiKey} should be redacted. Read more at https://supabase.com/dashboard/project/ai-music/settings/database?token=abc.`
  };
  const fallback = context.buildLocalPageSummary({
    tab: { title: page.title },
    parsedUrl,
    page,
    question: "What should I check before changing database settings?"
  });
  const output = await context.callOpenAICompatiblePageAgent(
    {
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      apiKey: "sk-secret"
    },
    {
      question: "What should I check before changing database settings?",
      tab: { title: page.title },
      parsedUrl,
      page,
      conversationHistory: [
        {
          role: "user",
          text: "What is this page? https://supabase.com/dashboard/project/ai-music/settings/database?token=abc"
        },
        {
          role: "assistant",
          text: "It is the Supabase Database settings page."
        },
        {
          role: "tool",
          text: "This should be dropped."
        }
      ],
      language: "en"
    }
  );
  const validated = context.validateAIPageAnswer(output, fallback);

  assertEqual(fetchCalls.length, 1, "Page Agent fetch call count");
  assertEqual(fetchCalls[0].url, "https://api.deepseek.com/chat/completions", "Page Agent endpoint");
  assert(fetchCalls[0].options.signal, "Page Agent fetch should carry an abort signal");

  const bodyText = fetchCalls[0].options.body || "";
  const body = JSON.parse(bodyText);
  const userContent = JSON.parse(body.messages[1].content);
  const history = userContent.conversationHistory || [];

  assertEqual(userContent.page.title, page.title, "Page Agent payload should include page title");
  assertEqual(userContent.page.hostname, "supabase.com", "Page Agent payload should include hostname");
  assert(userContent.page.visibleText.includes("Database settings include backups"), "Page Agent payload should include visible page text");
  assert(userContent.page.visibleText.includes("[redacted URL: supabase.com]"), "Page Agent payload should keep useful host context when redacting URLs");
  assertEqual(history.length, 2, "Page Agent payload should keep only user and assistant page-chat history");
  assert(history[0].text.includes("[redacted URL: supabase.com]"), "Page Agent history should redact full URLs");
  assert(!bodyText.includes("https://supabase.com/dashboard/project/ai-music/settings/database"), "Page Agent payload must not include full URL");
  assert(!bodyText.includes("token=abc"), "Page Agent payload must not include query tokens");
  assert(!bodyText.includes("postgres://user:secret"), "Page Agent payload must redact connection strings");
  assert(!bodyText.includes(fakeApiKey), "Page Agent payload must redact API-key-like strings");
  assert(bodyText.includes("visible page text"), "Page Agent payload should disclose that visible text is sent");
  assert(bodyText.includes("cloud storage are not included"), "Page Agent payload should disclose no cloud storage by TabMosaic");
  assertEqual(validated.provider, "deepseek", "Page Agent validation should mark DeepSeek provider");
  assertEqual(validated.aiUsed, true, "Page Agent validation should mark AI usage");
  assertEqual(validated.privacy.sentPageText, true, "Page Agent validation should report page text upload");
  assertEqual(validated.privacy.sentFullUrls, false, "Page Agent validation should report no full URLs");
  assertEqual(validated.privacy.storedCloud, false, "Page Agent validation should report no TabMosaic cloud storage");
  assertEqual(validated.suggestedAction, "review", "Page Agent validation should keep safe page actions");
  assert(validated.summary.includes("connection pooling"), "Page Agent answer should validate");
});

test("Page Agent sends safe GitHub PR site skill without repo path", async () => {
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
                  answer: "This looks like a GitHub pull request. Review the change intent, files changed, tests, CI status, and any risky areas visible on the page.",
                  keyPoints: [
                    "The page exposes PR review cues.",
                    "Visible files and checks should drive the review.",
                    "Missing diff or CI context should be called out."
                  ],
                  suggestedGroup: "Code Review",
                  suggestedAction: "review",
                  confidence: 0.84
                })
              }
            }
          ]
        };
      }
    };
  };

  const parsedUrl = context.parseUrl("https://github.com/byteprivate/rocket-ops-private/pull/42/files?token=abc#diff");
  const page = {
    title: "Improve provider registry checks · Pull Request",
    description: "Review pull request changes and checks.",
    headings: ["Conversation", "Files changed", "Checks"],
    selectedText: "",
    text: "Files changed include provider_registry.js and extension_smoke_test.js. Checks are passing. Review test coverage and provider preset safety."
  };

  const fallback = context.buildLocalPageSummary({
    tab: { title: page.title },
    parsedUrl,
    page,
    question: "What should I review on this PR?"
  });
  const output = await context.callOpenAICompatiblePageAgent(
    {
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      apiKey: "sk-secret"
    },
    {
      question: "What should I review on this PR?",
      tab: { title: page.title },
      parsedUrl,
      page,
      conversationHistory: [],
      language: "en"
    }
  );
  const validated = context.validateAIPageAnswer(output, fallback);
  const bodyText = fetchCalls[0].options.body || "";
  const body = JSON.parse(bodyText);
  const systemPrompt = body.messages[0].content;
  const userContent = JSON.parse(body.messages[1].content);

  assertEqual(fetchCalls.length, 1, "GitHub PR Page Agent fetch call count");
  assert(systemPrompt.includes("site-skill hint"), "Page Agent system prompt should allow safe site-skill guidance");
  assertEqual(userContent.page.hostname, "github.com", "GitHub PR payload should include hostname");
  assertEqual(userContent.page.siteSkill.id, "github_pull_request_review", "GitHub PR payload should include the PR review site skill");
  assertEqual(userContent.page.siteSkill.label, "GitHub Pull Request", "GitHub PR site skill should stay generic");
  assert(userContent.page.siteSkill.capabilities.includes("identify_review_risks"), "GitHub PR site skill should guide review risk analysis");
  assert(userContent.page.siteSkill.guidance.some((item) => item.includes("code review surface")), "GitHub PR site skill should carry review guidance");
  assert(userContent.privacyNote.includes("site-skill hint"), "GitHub PR payload should disclose the site-skill hint");
  assert(!bodyText.includes("byteprivate"), "GitHub PR site skill must not include owner path");
  assert(!bodyText.includes("rocket-ops-private"), "GitHub PR site skill must not include repo path");
  assert(!bodyText.includes("/pull/42"), "GitHub PR site skill must not include PR path");
  assert(!bodyText.includes("token=abc"), "GitHub PR site skill must not include query token");
  assert(!bodyText.includes("#diff"), "GitHub PR site skill must not include hash");
  assertEqual(validated.suggestedGroup, "Code Review", "GitHub PR Page Agent should keep code review grouping");
  assertEqual(validated.suggestedAction, "review", "GitHub PR Page Agent should keep review action");
});

test("Page Agent sends safe site skills for common work pages", async () => {
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
                  answer: "Use the visible page text and the safe site-skill hint to answer this work-page question.",
                  keyPoints: ["The payload includes a generic page type.", "The payload excludes object-specific path data."],
                  suggestedGroup: "Work Review",
                  suggestedAction: "review",
                  confidence: 0.8
                })
              }
            }
          ]
        };
      }
    };
  };

  const cases = [
    {
      url: "https://github.com/byteprivate/rocket-ops-private/issues/77?token=abc#issuecomment",
      title: "Bug report discussion",
      text: "The visible issue text describes a reproduction step, expected behavior, and an open blocker.",
      expectedSkill: "github_issue_triage",
      expectedLabel: "GitHub Issue",
      expectedCapability: "extract_acceptance_criteria",
      forbidden: ["byteprivate", "rocket-ops-private", "/issues/77", "token=abc", "#issuecomment"]
    },
    {
      url: "https://github.com/byteprivate/rocket-ops-private/actions/runs/123456?check_suite_focus=true",
      title: "CI run details",
      text: "The visible check page shows one failing job, test output, and retry controls.",
      expectedSkill: "github_ci_run_review",
      expectedLabel: "GitHub CI Run",
      expectedCapability: "identify_failing_jobs",
      forbidden: ["byteprivate", "rocket-ops-private", "/actions/runs/123456", "check_suite_focus=true"]
    },
    {
      url: "https://linear.app/private-team/issue/TAB-123/fix-dashboard-state?auth=secret",
      title: "Dashboard state issue",
      text: "The visible task text has status, priority, owner, and acceptance criteria.",
      expectedSkill: "project_issue_triage",
      expectedLabel: "Project Issue",
      expectedCapability: "extract_status_and_owner",
      forbidden: ["private-team", "TAB-123", "fix-dashboard-state", "auth=secret"]
    },
    {
      url: "https://company.atlassian.net/browse/SECRET-42?token=abc",
      title: "Sprint task",
      text: "The visible Jira task shows priority, assignee, comments, and linked dependencies.",
      expectedSkill: "project_issue_triage",
      expectedLabel: "Project Issue",
      expectedCapability: "extract_status_and_owner",
      forbidden: ["SECRET-42", "token=abc"]
    },
    {
      url: "https://www.figma.com/file/AbCdPrivate123/Private-Design-System?node-id=0-1",
      title: "Design review canvas",
      text: "The visible design file shows frame labels, comments, and handoff notes.",
      expectedSkill: "design_file_review",
      expectedLabel: "Design File",
      expectedCapability: "identify_review_focus",
      forbidden: ["AbCdPrivate123", "Private-Design-System", "node-id=0-1"]
    },
    {
      url: "https://docs.google.com/document/d/private-doc-id/edit?usp=sharing",
      title: "Planning document",
      text: "The visible document has headings, decisions, open questions, and owner notes.",
      expectedSkill: "collaboration_document_review",
      expectedLabel: "Collaboration Document",
      expectedCapability: "extract_decisions_and_tasks",
      forbidden: ["private-doc-id", "usp=sharing"]
    },
    {
      url: "https://supabase.com/dashboard/project/private-project/settings/database?token=abc#keys",
      title: "Database settings",
      text: "The visible console text mentions backups, connection pooling, and migration settings.",
      expectedSkill: "cloud_project_settings_review",
      expectedLabel: "Cloud Project Console",
      expectedCapability: "identify_risky_settings",
      forbidden: ["private-project", "token=abc", "#keys"]
    }
  ];

  for (const item of cases) {
    const parsedUrl = context.parseUrl(item.url);
    const page = {
      title: item.title,
      description: "",
      headings: ["Overview", "Details"],
      selectedText: "",
      text: item.text
    };
    await context.callOpenAICompatiblePageAgent(
      {
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-v4-flash",
        apiKey: "sk-secret"
      },
      {
        question: "What should I understand here?",
        tab: { title: page.title },
        parsedUrl,
        page,
        conversationHistory: [],
        language: "en"
      }
    );

    const bodyText = fetchCalls[fetchCalls.length - 1].options.body || "";
    const body = JSON.parse(bodyText);
    const userContent = JSON.parse(body.messages[1].content);

    assertEqual(userContent.page.siteSkill.id, item.expectedSkill, `${item.expectedSkill} should be detected`);
    assertEqual(userContent.page.siteSkill.label, item.expectedLabel, `${item.expectedSkill} label should stay generic`);
    assert(userContent.page.siteSkill.capabilities.includes(item.expectedCapability), `${item.expectedSkill} should include expected capability`);
    assertEqual(userContent.page.siteSkill.source, "hostname_path_pattern", `${item.expectedSkill} should disclose pattern source`);
    assert(userContent.page.siteSkill.dataBoundary.includes("visible_text_only"), `${item.expectedSkill} should disclose visible-text boundary`);
    for (const forbidden of item.forbidden) {
      assert(!bodyText.includes(forbidden), `${item.expectedSkill} payload must not include ${forbidden}`);
    }
  }

  assertEqual(fetchCalls.length, cases.length, "Common work page site-skill fetch call count");
});

test("Page Agent selected-region payload stays scoped and session-only", async () => {
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
                  answer: "The selected pricing table says Pro includes workspace history and group summaries.",
                  keyPoints: [
                    "The region is a pricing table.",
                    "Pro includes workspace history.",
                    "Group summaries are shown as a Pro benefit."
                  ],
                  suggestedGroup: "Pricing Research",
                  suggestedAction: "review",
                  confidence: 0.82
                })
              }
            }
          ]
        };
      }
    };
  };

  const parsedUrl = context.parseUrl("https://example.com/pricing?token=abc#plans");
  const page = {
    title: "Plans and Pricing",
    description: "",
    headings: ["Pricing"],
    selectedText: "",
    text: "Pro plan includes workspace history and group summaries. Team plan includes admin controls.",
    source: "selected_region",
    region: {
      label: "Pricing table",
      tagName: "section",
      role: "region",
      safeLinkLabels: ["Compare plans", "Contact sales"],
      listItems: ["Pro includes workspace history", "Team includes admin controls"],
      tableHeaders: ["Plan", "Included features"],
      tableRows: [
        ["Plan", "Included features"],
        ["Pro", "Workspace history and group summaries"],
        ["Secret URL", "https://example.com/pricing?token=abc"]
      ],
      screenshot: {
        captured: true,
        type: "image/jpeg",
        width: 640,
        height: 320,
        byteLength: 2048,
        dataUrl: "data:image/jpeg;base64,SHOULD_NOT_SEND"
      }
    }
  };
  const fallback = {
    ...context.buildLocalPageSummary({
      tab: { title: page.title },
      parsedUrl,
      page,
      question: "What does Pro include?"
    }),
    source: "selected_region"
  };
  const output = await context.callOpenAICompatiblePageAgent(
    {
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      apiKey: "sk-secret"
    },
    {
      question: "What does Pro include?",
      tab: { title: page.title },
      parsedUrl,
      page,
      conversationHistory: [],
      language: "en"
    }
  );
  const validated = context.validateAIPageAnswer(output, fallback);
  const bodyText = fetchCalls[0].options.body || "";
  const body = JSON.parse(bodyText);
  const userContent = JSON.parse(body.messages[1].content);

  assertEqual(fetchCalls.length, 1, "Selected-region Page Agent fetch call count");
  assertEqual(userContent.task, "Answer the user's question about the user-selected page region.", "Selected-region payload should scope the task");
  assertEqual(userContent.page.source, "selected_region", "Selected-region payload should declare its source");
  assertEqual(userContent.page.region.label, "Pricing table", "Selected-region payload should include the region label");
  assert(userContent.page.region.safeLinkLabels.includes("Compare plans"), "Selected-region payload should include safe link labels");
  assert(userContent.page.region.tableHeaders.includes("Included features"), "Selected-region payload should include table structure labels");
  assertDeepEqual(userContent.page.region.tableRows[1], ["Pro", "Workspace history and group summaries"], "Selected-region payload should preserve bounded table rows");
  assert(userContent.page.region.tableRows[2][1].includes("[redacted URL: example.com]"), "Selected-region table rows should redact full URLs");
  assertEqual(userContent.page.region.screenshot.captured, true, "Selected-region payload should include cropped screenshot metadata");
  assertEqual(userContent.page.region.screenshot.width, 640, "Selected-region screenshot metadata should include bounded width");
  assertEqual(userContent.page.region.screenshot.imageDataIncluded, false, "Selected-region payload should not include screenshot image data");
  assertEqual(userContent.page.region.screenshot.imageDataUploaded, false, "Selected-region payload should not upload screenshot image bytes");
  assert(userContent.privacyNote.includes("one user-selected page region"), "Selected-region payload should disclose the selected-region boundary");
  assert(userContent.privacyNote.includes("Screenshot image bytes"), "Selected-region payload should disclose that screenshot image bytes are not included");
  assert(!bodyText.includes("https://example.com/pricing"), "Selected-region payload must not include full URLs");
  assert(!bodyText.includes("token=abc"), "Selected-region payload must not include query tokens");
  assert(!bodyText.includes("SHOULD_NOT_SEND"), "Selected-region payload must not include screenshot data URLs");
  assertEqual(validated.source, "selected_region", "Selected-region validation should preserve fallback source");
  assert(validated.summary.includes("Pro includes workspace history"), "Selected-region Page Agent answer should validate");
});

test("AI Agent answer sends minimized tab context and sanitized short conversation only", async () => {
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
                  answer: "This looks like product planning. Review the active tab first.",
                  relevantTabIds: [51, 999, 51],
                  suggestedNextSteps: ["Open Dashboard", "Ask from the current tab in the composer"],
                  suggestedActions: [
                    { type: "open_dashboard", reason: "Inspect groups" },
                    { type: "ask_page", reason: "Old page button should be ignored" },
                    { type: "close_tabs", reason: "Should be rejected" }
                  ],
                  confidence: 0.82
                })
              }
            }
          ]
        };
      }
    };
  };

  const state = context.buildAIAgentState({
    summary: {
      tabCount: 1,
      groupsCreated: 1,
      tabsMoved: 1,
      safeDuplicatesClosed: 0,
      reviewDuplicateGroups: 0,
      closedTabsRestoreAvailable: false,
      aiClassificationStatus: "applied"
    },
    groups: [
      {
        name: "Product Planning",
        color: "blue",
        tabCount: 1,
        tabIds: [51],
        reason: "Synthetic group"
      }
    ],
    duplicateGroups: [],
    snapshot: {
      tabs: [
        {
          id: 51,
          title: "Private PRD draft",
          hostname: "docs.example",
          path: "/private-prd",
          fullUrl: "https://docs.example/private-prd?token=abc",
          restoreUrl: "https://docs.example/private-prd?token=abc",
          pageText: "Confidential page body",
          windowId: 2,
          active: true,
          pinned: false,
          audible: false,
          discarded: false,
          protectedReasons: []
        }
      ]
    }
  });
  const selectedTabsContext = context.sanitizeAIAgentContext(
    {
      scope: "selected_tabs",
      tabIds: [51, 999, 51],
      tabCount: 2,
      title: "Selected planning tabs",
      windowId: 2
    },
    state
  );

  const output = await context.callOpenAICompatibleTabAgent(
    {
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
      apiKey: "sk-secret"
    },
    {
      instruction: "Which tab should I review first?",
      state,
      activeContext: selectedTabsContext,
      conversationHistory: [
        {
          role: "user",
          text: "Which docs at https://docs.example/private-prd?token=abc should I review first? ?api_key=historysecret"
        },
        {
          role: "assistant",
          text: "Review Private PRD draft and Product Planning next."
        },
        {
          role: "tool",
          text: "This role should be dropped."
        }
      ],
      language: "en"
    }
  );
  const validated = context.validateAIAgentAnswer(output, state);

  assertEqual(fetchCalls.length, 1, "AI Agent fetch call count");
  assertEqual(fetchCalls[0].url, "https://api.deepseek.com/chat/completions", "AI Agent endpoint");
  assert(fetchCalls[0].options.signal, "AI Agent fetch should carry an abort signal");

  const bodyText = fetchCalls[0].options.body || "";
  const body = JSON.parse(bodyText);
  const userContent = JSON.parse(body.messages[1].content);
  const firstTab = userContent.state.tabs[0];
  const history = userContent.conversationHistory || [];

  assertEqual(selectedTabsContext.scope, "selected_tabs", "AI Agent context sanitizer should preserve selected-tabs scope");
  assertDeepEqual(selectedTabsContext.tabIds, [51], "AI Agent context sanitizer should keep only real selected tab ids");
  assertEqual(userContent.activeContext.scope, "selected_tabs", "AI Agent payload should preserve selected-tabs active context");
  assertDeepEqual(userContent.activeContext.tabIds, [51], "AI Agent payload should include only valid selected tab ids");
  assert(userContent.toolRegistry, "AI Agent payload should include the tool registry");
  assert(
    userContent.toolRegistry.readOnly.some((tool) => tool.name === "extract_selected_tabs_visible_text" && tool.maxTabs === 6),
    "AI Agent tool registry should include capped selected/group extraction"
  );
  assert(
    userContent.toolRegistry.action.some((tool) => tool.name === "apply_group_plan" && tool.confirmation === "apply_required"),
    "AI Agent tool registry should tell the model browser-changing group plans require Apply"
  );
  assertEqual(firstTab.tabId, 51, "AI Agent payload should include tab id");
  assertEqual(firstTab.title, "Private PRD draft", "AI Agent payload should include title");
  assertEqual(firstTab.hostname, "docs.example", "AI Agent payload should include hostname");
  assertEqual(firstTab.path, "/private-prd", "AI Agent payload should include path");
  assertEqual(firstTab.groupName, "Product Planning", "AI Agent payload should include current group context");
  assert(!("fullUrl" in firstTab), "AI Agent payload must not include fullUrl field");
  assert(!("restoreUrl" in firstTab), "AI Agent payload must not include restoreUrl field");
  assert(!("pageText" in firstTab), "AI Agent payload must not include pageText field");
  assertEqual(history.length, 2, "AI Agent payload should include only valid recent conversation turns");
  assertEqual(history[0].role, "user", "AI Agent conversation should preserve user role");
  assert(history[0].text.includes("[redacted URL: docs.example]"), "AI Agent conversation should redact full URLs but keep useful host context");
  assert(!history[0].text.includes("historysecret"), "AI Agent conversation should redact token-like query text");
  assert(history[1].text.includes("Review Private PRD draft"), "AI Agent conversation should preserve assistant follow-up context");
  assert(!bodyText.includes("https://docs.example/private-prd?token=abc"), "AI Agent payload must not include full URL");
  assert(!bodyText.includes("token=abc"), "AI Agent payload must not include URL query token");
  assert(!bodyText.includes("Confidential page body"), "AI Agent payload must not include page text");
  assert(bodyText.includes("up to four sanitized recent sidebar chat turns"), "AI Agent payload should disclose short-term conversation context");
  assert(bodyText.includes("No page body, page summaries, full URL"), "AI Agent payload should include privacy note");
  assertEqual(validated.status, "answered", "AI Agent answer should validate");
  assertEqual(validated.matchedTabs.length, 1, "AI Agent validation should drop invented and duplicate tab ids");
  assertEqual(validated.matchedTabs[0].id, 51, "AI Agent validation should keep real tab ids");
  assertEqual(validated.actions.length, 2, "AI Agent validation should expose safe action chips without a separate Ask page button");
  assertDeepEqual(
    validated.actions.map((action) => action.type),
    ["open_dashboard", "show_groups"],
    "AI Agent validation should keep safe actions, reject old Ask page actions, and add safe fallback actions"
  );
  assert(!validated.actions.some((action) => action.type === "close_tabs"), "AI Agent validation must reject destructive unknown actions");
  assertEqual(validated.privacy.sentPageText, false, "AI Agent validation should report no page text upload");
  assertEqual(validated.privacy.sentFullUrls, false, "AI Agent validation should report no full URL upload");
  assert(bodyText.includes("actionDraftRules"), "AI Agent prompt should include action draft safety rules");
  assert(bodyText.includes("Never include close/delete actions"), "AI Agent prompt should reject destructive action drafts");
});

test("AI Agent move action drafts are validated before Apply", () => {
  const state = {
    tabs: [
      {
        tabId: 61,
        title: "Chrome sidePanel docs",
        hostname: "developer.chrome.com",
        path: "/docs/extensions/reference/api/sidePanel",
        windowId: 1,
        active: false,
        pinned: false,
        audible: false,
        discarded: false,
        protectedReasons: []
      },
      {
        tabId: 62,
        title: "Pinned private spec",
        hostname: "docs.example",
        path: "/private-spec",
        windowId: 1,
        active: false,
        pinned: true,
        audible: false,
        discarded: false,
        protectedReasons: ["pinned"]
      }
    ],
    groups: [],
    summary: {}
  };
  const result = context.validateAIAgentAnswer(
    {
      answer: "I can move the relevant extension planning tabs after you approve.",
      actionDraft: {
        type: "MOVE_TABS",
        groupName: "Extension Planning",
        tabIds: [61, 62, 999, 61]
      },
      confidence: 0.8
    },
    state,
    {
      instruction: "Move extension planning tabs into Extension Planning",
      language: "en"
    }
  );

  assertEqual(result.status, "draft", "AI Agent move draft should become a chat draft");
  assertEqual(result.draft.type, "move_tabs", "AI Agent draft should reuse the existing move_tabs apply path");
  assertEqual(result.draft.createdFrom, "ai-agent", "AI Agent draft should record its source");
  assertEqual(result.draft.groupName, "Extension Planning", "AI Agent draft should keep a sanitized target group");
  assertDeepEqual(result.draft.tabIds, [61], "AI Agent draft should keep only real movable tab ids");
  assertEqual(result.draft.matchedTabCount, 1, "AI Agent draft should count validated tabs only");
  assert(result.draft.risk.includes("No tabs will be closed"), "AI Agent draft should disclose no-close safety");
  assertEqual(result.privacy.sentPageText, false, "AI Agent draft should report no page text upload");
  assertEqual(result.privacy.sentFullUrls, false, "AI Agent draft should report no full URL upload");
});

test("AI Agent destructive action drafts are ignored", () => {
  const state = {
    tabs: [
      {
        tabId: 71,
        title: "Potential duplicate",
        hostname: "example.com",
        path: "/duplicate",
        windowId: 1,
        active: false,
        pinned: false,
        audible: false,
        discarded: false,
        protectedReasons: []
      }
    ],
    groups: [],
    summary: {}
  };
  const result = context.validateAIAgentAnswer(
    {
      answer: "I can review this, but I will not close tabs from this answer.",
      actionDraft: {
        type: "close_tabs",
        tabIds: [71]
      },
      suggestedActions: [{ type: "close_tabs" }],
      confidence: 0.7
    },
    state,
    {
      instruction: "Close these tabs",
      language: "en"
    }
  );

  assertEqual(result.status, "answered", "Destructive AI Agent draft should fall back to a safe answer");
  assert(!result.draft, "Destructive AI Agent draft should not be exposed");
  assert(!result.actions.some((action) => action.type === "close_tabs"), "Destructive AI Agent action chip should be rejected");
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
  assert(screenshotTool.includes("sidepanel-context-tabs.png"), "Screenshot mock should include selected-tabs context Agent state");
  assert(screenshotTool.includes("assertSidepanelLayoutNotClipped"), "Screenshot mock should fail when Sidebar messages or composer are horizontally clipped");
  assert(screenshotTool.includes('request?.type === "SUMMARIZE_CONTEXT_TABS"'), "Screenshot mock should exercise the selected-tabs context Agent message path");
  assert(en.aiStatus?.message, "English AI status label");
  assert(en.aiGroups?.message, "English AI group label");
  assert(en.aiNoUsableGroups?.message, "English empty AI copy");
  assert(zh.aiStatus?.message, "Chinese AI status label");
  assert(zh.aiGroups?.message, "Chinese AI group label");
  assert(zh.aiNoUsableGroups?.message, "Chinese empty AI copy");
  assert(en.permissionOptionalSitesCopy?.message && zh.permissionOptionalSitesCopy?.message, "Optional site access permission copy should be localized");
  assert(en.permissionsNotRequested.message.includes("Not granted by default"), "Permission copy should distinguish default grants from temporary site access");
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

test("standalone privacy policy draft stays unpublished and matches privacy boundaries", () => {
  const draftPath = path.join(ROOT_DIR, "05_PROJECT", "13_PRIVACY_POLICY_DRAFT.md");
  const storeDraft = fs.readFileSync(path.join(ROOT_DIR, "05_PROJECT", "07_STORE_SUBMISSION_DRAFT.md"), "utf8");
  const draft = fs.readFileSync(draftPath, "utf8");

  assert(fs.existsSync(draftPath), "Standalone privacy policy draft should exist");
  assert(draft.includes("Status: DO NOT PUBLISH YET"), "Privacy policy draft should not be publish-ready");
  assert(draft.includes("Decision state: CONFIRM before publishing"), "Privacy policy draft should require confirmation");
  assert(draft.includes("[Developer name]"), "Privacy policy draft should keep developer identity placeholder");
  assert(draft.includes("[support email]"), "Privacy policy draft should keep support email placeholder");
  assert(draft.includes("[website URL]"), "Privacy policy draft should keep website URL placeholder");
  assert(draft.includes("saved workspace snapshots"), "Privacy policy draft should cover saved workspace snapshots");
  assert(draft.includes("does not request the literal `<all_urls>`"), "Privacy policy draft should disclose no literal all-URLs permission");
  assert(draft.includes("configured BYOK AI provider only if the user enables optional AI classification"), "Privacy policy draft should bound BYOK provider sharing");
  assert(draft.includes("does not provide cloud sync, hosted AI accounts, account storage, billing, analytics upload"), "Privacy policy draft should disclose absent cloud/account/analytics paths");
  assert(draft.includes("Dashboard -> Settings -> Clear Local Data"), "Privacy policy draft should document local data deletion");
  assert(draft.includes("Chrome Web Store User Data Policy, including the Limited Use requirements"), "Privacy policy draft should include Limited Use disclosure");
  assert(storeDraft.includes("Standalone draft source: `05_PROJECT/13_PRIVACY_POLICY_DRAFT.md`"), "Store submission draft should point to standalone privacy policy draft");
});

test("Chrome Web Store data disclosure draft stays unsubmitted and conservative", () => {
  const draftPath = path.join(ROOT_DIR, "05_PROJECT", "14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md");
  const storeDraft = fs.readFileSync(path.join(ROOT_DIR, "05_PROJECT", "07_STORE_SUBMISSION_DRAFT.md"), "utf8");
  const draft = fs.readFileSync(draftPath, "utf8");

  assert(fs.existsSync(draftPath), "Chrome Web Store data disclosure draft should exist");
  assert(draft.includes("Status: DO NOT SUBMIT YET"), "Data disclosure draft should not be submission-ready");
  assert(draft.includes("Decision state: CONFIRM before Chrome Web Store submission"), "Data disclosure draft should require confirmation");
  assert(draft.includes("Final data-use categories must be confirmed in the Chrome Web Store dashboard."), "Data disclosure draft should keep final category confirmation gate");
  assert(draft.includes("Web history / web browsing activity"), "Data disclosure draft should map browsing metadata");
  assert(draft.includes("Website content / website resources"), "Data disclosure draft should map user-triggered page content");
  assert(draft.includes("User-provided content"), "Data disclosure draft should map local chat/rules content");
  assert(draft.includes("Authentication information"), "Data disclosure draft should cover the optional local BYOK API key");
  assert(draft.includes("optional BYOK"), "Data disclosure draft should keep BYOK AI as optional");
  assert(draft.includes("does not sell user data"), "Data disclosure draft should include no-sale posture");
  assert(draft.includes("No analytics upload"), "Data disclosure draft should disclose no analytics upload");
  assert(draft.includes("05_PROJECT/13_PRIVACY_POLICY_DRAFT.md") || storeDraft.includes("05_PROJECT/13_PRIVACY_POLICY_DRAFT.md"), "Disclosure flow should stay connected to the standalone privacy policy draft");
  assert(storeDraft.includes("Standalone data disclosure draft source: `05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md`"), "Store submission draft should point to standalone data disclosure draft");
});

test("AI connection test does not send tab data", async () => {
  const fetchCalls = [];
  const permissionChecks = [];
  const permissionRequests = [];
  const grantedOrigins = new Set();

  context.chrome.permissions = {
    async contains(request) {
      permissionChecks.push(request);
      return (request.origins || []).every((origin) => grantedOrigins.has(origin));
    },
    async request(request) {
      permissionRequests.push(request);
      for (const origin of request.origins || []) {
        grantedOrigins.add(origin);
      }
      return true;
    }
  };

  context.fetch = async (url, options = {}) => {
    fetchCalls.push({ url, options });
    const modelId = String(url).includes("localhost")
      ? "llama3.1"
      : String(url).includes("api.openai.com")
      ? "gpt-4.1-mini"
      : "deepseek-v4-flash";

    return {
      ok: true,
      async json() {
        return {
          data: [
            {
              id: modelId,
              object: "model",
              owned_by: "test"
            },
            {
              id: `${modelId}-alternate`,
              object: "model",
              owned_by: "test"
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
  assertEqual(fetchCalls[0].options.headers.Authorization, "Bearer sk-secret", "Remote AI connection should send the saved API key");
  assert(fetchCalls[0].options.signal, "AI connection fetch should carry an abort signal");
  assert(!fetchCalls[0].options.body, "AI connection should not send request body");
  assertEqual(result.modelAvailable, true, "AI connection model availability");
  assertDeepEqual(result.modelSuggestions, ["deepseek-v4-flash", "deepseek-v4-flash-alternate"], "AI connection should return model-list suggestions");
  assertEqual(result.diagnostics.providerLabel, "DeepSeek", "AI connection diagnostics should include provider label");
  assertEqual(result.diagnostics.endpoint, "models", "AI connection diagnostics should show model-list check");
  assertEqual(result.diagnostics.modelSuggestionCount, 2, "AI connection diagnostics should count suggestions");
  assertEqual(result.diagnostics.authorizationSent, true, "AI connection diagnostics should disclose Authorization use");
  assertEqual(result.diagnostics.localEndpoint, false, "AI connection diagnostics should distinguish remote endpoints");
  assertDeepEqual(result.diagnostics.troubleshootingCodes, [], "Successful remote model-list check should not show troubleshooting next steps");
  assertEqual(result.diagnostics.sentTabData, false, "AI connection diagnostics must not claim tab data was sent");
  assertEqual(result.privacy.sentTabData, false, "AI connection must not send tab data");
  assertEqual(result.privacy.sentPageText, false, "AI connection must not send page text");
  assertEqual(result.privacy.sentFullUrls, false, "AI connection must not send full URLs");
  assertEqual(context.normalizeAIBaseUrl("https://api.deepseek.com/v1/"), "https://api.deepseek.com/v1", "DeepSeek paths should remain supported");
  assertEqual(context.normalizeAIBaseUrl("http://localhost:11434/v1/"), "http://localhost:11434/v1", "Localhost model endpoints should remain supported");

  const openAIResult = await context.testAIConnection({
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    apiKey: "sk-secret",
    requestPermission: true
  });

  assertEqual(fetchCalls.length, 2, "Custom AI provider should trigger a second fetch after permission");
  assertEqual(fetchCalls[1].url, "https://api.openai.com/v1/models", "Custom AI provider should call its own models endpoint");
  assertEqual(fetchCalls[1].options.headers.Authorization, "Bearer sk-secret", "Custom remote provider should send the API key");
  assertEqual(permissionRequests.length, 1, "Custom AI provider should request one provider-origin permission");
  assertDeepEqual(permissionRequests[0], { origins: ["https://api.openai.com/*"] }, "Custom AI provider should request only its origin");
  assert(permissionChecks.length >= 1, "Custom AI provider should check existing origin permission");
  assertEqual(openAIResult.provider, "openai", "Known provider hosts should keep provider-specific labels");
  assertEqual(openAIResult.modelAvailable, true, "Custom AI connection model availability");
  assert(openAIResult.modelSuggestions.includes("gpt-4.1-mini-alternate"), "Custom AI connection should expose model-list suggestions");
  assertEqual(openAIResult.diagnostics.providerLabel, "OpenAI", "Custom AI diagnostics should use provider labels");
  assertEqual(openAIResult.diagnostics.permissionRequired, true, "Custom AI diagnostics should show provider-origin permission was required");
  assertEqual(openAIResult.diagnostics.permissionOrigin, "https://api.openai.com/*", "Custom AI diagnostics should keep only provider origin");

  const localResult = await context.testAIConnection({
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.1",
    apiKey: "",
    requestPermission: true
  });

  assertEqual(fetchCalls.length, 3, "Local model endpoint should trigger a third fetch");
  assertEqual(fetchCalls[2].url, "http://localhost:11434/v1/models", "Local model endpoint should call its own models endpoint");
  assert(!fetchCalls[2].options.headers.Authorization, "Local model endpoint without an API key should not send Authorization");
  assertDeepEqual(permissionRequests[1], { origins: ["http://localhost/*"] }, "Local model endpoint should request only the localhost provider origin");
  assertEqual(localResult.provider, "local-openai-compatible", "Local model endpoint should be labeled local OpenAI-compatible");
  assertEqual(localResult.modelAvailable, true, "Local model endpoint model availability");
  assert(localResult.modelSuggestions.includes("llama3.1-alternate"), "Local model endpoint should expose model-list suggestions");
  assertEqual(localResult.diagnostics.providerLabel, "Local OpenAI-compatible", "Local AI diagnostics should use local provider label");
  assertEqual(localResult.diagnostics.localEndpoint, true, "Local AI diagnostics should distinguish local endpoints");
  assertEqual(localResult.diagnostics.authorizationSent, false, "Local AI diagnostics should show no Authorization header when no key is entered");
  assertDeepEqual(localResult.diagnostics.troubleshootingCodes, [], "Successful local model-list check should not show troubleshooting next steps");

  const localMissingModelResult = await context.testAIConnection({
    baseUrl: "http://localhost:11434/v1",
    model: "missing-local-model",
    apiKey: "",
    requestPermission: true
  });

  assertEqual(fetchCalls.length, 4, "Local missing-model check should trigger a fourth fetch");
  assertEqual(localMissingModelResult.modelAvailable, false, "Local missing-model check should report missing configured model");
  assert(
    localMissingModelResult.diagnostics.troubleshootingCodes.includes("start_ollama_load_model"),
    "Local missing-model diagnostics should suggest starting/loading Ollama model"
  );
  assert(
    localMissingModelResult.diagnostics.troubleshootingCodes.includes("choose_listed_model"),
    "Local missing-model diagnostics should suggest choosing a listed model"
  );

  const previousFetch = context.fetch;
  context.fetch = async (url, options = {}) => {
    fetchCalls.push({ url, options });

    if (String(url).endsWith("/models")) {
      return {
        ok: false,
        status: 404,
        async json() {
          return {};
        }
      };
    }

    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: { content: "OK" }
            }
          ]
        };
      }
    };
  };

  const fireworksFallbackResult = await context.testAIConnection({
    baseUrl: "https://api.fireworks.ai/inference/v1",
    model: "accounts/fireworks/models/llama-v3p1-8b-instruct",
    apiKey: "sk-secret",
    requestPermission: true
  });

  context.fetch = previousFetch;

  assertEqual(fetchCalls[4].url, "https://api.fireworks.ai/inference/v1/models", "Model-list fallback should try /models first");
  assertEqual(fetchCalls[5].url, "https://api.fireworks.ai/inference/v1/chat/completions", "Model-list fallback should verify chat endpoint");
  assertEqual(fetchCalls[5].options.method, "POST", "Fallback provider check should call chat completions");
  assert(
    String(fetchCalls[5].options.body || "").includes("Reply with OK.") &&
      !String(fetchCalls[5].options.body || "").includes("github.com") &&
      !String(fetchCalls[5].options.body || "").includes("pageText"),
    "Fallback provider check should send only a synthetic prompt"
  );
  assertEqual(fireworksFallbackResult.provider, "fireworks", "Known fallback provider host should keep provider-specific label");
  assertEqual(fireworksFallbackResult.modelAvailable, true, "Fallback provider chat ping should mark the configured model usable");
  assertDeepEqual(fireworksFallbackResult.modelSuggestions, [], "Synthetic fallback should not invent model suggestions");
  assertEqual(fireworksFallbackResult.diagnostics.providerLabel, "Fireworks AI", "Fallback diagnostics should include provider label");
  assertEqual(fireworksFallbackResult.diagnostics.endpoint, "synthetic-chat", "Fallback diagnostics should show synthetic chat check");
  assertEqual(fireworksFallbackResult.diagnostics.syntheticPromptUsed, true, "Fallback diagnostics should disclose synthetic ping");
  assertEqual(fireworksFallbackResult.diagnostics.modelListAvailable, false, "Fallback diagnostics should show model-list was unavailable");
  assertEqual(fireworksFallbackResult.diagnostics.modelSuggestionCount, 0, "Fallback diagnostics should not invent suggestions");
  assertDeepEqual(
    fireworksFallbackResult.diagnostics.troubleshootingCodes,
    ["model_list_unavailable_synthetic_only"],
    "Fallback diagnostics should explain synthetic-only model-list troubleshooting"
  );

  try {
    await context.testAIConnection({
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4.1-mini",
      apiKey: "",
      requestPermission: true
    });
    assert(false, "Remote AI provider without an API key should fail");
  } catch (error) {
    assert(
      String(error?.message || "").includes("API key is required"),
      "Remote AI provider without an API key should explain the key requirement"
    );
  }

  try {
    await context.testAIConnection({
      baseUrl: "http://api.openai.com/v1",
      model: "gpt-4.1-mini",
      apiKey: "sk-secret",
      requestPermission: true
    });
    assert(false, "Unsupported AI base URL should fail");
  } catch (error) {
    assert(
      String(error?.message || "").includes("Remote AI provider Base URLs must use HTTPS"),
      "Unsupported remote HTTP AI host should explain the HTTPS requirement"
    );
  }

  assertEqual(fetchCalls.length, 6, "Unsupported remote HTTP AI host and missing remote key must not trigger another fetch");
});

test("Agent web search tool uses Tavily-style provider only after config", async () => {
  const oldGet = context.chrome.storage.local.get;
  const oldFetch = context.fetch;
  const oldContains = context.chrome.permissions.contains;
  const fetchCalls = [];

  try {
    context.chrome.permissions.contains = async () => true;
    context.chrome.storage.local.get = async () => ({});
    context.fetch = async () => {
      fetchCalls.push({ unexpected: true });
      throw new Error("Search should not fetch before provider config");
    };

    const missing = await context.runAgentWebSearch({ query: "browser agent search" });
    assertEqual(missing.status, "not-configured", "Web search should require explicit provider configuration");
    assertEqual(fetchCalls.length, 0, "Unconfigured web search must not send a network request");
    assertEqual(missing.privacy.sentQuery, false, "Unconfigured web search should not send the query");
    assertEqual(missing.privacy.sentTabData, false, "Web search should not send tab data");
    assertEqual(missing.privacy.sentPageText, false, "Web search should not send page text");

    context.chrome.storage.local.get = async () => ({
      "tabmosaic.searchSettings": {
        enabled: true,
        provider: "tavily",
        baseUrl: "https://api.tavily.com",
        apiKey: "tvly-test-key",
        maxResults: 3,
        searchDepth: "basic",
        includeAnswer: true
      }
    });
    context.fetch = async (url, options = {}) => {
      fetchCalls.push({
        url,
        options,
        body: JSON.parse(options.body || "{}")
      });

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            answer: "A browser work agent combines search, page context, tasks, and safe browser actions.",
            results: [
              {
                title: "Browser agent overview",
                url: "https://example.com/browser-agent?utm_source=test",
                content: "Short result snippet about browser work agents.",
                score: 0.91,
                raw_content: "SHOULD_NOT_APPEAR"
              }
            ]
          };
        }
      };
    };

    const result = await context.runAgentWebSearch({
      query: " browser   work agent ",
      requestPermission: true
    });
    const call = fetchCalls[0];

    assertEqual(result.status, "completed", "Configured web search should complete");
    assertEqual(result.provider, "tavily", "Configured web search should use Tavily first");
    assertEqual(call.url, "https://api.tavily.com/search", "Tavily search should use the search endpoint");
    assertEqual(call.options.method, "POST", "Tavily search should use POST");
    assertEqual(call.options.headers.Authorization, "Bearer tvly-test-key", "Tavily search should send the configured key as Authorization");
    assertEqual(call.body.query, "browser work agent", "Web search should send only the normalized user query");
    assertEqual(call.body.max_results, 3, "Web search should respect capped max results");
    assertEqual(call.body.include_raw_content, false, "Web search should not request raw content by default");
    assertEqual(call.body.include_images, false, "Web search should not request images by default");
    assertEqual(result.privacy.sentTabData, false, "Completed web search should not send tab data");
    assertEqual(result.privacy.sentPageText, false, "Completed web search should not send page text");
    assertEqual(result.privacy.sentFullUrls, false, "Completed web search should not send browser full URLs");
    assertEqual(result.results.length, 1, "Web search should expose sanitized results");
    assertEqual(result.results[0].hostname, "example.com", "Search result should expose safe hostname metadata");
    assert(!result.results[0].raw_content, "Search result must not keep raw content");
  } finally {
    context.chrome.storage.local.get = oldGet;
    context.fetch = oldFetch;
    context.chrome.permissions.contains = oldContains;
  }
});

test("DeepSeek smoke test stays inside private beta provider guardrails", () => {
  const deepseekSmoke = fs.readFileSync(path.join(ROOT_DIR, "tools", "deepseek_smoke_test.js"), "utf8");

  assert(deepseekSmoke.includes('const SUPPORTED_AI_HOSTNAME = "api.deepseek.com"'), "DeepSeek smoke should stay limited to the private beta host");
  assert(deepseekSmoke.includes("function normalizeBaseUrl"), "DeepSeek smoke should validate the configured base URL");
  assert(deepseekSmoke.includes("Current beta supports only https://api.deepseek.com"), "DeepSeek smoke should explain unsupported hosts");
  assert(deepseekSmoke.includes("function fetchWithTimeout"), "DeepSeek smoke should use bounded network calls");
  assert(deepseekSmoke.includes("AbortController"), "DeepSeek smoke should abort slow provider requests");
  assert(deepseekSmoke.includes("function normalizeApiKey"), "DeepSeek smoke should normalize pasted local API keys without printing them");
  assert(deepseekSmoke.includes("function parseJsonObject"), "DeepSeek smoke should tolerate wrapped JSON responses before validation");
  assert(deepseekSmoke.includes("function extractFirstJsonObject"), "DeepSeek smoke should extract JSON without printing model output");
  assert(deepseekSmoke.includes("Synthetic fixture only. No real browser tabs"), "DeepSeek fixture should document that it sends only synthetic tab data");
  assert(!deepseekSmoke.includes("console.log(apiKey"), "DeepSeek smoke must not print API keys");
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
    "tabmosaic.savedWorkspaces",
    "tabmosaic.sidebarContext",
    "tabmosaic.sidebarMode",
    "tabmosaic.agentTasks",
    "tabmosaic.savedCollections",
    "tabmosaic.searchSettings"
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
