"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  storeTheme,
  type ThemeMode,
} from "@/lib/theme";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const syncTheme = useCallback((mode: ThemeMode) => {
    applyTheme(mode);
    setResolvedTheme(mode === "system" ? getSystemTheme() : mode);
  }, []);

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    syncTheme(stored);
  }, [syncTheme]);

  useEffect(() => {
    if (theme !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      syncTheme("system");
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme, syncTheme]);

  const setTheme = useCallback(
    (mode: ThemeMode) => {
      setThemeState(mode);
      storeTheme(mode);
      syncTheme(mode);
    },
    [syncTheme],
  );

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  }

  return context;
}
