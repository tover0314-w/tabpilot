const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUT_ROOT = path.join(ROOT_DIR, "artifacts", "public-launch-handoff");
const STORE_ASSET_REVIEW_ROOT = path.join(ROOT_DIR, "artifacts", "store-asset-review");
const REAL_PROFILE_QA_ROOT = path.join(ROOT_DIR, "artifacts", "real-profile-qa");
const SHOULD_SELF_TEST = process.argv.includes("--self-test");
const SHOULD_JSON = process.argv.includes("--json");
const SHOULD_INCLUDE_REMOTE_CI = process.argv.includes("--include-remote-ci");

main();

function main() {
  if (SHOULD_SELF_TEST) {
    runSelfTest();
    return;
  }

  const launchReport = readLaunchReport();
  const finalGateReport = readFinalGateReport();
  const packet = createPacket({ launchReport, finalGateReport });
  printPacket(packet);
}

function readLaunchReport() {
  const result = childProcess.spawnSync(process.execPath, ["tools/launch_readiness_report.js", "--json"], {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`launch_readiness_report failed:\n${result.stdout || ""}\n${result.stderr || ""}`);
  }

  return JSON.parse(result.stdout);
}

function readFinalGateReport() {
  const args = ["tools/final_launch_gate_check.js", "--json", "--allow-blocked"];
  if (SHOULD_INCLUDE_REMOTE_CI) args.push("--include-remote-ci");

  const result = childProcess.spawnSync(process.execPath, args, {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    return {
      finalLaunchReady: "unknown",
      readiness: {},
      counts: {},
      remoteCi: {
        status: "unknown",
        reason: "FINAL_GATE_CHECK_FAILED",
        message: result.stderr || result.stdout || "final launch gate check failed"
      },
      blockers: []
    };
  }

  return JSON.parse(result.stdout);
}

function createPacket({ launchReport, finalGateReport }) {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const packetDir = path.join(OUT_ROOT, runId);
  const readmePath = path.join(packetDir, "README.md");
  const decisionReviewPath = path.join(packetDir, "launch-decision-review.html");
  const approvalTemplatePath = path.join(packetDir, "approval-reply-template.txt");
  const gatesPath = path.join(packetDir, "launch-gates.json");
  const finalGatePath = path.join(packetDir, "final-launch-gate.json");
  const storeReview = findLatestReviewPacket(STORE_ASSET_REVIEW_ROOT, "store-asset-review.md");
  const realProfileQa = findLatestReviewPacket(REAL_PROFILE_QA_ROOT, "real-profile-qa-draft.md");
  const handoff = buildHandoff({
    launchReport,
    finalGateReport,
    storeReview,
    realProfileQa
  });
  handoff.decisionReviewPath = path.relative(ROOT_DIR, decisionReviewPath);
  handoff.finalGatePath = path.relative(ROOT_DIR, finalGatePath);

  fs.mkdirSync(packetDir, { recursive: true });
  fs.writeFileSync(readmePath, `${renderReadme(handoff)}\n`);
  fs.writeFileSync(decisionReviewPath, renderDecisionReviewHtml(handoff));
  fs.writeFileSync(approvalTemplatePath, `${launchReport.decisionReplyTemplate}\n`);
  fs.writeFileSync(finalGatePath, `${JSON.stringify(finalGateReport, null, 2)}\n`);
  fs.writeFileSync(gatesPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    readiness: launchReport.readiness,
    finalLaunchGate: finalGateReport,
    counts: launchReport.counts,
    publicSourceReleaseBlockers: launchReport.publicSourceReleaseBlockers,
    publicLaunchBlockers: launchReport.publicLaunchBlockers,
    gates: launchReport.gates,
    localReviewPackets: {
      storeAssets: storeReview,
      realProfileQa
    },
    localDecisionReview: path.relative(ROOT_DIR, decisionReviewPath),
    localFinalGateReport: path.relative(ROOT_DIR, finalGatePath)
  }, null, 2)}\n`);

  return {
    packetDir,
    readmePath,
    decisionReviewPath,
    approvalTemplatePath,
    gatesPath,
    finalGatePath,
    status: finalGateReport.finalLaunchReady === "yes" ? "READY_PUBLIC_LAUNCH_REVIEW" : "BLOCKED_NEEDS_USER_INPUT_OR_QA",
    handoff
  };
}

function buildHandoff({ launchReport, finalGateReport, storeReview, realProfileQa }) {
  const blockingGates = launchReport.gates.filter((gate) => String(gate.status || "").toLowerCase() !== "ready");
  const userInputGates = blockingGates.filter((gate) => gate.owner.includes("USER INPUT"));
  const qaGates = blockingGates.filter((gate) => gate.owner.includes("QA"));

  return {
    generatedAt: launchReport.generatedAt,
    readiness: launchReport.readiness,
    finalLaunchGate: finalGateReport,
    counts: launchReport.counts,
    finalGateCounts: finalGateReport.counts || {},
    blockingGates,
    userInputGates,
    qaGates,
    decisionReplyTemplate: launchReport.decisionReplyTemplate,
    publicSourceReleaseBlockers: launchReport.publicSourceReleaseBlockers,
    publicLaunchBlockers: launchReport.publicLaunchBlockers,
    storeReview,
    realProfileQa
  };
}

function renderReadme(handoff) {
  const gateRows = handoff.blockingGates
    .map((gate) => `| ${gate.id} | ${gate.title} | ${gate.owner} | ${gate.next} |`)
    .join("\n");

  return [
    "# Public Launch Handoff Packet",
    "",
    "Status: BLOCKED - USER INPUT OR QA REQUIRED",
    "",
    "This local packet gathers the remaining public-launch decisions and review artifacts. It does not approve any decision, publish the repo, submit to Chrome Web Store, post marketing copy, change product scope, run real-profile QA, or read private browser data.",
    "Output stays under ignored `artifacts/public-launch-handoff/`.",
    "",
    "## Current Readiness",
    "",
    `- READY_PUBLIC_SOURCE_RELEASE=${handoff.readiness.publicSourceRelease}`,
    `- READY_PUBLIC_REPO_PUSH=${handoff.readiness.publicRepoPush}`,
    `- READY_PUBLIC_MARKETING_LAUNCH=${handoff.readiness.publicMarketingLaunch}`,
    `- READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=${handoff.readiness.publicChromeWebStoreLaunch}`,
    `- FINAL_LAUNCH_READY=${handoff.finalLaunchGate.finalLaunchReady || "unknown"}`,
    `- READY_REMOTE_CI=${handoff.finalLaunchGate.readiness?.remoteCi || "unknown"}`,
    `- Public source release blockers: ${handoff.publicSourceReleaseBlockers}`,
    `- Public launch blockers: ${handoff.counts.blockingGates}`,
    `- Needs user input: ${handoff.counts.userInputGates}`,
    `- Needs QA: ${handoff.counts.qaGates}`,
    `- Needs account owner action: ${handoff.finalGateCounts.accountOwnerBlockers || 0}`,
    `- Remote CI: ${handoff.finalLaunchGate.remoteCi?.status || "not checked"} / ${handoff.finalLaunchGate.remoteCi?.reason || "none"}`,
    `- Remote CI next action: ${handoff.finalLaunchGate.remoteCi?.nextAction || "none"}`,
    "",
    "## Blocking Gates",
    "",
    "| Gate | Title | Owner | Needed next |",
    "|---|---|---|---|",
    gateRows || "| none | none | none | none |",
    "",
    "## Local Review Artifacts",
    "",
    `- Launch decision HTML review: ${handoff.decisionReviewPath || "launch-decision-review.html"}`,
    `- Final launch gate JSON: ${handoff.finalGatePath || "final-launch-gate.json"}`,
    `- Store asset review packet: ${handoff.storeReview?.reviewPath || "not generated"}`,
    `- Store asset HTML preview: ${handoff.storeReview?.htmlPreviewPath || "not generated"}`,
    `- Store asset review manifest: ${handoff.storeReview?.manifestPath || "not generated"}`,
    `- Real-profile QA draft packet: ${handoff.realProfileQa?.reviewPath || "not generated"}`,
    `- Real-profile QA HTML checklist: ${handoff.realProfileQa?.htmlChecklistPath || "not generated"}`,
    "",
    "## Files To Review Before Public Launch",
    "",
    "- `05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md`",
    "- `05_PROJECT/13_PRIVACY_POLICY_DRAFT.md`",
    "- `05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md`",
    "- `05_PROJECT/07_STORE_SUBMISSION_DRAFT.md`",
    "- `05_PROJECT/15_PUBLIC_LAUNCH_MATERIALS_DRAFT.md`",
    "- `05_PROJECT/12_REAL_PROFILE_QA_RESULT_TEMPLATE.md`",
    "",
    "## Copyable Reply",
    "",
    "Use `approval-reply-template.txt` in this packet. Replace placeholders before sending. Until the user explicitly approves a gate, it remains blocked.",
    "You can also open `launch-decision-review.html` for a local visual review of every gate and the copyable reply.",
    "",
    "## Boundary",
    "",
    "This packet is a launch review aid only. It must not be treated as approval for brand/domain, support email, privacy URL, Chrome Web Store disclosures, BYOK scope, Free/Pro boundary, analytics, real-profile QA, screenshots/demo, beta ramp, or launch timing."
  ].join("\n");
}

function renderDecisionReviewHtml(handoff) {
  const gates = handoff.blockingGates.length ? handoff.blockingGates : [];
  const gateCards = gates.map((gate) => `
    <article class="gate-card">
      <div class="gate-top">
        <span class="gate-id">${escapeHtml(gate.id)}</span>
        <span class="owner">${escapeHtml(gate.owner)}</span>
      </div>
      <h2>${escapeHtml(gate.title)}</h2>
      <p class="status">${escapeHtml(gate.status)}</p>
      <p>${escapeHtml(gate.next)}</p>
      <p class="source">${escapeHtml(gate.evidence)}</p>
    </article>
  `).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TabMosaic Public Launch Decision Review</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7f4;
      --ink: #172421;
      --muted: #63736e;
      --line: #dfe7e2;
      --panel: rgba(255, 255, 255, 0.78);
      --accent: #2f7469;
      --warn: #a76622;
      --danger: #9f3b3b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at 88% 0%, rgba(47, 116, 105, 0.12), transparent 31%),
        linear-gradient(135deg, #fbfcfa, var(--bg));
      color: var(--ink);
      font: 15px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 44px 0 64px;
    }
    header {
      display: grid;
      gap: 12px;
      margin-bottom: 22px;
    }
    .eyebrow {
      color: var(--accent);
      font-size: 12px;
      font-weight: 850;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      max-width: 800px;
      font-size: 42px;
      line-height: 1.06;
      letter-spacing: 0;
    }
    header p {
      margin: 0;
      max-width: 850px;
      color: var(--muted);
      font-size: 17px;
    }
    .summary, .gate-card, .reply {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: 0 18px 48px rgba(23, 36, 33, 0.07);
      backdrop-filter: blur(18px);
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 20px;
      padding: 16px;
    }
    .metric {
      min-height: 82px;
      padding: 12px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.65);
      border: 1px solid #e8eee9;
    }
    .metric span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      font-weight: 750;
    }
    .metric strong {
      display: block;
      margin-top: 8px;
      font-size: 22px;
      line-height: 1.1;
    }
    .metric .no { color: var(--danger); }
    .metric .yes { color: var(--accent); }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .gate-card {
      padding: 16px;
    }
    .gate-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
      margin-bottom: 10px;
    }
    .gate-id, .owner {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 4px 9px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 850;
    }
    .gate-id {
      background: #e5f0ec;
      color: #245f56;
    }
    .owner {
      background: #f7eadb;
      color: var(--warn);
      text-align: right;
    }
    h2 {
      margin: 0;
      font-size: 18px;
      letter-spacing: 0;
    }
    .status {
      margin: 6px 0 8px;
      color: var(--danger);
      font-size: 12px;
      font-weight: 850;
      text-transform: uppercase;
    }
    .gate-card p {
      margin: 0 0 8px;
      color: var(--muted);
    }
    .source {
      overflow-wrap: anywhere;
      font-size: 13px;
    }
    .reply {
      margin-top: 20px;
      padding: 18px;
    }
    .reply h2 { margin-bottom: 8px; }
    textarea {
      width: 100%;
      min-height: 280px;
      resize: vertical;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.78);
      color: #243733;
      font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    .boundary {
      margin-top: 12px;
      color: var(--danger);
      font-weight: 750;
    }
    @media (max-width: 820px) {
      main { width: min(100% - 24px, 1180px); padding-top: 30px; }
      h1 { font-size: 31px; }
      .summary, .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="eyebrow">Local launch review aid</div>
      <h1>Public launch decision review</h1>
      <p>This page turns the current launch gates into one local review surface. It does not approve decisions, publish the repo, submit to Chrome Web Store, post marketing copy, run real-profile QA, or read private browser data.</p>
    </header>

    <section class="summary" aria-label="Readiness summary">
      <div class="metric"><span>Source release</span><strong class="${handoff.readiness.publicSourceRelease}">${escapeHtml(handoff.readiness.publicSourceRelease)}</strong></div>
      <div class="metric"><span>Final launch</span><strong class="${handoff.finalLaunchGate.finalLaunchReady}">${escapeHtml(handoff.finalLaunchGate.finalLaunchReady || "unknown")}</strong></div>
      <div class="metric"><span>Remote CI</span><strong class="${handoff.finalLaunchGate.readiness?.remoteCi || ""}">${escapeHtml(handoff.finalLaunchGate.readiness?.remoteCi || "unknown")}</strong></div>
      <div class="metric"><span>Chrome Web Store</span><strong class="${handoff.readiness.publicChromeWebStoreLaunch}">${escapeHtml(handoff.readiness.publicChromeWebStoreLaunch)}</strong></div>
    </section>

    <section class="reply" aria-label="Final launch gate">
      <h2>Final launch gate</h2>
      <p>FINAL_LAUNCH_READY=${escapeHtml(handoff.finalLaunchGate.finalLaunchReady || "unknown")}</p>
      <p>Remote CI: ${escapeHtml(handoff.finalLaunchGate.remoteCi?.status || "not checked")} / ${escapeHtml(handoff.finalLaunchGate.remoteCi?.reason || "none")}</p>
      <p>${escapeHtml(handoff.finalLaunchGate.remoteCi?.nextAction || "No remote CI action recorded.")}</p>
    </section>

    <section class="grid" aria-label="Blocking gates">
      ${gateCards || '<article class="gate-card"><h2>No blocking gates</h2><p>No launch blockers were reported.</p></article>'}
    </section>

    <section class="reply">
      <h2>Copyable decision reply</h2>
      <p>Replace placeholders before sending. Until a gate is explicitly approved or changed by the user, it remains blocked.</p>
      <textarea spellcheck="false">${escapeHtml(handoff.decisionReplyTemplate)}</textarea>
      <p class="boundary">Boundary: this page is a review aid only. It is not approval for brand/domain, privacy, store listing, BYOK scope, pricing, analytics, QA, screenshots/demo, beta ramp, or launch timing.</p>
    </section>
  </main>
</body>
</html>`;
}

function findLatestReviewPacket(rootDir, primaryFileName) {
  if (!fs.existsSync(rootDir)) return null;

  const candidates = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(rootDir, entry.name);
      return {
        dir,
        mtimeMs: fs.statSync(dir).mtimeMs
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const candidate of candidates) {
    const reviewPath = path.join(candidate.dir, primaryFileName);
    if (fs.existsSync(reviewPath)) {
      const manifestPath = path.join(candidate.dir, "manifest.json");
      const commandsPath = path.join(candidate.dir, "commands.txt");
      return {
        dir: path.relative(ROOT_DIR, candidate.dir),
        reviewPath: path.relative(ROOT_DIR, reviewPath),
        manifestPath: fs.existsSync(manifestPath) ? path.relative(ROOT_DIR, manifestPath) : null,
        htmlPreviewPath: fs.existsSync(path.join(candidate.dir, "store-asset-review.html"))
          ? path.relative(ROOT_DIR, path.join(candidate.dir, "store-asset-review.html"))
          : null,
        htmlChecklistPath: fs.existsSync(path.join(candidate.dir, "real-profile-qa-checklist.html"))
          ? path.relative(ROOT_DIR, path.join(candidate.dir, "real-profile-qa-checklist.html"))
          : null,
        commandsPath: fs.existsSync(commandsPath) ? path.relative(ROOT_DIR, commandsPath) : null
      };
    }
  }

  return null;
}

function runSelfTest() {
  const fakeReport = {
    generatedAt: "2026-06-15T00:00:00.000Z",
    readiness: {
      publicSourceRelease: "yes",
      publicRepoPush: "yes",
      publicMarketingLaunch: "no",
      publicChromeWebStoreLaunch: "no"
    },
    counts: {
      totalGates: 2,
      blockingGates: 2,
      userInputGates: 1,
      qaGates: 1,
      buildGates: 0
    },
    publicSourceReleaseBlockers: "none",
    publicLaunchBlockers: "D-L03; D-L11",
    decisionReplyTemplate: "Copyable public launch decision reply\nD-L03 change: final public name = <name>.",
    gates: [
      {
        id: "D-L03",
        title: "Brand/domain",
        status: "BLOCKING",
        owner: "USER INPUT",
        next: "Choose final public name",
        evidence: "test"
      },
      {
        id: "D-L11",
        title: "Real-profile QA",
        status: "BLOCKING FOR STORE",
        owner: "QA",
        next: "Run redacted QA",
        evidence: "test"
      }
    ]
  };
  const fakeFinalGateReport = {
    finalLaunchReady: "no",
    readiness: {
      localReleasePackage: "yes",
      remoteCi: "skipped",
      publicSourceRelease: "yes",
      publicMarketingLaunch: "no",
      publicChromeWebStoreLaunch: "no"
    },
    counts: {
      blockers: 2,
      userInputBlockers: 1,
      qaBlockers: 1,
      accountOwnerBlockers: 0,
      buildBlockers: 0
    },
    remoteCi: {
      status: "skipped",
      reason: "REMOTE_CI_NOT_REQUESTED",
      nextAction: ""
    }
  };
  const handoff = buildHandoff({
    launchReport: fakeReport,
    finalGateReport: fakeFinalGateReport,
    storeReview: { reviewPath: "artifacts/store-asset-review/test/store-asset-review.md" },
    realProfileQa: { reviewPath: "artifacts/real-profile-qa/test/real-profile-qa-draft.md" }
  });
  handoff.finalGatePath = "artifacts/public-launch-handoff/test/final-launch-gate.json";
  const readme = renderReadme(handoff);
  const decisionHtml = renderDecisionReviewHtml(handoff);

  assertIncludes(readme, "Status: BLOCKED - USER INPUT OR QA REQUIRED", "blocked status");
  assertIncludes(readme, "READY_PUBLIC_SOURCE_RELEASE=yes", "source release state");
  assertIncludes(readme, "FINAL_LAUNCH_READY=no", "final launch state");
  assertIncludes(readme, "Final launch gate JSON", "final gate JSON path");
  assertIncludes(readme, "launch-decision-review.html", "decision review HTML path");
  assertIncludes(readme, "D-L03", "gate row");
  assertIncludes(readme, "Store asset review packet", "store asset path");
  assertIncludes(readme, "Store asset HTML preview", "store asset HTML preview path");
  assertIncludes(readme, "Real-profile QA HTML checklist", "real-profile QA HTML checklist path");
  assertIncludes(readme, "This packet is a launch review aid only.", "boundary");
  assertIncludes(decisionHtml, "Public launch decision review", "decision review title");
  assertIncludes(decisionHtml, "Final launch gate", "final gate HTML section");
  assertIncludes(decisionHtml, "D-L03", "decision review gate");
  assertIncludes(decisionHtml, "Copyable decision reply", "decision review reply");
  assertIncludes(decisionHtml, "does not approve decisions", "decision review boundary");

  console.log("PASS public launch handoff packet self-test");
}

function assertIncludes(content, token, label) {
  if (!content.includes(token)) {
    throw new Error(`${label} missing token: ${token}`);
  }
}

function printPacket(packet) {
  if (SHOULD_JSON) {
    console.log(JSON.stringify({
      packetDir: packet.packetDir,
      readmePath: packet.readmePath,
      decisionReviewPath: packet.decisionReviewPath,
      approvalTemplatePath: packet.approvalTemplatePath,
      gatesPath: packet.gatesPath,
      finalGatePath: packet.finalGatePath,
      status: packet.status
    }, null, 2));
    return;
  }

  console.log("PASS public launch handoff packet prepared");
  console.log(`status=${packet.status}`);
  console.log(`packetDir=${packet.packetDir}`);
  console.log(`readme=${packet.readmePath}`);
  console.log(`decisionReview=${packet.decisionReviewPath}`);
  console.log(`approvalTemplate=${packet.approvalTemplatePath}`);
  console.log(`gates=${packet.gatesPath}`);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
