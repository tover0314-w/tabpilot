const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const PACKET_PATH = path.join(ROOT_DIR, "05_PROJECT", "16_PUBLIC_LAUNCH_DECISION_PACKET.md");
const SHOULD_PRINT_JSON = process.argv.includes("--json");
const SHOULD_PRINT_TEMPLATE_ONLY = process.argv.includes("--template-only");

main();

function main() {
  const packet = readRequiredFile(PACKET_PATH);
  const trackerRows = parseLaunchTracker(packet);
  const audit = runPublicRepoAudit();
  const sourceReady = audit.values.READY_PUBLIC_SOURCE_RELEASE || "unknown";
  const repoPushReady = audit.values.READY_PUBLIC_REPO_PUSH || "unknown";
  const marketingReady = audit.values.READY_PUBLIC_MARKETING_LAUNCH || "no";
  const storeReady = audit.values.READY_PUBLIC_CHROME_WEB_STORE_LAUNCH || "no";
  const blockingRows = trackerRows.filter((row) => normalizeStatus(row.status) !== "ready");
  const userInputRows = blockingRows.filter((row) => row.owner.includes("USER INPUT"));
  const qaRows = blockingRows.filter((row) => row.owner.includes("QA"));
  const buildRows = blockingRows.filter((row) => row.owner.includes("BUILD"));
  const report = {
    generatedAt: new Date().toISOString(),
    readiness: {
      publicSourceRelease: sourceReady,
      publicRepoPush: repoPushReady,
      publicMarketingLaunch: marketingReady,
      publicChromeWebStoreLaunch: storeReady
    },
    counts: {
      totalGates: trackerRows.length,
      blockingGates: blockingRows.length,
      userInputGates: userInputRows.length,
      qaGates: qaRows.length,
      buildGates: buildRows.length
    },
    publicSourceReleaseBlockers: audit.values.PUBLIC_SOURCE_RELEASE_BLOCKERS || "unknown",
    publicLaunchBlockers: audit.values.PUBLIC_LAUNCH_BLOCKERS || "unknown",
    decisionReplyTemplate: buildDecisionReplyTemplate(trackerRows),
    gates: trackerRows,
    sources: [
      "05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md",
      "tools/public_repo_audit.js"
    ]
  };

  if (SHOULD_PRINT_TEMPLATE_ONLY) {
    process.stdout.write(`${report.decisionReplyTemplate}\n`);
    return;
  }

  if (SHOULD_PRINT_JSON) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  printHumanReport(report, { audit });
}

function readRequiredFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required launch readiness source: ${path.relative(ROOT_DIR, filePath)}`);
  }

  return fs.readFileSync(filePath, "utf8");
}

function parseLaunchTracker(packet) {
  const sectionMatch = packet.match(/## 1\.1 One-Page Launch Tracker([\s\S]*?)\n## 2\./);
  if (!sectionMatch) {
    throw new Error("Public launch decision packet is missing ## 1.1 One-Page Launch Tracker.");
  }

  const rows = sectionMatch[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\|\s*D-L\d+/.test(line))
    .map(parseMarkdownTableRow);

  if (rows.length < 10) {
    throw new Error(`Expected at least 10 public launch tracker gates, found ${rows.length}.`);
  }

  const requiredGates = new Set(["D-L03", "D-L04", "D-L05", "D-L06", "D-L07", "D-L08", "D-L09", "D-L10", "D-L11", "D-L12", "D-L13", "D-L14"]);
  const seenGates = new Set(rows.map((row) => row.id));

  for (const gate of requiredGates) {
    if (!seenGates.has(gate)) {
      throw new Error(`Public launch tracker is missing ${gate}.`);
    }
  }

  return rows;
}

function parseMarkdownTableRow(line) {
  const cells = line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
  const [gateCell, status, owner, next, evidence] = cells;
  const id = gateCell.match(/^(D-L\d+)/)?.[1] || gateCell;
  const title = gateCell.replace(/^D-L\d+\s*/, "").trim();

  return {
    id,
    title,
    status,
    owner,
    next,
    evidence
  };
}

function runPublicRepoAudit() {
  const result = childProcess.spawnSync(process.execPath, ["tools/public_repo_audit.js"], {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  const values = {};

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) values[match[1]] = match[2];
  }

  if (result.error) {
    throw result.error;
  }

  return {
    ok: result.status === 0,
    status: result.status,
    output,
    values
  };
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function buildDecisionReplyTemplate(rows) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const template = [
    "Copyable public launch decision reply",
    "Replace placeholders before sending. Use approve / change / keep blocked.",
    "",
    "D-L03 change: final public name = <name>; domain path = <domain or subdomain>; TabMosaic AI is <working-name only / final name>.",
    "D-L04 change: developer name = <name>; support email = <email>; website URL = <url>.",
    "D-L05 change: privacy policy URL = <url>; privacy policy wording = <approve / changes below>.",
    "D-L06 approve Chrome Web Store single-purpose wording, or change: <replacement wording>.",
    "D-L07 approve conservative Chrome Web Store data-use / Limited Use disclosure, or change: <checkbox/writing changes>.",
    "D-L08 approve first public build scope: local/open-source/BYOK only; no hosted AI, account, cloud sync, or cloud memory.",
    "D-L09 approve public Free/Pro boundary: local BYOK core free/open source; hosted AI/sync/memory/team services later paid.",
    "D-L10 approve first public build with no remote analytics involving browsing activity.",
    "D-L11 keep blocked until one redacted real-profile QA pass is completed, or change: <QA owner/date/result>.",
    "D-L12 approve final screenshots/demo generated from synthetic/mock data only, or change: <asset changes>.",
    "D-L13 approve beta ramp: 5-10 trusted testers first, then 20-50 after blocker/high issues are resolved, or change: <ramp plan>.",
    "D-L14 approve launch timing: <GitHub source release now / marketing later / Chrome Web Store later>, or change: <timing plan>."
  ];

  for (const gateId of ["D-L03", "D-L04", "D-L05", "D-L06", "D-L07", "D-L08", "D-L09", "D-L10", "D-L11", "D-L12", "D-L13", "D-L14"]) {
    if (!byId.has(gateId)) {
      throw new Error(`Cannot build launch decision reply template because ${gateId} is missing from the tracker.`);
    }
  }

  return template.join("\n");
}

function printHumanReport(report, { audit }) {
  console.log("Launch readiness report");
  console.log("=======================");
  console.log(`READY_PUBLIC_SOURCE_RELEASE=${report.readiness.publicSourceRelease}`);
  console.log(`READY_PUBLIC_REPO_PUSH=${report.readiness.publicRepoPush}`);
  console.log(`READY_PUBLIC_MARKETING_LAUNCH=${report.readiness.publicMarketingLaunch}`);
  console.log(`READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=${report.readiness.publicChromeWebStoreLaunch}`);
  console.log("");
  console.log(`Public source release blockers: ${report.publicSourceReleaseBlockers}`);
  console.log(`Public launch blockers: ${report.counts.blockingGates} gate(s) still blocking public launch`);
  console.log(`Needs user input: ${report.counts.userInputGates}`);
  console.log(`Needs QA: ${report.counts.qaGates}`);
  console.log(`Needs build after approval: ${report.counts.buildGates}`);

  if (!audit.ok) {
    console.log("");
    console.log(`Public repo audit exited with status ${audit.status}. Run node tools/public_repo_audit.js for details.`);
  }

  console.log("");
  console.log("Blocking gates");
  for (const gate of report.gates.filter((row) => normalizeStatus(row.status) !== "ready")) {
    console.log(`- ${gate.id} ${gate.title} [${gate.owner}]`);
    console.log(`  Next: ${gate.next}`);
    console.log(`  Source: ${gate.evidence}`);
  }

  console.log("");
  console.log("What can continue without public-launch confirmation");
  console.log("- Improve local/open-source build quality.");
  console.log("- Run temporary Chrome runtime QA.");
  console.log("- Regenerate synthetic screenshots and release packages.");
  console.log("- Prepare draft copy and checklists.");

  console.log("");
  console.log("What must wait for user confirmation");
  console.log("- Final brand/domain, support email, privacy URL, store listing, store disclosures, public marketing, hosted/cloud/payment decisions, and browsing-activity analytics.");

  console.log("");
  console.log(report.decisionReplyTemplate);
  console.log("");
  console.log("Tip: run `node tools/launch_readiness_report.js --template-only` to print only this reply template.");
}
