const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "extension");
const PROVIDER_REGISTRY_PATH = path.join(EXTENSION_DIR, "provider_registry.js");
const MANIFEST_PATH = path.join(EXTENSION_DIR, "manifest.json");
const DASHBOARD_HTML_PATH = path.join(EXTENSION_DIR, "dashboard.html");
const BACKGROUND_PATH = path.join(EXTENSION_DIR, "background.js");
const DASHBOARD_JS_PATH = path.join(EXTENSION_DIR, "dashboard.js");
const BYOK_GUIDE_PATH = path.join(ROOT_DIR, "04_TECH", "10_BYOK_PROVIDER_SETUP.md");

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});

async function main() {
  const failures = [];
  const {
    DEFAULT_AI_SETTINGS,
    AI_PROVIDER_PRESETS,
    AI_PROVIDER_HOST_IDS,
    DEFAULT_AI_HOSTNAME,
    DEFAULT_AI_PROVIDER_ORIGIN
  } = await import(pathToFileURL(PROVIDER_REGISTRY_PATH).href);
  const manifest = readJson(MANIFEST_PATH);
  const dashboardHtml = readText(DASHBOARD_HTML_PATH);
  const background = readText(BACKGROUND_PATH);
  const dashboardJs = readText(DASHBOARD_JS_PATH);
  const byokGuide = readText(BYOK_GUIDE_PATH);

  assertDefaultSettings(DEFAULT_AI_SETTINGS, DEFAULT_AI_HOSTNAME, DEFAULT_AI_PROVIDER_ORIGIN, manifest, failures);
  assertRegistryShape(AI_PROVIDER_PRESETS, AI_PROVIDER_HOST_IDS, manifest, dashboardHtml, byokGuide, failures);
  assertProviderContributionGuide(byokGuide, failures);
  assertSharedImports(background, dashboardJs, failures);

  if (failures.length) {
    console.error("FAIL provider registry check");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`PASS provider registry checked ${AI_PROVIDER_PRESETS.size} presets`);
}

function assertDefaultSettings(settings, defaultHostname, defaultOrigin, manifest, failures) {
  if (!settings || typeof settings !== "object") {
    failures.push("DEFAULT_AI_SETTINGS must be an object");
    return;
  }

  if (settings.enabled !== false) failures.push("DEFAULT_AI_SETTINGS.enabled must default to false");
  if (settings.provider !== "deepseek") failures.push("DEFAULT_AI_SETTINGS.provider must default to deepseek");
  if (settings.apiKey !== "") failures.push("DEFAULT_AI_SETTINGS.apiKey must default to an empty string");
  if (settings.baseUrl !== "https://api.deepseek.com") failures.push("DEFAULT_AI_SETTINGS.baseUrl must default to https://api.deepseek.com");
  if (!settings.model) failures.push("DEFAULT_AI_SETTINGS.model must be non-empty");
  if (defaultHostname !== "api.deepseek.com") failures.push("DEFAULT_AI_HOSTNAME must stay api.deepseek.com");
  if (defaultOrigin !== "https://api.deepseek.com/*") failures.push("DEFAULT_AI_PROVIDER_ORIGIN must stay https://api.deepseek.com/*");

  const hostPermissions = manifest.host_permissions || [];
  if (JSON.stringify(hostPermissions) !== JSON.stringify([defaultOrigin])) {
    failures.push(`manifest.host_permissions must stay ${defaultOrigin} only`);
  }
}

function assertRegistryShape(presets, hostIds, manifest, dashboardHtml, byokGuide, failures) {
  if (!(presets instanceof Map)) failures.push("AI_PROVIDER_PRESETS must be a Map");
  if (!(hostIds instanceof Map)) failures.push("AI_PROVIDER_HOST_IDS must be a Map");
  if (!(presets instanceof Map) || !(hostIds instanceof Map)) return;
  if (presets.size < 10) failures.push("AI_PROVIDER_PRESETS should keep broad BYOK provider coverage");
  if (!presets.has("deepseek")) failures.push("AI_PROVIDER_PRESETS must include deepseek");

  const seenBaseUrls = new Set();

  for (const [id, preset] of presets) {
    if (!/^[a-z0-9-]+$/.test(id)) failures.push(`Provider id must be lowercase kebab/alnum: ${id}`);
    if (!preset?.label) failures.push(`Provider ${id} missing label`);
    if (!preset?.baseUrl) failures.push(`Provider ${id} missing baseUrl`);
    if (!preset?.model) failures.push(`Provider ${id} missing model`);
    if (!dashboardHtml.includes(`value="${id}"`)) failures.push(`Dashboard provider select missing preset ${id}`);
    if (!byokGuide.includes(`| ${preset.label} |`) || !byokGuide.includes(`\`${preset.baseUrl}\``)) {
      failures.push(`BYOK guide table missing provider ${preset.label} / ${preset.baseUrl}`);
    }

    let url;
    try {
      url = new URL(preset.baseUrl);
    } catch {
      failures.push(`Provider ${id} has invalid baseUrl: ${preset.baseUrl}`);
      continue;
    }

    if (preset.baseUrl.endsWith("/")) failures.push(`Provider ${id} baseUrl should not end with a slash`);
    if (url.username || url.password || url.search || url.hash) {
      failures.push(`Provider ${id} baseUrl must not include username, password, query, or hash`);
    }

    const hostname = normalizeHostname(url.hostname);
    const isLocal = isLocalHostname(hostname);
    if (url.protocol === "http:" && !isLocal) failures.push(`Provider ${id} uses remote HTTP; remote providers must use HTTPS`);
    if (url.protocol !== "https:" && url.protocol !== "http:") failures.push(`Provider ${id} must use http or https`);
    if (!isLocal && hostIds.get(hostname) !== id) {
      failures.push(`AI_PROVIDER_HOST_IDS must map ${hostname} to ${id}`);
    }

    if (seenBaseUrls.has(preset.baseUrl)) failures.push(`Duplicate provider baseUrl: ${preset.baseUrl}`);
    seenBaseUrls.add(preset.baseUrl);
  }

  for (const [hostname, providerId] of hostIds) {
    if (!presets.has(providerId)) failures.push(`AI_PROVIDER_HOST_IDS maps ${hostname} to unknown provider ${providerId}`);
  }

  const optionalHostPermissions = manifest.optional_host_permissions || [];
  if (!optionalHostPermissions.includes("https://*/*")) failures.push("manifest.optional_host_permissions must include https://*/* for user-triggered provider origins");
  if (!optionalHostPermissions.includes("http://*/*")) failures.push("manifest.optional_host_permissions must include http://*/* for localhost provider origins");
}

function assertSharedImports(background, dashboardJs, failures) {
  if (!background.includes('from "./provider_registry.js"')) {
    failures.push("background.js must import provider_registry.js");
  }
  if (!dashboardJs.includes('from "./provider_registry.js"')) {
    failures.push("dashboard.js must import provider_registry.js");
  }
}

function assertProviderContributionGuide(byokGuide, failures) {
  for (const required of [
    "## 7. Adding A Provider Preset",
    "Only add providers that support an OpenAI-compatible `chat/completions` request shape.",
    "Run `node tools/provider_registry_check.js`.",
    "Remote Base URLs must use HTTPS.",
    "Do not add a new required host permission for a provider preset.",
    "Use only synthetic test data when validating a provider contribution."
  ]) {
    if (!byokGuide.includes(required)) {
      failures.push(`BYOK guide missing provider contribution guidance: ${required}`);
    }
  }
}

function normalizeHostname(hostname) {
  return String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
}

function isLocalHostname(hostname) {
  const normalized = normalizeHostname(hostname);
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost")
  );
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}
