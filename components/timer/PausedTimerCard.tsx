"use client";

import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDateBR } from "@/lib/dates";
import type { ActiveTimer } from "@/types";

interface PausedTimerCardProps {
  timer: ActiveTimer;
  isPending: boolean;
  onResume: () => void;
  onStop: () => void;
  onCancel: () => void;
}

export function PausedTimerCard({
  timer,
  isPending,
  onResume,
  onStop,
  onCancel,
}: PausedTimerCardProps) {
  return (
    <Card className="text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
        Timer pausado
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
        className="my-6 text-5xl font-bold opacity-70 sm:text-6xl"
      />

      <p className="text-sm text-[var(--app-text-muted)]">
        Tempo acumulado · início às {formatDateBR(timer.startedAt, "HH:mm")}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Button
          type="button"
          variant="approve"
          className="py-3 text-base"
          onClick={onResume}
          disabled={isPending}
        >
          Continuar
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
