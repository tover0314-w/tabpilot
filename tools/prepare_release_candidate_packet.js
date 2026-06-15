const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const OUT_ROOT = path.join(ROOT_DIR, "artifacts", "release-candidate");
const SHOULD_SELF_TEST = process.argv.includes("--self-test");
const SHOULD_JSON = process.argv.includes("--json");
const SHOULD_INCLUDE_REMOTE_CI = process.argv.includes("--include-remote-ci");

main();

function main() {
  if (SHOULD_SELF_TEST) {
    runSelfTest();
    return;
  }

  runStep("Package extension", process.execPath, ["tools/package_extension.js"]);
  runStep("Verify release package", process.execPath, ["tools/verify_release_package.js"]);

  const launchReport = runJsonTool("tools/launch_readiness_report.js", ["--json"]);
  const finalGateReport = runJsonTool("tools/final_launch_gate_check.js", finalGateArgs());
  const storeReview = runJsonTool("tools/prepare_store_asset_review_packet.js", ["--json"]);
  const realProfileQa = runJsonTool("tools/prepare_real_profile_qa_packet.js", ["--json"]);
  const publicLaunchHandoff = runJsonTool("tools/prepare_public_launch_handoff_packet.js", publicLaunchHandoffArgs());
  const packageInfo = readPackageInfo();
  const packet = createPacket({
    packageInfo,
    launchReport,
    finalGateReport,
    storeReview,
    realProfileQa,
    publicLaunchHandoff
  });

  printPacket(packet);
}

function createPacket({ packageInfo, launchReport, finalGateReport, storeReview, realProfileQa, publicLaunchHandoff }) {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const packetDir = path.join(OUT_ROOT, runId);
  const readmePath = path.join(packetDir, "README.md");
  const htmlPath = path.join(packetDir, "release-candidate-review.html");
  const manifestPath = path.join(packetDir, "release-candidate-manifest.json");
  const handoff = buildHandoff({
    packageInfo,
    launchReport,
    finalGateReport,
    storeReview,
    realProfileQa,
    publicLaunchHandoff
  });

  fs.mkdirSync(packetDir, { recursive: true });
  handoff.packetDir = relative(packetDir);
  handoff.readmePath = relative(readmePath);
  handoff.htmlPath = relative(htmlPath);
  handoff.manifestPath = relative(manifestPath);

  fs.writeFileSync(readmePath, `${renderReadme(handoff)}\n`);
  fs.writeFileSync(htmlPath, renderHtml(handoff));
  fs.writeFileSync(manifestPath, `${JSON.stringify(renderManifest(handoff), null, 2)}\n`);

  return {
    packetDir,
    readmePath,
    htmlPath,
    manifestPath,
    status: handoff.status,
    handoff
  };
}

function buildHandoff({ packageInfo, launchReport, finalGateReport, storeReview, realProfileQa, publicLaunchHandoff }) {
  const readiness = launchReport.readiness || {};
  const counts = launchReport.counts || {};
  const blockingGates = launchReport.gates?.filter((gate) => String(gate.status || "").toLowerCase() !== "ready") || [];
  const status = finalGateReport.finalLaunchReady === "yes"
    ? "READY_FOR_FINAL_SUBMISSION_REVIEW"
    : "BLOCKED_NEEDS_USER_INPUT_OR_QA";

  return {
    generatedAt: new Date().toISOString(),
    status,
    readiness,
    finalLaunchGate: finalGateReport,
    counts,
    finalGateCounts: finalGateReport.counts || {},
    packageInfo,
    blockingGates,
    publicSourceReleaseBlockers: launchReport.publicSourceReleaseBlockers,
    publicLaunchBlockers: launchReport.publicLaunchBlockers,
    storeReview: normalizeStoreReview(storeReview),
    realProfileQa: normalizeRealProfileQa(realProfileQa),
    publicLaunchHandoff: normalizePublicLaunchHandoff(publicLaunchHandoff),
    decisionReplyTemplate: launchReport.decisionReplyTemplate || ""
  };
}

function normalizeStoreReview(packet) {
  return {
    status: packet.status || "unknown",
    packetDir: relative(packet.packetDir),
    checklistPath: relative(packet.checklistPath),
    previewPath: relative(packet.previewPath),
    manifestPath: relative(packet.manifestPath),
    commandsPath: relative(packet.commandsPath)
  };
}

function normalizeRealProfileQa(packet) {
  return {
    packetDir: relative(packet.packetDir),
    draftPath: relative(packet.draftPath),
    checklistPath: relative(packet.checklistPath),
    readmePath: relative(packet.readmePath),
    commandsPath: relative(packet.commandsPath)
  };
}

function normalizePublicLaunchHandoff(packet) {
  return {
    status: packet.status || "unknown",
    packetDir: relative(packet.packetDir),
    readmePath: relative(packet.readmePath),
    decisionReviewPath: relative(packet.decisionReviewPath),
    approvalTemplatePath: relative(packet.approvalTemplatePath),
    gatesPath: relative(packet.gatesPath)
  };
}

function readPackageInfo() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "extension", "manifest.json"), "utf8"));
  const version = manifest.version;
  const baseName = `tabmosaic-ai-extension-v${version}`;
  const zipPath = path.join(DIST_DIR, `${baseName}.zip`);
  const checksumPath = path.join(DIST_DIR, `${baseName}.sha256`);
  const packageManifestPath = path.join(DIST_DIR, `${baseName}.package.json`);
  const packageManifest = JSON.parse(fs.readFileSync(packageManifestPath, "utf8"));
  const checksumText = fs.readFileSync(checksumPath, "utf8").trim();
  const zipStat = fs.statSync(zipPath);

  return {
    product: packageManifest.product,
    version,
    packageName: packageManifest.packageName,
    zipPath: relative(zipPath),
    checksumPath: relative(checksumPath),
    packageManifestPath: relative(packageManifestPath),
    sha256: packageManifest.sha256,
    checksumText,
    sizeBytes: zipStat.size,
    commit: packageManifest.commit,
    workingTreeClean: gitStatusShort().length === 0,
    gitStatusCount: gitStatusShort().length,
    gitStatusPreview: gitStatusShort().slice(0, 20),
    generatedAt: packageManifest.generatedAt,
    safety: packageManifest.safety
  };
}

function renderReadme(handoff) {
  const gateRows = handoff.blockingGates
    .map((gate) => `| ${gate.id} | ${gate.title} | ${gate.owner} | ${gate.next} |`)
    .join("\n");

  return [
    "# Release Candidate Review Packet",
    "",
    `Status: ${handoff.status}`,
    "",
    "This local packet gathers the current extension package, checksum, readiness report, store screenshot review packet, real-profile QA checklist, and public launch decision packet into one review surface.",
    "",
    "Boundary: this packet does not approve public launch, submit to Chrome Web Store, post marketing copy, publish a landing page, run real-profile QA, read private browser data, or change any user-facing public state.",
    "Output stays under ignored `artifacts/release-candidate/`.",
    "",
    "## Extension Package",
    "",
    `- Product: ${handoff.packageInfo.product}`,
    `- Version: ${handoff.packageInfo.version}`,
    `- Zip: ${handoff.packageInfo.zipPath}`,
    `- SHA-256: ${handoff.packageInfo.sha256}`,
    `- Package manifest: ${handoff.packageInfo.packageManifestPath}`,
    `- Commit recorded by package script: ${handoff.packageInfo.commit}`,
    `- Working tree clean: ${handoff.packageInfo.workingTreeClean ? "yes" : "no"}`,
    `- Uncommitted status rows: ${handoff.packageInfo.gitStatusCount || 0}`,
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
    "## Linked Review Artifacts",
    "",
    `- RC HTML review: ${handoff.htmlPath}`,
    `- Public launch handoff: ${handoff.publicLaunchHandoff.readmePath}`,
    `- Public launch decision HTML: ${handoff.publicLaunchHandoff.decisionReviewPath}`,
    `- Store asset HTML preview: ${handoff.storeReview.previewPath}`,
    `- Store asset manifest: ${handoff.storeReview.manifestPath}`,
    `- Real-profile QA checklist: ${handoff.realProfileQa.checklistPath}`,
    `- Real-profile QA draft: ${handoff.realProfileQa.draftPath}`,
    "",
    "## Blocking Gates",
    "",
    "| Gate | Title | Owner | Needed next |",
    "|---|---|---|---|",
    gateRows || "| none | none | none | none |",
    "",
    "## Suggested Review Order",
    "",
    "1. Open `release-candidate-review.html`.",
    "2. Confirm the zip/checksum shown there match `dist/`.",
    "3. Review the screenshot preview and public launch decision page.",
    "4. Run the real-profile QA checklist manually only when the user approves using a real profile.",
    "5. Resolve D-L03 through D-L14 before public marketing or Chrome Web Store submission.",
    "",
    "## Copyable Decision Reply",
    "",
    "Use the public launch handoff approval template when ready. Until a gate is explicitly approved, it remains blocked."
  ].join("\n");
}

function renderHtml(handoff) {
  const gateCards = handoff.blockingGates.map((gate) => `
    <article class="card gate">
      <div class="row">
        <span class="pill">${escapeHtml(gate.id)}</span>
        <span>${escapeHtml(gate.owner)}</span>
      </div>
      <h3>${escapeHtml(gate.title)}</h3>
      <p>${escapeHtml(gate.next)}</p>
      <small>${escapeHtml(gate.evidence)}</small>
    </article>
  `).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TabMosaic Release Candidate Review</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7f4;
      --ink: #172421;
      --muted: #63736e;
      --line: #dfe7e2;
      --panel: rgba(255, 255, 255, 0.78);
      --accent: #2f7469;
      --danger: #9f3b3b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: linear-gradient(135deg, #fbfcfa, var(--bg));
      color: var(--ink);
      font: 15px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(1180px, calc(100% - 32px));
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
      max-width: 840px;
      font-size: 42px;
      line-height: 1.06;
      letter-spacing: 0;
    }
    p { margin: 0; color: var(--muted); }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
    .card {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: 0 18px 48px rgba(23, 36, 33, 0.07);
      backdrop-filter: blur(18px);
      padding: 16px;
    }
    .metric span, small { color: var(--muted); font-size: 12px; font-weight: 750; }
    .metric strong { display: block; margin-top: 8px; font-size: 20px; line-height: 1.1; word-break: break-word; }
    h2 { margin: 26px 0 12px; font-size: 20px; letter-spacing: 0; }
    h3 { margin: 10px 0 8px; font-size: 16px; letter-spacing: 0; }
    code {
      display: block;
      margin-top: 8px;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #e8eee9;
      background: rgba(255, 255, 255, 0.72);
      color: var(--ink);
      overflow-wrap: anywhere;
    }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .pill {
      display: inline-flex;
      width: fit-content;
      border: 1px solid rgba(47, 116, 105, 0.28);
      border-radius: 999px;
      padding: 4px 8px;
      color: var(--accent);
      font-size: 12px;
      font-weight: 800;
    }
    .blocked { color: var(--danger); }
    textarea {
      width: 100%;
      min-height: 310px;
      resize: vertical;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      color: var(--ink);
      background: rgba(255, 255, 255, 0.78);
      font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    @media (max-width: 900px) {
      .grid, .two, .cards { grid-template-columns: 1fr; }
      h1 { font-size: 34px; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="eyebrow">Release candidate</div>
      <h1>One local packet for package, store assets, QA, and launch gates.</h1>
      <p>This page is a local review aid only. It does not approve public launch, submit to Chrome Web Store, post marketing copy, run real-profile QA, or read private browser data.</p>
    </header>

    <section class="grid">
      <div class="card metric"><span>Status</span><strong class="blocked">${escapeHtml(handoff.status)}</strong></div>
      <div class="card metric"><span>Final launch</span><strong class="blocked">${escapeHtml(handoff.finalLaunchGate.finalLaunchReady || "unknown")}</strong></div>
      <div class="card metric"><span>Remote CI</span><strong class="blocked">${escapeHtml(handoff.finalLaunchGate.readiness?.remoteCi || "unknown")}</strong></div>
      <div class="card metric"><span>Store launch</span><strong class="blocked">${escapeHtml(handoff.readiness.publicChromeWebStoreLaunch)}</strong></div>
    </section>

    <h2>Final launch gate</h2>
    <section class="grid two">
      <div class="card">
        <h3>FINAL_LAUNCH_READY=${escapeHtml(handoff.finalLaunchGate.finalLaunchReady || "unknown")}</h3>
        <p>Final gate combines package verification, public launch decisions, QA state, and optional remote CI.</p>
        <code>READY_REMOTE_CI=${escapeHtml(handoff.finalLaunchGate.readiness?.remoteCi || "unknown")}</code>
      </div>
      <div class="card">
        <h3>Remote CI</h3>
        <p>${escapeHtml(handoff.finalLaunchGate.remoteCi?.status || "not checked")} / ${escapeHtml(handoff.finalLaunchGate.remoteCi?.reason || "none")}</p>
        <code>${escapeHtml(handoff.finalLaunchGate.remoteCi?.nextAction || "No remote CI action recorded.")}</code>
      </div>
    </section>

    <h2>Extension package</h2>
    <section class="grid two">
      <div class="card">
        <h3>${escapeHtml(handoff.packageInfo.product)} ${escapeHtml(handoff.packageInfo.version)}</h3>
        <p>Current packaged zip and checksum.</p>
        <code>${escapeHtml(handoff.packageInfo.zipPath)}</code>
        <code>${escapeHtml(handoff.packageInfo.sha256)}</code>
      </div>
      <div class="card">
        <h3>Package safety</h3>
        <p>Package manifest says env files, source maps, and node_modules are excluded.</p>
        <code>${escapeHtml(handoff.packageInfo.packageManifestPath)}</code>
        <code>working tree clean: ${escapeHtml(handoff.packageInfo.workingTreeClean ? "yes" : "no")} (${escapeHtml(handoff.packageInfo.gitStatusCount || 0)} status rows)</code>
      </div>
    </section>

    <h2>Review artifacts</h2>
    <section class="cards">
      <article class="card">
        <span class="pill">D-L03 - D-L14</span>
        <h3>Public launch decisions</h3>
        <p>Review owner, next action, and copyable reply template.</p>
        <code>${escapeHtml(handoff.publicLaunchHandoff.decisionReviewPath)}</code>
      </article>
      <article class="card">
        <span class="pill">D-L12</span>
        <h3>Store screenshots</h3>
        <p>Synthetic/mock screenshot preview. Still needs user approval.</p>
        <code>${escapeHtml(handoff.storeReview.previewPath)}</code>
      </article>
      <article class="card">
        <span class="pill">D-L11</span>
        <h3>Real-profile QA</h3>
        <p>Manual checklist only. Does not inspect Chrome automatically.</p>
        <code>${escapeHtml(handoff.realProfileQa.checklistPath)}</code>
      </article>
    </section>

    <h2>Blocking gates</h2>
    <section class="cards">
      ${gateCards || '<article class="card"><h3>No blocking gates</h3><p>Ready for final submission review.</p></article>'}
    </section>

    <h2>Copyable decision reply</h2>
    <textarea spellcheck="false">${escapeHtml(handoff.decisionReplyTemplate)}</textarea>
  </main>
</body>
</html>
`;
}

function renderManifest(handoff) {
  return {
    generatedAt: handoff.generatedAt,
    status: handoff.status,
    packet: {
      directory: handoff.packetDir,
      readme: handoff.readmePath,
      htmlReview: handoff.htmlPath,
      manifest: handoff.manifestPath
    },
    package: handoff.packageInfo,
    readiness: handoff.readiness,
    finalLaunchGate: handoff.finalLaunchGate,
    counts: handoff.counts,
    finalGateCounts: handoff.finalGateCounts,
    publicSourceReleaseBlockers: handoff.publicSourceReleaseBlockers,
    publicLaunchBlockers: handoff.publicLaunchBlockers,
    blockingGates: handoff.blockingGates,
    reviewArtifacts: {
      publicLaunchHandoff: handoff.publicLaunchHandoff,
      storeReview: handoff.storeReview,
      realProfileQa: handoff.realProfileQa
    }
  };
}

function printPacket(packet) {
  const payload = {
    packetDir: packet.packetDir,
    readmePath: packet.readmePath,
    reviewPath: packet.htmlPath,
    manifestPath: packet.manifestPath,
    status: packet.status
  };

  if (SHOULD_JSON) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`Release candidate packet status: ${packet.status}`);
  console.log(`Release candidate packet: ${relative(packet.packetDir)}`);
  console.log(`Review HTML: ${relative(packet.htmlPath)}`);
}

function runStep(label, command, args) {
  log(`\n==> ${label}`);
  const result = childProcess.spawnSync(command, args, {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  printCaptured(result);

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

function runJsonTool(scriptPath, args) {
  const result = childProcess.spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.error) throw result.error;
  if (result.stderr) log(result.stderr.trim());
  if (result.status !== 0) {
    throw new Error(`${scriptPath} failed with exit code ${result.status}`);
  }

  return JSON.parse(result.stdout);
}

function finalGateArgs() {
  const args = ["--json", "--allow-blocked"];
  if (SHOULD_INCLUDE_REMOTE_CI) args.push("--include-remote-ci");
  return args;
}

function publicLaunchHandoffArgs() {
  const args = ["--json"];
  if (SHOULD_INCLUDE_REMOTE_CI) args.push("--include-remote-ci");
  return args;
}

function printCaptured(result) {
  if (result.stdout) log(result.stdout.trim());
  if (result.stderr) log(result.stderr.trim());
}

function log(message) {
  if (!message) return;
  const output = `${message}\n`;
  if (SHOULD_JSON) {
    process.stderr.write(output);
  } else {
    process.stdout.write(output);
  }
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
  const fixture = {
    generatedAt: "2026-06-15T00:00:00.000Z",
    status: "BLOCKED_NEEDS_USER_INPUT_OR_QA",
    readiness: {
      publicSourceRelease: "yes",
      publicRepoPush: "yes",
      publicMarketingLaunch: "no",
      publicChromeWebStoreLaunch: "no"
    },
    finalLaunchGate: {
      finalLaunchReady: "no",
      readiness: {
        localReleasePackage: "yes",
        remoteCi: "skipped",
        publicSourceRelease: "yes",
        publicMarketingLaunch: "no",
        publicChromeWebStoreLaunch: "no"
      },
      counts: {
        blockers: 1,
        userInputBlockers: 1,
        qaBlockers: 0,
        accountOwnerBlockers: 0,
        buildBlockers: 0
      },
      remoteCi: {
        status: "skipped",
        reason: "REMOTE_CI_NOT_REQUESTED",
        nextAction: ""
      }
    },
    counts: {
      blockingGates: 1,
      userInputGates: 1,
      qaGates: 0
    },
    finalGateCounts: {
      blockers: 1,
      userInputBlockers: 1,
      qaBlockers: 0,
      accountOwnerBlockers: 0,
      buildBlockers: 0
    },
    packageInfo: {
      product: "TabMosaic AI",
      version: "0.1.0",
      packageName: "tabmosaic-ai-extension-v0.1.0.zip",
      zipPath: "dist/tabmosaic-ai-extension-v0.1.0.zip",
      checksumPath: "dist/tabmosaic-ai-extension-v0.1.0.sha256",
      packageManifestPath: "dist/tabmosaic-ai-extension-v0.1.0.package.json",
      sha256: "0".repeat(64),
    commit: "fixture",
      workingTreeClean: false,
      gitStatusCount: 1,
      gitStatusPreview: [" M tools/prepare_release_candidate_packet.js"],
      safety: {
        includesEnvFiles: false,
        includesSourceMaps: false,
        includesNodeModules: false
      }
    },
    blockingGates: [
      {
        id: "D-L03",
        title: "Brand/domain",
        owner: "USER INPUT",
        status: "BLOCKING",
        next: "Choose final public name and domain path",
        evidence: "fixture"
      }
    ],
    publicSourceReleaseBlockers: "none",
    publicLaunchBlockers: "D-L03",
    storeReview: {
      status: "READY_FOR_USER_REVIEW",
      previewPath: "artifacts/store-asset-review/fixture/store-asset-review.html",
      manifestPath: "artifacts/store-asset-review/fixture/manifest.json"
    },
    realProfileQa: {
      checklistPath: "artifacts/real-profile-qa/fixture/real-profile-qa-checklist.html",
      draftPath: "artifacts/real-profile-qa/fixture/real-profile-qa-draft.md"
    },
    publicLaunchHandoff: {
      status: "BLOCKED_NEEDS_USER_INPUT_OR_QA",
      readmePath: "artifacts/public-launch-handoff/fixture/README.md",
      decisionReviewPath: "artifacts/public-launch-handoff/fixture/launch-decision-review.html"
    },
    decisionReplyTemplate: "D-L03 change: final public name = <name>."
  };

  fixture.packetDir = "artifacts/release-candidate/fixture";
  fixture.readmePath = "artifacts/release-candidate/fixture/README.md";
  fixture.htmlPath = "artifacts/release-candidate/fixture/release-candidate-review.html";
  fixture.manifestPath = "artifacts/release-candidate/fixture/release-candidate-manifest.json";

  const readme = renderReadme(fixture);
  const html = renderHtml(fixture);
  const manifest = renderManifest(fixture);

  assertIncludes(readme, "Release Candidate Review Packet", "README title");
  assertIncludes(readme, "does not approve public launch", "README boundary");
  assertIncludes(readme, "READY_PUBLIC_SOURCE_RELEASE=yes", "source readiness");
  assertIncludes(readme, "FINAL_LAUNCH_READY=no", "final launch readiness");
  assertIncludes(readme, "READY_REMOTE_CI=skipped", "remote CI readiness");
  assertIncludes(readme, "release-candidate-review.html", "self path");
  assertIncludes(html, "One local packet for package, store assets, QA, and launch gates.", "HTML title");
  assertIncludes(html, "Final launch gate", "HTML final gate section");
  assertIncludes(html, "D-L03", "blocking gate");

  if (manifest.status !== "BLOCKED_NEEDS_USER_INPUT_OR_QA") {
    throw new Error("Manifest status mismatch");
  }
  if (manifest.finalLaunchGate.finalLaunchReady !== "no") {
    throw new Error("Manifest final launch gate mismatch");
  }

  console.log("PASS release candidate packet self-test");
}

function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) {
    throw new Error(`Missing ${label}: ${expected}`);
  }
}

function gitStatusShort() {
  const result = childProcess.spawnSync("git", ["status", "--short"], {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}
