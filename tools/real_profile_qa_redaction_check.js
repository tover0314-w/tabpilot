const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SHOULD_SELF_TEST = process.argv.includes("--self-test");
const TARGET_PATH = process.argv.find((arg) => !arg.startsWith("--") && arg !== process.argv[0] && arg !== process.argv[1]);
const MAX_FILE_BYTES = 512 * 1024;

const FAIL_PATTERNS = [
  {
    type: "Full URL",
    pattern: /\bhttps?:\/\/[^\s<>)\]]+/gi,
    redact: (value) => redactUrl(value)
  },
  {
    type: "Chrome URL",
    pattern: /\b(?:chrome|chrome-extension|file):\/\/[^\s<>)\]]+/gi,
    redact: (value) => `${value.split(":")[0]}://[redacted]`
  },
  {
    type: "OpenAI-compatible API key",
    pattern: /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{12,}/g,
    redact: redactSecret
  },
  {
    type: "Bearer token",
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/gi,
    redact: () => "Bearer [redacted-token]"
  },
  {
    type: "Private email",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    redact: (value) => redactEmail(value)
  },
  {
    type: "Token-like query value",
    pattern: /(?:token|api[_-]?key|apikey|access[_-]?token|auth|session|secret|password)=([A-Za-z0-9._~%+/=-]{6,})/gi,
    redact: (value) => value.replace(/=.*/, "=[redacted]")
  }
];

const WARN_PATTERNS = [
  {
    type: "Markdown image or screenshot reference",
    pattern: /!\[[^\]]*\]\([^)]+\)|\b(?:screenshot|recording|screen capture)\b/gi
  },
  {
    type: "Private-data wording",
    pattern: /\b(?:customer|client|company confidential|real tab title|page text|cookie|private screenshot|private rule pattern)\b/gi
  }
];

main();

function main() {
  if (SHOULD_SELF_TEST) {
    runSelfTest();
    return;
  }

  if (!TARGET_PATH) {
    printUsage();
    process.exit(1);
  }

  const absolutePath = path.resolve(ROOT_DIR, TARGET_PATH);
  const result = checkReportFile(absolutePath);

  printResult(result);

  if (result.failures.length) {
    process.exit(1);
  }
}

function printUsage() {
  console.error("Usage:");
  console.error("  node tools/real_profile_qa_redaction_check.js --self-test");
  console.error("  node tools/real_profile_qa_redaction_check.js path/to/redacted-real-profile-qa.md");
}

function checkReportFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Report file not found: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    throw new Error(`Report path is not a file: ${filePath}`);
  }

  if (stats.size > MAX_FILE_BYTES) {
    throw new Error(`Report file is too large for a redacted Markdown QA note: ${stats.size} bytes`);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(ROOT_DIR, filePath);

  if (content.includes("\uFFFD")) {
    throw new Error("Report file is not valid UTF-8 text.");
  }

  if (/Status:\s*BLANK TEMPLATE - NOT A COMPLETED QA RESULT/i.test(content)) {
    return {
      file: relativePath,
      skippedTemplate: true,
      failures: [],
      warnings: []
    };
  }

  return checkReportContent(content, relativePath);
}

function checkReportContent(content, file = "[inline]") {
  const failures = [];
  const warnings = [];
  const lines = content.split(/\r?\n/);

  for (const entry of FAIL_PATTERNS) {
    entry.pattern.lastIndex = 0;
    let match;
    while ((match = entry.pattern.exec(content)) !== null) {
      if (isAllowedFailMatch(entry.type, match[0])) continue;
      failures.push({
        file,
        line: lineNumberForIndex(lines, match.index),
        type: entry.type,
        sample: entry.redact(match[0])
      });
    }
  }

  for (const entry of WARN_PATTERNS) {
    entry.pattern.lastIndex = 0;
    let match;
    while ((match = entry.pattern.exec(content)) !== null) {
      warnings.push({
        file,
        line: lineNumberForIndex(lines, match.index),
        type: entry.type,
        sample: sanitizeSample(match[0])
      });
    }
  }

  return { file, skippedTemplate: false, failures, warnings };
}

function isAllowedFailMatch(type, value) {
  if (type === "Private email") {
    return /^(support|privacy|security|hello|contact)@(?:example\.com|your-domain\.com)$/i.test(value);
  }

  return false;
}

function printResult(result) {
  if (result.skippedTemplate) {
    console.log(`PASS ${result.file} is the blank real-profile QA template, not a completed result`);
    return;
  }

  if (result.failures.length) {
    console.error(`FAIL real-profile QA redaction check found ${result.failures.length} high-risk item(s)`);
    for (const finding of result.failures) {
      console.error(`${finding.file}:${finding.line} ${finding.type} ${finding.sample}`);
    }
  } else {
    console.log(`PASS real-profile QA redaction check found no high-risk items in ${result.file}`);
  }

  if (result.warnings.length) {
    console.log(`WARN review ${result.warnings.length} caution item(s) before sharing`);
    for (const finding of result.warnings.slice(0, 20)) {
      console.log(`${finding.file}:${finding.line} ${finding.type} ${finding.sample}`);
    }
  }
}

function runSelfTest() {
  const safe = [
    "# Redacted QA",
    "Profile type: non-critical real profile",
    "Approx tab count: 42",
    "Area: grouping",
    "Steps, redacted: organized a docs/code/tasks work session.",
    "Private data removed: yes",
    "READY_PUBLIC_CHROME_WEB_STORE_LAUNCH=no"
  ].join("\n");
  const unsafe = [
    "# Unsafe QA",
    "Email: owner@example.org",
    "URL: https://private.example.com/path?token=abc123",
    `Key: ${["sk", "realisticSecretKey123456"].join("-")}`,
    `Auth: ${["Bearer", "abcdefghijklmnopqrstuvwxyz"].join(" ")}`,
    "Screenshot: ![private](private.png)"
  ].join("\n");
  const safeResult = checkReportContent(safe, "safe-fixture.md");
  const unsafeResult = checkReportContent(unsafe, "unsafe-fixture.md");

  if (safeResult.failures.length) {
    throw new Error(`Safe fixture unexpectedly failed: ${JSON.stringify(safeResult.failures)}`);
  }

  if (unsafeResult.failures.length < 4) {
    throw new Error(`Unsafe fixture did not catch enough high-risk items: ${JSON.stringify(unsafeResult.failures)}`);
  }

  if (!unsafeResult.warnings.length) {
    throw new Error("Unsafe fixture should produce a screenshot warning.");
  }

  console.log("PASS real-profile QA redaction checker self-test");
}

function lineNumberForIndex(lines, index) {
  let offset = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const nextOffset = offset + lines[lineIndex].length + 1;
    if (index < nextOffset) return lineIndex + 1;
    offset = nextOffset;
  }

  return lines.length;
}

function redactSecret(value) {
  if (value.length <= 10) return "[redacted]";
  return `${value.slice(0, 4)}...[redacted]...${value.slice(-4)}`;
}

function redactEmail(value) {
  const [name, domain] = String(value).split("@");
  return `${name.slice(0, 1)}***@${domain ? "[redacted-domain]" : "[redacted]"}`;
}

function redactUrl(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}/[redacted]`;
  } catch {
    return "[redacted-url]";
  }
}

function sanitizeSample(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}
