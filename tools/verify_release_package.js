const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const MANIFEST_PATH = path.join(EXTENSION_DIR, "manifest.json");
const PACKAGE_PREFIX = "tabmosaic-ai-extension";
const REQUIRED_ZIP_ENTRIES = [
  "manifest.json",
  "background.js",
  "provider_registry.js",
  "popup.html",
  "popup.js",
  "i18n.js",
  "diagnostics.js",
  "page_quick_rail.js",
  "sidepanel.html",
  "sidepanel.js",
  "dashboard.html",
  "dashboard.js",
  "styles.css",
  "icons/icon16.png",
  "icons/icon32.png",
  "icons/icon48.png",
  "icons/icon128.png",
  "_locales/en/messages.json",
  "_locales/zh_CN/messages.json"
];
const FORBIDDEN_ZIP_ENTRY_PATTERNS = [
  { name: "env file", pattern: /(^|\/)\.env($|\.)/ },
  { name: "node_modules", pattern: /(^|\/)node_modules($|\/)/ },
  { name: "source map", pattern: /\.map$/ },
  { name: "private beta AI config", pattern: /(^|\/)private-beta-ai-settings\.json$/ },
  { name: "macOS metadata", pattern: /(^|\/)(\.DS_Store|__MACOSX)($|\/)/ },
  { name: "git metadata", pattern: /(^|\/)\.git($|\/)/ }
];

main();

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const version = validateVersion(manifest.version);
  const expected = expectedPackagePaths(version);

  assertFile(expected.zipPath, "release zip");
  assertFile(expected.checksumPath, "checksum file");
  assertFile(expected.packageManifestPath, "package manifest");

  const zipEntries = listZipEntries(expected.zipPath);
  assertNoForbiddenEntries(zipEntries);
  assertRequiredEntries(zipEntries);
  assertChecksum(expected);
  assertPackageManifest(expected, version);

  console.log(`PASS release package verified for v${version}`);
}

function validateVersion(version) {
  const normalized = String(version || "").trim();

  if (!/^\d+\.\d+\.\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`Invalid Chrome extension version: ${version}`);
  }

  return normalized;
}

function expectedPackagePaths(version) {
  const baseName = `${PACKAGE_PREFIX}-v${version}`;
  return {
    zipName: `${baseName}.zip`,
    checksumName: `${baseName}.sha256`,
    packageManifestName: `${baseName}.package.json`,
    zipPath: path.join(DIST_DIR, `${baseName}.zip`),
    checksumPath: path.join(DIST_DIR, `${baseName}.sha256`),
    packageManifestPath: path.join(DIST_DIR, `${baseName}.package.json`)
  };
}

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${path.relative(ROOT_DIR, filePath)}`);
  }
}

function listZipEntries(zipPath) {
  const result = childProcess.spawnSync("unzip", ["-l", zipPath], {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || "unzip failed");
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*\d+\s+\S+\s+\S+\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

function assertNoForbiddenEntries(zipEntries) {
  for (const entry of zipEntries) {
    for (const forbidden of FORBIDDEN_ZIP_ENTRY_PATTERNS) {
      if (forbidden.pattern.test(entry)) {
        throw new Error(`Package unexpectedly contains ${forbidden.name}: ${entry}`);
      }
    }
  }
}

function assertRequiredEntries(zipEntries) {
  const entrySet = new Set(zipEntries);

  for (const entry of REQUIRED_ZIP_ENTRIES) {
    if (!entrySet.has(entry)) {
      throw new Error(`Package missing required entry: ${entry}`);
    }
  }
}

function assertChecksum(expected) {
  const checksumText = fs.readFileSync(expected.checksumPath, "utf8").trim();
  const parts = checksumText.split(/\s+/);

  if (parts.length < 2) {
    throw new Error("Checksum file must include sha256 and package name");
  }

  const [checksum, packageName] = parts;

  if (!/^[a-f0-9]{64}$/.test(checksum)) {
    throw new Error("Checksum file must start with a 64-character sha256 hash");
  }

  if (packageName !== expected.zipName) {
    throw new Error(`Checksum file package mismatch: expected ${expected.zipName}, got ${packageName}`);
  }
}

function assertPackageManifest(expected, version) {
  const packageManifest = JSON.parse(fs.readFileSync(expected.packageManifestPath, "utf8"));
  const checksumText = fs.readFileSync(expected.checksumPath, "utf8");

  assertEqual(packageManifest.product, "TabMosaic AI", "package manifest product");
  assertEqual(packageManifest.version, version, "package manifest version");
  assertEqual(packageManifest.packageName, expected.zipName, "package manifest packageName");
  assertEqual(packageManifest.checksumName, expected.checksumName, "package manifest checksumName");

  if (!packageManifest.sha256 || !checksumText.includes(packageManifest.sha256)) {
    throw new Error("Package checksum metadata mismatch");
  }

  if (packageManifest.safety?.includesEnvFiles !== false) {
    throw new Error("Package manifest must state that env files are excluded");
  }

  if (packageManifest.safety?.includesSourceMaps !== false) {
    throw new Error("Package manifest must state that source maps are excluded");
  }

  if (packageManifest.safety?.includesNodeModules !== false) {
    throw new Error("Package manifest must state that node_modules are excluded");
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
