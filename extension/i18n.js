export function msg(key, substitutions = []) {
  const values = Array.isArray(substitutions) ? substitutions : [substitutions];
  const args = values.length ? values.map((value) => String(value ?? "")) : undefined;
  const text = globalThis.chrome?.i18n?.getMessage?.(key, args);
  return text || key;
}

export function applyI18n(root = document) {
  const language = globalThis.chrome?.i18n?.getUILanguage?.() || "en";
  document.documentElement.lang = language.toLowerCase().startsWith("zh") ? "zh-CN" : "en";

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
