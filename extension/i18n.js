let englishMessages = null;
let englishMessagesPromise = null;

export async function initI18n() {
  if (englishMessages) return;
  if (!englishMessagesPromise) {
    englishMessagesPromise = fetch(resolveEnglishMessagesUrl(), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((messages) => {
        englishMessages = messages || {};
      })
      .catch(() => {
        englishMessages = {};
      });
  }

  await englishMessagesPromise;
}

export function msg(key, substitutions = []) {
  const values = Array.isArray(substitutions) ? substitutions : [substitutions];
  const args = values.length ? values.map((value) => String(value ?? "")) : undefined;
  const text = formatEnglishMessage(key, args) || globalThis.chrome?.i18n?.getMessage?.(key, args);
  return text || key;
}

export function applyI18n(root = document) {
  document.documentElement.lang = "en";

  root.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = msg(element.dataset.i18n);
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", msg(element.dataset.i18nPlaceholder));
  });

  root.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", msg(element.dataset.i18nTitle));
  });

  root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", msg(element.dataset.i18nAriaLabel));
  });
}

function resolveEnglishMessagesUrl() {
  if (globalThis.chrome?.runtime?.getURL) {
    return globalThis.chrome.runtime.getURL("_locales/en/messages.json");
  }

  return "_locales/en/messages.json";
}

function formatEnglishMessage(key, substitutions) {
  const template = englishMessages?.[key]?.message;
  if (!template) return "";

  return String(template).replace(/\$(\d+)/g, (match, index) => {
    const value = substitutions?.[Number(index) - 1];
    return value === undefined ? match : String(value);
  });
}
