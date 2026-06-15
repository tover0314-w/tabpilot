(async () => {
  const ROOT_ID = "tabmosaic-quick-rail-root";
  const HIDDEN_KEY = "tabmosaic.quickRailHidden";
  const PRIMARY_ACTIONS = [
    { action: "chat", icon: "chat", title: "Open TabMosaic" },
    { action: "read", icon: "page", title: "Ask about this page" },
    { action: "region", icon: "region", title: "Select page region" },
    { action: "save", icon: "todo", title: "Save page as todo" }
  ];
  const OVERFLOW_ACTIONS = [
    { action: "translate", icon: "translate", title: "Translate selected text" }
  ];

  if (window.top !== window) return;
  if (!/^https?:$/.test(window.location.protocol)) return;
  if (document.getElementById(ROOT_ID)) return;
  if (await getHiddenPreference()) return;

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.style.position = "fixed";
  root.style.top = "0";
  root.style.right = "0";
  root.style.width = "1px";
  root.style.height = "1px";
  root.style.zIndex = "2147483646";
  const shadow = root.attachShadow({ mode: "closed" });

  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
      }

      .rail {
        position: fixed;
        top: 46%;
        right: 12px;
        z-index: 2147483646;
        display: grid;
        gap: 6px;
        padding: 6px;
        border: 1px solid rgba(33, 47, 43, 0.1);
        border-radius: 18px;
        background: linear-gradient(160deg, rgba(255, 255, 255, 0.72), rgba(245, 251, 249, 0.54));
        box-shadow: 0 14px 34px rgba(29, 45, 41, 0.14);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        transform: translateY(-50%);
      }

      .action,
      .more,
      .hide {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border: 1px solid rgba(33, 47, 43, 0.08);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.62);
        color: rgba(24, 33, 31, 0.72);
        cursor: pointer;
        font: 650 0/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .action svg,
      .more svg {
        width: 17px;
        height: 17px;
        stroke: currentColor;
        stroke-width: 1.9;
        stroke-linecap: round;
        stroke-linejoin: round;
        fill: none;
      }

      .action:hover,
      .more:hover,
      .hide:hover {
        border-color: rgba(47, 116, 105, 0.2);
        background: rgba(255, 255, 255, 0.86);
        color: rgba(24, 33, 31, 0.9);
      }

      .action[data-state="error"] {
        color: #9f2f2f;
      }

      .overflow-wrap {
        position: relative;
        display: grid;
      }

      .more[aria-expanded="true"] {
        border-color: rgba(47, 116, 105, 0.22);
        background: rgba(255, 255, 255, 0.9);
        color: rgba(24, 33, 31, 0.9);
      }

      .overflow {
        position: absolute;
        top: 0;
        right: 42px;
        display: grid;
        gap: 6px;
        padding: 6px;
        border: 1px solid rgba(33, 47, 43, 0.08);
        border-radius: 18px;
        background: linear-gradient(160deg, rgba(255, 255, 255, 0.88), rgba(245, 251, 249, 0.7));
        box-shadow: 0 14px 34px rgba(29, 45, 41, 0.14);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }

      .overflow[hidden] {
        display: none;
      }

      .hide {
        position: absolute;
        top: -9px;
        right: -7px;
        width: 18px;
        height: 18px;
        opacity: 0;
        font: 650 10px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .rail:hover .hide,
      .rail:focus-within .hide {
        opacity: 1;
      }
    </style>
    <nav class="rail" aria-label="TabMosaic quick actions">
      <button class="hide" type="button" title="Hide TabMosaic quick rail" aria-label="Hide TabMosaic quick rail">x</button>
      ${PRIMARY_ACTIONS.map((item) => `
        <button
          class="action"
          type="button"
          title="${item.title}"
          aria-label="${item.title}"
          data-action="${item.action}"
        >${renderIcon(item.icon)}</button>
      `).join("")}
      <span class="overflow-wrap">
        <button
          class="more"
          type="button"
          title="More TabMosaic actions"
          aria-label="More TabMosaic actions"
          aria-expanded="false"
          aria-controls="tabmosaic-quick-rail-overflow"
          data-more
        >${renderIcon("more")}</button>
        <span class="overflow" id="tabmosaic-quick-rail-overflow" role="menu" aria-label="More TabMosaic quick actions" data-overflow hidden>
          ${OVERFLOW_ACTIONS.map((item) => `
            <button
              class="action"
              type="button"
              title="${item.title}"
              aria-label="${item.title}"
              data-action="${item.action}"
              data-overflow-action="${item.action}"
              role="menuitem"
            >${renderIcon(item.icon)}</button>
          `).join("")}
        </span>
      </span>
    </nav>
  `;

  const moreButton = shadow.querySelector("[data-more]");
  const overflow = shadow.querySelector("[data-overflow]");

  moreButton?.addEventListener("click", () => {
    toggleOverflow(overflow?.hasAttribute("hidden"));
  });

  shadow.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleOverflow(false);
    }
  });

  shadow.querySelector(".hide")?.addEventListener("click", async () => {
    await setHiddenPreference();
    root.remove();
  });

  shadow.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action || "";
      button.dataset.state = "running";

      try {
        const response = await chrome.runtime.sendMessage({
          type: "RUN_QUICK_RAIL_ACTION",
          action
        });

        if (!response?.ok) {
          throw new Error(response?.error || "Action failed");
        }

        button.dataset.state = "done";
      } catch {
        button.dataset.state = "error";
        setTimeout(() => {
          if (button.dataset.state === "error") {
            delete button.dataset.state;
          }
        }, 1800);
      }
    });
  });

  document.documentElement.appendChild(root);

  async function getHiddenPreference() {
    try {
      const result = await chrome.storage.local.get(HIDDEN_KEY);
      return result?.[HIDDEN_KEY] === true;
    } catch {
      return false;
    }
  }

  async function setHiddenPreference() {
    try {
      await chrome.storage.local.set({ [HIDDEN_KEY]: true });
    } catch {
      // Hiding is a local UI convenience; ignore extension storage failures.
    }
  }

  function toggleOverflow(open) {
    if (!moreButton || !overflow) return;

    moreButton.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      overflow.removeAttribute("hidden");
    } else {
      overflow.setAttribute("hidden", "");
    }
  }

  function renderIcon(name) {
    const icons = {
      chat: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6.5A4.5 4.5 0 0 1 9.5 2h5A4.5 4.5 0 0 1 19 6.5v3A4.5 4.5 0 0 1 14.5 14H11l-4.5 4v-4A4.5 4.5 0 0 1 5 9.5v-3Z" />
          <path d="M9 7h6" />
          <path d="M9 10h4" />
        </svg>
      `,
      page: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3h7l4 4v14H7V3Z" />
          <path d="M14 3v5h5" />
          <path d="M9.5 12h5" />
          <path d="M9.5 15h4" />
        </svg>
      `,
      region: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 8V5h3" />
          <path d="M16 5h3v3" />
          <path d="M19 16v3h-3" />
          <path d="M8 19H5v-3" />
          <path d="M9 9h6v6H9z" />
        </svg>
      `,
      todo: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4h10a2 2 0 0 1 2 2v13H5V6a2 2 0 0 1 2-2Z" />
          <path d="M9 3v3" />
          <path d="M15 3v3" />
          <path d="m8 13 2 2 4-4" />
        </svg>
      `,
      translate: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5h9" />
          <path d="M9 5c-.4 4-2 6.5-5 8.5" />
          <path d="M6.5 9.5c1.2 1.8 2.9 3.1 5 4" />
          <path d="M14 19 18 9l4 10" />
          <path d="M15.2 16h5.6" />
        </svg>
      `,
      more: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 6.5v.01" />
          <path d="M12 12v.01" />
          <path d="M12 17.5v.01" />
        </svg>
      `
    };

    return icons[name] || "";
  }
})();
