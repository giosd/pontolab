"use client";

import { THEME_OPTIONS } from "@/lib/theme";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      {THEME_OPTIONS.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-card-secondary)] px-4 py-3"
        >
          <input
            type="radio"
            name="theme-mode"
            value={option.value}
            checked={theme === option.value}
            onChange={() => setTheme(option.value)}
            className="h-4 w-4 border-[var(--app-border)] text-[var(--app-primary)]"
          />
          <span className="text-sm text-[var(--app-text)]">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
