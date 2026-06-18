"use server";

import { revalidatePath } from "next/cache";

import { requireAuth, type SessionUser } from "@/lib/auth";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit/constants";
import { createAuditLog } from "@/lib/services/audit.service";
import {
  cancelTimer,
  getActiveTimer,
  getTimerHistory,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
} from "@/lib/services/timer";
import type { AuditAction } from "@/lib/audit/constants";
import type { TimerStartFormData, TimerStopFormData } from "@/lib/validations";

function actorFrom(session: SessionUser) {
  return { id: session.userId, name: session.name, email: session.email };
}

function revalidateTimer() {
  revalidatePath("/timer");
  revalidatePath("/dashboard");
}

async function logTimerEvent(
  action: AuditAction,
  session: SessionUser,
  entityId: string,
  description: string,
  data?: unknown,
) {
  await createAuditLog({
    action,
    entityType: AUDIT_ENTITIES.TIMER,
    entityId,
    description,
    newData: data,
    user: actorFrom(session),
  });
}

export async function getActiveTimerAction() {
  const session = await requireAuth();
  return getActiveTimer(session.userId);
}

export async function getTimerHistoryAction() {
  const session = await requireAuth();
  return getTimerHistory(session.userId);
}

export async function startTimerAction(data: TimerStartFormData) {
  try {
    const session = await requireAuth();
    const existing = await getActiveTimer(session.userId);

    if (existing) {
      return {
        success: false as const,
        code: "ACTIVE_TIMER_EXISTS" as const,
        activeTimer: existing,
        error: "Você já possui um timer em andamento.",
      };
    }

    const timer = await startTimer(session.userId, data);
    revalidateTimer();

    await logTimerEvent(
      AUDIT_ACTIONS.TIMER_START,
      session,
      timer.id,
      `Timer iniciado: ${timer.task} (${timer.activity}).`,
      { task: timer.task, activity: timer.activity },
    );

    return { success: true as const, timer };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao iniciar o timer.",
    };
  }
}

export async function pauseTimerAction(id: string) {
  try {
    const session = await requireAuth();
    const timer = await pauseTimer(id, session);
    revalidateTimer();

    await logTimerEvent(
      AUDIT_ACTIONS.TIMER_PAUSE,
      session,
      timer.id,
      `Timer pausado: ${timer.task}.`,
    );

    return { success: true as const, timer };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao pausar o timer.",
    };
  }
}

export async function resumeTimerAction(id: string) {
  try {
    const session = await requireAuth();
    const timer = await resumeTimer(id, session);
    revalidateTimer();

    await logTimerEvent(
      AUDIT_ACTIONS.TIMER_RESUME,
      session,
      timer.id,
      `Timer retomado: ${timer.task}.`,
    );

    return { success: true as const, timer };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao retomar o timer.",
    };
  }
}

export async function stopTimerAction(
  id: string,
  finalData: TimerStopFormData,
) {
  try {
    const session = await requireAuth();
    const { entry, elapsedSeconds } = await stopTimer(id, session, finalData);

    revalidateTimer();
    revalidatePath("/registros");
    revalidatePath("/banco-horas");

    await logTimerEvent(
      AUDIT_ACTIONS.TIMER_STOP,
      session,
      id,
      `Timer finalizado: ${entry.task}.`,
      { elapsedSeconds, hours: entry.hours },
    );

    await createAuditLog({
      action: AUDIT_ACTIONS.TIME_ENTRY_CREATE_FROM_TIMER,
      entityType: AUDIT_ENTITIES.TIME_ENTRY,
      entityId: entry.id,
      description: `Registro criado via timer: ${entry.task} (${entry.hours}h).`,
      newData: {
        task: entry.task,
        activity: entry.activity,
        hours: entry.hours,
        comment: entry.comment,
      },
      user: actorFrom(session),
    });

    return {
      success: true as const,
      entryId: entry.id,
      message: "Registro criado a partir do timer.",
    };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Erro ao finalizar o timer.",
    };
  }
}

export async function cancelTimerAction(id: string) {
  try {
    const session = await requireAuth();
    const timer = await cancelTimer(id, session);
    revalidateTimer();

    await logTimerEvent(
      AUDIT_ACTIONS.TIMER_CANCEL,
      session,
      timer.id,
      `Timer cancelado: ${timer.task}.`,
    );

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao cancelar o timer.",
    };
  }
}
