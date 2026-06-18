"use client";

import { Button } from "@/components/ui/Button";

export type ConfirmVariant = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles: Record<
  ConfirmVariant,
  { icon: string; confirmClass: string }
> = {
  danger: {
    icon: "text-red-500 dark:text-red-400",
    confirmClass: "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500",
  },
  warning: {
    icon: "text-amber-500 dark:text-amber-400",
    confirmClass:
      "bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400",
  },
  info: {
    icon: "text-[var(--app-primary)]",
    confirmClass: "",
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "info",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/40 dark:bg-black/60"
        onClick={onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 text-xl ${styles.icon}`} aria-hidden>
            {variant === "danger" ? "⚠" : variant === "warning" ? "!" : "i"}
          </span>
          <div className="flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-[var(--app-text)]"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-description"
              className="mt-2 text-sm text-[var(--app-text-muted)]"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            className={variant !== "danger" ? styles.confirmClass : undefined}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Aguarde..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
