const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const MAX_TEXT_FILE_BYTES = 1024 * 1024;
const ALLOWED_ENV_FILES = new Set([".env.example"]);
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

main();

function main() {
  const trackedFiles = listTrackedFiles();
  const findings = [];

  for (const relativePath of trackedFiles) {
    if (isUnexpectedTrackedEnvFile(relativePath)) {
      findings.push({
        file: relativePath,
        line: 1,
        type: "Tracked env file",
        sample: "[env file]"
      });
      continue;
    }

    const absolutePath = path.join(ROOT_DIR, relativePath);
    if (!isScannableTextFile(absolutePath)) continue;

    const content = fs.readFileSync(absolutePath, "utf8");
    const lines = content.split(/\r?\n/);

    for (const { name, pattern } of SECRET_PATTERNS) {
      pattern.lastIndex = 0;

      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (isAllowedSecretMatch(relativePath, match[0])) continue;

        findings.push({
          file: relativePath,
          line: lineNumberForIndex(lines, match.index),
          type: name,
          sample: redactSecret(match[0])
        });
      }
    }
  }

  if (findings.length) {
    console.error("Potential secrets found in tracked files:");
    for (const finding of findings) {
      console.error(`${finding.file}:${finding.line} ${finding.type} ${finding.sample}`);
    }
    process.exit(1);
  }

  console.log(`PASS secret scan checked ${trackedFiles.length} tracked files`);
}

function listTrackedFiles() {
  const result = childProcess.spawnSync("git", ["ls-files"], {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || "git ls-files failed");
  }

  return result.stdout
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
}

function isUnexpectedTrackedEnvFile(relativePath) {
  const name = path.basename(relativePath);
  return name.startsWith(".env") && !ALLOWED_ENV_FILES.has(relativePath);
}

function isScannableTextFile(absolutePath) {
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
