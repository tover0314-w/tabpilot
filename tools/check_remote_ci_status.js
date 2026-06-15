const childProcess = require("child_process");

const DEFAULT_BRANCH = "main";
const DEFAULT_LIMIT = 1;
const SHOULD_SELF_TEST = process.argv.includes("--self-test");
const SHOULD_JSON = process.argv.includes("--json");
const SHOULD_ALLOW_FAILURE = process.argv.includes("--allow-failure");

main();

function main() {
  if (SHOULD_SELF_TEST) {
    runSelfTest();
    return;
  }

  const repo = valueAfter("--repo") || "";
  const branch = valueAfter("--branch") || DEFAULT_BRANCH;
  const runId = valueAfter("--run-id");
  const result = runId ? inspectRun({ repo, runId }) : inspectLatestRun({ repo, branch });

  if (SHOULD_JSON) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHuman(result);
  }

  if (!SHOULD_ALLOW_FAILURE && result.status !== "success") {
    process.exit(1);
  }
}

function inspectLatestRun({ repo, branch }) {
  const args = ["run", "list", "--branch", branch, "--limit", String(DEFAULT_LIMIT), "--json", "databaseId,headSha,status,conclusion,workflowName,createdAt,updatedAt,url"];
  if (repo) args.push("--repo", repo);
  const runs = JSON.parse(runGh(args));
  const latest = runs[0];

  if (!latest) {
    return {
      status: "missing",
      branch,
      reason: "NO_RUN_FOUND",
      message: `No GitHub Actions run found for branch ${branch}.`
    };
  }

  return inspectRun({ repo, runId: String(latest.databaseId), preloadedRun: latest });
}

function inspectRun({ repo, runId, preloadedRun }) {
  const viewArgs = ["run", "view", runId, "--json", "jobs,conclusion,status,headSha,url,workflowName"];
  if (repo) viewArgs.push("--repo", repo);
  const view = JSON.parse(runGh(viewArgs));
  const run = {
    id: Number(runId),
    headSha: view.headSha || preloadedRun?.headSha || "",
    workflowName: view.workflowName || preloadedRun?.workflowName || "",
    status: view.status || preloadedRun?.status || "",
    conclusion: view.conclusion || preloadedRun?.conclusion || "",
    url: view.url || preloadedRun?.url || ""
  };
  const jobs = view.jobs || [];
  const failedJob = jobs.find((job) => job.conclusion === "failure");
  const annotations = failedJob ? fetchAnnotationsForJob({ repo, headSha: run.headSha, jobId: failedJob.databaseId }) : [];
  const billingAnnotation = annotations.find((annotation) =>
    /account is locked due to a billing issue/i.test(annotation.message || "")
  );

  if (run.status !== "completed") {
    return {
      status: "pending",
      reason: "RUN_NOT_COMPLETED",
      run,
      jobs: summarizeJobs(jobs),
      message: `Remote CI run ${runId} is ${run.status || "not completed yet"}.`
    };
  }

  if (run.conclusion === "success") {
    return {
      status: "success",
      reason: "REMOTE_CI_GREEN",
      run,
      jobs: summarizeJobs(jobs),
      message: `Remote CI run ${runId} passed.`
    };
  }

  if (billingAnnotation) {
    return {
      status: "blocked",
      reason: "GITHUB_ACTIONS_BILLING_LOCK",
      run,
      jobs: summarizeJobs(jobs),
      annotations: [sanitizeAnnotation(billingAnnotation)],
      nextAction: `Resolve GitHub account billing / Actions lock, then run: gh run rerun ${runId}`,
      message: billingAnnotation.message
    };
  }

  return {
    status: "failed",
    reason: "REMOTE_CI_FAILED",
    run,
    jobs: summarizeJobs(jobs),
    annotations: annotations.map(sanitizeAnnotation),
    nextAction: `Open ${run.url || `run ${runId}`} and inspect failed job logs.`,
    message: `Remote CI run ${runId} failed after starting jobs.`
  };
}

function fetchAnnotationsForJob({ repo, headSha, jobId }) {
  if (!headSha || !jobId) return [];
  const args = ["api", `repos/${repoFromRemote(repo)}/commits/${headSha}/check-runs`, "--jq", ".check_runs[] | select(.id == " + Number(jobId) + ") | .output.annotations_url"];
  const annotationsUrl = runGh(args).trim();

  if (!annotationsUrl) return [];

  return JSON.parse(runGh(["api", annotationsUrl]));
}

function summarizeJobs(jobs) {
  return jobs.map((job) => ({
    id: job.databaseId,
    name: job.name,
    status: job.status,
    conclusion: job.conclusion,
    steps: Array.isArray(job.steps) ? job.steps.length : 0,
    url: job.url
  }));
}

function sanitizeAnnotation(annotation) {
  return {
    level: annotation.annotation_level,
    path: annotation.path,
    line: annotation.start_line,
    message: annotation.message
  };
}

function printHuman(result) {
  console.log("Remote CI status");
  console.log("================");
  console.log(`REMOTE_CI_STATUS=${result.status}`);
  console.log(`REMOTE_CI_REASON=${result.reason}`);

  if (result.run) {
    console.log(`REMOTE_CI_RUN_ID=${result.run.id}`);
    console.log(`REMOTE_CI_HEAD_SHA=${result.run.headSha}`);
    console.log(`REMOTE_CI_WORKFLOW=${result.run.workflowName}`);
    console.log(`REMOTE_CI_CONCLUSION=${result.run.conclusion || ""}`);
    console.log(`REMOTE_CI_URL=${result.run.url || ""}`);
  }

  if (result.message) console.log(`REMOTE_CI_MESSAGE=${result.message}`);
  if (result.nextAction) console.log(`REMOTE_CI_NEXT_ACTION=${result.nextAction}`);

  if (result.annotations?.length) {
    console.log("");
    console.log("Annotations");
    for (const annotation of result.annotations) {
      console.log(`- ${annotation.message}`);
    }
  }
}

function runGh(args) {
  const result = childProcess.spawnSync("gh", args, {
    encoding: "utf8"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `gh ${args.join(" ")} failed`).trim());
  }

  return result.stdout;
}

function repoFromRemote(repo) {
  if (repo) return repo;
  const result = childProcess.spawnSync("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || "Cannot infer repo; pass --repo owner/name.");
  }

  return result.stdout.trim();
}

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return "";
  return process.argv[index + 1] || "";
}

function runSelfTest() {
  const billingResult = classifyFixture({
    run: {
      id: 123,
      status: "completed",
      conclusion: "failure"
    },
    jobs: [
      {
        databaseId: 456,
        name: "Extension smoke and package",
        status: "completed",
        conclusion: "failure",
        steps: []
      }
    ],
    annotations: [
      {
        annotation_level: "failure",
        path: ".github",
        start_line: 1,
        message: "The job was not started because your account is locked due to a billing issue."
      }
    ]
  });
  const successResult = classifyFixture({
    run: {
      id: 789,
      status: "completed",
      conclusion: "success"
    },
    jobs: [
      {
        databaseId: 1,
        name: "Extension smoke and package",
        status: "completed",
        conclusion: "success",
        steps: [{ name: "Checkout" }]
      }
    ],
    annotations: []
  });

  assert(billingResult.status === "blocked", "billing fixture should be blocked");
  assert(billingResult.reason === "GITHUB_ACTIONS_BILLING_LOCK", "billing fixture reason mismatch");
  assert(successResult.status === "success", "success fixture should pass");

  console.log("PASS remote CI status checker self-test");
}

function classifyFixture({ run, jobs, annotations }) {
  const billingAnnotation = annotations.find((annotation) =>
    /account is locked due to a billing issue/i.test(annotation.message || "")
  );

  if (run.status !== "completed") return { status: "pending", reason: "RUN_NOT_COMPLETED" };
  if (run.conclusion === "success") return { status: "success", reason: "REMOTE_CI_GREEN" };
  if (billingAnnotation) return { status: "blocked", reason: "GITHUB_ACTIONS_BILLING_LOCK" };
  return { status: "failed", reason: "REMOTE_CI_FAILED", jobs: summarizeJobs(jobs) };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
