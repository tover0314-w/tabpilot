const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

const requiredFiles = [
  "CHANGELOG.md",
  "README.md",
  "CONTRIBUTING.md",
  "extension/manifest.json",
  "extension/provider_registry.js",
  "05_PROJECT/08_QA_EVIDENCE.md",
  "05_PROJECT/09_BETA_RELEASE_NOTES.md",
  "05_PROJECT/10_PRIVATE_BETA_HANDOFF.md",
  "05_PROJECT/07_STORE_SUBMISSION_DRAFT.md",
  "05_PROJECT/11_SELF_TEST_GUIDE.md",
  "05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md",
  "05_PROJECT/13_PRIVACY_POLICY_DRAFT.md",
  "05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md",
  "04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md",
  "00_START_HERE/03_DECISIONS_TO_CONFIRM.md",
  "01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md",
  "05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md",
  "05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md",
  "05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md",
  "tools/public_repo_audit.js",
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
  const qaEvidence = readText("05_PROJECT/08_QA_EVIDENCE.md", failures);
  const releaseNotes = readText("05_PROJECT/09_BETA_RELEASE_NOTES.md", failures);
  const handoff = readText("05_PROJECT/10_PRIVATE_BETA_HANDOFF.md", failures);
  const storeSubmissionDraft = readText("05_PROJECT/07_STORE_SUBMISSION_DRAFT.md", failures);
  const selfTestGuide = readText("05_PROJECT/11_SELF_TEST_GUIDE.md", failures);
  const realProfileQaTemplate = readText("05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md", failures);
  const privacyPolicyDraft = readText("05_PROJECT/13_PRIVACY_POLICY_DRAFT.md", failures);
  const dataDisclosureDraft = readText("05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md", failures);
  const privacyArchitectureExplainer = readText("04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md", failures);
  const decisionsToConfirm = readText("00_START_HERE/03_DECISIONS_TO_CONFIRM.md", failures);
  const brandDomainScan = readText("01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md", failures);
  const publicLaunchMaterialsDraft = readText("05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md", failures);
  const publicLaunchDecisionPacket = readText("05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md", failures);
  const publicRepoCleanupChecklist = readText("05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md", failures);
  const publicRepoAudit = readText("tools/public_repo_audit.js", failures);
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
      "READY_PUBLIC_REPO_PUSH=no",
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
      "Final screenshots still need user approval before Chrome Web Store submission.",
      "Standalone data disclosure draft source: `05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md`"
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
      "node tools/preflight.js --large-runtime",
      "controlled local/private beta",
      "not ready for public Chrome Web Store launch",
      "05_PROJECT/11_SELF_TEST_GUIDE.md",
      "05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md",
      "真实 profile 脱敏 QA 模板",
      "Open-source AI browser layer for Chrome",
      "Choose Smart Organize",
      "Current status:",
      "Full open-source direction is confirmed; license is still `CONFIRM`",
      "Public Chrome Web Store launch is not ready yet.",
      "Default Smart Organize is metadata-first",
      "Page text is read only after a user-triggered page or selected-tabs/group question.",
      "node tools/public_repo_audit.js",
      "node tools/provider_registry_check.js",
      "Privacy architecture explainer](04_TECH/11_PRIVACY_ARCHITECTURE_EXPLAINER.md)",
      "05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md",
      "05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md",
      "05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md",
      "01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md",
      "extension/provider_registry.js",
      "output/"
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
      "Tab Mosaic",
      "CONFIRM"
    ],
    failures
  );
  requireIncludes(
    "01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md",
    brandDomainScan,
    [
      "Status: PRELIMINARY SCAN - CONFIRM BEFORE PUBLIC BRAND/DOMAIN",
      "Tab Mosaic",
      "chromewebstore.google.com/detail/tab-mosaic",
      "Domain availability and trademark risk must be checked",
      "D-001-A",
      "Do not finalize TabMosaic AI publicly",
      "Keep TabMosaic AI as the internal working name",
      "TabWeave",
      "TabAtlas",
      "This is not legal advice."
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
      "License is still being confirmed. No LICENSE file is included yet.",
      "Use synthetic tabs only.",
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
      "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no",
      "D-L01 | Open-source license",
      "Apache-2.0",
      "D-L02 | Public repo boundary",
      "D-L03 | Product name / domain",
      "Tab Mosaic",
      "01_PRODUCT/08_BRAND_DOMAIN_PRELIMINARY_SCAN.md",
      "Do not finalize TabMosaic AI publicly until the near-name conflict is reviewed.",
      "D-L08 | First public build includes BYOK AI",
      "D-L10 | Analytics policy",
      "First public build ships with no remote analytics involving browsing activity.",
      "D-L11 | Real-profile QA requirement",
      "D-L12 | Final screenshots / demo",
      "D-L14 | Public launch timing",
      "Do not post Product Hunt, Hacker News, X/Twitter, or submit Chrome Web Store until D-L01 through D-L13 are resolved.",
      "No `LICENSE` file was added"
    ],
    failures
  );
  requireIncludes(
    "05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md",
    publicRepoCleanupChecklist,
    [
      "Status: DRAFT - DO NOT PUSH PUBLICLY UNTIL D-L01, ARCHIVE, REAL-PROFILE QA, AND PUBLIC-LAUNCH MATERIALS ARE CLEARED",
      "READY_CONTROLLED_LOCAL_PRIVATE_BETA=yes",
      "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no",
      "D-L01 Open-source license confirmed.",
      "D-L02 Public repo boundary confirmed.",
      "dist/",
      "artifacts/",
      "output/",
      "extension/private-beta-ai-settings.json",
      "06_REFERENCES/ARCHIVES/TabPilot-AI-UI.zip",
      "Do not delete or untrack the archive automatically without user confirmation",
      "node tools/secret_scan.js",
      "node tools/public_repo_audit.js",
      "git diff --check",
      "No completed real-profile QA report is tracked.",
      "Final public branch contains no ignored generated outputs."
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
      "READY_PUBLIC_REPO_PUSH=no",
      "PUBLIC_REPO_BLOCKERS=",
      "D-L01",
      "D-L02",
      "06_REFERENCES/ARCHIVES/TabPilot-AI-UI.zip",
      "LICENSE is tracked but D-034-A remains unconfirmed"
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
