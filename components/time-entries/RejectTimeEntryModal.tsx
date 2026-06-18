"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const MIN_REASON_LENGTH = 3;

interface RejectTimeEntryModalProps {
  open: boolean;
  title?: string;
  description?: string;
  label?: string;
  confirmText?: string;
  confirmVariant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectTimeEntryModal({
  open,
  title = "Rejeitar registro",
  description = "Informe o motivo da rejeição. Ele ficará visível para o usuário.",
  label = "Motivo da rejeição",
  confirmText = "Rejeitar",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: RejectTimeEntryModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const trimmed = reason.trim();

    if (trimmed.length < MIN_REASON_LENGTH) {
      setError(`Informe um motivo com pelo menos ${MIN_REASON_LENGTH} caracteres.`);
      return;
    }

    setError(null);
    onConfirm(trimmed);
  };

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--app-text-muted)]">{description}</p>

        <div className="space-y-1.5">
          <label
            htmlFor="reject-reason"
            className="block text-sm font-medium text-[var(--app-text)]"
          >
            {label}
          </label>
          <textarea
            id="reject-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={loading}
            autoFocus
            className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/30"
          />
          {error ? (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={confirmVariant === "danger" ? "danger" : "primary"}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Aguarde..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
