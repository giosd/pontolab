"use client";

import Link from "next/link";

import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getTimerStatusLabel } from "@/lib/timer/constants";
import type { ActiveTimer } from "@/types";

interface TimerDashboardCardProps {
  timer: ActiveTimer | null;
}

export function TimerDashboardCard({ timer }: TimerDashboardCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--app-text-muted)]">
            Timer ativo
          </p>
          {timer ? (
            <>
              <p className="mt-1 text-base font-semibold text-[var(--app-text)]">
                {timer.task}
              </p>
              <p className="text-sm text-[var(--app-text-muted)]">
                {timer.activity} · {getTimerStatusLabel(timer.status)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-base font-semibold text-[var(--app-text)]">
              Nenhum timer ativo
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {timer ? (
            <TimerDisplay
              key={`${timer.status}-${timer.currentElapsedSeconds}`}
              status={timer.status}
              baseElapsedSeconds={timer.currentElapsedSeconds}
              className="text-2xl font-bold"
            />
          ) : null}
          <Link href="/timer">
            <Button type="button" variant={timer ? "primary" : "secondary"}>
              Ir para Timer
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
