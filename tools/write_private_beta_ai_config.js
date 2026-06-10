const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT_DIR, ".env.local");
const OUTPUT_PATH = path.join(ROOT_DIR, "extension", "private-beta-ai-settings.json");
const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-flash";

main();

function main() {
  if (process.argv.includes("--clear")) {
    fs.rmSync(OUTPUT_PATH, { force: true });
    console.log(`Removed ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
    return;
  }

  const env = {
    ...readDotEnv(ENV_PATH),
    ...process.env
  };
  const apiKey = normalizeApiKey(env.DEEPSEEK_API_KEY || env.OPENAI_COMPATIBLE_API_KEY || "");

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY in .env.local or environment.");
  }

  const config = {
    enabled: true,
    provider: "deepseek",
    baseUrl: normalizeBaseUrl(env.DEEPSEEK_BASE_URL || env.OPENAI_COMPATIBLE_BASE_URL || DEFAULT_BASE_URL),
    model: String(env.DEEPSEEK_MODEL || env.OPENAI_COMPATIBLE_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL,
    apiKey
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  console.log(`Wrote ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
  console.log("DeepSeek key was copied into the local unpacked-extension config file and was not printed.");
  console.log("This file is git-ignored and excluded from release packaging.");
}

function readDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const env = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) {
      if (!env.DEEPSEEK_API_KEY && /^sk-[A-Za-z0-9_-]+$/.test(trimmed)) {
        env.DEEPSEEK_API_KEY = trimmed;
      }
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function normalizeBaseUrl(value) {
  const rawValue = String(value || DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL;
  let url;

  try {
    url = new URL(rawValue);
  } catch {
    throw new Error("Current private beta supports only https://api.deepseek.com as the AI base URL.");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== "api.deepseek.com" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Current private beta supports only https://api.deepseek.com as the AI base URL.");
  }

  return url.toString().replace(/\/+$/, "");
}

function normalizeApiKey(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}
