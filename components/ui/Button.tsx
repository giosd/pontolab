import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "submit"
  | "approve"
  | "reopen";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--app-primary)] text-white hover:opacity-90 focus-visible:ring-[var(--app-primary)]",
  secondary:
    "border border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-text)] hover:bg-[var(--app-card-secondary)] focus-visible:ring-[var(--app-primary)]",
  ghost:
    "text-[var(--app-text)] hover:bg-[var(--app-card-secondary)] focus-visible:ring-[var(--app-primary)]",
  danger:
    "bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-300 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60",
  submit:
    "bg-blue-50 text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60",
  approve:
    "bg-green-50 text-green-700 hover:bg-green-100 focus-visible:ring-green-300 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60",
  reopen:
    "bg-amber-50 text-amber-700 hover:bg-amber-100 focus-visible:ring-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-bg)] disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
