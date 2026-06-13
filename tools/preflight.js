const childProcess = require("child_process");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SHOULD_RUN_DEEPSEEK = process.argv.includes("--deepseek");
const SHOULD_RUN_DEEPSEEK_FIXTURE = process.argv.includes("--deepseek-fixture");
const SHOULD_RUN_RUNTIME = process.argv.includes("--runtime");
const SHOULD_RUN_AGENT_FLOW = process.argv.includes("--agent-flow");
const SHOULD_RUN_LARGE_RUNTIME = process.argv.includes("--large-runtime");
const SHOULD_RUN_SCREENSHOTS = process.argv.includes("--screenshots");

const syntaxTargets = [
  "extension/background.js",
  "extension/provider_registry.js",
  "extension/popup.js",
  "extension/i18n.js",
  "extension/diagnostics.js",
  "extension/sidepanel.js",
  "extension/dashboard.js",
  "tools/extension_smoke_test.js",
  "tools/package_extension.js",
  "tools/chrome_runtime_smoke_test.js",
  "tools/open_manual_qa_profile.js",
  "tools/qa_seed_tabs.js",
  "tools/generate_extension_assets.js",
  "tools/capture_ui_screenshots.js",
  "tools/capture_real_ai_sidepanel_result.js",
  "tools/capture_real_page_chat_screenshot.js",
  "tools/build_store_screenshots.js",
  "tools/deepseek_real_tabs_classification.js",
  "tools/deepseek_smoke_test.js",
  "tools/write_private_beta_ai_config.js",
  "tools/secret_scan.js",
  "tools/public_repo_audit.js",
  "tools/provider_registry_check.js",
  "tools/issue_form_smoke_test.js",
  "tools/verify_release_package.js",
  "tools/beta_readiness_check.js",
  "tools/preflight.js"
];

main();

function main() {
  runStep("Secret scan", process.execPath, ["tools/secret_scan.js"]);

  for (const target of syntaxTargets) {
    runStep(`Syntax ${target}`, process.execPath, ["--check", target]);
  }

  runStep("Extension smoke", process.execPath, ["tools/extension_smoke_test.js"]);
  runStep("Provider registry check", process.execPath, ["tools/provider_registry_check.js"]);
  runStep("Issue form smoke", process.execPath, ["tools/issue_form_smoke_test.js"]);
  runStep("Public repo audit", process.execPath, ["tools/public_repo_audit.js"]);

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

  if (SHOULD_RUN_AGENT_FLOW) {
    runStep("Chrome DeepSeek Agent flow", process.execPath, ["tools/chrome_runtime_smoke_test.js", "--agent-flow"]);
  } else {
    console.log("SKIP Chrome DeepSeek Agent flow; pass --agent-flow to run it.");
  }

  if (SHOULD_RUN_LARGE_RUNTIME) {
    runStep("Chrome large-tab runtime probe", process.execPath, ["tools/chrome_runtime_smoke_test.js", "--large-tabs"]);
  } else {
    console.log("SKIP Chrome large-tab runtime probe; pass --large-runtime to run it.");
  }

  if (SHOULD_RUN_SCREENSHOTS) {
    runStep("UI screenshot capture", process.execPath, ["tools/capture_ui_screenshots.js"]);
    runStep("Store screenshot draft capture", process.execPath, ["tools/build_store_screenshots.js"]);
  } else {
    console.log("SKIP UI screenshot capture; pass --screenshots to run it.");
  }

  runStep("Package extension", process.execPath, ["tools/package_extension.js"]);
  runStep("Verify release package", process.execPath, ["tools/verify_release_package.js"]);
  runStep("Beta readiness check", process.execPath, ["tools/beta_readiness_check.js"]);

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
