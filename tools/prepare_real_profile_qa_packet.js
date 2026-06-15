const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const TEMPLATE_PATH = path.join(ROOT_DIR, "05_PROJECT", "12_REAL_PROFILE_QA_RESULT_TEMPLATE.md");
const OUTPUT_ROOT = path.join(ROOT_DIR, "artifacts", "real-profile-qa");
const SHOULD_SELF_TEST = process.argv.includes("--self-test");
const SHOULD_JSON = process.argv.includes("--json");

main();

function main() {
  const runId = SHOULD_SELF_TEST
    ? `self-test-${Date.now()}`
    : new Date().toISOString().replace(/[:.]/g, "-");
  const packet = createPacket(runId);

  if (SHOULD_SELF_TEST) {
    assertPacket(packet);
    const redactionResult = childProcess.spawnSync(
      process.execPath,
      ["tools/real_profile_qa_redaction_check.js", path.relative(ROOT_DIR, packet.draftPath)],
      {
        cwd: ROOT_DIR,
        encoding: "utf8"
      }
    );

    if (redactionResult.status !== 0) {
      throw new Error(
        `Generated blank QA draft did not pass redaction check:\n${redactionResult.stdout}\n${redactionResult.stderr}`
      );
    }

    fs.rmSync(packet.packetDir, { recursive: true, force: true });
    console.log("PASS real-profile QA packet self-test");
    return;
  }

  printPacket(packet);
}

function createPacket(runId) {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Missing real-profile QA template: ${TEMPLATE_PATH}`);
  }

  const packetDir = path.join(OUTPUT_ROOT, runId);
  const draftPath = path.join(packetDir, "real-profile-qa-draft.md");
  const checklistPath = path.join(packetDir, "real-profile-qa-checklist.html");
  const readmePath = path.join(packetDir, "README.md");
  const commandsPath = path.join(packetDir, "commands.txt");
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");

  fs.mkdirSync(packetDir, { recursive: true });
  fs.writeFileSync(draftPath, template);
  fs.writeFileSync(checklistPath, renderChecklistHtml({ draftPath, commandsPath }));
  fs.writeFileSync(readmePath, renderReadme({ draftPath, commandsPath, checklistPath }));
  fs.writeFileSync(commandsPath, renderCommands({ draftPath }));

  return {
    packetDir,
    draftPath,
    checklistPath,
    readmePath,
    commandsPath
  };
}

function renderReadme({ draftPath, commandsPath, checklistPath }) {
  const relativeDraft = path.relative(ROOT_DIR, draftPath);
  const relativeCommands = path.relative(ROOT_DIR, commandsPath);
  const relativeChecklist = path.relative(ROOT_DIR, checklistPath);

  return [
    "# Real Profile QA Packet",
    "",
    "Status: LOCAL ONLY - DO NOT COMMIT A COMPLETED REAL-PROFILE RESULT WITHOUT REDACTION",
    "",
    "This packet is a local helper for the final real Chrome profile QA pass. It prepares a blank result draft and copyable commands, but it does not run Chrome or inspect browser data.",
    "",
    "## Safety",
    "",
    "- Does not open Chrome.",
    "- Does not read tabs, browser history, cookies, page text, screenshots, or Chrome profile files.",
    "- Does not read `.env.local` or provider keys.",
    "- Writes only under ignored `artifacts/real-profile-qa/`.",
    "- The generated draft starts as the blank template and must be manually redacted before sharing.",
    "",
    "## Recommended Order",
    "",
    "1. Run `node tools/preflight.js`.",
    "2. Run disposable QA first: `node tools/open_manual_qa_profile.js --self-test`.",
    "3. Run disposable manual QA: `node tools/open_manual_qa_profile.js --keep-fixture-server`.",
    `4. Open the local checklist page: \`${relativeChecklist}\`.`,
    "5. Only after disposable QA passes, load the extension in a non-critical real Chrome profile/window.",
    `6. Fill the local draft: \`${relativeDraft}\`.`,
    `7. Run the commands in \`${relativeCommands}\`.`,
    "8. Keep the completed real-profile notes local/private unless the redaction check passes and manual review removes private data.",
    "",
    "## Launch Boundary",
    "",
    "Passing this packet alone does not make the product public-launch ready. Public Chrome Web Store launch still needs the user-confirmed brand/domain, support email, privacy URL, store disclosures, final screenshots/demo approval, beta ramp, and launch timing."
  ].join("\n");
}

function renderChecklistHtml({ draftPath, commandsPath }) {
  const relativeDraft = path.relative(ROOT_DIR, draftPath);
  const relativeCommands = path.relative(ROOT_DIR, commandsPath);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TabMosaic Real Profile QA Checklist</title>
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
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at 88% 2%, rgba(47, 116, 105, 0.12), transparent 32%),
        linear-gradient(135deg, #fbfcfa, var(--bg));
      color: var(--ink);
      font: 15px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      padding: 44px 0 64px;
    }
    header {
      display: grid;
      gap: 12px;
      margin-bottom: 24px;
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
      max-width: 760px;
      font-size: 42px;
      line-height: 1.06;
      letter-spacing: 0;
    }
    header p {
      margin: 0;
      max-width: 820px;
      color: var(--muted);
      font-size: 17px;
    }
    .banner, section {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: 0 18px 48px rgba(23, 36, 33, 0.07);
      backdrop-filter: blur(18px);
    }
    .banner {
      display: grid;
      gap: 10px;
      margin-bottom: 20px;
      padding: 16px 18px;
    }
    .banner strong { color: var(--danger); }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }
    section {
      padding: 18px;
    }
    h2 {
      margin: 0 0 10px;
      font-size: 18px;
      letter-spacing: 0;
    }
    ol, ul {
      margin: 0;
      padding-left: 22px;
      color: var(--muted);
    }
    li + li { margin-top: 7px; }
    .checks {
      display: grid;
      gap: 9px;
      margin-top: 10px;
    }
    label {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 10px;
      align-items: start;
      color: #273a36;
    }
    input[type="checkbox"] {
      width: 17px;
      height: 17px;
      margin-top: 2px;
      accent-color: var(--accent);
    }
    code, pre {
      border-radius: 6px;
      background: #edf2ef;
      color: #243733;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 13px;
    }
    code { padding: 2px 5px; }
    pre {
      margin: 10px 0 0;
      padding: 12px;
      overflow: auto;
      white-space: pre-wrap;
    }
    .wide { grid-column: 1 / -1; }
    .danger { color: var(--danger); font-weight: 750; }
    @media (max-width: 760px) {
      main { width: min(100% - 24px, 1120px); padding-top: 30px; }
      h1 { font-size: 31px; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="eyebrow">D-L11 local QA aid</div>
      <h1>Real Chrome profile QA checklist</h1>
      <p>This local page helps a human tester run the final real-profile QA pass. It does not open Chrome, inspect tabs, read browser history, read page text, upload results, or approve public launch.</p>
    </header>

    <div class="banner">
      <strong>Safety boundary</strong>
      <span>Use a non-critical real Chrome profile/window first. Keep completed notes local/private unless they pass redaction and manual review.</span>
    </div>

    <div class="grid">
      <section>
        <h2>Recommended Order</h2>
        <ol>
          <li>Run the full local preflight.</li>
          <li>Run disposable QA self-test.</li>
          <li>Run disposable manual QA with fixture server.</li>
          <li>Only then load the extension into a non-critical real Chrome profile/window.</li>
          <li>Fill the Markdown draft and run the redaction check.</li>
        </ol>
      </section>

      <section>
        <h2>Local Files</h2>
        <ul>
          <li>Draft: <code>${escapeHtml(relativeDraft)}</code></li>
          <li>Commands: <code>${escapeHtml(relativeCommands)}</code></li>
          <li>Completed real-profile notes should stay private unless approved.</li>
        </ul>
      </section>

      <section class="wide">
        <h2>Copyable Commands</h2>
        <pre>node tools/preflight.js
node tools/open_manual_qa_profile.js --self-test
node tools/open_manual_qa_profile.js --keep-fixture-server
node tools/real_profile_qa_redaction_check.js ${escapeHtml(shellQuote(relativeDraft))}</pre>
      </section>

      <section>
        <h2>Do Not Paste</h2>
        <ul>
          <li>API keys, bearer tokens, cookies, private emails, or credentials.</li>
          <li>Full URLs, token-like query strings, real tab titles, or page text.</li>
          <li>Private screenshots, private rule patterns, customer/company confidential names.</li>
        </ul>
      </section>

      <section>
        <h2>Allowed Evidence</h2>
        <ul>
          <li>Counts, pass/fail labels, approximate tab/window counts.</li>
          <li>Generic categories: docs, code review, communication, tasks, research.</li>
          <li>Anonymized issue descriptions and manually blurred screenshots only.</li>
        </ul>
      </section>

      <section class="wide">
        <h2>Required Real-Profile Checks</h2>
        <div class="checks">
          <label><input type="checkbox"> <span>Preflight and disposable QA passed before touching a real profile.</span></label>
          <label><input type="checkbox"> <span>Toolbar flow opened Sidebar and created real Chrome native tab groups.</span></label>
          <label><input type="checkbox"> <span>Active, pinned, audible, protected, internal, and incognito tabs were not closed.</span></label>
          <label><input type="checkbox"> <span>Safe exact/tracking duplicate handling worked and Restore Closed was available when needed.</span></label>
          <label><input type="checkbox"> <span>Hash/query/semantic duplicates stayed in review instead of being auto-closed.</span></label>
          <label><input type="checkbox"> <span>Undo restored grouping state as expected.</span></label>
          <label><input type="checkbox"> <span>Sidebar stayed chat-first and simple.</span></label>
          <label><input type="checkbox"> <span>DeepSeek Agent open answer and move draft worked when AI was enabled; browser changes required Apply.</span></label>
          <label><input type="checkbox"> <span>Current-page chat required a user-triggered page read and sensitive pages asked for extra confirmation.</span></label>
          <label><input type="checkbox"> <span>Selected-tabs/group questions required a user question first and handled Chrome site-access denial clearly.</span></label>
          <label><input type="checkbox"> <span>Dashboard opened to Smart Groups, tab focus worked, and same-window move/apply updated native groups.</span></label>
          <label><input type="checkbox"> <span>Diagnostics and feedback output were manually checked for sensitive data.</span></label>
          <label><input type="checkbox"> <span>Classification quality meets the 70/20/10/0 target with zero dangerous auto-close mistakes.</span></label>
        </div>
      </section>

      <section class="wide">
        <h2>Launch Boundary</h2>
        <p><span class="danger">Passing real-profile QA alone is not public launch approval.</span> Chrome Web Store / public marketing still need final brand/domain, support email, privacy URL, store disclosure, screenshot/demo approval, beta ramp, and launch timing confirmation.</p>
      </section>
    </div>
  </main>
</body>
</html>`;
}

function renderCommands({ draftPath }) {
  const relativeDraft = path.relative(ROOT_DIR, draftPath);

  return [
    "Run from the repository root:",
    "",
    "node tools/preflight.js",
    "node tools/open_manual_qa_profile.js --self-test",
    "node tools/open_manual_qa_profile.js --keep-fixture-server",
    `node tools/real_profile_qa_redaction_check.js ${shellQuote(relativeDraft)}`,
    "",
    "Before sharing or committing any completed real-profile QA result:",
    "- remove full URLs, API keys, bearer tokens, private emails, real tab titles, page text, private screenshots, and customer/company names;",
    "- rerun the redaction check;",
    "- manually review warnings;",
    "- keep READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no until all public launch gates are confirmed."
  ].join("\n");
}

function assertPacket(packet) {
  for (const file of [packet.draftPath, packet.checklistPath, packet.readmePath, packet.commandsPath]) {
    if (!fs.existsSync(file)) {
      throw new Error(`Expected packet file missing: ${file}`);
    }
  }

  const draft = fs.readFileSync(packet.draftPath, "utf8");
  const checklist = fs.readFileSync(packet.checklistPath, "utf8");
  const readme = fs.readFileSync(packet.readmePath, "utf8");
  const commands = fs.readFileSync(packet.commandsPath, "utf8");

  assertIncludes(draft, "Status: BLANK TEMPLATE - NOT A COMPLETED QA RESULT", "draft keeps blank-template status");
  assertIncludes(checklist, "Real Chrome profile QA checklist", "HTML checklist title");
  assertIncludes(checklist, "does not open Chrome, inspect tabs, read browser history", "HTML checklist safety boundary");
  assertIncludes(checklist, "D-L11 local QA aid", "HTML checklist D-L11 boundary");
  assertIncludes(checklist, "Passing real-profile QA alone is not public launch approval.", "HTML checklist launch boundary");
  assertIncludes(readme, "Does not open Chrome.", "readme safety boundary");
  assertIncludes(readme, "real-profile-qa-checklist.html", "readme checklist path");
  assertIncludes(readme, "artifacts/real-profile-qa/", "readme ignored output boundary");
  assertIncludes(commands, "tools/real_profile_qa_redaction_check.js", "commands include redaction check");
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
      draftPath: packet.draftPath,
      checklistPath: packet.checklistPath,
      readmePath: packet.readmePath,
      commandsPath: packet.commandsPath
    }, null, 2));
    return;
  }

  console.log("PASS real-profile QA packet prepared");
  console.log(`packetDir=${packet.packetDir}`);
  console.log(`draft=${packet.draftPath}`);
  console.log(`checklist=${packet.checklistPath}`);
  console.log(`readme=${packet.readmePath}`);
  console.log(`commands=${packet.commandsPath}`);
  console.log("");
  console.log("Next:");
  console.log("1. Run disposable QA first.");
  console.log("2. Fill the draft only after testing a non-critical real Chrome profile/window.");
  console.log("3. Run the redaction command before sharing any completed result.");
  console.log("4. Keep completed real-profile QA notes local/private unless redacted and approved.");
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
