const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUT_ROOT = path.join(ROOT_DIR, "artifacts", "store-submission-review");
const SHOULD_SELF_TEST = process.argv.includes("--self-test");
const SHOULD_JSON = process.argv.includes("--json");

const SOURCE_FILES = {
  storeDraft: "05_PROJECT/07_STORE_SUBMISSION_DRAFT.md",
  privacyPolicy: "05_PROJECT/13_PRIVACY_POLICY_DRAFT.md",
  dataDisclosure: "05_PROJECT/14_CHROME_STORE_DATA_DISCLOSURE_DRAFT.md",
  launchDecisionPacket: "05_PROJECT/16_PUBLIC_LAUNCH_DECISION_PACKET.md",
  manifest: "extension/manifest.json"
};

main();

function main() {
  if (SHOULD_SELF_TEST) {
    runSelfTest();
    return;
  }

  const packet = createPacket({
    sourceTexts: readSourceTexts(),
    launchReport: runJsonTool("tools/launch_readiness_report.js", ["--json"]),
    storeAssetReview: runJsonTool("tools/prepare_store_asset_review_packet.js", ["--json"])
  });
  printPacket(packet);
}

function createPacket({ sourceTexts, launchReport, storeAssetReview }) {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const packetDir = path.join(OUT_ROOT, runId);
  const readmePath = path.join(packetDir, "README.md");
  const htmlPath = path.join(packetDir, "store-submission-review.html");
  const fieldsPath = path.join(packetDir, "copyable-store-fields.md");
  const manifestPath = path.join(packetDir, "store-submission-review.json");
  const handoff = buildHandoff({ sourceTexts, launchReport, storeAssetReview });

  fs.mkdirSync(packetDir, { recursive: true });
  handoff.packetDir = relative(packetDir);
  handoff.readmePath = relative(readmePath);
  handoff.htmlPath = relative(htmlPath);
  handoff.fieldsPath = relative(fieldsPath);
  handoff.manifestPath = relative(manifestPath);

  fs.writeFileSync(readmePath, `${renderReadme(handoff)}\n`);
  fs.writeFileSync(htmlPath, renderHtml(handoff));
  fs.writeFileSync(fieldsPath, `${renderCopyableFields(handoff)}\n`);
  fs.writeFileSync(manifestPath, `${JSON.stringify(renderManifest(handoff), null, 2)}\n`);

  return {
    packetDir,
    readmePath,
    htmlPath,
    fieldsPath,
    manifestPath,
    status: handoff.status,
    handoff
  };
}

function buildHandoff({ sourceTexts, launchReport, storeAssetReview }) {
  const manifest = JSON.parse(sourceTexts.manifest);
  const storeDraft = sourceTexts.storeDraft;
  const dataDisclosure = sourceTexts.dataDisclosure;
  const privacyPolicy = sourceTexts.privacyPolicy;
  const blockingStoreGates = (launchReport.gates || []).filter((gate) =>
    ["D-L03", "D-L04", "D-L05", "D-L06", "D-L07", "D-L08", "D-L10", "D-L11", "D-L12", "D-L14"].includes(gate.id)
    && String(gate.status || "").toLowerCase() !== "ready"
  );
  const privacyPlaceholders = findPlaceholders(privacyPolicy);
  const dataRows = parseDataCategoryRows(dataDisclosure);

  return {
    generatedAt: new Date().toISOString(),
    status: blockingStoreGates.length ? "BLOCKED_NEEDS_USER_INPUT_OR_QA" : "READY_FOR_STORE_REVIEW",
    sourceFiles: SOURCE_FILES,
    readiness: launchReport.readiness,
    counts: launchReport.counts,
    blockingStoreGates,
    storeAssetReview: {
      status: storeAssetReview.status || "unknown",
      previewPath: relative(storeAssetReview.previewPath),
      checklistPath: relative(storeAssetReview.checklistPath),
      manifestPath: relative(storeAssetReview.manifestPath)
    },
    manifest: {
      version: manifest.version,
      permissions: manifest.permissions || [],
      hostPermissions: manifest.host_permissions || [],
      optionalHostPermissions: manifest.optional_host_permissions || [],
      minimumChromeVersion: manifest.minimum_chrome_version
    },
    fields: {
      singlePurpose: extractFencedBlockAfter(storeDraft, "Recommended Chrome Web Store single purpose:"),
      shortListingPurpose: extractFencedBlockAfter(storeDraft, "Shorter listing version:"),
      shortDescription: extractFencedBlockAfter(storeDraft, "Short description:"),
      longDescription: extractFencedBlockAfter(storeDraft, "Long description draft:"),
      remoteCodeAnswer: extractFencedBlockAfter(storeDraft, "Recommended answer:"),
      dataUseCertification: extractFencedBlockAfter(dataDisclosure, "Recommended certification posture:"),
      disclosureSinglePurpose: extractFencedBlockAfter(dataDisclosure, "## Single Purpose Field Draft"),
      disclosureRemoteCode: extractFencedBlockAfter(dataDisclosure, "## Remote Code Field Draft")
    },
    dataRows,
    privacyPlaceholders
  };
}

function renderReadme(handoff) {
  const gateRows = handoff.blockingStoreGates
    .map((gate) => `| ${gate.id} | ${gate.title} | ${gate.owner} | ${gate.next} |`)
    .join("\n");

  return [
    "# Chrome Web Store Submission Review Packet",
    "",
    `Status: ${handoff.status}`,
    "",
    "This local packet gathers the draft Chrome Web Store listing fields, permission justifications, privacy-policy placeholders, data-use disclosure checklist, screenshot review packet, and remaining launch gates into one review surface.",
    "",
    "Boundary: this packet does not submit to Chrome Web Store, approve store copy, publish a privacy policy, upload screenshots, run real-profile QA, read browser data, or change public launch state.",
    "Output stays under ignored `artifacts/store-submission-review/`.",
    "",
    "## Current Store Readiness",
    "",
    `- READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=${handoff.readiness.publicChromeWebStoreLaunch}`,
    `- Blocking store gates: ${handoff.blockingStoreGates.length}`,
    `- Store screenshot review status: ${handoff.storeAssetReview.status}`,
    `- Privacy placeholders still present: ${handoff.privacyPlaceholders.join(", ") || "none"}`,
    "",
    "## Files In This Packet",
    "",
    `- HTML review: ${handoff.htmlPath}`,
    `- Copyable fields: ${handoff.fieldsPath}`,
    `- JSON manifest: ${handoff.manifestPath}`,
    `- Store screenshot preview: ${handoff.storeAssetReview.previewPath}`,
    "",
    "## Blocking Store Gates",
    "",
    "| Gate | Title | Owner | Needed next |",
    "|---|---|---|---|",
    gateRows || "| none | none | none | none |",
    "",
    "## Source Drafts",
    "",
    `- Store submission draft: ${handoff.sourceFiles.storeDraft}`,
    `- Privacy policy draft: ${handoff.sourceFiles.privacyPolicy}`,
    `- Chrome Web Store data disclosure draft: ${handoff.sourceFiles.dataDisclosure}`,
    `- Launch decision packet: ${handoff.sourceFiles.launchDecisionPacket}`,
    "",
    "## Suggested Review Order",
    "",
    "1. Open `store-submission-review.html`.",
    "2. Review `copyable-store-fields.md` for listing, permission, privacy, data-use, and remote-code fields.",
    "3. Replace privacy placeholders only after the user confirms developer identity, support email, website, privacy URL, and effective date.",
    "4. Review screenshot preview and approve D-L12 only if the assets match the current product.",
    "5. Do not submit to Chrome Web Store until D-L03 through D-L14 are resolved."
  ].join("\n");
}

function renderCopyableFields(handoff) {
  const permissionRows = [
    ["tabs", "Required to read open tab metadata, organize all normal windows, protect active/pinned/audible tabs, detect duplicates, focus existing tabs, and restore safely closed duplicate tabs."],
    ["tabGroups", "Required to create and update real Chrome native tab groups in the browser tab bar."],
    ["sidePanel", "Required to open the sidebar control center after the user clicks the extension icon."],
    ["storage", "Required to store local settings, rules, Undo/Restore snapshots, saved workspace snapshots, redacted diagnostics, duplicate safety audit counts, and optional AI settings."],
    ["scripting", "Required only for user-triggered current-tab summary/page question, using a content extractor on the active tab after user action."],
    ["activeTab", "Required to limit page-content extraction to the active tab after a user gesture."],
    ["https://api.deepseek.com/*", "Required only when the user enables optional BYOK AI features with DeepSeek as the configured provider."],
    ["Optional provider origins", "Requested only when the user configures a non-default BYOK provider host or localhost model endpoint and clicks Save/Test."]
  ];
  const dataRows = handoff.dataRows
    .map((row) => `| ${row.category} | ${row.selection} | ${row.reason} |`)
    .join("\n");

  return [
    "# Copyable Chrome Web Store Fields",
    "",
    "Status: DRAFT - CONFIRM BEFORE SUBMISSION",
    "",
    "Do not paste these fields into Chrome Web Store until the user approves final product name, support email, privacy URL, BYOK scope, screenshots, real-profile QA, and data-use disclosure.",
    "",
    "## Single Purpose",
    "",
    fenced(handoff.fields.singlePurpose),
    "",
    "## Short Description",
    "",
    fenced(handoff.fields.shortDescription),
    "",
    "## Long Description",
    "",
    fenced(handoff.fields.longDescription),
    "",
    "## Remote Code Answer",
    "",
    fenced(handoff.fields.remoteCodeAnswer || handoff.fields.disclosureRemoteCode),
    "",
    "## Permission Justifications",
    "",
    "| Permission | Draft justification |",
    "|---|---|",
    ...permissionRows.map((row) => `| \`${row[0]}\` | ${row[1]} |`),
    "",
    "## Data Type Checkbox Draft",
    "",
    "| Dashboard data category | Draft selection | Reason |",
    "|---|---|---|",
    dataRows,
    "",
    "## Data Use Certification Draft",
    "",
    fenced(handoff.fields.dataUseCertification),
    "",
    "## Privacy Placeholders Still Required",
    "",
    handoff.privacyPlaceholders.length
      ? handoff.privacyPlaceholders.map((item) => `- ${item}`).join("\n")
      : "- none"
  ].join("\n");
}

function renderHtml(handoff) {
  const gateCards = handoff.blockingStoreGates.map((gate) => `
    <article class="card">
      <div class="row"><span class="pill">${escapeHtml(gate.id)}</span><span>${escapeHtml(gate.owner)}</span></div>
      <h3>${escapeHtml(gate.title)}</h3>
      <p>${escapeHtml(gate.next)}</p>
      <small>${escapeHtml(gate.evidence)}</small>
    </article>
  `).join("\n");
  const dataRows = handoff.dataRows.map((row) => `
    <tr>
      <td>${escapeHtml(row.category)}</td>
      <td>${escapeHtml(row.selection)}</td>
      <td>${escapeHtml(row.reason)}</td>
    </tr>
  `).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TabMosaic Chrome Web Store Submission Review</title>
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
    h1 { margin: 0; max-width: 850px; font-size: 42px; line-height: 1.06; letter-spacing: 0; }
    h2 { margin: 26px 0 12px; font-size: 20px; letter-spacing: 0; }
    h3 { margin: 10px 0 8px; font-size: 16px; letter-spacing: 0; }
    p { margin: 0; color: var(--muted); }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
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
    .blocked { color: var(--danger); }
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
    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    pre, code {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      border: 1px solid #e8eee9;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.72);
      color: var(--ink);
    }
    pre { margin: 0; padding: 14px; font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    code { display: block; margin-top: 8px; padding: 10px; }
    table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 8px; background: rgba(255,255,255,0.72); }
    th, td { border: 1px solid var(--line); padding: 10px; text-align: left; vertical-align: top; }
    th { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0; }
    @media (max-width: 900px) {
      .grid, .cards, .two { grid-template-columns: 1fr; }
      h1 { font-size: 34px; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="eyebrow">Chrome Web Store draft</div>
      <h1>Submission fields, privacy placeholders, data disclosure, and screenshot review in one local page.</h1>
      <p>This page is a review aid only. It does not submit to Chrome Web Store, publish privacy policy copy, upload screenshots, run real-profile QA, or approve any launch gate.</p>
    </header>

    <section class="grid">
      <div class="card metric"><span>Status</span><strong class="blocked">${escapeHtml(handoff.status)}</strong></div>
      <div class="card metric"><span>Store launch</span><strong class="blocked">${escapeHtml(handoff.readiness.publicChromeWebStoreLaunch)}</strong></div>
      <div class="card metric"><span>Store gates</span><strong>${escapeHtml(handoff.blockingStoreGates.length)}</strong></div>
      <div class="card metric"><span>Screenshots</span><strong>${escapeHtml(handoff.storeAssetReview.status)}</strong></div>
    </section>

    <h2>Copyable listing fields</h2>
    <section class="grid two">
      <div class="card">
        <h3>Single purpose</h3>
        <pre>${escapeHtml(handoff.fields.singlePurpose)}</pre>
      </div>
      <div class="card">
        <h3>Short description</h3>
        <pre>${escapeHtml(handoff.fields.shortDescription)}</pre>
      </div>
    </section>

    <h2>Review artifacts</h2>
    <section class="cards">
      <article class="card">
        <span class="pill">Fields</span>
        <h3>Copyable store fields</h3>
        <p>Listing, permission, remote-code, and data-use drafts.</p>
        <code>${escapeHtml(handoff.fieldsPath)}</code>
      </article>
      <article class="card">
        <span class="pill">D-L12</span>
        <h3>Screenshot preview</h3>
        <p>Synthetic/mock assets only. User approval still required.</p>
        <code>${escapeHtml(handoff.storeAssetReview.previewPath)}</code>
      </article>
      <article class="card">
        <span class="pill">Privacy</span>
        <h3>Placeholders</h3>
        <p>${escapeHtml(handoff.privacyPlaceholders.join(", ") || "none")}</p>
      </article>
    </section>

    <h2>Data category draft</h2>
    <table>
      <thead><tr><th>Category</th><th>Draft selection</th><th>Reason</th></tr></thead>
      <tbody>${dataRows}</tbody>
    </table>

    <h2>Blocking store gates</h2>
    <section class="cards">
      ${gateCards || '<article class="card"><h3>No blocking gates</h3><p>Ready for store review.</p></article>'}
    </section>
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
      copyableFields: handoff.fieldsPath,
      manifest: handoff.manifestPath
    },
    readiness: handoff.readiness,
    counts: handoff.counts,
    blockingStoreGates: handoff.blockingStoreGates,
    sourceFiles: handoff.sourceFiles,
    extensionManifest: handoff.manifest,
    storeAssetReview: handoff.storeAssetReview,
    privacyPlaceholders: handoff.privacyPlaceholders,
    dataRows: handoff.dataRows,
    fields: handoff.fields
  };
}

function readSourceTexts() {
  return Object.fromEntries(
    Object.entries(SOURCE_FILES).map(([key, file]) => [key, fs.readFileSync(path.join(ROOT_DIR, file), "utf8")])
  );
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

function extractFencedBlockAfter(text, marker) {
  const start = text.indexOf(marker);
  if (start < 0) return "";
  const afterMarker = text.slice(start + marker.length);
  const match = afterMarker.match(/```(?:text|markdown)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : "";
}

function parseDataCategoryRows(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("|") && !line.includes("---") && !line.includes("Dashboard data category"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 4 && cells[3] === "CONFIRM")
    .map((cells) => ({
      category: stripMarkdown(cells[0]),
      selection: stripMarkdown(cells[1]),
      reason: stripMarkdown(cells[2])
    }));
}

function findPlaceholders(text) {
  return Array.from(new Set(text.match(/\[[^\]]+\]/g) || []))
    .filter((placeholder) => ["[Developer name]", "[support email]", "[website URL]", "[CONFIRM DATE]"].includes(placeholder));
}

function stripMarkdown(value) {
  return String(value || "")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .trim();
}

function fenced(value) {
  return ["```text", value || "CONFIRM BEFORE SUBMISSION", "```"].join("\n");
}

function printPacket(packet) {
  const payload = {
    packetDir: packet.packetDir,
    readmePath: packet.readmePath,
    reviewPath: packet.htmlPath,
    fieldsPath: packet.fieldsPath,
    manifestPath: packet.manifestPath,
    status: packet.status
  };

  if (SHOULD_JSON) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`Store submission review packet status: ${packet.status}`);
  console.log(`Store submission review packet: ${relative(packet.packetDir)}`);
  console.log(`Review HTML: ${relative(packet.htmlPath)}`);
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

function log(message) {
  if (!message) return;
  const output = `${message}\n`;
  if (SHOULD_JSON) {
    process.stderr.write(output);
  } else {
    process.stdout.write(output);
  }
}

function runSelfTest() {
  const sourceTexts = {
    storeDraft: [
      "Recommended Chrome Web Store single purpose:",
      "```text",
      "Organizes tabs.",
      "```",
      "Short description:",
      "```text",
      "One-click tab organization.",
      "```",
      "Long description draft:",
      "```text",
      "Long copy.",
      "```",
      "Recommended answer:",
      "```text",
      "No remote code.",
      "```"
    ].join("\n"),
    privacyPolicy: "Effective date: [CONFIRM DATE]\nQuestions or requests: [support email]",
    dataDisclosure: [
      "| Dashboard data category | Draft selection | Reason | Confirmation status |",
      "|---|---|---|---|",
      "| Web history / web browsing activity | RECOMMENDED: Yes | Open-tab metadata is processed. | CONFIRM |",
      "| Location | RECOMMENDED: No | Not used. | CONFIRM |",
      "Recommended certification posture:",
      "```text",
      "Use data only for the single purpose.",
      "```",
      "## Single Purpose Field Draft",
      "```text",
      "Disclosure single purpose.",
      "```",
      "## Remote Code Field Draft",
      "```text",
      "No remote executable code.",
      "```"
    ].join("\n"),
    launchDecisionPacket: "fixture",
    manifest: JSON.stringify({
      version: "0.1.0",
      minimum_chrome_version: "116",
      permissions: ["tabs"],
      host_permissions: ["https://api.deepseek.com/*"],
      optional_host_permissions: ["https://*/*"]
    })
  };
  const handoff = buildHandoff({
    sourceTexts,
    launchReport: {
      readiness: {
        publicChromeWebStoreLaunch: "no"
      },
      counts: {
        blockingGates: 1
      },
      gates: [
        {
          id: "D-L06",
          title: "Store single purpose",
          status: "BLOCKING",
          owner: "USER INPUT",
          next: "Approve exact wording",
          evidence: "fixture"
        }
      ]
    },
    storeAssetReview: {
      status: "READY_FOR_USER_REVIEW",
      previewPath: path.join(ROOT_DIR, "artifacts/store-asset-review/fixture/store-asset-review.html"),
      checklistPath: path.join(ROOT_DIR, "artifacts/store-asset-review/fixture/store-asset-review.md"),
      manifestPath: path.join(ROOT_DIR, "artifacts/store-asset-review/fixture/manifest.json")
    }
  });
  handoff.packetDir = "artifacts/store-submission-review/fixture";
  handoff.readmePath = "artifacts/store-submission-review/fixture/README.md";
  handoff.htmlPath = "artifacts/store-submission-review/fixture/store-submission-review.html";
  handoff.fieldsPath = "artifacts/store-submission-review/fixture/copyable-store-fields.md";
  handoff.manifestPath = "artifacts/store-submission-review/fixture/store-submission-review.json";

  const readme = renderReadme(handoff);
  const html = renderHtml(handoff);
  const fields = renderCopyableFields(handoff);
  const manifest = renderManifest(handoff);

  assertIncludes(readme, "Chrome Web Store Submission Review Packet", "README title");
  assertIncludes(readme, "does not submit to Chrome Web Store", "boundary");
  assertIncludes(html, "Submission fields, privacy placeholders", "HTML title");
  assertIncludes(fields, "One-click tab organization.", "short description");
  assertIncludes(fields, "Web history / web browsing activity", "data category");
  assertIncludes(fields, "[support email]", "privacy placeholder");

  if (manifest.status !== "BLOCKED_NEEDS_USER_INPUT_OR_QA") {
    throw new Error("Manifest status mismatch");
  }

  console.log("PASS store submission review packet self-test");
}

function assertIncludes(text, expected, label) {
  if (!text.includes(expected)) {
    throw new Error(`Missing ${label}: ${expected}`);
  }
}
