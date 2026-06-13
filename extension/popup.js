import { applyI18n, initI18n, msg } from "./i18n.js";

await initI18n();
applyI18n();

document.querySelectorAll("[data-toolbar-action]").forEach((button) => {
  button.addEventListener("click", async () => {
    const action = button.dataset.toolbarAction || "";
    await runToolbarAction(action, button);
  });
});

async function runToolbarAction(action, button) {
  setBusy(button, true);

  try {
    const activeTab = await getActiveTab();
    const response = await chrome.runtime.sendMessage({
      type: "RUN_TOOLBAR_ACTION",
      action,
      activeWindowId: activeTab?.windowId ?? null,
      activeTabId: activeTab?.id ?? null
    });

    if (!response?.ok) {
      throw new Error(response?.error || msg("toolbarActionFailed"));
    }

    window.close();
  } catch (error) {
    button.classList.add("error");
    button.querySelector("small").textContent = error?.message || msg("toolbarActionFailed");
    setBusy(button, false);
  }
}

async function getActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tab || null;
  } catch {
    return null;
  }
}

function setBusy(activeButton, isBusy) {
  document.querySelectorAll("[data-toolbar-action]").forEach((button) => {
    button.disabled = isBusy;
  });

  if (activeButton && isBusy) {
    activeButton.classList.add("loading");
  } else if (activeButton) {
    activeButton.classList.remove("loading");
  }
}
