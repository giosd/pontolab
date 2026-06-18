"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import type { TimerStartFormData } from "@/lib/validations";

interface TimerFormProps {
  activities: readonly string[];
  isPending: boolean;
  error: string | null;
  onSubmit: (data: TimerStartFormData) => void;
}

export function TimerForm({
  activities,
  isPending,
  error,
  onSubmit,
}: TimerFormProps) {
  const [task, setTask] = useState("");
  const [activity, setActivity] = useState("");
  const [comment, setComment] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!task.trim()) {
      setLocalError("Informe a tarefa.");
      return;
    }
    if (!activity) {
      setLocalError("Selecione uma atividade.");
      return;
    }
    setLocalError(null);
    onSubmit({ task: task.trim(), activity, comment: comment.trim() });
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-[var(--app-text)]">Novo timer</h2>
      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
        Inicie um timer para registrar suas horas automaticamente.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Input
          label="Tarefa"
          value={task}
          onChange={(event) => setTask(event.target.value)}
          placeholder="O que você vai fazer?"
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
          placeholder="Detalhes adicionais"
          disabled={isPending}
        />

        {localError || error ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {localError ?? error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full py-3 text-base"
          disabled={isPending}
        >
          {isPending ? "Iniciando..." : "Iniciar Timer"}
        </Button>
      </form>
    </Card>
  );
}
