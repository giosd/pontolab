import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export function Select({
  label,
  options,
  error,
  placeholder,
  id,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-[var(--app-text)]"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition-colors focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/30 ${className}`}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
