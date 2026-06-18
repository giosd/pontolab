"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";
import { AUDIT_ENTITIES } from "@/lib/audit/constants";
import {
  logApprove,
  logBulkAction,
  logReject,
  logReopen,
  logSubmit,
} from "@/lib/services/audit.service";
import {
  approveTimeEntries,
  approveTimeEntry,
  rejectTimeEntries,
  rejectTimeEntry,
  reopenTimeEntries,
  reopenTimeEntry,
  submitTimeEntries,
  submitTimeEntry,
} from "@/lib/services/time-entry-approval";
import { createNotification } from "@/lib/services/notification.service";
import { NOTIFICATION_TYPES } from "@/lib/notifications/constants";
import { prisma } from "@/lib/prisma";

async function notifyEntryOwners(
  ids: string[],
  type: (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES],
  title: string,
  buildMessage: (task: string) => string,
) {
  if (ids.length === 0) return;

  const entries = await prisma.timeEntry.findMany({
    where: { id: { in: ids } },
    select: { userId: true, task: true },
  });

  await Promise.all(
    entries.map((entry) =>
      createNotification({
        userId: entry.userId,
        type,
        title,
        message: buildMessage(entry.task),
      }),
    ),
  );
}

function actorFrom(session: { userId: string; name: string; email: string }) {
  return { id: session.userId, name: session.name, email: session.email };
}

function statusSnapshot(entry: {
  id: string;
  task: string;
  status: string;
  userId: string;
  user?: { name: string } | null;
  rejectionReason?: string | null;
}) {
  return {
    id: entry.id,
    task: entry.task,
    status: entry.status,
    userId: entry.userId,
    userName: entry.user?.name ?? null,
    rejectionReason: entry.rejectionReason ?? null,
  };
}

async function loadSnapshot(id: string) {
  const entry = await prisma.timeEntry.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });

  return entry ? statusSnapshot(entry) : null;
}

function revalidateApproval() {
  revalidatePath("/registros");
  revalidatePath("/dashboard");
}

export async function submitTimeEntryAction(id: string) {
  try {
    const session = await requireAuth();
    const before = await loadSnapshot(id);
    const entry = await submitTimeEntry(id, session);
    revalidateApproval();

    await logSubmit(AUDIT_ENTITIES.TIME_ENTRY, {
      entityId: entry.id,
      description: `Registro "${entry.task}" enviado para aprovação.`,
      oldData: before,
      newData: statusSnapshot(entry),
      user: actorFrom(session),
    });

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Erro ao enviar registro",
    };
  }
}

export async function approveTimeEntryAction(id: string) {
  try {
    const session = await requireAuth();
    const before = await loadSnapshot(id);
    const entry = await approveTimeEntry(id, session);
    revalidateApproval();

    await logApprove(AUDIT_ENTITIES.TIME_ENTRY, {
      entityId: entry.id,
      description: `Registro "${entry.task}" aprovado.`,
      oldData: before,
      newData: statusSnapshot(entry),
      user: actorFrom(session),
    });

    await createNotification({
      userId: entry.userId,
      type: NOTIFICATION_TYPES.APPROVAL,
      title: "Registro aprovado",
      message: `Seu registro "${entry.task}" foi aprovado.`,
    });

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Erro ao aprovar registro",
    };
  }
}

export async function rejectTimeEntryAction(id: string, reason: string) {
  try {
    const session = await requireAuth();
    const before = await loadSnapshot(id);
    const entry = await rejectTimeEntry(id, reason, session);
    revalidateApproval();

    await logReject(AUDIT_ENTITIES.TIME_ENTRY, {
      entityId: entry.id,
      description: `Registro "${entry.task}" rejeitado.`,
      oldData: before,
      newData: statusSnapshot(entry),
      user: actorFrom(session),
    });

    await createNotification({
      userId: entry.userId,
      type: NOTIFICATION_TYPES.REJECTION,
      title: "Registro rejeitado",
      message: `Seu registro "${entry.task}" foi rejeitado. Motivo: ${reason.trim()}`,
    });

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Erro ao rejeitar registro",
    };
  }
}

export async function reopenTimeEntryAction(id: string, reason: string) {
  try {
    const session = await requireAuth();
    const before = await loadSnapshot(id);
    const entry = await reopenTimeEntry(id, reason, session);
    revalidateApproval();

    await logReopen(AUDIT_ENTITIES.TIME_ENTRY, {
      entityId: entry.id,
      description: `Registro "${entry.task}" reaberto.`,
      oldData: before,
      newData: statusSnapshot(entry),
      user: actorFrom(session),
    });

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Erro ao reabrir registro",
    };
  }
}

async function logBulk(
  session: { userId: string; name: string; email: string },
  operation: string,
  description: string,
  result: { updatedCount: number; updatedIds: string[]; errors: unknown[] },
  extra?: Record<string, unknown>,
) {
  await logBulkAction(AUDIT_ENTITIES.TIME_ENTRY, {
    description,
    newData: {
      operation,
      updatedCount: result.updatedCount,
      updatedIds: result.updatedIds,
      failed: result.errors.length,
      ...extra,
    },
    user: actorFrom(session),
  });
}

export async function submitTimeEntriesAction(ids: string[]) {
  try {
    const session = await requireAuth();
    const result = await submitTimeEntries(ids, session);
    revalidateApproval();

    await logBulk(
      session,
      "BULK_SUBMIT",
      `${result.updatedCount} registro(s) enviado(s) para aprovação.`,
      result,
    );

    return { success: true as const, updatedCount: result.updatedCount };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao enviar registros",
    };
  }
}

export async function approveTimeEntriesAction(ids: string[]) {
  try {
    const session = await requireAuth();
    const result = await approveTimeEntries(ids, session);
    revalidateApproval();

    await logBulk(
      session,
      "BULK_APPROVE",
      `${result.updatedCount} registro(s) aprovado(s).`,
      result,
    );

    await notifyEntryOwners(
      result.updatedIds,
      NOTIFICATION_TYPES.APPROVAL,
      "Registro aprovado",
      (task) => `Seu registro "${task}" foi aprovado.`,
    );

    return { success: true as const, updatedCount: result.updatedCount };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao aprovar registros",
    };
  }
}

export async function rejectTimeEntriesAction(ids: string[], reason: string) {
  try {
    const session = await requireAuth();
    const result = await rejectTimeEntries(ids, reason, session);
    revalidateApproval();

    await logBulk(
      session,
      "BULK_REJECT",
      `${result.updatedCount} registro(s) rejeitado(s).`,
      result,
      { reason: reason.trim() },
    );

    await notifyEntryOwners(
      result.updatedIds,
      NOTIFICATION_TYPES.REJECTION,
      "Registro rejeitado",
      (task) => `Seu registro "${task}" foi rejeitado. Motivo: ${reason.trim()}`,
    );

    return { success: true as const, updatedCount: result.updatedCount };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao rejeitar registros",
    };
  }
}

export async function reopenTimeEntriesAction(ids: string[], reason: string) {
  try {
    const session = await requireAuth();
    const result = await reopenTimeEntries(ids, reason, session);
    revalidateApproval();

    await logBulk(
      session,
      "BULK_REOPEN",
      `${result.updatedCount} registro(s) reaberto(s).`,
      result,
      { reason: reason.trim() },
    );

    return { success: true as const, updatedCount: result.updatedCount };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao reabrir registros",
    };
  }
}
