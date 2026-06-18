export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "pontolab-theme";

export const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Tema claro" },
  { value: "dark", label: "Tema escuro" },
  { value: "system", label: "Usar tema do sistema" },
];

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return getSystemTheme();
  }

  return mode;
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);

  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return "light";
}

export function applyTheme(mode: ThemeMode) {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;

  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
}

export function storeTheme(mode: ThemeMode) {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyTheme(mode);
}

export const themeInitScript = `
(function () {
  try {
    var key = "${THEME_STORAGE_KEY}";
    var stored = localStorage.getItem(key);
    var mode = stored === "dark" || stored === "light" || stored === "system" ? stored : "light";
    var resolved = mode === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.dataset.theme = resolved;
  } catch (e) {}
})();
`;
