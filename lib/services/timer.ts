import { startOfDay } from "date-fns";

import { isAdmin, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ACTIVE_TIMER_STATUSES,
  DEFAULT_TIMER_ROUNDING_MINUTES,
  TIMER_HISTORY_LIMIT,
  TIMER_STATUS,
} from "@/lib/timer/constants";
import { TIME_ENTRY_STATUS } from "@/lib/time-entry-status";
import {
  timerStartSchema,
  timerStopSchema,
  type TimerStartFormData,
  type TimerStopFormData,
} from "@/lib/validations";
import type { ActiveTimer, TimerHistoryItem } from "@/types";

type TimerRow = {
  id: string;
  userId: string;
  task: string;
  activity: string;
  comment: string | null;
  status: string;
  startedAt: Date;
  pausedAt: Date | null;
  resumedAt: Date | null;
  stoppedAt: Date | null;
  totalPausedSeconds: number;
  elapsedSeconds: number;
  createdTimeEntryId: string | null;
};

function diffSeconds(later: Date, earlier: Date): number {
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / 1000));
}

export function computeElapsedSeconds(row: TimerRow, now: Date): number {
  if (row.status === TIMER_STATUS.RUNNING) {
    return Math.max(0, diffSeconds(now, row.startedAt) - row.totalPausedSeconds);
  }

  if (row.status === TIMER_STATUS.PAUSED && row.pausedAt) {
    return Math.max(
      0,
      diffSeconds(row.pausedAt, row.startedAt) - row.totalPausedSeconds,
    );
  }

  return row.elapsedSeconds;
}

export function applyRounding(seconds: number, roundingMinutes: number): number {
  if (!roundingMinutes || roundingMinutes <= 0) {
    return seconds;
  }

  const increment = roundingMinutes * 60;
  return Math.round(seconds / increment) * increment;
}

export function secondsToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 100) / 100;
}

async function getRoundingMinutes(userId: string): Promise<number> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { timerRoundingMinutes: true },
  });

  return settings?.timerRoundingMinutes ?? DEFAULT_TIMER_ROUNDING_MINUTES;
}

function serializeActiveTimer(
  row: TimerRow,
  now: Date,
  roundingMinutes: number,
): ActiveTimer {
  return {
    id: row.id,
    task: row.task,
    activity: row.activity,
    comment: row.comment,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    pausedAt: row.pausedAt ? row.pausedAt.toISOString() : null,
    totalPausedSeconds: row.totalPausedSeconds,
    currentElapsedSeconds: computeElapsedSeconds(row, now),
    roundingMinutes,
    serverNow: now.toISOString(),
  };
}

async function loadOwnedTimer(
  id: string,
  session: SessionUser,
): Promise<TimerRow> {
  const row = await prisma.timerSession.findUnique({ where: { id } });

  if (!row) {
    throw new Error("Timer não encontrado.");
  }

  if (!isAdmin(session) && row.userId !== session.userId) {
    throw new Error("Você não tem permissão para acessar este timer.");
  }

  return row;
}

export async function getActiveTimerRow(userId: string): Promise<TimerRow | null> {
  return prisma.timerSession.findFirst({
    where: { userId, status: { in: ACTIVE_TIMER_STATUSES } },
    orderBy: { startedAt: "desc" },
  });
}

export async function getActiveTimer(
  userId: string,
): Promise<ActiveTimer | null> {
  const row = await getActiveTimerRow(userId);

  if (!row) {
    return null;
  }

  const roundingMinutes = await getRoundingMinutes(userId);
  return serializeActiveTimer(row, new Date(), roundingMinutes);
}

export async function startTimer(
  userId: string,
  data: TimerStartFormData,
): Promise<ActiveTimer> {
  const existing = await getActiveTimerRow(userId);

  if (existing) {
    throw new Error("Você já possui um timer em andamento.");
  }

  const parsed = timerStartSchema.parse(data);
  const now = new Date();

  const row = await prisma.timerSession.create({
    data: {
      userId,
      task: parsed.task.trim(),
      activity: parsed.activity,
      comment: parsed.comment?.trim() || null,
      status: TIMER_STATUS.RUNNING,
      startedAt: now,
    },
  });

  const roundingMinutes = await getRoundingMinutes(userId);
  return serializeActiveTimer(row, now, roundingMinutes);
}

export async function pauseTimer(
  id: string,
  session: SessionUser,
): Promise<ActiveTimer> {
  const row = await loadOwnedTimer(id, session);

  if (row.status !== TIMER_STATUS.RUNNING) {
    throw new Error("Apenas timers em andamento podem ser pausados.");
  }

  const now = new Date();
  const elapsed = computeElapsedSeconds(row, now);

  const updated = await prisma.timerSession.update({
    where: { id },
    data: {
      status: TIMER_STATUS.PAUSED,
      pausedAt: now,
      elapsedSeconds: elapsed,
    },
  });

  const roundingMinutes = await getRoundingMinutes(row.userId);
  return serializeActiveTimer(updated, now, roundingMinutes);
}

export async function resumeTimer(
  id: string,
  session: SessionUser,
): Promise<ActiveTimer> {
  const row = await loadOwnedTimer(id, session);

  if (row.status !== TIMER_STATUS.PAUSED || !row.pausedAt) {
    throw new Error("Apenas timers pausados podem ser retomados.");
  }

  const now = new Date();
  const pausedDuration = diffSeconds(now, row.pausedAt);

  const updated = await prisma.timerSession.update({
    where: { id },
    data: {
      status: TIMER_STATUS.RUNNING,
      pausedAt: null,
      resumedAt: now,
      totalPausedSeconds: row.totalPausedSeconds + pausedDuration,
    },
  });

  const roundingMinutes = await getRoundingMinutes(row.userId);
  return serializeActiveTimer(updated, now, roundingMinutes);
}

export async function stopTimer(
  id: string,
  session: SessionUser,
  finalData: TimerStopFormData,
) {
  const row = await loadOwnedTimer(id, session);

  if (!(ACTIVE_TIMER_STATUSES as string[]).includes(row.status)) {
    throw new Error("Este timer já foi finalizado ou cancelado.");
  }

  const parsed = timerStopSchema.parse(finalData);
  const now = new Date();
  const elapsedSeconds = computeElapsedSeconds(row, now);

  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.timeEntry.create({
      data: {
        userId: row.userId,
        date: startOfDay(now),
        task: parsed.task.trim(),
        activity: parsed.activity,
        comment: parsed.comment?.trim() || null,
        hours: parsed.hours,
        status: TIME_ENTRY_STATUS.DRAFT,
      },
    });

    const timer = await tx.timerSession.update({
      where: { id },
      data: {
        status: TIMER_STATUS.STOPPED,
        stoppedAt: now,
        pausedAt: null,
        elapsedSeconds,
        createdTimeEntryId: entry.id,
      },
    });

    return { entry, timer };
  });

  return { ...result, elapsedSeconds };
}

export async function cancelTimer(id: string, session: SessionUser) {
  const row = await loadOwnedTimer(id, session);

  if (!(ACTIVE_TIMER_STATUSES as string[]).includes(row.status)) {
    throw new Error("Este timer já foi finalizado ou cancelado.");
  }

  const now = new Date();
  const elapsedSeconds = computeElapsedSeconds(row, now);

  return prisma.timerSession.update({
    where: { id },
    data: {
      status: TIMER_STATUS.CANCELED,
      stoppedAt: now,
      pausedAt: null,
      elapsedSeconds,
    },
  });
}

export async function getTimerHistory(
  userId: string,
  limit = TIMER_HISTORY_LIMIT,
): Promise<TimerHistoryItem[]> {
  const rows = await prisma.timerSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    task: row.task,
    activity: row.activity,
    comment: row.comment,
    status: row.status,
    startedAt: row.startedAt.toISOString(),
    stoppedAt: row.stoppedAt ? row.stoppedAt.toISOString() : null,
    elapsedSeconds: row.elapsedSeconds,
    createdTimeEntryId: row.createdTimeEntryId,
  }));
}
