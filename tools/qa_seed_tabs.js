const childProcess = require("child_process");

const URL_SETS = [
  {
    name: "Code Review",
    expectedGroup: "Code Review",
    urls: [
      "https://github.com/microsoft/vscode/pull/1",
      "https://github.com/microsoft/vscode/pull/2"
    ]
  },
  {
    name: "Chrome Extension Docs",
    expectedGroup: "Chrome Extension Docs",
    urls: [
      "https://developer.chrome.com/docs/extensions/reference/api/tabs",
      "https://developer.chrome.com/docs/extensions/reference/api/tabGroups",
      "https://developer.chrome.com/docs/extensions/reference/api/sidePanel"
    ]
  },
  {
    name: "Docs & Notes",
    expectedGroup: "Docs & Notes",
    urls: [
      "https://docs.google.com/document/d/tabmosaic-qa-one/edit",
      "https://docs.google.com/document/d/tabmosaic-qa-two/edit"
    ]
  },
  {
    name: "Communication",
    expectedGroup: "Communication",
    urls: [
      "https://mail.google.com/mail/u/0/#inbox",
      "https://teams.microsoft.com/"
    ]
  },
  {
    name: "Product & Tasks",
    expectedGroup: "Product & Tasks",
    urls: [
      "https://linear.app/acme/issue/TAB-1/tabmosaic-qa",
      "https://trello.com/b/tabmosaicqa"
    ]
  },
  {
    name: "Safe exact duplicate",
    expectedGroup: "Duplicate cleanup",
    urls: [
      "https://example.com/tabmosaic/exact-duplicate",
      "https://example.com/tabmosaic/exact-duplicate"
    ]
  },
  {
    name: "Safe tracking duplicate",
    expectedGroup: "Duplicate cleanup",
    urls: [
      "https://example.com/tabmosaic/tracking",
      "https://example.com/tabmosaic/tracking?utm_source=newsletter&utm_campaign=qa"
    ]
  },
  {
    name: "Review-only hash duplicate",
    expectedGroup: "Duplicate review",
    urls: [
      "https://example.com/tabmosaic/review#one",
      "https://example.com/tabmosaic/review#two"
    ]
  },
  {
    name: "Review-only query duplicate",
    expectedGroup: "Duplicate review",
    urls: [
      "https://example.com/tabmosaic/search?q=alpha",
      "https://example.com/tabmosaic/search?q=beta"
    ]
  }
];

const shouldOpen = process.argv.includes("--open");
const shouldListJson = process.argv.includes("--json");
const urls = URL_SETS.flatMap((set) => set.urls);

if (shouldListJson) {
  console.log(JSON.stringify(URL_SETS, null, 2));
  process.exit(0);
}

if (!shouldOpen) {
  console.log("QA seed URLs. Re-run with --open to open them in Google Chrome.");
  console.log("");

  for (const set of URL_SETS) {
    console.log(`# ${set.name} -> ${set.expectedGroup}`);
    for (const url of set.urls) {
      console.log(url);
    }
    console.log("");
  }

  console.log(`Total URLs: ${urls.length}`);
  process.exit(0);
}

for (const url of urls) {
  const result = childProcess.spawnSync("open", ["-a", "Google Chrome", url], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log(`Opened ${urls.length} QA tabs in Google Chrome.`);
