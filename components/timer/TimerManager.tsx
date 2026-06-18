"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ActiveTimerCard } from "@/components/timer/ActiveTimerCard";
import { PausedTimerCard } from "@/components/timer/PausedTimerCard";
import { StopTimerModal } from "@/components/timer/StopTimerModal";
import { TimerForm } from "@/components/timer/TimerForm";
import { TimerHistoryTable } from "@/components/timer/TimerHistoryTable";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  cancelTimerAction,
  pauseTimerAction,
  resumeTimerAction,
  startTimerAction,
  stopTimerAction,
} from "@/lib/actions/timer";
import { TIMER_STATUS } from "@/lib/timer/constants";
import { roundSeconds, secondsToDecimalHours } from "@/lib/timer/format";
import type {
  ActiveTimer,
  TimerHistoryItem,
} from "@/types";
import type { TimerStartFormData, TimerStopFormData } from "@/lib/validations";

interface TimerManagerProps {
  initialTimer: ActiveTimer | null;
  history: TimerHistoryItem[];
  activities: readonly string[];
}

interface StopState {
  open: boolean;
  elapsedSeconds: number;
  defaultHours: number;
}

export function TimerManager({
  initialTimer,
  history,
  activities,
}: TimerManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [timer, setTimer] = useState<ActiveTimer | null>(initialTimer);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ActiveTimer | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [stop, setStop] = useState<StopState>({
    open: false,
    elapsedSeconds: 0,
    defaultHours: 0,
  });

  const handleStart = (data: TimerStartFormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await startTimerAction(data);
      if (result.success) {
        setTimer(result.timer);
        router.refresh();
        return;
      }
      if ("code" in result && result.code === "ACTIVE_TIMER_EXISTS") {
        setConflict(result.activeTimer);
        return;
      }
      setFormError(result.error ?? "Erro ao iniciar o timer.");
    });
  };

  const handlePause = () => {
    if (!timer) return;
    setActionError(null);
    startTransition(async () => {
      const result = await pauseTimerAction(timer.id);
      if (result.success) {
        setTimer(result.timer);
        router.refresh();
      } else {
        setActionError(result.error ?? "Erro ao pausar.");
      }
    });
  };

  const handleResume = () => {
    if (!timer) return;
    setActionError(null);
    startTransition(async () => {
      const result = await resumeTimerAction(timer.id);
      if (result.success) {
        setTimer(result.timer);
        router.refresh();
      } else {
        setActionError(result.error ?? "Erro ao retomar.");
      }
    });
  };

  const openStop = () => {
    if (!timer) return;
    const elapsedSinceLoad =
      timer.status === TIMER_STATUS.RUNNING
        ? Math.max(
            0,
            Math.floor((Date.now() - Date.parse(timer.serverNow)) / 1000),
          )
        : 0;
    const frozen = timer.currentElapsedSeconds + elapsedSinceLoad;
    const rounded = roundSeconds(frozen, timer.roundingMinutes);
    setActionError(null);
    setStop({
      open: true,
      elapsedSeconds: frozen,
      defaultHours: Math.max(0.01, secondsToDecimalHours(rounded)),
    });
  };

  const handleStopConfirm = (data: TimerStopFormData) => {
    if (!timer) return;
    setActionError(null);
    startTransition(async () => {
      const result = await stopTimerAction(timer.id, data);
      if (result.success) {
        setTimer(null);
        setStop((prev) => ({ ...prev, open: false }));
        router.refresh();
      } else {
        setActionError(result.error ?? "Erro ao finalizar.");
      }
    });
  };

  const handleCancelConfirm = () => {
    if (!timer) return;
    startTransition(async () => {
      const result = await cancelTimerAction(timer.id);
      if (result.success) {
        setTimer(null);
        setCancelOpen(false);
        router.refresh();
      } else {
        setActionError(result.error ?? "Erro ao cancelar.");
        setCancelOpen(false);
      }
    });
  };

  const handleConflictCancelCurrent = () => {
    if (!conflict) return;
    startTransition(async () => {
      const result = await cancelTimerAction(conflict.id);
      if (result.success) {
        setConflict(null);
        setTimer(null);
        router.refresh();
      } else {
        setFormError(result.error ?? "Erro ao cancelar o timer atual.");
        setConflict(null);
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Timer"
        description="Inicie, pause e finalize timers para registrar suas horas automaticamente."
      />

      {actionError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {actionError}
        </div>
      ) : null}

      <div className="mx-auto max-w-xl">
        {!timer ? (
          <TimerForm
            activities={activities}
            isPending={isPending}
            error={formError}
            onSubmit={handleStart}
          />
        ) : timer.status === TIMER_STATUS.PAUSED ? (
          <PausedTimerCard
            timer={timer}
            isPending={isPending}
            onResume={handleResume}
            onStop={openStop}
            onCancel={() => setCancelOpen(true)}
          />
        ) : (
          <ActiveTimerCard
            timer={timer}
            isPending={isPending}
            onPause={handlePause}
            onStop={openStop}
            onCancel={() => setCancelOpen(true)}
          />
        )}
      </div>

      <div className="mt-8">
        <TimerHistoryTable items={history} />
      </div>

      {stop.open && timer ? (
        <StopTimerModal
          activities={activities}
          elapsedSeconds={stop.elapsedSeconds}
          defaultTask={timer.task}
          defaultActivity={timer.activity}
          defaultComment={timer.comment ?? ""}
          defaultHours={stop.defaultHours}
          isPending={isPending}
          error={actionError}
          onConfirm={handleStopConfirm}
          onCancel={() => setStop((prev) => ({ ...prev, open: false }))}
        />
      ) : null}

      <ConfirmDialog
        open={cancelOpen}
        title="Cancelar timer"
        description="O timer será cancelado e nenhum registro será criado. Deseja continuar?"
        confirmText="Cancelar timer"
        cancelText="Voltar"
        variant="danger"
        loading={isPending}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelOpen(false)}
      />

      {conflict ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setConflict(null)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-[var(--app-text)]">
              Você já possui um timer em andamento
            </h2>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">
              Tarefa atual: {conflict.task} ({conflict.activity}).
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => {
                  setTimer(conflict);
                  setConflict(null);
                }}
                disabled={isPending}
              >
                Continuar timer atual
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConflictCancelCurrent}
                disabled={isPending}
              >
                Cancelar timer atual
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConflict(null)}
                disabled={isPending}
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
