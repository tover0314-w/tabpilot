const fs = require("fs");

const REQUIRED_GATES = [
  "D-L03",
  "D-L04",
  "D-L05",
  "D-L06",
  "D-L07",
  "D-L08",
  "D-L09",
  "D-L10",
  "D-L11",
  "D-L12",
  "D-L13",
  "D-L14"
];

const SHOULD_SELF_TEST = process.argv.includes("--self-test");
const SHOULD_JSON = process.argv.includes("--json");
const INPUT_PATH = process.argv.find((arg) => !arg.startsWith("--") && arg !== __filename && !arg.endsWith("node"));

main();

function main() {
  if (SHOULD_SELF_TEST) {
    runSelfTest();
    return;
  }

  const input = readInput();
  const result = validateReply(input);

  if (SHOULD_JSON) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHuman(result);
  }

  if (result.failures.length) {
    process.exit(1);
  }
}

function readInput() {
  if (INPUT_PATH) {
    return fs.readFileSync(INPUT_PATH, "utf8");
  }

  if (!process.stdin.isTTY) {
    return fs.readFileSync(0, "utf8");
  }

  console.error("Usage: node tools/validate_public_launch_decision_reply.js path/to/decision-reply.txt");
  console.error("       node tools/launch_readiness_report.js --template-only > /tmp/reply.txt");
  process.exit(1);
}

function validateReply(text) {
  const lines = text.split(/\r?\n/);
  const gateMap = parseGateLines(lines);
  const failures = [];
  const warnings = [];
  const gates = REQUIRED_GATES.map((id) => {
    const entry = gateMap.get(id);

    if (!entry) {
      failures.push(`Missing required gate reply: ${id}`);
      return {
        id,
        status: "missing",
        action: "missing",
        text: ""
      };
    }

    const action = classifyAction(entry.text);
    const unresolved = findUnresolvedPlaceholders(entry.text);

    if (action === "unknown") {
      failures.push(`${id} must use approve, change:, or keep blocked wording.`);
    }

    if (unresolved.length) {
      failures.push(`${id} still contains unresolved placeholder(s): ${unresolved.join(", ")}`);
    }

    if (id === "D-L04" && action !== "keep_blocked" && !/support email\s*=\s*[^;,\n]+@[^;,\n]+\.[^;,\n]+/i.test(entry.text)) {
      warnings.push("D-L04 should include a concrete support email before store/legal publication.");
    }

    if (id === "D-L05" && action !== "keep_blocked" && !/https?:\/\/\S+/i.test(entry.text)) {
      warnings.push("D-L05 should include a concrete privacy policy URL before Chrome Web Store submission.");
    }

    if (id === "D-L11" && action === "approve" && !/qa|pass|passed|completed|result/i.test(entry.text)) {
      warnings.push("D-L11 approval should mention the real-profile QA owner/date/result.");
    }

    return {
      id,
      status: unresolved.length || action === "unknown" ? "needs_fix" : "valid",
      action,
      text: entry.text,
      unresolved
    };
  });
  const duplicateGateIds = findDuplicateGateIds(lines);

  for (const duplicate of duplicateGateIds) {
    failures.push(`Duplicate gate reply found: ${duplicate}`);
  }

  const keepBlocked = gates.filter((gate) => gate.action === "keep_blocked").map((gate) => gate.id);
  const approvedOrChanged = gates.filter((gate) => ["approve", "change"].includes(gate.action)).map((gate) => gate.id);

  return {
    ok: failures.length === 0,
    readyForHumanReview: failures.length === 0,
    publicLaunchStillBlocked: keepBlocked.length > 0,
    counts: {
      required: REQUIRED_GATES.length,
      valid: gates.filter((gate) => gate.status === "valid").length,
      missing: gates.filter((gate) => gate.status === "missing").length,
      needsFix: gates.filter((gate) => gate.status === "needs_fix").length,
      approveOrChange: approvedOrChanged.length,
      keepBlocked: keepBlocked.length,
      warnings: warnings.length
    },
    approvedOrChanged,
    keepBlocked,
    failures,
    warnings,
    gates
  };
}

function parseGateLines(lines) {
  const gateMap = new Map();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = /^(D-L\d{2})\b\s*(.*)$/.exec(line);

    if (!match) continue;

    const [, id, text] = match;

    if (!gateMap.has(id)) {
      gateMap.set(id, {
        id,
        text: `${id} ${text}`.trim()
      });
    }
  }

  return gateMap;
}

function classifyAction(text) {
  const normalized = text.toLowerCase();

  if (/\bkeep blocked\b/.test(normalized)) return "keep_blocked";
  if (/\bchange\s*:/.test(normalized)) return "change";
  if (/\bapprove\b/.test(normalized)) return "approve";
  return "unknown";
}

function findUnresolvedPlaceholders(text) {
  const angle = text.match(/<[^>\n]+>/g) || [];
  const bracket = text.match(/\[(?:support email|website url|developer name|confirm date|privacy policy url|name|email|url)\]/gi) || [];
  return Array.from(new Set([...angle, ...bracket]));
}

function findDuplicateGateIds(lines) {
  const counts = new Map();

  for (const rawLine of lines) {
    const match = /^(D-L\d{2})\b/.exec(rawLine.trim());
    if (!match) continue;
    counts.set(match[1], (counts.get(match[1]) || 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
}

function printHuman(result) {
  console.log("Public launch decision reply validation");
  console.log("=======================================");
  console.log(`OK=${result.ok ? "yes" : "no"}`);
  console.log(`READY_FOR_HUMAN_REVIEW=${result.readyForHumanReview ? "yes" : "no"}`);
  console.log(`PUBLIC_LAUNCH_STILL_BLOCKED=${result.publicLaunchStillBlocked ? "yes" : "no"}`);
  console.log(`VALID_GATES=${result.counts.valid}/${result.counts.required}`);
  console.log(`APPROVE_OR_CHANGE=${result.counts.approveOrChange}`);
  console.log(`KEEP_BLOCKED=${result.counts.keepBlocked}`);

  if (result.failures.length) {
    console.log("\nFailures");
    for (const failure of result.failures) {
      console.log(`- ${failure}`);
    }
  }

  if (result.warnings.length) {
    console.log("\nWarnings");
    for (const warning of result.warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (result.keepBlocked.length) {
    console.log("\nStill blocked");
    console.log(result.keepBlocked.join(", "));
  }
}

function runSelfTest() {
  const validReply = [
    "D-L03 change: final public name = TabMosaic AI; domain path = tabmosaic.example.com; TabMosaic AI is working-name only.",
    "D-L04 change: developer name = Example Dev; support email = support@example.com; website URL = https://example.com.",
    "D-L05 change: privacy policy URL = https://example.com/privacy; privacy policy wording = approve.",
    "D-L06 approve Chrome Web Store single-purpose wording.",
    "D-L07 approve conservative Chrome Web Store data-use / Limited Use disclosure.",
    "D-L08 approve first public build scope: local/open-source/BYOK only; no hosted AI, account, cloud sync, or cloud memory.",
    "D-L09 approve public Free/Pro boundary: local BYOK core free/open source; hosted AI/sync/memory/team services later paid.",
    "D-L10 approve first public build with no remote analytics involving browsing activity.",
    "D-L11 keep blocked until one redacted real-profile QA pass is completed.",
    "D-L12 keep blocked until final screenshots/demo are approved.",
    "D-L13 approve beta ramp: 5-10 trusted testers first, then 20-50 after blocker/high issues are resolved.",
    "D-L14 keep blocked until GitHub source release / marketing / Chrome Web Store timing is approved."
  ].join("\n");
  const missingReply = validReply.replace(/^D-L09.*\n/m, "");
  const placeholderReply = validReply.replace("TabMosaic AI; domain path = tabmosaic.example.com", "<name>; domain path = <domain or subdomain>");
  const duplicateReply = `${validReply}\nD-L03 approve duplicate`;

  assert(validateReply(validReply).ok, "valid reply should pass");
  assert(!validateReply(missingReply).ok, "missing gate should fail");
  assert(!validateReply(placeholderReply).ok, "unresolved placeholder should fail");
  assert(!validateReply(duplicateReply).ok, "duplicate gate should fail");

  console.log("PASS public launch decision reply validator self-test");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
