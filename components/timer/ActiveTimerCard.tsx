"use client";

import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDateBR } from "@/lib/dates";
import type { ActiveTimer } from "@/types";

interface ActiveTimerCardProps {
  timer: ActiveTimer;
  isPending: boolean;
  onPause: () => void;
  onStop: () => void;
  onCancel: () => void;
}

export function ActiveTimerCard({
  timer,
  isPending,
  onPause,
  onStop,
  onCancel,
}: ActiveTimerCardProps) {
  return (
    <Card className="text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300">
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        Em andamento
      </span>

      <h2 className="mt-4 text-xl font-semibold text-[var(--app-text)]">
        {timer.task}
      </h2>
      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
        {timer.activity}
      </p>

      <TimerDisplay
        key={`${timer.status}-${timer.currentElapsedSeconds}`}
        status={timer.status}
        baseElapsedSeconds={timer.currentElapsedSeconds}
        className="my-6 text-5xl font-bold sm:text-6xl"
      />

      <p className="text-sm text-[var(--app-text-muted)]">
        Início às {formatDateBR(timer.startedAt, "HH:mm")}
      </p>

      {timer.comment ? (
        <p className="mt-2 text-sm text-[var(--app-text-muted)]">
          {timer.comment}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Button
          type="button"
          variant="reopen"
          className="py-3 text-base"
          onClick={onPause}
          disabled={isPending}
        >
          Pausar
        </Button>
        <Button
          type="button"
          className="py-3 text-base"
          onClick={onStop}
          disabled={isPending}
        >
          Finalizar
        </Button>
        <Button
          type="button"
          variant="danger"
          className="py-3 text-base"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
