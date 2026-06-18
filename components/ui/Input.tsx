import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-[var(--app-text)]"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/30 ${className}`}
        {...props}
      />
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
