const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const OUT_DIR = path.join(ROOT_DIR, "artifacts", "ui-screenshots");
const DEFAULT_VIEWPORT = { width: 1366, height: 980 };
const DASHBOARD_MOBILE_VIEWPORT = { width: 390, height: 1200 };
const SIDEPANEL_VIEWPORT = { width: 390, height: 860 };
const TEN_TURN_PAGE_QUESTIONS = [
  "What is this page for?",
  "What are the most important health signals?",
  "Should I change connection pooling right now?",
  "What is the risk if I rotate the database password?",
  "Is point-in-time recovery enabled?",
  "Which project and environment are we talking about?",
  "Before running the pending migration, what should I check?",
  "Could this page help me reduce connection errors?",
  "Summarize the action plan in priority order.",
  "Final decision: change settings now or prepare first?"
];

const TOOL_SAFETY = {
  selectedTabs: {
    toolPermissions: ["read_selected_tabs_pages_after_site_access"],
    toolPermissionLabels: ["Read selected tabs"],
    blockedActions: ["read_unselected_tabs", "close_tabs", "auto_submit", "mutate_page", "cloud_storage"],
    blockedActionLabels: ["No unselected tabs", "No tab closing", "No submit", "No page edits"],
    security: {
      pageTextTrusted: false
    }
  },
  pageRegion: {
    toolPermissions: ["read_selected_page_region_after_user_click"],
    toolPermissionLabels: ["Read clicked region"],
    blockedActions: ["auto_fill", "auto_submit", "mutate_page", "background_crawl", "web_search", "full_url_upload", "cloud_storage"],
    blockedActionLabels: ["No auto-fill", "No submit", "No page edits", "No background crawl"],
    security: {
      pageTextTrusted: false
    }
  }
};

const MOCK_RUN = {
  id: "mock-run-2026-06-09",
  status: "completed",
  completedAt: "2026-06-09T02:12:00.000Z",
  activeWindowId: 1,
  summary: {
    windowCount: 3,
    tabCount: 42,
    groupsCreated: 7,
    tabsMoved: 31,
    safeDuplicatesClosed: 4,
    reviewDuplicateGroups: 2,
    reviewDuplicatesClosed: 0,
    reviewDuplicateGroupsKept: 0,
    undoAvailable: true,
    closedTabsRestoreAvailable: true,
    aiClassificationStatus: "applied",
    aiGroupsSuggested: 3,
    protectedCounts: {
      active: 3,
      pinned: 2,
      audible: 1
    },
    topHosts: [
      { hostname: "docs.google.com", count: 9 },
      { hostname: "github.com", count: 8 },
      { hostname: "linear.app", count: 5 },
      { hostname: "figma.com", count: 4 }
    ]
  },
  groups: [
    {
      id: 101,
      windowId: 1,
      name: "Product Planning",
      color: "blue",
      tabCount: 8,
      tabIds: [301, 302, 303, 304, 305, 306, 307, 308],
      reason: "AI matched roadmap, PRD, and planning docs"
    },
    {
      id: 102,
      windowId: 2,
      name: "Code Review",
      color: "green",
      tabCount: 7,
      tabIds: [309, 310, 311, 312, 313, 314, 315],
      reason: "User rule: GitHub PR to Code Review"
    },
    {
      id: 103,
      windowId: 3,
      name: "Customer Research",
      color: "purple",
      tabCount: 6,
      tabIds: [316, 317, 318, 319, 320, 321],
      reason: "AI clustered interviews and market notes"
    },
    {
      id: 104,
      windowId: 1,
      name: "Design References",
      color: "pink",
      tabCount: 5,
      tabIds: [322, 323, 324, 325, 326],
      reason: "Figma and visual inspiration tabs"
    },
    {
      id: 105,
      windowId: 2,
      name: "Chrome Extension Docs",
      color: "cyan",
      tabCount: 4,
      tabIds: [327, 328, 329, 330],
      reason: "Built-in docs rule"
    },
    {
      id: 106,
      windowId: 3,
      name: "Articles to Read",
      color: "yellow",
      tabCount: 3,
      tabIds: [331, 332, 333],
      reason: "Reading queue"
    }
  ],
  duplicateGroups: [
    {
      id: "dup-exact-1",
      label: "docs.google.com/product-prd",
      type: "exact",
      action: "safe-close-candidate",
      tabCount: 3
    },
    {
      id: "dup-track-1",
      label: "linear.app/project?utm_source=...",
      type: "tracking",
      action: "safe-close-candidate",
      tabCount: 2
    },
    {
      id: "dup-review-1",
      label: "github.com/tover0314-w/tabpilot/pulls",
      type: "query",
      action: "review",
      reviewStatus: "needs-review",
      tabCount: 2,
      tabIds: [301, 302]
    }
  ],
  classificationInsights: {
    source: "metadata_semantic",
    splitSuggestions: [
      {
        type: "split",
        source: "metadata",
        fromGroup: "GitHub",
        suggestedGroups: ["TabMosaic Code Review", "TabMosaic Issue Triage", "Release CI Runs"],
        reason: "Metadata suggests this broad group mixes different jobs or workflows.",
        tabCount: 7
      },
      {
        type: "split",
        source: "metadata",
        fromGroup: "Product Planning",
        suggestedGroups: ["Private Beta Planning", "Pricing Research"],
        reason: "Metadata shows multiple projects or workflows inside this group.",
        tabCount: 8
      }
    ],
    mergeSuggestions: [
      {
        type: "merge",
        source: "metadata",
        groups: ["PR Review", "Release Fix"],
        suggestedGroup: "TabMosaic Code Review",
        reason: "Metadata suggests these small groups share the same project or workflow.",
        tabCount: 3
      }
    ]
  },
  snapshot: {
    tabs: [
      mockTab(301, 1, "Q3 planning doc", "docs.google.com", "/document/d/mock-planning", { groupId: 101, active: true }),
      mockTab(302, 1, "Product roadmap", "notion.so", "/workspace/roadmap", { groupId: 101 }),
      mockTab(303, 1, "MVP private beta checklist", "linear.app", "/acme/project/tabmosaic", { groupId: 101 }),
      mockTab(304, 1, "Pricing notes draft", "docs.google.com", "/document/d/mock-pricing", { groupId: 101, discarded: true }),
      mockTab(305, 1, "Customer interview notes", "coda.io", "/doc/interviews", { groupId: 101 }),
      mockTab(306, 1, "Office workflow research", "notion.so", "/workspace/research", { groupId: 101 }),
      mockTab(307, 1, "Launch checklist", "docs.google.com", "/spreadsheet/d/mock-launch", { groupId: 101 }),
      mockTab(308, 1, "Competitor positioning", "docs.google.com", "/document/d/mock-competitors", { groupId: 101 }),
      mockTab(309, 2, "PR #24 - Add sidebar control center", "github.com", "/tover0314-w/tabpilot/pull/24", { groupId: 102 }),
      mockTab(310, 2, "PR #26 - Privacy copy", "github.com", "/tover0314-w/tabpilot/pull/26", { groupId: 102 }),
      mockTab(311, 2, "PR #29 - Dashboard apply", "github.com", "/tover0314-w/tabpilot/pull/29", { groupId: 102 }),
      mockTab(312, 2, "GitHub Actions checks", "github.com", "/tover0314-w/tabpilot/actions", { groupId: 102, audible: true }),
      mockTab(313, 2, "Issue triage", "github.com", "/tover0314-w/tabpilot/issues", { groupId: 102 }),
      mockTab(314, 2, "Review comment thread", "github.com", "/tover0314-w/tabpilot/pull/31", { groupId: 102 }),
      mockTab(315, 2, "Release branch compare", "github.com", "/tover0314-w/tabpilot/compare", { groupId: 102 }),
      mockTab(316, 3, "Knowledge worker survey", "forms.gle", "/mock-survey", { groupId: 103 }),
      mockTab(317, 3, "Tab fatigue interview notes", "notion.so", "/workspace/interviews", { groupId: 103 }),
      mockTab(318, 3, "Chrome productivity reviews", "chromewebstore.google.com", "/detail/mock", { groupId: 103 }),
      mockTab(319, 3, "AI tab manager article", "example.com", "/article/ai-tabs", { groupId: 103 }),
      mockTab(320, 3, "Desk research board", "miro.com", "/app/board/mock", { groupId: 103 }),
      mockTab(321, 3, "Research synthesis", "docs.google.com", "/document/d/mock-synthesis", { groupId: 103 }),
      mockTab(322, 1, "TabMosaic dashboard design", "figma.com", "/file/mock", { groupId: 104 }),
      mockTab(323, 1, "Monochrome dashboard cards", "dribbble.com", "/shots/mock-cards", { groupId: 104 }),
      mockTab(324, 1, "Sidebar pattern reference", "mobbin.com", "/patterns/sidebar", { groupId: 104 }),
      mockTab(325, 1, "Command palette examples", "raycast.com", "/design", { groupId: 104 }),
      mockTab(326, 1, "Typography sample", "typewolf.com", "/site-of-the-day", { groupId: 104 }),
      mockTab(327, 2, "chrome.sidePanel API", "developer.chrome.com", "/docs/extensions/reference/api/sidePanel", { groupId: 105 }),
      mockTab(328, 2, "chrome.tabs API", "developer.chrome.com", "/docs/extensions/reference/api/tabs", { groupId: 105 }),
      mockTab(329, 2, "chrome.tabGroups API", "developer.chrome.com", "/docs/extensions/reference/api/tabGroups", { groupId: 105 }),
      mockTab(330, 2, "MV3 service worker lifecycle", "developer.chrome.com", "/docs/extensions/develop/concepts/service-workers", { groupId: 105 }),
      mockTab(331, 3, "How teams manage context switching", "example.com", "/blog/context-switching", { groupId: 106 }),
      mockTab(332, 3, "Browser extension growth notes", "example.com", "/article/extension-growth", { groupId: 106 }),
      mockTab(333, 3, "Tab overload and focus", "example.com", "/research/tab-overload", { groupId: 106, discarded: true })
    ]
  }
};

const MOCK_RULES = [
  {
    id: "rule-1",
    type: "domain",
    pattern: "github.com/*/pull/*",
    targetGroupName: "Code Review",
    enabled: true,
    createdFrom: "chat-refine",
    hitCount: 12,
    lastUsedAt: "2026-06-14T09:12:00.000Z"
  },
  {
    id: "rule-2",
    type: "domain",
    pattern: "docs.google.com",
    targetGroupName: "Product Planning",
    enabled: true,
    createdFrom: "chat-refine",
    hitCount: 8,
    lastUsedAt: "2026-06-14T08:40:00.000Z"
  },
  {
    id: "rule-3",
    type: "protected",
    protectionScope: "domain",
    pattern: "supabase.com",
    enabled: true,
    createdFrom: "sidebar-protect",
    hitCount: 3,
    lastUsedAt: "2026-06-14T07:18:00.000Z"
  }
];

const MOCK_AI_SETTINGS = {
  enabled: true,
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
  apiKey: "mock-redacted-key"
};

const MOCK_SEARCH_DIAGNOSTICS = {
  status: "completed",
  provider: "tavily",
  providerLabel: "Tavily",
  enabled: true,
  configured: true,
  apiKeyStatus: "saved",
  baseOrigin: "https://api.tavily.com",
  permissionOrigin: "https://api.tavily.com/*",
  maxResults: 3,
  searchDepth: "basic",
  resultCount: 3,
  errorType: "",
  checkedAt: "2026-06-14T00:00:00.000Z",
  privacy: {
    sentQuery: true,
    sentTabData: false,
    sentPageText: false,
    sentFullUrls: false,
    storedResults: false,
    storedQuery: false,
    storedApiKey: false
  }
};

const MOCK_SEARCH_SETTINGS = {
  enabled: true,
  provider: "tavily",
  baseUrl: "https://api.tavily.com",
  apiKey: "mock-redacted-search-key",
  maxResults: 3,
  searchDepth: "basic",
  includeAnswer: true
};

const MOCK_AGENT_TASKS = [
  {
    id: "task-launch-checklist",
    title: "Review private beta launch checklist",
    status: "open",
    source: "tab_work_state_later",
    createdAt: "2026-06-14T00:00:00.000Z",
    updatedAt: "2026-06-14T00:00:00.000Z",
    tabIds: [307],
    tabs: [
      {
        id: 307,
        windowId: 1,
        groupId: 101,
        groupName: "Product Planning",
        title: "Launch checklist",
        hostname: "docs.google.com",
        path: "/spreadsheet/d/mock-launch",
        active: false,
        pinned: false,
        audible: false
      }
    ],
    checklist: ["Confirm store listing copy", "Run final QA", "Prepare beta notes"],
    checklistMeta: [
      { sourceNote: "Chrome Web Store copy" },
      { sourceNote: "QA checklist tab" },
      { sourceNote: "Beta notes memo" }
    ]
  }
];

const MOCK_SAVED_COLLECTIONS = [
  {
    id: "collection-beta-launch",
    name: "Beta launch references",
    source: "dashboard_selection",
    createdAt: "2026-06-14T00:00:00.000Z",
    updatedAt: "2026-06-14T00:00:00.000Z",
    tabIds: [303, 307],
    tabs: [
      {
        id: 303,
        windowId: 1,
        groupId: 101,
        groupName: "Product Planning",
        title: "MVP private beta checklist",
        hostname: "linear.app",
        path: "/acme/project/tabmosaic",
        active: false,
        pinned: false,
        audible: false
      },
      {
        id: 307,
        windowId: 1,
        groupId: 101,
        groupName: "Product Planning",
        title: "Launch checklist",
        hostname: "docs.google.com",
        path: "/spreadsheet/d/mock-launch",
        active: false,
        pinned: false,
        audible: false
      }
    ]
  }
];

const MOCK_SAVED_MEMOS = [
  {
    id: "memo-beta-pricing",
    title: "Beta launch pricing memo",
    source: "research_brief",
    tags: ["launch", "pricing"],
    body: [
      "The saved research brief says the beta checklist should remain the launch source of truth.",
      "Hosted AI/search cost is still the biggest pricing assumption.",
      "Office workflow research supports positioning around tab overload and unfinished work."
    ].join("\n"),
    createdAt: "2026-06-14T00:00:00.000Z",
    updatedAt: "2026-06-15T00:00:00.000Z",
    sources: [
      {
        title: "MVP private beta checklist",
        hostname: "linear.app",
        path: "/acme/project/tabmosaic",
        snippet: "Launch checklist and QA gates.",
        sourceType: "source_note"
      },
      {
        title: "Pricing notes",
        hostname: "docs.google.com",
        path: "/document/d/pricing",
        snippet: "Hosted AI/search cost remains unresolved.",
        sourceType: "source_note"
      }
    ]
  }
];

const MOCK_SAVED_WORKSPACES = [
  {
    id: "workspace-private-beta",
    name: "Private beta launch workspace",
    source: "manual_save",
    createdAt: "2026-06-14T00:00:00.000Z",
    updatedAt: "2026-06-14T00:00:00.000Z",
    summary: {
      tabCount: 8,
      groupCount: 2
    },
    groups: [
      { id: 101, name: "Product Planning", color: "blue", tabCount: 8 },
      { id: 102, name: "Code Review", color: "green", tabCount: 7 }
    ],
    tabs: [
      {
        id: 307,
        windowId: 1,
        groupId: 101,
        groupName: "Product Planning",
        title: "Launch checklist",
        hostname: "docs.google.com",
        path: "/spreadsheet/d/mock-launch"
      }
    ]
  }
];

const MOCK_TAB_WORK_STATES = {
  "307": {
    state: "later",
    tabId: 307,
    title: "Launch checklist",
    hostname: "docs.google.com",
    path: "/spreadsheet/d/mock-launch",
    source: "dashboard_tab_row",
    updatedAt: "2026-06-14T00:00:00.000Z"
  }
};

function mockTab(id, windowId, title, hostname, path, overrides = {}) {
  return {
    id,
    windowId,
    title,
    hostname,
    path,
    favIconUrl: mockFaviconDataUrl(hostname),
    urlScheme: "https",
    active: false,
    pinned: false,
    audible: false,
    discarded: false,
    protectedReasons: [],
    groupId: -1,
    ...overrides
  };
}

function mockFaviconDataUrl(hostname) {
  const colors = ["#2f7469", "#4c6fff", "#a14c89", "#b4762a", "#5a6978", "#3f7f4d"];
  const cleanHost = String(hostname || "tab").replace(/^www\./, "");
  const label = (cleanHost.charAt(0) || "t").toUpperCase();
  const color = colors[Math.abs(hashString(cleanHost)) % colors.length];
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">',
    `<rect width="32" height="32" rx="7" fill="${color}"/>`,
    `<text x="16" y="21" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#fff">${label}</text>`,
    "</svg>"
  ].join("");

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

async function main() {
  const { chromium } = resolvePlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const output = [];

  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const pages = [
      {
        name: "sidepanel-idle.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        currentRun: {
          status: "idle",
          message: "Click Smart Organize to group your work tabs."
        },
        readySelector: ".chat-thread-message.assistant.run-idle .run-message-card"
      },
      {
        name: "sidepanel-result.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en"
      },
      {
        name: "sidepanel-classification-refinements.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.waitForSelector(".classification-refinements summary", { timeout: 5000 });
          await page.locator(".classification-refinements summary").click();
          await page.waitForSelector(".classification-refinement-list", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = 120;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-classification-refinement-preview.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.waitForSelector("#chatInput", { timeout: 5000 });
          await page.fill("#chatInput", "preview refinements");
          await page.click("#chatSendButton");
          await page.waitForSelector(".chat-thread-message.assistant.regroup-preview", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-ai-triage.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.waitForSelector(".chat-thread-message.assistant.run-completed", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = 80;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-ai-triage-todo.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.waitForSelector('[data-chat-action="todo-ai-triage"]', { timeout: 5000 });
          await page.locator('[data-chat-action="todo-ai-triage"]').click();
          await page.waitForSelector(".chat-thread-message.assistant.todo-created", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-workspace-goal.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.waitForSelector('[data-chat-action="set-workspace-goal"]', { timeout: 5000 });
          await page.locator('[data-chat-action="set-workspace-goal"]').click();
          await page.waitForSelector(".chat-thread-message.assistant.workspace-goal", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-chat.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("What content does this page have?");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.user", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.summary", { timeout: 5000 });
          await page.locator("#chatInput").fill("What should I check before changing database settings?");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForFunction(
            () => document.querySelectorAll(".chat-thread-message.assistant.summary").length >= 2,
            null,
            { timeout: 5000 }
          );
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-composer-picker.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#pageRegionButton").click();
          await page.waitForSelector("#composerPicker:not([hidden])", { timeout: 5000 });
        }
      },
      {
        name: "sidepanel-at-context-picker.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("@");
          await page.waitForSelector('#composerPicker[data-trigger="mention"]:not([hidden])', { timeout: 5000 });
        }
      },
      {
        name: "sidepanel-template-picker.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#pageRegionButton").click();
          await page.waitForSelector("#composerPicker:not([hidden])", { timeout: 5000 });
          await page.locator('[data-picker-action="templates"]').click();
          await page.waitForSelector('[data-template-id="cleanup-tabs"]', { timeout: 5000 });
        }
      },
      {
        name: "sidepanel-template-visual-review.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#pageRegionButton").click();
          await page.waitForSelector("#composerPicker:not([hidden])", { timeout: 5000 });
          await page.locator('[data-picker-action="templates"]').click();
          await page.waitForSelector('[data-template-id="visual-review"]', { timeout: 5000 });
        }
      },
      {
        name: "sidepanel-context-picker-selected-tabs.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [301, 302, 303, 304],
          tabCount: 4,
          windowId: 1,
          title: "Selected planning tabs",
          groupName: "Product Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#pageRegionButton").click();
          await page.waitForSelector("#composerPicker:not([hidden])", { timeout: 5000 });
        }
      },
      {
        name: "sidepanel-composer-context-chips.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          windowId: 1,
          title: "Launch readiness tabs",
          hostname: "docs.google.com, github.com",
          tabCount: 3,
          tabIds: [301, 302, 303],
          source: "dashboard",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("search web for browser work agent https://example.com/research");
          await page.waitForSelector(".composer-context-chip.link", { timeout: 5000 });
          await page.waitForSelector(".composer-context-chip.search", { timeout: 5000 });
        }
      },
      {
        name: "sidepanel-model-router.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "current_tab",
          tabId: 301,
          windowId: 1,
          title: "Supabase database settings",
          hostname: "supabase.com",
          source: "screenshot-fixture",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("search the web for browser work agent");
          await page.locator("#pageRegionButton").click();
          await page.waitForSelector("#composerPicker:not([hidden])", { timeout: 5000 });
          await page.waitForFunction(
            () => document.querySelector(".composer-router-hint strong")?.textContent?.includes("Search Tool route"),
            null,
            { timeout: 5000 }
          );
        }
      },
      {
        name: "sidepanel-translation-assistant.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("translate selected text");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.summary", { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-selected-text-writing.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("rewrite selected text to be clearer");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.summary [data-chat-action=\"copy-writing-draft\"]", { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-saved-source-writing.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Draft a concise project update from saved sources about pricing.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.summary [data-chat-action=\"copy-writing-draft\"]", { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-saved-source-research-brief.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Create a research brief from saved sources about pricing.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.summary .research-brief-action-row", { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-saved-source-decision-brief.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Create a decision brief from saved sources about pricing.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.summary .decision-brief-action-row", { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "quick-rail-page.png",
        path: "/quick-rail-fixture.html",
        viewport: { width: 900, height: 640 },
        fullPage: false,
        language: "en",
        readySelector: "#tabmosaic-quick-rail-root"
      },
      {
        name: "sidepanel-context-tabs.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [301, 302, 303, 304, 305, 306, 307, 308],
          tabCount: 8,
          windowId: 1,
          title: "Selected planning tabs",
          groupName: "Product Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-11T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("What are these selected tabs about?");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.context-summary", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-context-tabs-writing.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [303, 304, 305, 306],
          tabCount: 4,
          windowId: 1,
          title: "Selected launch tabs",
          groupName: "Launch Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-15T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Draft a concise project update from these selected tabs.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.context-summary [data-chat-action=\"copy-writing-draft\"]", { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.context-summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-run-transcript.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [301, 302, 303, 304, 305, 306, 307, 308],
          tabCount: 8,
          windowId: 1,
          title: "Selected planning tabs",
          groupName: "Product Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-11T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("What are these selected tabs about?");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.context-summary", { timeout: 5000 });
          await page.waitForSelector('[data-chat-action="show-run-transcript"]', { timeout: 5000 });
          await page.locator('[data-chat-action="show-run-transcript"]').first().click();
          await page.waitForSelector(".chat-thread-message.assistant.run-transcript", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-compare-tabs.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [303, 304, 305, 306],
          tabCount: 4,
          windowId: 1,
          title: "Selected launch tabs",
          groupName: "Launch Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Compare these selected tabs. Which one should guide launch?");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.context-summary table", { timeout: 5000 });
          await page.waitForSelector('[data-chat-action="todo-compare-result"]', { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.context-summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop + element.offsetHeight - thread.clientHeight + 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-research-brief.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [303, 304, 305, 306],
          tabCount: 4,
          windowId: 1,
          title: "Selected launch tabs",
          groupName: "Launch Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Create a research brief from these selected sources.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.context-summary", { timeout: 5000 });
          await page.waitForSelector('[data-chat-action="todo-research-brief"]', { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.context-summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop + element.offsetHeight - thread.clientHeight + 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-research-addendum.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [303, 304, 305, 306],
          tabCount: 4,
          windowId: 1,
          title: "Selected launch tabs",
          groupName: "Launch Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Create a research brief from these selected sources.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.context-summary", { timeout: 5000 });
          await page.waitForSelector('[data-chat-action="research-brief-missing"]', { timeout: 5000 });
          await page.locator('[data-chat-action="research-brief-missing"]').click();
          await page.waitForSelector(".chat-thread-message.assistant.research-addendum .research-addendum-message", { timeout: 5000 });
          await page.waitForFunction(
            () => document.querySelector(".chat-thread-message.assistant.research-addendum")?.textContent?.includes("focused Search Tool queries"),
            null,
            { timeout: 5000 }
          );
          await page.waitForTimeout(160);
          await page.locator(".chat-thread-message.assistant.research-addendum").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-decision-brief.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [303, 304, 305, 306],
          tabCount: 4,
          windowId: 1,
          title: "Selected launch tabs",
          groupName: "Launch Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Create a decision brief from these selected sources.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.context-summary table", { timeout: 5000 });
          await page.waitForSelector('[data-chat-action="todo-decision-brief"]', { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.context-summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop + element.offsetHeight - thread.clientHeight + 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-decision-addendum.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [303, 304, 305, 306],
          tabCount: 4,
          windowId: 1,
          title: "Selected launch tabs",
          groupName: "Launch Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Create a decision brief from these selected sources.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.context-summary", { timeout: 5000 });
          await page.waitForSelector('[data-chat-action="decision-brief-missing"]', { timeout: 5000 });
          await page.waitForFunction(
            () => {
              const button = document.querySelector('[data-chat-action="decision-brief-missing"]');
              return button && !button.disabled;
            },
            null,
            { timeout: 5000 }
          );
          const decisionMissingButton = page.locator('[data-chat-action="decision-brief-missing"]');
          await decisionMissingButton.scrollIntoViewIfNeeded();
          await decisionMissingButton.focus();
          await page.keyboard.press("Enter");
          await page.waitForSelector(".chat-thread-message.assistant.research-addendum .research-addendum-message", { timeout: 5000 });
          await page.waitForFunction(
            () => document.querySelector(".chat-thread-message.assistant.research-addendum")?.textContent?.includes("focused Search Tool queries"),
            null,
            { timeout: 5000 }
          );
          await page.waitForTimeout(160);
          await page.locator(".chat-thread-message.assistant.research-addendum").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-local-memo-search.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [303, 304, 305, 306],
          tabCount: 4,
          windowId: 1,
          title: "Selected launch tabs",
          groupName: "Launch Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Create a research brief from these selected sources.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.context-summary", { timeout: 5000 });
          await page.waitForSelector('[data-chat-action="save-memo"]', { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.context-summary [data-chat-action='save-memo']").first().click();
          await page.waitForSelector(".chat-thread-message.assistant.memo-saved", { timeout: 5000 });
          await page.waitForSelector("#chatInput:not([disabled])", { timeout: 5000 });
          await page.locator("#chatInput").fill("find Launch Planning memo");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.browser-work-search", { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.browser-work-search").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 24);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-create-todo.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [301, 302, 303],
          tabCount: 3,
          windowId: 1,
          title: "Selected planning tabs",
          groupName: "Product Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-13T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("make these tabs a todo");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.todo-created", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-todo-checklist-edit.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("add checklist item: confirm onboarding email copy");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.todo-updated", { timeout: 5000 });
          await page.locator("#chatInput").fill("mark first checklist item done");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForFunction(
            () => document.querySelectorAll(".chat-thread-message.assistant.todo-updated").length >= 2,
            null,
            { timeout: 5000 }
          );
          await page.locator(".chat-thread-message.assistant.todo-updated").last().evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 24);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-todo-targeted-merge.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        sidebarContext: {
          scope: "selected_tabs",
          tabIds: [301, 303, 307],
          tabCount: 3,
          windowId: 1,
          title: "Selected launch tabs",
          groupName: "Product Planning",
          source: "screenshot-fixture",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        agentTasks: [
          MOCK_AGENT_TASKS[0],
          {
            id: "task-pricing-review",
            title: "Review hosted AI pricing",
            status: "open",
            source: "screenshot-fixture",
            createdAt: "2026-06-14T00:00:00.000Z",
            updatedAt: "2026-06-14T00:00:00.000Z",
            tabIds: [304],
            tabs: [
              {
                id: 304,
                windowId: 1,
                groupId: 101,
                groupName: "Product Planning",
                title: "Pricing notes",
                hostname: "notion.so",
                path: "/acme/pricing",
                active: false,
                pinned: false,
                audible: false
              }
            ],
            checklist: ["Check hosted AI/search cost"]
          }
        ],
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("add checklist item to launch checklist todo: confirm onboarding email copy");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.todo-updated", { timeout: 5000 });
          await page.locator("#chatInput").fill("add current context to launch checklist todo");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForFunction(
            () => document.querySelectorAll(".chat-thread-message.assistant.todo-updated").length >= 2,
            null,
            { timeout: 5000 }
          );
          await page.locator(".chat-thread-message.assistant.todo-updated").last().evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 24);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-safe-tab-command.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("save this tab for later");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.safe-command", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-protect-tab-command.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("protect this tab");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.safe-command", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-protect-domain-rule.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("protect docs.google.com domain");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.safe-command", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-tab-state-undo.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("undo");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.run-undone", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-safe-duplicate-close-command.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("close safe duplicates");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.safe-command", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-memory-relief-command.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("reduce memory pressure by sleeping inactive tabs");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.safe-command", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-suggest-group-command.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("suggest group for this tab");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.safe-command", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-browser-work-search.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("find local work launch checklist");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.browser-work-search", { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.browser-work-search").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-work-brief.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        workspaceGoal: {
          text: "Review launch readiness",
          source: "user",
          metadataOnly: false,
          createdAt: "2026-06-14T00:00:00.000Z",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("what should I continue?");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.work-brief", { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.work-brief").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-workspace-chat.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        workspaceGoal: {
          text: "Review launch readiness",
          source: "user",
          metadataOnly: false,
          createdAt: "2026-06-14T00:00:00.000Z",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("summarize my workspace");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.workspace-chat", { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.workspace-chat").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-workspace-inferred-goal.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        workspaceGoal: null,
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("what is my workspace goal?");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForFunction(
            () => document.querySelector(".chat-thread-message.assistant.workspace-goal")?.textContent?.includes("Based on local todos"),
            null,
            { timeout: 5000 }
          );
          await page.locator(".chat-thread-message.assistant.workspace-goal").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-goal-todo.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        workspaceGoal: {
          text: "Review launch readiness",
          source: "user",
          metadataOnly: false,
          createdAt: "2026-06-14T00:00:00.000Z",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("make goal a todo");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.todo-created", { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.todo-created").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-page-checklist-todo.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("make this page a checklist todo");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForFunction(
            () => document.querySelectorAll(".chat-thread-message.assistant.todo-created").length >= 1,
            null,
            { timeout: 7000 }
          );
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-page-review.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Review this page for risks and next steps.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.summary .markdown-message", { timeout: 7000 });
          await page.waitForSelector('[data-chat-action="todo-page-review"]', { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop + element.offsetHeight - thread.clientHeight + 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-screenshot-vision.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Analyze this screenshot for risks.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card .agent-tool-card.screenshot-tool.completed", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.summary .markdown-message", { timeout: 5000 });
          await page.waitForFunction(
            () => document.querySelector(".chat-thread-message.assistant.summary")?.textContent?.includes("Observations"),
            null,
            { timeout: 5000 }
          );
          await page.locator(".chat-thread-message.assistant.summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-screenshot-research-brief.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Create a research brief from this screenshot.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card .agent-tool-card.screenshot-tool.completed", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.summary .research-brief-action-row", { timeout: 5000 });
          await page.waitForFunction(
            () => document.querySelector(".chat-thread-message.assistant.summary")?.textContent?.includes("Findings"),
            null,
            { timeout: 5000 }
          );
          await page.locator(".chat-thread-message.assistant.summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-screenshot-decision-brief.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Create a decision brief from this screenshot.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card .agent-tool-card.screenshot-tool.completed", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.summary .decision-brief-action-row", { timeout: 5000 });
          await page.waitForFunction(
            () => document.querySelector(".chat-thread-message.assistant.summary")?.textContent?.includes("Recommendation"),
            null,
            { timeout: 5000 }
          );
          await page.locator(".chat-thread-message.assistant.summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-link-understanding.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("https://example.com/research/browser-work-agent?utm_source=test#section");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.link-detected", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-page-region-vision.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.evaluate(() => {
            for (const message of document.querySelectorAll(".chat-thread-message")) {
              message.remove();
            }
            const primaryMessage = document.querySelector(".agent-primary-message");
            if (primaryMessage) primaryMessage.hidden = true;
            const statusPanel = document.querySelector("#statusPanel");
            if (statusPanel) statusPanel.innerHTML = "";
            const metricsGrid = document.querySelector("#metricsGrid");
            if (metricsGrid) metricsGrid.innerHTML = "";
          });
          await page.locator("#chatInput").fill("ask this page region: what visual risks are here?");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card .agent-tool-card.page-region-tool.completed", { timeout: 5000 });
          await page.waitForFunction(
            () => document.querySelector(".chat-thread-message.assistant.summary")?.textContent?.includes("cropped image"),
            null,
            { timeout: 5000 }
          );
          await page.evaluate(() => {
            const primaryMessage = document.querySelector(".agent-primary-message");
            if (primaryMessage) primaryMessage.hidden = true;
            for (const message of document.querySelectorAll(".chat-thread-message")) {
              const text = message.textContent || "";
              if (
                !text.includes("what visual risks are here") &&
                !text.includes("Region selected") &&
                !text.includes("cropped image")
              ) {
                message.remove();
              }
            }
          });
          await page.locator(".chat-thread-message.assistant.summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-smart-fill-lite.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("extract this table from selected region and classify rows");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.summary table", { timeout: 5000 });
          await page.waitForSelector('[data-chat-action="copy-smart-fill-table"]', { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.summary").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 16);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-contextual-writing.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("Draft a reply from this page for my teammate.");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.summary .markdown-message", { timeout: 5000 });
          await page.waitForSelector('[data-chat-action="copy-writing-draft"]', { timeout: 5000 });
          await page.locator('[data-chat-action="copy-writing-draft"]').evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            const buttonRect = element.getBoundingClientRect();
            const threadRect = thread.getBoundingClientRect();
            thread.scrollTop += Math.max(0, buttonRect.bottom - threadRect.bottom + 20);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-link-fetch.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("https://example.com/research/browser-work-agent?utm_source=test#section");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.link-detected", { timeout: 5000 });
          await page.locator('[data-chat-action="fetch-detected-link"]').first().click();
          await page.waitForSelector(".chat-thread-message.assistant.tool-card .agent-tool-card.completed", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.link-fetched .link-fetched-message", { timeout: 5000 });
          await page.locator(".chat-thread-message.assistant.link-fetched").evaluate((element) => {
            const thread = document.querySelector(".agent-thread");
            if (!thread) return;
            thread.scrollTop = Math.max(0, element.offsetTop - 20);
            thread.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-web-search.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("search the web for browser work agent");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant .web-search-message", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-search-results-decision-brief.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("search the web for browser work agent");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant .web-search-message", { timeout: 5000 });
          await page.waitForSelector('[data-chat-action="decision-from-search-results"]', { timeout: 5000 });
          await page.locator('[data-chat-action="decision-from-search-results"]').click();
          await page.waitForSelector(".chat-thread-message.assistant.summary .markdown-message", { timeout: 5000 });
          await page.waitForSelector('[data-chat-action="decision-brief-missing"]', { timeout: 5000 });
          await page.waitForFunction(
            () => document.querySelector(".chat-thread-message.assistant.summary")?.textContent?.includes("Recommendation"),
            null,
            { timeout: 5000 }
          );
          await page.locator(".chat-thread-message.assistant.summary").last().evaluate((element) => {
            element.scrollIntoView({ block: "start", inline: "nearest" });
            const thread = document.querySelector(".agent-thread");
            thread?.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-search-result-todo.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("search the web for browser work agent");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant .web-search-message", { timeout: 5000 });
          await page.locator('[data-chat-action="todo-search-result"]').first().click();
          await page.waitForSelector(".chat-thread-message.assistant.todo-created", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-web-search-setup.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        webSearchMode: "not-configured",
        beforeScreenshot: async (page) => {
          await page.locator("#chatInput").fill("search the web for browser work agent");
          await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
          await page.waitForSelector(".chat-thread-message.assistant.tool-card", { timeout: 5000 });
          await page.waitForSelector(".chat-thread-message.assistant.search-provider-needed", { timeout: 5000 });
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "sidepanel-10-turn-chat.png",
        path: "/sidepanel.html",
        viewport: SIDEPANEL_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          for (const question of TEN_TURN_PAGE_QUESTIONS) {
            await page.locator("#chatInput").fill(question);
            await page.locator("#chatForm").evaluate((form) => form.requestSubmit());
            try {
              await page.waitForFunction(
                () => {
                  const input = document.querySelector("#chatInput");
                  const messages = Array.from(document.querySelectorAll(".chat-thread-message"));
                  const lastMessage = messages[messages.length - 1];

                  return Boolean(
                    input &&
                      !input.disabled &&
                      input.value === "" &&
                      lastMessage?.classList.contains("assistant") &&
                      lastMessage?.classList.contains("summary")
                  );
                },
                null,
                { timeout: 7000 }
              );
            } catch (error) {
              const diagnostic = await page.evaluate(() => {
                const messages = Array.from(document.querySelectorAll(".chat-thread-message"));
                const lastMessage = messages[messages.length - 1];
                const input = document.querySelector("#chatInput");

                return {
                  count: messages.length,
                  inputDisabled: Boolean(input?.disabled),
                  inputValue: input?.value || "",
                  lastClass: lastMessage?.className || "",
                  lastText: lastMessage?.textContent?.replace(/\s+/g, " ").trim().slice(0, 220) || ""
                };
              });
              throw new Error(
                `10-turn sidepanel screenshot timed out after question: ${question}\n${JSON.stringify(diagnostic)}`
              );
            }
          }
          await page.locator(".agent-thread").evaluate((element) => {
            element.scrollTop = element.scrollHeight;
            element.dispatchEvent(new Event("scroll", { bubbles: true }));
          });
        }
      },
      {
        name: "dashboard-overview.png",
        path: "/dashboard.html",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en"
      },
      {
        name: "dashboard-continue.png",
        path: "/dashboard.html",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en",
        workspaceGoal: {
          text: "Review launch readiness",
          source: "user",
          metadataOnly: true,
          createdAt: "2026-06-14T00:00:00.000Z",
          updatedAt: "2026-06-14T00:00:00.000Z"
        },
        beforeScreenshot: async (page) => {
          await page.waitForSelector("#dashboardContinue:not([hidden])", { timeout: 5000 });
        }
      },
      {
        name: "dashboard-selected-tabs.png",
        path: "/dashboard.html",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          const checkboxes = page.locator('[data-window-id="1"] [data-tab-select]');
          await checkboxes.nth(0).check();
          await checkboxes.nth(1).check();
          await page.waitForSelector("#chatSelectedTabsButton:not([hidden])", { timeout: 5000 });
        }
      },
      {
        name: "dashboard-tab-states.png",
        path: "/dashboard.html",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en",
        tabWorkStates: {
          301: {
            state: "keep",
            tabId: 301,
            title: "Q3 planning doc",
            hostname: "docs.google.com",
            path: "/document/d/mock-planning",
            source: "screenshot-fixture",
            updatedAt: "2026-06-14T00:00:00.000Z"
          }
        },
        beforeScreenshot: async (page) => {
          await page.waitForSelector(".dashboard-tab-work summary", { timeout: 5000 });
          await page.locator(".dashboard-tab-work summary").first().click();
        }
      },
      {
        name: "dashboard-workbench.png",
        path: "/dashboard.html",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.waitForFunction(
            () =>
              document.querySelector(".dashboard-agent-workbench")?.hidden === true &&
              document.querySelector(".dashboard-rail")?.hidden === true &&
              document.querySelectorAll(".dashboard-group-card").length >= 2,
            null,
            { timeout: 5000 }
          );
        }
      },
      {
        name: "dashboard-workbench-checklist-editor.png",
        path: "/dashboard.html",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.waitForSelector(".dashboard-agent-workbench", { state: "attached", timeout: 5000 });
          await page.locator(".dashboard-agent-workbench").evaluate((element) => {
            element.hidden = false;
          });
          await page.waitForSelector(".dashboard-agent-checklist-editor", { timeout: 5000 });
          await page.locator('[data-browser-work-action="suggest-checklist"]').first().click();
          await page.waitForFunction(
            () => document.querySelector(".dashboard-agent-checklist-preview")?.textContent?.includes("Validate Hosted AI/search cost"),
            null,
            { timeout: 5000 }
          );
          await page.locator("[data-checklist-add-input]").first().fill("Confirm onboarding email copy");
          await page.locator('[data-browser-work-action="checklist-add"]').first().click();
          await page.waitForFunction(
            () => document.querySelector(".dashboard-agent-checklist-preview")?.textContent?.includes("Confirm onboarding email copy"),
            null,
            { timeout: 5000 }
          );
          await page.locator("[data-checklist-note-input]").last().fill("Onboarding memo");
          await page.locator("[data-checklist-note-input]").last().dispatchEvent("change");
          await page.waitForFunction(
            () => Array.from(document.querySelectorAll("[data-checklist-note-input]")).some((input) => input.value === "Onboarding memo"),
            null,
            { timeout: 5000 }
          );
          await page.locator(".dashboard-agent-checklist-preview li").first().hover();
        }
      },
      {
        name: "dashboard-memory.png",
        path: "/dashboard.html#memory",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en",
        readySelector: ".dashboard-page[data-page=\"memory\"].active .dashboard-memory-row"
      },
      {
        name: "dashboard-rules-memory.png",
        path: "/dashboard.html#rules",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en",
        readySelector: ".dashboard-page[data-page=\"rules\"].active .rule-row.protected",
        beforeScreenshot: async (page) => {
          await page.waitForSelector("#dashboardRuleForm", { timeout: 5000 });
          await page.locator("#dashboardRulePatternInput").fill("linear.app");
          await page.locator("#dashboardRuleTargetInput").fill("Product Work");
          await page.locator("#dashboardRuleForm").evaluate((form) => form.requestSubmit());
          await page.waitForFunction(
            () => Array.from(document.querySelectorAll(".rule-row")).some((row) => row.textContent?.includes("linear.app")),
            null,
            { timeout: 5000 }
          );
          await page.waitForFunction(
            () =>
              document.querySelector("#dashboardRulePatternInput")?.value === "" &&
              document.querySelector("#dashboardRuleTargetInput")?.value === "",
            null,
            { timeout: 5000 }
          );
          await page.locator("#dashboardRuleTargetInput").evaluate((input) => input.blur());
        }
      },
      {
        name: "dashboard-search-settings.png",
        path: "/dashboard.html#settings",
        viewport: DEFAULT_VIEWPORT,
        fullPage: false,
        language: "en",
        beforeScreenshot: async (page) => {
          await page.waitForSelector("#searchSettingsForm", { timeout: 5000 });
          await page.locator("#searchSettingsForm").scrollIntoViewIfNeeded();
        }
      },
      {
        name: "dashboard-mobile.png",
        path: "/dashboard.html",
        viewport: DASHBOARD_MOBILE_VIEWPORT,
        fullPage: false,
        language: "en"
      }
    ];

    for (const item of pages) {
      const page = await newMockedPage(browser, item.viewport, item.language, item);
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") pageErrors.push(message.text());
      });

      await page.goto(`${baseUrl}${item.path}`, { waitUntil: "networkidle" });
      await assertPageReady(page, item.path, item);
      if (item.beforeScreenshot) {
        try {
          await item.beforeScreenshot(page);
        } catch (error) {
          const threadText = await page.locator(".agent-thread").evaluate((element) => element.innerText).catch(() => "");
          const suffix = pageErrors.length ? `\nPage errors:\n${pageErrors.join("\n")}` : "";
          const threadSuffix = threadText ? `\nThread:\n${threadText.slice(0, 2000)}` : "";
          throw new Error(`${item.name} setup failed: ${error.message}${suffix}${threadSuffix}`);
        }
      }

      const screenshotPath = path.join(OUT_DIR, item.name);
      await captureScreenshot(page, screenshotPath, item);

      if (pageErrors.length) {
        throw new Error(`${item.name} page errors:\n${pageErrors.join("\n")}`);
      }

      output.push(path.relative(ROOT_DIR, screenshotPath));
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log("PASS UI screenshots captured");
  for (const file of output) {
    console.log(file);
  }
}

async function captureScreenshot(page, screenshotPath, item) {
  if (item.path === "/sidepanel.html") {
    await assertSidepanelLayoutNotClipped(page, item.name);
  }

  try {
    await page.screenshot({
      path: screenshotPath,
      fullPage: item.fullPage
    });
  } catch (error) {
    await page.screenshot({
      path: screenshotPath,
      fullPage: false
    });
    console.warn(`WARN ${item.name} used viewport screenshot fallback: ${error.message}`);
  }

  const stats = fs.statSync(screenshotPath);
  if (stats.size < 10000) {
    throw new Error(`${item.name} screenshot looks too small (${stats.size} bytes)`);
  }
}

async function assertSidepanelLayoutNotClipped(page, name) {
  const layout = await page.evaluate(() => {
    const rectFor = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        scrollLeft: element.scrollLeft,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth
      };
    };

    return {
      bodyScrollLeft: document.body.scrollLeft,
      documentScrollLeft: document.documentElement.scrollLeft,
      scrollingElementScrollLeft: document.scrollingElement?.scrollLeft || 0,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      shell: rectFor(".tab-agent-shell"),
      thread: rectFor(".agent-thread"),
      firstMessage: rectFor(".chat-thread-message"),
      composer: rectFor(".agent-composer")
    };
  });

  const horizontalDrift =
    layout.bodyScrollLeft !== 0 ||
    layout.documentScrollLeft !== 0 ||
    layout.scrollingElementScrollLeft !== 0 ||
    layout.shell?.scrollLeft !== 0 ||
    layout.thread?.left < 0 ||
    layout.firstMessage?.left < 0 ||
    layout.composer?.right > layout.bodyClientWidth + 1;

  if (horizontalDrift) {
    throw new Error(`${name} sidepanel layout is horizontally clipped:\n${JSON.stringify(layout, null, 2)}`);
  }
}

function resolvePlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_NODE_MODULE_DIR,
    process.env.NODE_REPL_NODE_MODULE_DIRS?.split(path.delimiter)[0],
    path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules")
  ].filter(Boolean);

  try {
    return require("playwright");
  } catch {
    for (const nodeModulesDir of candidates) {
      const packagePath = path.join(nodeModulesDir, "playwright", "package.json");
      if (fs.existsSync(packagePath)) {
        return createRequire(path.join(nodeModulesDir, "noop.js"))("playwright");
      }
    }
  }

  throw new Error(
    [
      "Playwright is required for UI screenshots.",
      "Install it locally or set PLAYWRIGHT_NODE_MODULE_DIR to a node_modules directory that contains playwright."
    ].join(" ")
  );
}

function startStaticServer() {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, "http://127.0.0.1");
    const pathname = decodeURIComponent(requestUrl.pathname.replace(/^\/+/, "")) || "sidepanel.html";

    if (pathname === "quick-rail-fixture.html") {
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8"
      });
      response.end(buildQuickRailFixtureHtml());
      return;
    }

    const targetPath = path.normalize(path.join(EXTENSION_DIR, pathname));

    if (!targetPath.startsWith(EXTENSION_DIR)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(targetPath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "content-type": contentType(targetPath)
      });
      response.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function buildQuickRailFixtureHtml() {
  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Quick Rail Fixture</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            background: linear-gradient(135deg, #eef6f2, #f8fbfa);
            color: #1f2d29;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          main {
            display: grid;
            align-content: center;
            min-height: 100vh;
            max-width: 640px;
            padding: 56px;
            gap: 18px;
          }

          h1 {
            margin: 0;
            font-size: 42px;
            letter-spacing: 0;
          }

          p {
            max-width: 520px;
            margin: 0;
            color: rgba(31, 45, 41, 0.68);
            font-size: 17px;
            line-height: 1.58;
          }

          .mock-card {
            display: grid;
            gap: 8px;
            max-width: 520px;
            padding: 18px;
            border: 1px solid rgba(33, 47, 43, 0.08);
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.62);
            box-shadow: 0 16px 36px rgba(29, 45, 41, 0.08);
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Project notes</h1>
          <p>This mock page is only used to verify the TabMosaic quick rail. The rail should stay compact, right-aligned, and separate from page content.</p>
          <section class="mock-card">
            <strong>Visible page context</strong>
            <span>Clicking a rail action opens the Sidebar with an intent. It does not read this text by itself.</span>
          </section>
        </main>
        <script src="/page_quick_rail.js"></script>
      </body>
    </html>`;
}

function contentType(filePath) {
  const extension = path.extname(filePath);
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".js") return "text/javascript; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".json") return "application/json; charset=utf-8";
  if (extension === ".png") return "image/png";
  return "application/octet-stream";
}

async function newMockedPage(browser, viewport, language, options = {}) {
  const page = await browser.newPage({ viewport });
  const messages = readMessages(language);
  const storage = {
    "tabmosaic.currentRun": options.currentRun || MOCK_RUN,
    "tabmosaic.sidebarContext": options.sidebarContext || {
      scope: "current_tab",
      tabId: 901,
      windowId: 1,
      title: "Settings | Database | ai-music | Supabase",
      hostname: "supabase.com",
      source: "browser",
      updatedAt: "2026-06-11T00:00:00.000Z"
    },
    "tabmosaic.userRules": MOCK_RULES,
    "tabmosaic.aiSettings": MOCK_AI_SETTINGS,
    "tabmosaic.searchSettings": options.searchSettings || MOCK_SEARCH_SETTINGS,
    "tabmosaic.agentTasks": options.agentTasks || MOCK_AGENT_TASKS,
    "tabmosaic.savedCollections": options.savedCollections || MOCK_SAVED_COLLECTIONS,
    "tabmosaic.savedMemos": options.savedMemos || MOCK_SAVED_MEMOS,
    "tabmosaic.savedWorkspaces": options.savedWorkspaces || MOCK_SAVED_WORKSPACES,
    "tabmosaic.agentRunTranscripts": options.agentRunTranscripts || [],
    "tabmosaic.workspaceGoal": options.workspaceGoal || null,
    "tabmosaic.tabWorkStates": options.tabWorkStates || MOCK_TAB_WORK_STATES,
    "tabmosaic.searchDiagnostics": options.searchDiagnostics || MOCK_SEARCH_DIAGNOSTICS,
    "tabmosaic.errorLog": [],
    "tabmosaic.duplicateSafetyAudit": []
  };

  await page.addInitScript(
    ({ messages, storage, language, webSearchMode, toolSafety, mockSearchDiagnostics }) => {
      const listeners = [];
      const TOOL_SAFETY = toolSafety;
      const MOCK_SEARCH_DIAGNOSTICS = mockSearchDiagnostics;

      function clone(value) {
        return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
      }

      function pick(keys) {
        if (Array.isArray(keys)) {
          return Object.fromEntries(keys.map((key) => [key, clone(storage[key])]));
        }

        if (typeof keys === "string") {
          return { [keys]: clone(storage[keys]) };
        }

        if (keys && typeof keys === "object") {
          return Object.fromEntries(
            Object.keys(keys).map((key) => [key, clone(storage[key] === undefined ? keys[key] : storage[key])])
          );
        }

        return clone(storage) || {};
      }

      function message(key, substitutions = []) {
        let text = messages[key]?.message || key;
        const values = Array.isArray(substitutions) ? substitutions : [substitutions];
        values.forEach((value, index) => {
          text = text.replace(new RegExp(`\\$${index + 1}`, "g"), String(value ?? ""));
        });
        return text;
      }

      function toChromeTab(tab) {
        return {
          ...tab,
          url: tab.hostname ? `https://${tab.hostname}${tab.path || "/"}` : "",
          pendingUrl: ""
        };
      }

      function buildMockCurrentPageSummary(question) {
        const normalized = String(question || "").toLowerCase();
        const answers = [
          {
            match: /what is this page|what content|content does this page|content.*page|\bfor\?*$/,
            text: "This page is the Database settings area for your Supabase ai-music project. It covers connection details, database configuration, backups, pooling, and production-level database controls."
          },
          {
            match: /check before changing|changing database|database settings/,
            text: "Before changing database settings, confirm a recent backup, review pooling and connection limits, and avoid rotating credentials until you know which services use them."
          },
          {
            match: /health signals|important/,
            text: "The main signals are active connections, storage usage, backup status, pooling mode, pending migrations, and whether recovery options are enabled."
          },
          {
            match: /pooling/,
            text: "Do not change pooling immediately. First check whether production services still use direct connections and whether prepared statements are compatible with transaction pooling."
          },
          {
            match: /password|rotate/,
            text: "Password rotation can break production if app secrets are not updated first. Treat it as a coordinated release task, not a casual settings change."
          },
          {
            match: /point-in-time|pitr|recovery/,
            text: "Point-in-time recovery appears to be off, so recent daily backups become more important before risky database changes."
          },
          {
            match: /project|environment/,
            text: "The context is the ai-music production project in Supabase, so the safer default is to prepare and test before changing settings."
          },
          {
            match: /migration/,
            text: "Before the pending migration, confirm a recent backup, test in staging, and check whether the tracks table impact is acceptable for production traffic."
          },
          {
            match: /connection errors/,
            text: "Yes. This page can help diagnose connection errors by showing pooling configuration, direct connection pressure, and connection limits."
          },
          {
            match: /action plan|priority/,
            text: "Priority plan: confirm backups, review direct connections, test pooling and migrations in staging, then coordinate password or production setting changes."
          },
          {
            match: /final decision|change settings|prepare first/,
            text: "Prepare first. The page shows enough production risk that you should verify backups, staging migration behavior, pooling compatibility, and app secrets before changing settings."
          }
        ];
        const match = answers.find((item) => item.match.test(normalized));

        return match?.text || "This page is the Database settings area for your Supabase ai-music project, covering connection details, backups, pooling, migrations, and production database controls.";
      }

      globalThis.chrome = {
        i18n: {
          getUILanguage: () => (language === "zh" ? "zh-CN" : "en-US"),
          getMessage: message
        },
        runtime: {
          getManifest: () => ({
            version: "0.1.0",
            permissions: ["tabs", "tabGroups", "storage", "sidePanel", "scripting", "activeTab"],
            host_permissions: ["https://api.deepseek.com/*"]
          }),
          getURL: (extensionPath) => `/${extensionPath}`,
          onMessage: {
            addListener: (listener) => listeners.push(listener)
          },
          sendMessage: async (request) => {
            if (request?.type === "GET_CURRENT_RUN") {
              return { ok: true, run: clone(storage["tabmosaic.currentRun"]) };
            }

            if (request?.type === "UNDO_LAST") {
              return {
                ok: true,
                run: {
                  status: "undone",
                  source: "tab-state-undo",
                  startedAt: "2026-06-14T00:00:00.000Z",
                  completedAt: "2026-06-14T00:00:01.000Z",
                  message: "Undid the last local tab state change for 1 tab.",
                  summary: {
                    undoAvailable: true,
                    localTabStateUndoAvailable: false,
                    tabStatesRestored: 1,
                    workQueueItemsRemoved: 1
                  }
                }
              };
            }

            if (request?.type === "TEST_AI_CONNECTION") {
              return {
                ok: true,
                result: {
                  modelAvailable: true,
                  model: request.model || "deepseek-v4-flash"
                }
              };
            }

            if (request?.type === "CHECK_SUMMARY_PRIVACY") {
              return {
                ok: true,
                result: {
                  tabId: 901,
                  title: "Settings | Database | ai-music | Supabase",
                  hostname: "supabase.com",
                  requiresConfirmation: false,
                  reason: ""
                }
              };
            }

            if (request?.type === "SUMMARIZE_VISIBLE_SCREENSHOT") {
              if (request.workflow === "research_brief") {
                return {
                  ok: true,
                  summary: {
                    status: "completed",
                    workflow: "research_brief",
                    source: "visible_screenshot",
                    tabId: 901,
                    title: "Settings | Database | ai-music | Supabase",
                    hostname: "supabase.com",
                    question: request.question || "Create a research brief from this screenshot.",
                    summary: "I turned the visible screenshot into a research brief. I used only the current screenshot, tab title, and hostname; I did not read hidden DOM, off-screen page text, full URLs, files, PDFs, saved sources, or web search results.",
                    researchFindings: [
                      "The visible page is a database settings surface, so the work context is operational rather than general reading.",
                      "The screenshot suggests connection, pooling, or credential-adjacent decisions may be in scope.",
                      "This is useful for a first-pass research brief, but not enough for production change approval."
                    ],
                    contradictions: [
                      "The visible screenshot shows risk-sensitive settings, but it does not prove the project environment or backup status."
                    ],
                    missingInformation: [
                      "Whether the project is production, staging, or local development.",
                      "Current backup, rollback, and migration status.",
                      "Which downstream apps depend on these database settings."
                    ],
                    recommendations: [
                      "Use the Search Tool only if you need external Supabase docs or current best-practice context.",
                      "Create a local checklist before changing credentials, pooling, or migration-related settings."
                    ],
                    sourceNotes: [
                      "Source: current visible screenshot from Supabase database settings."
                    ],
                    suggestedAction: "review",
                    confidence: 0.72,
                    provider: "openai",
                    aiUsed: true,
                    context: {
                      scope: "visible_screenshot",
                      title: "Visible screenshot",
                      tabCount: 1
                    },
                    toolCard: {
                      toolName: "analyze_visible_screenshot",
                      label: "Analyze screenshot",
                      scope: {
                        type: "visible_screenshot",
                        requestedTabCount: 1,
                        readTabCount: 1,
                        skippedTabCount: 0,
                        maxTabs: 1
                      },
                      dataUsed: ["visible_screenshot_image", "title", "hostname"],
                      storage: "session_only",
                      status: "completed",
                      skippedReasons: [],
                      toolPermissions: ["capture_visible_screenshot_after_user_click"],
                      toolPermissionLabels: ["Capture visible screenshot after user click"],
                      blockedActions: ["auto_submit", "mutate_page", "insert_text", "close_tabs", "web_search", "full_url_upload", "cloud_storage"],
                      blockedActionLabels: ["No form submit", "No page edits", "No text insertion", "No tab closing", "No web search"]
                    },
                    privacy: {
                      sentTabMetadata: true,
                      sentPageText: false,
                      sentScreenshot: true,
                      sentFullUrls: false,
                      storedCloud: false
                    }
                  }
                };
              }

              if (request.workflow === "decision_brief") {
                return {
                  ok: true,
                  summary: {
                    status: "completed",
                    workflow: "decision_brief",
                    source: "visible_screenshot",
                    tabId: 901,
                    title: "Settings | Database | ai-music | Supabase",
                    hostname: "supabase.com",
                    question: request.question || "Create a decision brief from this screenshot.",
                    summary: "I turned the visible screenshot into a decision brief. I used only the current screenshot, tab title, and hostname; I did not read hidden DOM, off-screen page text, or the full URL.",
                    recommendation: "Do not change database settings from this screen yet. Prepare a short review checklist first, then confirm environment, backups, and dependent services.",
                    decisionCriteria: [
                      "Production safety",
                      "Rollback readiness",
                      "Visible evidence quality"
                    ],
                    comparisonRows: [
                      {
                        title: "Visible screenshot",
                        bestFor: "Visual risk triage",
                        evidence: "The screen shows database configuration controls and connection-related settings.",
                        watchOut: "Off-screen settings, backup status, and dependent services are not visible."
                      }
                    ],
                    tradeoffs: [
                      "Screenshot evidence is fast, but it is thinner than visible page text or a saved source."
                    ],
                    assumptions: [
                      "This is a real project settings page and may affect production-like infrastructure."
                    ],
                    missingInformation: [
                      "Whether this project is production or staging.",
                      "Current backup and rollback status."
                    ],
                    recommendations: [
                      "Create a checklist for environment, backup, pooling, and credential-owner confirmation."
                    ],
                    sourceNotes: [
                      "Source: current visible screenshot from Supabase database settings."
                    ],
                    suggestedAction: "review",
                    confidence: 0.74,
                    provider: "openai",
                    aiUsed: true,
                    context: {
                      scope: "visible_screenshot",
                      title: "Visible screenshot",
                      tabCount: 1
                    },
                    toolCard: {
                      toolName: "analyze_visible_screenshot",
                      label: "Analyze screenshot",
                      scope: {
                        type: "visible_screenshot",
                        requestedTabCount: 1,
                        readTabCount: 1,
                        skippedTabCount: 0,
                        maxTabs: 1
                      },
                      dataUsed: ["visible_screenshot_image", "title", "hostname"],
                      storage: "session_only",
                      status: "completed",
                      skippedReasons: [],
                      toolPermissions: ["capture_visible_screenshot_after_user_click"],
                      toolPermissionLabels: ["Capture visible screenshot after user click"],
                      blockedActions: ["auto_submit", "mutate_page", "insert_text", "close_tabs", "web_search", "full_url_upload", "cloud_storage"],
                      blockedActionLabels: ["No form submit", "No page edits", "No text insertion", "No tab closing", "No web search"]
                    },
                    privacy: {
                      sentTabMetadata: true,
                      sentPageText: false,
                      sentScreenshot: true,
                      sentFullUrls: false,
                      storedCloud: false
                    }
                  }
                };
              }

              return {
                ok: true,
                summary: {
                  status: "completed",
                  workflow: "screenshot_vision",
                  source: "visible_screenshot",
                  tabId: 901,
                  title: "Settings | Database | ai-music | Supabase",
                  hostname: "supabase.com",
                  question: request.question || "Analyze this screenshot.",
                  summary: "The screenshot shows a database settings page with operational controls, connection details, and risk-sensitive configuration areas. Treat it as a review surface before changing production settings.",
                  keyPoints: [
                    "The visible page is focused on database configuration rather than general documentation.",
                    "Connection and pooling controls are the most likely areas to verify before a production change.",
                    "The screenshot itself was used as context; no hidden DOM or full URL is part of this answer."
                  ],
                  visualRisks: [
                    "Some details may be off-screen, so verify backups and environment before acting."
                  ],
                  nextSteps: [
                    "Check whether this is production or staging.",
                    "Review backup and pooling settings before changing credentials."
                  ],
                  suggestedAction: "review",
                  confidence: 0.72,
                  provider: "openai",
                  aiUsed: true,
                  toolCard: {
                    toolName: "analyze_visible_screenshot",
                    label: "Analyze screenshot",
                    scope: {
                      type: "visible_screenshot",
                      requestedTabCount: 1,
                      readTabCount: 1,
                      skippedTabCount: 0,
                      maxTabs: 1
                    },
                    dataUsed: ["visible_screenshot_image", "title", "hostname"],
                    storage: "session_only",
                    status: "completed",
                    skippedReasons: [],
                    toolPermissions: ["capture_visible_screenshot_after_user_click"],
                    toolPermissionLabels: ["Capture visible screenshot after user click"],
                    blockedActions: ["auto_submit", "mutate_page", "insert_text", "web_search", "full_url_upload", "cloud_storage"],
                    blockedActionLabels: ["No form submit", "No page edits", "No text insertion", "No web search"]
                  },
                  privacy: {
                    sentTabMetadata: true,
                    sentPageText: false,
                    sentScreenshot: true,
                    sentFullUrls: false,
                    storedCloud: false
                  }
                }
              };
            }

            if (request?.type === "DRAFT_FROM_SAVED_SOURCES") {
              if (request.workflow === "decision_brief") {
                const sourceCount = Array.isArray(request.sources) ? request.sources.length : 0;
                return {
                  ok: true,
                  summary: {
                    status: "completed",
                    source: "saved_sources",
                    workflow: "decision_brief",
                    provider: "deepseek",
                    aiUsed: true,
                    question: request.question || "Create a decision brief from saved sources",
                    answer: "I compared the saved local sources and turned them into a decision brief. I did not read live pages, search the web, parse files, or change browser state.",
                    summary: "I compared the saved local sources and turned them into a decision brief. I did not read live pages, search the web, parse files, or change browser state.",
                    recommendation: "Keep BYOK as the default open-source path, and validate hosted AI/search cost before publishing paid packaging.",
                    decisionCriteria: [
                      "Open-source adoption should stay easy for technical users.",
                      "Hosted AI/search must have clear cost limits before it becomes part of paid packaging.",
                      "Launch copy should avoid promising cloud convenience until the cost model is proven."
                    ],
                    comparisonRows: [
                      {
                        title: "Launch memo",
                        bestFor: "Launch source of truth",
                        evidence: "Beta readiness depends on a short checklist and visible product screenshots.",
                        watchOut: "Does not answer hosted provider cost."
                      },
                      {
                        title: "Pricing source",
                        bestFor: "Paid packaging risk",
                        evidence: "Hosted AI/search is positioned as convenience, while BYOK remains the open-source default.",
                        watchOut: "Needs real provider/search usage assumptions."
                      }
                    ],
                    tradeoffs: [
                      "BYOK reduces operating cost and fits open source, but makes onboarding less magical.",
                      "Hosted AI improves convenience, but can become expensive without limits."
                    ],
                    assumptions: [
                      "The first open-source release should optimize trust and adoption before paid conversion.",
                      "Hosted search/API usage can be metered later without blocking local BYOK users."
                    ],
                    missingInformation: [
                      "Current hosted AI/search cost per active beta user.",
                      "Whether hosted search should be bundled or metered separately."
                    ],
                    recommendations: [
                      "Ship open-source BYOK first.",
                      "Keep hosted AI/search copy as a paid convenience, not a launch dependency.",
                      "Create one cost-validation task before editing pricing."
                    ],
                    sourceNotes: [
                      "Launch memo: beta checklist remains the launch source of truth.",
                      "Pricing source: hosted AI/search cost still needs validation."
                    ],
                    context: {
                      scope: "saved_sources",
                      title: "Saved sources",
                      tabCount: sourceCount
                    },
                    toolCard: {
                      toolName: "read_saved_local_sources",
                      label: "Read saved sources",
                      scope: {
                        type: "saved_sources",
                        requestedTabCount: sourceCount,
                        readTabCount: sourceCount,
                        skippedTabCount: 0,
                        maxTabs: 5
                      },
                      dataUsed: ["saved_memo", "saved_collection", "source_snippet"],
                      storage: "session_only",
                      status: "completed",
                      skippedReasons: [],
                      toolPermissions: ["read_saved_local_sources_after_user_request"],
                      toolPermissionLabels: ["Read saved local sources"],
                      blockedActions: ["read_page_text", "web_search", "auto_submit", "mutate_page", "insert_text", "cloud_storage"],
                      blockedActionLabels: ["No page text read", "No web search", "No submit", "No page edits"]
                    },
                    privacy: {
                      sentTabMetadata: false,
                      sentPageText: false,
                      sentSavedSources: true,
                      sentFullUrls: false,
                      storedCloud: false
                    }
                  }
                };
              }

              if (request.workflow === "research_brief") {
                const sourceCount = Array.isArray(request.sources) ? request.sources.length : 0;
                return {
                  ok: true,
                  summary: {
                    status: "completed",
                    source: "saved_sources",
                    workflow: "research_brief",
                    provider: "deepseek",
                    aiUsed: true,
                    question: request.question || "Create a research brief from saved sources",
                    answer: "I synthesized the saved local sources into a short research brief. I did not read live pages, search the web, parse files, or change browser state.",
                    summary: "I synthesized the saved local sources into a short research brief. I did not read live pages, search the web, parse files, or change browser state.",
                    researchFindings: [
                      "Saved launch notes keep the beta checklist as the current source of truth.",
                      "Saved pricing notes frame hosted AI/search as paid convenience, while BYOK remains the open-source path.",
                      "The strongest unresolved risk is provider cost validation before changing packaging copy."
                    ],
                    contradictions: [
                      "Open-source growth favors BYOK, but hosted convenience needs a paid cloud path."
                    ],
                    missingInformation: [
                      "Current search/API cost assumptions for active beta users.",
                      "Whether hosted search should be bundled or metered separately."
                    ],
                    recommendations: [
                      "Keep BYOK as the default open-source story.",
                      "Validate hosted AI/search cost before publishing pricing."
                    ],
                    sourceNotes: [
                      "Launch memo: beta checklist remains the launch source of truth.",
                      "Pricing source: hosted AI/search cost still needs validation."
                    ],
                    context: {
                      scope: "saved_sources",
                      title: "Saved sources",
                      tabCount: sourceCount
                    },
                    toolCard: {
                      toolName: "read_saved_local_sources",
                      label: "Read saved sources",
                      scope: {
                        type: "saved_sources",
                        requestedTabCount: sourceCount,
                        readTabCount: sourceCount,
                        skippedTabCount: 0,
                        maxTabs: 5
                      },
                      dataUsed: ["saved_memo", "saved_collection", "source_snippet"],
                      storage: "session_only",
                      status: "completed",
                      skippedReasons: [],
                      toolPermissions: ["read_saved_local_sources_after_user_request"],
                      toolPermissionLabels: ["Read saved local sources"],
                      blockedActions: ["read_page_text", "web_search", "auto_submit", "mutate_page", "insert_text", "cloud_storage"],
                      blockedActionLabels: ["No page text read", "No web search", "No submit", "No page edits"]
                    },
                    privacy: {
                      sentTabMetadata: false,
                      sentPageText: false,
                      sentSavedSources: true,
                      sentFullUrls: false,
                      storedCloud: false
                    }
                  }
                };
              }

              return {
                ok: true,
                summary: {
                  status: "completed",
                  source: "saved_sources",
                  workflow: "contextual_writing",
                  provider: "deepseek",
                  aiUsed: true,
                  question: request.question || "Draft from saved sources",
                  answer: "I drafted copy-only text from saved local sources. I did not read live pages, search the web, or change browser state.",
                  summary: "I drafted copy-only text from saved local sources. I did not read live pages, search the web, or change browser state.",
                  draft: [
                    "Hi team,",
                    "",
                    "Based on the saved launch memo, we should keep the beta checklist as the launch source of truth and validate hosted AI/search cost before changing pricing.",
                    "",
                    "Suggested next step: create one cost-validation task before editing the public pricing copy."
                  ].join("\n"),
                  draftPurpose: "status update",
                  audience: "product and launch teammates",
                  tone: "concise, careful, action-oriented",
                  copyNotes: [
                    "Review hosted AI/search cost assumptions before sending."
                  ],
                  sourceGrounding: [
                    "Saved launch memo says the beta checklist remains the source of truth.",
                    "Saved pricing notes say hosted AI/search cost is unresolved."
                  ],
                  copyOnly: true,
                  context: {
                    scope: "saved_sources",
                    title: "Saved sources",
                    tabCount: Array.isArray(request.sources) ? request.sources.length : 0
                  },
                  toolCard: {
                    toolName: "read_saved_local_sources",
                    label: "Read saved sources",
                    scope: {
                      type: "saved_sources",
                      requestedTabCount: Array.isArray(request.sources) ? request.sources.length : 0,
                      readTabCount: Array.isArray(request.sources) ? request.sources.length : 0,
                      skippedTabCount: 0,
                      maxTabs: 5
                    },
                    dataUsed: ["saved_memo", "saved_collection", "source_snippet"],
                    storage: "session_only",
                    status: "completed",
                    skippedReasons: [],
                    toolPermissions: ["read_saved_local_sources_after_user_request"],
                    toolPermissionLabels: ["Read saved local sources"],
                    blockedActions: ["read_page_text", "web_search", "auto_submit", "mutate_page", "insert_text", "cloud_storage"],
                    blockedActionLabels: ["No page text read", "No web search", "No submit", "No page edits"]
                  },
                  privacy: {
                    sentTabMetadata: false,
                    sentPageText: false,
                    sentSavedSources: true,
                    sentFullUrls: false,
                    storedCloud: false
                  }
                }
              };
            }

            if (request?.type === "DRAFT_FROM_SEARCH_RESULTS") {
              const sourceCount = Array.isArray(request.sources) ? request.sources.length : 0;
              return {
                ok: true,
                summary: {
                  status: "completed",
                  source: "search_results",
                  workflow: "decision_brief",
                  provider: "deepseek",
                  aiUsed: true,
                  question: request.question || "Create a decision brief from these search results.",
                  answer: "I turned the current search results into a decision brief. I used only result titles, hostnames, and snippets; I did not open result pages or read live page text.",
                  summary: "I turned the current search results into a decision brief. I used only result titles, hostnames, and snippets; I did not open result pages or read live page text.",
                  recommendation: "Keep BYOK as the open-source default, and treat hosted AI/search as a paid convenience until provider cost and usage limits are validated.",
                  decisionCriteria: [
                    "Open-source setup should remain understandable for technical users.",
                    "Hosted AI/search should reduce setup friction without creating unclear usage cost."
                  ],
                  comparisonRows: [
                    {
                      title: "Browser work agents: context, tools, and safe actions",
                      bestFor: "Agent architecture direction",
                      evidence: "Frames the product around page context, search results, and user-approved browser actions.",
                      watchOut: "Snippet-level evidence is not enough to finalize implementation depth."
                    }
                  ],
                  tradeoffs: [
                    "BYOK is cheaper and trustworthy, but hosted search makes onboarding smoother."
                  ],
                  assumptions: [
                    "Search-result snippets are good enough for a first decision brief, not a final market conclusion."
                  ],
                  missingInformation: [
                    "Real hosted AI/search cost per active user."
                  ],
                  recommendations: [
                    "Add a hosted-provider cost validation task before pricing copy changes."
                  ],
                  sourceNotes: [
                    "Search result: browser work agents emphasize context plus safe actions.",
                    "Search result: extension UX references emphasize sidebar and privacy boundaries."
                  ],
                  context: {
                    scope: "search_results",
                    title: "Search results",
                    tabCount: sourceCount
                  },
                  toolCard: {
                    toolName: "read_session_search_results",
                    label: "Read search results",
                    scope: {
                      type: "search_results",
                      requestedTabCount: sourceCount,
                      readTabCount: sourceCount,
                      skippedTabCount: 0,
                      maxTabs: 5
                    },
                    dataUsed: ["search_result_title", "hostname", "snippet"],
                    storage: "session_only",
                    status: "completed",
                    skippedReasons: [],
                    toolPermissions: ["read_session_search_results_after_user_request"],
                    toolPermissionLabels: ["Read session search results"],
                    blockedActions: ["read_page_text", "read_unselected_tabs", "auto_submit", "mutate_page", "insert_text", "close_tabs", "full_url_upload", "cloud_storage"],
                    blockedActionLabels: ["No page text read", "No unselected tabs", "No submit", "No page edits", "No text insertion", "No tab closing", "No full URLs", "No cloud storage"]
                  },
                  privacy: {
                    sentTabMetadata: false,
                    sentPageText: false,
                    sentSavedSources: false,
                    sentSearchResults: true,
                    sentFullUrls: false,
                    storedCloud: false
                  }
                }
              };
            }

            if (request?.type === "SUMMARIZE_CURRENT_TAB") {
              const question = String(request.question || "");
              const answer = buildMockCurrentPageSummary(question);
              const isReviewWorkflow = request.workflow === "review_page" || /review|risk|next steps/i.test(question);
              const isWritingWorkflow =
                request.workflow === "contextual_writing" ||
                /\b(draft|write|compose|reply|response|comment|update)\b/i.test(question);

              return {
                ok: true,
                summary: {
                  status: "completed",
                  tabId: 901,
                  workflow: isWritingWorkflow ? "contextual_writing" : isReviewWorkflow ? "review_page" : "general_qa",
                  source: "current_page",
                  title: "Settings | Database | ai-music | Supabase",
                  hostname: "supabase.com",
                  question: question || "What content does this page have?",
                  summary: isWritingWorkflow
                    ? "I drafted this as copy-only text from the visible Supabase settings context. Review the environment and owner before sending."
                    : isReviewWorkflow
                    ? "This Supabase database settings page should be treated as a production-risk review surface. The visible context points to backups, connection pooling, migration impact, and credential changes, so the safe path is to verify evidence before changing settings."
                    : answer,
                  pageType: isReviewWorkflow ? "settings page" : "",
                  risks: isReviewWorkflow
                    ? [
                        "Changing pooling or credentials can affect production services that still depend on current connection settings.",
                        "Point-in-time recovery or backup status may be incomplete for a risky database change."
                      ]
                    : [],
                  openQuestions: isReviewWorkflow
                    ? [
                        "Is this production or staging?",
                        "Which services use these connection strings?"
                      ]
                    : [],
                  reviewChecklist: isReviewWorkflow
                    ? [
                        "Confirm a recent backup or recovery path.",
                        "Review pooling mode and connection limits.",
                        "List services that need updated secrets before rotating credentials."
                      ]
                    : [],
                  nextSteps: isReviewWorkflow
                    ? [
                        "Draft the intended change separately.",
                        "Test the migration and pooling behavior in staging first."
                      ]
                    : [],
                  draft: isWritingWorkflow
                    ? [
                        "Hi team,",
                        "",
                        "Based on the visible Supabase database settings page, I recommend we confirm backups, pooling limits, and the owner before changing production configuration.",
                        "",
                        "Could you confirm whether this is production, which services depend on these connection settings, and who owns the rollback plan?"
                      ].join("\n")
                    : "",
                  draftPurpose: isWritingWorkflow ? "reply" : "",
                  audience: isWritingWorkflow ? "engineering teammate or project owner" : "",
                  tone: isWritingWorkflow ? "concise, careful, neutral" : "",
                  copyNotes: isWritingWorkflow
                    ? [
                        "Review environment, owner, and rollback facts before sending.",
                        "No page text was inserted, submitted, posted, or sent."
                      ]
                    : [],
                  sourceGrounding: isWritingWorkflow
                    ? [
                        "Visible page context mentions database settings, backups, and connection pooling.",
                        "The current tab title indicates the ai-music Supabase Database settings page."
                      ]
                    : [],
                  copyOnly: isWritingWorkflow,
                  keyPoints: [
                    "Confirm backups or recovery options first.",
                    "Review pooling and connection limits before traffic changes.",
                    "Avoid rotating credentials until you know which services use them."
                  ],
                  suggestedGroup: "Backend Setup",
                  suggestedAction: isReviewWorkflow || isWritingWorkflow ? "review" : "keep",
                  confidence: 0.82,
                  extractedChars: 1840,
                  provider: "deepseek",
                  aiUsed: true,
                  privacy: {
                    sentTabMetadata: true,
                    sentPageText: true,
                    sentFullUrls: false,
                    storedCloud: false
                  }
                }
              };
            }

            if (request?.type === "SUMMARIZE_SELECTED_TEXT") {
              const isWritingWorkflow =
                request.workflow === "contextual_writing" ||
                /rewrite|rephrase|polish|shorter|formal/i.test(String(request.question || ""));

              return {
                ok: true,
                summary: {
                  status: "completed",
                  tabId: 901,
                  workflow: isWritingWorkflow ? "contextual_writing" : "general_qa",
                  source: "selected_text",
                  title: "Selected paragraph from Supabase docs",
                  hostname: "supabase.com",
                  question: request.question || "Translate selected text",
                  summary: isWritingWorkflow
                    ? "Here is a copy-only rewrite of the selected text."
                    : "中文：在修改数据库连接设置前，先确认备份、连接池限制和使用这些凭据的服务。\n\nEnglish: Before changing database connection settings, confirm backups, pooling limits, and the services that depend on these credentials.\n\nKey terms: connection pooling means reusing database connections; credential rotation means replacing secrets safely.",
                  draft: isWritingWorkflow
                    ? "Before changing database connection settings, confirm backups, connection pooling limits, and every service that depends on these credentials."
                    : "",
                  draftPurpose: isWritingWorkflow ? "rewrite" : "",
                  audience: isWritingWorkflow ? "teammate or documentation reader" : "",
                  tone: isWritingWorkflow ? "clear, concise" : "",
                  copyNotes: isWritingWorkflow
                    ? ["Review environment names before reusing this text."]
                    : [],
                  sourceGrounding: isWritingWorkflow
                    ? ["Selected text mentioned backups, pooling limits, and dependent services."]
                    : [],
                  copyOnly: isWritingWorkflow ? true : undefined,
                  keyPoints: isWritingWorkflow
                    ? [
                        "Rewrite uses only highlighted text.",
                        "The result is copy-only and does not edit the page."
                      ]
                    : [
                        "Translation uses only highlighted text.",
                        "The result is copy-only and does not edit the page."
                      ],
                  extractedChars: 620,
                  provider: "deepseek",
                  aiUsed: true,
                  toolCard: {
                    toolName: "extract_selected_text",
                    label: "Read selected text",
                    scope: {
                      type: "selected_text",
                      requestedTabCount: 1,
                      readTabCount: 1,
                      skippedTabCount: 0,
                      maxTabs: 1
                    },
                    dataUsed: ["selected_text"],
                    storage: "session_only",
                    status: "completed",
                    skippedReasons: []
                  },
                  privacy: {
                    sentTabMetadata: true,
                    sentPageText: true,
                    sentFullUrls: false,
                    storedCloud: false
                  }
                }
              };
            }

            if (request?.type === "SUMMARIZE_PAGE_REGION") {
              const isSmartFillWorkflow =
                request.workflow === "smart_fill_lite" ||
                /extract|table|rows|classify/i.test(String(request.question || ""));
              const isRegionVision =
                !isSmartFillWorkflow &&
                /visual|image|screenshot|cropped|look|see|risk/i.test(String(request.question || ""));
              const tableRows = [
                ["Database backups", "Needs review", "Confirm latest backup and recovery point before changes"],
                ["Connection pooling", "Action", "Check pool mode, direct connections, and app compatibility"],
                ["Credential rotation", "Risk", "Coordinate owner, dependent services, and rollback plan"]
              ];

              return {
                ok: true,
                summary: {
                  status: "completed",
                  tabId: 901,
                  workflow: isSmartFillWorkflow ? "smart_fill_lite" : "general_qa",
                  source: "selected_region",
                  title: "Settings | Database | ai-music | Supabase",
                  hostname: "supabase.com",
                  question: request.question || "Extract this selected region.",
                  summary: isSmartFillWorkflow
                    ? "I extracted the selected database settings region into a copy-only table. Review the rows before using them elsewhere."
                    : isRegionVision
                    ? "This selected region appears to show database controls. The cropped image helps spot layout-level risks, while the selected-region text points to backups, pooling, and credential rotation."
                    : "This selected region covers database backups, connection pooling, and credential rotation.",
                  tableTitle: isSmartFillWorkflow ? "Database settings checks" : "",
                  tableHeaders: isSmartFillWorkflow ? ["Item", "Tag", "Next action"] : [],
                  tableRows: isSmartFillWorkflow ? tableRows : [],
                  rowClassifications: isSmartFillWorkflow
                    ? tableRows.map((row) => ({
                        rowLabel: row[0],
                        classification: row[1],
                        reason: "Visible selected-region text points to this category.",
                        nextAction: row[2]
                      }))
                    : [],
                  markdownTable: isSmartFillWorkflow
                    ? [
                        "| Item | Tag | Next action |",
                        "|---|---|---|",
                        ...tableRows.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} |`)
                      ].join("\n")
                    : "",
                  csv: isSmartFillWorkflow
                    ? [
                        "Item,Tag,Next action",
                        ...tableRows.map((row) => row.map((cell) => `"${cell}"`).join(","))
                      ].join("\n")
                    : "",
                  tableNotes: isSmartFillWorkflow
                    ? [
                        "Only the selected region was used.",
                        "No form was filled and no page table was edited."
                      ]
                    : [],
                  keyPoints: [
                    "Selected-region visible text only.",
                    isRegionVision ? "The cropped image was used only for this selected region." : "Cropped screenshot image bytes were not uploaded.",
                    "Output is copy-only."
                  ],
                  suggestedGroup: "Backend Setup",
                  suggestedAction: "review",
                  confidence: 0.84,
                  extractedChars: 940,
                  provider: "deepseek",
                  aiUsed: true,
                  toolCard: {
                    toolName: "extract_selected_page_region",
                    label: "Select page region",
                    scope: {
                      type: "page_region",
                      requestedTabCount: 1,
                      readTabCount: 1,
                      skippedTabCount: 0,
                      maxTabs: 1
                    },
                    dataUsed: [
                      "selected_region_visible_text",
                      "structure",
                      isRegionVision ? "cropped_region_image" : "cropped_screenshot_metadata"
                    ],
                    storage: "session_only",
                    status: "completed",
                    skippedReasons: [],
                    ...TOOL_SAFETY.pageRegion,
                    toolPermissions: isRegionVision
                      ? ["read_selected_page_region_after_user_click", "capture_selected_region_screenshot_after_user_click"]
                      : TOOL_SAFETY.pageRegion.toolPermissions,
                    toolPermissionLabels: isRegionVision
                      ? ["Read clicked region", "Capture clicked region"]
                      : TOOL_SAFETY.pageRegion.toolPermissionLabels
                  },
                  privacy: {
                    sentTabMetadata: true,
                    sentPageText: true,
                    sentScreenshot: isRegionVision,
                    sentFullUrls: false,
                    storedCloud: false
                  }
                }
              };
            }

            if (request?.type === "FETCH_USER_LINK") {
              return {
                ok: true,
                result: {
                  status: "completed",
                  source: "fetched_link",
                  provider: "deepseek",
                  aiUsed: true,
                  title: "Browser Work Agent Research",
                  hostname: "example.com",
                  path: "/research/browser-work-agent",
                  question: request.question || "Summarize this link and extract the key points.",
                  summary: "This link is useful as research for turning a tab manager into a browser work agent. It connects user-approved page context, saved sources, todos, and safe browser actions into one lightweight workflow.",
                  keyPoints: [
                    "Read link is explicit: the user clicks Fetch link before content is read.",
                    "The result can become a saved source or a Work Queue todo.",
                    "Browser-changing actions still need an Apply step."
                  ],
                  suggestedGroup: "Browser Work Agent Research",
                  suggestedAction: "review",
                  confidence: 0.82,
                  permissionOrigin: "https://example.com/*",
                  fetchedAt: "2026-06-14T00:00:00.000Z",
                  privacy: {
                    fetchedUserProvidedUrl: true,
                    sentTabMetadata: false,
                    sentPageText: true,
                    sentFullUrls: false,
                    storedCloud: false,
                    storage: "session_only_until_saved"
                  }
                }
              };
            }

            if (request?.type === "SUMMARIZE_CONTEXT_TABS") {
              if (request.workflow === "contextual_writing") {
                return {
                  ok: true,
                  summary: {
                    status: "completed",
                    provider: "deepseek",
                    aiUsed: true,
                    workflow: "contextual_writing",
                    question: request.question || "Draft a project update from these selected tabs",
                    answer: "I drafted copy-only text from the selected tabs. Nothing was inserted, sent, submitted, or changed.",
                    summary: "I drafted copy-only text from the selected tabs. Nothing was inserted, sent, submitted, or changed.",
                    draft: [
                      "Hi team,",
                      "",
                      "The selected launch tabs point to two priorities: finish the MVP private beta checklist and validate office-worker positioning before changing pricing.",
                      "",
                      "Suggested next step: keep the beta checklist as the launch source of truth, then create one cost-validation todo before editing the pricing page."
                    ].join("\n"),
                    draftPurpose: "status update",
                    audience: "product and launch teammates",
                    tone: "concise, careful, action-oriented",
                    copyNotes: [
                      "Review hosted AI/search cost assumptions before sending."
                    ],
                    sourceGrounding: [
                      "MVP checklist covers QA gates and private beta tasks.",
                      "Office workflow research explains tab-overload pain."
                    ],
                    copyOnly: true,
                    keyPoints: [
                      "The selected tabs connect launch execution, user evidence, and monetization risk."
                    ],
                    toolCard: {
                      toolName: "read_selected_tabs_pages",
                      label: "Read selected tabs",
                      scope: {
                        type: "selected_tabs",
                        requestedTabCount: 4,
                        readTabCount: 4,
                        skippedTabCount: 0,
                        maxTabs: 6
                      },
                      dataUsed: ["visible_text", "title", "hostname", "headings"],
                      storage: "session_only",
                      status: "completed",
                      skippedReasons: [],
                      ...TOOL_SAFETY.selectedTabs
                    },
                    skippedTabs: [],
                    privacy: {
                      sentTabMetadata: true,
                      sentPageText: true,
                      sentFullUrls: false,
                      storedCloud: false
                    }
                  }
                };
              }

              if (request.workflow === "decision_brief") {
                return {
                  ok: true,
                  summary: {
                    status: "completed",
                    provider: "deepseek",
                    aiUsed: true,
                    workflow: "decision_brief",
                    question: request.question || "Create a decision brief from these selected sources",
                    answer: "I turned the selected tabs into a decision brief, not another summary.",
                    summary: "I turned the selected tabs into a decision brief, not another summary.",
                    recommendation: "Use the MVP checklist as the launch source of truth, then validate positioning against the office workflow research before changing pricing.",
                    decisionCriteria: [
                      "Execution readiness",
                      "User pain evidence",
                      "Pricing risk"
                    ],
                    comparisonRows: [
                      {
                        tabId: 303,
                        title: "MVP private beta checklist",
                        bestFor: "Execution readiness",
                        evidence: "Covers QA, launch gates, and private beta tasks.",
                        watchOut: "Does not explain buyer positioning.",
                        suggestedAction: "review"
                      },
                      {
                        tabId: 306,
                        title: "Office workflow research",
                        bestFor: "User pain evidence",
                        evidence: "Explains why office workers keep too many tabs open.",
                        watchOut: "Needs conversion data before pricing decisions.",
                        suggestedAction: "keep"
                      },
                      {
                        tabId: 304,
                        title: "Pricing notes",
                        bestFor: "Packaging direction",
                        evidence: "Lists free/BYOK/hosted AI limits and upgrade reasons.",
                        watchOut: "Hosted AI/search costs are still assumptions.",
                        suggestedAction: "review"
                      }
                    ],
                    tradeoffs: [
                      "Ship speed versus incomplete hosted-cost evidence.",
                      "Clear launch execution versus weaker buyer positioning until research is validated."
                    ],
                    assumptions: [
                      "The checklist represents the real launch gate.",
                      "The selected research tabs capture the strongest office-worker pain."
                    ],
                    missingInformation: [
                      "Actual hosted AI/search cost per active user.",
                      "Which buyer segment feels the strongest tab-overload pain."
                    ],
                    sourceNotes: [
                      "MVP checklist: launch tasks",
                      "Office workflow research: user pain",
                      "Pricing notes: packaging assumptions"
                    ],
                    recommendations: [
                      "Create one cost-validation todo before launch."
                    ],
                    keyPoints: [
                      "The selected tabs connect launch execution, user evidence, and monetization risk."
                    ],
                    toolCard: {
                      toolName: "read_selected_tabs_pages",
                      label: "Read selected tabs",
                      scope: {
                        type: "selected_tabs",
                        requestedTabCount: 4,
                        readTabCount: 4,
                        skippedTabCount: 0,
                        maxTabs: 6
                      },
                      dataUsed: ["visible_text", "title", "hostname", "headings"],
                      storage: "session_only",
                      status: "completed",
                      skippedReasons: [],
                      ...TOOL_SAFETY.selectedTabs
                    },
                    skippedTabs: [],
                    privacy: {
                      sentTabMetadata: true,
                      sentPageText: true,
                      sentFullUrls: false,
                      storedCloud: false
                    }
                  }
                };
              }

              if (request.workflow === "research_brief") {
                return {
                  ok: true,
                  summary: {
                    status: "completed",
                    provider: "deepseek",
                    aiUsed: true,
                    workflow: "research_brief",
                    question: request.question || "Create a research brief from these selected sources",
                    answer: "I synthesized the selected tabs into a bounded research brief from the selected pages only.",
                    summary: "I synthesized the selected tabs into a bounded research brief from the selected pages only.",
                    researchFindings: [
                      "The beta checklist is the strongest execution source for QA gates and launch tasks.",
                      "Office workflow research should shape positioning around tab overload."
                    ],
                    contradictions: [
                      "Pricing still depends on unknown hosted AI/search cost."
                    ],
                    missingInformation: [
                      "Actual hosted AI/search cost per active beta user."
                    ],
                    sourceNotes: [
                      "MVP checklist: QA and launch gates",
                      "Office workflow research: user pain evidence"
                    ],
                    recommendations: [
                      "Create one cost-validation todo before changing pricing."
                    ],
                    keyPoints: [
                      "The selected tabs connect launch readiness, user evidence, and monetization risk."
                    ],
                    toolCard: {
                      toolName: "read_selected_tabs_pages",
                      label: "Read selected tabs",
                      scope: {
                        type: "selected_tabs",
                        requestedTabCount: 4,
                        readTabCount: 4,
                        skippedTabCount: 0,
                        maxTabs: 6
                      },
                      dataUsed: ["visible_text", "title", "hostname", "headings"],
                      storage: "session_only",
                      status: "completed",
                      skippedReasons: [],
                      ...TOOL_SAFETY.selectedTabs
                    },
                    skippedTabs: [],
                    privacy: {
                      sentTabMetadata: true,
                      sentPageText: true,
                      sentFullUrls: false,
                      storedCloud: false
                    }
                  }
                };
              }

              if (request.workflow === "compare_selected_tabs") {
                return {
                  ok: true,
                  summary: {
                    status: "completed",
                    provider: "deepseek",
                    aiUsed: true,
                    workflow: "compare_selected_tabs",
                    question: request.question || "Compare these selected tabs",
                    answer: "I compared the readable selected tabs as a launch decision instead of summarizing them one by one.",
                    summary: "I compared the readable selected tabs as a launch decision instead of summarizing them one by one.",
                    recommendation: "Use the MVP checklist as the execution source, then validate positioning against the office workflow research before changing pricing.",
                    comparisonRows: [
                      {
                        tabId: 303,
                        title: "MVP private beta checklist",
                        bestFor: "Execution readiness",
                        evidence: "Covers QA, launch gates, and private beta tasks.",
                        watchOut: "Does not explain buyer positioning.",
                        suggestedAction: "review"
                      },
                      {
                        tabId: 306,
                        title: "Office workflow research",
                        bestFor: "User pain evidence",
                        evidence: "Explains why office workers keep too many tabs open.",
                        watchOut: "Needs conversion data before pricing decisions.",
                        suggestedAction: "keep"
                      },
                      {
                        tabId: 304,
                        title: "Pricing notes",
                        bestFor: "Packaging direction",
                        evidence: "Lists free/BYOK/hosted AI limits and upgrade reasons.",
                        watchOut: "Costs are still assumptions.",
                        suggestedAction: "review"
                      }
                    ],
                    tradeoffs: [
                      "Execution checklist is most actionable, but research is stronger for messaging.",
                      "Pricing notes are useful only after hosted AI/search costs are known."
                    ],
                    missingInformation: [
                      "Actual hosted AI/search cost per active user.",
                      "Which buyer segment feels the strongest tab-overload pain."
                    ],
                    sourceNotes: [
                      "MVP checklist: launch tasks",
                      "Office workflow research: user pain",
                      "Pricing notes: packaging assumptions"
                    ],
                    keyPoints: [
                      "The tabs point to launch execution, user evidence, and packaging.",
                      "No full URLs or skipped page text are shown in the answer."
                    ],
                    recommendations: [
                      "Turn the missing cost assumption into a Work Queue item before launch."
                    ],
                    toolCard: {
                      toolName: "read_selected_tabs_pages",
                      label: "Read selected tabs",
                      scope: {
                        type: "selected_tabs",
                        requestedTabCount: 4,
                        readTabCount: 4,
                        skippedTabCount: 0,
                        maxTabs: 6
                      },
                      dataUsed: ["visible_text", "title", "hostname", "headings"],
                      storage: "session_only",
                      status: "completed",
                      skippedReasons: [],
                      ...TOOL_SAFETY.selectedTabs
                    },
                    skippedTabs: [],
                    privacy: {
                      sentTabMetadata: true,
                      sentPageText: true,
                      sentFullUrls: false,
                      storedCloud: false
                    }
                  }
                };
              }

              return {
                ok: true,
                summary: {
                  status: "completed",
                  provider: "deepseek",
                  aiUsed: true,
                  question: request.question || "What are these selected tabs about?",
                  answer: "These selected tabs are mostly about private beta planning: roadmap decisions, launch checklist work, pricing notes, customer research, and competitor positioning. I read the safe visible pages I could, skipped two that exceeded the beta cap, and did not store the extracted text.",
                  summary: "These selected tabs are mostly about private beta planning: roadmap decisions, launch checklist work, pricing notes, customer research, and competitor positioning. I read the safe visible pages I could, skipped two that exceeded the beta cap, and did not store the extracted text.",
                  keyPoints: [
                    "The strongest theme is planning the private beta launch.",
                    "Several pages support product decisions: roadmap, pricing, customer research, and competitor positioning.",
                    "The group should stay task-based rather than split by website."
                  ],
                  tabSummaries: [
                    {
                      tabId: 301,
                      title: "Q3 planning doc",
                      summary: "Roadmap and priority planning for the next beta slice.",
                      suggestedAction: "keep"
                    },
                    {
                      tabId: 303,
                      title: "MVP private beta checklist",
                      summary: "Launch readiness tasks and QA checkpoints.",
                      suggestedAction: "review"
                    },
                    {
                      tabId: 306,
                      title: "Office workflow research",
                      summary: "Research notes about how office workers deal with tab overload.",
                      suggestedAction: "keep"
                    }
                  ],
                  recommendations: [
                    "Keep these together as Product Planning, then split only if pricing or research grows into separate work."
                  ],
                  toolCard: {
                    toolName: "read_selected_tabs_pages",
                    label: "Read selected tabs",
                    scope: {
                      type: "selected_tabs",
                      requestedTabCount: 8,
                      readTabCount: 6,
                      skippedTabCount: 2,
                      maxTabs: 6
                    },
                    dataUsed: ["visible_text", "title", "hostname", "headings"],
                    storage: "session_only",
                    status: "partial",
                    skippedReasons: ["over_cap"],
                    ...TOOL_SAFETY.selectedTabs
                  },
                  skippedTabs: [
                    {
                      tabId: 307,
                      title: "Launch checklist",
                      hostname: "docs.google.com",
                      reason: "over_cap"
                    },
                    {
                      tabId: 308,
                      title: "Competitor positioning",
                      hostname: "docs.google.com",
                      reason: "over_cap"
                    }
                  ],
                  privacy: {
                    sentTabMetadata: true,
                    sentPageText: true,
                    sentFullUrls: false,
                    storedCloud: false
                  }
                }
              };
            }

            if (request?.type === "RUN_AGENT_WEB_SEARCH") {
              if (webSearchMode === "not-configured") {
                return {
                  ok: true,
                  result: {
                    status: "not-configured",
                    provider: "tavily",
                    providerLabel: "Tavily",
                    query: request.query || "browser work agent",
                    results: [],
                    answer: "",
                    diagnostics: {
                      ...MOCK_SEARCH_DIAGNOSTICS,
                      status: "not-configured",
                      enabled: false,
                      configured: false,
                      apiKeyStatus: "missing",
                      resultCount: 0,
                      errorType: "missing-api-key",
                      privacy: {
                        ...MOCK_SEARCH_DIAGNOSTICS.privacy,
                        sentQuery: false
                      }
                    },
                    privacy: {
                      sentQuery: false,
                      sentTabData: false,
                      sentPageText: false,
                      sentFullUrls: false,
                      storage: "session_only_until_saved"
                    }
                  }
                };
              }

              return {
                ok: true,
                result: {
                  status: "completed",
                  provider: "tavily",
                  providerLabel: "Tavily",
                  query: request.query || "browser work agent",
                  answer: "A browser work agent combines page context, open tabs, web search, todos, and safe browser actions so the browser can help finish knowledge-work tasks instead of only displaying pages.",
                  resultCount: 3,
                  searchedAt: "2026-06-13T00:00:00.000Z",
                  diagnostics: MOCK_SEARCH_DIAGNOSTICS,
                  results: [
                    {
                      title: "Browser work agents: context, tools, and safe actions",
                      url: "https://example.com/browser-work-agent",
                      hostname: "example.com",
                      snippet: "A practical overview of browser agents that use page context, search results, and user-approved actions.",
                      score: 0.94
                    },
                    {
                      title: "Designing AI browser extensions for knowledge work",
                      url: "https://example.org/ai-browser-extension",
                      hostname: "example.org",
                      snippet: "Patterns for sidebars, tab context, privacy boundaries, and action confirmation in browser extensions.",
                      score: 0.88
                    },
                    {
                      title: "From tab manager to browser workbench",
                      url: "https://research.example.net/browser-workbench",
                      hostname: "research.example.net",
                      snippet: "Why tasks, collections, and summaries can make tab organization useful after the initial cleanup.",
                      score: 0.82
                    }
                  ],
                  privacy: {
                    sentQuery: true,
                    sentTabData: false,
                    sentPageText: false,
                    sentFullUrls: false,
                    storage: "session_only_until_saved"
                  }
                }
              };
            }

            if (request?.type === "PREVIEW_CHAT_REFINE") {
              if (/suggest.*group|where.*group|right group|which group/i.test(request.text || "")) {
                return {
                  ok: true,
                  draft: {
                    id: "mock-suggest-group-draft",
                    type: "move_tabs",
                    status: "safe-command",
                    createdFrom: "suggested-group",
                    answer: [
                      "I suggest **Product Planning** for the current tab.",
                      "",
                      "Tab: MVP private beta checklist (docs.google.com)",
                      "",
                      "**Why**",
                      "- Shares the TabMosaic project signal with **Product Planning**.",
                      "- Matches the Product Planning workflow, not just the website domain.",
                      "- Has related tab metadata from docs.google.com, but domain alone is not enough to auto-move it.",
                      "",
                      "**What Apply will do**",
                      "- Move only this still-open tab into that group.",
                      "- Keep every other tab unchanged.",
                      "- Keep protected, pinned, incognito, and internal tabs untouched.",
                      "",
                      "**Privacy boundary**",
                      "- Uses local title, hostname, path, current group names, and latest organize metadata only.",
                      "- Does not read page text, send full URLs, search the web, upload data, or close tabs."
                    ].join("\n"),
                    actionSummary: "Move current tab to Product Planning.",
                    risk: "Apply moves only this still-open tab. It does not read page text, send full URLs, search the web, upload data, or close tabs.",
                    groupName: "Product Planning",
                    groupColor: "blue",
                    tabIds: [901],
                    matchedTabCount: 1,
                    matchedTabs: [
                      {
                        title: "MVP private beta checklist",
                        hostname: "docs.google.com",
                        path: "/document/d/mock-beta-checklist",
                        windowId: 1
                      }
                    ]
                  }
                };
              }

              if (/refinement|suggestion|split/i.test(request.text || "")) {
                return {
                  ok: true,
                  draft: {
                    id: "mock-classification-refinement-draft",
                    type: "regroup_tabs",
                    status: "regroup-preview",
                    createdFrom: "classification-refinement",
                    answer: [
                      "I can preview the suggested refinements as a metadata-only regrouping plan.",
                      "",
                      "- Uses titles, hostnames, paths, current groups, and local workflow hints only.",
                      "- Does not read page text, full URLs, screenshots, history, or cloud data.",
                      "- No browser changes happen until you click **Apply**."
                    ].join("\n"),
                    actionSummary: "Preview 3 refined groups from the latest organize suggestions.",
                    matchedTabCount: 7,
                    risk: "Apply only moves still-open, safe tabs into the previewed groups. No tabs will be closed; page text and full URLs are not read.",
                    groups: [
                      {
                        name: "TabMosaic Code Review",
                        color: "red",
                        tabIds: [309, 310, 311, 314],
                        reason: "Metadata split from GitHub.",
                        matchedTabs: [
                          { title: "PR #24 - Add sidebar control center", hostname: "github.com" },
                          { title: "PR #26 - Privacy copy", hostname: "github.com" },
                          { title: "PR #29 - Dashboard apply", hostname: "github.com" }
                        ]
                      },
                      {
                        name: "TabMosaic Issue Triage",
                        color: "blue",
                        tabIds: [313],
                        reason: "Metadata split from GitHub.",
                        matchedTabs: [
                          { title: "Issue triage", hostname: "github.com" }
                        ]
                      },
                      {
                        name: "Release CI Runs",
                        color: "cyan",
                        tabIds: [312, 315],
                        reason: "Metadata split from GitHub.",
                        matchedTabs: [
                          { title: "GitHub Actions checks", hostname: "github.com" },
                          { title: "Release branch compare", hostname: "github.com" }
                        ]
                      }
                    ],
                    privacy: {
                      sentPageText: false,
                      sentFullUrls: false,
                      storedCloud: false
                    }
                  }
                };
              }

              if (/protect|lock|never move|never close/i.test(request.text || "")) {
                return {
                  ok: true,
                  draft: {
                    id: "mock-protect-domain-rule-draft",
                    type: "protect_scope_rule",
                    status: "safe-command",
                    answer: [
                      "I can protect **docs.google.com**. Future organize and safe duplicate cleanup will leave matching tabs untouched unless you explicitly apply a later action.",
                      "",
                      "- Scope: domain",
                      "- Pattern: docs.google.com",
                      "- Current matches: 4 tabs",
                      "- Stored locally as a protection rule after you press **Apply**.",
                      "- No tabs will be moved, closed, read, summarized, or uploaded."
                    ].join("\n"),
                    actionSummary: "Protect docs.google.com (domain).",
                    risk: "Apply stores a local protection rule only. It does not move, close, read, summarize, or upload tabs.",
                    matchedTabCount: 4,
                    matchedTabs: [
                      {
                        title: "Q3 planning doc",
                        hostname: "docs.google.com",
                        path: "/document/d/mock-planning",
                        windowId: 1
                      },
                      {
                        title: "Launch checklist",
                        hostname: "docs.google.com",
                        path: "/spreadsheet/d/mock-launch",
                        windowId: 1
                      }
                    ]
                  }
                };
              }

              if (/memory|sleep|suspend|discard|collapse|inactive/i.test(request.text || "")) {
                return {
                  ok: true,
                  draft: {
                    id: "mock-memory-relief-draft",
                    type: "memory_relief",
                    status: "safe-command",
                    answer: [
                      "I found a safe memory-relief action plan.",
                      "",
                      "**What Apply will do**",
                      "- Sleep inactive tabs: **5**",
                      "- Collapse inactive groups: **2**",
                      "- Save likely read-later tabs locally: **3**",
                      "",
                      "**Safety boundary**",
                      "- I will not close non-duplicate tabs.",
                      "- Active, pinned, audible, protected, internal, and already-suspended tabs stay untouched.",
                      "- I will not read page text, upload data, or claim exact MB saved.",
                      "",
                      "Groups to collapse: Reading, Research",
                      "",
                      "Tabs involved:",
                      "- Browser extension growth notes (example.com)",
                      "- Context switching research (example.com)",
                      "- Chrome sidePanel guide (developer.chrome.com)"
                    ].join("\n"),
                    actionSummary: "Sleep 5 inactive tabs, collapse 2 inactive groups, and save 3 tabs for later.",
                    risk: "Apply may suspend inactive tabs and collapse inactive groups. It will not close non-duplicate tabs, read page text, upload data, or claim exact MB saved.",
                    matchedTabCount: 8,
                    discardTabIds: [901, 902, 903, 904, 905],
                    collapseGroupIds: [103, 106],
                    laterTabIds: [901, 902, 903]
                  }
                };
              }

              if (/duplicate|dupe/i.test(request.text || "")) {
                return {
                  ok: true,
                  draft: {
                    id: "mock-safe-duplicate-close-draft",
                    type: "safe_duplicate_close",
                    status: "safe-command",
                    answer: [
                      "I found **4 tabs** that look safe to close as exact or tracking duplicates.",
                      "",
                      "I will only close tabs after you press **Apply**.",
                      "",
                      "- Active, pinned, audible, protected, internal, and incognito tabs stay open.",
                      "- Hash/query/semantic review duplicates stay open.",
                      "- Restore will be available after Apply.",
                      "- I will re-check the live browser state before closing anything.",
                      "",
                      "Preview:",
                      "- TabMosaic PR files (github.com)",
                      "- Supabase settings duplicate (supabase.com)"
                    ].join("\n"),
                    actionSummary: "Close 4 tabs that are safe duplicates.",
                    risk: "Apply closes only exact or tracking duplicates that are still safe. Restore will be available after Apply.",
                    matchedTabCount: 4,
                    closeTabIds: [802, 803, 804, 805]
                  }
                };
              }

              return {
                ok: true,
                draft: {
                  id: "mock-chat-draft",
                  status: "preview",
                  answer: "I found matching work tabs and can move them safely.",
                  actionSummary: "Move 4 GitHub PR tabs to Code Review.",
                  risk: "No tabs will be closed.",
                  matchedTabCount: 4,
                  matchedTabs: [
                    {
                      title: "PR #24 - Add sidebar control center",
                      hostname: "github.com",
                      path: "/pull/24",
                      windowId: 1
                    },
                    {
                      title: "PR #26 - Privacy copy",
                      hostname: "github.com",
                      path: "/pull/26",
                      windowId: 2
                    }
                  ]
                }
              };
            }

            return { ok: true, run: clone(storage["tabmosaic.currentRun"]) };
          }
        },
        storage: {
          onChanged: {
            addListener: () => {}
          },
          local: {
            get: async (keys) => pick(keys),
            set: async (value) => Object.assign(storage, clone(value)),
            remove: async (keys) => {
              const list = Array.isArray(keys) ? keys : [keys];
              list.forEach((key) => delete storage[key]);
            }
          }
        },
        tabs: {
          create: async () => ({ id: 999 }),
          get: async (tabId) => {
            const tabs = storage["tabmosaic.currentRun"]?.snapshot?.tabs || [];
            const tab = tabs.find((item) => Number(item.id) === Number(tabId));

            if (tab) return toChromeTab(tab);
            if (Number(tabId) === 901) {
              return {
                id: 901,
                windowId: 1,
                title: "Settings | Database | ai-music | Supabase",
                url: "https://supabase.com/dashboard/project/ai-music/settings/database"
              };
            }

            throw new Error("No mock tab");
          },
          query: async (queryInfo = {}) => {
            const tabs = storage["tabmosaic.currentRun"]?.snapshot?.tabs || [];
            const matches = queryInfo.active
              ? tabs.filter((tab) => tab.active)
              : tabs;
            return matches.map(toChromeTab);
          },
          onActivated: {
            addListener: () => {}
          },
          onUpdated: {
            addListener: () => {}
          }
        },
        sidePanel: {
          open: async () => {}
        }
      };
    },
    {
      messages,
      storage,
      language,
      webSearchMode: options.webSearchMode || "completed",
      toolSafety: TOOL_SAFETY,
      mockSearchDiagnostics: options.searchDiagnostics || MOCK_SEARCH_DIAGNOSTICS
    }
  );

  return page;
}

function readMessages(language) {
  const locale = language === "zh" ? "zh_CN" : "en";
  const messagesPath = path.join(EXTENSION_DIR, "_locales", locale, "messages.json");
  return JSON.parse(fs.readFileSync(messagesPath, "utf8"));
}

async function assertPageReady(page, pathname, item = {}) {
  if (item.readySelector) {
    await page.waitForSelector(item.readySelector, { timeout: 5000 });
    return;
  }

  if (pathname.includes("sidepanel")) {
    await page.waitForSelector(".chat-thread-message.assistant.run-completed .run-message-card", { timeout: 5000 });
    return;
  }

  if (pathname.includes("#settings")) {
    await page.waitForSelector("#searchSettingsForm", { timeout: 5000 });
    return;
  }

  await page.waitForSelector("#dashboardGroups .dashboard-group-card", { timeout: 5000 });
  await page.waitForFunction(
    () => document.querySelector("#aiBaseUrlInput")?.value === "https://api.deepseek.com",
    null,
    { timeout: 5000 }
  );
}
