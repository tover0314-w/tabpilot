const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

const requiredFiles = [
  "CHANGELOG.md",
  "README.md",
  "CONTRIBUTING.md",
  ".github/workflows/ci.yml",
  "extension/manifest.json",
  "extension/provider_registry.js",
  "05_PROJECT/08_QA_EVIDENCE.md",
  "05_PROJECT/09_BETA_RELEASE_NOTES.md",
  "05_PROJECT/10_PRIVATE_BETA_HANDOFF.md",
  "05_PROJECT/06_QA_RUNBOOK.md",
  "05_PROJECT/05_LAUNCH_CHECKLIST.md",
  "05_PROJECT/07_STORE_SUBMISSION_DRAFT.md",
  "05_PROJECT/11_SELF_TEST_GUIDE.md",
  "05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md",
  "05_PROJECT/13_PRIVACY_POLICY_DRAFT.md",
  "05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md",
  "04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md",
  "00_START_HERE/03_DECISIONS_TO_CONFIRM.md",
  "01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md",
  "01_PRODUCT/09_REPO_GROWTH_AND_SEO_NAMING_NOTES.md",
  "02_FEATURE_SPECS/15_AI_BROWSER_RELEVANT_FEATURE_EXPANSION.md",
  "05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md",
  "05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md",
  "05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md",
  "05_PROJECT/18_FEATURE_DISCUSSION_GUIDE.md",
  "05_PROJECT/19_AGENT_SEARCH_WORK_AGENT_IMPLEMENTATION_PLAN.md",
  "tools/public_repo_audit.js",
  "tools/launch_readiness_report.js",
  "tools/check_remote_ci_status.js",
  "tools/validate_public_launch_decision_reply.js",
  "tools/prepare_public_launch_handoff_packet.js",
  "tools/prepare_release_candidate_packet.js",
  "tools/real_profile_qa_redaction_check.js",
  "tools/prepare_real_profile_qa_packet.js",
  "tools/prepare_store_asset_review_packet.js",
  "tools/prepare_store_submission_review_packet.js",
  "tools/provider_registry_check.js",
  ".gitignore"
];

main();

function main() {
  const failures = [];
  const warnings = [];

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(ROOT_DIR, file))) {
      failures.push(`Missing required file: ${file}`);
    }
  }

  if (failures.length) {
    printResult({ failures, warnings });
    process.exit(1);
  }

  const manifest = readJson("extension/manifest.json", failures);
  const version = manifest?.version || "";
  const changelog = readText("CHANGELOG.md", failures);
  const contributing = readText("CONTRIBUTING.md", failures);
  const ciWorkflow = readText(".github/workflows/ci.yml", failures);
  const qaEvidence = readText("05_PROJECT/08_QA_EVIDENCE.md", failures);
  const releaseNotes = readText("05_PROJECT/09_BETA_RELEASE_NOTES.md", failures);
  const handoff = readText("05_PROJECT/10_PRIVATE_BETA_HANDOFF.md", failures);
  const qaRunbook = readText("05_PROJECT/06_QA_RUNBOOK.md", failures);
  const launchChecklist = readText("05_PROJECT/05_LAUNCH_CHECKLIST.md", failures);
  const storeSubmissionDraft = readText("05_PROJECT/07_STORE_SUBMISSION_DRAFT.md", failures);
  const selfTestGuide = readText("05_PROJECT/11_SELF_TEST_GUIDE.md", failures);
  const realProfileQaTemplate = readText("05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md", failures);
  const privacyPolicyDraft = readText("05_PROJECT/13_PRIVACY_POLICY_DRAFT.md", failures);
  const dataDisclosureDraft = readText("05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md", failures);
  const privacyArchitectureExplainer = readText("04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md", failures);
  const decisionsToConfirm = readText("00_START_HERE/03_DECISIONS_TO_CONFIRM.md", failures);
  const brandDomainScan = readText("01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md", failures);
  const repoGrowthNamingNotes = readText("01_PRODUCT/09_REPO_GROWTH_AND_SEO_NAMING_NOTES.md", failures);
  const aiBrowserFeatureExpansion = readText("02_FEATURE_SPECS/15_AI_BROWSER_RELEVANT_FEATURE_EXPANSION.md", failures);
  const publicLaunchMaterialsDraft = readText("05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md", failures);
  const publicLaunchDecisionPacket = readText("05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md", failures);
  const publicRepoCleanupChecklist = readText("05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md", failures);
  const featureDiscussionGuide = readText("05_PROJECT/18_FEATURE_DISCUSSION_GUIDE.md", failures);
  const agentSearchWorkPlan = readText("05_PROJECT/19_AGENT_SEARCH_WORK_AGENT_IMPLEMENTATION_PLAN.md", failures);
  const publicRepoAudit = readText("tools/public_repo_audit.js", failures);
  const launchReadinessReport = readText("tools/launch_readiness_report.js", failures);
  const checkRemoteCiStatus = readText("tools/check_remote_ci_status.js", failures);
  const validatePublicLaunchDecisionReply = readText("tools/validate_public_launch_decision_reply.js", failures);
  const preparePublicLaunchHandoffPacket = readText("tools/prepare_public_launch_handoff_packet.js", failures);
  const prepareReleaseCandidatePacket = readText("tools/prepare_release_candidate_packet.js", failures);
  const realProfileQaRedactionCheck = readText("tools/real_profile_qa_redaction_check.js", failures);
  const prepareRealProfileQaPacket = readText("tools/prepare_real_profile_qa_packet.js", failures);
  const prepareStoreAssetReviewPacket = readText("tools/prepare_store_asset_review_packet.js", failures);
  const prepareStoreSubmissionReviewPacket = readText("tools/prepare_store_submission_review_packet.js", failures);
  const providerRegistryCheck = readText("tools/provider_registry_check.js", failures);
  const gitignore = readText(".gitignore", failures);
  const readme = readText("README.md", failures);
  const providerRegistry = readText("extension/provider_registry.js", failures);
  const topVersion = getTopChangelogVersion(changelog);
  const packageBase = `tabmosaic-ai-extension-v${version}`;
  const checksumPath = `dist/${packageBase}.sha256`;
  const packageManifestPath = `dist/${packageBase}.package.json`;
  const checksum = readChecksum(checksumPath, failures);
  const packageManifest = readJson(packageManifestPath, failures);

  requireIncludes("CHANGELOG.md", changelog, [`## ${topVersion}`, "Safety:"], failures);
  requireIncludes(
    "05_PROJECT/08_QA_EVIDENCE.md",
    qaEvidence,
    [
      "Status: PASSED for local private-beta evidence",
      `Source state verified: ${topVersion}`,
      "node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots",
      "PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore",
      "open-ended chat fallback",
      "PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards",
      "tabRows=0, actionButtons=0",
      "latest organize results rendered as one assistant message bubble",
      "optimization/memory-relief answer",
      "PASS Chrome runtime large-tab probe organized 96 synthetic tabs",
      "`--agent-flow` used a temporary Chrome for Testing profile",
      "`--large-runtime` used a separate temporary Chrome for Testing profile",
      "PASS UI screenshots captured",
      "PASS store screenshot drafts captured",
      "PASS public repo audit checked",
      "READY_PUBLIC_SOURCE_RELEASE=yes",
      "READY_PUBLIC_REPO_PUSH=yes",
      "PASS release package verified for v0.1.0",
      "blank real-profile QA result template",
      "PASS synthetic classification fixture completed",
      "fixtureAssignedTabs=3",
      "P0 manual QA runbook has not been run against the user's real Chrome profile.",
      `sha256=${checksum}`
    ],
    failures
  );
  requireMatches(
    "05_PROJECT/08_QA_EVIDENCE.md",
    qaEvidence,
    [/\b\d+ smoke tests passed\b/, /\bfixtureGroupCount=\d+\b/],
    failures
  );
  requireIncludes(
    "05_PROJECT/10_PRIVATE_BETA_HANDOFF.md",
    handoff,
    [
      "Status: READY FOR CONTROLLED LOCAL PRIVATE BETA",
      "node tools/preflight.js --runtime --agent-flow --large-runtime --screenshots",
      "safe duplicate close and Restore Closed in runtime smoke",
      "Dashboard local workspace save/delete in runtime smoke",
      "Sidebar optimization/memory-relief answer in runtime smoke",
      "Sidebar open-ended chat fallback in runtime smoke",
      "DeepSeek metadata-only Agent flow in runtime smoke through the real Sidebar composer, including plain open-answer bubbles and a validated Apply/Cancel move draft",
      "Chrome runtime large-tab probe with 96 synthetic tabs",
      "mock-data Chrome Web Store screenshot drafts",
      "blank real-profile QA template copy control",
      "local-only real-profile QA packet generator with blank draft, copyable commands, and redaction-check self-test",
      "P0 manual QA has not been run on the user's real day-to-day Chrome profile.",
      "Do not submit to Chrome Web Store until confirmation gates are resolved."
    ],
    failures
  );
  requireMatches(
    "05_PROJECT/10_PRIVATE_BETA_HANDOFF.md",
    handoff,
    [/\b\d+ extension smoke tests\b/],
    failures
  );
  requireIncludes(
    "05_PROJECT/05_LAUNCH_CHECKLIST.md",
    launchChecklist,
    [
      "READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes",
      "READY_PUBLIC_SOURCE_RELEASE=yes",
      "READY_PUBLIC_MARKETING_LAUNCH=no",
      "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no",
      "P0 范围确认",
      "Apache-2.0",
      "public repo 范围确认",
      "source-release ready, store/marketing still blocked",
      "final public brand/domain 仍走 D-L03",
      "Chrome Web Store screenshot review packet generator",
      "No remote analytics involving browsing activity until D-L10 is confirmed.",
      "future only; requires analytics confirmation",
      "Final Chrome Web Store screenshots approved by user"
    ],
    failures
  );
  requireExcludes(
    "05_PROJECT/05_LAUNCH_CHECKLIST.md",
    launchChecklist,
    [
      "D-L02 still CONFIRM",
      "开源 license 确认。",
      "public repo 范围确认。",
      "organize_started。",
      "paywall_seen。"
    ],
    failures
  );
  requireIncludes(
    "05_PROJECT/09_BETA_RELEASE_NOTES.md",
    releaseNotes,
    [
      "Status: PRIVATE BETA ONLY",
      "PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/delete/duplicate focus/undo/restore",
      "open-ended chat fallback",
      "PASS Chrome runtime DeepSeek Agent flow answered from Sidebar composer as plain assistant cards",
      "tabRows=0, actionButtons=0",
      "optimization/memory-relief answer",
      "PASS Chrome runtime large-tab probe organized 96 synthetic tabs",
      "PASS store screenshot drafts captured",
      "fixtureAssignedTabs=3",
      "05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md",
      "Copy Real-Profile Template",
      "Public Chrome Web Store submission is not approved yet.",
      "P0 manual QA runbook has not been completed on the user's real Chrome profile."
    ],
    failures
  );
  requireIncludes(
    "05_PROJECT/11_SELF_TEST_GUIDE.md",
    selfTestGuide,
    [
      "READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes",
      "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no",
      "node tools/open_manual_qa_profile.js",
      "05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md",
      "Copy Real-Profile Template",
      "Local QA Notes",
      "不要公开发布，不要提交 Chrome Web Store。"
    ],
    failures
  );
  requireMatches(
    "05_PROJECT/09_BETA_RELEASE_NOTES.md",
    releaseNotes,
    [/\bfixtureGroupCount=\d+\b/],
    failures
  );
  requireIncludes(
    "05_PROJECT/07_STORE_SUBMISSION_DRAFT.md",
    storeSubmissionDraft,
    [
      "Status: DO NOT SUBMIT YET",
      "https://developer.chrome.com/docs/webstore/cws-dashboard-listing",
      "https://developer.chrome.com/docs/webstore/images",
      "https://developer.chrome.com/docs/webstore/best-listing",
      "Store Screenshot Draft Pack",
      "five 1280x800 PNGs",
      "artifacts/store-screenshots/04-page-chat.png",
      "node tools/prepare_store_asset_review_packet.js",
      "artifacts/store-asset-review/<timestamp>/store-asset-review.html",
      "The generated `store-asset-review.html` page is a local preview aid only",
      "The review packet must show `READY_FOR_USER_REVIEW` before asking the user to approve D-L12.",
      "Final screenshots still need user approval before Chrome Web Store submission.",
      "Standalone data disclosure draft source: `05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md`"
    ],
    failures
  );
  requireExcludes(
    "05_PROJECT/07_STORE_SUBMISSION_DRAFT.md",
    storeSubmissionDraft,
    [
      "artifacts/store-screenshots/04-agent-actions.png",
      "artifacts/store-screenshots/04-privacy-ai-settings.png"
    ],
    failures
  );
  requireIncludes(
    "05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md",
    dataDisclosureDraft,
    [
      "Status: DO NOT SUBMIT YET",
      "Decision state: CONFIRM before Chrome Web Store submission",
      "Final data-use categories must be confirmed in the Chrome Web Store dashboard.",
      "Web history / web browsing activity",
      "Website content / website resources",
      "Authentication information",
      "optional BYOK",
      "No analytics upload",
      "Tab title, hostname, path, window ID, tab state",
      "No. TabMosaic AI does not execute remotely hosted code."
    ],
    failures
  );
  requireIncludes(
    "05_PROJECT/13_PRIVACY_POLICY_DRAFT.md",
    privacyPolicyDraft,
    [
      "Status: DO NOT PUBLISH YET",
      "Decision state: CONFIRM before publishing",
      "Placeholders to replace: `[Developer name]`, `[support email]`, `[website URL]`, `[CONFIRM DATE]`",
      "saved workspace snapshots",
      "does not request the literal `<all_urls>`",
      "configured BYOK AI provider only if the user enables optional AI classification",
      "Chrome Web Store User Data Policy, including the Limited Use requirements"
    ],
    failures
  );
  requireIncludes(
    "README.md",
    readme,
    [
      "node tools/beta_readiness_check.js",
      "controlled local/private beta",
      "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no",
      "05_PROJECT/11_SELF_TEST_GUIDE.md",
      "05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md",
      "真实 profile 脱敏 QA 模板",
      "node tools/prepare_real_profile_qa_packet.js --self-test",
      "node tools/prepare_store_asset_review_packet.js --self-test",
      "Open-source AI browser layer for Chrome",
      "Product Screenshots",
      "assets/screenshots/01-smart-organize.png",
      "assets/screenshots/02-sidebar-agent.png",
      "assets/screenshots/03-dashboard-groups.png",
      "assets/screenshots/04-current-page-chat.png",
      "assets/screenshots/05-browser-workbench.png",
      "assets/screenshots/06-link-to-work.png",
      "No real tabs, URLs, page text, emails, API keys, or private browser profile data are included.",
      "Choose Smart Organize",
      "Apache-2.0",
      "READY_PUBLIC_SOURCE_RELEASE=yes",
      "This repo is public and source-release ready, but the extension is still a controlled local/private beta.",
      "One-click organize",
      "Uses title, hostname, path, tab state, and group state",
      "Read only after the user asks a page/context question",
      "node tools/public_repo_audit.js",
      "node tools/provider_registry_check.js",
      "node tools/prepare_public_launch_handoff_packet.js --self-test",
      "privacy architecture explainer](04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md)",
      "Docs By Goal",
      "Star History",
      "05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md",
      "05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md",
      "extension/provider_registry.js",
      "PUBLIC_SOURCE_RELEASE_BLOCKERS=none"
    ],
    failures
  );
  requireIncludes(
    "05_PROJECT/06_QA_RUNBOOK.md",
    qaRunbook,
    [
      "node tools/prepare_real_profile_qa_packet.js",
      "node tools/prepare_real_profile_qa_packet.js --self-test",
      "artifacts/real-profile-qa/",
      "real-profile-qa-checklist.html",
      "The script does not open Chrome.",
      "The script does not read tabs, browser history, cookies, page text, screenshots, Chrome profile files, .env.local, or provider keys."
    ],
    failures
  );
  requireIncludes(
    "CONTRIBUTING.md",
    contributing,
    [
      "Provider Preset Contributions",
      "OpenAI-compatible `chat/completions` request shape",
      "extension/provider_registry.js",
      "04_TECH/10_BYOK_PROVIDER_SETUP.md",
      "Do not add required host permissions",
      "node tools/provider_registry_check.js",
      "node tools/preflight.js"
    ],
    failures
  );
  requireIncludes(
    ".github/workflows/ci.yml",
    ciWorkflow,
    [
      "Launch and QA packet self-tests",
      "node --check tools/launch_readiness_report.js",
      "node --check tools/check_remote_ci_status.js",
      "node --check tools/prepare_public_launch_handoff_packet.js",
      "node --check tools/real_profile_qa_redaction_check.js",
      "node --check tools/prepare_real_profile_qa_packet.js",
      "node --check tools/prepare_store_asset_review_packet.js",
      "node tools/launch_readiness_report.js --json",
      "node tools/check_remote_ci_status.js --self-test",
      "node tools/real_profile_qa_redaction_check.js --self-test",
      "node tools/prepare_real_profile_qa_packet.js --self-test",
      "node tools/prepare_store_asset_review_packet.js --self-test",
      "node tools/prepare_public_launch_handoff_packet.js --self-test"
    ],
    failures
  );
  requireIncludes(
    "extension/provider_registry.js",
    providerRegistry,
    [
      "export const DEFAULT_AI_SETTINGS",
      "export const AI_PROVIDER_PRESETS",
      "export const AI_PROVIDER_HOST_IDS",
      "https://api.deepseek.com",
      "https://api.openai.com/v1",
      "https://api.x.ai/v1",
      "https://api.perplexity.ai",
      "https://api.fireworks.ai/inference/v1",
      "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "http://localhost:11434/v1"
    ],
    failures
  );
  requireIncludes(
    "tools/provider_registry_check.js",
    providerRegistryCheck,
    [
      "PASS provider registry checked",
      "AI_PROVIDER_PRESETS",
      "AI_PROVIDER_HOST_IDS",
      "manifest.host_permissions",
      "Dashboard provider select missing preset",
      "BYOK guide table missing provider",
      "remote providers must use HTTPS",
      "manifest.optional_host_permissions must include https://*/*"
    ],
    failures
  );
  requireIncludes(
    "04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md",
    privacyArchitectureExplainer,
    [
      "Status: PUBLIC EXPLAINER DRAFT",
      "One-click organize does not read page text.",
      "Page text extraction begins only after a user-triggered page/current-group/selected-tabs question or content-assisted regrouping request.",
      "Remote providers must use HTTPS.",
      "Local endpoints may be used without an API key if the local server does not require auth.",
      "It must not send:",
      "full URL",
      "query string",
      "hash",
      "maximum 6 tabs per batch",
      "session-only extracted context",
      "Restore Closed snapshots are the intentional local-only exception",
      "READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes",
      "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no"
    ],
    failures
  );
  requireIncludes(
    "00_START_HERE/03_DECISIONS_TO_CONFIRM.md",
    decisionsToConfirm,
    [
      "D-001-A",
      "Public brand/domain finalization",
      "2026-06-15",
      "Tab Mosaic",
      "TabPilot / TabWeave / TabAtlas / TabCraft / TabMind / TabOrbit",
      "CONFIRM"
    ],
    failures
  );
  requireIncludes(
    "01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md",
    brandDomainScan,
    [
      "Status: PRELIMINARY SCAN - CONFIRM BEFORE PUBLIC BRAND/DOMAIN",
      "Last updated: 2026-06-15",
      "Tab Mosaic",
      "chromewebstore.google.com/detail/tab-mosaic",
      "Domain availability and trademark risk must be checked",
      "D-001-A",
      "Do not finalize TabMosaic AI publicly",
      "Keep TabMosaic AI as the internal working name",
      "TabPilot",
      "TabWeave",
      "TabAtlas",
      "TabCraft",
      "TabMind",
      "TabOrbit",
      "BrowserLayer AI",
      "Keep \"open-source AI browser layer for Chrome\" as a subtitle/positioning phrase.",
      "This is not legal advice."
    ],
    failures
  );
  requireIncludes(
    "01_PRODUCT/09_REPO_GROWTH_AND_SEO_NAMING_NOTES.md",
    repoGrowthNamingNotes,
    [
      "Last updated: 2026-06-15",
      "Do not shortlist common Tab+Noun names without strong new evidence.",
      "Names to avoid or deprioritize after the 2026-06-15 scan:",
      "TabPilot",
      "TabWeave",
      "TabAtlas",
      "TabCraft",
      "TabMind",
      "TabOrbit",
      "TabForge",
      "Need a new shortlist.",
      "Keep \"Open-source AI browser layer for Chrome\" as the SEO subtitle."
    ],
    failures
  );
  requireIncludes(
    "05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md",
    publicLaunchMaterialsDraft,
    [
      "Status: DRAFT - DO NOT PUBLISH YET",
      "Decision state: CONFIRM before posting, publishing, recording, or submitting",
      "Landing Page Draft",
      "Demo Video Storyboard",
      "Product Hunt Draft",
      "Hacker News Draft",
      "X / Twitter Thread Draft",
      "SEO Draft",
      "Controlled local/private beta. Public Chrome Web Store launch is not ready yet.",
      "License: Apache-2.0.",
      "Use synthetic tabs only.",
      "Store screenshot review packet is generated with `node tools/prepare_store_asset_review_packet.js`",
      "Do not show private emails, real workspaces, real URLs, real API keys, or personal Chrome profile data.",
      "Do not post until:",
      "[ ] Product name confirmed."
    ],
    failures
  );
  requireIncludes(
    "05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md",
    publicLaunchDecisionPacket,
    [
      "Status: CONFIRM BEFORE PUBLIC LAUNCH",
      "READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes",
      "READY_PUBLIC_SOURCE_RELEASE=yes",
      "READY_PUBLIC_MARKETING_LAUNCH=no",
      "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no",
      "One-Page Launch Tracker",
      "What Is Needed Next",
      "D-L01 | Open-source license",
      "Apache-2.0",
      "D-L02 | Public repo boundary",
      "D-L03 | Product name / domain",
      "2026-06-15 scan confirmed",
      "Tab Mosaic",
      "TabPilot, TabWeave, TabAtlas, TabCraft, TabMind, TabOrbit, and TabForge",
      "01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md",
      "Do not finalize TabMosaic AI publicly until the near-name conflict is reviewed.",
      "D-L08 | First public build includes BYOK AI",
      "D-L10 | Analytics policy",
      "First public build ships with no remote analytics involving browsing activity.",
      "D-L11 | Real-profile QA requirement",
      "Deferred for GitHub-only source release; before Chrome Web Store submission",
      "D-L11_SOURCE_RELEASE_STATUS=DEFERRED_FOR_GITHUB_SOURCE_RELEASE",
      "D-L12 | Final screenshots / demo",
      "artifacts/store-asset-review/",
      "D-L14 | Public launch timing",
      "Can do now without more confirmation",
      "Needs user confirmation before changing public state",
      "Do not post Product Hunt, Hacker News, X/Twitter, or submit Chrome Web Store until D-L01 through D-L13 are resolved.",
      "`LICENSE` is now included with Apache-2.0."
    ],
    failures
  );
  requireIncludes(
    "05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md",
    publicRepoCleanupChecklist,
    [
      "Status: PUBLIC SOURCE RELEASE READY AFTER FINAL AUDIT; DO NOT LAUNCH STORE/MARKETING UNTIL PUBLIC-LAUNCH MATERIALS ARE CLEARED",
      "READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes",
      "READY_PUBLIC_SOURCE_RELEASE=yes",
      "READY_PUBLIC_MARKETING_LAUNCH=no",
      "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no",
      "[x] D-L01 Open-source license confirmed.",
      "D-L02 Public repo boundary confirmed.",
      "dist/",
      "artifacts/",
      "output/",
      "extension/private-beta-ai-settings.json",
      "06_REFERENCES/ARCHIVES/TabPilot-AI-UI.zip",
      "No raw imported archive should be tracked in the public source release.",
      "D-L11_SOURCE_RELEASE_STATUS=DEFERRED_FOR_GITHUB_SOURCE_RELEASE",
      "node tools/secret_scan.js",
      "node tools/public_repo_audit.js",
      "git diff --check",
      "No completed real-profile QA report is tracked.",
      "Final public branch contains no ignored generated outputs."
    ],
    failures
  );
  requireIncludes(
    "05_PROJECT/18_FEATURE_DISCUSSION_GUIDE.md",
    featureDiscussionGuide,
    [
      "READY FOR GITHUB SOURCE RELEASE / NOT READY FOR PUBLIC STORE LAUNCH",
      "Apache-2.0 license is confirmed and `LICENSE` exists.",
      "Public repo boundary is confirmed for source release.",
      "Real-profile QA before Chrome Web Store/public marketing.",
      "Privacy policy URL and support email.",
      "Store disclosure and launch materials."
    ],
    failures
  );
  requireExcludes(
    "05_PROJECT/18_FEATURE_DISCUSSION_GUIDE.md",
    featureDiscussionGuide,
    [
      "Open-source license is not confirmed.",
      "- Open-source license.",
      "- Public repo boundary and raw archive handling.",
      "- License.",
      "- Public repo boundary."
    ],
    failures
  );
  requireIncludes(
    "02_FEATURE_SPECS/15_AI_BROWSER_RELEVANT_FEATURE_EXPANSION.md",
    aiBrowserFeatureExpansion,
    [
      "Dashboard renders a compact `Continue` strip only when local work signals exist",
      "Screenshot evidence: `artifacts/ui-screenshots/dashboard-continue.png`",
      "Default visible icons: Chat, Read, Region, Save.",
      "Translate stays behind More",
      "Conditional Continue strip."
    ],
    failures
  );
  requireExcludes(
    "02_FEATURE_SPECS/15_AI_BROWSER_RELEVANT_FEATURE_EXPANSION.md",
    aiBrowserFeatureExpansion,
    [
      "Dashboard Continue card is still pending.",
      "Default icon candidates: Chat, Read, Region, Translate, Save.",
      "- Continue card."
    ],
    failures
  );
  requireIncludes(
    "05_PROJECT/19_AGENT_SEARCH_WORK_AGENT_IMPLEMENTATION_PLAN.md",
    agentSearchWorkPlan,
    [
      "Status: IMPLEMENTATION PLAN / FIRST LOCAL SLICES IMPLEMENTED",
      "Search is an internal Agent tool. It is not Dashboard UI.",
      "Search results render inside the Sidebar assistant answer as compact source rows.",
      "Source rows expose user-clicked Open, Save, Todo, and Brief actions.",
      "Brief routes current-session search results through `DRAFT_FROM_SEARCH_RESULTS`",
      "Todo storage stays local under `tabmosaic.agentTasks`",
      "Sidebar detects pasted http(s) links without opening or fetching them.",
      "Explicit fetch requests temporary origin permission",
      "Visible screenshot context is implemented as an explicit Sidebar action gated by a vision-capable configured provider.",
      "File/PDF/uploaded-image context remains pending and confirmation-gated.",
      "| `save_search_results` | First slice implemented |",
      "| `create_todo_from_search_results` | First slice implemented |",
      "Confirm D-043 before file/PDF/uploaded-image context."
    ],
    failures
  );
  requireExcludes(
    "05_PROJECT/19_AGENT_SEARCH_WORK_AGENT_IMPLEMENTATION_PLAN.md",
    agentSearchWorkPlan,
    [
      "| `save_search_results` | Not implemented |",
      "| `create_todo_from_search_results` | Not implemented |"
    ],
    failures
  );
  requireIncludes(".gitignore", gitignore, ["dist/", "artifacts/", "output/", "extension/private-beta-ai-settings.json"], failures);
  requireIncludes(
    "tools/public_repo_audit.js",
    publicRepoAudit,
    [
      "git ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "assertNoCandidateSecrets",
      "candidate secret",
      "OpenAI-compatible API key",
      "Bearer token literal",
      "READY_PUBLIC_SOURCE_RELEASE=",
      "READY_PUBLIC_REPO_PUSH=",
      "READY_PUBLIC_MARKETING_LAUNCH=no",
      "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no",
      "PUBLIC_SOURCE_RELEASE_BLOCKERS=",
      "PUBLIC_LAUNCH_BLOCKERS=",
      "D-L01",
      "D-L02",
      "D-L11",
      "06_REFERENCES/ARCHIVES/TabPilot-AI-UI.zip",
      "LICENSE is tracked but D-034-A remains unconfirmed"
    ],
    failures
  );
  requireIncludes(
    "tools/launch_readiness_report.js",
    launchReadinessReport,
    [
      "Launch readiness report",
      "parseLaunchTracker",
      "runPublicRepoAudit",
      "buildDecisionReplyTemplate",
      "Copyable public launch decision reply",
      "READY_PUBLIC_SOURCE_RELEASE",
      "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH",
      "Blocking gates",
      "What can continue without public-launch confirmation",
      "What must wait for user confirmation",
      "--template-only",
      "D-L03",
      "D-L14",
      "--json"
    ],
    failures
  );
  requireIncludes(
    "tools/check_remote_ci_status.js",
    checkRemoteCiStatus,
    [
      "Remote CI status",
      "GITHUB_ACTIONS_BILLING_LOCK",
      "REMOTE_CI_STATUS=",
      "REMOTE_CI_NEXT_ACTION=",
      "gh run rerun",
      "--allow-failure",
      "PASS remote CI status checker self-test"
    ],
    failures
  );
  requireIncludes(
    "tools/validate_public_launch_decision_reply.js",
    validatePublicLaunchDecisionReply,
    [
      "Public launch decision reply validation",
      "REQUIRED_GATES",
      "D-L03",
      "D-L14",
      "findUnresolvedPlaceholders",
      "publicLaunchStillBlocked",
      "keep_blocked",
      "PASS public launch decision reply validator self-test"
    ],
    failures
  );
  requireIncludes(
    "tools/prepare_public_launch_handoff_packet.js",
    preparePublicLaunchHandoffPacket,
    [
      "public launch handoff packet",
      "artifacts/public-launch-handoff",
      "Status: BLOCKED - USER INPUT OR QA REQUIRED",
      "It does not approve any decision, publish the repo, submit to Chrome Web Store, post marketing copy, change product scope, run real-profile QA, or read private browser data.",
      "launch-decision-review.html",
      "renderDecisionReviewHtml",
      "Public launch decision review",
      "approval-reply-template.txt",
      "Store asset HTML preview",
      "Real-profile QA HTML checklist",
      "launch-gates.json",
      "PASS public launch handoff packet self-test"
    ],
    failures
  );
  requireIncludes(
    "tools/prepare_release_candidate_packet.js",
    prepareReleaseCandidatePacket,
    [
      "Release Candidate Review Packet",
      "artifacts/release-candidate",
      "release-candidate-review.html",
      "release-candidate-manifest.json",
      "does not approve public launch, submit to Chrome Web Store, post marketing copy, publish a landing page, run real-profile QA, read private browser data, or change any user-facing public state",
      "tools/package_extension.js",
      "tools/verify_release_package.js",
      "tools/prepare_store_asset_review_packet.js",
      "tools/prepare_real_profile_qa_packet.js",
      "tools/prepare_public_launch_handoff_packet.js",
      "PASS release candidate packet self-test"
    ],
    failures
  );
  requireIncludes(
    "tools/real_profile_qa_redaction_check.js",
    realProfileQaRedactionCheck,
    [
      "real-profile QA redaction check",
      "FAIL_PATTERNS",
      "WARN_PATTERNS",
      "Full URL",
      "OpenAI-compatible API key",
      "Private email",
      "Bearer token",
      "Token-like query value",
      "--self-test",
      "PASS real-profile QA redaction checker self-test"
    ],
    failures
  );
  requireIncludes(
    "tools/prepare_real_profile_qa_packet.js",
    prepareRealProfileQaPacket,
    [
      "real-profile QA packet",
      "artifacts/real-profile-qa",
      "real-profile-qa-checklist.html",
      "renderChecklistHtml",
      "D-L11 local QA aid",
      "Does not open Chrome.",
      "Does not read tabs, browser history, cookies, page text, screenshots, or Chrome profile files.",
      "tools/real_profile_qa_redaction_check.js",
      "PASS real-profile QA packet self-test"
    ],
    failures
  );
  requireIncludes(
    "tools/prepare_store_asset_review_packet.js",
    prepareStoreAssetReviewPacket,
    [
      "store asset review packet",
      "CANONICAL_SCREENSHOTS",
      "04-page-chat.png",
      "store-asset-review.html",
      "renderHtmlPreview",
      "D-L12 still requires user approval",
      "READY_FOR_USER_REVIEW",
      "NEEDS_REGENERATION_OR_CLEANUP",
      "D-L12 remains CONFIRM until the user approves final screenshots/demo.",
      "PASS store asset review packet self-test"
    ],
    failures
  );
  requireIncludes(
    "tools/prepare_store_submission_review_packet.js",
    prepareStoreSubmissionReviewPacket,
    [
      "Chrome Web Store Submission Review Packet",
      "artifacts/store-submission-review",
      "store-submission-review.html",
      "copyable-store-fields.md",
      "store-submission-review.json",
      "does not submit to Chrome Web Store, approve store copy, publish a privacy policy, upload screenshots, run real-profile QA, read browser data, or change public launch state",
      "tools/launch_readiness_report.js",
      "tools/prepare_store_asset_review_packet.js",
      "PASS store submission review packet self-test"
    ],
    failures
  );
  requireIncludes(
    "05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md",
    realProfileQaTemplate,
    [
      "Status: BLANK TEMPLATE - NOT A COMPLETED QA RESULT",
      "Do not commit a completed real-profile QA result unless it has been manually redacted.",
      "full URLs",
      "real tab titles",
      "page text",
      "API keys",
      "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no",
      "0 dangerous auto-close mistakes"
    ],
    failures
  );

  if (packageManifest) {
    assertEqual(packageManifest.version, version, "Package manifest version matches extension manifest", failures);
    assertEqual(packageManifest.packageName, `${packageBase}.zip`, "Package manifest zip name matches version", failures);
    assertEqual(packageManifest.checksumName, `${packageBase}.sha256`, "Package manifest checksum name matches version", failures);
    assertEqual(packageManifest.sha256, checksum, "Package manifest sha256 matches checksum file", failures);
    assertEqual(packageManifest.safety?.includesEnvFiles, false, "Package excludes env files", failures);
    assertEqual(packageManifest.safety?.includesSourceMaps, false, "Package excludes source maps", failures);
    assertEqual(packageManifest.safety?.includesNodeModules, false, "Package excludes node_modules", failures);
  }

  warnings.push("READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes");
  warnings.push("READY_PUBLIC_SOURCE_RELEASE=yes");
  warnings.push("PUBLIC_SOURCE_RELEASE_BLOCKERS=none");
  warnings.push("READY_PUBLIC_MARKETING_LAUNCH=no");
  warnings.push("READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no");
  warnings.push("PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, final screenshots/demo video, beta user feedback");

  printResult({ failures, warnings });

  if (failures.length) {
    process.exit(1);
  }
}

function readText(file, failures) {
  try {
    return fs.readFileSync(path.join(ROOT_DIR, file), "utf8");
  } catch (error) {
    failures.push(`Could not read ${file}: ${error.message}`);
    return "";
  }
}

function readJson(file, failures) {
  try {
    return JSON.parse(readText(file, failures));
  } catch (error) {
    failures.push(`Could not parse JSON ${file}: ${error.message}`);
    return null;
  }
}

function readChecksum(file, failures) {
  const raw = readText(file, failures).trim();
  const checksum = raw.split(/\s+/)[0] || "";

  if (!/^[a-f0-9]{64}$/.test(checksum)) {
    failures.push(`${file} does not contain a valid sha256 checksum`);
  }

  return checksum;
}

function getTopChangelogVersion(changelog) {
  const match = changelog.match(/^## (v[^\s]+)/m);
  return match ? match[1] : "";
}

function requireIncludes(file, content, tokens, failures) {
  for (const token of tokens) {
    if (!content.includes(token)) {
      failures.push(`${file} is missing required readiness evidence: ${token}`);
    }
  }
}

function requireMatches(file, content, patterns, failures) {
  for (const pattern of patterns) {
    if (!pattern.test(content)) {
      failures.push(`${file} is missing required readiness evidence matching: ${pattern}`);
    }
  }
}

function requireExcludes(file, content, tokens, failures) {
  for (const token of tokens) {
    if (content.includes(token)) {
      failures.push(`${file} contains stale readiness text: ${token}`);
    }
  }
}

function assertEqual(actual, expected, label, failures) {
  if (actual !== expected) {
    failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function printResult({ failures, warnings }) {
  if (failures.length) {
    console.error("FAIL beta readiness check");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    return;
  }

  console.log("PASS controlled private beta readiness evidence checked");
  for (const warning of warnings) {
    console.log(warning);
  }
}
