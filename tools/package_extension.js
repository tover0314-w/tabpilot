const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const MANIFEST_PATH = path.join(EXTENSION_DIR, "manifest.json");
const ASSET_GENERATOR = path.join(ROOT_DIR, "tools", "generate_extension_assets.js");

run(process.execPath, [ASSET_GENERATOR], ROOT_DIR);

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
validateManifestAssets(manifest);
validateLocales(manifest);

fs.mkdirSync(DIST_DIR, { recursive: true });
const packageName = `tabmosaic-ai-extension-v${manifest.version}.zip`;
const outputPath = path.join(DIST_DIR, packageName);
const checksumName = `tabmosaic-ai-extension-v${manifest.version}.sha256`;
const checksumPath = path.join(DIST_DIR, checksumName);
const packageManifestName = `tabmosaic-ai-extension-v${manifest.version}.package.json`;
const packageManifestPath = path.join(DIST_DIR, packageManifestName);

if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
}

const packageFiles = [
  "manifest.json",
  "background.js",
  "i18n.js",
  "diagnostics.js",
  "sidepanel.html",
  "sidepanel.js",
  "dashboard.html",
  "dashboard.js",
  "styles.css",
  "icons",
  "_locales"
];

run("zip", ["-qr", outputPath, ...packageFiles], EXTENSION_DIR);

const checksum = sha256File(outputPath);
const packageManifest = {
  product: "TabMosaic AI",
  version: manifest.version,
  packageName,
  checksumName,
  sha256: checksum,
  commit: gitCommit(),
  generatedAt: new Date().toISOString(),
  packageFiles,
  safety: {
    includesEnvFiles: false,
    includesSourceMaps: false,
    includesNodeModules: false
  }
};

fs.writeFileSync(checksumPath, `${checksum}  ${packageName}\n`);
fs.writeFileSync(packageManifestPath, `${JSON.stringify(packageManifest, null, 2)}\n`);

console.log(`Wrote ${path.relative(ROOT_DIR, outputPath)}`);
console.log(`Wrote ${path.relative(ROOT_DIR, checksumPath)}`);
console.log(`Wrote ${path.relative(ROOT_DIR, packageManifestPath)}`);

function validateManifestAssets(manifest) {
  const iconPaths = new Set([
    ...Object.values(manifest.icons || {}),
    ...Object.values(manifest.action?.default_icon || {})
  ]);

  for (const iconPath of iconPaths) {
    const absolutePath = path.join(EXTENSION_DIR, iconPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Missing manifest icon: ${iconPath}`);
    }
  }

  if (manifest.action?.default_popup) {
    throw new Error("default_popup must not be set for the one-click action flow");
  }
}

function validateLocales(manifest) {
  if (manifest.default_locale !== "en") {
    throw new Error("default_locale must remain en for the current English/Chinese launch scope");
  }

  const enPath = path.join(EXTENSION_DIR, "_locales", "en", "messages.json");
  const zhPath = path.join(EXTENSION_DIR, "_locales", "zh_CN", "messages.json");
  const en = readLocale(enPath);
  const zh = readLocale(zhPath);
  const enKeys = Object.keys(en).sort();
  const zhKeys = Object.keys(zh).sort();

  if (JSON.stringify(enKeys) !== JSON.stringify(zhKeys)) {
    throw new Error("English and Chinese locale message keys must match");
  }

  for (const manifestKey of [manifest.name, manifest.description, manifest.action?.default_title]) {
    const messageKey = extractMessageKey(manifestKey);

    if (!messageKey || !en[messageKey]?.message || !zh[messageKey]?.message) {
      throw new Error(`Missing locale message for manifest field: ${manifestKey}`);
    }
  }
}

function readLocale(localePath) {
  if (!fs.existsSync(localePath)) {
    throw new Error(`Missing locale file: ${path.relative(ROOT_DIR, localePath)}`);
  }

  return JSON.parse(fs.readFileSync(localePath, "utf8"));
}

function extractMessageKey(value) {
  const match = /^__MSG_([A-Za-z0-9_]+)__$/.exec(String(value || ""));
  return match?.[1] || "";
}

function run(command, args, cwd) {
  const result = childProcess.spawnSync(command, args, {
    cwd,
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}`);
  }
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function gitCommit() {
  const result = childProcess.spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    return "unknown";
  }

  return result.stdout.trim() || "unknown";
}
