const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const STORE_SCREENSHOT_DIR = path.join(ROOT_DIR, "artifacts", "store-screenshots");
const REVIEW_ROOT = path.join(ROOT_DIR, "artifacts", "store-asset-review");
const WIDTH = 1280;
const HEIGHT = 800;
const SHOULD_SELF_TEST = process.argv.includes("--self-test");
const SHOULD_JSON = process.argv.includes("--json");

const CANONICAL_SCREENSHOTS = [
  {
    name: "01-one-click-native-groups.png",
    purpose: "One-click Smart Organize and native Chrome groups"
  },
  {
    name: "02-tab-agent-sidebar.png",
    purpose: "Sidebar Agent result, Undo, Restore, and follow-up control"
  },
  {
    name: "03-smart-groups-dashboard.png",
    purpose: "Editable Smart Groups dashboard"
  },
  {
    name: "04-page-chat.png",
    purpose: "Current-page chat from user-triggered visible text"
  },
  {
    name: "05-mobile-dashboard.png",
    purpose: "Compact dashboard/narrow layout"
  }
];

main();

function main() {
  if (SHOULD_SELF_TEST) {
    runSelfTest();
    return;
  }

  const packet = createPacket();
  printPacket(packet);
}

function createPacket() {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const packetDir = path.join(REVIEW_ROOT, runId);
  const checklistPath = path.join(packetDir, "store-asset-review.md");
  const previewPath = path.join(packetDir, "store-asset-review.html");
  const commandsPath = path.join(packetDir, "commands.txt");
  const manifestPath = path.join(packetDir, "manifest.json");
  const screenshotRows = collectScreenshotRows(STORE_SCREENSHOT_DIR);
  const extraFiles = collectExtraPngFiles(STORE_SCREENSHOT_DIR);
  const isReadyForUserReview = screenshotRows.every((row) => row.status === "ready") && extraFiles.length === 0;

  fs.mkdirSync(packetDir, { recursive: true });
  fs.writeFileSync(checklistPath, renderChecklist({ screenshotRows, extraFiles, isReadyForUserReview }));
  fs.writeFileSync(previewPath, renderHtmlPreview({ screenshotRows, extraFiles, isReadyForUserReview, packetDir }));
  fs.writeFileSync(commandsPath, renderCommands());
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify({
      status: isReadyForUserReview ? "READY_FOR_USER_REVIEW" : "NEEDS_REGENERATION_OR_CLEANUP",
      generatedAt: new Date().toISOString(),
      screenshotDir: path.relative(ROOT_DIR, STORE_SCREENSHOT_DIR),
      htmlPreview: path.relative(ROOT_DIR, previewPath),
      canonicalScreenshots: screenshotRows,
      extraPngFiles: extraFiles
    }, null, 2)}\n`
  );

  return {
    packetDir,
    checklistPath,
    previewPath,
    commandsPath,
    manifestPath,
    status: isReadyForUserReview ? "READY_FOR_USER_REVIEW" : "NEEDS_REGENERATION_OR_CLEANUP",
    screenshotRows,
    extraFiles
  };
}

function collectScreenshotRows(dir) {
  return CANONICAL_SCREENSHOTS.map((item) => {
    const filePath = path.join(dir, item.name);
    if (!fs.existsSync(filePath)) {
      return {
        name: item.name,
        purpose: item.purpose,
        path: path.relative(ROOT_DIR, filePath),
        status: "missing"
      };
    }

    const dimensions = readPngDimensions(filePath);
    const stats = fs.statSync(filePath);
    const isReady = dimensions.width === WIDTH && dimensions.height === HEIGHT && stats.size >= 50000;

    return {
      name: item.name,
      purpose: item.purpose,
      path: path.relative(ROOT_DIR, filePath),
      width: dimensions.width,
      height: dimensions.height,
      bytes: stats.size,
      status: isReady ? "ready" : "invalid_dimensions_or_size"
    };
  });
}

function collectExtraPngFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const expected = new Set(CANONICAL_SCREENSHOTS.map((item) => item.name));
  return fs.readdirSync(dir)
    .filter((entry) => entry.endsWith(".png") && !expected.has(entry))
    .sort()
    .map((entry) => path.relative(ROOT_DIR, path.join(dir, entry)));
}

function renderChecklist({ screenshotRows, extraFiles, isReadyForUserReview }) {
  const rows = screenshotRows
    .map((row) => `| ${row.name} | ${row.status} | ${row.width || "-"}x${row.height || "-"} | ${row.purpose} |`)
    .join("\n");
  const extra = extraFiles.length
    ? extraFiles.map((file) => `- ${file}`).join("\n")
    : "- none";

  return [
    "# Store Asset Review Packet",
    "",
    `Status: ${isReadyForUserReview ? "READY FOR USER REVIEW" : "NEEDS REGENERATION OR CLEANUP"}`,
    "",
    "This local packet prepares D-L12 review. It does not approve screenshots, publish anything, submit to Chrome Web Store, or use real browsing data.",
    "",
    "## Canonical Chrome Web Store Screenshot Drafts",
    "",
    "| File | Status | Size | Purpose |",
    "|---|---|---:|---|",
    rows,
    "",
    "## Extra Store Screenshot PNGs To Ignore",
    "",
    extra,
    "",
    "## User Approval Checklist",
    "",
    "- [ ] Open `store-asset-review.html` and inspect the five screenshot previews.",
    "- [ ] These five screenshots use mock/synthetic data only.",
    "- [ ] No real tab titles, URLs, emails, API keys, page text, or private screenshots are visible.",
    "- [ ] The screenshots match the current product positioning: one-click native groups plus Sidebar Agent.",
    "- [ ] The screenshots do not imply Chrome Web Store availability before approval.",
    "- [ ] The screenshots are acceptable for the next public/store draft.",
    "- [ ] Demo video/storyboard is approved separately before launch posts or store submission.",
    "",
    "## Boundary",
    "",
    "D-L12 remains CONFIRM until the user approves final screenshots/demo. Passing this packet only means the assets are ready to review."
  ].join("\n");
}

function renderHtmlPreview({ screenshotRows, extraFiles, isReadyForUserReview, packetDir }) {
  const cards = screenshotRows.map((row, index) => {
    const absoluteScreenshotPath = path.join(ROOT_DIR, row.path);
    const relativeScreenshotPath = normalizeHtmlPath(path.relative(packetDir, absoluteScreenshotPath));
    const statusClass = row.status === "ready" ? "ready" : "warn";

    return `
      <article class="shot-card">
        <div class="shot-meta">
          <span class="shot-index">${String(index + 1).padStart(2, "0")}</span>
          <div>
            <h2>${escapeHtml(row.purpose)}</h2>
            <p>${escapeHtml(row.name)} · ${escapeHtml(row.width || "-")}x${escapeHtml(row.height || "-")} · ${escapeHtml(formatBytes(row.bytes))}</p>
          </div>
          <span class="status ${statusClass}">${escapeHtml(row.status)}</span>
        </div>
        ${
          row.status === "missing"
            ? `<div class="missing-shot">Missing screenshot draft: ${escapeHtml(row.name)}</div>`
            : `<img src="${escapeHtml(relativeScreenshotPath)}" alt="${escapeHtml(row.purpose)}">`
        }
      </article>`;
  }).join("\n");
  const extraList = extraFiles.length
    ? extraFiles.map((file) => `<li>${escapeHtml(file)}</li>`).join("")
    : "<li>none</li>";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TabMosaic Store Asset Review</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f6f3;
      --ink: #172421;
      --muted: #60706c;
      --line: #dfe7e2;
      --panel: rgba(255, 255, 255, 0.78);
      --accent: #2f7469;
      --warn: #a76622;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at 86% 4%, rgba(47, 116, 105, 0.12), transparent 30%),
        linear-gradient(135deg, #f8fbf8, var(--bg));
      color: var(--ink);
      font: 15px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 44px 28px 64px;
    }
    .hero {
      display: grid;
      gap: 14px;
      margin-bottom: 26px;
    }
    .eyebrow {
      color: var(--accent);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      max-width: 760px;
      font-size: 42px;
      line-height: 1.06;
      letter-spacing: 0;
    }
    .hero p {
      margin: 0;
      max-width: 780px;
      color: var(--muted);
      font-size: 17px;
    }
    .banner {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin: 24px 0 30px;
      padding: 14px 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      backdrop-filter: blur(18px);
    }
    .banner strong { margin-right: 6px; }
    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #e7f0ed;
      color: #1f5f55;
      font-size: 12px;
      font-weight: 750;
    }
    .grid {
      display: grid;
      gap: 22px;
    }
    .shot-card {
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: 0 22px 60px rgba(23, 36, 33, 0.08);
      backdrop-filter: blur(18px);
    }
    .shot-meta {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 14px;
      align-items: center;
      padding: 15px 16px;
      border-bottom: 1px solid var(--line);
    }
    .shot-index {
      display: inline-grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #ecf3ef;
      color: #265f56;
      font-weight: 850;
    }
    h2 {
      margin: 0;
      font-size: 17px;
      letter-spacing: 0;
    }
    .shot-meta p {
      margin: 2px 0 0;
      color: var(--muted);
      font-size: 13px;
      overflow-wrap: anywhere;
    }
    .status {
      padding: 4px 9px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
    }
    .status.ready {
      background: #dff0e9;
      color: #226257;
    }
    .status.warn {
      background: #f7eadb;
      color: var(--warn);
    }
    img {
      display: block;
      width: 100%;
      height: auto;
      background: #fff;
    }
    .missing-shot {
      min-height: 220px;
      display: grid;
      place-items: center;
      color: var(--warn);
      background: #fff8ef;
      padding: 28px;
      text-align: center;
    }
    .approval {
      margin-top: 24px;
      padding: 18px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.7);
    }
    .approval h2 { margin-bottom: 8px; }
    ul {
      margin: 8px 0 0;
      padding-left: 20px;
      color: var(--muted);
    }
    code {
      padding: 2px 5px;
      border-radius: 5px;
      background: #edf2ef;
      color: #243733;
    }
    @media (max-width: 720px) {
      main { padding: 28px 16px 44px; }
      h1 { font-size: 31px; }
      .shot-meta { grid-template-columns: auto minmax(0, 1fr); }
      .status { grid-column: 2; justify-self: start; }
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="eyebrow">D-L12 local review aid</div>
      <h1>Store screenshot review</h1>
      <p>This page previews the five canonical Chrome Web Store screenshot drafts. It uses only local mock/synthetic assets and does not approve, submit, publish, or upload anything.</p>
    </section>
    <section class="banner" aria-label="Review status">
      <strong>Status:</strong>
      <span class="pill">${escapeHtml(isReadyForUserReview ? "READY FOR USER REVIEW" : "NEEDS REGENERATION OR CLEANUP")}</span>
      <span class="pill">Mock/synthetic data only</span>
      <span class="pill">D-L12 still requires user approval</span>
    </section>
    <section class="grid" aria-label="Screenshot previews">
      ${cards}
    </section>
    <section class="approval">
      <h2>Approval checklist</h2>
      <ul>
        <li>Confirm these screenshots contain no real tab titles, URLs, emails, API keys, page text, or private browser data.</li>
        <li>Confirm the sequence communicates one-click native groups, Sidebar Agent, dashboard, current-page chat, and compact layout.</li>
        <li>Confirm the screenshots do not imply Chrome Web Store availability before launch approval.</li>
        <li>Confirm demo video/storyboard separately before public posts or store submission.</li>
      </ul>
    </section>
    <section class="approval">
      <h2>Extra PNG files</h2>
      <ul>${extraList}</ul>
      <p>D-L12 remains <code>CONFIRM</code> until the user explicitly approves final screenshots/demo.</p>
    </section>
  </main>
</body>
</html>`;
}

function renderCommands() {
  return [
    "Run from the repository root:",
    "",
    "node tools/capture_ui_screenshots.js",
    "node tools/build_store_screenshots.js",
    "node tools/prepare_store_asset_review_packet.js",
    "",
    "Open the generated store-asset-review.html file locally to inspect the five screenshots.",
    "",
    "Before public/store use:",
    "- review the generated packet;",
    "- confirm D-L12 explicitly;",
    "- keep READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no until all launch gates are resolved."
  ].join("\n");
}

function normalizeHtmlPath(value) {
  return String(value || "").split(path.sep).join("/");
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error(`Not a PNG file: ${path.relative(ROOT_DIR, filePath)}`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function runSelfTest() {
  const tmpDir = path.join(REVIEW_ROOT, `self-test-${Date.now()}`);
  const pngPath = path.join(tmpDir, "test.png");
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(pngPath, makeMinimalPngHeader(1280, 800));
  const dimensions = readPngDimensions(pngPath);
  const preview = renderHtmlPreview({
    screenshotRows: [
      {
        name: "01-one-click-native-groups.png",
        purpose: "One-click Smart Organize and native Chrome groups",
        path: "artifacts/store-screenshots/01-one-click-native-groups.png",
        width: 1280,
        height: 800,
        bytes: 65000,
        status: "ready"
      }
    ],
    extraFiles: [],
    isReadyForUserReview: true,
    packetDir: tmpDir
  });

  if (dimensions.width !== 1280 || dimensions.height !== 800) {
    throw new Error(`PNG dimension parser failed: ${dimensions.width}x${dimensions.height}`);
  }
  assertIncludes(preview, "<!doctype html>", "HTML preview doctype");
  assertIncludes(preview, "Store screenshot review", "HTML preview title");
  assertIncludes(preview, "D-L12 still requires user approval", "HTML preview approval boundary");
  assertIncludes(preview, "01-one-click-native-groups.png", "HTML preview screenshot file");

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log("PASS store asset review packet self-test");
}

function assertIncludes(content, token, label) {
  if (!String(content || "").includes(token)) {
    throw new Error(`${label} missing token: ${token}`);
  }
}

function makeMinimalPngHeader(width, height) {
  const buffer = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function printPacket(packet) {
  if (SHOULD_JSON) {
    console.log(JSON.stringify({
      packetDir: packet.packetDir,
      checklistPath: packet.checklistPath,
      previewPath: packet.previewPath,
      commandsPath: packet.commandsPath,
      manifestPath: packet.manifestPath,
      status: packet.status
    }, null, 2));
    return;
  }

  console.log("PASS store asset review packet prepared");
  console.log(`status=${packet.status}`);
  console.log(`packetDir=${packet.packetDir}`);
  console.log(`checklist=${packet.checklistPath}`);
  console.log(`preview=${packet.previewPath}`);
  console.log(`commands=${packet.commandsPath}`);
  console.log(`manifest=${packet.manifestPath}`);
}
