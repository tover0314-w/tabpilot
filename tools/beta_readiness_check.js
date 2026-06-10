const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

const requiredFiles = [
  "CHANGELOG.md",
  "README.md",
  "extension/manifest.json",
  "05_PROJECT/08_QA_EVIDENCE.md",
  "05_PROJECT/09_BETA_RELEASE_NOTES.md",
  "05_PROJECT/10_PRIVATE_BETA_HANDOFF.md",
  "05_PROJECT/11_SELF_TEST_GUIDE.md",
  "05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md"
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
  const qaEvidence = readText("05_PROJECT/08_QA_EVIDENCE.md", failures);
  const releaseNotes = readText("05_PROJECT/09_BETA_RELEASE_NOTES.md", failures);
  const handoff = readText("05_PROJECT/10_PRIVATE_BETA_HANDOFF.md", failures);
  const selfTestGuide = readText("05_PROJECT/11_SELF_TEST_GUIDE.md", failures);
  const realProfileQaTemplate = readText("05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md", failures);
  const readme = readText("README.md", failures);
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
      "node tools/preflight.js --runtime --large-runtime --screenshots",
      "PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/duplicate focus/undo/restore",
      "PASS Chrome runtime large-tab probe organized 96 synthetic tabs",
      "`--large-runtime` used a separate temporary Chrome for Testing profile",
      "PASS UI screenshots captured",
      "PASS release package verified for v0.1.0",
      "blank real-profile QA result template",
      "PASS synthetic classification fixture completed",
      "fixtureGroupCount=3",
      "P0 manual QA runbook has not been run against the user's real Chrome profile.",
      `sha256=${checksum}`
    ],
    failures
  );
  requireMatches(
    "05_PROJECT/08_QA_EVIDENCE.md",
    qaEvidence,
    [/\b\d+ smoke tests passed\b/],
    failures
  );
  requireIncludes(
    "05_PROJECT/10_PRIVATE_BETA_HANDOFF.md",
    handoff,
    [
      "Status: READY FOR CONTROLLED LOCAL PRIVATE BETA",
      "node tools/preflight.js --runtime --large-runtime --screenshots",
      "safe duplicate close and Restore Closed in runtime smoke",
      "Dashboard local workspace save in runtime smoke",
      "Chrome runtime large-tab probe with 96 synthetic tabs",
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
      "PASS Chrome runtime loaded extension and exercised organize/restore/chat/dashboard apply/tab move/drag-drop/tab focus/workspace save/duplicate focus/undo/restore",
      "PASS Chrome runtime large-tab probe organized 96 synthetic tabs",
      "fixtureGroupCount=3",
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
      "真实 profile 脱敏 QA 模板"
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
  warnings.push("PUBLIC_LAUNCH_BLOCKERS=real-profile manual QA, privacy policy URL, support email, final brand/domain, store disclosures, screenshots/demo video, beta user feedback");

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
