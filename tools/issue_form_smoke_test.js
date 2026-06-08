const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const ISSUE_TEMPLATE_DIR = path.join(ROOT_DIR, ".github", "ISSUE_TEMPLATE");
const CONFIG_PATH = path.join(ISSUE_TEMPLATE_DIR, "config.yml");
const REQUIRED_PRIVACY_PHRASES = [
  "api keys",
  "bearer tokens",
  "cookies",
  "full urls",
  "tab titles",
  "page text",
  "emails",
  "screenshots with private content",
  "private rule patterns"
];

const FORMS = [
  {
    relativePath: ".github/ISSUE_TEMPLATE/beta_bug_report.yml",
    titlePrefix: "[Beta Bug]:",
    requiredText: [
      "Beta bug report",
      "Expected behavior",
      "Actual behavior",
      "Steps to reproduce",
      "Safety impact",
      "Redacted diagnostics",
      "GitHub submission is always manual"
    ]
  },
  {
    relativePath: ".github/ISSUE_TEMPLATE/beta_feedback.yml",
    titlePrefix: "[Beta Feedback]:",
    requiredText: [
      "Beta product feedback",
      "Classification quality",
      "70% clearly right",
      "Dangerous close mistakes",
      "Sidebar feedback",
      "Dashboard feedback",
      "Biggest MVP gap",
      "Reviewed feedback template output"
    ]
  }
];

main();

function main() {
  const failures = [];

  validateConfig(failures);

  for (const form of FORMS) {
    validateForm(form, failures);
  }

  if (failures.length) {
    console.error("Issue form smoke test failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`PASS issue form smoke checked ${FORMS.length} forms`);
}

function validateConfig(failures) {
  const content = readFile(CONFIG_PATH, failures);
  if (!content) return;

  expectIncludes(content, "blank_issues_enabled: false", ".github/ISSUE_TEMPLATE/config.yml", failures);
  expectIncludes(content, "05_PROJECT/09_BETA_RELEASE_NOTES.md", ".github/ISSUE_TEMPLATE/config.yml", failures);
}

function validateForm(form, failures) {
  const absolutePath = path.join(ROOT_DIR, form.relativePath);
  const content = readFile(absolutePath, failures);
  if (!content) return;

  assertBasicYamlHygiene(content, form.relativePath, failures);
  expectTopLevelKey(content, "name", form.relativePath, failures);
  expectTopLevelKey(content, "description", form.relativePath, failures);
  expectTopLevelKey(content, "title", form.relativePath, failures);
  expectTopLevelKey(content, "body", form.relativePath, failures);
  expectIncludes(content, form.titlePrefix, form.relativePath, failures);
  expectIncludes(content, "id: privacy_check", form.relativePath, failures);
  expectIncludes(content, "required: true", form.relativePath, failures);
  expectIncludes(content, "review", form.relativePath, failures);
  expectIncludes(content, "before submitting", form.relativePath, failures);

  for (const phrase of REQUIRED_PRIVACY_PHRASES) {
    expectIncludes(content.toLowerCase(), phrase, form.relativePath, failures);
  }

  for (const text of form.requiredText) {
    expectIncludes(content, text, form.relativePath, failures);
  }

  const privacySection = sectionAfter(content, "id: privacy_check");
  if (countMatches(privacySection, /required:\s+true/g) < 2) {
    failures.push(`${form.relativePath} privacy_check must require both safety acknowledgements`);
  }

  if (!/render:\s+text/.test(content)) {
    failures.push(`${form.relativePath} should render pasted diagnostics or feedback as text`);
  }
}

function assertBasicYamlHygiene(content, relativePath, failures) {
  if (content.includes("\t")) {
    failures.push(`${relativePath} must not contain tab indentation`);
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("- ")) return;

    const unquotedScalarWithColon = /^\s+[A-Za-z_][A-Za-z0-9_-]*:\s+[^"'|>[{].*:\s+\S/.test(line);
    if (unquotedScalarWithColon) {
      failures.push(`${relativePath}:${lineNumber} has an unquoted scalar containing a colon`);
    }

    const oddDoubleQuotes = (line.match(/"/g) || []).length % 2 !== 0;
    if (oddDoubleQuotes) {
      failures.push(`${relativePath}:${lineNumber} has unbalanced double quotes`);
    }
  });
}

function readFile(filePath, failures) {
  if (!fs.existsSync(filePath)) {
    failures.push(`Missing file: ${path.relative(ROOT_DIR, filePath)}`);
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
}

function expectTopLevelKey(content, key, relativePath, failures) {
  const pattern = new RegExp(`^${escapeRegExp(key)}:`, "m");
  if (!pattern.test(content)) {
    failures.push(`${relativePath} missing top-level key: ${key}`);
  }
}

function expectIncludes(content, expected, relativePath, failures) {
  if (!content.includes(expected)) {
    failures.push(`${relativePath} missing required text: ${expected}`);
  }
}

function sectionAfter(content, marker) {
  const index = content.indexOf(marker);
  return index === -1 ? "" : content.slice(index);
}

function countMatches(content, pattern) {
  return (content.match(pattern) || []).length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
