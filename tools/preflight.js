const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_ZIP = path.join(ROOT_DIR, "dist", "tabmosaic-ai-extension-v0.1.0.zip");
const SHOULD_RUN_DEEPSEEK = process.argv.includes("--deepseek");
const SHOULD_RUN_DEEPSEEK_FIXTURE = process.argv.includes("--deepseek-fixture");
const SHOULD_RUN_RUNTIME = process.argv.includes("--runtime");

const syntaxTargets = [
  "extension/background.js",
  "extension/i18n.js",
  "extension/diagnostics.js",
  "extension/sidepanel.js",
  "extension/dashboard.js",
  "tools/extension_smoke_test.js",
  "tools/package_extension.js",
  "tools/chrome_runtime_smoke_test.js",
  "tools/qa_seed_tabs.js",
  "tools/generate_extension_assets.js",
  "tools/deepseek_smoke_test.js",
  "tools/secret_scan.js",
  "tools/preflight.js"
];

main();

function main() {
  runStep("Secret scan", process.execPath, ["tools/secret_scan.js"]);

  for (const target of syntaxTargets) {
    runStep(`Syntax ${target}`, process.execPath, ["--check", target]);
  }

  runStep("Extension smoke", process.execPath, ["tools/extension_smoke_test.js"]);

  if (SHOULD_RUN_DEEPSEEK || SHOULD_RUN_DEEPSEEK_FIXTURE) {
    const args = ["tools/deepseek_smoke_test.js"];
    if (SHOULD_RUN_DEEPSEEK_FIXTURE) args.push("--classify-fixture");
    runStep("DeepSeek/OpenAI-compatible provider smoke", process.execPath, args);
  } else {
    console.log("SKIP DeepSeek provider smoke; pass --deepseek or --deepseek-fixture to run it.");
  }

  if (SHOULD_RUN_RUNTIME) {
    runStep("Chrome runtime smoke", process.execPath, ["tools/chrome_runtime_smoke_test.js"]);
  } else {
    console.log("SKIP Chrome runtime smoke; pass --runtime to run it.");
  }

  runStep("Package extension", process.execPath, ["tools/package_extension.js"]);
  verifyPackageExcludesEnv();

  console.log("PASS preflight completed");
}

function runStep(label, command, args) {
  console.log(`\n==> ${label}`);
  const result = childProcess.spawnSync(command, args, {
    cwd: ROOT_DIR,
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function verifyPackageExcludesEnv() {
  console.log("\n==> Verify package excludes env files");

  if (!fs.existsSync(DIST_ZIP)) {
    throw new Error(`Missing package: ${path.relative(ROOT_DIR, DIST_ZIP)}`);
  }

  const result = childProcess.spawnSync("unzip", ["-l", DIST_ZIP], {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || "unzip failed");
  }

  if (/\.env($|\.)/.test(result.stdout)) {
    throw new Error("Package unexpectedly contains env files");
  }

  console.log("PASS package excludes env files");
}
