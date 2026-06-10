const fs = require("fs");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

const ROOT_DIR = path.resolve(__dirname, "..");
const UI_SCREENSHOT_DIR = path.join(ROOT_DIR, "artifacts", "ui-screenshots");
const OUT_DIR = path.join(ROOT_DIR, "artifacts", "store-screenshots");
const WIDTH = 1280;
const HEIGHT = 800;

const SCREENSHOTS = [
  {
    name: "01-one-click-native-groups.png",
    source: "dashboard-overview.png",
    title: "One click organizes every work tab",
    subtitle: "TabMosaic turns busy browser sessions into real Chrome native tab groups.",
    note: "Dashboard overview - mock beta data",
    frame: { left: 260, top: 162, width: 930, height: 560, position: "top" },
    accent: "#2f7469"
  },
  {
    name: "02-tab-agent-sidebar.png",
    source: "sidepanel-result.png",
    title: "Continue from the Tab Agent",
    subtitle: "Undo, restore, review duplicates, summarize the current tab, and refine groups from one chat surface.",
    note: "Sidebar result - mock beta data",
    frame: { left: 760, top: 86, width: 360, height: 660, position: "top" },
    sideText: true,
    accent: "#536c9f"
  },
  {
    name: "03-smart-groups-dashboard.png",
    source: "dashboard-overview.png",
    title: "Smart Groups stay editable",
    subtitle: "Review groups, focus tabs, move tabs within a window, save local snapshots, and keep the default UI calm.",
    note: "Smart Groups - mock beta data",
    frame: { left: 154, top: 174, width: 972, height: 548, position: "top" },
    accent: "#8b6bb1"
  },
  {
    name: "04-privacy-ai-settings.png",
    source: "dashboard-ai-settings.png",
    title: "Privacy-first AI controls",
    subtitle: "AI classification is optional. Page text is read only after the user asks for a current-tab summary.",
    note: "Settings - mock beta data",
    frame: { left: 184, top: 178, width: 912, height: 532, position: "top" },
    accent: "#b46b7d"
  },
  {
    name: "05-mobile-dashboard.png",
    source: "dashboard-mobile.png",
    title: "A compact dashboard for repeat work",
    subtitle: "Smart Groups, duplicate review, rules, and saved local snapshots remain usable in narrow views.",
    note: "Mobile-width dashboard - mock beta data",
    frame: { left: 794, top: 82, width: 330, height: 668, position: "top" },
    sideText: true,
    accent: "#c0843f"
  }
];

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});

async function main() {
  const sharp = resolveSharp();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const item of SCREENSHOTS) {
    await buildScreenshot(sharp, item);
  }

  writeReadme();

  console.log("PASS store screenshot drafts captured");
  for (const item of SCREENSHOTS) {
    console.log(path.relative(ROOT_DIR, path.join(OUT_DIR, item.name)));
  }
}

async function buildScreenshot(sharp, item) {
  const sourcePath = path.join(UI_SCREENSHOT_DIR, item.source);
  const outputPath = path.join(OUT_DIR, item.name);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing UI screenshot input: ${path.relative(ROOT_DIR, sourcePath)}. Run tools/capture_ui_screenshots.js first.`);
  }

  const frame = item.frame;
  const image = await sharp(sourcePath)
    .resize(frame.width, frame.height, {
      fit: "cover",
      position: frame.position || "top"
    })
    .png()
    .toBuffer();
  const border = Buffer.from(frameSvg(frame.width, frame.height));
  const background = Buffer.from(backgroundSvg(item));

  await sharp(background)
    .composite([
      {
        input: border,
        left: frame.left - 10,
        top: frame.top - 10
      },
      {
        input: image,
        left: frame.left,
        top: frame.top
      }
    ])
    .png()
    .toFile(outputPath);

  const metadata = await sharp(outputPath).metadata();
  const stats = fs.statSync(outputPath);

  if (metadata.width !== WIDTH || metadata.height !== HEIGHT) {
    throw new Error(`${item.name} must be ${WIDTH}x${HEIGHT}; got ${metadata.width}x${metadata.height}`);
  }

  if (stats.size < 50000) {
    throw new Error(`${item.name} looks too small (${stats.size} bytes)`);
  }
}

function backgroundSvg(item) {
  const isSideText = Boolean(item.sideText);
  const titleX = isSideText ? 104 : 110;
  const titleY = isSideText ? 166 : 84;
  const noteX = item.frame.left;
  const noteY = item.frame.top + item.frame.height + 38;
  const titleLines = wrapText(item.title, isSideText ? 28 : 58);
  const subtitleStart = 40 + titleLines.length * 50 + 10;
  const subtitleLines = wrapText(item.subtitle, isSideText ? 39 : 88);
  const bulletY = subtitleStart + subtitleLines.length * 32 + 32;
  const bulletLines = isSideText ? ["Local by default", "Native tab groups", "Undo and Restore"] : [];

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6faf7"/>
      <stop offset="0.55" stop-color="#eef5f1"/>
      <stop offset="1" stop-color="#f8f3ea"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="28" flood-color="#16352f" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <circle cx="1120" cy="128" r="180" fill="${escapeXml(item.accent)}" opacity="0.08"/>
  <circle cx="178" cy="694" r="220" fill="#ffffff" opacity="0.55"/>
  <g transform="translate(${titleX} ${titleY})">
    <rect x="-2" y="-44" width="44" height="44" rx="13" fill="${escapeXml(item.accent)}"/>
    <text x="13" y="-16" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800" fill="#ffffff">T</text>
    <text x="62" y="-17" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="#1c2b28">TabMosaic</text>
    ${titleLines
      .map(
        (line, index) =>
          `<text x="0" y="${40 + index * 50}" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800" fill="#172421">${escapeXml(line)}</text>`
      )
      .join("")}
    ${subtitleLines
      .map(
        (line, index) =>
          `<text x="0" y="${subtitleStart + index * 32}" font-family="Inter, Arial, sans-serif" font-size="21" fill="#50615c">${escapeXml(line)}</text>`
      )
      .join("")}
    ${bulletLines
      .map(
        (line, index) => `
    <g transform="translate(0 ${bulletY + index * 38})">
      <circle cx="8" cy="-7" r="5" fill="${escapeXml(item.accent)}"/>
      <text x="24" y="0" font-family="Inter, Arial, sans-serif" font-size="18" fill="#2c3d39">${escapeXml(line)}</text>
    </g>`
      )
      .join("")}
  </g>
  <g filter="url(#softShadow)">
    <rect x="${item.frame.left - 10}" y="${item.frame.top - 10}" width="${item.frame.width + 20}" height="${item.frame.height + 20}" rx="24" fill="#ffffff" opacity="0.72"/>
  </g>
  <text x="${noteX}" y="${noteY}" font-family="Inter, Arial, sans-serif" font-size="15" fill="#63736e">${escapeXml(item.note)}</text>
</svg>`;
}

function frameSvg(width, height) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width + 20}" height="${height + 20}" viewBox="0 0 ${width + 20} ${height + 20}">
  <rect x="9" y="9" width="${width + 2}" height="${height + 2}" rx="18" fill="#ffffff" stroke="#d7e2dd"/>
</svg>`;
}

function wrapText(text, limit) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > limit && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }

  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeReadme() {
  const readmePath = path.join(OUT_DIR, "README.md");
  const lines = [
    "# TabMosaic AI Store Screenshot Drafts",
    "",
    "Status: DO NOT SUBMIT YET",
    "",
    "These 1280x800 PNG drafts are generated from mock UI screenshots. They do not use real browser tabs, real browsing data, API keys, or private screenshots.",
    "",
    "Source guidance checked from Chrome for Developers:",
    "",
    "- https://developer.chrome.com/docs/webstore/images",
    "- https://developer.chrome.com/docs/webstore/best-listing",
    "",
    "Files:",
    ...SCREENSHOTS.map((item) => `- ${item.name}`)
  ];

  fs.writeFileSync(readmePath, `${lines.join("\n")}\n`);
}

function resolveSharp() {
  const candidates = [
    process.env.SHARP_NODE_MODULE_DIR,
    process.env.NODE_REPL_NODE_MODULE_DIRS?.split(path.delimiter)[0],
    path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules")
  ].filter(Boolean);

  try {
    return require("sharp");
  } catch {
    for (const nodeModulesDir of candidates) {
      const packagePath = path.join(nodeModulesDir, "sharp", "package.json");
      if (fs.existsSync(packagePath)) {
        return createRequire(path.join(nodeModulesDir, "noop.js"))("sharp");
      }
    }
  }

  throw new Error(
    [
      "sharp is required for store screenshot drafts.",
      "Install it locally or set SHARP_NODE_MODULE_DIR to a node_modules directory that contains sharp."
    ].join(" ")
  );
}
