const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const MAX_TEXT_FILE_BYTES = 1024 * 1024;
const ALLOWED_ENV_FILES = new Set([".env.example"]);
const REQUIRED_IGNORES = [
  "dist/",
  "artifacts/",
  "output/",
  "extension/private-beta-ai-settings.json"
];
const DANGEROUS_TRACKED_PATTERNS = [
  { name: "generated dist output", pattern: /^dist\// },
  { name: "generated artifacts output", pattern: /^artifacts\// },
  { name: "generated output directory", pattern: /^output\// },
  { name: "private beta AI config", pattern: /^extension\/private-beta-ai-settings\.json$/ },
  { name: "private key material", pattern: /\.(pem|key|p12|pfx)$/i },
  { name: "completed real-profile QA result", pattern: /real[-_ ]?profile.*qa.*result/i, allow: /^05_PROJECT\/12_REAL_PROFILE_QA_RESULT_TEMPLATE\.md$/ }
];
const SECRET_PATTERNS = [
  {
    name: "OpenAI-compatible API key",
    pattern: /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{12,}/g
  },
  {
    name: "Bearer token literal",
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/g
  }
];
const CONFIRMATION_BLOCKERS = [
  {
    id: "D-L01",
    label: "open-source license remains unconfirmed",
    isBlocked: () => !fs.existsSync(path.join(ROOT_DIR, "LICENSE"))
  },
  {
    id: "D-L02",
    label: "public repo boundary remains unconfirmed",
    isBlocked: () => !isPublicRepoBoundaryConfirmed()
  },
  {
    id: "ARCHIVE",
    label: "raw imported archive requires user approval before public repo launch",
    isBlocked: (trackedFiles) => trackedFiles.includes("06_REFERENCES/ARCHIVES/TabPilot-AI-UI.zip")
  },
  {
    id: "REAL_PROFILE_QA",
    label: "completed real-profile QA is not recorded as public-ready evidence",
    isBlocked: () => true
  }
];

main();

function main() {
  const candidateFiles = listRepoCandidateFiles();
  const failures = [];
  const blockers = [];

  assertRequiredIgnores(failures);
  assertNoUnexpectedTrackedFiles(candidateFiles, failures);
  assertNoCandidateSecrets(candidateFiles, failures);
  assertNoLicenseBeforeConfirmation(candidateFiles, failures);
  assertCleanupChecklistPresent(failures);

  for (const blocker of CONFIRMATION_BLOCKERS) {
    if (blocker.isBlocked(candidateFiles)) {
      blockers.push(`${blocker.id}: ${blocker.label}`);
    }
  }

  if (failures.length) {
    console.error("Public repo audit failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`PASS public repo audit checked ${candidateFiles.length} tracked/unignored files`);
  console.log("READY_PUBLIC_REPO_PUSH=no");
  if (blockers.length) {
    console.log(`PUBLIC_REPO_BLOCKERS=${blockers.join("; ")}`);
  }
}

function listRepoCandidateFiles() {
  const result = childProcess.spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || "git ls-files --cached --others --exclude-standard failed");
  }

  return result.stdout
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
}

function assertRequiredIgnores(failures) {
  const gitignorePath = path.join(ROOT_DIR, ".gitignore");
  const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";

  for (const required of REQUIRED_IGNORES) {
    if (!gitignore.split(/\r?\n/).map((line) => line.trim()).includes(required)) {
      failures.push(`.gitignore must include ${required}`);
    }
  }
}

function assertNoUnexpectedTrackedFiles(trackedFiles, failures) {
  for (const relativePath of trackedFiles) {
    if (isUnexpectedTrackedEnvFile(relativePath)) {
      failures.push(`tracked env file is not allowed: ${relativePath}`);
    }

    for (const forbidden of DANGEROUS_TRACKED_PATTERNS) {
      if (forbidden.allow?.test(relativePath)) continue;
      if (forbidden.pattern.test(relativePath)) {
        failures.push(`tracked ${forbidden.name} is not allowed: ${relativePath}`);
      }
    }
  }
}

function assertNoCandidateSecrets(candidateFiles, failures) {
  for (const relativePath of candidateFiles) {
    const absolutePath = path.join(ROOT_DIR, relativePath);
    if (!isScannableTextFile(absolutePath)) continue;

    const content = fs.readFileSync(absolutePath, "utf8");
    const lines = content.split(/\r?\n/);

    for (const { name, pattern } of SECRET_PATTERNS) {
      pattern.lastIndex = 0;

      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (isAllowedSecretMatch(relativePath, match[0])) continue;

        failures.push(
          `candidate secret in ${relativePath}:${lineNumberForIndex(lines, match.index)} ${name} ${redactSecret(match[0])}`
        );
      }
    }
  }
}

function assertNoLicenseBeforeConfirmation(trackedFiles, failures) {
  const hasLicense = trackedFiles.some((file) => /^LICENSE(\.|$)/i.test(file));
  const decisionsPath = path.join(ROOT_DIR, "00_START_HERE", "03_DECISIONS_TO_CONFIRM.md");
  const decisions = fs.existsSync(decisionsPath) ? fs.readFileSync(decisionsPath, "utf8") : "";
  const licenseConfirmed = /D-034-A\s*\|[^\n]*\|\s*CONFIRMED\b/.test(decisions);

  if (hasLicense && !licenseConfirmed) {
    failures.push("LICENSE is tracked but D-034-A remains unconfirmed");
  }
}

function assertCleanupChecklistPresent(failures) {
  const checklistPath = path.join(ROOT_DIR, "05_PROJECT", "17_PUBLIC_REPO_CLEANUP_CHECKLIST.md");
  if (!fs.existsSync(checklistPath)) {
    failures.push("missing 05_PROJECT/17_PUBLIC_REPO_CLEANUP_CHECKLIST.md");
    return;
  }

  const checklist = fs.readFileSync(checklistPath, "utf8");
  for (const required of [
    "Status: DRAFT - DO NOT PUSH PUBLICLY UNTIL D-L01, ARCHIVE, REAL-PROFILE QA, AND PUBLIC-LAUNCH MATERIALS ARE CLEARED",
    "06_REFERENCES/ARCHIVES/TabPilot-AI-UI.zip",
    "Do not delete or untrack the archive automatically without user confirmation",
    "Final public branch contains no ignored generated outputs."
  ]) {
    if (!checklist.includes(required)) {
      failures.push(`cleanup checklist missing required text: ${required}`);
    }
  }
}

function isPublicRepoBoundaryConfirmed() {
  const packetPath = path.join(ROOT_DIR, "05_PROJECT", "16_PUBLIC_LAUNCH_DECISION_PACKET.md");
  const packet = fs.existsSync(packetPath) ? fs.readFileSync(packetPath, "utf8") : "";

  return /D-L02\s*\|[^\n]*\|\s*CONFIRMED\b/.test(packet) ||
    /D-L02\s*\|[^\n]*\|\s*CONFIRMED BY USER\b/.test(packet);
}

function isUnexpectedTrackedEnvFile(relativePath) {
  const name = path.basename(relativePath);
  return name.startsWith(".env") && !ALLOWED_ENV_FILES.has(relativePath);
}

function isScannableTextFile(absolutePath) {
  if (!fs.existsSync(absolutePath)) return false;

  const stats = fs.statSync(absolutePath);
  if (!stats.isFile() || stats.size > MAX_TEXT_FILE_BYTES) return false;

  const buffer = fs.readFileSync(absolutePath);
  if (buffer.includes(0)) return false;

  const textSample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("utf8");
  return !textSample.includes("\uFFFD");
}

function isAllowedSecretMatch(relativePath, value) {
  if (relativePath === "tools/extension_smoke_test.js" && value.startsWith("sk-secret")) {
    return true;
  }

  return false;
}

function lineNumberForIndex(lines, index) {
  let offset = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const nextOffset = offset + lines[i].length + 1;
    if (index < nextOffset) return i + 1;
    offset = nextOffset;
  }

  return lines.length;
}

function redactSecret(value) {
  if (value.length <= 10) return "[redacted]";
  return `${value.slice(0, 4)}...[redacted]...${value.slice(-4)}`;
}
