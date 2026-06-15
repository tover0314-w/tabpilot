const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUT_ROOT = path.join(ROOT_DIR, "artifacts", "launch-unblock");
const SHOULD_SELF_TEST = process.argv.includes("--self-test");
const SHOULD_JSON = process.argv.includes("--json");
const SHOULD_INCLUDE_REMOTE_CI = process.argv.includes("--include-remote-ci");

main();

function main() {
  if (SHOULD_SELF_TEST) {
    runSelfTest();
    return;
  }

  const finalGate = runFinalGateReport();
  const decisionTemplate = runTextTool("tools/launch_readiness_report.js", ["--template-only"]);
  const packet = createPacket({ finalGate, decisionTemplate });
  printPacket(packet);
}

function runFinalGateReport() {
  const args = ["tools/final_launch_gate_check.js", "--json", "--allow-blocked"];
  if (SHOULD_INCLUDE_REMOTE_CI) args.push("--include-remote-ci");

  const result = childProcess.spawnSync(process.execPath, args, {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`final_launch_gate_check failed:\n${result.stdout || ""}\n${result.stderr || ""}`);
  }

  return JSON.parse(result.stdout);
}

function runTextTool(scriptPath, args) {
  const result = childProcess.spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${scriptPath} failed:\n${result.stdout || ""}\n${result.stderr || ""}`);
  }

  return result.stdout.trim();
}

function createPacket({ finalGate, decisionTemplate }) {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const packetDir = path.join(OUT_ROOT, runId);
  const readmePath = path.join(packetDir, "README.md");
  const htmlPath = path.join(packetDir, "launch-unblock.html");
  const decisionTemplatePath = path.join(packetDir, "public-launch-decision-reply-template.txt");
  const actionChecklistPath = path.join(packetDir, "action-checklist.md");
  const summaryPath = path.join(packetDir, "unblock-summary.json");
  const handoff = buildHandoff({ finalGate, decisionTemplate });

  handoff.paths = {
    packetDir: relative(packetDir),
    readme: relative(readmePath),
    html: relative(htmlPath),
    decisionTemplate: relative(decisionTemplatePath),
    actionChecklist: relative(actionChecklistPath),
    summary: relative(summaryPath)
  };

  fs.mkdirSync(packetDir, { recursive: true });
  fs.writeFileSync(readmePath, `${renderReadme(handoff)}\n`);
  fs.writeFileSync(htmlPath, renderHtml(handoff));
  fs.writeFileSync(decisionTemplatePath, `${decisionTemplate}\n`);
  fs.writeFileSync(actionChecklistPath, `${renderActionChecklist(handoff)}\n`);
  fs.writeFileSync(summaryPath, `${JSON.stringify(renderSummary(handoff), null, 2)}\n`);

  return {
    packetDir,
    readmePath,
    htmlPath,
    decisionTemplatePath,
    actionChecklistPath,
    summaryPath,
    status: handoff.finalLaunchReady === "yes" ? "READY" : "BLOCKED_NEEDS_ACTION",
    handoff
  };
}

function buildHandoff({ finalGate, decisionTemplate }) {
  const blockers = finalGate.blockers || [];
  const groups = {
    accountOwner: blockers.filter((blocker) => blocker.owner === "ACCOUNT OWNER"),
    userInput: blockers.filter((blocker) => String(blocker.owner || "").includes("USER INPUT")),
    qa: blockers.filter((blocker) => String(blocker.owner || "").includes("QA")),
    build: blockers.filter((blocker) => blocker.owner === "BUILD")
  };

  return {
    generatedAt: new Date().toISOString(),
    finalLaunchReady: finalGate.finalLaunchReady || "unknown",
    readiness: finalGate.readiness || {},
    counts: finalGate.counts || {},
    remoteCi: finalGate.remoteCi || {},
    blockers,
    groups,
    decisionTemplate,
    nextCommands: buildNextCommands(finalGate)
  };
}

function buildNextCommands(finalGate) {
  const commands = [
    "node tools/final_launch_gate_check.js --include-remote-ci --allow-blocked",
    "node tools/prepare_real_profile_qa_packet.js",
    "node tools/launch_readiness_report.js --template-only > /tmp/tabmosaic-public-launch-reply.txt",
    "node tools/validate_public_launch_decision_reply.js /tmp/tabmosaic-public-launch-reply.txt",
    "node tools/prepare_release_candidate_packet.js --include-remote-ci"
  ];

  if (finalGate.remoteCi?.nextAction?.includes("gh run rerun")) {
    const rerun = finalGate.remoteCi.nextAction.match(/gh run rerun\s+\d+/)?.[0];
    if (rerun) commands.unshift(rerun);
  }

  return commands;
}

function renderReadme(handoff) {
  return [
    "# Launch Unblock Packet",
    "",
    `Status: ${handoff.finalLaunchReady === "yes" ? "READY" : "BLOCKED - ACTION REQUIRED"}`,
    "",
    "This local packet turns the current final-launch blockers into a concrete action checklist. It does not approve any launch decision, submit to Chrome Web Store, publish marketing copy, run real-profile QA, or read private browser data.",
    "",
    "## Current Gate",
    "",
    `- FINAL_LAUNCH_READY=${handoff.finalLaunchReady}`,
    `- READY_LOCAL_RELEASE_PACKAGE=${handoff.readiness.localReleasePackage || "unknown"}`,
    `- READY_REMOTE_CI=${handoff.readiness.remoteCi || "unknown"}`,
    `- READY_PUBLIC_SOURCE_RELEASE=${handoff.readiness.publicSourceRelease || "unknown"}`,
    `- READY_PUBLIC_MARKETING_LAUNCH=${handoff.readiness.publicMarketingLaunch || "unknown"}`,
    `- READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=${handoff.readiness.publicChromeWebStoreLaunch || "unknown"}`,
    "",
    "## Counts",
    "",
    `- Total blockers: ${handoff.counts.blockers || 0}`,
    `- Needs account owner action: ${handoff.counts.accountOwnerBlockers || 0}`,
    `- Needs user input: ${handoff.counts.userInputBlockers || 0}`,
    `- Needs QA: ${handoff.counts.qaBlockers || 0}`,
    `- Needs build action: ${handoff.counts.buildBlockers || 0}`,
    "",
    "## Immediate Actions",
    "",
    ...renderMarkdownActionGroups(handoff),
    "",
    "## Copyable Commands",
    "",
    "```bash",
    ...handoff.nextCommands,
    "```",
    "",
    "## Files In This Packet",
    "",
    `- HTML action board: ${handoff.paths.html}`,
    `- Action checklist: ${handoff.paths.actionChecklist}`,
    `- Public launch decision reply template: ${handoff.paths.decisionTemplate}`,
    `- JSON summary: ${handoff.paths.summary}`,
    "",
    "## Boundary",
    "",
    "Do not treat this packet as approval. Final launch remains blocked until the user resolves the account/CI issue, fills or approves D-L03 through D-L14, completes one redacted real-profile QA pass, and reruns final verification."
  ].join("\n");
}

function renderMarkdownActionGroups(handoff) {
  const sections = [];

  sections.push("### 1. Account Owner");
  sections.push(...renderMarkdownBlockers(handoff.groups.accountOwner, "No account-owner blockers reported."));
  sections.push("");
  sections.push("### 2. User Decisions");
  sections.push(...renderMarkdownBlockers(handoff.groups.userInput, "No user-decision blockers reported."));
  sections.push("");
  sections.push("### 3. QA");
  sections.push(...renderMarkdownBlockers(handoff.groups.qa, "No QA blockers reported."));
  sections.push("");
  sections.push("### 4. Build");
  sections.push(...renderMarkdownBlockers(handoff.groups.build, "No build blockers reported."));

  return sections;
}

function renderMarkdownBlockers(blockers, emptyText) {
  if (!blockers.length) return [`- ${emptyText}`];

  return blockers.map((blocker) => {
    const next = blocker.nextAction || blocker.message || "";
    const evidence = blocker.evidence ? ` Evidence: ${blocker.evidence}` : "";
    return `- [ ] ${blocker.id}: ${next}${evidence}`;
  });
}

function renderActionChecklist(handoff) {
  return [
    "# Launch Unblock Action Checklist",
    "",
    `Generated: ${handoff.generatedAt}`,
    `FINAL_LAUNCH_READY=${handoff.finalLaunchReady}`,
    "",
    ...renderMarkdownActionGroups(handoff),
    "",
    "## After Completing Actions",
    "",
    "```bash",
    "node tools/final_launch_gate_check.js --include-remote-ci --allow-blocked",
    "node tools/preflight.js",
    "node tools/prepare_release_candidate_packet.js --include-remote-ci",
    "```"
  ].join("\n");
}

function renderHtml(handoff) {
  const groupCards = [
    renderGroup("Account Owner", handoff.groups.accountOwner),
    renderGroup("User Decisions", handoff.groups.userInput),
    renderGroup("QA", handoff.groups.qa),
    renderGroup("Build", handoff.groups.build)
  ].join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TabMosaic Launch Unblock Packet</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f4;
      --ink: #172421;
      --muted: #63736e;
      --line: #dfe7e2;
      --panel: rgba(255, 255, 255, 0.78);
      --accent: #2f7469;
      --danger: #9f3b3b;
      --warn: #a76622;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: linear-gradient(135deg, #fbfcfa, var(--bg));
      color: var(--ink);
      font: 15px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(1160px, calc(100% - 32px));
      margin: 0 auto;
      padding: 44px 0 64px;
    }
    header { display: grid; gap: 12px; margin-bottom: 22px; }
    .eyebrow {
      color: var(--accent);
      font-size: 12px;
      font-weight: 850;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      max-width: 850px;
      font-size: 42px;
      line-height: 1.06;
      letter-spacing: 0;
    }
    p { margin: 0; color: var(--muted); }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }
    .card {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: 0 18px 48px rgba(23, 36, 33, 0.07);
      backdrop-filter: blur(18px);
      padding: 16px;
    }
    .metric span, small { display: block; color: var(--muted); font-size: 12px; font-weight: 750; }
    .metric strong { display: block; margin-top: 8px; font-size: 20px; line-height: 1.1; overflow-wrap: anywhere; }
    .no, .blocked { color: var(--danger); }
    .yes { color: var(--accent); }
    h2 { margin: 26px 0 12px; font-size: 20px; letter-spacing: 0; }
    h3 { margin: 0 0 10px; font-size: 17px; letter-spacing: 0; }
    ul { margin: 0; padding-left: 18px; color: var(--muted); }
    li { margin: 8px 0; }
    code, textarea {
      width: 100%;
      border: 1px solid #e8eee9;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.76);
      color: var(--ink);
      font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    code { display: block; margin-top: 8px; padding: 10px; overflow-wrap: anywhere; }
    textarea { min-height: 260px; resize: vertical; padding: 12px; }
    .boundary { color: var(--danger); font-weight: 750; }
    @media (max-width: 900px) {
      .grid, .groups { grid-template-columns: 1fr; }
      h1 { font-size: 34px; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="eyebrow">Final launch unblock</div>
      <h1>One page for the remaining account, decision, and QA actions.</h1>
      <p>This packet is local-only and read-only. It lists what must happen before launch, without approving decisions or touching private browser data.</p>
    </header>

    <section class="grid">
      <div class="card metric"><span>Final launch</span><strong class="${handoff.finalLaunchReady}">${escapeHtml(handoff.finalLaunchReady)}</strong></div>
      <div class="card metric"><span>Remote CI</span><strong class="${handoff.readiness.remoteCi || ""}">${escapeHtml(handoff.readiness.remoteCi || "unknown")}</strong></div>
      <div class="card metric"><span>User input</span><strong>${escapeHtml(handoff.counts.userInputBlockers || 0)}</strong></div>
      <div class="card metric"><span>QA</span><strong>${escapeHtml(handoff.counts.qaBlockers || 0)}</strong></div>
    </section>

    <h2>Action Groups</h2>
    <section class="groups">
      ${groupCards}
    </section>

    <h2>Copyable Commands</h2>
    <section class="card">
      ${handoff.nextCommands.map((command) => `<code>${escapeHtml(command)}</code>`).join("\n")}
    </section>

    <h2>Public Launch Decision Reply</h2>
    <textarea spellcheck="false">${escapeHtml(handoff.decisionTemplate)}</textarea>

    <p class="boundary">Boundary: final launch remains blocked until the user explicitly resolves or approves each item and one redacted real-profile QA pass is complete.</p>
  </main>
</body>
</html>`;
}

function renderGroup(title, blockers) {
  const items = blockers.length
    ? blockers.map((blocker) => `<li><strong>${escapeHtml(blocker.id)}</strong>: ${escapeHtml(blocker.nextAction || blocker.message || "")}${blocker.evidence ? `<br><small>${escapeHtml(blocker.evidence)}</small>` : ""}</li>`).join("\n")
    : "<li>No blockers reported.</li>";

  return `<article class="card"><h3>${escapeHtml(title)}</h3><ul>${items}</ul></article>`;
}

function renderSummary(handoff) {
  return {
    generatedAt: handoff.generatedAt,
    finalLaunchReady: handoff.finalLaunchReady,
    readiness: handoff.readiness,
    counts: handoff.counts,
    remoteCi: handoff.remoteCi,
    blockers: handoff.blockers,
    paths: handoff.paths,
    nextCommands: handoff.nextCommands
  };
}

function printPacket(packet) {
  const payload = {
    packetDir: packet.packetDir,
    readmePath: packet.readmePath,
    htmlPath: packet.htmlPath,
    decisionTemplatePath: packet.decisionTemplatePath,
    actionChecklistPath: packet.actionChecklistPath,
    summaryPath: packet.summaryPath,
    status: packet.status
  };

  if (SHOULD_JSON) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log("PASS launch unblock packet prepared");
  console.log(`status=${packet.status}`);
  console.log(`packetDir=${packet.packetDir}`);
  console.log(`html=${packet.htmlPath}`);
  console.log(`checklist=${packet.actionChecklistPath}`);
}

function relative(filePath) {
  if (!filePath) return "";
  return path.relative(ROOT_DIR, filePath);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function runSelfTest() {
  const finalGate = {
    finalLaunchReady: "no",
    readiness: {
      localReleasePackage: "yes",
      remoteCi: "no",
      publicSourceRelease: "no",
      publicMarketingLaunch: "no",
      publicChromeWebStoreLaunch: "no"
    },
    counts: {
      blockers: 3,
      userInputBlockers: 1,
      qaBlockers: 1,
      accountOwnerBlockers: 1,
      buildBlockers: 0
    },
    remoteCi: {
      status: "blocked",
      reason: "GITHUB_ACTIONS_BILLING_LOCK",
      nextAction: "Resolve GitHub billing, then run: gh run rerun 123"
    },
    blockers: [
      {
        id: "REMOTE_CI",
        owner: "ACCOUNT OWNER",
        message: "The job was not started because your account is locked due to a billing issue.",
        nextAction: "Resolve GitHub billing, then run: gh run rerun 123"
      },
      {
        id: "D-L03",
        owner: "USER INPUT",
        message: "Choose final public name.",
        evidence: "brand notes"
      },
      {
        id: "D-L11",
        owner: "QA",
        message: "Run one redacted real-profile QA pass.",
        evidence: "QA template"
      }
    ]
  };
  const decisionTemplate = "Copyable public launch decision reply\nD-L03 change: final public name = <name>.";
  const handoff = buildHandoff({ finalGate, decisionTemplate });
  handoff.paths = {
    html: "artifacts/launch-unblock/self-test/launch-unblock.html",
    actionChecklist: "artifacts/launch-unblock/self-test/action-checklist.md",
    decisionTemplate: "artifacts/launch-unblock/self-test/public-launch-decision-reply-template.txt",
    summary: "artifacts/launch-unblock/self-test/unblock-summary.json"
  };

  const readme = renderReadme(handoff);
  const html = renderHtml(handoff);
  const checklist = renderActionChecklist(handoff);
  const summary = renderSummary(handoff);

  assertIncludes(readme, "Launch Unblock Packet", "README title");
  assertIncludes(readme, "FINAL_LAUNCH_READY=no", "README final launch");
  assertIncludes(readme, "gh run rerun 123", "README rerun command");
  assertIncludes(html, "Final launch unblock", "HTML title");
  assertIncludes(html, "User Decisions", "HTML user group");
  assertIncludes(checklist, "Launch Unblock Action Checklist", "checklist title");
  assertIncludes(checklist, "REMOTE_CI", "checklist remote CI");

  if (summary.counts.accountOwnerBlockers !== 1) {
    throw new Error("Summary account owner count mismatch");
  }

  console.log("PASS launch unblock packet self-test");
}

function assertIncludes(content, token, label) {
  if (!content.includes(token)) {
    throw new Error(`${label} missing token: ${token}`);
  }
}
