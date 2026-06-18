"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDuration } from "@/lib/timer/format";
import type { TimerStopFormData } from "@/lib/validations";

interface StopTimerModalProps {
  activities: readonly string[];
  elapsedSeconds: number;
  defaultTask: string;
  defaultActivity: string;
  defaultComment: string;
  defaultHours: number;
  isPending: boolean;
  error: string | null;
  onConfirm: (data: TimerStopFormData) => void;
  onCancel: () => void;
}

export function StopTimerModal({
  activities,
  elapsedSeconds,
  defaultTask,
  defaultActivity,
  defaultComment,
  defaultHours,
  isPending,
  error,
  onConfirm,
  onCancel,
}: StopTimerModalProps) {
  const [task, setTask] = useState(defaultTask);
  const [activity, setActivity] = useState(defaultActivity);
  const [comment, setComment] = useState(defaultComment);
  const [hours, setHours] = useState(String(defaultHours));
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConfirm = () => {
    const parsedHours = Number(hours.replace(",", "."));

    if (!task.trim()) {
      setLocalError("Informe a tarefa.");
      return;
    }
    if (!activity) {
      setLocalError("Selecione uma atividade.");
      return;
    }
    if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
      setLocalError("Informe horas válidas (maior que zero).");
      return;
    }

    setLocalError(null);
    onConfirm({
      task: task.trim(),
      activity,
      comment: comment.trim(),
      hours: parsedHours,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/40 dark:bg-black/60"
        onClick={onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-[var(--app-text)]">
          Resumo do timer
        </h2>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--app-border)] bg-[var(--app-card-secondary)] px-4 py-3">
          <span className="text-sm text-[var(--app-text-muted)]">
            Tempo trabalhado
          </span>
          <span className="font-mono text-lg font-semibold text-[var(--app-text)]">
            {formatDuration(elapsedSeconds)}
          </span>
        </div>

        <div className="mt-4 space-y-4">
          <Input
            label="Tarefa"
            value={task}
            onChange={(event) => setTask(event.target.value)}
            disabled={isPending}
          />
          <Select
            label="Atividade"
            placeholder="Selecione"
            value={activity}
            onChange={(event) => setActivity(event.target.value)}
            options={activities.map((item) => ({ value: item, label: item }))}
            disabled={isPending}
          />
          <Input
            label="Comentário (opcional)"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={isPending}
          />
          <Input
            label="Horas calculadas"
            type="number"
            step="0.01"
            min="0"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            disabled={isPending}
          />
        </div>

        {localError || error ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {localError ?? error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isPending}
          >
            Voltar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Salvando..." : "Criar Registro"}
          </Button>
        </div>
      </div>
    </div>
  );
}
