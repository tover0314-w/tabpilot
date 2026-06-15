const childProcess = require("child_process");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SHOULD_JSON = process.argv.includes("--json");
const SHOULD_SELF_TEST = process.argv.includes("--self-test");
const SHOULD_INCLUDE_REMOTE_CI = process.argv.includes("--include-remote-ci");
const SHOULD_ALLOW_BLOCKED = process.argv.includes("--allow-blocked");

main();

function main() {
  if (SHOULD_SELF_TEST) {
    runSelfTest();
    return;
  }

  const launchReadiness = runJsonTool("tools/launch_readiness_report.js", ["--json"]);
  const releasePackage = runStatusTool("tools/verify_release_package.js", []);
  const remoteCi = SHOULD_INCLUDE_REMOTE_CI
    ? runJsonTool("tools/check_remote_ci_status.js", ["--json", "--allow-failure"], { allowError: true })
    : {
        status: "skipped",
        reason: "REMOTE_CI_NOT_REQUESTED",
        message: "Pass --include-remote-ci to inspect the latest GitHub Actions run."
      };
  const report = buildFinalGateReport({ launchReadiness, releasePackage, remoteCi });

  if (SHOULD_JSON) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
  }

  if (!SHOULD_ALLOW_BLOCKED && report.finalLaunchReady !== "yes") {
    process.exit(1);
  }
}

function buildFinalGateReport({ launchReadiness, releasePackage, remoteCi }) {
  const launchReadinessOk = Boolean(launchReadiness?.readiness);
  const releasePackageReady = releasePackage.ok ? "yes" : "no";
  const remoteCiReady = remoteCi.status === "success" ? "yes" : remoteCi.status === "skipped" ? "skipped" : "no";
  const readiness = launchReadiness.readiness || {};
  const blockers = [];

  if (!launchReadinessOk) {
    blockers.push({
      id: "LOCAL_LAUNCH_READINESS",
      owner: "BUILD",
      message: "Launch readiness report could not be generated."
    });
  }

  if (releasePackageReady !== "yes") {
    blockers.push({
      id: "LOCAL_RELEASE_PACKAGE",
      owner: "BUILD",
      message: releasePackage.message || "Release package verification failed."
    });
  }

  if (remoteCi.status !== "skipped" && remoteCiReady !== "yes") {
    blockers.push({
      id: "REMOTE_CI",
      owner: remoteCi.reason === "GITHUB_ACTIONS_BILLING_LOCK" ? "ACCOUNT OWNER" : "BUILD",
      message: remoteCi.message || "Remote GitHub Actions CI is not green.",
      nextAction: remoteCi.nextAction || "Inspect the latest GitHub Actions run."
    });
  }

  for (const gate of launchReadiness.gates || []) {
    if (normalizeStatus(gate.status) === "ready") continue;
    blockers.push({
      id: gate.id,
      owner: gate.owner,
      message: gate.next,
      evidence: gate.evidence
    });
  }

  const publicSourceReleaseReady =
    readiness.publicSourceRelease === "yes" &&
    readiness.publicRepoPush === "yes" &&
    releasePackageReady === "yes" &&
    (remoteCi.status === "skipped" || remoteCiReady === "yes")
      ? "yes"
      : "no";
  const publicMarketingLaunchReady =
    publicSourceReleaseReady === "yes" && readiness.publicMarketingLaunch === "yes" ? "yes" : "no";
  const publicChromeWebStoreLaunchReady =
    publicSourceReleaseReady === "yes" && readiness.publicChromeWebStoreLaunch === "yes" ? "yes" : "no";
  const finalLaunchReady =
    publicMarketingLaunchReady === "yes" && publicChromeWebStoreLaunchReady === "yes" && blockers.length === 0
      ? "yes"
      : "no";

  return {
    generatedAt: new Date().toISOString(),
    finalLaunchReady,
    readiness: {
      localReleasePackage: releasePackageReady,
      remoteCi: remoteCiReady,
      publicSourceRelease: publicSourceReleaseReady,
      publicMarketingLaunch: publicMarketingLaunchReady,
      publicChromeWebStoreLaunch: publicChromeWebStoreLaunchReady
    },
    remoteCi,
    counts: {
      blockers: blockers.length,
      userInputBlockers: blockers.filter((blocker) => String(blocker.owner || "").includes("USER INPUT")).length,
      qaBlockers: blockers.filter((blocker) => String(blocker.owner || "").includes("QA")).length,
      accountOwnerBlockers: blockers.filter((blocker) => blocker.owner === "ACCOUNT OWNER").length,
      buildBlockers: blockers.filter((blocker) => blocker.owner === "BUILD").length
    },
    blockers,
    sources: [
      "tools/launch_readiness_report.js",
      "tools/verify_release_package.js",
      "tools/check_remote_ci_status.js"
    ]
  };
}

function printHuman(report) {
  console.log("Final launch gate check");
  console.log("=======================");
  console.log(`FINAL_LAUNCH_READY=${report.finalLaunchReady}`);
  console.log(`READY_LOCAL_RELEASE_PACKAGE=${report.readiness.localReleasePackage}`);
  console.log(`READY_REMOTE_CI=${report.readiness.remoteCi}`);
  console.log(`READY_PUBLIC_SOURCE_RELEASE=${report.readiness.publicSourceRelease}`);
  console.log(`READY_PUBLIC_MARKETING_LAUNCH=${report.readiness.publicMarketingLaunch}`);
  console.log(`READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=${report.readiness.publicChromeWebStoreLaunch}`);
  console.log("");
  console.log(`Blockers: ${report.counts.blockers}`);
  console.log(`Needs user input: ${report.counts.userInputBlockers}`);
  console.log(`Needs QA: ${report.counts.qaBlockers}`);
  console.log(`Needs account owner action: ${report.counts.accountOwnerBlockers}`);
  console.log(`Needs build action: ${report.counts.buildBlockers}`);

  if (report.remoteCi.status === "skipped") {
    console.log("");
    console.log("Remote CI was not checked. Run with --include-remote-ci --allow-blocked to inspect GitHub Actions.");
  }

  if (report.blockers.length) {
    console.log("");
    console.log("Blocking items");
    for (const blocker of report.blockers) {
      console.log(`- ${blocker.id} [${blocker.owner}] ${blocker.message}`);
      if (blocker.nextAction) console.log(`  Next: ${blocker.nextAction}`);
      if (blocker.evidence) console.log(`  Evidence: ${blocker.evidence}`);
    }
  }
}

function runJsonTool(script, args, options = {}) {
  const result = spawnNode(script, args);

  if (result.status !== 0 && !options.allowError) {
    throw new Error((result.stderr || result.stdout || `${script} failed`).trim());
  }

  const text = result.stdout.trim();
  if (!text) {
    return {
      status: "unknown",
      reason: "NO_OUTPUT",
      message: `${script} produced no JSON output.`
    };
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    if (!options.allowError) throw error;
    return {
      status: "unknown",
      reason: "INVALID_JSON_OUTPUT",
      message: `${script} did not produce valid JSON output.`,
      stderr: result.stderr.trim()
    };
  }
}

function runStatusTool(script, args) {
  const result = spawnNode(script, args);

  return {
    ok: result.status === 0,
    status: result.status,
    message: (result.stdout || result.stderr || "").trim()
  };
}

function spawnNode(script, args) {
  const result = childProcess.spawnSync(process.execPath, [script, ...args], {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.error) throw result.error;
  return result;
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function runSelfTest() {
  const readyReport = buildFinalGateReport({
    launchReadiness: {
      readiness: {
        publicSourceRelease: "yes",
        publicRepoPush: "yes",
        publicMarketingLaunch: "yes",
        publicChromeWebStoreLaunch: "yes"
      },
      gates: []
    },
    releasePackage: { ok: true },
    remoteCi: { status: "success", reason: "REMOTE_CI_GREEN" }
  });
  const blockedReport = buildFinalGateReport({
    launchReadiness: {
      readiness: {
        publicSourceRelease: "yes",
        publicRepoPush: "yes",
        publicMarketingLaunch: "no",
        publicChromeWebStoreLaunch: "no"
      },
      gates: [
        {
          id: "D-L03",
          status: "BLOCKING",
          owner: "USER INPUT",
          next: "Choose final public name.",
          evidence: "brand notes"
        }
      ]
    },
    releasePackage: { ok: true },
    remoteCi: {
      status: "blocked",
      reason: "GITHUB_ACTIONS_BILLING_LOCK",
      message: "The job was not started because your account is locked due to a billing issue.",
      nextAction: "Resolve GitHub billing."
    }
  });

  assert(readyReport.finalLaunchReady === "yes", "ready fixture should pass final launch");
  assert(readyReport.readiness.remoteCi === "yes", "ready fixture should mark remote CI ready");
  assert(blockedReport.finalLaunchReady === "no", "blocked fixture should not pass final launch");
  assert(blockedReport.counts.accountOwnerBlockers === 1, "blocked fixture should count account owner blocker");
  assert(blockedReport.counts.userInputBlockers === 1, "blocked fixture should count user input blocker");
  assert(blockedReport.blockers.some((blocker) => blocker.id === "REMOTE_CI"), "blocked fixture should include remote CI blocker");

  console.log("PASS final launch gate check self-test");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
